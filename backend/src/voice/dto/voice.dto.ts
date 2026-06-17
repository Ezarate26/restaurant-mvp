import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RegisterVoiceDto {
  @IsString()
  @MaxLength(128)
  messageId!: string;

  @IsString()
  @MaxLength(1024)
  audioUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  originalLanguage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;
}

export class ProcessVoiceDto {
  @IsString()
  @MaxLength(128)
  messageId!: string;
}

export class TtsDto {
  @IsString()
  @MaxLength(8000)
  text!: string;

  @IsString()
  @MaxLength(16)
  languageCode!: string;
}
