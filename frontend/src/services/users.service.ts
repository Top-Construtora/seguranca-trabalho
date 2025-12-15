import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'avaliador';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecentEvaluation {
  id: string;
  type: 'obra' | 'alojamento';
  status: 'draft' | 'completed';
  date: string;
  total_penalty: number | null;
  created_at: string;
  work_name: string;
  work_number: string;
  accommodation_name: string | null;
}

export interface ProfileStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'avaliador';
    created_at: string;
  };
  evaluations: {
    total: number;
    completed: number;
    draft: number;
    byType: {
      obra: number;
      alojamento: number;
    };
  };
  accidents: {
    total: number;
  };
  recentEvaluations: RecentEvaluation[];
}

class UsersService {
  async getAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  }

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async getProfileStats(): Promise<ProfileStats> {
    const response = await api.get('/users/profile/stats');
    return response.data;
  }
}

export const usersService = new UsersService();