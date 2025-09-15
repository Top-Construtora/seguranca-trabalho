import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { ActionPlan } from './entities/action-plan.entity';
import { PenaltyTable } from './entities/penalty-table.entity';
import { Work } from '../works/entities/work.entity';
import { Accommodation } from '../works/entities/accommodation.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { ActionPlansController } from './action-plans.controller';
import { ActionPlansService } from './action-plans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, Question, Answer, ActionPlan, PenaltyTable, Work, Accommodation])],
  controllers: [EvaluationsController, ActionPlansController],
  providers: [EvaluationsService, ActionPlansService],
  exports: [EvaluationsService, ActionPlansService],
})
export class EvaluationsModule {}