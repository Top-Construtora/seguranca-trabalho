import { IsUUID, IsEnum, IsOptional, IsString, IsInt, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvidenceFileType } from '../entities/accident-evidence.entity';

export class CreateEvidenceDto {
  @ApiProperty({ description: 'ID do acidente' })
  @IsUUID()
  accident_id: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ description: 'URL do arquivo' })
  @IsString()
  file_url: string;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: EvidenceFileType,
  })
  @IsEnum(EvidenceFileType)
  file_type: EvidenceFileType;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  file_size?: number;

  @ApiProperty({
    description: 'Descrição do arquivo',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
