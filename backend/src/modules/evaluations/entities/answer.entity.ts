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
import { Evaluation } from './evaluation.entity';
import { Question } from './question.entity';
import { ActionPlan } from './action-plan.entity';

export enum AnswerValue {
  SIM = 'sim',
  NAO = 'nao',
  NA = 'na',
}

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Evaluation, (evaluation) => evaluation.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @Column()
  evaluation_id: string;

  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  question_id: string;

  @Column({
    type: 'enum',
    enum: AnswerValue,
  })
  answer: AnswerValue;

  @Column({ type: 'text', nullable: true })
  observation: string;

  @Column('text', { array: true, default: [] })
  evidence_urls: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ActionPlan, (actionPlan) => actionPlan.answer, { cascade: true })
  actionPlans: ActionPlan[];
}