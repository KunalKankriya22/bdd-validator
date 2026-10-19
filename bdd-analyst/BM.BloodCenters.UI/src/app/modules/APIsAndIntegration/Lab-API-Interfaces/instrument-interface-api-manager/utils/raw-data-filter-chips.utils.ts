import { FilterChip } from '@shared/components/filter-chips/filter-chips';

export interface RawDataFilterValue {
  fileId: string | null;
}

export function buildRawDataFilterChips(
  filters: RawDataFilterValue
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.fileId) {
    chips.push({
      key: 'fileId',
      label: `File ID: ${filters.fileId}`,
      value: filters.fileId,
      removable: true
    });
  }

  return chips;
}
