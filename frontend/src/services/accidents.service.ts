import { api } from './api';
import {
  Accident,
  AccidentFilters,
  CreateAccidentDto,
  UpdateAccidentDto,
  AccidentEvidence,
  CreateEvidenceDto,
  AccidentInvestigation,
  CreateInvestigationDto,
  UpdateInvestigationDto,
  AccidentCorrectiveAction,
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  DashboardSummary,
  DaysAwayByWork,
  BodyPartStats,
  SeverityStats,
  MonthlyTrend,
  CorrectiveActionStats,
  CorrectiveActionStatus,
} from '../types/accident.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class AccidentsService {
  // === Acidentes ===

  async getAll(filters?: AccidentFilters): Promise<PaginatedResponse<Accident>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<Accident> {
    const response = await api.get(`/accidents/${id}`);
    return response.data;
  }

  async create(data: CreateAccidentDto): Promise<Accident> {
    const response = await api.post('/accidents', data);
    return response.data;
  }

  async update(id: string, data: UpdateAccidentDto): Promise<Accident> {
    const response = await api.patch(`/accidents/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/accidents/${id}`);
  }

  // === Evidências ===

  async getEvidences(accidentId: string): Promise<AccidentEvidence[]> {
    const response = await api.get(`/accidents/${accidentId}/evidences`);
    return response.data;
  }

  async addEvidence(accidentId: string, data: Omit<CreateEvidenceDto, 'accident_id'>): Promise<AccidentEvidence> {
    const response = await api.post(`/accidents/${accidentId}/evidences`, {
      ...data,
      accident_id: accidentId,
    });
    return response.data;
  }

  async removeEvidence(accidentId: string, evidenceId: string): Promise<void> {
    await api.delete(`/accidents/${accidentId}/evidences/${evidenceId}`);
  }

  // === Investigações ===

  async getInvestigations(accidentId: string): Promise<AccidentInvestigation[]> {
    const response = await api.get(`/accidents/${accidentId}/investigations`);
    return response.data;
  }

  async getInvestigationById(id: string): Promise<AccidentInvestigation> {
    const response = await api.get(`/accidents/investigations/${id}`);
    return response.data;
  }

  async createInvestigation(
    accidentId: string,
    data: Omit<CreateInvestigationDto, 'accident_id'>
  ): Promise<AccidentInvestigation> {
    const response = await api.post(`/accidents/${accidentId}/investigations`, {
      ...data,
      accident_id: accidentId,
    });
    return response.data;
  }

  async updateInvestigation(id: string, data: UpdateInvestigationDto): Promise<AccidentInvestigation> {
    const response = await api.patch(`/accidents/investigations/${id}`, data);
    return response.data;
  }

  async deleteInvestigation(id: string): Promise<void> {
    await api.delete(`/accidents/investigations/${id}`);
  }

  // === Ações Corretivas ===

  async getCorrectiveActions(accidentId: string): Promise<AccidentCorrectiveAction[]> {
    const response = await api.get(`/accidents/${accidentId}/corrective-actions`);
    return response.data;
  }

  async getAllCorrectiveActions(filters?: {
    status?: CorrectiveActionStatus;
    responsible_id?: string;
    accident_id?: string;
    overdue?: boolean;
  }): Promise<AccidentCorrectiveAction[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/corrective-actions?${params.toString()}`);
    return response.data;
  }

  async getMyCorrectiveActions(): Promise<AccidentCorrectiveAction[]> {
    const response = await api.get('/corrective-actions/my-actions');
    return response.data;
  }

  async getCorrectiveActionById(id: string): Promise<AccidentCorrectiveAction> {
    const response = await api.get(`/corrective-actions/${id}`);
    return response.data;
  }

  async createCorrectiveAction(
    accidentId: string,
    data: Omit<CreateCorrectiveActionDto, 'accident_id'>
  ): Promise<AccidentCorrectiveAction> {
    const response = await api.post(`/accidents/${accidentId}/corrective-actions`, {
      ...data,
      accident_id: accidentId,
    });
    return response.data;
  }

  async updateCorrectiveAction(
    id: string,
    data: UpdateCorrectiveActionDto
  ): Promise<AccidentCorrectiveAction> {
    const response = await api.patch(`/corrective-actions/${id}`, data);
    return response.data;
  }

  async deleteCorrectiveAction(id: string): Promise<void> {
    await api.delete(`/corrective-actions/${id}`);
  }

  async getCorrectiveActionsStats(): Promise<CorrectiveActionStats> {
    const response = await api.get('/corrective-actions/statistics');
    return response.data;
  }

  // === Dashboard ===

  async getDashboardSummary(filters?: {
    work_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents/dashboard/summary?${params.toString()}`);
    return response.data;
  }

  async getDaysAwayByWork(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<DaysAwayByWork[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents/dashboard/by-work?${params.toString()}`);
    return response.data;
  }

  async getByBodyPart(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<BodyPartStats[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents/dashboard/by-body-part?${params.toString()}`);
    return response.data;
  }

  async getBySeverity(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SeverityStats[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents/dashboard/by-severity?${params.toString()}`);
    return response.data;
  }

  async getTimeline(filters?: {
    work_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<Accident[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/accidents/dashboard/timeline?${params.toString()}`);
    return response.data;
  }

  async getMonthlyTrend(year?: number): Promise<MonthlyTrend[]> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/accidents/dashboard/monthly-trend${params}`);
    return response.data;
  }
}

export const accidentsService = new AccidentsService();
