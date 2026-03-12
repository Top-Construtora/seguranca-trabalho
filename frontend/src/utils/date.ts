import { format as dateFnsFormat, parseISO, subDays as dateFnsSubDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a data/hora atual no fuso horário de São Paulo
 */
export function nowBR(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Retorna a data de hoje no formato yyyy-MM-dd (horário de SP)
 */
export function todayBR(): string {
  return dateFnsFormat(nowBR(), 'yyyy-MM-dd');
}

/**
 * Parse a date string from the backend to a Date object
 * without timezone conversion issues
 */
export function parseLocalDate(dateString: string): Date {
  // Se a string está no formato yyyy-MM-dd, cria a data localmente ao meio-dia
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Se tem timezone info (ISO string com T), converte para SP
  if (dateString.includes('T')) {
    return toZonedTime(parseISO(dateString), TIMEZONE);
  }

  // Fallback
  return new Date(dateString);
}

/**
 * Format a date string from the backend to a formatted string
 * Sempre usa locale pt-BR
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

/**
 * Formata a data/hora atual no formato especificado (horário de SP)
 */
export function formatNow(formatStr: string = 'dd/MM/yyyy'): string {
  return dateFnsFormat(nowBR(), formatStr, { locale: ptBR });
}

/**
 * subDays a partir de hoje no timezone correto
 */
export function subDaysBR(days: number): string {
  return dateFnsFormat(dateFnsSubDays(nowBR(), days), 'yyyy-MM-dd');
}
