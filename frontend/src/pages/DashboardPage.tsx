import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics, useEvaluations } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  HardHat,
  Home,
  BarChart3,
  Hash,
  Percent,
  Building2,
  FileText,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function DashboardPage() {
  const { user, loading: userLoading, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { isLoading: statsLoading } = useEvaluationStatistics();
  const { data: works = [], isLoading: worksLoading } = useWorks();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const { data: penaltyTable = [], isLoading: penaltyLoading } = useQuery({
    queryKey: ['penalty-table'],
    queryFn: () => reportsService.getPenaltyTable(),
  });

  // Estado para controlar modo de visualização do gráfico de conformidade
  const [conformityViewMode, setConformityViewMode] = useState<'quantity' | 'percentage'>('quantity');
  // Estado para controlar tipo de avaliação no gráfico
  const [evaluationType, setEvaluationType] = useState<'obra' | 'alojamento'>('obra');
  // Estado para controlar se o mouse está sobre os gráficos
  const [isHovering, setIsHovering] = useState(false);

  // Verificar se precisamos recuperar o usuário
  React.useEffect(() => {
    if (!user && !userLoading) {
      refreshUser();
    }
  }, [user, userLoading, refreshUser]);

  // Alternar automaticamente entre obra e alojamento a cada 10 segundos
  React.useEffect(() => {
    // Só alterna se não estiver com o mouse em cima
    if (!isHovering) {
      const interval = setInterval(() => {
        setEvaluationType(prev => prev === 'obra' ? 'alojamento' : 'obra');
      }, 10000); // Alterna a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [isHovering]);


  // Processar dados das últimas 5 avaliações
  const lastEvaluationsData = useMemo(() => {
    // Filtrar avaliações baseado no tipo selecionado e ordenar por data
    const filteredEvaluations = evaluations
      .filter(evaluation => evaluation.type === evaluationType && evaluation.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    console.log(`Avaliações de ${evaluationType} encontradas:`, filteredEvaluations.length);
    console.log('Dados das avaliações:', filteredEvaluations);

    // Dados de conformidade
    const conformityData = filteredEvaluations.map(evaluation => {
      // Corrigir o filtro para usar a propriedade correta 'answer' ao invés de 'status'
      const conforme = evaluation.answers?.filter(a => a.answer === 'sim').length || 0;
      const naoConforme = evaluation.answers?.filter(a => a.answer === 'nao').length || 0;
      const naoAplicavel = evaluation.answers?.filter(a => a.answer === 'na').length || 0;

      // Processar nome do local
      let locationName = '';
      if (evaluationType === 'obra') {
        // Para obras, cortar antes do "-"
        locationName = evaluation.work?.name || 'Obra';
        if (locationName.includes('-')) {
          locationName = locationName.split('-')[0].trim();
        }
      } else {
        // Para alojamentos, mostrar "Obra - Alojamento"
        let workName = evaluation.work?.name || 'Obra';
        let accommodationName = evaluation.accommodation?.name || 'Alojamento';

        // Cortar nome da obra antes do "-" se houver
        if (workName.includes('-')) {
          workName = workName.split('-')[0].trim();
        }

        locationName = `${workName} - ${accommodationName}`;
      }

      // Calcular valores baseados no modo de visualização
      const total = conforme + naoConforme; // Não inclui 'não aplicável' no total
      let conformeValue = conforme;
      let naoConformeValue = naoConforme;

      if (conformityViewMode === 'percentage' && total > 0) {
        conformeValue = parseFloat(((conforme / total) * 100).toFixed(1));
        naoConformeValue = parseFloat(((naoConforme / total) * 100).toFixed(1));
      }

      const result = {
        name: locationName,
        conforme: conformeValue,
        naoConforme: naoConformeValue,
        naoAplicavel,
        total,
        conformePercent: ((conforme / (conforme + naoConforme + naoAplicavel)) * 100).toFixed(1)
      };

      console.log('Dados de conformidade para', result.name, result);
      return result;
    });

    // Dados de multas - calcular baseado no peso das questões e quantidade de colaboradores
    // Usando a mesma lógica da central de relatórios
    const penaltyData = filteredEvaluations.map(evaluation => {
      const employeeCount = evaluation.employees_count || 100; // Padrão para 100 se não tiver

      // Contar quantas não conformidades existem por peso
      const nonConformitiesByWeight: Record<number, number> = {};

      if (evaluation.answers && Array.isArray(evaluation.answers)) {
        evaluation.answers.forEach(answer => {
          const answerValue = answer.answer;
          if (answerValue === 'nao') {
            const weight = answer.question?.weight || 1;
            nonConformitiesByWeight[weight] = (nonConformitiesByWeight[weight] || 0) + 1;
          }
        });
      }

      // Calcular valores mínimo e máximo de multa
      let minValue = 0;
      let maxValue = 0;

      Object.entries(nonConformitiesByWeight).forEach(([weightStr, count]) => {
        const weight = parseInt(weightStr);
        const penaltyRow = penaltyTable.find(
          p => p.weight === weight &&
               p.employees_min <= employeeCount &&
               p.employees_max >= employeeCount
        );

        if (penaltyRow) {
          minValue += penaltyRow.min_value * count;
          maxValue += penaltyRow.max_value * count;
        }
      });

      // Aplicar fator de correção monetária de 1,0641
      minValue = minValue * 1.0641;
      maxValue = maxValue * 1.0641;

      // Processar nome para o gráfico de multas
      let displayName = '';
      if (evaluationType === 'obra') {
        // Para obras, cortar antes do "-"
        displayName = evaluation.work?.name || 'Obra';
        if (displayName.includes('-')) {
          displayName = displayName.split('-')[0].trim();
        }
      } else {
        // Para alojamentos, mostrar "Obra - Alojamento"
        let workName = evaluation.work?.name || 'Obra';
        let accommodationName = evaluation.accommodation?.name || 'Alojamento';

        // Cortar nome da obra antes do "-" se houver
        if (workName.includes('-')) {
          workName = workName.split('-')[0].trim();
        }

        displayName = `${workName} - ${accommodationName}`;
      }

      const result = {
        name: displayName,
        minValue,
        maxValue,
        actualValue: evaluation.total_penalty || 0
      };

      console.log('Dados de multa para', result.name, '- Colaboradores:', employeeCount, result);
      return result;
    }).filter(item => item.minValue > 0 || item.maxValue > 0); // Filtrar apenas os que têm multas

    console.log('Dados finais:', { conformityData, penaltyData });
    return { conformityData, penaltyData };
  }, [evaluations, penaltyTable, conformityViewMode, evaluationType]);



  // Calcular métricas para os cards
  const metrics = useMemo(() => {
    // Obras ativas
    const activeWorks = works.filter(work => work.is_active);

    // Contagem de avaliações
    const draftEvaluations = evaluations.filter(e => e.status === 'draft');
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');

    // Calcular taxa de conformidade por obra (apenas avaliações finalizadas)
    const workConformityRates = new Map<string, { workId: string, workName: string, workNumber: string, conformityRate: number, totalEvaluations: number }>();

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
              totalEvaluations: 1
            });
          } else {
            const existing = workConformityRates.get(workId)!;
            // Calcular média ponderada
            const newTotal = existing.totalEvaluations + 1;
            const newRate = ((existing.conformityRate * existing.totalEvaluations) + conformityRate) / newTotal;
            workConformityRates.set(workId, {
              ...existing,
              conformityRate: newRate,
              totalEvaluations: newTotal
            });
          }
        }
      });

    // Ordenar por taxa de conformidade
    const sortedWorks = Array.from(workConformityRates.values()).sort((a, b) => b.conformityRate - a.conformityRate);

    // Top 3 melhores e piores
    const topWorks = sortedWorks.slice(0, 3);
    const bottomWorks = sortedWorks.slice(-3).reverse();

    // Calcular total de multas evitadas (apenas avaliações finalizadas)
    let totalMinPenalty = 0;
    let totalMaxPenalty = 0;

    completedEvaluations.forEach(evaluation => {
      const employeeCount = evaluation.employees_count || 100;
      const nonConformitiesByWeight: Record<number, number> = {};

      if (evaluation.answers && Array.isArray(evaluation.answers)) {
        evaluation.answers.forEach(answer => {
          if (answer.answer === 'nao') {
            const weight = answer.question?.weight || 1;
            nonConformitiesByWeight[weight] = (nonConformitiesByWeight[weight] || 0) + 1;
          }
        });
      }

      Object.entries(nonConformitiesByWeight).forEach(([weightStr, count]) => {
        const weight = parseInt(weightStr);
        const penaltyRow = penaltyTable.find(
          p => p.weight === weight &&
               p.employees_min <= employeeCount &&
               p.employees_max >= employeeCount
        );

        if (penaltyRow) {
          totalMinPenalty += penaltyRow.min_value * count * 1.0641; // Fator de correção
          totalMaxPenalty += penaltyRow.max_value * count * 1.0641;
        }
      });
    });

    return {
      activeWorks: activeWorks.length,
      draftCount: draftEvaluations.length,
      completedCount: completedEvaluations.length,
      topWorks,
      bottomWorks,
      totalMinPenalty,
      totalMaxPenalty
    };
  }, [works, evaluations, penaltyTable]);

  if (statsLoading || worksLoading || userLoading || evaluationsLoading || penaltyLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="space-y-6 p-2">
        {/* Título da Página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visão geral do sistema de segurança e saúde do trabalho
          </p>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card Obras Ativas */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e6076]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#1e6076]/10 dark:bg-[#1e6076]/20 rounded-lg mb-3">
                    <Building2 className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#1e6076] dark:text-[#12b0a0] uppercase tracking-wider">
                      Obras Ativas
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-[#1e6076] to-[#12b0a0] bg-clip-text text-transparent">
                    {metrics.activeWorks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    em operação
                  </p>
                </div>
                <div className="absolute top-4 right-4 p-3 bg-gradient-to-br from-[#12b0a0]/20 to-[#1e6076]/20 rounded-2xl">
                  <Building2 className="h-8 w-8 text-[#1e6076] dark:text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Avaliações Finalizadas */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg mb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Finalizadas
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-green-500 bg-clip-text text-transparent">
                    {metrics.completedCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    avaliações completas
                  </p>
                </div>
                <div className="absolute top-4 right-4 p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Rascunhos */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg mb-3">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Rascunhos
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-amber-600 to-orange-500 bg-clip-text text-transparent">
                    {metrics.draftCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    em elaboração
                  </p>
                </div>
                <div className="absolute top-4 right-4 p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl">
                  <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Taxa de Conclusão */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-lg mb-3">
                    <TrendingUp className="h-4 w-4 text-[#12b0a0] dark:text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#12b0a0] uppercase tracking-wider">
                      Taxa de Conclusão
                    </p>
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-br from-[#12b0a0] to-[#1e6076] bg-clip-text text-transparent">
                    {metrics.completedCount + metrics.draftCount > 0
                      ? Math.round((metrics.completedCount / (metrics.completedCount + metrics.draftCount)) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    de completude
                  </p>
                </div>
                <div className="absolute top-4 right-4 p-3 bg-gradient-to-br from-[#12b0a0]/20 to-[#1e6076]/20 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda Linha - Multas e Ranking */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Card de Multas Passíveis */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <CardTitle className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Multas Passíveis
                  </CardTitle>
                </div>
                <div className="p-2 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
                  Valor Mínimo
                </p>
                <p className="text-2xl font-bold bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.totalMinPenalty)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl border border-red-200/50 dark:border-red-800/50">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">
                  Valor Máximo
                </p>
                <p className="text-2xl font-bold bg-gradient-to-br from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(metrics.totalMaxPenalty)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Ranking Unificado */}
          <Card className="lg:col-span-2 group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-[#1e6076]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#12b0a0]/10 to-[#1e6076]/10 dark:from-[#12b0a0]/20 dark:to-[#1e6076]/20 rounded-lg">
                  <Trophy className="h-4 w-4 text-[#12b0a0]" />
                  <CardTitle className="text-sm font-semibold text-[#1e6076] dark:text-[#12b0a0] uppercase tracking-wider">
                    Ranking de Conformidade
                  </CardTitle>
                </div>
                <div className="p-2 bg-gradient-to-br from-[#12b0a0]/10 to-[#1e6076]/10 rounded-xl">
                  <Trophy className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Coluna Top 3 Melhores */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gradient-to-r from-emerald-500/20 to-transparent">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Top 3 Melhores</h3>
                  </div>
                  <div className="space-y-2.5">
                    {metrics.topWorks.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">Nenhuma avaliação finalizada</p>
                    ) : (
                      metrics.topWorks.map((work, index) => (
                        <div key={work.workId} className="group flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent rounded-xl hover:from-emerald-100/70 dark:hover:from-emerald-900/20 transition-all duration-200 border border-emerald-200/30 dark:border-emerald-800/30">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
                              index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                              index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                              "bg-gradient-to-br from-orange-400 to-orange-500"
                            )}>
                              {index + 1}º
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {work.workNumber}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {work.workName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              {work.conformityRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {work.totalEvaluations} aval.
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coluna Precisam Atenção */}
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gradient-to-r from-red-500/20 to-transparent">
                    <div className="p-1.5 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">Precisam Atenção</h3>
                  </div>
                  <div className="space-y-2.5">
                    {metrics.bottomWorks.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">Nenhuma avaliação finalizada</p>
                    ) : (
                      metrics.bottomWorks.map((work) => (
                        <div key={work.workId} className="group flex items-center justify-between p-3.5 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent rounded-xl hover:from-red-100/70 dark:hover:from-red-900/20 transition-all duration-200 border border-red-200/30 dark:border-red-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                              <TrendingDown className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {work.workNumber}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {work.workName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold bg-gradient-to-br from-red-600 to-rose-600 bg-clip-text text-transparent">
                              {work.conformityRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {work.totalEvaluations} aval.
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos das últimas 5 avaliações */}
        <div
          className="grid gap-6 lg:grid-cols-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Gráfico de Conformidade */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#12b0a0]/5 to-[#1e6076]/5 dark:from-[#12b0a0]/10 dark:to-[#1e6076]/10 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076] dark:text-gray-100">
                    <div className="p-2.5 bg-gradient-to-br from-[#12b0a0] to-[#1e6076] rounded-xl shadow-md">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight flex items-center gap-2">
                      Taxa de Conformidade
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#12b0a0]/10 to-[#1e6076]/10 dark:from-[#12b0a0]/20 dark:to-[#1e6076]/20 rounded-full text-sm font-medium transition-all duration-500 text-gray-700 dark:text-gray-300">
                        {evaluationType === 'obra' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <HardHat className="h-4 w-4 text-[#12b0a0]" />
                            <span>Obras</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-[#12b0a0]" />
                            <span>Alojamentos</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                    Status de conformidade das últimas 5 avaliações de {evaluationType === 'obra' ? 'obras' : 'alojamentos'}
                  </CardDescription>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setConformityViewMode('quantity')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      conformityViewMode === 'quantity'
                        ? "bg-white dark:bg-gray-800 text-[#12b0a0] shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                    title="Visualizar em quantidade"
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConformityViewMode('percentage')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      conformityViewMode === 'percentage'
                        ? "bg-white dark:bg-gray-800 text-[#12b0a0] shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                    title="Visualizar em porcentagem"
                  >
                    <Percent className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6 bg-white dark:bg-gray-800">
              <div key={evaluationType}>
                {lastEvaluationsData.conformityData.length > 0 ? (
                  <>
                    <div className="absolute top-2 right-4 z-10 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#12b0a0' }}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Conforme</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Não Conforme</span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={lastEvaluationsData.conformityData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <defs>
                      <linearGradient id="conformeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#12b0a0" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#12b0a0" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="naoConformeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      domain={conformityViewMode === 'percentage' ? [0, 100] : undefined}
                      tickFormatter={conformityViewMode === 'percentage' ? (value) => `${value}%` : undefined}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        color: theme === 'dark' ? '#9ca3af' : '#1e6076',
                        fontWeight: 600
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                      formatter={(value: any) => {
                        const formattedValue = conformityViewMode === 'percentage' ? `${value}%` : value;
                        return formattedValue;
                      }}
                    />
                    <Bar
                      dataKey="conforme"
                      fill="url(#conformeGradient)"
                      name="Conforme"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="naoConforme"
                      fill="url(#naoConformeGradient)"
                      name="Não Conforme"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[360px] text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">
                    Nenhuma avaliação de {evaluationType === 'obra' ? 'obra' : 'alojamento'} finalizada
                  </p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Multas */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#baa673]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#baa673]/5 to-[#1e6076]/5 dark:from-[#baa673]/10 dark:to-[#1e6076]/10 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076] dark:text-gray-100">
                    <div className="p-2.5 bg-gradient-to-br from-[#baa673] to-[#1e6076] rounded-xl shadow-md">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight flex items-center gap-2">
                      Multas Passíveis
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#baa673]/10 to-[#1e6076]/10 dark:from-[#baa673]/20 dark:to-[#1e6076]/20 rounded-full text-sm font-medium transition-all duration-500 text-gray-700 dark:text-gray-300">
                        {evaluationType === 'obra' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <HardHat className="h-4 w-4 text-[#baa673]" />
                            <span>Obras</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-[#baa673]" />
                            <span>Alojamentos</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                    Valores de multas das últimas 5 avaliações de {evaluationType === 'obra' ? 'obras' : 'alojamentos'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6 bg-white dark:bg-gray-800">
              <div key={`penalty-${evaluationType}`}>
                {lastEvaluationsData.penaltyData.length > 0 ? (
                <>
                  <div className="absolute top-2 right-4 z-10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Valor Mínimo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#baa673' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Valor Máximo</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={lastEvaluationsData.penaltyData} margin={{ top: 20, right: 30, left: 50, bottom: 80 }}>
                    <defs>
                      <linearGradient id="minGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="maxGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#baa673" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#baa673" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('pt-BR', {
                          notation: 'compact',
                          compactDisplay: 'short',
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        color: theme === 'dark' ? '#9ca3af' : '#1e6076',
                        fontWeight: 600
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                      formatter={(value: any) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(value)
                      }
                    />
                    <Bar
                      dataKey="minValue"
                      name="Valor Mínimo"
                      fill="url(#minGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="maxValue"
                      name="Valor Máximo"
                      fill="url(#maxGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[360px] text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">
                    Nenhuma avaliação de {evaluationType === 'obra' ? 'obra' : 'alojamento'} finalizada
                  </p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}