import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { signal } from '@angular/core';
import moment from 'moment';

import { AddUpdateCode, CodeDialogData } from './add-update-code';
import { HeaderService } from '@shared/services/header.service';
import { COMM_CODE_VALIDATION } from '../../constants/communication-types-messages.constants';
import { Subject } from 'rxjs';

describe('AddUpdateCode', () => {
  let component: AddUpdateCode;
  let fixture: ComponentFixture<AddUpdateCode>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddUpdateCode>>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const addModeData: CodeDialogData = { mode: 'add', codeType: 'EMAIL' };

  const editModeData: CodeDialogData = {
    mode: 'edit',
    codeType: 'EMAIL',
    codeTypeDescription: 'Email Communication',
    commCode: 'CONF',
    description: 'Confirmation',
    targetDays: 7,
    effDate: '2024-01-01T00:00:00',
    termDate: '2024-12-31T00:00:00',
  };

  const chapterChanged$ = new Subject<void>();

  function createComponent(data: CodeDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(AddUpdateCode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('UTC'),
    });

    await TestBed.configureTestingModule({
      imports: [AddUpdateCode, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    }).compileComponents();
  });

  describe('Add Mode', () => {
    beforeEach(() => createComponent(addModeData));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set dialog title to "Add New Code"', () => {
      expect(component.dialogTitle).toBe('Add New Code');
    });

    it('should initialize form with empty values', () => {
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('days')?.value).toBeNull();
    });

    it('should require code', () => {
      component.form.get('code')?.markAsTouched();
      expect(component.getCodeError()).toBe(COMM_CODE_VALIDATION.CODE_REQUIRED);
    });

    it('should enforce code max length of 5', () => {
      component.form.patchValue({ code: 'ABCDEF' });
      component.form.get('code')?.markAsTouched();
      expect(component.getCodeError()).toBe(COMM_CODE_VALIDATION.CODE_MAX_LENGTH);
    });

    it('should reject non-alphanumeric code', () => {
      component.form.patchValue({ code: 'AB@C' });
      component.form.get('code')?.markAsTouched();
      expect(component.getCodeError()).toBe(COMM_CODE_VALIDATION.CODE_PATTERN);
    });

    it('should reject reserved value COMTP', () => {
      component.form.patchValue({ code: 'COMTP' });
      component.form.get('code')?.markAsTouched();
      expect(component.getCodeError()).toBe(COMM_CODE_VALIDATION.CODE_FORBIDDEN);
    });

    it('should require description', () => {
      component.form.get('description')?.markAsTouched();
      expect(component.getDescriptionError()).toBe(COMM_CODE_VALIDATION.DESCRIPTION_REQUIRED);
    });

    it('should enforce description max length of 50', () => {
      component.form.patchValue({ description: 'A'.repeat(51) });
      component.form.get('description')?.markAsTouched();
      expect(component.getDescriptionError()).toBe(COMM_CODE_VALIDATION.DESCRIPTION_MAX_LENGTH);
    });

    it('should require effective date', () => {
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should emit saveRequest on valid save', () => {
      spyOn(component.saveRequest, 'next');
      component.form.patchValue({
        code: 'TEST',
        description: 'Test Description',
        effectiveDate: moment(),
      });

      component.onSave(false);

      expect(component.saveRequest.next).toHaveBeenCalled();
      expect(component.isSaving).toBeTrue();
    });

    it('should not save when form is invalid', () => {
      spyOn(component.saveRequest, 'next');
      component.onSave(false);
      expect(component.saveRequest.next).not.toHaveBeenCalled();
    });

    it('should not save when already saving', () => {
      spyOn(component.saveRequest, 'next');
      component.isSaving = true;
      component.onSave(false);
      expect(component.saveRequest.next).not.toHaveBeenCalled();
    });

    it('should reset form on resetFormForAddAnother', () => {
      component.form.patchValue({ code: 'TEST', description: 'Desc' });
      component.isSaving = true;

      component.resetFormForAddAnother();

      expect(component.isSaving).toBeFalse();
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.pristine).toBeTrue();
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should calculate descriptionRemainingChars', () => {
      component.form.patchValue({ description: 'Hello' });
      expect(component.descriptionRemainingChars).toBe(45);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => createComponent(editModeData));

    it('should set dialog title to "Edit Code"', () => {
      expect(component.dialogTitle).toBe('Edit Code');
    });

    it('should populate form with existing data', () => {
      expect(component.form.get('code')?.value).toBe('CONF');
      expect(component.form.get('description')?.value).toBe('Confirmation');
      expect(component.form.get('days')?.value).toBe(7);
    });

    it('should not allow save when form is not dirty', () => {
      expect(component.isFormValid()).toBeFalse();
    });

    it('should allow save after form is dirtied', () => {
      component.form.patchValue({ description: 'Updated' });
      component.form.markAsDirty();
      expect(component.isFormValid()).toBeTrue();
    });

    it('should display effective date in read-only format', () => {
      expect(component.editEffectiveDateDisplay).not.toBe('-');
    });

    it('should display effective date correctly without timezone shift', () => {
      expect(component.editEffectiveDateDisplay).toBe('01-JAN-2024');
    });

    it('should populate termination date correctly without timezone shift', () => {
      const termValue = component.form.get('terminationDate')?.value;
      expect(termValue).toBeTruthy();
      expect(termValue.date()).toBe(31);
      expect(termValue.month()).toBe(11);
      expect(termValue.year()).toBe(2024);
    });

    it('should restore original values on clearAll', () => {
      component.form.patchValue({ description: 'Changed' });
      component.form.markAsDirty();

      component.onClearAll();

      expect(component.form.get('description')?.value).toBe('Confirmation');
      expect(component.form.pristine).toBeTrue();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => createComponent(addModeData));

    it('should show termination date past error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe(COMM_CODE_VALIDATION.TERMINATION_DATE_PAST);
    });

    it('should detect date range invalid error', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment(),
      });
      component.form.updateValueAndValidity();
      expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
    });
  });
});
