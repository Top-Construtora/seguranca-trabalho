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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import documentsService from '@/services/documents.service';
import { worksService, Work } from '@/services/works.service';
import { Document } from '@/types/document';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Download,
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="min-w-[350px]">Documento</TableHead>
                    <TableHead className="min-w-[200px]">Obra</TableHead>
                    <TableHead className="w-[120px]">Emissão</TableHead>
                    <TableHead className="w-[120px]">Vencimento</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Anexo</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const expiryStatus = getExpiryStatus(document.expiryDate);
                    const FileIcon = getFileIcon(document.fileType);
                    return (
                      <TableRow key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100" title={document.name}>
                                {document.name}
                              </p>
                              {document.fileName && (
                                <p className="text-xs text-gray-500 truncate">
                                  {document.fileName}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {document.work ? (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300" title={document.work.name}>
                                {document.work.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {format(parseISO(document.issueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {document.expiryDate ? (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {format(parseISO(document.expiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {expiryStatus ? (
                            <Badge variant={expiryStatus.variant} className="text-xs">
                              {expiryStatus.label}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              Válido
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {document.fileUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(document)}
                              className="h-8 px-2 text-[#1e6076] dark:text-[#12b0a0] hover:bg-[#1e6076]/10 dark:hover:bg-[#12b0a0]/10"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              <span className="text-xs">
                                {formatFileSize(document.fileSize)}
                              </span>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {document.fileUrl && (
                                <DropdownMenuItem onClick={() => handleDownload(document)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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