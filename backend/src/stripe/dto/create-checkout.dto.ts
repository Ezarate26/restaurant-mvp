import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnUrl?: string;
}
