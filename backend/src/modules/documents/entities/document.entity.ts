import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Work } from '../../works/entities/work.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'work_id' })
  workId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name', nullable: true })
  fileName: string;

  @Column({ type: 'int', name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ type: 'varchar', length: 100, name: 'file_type', nullable: true })
  fileType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Work, (work) => work.documents)
  @JoinColumn({ name: 'work_id' })
  work: Work;
}