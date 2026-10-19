import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProcessCodesFilterValue } from '../emf-processes';
import moment from 'moment';

function periodToOperator(period: string | null | undefined): string {
  const normalized = period?.toLowerCase();
  if (normalized === 'after') return '≥';
  if (normalized === 'before') return '≤';
  return '=';
}

export function buildEmfFilterChips(
  filters: ProcessCodesFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.effectiveDate && filters.effectiveDatePeriod) {
    const operator = periodToOperator(filters.effectiveDatePeriod);
    const dateStr = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'effectiveDate',
      label: `Effective Date ${operator} ${dateStr}`,
      value: filters.effectiveDate,
      removable: true
    });
  }

  if (filters.terminationDate && filters.terminationDatePeriod) {
    const operator = periodToOperator(filters.terminationDatePeriod);
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
