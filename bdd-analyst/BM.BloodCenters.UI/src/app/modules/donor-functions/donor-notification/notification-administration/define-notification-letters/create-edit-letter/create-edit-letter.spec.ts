import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { CreateEditLetter, CreateEditLetterData } from './create-edit-letter';
import { NotificationLettersService } from '../services/notification-letters.service';
import { HeaderService } from '@shared/services/header.service';
import { LetterView, TemplateVariable } from '../models/notification-letter.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('CreateEditLetter', () => {
  let component: CreateEditLetter;
  let fixture: ComponentFixture<CreateEditLetter>;
  let serviceSpy: jasmine.SpyObj<NotificationLettersService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateEditLetter>>;

  const mockTemplateVariables: TemplateVariable[] = [
    {
      name: 'DONOR_NAME',
      placeholder: '&&DONOR_NAME&&',
      description: 'Donor full name',
      example: 'John Doe'
    },
    {
      name: 'APPOINTMENT_DATE',
      placeholder: '&&APPOINTMENT_DATE&&',
      description: 'Appointment date',
      example: '01-JAN-2025'
    }
  ];

  const mockLetter: LetterView = {
    letterCode: 'BDAY',
    title: 'Happy Birthday',
    description: 'Birthday letter',
    fileName: 'BDAY.html',
    currentVersion: {
      letterId: 'BDAY-001',
      letterCode: 'BDAY',
      versionNo: 2,
      effectiveDate: '01-JAN-2025',
      terminationDate: undefined,
      letterMessage: 'Dear &&DONOR_NAME&&, Happy Birthday!',
      isCurrent: true
    }
  };

  const mockDialogData: CreateEditLetterData = {
    mode: 'add',
    letterCodes: [
      { code: 'BDAY', description: 'Happy Birthday' },
      { code: 'THANK', description: 'Thank You' }
    ]
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('NotificationLettersService', [
      'getTemplateVariables',
      'createLetter',
      'reviseLetter',
      'getLetterDetail'
    ]);
    headerServiceSpy = createMockHeaderService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.getTemplateVariables.and.returnValue(of(mockTemplateVariables));
    serviceSpy.getLetterDetail.and.returnValue(of(mockLetter));
    serviceSpy.createLetter.and.returnValue(of(mockLetter));
    serviceSpy.reviseLetter.and.returnValue(of(mockLetter));

    TestBed.configureTestingModule({
      imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
      providers: [
        { provide: NotificationLettersService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });
  });

  beforeEach(() => {
    headerServiceSpy.getCurrentUsername.calls.reset();
    headerServiceSpy.getCurrentChapterId.calls.reset();
    headerServiceSpy.getCurrentWarehouseId.calls.reset();
    serviceSpy.getTemplateVariables.and.returnValue(of(mockTemplateVariables));
    serviceSpy.getLetterDetail.and.returnValue(of(mockLetter));
    serviceSpy.createLetter.and.returnValue(of(mockLetter));
    serviceSpy.reviseLetter.and.returnValue(of(mockLetter));
    fixture = TestBed.createComponent(CreateEditLetter);
    component = fixture.componentInstance;
  });

  it('should load template variables on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(serviceSpy.getTemplateVariables).toHaveBeenCalled();
      expect(component.templateVariables.length).toBe(2);
      done();
    }, 100);
  });


  it('should initialize form in edit mode', () => {
    const editData: CreateEditLetterData = {
      mode: 'edit',
      letter: mockLetter,
      letterCodes: mockDialogData.letterCodes
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
      providers: [
        { provide: NotificationLettersService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: editData }
      ]
    });

    const editFixture = TestBed.createComponent(CreateEditLetter);
    const editComponent = editFixture.componentInstance;
    editFixture.detectChanges();

    expect(editComponent.mode).toBe('edit');
    expect(editComponent.title).toBe('Revise Letter');
    expect(editComponent.currentVersionNo).toBe(2);
    expect(editComponent.newVersionNo).toBe(3);
  });


  it('should validate effective date is not in the past (add mode)', fakeAsync(() => {
    // Mock current date to ensure consistent test behavior
    const mockToday = moment().add(10, 'days').startOf('day');
    spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockToday);

    fixture.detectChanges();
    tick(200); // Wait for async initialization

    const effectiveDateControl = component.letterForm.get('effectiveDate');

    // Set a clearly past date relative to mocked today (Jan 1, 2020)
    const pastDate = moment('2020-01-01').toDate();
    effectiveDateControl?.setValue(pastDate);
    effectiveDateControl?.markAsTouched();
    effectiveDateControl?.updateValueAndValidity();

    fixture.detectChanges();
    tick(100);

    expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(true);
  }));

  it('should allow today as effective date (add mode)', fakeAsync(() => {
    // Explicitly mock getToday to return actual today (prevents spy leak from prior test)
    const mockToday = moment().startOf('day');
    spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockToday);

    fixture.detectChanges();
    tick(100); // Wait for async initialization

    const effectiveDateControl = component.letterForm.get('effectiveDate');

    // Set today's date
    const today = new Date();
    effectiveDateControl?.setValue(today);
    effectiveDateControl?.markAsTouched();

    fixture.detectChanges();
    tick();

    expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);
  }));




  it('should allow same day for effective and termination dates', fakeAsync(() => {
    fixture.detectChanges();
    tick(100); // Wait for async initialization

    const effectiveDateControl = component.letterForm.get('effectiveDate');
    const terminationDateControl = component.letterForm.get('terminationDate');

    // Set effective date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    effectiveDateControl?.setValue(tomorrow);

    // Set termination date to same day as effective date
    const sameDayAsTomorrow = new Date(tomorrow);
    terminationDateControl?.setValue(sameDayAsTomorrow);
    terminationDateControl?.markAsTouched();

    fixture.detectChanges();
    tick();

    // Same day should be allowed (no cross-field validation error)
    expect(component.letterForm.hasError('dateRangeInvalid')).toBe(false);
  }));

  it('should validate dates based on chapter local date, not system date', fakeAsync(() => {
    // Mock chapter local date to be May 13, 2026
    const mockChapterDate = moment('2026-05-13').startOf('day');
    spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockChapterDate);

    fixture.detectChanges();
    tick(100); // Wait for async initialization

    const effectiveDateControl = component.letterForm.get('effectiveDate');

    // Test 1: May 13, 2026 (same as chapter date) should be valid
    const chapterToday = moment('2026-05-13').toDate();
    effectiveDateControl?.setValue(chapterToday);
    effectiveDateControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);

    // Test 2: May 12, 2026 (before chapter date) should be invalid
    const beforeChapterDate = moment('2026-05-12').toDate();
    effectiveDateControl?.setValue(beforeChapterDate);
    effectiveDateControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(true);

    // Test 3: May 14, 2026 (after chapter date) should be valid
    const afterChapterDate = moment('2026-05-14').toDate();
    effectiveDateControl?.setValue(afterChapterDate);
    effectiveDateControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);
  }));

  it('should validate letter code max length in add mode', fakeAsync(() => {
    fixture.detectChanges();
    tick(100); // Wait for async initialization

    const letterCodeControl = component.letterForm.get('letterCode');

    // Valid letter code within max length (10 chars)
    letterCodeControl?.setValue('DONOR_BDAY');
    letterCodeControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(letterCodeControl?.hasError('letterCodeTooLong')).toBe(false);

    // Valid letter code with hyphens (within limit)
    letterCodeControl?.setValue('BDAY-2024');
    letterCodeControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(letterCodeControl?.hasError('letterCodeTooLong')).toBe(false);

    // Invalid letter code exceeding max length (> 10 chars)
    letterCodeControl?.setValue('DONOR_BDAY_2024');
    letterCodeControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(letterCodeControl?.hasError('letterCodeTooLong')).toBe(true);

    // Exactly at max length (10 chars)
    letterCodeControl?.setValue('ABCDEFGHIJ');
    letterCodeControl?.markAsTouched();
    fixture.detectChanges();
    tick();
    expect(letterCodeControl?.hasError('letterCodeTooLong')).toBe(false);
  }));

  it('should create new letter successfully', fakeAsync(() => {
    serviceSpy.createLetter.and.returnValue(of(mockLetter));
    fixture.detectChanges();
    tick(100); // Wait for async initialization

    // Use a future date to pass min date validation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    component.letterForm.patchValue({
      letterCode: 'BDAY',
      title: 'Happy Birthday',
      effectiveDate: futureDate,
      letterMessage: 'Dear &&DONOR_NAME&&, Happy Birthday!'
    });

    // Mark form as touched to trigger validation
    component.letterForm.markAllAsTouched();
    fixture.detectChanges();

    component.onSave();
    tick(); // Process the observable

    expect(serviceSpy.createLetter).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: true, data: mockLetter });
  }));

  it('should handle creation error', (done) => {
    serviceSpy.createLetter.and.returnValue(
      throwError(() => new Error('API Error'))
    );
    fixture.detectChanges();

    component.letterForm.patchValue({
      letterCode: 'BDAY',
      title: 'Happy Birthday',
      effectiveDate: new Date('2025-01-01'),
      letterMessage: 'Test message'
    });

    component.onSave();

    setTimeout(() => {
      expect(component.isSaving).toBe(false);
      done();
    }, 100);
  });

  it('should cancel and close dialog', () => {
    fixture.detectChanges();

    component.onCancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: false });
  });

  // Bug Fix #5: Effective Date Error Display
  describe('Effective Date Error Display', () => {

    it('should show invalidDate error when invalid date format entered', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');

      // Set invalid date
      effectiveDateControl?.setValue('invalid-date');
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.updateValueAndValidity();

      fixture.detectChanges();
      tick(100);

      const errorMessage = component.getEffectiveDateError();
      expect(errorMessage).toContain('invalid');
    }));


    it('should not show effective date errors in edit mode', fakeAsync(() => {
      const editData: CreateEditLetterData = {
        mode: 'edit',
        letter: mockLetter,
        letterCodes: mockDialogData.letterCodes
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
        providers: [
          { provide: NotificationLettersService, useValue: serviceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editData }
        ]
      });

      const editFixture = TestBed.createComponent(CreateEditLetter);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      tick(200);

      const errorMessage = editComponent.getEffectiveDateError();
      expect(errorMessage).toBe('');
    }));

    it('should validate effective date is not in the past in edit mode', fakeAsync(() => {
      const editData: CreateEditLetterData = {
        mode: 'edit',
        letter: mockLetter,
        letterCodes: mockDialogData.letterCodes
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
        providers: [
          { provide: NotificationLettersService, useValue: serviceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editData }
        ]
      });

      const editFixture = TestBed.createComponent(CreateEditLetter);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      tick(200);

      const effectiveDateControl = editComponent.letterForm.get('effectiveDate');
      const pastDate = moment('2020-01-01').toDate();
      effectiveDateControl?.setValue(pastDate);
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.updateValueAndValidity();

      editFixture.detectChanges();
      tick(100);

      expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(true);
      const errorMessage = editComponent.getEffectiveDateError();
      expect(errorMessage).toBe('Effective date cannot be past date');
    }));

    it('should prioritize dateInPast error over other errors', fakeAsync(() => {
      // Mock current date to ensure consistent test behavior
      const mockToday = moment().add(10, 'days').startOf('day');
      spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockToday);

      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');

      // Set a clearly past date relative to mocked today
      const pastDate = moment('2020-01-01').toDate();
      effectiveDateControl?.setValue(pastDate);
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.updateValueAndValidity();

      fixture.detectChanges();
      tick(100);

      // Even if multiple errors, dateInPast should be shown first
      const errorMessage = component.getEffectiveDateError();
      expect(errorMessage).toBe('Effective date cannot be past date');
    }));

    it('should show cross-field validation error when termination before effective', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');
      const terminationDateControl = component.letterForm.get('terminationDate');

      // Set effective date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      effectiveDateControl?.setValue(tomorrow);

      // Set termination date to today (before effective)
      const today = new Date();
      terminationDateControl?.setValue(today);

      effectiveDateControl?.markAsTouched();
      terminationDateControl?.markAsTouched();
      effectiveDateControl?.updateValueAndValidity();
      terminationDateControl?.updateValueAndValidity();

      fixture.detectChanges();
      tick(100);

      // Cross-field validation should trigger
      expect(component.letterForm.hasError('dateRangeInvalid')).toBe(true);
    }));

    it('should handle manual date entry like 05282025', fakeAsync(() => {
      // Mock current date to ensure consistent test behavior
      const mockToday = moment().add(10, 'days').startOf('day');
      spyOn<any>(DateFieldValidationUtility, 'getToday').and.returnValue(mockToday);

      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');

      // Simulate manual entry of clearly past date in MMDDYYYY format (Jan 1, 2020)
      const manualPastDate = moment('01012020', 'MMDDYYYY').toDate();

      effectiveDateControl?.setValue(manualPastDate);
      effectiveDateControl?.markAsTouched();
      effectiveDateControl?.updateValueAndValidity();

      fixture.detectChanges();
      tick(100);

      const errorMessage = component.getEffectiveDateError();
      expect(errorMessage).toBe('Effective date cannot be past date');
    }));
  });

  // Bug Fix #6: Date Error Location and Change Detection
  describe('Date Error Message Location (lastChangedDateField)', () => {
    it('should track which date field was last changed - effective date input', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const inputEvent = new Event('input');
      Object.defineProperty(inputEvent, 'target', { value: { value: '01-JAN-2026' } });

      component.onEffectiveDateInput(inputEvent);

      expect(component['lastChangedDateField']).toBe('effective');
    }));

    it('should track which date field was last changed - effective date picker', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      component.onEffectiveDateChange();

      expect(component['lastChangedDateField']).toBe('effective');
    }));

    it('should track which date field was last changed - effective date blur', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      component.onEffectiveDateBlur();

      expect(component['lastChangedDateField']).toBe('effective');
      expect(component.letterForm.get('effectiveDate')?.touched).toBe(true);
    }));

    it('should track which date field was last changed - termination date input', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const inputEvent = new Event('input');
      Object.defineProperty(inputEvent, 'target', { value: { value: '31-DEC-2026' } });

      component.onTerminationDateInput(inputEvent);

      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should track which date field was last changed - termination date picker', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      component.onTerminationDateChange();

      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should show cross-field error under effective date when effective date was changed last', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');
      const terminationDateControl = component.letterForm.get('terminationDate');

      // Set termination date first
      const terminationDate = moment().add(10, 'days').toDate();
      terminationDateControl?.setValue(terminationDate);
      terminationDateControl?.markAsTouched();

      tick(100);

      // Now change effective date to AFTER termination (trigger error)
      component.onEffectiveDateChange(); // Mark effective as last changed
      const effectiveDate = moment().add(100, 'days').toDate();
      effectiveDateControl?.setValue(effectiveDate);
      effectiveDateControl?.markAsTouched();

      fixture.detectChanges();
      tick(100);

      // Error should appear under effective date because it was changed last
      expect(component['lastChangedDateField']).toBe('effective');
      const effError = component.getEffectiveDateError();

      expect(effError).toContain('Effective Date must be less than or equal to Termination Date');
      // Termination date also shows an error due to matDatepickerMin (control-level)
      // since the min date was updated to the new effective date
      const termError = component.getTerminationDateError();
      expect(termError).toContain('Termination Date must be greater than or equal to Effective Date');
    }));

    it('should show cross-field error under termination date when termination date was changed last', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      const effectiveDateControl = component.letterForm.get('effectiveDate');
      const terminationDateControl = component.letterForm.get('terminationDate');

      // Set effective date first
      const effectiveDate = moment().add(100, 'days').toDate();
      effectiveDateControl?.setValue(effectiveDate);
      effectiveDateControl?.markAsTouched();

      tick(100);

      // Now change termination date to BEFORE effective (trigger error)
      component.onTerminationDateChange(); // Mark termination as last changed
      const terminationDate = moment().add(10, 'days').toDate();
      terminationDateControl?.setValue(terminationDate);
      terminationDateControl?.markAsTouched();

      fixture.detectChanges();
      tick(100);

      // Error should appear under termination date because it was changed last
      expect(component['lastChangedDateField']).toBe('termination');
      const effError = component.getEffectiveDateError();
      const termError = component.getTerminationDateError();

      expect(effError).toBe('');
      expect(termError).toContain('Termination Date must be greater than or equal to Effective Date');
    }));

    it('should cache error messages to prevent ExpressionChangedAfterItHasBeenCheckedError', fakeAsync(() => {
      fixture.detectChanges();
      tick(200);

      // Initial error messages should be empty
      expect(component['effectiveDateErrorMessage']).toBe('');
      expect(component['terminationDateErrorMessage']).toBe('');

      const effectiveDateControl = component.letterForm.get('effectiveDate');
      effectiveDateControl?.setValue(null);
      effectiveDateControl?.markAsTouched();

      tick(100);

      // After update, cached message should be populated
      expect(component['effectiveDateErrorMessage']).toBeTruthy();
      expect(component.getEffectiveDateError()).toBe(component['effectiveDateErrorMessage']);
    }));
  });

  // Bug Fix #7: Error Snackbar Auto-Dismiss
  describe('Error Snackbar Auto-Dismiss Behavior', () => {
    it('should not auto-dismiss error snackbar when message starts with "Error"', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component['showError']('Error: Something went wrong');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error: Something went wrong',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
          // duration should NOT be present
        })
      );

      const config = snackBarSpy.calls.mostRecent().args[2] as any;
      expect(config?.duration).toBeUndefined();
    });

    it('should auto-dismiss error snackbar when message does NOT start with "Error"', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component['showError']('Failed to save letter');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to save letter',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should auto-dismiss error snackbar for lowercase error messages', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component['showError']('error: lowercase error');

      expect(snackBarSpy).toHaveBeenCalledWith(
        'error: lowercase error',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000 // Should auto-dismiss because it doesn't start with capital "Error"
        })
      );
    });
  });

  // Readonly Field Display in Edit Mode
  describe('Readonly Field Display in Edit Mode', () => {
    let editFixture: ComponentFixture<CreateEditLetter>;
    let editComponent: CreateEditLetter;

    beforeEach(async () => {
      const editData: CreateEditLetterData = {
        mode: 'edit',
        letter: mockLetter,
        letterCodes: mockDialogData.letterCodes
      };

      await TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
        providers: [
          { provide: NotificationLettersService, useValue: serviceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editData }
        ]
      });

      editFixture = TestBed.createComponent(CreateEditLetter);
      editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
    });



    it('should display Effective Date as readonly in edit mode', () => {
      const effectiveDateControl = editComponent.letterForm.get('effectiveDate');

      expect(editComponent.mode).toBe('edit');
      expect(effectiveDateControl?.value).toBeDefined();
    });

    it('should have Effective Date as editable form control in edit mode', () => {
      const effectiveDateControl = editComponent.letterForm.get('effectiveDate');

      expect(editComponent.mode).toBe('edit');
      expect(effectiveDateControl?.value).toBeDefined();
      expect(effectiveDateControl?.disabled).toBe(false);
    });

    it('should have Title as editable form control in edit mode', () => {
      const titleControl = editComponent.letterForm.get('title');

      expect(editComponent.mode).toBe('edit');
      expect(titleControl?.value).toBe('Happy Birthday');
      expect(titleControl?.disabled).toBe(false);
    });


    it('should format date values for readonly display', () => {
      const testDate = '2026-05-15';
      const formatted = editComponent.formatDate(testDate);

      expect(formatted).toBe('15-MAY-2026');
    });

    it('should handle null dates in readonly display', () => {
      const formatted = editComponent.formatDate(null);

      expect(formatted).toBe('');
    });

    it('should handle undefined dates in readonly display', () => {
      const formatted = editComponent.formatDate(undefined);

      expect(formatted).toBe('');
    });

    it('should display Letter Code value in readonly format', () => {
      const letterCodeValue = editComponent.letterForm.get('letterCode')?.value;

      expect(letterCodeValue).toBe('BDAY');
    });


    it('should maintain form validity with disabled controls', () => {
      const letterCodeControl = editComponent.letterForm.get('letterCode');

      expect(letterCodeControl?.disabled).toBe(true);
      expect(editComponent.letterForm).toBeDefined();
    });
  });

  describe('Revise Letter - versionNo and terminationDate fixes', () => {
    it('should pass versionNo to getLetterDetail in edit mode', (done) => {
      const editData: CreateEditLetterData = {
        mode: 'edit',
        letter: mockLetter,
        letterCodes: mockDialogData.letterCodes
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
        providers: [
          { provide: NotificationLettersService, useValue: serviceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editData }
        ]
      });

      const editFixture = TestBed.createComponent(CreateEditLetter);
      editFixture.detectChanges();

      setTimeout(() => {
        expect(serviceSpy.getLetterDetail).toHaveBeenCalledWith('BDAY', 'N', 2);
        done();
      }, 100);
    });

    it('should not send currentTerminationDate as new version terminationDate', fakeAsync(() => {
      const letterWithTermDate: LetterView = {
        ...mockLetter,
        currentVersion: {
          ...mockLetter.currentVersion!,
          terminationDate: '31-DEC-2025'
        }
      };

      serviceSpy.getLetterDetail.and.returnValue(of(letterWithTermDate));

      const editData: CreateEditLetterData = {
        mode: 'edit',
        letter: letterWithTermDate,
        letterCodes: mockDialogData.letterCodes
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CreateEditLetter, NoopAnimationsModule, MatSnackBarModule],
        providers: [
          { provide: NotificationLettersService, useValue: serviceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editData }
        ]
      });

      const editFixture = TestBed.createComponent(CreateEditLetter);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      tick(200);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      editComponent.letterForm.patchValue({
        effectiveDate: futureDate,
        letterMessage: 'Test message'
      });

      editComponent.onSave();
      tick();

      if (serviceSpy.reviseLetter.calls.count() > 0) {
        const dto = serviceSpy.reviseLetter.calls.mostRecent().args[0];
        expect(dto.terminationDate).toBeUndefined();
      }
    }));
  });

  describe('Letter Message Max Length (30000)', () => {
    it('should allow letter message up to 30000 characters', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);

      const letterMessageControl = component.letterForm.get('letterMessage');
      letterMessageControl?.setValue('A'.repeat(30000));
      letterMessageControl?.markAsTouched();
      fixture.detectChanges();
      tick();

      expect(letterMessageControl?.hasError('maxlength')).toBe(false);
    }));

    it('should reject letter message exceeding 30000 characters', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);

      const letterMessageControl = component.letterForm.get('letterMessage');
      letterMessageControl?.setValue('A'.repeat(30001));
      letterMessageControl?.markAsTouched();
      fixture.detectChanges();
      tick();

      expect(letterMessageControl?.hasError('maxlength')).toBe(true);
    }));
  });
});
