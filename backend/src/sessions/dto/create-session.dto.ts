import { IsString, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  agentId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
