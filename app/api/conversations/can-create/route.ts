import { NextResponse } from 'next/server';
import { getFreeCreateEligibility } from '@/lib/billing/free-daily-limit.server';
import { getUserIdFromRequest } from '@/lib/billing/server-auth';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId')?.trim() || null;
  const userId = (await getUserIdFromRequest(request)) ?? null;

  if (!userId && !deviceId) {
    return NextResponse.json(
      { error: 'deviceId o sesión requeridos' },
      { status: 400 }
    );
  }

  try {
    const service = createSupabaseServiceRole();
    const eligibility = await getFreeCreateEligibility(service, {
      userId,
      deviceId,
    });
    return NextResponse.json(eligibility);
  } catch (e) {
    console.error('GET /api/conversations/can-create', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al consultar límite' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    deviceId?: string;
  };
  const deviceId = body.deviceId?.trim() || null;
  const userId = (await getUserIdFromRequest(request)) ?? null;

  if (!userId && !deviceId) {
    return NextResponse.json(
      { error: 'deviceId o sesión requeridos' },
      { status: 400 }
    );
  }

  try {
    const service = createSupabaseServiceRole();
    const eligibility = await getFreeCreateEligibility(service, {
      userId,
      deviceId,
    });

    if (!eligibility.unlimited && !eligibility.canCreate) {
      return NextResponse.json(
        { allowed: false, ...eligibility },
        { status: 429 }
      );
    }

    return NextResponse.json({ allowed: true, ...eligibility });
  } catch (e) {
    console.error('POST /api/conversations/can-create', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al validar límite' },
      { status: 500 }
    );
  }
}
