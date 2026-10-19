import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import moment from 'moment';

import { AddEditValidAbo } from './add-edit-valid-abo';
import { ValidAboService } from '../services/valid-abo.service';
import { HeaderService } from '@shared/services/header.service';

describe('AddEditValidAbo', () => {
  let validAboServiceSpy: any;
  let component: AddEditValidAbo;
  let fixture: ComponentFixture<AddEditValidAbo>;
  let snackBar: MatSnackBar;
  let validAboService: jasmine.SpyObj<ValidAboService>;

  // Helper to format date in local timezone (matches component's formatDate)
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const mockLookupsData = {
    intendedUse: [
      { code: 'RG', description: 'Default' },
      { code: 'EM', description: 'Emergency' },
      { code: 'AO', description: 'Autologous' },
      { code: 'AB', description: 'Biohazardous' }
    ],
    unitScheme: [
      { code: 'ISBT128', description: 'ISBT 128' },
      { code: 'Codabar', description: 'Codabar' }
    ],
    transfusionStatus: [
      { code: 'Transfusable', description: 'Transfusable' },
      { code: 'Not Transfusable', description: 'Not Transfusable' },
      { code: 'Biohazard', description: 'Biohazard' },
      { code: 'Manufacturing', description: 'Manufacturing' },
      { code: 'HOLD', description: 'HOLD' }
    ]
  };

  // Use dynamic dates for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const futureDate = new Date(today);
  futureDate.setMonth(today.getMonth() + 6);

  const mockRecord = {
    code: 'A+',
    description: 'A Positive',
    intendedUse: 'RG',
    unitScheme: 'ISBT128',
    transfusionStatus: 'Transfusable',
    mnemonic1: 'APOS',
    mnemonic2: 'AP',
    group: '1',
    sequence: 10,
    effectiveDate: formatLocalDate(tomorrow),
    terminationDate: formatLocalDate(futureDate)
  };

  beforeEach(() => {
    const snackBarMock = {
      open: jasmine.createSpy('open').and.returnValue({
        dismiss: jasmine.createSpy('dismiss')
      })
    };

    validAboServiceSpy = jasmine.createSpyObj('ValidAboService', [
      'getValidAboLookups',
      'createValidAbo',
      'updateValidAbo'
    ]);

    validAboServiceSpy.getValidAboLookups.and.returnValue(of(mockLookupsData));
    validAboServiceSpy.createValidAbo.and.returnValue(of({ success: true }));
    validAboServiceSpy.updateValidAbo.and.returnValue(of({ success: true }));

    const headerServiceMock = {
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC')
    };

    TestBed.configureTestingModule({
      imports: [
        AddEditValidAbo,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ValidAboService, useValue: validAboServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
      ],
    })
    .overrideComponent(AddEditValidAbo, {
      remove: { providers: [] },
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarMock }] }
    });

    validAboServiceSpy.getValidAboLookups.calls.reset();
    validAboServiceSpy.createValidAbo.calls.reset();
    validAboServiceSpy.updateValidAbo.calls.reset();
    validAboServiceSpy.getValidAboLookups.and.returnValue(of(mockLookupsData));
    validAboServiceSpy.createValidAbo.and.returnValue(of({ success: true }));
    validAboServiceSpy.updateValidAbo.and.returnValue(of({ success: true }));

    snackBar = TestBed.inject(MatSnackBar);
    validAboService = TestBed.inject(ValidAboService) as jasmine.SpyObj<ValidAboService>;

    fixture = TestBed.createComponent(AddEditValidAbo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should initialize form in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = mockRecord;
      editComponent.ngOnInit();

      expect(editComponent.mode).toBe('edit');
      expect(editComponent.panelTitle).toBe('Edit Record');
      expect(editComponent.form.get('code')?.value).toBe(mockRecord.code);
      expect(editComponent.form.get('code')?.disabled).toBe(true);
    });

    it('should populate form with record data in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = mockRecord;
      editComponent.ngOnInit();

      expect(editComponent.form.get('description')?.value).toBe(mockRecord.description);
      expect(editComponent.form.get('intendedUse')?.value).toBe(mockRecord.intendedUse);
      expect(editComponent.form.get('unitScheme')?.value).toBe(mockRecord.unitScheme);
      expect(editComponent.form.get('transfusionStatus')?.value).toBe(mockRecord.transfusionStatus);
      expect(editComponent.form.get('mnemonic1')?.value).toBe(mockRecord.mnemonic1);
      expect(editComponent.form.get('mnemonic2')?.value).toBe(mockRecord.mnemonic2);
      expect(editComponent.form.get('group')?.value).toBe(mockRecord.group);
      expect(editComponent.form.get('sequence')?.value).toBe(mockRecord.sequence);
    });
  });

  describe('Form Validation', () => {
    it('should require code field', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('');
      expect(codeControl?.hasError('required')).toBe(true);
    });

    it('should require description field', () => {
      const descControl = component.form.get('description');
      descControl?.setValue('');
      expect(descControl?.hasError('required')).toBe(true);
    });

    it('should require intendedUse field', () => {
      const intendedUseControl = component.form.get('intendedUse');
      intendedUseControl?.setValue('');
      expect(intendedUseControl?.hasError('required')).toBe(true);
    });

    it('should require unitScheme field', () => {
      const unitSchemeControl = component.form.get('unitScheme');
      unitSchemeControl?.setValue('');
      expect(unitSchemeControl?.hasError('required')).toBe(true);
    });

    it('should require transfusionStatus field', () => {
      const transfusionStatusControl = component.form.get('transfusionStatus');
      transfusionStatusControl?.setValue('');
      expect(transfusionStatusControl?.hasError('required')).toBe(true);
    });

    it('should require effectiveDate field', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      effectiveDateControl?.setValue(null);
      expect(effectiveDateControl?.hasError('required')).toBe(true);
    });

    it('should validate code pattern - rejects special characters', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('A+@');
      expect(codeControl?.hasError('pattern')).toBe(true);
    });

    it('should validate code pattern - accepts alphanumeric only', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('AB01');
      expect(codeControl?.hasError('pattern')).toBe(false);
    });

    it('should validate mnemonic1 pattern - accepts alphanumeric with spaces', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('APOS 123');
      expect(control?.hasError('pattern')).toBe(false);
    });

    it('should validate mnemonic1 pattern - rejects special characters', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('APOS@#');
      expect(control?.hasError('pattern')).toBe(true);
    });

    it('should validate mnemonic2 pattern - accepts alphanumeric with spaces', () => {
      const control = component.form.get('mnemonic2');
      control?.setValue('MNE 456');
      expect(control?.hasError('pattern')).toBe(false);
    });

    it('should validate mnemonic2 pattern - rejects special characters', () => {
      const control = component.form.get('mnemonic2');
      control?.setValue('MNE!@#');
      expect(control?.hasError('pattern')).toBe(true);
    });

    it('should allow numeric characters in mnemonic1', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('APOS123');
      expect(control?.hasError('pattern')).toBe(false);
    });

    it('should allow numeric characters in mnemonic2', () => {
      const control = component.form.get('mnemonic2');
      control?.setValue('456MNE');
      expect(control?.hasError('pattern')).toBe(false);
    });

    it('should validate mnemonic1 maxlength is 20', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('A'.repeat(21));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept mnemonic1 of 20 characters', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('A'.repeat(20));
      expect(control?.hasError('maxlength')).toBe(false);
    });

    it('should validate description maxlength is 50', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(51));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept description of 50 characters', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(50));
      expect(control?.hasError('maxlength')).toBe(false);
    });
  });

  describe('preventSpecialCharsInCode', () => {
    it('should allow alphanumeric keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'A' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block special character keys', () => {
      const event = new KeyboardEvent('keydown', { key: '@' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Backspace key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C (copy)', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block plus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '+' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block hyphen', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInCode(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('preventSpecialCharsInMnemonic', () => {
    it('should allow alphanumeric keys', () => {
      const input = document.createElement('input');
      input.value = 'A';
      Object.defineProperty(input, 'selectionStart', { value: 1, writable: true });
      const event = new KeyboardEvent('keydown', { key: 'B' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow digit keys', () => {
      const input = document.createElement('input');
      input.value = 'A';
      Object.defineProperty(input, 'selectionStart', { value: 1, writable: true });
      const event = new KeyboardEvent('keydown', { key: '7' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow space key when not at position 0', () => {
      const input = document.createElement('input');
      input.value = 'AB';
      Object.defineProperty(input, 'selectionStart', { value: 2, writable: true });
      const event = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block space key at position 0', () => {
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(input, 'selectionStart', { value: 0, writable: true });
      const event = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block special characters', () => {
      const input = document.createElement('input');
      input.value = 'AB';
      Object.defineProperty(input, 'selectionStart', { value: 2, writable: true });
      const event = new KeyboardEvent('keydown', { key: '#' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow Backspace key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V (paste)', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic2');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onCodeInput - paste sanitization', () => {
    it('should strip special characters from pasted text', () => {
      const input = document.createElement('input');
      input.value = 'A+@B';
      Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });
      const event = { target: input } as unknown as Event;

      component.onCodeInput(event);

      expect(component.form.get('code')?.value).toBe('AB');
      expect(input.value).toBe('AB');
    });

    it('should strip spaces from pasted text', () => {
      const input = document.createElement('input');
      input.value = 'A B';
      Object.defineProperty(input, 'selectionStart', { value: 3, writable: true });
      const event = { target: input } as unknown as Event;

      component.onCodeInput(event);

      expect(component.form.get('code')?.value).toBe('AB');
      expect(input.value).toBe('AB');
    });

    it('should keep valid alphanumeric pasted text unchanged', () => {
      const input = document.createElement('input');
      input.value = 'AB12';
      Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });
      const event = { target: input } as unknown as Event;

      component.onCodeInput(event);

      expect(input.value).toBe('AB12');
    });
  });

  describe('onMnemonicInput - paste sanitization', () => {
    it('should strip special characters from pasted text', () => {
      const input = document.createElement('input');
      input.value = 'APOS@#123';
      Object.defineProperty(input, 'selectionStart', { value: 9, writable: true });
      const event = { target: input } as unknown as Event;

      component.onMnemonicInput(event, 'mnemonic1');

      expect(component.form.get('mnemonic1')?.value).toBe('APOS123');
      expect(input.value).toBe('APOS123');
    });

    it('should strip leading spaces from pasted text', () => {
      const input = document.createElement('input');
      input.value = '  APOS';
      Object.defineProperty(input, 'selectionStart', { value: 6, writable: true });
      const event = { target: input } as unknown as Event;

      component.onMnemonicInput(event, 'mnemonic1');

      expect(component.form.get('mnemonic1')?.value).toBe('APOS');
      expect(input.value).toBe('APOS');
    });

    it('should preserve internal spaces in pasted text', () => {
      const input = document.createElement('input');
      input.value = 'APOS 123';
      Object.defineProperty(input, 'selectionStart', { value: 8, writable: true });
      const event = { target: input } as unknown as Event;

      component.onMnemonicInput(event, 'mnemonic2');

      expect(input.value).toBe('APOS 123');
    });

    it('should keep valid alphanumeric pasted text unchanged', () => {
      const input = document.createElement('input');
      input.value = 'MNE789';
      Object.defineProperty(input, 'selectionStart', { value: 6, writable: true });
      const event = { target: input } as unknown as Event;

      component.onMnemonicInput(event, 'mnemonic2');

      expect(input.value).toBe('MNE789');
    });

    it('should handle pasted text that is entirely special characters', () => {
      const input = document.createElement('input');
      input.value = '@#$%^&';
      Object.defineProperty(input, 'selectionStart', { value: 6, writable: true });
      const event = { target: input } as unknown as Event;

      component.onMnemonicInput(event, 'mnemonic1');

      expect(component.form.get('mnemonic1')?.value).toBe('');
      expect(input.value).toBe('');
    });
  });

  describe('intendedUse value binding', () => {
    it('should extract code from display value in edit mode', () => {
      component.mode = 'edit';
      component.data = { intendedUse: 'RG-Default' } as any;
      component.ngOnInit();
      expect(component.form.get('intendedUse')?.value).toBe('RG');
    });

    it('should extract code from value with slashes in description', () => {
      component.mode = 'edit';
      component.data = { intendedUse: 'AE-Autologous/Eligible' } as any;
      component.ngOnInit();
      expect(component.form.get('intendedUse')?.value).toBe('AE');
    });

    it('should handle empty intendedUse in edit mode', () => {
      component.mode = 'edit';
      component.data = { intendedUse: '' } as any;
      component.ngOnInit();
      expect(component.form.get('intendedUse')?.value).toBe('');
    });

    it('should handle null intendedUse in edit mode', () => {
      component.mode = 'edit';
      component.data = { intendedUse: null } as any;
      component.ngOnInit();
      expect(component.form.get('intendedUse')?.value).toBe('');
    });
  });

  describe('getMnemonic1Error', () => {
    it('should return pattern error message for special characters', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('APOS@#');
      control?.markAsTouched();
      expect(component.getMnemonic1Error()).toBe('Only alphanumeric characters allowed (no special characters)');
    });

    it('should return maxlength error message when exceeded', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('A'.repeat(21));
      control?.markAsTouched();
      expect(component.getMnemonic1Error()).toBe('Mnemonic must not exceed 20 characters');
    });

    it('should return empty string when value is valid', () => {
      const control = component.form.get('mnemonic1');
      control?.setValue('APOS123');
      control?.markAsTouched();
      expect(component.getMnemonic1Error()).toBe('');
    });
  });

  describe('getMnemonic2Error', () => {
    it('should return pattern error message for special characters', () => {
      const control = component.form.get('mnemonic2');
      control?.setValue('MNE!@#');
      control?.markAsTouched();
      expect(component.getMnemonic2Error()).toBe('Only alphanumeric characters allowed (no special characters)');
    });

    it('should return empty string when numeric value is valid', () => {
      const control = component.form.get('mnemonic2');
      control?.setValue('MNE789');
      control?.markAsTouched();
      expect(component.getMnemonic2Error()).toBe('');
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      const editModeEffectiveDate = new Date();
      editModeEffectiveDate.setDate(editModeEffectiveDate.getDate() + 5);
      const editModeTerminationDate = new Date();
      editModeTerminationDate.setMonth(editModeTerminationDate.getMonth() + 8);

      component.mode = 'edit';
      component.data = mockRecord;
      // Reinitialize the form with record data
      component.ngOnInit();
      component.form.patchValue({
        code: 'A+',
        description: 'Updated A Positive',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Not Transfusable',
        mnemonic1: 'APOS',
        mnemonic2: 'AP',
        group: '1',
        sequence: 10,
        effectiveDate: editModeEffectiveDate,
        terminationDate: editModeTerminationDate
      });
      component.form.markAsDirty();
    });

    it('should update record successfully in edit mode', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      flush();

      expect(validAboService.updateValidAbo).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Code A+ has been successfully updated.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should not emit events on update error', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        mnemonic1: 'APOS',
        mnemonic2: 'AP'
      });

      validAboService.updateValidAbo.and.returnValue(throwError(() => new Error('API Error')));

      try {
        component.onSave();
        flush();
      } catch (e) {
        // Error propagates to authInterceptor — expected
      }

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should format dates correctly in update', () => {
      const editModeEffectiveDate = new Date();
      editModeEffectiveDate.setDate(editModeEffectiveDate.getDate() + 5);
      const editModeTerminationDate = new Date();
      editModeTerminationDate.setMonth(editModeTerminationDate.getMonth() + 8);

      // Make form valid
      component.form.patchValue({
        mnemonic1: 'APOS',
        mnemonic2: 'AP'
      });

      component.onSave();

      expect(validAboService.updateValidAbo).toHaveBeenCalledWith(
        'A+',
        jasmine.objectContaining({
          effectiveDate: formatLocalDate(editModeEffectiveDate),
          terminationDate: formatLocalDate(editModeTerminationDate)
        })
      );
    });
  });

  describe('loadDropdowns', () => {
    it('should handle error loading dropdowns', fakeAsync(() => {
      validAboService.getValidAboLookups.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadDropdowns();
      flush();
    }));

    it('should load intendedUse options from API', () => {
      component.loadDropdowns();
      expect(component.intendedUseOptions.map(o => o.code)).toContain('RG');
      expect(component.intendedUseOptions.map(o => o.code)).toContain('EM');
      expect(component.intendedUseOptions.map(o => o.code)).toContain('AO');
      expect(component.intendedUseOptions.map(o => o.code)).toContain('AB');
    });

    it('should load unitScheme options from API', () => {
      expect(component.unitSchemeOptions.map(o => o.code)).toContain('ISBT128');
      expect(component.unitSchemeOptions.map(o => o.code)).toContain('Codabar');
    });

    it('should load transfusionStatus options from API', () => {
      expect(component.transfusionStatusOptions.map(o => o.code)).toContain('Transfusable');
      expect(component.transfusionStatusOptions.map(o => o.code)).toContain('Not Transfusable');
      expect(component.transfusionStatusOptions.map(o => o.code)).toContain('Biohazard');
      expect(component.transfusionStatusOptions.map(o => o.code)).toContain('Manufacturing');
      expect(component.transfusionStatusOptions.map(o => o.code)).toContain('HOLD');
    });

    it('should handle empty data in loadDropdowns', () => {
      validAboService.getValidAboLookups.and.returnValue(of({
        intendedUse: [],
        unitScheme: [],
        transfusionStatus: []
      }));

      component.loadDropdowns();

      expect(component.intendedUseOptions).toEqual([]);
      expect(component.unitSchemeOptions).toEqual([]);
      expect(component.transfusionStatusOptions).toEqual([]);
    });
  });

  // ========================================================================
  // NEW TESTS -- appended to increase coverage
  // ========================================================================

  describe('Initialization - add mode', () => {
    it('should default to add mode with panelTitle Add New Record', () => {
      expect(component.mode).toBe('add');
      expect(component.panelTitle).toBe('Add New Record');
    });

    it('should have code field enabled in add mode', () => {
      expect(component.form.get('code')?.disabled).toBe(false);
    });

    it('should initialise with empty form values in add mode', () => {
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should call setupPanel when mode changes after first change', () => {
      spyOn(component as any, 'setupPanel' as never).and.callThrough();
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });
      expect((component as any).setupPanel).toHaveBeenCalled();
    });

    it('should call setupPanel when data changes after first change', () => {
      spyOn(component as any, 'setupPanel' as never).and.callThrough();
      component.ngOnChanges({
        data: new SimpleChange(null, mockRecord, false)
      });
      expect((component as any).setupPanel).toHaveBeenCalled();
    });

    it('should NOT call setupPanel on first change', () => {
      spyOn(component as any, 'setupPanel' as never).and.callThrough();
      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true)
      });
      expect((component as any).setupPanel).not.toHaveBeenCalled();
    });

    it('should ignore unrelated property changes', () => {
      spyOn(component as any, 'setupPanel' as never).and.callThrough();
      component.ngOnChanges({
        someOtherProp: new SimpleChange(null, 'x', false)
      });
      expect((component as any).setupPanel).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel when not in dialog mode', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should close dialogRef when in dialog mode', () => {
      const mockDialogRef = { close: jasmine.createSpy('close') };
      (component as any).isDialogMode = true;
      (component as any).dialogRef = mockDialogRef;
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();

      const futureEffective = moment().add(3, 'days').startOf('day');
      const futureTerm = moment().add(90, 'days').startOf('day');

      component.form.patchValue({
        code: 'BN',
        description: 'B Negative',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: 'BNEG',
        mnemonic2: 'BN',
        group: '2',
        sequence: 5,
        effectiveDate: futureEffective,
        terminationDate: futureTerm
      });
    });

    it('should create record successfully in add mode', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      flush();

      expect(validAboService.createValidAbo).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('BN'),
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should set isSaving to false after successful add', fakeAsync(() => {
      component.onSave();
      flush();
      expect(component.isSaving).toBe(false);
    }));

    it('should set isSaving to false after add error', fakeAsync(() => {
      validAboService.createValidAbo.and.returnValue(throwError(() => new Error('API Error')));
      try {
        component.onSave();
        flush();
      } catch (e) {
        // expected
      }
      expect(component.isSaving).toBe(false);
    }));

    it('should not save when form is invalid', () => {
      component.form.get('code')?.setValue('');
      component.onSave();
      expect(validAboService.createValidAbo).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.form.get('code')?.setValue('');
      component.onSave();
      expect(component.form.get('code')?.touched).toBe(true);
    });

    it('should show standard success message on add', fakeAsync(() => {
      validAboService.createValidAbo.and.returnValue(of({ message: 'Custom success message' }));
      component.onSave();
      flush();
      expect(snackBar.open).toHaveBeenCalledWith(
        'New code BN has been successfully added.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    }));

    it('should close dialog in dialog mode on successful create', fakeAsync(() => {
      const mockDialogRef = { close: jasmine.createSpy('close') };
      (component as any).isDialogMode = true;
      (component as any).dialogRef = mockDialogRef;

      component.onSave();
      flush();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should handle save with no terminationDate', fakeAsync(() => {
      component.form.patchValue({ terminationDate: null });
      component.onSave();
      flush();
      const callArgs = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(callArgs.terminationDate).toBeUndefined();
    }));

    it('should handle save with no effectiveDate value', fakeAsync(() => {
      // Set effectiveDate to null and remove required validator so form is valid
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.setValue(null);
      effCtrl?.updateValueAndValidity();
      component.onSave();
      flush();
      const callArgs = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate).toBe('');
    }));
  });

  describe('onSave - Edit Mode with moment dates', () => {
    it('should format moment dates correctly in edit payload', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();

      const momentEff = moment().add(5, 'days').startOf('day');
      const momentTerm = moment().add(60, 'days').startOf('day');

      component.form.patchValue({
        description: 'Updated desc',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Biohazard',
        effectiveDate: momentEff,
        terminationDate: momentTerm
      });
      component.form.markAsDirty();

      component.onSave();
      flush();

      expect(validAboService.updateValidAbo).toHaveBeenCalledWith(
        'A+',
        jasmine.objectContaining({
          effectiveDate: momentEff.format('YYYY-MM-DD'),
          terminationDate: momentTerm.format('YYYY-MM-DD')
        })
      );
    }));

    it('should show standard success message on update', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.patchValue({
        description: 'Changed',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Biohazard',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(60, 'days')
      });
      component.form.markAsDirty();

      validAboService.updateValidAbo.and.returnValue(of({ message: 'Custom update msg' }));
      component.onSave();
      flush();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Code A+ has been successfully updated.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    }));

    it('should close dialog in dialog mode on successful update', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();

      const mockDialogRef = { close: jasmine.createSpy('close') };
      (component as any).isDialogMode = true;
      (component as any).dialogRef = mockDialogRef;

      component.form.patchValue({
        description: 'Changed',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Biohazard',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(60, 'days')
      });
      component.form.markAsDirty();

      component.onSave();
      flush();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should set isSaving to false after update error', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.patchValue({
        description: 'Changed',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Biohazard',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(60, 'days')
      });
      component.form.markAsDirty();

      validAboService.updateValidAbo.and.returnValue(throwError(() => new Error('err')));

      try {
        component.onSave();
        flush();
      } catch (e) {
        // expected
      }

      expect(component.isSaving).toBe(false);
    }));

    it('should include originalUnitScheme in edit payload', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.patchValue({
        description: 'Changed',
        intendedUse: 'EM',
        unitScheme: 'Codabar',
        transfusionStatus: 'Biohazard',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(60, 'days')
      });
      component.form.markAsDirty();

      component.onSave();
      flush();

      const payloadArg = validAboService.updateValidAbo.calls.mostRecent().args[1];
      expect(payloadArg.originalUnitScheme).toBe('ISBT128');
    }));
  });

  describe('onSave - payload mapping', () => {
    it('should convert aboGroupOnly Yes to true', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'X1',
        description: 'Test',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        aboGroupOnly: 'Yes',
        effectiveDate: moment().add(3, 'days')
      });
      // Remove effectiveDate required/past validator so form is valid
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();

      component.onSave();
      flush();

      const payloadArg = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(payloadArg.aboGroupOnly).toBe(true);
    }));

    it('should convert aboGroupOnly No to false', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'X2',
        description: 'Test2',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        aboGroupOnly: 'No',
        effectiveDate: moment().add(3, 'days')
      });
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();

      component.onSave();
      flush();

      const payloadArg = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(payloadArg.aboGroupOnly).toBe(false);
    }));

    it('should trim description and code', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'AB',
        description: ' Test Desc ',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        effectiveDate: moment().add(3, 'days')
      });
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();

      component.onSave();
      flush();

      const payloadArg = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(payloadArg.code).toBe('AB');
      expect(payloadArg.description).toBe('Test Desc');
    }));

    it('should convert empty mnemonic to empty string', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'X3',
        description: 'Test3',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        mnemonic1: '',
        mnemonic2: '',
        effectiveDate: moment().add(3, 'days')
      });
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();

      component.onSave();
      flush();

      const payloadArg = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(payloadArg.mnemonic1).toBe('');
      expect(payloadArg.mnemonic2).toBe('');
    }));

    it('should set sequence to undefined when empty', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'X4',
        description: 'Test4',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        sequence: null,
        group: '',
        effectiveDate: moment().add(3, 'days')
      });
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();

      component.onSave();
      flush();

      const payloadArg = validAboService.createValidAbo.calls.mostRecent().args[0];
      expect(payloadArg.sequence).toBeUndefined();
      expect(payloadArg.group).toBeUndefined();
    }));
  });

  describe('isFormValid', () => {
    it('should return true in add mode when form is valid', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        code: 'AB',
        description: 'Test',
        intendedUse: 'RG',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        effectiveDate: moment().add(3, 'days')
      });
      // Clear validators on effectiveDate to make form valid
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();
      expect(component.isFormValid()).toBe(true);
    });

    it('should return false in add mode when form is invalid', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.get('code')?.setValue('');
      expect(component.isFormValid()).toBeFalsy();
    });

    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      // form is pristine after edit mode setup
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true in edit mode when form is dirty and no visible errors', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      component.form.get('description')?.setValue('Changed');
      component.form.markAsDirty();
      expect(component.isFormValid()).toBe(true);
    });

    it('should return false in edit mode when form is dirty but has visible errors', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      // Set a touched+invalid field
      const descCtrl = component.form.get('description');
      descCtrl?.setValue('');
      descCtrl?.markAsTouched();
      component.form.markAsDirty();
      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('intendedUse display in dropdown', () => {
    it('should have loaded intendedUse options from lookup data', () => {
      expect(component.intendedUseOptions.length).toBe(4);
      expect(component.intendedUseOptions[0].code).toBe('RG');
    });

    it('should filter intendedUse options when search value is set', () => {
      component.intendedUseSearchControl.setValue('emer');
      expect(component.filteredIntendedUseOptions.length).toBe(1);
      expect(component.filteredIntendedUseOptions[0].code).toBe('EM');
    });

    it('should show all intendedUse options when search is empty', () => {
      component.intendedUseSearchControl.setValue('');
      expect(component.filteredIntendedUseOptions.length).toBe(4);
    });

    it('should match by code as well', () => {
      component.intendedUseSearchControl.setValue('AO');
      expect(component.filteredIntendedUseOptions.length).toBe(1);
      expect(component.filteredIntendedUseOptions[0].description).toBe('Autologous');
    });
  });

  describe('Error getters', () => {
    describe('getCodeError', () => {
      it('should return empty string when control is not touched', () => {
        expect(component.getCodeError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const ctrl = component.form.get('code');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getCodeError()).toBe('Code is required');
      });

      it('should return pattern error when touched and has invalid chars', () => {
        const ctrl = component.form.get('code');
        ctrl?.setValue('A+@');
        ctrl?.markAsTouched();
        expect(component.getCodeError()).toBe('Only alphanumeric characters allowed (no spaces)');
      });

      it('should return length error when code exceeds max', () => {
        const ctrl = component.form.get('code');
        ctrl?.setValue('ABCDEF');  // 6 chars, max is 5
        ctrl?.markAsTouched();
        expect(component.getCodeError()).toBe('Code must be 1-5 characters');
      });
    });

    describe('getDescriptionError', () => {
      it('should return empty string when not touched', () => {
        expect(component.getDescriptionError()).toBe('');
      });

      it('should return required error', () => {
        const ctrl = component.form.get('description');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description is required');
      });

      it('should return maxlength error', () => {
        const ctrl = component.form.get('description');
        ctrl?.setValue('A'.repeat(51));  // max is 50
        ctrl?.markAsTouched();
        expect(component.getDescriptionError()).toBe('Description must not exceed 50 characters');
      });

      it('should return whitespace only error', () => {
        const ctrl = component.form.get('description');
        ctrl?.setValue('   ');
        ctrl?.markAsTouched();
        // Required fires first since whitespace-only triggers required in Angular validators
        const error = component.getDescriptionError();
        expect(error.length).toBeGreaterThan(0);
      });
    });

    describe('getIntendedUseError', () => {
      it('should return empty when not touched', () => {
        expect(component.getIntendedUseError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const ctrl = component.form.get('intendedUse');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getIntendedUseError()).toBe('Intended Use is required');
      });
    });

    describe('getUnitSchemeError', () => {
      it('should return empty when not touched', () => {
        expect(component.getUnitSchemeError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const ctrl = component.form.get('unitScheme');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getUnitSchemeError()).toBe('Unit Scheme is required');
      });
    });

    describe('getTransfusionStatusError', () => {
      it('should return empty when not touched', () => {
        expect(component.getTransfusionStatusError()).toBe('');
      });

      it('should return required error when touched and empty', () => {
        const ctrl = component.form.get('transfusionStatus');
        ctrl?.setValue('');
        ctrl?.markAsTouched();
        expect(component.getTransfusionStatusError()).toBe('Transfusion Status is required');
      });
    });

    describe('getGroupError', () => {
      it('should return empty when not touched', () => {
        expect(component.getGroupError()).toBe('');
      });

      it('should return maxlength error when touched and exceeds limit', () => {
        const ctrl = component.form.get('group');
        ctrl?.setValue('123456');  // max is 5
        ctrl?.markAsTouched();
        expect(component.getGroupError()).toBe('Group must not exceed 5 characters');
      });
    });

    describe('getSequenceError', () => {
      it('should return empty when not touched', () => {
        expect(component.getSequenceError()).toBe('');
      });

      it('should return range error when value exceeds max', () => {
        const ctrl = component.form.get('sequence');
        ctrl?.setValue(100);  // max is 99
        ctrl?.markAsTouched();
        expect(component.getSequenceError()).toBe('Sequence must be between 0 and 99');
      });

      it('should return range error when value is below min', () => {
        const ctrl = component.form.get('sequence');
        ctrl?.setValue(-1);
        ctrl?.markAsTouched();
        expect(component.getSequenceError()).toBe('Sequence must be between 0 and 99');
      });
    });

    describe('getMnemonic1Error', () => {
      it('should return empty when not touched', () => {
        expect(component.getMnemonic1Error()).toBe('');
      });

      it('should return pattern error for special characters', () => {
        const ctrl = component.form.get('mnemonic1');
        ctrl?.setValue('ABC@#$');
        ctrl?.markAsTouched();
        expect(component.getMnemonic1Error()).toBe('Only alphanumeric characters allowed (no special characters)');
      });

      it('should return maxlength error when exceeds limit', () => {
        const ctrl = component.form.get('mnemonic1');
        ctrl?.setValue('A'.repeat(21));  // max is 20
        ctrl?.markAsTouched();
        expect(component.getMnemonic1Error()).toBe('Mnemonic must not exceed 20 characters');
      });
    });

    describe('getMnemonic2Error', () => {
      it('should return empty when not touched', () => {
        expect(component.getMnemonic2Error()).toBe('');
      });

      it('should return pattern error for special characters', () => {
        const ctrl = component.form.get('mnemonic2');
        ctrl?.setValue('XY@!');
        ctrl?.markAsTouched();
        expect(component.getMnemonic2Error()).toBe('Only alphanumeric characters allowed (no special characters)');
      });

      it('should return maxlength error when exceeds limit', () => {
        const ctrl = component.form.get('mnemonic2');
        ctrl?.setValue('B'.repeat(21));  // max is 20
        ctrl?.markAsTouched();
        expect(component.getMnemonic2Error()).toBe('Mnemonic must not exceed 20 characters');
      });
    });
  });

  describe('onCodeInput', () => {
    it('should strip spaces from code input', () => {
      const event = { target: { value: 'A B C', selectionStart: 5, setSelectionRange: jasmine.createSpy('setSelectionRange') } } as any;

      component.onCodeInput(event);

      expect(event.target.value).toBe('ABC');
      expect(component.form.get('code')?.value).toBe('ABC');
      expect(event.target.setSelectionRange).toHaveBeenCalled();
    });

    it('should not change value when no spaces present', () => {
      const event = { target: { value: 'ABC' } } as any;
      component.onCodeInput(event);
      // Value stays the same, no patchValue call expected
      expect(event.target.value).toBe('ABC');
    });
  });

  describe('preventLeadingSpace', () => {
    it('should prevent space at cursor position 0', () => {
      const event = {
        key: ' ',
        target: { selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'description');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space at cursor position > 0', () => {
      const event = {
        key: ' ',
        target: { selectionStart: 3 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'description');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow non-space at position 0', () => {
      const event = {
        key: 'A',
        target: { selectionStart: 0 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'description');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventSpecialCharsInMnemonic - additional coverage', () => {
    it('should allow Delete key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowLeft key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowRight key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Home key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow End key', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Meta shortcuts (Cmd+V)', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', metaKey: true });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic2');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow numeric keys in mnemonic', () => {
      const input = document.createElement('input');
      input.value = 'AB';
      Object.defineProperty(input, 'selectionStart', { value: 2, writable: true });
      const event = new KeyboardEvent('keydown', { key: '5' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block hyphen in mnemonic', () => {
      const input = document.createElement('input');
      input.value = 'AB';
      Object.defineProperty(input, 'selectionStart', { value: 2, writable: true });
      const event = new KeyboardEvent('keydown', { key: '-' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventSpecialCharsInMnemonic(event, 'mnemonic1');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onInputTrimLeadingSpace', () => {
    it('should trim leading spaces from input', () => {
      component.form.get('description')?.setValue('test');
      const mockInput: any = {
        value: '  hello',
        selectionStart: 3,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: mockInput } as any;

      component.onInputTrimLeadingSpace(event, 'description');

      expect(mockInput.value).toBe('hello');
      expect(component.form.get('description')?.value).toBe('hello');
    });

    it('should not modify input when no leading spaces', () => {
      const mockInput: any = {
        value: 'hello',
        selectionStart: 3,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: mockInput } as any;

      component.onInputTrimLeadingSpace(event, 'description');

      expect(mockInput.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  describe('onDescriptionInput', () => {
    it('should remove leading spaces from description', () => {
      const mockInput: any = {
        value: '  hello world',
        selectionStart: 5,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: mockInput } as any;

      component.onDescriptionInput(event);

      expect(mockInput.value).toBe('hello world');
    });

    it('should collapse multiple spaces to single space', () => {
      const mockInput: any = {
        value: 'hello   world',
        selectionStart: 10,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: mockInput } as any;

      component.onDescriptionInput(event);

      expect(mockInput.value).toBe('hello world');
    });

    it('should not modify clean input', () => {
      const mockInput: any = {
        value: 'hello world',
        selectionStart: 5,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      };
      const event = { target: mockInput } as any;

      component.onDescriptionInput(event);

      expect(mockInput.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  describe('preventInvalidNumericChars', () => {
    it('should allow Backspace', () => {
      const event = {
        key: 'Backspace',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent e character', () => {
      const event = {
        key: 'e',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent E character', () => {
      const event = {
        key: 'E',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent + character', () => {
      const event = {
        key: '+',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent - character', () => {
      const event = {
        key: '-',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent . character', () => {
      const event = {
        key: '.',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit characters', () => {
      const event = {
        key: '5',
        target: { value: '1', selectionStart: 1, selectionEnd: 1 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit characters', () => {
      const event = {
        key: 'a',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent digit when max digits reached and no selection', () => {
      const event = {
        key: '5',
        target: { value: '12', selectionStart: 2, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event, 2);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit when max digits reached but text is selected', () => {
      const event = {
        key: '5',
        target: { value: '12', selectionStart: 0, selectionEnd: 2 } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventInvalidNumericChars(event, 2);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventNonNumericPaste', () => {
    it('should allow numeric paste', () => {
      const event = {
        clipboardData: { getData: () => '123' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-numeric paste', () => {
      const event = {
        clipboardData: { getData: () => '12a' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste with special characters', () => {
      const event = {
        clipboardData: { getData: () => '12.5' },
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle null clipboardData', () => {
      const event = {
        clipboardData: null,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('terminationDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = moment().subtract(30, 'days');
      expect(component.terminationDateFilter(pastDate)).toBe(false);
    });

    it('should return true for future date', () => {
      const futDate = moment().add(30, 'days');
      expect(component.terminationDateFilter(futDate)).toBe(true);
    });

    it('should return false when date is before effectiveDate', () => {
      const futEff = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futEff);
      const beforeEff = moment().add(10, 'days');
      expect(component.terminationDateFilter(beforeEff)).toBe(false);
    });

    it('should return true when date is after effectiveDate', () => {
      const futEff = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futEff);
      const afterEff = moment().add(30, 'days');
      expect(component.terminationDateFilter(afterEff)).toBe(true);
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should mark effective date as touched when input has value', () => {
      const event = { target: { value: '01-JAN-2027' } } as any;
      component.onEffectiveDateInput(event);
      const ctrl = component.form.get('effectiveDate');
      expect(ctrl?.touched).toBe(true);
    });

    it('should set required error when input is empty', () => {
      const event = { target: { value: '' } } as any;
      component.onEffectiveDateInput(event);
      const ctrl = component.form.get('effectiveDate');
      expect(ctrl?.hasError('required')).toBe(true);
    });
  });

  describe('onTerminationDateInput', () => {
    it('should mark termination date as touched when input has value', () => {
      const event = { target: { value: '01-FEB-2027' } } as any;
      component.onTerminationDateInput(event);
      const ctrl = component.form.get('terminationDate');
      expect(ctrl?.touched).toBe(true);
    });

    it('should clear errors when input is empty in add mode', () => {
      const ctrl = component.form.get('terminationDate');
      ctrl?.setErrors({ invalidDate: true });
      const event = { target: { value: '' } } as any;
      component.onTerminationDateInput(event);
      expect(ctrl?.errors).toBeNull();
    });
  });

  describe('getEffectiveDateError', () => {
    it('should return empty when control is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return invalid date error when control has invalidDateFormat', () => {
      const ctrl = component.form.get('effectiveDate');
      ctrl?.setValue(null);
      ctrl?.setErrors({ invalidDateFormat: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should return required error when touched and empty', () => {
      const ctrl = component.form.get('effectiveDate');
      ctrl?.setValue(null);
      ctrl?.setErrors({ required: true });
      ctrl?.markAsTouched();
      ctrl?.markAsDirty();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when no errors', () => {
      const ctrl = component.form.get('terminationDate');
      ctrl?.setValue(moment().add(90, 'days'));
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return past date error when terminationDatePast error is set', () => {
      const ctrl = component.form.get('terminationDate');
      ctrl?.setValue(moment().subtract(5, 'days'));
      ctrl?.setErrors({ terminationDatePast: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return invalid date error when control has invalidDate error', () => {
      const ctrl = component.form.get('terminationDate');
      ctrl?.setValue(null);
      ctrl?.setErrors({ invalidDate: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('setupDropdownSearch - filtering', () => {
    it('should filter intendedUse options by search term', () => {
      // Dropdowns already loaded from beforeEach
      component.intendedUseSearchControl.setValue('emer');
      expect(component.filteredIntendedUseOptions.length).toBe(1);
      expect(component.filteredIntendedUseOptions[0].code).toBe('EM');
    });

    it('should filter unitScheme options by search term', () => {
      component.unitSchemeSearchControl.setValue('isbt');
      expect(component.filteredUnitSchemeOptions.length).toBe(1);
      expect(component.filteredUnitSchemeOptions[0].code).toBe('ISBT128');
    });

    it('should filter transfusionStatus options by search term', () => {
      component.transfusionStatusSearchControl.setValue('bio');
      expect(component.filteredTransfusionStatusOptions.length).toBe(1);
      expect(component.filteredTransfusionStatusOptions[0].code).toBe('Biohazard');
    });

    it('should show all options when search term is empty', () => {
      component.intendedUseSearchControl.setValue('');
      expect(component.filteredIntendedUseOptions.length).toBe(4);
    });

    it('should filter by code as well as description', () => {
      component.intendedUseSearchControl.setValue('AO');
      expect(component.filteredIntendedUseOptions.length).toBe(1);
      expect(component.filteredIntendedUseOptions[0].description).toBe('Autologous');
    });

    it('should handle null search value', () => {
      component.intendedUseSearchControl.setValue(null as any);
      expect(component.filteredIntendedUseOptions.length).toBe(4);
    });
  });

  describe('loadDropdowns - error handling', () => {
    it('should clear all options and filtered options on error', fakeAsync(() => {
      validAboService.getValidAboLookups.and.returnValue(
        throwError(() => new Error('Network Error'))
      );

      component.loadDropdowns();
      flush();

      expect(component.intendedUseOptions).toEqual([]);
      expect(component.filteredIntendedUseOptions).toEqual([]);
      expect(component.unitSchemeOptions).toEqual([]);
      expect(component.filteredUnitSchemeOptions).toEqual([]);
      expect(component.transfusionStatusOptions).toEqual([]);
      expect(component.filteredTransfusionStatusOptions).toEqual([]);
      expect(component.isLoadingIntendedUse).toBe(false);
    }));

    it('should set isLoadingIntendedUse to true then false on success', fakeAsync(() => {
      // Initially the component has already loaded dropdowns
      // Reset and call again
      validAboService.getValidAboLookups.and.returnValue(of(mockLookupsData));
      component.loadDropdowns();
      flush();
      expect(component.isLoadingIntendedUse).toBe(false);
    }));

    it('should populate filtered lists on success', fakeAsync(() => {
      validAboService.getValidAboLookups.and.returnValue(of(mockLookupsData));
      component.loadDropdowns();
      flush();
      expect(component.filteredIntendedUseOptions.length).toBe(4);
      expect(component.filteredUnitSchemeOptions.length).toBe(2);
      expect(component.filteredTransfusionStatusOptions.length).toBe(5);
    }));

    it('should handle response with missing properties', fakeAsync(() => {
      validAboService.getValidAboLookups.and.returnValue(of({} as any));
      component.loadDropdowns();
      flush();
      expect(component.intendedUseOptions).toEqual([]);
      expect(component.unitSchemeOptions).toEqual([]);
      expect(component.transfusionStatusOptions).toEqual([]);
    }));
  });

  describe('setupPanel - aboGroupOnly mapping', () => {
    it('should map aboGroupOnly true to Yes', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, aboGroupOnly: true };
      editComponent.ngOnInit();
      expect(editComponent.form.get('aboGroupOnly')?.value).toBe('Yes');
    });

    it('should map aboGroupOnly false to No', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, aboGroupOnly: false };
      editComponent.ngOnInit();
      expect(editComponent.form.get('aboGroupOnly')?.value).toBe('No');
    });

    it('should map aboGroupOnly undefined to empty string', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, aboGroupOnly: undefined };
      editComponent.ngOnInit();
      expect(editComponent.form.get('aboGroupOnly')?.value).toBe('');
    });
  });

  describe('setupPanel - date conversion (toMomentOrNull)', () => {
    it('should convert ISO date string to moment', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, effectiveDate: '2027-01-15' };
      editComponent.ngOnInit();
      const effValue = editComponent.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effValue)).toBe(true);
    });

    it('should convert DD-MMM-YYYY format to moment', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, effectiveDate: '15-JAN-2027' };
      editComponent.ngOnInit();
      const effValue = editComponent.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effValue)).toBe(true);
    });

    it('should return null for dash value', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, terminationDate: '-' };
      editComponent.ngOnInit();
      const termValue = editComponent.form.get('terminationDate')?.value;
      expect(termValue).toBeNull();
    });

    it('should return null for null value', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, terminationDate: null };
      editComponent.ngOnInit();
      const termValue = editComponent.form.get('terminationDate')?.value;
      expect(termValue).toBeNull();
    });

    it('should return null for invalid date string', () => {
      const editFixture = TestBed.createComponent(AddEditValidAbo);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = { ...mockRecord, terminationDate: 'not-a-date' };
      editComponent.ngOnInit();
      const termValue = editComponent.form.get('terminationDate')?.value;
      // 'not-a-date' will fail both parsing attempts, so should be null
      expect(termValue).toBeNull();
    });
  });

  describe('setupEditModeDateValidators', () => {
    it('should disable effectiveDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      const effCtrl = component.form.get('effectiveDate');
      expect(effCtrl?.disabled).toBe(true);
    });

    it('should set validators on terminationDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      const termCtrl = component.form.get('terminationDate');
      // Termination date control should exist and be enabled
      expect(termCtrl?.enabled).toBe(true);
    });

    it('should mark form as pristine in edit mode', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component.ngOnInit();
      expect(component.form.pristine).toBe(true);
    });
  });

  describe('setupPanel - add mode validators', () => {
    it('should enable effectiveDate in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();
      const effCtrl = component.form.get('effectiveDate');
      expect(effCtrl?.enabled).toBe(true);
    });

    it('should set required validator on effectiveDate in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();
      const effCtrl = component.form.get('effectiveDate');
      effCtrl?.setValue(null);
      expect(effCtrl?.hasError('required')).toBe(true);
    });
  });

  describe('effectiveDate value changes subscription', () => {
    it('should track lastChangedDateField as effective when effectiveDate changes', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));

      expect((component as any).lastChangedDateField).toBe('effective');
    });
  });

  describe('setupPanel with no data', () => {
    it('should handle null data in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.ngOnInit();
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
    });
  });
});
