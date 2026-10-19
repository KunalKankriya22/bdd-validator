import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditInterdictionComponent } from './add-edit-interdiction';
import { UnitInterdictionService } from '../services/unit-interdiction.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { InterdictionCode } from '../models/unit-interdiction.model';

describe('AddEditInterdictionComponent', () => {
  let component: AddEditInterdictionComponent;
  let fixture: ComponentFixture<AddEditInterdictionComponent>;
  let mockService: jasmine.SpyObj<UnitInterdictionService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditInterdictionComponent>>;
  let snackBarOpenSpy: jasmine.Spy;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockInterdictionCodes: InterdictionCode[] = [
    { code: 'A01', description: 'Interdiction Alpha', type: 'TypeA' },
    { code: 'B02', description: 'Interdiction Beta', type: 'TypeB' },
    { code: 'C03', description: 'Interdiction Charlie', type: 'TypeC' }
  ];

  const mockDialogData = {
    mode: 'add' as const,
    transactionId: 'TXN001',
    currentUserId: 'USER001',
    interdictionCodes: mockInterdictionCodes
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('UnitInterdictionService', ['createInterdictions']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);

    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-07-23'));

    TestBed.configureTestingModule({
      imports: [
        AddEditInterdictionComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: UnitInterdictionService, useValue: mockService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Spy on the actual MatSnackBar instance injected into the component
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');
  });

  it('should initialize form', () => {
    expect(component.interdictionForm).toBeDefined();
    expect(component.interdictionForm.get('code')).toBeDefined();
  });

  describe('ngOnInit', () => {
    it('should set today from chapter timezone service', () => {
      expect(component.today).toBeDefined();
      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
    });

    it('should initialize the form with empty default values', () => {
      expect(component.interdictionForm.get('code')!.value).toBe('');
      expect(component.interdictionForm.get('terminationDate')!.value).toBeNull();
      expect(component.interdictionForm.get('comments')!.value).toBe('');
    });

    it('should load interdiction codes from dialog data', () => {
      expect(component.interdictionCodes).toEqual(mockInterdictionCodes);
      expect(component.filteredInterdictionCodes).toEqual(mockInterdictionCodes);
    });

    it('should handle missing interdictionCodes in dialog data', () => {
      const dataWithoutCodes = { ...mockDialogData, interdictionCodes: undefined as any };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditInterdictionComponent, HttpClientTestingModule, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: dataWithoutCodes },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: UnitInterdictionService, useValue: mockService },
          { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
        ]
      }).compileComponents();
      const f = TestBed.createComponent(AddEditInterdictionComponent);
      f.detectChanges();
      expect(f.componentInstance.interdictionCodes).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('dialogTitle', () => {
    it('should return "Add New Interdiction"', () => {
      expect(component.dialogTitle).toBe('Add New Interdiction');
    });
  });

  describe('form validation', () => {
    it('should require code field', () => {
      const codeControl = component.interdictionForm.get('code')!;
      codeControl.setValue('');
      expect(codeControl.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength(5) on code field', () => {
      const codeControl = component.interdictionForm.get('code')!;
      codeControl.setValue('ABCDEF');
      expect(codeControl.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid code value', () => {
      const codeControl = component.interdictionForm.get('code')!;
      codeControl.setValue('A01');
      expect(codeControl.valid).toBeTrue();
    });

    it('should enforce maxLength(240) on comments field', () => {
      const commentsControl = component.interdictionForm.get('comments')!;
      commentsControl.setValue('x'.repeat(241));
      expect(commentsControl.hasError('maxlength')).toBeTrue();
    });

    it('should accept comments within 240 characters', () => {
      const commentsControl = component.interdictionForm.get('comments')!;
      commentsControl.setValue('x'.repeat(240));
      expect(commentsControl.valid).toBeTrue();
    });

    it('should not require terminationDate', () => {
      const termControl = component.interdictionForm.get('terminationDate')!;
      termControl.setValue(null);
      expect(termControl.valid).toBeTrue();
    });
  });

  describe('onCodeChange (via code valueChanges)', () => {
    it('should set description and type when a matching code is selected', () => {
      component.interdictionForm.get('code')!.setValue('A01');
      expect(component.selectedCodeDescription).toBe('Interdiction Alpha');
      expect(component.selectedCodeType).toBe('TypeA');
    });

    it('should clear description and type when non-matching code is set', () => {
      component.interdictionForm.get('code')!.setValue('A01');
      component.interdictionForm.get('code')!.setValue('ZZZ');
      expect(component.selectedCodeDescription).toBe('');
      expect(component.selectedCodeType).toBe('');
    });

    it('should clear description and type when code is cleared', () => {
      component.interdictionForm.get('code')!.setValue('B02');
      expect(component.selectedCodeDescription).toBe('Interdiction Beta');
      component.interdictionForm.get('code')!.setValue('');
      expect(component.selectedCodeDescription).toBe('');
      expect(component.selectedCodeType).toBe('');
    });
  });

  describe('filterCodes (via codeSearchControl)', () => {
    it('should show all codes when search is empty', () => {
      component.codeSearchControl.setValue('');
      expect(component.filteredInterdictionCodes).toEqual(mockInterdictionCodes);
    });

    it('should show all codes when search is null', () => {
      component.codeSearchControl.setValue(null);
      expect(component.filteredInterdictionCodes).toEqual(mockInterdictionCodes);
    });

    it('should filter codes by code value (case-insensitive)', () => {
      component.codeSearchControl.setValue('a01');
      expect(component.filteredInterdictionCodes.length).toBe(1);
      expect(component.filteredInterdictionCodes[0].code).toBe('A01');
    });

    it('should filter codes by description (case-insensitive)', () => {
      component.codeSearchControl.setValue('beta');
      expect(component.filteredInterdictionCodes.length).toBe(1);
      expect(component.filteredInterdictionCodes[0].code).toBe('B02');
    });

    it('should return empty array when no codes match', () => {
      component.codeSearchControl.setValue('xyz123');
      expect(component.filteredInterdictionCodes.length).toBe(0);
    });

    it('should trim whitespace in search term', () => {
      component.codeSearchControl.setValue('  A01  ');
      expect(component.filteredInterdictionCodes.length).toBe(1);
      expect(component.filteredInterdictionCodes[0].code).toBe('A01');
    });

    it('should match partial strings in code or description', () => {
      component.codeSearchControl.setValue('inter');
      expect(component.filteredInterdictionCodes.length).toBe(3);
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      component.interdictionForm.get('code')!.setValue('A01');
    });

    it('should not call service if form is invalid', () => {
      component.interdictionForm.get('code')!.setValue('');
      component.onSave();
      expect(mockService.createInterdictions).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.interdictionForm.get('code')!.setValue('');
      const markSpy = spyOn(component.interdictionForm, 'markAllAsTouched');
      component.onSave();
      expect(markSpy).toHaveBeenCalled();
    });

    it('should set isSaving to true during save', () => {
      const subject = new Subject<any>();
      mockService.createInterdictions.and.returnValue(subject.asObservable());
      component.onSave();
      expect(component.isSaving).toBeTrue();
    });

    it('should call createInterdictions with correct request for code only', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.onSave();
      expect(mockService.createInterdictions).toHaveBeenCalledWith({
        transactionId: 'TXN001',
        interdictions: [{
          interCode: 'A01',
          termDate: null,
          comments: undefined
        }]
      });
    });

    it('should format termination date in request when provided as moment', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.interdictionForm.get('terminationDate')!.setValue(moment('2026-12-25'));
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].termDate).toBe('2026-12-25');
    });

    it('should include comments in request when provided', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.interdictionForm.get('comments')!.setValue('Test comment');
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].comments).toBe('Test comment');
    });

    it('should set comments to undefined when empty', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.interdictionForm.get('comments')!.setValue('');
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].comments).toBeUndefined();
    });

    describe('on success', () => {
      beforeEach(() => {
        mockService.createInterdictions.and.returnValue(of({}));
      });

      it('should set hasCreatedRecords to true', () => {
        component.onSave();
        expect(component.hasCreatedRecords).toBeTrue();
      });

      it('should show success snackbar', () => {
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'New Interdiction A01 added successfully.',
          'DISMISS',
          jasmine.objectContaining({
            duration: 3000,
            panelClass: ['success-snackbar']
          })
        );
      });

      it('should close dialog with success result when not createAnother', () => {
        component.onSave(false);
        expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true, code: 'A01' });
      });

      it('should close dialog when createAnother is not passed (defaults to false)', () => {
        component.onSave();
        expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true, code: 'A01' });
      });

      it('should reset form and keep dialog open when createAnother is true', () => {
        const resetSpy = spyOn(component.interdictionForm, 'reset');
        component.onSave(true);
        expect(resetSpy).toHaveBeenCalled();
        expect(component.selectedCodeDescription).toBe('');
        expect(component.selectedCodeType).toBe('');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should set isSaving to false after success', () => {
        component.onSave();
        expect(component.isSaving).toBeFalse();
      });
    });

    describe('on error', () => {
      it('should show error snackbar with message from error.error.message', () => {
        const error = { error: { message: 'Duplicate interdiction' } };
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Duplicate interdiction',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show error snackbar with error code prepended', () => {
        const error = { error: { message: 'Something failed', errorCode: 'ERR001' } };
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Error ERR001: Something failed',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show error snackbar with error.error.error field', () => {
        const error = { error: { error: 'Server error text' } };
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Server error text',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show error snackbar with error.message as fallback', () => {
        const error = { message: 'Network error' };
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Network error',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show default error message when no message fields present', () => {
        const error = {};
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Failed to add interdiction',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should include errorCode from top-level error object', () => {
        const error = { message: 'Bad request', errorCode: 'BC100' };
        mockService.createInterdictions.and.returnValue(throwError(() => error));
        component.onSave();
        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Error BC100: Bad request',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should set isSaving to false after error', () => {
        mockService.createInterdictions.and.returnValue(throwError(() => ({ message: 'err' })));
        component.onSave();
        expect(component.isSaving).toBeFalse();
      });

      it('should not close dialog on error', () => {
        mockService.createInterdictions.and.returnValue(throwError(() => ({ message: 'err' })));
        component.onSave();
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should not set hasCreatedRecords on error', () => {
        mockService.createInterdictions.and.returnValue(throwError(() => ({ message: 'err' })));
        component.onSave();
        expect(component.hasCreatedRecords).toBeFalse();
      });
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result when no records were created', () => {
      component.hasCreatedRecords = false;
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should close dialog with success result when records were created', () => {
      component.hasCreatedRecords = true;
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('onTerminationDateInput', () => {
    it('should return early if terminationDate control does not exist', () => {
      spyOn(component.interdictionForm, 'get').and.returnValue(null);
      expect(() => component.onTerminationDateInput()).not.toThrow();
    });

    it('should clear pastDate error when input is empty', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setErrors({ pastDate: true });
      (component as any).terminationDateInput = { nativeElement: { value: '' } };
      component.onTerminationDateInput();
      expect(control.hasError('pastDate')).toBeFalse();
    });

    it('should clear invalidDate error when input is empty', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setErrors({ invalidDate: true });
      (component as any).terminationDateInput = { nativeElement: { value: '' } };
      component.onTerminationDateInput();
      expect(control.hasError('invalidDate')).toBeFalse();
    });

    it('should not clear unrelated errors when input is empty', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setErrors({ someOtherError: true });
      (component as any).terminationDateInput = { nativeElement: { value: '' } };
      component.onTerminationDateInput();
      expect(control.hasError('someOtherError')).toBeTrue();
    });

    it('should set pastDate error when date is in the past', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      const pastDate = moment('2020-01-01');
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(pastDate);

      (component as any).terminationDateInput = { nativeElement: { value: '01-JAN-2020' } };
      component.onTerminationDateInput();
      expect(control.hasError('pastDate')).toBeTrue();
    });

    it('should clear pastDate error when date is in the future', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setErrors({ pastDate: true });
      const futureDate = moment('2027-01-01');
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(futureDate);

      (component as any).terminationDateInput = { nativeElement: { value: '01-JAN-2027' } };
      component.onTerminationDateInput();
      expect(control.hasError('pastDate')).toBeFalse();
    });

    it('should mark control as touched and dirty', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(moment('2027-06-01'));
      (component as any).terminationDateInput = { nativeElement: { value: '01-JUN-2027' } };
      component.onTerminationDateInput();
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });

    it('should handle when terminationDateInput ViewChild is undefined', () => {
      (component as any).terminationDateInput = undefined;
      expect(() => component.onTerminationDateInput()).not.toThrow();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should return early if terminationDate control does not exist', () => {
      spyOn(component.interdictionForm, 'get').and.returnValue(null);
      expect(() => component.onTerminationDateChange({ value: moment() })).not.toThrow();
    });

    it('should set pastDate error when selected date is in the past', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      const pastDate = moment('2020-01-01');
      component.onTerminationDateChange({ value: pastDate });
      expect(control.hasError('pastDate')).toBeTrue();
    });

    it('should not set pastDate error when selected date is in the future', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      const futureDate = moment('2027-12-31');
      component.onTerminationDateChange({ value: futureDate });
      expect(control.hasError('pastDate')).toBeFalse();
    });

    it('should not set pastDate error when selected date is today', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      const todayDate = moment('2026-07-23');
      component.onTerminationDateChange({ value: todayDate });
      expect(control.hasError('pastDate')).toBeFalse();
    });

    it('should handle non-moment value gracefully', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      component.onTerminationDateChange({ value: null });
      expect(control.errors).toBeNull();
    });

    it('should handle event with plain date (not moment)', () => {
      const control = component.interdictionForm.get('terminationDate')!;
      component.onTerminationDateChange({ value: new Date() });
      // Should not throw, non-moment value is just ignored
      expect(control.errors).toBeNull();
    });
  });

  describe('onTerminationDateBlur', () => {
    it('should mark control as touched after timeout', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      (component as any).terminationDateInput = { nativeElement: { value: '' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.touched).toBeTrue();
    }));

    it('should set invalidDate error for unparseable input', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setValue(null);
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(null);
      (component as any).terminationDateInput = { nativeElement: { value: 'gibberish' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.hasError('invalidDate')).toBeTrue();
    }));

    it('should set pastDate error when parsed date is in the past', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setValue(null);
      const pastDate = moment('2020-06-15');
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(pastDate);
      (component as any).terminationDateInput = { nativeElement: { value: '15-JUN-2020' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.hasError('pastDate')).toBeTrue();
    }));

    it('should set value when parsed date is valid and in the future', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setValue(null);
      const futureDate = moment('2027-06-15');
      const dateAdapterInstance = TestBed.inject(DateAdapter);
      spyOn(dateAdapterInstance, 'parse').and.returnValue(futureDate);
      (component as any).terminationDateInput = { nativeElement: { value: '15-JUN-2027' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.value).toBeTruthy();
    }));

    it('should set pastDate error when existing value is in the past', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      const pastMoment = moment('2020-01-01');
      control.setValue(pastMoment);
      (component as any).terminationDateInput = { nativeElement: { value: '01-JAN-2020' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.hasError('pastDate')).toBeTrue();
    }));

    it('should handle when control value is a non-moment date object', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setValue('2020-01-01');
      (component as any).terminationDateInput = { nativeElement: { value: '01-JAN-2020' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.hasError('pastDate')).toBeTrue();
    }));

    it('should not set errors when input is empty and value is null', fakeAsync(() => {
      const control = component.interdictionForm.get('terminationDate')!;
      control.setValue(null);
      (component as any).terminationDateInput = { nativeElement: { value: '' } };
      component.onTerminationDateBlur();
      tick(100);
      expect(control.errors).toBeNull();
    }));
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when no errors exist', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return past date error message', () => {
      component.interdictionForm.get('terminationDate')!.setErrors({ pastDate: true });
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return invalid date error message', () => {
      component.interdictionForm.get('terminationDate')!.setErrors({ invalidDate: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid date for matDatepickerParse error', () => {
      component.interdictionForm.get('terminationDate')!.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid date when input has value but control value is null', () => {
      (component as any).terminationDateInput = { nativeElement: { value: 'not-a-date' } };
      component.interdictionForm.get('terminationDate')!.setValue(null);
      component.interdictionForm.get('terminationDate')!.setErrors(null);
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when terminationDate control is missing', () => {
      spyOn(component.interdictionForm, 'get').and.returnValue(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when input element is undefined', () => {
      (component as any).terminationDateInput = undefined;
      component.interdictionForm.get('terminationDate')!.setErrors(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when input element value is whitespace only', () => {
      (component as any).terminationDateInput = { nativeElement: { value: '   ' } };
      component.interdictionForm.get('terminationDate')!.setValue(null);
      component.interdictionForm.get('terminationDate')!.setErrors(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should prioritize pastDate over invalidDate error', () => {
      component.interdictionForm.get('terminationDate')!.setErrors({ pastDate: true, invalidDate: true });
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });
  });

  describe('termDateErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.termDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return false when control is untouched and pristine', () => {
      const control = component.interdictionForm.get('terminationDate')! as any;
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeFalse();
    });

    it('should return true when control is touched and has termination date error', () => {
      const control = component.interdictionForm.get('terminationDate')! as any;
      control.markAsTouched();
      control.setErrors({ pastDate: true });
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('should return true when control is dirty and has termination date error', () => {
      const control = component.interdictionForm.get('terminationDate')! as any;
      control.markAsDirty();
      control.setErrors({ pastDate: true });
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeTrue();
    });

    it('should return false when control is touched but no termination date error', () => {
      const control = component.interdictionForm.get('terminationDate')! as any;
      control.markAsTouched();
      control.setErrors(null);
      (component as any).terminationDateInput = undefined;
      expect(component.termDateErrorMatcher.isErrorState(control, null as any)).toBeFalse();
    });
  });

  describe('formatDateForApi (private, tested via onSave)', () => {
    beforeEach(() => {
      component.interdictionForm.get('code')!.setValue('A01');
      mockService.createInterdictions.and.returnValue(of({}));
    });

    it('should format moment date correctly', () => {
      component.interdictionForm.get('terminationDate')!.setValue(moment('2026-08-15'));
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].termDate).toBe('2026-08-15');
    });

    it('should format JavaScript Date correctly', () => {
      component.interdictionForm.get('terminationDate')!.setValue(new Date(2026, 11, 25));
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].termDate).toBe('2026-12-25');
    });

    it('should send null when no termination date is provided', () => {
      component.interdictionForm.get('terminationDate')!.setValue(null);
      component.onSave();
      const call = mockService.createInterdictions.calls.mostRecent().args[0];
      expect(call.interdictions[0].termDate).toBeNull();
    });
  });

  describe('isSaving state', () => {
    it('should be false initially', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should be true while request is in flight', () => {
      const subject = new Subject<any>();
      mockService.createInterdictions.and.returnValue(subject.asObservable());
      component.interdictionForm.get('code')!.setValue('A01');
      component.onSave();
      expect(component.isSaving).toBeTrue();
      subject.next({});
      subject.complete();
      expect(component.isSaving).toBeFalse();
    });

    it('should be false after error', () => {
      const subject = new Subject<any>();
      mockService.createInterdictions.and.returnValue(subject.asObservable());
      component.interdictionForm.get('code')!.setValue('A01');
      component.onSave();
      expect(component.isSaving).toBeTrue();
      subject.error({ message: 'fail' });
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('hasCreatedRecords state', () => {
    it('should be false initially', () => {
      expect(component.hasCreatedRecords).toBeFalse();
    });

    it('should be true after successful save', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.interdictionForm.get('code')!.setValue('A01');
      component.onSave();
      expect(component.hasCreatedRecords).toBeTrue();
    });

    it('should remain true for subsequent createAnother saves', () => {
      mockService.createInterdictions.and.returnValue(of({}));
      component.interdictionForm.get('code')!.setValue('A01');
      component.onSave(true);
      expect(component.hasCreatedRecords).toBeTrue();
      // Save another
      component.interdictionForm.get('code')!.setValue('B02');
      component.onSave(true);
      expect(component.hasCreatedRecords).toBeTrue();
    });
  });
});
