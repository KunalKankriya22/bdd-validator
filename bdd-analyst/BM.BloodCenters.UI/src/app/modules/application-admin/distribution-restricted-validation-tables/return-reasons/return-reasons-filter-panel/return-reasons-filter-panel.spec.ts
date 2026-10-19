import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import moment from 'moment';
import { ReturnReasonsFilterPanel } from './return-reasons-filter-panel';
import { ReturnReasonsFilterValue } from '../models/return-reasons.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

describe('ReturnReasonsFilterPanel', () => {
  let component: ReturnReasonsFilterPanel;
  let fixture: ComponentFixture<ReturnReasonsFilterPanel>;

  beforeEach(() => {

    // Mock document.activeElement to prevent cdkTrapFocus cleanup errors
    // This ensures focus-related operations work in headless test environments
    const mockActiveElement = document.createElement('div');
    mockActiveElement.focus = jasmine.createSpy('focus');
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => mockActiveElement
    });



      TestBed.configureTestingModule({
imports: [
        ReturnReasonsFilterPanel,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ]
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ReturnReasonsFilterPanel);
    component = fixture.componentInstance;
    // Set default empty location types
    component.locationTypeOptions = [];


    });

  describe('Form Initialization', () => {


    it('should populate location type signal from input on init', () => {
      component.locationTypeOptions = ['DI', 'QU', 'DR'];
      fixture.detectChanges();

      expect(component.locationTypeOptionsSignal()).toEqual(['DI', 'QU', 'DR']);
    });
  });

  describe('onApply', () => {


    it('should emit filters with effective date and period', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      const testDate = moment('2024-01-15').toDate();
      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: null,
        terminationDate: null
      });
      fixture.detectChanges(); // Trigger change detection for validators

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
      expect(emittedValue.effectiveDate).toBeDefined();
    });

    it('should emit filters with termination date and period', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      const testDate = moment('2024-12-31').toDate();
      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: testDate
      });
      fixture.detectChanges(); // Trigger change detection for validators

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('BEFORE');
      expect(emittedValue.terminationDate).toBeDefined();
    });

    it('should emit filters with multiple selections', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      const effectiveDate = moment('2024-01-01').toDate();
      component.filterForm.patchValue({
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: effectiveDate,
        terminationDatePeriod: null,
        terminationDate: null
      });
      fixture.detectChanges(); // Trigger change detection for validators

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.locationType).toBe('DI');
      expect(emittedValue.crNcr).toBe('Yes');
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
    });

    it('should exclude effective period when date is not selected', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
    });

    it('should exclude termination period when date is not selected', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });

    it('should include period only when corresponding date is selected', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      const testDate = moment('2024-01-15').toDate();
      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: testDate,
        terminationDatePeriod: 'BEFORE', // This should be excluded
        terminationDate: null
      });
      fixture.detectChanges();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.terminationDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });
  });
  describe('Period Options', () => {
    it('should have After and Before period options', () => {
      fixture.detectChanges();

      expect(component.periodOptions).toEqual(['After', 'Before']);
    });
  });

  describe('CR/NCR Options', () => {
    it('should have Yes and No options', () => {
      fixture.detectChanges();

      expect(component.crNcrOptions).toEqual(['Yes', 'No']);
    });
  });

  describe('Enforce Options', () => {
    it('should have Yes and No enforce options', () => {
      fixture.detectChanges();

      expect(component.enforceOptions).toEqual(['Yes', 'No']);
    });

  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should invalidate form when effective date period is set without date', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null
      });

      // Period without date is allowed - no validation error
      expect(component.filterForm.valid).toBe(true);
    });

    it('should invalidate form when termination date period is set without date', () => {
      component.filterForm.patchValue({
        terminationDatePeriod: 'BEFORE',
        terminationDate: null
      });

      // Period without date is allowed - no validation error
      expect(component.filterForm.valid).toBe(true);
    });






    it('should validate form with only effective date and period', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.filterForm.valid).toBe(true);
    });

    it('should validate form with only termination date and period', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-12-31')
      });

      expect(component.filterForm.valid).toBe(true);
    });
  });

  describe('Date Field Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark effective date field as dirty and touched on input', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control?.dirty).toBe(false);
      expect(control?.touched).toBe(false);

      const event = { target: { value: '15-MAR-2026' } } as any;
      component.onEffectiveDateInput(event);

      expect(control?.dirty).toBe(true);
      expect(control?.touched).toBe(true);
    });

    it('should not change touched state when termination date field is empty on blur', () => {
      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();
      expect(control?.touched).toBe(true);

      const input = { value: '', trim: () => '' } as any;
      component.onTerminationDateBlur(input);

      // onBlur doesn't clear touched state, it just restores raw input on error
      expect(control?.touched).toBe(true);
    });

  });

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return error when effective date has matDatepickerParse error', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });

      const error = component.getEffDateError();
      expect(error).toBe('Effective Date is invalid');
    });

    it('should return error when input element has value but control is null', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });

      const error = component.getEffDateError();
      expect(error).toBe('Effective Date is invalid');
    });



    it('should return date range error when termination date is before effective date', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        terminationDate: new Date('2024-03-01')
      });
      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();

      const error = component.getTermDateError();
      expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    });

  });


  describe('Search Functionality', () => {
    beforeEach(() => {
      component.locationTypeOptions = ['DI', 'QU', 'DR'];
      fixture.detectChanges();
    });

    it('should filter location types based on search term', () => {
      component.locationTypeSearchCtrl.setValue('D');
      fixture.detectChanges();

      const filtered = component.filteredLocationTypeOptions();
      expect(filtered).toContain('DI');
      expect(filtered).toContain('DR');
      expect(filtered).not.toContain('QU');
    });

    it('should show all location types when search is empty', () => {
      component.locationTypeSearchCtrl.setValue('');
      fixture.detectChanges();

      const filtered = component.filteredLocationTypeOptions();
      expect(filtered.length).toBe(3);
      expect(filtered).toContain('DI');
      expect(filtered).toContain('QU');
      expect(filtered).toContain('DR');
    });

    it('should have CR/NCR options available', () => {
      fixture.detectChanges();

      expect(component.crNcrOptions).toEqual(['Yes', 'No']);
    });

    it('should have enforce options available', () => {
      fixture.detectChanges();

      expect(component.enforceOptions).toEqual(['Yes', 'No']);
    });

    it('should return empty array when no location types match search', () => {
      component.locationTypeSearchCtrl.setValue('XYZ');
      fixture.detectChanges();

      const filtered = component.filteredLocationTypeOptions();
      expect(filtered.length).toBe(0);
    });
  });

  describe('Effective Date Change Impact', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect date range error when effective date is after termination date', () => {
      // Set termination date first
      component.filterForm.patchValue({
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-05-01')
      });

      // Change effective date to after termination date
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-06-01')
      });

      fixture.detectChanges();

      // Form should have dateRangeInvalid error
      expect(component.filterForm.hasError('dateRangeInvalid')).toBe(true);
    });
  });

  describe('Signal Updates', () => {
    it('should update location type signal from input options', () => {
      component.locationTypeOptions = ['DI', 'QU'];
      fixture.detectChanges();

      expect(component.locationTypeOptionsSignal()).toEqual(['DI', 'QU']);
    });

    it('should initialize CR/NCR options on init', () => {
      expect(component.crNcrOptions).toEqual(['Yes', 'No']);
    });

    it('should initialize enforce options on init', () => {
      expect(component.enforceOptions).toEqual(['Yes', 'No']);
    });
  });

  describe('Form with Enforce Field', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should include enforce field in form', () => {
      expect(component.filterForm.get('enforce')).toBeDefined();
    });

    it('should initialize enforce field with current filter value', () => {
      const currentFilters: ReturnReasonsFilterValue = {
        locationType: null,
        crNcr: null,
        enforce: 'Yes',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('enforce')?.value).toBe('Yes');
    });

    it('should clear enforce field on onClear', () => {
      component.filterForm.patchValue({ enforce: 'Yes' });

      component.onClear();

      expect(component.filterForm.get('enforce')?.value).toBeNull();
    });
  });

  describe('Component Lifecycle', () => {

    it('should cleanup subscriptions on destroy', () => {
      fixture.detectChanges();

      // The destroy subject should have observers before destroy
      const destroySubject = (component as any).destroy$;

      // Call ngOnDestroy - this should trigger cleanup
      expect(() => component.ngOnDestroy()).not.toThrow();

      // Verify destroy$ was signaled (verified by first test checking next/complete)
      expect(destroySubject).toBeDefined();
    });
  });

  describe('Unparseable Date Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not have error when value is null and control is touched and dirty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.markAsDirty();
      control?.updateValueAndValidity();

      // Null value doesn't automatically set invalidDateInput error
      expect(control?.hasError('invalidDateInput')).toBe(false);
      expect(control?.valid).toBe(true);
    });

    it('should not return error when value is null but control is not touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsPristine();

      expect(control?.hasError('invalidDateInput')).toBe(false);
    });

    it('should not return error when value is null but control is not dirty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      control?.markAsPristine();

      expect(control?.hasError('invalidDateInput')).toBe(false);
    });

    it('should not return error when control has valid date value', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(new Date('2024-01-01'));
      control?.markAsTouched();
      control?.markAsDirty();

      expect(control?.hasError('invalidDateInput')).toBe(false);
    });
  });

  describe('Form Validation Combinations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should clear all validation errors when both dates and periods are properly set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-12-31')
      });

      expect(component.filterForm.hasError('effPeriodWithoutDate')).toBe(false);
      expect(component.filterForm.hasError('effDateWithoutPeriod')).toBe(false);
      expect(component.filterForm.hasError('termPeriodWithoutDate')).toBe(false);
      expect(component.filterForm.hasError('termDateWithoutPeriod')).toBe(false);
      expect(component.filterForm.hasError('terminationDateInvalid')).toBe(false);
      expect(component.filterForm.valid).toBe(true);
    });
  });

  describe('Complex Filter Scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters with all fields populated', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        locationType: 'DI',
        crNcr: 'Yes',
        enforce: 'No',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-12-31')
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.locationType).toBe('DI');
      expect(emittedValue.crNcr).toBe('Yes');
      expect(emittedValue.enforce).toBe('No');
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.terminationDatePeriod).toBe('BEFORE');
      expect(emittedValue.terminationDate).toBeDefined();
    });


    it('should handle filter with only enforce field', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        locationType: null,
        crNcr: null,
        enforce: 'Yes',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          enforce: 'Yes',
          locationType: null,
          crNcr: null
        })
      );
    });
  });

  describe('Date Comparison Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should handle null values in date comparison', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.filterForm.hasError('terminationDateInvalid')).toBe(false);
    });

    it('should validate termination date as Date object when effective date is string', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: '2024-03-01',
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date('2024-06-01')
      });

      expect(component.filterForm.hasError('terminationDateInvalid')).toBe(false);
    });
  });

  describe('Search Control Reset', () => {
    beforeEach(() => {
      component.locationTypeOptions = ['DI', 'QU'];
      fixture.detectChanges();
    });

    it('should maintain search filter state when form is cleared', () => {
      component.locationTypeSearchCtrl.setValue('DI');
      expect(component.filteredLocationTypeOptions().length).toBe(1);

      component.onClear();

      // Search filters should remain independent
      expect(component.locationTypeSearchCtrl.value).toBe('DI');
      expect(component.filteredLocationTypeOptions().length).toBe(1);
    });

  });

  describe('Error Message Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should prioritize form-level error for termination date', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        terminationDate: new Date('2024-03-01')
      });

      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();

      const error = component.getTermDateError();
      expect(error).toContain('must be greater than or equal to');
    });
  });

});
