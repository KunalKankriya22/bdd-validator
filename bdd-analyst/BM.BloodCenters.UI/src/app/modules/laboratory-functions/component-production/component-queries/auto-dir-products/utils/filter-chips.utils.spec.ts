import { generateFilterChips, hasSearchCriteria } from './filter-chips.utils';
import { AutoDirProductsFilterForm, SORT_ORDER_OPTIONS } from '../models/auto-dir-products.model';
import { formatTableDate } from '@shared/utils/date-format.util';

jest.mock('@shared/utils/date-format.util', () => ({
  formatTableDate: jest.fn((date: string) => {
    const d = new Date(date);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  })
}));

describe('Auto Dir Products Filter Chips Utils', () => {
  const emptyFilters: AutoDirProductsFilterForm = {
    unitId: null,
    fromDate: null,
    toDate: null,
    needByDate: null,
    surgeryDate: null,
    hospitalId: null,
    patientId: null,
    orderBy: 'UNIT'
  };

  describe('generateFilterChips', () => {
    it('should return only orderBy chip when no filters are active', () => {
      const chips = generateFilterChips(emptyFilters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('orderBy');
      expect(chips[0].removable).toBe(false);
    });

    it('should convert unitId filter to chip', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, unitId: 'UNIT001' };

      const chips = generateFilterChips(filters);
      const unitChip = chips.find(c => c.key === 'unitId');
      expect(unitChip).toBeDefined();
      expect(unitChip!.label).toBe('Unit ID');
      expect(unitChip!.value).toBe('UNIT001');
      expect(unitChip!.removable).toBe(true);
    });

    it('should convert fromDate filter to chip with formatted date', () => {
      const testDate = new Date('2025-01-15T00:00:00.000Z');
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, fromDate: testDate };

      const chips = generateFilterChips(filters);
      const fromChip = chips.find(c => c.key === 'fromDate');
      expect(fromChip).toBeDefined();
      expect(fromChip!.label).toBe('From Date');
      expect(fromChip!.removable).toBe(true);
    });

    it('should convert toDate filter to chip with formatted date', () => {
      const testDate = new Date('2025-12-31T00:00:00.000Z');
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, toDate: testDate };

      const chips = generateFilterChips(filters);
      const toChip = chips.find(c => c.key === 'toDate');
      expect(toChip).toBeDefined();
      expect(toChip!.label).toBe('To Date');
      expect(toChip!.removable).toBe(true);
    });

    it('should convert needByDate filter to chip', () => {
      const testDate = new Date('2025-06-30T00:00:00.000Z');
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, needByDate: testDate };

      const chips = generateFilterChips(filters);
      const needByChip = chips.find(c => c.key === 'needByDate');
      expect(needByChip).toBeDefined();
      expect(needByChip!.label).toBe('Need By Date');
      expect(needByChip!.removable).toBe(true);
    });

    it('should convert surgeryDate filter to chip', () => {
      const testDate = new Date('2025-09-01T00:00:00.000Z');
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, surgeryDate: testDate };

      const chips = generateFilterChips(filters);
      const surgeryChip = chips.find(c => c.key === 'surgeryDate');
      expect(surgeryChip).toBeDefined();
      expect(surgeryChip!.label).toBe('Surgery Date');
      expect(surgeryChip!.removable).toBe(true);
    });

    it('should convert hospitalId filter to chip', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, hospitalId: 'HOSP01' };

      const chips = generateFilterChips(filters);
      const hospChip = chips.find(c => c.key === 'hospitalId');
      expect(hospChip).toBeDefined();
      expect(hospChip!.label).toBe('Hospital ID');
      expect(hospChip!.value).toBe('HOSP01');
      expect(hospChip!.removable).toBe(true);
    });

    it('should convert patientId filter to chip', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, patientId: 'PAT001' };

      const chips = generateFilterChips(filters);
      const patChip = chips.find(c => c.key === 'patientId');
      expect(patChip).toBeDefined();
      expect(patChip!.label).toBe('Patient ID');
      expect(patChip!.value).toBe('PAT001');
      expect(patChip!.removable).toBe(true);
    });

    it('should convert orderBy "UNIT" to non-removable chip with label', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, orderBy: 'UNIT' };

      const chips = generateFilterChips(filters);
      const orderByChip = chips.find(c => c.key === 'orderBy');
      expect(orderByChip).toBeDefined();
      expect(orderByChip!.label).toBe('Sort Order');
      expect(orderByChip!.value).toBe('Unit ID, Collection Date');
      expect(orderByChip!.removable).toBe(false);
    });

    it('should convert orderBy "COLL" to non-removable chip with label', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, orderBy: 'COLL' };

      const chips = generateFilterChips(filters);
      const orderByChip = chips.find(c => c.key === 'orderBy');
      expect(orderByChip).toBeDefined();
      expect(orderByChip!.value).toBe('Collection Date, Unit ID');
      expect(orderByChip!.removable).toBe(false);
    });

    it('should handle date as string value', () => {
      const filters: AutoDirProductsFilterForm = {
        ...emptyFilters,
        fromDate: '2025-01-15' as any
      };

      const chips = generateFilterChips(filters);
      const fromChip = chips.find(c => c.key === 'fromDate');
      expect(fromChip).toBeDefined();
    });

    it('should convert all filters to chips when all are populated', () => {
      const filters: AutoDirProductsFilterForm = {
        unitId: 'UNIT001',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-12-31'),
        needByDate: new Date('2025-06-30'),
        surgeryDate: new Date('2025-09-01'),
        hospitalId: 'HOSP01',
        patientId: 'PAT001',
        orderBy: 'UNIT'
      };

      const chips = generateFilterChips(filters);
      expect(chips.length).toBe(8);
      expect(chips[0].key).toBe('unitId');
      expect(chips[1].key).toBe('fromDate');
      expect(chips[2].key).toBe('toDate');
      expect(chips[3].key).toBe('needByDate');
      expect(chips[4].key).toBe('surgeryDate');
      expect(chips[5].key).toBe('hospitalId');
      expect(chips[6].key).toBe('patientId');
      expect(chips[7].key).toBe('orderBy');
    });
  });

  describe('hasSearchCriteria', () => {
    it('should return false when no criteria are set', () => {
      expect(hasSearchCriteria(emptyFilters)).toBe(false);
    });

    it('should return true when unitId is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, unitId: 'UNIT001' };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when fromDate is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, fromDate: new Date() };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when toDate is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, toDate: new Date() };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when needByDate is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, needByDate: new Date() };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when surgeryDate is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, surgeryDate: new Date() };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when hospitalId is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, hospitalId: 'HOSP01' };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return true when patientId is set', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, patientId: 'PAT001' };
      expect(hasSearchCriteria(filters)).toBe(true);
    });

    it('should return false when only orderBy is set (excluded from criteria)', () => {
      const filters: AutoDirProductsFilterForm = { ...emptyFilters, orderBy: 'COLL' };
      expect(hasSearchCriteria(filters)).toBe(false);
    });

    it('should return true when multiple criteria are set', () => {
      const filters: AutoDirProductsFilterForm = {
        ...emptyFilters,
        unitId: 'UNIT001',
        hospitalId: 'HOSP01',
        patientId: 'PAT001'
      };
      expect(hasSearchCriteria(filters)).toBe(true);
    });
  });
});
