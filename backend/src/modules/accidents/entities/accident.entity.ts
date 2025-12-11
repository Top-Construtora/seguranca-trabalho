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
import { AccidentBodyPart } from './accident-body-part.entity';
import { AccidentEvidence } from './accident-evidence.entity';
import { AccidentInvestigation } from './accident-investigation.entity';
import { AccidentCorrectiveAction } from './accident-corrective-action.entity';

export enum AccidentSeverity {
  LEVE = 'leve',
  MODERADO = 'moderado',
  GRAVE = 'grave',
  FATAL = 'fatal',
}

export enum AccidentStatus {
  REGISTRADO = 'registrado',
  EM_INVESTIGACAO = 'em_investigacao',
  CONCLUIDO = 'concluido',
  ARQUIVADO = 'arquivado',
}

export enum AccidentType {
  QUEDA_ALTURA = 'queda_altura',
  QUEDA_MESMO_NIVEL = 'queda_mesmo_nivel',
  CHOQUE_ELETRICO = 'choque_eletrico',
  CORTE_PERFURACAO = 'corte_perfuracao',
  QUEIMADURA = 'queimadura',
  ESMAGAMENTO = 'esmagamento',
  INTOXICACAO = 'intoxicacao',
  SOTERRAMENTO = 'soterramento',
  PROJECAO_MATERIAL = 'projecao_material',
  OUTROS = 'outros',
}

@Entity('accidents')
export class Accident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', name: 'accident_date' })
  accident_date: Date;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @Column({ name: 'work_id' })
  work_id: string;

  @Column({
    type: 'enum',
    enum: AccidentSeverity,
  })
  severity: AccidentSeverity;

  @Column({
    type: 'enum',
    enum: AccidentType,
    name: 'accident_type',
  })
  accident_type: AccidentType;

  @Column({
    type: 'enum',
    enum: AccidentStatus,
    default: AccidentStatus.REGISTRADO,
  })
  status: AccidentStatus;

  @Column({ type: 'int', default: 0, name: 'days_away' })
  days_away: number;

  @Column({ length: 255, nullable: true, name: 'victim_name' })
  victim_name: string;

  @Column({ length: 255, nullable: true, name: 'victim_role' })
  victim_role: string;

  @Column({ length: 255, nullable: true, name: 'victim_company' })
  victim_company: string;

  @Column({ type: 'text', nullable: true, name: 'location_details' })
  location_details: string;

  @Column({ type: 'text', nullable: true, name: 'immediate_actions' })
  immediate_actions: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reported_by: User;

  @Column({ name: 'reported_by_id' })
  reported_by_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => AccidentBodyPart, (bodyPart) => bodyPart.accident, {
    cascade: true,
  })
  body_parts: AccidentBodyPart[];

  @OneToMany(() => AccidentEvidence, (evidence) => evidence.accident, {
    cascade: true,
  })
  evidences: AccidentEvidence[];

  @OneToMany(
    () => AccidentInvestigation,
    (investigation) => investigation.accident,
    { cascade: true },
  )
  investigations: AccidentInvestigation[];

  @OneToMany(() => AccidentCorrectiveAction, (action) => action.accident, {
    cascade: true,
  })
  corrective_actions: AccidentCorrectiveAction[];
}
