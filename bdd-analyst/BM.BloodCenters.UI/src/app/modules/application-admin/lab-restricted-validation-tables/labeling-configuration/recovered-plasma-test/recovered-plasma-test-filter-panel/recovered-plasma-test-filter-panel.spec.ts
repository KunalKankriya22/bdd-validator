import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { RecoveredPlasmaTestFilterPanel } from './recovered-plasma-test-filter-panel';
import { RecoveredPlasmaTestFilterValue } from '../models/recovered-plasma-test.model';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('RecoveredPlasmaTestFilterPanel', () => {
  let component: RecoveredPlasmaTestFilterPanel;
  let fixture: ComponentFixture<RecoveredPlasmaTestFilterPanel>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    mockHeaderService = createMockHeaderService();
    await TestBed.configureTestingModule({
      imports: [
        RecoveredPlasmaTestFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecoveredPlasmaTestFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should create form with default null values when no currentFilters', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      component.currentFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: '2024-06-15',
        terminationDatePeriod: 'before',
        terminationDate: '2025-01-01'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('after');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(jasmine.any(Date));
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('before');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(jasmine.any(Date));
    });

    it('should populate form with partial currentFilters (all null)', () => {
      component.currentFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form with only effective date filters', () => {
      component.currentFilters = {
        effectiveDatePeriod: 'before',
        effectiveDate: '2024-03-01',
        terminationDatePeriod: null,
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('before');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(jasmine.any(Date));
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should populate form with only termination date filters', () => {
      component.currentFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: '2025-06-30'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('after');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(jasmine.any(Date));
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject and stop subscriptions', () => {
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('setupValidation - effectiveDatePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set required error on effectiveDatePeriod when effectiveDate is set but period is not', () => {
      component.filterForm.patchValue({ effectiveDate: new Date('2024-01-15') });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    });

    it('should clear error when both effectiveDate and effectiveDatePeriod are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-15'),
        effectiveDatePeriod: 'after'
      });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should not set error when effectiveDate is null', () => {
      component.filterForm.patchValue({ effectiveDate: null });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should validate when effectiveDatePeriod changes', () => {
      component.filterForm.patchValue({ effectiveDate: new Date('2024-01-15') });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();

      component.filterForm.patchValue({ effectiveDatePeriod: 'before' });
      expect(periodControl?.errors).toBeNull();
    });

    it('should mark effectiveDatePeriod as touched when date is set but period is missing', () => {
      component.filterForm.patchValue({ effectiveDate: new Date('2024-01-15') });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.touched).toBeTrue();
    });
  });

  describe('setupValidation - terminationDatePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set required error on terminationDatePeriod when terminationDate is set but period is not', () => {
      component.filterForm.patchValue({ terminationDate: new Date('2024-12-31') });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
    });

    it('should clear error when both terminationDate and terminationDatePeriod are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'before'
      });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should not set error when terminationDate is null', () => {
      component.filterForm.patchValue({ terminationDate: null });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should validate when terminationDatePeriod changes', () => {
      component.filterForm.patchValue({ terminationDate: new Date('2024-12-31') });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();

      component.filterForm.patchValue({ terminationDatePeriod: 'after' });
      expect(periodControl?.errors).toBeNull();
    });

    it('should mark terminationDatePeriod as touched when date is set but period is missing', () => {
      component.filterForm.patchValue({ terminationDate: new Date('2024-12-31') });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.touched).toBeTrue();
    });
  });

  describe('onDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear errors when input value is empty', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setErrors({ invalidDate: true });

      const event = { target: { value: '' } } as unknown as Event;
      component.onDateInput(event, 'effectiveDate');

      expect(control.errors).toBeNull();
    });

    it('should clear errors when input value is whitespace only', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setErrors({ invalidDate: true });

      const event = { target: { value: '   ' } } as unknown as Event;
      component.onDateInput(event, 'effectiveDate');

      expect(control.errors).toBeNull();
    });

    it('should set invalidDate error when input has value but control value is null', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(null, { emitEvent: false });

      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onDateInput(event, 'effectiveDate');

      expect(control.hasError('invalidDate')).toBeTrue();
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });

    it('should mark control as touched and dirty when input has value and control has value', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(new Date('2024-01-15'), { emitEvent: false });

      const event = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onDateInput(event, 'effectiveDate');

      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });

    it('should return early when control name does not exist', () => {
      const event = { target: { value: 'test' } } as unknown as Event;

      // Should not throw
      expect(() => component.onDateInput(event, 'nonExistentControl')).not.toThrow();
    });

    it('should work with terminationDate control', () => {
      const control = component.filterForm.get('terminationDate')!;
      control.setValue(null, { emitEvent: false });

      const event = { target: { value: 'bad-date' } } as unknown as Event;
      component.onDateInput(event, 'terminationDate');

      expect(control.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility.getDateErrorMessage', () => {
      fixture.detectChanges();
      const spy = spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('Test Error');

      const result = component.getEffectiveDateError();

      expect(spy).toHaveBeenCalledWith(
        component.filterForm.get('effectiveDate'),
        null,
        'Effective Date'
      );
      expect(result).toBe('Test Error');
    });

    it('should return empty string when no errors', () => {
      fixture.detectChanges();
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('');

      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility.getDateErrorMessage', () => {
      fixture.detectChanges();
      const spy = spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('Term Error');

      const result = component.getTerminationDateError();

      expect(spy).toHaveBeenCalledWith(
        component.filterForm.get('terminationDate'),
        null,
        'Termination Date'
      );
      expect(result).toBe('Term Error');
    });
  });

  describe('getEffectiveDatePeriodError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return "Period is required" when control has required error and is touched', () => {
      const control = component.filterForm.get('effectiveDatePeriod')!;
      control.setErrors({ required: true });
      control.markAsTouched();

      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when control has no errors', () => {
      expect(component.getEffectiveDatePeriodError()).toBe('');
    });

    it('should return empty string when control has required error but is not touched', () => {
      const control = component.filterForm.get('effectiveDatePeriod')!;
      control.setErrors({ required: true });

      expect(component.getEffectiveDatePeriodError()).toBe('');
    });
  });

  describe('getTerminationDatePeriodError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return "Period is required" when control has required error and is touched', () => {
      const control = component.filterForm.get('terminationDatePeriod')!;
      control.setErrors({ required: true });
      control.markAsTouched();

      expect(component.getTerminationDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when control has no errors', () => {
      expect(component.getTerminationDatePeriodError()).toBe('');
    });

    it('should return empty string when control has required error but is not touched', () => {
      const control = component.filterForm.get('terminationDatePeriod')!;
      control.setErrors({ required: true });

      expect(component.getTerminationDatePeriodError()).toBe('');
    });
  });

  describe('onApply', () => {
    it('should emit filters with effective date', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDatePeriod).toBe('after');
      expect(emittedValue.effectiveDate).toBeDefined();
    });

    it('should emit filters with termination date', () => {
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('before');
    });

    it('should not emit when apply is disabled (no values selected)', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when there are validation errors', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15')
      });
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDate: true });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit with all filter values set', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      const testDate1 = new Date('2024-03-01');
      const testDate2 = new Date('2024-12-31');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: testDate1,
        terminationDatePeriod: 'before',
        terminationDate: testDate2
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as RecoveredPlasmaTestFilterValue;
      expect(emittedValue.effectiveDatePeriod).toBe('after');
      expect(emittedValue.effectiveDate).toEqual(testDate1);
      expect(emittedValue.terminationDatePeriod).toBe('before');
      expect(emittedValue.terminationDate).toEqual(testDate2);
    });

    it('should emit null for empty/falsy form fields', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: '',
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as RecoveredPlasmaTestFilterValue;
      expect(emittedValue.terminationDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });
  });

  describe('onClear', () => {
    it('should reset all form values to null', () => {
      fixture.detectChanges();

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: 'before',
        terminationDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
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

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when no values are selected', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when both effectiveDatePeriod and effectiveDate are set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when both terminationDatePeriod and terminationDate are set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when only effectiveDatePeriod is set without effectiveDate', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only effectiveDate is set without effectiveDatePeriod', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      // Also triggers validation error on effectiveDatePeriod (required because date is set)
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only terminationDatePeriod is set without terminationDate', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when only terminationDate is set without terminationDatePeriod', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2024-12-31')
      });

      // Also triggers validation error on terminationDatePeriod (required because date is set)
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when there are validation errors even with values', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15')
      });
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when all four fields are set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('hasValidationErrors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no errors exist', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should return true when effectiveDatePeriod is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')!.setErrors({ required: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDatePeriod is invalid', () => {
      component.filterForm.get('terminationDatePeriod')!.setErrors({ required: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDateFormat: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDate: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ matDatepickerParse: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ invalidDateFormat: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ invalidDate: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')!.setErrors({ matDatepickerParse: true });

      expect(component.hasValidationErrors).toBeTrue();
    });
  });

  describe('periodOptions', () => {
    it('should have after and before options', () => {
      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });
  });
});
