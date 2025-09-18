import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { LocalStorageService } from '../../common/services/local-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly bucketName = 'evidence-files';
  private useLocalStorage = false;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly localStorageService: LocalStorageService,
  ) {
    // Check if Supabase is available
    if (!this.supabaseService.getClient()) {
      this.logger.warn('Supabase not available, using local storage');
      this.useLocalStorage = true;
    }
  }

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
      let publicUrl: string;

      // Try Supabase first, fallback to local storage
      if (!this.useLocalStorage) {
        try {
          // Upload to Supabase Storage
          await this.supabaseService.uploadFile(
            this.bucketName,
            filepath,
            file.buffer,
            file.mimetype
          );

          // Get public URL
          publicUrl = this.supabaseService.getPublicUrl(this.bucketName, filepath);
          this.logger.log('File uploaded to Supabase successfully');
        } catch (supabaseError) {
          this.logger.error(`Supabase upload failed: ${supabaseError.message}`);

          // Fallback to local storage
          this.logger.warn('Falling back to local storage');
          await this.localStorageService.uploadFile(
            this.bucketName,
            filepath,
            file.buffer,
            file.mimetype
          );

          publicUrl = this.localStorageService.getPublicUrl(this.bucketName, filepath);
          this.logger.log('File uploaded to local storage successfully');
        }
      } else {
        // Use local storage directly
        await this.localStorageService.uploadFile(
          this.bucketName,
          filepath,
          file.buffer,
          file.mimetype
        );

        publicUrl = this.localStorageService.getPublicUrl(this.bucketName, filepath);
        this.logger.log('File uploaded to local storage');
      }

      return {
        originalName: file.originalname,
        filename,
        filepath,
        publicUrl,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Upload failed completely: ${error.message}`);
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);
    }
  }

  async uploadActionPlanFile(file: Express.Multer.File) {
    return this.uploadFile(file, 'action-plans');
  }

  async deleteFile(filename: string, folder?: string) {
    this.logger.log(`Attempting to delete file: ${filename} from folder: ${folder || 'auto-detect'}`);

    // Try to determine folder if not provided
    const possiblePaths = folder
      ? [`${folder}/${filename}`]
      : [`evaluations/${filename}`, `action-plans/${filename}`];

    let deleted = false;
    let lastError: Error | null = null;

    for (const filepath of possiblePaths) {
      try {
        // Try to delete from appropriate storage
        if (!this.useLocalStorage) {
          try {
            // Try Supabase first
            await this.supabaseService.deleteFile(this.bucketName, filepath);
            this.logger.log(`File deleted from Supabase: ${filepath}`);
            deleted = true;
            break;
          } catch (supabaseError) {
            this.logger.warn(`Supabase delete failed for ${filepath}: ${supabaseError.message}`);

            // Try local storage as fallback
            try {
              await this.localStorageService.deleteFile(this.bucketName, filepath);
              this.logger.log(`File deleted from local storage: ${filepath}`);
              deleted = true;
              break;
            } catch (localError) {
              this.logger.warn(`Local storage delete also failed for ${filepath}: ${localError.message}`);
              lastError = localError;
            }
          }
        } else {
          // Use local storage directly
          await this.localStorageService.deleteFile(this.bucketName, filepath);
          this.logger.log(`File deleted from local storage: ${filepath}`);
          deleted = true;
          break;
        }
      } catch (error) {
        this.logger.warn(`Failed to delete ${filepath}: ${error.message}`);
        lastError = error;
      }
    }

    if (!deleted) {
      this.logger.error(`Failed to delete file ${filename} from any location`);
      throw new BadRequestException(
        `Erro ao excluir arquivo: ${lastError?.message || 'Arquivo não encontrado'}`
      );
    }
  }

  async deleteActionPlanFile(filename: string) {
    return this.deleteFile(filename, 'action-plans');
  }
}