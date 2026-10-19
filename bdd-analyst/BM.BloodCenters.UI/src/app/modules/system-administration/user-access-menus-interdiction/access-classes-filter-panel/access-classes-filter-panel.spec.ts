import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AccessClassesFilterPanel } from './access-classes-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AccessClassesFilterValue } from '../models/user-access-filters.model';
import { UserAccessService } from '../services/user-access.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('AccessClassesFilterPanel', () => {
  let component: AccessClassesFilterPanel;
  let fixture: ComponentFixture<AccessClassesFilterPanel>;
  let mockService: jasmine.SpyObj<UserAccessService>;

  const mockFilterDataResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        class: ['ADMIN', 'USER', 'GUEST']
      }
    ],
    total: 1
  };

  const mockCurrentFilters: AccessClassesFilterValue = {
    class: 'ADMIN',
    effectiveDatePeriod: 'After',
    effectiveDate: '2025-01-15',
    terminationDatePeriod: 'Before',
    terminationDate: '2025-12-31'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('UserAccessService', ['getAccessClassesFilterData']);
    mockService.getAccessClassesFilterData.and.returnValue(of(mockFilterDataResponse));



      TestBed.configureTestingModule({
      imports: [
        AccessClassesFilterPanel],
      providers: [
        { provide: UserAccessService, useValue: mockService },
        provideHttpClient()
      ]
    });


    


      mockService.getAccessClassesFilterData.calls.reset();


      mockService.getAccessClassesFilterData.and.returnValue(of(mockFilterDataResponse));


    fixture = TestBed.createComponent(AccessClassesFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should have predefined periodOptions', () => {
      expect(component.periodOptions).toEqual(['After', 'Before']);
    });


  });

  describe('ngOnInit', () => {


    it('should initialize form with default values when no currentFilters', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('class')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize form with currentFilters values', fakeAsync(() => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('class')?.value).toBe('ADMIN');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toBe('2025-01-15');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(component.filterForm.get('terminationDate')?.value).toBe('2025-12-31');
    }));

    it('should load filter options from service on init', () => {
      fixture.detectChanges();

      expect(mockService.getAccessClassesFilterData).toHaveBeenCalled();
      expect(component.classOptions()).toEqual(['ADMIN', 'USER', 'GUEST']);
    });



    it('should handle empty response data', () => {
      mockService.getAccessClassesFilterData.and.returnValue(of({
        success: true,
        statusCode: 200,
        data: [],
        total: 0
      }));

      fixture.detectChanges();

      expect(component.classOptions()).toEqual([]);
    });
  });



  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to default state', () => {
      component.filterForm.patchValue({
        class: 'ADMIN',
        effectiveDatePeriod: 'Before',
        effectiveDate: '2025-04-01',
        terminationDatePeriod: 'After',
        terminationDate: '2025-10-01'
      });

      component.onClear();

      expect(component.filterForm.get('class')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should maintain default period values after clear', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        terminationDatePeriod: 'After'
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });
  });
  describe('Filter Form Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get filter form value correctly', () => {
      component.filterForm.patchValue({
        class: 'USER',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      });

      const formValue = component.filterForm.value;

      expect(formValue.class).toBe('USER');
      expect(formValue.effectiveDatePeriod).toBe('After');
      expect(formValue.effectiveDate).toBe('2025-01-01');
      expect(formValue.terminationDatePeriod).toBe('Before');
      expect(formValue.terminationDate).toBe('2025-12-31');
    });

    it('should handle partial form values', () => {
      component.filterForm.patchValue({
        class: 'ADMIN',
        effectiveDate: '2025-05-15'
      });

      const formValue = component.filterForm.value;

      expect(formValue.class).toBe('ADMIN');
      expect(formValue.effectiveDate).toBe('2025-05-15');
      expect(formValue.terminationDate).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow selecting and applying filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        class: 'USER',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-02-01'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        class: 'USER',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-02-01'
      }));
    });

    it('should allow clearing and reselecting filters', () => {
      component.filterForm.patchValue({
        class: 'ADMIN',
        effectiveDate: '2025-03-15'
      });

      component.onClear();

      expect(component.filterForm.get('class')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();

      component.filterForm.patchValue({
        class: 'GUEST',
        effectiveDate: '2025-04-20'
      });

      expect(component.filterForm.get('class')?.value).toBe('GUEST');
      expect(component.filterForm.get('effectiveDate')?.value).toBe('2025-04-20');
    });

    it('should handle date changes correctly', () => {
      const testDate = new Date('2025-06-15');

      component.filterForm.patchValue({
        effectiveDate: testDate
      });

      expect(component.filterForm.get('effectiveDate')?.value).toBe(testDate);
    });


  });

  describe('onClose', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark control as touched and dirty', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onDateInput(event, 'effectiveDate');

      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.touched).toBe(true);
      expect(ctrl?.dirty).toBe(true);
    });

    it('should clear errors when input is empty', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setErrors({ invalidDate: true });

      const event = { target: { value: '' } } as any;
      component.onDateInput(event, 'effectiveDate');

      expect(ctrl?.errors).toBeNull();
    });

    it('should set invalidDate error when input is non-empty but control value is null', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setValue(null, { emitEvent: false });

      const event = { target: { value: 'baddate' } } as any;
      component.onDateInput(event, 'effectiveDate');

      expect(ctrl?.hasError('invalidDate')).toBe(true);
    });

    it('should do nothing if control does not exist', () => {
      const event = { target: { value: 'test' } } as any;
      expect(() => component.onDateInput(event, 'nonExistentControl')).not.toThrow();
    });

    it('should work for terminationDate control', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      component.onDateInput(event, 'terminationDate');

      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.touched).toBe(true);
      expect(ctrl?.dirty).toBe(true);
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.getDateErrorMessage', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.getDateErrorMessage', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when form is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when no values are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when class has value and form is valid', () => {
      component.filterForm.patchValue({ class: 'ADMIN' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effectiveDate has value and period set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: 'After',
      });
      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('loadFilterOptions error handling', () => {
    it('should set isLoadingFilters false on error', () => {
      mockService.getAccessClassesFilterData.and.returnValue(throwError(() => new Error('API error')));
      spyOn(console, 'error');

      component.loadFilterOptions();

      expect(component.isLoadingFilters).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('filteredClassOptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all options when search is empty', () => {
      component.classSearchControl.setValue('');
      expect(component.filteredClassOptions()).toEqual(['ADMIN', 'USER', 'GUEST']);
    });

    it('should filter options by search term', () => {
      component.classSearchControl.setValue('ADM');
      expect(component.filteredClassOptions()).toEqual(['ADMIN']);
    });

    it('should be case insensitive', () => {
      component.classSearchControl.setValue('admin');
      expect(component.filteredClassOptions()).toEqual(['ADMIN']);
    });

    it('should return empty when no match', () => {
      component.classSearchControl.setValue('ZZZZ');
      expect(component.filteredClassOptions()).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete the destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setupValidation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add required validator to effectiveDatePeriod when effectiveDate is set', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      const periodCtrl = component.filterForm.get('effectiveDatePeriod');
      periodCtrl?.setValue(null);
      periodCtrl?.updateValueAndValidity();
      expect(periodCtrl?.hasError('required')).toBe(true);
    }));

    it('should clear validators from effectiveDatePeriod when effectiveDate is null', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      component.filterForm.patchValue({ effectiveDate: null });
      tick();

      const periodCtrl = component.filterForm.get('effectiveDatePeriod');
      periodCtrl?.updateValueAndValidity();
      expect(periodCtrl?.hasError('required')).toBe(false);
    }));

    it('should add required validator to terminationDatePeriod when terminationDate is set', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2025-12-31') });
      tick();

      const periodCtrl = component.filterForm.get('terminationDatePeriod');
      periodCtrl?.setValue(null);
      periodCtrl?.updateValueAndValidity();
      expect(periodCtrl?.hasError('required')).toBe(true);
    }));

    it('should clear validators from terminationDatePeriod when terminationDate is null', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2025-12-31') });
      tick();

      component.filterForm.patchValue({ terminationDate: null });
      tick();

      const periodCtrl = component.filterForm.get('terminationDatePeriod');
      periodCtrl?.updateValueAndValidity();
      expect(periodCtrl?.hasError('required')).toBe(false);
    }));

    it('should revalidate when effectiveDatePeriod changes', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      tick();

      const periodCtrl = component.filterForm.get('effectiveDatePeriod');
      expect(periodCtrl?.valid).toBe(true);
    }));

    it('should revalidate when terminationDatePeriod changes', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2025-12-31') });
      tick();

      component.filterForm.patchValue({ terminationDatePeriod: 'Before' });
      tick();

      const periodCtrl = component.filterForm.get('terminationDatePeriod');
      expect(periodCtrl?.valid).toBe(true);
    }));
  });

  describe('onApply with invalid form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should NOT emit when form is invalid due to required period', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onApply with Date values (formatDateToYMD)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format Date to YYYY-MM-DD string in emitted value', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        class: 'ADMIN',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-06-15'),
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        class: 'ADMIN',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-06-15',
      }));
    });

    it('should format terminationDate to YYYY-MM-DD string', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        class: 'USER',
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31'),
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        terminationDate: '2025-12-31',
      }));
    });

    it('should emit null dates when no date values set', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ class: 'GUEST' });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: null,
        terminationDate: null,
      }));
    });
  });
});
