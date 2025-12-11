import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAllCorrectiveActions,
  useMyCorrectiveActions,
  useUpdateCorrectiveAction,
  useCorrectiveActionsStats,
} from '@/hooks/useAccidents';
import { CorrectiveActionStatusBadge } from '@/components/accidents/AccidentStatusBadge';
import {
  CorrectiveActionStatus,
  CORRECTIVE_ACTION_STATUS_LABELS,
  AccidentCorrectiveAction,
} from '@/types/accident.types';
import { formatDate } from '@/utils/date';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Play,
  CheckCircle,
  Eye,
} from 'lucide-react';

export function CorrectiveActionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<{
    status?: CorrectiveActionStatus;
    overdue?: boolean;
  }>({});
  const [selectedAction, setSelectedAction] = useState<AccidentCorrectiveAction | null>(
    null
  );

  const { data: allActions = [], isLoading: allLoading } = useAllCorrectiveActions(filters);
  const { data: myActions = [], isLoading: myLoading } = useMyCorrectiveActions();
  const { data: stats } = useCorrectiveActionsStats();
  const updateAction = useUpdateCorrectiveAction();

  const isAdmin = user?.role === 'admin';

  const handleStatusUpdate = async (
    action: AccidentCorrectiveAction,
    newStatus: CorrectiveActionStatus
  ) => {
    await updateAction.mutateAsync({
      id: action.id,
      data: {
        status: newStatus,
        completion_date:
          newStatus === CorrectiveActionStatus.CONCLUIDA
            ? new Date().toISOString()
            : undefined,
      },
    });
  };

  const renderActionsTable = (
    actions: AccidentCorrectiveAction[],
    isLoading: boolean
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (actions.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma ação corretiva encontrada</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Acidente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell>
                  <p className="font-medium line-clamp-2 max-w-[250px]">
                    {action.action_description}
                  </p>
                </TableCell>
                <TableCell>
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => navigate(`/accidents/${action.accident_id}`)}
                  >
                    {action.accident?.title || 'Ver acidente'}
                  </button>
                </TableCell>
                <TableCell>{action.responsible?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={
                      new Date(action.target_date) < new Date() &&
                      action.status !== CorrectiveActionStatus.CONCLUIDA
                        ? 'text-red-600 font-medium'
                        : ''
                    }
                  >
                    {formatDate(action.target_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      action.priority <= 2
                        ? 'bg-red-100 text-red-700'
                        : action.priority === 3
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {action.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <CorrectiveActionStatusBadge status={action.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedAction(action)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {action.status === CorrectiveActionStatus.PENDENTE && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleStatusUpdate(action, CorrectiveActionStatus.EM_ANDAMENTO)
                        }
                        title="Iniciar"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {(action.status === CorrectiveActionStatus.PENDENTE ||
                      action.status === CorrectiveActionStatus.EM_ANDAMENTO) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleStatusUpdate(action, CorrectiveActionStatus.CONCLUIDA)
                        }
                        title="Concluir"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
            Ações Corretivas
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Acompanhe e gerencie as ações corretivas dos acidentes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-[#1e6076] dark:text-[#12b0a0]">
                  {stats?.byStatus?.find(
                    (s) => s.status === CorrectiveActionStatus.PENDENTE
                  )?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <Clock className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.overdue || 0}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Média Conclusão</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {stats?.avgCompletionDays?.toFixed(0) || 0} dias
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas as Ações</TabsTrigger>
            <TabsTrigger value="mine">Minhas Ações ({myActions.length})</TabsTrigger>
            <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600 dark:text-gray-400">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(v) =>
                      setFilters((f) => ({
                        ...f,
                        status: v === 'all' ? undefined : (v as CorrectiveActionStatus),
                      }))
                    }
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
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
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({})}
                    className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            {renderActionsTable(allActions, allLoading)}
          </TabsContent>

          <TabsContent value="mine">
            {renderActionsTable(myActions, myLoading)}
          </TabsContent>

          <TabsContent value="overdue">
            {renderActionsTable(
              allActions.filter((a) => a.status === CorrectiveActionStatus.ATRASADA),
              allLoading
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Ação Corretiva</DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1">{selectedAction.action_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="mt-1">{selectedAction.responsible?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <CorrectiveActionStatusBadge status={selectedAction.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prazo</Label>
                  <p className="mt-1">{formatDate(selectedAction.target_date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prioridade</Label>
                  <p className="mt-1">{selectedAction.priority}</p>
                </div>
                {selectedAction.completion_date && (
                  <div>
                    <Label className="text-muted-foreground">Data Conclusão</Label>
                    <p className="mt-1">{formatDate(selectedAction.completion_date)}</p>
                  </div>
                )}
              </div>

              {selectedAction.verification_method && (
                <div>
                  <Label className="text-muted-foreground">Método de Verificação</Label>
                  <p className="mt-1">{selectedAction.verification_method}</p>
                </div>
              )}

              {selectedAction.verification_result && (
                <div>
                  <Label className="text-muted-foreground">Resultado da Verificação</Label>
                  <p className="mt-1">{selectedAction.verification_result}</p>
                </div>
              )}

              {selectedAction.notes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="mt-1">{selectedAction.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/accidents/${selectedAction.accident_id}`)}
                >
                  Ver Acidente
                </Button>
                {selectedAction.status !== CorrectiveActionStatus.CONCLUIDA &&
                  selectedAction.status !== CorrectiveActionStatus.CANCELADA && (
                    <Button
                      onClick={() => {
                        handleStatusUpdate(
                          selectedAction,
                          CorrectiveActionStatus.CONCLUIDA
                        );
                        setSelectedAction(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Concluída
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
