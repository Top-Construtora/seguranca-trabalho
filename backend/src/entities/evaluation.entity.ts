import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Work } from './work.entity';

export enum EvaluationStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
}

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  work_id: string;

  @Column('uuid')
  evaluator_id: string;

  @Column({
    type: 'enum',
    enum: EvaluationStatus,
    default: EvaluationStatus.DRAFT,
  })
  status: EvaluationStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column('text', { nullable: true })
  observations?: string;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}