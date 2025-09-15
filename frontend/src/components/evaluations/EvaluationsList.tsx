import { Evaluation, EvaluationStatus } from '@/services/evaluations.service';
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
  Eye,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EvaluationsListProps {
  evaluations: Evaluation[];
  onView: (evaluation: Evaluation) => void;
  onEdit: (evaluation: Evaluation) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateReport?: (evaluation: Evaluation) => void;
  evaluationType: 'obra' | 'alojamento';
}

export function EvaluationsList({
  evaluations,
  onView,
  onEdit,
  onComplete,
  onDelete,
  onGenerateReport,
  evaluationType
}: EvaluationsListProps) {
  const getStatusBadge = (status: EvaluationStatus) => {
    switch (status) {
      case EvaluationStatus.DRAFT:
        return <Badge variant="secondary">Rascunho</Badge>;
      case EvaluationStatus.COMPLETED:
        return <Badge variant="default">Finalizada</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-4">
        {evaluations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma avaliação encontrada
          </div>
        ) : (
          evaluations.map((evaluation) => (
            <div key={evaluation.id} className="bg-card border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(evaluation.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="font-medium text-base">{evaluation.work?.number}</div>
                  <div className="text-sm text-muted-foreground truncate">{evaluation.work?.name}</div>
                </div>
                <div className="flex items-center gap-2">
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
                      <DropdownMenuItem onClick={() => onView(evaluation)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
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
                      {evaluation.status === EvaluationStatus.COMPLETED && onGenerateReport && (
                        <DropdownMenuItem onClick={() => onGenerateReport(evaluation)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Gerar Relatório
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {evaluationType === 'alojamento' && evaluation.accommodation && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Alojamento: </span>
                  <span className="font-medium">{evaluation.accommodation.name}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                  <span className="text-muted-foreground">Avaliador:</span>
                  <div className="font-medium truncate">{evaluation.user?.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Funcionários:</span>
                  <div className="font-medium">{evaluation.employees_count}</div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">Multa Total:</div>
                <div className="font-semibold text-lg text-red-600">
                  {formatCurrency(evaluation.total_penalty)}
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
              <TableHead className="w-[120px] text-right">Multa Total</TableHead>
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
                    {format(new Date(evaluation.date), 'dd/MM/yy', { locale: ptBR })}
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
                  <TableCell className="font-medium text-right text-sm">
                    {formatCurrency(evaluation.total_penalty)}
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
                        <DropdownMenuItem onClick={() => onView(evaluation)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
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
                        {evaluation.status === EvaluationStatus.COMPLETED && onGenerateReport && (
                          <DropdownMenuItem onClick={() => onGenerateReport(evaluation)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Gerar Relatório
                          </DropdownMenuItem>
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