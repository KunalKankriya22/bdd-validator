import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { UnitIdFieldComponent } from './unit-id-field.component';
import { UnitIdFieldService } from './unit-id-field.service';

describe('UnitIdFieldComponent', () => {
  let serviceSpy: any;
  let component: UnitIdFieldComponent;
  let fixture: ComponentFixture<UnitIdFieldComponent>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
    serviceSpy.validateUnitId.and.returnValue(of({ success: false, message: 'mock', errorCode: null, item: null }));



      TestBed.configureTestingModule({
      imports: [UnitIdFieldComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: UnitIdFieldService, useValue: serviceSpy },
        provideHttpClient()
      ]
    });


    


      serviceSpy.validateUnitId.calls.reset();


      serviceSpy.validateUnitId.and.returnValue(of({ success: false, message: 'mock', errorCode: null, item: null }));


    fixture = TestBed.createComponent(UnitIdFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should default to idle validation state', () => {
    expect(component.validationState).toBe('idle');
  });

  it('should not be valid in idle state', () => {
    expect(component.isValid).toBe(false);
  });



  it('should clear the control and reset state', () => {
    component.unitIdControl.setValue('TEST123');
    component.clear();

    expect(component.unitIdControl.value).toBe('');
    expect(component.validationState).toBe('idle');
    expect(component.parsedUnitId).toBeNull();
  });



  describe('allowDeferralId', () => {
    let serviceSpy: jasmine.SpyObj<UnitIdFieldService>;

    beforeEach(() => {
      serviceSpy = TestBed.inject(UnitIdFieldService) as jasmine.SpyObj<UnitIdFieldService>;
    });



    it('should emit postValidate with raw input when allowDeferralId is true and API returns 400', fakeAsync(() => {
      serviceSpy.validateUnitId.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid unit ID length' } }))
      );
      component.allowDeferralId = true;
      component.requirePostValidation = true;

      const postValidateSpy = jasmine.createSpy('postValidate');
      component.postValidate.subscribe(postValidateSpy);

      component.unitIdControl.setValue('10102700');
      component.onBlur();
      tick();

      expect(postValidateSpy).toHaveBeenCalled();
      const emittedEvent = postValidateSpy.calls.mostRecent().args[0];
      expect(emittedEvent.data.parsedUnitId).toBe('10102700');
      expect(component.validationState).toBe('validating');
    }));

    it('should emit postValidate when allowDeferralId is true and API returns success:false in next', fakeAsync(() => {
      serviceSpy.validateUnitId.and.returnValue(of({ success: false, message: 'Invalid', errorCode: null, item: null }));
      component.allowDeferralId = true;
      component.requirePostValidation = true;

      const postValidateSpy = jasmine.createSpy('postValidate');
      component.postValidate.subscribe(postValidateSpy);

      component.unitIdControl.setValue('10102700');
      component.onBlur();
      tick();

      expect(postValidateSpy).toHaveBeenCalled();
      const emittedEvent = postValidateSpy.calls.mostRecent().args[0];
      expect(emittedEvent.data.parsedUnitId).toBe('10102700');
    }));
  });

  // NEW COMPREHENSIVE TESTS FOR RECENT CHANGES

  describe('onEnter - emptyEnter event emission', () => {










    it('should handle undefined input element gracefully', () => {
      component.unitIdInput = undefined as any;

      expect(() => {
        component.unitIdControl.setValue('');
        component.onEnter();
      }).not.toThrow();
    });

    it('should handle null nativeElement gracefully', () => {
      component.unitIdInput = {
        nativeElement: null
      } as any;

      expect(() => {
        component.unitIdControl.setValue('');
        component.onEnter();
      }).not.toThrow();
    });
  });

  describe('clear - Error state reset fix', () => {
    it('should clear validation error when clear is called', () => {
      component.validationState = 'invalid';
      component.validationError = 'Test error message';

      component.clear();

      expect(component.validationError).toBeNull();
      expect(component.validationState).toBe('idle');
    });





    it('should mark control as untouched when clear is called', () => {
      component.unitIdControl.markAsTouched();

      component.clear();

      expect(component.unitIdControl.untouched).toBe(true);
    });

    it('should mark control as pristine when clear is called', () => {
      component.unitIdControl.markAsDirty();

      component.clear();

      expect(component.unitIdControl.pristine).toBe(true);
    });

















    it('should be safe to call clear multiple times', () => {
      component.clear();
      component.clear();
      component.clear();

      expect(component.validationState).toBe('idle');
      expect(component.unitIdControl.value).toBe('');
      expect(component.validationError).toBeNull();
    });
  });

  describe('Integration - emptyEnter with clear', () => {


    it('should clear errors before emitting emptyEnter', () => {
      component.validationState = 'invalid';
      component.validationError = 'Test error';
      const emptyEnterSpy = jasmine.createSpy('emptyEnter');
      component.emptyEnter.subscribe(emptyEnterSpy);

      component.clear();
      component.onEnter();

      expect(component.validationError).toBeNull();
      expect(emptyEnterSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle setError method correctly', () => {
      component.setError('Custom error message');

      expect(component.validationState).toBe('invalid');
      expect(component.validationError).toBe('Custom error message');
      expect(component.unitIdControl.hasError('serverError')).toBe(true);
    });



    it('should not reset state during double entry', fakeAsync(() => {
      component.doubleEntry.start('1234567', { parsedUnitId: '1234567' } as any);
      component.validationState = 'valid';

      component.unitIdControl.setValue('NEW_VALUE');
      tick();

      expect(component.validationState).toBe('valid');
    }));



    it('should handle focus with null input element', fakeAsync(() => {
      component.unitIdInput = undefined as any;

      expect(() => {
        component.focus();
        tick();
      }).not.toThrow();
    }));

    it('should add required validator when required is true', () => {
      component.required = true;
      component.ngOnInit();

      expect(component.unitIdControl.hasError('required')).toBe(true);
    });

    it('should not add required validator when required is false', () => {
      component.required = false;
      component.unitIdControl.clearValidators();
      component.ngOnInit();

      component.unitIdControl.setValue('');
      expect(component.unitIdControl.hasError('required')).toBe(false);
    });

    it('should return correct validHintText for ISBT unit', () => {
      component['_parsedUnitData'] = {
        parsedUnitId: 'W454526051302',
        checkDigit: '1',
        codeScheme: 'I',
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      expect(component.validHintText).toContain('ISBT');
    });

    it('should return correct validHintText for Codabar unit', () => {
      component['_parsedUnitData'] = {
        parsedUnitId: '12345',
        checkDigit: '6',
        codeScheme: 'C',
        manualUnitId: '12345-6',
        codabarUnitScheme: 'A',
        entryMode: 'M',
        barcodeType: 'CODABAR',
        chapterScheme: 'C'
      };

      expect(component.validHintText).toContain('Codabar');
    });

    it('should return custom hintValid when provided', () => {
      component.hintValid = 'Custom valid hint';
      component['_parsedUnitData'] = {
        parsedUnitId: 'W454526051302',
        checkDigit: '1',
        codeScheme: 'I',
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      expect(component.validHintText).toBe('Custom valid hint');
    });


  });

  describe('onBlur', () => {
    it('should emit emptyBlur when input is empty', () => {
      const emptyBlurSpy = jasmine.createSpy('emptyBlur');
      component.emptyBlur.subscribe(emptyBlurSpy);
      component.unitIdControl.setValue('');
      component.onBlur();
      expect(emptyBlurSpy).toHaveBeenCalled();
    });

    it('should not validate short input (< 2 chars)', () => {
      component.unitIdControl.setValue('X');
      component.onBlur();
      expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
    });

    it('should not validate incomplete scanner input (= prefix, < 14 chars)', () => {
      component.unitIdControl.setValue('=SHORT');
      component.onBlur();
      expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
    });

    it('should skip validation when already validating', fakeAsync(() => {
      component.validationState = 'validating';
      component.unitIdControl.setValue('=W454526051302X');
      component.onBlur();
      tick();
      expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
    }));

    it('should skip re-validation when already valid with same value', fakeAsync(() => {
      component.unitIdControl.setValue('TESTUNITID1234', { emitEvent: false });
      component.validationState = 'valid';
      component['rawUnitId'] = 'TESTUNITID1234';
      component.onBlur();
      tick();
      expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
    }));

    it('should mark invalid on API error without allowDeferralId', fakeAsync(() => {
      serviceSpy.validateUnitId.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Bad unit' } } }))
      );
      component.allowDeferralId = false;
      component.unitIdControl.setValue('TESTUNITID1234');
      component.onBlur();
      tick();
      expect(component.validationState).toBe('invalid');
      expect(component.validationError).toBe('Bad unit');
    }));

    it('should mark invalid when success:false without allowDeferralId', fakeAsync(() => {
      serviceSpy.validateUnitId.and.returnValue(of({ success: false, message: 'Invalid ID', errorCode: null, item: null }));
      component.allowDeferralId = false;
      component.unitIdControl.setValue('TESTUNITID1234');
      component.onBlur();
      tick();
      expect(component.validationState).toBe('invalid');
      expect(component.validationError).toBe('Invalid ID');
    }));

    it('should validate and emit validated on success (CODE128)', fakeAsync(() => {
      const mockData = {
        parsedUnitId: 'W454526051302',
        checkDigit: '1',
        codeScheme: 'I',
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };
      serviceSpy.validateUnitId.and.returnValue(of({ success: true, message: 'OK', errorCode: null, item: mockData }));

      const validatedSpy = jasmine.createSpy('validated');
      component.validated.subscribe(validatedSpy);
      component.unitIdControl.setValue('=W454526051302X');
      component.onBlur();
      tick();

      expect(component.validationState).toBe('valid');
      expect(validatedSpy).toHaveBeenCalledWith(mockData);
    }));

    it('should start double entry for CODABAR manual entry', fakeAsync(() => {
      const mockData = {
        parsedUnitId: '1234567',
        checkDigit: '8',
        codeScheme: 'C',
        manualUnitId: '1234567-8',
        codabarUnitScheme: 'A',
        entryMode: 'M',
        barcodeType: 'CODABAR',
        chapterScheme: 'C'
      };
      serviceSpy.validateUnitId.and.returnValue(of({ success: true, message: 'OK', errorCode: null, item: mockData }));
      component.skipDoubleEntry = false;
      component.unitIdControl.setValue('1234567');
      component.onBlur();
      tick();

      expect(component.doubleEntry.isPending).toBeTrue();
      expect(component.unitIdControl.value).toBe('');
    }));
  });

  describe('onEscape', () => {
    it('should blur the input element', () => {
      const blurSpy = jasmine.createSpy('blur');
      component.unitIdInput = { nativeElement: { blur: blurSpy, focus: jasmine.createSpy() } } as any;
      component.onEscape();
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('onTab', () => {
    it('should emit emptyTab when field is empty', () => {
      const emptyTabSpy = jasmine.createSpy('emptyTab');
      component.emptyTab.subscribe(emptyTabSpy);
      component.unitIdControl.setValue('');
      component.onTab();
      expect(emptyTabSpy).toHaveBeenCalled();
    });
    it('should not emit emptyTab when field has value', () => {
      const emptyTabSpy = jasmine.createSpy('emptyTab');
      component.emptyTab.subscribe(emptyTabSpy);
      component.unitIdControl.setValue('SOME_VALUE');
      component.onTab();
      expect(emptyTabSpy).not.toHaveBeenCalled();
    });
  });

  describe('onEnter', () => {
    it('should emit emptyEnter when field is empty', () => {
      const emptyEnterSpy = jasmine.createSpy('emptyEnter');
      component.emptyEnter.subscribe(emptyEnterSpy);
      component.unitIdControl.setValue('');
      component.onEnter();
      expect(emptyEnterSpy).toHaveBeenCalled();
    });
    it('should not emit emptyEnter when field has value', () => {
      const emptyEnterSpy = jasmine.createSpy('emptyEnter');
      component.emptyEnter.subscribe(emptyEnterSpy);
      component.unitIdControl.setValue('SOME_VALUE');
      component.onEnter();
      expect(emptyEnterSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should disable control when disabled input changes to true', () => {
      component.disabled = true;
      component.ngOnChanges({ disabled: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
      expect(component.unitIdControl.disabled).toBeTrue();
    });
    it('should enable control when disabled input changes to false', () => {
      component.unitIdControl.disable();
      component.disabled = false;
      component.ngOnChanges({ disabled: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false } });
      expect(component.unitIdControl.enabled).toBeTrue();
    });
  });

  describe('setValue', () => {
    it('should set control value and reset state', () => {
      component.validationState = 'invalid';
      component.validationError = 'Some error';
      component.setValue('NEW_VALUE');
      expect(component.unitIdControl.value).toBe('NEW_VALUE');
      expect(component.validationState).toBe('idle');
      expect(component.validationError).toBeNull();
    });
  });

  describe('onFocus', () => {
    it('should restore rawUnitId when available', () => {
      component['rawUnitId'] = '=RAWVALUE';
      component.unitIdControl.setValue('FORMATTED');
      component.onFocus();
      expect(component.unitIdControl.value).toBe('=RAWVALUE');
    });
    it('should return early during double entry', () => {
      component.doubleEntry.start('1234567', { parsedUnitId: '1234567' } as any);
      component.validationState = 'valid';
      component['rawUnitId'] = '=RAWVALUE';
      component.onFocus();
      // Should not have reset state since it returns early
      expect(component.validationState).toBe('valid');
    });
  });

  describe('validHintText', () => {
    it('should return empty string when no parsed data', () => {
      component['_parsedUnitData'] = null;
      component.hintValid = null;
      expect(component.validHintText).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('handleDoubleEntryVerify mismatch', () => {
    it('should set mismatch error on wrong second entry', fakeAsync(() => {
      const mockData = {
        parsedUnitId: '1234567',
        checkDigit: '8',
        codeScheme: 'C',
        manualUnitId: '1234567-8',
        codabarUnitScheme: 'A',
        entryMode: 'M',
        barcodeType: 'CODABAR',
        chapterScheme: 'C'
      };
      // Start double entry
      component.doubleEntry.start('1234567', mockData as any);

      // Enter wrong second value
      component.unitIdControl.setValue('9999999');
      component.onBlur();
      tick();

      expect(component.validationState).toBe('invalid');
      expect(component.validationError).toContain('did not match');
      expect(component.unitIdControl.hasError('mismatch')).toBeTrue();
    }));
  });

  describe('postValidate flow', () => {
    it('should stay in validating state when postValidate is required', fakeAsync(() => {
      const mockData = {
        parsedUnitId: 'W454526051302',
        checkDigit: '1',
        codeScheme: 'I',
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };
      serviceSpy.validateUnitId.and.returnValue(of({ success: true, message: 'OK', errorCode: null, item: mockData }));
      component.requirePostValidation = true;

      const postValidateSpy = jasmine.createSpy('postValidate');
      component.postValidate.subscribe(postValidateSpy);

      component.unitIdControl.setValue('=W454526051302X');
      component.onBlur();
      tick();

      expect(postValidateSpy).toHaveBeenCalled();
      const event = postValidateSpy.calls.mostRecent().args[0];

      // Confirm should mark valid
      event.confirm();
      expect(component.validationState).toBe('valid');
    }));

    it('should mark invalid when postValidate rejects', fakeAsync(() => {
      const mockData = {
        parsedUnitId: 'W454526051302',
        checkDigit: '1',
        codeScheme: 'I',
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };
      serviceSpy.validateUnitId.and.returnValue(of({ success: true, message: 'OK', errorCode: null, item: mockData }));
      component.requirePostValidation = true;

      const postValidateSpy = jasmine.createSpy('postValidate');
      component.postValidate.subscribe(postValidateSpy);

      component.unitIdControl.setValue('=W454526051302X');
      component.onBlur();
      tick();

      const event = postValidateSpy.calls.mostRecent().args[0];
      event.reject('Duplicate unit');
      expect(component.validationState).toBe('invalid');
      expect(component.validationError).toBe('Duplicate unit');
    }));
  });
});
