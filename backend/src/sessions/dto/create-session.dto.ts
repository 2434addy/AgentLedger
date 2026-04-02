import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

export class CreateSessionDto {
  @IsString()
  @IsUUID('4')
  agentId: string;

  @IsOptional()
  @IsObject()
  @MaxJsonSize(65536)
  metadata?: Record<string, unknown>;
}
