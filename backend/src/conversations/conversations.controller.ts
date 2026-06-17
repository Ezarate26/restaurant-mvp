import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import {
  ExpelMemberDto,
  LeaveConversationDto,
  UpdateLanguageDto,
} from './dto/member-actions.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly repo: ConversationsRepository
  ) {}

  @Post()
  create(@Body() body: CreateConversationDto) {
    return this.conversations.createConversation({
      deviceId: body.deviceId,
      displayName: body.displayName ?? null,
      preferredLanguage: body.preferredLanguage,
    });
  }

  @Post('join')
  join(@Body() body: JoinConversationDto) {
    return this.conversations.joinConversation({
      inviteCode: body.inviteCode,
      deviceId: body.deviceId,
      displayName: body.displayName ?? null,
      preferredLanguage: body.preferredLanguage,
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const conversation = await this.repo.fetchConversationById(id);
    const members = await this.repo.fetchActiveMembersByConversation(id);
    return { conversation, members };
  }

  @Patch('member/language')
  updateLanguage(@Body() body: UpdateLanguageDto) {
    return this.conversations.updateMemberLanguage(body.memberId, body.language);
  }

  @Post(':id/leave')
  async leave(@Param('id') id: string, @Body() body: LeaveConversationDto) {
    await this.conversations.leaveConversation({
      conversationId: id,
      memberId: body.memberId,
    });
    return { ok: true };
  }

  @Post(':id/expel')
  async expel(@Param('id') id: string, @Body() body: ExpelMemberDto) {
    await this.conversations.expelMember({
      conversationId: id,
      actorMemberId: body.actorMemberId,
      targetMemberId: body.targetMemberId,
    });
    return { ok: true };
  }
}
