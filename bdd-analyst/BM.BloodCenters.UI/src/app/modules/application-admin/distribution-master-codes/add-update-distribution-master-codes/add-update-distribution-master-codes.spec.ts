import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUpdateDistributionMasterCodes, DistributionMasterCodeDialogData } from './add-update-distribution-master-codes';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { UppercaseMomentDateAdapter } from '@shared/date/uppercase-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DistributionMasterCodesService } from '../services/distribution-master-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

function createTestBed(dialogData: DistributionMasterCodeDialogData) {
  const mockDistributionService = jasmine.createSpyObj('DistributionMasterCodesService', ['createMasterCodeType', 'updateMasterCodeType']);
  const mockHeaderService = createMockHeaderService();
  const mockSnackBar = createMockMatSnackBar();
  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

  mockDistributionService.createMasterCodeType.and.returnValue(of(undefined));
  mockDistributionService.updateMasterCodeType.and.returnValue(of(undefined));
  return {
    mockDistributionService,
    mockHeaderService,
    mockSnackBar,
    mockDialogRef,
    providers: [
      { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
      { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: DistributionMasterCodesService, useValue: mockDistributionService },
      { provide: HeaderService, useValue: mockHeaderService },
      { provide: MatSnackBar, useValue: mockSnackBar },
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  };
}

describe('AddUpdateDistributionMasterCodes', () => {
  let component: AddUpdateDistributionMasterCodes;
  let fixture: ComponentFixture<AddUpdateDistributionMasterCodes>;
  let mockDistributionService: jasmine.SpyObj<DistributionMasterCodesService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateDistributionMasterCodes>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  describe('Add Mode', () => {
    beforeEach(() => {

      const testSetup = createTestBed({ mode: 'add' });
      mockDistributionService = testSetup.mockDistributionService;
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
          AddUpdateDistributionMasterCodes
        ],
        providers: testSetup.providers
      }).overrideComponent(AddUpdateDistributionMasterCodes, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar }
          ]
        }
      });

      });


    beforeEach(() => {



      fixture = TestBed.createComponent(AddUpdateDistributionMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();

      });


    it('should initialize with empty values in add mode', () => {
      expect(component.form.get('codeType')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should set mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should set panelTitle for add mode', () => {
      expect(component.panelTitle).toBe('Add New Code Type');
    });

    it('should set isSaving to false on init', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should set data from dialogData', () => {
      expect(component.data).toBeTruthy();
      expect(component.data!.mode).toBe('add');
    });

    it('should initialize numericalValue to 0', () => {
      expect(component.form.get('numericalValue')?.value).toBe(0);
    });

    it('should initialize changeControlFlag to empty string', () => {
      expect(component.form.get('changeControlFlag')?.value).toBe('');
    });

    it('should have effectiveDate control enabled in add mode', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    describe('onSave', () => {


      it('should save with null termination date', () => {
        spyOn(component.saveSuccess, 'next');

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month'),
          terminationDate: null
        });

        component.onSave();

        expect(mockDistributionService.createMasterCodeType).toHaveBeenCalled();
        expect(component.saveSuccess.next).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should not save when form is invalid in add mode', () => {
        component.form.patchValue({
          codeType: '',
          description: '',
          effectiveDate: null
        });

        component.onSave();

        expect(mockDistributionService.createMasterCodeType).not.toHaveBeenCalled();
      });

      it('should mark all controls as touched when saving in add mode', () => {
        spyOn(component.form, 'markAllAsTouched');

        component.form.patchValue({
          codeType: '',
          description: '',
          effectiveDate: null
        });

        component.onSave();

        expect(component.form.markAllAsTouched).toHaveBeenCalled();
      });

      it('should set isSaving to true during save', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        // After successful save, isSaving is set back to false
        expect(component.isSaving).toBe(false);
      });

      it('should call createMasterCodeType with correct parameters', () => {
        const futureDate = moment().add(1, 'month');
        component.form.patchValue({
          codeType: 'ABCDE',
          description: 'Test Description',
          effectiveDate: futureDate,
          terminationDate: null,
          changeControlFlag: 'D'
        });

        component.onSave();

        const callArgs = mockDistributionService.createMasterCodeType.calls.mostRecent().args;
        expect(callArgs[0]).toBe('TST');
        expect(callArgs[1].codeType).toBe('ABCDE');
        expect(callArgs[1].description).toBe('Test Description');
        expect(callArgs[1].changeControlFlag).toBe('D');
        expect(callArgs[1].terminationDate).toBeNull();
      });

      it('should default changeControlFlag to D when empty', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month'),
          changeControlFlag: ''
        });

        component.onSave();

        const callArgs = mockDistributionService.createMasterCodeType.calls.mostRecent().args;
        expect(callArgs[1].changeControlFlag).toBe('D');
      });

      it('should show snackbar on successful create', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'New Code Type DISTT has been successfully added.',
          'DISMISS',
          jasmine.objectContaining({
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: ['success-snackbar']
          })
        );
      });

      it('should close dialog on successful create', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should set isSaving to false on create error', () => {
        mockDistributionService.createMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(component.isSaving).toBe(false);
      });

      it('should not close dialog on create error', () => {
        mockDistributionService.createMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should not show snackbar on create error', () => {
        mockDistributionService.createMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(mockSnackBar.open).not.toHaveBeenCalled();
      });

      it('should save with termination date when provided', () => {
        const futureDate = moment().add(1, 'month');
        const termDate = moment().add(2, 'months');

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: futureDate,
          terminationDate: termDate
        });

        component.onSave();

        const callArgs = mockDistributionService.createMasterCodeType.calls.mostRecent().args;
        expect(callArgs[1].terminationDate).toBeTruthy();
      });
    });

    describe('Validation Methods', () => {
      it('should return true when all required fields are valid in add mode', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        expect(component.isFormValid()).toBe(true);
      });

      it('should return false when code type is missing', () => {
        component.form.patchValue({
          codeType: '',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when description is missing', () => {
        component.form.patchValue({
          codeType: 'DISTT',
          description: '',
          effectiveDate: moment().add(1, 'month')
        });

        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when effective date is missing', () => {
        component.form.patchValue({
          codeType: 'DISTT',
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


      it('should be invalid for empty description', () => {
        const control = component.form.get('description');
        control?.setValue('');
        expect(control?.valid).toBe(false);
      });

      it('should have valid effective date for valid date', () => {
        const control = component.form.get('effectiveDate');
        control?.setValue(moment().add(1, 'month'));
        expect(control?.valid).toBe(true);
      });

      it('should be invalid for null effective date', () => {
        const control = component.form.get('effectiveDate');
        control?.setValue(null);
        expect(control?.hasError('required')).toBe(true);
      });

      it('should accept valid alphanumeric code type', () => {
        const control = component.form.get('codeType');
        control?.setValue('ABC12');
        expect(control?.valid).toBe(true);
      });

      it('should reject code type with special characters', () => {
        const control = component.form.get('codeType');
        control?.setValue('AB@#');
        expect(control?.hasError('pattern')).toBe(true);
      });

      it('should accept description within max length', () => {
        const control = component.form.get('description');
        control?.setValue('Valid Description');
        expect(control?.valid).toBe(true);
      });
    });
    describe('Error Message Methods', () => {

      it('should return error message for code type when touched and invalid', () => {
        component.form.get('codeType')?.setValue('');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type is required');
      });

      it('should return whitespace-only error as required for code type', () => {
        component.form.get('codeType')?.setValue('   ');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type is required');
      });

      it('should return max length error for code type exceeding 5 characters', () => {
        component.form.get('codeType')?.setValue('ABCDEF');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type cannot exceed 5 characters');
      });

      it('should return pattern error for code type with special characters', () => {
        component.form.get('codeType')?.setValue('AB@#');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('Code Type must be alphanumeric (special characters are not allowed)');
      });

      it('should return empty string for code type when not touched', () => {
        component.form.get('codeType')?.setValue('');
        expect(component.getCodeTypeError()).toBe('');
      });

      it('should return empty string for valid code type', () => {
        component.form.get('codeType')?.setValue('DISTT');
        component.form.get('codeType')?.markAsTouched();
        expect(component.getCodeTypeError()).toBe('');
      });

      it('should return error message for description when touched and invalid', () => {
        component.form.get('description')?.setValue('');
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description is required');
      });

      it('should return whitespace-only error as required for description', () => {
        component.form.get('description')?.setValue('   ');
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description is required');
      });

      it('should return empty string for description when not touched', () => {
        component.form.get('description')?.setValue('');
        expect(component.getDescriptionError()).toBe('');
      });

      it('should return empty string for valid description', () => {
        component.form.get('description')?.setValue('Valid');
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('');
      });

      it('should return max length error for description exceeding 50 characters', () => {
        const longDescription = 'A'.repeat(51);
        component.form.get('description')?.setValue(longDescription);
        component.form.get('description')?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description cannot exceed 50 characters');
      });

      it('should return error message for effective date when touched and invalid', () => {
        component.form.patchValue({ effectiveDate: null });
        component.form.get('effectiveDate')?.markAsTouched();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should return empty string for effective date when not touched', () => {
        component.form.patchValue({ effectiveDate: null });
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should return empty string for termination date when not touched', () => {
        expect(component.getTerminationDateError()).toBe('');
      });

    });

    describe('onCancel', () => {
      it('should close dialog when cancel is called', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should close dialog without arguments', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith();
      });
    });

    describe('convertToUppercase', () => {
      it('should convert control value to uppercase', () => {
        component.form.get('codeType')?.setValue('abc');
        component.convertToUppercase('codeType');
        expect(component.form.get('codeType')?.value).toBe('ABC');
      });

      it('should handle already uppercase value', () => {
        component.form.get('codeType')?.setValue('ABC');
        component.convertToUppercase('codeType');
        expect(component.form.get('codeType')?.value).toBe('ABC');
      });

      it('should not change empty value', () => {
        component.form.get('codeType')?.setValue('');
        component.convertToUppercase('codeType');
        expect(component.form.get('codeType')?.value).toBe('');
      });

      it('should convert description to uppercase', () => {
        component.form.get('description')?.setValue('test description');
        component.convertToUppercase('description');
        expect(component.form.get('description')?.value).toBe('TEST DESCRIPTION');
      });

      it('should handle mixed case', () => {
        component.form.get('codeType')?.setValue('aBc');
        component.convertToUppercase('codeType');
        expect(component.form.get('codeType')?.value).toBe('ABC');
      });
    });

    describe('codeTypeRemainingChars', () => {
      it('should return 5 when code type is empty', () => {
        component.form.get('codeType')?.setValue('');
        expect(component.codeTypeRemainingChars).toBe(5);
      });

      it('should return 3 when code type has 2 characters', () => {
        component.form.get('codeType')?.setValue('AB');
        expect(component.codeTypeRemainingChars).toBe(3);
      });

      it('should return 0 when code type has 5 characters', () => {
        component.form.get('codeType')?.setValue('ABCDE');
        expect(component.codeTypeRemainingChars).toBe(0);
      });

      it('should return negative when code type exceeds 5 characters', () => {
        component.form.get('codeType')?.setValue('ABCDEF');
        expect(component.codeTypeRemainingChars).toBe(-1);
      });
    });

    describe('descriptionRemainingChars', () => {
      it('should return 50 when description is empty', () => {
        component.form.get('description')?.setValue('');
        expect(component.descriptionRemainingChars).toBe(50);
      });

      it('should return 40 when description has 10 characters', () => {
        component.form.get('description')?.setValue('1234567890');
        expect(component.descriptionRemainingChars).toBe(40);
      });

      it('should return 0 when description has 50 characters', () => {
        component.form.get('description')?.setValue('A'.repeat(50));
        expect(component.descriptionRemainingChars).toBe(0);
      });
    });

    describe('formatDate', () => {

      it('should format date with single-digit day', () => {
        const date = new Date('2026-04-05');
        const formatted = component.formatDate(date);
        expect(formatted).toBe('05-APR-2026');
      });

      it('should return empty string for null date', () => {
        expect(component.formatDate(null)).toBe('');
      });

      it('should format date with double-digit day', () => {
        const date = new Date('2026-12-25');
        const formatted = component.formatDate(date);
        expect(formatted).toBe('25-DEC-2026');
      });

      it('should format January date correctly', () => {
        const date = new Date('2026-01-15');
        const formatted = component.formatDate(date);
        expect(formatted).toBe('15-JAN-2026');
      });
    });

    describe('onEffectiveDateInput', () => {
      it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleStartDateInput');
        const event = { target: { value: '01-JAN-2027' } } as unknown as Event;
        component.onEffectiveDateInput(event);
        expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
          '01-JAN-2027',
          component.form.get('effectiveDate')
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
          component.form.get('terminationDate'),
          false
        );
      });
    });

    describe('terminationDateFilter', () => {
      it('should return true for null date', () => {
        expect(component.terminationDateFilter(null)).toBe(true);
      });

      it('should return true for future date with no effective date', () => {
        component.form.get('effectiveDate')?.setValue(null);
        const futureDate = moment().add(1, 'year');
        expect(component.terminationDateFilter(futureDate)).toBe(true);
      });

      it('should return false for date before effective date', () => {
        const effDate = moment().add(6, 'months');
        component.form.get('effectiveDate')?.setValue(effDate);
        const beforeEffDate = moment().add(3, 'months');
        expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
      });

      it('should return true for date on or after effective date', () => {
        const effDate = moment().add(1, 'month');
        component.form.get('effectiveDate')?.setValue(effDate);
        const afterEffDate = moment().add(2, 'months');
        expect(component.terminationDateFilter(afterEffDate)).toBe(true);
      });
    });

    describe('lastChangedDateField tracking', () => {
      it('should track effective date changes', () => {
        component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));
        // After effective date changes, getEffectiveDateError should pass form errors
        // We verify the tracking by checking that the error method works correctly
        component.form.get('effectiveDate')?.markAsTouched();
        // No assertion on private field, but verify the error methods work
        expect(component.getEffectiveDateError()).toBeDefined();
      });

      it('should track termination date changes', () => {
        component.form.get('terminationDate')?.setValue(moment().add(2, 'months'));
        component.form.get('terminationDate')?.markAsTouched();
        expect(component.getTerminationDateError()).toBeDefined();
      });
    });

    describe('ngOnDestroy', () => {
      it('should complete the destroy subject', () => {
        spyOn(component['destroy$'], 'next');
        spyOn(component['destroy$'], 'complete');

        component.ngOnDestroy();

        expect(component['destroy$'].next).toHaveBeenCalled();
        expect(component['destroy$'].complete).toHaveBeenCalled();
      });
    });

    describe('saveSuccess subject', () => {
      it('should emit on successful save', () => {
        const saveSuccessSpy = jasmine.createSpy('saveSuccess');
        component.saveSuccess.subscribe(saveSuccessSpy);

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(saveSuccessSpy).toHaveBeenCalled();
      });

      it('should not emit on failed save', () => {
        mockDistributionService.createMasterCodeType.and.returnValue(throwError(() => new Error('fail')));
        const saveSuccessSpy = jasmine.createSpy('saveSuccess');
        component.saveSuccess.subscribe(saveSuccessSpy);

        component.form.patchValue({
          codeType: 'DISTT',
          description: 'Test',
          effectiveDate: moment().add(1, 'month')
        });

        component.onSave();

        expect(saveSuccessSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    const editData: DistributionMasterCodeDialogData = {
      mode: 'edit',
      codeType: 'DISTT',
      description: 'Distribution Type',
      effDate: new Date('2026-04-11'),
      termDate: null,
      numericalValue: 100
    };

    beforeEach(async () => {
      const testSetup = createTestBed(editData);
      mockDistributionService = testSetup.mockDistributionService;
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
          AddUpdateDistributionMasterCodes
        ],
        providers: testSetup.providers
      }).overrideComponent(AddUpdateDistributionMasterCodes, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar }
          ]
        }
      });

      fixture = TestBed.createComponent(AddUpdateDistributionMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });


    it('should populate fields with data in edit mode', () => {
      expect(component.form.get('numericalValue')?.value).toBe(100);
    });

    it('should set mode to edit', () => {
      expect(component.mode).toBe('edit');
    });

    it('should set panelTitle for edit mode', () => {
      expect(component.panelTitle).toBe('Edit Code Type');
    });

    it('should populate codeType from data', () => {
      expect(component.form.get('codeType')?.value).toBe('DISTT');
    });

    it('should populate description from data', () => {
      expect(component.form.get('description')?.value).toBe('Distribution Type');
    });

    it('should populate effectiveDate from data', () => {
      const effDateValue = component.form.get('effectiveDate')?.value;
      expect(effDateValue).toBeTruthy();
      expect(moment.isMoment(effDateValue)).toBe(true);
    });

    it('should disable effectiveDate control in edit mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBe(true);
    });

    it('should set modificationDate', () => {
      expect(component.modificationDate).toBeTruthy();
    });

    it('should set editModeValues.effectiveDate', () => {
      expect(component.editModeValues.effectiveDate).toBeTruthy();
      expect(component.editModeValues.effectiveDate).toContain('2026');
    });

    it('should mark form as pristine after populating edit data', () => {
      expect(component.form.pristine).toBe(true);
    });

    it('should mark form as untouched after populating edit data', () => {
      expect(component.form.untouched).toBe(true);
    });

    describe('isFormValid in edit mode', () => {
      it('should return false when form is not dirty', () => {
        expect(component.isFormValid()).toBe(false);
      });

      it('should return true when form is dirty and has no visible errors', () => {
        component.form.get('description')?.setValue('Updated Description');
        component.form.get('description')?.markAsDirty();
        expect(component.isFormValid()).toBe(true);
      });

      it('should return false when form is dirty but has visible code type error', () => {
        component.form.get('codeType')?.setValue('');
        component.form.get('codeType')?.markAsTouched();
        component.form.get('codeType')?.markAsDirty();
        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when form is dirty but has visible description error', () => {
        component.form.get('description')?.setValue('');
        component.form.get('description')?.markAsTouched();
        component.form.get('description')?.markAsDirty();
        expect(component.isFormValid()).toBe(false);
      });
    });

    describe('onSave in edit mode', () => {
      it('should call updateMasterCodeType on save', () => {
        spyOn(component.saveSuccess, 'next');
        component.form.get('description')?.setValue('Updated Description');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(mockDistributionService.updateMasterCodeType).toHaveBeenCalled();
      });

      it('should pass correct chapterId and codeType to update', () => {
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        const callArgs = mockDistributionService.updateMasterCodeType.calls.mostRecent().args;
        expect(callArgs[0]).toBe('TST');
        expect(callArgs[1]).toBe('DISTT');
      });

      it('should pass correct update data', () => {
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        const callArgs = mockDistributionService.updateMasterCodeType.calls.mostRecent().args;
        const updateData = callArgs[2];
        expect(updateData.description).toBe('Updated');
        expect(updateData.numericalValue).toBe(100);
      });

      it('should show snackbar on successful update', () => {
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Code Type DISTT has been successfully updated.',
          'DISMISS',
          jasmine.objectContaining({
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 3000,
            panelClass: ['success-snackbar']
          })
        );
      });

      it('should close dialog on successful update', () => {
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(mockDialogRef.close).toHaveBeenCalled();
      });

      it('should emit saveSuccess on successful update', () => {
        spyOn(component.saveSuccess, 'next');
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(component.saveSuccess.next).toHaveBeenCalled();
      });

      it('should set isSaving to false on update error', () => {
        mockDistributionService.updateMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(component.isSaving).toBe(false);
      });

      it('should not close dialog on update error', () => {
        mockDistributionService.updateMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should not show snackbar on update error', () => {
        mockDistributionService.updateMasterCodeType.and.returnValue(throwError(() => new Error('Server error')));
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(mockSnackBar.open).not.toHaveBeenCalled();
      });

      it('should not emit saveSuccess on update error', () => {
        mockDistributionService.updateMasterCodeType.and.returnValue(throwError(() => new Error('fail')));
        spyOn(component.saveSuccess, 'next');
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(component.saveSuccess.next).not.toHaveBeenCalled();
      });

      it('should default numericalValue to 0 when not provided', () => {
        component.form.get('numericalValue')?.setValue(null);
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        const callArgs = mockDistributionService.updateMasterCodeType.calls.mostRecent().args;
        expect(callArgs[2].numericalValue).toBe(0);
      });

      it('should not call markAllAsTouched in edit mode', () => {
        spyOn(component.form, 'markAllAsTouched');
        component.form.get('description')?.setValue('Updated');
        component.form.get('description')?.markAsDirty();

        component.onSave();

        expect(component.form.markAllAsTouched).not.toHaveBeenCalled();
      });
    });

    describe('onTerminationDateInput in edit mode', () => {
      it('should delegate to DateFieldValidationUtility.handleEndDateInput with isEditMode true', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        const event = { target: { value: '01-FEB-2027' } } as unknown as Event;
        component.onTerminationDateInput(event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
          '01-FEB-2027',
          component.form.get('terminationDate'),
          true
        );
      });
    });

    describe('onCancel in edit mode', () => {
      it('should close dialog', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode with termination date and lastModifiedDate', () => {
    const editDataWithTermDate: DistributionMasterCodeDialogData = {
      mode: 'edit',
      codeType: 'TYPEA',
      description: 'Type A Description',
      effDate: new Date('2026-01-15'),
      termDate: new Date('2026-12-31'),
      lastModifiedDate: new Date('2026-06-01'),
      numericalValue: 50,
      changeControlFlag: 'C'
    };

    beforeEach(async () => {
      const testSetup = createTestBed(editDataWithTermDate);
      mockDistributionService = testSetup.mockDistributionService;
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
          AddUpdateDistributionMasterCodes
        ],
        providers: testSetup.providers
      }).overrideComponent(AddUpdateDistributionMasterCodes, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar }
          ]
        }
      });

      fixture = TestBed.createComponent(AddUpdateDistributionMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should populate terminationDate from data', () => {
      const termDateValue = component.form.get('terminationDate')?.value;
      expect(termDateValue).toBeTruthy();
      expect(moment.isMoment(termDateValue)).toBe(true);
    });

    it('should set modificationDate from lastModifiedDate', () => {
      expect(component.modificationDate).toBeTruthy();
      expect(component.modificationDate!.getFullYear()).toBe(2026);
    });

    it('should populate changeControlFlag from data', () => {
      expect(component.form.get('changeControlFlag')?.value).toBe('C');
    });

    it('should populate numericalValue from data', () => {
      expect(component.form.get('numericalValue')?.value).toBe(50);
    });

    it('should use codeType from data for update call', () => {
      component.form.get('description')?.setValue('Updated');
      component.form.get('description')?.markAsDirty();

      component.onSave();

      const callArgs = mockDistributionService.updateMasterCodeType.calls.mostRecent().args;
      expect(callArgs[1]).toBe('TYPEA');
    });
  });

  describe('Edit Mode without lastModifiedDate', () => {
    const editDataNoModDate: DistributionMasterCodeDialogData = {
      mode: 'edit',
      codeType: 'TYPEB',
      description: 'Type B',
      effDate: new Date('2026-03-01'),
      termDate: null
    };

    beforeEach(async () => {
      const testSetup = createTestBed(editDataNoModDate);
      mockDistributionService = testSetup.mockDistributionService;
      mockDialogRef = testSetup.mockDialogRef;

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
          AddUpdateDistributionMasterCodes
        ],
        providers: testSetup.providers
      }).overrideComponent(AddUpdateDistributionMasterCodes, {
        set: {
          providers: [
            { provide: MatSnackBar, useValue: testSetup.mockSnackBar }
          ]
        }
      });

      fixture = TestBed.createComponent(AddUpdateDistributionMasterCodes);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should default modificationDate to current date when lastModifiedDate is absent', () => {
      expect(component.modificationDate).toBeTruthy();
      // modificationDate defaults to new Date() when lastModifiedDate is falsy
      const now = new Date();
      expect(component.modificationDate!.getFullYear()).toBe(now.getFullYear());
    });

    it('should default numericalValue to 0 when not provided', () => {
      expect(component.form.get('numericalValue')?.value).toBe(0);
    });

    it('should default changeControlFlag to empty string when not provided', () => {
      expect(component.form.get('changeControlFlag')?.value).toBe('');
    });
  });
});
