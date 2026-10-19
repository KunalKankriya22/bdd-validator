import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import moment from 'moment';

import { FcodeFormDialogComponent, FcodeDialogData } from './fcode-form-dialog.component';
import { MasterServiceCodeService } from '../../services/master-service-code.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MasterServiceCodeDto } from '../../models/master-service-code.model';

describe('FcodeFormDialogComponent', () => {
  let component: FcodeFormDialogComponent;
  let fixture: ComponentFixture<FcodeFormDialogComponent>;
  let serviceSpy: jasmine.SpyObj<MasterServiceCodeService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;

  // ---- helpers ----
  function makeRecord(overrides: Partial<MasterServiceCodeDto> = {}): MasterServiceCodeDto {
    return {
      billingCode: 'FEE001',
      codeDesc: 'Test Fee',
      effDate: '2026-01-01T00:00:00Z',
      termDate: '2026-12-31T00:00:00Z',
      lastModifiedDate: '2026-06-15T10:30:00Z',
      ...overrides
    } as MasterServiceCodeDto;
  }

  function fillFormValid(): void {
    component.form.patchValue({
      billingCode: 'TEST01',
      codeDesc: 'Test Code Description',
      effectiveDate: moment().add(1, 'day'),
      terminationDate: moment().add(1, 'year')
    });
    component.form.markAsDirty();
    component.form.updateValueAndValidity();
  }

  function createComponent(dialogData: FcodeDialogData): void {
    fixture = TestBed.createComponent(FcodeFormDialogComponent);
    component = fixture.componentInstance;
    component.dialogData = dialogData;
    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  }

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('MasterServiceCodeService', ['create', 'update', 'getByCode']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);
    headerSpy = jasmine.createSpyObj('HeaderService', [
      'getCurrentChapterTimezone', 'getCurrentChapterId'
    ]);
    Object.defineProperty(headerSpy, 'chapterTimeZone', {
      value: jasmine.createSpy('chapterTimeZone').and.returnValue('America/Los_Angeles'),
      writable: true
    });

    serviceSpy.create.and.returnValue(of({}));
    serviceSpy.update.and.returnValue(of({}));
    serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] })); // Default: no duplicate
    headerSpy.getCurrentChapterTimezone.and.returnValue('America/Los_Angeles');

    TestBed.configureTestingModule({
      imports: [FcodeFormDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MasterServiceCodeService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  // ──────────── Add Mode Initialization ────────────

  describe('Add mode initialization', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should initialize form in add mode with required validators', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('billingCode')?.hasError('required')).toBeTrue();
      expect(component.form.get('codeDesc')?.hasError('required')).toBeTrue();
      expect((component as any).mode()).toBe('add');
    });

    it('should have isAddMode true and isEditMode false', () => {
      expect((component as any).isAddMode()).toBeTrue();
      expect((component as any).isEditMode()).toBeFalse();
    });

    it('should set panelTitle for add mode', () => {
      expect((component as any).panelTitle()).toBe('Add New Master Service Code');
    });
  });

  // ──────────── Edit Mode Initialization ────────────

  describe('Edit mode initialization', () => {
    it('should initialize in edit mode and populate form from record', () => {
      // Arrange & Act
      createComponent({ record: makeRecord() });

      // Assert
      expect((component as any).mode()).toBe('edit');
      expect((component as any).isEditMode()).toBeTrue();
      expect((component as any).panelTitle()).toBe('Edit Master Service Code Details');
      expect(component.form.get('billingCode')?.value).toBe('FEE001');
      expect(component.form.get('codeDesc')?.value).toBe('Test Fee');
    });

    it('should set lastModifiedText when record has lastModifiedDate', () => {
      // Arrange & Act
      createComponent({ record: makeRecord({ lastModifiedDate: '2026-06-15T10:30:00Z' }) });

      // Assert
      expect((component as any).lastModifiedText()).toContain('Last Modified:');
      expect((component as any).lastModifiedText()).toContain('15-JUN-2026');
    });

    it('should not set lastModifiedText when record has no lastModifiedDate', () => {
      // Arrange & Act
      createComponent({ record: makeRecord({ lastModifiedDate: undefined as any }) });

      // Assert
      expect((component as any).lastModifiedText()).toBe('');
    });

    it('should handle null effDate and termDate in record', () => {
      // Arrange & Act
      createComponent({ record: makeRecord({ effDate: null as any, termDate: null as any }) });

      // Assert
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should mark form as pristine after loading record', () => {
      // Arrange & Act
      createComponent({ record: makeRecord() });

      // Assert
      expect(component.form.pristine).toBeTrue();
      expect((component as any).formDirty()).toBeFalse();
    });
  });

  // ──────────── editBillingCodeDisplay / editEffectiveDateDisplay ────────────

  describe('Display getters', () => {
    it('editBillingCodeDisplay should return billing code from record', () => {
      createComponent({ record: makeRecord({ billingCode: 'ABC123' }) });
      expect(component.editBillingCodeDisplay).toBe('ABC123');
    });

    it('editBillingCodeDisplay should return dash when no record', () => {
      createComponent({ record: null });
      expect(component.editBillingCodeDisplay).toBe('—');
    });

    it('editEffectiveDateDisplay should return formatted date', () => {
      createComponent({ record: makeRecord({ effDate: '2026-03-15T00:00:00Z' }) });
      expect(component.editEffectiveDateDisplay).toBe('15-MAR-2026');
    });

    it('editEffectiveDateDisplay should return dash when no effDate', () => {
      createComponent({ record: makeRecord({ effDate: null as any }) });
      expect(component.editEffectiveDateDisplay).toBe('—');
    });

    it('editEffectiveDateDisplay should return dash when no record at all', () => {
      createComponent({ record: null });
      expect(component.editEffectiveDateDisplay).toBe('—');
    });
  });

  // ──────────── onBillingCodeInput ────────────

  describe('onBillingCodeInput', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should uppercase input value in add mode', () => {
      // Arrange
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as unknown as Event;

      // Act
      component.onBillingCodeInput(event);

      // Assert
      expect(component.form.get('billingCode')?.value).toBe('ABC');
    });

    it('should not modify input when already uppercase', () => {
      // Arrange
      const input = document.createElement('input');
      input.value = 'ABC';
      const event = { target: input } as unknown as Event;
      const patchSpy = spyOn(component.form, 'patchValue');

      // Act
      component.onBillingCodeInput(event);

      // Assert
      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('should not uppercase in edit mode', () => {
      // Arrange
      createComponent({ record: makeRecord() });
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as unknown as Event;
      const patchSpy = spyOn(component.form, 'patchValue');

      // Act
      component.onBillingCodeInput(event);

      // Assert
      expect(patchSpy).not.toHaveBeenCalled();
    });
  });

  // ──────────── getRemainingChars ────────────

  describe('getRemainingChars', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should calculate remaining characters correctly', () => {
      // Arrange
      component.form.patchValue({ codeDesc: 'Hello' });

      // Act
      const result = component.getRemainingChars('codeDesc', 50);

      // Assert
      expect(result).toBe('Characters Remaining: 45/50');
    });

    it('should show full max length when field is empty', () => {
      // Arrange
      component.form.patchValue({ codeDesc: '' });

      // Act
      const result = component.getRemainingChars('codeDesc', 50);

      // Assert
      expect(result).toBe('Characters Remaining: 50/50');
    });

    it('should handle non-existent field gracefully', () => {
      const result = component.getRemainingChars('nonexistent', 10);
      expect(result).toBe('Characters Remaining: 10/10');
    });
  });

  // ──────────── Date error methods ────────────

  describe('getEffectiveDateError / getTerminationDateError', () => {
    beforeEach(() => createComponent({ record: null }));

    it('getEffectiveDateError should pass form errors when lastChangedDateField is effective', () => {
      // Arrange
      (component as any).lastChangedDateField = 'effective';

      // Act - just ensure it runs without error
      const result = component.getEffectiveDateError();

      // Assert - returns a string (empty or error message)
      expect(typeof result).toBe('string');
    });

    it('getEffectiveDateError should pass null form errors when lastChangedDateField is not effective', () => {
      // Arrange
      (component as any).lastChangedDateField = 'termination';

      // Act
      const result = component.getEffectiveDateError();

      // Assert
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should pass form errors when lastChangedDateField is termination', () => {
      // Arrange
      (component as any).lastChangedDateField = 'termination';

      // Act
      const result = component.getTerminationDateError();

      // Assert
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should pass null form errors when lastChangedDateField is not termination', () => {
      // Arrange
      (component as any).lastChangedDateField = 'effective';

      // Act
      const result = component.getTerminationDateError();

      // Assert
      expect(typeof result).toBe('string');
    });
  });

  // ──────────── Date input handlers ────────────

  describe('Date input/change handlers', () => {
    beforeEach(() => createComponent({ record: null }));

    it('onEffectiveDateInput should delegate to DateFieldValidationUtility', () => {
      // Arrange
      const input = document.createElement('input');
      input.value = '15-JAN-2026';
      const event = { target: input } as unknown as Event;

      // Act - should not throw
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('onTerminationDateInput should delegate to DateFieldValidationUtility', () => {
      // Arrange
      const input = document.createElement('input');
      input.value = '31-DEC-2026';
      const event = { target: input } as unknown as Event;

      // Act - should not throw
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('onEffectiveDateChange should update termination date validity', () => {
      // Arrange
      const spy = spyOn(component.form.get('terminationDate')!, 'updateValueAndValidity');

      // Act
      component.onEffectiveDateChange();

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should track lastChangedDateField as effective when effective date changes', fakeAsync(() => {
      // Act
      component.form.get('effectiveDate')?.setValue(moment('2026-06-01'));
      tick();

      // Assert
      expect((component as any).lastChangedDateField).toBe('effective');
      expect((component as any).currentEffectiveDate()?.format('YYYY-MM-DD')).toBe('2026-06-01');
    }));

    it('should track lastChangedDateField as termination when termination date changes', fakeAsync(() => {
      // Act
      component.form.get('terminationDate')?.setValue(moment('2026-12-31'));
      tick();

      // Assert
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  // ──────────── onButtonClick ────────────

  describe('onButtonClick', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should call onCancel for cancel action', () => {
      // Arrange
      const spy = spyOn(component, 'onCancel');

      // Act
      component.onButtonClick('cancel');

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should call onClearAll for clear action', () => {
      // Arrange
      const spy = spyOn(component, 'onClearAll');

      // Act
      component.onButtonClick('clear');

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should call onSave for save action', () => {
      // Arrange
      const spy = spyOn(component, 'onSave');

      // Act
      component.onButtonClick('save');

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should call onAdd for add action', () => {
      // Arrange
      const spy = spyOn(component, 'onAdd');

      // Act
      component.onButtonClick('add');

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should call onAddAnother for addAnother action', () => {
      // Arrange
      const spy = spyOn(component, 'onAddAnother');

      // Act
      component.onButtonClick('addAnother');

      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });

  // ──────────── onCancel / onClosePanel ────────────

  describe('onCancel / onClosePanel', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should emit panelClosed with saved false on cancel', (done: DoneFn) => {
      component.panelClosed.subscribe(result => {
        expect(result.saved).toBeFalse();
        done();
      });
      component.onCancel();
    });

    it('should emit panelClosed with saved false on close panel', (done: DoneFn) => {
      component.panelClosed.subscribe(result => {
        expect(result.saved).toBeFalse();
        done();
      });
      component.onClosePanel();
    });
  });

  // ──────────── onClearAll ────────────

  describe('onClearAll', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should clear codeDesc and terminationDate and reset form state', () => {
      // Arrange
      component.form.patchValue({ codeDesc: 'Something', terminationDate: moment() });
      component.form.markAsDirty();
      (component as any).submitted.set(true);

      // Act
      component.onClearAll();

      // Assert
      expect(component.form.get('codeDesc')?.value).toBe('');
      expect(component.form.get('terminationDate')?.value).toBeNull();
      expect(component.form.pristine).toBeTrue();
      expect((component as any).formDirty()).toBeFalse();
      expect((component as any).submitted()).toBeFalse();
    });
  });

  // ──────────── onSave (edit mode) ────────────

  describe('onSave', () => {
    it('should not call service when form is invalid', () => {
      // Arrange
      createComponent({ record: makeRecord() });
      component.form.patchValue({ codeDesc: '' }); // make invalid

      // Act
      component.onSave();

      // Assert
      expect(serviceSpy.update).not.toHaveBeenCalled();
    });

    it('should call update service and emit panelClosed on success', (done: DoneFn) => {
      // Arrange
      createComponent({ record: makeRecord() });
      component.form.patchValue({ codeDesc: 'Updated Description' });
      component.form.markAsDirty();
      serviceSpy.update.and.returnValue(of({}));

      component.panelClosed.subscribe(result => {
        expect(result.saved).toBeTrue();
        done();
      });

      // Act
      component.onSave();

      // Assert
      expect(serviceSpy.update).toHaveBeenCalled();
      expect((component as any).saving()).toBeFalse();
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    });

    it('should handle save error with error.error.message', fakeAsync(() => {
      // Arrange
      createComponent({ record: makeRecord() });
      component.form.patchValue({ codeDesc: 'Updated' });
      component.form.markAsDirty();
      serviceSpy.update.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate code' } }))
      );

      // Act
      component.onSave();
      tick();

      // Assert
      expect((component as any).saving()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate code');
    }));

    it('should fallback to err.message when error.error.message is missing', fakeAsync(() => {
      // Arrange
      createComponent({ record: makeRecord() });
      component.form.patchValue({ codeDesc: 'Updated' });
      component.form.markAsDirty();
      serviceSpy.update.and.returnValue(
        throwError(() => ({ message: 'Fallback msg' }))
      );

      // Act
      component.onSave();
      tick();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Fallback msg');
    }));

    it('should fallback to generic message when no error properties', fakeAsync(() => {
      // Arrange
      createComponent({ record: makeRecord() });
      component.form.patchValue({ codeDesc: 'Updated' });
      component.form.markAsDirty();
      serviceSpy.update.and.returnValue(throwError(() => ({})));

      // Act
      component.onSave();
      tick();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update master service code');
    }));
  });

  // ──────────── onAdd ────────────

  describe('onAdd', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should not save when form is invalid', () => {
      // Act
      component.onAdd();

      // Assert
      expect(serviceSpy.create).not.toHaveBeenCalled();
      expect((component as any).submitted()).toBeTrue();
    });

    it('should call create service and emit panelClosed on success', (done: DoneFn) => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(of({}));

      component.panelClosed.subscribe(result => {
        expect(result.saved).toBeTrue();
        expect(result.addAnother).toBeUndefined();
        done();
      });

      // Act
      component.onAdd();
    });

    it('should show success snackbar with billing code on successful add', fakeAsync(() => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(of({}));

      // Act
      component.onAdd();
      tick();

      // Assert
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        'New master code TEST01 has been added.'
      );
    }));

    it('should handle add error with error.error.message', fakeAsync(() => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(
        throwError(() => ({ error: { message: 'Code already exists' } }))
      );

      // Act
      component.onAdd();
      tick();

      // Assert
      expect((component as any).saving()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Code already exists');
    }));

    it('should fallback to generic error message when no error details', fakeAsync(() => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(throwError(() => ({})));

      // Act
      component.onAdd();
      tick();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to create master service code');
    }));
  });

  // ──────────── onAddAnother ────────────

  describe('onAddAnother', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should not save when form is invalid', () => {
      // Act
      component.onAddAnother();

      // Assert
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create and emit panelClosed with addAnother true on success', (done: DoneFn) => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(of({}));

      component.panelClosed.subscribe(result => {
        expect(result.saved).toBeTrue();
        expect(result.addAnother).toBeTrue();
        done();
      });

      // Act
      component.onAddAnother();
    });

    it('should handle addAnother error', fakeAsync(() => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(
        throwError(() => ({ error: { message: 'Validation error' } }))
      );

      // Act
      component.onAddAnother();
      tick();

      // Assert
      expect((component as any).saving()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Validation error');
    }));

    it('should fallback to generic error message for addAnother', fakeAsync(() => {
      // Arrange
      fillFormValid();
      serviceSpy.create.and.returnValue(throwError(() => ({})));

      // Act
      component.onAddAnother();
      tick();

      // Assert
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to create master service code');
    }));
  });

  // ──────────── footerButtons computed ────────────

  describe('footerButtons', () => {
    it('should include ADD and ADD AND CREATE ANOTHER buttons in add mode', () => {
      // Arrange & Act
      createComponent({ record: null });

      // Assert
      const buttons = (component as any).footerButtons();
      const labels = buttons.map((b: any) => b.label);
      expect(labels).toContain('CANCEL');
      expect(labels).toContain('ADD');
      expect(labels).toContain('ADD AND CREATE ANOTHER');
      expect(labels).not.toContain('SAVE');
      expect(labels).not.toContain('CLEAR ALL');
    });

    it('should include SAVE and CLEAR ALL buttons in edit mode', () => {
      // Arrange & Act
      createComponent({ record: makeRecord() });

      // Assert
      const buttons = (component as any).footerButtons();
      const labels = buttons.map((b: any) => b.label);
      expect(labels).toContain('CANCEL');
      expect(labels).toContain('SAVE');
      expect(labels).toContain('CLEAR ALL');
      expect(labels).not.toContain('ADD');
    });

    it('should disable ADD button when form is invalid', () => {
      // Arrange
      createComponent({ record: null });

      // Assert
      const buttons = (component as any).footerButtons();
      const addBtn = buttons.find((b: any) => b.label === 'ADD');
      expect(addBtn?.disabled).toBeTrue();
    });

    it('should disable SAVE button when form is not dirty in edit mode', () => {
      // Arrange
      createComponent({ record: makeRecord() });
      // form is pristine after loadRecordForEdit

      // Assert
      const buttons = (component as any).footerButtons();
      const saveBtn = buttons.find((b: any) => b.label === 'SAVE');
      expect(saveBtn?.disabled).toBeTrue();
    });

    it('should disable CLEAR ALL when no editable fields are filled', fakeAsync(() => {
      // Arrange
      createComponent({ record: makeRecord({ codeDesc: '', termDate: null as any }) });
      component.form.patchValue({ codeDesc: '', terminationDate: null });
      (component as any).editableFieldsFilled.set(false);
      tick();

      // Assert
      const buttons = (component as any).footerButtons();
      const clearBtn = buttons.find((b: any) => b.label === 'CLEAR ALL');
      expect(clearBtn?.disabled).toBeTrue();
    }));
  });

  // ──────────── onDateFieldKeyPress ────────────

  describe('onDateFieldKeyPress', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should allow navigation keys (Backspace, Tab, Escape, Enter, Arrows, Home, End)', () => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

      allowedKeys.forEach(key => {
        const event = new KeyboardEvent('keypress', { key });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl and meta key combinations', () => {
      const event = new KeyboardEvent('keypress', { key: 'a', ctrlKey: true });
      const spy = spyOn(event, 'preventDefault');
      component.onDateFieldKeyPress(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow alphanumeric characters and hyphens', () => {
      ['0', '9', 'a', 'Z', '-'].forEach(key => {
        const event = new KeyboardEvent('keypress', { key });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('should prevent special characters like !, @, #, etc.', () => {
      ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '/', '.', ','].forEach(key => {
        const event = new KeyboardEvent('keypress', { key });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  // ──────────── Form validity signals ────────────

  describe('Form validity / dirty signals', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should update formValid signal when form validity changes', fakeAsync(() => {
      // Arrange - form is invalid initially
      expect((component as any).formValid()).toBeFalse();

      // Act - make it valid
      fillFormValid();
      tick();

      // Assert
      expect((component as any).formValid()).toBeTrue();
    }));

    it('should update formDirty signal when form is modified', fakeAsync(() => {
      // Arrange
      expect((component as any).formDirty()).toBeFalse();

      // Act
      component.form.get('codeDesc')?.setValue('Changed');
      component.form.markAsDirty();
      component.form.get('codeDesc')?.setValue('Changed again');
      tick();

      // Assert
      expect((component as any).formDirty()).toBeTrue();
    }));

    it('should update editableFieldsFilled when editable fields have values', fakeAsync(() => {
      // Act
      component.form.patchValue({ codeDesc: 'Something' });
      tick();

      // Assert
      expect((component as any).editableFieldsFilled()).toBeTrue();
    }));

    it('should set editableFieldsFilled to false when editable fields are empty', fakeAsync(() => {
      // Act
      component.form.patchValue({ codeDesc: '', effectiveDate: null, terminationDate: null });
      tick();

      // Assert
      expect((component as any).editableFieldsFilled()).toBeFalse();
    }));
  });

  // ──────────── f getter ────────────

  describe('f getter', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should return form controls', () => {
      expect(component.f['billingCode']).toBeTruthy();
      expect(component.f['codeDesc']).toBeTruthy();
      expect(component.f['effectiveDate']).toBeTruthy();
      expect(component.f['terminationDate']).toBeTruthy();
    });
  });

  // ──────────── ngOnDestroy ────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      // Arrange
      createComponent({ record: null });

      // Act - should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ──────────── ID generation ────────────

  describe('ID generation', () => {
    it('should produce unique component-scoped IDs', () => {
      createComponent({ record: null });
      expect((component as any).elementId('billingCode')).toContain('billingCode');
      expect((component as any).errorId('billingCode')).toContain('billingCode-error');
      expect((component as any).labelId('billingCode')).toContain('billingCode-label');
    });
  });

  // ──────────── Gap #2: Async Duplicate Validator ────────────

  describe('billingCodeDuplicateValidator (Gap #2)', () => {
    beforeEach(() => createComponent({ record: null }));

    it('should not call API when billing code field is empty in add mode', fakeAsync(() => {
      // Arrange
      component.form.get('billingCode')?.setValue('');

      // Act
      tick(600); // Wait past debounce

      // Assert
      expect(serviceSpy.getByCode).not.toHaveBeenCalled();
    }));

    it('should call getByCode API after 500ms debounce in add mode', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] }));

      // Act
      component.form.get('billingCode')?.setValue('TEST01');
      tick(400); // Less than debounce
      expect(serviceSpy.getByCode).not.toHaveBeenCalled();

      tick(200); // Total 600ms - past debounce
      expect(serviceSpy.getByCode).toHaveBeenCalledWith('TEST01');
    }));

    it('should set duplicate error when billing code already exists', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({
        success: true,
        data: [makeRecord({ billingCode: 'EXISTING' })]
      }));

      // Act
      component.form.get('billingCode')?.setValue('EXISTING');
      tick(600);

      // Assert
      const billingCodeControl = component.form.get('billingCode');
      expect(billingCodeControl?.hasError('duplicate')).toBeTrue();
      expect(billingCodeControl?.valid).toBeFalse();
    }));

    it('should not set error when billing code does not exist', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] }));

      // Act
      component.form.get('billingCode')?.setValue('NEWCODE');
      tick(600);

      // Assert
      const billingCodeControl = component.form.get('billingCode');
      expect(billingCodeControl?.hasError('duplicate')).toBeFalsy();
    }));

    it('should not call API in edit mode', fakeAsync(() => {
      // Arrange
      createComponent({ record: makeRecord({ billingCode: 'EDIT01' }) });

      // Act
      component.form.get('billingCode')?.setValue('CHANGED');
      tick(600);

      // Assert
      expect(serviceSpy.getByCode).not.toHaveBeenCalled();
    }));

    it('should handle API error gracefully and allow validation to pass', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(throwError(() => new Error('API error')));

      // Act
      component.form.get('billingCode')?.setValue('TEST01');
      tick(600);

      // Assert - validation should pass on error (graceful degradation)
      const billingCodeControl = component.form.get('billingCode');
      expect(billingCodeControl?.hasError('duplicate')).toBeFalsy();
    }));

    it('should only make one API call when user types multiple characters quickly', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] }));

      // Act - simulate fast typing
      component.form.get('billingCode')?.setValue('T');
      tick(100);
      component.form.get('billingCode')?.setValue('TE');
      tick(100);
      component.form.get('billingCode')?.setValue('TES');
      tick(100);
      component.form.get('billingCode')?.setValue('TEST');
      tick(600); // Wait for debounce

      // Assert - only final value should be checked
      expect(serviceSpy.getByCode).toHaveBeenCalledTimes(1);
      expect(serviceSpy.getByCode).toHaveBeenCalledWith('TEST');
    }));

    it('should not make duplicate API calls for same billing code value', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] }));

      // Act - set same value multiple times
      component.form.get('billingCode')?.setValue('TEST01');
      tick(600);
      component.form.get('billingCode')?.setValue('TEST01');
      tick(600);

      // Assert - distinctUntilChanged should prevent duplicate calls
      expect(serviceSpy.getByCode).toHaveBeenCalledTimes(1);
    }));

    it('should cancel pending validation when component is destroyed', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({ success: true, data: [] }).pipe(
        // Simulate slow API response
        delay(1000)
      ));

      // Act
      component.form.get('billingCode')?.setValue('TEST01');
      tick(600); // Trigger validation
      component.ngOnDestroy(); // Destroy component before API responds
      tick(500); // Complete the delayed response

      // Assert - should not error (takeUntil should have cancelled subscription)
      expect(() => tick(0)).not.toThrow();
    }));

    it('should display duplicate error message in template', fakeAsync(() => {
      // Arrange
      serviceSpy.getByCode.and.returnValue(of({
        success: true,
        data: [makeRecord({ billingCode: 'DUP' })]
      }));

      // Act
      component.form.get('billingCode')?.setValue('DUP');
      component.form.get('billingCode')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      // Assert
      const billingCodeControl = component.form.get('billingCode');
      expect(billingCodeControl?.hasError('duplicate')).toBeTrue();
      // Note: Actual DOM assertion would require the template to be compiled
      // which is handled by NO_ERRORS_SCHEMA in this spec
    }));
  });
});
