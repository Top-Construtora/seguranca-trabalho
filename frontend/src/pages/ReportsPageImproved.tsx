import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useWorks } from '../hooks/useWorks';
import { useAccommodations } from '../hooks/useAccommodations';
import { useUsers } from '../hooks/useUsers';
import { reportsService, ReportFilters, EvaluationReport, SummaryReport, ConformityReport, LastEvaluationsConformityReport } from '../services/reports.service';
import { formatCurrency } from '../lib/currency';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { ReportFilters as ReportFiltersComponent } from '../components/reports/ReportFilters';
import { SimpleBarChart } from '../components/reports/SimpleBarChart';

export function ReportsPageImproved() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: works = [] } = useWorks();
  const { data: accommodations = [] } = useAccommodations();
  const { data: users = [] } = useUsers();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [evaluationsReport, setEvaluationsReport] = useState<EvaluationReport | null>(null);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [conformityReport, setConformityReport] = useState<ConformityReport | null>(null);
  const [lastEvaluationsConformity, setLastEvaluationsConformity] = useState<LastEvaluationsConformityReport | null>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    workId: '',
    type: '',
    accommodationId: '',
    userId: '',
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    // Clear all filters completely
    setFilters({
      startDate: '',
      endDate: '',
      workId: '',
      type: '',
      accommodationId: '',
      userId: '',
    });

    // Clear the reports data
    setEvaluationsReport(null);
    setSummaryReport(null);
    setConformityReport(null);
    setLastEvaluationsConformity(null);

    toast({
      title: 'Filtros limpos',
      description: 'Selecione um novo período para gerar relatórios',
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

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: 'Atenção',
        description: 'Selecione o período para exportar o relatório',
        variant: 'destructive',
      });
      return;
    }

    setExportLoading(true);
    try {
      if (format === 'pdf') {
        await reportsService.downloadPDFReport(filters);
      } else {
        await reportsService.downloadExcelReport(filters);
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

  const stats = useMemo(() => {
    if (!evaluationsReport || !summaryReport) return null;

    const totalEvaluations = evaluationsReport.total;
    const avgScore = summaryReport.average_score || 0;
    const totalConform = conformityReport?.total_conforme || 0;
    const totalNonConform = conformityReport?.total_nao_conforme || 0;
    const conformityRate = totalConform + totalNonConform > 0
      ? (totalConform / (totalConform + totalNonConform)) * 100
      : 0;

    return {
      totalEvaluations,
      avgScore,
      conformityRate,
      totalConform,
      totalNonConform,
      totalWorks: new Set(evaluationsReport.evaluations.map(e => e.work?.id)).size,
      totalEvaluators: new Set(evaluationsReport.evaluations.map(e => e.user?.id)).size,
    };
  }, [evaluationsReport, summaryReport, conformityReport]);

  const monthlyData = useMemo(() => {
    if (!evaluationsReport) return [];

    const months = eachMonthOfInterval({
      start: parseISO(filters.startDate),
      end: parseISO(filters.endDate),
    });

    return months.map(month => {
      const monthEvals = evaluationsReport.evaluations.filter(e => {
        const evalDate = parseISO(e.date);
        return evalDate >= startOfMonth(month) && evalDate <= endOfMonth(month);
      });

      const avgScore = monthEvals.length > 0
        ? monthEvals.reduce((acc, e) => acc + (e.total_penalty ? 100 - Number(e.total_penalty) : 100), 0) / monthEvals.length
        : 0;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        evaluations: monthEvals.length,
        avgScore: Number(avgScore.toFixed(1)),
      };
    });
  }, [evaluationsReport, filters]);

  const scoreDistribution = useMemo(() => {
    if (!evaluationsReport) return [];

    const ranges = [
      { min: 0, max: 60, label: '0-60', count: 0 },
      { min: 60, max: 70, label: '60-70', count: 0 },
      { min: 70, max: 80, label: '70-80', count: 0 },
      { min: 80, max: 90, label: '80-90', count: 0 },
      { min: 90, max: 100, label: '90-100', count: 0 },
    ];

    evaluationsReport.evaluations.forEach(e => {
      const score = e.total_penalty ? 100 - Number(e.total_penalty) : 100;
      const range = ranges.find(r => score >= r.min && score < r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({ range: r.label, count: r.count }));
  }, [evaluationsReport]);

  const topWorks = useMemo(() => {
    if (!evaluationsReport) return [];

    const workScores: Record<string, { name: string; total: number; count: number }> = {};

    evaluationsReport.evaluations.forEach(e => {
      if (e.work) {
        if (!workScores[e.work.id]) {
          workScores[e.work.id] = { name: e.work.name, total: 0, count: 0 };
        }
        workScores[e.work.id].total += e.total_penalty ? 100 - Number(e.total_penalty) : 100;
        workScores[e.work.id].count++;
      }
    });

    return Object.values(workScores)
      .map(w => ({
        name: w.name,
        score: w.count > 0 ? w.total / w.count : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [evaluationsReport]);

  // Removido conformityTrend - não é mais necessário

  // Removed automatic loading - user must select dates first

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Central de Relatórios</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Análise completa e insights do sistema de segurança do trabalho
            </p>
            {filters.startDate && filters.endDate && (
              <p className="text-xs text-gray-500 mt-1">
                Período: {format(parseISO(filters.startDate), 'dd/MM/yyyy')} até {format(parseISO(filters.endDate), 'dd/MM/yyyy')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exportLoading || !evaluationsReport}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={exportLoading || !evaluationsReport}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>

        <ReportFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={loadReports}
          onResetFilters={handleResetFilters}
          works={works}
          accommodations={accommodations}
          users={users}
          loading={loading}
        />

        {stats && (
          <>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Visão Geral</TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Dois gráficos de barras verticais */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico 1: Conformidade Geral */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Conformidade Geral
                      </CardTitle>
                      <CardDescription>
                        Total de itens conformes e não conformes no período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleBarChart
                        data={[
                          {
                            name: 'Total',
                            conforme: stats.totalConform,
                            nao_conforme: stats.totalNonConform,
                          },
                        ]}
                        height={350}
                      />
                      <div className="mt-4 flex justify-around text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.totalConform}</p>
                          <p className="text-gray-600">Conformes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{stats.totalNonConform}</p>
                          <p className="text-gray-600">Não Conformes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.conformityRate.toFixed(1)}%</p>
                          <p className="text-gray-600">Taxa de Conformidade</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico 2: Conformidade por Avaliação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Conformidade das Últimas Avaliações
                      </CardTitle>
                      <CardDescription>
                        {filters.workId || filters.accommodationId
                          ? 'Últimas 5 avaliações do local selecionado'
                          : 'Últimas avaliações realizadas no sistema'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {lastEvaluationsConformity && lastEvaluationsConformity.evaluations_data.length > 0 ? (
                        <>
                          <SimpleBarChart
                            data={lastEvaluationsConformity.evaluations_data
                              .slice(0, (filters.workId || filters.accommodationId) ? 5 : 3)
                              .map((e: any) => ({
                                name: `${e.work_name.substring(0, 20)}${e.work_name.length > 20 ? '...' : ''} (${format(parseISO(e.date), 'dd/MM')})`,
                                conforme: e.conforme,
                                nao_conforme: e.nao_conforme,
                              }))}
                            height={350}
                          />
                        </>
                      ) : (
                        <div className="h-[350px] flex items-center justify-center text-gray-500">
                          Nenhuma avaliação disponível
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>


              {/* Removido aba trends
              <TabsContent value="trends" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Indicadores de Tendência
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {stats.avgScore > 75 ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Tendência Positiva</p>
                            <p className="text-sm text-green-600">
                              Pontuação média acima de 75% indica bom desempenho
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <TrendingDown className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Atenção Necessária</p>
                            <p className="text-sm text-yellow-600">
                              Pontuação média abaixo de 75% requer melhorias
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avaliações este mês</span>
                          <span className="font-medium">{monthlyData[monthlyData.length - 1]?.evaluations || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Média este mês</span>
                          <span className="font-medium">{monthlyData[monthlyData.length - 1]?.avgScore || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Variação mensal</span>
                          <span className="font-medium text-green-600">+5.2%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Alertas e Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {stats.conformityRate < 70 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Taxa de conformidade baixa</p>
                          <p className="text-xs text-red-600 mt-1">
                            Recomenda-se intensificar treinamentos e fiscalização
                          </p>
                        </div>
                      )}

                      {stats.totalEvaluations < 10 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">Poucas avaliações no período</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Aumentar frequência de avaliações para melhor acompanhamento
                          </p>
                        </div>
                      )}

                      {topWorks.some(w => w.score < 60) && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-medium text-orange-800">Obras com baixo desempenho</p>
                          <p className="text-xs text-orange-600 mt-1">
                            Algumas obras necessitam atenção especial e plano de ação
                          </p>
                        </div>
                      )}

                      {(!stats.conformityRate || stats.conformityRate >= 70) && stats.totalEvaluations >= 10 && !topWorks.some(w => w.score < 60) && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Sistema em bom funcionamento</p>
                          <p className="text-xs text-green-600 mt-1">
                            Manter regularidade das avaliações e monitoramento
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <MonthlyComparisonChart
                  data={monthlyData}
                  title="Análise de Tendência Temporal"
                  description="Visualização da evolução ao longo do período selecionado"
                />
              </TabsContent>
              */}

              <TabsContent value="details" className="mt-6">
                {evaluationsReport && evaluationsReport.evaluations.length > 0 ? (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>Avaliações Detalhadas</CardTitle>
                      <CardDescription>
                        Lista completa com {evaluationsReport.total} avaliação(ões) no período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left py-3 px-2">Data</th>
                              <th className="text-left py-3 px-2">Obra</th>
                              <th className="text-left py-3 px-2">Tipo</th>
                              <th className="text-left py-3 px-2">Multa Total</th>
                              <th className="text-left py-3 px-2">Funcionários</th>
                              <th className="text-left py-3 px-2">Avaliador</th>
                              <th className="text-left py-3 px-2">Status</th>
                              <th className="text-left py-3 px-2">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluationsReport.evaluations
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                              .map((evaluation) => (
                              <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-2">
                                  {format(parseISO(evaluation.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="py-3 px-2">
                                  <div>
                                    <p className="font-medium">{evaluation.work?.name}</p>
                                    {evaluation.accommodation && (
                                      <p className="text-xs text-gray-500">{evaluation.accommodation.name}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'}>
                                    {evaluation.type}
                                  </Badge>
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {formatCurrency(evaluation.total_penalty)}
                                    </span>
                                    {evaluation.total_penalty && Number(evaluation.total_penalty) > 100 && (
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-2">{evaluation.employees_count}</td>
                                <td className="py-3 px-2">{evaluation.user?.name}</td>
                                <td className="py-3 px-2">
                                  <Badge
                                    variant={evaluation.status === 'completed' ? 'default' : 'outline'}
                                  >
                                    {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                                  </Badge>
                                </td>
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
                      {evaluationsReport.evaluations.length > itemsPerPage && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, evaluationsReport.evaluations.length)} de {evaluationsReport.evaluations.length}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(evaluationsReport.evaluations.length / itemsPerPage), prev + 1))}
                              disabled={currentPage >= Math.ceil(evaluationsReport.evaluations.length / itemsPerPage)}
                            >
                              Próximo
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhuma avaliação encontrada no período selecionado</p>
                      <p className="text-sm text-gray-400 mt-2">Ajuste os filtros e tente novamente</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {!stats && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PieChartIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-2">Selecione um período para visualizar os relatórios</p>
              <p className="text-sm text-gray-400">Use os filtros acima para configurar o período desejado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}