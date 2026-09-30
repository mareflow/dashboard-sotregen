import type { DatePreset, DateRange } from '../types/metaAds';

/**
 * Format number to Brazilian Real (BRL)
 * Example: 1234.56 -> "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 * Example: 2.35 -> "2,35%"
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0,00%';
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

/**
 * Format standard integers or counts
 * Example: 14520 -> "14.520"
 */
export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

/**
 * Format ISO date string or Date object to YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD to pt-BR DD/MM/YYYY
 */
export function formatDateBR(isoDateString: string): string {
  if (!isoDateString) return '';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateString;
}

/**
 * Get date range for preset options
 */
export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  const until = toISODate(today);

  switch (preset) {
    case '7d': {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      return { since: toISODate(past), until };
    }
    case '14d': {
      const past = new Date(today);
      past.setDate(today.getDate() - 13);
      return { since: toISODate(past), until };
    }
    case '30d': {
      const past = new Date(today);
      past.setDate(today.getDate() - 29);
      return { since: toISODate(past), until };
    }
    case 'this_month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { since: toISODate(firstDay), until };
    }
    case 'last_month': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        since: toISODate(firstDayLastMonth),
        until: toISODate(lastDayLastMonth),
      };
    }
    case 'custom':
    default: {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      return { since: toISODate(past), until };
    }
  }
}
