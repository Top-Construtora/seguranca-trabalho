// Enums
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

export enum BodyPart {
  CABECA = 'cabeca',
  OLHOS = 'olhos',
  OUVIDOS = 'ouvidos',
  FACE = 'face',
  PESCOCO = 'pescoco',
  OMBRO_ESQUERDO = 'ombro_esquerdo',
  OMBRO_DIREITO = 'ombro_direito',
  BRACO_ESQUERDO = 'braco_esquerdo',
  BRACO_DIREITO = 'braco_direito',
  MAO_ESQUERDA = 'mao_esquerda',
  MAO_DIREITA = 'mao_direita',
  DEDOS_MAO_ESQUERDA = 'dedos_mao_esquerda',
  DEDOS_MAO_DIREITA = 'dedos_mao_direita',
  TORAX = 'torax',
  ABDOMEN = 'abdomen',
  COLUNA = 'coluna',
  QUADRIL = 'quadril',
  PERNA_ESQUERDA = 'perna_esquerda',
  PERNA_DIREITA = 'perna_direita',
  JOELHO_ESQUERDO = 'joelho_esquerdo',
  JOELHO_DIREITO = 'joelho_direito',
  PE_ESQUERDO = 'pe_esquerdo',
  PE_DIREITO = 'pe_direito',
  DEDOS_PE_ESQUERDO = 'dedos_pe_esquerdo',
  DEDOS_PE_DIREITO = 'dedos_pe_direito',
  MULTIPLAS_PARTES = 'multiplas_partes',
  CORPO_INTEIRO = 'corpo_inteiro',
}

export enum EvidenceFileType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  DOCUMENT = 'document',
}

export enum CorrectiveActionStatus {
  PENDENTE = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
  ATRASADA = 'atrasada',
}

// Interfaces
export interface AccidentBodyPart {
  id: string;
  accident_id: string;
  body_part: BodyPart;
  injury_description?: string;
  created_at: string;
}

export interface AccidentEvidence {
  id: string;
  accident_id: string;
  file_name: string;
  file_url: string;
  file_type: EvidenceFileType;
  file_size?: number;
  description?: string;
  uploaded_by_id: string;
  uploaded_by?: {
    id: string;
    name: string;
  };
  created_at: string;
}

export interface Witness {
  name: string;
  role?: string;
  statement?: string;
  contact?: string;
}

export interface AccidentInvestigation {
  id: string;
  accident_id: string;
  investigator_id: string;
  investigator?: {
    id: string;
    name: string;
  };
  investigation_date: string;
  root_cause: string;
  contributing_factors?: string;
  method_used?: string;
  findings?: string;
  recommendations?: string;
  witnesses: Witness[];
  timeline?: string;
  created_at: string;
  updated_at: string;
  corrective_actions?: AccidentCorrectiveAction[];
}

export interface AccidentCorrectiveAction {
  id: string;
  accident_id: string;
  accident?: Accident;
  investigation_id?: string;
  investigation?: AccidentInvestigation;
  action_description: string;
  responsible_id: string;
  responsible?: {
    id: string;
    name: string;
    email: string;
  };
  target_date: string;
  completion_date?: string;
  status: CorrectiveActionStatus;
  priority: number;
  verification_method?: string;
  verification_result?: string;
  attachments: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Accident {
  id: string;
  title: string;
  description: string;
  accident_date: string;
  work_id: string;
  work?: {
    id: string;
    name: string;
    number: string;
  };
  severity: AccidentSeverity;
  accident_type: AccidentType;
  status: AccidentStatus;
  days_away: number;
  victim_name?: string;
  victim_role?: string;
  victim_company?: string;
  location_details?: string;
  immediate_actions?: string;
  reported_by_id: string;
  reported_by?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  body_parts?: AccidentBodyPart[];
  evidences?: AccidentEvidence[];
  investigations?: AccidentInvestigation[];
  corrective_actions?: AccidentCorrectiveAction[];
}

// DTOs
export interface CreateAccidentDto {
  title: string;
  description: string;
  accident_date: string;
  work_id: string;
  severity: AccidentSeverity;
  accident_type: AccidentType;
  days_away?: number;
  victim_name?: string;
  victim_role?: string;
  victim_company?: string;
  location_details?: string;
  immediate_actions?: string;
  body_parts?: {
    body_part: BodyPart;
    injury_description?: string;
  }[];
}

export interface UpdateAccidentDto extends Partial<CreateAccidentDto> {
  status?: AccidentStatus;
}

export interface CreateInvestigationDto {
  accident_id: string;
  investigation_date: string;
  root_cause: string;
  contributing_factors?: string;
  method_used?: string;
  findings?: string;
  recommendations?: string;
  witnesses?: Witness[];
  timeline?: string;
}

export interface UpdateInvestigationDto extends Partial<Omit<CreateInvestigationDto, 'accident_id'>> {}

export interface CreateCorrectiveActionDto {
  accident_id: string;
  investigation_id?: string;
  action_description: string;
  responsible_id: string;
  target_date: string;
  priority?: number;
  verification_method?: string;
  attachments?: string[];
  notes?: string;
}

export interface UpdateCorrectiveActionDto extends Partial<Omit<CreateCorrectiveActionDto, 'accident_id'>> {
  status?: CorrectiveActionStatus;
  completion_date?: string;
  verification_result?: string;
}

export interface CreateEvidenceDto {
  accident_id: string;
  file_name: string;
  file_url: string;
  file_type: EvidenceFileType;
  file_size?: number;
  description?: string;
}

export interface AccidentFilters {
  work_id?: string;
  severity?: AccidentSeverity;
  status?: AccidentStatus;
  accident_type?: AccidentType;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// Dashboard Types
export interface DashboardSummary {
  totalAccidents: number;
  totalDaysAway: number;
  bySeverity: { severity: AccidentSeverity; count: number }[];
  byStatus: { status: AccidentStatus; count: number }[];
  pendingActions: number;
}

export interface DaysAwayByWork {
  work_id: string;
  work_name: string;
  total_days_away: number;
  accident_count: number;
}

export interface BodyPartStats {
  body_part: BodyPart;
  count: number;
}

export interface SeverityStats {
  severity: AccidentSeverity;
  count: number;
  total_days_away: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
  days_away: number;
}

export interface CorrectiveActionStats {
  total: number;
  byStatus: { status: CorrectiveActionStatus; count: number }[];
  overdue: number;
  avgCompletionDays: number;
}

// Labels para exibição
export const SEVERITY_LABELS: Record<AccidentSeverity, string> = {
  [AccidentSeverity.LEVE]: 'Leve',
  [AccidentSeverity.MODERADO]: 'Moderado',
  [AccidentSeverity.GRAVE]: 'Grave',
  [AccidentSeverity.FATAL]: 'Fatal',
};

export const STATUS_LABELS: Record<AccidentStatus, string> = {
  [AccidentStatus.REGISTRADO]: 'Registrado',
  [AccidentStatus.EM_INVESTIGACAO]: 'Em Investigação',
  [AccidentStatus.CONCLUIDO]: 'Concluído',
  [AccidentStatus.ARQUIVADO]: 'Arquivado',
};

export const TYPE_LABELS: Record<AccidentType, string> = {
  [AccidentType.QUEDA_ALTURA]: 'Queda de Altura',
  [AccidentType.QUEDA_MESMO_NIVEL]: 'Queda no Mesmo Nível',
  [AccidentType.CHOQUE_ELETRICO]: 'Choque Elétrico',
  [AccidentType.CORTE_PERFURACAO]: 'Corte/Perfuração',
  [AccidentType.QUEIMADURA]: 'Queimadura',
  [AccidentType.ESMAGAMENTO]: 'Esmagamento',
  [AccidentType.INTOXICACAO]: 'Intoxicação',
  [AccidentType.SOTERRAMENTO]: 'Soterramento',
  [AccidentType.PROJECAO_MATERIAL]: 'Projeção de Material',
  [AccidentType.OUTROS]: 'Outros',
};

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  [BodyPart.CABECA]: 'Cabeça',
  [BodyPart.OLHOS]: 'Olhos',
  [BodyPart.OUVIDOS]: 'Ouvidos',
  [BodyPart.FACE]: 'Face',
  [BodyPart.PESCOCO]: 'Pescoço',
  [BodyPart.OMBRO_ESQUERDO]: 'Ombro Esquerdo',
  [BodyPart.OMBRO_DIREITO]: 'Ombro Direito',
  [BodyPart.BRACO_ESQUERDO]: 'Braço Esquerdo',
  [BodyPart.BRACO_DIREITO]: 'Braço Direito',
  [BodyPart.MAO_ESQUERDA]: 'Mão Esquerda',
  [BodyPart.MAO_DIREITA]: 'Mão Direita',
  [BodyPart.DEDOS_MAO_ESQUERDA]: 'Dedos Mão Esquerda',
  [BodyPart.DEDOS_MAO_DIREITA]: 'Dedos Mão Direita',
  [BodyPart.TORAX]: 'Tórax',
  [BodyPart.ABDOMEN]: 'Abdômen',
  [BodyPart.COLUNA]: 'Coluna',
  [BodyPart.QUADRIL]: 'Quadril',
  [BodyPart.PERNA_ESQUERDA]: 'Perna Esquerda',
  [BodyPart.PERNA_DIREITA]: 'Perna Direita',
  [BodyPart.JOELHO_ESQUERDO]: 'Joelho Esquerdo',
  [BodyPart.JOELHO_DIREITO]: 'Joelho Direito',
  [BodyPart.PE_ESQUERDO]: 'Pé Esquerdo',
  [BodyPart.PE_DIREITO]: 'Pé Direito',
  [BodyPart.DEDOS_PE_ESQUERDO]: 'Dedos Pé Esquerdo',
  [BodyPart.DEDOS_PE_DIREITO]: 'Dedos Pé Direito',
  [BodyPart.MULTIPLAS_PARTES]: 'Múltiplas Partes',
  [BodyPart.CORPO_INTEIRO]: 'Corpo Inteiro',
};

export const CORRECTIVE_ACTION_STATUS_LABELS: Record<CorrectiveActionStatus, string> = {
  [CorrectiveActionStatus.PENDENTE]: 'Pendente',
  [CorrectiveActionStatus.EM_ANDAMENTO]: 'Em Andamento',
  [CorrectiveActionStatus.CONCLUIDA]: 'Concluída',
  [CorrectiveActionStatus.CANCELADA]: 'Cancelada',
  [CorrectiveActionStatus.ATRASADA]: 'Atrasada',
};

// Cores para gráficos e badges
export const SEVERITY_COLORS: Record<AccidentSeverity, string> = {
  [AccidentSeverity.LEVE]: '#22c55e',
  [AccidentSeverity.MODERADO]: '#eab308',
  [AccidentSeverity.GRAVE]: '#f97316',
  [AccidentSeverity.FATAL]: '#ef4444',
};

export const STATUS_COLORS: Record<AccidentStatus, string> = {
  [AccidentStatus.REGISTRADO]: '#3b82f6',
  [AccidentStatus.EM_INVESTIGACAO]: '#eab308',
  [AccidentStatus.CONCLUIDO]: '#22c55e',
  [AccidentStatus.ARQUIVADO]: '#6b7280',
};

export const CORRECTIVE_ACTION_STATUS_COLORS: Record<CorrectiveActionStatus, string> = {
  [CorrectiveActionStatus.PENDENTE]: '#3b82f6',
  [CorrectiveActionStatus.EM_ANDAMENTO]: '#eab308',
  [CorrectiveActionStatus.CONCLUIDA]: '#22c55e',
  [CorrectiveActionStatus.CANCELADA]: '#6b7280',
  [CorrectiveActionStatus.ATRASADA]: '#ef4444',
};
