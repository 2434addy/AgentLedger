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
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

export class CreateApprovalDto {
  @IsUUID('4')
  agentId: string;

  @IsUUID('4')
  @IsOptional()
  sessionId?: string;

  @IsEnum(ApprovalType)
  type: ApprovalType;

  @IsObject()
  @MaxJsonSize(32768)
  payload: Record<string, unknown>;

  @IsString()
  @MaxLength(200)
  requestedBy: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
