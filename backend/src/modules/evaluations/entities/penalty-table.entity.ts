import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('penalty_table')
export class PenaltyTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employees_min: number;

  @Column()
  employees_max: number;

  @Column()
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  min_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  max_value: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}