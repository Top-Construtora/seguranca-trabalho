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
import { useToast } from '../hooks/use-toast';
import { useWorks } from '../hooks/useWorks';
import { reportsService, ReportFilters, EvaluationReport, SummaryReport } from '../services/reports.service';
import { FileText, Download, Calendar, Building, Users, TrendingUp } from 'lucide-react';

export function ReportsPage() {
  const { toast } = useToast();
  const { data: works = [] } = useWorks();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [evaluationsReport, setEvaluationsReport] = useState<EvaluationReport | null>(null);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    workId: '',
    type: '',
  });

  // Função para converter valores do Select para o formato do backend
  const getDisplayValue = (value: string): string => {
    return value || 'all';
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      const [evaluations, summary] = await Promise.all([
        reportsService.getEvaluationsReport(filters),
        reportsService.getSummaryReport({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);
      
      setEvaluationsReport(evaluations);
      setSummaryReport(summary);
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
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">
            Visualize e exporte relatórios do sistema de segurança do trabalho.
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Configure os filtros para gerar o relatório desejado
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
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={getDisplayValue(filters.type || '')} onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="obra">Obra</SelectItem>
                    <SelectItem value="alojamento">Alojamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={loadReports} disabled={loading}>
                {loading ? 'Carregando...' : 'Gerar Relatório'}
              </Button>
              <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel} disabled={exportLoading}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        {summaryReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Avaliações</p>
                    <p className="text-2xl font-bold">{summaryReport.total_evaluations}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avaliações de Obra</p>
                    <p className="text-2xl font-bold">{summaryReport.evaluations_by_type.obra}</p>
                  </div>
                  <Building className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avaliações de Alojamento</p>
                    <p className="text-2xl font-bold">{summaryReport.evaluations_by_type.alojamento}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Penalidade Média</p>
                    <p className="text-2xl font-bold">{summaryReport.average_penalty.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Penalidade</TableHead>
                    <TableHead>Avaliador</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationsReport.evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        {format(new Date(evaluation.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{evaluation.work?.name}</TableCell>
                      <TableCell>
                        <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'}>
                          {evaluation.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{evaluation.employees_count}</TableCell>
                      <TableCell>{evaluation.total_penalty || 0}</TableCell>
                      <TableCell>{evaluation.user?.name}</TableCell>
                      <TableCell>
                        <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                          {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}