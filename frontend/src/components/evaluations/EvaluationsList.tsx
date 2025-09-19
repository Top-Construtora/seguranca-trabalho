import { Evaluation, EvaluationStatus } from '@/services/evaluations.service';
import { calculatePenaltyRange, PenaltyTableEntry } from '@/utils/penaltyCalculator';
import { reportsService } from '@/services/reports.service';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  CheckCircle,
  Trash2,
  FileText,
  Calendar,
  Users,
  Building2,
  Home,
  AlertTriangle,
  User,
  ClipboardCheck
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { ptBR } from 'date-fns/locale';

interface EvaluationsListProps {
  evaluations: Evaluation[];
  onEdit: (evaluation: Evaluation) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateReport?: (evaluation: Evaluation) => void;
  evaluationType: 'obra' | 'alojamento';
}

export function EvaluationsList({
  evaluations,
  onEdit,
  onComplete,
  onDelete,
  onGenerateReport,
  evaluationType
}: EvaluationsListProps) {
  const { data: penaltyTable = [] } = useQuery<PenaltyTableEntry[]>({
    queryKey: ['penalty-table'],
    queryFn: () => reportsService.getPenaltyTable(),
  });
  const getStatusBadge = (status: EvaluationStatus) => {
    switch (status) {
      case EvaluationStatus.DRAFT:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
            <Pencil className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        );
      case EvaluationStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Finalizada
          </Badge>
        );
      default:
        return null;
    }
  };


  const formatPenaltyRange = (evaluation: Evaluation) => {
    const { min, max } = calculatePenaltyRange(evaluation, penaltyTable);

    if (min === 0 && max === 0) return '-';

    const minFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(min);

    const maxFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(max);

    return (
      <div className="text-xs">
        <div className="text-gray-500">Mín: {minFormatted}</div>
        <div className="text-gray-700 font-medium">Máx: {maxFormatted}</div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile and Tablet Cards View */}
      <div className="block lg:hidden space-y-4">
        {evaluations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Nova Avaliação" para começar</p>
          </div>
        ) : (
          evaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatDate(evaluation.date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Código: {evaluation.work?.number}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {evaluation.work?.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(evaluation.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {evaluation.status === EvaluationStatus.DRAFT && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(evaluation)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Continuar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onComplete(evaluation.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Finalizar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(evaluation.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                      {evaluation.status === EvaluationStatus.COMPLETED && (
                        <>
                          {onGenerateReport && (
                            <DropdownMenuItem onClick={() => onGenerateReport(evaluation)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Gerar Relatório
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(evaluation.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>

                {evaluationType === 'alojamento' && evaluation.accommodation && (
                  <div className="flex items-start gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Alojamento</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {evaluation.accommodation.name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Avaliador</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {evaluation.user?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Funcionários</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {evaluation.employees_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Multa Passível</span>
                  </div>
                  <div className="text-right">
                    {formatPenaltyRange(evaluation)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Obra</TableHead>
              {evaluationType === 'alojamento' && <TableHead className="hidden lg:table-cell">Alojamento</TableHead>}
              <TableHead className="hidden md:table-cell">Avaliador</TableHead>
              <TableHead className="w-[80px] text-center">Func.</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[140px] text-right">Multa Passível</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={evaluationType === 'alojamento' ? 8 : 7} className="text-center text-muted-foreground py-8">
                  Nenhuma avaliação encontrada
                </TableCell>
              </TableRow>
            ) : (
              evaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="text-xs sm:text-sm">
                    {formatDate(evaluation.date, 'dd/MM/yy')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{evaluation.work?.number}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{evaluation.work?.name}</div>
                    </div>
                  </TableCell>
                  {evaluationType === 'alojamento' && (
                    <TableCell className="hidden lg:table-cell">
                      <div className="font-medium text-sm truncate max-w-[120px]">
                        {evaluation.accommodation?.name || 'N/A'}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs truncate max-w-[100px]">{evaluation.user?.name}</div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{evaluation.employees_count}</TableCell>
                  <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                  <TableCell className="text-right">
                    {formatPenaltyRange(evaluation)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {evaluation.status === EvaluationStatus.DRAFT && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(evaluation)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Continuar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onComplete(evaluation.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Finalizar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(evaluation.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                        {evaluation.status === EvaluationStatus.COMPLETED && (
                          <>
                            {onGenerateReport && (
                              <DropdownMenuItem onClick={() => onGenerateReport(evaluation)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Gerar Relatório
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(evaluation.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}