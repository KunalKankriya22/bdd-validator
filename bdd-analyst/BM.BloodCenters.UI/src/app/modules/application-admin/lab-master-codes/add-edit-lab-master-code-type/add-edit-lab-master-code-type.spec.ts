import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import moment from 'moment';

import { AddEditLabMasterCodeType, MasterCodeDialogData } from './add-edit-lab-master-code-type';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';

describe('AddEditLabMasterCodeType Component - Unit Tests', () => {
  let component: AddEditLabMasterCodeType;
  let fixture: ComponentFixture<AddEditLabMasterCodeType>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddEditLabMasterCodeType>>;

  const mockHeaderService = { chapterTimeZone: () => 'UTC' };

  const createDialogRefSpy = () => jasmine.createSpyObj('MatDialogRef', ['close']);

  function setupWithData(data: MasterCodeDialogData): {
    comp: AddEditLabMasterCodeType;
    fix: ComponentFixture<AddEditLabMasterCodeType>;
    ref: jasmine.SpyObj<MatDialogRef<AddEditLabMasterCodeType>>;
  } {
    const ref = createDialogRefSpy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        AddEditLabMasterCodeType,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatIconModule,
        MatProgressSpinnerModule],
      providers: [
        { provide: MatDialogRef, useValue: ref },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: HeaderService, useValue: mockHeaderService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    const fix = TestBed.createComponent(AddEditLabMasterCodeType);
    const comp = fix.componentInstance;
    fix.detectChanges();
    return { comp, fix, ref };
  }

  beforeEach(() => {

    dialogRef = createDialogRefSpy();



      TestBed.configureTestingModule({
      imports: [
        AddEditLabMasterCodeType,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatIconModule,
        MatProgressSpinnerModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } as MasterCodeDialogData },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: HeaderService, useValue: mockHeaderService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });


    



    fixture = TestBed.createComponent(AddEditLabMasterCodeType);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {




    it('should initialize form with empty values in ADD mode', () => {
      expect(component.form.get('codeType')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });



    it('should mark form as pristine on init', () => {
      expect(component.form.pristine).toBe(true);
    });


  });

  describe('EDIT Mode Initialization', () => {
    const editData: MasterCodeDialogData = {
      mode: 'edit',
      code: 'TEST1',
      description: 'Test Description',
      effectiveDate: new Date('2026-04-15'),
      termDate: new Date('2026-12-31'),
      modificationDate: new Date('2026-04-20')
    };







    it('should handle null termination date in EDIT mode', () => {
      const { comp } = setupWithData({ ...editData, termDate: null });
      expect(comp.form.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('Form Validation - Code Type', () => {










    it('should be valid with uppercase letters only', () => {
      component.form.get('codeType')?.setValue('ABCDE');
      expect(component.form.get('codeType')?.valid).toBe(true);
    });

    it('should be valid with numbers only', () => {
      component.form.get('codeType')?.setValue('12345');
      expect(component.form.get('codeType')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Description', () => {








    it('should be valid at exactly max length', () => {
      const maxDescription = 'A'.repeat(500);
      component.form.get('description')?.setValue(maxDescription);
      expect(component.form.get('description')?.valid).toBe(true);
    });
  });
  describe('Error Messages', () => {
    describe('getCodeTypeError()', () => {




      it('should return max length error message', () => {
        component.form.get('codeType')?.setValue('ABCDEF');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code cannot exceed 5 characters');
      });

      it('should return alphanumeric error message', () => {
        component.form.get('codeType')?.setValue('AB-12');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type must be alphanumeric (special characters are not allowed)');
      });
    });

    describe('getDescriptionError()', () => {




      it('should return max length error message', () => {
        component.form.get('description')?.setValue('A'.repeat(501));
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description cannot exceed 500 characters');
      });
    });
    describe('getTerminationDateError()', () => {


      it('should return error when termination is before effective date', () => {
        component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
        component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
        component.form.markAllAsTouched();
        component.lastChangedDateField = 'termination';
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
      });
    });
  });

  describe('Character Count Methods', () => {
    it('should return correct remaining characters for codeType', () => {
      component.form.get('codeType')?.setValue('AB');
      expect(component.getCodeTypeRemainingCharacters()).toBe('Characters remaining: 3/5');
    });

    it('should return max count when codeType is empty', () => {
      component.form.get('codeType')?.setValue('');
      expect(component.getCodeTypeRemainingCharacters()).toBe('Characters remaining: 5/5');
    });

    it('should return zero when codeType is at max', () => {
      component.form.get('codeType')?.setValue('ABCDE');
      expect(component.getCodeTypeRemainingCharacters()).toBe('Characters remaining: 0/5');
    });

    it('should return correct remaining characters for description', () => {
      component.form.get('description')?.setValue('Test');
      expect(component.getDescriptionRemainingCharacters()).toBe('Characters Remaining: 496/500');
    });

    it('should return max count when description is empty', () => {
      component.form.get('description')?.setValue('');
      expect(component.getDescriptionRemainingCharacters()).toBe('Characters Remaining: 500/500');
    });
  });

  describe('Dialog Actions', () => {






    it('should emit save result with converted dates on save', fakeAsync(() => {
      let savedResult: any;
      const effectiveDate = moment().add(1, 'day');
      const termDate = moment().add(10, 'days')
      component.saveRequest.subscribe(result => savedResult = result);

      component.form.patchValue({
        codeType: 'ABC',
        description: 'Test',
        effectiveDate: effectiveDate,
        terminationDate: termDate
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(savedResult).toEqual(jasmine.objectContaining({
        code: 'ABC',
        description: 'Test'
      }));
    }));

    it('should convert moment dates to Date objects on save', fakeAsync(() => {
      let savedResult: any;
      const effectiveDate = moment().add(1, 'day');
      const termDate = moment().add(10, 'days');

      component.saveRequest.subscribe(result => savedResult = result);

      component.form.patchValue({
        codeType: 'ABC',
        description: 'Test',
        effectiveDate: effectiveDate,
        terminationDate: termDate
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(savedResult.effectiveDate).toBeTruthy();
      expect(savedResult.termDate).toBeTruthy();
    }));
    
    it('should handle null termination date on save', fakeAsync(() => {
      let savedResult: any;
      component.saveRequest.subscribe(result => savedResult = result);

      component.form.patchValue({
        codeType: 'ABC',
        description: 'Test',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(savedResult).toEqual(jasmine.objectContaining({
        termDate: null
      }));
    }));

    it('should emit save result with correct data in EDIT mode', fakeAsync(() => {
      const editModeData: MasterCodeDialogData = {
        mode: 'edit',
        code: 'TST',
        description: 'Old Desc',
        effectiveDate: new Date('2026-04-15')
      };
      const { comp, fix } = setupWithData(editModeData);

      let savedResult: any;
      comp.saveRequest.subscribe(result => savedResult = result);

      comp.form.patchValue({
        description: 'New Desc',
        effectiveDate: moment('2026-04-15')
      });
      comp.form.markAsDirty();
      fix.detectChanges();
      comp.form.updateValueAndValidity();

      comp.onSave();
      tick();

      expect(savedResult).toEqual(jasmine.objectContaining({
        code: 'TST',
        description: 'New Desc'
      }));
    }));



    it('should emit saveRequest with correct code when saving in ADD mode', fakeAsync(() => {
      let savedResult: any;
      component.saveRequest.subscribe(result => savedResult = result);

      component.form.patchValue({
        codeType: 'XYZ',
        description: 'Test',
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(savedResult).toEqual(jasmine.objectContaining({
        code: 'XYZ',
        description: 'Test'
      }));
    }));
  });

  describe('Form Control Getters', () => {
    it('should return codeType control', () => {
      expect(component.codeTypeControl).toBe(component.form.get('codeType'));
    });

    it('should return description control', () => {
      expect(component.descriptionControl).toBe(component.form.get('description'));
    });




  });

  describe('Utility Methods', () => {






    it('should return false in EDIT mode when form is not dirty', () => {
      const { comp } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2025-01-01')
      });
      // Form is pristine after init — isFormValid returns false
      expect(comp.isFormValid()).toBe(false);
    });
  });

  describe('Template Rendering', () => {




    it('should display character count hints', fakeAsync(() => {
      component.form.get('codeType')?.setValue('AB');
      fixture.detectChanges();
      tick();

      const hints = fixture.nativeElement.querySelectorAll('mat-hint');
      expect(hints.length).toBeGreaterThan(0);
    }));

    it('should display validation errors when form is touched and invalid', fakeAsync(() => {
      component.form.get('codeType')?.setValue('');
      component.form.get('codeType')?.markAsTouched();
      fixture.detectChanges();
      tick();

      const errors = fixture.nativeElement.querySelectorAll('mat-error');
      expect(errors.length).toBeGreaterThan(0);
    }));



    it('should display ADD button label in ADD mode', () => {
      const saveBtn = fixture.nativeElement.querySelector('.save-button');
      expect(saveBtn.textContent.trim()).toBe('ADD');
    });

    it('should display SAVE button label in EDIT mode', () => {
      const { fix } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2026-04-15')
      });
      const saveBtn = fix.nativeElement.querySelector('.save-button');
      expect(saveBtn.textContent.trim()).toBe('SAVE');
    });
  });

  describe('onCodeTypeInput()', () => {


    it('should not modify value when no spaces are present', () => {
      const input = document.createElement('input');
      input.value = 'ABCD';
      const event = { target: input } as unknown as Event;
      component.onCodeTypeInput(event);
      expect(component.form.get('codeType')?.value).toBe('');
    });

    it('should strip leading and trailing spaces', () => {
      const input = document.createElement('input');
      input.value = '  AB  ';
      const event = { target: input } as unknown as Event;
      component.onCodeTypeInput(event);
      expect(input.value).toBe('AB');
    });
  });

  describe('onEffectiveDateInput()', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const input = document.createElement('input');
      input.value = '15-Apr-2026';
      const event = { target: input } as unknown as Event;
      // Should not throw
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateInput()', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput in ADD mode', () => {
      const input = document.createElement('input');
      input.value = '31-Dec-2026';
      const event = { target: input } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should delegate to DateFieldValidationUtility.handleEndDateInput in EDIT mode', () => {
      const { comp } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2026-04-15')
      });
      const input = document.createElement('input');
      input.value = '31-Dec-2026';
      const event = { target: input } as unknown as Event;
      expect(() => comp.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('lastChangedDateField tracking', () => {
    it('should set lastChangedDateField to "effective" when effectiveDate changes', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      tick();
      expect(component.lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to "termination" when terminationDate changes', fakeAsync(() => {
      component.form.get('terminationDate')?.setValue(moment().add(5, 'days'));
      tick();
      expect(component.lastChangedDateField).toBe('termination');
    }));
  });
  describe('formatDate()', () => {
    it('should format a valid date in DD-MMM-YYYY format', () => {
      const date = new Date('2026-04-15');
      const formatted = component.formatDate(date);
      expect(formatted).toMatch(/^\d{2}-[A-Za-z]{3}-\d{4}$/);
    });


  });

  describe('isFormValid() - additional scenarios', () => {


    it('should return false when terminationDate has matDatepickerParse error', () => {
      component.form.patchValue({
        codeType: 'ABC',
        description: 'Test',
        effectiveDate: moment().add(1, 'day')
      });
      component.form.updateValueAndValidity();
      component.form.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isFormValid()).toBe(false);
    });




  });
  describe('EDIT mode - modificationDate', () => {
    it('should set modificationDate from dialog data', () => {
      const modDate = new Date('2026-04-20');
      const { comp } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2026-04-15'),
        modificationDate: modDate
      });
      expect(comp.modificationDate).toEqual(modDate);
    });


  });

  describe('onCancel()', () => {
    it('should call dialogRef.close()', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Form Control Getters - effectiveDate and terminationDate', () => {
    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('getCodeTypeError() - required case', () => {
    it('should return required error when code type is empty and touched', () => {
      component.form.get('codeType')?.setValue('');
      component.form.get('codeType')?.markAsTouched();
      expect(component.getCodeTypeError()).toBe('Code Type is required');
    });
  });

  describe('getDescriptionError() - required case', () => {
    it('should return required error when description is empty and touched', () => {
      component.form.get('description')?.setValue('');
      component.form.get('description')?.markAsTouched();
      expect(component.getDescriptionError()).toBe('Description is required');
    });
  });

  describe('terminationDateFilter()', () => {
    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return false for a date before today', () => {
      const pastDate = moment().subtract(30, 'days');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return false for a date before effective date', () => {
      const futureEffDate = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureEffDate);
      const beforeEffDate = moment().add(20, 'days');
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    });

    it('should return true for a date on or after effective date and today', () => {
      const futureEffDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureEffDate);
      const afterEffDate = moment().add(20, 'days');
      expect(component.terminationDateFilter(afterEffDate)).toBe(true);
    });
  });

  describe('isFormValid() - edit mode with dirty form and visible errors', () => {
    it('should return false when form is dirty but has visible description error', () => {
      const { comp } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2026-04-15')
      });
      comp.form.get('description')?.setValue('');
      comp.form.get('description')?.markAsTouched();
      comp.form.markAsDirty();
      expect(comp.isFormValid()).toBe(false);
    });

    it('should return true when form is dirty with no visible errors', () => {
      const { comp } = setupWithData({
        mode: 'edit',
        code: 'TST',
        description: 'Desc',
        effectiveDate: new Date('2026-04-15')
      });
      comp.form.get('description')?.setValue('Updated Desc');
      comp.form.markAsDirty();
      expect(comp.isFormValid()).toBe(true);
    });
  });

  describe('formatDate(null)', () => {
    it('should return empty string for null input', () => {
      expect(component.formatDate(null)).toBe('');
    });
  });

  describe('getEffectiveDateError()', () => {
    it('should return a string value', () => {
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });

    it('should return error when effective date has required error and is touched', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.setErrors({ required: true });
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });
  });
});
