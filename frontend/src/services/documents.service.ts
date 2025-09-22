import { api } from './api';
import { Document, CreateDocumentDTO, UpdateDocumentDTO } from '@/types/document';

class DocumentsService {
  async getAll(workId?: string): Promise<Document[]> {
    const { data } = await api.get('/documents', {
      params: workId ? { workId } : undefined,
    });
    return data;
  }

  async getByWorkId(workId: string): Promise<Document[]> {
    const { data } = await api.get(`/documents/work/${workId}`);
    return data;
  }

  async getById(id: string): Promise<Document> {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  }

  async getExpiring(days: number = 30, workId?: string): Promise<Document[]> {
    const { data } = await api.get('/documents/expiring', {
      params: { days, ...(workId ? { workId } : {}) },
    });
    return data;
  }

  async getExpired(workId?: string): Promise<Document[]> {
    const { data } = await api.get('/documents/expired', {
      params: workId ? { workId } : undefined,
    });
    return data;
  }

  async create(documentData: CreateDocumentDTO): Promise<Document> {
    const formData = new FormData();

    formData.append('workId', documentData.workId);
    formData.append('name', documentData.name);
    formData.append('issueDate', documentData.issueDate);

    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }

    if (documentData.file) {
      formData.append('file', documentData.file);
    }

    const { data } = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  async update(id: string, documentData: UpdateDocumentDTO): Promise<Document> {
    const formData = new FormData();

    if (documentData.workId) {
      formData.append('workId', documentData.workId);
    }

    if (documentData.name) {
      formData.append('name', documentData.name);
    }

    if (documentData.issueDate) {
      formData.append('issueDate', documentData.issueDate);
    }

    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }

    if (documentData.file) {
      formData.append('file', documentData.file);
    }

    const { data } = await api.patch(`/documents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }

  async download(document: Document): Promise<void> {
    if (!document.fileUrl) {
      throw new Error('Documento não possui arquivo anexado');
    }

    const response = await api.get(document.fileUrl, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = window.document.createElement('a');
    link.href = url;
    link.setAttribute('download', document.fileName || 'document');
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default new DocumentsService();