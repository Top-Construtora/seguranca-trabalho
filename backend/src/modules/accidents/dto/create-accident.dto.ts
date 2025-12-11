import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AccidentSeverity,
  AccidentType,
} from '../entities/accident.entity';
import { BodyPart } from '../entities/accident-body-part.entity';

export class BodyPartDto {
  @ApiProperty({
    description: 'Parte do corpo afetada',
    enum: BodyPart,
  })
  @IsEnum(BodyPart)
  body_part: BodyPart;

  @ApiProperty({
    description: 'Descrição da lesão',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  injury_description?: string;
}

export class CreateAccidentDto {
  @ApiProperty({ description: 'Título do acidente' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Descrição detalhada do acidente' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Data e hora do acidente' })
  @IsDateString()
  accident_date: string;

  @ApiProperty({ description: 'ID da obra onde ocorreu o acidente' })
  @IsUUID()
  work_id: string;

  @ApiProperty({
    description: 'Severidade do acidente',
    enum: AccidentSeverity,
  })
  @IsEnum(AccidentSeverity)
  severity: AccidentSeverity;

  @ApiProperty({
    description: 'Tipo do acidente',
    enum: AccidentType,
  })
  @IsEnum(AccidentType)
  accident_type: AccidentType;

  @ApiProperty({
    description: 'Dias de afastamento',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  days_away?: number;

  @ApiProperty({
    description: 'Nome da vítima',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  victim_name?: string;

  @ApiProperty({
    description: 'Função/cargo da vítima',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  victim_role?: string;

  @ApiProperty({
    description: 'Empresa da vítima (se terceirizado)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  victim_company?: string;

  @ApiProperty({
    description: 'Detalhes do local do acidente',
    required: false,
  })
  @IsOptional()
  @IsString()
  location_details?: string;

  @ApiProperty({
    description: 'Ações imediatas tomadas',
    required: false,
  })
  @IsOptional()
  @IsString()
  immediate_actions?: string;

  @ApiProperty({
    description: 'Partes do corpo afetadas',
    type: [BodyPartDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BodyPartDto)
  body_parts?: BodyPartDto[];
}
