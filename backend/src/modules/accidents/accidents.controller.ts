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
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { AccidentFiltersDto } from './dto/accident-filters.dto';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { Accident } from './entities/accident.entity';

@ApiTags('accidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accidents')
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar novo acidente' })
  @ApiResponse({ status: 201, description: 'Acidente registrado', type: Accident })
  create(@Body() createAccidentDto: CreateAccidentDto, @Request() req) {
    return this.accidentsService.create(createAccidentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar acidentes com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de acidentes' })
  findAll(@Query() filters: AccidentFiltersDto, @Request() req) {
    return this.accidentsService.findAll(filters, req.user.id, req.user.role);
  }

  // === Dashboard Endpoints ===

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Resumo geral do dashboard' })
  @ApiResponse({ status: 200, description: 'Resumo de indicadores' })
  @ApiQuery({ name: 'work_id', required: false })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  getDashboardSummary(
    @Query('work_id') work_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.accidentsService.getDashboardSummary({
      work_id,
      start_date,
      end_date,
    });
  }

  @Get('dashboard/by-work')
  @ApiOperation({ summary: 'Dias de afastamento por obra' })
  @ApiResponse({ status: 200, description: 'Dados por obra' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  getDaysAwayByWork(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.accidentsService.getDaysAwayByWork({ start_date, end_date });
  }

  @Get('dashboard/by-body-part')
  @ApiOperation({ summary: 'Ocorrências por parte do corpo' })
  @ApiResponse({ status: 200, description: 'Dados por parte do corpo' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  getByBodyPart(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.accidentsService.getByBodyPart({ start_date, end_date });
  }

  @Get('dashboard/by-severity')
  @ApiOperation({ summary: 'Total por severidade' })
  @ApiResponse({ status: 200, description: 'Dados por severidade' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  getBySeverity(
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.accidentsService.getBySeverity({ start_date, end_date });
  }

  @Get('dashboard/timeline')
  @ApiOperation({ summary: 'Linha do tempo de acidentes' })
  @ApiResponse({ status: 200, description: 'Timeline de acidentes' })
  @ApiQuery({ name: 'work_id', required: false })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTimeline(
    @Query('work_id') work_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('limit') limit?: number,
  ) {
    return this.accidentsService.getTimeline({
      work_id,
      start_date,
      end_date,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('dashboard/monthly-trend')
  @ApiOperation({ summary: 'Tendência mensal de acidentes' })
  @ApiResponse({ status: 200, description: 'Dados mensais' })
  @ApiQuery({ name: 'year', required: false })
  getMonthlyTrend(@Query('year') year?: number) {
    return this.accidentsService.getMonthlyTrend(year ? Number(year) : undefined);
  }

  // === CRUD Endpoints ===

  @Get(':id')
  @ApiOperation({ summary: 'Buscar acidente por ID' })
  @ApiResponse({ status: 200, description: 'Acidente encontrado', type: Accident })
  @ApiResponse({ status: 404, description: 'Acidente não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar acidente' })
  @ApiResponse({ status: 200, description: 'Acidente atualizado', type: Accident })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccidentDto: UpdateAccidentDto,
    @Request() req,
  ) {
    return this.accidentsService.update(
      id,
      updateAccidentDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir acidente (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Acidente excluído' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.accidentsService.remove(id, req.user.id, req.user.role);
  }

  // === Evidências ===

  @Post(':id/evidences')
  @ApiOperation({ summary: 'Adicionar evidência ao acidente' })
  @ApiResponse({ status: 201, description: 'Evidência adicionada' })
  addEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createEvidenceDto: CreateEvidenceDto,
    @Request() req,
  ) {
    // Garantir que o accident_id do DTO corresponde ao da URL
    createEvidenceDto.accident_id = id;
    return this.accidentsService.addEvidence(createEvidenceDto, req.user.id);
  }

  @Get(':id/evidences')
  @ApiOperation({ summary: 'Listar evidências do acidente' })
  @ApiResponse({ status: 200, description: 'Lista de evidências' })
  getEvidences(@Param('id', ParseUUIDPipe) id: string) {
    return this.accidentsService.getEvidences(id);
  }

  @Delete(':id/evidences/:evidenceId')
  @ApiOperation({ summary: 'Remover evidência' })
  @ApiResponse({ status: 200, description: 'Evidência removida' })
  removeEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Request() req,
  ) {
    return this.accidentsService.removeEvidence(
      id,
      evidenceId,
      req.user.id,
      req.user.role,
    );
  }
}
