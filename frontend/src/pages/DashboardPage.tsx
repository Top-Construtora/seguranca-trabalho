import React, { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics, useEvaluations } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import documentsService from '@/services/documents.service';
import { Document } from '@/types/document';
import { useNavigate } from 'react-router-dom';
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
  Trophy,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  FileCheck,
  ShieldCheck
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
import { ChartModal } from '@/components/charts/ChartModal';

// Função para formatar valores monetários de forma compacta
const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `R$ ${millions.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `R$ ${thousands.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mil`;
  }
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { isLoading: statsLoading } = useEvaluationStatistics();
  const { data: works = [], isLoading: worksLoading } = useWorks();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const { data: penaltyTable = [], isLoading: penaltyLoading } = useQuery({
    queryKey: ['penalty-table'],
    queryFn: () => reportsService.getPenaltyTable(),
  });
  const [expiringDocuments, setExpiringDocuments] = useState<Document[]>([]);

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

  // Carregar documentos próximos do vencimento
  useEffect(() => {
    const loadExpiringDocuments = async () => {
      try {
        const data = await documentsService.getExpiring(30);
        setExpiringDocuments(data.slice(0, 3)); // Pegar apenas os 3 primeiros
      } catch (error) {
        console.error('Erro ao carregar documentos próximos do vencimento:', error);
      }
    };
    loadExpiringDocuments();
  }, []);

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

    // Calcular média geral de conformidade
    let averageConformity = 0;
    if (sortedWorks.length > 0) {
      const totalConformity = sortedWorks.reduce((sum, work) => sum + work.conformityRate, 0);
      averageConformity = totalConformity / sortedWorks.length;
    }

    return {
      activeWorks: activeWorks.length,
      draftCount: draftEvaluations.length,
      completedCount: completedEvaluations.length,
      topWorks,
      bottomWorks,
      totalMinPenalty,
      totalMaxPenalty,
      averageConformity
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
      <div className="space-y-3 p-2">
        {/* Título da Página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visão geral do sistema de segurança e saúde do trabalho
          </p>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card Obras Ativas */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e6076]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-lg mb-3">
                    <Building2 className="h-4 w-4 text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#12b0a0] uppercase tracking-wider">
                      Obras Ativas
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.activeWorks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    em operação
                  </p>
                </div>
                <div className="absolute top-3 right-3 p-2 bg-[#12b0a0]/10 rounded-xl">
                  <Building2 className="h-5 w-5 text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Avaliações Unificado */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-lg mb-3">
                    <FileText className="h-4 w-4 text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#12b0a0] uppercase tracking-wider">
                      Avaliações
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.completedCount + metrics.draftCount}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#12b0a0]"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {metrics.completedCount} finalizadas
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {metrics.draftCount} rascunhos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 p-2 bg-[#12b0a0]/10 rounded-xl">
                  <FileText className="h-5 w-5 text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Taxa de Conclusão */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-lg mb-3">
                    <TrendingUp className="h-4 w-4 text-[#12b0a0] dark:text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#12b0a0] uppercase tracking-wider">
                      Taxa Conclusão
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.completedCount + metrics.draftCount > 0
                      ? Math.round((metrics.completedCount / (metrics.completedCount + metrics.draftCount)) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    de completude
                  </p>
                </div>
                <div className="absolute top-3 right-3 p-2 bg-[#12b0a0]/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Média de Conformidade */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-lg mb-3">
                    <ShieldCheck className="h-4 w-4 text-[#12b0a0]" />
                    <p className="text-xs font-semibold text-[#12b0a0] uppercase tracking-wider">
                      Média Geral
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.averageConformity > 0 ? `${metrics.averageConformity.toFixed(0)}%` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    de conformidade
                  </p>
                </div>
                <div className="absolute top-3 right-3 p-2 bg-[#12b0a0]/10 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-[#12b0a0]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segunda Linha - Layout 3 colunas */}
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Card de Ranking - Layout Vertical */}
          <Card className="lg:col-span-1 group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-[#1e6076]/5 opacity-50" />
            <CardHeader className="pb-2 relative border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#12b0a0] rounded-xl shadow-md">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ranking')}
                    className="text-[#12b0a0] hover:text-[#12b0a0]/80 h-8 px-2"
                  >
                    Ver todas
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Ranking de Conformidade
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Obras por taxa de conformidade
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {/* Top 3 Melhores */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#12b0a0]" />
                  <h3 className="text-xs font-bold text-[#12b0a0] uppercase tracking-wide">Top 3 Melhores</h3>
                </div>
                <div className="space-y-2">
                  {metrics.topWorks.length === 0 ? (
                    <p className="text-center text-gray-400 py-3 text-xs">Sem dados</p>
                  ) : (
                    metrics.topWorks.map((work, index) => (
                      <div
                        key={work.workId}
                        className="group/item flex items-center justify-between p-2 bg-[#12b0a0]/5 dark:bg-[#12b0a0]/10 rounded-lg hover:bg-[#12b0a0]/10 dark:hover:bg-[#12b0a0]/20 transition-all duration-200 border border-[#12b0a0]/20 dark:border-[#12b0a0]/30 cursor-pointer"
                        onClick={() => navigate(`/works/${work.workId}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md",
                            index === 0 ? "bg-[#f59e0b]" :
                            index === 1 ? "bg-gray-400" :
                            "bg-[#fb923c]"
                          )}>
                            {index + 1}º
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {work.workNumber}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {work.workName.split('-')[0].trim()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-[#12b0a0]">
                            {work.conformityRate.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {work.totalEvaluations} aval.
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Precisam Atenção */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-wide">Precisam Atenção</h3>
                </div>
                <div className="space-y-2">
                  {metrics.bottomWorks.length === 0 ? (
                    <p className="text-center text-gray-400 py-3 text-xs">Sem dados</p>
                  ) : (
                    metrics.bottomWorks.map((work) => (
                      <div
                        key={work.workId}
                        className="group/item flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 border border-red-200/50 dark:border-red-800/50 cursor-pointer"
                        onClick={() => navigate(`/works/${work.workId}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                            <AlertTriangle className="h-3 w-3 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {work.workNumber}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {work.workName.split('-')[0].trim()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-red-500">
                            {work.conformityRate.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {work.totalEvaluations} aval.
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Multas Evitadas - Melhorado */}
          <Card className="lg:col-span-1 group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-[#1e6076]/5 opacity-50" />
            <CardHeader className="pb-2 relative border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#12b0a0] rounded-xl shadow-md">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <Badge className="bg-[#12b0a0]/10 text-[#12b0a0] dark:bg-[#12b0a0]/20 dark:text-[#12b0a0] border-0">
                    Economia
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Multas Evitadas
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Valores economizados com conformidade
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {/* Valor Total Destacado */}
              <div className="p-4 bg-[#12b0a0]/10 dark:bg-[#12b0a0]/20 rounded-xl border border-[#12b0a0]/30 dark:border-[#12b0a0]/20">
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Economia Total Estimada
                  </p>
                  <p className="text-3xl font-bold text-[#12b0a0]">
                    {formatCurrencyCompact((metrics.totalMinPenalty + metrics.totalMaxPenalty) / 2)}
                  </p>
                </div>
              </div>

              {/* Valores Min/Max */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Valor Mínimo
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrencyCompact(metrics.totalMinPenalty)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#12b0a0]"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Valor Máximo
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrencyCompact(metrics.totalMaxPenalty)}
                  </span>
                </div>
              </div>

              {/* Indicador de Status */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <TrendingUp className="h-4 w-4 text-[#12b0a0]" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {metrics.completedCount} avaliações realizadas
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card de Documentos Detalhado */}
          <Card className="lg:col-span-1 group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 to-[#1e6076]/5 opacity-50" />
            <CardHeader className="pb-2 relative border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#12b0a0] rounded-xl shadow-md">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/documents')}
                    className="text-[#12b0a0] hover:text-[#12b0a0]/80 h-8 px-2"
                  >
                    Ver todos
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    Documentos Vencendo
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Próximos 30 dias
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {expiringDocuments.length === 0 ? (
                <div className="text-center py-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full inline-flex mb-2">
                    <FileCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nenhum documento vencendo
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {expiringDocuments.slice(0, 5).map((doc) => {
                    const daysUntilExpiry = Math.floor(
                      (new Date(doc.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isUrgent = daysUntilExpiry <= 7;
                    const isWarning = daysUntilExpiry <= 15;

                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          "p-2 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer",
                          isUrgent ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                          isWarning ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                          "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        )}
                        onClick={() => navigate(`/documents/${doc.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-gray-800 dark:text-gray-100 truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {doc.work?.name?.split('-')[0].trim() || 'Obra'}
                            </p>
                          </div>
                          <div className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                            isUrgent ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200" :
                            isWarning ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200" :
                            "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          )}>
                            {daysUntilExpiry} dias
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráficos das últimas 5 avaliações */}
        <div
          className="grid gap-4 lg:grid-cols-2"
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
                    <div className="p-2.5 bg-[#12b0a0] rounded-xl shadow-md">
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
              <p className="text-xs text-muted-foreground lg:hidden mb-2 text-center">
                Toque para expandir
              </p>
              <div key={evaluationType}>
                {lastEvaluationsData.conformityData.length > 0 ? (
                  <ChartModal
                    title={`Taxa de Conformidade - ${evaluationType === 'obra' ? 'Obras' : 'Alojamentos'}`}
                    description="Status de conformidade das últimas 5 avaliações"
                                      >
                    <div className="relative">
                      <div className="absolute top-0 right-0 z-10 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#12b0a0' }}></div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Conforme</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Não Conforme</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
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
                    </div>
                  </ChartModal>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
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
              <p className="text-xs text-muted-foreground lg:hidden mb-2 text-center">
                Toque para expandir
              </p>
              <div key={`penalty-${evaluationType}`}>
                {lastEvaluationsData.penaltyData.length > 0 ? (
                <ChartModal
                  title={`Multas Passíveis - ${evaluationType === 'obra' ? 'Obras' : 'Alojamentos'}`}
                  description="Valores de multas das últimas 5 avaliações"
                                  >
                  <div className="relative">
                    <div className="absolute top-0 right-0 z-10 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Valor Mínimo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#baa673' }}></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Valor Máximo</span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
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
                  </div>
                </ChartModal>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
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