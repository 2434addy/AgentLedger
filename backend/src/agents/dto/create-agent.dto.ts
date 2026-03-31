import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { AgentStatus } from '../entities/agent.entity';
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

export class CreateAgentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MaxLength(50)
  modelProvider: string;

  @IsString()
  @MaxLength(100)
  modelId: string;

  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @IsOptional()
  @MaxJsonSize(16384)
  metadata?: Record<string, unknown>;
}
