import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import documentsService from '@/services/documents.service';
import { worksService, Work } from '@/services/works.service';
import { ArrowLeft } from 'lucide-react';
import type { UpdateDocumentDTO } from '@/types/document';
import { format } from 'date-fns';

const formSchema = z.object({
  workId: z.string().min(1, 'Obra é obrigatória'),
  name: z.string().min(1, 'Nome é obrigatório'),
  issueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  expiryDate: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditDocument() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState(true);
  const [works, setWorks] = useState<Work[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workId: '',
      name: '',
      issueDate: '',
      expiryDate: '',
    },
  });

  useEffect(() => {
    loadWorks();
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadWorks = async () => {
    try {
      const data = await worksService.getAll();
      setWorks(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar obras',
        variant: 'destructive',
      });
    }
  };

  const loadDocument = async () => {
    try {
      setLoadingDocument(true);
      const data = await documentsService.getById(id!);

      // Format dates for input fields
      const issueDate = data.issueDate ? format(new Date(data.issueDate), 'yyyy-MM-dd') : '';
      const expiryDate = data.expiryDate ? format(new Date(data.expiryDate), 'yyyy-MM-dd') : '';

      form.reset({
        workId: data.workId,
        name: data.name,
        issueDate,
        expiryDate: expiryDate || '',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documento',
        variant: 'destructive',
      });
      navigate('/documents');
    } finally {
      setLoadingDocument(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    setLoading(true);
    try {
      const updateData: UpdateDocumentDTO = {
        workId: data.workId,
        name: data.name,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || undefined,
      };

      await documentsService.update(id, updateData);

      toast({
        title: 'Sucesso',
        description: 'Documento atualizado com sucesso!',
      });

      navigate('/documents');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar documento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingDocument) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/documents')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Documento</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="workId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {works.map((work) => (
                            <SelectItem key={work.id} value={work.id}>
                              {work.name} - {work.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do documento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/documents')}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}