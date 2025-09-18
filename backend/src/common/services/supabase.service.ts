import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || 
                        this.configService.get<string>('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized');
    } else {
      this.logger.warn('Supabase environment variables not found. File storage features will be disabled.');
      this.logger.warn(`SUPABASE_URL: ${supabaseUrl ? 'provided' : 'missing'}`);
      this.logger.warn(`SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY: ${supabaseKey ? 'provided' : 'missing'}`);
    }
  }

  getClient(): SupabaseClient | null {
    return this.supabase;
  }

  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ) {
    if (!this.supabase) {
      this.logger.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    }

    this.logger.log(`Attempting to upload file to bucket: ${bucket}, path: ${path}`);

    // First check if bucket exists and is accessible
    try {
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();

      if (bucketsError) {
        this.logger.error(`Failed to list buckets: ${bucketsError.message}`);
      } else {
        this.logger.log(`Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}`);
      }
    } catch (err) {
      this.logger.error(`Error checking buckets: ${err.message}`);
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`, error);

      // Check if it's a signature error
      if (error.message?.includes('signature')) {
        this.logger.error('Signature verification failed - check SUPABASE_SERVICE_KEY');
        throw new Error('Authentication error with storage service. Please contact support.');
      }

      // Check if bucket doesn't exist
      if (error.message?.includes('not found')) {
        this.logger.error(`Bucket '${bucket}' not found`);
        throw new Error('Storage configuration error. Please contact support.');
      }

      throw new Error(`Failed to upload file: ${error.message}`);
    }

    this.logger.log(`File uploaded successfully: ${path}`);
    return data;
  }

  async deleteFile(bucket: string, path: string) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    }

    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async verifyUser(token: string) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    
    if (error) {
      throw new Error(`Failed to verify user: ${error.message}`);
    }

    return data.user;
  }
}