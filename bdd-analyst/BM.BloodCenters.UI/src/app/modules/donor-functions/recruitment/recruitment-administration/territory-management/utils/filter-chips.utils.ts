import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { TerritoryFilterValue } from '../models/territory.model';
import moment from 'moment';

function periodToOperator(period: string | null | undefined): string {
  const normalized = period?.toLowerCase();
  if (normalized === 'after') return '≥';
  if (normalized === 'before') return '≤';
  return '=';
}

export function buildTerritoryFilterChips(
  filters: TerritoryFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.showTerminated) {
    chips.push({
      key: 'showTerminated',
      label: 'Show Terminated',
      value: true,
      removable: true
    });
  }

  if (filters.territoryGroup) {
    chips.push({
      key: 'territoryGroup',
      label: `Group: ${filters.territoryGroup}`,
      value: filters.territoryGroup,
      removable: true
    });
  }

  if (filters.territoryType) {
    chips.push({
      key: 'territoryType',
      label: `Type: ${filters.territoryType}`,
      value: filters.territoryType,
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
