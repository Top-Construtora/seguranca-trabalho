import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccidentInvestigation } from './entities/accident-investigation.entity';
import { Accident, AccidentStatus } from './entities/accident.entity';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class InvestigationsService {
  constructor(
    @InjectRepository(AccidentInvestigation)
    private readonly investigationRepository: Repository<AccidentInvestigation>,
    @InjectRepository(Accident)
    private readonly accidentRepository: Repository<Accident>,
  ) {}

  async create(
    createInvestigationDto: CreateInvestigationDto,
    userId: string,
    userRole: UserRole,
  ): Promise<AccidentInvestigation> {
    // Apenas admin pode criar investigações
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem criar investigações',
      );
    }

    // Verificar se o acidente existe
    const accident = await this.accidentRepository.findOne({
      where: { id: createInvestigationDto.accident_id },
    });

    if (!accident) {
      throw new NotFoundException('Acidente não encontrado');
    }

    // Atualizar status do acidente para "em investigação"
    await this.accidentRepository.update(accident.id, {
      status: AccidentStatus.EM_INVESTIGACAO,
    });

    // Criar investigação
    const investigation = this.investigationRepository.create({
      accident_id: createInvestigationDto.accident_id,
      investigator_id: userId,
      investigation_date: new Date(createInvestigationDto.investigation_date),
      root_cause: createInvestigationDto.root_cause,
      contributing_factors: createInvestigationDto.contributing_factors,
      method_used: createInvestigationDto.method_used,
      findings: createInvestigationDto.findings,
      recommendations: createInvestigationDto.recommendations,
      witnesses: createInvestigationDto.witnesses || [],
      timeline: createInvestigationDto.timeline,
    });

    const saved = await this.investigationRepository.save(investigation);

    return this.findOne(saved.id);
  }

  async findByAccident(accidentId: string): Promise<AccidentInvestigation[]> {
    return this.investigationRepository.find({
      where: { accident_id: accidentId },
      relations: ['investigator', 'corrective_actions'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AccidentInvestigation> {
    const investigation = await this.investigationRepository.findOne({
      where: { id },
      relations: [
        'accident',
        'investigator',
        'corrective_actions',
        'corrective_actions.responsible',
      ],
    });

    if (!investigation) {
      throw new NotFoundException('Investigação não encontrada');
    }

    return investigation;
  }

  async update(
    id: string,
    updateInvestigationDto: UpdateInvestigationDto,
    userId: string,
    userRole: UserRole,
  ): Promise<AccidentInvestigation> {
    const investigation = await this.findOne(id);

    // Apenas admin ou o investigador pode editar
    if (
      userRole !== UserRole.ADMIN &&
      investigation.investigator_id !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta investigação',
      );
    }

    const updateData: Partial<AccidentInvestigation> = {};

    if (updateInvestigationDto.investigation_date) {
      updateData.investigation_date = new Date(
        updateInvestigationDto.investigation_date,
      );
    }
    if (updateInvestigationDto.root_cause) {
      updateData.root_cause = updateInvestigationDto.root_cause;
    }
    if (updateInvestigationDto.contributing_factors !== undefined) {
      updateData.contributing_factors =
        updateInvestigationDto.contributing_factors;
    }
    if (updateInvestigationDto.method_used !== undefined) {
      updateData.method_used = updateInvestigationDto.method_used;
    }
    if (updateInvestigationDto.findings !== undefined) {
      updateData.findings = updateInvestigationDto.findings;
    }
    if (updateInvestigationDto.recommendations !== undefined) {
      updateData.recommendations = updateInvestigationDto.recommendations;
    }
    if (updateInvestigationDto.witnesses !== undefined) {
      updateData.witnesses = updateInvestigationDto.witnesses;
    }
    if (updateInvestigationDto.timeline !== undefined) {
      updateData.timeline = updateInvestigationDto.timeline;
    }

    await this.investigationRepository.update(id, updateData);

    return this.findOne(id);
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const investigation = await this.findOne(id);

    // Apenas admin pode excluir
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem excluir investigações',
      );
    }

    await this.investigationRepository.remove(investigation);
  }
}
