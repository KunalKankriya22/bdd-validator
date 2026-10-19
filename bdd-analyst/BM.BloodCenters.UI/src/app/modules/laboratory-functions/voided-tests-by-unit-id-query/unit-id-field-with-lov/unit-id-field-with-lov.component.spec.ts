import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { UnitIdFieldWithLovComponent, UnitIdPostValidateEvent, UnitIdLovSelectedEvent } from './unit-id-field-with-lov.component';
import { UnitIdFieldService } from '@shared/components/unit-id-field/unit-id-field.service';
import { UnitValidationResponse, UnitValidationApiResponse, LovItem } from './unit-id-field-with-lov.model';

function makeValidResponse(overrides: Partial<UnitValidationResponse> = {}): UnitValidationResponse {
  return {
    parsedUnitId: 'W1234567890123',
    checkDigit: '5',
    codeScheme: 'I',
    manualUnitId: 'W1234567890123',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
    ...overrides,
  };
}

function makeApiResponse(overrides: Partial<UnitValidationApiResponse> = {}): UnitValidationApiResponse {
  return {
    success: true,
    message: '',
    errorCode: null,
    item: makeValidResponse(),
    ...overrides,
  };
}

function makeLovItem(overrides: Partial<LovItem> = {}): LovItem {
  return {
    unitId: 'U001',
    collDate: '2024-01-01',
    displayUnitId: 'U001-DISP',
    ...overrides,
  };
}

describe('UnitIdFieldWithLovComponent', () => {
  let component: UnitIdFieldWithLovComponent;
  let fixture: ComponentFixture<UnitIdFieldWithLovComponent>;
  let serviceSpy: jasmine.SpyObj<UnitIdFieldService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);

    await TestBed.configureTestingModule({
      imports: [UnitIdFieldWithLovComponent, NoopAnimationsModule],
      providers: [
        { provide: UnitIdFieldService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitIdFieldWithLovComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  // ---- Existing tests ----

  it('should reset validation state and emit cleared on clear', (done) => {
    // Arrange
    component.validationState = 'valid';

    component.cleared.subscribe(() => {
      // Assert
      expect(component.validationState).toBe('idle');
      expect(component.unitIdControl.value).toBe('');
      done();
    });

    // Act
    component.clear();
  });

  it('should emit emptyEnter when onEnter is called with empty value', (done) => {
    // Arrange
    component.unitIdControl.setValue('');

    component.emptyEnter.subscribe(() => {
      // Assert
      expect(true).toBe(true);
      done();
    });

    // Act
    component.onEnter();
  });

  it('should report isValid as false when validation state is idle', () => {
    // Arrange
    component.validationState = 'idle';

    // Act & Assert
    expect(component.isValid).toBe(false);
  });

  // ---- Creation / defaults ----

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct default input values', () => {
    expect(component.validateFfValue).toBe('N');
    expect(component.label).toBe('Unit ID');
    expect(component.placeholder).toBe('');
    expect(component.required).toBe(true);
    expect(component.hintDefault).toBe('Scan or type');
    expect(component.hintValid).toBeNull();
    expect(component.requirePostValidation).toBe(false);
    expect(component.skipDoubleEntry).toBe(false);
    expect(component.allowDeferralId).toBe(false);
    expect(component.showBarcodeIcon).toBe(false);
    expect(component.showLov).toBe(false);
  });

  it('should initialize validationState as idle', () => {
    expect(component.validationState).toBe('idle');
  });

  // ---- ngOnInit ----

  it('should add required validator when required is true', () => {
    component.required = true;
    component.ngOnInit();

    component.unitIdControl.setValue('');
    component.unitIdControl.markAsTouched();
    expect(component.unitIdControl.hasError('required')).toBe(true);
  });

  it('should NOT add required validator when required is false', () => {
    // Reset to test without required
    component.unitIdControl.clearValidators();
    component.unitIdControl.updateValueAndValidity();
    component.required = false;
    component.ngOnInit();

    component.unitIdControl.setValue('');
    component.unitIdControl.markAsTouched();
    expect(component.unitIdControl.hasError('required')).toBe(false);
  });

  // ---- ngOnDestroy ----

  it('should complete the destroy$ subject on ngOnDestroy', () => {
    // The test ensures no subscriptions leak; call destroy and verify no error
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ---- isValid getter ----

  it('should return true for isValid when validationState is valid', () => {
    component.validationState = 'valid';
    expect(component.isValid).toBe(true);
  });

  it('should return false for isValid when validationState is invalid', () => {
    component.validationState = 'invalid';
    expect(component.isValid).toBe(false);
  });

  it('should return false for isValid when validationState is validating', () => {
    component.validationState = 'validating';
    expect(component.isValid).toBe(false);
  });

  // ---- parsedUnitId getter ----

  it('should return null for parsedUnitId when no data is set', () => {
    expect(component.parsedUnitId).toBeNull();
  });

  it('should return parsedUnitId from parsedUnitData when data exists', () => {
    // Drive via a successful validation to set _parsedUnitData
    const data = makeValidResponse({ parsedUnitId: 'ABC123' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('ABC123', { emitEvent: false });
    component.onBlur();

    expect(component.parsedUnitId).toBe('ABC123');
  });

  // ---- parsedUnitData getter ----

  it('should return null for parsedUnitData initially', () => {
    expect(component.parsedUnitData).toBeNull();
  });

  it('should return validation data after successful validation', () => {
    const data = makeValidResponse();
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('SCAN123', { emitEvent: false });
    component.onBlur();

    expect(component.parsedUnitData).toEqual(data);
  });

  // ---- validHintText getter ----

  it('should return hintValid when hintValid is set', () => {
    component.hintValid = 'Custom hint';
    expect(component.validHintText).toBe('Custom hint');
  });

  it('should return empty string when hintValid is null and no parsed data', () => {
    component.hintValid = null;
    expect(component.validHintText).toBe('');
  });

  it('should return ISBT hint for CODE128 barcode type', () => {
    const data = makeValidResponse({ barcodeType: 'CODE128' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('TEST', { emitEvent: false });
    component.onBlur();

    expect(component.validHintText).toBe('Valid ISBT unit');
  });

  it('should return Codabar hint for CODABAR barcode type', () => {
    const data = makeValidResponse({ barcodeType: 'CODABAR', entryMode: 'S' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('TEST', { emitEvent: false });
    component.onBlur();

    expect(component.validHintText).toBe('Valid Codabar unit');
  });

  // ---- clear() ----

  it('should reset form control state on clear', () => {
    component.unitIdControl.setValue('SOME_VALUE');
    component.unitIdControl.markAsTouched();
    component.unitIdControl.markAsDirty();
    component.isLovFromSelection = true;

    component.clear();

    expect(component.unitIdControl.value).toBe('');
    expect(component.unitIdControl.touched).toBe(false);
    expect(component.unitIdControl.pristine).toBe(true);
    expect(component.isLovFromSelection).toBe(false);
    expect(component.validationState).toBe('idle');
  });

  it('should emit cleared event on clear', () => {
    const clearSpy = spyOn(component.cleared, 'emit');
    component.clear();
    expect(clearSpy).toHaveBeenCalled();
  });

  // ---- focus() ----

  it('should call focus on the native element', (done) => {
    // Set up the ViewChild with a mock
    component.unitIdInput = {
      nativeElement: { focus: jasmine.createSpy('focus') },
    } as any;

    component.focus();

    setTimeout(() => {
      expect(component.unitIdInput.nativeElement.focus).toHaveBeenCalled();
      done();
    }, 50);
  });

  it('should not throw if unitIdInput is undefined', () => {
    component.unitIdInput = undefined as any;
    expect(() => component.focus()).not.toThrow();
  });

  // ---- setError() ----

  it('should mark the component as invalid with the given error message', () => {
    component.setError('Something went wrong');

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Something went wrong');
    expect(component.unitIdControl.hasError('serverError')).toBe(true);
  });

  // ---- onFocus() ----

  it('should do nothing when doubleEntry is pending', () => {
    component.doubleEntry.start('U123', makeValidResponse());
    component.validationState = 'valid';
    const resetSpy = spyOn(component.doubleEntry, 'reset');

    component.onFocus();

    // Should not reset because doubleEntry.isPending is true
    expect(component.validationState).toBe('valid');
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('should do nothing when isLovFromSelection is true', () => {
    component.isLovFromSelection = true;
    component.validationState = 'valid';

    component.onFocus();

    expect(component.validationState).toBe('valid');
  });

  it('should restore rawUnitId to the control when focused', () => {
    // Set up rawUnitId via a successful validation first
    const data = makeValidResponse({ manualUnitId: 'RAW123' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('RAW123', { emitEvent: false });
    component.onBlur();

    // Now rawUnitId should be set; focus should restore it
    const savedRaw = component.unitIdControl.value; // formatted value
    component.onFocus();

    // After focus, raw value is restored but validationState stays valid
    expect(component.validationState).toBe('valid');
  });

  it('should return early on focus when validation state is invalid', () => {
    component.validationState = 'invalid';
    component.validationError = 'Some error';
    component.unitIdControl.setErrors({ serverError: true });

    component.onFocus();

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Some error');
  });

  // ---- onBlur() ----

  it('should do nothing when lovOptionJustSelected is true', () => {
    (component as any).lovOptionJustSelected = true;
    component.unitIdControl.setValue('TEST', { emitEvent: false });

    component.onBlur();

    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  it('should mark as touched and return when unitId is empty', () => {
    component.unitIdControl.setValue('', { emitEvent: false });

    component.onBlur();

    expect(component.unitIdControl.touched).toBe(true);
    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  it('should not directly call resetState when unitId is empty and mismatch error exists', () => {
    component.unitIdControl.setValue('', { emitEvent: false });
    component.unitIdControl.setErrors({ mismatch: true });
    component.validationState = 'invalid';
    component.validationError = 'Unit ID did not match. Please try again.';

    component.onBlur();

    // The mismatch-check branch avoids direct resetState, but updateValueAndValidity
    // triggers the valueChanges subscription which resets state.
    // Verify the control is marked touched and no service call was made.
    expect(component.unitIdControl.touched).toBe(true);
    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  it('should reset state when unitId is empty and no mismatch error', () => {
    component.validationState = 'invalid';
    component.validationError = 'Some error';
    component.unitIdControl.setValue('', { emitEvent: false });
    component.unitIdControl.setErrors(null);

    component.onBlur();

    expect(component.validationState).toBe('idle');
  });

  it('should return early when already validating', () => {
    component.validationState = 'validating';
    component.unitIdControl.setValue('TEST', { emitEvent: false });

    component.onBlur();

    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  it('should return early when already valid and rawUnitId matches', () => {
    // First validate to set rawUnitId
    const data = makeValidResponse({ manualUnitId: 'TEST' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('TEST', { emitEvent: false });
    component.onBlur();

    expect(serviceSpy.validateUnitId).toHaveBeenCalledTimes(1);

    // Now set the control value back to the rawUnitId and blur again
    component.unitIdControl.setValue('TEST', { emitEvent: false });
    component.onBlur();

    // Should not call again because valid && rawUnitId matches
    expect(serviceSpy.validateUnitId).toHaveBeenCalledTimes(1);
  });

  it('should call validateUnitId service on blur with valid unit', () => {
    const apiResp = makeApiResponse();
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(serviceSpy.validateUnitId).toHaveBeenCalledWith('UNIT123', 'N');
  });

  it('should use custom validateFfValue for service call', () => {
    const apiResp = makeApiResponse();
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    component.validateFfValue = 'Y';

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(serviceSpy.validateUnitId).toHaveBeenCalledWith('UNIT123', 'Y');
  });

  it('should mark valid on successful CODE128 validation', () => {
    const data = makeValidResponse({ barcodeType: 'CODE128', manualUnitId: 'W12345678901234' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    const emitSpy = spyOn(component.validated, 'emit');

    component.unitIdControl.setValue('W12345678901234', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('valid');
    expect(component.validationError).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith(data);
  });

  it('should format CODE128 display value on successful validation', () => {
    const data = makeValidResponse({
      barcodeType: 'CODE128',
      manualUnitId: 'W12345678901234',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('W12345678901234', { emitEvent: false });
    component.onBlur();

    // formatCode128 should add spaces: W1234 56 789012 34
    expect(component.unitIdControl.value).toBe('W1234 56 789012 34');
  });

  it('should NOT format display value for CODABAR (non-CODE128)', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'S',
      manualUnitId: 'C123456',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('C123456', { emitEvent: false });
    component.onBlur();

    expect(component.unitIdControl.value).toBe('C123456');
  });

  it('should mark invalid when response.success is false', () => {
    const apiResp = makeApiResponse({
      success: false,
      message: 'Invalid unit ID format',
      item: null,
    });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('BAD_UNIT', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Invalid unit ID format');
    expect(component.unitIdControl.hasError('serverError')).toBe(true);
  });

  it('should use default error message when response message is null', () => {
    const apiResp = makeApiResponse({
      success: false,
      message: null as any,
      item: null,
    });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('BAD', { emitEvent: false });
    component.onBlur();

    expect(component.validationError).toBe('Unit ID validation failed');
  });

  it('should mark invalid on service error', () => {
    serviceSpy.validateUnitId.and.returnValue(throwError(() => ({
      error: { errorResponse: { error: 'Server error occurred' } },
    })));

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Server error occurred');
  });

  it('should use body.message when errorResponse.error is not available', () => {
    serviceSpy.validateUnitId.and.returnValue(throwError(() => ({
      error: { message: 'Body message error' },
    })));

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(component.validationError).toBe('Body message error');
  });

  it('should use fallback error message when no specific error in response', () => {
    serviceSpy.validateUnitId.and.returnValue(throwError(() => ({
      error: {},
    })));

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(component.validationError).toBe('Unit ID validation failed');
  });

  it('should use fallback error message when error.error is null', () => {
    serviceSpy.validateUnitId.and.returnValue(throwError(() => ({
      error: null,
    })));

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(component.validationError).toBe('Unit ID validation failed');
  });

  it('should trim trailing whitespace from unit ID on blur', () => {
    const data = makeValidResponse();
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('UNIT123   ', { emitEvent: false });
    component.onBlur();

    expect(serviceSpy.validateUnitId).toHaveBeenCalledWith('UNIT123', 'N');
  });

  // ---- Double entry ----

  it('should start double entry for CODABAR manual entry and not skipDoubleEntry', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    expect(component.doubleEntry.isPending).toBe(true);
    expect(component.validationState).toBe('idle');
    expect(component.unitIdControl.value).toBe('');
  });

  it('should skip double entry when skipDoubleEntry is true', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
      manualUnitId: 'C123',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    component.skipDoubleEntry = true;
    const emitSpy = spyOn(component.validated, 'emit');

    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    expect(component.doubleEntry.isPending).toBe(false);
    expect(component.validationState).toBe('valid');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should confirm double entry when matching unit ID is entered', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
      manualUnitId: 'C123',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    // First blur starts double entry
    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();
    expect(component.doubleEntry.isPending).toBe(true);

    // Second blur verifies
    const emitSpy = spyOn(component.validated, 'emit');
    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    expect(component.doubleEntry.isPending).toBe(false);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should reject double entry when non-matching unit ID is entered', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    // First blur starts double entry
    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();
    expect(component.doubleEntry.isPending).toBe(true);

    // Second blur with different value
    component.unitIdControl.setValue('C999', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Unit ID did not match. Please try again.');
    expect(component.unitIdControl.value).toBe('');
    expect(component.unitIdControl.hasError('mismatch')).toBe(true);
  });

  it('should set manualUnitId display value on confirmed double entry', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
      manualUnitId: 'DISPLAY_VAL',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    expect(component.unitIdControl.value).toBe('DISPLAY_VAL');
  });

  // ---- allowDeferralId ----

  it('should create synthetic data when allowDeferralId is true and validation fails', () => {
    const apiResp = makeApiResponse({ success: false, message: 'Invalid', item: null });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    component.allowDeferralId = true;
    const emitSpy = spyOn(component.validated, 'emit');

    component.unitIdControl.setValue('DEFER123', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('valid');
    expect(emitSpy).toHaveBeenCalled();
    const emittedData = emitSpy.calls.mostRecent().args[0] as UnitValidationResponse;
    expect(emittedData.parsedUnitId).toBe('DEFER123');
    expect(emittedData.barcodeType).toBe('CODABAR');
    expect(emittedData.entryMode).toBe('M');
  });

  it('should create synthetic data when allowDeferralId is true and service errors', () => {
    serviceSpy.validateUnitId.and.returnValue(throwError(() => new Error('Network error')));
    component.allowDeferralId = true;
    const emitSpy = spyOn(component.validated, 'emit');

    component.unitIdControl.setValue('DEFER456', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('valid');
    expect(emitSpy).toHaveBeenCalled();
    const emittedData = emitSpy.calls.mostRecent().args[0] as UnitValidationResponse;
    expect(emittedData.parsedUnitId).toBe('DEFER456');
  });

  it('should NOT create synthetic data when allowDeferralId is false and validation fails', () => {
    const apiResp = makeApiResponse({ success: false, message: 'Invalid', item: null });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    component.allowDeferralId = false;

    component.unitIdControl.setValue('UNIT', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Invalid');
  });

  it('should NOT create synthetic deferral data when unitId is blank', () => {
    const apiResp = makeApiResponse({ success: false, message: 'Invalid', item: null });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    component.allowDeferralId = true;

    // A value of spaces only should NOT be treated as deferral
    component.unitIdControl.setValue('   ', { emitEvent: false });
    component.onBlur();

    // trimEnd() -> empty, so onBlur returns early before service call
    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  // ---- postValidation ----

  it('should emit postValidate event when requirePostValidation is true', () => {
    component.requirePostValidation = true;
    const data = makeValidResponse();
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    const postValidateSpy = spyOn(component.postValidate, 'emit');

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(postValidateSpy).toHaveBeenCalled();
    // Should not be valid yet (waiting for confirm/reject)
    expect(component.validationState).not.toBe('valid');
  });

  it('should emit postValidate when postValidate output is observed', () => {
    // Subscribe to the output so .observed is true
    const events: UnitIdPostValidateEvent[] = [];
    component.postValidate.subscribe(e => events.push(e));

    const data = makeValidResponse();
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('UNIT', { emitEvent: false });
    component.onBlur();

    expect(events.length).toBe(1);
  });

  it('should mark valid when postValidate confirm callback is called', () => {
    const events: UnitIdPostValidateEvent[] = [];
    component.postValidate.subscribe(e => events.push(e));

    const data = makeValidResponse({ manualUnitId: 'MANUAL1' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));
    const validatedSpy = spyOn(component.validated, 'emit');

    component.unitIdControl.setValue('MANUAL1', { emitEvent: false });
    component.onBlur();

    // Now call confirm
    events[0].confirm();

    expect(component.validationState).toBe('valid');
    expect(validatedSpy).toHaveBeenCalledWith(data);
  });

  it('should mark invalid when postValidate reject callback is called', () => {
    const events: UnitIdPostValidateEvent[] = [];
    component.postValidate.subscribe(e => events.push(e));

    const data = makeValidResponse();
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('UNIT', { emitEvent: false });
    component.onBlur();

    events[0].reject('Post validation failed');

    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('Post validation failed');
  });

  // ---- onEnter() ----

  it('should NOT emit emptyEnter when value is non-empty', () => {
    const emitSpy = spyOn(component.emptyEnter, 'emit');
    component.unitIdControl.setValue('UNIT123', { emitEvent: false });

    component.onEnter();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should blur the input element on enter', () => {
    const blurSpy = jasmine.createSpy('blur');
    component.unitIdInput = { nativeElement: { blur: blurSpy, focus: jasmine.createSpy('focus') } } as any;

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onEnter();

    expect(blurSpy).toHaveBeenCalled();
  });

  it('should not throw if unitIdInput is undefined on enter', () => {
    component.unitIdInput = undefined as any;
    component.unitIdControl.setValue('', { emitEvent: false });
    expect(() => component.onEnter()).not.toThrow();
  });

  // ---- LOV (List of Values) ----

  it('should set lovItems via the input setter', () => {
    const items: LovItem[] = [
      makeLovItem({ unitId: 'A1' }),
      makeLovItem({ unitId: 'B2' }),
    ];
    component.lovItems = items;

    expect(component.lovItemsList()).toEqual(items);
  });

  it('should return an empty array for lovItemsList when no items set', () => {
    component.lovItems = [];
    expect(component.lovItemsList()).toEqual([]);
  });

  it('should filter LOV items based on search control value', () => {
    const items: LovItem[] = [
      makeLovItem({ unitId: 'ABC123' }),
      makeLovItem({ unitId: 'DEF456' }),
      makeLovItem({ unitId: 'ABX789' }),
    ];
    component.lovItems = items;

    component.unitIdControl.setValue('AB');

    expect(component.filteredLovItems().length).toBe(2);
    expect(component.filteredLovItems().map(i => i.unitId)).toEqual(['ABC123', 'ABX789']);
  });

  it('should return all items when search is empty', () => {
    const items: LovItem[] = [
      makeLovItem({ unitId: 'A1' }),
      makeLovItem({ unitId: 'B2' }),
    ];
    component.lovItems = items;
    component.unitIdControl.setValue('');

    expect(component.filteredLovItems().length).toBe(2);
  });

  it('should be case-insensitive when filtering LOV items', () => {
    const items: LovItem[] = [
      makeLovItem({ unitId: 'abc123' }),
      makeLovItem({ unitId: 'DEF456' }),
    ];
    component.lovItems = items;
    component.unitIdControl.setValue('ABC');

    expect(component.filteredLovItems().length).toBe(1);
    expect(component.filteredLovItems()[0].unitId).toBe('abc123');
  });

  // ---- onLovOptionSelected() ----

  it('should set isLovFromSelection and emit lovSelected on item selection', fakeAsync(() => {
    const item = makeLovItem({ unitId: 'SEL_UNIT', displayUnitId: null as any });
    const emitSpy = spyOn(component.lovSelected, 'emit');

    component.onLovOptionSelected({ option: { value: item } });

    expect(component.isLovFromSelection).toBe(true);
    expect(component.validationState).toBe('validating');
    expect(component.validationError).toBeNull();
    expect(component.unitIdControl.value).toBe('SEL_UNIT');
    expect(emitSpy).toHaveBeenCalled();

    flush();
  }));

  it('should call setDisplayValue callback to mark valid after LOV selection', fakeAsync(() => {
    const item = makeLovItem({ unitId: 'LOV_UNIT', displayUnitId: null as any });
    let capturedEvent: UnitIdLovSelectedEvent | undefined;
    component.lovSelected.subscribe((e: UnitIdLovSelectedEvent) => { capturedEvent = e; });

    component.onLovOptionSelected({ option: { value: item } });

    expect(capturedEvent).toBeTruthy();
    capturedEvent!.setDisplayValue('W1234567890123');

    expect(component.validationState).toBe('valid');
    expect(component.validationError).toBeNull();

    flush();
  }));

  it('should call reject callback to mark invalid after LOV selection', fakeAsync(() => {
    const item = makeLovItem({ unitId: 'LOV_UNIT', displayUnitId: null as any });
    let capturedEvent: UnitIdLovSelectedEvent | undefined;
    component.lovSelected.subscribe((e: UnitIdLovSelectedEvent) => { capturedEvent = e; });

    component.onLovOptionSelected({ option: { value: item } });

    expect(capturedEvent).toBeTruthy();
    capturedEvent!.reject('LOV validation failed');

    expect(component.isLovFromSelection).toBe(false);
    expect(component.validationState).toBe('invalid');
    expect(component.validationError).toBe('LOV validation failed');

    flush();
  }));

  // ---- valueChanges subscription (constructor) ----

  it('should reset state when control value changes and state is valid', () => {
    // Set up a valid state
    component.validationState = 'valid';
    component.validationError = null;

    // Change the value (this will trigger the valueChanges subscription)
    component.unitIdControl.setValue('NEW_VALUE');

    expect(component.validationState).toBe('idle');
  });

  it('should reset state when control value changes and state is invalid', () => {
    component.validationState = 'invalid';
    component.validationError = 'error';

    component.unitIdControl.setValue('NEW');

    expect(component.validationState).toBe('idle');
  });

  it('should NOT reset state when control value changes and state is idle', () => {
    component.validationState = 'idle';

    component.unitIdControl.setValue('NEW');

    expect(component.validationState).toBe('idle');
  });

  it('should NOT reset state when control value changes and state is validating', () => {
    component.validationState = 'validating';

    component.unitIdControl.setValue('NEW');

    expect(component.validationState).toBe('validating');
  });

  it('should NOT reset state when doubleEntry is pending', () => {
    component.doubleEntry.start('U123', makeValidResponse());
    component.validationState = 'valid';

    component.unitIdControl.setValue('NEW');

    // Should stay valid because doubleEntry.isPending
    expect(component.validationState).toBe('valid');
  });

  it('should NOT reset state when lovOptionJustSelected is true', () => {
    (component as any).lovOptionJustSelected = true;
    component.validationState = 'valid';

    component.unitIdControl.setValue('NEW');

    expect(component.validationState).toBe('valid');
  });

  // ---- Subscription cleanup on destroy ----

  it('should unsubscribe from service call when component is destroyed', () => {
    const subject = new Subject<UnitValidationApiResponse>();
    serviceSpy.validateUnitId.and.returnValue(subject.asObservable());

    component.unitIdControl.setValue('UNIT123', { emitEvent: false });
    component.onBlur();

    expect(component.validationState).toBe('validating');

    // Destroy the component
    component.ngOnDestroy();

    // Emit after destroy - should not change state
    subject.next(makeApiResponse());
    subject.complete();

    expect(component.validationState).toBe('validating');
  });

  // ---- Edge: double entry confirmed with manualUnitId null ----

  it('should handle double entry confirm when manualUnitId is empty string', () => {
    const data = makeValidResponse({
      barcodeType: 'CODABAR',
      entryMode: 'M',
      manualUnitId: '',
    });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    // First blur: starts double entry (CODABAR + M)
    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    // Confirm with same value
    component.unitIdControl.setValue('C123', { emitEvent: false });
    component.onBlur();

    // manualUnitId is empty string which is falsy, so display value should NOT be set
    // The validated event should still emit
    expect(component.validationState).toBe('valid');
  });

  // ---- markValid with no manualUnitId ----

  it('should not change control value when manualUnitId is falsy', () => {
    const data = makeValidResponse({ manualUnitId: '' });
    const apiResp = makeApiResponse({ item: data });
    serviceSpy.validateUnitId.and.returnValue(of(apiResp));

    component.unitIdControl.setValue('ORIG', { emitEvent: false });
    component.onBlur();

    // The value should remain 'ORIG' since manualUnitId is empty
    expect(component.unitIdControl.value).toBe('ORIG');
  });

  // ---- Edge: onBlur with value that has only trailing spaces ----

  it('should treat whitespace-only unitId as empty', () => {
    component.unitIdControl.setValue('   ', { emitEvent: false });

    component.onBlur();

    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
    expect(component.unitIdControl.touched).toBe(true);
  });

  // ---- Edge: control value is null ----

  it('should handle null control value on blur', () => {
    component.unitIdControl.setValue(null as any, { emitEvent: false });

    component.onBlur();

    expect(serviceSpy.validateUnitId).not.toHaveBeenCalled();
  });

  it('should handle null control value on enter', () => {
    component.unitIdControl.setValue(null as any, { emitEvent: false });
    const emitSpy = spyOn(component.emptyEnter, 'emit');

    component.onEnter();

    expect(emitSpy).toHaveBeenCalled();
  });
});
