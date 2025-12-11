import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAccidentsDashboard,
  useDaysAwayByWork,
  useAccidentsByBodyPart,
  useAccidentsBySeverity,
  useAccidentsTimeline,
  useAccidentsMonthlyTrend,
} from '@/hooks/useAccidents';
import { useWorks } from '@/hooks/useWorks';
import {
  SEVERITY_LABELS,
  BODY_PART_LABELS,
  SEVERITY_COLORS,
  AccidentSeverity,
} from '@/types/accident.types';
import { SeverityBadge, AccidentStatusBadge } from '@/components/accidents/AccidentStatusBadge';
import { formatDate } from '@/utils/date';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Building2,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export function AccidentDashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    work_id?: string;
    start_date?: string;
    end_date?: string;
  }>({});

  const { data: works = [] } = useWorks();
  const { data: summary } = useAccidentsDashboard(filters);
  const { data: byWork = [] } = useDaysAwayByWork(filters);
  const { data: byBodyPart = [] } = useAccidentsByBodyPart(filters);
  const { data: bySeverity = [] } = useAccidentsBySeverity(filters);
  const { data: timeline = [] } = useAccidentsTimeline({ ...filters, limit: 10 });
  const { data: monthlyTrend = [] } = useAccidentsMonthlyTrend();

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
            Dashboard de Acidentes
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Visão geral e indicadores de segurança
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Obra</Label>
              <Select
                value={filters.work_id || 'all'}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, work_id: v === 'all' ? undefined : v }))
                }
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Data Inicial</Label>
              <Input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, start_date: e.target.value || undefined }))
                }
                className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-gray-400">Data Final</Label>
              <Input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, end_date: e.target.value || undefined }))
                }
                className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0]"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Acidentes</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{summary?.totalAccidents || 0}</p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dias de Afastamento</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{summary?.totalDaysAway || 0}</p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <Clock className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ações Pendentes</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{summary?.pendingActions || 0}</p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Obras Afetadas</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{byWork.length}</p>
              </div>
              <div className="p-3 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-full">
                <Building2 className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Acidentes por Severidade</h3>
            <div>
              {bySeverity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bySeverity.map((item) => ({
                        name: SEVERITY_LABELS[item.severity as AccidentSeverity],
                        value: Number(item.count),
                        color: SEVERITY_COLORS[item.severity as AccidentSeverity],
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {bySeverity.map((item, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SEVERITY_COLORS[item.severity as AccidentSeverity]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>

          {/* Days Away by Work */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Dias de Afastamento por Obra</h3>
            <div>
              {byWork.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byWork.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="work_name"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="total_days_away" fill="#1e6076" name="Dias" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Body Parts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Partes do Corpo Mais Afetadas</h3>
            <div>
              {byBodyPart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byBodyPart.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="body_part"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => BODY_PART_LABELS[v as keyof typeof BODY_PART_LABELS] || v}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [value, 'Ocorrências']}
                      labelFormatter={(v) => BODY_PART_LABELS[v as keyof typeof BODY_PART_LABELS] || v}
                    />
                    <Bar dataKey="count" fill="#12b0a0" name="Ocorrências" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Tendência Mensal</h3>
            <div>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => {
                        const [year, month] = v.split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      labelFormatter={(v) => {
                        const [year, month] = v.split('-');
                        return `${month}/${year}`;
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#1e6076"
                      name="Acidentes"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="days_away"
                      stroke="#12b0a0"
                      name="Dias Afastamento"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Últimos Acidentes</h3>
          <div>
            {timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((accident) => (
                  <div
                    key={accident.id}
                    className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/accidents/${accident.id}`)}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#12b0a0]" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{accident.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {accident.work?.name} - {formatDate(accident.accident_date)}
                      </p>
                    </div>
                    <SeverityBadge severity={accident.severity} />
                    <AccidentStatusBadge status={accident.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400 dark:text-gray-500">
                Nenhum acidente registrado
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
