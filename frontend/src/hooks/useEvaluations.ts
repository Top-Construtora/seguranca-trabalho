import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  evaluationsService, 
  CreateEvaluationDto, 
  UpdateEvaluationDto,
  UpdateAnswersDto 
} from '@/services/evaluations.service';
import { useToast } from '@/components/ui/use-toast';

export function useEvaluations() {
  return useQuery({
    queryKey: ['evaluations'],
    queryFn: () => evaluationsService.getAll(),
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: () => evaluationsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateEvaluationDto) => evaluationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({
        title: 'Avaliação criada',
        description: 'A avaliação foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar avaliação',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a avaliação.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEvaluationDto }) => 
      evaluationsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({
        title: 'Avaliação atualizada',
        description: 'A avaliação foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar avaliação',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a avaliação.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAnswers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnswersDto }) => 
      evaluationsService.updateAnswers(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', variables.id] });
      toast({
        title: 'Respostas salvas',
        description: 'As respostas foram salvas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar respostas',
        description: error.response?.data?.message || 'Ocorreu um erro ao salvar as respostas.',
        variant: 'destructive',
      });
    },
  });
}

export function useCompleteEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => evaluationsService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({
        title: 'Avaliação finalizada',
        description: 'A avaliação foi finalizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao finalizar avaliação',
        description: error.response?.data?.message || 'Ocorreu um erro ao finalizar a avaliação.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => evaluationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast({
        title: 'Avaliação excluída',
        description: 'A avaliação foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir avaliação',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir a avaliação.',
        variant: 'destructive',
      });
    },
  });
}

export function useEvaluationStatistics() {
  return useQuery({
    queryKey: ['evaluations', 'statistics'],
    queryFn: () => evaluationsService.getStatistics(),
  });
}