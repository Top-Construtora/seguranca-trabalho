import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly bucketName = 'evidence-files';

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: Express.Multer.File, folder: string = 'evaluations') {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo 5MB');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const filepath = `${folder}/${filename}`;

    try {
      // Upload to Supabase Storage
      await this.supabaseService.uploadFile(
        this.bucketName,
        filepath,
        file.buffer,
        file.mimetype
      );

      // Get public URL
      const publicUrl = this.supabaseService.getPublicUrl(this.bucketName, filepath);

      return {
        originalName: file.originalname,
        filename,
        filepath,
        publicUrl,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);
    }
  }

  async uploadActionPlanFile(file: Express.Multer.File) {
    return this.uploadFile(file, 'action-plans');
  }

  async deleteFile(filename: string) {
    const filepath = `evaluations/${filename}`;
    
    try {
      await this.supabaseService.deleteFile(this.bucketName, filepath);
    } catch (error) {
      throw new BadRequestException(`Erro ao excluir arquivo: ${error.message}`);
    }
  }
}