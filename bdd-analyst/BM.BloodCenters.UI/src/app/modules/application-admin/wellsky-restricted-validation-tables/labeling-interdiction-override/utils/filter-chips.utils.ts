import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { LabelingInterdictionOverrideFilterValue } from '../models/labeling-interdiction-override.model';

export class LabelingInterdictionOverrideFilterChipsUtils {

  static convertFiltersToChips(filters: LabelingInterdictionOverrideFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donorDecisionCode) {
      chips.push({
        key: 'donorDecisionCode',
        label: `Cue: ${filters.donorDecisionCodeDisplay || filters.donorDecisionCode}`,
        value: filters.donorDecisionCode
      });
    }

    if (filters.interType) {
      chips.push({
        key: 'interType',
        label: `Type: ${filters.interTypeDisplay || filters.interType}`,
        value: filters.interType
      });
    }

    if (filters.effectiveDate) {
      const operator = this.periodToOperator(filters.effectiveDatePeriod);
      const dateStr = this.formatDateForChip(filters.effectiveDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: dateStr
      });
    }

    if (filters.terminationDate) {
      const operator = this.periodToOperator(filters.terminationDatePeriod);
      const dateStr = this.formatDateForChip(filters.terminationDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: dateStr
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
      case 'donorDecisionCode':
        updatedFilters.donorDecisionCode = null;
        break;
      case 'interType':
        updatedFilters.interType = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDatePeriod = null;
        updatedFilters.effectiveDate = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDatePeriod = null;
        updatedFilters.terminationDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: LabelingInterdictionOverrideFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donorDecisionCode ||
      filters.interType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  private static periodToOperator(period: string | null | undefined): string {
    const normalized = period?.toLowerCase();
    if (normalized === 'after') return '≥';
    if (normalized === 'before') return '≤';
    return '=';
  }

  private static formatDateForChip(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
