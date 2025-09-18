import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface FilterProps {
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters?: () => void;
  onResetFilters: () => void;
  works: any[];
  accommodations: any[];
  users: any[];
  loading?: boolean;
  reportType?: string;
  onReportTypeChange?: (value: string) => void;
}

export function ReportFilters({
  filters,
  onFilterChange,
  onResetFilters,
  works,
  accommodations,
  users,
  reportType,
  onReportTypeChange,
}: FilterProps) {
  const [isOpen, setIsOpen] = useState(true);

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

  const getDisplayValue = (value: string): string => {
    return value || 'all';
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filtros de Relatório</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge className="mt-1 bg-[#12b0a0]/10 text-[#12b0a0] border-[#12b0a0]/20">
                    {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetFilters}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Tabs de Seleção de Tipo */}
            {reportType && onReportTypeChange && (
              <Tabs value={reportType} onValueChange={onReportTypeChange}>
                <TabsList className="grid w-full grid-cols-2 max-w-xs bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="obra" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Obras</TabsTrigger>
                  <TabsTrigger value="alojamento" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">Alojamentos</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-1 h-5">
                  <Calendar className="h-3 w-3" />
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterChange('startDate', e.target.value)}
                  className="w-full h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-1 h-5">
                  <Calendar className="h-3 w-3" />
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterChange('endDate', e.target.value)}
                  min={filters.startDate}
                  className="w-full h-9 text-sm"
                />
              </div>

              {(!reportType || reportType === 'obra') && works.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="work" className="h-5 flex items-center">Obra</Label>
                  <Select
                    value={getDisplayValue(filters.workId || '')}
                    onValueChange={(value) =>
                      onFilterChange('workId', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Todas as obras" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as obras</SelectItem>
                      {works?.map((work) => (
                        <SelectItem key={work.id} value={work.id}>
                          {work.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!reportType && (
                <div className="space-y-2">
                  <Label htmlFor="type" className="h-5 flex items-center">Tipo</Label>
                  <Select
                    value={getDisplayValue(filters.type || '')}
                    onValueChange={(value) =>
                      onFilterChange('type', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="obra">Obra</SelectItem>
                      <SelectItem value="alojamento">Alojamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(!reportType || reportType === 'alojamento') && accommodations.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="accommodation" className="h-5 flex items-center">Alojamento</Label>
                  <Select
                    value={getDisplayValue(filters.accommodationId || '')}
                    onValueChange={(value) =>
                      onFilterChange('accommodationId', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Todos os alojamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os alojamentos</SelectItem>
                      {accommodations?.map((accommodation) => {
                        // Se o alojamento tem obras associadas, mostrar a primeira obra
                        const workName = accommodation.works && accommodation.works.length > 0
                          ? accommodation.works[0].name
                          : null;

                        return (
                          <SelectItem key={accommodation.id} value={accommodation.id}>
                            {workName ? `${workName} - ${accommodation.name}` : accommodation.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="evaluator" className="h-5 flex items-center">Avaliador</Label>
                <Select
                  value={getDisplayValue(filters.userId || '')}
                  onValueChange={(value) =>
                    onFilterChange('userId', value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Todos os avaliadores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os avaliadores</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    onFilterChange('startDate', format(weekAgo, 'yyyy-MM-dd'));
                    onFilterChange('endDate', format(today, 'yyyy-MM-dd'));
                  }}
                >
                  Última semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    onFilterChange('startDate', format(monthAgo, 'yyyy-MM-dd'));
                    onFilterChange('endDate', format(today, 'yyyy-MM-dd'));
                  }}
                >
                  Último mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    onFilterChange('startDate', format(yearStart, 'yyyy-MM-dd'));
                    onFilterChange('endDate', format(today, 'yyyy-MM-dd'));
                  }}
                >
                  Este ano
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}