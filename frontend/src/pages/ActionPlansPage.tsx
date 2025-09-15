import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActionPlansByAnswer, useCreateActionPlan, useUpdateActionPlan, ActionPlan } from '@/hooks/useActionPlans';
import { useWorks } from '@/hooks/useWorks';
import { useAccommodations } from '@/hooks/useAccommodations';
import { useEvaluations, useEvaluation } from '@/hooks/useEvaluations';
import { filesService } from '@/services/files.service';
import { ClipboardList, CheckCircle, Building2, Home, MapPin, Save, AlertCircle, Upload, File, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ActionPlansPage() {
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [workType, setWorkType] = useState<'obra' | 'alojamento'>('obra');
  const [actionPlanTexts, setActionPlanTexts] = useState<Record<string, string>>({});
  const [attachmentFiles, setAttachmentFiles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Fetch data
  const { data: works, isLoading: isLoadingWorks } = useWorks();
  const { data: accommodations, isLoading: isLoadingAccommodations } = useAccommodations();
  const { data: evaluations, isLoading: isLoadingEvaluations } = useEvaluations();
  const { data: selectedEvaluationData, isLoading: isLoadingSelectedEvaluation } = useEvaluation(selectedEvaluationId);
  const createActionPlan = useCreateActionPlan();
  const updateActionPlan = useUpdateActionPlan();

  // Filter works/accommodations
  const activeWorks = works?.filter(work => work.is_active) || [];
  const activeAccommodations = accommodations?.filter(acc => acc.is_active) || [];

  // Get items based on selected type
  const availableItems = workType === 'obra' ? activeWorks : activeAccommodations;

  // Filter evaluations by selected work
  const workEvaluations = evaluations?.filter(evaluation =>
    evaluation.work_id === selectedWorkId
  ) || [];

  // Get selected work details
  const selectedWork = selectedWorkId ?
    [...activeWorks, ...activeAccommodations].find(work => work.id === selectedWorkId) : null;

  // Get non-conforming answers from selected evaluation
  const nonConformAnswers = selectedEvaluationData?.answers?.filter(answer => answer.answer === 'nao') || [];

  // Reset selections when work type changes
  const handleWorkTypeChange = (type: 'obra' | 'alojamento') => {
    setWorkType(type);
    setSelectedWorkId('');
    setSelectedEvaluationId('');
    setActionPlanTexts({});
    setAttachmentFiles({});
  };

  // Reset evaluation selection when work changes
  const handleWorkSelection = (workId: string) => {
    setSelectedWorkId(workId);
    setSelectedEvaluationId('');
    setActionPlanTexts({});
    setAttachmentFiles({});
  };

  // Load existing action plans when evaluation changes
  useEffect(() => {
    if (nonConformAnswers.length > 0) {
      const textsObj: Record<string, string> = {};

      // Initialize with empty strings for all answers
      nonConformAnswers.forEach(answer => {
        textsObj[answer.id] = '';
      });

      setActionPlanTexts(textsObj);
      setAttachmentFiles({});
    }
  }, [nonConformAnswers]);

  // Handle textarea change
  const handleTextChange = (answerId: string, text: string) => {
    setActionPlanTexts(prev => ({
      ...prev,
      [answerId]: text
    }));
  };

  // Handle file upload
  const handleFileUpload = async (answerId: string, files: FileList) => {
    if (!files.length) return;

    setUploadingFiles(prev => ({ ...prev, [answerId]: true }));

    try {
      const uploadedFiles = await filesService.uploadFiles(files);
      const fileUrls = uploadedFiles.map(file => file.publicUrl);

      setAttachmentFiles(prev => ({
        ...prev,
        [answerId]: [...(prev[answerId] || []), ...fileUrls]
      }));

      toast.success(`${uploadedFiles.length} arquivo(s) anexado(s) com sucesso!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao anexar arquivos');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [answerId]: false }));
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (answerId: string, fileUrl: string) => {
    setAttachmentFiles(prev => ({
      ...prev,
      [answerId]: (prev[answerId] || []).filter(url => url !== fileUrl)
    }));
  };

  // Save action plan
  const handleSaveActionPlan = async (answerId: string, description: string) => {
    if (!description.trim()) {
      toast.error('Por favor, digite uma descrição para o plano de ação');
      return;
    }

    setIsLoading(true);
    try {
      // Always create new plan for simplicity
      await createActionPlan.mutateAsync({
        answer_id: answerId,
        action_description: description,
        status: 'pending',
        attachment_urls: attachmentFiles[answerId] || []
      });
      toast.success('Plano de ação salvo com sucesso!');

      // Clear the form for this specific answer
      setActionPlanTexts(prev => ({ ...prev, [answerId]: '' }));
      setAttachmentFiles(prev => ({ ...prev, [answerId]: [] }));
    } catch (error) {
      console.error('Error saving action plan:', error);
      toast.error('Erro ao salvar plano de ação');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-blue-600" />
              Planos de Ação
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie e acompanhe os planos de ação das avaliações
            </p>
          </div>
        </div>

        {/* Horizontal selection filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Seleção</CardTitle>
            <CardDescription>
              Selecione o tipo, local e avaliação para visualizar os planos de ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Work Type Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <Select value={workType} onValueChange={handleWorkTypeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obra">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-600" />
                        Obras
                      </div>
                    </SelectItem>
                    <SelectItem value="alojamento">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-600" />
                        Alojamentos
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work/Accommodation Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {workType === 'obra' ? 'Obra' : 'Alojamento'}
                </Label>
                <Select value={selectedWorkId} onValueChange={handleWorkSelection}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Selecione ${workType === 'obra' ? 'uma obra' : 'um alojamento'}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(isLoadingWorks || isLoadingAccommodations) ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : availableItems.length > 0 ? (
                      availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.address}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-items" disabled>
                        Nenhum{workType === 'obra' ? 'a obra' : ' alojamento'} ativo encontrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Evaluation Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Avaliação</Label>
                <Select value={selectedEvaluationId} onValueChange={setSelectedEvaluationId} disabled={!selectedWorkId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma avaliação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEvaluations ? (
                      <SelectItem value="loading-eval" disabled>Carregando avaliações...</SelectItem>
                    ) : workEvaluations.length > 0 ? (
                      workEvaluations.map((evaluation) => (
                        <SelectItem key={evaluation.id} value={evaluation.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {evaluation.status === 'completed' ? 'Concluída' : 'Em andamento'}
                            </Badge>
                            <span>
                              {evaluation.evaluation_type} - {format(new Date(evaluation.created_at), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-evaluations" disabled>Nenhuma avaliação encontrada</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Plans Content */}
        {selectedEvaluationId ? (
                  <div className="space-y-4">
                    {/* Action Plans Interface */}
                    {isLoadingSelectedEvaluation ? (
                        <Card>
                          <CardContent className="p-8">
                            <div className="text-center">Carregando dados da avaliação...</div>
                          </CardContent>
                        </Card>
                      ) : nonConformAnswers.length > 0 ? (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                Questões Não Conformes - Planos de Ação
                              </CardTitle>
                              <CardDescription>
                                Para cada questão abaixo, escreva o plano de ação correspondente
                              </CardDescription>
                            </CardHeader>
                          </Card>

                          {nonConformAnswers.map((answer, index) => (
                            <Card key={answer.id} className="border-l-4 border-l-red-500">
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Questão {index + 1}
                                </CardTitle>
                                <CardDescription className="text-base">
                                  {answer.question?.text || 'Questão não encontrada'}
                                </CardDescription>
                                {answer.observation && (
                                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-sm text-yellow-800">
                                      <strong>Observação:</strong> {answer.observation}
                                    </p>
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor={`action-plan-${answer.id}`} className="text-sm font-medium">
                                      Plano de Ação *
                                    </Label>
                                    <Textarea
                                      id={`action-plan-${answer.id}`}
                                      placeholder="Descreva o plano de ação para corrigir esta não conformidade..."
                                      value={actionPlanTexts[answer.id] || ''}
                                      onChange={(e) => handleTextChange(answer.id, e.target.value)}
                                      className="mt-1 min-h-[120px]"
                                    />
                                  </div>

                                  {/* File Upload Section */}
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Anexos (opcional)
                                    </Label>
                                    <div className="mt-2 space-y-3">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="file"
                                          id={`file-upload-${answer.id}`}
                                          multiple
                                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                          onChange={(e) => e.target.files && handleFileUpload(answer.id, e.target.files)}
                                          className="hidden"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => document.getElementById(`file-upload-${answer.id}`)?.click()}
                                          disabled={uploadingFiles[answer.id]}
                                          className="flex items-center gap-2"
                                        >
                                          <Upload className="h-4 w-4" />
                                          {uploadingFiles[answer.id] ? 'Carregando...' : 'Anexar Arquivo'}
                                        </Button>
                                        <span className="text-xs text-gray-500">
                                          PDF, DOC, DOCX, JPG, PNG, TXT
                                        </span>
                                      </div>

                                      {/* Display uploaded files */}
                                      {attachmentFiles[answer.id] && attachmentFiles[answer.id].length > 0 && (
                                        <div className="space-y-2">
                                          <p className="text-sm font-medium text-gray-700">
                                            Arquivos anexados:
                                          </p>
                                          <div className="space-y-1">
                                            {attachmentFiles[answer.id].map((fileUrl, fileIndex) => (
                                              <div key={fileIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                                <File className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm flex-1 truncate">
                                                  {fileUrl.split('/').pop() || `Arquivo ${fileIndex + 1}`}
                                                </span>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => window.open(fileUrl, '_blank')}
                                                  className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                                                >
                                                  Visualizar
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleRemoveAttachment(answer.id, fileUrl)}
                                                  className="text-red-600 hover:text-red-700 p-1 h-auto"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      onClick={() => handleSaveActionPlan(answer.id, actionPlanTexts[answer.id] || '')}
                                      disabled={isLoading || !actionPlanTexts[answer.id]?.trim()}
                                      className="flex items-center gap-2"
                                    >
                                      <Save className="h-4 w-4" />
                                      {isLoading ? 'Salvando...' : 'Salvar Plano'}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3 text-blue-800">
                                <ClipboardList className="h-5 w-5" />
                                <div>
                                  <p className="font-medium">
                                    {nonConformAnswers.length} questão(ões) não conforme(s) encontrada(s)
                                  </p>
                                  <p className="text-sm">
                                    Certifique-se de criar planos de ação para todas as questões listadas
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              Avaliação 100% Conforme
                            </CardTitle>
                            <CardDescription>
                              Esta avaliação não possui respostas não conformes, portanto não há necessidade de planos de ação.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-8 text-gray-500">
                              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Parabéns! Avaliação 100% Conforme
                              </h3>
                              <p>
                                Todas as questões desta avaliação foram respondidas como conformes.
                                Não há necessidade de criar planos de ação.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione os filtros acima
                </h3>
                <p className="mb-4">
                  Use os filtros de seleção acima para escolher o tipo, local e avaliação
                  para visualizar os planos de ação.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>📍 <strong>Passo 1:</strong> Selecione Tipo (Obra/Alojamento)</p>
                  <p>🏢 <strong>Passo 2:</strong> Escolha a Obra/Alojamento</p>
                  <p>📋 <strong>Passo 3:</strong> Selecione uma Avaliação</p>
                  <p>✅ <strong>Passo 4:</strong> Visualize e crie os planos de ação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}