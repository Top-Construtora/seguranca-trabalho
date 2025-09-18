import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WorksList } from '@/components/works/WorksList';
import { WorkForm } from '@/components/works/WorkForm';
import { 
  useWorks, 
  useCreateWork, 
  useUpdateWork, 
  useToggleWorkActive,
  useDeleteWork 
} from '@/hooks/useWorks';
import { Work } from '@/services/works.service';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function WorksPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: works = [], isLoading } = useWorks();
  const createWork = useCreateWork();
  const updateWork = useUpdateWork();
  const toggleActive = useToggleWorkActive();
  const deleteWork = useDeleteWork();

  const isAdmin = user?.role === 'admin';

  const filteredWorks = works.filter(work => {
    const search = searchTerm.toLowerCase();
    return (
      work.name.toLowerCase().includes(search) ||
      work.number.toLowerCase().includes(search) ||
      work.responsible.toLowerCase().includes(search) ||
      work.address?.toLowerCase().includes(search)
    );
  });

  const handleCreate = async (data: any) => {
    await createWork.mutateAsync(data);
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingWork) {
      await updateWork.mutateAsync({ id: editingWork.id, data });
      setEditingWork(null);
      setIsFormOpen(false);
    }
  };

  const handleEdit = (work: Work) => {
    setEditingWork(work);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWork(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Gerenciamento de Obras
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Cadastre e gerencie as obras para realizar avaliações de segurança
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">Nova Obra</span>
              </Button>
            )}
          </div>
        </div>

        {/* Barra de pesquisa melhorada */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, nome, endereço ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0] transition-all"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredWorks.length} {filteredWorks.length === 1 ? 'obra encontrada' : 'obras encontradas'}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <WorksList
            works={filteredWorks}
            onEdit={handleEdit}
            onToggleActive={(id) => toggleActive.mutate(id)}
            onDelete={(id) => deleteWork.mutate(id)}
          />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">
              {editingWork ? 'Editar Obra' : 'Nova Obra'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {editingWork
                ? 'Atualize os dados da obra abaixo'
                : 'Preencha os dados da nova obra'}
            </DialogDescription>
          </DialogHeader>
          <WorkForm
            work={editingWork || undefined}
            onSubmit={editingWork ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            isLoading={createWork.isPending || updateWork.isPending}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}