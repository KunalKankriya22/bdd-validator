import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { SystemParameterFilterFormValue } from '../interfaces/view-system-parameter.interface';

export class SystemParameterFilterChipsUtils {

  static convertFiltersToChips(filters: SystemParameterFilterFormValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Parameter chip
    if (filters.parameter) {
      chips.push({
        key: 'parameter',
        label: `Parameter: ${filters.parameter}`,
        value: filters.parameter,
        removable: true
      });
    }

    // Effective date chip: "Effective Date ≥ date" or "Effective Date ≤ date"
    if (filters.effectiveDate && filters.effectivePeriod) {
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${this.formatDateForChip(filters.effectiveDate)}`,
        value: filters.effectiveDate,
        removable: true
      });
    }

    // Termination date chip: same pattern
    if (filters.terminationDate && filters.terminationPeriod) {
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${this.formatDateForChip(filters.terminationDate)}`,
        value: filters.terminationDate,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: SystemParameterFilterFormValue | null,
    chipKey: string
  ): SystemParameterFilterFormValue | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'parameter':
        updated.parameter = null;
        break;
      case 'effectiveDate':
        updated.effectivePeriod = null;
        updated.effectiveDate = null;
        break;
      case 'terminationDate':
        updated.terminationPeriod = null;
        updated.terminationDate = null;
        break;
    }

    return this.hasActiveFilters(updated) ? updated : null;
  }

  static hasActiveFilters(filters: SystemParameterFilterFormValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.parameter ||
      (filters.effectiveDate && filters.effectivePeriod) ||
      (filters.terminationDate && filters.terminationPeriod)
    );
  }

  static getEmptyFilters(): SystemParameterFilterFormValue {
    return {
      parameter: null,
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    };
  }

  private static formatDateForChip(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = months[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }
}
