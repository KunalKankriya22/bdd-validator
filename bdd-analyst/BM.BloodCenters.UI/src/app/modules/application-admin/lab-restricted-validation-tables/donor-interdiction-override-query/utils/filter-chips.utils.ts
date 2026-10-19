import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override-query.model';

export class DonorInterdictionOverrideFilterChipsUtils {

  private static readonly PERIOD_DISPLAY_MAP: Record<string, string> = {
    'After': '≥',
    'Before': '≤'
  };

  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static convertFiltersToChips(filters: DonorInterdictionOverrideFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.cue) {
      chips.push({
        key: 'cue',
        label: `Cue: ${filters.cue}`,
        value: filters.cue
      });
    }

    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.type}`,
        value: filters.type
      });
    }

    if (filters.effectiveDate) {
      const periodDisplay = filters.effectiveDatePeriod
        ? this.PERIOD_DISPLAY_MAP[filters.effectiveDatePeriod] || filters.effectiveDatePeriod
        : '=';
      const displayValue = `${periodDisplay} ${this.formatDate(filters.effectiveDate)}`;
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${displayValue}`,
        value: displayValue
      });
    }

    if (filters.terminationDate) {
      const periodDisplay = filters.terminationDatePeriod
        ? this.PERIOD_DISPLAY_MAP[filters.terminationDatePeriod] || filters.terminationDatePeriod
        : '=';
      const displayValue = `${periodDisplay} ${this.formatDate(filters.terminationDate)}`;
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${displayValue}`,
        value: displayValue
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DonorInterdictionOverrideFilterValue | null,
    chipKey: string
  ): DonorInterdictionOverrideFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'cue':
        updatedFilters.cue = null;
        break;
      case 'type':
        updatedFilters.type = null;
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

  static hasActiveFilters(filters: DonorInterdictionOverrideFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.cue ||
      filters.type ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
