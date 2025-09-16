import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricData {
  conformityRate: number;
  averageScore: number;
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  criticalIssues: number;
  improvementRate: number;
  topRisks: Array<{ name: string; count: number }>;
}

interface ReportMetricsProps {
  data: MetricData;
}

export function ReportMetrics({ data }: ReportMetricsProps) {
  const scoreStatus = useMemo(() => {
    if (data.averageScore >= 85) return { label: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (data.averageScore >= 70) return { label: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (data.averageScore >= 50) return { label: 'Regular', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50' };
  }, [data.averageScore]);

  const complianceLevel = useMemo(() => {
    if (data.conformityRate >= 90) return { level: 'Alto', icon: CheckCircle2, color: 'text-green-600' };
    if (data.conformityRate >= 70) return { level: 'Médio', icon: AlertTriangle, color: 'text-yellow-600' };
    return { level: 'Baixo', icon: XCircle, color: 'text-red-600' };
  }, [data.conformityRate]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pontuação Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-3xl font-bold">{data.averageScore.toFixed(1)}%</p>
                  <p className={cn("text-sm font-medium", scoreStatus.color)}>
                    {scoreStatus.label}
                  </p>
                </div>
              </div>
              <div className={cn("px-3 py-1 rounded-full", scoreStatus.bgColor)}>
                {data.improvementRate > 0 ? (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+{data.improvementRate}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">{data.improvementRate}%</span>
                  </div>
                )}
              </div>
            </div>
            <Progress value={data.averageScore} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Meta: 80%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status de Conformidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <complianceLevel.icon className={cn("h-8 w-8", complianceLevel.color)} />
                <div>
                  <p className="text-3xl font-bold">{data.conformityRate.toFixed(1)}%</p>
                  <p className={cn("text-sm font-medium", complianceLevel.color)}>
                    Nível {complianceLevel.level}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Itens conformes</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.round((data.conformityRate * data.totalEvaluations) / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Não conformes</span>
                <span className="text-sm font-medium text-red-600">
                  {Math.round(((100 - data.conformityRate) * data.totalEvaluations) / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Problemas críticos</span>
                <span className="text-sm font-medium text-orange-600">
                  {data.criticalIssues}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Resumo de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-3xl font-bold">{data.totalEvaluations}</p>
                <p className="text-sm text-muted-foreground">Total de avaliações</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Concluídas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{data.completedEvaluations}</span>
                  <Badge variant="default" className="text-xs">
                    {((data.completedEvaluations / data.totalEvaluations) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{data.pendingEvaluations}</span>
                  <Badge variant="secondary" className="text-xs">
                    {((data.pendingEvaluations / data.totalEvaluations) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Risks */}
      {data.topRisks && data.topRisks.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Principais Riscos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.topRisks.slice(0, 6).map((risk, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <span className="text-sm font-medium text-orange-900">{risk.name}</span>
                  <Badge variant="destructive" className="bg-orange-600">
                    {risk.count} ocorrências
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}