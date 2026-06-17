import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { TranslationModule } from '../translation/translation.module';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';

@Module({
  imports: [ConversationsModule, TranslationModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository],
  exports: [MessagesService],
})
export class MessagesModule {}
