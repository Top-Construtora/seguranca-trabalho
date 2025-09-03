import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  responsible: string;

  @IsEmail()
  @IsNotEmpty()
  responsible_email: string;

  @IsString()
  @IsOptional()
  responsible_phone?: string;

  @IsString()
  @IsNotEmpty()
  number: string;
}