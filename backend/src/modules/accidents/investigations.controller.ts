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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';

@ApiTags('accident-investigations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accidents')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post(':accidentId/investigations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar investigação para um acidente' })
  @ApiResponse({ status: 201, description: 'Investigação criada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(
    @Param('accidentId', ParseUUIDPipe) accidentId: string,
    @Body() createInvestigationDto: CreateInvestigationDto,
    @Request() req,
  ) {
    createInvestigationDto.accident_id = accidentId;
    return this.investigationsService.create(
      createInvestigationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':accidentId/investigations')
  @ApiOperation({ summary: 'Listar investigações de um acidente' })
  @ApiResponse({ status: 200, description: 'Lista de investigações' })
  findByAccident(@Param('accidentId', ParseUUIDPipe) accidentId: string) {
    return this.investigationsService.findByAccident(accidentId);
  }

  @Get('investigations/:id')
  @ApiOperation({ summary: 'Buscar investigação por ID' })
  @ApiResponse({ status: 200, description: 'Investigação encontrada' })
  @ApiResponse({ status: 404, description: 'Investigação não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.investigationsService.findOne(id);
  }

  @Patch('investigations/:id')
  @ApiOperation({ summary: 'Atualizar investigação' })
  @ApiResponse({ status: 200, description: 'Investigação atualizada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvestigationDto: UpdateInvestigationDto,
    @Request() req,
  ) {
    return this.investigationsService.update(
      id,
      updateInvestigationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('investigations/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir investigação (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Investigação excluída' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.investigationsService.remove(id, req.user.id, req.user.role);
  }
}
