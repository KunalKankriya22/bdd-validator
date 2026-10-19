import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefineOrderChargesFilterPanel } from './define-order-charges-filter-panel';
import { DefineOrderChargesService } from '../services/define-order-charges.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('DefineOrderChargesFilterPanel', () => {
  let serviceSpy: any;
  let component: DefineOrderChargesFilterPanel;
  let fixture: ComponentFixture<DefineOrderChargesFilterPanel>;
  let service: jasmine.SpyObj<DefineOrderChargesService>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineOrderChargesService', [
      'getFilterServiceCodes'
    ]);

    serviceSpy.getFilterServiceCodes.and.returnValue(of([]));



      TestBed.configureTestingModule({
imports: [DefineOrderChargesFilterPanel, NoopAnimationsModule],
      providers: [
        { provide: DefineOrderChargesService, useValue: serviceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getFilterServiceCodes.calls.reset();


      serviceSpy.getFilterServiceCodes.and.returnValue(of([]));


    service = TestBed.inject(DefineOrderChargesService) as jasmine.SpyObj<DefineOrderChargesService>;

    fixture = TestBed.createComponent(DefineOrderChargesFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Form Initialization', () => {

    it('should populate form with current filters when provided', () => {
      const filters = {
        serviceCode: 'TEST001',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER' as const,
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE' as const
      };

      component.currentFilters = filters;
      component.ngOnInit();

      expect(component.filterForm.get('serviceCode')?.value).toBe('TEST001');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
    });

  });

  describe('Service Code Options', () => {
    it('should populate serviceCodeOptions from API response', () => {
      service.getFilterServiceCodes.and.returnValue(of([
        { code: 'SVC01', description: 'Service 1' },
        { code: 'SVC02', description: 'Service 2' }
      ]));

      component.ngOnInit();

      expect(component.serviceCodeOptions).toEqual(['SVC01', 'SVC02']);
      expect(component.filteredServiceCodeOptions).toEqual(['SVC01', 'SVC02']);
      expect(component.isLoadingFilters).toBe(false);
    });

    it('should handle API error and set empty arrays', () => {
      service.getFilterServiceCodes.and.returnValue(throwError(() => new Error('API error')));

      component.ngOnInit();

      expect(component.serviceCodeOptions).toEqual([]);
      expect(component.filteredServiceCodeOptions).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    });

    it('should filter options when search control changes', () => {
      component.serviceCodeOptions = ['SVC01', 'SVC02', 'ABC01'];
      component.filteredServiceCodeOptions = [...component.serviceCodeOptions];

      component.serviceCodeSearchControl.setValue('SVC');

      expect(component.filteredServiceCodeOptions).toEqual(['SVC01', 'SVC02']);
    });

    it('should show all options when search is cleared', () => {
      component.serviceCodeOptions = ['SVC01', 'SVC02', 'ABC01'];
      component.filteredServiceCodeOptions = ['SVC01'];

      component.serviceCodeSearchControl.setValue('');

      expect(component.filteredServiceCodeOptions.length).toBe(3);
    });
  });

  describe('Period Validation', () => {
    it('should set error on effectiveDatePeriod when date is set but period is not', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2025-01-01'));
      fixture.detectChanges();

      component.onApply();
      fixture.detectChanges();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });


    it('should set error on terminationDatePeriod when date is set but period is not', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date('2025-12-31'));
      fixture.detectChanges();

      component.onApply();
      fixture.detectChanges();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });

  });
  describe('onApply', () => {


    it('should format date as YYYY-MM-DD for API', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 4, 15), // May 15, 2025
        effectiveDatePeriod: 'AFTER'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDate: '2025-05-15',
          effectiveDatePeriod: 'AFTER'
        })
      );
    });

  });

  describe('onClear', () => {
    it('should clear all form values', () => {
      component.filterForm.patchValue({
        serviceCode: 'TEST001',
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: 'BEFORE'
      });

      component.onClear();

      expect(component.filterForm.get('serviceCode')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should clear period errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when form has no values', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when serviceCode is set', () => {
      component.filterForm.patchValue({ serviceCode: 'SVC01' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be disabled when effectiveDatePeriod set but no date', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'AFTER' });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when terminationDatePeriod set but no date', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'BEFORE' });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when both effective date and period set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER'
      });
      // Clear period errors that might be set by the listener
      component.filterForm.get('effectiveDatePeriod')?.setErrors(null);
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be enabled when both termination date and period set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      });
      component.filterForm.get('terminationDatePeriod')?.setErrors(null);
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be disabled when period control has errors', () => {
      component.filterForm.patchValue({ serviceCode: 'SVC01' });
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('getEffectiveDateError', () => {
    it('should return empty string when control not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string when no errors', () => {
      component.filterForm.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return error for matDatepickerParse', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when control not touched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when no errors', () => {
      component.filterForm.get('terminationDate')?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error for matDatepickerParse', () => {
      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('Error State Matchers', () => {
    it('effDateErrorMatcher should return false for null control', () => {
      expect(component.effDateErrorMatcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('effDateErrorMatcher should return false for untouched control', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(component.effDateErrorMatcher.isErrorState(control as any, null as any)).toBe(false);
    });

    it('effDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.effDateErrorMatcher.isErrorState(control as any, null as any)).toBe(true);
    });

    it('termDateErrorMatcher should return false for null control', () => {
      expect(component.termDateErrorMatcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('termDateErrorMatcher should return true for invalid touched control', () => {
      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.termDateErrorMatcher.isErrorState(control as any, null as any)).toBe(true);
    });
  });

  describe('validateEffectiveDatePeriod', () => {
    it('should set error when date is set but period is not', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(2025, 0, 1) });
      fixture.detectChanges();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should clear error when both date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER'
      });
      fixture.detectChanges();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBe(false);
    });
  });

  describe('validateTerminationDatePeriod', () => {
    it('should set error when date is set but period is not', () => {
      component.filterForm.patchValue({ terminationDate: new Date(2025, 11, 31) });
      fixture.detectChanges();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should clear error when both date and period are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      });
      fixture.detectChanges();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBe(false);
    });
  });

  describe('onApply additional scenarios', () => {
    it('should emit filters with service code only', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ serviceCode: 'SVC01' });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        serviceCode: 'SVC01',
        effectiveDate: null,
        terminationDate: null
      }));
    });

    it('should emit filters with termination date', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDate: new Date(2025, 11, 31),
        terminationDatePeriod: 'BEFORE'
      });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE'
      }));
    });

    it('should not emit when effective date control has errors', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when termination date control has errors', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('formatDateForApi', () => {
    it('should return null for null date', () => {
      expect(component['formatDateForApi'](null)).toBeNull();
    });

    it('should return null for invalid date', () => {
      spyOn(console, 'error');
      expect(component['formatDateForApi'](new Date('invalid'))).toBeNull();
    });

    it('should format valid date as YYYY-MM-DD', () => {
      expect(component['formatDateForApi'](new Date(2025, 0, 15))).toBe('2025-01-15');
    });
  });

  describe('loadFilterOptions with non-array response', () => {
    it('should not update options for non-array response', () => {
      service.getFilterServiceCodes.and.returnValue(of({ data: 'not-array' }));
      component.ngOnInit();
      expect(component.serviceCodeOptions).toEqual([]);
      expect(component.isLoadingFilters).toBe(false);
    });
  });

  describe('statusChanges for dates', () => {
    it('should mark effectiveDatePeriod touched when effective date becomes valid', () => {
      const effDateControl = component.filterForm.get('effectiveDate');
      effDateControl?.setValue(new Date(2025, 5, 15));
      effDateControl?.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.touched).toBe(true);
    });

    it('should mark terminationDatePeriod touched when termination date becomes valid', () => {
      const termDateControl = component.filterForm.get('terminationDate');
      termDateControl?.setValue(new Date(2025, 11, 31));
      termDateControl?.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.filterForm.get('terminationDatePeriod')?.touched).toBe(true);
    });
  });
});
