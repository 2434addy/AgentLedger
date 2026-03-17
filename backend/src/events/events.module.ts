import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { Session } from '../sessions/entities/session.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CombinedAuthGuard } from '../common/guards/combined-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Session, ApiKey]), AuthModule],
  controllers: [EventsController],
  providers: [EventsService, JwtAuthGuard, ApiKeyGuard, CombinedAuthGuard],
  exports: [EventsService],
})
export class EventsModule {}
