import { FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { LabInterdictionOverrideFilterValue } from '../models/lab-interdiction-override.model';

export class FilterChipsUtils {
  static convertFiltersToChips(
    filters: LabInterdictionOverrideFilterValue,
    formatDate?: (date: string) => string
  ): FilterChip[] {
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

    if (filters.effectiveDate && filters.effectiveDatePeriod) {
      const formattedDate = formatDate ? formatDate(filters.effectiveDate) : filters.effectiveDate;
      const symbol = this.getDatePeriodSymbol(filters.effectiveDatePeriod);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationDatePeriod) {
      const formattedDate = formatDate ? formatDate(filters.terminationDate) : filters.terminationDate;
      const symbol = this.getDatePeriodSymbol(filters.terminationDatePeriod);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: LabInterdictionOverrideFilterValue,
    chipKey: string
  ): LabInterdictionOverrideFilterValue {
    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donorDecisionCode':
        delete updatedFilters.donorDecisionCode;
        delete updatedFilters.donorDecisionCodeDisplay;
        break;
      case 'interType':
        delete updatedFilters.interType;
        delete updatedFilters.interTypeDisplay;
        break;
      case 'effectiveDate':
        delete updatedFilters.effectiveDate;
        delete updatedFilters.effectiveDatePeriod;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDate;
        delete updatedFilters.terminationDatePeriod;
        break;
    }

    return updatedFilters;
  }

  static hasActiveFilters(filters: LabInterdictionOverrideFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.donorDecisionCode ||
      filters.interType ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }

  static getEmptyFilters(): LabInterdictionOverrideFilterValue {
    return {};
  }

  private static getDatePeriodSymbol(period: string): string {
    return period?.toLowerCase() === 'after' ? '≥' : '≤';
  }
}
