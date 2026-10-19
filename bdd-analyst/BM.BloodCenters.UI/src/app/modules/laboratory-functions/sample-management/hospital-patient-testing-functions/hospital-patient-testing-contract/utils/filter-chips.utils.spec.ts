import { TestingContractFilterChipsUtils } from './filter-chips.utils';
import { ContractFilterModel, ContractLookup, DropdownOption } from '../models/hospital-patient-testing-contract.model';
import moment from 'moment';

describe('TestingContractFilterChipsUtils', () => {
  const mockContracts: ContractLookup[] = [
    { contractId: 'TC001', description: 'Testing Contract One' } as ContractLookup,
    { contractId: 'TC002', description: 'Testing Contract Two' } as ContractLookup,
  ];

  const mockContractTypes: DropdownOption[] = [
    { code: 'LAB', description: 'Laboratory' } as DropdownOption,
    { code: 'REF', description: 'Reference' } as DropdownOption,
  ];

  describe('convertFiltersToChips', () => {
    it('should return empty array when filters is null', () => {
      expect(TestingContractFilterChipsUtils.convertFiltersToChips(null, [], [])).toEqual([]);
    });

    it('should return empty array when no filters are set', () => {
      const filters = {} as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes)).toEqual([]);
    });

    it('should create chip for contractId with lookup description', () => {
      const filters = { contractId: 'TC001' } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('contractId');
      expect(result[0].label).toBe('Contract ID: TC001 - Testing Contract One');
      expect(result[0].value).toBe('TC001');
    });

    it('should create chip for contractId without lookup when not found', () => {
      const filters = { contractId: 'UNKNOWN' } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Contract ID: UNKNOWN');
    });

    it('should create chip for contractType with lookup description', () => {
      const filters = { contractType: 'LAB' } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('contractType');
      expect(result[0].label).toBe('Contract Type: LAB - Laboratory');
    });

    it('should create chip for contractType without lookup when not found', () => {
      const filters = { contractType: 'XYZ' } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Contract Type: XYZ');
    });

    it('should create chip for effDate with Before period showing <= symbol', () => {
      const testDate = moment('2024-06-15');
      const filters = {
        effDate: testDate,
        effDatePeriod: 'Before',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('effDate');
      expect(result[0].label).toContain('Effective Date');
      expect(result[0].label).toContain('≤');
      expect(result[0].label).toContain('15-JUN-2024');
    });

    it('should create chip for effDate with After period showing >= symbol', () => {
      const testDate = moment('2024-06-15');
      const filters = {
        effDate: testDate,
        effDatePeriod: 'After',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≥');
    });

    it('should create chip for termDate with Before period', () => {
      const testDate = moment('2025-01-31');
      const filters = {
        termDate: testDate,
        termDatePeriod: 'Before',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].key).toBe('termDate');
      expect(result[0].label).toContain('Termination Date');
      expect(result[0].label).toContain('≤');
    });

    it('should create chip for termDate with After period', () => {
      const testDate = moment('2025-01-31');
      const filters = {
        termDate: testDate,
        termDatePeriod: 'After',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(1);
      expect(result[0].label).toContain('≥');
    });

    it('should create chips for all populated filters', () => {
      const filters = {
        contractId: 'TC001',
        contractType: 'LAB',
        effDate: moment('2024-01-01'),
        effDatePeriod: 'After',
        termDate: moment('2025-12-31'),
        termDatePeriod: 'Before',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.convertFiltersToChips(filters, mockContracts, mockContractTypes);

      expect(result.length).toBe(4);
    });
  });

  describe('removeFilterByChipKey', () => {
    it('should return null when filters is null', () => {
      expect(TestingContractFilterChipsUtils.removeFilterByChipKey(null, 'contractId')).toBeNull();
    });

    it('should set contractId to null when removing contractId chip', () => {
      const filters = {
        contractId: 'TC001',
        contractType: 'LAB',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'contractId');

      expect(result).not.toBeNull();
      expect(result!.contractId).toBeNull();
      expect(result!.contractType).toBe('LAB');
    });

    it('should set contractType to null when removing contractType chip', () => {
      const filters = {
        contractId: 'TC001',
        contractType: 'LAB',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'contractType');

      expect(result).not.toBeNull();
      expect(result!.contractType).toBeNull();
    });

    it('should reset effDate and effDatePeriod when removing effDate chip', () => {
      const filters = {
        contractId: 'TC001',
        effDate: moment('2024-01-01'),
        effDatePeriod: 'Before',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'effDate');

      expect(result).not.toBeNull();
      expect(result!.effDate).toBeNull();
      expect(result!.effDatePeriod).toBe('After');
    });

    it('should reset termDate and termDatePeriod when removing termDate chip', () => {
      const filters = {
        contractId: 'TC001',
        termDate: moment('2025-12-31'),
        termDatePeriod: 'Before',
      } as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'termDate');

      expect(result).not.toBeNull();
      expect(result!.termDate).toBeNull();
      expect(result!.termDatePeriod).toBe('After');
    });

    it('should return null when removing last active filter', () => {
      const filters = {
        contractId: 'TC001',
        contractType: null,
        effDate: null,
        termDate: null,
      } as unknown as ContractFilterModel;
      const result = TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'contractId');

      expect(result).toBeNull();
    });

    it('should not mutate original filters', () => {
      const filters = {
        contractId: 'TC001',
        contractType: 'LAB',
      } as ContractFilterModel;
      TestingContractFilterChipsUtils.removeFilterByChipKey(filters, 'contractId');

      expect(filters.contractId).toBe('TC001');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when filters is null', () => {
      expect(TestingContractFilterChipsUtils.hasActiveFilters(null)).toBe(false);
    });

    it('should return false when no filters are active', () => {
      const filters = {
        contractId: null,
        contractType: null,
        effDate: null,
        termDate: null,
      } as unknown as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when contractId is set', () => {
      const filters = { contractId: 'TC001' } as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when contractType is set', () => {
      const filters = { contractType: 'LAB' } as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when effDate is set', () => {
      const filters = { effDate: moment('2024-01-01') } as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when termDate is set', () => {
      const filters = { termDate: moment('2025-12-31') } as ContractFilterModel;
      expect(TestingContractFilterChipsUtils.hasActiveFilters(filters)).toBe(true);
    });
  });
});
