import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { EmfFilterPanel } from './emf-filter-panel';
import { ProcessCodesFilterValue } from '../emf-processes';

describe('EmfFilterPanel', () => {
  let component: EmfFilterPanel;
  let fixture: ComponentFixture<EmfFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EmfFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmfFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      const filters: ProcessCodesFilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2025-01-15'));
    });

    it('should set hasActiveFilters to false initially when no filters', () => {
      fixture.detectChanges();

      expect(component.hasActiveFilters).toBeFalse();
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: testDate
      });
      component.filterForm.markAllAsTouched();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDatePeriod: 'After',
        effectiveDate: testDate
      }));
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.apply, 'emit');

      // Set date without period to trigger validator
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-15'),
        effectiveDatePeriod: null
      });
      component.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity();
      component.filterForm.markAllAsTouched();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should set hasChanges to false after apply', () => {
      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: testDate
      });
      component.filterForm.markAllAsTouched();

      component.onApply();

      expect(component.hasChanges).toBeFalse();
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date(),
        terminationDatePeriod: 'After',
        terminationDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when no active filters', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when date is set without period', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return period required error for effective date', () => {
      const control = component.filterForm.get('effectiveDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getEffDatePeriodError()).toBe('Period is required');
    });

    it('should return period required error for termination date', () => {
      const control = component.filterForm.get('terminationDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getTermDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when no errors and not touched', () => {
      expect(component.getEffDatePeriodError()).toBe('');
      expect(component.getTermDatePeriodError()).toBe('');
    });
  });

  describe('hasDateErrors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no date errors', () => {
      expect(component.hasDateErrors).toBeFalse();
    });

    it('should return true when effective date has parse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.hasDateErrors).toBeTrue();
    });

    it('should return true when termination date has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.hasDateErrors).toBeTrue();
    });
  });
});
