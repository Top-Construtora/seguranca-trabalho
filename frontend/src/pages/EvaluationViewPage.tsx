import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, FileDown, Calendar, Users, MapPin, CheckCircle, XCircle, AlertTriangle, Eye, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEvaluation } from '@/hooks/useEvaluations';
import { useQuestions } from '@/hooks/useQuestions';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionPlanTab } from '@/components/evaluations/ActionPlanTab';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function EvaluationViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');

  const { data: evaluation, isLoading: evaluationLoading } = useEvaluation(id!);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(
    evaluation?.type,
    true
  );


  if (evaluationLoading || questionsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!evaluation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Avaliação não encontrada</p>
          <Button onClick={() => navigate('/evaluations/obra')} className="mt-4">
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const answeredQuestions = evaluation.answers || [];
  const answeredCount = answeredQuestions.length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const conformeCount = answeredQuestions.filter(a => a.answer === 'sim').length;
  const naoConformeCount = answeredQuestions.filter(a => a.answer === 'nao').length;
  const nonConformAnswers = answeredQuestions.filter(a => a.answer === 'nao');


  const getStatusIcon = () => {
    switch (evaluation.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (evaluation.status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/evaluations/${evaluation.type}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-2xl font-bold">Visualizar Avaliação</h1>
              </div>
              <p className="text-muted-foreground">
                Detalhes completos da avaliação de {evaluation.type === 'obra' ? 'obra' : 'alojamento'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {evaluation.status === 'draft' && (
              <Button
                onClick={() => navigate(`/evaluations/${evaluation.type}/${evaluation.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Evaluation Overview Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  {evaluation.work?.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Nº:</span> {evaluation.work?.number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(evaluation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {evaluation.employees_count} funcionários
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'} className="text-sm">
                  {evaluation.type === 'obra' ? 'Obra' : 'Alojamento'}
                </Badge>
                <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium", getStatusColor())}>
                  {getStatusIcon()}
                  {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso</span>
                  <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{Math.round(progress)}% completo</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Conformes</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{conformeCount}</p>
                <p className="text-xs text-muted-foreground">
                  {questions.length > 0 ? Math.round((conformeCount / questions.length) * 100) : 0}% do total
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Não Conformes</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{naoConformeCount}</p>
                <p className="text-xs text-muted-foreground">
                  {questions.length > 0 ? Math.round((naoConformeCount / questions.length) * 100) : 0}% do total
                </p>
              </div>
            </div>

            {evaluation.status === 'completed' && (
              <>
                <hr className="border-t" />

                {/* Results Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {evaluation.total_penalty !== null && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Multa Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-600">
                          R$ {evaluation.total_penalty?.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Baseado nas não conformidades encontradas
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {evaluation.safety_score !== null && evaluation.safety_score !== undefined && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Pontuação de Segurança
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          {evaluation.safety_score.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Índice geral de conformidade
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {evaluation.notes && (
              <>
                <hr className="border-t" />
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Observações Gerais
                  </h4>
                  <p className="text-sm text-blue-800">{evaluation.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Detalhes da Avaliação
            </TabsTrigger>
            <TabsTrigger value="action-plan" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plano de Ação
              {naoConformeCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {naoConformeCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                Respostas da Avaliação
              </h2>
              <Badge variant="outline" className="text-sm">
                {answeredCount}/{questions.length} questões
              </Badge>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => {
                const answer = answeredQuestions.find(a => a.question_id === question.id);

                return (
                  <Card key={question.id} className={cn(
                    "transition-all hover:shadow-md",
                    answer?.answer === 'nao' && "border-red-200 bg-red-50/30",
                    answer?.answer === 'sim' && "border-green-200 bg-green-50/30",
                    answer?.answer === 'na' && "border-gray-200 bg-gray-50/30",
                    !answer && "border-gray-200"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base leading-relaxed flex items-start gap-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-medium">
                              {index + 1}
                            </span>
                            {question.text}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            Peso {question.weight}
                          </Badge>
                          {answer ? (
                            <Badge
                              variant={answer.answer === 'sim' ? 'default' : answer.answer === 'nao' ? 'destructive' : 'secondary'}
                              className={cn(
                                "text-xs",
                                answer.answer === 'sim' && "bg-green-100 text-green-800 border-green-300",
                                answer.answer === 'nao' && "bg-red-100 text-red-800 border-red-300",
                                answer.answer === 'na' && "bg-gray-100 text-gray-800 border-gray-300"
                              )}
                            >
                              {answer.answer === 'sim' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Conforme
                                </>
                              ) : answer.answer === 'nao' ? (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Não Conforme
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  N/A
                                </>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {answer ? (
                        <div className="space-y-4">
                          {answer.observation && (
                            <div className="p-3 bg-background border rounded-lg">
                              <p className="text-sm font-medium mb-1 text-muted-foreground">Observação:</p>
                              <p className="text-sm">{answer.observation}</p>
                            </div>
                          )}

                          {answer.evidence_urls && answer.evidence_urls.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-3 text-muted-foreground">
                                Evidências ({answer.evidence_urls.length}):
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {answer.evidence_urls.map((url, index) => (
                                  <div key={index} className="group relative">
                                    <img
                                      src={url}
                                      alt={`Evidência ${index + 1}`}
                                      className="rounded-lg border object-cover h-20 w-full cursor-pointer transition-transform group-hover:scale-105"
                                      onClick={() => window.open(url, '_blank')}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                      <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm italic">
                            Esta questão ainda não foi respondida
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="action-plan">
            <ActionPlanTab
              evaluationId={evaluation.id}
              nonConformAnswers={nonConformAnswers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}