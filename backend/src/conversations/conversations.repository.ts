import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { normalizeLanguageCode } from '../common/utils/language.util';
import { generateInviteCode } from '../common/utils/invite.util';
import type {
  Conversation,
  ConversationInvite,
  ConversationMember,
  MemberRole,
} from '../common/domain.types';

function fail(message: string): never {
  throw new InternalServerErrorException(message);
}

@Injectable()
export class ConversationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.serviceRole();
  }

  // ---- conversations table ----

  async createConversationRecord(args?: {
    title?: string | null;
  }): Promise<Conversation> {
    const { data, error } = await this.db
      .from('conversations')
      .insert([
        {
          status: 'active',
          invite_code: generateInviteCode(),
          title: args?.title?.trim() || null,
          conversation_type: 'temporary',
        },
      ])
      .select('*')
      .single();

    if (error || !data) fail('No se pudo crear la conversación');
    return data as Conversation;
  }

  async setConversationOwner(
    conversationId: string,
    memberId: string
  ): Promise<void> {
    const { error } = await this.db
      .from('conversations')
      .update({ owner_member_id: memberId })
      .eq('id', conversationId);
    if (error) fail('No se pudo asignar el propietario');
  }

  async fetchConversationById(
    conversationId: string
  ): Promise<Conversation | null> {
    const { data, error } = await this.db
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) return null;
    return (data as Conversation) ?? null;
  }

  async fetchConversationByInviteCode(
    inviteCode: string
  ): Promise<Conversation | null> {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return null;

    const { data, error } = await this.db
      .from('conversations')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'active')
      .maybeSingle();
    if (error) return null;
    return (data as Conversation) ?? null;
  }

  async closeConversationRecord(
    conversationId: string,
    closedByMemberId?: string | null
  ): Promise<void> {
    const { error } = await this.db
      .from('conversations')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by_member_id: closedByMemberId ?? null,
      })
      .eq('id', conversationId);
    if (error) fail('No se pudo cerrar la conversación');
  }

  // ---- conversation_invites table ----

  async createConversationInvite(
    conversationId: string,
    inviteCode: string
  ): Promise<ConversationInvite> {
    const { data, error } = await this.db
      .from('conversation_invites')
      .insert([{ conversation_id: conversationId, invite_code: inviteCode }])
      .select('*')
      .single();
    if (error || !data) fail('No se pudo crear la invitación');
    return data as ConversationInvite;
  }

  // ---- conversation_members table ----

  async insertConversationMember(args: {
    conversationId: string;
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    role: MemberRole;
    userId?: string | null;
  }): Promise<ConversationMember> {
    const { data, error } = await this.db
      .from('conversation_members')
      .insert([
        {
          conversation_id: args.conversationId,
          device_id: args.deviceId,
          display_name: args.displayName?.trim() || null,
          preferred_language: normalizeLanguageCode(args.preferredLanguage),
          role: args.role,
          user_id: args.userId ?? null,
        },
      ])
      .select('*')
      .single();
    if (error || !data) fail('No se pudo crear el participante');
    return data as ConversationMember;
  }

  async fetchMemberById(memberId: string): Promise<ConversationMember | null> {
    const { data, error } = await this.db
      .from('conversation_members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();
    if (error) return null;
    return (data as ConversationMember) ?? null;
  }

  async fetchActiveMembersByConversation(
    conversationId: string
  ): Promise<ConversationMember[]> {
    const { data, error } = await this.db
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('left_at', null)
      .order('joined_at', { ascending: true });
    if (error) return [];
    return (data as ConversationMember[]) ?? [];
  }

  async findActiveMemberByDevice(
    conversationId: string,
    deviceId: string
  ): Promise<ConversationMember | null> {
    const { data, error } = await this.db
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('device_id', deviceId)
      .is('left_at', null)
      .maybeSingle();
    if (error) return null;
    return (data as ConversationMember) ?? null;
  }

  async updateMemberLanguage(
    memberId: string,
    language: string
  ): Promise<ConversationMember> {
    const { data, error } = await this.db
      .from('conversation_members')
      .update({ preferred_language: normalizeLanguageCode(language) })
      .eq('id', memberId)
      .select('*')
      .single();
    if (error || !data) fail('No se pudo actualizar el idioma');
    return data as ConversationMember;
  }

  async markMemberLeft(memberId: string): Promise<void> {
    const { error } = await this.db
      .from('conversation_members')
      .update({ left_at: new Date().toISOString() })
      .eq('id', memberId)
      .is('left_at', null);
    if (error) fail('No se pudo abandonar la conversación');
  }

  async markAllMembersLeft(conversationId: string): Promise<void> {
    const { error } = await this.db
      .from('conversation_members')
      .update({ left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('left_at', null);
    if (error) fail('No se pudo cerrar la conversación');
  }

  /** Idiomas preferidos de participantes activos. */
  async fetchActiveConversationLanguages(
    conversationId: string
  ): Promise<string[]> {
    const { data, error } = await this.db
      .from('conversation_members')
      .select('preferred_language')
      .eq('conversation_id', conversationId)
      .is('left_at', null);
    if (error) return [];

    return [
      ...new Set(
        (data ?? [])
          .map((r) => normalizeLanguageCode(r.preferred_language))
          .filter(Boolean)
      ),
    ];
  }
}
