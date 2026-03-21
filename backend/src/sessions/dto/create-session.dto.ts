import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsUUID('4')
  agentId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
