import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluations } from '@/hooks/useEvaluations';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Trophy,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowLeft,
  Building2,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type SortField = 'position' | 'workNumber' | 'workName' | 'conformityRate' | 'totalEvaluations';
type SortOrder = 'asc' | 'desc';

export function RankingPage() {
  const navigate = useNavigate();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Calcular ranking de conformidade por obra
  const rankingData = useMemo(() => {
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    const workConformityRates = new Map<string, {
      workId: string,
      workName: string,
      workNumber: string,
      conformityRate: number,
      totalEvaluations: number,
      totalConforme: number,
      totalNaoConforme: number
    }>();

    completedEvaluations
      .filter(e => e.type === 'obra')
      .forEach(evaluation => {
        const workId = evaluation.work_id;
        const workName = evaluation.work?.name || 'Obra';
        const workNumber = evaluation.work?.number || '';

        const conforme = evaluation.answers?.filter(a => a.answer === 'sim').length || 0;
        const naoConforme = evaluation.answers?.filter(a => a.answer === 'nao').length || 0;
        const total = conforme + naoConforme;

        if (total > 0) {
          const conformityRate = (conforme / total) * 100;

          if (!workConformityRates.has(workId)) {
            workConformityRates.set(workId, {
              workId,
              workName,
              workNumber,
              conformityRate,
              totalEvaluations: 1,
              totalConforme: conforme,
              totalNaoConforme: naoConforme
            });
          } else {
            const existing = workConformityRates.get(workId)!;
            const newTotal = existing.totalEvaluations + 1;
            const newRate = ((existing.conformityRate * existing.totalEvaluations) + conformityRate) / newTotal;
            workConformityRates.set(workId, {
              ...existing,
              conformityRate: newRate,
              totalEvaluations: newTotal,
              totalConforme: existing.totalConforme + conforme,
              totalNaoConforme: existing.totalNaoConforme + naoConforme
            });
          }
        }
      });

    // Ordenar por taxa de conformidade para definir posições
    const sorted = Array.from(workConformityRates.values())
      .sort((a, b) => b.conformityRate - a.conformityRate)
      .map((work, index) => ({
        ...work,
        position: index + 1
      }));

    return sorted;
  }, [evaluations]);

  // Filtrar e ordenar dados
  const filteredAndSortedData = useMemo(() => {
    let data = [...rankingData];

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(work =>
        work.workName.toLowerCase().includes(term) ||
        work.workNumber.toLowerCase().includes(term)
      );
    }

    // Ordenar
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'position':
          comparison = a.position - b.position;
          break;
        case 'workNumber':
          comparison = a.workNumber.localeCompare(b.workNumber);
          break;
        case 'workName':
          comparison = a.workName.localeCompare(b.workName);
          break;
        case 'conformityRate':
          comparison = a.conformityRate - b.conformityRate;
          break;
        case 'totalEvaluations':
          comparison = a.totalEvaluations - b.totalEvaluations;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [rankingData, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'conformityRate' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Minus className="h-3 w-3 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="h-4 w-4 text-[#12b0a0]" />
      : <ChevronDown className="h-4 w-4 text-[#12b0a0]" />;
  };

  const getPositionStyle = (position: number) => {
    if (position === 1) return 'bg-[#f59e0b] text-white';
    if (position === 2) return 'bg-gray-400 text-white';
    if (position === 3) return 'bg-[#fb923c] text-white';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getConformityColor = (rate: number) => {
    if (rate >= 80) return 'text-[#12b0a0]';
    if (rate >= 60) return 'text-[#f59e0b]';
    return 'text-red-500';
  };

  if (evaluationsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#12b0a0] dark:text-gray-400 dark:hover:text-[#12b0a0] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-[#12b0a0] rounded-xl">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              Ranking de Conformidade
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-12">
              Classificação completa das obras por taxa de conformidade
            </p>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#12b0a0]/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-[#12b0a0]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total de Obras</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{rankingData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#12b0a0]/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-[#12b0a0]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Média Geral</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {rankingData.length > 0
                      ? `${(rankingData.reduce((sum, w) => sum + w.conformityRate, 0) / rankingData.length).toFixed(0)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Precisam Atenção</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {rankingData.filter(w => w.conformityRate < 60).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou nome da obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Tabela de Ranking */}
        <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#12b0a0]/5 to-[#1e6076]/5">
            <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Ranking Completo
            </CardTitle>
            <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
              Clique nas colunas para ordenar • Clique em uma obra para ver detalhes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedData.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-flex mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nenhuma obra encontrada com esse termo' : 'Nenhuma avaliação finalizada ainda'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('position')}
                      >
                        <div className="flex items-center gap-1">
                          Pos.
                          <SortIcon field="position" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('workNumber')}
                      >
                        <div className="flex items-center gap-1">
                          Número
                          <SortIcon field="workNumber" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('workName')}
                      >
                        <div className="flex items-center gap-1">
                          Nome da Obra
                          <SortIcon field="workName" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('conformityRate')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Conformidade
                          <SortIcon field="conformityRate" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('totalEvaluations')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Avaliações
                          <SortIcon field="totalEvaluations" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredAndSortedData.map((work) => (
                      <tr
                        key={work.workId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/works/${work.workId}`)}
                      >
                        <td className="px-4 py-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                            getPositionStyle(work.position)
                          )}>
                            {work.position}º
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-800 dark:text-gray-100">
                            {work.workNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {work.workName.split('-')[0].trim()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-lg font-bold",
                            getConformityColor(work.conformityRate)
                          )}>
                            {work.conformityRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {work.totalEvaluations}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {work.conformityRate >= 80 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#12b0a0]/10 text-[#12b0a0] rounded-full text-xs font-medium">
                              <TrendingUp className="h-3 w-3" />
                              Ótimo
                            </span>
                          ) : work.conformityRate >= 60 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-full text-xs font-medium">
                              <Minus className="h-3 w-3" />
                              Regular
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Crítico
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
