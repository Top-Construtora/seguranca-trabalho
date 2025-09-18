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

      // Processar nome da obra - cortar antes do "-"
      let workName = evaluation.work?.name || 'Obra';
      if (workName.includes('-')) {
        workName = workName.split('-')[0].trim();
      }

      const result = {
        name: workName,
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

      // Processar nome da obra - cortar antes do "-"
      let workName = evaluation.work?.name || 'Obra';
      if (workName.includes('-')) {
        workName = workName.split('-')[0].trim();
      }

      const result = {
        name: workName,
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
      <div className="space-y-6">
        {/* Header com saudação */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e6076] via-[#12b0a0] to-[#1e6076] p-10 text-white shadow-2xl">
          {/* Padrão de fundo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(186,166,115,0.1) 0%, transparent 50%)'
          }} />

          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-3 tracking-tight drop-shadow-lg">
                {getGreeting()}, {getUserName()}!
              </h1>
              <p className="text-white/90 text-xl font-light">
                Acesse rapidamente as funcionalidades principais do sistema
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/evaluations/obra" className="group relative block bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 font-medium py-5 px-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <HardHat className="h-7 w-7" />
                  </div>
                  <span className="text-sm text-center font-medium">Nova Avaliação de Obra</span>
                </div>
              </Link>

              <Link to="/evaluations/alojamento" className="group relative block bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 font-medium py-5 px-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Home className="h-7 w-7" />
                  </div>
                  <span className="text-sm text-center font-medium">Nova Avaliação de Alojamento</span>
                </div>
              </Link>

              <Link to="/works" className="group relative block bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 font-medium py-5 px-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Plus className="h-7 w-7" />
                  </div>
                  <span className="text-sm text-center font-medium">Novo Cadastro de Obra</span>
                </div>
              </Link>

              <Link to="/reports" className="group relative block bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 font-medium py-5 px-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <FileText className="h-7 w-7" />
                  </div>
                  <span className="text-sm text-center font-medium">Gerenciar Relatórios</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Elementos decorativos */}
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-tr from-[#baa673]/20 to-transparent blur-3xl" />
          <div className="absolute right-1/3 top-1/4 h-20 w-20 rounded-full bg-[#12b0a0]/10 blur-2xl" />
        </div>


        {/* Gráficos das últimas 5 avaliações */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Conformidade */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 bg-gradient-to-r from-[#12b0a0]/5 to-[#1e6076]/5 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076]">
                    <div className="p-2.5 bg-gradient-to-br from-[#12b0a0] to-[#1e6076] rounded-xl shadow-md">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight">Conformidade das Últimas Avaliações</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
                    Status de conformidade das últimas 5 avaliações de obras
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6">
              {lastEvaluationsData.conformityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#1e6076', fontWeight: 600 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
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
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">Nenhuma avaliação de obra finalizada</p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Multas */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#baa673]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 bg-gradient-to-r from-[#baa673]/5 to-[#1e6076]/5 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076]">
                    <div className="p-2.5 bg-gradient-to-br from-[#baa673] to-[#1e6076] rounded-xl shadow-md">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight">Multas Passíveis das Últimas Avaliações</span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600">
                    Valores de multas das últimas 5 avaliações de obras
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6">
              {lastEvaluationsData.penaltyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#1e6076', fontWeight: 600 }}
                      formatter={(value: any) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(value)
                      }
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
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
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">Nenhuma avaliação de obra finalizada</p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}