import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { ContractFilterModel, ContractLookup, DropdownOption } from '../models/hospital-patient-testing-contract.model';
import moment from 'moment';

export class TestingContractFilterChipsUtils {

  private static formatDate(date: any): string {
    if (!date) return '';
    const m = moment.isMoment(date) ? date : moment(date);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : '';
  }

  static convertFiltersToChips(
    filters: ContractFilterModel | null,
    contracts: ContractLookup[],
    contractTypes: DropdownOption[]
  ): FilterChip[] {
    if (!filters) return [];

    const chips: FilterChip[] = [];

    if (filters.contractId) {
      const contract = contracts.find(c => c.contractId === filters.contractId);
      const displayValue = contract
        ? `${contract.contractId} - ${contract.description}`
        : filters.contractId;
      chips.push({
        key: 'contractId',
        label: `Contract ID: ${displayValue}`,
        value: filters.contractId
      });
    }

    if (filters.contractType) {
      const type = contractTypes.find(t => t.code === filters.contractType);
      const displayValue = type ? `${type.code} - ${type.description}` : filters.contractType;
      chips.push({
        key: 'contractType',
        label: `Contract Type: ${displayValue}`,
        value: filters.contractType
      });
    }

    if (filters.effDate) {
      const formattedDate = this.formatDate(filters.effDate);
      const symbol = filters.effDatePeriod === 'Before' ? '≤' : '≥';
      chips.push({
        key: 'effDate',
        label: `Effective Date ${symbol} ${formattedDate}`,
        value: filters.effDate
      });
    }

    if (filters.termDate) {
      const formattedDate = this.formatDate(filters.termDate);
      const symbol = filters.termDatePeriod === 'Before' ? '≤' : '≥';
      chips.push({
        key: 'termDate',
        label: `Termination Date ${symbol} ${formattedDate}`,
        value: filters.termDate
      });
    }

    return chips;
  }

  static removeFilterByChipKey(
    filters: ContractFilterModel | null,
    chipKey: string
  ): ContractFilterModel | null {
    if (!filters) return null;

    const updatedFilters = { ...filters };

    switch (chipKey) {
      case 'contractId':
        updatedFilters.contractId = null;
        break;
      case 'contractType':
        updatedFilters.contractType = null;
        break;
      case 'effDate':
        updatedFilters.effDatePeriod = 'After';
        updatedFilters.effDate = null;
        break;
      case 'termDate':
        updatedFilters.termDatePeriod = 'After';
        updatedFilters.termDate = null;
        break;
    }

    return this.hasActiveFilters(updatedFilters) ? updatedFilters : null;
  }

  static hasActiveFilters(filters: ContractFilterModel | null): boolean {
    if (!filters) return false;
    return !!(
      filters.contractId ||
      filters.contractType ||
      filters.effDate ||
      filters.termDate
    );
  }
}
