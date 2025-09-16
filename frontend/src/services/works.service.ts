import { api } from './api';

export interface Work {
  id: string;
  name: string;
  address?: string;
  responsible: string;
  responsible_email: string;
  responsible_phone?: string;
  number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkDto {
  name: string;
  address?: string;
  responsible: string;
  responsible_email: string;
  responsible_phone?: string;
  number: string;
}

export interface UpdateWorkDto extends Partial<CreateWorkDto> {}

export interface Accommodation {
  id: string;
  name: string;
  works?: Work[];
  created_at: string;
  updated_at: string;
}

class WorksService {
  async getAll(): Promise<Work[]> {
    const response = await api.get('/works');
    return response.data;
  }

  async getById(id: string): Promise<Work> {
    const response = await api.get(`/works/${id}`);
    return response.data;
  }

  async create(data: CreateWorkDto): Promise<Work> {
    const response = await api.post('/works', data);
    return response.data;
  }

  async update(id: string, data: UpdateWorkDto): Promise<Work> {
    const response = await api.patch(`/works/${id}`, data);
    return response.data;
  }

  async toggleActive(id: string): Promise<Work> {
    const response = await api.patch(`/works/${id}/toggle-active`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/works/${id}`);
  }

  async getAllAccommodations(): Promise<Accommodation[]> {
    const response = await api.get('/works/accommodations');
    return response.data;
  }
}

export const worksService = new WorksService();