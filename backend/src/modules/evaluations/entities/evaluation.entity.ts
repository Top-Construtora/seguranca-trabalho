import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Work } from '../../works/entities/work.entity';
import { Answer } from './answer.entity';
import { QuestionType } from './question.entity';

export enum EvaluationStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
}

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Work, (work) => work.evaluations)
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @Column()
  work_id: string;

  @ManyToOne(() => User, (user) => user.evaluations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  employees_count: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: EvaluationStatus,
    default: EvaluationStatus.DRAFT,
  })
  status: EvaluationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_penalty: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Answer, (answer) => answer.evaluation, { cascade: true })
  answers: Answer[];
}