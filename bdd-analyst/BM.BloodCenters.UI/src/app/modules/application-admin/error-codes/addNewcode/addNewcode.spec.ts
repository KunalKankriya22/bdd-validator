import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AddNewCode, CodeDialogData } from './addNewcode';
import { ErrorCodeFacadeService } from '../services/error-code-facade.service';
import { ErrorType, AuditFlag, TabType } from '../models/error-code.model';

describe('AddNewCode', () => {
  let component: AddNewCode;
  let fixture: ComponentFixture<AddNewCode>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddNewCode>>;
  let mockFacadeService: jasmine.SpyObj<ErrorCodeFacadeService>;

  const addModeData: CodeDialogData = { mode: 'add', tabType: TabType.DONOR };
  const editModeData: CodeDialogData = {
    mode: 'edit',
    tabType: TabType.DONOR,
    errorCode: '0001',
    errorType: ErrorType.SHOW_MESSAGE_ONLY,
    error: 'Test description',
    auditFlag: AuditFlag.YES
  };

  function createComponent(dialogData: CodeDialogData) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockFacadeService = jasmine.createSpyObj('ErrorCodeFacadeService', [
      'createErrorCode',
      'updateErrorCode'
    ]);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AddNewCode, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: ErrorCodeFacadeService, useValue: mockFacadeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddNewCode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await createComponent(addModeData);
  });

  // -------------------------------------------------------
  // Creation & Initialization
  // -------------------------------------------------------
  describe('Creation', () => {



    it('should initialize with empty fields in add mode', () => {
      expect(component.errorCode).toBe('');
      expect(component.selectedErrorType).toBeNull();
      expect(component.description).toBe('');
      expect(component.enableForAudit).toBe(false);
    });

    it('should populate fields from data in edit mode', async () => {
      await createComponent(editModeData);
      expect(component.errorCode).toBe('0001');
      expect(component.selectedErrorType).toBe(ErrorType.SHOW_MESSAGE_ONLY);
      expect(component.description).toBe('Test description');
      expect(component.enableForAudit).toBe(true);
    });


    it('should initialize filteredTypeOptions with all type options on ngOnInit', () => {
      expect(component.filteredTypeOptions.length).toBe(6);
    });

    it('should initialize validation touched flags to false in add mode', () => {
      expect(component.errorCodeTouched).toBe(false);
      expect(component.errorTypeTouched).toBe(false);
      expect(component.descriptionTouched).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Tab helpers
  // -------------------------------------------------------
  describe('Tab helpers', () => {
    it('isDonorTab should return true when tabType is DONOR', () => {
      expect(component.isDonorTab()).toBe(true);
    });

    it('isDonorTab should return false when tabType is LAB', async () => {
      await createComponent({ mode: 'add', tabType: TabType.LAB });
      expect(component.isDonorTab()).toBe(false);
    });

    it('isLabTab should return true when tabType is LAB', async () => {
      await createComponent({ mode: 'add', tabType: TabType.LAB });
      expect(component.isLabTab()).toBe(true);
    });

    it('isLabTab should return false for DONOR tab', () => {
      expect(component.isLabTab()).toBe(false);
    });

    it('isDistributionTab should return true when tabType is DISTRIBUTION', async () => {
      await createComponent({ mode: 'add', tabType: TabType.DISTRIBUTION });
      expect(component.isDistributionTab()).toBe(true);
    });

    it('isDistributionTab should return false for DONOR tab', () => {
      expect(component.isDistributionTab()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // onCancel
  // -------------------------------------------------------
  // -------------------------------------------------------
  // isErrorCodeValid
  // -------------------------------------------------------
  describe('isErrorCodeValid', () => {
    it('should return false for empty errorCode', () => {
      component.errorCode = '';
      expect(component.isErrorCodeValid()).toBe(false);
    });

    it('should return false for non-numeric errorCode', () => {
      component.errorCode = 'abc';
      expect(component.isErrorCodeValid()).toBe(false);
    });

    it('should return true for valid donor errorCode (5 digits)', () => {
      component.errorCode = '12345';
      expect(component.isErrorCodeValid()).toBe(true);
    });

    it('should return false for donor errorCode exceeding 99999', () => {
      component.errorCode = '100000';
      expect(component.isErrorCodeValid()).toBe(false);
    });

    it('should return true for valid lab errorCode (4 digits)', async () => {
      await createComponent({ mode: 'add', tabType: TabType.LAB });
      component.errorCode = '9999';
      expect(component.isErrorCodeValid()).toBe(true);
    });

    it('should return false for lab errorCode exceeding 9999', async () => {
      await createComponent({ mode: 'add', tabType: TabType.LAB });
      component.errorCode = '10000';
      expect(component.isErrorCodeValid()).toBe(false);
    });

    it('should return true for valid distribution errorCode', async () => {
      await createComponent({ mode: 'add', tabType: TabType.DISTRIBUTION });
      component.errorCode = '0001';
      expect(component.isErrorCodeValid()).toBe(true);
    });

    it('should return true for errorCode 0', () => {
      component.errorCode = '0';
      expect(component.isErrorCodeValid()).toBe(true);
    });

    it('should return false for errorCode with spaces', () => {
      component.errorCode = '  ';
      expect(component.isErrorCodeValid()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // isErrorTypeValid
  // -------------------------------------------------------
  describe('isErrorTypeValid', () => {
    it('should return false when selectedErrorType is null', () => {
      component.selectedErrorType = null;
      expect(component.isErrorTypeValid()).toBe(false);
    });

    it('should return true when selectedErrorType is set', () => {
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      expect(component.isErrorTypeValid()).toBe(true);
    });

    it('should return true for all error types', () => {
      const types = [
        ErrorType.SHOW_MESSAGE_ONLY,
        ErrorType.SHOW_MESSAGE_AND_STOP,
        ErrorType.SHOW_WARNING_ONLY,
        ErrorType.SHOW_WARNING_AND_STOP,
        ErrorType.SHOW_ERROR_ONLY,
        ErrorType.SHOW_ERROR_AND_STOP
      ];
      types.forEach(type => {
        component.selectedErrorType = type;
        expect(component.isErrorTypeValid()).toBe(true);
      });
    });
  });

  // -------------------------------------------------------
  // isDescriptionValid
  // -------------------------------------------------------
  describe('isDescriptionValid', () => {
    it('should return false for empty description', () => {
      component.description = '';
      expect(component.isDescriptionValid()).toBe(false);
    });

    it('should return false for whitespace-only description', () => {
      component.description = '   ';
      expect(component.isDescriptionValid()).toBe(false);
    });

    it('should return true for valid description', () => {
      component.description = 'Valid description';
      expect(component.isDescriptionValid()).toBe(true);
    });

    it('should return true for exactly 70 characters', () => {
      component.description = 'a'.repeat(70);
      expect(component.isDescriptionValid()).toBe(true);
    });

    it('should return false for description exceeding 70 characters', () => {
      component.description = 'a'.repeat(71);
      expect(component.isDescriptionValid()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // isFormValid
  // -------------------------------------------------------
  describe('isFormValid', () => {
    it('should return false when form is incomplete', () => {
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true when all fields are valid', () => {
      component.errorCode = '0001';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = 'Valid description';
      expect(component.isFormValid()).toBe(true);
    });

    it('should return false when errorCode is invalid', () => {
      component.errorCode = '';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = 'Valid description';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when errorType is null', () => {
      component.errorCode = '0001';
      component.selectedErrorType = null;
      component.description = 'Valid description';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when description is empty', () => {
      component.errorCode = '0001';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = '';
      expect(component.isFormValid()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // hasChanges (edit mode)
  // -------------------------------------------------------
  describe('hasChanges', () => {
    beforeEach(async () => {
      await createComponent(editModeData);
    });

    it('should return false when nothing has changed', () => {
      expect(component.hasChanges()).toBe(false);
    });

    it('should return true when errorType changes', () => {
      component.selectedErrorType = ErrorType.SHOW_WARNING_ONLY;
      expect(component.hasChanges()).toBe(true);
    });

    it('should return true when description changes', () => {
      component.description = 'New description';
      expect(component.hasChanges()).toBe(true);
    });

    it('should return true when enableForAudit changes', () => {
      component.enableForAudit = false;
      expect(component.hasChanges()).toBe(true);
    });

    it('should return false when description has same trimmed value', () => {
      component.description = 'Test description '; // trailing space
      expect(component.hasChanges()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // getErrorCodeError
  // -------------------------------------------------------
  describe('getErrorCodeError', () => {

    it('should return required message when code is empty and touched', () => {
      component.errorCodeTouched = true;
      component.errorCode = '';
      expect(component.getErrorCodeError()).toBe('Code is required');
    });

    it('should return numeric message for non-numeric code', () => {
      component.errorCodeTouched = true;
      component.errorCode = 'abc';
      expect(component.getErrorCodeError()).toBe('Error code must be numeric');
    });

    it('should return range message for donor code > 99999', () => {
      component.errorCodeTouched = true;
      component.errorCode = '100000';
      expect(component.getErrorCodeError()).toBe('Error code must be between 00000 and 99999');
    });

    it('should return range message for lab code > 9999', async () => {
      await createComponent({ mode: 'add', tabType: TabType.LAB });
      component.errorCodeTouched = true;
      component.errorCode = '10000';
      expect(component.getErrorCodeError()).toBe('Error code must be between 0000 and 9999');
    });

  });

  // -------------------------------------------------------
  // getErrorTypeError
  // -------------------------------------------------------
  describe('getErrorTypeError', () => {

    it('should return required message when type is null and touched', () => {
      component.errorTypeTouched = true;
      component.selectedErrorType = null;
      expect(component.getErrorTypeError()).toBe('Type is required');
    });

  });

  // -------------------------------------------------------
  // getDescriptionError
  // -------------------------------------------------------
  describe('getDescriptionError', () => {

    it('should return required message when description is empty and touched', () => {
      component.descriptionTouched = true;
      component.description = '';
      expect(component.getDescriptionError()).toBe('Description is required');
    });

    it('should return length message when description exceeds 70 chars', () => {
      component.descriptionTouched = true;
      component.description = 'a'.repeat(71);
      expect(component.getDescriptionError()).toBe('Description must be 70 characters or less');
    });

  });

  // -------------------------------------------------------
  // Computed error state getters
  // -------------------------------------------------------
  describe('hasErrorCodeError', () => {
    it('should return false when not touched', () => {
      component.errorCodeTouched = false;
      expect(component.hasErrorCodeError).toBe(false);
    });

    it('should return true when touched and invalid', () => {
      component.errorCodeTouched = true;
      component.errorCode = '';
      expect(component.hasErrorCodeError).toBe(true);
    });

    it('should return false when touched and valid', () => {
      component.errorCodeTouched = true;
      component.errorCode = '0001';
      expect(component.hasErrorCodeError).toBe(false);
    });
  });

  describe('hasErrorTypeError', () => {
    it('should return false when not touched', () => {
      component.errorTypeTouched = false;
      expect(component.hasErrorTypeError).toBe(false);
    });

    it('should return true when touched and no type selected', () => {
      component.errorTypeTouched = true;
      component.selectedErrorType = null;
      expect(component.hasErrorTypeError).toBe(true);
    });

    it('should return false when touched and type is selected', () => {
      component.errorTypeTouched = true;
      component.selectedErrorType = ErrorType.SHOW_ERROR_ONLY;
      expect(component.hasErrorTypeError).toBe(false);
    });
  });

  describe('hasDescriptionError', () => {
    it('should return false when not touched', () => {
      component.descriptionTouched = false;
      expect(component.hasDescriptionError).toBe(false);
    });

    it('should return true when touched and description is empty', () => {
      component.descriptionTouched = true;
      component.description = '';
      expect(component.hasDescriptionError).toBe(true);
    });

    it('should return false when touched and description is valid', () => {
      component.descriptionTouched = true;
      component.description = 'A valid description';
      expect(component.hasDescriptionError).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Event handlers (touch marking)
  // -------------------------------------------------------
  describe('Event handlers', () => {
    it('onErrorCodeBlur should mark errorCodeTouched as true', () => {
      component.errorCodeTouched = false;
      component.onErrorCodeBlur();
      expect(component.errorCodeTouched).toBe(true);
    });

    it('onErrorCodeInput should mark errorCodeTouched as true', () => {
      component.errorCodeTouched = false;
      component.onErrorCodeInput({ target: { value: '1234' } } as unknown as Event);
      expect(component.errorCodeTouched).toBe(true);
    });

    it('onErrorTypeChange should mark errorTypeTouched as true', () => {
      component.errorTypeTouched = false;
      component.onErrorTypeChange();
      expect(component.errorTypeTouched).toBe(true);
    });

    it('onErrorTypeOpenedChange should mark errorTypeTouched when dropdown closes', () => {
      component.errorTypeTouched = false;
      component.onErrorTypeOpenedChange(false);
      expect(component.errorTypeTouched).toBe(true);
    });

    it('onErrorTypeOpenedChange should not mark errorTypeTouched when dropdown opens', () => {
      component.errorTypeTouched = false;
      component.onErrorTypeOpenedChange(true);
      expect(component.errorTypeTouched).toBe(false);
    });

    it('onDescriptionBlur should mark descriptionTouched as true', () => {
      component.descriptionTouched = false;
      component.onDescriptionBlur();
      expect(component.descriptionTouched).toBe(true);
    });

    it('onDescriptionInput should mark descriptionTouched as true', () => {
      component.descriptionTouched = false;
      component.onDescriptionInput();
      expect(component.descriptionTouched).toBe(true);
    });
  });

  // -------------------------------------------------------
  // formatErrorCode
  // -------------------------------------------------------
  describe('formatErrorCode', () => {
    it('should pad single digit to 4 digits', () => {
      component.errorCode = '5';
      component.formatErrorCode();
      expect(component.errorCode).toBe('0005');
    });

    it('should pad two digits to 4 digits', () => {
      component.errorCode = '25';
      component.formatErrorCode();
      expect(component.errorCode).toBe('0025');
    });

    it('should not change 5-digit code', () => {
      component.errorCode = '12345';
      component.formatErrorCode();
      expect(component.errorCode).toBe('12345');
    });

    it('should not change already 4-digit code', () => {
      component.errorCode = '0001';
      component.formatErrorCode();
      expect(component.errorCode).toBe('0001');
    });

    it('should not change empty code', () => {
      component.errorCode = '';
      component.formatErrorCode();
      expect(component.errorCode).toBe('');
    });

    it('should not change non-numeric code', () => {
      component.errorCode = 'abc';
      component.formatErrorCode();
      expect(component.errorCode).toBe('abc');
    });
  });

  // -------------------------------------------------------
  // Search filter for type options
  // -------------------------------------------------------
  describe('typeSearchControl filtering', () => {
    it('should filter type options based on search term', fakeAsync(() => {
      component.errorTypeSearchControl.setValue('warning');
      tick(0);
      expect(component.filteredTypeOptions.every(o => o.label.toLowerCase().includes('warning'))).toBe(true);
    }));


    it('should be case-insensitive when filtering', fakeAsync(() => {
      component.errorTypeSearchControl.setValue('MESSAGE');
      tick(0);
      expect(component.filteredTypeOptions.every(o => o.label.toLowerCase().includes('message'))).toBe(true);
    }));

  });

  // -------------------------------------------------------
  // onSave - add mode
  // -------------------------------------------------------
  describe('onSave (add mode)', () => {
    it('should mark all fields as touched on save attempt', () => {
      component.onSave();
      expect(component.errorCodeTouched).toBe(true);
      expect(component.errorTypeTouched).toBe(true);
      expect(component.descriptionTouched).toBe(true);
    });


    it('should call createErrorCode when form is valid in add mode', fakeAsync(() => {
      mockFacadeService.createErrorCode.and.returnValue(of(undefined));

      component.errorCode = '0001';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = 'Test description';
      component.enableForAudit = true;

      component.onSave();
      tick();

      expect(mockFacadeService.createErrorCode).toHaveBeenCalledWith({
        errorCode: '0001',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        error: 'Test description',
        auditFlag: AuditFlag.YES
      });
    }));



    it('should reset isSaving to false after error', fakeAsync(() => {
      mockFacadeService.createErrorCode.and.returnValue(throwError(() => new Error('API error')));

      component.errorCode = '0001';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = 'Test description';

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));


    it('should trim errorCode and description before sending', fakeAsync(() => {
      mockFacadeService.createErrorCode.and.returnValue(of(undefined));

      component.errorCode = '  0001  ';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = '  Test description  ';

      component.onSave();
      tick();

      expect(mockFacadeService.createErrorCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          errorCode: '0001',
          error: 'Test description'
        })
      );
    }));

    it('should send AuditFlag.NO when enableForAudit is false', fakeAsync(() => {
      mockFacadeService.createErrorCode.and.returnValue(of(undefined));

      component.errorCode = '0001';
      component.selectedErrorType = ErrorType.SHOW_MESSAGE_ONLY;
      component.description = 'Test description';
      component.enableForAudit = false;

      component.onSave();
      tick();

      expect(mockFacadeService.createErrorCode).toHaveBeenCalledWith(
        jasmine.objectContaining({ auditFlag: AuditFlag.NO })
      );
    }));
  });

  // -------------------------------------------------------
  // onSave - edit mode
  // -------------------------------------------------------
  describe('onSave (edit mode)', () => {
    beforeEach(async () => {
      await createComponent(editModeData);
    });

    it('should call updateErrorCode when form is valid in edit mode', fakeAsync(() => {
      mockFacadeService.updateErrorCode.and.returnValue(of(undefined));

      component.selectedErrorType = ErrorType.SHOW_WARNING_ONLY;
      component.description = 'Updated description';

      component.onSave();
      tick();

      expect(mockFacadeService.updateErrorCode).toHaveBeenCalledWith('0001',
        jasmine.objectContaining({
          errorType: ErrorType.SHOW_WARNING_ONLY,
          error: 'Updated description'
        })
      );
    }));



    it('should reset isSaving to false after update error', fakeAsync(() => {
      mockFacadeService.updateErrorCode.and.returnValue(throwError(() => new Error('Update failed')));

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

  });

  // -------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------
});
