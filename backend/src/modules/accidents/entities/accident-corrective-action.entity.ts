import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Accident } from './accident.entity';
import { AccidentInvestigation } from './accident-investigation.entity';
import { User } from '../../users/entities/user.entity';

export enum CorrectiveActionStatus {
  PENDENTE = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
  ATRASADA = 'atrasada',
}

@Entity('accident_corrective_actions')
export class AccidentCorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Accident, (accident) => accident.corrective_actions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'accident_id' })
  accident_id: string;

  @ManyToOne(() => AccidentInvestigation, (inv) => inv.corrective_actions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'investigation_id' })
  investigation: AccidentInvestigation;

  @Column({ name: 'investigation_id', nullable: true })
  investigation_id: string;

  @Column({ type: 'text', name: 'action_description' })
  action_description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsible_id' })
  responsible: User;

  @Column({ name: 'responsible_id' })
  responsible_id: string;

  @Column({ type: 'date', name: 'target_date' })
  target_date: Date;

  @Column({ type: 'date', nullable: true, name: 'completion_date' })
  completion_date: Date;

  @Column({
    type: 'enum',
    enum: CorrectiveActionStatus,
    default: CorrectiveActionStatus.PENDENTE,
  })
  status: CorrectiveActionStatus;

  @Column({ type: 'int', default: 3 })
  priority: number;

  @Column({ type: 'text', nullable: true, name: 'verification_method' })
  verification_method: string;

  @Column({ type: 'text', nullable: true, name: 'verification_result' })
  verification_result: string;

  @Column({ type: 'text', array: true, default: [] })
  attachments: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
