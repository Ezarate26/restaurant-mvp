import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceRepository } from './voice.repository';
import { VoiceService } from './voice.service';

@Module({
  controllers: [VoiceController],
  providers: [VoiceService, VoiceRepository],
  exports: [VoiceService],
})
export class VoiceModule {}
