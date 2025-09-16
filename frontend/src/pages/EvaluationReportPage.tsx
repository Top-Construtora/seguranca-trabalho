import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEvaluation } from '@/hooks/useEvaluations';
import { useQuestions } from '@/hooks/useQuestions';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { reportsService } from '@/services/reports.service';

export function EvaluationReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: evaluation, isLoading: evaluationLoading } = useEvaluation(id!);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(
    evaluation?.type,
    true
  );

  const handleGeneratePdf = async () => {
    if (!evaluation) return;

    setIsGeneratingPdf(true);
    try {
      await reportsService.downloadEvaluationPDF(evaluation.id);
      toast({
        title: 'PDF baixado',
        description: 'O relatório da avaliação foi baixado com sucesso.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: 'Erro ao baixar PDF',
        description: error.response?.data?.message || 'Ocorreu um erro ao baixar o relatório PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handlePrint = () => {
    window.print();
  };

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
  const conformeCount = answeredQuestions.filter(a => a.answer === 'sim').length;
  const naoConformeCount = answeredQuestions.filter(a => a.answer === 'nao').length;
  const naCount = answeredQuestions.filter(a => a.answer === 'na').length;
  const totalAnswered = answeredQuestions.length;
  const progress = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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
              <h1 className="text-2xl font-bold">Relatório da Avaliação</h1>
              <p className="text-muted-foreground">
                Relatório detalhado de {evaluation.type === 'obra' ? 'obra' : 'alojamento'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RELATÓRIO DE AVALIAÇÃO</h1>
            <h2 className="text-xl text-gray-700">
              {evaluation.type === 'obra' ? 'SEGURANÇA EM OBRA' : 'SEGURANÇA EM ALOJAMENTO'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Evaluation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Avaliação</CardTitle>
              <CardDescription>Detalhes gerais sobre a avaliação realizada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Obra/Local</p>
                    <p className="font-semibold text-lg">{evaluation.work?.name}</p>
                    <p className="text-sm text-muted-foreground">Nº {evaluation.work?.number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data da Avaliação</p>
                    <p className="font-semibold">
                      {format(new Date(evaluation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número de Funcionários</p>
                    <p className="font-semibold">{evaluation.employees_count}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avaliador</p>
                    <p className="font-semibold">{evaluation.user?.name}</p>
                    <p className="text-sm text-muted-foreground">{evaluation.user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Avaliação</p>
                    <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'} className="mt-1">
                      {evaluation.type === 'obra' ? 'Obra' : 'Alojamento'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Questões respondidas</span>
                        <span>{totalAnswered}/{questions.length}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {evaluation.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-muted rounded">
                    <p className="text-xl font-bold text-green-600">{conformeCount}</p>
                    <p className="text-xs text-muted-foreground">Conformes</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <p className="text-xl font-bold text-red-600">{naoConformeCount}</p>
                    <p className="text-xs text-muted-foreground">Não Conformes</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <p className="text-xl font-bold text-gray-600">{naCount}</p>
                    <p className="text-xs text-muted-foreground">N/A</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <p className="text-xl font-bold">{questions.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>

                {evaluation.total_penalty !== null && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded">
                      <span className="text-sm font-medium text-red-900">Multa Total:</span>
                      <span className="font-bold text-red-600">
                        R$ {evaluation.total_penalty?.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Questions and Answers */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento das Questões</CardTitle>
              <CardDescription>
                Lista completa de todas as questões avaliadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const answer = answeredQuestions.find(a => a.question_id === question.id);

                  return (
                    <div key={question.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {index + 1}. {question.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Peso {question.weight}
                            </Badge>
                          </div>
                        </div>
                        {answer ? (
                          <Badge
                            variant={answer.answer === 'sim' ? 'default' : answer.answer === 'nao' ? 'destructive' : 'secondary'}
                            className="shrink-0"
                          >
                            {answer.answer === 'sim' ? 'Conforme' : answer.answer === 'nao' ? 'Não Conforme' : 'N/A'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            Não respondida
                          </Badge>
                        )}
                      </div>

                      {answer?.observation && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Observação:</p>
                          <p className="text-sm">{answer.observation}</p>
                        </div>
                      )}

                      {answer?.evidence_urls && answer.evidence_urls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-2">Evidências:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {answer.evidence_urls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Evidência ${idx + 1}`}
                                className="rounded border object-cover h-16 w-full"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {evaluation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Observações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{evaluation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}