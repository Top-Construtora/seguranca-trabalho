import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Upload, FileText, Calendar, Building2, X } from 'lucide-react';
import { CreateDocumentDTO } from '@/types/document';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const formSchema = z.object({
  workId: z.string().min(1, 'Obra é obrigatória'),
  name: z.string().min(1, 'Nome é obrigatório'),
  issueDate: z.string().min(1, 'Data de emissão é obrigatória'),
  expiryDate: z.string().optional(),
  file: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      'Arquivo muito grande (máximo 10MB)'
    )
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      'Formato de arquivo não suportado'
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateDocument() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
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
  }, []);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      setSelectedFileName(file.name);
    }
  };

  const removeFile = () => {
    form.setValue('file', undefined);
    setSelectedFileName('');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const documentData: CreateDocumentDTO = {
        workId: data.workId,
        name: data.name,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || undefined,
        file: data.file,
      };

      await documentsService.create(documentData);

      toast({
        title: 'Sucesso',
        description: 'Documento cadastrado com sucesso!',
      });

      navigate('/documents');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao cadastrar documento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/documents')}
              className="hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Cadastrar Documento
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Adicione um novo documento ao sistema
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-[#1e6076]/5 to-[#12b0a0]/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#12b0a0]" />
              Informações do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="workId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#12b0a0]" />
                        Obra
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="hover:border-[#12b0a0]/50 focus:border-[#12b0a0] transition-colors">
                            <SelectValue placeholder="Selecione uma obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {works.map((work) => (
                            <SelectItem key={work.id} value={work.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{work.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Código: {work.number}
                                </span>
                              </div>
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
                        <Input
                          placeholder="Ex: Alvará de Construção, ART, Licença Ambiental"
                          className="hover:border-[#12b0a0]/50 focus:border-[#12b0a0] transition-colors"
                          {...field}
                        />
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
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#12b0a0]" />
                          Data de Emissão
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="hover:border-[#12b0a0]/50 focus:border-[#12b0a0] transition-colors"
                            {...field}
                          />
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
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Data de Vencimento
                          <span className="text-xs text-muted-foreground">(Opcional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="hover:border-[#12b0a0]/50 focus:border-[#12b0a0] transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Anexo do Documento <span className="text-xs text-muted-foreground">(Opcional)</span></FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          {!selectedFileName ? (
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-[#12b0a0]/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                {...field}
                              />
                              <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center gap-3 cursor-pointer"
                              >
                                <div className="p-3 bg-[#12b0a0]/10 rounded-full">
                                  <Upload className="h-6 w-6 text-[#12b0a0]" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium">
                                    Clique para selecionar um arquivo
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ou arraste e solte aqui
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  PDF, Word, Excel, JPG ou PNG (máximo 10MB)
                                </p>
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-[#12b0a0]/5 border border-[#12b0a0]/20 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#12b0a0]/10 rounded">
                                  <FileText className="h-5 w-5 text-[#12b0a0]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{selectedFileName}</p>
                                  {form.watch('file') && (
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(form.watch('file')!.size)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeFile}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md"
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar Documento'}
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