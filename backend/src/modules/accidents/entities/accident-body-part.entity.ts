import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';

export enum BodyPart {
  CABECA = 'cabeca',
  OLHOS = 'olhos',
  OUVIDOS = 'ouvidos',
  FACE = 'face',
  PESCOCO = 'pescoco',
  OMBRO_ESQUERDO = 'ombro_esquerdo',
  OMBRO_DIREITO = 'ombro_direito',
  BRACO_ESQUERDO = 'braco_esquerdo',
  BRACO_DIREITO = 'braco_direito',
  MAO_ESQUERDA = 'mao_esquerda',
  MAO_DIREITA = 'mao_direita',
  DEDOS_MAO_ESQUERDA = 'dedos_mao_esquerda',
  DEDOS_MAO_DIREITA = 'dedos_mao_direita',
  TORAX = 'torax',
  ABDOMEN = 'abdomen',
  COLUNA = 'coluna',
  QUADRIL = 'quadril',
  PERNA_ESQUERDA = 'perna_esquerda',
  PERNA_DIREITA = 'perna_direita',
  JOELHO_ESQUERDO = 'joelho_esquerdo',
  JOELHO_DIREITO = 'joelho_direito',
  PE_ESQUERDO = 'pe_esquerdo',
  PE_DIREITO = 'pe_direito',
  DEDOS_PE_ESQUERDO = 'dedos_pe_esquerdo',
  DEDOS_PE_DIREITO = 'dedos_pe_direito',
  MULTIPLAS_PARTES = 'multiplas_partes',
  CORPO_INTEIRO = 'corpo_inteiro',
}

@Entity('accident_body_parts')
export class AccidentBodyPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Accident, (accident) => accident.body_parts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'accident_id' })
  accident_id: string;

  @Column({
    type: 'enum',
    enum: BodyPart,
    name: 'body_part',
  })
  body_part: BodyPart;

  @Column({ type: 'text', nullable: true, name: 'injury_description' })
  injury_description: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
