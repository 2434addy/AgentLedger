import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ReviewApprovalDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}
