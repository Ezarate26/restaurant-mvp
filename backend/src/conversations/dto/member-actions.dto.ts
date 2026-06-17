import { IsString, MaxLength } from 'class-validator';

export class UpdateLanguageDto {
  @IsString()
  @MaxLength(128)
  memberId!: string;

  @IsString()
  @MaxLength(16)
  language!: string;
}

export class LeaveConversationDto {
  @IsString()
  @MaxLength(128)
  memberId!: string;
}

export class ExpelMemberDto {
  @IsString()
  @MaxLength(128)
  actorMemberId!: string;

  @IsString()
  @MaxLength(128)
  targetMemberId!: string;
}
