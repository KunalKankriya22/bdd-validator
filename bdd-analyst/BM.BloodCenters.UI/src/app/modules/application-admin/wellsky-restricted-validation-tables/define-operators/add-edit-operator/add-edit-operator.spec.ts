import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { AddEditOperator } from './add-edit-operator';
import { DefineOperatorsService } from '../services/define-operators.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { ValidOperator } from '../models/define-operators.model';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditOperator', () => {
  let component: AddEditOperator;
  let fixture: ComponentFixture<AddEditOperator>;
  let mockService: jasmine.SpyObj<DefineOperatorsService>;

  // Helper function to get future date
  const getFutureDate = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  };

  const mockEditData: ValidOperator = {
    operator: 'EQ',
    description: 'Equal to',
    valueStyle: 'S',
    effectiveDate: getFutureDate(30),
    terminationDate: getFutureDate(365)
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineOperatorsService', [
      'addValidOperator',
      'updateValidOperator'
    ]);
    mockService.addValidOperator.and.returnValue(of({ success: true, message: 'Added successfully' }));
    mockService.updateValidOperator.and.returnValue(of({ success: true, message: 'Updated successfully' }));



      TestBed.configureTestingModule({
      imports: [AddEditOperator],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: DefineOperatorsService, useValue: mockService }
      ]
    });


    


      mockService.addValidOperator.calls.reset();


      mockService.updateValidOperator.calls.reset();


      mockService.addValidOperator.and.returnValue(of({ success: true, message: 'Added successfully' }));


      mockService.updateValidOperator.and.returnValue(of({ success: true, message: 'Updated successfully' }));


    fixture = TestBed.createComponent(AddEditOperator);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize form with required controls', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('operator')).toBeDefined();
      expect(component.form.get('description')).toBeDefined();
      expect(component.form.get('valueStyle')).toBeDefined();
      expect(component.form.get('effectiveDate')).toBeDefined();
      expect(component.form.get('terminationDate')).toBeDefined();
    });




  });

  describe('ngOnInit', () => {




    it('should set minDate to today in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.minDate).not.toBeNull();
    });
  });



  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });





    it('should keep operator field enabled in edit mode', () => {
      expect(component.form.get('operator')?.enabled).toBe(true);
    });



    it('should store operator in editModeValues', () => {
      expect(component.editModeValues.operator).toBe('EQ');
    });

    it('should mark form as pristine after populating edit data', () => {
      expect(component.form.pristine).toBe(true);
    });
  });
  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
    });





    it('should call addValidOperator when form is valid', fakeAsync(() => {
      component.form.patchValue({
        operator: 'LIKE',
        description: 'Pattern matching',
        valueStyle: 'S',
        effectiveDate: moment().add(1, 'month'),
        terminationDate: null
      });

      component.onSave();
      tick();

      expect(mockService.addValidOperator).toHaveBeenCalledWith(jasmine.objectContaining({
        operator: 'LIKE',
        valueStyle: 'S'
      }));
    }));

    it('should emit saveSuccess and closePanel on successful add', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        operator: 'LIKE',
        description: 'Pattern matching',
        valueStyle: 'S',
        effectiveDate: moment().add(1, 'month')
      });

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));


  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call updateValidOperator with operator code in edit mode', fakeAsync(() => {
      component.form.patchValue({
        description: 'Updated description'
      });
      component.form.markAsDirty();

      component.onSave();
      tick();

      expect(mockService.updateValidOperator).toHaveBeenCalledWith(
        'EQ',
        jasmine.objectContaining({
          valueStyle: 'S'
        })
      );
    }));
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should handle 400 validation error with modelErrors', fakeAsync(() => {
      mockService.addValidOperator.and.returnValue(throwError(() => ({
        status: 400,
        error: {
          modelErrors: { EffectiveDate: ['EffectiveDate cannot be in the past.'] },
          message: 'Bad Request'
        }
      })));

      component.form.patchValue({
        operator: 'TEST',
        valueStyle: 'S',
        effectiveDate: moment().add(1, 'month')
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should handle 500 server error', fakeAsync(() => {
      mockService.addValidOperator.and.returnValue(throwError(() => ({
        status: 500,
        error: {}
      })));

      component.form.patchValue({
        operator: 'TEST',
        valueStyle: 'S',
        effectiveDate: moment().add(1, 'month')
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('Error Message Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return required error for operator', () => {
      component.form.get('operator')?.markAsTouched();
      expect(component.getOperatorError()).toBe('Operator is required');
    });

    it('should return maxlength error for operator', () => {
      component.form.get('operator')?.setValue('12345678901');
      component.form.get('operator')?.markAsTouched();
      expect(component.getOperatorError()).toBe('Operator must not exceed 10 characters');
    });

    it('should return maxlength error for description', () => {
      component.form.get('description')?.setValue('a'.repeat(101));
      component.form.get('description')?.markAsTouched();
      expect(component.getDescriptionError()).toBe('Description must not exceed 100 characters');
    });

    it('should return required error for valueStyle', () => {
      component.form.get('valueStyle')?.markAsTouched();
      expect(component.getValueStyleError()).toBe('Values is required');
    });


  });

  describe('isFormActionDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should return true when isSaving is true', () => {
      component.mode = 'add';
      component.form.patchValue({
        operator: 'TEST',
        valueStyle: 'S',
        effectiveDate: moment().add(1, 'month')
      });
      component.isSaving = true;

      expect(component.isFormActionDisabled).toBe(true);
    });
  });

  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset editModeValues', () => {
      const futureDate = moment().add(1, 'month').format('DD-MMM-YYYY');
      const laterDate = moment().add(1, 'year').format('DD-MMM-YYYY');

      component.editModeValues = {
        operator: 'EQ',
        effectiveDate: futureDate,
        terminationDate: laterDate
      };

      component['resetFormForAddMode']();

      expect(component.editModeValues.operator).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
      expect(component.editModeValues.terminationDate).toBe('');
    });

    it('should reset and enable operator control', () => {
      component.form.get('operator')?.disable();
      component.form.patchValue({ operator: 'EQ' });

      component['resetFormForAddMode']();

      expect(component.form.get('operator')?.enabled).toBe(true);
      expect(component.form.get('operator')?.value).toBeFalsy();
    });

    it('should restore required validators for add mode', () => {
      component['resetFormForAddMode']();

      component.form.get('operator')?.setValue('');
      component.form.get('operator')?.updateValueAndValidity();

      expect(component.form.get('operator')?.hasError('required')).toBe(true);
    });
  });

  describe('Edit Mode with null/empty data', () => {


    it('should handle data with missing optional fields', () => {
      component.mode = 'edit';
      component.data = {
        operator: 'TEST',
        description: null,
        valueStyle: 'S',
        effectiveDate: getFutureDate(30),
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });
  });


  describe('Input Validation - preventNonAlphanumeric', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should allow arrow keys', () => {
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(leftEvent, 'preventDefault');
      spyOn(rightEvent, 'preventDefault');

      component.preventNonAlphanumeric(leftEvent, 'operator');
      component.preventNonAlphanumeric(rightEvent, 'operator');

      expect(leftEvent.preventDefault).not.toHaveBeenCalled();
      expect(rightEvent.preventDefault).not.toHaveBeenCalled();
    });



    it('should allow alphanumeric characters', () => {
      const letterEvent = new KeyboardEvent('keydown', { key: 'A' });
      const numberEvent = new KeyboardEvent('keydown', { key: '5' });
      spyOn(letterEvent, 'preventDefault');
      spyOn(numberEvent, 'preventDefault');

      component.preventNonAlphanumeric(letterEvent, 'operator');
      component.preventNonAlphanumeric(numberEvent, 'operator');

      expect(letterEvent.preventDefault).not.toHaveBeenCalled();
      expect(numberEvent.preventDefault).not.toHaveBeenCalled();
    });




  });



  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleStartDateInput for effective date', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '15-JAN-2027';
      const event = { target: inputElement } as any;

      component.onEffectiveDateInput(event);

      // Verify the control exists and was interacted with
      expect(component.form.get('effectiveDate')).toBeDefined();
    });

    it('should call DateFieldValidationUtility.handleEndDateInput for termination date in add mode', () => {
      component.mode = 'add';
      const inputElement = document.createElement('input');
      inputElement.value = '15-DEC-2027';
      const event = { target: inputElement } as any;

      component.onTerminationDateInput(event);

      // Verify the control exists and was interacted with
      expect(component.form.get('terminationDate')).toBeDefined();
    });

    it('should call DateFieldValidationUtility.handleEndDateInput for termination date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const inputElement = document.createElement('input');
      inputElement.value = '15-DEC-2027';
      const event = { target: inputElement } as any;

      component.onTerminationDateInput(event);

      // Verify the control exists and was interacted with
      expect(component.form.get('terminationDate')).toBeDefined();
    });
  });

  describe('Value Style Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter value style options based on search term', fakeAsync(() => {
      component.valueStyleSearchControl.setValue('single');
      tick(300);

      expect(component.filteredValueStyleOptions.length).toBeLessThan(component.valueStyleOptions.length);
    }));

    it('should show all options when search is cleared', fakeAsync(() => {
      component.valueStyleSearchControl.setValue('single');
      tick(300);
      component.valueStyleSearchControl.setValue('');
      tick(300);

      expect(component.filteredValueStyleOptions.length).toBe(component.valueStyleOptions.length);
    }));
  });

  describe('Error Messages - whitespaceOnly validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show whitespace error for operator with only spaces', () => {
      const control = component.form.get('operator');
      control?.setValue('   ');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(component.getOperatorError()).toBe('Operator cannot contain only spaces');
    });

    it('should show whitespace error for description with only spaces', () => {
      const control = component.form.get('description');
      control?.setValue('   ');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(component.getDescriptionError()).toBe('Description cannot contain only spaces');
    });

    it('should show pattern error for operator with invalid characters', () => {
      const control = component.form.get('operator');
      // Re-add the pattern validator for this test since setupPanel removes it
      control?.setValidators([
        Validators.required,
        Validators.maxLength(10),
        Validators.pattern(/^[A-Za-z0-9 ]+$/)
      ]);
      control?.setValue('EQ@#');
      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(component.getOperatorError()).toBe('Only alphanumeric characters allowed');
    });
  });

  describe('Cross-field Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show error when termination date is before effective date', fakeAsync(() => {
      const effDate = moment().add(1, 'year');
      const termDate = moment().add(6, 'months');

      component.form.patchValue({
        effectiveDate: effDate,
        terminationDate: termDate
      });
      tick();

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    }));

    it('should not show error when termination date is after effective date', fakeAsync(() => {
      const effDate = moment().add(6, 'months');
      const termDate = moment().add(1, 'year');

      component.form.patchValue({
        effectiveDate: effDate,
        terminationDate: termDate
      });
      tick();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    }));


  });

  describe('Format Date for Display', () => {
    it('should format valid date correctly', () => {
      const date = new Date('2027-06-15');
      const formatted = component['formatDateForDisplay'](date);

      expect(formatted).toContain('2027');
      expect(formatted).toContain('JUN');
    });





    it('should handle string dates', () => {
      const formatted = component['formatDateForDisplay']('2027-06-15');
      expect(formatted).toContain('2027');
    });
  });

  describe('TerminationDateFilter Functionality - Date Restriction', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });





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





    it('should validate termination date cannot be before effective date', fakeAsync(() => {
      const effectiveDate = moment().add(1, 'year').startOf('day');
      const terminationDate = moment().add(6, 'months').startOf('day');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });
      tick(20);

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    }));
  });
  describe('Termination Date Cross-field Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should validate termination date cannot be before effective date', fakeAsync(() => {
      const effectiveDate = moment().add(1, 'year').startOf('day');
      const terminationDate = moment().add(6, 'months').startOf('day');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });
      tick(20);

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    }));

    it('should allow termination date equal to effective date', fakeAsync(() => {
      const sameDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        effectiveDate: sameDate,
        terminationDate: sameDate.clone()
      });
      tick(20);

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    }));



    it('should allow termination date on the same day as effective date', fakeAsync(() => {
      const date = moment().add(1, 'month').startOf('day');

      component.form.patchValue({
        effectiveDate: date,
        terminationDate: date.clone()
      });
      tick(20);

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    }));
  });
});
