import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Accident, AccidentStatus } from './entities/accident.entity';
import { AccidentBodyPart } from './entities/accident-body-part.entity';
import { AccidentEvidence } from './entities/accident-evidence.entity';
import { Work } from '../works/entities/work.entity';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { AccidentFiltersDto } from './dto/accident-filters.dto';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AccidentsService {
  constructor(
    @InjectRepository(Accident)
    private readonly accidentRepository: Repository<Accident>,
    @InjectRepository(AccidentBodyPart)
    private readonly bodyPartRepository: Repository<AccidentBodyPart>,
    @InjectRepository(AccidentEvidence)
    private readonly evidenceRepository: Repository<AccidentEvidence>,
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createAccidentDto: CreateAccidentDto,
    userId: string,
  ): Promise<Accident> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se a obra existe e está ativa
      const work = await this.workRepository.findOne({
        where: { id: createAccidentDto.work_id, is_active: true },
      });

      if (!work) {
        throw new NotFoundException('Obra não encontrada ou inativa');
      }

      // Criar o acidente
      const accident = queryRunner.manager.create(Accident, {
        title: createAccidentDto.title,
        description: createAccidentDto.description,
        accident_date: new Date(createAccidentDto.accident_date),
        work_id: createAccidentDto.work_id,
        severity: createAccidentDto.severity,
        accident_type: createAccidentDto.accident_type,
        days_away: createAccidentDto.days_away || 0,
        victim_name: createAccidentDto.victim_name,
        victim_role: createAccidentDto.victim_role,
        victim_company: createAccidentDto.victim_company,
        location_details: createAccidentDto.location_details,
        immediate_actions: createAccidentDto.immediate_actions,
        reported_by_id: userId,
        status: AccidentStatus.REGISTRADO,
      });

      const savedAccident = await queryRunner.manager.save(accident);

      // Criar partes do corpo afetadas
      if (createAccidentDto.body_parts?.length) {
        const bodyParts = createAccidentDto.body_parts.map((bp) =>
          queryRunner.manager.create(AccidentBodyPart, {
            accident_id: savedAccident.id,
            body_part: bp.body_part,
            injury_description: bp.injury_description,
          }),
        );
        await queryRunner.manager.save(bodyParts);
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedAccident.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters: AccidentFiltersDto,
    userId: string,
    userRole: UserRole,
  ): Promise<{ data: Accident[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.work', 'work')
      .leftJoinAndSelect('accident.reported_by', 'reported_by')
      .leftJoinAndSelect('accident.body_parts', 'body_parts')
      .leftJoinAndSelect('accident.corrective_actions', 'corrective_actions');

    // Filtros
    if (filters.work_id) {
      query.andWhere('accident.work_id = :work_id', {
        work_id: filters.work_id,
      });
    }

    if (filters.severity) {
      query.andWhere('accident.severity = :severity', {
        severity: filters.severity,
      });
    }

    if (filters.status) {
      query.andWhere('accident.status = :status', { status: filters.status });
    }

    if (filters.accident_type) {
      query.andWhere('accident.accident_type = :accident_type', {
        accident_type: filters.accident_type,
      });
    }

    if (filters.start_date && filters.end_date) {
      query.andWhere('accident.accident_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    } else if (filters.start_date) {
      query.andWhere('accident.accident_date >= :start_date', {
        start_date: filters.start_date,
      });
    } else if (filters.end_date) {
      query.andWhere('accident.accident_date <= :end_date', {
        end_date: filters.end_date,
      });
    }

    const [data, total] = await query
      .orderBy('accident.accident_date', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Accident> {
    const accident = await this.accidentRepository.findOne({
      where: { id },
      relations: [
        'work',
        'reported_by',
        'body_parts',
        'evidences',
        'evidences.uploaded_by',
        'investigations',
        'investigations.investigator',
        'corrective_actions',
        'corrective_actions.responsible',
      ],
    });

    if (!accident) {
      throw new NotFoundException('Acidente não encontrado');
    }

    return accident;
  }

  async update(
    id: string,
    updateAccidentDto: UpdateAccidentDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Accident> {
    const accident = await this.findOne(id);

    // Verificar permissão: admin pode editar qualquer um, avaliador só os próprios
    if (userRole !== UserRole.ADMIN && accident.reported_by_id !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este acidente',
      );
    }

    // Atualizar campos básicos
    const updateData: Partial<Accident> = {};

    if (updateAccidentDto.title) updateData.title = updateAccidentDto.title;
    if (updateAccidentDto.description)
      updateData.description = updateAccidentDto.description;
    if (updateAccidentDto.accident_date)
      updateData.accident_date = new Date(updateAccidentDto.accident_date);
    if (updateAccidentDto.work_id) updateData.work_id = updateAccidentDto.work_id;
    if (updateAccidentDto.severity)
      updateData.severity = updateAccidentDto.severity;
    if (updateAccidentDto.accident_type)
      updateData.accident_type = updateAccidentDto.accident_type;
    if (updateAccidentDto.status) updateData.status = updateAccidentDto.status;
    if (updateAccidentDto.days_away !== undefined)
      updateData.days_away = updateAccidentDto.days_away;
    if (updateAccidentDto.victim_name !== undefined)
      updateData.victim_name = updateAccidentDto.victim_name;
    if (updateAccidentDto.victim_role !== undefined)
      updateData.victim_role = updateAccidentDto.victim_role;
    if (updateAccidentDto.victim_company !== undefined)
      updateData.victim_company = updateAccidentDto.victim_company;
    if (updateAccidentDto.location_details !== undefined)
      updateData.location_details = updateAccidentDto.location_details;
    if (updateAccidentDto.immediate_actions !== undefined)
      updateData.immediate_actions = updateAccidentDto.immediate_actions;

    await this.accidentRepository.update(id, updateData);

    // Atualizar partes do corpo se fornecido
    if (updateAccidentDto.body_parts) {
      await this.bodyPartRepository.delete({ accident_id: id });

      if (updateAccidentDto.body_parts.length > 0) {
        const bodyParts = updateAccidentDto.body_parts.map((bp) =>
          this.bodyPartRepository.create({
            accident_id: id,
            body_part: bp.body_part,
            injury_description: bp.injury_description,
          }),
        );
        await this.bodyPartRepository.save(bodyParts);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const accident = await this.findOne(id);

    // Apenas admin pode excluir
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem excluir acidentes',
      );
    }

    await this.accidentRepository.remove(accident);
  }

  // === Evidências ===

  async addEvidence(
    createEvidenceDto: CreateEvidenceDto,
    userId: string,
  ): Promise<AccidentEvidence> {
    // Verificar se o acidente existe
    await this.findOne(createEvidenceDto.accident_id);

    const evidence = this.evidenceRepository.create({
      ...createEvidenceDto,
      uploaded_by_id: userId,
    });

    return this.evidenceRepository.save(evidence);
  }

  async getEvidences(accidentId: string): Promise<AccidentEvidence[]> {
    await this.findOne(accidentId);

    return this.evidenceRepository.find({
      where: { accident_id: accidentId },
      relations: ['uploaded_by'],
      order: { created_at: 'DESC' },
    });
  }

  async removeEvidence(
    accidentId: string,
    evidenceId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id: evidenceId, accident_id: accidentId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidência não encontrada');
    }

    // Admin ou quem fez upload pode excluir
    if (userRole !== UserRole.ADMIN && evidence.uploaded_by_id !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta evidência',
      );
    }

    await this.evidenceRepository.remove(evidence);
  }

  // === Dashboard ===

  async getDashboardSummary(filters?: {
    work_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const query = this.accidentRepository.createQueryBuilder('accident');

    if (filters?.work_id) {
      query.andWhere('accident.work_id = :work_id', {
        work_id: filters.work_id,
      });
    }

    if (filters?.start_date && filters?.end_date) {
      query.andWhere(
        'accident.accident_date BETWEEN :start_date AND :end_date',
        {
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
      );
    }

    const totalAccidents = await query.getCount();

    const totalDaysAway = await query
      .select('SUM(accident.days_away)', 'total')
      .getRawOne();

    const bySeverity = await this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where(filters?.work_id ? 'accident.work_id = :work_id' : '1=1', {
        work_id: filters?.work_id,
      })
      .groupBy('accident.severity')
      .getRawMany();

    const byStatus = await this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(filters?.work_id ? 'accident.work_id = :work_id' : '1=1', {
        work_id: filters?.work_id,
      })
      .groupBy('accident.status')
      .getRawMany();

    const pendingActions = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('accident_corrective_actions', 'action')
      .where("action.status IN ('pendente', 'em_andamento', 'atrasada')")
      .getRawOne();

    return {
      totalAccidents,
      totalDaysAway: Number(totalDaysAway?.total) || 0,
      bySeverity,
      byStatus,
      pendingActions: Number(pendingActions?.count) || 0,
    };
  }

  async getDaysAwayByWork(filters?: {
    start_date?: string;
    end_date?: string;
  }) {
    const query = this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoin('accident.work', 'work')
      .select('work.id', 'work_id')
      .addSelect('work.name', 'work_name')
      .addSelect('SUM(accident.days_away)', 'total_days_away')
      .addSelect('COUNT(accident.id)', 'accident_count')
      .groupBy('work.id')
      .addGroupBy('work.name')
      .orderBy('total_days_away', 'DESC');

    if (filters?.start_date && filters?.end_date) {
      query.where('accident.accident_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    return query.getRawMany();
  }

  async getByBodyPart(filters?: { start_date?: string; end_date?: string }) {
    const query = this.bodyPartRepository
      .createQueryBuilder('body_part')
      .leftJoin('body_part.accident', 'accident')
      .select('body_part.body_part', 'body_part')
      .addSelect('COUNT(*)', 'count')
      .groupBy('body_part.body_part')
      .orderBy('count', 'DESC');

    if (filters?.start_date && filters?.end_date) {
      query.where('accident.accident_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    return query.getRawMany();
  }

  async getBySeverity(filters?: { start_date?: string; end_date?: string }) {
    const query = this.accidentRepository
      .createQueryBuilder('accident')
      .select('accident.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(accident.days_away)', 'total_days_away')
      .groupBy('accident.severity')
      .orderBy('count', 'DESC');

    if (filters?.start_date && filters?.end_date) {
      query.where('accident.accident_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    }

    return query.getRawMany();
  }

  async getTimeline(filters?: {
    work_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
    const query = this.accidentRepository
      .createQueryBuilder('accident')
      .leftJoinAndSelect('accident.work', 'work')
      .leftJoinAndSelect('accident.body_parts', 'body_parts')
      .orderBy('accident.accident_date', 'DESC');

    if (filters?.work_id) {
      query.andWhere('accident.work_id = :work_id', {
        work_id: filters.work_id,
      });
    }

    if (filters?.start_date && filters?.end_date) {
      query.andWhere(
        'accident.accident_date BETWEEN :start_date AND :end_date',
        {
          start_date: filters.start_date,
          end_date: filters.end_date,
        },
      );
    }

    if (filters?.limit) {
      query.take(filters.limit);
    } else {
      query.take(20);
    }

    return query.getMany();
  }

  async getMonthlyTrend(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const result = await this.accidentRepository
      .createQueryBuilder('accident')
      .select("TO_CHAR(accident.accident_date, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(accident.days_away)', 'days_away')
      .where('EXTRACT(YEAR FROM accident.accident_date) = :year', {
        year: targetYear,
      })
      .groupBy("TO_CHAR(accident.accident_date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return result;
  }
}
