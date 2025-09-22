import { IsString, IsDateString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  workId: string;

  @IsString()
  name: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  fileType?: string;
}