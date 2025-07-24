import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  responsible: string;

  @IsEmail()
  @IsNotEmpty()
  responsible_email: string;

  @IsString()
  @IsNotEmpty()
  responsible_phone: string;

  @IsString()
  @IsNotEmpty()
  number: string;
}