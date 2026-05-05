import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Registra o actualiza la relación cliente–restaurante (última visita y contador).
 */
export async function upsertCustomerRestaurantVisit(
  admin: SupabaseClient,
  customerId: string,
  restaurantId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { data: row, error: findErr } = await admin
    .from('customer_restaurants')
    .select('id, visit_count')
    .eq('customer_id', customerId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (findErr) {
    console.error('upsertCustomerRestaurantVisit:find', findErr);
    throw findErr;
  }

  if (row?.id) {
    const nextCount = (typeof row.visit_count === 'number' ? row.visit_count : 1) + 1;
    const { error } = await admin
      .from('customer_restaurants')
      .update({ last_visit: now, visit_count: nextCount })
      .eq('id', row.id);
    if (error) {
      console.error('upsertCustomerRestaurantVisit:update', error);
      throw error;
    }
    return;
  }

  const { error } = await admin.from('customer_restaurants').insert([
    {
      customer_id: customerId,
      restaurant_id: restaurantId,
      last_visit: now,
      visit_count: 1,
    },
  ]);
  if (error) {
    console.error('upsertCustomerRestaurantVisit:insert', error);
    throw error;
  }
}
