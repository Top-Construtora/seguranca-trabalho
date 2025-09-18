import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvaluationStatistics, useEvaluations } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import { useWorks } from '@/hooks/useWorks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  HardHat,
  Home,
  FileText,
  Plus,
  BarChart3,
  Hash,
  Percent
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function DashboardPage() {
  const { user, loading: userLoading, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { isLoading: statsLoading } = useEvaluationStatistics();
  const { isLoading: worksLoading } = useWorks();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();
  const { data: penaltyTable = [], isLoading: penaltyLoading } = useQuery({
    queryKey: ['penalty-table'],
    queryFn: () => reportsService.getPenaltyTable(),
  });

  // Estado para controlar modo de visualização do gráfico de conformidade
  const [conformityViewMode, setConformityViewMode] = useState<'quantity' | 'percentage'>('quantity');
  // Estado para controlar tipo de avaliação no gráfico
  const [evaluationType, setEvaluationType] = useState<'obra' | 'alojamento'>('obra');
  // Estado para controlar se o mouse está sobre os gráficos
  const [isHovering, setIsHovering] = useState(false);

  // Verificar se precisamos recuperar o usuário
  React.useEffect(() => {
    if (!user && !userLoading) {
      refreshUser();
    }
  }, [user, userLoading, refreshUser]);

  // Alternar automaticamente entre obra e alojamento a cada 10 segundos
  React.useEffect(() => {
    // Só alterna se não estiver com o mouse em cima
    if (!isHovering) {
      const interval = setInterval(() => {
        setEvaluationType(prev => prev === 'obra' ? 'alojamento' : 'obra');
      }, 10000); // Alterna a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [isHovering]);


  // Processar dados das últimas 5 avaliações
  const lastEvaluationsData = useMemo(() => {
    // Filtrar avaliações baseado no tipo selecionado e ordenar por data
    const filteredEvaluations = evaluations
      .filter(evaluation => evaluation.type === evaluationType && evaluation.status === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    console.log(`Avaliações de ${evaluationType} encontradas:`, filteredEvaluations.length);
    console.log('Dados das avaliações:', filteredEvaluations);

    // Dados de conformidade
    const conformityData = filteredEvaluations.map(evaluation => {
      // Corrigir o filtro para usar a propriedade correta 'answer' ao invés de 'status'
      const conforme = evaluation.answers?.filter(a => a.answer === 'sim').length || 0;
      const naoConforme = evaluation.answers?.filter(a => a.answer === 'nao').length || 0;
      const naoAplicavel = evaluation.answers?.filter(a => a.answer === 'na').length || 0;

      // Processar nome do local
      let locationName = '';
      if (evaluationType === 'obra') {
        // Para obras, cortar antes do "-"
        locationName = evaluation.work?.name || 'Obra';
        if (locationName.includes('-')) {
          locationName = locationName.split('-')[0].trim();
        }
      } else {
        // Para alojamentos, mostrar "Obra - Alojamento"
        let workName = evaluation.work?.name || 'Obra';
        let accommodationName = evaluation.accommodation?.name || 'Alojamento';

        // Cortar nome da obra antes do "-" se houver
        if (workName.includes('-')) {
          workName = workName.split('-')[0].trim();
        }

        locationName = `${workName} - ${accommodationName}`;
      }

      // Calcular valores baseados no modo de visualização
      const total = conforme + naoConforme; // Não inclui 'não aplicável' no total
      let conformeValue = conforme;
      let naoConformeValue = naoConforme;

      if (conformityViewMode === 'percentage' && total > 0) {
        conformeValue = parseFloat(((conforme / total) * 100).toFixed(1));
        naoConformeValue = parseFloat(((naoConforme / total) * 100).toFixed(1));
      }

      const result = {
        name: locationName,
        conforme: conformeValue,
        naoConforme: naoConformeValue,
        naoAplicavel,
        total,
        conformePercent: ((conforme / (conforme + naoConforme + naoAplicavel)) * 100).toFixed(1)
      };

      console.log('Dados de conformidade para', result.name, result);
      return result;
    });

    // Dados de multas - calcular baseado no peso das questões e quantidade de colaboradores
    // Usando a mesma lógica da central de relatórios
    const penaltyData = filteredEvaluations.map(evaluation => {
      const employeeCount = evaluation.employees_count || 100; // Padrão para 100 se não tiver

      // Contar quantas não conformidades existem por peso
      const nonConformitiesByWeight: Record<number, number> = {};

      if (evaluation.answers && Array.isArray(evaluation.answers)) {
        evaluation.answers.forEach(answer => {
          const answerValue = answer.answer;
          if (answerValue === 'nao') {
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

      // Aplicar fator de correção monetária de 1,0641
      minValue = minValue * 1.0641;
      maxValue = maxValue * 1.0641;

      // Processar nome para o gráfico de multas
      let displayName = '';
      if (evaluationType === 'obra') {
        // Para obras, cortar antes do "-"
        displayName = evaluation.work?.name || 'Obra';
        if (displayName.includes('-')) {
          displayName = displayName.split('-')[0].trim();
        }
      } else {
        // Para alojamentos, mostrar "Obra - Alojamento"
        let workName = evaluation.work?.name || 'Obra';
        let accommodationName = evaluation.accommodation?.name || 'Alojamento';

        // Cortar nome da obra antes do "-" se houver
        if (workName.includes('-')) {
          workName = workName.split('-')[0].trim();
        }

        displayName = `${workName} - ${accommodationName}`;
      }

      const result = {
        name: displayName,
        minValue,
        maxValue,
        actualValue: evaluation.total_penalty || 0
      };

      console.log('Dados de multa para', result.name, '- Colaboradores:', employeeCount, result);
      return result;
    }).filter(item => item.minValue > 0 || item.maxValue > 0); // Filtrar apenas os que têm multas

    console.log('Dados finais:', { conformityData, penaltyData });
    return { conformityData, penaltyData };
  }, [evaluations, penaltyTable, conformityViewMode, evaluationType]);


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
        <div
          className="grid gap-6 lg:grid-cols-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Gráfico de Conformidade */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#12b0a0]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#12b0a0]/5 to-[#1e6076]/5 dark:from-[#12b0a0]/10 dark:to-[#1e6076]/10 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076] dark:text-gray-100">
                    <div className="p-2.5 bg-gradient-to-br from-[#12b0a0] to-[#1e6076] rounded-xl shadow-md">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight flex items-center gap-2">
                      Taxa de Conformidade
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#12b0a0]/10 to-[#1e6076]/10 dark:from-[#12b0a0]/20 dark:to-[#1e6076]/20 rounded-full text-sm font-medium transition-all duration-500 text-gray-700 dark:text-gray-300">
                        {evaluationType === 'obra' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <HardHat className="h-4 w-4 text-[#12b0a0]" />
                            <span>Obras</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-[#12b0a0]" />
                            <span>Alojamentos</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                    Status de conformidade das últimas 5 avaliações de {evaluationType === 'obra' ? 'obras' : 'alojamentos'}
                  </CardDescription>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setConformityViewMode('quantity')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      conformityViewMode === 'quantity'
                        ? "bg-white dark:bg-gray-800 text-[#12b0a0] shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                    title="Visualizar em quantidade"
                  >
                    <Hash className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConformityViewMode('percentage')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      conformityViewMode === 'percentage'
                        ? "bg-white dark:bg-gray-800 text-[#12b0a0] shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                    title="Visualizar em porcentagem"
                  >
                    <Percent className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6 bg-white dark:bg-gray-800">
              <div key={evaluationType}>
                {lastEvaluationsData.conformityData.length > 0 ? (
                  <>
                    <div className="absolute top-2 right-4 z-10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#12b0a0' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Conforme</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Não Conforme</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                      domain={conformityViewMode === 'percentage' ? [0, 100] : undefined}
                      tickFormatter={conformityViewMode === 'percentage' ? (value) => `${value}%` : undefined}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        color: theme === 'dark' ? '#9ca3af' : '#1e6076',
                        fontWeight: 600
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                      formatter={(value: any) => {
                        const formattedValue = conformityViewMode === 'percentage' ? `${value}%` : value;
                        return formattedValue;
                      }}
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
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[360px] text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">
                    Nenhuma avaliação de {evaluationType === 'obra' ? 'obra' : 'alojamento'} finalizada
                  </p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Multas */}
          <Card className="group relative overflow-hidden border-0 rounded-2xl shadow-xl hover:shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Gradiente decorativo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#baa673]/5 via-transparent to-[#1e6076]/5 opacity-50" />

            <CardHeader className="relative border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#baa673]/5 to-[#1e6076]/5 dark:from-[#baa673]/10 dark:to-[#1e6076]/10 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-[#1e6076] dark:text-gray-100">
                    <div className="p-2.5 bg-gradient-to-br from-[#baa673] to-[#1e6076] rounded-xl shadow-md">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <span className="tracking-tight flex items-center gap-2">
                      Multas Passíveis
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#baa673]/10 to-[#1e6076]/10 dark:from-[#baa673]/20 dark:to-[#1e6076]/20 rounded-full text-sm font-medium transition-all duration-500 text-gray-700 dark:text-gray-300">
                        {evaluationType === 'obra' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <HardHat className="h-4 w-4 text-[#baa673]" />
                            <span>Obras</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-[#baa673]" />
                            <span>Alojamentos</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                    Valores de multas das últimas 5 avaliações de {evaluationType === 'obra' ? 'obras' : 'alojamentos'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-8 pb-6 bg-white dark:bg-gray-800">
              <div key={`penalty-${evaluationType}`}>
                {lastEvaluationsData.penaltyData.length > 0 ? (
                <>
                  <div className="absolute top-2 right-4 z-10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Valor Mínimo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#baa673' }}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Valor Máximo</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb' }}
                      stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
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
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        color: theme === 'dark' ? '#9ca3af' : '#1e6076',
                        fontWeight: 600
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                      formatter={(value: any) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(value)
                      }
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
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[360px] text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-base font-medium">
                    Nenhuma avaliação de {evaluationType === 'obra' ? 'obra' : 'alojamento'} finalizada
                  </p>
                  <p className="text-sm mt-1">Os dados aparecerão aqui após as primeiras avaliações</p>
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}