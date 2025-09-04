import { AppDataSource } from '../config/database.config';
import { Work } from '../entities/work.entity';
import { CreateWorkDto } from '../dto/create-work.dto';

export class WorksService {
  private workRepository = AppDataSource.getRepository(Work);

  async create(createWorkDto: CreateWorkDto): Promise<Work> {
    const existingWork = await this.workRepository.findOne({
      where: { number: createWorkDto.number },
    });

    if (existingWork) {
      throw new Error('Work with this number already exists');
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

  async findOne(id: string): Promise<Work | null> {
    return this.workRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateData: Partial<Work>): Promise<Work | null> {
    const work = await this.findOne(id);
    if (!work) return null;

    if (updateData.number && updateData.number !== work.number) {
      const existingWork = await this.workRepository.findOne({
        where: { number: updateData.number },
      });
      if (existingWork) {
        throw new Error('Work with this number already exists');
      }
    }

    await this.workRepository.update(id, updateData);
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<Work | null> {
    const work = await this.workRepository.findOne({ where: { id } });
    if (!work) return null;

    work.is_active = !work.is_active;
    return this.workRepository.save(work);
  }
}