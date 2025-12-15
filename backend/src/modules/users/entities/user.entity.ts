import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Evaluation } from '../../evaluations/entities/evaluation.entity';
import { Log } from '../../logs/entities/log.entity';

export enum UserRole {
  ADMIN = 'admin',
  AVALIADOR = 'avaliador',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.AVALIADOR,
  })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true, name: 'must_change_password' })
  must_change_password: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.user)
  evaluations: Evaluation[];

  @OneToMany(() => Log, (log) => log.user)
  logs: Log[];
}