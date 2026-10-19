import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ValidFfFlagFilterValue } from '../models/valid-ff-flag.model';
import moment from 'moment';

export class ValidFfFlagFilterChipsUtils {
  static convertFiltersToChips(filters: ValidFfFlagFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.collectionFacilityId) {
      chips.push({
        key: 'collectionFacilityId',
        label: `Collection Facility ID: ${filters.collectionFacilityIdDisplay || filters.collectionFacilityId}`,
        value: filters.collectionFacilityId
      });
    }

    if (filters.sourceType) {
      chips.push({
        key: 'sourceType',
        label: `Source Type: ${filters.sourceTypeDisplay || filters.sourceType}`,
        value: filters.sourceType
      });
    }

    if (filters.ffFlagValue) {
      chips.push({
        key: 'ffFlagValue',
        label: `FF Flag Value: ${filters.ffFlagValueDisplay || filters.ffFlagValue}`,
        value: filters.ffFlagValue
      });
    }

    if (filters.effectiveDate && filters.effectivePeriod) {
      const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.effectivePeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriod) {
      const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY').toUpperCase();
      const symbol = filters.terminationPeriod === 'After' ? '≥' : '≤';
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ValidFfFlagFilterValue | null,
    chipKey: string
  ): ValidFfFlagFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'collectionFacilityId':
        updatedFilters.collectionFacilityId = null;
        break;
      case 'sourceType':
        updatedFilters.sourceType = null;
        break;
      case 'ffFlagValue':
        updatedFilters.ffFlagValue = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.effectivePeriod = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ValidFfFlagFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.collectionFacilityId ||
      filters.sourceType ||
      filters.ffFlagValue ||
      filters.effectiveDate ||
      filters.terminationDate
    );
  }
}
