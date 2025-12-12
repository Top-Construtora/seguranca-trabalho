import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { useAddEvidence } from '@/hooks/useAccidents';
import { EvidenceFileType } from '@/types/accident.types';
import { filesService } from '@/services/files.service';
import {
  Image,
  Video,
  FileText,
  Upload,
  X,
  Loader2,
  File,
} from 'lucide-react';

interface EvidenceUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accidentId: string;
}

type EvidenceType = 'image' | 'video' | 'pdf' | 'text';

export function EvidenceUploadModal({
  open,
  onOpenChange,
  accidentId,
}: EvidenceUploadModalProps) {
  const { toast } = useToast();
  const addEvidence = useAddEvidence();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [evidenceType, setEvidenceType] = useState<EvidenceType>('image');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = useCallback(() => {
    setEvidenceType('image');
    setDescription('');
    setTextContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on evidence type
    if (evidenceType === 'image') {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione uma imagem.',
          variant: 'destructive',
        });
        return;
      }
    } else if (evidenceType === 'video') {
      if (!file.type.startsWith('video/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um vídeo.',
          variant: 'destructive',
        });
        return;
      }
    } else if (evidenceType === 'pdf') {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo PDF.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate file size (50MB for videos, 10MB for images/PDFs)
    const maxSize = evidenceType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: `O tamanho máximo é ${evidenceType === 'video' ? '50MB' : '10MB'}.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [evidenceType, toast]);

  const handleSubmit = async () => {
    if (evidenceType === 'text') {
      if (!textContent.trim()) {
        toast({
          title: 'Conteúdo obrigatório',
          description: 'Por favor, insira o texto da evidência.',
          variant: 'destructive',
        });
        return;
      }

      // For text evidence, we don't upload a file
      try {
        setIsUploading(true);
        await addEvidence.mutateAsync({
          accidentId,
          data: {
            file_name: `Nota de texto - ${new Date().toLocaleDateString('pt-BR')}`,
            file_url: '', // No URL for text
            file_type: EvidenceFileType.DOCUMENT,
            file_size: textContent.length,
            description: textContent,
          },
        });
        handleClose();
      } catch (error) {
        console.error('Error adding text evidence:', error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // For image/video evidence
      if (!selectedFile) {
        toast({
          title: 'Arquivo obrigatório',
          description: `Por favor, selecione ${evidenceType === 'image' ? 'uma imagem' : 'um vídeo'}.`,
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsUploading(true);

        // Upload file to Supabase
        const uploadResult = await filesService.uploadEvidenceFile(selectedFile);

        // Add evidence record
        const fileTypeMap: Record<string, EvidenceFileType> = {
          image: EvidenceFileType.IMAGE,
          video: EvidenceFileType.VIDEO,
          pdf: EvidenceFileType.PDF,
        };

        await addEvidence.mutateAsync({
          accidentId,
          data: {
            file_name: selectedFile.name,
            file_url: uploadResult.publicUrl,
            file_type: fileTypeMap[evidenceType],
            file_size: selectedFile.size,
            description: description || undefined,
          },
        });

        handleClose();
      } catch (error) {
        console.error('Error uploading evidence:', error);
        toast({
          title: 'Erro ao enviar evidência',
          description: 'Ocorreu um erro ao enviar a evidência. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getAcceptedFileTypes = () => {
    if (evidenceType === 'image') {
      return 'image/jpeg,image/png,image/gif,image/webp';
    } else if (evidenceType === 'video') {
      return 'video/mp4,video/webm,video/quicktime';
    } else if (evidenceType === 'pdf') {
      return 'application/pdf';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Evidência</DialogTitle>
          <DialogDescription>
            Selecione o tipo de evidência e faça o upload do arquivo ou insira o texto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Evidence Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Evidência</Label>
            <RadioGroup
              value={evidenceType}
              onValueChange={(value) => {
                setEvidenceType(value as EvidenceType);
                setSelectedFile(null);
                setPreviewUrl(null);
                setTextContent('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image" id="type-image" />
                <Label htmlFor="type-image" className="flex items-center gap-2 cursor-pointer">
                  <Image className="h-4 w-4" />
                  Imagem
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="type-video" />
                <Label htmlFor="type-video" className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  Vídeo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="type-pdf" />
                <Label htmlFor="type-pdf" className="flex items-center gap-2 cursor-pointer">
                  <File className="h-4 w-4" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="type-text" />
                <Label htmlFor="type-text" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Texto
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* File Upload (for image/video/pdf) */}
          {(evidenceType === 'image' || evidenceType === 'video' || evidenceType === 'pdf') && (
            <div className="space-y-3">
              <Label>Arquivo</Label>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#1e6076] dark:hover:border-[#12b0a0] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="relative">
                    {evidenceType === 'image' && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                    ) : evidenceType === 'video' && previewUrl ? (
                      <video
                        src={previewUrl}
                        className="max-h-48 mx-auto rounded-lg"
                        controls
                      />
                    ) : evidenceType === 'pdf' ? (
                      <div className="flex flex-col items-center py-4">
                        <File className="h-16 w-16 text-red-500" />
                        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Documento PDF
                        </p>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clique para selecionar {
                        evidenceType === 'image' ? 'uma imagem' :
                        evidenceType === 'video' ? 'um vídeo' : 'um arquivo PDF'
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {evidenceType === 'image'
                        ? 'JPG, PNG, GIF ou WebP (máx. 10MB)'
                        : evidenceType === 'video'
                        ? 'MP4, WebM ou MOV (máx. 50MB)'
                        : 'Arquivo PDF (máx. 10MB)'}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Text Content (for text evidence) */}
          {evidenceType === 'text' && (
            <div className="space-y-3">
              <Label htmlFor="text-content">Conteúdo da Evidência</Label>
              <Textarea
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Descreva a evidência em detalhes..."
                rows={6}
              />
            </div>
          )}

          {/* Description (for image/video/pdf) */}
          {(evidenceType === 'image' || evidenceType === 'video' || evidenceType === 'pdf') && (
            <div className="space-y-3">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para esta evidência..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1e6076]/90 hover:to-[#12b0a0]/90 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
