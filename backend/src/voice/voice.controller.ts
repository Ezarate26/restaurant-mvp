import { Body, Controller, Post } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { ProcessVoiceDto, RegisterVoiceDto, TtsDto } from './dto/voice.dto';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post('register')
  register(@Body() body: RegisterVoiceDto) {
    return this.voice.registerVoiceMessage({
      message_id: body.messageId,
      audio_url: body.audioUrl,
      original_language: body.originalLanguage ?? null,
      duration_seconds: body.durationSeconds ?? null,
    });
  }

  @Post('process')
  async process(@Body() body: ProcessVoiceDto) {
    await this.voice.processVoiceMessage(body.messageId);
    return { ok: true };
  }

  @Post('tts')
  async tts(@Body() body: TtsDto) {
    const audioUrl = await this.voice.resolveTtsAudioUrl(
      body.text,
      body.languageCode
    );
    return { audio_url: audioUrl };
  }
}
