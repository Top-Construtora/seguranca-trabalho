import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface SimpleBarChartProps {
  data: Array<{
    name: string;
    conforme: number;
    nao_conforme: number;
  }>;
  height?: number;
}

export function SimpleBarChart({ data, height = 400 }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
          formatter={(value: any) => value}
          labelFormatter={(label) => `${label}`}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => value === 'conforme' ? 'Conforme' : 'Não Conforme'}
        />
        <Bar
          dataKey="conforme"
          fill="#10b981"
          name="conforme"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="nao_conforme"
          fill="#ef4444"
          name="nao_conforme"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}