import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AccidentForm } from '@/components/accidents/AccidentForm';
import {
  useAccident,
  useCreateAccident,
  useUpdateAccident,
} from '@/hooks/useAccidents';
import { CreateAccidentDto } from '@/types/accident.types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccidentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: accident, isLoading } = useAccident(id || '');
  const createAccident = useCreateAccident();
  const updateAccident = useUpdateAccident();

  const handleSubmit = async (data: CreateAccidentDto) => {
    if (isEditing && id) {
      await updateAccident.mutateAsync({ id, data });
      navigate(`/accidents/${id}`);
    } else {
      const created = await createAccident.mutateAsync(data);
      navigate(`/accidents/${created.id}`);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      navigate(`/accidents/${id}`);
    } else {
      navigate('/accidents');
    }
  };

  if (isEditing && isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
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
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">
                  {isEditing ? 'Editar Acidente' : 'Registrar Novo Acidente'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {isEditing
                    ? 'Atualize as informações do acidente'
                    : 'Preencha os dados do acidente ocorrido'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <AccidentForm
            accident={accident}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createAccident.isPending || updateAccident.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
