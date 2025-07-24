import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { Question, QuestionType } from '../evaluations/entities/question.entity';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova pergunta' })
  @ApiResponse({ status: 201, description: 'Pergunta criada com sucesso', type: Question })
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as perguntas' })
  @ApiQuery({ name: 'type', required: false, enum: QuestionType })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de perguntas', type: [Question] })
  findAll(
    @Query('type') type?: QuestionType,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const includeInactive = activeOnly === 'false';
    return this.questionsService.findAll(type, !includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pergunta por ID' })
  @ApiResponse({ status: 200, description: 'Pergunta encontrada', type: Question })
  @ApiResponse({ status: 404, description: 'Pergunta não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar pergunta' })
  @ApiResponse({ status: 200, description: 'Pergunta atualizada', type: Question })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ativar/desativar pergunta' })
  @ApiResponse({ status: 200, description: 'Status alterado', type: Question })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir pergunta' })
  @ApiResponse({ status: 200, description: 'Pergunta excluída' })
  @ApiResponse({ status: 400, description: 'Pergunta possui respostas associadas' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.remove(id);
  }

  @Post('reorder')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reordenar perguntas' })
  @ApiResponse({ status: 200, description: 'Perguntas reordenadas', type: [Question] })
  reorder(@Body() reorderDto: ReorderQuestionsDto) {
    return this.questionsService.reorderQuestions(reorderDto);
  }

  @Get('weight/:weight')
  @ApiOperation({ summary: 'Buscar perguntas por peso' })
  @ApiQuery({ name: 'type', required: true, enum: QuestionType })
  @ApiResponse({ status: 200, description: 'Perguntas encontradas', type: [Question] })
  findByWeight(
    @Param('weight') weight: number,
    @Query('type') type: QuestionType,
  ) {
    return this.questionsService.getQuestionsByWeight(type, weight);
  }
}