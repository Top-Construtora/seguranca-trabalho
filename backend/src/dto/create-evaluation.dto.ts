import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateEvaluationDto {
  @IsUUID()
  work_id: string;

  @IsOptional()
  @IsString()
  observations?: string;
}