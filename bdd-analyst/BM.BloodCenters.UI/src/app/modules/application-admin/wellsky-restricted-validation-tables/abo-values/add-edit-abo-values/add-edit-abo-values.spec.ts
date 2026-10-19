import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AddEditAboValues } from './add-edit-abo-values';
import { AboValuesService } from '../services/abo-values.service';
import { AboValuesModel, DropdownOption } from '../models/abo-values.model';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditAboValues', () => {
  let mockSnackBarRef: any;
  let snackBarSpy: any;
  let aboValuesServiceSpy: any;
  let component: AddEditAboValues;
  let fixture: ComponentFixture<AddEditAboValues>;
  let aboValuesService: jasmine.SpyObj<AboValuesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockDropdownResponse = {
    success: true,
    data: [
      {
        testedABO: [
          { key: 'A Positive', value: 'A+ - Type A Positive', description: 'Type A Positive' },
          { key: 'B Positive', value: 'B+ - Type B Positive', description: 'Type B Positive' }
        ],
        intendedUse: [
          { key: 'Transfusion', value: 'T' },
          { key: 'Research', value: 'R' }
        ],
        unitScheme: [
          { key: 'Component', value: 'C' },
          { key: 'Whole Blood', value: 'W' }
        ],
        transfusionStatus: [
          { key: 'Eligible', value: 'E' },
          { key: 'Deferred', value: 'D' }
        ],
        aboOnly: [
          { key: 'Yes', value: 'Y' },
          { key: 'No', value: 'N' }
        ]
      }
    ]
  };

  beforeEach(() => {

    aboValuesServiceSpy = jasmine.createSpyObj('AboValuesService', [
      'getAboValuesDropdowns',
      'addAboValues',
      'updateAboValues'
    ]);
    snackBarSpy = createMockMatSnackBar();

    // Mock MatSnackBarRef return value
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['afterDismissed', 'onAction']);
    mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    snackBarSpy.open.and.returnValue(mockSnackBarRef);



      TestBed.configureTestingModule({
      imports: [
        AddEditAboValues,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AboValuesService, useValue: aboValuesServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(AddEditAboValues, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    });


    


      aboValuesServiceSpy.getAboValuesDropdowns.calls.reset();


      aboValuesServiceSpy.addAboValues.calls.reset();


      aboValuesServiceSpy.updateAboValues.calls.reset();


      snackBarSpy.open.calls.reset();


      mockSnackBarRef.afterDismissed.calls.reset();


      mockSnackBarRef.onAction.calls.reset();


      mockSnackBarRef.afterDismissed.and.returnValue(of(undefined));


      mockSnackBarRef.onAction.and.returnValue(of(undefined));


      snackBarSpy.open.and.returnValue(mockSnackBarRef);


    fixture = TestBed.createComponent(AddEditAboValues);
    component = fixture.componentInstance;

    aboValuesService = TestBed.inject(AboValuesService) as jasmine.SpyObj<AboValuesService>;
    snackBar = fixture.debugElement.injector.get(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    aboValuesService.getAboValuesDropdowns.and.returnValue(of(mockDropdownResponse));


    });


  describe('ngOnInit', () => {






    it('should populate dropdown options from API response', () => {
      fixture.detectChanges();
      expect(component.testedAboOptions().length).toBe(2);
      expect(component.intendedUseOptions().length).toBe(2);
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions().length).toBe(2);
      expect(component.aboOnlyOptions.length).toBe(2);
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should filter intended use options based on search', fakeAsync(() => {
      component.intendedUseSearchControl.setValue('T');
      tick();

      const filtered = component.filteredIntendedUseOptions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].key).toBe('T');
    }));

    it('should filter transfusion status options based on search', fakeAsync(() => {
      component.transfusionStatusSearchControl.setValue('E');
      tick();

      const filtered = component.filteredTransfusionStatusOptions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].key).toBe('E');
    }));






  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(); // Allow async operations to complete
    }));

    it('should create form with all required fields', () => {
      expect(component.form.get('testedAbo')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('identifierDescription')).toBeTruthy();
      expect(component.form.get('intendedUse')).toBeTruthy();
      expect(component.form.get('unitScheme')).toBeTruthy();
      expect(component.form.get('aboLabel')).toBeTruthy();
      expect(component.form.get('aboDescription')).toBeTruthy();
      expect(component.form.get('bloodTypeCode')).toBeTruthy();
      expect(component.form.get('transfusionStatus')).toBeTruthy();
      expect(component.form.get('aboOnly')).toBeTruthy();
      expect(component.form.get('alternateAbo')).toBeTruthy();
      expect(component.form.get('usageCode')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should mark required fields as invalid when empty', () => {
      const form = component.form;
      expect(form.get('testedAbo')?.valid).toBeFalse();
      expect(form.get('intendedUse')?.valid).toBeFalse();
      expect(form.get('unitScheme')?.valid).toBeFalse();
      expect(form.get('aboLabel')?.valid).toBeFalse();
      expect(form.get('aboDescription')?.valid).toBeFalse();
      // bloodTypeCode is optional
      expect(form.get('bloodTypeCode')?.valid).toBeTrue();
      expect(form.get('transfusionStatus')?.valid).toBeFalse();
      expect(form.get('aboOnly')?.valid).toBeFalse();
      // alternateAbo is conditionally required only when aboOnly is 'N'
      expect(form.get('alternateAbo')?.valid).toBeTrue();
      expect(form.get('effectiveDate')?.valid).toBeFalse();
    });



    it('should require alternateAbo when aboOnly is N', () => {
      component.form.patchValue({
        aboOnly: 'N'
      });

      expect(component.form.get('alternateAbo')?.valid).toBeFalse();
      expect(component.form.get('alternateAbo')?.hasError('required')).toBeTrue();

      component.form.patchValue({
        alternateAbo: '01'
      });

      expect(component.form.get('alternateAbo')?.valid).toBeTrue();
    });

    it('should not require alternateAbo when aboOnly is Y', () => {
      component.form.patchValue({
        aboOnly: 'Y'
      });

      expect(component.form.get('alternateAbo')?.valid).toBeTrue();
      expect(component.form.get('alternateAbo')?.hasError('required')).toBeFalse();
    });
  });

  describe('Auto-populate description in add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should auto-populate description when testedAbo changes', () => {
      component.form.get('testedAbo')?.setValue('A Positive');
      expect(component.form.get('description')?.value).toBe('Type A Positive');
    });

    it('should not auto-populate description in edit mode', () => {
      component.mode = 'edit';
      component.form.get('testedAbo')?.setValue('A+');
      expect(component.form.get('description')?.value).not.toBe('A+');
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick(); // Allow async dropdown loading to complete
    }));

    it('should show error message when form is invalid', fakeAsync(() => {
      // Ensure form is invalid by clearing all values
      component.form.reset();
      tick();

      // Verify form is invalid before calling onSave
      expect(component.isFormValid).toBeFalse();

      fixture.detectChanges();
      component.onSave();
      tick();
      flushMicrotasks();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));



    it('should show success message with tested ABO on successful add', fakeAsync(() => {
      const mockResponse = { success: true, message: 'ABO Value added successfully' };
      aboValuesService.addAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({
        testedAbo: '07',
        intendedUse: 'T',
        unitScheme: 'W',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'E',
        aboOnly: 'Y',
        alternateAbo: 'B+',
        effectiveDate: moment().add(10, 'days')
      });

      let emitted = false;
      component.saveSuccess.subscribe(() => {
        emitted = true;
      });

      fixture.detectChanges();
      component.onSave();
      tick();
      flushMicrotasks();

      expect(emitted).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'New rule for Tested ABO 07 added successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle 409 error (duplicate record)', fakeAsync(() => {
      const error409 = {
        status: 409,
        error: { message: 'Record already exists' }
      };
      aboValuesService.addAboValues.and.returnValue(throwError(() => error409));

      component.form.patchValue({
        testedAbo: 'A+',
        intendedUse: 'T',
        unitScheme: 'W',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'E',
        aboOnly: 'Y',
        alternateAbo: 'B+',
        effectiveDate: moment().add(10, 'days')
      });

      fixture.detectChanges();
      component.onSave();
      tick();
      flushMicrotasks();

      // Error handling is now done by HTTP interceptor
      // In unit tests, interceptor doesn't run since we mock services
      // Just verify component state is reset correctly
      expect(component.isSaving).toBeFalse();
    }));
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: 'B+',
        usageCode: 'U',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null,
        auditKey: 2031356
      };
      fixture.detectChanges();
      tick(); // Allow async dropdown loading and form population to complete
    }));





    it('should include auditKey in update payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'ABO Value updated successfully' };
      aboValuesService.updateAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({
        aboLabel: 'A Updated'
      });

      fixture.detectChanges();
      component.onSave();
      tick();

      const callArgs = aboValuesService.updateAboValues.calls.mostRecent().args[0];
      expect(callArgs.auditKey).toBe(2031356);
      expect(callArgs.originalTestedAbo).toBe('A Positive');
      expect(callArgs.originalIntendedUse).toBe('T');
      expect(callArgs.originalUnitScheme).toBe('C');
    }));

    it('should show success message with tested ABO on successful update', fakeAsync(() => {
      const mockResponse = { success: true, message: 'ABO Value updated successfully' };
      aboValuesService.updateAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({
        aboLabel: 'A Updated'
      });

      let emitted = false;
      component.saveSuccess.subscribe(() => {
        emitted = true;
      });

      fixture.detectChanges();
      component.onSave();
      tick();
      flushMicrotasks();

      expect(emitted).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Rule for Tested ABO A Positive updated successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle 404 error (record not found)', fakeAsync(() => {
      const error404 = {
        status: 404,
        error: { message: 'Record not found' }
      };
      aboValuesService.updateAboValues.and.returnValue(throwError(() => error404));

      fixture.detectChanges();
      component.onSave();
      tick();
      flushMicrotasks();

      // Error handling is now done by HTTP interceptor
      // In unit tests, interceptor doesn't run since we mock services
      // Just verify component state is reset correctly
      expect(component.isSaving).toBeFalse();
    }));
  });
  describe('getTestedAboDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return the value of the selected tested ABO option', () => {
      component.form.get('testedAbo')?.setValue('A Positive');
      const display = component.getTestedAboDisplay();
      expect(display).toBe('A+ - Type A Positive');
    });

    it('should return the value if option is not found', () => {
      component.form.get('testedAbo')?.setValue('Unknown');
      const display = component.getTestedAboDisplay();
      expect(display).toBe('Unknown');
    });


  });

  describe('getEffectiveDateDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format moment date as DD-MMM-YYYY', () => {
      component.form.get('effectiveDate')?.setValue(moment('2024-01-15'));
      const display = component.getEffectiveDateDisplay();
      expect(display).toBe('15-JAN-2024');
    });

    it('should format Date object as DD-MMM-YYYY', () => {
      component.form.get('effectiveDate')?.setValue(new Date('2026-06-15'));
      const display = component.getEffectiveDateDisplay();
      expect(display).toBe('15-JUN-2026');
    });


  });

  describe('getFieldError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return error message for required field', () => {
      const control = component.form.get('testedAbo');
      control?.markAsTouched();
      const error = component.getFieldError('testedAbo', 'Tested ABO');
      expect(error).toBe('Tested ABO is required');
    });




  });



  describe('Date Validation', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should show error for invalid effective date format', fakeAsync(() => {
      const effectiveDateInput = { value: 'invalid-date' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: effectiveDateInput } as any);
      tick();

      expect(component.getEffectiveDateError()).toBeTruthy();
    }));

    it('should show error for invalid termination date format', fakeAsync(() => {
      const terminationDateInput = { value: 'invalid-date' } as HTMLInputElement;
      component.onTerminationDateInput({ target: terminationDateInput } as any);
      tick();

      expect(component.getTerminationDateError()).toBeTruthy();
    }));

    it('should clear effective date error when valid date is entered', fakeAsync(() => {
      component.form.patchValue({
        effectiveDate: moment('2024-01-01')
      });
      tick();

      expect(component.getEffectiveDateError()).toBeFalsy();
    }));

    describe('terminationDateFilter', () => {




      it('should return false for dates before minDate', fakeAsync(() => {
        tick();
        const today = DateFieldValidationUtility.getMinDate();
        const yesterday = moment(today).subtract(1, 'day');
        expect(component.terminationDateFilter(yesterday)).toBe(false);
      }));

      it('should return true for dates on or after minDate when no effective date is set', fakeAsync(() => {
        component.form.get('effectiveDate')?.setValue(null);
        tick();

        const today = DateFieldValidationUtility.getMinDate();
        const tomorrow = moment(today).add(1, 'day');
        expect(component.terminationDateFilter(tomorrow)).toBe(true);
      }));

      it('should return false for dates before effective date', fakeAsync(() => {
        const effectiveDate = moment().add(5, 'days');
        component.form.get('effectiveDate')?.setValue(effectiveDate);
        tick();

        const dayBeforeEffective = moment(effectiveDate).subtract(1, 'day');
        expect(component.terminationDateFilter(dayBeforeEffective)).toBe(false);
      }));




    });

    describe('Cross-field Date Validation', () => {
      it('should detect when termination date is before effective date', fakeAsync(() => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        tick();

        // Form should have cross-field validation error
        expect(component.form.errors).toBeTruthy();
        expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
      }));

      it('should detect when effective date is after termination date', fakeAsync(() => {
        const terminationDate = moment().add(5, 'days');
        const effectiveDate = moment().add(10, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        tick();

        // Form should have cross-field validation error
        expect(component.form.errors).toBeTruthy();
        expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
      }));




    });
  });
  describe('hasFormChanges', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 2031356
      };
      fixture.detectChanges();
      tick();
    }));

    it('should return false when form has no changes', () => {
      expect(component.hasFormChanges).toBeFalse();
    });

    it('should return true when form has changes', fakeAsync(() => {
      component.form.patchValue({
        aboLabel: 'B'
      });
      tick();

      expect(component.hasFormChanges).toBeTrue();
    }));
  });

  describe('Edge Cases and Additional Coverage', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should handle termination date input change', fakeAsync(() => {
      const input = { value: '15-JAN-2024' } as HTMLInputElement;
      const event = { target: input } as any;

      component.onTerminationDateInput(event);
      tick(10);

      // Just verify the method was called without errors
      expect(component.form.get('terminationDate')).toBeTruthy();
    }));

    it('should clear effective date error when valid date entered', fakeAsync(() => {
      const effectiveDateInput = { value: moment('2024-01-15').format('DD-MMM-YYYY') } as HTMLInputElement;
      component.onEffectiveDateInput({ target: effectiveDateInput } as any);
      tick(10);

      const control = component.form.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should handle empty termination date input', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateInput({ target: input } as any);
      tick(10);

      const control = component.form.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should return empty error when no validation errors', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const error = component.getTerminationDateError();
      expect(error).toBe('');
    }));
  });
  describe('isAlternateAboRequired', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when aboOnly is N', () => {
      component.form.patchValue({ aboOnly: 'N' });
      expect(component.isAlternateAboRequired).toBeTrue();
    });

    it('should return false when aboOnly is Y', () => {
      component.form.patchValue({ aboOnly: 'Y' });
      expect(component.isAlternateAboRequired).toBeFalse();
    });

    it('should return false when aboOnly is empty', () => {
      component.form.patchValue({ aboOnly: '' });
      expect(component.isAlternateAboRequired).toBeFalse();
    });
  });

  describe('getAlternateAboError', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should return required error when aboOnly is N and alternateAbo is empty', () => {
      component.form.patchValue({ aboOnly: 'N', alternateAbo: '' });
      component.form.get('alternateAbo')?.markAsTouched();
      const error = component.getAlternateAboError();
      expect(error).toBe('Alternate ABO is required');
    });

    it('should return error when alternateAbo is same as testedAbo', fakeAsync(() => {
      component.form.patchValue({
        testedAbo: 'A+',
        aboOnly: 'N',
        alternateAbo: 'A+'
      });
      tick();
      component.form.get('alternateAbo')?.markAsTouched();

      const error = component.getAlternateAboError();
      expect(error).toBe('Alternate ABO must be different from Tested ABO');
    }));


  });

  describe('onTerminationDateFocus', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      fixture.detectChanges();
      tick();
    }));

    it('should set terminationDateManuallyTouched to true in edit mode', () => {
      component.onTerminationDateFocus();
      expect(component['terminationDateManuallyTouched']).toBeTrue();
    });

    it('should not affect add mode', fakeAsync(() => {
      component.mode = 'add';
      tick();
      component.onTerminationDateFocus();
      // Just verify no errors thrown
      expect(component.mode).toBe('add');
    }));
  });

  describe('ngOnChanges', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should populate form when data changes in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      const testData: AboValuesModel = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };

      component.data = testData;
      component.ngOnChanges({
        data: {
          currentValue: testData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(component.form.get('aboLabel')?.value).toBe('A');
    }));
  });

  describe('Dropdown Options Loading Error', () => {
    beforeEach(() => {
      aboValuesService.getAboValuesDropdowns.and.returnValue(throwError(() => new Error('API Error')));
    });

    it('should handle dropdown loading error gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoadingOptions).toBeFalse();
    }));
  });

  describe('Form Field Validations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should validate maxlength for aboLabel', () => {
      const control = component.form.get('aboLabel');
      control?.setValue('ABCDE'); // Max is 4
      control?.markAsTouched();

      const error = component.getFieldError('aboLabel', 'ABO Label');
      expect(error).toContain('cannot exceed 4 characters');
    });

    it('should validate maxlength for aboDescription', () => {
      const control = component.form.get('aboDescription');
      control?.setValue('A'.repeat(51)); // Max is 50
      control?.markAsTouched();

      const error = component.getFieldError('aboDescription', 'ABO Description');
      expect(error).toContain('cannot exceed 50 characters');
    });

    it('should validate maxlength for bloodTypeCode', () => {
      const control = component.form.get('bloodTypeCode');
      control?.setValue('ABC'); // Max is 2
      control?.markAsTouched();

      const error = component.getFieldError('bloodTypeCode', 'Blood Type Code');
      expect(error).toContain('cannot exceed 2 characters');
    });

    it('should validate maxlength for usageCode', () => {
      const control = component.form.get('usageCode');
      control?.setValue('AB'); // Max is 1
      control?.markAsTouched();

      const error = component.getFieldError('usageCode', 'Usage Code');
      expect(error).toContain('cannot exceed 1 character');
    });
  });

  describe('Edit Mode - Terminated Record', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: new Date('2024-12-31'),
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
    }));

    it('should not show termination date past error if not manually touched', () => {
      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });


  });

  describe('Edit Mode - isFormValid with disabled fields', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'N',
        alternateAbo: 'B+',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
    }));

    it('should validate edit mode form correctly when aboOnly is N', () => {
      expect(component.isFormValid).toBeTrue();
    });




  });

  describe('Date Error Display Logic', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should show effective date error only when it was last changed', fakeAsync(() => {
      const effectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(5, 'days');

      component.form.patchValue({ effectiveDate });
      tick();
      component.form.patchValue({ terminationDate });
      tick();

      // Last changed was termination date
      const effError = component.getEffectiveDateError();
      const termError = component.getTerminationDateError();

      // Cross-field error should appear on last changed field
      expect(component['lastChangedDateField']).toBe('termination');
    }));
  });
  describe('populateFormForEdit - Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      fixture.detectChanges();
      tick();
    }));



    it('should handle aboOnly as boolean true', fakeAsync(() => {
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: true as any,
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };

      component.ngOnChanges({
        data: {
          currentValue: component.data,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(component.form.get('aboOnly')?.value).toBeTruthy();
    }));

    it('should handle aboOnly as boolean false', fakeAsync(() => {
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: false as any,
        alternateAbo: 'B+',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };

      component.ngOnChanges({
        data: {
          currentValue: component.data,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      tick();

      expect(component.form.get('aboOnly')?.value).toBeTruthy();
    }));


  });

  describe('Save with Trimmed Values', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should trim testedAbo value when saving in add mode', fakeAsync(() => {
      const mockResponse = { success: true, message: 'ABO Value added successfully' };
      aboValuesService.addAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({
        testedAbo: '  A+  ',
        intendedUse: 'T',
        unitScheme: 'W',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'E',
        aboOnly: 'Y',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      const callArgs = aboValuesService.addAboValues.calls.mostRecent().args[0];
      expect(callArgs.testedAbo).toBe('A+');
    }));
  });

  describe('Date Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format moment date to YYYY-MM-DD', () => {
      const date = moment('2024-01-15');
      const formatted = component['formatDate'](date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15');
      const formatted = component['formatDate'](date);
      expect(formatted).toBe('2024-01-15');
    });


  });

  describe('Field Enabling/Disabling', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
    }));

    it('should enable all fields when calling enableAllFields', () => {
      component['enableAllFields']();
      expect(component.form.get('testedAbo')?.enabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
      expect(component.form.get('aboLabel')?.enabled).toBeTrue();
      expect(component.form.get('alternateAbo')?.enabled).toBeTrue();
    });

    it('should keep description disabled even after enableAllFields', () => {
      component['enableAllFields']();
      expect(component.form.get('description')?.disabled).toBeTrue();
    });
  });

  describe('Reset Form for Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
    }));

    it('should reset originalValues when switching to add mode', fakeAsync(() => {
      component['resetFormForAddMode']();
      tick();

      expect(component['originalValues'].auditKey).toBeNull();
      expect(component['originalValues'].testedAbo).toBe('');
      expect(component['isInitializingEditForm']).toBeFalse();
      expect(component['terminationDateManuallyTouched']).toBeFalse();
    }));

    it('should mark form as untouched and pristine', fakeAsync(() => {
      component.form.markAsTouched();
      component.form.markAsDirty();

      component['resetFormForAddMode']();
      tick();

      expect(component.form.untouched).toBeTrue();
      expect(component.form.pristine).toBeTrue();
    }));
  });

  describe('Check if Dropdown Options are Loaded', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when all options are loaded', fakeAsync(() => {
      tick();
      const result = component['areDropdownOptionsLoaded']();
      expect(result).toBeTrue();
    }));

    it('should return false when testedAbo options are empty', () => {
      component.testedAboOptions.set([]);
      const result = component['areDropdownOptionsLoaded']();
      expect(result).toBeFalse();
    });

    it('should return false when intendedUse options are empty', () => {
      component.intendedUseOptions.set([]);
      const result = component['areDropdownOptionsLoaded']();
      expect(result).toBeFalse();
    });
  });

  describe('Update Payload Construction', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: new Date('2024-12-31'),
        auditKey: 2031356
      };
      fixture.detectChanges();
      tick();
    }));

    it('should include all original values in update payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated' };
      aboValuesService.updateAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({ aboLabel: 'Updated' });
      component.onSave();
      tick();

      const payload = aboValuesService.updateAboValues.calls.mostRecent().args[0];
      expect(payload.auditKey).toBe(2031356);
      expect(payload.originalTestedAbo).toBe('A Positive');
      expect(payload.originalIntendedUse).toBe('T');
      expect(payload.originalUnitScheme).toBe('C');
    }));

    it('should serialize dates for update payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated' };
      aboValuesService.updateAboValues.and.returnValue(of(mockResponse));

      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });
      component.onSave();
      tick();

      const payload = aboValuesService.updateAboValues.calls.mostRecent().args[0];
      expect(payload.terminationDate).toBe('2026-12-31');
    }));
  });

  describe('Mode Change Event', () => {
    it('should emit modeChange event', fakeAsync(() => {
      let emittedMode: 'add' | 'edit' | undefined;
      component.modeChange.subscribe((mode) => {
        emittedMode = mode;
      });

      component.modeChange.emit('edit');
      tick();

      expect(emittedMode).toBe('edit');
    }));
  });

  describe('Empty Response Handling', () => {
    it('should handle empty dropdown response gracefully', fakeAsync(() => {
      const emptyResponse = {
        success: true,
        data: []
      };
      aboValuesService.getAboValuesDropdowns.and.returnValue(of(emptyResponse));

      fixture.detectChanges();
      tick();

      expect(component.isLoadingOptions).toBeFalse();
    }));
  });

  describe('Populate Form - No Data', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      fixture.detectChanges();
      tick();
    }));

    it('should not populate form if data is null', () => {
      component.data = null;
      component['populateFormForEdit']();

      // Form should remain empty
      expect(component.form.get('aboLabel')?.value).toBeFalsy();
    });

    it('should not populate form if dropdown options are not loaded', () => {
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };

      // Clear dropdown options
      component.testedAboOptions.set([]);
      component['populateFormForEdit']();

      // Form should not be populated
      expect(component.form.get('testedAbo')?.enabled).toBeTrue();
    });
  });

  describe('Error Messages', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should handle minlength error', () => {
      // Create a control with minlength validator for testing
      component.form.addControl('testField', new FormControl('', [Validators.minLength(5)]));
      const control = component.form.get('testField');
      control?.setValue('abc');
      control?.markAsTouched();

      const error = component.getFieldError('testField', 'Test Field');
      expect(error).toContain('must be at least 5 characters');
    });
  });

  describe('Save Success Event', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should emit saveSuccess on successful add', fakeAsync(() => {
      const mockResponse = { success: true };
      aboValuesService.addAboValues.and.returnValue(of(mockResponse));

      let emitted = false;
      component.saveSuccess.subscribe(() => {
        emitted = true;
      });

      component.form.patchValue({
        testedAbo: 'A+',
        intendedUse: 'T',
        unitScheme: 'W',
        aboLabel: 'A',
        aboDescription: 'Type A',
        transfusionStatus: 'E',
        aboOnly: 'Y',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();
      tick();

      expect(emitted).toBeTrue();
    }));
  });





  describe('Date Input Handlers', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should handle valid effective date input', fakeAsync(() => {
      const input = { value: '15-JAN-2024' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: input } as any);
      tick();

      expect(component.form.get('effectiveDate')).toBeTruthy();
    }));

    it('should handle empty effective date input', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateInput({ target: input } as any);
      tick();

      expect(component.form.get('effectiveDate')).toBeTruthy();
    }));
  });

  describe('isAboLabelReadOnly', () => {
    it('should return false in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.isAboLabelReadOnly).toBeFalse();
    }));

    it('should return false in edit mode when aboLabel is empty', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: '',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
      expect(component.isAboLabelReadOnly).toBeFalse();
    }));

    it('should return true in edit mode when aboLabel is set', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        testedAbo: 'A Positive',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: '',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 12345
      };
      fixture.detectChanges();
      tick();
      expect(component.isAboLabelReadOnly).toBeTrue();
    }));


  });

  describe('getIntendedUseError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));



    it('should return required error when touched and empty', () => {
      component.form.get('intendedUse')?.markAsTouched();
      const error = component.getIntendedUseError();
      expect(error).toBe('Intended Use is required');
    });

    it('should return Codabar error when unitScheme is C and intendedUse is not RG or EM', () => {
      component.form.patchValue({ intendedUse: 'T', unitScheme: 'C' });
      component.form.get('intendedUse')?.markAsTouched();
      const error = component.getIntendedUseError();
      expect(error).toBe('For Codabar (C) scheme, Intended Use must be RG or EM');
    });






  });

  describe('unitSchemeIdentifierValidator', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));







    it('should return error when unitScheme is C and intendedUse is not RG or EM', () => {
      component.form.patchValue({ unitScheme: 'C', intendedUse: 'T' });
      const result = component['unitSchemeIdentifierValidator'](component.form);
      expect(result).toEqual({ codabarRequiresRgOrEm: true });
    });




  });

  describe('filteredAlternateAboOptions', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should return all testedAbo options when search is empty', () => {
      component.alternateAboSearchControl.setValue('');
      const filtered = component.filteredAlternateAboOptions();
      expect(filtered.length).toBe(2);
    });






  });

  describe('Alternate ABO Validator', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));





    it('should return error when alternateAbo is same as testedAbo and aboOnly is N', () => {
      component.form.patchValue({
        testedAbo: 'A+',
        aboOnly: 'N',
        alternateAbo: 'A+'
      });

      const validatorResult = component['alternateAboValidator'](component.form);
      expect(validatorResult).toEqual({ alternateAboSameAsTestd: true });
    });


  });

  describe('Alternate ABO auto-sync when disabled', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should sync alternateAbo with testedAbo when alternateAbo is disabled', fakeAsync(() => {
      component.form.patchValue({
        testedAbo: 'A Positive',
        unitScheme: 'C',
        aboOnly: 'Y'
      });
      tick();

      expect(component.form.get('alternateAbo')?.disabled).toBeTrue();
      expect(component.form.getRawValue().alternateAbo).toBe('A Positive');

      component.form.get('testedAbo')?.setValue('B Positive');
      tick();

      expect(component.form.getRawValue().alternateAbo).toBe('B Positive');
    }));

    it('should not sync alternateAbo when it is enabled', fakeAsync(() => {
      component.form.patchValue({
        testedAbo: 'A Positive',
        aboOnly: 'N',
        alternateAbo: 'B Positive'
      });
      tick();

      expect(component.form.get('alternateAbo')?.enabled).toBeTrue();

      component.form.get('testedAbo')?.setValue('B Positive');
      tick();

      expect(component.form.get('alternateAbo')?.value).toBe('B Positive');
    }));





    it('should disable and auto-populate alternateAbo when unitScheme set to C AFTER aboOnly=Y', fakeAsync(() => {
      // Set aboOnly='Y' first (no Codabar at this point)
      component.form.get('aboOnly')?.setValue('Y');
      tick();
      expect(component.form.get('alternateAbo')?.enabled).toBeTrue();

      // Then set testedAbo
      component.form.get('testedAbo')?.setValue('A Positive');
      tick();

      // Now change unitScheme to 'C' — this is the previously broken sequence
      component.form.get('unitScheme')?.setValue('C');
      tick();

      expect(component.form.get('alternateAbo')?.disabled).toBeTrue();
      expect(component.form.getRawValue().alternateAbo).toBe('A Positive');
    }));

    it('should re-enable alternateAbo when unitScheme changes from C to non-C while aboOnly=Y', fakeAsync(() => {
      component.form.get('testedAbo')?.setValue('A Positive');
      component.form.get('aboOnly')?.setValue('Y');
      component.form.get('unitScheme')?.setValue('C');
      tick();

      expect(component.form.get('alternateAbo')?.disabled).toBeTrue();

      component.form.get('unitScheme')?.setValue('W');
      tick();

      expect(component.form.get('alternateAbo')?.enabled).toBeTrue();
    }));
  });
});
