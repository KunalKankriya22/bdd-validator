import { FilterChip } from '@shared/components/filter-chips/filter-chips';

export interface DefinePhysicalFindingsValuesFilterFormValue {
  operator: string | null;
  interdiction: string | null;
  manualAuditFindingsFlag: string | null;
  equipmentType: string | null;
  effectiveDate: Date | null;
  periodType: string | null;
  terminationDate: Date | null;
  terminationPeriodType: string | null;
}

export class DefinePhysicalFindingsValuesFilterChipsUtils {
  /**
   * Format date to display string (DD-MMM-YYYY format)
   */
  private static formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Convert period type to operator symbol
   */
  private static getPeriodOperator(periodType: string | null): string {
    if (periodType === 'After') return '≥';
    if (periodType === 'Before') return '≤';
    return periodType || '';
  }

  /**
   * Convert filter values to display chips
   */
  static convertFiltersToChips(filters: DefinePhysicalFindingsValuesFilterFormValue | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.operator) {
      chips.push({
        key: 'operator',
        label: `Operator: ${filters.operator}`,
        value: filters.operator
      });
    }

    if (filters.interdiction) {
      chips.push({
        key: 'interdiction',
        label: `Interdiction: ${filters.interdiction}`,
        value: filters.interdiction
      });
    }

    if (filters.manualAuditFindingsFlag) {
      chips.push({
        key: 'manualAuditFindingsFlag',
        label: `Manual Audit Find: ${filters.manualAuditFindingsFlag}`,
        value: filters.manualAuditFindingsFlag
      });
    }

    if (filters.equipmentType) {
      chips.push({
        key: 'equipmentType',
        label: `Equipment Type: ${filters.equipmentType}`,
        value: filters.equipmentType
      });
    }

    if (filters.effectiveDate && filters.periodType) {
      const formattedDate = this.formatDate(filters.effectiveDate);
      const operator = this.getPeriodOperator(filters.periodType);
      chips.push({
        key: 'effectiveDate',
        label: `Effective Date ${operator} ${formattedDate}`,
        value: filters.effectiveDate
      });
    }

    if (filters.terminationDate && filters.terminationPeriodType) {
      const formattedDate = this.formatDate(filters.terminationDate);
      const operator = this.getPeriodOperator(filters.terminationPeriodType);
      chips.push({
        key: 'terminationDate',
        label: `Termination Date ${operator} ${formattedDate}`,
        value: filters.terminationDate
      });
    }

    return chips;
  }

  /**
   * Remove a specific filter by chip key
   */
  static removeFilterByChipKey(
    filters: DefinePhysicalFindingsValuesFilterFormValue | null,
    chipKey: string
  ): DefinePhysicalFindingsValuesFilterFormValue | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'operator':
        updatedFilters.operator = null;
        break;
      case 'interdiction':
        updatedFilters.interdiction = null;
        break;
      case 'manualAuditFindingsFlag':
        updatedFilters.manualAuditFindingsFlag = null;
        break;
      case 'equipmentType':
        updatedFilters.equipmentType = null;
        break;
      case 'effectiveDate':
        updatedFilters.effectiveDate = null;
        updatedFilters.periodType = null;
        break;
      case 'terminationDate':
        updatedFilters.terminationDate = null;
        updatedFilters.terminationPeriodType = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  /**
   * Check if any filters are active
   */
  static hasActiveFilters(filters: DefinePhysicalFindingsValuesFilterFormValue | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.operator ||
      filters.interdiction ||
      filters.manualAuditFindingsFlag ||
      filters.equipmentType ||
      (filters.effectiveDate && filters.periodType) ||
      (filters.terminationDate && filters.terminationPeriodType)
    );
  }
}

