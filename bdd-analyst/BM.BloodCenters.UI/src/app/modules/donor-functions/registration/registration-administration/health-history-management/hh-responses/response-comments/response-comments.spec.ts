import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ResponseComments } from './response-comments';
import { HealthHistoryService } from '../../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHResponseCommentContext, HHResponseCommentModel } from '../../models/health-history.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('ResponseComments', () => {
  let component: ResponseComments;
  let fixture: ComponentFixture<ResponseComments>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ResponseComments>>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceMock: Partial<HeaderService>;

  const mockContext: HHResponseCommentContext = {
    questionCode: 'Q001',
    answerCode: 'A001',
    response: 'Y'
  };

  const mockComments: HHResponseCommentModel[] = [
    { commentCode: 'C01', commentDet: 'First comment', effDate: '2026-01-01T00:00:00Z', termDate: '2026-12-31T00:00:00Z' },
    { commentCode: 'C02', commentDet: 'Second comment', effDate: '2026-02-01T00:00:00Z' }
  ];

  /** Returns a future date guaranteed to pass effectiveDateNotPastValidator */
  function futureDate(): moment.Moment {
    return moment().add(5, 'days');
  }

  /**
   * Fills the newCommentForm with valid values so the form passes all validators.
   * Uses a future effDate and a unique comment code.
   */
  function fillValidForm(code = 'NEW'): void {
    component.newCommentForm.get('commentCode')?.setValue(code);
    component.newCommentForm.get('commentDet')?.setValue('Valid comment text');
    component.newCommentForm.get('effDate')?.setValue(futureDate());
  }

  beforeEach(() => {
    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'getResponseComments',
      'createResponseComment',
      'updateResponseComment'
    ]);
    hhServiceSpy.getResponseComments.and.returnValue(of(mockComments));
    hhServiceSpy.createResponseComment.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null }));
    hhServiceSpy.updateResponseComment.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null }));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarSpy = createMockMatSnackBar();

    headerServiceMock = {
      chapterTimeZone: signal('-06:00')
    } as any;

    TestBed.configureTestingModule({
      imports: [ResponseComments, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockContext },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(ResponseComments);
    component = fixture.componentInstance;
    // Override the snackBar injected via standalone component environment injector
    // so our spy is used instead of the real MatSnackBar from MatSnackBarModule.
    (component as any).snackBar = snackBarSpy;
    fixture.detectChanges();
    // Reset call counts after detectChanges (ngOnInit may have triggered calls)
    snackBarSpy.open.calls.reset();
    dialogRefSpy.close.calls.reset();
  });

  afterEach(() => {
    // Ensure component teardown to avoid state leaks between tests
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load comments on init', () => {
      expect(hhServiceSpy.getResponseComments).toHaveBeenCalledWith('Q001', 'A001', 'Y');
      expect(component.comments.length).toBe(2);
    });

    it('should initialize context from MAT_DIALOG_DATA', () => {
      expect(component.context).toEqual(mockContext);
    });

    it('should initialize newCommentForm with proper controls', () => {
      expect(component.newCommentForm).toBeTruthy();
      expect(component.newCommentForm.get('commentCode')).toBeTruthy();
      expect(component.newCommentForm.get('commentDet')).toBeTruthy();
      expect(component.newCommentForm.get('effDate')).toBeTruthy();
      expect(component.newCommentForm.get('termDate')).toBeTruthy();
    });

    it('should set isAddingNew to false initially', () => {
      expect(component.isAddingNew).toBe(false);
    });

    it('should set isSaving to false initially', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize minDate', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });
  });

  describe('form validations', () => {
    it('should require commentCode', () => {
      const ctrl = component.newCommentForm.get('commentCode');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on commentCode (5 chars)', () => {
      const ctrl = component.newCommentForm.get('commentCode');
      ctrl?.setValue('ABCDEF');
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid commentCode within maxLength', () => {
      const ctrl = component.newCommentForm.get('commentCode');
      ctrl?.setValue('AB');
      expect(ctrl?.hasError('maxlength')).toBeFalse();
      expect(ctrl?.hasError('required')).toBeFalse();
    });

    it('should require commentDet', () => {
      const ctrl = component.newCommentForm.get('commentDet');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on commentDet (240 chars)', () => {
      const ctrl = component.newCommentForm.get('commentDet');
      ctrl?.setValue('A'.repeat(241));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should require effDate', () => {
      const ctrl = component.newCommentForm.get('effDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should not require termDate', () => {
      const ctrl = component.newCommentForm.get('termDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeFalsy();
    });
  });

  describe('onAddNewComment', () => {
    it('should set isAddingNew to true', () => {
      component.onAddNewComment();
      expect(component.isAddingNew).toBe(true);
    });

    it('should reset the form', () => {
      component.newCommentForm.get('commentCode')?.setValue('TEST');
      component.onAddNewComment();
      expect(component.newCommentForm.get('commentCode')?.value).toBeFalsy();
    });

    it('should mark form as untouched', () => {
      component.newCommentForm.markAllAsTouched();
      component.onAddNewComment();
      expect(component.newCommentForm.untouched).toBeTrue();
    });
  });

  describe('onCommentCodeInput', () => {
    it('should uppercase the value and set it', () => {
      const event = { target: { value: 'abc' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.value).toBe('ABC');
    });

    it('should detect duplicate comment codes', () => {
      const event = { target: { value: 'C01' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeTrue();
    });

    it('should not flag unique comment codes as duplicate', () => {
      const event = { target: { value: 'NEW' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeFalsy();
    });

    it('should handle case-insensitive duplicate detection', () => {
      const event = { target: { value: 'c01' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeTrue();
    });
  });

  describe('validateCommentCodeUniqueness (private, tested via onCommentCodeInput)', () => {
    it('should remove duplicateCommentCode error when code becomes unique', () => {
      let event = { target: { value: 'C01' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeTrue();

      event = { target: { value: 'XYZ' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeFalsy();
    });

    it('should preserve other errors when removing duplicateCommentCode', () => {
      const ctrl = component.newCommentForm.get('commentCode');
      ctrl?.setValue('ABCDEF');
      const event = { target: { value: 'XY' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(ctrl?.hasError('duplicateCommentCode')).toBeFalsy();
    });

    it('should not set error when code is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onCommentCodeInput(event);
      expect(component.newCommentForm.get('commentCode')?.hasError('duplicateCommentCode')).toBeFalsy();
    });
  });

  describe('onExistingTermDateChange', () => {
    it('should store pending term date', () => {
      const dateMoment = moment('2026-06-15');
      component.onExistingTermDateChange(mockComments[0], dateMoment);
      expect(component.pendingTermDates.has('C01')).toBeTrue();
      expect(component.pendingTermDates.get('C01')).toBe('2026-06-15T00:00:00Z');
    });

    it('should not store when commentCode is missing', () => {
      const comment: HHResponseCommentModel = { commentDet: 'test', effDate: '2026-01-01' };
      component.onExistingTermDateChange(comment, moment('2026-06-15'));
      expect(component.pendingTermDates.size).toBe(0);
    });

    it('should not store when event is null', () => {
      component.onExistingTermDateChange(mockComments[0], null);
      expect(component.pendingTermDates.size).toBe(0);
    });
  });

  describe('onCommentTextChange', () => {
    it('should store pending comment edit', () => {
      const event = { target: { value: 'Updated text' } } as unknown as Event;
      component.onCommentTextChange(mockComments[0], event);
      expect(component.pendingCommentEdits.has('C01')).toBeTrue();
      expect(component.pendingCommentEdits.get('C01')).toBe('Updated text');
    });

    it('should not store when commentCode is missing', () => {
      const comment: HHResponseCommentModel = { commentDet: 'test', effDate: '2026-01-01' };
      const event = { target: { value: 'Updated' } } as unknown as Event;
      component.onCommentTextChange(comment, event);
      expect(component.pendingCommentEdits.size).toBe(0);
    });
  });

  describe('getCommentValue', () => {
    it('should return pending edit value when exists', () => {
      component.pendingCommentEdits.set('C01', 'Edited value');
      expect(component.getCommentValue(mockComments[0])).toBe('Edited value');
    });

    it('should return original commentDet when no pending edit', () => {
      expect(component.getCommentValue(mockComments[0])).toBe('First comment');
    });

    it('should return empty string when no commentDet and no pending edit', () => {
      const comment: HHResponseCommentModel = { commentCode: 'C99', commentDet: '', effDate: '2026-01-01' };
      expect(component.getCommentValue(comment)).toBe('');
    });

    it('should return empty string when pending edit is empty', () => {
      component.pendingCommentEdits.set('C01', '');
      expect(component.getCommentValue(mockComments[0])).toBe('');
    });
  });

  describe('isFormValid', () => {
    it('should return false when not adding new and no pending changes', () => {
      component.isAddingNew = false;
      component.pendingTermDates.clear();
      component.pendingCommentEdits.clear();
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when not adding new but has pending term dates', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      expect(component.isFormValid).toBe(true);
    });

    it('should return true when not adding new but has pending comment edits', () => {
      component.isAddingNew = false;
      component.pendingCommentEdits.set('C01', 'edited');
      expect(component.isFormValid).toBe(true);
    });

    it('should return true when adding new and form is valid', () => {
      component.isAddingNew = true;
      fillValidForm();
      expect(component.isFormValid).toBe(true);
    });

    it('should return false when adding new and form is invalid', () => {
      component.isAddingNew = true;
      component.newCommentForm.get('commentCode')?.setValue('');
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('hasPendingChanges', () => {
    it('should return false when no pending changes and not adding new', () => {
      component.isAddingNew = false;
      component.pendingTermDates.clear();
      component.pendingCommentEdits.clear();
      expect(component.hasPendingChanges).toBe(false);
    });

    it('should return true when adding new', () => {
      component.isAddingNew = true;
      expect(component.hasPendingChanges).toBe(true);
    });

    it('should return true when has pending term dates', () => {
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      expect(component.hasPendingChanges).toBe(true);
    });

    it('should return true when has pending comment edits', () => {
      component.pendingCommentEdits.set('C01', 'edited');
      expect(component.hasPendingChanges).toBe(true);
    });
  });

  describe('termMinDate', () => {
    it('should return minDate when effDate is null', () => {
      component.newCommentForm.get('effDate')?.setValue(null);
      expect(component.termMinDate).toEqual(component.minDate);
    });

    it('should return effDate when effDate is after minDate', () => {
      const future = moment().add(30, 'days');
      component.newCommentForm.get('effDate')?.setValue(future);
      expect(component.termMinDate.isSame(future)).toBeTrue();
    });

    it('should return minDate when effDate is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.newCommentForm.get('effDate')?.setValue(pastDate);
      expect(component.termMinDate.isSame(component.minDate)).toBeTrue();
    });

    it('should return minDate when effDate is not a valid moment', () => {
      // Set a non-moment value
      component.newCommentForm.get('effDate')?.setValue(12345);
      expect(component.termMinDate).toEqual(component.minDate);
    });
  });

  describe('onCancel', () => {
    it('should close the dialog', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const result = component.formatDate('2026-01-15T00:00:00Z');
      expect(result).toBe('15-JAN-2026');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });
  });

  describe('parseDate', () => {
    it('should return a moment object', () => {
      const result = component.parseDate('2026-01-15');
      expect(moment.isMoment(result)).toBeTrue();
      expect(result.isValid()).toBeTrue();
    });
  });

  describe('getEffDateError', () => {
    let origStart: typeof DateFieldValidationUtility.getStartDateCrossFieldError;

    beforeEach(() => {
      origStart = DateFieldValidationUtility.getStartDateCrossFieldError;
    });
    afterEach(() => {
      DateFieldValidationUtility.getStartDateCrossFieldError = origStart;
    });

    it('should return error string from DateFieldValidationUtility', () => {
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('Effective Date error');
      const result = component.getEffDateError();
      expect(result).toBe('Effective Date error');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalled();
    });
  });

  describe('getTermDateError', () => {
    let origEnd: typeof DateFieldValidationUtility.getEndDateCrossFieldError;

    beforeEach(() => {
      origEnd = DateFieldValidationUtility.getEndDateCrossFieldError;
    });
    afterEach(() => {
      DateFieldValidationUtility.getEndDateCrossFieldError = origEnd;
    });

    it('should return error string from DateFieldValidationUtility', () => {
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('Termination Date error');
      const result = component.getTermDateError();
      expect(result).toBe('Termination Date error');
    });
  });

  describe('onEffDateInput', () => {
    let origHandleStart: typeof DateFieldValidationUtility.handleStartDateInput;

    beforeEach(() => {
      origHandleStart = DateFieldValidationUtility.handleStartDateInput;
    });
    afterEach(() => {
      DateFieldValidationUtility.handleStartDateInput = origHandleStart;
    });

    it('should call DateFieldValidationUtility.handleStartDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '15-JAN-2026' } } as unknown as Event;
      component.onEffDateInput(event);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '15-JAN-2026', component.newCommentForm.get('effDate')
      );
    });
  });

  describe('onTermDateInput', () => {
    let origHandleEnd: typeof DateFieldValidationUtility.handleEndDateInput;

    beforeEach(() => {
      origHandleEnd = DateFieldValidationUtility.handleEndDateInput;
    });
    afterEach(() => {
      DateFieldValidationUtility.handleEndDateInput = origHandleEnd;
    });

    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTermDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2026', component.newCommentForm.get('termDate')
      );
    });
  });

  describe('onSave - no changes, no adding new', () => {
    it('should close dialog when no pending changes and not adding new', () => {
      component.isAddingNew = false;
      component.pendingTermDates.clear();
      component.pendingCommentEdits.clear();
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onSave - only existing comment changes (pendingTermDates)', () => {
    it('should call updateResponseComment for pending term date changes', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y', 'C01',
        jasmine.objectContaining({ commentCode: 'C01', termDate: '2026-06-15T00:00:00Z' })
      );
    });

    it('should close dialog with saved flag on success', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true });
    });

    it('should clear pending maps on success', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.pendingCommentEdits.set('C02', 'edited');
      component.onSave();
      expect(component.pendingTermDates.size).toBe(0);
      expect(component.pendingCommentEdits.size).toBe(0);
    });

    it('should show success snackbar on success', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Comment updated successfully', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show error snackbar when update returns success:false', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(of({
        success: false, message: 'Update failed', error: null, statusCode: 400, data: null,
        errorCode: 'ERR01', errorResponse: { errorCode: 'ERR01', error: 'Validation error' }
      } as any));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('ERR01'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should reload comments after failed update result', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(of({
        success: false, message: 'Error', error: null, statusCode: 400, data: null
      } as any));

      hhServiceSpy.getResponseComments.calls.reset();
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(hhServiceSpy.getResponseComments).toHaveBeenCalled();
    });

    it('should handle HTTP error during update', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(throwError(() => ({
        error: { errorCode: 'HTTP500', message: 'Server error' },
        status: 500
      })));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();
      expect(component.isSaving).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('HTTP500'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should clear pending maps and reload comments on HTTP error', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(throwError(() => ({
        error: { message: 'Server error' },
        status: 500
      })));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.pendingCommentEdits.set('C02', 'some text');
      hhServiceSpy.getResponseComments.calls.reset();
      component.onSave();
      expect(component.pendingTermDates.size).toBe(0);
      expect(component.pendingCommentEdits.size).toBe(0);
      expect(hhServiceSpy.getResponseComments).toHaveBeenCalled();
    });
  });

  describe('onSave - only existing comment text changes (pendingCommentEdits)', () => {
    it('should call updateResponseComment for pending comment text edits', () => {
      component.isAddingNew = false;
      component.pendingCommentEdits.set('C02', 'Updated text');
      component.onSave();
      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y', 'C02',
        jasmine.objectContaining({ commentCode: 'C02', commentDet: 'Updated text' })
      );
    });
  });

  describe('onSave - both pending term dates and pending comment edits for same comment', () => {
    it('should merge term date and comment text changes into single payload', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-09-01T00:00:00Z');
      component.pendingCommentEdits.set('C01', 'Merged edit');
      component.onSave();
      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y', 'C01',
        jasmine.objectContaining({
          commentCode: 'C01',
          commentDet: 'Merged edit',
          termDate: '2026-09-01T00:00:00Z'
        })
      );
    });
  });

  describe('onSave - adding new comment only (no pending existing changes)', () => {
    beforeEach(() => {
      component.isAddingNew = true;
      component.pendingTermDates.clear();
      component.pendingCommentEdits.clear();
    });

    it('should mark form as touched', () => {
      spyOn(component.newCommentForm, 'markAllAsTouched');
      component.onSave();
      expect(component.newCommentForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not call service when form is invalid', () => {
      component.newCommentForm.get('commentCode')?.setValue('');
      component.onSave();
      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });

    it('should validate comment code uniqueness before saving', () => {
      component.newCommentForm.get('commentCode')?.setValue('C01');
      component.newCommentForm.get('commentDet')?.setValue('A comment');
      component.newCommentForm.get('effDate')?.setValue(futureDate());
      component.onSave();
      // C01 is a duplicate, so create should not be called
      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });

    it('should call createResponseComment when form is valid', () => {
      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.createResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y',
        jasmine.objectContaining({ commentCode: 'NEW', commentDet: 'Valid comment text' })
      );
    });

    it('should set isSaving to true during save', () => {
      const subj = new Subject<any>();
      hhServiceSpy.createResponseComment.and.returnValue(subj.asObservable());

      fillValidForm();
      component.onSave();

      expect(component.isSaving).toBe(true);

      subj.next({ success: true, message: '', error: null, statusCode: 200, data: null });
      expect(component.isSaving).toBe(false);
    });

    it('should close dialog with saved flag on successful create', () => {
      fillValidForm();
      component.onSave();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true });
    });

    it('should show success snackbar on successful create', () => {
      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Comment saved successfully', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show error snackbar when create returns success:false with errorCode', () => {
      hhServiceSpy.createResponseComment.and.returnValue(of({
        success: false, message: 'Failed', error: null, statusCode: 400, data: null,
        errorCode: 'DUP01', errorResponse: { errorCode: 'DUP01', error: 'Duplicate code' }
      } as any));

      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('DUP01'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(dialogRefSpy.close).not.toHaveBeenCalledWith({ saved: true });
    });

    it('should show error snackbar when create returns success:false without errorCode', () => {
      hhServiceSpy.createResponseComment.and.returnValue(of({
        success: false, message: 'An error occurred', error: null, statusCode: 400, data: null
      } as any));

      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'An error occurred', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error during create', () => {
      hhServiceSpy.createResponseComment.and.returnValue(throwError(() => ({
        error: { errorCode: 'SRV01', message: 'Server fault' }
      })));

      fillValidForm();
      component.onSave();

      expect(component.isSaving).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('SRV01'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error without errorCode during create', () => {
      hhServiceSpy.createResponseComment.and.returnValue(throwError(() => ({
        error: { message: 'Something went wrong' }
      })));

      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error with nested errorResponse during create', () => {
      hhServiceSpy.createResponseComment.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: 'NESTED01', error: 'Nested error' } }
      })));

      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('NESTED01'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should use fallback error message when error body is empty', () => {
      hhServiceSpy.createResponseComment.and.returnValue(throwError(() => ({})));

      fillValidForm();
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'An error occurred while saving', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should not save when effDate has validation error', () => {
      spyOn(component, 'getEffDateError').and.returnValue('Effective Date is required');

      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });

    it('should not save when termDate has validation error', () => {
      spyOn(component, 'getEffDateError').and.returnValue('');
      spyOn(component, 'getTermDateError').and.returnValue('Termination Date is invalid');

      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });
  });

  describe('onSave - adding new comment WITH pending existing changes', () => {
    beforeEach(() => {
      component.isAddingNew = true;
      component.pendingTermDates.set('C01', '2026-09-01T00:00:00Z');
    });

    it('should mark form as touched', () => {
      spyOn(component.newCommentForm, 'markAllAsTouched');
      fillValidForm();
      component.onSave();
      expect(component.newCommentForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not proceed when form is invalid', () => {
      component.newCommentForm.get('commentCode')?.setValue('');
      component.onSave();
      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });

    it('should create new comment then update existing on success', () => {
      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.createResponseComment).toHaveBeenCalled();
      // After create succeeds, saveExistingCommentChanges is called
      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalled();
    });

    it('should show error and not update existing when create returns success:false', () => {
      hhServiceSpy.createResponseComment.and.returnValue(of({
        success: false, message: 'Create failed', error: null, statusCode: 400, data: null,
        errorCode: 'ERR02'
      } as any));

      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.updateResponseComment).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('ERR02'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
    });

    it('should handle HTTP error during create in combined save flow', () => {
      hhServiceSpy.createResponseComment.and.returnValue(throwError(() => ({
        error: { errorCode: 'SRV02', message: 'Server error in create' }
      })));

      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.updateResponseComment).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('SRV02'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should not save when date error exists in combined save flow', () => {
      spyOn(component, 'getEffDateError').and.returnValue('Date error');

      fillValidForm();
      component.onSave();

      expect(hhServiceSpy.createResponseComment).not.toHaveBeenCalled();
    });
  });

  describe('saveExistingCommentChanges - error response formats', () => {
    it('should handle update failure without errorResponse', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(of({
        success: false, message: 'Generic failure', error: 'some error', statusCode: 500, data: null
      } as any));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();

      // statusCode 500 is picked up as errorCode fallback, producing "Error: 500 Generic failure"
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Generic failure'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle update failure with no error code at all', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(of({
        success: false, message: 'Simple failure', error: null, statusCode: 0, data: null
      } as any));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Simple failure', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error with status code fallback', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(throwError(() => ({
        error: { statusCode: 422 },
        status: 422,
        message: 'Unprocessable Entity'
      })));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('422'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error with error.status fallback when body has no codes', () => {
      hhServiceSpy.updateResponseComment.and.returnValue(throwError(() => ({
        error: {},
        status: 503,
        message: 'Service Unavailable'
      })));

      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('503'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('saveExistingCommentChanges - multiple updates', () => {
    it('should update multiple comments at once', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.pendingCommentEdits.set('C02', 'Edited C02');
      component.onSave();

      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledTimes(2);
    });

    it('should use original commentDet when no pending edit exists', () => {
      component.isAddingNew = false;
      component.pendingTermDates.set('C01', '2026-06-15T00:00:00Z');
      component.onSave();

      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y', 'C01',
        jasmine.objectContaining({ commentDet: 'First comment' })
      );
    });

    it('should use original termDate when no pending term date exists', () => {
      component.isAddingNew = false;
      component.pendingCommentEdits.set('C01', 'Edited C01');
      component.onSave();

      expect(hhServiceSpy.updateResponseComment).toHaveBeenCalledWith(
        'Q001', 'A001', 'Y', 'C01',
        jasmine.objectContaining({ termDate: '2026-12-31T00:00:00Z' })
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySubject = (component as any).destroy$;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');
      component.ngOnDestroy();
      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });
  });

  describe('form valueChanges subscriptions', () => {
    let origStart: typeof DateFieldValidationUtility.getStartDateCrossFieldError;
    let origEnd: typeof DateFieldValidationUtility.getEndDateCrossFieldError;

    beforeEach(() => {
      origStart = DateFieldValidationUtility.getStartDateCrossFieldError;
      origEnd = DateFieldValidationUtility.getEndDateCrossFieldError;
    });
    afterEach(() => {
      DateFieldValidationUtility.getStartDateCrossFieldError = origStart;
      DateFieldValidationUtility.getEndDateCrossFieldError = origEnd;
    });

    it('should track lastChangedDateField as effective when effDate changes', () => {
      component.newCommentForm.get('termDate')?.setValue(moment().add(60, 'days'));
      component.newCommentForm.get('effDate')?.setValue(futureDate());
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalledWith(
        component.newCommentForm.get('effDate'),
        'Effective Date',
        'Termination Date',
        component.newCommentForm.errors
      );
    });

    it('should track lastChangedDateField as termination when termDate changes', () => {
      component.newCommentForm.get('termDate')?.setValue(moment().add(60, 'days'));
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTermDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalledWith(
        component.newCommentForm.get('termDate'),
        'Termination Date',
        'Effective Date',
        component.newCommentForm.errors
      );
    });

    it('should pass null formErrors for getTermDateError when lastChangedDateField is effective', () => {
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTermDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalledWith(
        component.newCommentForm.get('termDate'),
        'Termination Date',
        'Effective Date',
        null
      );
    });

    it('should pass null formErrors for getEffDateError when lastChangedDateField is termination', () => {
      component.newCommentForm.get('termDate')?.setValue(moment().add(60, 'days'));
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalledWith(
        component.newCommentForm.get('effDate'),
        'Effective Date',
        'Termination Date',
        null
      );
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });
  });
});
