import { IsOptional, IsEnum, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionStatus } from '../entities/session.entity';
import { MaxJsonSize } from '../../common/validators/max-json-size.validator';

export class UpdateSessionDto {
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endedAt?: Date;

  @IsOptional()
  @IsObject()
  @MaxJsonSize(65536)
  metadata?: Record<string, unknown>;
}
