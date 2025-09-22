import { Work } from '@/services/works.service';

export interface Document {
  id: string;
  workId: string;
  work?: Work;
  name: string;
  issueDate: string;
  expiryDate?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDTO {
  workId: string;
  name: string;
  issueDate: string;
  expiryDate?: string;
  file?: File;
}

export interface UpdateDocumentDTO {
  workId?: string;
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  file?: File;
}