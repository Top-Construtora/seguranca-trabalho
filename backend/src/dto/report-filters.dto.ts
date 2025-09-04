import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { EvaluationStatus } from '../entities/evaluation.entity';

export class ReportFiltersDto {
  @IsOptional()
  @IsUUID()
  work_id?: string;

  @IsOptional()
  @IsUUID()
  evaluator_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;
}