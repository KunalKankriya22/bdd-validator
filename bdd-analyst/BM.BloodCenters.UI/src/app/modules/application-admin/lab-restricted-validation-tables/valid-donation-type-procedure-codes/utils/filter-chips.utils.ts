import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidDonationTypeProcedureCodesFilterValue } from '../models/valid-donation-type-procedure-codes.model';

export class ValidDonationTypeProcedureCodesFilterChipsUtils {
  /**
   * Format date to display string
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: ValidDonationTypeProcedureCodesFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.donationType) {
      chips.push({
        key: 'donationType',
        label: `Donation Type: ${filters.donationType}`,
        value: filters.donationType
      });
    }

    if (filters.procedureCode) {
      chips.push({
        key: 'procedureCode',
        label: `Procedure Code: ${filters.procedureCode}`,
        value: filters.procedureCode
      });
    }

    if (filters.attributeGroup) {
      chips.push({
        key: 'attributeGroup',
        label: `Attribute Group: ${filters.attributeGroup}`,
        value: filters.attributeGroup
      });
    }

    if (filters.effectiveDate && filters.periodType1) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const symbol = filters.periodType1 === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.periodType2) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const symbol = filters.periodType2 === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: ValidDonationTypeProcedureCodesFilterValue | null,
    chipKey: string
  ): ValidDonationTypeProcedureCodesFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'donationType':
        updatedFilters.donationType = null;
        break;
      case 'procedureCode':
        updatedFilters.procedureCode = null;
        break;
      case 'attributeGroup':
        updatedFilters.attributeGroup = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.periodType1 = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.periodType2 = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: ValidDonationTypeProcedureCodesFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      filters.procedureCode ||
      filters.attributeGroup ||
      (filters.effectiveDate && filters.periodType1) ||
      (filters.terminationDate && filters.periodType2)
    );
  }
}
