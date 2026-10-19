import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import {
  ValidReagentSupplierCodeFilterPanel,
  ValidReagentSupplierCodeFilterValue,
} from './valid-reagent-supplier-code-filter-panel';

describe('ValidReagentSupplierCodeFilterPanel', () => {
  let component: ValidReagentSupplierCodeFilterPanel;
  let fixture: ComponentFixture<ValidReagentSupplierCodeFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidReagentSupplierCodeFilterPanel, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidReagentSupplierCodeFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize filterForm on ngOnInit', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('showTerminated')).toBeDefined();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeDefined();
      expect(component.filterForm.get('effectiveDate')).toBeDefined();
      expect(component.filterForm.get('terminationDatePeriod')).toBeDefined();
      expect(component.filterForm.get('terminationDate')).toBeDefined();
    });

    it('should initialize form with null values when no currentFilters', () => {
      expect(component.filterForm.get('showTerminated')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize form with currentFilters when provided', () => {
      const newFixture = TestBed.createComponent(ValidReagentSupplierCodeFilterPanel);
      const newComponent = newFixture.componentInstance;
      newComponent.currentFilters = {
        showTerminated: 'Y',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-01')
      };
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('showTerminated')?.value).toBe('Y');
      expect(newComponent.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    });

    it('should have no validation errors initially', () => {
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('onApply', () => {
    it('should emit apply and close events when no validation errors', () => {
      spyOn(component.apply, 'emit');
      spyOn(component.close, 'emit');

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should not emit when effective date set but period not selected', () => {
      spyOn(component.apply, 'emit');

      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({ effectiveDate: mockMoment });

      component.onApply();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when termination date set but period not selected', () => {
      spyOn(component.apply, 'emit');

      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({ terminationDate: mockMoment });

      component.onApply();

      expect(component.terminationDatePeriodError).toBe('Period is required');
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit form value on successful apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ showTerminated: 'Y' });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        showTerminated: 'Y'
      }));
    });

    it('should emit with date and period when both are set', () => {
      spyOn(component.apply, 'emit');
      const testDate = moment('2025-06-15');
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'After'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
    });
  });

  describe('Period Validation', () => {
    it('should clear effectiveDatePeriodError when period is set', () => {
      component.effectiveDatePeriodError = 'Period is required';
      component.filterForm.patchValue({ effectiveDatePeriod: 'AFTER' });
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear terminationDatePeriodError when period is set', () => {
      component.terminationDatePeriodError = 'Period is required';
      component.filterForm.patchValue({ terminationDatePeriod: 'BEFORE' });
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should set error when effective date has value but period is empty', () => {
      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({
        effectiveDate: mockMoment,
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should set error when termination date has value but period is empty string', () => {
      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({
        terminationDate: mockMoment,
        terminationDatePeriod: ''
      });

      component.onApply();

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear error when effective date is cleared', () => {
      component.effectiveDatePeriodError = 'Period is required';
      component.filterForm.patchValue({ effectiveDate: null });

      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear error when termination date is cleared', () => {
      component.terminationDatePeriodError = 'Period is required';
      component.filterForm.patchValue({ terminationDate: null });

      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when no filters are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when showTerminated is set', () => {
      component.filterForm.patchValue({ showTerminated: 'Y' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be disabled when period error exists', () => {
      component.effectiveDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when termination period error exists', () => {
      component.terminationDatePeriodError = 'Period is required';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when effective date and period are both set', () => {
      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({
        effectiveDate: mockMoment,
        effectiveDatePeriod: 'After'
      });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be disabled when only effective date set without period', () => {
      const mockMoment = { isValid: () => true } as any;
      component.filterForm.patchValue({
        effectiveDate: mockMoment,
        effectiveDatePeriod: null
      });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Clear and Close', () => {
    it('should reset all form fields on clearAll', () => {
      component.filterForm.patchValue({
        showTerminated: 'Y',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-01')
      });

      component.onClearAll();

      expect(component.filterForm.get('showTerminated')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should emit close event on onClose', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
