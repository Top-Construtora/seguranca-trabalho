import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import {
  AccidentCorrectiveAction,
  CorrectiveActionStatus,
} from './entities/accident-corrective-action.entity';
import { Accident, AccidentStatus } from './entities/accident.entity';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class CorrectiveActionsService {
  constructor(
    @InjectRepository(AccidentCorrectiveAction)
    private readonly actionRepository: Repository<AccidentCorrectiveAction>,
    @InjectRepository(Accident)
    private readonly accidentRepository: Repository<Accident>,
  ) {}

  async create(
    createDto: CreateCorrectiveActionDto,
    userId: string,
  ): Promise<AccidentCorrectiveAction> {
    // Verificar se o acidente existe
    const accident = await this.accidentRepository.findOne({
      where: { id: createDto.accident_id },
    });

    if (!accident) {
      throw new NotFoundException('Acidente não encontrado');
    }

    const action = this.actionRepository.create({
      accident_id: createDto.accident_id,
      action_description: createDto.action_description,
      responsible_id: createDto.responsible_id,
      target_date: new Date(createDto.target_date),
      priority: createDto.priority || 3,
      verification_method: createDto.verification_method,
      attachments: createDto.attachments || [],
      notes: createDto.notes,
      status: CorrectiveActionStatus.PENDENTE,
    });

    const saved = await this.actionRepository.save(action);

    return this.findOne(saved.id);
  }

  async findAll(filters?: {
    status?: CorrectiveActionStatus;
    responsible_id?: string;
    accident_id?: string;
    overdue?: boolean;
  }): Promise<AccidentCorrectiveAction[]> {
    const query = this.actionRepository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.accident', 'accident')
      .leftJoinAndSelect('accident.work', 'work')
      .leftJoinAndSelect('action.responsible', 'responsible');

    if (filters?.status) {
      query.andWhere('action.status = :status', { status: filters.status });
    }

    if (filters?.responsible_id) {
      query.andWhere('action.responsible_id = :responsible_id', {
        responsible_id: filters.responsible_id,
      });
    }

    if (filters?.accident_id) {
      query.andWhere('action.accident_id = :accident_id', {
        accident_id: filters.accident_id,
      });
    }

    if (filters?.overdue) {
      query.andWhere('action.target_date < :today', { today: new Date() });
      query.andWhere('action.status NOT IN (:...completed)', {
        completed: [
          CorrectiveActionStatus.CONCLUIDA,
          CorrectiveActionStatus.CANCELADA,
        ],
      });
    }

    return query.orderBy('action.target_date', 'ASC').getMany();
  }

  async findByAccident(accidentId: string): Promise<AccidentCorrectiveAction[]> {
    return this.actionRepository.find({
      where: { accident_id: accidentId },
      relations: ['responsible'],
      order: { priority: 'ASC', target_date: 'ASC' },
    });
  }

  async findMyActions(userId: string): Promise<AccidentCorrectiveAction[]> {
    return this.actionRepository.find({
      where: {
        responsible_id: userId,
        status: In([
          CorrectiveActionStatus.PENDENTE,
          CorrectiveActionStatus.EM_ANDAMENTO,
          CorrectiveActionStatus.ATRASADA,
        ]),
      },
      relations: ['accident', 'accident.work'],
      order: { target_date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<AccidentCorrectiveAction> {
    const action = await this.actionRepository.findOne({
      where: { id },
      relations: [
        'accident',
        'accident.work',
        'responsible',
      ],
    });

    if (!action) {
      throw new NotFoundException('Ação corretiva não encontrada');
    }

    return action;
  }

  async update(
    id: string,
    updateDto: UpdateCorrectiveActionDto,
    userId: string,
    userRole: UserRole,
  ): Promise<AccidentCorrectiveAction> {
    const action = await this.findOne(id);

    // Admin pode editar qualquer ação
    // Responsável pode atualizar status e completion_date da própria ação
    const isAdmin = userRole === UserRole.ADMIN;
    const isResponsible = action.responsible_id === userId;

    if (!isAdmin && !isResponsible) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta ação corretiva',
      );
    }

    const updateData: Partial<AccidentCorrectiveAction> = {};

    // Campos que admin pode editar
    if (isAdmin) {
      if (updateDto.action_description) {
        updateData.action_description = updateDto.action_description;
      }
      if (updateDto.responsible_id) {
        updateData.responsible_id = updateDto.responsible_id;
      }
      if (updateDto.target_date) {
        updateData.target_date = new Date(updateDto.target_date);
      }
      if (updateDto.priority !== undefined) {
        updateData.priority = updateDto.priority;
      }
      if (updateDto.verification_method !== undefined) {
        updateData.verification_method = updateDto.verification_method;
      }
    }

    // Campos que responsável e admin podem editar
    if (updateDto.status) {
      updateData.status = updateDto.status;

      // Se está concluindo, definir data de conclusão
      if (updateDto.status === CorrectiveActionStatus.CONCLUIDA) {
        updateData.completion_date = updateDto.completion_date
          ? new Date(updateDto.completion_date)
          : new Date();
      }
    }

    if (updateDto.completion_date) {
      updateData.completion_date = new Date(updateDto.completion_date);
    }

    if (updateDto.verification_result !== undefined) {
      updateData.verification_result = updateDto.verification_result;
    }

    if (updateDto.attachments !== undefined) {
      updateData.attachments = updateDto.attachments;
    }

    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }

    await this.actionRepository.update(id, updateData);

    // Verificar se todas as ações do acidente estão concluídas
    await this.checkAndUpdateAccidentStatus(action.accident_id);

    return this.findOne(id);
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const action = await this.findOne(id);

    // Apenas admin pode excluir
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem excluir ações corretivas',
      );
    }

    await this.actionRepository.remove(action);
  }

  // Verificar e atualizar status de ações atrasadas
  async updateOverdueActions(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.actionRepository.update(
      {
        target_date: LessThan(today),
        status: In([
          CorrectiveActionStatus.PENDENTE,
          CorrectiveActionStatus.EM_ANDAMENTO,
        ]),
      },
      { status: CorrectiveActionStatus.ATRASADA },
    );

    return result.affected || 0;
  }

  // Verificar se todas as ações de um acidente estão concluídas
  private async checkAndUpdateAccidentStatus(
    accidentId: string,
  ): Promise<void> {
    const actions = await this.actionRepository.find({
      where: { accident_id: accidentId },
    });

    if (actions.length === 0) return;

    const allCompleted = actions.every(
      (a) =>
        a.status === CorrectiveActionStatus.CONCLUIDA ||
        a.status === CorrectiveActionStatus.CANCELADA,
    );

    if (allCompleted) {
      await this.accidentRepository.update(accidentId, {
        status: AccidentStatus.CONCLUIDO,
      });
    }
  }

  // Estatísticas de ações corretivas
  async getStatistics() {
    const total = await this.actionRepository.count();

    const byStatus = await this.actionRepository
      .createQueryBuilder('action')
      .select('action.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('action.status')
      .getRawMany();

    const overdue = await this.actionRepository.count({
      where: { status: CorrectiveActionStatus.ATRASADA },
    });

    const avgCompletionDays = await this.actionRepository
      .createQueryBuilder('action')
      .select(
        'AVG(EXTRACT(DAY FROM (action.completion_date - action.created_at)))',
        'avg_days',
      )
      .where('action.status = :status', {
        status: CorrectiveActionStatus.CONCLUIDA,
      })
      .andWhere('action.completion_date IS NOT NULL')
      .getRawOne();

    return {
      total,
      byStatus,
      overdue,
      avgCompletionDays: Number(avgCompletionDays?.avg_days) || 0,
    };
  }
}
