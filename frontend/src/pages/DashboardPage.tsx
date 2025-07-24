import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics } from '@/hooks/useEvaluations';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DashboardPage() {
  const { user } = useAuth();
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

  if (statsLoading || worksLoading) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Cards de estatísticas principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Obras Ativas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorks}</div>
              <p className="text-xs text-muted-foreground">
                de {totalWorks} obras cadastradas
              </p>
              <Progress 
                value={(activeWorks / totalWorks) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Avaliações
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.total || 0}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {completedEvaluations} finalizadas
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {draftEvaluations} rascunhos
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Multas Aplicadas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics?.totalPenalties || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                em avaliações finalizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conformidade
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedEvaluations > 0 
                  ? Math.round((completedEvaluations / statistics.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                de avaliações finalizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de detalhamento */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição por Tipo
              </CardTitle>
              <CardDescription>
                Avaliações realizadas por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Obra</span>
                    <span className="text-sm text-muted-foreground">
                      {obraEvaluations} avaliações
                    </span>
                  </div>
                  <Progress 
                    value={statistics?.total > 0 ? (obraEvaluations / statistics.total) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Alojamento</span>
                    <span className="text-sm text-muted-foreground">
                      {alojamentoEvaluations} avaliações
                    </span>
                  </div>
                  <Progress 
                    value={statistics?.total > 0 ? (alojamentoEvaluations / statistics.total) * 100 : 0} 
                    className="h-2 bg-blue-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status das Avaliações
              </CardTitle>
              <CardDescription>
                Distribuição por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Finalizadas</span>
                  </div>
                  <span className="text-2xl font-bold">{completedEvaluations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">Em Rascunho</span>
                  </div>
                  <span className="text-2xl font-bold">{draftEvaluations}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a
                href="/evaluations"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <ClipboardCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Nova Avaliação</p>
                  <p className="text-sm text-muted-foreground">
                    Iniciar uma nova avaliação de segurança
                  </p>
                </div>
              </a>
              
              <a
                href="/works"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Gerenciar Obras</p>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar ou editar obras
                  </p>
                </div>
              </a>
              
              <a
                href="/reports"
                className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Relatórios</p>
                  <p className="text-sm text-muted-foreground">
                    Visualizar relatórios e análises
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}