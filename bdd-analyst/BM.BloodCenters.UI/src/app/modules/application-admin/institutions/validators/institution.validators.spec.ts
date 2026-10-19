import { FormControl, FormGroup } from '@angular/forms';
import {
  institutionNameValidator,
  shortNameValidator,
  printHeaderValidator,
  systemNameValidator,
  contractPrefixValidator,
  cityValidator,
  stateValidator,
  postalCodeValidator,
  countryValidator,
  phoneFaxValidator,
  internationalPhoneFaxValidator,
  codabarSchemeValidator,
  registrationNumberValidator,
  licenseNumberValidator,
  effectiveDateValidator,
  addressLineValidator,
  addressCompletenessValidator
} from './institution.validators';
import { CodabarScheme } from '@shared/enums/codabar-scheme.enum';
import moment from 'moment';

describe('Institution Validators', () => {

  describe('institutionNameValidator', () => {
    it('should pass for valid institution name', () => {
      const control = new FormControl('Dallas Blood Center');
      const validator = institutionNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should pass for name with pipe character', () => {
      const control = new FormControl('Dallas | Blood Center');
      const validator = institutionNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for name exceeding 50 characters', () => {
      const control = new FormControl('A'.repeat(51));
      const validator = institutionNameValidator();
      expect(validator(control)).toEqual({ maxLength: { requiredLength: 50, actualLength: 51 } });
    });

    it('should fail for name with invalid characters', () => {
      const control = new FormControl('Test@Institution');
      const validator = institutionNameValidator();
      expect(validator(control)).toEqual({ specialChars: true });
    });

    it('should not allow null/empty values', () => {
      const validator = institutionNameValidator();
      expect(validator(new FormControl(null))).toEqual({ required: true });
      expect(validator(new FormControl(''))).toEqual({ required: true });
    });
  });

  describe('contractPrefixValidator', () => {
    it('should pass for valid 3-letter prefix', () => {
      const control = new FormControl('DBC');
      const validator = contractPrefixValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for non-alphabetic characters', () => {
      const control = new FormControl('D12');
      const validator = contractPrefixValidator();
      expect(validator(control)).toEqual({ invalidContractPrefix: true });
    });

    it('should fail for length not equal to 3', () => {
      const control = new FormControl('AB');
      const validator = contractPrefixValidator();
      expect(validator(control)).toEqual({ invalidContractPrefix: true });
    });

    it('should pass for required validation when empty', () => {
      const control = new FormControl('');
      const validator = contractPrefixValidator();
      expect(validator(control)).toEqual({ required: true });
    });
  });

  describe('codabarSchemeValidator', () => {
    it('should pass for valid enum values', () => {
      const validator = codabarSchemeValidator();
      expect(validator(new FormControl(CodabarScheme.ALPHANUMERIC))).toBeNull();
      expect(validator(new FormControl(CodabarScheme.NUMERIC))).toBeNull();
      expect(validator(new FormControl(CodabarScheme.CODE128))).toBeNull();
    });

    it('should fail for invalid enum value', () => {
      const control = new FormControl('INVALID');
      const validator = codabarSchemeValidator();
      expect(validator(control)).toEqual({ invalidCodabarScheme: true });
    });

    it('should allow null value', () => {
      const control = new FormControl(null);
      const validator = codabarSchemeValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('effectiveDateValidator', () => {
    it('should fail for null value (required)', () => {
      const control = new FormControl(null);
      const validator = effectiveDateValidator('create');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should fail for past date in CREATE mode', () => {
      const control = new FormControl(moment().subtract(1, 'days'));
      const validator = effectiveDateValidator('create');
      expect(validator(control)).toEqual({ dateInPast: true });
    });

    it('should pass for today in CREATE mode', () => {
      const control = new FormControl(moment());
      const validator = effectiveDateValidator('create');
      expect(validator(control)).toBeNull();
    });

    it('should pass for future date in CREATE mode', () => {
      const control = new FormControl(moment().add(1, 'days'));
      const validator = effectiveDateValidator('create');
      expect(validator(control)).toBeNull();
    });

    it('should pass for past date in EDIT mode', () => {
      const control = new FormControl(moment().subtract(30, 'days'));
      const validator = effectiveDateValidator('edit');
      expect(validator(control)).toBeNull();
    });
  });

  describe('phoneFaxValidator', () => {
    it('should pass for valid 10-digit phone number', () => {
      const control = new FormControl('1234567890');
      const validator = phoneFaxValidator();
      expect(validator(control)).toBeNull();
    });

    it('should pass for formatted phone number', () => {
      const control = new FormControl('123-456-7890');
      const validator = phoneFaxValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for phone number with less than 10 digits', () => {
      const control = new FormControl('12345');
      const validator = phoneFaxValidator();
      expect(validator(control)).toEqual({ exactLength: { requiredLength: 10, actualLength: 5 } });
    });

    it('should fail for phone number with more than 10 digits', () => {
      const control = new FormControl('12345678901');
      const validator = phoneFaxValidator();
      expect(validator(control)).toEqual({ exactLength: { requiredLength: 10, actualLength: 11 } });
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      const validator = phoneFaxValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('internationalPhoneFaxValidator', () => {
    it('should pass for international phone with +', () => {
      const control = new FormControl('+441234567890');
      const validator = internationalPhoneFaxValidator();
      expect(validator(control)).toBeNull();
    });

    it('should pass for international phone without spaces', () => {
      const control = new FormControl('00441234567890');
      const validator = internationalPhoneFaxValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for phone with spaces', () => {
      const control = new FormControl('+44 123 456 7890');
      const validator = internationalPhoneFaxValidator();
      expect(validator(control)).toEqual({ invalidCharacters: true });
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('+' + '1'.repeat(20));
      const validator = internationalPhoneFaxValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 15, actualLength: 21 } });
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      const validator = internationalPhoneFaxValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('postalCodeValidator', () => {
    describe('US (domestic) validation', () => {
      it('should pass for valid 5-digit US ZIP code', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('75001')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should fail for ZIP code with letters', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('7500A')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidUSZipCode: true });
      });

      it('should fail for ZIP code with less than 5 digits', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('7500')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidUSZipCode: true });
      });

      it('should fail for ZIP code with more than 5 digits', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('750011')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidUSZipCode: true });
      });

      it('should fail for ZIP code with special characters', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('75001-')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidUSZipCode: true });
      });
    });

    describe('International validation', () => {
      it('should pass for valid alphanumeric international postal code', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('M5H2N2')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with spaces', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('M5H 2N2')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with hyphens', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('SW1A-1AA')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with periods', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('1234.56')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with slashes', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('12/345')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with commas', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('12,345')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with hashtags', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('ABC#123')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with plus signs', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('ABC+123')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with multiple special characters', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('12-3/4.5')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for Canadian postal code (K1A 0B1)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('K1A 0B1')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for UK postal code (SW1A 1AA)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('SW1A 1AA')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for Brazilian postal code (12345-678)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('12345-678')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should pass for international postal code with exactly 9 characters', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('ABC123+/#')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toBeNull();
      });

      it('should fail for international postal code with invalid special characters (@)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('M5H@2N2')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidInternationalPostalCode: true });
      });

      it('should fail for international postal code with invalid special characters (&)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('M5H&2N2')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidInternationalPostalCode: true });
      });

      it('should fail for international postal code with invalid special characters (*)', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('M5H*2N2')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ invalidInternationalPostalCode: true });
      });

      it('should fail for international postal code exceeding max length', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(true),
          zipCode: new FormControl('A'.repeat(10))
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ maxLength: { requiredLength: 9, actualLength: 10 } });
      });
    });

    describe('Required validation', () => {
      it('should fail for empty postal code', () => {
        const formGroup = new FormGroup({
          isInternational: new FormControl(false),
          zipCode: new FormControl('')
        });
        const validator = postalCodeValidator();
        expect(validator(formGroup.get('zipCode')!)).toEqual({ required: true });
      });
    });
  });

  describe('cityValidator', () => {
    it('should pass for valid city name', () => {
      const control = new FormControl('Dallas');
      const validator = cityValidator();
      expect(validator(control)).toBeNull();
    });

    it('should pass for city with spaces', () => {
      const control = new FormControl('New York');
      const validator = cityValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for city with numbers', () => {
      const control = new FormControl('Dallas123');
      const validator = cityValidator();
      expect(validator(control)).toEqual({ alphabeticOnly: true });
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(76));
      const validator = cityValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 75, actualLength: 76 } });
    });
  });

  describe('addressCompletenessValidator', () => {
    it('should pass when no address fields are filled', () => {
      const formGroup = new FormGroup({
        addr_1: new FormControl(''),
        city: new FormControl(''),
        zipCode: new FormControl(''),
        country: new FormControl(''),
        state: new FormControl(''),
        isInternational: new FormControl(false)
      });
      const validator = addressCompletenessValidator();
      expect(validator(formGroup)).toBeNull();
    });

    it('should pass when all required fields are filled (domestic)', () => {
      const formGroup = new FormGroup({
        addr_1: new FormControl('123 Main St'),
        city: new FormControl('Dallas'),
        zipCode: new FormControl('75001'),
        country: new FormControl('USA'),
        state: new FormControl('TX'),
        isInternational: new FormControl(false)
      });
      const validator = addressCompletenessValidator();
      expect(validator(formGroup)).toBeNull();
    });

    it('should fail when addr_1 is missing', () => {
      const formGroup = new FormGroup({
        addr_1: new FormControl(''),
        city: new FormControl('Dallas'),
        zipCode: new FormControl('75001'),
        country: new FormControl('USA'),
        state: new FormControl('TX'),
        isInternational: new FormControl(false)
      });
      const validator = addressCompletenessValidator();
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['incompleteAddress']).toBeDefined();
      expect(result?.['incompleteAddress'].missingFields).toContain('Address Line 1');
    });

    it('should fail when state is missing for domestic address', () => {
      const formGroup = new FormGroup({
        addr_1: new FormControl('123 Main St'),
        city: new FormControl('Dallas'),
        zipCode: new FormControl('75001'),
        country: new FormControl('USA'),
        state: new FormControl(''),
        isInternational: new FormControl(false)
      });
      const validator = addressCompletenessValidator();
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['incompleteAddress'].missingFields).toContain('State');
    });

    it('should pass when state is missing for international address', () => {
      const formGroup = new FormGroup({
        addr_1: new FormControl('123 Main St'),
        city: new FormControl('London'),
        zipCode: new FormControl('SW1A1AA'),
        country: new FormControl('UK'),
        state: new FormControl(''),
        isInternational: new FormControl(true)
      });
      const validator = addressCompletenessValidator();
      expect(validator(formGroup)).toBeNull();
    });
  });

  describe('stateValidator', () => {
    it('should pass for valid state code', () => {
      const control = new FormControl('TX');
      const validator = stateValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const formGroup = new FormGroup({
        isInternational: new FormControl(false),
        state: new FormControl('TXA')
      });
      const validator = stateValidator();
      expect(validator(formGroup.get('state')!)).toEqual({ invalidLength: true });
    });

    it('should allow empty for optional validation', () => {
      const control = new FormControl('');
      const validator = stateValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('countryValidator', () => {
    it('should pass for valid country', () => {
      const control = new FormControl('USA');
      const validator = countryValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for country with numbers', () => {
      const control = new FormControl('USA123');
      const validator = countryValidator();
      expect(validator(control)).toEqual({ alphabeticOnly: true });
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(16));
      const validator = countryValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 15, actualLength: 16 } });
    });
  });

  describe('addressLineValidator', () => {
    it('should pass for valid address line', () => {
      const control = new FormControl('123 Main Street');
      const validator = addressLineValidator(true);
      expect(validator(control)).toBeNull();
    });

    it('should fail when required and empty', () => {
      const control = new FormControl('');
      const validator = addressLineValidator(true);
      expect(validator(control)).toEqual({ required: true });
    });

    it('should pass when not required and empty', () => {
      const control = new FormControl('');
      const validator = addressLineValidator(false);
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(51));
      const validator = addressLineValidator(true);
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 50, actualLength: 51 } });
    });
  });

  describe('registrationNumberValidator', () => {
    it('should pass for valid registration number', () => {
      const control = new FormControl('REG123');
      const validator = registrationNumberValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(31));
      const validator = registrationNumberValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 30, actualLength: 31 } });
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      const validator = registrationNumberValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('licenseNumberValidator', () => {
    it('should pass for valid license number', () => {
      const control = new FormControl('LIC456');
      const validator = licenseNumberValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(31));
      const validator = licenseNumberValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 30, actualLength: 31 } });
    });

    it('should allow empty value', () => {
      const control = new FormControl('');
      const validator = licenseNumberValidator();
      expect(validator(control)).toBeNull();
    });
  });

  describe('shortNameValidator', () => {
    it('should pass for valid short name', () => {
      const control = new FormControl('DBC');
      const validator = shortNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(51));
      const validator = shortNameValidator();
      expect(validator(control)).toEqual({ maxLength: { requiredLength: 50, actualLength: 51 } });
    });

    it('should not allow empty value', () => {
      const control = new FormControl('');
      const validator = shortNameValidator();
      expect(validator(control)).toEqual({ required: true });
    });
  });

  describe('printHeaderValidator', () => {
    it('should pass for valid print header', () => {
      const control = new FormControl('Dallas Blood Center');
      const validator = printHeaderValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(51));
      const validator = printHeaderValidator();
      expect(validator(control)).toEqual({ maxLength: { requiredLength: 50, actualLength: 51 } });
    });

    it('should not allow empty value', () => {
      const control = new FormControl('');
      const validator = printHeaderValidator();
      expect(validator(control)).toEqual({ required: true });
    });
  });

  describe('systemNameValidator', () => {
    it('should pass for valid system name', () => {
      const control = new FormControl('Blood Centers');
      const validator = systemNameValidator();
      expect(validator(control)).toBeNull();
    });

    it('should fail for exceeding max length', () => {
      const control = new FormControl('A'.repeat(51));
      const validator = systemNameValidator();
      expect(validator(control)).toEqual({ maxlength: { requiredLength: 50, actualLength: 51 } });
    });

    it('should not allow empty value', () => {
      const control = new FormControl('');
      const validator = systemNameValidator();
      expect(validator(control)).toEqual({ required: true });
    });
  });
});
