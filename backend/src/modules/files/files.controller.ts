import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log('Upload request received');
    console.log('Files received:', files?.length || 0);

    if (!files || files.length === 0) {
      console.error('No files in request');
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    console.log('File details:', files.map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })));

    try {
      const uploadedFiles = await Promise.all(
        files.map(file => this.filesService.uploadFile(file))
      );

      return {
        message: 'Arquivos enviados com sucesso',
        files: uploadedFiles,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }

  @Post('upload/action-plan')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadActionPlanFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    console.log('Action plan upload request received');
    console.log('Files received:', files?.length || 0);

    if (!files || files.length === 0) {
      console.error('No files in action plan request');
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    console.log('Action plan file details:', files.map(f => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })));

    try {
      const uploadedFiles = await Promise.all(
        files.map(file => this.filesService.uploadActionPlanFile(file))
      );

      return {
        message: 'Arquivos enviados com sucesso',
        files: uploadedFiles,
      };
    } catch (error) {
      console.error('Action plan upload error:', error);
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    console.log(`Delete request for file: ${filename}`);

    try {
      await this.filesService.deleteFile(filename);
      return { message: 'Arquivo excluído com sucesso' };
    } catch (error) {
      console.error(`Failed to delete file ${filename}:`, error);
      throw error;
    }
  }

  @Delete('action-plan/:filename')
  async deleteActionPlanFile(@Param('filename') filename: string) {
    console.log(`Delete request for action plan file: ${filename}`);

    try {
      await this.filesService.deleteActionPlanFile(filename);
      return { message: 'Arquivo do plano de ação excluído com sucesso' };
    } catch (error) {
      console.error(`Failed to delete action plan file ${filename}:`, error);
      throw error;
    }
  }

  @Post('upload/evidence')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max for videos
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadEvidenceFile(@UploadedFile() file: Express.Multer.File) {
    console.log('Evidence upload request received');

    if (!file) {
      console.error('No file in evidence request');
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    console.log('Evidence file details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    try {
      const uploadedFile = await this.filesService.uploadFile(file, 'accidents');
      return uploadedFile;
    } catch (error) {
      console.error('Evidence upload error:', error);
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }
}