import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FilterCommunicationTypesComponent } from './filter-communication-types';
import { CommTypeFilter } from '../services/communication-types.service';

describe('FilterCommunicationTypesComponent', () => {
  let component: FilterCommunicationTypesComponent;
  let fixture: ComponentFixture<FilterCommunicationTypesComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FilterCommunicationTypesComponent>>;

  function createComponent(data: CommTypeFilter | null = null): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(FilterCommunicationTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [FilterCommunicationTypesComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();
  });

  describe('Initialization with no data', () => {
    beforeEach(() => createComponent(null));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the form with default values', () => {
      expect(component.filterForm.get('searchKeyword')?.value).toBe('');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should have empty error strings', () => {
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('Initialization with existing filter data', () => {
    const existingFilter: CommTypeFilter = {
      searchKeyword: 'test',
      effectiveDate: new Date(2025, 0, 1),
      terminationDate: new Date(2025, 11, 31),
      effectiveDatePeriod: 'AFTER',
      terminationDatePeriod: 'BEFORE',
    };

    beforeEach(() => createComponent(existingFilter));

    it('should patch form with provided data', () => {
      expect(component.filterForm.get('searchKeyword')?.value).toBe('test');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date(2025, 0, 1));
      expect(component.filterForm.get('terminationDate')?.value).toEqual(new Date(2025, 11, 31));
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
    });

    it('should run validation on init when data is provided', () => {
      // Both dates and periods are set, so no errors
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('Initialization with partial data (date without period)', () => {
    const partialFilter: CommTypeFilter = {
      effectiveDate: new Date(2025, 5, 15),
      terminationDate: new Date(2025, 6, 20),
    };

    beforeEach(() => createComponent(partialFilter));

    it('should set effectiveDatePeriodError when date is set but period is not', () => {
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should set terminationDatePeriodError when date is set but period is not', () => {
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should report hasValidationErrors as true when dates lack periods', () => {
      // The validateEffectiveDatePeriod and validateTerminationDatePeriod run during ngOnInit
      // and set error strings, which drives the hasValidationErrors and isApplyDisabled checks
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      expect(component.terminationDatePeriodError).toBe('Period is required');
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('effectiveDatePeriod valueChanges', () => {
    beforeEach(() => createComponent(null));

    it('should set error when effectiveDate is set but effectiveDatePeriod is cleared', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);

      expect(component.effectiveDatePeriodError).toBe('Period is required');
      expect(component.filterForm.get('effectiveDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear error when effectiveDatePeriod is set', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      expect(component.effectiveDatePeriodError).toBe('Period is required');

      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should clear error when effectiveDate is not set', () => {
      component.filterForm.get('effectiveDate')?.setValue(null);
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);

      expect(component.effectiveDatePeriodError).toBe('');
    });
  });

  describe('terminationDatePeriod valueChanges', () => {
    beforeEach(() => createComponent(null));

    it('should set error when terminationDate is set but terminationDatePeriod is cleared', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue(null);

      expect(component.terminationDatePeriodError).toBe('Period is required');
      expect(component.filterForm.get('terminationDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should clear error when terminationDatePeriod is set', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      expect(component.terminationDatePeriodError).toBe('Period is required');

      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.terminationDatePeriodError).toBe('');
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });

    it('should clear error when terminationDate is not set', () => {
      component.filterForm.get('terminationDate')?.setValue(null);
      component.filterForm.get('terminationDatePeriod')?.setValue(null);

      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('effectiveDate valueChanges', () => {
    beforeEach(() => createComponent(null));

    it('should mark effectiveDate control as touched on value change', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBe(false);

      control?.setValue(new Date(2025, 3, 10));

      expect(control?.touched).toBe(true);
    });

    it('should not re-mark if already touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      control?.setValue(new Date(2025, 3, 10));

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should trigger effective date period validation on date change', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 3, 10));

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });
  });

  describe('terminationDate valueChanges', () => {
    beforeEach(() => createComponent(null));

    it('should mark terminationDate control as touched on value change', () => {
      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBe(false);

      control?.setValue(new Date(2025, 6, 15));

      expect(control?.touched).toBe(true);
    });

    it('should not re-mark if already touched', () => {
      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      control?.setValue(new Date(2025, 6, 15));

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should trigger termination date period validation on date change', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 6, 15));

      expect(component.terminationDatePeriodError).toBe('Period is required');
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => createComponent(null));

    it('should return true when no date values are set', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDatePeriod is set but effectiveDate is not', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDatePeriod is set but terminationDate is not', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when there are validation errors (period required)', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      // effectiveDatePeriod is null, so validation error exists

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when form is valid and changed with complete date pair', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when termination date pair is complete', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(false);
    });

  });

  describe('isApplyDisabled with pre-loaded data', () => {
    it('should return true when form has not changed (loaded from data and not modified)', () => {
      const filter: CommTypeFilter = {
        effectiveDate: new Date(2025, 0, 1),
        effectiveDatePeriod: 'AFTER',
      };
      createComponent(filter);

      // formChanged stays false because patchValue happens before subscriptions are set up.
      // The validation calls at end of ngOnInit don't set formChanged.
      // So formChanged is false => isApplyDisabled should return true (last line: !this.formChanged)
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('hasValidationErrors', () => {
    beforeEach(() => createComponent(null));

    it('should return false when no validation errors exist', () => {
      expect(component.hasValidationErrors).toBe(false);
    });

    it('should return true when effectiveDatePeriod has errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return true when terminationDatePeriod has errors', () => {
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return true when both period fields have errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      expect(component.hasValidationErrors).toBe(true);
    });
  });

  describe('onApply', () => {
    beforeEach(() => createComponent(null));

    it('should not close dialog when isApplyDisabled is true', () => {
      component.onApply();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should close dialog with filter data when form is valid', () => {
      const effDate = new Date(2025, 0, 1);
      const termDate = new Date(2025, 11, 31);

      component.filterForm.get('searchKeyword')?.setValue('test keyword');
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      component.onApply();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        searchKeyword: 'test keyword',
        effectiveDate: effDate,
        terminationDate: termDate,
        effectiveDatePeriod: 'AFTER',
        terminationDatePeriod: 'BEFORE',
      });
    });

    it('should close dialog with undefined dates when dates are not set', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 6, 1));
      component.filterForm.get('terminationDatePeriod')?.setValue('AFTER');

      component.onApply();

      const result = dialogRefSpy.close.calls.mostRecent().args[0] as CommTypeFilter;
      expect(result.effectiveDate).toBeUndefined();
      expect(result.terminationDate).toEqual(new Date(2025, 6, 1));
    });

    it('should handle moment-like objects with toDate method', () => {
      const mockMoment = { toDate: () => new Date(2025, 2, 15) };
      component.filterForm.get('effectiveDate')?.setValue(mockMoment);
      component.filterForm.get('effectiveDate')?.setErrors(null);
      component.filterForm.get('effectiveDatePeriod')?.setValue('BEFORE');

      component.onApply();

      const result = dialogRefSpy.close.calls.mostRecent().args[0] as CommTypeFilter;
      expect(result.effectiveDate).toEqual(new Date(2025, 2, 15));
    });

    it('should return undefined for non-date, non-moment values', () => {
      component.filterForm.get('effectiveDate')?.setValue('not a date');
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      // Need to clear any validation errors the string may cause
      component.filterForm.get('effectiveDate')?.setErrors(null);

      component.onApply();

      const result = dialogRefSpy.close.calls.mostRecent().args[0] as CommTypeFilter;
      expect(result.effectiveDate).toBeUndefined();
    });
  });

  describe('onClear', () => {
    beforeEach(() => createComponent(null));

    it('should reset all form fields to default values', () => {
      component.filterForm.get('searchKeyword')?.setValue('test');
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      component.onClear();

      expect(component.filterForm.get('searchKeyword')?.value).toBe('');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should clear error messages', () => {
      component.effectiveDatePeriodError = 'Period is required';
      component.terminationDatePeriodError = 'Period is required';

      component.onClear();

      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear errors on period controls', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });

  describe('closeDialog', () => {
    beforeEach(() => createComponent(null));

    it('should close dialog without passing data', () => {
      component.closeDialog();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => createComponent(null));

    it('should mark effectiveDate as touched and dirty when input has value', () => {
      const event = { target: { value: '01-JAN-2025' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBe(true);
      expect(control?.dirty).toBe(true);
    });

    it('should set invalidDate error when input has value but control value is null', () => {
      const event = { target: { value: 'invalid' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBe(true);
    });

    it('should not set invalidDate error when control already has a parsed value', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      const event = { target: { value: '01-JAN-2025' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDate')).toBe(false);
    });

    it('should not mark as touched when input value is empty', () => {
      const control = component.filterForm.get('effectiveDate');
      const event = { target: { value: '' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(control?.touched).toBe(false);
    });

    it('should not mark as touched when input value is whitespace only', () => {
      const control = component.filterForm.get('effectiveDate');
      const event = { target: { value: '   ' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(control?.touched).toBe(false);
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => createComponent(null));

    it('should restore raw input value when control value is null and input was cleared', fakeAsync(() => {
      // Simulate typing then the datepicker clearing the input
      const inputEvent = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onEffectiveDateInput(inputEvent);

      const mockInput = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('invalid-date');
    }));

    it('should not restore value when control has a valid value', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      const inputEvent = { target: { value: '01-JAN-2025' } } as unknown as Event;
      component.onEffectiveDateInput(inputEvent);

      const mockInput = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(mockInput);
      tick(0);

      // Control has a value, so input should not be restored
      expect(mockInput.value).toBe('');
    }));

    it('should not restore value when raw input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('');
    }));

    it('should not restore value when input still has content', fakeAsync(() => {
      const inputEvent = { target: { value: 'some-date' } } as unknown as Event;
      component.onEffectiveDateInput(inputEvent);

      const mockInput = { value: 'some-date' } as HTMLInputElement;
      component.onEffectiveDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('some-date');
    }));
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => createComponent(null));

    it('should mark terminationDate as touched and dirty when input has value', () => {
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBe(true);
      expect(control?.dirty).toBe(true);
    });

    it('should set invalidDate error when input has value but control value is null', () => {
      const event = { target: { value: 'bad-date' } } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBe(true);
    });

    it('should not set invalidDate error when control already has a parsed value', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDate')).toBe(false);
    });

    it('should not mark as touched when input value is empty', () => {
      const control = component.filterForm.get('terminationDate');
      const event = { target: { value: '' } } as unknown as Event;

      component.onTerminationDateInput(event);

      expect(control?.touched).toBe(false);
    });
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => createComponent(null));

    it('should restore raw input value when control value is null and input was cleared', fakeAsync(() => {
      const inputEvent = { target: { value: 'invalid-term-date' } } as unknown as Event;
      component.onTerminationDateInput(inputEvent);

      const mockInput = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('invalid-term-date');
    }));

    it('should not restore value when control has a valid value', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      const inputEvent = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(inputEvent);

      const mockInput = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('');
    }));

    it('should not restore value when raw input is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('');
    }));

    it('should not restore value when input still has content', fakeAsync(() => {
      const inputEvent = { target: { value: 'some-term-date' } } as unknown as Event;
      component.onTerminationDateInput(inputEvent);

      const mockInput = { value: 'some-term-date' } as HTMLInputElement;
      component.onTerminationDateBlur(mockInput);
      tick(0);

      expect(mockInput.value).toBe('some-term-date');
    }));
  });

  describe('formChanged tracking', () => {
    beforeEach(() => createComponent(null));

    it('should track formChanged when effectiveDatePeriod changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');

      // formChanged is private but affects isApplyDisabled
      // With a valid complete date pair and formChanged = true, isApplyDisabled should be false
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should track formChanged when terminationDatePeriod changes', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should track formChanged when effectiveDate changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should track formChanged when terminationDate changes', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('isApplyDisabled edge cases', () => {
    beforeEach(() => createComponent(null));

    it('should return true when both date format errors exist on both controls', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDatePeriod is AFTER but no effectiveDate and no other complete date', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDatePeriod is BEFORE but no terminationDate and no other complete date', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should allow apply when both date pairs are complete', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date(2025, 0, 1));
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDate')?.setValue(new Date(2025, 11, 31));
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');

      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('onApply with only searchKeyword', () => {
    beforeEach(() => createComponent(null));

    it('should not apply when only searchKeyword is set (no dates)', () => {
      component.filterForm.get('searchKeyword')?.setValue('test');

      component.onApply();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
