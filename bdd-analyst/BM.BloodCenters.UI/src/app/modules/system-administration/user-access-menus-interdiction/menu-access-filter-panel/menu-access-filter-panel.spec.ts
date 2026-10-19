import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MenuAccessFilterPanel } from './menu-access-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MenuAccessFilterValue } from '../models/user-access-filters.model';
import { UserAccessService } from '../services/user-access.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';

describe('MenuAccessFilterPanel', () => {
  let component: MenuAccessFilterPanel;
  let fixture: ComponentFixture<MenuAccessFilterPanel>;
  let mockService: jasmine.SpyObj<UserAccessService>;

  const mockFilterDataResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        menuTitle: ['User Management', 'Reports', 'Dashboard'],
        program: ['SYS', 'RPT', 'DASH']
      }
    ],
    total: 1
  };

  const mockCurrentFilters: MenuAccessFilterValue = {
    menuTitle: 'User Management',
    program: 'SYS',
    effectiveDatePeriod: 'After',
    effectiveDate: '2025-01-15',
    terminationDatePeriod: 'Before',
    terminationDate: '2025-12-31'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('UserAccessService', ['getMenuFilterData']);
    mockService.getMenuFilterData.and.returnValue(of(mockFilterDataResponse));



      TestBed.configureTestingModule({
      imports: [
        MenuAccessFilterPanel],
      providers: [
        { provide: UserAccessService, useValue: mockService },
        provideHttpClient()
      ]
    });


    


      mockService.getMenuFilterData.calls.reset();


      mockService.getMenuFilterData.and.returnValue(of(mockFilterDataResponse));


    fixture = TestBed.createComponent(MenuAccessFilterPanel);
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

      expect(component.filterForm.get('menuTitle')?.value).toBeNull();
      expect(component.filterForm.get('program')?.value).toBeNull();
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

      expect(component.filterForm.get('menuTitle')?.value).toBe('User Management');
      expect(component.filterForm.get('program')?.value).toBe('SYS');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toBe('2025-01-15');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(component.filterForm.get('terminationDate')?.value).toBe('2025-12-31');
    }));

    it('should load filter options from service on init', () => {
      fixture.detectChanges();

      expect(mockService.getMenuFilterData).toHaveBeenCalled();
      expect(component.menuTitleOptions()).toEqual(['User Management', 'Reports', 'Dashboard']);
      expect(component.programOptions()).toEqual(['SYS', 'RPT', 'DASH']);
    });

    it('should filter out "All" from filter options', () => {
      mockService.getMenuFilterData.and.returnValue(of({
        success: true,
        statusCode: 200,
        data: [{
          menuTitle: ['All', 'User Management', 'Reports'],
          program: ['All', 'SYS', 'RPT']
        }],
        total: 1
      }));

      fixture.detectChanges();

      expect(component.menuTitleOptions()).not.toContain('All');
      expect(component.programOptions()).not.toContain('All');
      expect(component.menuTitleOptions()).toEqual(['User Management', 'Reports']);
      expect(component.programOptions()).toEqual(['SYS', 'RPT']);
    });


  });



  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to default state', () => {
      component.filterForm.patchValue({
        menuTitle: 'User Management',
        program: 'SYS',
        effectiveDatePeriod: 'Before',
        effectiveDate: '2025-04-01',
        terminationDatePeriod: 'After',
        terminationDate: '2025-10-01'
      });

      component.onClear();

      expect(component.filterForm.get('menuTitle')?.value).toBeNull();
      expect(component.filterForm.get('program')?.value).toBeNull();
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
        menuTitle: 'Reports',
        program: 'RPT',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      });

      const formValue = component.filterForm.value;

      expect(formValue.menuTitle).toBe('Reports');
      expect(formValue.program).toBe('RPT');
      expect(formValue.effectiveDatePeriod).toBe('After');
      expect(formValue.effectiveDate).toBe('2025-01-01');
      expect(formValue.terminationDatePeriod).toBe('Before');
      expect(formValue.terminationDate).toBe('2025-12-31');
    });

    it('should handle partial form values', () => {
      component.filterForm.patchValue({
        menuTitle: 'Dashboard',
        effectiveDate: '2025-05-15'
      });

      const formValue = component.filterForm.value;

      expect(formValue.menuTitle).toBe('Dashboard');
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
        menuTitle: 'User Management',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-02-01'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        menuTitle: 'User Management',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-02-01'
      }));
    });

    it('should allow clearing and reselecting filters', () => {
      component.filterForm.patchValue({
        menuTitle: 'Reports',
        effectiveDate: '2025-03-15'
      });

      component.onClear();

      expect(component.filterForm.get('menuTitle')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();

      component.filterForm.patchValue({
        menuTitle: 'Dashboard',
        effectiveDate: '2025-04-20'
      });

      expect(component.filterForm.get('menuTitle')?.value).toBe('Dashboard');
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
    it('should emit close event', () => {
      fixture.detectChanges();
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('onDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark control as touched and dirty, and set invalidDate error when input has text but no parsed value', () => {
      const event = { target: { value: 'invalid-date' } } as any;
      component.filterForm.get('effectiveDate')?.setValue(null);

      component.onDateInput(event, 'effectiveDate');

      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
      expect(control?.hasError('invalidDate')).toBeTrue();
    });

    it('should clear errors when input is empty', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      const event = { target: { value: '' } } as any;
      component.onDateInput(event, 'effectiveDate');

      expect(control?.errors).toBeNull();
    });

    it('should clear errors when input is whitespace only', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });

      const event = { target: { value: '   ' } } as any;
      component.onDateInput(event, 'terminationDate');

      expect(control?.errors).toBeNull();
    });

    it('should not set invalidDate when control has a parsed value', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(new Date('2025-06-15'));

      const event = { target: { value: '15-JUN-2025' } } as any;
      component.onDateInput(event, 'effectiveDate');

      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should do nothing for a non-existent control name', () => {
      const event = { target: { value: 'test' } } as any;
      // Should not throw
      expect(() => component.onDateInput(event, 'nonExistent')).not.toThrow();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return error message when control has invalidDate error and is touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      const result = component.getEffectiveDateError();
      expect(result).toContain('invalid');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error message when control has invalidDate error and is touched', () => {
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      const result = component.getTerminationDateError();
      expect(result).toContain('invalid');
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when form has no values (nothing selected)', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when form has a menuTitle value and form is valid', () => {
      component.filterForm.patchValue({ menuTitle: 'Reports' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.patchValue({ menuTitle: 'Reports' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.patchValue({ menuTitle: 'Reports' });
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.patchValue({ menuTitle: 'Reports' });
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.patchValue({ menuTitle: 'Reports' });
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when form is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValidators([Validators.required]);
      component.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity();

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when program has a value', () => {
      component.filterForm.patchValue({ program: 'SYS' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when effectiveDatePeriod has a value', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when effectiveDate has a value', () => {
      component.filterForm.patchValue({ effectiveDate: new Date() });
      // Also need period for form to be valid
      component.filterForm.patchValue({ effectiveDatePeriod: 'Before' });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('loadFilterOptions error handling', () => {
    it('should handle error from service and set isLoadingFilters to false', () => {
      spyOn(console, 'error');
      mockService.getMenuFilterData.and.returnValue(throwError(() => new Error('API Error')));

      fixture = TestBed.createComponent(MenuAccessFilterPanel);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Error loading filter options:', jasmine.any(Error));
      expect(component.isLoadingFilters).toBeFalse();
    });
  });

  describe('filteredMenuTitles and filteredPrograms', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all menuTitleOptions when no search term', () => {
      expect(component.filteredMenuTitles()).toEqual(['User Management', 'Reports', 'Dashboard']);
    });

    it('should filter menuTitles by search term', () => {
      component.menuTitleSearchControl.setValue('rep');

      expect(component.filteredMenuTitles()).toEqual(['Reports']);
    });

    it('should return all programOptions when no search term', () => {
      expect(component.filteredPrograms()).toEqual(['SYS', 'RPT', 'DASH']);
    });

    it('should filter programs by search term', () => {
      component.programSearchControl.setValue('sys');

      expect(component.filteredPrograms()).toEqual(['SYS']);
    });

    it('should return empty when search matches nothing', () => {
      component.menuTitleSearchControl.setValue('xyz_no_match');

      expect(component.filteredMenuTitles()).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      fixture.detectChanges();

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onApply with invalid form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should NOT emit when effectiveDate is set without period (form invalid)', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date('2025-06-15'),
        effectiveDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should NOT emit when terminationDate is set without period (form invalid)', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('onApply with Date values (formatDateToYMD)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format Date values to YYYY-MM-DD strings in emitted value', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 5, 15), // June 15, 2025
        terminationDatePeriod: 'Before',
        terminationDate: new Date(2025, 11, 31) // Dec 31, 2025
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: '2025-06-15',
        terminationDate: '2025-12-31'
      }));
    });

    it('should set null for effectiveDate and terminationDate when not provided', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        menuTitle: 'Reports'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: null,
        terminationDate: null
      }));
    });
  });

  describe('validateEffectivePeriod and validateTerminationPeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require effectiveDatePeriod when effectiveDate is set', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    }));

    it('should clear effectiveDatePeriod validators when effectiveDate is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2025-06-15') });
      tick();

      component.filterForm.patchValue({ effectiveDate: null });
      tick();

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeFalse();
    }));

    it('should require terminationDatePeriod when terminationDate is set', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2025-12-31') });
      tick();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    }));

    it('should clear terminationDatePeriod validators when terminationDate is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2025-12-31') });
      tick();

      component.filterForm.patchValue({ terminationDate: null });
      tick();

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBeFalse();
    }));
  });
});
