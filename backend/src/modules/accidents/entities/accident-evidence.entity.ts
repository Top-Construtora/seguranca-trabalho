import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';
import { User } from '../../users/entities/user.entity';

export enum EvidenceFileType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  DOCUMENT = 'document',
}

@Entity('accident_evidences')
export class AccidentEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Accident, (accident) => accident.evidences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'accident_id' })
  accident_id: string;

  @Column({ length: 255, name: 'file_name' })
  file_name: string;

  @Column({ type: 'text', name: 'file_url' })
  file_url: string;

  @Column({
    type: 'enum',
    enum: EvidenceFileType,
    name: 'file_type',
  })
  file_type: EvidenceFileType;

  @Column({ type: 'int', nullable: true, name: 'file_size' })
  file_size: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;

  @Column({ name: 'uploaded_by_id' })
  uploaded_by_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
