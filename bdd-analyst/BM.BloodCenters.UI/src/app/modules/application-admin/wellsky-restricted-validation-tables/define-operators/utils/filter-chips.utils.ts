import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidOperatorFilterValue, VALUE_STYLE_LABELS } from '../models/define-operators.model';
import { formatTableDate } from '@shared/utils/date-format.util';

export class DefineOperatorsFilterChipsUtils {

  static convertFiltersToChips(filters: ValidOperatorFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.valueStyle) {
      const displayLabel = VALUE_STYLE_LABELS[filters.valueStyle] || filters.valueStyle;
      chips.push({
        key: 'valueStyle',
        label: `Values: ${displayLabel}`,
        value: filters.valueStyle
      });
    }

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = formatTableDate(filters.effectiveDate);
      const periodLabel = filters.effectiveDatePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${periodLabel} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = formatTableDate(filters.terminationDate);
      const periodLabel = filters.terminationDatePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${periodLabel} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidOperatorFilterValue | null,
    chipKey: string
  ): ValidOperatorFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'valueStyle':
        updatedFilters.valueStyle = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectiveDatePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationDatePeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidOperatorFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.valueStyle ||
      (filters.effectiveDate && filters.effectiveDatePeriod) ||
      (filters.terminationDate && filters.terminationDatePeriod)
    );
  }
}
