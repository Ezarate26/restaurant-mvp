import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinConversationDto {
  @IsString()
  @MaxLength(32)
  inviteCode!: string;

  @IsString()
  @MaxLength(128)
  deviceId!: string;

  @IsString()
  @MaxLength(16)
  preferredLanguage!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;
}
