import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useActionPlansByEvaluation, useCreateActionPlan, useUpdateActionPlan, useDeleteActionPlan } from '@/hooks/useActionPlans';
import type { CreateActionPlanDto, UpdateActionPlanDto } from '@/hooks/useActionPlans';
import { toast } from 'sonner';

interface ActionPlanTabProps {
  evaluationId: string;
  nonConformAnswers: Array<{
    id: string;
    question_id: string;
    answer: 'nao';
    observation?: string;
    evidence_urls: string[];
    question?: {
      id: string;
      text: string;
      weight: number;
    };
  }>;
}

export function ActionPlanTab({ evaluationId, nonConformAnswers }: ActionPlanTabProps) {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>('');
  const [actionDescription, setActionDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: actionPlans = [], isLoading } = useActionPlansByEvaluation(evaluationId);
  const createMutation = useCreateActionPlan();
  const updateMutation = useUpdateActionPlan();
  const deleteMutation = useDeleteActionPlan();

  const resetForm = () => {
    setSelectedAnswerId('');
    setActionDescription('');
    setTargetDate('');
    setNotes('');
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actionDescription.trim()) {
      toast.error('Descrição do plano de ação é obrigatória');
      return;
    }

    try {
      if (editingPlan) {
        const updateData: UpdateActionPlanDto = {
          action_description: actionDescription,
          target_date: targetDate || undefined,
          notes: notes || undefined,
        };

        await updateMutation.mutateAsync({ id: editingPlan.id, data: updateData });
        toast.success('Plano de ação atualizado com sucesso');
      } else {
        if (!selectedAnswerId) {
          toast.error('Selecione uma pergunta para criar o plano de ação');
          return;
        }

        const createData: CreateActionPlanDto = {
          answer_id: selectedAnswerId,
          action_description: actionDescription,
          target_date: targetDate || undefined,
          notes: notes || undefined,
        };

        await createMutation.mutateAsync(createData);
        toast.success('Plano de ação criado com sucesso');
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar plano de ação');
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setActionDescription(plan.action_description);
    setTargetDate(plan.target_date ? plan.target_date.split('T')[0] : '');
    setNotes(plan.notes || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de ação?')) {
      try {
        await deleteMutation.mutateAsync(planId);
        toast.success('Plano de ação excluído com sucesso');
      } catch (error) {
        toast.error('Erro ao excluir plano de ação');
      }
    }
  };

  const updateStatus = async (planId: string, status: string) => {
    try {
      await updateMutation.mutateAsync({ id: planId, data: { status: status as 'completed' | 'pending' | 'in_progress' } });
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando planos de ação...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            Plano de Ação
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os planos de ação para as não conformidades encontradas
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              {nonConformAnswers.length} não conformidades
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-blue-500" />
              {actionPlans.length} planos criados
            </span>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan
                    ? 'Atualize as informações do plano de ação'
                    : 'Crie um plano de ação para uma pergunta não conforme'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingPlan && (
                  <div className="space-y-2">
                    <Label htmlFor="question">Pergunta *</Label>
                    <Select value={selectedAnswerId} onValueChange={setSelectedAnswerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma pergunta não conforme" />
                      </SelectTrigger>
                      <SelectContent>
                        {nonConformAnswers.map((answer) => (
                          <SelectItem key={answer.id} value={answer.id}>
                            <div className="max-w-md truncate">
                              {answer.question?.text}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="action">Descrição do Plano de Ação *</Label>
                  <Textarea
                    id="action"
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="Descreva as ações que serão tomadas para corrigir esta não conformidade..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Data Prevista</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações adicionais sobre o plano de ação..."
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingPlan ? 'Atualizar' : 'Criar'} Plano
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de não conformidades e seus planos */}
      <div className="space-y-4">
        {nonConformAnswers.map((answer, index) => {
          const answerPlans = actionPlans.filter(plan => plan.answer_id === answer.id);

          return (
            <Card key={answer.id} className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-relaxed flex items-start gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      {answer.question?.text}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Não Conforme
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Peso {answer.question?.weight}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Observação e evidências da resposta */}
                {(answer.observation || answer.evidence_urls?.length > 0) && (
                  <div className="p-3 bg-background border rounded-lg space-y-3">
                    {answer.observation && (
                      <div>
                        <p className="text-sm font-medium mb-1 text-muted-foreground">Observação:</p>
                        <p className="text-sm">{answer.observation}</p>
                      </div>
                    )}

                    {answer.evidence_urls?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">
                          Evidências ({answer.evidence_urls.length}):
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {answer.evidence_urls.map((url, index) => (
                            <div key={index} className="group relative">
                              <img
                                src={url}
                                alt={`Evidência ${index + 1}`}
                                className="rounded border object-cover h-16 w-full cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() => window.open(url, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded transition-colors flex items-center justify-center">
                                <Eye className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Planos de ação para esta pergunta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Planos de Ação ({answerPlans.length})
                    </h4>
                  </div>

                  {answerPlans.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Nenhum plano de ação criado para esta não conformidade
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {answerPlans.map((plan) => (
                        <div key={plan.id} className="p-4 bg-background border rounded-lg">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{plan.action_description}</p>
                              {plan.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{plan.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select value={plan.status} onValueChange={(value) => updateStatus(plan.id, value)}>
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                                  <SelectItem value="completed">Concluído</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}>
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(plan.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full border", getStatusColor(plan.status))}>
                              {getStatusIcon(plan.status)}
                              {getStatusLabel(plan.status)}
                            </div>
                            {plan.target_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Prazo: {format(new Date(plan.target_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                            <span>
                              Criado em {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {nonConformAnswers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Parabéns!</h3>
              <p className="text-muted-foreground">
                Esta avaliação não possui não conformidades. Nenhum plano de ação é necessário.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}