export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  workId?: string;
  type?: string;
  accommodationId?: string;
  userId?: string;
}

export interface EvaluationReportResponse {
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
    accommodation?: {
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

export interface SummaryReportResponse {
  total_evaluations: number;
  evaluations_by_type: {
    obra: number;
    alojamento: number;
  };
  evaluations_by_work: Record<string, number>;
  average_penalty: number;
  total_penalty: number;
}

export interface ConformityReportResponse {
  conforme: number;
  nao_conforme: number;
  total_applicable: number;
  conforme_percentage: number;
  nao_conforme_percentage: number;
}

export interface EvaluationConformityData {
  evaluation_id: string;
  date: string;
  work_name: string;
  conforme: number;
  nao_conforme: number;
  total_applicable: number;
  conforme_percentage: number;
  nao_conforme_percentage: number;
}

export interface LastEvaluationsConformityReportResponse {
  evaluations_data: EvaluationConformityData[];
  total: ConformityReportResponse;
}