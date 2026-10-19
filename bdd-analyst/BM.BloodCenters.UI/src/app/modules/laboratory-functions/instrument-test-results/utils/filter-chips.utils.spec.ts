import { InstrumentTestResultFilterChipsUtils } from './filter-chips.utils';
import { ValidInstrumentTestScheduleFilter, InstrumentResultFilter } from '../models/instrument-test-results.model';

describe('InstrumentTestResultFilterChipsUtils', () => {

  const effDate  = new Date('2026-01-15');
  const termDate = new Date('2026-06-30');


  /* ── convertFiltersToChips ──────────────────────────────── */

  describe('convertFiltersToChips', () => {
    it('should return empty array for null input', () => {
      expect(InstrumentTestResultFilterChipsUtils.convertFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array for empty filter object', () => {
      expect(InstrumentTestResultFilterChipsUtils.convertFiltersToChips({})).toEqual([]);
    });

    it('should not produce chip when effectiveDate has no period', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({ effectiveDate: effDate });
      expect(chips.find(c => c.key === 'effectiveDate')).toBeUndefined();
    });

    it('should not produce chip when effectiveDatePeriod has no date', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({ effectiveDatePeriod: 'AFTER' });
      expect(chips.find(c => c.key === 'effectiveDate')).toBeUndefined();
    });

    it('should produce effectiveDate chip with AFTER symbol when period is AFTER', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('≥');
      expect(chips[0].value).toBe(effDate);
    });

    it('should produce effectiveDate chip with BEFORE symbol when period is BEFORE', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'BEFORE',
      });
      expect(chips[0].label).toContain('≤');
    });

    it('should produce terminationDate chip with correct key and label', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('≤');
      expect(chips[0].value).toBe(termDate);
    });

    it('should produce two chips when both date filters are active', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips.length).toBe(2);
      expect(chips.some(c => c.key === 'effectiveDate')).toBeTrue();
      expect(chips.some(c => c.key === 'terminationDate')).toBeTrue();
    });

    it('should embed the formatted date in the chip label', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: new Date('2026-01-15'),
        effectiveDatePeriod: 'AFTER',
      });
      expect(chips[0].label).toContain('15-JAN-2026');
    });
  });

  /* ── removeFilterByChipKey ──────────────────────────────── */

  describe('removeFilterByChipKey', () => {
    const fullFilter: ValidInstrumentTestScheduleFilter = {
      effectiveDate: effDate,
      effectiveDatePeriod: 'AFTER',
      terminationDate: termDate,
      terminationDatePeriod: 'BEFORE',
    };

    it('should set effectiveDate and effectiveDatePeriod to null when removing effectiveDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(fullFilter, 'effectiveDate');
      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
    });

    it('should preserve terminationDate when removing effectiveDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(fullFilter, 'effectiveDate');
      expect(result.terminationDate).toEqual(termDate);
      expect(result.terminationDatePeriod).toBe('BEFORE');
    });

    it('should set terminationDate and terminationDatePeriod to null when removing terminationDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(fullFilter, 'terminationDate');
      expect(result.terminationDate).toBeNull();
      expect(result.terminationDatePeriod).toBeNull();
    });

    it('should preserve effectiveDate when removing terminationDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(fullFilter, 'terminationDate');
      expect(result.effectiveDate).toEqual(effDate);
      expect(result.effectiveDatePeriod).toBe('AFTER');
    });


    it('should not mutate the original filter object', () => {
      const original: ValidInstrumentTestScheduleFilter = {
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
      };
      InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(original, 'effectiveDate');
      expect(original.effectiveDate).toEqual(effDate);
    });

    it('should leave filter unchanged for an unrecognised key', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeFilterByChipKey(fullFilter, 'unknownKey');
      expect(result.effectiveDate).toEqual(effDate);
      expect(result.terminationDate).toEqual(termDate);
    });
  });

  /* ── hasActiveFilters ───────────────────────────────────── */

  describe('hasActiveFilters', () => {

    it('should return false for empty object', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({})).toBeFalse();
    });

    it('should return false when only date is set without period', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({ effectiveDate: effDate })).toBeFalse();
    });

    it('should return false when only period is set without date', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({ effectiveDatePeriod: 'AFTER' })).toBeFalse();
    });

    it('should return true when effectiveDate and period are both set', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
      })).toBeTrue();
    });

    it('should return true when terminationDate and period are both set', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      })).toBeTrue();
    });

    it('should return true when both date filters are active', () => {
      expect(InstrumentTestResultFilterChipsUtils.hasActiveFilters({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      })).toBeTrue();
    });
  });

  /* ── convertResultFiltersToChips ────────────────────────── */

  describe('convertResultFiltersToChips', () => {
    it('should return empty array for null input', () => {
      expect(InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips(null)).toEqual([]);
    });

    it('should return empty array for empty filter object', () => {
      expect(InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips({})).toEqual([]);
    });


    it('should produce terminationDate chip when date and period are set', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips({
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips[0].key).toBe('terminationDate');
    });

    it('should produce two chips when both date filters are active', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertResultFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips.length).toBe(2);
    });
  });

  /* ── removeResultFilterByChipKey ────────────────────────── */

  describe('removeResultFilterByChipKey', () => {
    const fullResultFilter: InstrumentResultFilter = {
      effectiveDate: effDate,
      effectiveDatePeriod: 'AFTER',
      terminationDate: termDate,
      terminationDatePeriod: 'BEFORE',
    };

    it('should null effectiveDate and period when removing effectiveDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeResultFilterByChipKey(fullResultFilter, 'effectiveDate');
      expect(result.effectiveDate).toBeNull();
      expect(result.effectiveDatePeriod).toBeNull();
    });

    it('should preserve terminationDate when removing effectiveDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeResultFilterByChipKey(fullResultFilter, 'effectiveDate');
      expect(result.terminationDate).toEqual(termDate);
    });

    it('should null terminationDate and period when removing terminationDate chip', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeResultFilterByChipKey(fullResultFilter, 'terminationDate');
      expect(result.terminationDate).toBeNull();
      expect(result.terminationDatePeriod).toBeNull();
    });


    it('should leave filter unchanged for unrecognised key', () => {
      const result = InstrumentTestResultFilterChipsUtils.removeResultFilterByChipKey(fullResultFilter, 'unknownKey');
      expect(result.effectiveDate).toEqual(effDate);
    });
  });
});
