import { IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionStatus } from '../entities/session.entity';

export class UpdateSessionDto {
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endedAt?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
