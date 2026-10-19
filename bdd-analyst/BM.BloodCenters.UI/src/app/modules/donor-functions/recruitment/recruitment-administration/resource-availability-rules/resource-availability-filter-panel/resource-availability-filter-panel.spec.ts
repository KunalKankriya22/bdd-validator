import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ResourceAvailabilityFilterPanel } from './resource-availability-filter-panel';
import { ResourceAvailabilityRulesService } from '../services/resource-availability-rules.service';
import { ResourceAvailabilityFilterValue } from '../models/resource-availability-rules.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter, DD_MMM_YYYY_FORMAT } from 'src/app/core/utils/date-adapter.util';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ResourceAvailabilityFilterPanel', () => {
  let component: ResourceAvailabilityFilterPanel;
  let fixture: ComponentFixture<ResourceAvailabilityFilterPanel>;
  let mockService: jasmine.SpyObj<ResourceAvailabilityRulesService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockWeekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ResourceAvailabilityRulesService', ['getWeekDays']);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    mockHeaderService = createMockHeaderService();

    // Set up default return values for HeaderService
      TestBed.configureTestingModule({
imports: [
        ResourceAvailabilityFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule
      ],
      providers: [
        FormBuilder,
        { provide: ResourceAvailabilityRulesService, useValue: mockService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MMM_YYYY_FORMAT }
      ]
    });


    });



  beforeEach(() => {
    mockService.getWeekDays.and.returnValue(of(mockWeekDays));
    fixture = TestBed.createComponent(ResourceAvailabilityFilterPanel);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {


    it('should load week days from service on init', () => {
      fixture.detectChanges();
      expect(mockService.getWeekDays).toHaveBeenCalled();
      expect(component.weekDays).toEqual(mockWeekDays);
    });

    it('should use fallback week days when service fails', () => {
      mockService.getWeekDays.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(component.weekDays).toEqual(mockWeekDays);
    });

  });

  describe('Form Initialization with Current Filters', () => {

    it('should keep "ALL" day value as "ALL"', () => {
      component.currentFilters = {
        day: 'ALL',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('day')?.value).toBe('ALL');
    });

    it('should initialize with null when currentFilters.day is null', () => {
      component.currentFilters = {
        day: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('day')?.value).toBeNull();
    });

    it('should handle effectiveDateTo (Before) correctly', () => {
      component.currentFilters = {
        day: null,
        effectiveDateFrom: null,
        effectiveDateTo: '2024-01-15',
        terminationDateFrom: null,
        terminationDateTo: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('Before');
    });

    it('should handle terminationDateFrom (After) correctly', () => {
      component.currentFilters = {
        day: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: '2024-01-15',
        terminationDateTo: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('After');
    });

    it('should handle invalid date strings gracefully', () => {
      component.currentFilters = {
        day: null,
        effectiveDateFrom: 'invalid-date',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('Effective Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require period when valid effective date is entered', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2024-01-15'));
      effectiveDateControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should not require period when effective date is invalid', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setErrors({ invalidDateFormat: true });
      effectiveDateControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBeFalsy();
    });


    it('should mark period as touched when valid date is selected', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2024-01-15'));

      expect(periodControl?.touched).toBe(true);
    });
  });

  describe('Termination Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require period when valid termination date is entered', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setValue(new Date('2024-12-31'));
      terminationDateControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should not require period when termination date is invalid', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setErrors({ invalidDateFormat: true });
      terminationDateControl?.markAsTouched();

      expect(periodControl?.hasError('required')).toBeFalsy();
    });


    it('should mark period as touched when valid date is selected', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setValue(new Date('2024-12-31'));

      expect(periodControl?.touched).toBe(true);
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });











    it('should mark all controls as touched when validation fails', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const terminationDateControl = component.filterForm.get('terminationDate');
      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');

      effectiveDateControl?.setErrors({ invalidDateFormat: true });
      component.onApply();

      expect(effectiveDateControl?.touched).toBe(true);
      expect(terminationDateControl?.touched).toBe(true);
      expect(effectiveDatePeriodControl?.touched).toBe(true);
      expect(terminationDatePeriodControl?.touched).toBe(true);
    });

    it('should format dates correctly with padding', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date('2024-03-05'); // Single digit month and day

      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'After'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDateFrom).toBe('2024-03-05');
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no values are entered', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when day is selected', () => {
      component.filterForm.patchValue({ day: 'MON' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effective date period is selected', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effective date is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'After'
      });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when termination date period is selected', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'Before' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when termination date is selected', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'Before'
      });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when effective date is invalid', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      effectiveDateControl?.setValue(new Date('2024-01-15'));
      effectiveDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date is invalid', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      terminationDateControl?.setValue(new Date('2024-12-31'));
      terminationDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when period has errors', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2024-01-15'));
      periodControl?.setErrors({ required: true });

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset the form', () => {
      component.filterForm.patchValue({
        day: 'MON',
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'After'
      });

      component.onClear();

      expect(component.filterForm.get('day')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    });


    it('should clear period errors', () => {
      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');

      effectiveDatePeriodControl?.setErrors({ required: true });
      terminationDatePeriodControl?.setErrors({ required: true });

      component.onClear();

      expect(effectiveDatePeriodControl?.errors).toBeNull();
      expect(terminationDatePeriodControl?.errors).toBeNull();
    });

    it('should trigger change detection', () => {
      component.onClear();
    });
  });
  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input value', () => {
      const mockEvent = {
        target: { value: 'invalid-date' } as HTMLInputElement
      } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

      expect(component['effectiveDateRawInput']).toBe('invalid-date');
    });

    it('should mark control as dirty', () => {
      const control = component.filterForm.get('effectiveDate');
      const mockEvent = {
        target: { value: '01-JAN-2024' } as HTMLInputElement
      } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

      expect(control?.dirty).toBe(true);
    });


    it('should trigger change detection', () => {
      const mockEvent = {
        target: { value: '01-JAN-2024' } as HTMLInputElement
      } as unknown as Event;

      component.onEffectiveDateInput(mockEvent);

    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control has no value', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'invalid-date';
      const mockInput = { value: '' } as HTMLInputElement;
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-date');
    }));

    it('should not restore input when control has value', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'invalid-date';
      const mockInput = { value: '01-JAN-2024' } as HTMLInputElement;
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(new Date('2024-01-01'));

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('01-JAN-2024');
    }));

    it('should mark control as touched', fakeAsync(() => {
      const control = component.filterForm.get('effectiveDate');
      const mockInput = { value: '' } as HTMLInputElement;

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(control?.touched).toBe(true);
    }));

    it('should trigger change detection', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;

      component.onEffectiveDateBlur(mockInput);
      tick();

    }));
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input value', () => {
      const mockEvent = {
        target: { value: 'invalid-date' } as HTMLInputElement
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      expect(component['terminationDateRawInput']).toBe('invalid-date');
    });

    it('should mark control as dirty', () => {
      const control = component.filterForm.get('terminationDate');
      const mockEvent = {
        target: { value: '31-DEC-2024' } as HTMLInputElement
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

      expect(control?.dirty).toBe(true);
    });


    it('should trigger change detection', () => {
      const mockEvent = {
        target: { value: '31-DEC-2024' } as HTMLInputElement
      } as unknown as Event;

      component.onTerminationDateInput(mockEvent);

    });
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control has no value', fakeAsync(() => {
      component['terminationDateRawInput'] = 'invalid-date';
      const mockInput = { value: '' } as HTMLInputElement;
      const control = component.filterForm.get('terminationDate');
      control?.setValue(null);

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-date');
    }));

    it('should not restore input when control has value', fakeAsync(() => {
      component['terminationDateRawInput'] = 'invalid-date';
      const mockInput = { value: '31-DEC-2024' } as HTMLInputElement;
      const control = component.filterForm.get('terminationDate');
      control?.setValue(new Date('2024-12-31'));

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('31-DEC-2024');
    }));

    it('should mark control as touched', fakeAsync(() => {
      const control = component.filterForm.get('terminationDate');
      const mockInput = { value: '' } as HTMLInputElement;

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(control?.touched).toBe(true);
    }));

    it('should trigger change detection', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;

      component.onTerminationDateBlur(mockInput);
      tick();

    }));
  });

  describe('Status Change Subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate period when effective date status changes to valid', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setErrors({ invalidDateFormat: true });
      effectiveDateControl?.setValue(new Date('2024-01-15'));
      effectiveDateControl?.setErrors(null);
      effectiveDateControl?.updateValueAndValidity();

      expect(periodControl?.hasError('required')).toBe(true);
    });

    it('should validate period when termination date status changes to valid', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setErrors({ invalidDateFormat: true });
      terminationDateControl?.setValue(new Date('2024-12-31'));
      terminationDateControl?.setErrors(null);
      terminationDateControl?.updateValueAndValidity();

      expect(periodControl?.hasError('required')).toBe(true);
    });
  });

  describe('Period Value Change Subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should revalidate when effective date period changes', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2024-01-15'));
      expect(periodControl?.hasError('required')).toBe(true);

      periodControl?.setValue('After');
      expect(periodControl?.errors).toBeNull();
    });

    it('should revalidate when termination date period changes', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setValue(new Date('2024-12-31'));
      expect(periodControl?.hasError('required')).toBe(true);

      periodControl?.setValue('Before');
      expect(periodControl?.errors).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle matDatepickerParse error for effective date', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      effectiveDateControl?.setValue(null);

      expect(periodControl?.hasError('required')).toBeFalsy();
    });

    it('should handle matDatepickerParse error for termination date', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      terminationDateControl?.setValue(null);

      expect(periodControl?.hasError('required')).toBeFalsy();
    });


    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = null;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
