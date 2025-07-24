import { IsUUID, IsEnum, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../entities/question.entity';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID da obra' })
  @IsUUID()
  work_id: string;

  @ApiProperty({ 
    description: 'Tipo da avaliação',
    enum: QuestionType 
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ description: 'Data da avaliação' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Número de funcionários' })
  @IsInt()
  @Min(1)
  employees_count: number;

  @ApiProperty({ 
    description: 'Observações gerais',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}