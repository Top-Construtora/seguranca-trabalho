import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';

interface ComparisonData {
  current: {
    period: string;
    score: number;
    conformity: number;
    evaluations: number;
    categories: Array<{ name: string; value: number }>;
  };
  previous: {
    period: string;
    score: number;
    conformity: number;
    evaluations: number;
    categories: Array<{ name: string; value: number }>;
  };
  trend: Array<{
    month: string;
    current: number;
    previous: number;
    benchmark: number;
  }>;
}

interface ReportComparisonProps {
  data: ComparisonData;
  onPeriodChange: (period: string) => void;
  onRefresh: () => void;
}

export function ReportComparison({ data, onPeriodChange, onRefresh }: ReportComparisonProps) {
  const comparison = useMemo(() => {
    const scoreDiff = data.current.score - data.previous.score;
    const conformityDiff = data.current.conformity - data.previous.conformity;
    const evaluationsDiff = data.current.evaluations - data.previous.evaluations;

    return {
      score: {
        value: scoreDiff,
        percentage: ((scoreDiff / data.previous.score) * 100).toFixed(1),
        trend: scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'neutral',
      },
      conformity: {
        value: conformityDiff,
        percentage: ((conformityDiff / data.previous.conformity) * 100).toFixed(1),
        trend: conformityDiff > 0 ? 'up' : conformityDiff < 0 ? 'down' : 'neutral',
      },
      evaluations: {
        value: evaluationsDiff,
        percentage: ((evaluationsDiff / data.previous.evaluations) * 100).toFixed(1),
        trend: evaluationsDiff > 0 ? 'up' : evaluationsDiff < 0 ? 'down' : 'neutral',
      },
    };
  }, [data]);

  const radarData = useMemo(() => {
    return data.current.categories.map((cat, index) => ({
      category: cat.name,
      atual: cat.value,
      anterior: data.previous.categories[index]?.value || 0,
      benchmark: 80,
    }));
  }, [data]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Select defaultValue="month" onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline">
            Período atual: {data.current.period}
          </Badge>
          <Badge variant="outline">
            Período anterior: {data.previous.period}
          </Badge>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.current.score.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {data.previous.score.toFixed(1)}%
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(comparison.score.trend)}`}>
                {getTrendIcon(comparison.score.trend)}
                <span className="text-xs font-medium">
                  {Math.abs(Number(comparison.score.percentage))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.current.conformity.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {data.previous.conformity.toFixed(1)}%
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(comparison.conformity.trend)}`}>
                {getTrendIcon(comparison.conformity.trend)}
                <span className="text-xs font-medium">
                  {Math.abs(Number(comparison.conformity.percentage))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.current.evaluations}</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {data.previous.evaluations}
                </p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(comparison.evaluations.trend)}`}>
                {getTrendIcon(comparison.evaluations.trend)}
                <span className="text-xs font-medium">
                  {Math.abs(Number(comparison.evaluations.percentage))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Comparação por Categoria</CardTitle>
            <CardDescription>
              Desempenho atual vs anterior por categoria de avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="category" className="text-xs" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Período Atual"
                  dataKey="atual"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Período Anterior"
                  dataKey="anterior"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Benchmark"
                  dataKey="benchmark"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>
              Comparação de tendências ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Período Atual"
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  name="Período Anterior"
                  dot={{ fill: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada de Variações</CardTitle>
          <CardDescription>
            Comparação detalhada entre os períodos selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Categoria</th>
                  <th className="text-right py-2">Atual</th>
                  <th className="text-right py-2">Anterior</th>
                  <th className="text-right py-2">Variação</th>
                  <th className="text-right py-2">Meta</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((item, index) => {
                  const diff = item.atual - item.anterior;
                  const metaDiff = item.atual - item.benchmark;
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.category}</td>
                      <td className="text-right py-2 font-medium">{item.atual.toFixed(1)}%</td>
                      <td className="text-right py-2 text-muted-foreground">{item.anterior.toFixed(1)}%</td>
                      <td className="text-right py-2">
                        <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-2">{item.benchmark}%</td>
                      <td className="text-right py-2">
                        {metaDiff >= 0 ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Atingiu
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {Math.abs(metaDiff).toFixed(0)}% abaixo
                          </Badge>
                        )}
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
  );
}