import { api } from './api';

export enum QuestionType {
  OBRA = 'obra',
  ALOJAMENTO = 'alojamento',
}

export interface Question {
  id: string;
  text: string;
  weight: number;
  type: QuestionType;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

class QuestionsService {
  async getAll(type?: QuestionType, activeOnly: boolean = true): Promise<Question[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (!activeOnly) params.append('activeOnly', 'false');
    
    const response = await api.get(`/questions?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<Question> {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  }
}

export const questionsService = new QuestionsService();