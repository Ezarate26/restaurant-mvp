import type { SupabaseClient } from '@supabase/supabase-js';
import type { Table } from './types';

export async function fetchTableRestaurantId(
  client: SupabaseClient,
  tableId: string
): Promise<string | null> {
  const { data } = await client
    .from('tables')
    .select('restaurant_id')
    .eq('id', tableId)
    .single();

  return data?.restaurant_id ?? null;
}

export async function fetchTablesByRestaurant(
  client: SupabaseClient,
  restaurantId: string
): Promise<Table[]> {
  const { data } = await client
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId);

  return (data as Table[]) ?? [];
}

export async function assignTableToWaiter(
  client: SupabaseClient,
  args: {
    tableId: string;
    userId: string;
    fullName: string;
  }
): Promise<void> {
  await client
    .from('tables')
    .update({
      assigned_to: args.userId,
      assigned_to_name: args.fullName,
      status: 'assigned',
    })
    .eq('id', args.tableId);
}
