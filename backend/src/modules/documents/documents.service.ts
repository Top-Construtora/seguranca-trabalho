import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SupabaseService } from '../../common/services/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @Inject(SupabaseService)
    private supabaseService: SupabaseService,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, file?: Express.Multer.File): Promise<Document> {
    let fileData = {};

    if (file) {
      const fileName = `${uuidv4()}-${file.originalname}`;
      const uploadResult = await this.supabaseService.uploadFile(
        'documents',
        fileName,
        file.buffer,
        file.mimetype,
      );

      // Garantir que temos apenas a URL como string
      let fileUrl: string;

      console.log('Upload result type:', typeof uploadResult);
      console.log('Upload result:', uploadResult);

      if (typeof uploadResult === 'string') {
        fileUrl = uploadResult;
      } else {
        throw new Error('Upload result is not a string URL');
      }

      console.log('Final file URL:', fileUrl);

      fileData = {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      };
    }

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      ...fileData,
    });

    return await this.documentsRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return await this.documentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, file?: Express.Multer.File): Promise<Document> {
    const document = await this.findOne(id);
    let fileData = {};

    if (file) {
      // Delete old file if exists
      if (document.fileUrl) {
        const oldFileName = document.fileUrl.split('/').pop();
        if (oldFileName) {
          await this.supabaseService.deleteFile('documents', oldFileName);
        }
      }

      // Upload new file
      const fileName = `${uuidv4()}-${file.originalname}`;
      const uploadResult = await this.supabaseService.uploadFile(
        'documents',
        fileName,
        file.buffer,
        file.mimetype,
      );

      // Garantir que temos apenas a URL como string
      let fileUrl: string;

      console.log('Upload result type:', typeof uploadResult);
      console.log('Upload result:', uploadResult);

      if (typeof uploadResult === 'string') {
        fileUrl = uploadResult;
      } else {
        throw new Error('Upload result is not a string URL');
      }

      console.log('Final file URL:', fileUrl);

      fileData = {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      };
    }

    Object.assign(document, updateDocumentDto, fileData);
    return await this.documentsRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    // Delete file from Supabase if exists
    if (document.fileUrl) {
      // Extrair o nome do arquivo da URL
      // A URL pode estar no formato: https://...supabase.co/storage/v1/object/public/documents/uuid-filename.ext
      const urlParts = document.fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (fileName) {
        try {
          await this.supabaseService.deleteFile('documents', fileName);
        } catch (error) {
          console.error('Error deleting file from Supabase:', error);
          // Continue with document deletion even if file deletion fails
        }
      }
    }

    await this.documentsRepository.remove(document);
  }

  async findExpiringDocuments(days: number = 30): Promise<Document[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.documentsRepository
      .createQueryBuilder('document')
      .where('document.expiryDate IS NOT NULL')
      .andWhere('document.expiryDate <= :futureDate', { futureDate })
      .andWhere('document.expiryDate >= CURRENT_DATE')
      .orderBy('document.expiryDate', 'ASC')
      .getMany();
  }

  async findExpiredDocuments(): Promise<Document[]> {
    return await this.documentsRepository
      .createQueryBuilder('document')
      .where('document.expiryDate IS NOT NULL')
      .andWhere('document.expiryDate < CURRENT_DATE')
      .orderBy('document.expiryDate', 'DESC')
      .getMany();
  }
}