import { format as dateFnsFormat, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Parse a date string from the backend (yyyy-MM-dd) to a Date object
 * without timezone conversion issues
 */
export function parseLocalDate(dateString: string): Date {
  // Se a string está no formato yyyy-MM-dd, cria a data localmente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Se tem timezone info, usa parseISO
  if (dateString.includes('T')) {
    return parseISO(dateString);
  }

  // Fallback para o construtor padrão
  return new Date(dateString);
}

/**
 * Format a date string from the backend to a formatted string
 */
export function formatDate(dateString: string | undefined | null, formatStr: string = 'dd/MM/yyyy', options?: any): string {
  if (!dateString) return '-';
  try {
    const date = parseLocalDate(dateString);
    return dateFnsFormat(date, formatStr, { locale: ptBR, ...options });
  } catch {
    return '-';
  }
}