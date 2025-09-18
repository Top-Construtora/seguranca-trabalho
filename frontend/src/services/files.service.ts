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
    try {
      const formData = new FormData();

      Array.from(files).forEach(file => {
        console.log('Uploading file:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        formData.append('files', file);
      });

      // Don't set Content-Type header - let Axios set it automatically with boundary
      const response = await api.post<UploadResponse>('/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log('Upload progress:', percentCompleted + '%');
        },
      });

      console.log('Upload successful:', response.data);
      return response.data.files;
    } catch (error: any) {
      console.error('Upload failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });

      // Provide more specific error message
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Arquivo inválido ou muito grande (máximo 10MB)';
        throw new Error(errorMessage);
      }

      throw error;
    }
  }

  async deleteFile(filename: string): Promise<void> {
    await api.delete(`/files/${filename}`);
  }
}

export const filesService = new FilesService();