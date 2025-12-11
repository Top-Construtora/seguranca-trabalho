import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInvestigationDto } from './create-investigation.dto';

export class UpdateInvestigationDto extends PartialType(
  OmitType(CreateInvestigationDto, ['accident_id'] as const),
) {}
