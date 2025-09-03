import { api } from './api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  workId?: string;
  type?: string;
}

export interface EvaluationReport {
  evaluations: Array<{
    id: string;
    date: string;
    type: string;
    employees_count: number;
    total_penalty: number;
    notes?: string;
    status: string;
    work: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
    };
    answers: Array<{
      id: string;
      value: string;
      question: {
        id: string;
        text: string;
        weight: number;
      };
    }>;
  }>;
  total: number;
  filters: ReportFilters;
}

export interface SummaryReport {
  total_evaluations: number;
  evaluations_by_type: {
    obra: number;
    alojamento: number;
  };
  evaluations_by_work: Record<string, number>;
  average_penalty: number;
  total_penalty: number;
}

export const reportsService = {
  async getEvaluationsReport(filters: ReportFilters): Promise<EvaluationReport> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.workId) params.append('work_id', filters.workId);
    if (filters.type) params.append('type', filters.type);

    const response = await api.get(`/reports/evaluations?${params.toString()}`);
    return response.data;
  },

  async getSummaryReport(filters: Pick<ReportFilters, 'startDate' | 'endDate'>): Promise<SummaryReport> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const response = await api.get(`/reports/summary?${params.toString()}`);
    return response.data;
  },

  async downloadPDFReport(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.workId) params.append('work_id', filters.workId);
    if (filters.type) params.append('type', filters.type);

    const response = await api.get(`/reports/export/pdf?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${filters.startDate}-${filters.endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async downloadExcelReport(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.workId) params.append('work_id', filters.workId);
    if (filters.type) params.append('type', filters.type);

    const response = await api.get(`/reports/export/excel?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${filters.startDate}-${filters.endDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};