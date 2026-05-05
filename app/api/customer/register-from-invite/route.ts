import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { upsertCustomerRestaurantVisit } from '@/lib/server/customer-restaurants';
import type { ActiveTableResumeTarget } from '@/lib/server/session-users-global-release';
import {
  archiveSessionUsersForRegistrationCleanup,
  captureActiveTableResumeFromDevice,
  resolveExplicitResumeSessionOnPoint,
} from '@/lib/server/session-users-global-release';
import { LANGUAGE_CODES } from '@/constants/languages';

export const runtime = 'nodejs';

const ALLOWED_LANG_CODES = LANGUAGE_CODES;

type Body = {
  email?: string | null;
  password?: string | null;
  full_name?: string | null;
  username?: string | null;
  phone?: string | null;
  languages?: string[] | null;
  device_id?: string | null;
  /** Volver al mismo chat tras completar registro (desde query en `/complete-profile`). */
  resume_session_id?: string | null;
  resume_service_point_id?: string | null;
};

function normEmail(v: string | null | undefined): string | null {
  const t = (v ?? '').trim().toLowerCase();
  return t || null;
}

function normalizeLanguages(input: unknown): string[] {
  if (!Array.isArray(input)) return ['es'];
  const out = [
    ...new Set(
      input
        .map((x) => String(x).trim().toLowerCase())
        .filter((c) => ALLOWED_LANG_CODES.has(c))
    ),
  ];
  return out.length > 0 ? out : ['es'];
}

function isMissingPhoneColumn(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('phone') && (m.includes('column') || m.includes('schema'));
}

function isMissingLanguagesColumn(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('languages') && (m.includes('column') || m.includes('schema'));
}

type CustomerRow = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  languages?: string[] | null;
};

function qrResumeUrl(
  servicePointId: string,
  sessionId: string,
  opts?: { openChat?: boolean }
): string {
  const q = new URLSearchParams();
  q.set('session', sessionId);
  if (opts?.openChat) q.set('open_chat', '1');
  return `/qr/${encodeURIComponent(servicePointId)}?${q.toString()}`;
}

async function insertFreshSessionUserForCompletedRegistration(
  admin: SupabaseClient,
  args: {
    sessionId: string;
    deviceId: string;
    customer: CustomerRow;
    primaryLanguage: string;
  }
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const row: Record<string, unknown> = {
    session_id: args.sessionId,
    user_identifier: args.deviceId,
    device_id: args.deviceId,
    email: args.customer.email,
    username: args.customer.username,
    display_name: args.customer.full_name,
    customer_id: args.customer.id,
    is_profile_completed: true,
    registration_invited: false,
    language: args.primaryLanguage,
    status: 'active',
    is_active: true,
  };

  const tryInsert = async (patch: Record<string, unknown>) => {
    const { data, error } = await admin
      .from('session_users')
      .insert([patch])
      .select('*')
      .single();
    return { data: data as Record<string, unknown> | null, error };
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

  if (error?.code === '23505' && args.deviceId) {
    const { data: raced } = await admin
      .from('session_users')
      .select('*')
      .eq('session_id', args.sessionId)
      .eq('device_id', args.deviceId)
      .eq('status', 'active')
      .maybeSingle();
    if (raced) return { data: raced as Record<string, unknown>, error: null };
  }

  return { data, error };
}

async function persistCustomerInviteProfile(
  admin: SupabaseClient,
  args: {
    existingId: string | undefined;
    email: string;
    password_hash: string;
    full_name: string | null;
    username: string | null;
    phone: string | null;
    languages: string[];
  }
): Promise<{ error: { message: string } | null }> {
  const row: Record<string, unknown> = {
    email: args.email,
    password_hash: args.password_hash,
    full_name: args.full_name,
    username: args.username,
    languages: args.languages,
  };
  if (args.phone) row.phone = args.phone;

  for (;;) {
    const q = args.existingId
      ? admin.from('customers').update(row).eq('id', args.existingId)
      : admin.from('customers').insert([row]);
    const { error } = await q;
    if (!error) return { error: null };

    const msg = error.message ?? '';
    if (args.phone && row.phone && isMissingPhoneColumn(msg)) {
      delete row.phone;
      continue;
    }
    if (args.languages.length && row.languages && isMissingLanguagesColumn(msg)) {
      delete row.languages;
      continue;
    }
    return { error };
  }
}

export async function POST(req: Request) {
  try {
    let admin: SupabaseClient;
    try {
      admin = createSupabaseAdmin();
    } catch (e) {
      console.error('register-from-invite:admin', e);
      return NextResponse.json(
        {
          error: 'Servidor no configurado (Supabase admin)',
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as Body;
    const email = normEmail(body.email ?? undefined);
    const password = body.password ?? '';
    const full_name = (body.full_name ?? '').trim() || null;
    const username = (body.username ?? '').trim() || null;
    const phone = (body.phone ?? '').trim() || null;
    const languages = normalizeLanguages(body.languages);
    const device_id = (body.device_id ?? '').trim() || null;
    const resume_session_id = (body.resume_session_id ?? '').trim() || null;
    const resume_service_point_id =
      (body.resume_service_point_id ?? '').trim() || null;

    if (!email || password.length < 8) {
      return NextResponse.json(
        {
          error:
            'Correo obligatorio y contraseña de al menos 8 caracteres.',
        },
        { status: 400 }
      );
    }

    let resumeTarget: ActiveTableResumeTarget | null = null;
    if (resume_session_id && resume_service_point_id) {
      resumeTarget = await resolveExplicitResumeSessionOnPoint(
        admin,
        resume_session_id,
        resume_service_point_id
      );
    }
    if (!resumeTarget && device_id) {
      resumeTarget = await captureActiveTableResumeFromDevice(
        admin,
        device_id
      );
    }

    const { data: existing, error: findErr } = await admin
      .from('customers')
      .select('id, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (findErr) {
      console.error('register-from-invite:find', findErr);
      return NextResponse.json(
        { error: 'No se pudo comprobar la cuenta.' },
        { status: 500 }
      );
    }

    const ALREADY_MSG =
      'Ya tenemos tu correo registrado. Inicia sesión normalmente o continúa como invitado al escanear el QR del restaurante.';

    if (existing?.password_hash) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        message: ALREADY_MSG,
        resumePath: resumeTarget
          ? qrResumeUrl(
              resumeTarget.servicePointId,
              resumeTarget.sessionId
            )
          : '/',
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const { error: writeErr } = await persistCustomerInviteProfile(admin, {
      existingId: existing?.id as string | undefined,
      email,
      password_hash: hash,
      full_name,
      username,
      phone,
      languages,
    });

    if (writeErr) {
      console.error('register-from-invite:write', writeErr);
      return NextResponse.json(
        { error: 'No se pudo guardar. Revisa los datos o el usuario.' },
        { status: 500 }
      );
    }

    const { data: customer, error: loadErr } = await admin
      .from('customers')
      .select('id, email, full_name, username, languages')
      .eq('email', email)
      .single();

    if (loadErr || !customer) {
      console.error('register-from-invite:load-customer', loadErr);
      const fallbackPath =
        resumeTarget && device_id
          ? qrResumeUrl(
              resumeTarget.servicePointId,
              resumeTarget.sessionId
            )
          : '/';
      return NextResponse.json(
        {
          ok: true,
          resumePath: fallbackPath,
          customer: null,
          sessionUser: null,
        },
        { status: 200 }
      );
    }

    const cust = customer as CustomerRow;

    const { error: archErr } = await archiveSessionUsersForRegistrationCleanup(
      admin,
      { email, deviceId: device_id }
    );
    if (archErr) {
      console.error('register-from-invite:archive', archErr);
      return NextResponse.json(
        {
          error:
            'Tu cuenta quedó guardada pero no pudimos sincronizar las mesas. Intenta iniciar sesión desde el chat.',
          detail: archErr.message,
        },
        { status: 500 }
      );
    }

    let resumePath: string | null =
      resumeTarget && device_id
        ? qrResumeUrl(
            resumeTarget.servicePointId,
            resumeTarget.sessionId
          )
        : '/';
    let sessionUserOut: Record<string, unknown> | null = null;

    if (resumeTarget && device_id) {
      const { data: sess, error: sessErr } = await admin
        .from('service_sessions')
        .select('id, status, restaurant_id')
        .eq('id', resumeTarget.sessionId)
        .maybeSingle();

      if (!sessErr && sess?.status === 'active') {
        const primaryLang = languages[0] ?? 'es';
        const { data: inserted, error: insErr } =
          await insertFreshSessionUserForCompletedRegistration(admin, {
            sessionId: resumeTarget.sessionId,
            deviceId: device_id,
            customer: cust,
            primaryLanguage: primaryLang,
          });

        if (insErr) {
          console.error('register-from-invite:insert-session-user', insErr);
        } else if (inserted) {
          sessionUserOut = inserted;
          resumePath = qrResumeUrl(
            resumeTarget.servicePointId,
            resumeTarget.sessionId,
            { openChat: true }
          );
          const rid = (sess.restaurant_id as string)?.trim();
          if (rid) {
            try {
              await upsertCustomerRestaurantVisit(admin, cust.id, rid);
            } catch (e) {
              console.error('register-from-invite:visit', e);
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      resumePath,
      customer: {
        id: cust.id,
        email: cust.email,
        full_name: cust.full_name,
        username: cust.username,
        languages: cust.languages ?? languages,
      },
      sessionUser: sessionUserOut,
    });
  } catch (e) {
    console.error('register-from-invite', e);
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
