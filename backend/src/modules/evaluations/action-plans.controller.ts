import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ActionPlansService, CreateActionPlanDto, UpdateActionPlanDto } from './action-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('action-plans')
@UseGuards(JwtAuthGuard)
export class ActionPlansController {
  constructor(private readonly actionPlansService: ActionPlansService) {}

  @Post()
  create(@Body() createDto: CreateActionPlanDto) {
    return this.actionPlansService.create(createDto);
  }

  @Get('answer/:answerId')
  findByAnswerId(@Param('answerId') answerId: string) {
    return this.actionPlansService.findByAnswerId(answerId);
  }

  @Get('evaluation/:evaluationId')
  findByEvaluationId(@Param('evaluationId') evaluationId: string) {
    return this.actionPlansService.findByEvaluationId(evaluationId);
  }

  @Get('work/:workId')
  findByWorkId(@Param('workId') workId: string) {
    return this.actionPlansService.findByWorkId(workId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionPlansService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateActionPlanDto) {
    return this.actionPlansService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actionPlansService.remove(id);
  }
}