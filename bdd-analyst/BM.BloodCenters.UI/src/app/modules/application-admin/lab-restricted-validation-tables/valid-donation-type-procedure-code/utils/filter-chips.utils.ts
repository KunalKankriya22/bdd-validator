import { FilterChip, DonationTypeProcedureCodeFilterValue } from '../models/valid-donation-type-procedure-code.model';
import moment from 'moment';

/**
 * Convert filter values to display chips
 */
export function convertFiltersToChips(filters: DonationTypeProcedureCodeFilterValue | null): FilterChip[] {
  if (!filters) {
    return [];
  }

  const chips: FilterChip[] = [];

  if (filters.donationType) {
    chips.push({
      key: 'donationType',
      label: `Donation Type: ${filters.donationType}`,
      value: filters.donationType,
      removable: true
    });
  }

  if (filters.procedureCode) {
    chips.push({
      key: 'procedureCode',
      label: `Procedure Code: ${filters.procedureCode}`,
      value: filters.procedureCode,
      removable: true
    });
  }

  if (filters.attributeGroup) {
    chips.push({
      key: 'attributeGroup',
      label: `Attribute Group: ${filters.attributeGroup}`,
      value: filters.attributeGroup,
      removable: true
    });
  }

  if (filters.effectiveDate && filters.period) {
    const formattedDate = moment(filters.effectiveDate).format('DD-MMM-YYYY');
    const operator = filters.period === 'After' ? '≥' : '≤';
    chips.push({
      key: 'effectiveDate',
      label: `Effective Date ${operator} ${formattedDate}`,
      value: filters.effectiveDate,
      removable: true
    });
  }

  if (filters.terminationDate && filters.terminationPeriod) {
    const formattedDate = moment(filters.terminationDate).format('DD-MMM-YYYY');
    const operator = filters.terminationPeriod === 'After' ? '≥' : '≤';
    chips.push({
      key: 'terminationDate',
      label: `Termination Date ${operator} ${formattedDate}`,
      value: filters.terminationDate,
      removable: true
    });
  }

  return chips;
}

/**
 * Remove a specific filter by chip key
 */
export function removeFilterByChipKey(
  filters: DonationTypeProcedureCodeFilterValue | null,
  chipKey: string
): DonationTypeProcedureCodeFilterValue | null {
  if (!filters) {
    return null;
  }

  const updatedFilters: DonationTypeProcedureCodeFilterValue = { ...filters };

  switch (chipKey) {
    case 'donationType':
      updatedFilters.donationType = null;
      break;
    case 'procedureCode':
      updatedFilters.procedureCode = null;
      break;
    case 'attributeGroup':
      updatedFilters.attributeGroup = null;
      break;
    case 'effectiveDate':
      updatedFilters.effectiveDate = null;
      updatedFilters.period = null;
      break;
    case 'terminationDate':
      updatedFilters.terminationDate = null;
      updatedFilters.terminationPeriod = null;
      break;
  }

  // If no filters remain, return null
  if (!hasActiveFilters(updatedFilters)) {
    return null;
  }

  return updatedFilters;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: DonationTypeProcedureCodeFilterValue | null): boolean {
  if (!filters) {
    return false;
  }

  return !!(
    filters.donationType ||
    filters.procedureCode ||
    filters.attributeGroup ||
    (filters.effectiveDate && filters.period) ||
    (filters.terminationDate && filters.terminationPeriod)
  );
}
