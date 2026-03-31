import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApprovalType } from '../entities/approval.entity';

export class CreateApprovalDto {
  @IsUUID('4')
  agentId: string;

  @IsUUID('4')
  @IsOptional()
  sessionId?: string;

  @IsEnum(ApprovalType)
  type: ApprovalType;

  @IsObject()
  payload: Record<string, unknown>;

  @IsString()
  @MaxLength(200)
  requestedBy: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
