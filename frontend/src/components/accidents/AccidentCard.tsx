import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accident, TYPE_LABELS, BODY_PART_LABELS } from '@/types/accident.types';
import { SeverityBadge, AccidentStatusBadge } from './AccidentStatusBadge';
import { formatDate } from '@/utils/date';
import {
  Calendar,
  Building2,
  User,
  Clock,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccidentCardProps {
  accident: Accident;
  onView: (accident: Accident) => void;
  onEdit: (accident: Accident) => void;
  onDelete: (accident: Accident) => void;
  canDelete?: boolean;
}

export function AccidentCard({
  accident,
  onView,
  onEdit,
  onDelete,
  canDelete = false,
}: AccidentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">{accident.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {accident.description}
            </p>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={accident.severity} />
          <AccidentStatusBadge status={accident.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(accident.accident_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{accident.work?.name || 'N/A'}</span>
          </div>
          {accident.victim_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{accident.victim_name}</span>
            </div>
          )}
          {accident.days_away > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{accident.days_away} dias afastamento</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Tipo:</p>
          <p className="text-sm">{TYPE_LABELS[accident.accident_type]}</p>
        </div>

        {accident.body_parts && accident.body_parts.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Partes afetadas:</p>
            <div className="flex flex-wrap gap-1">
              {accident.body_parts.slice(0, 3).map((bp) => (
                <span
                  key={bp.id}
                  className="text-xs bg-muted px-2 py-0.5 rounded"
                >
                  {BODY_PART_LABELS[bp.body_part]}
                </span>
              ))}
              {accident.body_parts.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{accident.body_parts.length - 3} mais
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(accident)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(accident)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
