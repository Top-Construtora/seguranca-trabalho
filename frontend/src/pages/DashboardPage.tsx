import React, { useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics, useEvaluations } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  HardHat,
  Home,
  FileText,
  Plus,
  BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export function DashboardPage() {
  const { user, loading: userLoading, refreshUser } = useAuth();
  const { data: statistics, isLoading: statsLoading } = useEvaluationStatistics();
  const { data: works = [], isLoading: worksLoading } = useWorks();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const { data: penaltyTable = [], isLoading: penaltyLoading } = useQuery({
    queryKey: ['penalty-table'],
    queryFn: () => reportsService.getPenaltyTable(),
  });

  // Verificar se precisamos recuperar o usuário
  React.useEffect(() => {
    if (!user && !userLoading) {
      refreshUser();
    }
  }, [user, userLoading, refreshUser]);


  // Processar dados das últimas 5 avaliações de obras
  const lastEvaluationsData = useMemo(() => {
    // Filtrar apenas avaliações de obras e ordenar por data
    const obraEvaluations = evaluations
      .filter(evaluation => evaluation.type === 'obra' && evaluation.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    console.log('Avaliações de obra encontradas:', obraEvaluations.length);
    console.log('Dados das avaliações:', obraEvaluations);

    // Dados de conformidade
    const conformityData = obraEvaluations.map(evaluation => {
      // Corrigir o filtro para usar a propriedade correta 'answer' ao invés de 'status'
      const conforme = evaluation.answers?.filter(a => a.answer === 'sim').length || 0;
      const naoConforme = evaluation.answers?.filter(a => a.answer === 'nao').length || 0;
      const naoAplicavel = evaluation.answers?.filter(a => a.answer === 'na').length || 0;

      const result = {
        name: evaluation.work?.name || 'Obra',
        conforme,
        naoConforme,
        naoAplicavel,
        total: conforme + naoConforme + naoAplicavel,
        conformePercent: ((conforme / (conforme + naoConforme + naoAplicavel)) * 100).toFixed(1)
      };

      console.log('Dados de conformidade para', result.name, result);
      return result;
    });

    // Dados de multas - calcular baseado no peso das questões e quantidade de colaboradores
    // Usando a mesma lógica da central de relatórios
    const penaltyData = obraEvaluations.map(evaluation => {
      const employeeCount = evaluation.employees_count || 100; // Padrão para 100 se não tiver

      // Contar quantas não conformidades existem por peso
      const nonConformitiesByWeight: Record<number, number> = {};

      if (evaluation.answers && Array.isArray(evaluation.answers)) {
        evaluation.answers.forEach(answer => {
          const answerValue = answer.answer;
          if (answerValue === 'nao' || answerValue === 'NAO' || answerValue === 'não') {
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

      const result = {
        name: evaluation.work?.name || 'Obra',
        minValue,
        maxValue,
        actualValue: evaluation.total_penalty || 0
      };

      console.log('Dados de multa para', result.name, '- Colaboradores:', employeeCount, result);
      return result;
    }).filter(item => item.minValue > 0 || item.maxValue > 0); // Filtrar apenas os que têm multas

    console.log('Dados finais:', { conformityData, penaltyData });
    return { conformityData, penaltyData };
  }, [evaluations, penaltyTable]);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserName = () => {
    if (user?.name) return user.name;

    // Fallback: tentar recuperar do localStorage
    try {
      const savedUser = localStorage.getItem('@SST:user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        return parsedUser.name || 'Usuário';
      }
    } catch (error) {
      console.error('Erro ao recuperar nome do usuário:', error);
    }

    return 'Usuário';
  };

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
      <div className="space-y-8">
        {/* Header com saudação */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e6076] via-[#12b0a0] to-[#1e6076] p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-3">
              {getGreeting()}, {getUserName()}!
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


        {/* Gráficos das últimas 5 avaliações */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Conformidade */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-[#12b0a0]/10 to-[#1e6076]/10 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-[#1e6076]">
                <BarChart3 className="h-5 w-5 text-[#12b0a0]" />
                Conformidade das Últimas Avaliações
              </CardTitle>
              <CardDescription>
                Status de conformidade das últimas 5 avaliações de obras
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {lastEvaluationsData.conformityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lastEvaluationsData.conformityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conforme" fill="#10b981" name="Conforme" />
                    <Bar dataKey="naoConforme" fill="#ef4444" name="Não Conforme" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhuma avaliação de obra finalizada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Multas */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-[#baa673]/10 to-[#1e6076]/10 rounded-t-3xl">
              <CardTitle className="flex items-center gap-2 text-[#1e6076]">
                <AlertTriangle className="h-5 w-5 text-[#baa673]" />
                Multas Passíveis das Últimas Avaliações
              </CardTitle>
              <CardDescription>
                Valores de multas das últimas 5 avaliações de obras
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {lastEvaluationsData.penaltyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lastEvaluationsData.penaltyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: any) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="minValue" name="Valor Mínimo" fill="#f59e0b" />
                    <Bar dataKey="maxValue" name="Valor Máximo" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <p>Nenhuma avaliação de obra finalizada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}