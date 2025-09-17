import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useWorks } from '../hooks/useWorks';
import { useAccommodations } from '../hooks/useAccommodations';
import { useUsers } from '../hooks/useUsers';
import { reportsService, ReportFilters } from '../services/reports.service';
import { cn } from '../lib/utils';

// Componentes de relatório
import { ReportFilters as ReportFiltersComponent } from '../components/reports/ReportFilters';
import { ReportSearch } from '../components/reports/ReportSearch';
import { ReportMetrics } from '../components/reports/ReportMetrics';
import { ReportComparison } from '../components/reports/ReportComparison';
import {
  ConformityTrendChart,
  EvaluationsByTypeChart,
  ScoreDistributionChart,
  TopWorksChart,
  MonthlyComparisonChart,
  LastWorksConformityChart,
} from '../components/reports/ReportCharts';

import {
  Download,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  FileSearch,
  Settings,
  HardHat,
  Home,
  Building2,
  FileText,
  Shield,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';

export function ReportsPageUltimate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: works = [] } = useWorks();
  const { data: accommodations = [] } = useAccommodations();
  const { data: users = [] } = useUsers();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportType, setReportType] = useState('obra');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados dos dados
  const [evaluationsReport, setEvaluationsReport] = useState<any>(null);
  const [summaryReport, setSummaryReport] = useState<any>(null);
  const [conformityReport, setConformityReport] = useState<any>(null);
  const [lastEvaluationsConformity, setLastEvaluationsConformity] = useState<any>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    workId: '',
    type: 'obra',
    accommodationId: '',
    userId: '',
  });

  const [advancedFilters, setAdvancedFilters] = useState<any>({
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReportTypeChange = (value: string) => {
    setReportType(value);
    setFilters(prev => ({
      ...prev,
      type: value,
      workId: value === 'obra' ? prev.workId : '',
      accommodationId: value === 'alojamento' ? prev.accommodationId : '',
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      workId: '',
      type: reportType,
      accommodationId: '',
      userId: '',
    });
  };

  const loadReports = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: 'Atenção',
        description: 'Selecione o período para gerar o relatório',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const [evaluations, summary, conformity, lastEvaluations] = await Promise.all([
        reportsService.getEvaluationsReport(filters),
        reportsService.getSummaryReport({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        reportsService.getConformityReport(filters),
        reportsService.getLastEvaluationsConformityReport({
          workId: filters.workId,
          type: filters.type,
          accommodationId: filters.accommodationId,
          userId: filters.userId,
        }),
      ]);

      setEvaluationsReport(evaluations);
      setSummaryReport(summary);
      setConformityReport(conformity);
      setLastEvaluationsConformity(lastEvaluations);

      toast({
        title: 'Sucesso',
        description: 'Relatórios carregados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatórios. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    setExportLoading(true);
    try {
      switch (format) {
        case 'pdf':
          await reportsService.downloadPDFReport(filters);
          break;
        case 'excel':
          await reportsService.downloadExcelReport(filters);
          break;
        case 'csv':
          // Implementar exportação CSV
          const csvData = generateCSV();
          downloadFile(csvData, 'relatorio.csv', 'text/csv');
          break;
        case 'json':
          // Implementar exportação JSON
          const jsonData = JSON.stringify({
            filters,
            evaluations: evaluationsReport,
            summary: summaryReport,
            conformity: conformityReport,
          }, null, 2);
          downloadFile(jsonData, 'relatorio.json', 'application/json');
          break;
      }

      toast({
        title: 'Sucesso',
        description: `Relatório ${format.toUpperCase()} baixado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Erro ao gerar relatório ${format.toUpperCase()}`,
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const generateCSV = () => {
    if (!evaluationsReport) return '';

    const headers = ['Data', 'Obra', 'Tipo', 'Pontuação', 'Conformidade', 'Avaliador', 'Status'];
    const rows = evaluationsReport.evaluations.map((e: any) => [
      format(parseISO(e.date), 'dd/MM/yyyy'),
      e.work?.name || '',
      e.type || '',
      e.final_score?.toFixed(1) || '0',
      e.conformity_rate?.toFixed(1) || '0',
      e.user?.name || '',
      e.status || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implementar lógica de busca
  };

  const handleAdvancedFiltersChange = (newFilters: any) => {
    setAdvancedFilters(newFilters);
    // Aplicar filtros avançados
  };

  const handleExportFilters = () => {
    const filtersData = JSON.stringify({ filters, advancedFilters }, null, 2);
    downloadFile(filtersData, 'filtros.json', 'application/json');
  };

  const handleImportFilters = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.filters) setFilters(data.filters);
        if (data.advancedFilters) setAdvancedFilters(data.advancedFilters);
        toast({
          title: 'Sucesso',
          description: 'Filtros importados com sucesso',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao importar filtros',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = subDays(today, 30);
        break;
      case 'quarter':
        startDate = subDays(today, 90);
        break;
      case 'year':
        startDate = subDays(today, 365);
        break;
    }

    setFilters({
      ...filters,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    });

    loadReports();
  };

  const handleRefresh = () => {
    loadReports();
  };

  // Dados das últimas 5 obras/avaliações
  const lastWorksConformityData = useMemo(() => {
    if (!evaluationsReport?.evaluations) return { data: [], title: "", description: "" };


    let dataToProcess = [];
    let chartTitle = "";
    let chartDescription = "";

    // Se uma obra específica foi selecionada
    if (filters.workId) {
      // Filtrar apenas avaliações da obra selecionada
      const workEvaluations = evaluationsReport.evaluations
        .filter((e: any) => e.work && e.work.id === filters.workId && e.type === 'obra')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Pegar as últimas 5 avaliações

      const workName = workEvaluations[0]?.work?.name || "Obra";
      chartTitle = `Últimas 5 Avaliações - ${workName}`;
      chartDescription = "Evolução da conformidade nas últimas avaliações desta obra";

      dataToProcess = workEvaluations.map((evaluation: any) => {
        // Calcular conformes e não conformes (excluindo "não se aplica")
        let conforme = 0;
        let naoConforme = 0;

        // Verificar se answers existe e processar
        if (evaluation.answers && Array.isArray(evaluation.answers)) {
          evaluation.answers.forEach((answer: any) => {
            // O backend retorna 'value' que contém 'sim', 'nao' ou 'na'
            const answerValue = answer.value || answer.answer;
            if (answerValue === 'sim' || answerValue === 'SIM') {
              conforme++;
            } else if (answerValue === 'nao' || answerValue === 'NAO' || answerValue === 'não') {
              naoConforme++;
            }
            // "na" (não se aplica) é ignorado
          });
        }

        // Se não houver answers, tentar usar dados agregados
        if (conforme === 0 && naoConforme === 0) {
          conforme = evaluation.conforme || evaluation.conformes || evaluation.conformeCount || 0;
          naoConforme = evaluation.naoConforme || evaluation.nao_conforme || evaluation.naoConformes || evaluation.naoConformeCount || 0;
        }


        return {
          name: format(parseISO(evaluation.date), 'dd/MM/yy'),
          conforme,
          naoConforme,
          total: conforme + naoConforme,
          percentualConformidade: conforme + naoConforme > 0
            ? ((conforme / (conforme + naoConforme)) * 100).toFixed(1)
            : 0,
          avaliador: evaluation.user?.name || 'Avaliador'
        };
      });
    } else {
      // Se nenhuma obra específica, mostrar as últimas 5 obras diferentes avaliadas
      const workEvaluationsMap = new Map();

      // Filtrar apenas avaliações de obras (não alojamentos)
      const workEvaluations = evaluationsReport.evaluations
        .filter((e: any) => e.work && e.type === 'obra')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Agrupar por obra, mantendo apenas a avaliação mais recente de cada
      workEvaluations.forEach((evaluation: any) => {
        const workId = evaluation.work.id;
        if (!workEvaluationsMap.has(workId)) {
          workEvaluationsMap.set(workId, evaluation);
        }
      });

      // Pegar as 5 obras mais recentemente avaliadas
      dataToProcess = Array.from(workEvaluationsMap.values())
        .slice(0, 5)
        .map((evaluation: any) => {
          // Calcular conformes e não conformes (excluindo "não se aplica")
          let conforme = 0;
          let naoConforme = 0;

          // Verificar se answers existe e processar
          if (evaluation.answers && Array.isArray(evaluation.answers)) {
            evaluation.answers.forEach((answer: any) => {
              // O backend retorna 'value' que contém 'sim', 'nao' ou 'na'
              const answerValue = answer.value || answer.answer;
              if (answerValue === 'sim' || answerValue === 'SIM') {
                conforme++;
              } else if (answerValue === 'nao' || answerValue === 'NAO' || answerValue === 'não') {
                naoConforme++;
              }
              // "na" (não se aplica) é ignorado
            });
          }

          // Se não houver answers, tentar usar dados agregados
          if (conforme === 0 && naoConforme === 0) {
            conforme = evaluation.conforme || evaluation.conformes || evaluation.conformeCount || 0;
            naoConforme = evaluation.naoConforme || evaluation.nao_conforme || evaluation.naoConformes || evaluation.naoConformeCount || 0;
          }


          return {
            name: evaluation.work.name.length > 25
              ? evaluation.work.name.substring(0, 25) + '...'
              : evaluation.work.name,
            conforme,
            naoConforme,
            total: conforme + naoConforme,
            percentualConformidade: conforme + naoConforme > 0
              ? ((conforme / (conforme + naoConforme)) * 100).toFixed(1)
              : 0
          };
        });

      chartTitle = "Conformidade das Últimas 5 Obras Avaliadas";
    }

    return {
      data: dataToProcess,
      title: chartTitle,
      description: chartDescription
    };
  }, [evaluationsReport, filters.workId]);

  // Dados processados
  const metricsData = useMemo(() => {
    if (!evaluationsReport || !summaryReport || !conformityReport) return null;

    const totalEvaluations = evaluationsReport.total;
    const completedEvaluations = evaluationsReport.evaluations.filter((e: any) => e.status === 'completed').length;
    const pendingEvaluations = totalEvaluations - completedEvaluations;
    const averageScore = summaryReport.average_score || 0;
    const conformityRate = conformityReport?.conformity_rate || 0;
    const criticalIssues = evaluationsReport.evaluations.filter((e: any) => e.final_score < 60).length;
    const improvementRate = 5.2; // Calcular baseado em dados históricos

    const topRisks = conformityReport?.top_non_conformities?.slice(0, 6).map((item: any) => ({
      name: item.question,
      count: item.count,
    })) || [];

    return {
      conformityRate,
      averageScore,
      totalEvaluations,
      completedEvaluations,
      pendingEvaluations,
      criticalIssues,
      improvementRate,
      topRisks,
    };
  }, [evaluationsReport, summaryReport, conformityReport]);

  const comparisonData = useMemo(() => {
    // Simular dados de comparação - em produção, buscar do backend
    return {
      current: {
        period: 'Nov 2024',
        score: metricsData?.averageScore || 0,
        conformity: metricsData?.conformityRate || 0,
        evaluations: metricsData?.totalEvaluations || 0,
        categories: [
          { name: 'Segurança', value: 85 },
          { name: 'Higiene', value: 78 },
          { name: 'Organização', value: 82 },
          { name: 'EPIs', value: 90 },
          { name: 'Procedimentos', value: 75 },
        ],
      },
      previous: {
        period: 'Out 2024',
        score: 72,
        conformity: 68,
        evaluations: 42,
        categories: [
          { name: 'Segurança', value: 80 },
          { name: 'Higiene', value: 70 },
          { name: 'Organização', value: 75 },
          { name: 'EPIs', value: 85 },
          { name: 'Procedimentos', value: 70 },
        ],
      },
      trend: [
        { month: 'Jul', current: 70, previous: 65, benchmark: 80 },
        { month: 'Ago', current: 72, previous: 68, benchmark: 80 },
        { month: 'Set', current: 75, previous: 70, benchmark: 80 },
        { month: 'Out', current: 78, previous: 72, benchmark: 80 },
        { month: 'Nov', current: 82, previous: 75, benchmark: 80 },
      ],
    };
  }, [metricsData]);

  const filteredEvaluations = useMemo(() => {
    if (!evaluationsReport) return [];

    let filtered = [...evaluationsReport.evaluations];

    // Aplicar busca
    if (searchQuery) {
      filtered = filtered.filter((e: any) =>
        e.work?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtros avançados
    filtered = filtered.filter((e: any) => {
      const score = e.final_score || 0;
      const conformity = e.conformity_rate || 0;

      if (score < advancedFilters.scoreMin || score > advancedFilters.scoreMax) return false;
      if (conformity < advancedFilters.conformityMin || conformity > advancedFilters.conformityMax) return false;
      if (advancedFilters.onlyCompleted && e.status !== 'completed') return false;
      if (advancedFilters.onlyCritical && score >= 60) return false;

      return true;
    });

    // Aplicar ordenação
    filtered.sort((a: any, b: any) => {
      switch (advancedFilters.sortBy) {
        case 'score':
          return (b.final_score || 0) - (a.final_score || 0);
        case 'conformity':
          return (b.conformity_rate || 0) - (a.conformity_rate || 0);
        case 'work':
          return (a.work?.name || '').localeCompare(b.work?.name || '');
        case 'evaluator':
          return (a.user?.name || '').localeCompare(b.user?.name || '');
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [evaluationsReport, searchQuery, advancedFilters]);

  // Aplicar filtros automaticamente quando mudarem
  useEffect(() => {
    // Só carrega se tiver datas selecionadas
    if (filters.startDate && filters.endDate) {
      const timer = setTimeout(() => {
        loadReports();
      }, 500); // Debounce de 500ms para evitar muitas requisições
      return () => clearTimeout(timer);
    }
  }, [filters]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Central de Relatórios Avançada
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Análise completa com insights, comparações e exportações avançadas
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="pr-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleExport(e.target.value as any)}
                  disabled={exportLoading || !evaluationsReport}
                >
                  <option value="">Selecione</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs de Seleção */}
          <Tabs value={reportType} onValueChange={handleReportTypeChange}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="obra">Obras</TabsTrigger>
              <TabsTrigger value="alojamento">Alojamentos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Filters */}
        <ReportFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={loadReports}
          onResetFilters={handleResetFilters}
          works={reportType === 'obra' ? works : []}
          accommodations={reportType === 'alojamento' ? accommodations : []}
          users={users}
          loading={loading}
          reportType={reportType}
        />

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Progress value={33} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && metricsData && (
          <div className="space-y-6">
            {/* Gráfico de Conformidade das Últimas 5 Obras */}
            {reportType === 'obra' && lastWorksConformityData.data?.length > 0 && (
              <LastWorksConformityChart
                data={lastWorksConformityData.data}
                title={lastWorksConformityData.title}
                description={lastWorksConformityData.description}
              />
            )}


            <Card>
              <CardHeader>
                <CardTitle>Avaliações Detalhadas</CardTitle>
                <CardDescription>
                  {filteredEvaluations.length} avaliações encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-2">Data</th>
                        <th className="text-left py-3 px-2">{reportType === 'obra' ? 'Obra' : 'Alojamento'}</th>
                        <th className="text-left py-3 px-2">Conformidade</th>
                        <th className="text-left py-3 px-2">Avaliador</th>
                        <th className="text-left py-3 px-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvaluations.slice(0, 10).map((evaluation: any) => (
                        <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            {format(parseISO(evaluation.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-3 px-2">{reportType === 'obra' ? evaluation.work?.name : (evaluation.accommodation?.name || '-')}</td>
                          <td className="py-3 px-2">{evaluation.conformity_rate?.toFixed(1)}%</td>
                          <td className="py-3 px-2">{evaluation.user?.name}</td>
                          <td className="py-3 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/reports/evaluation/${evaluation.id}`)}
                            >
                              Ver Relatório
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}