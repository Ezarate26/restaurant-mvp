import type { SupabaseClient } from '@supabase/supabase-js';
import type { Message, MessageSender } from './types';

export async function fetchMessagesByTableId(
  client: SupabaseClient,
  tableId: string
): Promise<Message[]> {
  const { data } = await client
    .from('messages')
    .select('*')
    .eq('table_id', tableId)
    .order('created_at', { ascending: true });

  return (data as Message[]) ?? [];
}

export async function fetchMessagesByRestaurantId(
  client: SupabaseClient,
  restaurantId: string
): Promise<Message[]> {
  const { data } = await client
    .from('messages')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  return (data as Message[]) ?? [];
}

export async function insertMessage(
  client: SupabaseClient,
  row: {
    table_id: string;
    restaurant_id: string;
    sender: MessageSender;
    text: string;
  }
): Promise<void> {
  await client.from('messages').insert([row]);
}
