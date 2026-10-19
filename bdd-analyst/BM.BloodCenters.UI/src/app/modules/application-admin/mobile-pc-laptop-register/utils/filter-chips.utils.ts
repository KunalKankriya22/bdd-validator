import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { MobilePcLaptopRegisterFilterValue } from '../models/mobile-pc-laptop-register.model';

export class MobilePcLaptopRegisterFilterChipsUtils {
  static convertFiltersToChips(filters: MobilePcLaptopRegisterFilterValue | null): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.chapter) {
      chips.push({
        key: 'chapter',
        label: `Chapter: ${filters.chapter}`,
        value: filters.chapter
      });
    }

    if (filters.period) {
      chips.push({
        key: 'period',
        label: 'Period',
        value: filters.period
      });
    }

    if (filters.refreshDate) {
      const formattedDate = MobilePcLaptopRegisterFilterChipsUtils.formatDate(filters.refreshDate);
      chips.push({
        key: 'refreshDate',
        label: 'Refresh Date',
        value: formattedDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: MobilePcLaptopRegisterFilterValue | null,
    chipKey: string
  ): MobilePcLaptopRegisterFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'chapter':
        delete updatedFilters.chapter;
        break;
      case 'period':
        delete updatedFilters.period;
        break;
      case 'refreshDate':
        delete updatedFilters.refreshDate;
        break;
    }

    // Return null if no filters remain
    const hasFilters = Object.keys(updatedFilters).some(
      key => updatedFilters[key as keyof MobilePcLaptopRegisterFilterValue] !== undefined
    );

    return hasFilters ? updatedFilters : null;
  }

  static hasActiveFilters(filters: MobilePcLaptopRegisterFilterValue | null): boolean {
    if (!filters) return false;

    return Object.keys(filters).some(
      key => filters[key as keyof MobilePcLaptopRegisterFilterValue] !== undefined &&
             filters[key as keyof MobilePcLaptopRegisterFilterValue] !== null &&
             filters[key as keyof MobilePcLaptopRegisterFilterValue] !== ''
    );
  }

  private static formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
