import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Answer } from './answer.entity';
import { User } from '../../users/entities/user.entity';

@Entity('action_plans')
export class ActionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Column()
  answer_id: string;

  @Column({ type: 'text' })
  action_description: string;

  @Column({ type: 'date', nullable: true })
  target_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, in_progress, completed

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsible_user: User;

  @Column({ nullable: true })
  responsible_user_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column('text', { array: true, default: [] })
  attachment_urls: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}