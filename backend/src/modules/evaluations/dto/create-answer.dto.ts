import { IsUUID, IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AnswerValue } from '../entities/answer.entity';

export class CreateAnswerDto {
  @ApiProperty({ description: 'ID da pergunta' })
  @IsUUID()
  question_id: string;

  @ApiProperty({ 
    description: 'Resposta',
    enum: AnswerValue 
  })
  @IsEnum(AnswerValue)
  answer: AnswerValue;

  @ApiProperty({ 
    description: 'Observação',
    required: false 
  })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({ 
    description: 'URLs das evidências',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_urls?: string[];
}