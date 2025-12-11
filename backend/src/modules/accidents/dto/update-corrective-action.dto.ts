import { PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCorrectiveActionDto } from './create-corrective-action.dto';
import { CorrectiveActionStatus } from '../entities/accident-corrective-action.entity';

export class UpdateCorrectiveActionDto extends PartialType(
  OmitType(CreateCorrectiveActionDto, ['accident_id'] as const),
) {
  @ApiProperty({
    description: 'Status da ação corretiva',
    enum: CorrectiveActionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(CorrectiveActionStatus)
  status?: CorrectiveActionStatus;

  @ApiProperty({
    description: 'Data de conclusão',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completion_date?: string;

  @ApiProperty({
    description: 'Resultado da verificação',
    required: false,
  })
  @IsOptional()
  verification_result?: string;
}
