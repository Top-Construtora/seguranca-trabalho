import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAccident,
  useUpdateAccident,
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
} from '@/types/accident.types';
import { formatDate } from '@/utils/date';
import { useAuth } from '@/contexts/AuthContext';
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
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react';

export function AccidentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');

  const { data: accident, isLoading } = useAccident(id || '');
  const updateAccident = useUpdateAccident();

  const isAdmin = user?.role === 'admin';

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
            <TabsTrigger value="investigations">
              <FileSearch className="h-4 w-4 mr-2" />
              Investigações ({accident.investigations?.length || 0})
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
                  className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <div>
                {accident.evidences && accident.evidences.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {accident.evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2"
                      >
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          {evidence.file_type === 'image' ? (
                            <img
                              src={evidence.file_url}
                              alt={evidence.file_name}
                              className="object-cover rounded"
                            />
                          ) : (
                            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{evidence.file_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Por {evidence.uploaded_by?.name || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400 dark:text-gray-500">
                    Nenhuma evidência registrada
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Investigations Tab */}
          <TabsContent value="investigations">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Investigações</h3>
                {isAdmin && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Investigação
                  </Button>
                )}
              </div>
              <div>
                {accident.investigations && accident.investigations.length > 0 ? (
                  <div className="space-y-4">
                    {accident.investigations.map((inv) => (
                      <div key={inv.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              Investigação - {formatDate(inv.investigation_date)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Por {inv.investigator?.name || 'N/A'}
                            </p>
                          </div>
                          {inv.method_used && (
                            <span className="text-xs bg-[#1e6076]/10 dark:bg-[#12b0a0]/20 text-[#1e6076] dark:text-[#12b0a0] px-2 py-1 rounded">
                              {inv.method_used}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Causa Raiz:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{inv.root_cause}</p>
                        </div>
                        {inv.recommendations && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recomendações:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{inv.recommendations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400 dark:text-gray-500">
                    Nenhuma investigação registrada
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Corrective Actions Tab */}
          <TabsContent value="actions">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Ações Corretivas</h3>
                <Button
                  size="sm"
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
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-100">{action.action_description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Responsável: {action.responsible?.name || 'N/A'}
                            </p>
                          </div>
                          <CorrectiveActionStatusBadge status={action.status} />
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Prazo: </span>
                            <span className="text-gray-700 dark:text-gray-300">{formatDate(action.target_date)}</span>
                          </div>
                          {action.completion_date && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Concluído: </span>
                              <span className="text-gray-700 dark:text-gray-300">{formatDate(action.completion_date)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Prioridade: </span>
                            <span className="text-gray-700 dark:text-gray-300">{action.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-400 dark:text-gray-500">
                    Nenhuma ação corretiva registrada
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
