import { IsString, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../evaluations/entities/question.entity';

export class CreateQuestionDto {
  @ApiProperty({ description: 'Texto da pergunta' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Peso da pergunta (1-4)', minimum: 1, maximum: 4 })
  @IsInt()
  @Min(1)
  @Max(4)
  weight: number;

  @ApiProperty({ 
    description: 'Tipo da pergunta',
    enum: QuestionType 
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ 
    description: 'Ordem de exibição da pergunta',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}