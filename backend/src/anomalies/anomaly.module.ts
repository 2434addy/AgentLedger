import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnomalyController } from './anomaly.controller';
import { AnomalyService } from './anomaly.service';
import { Event } from '../events/entities/event.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), AuthModule],
  controllers: [AnomalyController],
  providers: [AnomalyService],
})
export class AnomalyModule {}
