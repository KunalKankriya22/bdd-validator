import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { BarCodeTranslationFilterValue } from '../models/bar-code-translations.model';
import { formatTableDate } from 'src/app/modules/system-administration/application-sequence-numbers/utils/table-display.util';

export class BarCodeTranslationsFilterChipsUtils {

  static convertFiltersToChips(filters: BarCodeTranslationFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.machineCode) {
      chips.push({
        key: 'machineCode',
        label: `Machine Code: ${filters.machineCode}`,
        value: filters.machineCode
      });
    }

    if (filters.eyeReadTrns) {
      chips.push({
        key: 'eyeReadTrns',
        label: `Eye Read Translation: ${filters.eyeReadTrns.trim()}`,
        value: filters.eyeReadTrns
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const formattedDate = formatTableDate(filters.effDate);
      const symbol = filters.effDatePeriod === 'BEFORE' ? '≤' : '≥';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const formattedDate = formatTableDate(filters.termDate);
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
    filters: BarCodeTranslationFilterValue | null,
    chipKey: string
  ): BarCodeTranslationFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'machineCode':
        updatedFilters.machineCode = null;
        break;
      case 'eyeReadTrns':
        updatedFilters.eyeReadTrns = null;
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

  static hasActiveFilters(filters: BarCodeTranslationFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.machineCode ||
      filters.eyeReadTrns ||
      (filters.effDate && filters.effDatePeriod) ||
      (filters.termDate && filters.termDatePeriod)
    );
  }
}
