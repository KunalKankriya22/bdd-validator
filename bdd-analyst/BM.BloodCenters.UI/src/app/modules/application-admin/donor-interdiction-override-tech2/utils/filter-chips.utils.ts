import { FilterChip } from '../../../../shared/components/filter-chips/filter-chips';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';
import { getInterTypeDisplay } from '../../donor-interdiction-override/models/donor-interdiction-override.model';

export class FilterChipsUtils {
  static convertFiltersToChips(
    filters: DonorInterdictionOverrideFilterValue,
    formatDate?: (date: string) => string
  ): FilterChip[] {
    const chips: FilterChip[] = [];

    if (filters.donorDecisionCode) {
      const displayValue = filters.donorDecisionCodeDisplay || filters.donorDecisionCode;
      chips.push({
        key: 'donorDecisionCode',
        label: `Cue: ${displayValue}`,
        value: filters.donorDecisionCode
      });
    }

    if (filters.interType) {
      const displayValue = filters.interTypeDisplay || getInterTypeDisplay(filters.interType);
      chips.push({
        key: 'interType',
        label: `Type: ${displayValue}`,
        value: filters.interType
      });
    }

    if (filters.effectiveDate && filters.periodEffDate) {
      const formattedDate = formatDate ? formatDate(filters.effectiveDate) : filters.effectiveDate;
      const symbol = this.getDatePeriodSymbol(filters.periodEffDate);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.periodTermDate) {
      const formattedDate = formatDate ? formatDate(filters.terminationDate) : filters.terminationDate;
      const symbol = this.getDatePeriodSymbol(filters.periodTermDate);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: DonorInterdictionOverrideFilterValue,
    chipKey: string
  ): DonorInterdictionOverrideFilterValue {
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
        delete updatedFilters.periodEffDate;
        break;
      case 'terminationDate':
        delete updatedFilters.terminationDate;
        delete updatedFilters.periodTermDate;
        break;
    }

    return updatedFilters;
  }

  static hasActiveFilters(filters: DonorInterdictionOverrideFilterValue | null): boolean {
    if (!filters) return false;
    return !!(
      filters.donorDecisionCode ||
      filters.interType ||
      filters.effectiveDate ||
      filters.periodEffDate ||
      filters.terminationDate ||
      filters.periodTermDate
    );
  }

  static getEmptyFilters(): DonorInterdictionOverrideFilterValue {
    return {};
  }

  private static getDatePeriodSymbol(period: string): string {
    return period?.toLowerCase() === 'after' ? '≥' : '≤';
  }
}
