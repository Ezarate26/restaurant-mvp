import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessMode,
  Restaurant,
  ServicePoint,
} from './types';
import { insertServicePoints } from './service-points.repository';

export async function fetchRestaurantByInviteCode(
  client: SupabaseClient,
  inviteCode: string
): Promise<Restaurant | null> {
  const { data, error } = await client
    .from('restaurants')
    .select('*')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error) {
    console.error('fetchRestaurantByInviteCode', error);
    return null;
  }
  return (data as Restaurant) ?? null;
}

export async function fetchRestaurantById(
  client: SupabaseClient,
  restaurantId: string
): Promise<Restaurant | null> {
  const { data, error } = await client
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .maybeSingle();

  if (error) {
    console.error('fetchRestaurantById', error);
    return null;
  }
  return (data as Restaurant) ?? null;
}

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

export interface CreateRestaurantInput {
  basics: {
    name: string;
    owner_name: string;
    email: string;
    phone: string;
  };
  address: string;
  businessMode: BusinessMode;
  /** Cantidad de mesas a sembrar para multi_table / hybrid. Default 4. */
  tablesCount?: number;
  /** Idioma por defecto. Default 'es'. */
  defaultLanguage?: string;
  /** Usuario Auth propietario (`restaurants.owner_id`). */
  ownerUserId: string;
}

export interface CreateRestaurantResult {
  restaurantId: string;
  inviteCode: string;
  servicePoints: ServicePoint[];
  /** true si la edge function de email respondió OK; false si falló (no bloquea). */
  inviteEmailSent: boolean;
  inviteEmailError?: string;
}

const EMAIL_INVITE_FUNCTION = 'email-invite-code-restaurant';

/**
 * Envío best-effort del código por email. No lanza: cualquier error se reporta
 * en el resultado y el wizard sigue mostrando el código en pantalla.
 */
async function sendInviteCodeEmail(
  client: SupabaseClient,
  payload: {
    email: string;
    owner_name: string;
    restaurant_name: string;
    invite_code: string;
    restaurant_id: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await client.functions.invoke(EMAIL_INVITE_FUNCTION, {
      body: payload,
    });
    if (error) {
      console.error('sendInviteCodeEmail', error);
      return { ok: false, error: error.message ?? 'Email function error' };
    }
    return { ok: true };
  } catch (e) {
    console.error('sendInviteCodeEmail:exception', e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Email function exception',
    };
  }
}

/**
 * Crea restaurant + restaurant_settings + service_points seed en una secuencia.
 * No es transaccional (Supabase JS no expone tx multi-tabla por REST), pero
 * cualquier fallo intermedio se reporta arriba y no se intenta rollback manual:
 * el operador puede reintentar con otro código.
 */
export async function createRestaurantWithSettingsAndPoints(
  client: SupabaseClient,
  input: CreateRestaurantInput
): Promise<CreateRestaurantResult> {
  const inviteCode = generateInviteCode();

  const { data: restRow, error: restErr } = await client
    .from('restaurants')
    .insert([
      {
        name: input.basics.name,
        owner_name: input.basics.owner_name,
        email: input.basics.email,
        phone: input.basics.phone,
        address: input.address,
        business_mode: input.businessMode,
        invite_code: inviteCode,
        owner_id: input.ownerUserId,
      },
    ])
    .select('*')
    .single();

  if (restErr || !restRow) {
    console.error('createRestaurant', restErr);
    throw restErr ?? new Error('No se pudo crear el restaurante');
  }

  const restaurant = restRow as Restaurant;

  const { error: settErr } = await client.from('restaurant_settings').insert([
    {
      restaurant_id: restaurant.id,
      allow_tables:
        input.businessMode === 'multi_table' ||
        input.businessMode === 'hybrid',
      allow_walkins:
        input.businessMode === 'single_point' ||
        input.businessMode === 'hybrid',
      default_language: input.defaultLanguage ?? 'es',
    },
  ]);

  if (settErr) {
    console.error('createRestaurantSettings', settErr);
    throw settErr;
  }

  const tablesCount = Math.max(1, input.tablesCount ?? 4);
  const seedRows = buildSeedServicePoints(
    restaurant.id,
    input.businessMode,
    tablesCount
  );
  const points = await insertServicePoints(client, seedRows);

  const emailResult = await sendInviteCodeEmail(client, {
    email: input.basics.email,
    owner_name: input.basics.owner_name,
    restaurant_name: input.basics.name,
    invite_code: inviteCode,
    restaurant_id: restaurant.id,
  });

  return {
    restaurantId: restaurant.id,
    inviteCode,
    servicePoints: points,
    inviteEmailSent: emailResult.ok,
    inviteEmailError: emailResult.error,
  };
}

function buildSeedServicePoints(
  restaurantId: string,
  mode: BusinessMode,
  tablesCount: number
) {
  const rows: {
    restaurant_id: string;
    name: string;
    type: string;
  }[] = [];

  if (mode === 'multi_table' || mode === 'hybrid') {
    for (let i = 1; i <= tablesCount; i += 1) {
      rows.push({
        restaurant_id: restaurantId,
        name: `Mesa ${i}`,
        type: 'table',
      });
    }
  }
  if (mode === 'single_point' || mode === 'hybrid') {
    rows.push({
      restaurant_id: restaurantId,
      name: mode === 'single_point' ? 'Punto principal' : 'Mostrador',
      type: 'counter',
    });
  }
  return rows;
}
