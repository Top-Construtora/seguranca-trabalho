import { useState, useEffect } from 'react';
import { Question } from '@/services/questions.service';
import { AnswerValue, CreateAnswerDto } from '@/services/evaluations.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface QuestionFormProps {
  questions: Question[];
  answers: CreateAnswerDto[];
  onAnswersChange: (answers: CreateAnswerDto[]) => void;
  readOnly?: boolean;
}

export function QuestionForm({ questions, answers, onAnswersChange, readOnly = false }: QuestionFormProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, CreateAnswerDto>>({});

  useEffect(() => {
    const answersMap: Record<string, CreateAnswerDto> = {};
    answers.forEach(answer => {
      answersMap[answer.question_id] = answer;
    });
    setLocalAnswers(answersMap);
  }, [answers]);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    const newAnswers = {
      ...localAnswers,
      [questionId]: {
        ...localAnswers[questionId],
        question_id: questionId,
        answer: value,
      },
    };
    setLocalAnswers(newAnswers);
    onAnswersChange(Object.values(newAnswers));
  };

  const handleObservationChange = (questionId: string, observation: string) => {
    const newAnswers = {
      ...localAnswers,
      [questionId]: {
        ...localAnswers[questionId],
        question_id: questionId,
        observation,
      },
    };
    setLocalAnswers(newAnswers);
    onAnswersChange(Object.values(newAnswers));
  };

  const getWeightLabel = (weight: number) => {
    switch (weight) {
      case 1:
        return { label: 'Leve', variant: 'secondary' as const };
      case 2:
        return { label: 'Médio', variant: 'default' as const };
      case 3:
        return { label: 'Grave', variant: 'destructive' as const };
      case 4:
        return { label: 'Gravíssimo', variant: 'destructive' as const };
      default:
        return { label: 'Desconhecido', variant: 'outline' as const };
    }
  };

  // Agrupar perguntas por peso
  const questionsByWeight = questions.reduce((acc, question) => {
    if (!acc[question.weight]) {
      acc[question.weight] = [];
    }
    acc[question.weight].push(question);
    return acc;
  }, {} as Record<number, Question[]>);

  const weights = Object.keys(questionsByWeight)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {weights.map(weight => {
        const weightInfo = getWeightLabel(weight);
        return (
          <Card key={weight}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Perguntas - Peso {weight}</CardTitle>
                <Badge variant={weightInfo.variant}>{weightInfo.label}</Badge>
              </div>
              <CardDescription>
                {questionsByWeight[weight].length} pergunta(s) nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionsByWeight[weight].map((question, index) => {
                const answer = localAnswers[question.id];
                const isAnswered = answer?.answer !== undefined;
                const isNegative = answer?.answer === AnswerValue.NAO;

                return (
                  <div
                    key={question.id}
                    className={cn(
                      "space-y-3 p-4 rounded-lg border",
                      isNegative && "border-destructive bg-destructive/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        {questionsByWeight[weight].indexOf(question) + 1}.
                      </span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium leading-relaxed">
                          {question.text}
                        </p>

                        {!readOnly && !isAnswered && (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Resposta obrigatória</span>
                          </div>
                        )}

                        <RadioGroup
                          value={answer?.answer || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value as AnswerValue)}
                          disabled={readOnly}
                          className="flex flex-row gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={AnswerValue.SIM} id={`${question.id}-sim`} />
                            <Label htmlFor={`${question.id}-sim`} className="cursor-pointer">
                              Sim
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={AnswerValue.NAO} id={`${question.id}-nao`} />
                            <Label htmlFor={`${question.id}-nao`} className="cursor-pointer">
                              Não
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={AnswerValue.NA} id={`${question.id}-na`} />
                            <Label htmlFor={`${question.id}-na`} className="cursor-pointer">
                              N/A
                            </Label>
                          </div>
                        </RadioGroup>

                        {(isNegative || answer?.observation) && (
                          <div className="space-y-2">
                            <Label htmlFor={`${question.id}-obs`} className="text-sm">
                              Observação {isNegative && <span className="text-destructive">*</span>}
                            </Label>
                            <Textarea
                              id={`${question.id}-obs`}
                              placeholder={isNegative ? "Observação obrigatória para respostas negativas" : "Adicione uma observação..."}
                              value={answer?.observation || ''}
                              onChange={(e) => handleObservationChange(question.id, e.target.value)}
                              disabled={readOnly}
                              className="resize-none"
                              rows={2}
                              required={isNegative}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}