import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics } from '@/hooks/useEvaluations';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  PieChart,
  HardHat,
  Home,
  FileText,
  Plus,
  Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const { data: statistics, isLoading: statsLoading } = useEvaluationStatistics();
  const { data: works = [], isLoading: worksLoading } = useWorks();

  const activeWorks = works.filter(work => work.is_active).length;
  const totalWorks = works.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (statsLoading || worksLoading || userLoading) {
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

  const completedEvaluations = statistics?.byStatus?.find(s => s.status === 'completed')?.count || 0;
  const draftEvaluations = statistics?.byStatus?.find(s => s.status === 'draft')?.count || 0;
  const obraEvaluations = statistics?.byType?.find(t => t.type === 'obra')?.count || 0;
  const alojamentoEvaluations = statistics?.byType?.find(t => t.type === 'alojamento')?.count || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com saudação */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e6076] via-[#12b0a0] to-[#1e6076] p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3">
              {getGreeting()}, {user?.name || 'Usuário'}!
            </h1>
            <p className="text-white/80 text-lg mb-6">
              Acesse rapidamente as funcionalidades principais do sistema
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Link to="/evaluations/obra" className="block border border-white text-white hover:bg-white/10 font-semibold py-4 px-4 rounded-3xl transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <HardHat className="h-6 w-6" />
                  <span className="text-sm text-center">Nova Avaliação de Obra</span>
                </div>
              </Link>
              <Link to="/evaluations/alojamento" className="block border border-white text-white hover:bg-white/10 font-semibold py-4 px-4 rounded-3xl transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Home className="h-6 w-6" />
                  <span className="text-sm text-center">Nova Avaliação de Alojamento</span>
                </div>
              </Link>
              <Link to="/works" className="block border border-white text-white hover:bg-white/10 font-semibold py-4 px-4 rounded-3xl transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm text-center">Novo Cadastro de Obra</span>
                </div>
              </Link>
              <Link to="/reports" className="block border border-white text-white hover:bg-white/10 font-semibold py-4 px-4 rounded-3xl transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm text-center">Gerenciar Relatórios</span>
                </div>
              </Link>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-[#12b0a0]/20" />
        </div>

        {/* Cards de estatísticas principais - Paleta personalizada */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#12b0a0] to-[#1e6076] text-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Obras Ativas
              </CardTitle>
              <Building2 className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeWorks}</div>
              <p className="text-xs opacity-80">
                de {totalWorks} obras cadastradas
              </p>
              <div className="mt-3 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(activeWorks / totalWorks) * 100}%` }}
                />
              </div>
            </CardContent>
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#1e6076] to-[#12b0a0] text-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total de Avaliações
              </CardTitle>
              <Activity className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics?.total || 0}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {completedEvaluations} finalizadas
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white text-xs">
                  {draftEvaluations} rascunhos
                </Badge>
              </div>
            </CardContent>
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#baa673] to-[#1e6076] text-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Multas Aplicadas
              </CardTitle>
              <AlertTriangle className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics?.totalPenalties || 0)}
              </div>
              <p className="text-xs opacity-80">
                em avaliações finalizadas
              </p>
            </CardContent>
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#1e6076] to-[#baa673] text-white rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Taxa de Conformidade
              </CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {completedEvaluations > 0 
                  ? Math.round((completedEvaluations / statistics?.total!) * 100)
                  : 0}%
              </div>
              <p className="text-xs opacity-80">
                de avaliações finalizadas
              </p>
            </CardContent>
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          </Card>
        </div>

        {/* Cards de detalhamento - Paleta personalizada */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-[#12b0a0]/10 to-[#1e6076]/10 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-[#1e6076]">
                <PieChart className="h-5 w-5 text-[#12b0a0]" />
                Distribuição por Tipo
              </CardTitle>
              <CardDescription>
                Avaliações realizadas por tipo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-[#baa673]" />
                      <span className="text-sm font-medium text-[#1e6076]">Obra</span>
                    </div>
                    <span className="text-sm font-bold text-[#baa673]">
                      {obraEvaluations} avaliações
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#baa673] to-[#1e6076] rounded-full h-3 transition-all duration-700"
                      style={{ width: `${statistics?.total && statistics?.total > 0 ? (obraEvaluations / statistics?.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-[#12b0a0]" />
                      <span className="text-sm font-medium text-[#1e6076]">Alojamento</span>
                    </div>
                    <span className="text-sm font-bold text-[#12b0a0]">
                      {alojamentoEvaluations} avaliações
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[#12b0a0] to-[#1e6076] rounded-full h-3 transition-all duration-700"
                      style={{ width: `${statistics?.total && statistics?.total > 0 ? (alojamentoEvaluations / statistics?.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-[#1e6076]/10 to-[#baa673]/10 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-[#1e6076]">
                <BarChart3 className="h-5 w-5 text-[#12b0a0]" />
                Status das Avaliações
              </CardTitle>
              <CardDescription>
                Distribuição por status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#12b0a0]/10 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#12b0a0]" />
                    <span className="text-sm font-medium text-[#1e6076]">Finalizadas</span>
                  </div>
                  <span className="text-2xl font-bold text-[#12b0a0]">{completedEvaluations}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#baa673]/10 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#baa673]" />
                    <span className="text-sm font-medium text-[#1e6076]">Em Rascunho</span>
                  </div>
                  <span className="text-2xl font-bold text-[#baa673]">{draftEvaluations}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-[#baa673]/10 to-[#12b0a0]/10 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-[#1e6076]">
                <Activity className="h-5 w-5 text-[#12b0a0]" />
                Métricas do Sistema
              </CardTitle>
              <CardDescription>
                Indicadores de performance e atividade
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#12b0a0]/10 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#12b0a0]" />
                    <span className="text-sm font-medium text-[#1e6076]">Avaliações Hoje</span>
                  </div>
                  <span className="text-2xl font-bold text-[#12b0a0]">
                    0
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#baa673]/10 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#baa673]" />
                    <span className="text-sm font-medium text-[#1e6076]">Pendências</span>
                  </div>
                  <span className="text-2xl font-bold text-[#baa673]">{draftEvaluations}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#1e6076]/10 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#1e6076]" />
                    <span className="text-sm font-medium text-[#1e6076]">Taxa Eficiência</span>
                  </div>
                  <span className="text-2xl font-bold text-[#1e6076]">
                    {statistics?.total && statistics?.total > 0 ? Math.round((completedEvaluations / statistics?.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}