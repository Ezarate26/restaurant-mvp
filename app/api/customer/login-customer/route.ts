import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { upsertCustomerRestaurantVisit } from '@/lib/server/customer-restaurants';
import {
  clearEmailBindingsForAllSessionUsersInSession,
  releaseDuplicateEmailsInSameSession,
  releaseUsernameCollisionGlobally,
} from '@/lib/server/session-users-email-dedupe';
import { archiveOtherSessionUsersForLinkedCustomer } from '@/lib/server/session-users-global-release';
import { getOrCreateActiveSessionForPoint } from '@/lib/model/service-sessions.repository';
import type { ServicePoint, ServiceSession } from '@/lib/model/types';

export const runtime = 'nodejs';

type Body = {
  sessionUserId?: string;
  sessionId?: string;
  restaurantId?: string;
  /** Bootstrap: sin participante previo en cliente */
  servicePointId?: string;
  preferredSessionId?: string | null;
  language?: string | null;
  email?: string | null;
  password?: string | null;
  /** Identificador estable del navegador (mismo que `session_users.device_id`). */
  deviceId?: string | null;
};

function normEmail(v: string | null | undefined): string | null {
  const t = (v ?? '').trim().toLowerCase();
  return t || null;
}

/** Postgres acepta UUID en varias formas; en JS hay que normalizar antes de comparar. */
function normUuid(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

async function insertBootstrapSessionUser(
  admin: ReturnType<typeof createSupabaseAdmin>,
  row: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const tryInsert = async (patch: Record<string, unknown>) => {
    const { data, error } = await admin
      .from('session_users')
      .insert([patch])
      .select('*')
      .single();
    return {
      data: data as Record<string, unknown> | null,
      error,
    };
  };

  let { data, error } = await tryInsert(row);

  if (
    error &&
    /is_active|schema cache|column/i.test(error.message ?? '')
  ) {
    const { is_active: _skip, ...rest } = row as Record<string, unknown> & {
      is_active?: boolean;
    };
    ({ data, error } = await tryInsert(rest));
  }

  const deviceId = row.device_id as string | undefined;
  const sessionId = row.session_id as string | undefined;

  if (error?.code === '23505' && deviceId && sessionId) {
    const { data: raced } = await admin
      .from('session_users')
      .select('*')
      .eq('session_id', sessionId)
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .maybeSingle();
    if (raced) return { data: raced as Record<string, unknown>, error: null };
  }

  return { data, error };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const sessionUserId = body.sessionUserId?.trim();
    const sessionId = body.sessionId?.trim();
    const restaurantId = body.restaurantId?.trim();
    const servicePointId = body.servicePointId?.trim();
    const preferredSessionId = body.preferredSessionId?.trim() || null;
    const languageHint = (body.language ?? '').trim() || null;
    const email = normEmail(body.email ?? undefined);
    const password = body.password ?? '';
    const deviceId = body.deviceId?.trim() || null;

    if (!restaurantId || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan datos de inicio de sesión' },
        { status: 400 }
      );
    }

    const linked = Boolean(sessionUserId && sessionId);
    const bootstrap = Boolean(servicePointId && !linked);

    if (!linked && !bootstrap) {
      return NextResponse.json(
        {
          error:
            'Faltan datos de la mesa o del participante para iniciar sesión',
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    const { data: customer, error: cErr } = await admin
      .from('customers')
      .select('id, email, username, full_name, password_hash, languages')
      .eq('email', email)
      .maybeSingle();

    if (cErr || !customer?.password_hash) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, customer.password_hash as string);
    if (!ok) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const displayName =
      (customer.full_name ?? '').trim() ||
      (email.split('@')[0] ?? '').trim() ||
      'Cliente';

    const usernameTrim = (customer.username ?? '').trim();
    const langs = (customer as { languages?: string[] | null }).languages;
    const primaryLang =
      languageHint ||
      (Array.isArray(langs)
        ? langs.find((c) => typeof c === 'string' && c.trim())?.trim()
        : undefined) ||
      'es';

    const customerEmailNorm = ((customer.email ?? email) as string).trim().toLowerCase();

    if (linked && sessionId && sessionUserId) {
      const { data: sess, error: sErr } = await admin
        .from('service_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (sErr || !sess) {
        return NextResponse.json({ error: 'Sesión no válida' }, { status: 400 });
      }

      if (sess.status !== 'active') {
        return NextResponse.json(
          {
            error:
              'Esta conversación ya finalizó. Escanea el QR de nuevo para una sesión nueva e inicia sesión ahí.',
          },
          { status: 400 }
        );
      }

      if (normUuid(sess.restaurant_id as string) !== normUuid(restaurantId)) {
        return NextResponse.json({ error: 'Sesión no válida' }, { status: 400 });
      }

      const { data: suRow, error: uErr } = await admin
        .from('session_users')
        .select('id, session_id')
        .eq('id', sessionUserId)
        .maybeSingle();

      if (uErr || !suRow) {
        return NextResponse.json(
          { error: 'Participante no válido' },
          { status: 400 }
        );
      }

      if (normUuid(suRow.session_id as string) !== normUuid(sessionId)) {
        return NextResponse.json(
          { error: 'Participante no válido' },
          { status: 400 }
        );
      }

      const { error: dupClearErr } = await releaseDuplicateEmailsInSameSession(
        admin,
        sessionId,
        sessionUserId,
        customerEmailNorm
      );
      if (dupClearErr) {
        console.error('login-customer:clear-dup-email', dupClearErr);
        return NextResponse.json(
          {
            error: 'No se pudo preparar la sesión para vincular tu cuenta',
            detail: dupClearErr.message,
          },
          { status: 500 }
        );
      }

      if (usernameTrim.length > 0) {
        const { error: unErr } = await releaseUsernameCollisionGlobally(
          admin,
          usernameTrim,
          sessionUserId
        );
        if (unErr) {
          console.error('login-customer:release-username', unErr);
          return NextResponse.json(
            {
              error: 'No se pudo preparar la sesión para vincular tu cuenta',
              detail: unErr.message,
            },
            { status: 500 }
          );
        }
      }

      const { data: updated, error: upErr } = await admin
        .from('session_users')
        .update({
          customer_id: customer.id,
          display_name: displayName,
          username: usernameTrim || null,
          email: (customer.email ?? email).trim(),
          is_profile_completed: true,
          registration_invited: false,
        })
        .eq('id', sessionUserId)
        .select('*')
        .maybeSingle();

      if (upErr) {
        console.error('login-customer:update', upErr);
        return NextResponse.json(
          {
            error: 'No se pudo vincular la sesión',
            detail: upErr.message,
            code: upErr.code,
          },
          { status: 500 }
        );
      }

      if (!updated) {
        console.error(
          'login-customer:update',
          '0 rows — session_user missing or id mismatch'
        );
        return NextResponse.json(
          {
            error: 'No se pudo vincular la sesión',
            detail:
              'No se actualizó ninguna fila (¿sessionUserId correcto o ya cerraste la sesión?)',
          },
          { status: 500 }
        );
      }

      const { error: ghostErr } = await archiveOtherSessionUsersForLinkedCustomer(
        admin,
        {
          email: customerEmailNorm,
          deviceId,
          keepSessionUserId: sessionUserId,
        }
      );
      if (ghostErr) {
        console.error('login-customer:archive-ghosts', ghostErr);
      }

      try {
        await upsertCustomerRestaurantVisit(
          admin,
          customer.id as string,
          sess.restaurant_id as string
        );
      } catch (visitErr) {
        console.error('login-customer:visit', visitErr);
      }

      return NextResponse.json({
        session: sess,
        sessionUser: updated,
        customer: {
          id: customer.id,
          email: customer.email,
          full_name: customer.full_name,
          username: customer.username,
          languages: Array.isArray(langs) ? langs : undefined,
        },
      });
    }

    /* ---------- Bootstrap: credenciales válidas → sesión + participante ---------- */

    const { data: pointRow, error: pErr } = await admin
      .from('service_points')
      .select('*')
      .eq('id', servicePointId!)
      .maybeSingle();

    if (pErr || !pointRow) {
      return NextResponse.json({ error: 'Punto de servicio no válido' }, { status: 400 });
    }

    const point = pointRow as ServicePoint;

    if (normUuid(point.restaurant_id) !== normUuid(restaurantId)) {
      return NextResponse.json({ error: 'Punto de servicio no válido' }, { status: 400 });
    }

    let sess: ServiceSession | null = null;

    if (preferredSessionId) {
      const { data: pref, error: prefErr } = await admin
        .from('service_sessions')
        .select('*')
        .eq('id', preferredSessionId)
        .maybeSingle();
      if (
        !prefErr &&
        pref &&
        pref.status === 'active' &&
        normUuid(pref.service_point_id as string) === normUuid(point.id)
      ) {
        sess = pref as ServiceSession;
      }
    }

    if (!sess) {
      sess = await getOrCreateActiveSessionForPoint(admin, point, primaryLang);
    }

    if (!deviceId) {
      return NextResponse.json(
        {
          error:
            'No se pudo identificar tu dispositivo. Recarga la página o permite almacenamiento local.',
        },
        { status: 400 }
      );
    }

    const { data: byDevice } = await admin
      .from('session_users')
      .select('*')
      .eq('session_id', sess.id)
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .maybeSingle();

    let existing = byDevice as Record<string, unknown> | null;

    if (!existing) {
      const { data: byIdent } = await admin
        .from('session_users')
        .select('*')
        .eq('session_id', sess.id)
        .eq('user_identifier', deviceId)
        .eq('status', 'active')
        .maybeSingle();
      existing = byIdent as Record<string, unknown> | null;
    }

    if (existing?.customer_id) {
      const cid = normUuid(existing.customer_id as string);
      if (cid && cid !== normUuid(customer.id as string)) {
        return NextResponse.json(
          {
            error:
              'Este dispositivo ya está conectado con otra cuenta en esta mesa. Cierra sesión o usa otro navegador.',
          },
          { status: 409 }
        );
      }
    }

    let sessionUserOut: Record<string, unknown>;

    if (existing?.id) {
      const keepId = existing.id as string;

      const { error: dupClearErr } = await releaseDuplicateEmailsInSameSession(
        admin,
        sess.id,
        keepId,
        customerEmailNorm
      );
      if (dupClearErr) {
        console.error('login-customer:bootstrap-clear-dup-email', dupClearErr);
        return NextResponse.json(
          {
            error: 'No se pudo preparar la sesión para vincular tu cuenta',
            detail: dupClearErr.message,
          },
          { status: 500 }
        );
      }

      if (usernameTrim.length > 0) {
        const { error: unErr } = await releaseUsernameCollisionGlobally(
          admin,
          usernameTrim,
          keepId
        );
        if (unErr) {
          console.error('login-customer:bootstrap-release-username', unErr);
          return NextResponse.json(
            {
              error: 'No se pudo preparar la sesión para vincular tu cuenta',
              detail: unErr.message,
            },
            { status: 500 }
          );
        }
      }

      const updatePayload: Record<string, unknown> = {
        customer_id: customer.id,
        display_name: displayName,
        username: usernameTrim || null,
        email: (customer.email ?? email).trim(),
        is_profile_completed: true,
        registration_invited: false,
        language: primaryLang,
        device_id: deviceId,
        user_identifier: deviceId,
        status: 'active',
      };

      const { data: updated, error: upErr } = await admin
        .from('session_users')
        .update(updatePayload)
        .eq('id', keepId)
        .select('*')
        .maybeSingle();

      if (upErr || !updated) {
        console.error('login-customer:bootstrap-update', upErr);
        return NextResponse.json(
          {
            error: 'No se pudo vincular la sesión',
            detail: upErr?.message ?? 'Sin fila actualizada',
            code: upErr?.code,
          },
          { status: 500 }
        );
      }
      sessionUserOut = updated as Record<string, unknown>;
    } else {
      const { error: emClearErr } =
        await clearEmailBindingsForAllSessionUsersInSession(
          admin,
          sess.id,
          customerEmailNorm
        );
      if (emClearErr) {
        console.error('login-customer:bootstrap-clear-email', emClearErr);
        return NextResponse.json(
          {
            error: 'No se pudo preparar la sesión para vincular tu cuenta',
            detail: emClearErr.message,
          },
          { status: 500 }
        );
      }

      if (usernameTrim.length > 0) {
        const { error: unErr } = await releaseUsernameCollisionGlobally(
          admin,
          usernameTrim,
          null
        );
        if (unErr) {
          console.error('login-customer:bootstrap-release-username-insert', unErr);
          return NextResponse.json(
            {
              error: 'No se pudo preparar la sesión para vincular tu cuenta',
              detail: unErr.message,
            },
            { status: 500 }
          );
        }
      }

      const row: Record<string, unknown> = {
        session_id: sess.id,
        user_identifier: deviceId,
        device_id: deviceId,
        email: (customer.email ?? email).trim(),
        username: usernameTrim || null,
        display_name: displayName,
        customer_id: customer.id,
        is_profile_completed: true,
        registration_invited: false,
        language: primaryLang,
        status: 'active',
        is_active: true,
      };

      const { data: inserted, error: insErr } =
        await insertBootstrapSessionUser(admin, row);

      if (insErr || !inserted) {
        console.error('login-customer:bootstrap-insert', insErr);
        return NextResponse.json(
          {
            error: 'No se pudo vincular la sesión',
            detail: insErr?.message ?? 'Insert fallido',
            code: insErr?.code,
          },
          { status: 500 }
        );
      }
      sessionUserOut = inserted;
    }

    const keptId = sessionUserOut.id as string;

    const { error: ghostErr } = await archiveOtherSessionUsersForLinkedCustomer(
      admin,
      {
        email: customerEmailNorm,
        deviceId,
        keepSessionUserId: keptId,
      }
    );
    if (ghostErr) {
      console.error('login-customer:bootstrap-archive-ghosts', ghostErr);
    }

    try {
      await upsertCustomerRestaurantVisit(
        admin,
        customer.id as string,
        sess.restaurant_id as string
      );
    } catch (visitErr) {
      console.error('login-customer:bootstrap-visit', visitErr);
    }

    return NextResponse.json({
      session: sess,
      sessionUser: sessionUserOut,
      customer: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        username: customer.username,
        languages: Array.isArray(langs) ? langs : undefined,
      },
    });
  } catch (e) {
    console.error('login-customer', e);
    const isJson =
      e instanceof SyntaxError ||
      (e instanceof Error && /JSON|Unexpected end/i.test(e.message));
    return NextResponse.json(
      {
        error: isJson
          ? 'Cuerpo JSON inválido o vacío'
          : 'Solicitud inválida',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 400 }
    );
  }
}
