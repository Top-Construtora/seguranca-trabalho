import { api } from './api';
import { QuestionType } from './questions.service';

export enum EvaluationStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
}

export enum AnswerValue {
  SIM = 'sim',
  NAO = 'nao',
  NA = 'na',
}

export interface Answer {
  id: string;
  evaluation_id: string;
  question_id: string;
  answer: AnswerValue;
  observation?: string;
  evidence_urls?: string[];
  question?: {
    id: string;
    text: string;
    weight: number;
    type: QuestionType;
    order: number;
  };
}

export interface Evaluation {
  id: string;
  work_id: string;
  accommodation_id?: string;
  user_id: string;
  type: QuestionType;
  date: string;
  employees_count: number;
  notes?: string;
  status: EvaluationStatus;
  total_penalty?: number;
  safety_score?: number;
  created_at: string;
  updated_at: string;
  work?: {
    id: string;
    name: string;
    number: string;
  };
  accommodation?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  answers?: Answer[];
}

export interface CreateEvaluationDto {
  work_id: string;
  type: QuestionType;
  date: string;
  employees_count: number;
  notes?: string;
}

export interface UpdateEvaluationDto {
  date?: string;
  employees_count?: number;
  notes?: string;
}

export interface CreateAnswerDto {
  question_id: string;
  answer: AnswerValue;
  observation?: string;
  evidence_urls?: string[];
}

export interface UpdateAnswersDto {
  answers: CreateAnswerDto[];
}

export interface EvaluationStatistics {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  totalPenalties: number;
}

class EvaluationsService {
  async getAll(): Promise<Evaluation[]> {
    const response = await api.get('/evaluations');
    return response.data;
  }

  async getById(id: string): Promise<Evaluation> {
    const response = await api.get(`/evaluations/${id}`);
    return response.data;
  }

  async create(data: CreateEvaluationDto): Promise<Evaluation> {
    const response = await api.post('/evaluations', data);
    return response.data;
  }

  async update(id: string, data: UpdateEvaluationDto): Promise<Evaluation> {
    const response = await api.patch(`/evaluations/${id}`, data);
    return response.data;
  }

  async updateAnswers(id: string, data: UpdateAnswersDto): Promise<Evaluation> {
    const response = await api.patch(`/evaluations/${id}/answers`, data);
    return response.data;
  }

  async complete(id: string): Promise<Evaluation> {
    const response = await api.post(`/evaluations/${id}/complete`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/evaluations/${id}`);
  }

  async getStatistics(): Promise<EvaluationStatistics> {
    const response = await api.get('/evaluations/statistics');
    return response.data;
  }
}

export const evaluationsService = new EvaluationsService();