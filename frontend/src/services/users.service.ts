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

class UsersService {
  async getAll(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  }

  async getById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }
}

export const usersService = new UsersService();