import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { closeSessionForEveryone } from '@/lib/model/service-sessions.repository';

export const runtime = 'nodejs';

type Body = {
  sessionId?: string;
  sessionUserId?: string;
  restaurantId?: string;
};

function normUuid(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

/**
 * Cierra la sesión de mesa como el cliente anónimo no suele tener permisos RLS para
 * `service_sessions` / `session_users`: usa service role (misma lógica que mesero).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const sessionId = body.sessionId?.trim();
    const sessionUserId = body.sessionUserId?.trim();
    const restaurantId = body.restaurantId?.trim();

    if (!sessionId || !sessionUserId || !restaurantId) {
      return NextResponse.json(
        { error: 'Faltan datos para cerrar la sesión' },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    const { data: sess, error: sErr } = await admin
      .from('service_sessions')
      .select('id, restaurant_id, status')
      .eq('id', sessionId)
      .maybeSingle();

    if (sErr || !sess) {
      return NextResponse.json({ error: 'Sesión no válida' }, { status: 400 });
    }

    if (sess.status !== 'active') {
      return NextResponse.json({
        ok: true,
        alreadyClosed: true,
      });
    }

    if (normUuid(sess.restaurant_id as string) !== normUuid(restaurantId)) {
      return NextResponse.json({ error: 'Sesión no válida' }, { status: 400 });
    }

    const { data: suRow, error: uErr } = await admin
      .from('session_users')
      .select('id, session_id, status')
      .eq('id', sessionUserId)
      .maybeSingle();

    if (uErr || !suRow) {
      return NextResponse.json({ error: 'Participante no válido' }, { status: 400 });
    }

    if (normUuid(suRow.session_id as string) !== normUuid(sessionId)) {
      return NextResponse.json({ error: 'Participante no válido' }, { status: 400 });
    }

    if (suRow.status === 'left') {
      return NextResponse.json({ ok: true, alreadyLeft: true });
    }

    await closeSessionForEveryone(admin, sessionId, 'closed_by_participant');

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('close-session', e);
    const isJson =
      e instanceof SyntaxError ||
      (e instanceof Error && /JSON|Unexpected end/i.test(e.message));
    return NextResponse.json(
      {
        error: isJson
          ? 'Cuerpo JSON inválido o vacío'
          : 'No se pudo cerrar la sesión',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 400 }
    );
  }
}
