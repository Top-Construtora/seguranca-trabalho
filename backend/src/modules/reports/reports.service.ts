import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evaluation } from '../evaluations/entities/evaluation.entity';
import { Work } from '../works/entities/work.entity';
import { QuestionType } from '../evaluations/entities/question.entity';
import { ReportFilters, EvaluationReportResponse, SummaryReportResponse } from './dto/report-filters.dto';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
  ) {}

  async getEvaluationsReport(filters: ReportFilters): Promise<EvaluationReportResponse> {
    const query = this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.work', 'work')
      .leftJoinAndSelect('evaluation.user', 'user')
      .leftJoinAndSelect('evaluation.answers', 'answers')
      .leftJoinAndSelect('answers.question', 'question')
      .where('evaluation.status = :status', { status: 'completed' });

    if (filters.startDate && filters.endDate) {
      query.andWhere('evaluation.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.workId) {
      query.andWhere('evaluation.work_id = :workId', { workId: filters.workId });
    }

    if (filters.type) {
      query.andWhere('evaluation.type = :type', { type: filters.type });
    }

    const evaluations = await query
      .orderBy('evaluation.date', 'DESC')
      .getMany();

    return {
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        date: evaluation.date.toISOString(),
        type: evaluation.type,
        employees_count: evaluation.employees_count,
        total_penalty: evaluation.total_penalty,
        notes: evaluation.notes,
        status: evaluation.status,
        work: {
          id: evaluation.work.id,
          name: evaluation.work.name,
        },
        user: {
          id: evaluation.user.id,
          name: evaluation.user.name,
        },
        answers: evaluation.answers.map(answer => ({
          id: answer.id,
          value: answer.answer,
          question: {
            id: answer.question.id,
            text: answer.question.text,
            weight: answer.question.weight,
          },
        })),
      })),
      total: evaluations.length,
      filters,
    };
  }

  async getSummaryReport(filters: ReportFilters): Promise<SummaryReportResponse> {
    const query = this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.work', 'work')
      .where('evaluation.status = :status', { status: 'completed' });

    if (filters.startDate && filters.endDate) {
      query.andWhere('evaluation.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const evaluations = await query.getMany();

    const summary = {
      total_evaluations: evaluations.length,
      evaluations_by_type: {
        obra: evaluations.filter(e => e.type === QuestionType.OBRA).length,
        alojamento: evaluations.filter(e => e.type === QuestionType.ALOJAMENTO).length,
      },
      evaluations_by_work: evaluations.reduce((acc, evaluation) => {
        const workName = evaluation.work?.name || 'Obra não encontrada';
        acc[workName] = (acc[workName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      average_penalty: evaluations.length > 0 
        ? evaluations.reduce((sum, e) => sum + (Number(e.total_penalty) || 0), 0) / evaluations.length
        : 0,
      total_penalty: evaluations.reduce((sum, e) => sum + (Number(e.total_penalty) || 0), 0),
    };

    return summary;
  }

  async generatePDFReport(filters: ReportFilters): Promise<Buffer> {
    const reportData = await this.getEvaluationsReport(filters);
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Relatório de Avaliações de Segurança', { align: 'center' });
      doc.moveDown();

      if (filters.startDate && filters.endDate) {
        doc.fontSize(12).text(`Período: ${filters.startDate} a ${filters.endDate}`);
      }
      doc.text(`Total de avaliações: ${reportData.total}`);
      doc.moveDown();

      // Evaluations data
      reportData.evaluations.forEach((evaluation, index) => {
        if (index > 0) doc.addPage();
        
        doc.fontSize(14).text(`Avaliação ${index + 1}`, { underline: true });
        doc.fontSize(12)
          .text(`Obra: ${evaluation.work?.name || 'N/A'}`)
          .text(`Data: ${new Date(evaluation.date).toLocaleDateString('pt-BR')}`)
          .text(`Tipo: ${evaluation.type}`)
          .text(`Funcionários: ${evaluation.employees_count}`)
          .text(`Penalidade Total: ${evaluation.total_penalty || 0}`)
          .text(`Avaliador: ${evaluation.user?.name || 'N/A'}`);
        
        if (evaluation.notes) {
          doc.moveDown().text(`Observações: ${evaluation.notes}`);
        }
      });

      doc.end();
    });
  }

  async generateExcelReport(filters: ReportFilters): Promise<Buffer> {
    const reportData = await this.getEvaluationsReport(filters);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório de Avaliações');

    // Headers
    worksheet.columns = [
      { header: 'Data', key: 'date', width: 12 },
      { header: 'Obra', key: 'work', width: 30 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Funcionários', key: 'employees', width: 12 },
      { header: 'Penalidade Total', key: 'penalty', width: 15 },
      { header: 'Avaliador', key: 'evaluator', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Observações', key: 'notes', width: 40 },
    ];

    // Data
    reportData.evaluations.forEach((evaluation) => {
      worksheet.addRow({
        date: new Date(evaluation.date).toLocaleDateString('pt-BR'),
        work: evaluation.work?.name || 'N/A',
        type: evaluation.type,
        employees: evaluation.employees_count,
        penalty: evaluation.total_penalty || 0,
        evaluator: evaluation.user?.name || 'N/A',
        status: evaluation.status,
        notes: evaluation.notes || '',
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
}