import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { DonProcConsentDefinitionFilterValue } from '../models/don-proc-consent-definition.model';

export class DonProcConsentDefinitionFilterChipsUtils {
  static convertFiltersToChips(
    filters: DonProcConsentDefinitionFilterValue | null,
    formatDate?: (date: string) => string
  ): FilterChip[] {
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

    if (filters.consentCode) {
      chips.push({
        key: 'consentCode',
        label: `Consent Code: ${filters.consentCode}`,
        value: filters.consentCode
      });
    }

    if (filters.effectiveDate) {
      const formattedDate = formatDate ? formatDate(filters.effectiveDate) : filters.effectiveDate;
      const period = filters.effectiveDatePeriod || 'After';
      const symbol = this.periodToOperator(period);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate) {
      const formattedDate = formatDate ? formatDate(filters.terminationDate) : filters.terminationDate;
      const period = filters.terminationDatePeriod || 'Before';
      const symbol = this.periodToOperator(period);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  private static periodToOperator(period: string | null | undefined): string {
    const normalized = period?.toLowerCase();
    if (normalized === 'after') return '≥';
    if (normalized === 'before') return '≤';
    return '=';
  }

  static removeFilterByChipKey(
    filters: DonProcConsentDefinitionFilterValue | null,
    chipKey: string
  ): DonProcConsentDefinitionFilterValue | null {
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
      case 'consentCode':
        updatedFilters.consentCode = null;
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

  static hasActiveFilters(filters: DonProcConsentDefinitionFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.donationType ||
      filters.procedureCode ||
      filters.consentCode ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
