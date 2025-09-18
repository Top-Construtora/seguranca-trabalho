import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Max 5 files per request
        fieldSize: 10 * 1024 * 1024, // 10MB field size
      },
      fileFilter: (req, file, callback) => {
        // Accept any file type in production
        callback(null, true);
      },
    }),
    CommonModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}