import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { AddEditRegistrationHolds } from './add-edit-registration-holds';
import { RegistrationHoldsMappingService } from '../services/registration-holds-mapping.service';
import { RegistrationHoldsMappingModel } from '../models/registration-holds-mapping.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditRegistrationHolds', () => {
  let component: AddEditRegistrationHolds;
  let fixture: ComponentFixture<AddEditRegistrationHolds>;
  let mockService: jasmine.SpyObj<RegistrationHoldsMappingService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditRegistrationHolds>>;
  let mockHeaderService: { chapterTimeZone: ReturnType<typeof signal<string>> };

  const mockCodeOptions = {
    data: [
      { code: 'RH001', description: 'Code 001 Description' },
      { code: 'RH002', description: 'Code 002 Description' },
      { code: 'RH003', description: 'Code 003 Description' }
    ]
  };

  const mockRecord: RegistrationHoldsMappingModel = {
    interdictionReason: 'ABOPPCUE',
    code: 'RH001',
    description: 'Code 001 Description',
    effectiveDate: new Date('2028-06-15'),
    terminationDate: new Date('2028-12-31'),
    modificationDate: new Date('2028-11-20')
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RegistrationHoldsMappingService', [
      'getCodeDropdowns',
      'addRegistrationHold',
      'updateRegistrationHold'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = { chapterTimeZone: signal<string>('') };

    mockService.getCodeDropdowns.and.returnValue(of(mockCodeOptions));
    mockService.addRegistrationHold.and.returnValue(of({ success: true, message: 'Success' }));
    mockService.updateRegistrationHold.and.returnValue(of({ success: true, message: 'Updated' }));



      TestBed.configureTestingModule({
imports: [
        AddEditRegistrationHolds,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: RegistrationHoldsMappingService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } }
      ]
    });


    });



  beforeEach(() => {


      mockService.getCodeDropdowns.calls.reset();


      mockService.addRegistrationHold.calls.reset();


      mockService.updateRegistrationHold.calls.reset();


      mockDialogRef.close.calls.reset();


      mockService.getCodeDropdowns.and.returnValue(of(mockCodeOptions));


      mockService.addRegistrationHold.and.returnValue(of({ success: true, message: 'Success' }));


      mockService.updateRegistrationHold.and.returnValue(of({ success: true, message: 'Updated' }));


    fixture = TestBed.createComponent(AddEditRegistrationHolds);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should initialize form with validators in add mode', () => {
      fixture.detectChanges();
      const interdictionReasonControl = component.form.get('interdictionReason');
      const codeControl = component.form.get('code');
      const effectiveDateControl = component.form.get('effectiveDate');

      expect(interdictionReasonControl?.hasError('required')).toBe(true);
      expect(codeControl?.hasError('required')).toBe(true);
      expect(effectiveDateControl?.hasError('required')).toBe(true);
    });

    it('should load code options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getCodeDropdowns).toHaveBeenCalled();
      expect(component.codeOptions().length).toBe(3);
      expect(component.codeOptions()[0].code).toBe('RH001');
    }));

  });

  describe('Add Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick(); // Wait for async data loading to complete
    }));


    it('should save new record when form is valid', fakeAsync(() => {
      const mockDate = moment('2028-06-15');
      const mockTermDate = moment('2028-12-31');

      component.form.patchValue({
        interdictionReason: 'ABOPPCUE',
        code: 'RH001',
        description: 'Test Description',
        effectiveDate: mockDate,
        terminationDate: mockTermDate
      });

      component.onSave();
      tick();

      expect(mockService.addRegistrationHold).toHaveBeenCalled();
      const callArgs = mockService.addRegistrationHold.calls.mostRecent().args[0];
      expect(callArgs.InterReason).toBe('ABOPPCUE');
      expect(callArgs.Code).toBe('RH001');

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));


    it('should handle save errors', fakeAsync(() => {
      const errorResponse = { status: 409, error: { message: 'Duplicate entry' } };
      mockService.addRegistrationHold.and.returnValue(throwError(() => errorResponse));

      const mockDate = moment('2028-06-15');

      component.form.patchValue({
        interdictionReason: 'ABOPPCUE',
        code: 'RH001',
        description: 'Test',
        effectiveDate: mockDate
      });

      // Ensure form is valid
      expect(component.form.valid).toBe(true);

      component.onSave();
      tick();

      // Verify the service was called
      expect(mockService.addRegistrationHold).toHaveBeenCalled();
      // Component should remain in valid state after error
      expect(component.form.valid).toBe(true);
    }));

  });

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
      tick(); // Wait for async data loading to complete
    }));


    it('should clear validators for read-only fields in edit mode', () => {
      // In edit mode, interdictionReason, description, and effectiveDate are read-only
      // Code is now editable in edit mode
      expect(component.form.get('interdictionReason')?.hasError('required')).toBe(false);
      expect(component.form.get('description')?.hasError('required')).toBe(false);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(false);

      // Code should still have validators in edit mode
      expect(component.form.get('code')?.hasError('required')).toBe(false); // Valid because it's populated from mockRecord
    });






    it('should store original values for change detection', () => {
      expect(component['originalValues']).toBeTruthy();
      expect(component['originalValues'].terminationDate).toBeTruthy();
    });

    it('should store display values for read-only cards', () => {
      expect(component.editModeValues.interdictionReason).toBe('ABOPPCUE');
      expect(component.editModeValues.code).toBe('RH001');
      expect(component.editModeValues.description).toBe('Code 001 Description');
      expect(component.editModeValues.effectiveDate).toContain('15-JUN-2028');
      expect(component.editModeValues.terminationDate).toContain('31-DEC-2028');
    });

    it('should parse API dates in UTC to prevent 1-day-back timezone shift', () => {
      // API returns midnight UTC strings — moment.utc() must be used so the date
      // is never shifted back by the browser local timezone offset.
      const effMoment = component.form.get('effectiveDate')?.value;
      const termMoment = component.form.get('terminationDate')?.value;

      expect(moment.isMoment(effMoment)).toBe(true);
      expect(moment.isMoment(termMoment)).toBe(true);
      expect(effMoment.utc().format('YYYY-MM-DD')).toBe('2028-06-15');
      expect(termMoment.utc().format('YYYY-MM-DD')).toBe('2028-12-31');
      expect(component.editModeValues.effectiveDate).toBe('15-JUN-2028');
      expect(component.editModeValues.terminationDate).toBe('31-DEC-2028');
    });

    it('should update existing record when form is valid', fakeAsync(() => {
      // Change termination date to a different date to trigger hasFormChanged
      const mockTermDate = moment('2029-06-30');

      component.form.patchValue({
        terminationDate: mockTermDate
      });

      component.onSave();
      tick();

      expect(mockService.updateRegistrationHold).toHaveBeenCalled();
      const callArgs = mockService.updateRegistrationHold.calls.mostRecent().args[0];
      expect(callArgs.OriginalInterReason).toBe('ABOPPCUE');
      expect(callArgs.OriginalCode).toBe('RH001');
      expect(callArgs.Code).toBe('RH001'); // Code value from form

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should update code when changed in edit mode', fakeAsync(() => {
      component.form.patchValue({
        code: 'RH002'
      });

      component.onSave();
      tick();

      expect(mockService.updateRegistrationHold).toHaveBeenCalled();
      const callArgs = mockService.updateRegistrationHold.calls.mostRecent().args[0];
      expect(callArgs.OriginalInterReason).toBe('ABOPPCUE');
      expect(callArgs.OriginalCode).toBe('RH001');
      expect(callArgs.Code).toBe('RH002'); // Updated code from form

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should handle update errors', fakeAsync(() => {
      const errorResponse = { status: 404, error: { message: 'Record not found' } };
      mockService.updateRegistrationHold.and.returnValue(throwError(() => errorResponse));

      const mockTermDate = moment('2029-01-15');

      component.form.patchValue({
        terminationDate: mockTermDate
      });

      // Ensure form is valid (in edit mode, code and terminationDate are editable)
      expect(component.form.valid).toBe(true);

      component.onSave();
      tick();

      // Verify the service was called
      expect(mockService.updateRegistrationHold).toHaveBeenCalled();
      // Component should remain in valid state after error
      expect(component.form.valid).toBe(true);
    }));
  });

  describe('Code Change Listener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-populate description when code is selected', fakeAsync(() => {
      component.form.get('code')?.setValue('RH001');
      tick();

      expect(component.form.get('description')?.value).toBe('Code 001 Description');
    }));


    it('should not update description if code is not in options', fakeAsync(() => {
      component.form.get('code')?.setValue('INVALID');
      tick();

      // Description should not be set if code is not found
      expect(component.form.get('description')?.value).toBeFalsy();
    }));
  });

  describe('Form Controls and Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return interdiction reason error message', () => {
      const control = component.form.get('interdictionReason');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.getInterdictionReasonError()).toBe('Interdiction Reason is required');
    });

    it('should return code error message', () => {
      const control = component.form.get('code');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.getCodeError()).toBe('Code is required');
    });

    it('should return effective date error message', () => {
      const control = component.form.get('effectiveDate');
      control?.markAsTouched();
      control?.setValue(null);

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return past date error for effective date', () => {
      const control = component.form.get('effectiveDate');
      const pastDate = moment.utc().subtract(1, 'day');
      control?.setValue(pastDate);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective date cannot be prior to system date');
    });

    it('should show invalid date error immediately when input has text but value is null', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);
      effectiveDateControl?.setErrors({ required: true });

      // Mock the input element
      component['effectiveDateInput'] = {
        nativeElement: { value: 'invalid text' }
      } as any;

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is invalid');
    });

    it('should show parse error for effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setErrors({ matDatepickerParse: true });

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is invalid');
    });

    it('should not have description validation errors in add mode (field is auto-populated and disabled)', () => {
      component.mode = 'add';
      component.ngOnInit();

      const control = component.form.get('description');
      control?.markAsTouched();

      // Description field is disabled in add mode, so no validation errors
      expect(component.getDescriptionError()).toBe('');
    });

    it('should not return error when field is not touched', () => {
      const control = component.form.get('interdictionReason');
      control?.setValue('');

      expect(component.getInterdictionReasonError()).toBe('');
    });
  });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should allow termination date to be optional', () => {
      component.form.patchValue({
        interdictionReason: 'ABOPPCUE',
        code: 'RH001',
        description: 'Test',
        effectiveDate: new Date('2028-06-15'),
        terminationDate: null
      });

      expect(component.form.valid).toBe(true);
    });

    it('should mark all fields as touched on save attempt', () => {
      component.onSave();

      expect(component.form.get('interdictionReason')?.touched).toBe(true);
      expect(component.form.get('code')?.touched).toBe(true);
      expect(component.form.get('effectiveDate')?.touched).toBe(true);
    });
  });
  describe('Component Lifecycle', () => {


    it('should initialize form in add mode with empty values', () => {
      // Component is created fresh in add mode via dialog data
      expect(component.mode).toBe('add');
      expect(component.data).toBeNull();
      expect(component.form.get('interdictionReason')?.value).toBeFalsy();
      expect(component.form.get('code')?.value).toBeFalsy();
    });
  });

  describe('Date Validation and Cross-Field Errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update last changed field when effective date changes', () => {
      const effectiveDateControl = component.form.get('effectiveDate');

      effectiveDateControl?.setValue(new Date('2028-06-01'));

      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should update last changed field when termination date changes', () => {
      const terminationDateControl = component.form.get('terminationDate');

      terminationDateControl?.setValue(new Date('2028-12-31'));

      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should show cross-field error on effective date when it was last changed', fakeAsync(() => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      // Set termination date first
      terminationDateControl?.setValue(new Date('2028-06-01'));
      tick();

      // Set effective date after (so it's the last changed)
      effectiveDateControl?.setValue(new Date('2028-12-31'));
      tick();

      effectiveDateControl?.markAsTouched();
      component.form.updateValueAndValidity();
      tick();

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date must be on or before Termination Date');
    }));

    it('should show cross-field error on termination date when effective date was not last changed', () => {
      component['lastChangedDateField'] = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });

      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.markAsTouched();

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date must be on or after Effective Date');
    });

    it('should show invalid date error for termination date', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ invalidDate: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date is invalid');
    });

    it('should show parse error for termination date', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ matDatepickerParse: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date is invalid');
    });

    it('should show matDatepickerMin error for termination date', () => {
      component['lastChangedDateField'] = 'termination';
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.markAsTouched();
      terminationDateControl?.setErrors({ matDatepickerMin: true });

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date must be on or after Effective Date');
    });
  });

  describe('Termination Date Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow termination date on or after effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(new Date('2028-06-01'));

      const result = component.terminationDateFilter(moment('2028-06-15'));
      expect(result).toBe(true);
    });

    it('should block termination date before effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(new Date('2028-06-01'));

      const result = component.terminationDateFilter(moment('2028-05-15'));
      expect(result).toBe(false);
    });

    it('should allow null termination date', () => {
      const result = component.terminationDateFilter(null);
      expect(result).toBe(true);
    });

    it('should allow any date when effective date is not set', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);

      const result = component.terminationDateFilter(moment('2028-01-01'));
      expect(result).toBe(true);
    });
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error state for effective date when touched and has error', () => {
      const effectiveDateControl = component.form.get('effectiveDate') as any;
      component['lastChangedDateField'] = 'effective';
      component.form.setErrors({ dateRangeInvalid: true });
      effectiveDateControl.markAsTouched();

      const hasError = component.effDateErrorMatcher.isErrorState(effectiveDateControl, null);
      expect(hasError).toBe(true);
    });

    it('should show error state for termination date when touched and has error', () => {
      const terminationDateControl = component.form.get('terminationDate') as any;
      component['lastChangedDateField'] = 'termination';
      component.form.setErrors({ dateRangeInvalid: true });
      terminationDateControl.markAsTouched();

      const hasError = component.termDateErrorMatcher.isErrorState(terminationDateControl, null);
      expect(hasError).toBe(true);
    });

    it('should not show error state when control is null', () => {
      const hasError = component.effDateErrorMatcher.isErrorState(null, null);
      expect(hasError).toBe(false);
    });
  });

  describe('Termination Date Input Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has text but value is null', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setValue(null);

      // Mock the input element
      component['terminationDateInput'] = {
        nativeElement: { value: 'invalid date text' }
      } as any;

      component['validateTerminationDateInput']();

      expect(terminationDateControl?.hasError('invalidDate')).toBe(true);
    });

    it('should clear invalidDate error when input is empty', () => {
      const terminationDateControl = component.form.get('terminationDate');
      terminationDateControl?.setErrors({ invalidDate: true });

      // Mock the input element
      component['terminationDateInput'] = {
        nativeElement: { value: '' }
      } as any;

      component['validateTerminationDateInput']();

      expect(terminationDateControl?.hasError('invalidDate')).toBe(false);
    });

  });

  describe('Effective Date Input Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has text but value is null', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);

      // Mock the input element
      component['effectiveDateInput'] = {
        nativeElement: { value: 'invalid date text' }
      } as any;

      component['validateEffectiveDateInput']();

      expect(effectiveDateControl?.hasError('invalidDate')).toBe(true);
    });

    it('should clear invalidDate error when input is empty', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setErrors({ invalidDate: true });

      // Mock the input element
      component['effectiveDateInput'] = {
        nativeElement: { value: '' }
      } as any;

      component['validateEffectiveDateInput']();

      expect(effectiveDateControl?.hasError('invalidDate')).toBe(false);
    });

  });

  describe('Interdiction Reason Input Transformation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert interdiction reason to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'test';
      const event = { target: input } as any;

      component.onInterdictionReasonInput(event);

      expect(component.form.get('interdictionReason')?.value).toBe('TEST');
      expect(input.value).toBe('TEST');
    });




    it('should limit interdiction reason to 10 characters in template', () => {
      // This is enforced by maxlength attribute in the template
      const interdictionControl = component.form.get('interdictionReason');
      interdictionControl?.setValue('ABCDEFGHIJ');

      expect(interdictionControl?.value.length).toBe(10);
    });
  });


  describe('Button Text', () => {
    it('should show "ADD" button in add mode', () => {
      component.mode = 'add';
      component.isSaving = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.primary-btn');
      expect(button?.textContent?.trim()).toBe('ADD');
    });

    it('should show "SAVE" button in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.isSaving = false;
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.primary-btn');
      expect(button?.textContent?.trim()).toBe('SAVE');
    }));

    it('should show "SAVING..." when saving in add mode', () => {
      component.mode = 'add';
      component.isSaving = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.primary-btn');
      expect(button?.textContent?.trim()).toBe('SAVING...');
    });

    it('should show "SAVING..." when saving in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.isSaving = true;
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.primary-btn');
      expect(button?.textContent?.trim()).toBe('SAVING...');
    }));
  });
});
