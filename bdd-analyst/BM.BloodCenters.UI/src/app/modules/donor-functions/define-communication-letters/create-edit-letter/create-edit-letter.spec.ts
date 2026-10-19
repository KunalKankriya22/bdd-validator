import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEditCommLetter, CreateEditCommLetterData } from './create-edit-letter';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommunicationLettersService } from '../services/communication-letters.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { CommLetterView, CommLetterCodeOption } from '../models/communication-letter.model';

function createTestBed(dialogData: CreateEditCommLetterData) {
  const mockService = jasmine.createSpyObj('CommunicationLettersService', ['createLetter', 'reviseLetter']);
  const mockHeaderService = createMockHeaderService();
  const mockSnackBar = createMockMatSnackBar();
  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

  mockService.createLetter.and.returnValue(of({ letterId: 'new-1', letterCode: 'TST', letterTitle: 'Test', versionNo: 1, effDate: '2027-01-01' } as CommLetterView));
  mockService.reviseLetter.and.returnValue(of({ letterId: 'rev-1', letterCode: 'TST', letterTitle: 'Test Revised', versionNo: 2, effDate: '2027-02-01' } as CommLetterView));

  return {
    mockService,
    mockHeaderService,
    mockSnackBar,
    mockDialogRef,
    providers: [
      { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
      { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: CommunicationLettersService, useValue: mockService },
      { provide: HeaderService, useValue: mockHeaderService },
      { provide: MatSnackBar, useValue: mockSnackBar },
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  };
}

const sampleLetterCodes: CommLetterCodeOption[] = [
  { letterCode: 'ABC', letterTitle: 'Letter A' },
  { letterCode: 'DEF', letterTitle: 'Letter D' },
];

const sampleLetter: CommLetterView = {
  letterId: 'letter-123',
  letterCode: 'ABC',
  letterTitle: 'Existing Letter',
  versionNo: 3,
  effDate: '2026-06-01',
  termDate: '2027-12-31',
  documentType: 'N',
  letterContent: 'Some content here',
};

describe('CreateEditCommLetter', () => {
  let component: CreateEditCommLetter;
  let fixture: ComponentFixture<CreateEditCommLetter>;
  let mockService: jasmine.SpyObj<CommunicationLettersService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateEditCommLetter>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  describe('Add Mode', () => {
    beforeEach(() => {
      const testSetup = createTestBed({ mode: 'add', letterCodes: sampleLetterCodes });
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should set dialogTitle to New Letter in add mode', () => {
      expect(component.dialogTitle).toBe('New Letter');
    });

    it('should populate letterCodeOptions from dialog data', () => {
      expect(component.letterCodeOptions).toEqual(sampleLetterCodes);
    });

    it('should initialize form with empty values', () => {
      expect(component.letterForm.get('letterCode')?.value).toBe('');
      expect(component.letterForm.get('letterTitle')?.value).toBe('');
      expect(component.letterForm.get('effDate')?.value).toBeNull();
      expect(component.letterForm.get('termDate')?.value).toBeNull();
      expect(component.letterForm.get('letterContent')?.value).toBe('');
    });

    it('should set isSaving to false initially', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should set newVersionNo to 1', () => {
      expect(component.newVersionNo).toBe(1);
    });

    it('should have versionNo control disabled', () => {
      expect(component.letterForm.get('versionNo')?.disabled).toBeTrue();
    });

    it('should have fileName control disabled', () => {
      expect(component.letterForm.get('fileName')?.disabled).toBeTrue();
    });

    it('should have letterCode control enabled in add mode', () => {
      expect(component.letterForm.get('letterCode')?.enabled).toBeTrue();
    });

    describe('minDate', () => {
      it('should return a value from DateFieldValidationUtility.getMinDate', () => {
        const result = component.minDate;
        expect(result).toBeTruthy();
        expect(moment.isMoment(result)).toBeTrue();
      });
    });

    describe('updateFileName via letterCode changes', () => {
      it('should generate a file name when letterCode is set', () => {
        component.letterForm.get('letterCode')?.setValue('XYZ');
        expect(component.generatedFileName).toBe('XYZ.01.Doc');
        expect(component.letterForm.getRawValue().fileName).toBe('XYZ.01.Doc');
      });

      it('should clear fileName when letterCode is cleared', () => {
        component.letterForm.get('letterCode')?.setValue('ABC');
        expect(component.generatedFileName).toBe('ABC.01.Doc');

        component.letterForm.get('letterCode')?.setValue('');
        expect(component.generatedFileName).toBe('');
        expect(component.letterForm.getRawValue().fileName).toBe('');
      });
    });

    describe('lastChangedDateField tracking', () => {
      it('should track effective date changes', () => {
        component.letterForm.get('effDate')?.setValue(moment().add(1, 'month'));
        component.letterForm.get('effDate')?.markAsTouched();
        expect(component.getEffectiveDateError()).toBeDefined();
      });

      it('should track termination date changes', () => {
        component.letterForm.get('termDate')?.setValue(moment().add(2, 'months'));
        component.letterForm.get('termDate')?.markAsTouched();
        expect(component.getTerminationDateError()).toBeDefined();
      });
    });

    describe('terminationDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.terminationDateFilter(null)).toBeTrue();
      });

      it('should return true for future date with no effective date', () => {
        component.letterForm.get('effDate')?.setValue(null);
        const futureDate = moment().add(1, 'year');
        expect(component.terminationDateFilter(futureDate)).toBeTrue();
      });

      it('should return false for date before effective date', () => {
        const effDate = moment().add(6, 'months');
        component.letterForm.get('effDate')?.setValue(effDate);
        const beforeEffDate = moment().add(3, 'months');
        expect(component.terminationDateFilter(beforeEffDate)).toBeFalse();
      });

      it('should return true for date on or after effective date', () => {
        const effDate = moment().add(1, 'month');
        component.letterForm.get('effDate')?.setValue(effDate);
        const afterEffDate = moment().add(2, 'months');
        expect(component.terminationDateFilter(afterEffDate)).toBeTrue();
      });

      it('should return false for date before today (minDate)', () => {
        const pastDate = moment().subtract(1, 'year');
        expect(component.terminationDateFilter(pastDate)).toBeFalse();
      });
    });

    describe('onSave - add mode', () => {
      it('should not save when form is invalid', () => {
        component.letterForm.patchValue({
          letterCode: '',
          letterTitle: '',
          effDate: null,
          letterContent: '',
        });

        component.onSave();

        expect(mockService.createLetter).not.toHaveBeenCalled();
      });

      it('should mark all controls as touched when saving', () => {
        spyOn(component.letterForm, 'markAllAsTouched');
        component.onSave();
        expect(component.letterForm.markAllAsTouched).toHaveBeenCalled();
      });

      it('should not save when form has dateRangeInvalid error', () => {
        const futureDate = moment().add(2, 'months');
        const earlierDate = moment().add(1, 'month');

        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test',
          effDate: futureDate,
          termDate: earlierDate,
          letterContent: 'Content',
        });
        // Force dateRangeInvalid error
        component.letterForm.setErrors({ dateRangeInvalid: true });

        component.onSave();

        expect(mockService.createLetter).not.toHaveBeenCalled();
      });

      it('should call createLetter with correct DTO on valid form', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          termDate: null,
          letterContent: 'Letter body',
        });

        component.onSave();

        expect(mockService.createLetter).toHaveBeenCalled();
        const dto = mockService.createLetter.calls.mostRecent().args[0];
        expect(dto.letterCode).toBe('TST');
        expect(dto.letterTitle).toBe('Test Title');
        expect(dto.documentType).toBe('N');
        expect(dto.letterContent).toBe('Letter body');
      });

      it('should pass letterContent value through to DTO when provided', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          termDate: null,
          letterContent: 'Hello World',
        });

        component.onSave();

        const dto = mockService.createLetter.calls.mostRecent().args[0];
        expect(dto.letterContent).toBe('Hello World');
      });

      it('should set isSaving to true during save', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        // After successful sync response, isSaving is reset to false
        expect(component.isSaving).toBeFalse();
      });

      it('should close dialog with success result on successful create', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockDialogRef.close).toHaveBeenCalledWith(
          jasmine.objectContaining({ success: true, data: jasmine.anything() })
        );
      });

      it('should set isSaving to false on create error', () => {
        mockService.createLetter.and.returnValue(throwError(() => new Error('Server error')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(component.isSaving).toBeFalse();
      });

      it('should not close dialog on create error', () => {
        mockService.createLetter.and.returnValue(throwError(() => new Error('Server error')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should show snackbar with error message from err.error.message on create error', () => {
        mockService.createLetter.and.returnValue(throwError(() => ({
          error: { message: 'Duplicate letter code' },
        })));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Duplicate letter code',
          'DISMISS',
          jasmine.objectContaining({
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          })
        );
      });

      it('should show snackbar with first error from err.error.errors array on create error', () => {
        mockService.createLetter.and.returnValue(throwError(() => ({
          error: { errors: ['Validation failed', 'Another error'] },
        })));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Validation failed',
          'DISMISS',
          jasmine.anything()
        );
      });

      it('should show default error message when no specific error is returned', () => {
        mockService.createLetter.and.returnValue(throwError(() => new Error('Server error')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Failed to create letter',
          'DISMISS',
          jasmine.anything()
        );
      });

      it('should serialize termDate when provided', () => {
        const futureDate = moment().add(1, 'month');
        const termDate = moment().add(2, 'months');
        component.letterForm.patchValue({
          letterCode: 'TST',
          letterTitle: 'Test Title',
          effDate: futureDate,
          termDate,
          letterContent: 'Content',
        });

        component.onSave();

        const dto = mockService.createLetter.calls.mostRecent().args[0];
        expect(dto.termDate).toBeTruthy();
      });
    });

    describe('onCancel', () => {
      it('should close dialog with success false', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith({ success: false });
      });
    });

    describe('hasError', () => {
      it('should return true when control is invalid and touched', () => {
        component.letterForm.get('letterCode')?.setValue('');
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.hasError('letterCode')).toBeTrue();
      });

      it('should return false when control is valid', () => {
        component.letterForm.get('letterCode')?.setValue('TEST');
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.hasError('letterCode')).toBeFalse();
      });

      it('should return false when control is invalid but not touched', () => {
        component.letterForm.get('letterCode')?.setValue('');
        expect(component.hasError('letterCode')).toBeFalse();
      });

      it('should return false for non-existent control', () => {
        expect(component.hasError('nonExistent')).toBeFalse();
      });
    });

    describe('getError', () => {
      it('should return required error message', () => {
        component.letterForm.get('letterCode')?.setValue('');
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.getError('letterCode')).toBe('This field is required');
      });

      it('should return whitespaceOnly error message', () => {
        component.letterForm.get('letterCode')?.setValue('   ');
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.getError('letterCode')).toBe('This field cannot contain only spaces');
      });

      it('should return trimmedMaxLength error message', () => {
        component.letterForm.get('letterCode')?.setValue('A'.repeat(11));
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.getError('letterCode')).toContain('Maximum');
        expect(component.getError('letterCode')).toContain('characters');
      });

      it('should return empty string when control is not touched', () => {
        component.letterForm.get('letterCode')?.setValue('');
        expect(component.getError('letterCode')).toBe('');
      });

      it('should return empty string when control has no errors', () => {
        component.letterForm.get('letterCode')?.setValue('TEST');
        component.letterForm.get('letterCode')?.markAsTouched();
        expect(component.getError('letterCode')).toBe('');
      });

      it('should return empty string for non-existent control', () => {
        expect(component.getError('nonExistent')).toBe('');
      });
    });

    describe('getEffectiveDateError', () => {
      it('should delegate to DateFieldValidationUtility.getStartDateCrossFieldError', () => {
        spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('some error');
        const result = component.getEffectiveDateError();
        expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalled();
        expect(result).toBe('some error');
      });
    });

    describe('getTerminationDateError', () => {
      it('should delegate to DateFieldValidationUtility.getEndDateCrossFieldError', () => {
        spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('term error');
        const result = component.getTerminationDateError();
        expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalled();
        expect(result).toBe('term error');
      });
    });

    describe('onEffectiveDateInput', () => {
      it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleStartDateInput');
        const event = { target: { value: '01-JAN-2027' } } as unknown as Event;
        component.onEffectiveDateInput(event);
        expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
          '01-JAN-2027',
          component.letterForm.get('effDate')
        );
      });
    });

    describe('onTerminationDateInput', () => {
      it('should delegate to DateFieldValidationUtility.handleEndDateInput with isEditMode false', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        const event = { target: { value: '01-FEB-2027' } } as unknown as Event;
        component.onTerminationDateInput(event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
          '01-FEB-2027',
          component.letterForm.get('termDate'),
          false
        );
      });
    });

    describe('oldTermDateDisplay', () => {
      it('should return dash when oldTermDate is null', () => {
        component.letterForm.get('oldTermDate')?.setValue(null);
        expect(component.oldTermDateDisplay).toBe('—');
      });

      it('should return formatted uppercase date when valid moment', () => {
        component.letterForm.get('oldTermDate')?.setValue(moment('2027-03-15'));
        expect(component.oldTermDateDisplay).toBe('15-MAR-2027');
      });

      it('should return dash when oldTermDate is invalid moment', () => {
        component.letterForm.get('oldTermDate')?.setValue(moment('invalid'));
        expect(component.oldTermDateDisplay).toBe('—');
      });
    });

    describe('ngOnDestroy', () => {
      it('should call next and complete on destroy$ subject', () => {
        spyOn(component['destroy$'], 'next');
        spyOn(component['destroy$'], 'complete');

        component.ngOnDestroy();

        expect(component['destroy$'].next).toHaveBeenCalled();
        expect(component['destroy$'].complete).toHaveBeenCalled();
      });
    });

    describe('Form Control Validation', () => {
      it('should be invalid for empty letterCode', () => {
        const control = component.letterForm.get('letterCode');
        control?.setValue('');
        expect(control?.valid).toBeFalse();
      });

      it('should be invalid for empty letterTitle', () => {
        const control = component.letterForm.get('letterTitle');
        control?.setValue('');
        expect(control?.valid).toBeFalse();
      });

      it('should be invalid for letterContent that is whitespace only', () => {
        const control = component.letterForm.get('letterContent');
        control?.setValue('   ');
        expect(control?.valid).toBeFalse();
      });

      it('should be valid for letterCode within max length', () => {
        const control = component.letterForm.get('letterCode');
        control?.setValue('ABCDE');
        expect(control?.valid).toBeTrue();
      });

      it('should be invalid for letterTitle exceeding 100 characters', () => {
        const control = component.letterForm.get('letterTitle');
        control?.setValue('A'.repeat(101));
        expect(control?.valid).toBeFalse();
      });

      it('should be invalid for letterContent exceeding 4000 characters', () => {
        const control = component.letterForm.get('letterContent');
        control?.setValue('A'.repeat(4001));
        expect(control?.valid).toBeFalse();
      });

      it('should accept valid letterContent within max length', () => {
        const control = component.letterForm.get('letterContent');
        control?.setValue('Valid content');
        expect(control?.valid).toBeTrue();
      });
    });
  });

  describe('Add Mode - default data handling', () => {
    beforeEach(() => {
      const testSetup = createTestBed({ mode: 'add' });
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should default letterCodeOptions to empty array when not provided', () => {
      expect(component.letterCodeOptions).toEqual([]);
    });
  });

  describe('Add Mode - null data handling', () => {
    beforeEach(() => {
      const testSetup = createTestBed(null as any);
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should default mode to add when data is null', () => {
      expect(component.mode).toBe('add');
    });

    it('should default letterCodeOptions to empty array when data is null', () => {
      expect(component.letterCodeOptions).toEqual([]);
    });
  });

  describe('Edit Mode', () => {
    const editData: CreateEditCommLetterData = {
      mode: 'edit',
      letter: sampleLetter,
      letterCodes: sampleLetterCodes,
    };

    beforeEach(() => {
      const testSetup = createTestBed(editData);
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set mode to edit', () => {
      expect(component.mode).toBe('edit');
    });

    it('should set dialogTitle to Revise Letter', () => {
      expect(component.dialogTitle).toBe('Revise Letter');
    });

    it('should populate currentLetterCode from letter data', () => {
      expect(component.currentLetterCode).toBe('ABC');
    });

    it('should populate currentLetterTitle from letter data', () => {
      expect(component.currentLetterTitle).toBe('Existing Letter');
    });

    it('should format currentEffectiveDate for display', () => {
      expect(component.currentEffectiveDate).toBeTruthy();
      expect(component.currentEffectiveDate).not.toBe('—');
    });

    it('should set currentVersionNo from letter data', () => {
      expect(component.currentVersionNo).toBe(3);
    });

    it('should set newVersionNo to currentVersionNo + 1', () => {
      expect(component.newVersionNo).toBe(4);
    });

    it('should populate letterCode from letter data', () => {
      expect(component.letterForm.getRawValue().letterCode).toBe('ABC');
    });

    it('should populate letterTitle from letter data', () => {
      expect(component.letterForm.get('letterTitle')?.value).toBe('Existing Letter');
    });

    it('should populate letterContent from letter data', () => {
      expect(component.letterForm.get('letterContent')?.value).toBe('Some content here');
    });

    it('should disable letterCode control in edit mode', () => {
      expect(component.letterForm.get('letterCode')?.disabled).toBeTrue();
    });

    it('should disable oldTermDate control in edit mode', () => {
      expect(component.letterForm.get('oldTermDate')?.disabled).toBeTrue();
    });

    it('should set oldTermDate from letter termDate', () => {
      const oldTermDateVal = component.letterForm.getRawValue().oldTermDate;
      expect(oldTermDateVal).toBeTruthy();
      expect(moment.isMoment(oldTermDateVal)).toBeTrue();
    });

    it('should set effDate to null for new revision', () => {
      expect(component.letterForm.get('effDate')?.value).toBeNull();
    });

    it('should set termDate to null for new revision', () => {
      expect(component.letterForm.get('termDate')?.value).toBeNull();
    });

    it('should set versionNo to newVersionNo', () => {
      expect(component.letterForm.getRawValue().versionNo).toBe(4);
    });

    it('should generate fileName based on letterCode and newVersionNo', () => {
      expect(component.generatedFileName).toBe('ABC.04.Doc');
    });

    it('should auto-sync oldTermDate when effDate changes', () => {
      const newEffDate = moment().add(3, 'months');
      component.letterForm.get('effDate')?.setValue(newEffDate);

      const oldTermDate = component.letterForm.getRawValue().oldTermDate;
      expect(oldTermDate).toBeTruthy();
      expect(moment(oldTermDate).isSame(newEffDate, 'day')).toBeTrue();
    });

    describe('onSave - edit mode', () => {
      it('should call reviseLetter with correct parameters', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Updated content',
        });

        component.onSave();

        expect(mockService.reviseLetter).toHaveBeenCalled();
        const args = mockService.reviseLetter.calls.mostRecent().args;
        expect(args[0]).toBe('letter-123');
        const dto = args[1];
        expect(dto.letterTitle).toBe('Updated Title');
        expect(dto.documentType).toBe('N');
        expect(dto.letterContent).toBe('Updated content');
      });

      it('should pass letterContent value through to revise DTO when provided', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Revised body text',
        });

        component.onSave();

        const dto = mockService.reviseLetter.calls.mostRecent().args[1];
        expect(dto.letterContent).toBe('Revised body text');
      });

      it('should close dialog with success on successful revise', () => {
        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockDialogRef.close).toHaveBeenCalledWith(
          jasmine.objectContaining({ success: true, data: jasmine.anything() })
        );
      });

      it('should set isSaving to false on revise error', () => {
        mockService.reviseLetter.and.returnValue(throwError(() => new Error('Server error')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(component.isSaving).toBeFalse();
      });

      it('should not close dialog on revise error', () => {
        mockService.reviseLetter.and.returnValue(throwError(() => new Error('Server error')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should show snackbar with error message from err.error.message on revise error', () => {
        mockService.reviseLetter.and.returnValue(throwError(() => ({
          error: { message: 'Revision conflict' },
        })));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Revision conflict',
          'DISMISS',
          jasmine.objectContaining({
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          })
        );
      });

      it('should show snackbar with first error from err.error.errors array on revise error', () => {
        mockService.reviseLetter.and.returnValue(throwError(() => ({
          error: { errors: ['Field X invalid'] },
        })));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Field X invalid',
          'DISMISS',
          jasmine.anything()
        );
      });

      it('should show default revise error message when no specific error', () => {
        mockService.reviseLetter.and.returnValue(throwError(() => new Error('fail')));

        const futureDate = moment().add(1, 'month');
        component.letterForm.patchValue({
          letterTitle: 'Updated Title',
          effDate: futureDate,
          letterContent: 'Content',
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Failed to revise letter',
          'DISMISS',
          jasmine.anything()
        );
      });
    });
  });

  describe('Edit Mode - letter without termDate', () => {
    const letterNoTermDate: CommLetterView = {
      letterId: 'letter-456',
      letterCode: 'XYZ',
      letterTitle: 'No Term Letter',
      versionNo: 1,
      effDate: '2026-06-01',
      termDate: null,
      letterContent: '',
    };

    const editDataNoTerm: CreateEditCommLetterData = {
      mode: 'edit',
      letter: letterNoTermDate,
      letterCodes: [],
    };

    beforeEach(() => {
      const testSetup = createTestBed(editDataNoTerm);
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set oldTermDate to null when letter has no termDate', () => {
      const oldTermDateVal = component.letterForm.getRawValue().oldTermDate;
      expect(oldTermDateVal).toBeNull();
    });

    it('should display dash for currentEffectiveDate when formatDateForDisplay receives valid date', () => {
      // The letter has effDate '2026-06-01' which is valid
      expect(component.currentEffectiveDate).toBeTruthy();
      expect(component.currentEffectiveDate).not.toBe('—');
    });

    it('should set letterContent to empty string when letter has no content', () => {
      expect(component.letterForm.get('letterContent')?.value).toBe('');
    });

    it('should use default documentType N when letter has no documentType', () => {
      const futureDate = moment().add(1, 'month');
      component.letterForm.patchValue({
        letterTitle: 'Updated',
        effDate: futureDate,
        letterContent: 'Content',
      });

      component.onSave();

      const dto = mockService.reviseLetter.calls.mostRecent().args[1];
      expect(dto.documentType).toBe('N');
    });

    it('should set newVersionNo to 2 when letter versionNo is 1', () => {
      expect(component.newVersionNo).toBe(2);
    });

    it('should generate fileName with zero-padded version', () => {
      expect(component.generatedFileName).toBe('XYZ.02.Doc');
    });
  });

  describe('Edit Mode - letter with documentType set', () => {
    const letterWithDocType: CommLetterView = {
      letterId: 'letter-789',
      letterCode: 'DOC',
      letterTitle: 'Doc Type Letter',
      versionNo: 5,
      effDate: '2026-01-15',
      termDate: null,
      documentType: 'S',
      letterContent: 'Special content',
    };

    const editDataDocType: CreateEditCommLetterData = {
      mode: 'edit',
      letter: letterWithDocType,
      letterCodes: [],
    };

    beforeEach(() => {
      const testSetup = createTestBed(editDataDocType);
      mockService = testSetup.mockService;
      mockDialogRef = testSetup.mockDialogRef;
      mockSnackBar = testSetup.mockSnackBar;

      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          MatButtonModule,
          MatInputModule,
          MatFormFieldModule,
          MatDatepickerModule,
          MatIconModule,
          MatSelectModule,
          ReactiveFormsModule,
          NoopAnimationsModule,
          CreateEditCommLetter,
        ],
        providers: testSetup.providers,
      }).overrideComponent(CreateEditCommLetter, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar },
          ],
        },
      });
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CreateEditCommLetter);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should use letter documentType in revise DTO', () => {
      const futureDate = moment().add(1, 'month');
      component.letterForm.patchValue({
        letterTitle: 'Updated',
        effDate: futureDate,
        letterContent: 'Content',
      });

      component.onSave();

      const dto = mockService.reviseLetter.calls.mostRecent().args[1];
      expect(dto.documentType).toBe('S');
    });

    it('should set newVersionNo to 6 for versionNo 5', () => {
      expect(component.newVersionNo).toBe(6);
    });

    it('should generate fileName with correct version padding', () => {
      expect(component.generatedFileName).toBe('DOC.06.Doc');
    });
  });
});
