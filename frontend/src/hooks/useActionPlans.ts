import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface ActionPlan {
  id: string;
  answer_id: string;
  action_description: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  responsible_user_id?: string;
  responsible_user?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  attachment_urls: string[];
  created_at: string;
  updated_at: string;
  answer?: {
    id: string;
    question_id: string;
    answer: 'sim' | 'nao' | 'na';
    observation?: string;
    evidence_urls: string[];
    question?: {
      id: string;
      text: string;
      weight: number;
    };
  };
}

export interface CreateActionPlanDto {
  answer_id: string;
  action_description: string;
  target_date?: string;
  responsible_user_id?: string;
  notes?: string;
  attachment_urls?: string[];
}

export interface UpdateActionPlanDto {
  action_description?: string;
  target_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  responsible_user_id?: string;
  notes?: string;
  attachment_urls?: string[];
}

export function useActionPlansByEvaluation(evaluationId: string) {
  return useQuery({
    queryKey: ['action-plans', 'evaluation', evaluationId],
    queryFn: async (): Promise<ActionPlan[]> => {
      const response = await api.get(`/action-plans/evaluation/${evaluationId}`);
      return response.data;
    },
    enabled: !!evaluationId,
  });
}

export function useActionPlansByWork(workId: string) {
  return useQuery({
    queryKey: ['action-plans', 'work', workId],
    queryFn: async (): Promise<ActionPlan[]> => {
      const response = await api.get(`/action-plans/work/${workId}`);
      return response.data;
    },
    enabled: !!workId,
  });
}

export function useActionPlansByAnswer(answerId: string) {
  return useQuery({
    queryKey: ['action-plans', 'answer', answerId],
    queryFn: async (): Promise<ActionPlan[]> => {
      const response = await api.get(`/action-plans/answer/${answerId}`);
      return response.data;
    },
    enabled: !!answerId,
  });
}

export function useActionPlan(id: string) {
  return useQuery({
    queryKey: ['action-plans', id],
    queryFn: async (): Promise<ActionPlan> => {
      const response = await api.get(`/action-plans/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateActionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActionPlanDto): Promise<ActionPlan> => {
      const response = await api.post('/action-plans', data);
      return response.data;
    },
    onSuccess: (newActionPlan) => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
      queryClient.invalidateQueries({
        queryKey: ['action-plans', 'answer', newActionPlan.answer_id]
      });
    },
  });
}

export function useUpdateActionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateActionPlanDto }): Promise<ActionPlan> => {
      const response = await api.patch(`/action-plans/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedActionPlan) => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
      queryClient.setQueryData(['action-plans', updatedActionPlan.id], updatedActionPlan);
    },
  });
}

export function useDeleteActionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/action-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    },
  });
}