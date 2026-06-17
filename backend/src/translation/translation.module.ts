import { Module } from '@nestjs/common';
import { TranslationRepository } from './translation.repository';
import { TranslationService } from './translation.service';

@Module({
  providers: [TranslationService, TranslationRepository],
  exports: [TranslationService],
})
export class TranslationModule {}
