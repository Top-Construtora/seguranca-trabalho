import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EvaluationsList } from '@/components/evaluations/EvaluationsList';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { 
  useEvaluations, 
  useCreateEvaluation, 
  useCompleteEvaluation,
  useDeleteEvaluation 
} from '@/hooks/useEvaluations';
import { Evaluation, EvaluationStatus } from '@/services/evaluations.service';

interface EvaluationsPageProps {
  evaluationType: 'obra' | 'alojamento';
}
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function EvaluationsPage({ evaluationType }: EvaluationsPageProps) {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const { data: evaluations = [], isLoading } = useEvaluations();
  const createEvaluation = useCreateEvaluation();
  const completeEvaluation = useCompleteEvaluation();
  const deleteEvaluation = useDeleteEvaluation();

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = searchTerm === '' || 
      evaluation.work?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.work?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.user?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
    // Always filter by the evaluation type from the route
    const matchesType = evaluation.type === evaluationType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreate = async (data: any) => {
    const evaluationData = { ...data, type: evaluationType };
    const result = await createEvaluation.mutateAsync(evaluationData);
    setIsFormOpen(false);
    // Redirecionar para continuar a avaliação
    navigate(`/evaluations/${evaluationType}/${result.id}/edit`);
  };

  const handleEdit = (evaluation: Evaluation) => {
    navigate(`/evaluations/${evaluation.type}/${evaluation.id}/edit`);
  };

  const handleComplete = async () => {
    if (completeId) {
      await completeEvaluation.mutateAsync(completeId);
      setCompleteId(null);
      // Redirecionar para a página de relatório da avaliação finalizada
      navigate(`/reports/evaluation/${completeId}`);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEvaluation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleGenerateReport = (evaluation: Evaluation) => {
    // TODO: Implementar geração de relatório
    navigate(`/reports/evaluation/${evaluation.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                {evaluationType === 'obra' ? 'Avaliações de Obra' : 'Avaliações de Alojamento'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {evaluationType === 'obra'
                  ? 'Realize e gerencie avaliações de segurança em obras'
                  : 'Realize e gerencie avaliações de segurança em alojamentos'
                }
              </p>
            </div>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Nova Avaliação</span>
            </Button>
          </div>
        </div>

        {/* Barra de filtros melhorada */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por obra, número ou avaliador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0] transition-all"
              />
            </div>

            <div className="flex gap-3 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value={EvaluationStatus.DRAFT}>Rascunho</SelectItem>
                  <SelectItem value={EvaluationStatus.COMPLETED}>Finalizada</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <span className="font-medium">{filteredEvaluations.length}</span>
                <span className="ml-1">{filteredEvaluations.length === 1 ? 'avaliação' : 'avaliações'}</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <EvaluationsList
            evaluations={filteredEvaluations}
            onEdit={handleEdit}
            onComplete={(id) => setCompleteId(id)}
            onDelete={(id) => setDeleteId(id)}
            onGenerateReport={handleGenerateReport}
            evaluationType={evaluationType}
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">
              Nova Avaliação {evaluationType === 'obra' ? 'de Obra' : 'de Alojamento'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Crie uma nova avaliação de segurança {evaluationType === 'obra' ? 'de obra' : 'de alojamento'}
            </DialogDescription>
          </DialogHeader>
          <EvaluationForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createEvaluation.isPending}
            evaluationType={evaluationType}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!completeId} onOpenChange={() => setCompleteId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Finalizar avaliação</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Tem certeza que deseja finalizar esta avaliação?
              Após finalizada, não será possível editar as respostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} className="w-full sm:w-auto">
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Excluir avaliação</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir esta avaliação?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}