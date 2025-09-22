import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import documentsService from '@/services/documents.service';
import { worksService, Work } from '@/services/works.service';
import { Document } from '@/types/document';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Download,
  Calendar,
  Paperclip,
  FolderOpen,
  FileImage,
  FileSpreadsheet,
  File,
  Eye,
  Building,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

export default function ListDocuments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>('');

  useEffect(() => {
    loadWorks();
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, documents, selectedWorkId]);

  useEffect(() => {
    if (selectedWorkId) {
      loadDocuments(selectedWorkId);
    } else {
      loadDocuments();
    }
  }, [selectedWorkId]);

  const loadWorks = async () => {
    try {
      const data = await worksService.getAll();
      setWorks(data);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
    }
  };

  const loadDocuments = async (workId?: string) => {
    try {
      setLoading(true);
      const data = await documentsService.getAll(workId);
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleDelete = async () => {
    if (!deleteDocumentId) return;

    try {
      await documentsService.delete(deleteDocumentId);
      toast({
        title: 'Sucesso',
        description: 'Documento excluído com sucesso',
      });
      loadDocuments();
      setDeleteDocumentId(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir documento',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (document: Document) => {
    if (!document.fileUrl) {
      toast({
        title: 'Aviso',
        description: 'Este documento não possui anexo',
        variant: 'destructive',
      });
      return;
    }

    try {
      await documentsService.download(document);
      toast({
        title: 'Sucesso',
        description: 'Download iniciado',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer download do documento',
        variant: 'destructive',
      });
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;

    const expiry = parseISO(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { type: 'expired', label: 'Vencido', variant: 'destructive' as const };
    } else if (days === 0) {
      return { type: 'today', label: 'Vence hoje', variant: 'destructive' as const };
    } else if (days === 1) {
      return { type: 'tomorrow', label: 'Vence amanhã', variant: 'destructive' as const };
    } else if (days <= 7) {
      return { type: 'week', label: `${days} dias`, variant: 'secondary' as const };
    } else if (days <= 30) {
      return { type: 'month', label: `${days} dias`, variant: 'outline' as const };
    }

    return null;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    const mb = size / (1024 * 1024);
    if (mb < 1) {
      const kb = size / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;

    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('image')) return FileImage;
    if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
    if (fileType.includes('word') || fileType.includes('document')) return FileText;

    return File;
  };

  const isImageFile = (fileType?: string) => {
    if (!fileType) return false;
    return fileType.includes('image');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com gradiente suave */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                Gerenciamento de Documentos
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Controle e organize todos os documentos importantes da empresa
              </p>
            </div>
            <Button
              onClick={() => navigate('/documents/new')}
              className="w-full sm:w-auto bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Novo Documento</span>
            </Button>
          </div>
        </div>

        {/* Barra de pesquisa melhorada */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#12b0a0]/20 focus:border-[#12b0a0] transition-all"
              />
            </div>
            <Select value={selectedWorkId || "all"} onValueChange={(value) => setSelectedWorkId(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Todas as obras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as obras</SelectItem>
                {works.map((work) => (
                  <SelectItem key={work.id} value={work.id}>
                    {work.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              {filteredDocuments.length} {filteredDocuments.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
            </div>
          </div>
        </div>

        {/* Lista de Documentos */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum documento encontrado com este filtro' : 'Nenhum documento cadastrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((document) => {
              const expiryStatus = getExpiryStatus(document.expiryDate);
              return (
                <Card key={document.id} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200 group overflow-hidden">
                  {/* Document Preview */}
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative border-b border-gray-200 dark:border-gray-700 overflow-hidden">
                    {document.fileUrl && isImageFile(document.fileType) ? (
                      <img
                        src={document.fileUrl}
                        alt={document.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-icon');
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className={`fallback-icon flex items-center justify-center h-full ${document.fileUrl && isImageFile(document.fileType) ? 'hidden' : ''}`}>
                      {
                        (() => {
                          const IconComponent = getFileIcon(document.fileType);
                          return <IconComponent className="h-12 w-12 text-gray-400 dark:text-gray-600" />;
                        })()
                      }
                    </div>
                    {document.fileUrl && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {expiryStatus && (
                      <div className="absolute top-2 left-2">
                        <Badge variant={expiryStatus.variant} className="text-xs">
                          {expiryStatus.label}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3 pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium truncate" title={document.name}>
                          {document.name}
                        </CardTitle>
                        {document.work && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 truncate">
                              {document.work.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {document.fileUrl && (
                            <DropdownMenuItem onClick={() => handleDownload(document)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/documents/${document.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteDocumentId(document.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Emissão:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {format(parseISO(document.issueDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {document.expiryDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Vencimento:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {format(parseISO(document.expiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>

                    {document.fileUrl && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          className="w-full h-8 text-xs"
                        >
                          <Paperclip className="h-3 w-3 mr-1" />
                          {document.fileName || 'Documento'}
                          {document.fileSize && ` (${formatFileSize(document.fileSize)})`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!deleteDocumentId} onOpenChange={() => setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}