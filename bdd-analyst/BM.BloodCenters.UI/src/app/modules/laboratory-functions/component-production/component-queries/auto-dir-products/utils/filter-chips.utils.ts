import { FilterChip, AutoDirProductsFilterForm, SORT_ORDER_OPTIONS } from '../models/auto-dir-products.model';
import { formatTableDate } from '@shared/utils/date-format.util';

/**
 * Helper function to format date for display
 * @param date Date object or string
 * @returns Formatted date string
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '-';
  }
  if (date instanceof Date) {
    return formatTableDate(date.toISOString());
  }
  return formatTableDate(date);
}

/**
 * Generate filter chips from active filter form values
 * @param filters Current filter form values
 * @returns Array of filter chips to display
 */
export function generateFilterChips(filters: AutoDirProductsFilterForm): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.unitId) {
    chips.push({
      key: 'unitId',
      label: 'Unit ID',
      value: filters.unitId,
      removable: true
    });
  }

  if (filters.fromDate) {
    chips.push({
      key: 'fromDate',
      label: 'From Date',
      value: formatDate(filters.fromDate),
      removable: true
    });
  }

  if (filters.toDate) {
    chips.push({
      key: 'toDate',
      label: 'To Date',
      value: formatDate(filters.toDate),
      removable: true
    });
  }

  if (filters.needByDate) {
    chips.push({
      key: 'needByDate',
      label: 'Need By Date',
      value: formatDate(filters.needByDate),
      removable: true
    });
  }

  if (filters.surgeryDate) {
    chips.push({
      key: 'surgeryDate',
      label: 'Surgery Date',
      value: formatDate(filters.surgeryDate),
      removable: true
    });
  }

  if (filters.hospitalId) {
    chips.push({
      key: 'hospitalId',
      label: 'Hospital ID',
      value: filters.hospitalId,
      removable: true
    });
  }

  if (filters.patientId) {
    chips.push({
      key: 'patientId',
      label: 'Patient ID',
      value: filters.patientId,
      removable: true
    });
  }

  // Order By is not removable, always show
  const orderByOption = SORT_ORDER_OPTIONS.find(opt => opt.value === filters.orderBy);
  if (orderByOption) {
    chips.push({
      key: 'orderBy',
      label: 'Sort Order',
      value: orderByOption.label,
      removable: false
    });
  }

  return chips;
}

/**
 * Check if any search criteria is provided (excluding orderBy, take, skip)
 * @param filters Filter form values
 * @returns true if at least one criterion is set
 */
export function hasSearchCriteria(filters: AutoDirProductsFilterForm): boolean {
  return !!(
    filters.unitId ||
    filters.fromDate ||
    filters.toDate ||
    filters.needByDate ||
    filters.surgeryDate ||
    filters.hospitalId ||
    filters.patientId
  );
}
