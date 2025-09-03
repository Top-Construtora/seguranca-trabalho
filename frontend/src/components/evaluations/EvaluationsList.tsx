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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Obra</TableHead>
            {evaluationType === 'alojamento' && <TableHead>Alojamento</TableHead>}
            <TableHead>Avaliador</TableHead>
            <TableHead>Funcionários</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Multa Total</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={evaluationType === 'alojamento' ? 8 : 7} className="text-center text-muted-foreground">
                Nenhuma avaliação encontrada
              </TableCell>
            </TableRow>
          ) : (
            evaluations.map((evaluation) => (
              <TableRow key={evaluation.id}>
                <TableCell>
                  {format(new Date(evaluation.date), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{evaluation.work?.number}</div>
                    <div className="text-sm text-muted-foreground">{evaluation.work?.name}</div>
                  </div>
                </TableCell>
                {evaluationType === 'alojamento' && (
                  <TableCell>
                    <div className="font-medium">
                      {evaluation.accommodation?.name || 'N/A'}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="text-sm">{evaluation.user?.name}</div>
                </TableCell>
                <TableCell>{evaluation.employees_count}</TableCell>
                <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                <TableCell className="font-medium">
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
  );
}