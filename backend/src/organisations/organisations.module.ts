import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { Organisation } from './entities/organisation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organisation])],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
