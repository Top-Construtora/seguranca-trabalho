import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { EvaluationReportResponse, SummaryReportResponse } from './dto/report-filters.dto';

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
  ): Promise<EvaluationReportResponse> {
    return this.reportsService.getEvaluationsReport({
      startDate,
      endDate,
      workId,
      type,
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

  @Get('export/pdf')
  @Roles(UserRole.ADMIN)
  async exportReportPDF(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('work_id') workId?: string,
    @Query('type') type?: string,
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
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relatorio-${startDate}-${endDate}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}