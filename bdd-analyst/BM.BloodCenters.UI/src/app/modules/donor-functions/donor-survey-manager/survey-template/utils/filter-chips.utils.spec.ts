import { SurveyTemplateFilterChipsUtils } from './filter-chips.utils';

describe('SurveyTemplateFilterChipsUtils', () => {
  it('should convert effective and termination filters to chips', () => {
    const chips = SurveyTemplateFilterChipsUtils.convertFiltersToChips({
      effDatePeriod: 'after',
      effDate: new Date('2026-04-08'),
      termDatePeriod: 'before',
      termDate: new Date('2026-05-01'),
      status: null,
    });

    expect(chips.length).toBe(2);
    expect(chips[0].key).toBe('effDate');
    expect(chips[0].label).toContain('Effective Date');
    expect(chips[0].label).toContain('≥');
    expect(chips[1].key).toBe('termDate');
    expect(chips[1].label).toContain('Termination Date');
    expect(chips[1].label).toContain('≤');
  });

  it('should skip chip when date or period is missing', () => {
    const chips = SurveyTemplateFilterChipsUtils.convertFiltersToChips({
      effDatePeriod: 'after',
      effDate: null,
      termDatePeriod: null,
      termDate: new Date('2026-05-01'),
      status: null,
    });

    expect(chips).toEqual([]);
  });

  it('should remove effective filter by chip key', () => {
    const updated = SurveyTemplateFilterChipsUtils.removeFilterByChipKey(
      {
        effDatePeriod: 'after',
        effDate: new Date('2026-04-08'),
        termDatePeriod: 'before',
        termDate: new Date('2026-05-01'),
        status: null,
      },
      'effDate'
    );

    expect(updated.effDate).toBeNull();
    expect(updated.effDatePeriod).toBeNull();
    expect(updated.termDate).not.toBeNull();
  });

  it('should remove termination filter by chip key', () => {
    const updated = SurveyTemplateFilterChipsUtils.removeFilterByChipKey(
      {
        effDatePeriod: 'after',
        effDate: new Date('2026-04-08'),
        termDatePeriod: 'before',
        termDate: new Date('2026-05-01'),
        status: null,
      },
      'termDate'
    );

    expect(updated.termDate).toBeNull();
    expect(updated.termDatePeriod).toBeNull();
    expect(updated.effDate).not.toBeNull();
  });

  it('should return active filter status correctly', () => {
    expect(SurveyTemplateFilterChipsUtils.hasActiveFilters(null)).toBeFalse();
    expect(
      SurveyTemplateFilterChipsUtils.hasActiveFilters({
        effDatePeriod: null,
        effDate: null,
        termDatePeriod: null,
        termDate: null,
        status: null,
      })
    ).toBeFalse();
    expect(
      SurveyTemplateFilterChipsUtils.hasActiveFilters({
        effDatePeriod: 'after',
        effDate: new Date('2026-04-08'),
        termDatePeriod: null,
        termDate: null,
        status: null,
      })
    ).toBeTrue();
  });
});
