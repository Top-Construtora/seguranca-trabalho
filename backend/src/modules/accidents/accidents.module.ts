import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accident } from './entities/accident.entity';
import { AccidentBodyPart } from './entities/accident-body-part.entity';
import { AccidentEvidence } from './entities/accident-evidence.entity';
import { AccidentInvestigation } from './entities/accident-investigation.entity';
import { AccidentCorrectiveAction } from './entities/accident-corrective-action.entity';
import { Work } from '../works/entities/work.entity';
import { AccidentsController } from './accidents.controller';
import { AccidentsService } from './accidents.service';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { CorrectiveActionsService } from './corrective-actions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Accident,
      AccidentBodyPart,
      AccidentEvidence,
      AccidentInvestigation,
      AccidentCorrectiveAction,
      Work,
    ]),
  ],
  controllers: [
    AccidentsController,
    InvestigationsController,
    CorrectiveActionsController,
  ],
  providers: [AccidentsService, InvestigationsService, CorrectiveActionsService],
  exports: [AccidentsService, InvestigationsService, CorrectiveActionsService],
})
export class AccidentsModule {}
