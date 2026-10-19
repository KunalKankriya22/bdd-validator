import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { TestMessageMappingFilterPanel } from './test-message-mapping-filter-panel';
import { TestMessageMappingFilterValue } from '../models/test-message-mapping.model';
import { HeaderService } from '@shared/services/header.service';
import { LabelingFilterDataService } from '../../services/labeling-filter-data.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('TestMessageMappingFilterPanel', () => {
  let component: TestMessageMappingFilterPanel;
  let fixture: ComponentFixture<TestMessageMappingFilterPanel>;
  let filterDataService: LabelingFilterDataService;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
imports: [
        TestMessageMappingFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: mockHeaderService },
        LabelingFilterDataService
      ]
    });


    });



  beforeEach(() => {
    fixture = TestBed.createComponent(TestMessageMappingFilterPanel);
    component = fixture.componentInstance;
    filterDataService = TestBed.inject(LabelingFilterDataService);


    });

  describe('Component creation', () => {
    it('should create the component', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize filterForm on ngOnInit', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('resultCode')).toBeTruthy();
      expect(component.filterForm.get('antibodyFlag')).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
    });
  });

  describe('ngOnInit with currentFilters', () => {
    it('should initialize form with null values when no currentFilters', () => {
      filterDataService.setData('test-message-mapping', []);
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('resultCode')?.value).toBeNull();
      expect(component.filterForm.get('antibodyFlag')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize form with currentFilters values', () => {
      filterDataService.setData('test-message-mapping', []);
      component.currentFilters = {
        resultCode: 'RC1',
        antibodyFlag: 'Y',
        effectiveDatePeriod: 'after',
        effectiveDate: '2024-01-15',
        terminationDatePeriod: 'before',
        terminationDate: '2024-12-31'
      };
      fixture.detectChanges();

      expect(component.filterForm.get('resultCode')?.value).toBe('RC1');
      expect(component.filterForm.get('antibodyFlag')?.value).toBe('Y');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('after');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(jasmine.any(Date));
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('before');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(jasmine.any(Date));
    });

    it('should not create Date when effectiveDate filter is null', () => {
      filterDataService.setData('test-message-mapping', []);
      component.currentFilters = {
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('buildResultCodeOptionsFromTableData', () => {
    it('should build result code options from filter data service', () => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'RC1' },
        { resultCode: 'RC2' },
        { resultCode: 'RC3' }
      ]);
      fixture.detectChanges();

      expect(component.allResultCodeOptions.length).toBe(3);
      expect(component.allResultCodeOptions).toEqual([
        { value: 'RC1', display: 'RC1' },
        { value: 'RC2', display: 'RC2' },
        { value: 'RC3', display: 'RC3' }
      ]);
      expect(component.resultCodeOptions).toEqual(component.allResultCodeOptions);
    });

    it('should handle empty data', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      expect(component.allResultCodeOptions.length).toBe(0);
      expect(component.resultCodeOptions.length).toBe(0);
    });

    it('should deduplicate result codes', () => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'RC1' },
        { resultCode: 'RC1' },
        { resultCode: 'RC2' }
      ]);
      fixture.detectChanges();

      expect(component.allResultCodeOptions.length).toBe(2);
    });

    it('should filter out undefined or empty result codes', () => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'RC1' },
        { resultCode: undefined },
        { resultCode: '' },
        { resultCode: 'RC2' }
      ]);
      fixture.detectChanges();

      expect(component.allResultCodeOptions.length).toBe(2);
      expect(component.allResultCodeOptions[0].value).toBe('RC1');
      expect(component.allResultCodeOptions[1].value).toBe('RC2');
    });

    it('should sort result codes alphabetically', () => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'ZZZ' },
        { resultCode: 'AAA' },
        { resultCode: 'MMM' }
      ]);
      fixture.detectChanges();

      expect(component.allResultCodeOptions[0].value).toBe('AAA');
      expect(component.allResultCodeOptions[1].value).toBe('MMM');
      expect(component.allResultCodeOptions[2].value).toBe('ZZZ');
    });
  });

  describe('setupValidation', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should call validateEffectiveDatePeriod when effectiveDate changes', () => {
      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');

      // Set date without period - should set error
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-01-15'));

      expect(effectiveDatePeriodControl?.hasError('required')).toBeTrue();
    });

    it('should call validateEffectiveDatePeriod when effectiveDatePeriod changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-01-15'));
      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');

      // Set period - should clear error
      effectiveDatePeriodControl?.setValue('after');

      expect(effectiveDatePeriodControl?.hasError('required')).toBeFalse();
    });

    it('should call validateTerminationDatePeriod when terminationDate changes', () => {
      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');

      // Set date without period - should set error
      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));

      expect(terminationDatePeriodControl?.hasError('required')).toBeTrue();
    });

    it('should call validateTerminationDatePeriod when terminationDatePeriod changes', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));
      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');

      // Set period - should clear error
      terminationDatePeriodControl?.setValue('before');

      expect(terminationDatePeriodControl?.hasError('required')).toBeFalse();
    });
  });

  describe('validateEffectiveDatePeriod', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should set required error on period control when date is set but period is not', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-06-01'));

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
      expect(periodControl?.touched).toBeTrue();
    });

    it('should clear errors when both date and period are set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-06-01'),
        effectiveDatePeriod: 'after'
      });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear errors when date is null', () => {
      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });
  });

  describe('validateTerminationDatePeriod', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should set required error on period control when date is set but period is not', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date('2024-12-31'));

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.hasError('required')).toBeTrue();
      expect(periodControl?.touched).toBeTrue();
    });

    it('should clear errors when both date and period are set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: 'before'
      });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear errors when date is null', () => {
      component.filterForm.patchValue({
        terminationDate: null,
        terminationDatePeriod: null
      });

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });
  });

  describe('onDateInput', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should clear errors when input value is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      component.onDateInput(event, 'effectiveDate');

      expect(control?.errors).toBeNull();
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should clear errors when input value is whitespace only', () => {
      const event = { target: { value: '   ' } } as unknown as Event;
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });

      component.onDateInput(event, 'effectiveDate');

      expect(control?.errors).toBeNull();
    });

    it('should set invalidDate error when input has text but control value is null', () => {
      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      const control = component.filterForm.get('effectiveDate');
      // Simulate that the datepicker couldn't parse it: control.value stays null
      control?.setValue(null, { emitEvent: false });

      component.onDateInput(event, 'effectiveDate');

      expect(control?.hasError('invalidDate')).toBeTrue();
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should not set invalidDate error when input has text and control has a parsed value', () => {
      const event = { target: { value: '15-JAN-2024' } } as unknown as Event;
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(new Date('2024-01-15'), { emitEvent: false });

      component.onDateInput(event, 'effectiveDate');

      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should return early if control does not exist', () => {
      const event = { target: { value: 'test' } } as unknown as Event;
      // Should not throw
      expect(() => component.onDateInput(event, 'nonExistentControl')).not.toThrow();
    });

    it('should work for terminationDate control as well', () => {
      const event = { target: { value: '' } } as unknown as Event;
      const control = component.filterForm.get('terminationDate');
      control?.setErrors({ invalidDate: true });

      component.onDateInput(event, 'terminationDate');

      expect(control?.errors).toBeNull();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should delegate to DateFieldValidationUtility.getDateErrorMessage', () => {
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('Test Error');

      const result = component.getEffectiveDateError();

      expect(DateFieldValidationUtility.getDateErrorMessage).toHaveBeenCalledWith(
        component.filterForm.get('effectiveDate'), null, 'Effective Date'
      );
      expect(result).toBe('Test Error');
    });

    it('should return empty string when no errors', () => {
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('');

      const result = component.getEffectiveDateError();

      expect(result).toBe('');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should delegate to DateFieldValidationUtility.getDateErrorMessage', () => {
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('Term Error');

      const result = component.getTerminationDateError();

      expect(DateFieldValidationUtility.getDateErrorMessage).toHaveBeenCalledWith(
        component.filterForm.get('terminationDate'), null, 'Termination Date'
      );
      expect(result).toBe('Term Error');
    });
  });

  describe('getEffectiveDatePeriodError', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should return "Period is required" when control has required error and is touched', () => {
      const control = component.filterForm.get('effectiveDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when control has required error but is not touched', () => {
      const control = component.filterForm.get('effectiveDatePeriod');
      control?.setErrors({ required: true });

      expect(component.getEffectiveDatePeriodError()).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      const control = component.filterForm.get('effectiveDatePeriod');
      control?.setErrors(null);
      control?.markAsTouched();

      expect(component.getEffectiveDatePeriodError()).toBe('');
    });
  });

  describe('getTerminationDatePeriodError', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should return "Period is required" when control has required error and is touched', () => {
      const control = component.filterForm.get('terminationDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getTerminationDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when control has required error but is not touched', () => {
      const control = component.filterForm.get('terminationDatePeriod');
      control?.setErrors({ required: true });

      expect(component.getTerminationDatePeriodError()).toBe('');
    });

    it('should return empty string when control has no errors', () => {
      const control = component.filterForm.get('terminationDatePeriod');
      control?.setErrors(null);
      control?.markAsTouched();

      expect(component.getTerminationDatePeriodError()).toBe('');
    });
  });

  describe('onApply', () => {

    it('should emit filters with antibody flag', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ antibodyFlag: 'Y' })
      );
    });

    it('should emit filters with effective date and period', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
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

    it('should emit filters with resultCode', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        resultCode: 'RC1',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ resultCode: 'RC1' })
      );
    });

    it('should emit filters with termination date and period', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDatePeriod).toBe('before');
      expect(emittedValue.terminationDate).toBeDefined();
    });

    it('should not emit when isApplyDisabled is true (no values selected)', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      // All values are null - apply should be disabled
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should emit null for empty form values', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: 'N',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.resultCode).toBeNull();
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
      expect(emittedValue.terminationDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });
  });

  describe('onClear', () => {
    it('should reset all form values to null', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      component.filterForm.patchValue({
        resultCode: 'RC1',
        antibodyFlag: 'Y',
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('resultCode')?.value).toBeNull();
      expect(component.filterForm.get('antibodyFlag')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should return true when no values are selected', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when resultCode is selected', () => {
      component.filterForm.patchValue({
        resultCode: 'RC1',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when antibodyFlag is selected', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: 'Y',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when both effectiveDatePeriod and effectiveDate are set', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when both terminationDatePeriod and terminationDate are set', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when only effectiveDatePeriod is set without effectiveDate', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when only effectiveDate is set without effectiveDatePeriod', () => {
      component.filterForm.patchValue({
        resultCode: null,
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      // Even though effectiveDate has value, the pair is incomplete
      // so hasAnyValue won't count it; BUT there may be validation errors too
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when there are validation errors even with valid values', () => {
      component.filterForm.patchValue({
        resultCode: 'RC1',
        antibodyFlag: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      // Manually set a validation error
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('hasValidationErrors', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();
    });

    it('should return false when there are no validation errors', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when effectiveDatePeriod is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });

      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDatePeriod is invalid', () => {
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      expect(component.hasValidationErrors).toBeTrue();
    });
  });

  describe('setupResultCodeSearch', () => {
    beforeEach(() => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'ABC' },
        { resultCode: 'ABD' },
        { resultCode: 'XYZ' }
      ]);
      fixture.detectChanges();
    });

    it('should filter result codes based on search term', fakeAsync(() => {
      component.resultCodeSearchControl.setValue('AB');
      tick(300);

      expect(component.resultCodeOptions.length).toBe(2);
      expect(component.resultCodeOptions[0].value).toBe('ABC');
      expect(component.resultCodeOptions[1].value).toBe('ABD');
    }));

    it('should reset to all options when search is cleared', fakeAsync(() => {
      // First filter
      component.resultCodeSearchControl.setValue('AB');
      tick(300);
      expect(component.resultCodeOptions.length).toBe(2);

      // Then clear
      component.resultCodeSearchControl.setValue('');
      tick(300);
      expect(component.resultCodeOptions.length).toBe(3);
    }));

    it('should reset to all options when search is null', fakeAsync(() => {
      component.resultCodeSearchControl.setValue(null);
      tick(300);
      expect(component.resultCodeOptions.length).toBe(3);
    }));

    it('should be case insensitive', fakeAsync(() => {
      component.resultCodeSearchControl.setValue('abc');
      tick(300);

      expect(component.resultCodeOptions.length).toBe(1);
      expect(component.resultCodeOptions[0].value).toBe('ABC');
    }));

    it('should return no results when search does not match', fakeAsync(() => {
      component.resultCodeSearchControl.setValue('QQQ');
      tick(300);

      expect(component.resultCodeOptions.length).toBe(0);
    }));

    it('should debounce search input', fakeAsync(() => {
      component.resultCodeSearchControl.setValue('A');
      tick(100); // Less than 300ms debounce
      // Should still show all options since debounce hasn't fired
      expect(component.resultCodeOptions.length).toBe(3);

      tick(200); // Now total 300ms
      expect(component.resultCodeOptions.length).toBe(2); // ABC, ABD
    }));
  });

  describe('Antibody Flag Options', () => {
    it('should have Y and N antibody flag options', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      expect(component.antibodyFlagOptions).toBeDefined();
      expect(component.antibodyFlagOptions.length).toBe(2);
    });

    it('should have correct values and display labels', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      expect(component.antibodyFlagOptions[0]).toEqual({ value: 'Y', display: 'Yes' });
      expect(component.antibodyFlagOptions[1]).toEqual({ value: 'N', display: 'No' });
    });
  });

  describe('Period Options', () => {
    it('should have after and before period options', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      expect(component.periodOptions).toBeDefined();
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions[0]).toEqual({ value: 'after', display: 'After' });
      expect(component.periodOptions[1]).toEqual({ value: 'before', display: 'Before' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      filterDataService.setData('test-message-mapping', []);
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from form value changes after destroy', fakeAsync(() => {
      filterDataService.setData('test-message-mapping', [
        { resultCode: 'ABC' },
        { resultCode: 'XYZ' }
      ]);
      fixture.detectChanges();

      // Destroy the component
      component.ngOnDestroy();

      // After destroy, result code search should not update
      const currentOptions = [...component.resultCodeOptions];
      component.resultCodeSearchControl.setValue('ABC');
      tick(300);

      // Options should remain unchanged after destroy
      expect(component.resultCodeOptions).toEqual(currentOptions);
    }));
  });
});
