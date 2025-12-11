import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  AccidentFilters as IAccidentFilters,
  AccidentSeverity,
  AccidentStatus,
  AccidentType,
  SEVERITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/types/accident.types';
import { useWorks } from '@/hooks/useWorks';
import { Search, X } from 'lucide-react';

interface AccidentFiltersProps {
  filters: IAccidentFilters;
  onFiltersChange: (filters: IAccidentFilters) => void;
}

export function AccidentFilters({ filters, onFiltersChange }: AccidentFiltersProps) {
  const { data: works = [] } = useWorks();

  const handleChange = (key: keyof IAccidentFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 10,
    });
  };

  const hasFilters =
    filters.work_id ||
    filters.severity ||
    filters.status ||
    filters.accident_type ||
    filters.start_date ||
    filters.end_date;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Filtros
        </h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="space-y-2">
          <Label>Obra</Label>
          <Select
            value={filters.work_id || 'all'}
            onValueChange={(value) => handleChange('work_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {works.map((work) => (
                <SelectItem key={work.id} value={work.id}>
                  {work.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severidade</Label>
          <Select
            value={filters.severity || 'all'}
            onValueChange={(value) => handleChange('severity', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.accident_type || 'all'}
            onValueChange={(value) => handleChange('accident_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value || undefined)}
          />
        </div>
      </div>
    </div>
  );
}
