import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accidentsService } from '@/services/accidents.service';
import { useToast } from '@/components/ui/use-toast';
import {
  AccidentFilters,
  CreateAccidentDto,
  UpdateAccidentDto,
  CreateEvidenceDto,
  CreateInvestigationDto,
  UpdateInvestigationDto,
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  CorrectiveActionStatus,
} from '@/types/accident.types';

// === Acidentes ===

export function useAccidents(filters?: AccidentFilters) {
  return useQuery({
    queryKey: ['accidents', filters],
    queryFn: () => accidentsService.getAll(filters),
  });
}

export function useAccident(id: string) {
  return useQuery({
    queryKey: ['accidents', id],
    queryFn: () => accidentsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAccident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAccidentDto) => accidentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      toast({
        title: 'Acidente registrado',
        description: 'O acidente foi registrado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar acidente',
        description: error.response?.data?.message || 'Ocorreu um erro ao registrar o acidente.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAccident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccidentDto }) =>
      accidentsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.id] });
      toast({
        title: 'Acidente atualizado',
        description: 'O acidente foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar acidente',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar o acidente.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccident() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => accidentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      toast({
        title: 'Acidente excluído',
        description: 'O acidente foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir acidente',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir o acidente.',
        variant: 'destructive',
      });
    },
  });
}

// === Evidências ===

export function useAccidentEvidences(accidentId: string) {
  return useQuery({
    queryKey: ['accidents', accidentId, 'evidences'],
    queryFn: () => accidentsService.getEvidences(accidentId),
    enabled: !!accidentId,
  });
}

export function useAddEvidence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      accidentId,
      data,
    }: {
      accidentId: string;
      data: Omit<CreateEvidenceDto, 'accident_id'>;
    }) => accidentsService.addEvidence(accidentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId] });
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId, 'evidences'] });
      toast({
        title: 'Evidência adicionada',
        description: 'A evidência foi adicionada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar evidência',
        description: error.response?.data?.message || 'Ocorreu um erro ao adicionar a evidência.',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveEvidence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ accidentId, evidenceId }: { accidentId: string; evidenceId: string }) =>
      accidentsService.removeEvidence(accidentId, evidenceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId] });
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId, 'evidences'] });
      toast({
        title: 'Evidência removida',
        description: 'A evidência foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover evidência',
        description: error.response?.data?.message || 'Ocorreu um erro ao remover a evidência.',
        variant: 'destructive',
      });
    },
  });
}

// === Investigações ===

export function useAccidentInvestigations(accidentId: string) {
  return useQuery({
    queryKey: ['accidents', accidentId, 'investigations'],
    queryFn: () => accidentsService.getInvestigations(accidentId),
    enabled: !!accidentId,
  });
}

export function useInvestigation(id: string) {
  return useQuery({
    queryKey: ['investigations', id],
    queryFn: () => accidentsService.getInvestigationById(id),
    enabled: !!id,
  });
}

export function useCreateInvestigation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      accidentId,
      data,
    }: {
      accidentId: string;
      data: Omit<CreateInvestigationDto, 'accident_id'>;
    }) => accidentsService.createInvestigation(accidentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId] });
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId, 'investigations'] });
      toast({
        title: 'Investigação criada',
        description: 'A investigação foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar investigação',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a investigação.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvestigation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestigationDto }) =>
      accidentsService.updateInvestigation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      toast({
        title: 'Investigação atualizada',
        description: 'A investigação foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar investigação',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a investigação.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvestigation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => accidentsService.deleteInvestigation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      toast({
        title: 'Investigação excluída',
        description: 'A investigação foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir investigação',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir a investigação.',
        variant: 'destructive',
      });
    },
  });
}

// === Ações Corretivas ===

export function useAccidentCorrectiveActions(accidentId: string) {
  return useQuery({
    queryKey: ['accidents', accidentId, 'corrective-actions'],
    queryFn: () => accidentsService.getCorrectiveActions(accidentId),
    enabled: !!accidentId,
  });
}

export function useAllCorrectiveActions(filters?: {
  status?: CorrectiveActionStatus;
  responsible_id?: string;
  accident_id?: string;
  overdue?: boolean;
}) {
  return useQuery({
    queryKey: ['corrective-actions', filters],
    queryFn: () => accidentsService.getAllCorrectiveActions(filters),
  });
}

export function useMyCorrectiveActions() {
  return useQuery({
    queryKey: ['corrective-actions', 'my-actions'],
    queryFn: () => accidentsService.getMyCorrectiveActions(),
  });
}

export function useCorrectiveAction(id: string) {
  return useQuery({
    queryKey: ['corrective-actions', id],
    queryFn: () => accidentsService.getCorrectiveActionById(id),
    enabled: !!id,
  });
}

export function useCreateCorrectiveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      accidentId,
      data,
    }: {
      accidentId: string;
      data: Omit<CreateCorrectiveActionDto, 'accident_id'>;
    }) => accidentsService.createCorrectiveAction(accidentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accidents', variables.accidentId] });
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      toast({
        title: 'Ação corretiva criada',
        description: 'A ação corretiva foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar ação corretiva',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a ação corretiva.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCorrectiveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCorrectiveActionDto }) =>
      accidentsService.updateCorrectiveAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      toast({
        title: 'Ação corretiva atualizada',
        description: 'A ação corretiva foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar ação corretiva',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a ação corretiva.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCorrectiveAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => accidentsService.deleteCorrectiveAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents'] });
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      toast({
        title: 'Ação corretiva excluída',
        description: 'A ação corretiva foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir ação corretiva',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir a ação corretiva.',
        variant: 'destructive',
      });
    },
  });
}

export function useCorrectiveActionsStats() {
  return useQuery({
    queryKey: ['corrective-actions', 'statistics'],
    queryFn: () => accidentsService.getCorrectiveActionsStats(),
  });
}

// === Dashboard ===

export function useAccidentsDashboard(filters?: {
  work_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'summary', filters],
    queryFn: () => accidentsService.getDashboardSummary(filters),
  });
}

export function useDaysAwayByWork(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'by-work', filters],
    queryFn: () => accidentsService.getDaysAwayByWork(filters),
  });
}

export function useAccidentsByBodyPart(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'by-body-part', filters],
    queryFn: () => accidentsService.getByBodyPart(filters),
  });
}

export function useAccidentsBySeverity(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'by-severity', filters],
    queryFn: () => accidentsService.getBySeverity(filters),
  });
}

export function useAccidentsTimeline(filters?: {
  work_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'timeline', filters],
    queryFn: () => accidentsService.getTimeline(filters),
  });
}

export function useAccidentsMonthlyTrend(year?: number) {
  return useQuery({
    queryKey: ['accidents', 'dashboard', 'monthly-trend', year],
    queryFn: () => accidentsService.getMonthlyTrend(year),
  });
}
