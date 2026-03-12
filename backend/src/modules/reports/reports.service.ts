import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evaluation } from '../evaluations/entities/evaluation.entity';
import { Work } from '../works/entities/work.entity';
import { QuestionType } from '../evaluations/entities/question.entity';
import { AnswerValue } from '../evaluations/entities/answer.entity';
import { ReportFilters, EvaluationReportResponse, SummaryReportResponse, ConformityReportResponse, LastEvaluationsConformityReportResponse, EvaluationConformityData } from './dto/report-filters.dto';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

/**
 * Formata uma data string yyyy-MM-dd para dd/MM/yyyy (sem conversão de timezone)
 */
function formatDateBR(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const str = typeof dateStr === 'object' ? dateStr.toISOString().split('T')[0] : String(dateStr);
  // Se já está no formato yyyy-MM-dd, converte direto
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return str;
}
import * as path from 'path';
import * as fs from 'fs';

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
      .leftJoinAndSelect('evaluation.accommodation', 'accommodation')
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

    if (filters.accommodationId) {
      query.andWhere('evaluation.accommodation_id = :accommodationId', { accommodationId: filters.accommodationId });
    }

    if (filters.userId) {
      query.andWhere('evaluation.user_id = :userId', { userId: filters.userId });
    }

    const evaluations = await query
      .orderBy('evaluation.date', 'DESC')
      .getMany();

    return {
      evaluations: evaluations.map(evaluation => ({
        id: evaluation.id,
        date: String(evaluation.date),
        type: evaluation.type,
        employees_count: evaluation.employees_count,
        total_penalty: evaluation.total_penalty,
        notes: evaluation.notes,
        status: evaluation.status,
        work: evaluation.work ? {
          id: evaluation.work.id,
          name: evaluation.work.name,
        } : null,
        accommodation: evaluation.accommodation ? {
          id: evaluation.accommodation.id,
          name: evaluation.accommodation.name,
        } : undefined,
        user: evaluation.user ? {
          id: evaluation.user.id,
          name: evaluation.user.name,
        } : null,
        answers: evaluation.answers ? evaluation.answers.map(answer => ({
          id: answer.id,
          value: answer.answer,
          question: answer.question ? {
            id: answer.question.id,
            text: answer.question.text,
            weight: answer.question.weight,
          } : null,
        })) : [],
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

  async getConformityReport(filters: ReportFilters): Promise<ConformityReportResponse> {
    const query = this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.answers', 'answers')
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

    if (filters.accommodationId) {
      query.andWhere('evaluation.accommodation_id = :accommodationId', { accommodationId: filters.accommodationId });
    }

    if (filters.userId) {
      query.andWhere('evaluation.user_id = :userId', { userId: filters.userId });
    }

    const evaluations = await query.getMany();

    let conforme = 0;
    let nao_conforme = 0;

    evaluations.forEach(evaluation => {
      evaluation.answers.forEach(answer => {
        if (answer.answer === AnswerValue.SIM) {
          conforme++;
        } else if (answer.answer === AnswerValue.NAO) {
          nao_conforme++;
        }
        // Ignoramos AnswerValue.NA (não se aplica)
      });
    });

    const total_applicable = conforme + nao_conforme;
    const conforme_percentage = total_applicable > 0 ? (conforme / total_applicable) * 100 : 0;
    const nao_conforme_percentage = total_applicable > 0 ? (nao_conforme / total_applicable) * 100 : 0;

    return {
      conforme,
      nao_conforme,
      total_applicable,
      conforme_percentage: Math.round(conforme_percentage * 100) / 100, // Arredondar para 2 casas decimais
      nao_conforme_percentage: Math.round(nao_conforme_percentage * 100) / 100,
    };
  }

  async getLastEvaluationsConformityReport(filters: Omit<ReportFilters, 'startDate' | 'endDate'>): Promise<LastEvaluationsConformityReportResponse> {
    const query = this.evaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.work', 'work')
      .leftJoinAndSelect('evaluation.answers', 'answers')
      .where('evaluation.status = :status', { status: 'completed' });

    if (filters.workId) {
      query.andWhere('evaluation.work_id = :workId', { workId: filters.workId });
    }

    if (filters.type) {
      query.andWhere('evaluation.type = :type', { type: filters.type });
    }

    if (filters.accommodationId) {
      query.andWhere('evaluation.accommodation_id = :accommodationId', { accommodationId: filters.accommodationId });
    }

    if (filters.userId) {
      query.andWhere('evaluation.user_id = :userId', { userId: filters.userId });
    }

    // Buscar as 3 avaliações mais recentes
    const evaluations = await query
      .orderBy('evaluation.date', 'DESC')
      .addOrderBy('evaluation.created_at', 'DESC')
      .limit(3)
      .getMany();

    let totalConforme = 0;
    let totalNaoConforme = 0;

    const evaluations_data: EvaluationConformityData[] = evaluations.map(evaluation => {
      let conforme = 0;
      let nao_conforme = 0;

      evaluation.answers.forEach(answer => {
        if (answer.answer === AnswerValue.SIM) {
          conforme++;
          totalConforme++;
        } else if (answer.answer === AnswerValue.NAO) {
          nao_conforme++;
          totalNaoConforme++;
        }
      });

      const total_applicable = conforme + nao_conforme;
      const conforme_percentage = total_applicable > 0 ? (conforme / total_applicable) * 100 : 0;
      const nao_conforme_percentage = total_applicable > 0 ? (nao_conforme / total_applicable) * 100 : 0;

      return {
        evaluation_id: evaluation.id,
        date: String(evaluation.date),
        work_name: evaluation.work?.name || 'Obra não encontrada',
        conforme,
        nao_conforme,
        total_applicable,
        conforme_percentage: Math.round(conforme_percentage * 100) / 100,
        nao_conforme_percentage: Math.round(nao_conforme_percentage * 100) / 100,
      };
    });

    // Calcular totais gerais
    const totalApplicable = totalConforme + totalNaoConforme;
    const totalConformePercentage = totalApplicable > 0 ? (totalConforme / totalApplicable) * 100 : 0;
    const totalNaoConformePercentage = totalApplicable > 0 ? (totalNaoConforme / totalApplicable) * 100 : 0;

    return {
      evaluations_data,
      total: {
        conforme: totalConforme,
        nao_conforme: totalNaoConforme,
        total_applicable: totalApplicable,
        conforme_percentage: Math.round(totalConformePercentage * 100) / 100,
        nao_conforme_percentage: Math.round(totalNaoConformePercentage * 100) / 100,
      },
    };
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
          .text(`Data: ${formatDateBR(evaluation.date)}`)
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
        date: formatDateBR(evaluation.date),
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

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  private getLogoPath(): string | null {
    // Try multiple locations for the logo
    const paths = [
      path.join(__dirname, '..', '..', 'assets', 'logo.png'),
      path.join(process.cwd(), 'src', 'assets', 'logo.png'),
      path.join(process.cwd(), 'dist', 'assets', 'logo.png'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  async generateEvaluationPDFReport(evaluationId: string): Promise<Buffer> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id: evaluationId },
      relations: ['work', 'accommodation', 'user', 'answers', 'answers.question'],
    });

    if (!evaluation) {
      throw new Error('Avaliação não encontrada');
    }

    // Pre-fetch all evidence images
    const evidenceImages = new Map<string, Buffer>();
    for (const answer of evaluation.answers) {
      if (answer.evidence_urls?.length > 0) {
        await Promise.all(answer.evidence_urls.map(async (url) => {
          const buffer = await this.fetchImageBuffer(url);
          if (buffer) evidenceImages.set(url, buffer);
        }));
      }
    }

    const logoPath = this.getLogoPath();

    // Colors — matches the app sidebar (#1e2938)
    const PRIMARY = '#1e2938';
    const ACCENT = '#b89b5e';
    const GREEN = '#16a34a';
    const RED = '#dc2626';
    const GRAY = '#6b7280';
    const LIGHT_BG = '#f8f9fa';
    const BORDER = '#e5e7eb';
    const CARD_BG = '#ffffff';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      const LEFT = doc.page.margins.left;
      const PAGE_W = doc.page.width - LEFT - doc.page.margins.right;
      const CONTENT_BOTTOM = doc.page.height - 50;

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── Helper: ensure space or new page ──
      const ensureSpace = (needed: number) => {
        if (doc.y + needed > CONTENT_BOTTOM) {
          doc.addPage();
        }
      };

      // ══════════════════════════════════════════
      // PAGE 1 — HEADER
      // ══════════════════════════════════════════

      // Header band with primary color
      doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY);

      // Logo
      if (logoPath) {
        try {
          doc.image(logoPath, LEFT, 15, { height: 70 });
        } catch { /* skip if logo fails */ }
      }

      // Gold accent line
      doc.rect(0, 100, doc.page.width, 3).fill(ACCENT);

      // Title section
      doc.y = 118;
      doc.fillColor(PRIMARY).fontSize(18).text('RELATÓRIO DE AVALIAÇÃO', LEFT, doc.y, { align: 'center', width: PAGE_W });
      doc.fillColor(ACCENT).fontSize(11).text(
        evaluation.type === 'obra' ? 'Segurança em Obra' : 'Segurança em Alojamento',
        { align: 'center', width: PAGE_W }
      );
      doc.moveDown(0.8);

      // ── INFO SECTION ──
      const infoY = doc.y;
      doc.rect(LEFT, infoY, PAGE_W, 100).fill(LIGHT_BG).strokeColor(BORDER).lineWidth(0.5).stroke();

      const colW = PAGE_W / 2;
      const infoItems = [
        { label: 'Obra/Local', value: evaluation.work?.name || 'N/A' },
        { label: 'Número', value: evaluation.work?.number || 'N/A' },
        { label: 'Data da Avaliação', value: formatDateBR(evaluation.date) },
        { label: 'Funcionários', value: String(evaluation.employees_count) },
        { label: 'Avaliador', value: evaluation.user?.name || 'N/A' },
        { label: 'Tipo', value: evaluation.type === 'obra' ? 'Obra' : 'Alojamento' },
      ];

      let iy = infoY + 10;
      infoItems.forEach((item, i) => {
        const col = i % 2;
        const x = LEFT + 12 + col * colW;
        doc.fillColor(GRAY).fontSize(7).text(item.label.toUpperCase(), x, iy);
        doc.fillColor(PRIMARY).fontSize(10).text(item.value, x, iy + 10, { width: colW - 24 });
        if (col === 1) iy += 30;
      });
      if (infoItems.length % 2 !== 0) iy += 30;

      doc.y = infoY + 108;

      // ── RESULTS SECTION ──
      if (evaluation.status === 'completed') {
        doc.moveDown(0.5);

        const conformeCount = evaluation.answers.filter(a => a.answer === AnswerValue.SIM).length;
        const naoConformeCount = evaluation.answers.filter(a => a.answer === AnswerValue.NAO).length;
        const naCount = evaluation.answers.filter(a => a.answer === AnswerValue.NA).length;

        doc.fillColor(PRIMARY).fontSize(13).text('Resumo dos Resultados', LEFT, doc.y);
        doc.moveDown(0.5);

        const boxW = (PAGE_W - 30) / 4;
        const boxH = 50;
        const boxY = doc.y;
        const boxes = [
          { label: 'Conformes', value: String(conformeCount), color: GREEN, bg: '#f0fdf4' },
          { label: 'Não Conformes', value: String(naoConformeCount), color: RED, bg: '#fef2f2' },
          { label: 'N/A', value: String(naCount), color: GRAY, bg: '#f9fafb' },
          { label: 'Total', value: String(evaluation.answers.length), color: PRIMARY, bg: '#eef1f5' },
        ];

        boxes.forEach((box, i) => {
          const bx = LEFT + i * (boxW + 10);
          doc.rect(bx, boxY, boxW, boxH).fill(box.bg);
          doc.rect(bx, boxY, boxW, 3).fill(box.color);
          doc.fillColor(box.color).fontSize(18).text(box.value, bx, boxY + 10, { width: boxW, align: 'center' });
          doc.fillColor(GRAY).fontSize(7).text(box.label.toUpperCase(), bx, boxY + 32, { width: boxW, align: 'center' });
        });

        doc.y = boxY + boxH + 10;

        // Penalty box
        if (evaluation.total_penalty !== null) {
          const penY = doc.y;
          doc.rect(LEFT, penY, PAGE_W, 35).fill('#fef2f2').strokeColor('#fecaca').lineWidth(0.5).stroke();
          doc.fillColor(GRAY).fontSize(8).text('MULTA TOTAL ESTIMADA', LEFT + 12, penY + 6);
          doc.fillColor(RED).fontSize(14).text(
            `R$ ${Number(evaluation.total_penalty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            LEFT + 12, penY + 18
          );
          doc.y = penY + 42;
        }
      }

      // ══════════════════════════════════════════
      // QUESTIONS SECTION
      // ══════════════════════════════════════════
      doc.moveDown(0.8);
      doc.fillColor(PRIMARY).fontSize(13).text('Detalhamento das Questões', LEFT, doc.y);
      doc.moveDown(0.5);

      evaluation.answers.forEach((answer, index) => {
        // Estimate needed space: question text + weight + badge + padding
        doc.fontSize(9);
        const questionTextHeight = doc.heightOfString(`${index + 1}. ${answer.question.text}`, { width: PAGE_W - 30 });
        let cardInnerH = questionTextHeight + 28; // text + weight/badge row + padding
        if (answer.observation) {
          doc.fontSize(8);
          const obsHeight = doc.heightOfString(answer.observation, { width: PAGE_W - 38 });
          cardInnerH += obsHeight + 22;
        }
        if (answer.evidence_urls?.length > 0) {
          const available = answer.evidence_urls.filter(u => evidenceImages.has(u));
          if (available.length > 0) {
            const rows = Math.ceil(available.length / 3);
            cardInnerH += rows * 114 + 16;
          }
        }

        const cardPadding = 10;
        const cardH = cardInnerH + cardPadding * 2;
        ensureSpace(cardH + 8);

        const cardY = doc.y;
        const barColor = answer.answer === 'sim' ? GREEN : answer.answer === 'nao' ? RED : GRAY;

        // Card background
        doc.rect(LEFT, cardY, PAGE_W, cardH).fill(CARD_BG).strokeColor(BORDER).lineWidth(0.5).stroke();

        // Left color bar (thick)
        doc.rect(LEFT, cardY, 4, cardH).fill(barColor);

        // Content inside card
        const textX = LEFT + 14;
        const textW = PAGE_W - 24;
        let curY = cardY + cardPadding;

        // Question number + text
        doc.fillColor(PRIMARY).fontSize(9).text(`${index + 1}. ${answer.question.text}`, textX, curY, { width: textW });
        curY = doc.y + 5;

        // Weight label
        doc.fillColor(GRAY).fontSize(7).text(`Peso ${answer.question.weight}`, textX, curY);

        // Status badge (right-aligned on same line)
        const statusText = answer.answer === 'sim' ? 'CONFORME' : answer.answer === 'nao' ? 'NÃO CONFORME' : 'N/A';
        doc.fontSize(7);
        const badgeW = doc.widthOfString(statusText) + 12;
        const badgeX = LEFT + PAGE_W - badgeW - 10;
        const badgeY = curY - 2;

        doc.roundedRect(badgeX, badgeY, badgeW, 14, 3).fill(barColor);
        doc.fillColor('white').fontSize(7).text(statusText, badgeX + 6, badgeY + 3);

        curY += 16;

        // Observation
        if (answer.observation) {
          doc.moveTo(textX, curY).lineTo(textX + textW, curY).strokeColor(BORDER).lineWidth(0.3).stroke();
          curY += 4;
          doc.fillColor(GRAY).fontSize(7).text('Observação:', textX, curY);
          curY += 10;
          doc.fillColor('#374151').fontSize(8).text(answer.observation, textX + 2, curY, { width: textW - 4 });
          curY = doc.y + 4;
        }

        // Evidence images
        if (answer.evidence_urls?.length > 0) {
          const available = answer.evidence_urls.filter(u => evidenceImages.has(u));
          if (available.length > 0) {
            doc.fillColor(GRAY).fontSize(7).text('Evidências:', textX, curY + 2);
            curY += 14;

            const imgW = Math.min(150, (textW - 20) / 3);
            const imgH = 110;
            let xPos = textX;

            available.forEach((url, imgIdx) => {
              if (imgIdx > 0 && imgIdx % 3 === 0) {
                xPos = textX;
                curY += imgH + 6;
              }

              try {
                const buf = evidenceImages.get(url);
                if (buf) {
                  doc.rect(xPos - 1, curY - 1, imgW + 2, imgH + 2).strokeColor(BORDER).lineWidth(0.5).stroke();
                  doc.image(buf, xPos, curY, { fit: [imgW, imgH] });
                  xPos += imgW + 8;
                }
              } catch { /* skip */ }
            });

            curY += imgH + 4;
          }
        }

        doc.y = cardY + cardH + 8; // gap between cards
      });

      // ── GENERAL NOTES ──
      if (evaluation.notes) {
        ensureSpace(80);
        const notesY = doc.y;
        doc.rect(LEFT, notesY, PAGE_W, 3).fill(ACCENT);

        doc.fillColor(PRIMARY).fontSize(13).text('Observações Gerais', LEFT, notesY + 10);
        doc.moveDown(0.3);

        doc.moveTo(LEFT, doc.y).lineTo(LEFT + PAGE_W, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.y += 6;
        doc.fillColor('#374151').fontSize(9).text(evaluation.notes, LEFT + 4, doc.y, {
          width: PAGE_W - 8,
          align: 'justify',
          lineGap: 3,
        });
        doc.moveDown(1);
      }

      doc.end();
    });
  }

}