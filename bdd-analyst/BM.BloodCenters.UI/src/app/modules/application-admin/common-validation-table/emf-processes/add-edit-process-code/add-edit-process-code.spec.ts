import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import moment from 'moment';

import { AddEditProcessCode, EditProcessCodeData } from './add-edit-process-code';
import { EmfProcessesService } from '../services/emf-processes.service';
import { HeaderService } from '@shared/services/header.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

describe('AddEditProcessCode', () => {
  let component: AddEditProcessCode;
  let fixture: ComponentFixture<AddEditProcessCode>;
  let mockHeaderService: jasmine.SpyObj<any>;
  let mockEmfProcessesService: jasmine.SpyObj<EmfProcessesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<any>>;

  function createEditData(overrides: Partial<EditProcessCodeData> = {}): EditProcessCodeData {
    return {
      code: 'PROC001',
      description: 'Test Process',
      rulesText: '',
      effectiveDate: '2020-01-01T00:00:00',
      terminationDate: '2030-12-31T00:00:00',
      ...overrides
    };
  }

  /**
   * Sets form values and clears all validator errors so the form is valid.
   * Used for save/submit tests where form validity is a precondition, not the focus.
   */
  function makeFormValid(): void {
    component.form.patchValue({
      processCode: 'TESTCODE',
      processDescription: 'Test Description',
      effectiveDate: moment().add(1, 'year'),
      terminationDate: null
    });
    ['processCode', 'processDescription', 'effectiveDate', 'terminationDate'].forEach(name => {
      component.form.get(name)?.setErrors(null);
    });
    component.form.setErrors(null);
  }

  beforeEach(async () => {
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['chapterTimeZone']);
    mockHeaderService.chapterTimeZone.and.returnValue('-05:00');

    mockEmfProcessesService = jasmine.createSpyObj('EmfProcessesService', [
      'addProcessCode',
      'updateProcessCode'
    ]);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', ['parse', 'format', 'setLocale']);

    await TestBed.configureTestingModule({
      imports: [
        AddEditProcessCode,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: EmfProcessesService, useValue: mockEmfProcessesService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DateAdapter, useValue: mockDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditProcessCode);
    component = fixture.componentInstance;
    // Do NOT call fixture.detectChanges() here; each describe sets mode/editData first.
  });

  // ---------------------------------------------------------------------------
  // Initialization - Add Mode
  // ---------------------------------------------------------------------------
  describe('Initialization - Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with 4 controls', () => {
      expect(component.form.get('processCode')).toBeTruthy();
      expect(component.form.get('processDescription')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should have processCode with required, maxLength, pattern, and noWhitespaceOnly validators', () => {
      const control = component.form.get('processCode')!;

      control.setValue('');
      expect(control.hasError('required')).toBe(true);

      control.setValue('A'.repeat(11));
      expect(control.hasError('maxlength')).toBe(true);

      control.setValue('ABC@#$');
      expect(control.hasError('pattern')).toBe(true);

      control.setValue('   ');
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should have processDescription with required and maxLength validators', () => {
      const control = component.form.get('processDescription')!;

      control.setValue('');
      expect(control.hasError('required')).toBe(true);

      control.setValue('D'.repeat(241));
      expect(control.hasError('maxlength')).toBe(true);
    });

    it('should have effectiveDate with required validator', () => {
      const control = component.form.get('effectiveDate')!;
      control.setValue(null);
      expect(control.hasError('required')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Initialization - Edit Mode
  // ---------------------------------------------------------------------------
  describe('Initialization - Edit Mode', () => {
    it('should disable processCode in edit mode', () => {
      component.mode = 'edit';
      component.editData = createEditData();
      fixture.detectChanges();

      expect(component.form.get('processCode')!.disabled).toBe(true);
    });

    it('should lock effectiveDate when it is in the past', () => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2020-01-01T00:00:00' });
      fixture.detectChanges();

      expect(component.isEffectiveDateLocked).toBe(true);
      expect(component.form.get('effectiveDate')!.disabled).toBe(true);
    });

    it('should NOT lock effectiveDate when it is in the future', () => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2030-01-01T00:00:00' });
      fixture.detectChanges();

      expect(component.isEffectiveDateLocked).toBe(false);
      expect(component.form.get('effectiveDate')!.enabled).toBe(true);
    });

    it('should populate form from editData', () => {
      component.mode = 'edit';
      component.editData = createEditData({
        code: 'MYCODE',
        description: 'My Description',
        effectiveDate: '2030-06-15T00:00:00',
        terminationDate: '2030-12-31T00:00:00'
      });
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.processCode).toBe('MYCODE');
      expect(raw.processDescription).toBe('My Description');
      expect(moment.isMoment(raw.effectiveDate)).toBe(true);
      expect(moment.isMoment(raw.terminationDate)).toBe(true);
    });

    it('should lock effectiveDate when editData has no effectiveDate', () => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '' });
      fixture.detectChanges();

      expect(component.isEffectiveDateLocked).toBe(true);
      expect(component.form.get('effectiveDate')!.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Title
  // ---------------------------------------------------------------------------
  describe('title', () => {
    it('should return "Add New Process Code" in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.title).toBe('Add New Process Code');
    });

    it('should return "Edit Process Code" in edit mode', () => {
      component.mode = 'edit';
      component.editData = createEditData();
      fixture.detectChanges();
      expect(component.title).toBe('Edit Process Code');
    });

    it('should return "View Process Code" in view mode', () => {
      component.mode = 'view';
      fixture.detectChanges();
      expect(component.title).toBe('View Process Code');
    });
  });

  // ---------------------------------------------------------------------------
  // isSaveDisabled
  // ---------------------------------------------------------------------------
  describe('isSaveDisabled', () => {
    it('should be true when form is invalid', () => {
      fixture.detectChanges();
      expect(component.form.invalid).toBe(true);
      expect(component.isSaveDisabled).toBe(true);
    });

    it('should be true when isSaving is true', () => {
      fixture.detectChanges();
      makeFormValid();
      component.isSaving = true;

      expect(component.isSaveDisabled).toBe(true);
    });

    it('should be true in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2030-01-01T00:00:00' });
      fixture.detectChanges();

      // Clear any validator errors so form.invalid is false
      ['processCode', 'processDescription', 'effectiveDate', 'terminationDate'].forEach(name => {
        component.form.get(name)?.setErrors(null);
      });
      component.form.setErrors(null);
      component.isFormDirty = false;

      expect(component.isSaveDisabled).toBe(true);
    });

    it('should be false when form is valid and dirty in edit mode', () => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2030-01-01T00:00:00' });
      fixture.detectChanges();

      ['processCode', 'processDescription', 'effectiveDate', 'terminationDate'].forEach(name => {
        component.form.get(name)?.setErrors(null);
      });
      component.form.setErrors(null);
      component.isFormDirty = true;
      component.isSaving = false;

      expect(component.isSaveDisabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // sanitizeInput
  // ---------------------------------------------------------------------------
  describe('sanitizeInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove leading spaces', () => {
      component.form.get('processDescription')!.setValue('   Hello');
      component.sanitizeInput('processDescription');

      expect(component.form.get('processDescription')!.value).toBe('Hello');
    });

    it('should collapse multiple spaces to one', () => {
      component.form.get('processDescription')!.setValue('Hello   World');
      component.sanitizeInput('processDescription');

      expect(component.form.get('processDescription')!.value).toBe('Hello World');
    });

    it('should do nothing for non-string values', () => {
      const dateValue = moment('2030-01-01');
      component.form.get('effectiveDate')!.setValue(dateValue);
      component.sanitizeInput('effectiveDate');

      expect(moment.isMoment(component.form.get('effectiveDate')!.value)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // toUpperCase
  // ---------------------------------------------------------------------------
  describe('toUpperCase', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert value to uppercase', () => {
      component.form.get('processCode')!.setValue('abc123');
      component.toUpperCase('processCode');

      expect(component.form.get('processCode')!.value).toBe('ABC123');
    });

    it('should not call setValue when value is already uppercase', () => {
      component.form.get('processCode')!.setValue('ABC123');
      const spy = spyOn(component.form.get('processCode')!, 'setValue');

      component.toUpperCase('processCode');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // trimInput
  // ---------------------------------------------------------------------------
  describe('trimInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim trailing whitespace', () => {
      component.form.get('processDescription')!.setValue('Hello   ');
      component.trimInput('processDescription');

      expect(component.form.get('processDescription')!.value).toBe('Hello');
    });

    it('should not call setValue when there is no trailing whitespace', () => {
      component.form.get('processDescription')!.setValue('Hello');
      const spy = spyOn(component.form.get('processDescription')!, 'setValue');

      component.trimInput('processDescription');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getEffectiveDateError
  // ---------------------------------------------------------------------------
  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when there are no errors', () => {
      component.form.get('effectiveDate')!.setErrors(null);
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return "Effective Date is invalid" for invalidDate error', () => {
      component.form.get('effectiveDate')!.setErrors({ invalidDate: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return "Effective Date is required" for required error when touched', () => {
      const control = component.form.get('effectiveDate')!;
      control.setErrors({ required: true });
      control.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return "Effective Date is invalid" for matDatepickerParse error', () => {
      component.form.get('effectiveDate')!.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return "Effective date cannot be prior to system date" for effectiveDatePast error when touched', () => {
      const control = component.form.get('effectiveDate')!;
      control.setErrors({ effectiveDatePast: true });
      control.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective date cannot be prior to system date');
    });

    it('should return empty string for required error when control is not touched', () => {
      const control = component.form.get('effectiveDate')!;
      control.setErrors({ required: true });
      // Not marking as touched

      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // getTerminationDateError
  // ---------------------------------------------------------------------------
  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when there are no errors', () => {
      component.form.get('terminationDate')!.setErrors(null);
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return "Termination Date is invalid" for invalidDate error', () => {
      component.form.get('terminationDate')!.setErrors({ invalidDate: true });
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  // ---------------------------------------------------------------------------
  // onCancel
  // ---------------------------------------------------------------------------
  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSave
  // ---------------------------------------------------------------------------
  describe('onSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call addProcessCode in add mode with correct DTO', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();

      component.onSave();
      tick();

      expect(mockEmfProcessesService.addProcessCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procCode: 'TESTCODE',
          procDesc: 'Test Description'
        })
      );
    }));

    it('should call updateProcessCode in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      mockEmfProcessesService.updateProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();

      component.onSave();
      tick();

      expect(mockEmfProcessesService.updateProcessCode).toHaveBeenCalled();
    }));

    it('should show success snackbar on success', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('created successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should emit saveSuccess and closePanel on save success', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should show error snackbar on failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: { errorCode: '500', error: 'Server error' }
        }
      };
      mockEmfProcessesService.addProcessCode.and.returnValue(throwError(() => errorResponse));
      makeFormValid();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 500'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  // ---------------------------------------------------------------------------
  // onAddAndCreateAnother
  // ---------------------------------------------------------------------------
  describe('onAddAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call addProcessCode', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();

      component.onAddAndCreateAnother();
      tick();

      expect(mockEmfProcessesService.addProcessCode).toHaveBeenCalled();
    }));

    it('should reset form on success', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();

      component.onAddAndCreateAnother();
      tick();

      expect(component.form.get('processCode')!.value).toBeFalsy();
      expect(component.form.get('processDescription')!.value).toBeFalsy();
      expect(component.isFormDirty).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  // performSave guards
  // ---------------------------------------------------------------------------
  describe('performSave guards', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call the API when isSaving is already true', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      component.isSaving = true;

      component.onSave();
      tick();

      expect(mockEmfProcessesService.addProcessCode).not.toHaveBeenCalled();
    }));

    it('should not call the API when form is invalid', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      // Leave form empty so it is invalid
      component.form.get('processCode')!.setValue('');

      component.onSave();
      tick();

      expect(mockEmfProcessesService.addProcessCode).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  // terminationDateFilter
  // ---------------------------------------------------------------------------
  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no effective date is set', () => {
      component.form.get('effectiveDate')!.setValue(null);
      const testDate = moment('2025-06-15');

      expect(component.terminationDateFilter(testDate)).toBe(true);
    });

    it('should return false when date is before effective date', () => {
      component.form.get('effectiveDate')!.setValue(moment('2025-06-15'));
      const testDate = moment('2025-06-14');

      expect(component.terminationDateFilter(testDate)).toBe(false);
    });

    it('should return true when date is on or after effective date', () => {
      component.form.get('effectiveDate')!.setValue(moment('2025-06-15'));

      expect(component.terminationDateFilter(moment('2025-06-15'))).toBe(true);
      expect(component.terminationDateFilter(moment('2025-06-16'))).toBe(true);
    });

    it('should return true when date argument is null', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // editModeTermDateValidator
  // ---------------------------------------------------------------------------
  describe('editModeTermDateValidator', () => {
    it('should allow original termination date even if past', () => {
      const pastDate = '2020-06-15T00:00:00';
      component.mode = 'edit';
      component.editData = createEditData({ terminationDate: pastDate });
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate')!;
      termControl.setValue(moment('2020-06-15'));
      termControl.updateValueAndValidity();

      expect(termControl.hasError('terminationDatePast')).toBe(false);
    });

    it('should block new past dates', () => {
      component.mode = 'edit';
      component.editData = createEditData({ terminationDate: '2030-12-31T00:00:00' });
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate')!;
      termControl.setValue(moment('2020-01-01'));
      termControl.updateValueAndValidity();

      expect(termControl.hasError('terminationDatePast')).toBe(true);
    });

    it('should allow future dates', () => {
      component.mode = 'edit';
      component.editData = createEditData({ terminationDate: '2030-12-31T00:00:00' });
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate')!;
      termControl.setValue(moment().add(2, 'years'));
      termControl.updateValueAndValidity();

      expect(termControl.hasError('terminationDatePast')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // normalizeFormValue
  // ---------------------------------------------------------------------------
  describe('normalizeFormValue', () => {
    it('should return stringified form values', () => {
      fixture.detectChanges();
      component.form.patchValue({
        processCode: 'ABC',
        processDescription: 'Desc',
        effectiveDate: moment('2030-06-15'),
        terminationDate: null
      });

      const result = (component as any).normalizeFormValue();
      const parsed = JSON.parse(result);

      expect(parsed.processCode).toBe('ABC');
      expect(parsed.processDescription).toBe('Desc');
      expect(parsed.effectiveDate).toBe('2030-06-15');
      expect(parsed.terminationDate).toBeNull();
    });

    it('should handle null dates', () => {
      fixture.detectChanges();
      component.form.patchValue({
        processCode: 'X',
        processDescription: 'Y',
        effectiveDate: null,
        terminationDate: null
      });

      const result = (component as any).normalizeFormValue();
      const parsed = JSON.parse(result);

      expect(parsed.effectiveDate).toBeNull();
      expect(parsed.terminationDate).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // parseDate
  // ---------------------------------------------------------------------------
  describe('parseDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should parse ISO format dates', () => {
      const result = (component as any).parseDate('2017-03-15T00:00:00');
      expect(moment.isMoment(result)).toBe(true);
      expect(result.format('YYYY-MM-DD')).toBe('2017-03-15');
    });

    it('should parse DD-MMM-YYYY format dates', () => {
      const result = (component as any).parseDate('15-Mar-2017');
      expect(moment.isMoment(result)).toBe(true);
      expect(result.format('YYYY-MM-DD')).toBe('2017-03-15');
    });

    it('should return null for empty or invalid dates', () => {
      expect((component as any).parseDate('')).toBeNull();
      expect((component as any).parseDate(null as any)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // onTextKeyDown
  // ---------------------------------------------------------------------------
  describe('onTextKeyDown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set periodKeyPressed when period key is pressed', () => {
      const event = { key: '.' } as KeyboardEvent;
      component.form.get('processDescription')!.setValue('Hello');

      component.onTextKeyDown(event, 'processDescription');

      expect((component as any).periodKeyPressed).toBe(true);
    });

    it('should snapshot current value before input', () => {
      const event = { key: 'a' } as KeyboardEvent;
      component.form.get('processDescription')!.setValue('Hello');

      component.onTextKeyDown(event, 'processDescription');

      expect((component as any).valueBeforeInput['processDescription']).toBe('Hello');
    });
  });

  // ---------------------------------------------------------------------------
  // sanitizeInput period detection
  // ---------------------------------------------------------------------------
  describe('sanitizeInput period detection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove auto-inserted period (macOS double-space)', () => {
      // Simulate: user had "Hello", then double-space inserted a period => "Hello."
      (component as any).valueBeforeInput['processDescription'] = 'Hello';
      (component as any).periodKeyPressed = false;
      component.form.get('processDescription')!.setValue('Hello.');

      component.sanitizeInput('processDescription');

      expect(component.form.get('processDescription')!.value).toBe('Hello');
    });

    it('should keep period when user pressed period key', () => {
      (component as any).valueBeforeInput['processDescription'] = 'Hello';
      (component as any).periodKeyPressed = true;
      component.form.get('processDescription')!.setValue('Hello.');

      component.sanitizeInput('processDescription');

      // Period should remain because user intentionally pressed '.'
      expect(component.form.get('processDescription')!.value).toBe('Hello.');
    });

    it('should remove leading spaces and collapse multiple spaces', () => {
      component.form.get('processDescription')!.setValue('  Hello   World');
      component.sanitizeInput('processDescription');

      expect(component.form.get('processDescription')!.value).toBe('Hello World');
    });
  });

  // ---------------------------------------------------------------------------
  // onDateInputChange
  // ---------------------------------------------------------------------------
  describe('onDateInputChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store effective date raw input', () => {
      const event = { target: { value: '15-Mar-2030' } };
      component.onDateInputChange(event, 'effectiveDate');

      expect((component as any).effectiveDateRawInput).toBe('15-Mar-2030');
    });

    it('should store termination date raw input', () => {
      const event = { target: { value: '31-Dec-2030' } };
      component.onDateInputChange(event, 'terminationDate');

      expect((component as any).terminationDateRawInput).toBe('31-Dec-2030');
    });
  });

  // ---------------------------------------------------------------------------
  // onDateBlur
  // ---------------------------------------------------------------------------
  describe('onDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onEffectiveDateBlur for effectiveDate', fakeAsync(() => {
      const spy = spyOn(component as any, 'onEffectiveDateBlur');
      component.onDateBlur({}, 'effectiveDate');
      tick(1);

      expect(spy).toHaveBeenCalled();
    }));

    it('should call onTerminationDateBlur for terminationDate', fakeAsync(() => {
      const spy = spyOn(component as any, 'onTerminationDateBlur');
      component.onDateBlur({}, 'terminationDate');
      tick(1);

      expect(spy).toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  // performSave full flow
  // ---------------------------------------------------------------------------
  describe('performSave full flow', () => {
    it('should call addProcessCode for add mode and show success snackbar', fakeAsync(() => {
      fixture.detectChanges();
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(mockEmfProcessesService.addProcessCode).toHaveBeenCalledWith(
        jasmine.objectContaining({ procCode: 'TESTCODE' })
      );
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('created successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should call updateProcessCode for edit mode and show updated snackbar', fakeAsync(() => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2030-01-01T00:00:00' });
      fixture.detectChanges();
      mockEmfProcessesService.updateProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      component.isFormDirty = true;
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(mockEmfProcessesService.updateProcessCode).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('updated successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should show error snackbar on API error without errorCode', fakeAsync(() => {
      fixture.detectChanges();
      const errorResponse = {
        error: { message: 'Something went wrong' }
      };
      mockEmfProcessesService.addProcessCode.and.returnValue(throwError(() => errorResponse));
      makeFormValid();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Something went wrong',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
    }));

    it('should show error snackbar with errorCode when present', fakeAsync(() => {
      fixture.detectChanges();
      const errorResponse = {
        error: {
          errorResponse: { errorCode: '409', error: 'Duplicate entry' }
        }
      };
      mockEmfProcessesService.addProcessCode.and.returnValue(throwError(() => errorResponse));
      makeFormValid();

      component.onSave();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 409: Duplicate entry',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));
  });

  // ---------------------------------------------------------------------------
  // resetForm
  // ---------------------------------------------------------------------------
  describe('resetForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and clear dirty state', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      component.isFormDirty = true;

      component.onAddAndCreateAnother();
      tick();

      expect(component.isFormDirty).toBe(false);
      expect(component.form.get('processCode')!.value).toBeFalsy();
      expect(component.form.get('processDescription')!.value).toBeFalsy();
    }));

    it('should clear raw date inputs', fakeAsync(() => {
      mockEmfProcessesService.addProcessCode.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200 })
      );
      makeFormValid();
      (component as any).effectiveDateRawInput = '15-Mar-2030';
      (component as any).terminationDateRawInput = '31-Dec-2030';

      component.onAddAndCreateAnother();
      tick();

      expect((component as any).effectiveDateRawInput).toBe('');
      expect((component as any).terminationDateRawInput).toBe('');
    }));
  });

  // ---------------------------------------------------------------------------
  // Dirty tracking
  // ---------------------------------------------------------------------------
  describe('Dirty tracking', () => {
    it('should set isFormDirty when form value changes from initial in add mode', fakeAsync(() => {
      fixture.detectChanges();

      expect(component.isFormDirty).toBe(false);

      component.form.get('processDescription')!.setValue('Changed');
      tick();

      expect(component.isFormDirty).toBe(true);
    }));

    it('should track dirty for edit mode with unlocked effectiveDate', fakeAsync(() => {
      component.mode = 'edit';
      component.editData = createEditData({ effectiveDate: '2030-01-01T00:00:00' });
      fixture.detectChanges();

      expect(component.isFormDirty).toBe(false);

      component.form.get('effectiveDate')!.setValue(moment('2031-06-15'));
      tick();

      expect(component.isFormDirty).toBe(true);
    }));
  });
});
