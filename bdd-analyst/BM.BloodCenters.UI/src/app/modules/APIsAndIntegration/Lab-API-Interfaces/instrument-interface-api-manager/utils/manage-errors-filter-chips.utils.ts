import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

export interface ManageErrorsFilterValue {
  machineTestId: string | null;
  effDatePeriod: string | null;
  effDate: Date | null;
  termDatePeriod: string | null;
  termDate: Date | null;
}

function periodToOperator(period: string | null | undefined): string {
  const normalized = period?.toLowerCase();
  if (normalized === 'after') return '≥';
  if (normalized === 'before') return '≤';
  return '=';
}

export function buildManageErrorsFilterChips(
  filters: ManageErrorsFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.machineTestId) {
    chips.push({
      key: 'machineTestId',
      label: `Machine Test ID: ${filters.machineTestId}`,
      value: filters.machineTestId,
      removable: true
    });
  }

  if (filters.effDate && filters.effDatePeriod) {
    const operator = periodToOperator(filters.effDatePeriod);
    const dateStr = moment(filters.effDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'effDate',
      label: `Effective Date ${operator} ${dateStr}`,
      value: filters.effDate,
      removable: true
    });
  }

  if (filters.termDate && filters.termDatePeriod) {
    const operator = periodToOperator(filters.termDatePeriod);
    const dateStr = moment(filters.termDate).format('DD-MMM-YYYY').toUpperCase();
    chips.push({
      key: 'termDate',
      label: `Termination Date ${operator} ${dateStr}`,
      value: filters.termDate,
      removable: true
    });
  }

  return chips;
}
