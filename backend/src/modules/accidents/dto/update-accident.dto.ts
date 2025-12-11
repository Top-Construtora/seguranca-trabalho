import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAccidentDto } from './create-accident.dto';
import { AccidentStatus } from '../entities/accident.entity';

export class UpdateAccidentDto extends PartialType(CreateAccidentDto) {
  @ApiProperty({
    description: 'Status do acidente',
    enum: AccidentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;
}
