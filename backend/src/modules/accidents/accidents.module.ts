import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accident } from './entities/accident.entity';
import { AccidentBodyPart } from './entities/accident-body-part.entity';
import { AccidentEvidence } from './entities/accident-evidence.entity';
import { AccidentCorrectiveAction } from './entities/accident-corrective-action.entity';
import { Work } from '../works/entities/work.entity';
import { AccidentsController } from './accidents.controller';
import { AccidentsService } from './accidents.service';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { CorrectiveActionsService } from './corrective-actions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Accident,
      AccidentBodyPart,
      AccidentEvidence,
      AccidentCorrectiveAction,
      Work,
    ]),
  ],
  controllers: [
    AccidentsController,
    CorrectiveActionsController,
  ],
  providers: [AccidentsService, CorrectiveActionsService],
  exports: [AccidentsService, CorrectiveActionsService],
})
export class AccidentsModule {}
