import { IsUUID, IsEnum, IsDateString, IsInt, IsOptional, IsString, Min, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../entities/question.entity';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID da obra' })
  @IsUUID()
  work_id: string;

  @ApiProperty({ 
    description: 'ID do alojamento (apenas para avaliações de alojamento)',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  accommodation_id?: string;

  @ApiProperty({ 
    description: 'Nome do alojamento (apenas para avaliações de alojamento)',
    required: false 
  })
  @IsOptional()
  @IsString()
  accommodation_name?: string;

  @ApiProperty({ 
    description: 'IDs das obras vinculadas (apenas para avaliações de alojamento)',
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  work_ids?: string[];

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