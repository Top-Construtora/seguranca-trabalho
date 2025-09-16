/**
 * Format a number as Brazilian currency (R$ 1.234,00)
 * @param value - The numeric value to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  // Format with Brazilian locale
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a Brazilian currency string back to number
 * @param value - The currency string to parse (e.g., "R$ 1.234,00")
 * @returns Numeric value
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove currency symbol and spaces
  const cleanValue = value.replace(/R\$\s?/, '').trim();

  // Replace Brazilian format (1.234,00) to standard format (1234.00)
  const standardFormat = cleanValue
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Replace decimal comma with dot

  return parseFloat(standardFormat) || 0;
}