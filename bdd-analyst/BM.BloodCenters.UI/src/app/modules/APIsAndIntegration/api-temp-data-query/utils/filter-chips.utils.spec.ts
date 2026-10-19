import { ApiTempDataQueryFilterChipsUtils } from './filter-chips.utils';
import { IdTypeOption, SourceIdOption } from '../models/api-temp-data-query.model';

describe('ApiTempDataQueryFilterChipsUtils', () => {
  const mockIdTypes: IdTypeOption[] = [
    { code: 'APITY1', description: 'Type 1' },
    { code: 'APITY2', description: 'Type 2' }
  ];

  const mockSourceIds: SourceIdOption[] = [
    { sourceId: 'LAP' },
    { sourceId: 'SFA' }
  ];

  describe('convertFiltersToChips', () => {

    it('should convert ID type filter to chip', () => {
      const filters = { idType: 'APITY1' };
      const chips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(filters, mockIdTypes, mockSourceIds);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('idType');
      expect(chips[0].label).toBe('ID Type: APITY1');
      expect(chips[0].value).toBe('APITY1');
    });

    it('should convert source ID filter to chip', () => {
      const filters = { sourceId: 'SFA' };
      const chips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(filters, mockIdTypes, mockSourceIds);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('sourceId');
      expect(chips[0].label).toBe('Source ID: SFA');
      expect(chips[0].value).toBe('SFA');
    });

    it('should convert insert date filter with "after" period type', () => {
      const filters = {
        insertDate: new Date('2024-01-15'),
        periodType: 'after'
      };
      const chips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(filters, mockIdTypes, mockSourceIds);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('insertDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].label).toContain('15-JAN-2024');
    });

    it('should convert insert date filter with "before" period type', () => {
      const filters = {
        insertDate: new Date('2024-01-15'),
        periodType: 'before'
      };
      const chips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(filters, mockIdTypes, mockSourceIds);

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('insertDate');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].label).toContain('15-JAN-2024');
    });


    it('should not create chip for insert date if period type is missing', () => {
      const filters = {
        insertDate: new Date('2024-01-15')
      };
      const chips = ApiTempDataQueryFilterChipsUtils.convertFiltersToChips(filters, mockIdTypes, mockSourceIds);

      expect(chips.length).toBe(0);
    });
  });

  describe('removeFilterByChipKey', () => {

    it('should remove ID type filter', () => {
      const filters = { idType: 'APITY1', sourceId: 'SFA' };
      const result = ApiTempDataQueryFilterChipsUtils.removeFilterByChipKey(filters, 'idType');

      expect(result).toBeTruthy();
      expect(result?.idType).toBeUndefined();
      expect(result?.sourceId).toBe('SFA');
    });

    it('should remove source ID filter', () => {
      const filters = { idType: 'APITY1', sourceId: 'SFA' };
      const result = ApiTempDataQueryFilterChipsUtils.removeFilterByChipKey(filters, 'sourceId');

      expect(result).toBeTruthy();
      expect(result?.sourceId).toBeUndefined();
      expect(result?.idType).toBe('APITY1');
    });

    it('should remove insert date and period type when removing insert date', () => {
      const filters = {
        insertDate: new Date('2024-01-15'),
        periodType: 'after',
        idType: 'APITY1'
      };
      const result = ApiTempDataQueryFilterChipsUtils.removeFilterByChipKey(filters, 'insertDate');

      expect(result).toBeTruthy();
      expect(result?.insertDate).toBeUndefined();
      expect(result?.periodType).toBeUndefined();
      expect(result?.idType).toBe('APITY1');
    });

  });

  describe('hasActiveFilters', () => {

    it('should return true when ID type filter is present', () => {
      const filters = { idType: 'APITY1' };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when source ID filter is present', () => {
      const filters = { sourceId: 'SFA' };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return true when both insert date and period type are present', () => {
      const filters = {
        insertDate: new Date('2024-01-15'),
        periodType: 'after'
      };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(true);
    });

    it('should return false when only insert date is present without period type', () => {
      const filters = {
        insertDate: new Date('2024-01-15')
      };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return false when only period type is present without insert date', () => {
      const filters = {
        periodType: 'after'
      };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });

    it('should return false when all filters are undefined', () => {
      const filters = {
        idType: undefined,
        sourceId: undefined,
        insertDate: undefined,
        periodType: undefined
      };
      const result = ApiTempDataQueryFilterChipsUtils.hasActiveFilters(filters);
      expect(result).toBe(false);
    });
  });
});
