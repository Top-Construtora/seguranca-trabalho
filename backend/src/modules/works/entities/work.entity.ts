import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Evaluation } from '../../evaluations/entities/evaluation.entity';
import { Accommodation } from './accommodation.entity';

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  responsible: string;

  @Column()
  responsible_email: string;

  @Column()
  responsible_phone: string;

  @Column({ unique: true })
  number: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.work)
  evaluations: Evaluation[];

  @ManyToMany(() => Accommodation, (accommodation) => accommodation.works)
  accommodations: Accommodation[];
}