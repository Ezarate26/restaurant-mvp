import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomSessionDto {
  @IsString()
  @MaxLength(128)
  conversationId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnUrl?: string;
}
