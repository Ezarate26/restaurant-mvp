export type ConversationStatus = 'active' | 'closed' | string;
export type MemberRole = 'owner' | 'member' | string;
export type MessageType = 'text' | 'audio' | 'sticker' | 'emoji' | string;

export interface Conversation {
  id: string;
  invite_code: string;
  owner_member_id: string | null;
  status: ConversationStatus;
  title: string | null;
  conversation_type: string | null;
  closed_by_member_id: string | null;
  created_at?: string | null;
  closed_at?: string | null;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string | null;
  device_id: string | null;
  display_name: string | null;
  preferred_language: string | null;
  role: MemberRole;
  joined_at?: string | null;
  left_at?: string | null;
}

export interface MessageTranslation {
  id?: string;
  message_id: string;
  language_code: string;
  translated_content: string | null;
  created_at?: string | null;
}

export interface MessageMemberJoin {
  display_name: string | null;
  preferred_language: string | null;
}

export interface VoiceMessage {
  id: string;
  message_id: string;
  audio_url: string;
  original_language: string | null;
  duration_seconds: number | null;
  created_at?: string | null;
  transcription: string | null;
  processing_status: string | null;
  transcription_status: string | null;
  transcription_completed_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  member_id: string | null;
  message_type: MessageType;
  content: string | null;
  original_language: string | null;
  translation_status: string | null;
  created_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  translations?: MessageTranslation[] | null;
  conversation_members?: MessageMemberJoin | MessageMemberJoin[] | null;
  voice_message?: VoiceMessage | null;
}

export interface ConversationInvite {
  id: string;
  conversation_id: string;
  invite_code: string;
  expires_at: string | null;
  created_at?: string | null;
}
