import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAccident,
  useUpdateAccident,
  useRemoveEvidence,
  useDeleteCorrectiveAction,
  useUpdateCorrectiveAction,
} from '@/hooks/useAccidents';
import {
  SeverityBadge,
  AccidentStatusBadge,
  CorrectiveActionStatusBadge,
} from '@/components/accidents/AccidentStatusBadge';
import {
  TYPE_LABELS,
  BODY_PART_LABELS,
  AccidentStatus,
  EvidenceFileType,
  AccidentCorrectiveAction,
  CorrectiveActionStatus,
  CORRECTIVE_ACTION_STATUS_LABELS,
} from '@/types/accident.types';
import { formatDate } from '@/utils/date';
import { useAuth } from '@/contexts/AuthContext';
import { EvidenceUploadModal } from '@/components/accidents/EvidenceUploadModal';
import { CorrectiveActionModal } from '@/components/accidents/CorrectiveActionModal';
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Building2,
  User,
  Clock,
  MapPin,
  FileText,
  Image,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Video,
  Trash2,
  ExternalLink,
  File,
  MoreVertical,
  Edit2,
  PlayCircle,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AccidentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AccidentCorrectiveAction | null>(null);

  const { data: accident, isLoading } = useAccident(id || '');
  const updateAccident = useUpdateAccident();
  const removeEvidence = useRemoveEvidence();
  const deleteCorrectiveAction = useDeleteCorrectiveAction();
  const updateCorrectiveAction = useUpdateCorrectiveAction();

  const isAdmin = user?.role === 'admin';

  const handleEditAction = (action: AccidentCorrectiveAction) => {
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  const handleNewAction = () => {
    setSelectedAction(null);
    setIsActionModalOpen(true);
  };

  const handleDeleteAction = async (actionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação corretiva?')) {
      await deleteCorrectiveAction.mutateAsync(actionId);
    }
  };

  const handleQuickStatusChange = async (actionId: string, newStatus: CorrectiveActionStatus) => {
    await updateCorrectiveAction.mutateAsync({
      id: actionId,
      data: {
        status: newStatus,
        ...(newStatus === CorrectiveActionStatus.CONCLUIDA && {
          completion_date: new Date().toISOString().split('T')[0],
        }),
      },
    });
  };

  const getPriorityLabel = (priority: number) => {
    const labels: Record<number, string> = {
      1: 'Muito Alta',
      2: 'Alta',
      3: 'Média',
      4: 'Baixa',
      5: 'Muito Baixa',
    };
    return labels[priority] || 'Média';
  };

  const getPriorityColor = (priority: number) => {
    const colors: Record<number, string> = {
      1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      3: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      4: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      5: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[priority] || colors[3];
  };

  const isOverdue = (targetDate: string, status: CorrectiveActionStatus) => {
    if (status === CorrectiveActionStatus.CONCLUIDA || status === CorrectiveActionStatus.CANCELADA) {
      return false;
    }
    return new Date(targetDate) < new Date();
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    if (!id) return;
    if (window.confirm('Tem certeza que deseja remover esta evidência?')) {
      await removeEvidence.mutateAsync({ accidentId: id, evidenceId });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!accident) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Acidente não encontrado</h2>
          <Button onClick={() => navigate('/accidents')}>Voltar para lista</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleStatusChange = async (status: AccidentStatus) => {
    await updateAccident.mutateAsync({
      id: accident.id,
      data: { status },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/accidents')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-[#1e6076] dark:text-[#12b0a0]" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">
                      {accident.title}
                    </h1>
                    <SeverityBadge severity={accident.severity} />
                    <AccidentStatusBadge status={accident.status} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Registrado em {formatDate(accident.created_at)} por{' '}
                    {accident.reported_by?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && accident.status !== AccidentStatus.ARQUIVADO && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(AccidentStatus.ARQUIVADO)}
                  className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
                >
                  Arquivar
                </Button>
              )}
              <Button
                onClick={() => navigate(`/accidents/${accident.id}/edit`)}
                className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="evidences">
              <Image className="h-4 w-4 mr-2" />
              Evidências ({accident.evidences?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="actions">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ações Corretivas ({accident.corrective_actions?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Acidente */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Informações do Acidente</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Data do Acidente</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                        {formatDate(accident.accident_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Obra</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                        {accident.work?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {TYPE_LABELS[accident.accident_type]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dias de Afastamento</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                        {accident.days_away} dias
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Descrição</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{accident.description}</p>
                  </div>

                  {accident.location_details && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1 text-[#1e6076] dark:text-[#12b0a0]" />
                        Local do Acidente
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{accident.location_details}</p>
                    </div>
                  )}

                  {accident.immediate_actions && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ações Imediatas</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{accident.immediate_actions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados da Vítima */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Dados da Vítima</h3>
                <div className="space-y-4">
                  {accident.victim_name ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                        <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          <User className="h-4 w-4 text-[#1e6076] dark:text-[#12b0a0]" />
                          {accident.victim_name}
                        </p>
                      </div>
                      {accident.victim_role && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Função/Cargo</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{accident.victim_role}</p>
                        </div>
                      )}
                      {accident.victim_company && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{accident.victim_company}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500">
                      Nenhuma informação da vítima registrada
                    </p>
                  )}
                </div>
              </div>

              {/* Partes do Corpo Afetadas */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Partes do Corpo Afetadas</h3>
                <div>
                  {accident.body_parts && accident.body_parts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {accident.body_parts.map((bp) => (
                        <div
                          key={bp.id}
                          className="bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 border border-[#1e6076]/20 dark:border-[#12b0a0]/30 rounded-lg px-3 py-2"
                        >
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-100">
                            {BODY_PART_LABELS[bp.body_part]}
                          </p>
                          {bp.injury_description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {bp.injury_description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500">
                      Nenhuma parte do corpo registrada
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Evidences Tab */}
          <TabsContent value="evidences">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Evidências</h3>
                <Button
                  size="sm"
                  onClick={() => setIsEvidenceModalOpen(true)}
                  className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <div>
                {accident.evidences && accident.evidences.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {accident.evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 group relative"
                      >
                        {/* Preview */}
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                          {evidence.file_type === EvidenceFileType.IMAGE && evidence.file_url ? (
                            <img
                              src={evidence.file_url}
                              alt={evidence.file_name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : evidence.file_type === EvidenceFileType.VIDEO && evidence.file_url ? (
                            <video
                              src={evidence.file_url}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : evidence.file_type === EvidenceFileType.VIDEO ? (
                            <Video className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          ) : evidence.file_type === EvidenceFileType.PDF ? (
                            <File className="h-12 w-12 text-red-500" />
                          ) : (
                            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-4 left-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            evidence.file_type === EvidenceFileType.IMAGE
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : evidence.file_type === EvidenceFileType.VIDEO
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : evidence.file_type === EvidenceFileType.PDF
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {evidence.file_type === EvidenceFileType.IMAGE ? 'Imagem' :
                             evidence.file_type === EvidenceFileType.VIDEO ? 'Vídeo' :
                             evidence.file_type === EvidenceFileType.PDF ? 'PDF' : 'Texto'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {evidence.file_url && (
                            <a
                              href={evidence.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </a>
                          )}
                          <button
                            onClick={() => handleRemoveEvidence(evidence.id)}
                            className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>

                        {/* Info */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={evidence.file_name}>
                          {evidence.file_name}
                        </p>
                        {evidence.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {evidence.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Por {evidence.uploaded_by?.name || 'N/A'} • {formatDate(evidence.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-400 dark:text-gray-500 mb-4">
                      Nenhuma evidência registrada
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsEvidenceModalOpen(true)}
                      className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar primeira evidência
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Corrective Actions Tab */}
          <TabsContent value="actions">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ações Corretivas</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gerencie as ações corretivas para este acidente
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleNewAction}
                  className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ação
                </Button>
              </div>
              <div>
                {accident.corrective_actions &&
                accident.corrective_actions.length > 0 ? (
                  <div className="space-y-4">
                    {accident.corrective_actions.map((action) => (
                      <div
                        key={action.id}
                        className={`border rounded-lg p-4 space-y-3 transition-colors ${
                          isOverdue(action.target_date, action.status)
                            ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <p className="font-medium text-gray-800 dark:text-gray-100 flex-1">
                                {action.action_description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CorrectiveActionStatusBadge status={action.status} />
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(action.priority)}`}>
                                {getPriorityLabel(action.priority)}
                              </span>
                              {isOverdue(action.target_date, action.status) && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  Atrasada
                                </span>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditAction(action)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {action.status !== CorrectiveActionStatus.EM_ANDAMENTO && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickStatusChange(action.id, CorrectiveActionStatus.EM_ANDAMENTO)}
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Marcar Em Andamento
                                </DropdownMenuItem>
                              )}
                              {action.status !== CorrectiveActionStatus.CONCLUIDA && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickStatusChange(action.id, CorrectiveActionStatus.CONCLUIDA)}
                                >
                                  <CheckCheck className="h-4 w-4 mr-2" />
                                  Marcar Concluída
                                </DropdownMenuItem>
                              )}
                              {action.status !== CorrectiveActionStatus.CANCELADA && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickStatusChange(action.id, CorrectiveActionStatus.CANCELADA)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAction(action.id)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Responsável</span>
                            <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {action.responsible?.name || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Prazo</span>
                            <span className={`flex items-center gap-1 ${
                              isOverdue(action.target_date, action.status)
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {formatDate(action.target_date)}
                            </span>
                          </div>
                          {action.completion_date && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Concluído em</span>
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {formatDate(action.completion_date)}
                              </span>
                            </div>
                          )}
                          {action.verification_method && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Verificação</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                {action.verification_method}
                              </span>
                            </div>
                          )}
                        </div>

                        {(action.notes || action.verification_result) && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                            {action.notes && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">Observações:</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{action.notes}</p>
                              </div>
                            )}
                            {action.verification_result && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">Resultado da Verificação:</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{action.verification_result}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-400 dark:text-gray-500 mb-4">
                      Nenhuma ação corretiva registrada
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleNewAction}
                      className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar primeira ação corretiva
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Evidence Upload Modal */}
        <EvidenceUploadModal
          open={isEvidenceModalOpen}
          onOpenChange={setIsEvidenceModalOpen}
          accidentId={id || ''}
        />

        {/* Corrective Action Modal */}
        <CorrectiveActionModal
          open={isActionModalOpen}
          onOpenChange={setIsActionModalOpen}
          accidentId={id || ''}
          action={selectedAction}
        />
      </div>
    </DashboardLayout>
  );
}
