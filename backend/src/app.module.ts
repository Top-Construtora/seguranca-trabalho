import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorksModule } from './modules/works/works.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { LogsModule } from './modules/logs/logs.module';
import { FilesModule } from './modules/files/files.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccidentsModule } from './modules/accidents/accidents.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    WorksModule,
    QuestionsModule,
    EvaluationsModule,
    ReportsModule,
    LogsModule,
    FilesModule,
    DocumentsModule,
    AccidentsModule,
  ],
})
export class AppModule {}