import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(
    @Param('conversationId') conversationId: string,
    @Query('viewerLanguage') viewerLanguage?: string
  ) {
    return this.messages.listForViewer(conversationId, viewerLanguage ?? null);
  }

  @Post()
  send(
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto
  ) {
    return this.messages.sendMessage({
      conversation_id: conversationId,
      member_id: body.memberId,
      content: body.content ?? null,
      original_language: body.originalLanguage ?? null,
      message_type: body.messageType ?? 'text',
    });
  }
}
