import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, CheckCircle, Loader2 } from 'lucide-react';
import { QuestionForm } from '@/components/evaluations/QuestionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useEvaluation, 
  useUpdateAnswers,
  useCompleteEvaluation 
} from '@/hooks/useEvaluations';
import { useQuestions } from '@/hooks/useQuestions';
import { CreateAnswerDto } from '@/services/evaluations.service';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/utils/date';

export function EvaluationEditPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<CreateAnswerDto[]>([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: evaluation, isLoading: evaluationLoading } = useEvaluation(id!);
  const { data: questions = [], isLoading: questionsLoading } = useQuestions(
    evaluation?.type,
    true
  );
  const updateAnswers = useUpdateAnswers();
  const completeEvaluation = useCompleteEvaluation();

  useEffect(() => {
    if (evaluation?.answers) {
      const mappedAnswers: CreateAnswerDto[] = evaluation.answers.map(answer => ({
        question_id: answer.question_id,
        answer: answer.answer,
        observation: answer.observation,
        evidence_urls: answer.evidence_urls,
      }));
      setAnswers(mappedAnswers);
    }
  }, [evaluation]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAnswers.mutateAsync({
        id: id!,
        data: { answers },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    // Verificar se todas as perguntas foram respondidas com um valor válido
    const allAnswered = questions.every(question =>
      answers.some(answer =>
        answer.question_id === question.id &&
        answer.answer !== undefined &&
        answer.answer !== null &&
        answer.answer !== ''
      )
    );

    if (!allAnswered) {
      alert('Por favor, responda todas as perguntas antes de finalizar.');
      return;
    }

    // Salvar respostas antes de finalizar
    await handleSave();

    // Finalizar avaliação
    await completeEvaluation.mutateAsync(id!);
    setShowCompleteDialog(false);
    // Redirecionar para a página de relatório da avaliação
    navigate(`/reports/evaluation/${id}`);
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
          <Button onClick={() => navigate(`/evaluations/${type}`)} className="mt-4">
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Contar apenas perguntas que têm uma resposta válida (sim, não, ou n/a)
  const answeredCount = questions.filter(question => {
    const hasAnswer = answers.some(answer =>
      answer.question_id === question.id &&
      answer.answer !== undefined &&
      answer.answer !== null &&
      answer.answer !== ''
    );
    return hasAnswer;
  }).length;

  // Debug: log para identificar perguntas não respondidas
  console.log('Total questions:', questions.length);
  console.log('Total answers:', answers.length);
  console.log('Answered count:', answeredCount);

  // Identificar perguntas não respondidas
  const unansweredQuestions = questions.filter(question => {
    const hasAnswer = answers.some(answer =>
      answer.question_id === question.id &&
      answer.answer !== undefined &&
      answer.answer !== null &&
      answer.answer !== ''
    );
    return !hasAnswer;
  });

  console.log('❌ Perguntas NÃO respondidas:', unansweredQuestions.map(q => ({
    id: q.id,
    order: q.order,
    text: q.text,
    type: q.type
  })));

  const progress = (answeredCount / questions.length) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/evaluations/${type}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Editar Avaliação</h1>
              <p className="text-muted-foreground">
                Continue preenchendo as respostas da avaliação
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || updateAnswers.isPending}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => setShowCompleteDialog(true)}
              disabled={answeredCount < questions.length}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Avaliação
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{evaluation.work?.name}</CardTitle>
                <CardDescription>
                  {evaluation.work?.number} • {' '}
                  {formatDate(evaluation.date, "dd 'de' MMMM 'de' yyyy")} • {' '}
                  {evaluation.employees_count} funcionários
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={evaluation.type === 'obra' ? 'default' : 'secondary'}>
                  {evaluation.type === 'obra' ? 'Obra' : 'Alojamento'}
                </Badge>
                <Badge variant="outline">
                  {answeredCount}/{questions.length} respondidas
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {evaluation.notes && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Observações gerais:</p>
                <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <QuestionForm
          questions={questions}
          answers={answers}
          onAnswersChange={setAnswers}
        />

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || updateAnswers.isPending}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => setShowCompleteDialog(true)}
            disabled={answeredCount < questions.length}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar Avaliação
          </Button>
        </div>
      </div>

      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar esta avaliação? 
              Após finalizada, não será possível editar as respostas.
              A multa total será calculada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}