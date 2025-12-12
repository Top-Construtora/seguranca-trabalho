import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorrectiveActionDto {
  @ApiProperty({ description: 'ID do acidente' })
  @IsUUID()
  accident_id: string;

  @ApiProperty({ description: 'Descrição da ação corretiva' })
  @IsString()
  action_description: string;

  @ApiProperty({ description: 'ID do responsável pela ação' })
  @IsUUID()
  responsible_id: string;

  @ApiProperty({ description: 'Data limite para conclusão' })
  @IsDateString()
  target_date: string;

  @ApiProperty({
    description: 'Prioridade (1 = máxima, 5 = mínima)',
    required: false,
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiProperty({
    description: 'Método de verificação',
    required: false,
  })
  @IsOptional()
  @IsString()
  verification_method?: string;

  @ApiProperty({
    description: 'URLs de anexos',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    description: 'Observações',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
