import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WitnessDto {
  @ApiProperty({ description: 'Nome da testemunha' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Função/cargo da testemunha', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  role?: string;

  @ApiProperty({ description: 'Depoimento da testemunha', required: false })
  @IsOptional()
  @IsString()
  statement?: string;

  @ApiProperty({ description: 'Contato da testemunha', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contact?: string;
}

export class CreateInvestigationDto {
  @ApiProperty({ description: 'ID do acidente' })
  @IsUUID()
  accident_id: string;

  @ApiProperty({ description: 'Data da investigação' })
  @IsDateString()
  investigation_date: string;

  @ApiProperty({ description: 'Causa raiz identificada' })
  @IsString()
  root_cause: string;

  @ApiProperty({
    description: 'Fatores contribuintes',
    required: false,
  })
  @IsOptional()
  @IsString()
  contributing_factors?: string;

  @ApiProperty({
    description: 'Método de análise utilizado (5 Porquês, Ishikawa, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  method_used?: string;

  @ApiProperty({
    description: 'Achados da investigação',
    required: false,
  })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiProperty({
    description: 'Recomendações',
    required: false,
  })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiProperty({
    description: 'Testemunhas',
    type: [WitnessDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WitnessDto)
  witnesses?: WitnessDto[];

  @ApiProperty({
    description: 'Linha do tempo do acidente',
    required: false,
  })
  @IsOptional()
  @IsString()
  timeline?: string;
}
