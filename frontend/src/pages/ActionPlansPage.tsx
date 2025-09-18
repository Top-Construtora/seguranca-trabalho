import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActionPlansByEvaluation, useCreateActionPlan, useDeleteActionPlan } from '@/hooks/useActionPlans';
import { useWorks } from '@/hooks/useWorks';
import { useAccommodations } from '@/hooks/useAccommodations';
import { useEvaluations, useEvaluation } from '@/hooks/useEvaluations';
import { actionPlanFilesService } from '@/services/actionPlanFiles.service';
import { ClipboardList, CheckCircle, Building2, Home, MapPin, Save, AlertCircle, Upload, File, X, Trash2, Eye, FileText, Image, Target, Filter, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ImageModal } from '@/components/ui/image-modal';

export function ActionPlansPage() {
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
  const [workType, setWorkType] = useState<'obra' | 'alojamento'>('obra');
  const [actionPlanTexts, setActionPlanTexts] = useState<Record<string, string>>({});
  const [attachmentFiles, setAttachmentFiles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Fetch data
  const { data: works, isLoading: isLoadingWorks } = useWorks();
  const { data: accommodations, isLoading: isLoadingAccommodations } = useAccommodations();
  const { data: evaluations, isLoading: isLoadingEvaluations } = useEvaluations();
  const { data: selectedEvaluationData, isLoading: isLoadingSelectedEvaluation } = useEvaluation(selectedEvaluationId);
  const { data: actionPlans = [], refetch: refetchActionPlans } = useActionPlansByEvaluation(selectedEvaluationId);
  const createActionPlan = useCreateActionPlan();
  const deleteActionPlan = useDeleteActionPlan();

  // Filter works/accommodations
  const activeWorks = works?.filter(work => work.is_active) || [];

  // For accommodations, create a flat list with work association
  const flatAccommodations = accommodations?.flatMap((acc: any) => {
    // Each accommodation can be associated with multiple works
    if (!acc.works || acc.works.length === 0) return [];

    // Create an entry for each work-accommodation combination
    return acc.works.filter((work: any) => work.is_active).map((work: any) => ({
      ...acc,
      work_id: work.id,
      work_name: work.name,
      address: work.address,
      is_active: work.is_active,
      // Create a unique ID for this combination
      unique_id: `${acc.id}_${work.id}`
    }));
  }) || [];

  // Get items based on selected type
  const availableItems = workType === 'obra' ? activeWorks : flatAccommodations;

  // Filter evaluations by selected work or accommodation
  const workEvaluations = evaluations?.filter(evaluation => {
    if (workType === 'obra') {
      return evaluation.work_id === selectedWorkId;
    } else {
      // For accommodations, extract the work_id from the unique_id
      if (!selectedWorkId || !selectedWorkId.includes('_')) return false;

      const [, workId] = selectedWorkId.split('_');

      // Check if evaluation is for this work and is of type alojamento
      return evaluation.work_id === workId && evaluation.type === 'alojamento';
    }
  }) || [];


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
      // Only initialize if we don't have any existing texts (avoid overwriting user input)
      setActionPlanTexts(prev => {
        const newTexts = { ...prev };
        nonConformAnswers.forEach(answer => {
          if (!(answer.id in newTexts)) {
            newTexts[answer.id] = '';
          }
        });
        return newTexts;
      });
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
      const uploadedFiles = await actionPlanFilesService.uploadFiles(files);
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

  // Helper functions for file handling
  const isImageFile = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  };

  const getFileIcon = (url: string) => {
    if (isImageFile(url)) return Image;
    if (url.toLowerCase().includes('.pdf')) return FileText;
    return File;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'arquivo';
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleViewFile = (fileUrl: string) => {
    if (isImageFile(fileUrl)) {
      handleViewImage(fileUrl);
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  // Delete action plan
  const handleDeleteActionPlan = async (planId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de ação?')) {
      try {
        await deleteActionPlan.mutateAsync(planId);
        toast.success('Plano de ação excluído com sucesso!');
        refetchActionPlans();
      } catch (error) {
        console.error('Error deleting action plan:', error);
        toast.error('Erro ao excluir plano de ação');
      }
    }
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
        attachment_urls: attachmentFiles[answerId] || []
      });
      toast.success('Plano de ação salvo com sucesso!');

      // Clear the form for this specific answer
      setActionPlanTexts(prev => ({ ...prev, [answerId]: '' }));
      setAttachmentFiles(prev => ({ ...prev, [answerId]: [] }));

      // Refetch action plans to show the newly created one
      refetchActionPlans();
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
        {/* Header com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">
              Planos de Ação
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Crie e gerencie planos de ação para corrigir não conformidades das avaliações
            </p>
          </div>
        </div>

        {/* Filtros de seleção melhorados */}
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filtros de Seleção</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Selecione o tipo, local e avaliação para visualizar os planos de ação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Work Type Selection */}
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo</Label>
                <Select value={workType} onValueChange={handleWorkTypeChange}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:border-[#12b0a0] transition-colors">
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
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {workType === 'obra' ? 'Obra' : 'Alojamento'}
                </Label>
                <Select value={selectedWorkId} onValueChange={handleWorkSelection}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:border-[#12b0a0] transition-colors">
                    <SelectValue placeholder={`Selecione ${workType === 'obra' ? 'uma obra' : 'um alojamento'}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(isLoadingWorks || isLoadingAccommodations) ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : availableItems.length > 0 ? (
                      availableItems.map((item) => {
                        // If it's an accommodation, use the combined display name
                        let displayName = item.name;
                        let displayAddress = (item as any).address || '';
                        let keyValue = item.id;

                        if (workType === 'alojamento') {
                          const accommodation = item as any;
                          displayName = `${accommodation.work_name} - ${accommodation.name}`;
                          displayAddress = accommodation.address || '';
                          keyValue = accommodation.unique_id;
                        }

                        return (
                          <SelectItem key={keyValue} value={keyValue}>
                            <div className="flex flex-col">
                              <span className="font-medium">{displayName}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {displayAddress}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })
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
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avaliação</Label>
                <Select value={selectedEvaluationId} onValueChange={setSelectedEvaluationId} disabled={!selectedWorkId}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 hover:border-[#12b0a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Selecione uma avaliação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEvaluations ? (
                      <SelectItem value="loading-eval" disabled>Carregando avaliações...</SelectItem>
                    ) : workEvaluations.length > 0 ? (
                      workEvaluations.map((evaluation) => (
                        <SelectItem key={evaluation.id} value={evaluation.id}>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">
                              {format(new Date(evaluation.created_at), 'dd/MM/yyyy')}
                            </span>
                            <Badge
                              className={`text-xs ${
                                evaluation.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              {evaluation.status === 'completed' ? 'Concluída' : 'Em andamento'}
                            </Badge>
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
                          <Card className="bg-gradient-to-r from-orange-50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                                <AlertTriangle className="h-5 w-5" />
                                Questões Não Conformes - Planos de Ação
                              </CardTitle>
                              <CardDescription className="text-orange-700 dark:text-orange-400">
                                Para cada questão abaixo, escreva o plano de ação para corrigir a não conformidade
                              </CardDescription>
                            </CardHeader>
                          </Card>

                          {nonConformAnswers.map((answer, index) => (
                            <Card key={answer.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                              <CardHeader className="pb-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                      Questão {index + 1}
                                    </CardTitle>
                                    <CardDescription className="text-base text-gray-600 dark:text-gray-400 mt-1">
                                      {answer.question?.text || 'Questão não encontrada'}
                                    </CardDescription>
                                  </div>
                                </div>
                                {answer.observation && (
                                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
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
                                      disabled={false}
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
                                          <div className="flex flex-wrap gap-2">
                                            {attachmentFiles[answer.id].map((fileUrl, fileIndex) => {
                                              const IconComponent = getFileIcon(fileUrl);
                                              const fileName = getFileName(fileUrl);
                                              const isImage = isImageFile(fileUrl);

                                              return (
                                                <div key={fileIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                                                  <IconComponent className="h-4 w-4 text-blue-600" />
                                                  <span className="text-sm truncate max-w-[150px]">
                                                    {fileName}
                                                  </span>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewFile(fileUrl)}
                                                    className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                                                    title={isImage ? 'Visualizar imagem' : 'Abrir arquivo'}
                                                  >
                                                    <Eye className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveAttachment(answer.id, fileUrl)}
                                                    className="text-red-600 hover:text-red-700 p-1 h-auto"
                                                    title="Remover arquivo"
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      onClick={() => handleSaveActionPlan(answer.id, actionPlanTexts[answer.id] || '')}
                                      disabled={isLoading || !actionPlanTexts[answer.id]?.trim()}
                                      className="flex items-center gap-2 bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                                    >
                                      <Save className="h-4 w-4" />
                                      {isLoading ? 'Salvando...' : 'Salvar Plano'}
                                    </Button>
                                  </div>

                                </div>

                                {/* Display saved action plans for this answer */}
                                {actionPlans && actionPlans.filter(plan => plan.answer_id === answer.id).length > 0 && (
                                  <div className="mt-6 space-y-3">
                                    <Label className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      Planos de Ação Salvos:
                                    </Label>
                                    {actionPlans
                                      .filter(plan => plan.answer_id === answer.id)
                                      .map((plan) => (
                                        <div key={plan.id} className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg relative">
                                          <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <p className="text-sm font-medium text-gray-900 flex-1">{plan.action_description}</p>
                                              <Button
                                                onClick={() => handleDeleteActionPlan(plan.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                                title="Excluir plano de ação"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            {plan.target_date && (
                                              <p className="text-xs text-gray-600">
                                                Prazo: {format(new Date(plan.target_date), 'dd/MM/yyyy', { locale: ptBR })}
                                              </p>
                                            )}
                                            {plan.attachment_urls && plan.attachment_urls.length > 0 && (
                                              <div className="space-y-2">
                                                <p className="text-xs text-gray-600 font-medium">Arquivos anexados:</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {plan.attachment_urls.map((url, idx) => {
                                                    const IconComponent = getFileIcon(url);
                                                    const fileName = getFileName(url);
                                                    const isImage = isImageFile(url);

                                                    return (
                                                      <button
                                                        key={idx}
                                                        onClick={() => handleViewFile(url)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors text-xs"
                                                        title={isImage ? 'Clique para visualizar' : 'Clique para baixar'}
                                                      >
                                                        <IconComponent className="h-3 w-3 text-gray-500" />
                                                        <span className="max-w-[100px] truncate">{fileName}</span>
                                                        <Eye className="h-3 w-3 text-gray-400" />
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                            <p className="text-xs text-gray-500">
                                              Criado em: {format(new Date(plan.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}

                          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-blue-800 dark:text-blue-300">
                                    {nonConformAnswers.length} questão(ões) não conforme(s) encontrada(s)
                                  </p>
                                  <p className="text-sm text-blue-700 dark:text-blue-400">
                                    Certifique-se de criar planos de ação para todas as questões listadas
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                              <CheckCircle className="h-5 w-5" />
                              Avaliação 100% Conforme
                            </CardTitle>
                            <CardDescription className="text-green-700 dark:text-green-400">
                              Esta avaliação não possui respostas não conformes
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-12">
                              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full inline-block mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                Parabéns! Avaliação 100% Conforme
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                Todas as questões desta avaliação foram respondidas como conformes.
                                Não há necessidade de criar planos de ação.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
          </div>
        ) : (
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full inline-block mb-6">
                  <Target className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Selecione os filtros acima
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Use os filtros de seleção acima para escolher o tipo, local e avaliação
                  para visualizar os planos de ação.
                </p>
                <div className="inline-flex flex-col gap-3 text-left bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#12b0a0]/10 rounded-full text-[#12b0a0] font-semibold text-sm">1</div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selecione o <strong>Tipo</strong> (Obra/Alojamento)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#12b0a0]/10 rounded-full text-[#12b0a0] font-semibold text-sm">2</div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Escolha a <strong>Obra/Alojamento</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#12b0a0]/10 rounded-full text-[#12b0a0] font-semibold text-sm">3</div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selecione uma <strong>Avaliação</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#12b0a0]/10 rounded-full text-[#12b0a0] font-semibold text-sm">4</div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Visualize e crie os <strong>Planos de Ação</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
          imageUrl={selectedImage}
          title="Visualizar Anexo"
        />
      )}
    </DashboardLayout>
  );
}