import { FormGroup, FormControl } from '@angular/forms';

import { dockingTypeConditionalValidator } from './docking-type-validator.util';

describe('dockingTypeConditionalValidator', () => {
  const validator = dockingTypeConditionalValidator();

  function buildForm(dockingType: string | null, filterType: string | null, filterLotNumber: string | null): FormGroup {
    return new FormGroup({
      dockingType: new FormControl(dockingType),
      filterType: new FormControl(filterType),
      filterLotNumber: new FormControl(filterLotNumber),
    });
  }

  // ── returns null (valid) when docking type does NOT require filters ──

  describe('non-filter docking types', () => {
    it.each([
      { type: 'BA', label: 'BA (Bag-to-Bag)' },
      { type: 'XX', label: 'unknown type XX' },
      { type: '',   label: 'empty string' },
    ])('returns null for $label regardless of filter fields', ({ type }) => {
      const form = buildForm(type, null, null);

      expect(validator(form)).toBeNull();
    });

    it('returns null for BA even when filter fields are populated', () => {
      const form = buildForm('BA', 'LEUKO', 'LOT001');

      expect(validator(form)).toBeNull();
    });
  });

  // ── returns error when docking type requires filters and they are missing ──

  describe('filter-required docking types (FI, FB, BF)', () => {
    const filterTypes = [
      { type: 'FI', label: 'FI (Filter-In)' },
      { type: 'FB', label: 'FB (Filter-Bag)' },
      { type: 'BF', label: 'BF (Bag-Filter)' },
    ];

    describe('missing both filter fields', () => {
      it.each(filterTypes)('returns filterRequired error for $label when both are null', ({ type }) => {
        const form = buildForm(type, null, null);

        const result = validator(form);

        expect(result).not.toBeNull();
        expect(result!['filterRequired']).toBe(
          'Filter Type and Filter Lot Number are required for this docking type'
        );
      });

      it.each(filterTypes)('returns filterRequired error for $label when both are empty strings', ({ type }) => {
        const form = buildForm(type, '', '');

        const result = validator(form);

        expect(result).not.toBeNull();
        expect(result!['filterRequired']).toBeDefined();
      });
    });

    describe('missing only filterType', () => {
      it.each(filterTypes)('returns filterRequired error for $label', ({ type }) => {
        const form = buildForm(type, null, 'LOT001');

        const result = validator(form);

        expect(result).not.toBeNull();
        expect(result!['filterRequired']).toBeDefined();
      });

      it('returns error when filterType is empty string', () => {
        const form = buildForm('FI', '', 'LOT001');

        expect(validator(form)).not.toBeNull();
      });
    });

    describe('missing only filterLotNumber', () => {
      it.each(filterTypes)('returns filterRequired error for $label', ({ type }) => {
        const form = buildForm(type, 'LEUKO', null);

        const result = validator(form);

        expect(result).not.toBeNull();
        expect(result!['filterRequired']).toBeDefined();
      });

      it('returns error when filterLotNumber is empty string', () => {
        const form = buildForm('FB', 'LEUKO', '');

        expect(validator(form)).not.toBeNull();
      });
    });

    describe('both filter fields provided', () => {
      it.each(filterTypes)('returns null (valid) for $label when both fields are present', ({ type }) => {
        const form = buildForm(type, 'LEUKO', 'LOT001');

        expect(validator(form)).toBeNull();
      });
    });
  });

  // ── edge cases: missing form controls ──

  describe('edge cases', () => {
    it('returns null when dockingType control does not exist on the form', () => {
      const form = new FormGroup({
        filterType: new FormControl('LEUKO'),
        filterLotNumber: new FormControl('LOT001'),
      });

      expect(validator(form)).toBeNull();
    });

    it('returns null when dockingType is null', () => {
      const form = buildForm(null, null, null);

      expect(validator(form)).toBeNull();
    });

    it('returns null when dockingType is undefined', () => {
      const form = new FormGroup({
        dockingType: new FormControl(undefined),
        filterType: new FormControl(null),
        filterLotNumber: new FormControl(null),
      });

      expect(validator(form)).toBeNull();
    });

    it('returns null when filterType and filterLotNumber controls do not exist but docking type is non-filter', () => {
      const form = new FormGroup({
        dockingType: new FormControl('BA'),
      });

      expect(validator(form)).toBeNull();
    });

    it('returns filterRequired error when filterType and filterLotNumber controls do not exist but docking type requires filters', () => {
      const form = new FormGroup({
        dockingType: new FormControl('FI'),
      });

      const result = validator(form);

      expect(result).not.toBeNull();
      expect(result!['filterRequired']).toBeDefined();
    });
  });
});
