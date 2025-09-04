import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Question } from './question.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  evaluation_id: string;

  @Column('uuid') 
  question_id: string;

  @Column({ default: 'boolean' })
  answer_type: string;

  @Column({ nullable: true })
  boolean_answer?: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  numeric_answer?: number;

  @Column('text', { nullable: true })
  text_answer?: string;

  @Column('text', { nullable: true })
  observations?: string;

  @ManyToOne(() => Evaluation)
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @CreateDateColumn()
  created_at: Date;
}