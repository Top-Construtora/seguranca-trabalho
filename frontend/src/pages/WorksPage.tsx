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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Obras</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as obras cadastradas no sistema
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Nova Obra</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar obras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm sm:text-base"
            />
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
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingWork ? 'Editar Obra' : 'Nova Obra'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
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