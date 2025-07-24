import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksService, Work, CreateWorkDto, UpdateWorkDto } from '@/services/works.service';
import { useToast } from '@/components/ui/use-toast';

export function useWorks() {
  return useQuery({
    queryKey: ['works'],
    queryFn: () => worksService.getAll(),
  });
}

export function useWork(id: string) {
  return useQuery({
    queryKey: ['works', id],
    queryFn: () => worksService.getById(id),
    enabled: !!id,
  });
}

export function useCreateWork() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateWorkDto) => worksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      toast({
        title: 'Obra criada',
        description: 'A obra foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar obra',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a obra.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateWork() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkDto }) => 
      worksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      toast({
        title: 'Obra atualizada',
        description: 'A obra foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar obra',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a obra.',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleWorkActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => worksService.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      toast({
        title: data.is_active ? 'Obra ativada' : 'Obra desativada',
        description: `A obra foi ${data.is_active ? 'ativada' : 'desativada'} com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.response?.data?.message || 'Ocorreu um erro ao alterar o status da obra.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteWork() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => worksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      toast({
        title: 'Obra excluída',
        description: 'A obra foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir obra',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir a obra.',
        variant: 'destructive',
      });
    },
  });
}