import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ErrorCodeFilter, getErrorTypeDisplayName, ErrorType, AuditFlag } from '../models/error-code.model';

export class ErrorCodeFilterChipsUtils {
  static convertFiltersToChips(filters: ErrorCodeFilter | null): FilterChip[] {
    if (!filters) {
      return [];
    }

    const chips: FilterChip[] = [];

    if (filters.codeFrom || filters.codeTo) {
      const rangeLabel = filters.codeFrom && filters.codeTo
        ? `Code: ${filters.codeFrom} - ${filters.codeTo}`
        : filters.codeFrom
          ? `Code From: ${filters.codeFrom}`
          : `Code To: ${filters.codeTo}`;

      chips.push({
        key: 'codeRange',
        label: rangeLabel,
        value: { from: filters.codeFrom, to: filters.codeTo },
        removable: true
      });
    }

    if (filters.errorType) {
      const typeLabel = getErrorTypeDisplayName(filters.errorType as ErrorType);
      chips.push({
        key: 'errorType',
        label: `Type: ${typeLabel}`,
        value: filters.errorType,
        removable: true
      });
    }

    if (filters.auditFlag) {
      const auditLabel = filters.auditFlag === 'Y' ? 'Yes' : 'No';
      chips.push({
        key: 'auditFlag',
        label: `Audit: ${auditLabel}`,
        value: filters.auditFlag,
        removable: true
      });
    }

    if (filters.showEmpty) {
      chips.push({
        key: 'showEmpty',
        label: 'Show Empty Records',
        value: filters.showEmpty,
        removable: true
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ErrorCodeFilter | null,
    chipKey: string
  ): ErrorCodeFilter | null {
    if (!filters) {
      return null;
    }

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'codeRange':
        updatedFilters.codeFrom = '';
        updatedFilters.codeTo = '';
        break;
      case 'errorType':
        updatedFilters.errorType = null;
        break;
      case 'auditFlag':
        updatedFilters.auditFlag = null;
        break;
      case 'showEmpty':
        updatedFilters.showEmpty = false;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ErrorCodeFilter | null): boolean {
    if (!filters) {
      return false;
    }

    return !!(
      filters.codeFrom ||
      filters.codeTo ||
      filters.errorType ||
      filters.auditFlag ||
      filters.showEmpty
    );
  }
}
