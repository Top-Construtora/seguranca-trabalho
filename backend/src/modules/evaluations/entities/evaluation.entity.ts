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
import { Accommodation } from '../../works/entities/accommodation.entity';
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

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.evaluations)
  @JoinColumn({ name: 'accommodation_id' })
  accommodation: Accommodation;

  @Column({ nullable: true })
  accommodation_id: string;

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

  @Column({
    type: 'date',
    transformer: {
      to(value: any): string {
        // Se receber uma string yyyy-MM-dd, retorna ela diretamente
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        // Se receber um Date, formata como yyyy-MM-dd
        if (value instanceof Date) {
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return value;
      },
      from(value: any): string {
        // Retorna a string diretamente sem conversão para Date
        // Isso evita problemas de timezone na serialização JSON
        if (value instanceof Date) {
          // Se por algum motivo vier como Date, converte para string
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        // Se já for string, retorna como está
        return value;
      }
    }
  })
  date: Date | string;

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