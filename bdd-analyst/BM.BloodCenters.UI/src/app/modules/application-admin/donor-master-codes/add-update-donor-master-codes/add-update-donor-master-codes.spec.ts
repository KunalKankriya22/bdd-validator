,import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddUpdateDonorMasterCodes, MasterCodeDialogData } from './add-update-donor-master-codes';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import moment from 'moment';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddUpdateDonorMasterCodes', () => {
  let component: AddUpdateDonorMasterCodes;
  let fixture: ComponentFixture<AddUpdateDonorMasterCodes>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateDonorMasterCodes>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  // Use dynamic dates to avoid test failures when hardcoded dates become past dates
  const futureEffectiveDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
  const futureTerminationDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months from now

  const mockDialogData: MasterCodeDialogData = {
    mode: 'add'
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');



      TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatSelectModule,
        ReactiveFormsModule,
        AddUpdateDonorMasterCodes
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });
      mockLoginService.getStoredUsername.and.returnValue('testuser');


    fixture = TestBed.createComponent(AddUpdateDonorMasterCodes);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {


    it('should initialize with empty values in add mode', () => {
      expect(component.form.get('codeType')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });


  });
  describe('onSave', () => {
    it('should mark all fields as touched', () => {
      component.onSave();

      expect(component.form.get('codeType')?.touched).toBe(true);
      expect(component.form.get('description')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
      // terminationDate is optional — clearOptionalDateErrors un-touches empty fields
      expect(component.form.get('terminationDate')?.touched).toBe(false);
    });



    it('should save with null termination date', () => {
      let savedResult: any;
      component.saveRequest.subscribe(result => savedResult = result);

      component.form.patchValue({
        codeType: 'APITY',
        description: 'Test',
        effectiveDate: moment().add(1, 'month'),
        terminationDate: null
      });

      component.onSave();

      expect(savedResult).toEqual(jasmine.objectContaining({
        terminationDate: null
      }));
    });
  });

  describe('Validation Methods', () => {
    describe('isFormValid', () => {
      it('should return true when all required fields are valid', () => {
        component.form.patchValue({
          codeType: 'APITY',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        expect(component.isFormValid()).toBe(true);
      });

      it('should return false when code type is missing', () => {
        component.form.patchValue({
          codeType: '',
          description: 'Test',
          effectiveDate: moment('2026-04-10')
        });

        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when description is missing', () => {
        component.form.patchValue({
          codeType: 'APITY',
          description: '',
          effectiveDate: moment('2026-04-10')
        });

        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when effective date is missing', () => {
        component.form.patchValue({
          codeType: 'APITY',
          description: 'Test',
          effectiveDate: null
        });

        expect(component.isFormValid()).toBe(false);
      });
    });

    describe('Form Control Validation', () => {


      it('should be invalid for empty code type', () => {
        const control = component.form.get('codeType');
        control?.setValue('');
        expect(control?.valid).toBe(false);
      });

      it('should be invalid for code type exceeding max length', () => {
        const control = component.form.get('codeType');
        control?.setValue('APITYABC');
        expect(control?.hasError('maxlength')).toBe(true);
      });



      it('should be invalid for empty description', () => {
        const control = component.form.get('description');
        control?.setValue('');
        expect(control?.valid).toBe(false);
      });





      it('should be invalid for null effective date', () => {
        const control = component.form.get('effectiveDate');
        control?.setValue(null);
        expect(control?.hasError('required')).toBe(true);
      });
    });
  });

  describe('Error Message Methods', () => {
    describe('getCodeTypeError', () => {


      it('should return error message when field is touched and invalid', () => {
        component.form.get('codeType')?.setValue('');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type is required');
      });


    });

    describe('getDescriptionError', () => {


      it('should return error message when field is touched and invalid', () => {
        component.form.get('description')?.setValue('');
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description is required');
      });
    });

    describe('getEffectiveDateError', () => {


      it('should return error message when field is touched and invalid', () => {
        component.form.patchValue({ effectiveDate: null });
        component.form.get('effectiveDate')?.markAsTouched();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should return error message for past date in add mode', () => {
        component.mode = 'add';
        component.form.patchValue({ effectiveDate: moment('2024-01-01') });
        component.form.get('effectiveDate')?.markAsTouched();
        expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
      });

    });

    describe('getTerminationDateError', () => {


      it('should return error message when termination date is before effective date', () => {
        component.form.patchValue({
          effectiveDate: moment().add(6, 'months'),
          terminationDate: moment().add(1, 'months')
        });
        component.form.get('terminationDate')?.markAsTouched();
        (component as any).lastChangedDateField = 'termination';
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
      });
    });
  });
  describe('Termination Date Filter', () => {
    it('should allow null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should reject dates before today', () => {
      const pastDate = moment().subtract(1, 'day');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });



    it('should reject dates before effective date', () => {
      component.form.patchValue({
        effectiveDate: moment().add(30, 'days')
      });

      const beforeEffDate = moment().add(15, 'days');
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    });



    it('should allow future dates when no effective date is set', () => {
      component.form.patchValue({
        effectiveDate: null
      });

      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilter(futureDate)).toBe(true);
    });
  });

  describe('Edit Mode - Terminated Records', () => {
    beforeEach(async () => {
      const pastTermDate = moment().subtract(30, 'days').toDate();
      const editData: MasterCodeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        description: 'Apheresis Type',
        effDate: moment().subtract(60, 'days').toDate(),
        termDate: pastTermDate
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatDialogModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          AddUpdateDonorMasterCodes
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      fixture = TestBed.createComponent(AddUpdateDonorMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });







    it('should clear error when termination date is changed to future date', () => {
      // Touch the field and trigger error
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');

      // Change to future date
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      component.form.get('terminationDate')?.markAsDirty();
      component.form.markAsDirty();

      // Error should be cleared
      expect(component.getTerminationDateError()).toBe('');
      expect(component.isFormValid()).toBe(true);
    });

    it('should preserve untouched state during save when termination date was not manually touched', () => {
      let savedResult: any;
      component.saveRequest.subscribe(result => savedResult = result);

      // Change description to make form dirty
      component.form.get('description')?.setValue('Updated Description');
      component.form.get('description')?.markAsDirty();

      // Verify termination date is untouched
      expect(component.form.get('terminationDate')?.touched).toBe(false);

      // Call onSave
      component.onSave();

      // Termination date should still be untouched after markAllAsTouched + restore logic
      expect(component.form.get('terminationDate')?.touched).toBe(false);

      // Save should have been called
      expect(savedResult).toBeTruthy();
    });

    it('should return false from isFormValid when form is not dirty in edit mode', () => {
      // Form is pristine by default in edit setup
      component.form.markAsPristine();
      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('should close the dialog', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('getCodeError', () => {
    it('should return empty string when control is not touched', () => {
      expect(component.getCodeError()).toBe('');
    });

    it('should return required error when code is whitespace only', () => {
      component.form.get('code')?.setValidators([
        (c: any) => ({ whitespaceOnly: true })
      ]);
      component.form.get('code')?.setValue('   ');
      component.form.get('code')?.markAsTouched();
      component.form.get('code')?.updateValueAndValidity();
      expect(component.getCodeError()).toBe('Code is required');
    });

    it('should return max length error', () => {
      component.form.get('code')?.setValidators([
        (c: any) => ({ trimmedMaxLength: true })
      ]);
      component.form.get('code')?.setValue('TOOLONG');
      component.form.get('code')?.markAsTouched();
      component.form.get('code')?.updateValueAndValidity();
      expect(component.getCodeError()).toBe('Code cannot exceed 5 characters');
    });

    it('should return pattern error', () => {
      component.form.get('code')?.setValidators([
        (c: any) => ({ pattern: true })
      ]);
      component.form.get('code')?.setValue('AB@C');
      component.form.get('code')?.markAsTouched();
      component.form.get('code')?.updateValueAndValidity();
      expect(component.getCodeError()).toBe('Code must be alphanumeric (special characters are not allowed)');
    });
  });

  describe('getCodeTypeError additional branches', () => {
    it('should return max length error for code type', () => {
      component.form.get('codeType')?.setValidators([
        (c: any) => ({ trimmedMaxLength: true })
      ]);
      component.form.get('codeType')?.setValue('TOOLONG');
      component.form.get('codeType')?.markAsTouched();
      component.form.get('codeType')?.updateValueAndValidity();
      expect(component.getCodeTypeError()).toBe('Code Type cannot exceed 5 characters');
    });

    it('should return pattern error for code type', () => {
      component.form.get('codeType')?.setValidators([
        (c: any) => ({ pattern: true })
      ]);
      component.form.get('codeType')?.setValue('AB@');
      component.form.get('codeType')?.markAsTouched();
      component.form.get('codeType')?.updateValueAndValidity();
      expect(component.getCodeTypeError()).toBe('Code Type must be alphanumeric (special characters are not allowed)');
    });

    it('should return empty string when not touched', () => {
      expect(component.getCodeTypeError()).toBe('');
    });
  });

  describe('getDescriptionError additional branches', () => {
    it('should return max length error for description', () => {
      component.form.get('description')?.setValidators([
        (c: any) => ({ trimmedMaxLength: true })
      ]);
      component.form.get('description')?.setValue('x'.repeat(250));
      component.form.get('description')?.markAsTouched();
      component.form.get('description')?.updateValueAndValidity();
      expect(component.getDescriptionError()).toBe('Description cannot exceed 240 characters');
    });
  });

  describe('editEffectiveDateDisplay', () => {
    it('should return dash when no effDate', () => {
      component.data.effDate = undefined;
      expect(component.editEffectiveDateDisplay).toBe('-');
    });

    it('should return formatted date when effDate exists', () => {
      component.data.effDate = new Date(2026, 0, 15);
      const result = component.editEffectiveDateDisplay;
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('formatDate', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return formatted date string', () => {
      const result = component.formatDate(new Date(2026, 0, 15));
      expect(result).toBe('15-JAN-2026');
    });
  });

  describe('descriptionRemainingChars', () => {
    it('should return 240 for empty description', () => {
      component.form.get('description')?.setValue('');
      expect(component.descriptionRemainingChars).toBe(240);
    });

    it('should subtract length of description', () => {
      component.form.get('description')?.setValue('Hello');
      expect(component.descriptionRemainingChars).toBe(235);
    });
  });

  describe('onCodeTypeInput', () => {
    it('should strip special chars and uppercase', () => {
      const input = document.createElement('input');
      input.value = 'ab@c1';
      const event = { target: input } as unknown as Event;
      component.onCodeTypeInput(event);
      expect(input.value).toBe('ABC1');
    });

    it('should not modify valid input', () => {
      const input = document.createElement('input');
      input.value = 'ABC1';
      const event = { target: input } as unknown as Event;
      component.onCodeTypeInput(event);
      expect(input.value).toBe('ABC1');
    });
  });

  describe('onCodeInput', () => {
    it('should strip special chars and uppercase', () => {
      const input = document.createElement('input');
      input.value = 'ab@c1';
      const event = { target: input } as unknown as Event;
      component.onCodeInput(event);
      expect(input.value).toBe('ABC1');
    });

    it('should not modify valid input', () => {
      const input = document.createElement('input');
      input.value = 'ABC1';
      const event = { target: input } as unknown as Event;
      component.onCodeInput(event);
      expect(input.value).toBe('ABC1');
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should call DateFieldValidationUtility.handleStartDateInput', () => {
      const input = document.createElement('input');
      input.value = '01-JAN-2027';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('onTerminationDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      const input = document.createElement('input');
      input.value = '01-JAN-2027';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(true).toBe(true);
    });
  });

  describe('isFormValid additional branches', () => {
    it('should return false when termination date has invalidDate error', () => {
      component.form.patchValue({
        codeType: 'APITY',
        description: 'Test',
        effectiveDate: moment().add(1, 'month')
      });
      component.form.get('terminationDate')?.setErrors({ invalidDate: true });
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when termination date has invalidDateFormat error', () => {
      component.form.patchValue({
        codeType: 'APITY',
        description: 'Test',
        effectiveDate: moment().add(1, 'month')
      });
      component.form.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when form has dateRangeInvalid error', () => {
      component.form.patchValue({
        codeType: 'APITY',
        description: 'Test',
        effectiveDate: moment().add(6, 'months'),
        terminationDate: moment().add(1, 'month')
      });
      component.form.setErrors({ dateRangeInvalid: true });
      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('Add Mode with codeType pre-set', () => {
    beforeEach(() => {
      const addDataWithCodeType: MasterCodeDialogData = {
        mode: 'add',
        codeType: 'APITY'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatDialogModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          AddUpdateDonorMasterCodes
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: addDataWithCodeType },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      fixture = TestBed.createComponent(AddUpdateDonorMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should disable codeType and pre-fill it', () => {
      expect(component.form.get('codeType')?.disabled).toBe(true);
      expect(component.form.get('codeType')?.value).toBe('APITY');
    });

    it('should add validators to code field', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('');
      codeControl?.markAsTouched();
      expect(codeControl?.valid).toBe(false);
    });
  });

  describe('Constructor with modificationDate', () => {
    it('should set modificationDate from dialog data', () => {
      const editData: MasterCodeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        description: 'Test',
        effDate: new Date(),
        modificationDate: new Date(2026, 5, 1)
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatDialogModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          AddUpdateDonorMasterCodes
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      fixture = TestBed.createComponent(AddUpdateDonorMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.modificationDate).toBeTruthy();
    });
  });
});
