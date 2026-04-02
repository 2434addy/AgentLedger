import { IsString, IsOptional, IsEnum, MaxLength, IsObject } from 'class-validator';
import { AgentStatus } from '../entities/agent.entity';
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

export class UpdateAgentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  modelProvider?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  modelId?: string;

  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @IsOptional()
  @IsObject()
  @MaxJsonSize(16384)
  metadata?: Record<string, unknown>;
}
