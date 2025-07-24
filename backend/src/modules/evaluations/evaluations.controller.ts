import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { UpdateAnswersDto } from './dto/update-answers.dto';
import { Evaluation } from './entities/evaluation.entity';

@ApiTags('evaluations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova avaliação' })
  @ApiResponse({ status: 201, description: 'Avaliação criada', type: Evaluation })
  create(@Body() createEvaluationDto: CreateEvaluationDto, @Request() req) {
    return this.evaluationsService.create(createEvaluationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar avaliações' })
  @ApiResponse({ status: 200, description: 'Lista de avaliações', type: [Evaluation] })
  findAll(@Request() req) {
    return this.evaluationsService.findAll(req.user.id, req.user.role);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obter estatísticas das avaliações' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  getStatistics(@Request() req) {
    return this.evaluationsService.getStatistics(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar avaliação por ID' })
  @ApiResponse({ status: 200, description: 'Avaliação encontrada', type: Evaluation })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.evaluationsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar avaliação' })
  @ApiResponse({ status: 200, description: 'Avaliação atualizada', type: Evaluation })
  @ApiResponse({ status: 400, description: 'Avaliação finalizada não pode ser editada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto,
    @Request() req,
  ) {
    return this.evaluationsService.update(
      id,
      updateEvaluationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/answers')
  @ApiOperation({ summary: 'Atualizar respostas da avaliação' })
  @ApiResponse({ status: 200, description: 'Respostas atualizadas', type: Evaluation })
  @ApiResponse({ status: 400, description: 'Avaliação finalizada não pode ser editada' })
  updateAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnswersDto: UpdateAnswersDto,
    @Request() req,
  ) {
    return this.evaluationsService.updateAnswers(
      id,
      updateAnswersDto,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Finalizar avaliação' })
  @ApiResponse({ status: 200, description: 'Avaliação finalizada', type: Evaluation })
  @ApiResponse({ status: 400, description: 'Avaliação incompleta ou já finalizada' })
  complete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.evaluationsService.complete(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir avaliação' })
  @ApiResponse({ status: 200, description: 'Avaliação excluída' })
  @ApiResponse({ status: 400, description: 'Avaliação finalizada não pode ser excluída' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.evaluationsService.remove(id, req.user.id, req.user.role);
  }
}