import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override-query.model';

export class LabelingInterdictionOverrideFilterChipsUtils {

  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private static periodToOperator(period: string | null | undefined): string {
    const normalized = period?.toLowerCase();
    if (normalized === 'after') return '≥';
    if (normalized === 'before') return '≤';
    return '=';
  }

  static convertFiltersToChips(filters: LabelingInterdictionOverrideFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.cue) {
      chips.push({
        key: 'cue',
        label: `Cue: ${filters.cueDisplay || filters.cue}`,
        value: filters.cue
      });
    }

    if (filters.type) {
      chips.push({
        key: 'type',
        label: `Type: ${filters.typeDisplay || filters.type}`,
        value: filters.type
      });
    }

    if (filters.effectiveDate) {
      const operator = this.periodToOperator(filters.effectiveDatePeriod);
      const dateStr = this.formatDate(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: String(filters.effectiveDate)
      });
    }

    if (filters.terminationDate) {
      const operator = this.periodToOperator(filters.terminationDatePeriod);
      const dateStr = this.formatDate(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: String(filters.terminationDate)
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: LabelingInterdictionOverrideFilterValue | null,
    chipKey: string
  ): LabelingInterdictionOverrideFilterValue | null {
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

  static hasActiveFilters(filters: LabelingInterdictionOverrideFilterValue | null): boolean {
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
