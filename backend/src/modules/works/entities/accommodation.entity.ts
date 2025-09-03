import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { Work } from './work.entity';
import { Evaluation } from '../../evaluations/entities/evaluation.entity';

@Entity('accommodations')
export class Accommodation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Work, (work) => work.accommodations)
  @JoinTable({
    name: 'accommodation_works',
    joinColumn: { name: 'accommodation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'work_id', referencedColumnName: 'id' },
  })
  works: Work[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.accommodation)
  evaluations: Evaluation[];
}