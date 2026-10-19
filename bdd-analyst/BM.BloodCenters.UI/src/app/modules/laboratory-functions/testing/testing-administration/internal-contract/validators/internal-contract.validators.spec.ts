import { FormControl, FormGroup } from '@angular/forms';
import {
  taxIdNumericValidator,
  barcodeProtocolValidator,
  unitIdPatternValidator,
  ediInputValidator,
  resultOutputValidator,
  confirmTestFlagValidator,
  stateRequiredValidator,
  stopLabelFlagValidator,
  contactTypeValidator,
  phoneNumberValidator,
  duplicateTestIdValidator,
} from './internal-contract.validators';

describe('Internal Contract Validators', () => {

  describe('taxIdNumericValidator', () => {
    let validator: ReturnType<typeof taxIdNumericValidator>;

    beforeEach(() => {
      validator = taxIdNumericValidator();
    });

    it('should return null for null value (optional field)', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid 9-digit numeric string', () => {
      const control = new FormControl('123456789');
      expect(validator(control)).toBeNull();
    });

    it('should return null for single digit', () => {
      const control = new FormControl('1');
      expect(validator(control)).toBeNull();
    });

    it('should return null for numeric string up to 9 digits', () => {
      const control = new FormControl('12345');
      expect(validator(control)).toBeNull();
    });

    it('should return error for alphanumeric value', () => {
      const control = new FormControl('123ABC');
      expect(validator(control)).toEqual({ taxIdNotNumeric: true });
    });

    it('should return error for value exceeding 9 digits', () => {
      const control = new FormControl('1234567890');
      expect(validator(control)).toEqual({ taxIdNotNumeric: true });
    });

    it('should return error for special characters', () => {
      const control = new FormControl('12-34-5678');
      expect(validator(control)).toEqual({ taxIdNotNumeric: true });
    });

    it('should return error for spaces', () => {
      const control = new FormControl('123 456');
      expect(validator(control)).toEqual({ taxIdNotNumeric: true });
    });
  });

  describe('barcodeProtocolValidator', () => {
    it('should return null for valid protocol', () => {
      const validator = barcodeProtocolValidator(['8', 'I', 'C']);
      const control = new FormControl('8');
      expect(validator(control)).toBeNull();
    });

    it('should return required error for null value', () => {
      const validator = barcodeProtocolValidator(['8', 'I', 'C']);
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return required error for empty string', () => {
      const validator = barcodeProtocolValidator(['8', 'I', 'C']);
      const control = new FormControl('');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return invalidBarcodeProtocol for invalid value', () => {
      const validator = barcodeProtocolValidator(['8', 'I', 'C']);
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidBarcodeProtocol: true });
    });

    it('should validate against provided protocol list', () => {
      const validator = barcodeProtocolValidator(['A', 'B']);
      const control = new FormControl('C');
      expect(validator(control)).toEqual({ invalidBarcodeProtocol: true });
    });

    it('should return null for each valid protocol in list', () => {
      const protocols = ['8', 'I', 'C'];
      const validator = barcodeProtocolValidator(protocols);
      protocols.forEach(p => {
        expect(validator(new FormControl(p))).toBeNull();
      });
    });

    it('should return required for undefined value', () => {
      const validator = barcodeProtocolValidator(['8']);
      const control = new FormControl(undefined);
      expect(validator(control)).toEqual({ required: true });
    });
  });

  describe('unitIdPatternValidator', () => {
    let validator: ReturnType<typeof unitIdPatternValidator>;

    beforeEach(() => {
      validator = unitIdPatternValidator();
    });

    it('should return null when control has no parent', () => {
      const control = new FormControl('=');
      expect(validator(control)).toBeNull();
    });

    describe('when barcode protocol is 8', () => {
      it('should return null for = pattern', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('8'),
          unitIdPattern: new FormControl('='),
        });
        expect(validator(group.get('unitIdPattern')!)).toBeNull();
      });

      it('should return null for & pattern', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('8'),
          unitIdPattern: new FormControl('&'),
        });
        expect(validator(group.get('unitIdPattern')!)).toBeNull();
      });

      it('should return unitIdPatternRequired when pattern is null', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('8'),
          unitIdPattern: new FormControl(null),
        });
        expect(validator(group.get('unitIdPattern')!)).toEqual({ unitIdPatternRequired: true });
      });

      it('should return unitIdPatternRequired when pattern is empty', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('8'),
          unitIdPattern: new FormControl(''),
        });
        expect(validator(group.get('unitIdPattern')!)).toEqual({ unitIdPatternRequired: true });
      });

      it('should return invalidUnitIdPattern for invalid pattern', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('8'),
          unitIdPattern: new FormControl('X'),
        });
        expect(validator(group.get('unitIdPattern')!)).toEqual({ invalidUnitIdPattern: true });
      });
    });

    describe('when barcode protocol is not 8', () => {
      it('should return null when pattern is null', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('I'),
          unitIdPattern: new FormControl(null),
        });
        expect(validator(group.get('unitIdPattern')!)).toBeNull();
      });

      it('should return null when pattern is empty string', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('I'),
          unitIdPattern: new FormControl(''),
        });
        expect(validator(group.get('unitIdPattern')!)).toBeNull();
      });

      it('should return unitIdPatternNotAllowed when pattern has a value', () => {
        const group = new FormGroup({
          barCodeProtocol: new FormControl('I'),
          unitIdPattern: new FormControl('='),
        });
        expect(validator(group.get('unitIdPattern')!)).toEqual({ unitIdPatternNotAllowed: true });
      });
    });
  });

  describe('ediInputValidator', () => {
    let validator: ReturnType<typeof ediInputValidator>;

    beforeEach(() => {
      validator = ediInputValidator();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for Y value', () => {
      const control = new FormControl('Y');
      expect(validator(control)).toBeNull();
    });

    it('should return error for N value', () => {
      const control = new FormControl('N');
      expect(validator(control)).toEqual({ invalidEdiInput: true });
    });

    it('should return error for lowercase y', () => {
      const control = new FormControl('y');
      expect(validator(control)).toEqual({ invalidEdiInput: true });
    });

    it('should return error for other string values', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidEdiInput: true });
    });

    it('should return error for boolean true', () => {
      const control = new FormControl(true);
      expect(validator(control)).toEqual({ invalidEdiInput: true });
    });
  });

  describe('resultOutputValidator', () => {
    let validator: ReturnType<typeof resultOutputValidator>;

    beforeEach(() => {
      validator = resultOutputValidator();
    });

    it('should return null for R value', () => {
      const control = new FormControl('R');
      expect(validator(control)).toBeNull();
    });

    it('should return null for B value', () => {
      const control = new FormControl('B');
      expect(validator(control)).toBeNull();
    });

    it('should return null for E value', () => {
      const control = new FormControl('E');
      expect(validator(control)).toBeNull();
    });

    it('should return required error for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return required error for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return invalidResultOutput for invalid value', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidResultOutput: true });
    });

    it('should return invalidResultOutput for lowercase valid letters', () => {
      const control = new FormControl('r');
      expect(validator(control)).toEqual({ invalidResultOutput: true });
    });
  });

  describe('confirmTestFlagValidator', () => {
    let validator: ReturnType<typeof confirmTestFlagValidator>;

    beforeEach(() => {
      validator = confirmTestFlagValidator();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for Y value', () => {
      const control = new FormControl('Y');
      expect(validator(control)).toBeNull();
    });

    it('should return error for N value', () => {
      const control = new FormControl('N');
      expect(validator(control)).toEqual({ invalidConfirmTestFlag: true });
    });

    it('should return error for lowercase y', () => {
      const control = new FormControl('y');
      expect(validator(control)).toEqual({ invalidConfirmTestFlag: true });
    });

    it('should return error for other string values', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidConfirmTestFlag: true });
    });
  });

  describe('stateRequiredValidator', () => {
    let validator: ReturnType<typeof stateRequiredValidator>;

    beforeEach(() => {
      validator = stateRequiredValidator();
    });

    it('should return null when control has no parent', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return stateRequired when intFlag is not Y and state is empty', () => {
      const group = new FormGroup({
        intFlag: new FormControl('N'),
        state: new FormControl(null),
      });
      expect(validator(group.get('state')!)).toEqual({ stateRequired: true });
    });

    it('should return stateRequired when intFlag is null and state is empty', () => {
      const group = new FormGroup({
        intFlag: new FormControl(null),
        state: new FormControl(''),
      });
      expect(validator(group.get('state')!)).toEqual({ stateRequired: true });
    });

    it('should return null when intFlag is Y (international)', () => {
      const group = new FormGroup({
        intFlag: new FormControl('Y'),
        state: new FormControl(null),
      });
      expect(validator(group.get('state')!)).toBeNull();
    });

    it('should return null when intFlag is not Y but state is provided', () => {
      const group = new FormGroup({
        intFlag: new FormControl('N'),
        state: new FormControl('TX'),
      });
      expect(validator(group.get('state')!)).toBeNull();
    });

    it('should return null when intFlag is Y and state is provided', () => {
      const group = new FormGroup({
        intFlag: new FormControl('Y'),
        state: new FormControl('ON'),
      });
      expect(validator(group.get('state')!)).toBeNull();
    });
  });

  describe('stopLabelFlagValidator', () => {
    let validator: ReturnType<typeof stopLabelFlagValidator>;

    beforeEach(() => {
      validator = stopLabelFlagValidator();
    });

    it('should return null for Y value', () => {
      const control = new FormControl('Y');
      expect(validator(control)).toBeNull();
    });

    it('should return null for N value', () => {
      const control = new FormControl('N');
      expect(validator(control)).toBeNull();
    });

    it('should return required error for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return required error for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return invalidStopLabelFlag for invalid value', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidStopLabelFlag: true });
    });

    it('should return invalidStopLabelFlag for lowercase y', () => {
      const control = new FormControl('y');
      expect(validator(control)).toEqual({ invalidStopLabelFlag: true });
    });

    it('should return required error for undefined', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toEqual({ required: true });
    });
  });

  describe('contactTypeValidator', () => {
    let validator: ReturnType<typeof contactTypeValidator>;

    beforeEach(() => {
      validator = contactTypeValidator();
    });

    it('should return null for C value', () => {
      const control = new FormControl('C');
      expect(validator(control)).toBeNull();
    });

    it('should return null for I value', () => {
      const control = new FormControl('I');
      expect(validator(control)).toBeNull();
    });

    it('should return required error for null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return required error for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return invalidContactType for invalid value', () => {
      const control = new FormControl('X');
      expect(validator(control)).toEqual({ invalidContactType: true });
    });

    it('should return invalidContactType for lowercase c', () => {
      const control = new FormControl('c');
      expect(validator(control)).toEqual({ invalidContactType: true });
    });
  });

  describe('phoneNumberValidator', () => {
    let validator: ReturnType<typeof phoneNumberValidator>;

    beforeEach(() => {
      validator = phoneNumberValidator();
    });

    it('should return null for null value (optional)', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined', () => {
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return null for valid phone format 999-999-9999', () => {
      const control = new FormControl('123-456-7890');
      expect(validator(control)).toBeNull();
    });

    it('should return error for phone without dashes', () => {
      const control = new FormControl('1234567890');
      expect(validator(control)).toEqual({ invalidPhoneNumber: true });
    });

    it('should return error for phone with spaces', () => {
      const control = new FormControl('123 456 7890');
      expect(validator(control)).toEqual({ invalidPhoneNumber: true });
    });

    it('should return error for phone with parentheses', () => {
      const control = new FormControl('(123) 456-7890');
      expect(validator(control)).toEqual({ invalidPhoneNumber: true });
    });

    it('should return error for phone with letters', () => {
      const control = new FormControl('123-ABC-7890');
      expect(validator(control)).toEqual({ invalidPhoneNumber: true });
    });

    it('should return error for incomplete phone number', () => {
      const control = new FormControl('123-456');
      expect(validator(control)).toEqual({ invalidPhoneNumber: true });
    });
  });

  describe('duplicateTestIdValidator', () => {
    it('should return null for null value', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });

    it('should return null for empty string', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for undefined', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl(undefined);
      expect(validator(control)).toBeNull();
    });

    it('should return null for non-duplicate test ID', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl('HBsAg');
      expect(validator(control)).toBeNull();
    });

    it('should return duplicateTestId error for existing test ID', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl('ABO');
      expect(validator(control)).toEqual({ duplicateTestId: true });
    });

    it('should return null for current test ID in edit mode', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH'], 'ABO');
      const control = new FormControl('ABO');
      expect(validator(control)).toBeNull();
    });

    it('should return duplicateTestId for non-current duplicate in edit mode', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH'], 'ABO');
      const control = new FormControl('RH');
      expect(validator(control)).toEqual({ duplicateTestId: true });
    });

    it('should return null when existing list is empty', () => {
      const validator = duplicateTestIdValidator([]);
      const control = new FormControl('ABO');
      expect(validator(control)).toBeNull();
    });

    it('should return null for current test ID even when not in existing list', () => {
      const validator = duplicateTestIdValidator([], 'XYZ');
      const control = new FormControl('XYZ');
      expect(validator(control)).toBeNull();
    });

    it('should handle case-sensitive comparison', () => {
      const validator = duplicateTestIdValidator(['ABO']);
      const control = new FormControl('abo');
      expect(validator(control)).toBeNull();
    });

    it('should work without currentTestId parameter', () => {
      const validator = duplicateTestIdValidator(['ABO', 'RH']);
      const control = new FormControl('ABO');
      expect(validator(control)).toEqual({ duplicateTestId: true });
    });
  });
});
