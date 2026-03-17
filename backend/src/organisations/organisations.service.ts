import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation } from './entities/organisation.entity';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation) private orgRepo: Repository<Organisation>,
  ) {}

  async findById(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  async update(id: string, dto: UpdateOrgDto) {
    await this.orgRepo.update(id, dto);
    return this.findById(id);
  }
}
