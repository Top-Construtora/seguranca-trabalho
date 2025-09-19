export interface Document {
  id: string;
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
  name: string;
  issueDate: string;
  expiryDate?: string;
  file?: File;
}

export interface UpdateDocumentDTO {
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  file?: File;
}