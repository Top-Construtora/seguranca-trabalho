import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Evaluation, EvaluationStatus } from './entities/evaluation.entity';
import { Answer, AnswerValue } from './entities/answer.entity';
import { Question } from './entities/question.entity';
import { PenaltyTable } from './entities/penalty-table.entity';
import { Work } from '../works/entities/work.entity';
import { Accommodation } from '../works/entities/accommodation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { UpdateAnswersDto } from './dto/update-answers.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(PenaltyTable)
    private readonly penaltyTableRepository: Repository<PenaltyTable>,
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createEvaluationDto: CreateEvaluationDto, userId: string): Promise<Evaluation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se a obra existe e está ativa
      const work = await this.workRepository.findOne({
        where: { id: createEvaluationDto.work_id, is_active: true },
      });

      if (!work) {
        throw new NotFoundException('Obra não encontrada ou inativa');
      }

      let accommodationId = createEvaluationDto.accommodation_id;

      // Se for uma avaliação de alojamento e tem nome do alojamento, criar o alojamento
      if (createEvaluationDto.accommodation_name && createEvaluationDto.work_ids) {
        // Criar alojamento
        const accommodation = queryRunner.manager.create(Accommodation, {
          name: createEvaluationDto.accommodation_name,
        });
        
        const savedAccommodation = await queryRunner.manager.save(accommodation);
        accommodationId = savedAccommodation.id;

        // Criar relacionamentos com as obras
        for (const workId of createEvaluationDto.work_ids) {
          const workExists = await this.workRepository.findOne({
            where: { id: workId, is_active: true },
          });

          if (!workExists) {
            throw new NotFoundException(`Obra com ID ${workId} não encontrada ou inativa`);
          }

          await queryRunner.manager.query(
            'INSERT INTO accommodation_works (accommodation_id, work_id) VALUES ($1, $2)',
            [accommodationId, workId]
          );
        }
      }

      // Criar avaliação
      const evaluation = queryRunner.manager.create(Evaluation, {
        work_id: createEvaluationDto.work_id,
        accommodation_id: accommodationId,
        type: createEvaluationDto.type,
        date: createEvaluationDto.date as any, // Passa a string diretamente, o transformer vai cuidar
        employees_count: createEvaluationDto.employees_count,
        notes: createEvaluationDto.notes,
        user_id: userId,
        status: EvaluationStatus.DRAFT,
      });

      const savedEvaluation = await queryRunner.manager.save(evaluation);

      await queryRunner.commitTransaction();
      return savedEvaluation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string, userRole: UserRole): Promise<Evaluation[]> {
    const query = this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.work', 'work')
      .leftJoinAndSelect('evaluation.accommodation', 'accommodation')
      .leftJoinAndSelect('evaluation.user', 'user')
      .leftJoinAndSelect('evaluation.answers', 'answer')
      .leftJoinAndSelect('answer.question', 'question');

    // Se não for admin, mostrar apenas suas próprias avaliações
    if (userRole !== UserRole.ADMIN) {
      query.where('evaluation.user_id = :userId', { userId });
    }

    return query.orderBy('evaluation.created_at', 'DESC').getMany();
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['work', 'accommodation', 'user', 'answers', 'answers.question'],
    });

    if (!evaluation) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    // Verificar permissão
    if (userRole !== UserRole.ADMIN && evaluation.user_id !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar esta avaliação');
    }

    return evaluation;
  }

  async update(
    id: string, 
    updateEvaluationDto: UpdateEvaluationDto,
    userId: string,
    userRole: UserRole
  ): Promise<Evaluation> {
    const evaluation = await this.findOne(id, userId, userRole);

    if (evaluation.status === EvaluationStatus.COMPLETED) {
      throw new BadRequestException('Não é possível editar uma avaliação finalizada');
    }

    Object.assign(evaluation, updateEvaluationDto);
    
    if (updateEvaluationDto.date) {
      evaluation.date = updateEvaluationDto.date as any; // Passa a string diretamente, o transformer vai cuidar
    }

    return this.evaluationRepository.save(evaluation);
  }

  async updateAnswers(
    id: string,
    updateAnswersDto: UpdateAnswersDto,
    userId: string,
    userRole: UserRole
  ): Promise<Evaluation> {
    const evaluation = await this.findOne(id, userId, userRole);

    if (evaluation.status === EvaluationStatus.COMPLETED) {
      throw new BadRequestException('Não é possível editar respostas de uma avaliação finalizada');
    }

    // Usar transação para garantir consistência
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remover respostas anteriores
      await queryRunner.manager.delete(Answer, { evaluation_id: id });

      // Criar novas respostas
      const answers = updateAnswersDto.answers.map(answerDto =>
        queryRunner.manager.create(Answer, {
          ...answerDto,
          evaluation_id: id,
        })
      );

      await queryRunner.manager.save(answers);
      await queryRunner.commitTransaction();

      return this.findOne(id, userId, userRole);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async complete(id: string, userId: string, userRole: UserRole): Promise<Evaluation> {
    const evaluation = await this.findOne(id, userId, userRole);

    if (evaluation.status === EvaluationStatus.COMPLETED) {
      throw new BadRequestException('Esta avaliação já foi finalizada');
    }

    // Verificar se todas as perguntas foram respondidas
    const questions = await this.questionRepository.find({
      where: { type: evaluation.type, is_active: true },
    });

    const answeredQuestionIds = evaluation.answers.map(a => a.question_id);
    const allQuestionsAnswered = questions.every(q => 
      answeredQuestionIds.includes(q.id)
    );

    if (!allQuestionsAnswered) {
      throw new BadRequestException('Todas as perguntas devem ser respondidas antes de finalizar');
    }

    // Calcular penalidade total
    const penalty = await this.calculatePenalty(evaluation);

    evaluation.status = EvaluationStatus.COMPLETED;
    evaluation.total_penalty = penalty;

    return this.evaluationRepository.save(evaluation);
  }

  private async calculatePenalty(evaluation: Evaluation): Promise<number> {
    const penalties = await this.calculatePenalties(evaluation);
    return penalties.total;
  }

  private async calculatePenalties(evaluation: Evaluation): Promise<{ total: number; min: number; max: number }> {
    let totalPenalty = 0;
    let minPenalty = 0;
    let maxPenalty = 0;

    // Agrupar respostas "NÃO" por peso
    const negativeAnswers = evaluation.answers.filter(
      answer => answer.answer === AnswerValue.NAO
    );

    const weightGroups = new Map<number, number>();

    for (const answer of negativeAnswers) {
      const weight = answer.question.weight;
      weightGroups.set(weight, (weightGroups.get(weight) || 0) + 1);
    }

    // Calcular penalidade para cada grupo de peso
    for (const [weight, count] of weightGroups) {
      const penalty = await this.penaltyTableRepository
        .createQueryBuilder('penalty')
        .where('penalty.weight = :weight', { weight })
        .andWhere('penalty.employees_min <= :employees', { employees: evaluation.employees_count })
        .andWhere('penalty.employees_max >= :employees', { employees: evaluation.employees_count })
        .getOne();

      if (penalty) {
        // Calcular valores mínimo, médio e máximo
        minPenalty += Number(penalty.min_value) * count;
        maxPenalty += Number(penalty.max_value) * count;
        const avgPenalty = (Number(penalty.min_value) + Number(penalty.max_value)) / 2;
        totalPenalty += avgPenalty * count;
      }
    }

    return {
      total: totalPenalty,
      min: minPenalty,
      max: maxPenalty
    };
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const evaluation = await this.findOne(id, userId, userRole);

    if (evaluation.status === EvaluationStatus.COMPLETED) {
      throw new BadRequestException('Não é possível excluir uma avaliação finalizada');
    }

    await this.evaluationRepository.remove(evaluation);
  }

  async getStatistics(userId: string, userRole: UserRole) {
    const query = this.evaluationRepository.createQueryBuilder('evaluation');

    if (userRole !== UserRole.ADMIN) {
      query.where('evaluation.user_id = :userId', { userId });
    }

    const total = await query.getCount();
    
    const byStatus = await query
      .select('evaluation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('evaluation.status')
      .getRawMany();

    const byType = await query
      .select('evaluation.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('evaluation.type')
      .getRawMany();

    const totalPenalties = await query
      .select('SUM(evaluation.total_penalty)', 'total')
      .where('evaluation.status = :status', { status: EvaluationStatus.COMPLETED })
      .getRawOne();

    return {
      total,
      byStatus,
      byType,
      totalPenalties: totalPenalties?.total || 0,
    };
  }

  async getPenaltyTable() {
    return await this.penaltyTableRepository.find({
      order: {
        weight: 'ASC',
        employees_min: 'ASC',
      },
    });
  }
}