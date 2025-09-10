import { format, getQuarter } from 'date-fns';

export default function generateStartPeriod(frequency: string): string {
  const today = new Date();

  switch (frequency.toLowerCase()) {
    case 'minute':
      return format(today, 'yyyy-MM-dd HH:mm');
    case 'hourly':
      return format(today, 'yyyy-MM-dd HH:00');
    case 'daily':
      return format(today, 'yyyy-MM-dd');
    case 'weekly':
    case 'biweekly':
      return `${format(today, 'yyyy')}-W${format(today, 'ww')}`;
    case 'monthly':
    case 'bimonthly':
      return format(today, 'yyyy-MM');
    case 'quarterly':
    case 'triannual':
    case 'semiannual':
      return `${today.getFullYear()}-Q${getQuarter(today)}`;
    case 'annual':
      return today.getFullYear().toString();
    default:
      return format(today, 'yyyy-MM');
  }
}
