import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work } from './entities/work.entity';
import { Accommodation } from './entities/accommodation.entity';
import { CreateWorkDto } from './dto/create-work.dto';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
    @InjectRepository(Accommodation)
    private accommodationRepository: Repository<Accommodation>,
  ) {}

  async create(createWorkDto: CreateWorkDto): Promise<Work> {
    const existingWork = await this.workRepository.findOne({
      where: { number: createWorkDto.number },
    });

    if (existingWork) {
      throw new ConflictException('Work with this number already exists');
    }

    const work = this.workRepository.create(createWorkDto);
    return this.workRepository.save(work);
  }

  async findAll(): Promise<Work[]> {
    return this.workRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id },
    });

    if (!work) {
      throw new NotFoundException('Work not found');
    }

    return work;
  }

  async update(id: string, updateData: Partial<Work>): Promise<Work> {
    const work = await this.findOne(id);

    if (updateData.number && updateData.number !== work.number) {
      const existingWork = await this.workRepository.findOne({
        where: { number: updateData.number },
      });
      if (existingWork) {
        throw new ConflictException('Work with this number already exists');
      }
    }

    await this.workRepository.update(id, updateData);
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<Work> {
    const work = await this.findOne(id);
    work.is_active = !work.is_active;
    return this.workRepository.save(work);
  }

  async findAllAccommodations(): Promise<Accommodation[]> {
    return this.accommodationRepository.find({
      relations: ['works'],
      order: { created_at: 'DESC' },
    });
  }
}