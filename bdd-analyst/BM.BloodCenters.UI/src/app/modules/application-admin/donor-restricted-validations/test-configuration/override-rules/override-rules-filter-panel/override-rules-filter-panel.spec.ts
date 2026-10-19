import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverrideRulesFilterPanel } from './override-rules-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverrideRuleFilterValue, InterdictionCode } from '../models/override-rules.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('OverrideRulesFilterPanel', () => {
  let component: OverrideRulesFilterPanel;
  let fixture: ComponentFixture<OverrideRulesFilterPanel>;

  const mockInterdictionOptions: InterdictionCode[] = [
    { interCode: 'INT001', interDesc: 'Permanent Deferral' },
    { interCode: 'INT002', interDesc: 'Temporary Deferral' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverrideRulesFilterPanel],
      providers: [
        { provide: HeaderService, useValue: createMockHeaderService() },
        { provide: ChapterTimezoneService, useValue: jasmine.createSpyObj('ChapterTimezoneService', ['isChapterLocalDateAvailable', 'fetchChapterTimezone', 'getChapterLocalDate']) }
      ]
    });

    fixture = TestBed.createComponent(OverrideRulesFilterPanel);
    component = fixture.componentInstance;
    component.interdictionOptions = mockInterdictionOptions;
  });

  describe('Component Initialization', () => {


    it('should initialize with null form values', () => {
      component.ngOnInit();

      expect(component.filterForm.get('overrideFlag')?.value).toBeNull();
      expect(component.filterForm.get('interdictionCode')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should have correct override flag options', () => {
      expect(component.overrideFlagOptions.length).toBe(2);
      expect(component.overrideFlagOptions[0].value).toBe('Y');
      expect(component.overrideFlagOptions[0].label).toBe('Yes');
      expect(component.overrideFlagOptions[1].value).toBe('N');
      expect(component.overrideFlagOptions[1].label).toBe('No');
    });

    it('should have correct period options', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions[0].value).toBe('AFTER');
      expect(component.periodOptions[0].display).toBe('After');
      expect(component.periodOptions[1].value).toBe('BEFORE');
      expect(component.periodOptions[1].display).toBe('Before');
    });
  });

  describe('Current Filters', () => {
    it('should populate form with current filters when provided', () => {
      const currentFilters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31')
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('overrideFlag')?.value).toBe('Y');
      expect(component.filterForm.get('interdictionCode')?.value).toBe('INT001');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(currentFilters.effectiveDate);
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(currentFilters.terminationDate);
    });


  });

  describe('onApply', () => {
    beforeEach(() => {
      component.ngOnInit();
    });


    it('should convert empty/falsy values to null', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });

    it('should handle partial filter selection', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        overrideFlag: 'Y',
        interdictionCode: '',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: '',
        terminationDate: ''
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.overrideFlag).toBe('Y');
      expect(emittedValue.interdictionCode).toBeNull();
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
      expect(emittedValue.effectiveDate).toBe('2025-01-01');
      expect(emittedValue.terminationDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      component.ngOnInit();
    });


    it('should not emit apply event when clearing', () => {
      spyOn(component.apply, 'emit');
      spyOn(component.close, 'emit');

      component.onClear();

      expect(component.apply.emit).not.toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });
  describe('Interdiction Options', () => {
    it('should accept interdiction options input', () => {
      component.interdictionOptions = mockInterdictionOptions;

      expect(component.interdictionOptions.length).toBe(2);
      expect(component.interdictionOptions[0].interCode).toBe('INT001');
      expect(component.interdictionOptions[0].interDesc).toBe('Permanent Deferral');
    });

  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should disable apply when form has no selections', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should allow submitting form with only override flag selected', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        overrideFlag: 'Y'
      });

      expect(component.isApplyDisabled).toBeFalse();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
    });

    it('should allow submitting form with only interdiction selected', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        interdictionCode: 'INT001'
      });

      expect(component.isApplyDisabled).toBeFalse();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
    });

    it('should allow submitting form with date filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01')
      });

      expect(component.isApplyDisabled).toBeFalse();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
    });
  });

  describe('Date Period Selection', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle effective date period "BEFORE"', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: new Date('2025-01-01')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('BEFORE');
    });

    it('should handle effective date period "AFTER"', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2025-01-01')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
    });

    it('should handle termination date period "BEFORE"', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2025-12-31')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('BEFORE');
    });

    it('should handle termination date period "AFTER"', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('AFTER');
    });
  });

  describe('Period Required Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true for effDatePeriodRequired when date is set but period is not', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: null
      });

      expect(component.effDatePeriodRequired).toBeTrue();
    });

    it('should return false for effDatePeriodRequired when both date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER'
      });

      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return false for effDatePeriodRequired when date is not set', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return true for termDatePeriodRequired when date is set but period is not', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });

      expect(component.termDatePeriodRequired).toBeTrue();
    });

    it('should return false for termDatePeriodRequired when both date and period are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      });

      expect(component.termDatePeriodRequired).toBeFalse();
    });

    it('should return false for termDatePeriodRequired when date is not set', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: null
      });

      expect(component.termDatePeriodRequired).toBeFalse();
    });
  });

  describe('Apply Button Disabled State', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should disable apply button when effective date is set without period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply button when termination date is set without period', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply button when all required periods are selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply button when filter values are selected without dates', () => {
      component.filterForm.patchValue({
        overrideFlag: 'Y',
        interdictionCode: 'INT001'
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply button when form is empty', () => {
      component.filterForm.patchValue({
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });



    it('should set period error message when applying without period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should clear period error when period is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: null
      });
      component.onApply();

      // Now select period
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER'
      });

      expect(component.effectiveDatePeriodError).toBe('');
    });
  });

  describe('hasDateErrors', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return false when no date errors exist', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        terminationDate: new Date('2025-12-31')
      });

      expect(component.hasDateErrors()).toBeFalse();
    });

  });
});
