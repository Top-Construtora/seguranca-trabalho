import { Badge } from '@/components/ui/badge';
import {
  AccidentSeverity,
  AccidentStatus,
  CorrectiveActionStatus,
  SEVERITY_LABELS,
  STATUS_LABELS,
  CORRECTIVE_ACTION_STATUS_LABELS,
} from '@/types/accident.types';
import {
  AlertTriangle,
  FileSearch,
  CheckCircle,
  Archive,
  Clock,
  Play,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface SeverityBadgeProps {
  severity: AccidentSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    [AccidentSeverity.LEVE]: {
      className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
    },
    [AccidentSeverity.MODERADO]: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    [AccidentSeverity.GRAVE]: {
      className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
    },
    [AccidentSeverity.FATAL]: {
      className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  return (
    <Badge className={config[severity].className}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: AccidentStatus;
}

export function AccidentStatusBadge({ status }: StatusBadgeProps) {
  const config = {
    [AccidentStatus.REGISTRADO]: {
      className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Clock,
    },
    [AccidentStatus.EM_INVESTIGACAO]: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: FileSearch,
    },
    [AccidentStatus.CONCLUIDO]: {
      className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle,
    },
    [AccidentStatus.ARQUIVADO]: {
      className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
      icon: Archive,
    },
  };

  const Icon = config[status].icon;

  return (
    <Badge className={config[status].className}>
      <Icon className="h-3 w-3 mr-1" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

interface CorrectiveActionStatusBadgeProps {
  status: CorrectiveActionStatus;
}

export function CorrectiveActionStatusBadge({ status }: CorrectiveActionStatusBadgeProps) {
  const config = {
    [CorrectiveActionStatus.PENDENTE]: {
      className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Clock,
    },
    [CorrectiveActionStatus.EM_ANDAMENTO]: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Play,
    },
    [CorrectiveActionStatus.CONCLUIDA]: {
      className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle,
    },
    [CorrectiveActionStatus.CANCELADA]: {
      className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
      icon: XCircle,
    },
    [CorrectiveActionStatus.ATRASADA]: {
      className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
      icon: AlertCircle,
    },
  };

  const Icon = config[status].icon;

  return (
    <Badge className={config[status].className}>
      <Icon className="h-3 w-3 mr-1" />
      {CORRECTIVE_ACTION_STATUS_LABELS[status]}
    </Badge>
  );
}
