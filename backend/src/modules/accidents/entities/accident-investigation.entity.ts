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
import { Accident } from './accident.entity';
import { User } from '../../users/entities/user.entity';
import { AccidentCorrectiveAction } from './accident-corrective-action.entity';

export interface Witness {
  name: string;
  role?: string;
  statement?: string;
  contact?: string;
}

@Entity('accident_investigations')
export class AccidentInvestigation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Accident, (accident) => accident.investigations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'accident_id' })
  accident_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'investigator_id' })
  investigator: User;

  @Column({ name: 'investigator_id' })
  investigator_id: string;

  @Column({ type: 'timestamp', name: 'investigation_date' })
  investigation_date: Date;

  @Column({ type: 'text', name: 'root_cause' })
  root_cause: string;

  @Column({ type: 'text', nullable: true, name: 'contributing_factors' })
  contributing_factors: string;

  @Column({ length: 100, nullable: true, name: 'method_used' })
  method_used: string;

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ type: 'jsonb', default: [] })
  witnesses: Witness[];

  @Column({ type: 'text', nullable: true })
  timeline: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => AccidentCorrectiveAction, (action) => action.investigation)
  corrective_actions: AccidentCorrectiveAction[];
}
