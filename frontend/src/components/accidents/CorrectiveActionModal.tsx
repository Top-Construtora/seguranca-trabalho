import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateCorrectiveAction,
  useUpdateCorrectiveAction,
} from '@/hooks/useAccidents';
import { useUsers } from '@/hooks/useUsers';
import {
  AccidentCorrectiveAction,
  CorrectiveActionStatus,
  CORRECTIVE_ACTION_STATUS_LABELS,
} from '@/types/accident.types';
import { Loader2, Save, Plus } from 'lucide-react';

interface CorrectiveActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accidentId: string;
  action?: AccidentCorrectiveAction | null;
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Muito Alta (1)' },
  { value: '2', label: 'Alta (2)' },
  { value: '3', label: 'Média (3)' },
  { value: '4', label: 'Baixa (4)' },
  { value: '5', label: 'Muito Baixa (5)' },
];

export function CorrectiveActionModal({
  open,
  onOpenChange,
  accidentId,
  action,
}: CorrectiveActionModalProps) {
  const isEditing = !!action;

  const createAction = useCreateCorrectiveAction();
  const updateAction = useUpdateCorrectiveAction();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [formData, setFormData] = useState({
    action_description: '',
    responsible_id: '',
    target_date: '',
    priority: '3',
    verification_method: '',
    notes: '',
    status: CorrectiveActionStatus.PENDENTE,
    completion_date: '',
    verification_result: '',
  });

  useEffect(() => {
    if (action) {
      setFormData({
        action_description: action.action_description || '',
        responsible_id: action.responsible_id || '',
        target_date: action.target_date ? action.target_date.split('T')[0] : '',
        priority: String(action.priority || 3),
        verification_method: action.verification_method || '',
        notes: action.notes || '',
        status: action.status || CorrectiveActionStatus.PENDENTE,
        completion_date: action.completion_date ? action.completion_date.split('T')[0] : '',
        verification_result: action.verification_result || '',
      });
    } else {
      setFormData({
        action_description: '',
        responsible_id: '',
        target_date: '',
        priority: '3',
        verification_method: '',
        notes: '',
        status: CorrectiveActionStatus.PENDENTE,
        completion_date: '',
        verification_result: '',
      });
    }
  }, [action, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.action_description.trim()) {
      return;
    }

    if (!formData.responsible_id) {
      return;
    }

    if (!formData.target_date) {
      return;
    }

    try {
      if (isEditing && action) {
        await updateAction.mutateAsync({
          id: action.id,
          data: {
            action_description: formData.action_description,
            responsible_id: formData.responsible_id,
            target_date: formData.target_date,
            priority: parseInt(formData.priority),
            verification_method: formData.verification_method || undefined,
            notes: formData.notes || undefined,
            status: formData.status,
            completion_date: formData.completion_date || undefined,
            verification_result: formData.verification_result || undefined,
          },
        });
      } else {
        await createAction.mutateAsync({
          accidentId,
          data: {
            action_description: formData.action_description,
            responsible_id: formData.responsible_id,
            target_date: formData.target_date,
            priority: parseInt(formData.priority),
            verification_method: formData.verification_method || undefined,
            notes: formData.notes || undefined,
          },
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving corrective action:', error);
    }
  };

  const isLoading = createAction.isPending || updateAction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ação Corretiva' : 'Nova Ação Corretiva'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite os detalhes da ação corretiva abaixo.'
              : 'Preencha os detalhes da nova ação corretiva.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Descrição da Ação */}
          <div className="space-y-2">
            <Label htmlFor="action_description">
              Descrição da Ação <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="action_description"
              value={formData.action_description}
              onChange={(e) =>
                setFormData({ ...formData, action_description: e.target.value })
              }
              placeholder="Descreva a ação corretiva a ser tomada..."
              rows={3}
              required
            />
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsible_id">
              Responsável <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.responsible_id}
              onValueChange={(value) =>
                setFormData({ ...formData, responsible_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data Limite */}
            <div className="space-y-2">
              <Label htmlFor="target_date">
                Prazo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) =>
                  setFormData({ ...formData, target_date: e.target.value })
                }
                required
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as CorrectiveActionStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CORRECTIVE_ACTION_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Conclusão */}
              <div className="space-y-2">
                <Label htmlFor="completion_date">Data de Conclusão</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) =>
                    setFormData({ ...formData, completion_date: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Método de Verificação */}
          <div className="space-y-2">
            <Label htmlFor="verification_method">Método de Verificação</Label>
            <Input
              id="verification_method"
              value={formData.verification_method}
              onChange={(e) =>
                setFormData({ ...formData, verification_method: e.target.value })
              }
              placeholder="Ex: Inspeção visual, teste funcional..."
            />
          </div>

          {/* Resultado da Verificação (apenas ao editar) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="verification_result">Resultado da Verificação</Label>
              <Textarea
                id="verification_result"
                value={formData.verification_result}
                onChange={(e) =>
                  setFormData({ ...formData, verification_result: e.target.value })
                }
                placeholder="Descreva o resultado da verificação..."
                rows={2}
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Ação
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
