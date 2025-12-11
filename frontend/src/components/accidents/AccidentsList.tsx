import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Accident, TYPE_LABELS } from '@/types/accident.types';
import { SeverityBadge, AccidentStatusBadge } from './AccidentStatusBadge';
import { formatDate } from '@/utils/date';
import { MoreHorizontal, Eye, Pencil, Trash2, FileSearch } from 'lucide-react';

interface AccidentsListProps {
  accidents: Accident[];
  onView: (accident: Accident) => void;
  onEdit: (accident: Accident) => void;
  onDelete: (accident: Accident) => void;
  canDelete?: boolean;
}

export function AccidentsList({
  accidents,
  onView,
  onEdit,
  onDelete,
  canDelete = false,
}: AccidentsListProps) {
  if (accidents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum acidente encontrado</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Obra</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Severidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dias Afast.</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accidents.map((accident) => (
            <TableRow key={accident.id}>
              <TableCell>
                <div>
                  <p className="font-medium line-clamp-1">{accident.title}</p>
                  {accident.victim_name && (
                    <p className="text-sm text-muted-foreground">
                      Vítima: {accident.victim_name}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(accident.accident_date)}</TableCell>
              <TableCell>
                <span className="truncate max-w-[150px] block">
                  {accident.work?.name || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {TYPE_LABELS[accident.accident_type]}
                </span>
              </TableCell>
              <TableCell>
                <SeverityBadge severity={accident.severity} />
              </TableCell>
              <TableCell>
                <AccidentStatusBadge status={accident.status} />
              </TableCell>
              <TableCell>
                {accident.days_away > 0 ? (
                  <span className="font-medium">{accident.days_away}</span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(accident)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(accident)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(accident)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
