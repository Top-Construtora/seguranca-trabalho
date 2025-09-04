import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  number: string;

  @IsString() 
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contractor?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}