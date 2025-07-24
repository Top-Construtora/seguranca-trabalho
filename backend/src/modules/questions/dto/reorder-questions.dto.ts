import { IsArray, IsUUID, IsInt, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QuestionOrderDto {
  @ApiProperty({ description: 'ID da pergunta' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Nova ordem da pergunta' })
  @IsInt()
  @Min(1)
  order: number;
}

export class ReorderQuestionsDto {
  @ApiProperty({ 
    description: 'Lista de perguntas com suas novas ordens',
    type: [QuestionOrderDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questions: QuestionOrderDto[];
}