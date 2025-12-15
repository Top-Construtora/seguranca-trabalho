import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useProfileStats } from '@/hooks/useUsers';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ClipboardList,
  HardHat,
  Home,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export function ProfilePage() {
  const { data: profile, isLoading } = useProfileStats();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Meu Perfil
          </h1>
          <Button
            onClick={() => setIsChangePasswordOpen(true)}
            variant="outline"
            className="border-[#1e6076] text-[#1e6076] hover:bg-[#1e6076]/10 dark:border-[#12b0a0] dark:text-[#12b0a0] dark:hover:bg-[#12b0a0]/10"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Alterar Senha
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Informações do Usuário */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1e6076] to-[#12b0a0] rounded-full flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                {profile?.user.name}
              </h2>
              <Badge
                variant="secondary"
                className={
                  profile?.user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }
              >
                <Shield className="h-3 w-3 mr-1" />
                {profile?.user.role === 'admin' ? 'Administrador' : 'Avaliador'}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  {profile?.user.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  Membro desde {profile?.user.created_at && formatDate(profile.user.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Card de Estatísticas */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Minhas Estatísticas
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total de Avaliações */}
              <div className="bg-gradient-to-br from-[#1e6076]/10 to-[#12b0a0]/10 dark:from-[#1e6076]/20 dark:to-[#12b0a0]/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <ClipboardList className="h-5 w-5 text-[#1e6076] dark:text-[#12b0a0]" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {profile?.evaluations.total || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avaliações Totais
                </p>
              </div>

              {/* Avaliações Concluídas */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {profile?.evaluations.completed || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Concluídas
                </p>
              </div>

              {/* Avaliações de Obra */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <HardHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {profile?.evaluations.byType.obra || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avaliações de Obra
                </p>
              </div>

              {/* Avaliações de Alojamento */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {profile?.evaluations.byType.alojamento || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avaliações de Alojamento
                </p>
              </div>
            </div>

            {/* Linha adicional de estatísticas */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Rascunhos */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileEdit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {profile?.evaluations.draft || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rascunhos pendentes
                    </p>
                  </div>
                </div>
              </div>

              {/* Acidentes Registrados */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {profile?.accidents.total || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Acidentes registrados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Últimas Avaliações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Últimas Avaliações
          </h3>

          {profile?.recentEvaluations && profile.recentEvaluations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Penalidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.recentEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {evaluation.type === 'obra' ? (
                            <HardHat className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Home className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="capitalize">{evaluation.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {evaluation.type === 'alojamento' && evaluation.accommodation_name
                              ? evaluation.accommodation_name
                              : evaluation.work_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {evaluation.work_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(evaluation.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            evaluation.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }
                        >
                          {evaluation.status === 'completed' ? 'Concluída' : 'Rascunho'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {evaluation.status === 'completed' && evaluation.total_penalty !== null ? (
                          <span className="font-medium">
                            R$ {Number(evaluation.total_penalty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/evaluations/${evaluation.type}/${evaluation.id}/edit`}
                          className="inline-flex items-center text-[#1e6076] dark:text-[#12b0a0] hover:underline text-sm"
                        >
                          Ver
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400 dark:text-gray-500">
                Você ainda não realizou nenhuma avaliação
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <Link to="/evaluations/obra">
                  <Button variant="outline" size="sm">
                    <HardHat className="h-4 w-4 mr-2" />
                    Avaliar Obra
                  </Button>
                </Link>
                <Link to="/evaluations/alojamento">
                  <Button variant="outline" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Avaliar Alojamento
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </DashboardLayout>
  );
}
