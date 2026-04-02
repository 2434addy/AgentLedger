import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateOrgDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  slug?: string;
}
