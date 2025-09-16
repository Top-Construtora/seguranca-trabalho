import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  Search,
  SlidersHorizontal,
  X,
  Download,
  Upload,
  Save,
} from 'lucide-react';

interface SearchFilters {
  query: string;
  scoreMin: number;
  scoreMax: number;
  conformityMin: number;
  conformityMax: number;
  onlyCompleted: boolean;
  onlyCritical: boolean;
  sortBy: string;
  groupBy: string;
}

interface ReportSearchProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  onExportFilters: () => void;
  onImportFilters: (file: File) => void;
  totalResults?: number;
}

export function ReportSearch({
  onSearch,
  onFiltersChange,
  onExportFilters,
  onImportFilters,
  totalResults,
}: ReportSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    scoreMin: 0,
    scoreMax: 100,
    conformityMin: 0,
    conformityMax: 100,
    onlyCompleted: false,
    onlyCritical: false,
    sortBy: 'date',
    groupBy: 'none',
  });

  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: SearchFilters }>>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reportFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const handleSearch = () => {
    onSearch(searchQuery);
    setFilters({ ...filters, query: searchQuery });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      scoreMin: 0,
      scoreMax: 100,
      conformityMin: 0,
      conformityMax: 100,
      onlyCompleted: false,
      onlyCritical: false,
      sortBy: 'date',
      groupBy: 'none',
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    onFiltersChange(defaultFilters);
  };

  const saveCurrentFilters = () => {
    const name = prompt('Nome para este conjunto de filtros:');
    if (name) {
      const newSaved = [...savedFilters, { name, filters }];
      setSavedFilters(newSaved);
      localStorage.setItem('reportFilters', JSON.stringify(newSaved));
    }
  };

  const loadSavedFilter = (savedFilter: SearchFilters) => {
    setFilters(savedFilter);
    setSearchQuery(savedFilter.query);
    onFiltersChange(savedFilter);
  };

  const activeFiltersCount = [
    filters.scoreMin > 0 || filters.scoreMax < 100,
    filters.conformityMin > 0 || filters.conformityMax < 100,
    filters.onlyCompleted,
    filters.onlyCritical,
    filters.sortBy !== 'date',
    filters.groupBy !== 'none',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em relatórios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Buscar</Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
              <SheetDescription>
                Refine sua busca com filtros detalhados
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Score Range */}
              <div className="space-y-3">
                <Label>Faixa de Pontuação</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {filters.scoreMin}%
                  </span>
                  <Slider
                    value={[filters.scoreMin, filters.scoreMax]}
                    onValueChange={(value) => {
                      handleFilterChange('scoreMin', value[0]);
                      handleFilterChange('scoreMax', value[1]);
                    }}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {filters.scoreMax}%
                  </span>
                </div>
              </div>

              {/* Conformity Range */}
              <div className="space-y-3">
                <Label>Faixa de Conformidade</Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {filters.conformityMin}%
                  </span>
                  <Slider
                    value={[filters.conformityMin, filters.conformityMax]}
                    onValueChange={(value) => {
                      handleFilterChange('conformityMin', value[0]);
                      handleFilterChange('conformityMax', value[1]);
                    }}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {filters.conformityMax}%
                  </span>
                </div>
              </div>

              <Separator />

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="completed">Apenas avaliações concluídas</Label>
                  <Switch
                    id="completed"
                    checked={filters.onlyCompleted}
                    onCheckedChange={(checked) => handleFilterChange('onlyCompleted', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="critical">Apenas itens críticos</Label>
                  <Switch
                    id="critical"
                    checked={filters.onlyCritical}
                    onCheckedChange={(checked) => handleFilterChange('onlyCritical', checked)}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort and Group */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Ordenar por</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger id="sortBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="score">Pontuação</SelectItem>
                      <SelectItem value="conformity">Conformidade</SelectItem>
                      <SelectItem value="work">Obra</SelectItem>
                      <SelectItem value="evaluator">Avaliador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupBy">Agrupar por</Label>
                  <Select
                    value={filters.groupBy}
                    onValueChange={(value) => handleFilterChange('groupBy', value)}
                  >
                    <SelectTrigger id="groupBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não agrupar</SelectItem>
                      <SelectItem value="work">Obra</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="evaluator">Avaliador</SelectItem>
                      <SelectItem value="type">Tipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="space-y-2">
                  <Label>Filtros Salvos</Label>
                  <div className="space-y-2">
                    {savedFilters.map((saved, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <span className="text-sm">{saved.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadSavedFilter(saved.filters)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={saveCurrentFilters}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onExportFilters}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <label className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <div>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onImportFilters(file);
                        }}
                      />
                    </div>
                  </Button>
                </label>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {(filters.scoreMin > 0 || filters.scoreMax < 100) && (
            <Badge variant="secondary">
              Pontuação: {filters.scoreMin}% - {filters.scoreMax}%
            </Badge>
          )}

          {(filters.conformityMin > 0 || filters.conformityMax < 100) && (
            <Badge variant="secondary">
              Conformidade: {filters.conformityMin}% - {filters.conformityMax}%
            </Badge>
          )}

          {filters.onlyCompleted && (
            <Badge variant="secondary">Apenas concluídas</Badge>
          )}

          {filters.onlyCritical && (
            <Badge variant="secondary">Apenas críticos</Badge>
          )}

          {filters.sortBy !== 'date' && (
            <Badge variant="secondary">Ordenado por: {filters.sortBy}</Badge>
          )}

          {filters.groupBy !== 'none' && (
            <Badge variant="secondary">Agrupado por: {filters.groupBy}</Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar todos
          </Button>
        </div>
      )}

      {/* Results Count */}
      {totalResults !== undefined && (
        <div className="text-sm text-muted-foreground">
          {totalResults === 0 ? (
            'Nenhum resultado encontrado'
          ) : (
            <>
              Encontrado{totalResults === 1 ? '' : 's'} <span className="font-medium text-foreground">{totalResults}</span> resultado{totalResults === 1 ? '' : 's'}
            </>
          )}
        </div>
      )}
    </div>
  );
}