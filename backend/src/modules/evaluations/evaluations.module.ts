import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { PenaltyTable } from './entities/penalty-table.entity';
import { Work } from '../works/entities/work.entity';
import { Accommodation } from '../works/entities/accommodation.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, Question, Answer, PenaltyTable, Work, Accommodation])],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}