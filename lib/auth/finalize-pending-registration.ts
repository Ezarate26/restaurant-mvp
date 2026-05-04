import type { SupabaseClient } from '@supabase/supabase-js';
import {
  readPendingVerifyCredentials,
  readPendingOwnerRestaurant,
  readOwnerDraftRestaurantId,
  saveOwnerDraftRestaurantId,
  clearOwnerDraftRestaurantId,
  clearPendingOwnerRestaurant,
  readPendingWaiterRegistration,
  readWaiterDraftRestaurantId,
  saveWaiterDraftRestaurantId,
  clearWaiterDraftRestaurantId,
  clearPendingWaiterRegistration,
  clearPendingVerifyCredentials,
  clearAllPendingRegistration,
} from '@/lib/auth/pending-registration.storage';
import { createRestaurantWithSettingsAndPoints } from '@/lib/model/restaurants.repository';
import {
  fetchProfileByUserId,
  insertWaiterProfile,
} from '@/lib/model/profiles.repository';
import { fetchRestaurantByInviteCode } from '@/lib/model/restaurants.repository';
import type { ProfileRole } from '@/lib/model/types';
import { normalizeAppLanguage } from '@/lib/model/language-options';

export type FinalizeDashboard = 'owner' | 'waiter';

export type FinalizePendingResult =
  | { ok: true; dashboard: FinalizeDashboard }
  | { ok: false; message: string };

/** Rol staff sin ser owner (dueño vs equipo). */
function isStaffRole(role: string): boolean {
  return role === 'waiter' || role === 'admin';
}

/**
 * Tras Auth válido: crea restaurante/perfil pendientes en sessionStorage o redirige si ya hay perfil.
 */
export async function finalizePendingRegistration(
  client: SupabaseClient,
  userId: string,
  email: string
): Promise<FinalizePendingResult> {
  const existingProfile = await fetchProfileByUserId(client, userId);
  if (existingProfile?.restaurant_id) {
    clearAllPendingRegistration();
    return {
      ok: true,
      dashboard: existingProfile.role === 'owner' ? 'owner' : 'waiter',
    };
  }

  const ownerDraftId = readOwnerDraftRestaurantId();
  const ownerPayload = readPendingOwnerRestaurant();

  if (ownerDraftId) {
    const fullName =
      ownerPayload?.basics.owner_name?.trim() ||
      (typeof email === 'string' ? email.split('@')[0] : 'Propietario');
    const ownerLang = normalizeAppLanguage(ownerPayload?.defaultLanguage);
    const { error: profileErr } = await insertWaiterProfile(client, {
      id: userId,
      email,
      full_name: fullName,
      employee_number: null,
      restaurant_id: ownerDraftId,
      role: 'owner',
      language: ownerLang,
    });
    if (profileErr) {
      console.error('finalize:owner profile retry', profileErr);
      return {
        ok: false,
        message:
          'No se pudo vincular tu perfil. Pulsa Reintentar o contacta soporte.',
      };
    }
    clearAllPendingRegistration();
    return { ok: true, dashboard: 'owner' };
  }

  if (ownerPayload) {
    let restaurantId: string;
    try {
      const created = await createRestaurantWithSettingsAndPoints(client, {
        ...ownerPayload,
        ownerUserId: userId,
      });
      restaurantId = created.restaurantId;
    } catch (e) {
      console.error('finalize:createRestaurant', e);
      return {
        ok: false,
        message:
          'No se pudo crear el restaurante. Pulsa Reintentar cuando tengas conexión.',
      };
    }

    const ownerLang = normalizeAppLanguage(ownerPayload.defaultLanguage);
    const { error: profileErr } = await insertWaiterProfile(client, {
      id: userId,
      email,
      full_name: ownerPayload.basics.owner_name,
      employee_number: null,
      restaurant_id: restaurantId,
      role: 'owner',
      language: ownerLang,
    });

    if (profileErr) {
      console.error('finalize:owner profile', profileErr);
      saveOwnerDraftRestaurantId(restaurantId);
      return {
        ok: false,
        message:
          'Restaurante creado, pero no se pudo vincular tu perfil. Pulsa Reintentar.',
      };
    }

    clearOwnerDraftRestaurantId();
    clearPendingOwnerRestaurant();
    clearPendingVerifyCredentials();
    return { ok: true, dashboard: 'owner' };
  }

  const waiterDraftId = readWaiterDraftRestaurantId();
  const waiterPayload = readPendingWaiterRegistration();

  if (waiterDraftId) {
    const role: ProfileRole = 'waiter';
    const fullName =
      waiterPayload?.fullName?.trim() ||
      (typeof email === 'string' ? email.split('@')[0] : 'Mesero');
    const waiterLang = waiterPayload
      ? waiterPayload.language
      : normalizeAppLanguage(undefined);
    const { error: profileErr } = await insertWaiterProfile(client, {
      id: userId,
      email,
      full_name: fullName,
      employee_number: waiterPayload?.employeeNumber?.trim() || null,
      restaurant_id: waiterDraftId,
      role,
      language: waiterLang,
    });
    if (profileErr) {
      console.error('finalize:waiter profile retry', profileErr);
      return {
        ok: false,
        message: 'No se pudo crear tu perfil de mesero. Pulsa Reintentar.',
      };
    }
    clearWaiterDraftRestaurantId();
    clearPendingWaiterRegistration();
    clearPendingVerifyCredentials();
    return { ok: true, dashboard: 'waiter' };
  }

  if (waiterPayload) {
    const restaurant = await fetchRestaurantByInviteCode(
      client,
      waiterPayload.restaurantCode.trim().toUpperCase()
    );
    if (!restaurant) {
      clearPendingWaiterRegistration();
      clearPendingVerifyCredentials();
      return {
        ok: false,
        message: 'Código de restaurante inválido. Vuelve a registrarte.',
      };
    }

    const role: ProfileRole = 'waiter';

    const waiterLang = waiterPayload.language;
    const { error: profileErr } = await insertWaiterProfile(client, {
      id: userId,
      email,
      full_name: waiterPayload.fullName.trim(),
      employee_number: waiterPayload.employeeNumber?.trim() || null,
      restaurant_id: restaurant.id,
      role,
      language: waiterLang,
    });

    if (profileErr) {
      console.error('finalize:waiter profile', profileErr);
      saveWaiterDraftRestaurantId(restaurant.id);
      return {
        ok: false,
        message:
          'No se pudo crear tu perfil. Pulsa Reintentar o contacta al administrador.',
      };
    }

    clearWaiterDraftRestaurantId();
    clearPendingWaiterRegistration();
    clearPendingVerifyCredentials();
    return { ok: true, dashboard: 'waiter' };
  }

  const profile = await fetchProfileByUserId(client, userId);
  if (!profile?.restaurant_id) {
    clearPendingVerifyCredentials();
    return {
      ok: false,
      message:
        'Tu cuenta no está vinculada a un restaurante. Entra desde /login.',
    };
  }

  clearPendingVerifyCredentials();
  return {
    ok: true,
    dashboard: profile.role === 'owner' ? 'owner' : 'waiter',
  };
}

/** Mensajes de negocio antes de signUp (requiere política RLS que permita leer `profiles.email`). */
export type OwnerEmailPrecheck =
  | { ok: true }
  | { ok: false; message: string };

export async function precheckOwnerSignupEmail(
  client: SupabaseClient,
  email: string
): Promise<OwnerEmailPrecheck> {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('email', email.trim())
    .maybeSingle();

  if (error) {
    console.error('precheckOwnerSignupEmail', error);
    return {
      ok: false,
      message:
        'No se pudo validar el correo. Revisa tu conexión o inténtalo más tarde.',
    };
  }

  const role = data?.role as string | undefined;
  if (!role) return { ok: true };

  if (isStaffRole(role)) {
    return {
      ok: false,
      message: 'Correo ya registrado como mesero',
    };
  }

  if (role === 'owner') {
    return {
      ok: false,
      message:
        'Este correo ya tiene cuenta de propietario. Inicia sesión para crear otro restaurante.',
    };
  }

  return { ok: true };
}

export type WaiterEmailPrecheck =
  | { ok: true }
  | { ok: false; message: string };

export async function precheckWaiterSignupEmail(
  client: SupabaseClient,
  email: string
): Promise<WaiterEmailPrecheck> {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('email', email.trim())
    .maybeSingle();

  if (error) {
    console.error('precheckWaiterSignupEmail', error);
    return {
      ok: false,
      message:
        'No se pudo validar el correo. Revisa tu conexión o inténtalo más tarde.',
    };
  }

  const role = data?.role as string | undefined;
  if (!role) return { ok: true };

  if (role === 'owner') {
    return {
      ok: false,
      message: 'Correo ya registrado como dueño',
    };
  }

  return {
    ok: false,
    message: 'Correo ya está registrado',
  };
}
