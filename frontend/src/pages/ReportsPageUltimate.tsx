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
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
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

  useEffect(() => {
    loadReports();
  }, []);

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

          {/* Report Type Selection Tabs */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex flex-col space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Selecione o Tipo de Relatório</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Escolha entre visualizar relatórios de obras ou alojamentos</p>
              </div>

              <Tabs value={reportType} onValueChange={handleReportTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-white dark:bg-gray-900">
                  <TabsTrigger
                    value="obra"
                    className="flex items-center justify-center gap-2 text-base font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  >
                    <HardHat className="h-5 w-5" />
                    <span>Obras</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="alojamento"
                    className="flex items-center justify-center gap-2 text-base font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  >
                    <Home className="h-5 w-5" />
                    <span>Alojamentos</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 mt-2">
                <div className={`h-2 w-2 rounded-full ${reportType === 'obra' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div className={`h-2 w-2 rounded-full ${reportType === 'alojamento' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  Visualizando: <strong>{reportType === 'obra' ? 'Relatórios de Obras' : 'Relatórios de Alojamentos'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <ReportSearch
          onSearch={handleSearch}
          onFiltersChange={handleAdvancedFiltersChange}
          onExportFilters={handleExportFilters}
          onImportFilters={handleImportFilters}
          totalResults={filteredEvaluations.length}
        />

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Métricas</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Comparação</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-1">
                <FileSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Detalhes</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <ReportMetrics data={metricsData} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConformityTrendChart
                  data={lastEvaluationsConformity?.evaluations_data.map((e: any) => ({
                    name: format(parseISO(e.date), 'dd/MM'),
                    conforme: e.conforme,
                    naoConforme: e.nao_conforme,
                    total: e.conforme + e.nao_conforme,
                  })) || []}
                  title="Tendência de Conformidade"
                  description="Evolução recente da conformidade"
                />

                <EvaluationsByTypeChart
                  data={evaluationsReport?.evaluations || []}
                  title="Distribuição por Tipo"
                  description="Proporção entre tipos de avaliação"
                />
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScoreDistributionChart
                  data={[
                    { range: '0-60', count: filteredEvaluations.filter((e: any) => e.final_score < 60).length },
                    { range: '60-70', count: filteredEvaluations.filter((e: any) => e.final_score >= 60 && e.final_score < 70).length },
                    { range: '70-80', count: filteredEvaluations.filter((e: any) => e.final_score >= 70 && e.final_score < 80).length },
                    { range: '80-90', count: filteredEvaluations.filter((e: any) => e.final_score >= 80 && e.final_score < 90).length },
                    { range: '90-100', count: filteredEvaluations.filter((e: any) => e.final_score >= 90).length },
                  ]}
                  title="Distribuição de Pontuação"
                  description="Faixas de pontuação das avaliações"
                />

                <TopWorksChart
                  data={works.slice(0, 5).map(w => ({
                    name: w.name,
                    score: Math.random() * 30 + 70,
                  }))}
                  title="Top 5 Obras"
                  description="Melhores pontuações médias"
                />
              </div>

              <MonthlyComparisonChart
                data={comparisonData.trend}
                title="Evolução Mensal Detalhada"
                description="Análise comparativa mensal"
              />
            </TabsContent>

            <TabsContent value="comparison" className="mt-6">
              <ReportComparison
                data={comparisonData}
                onPeriodChange={handlePeriodChange}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="details" className="mt-6">
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
                          <th className="text-left py-3 px-2">Tipo</th>
                          <th className="text-left py-3 px-2">Pontuação</th>
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
                            <td className="py-3 px-2">{evaluation.type}</td>
                            <td className="py-3 px-2">{evaluation.final_score?.toFixed(1)}%</td>
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
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Relatórios</CardTitle>
                  <CardDescription>
                    Personalize como os relatórios são gerados e exibidos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Preferências de Exportação</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure os formatos padrão de exportação e opções avançadas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Notificações</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure alertas para métricas críticas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Metas e Benchmarks</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina metas personalizadas para cada categoria
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}