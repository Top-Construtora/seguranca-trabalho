import { IsString, IsDateString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class UpdateDocumentDto {
  @IsUUID()
  @IsOptional()
  workId?: string;
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

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