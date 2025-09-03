import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Evaluation } from '../evaluations/entities/evaluation.entity';
import { Work } from '../works/entities/work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, Work])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}