import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AccidentSeverity,
  AccidentStatus,
  AccidentType,
} from '../entities/accident.entity';

export class AccidentFiltersDto {
  @ApiProperty({
    description: 'Filtrar por obra',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  work_id?: string;

  @ApiProperty({
    description: 'Filtrar por severidade',
    enum: AccidentSeverity,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccidentSeverity)
  severity?: AccidentSeverity;

  @ApiProperty({
    description: 'Filtrar por status',
    enum: AccidentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;

  @ApiProperty({
    description: 'Filtrar por tipo',
    enum: AccidentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccidentType)
  accident_type?: AccidentType;

  @ApiProperty({
    description: 'Data inicial',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    description: 'Data final',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({
    description: 'Página (paginação)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Itens por página',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
