import { api } from './api';

export interface UploadedFile {
  originalName: string;
  filename: string;
  filepath: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}

export interface UploadResponse {
  message: string;
  files: UploadedFile[];
}

class FilesService {
  async uploadFiles(files: FileList): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post<UploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files;
  }

  async deleteFile(filename: string): Promise<void> {
    await api.delete(`/files/${filename}`);
  }
}

export const filesService = new FilesService();