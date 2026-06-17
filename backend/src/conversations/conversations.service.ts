import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConversationsRepository } from './conversations.repository';
import type { ConversationMember } from '../common/domain.types';

export interface CreateConversationResponse {
  conversation_id: string;
  member_id: string;
  invite_code: string;
  member: ConversationMember;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly repo: ConversationsRepository) {}

  /** Crear conversación + owner + invite. */
  async createConversation(args: {
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    userId?: string | null;
  }): Promise<CreateConversationResponse> {
    const conversation = await this.repo.createConversationRecord({
      title: args.displayName,
    });

    const member = await this.repo.insertConversationMember({
      conversationId: conversation.id,
      deviceId: args.deviceId,
      displayName: args.displayName,
      preferredLanguage: args.preferredLanguage,
      role: 'owner',
      userId: args.userId ?? null,
    });

    await this.repo.setConversationOwner(conversation.id, member.id);
    await this.repo.createConversationInvite(
      conversation.id,
      conversation.invite_code
    );

    return {
      conversation_id: conversation.id,
      member_id: member.id,
      invite_code: conversation.invite_code,
      member,
    };
  }

  async joinConversation(args: {
    inviteCode: string;
    deviceId: string;
    displayName?: string | null;
    preferredLanguage: string;
    userId?: string | null;
  }): Promise<CreateConversationResponse> {
    const conversation = await this.repo.fetchConversationByInviteCode(
      args.inviteCode
    );
    if (!conversation || conversation.status !== 'active') {
      throw new BadRequestException(
        'Código de invitación no válido o conversación cerrada'
      );
    }

    const existing = await this.repo.findActiveMemberByDevice(
      conversation.id,
      args.deviceId
    );

    const member =
      existing ??
      (await this.repo.insertConversationMember({
        conversationId: conversation.id,
        deviceId: args.deviceId,
        displayName: args.displayName,
        preferredLanguage: args.preferredLanguage,
        role: 'member',
        userId: args.userId ?? null,
      }));

    return {
      conversation_id: conversation.id,
      member_id: member.id,
      invite_code: conversation.invite_code,
      member,
    };
  }

  async updateMemberLanguage(
    memberId: string,
    language: string
  ): Promise<ConversationMember> {
    return this.repo.updateMemberLanguage(memberId, language);
  }

  /** Salir de la conversación: si es owner, cierra para todos. */
  async leaveConversation(args: {
    conversationId: string;
    memberId: string;
  }): Promise<void> {
    const member = await this.repo.fetchMemberById(args.memberId);
    if (!member || member.conversation_id !== args.conversationId) {
      throw new BadRequestException('Participante no válido');
    }

    const conversation = await this.repo.fetchConversationById(
      args.conversationId
    );
    const isOwner =
      member.role === 'owner' || conversation?.owner_member_id === member.id;

    if (isOwner) {
      await this.repo.markAllMembersLeft(args.conversationId);
      await this.repo.closeConversationRecord(args.conversationId, member.id);
    } else {
      await this.repo.markMemberLeft(member.id);
    }
  }

  /** Solo el owner puede expulsar a otro participante (no a sí mismo ni al owner). */
  async expelMember(args: {
    conversationId: string;
    actorMemberId: string;
    targetMemberId: string;
  }): Promise<void> {
    const [conversation, actor, target] = await Promise.all([
      this.repo.fetchConversationById(args.conversationId),
      this.repo.fetchMemberById(args.actorMemberId),
      this.repo.fetchMemberById(args.targetMemberId),
    ]);

    if (!conversation || conversation.status !== 'active') {
      throw new BadRequestException('La conversación no está activa');
    }

    const actorIsOwner =
      actor?.role === 'owner' || conversation.owner_member_id === actor?.id;
    if (!actorIsOwner) {
      throw new ForbiddenException(
        'Solo el propietario puede expulsar participantes'
      );
    }

    if (!target || target.conversation_id !== args.conversationId) {
      throw new BadRequestException('Participante no válido');
    }
    if (target.left_at) return;
    if (target.id === actor?.id) {
      throw new BadRequestException('Para salir tú mismo, usa el botón Salir');
    }
    if (
      target.role === 'owner' ||
      conversation.owner_member_id === target.id
    ) {
      throw new BadRequestException('No se puede expulsar al propietario');
    }

    await this.repo.markMemberLeft(target.id);
  }
}
