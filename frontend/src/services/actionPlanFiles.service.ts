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

class ActionPlanFilesService {
  async uploadFiles(files: FileList): Promise<UploadedFile[]> {
    const formData = new FormData();

    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post<UploadResponse>('/files/upload/action-plan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files;
  }

  async deleteFile(filename: string): Promise<void> {
    await api.delete(`/files/${filename}`);
  }

  // Helper to get just filename from full path or URL
  getFilenameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }
}

export const actionPlanFilesService = new ActionPlanFilesService();