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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { CorrectiveActionStatus } from './entities/accident-corrective-action.entity';

@ApiTags('accident-corrective-actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CorrectiveActionsController {
  constructor(
    private readonly correctiveActionsService: CorrectiveActionsService,
  ) {}

  // === Rotas sob /accidents/:id/corrective-actions ===

  @Post('accidents/:accidentId/corrective-actions')
  @ApiOperation({ summary: 'Criar ação corretiva para um acidente' })
  @ApiResponse({ status: 201, description: 'Ação corretiva criada' })
  create(
    @Param('accidentId', ParseUUIDPipe) accidentId: string,
    @Body() createDto: CreateCorrectiveActionDto,
    @Request() req,
  ) {
    createDto.accident_id = accidentId;
    return this.correctiveActionsService.create(createDto, req.user.id);
  }

  @Get('accidents/:accidentId/corrective-actions')
  @ApiOperation({ summary: 'Listar ações corretivas de um acidente' })
  @ApiResponse({ status: 200, description: 'Lista de ações corretivas' })
  findByAccident(@Param('accidentId', ParseUUIDPipe) accidentId: string) {
    return this.correctiveActionsService.findByAccident(accidentId);
  }

  // === Rotas sob /corrective-actions ===

  @Get('corrective-actions')
  @ApiOperation({ summary: 'Listar todas as ações corretivas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de ações corretivas' })
  @ApiQuery({ name: 'status', enum: CorrectiveActionStatus, required: false })
  @ApiQuery({ name: 'responsible_id', required: false })
  @ApiQuery({ name: 'accident_id', required: false })
  @ApiQuery({ name: 'overdue', type: Boolean, required: false })
  findAll(
    @Query('status') status?: CorrectiveActionStatus,
    @Query('responsible_id') responsible_id?: string,
    @Query('accident_id') accident_id?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.correctiveActionsService.findAll({
      status,
      responsible_id,
      accident_id,
      overdue: overdue === 'true',
    });
  }

  @Get('corrective-actions/my-actions')
  @ApiOperation({ summary: 'Listar minhas ações corretivas pendentes' })
  @ApiResponse({ status: 200, description: 'Lista de ações do usuário' })
  findMyActions(@Request() req) {
    return this.correctiveActionsService.findMyActions(req.user.id);
  }

  @Get('corrective-actions/statistics')
  @ApiOperation({ summary: 'Estatísticas das ações corretivas' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  getStatistics() {
    return this.correctiveActionsService.getStatistics();
  }

  @Get('corrective-actions/:id')
  @ApiOperation({ summary: 'Buscar ação corretiva por ID' })
  @ApiResponse({ status: 200, description: 'Ação corretiva encontrada' })
  @ApiResponse({ status: 404, description: 'Ação corretiva não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.correctiveActionsService.findOne(id);
  }

  @Patch('corrective-actions/:id')
  @ApiOperation({ summary: 'Atualizar ação corretiva' })
  @ApiResponse({ status: 200, description: 'Ação corretiva atualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCorrectiveActionDto,
    @Request() req,
  ) {
    return this.correctiveActionsService.update(
      id,
      updateDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('corrective-actions/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir ação corretiva (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Ação corretiva excluída' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.correctiveActionsService.remove(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Post('corrective-actions/update-overdue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar status de ações atrasadas' })
  @ApiResponse({ status: 200, description: 'Ações atualizadas' })
  updateOverdue() {
    return this.correctiveActionsService.updateOverdueActions();
  }
}
