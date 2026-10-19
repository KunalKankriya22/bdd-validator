import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { StatusFilterValue } from '../models/findu.models';

export class FinduFilterChipsUtils {
  private static readonly YES_NO_LABELS: Record<string, string> = {
    'Y': 'Yes',
    'N': 'No'
  };

  static convertStatusFiltersToChips(filters: StatusFilterValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    const statusFilters: Array<{ key: keyof StatusFilterValue; label: string }> = [
      { key: 'expired', label: 'Expired' },
      { key: 'interdicted', label: 'Interdicted' },
      { key: 'available', label: 'Available' },
      { key: 'labeled', label: 'Labeled' },
      { key: 'rejected', label: 'Rejected' },
      { key: 'tested', label: 'Tested' },
      { key: 'shipped', label: 'Shipped' }
    ];

    statusFilters.forEach(({ key, label }) => {
      const value = filters[key] as string | null;
      if (value && (value === 'Y' || value === 'N')) {
        const displayValue = this.YES_NO_LABELS[value] || value;
        chips.push({
          key,
          label: `${label}: ${displayValue}`,
          value: displayValue
        });
      }
    });

    return chips;
  }

  static removeStatusFilterByChipKey(
    filters: StatusFilterValue | null,
    chipKey: string
  ): StatusFilterValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'expired':
        updatedFilters.expired = null;
        break;
      case 'interdicted':
        updatedFilters.interdicted = null;
        break;
      case 'available':
        updatedFilters.available = null;
        break;
      case 'labeled':
        updatedFilters.labeled = null;
        break;
      case 'rejected':
        updatedFilters.rejected = null;
        break;
      case 'tested':
        updatedFilters.tested = null;
        break;
      case 'shipped':
        updatedFilters.shipped = null;
        break;
    }

    return this.hasActiveStatusFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveStatusFilters(filters: StatusFilterValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.expired ||
      filters.interdicted ||
      filters.available ||
      filters.labeled ||
      filters.rejected ||
      filters.tested ||
      filters.shipped
    );
  }
}
