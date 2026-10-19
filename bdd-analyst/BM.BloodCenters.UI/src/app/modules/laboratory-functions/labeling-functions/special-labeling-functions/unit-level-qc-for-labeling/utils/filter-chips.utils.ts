import moment from 'moment';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { UnitLevelQCFilterValue } from '../models/unit-level-qc.model';

/**
 * Generates filter chips for active filters
 * @param filters Current filter values
 * @returns Array of filter chips to display
 */
export function generateFilterChips(filters: UnitLevelQCFilterValue): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.unitId) {
    chips.push({ key: 'unitId', label: `Unit ID: ${filters.unitId}`, value: filters.unitId });
  }

  if (filters.productCode) {
    chips.push({ key: 'productCode', label: `Product Code: ${filters.productCode}`, value: filters.productCode });
  }

  if (filters.qcLabelFlag && filters.qcLabelFlag !== 'All') {
    chips.push({ key: 'qcLabelFlag', label: `QC Label Flag: ${filters.qcLabelFlag}`, value: filters.qcLabelFlag });
  }

  if (filters.systemLabelDecision) {
    chips.push({ key: 'systemLabelDecision', label: `System Label Decision: ${filters.systemLabelDecision}`, value: filters.systemLabelDecision });
  }

  if (filters.abo && filters.abo !== 'All') {
    chips.push({ key: 'abo', label: `ABO: ${filters.abo}`, value: filters.abo });
  }

  if (filters.rh && filters.rh !== 'All') {
    chips.push({ key: 'rh', label: `Rh: ${filters.rh}`, value: filters.rh });
  }

  if (filters.status) {
    chips.push({ key: 'status', label: `Status: ${filters.status}`, value: filters.status });
  }

  if (filters.collDateFrom) {
    const val = moment(filters.collDateFrom).format('DD-MMM-YYYY').toUpperCase();
    chips.push({ key: 'collDateFrom', label: `Collection Date From: ${val}`, value: val });
  }

  if (filters.collDateTo) {
    const val = moment(filters.collDateTo).format('DD-MMM-YYYY').toUpperCase();
    chips.push({ key: 'collDateTo', label: `Collection Date To: ${val}`, value: val });
  }

  if (filters.labelDatsFrom) {
    const val = moment(filters.labelDatsFrom).format('DD-MMM-YYYY').toUpperCase();
    chips.push({ key: 'labelDatsFrom', label: `Label Date From: ${val}`, value: val });
  }

  if (filters.labelDatsTo) {
    const val = moment(filters.labelDatsTo).format('DD-MMM-YYYY').toUpperCase();
    chips.push({ key: 'labelDatsTo', label: `Label Date To: ${val}`, value: val });
  }

  return chips;
}

/**
 * Removes a filter based on chip key
 * @param filters Current filter values
 * @param key Filter key to remove
 * @returns Updated filter values
 */
export function removeFilterByKey(
  filters: UnitLevelQCFilterValue,
  key: string
): UnitLevelQCFilterValue {
  const updated = { ...filters };

  switch (key) {
    case 'unitId':
      updated.unitId = undefined;
      break;
    case 'productCode':
      updated.productCode = undefined;
      break;
    case 'qcLabelFlag':
      updated.qcLabelFlag = 'All';
      break;
    case 'systemLabelDecision':
      updated.systemLabelDecision = undefined;
      break;
    case 'abo':
      updated.abo = 'All';
      break;
    case 'rh':
      updated.rh = 'All';
      break;
    case 'status':
      updated.status = undefined;
      break;
    case 'collDateFrom':
      updated.collDateFrom = null;
      break;
    case 'collDateTo':
      updated.collDateTo = null;
      break;
    case 'labelDatsFrom':
      updated.labelDatsFrom = null;
      break;
    case 'labelDatsTo':
      updated.labelDatsTo = null;
      break;
  }

  return updated;
}

/**
 * Checks if any filters are active
 * @param filters Current filter values
 * @returns True if any filter is active
 */
export function hasActiveFilters(filters: UnitLevelQCFilterValue): boolean {
  return !!(
    filters.unitId ||
    filters.productCode ||
    (filters.qcLabelFlag && filters.qcLabelFlag !== 'All') ||
    filters.systemLabelDecision ||
    (filters.abo && filters.abo !== 'All') ||
    (filters.rh && filters.rh !== 'All') ||
    filters.status ||
    filters.collDateFrom ||
    filters.collDateTo ||
    filters.labelDatsFrom ||
    filters.labelDatsTo
  );
}

/**
 * Clears all filters
 * @returns Empty filter values
 */
export function clearAllFilters(): UnitLevelQCFilterValue {
  return {
    unitId: undefined,
    productCode: undefined,
    qcLabelFlag: 'All',
    systemLabelDecision: undefined,
    abo: 'All',
    rh: 'All',
    status: undefined,
    collDateFrom: null,
    collDateTo: null,
    labelDatsFrom: null,
    labelDatsTo: null
  };
}
