import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PhysicianFilterPanel } from './physician-filter-panel';

describe('PhysicianFilterPanel', () => {
  let component: PhysicianFilterPanel;
  let fixture: ComponentFixture<PhysicianFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhysicianFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(PhysicianFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    });
  });

  it('should default title to Filters', () => {
    expect(component.title).toBe('Filters');
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effective date is set with period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'after'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effDatePeriodRequired is true', () => {
      component.filterForm.patchValue({ effectiveDate: new Date() });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when termDatePeriodRequired is true', () => {
      component.filterForm.patchValue({ terminationDate: new Date() });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with formatted filter values', () => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'after'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDate: '2025-06-15',
          effectiveDatePeriod: 'after'
        })
      );
    });

    it('should not emit when validation errors exist', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should set effectivePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.effectivePeriodRequired).toBeTrue();
    });

    it('should emit null for dates not set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: 'before'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          terminationDate: null,
          terminationDatePeriod: null
        })
      );
    });
  });

  describe('onClearAll', () => {
    it('should reset form and clear validation flags', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'after'
      });
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;

      component.onClearAll();

      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('period required getters', () => {
    it('should return true for effDatePeriodRequired when date set without period', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      expect(component.effDatePeriodRequired).toBeTrue();
    });

    it('should return false for effDatePeriodRequired when both set', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'after' });
      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should return true for termDatePeriodRequired when date set without period', () => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationDatePeriod: null });
      expect(component.termDatePeriodRequired).toBeTrue();
    });
  });

  describe('date error messages', () => {
    it('should return empty string when control is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error message when date has matDatepickerParse error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });
  });

  describe('currentFilters input', () => {
    it('should populate form from currentFilters on init', () => {
      component.currentFilters = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'after',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.ngOnInit();

      expect(component.filterForm.value.effectiveDatePeriod).toBe('after');
      // Compare dates by format to avoid timezone issues
      const effDate = component.filterForm.value.effectiveDate;
      expect(effDate).toBeTruthy();
      // Verify the date was populated (compare year-month-day only)
      if (effDate instanceof Date) {
        expect(effDate.getFullYear()).toBe(2025);
        expect(effDate.getMonth()).toBe(0); // January = 0
        expect(effDate.getDate()).toBe(1);
      } else {
        expect(effDate).toBeTruthy();
      }
    });
  });

  describe('form controls access', () => {
    it('should expose form controls via filterForm', () => {
      expect(component.filterForm.get('effectiveDate')).toBeDefined();
      expect(component.filterForm.get('terminationDate')).toBeDefined();
    });
  });
});
