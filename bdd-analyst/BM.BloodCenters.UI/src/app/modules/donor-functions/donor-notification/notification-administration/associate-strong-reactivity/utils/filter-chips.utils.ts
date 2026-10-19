import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { StrongReactivityFilterValue } from '../models/strong-reactivity.model';
import moment from 'moment';

function periodToOperator(period: string | null | undefined): string {
  const normalized = period?.toLowerCase();
  if (normalized === 'after') return '≥';
  if (normalized === 'before') return '≤';
  return '=';
}

export function buildStrongReactivityFilterChips(
  filters: StrongReactivityFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.bound) {
    const boundLabel = filters.bound === 'S' ? 'Strong' : filters.bound === 'C' ? 'Cross' : filters.bound;
    chips.push({
      key: 'bound',
      label: `Bond: ${boundLabel}`,
      value: filters.bound,
      removable: true
    });
  }

  if (filters.effectiveDate && filters.effectivePeriod) {
    const operator = periodToOperator(filters.effectivePeriod);
    const dateStr = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'effectiveDate',
      label: `Effective Date ${operator} ${dateStr}`,
      value: filters.effectiveDate,
      removable: true
    });
  }

  if (filters.terminationDate && filters.terminationPeriod) {
    const operator = periodToOperator(filters.terminationPeriod);
    const dateStr = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'terminationDate',
      label: `Termination Date ${operator} ${dateStr}`,
      value: filters.terminationDate,
      removable: true
    });
  }

  return chips;
}
