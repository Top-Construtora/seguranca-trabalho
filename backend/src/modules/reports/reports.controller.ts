import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { EvaluationReportResponse, SummaryReportResponse, ConformityReportResponse, LastEvaluationsConformityReportResponse } from './dto/report-filters.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('evaluations')
  @Roles(UserRole.ADMIN)
  async getEvaluationsReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
    @Query('accommodation_id') accommodationId?: string,
    @Query('user_id') userId?: string,
  ): Promise<EvaluationReportResponse> {
    return this.reportsService.getEvaluationsReport({
      startDate,
      endDate,
      workId,
      type,
      accommodationId,
      userId,
    });
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  async getSummaryReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<SummaryReportResponse> {
    return this.reportsService.getSummaryReport({
      startDate,
      endDate,
    });
  }

  @Get('conformity')
  @Roles(UserRole.ADMIN)
  async getConformityReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
    @Query('accommodation_id') accommodationId?: string,
    @Query('user_id') userId?: string,
  ): Promise<ConformityReportResponse> {
    return this.reportsService.getConformityReport({
      startDate,
      endDate,
      workId,
      type,
      accommodationId,
      userId,
    });
  }

  @Get('conformity/last-evaluations')
  @Roles(UserRole.ADMIN)
  async getLastEvaluationsConformityReport(
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
    @Query('accommodation_id') accommodationId?: string,
    @Query('user_id') userId?: string,
  ): Promise<LastEvaluationsConformityReportResponse> {
    return this.reportsService.getLastEvaluationsConformityReport({
      workId,
      type,
      accommodationId,
      userId,
    });
  }

  @Get('export/pdf')
  @Roles(UserRole.ADMIN)
  async exportReportPDF(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
    @Query('accommodation_id') accommodationId?: string,
    @Query('user_id') userId?: string,
    @Res() res?: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Data inicial e final são obrigatórias');
    }

    const buffer = await this.reportsService.generatePDFReport({
      startDate,
      endDate,
      workId,
      type,
      accommodationId,
      userId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${startDate}-${endDate}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('export/excel')
  @Roles(UserRole.ADMIN)
  async exportReportExcel(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
    @Query('accommodation_id') accommodationId?: string,
    @Query('user_id') userId?: string,
    @Res() res?: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Data inicial e final são obrigatórias');
    }

    const buffer = await this.reportsService.generateExcelReport({
      startDate,
      endDate,
      workId,
      type,
      accommodationId,
      userId,
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relatorio-${startDate}-${endDate}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('evaluation/:id/pdf')
  @Roles(UserRole.ADMIN, UserRole.AVALIADOR)
  async exportEvaluationPDF(
    @Param('id') id: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.reportsService.generateEvaluationPDFReport(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-avaliacao-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

}