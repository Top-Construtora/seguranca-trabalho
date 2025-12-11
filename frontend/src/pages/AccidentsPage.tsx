import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import { AccidentFilters } from '@/components/accidents/AccidentFilters';
import { AccidentsList } from '@/components/accidents/AccidentsList';
import { AccidentCard } from '@/components/accidents/AccidentCard';
import {
  useAccidents,
  useDeleteAccident,
} from '@/hooks/useAccidents';
import { AccidentFilters as IAccidentFilters, Accident } from '@/types/accident.types';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export function AccidentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<IAccidentFilters>({
    page: 1,
    limit: 10,
  });
  const [deleteTarget, setDeleteTarget] = useState<Accident | null>(null);

  const { data, isLoading } = useAccidents(filters);
  const deleteAccident = useDeleteAccident();

  const isAdmin = user?.role === 'admin';
  const allAccidents = data?.data || [];
  const accidents = allAccidents.filter(accident => {
    const search = searchTerm.toLowerCase();
    return (
      accident.title.toLowerCase().includes(search) ||
      accident.description?.toLowerCase().includes(search) ||
      accident.work?.name?.toLowerCase().includes(search)
    );
  });
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const handleView = (accident: Accident) => {
    navigate(`/accidents/${accident.id}`);
  };

  const handleEdit = (accident: Accident) => {
    navigate(`/accidents/${accident.id}/edit`);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteAccident.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Gestão de Acidentes
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Registre, investigue e acompanhe acidentes de trabalho
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#12b0a0]/10 border-[#12b0a0]' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#12b0a0]/10 border-[#12b0a0]' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/accidents/new')}
                className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Acidente
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título, descrição ou obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0] transition-all"
              />
            </div>
            <div className="text-sm text-gray-500">
              {accidents.length} {accidents.length === 1 ? 'acidente encontrado' : 'acidentes encontrados'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <AccidentFilters filters={filters} onFiltersChange={setFilters} />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <AccidentsList
            accidents={accidents}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            canDelete={isAdmin}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accidents.map((accident) => (
              <AccidentCard
                key={accident.id}
                accident={accident}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                canDelete={isAdmin}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, filters.page! - 1))}
                  className={filters.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const current = filters.page || 1;
                  return page === 1 || page === totalPages || Math.abs(page - current) <= 1;
                })
                .map((page, idx, arr) => (
                  <PaginationItem key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === filters.page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, filters.page! + 1))}
                  className={filters.page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Summary */}
        {data && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {accidents.length} de {data.total} acidentes
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir acidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O acidente "{deleteTarget?.title}" e todos
              os dados relacionados serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
