import { AlternateIdSearchParams, ALTID_MATCH_TYPE_OPTIONS } from '../models/alternate-id.model';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import moment from 'moment';

export class AlternateIdFilterChipsUtils {

  static convertFiltersToChips(filters: AlternateIdSearchParams | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    // Key Grade chip
    if (filters.keyDataGrade) {
      chips.push({
        key: 'keyDataGrade',
        label: `Key Grade: ${filters.keyDataGrade}`,
        value: filters.keyDataGrade,
      });
    }

    // Alternate ID Match chip
    if (filters.altidMatchType) {
      const option = ALTID_MATCH_TYPE_OPTIONS.find(opt => opt.value === filters.altidMatchType);
      const displayLabel = option ? option.label : filters.altidMatchType;
      chips.push({
        key: 'altidMatchType',
        label: `Alternate ID Match: ${displayLabel}`,
        value: filters.altidMatchType,
      });
    }

    // Final Grade chip
    if (filters.finalGrade) {
      chips.push({
        key: 'finalGrade',
        label: `Final Grade: ${filters.finalGrade}`,
        value: filters.finalGrade,
      });
    }

    // Effective Date chip
    if (filters.effDate && filters.effDatePeriod) {
      const operator = this.periodToOperator(filters.effDatePeriod);
      const dateStr = moment(filters.effDate).format('DD-MMM-YYYY');
      chips.push({
        key: 'effDate',
        label: `Effective Date ${operator} ${dateStr}`,
        value: filters.effDate,
      });
    }

    // Termination Date chip
    if (filters.termDate && filters.termDatePeriod) {
      const operator = this.periodToOperator(filters.termDatePeriod);
      const dateStr = moment(filters.termDate).format('DD-MMM-YYYY');
      chips.push({
        key: 'termDate',
        label: `Termination Date ${operator} ${dateStr}`,
        value: filters.termDate,
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
    filters: AlternateIdSearchParams | null,
    chipKey: string
  ): AlternateIdSearchParams | null {
    if (!filters) return null;

    const updated = { ...filters };

    if (chipKey === 'keyDataGrade') {
      delete updated.keyDataGrade;
    } else if (chipKey === 'altidMatchType') {
      delete updated.altidMatchType;
    } else if (chipKey === 'finalGrade') {
      delete updated.finalGrade;
    } else if (chipKey === 'effDate') {
      delete updated.effDate;
      delete updated.effDatePeriod;
    } else if (chipKey === 'termDate') {
      delete updated.termDate;
      delete updated.termDatePeriod;
    }

    return this.hasActiveFilters(updated) ? updated : null;
  }

  static hasActiveFilters(filters: AlternateIdSearchParams | null): boolean {
    if (!filters) return false;
    return !!(
      filters.keyDataGrade ||
      filters.altidMatchType ||
      filters.finalGrade ||
      filters.effDate ||
      filters.termDate
    );
  }
}
