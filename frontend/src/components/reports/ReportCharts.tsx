import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Percent, Hash } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

interface ChartProps {
  data: any[];
  title: string;
  description?: string;
  penaltyData?: any[];
}

export function LastWorksConformityChart({ data, title, description, penaltyData }: ChartProps) {
  const [viewMode, setViewMode] = useState<'quantity' | 'percentage'>('quantity');

  // Processar dados para porcentagem se necessário
  const processedData = useMemo(() => {
    if (viewMode === 'percentage') {
      return data.map((item: any) => {
        const total = item.conforme + item.naoConforme;
        if (total === 0) return { ...item, conforme: 0, naoConforme: 0 };

        return {
          ...item,
          conforme: parseFloat(((item.conforme / total) * 100).toFixed(1)),
          naoConforme: parseFloat(((item.naoConforme / total) * 100).toFixed(1)),
        };
      });
    }
    return data;
  }, [data, viewMode]);

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'quantity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('quantity')}
              className="h-8 px-2"
              title="Quantidade"
            >
              <Hash className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('percentage')}
              className="h-8 px-2"
              title="Porcentagem"
            >
              <Percent className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: viewMode === 'percentage' ? 'Porcentagem (%)' : 'Quantidade',
                angle: -90,
                position: 'insideLeft'
              }}
              domain={viewMode === 'percentage' ? [0, 100] : undefined}
              tickFormatter={viewMode === 'percentage' ? (value) => `${value}%` : undefined}
            />
            <Tooltip
              formatter={(value: any) => [
                viewMode === 'percentage' ? `${value}%` : value,
                ''
              ]}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            />
            <Legend align="right" verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
            <Bar
              dataKey="conforme"
              name="Conforme"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey="conforme"
                position="top"
                formatter={(value: any) => viewMode === 'percentage' ? `${value}%` : value}
                style={{ fontSize: '12px', fontWeight: 'bold', fill: '#059669' }}
              />
            </Bar>
            <Bar
              dataKey="naoConforme"
              name="Não Conforme"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
            >
              <LabelList
                dataKey="naoConforme"
                position="top"
                formatter={(value: any) => viewMode === 'percentage' ? `${value}%` : value}
                style={{ fontSize: '12px', fontWeight: 'bold', fill: '#dc2626' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {penaltyData && penaltyData.length > 0 && (
          <>
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-4">Valores de Multa Possíveis (R$)</h4>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={penaltyData}
                  margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{
                      value: 'Valor (R$)',
                      angle: -90,
                      position: 'insideLeft'
                    }}
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
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(value)
                    }
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Legend align="right" verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar
                    dataKey="minValue"
                    name="Valor Mínimo"
                    fill="#f59e0b"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="maxValue"
                    name="Valor Máximo"
                    fill="#dc2626"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ConformityTrendChart({ data, title, description }: ChartProps) {
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      conformePercent: item.total > 0 ? ((item.conforme / item.total) * 100).toFixed(1) : 0,
      naoConformePercent: item.total > 0 ? ((item.naoConforme / item.total) * 100).toFixed(1) : 0,
    }));
  }, [data]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorConforme" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorNaoConforme" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
              formatter={(value: any) => `${value}%`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="conformePercent"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorConforme)"
              name="Conforme"
            />
            <Area
              type="monotone"
              dataKey="naoConformePercent"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorNaoConforme)"
              name="Não Conforme"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function EvaluationsByTypeChart({ data, title, description }: ChartProps) {
  const formattedData = useMemo(() => {
    const typeCount = data.reduce((acc: any, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCount).map(([name, value]) => ({
      name: name === 'obra' ? 'Obra' : 'Alojamento',
      value,
    }));
  }, [data]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ScoreDistributionChart({ data, title, description }: ChartProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopWorksChart({ data, title, description }: ChartProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="name" type="category" className="text-xs" width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
              formatter={(value: any) => `${value.toFixed(1)}%`}
            />
            <Bar dataKey="score" fill="#10b981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MonthlyComparisonChart({ data, title, description }: ChartProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="evaluations"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Avaliações"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="#10b981"
              strokeWidth={2}
              name="Pontuação Média"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}