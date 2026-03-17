import { IsArray, ValidateNested, IsString, IsEnum, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, EventLevel } from '../entities/event.entity';

class CreateEventItemDto {
  @IsString()
  sessionId: string;

  @IsString()
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
}

export class CreateEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventItemDto)
  events: CreateEventItemDto[];
}
