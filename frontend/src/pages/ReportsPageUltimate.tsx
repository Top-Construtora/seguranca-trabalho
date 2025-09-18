import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { useToast } from '../hooks/use-toast';
import { useWorks } from '../hooks/useWorks';
import { useAccommodations } from '../hooks/useAccommodations';
import { useUsers } from '../hooks/useUsers';
import { reportsService, ReportFilters } from '../services/reports.service';

// Componentes de relatório
import { ReportFilters as ReportFiltersComponent } from '../components/reports/ReportFilters';
import {
  LastWorksConformityChart,
} from '../components/reports/ReportCharts';

import {
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FileJson,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';

// Fun\u00e7\u00e3o para processar dados de penalidade para o gr\u00e1fico
function processDataForPenaltyChart(penalties: any[], evaluations: any[]) {
  // Pegar as \u00faltimas avalia\u00e7\u00f5es (m\u00e1ximo 5) que est\u00e3o sendo mostradas no gr\u00e1fico de conformidade
  const lastEvaluations = evaluations
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return lastEvaluations.map(evaluation => {
    const employeeCount = evaluation.employees_count || 100; // Padr\u00e3o para 100 se n\u00e3o tiver

    // Contar quantas n\u00e3o conformidades existem por peso
    const nonConformitiesByWeight: Record<number, number> = {};

    if (evaluation.answers && Array.isArray(evaluation.answers)) {
      evaluation.answers.forEach((answer: any) => {
        const answerValue = answer.value || answer.answer;
        if (answerValue === 'nao' || answerValue === 'NAO' || answerValue === 'n\u00e3o') {
          const weight = answer.question?.weight || 1;
          nonConformitiesByWeight[weight] = (nonConformitiesByWeight[weight] || 0) + 1;
        }
      });
    }

    // Calcular valores m\u00ednimo e m\u00e1ximo de multa
    let minValue = 0;
    let maxValue = 0;

    Object.entries(nonConformitiesByWeight).forEach(([weightStr, count]) => {
      const weight = parseInt(weightStr);
      const penaltyRow = penalties.find(
        p => p.weight === weight &&
             p.employees_min <= employeeCount &&
             p.employees_max >= employeeCount
      );

      if (penaltyRow) {
        minValue += penaltyRow.min_value * count;
        maxValue += penaltyRow.max_value * count;
      }
    });

    const workName = evaluation.work?.name || evaluation.accommodation?.name || 'Avalia\u00e7\u00e3o';
    const date = format(parseISO(evaluation.date), 'dd/MM/yy');

    return {
      name: `${workName} (${date})`,
      minValue: minValue * 1.0641,
      maxValue: maxValue * 1.0641,
    };
  }).filter(item => item.minValue > 0 || item.maxValue > 0); // Filtrar apenas os que t\u00eam multas
}

export function ReportsPageUltimate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: works = [] } = useWorks();
  const { data: accommodations = [] } = useAccommodations();
  const { data: users = [] } = useUsers();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportType, setReportType] = useState('obra');

  // Estados dos dados
  const [evaluationsReport, setEvaluationsReport] = useState<any>(null);
  const [summaryReport, setSummaryReport] = useState<any>(null);
  const [conformityReport, setConformityReport] = useState<any>(null);
  const [penaltyData, setPenaltyData] = useState<any[]>([]);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    workId: '',
    type: 'obra',
    accommodationId: '',
    userId: '',
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
    // Forçar recarga dos dados quando mudar o tipo
    setTimeout(() => {
      if (filters.startDate && filters.endDate) {
        loadReports();
      }
    }, 100);
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
    console.log('=== ENVIANDO PARA BACKEND ===');
    console.log('Filters being sent:', filters);
    console.log('Type:', filters.type);

    try {
      const [evaluations, summary, conformity, penalties] = await Promise.all([
        reportsService.getEvaluationsReport(filters),
        reportsService.getSummaryReport({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        reportsService.getConformityReport(filters),
        reportsService.getPenaltyTable(),
      ]);

      console.log('=== RESPOSTA DO BACKEND ===');
      console.log('Evaluations received:', evaluations);
      console.log('Total evaluations:', evaluations?.evaluations?.length || 0);
      console.log('Penalties:', penalties);

      setEvaluationsReport(evaluations);
      setSummaryReport(summary);
      setConformityReport(conformity);

      // Processar dados de penalidades para o gráfico
      if (penalties && penalties.length > 0) {
        const processedPenaltyData = processDataForPenaltyChart(penalties, evaluations.evaluations);
        setPenaltyData(processedPenaltyData);
      }

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

  const handleRefresh = () => {
    loadReports();
  };

  // Dados das últimas 5 obras/avaliações
  const lastWorksConformityData = useMemo(() => {
    if (!evaluationsReport?.evaluations) return { data: [], title: "", description: "" };

    // Debug temporário
    console.log('=== DEBUG ALOJAMENTOS ===');
    console.log('reportType:', reportType);
    console.log('Total evaluations:', evaluationsReport.evaluations.length);

    // Verificar quantas avaliações de alojamento existem
    const alojamentoEvals = evaluationsReport.evaluations.filter((e: any) =>
      e.accommodation || e.accommodationId || e.accommodation_id ||
      e.type === 'alojamento' || e.type === 'Alojamento' ||
      (!e.work && !e.workId && !e.work_id)
    );
    console.log('Avaliações de alojamento encontradas:', alojamentoEvals.length);
    if (alojamentoEvals.length > 0) {
      console.log('Primeira avaliação de alojamento:', alojamentoEvals[0]);
      console.log('Campos da avaliação:', Object.keys(alojamentoEvals[0]));
    }

    // Verificar todas as avaliações para entender a estrutura
    if (evaluationsReport.evaluations.length > 0) {
      console.log('Estrutura de uma avaliação qualquer:', Object.keys(evaluationsReport.evaluations[0]));
      console.log('Exemplo de avaliação:', evaluationsReport.evaluations[0]);
    }

    let dataToProcess = [];
    let chartTitle = "";
    let chartDescription = "";

    // Se uma obra ou alojamento específico foi selecionado
    if (filters.workId || filters.accommodationId) {
      let locationEvaluations = [];
      let locationName = "";

      if (filters.workId) {
        // Filtrar apenas avaliações da obra selecionada
        locationEvaluations = evaluationsReport.evaluations
          .filter((e: any) => e.work && e.work.id === filters.workId && e.type === 'obra')
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5); // Pegar as últimas 5 avaliações
        locationName = locationEvaluations[0]?.work?.name || "Obra";
      } else if (filters.accommodationId) {
        // Filtrar apenas avaliações do alojamento selecionado
        locationEvaluations = evaluationsReport.evaluations
          .filter((e: any) => e.accommodation && e.accommodation.id === filters.accommodationId && (e.type === 'alojamento' || !e.type))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5); // Pegar as últimas 5 avaliações
        locationName = locationEvaluations[0]?.accommodation?.name || "Alojamento";
      }

      chartTitle = `Últimas 5 Avaliações - ${locationName}`;
      chartDescription = `Evolução da conformidade nas últimas avaliações ${filters.workId ? 'desta obra' : 'deste alojamento'}`;

      dataToProcess = locationEvaluations.map((evaluation: any) => {
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
      // Se nenhum local específico, mostrar as últimas 5 locais diferentes avaliados
      const locationsMap = new Map();

      // Filtrar avaliações baseado no tipo selecionado
      const locationEvaluations = evaluationsReport.evaluations
        .filter((e: any) => {
          if (reportType === 'obra') {
            return e.work && (e.type === 'obra' || !e.type);
          } else if (reportType === 'alojamento') {
            const hasAccommodation = e.accommodation || e.accommodationId || e.accommodation_id;
            const isAlojamentoType = e.type === 'alojamento' || e.type === 'Alojamento' || !e.work;
            console.log('Checking eval:', e.id, 'hasAccommodation:', hasAccommodation, 'isAlojamentoType:', isAlojamentoType, 'type:', e.type);
            return hasAccommodation && isAlojamentoType;
          }
          return false;
        })
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Filtered locationEvaluations for', reportType, ':', locationEvaluations.length);

      // Agrupar por local, mantendo apenas a avaliação mais recente de cada
      locationEvaluations.forEach((evaluation: any) => {
        const locationId = reportType === 'obra'
          ? evaluation.work?.id
          : evaluation.accommodation?.id;

        if (locationId && !locationsMap.has(locationId)) {
          locationsMap.set(locationId, evaluation);
        }
      });

      // Pegar os 5 locais mais recentemente avaliados
      dataToProcess = Array.from(locationsMap.values())
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


          const locationName = reportType === 'obra'
            ? evaluation.work?.name
            : evaluation.accommodation?.name;

          return {
            name: locationName && locationName.length > 25
              ? locationName.substring(0, 25) + '...'
              : locationName || 'Sem nome',
            conforme,
            naoConforme,
            total: conforme + naoConforme,
            percentualConformidade: conforme + naoConforme > 0
              ? ((conforme / (conforme + naoConforme)) * 100).toFixed(1)
              : 0
          };
        });

      chartTitle = reportType === 'obra'
        ? "Conformidade das Últimas 5 Obras Avaliadas"
        : "Conformidade dos Últimos 5 Alojamentos Avaliados";

      chartDescription = "Quantidade de itens conformes e não conformes (excluindo 'não se aplica')";
    }

    console.log('=== RESULTADO FINAL ===');
    console.log('dataToProcess length:', dataToProcess.length);
    console.log('chartTitle:', chartTitle);
    if (dataToProcess.length > 0) {
      console.log('Primeiro item processado:', dataToProcess[0]);
    }

    return {
      data: dataToProcess,
      title: chartTitle,
      description: chartDescription
    };
  }, [evaluationsReport, filters.workId, filters.accommodationId, reportType]);

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


  const filteredEvaluations = useMemo(() => {
    if (!evaluationsReport) return [];

    let filtered = [...evaluationsReport.evaluations];

    // Aplicar ordenação por data (mais recente primeiro)
    filtered.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return filtered;
  }, [evaluationsReport]);

  // Aplicar filtros automaticamente quando mudarem
  useEffect(() => {
    // Só carrega se tiver datas selecionadas
    if (filters.startDate && filters.endDate) {
      console.log('useEffect - Filters changed, reloading reports');
      console.log('Current filters:', filters);
      const timer = setTimeout(() => {
        loadReports();
      }, 500); // Debounce de 500ms para evitar muitas requisições
      return () => clearTimeout(timer);
    }
  }, [filters, filters.type]); // Adicionar filters.type explicitamente

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header melhorado com gradiente */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Central de Relatórios
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Análise completa de dados com gráficos, insights e exportações avançadas
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <div className="relative">
                <Button
                  onClick={() => {}}
                  className="pr-10 bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
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
          onReportTypeChange={handleReportTypeChange}
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
            {/* Gráfico de Conformidade das Últimas 5 Avaliações */}
            {lastWorksConformityData.data?.length > 0 && (
              <LastWorksConformityChart
                data={lastWorksConformityData.data}
                title={lastWorksConformityData.title}
                description={lastWorksConformityData.description}
                penaltyData={penaltyData}
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
                      {filteredEvaluations.slice(0, 10).map((evaluation: any) => {
                        // Calcular a porcentagem de conformidade
                        let conforme = 0;
                        let naoConforme = 0;

                        if (evaluation.answers && Array.isArray(evaluation.answers)) {
                          evaluation.answers.forEach((answer: any) => {
                            const answerValue = answer.value || answer.answer;
                            if (answerValue === 'sim' || answerValue === 'SIM') {
                              conforme++;
                            } else if (answerValue === 'nao' || answerValue === 'NAO' || answerValue === 'não') {
                              naoConforme++;
                            }
                          });
                        }

                        // Se não houver answers, usar valores agregados ou safety_score
                        if (conforme === 0 && naoConforme === 0) {
                          if (evaluation.safety_score !== null && evaluation.safety_score !== undefined) {
                            // Se tiver safety_score, usar diretamente
                            const conformityPercentage = evaluation.safety_score;
                            return (
                              <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-2">
                                  {format(parseISO(evaluation.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="py-3 px-2">{reportType === 'obra' ? evaluation.work?.name : (evaluation.accommodation?.name || '-')}</td>
                                <td className="py-3 px-2">{conformityPercentage.toFixed(1)}%</td>
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
                            );
                          }
                        }

                        const total = conforme + naoConforme;
                        const conformityPercentage = total > 0 ? (conforme / total) * 100 : 0;

                        return (
                          <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2">
                              {format(parseISO(evaluation.date), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-3 px-2">{reportType === 'obra' ? evaluation.work?.name : (evaluation.accommodation?.name || '-')}</td>
                            <td className="py-3 px-2">{conformityPercentage.toFixed(1)}%</td>
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
                        );
                      })}
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