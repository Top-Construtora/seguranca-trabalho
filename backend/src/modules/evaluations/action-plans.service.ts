import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionPlan } from './entities/action-plan.entity';
import { Answer } from './entities/answer.entity';

export interface CreateActionPlanDto {
  answer_id: string;
  action_description: string;
  target_date?: Date;
  responsible_user_id?: string;
  notes?: string;
  attachment_urls?: string[];
}

export interface UpdateActionPlanDto {
  action_description?: string;
  target_date?: Date;
  status?: string;
  responsible_user_id?: string;
  notes?: string;
  attachment_urls?: string[];
}

@Injectable()
export class ActionPlansService {
  constructor(
    @InjectRepository(ActionPlan)
    private actionPlansRepository: Repository<ActionPlan>,
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
  ) {}

  async create(createDto: CreateActionPlanDto): Promise<ActionPlan> {
    const answer = await this.answersRepository.findOne({
      where: { id: createDto.answer_id },
    });

    if (!answer) {
      throw new NotFoundException('Resposta não encontrada');
    }

    const actionPlan = this.actionPlansRepository.create(createDto);
    return this.actionPlansRepository.save(actionPlan);
  }

  async findByAnswerId(answerId: string): Promise<ActionPlan[]> {
    return this.actionPlansRepository.find({
      where: { answer_id: answerId },
      relations: ['responsible_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findByEvaluationId(evaluationId: string): Promise<ActionPlan[]> {
    return this.actionPlansRepository
      .createQueryBuilder('action_plan')
      .innerJoin('action_plan.answer', 'answer')
      .innerJoin('answer.evaluation', 'evaluation')
      .leftJoinAndSelect('action_plan.responsible_user', 'responsible_user')
      .leftJoinAndSelect('action_plan.answer', 'answerData')
      .leftJoinAndSelect('answerData.question', 'question')
      .where('evaluation.id = :evaluationId', { evaluationId })
      .orderBy('action_plan.created_at', 'DESC')
      .getMany();
  }

  async findByWorkId(workId: string): Promise<ActionPlan[]> {
    return this.actionPlansRepository
      .createQueryBuilder('action_plan')
      .innerJoin('action_plan.answer', 'answer')
      .innerJoin('answer.evaluation', 'evaluation')
      .leftJoinAndSelect('action_plan.responsible_user', 'responsible_user')
      .leftJoinAndSelect('action_plan.answer', 'answerData')
      .leftJoinAndSelect('answerData.question', 'question')
      .leftJoinAndSelect('answerData.evaluation', 'evaluationData')
      .where('evaluation.work_id = :workId', { workId })
      .orderBy('action_plan.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<ActionPlan> {
    const actionPlan = await this.actionPlansRepository.findOne({
      where: { id },
      relations: ['answer', 'answer.question', 'responsible_user'],
    });

    if (!actionPlan) {
      throw new NotFoundException('Plano de ação não encontrado');
    }

    return actionPlan;
  }

  async update(id: string, updateDto: UpdateActionPlanDto): Promise<ActionPlan> {
    const actionPlan = await this.findOne(id);
    Object.assign(actionPlan, updateDto);
    return this.actionPlansRepository.save(actionPlan);
  }

  async remove(id: string): Promise<void> {
    const actionPlan = await this.findOne(id);
    await this.actionPlansRepository.remove(actionPlan);
  }
}