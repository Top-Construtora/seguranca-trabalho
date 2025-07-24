import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
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
import { QuestionType } from '@/services/questions.service';
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

export function EvaluationsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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
    const matchesType = typeFilter === 'all' || evaluation.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreate = async (data: any) => {
    const result = await createEvaluation.mutateAsync(data);
    setIsFormOpen(false);
    // Redirecionar para continuar a avaliação
    navigate(`/evaluations/${result.id}/edit`);
  };

  const handleView = (evaluation: Evaluation) => {
    navigate(`/evaluations/${evaluation.id}`);
  };

  const handleEdit = (evaluation: Evaluation) => {
    navigate(`/evaluations/${evaluation.id}/edit`);
  };

  const handleComplete = async () => {
    if (completeId) {
      await completeEvaluation.mutateAsync(completeId);
      setCompleteId(null);
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
            <p className="text-muted-foreground">
              Gerencie as avaliações de segurança do trabalho
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Avaliação
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por obra, número ou avaliador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value={EvaluationStatus.DRAFT}>Rascunho</SelectItem>
                <SelectItem value={EvaluationStatus.COMPLETED}>Finalizada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value={QuestionType.OBRA}>Obra</SelectItem>
                <SelectItem value={QuestionType.ALOJAMENTO}>Alojamento</SelectItem>
              </SelectContent>
            </Select>
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
            onView={handleView}
            onEdit={handleEdit}
            onComplete={(id) => setCompleteId(id)}
            onDelete={(id) => setDeleteId(id)}
            onGenerateReport={handleGenerateReport}
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Avaliação</DialogTitle>
            <DialogDescription>
              Crie uma nova avaliação de segurança do trabalho
            </DialogDescription>
          </DialogHeader>
          <EvaluationForm
            onSubmit={handleCreate}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createEvaluation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!completeId} onOpenChange={() => setCompleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar esta avaliação? 
              Após finalizada, não será possível editar as respostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta avaliação? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}