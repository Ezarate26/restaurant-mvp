import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MaxLength(128)
  memberId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  originalLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  messageType?: string;
}
