import type { SupabaseClient } from '@supabase/supabase-js';
import type { Message, MessageSender } from './types';

export async function fetchMessagesBySession(
  client: SupabaseClient,
  sessionId: string
): Promise<Message[]> {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchMessagesBySession', error);
    return [];
  }
  return (data as Message[]) ?? [];
}

export async function insertMessage(
  client: SupabaseClient,
  row: {
    session_id: string;
    restaurant_id: string;
    sender: MessageSender;
    text: string;
    session_user_id?: string | null;
    user_identifier?: string | null;
  }
): Promise<void> {
  const { error } = await client.from('messages').insert([
    {
      session_id: row.session_id,
      restaurant_id: row.restaurant_id,
      sender: row.sender,
      text: row.text,
      session_user_id: row.session_user_id ?? null,
      user_identifier: row.user_identifier ?? null,
    },
  ]);

  if (error) {
    console.error('insertMessage', error);
    throw error;
  }
}
