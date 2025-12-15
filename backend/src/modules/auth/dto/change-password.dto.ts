import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual do usuário (opcional para primeiro acesso)' })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ description: 'Nova senha (mínimo 6 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
