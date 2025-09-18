import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = this.configService.get<string>('APP_URL') ||
                   `http://localhost:${this.configService.get<string>('PORT') || 3333}`;

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async uploadFile(
    bucket: string,
    filePath: string,
    file: Buffer,
    contentType: string,
  ) {
    const fullPath = path.join(this.uploadDir, bucket, filePath);
    const dirPath = path.dirname(fullPath);

    try {
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      // Write file
      await writeFile(fullPath, file);

      this.logger.log(`File saved locally: ${fullPath}`);

      return {
        path: filePath,
        id: path.basename(filePath),
        fullPath,
      };
    } catch (error) {
      this.logger.error(`Failed to save file locally: ${error.message}`);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async deleteFile(bucket: string, filePath: string) {
    const fullPath = path.join(this.uploadDir, bucket, filePath);

    try {
      if (fs.existsSync(fullPath)) {
        await unlink(fullPath);
        this.logger.log(`File deleted locally: ${fullPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file locally: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getPublicUrl(bucket: string, filePath: string): string {
    // Return a URL that will be served by the static file middleware
    return `${this.baseUrl}/api/uploads/${bucket}/${filePath}`;
  }
}