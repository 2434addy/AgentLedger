import { IsString, IsOptional, IsEnum, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { AgentStatus } from '../entities/agent.entity';
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export class CreateAgentDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => stripHtml(value))
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9\s\-_.]+$/, {
    message: 'name must contain only alphanumeric characters, spaces, hyphens, underscores, and dots',
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => value ? stripHtml(value) : value)
  description?: string;

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => stripHtml(value))
  modelProvider: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => stripHtml(value))
  modelId: string;

  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @IsOptional()
  @MaxJsonSize(16384)
  metadata?: Record<string, unknown>;
}
