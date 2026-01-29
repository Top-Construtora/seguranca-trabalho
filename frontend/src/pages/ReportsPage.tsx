import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useWorks } from '../hooks/useWorks';
import { useAccommodations } from '../hooks/useAccommodations';
import { useUsers } from '../hooks/useUsers';
import { reportsService, ReportFilters, EvaluationReport, SummaryReport, ConformityReport, LastEvaluationsConformityReport } from '../services/reports.service';
import { Download, Calendar, BarChart3, HardHat, Home } from 'lucide-react';
import { BarChart } from '../components/charts/BarChart';
import { ChartModal } from '../components/charts/ChartModal';

export function ReportsPage() {
  const { toast } = useToast();
  const { data: works = [] } = useWorks();
  const { data: accommodations = [] } = useAccommodations();
  const { data: users = [] } = useUsers();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [evaluationsReport, setEvaluationsReport] = useState<EvaluationReport | null>(null);
  const [, setSummaryReport] = useState<SummaryReport | null>(null);
  const [, setConformityReport] = useState<ConformityReport | null>(null);
  const [lastEvaluationsConformity, setLastEvaluationsConformity] = useState<LastEvaluationsConformityReport | null>(null);
  
  const [activeTab, setActiveTab] = useState('obra');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    workId: '',
    type: 'obra',
    accommodationId: '',
    userId: '',
  });

  // Função para converter valores do Select para o formato do backend
  const getDisplayValue = (value: string): string => {
    return value || 'all';
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFilters(prev => ({
      ...prev,
      type: value,
      workId: value === 'obra' ? prev.workId : '',
      accommodationId: value === 'alojamento' ? prev.accommodationId : '',
    }));
  };

  const loadReports = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: 'Erro',
        description: 'Data inicial e final são obrigatórias',
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
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar relatórios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: 'Erro',
        description: 'Data inicial e final são obrigatórias',
        variant: 'destructive',
      });
      return;
    }

    setExportLoading(true);
    try {
      await reportsService.downloadPDFReport(filters);
      toast({
        title: 'Sucesso',
        description: 'Relatório PDF baixado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast({
        title: 'Erro',
        description: 'Data inicial e final são obrigatórias',
        variant: 'destructive',
      });
      return;
    }

    setExportLoading(true);
    try {
      await reportsService.downloadExcelReport(filters);
      toast({
        title: 'Sucesso',
        description: 'Relatório Excel baixado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório Excel',
        variant: 'destructive',
      });
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e exporte relatórios do sistema de segurança do trabalho.
          </p>
        </div>

        {/* Tabs para separar Obras e Alojamentos */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="obra" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              Obras
            </TabsTrigger>
            <TabsTrigger value="alojamento" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Alojamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filtros - {activeTab === 'obra' ? 'Obras' : 'Alojamentos'}
                </CardTitle>
                <CardDescription>
                  Configure os filtros para gerar o relatório de {activeTab === 'obra' ? 'obras' : 'alojamentos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>

                  {activeTab === 'obra' ? (
                    <div className="space-y-2">
                      <Label htmlFor="work">Obra</Label>
                      <Select value={getDisplayValue(filters.workId || '')} onValueChange={(value) => handleFilterChange('workId', value === 'all' ? '' : value)}>
                        <SelectTrigger>
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
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="accommodation">Alojamento</Label>
                      <Select value={getDisplayValue(filters.accommodationId || '')} onValueChange={(value) => handleFilterChange('accommodationId', value === 'all' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os alojamentos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os alojamentos</SelectItem>
                          {accommodations?.map((accommodation) => (
                            <SelectItem key={accommodation.id} value={accommodation.id}>
                              {accommodation.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="evaluator">Avaliador</Label>
                    <Select value={getDisplayValue(filters.userId || '')} onValueChange={(value) => handleFilterChange('userId', value === 'all' ? '' : value)}>
                      <SelectTrigger>
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
            
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={loadReports} disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'Carregando...' : 'Gerar Relatório'}
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading} className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} disabled={exportLoading} className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos de Conformidade - 3 Últimas Avaliações */}
            {lastEvaluationsConformity && lastEvaluationsConformity.evaluations_data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conformidade - Quantidade
                </CardTitle>
                <CardDescription className="hidden sm:block">
                  Comparação das últimas avaliações realizadas
                </CardDescription>
                <p className="text-xs text-muted-foreground lg:hidden mt-1">
                  Toque para expandir
                </p>
              </CardHeader>
              <CardContent>
                <ChartModal
                  title="Conformidade - Quantidade (3 Últimas Avaliações)"
                  description="Comparação das últimas avaliações realizadas"
                                  >
                  <BarChart
                    data={lastEvaluationsConformity.evaluations_data.map((evaluation) => ({
                      name: `${evaluation.work_name} (${format(new Date(evaluation.date), 'dd/MM')})`,
                      conforme: evaluation.conforme,
                      nao_conforme: evaluation.nao_conforme,
                    }))}
                    height={280}
                    showValues={true}
                    isPercentage={false}
                    isGrouped={true}
                  />
                </ChartModal>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conformidade - Porcentagem
                </CardTitle>
                <CardDescription className="hidden sm:block">
                  Distribuição percentual por avaliação
                </CardDescription>
                <p className="text-xs text-muted-foreground lg:hidden mt-1">
                  Toque para expandir
                </p>
              </CardHeader>
              <CardContent>
                <ChartModal
                  title="Conformidade - Porcentagem (3 Últimas Avaliações)"
                  description="Distribuição percentual por avaliação"
                                  >
                  <BarChart
                    data={lastEvaluationsConformity.evaluations_data.map((evaluation) => ({
                      name: `${evaluation.work_name} (${format(new Date(evaluation.date), 'dd/MM')})`,
                      conforme: Number(evaluation.conforme_percentage.toFixed(1)),
                      nao_conforme: Number(evaluation.nao_conforme_percentage.toFixed(1)),
                    }))}
                    height={280}
                    showValues={true}
                    isPercentage={true}
                    isGrouped={true}
                  />
                </ChartModal>
              </CardContent>
            </Card>
          </div>
            )}

            {/* Tabela de Avaliações */}
            {evaluationsReport && (
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Detalhadas</CardTitle>
              <CardDescription>
                {evaluationsReport.total} avaliação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Data</TableHead>
                      <TableHead className="whitespace-nowrap">Obra</TableHead>
                      {activeTab === 'alojamento' && <TableHead className="whitespace-nowrap">Alojamento</TableHead>}
                      <TableHead className="whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="whitespace-nowrap">Funcionários</TableHead>
                      <TableHead className="whitespace-nowrap">Penalidade</TableHead>
                      <TableHead className="whitespace-nowrap">Avaliador</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluationsReport.evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(evaluation.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{evaluation.work?.name}</TableCell>
                        {activeTab === 'alojamento' && <TableCell className="whitespace-nowrap">{evaluation.accommodation?.name || '-'}</TableCell>}
                        <TableCell>
                          <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'}>
                            {evaluation.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{evaluation.employees_count}</TableCell>
                        <TableCell>{evaluation.total_penalty || 0}</TableCell>
                        <TableCell className="whitespace-nowrap">{evaluation.user?.name}</TableCell>
                        <TableCell>
                          <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                            {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}