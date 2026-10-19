import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ProductAttributeFilterValue } from '../models/product-attribute.model';

/**
 * Utility class for converting filter values to filter chips and vice versa
 * Used for Product Type Attributes (ISBT/Codabar) feature
 */
export class FilterChipsUtils {
  /**
   * Convert filter values to filter chips for display
   * @param filters The current filter values
   * @param formatDate Optional function to format date strings
   * @returns Array of filter chips
   */
  static convertFiltersToChips(
    filters: ProductAttributeFilterValue | null,
    formatDate?: (date: string | null) => string
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.productType) {
      chips.push({
        key: 'productType',
        label: `Product Type: ${filters.productType}`,
        value: filters.productType
      });
    }

    if (filters.attribGroup) {
      chips.push({
        key: 'attribGroup',
        label: `Attribute Group: ${filters.attribGroup}`,
        value: filters.attribGroup
      });
    }

    if (filters.attribCode) {
      chips.push({
        key: 'attribCode',
        label: `Attribute Code: ${filters.attribCode}`,
        value: filters.attribCode
      });
    }

    if (filters.labelFlag) {
      const labelFlagDisplay = filters.labelFlag === 'Y' ? 'Yes' : 'No';
      chips.push({
        key: 'labelFlag',
        label: `Required for Labeling: ${labelFlagDisplay}`,
        value: labelFlagDisplay
      });
    }

    if (filters.lifeSpanInd) {
      const lifeSpanIndMap: Record<string, string> = {
        'H': 'Hours',
        'D': 'Days',
        'Y': 'Years'
      };
      const lifeSpanDisplay = lifeSpanIndMap[filters.lifeSpanInd] || filters.lifeSpanInd;
      chips.push({
        key: 'lifeSpanInd',
        label: `Life Span Indicator: ${lifeSpanDisplay}`,
        value: lifeSpanDisplay
      });
    }

    if (filters.effDate && filters.effDatePeriod) {
      const dateStr = typeof filters.effDate === 'object' && filters.effDate.format
        ? filters.effDate.format('DD-MMM-YYYY') : filters.effDate;
      chips.push({
        key: 'effDate',
        label: `Effective Date ${filters.effDatePeriod === 'AFTER' ? '≥' : '≤'} ${dateStr}`,
        value: `${filters.effDatePeriod}:${dateStr}`,
        removable: true
      });
    }

    if (filters.termDate && filters.termDatePeriod) {
      const dateStr = typeof filters.termDate === 'object' && filters.termDate.format
        ? filters.termDate.format('DD-MMM-YYYY') : filters.termDate;
      chips.push({
        key: 'termDate',
        label: `Termination Date ${filters.termDatePeriod === 'AFTER' ? '≥' : '≤'} ${dateStr}`,
        value: `${filters.termDatePeriod}:${dateStr}`,
        removable: true
      });
    }

    return chips;
  }

  /**
   * Remove a filter by chip key
   * @param filters Current filter values
   * @param chipKey The key of the chip to remove
   * @returns Updated filter values with the specified filter removed
   */
  static removeFilterByChipKey(
    filters: ProductAttributeFilterValue | null,
    chipKey: string
  ): ProductAttributeFilterValue | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'productType':
        delete updatedFilters.productType;
        break;
      case 'attribGroup':
        delete updatedFilters.attribGroup;
        break;
      case 'attribCode':
        delete updatedFilters.attribCode;
        break;
      case 'labelFlag':
        delete updatedFilters.labelFlag;
        break;
      case 'lifeSpanInd':
        delete updatedFilters.lifeSpanInd;
        break;
      case 'effDate':
        delete updatedFilters.effDate;
        delete updatedFilters.effDatePeriod;
        break;
      case 'termDate':
        delete updatedFilters.termDate;
        delete updatedFilters.termDatePeriod;
        break;
    }

    // Return null if no filters remain
    return Object.keys(updatedFilters).length > 0 ? updatedFilters : null;
  }

  /**
   * Check if there are any active filters
   * @param filters Current filter values
   * @returns True if there are active filters, false otherwise
   */
  static hasActiveFilters(filters: ProductAttributeFilterValue | null): boolean {
    if (!filters) return false;

    return !!(
      filters.productType ||
      filters.attribGroup ||
      filters.attribCode ||
      filters.labelFlag ||
      filters.lifeSpanInd ||
      filters.effDate ||
      filters.termDate
    );
  }
}
