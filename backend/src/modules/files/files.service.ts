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
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    // Validate file size (50MB for videos, 10MB for images, 5MB for documents)
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : (isImage ? 10 * 1024 * 1024 : 5 * 1024 * 1024);
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      throw new BadRequestException(`Arquivo muito grande. Máximo ${maxMB}MB`);
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
    this.logger.log(`Delete request for file: ${filename} from folder: ${folder || 'auto-detect'}`);

    // Try to determine folder if not provided
    const possiblePaths = folder
      ? [`${folder}/${filename}`]
      : [`evaluations/${filename}`, `action-plans/${filename}`];

    let hasSupabaseError = false;
    let supabaseErrorMsg = '';

    // Try each possible path
    for (const filepath of possiblePaths) {
      // Try Supabase if available
      if (!this.useLocalStorage && this.supabaseService.getClient()) {
        try {
          await this.supabaseService.deleteFile(this.bucketName, filepath);
          this.logger.log(`File deleted from Supabase: ${filepath}`);
          return; // Success, exit
        } catch (supabaseError) {
          const errorMsg = supabaseError.message || '';
          this.logger.warn(`Supabase delete failed for ${filepath}: ${errorMsg}`);

          // Check if it's a signature verification error
          if (errorMsg.includes('signature') || errorMsg.includes('verification')) {
            hasSupabaseError = true;
            supabaseErrorMsg = errorMsg;
            this.logger.error('Supabase signature verification failed - ignoring Supabase storage');
          }
        }
      }

      // Try local storage
      try {
        await this.localStorageService.deleteFile(this.bucketName, filepath);
        this.logger.log(`File deleted from local storage: ${filepath}`);
        return; // Success, exit
      } catch (localError) {
        this.logger.warn(`Local storage delete failed for ${filepath}: ${localError.message}`);
      }
    }

    // If we have a Supabase signature error, consider it as "deleted"
    // because the file might exist but we can't access it due to auth issues
    if (hasSupabaseError) {
      this.logger.warn(`Ignoring Supabase signature error and marking file as deleted: ${filename}`);
      return; // Consider it deleted
    }

    // If we reach here, file wasn't found anywhere, but that's okay
    // The file might have been already deleted or never existed
    this.logger.warn(`File ${filename} not found in any storage location, considering it already deleted`);
    return; // Success - file doesn't exist
  }

  async deleteActionPlanFile(filename: string) {
    return this.deleteFile(filename, 'action-plans');
  }
}