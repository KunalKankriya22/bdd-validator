import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { PathogenReductionProcessConfigurationFilterValue } from '../models/pathogen-reduction-process-configuration.model';
import moment from 'moment';

export class PathogenReductionProcessConfigurationFilterChipsUtils {

  static convertFiltersToChips(filters: PathogenReductionProcessConfigurationFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.volumeTypeSet) {
      chips.push({
        key: 'volumeTypeSet',
        label: `Volume Type Set: ${filters.volumeTypeSet}`,
        value: filters.volumeTypeSet
      });
    }

    if (filters.suspensionType) {
      chips.push({
        key: 'suspensionType',
        label: `Suspension Type: ${filters.suspensionType}`,
        value: filters.suspensionType
      });
    }

    if (filters.equipType) {
      chips.push({
        key: 'equipType',
        label: `Equipment Type: ${filters.equipType}`,
        value: filters.equipType
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = this.formatDate(filters.effDate);
      const symbol = filters.effDatePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = this.formatDate(filters.termDate);
      const symbol = filters.termDatePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.termDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: PathogenReductionProcessConfigurationFilterValue | null,
    chipKey: string
  ): PathogenReductionProcessConfigurationFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'volumeTypeSet':
        updatedFilters.volumeTypeSet = null;
        break;
      case 'suspensionType':
        updatedFilters.suspensionType = null;
        break;
      case 'equipType':
        updatedFilters.equipType = null;
        break;
      case 'effDate':
        updatedFilters.effDate = null;
        updatedFilters.effDatePeriod = null;
        break;
      case 'termDate':
        updatedFilters.termDate = null;
        updatedFilters.termDatePeriod = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: PathogenReductionProcessConfigurationFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.volumeTypeSet ||
      filters.suspensionType ||
      filters.equipType ||
      (filters.effDate && filters.effDatePeriod) ||
      (filters.termDate && filters.termDatePeriod)
    );
  }

  private static formatDate(dateStr: string): string {
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateStr;
  }
}
