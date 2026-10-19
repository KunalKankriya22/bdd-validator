import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { HlaInterimOutputSearchParams } from '../models/hla-interim-output.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import moment from 'moment';

export class HlaInterimOutputFilterChipsUtils {
  static convertFiltersToChips(filters: HlaInterimOutputSearchParams | null): FilterChip[] {
    const chips: FilterChip[] = [];

    if (!filters) return chips;

    if (filters.matchA1A1) {
      chips.push({
        key: 'matchA1A1',
        label: `A1A1: ${filters.matchA1A1}`,
        value: filters.matchA1A1
      });
    }

    if (filters.matchA1A2) {
      chips.push({
        key: 'matchA1A2',
        label: `A1A2: ${filters.matchA1A2}`,
        value: filters.matchA1A2
      });
    }

    if (filters.outcomeAntigenA1) {
      chips.push({
        key: 'outcomeAntigenA1',
        label: `Outcome Antigen A1: ${filters.outcomeAntigenA1}`,
        value: filters.outcomeAntigenA1
      });
    }

    if (filters.matchA2A1) {
      chips.push({
        key: 'matchA2A1',
        label: `A2A1: ${filters.matchA2A1}`,
        value: filters.matchA2A1
      });
    }

    if (filters.matchA2A2) {
      chips.push({
        key: 'matchA2A2',
        label: `A2A2: ${filters.matchA2A2}`,
        value: filters.matchA2A2
      });
    }

    if (filters.outcomeAntigenA2) {
      chips.push({
        key: 'outcomeAntigenA2',
        label: `Outcome Antigen A2: ${filters.outcomeAntigenA2}`,
        value: filters.outcomeAntigenA2
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = DateFieldValidationUtility.formatDateForUI(moment(filters.effDate));
      const symbol = filters.effDatePeriod === 'After' ? '>' : '<';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol}: ${formattedDate}`,
        value: filters.effDate.toString()
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = DateFieldValidationUtility.formatDateForUI(moment(filters.termDate));
      const symbol = filters.termDatePeriod === 'After' ? '>' : '<';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${symbol}: ${formattedDate}`,
        value: filters.termDate.toString()
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: HlaInterimOutputSearchParams | null,
    chipKey: string
  ): HlaInterimOutputSearchParams | null {
    if (!filters) return null;

    const updated = { ...filters };

    switch (chipKey) {
      case 'matchA1A1':
        delete updated.matchA1A1;
        break;
      case 'matchA1A2':
        delete updated.matchA1A2;
        break;
      case 'outcomeAntigenA1':
        delete updated.outcomeAntigenA1;
        break;
      case 'matchA2A1':
        delete updated.matchA2A1;
        break;
      case 'matchA2A2':
        delete updated.matchA2A2;
        break;
      case 'outcomeAntigenA2':
        delete updated.outcomeAntigenA2;
        break;
      case 'effDate':
        delete updated.effDate;
        delete updated.effDatePeriod;
        break;
      case 'termDate':
        delete updated.termDate;
        delete updated.termDatePeriod;
        break;
    }

    const hasAnyFilter = Object.keys(updated).some(key => updated[key as keyof HlaInterimOutputSearchParams] !== undefined);
    return hasAnyFilter ? updated : null;
  }

  static hasActiveFilters(filters: HlaInterimOutputSearchParams | null): boolean {
    if (!filters) return false;
    return Object.keys(filters).some(key => filters[key as keyof HlaInterimOutputSearchParams] !== undefined);
  }
}
