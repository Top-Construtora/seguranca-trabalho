import { useState, useEffect } from 'react';
import { Question } from '@/services/questions.service';
import { AnswerValue, CreateAnswerDto } from '@/services/evaluations.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { filesService } from '@/services/files.service';

interface QuestionFormProps {
  questions: Question[];
  answers: CreateAnswerDto[];
  onAnswersChange: (answers: CreateAnswerDto[]) => void;
  readOnly?: boolean;
}

export function QuestionForm({ questions, answers, onAnswersChange, readOnly = false }: QuestionFormProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, CreateAnswerDto>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [deletingFiles, setDeletingFiles] = useState<Record<string, boolean>>({});

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

  const handleFileUpload = async (questionId: string, files: FileList | null) => {
    if (!files) return;

    setUploadingFiles(prev => ({ ...prev, [questionId]: true }));

    try {
      const uploadedFiles = await filesService.uploadFiles(files);
      const fileUrls = uploadedFiles.map(file => file.publicUrl);
      
      const newAnswers = {
        ...localAnswers,
        [questionId]: {
          ...localAnswers[questionId],
          question_id: questionId,
          evidence_urls: [...(localAnswers[questionId]?.evidence_urls || []), ...fileUrls],
        },
      };
      setLocalAnswers(newAnswers);
      onAnswersChange(Object.values(newAnswers));
    } catch (error) {
      alert('Erro ao fazer upload dos arquivos. Tente novamente.');
      console.error('Upload error:', error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleFileRemove = async (questionId: string, fileUrl: string) => {
    const fileKey = `${questionId}-${fileUrl}`;
    setDeletingFiles(prev => ({ ...prev, [fileKey]: true }));

    try {
      // Extract filename from URL to delete from Supabase
      const filename = fileUrl.split('/').pop();
      if (filename) {
        await filesService.deleteFile(filename);
      }

      // Remove from local state
      const newAnswers = {
        ...localAnswers,
        [questionId]: {
          ...localAnswers[questionId],
          question_id: questionId,
          evidence_urls: localAnswers[questionId]?.evidence_urls?.filter(url => url !== fileUrl) || [],
        },
      };
      setLocalAnswers(newAnswers);
      onAnswersChange(Object.values(newAnswers));
    } catch (error) {
      alert('Erro ao excluir arquivo. Tente novamente.');
      console.error('Delete error:', error);
    } finally {
      setDeletingFiles(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const answer = localAnswers[question.id];
        const isAnswered = answer?.answer !== undefined;
        const isNegative = answer?.answer === AnswerValue.NAO;

        return (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div
                className={cn(
                  "space-y-3 p-4 rounded-lg border",
                  isNegative && "border-destructive bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="text-lg font-bold text-muted-foreground min-w-[2rem]">
                    {index + 1}.
                  </span>
                      <div className="flex-1 space-y-4">
                        <p className="text-lg font-semibold leading-relaxed">
                          {question.text}
                        </p>


                        <RadioGroup
                          value={answer?.answer || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value as AnswerValue)}
                          disabled={readOnly}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <Label
                            htmlFor={`${question.id}-sim`}
                            className={cn(
                              "flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer text-lg font-semibold transition-colors",
                              answer?.answer === AnswerValue.SIM
                                ? "bg-green-100 border-green-300 text-green-800"
                                : "hover:bg-gray-50 border-gray-200"
                            )}
                          >
                            <RadioGroupItem value={AnswerValue.SIM} id={`${question.id}-sim`} className="sr-only" />
                            Conforme
                          </Label>
                          <Label
                            htmlFor={`${question.id}-nao`}
                            className={cn(
                              "flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer text-lg font-semibold transition-colors",
                              answer?.answer === AnswerValue.NAO
                                ? "bg-red-100 border-red-300 text-red-800"
                                : "hover:bg-gray-50 border-gray-200"
                            )}
                          >
                            <RadioGroupItem value={AnswerValue.NAO} id={`${question.id}-nao`} className="sr-only" />
                            Não Conforme
                          </Label>
                          <Label
                            htmlFor={`${question.id}-na`}
                            className={cn(
                              "flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer text-lg font-semibold transition-colors",
                              answer?.answer === AnswerValue.NA
                                ? "bg-gray-100 border-gray-300 text-gray-800"
                                : "hover:bg-gray-50 border-gray-200"
                            )}
                          >
                            <RadioGroupItem value={AnswerValue.NA} id={`${question.id}-na`} className="sr-only" />
                            Não Se Aplica
                          </Label>
                        </RadioGroup>

                        {(isNegative || answer?.observation || answer?.evidence_urls?.length) && (
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor={`${question.id}-obs`} className="text-sm">
                                Observação {isNegative && <span className="text-destructive">*</span>}
                              </Label>
                              <Textarea
                                id={`${question.id}-obs`}
                                placeholder={isNegative ? "Observação obrigatória para respostas não conformes" : "Adicione uma observação..."}
                                value={answer?.observation || ''}
                                onChange={(e) => handleObservationChange(question.id, e.target.value)}
                                disabled={readOnly}
                                className="resize-none"
                                rows={2}
                                required={isNegative}
                              />
                            </div>

                            {!readOnly && (
                              <div className="space-y-2">
                                <Label htmlFor={`${question.id}-files`} className="text-sm">
                                  Anexar Evidências
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id={`${question.id}-files`}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={(e) => handleFileUpload(question.id, e.target.files)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById(`${question.id}-files`)?.click()}
                                    disabled={uploadingFiles[question.id]}
                                    className="flex items-center gap-2"
                                  >
                                    {uploadingFiles[question.id] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Upload className="h-4 w-4" />
                                    )}
                                    {uploadingFiles[question.id] ? 'Enviando...' : 'Selecionar Arquivos'}
                                  </Button>
                                  <span className="text-xs text-gray-500">
                                    Imagens, PDF, DOC aceitos
                                  </span>
                                </div>
                              </div>
                            )}

                            {answer?.evidence_urls && answer.evidence_urls.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm">Arquivos Anexados</Label>
                                <div className="space-y-1">
                                  {answer.evidence_urls.map((fileUrl, index) => {
                                    // Extract filename from URL
                                    const fileName = fileUrl.split('/').pop() || `arquivo-${index + 1}`;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                        <div className="flex items-center gap-2">
                                          <File className="h-4 w-4 text-gray-500" />
                                          <span className="text-sm font-medium">{fileName}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            className="text-blue-600 hover:text-blue-800 px-2 py-1"
                                          >
                                            Ver
                                          </Button>
                                          {!readOnly && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleFileRemove(question.id, fileUrl)}
                                              disabled={deletingFiles[`${question.id}-${fileUrl}`]}
                                              className="text-red-600 hover:text-red-800 px-2 py-1"
                                            >
                                              {deletingFiles[`${question.id}-${fileUrl}`] ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <X className="h-3 w-3" />
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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