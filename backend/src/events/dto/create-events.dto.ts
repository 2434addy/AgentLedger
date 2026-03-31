import { IsArray, ValidateNested, IsString, IsEnum, IsOptional, IsNumber, IsDateString, MaxLength, IsUUID, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, EventLevel } from '../entities/event.entity';

export class CreateEventItemDto {
  @IsUUID('4')
  @IsOptional()
  sessionId?: string;

  @IsUUID('4')
  agentId: string;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsEnum(EventLevel)
  level: EventLevel;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  payload?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  tokensInput?: number;

  @IsNumber()
  @IsOptional()
  tokensOutput?: number;

  @IsNumber()
  @IsOptional()
  costUsd?: number;

  @IsNumber()
  @IsOptional()
  latencyMs?: number;

  @IsOptional()
  stateBefore?: Record<string, unknown>;

  @IsOptional()
  stateAfter?: Record<string, unknown>;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

export class CreateEventsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateEventItemDto)
  events: CreateEventItemDto[];
}
