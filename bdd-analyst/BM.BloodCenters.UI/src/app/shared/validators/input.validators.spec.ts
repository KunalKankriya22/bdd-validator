import { FormControl } from '@angular/forms';
import {
  noWhitespaceOnlyValidator,
  requiredTrimmedValidator,
  trimmedMaxLengthValidator,
  trimmedMinLengthValidator,
  noLeadingTrailingWhitespaceValidator,
  numericFieldValidator,
  positiveIntegerValidator,
  codeFieldValidator,
  alphanumericCodeValidator,
  alphanumericWithHyphenValidator,
  notationCodeValidator,
  numericCodeValidator,
  numericalValueValidator,
  integerValidator,
  urlValidator,
  strictEmailValidator,
  trimControlValue,
  createTrimOnBlur,
  getInputValidationError,
} from './input.validators';

describe('Input Validators', () => {
  // ===========================================================================
  // noWhitespaceOnlyValidator
  // ===========================================================================
  describe('noWhitespaceOnlyValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid string', () => {
      const control = new FormControl('hello', noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for string with inner whitespace', () => {
      const control = new FormControl('hello world', noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for single space', () => {
      const control = new FormControl(' ', noWhitespaceOnlyValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly error for multiple spaces', () => {
      const control = new FormControl('     ', noWhitespaceOnlyValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly error for tabs', () => {
      const control = new FormControl('\t\t', noWhitespaceOnlyValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly error for newlines', () => {
      const control = new FormControl('\n\n', noWhitespaceOnlyValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly error for mixed whitespace', () => {
      const control = new FormControl(' \t\n ', noWhitespaceOnlyValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });
  });

  // ===========================================================================
  // requiredTrimmedValidator
  // ===========================================================================
  describe('requiredTrimmedValidator', () => {
    it('should return required error for null value', () => {
      const control = new FormControl(null, requiredTrimmedValidator());
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for undefined value', () => {
      const control = new FormControl(undefined, requiredTrimmedValidator());
      expect(control.hasError('required')).toBe(true);
    });

    it('should return required error for empty string', () => {
      const control = new FormControl('', requiredTrimmedValidator());
      expect(control.hasError('required')).toBe(true);
    });

    it('should return whitespaceOnly error for spaces', () => {
      const control = new FormControl('   ', requiredTrimmedValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly error for tabs', () => {
      const control = new FormControl('\t', requiredTrimmedValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return null for valid string', () => {
      const control = new FormControl('hello', requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for string with leading/trailing spaces but content', () => {
      const control = new FormControl('  hello  ', requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // trimmedMaxLengthValidator
  // ===========================================================================
  describe('trimmedMaxLengthValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null for non-string value', () => {
      const control = new FormControl(123 as any, trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null when trimmed length equals maxLength', () => {
      const control = new FormControl('hello', trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null when trimmed length is under maxLength', () => {
      const control = new FormControl('hi', trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null when padding spaces bring raw length over but trimmed is under', () => {
      const control = new FormControl('  hi  ', trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return trimmedMaxLength error when trimmed length exceeds maxLength', () => {
      const control = new FormControl('hello world', trimmedMaxLengthValidator(5));
      expect(control.hasError('trimmedMaxLength')).toBe(true);
    });

    it('should include maxLength in error details', () => {
      const control = new FormControl('hello world', trimmedMaxLengthValidator(5));
      expect(control.getError('trimmedMaxLength')?.maxLength).toBe(5);
    });

    it('should include actualLength in error details', () => {
      const control = new FormControl('hello world', trimmedMaxLengthValidator(5));
      expect(control.getError('trimmedMaxLength')?.actualLength).toBe(11);
    });
  });

  // ===========================================================================
  // trimmedMinLengthValidator
  // ===========================================================================
  describe('trimmedMinLengthValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null for non-string value', () => {
      const control = new FormControl(12 as any, trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null for whitespace-only string (trimmed length is 0)', () => {
      const control = new FormControl('   ', trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null when trimmed length equals minLength', () => {
      const control = new FormControl('abc', trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null when trimmed length exceeds minLength', () => {
      const control = new FormControl('abcdef', trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return trimmedMinLength error when trimmed length is below minLength', () => {
      const control = new FormControl('ab', trimmedMinLengthValidator(3));
      expect(control.hasError('trimmedMinLength')).toBe(true);
    });

    it('should include minLength in error details', () => {
      const control = new FormControl('ab', trimmedMinLengthValidator(3));
      expect(control.getError('trimmedMinLength')?.minLength).toBe(3);
    });

    it('should include actualLength in error details', () => {
      const control = new FormControl('ab', trimmedMinLengthValidator(3));
      expect(control.getError('trimmedMinLength')?.actualLength).toBe(2);
    });

    it('should use trimmed length for comparison', () => {
      const control = new FormControl('  a  ', trimmedMinLengthValidator(3));
      expect(control.hasError('trimmedMinLength')).toBe(true);
    });
  });

  // ===========================================================================
  // noLeadingTrailingWhitespaceValidator
  // ===========================================================================
  describe('noLeadingTrailingWhitespaceValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid string without extra spaces', () => {
      const control = new FormControl('hello world', noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for single word', () => {
      const control = new FormControl('hello', noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return leadingTrailingWhitespace error for leading space', () => {
      const control = new FormControl(' hello', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('leadingTrailingWhitespace')).toBe(true);
    });

    it('should return leadingTrailingWhitespace error for trailing space', () => {
      const control = new FormControl('hello ', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('leadingTrailingWhitespace')).toBe(true);
    });

    it('should return leadingTrailingWhitespace error for both leading and trailing spaces', () => {
      const control = new FormControl(' hello ', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('leadingTrailingWhitespace')).toBe(true);
    });

    it('should return multipleSpaces error for consecutive spaces between words', () => {
      const control = new FormControl('hello  world', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('multipleSpaces')).toBe(true);
    });

    it('should return multipleSpaces error for tabs between words', () => {
      const control = new FormControl('hello\t\tworld', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('multipleSpaces')).toBe(true);
    });
  });

  // ===========================================================================
  // numericFieldValidator
  // ===========================================================================
  describe('numericFieldValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for integer string', () => {
      const control = new FormControl('123', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for decimal string', () => {
      const control = new FormControl('12.34', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for negative number', () => {
      const control = new FormControl('-5', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for negative decimal', () => {
      const control = new FormControl('-3.14', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only string', () => {
      const control = new FormControl('   ', numericFieldValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return notNumeric error for alphabetic string', () => {
      const control = new FormControl('abc', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should return notNumeric error for mixed alpha-numeric', () => {
      const control = new FormControl('12abc', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should return notNumeric error for multiple dots', () => {
      const control = new FormControl('12.34.56', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should return notNumeric error for scientific notation', () => {
      const control = new FormControl('1e5', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });
  });

  // ===========================================================================
  // positiveIntegerValidator
  // ===========================================================================
  describe('positiveIntegerValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid integer within default range', () => {
      const control = new FormControl('5', positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for zero with default min', () => {
      const control = new FormControl('0', positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for integer within specified range', () => {
      const control = new FormControl('50', positiveIntegerValidator(1, 100));
      expect(control.errors).toBeNull();
    });

    it('should return null for value equal to min', () => {
      const control = new FormControl('10', positiveIntegerValidator(10, 100));
      expect(control.errors).toBeNull();
    });

    it('should return null for value equal to max', () => {
      const control = new FormControl('100', positiveIntegerValidator(10, 100));
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace string', () => {
      const control = new FormControl('   ', positiveIntegerValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return notInteger error for decimal value', () => {
      const control = new FormControl('3.5', positiveIntegerValidator());
      expect(control.hasError('notInteger')).toBe(true);
    });

    it('should return notInteger error for negative value', () => {
      const control = new FormControl('-5', positiveIntegerValidator());
      expect(control.hasError('notInteger')).toBe(true);
    });

    it('should return notInteger error for alphabetic string', () => {
      const control = new FormControl('abc', positiveIntegerValidator());
      expect(control.hasError('notInteger')).toBe(true);
    });

    it('should return outOfRange error when value is below min', () => {
      const control = new FormControl('5', positiveIntegerValidator(10, 100));
      expect(control.hasError('outOfRange')).toBe(true);
    });

    it('should return outOfRange error when value is above max', () => {
      const control = new FormControl('200', positiveIntegerValidator(10, 100));
      expect(control.hasError('outOfRange')).toBe(true);
    });

    it('should include min in outOfRange error', () => {
      const control = new FormControl('5', positiveIntegerValidator(10, 100));
      expect(control.getError('outOfRange')?.min).toBe(10);
    });

    it('should include max in outOfRange error', () => {
      const control = new FormControl('5', positiveIntegerValidator(10, 100));
      expect(control.getError('outOfRange')?.max).toBe(100);
    });

    it('should include actual value in outOfRange error', () => {
      const control = new FormControl('5', positiveIntegerValidator(10, 100));
      expect(control.getError('outOfRange')?.actual).toBe(5);
    });
  });

  // ===========================================================================
  // codeFieldValidator
  // ===========================================================================
  describe('codeFieldValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric string', () => {
      const control = new FormControl('ABC123', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric with symbols', () => {
      const control = new FormControl('ABC-123', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric with special characters', () => {
      const control = new FormControl('A@123', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for letters only', () => {
      const control = new FormControl('ABC', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for digits only', () => {
      const control = new FormControl('123', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric with spaces', () => {
      const control = new FormControl('ABC 123', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only value', () => {
      const control = new FormControl('   ', codeFieldValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return noAlphanumeric error for special characters only', () => {
      const control = new FormControl('!@#$%', codeFieldValidator());
      expect(control.hasError('noAlphanumeric')).toBe(true);
    });

    it('should return noAlphanumeric error for hyphens and spaces only', () => {
      const control = new FormControl('- - -', codeFieldValidator());
      expect(control.hasError('noAlphanumeric')).toBe(true);
    });

    it('should return noAlphanumeric error for underscores only', () => {
      const control = new FormControl('___', codeFieldValidator());
      expect(control.hasError('noAlphanumeric')).toBe(true);
    });
  });

  // ===========================================================================
  // alphanumericCodeValidator
  // ===========================================================================
  describe('alphanumericCodeValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for letters only', () => {
      const control = new FormControl('ABC', alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for digits only', () => {
      const control = new FormControl('123', alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for mixed alphanumeric', () => {
      const control = new FormControl('ABC123', alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric with spaces', () => {
      const control = new FormControl('ABC 123', alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only value', () => {
      const control = new FormControl('   ', alphanumericCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for hyphenated code', () => {
      const control = new FormControl('ABC-123', alphanumericCodeValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for code with special characters', () => {
      const control = new FormControl('A@123', alphanumericCodeValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for underscores', () => {
      const control = new FormControl('ABC_123', alphanumericCodeValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });
  });

  // ===========================================================================
  // alphanumericWithHyphenValidator
  // ===========================================================================
  describe('alphanumericWithHyphenValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric string', () => {
      const control = new FormControl('ABC123', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for hyphenated code', () => {
      const control = new FormControl('ABC-123', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric with spaces', () => {
      const control = new FormControl('ABC 123', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for hyphen and space combined', () => {
      const control = new FormControl('ABC-XYZ 123', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only value', () => {
      const control = new FormControl('   ', alphanumericWithHyphenValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for @ symbol', () => {
      const control = new FormControl('ABC@123', alphanumericWithHyphenValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for # symbol', () => {
      const control = new FormControl('A#123', alphanumericWithHyphenValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });

    it('should return alphanumericOnly error for underscore', () => {
      const control = new FormControl('ABC_123', alphanumericWithHyphenValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });
  });

  // ===========================================================================
  // notationCodeValidator
  // ===========================================================================
  describe('notationCodeValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for alphanumeric string', () => {
      const control = new FormControl('TEST01', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for string with underscores', () => {
      const control = new FormControl('TEST_CODE', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for mixed alphanumeric with underscores', () => {
      const control = new FormControl('ABC_123', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only value', () => {
      const control = new FormControl('   ', notationCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return invalidNotationCode error for hyphens', () => {
      const control = new FormControl('TEST-01', notationCodeValidator());
      expect(control.hasError('invalidNotationCode')).toBe(true);
    });

    it('should return invalidNotationCode error for spaces', () => {
      const control = new FormControl('TEST CODE', notationCodeValidator());
      expect(control.hasError('invalidNotationCode')).toBe(true);
    });

    it('should return invalidNotationCode error for special characters', () => {
      const control = new FormControl('TEST@123', notationCodeValidator());
      expect(control.hasError('invalidNotationCode')).toBe(true);
    });
  });

  // ===========================================================================
  // numericCodeValidator
  // ===========================================================================
  describe('numericCodeValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for digits-only string', () => {
      const control = new FormControl('12345', numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null when digit count meets minDigits', () => {
      const control = new FormControl('123', numericCodeValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null when digit count is within min and max', () => {
      const control = new FormControl('123', numericCodeValidator(2, 4));
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly error for whitespace-only string', () => {
      const control = new FormControl('   ', numericCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return numericOnly error for letters', () => {
      const control = new FormControl('abc', numericCodeValidator());
      expect(control.hasError('numericOnly')).toBe(true);
    });

    it('should return numericOnly error for mixed alpha-numeric', () => {
      const control = new FormControl('12a', numericCodeValidator());
      expect(control.hasError('numericOnly')).toBe(true);
    });

    it('should return minDigits error when too few digits', () => {
      const control = new FormControl('12', numericCodeValidator(3));
      expect(control.hasError('minDigits')).toBe(true);
    });

    it('should include required count in minDigits error', () => {
      const control = new FormControl('12', numericCodeValidator(3));
      expect(control.getError('minDigits')?.required).toBe(3);
    });

    it('should include actual count in minDigits error', () => {
      const control = new FormControl('12', numericCodeValidator(3));
      expect(control.getError('minDigits')?.actual).toBe(2);
    });

    it('should return maxDigits error when too many digits', () => {
      const control = new FormControl('12345', numericCodeValidator(1, 4));
      expect(control.hasError('maxDigits')).toBe(true);
    });

    it('should include required count in maxDigits error', () => {
      const control = new FormControl('12345', numericCodeValidator(1, 4));
      expect(control.getError('maxDigits')?.required).toBe(4);
    });

    it('should include actual count in maxDigits error', () => {
      const control = new FormControl('12345', numericCodeValidator(1, 4));
      expect(control.getError('maxDigits')?.actual).toBe(5);
    });
  });

  // ===========================================================================
  // numericalValueValidator
  // ===========================================================================
  describe('numericalValueValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for just a minus sign', () => {
      const control = new FormControl('-', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid integer within range', () => {
      const control = new FormControl('1234567', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid decimal within range', () => {
      const control = new FormControl('1234567.123', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for negative value within range', () => {
      const control = new FormControl('-9999999.999', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for single digit', () => {
      const control = new FormControl('5', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for single decimal place', () => {
      const control = new FormControl('1.5', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should return numericalValue error for too many integer digits', () => {
      const control = new FormControl('12345678', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should return numericalValue error for too many decimal digits', () => {
      const control = new FormControl('1.1234', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should return numericalValue error for letters', () => {
      const control = new FormControl('abc', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should return numericalValue error for multiple dots', () => {
      const control = new FormControl('1.2.3', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });
  });

  // ===========================================================================
  // integerValidator
  // ===========================================================================
  describe('integerValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for just a minus sign', () => {
      const control = new FormControl('-', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for positive integer', () => {
      const control = new FormControl('123', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for negative integer', () => {
      const control = new FormControl('-456', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for zero', () => {
      const control = new FormControl('0', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return integer error for decimal value', () => {
      const control = new FormControl('12.3', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should return integer error for letters', () => {
      const control = new FormControl('abc', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should return integer error for mixed content', () => {
      const control = new FormControl('12abc', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should return integer error for scientific notation', () => {
      const control = new FormControl('1e5', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });
  });

  // ===========================================================================
  // urlValidator
  // ===========================================================================
  describe('urlValidator', () => {
    describe('with null/empty values', () => {
      it('should return null for null value', () => {
        const control = new FormControl(null, urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for empty string', () => {
        const control = new FormControl('', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        const control = new FormControl('   ', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with valid absolute URLs', () => {
      it('should accept https URL', () => {
        const control = new FormControl('https://example.com', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept http URL', () => {
        const control = new FormControl('http://example.com', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with path', () => {
        const control = new FormControl('http://example.com/path/to/page', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with www prefix', () => {
        const control = new FormControl('www.example.com', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with subdomain', () => {
        const control = new FormControl('https://sub.example.com', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with relative URLs', () => {
      it('should accept simple relative path', () => {
        const control = new FormControl('/relative/path', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept root path', () => {
        const control = new FormControl('/dashboard', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept relative path with query string', () => {
        const control = new FormControl('/search?q=test', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with IP addresses', () => {
      it('should accept valid IPv4 address', () => {
        const control = new FormControl('192.168.1.1', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept IP address with protocol', () => {
        const control = new FormControl('http://192.168.1.1', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept IP address with port', () => {
        const control = new FormControl('192.168.1.1:8080', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should reject IP address with octet above 255', () => {
        const control = new FormControl('192.168.1.256', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });
    });

    describe('with ports', () => {
      it('should accept URL with valid port', () => {
        const control = new FormControl('example.com:8080', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with port 443', () => {
        const control = new FormControl('https://example.com:443', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with query strings and hash fragments', () => {
      it('should accept URL with query string', () => {
        const control = new FormControl('https://example.com?q=test', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with hash fragment', () => {
        const control = new FormControl('https://example.com#section', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with both query and hash', () => {
        const control = new FormControl('https://example.com?q=test#section', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with user authentication', () => {
      it('should accept URL with user info', () => {
        const control = new FormControl('user:pass@example.com', urlValidator());
        expect(control.errors).toBeNull();
      });

      it('should accept URL with user info and protocol', () => {
        const control = new FormControl('https://user:pass@example.com', urlValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('with invalid URLs', () => {
      it('should reject consecutive dots', () => {
        const control = new FormControl('example..com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject multiple @ symbols', () => {
        const control = new FormControl('user@@example.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject localhost', () => {
        const control = new FormControl('http://localhost', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject bad protocol', () => {
        const control = new FormControl('htp://example.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject ftp protocol', () => {
        const control = new FormControl('ftp://example.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject domain without TLD', () => {
        const control = new FormControl('www.example', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject domain with spaces', () => {
        const control = new FormControl('www.exam ple.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject plain text', () => {
        const control = new FormControl('just some text', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject protocol only', () => {
        const control = new FormControl('https://', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject malformed protocol', () => {
        const control = new FormControl('http:/example.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject relative path without leading slash', () => {
        const control = new FormControl('path/to/page', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject domain with invalid characters', () => {
        const control = new FormControl('http://exam%ple.com', urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject number-only input', () => {
        const control = new FormControl(12345 as any, urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });

      it('should reject boolean input', () => {
        const control = new FormControl(true as any, urlValidator());
        expect(control.hasError('invalidUrl')).toBe(true);
      });
    });
  });

  // ===========================================================================
  // strictEmailValidator
  // ===========================================================================
  describe('strictEmailValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for empty string', () => {
      const control = new FormControl('', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      const control = new FormControl('   ', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for valid simple email', () => {
      const control = new FormControl('user@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for email with dots in username', () => {
      const control = new FormControl('first.last@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for email with subdomain', () => {
      const control = new FormControl('user@mail.example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for email with hyphens in username', () => {
      const control = new FormControl('first-last@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should return invalidEmail error for missing @', () => {
      const control = new FormControl('nodomain', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for missing domain', () => {
      const control = new FormControl('user@', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for missing username', () => {
      const control = new FormControl('@domain.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for missing TLD', () => {
      const control = new FormControl('ks@m', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for domain without TLD', () => {
      const control = new FormControl('user@domain', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for single-char TLD', () => {
      const control = new FormControl('user@domain.c', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should return invalidEmail error for multiple @ symbols', () => {
      const control = new FormControl('user@@domain.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });
  });

  // ===========================================================================
  // trimControlValue
  // ===========================================================================
  describe('trimControlValue', () => {
    it('should trim leading and trailing whitespace from control value', () => {
      const control = new FormControl('  hello  ');
      trimControlValue(control);
      expect(control.value).toBe('hello');
    });

    it('should not change already trimmed value', () => {
      const control = new FormControl('hello');
      trimControlValue(control);
      expect(control.value).toBe('hello');
    });

    it('should not change null value', () => {
      const control = new FormControl(null);
      trimControlValue(control);
      expect(control.value).toBeNull();
    });

    it('should not change non-string value', () => {
      const control = new FormControl(123);
      trimControlValue(control);
      expect(control.value).toBe(123);
    });

    it('should trim leading whitespace', () => {
      const control = new FormControl('  hello');
      trimControlValue(control);
      expect(control.value).toBe('hello');
    });

    it('should trim trailing whitespace', () => {
      const control = new FormControl('hello  ');
      trimControlValue(control);
      expect(control.value).toBe('hello');
    });

    it('should reduce whitespace-only string to empty string', () => {
      const control = new FormControl('   ');
      trimControlValue(control);
      expect(control.value).toBe('');
    });
  });

  // ===========================================================================
  // createTrimOnBlur
  // ===========================================================================
  describe('createTrimOnBlur', () => {
    it('should return a function', () => {
      const control = new FormControl('test');
      const blurFn = createTrimOnBlur(control);
      expect(typeof blurFn).toBe('function');
    });

    it('should trim the control value when the returned function is called', () => {
      const control = new FormControl('  hello  ');
      const blurFn = createTrimOnBlur(control);
      blurFn();
      expect(control.value).toBe('hello');
    });

    it('should not change already trimmed value when called', () => {
      const control = new FormControl('hello');
      const blurFn = createTrimOnBlur(control);
      blurFn();
      expect(control.value).toBe('hello');
    });
  });

  // ===========================================================================
  // getInputValidationError
  // ===========================================================================
  describe('getInputValidationError', () => {
    it('should return empty string for null control', () => {
      expect(getInputValidationError(null, 'Field')).toBe('');
    });

    it('should return empty string for untouched control', () => {
      const control = new FormControl('', requiredTrimmedValidator());
      expect(getInputValidationError(control, 'Field')).toBe('');
    });

    it('should return empty string for valid touched control', () => {
      const control = new FormControl('valid');
      control.markAsTouched();
      expect(getInputValidationError(control, 'Field')).toBe('');
    });

    it('should return required error message', () => {
      const control = new FormControl('');
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Name')).toBe('Name is required');
    });

    it('should return whitespaceOnly error message', () => {
      const control = new FormControl('');
      control.setErrors({ whitespaceOnly: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Name')).toBe('Name cannot contain only spaces');
    });

    it('should return invalidEmail error message', () => {
      const control = new FormControl('');
      control.setErrors({ invalidEmail: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toContain('Please enter a valid email address');
    });

    it('should return invalidUrl error message', () => {
      const control = new FormControl('');
      control.setErrors({ invalidUrl: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Please enter a valid URL (e.g., https://example.com or /path)');
    });

    it('should return leadingTrailingWhitespace error message', () => {
      const control = new FormControl('');
      control.setErrors({ leadingTrailingWhitespace: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Title')).toBe('Title must not have leading or trailing spaces');
    });

    it('should return multipleSpaces error message', () => {
      const control = new FormControl('');
      control.setErrors({ multipleSpaces: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Title')).toBe('Title must not have multiple consecutive spaces');
    });

    it('should return noAlphanumeric error message', () => {
      const control = new FormControl('');
      control.setErrors({ noAlphanumeric: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Only alphanumeric characters allowed');
    });

    it('should return alphanumericOnly error message', () => {
      const control = new FormControl('');
      control.setErrors({ alphanumericOnly: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Only alphanumeric characters allowed');
    });

    it('should return notNumeric error message', () => {
      const control = new FormControl('');
      control.setErrors({ notNumeric: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Only numbers are allowed');
    });

    it('should return notInteger error message', () => {
      const control = new FormControl('');
      control.setErrors({ notInteger: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Sequence')).toBe('Sequence must be a whole number');
    });

    it('should return numericOnly error message', () => {
      const control = new FormControl('');
      control.setErrors({ numericOnly: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Only numbers are allowed');
    });

    it('should return trimmedMaxLength error message with maxLength', () => {
      const control = new FormControl('');
      control.setErrors({ trimmedMaxLength: { maxLength: 50, actualLength: 60 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Description')).toBe('Description cannot exceed 50 characters');
    });

    it('should return trimmedMinLength error message with minLength', () => {
      const control = new FormControl('');
      control.setErrors({ trimmedMinLength: { minLength: 3, actualLength: 1 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Code')).toBe('Code must be at least 3 characters');
    });

    it('should return outOfRange error message with min and max', () => {
      const control = new FormControl('');
      control.setErrors({ outOfRange: { min: 1, max: 100, actual: 200 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Value')).toBe('Value must be between 1 and 100');
    });

    it('should return minDigits error message', () => {
      const control = new FormControl('');
      control.setErrors({ minDigits: { required: 3, actual: 2 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Code')).toBe('Code must have at least 3 digits');
    });

    it('should return maxDigits error message', () => {
      const control = new FormControl('');
      control.setErrors({ maxDigits: { required: 4, actual: 5 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Code')).toBe('Code cannot have more than 4 digits');
    });

    it('should use default fieldName when not provided', () => {
      const control = new FormControl('');
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Field is required');
    });
  });

  // ===========================================================================
  // Additional URL validator edge cases for branch coverage
  // ===========================================================================
  describe('urlValidator - additional branch coverage', () => {
    it('should reject domain part starting with hyphen', () => {
      const control = new FormControl('-example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain part ending with hyphen', () => {
      const control = new FormControl('example-.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain part with only numbers > 3 digits', () => {
      const control = new FormControl('1234.example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject port number above 65535', () => {
      const control = new FormControl('example.com:99999', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject port number 0', () => {
      const control = new FormControl('example.com:0', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject invalid user info characters', () => {
      const control = new FormControl('user name@example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with only hash fragment (no query)', () => {
      const control = new FormControl('https://example.com#section', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject invalid relative URL', () => {
      const control = new FormControl('/path with{invalid}chars', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with port 1', () => {
      const control = new FormControl('example.com:1', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with port 65535', () => {
      const control = new FormControl('example.com:65535', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject TLD longer than 6 characters', () => {
      const control = new FormControl('example.toolong', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject TLD with numbers', () => {
      const control = new FormControl('example.c0m', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with valid 2-char TLD', () => {
      const control = new FormControl('example.uk', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with valid 6-char TLD', () => {
      const control = new FormControl('example.museum', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept valid IP with protocol and port', () => {
      const control = new FormControl('http://192.168.1.1:8080', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject IP with negative octet', () => {
      const control = new FormControl('192.168.-1.1', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject empty domain part from leading dot', () => {
      const control = new FormControl('.example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with parentheses', () => {
      const control = new FormControl('exam(ple).com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with brackets', () => {
      const control = new FormControl('exam[ple].com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with path and query', () => {
      const control = new FormControl('https://example.com/path?q=1', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with path, query, and hash', () => {
      const control = new FormControl('https://example.com/path?q=1#top', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with 3-digit numeric subdomain', () => {
      const control = new FormControl('123.example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject single-segment domain', () => {
      const control = new FormControl('justadomain', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should handle URL with only path after domain', () => {
      const control = new FormControl('example.com/path', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject non-numeric port', () => {
      const control = new FormControl('example.com:abc', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with user info without password', () => {
      const control = new FormControl('user@example.com', urlValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Additional edge cases for other validators
  // ===========================================================================
  describe('positiveIntegerValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('numericCodeValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should handle numeric value input', () => {
      const control = new FormControl(42 as any, numericCodeValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('codeFieldValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, codeFieldValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('alphanumericCodeValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('alphanumericWithHyphenValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('notationCodeValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, notationCodeValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('numericalValueValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should handle whitespace-only after trim', () => {
      const control = new FormControl('   ', numericalValueValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('integerValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should handle whitespace-only after trim', () => {
      const control = new FormControl('   ', integerValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('strictEmailValidator - additional edge cases', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject email with special chars in username', () => {
      const control = new FormControl('us er@domain.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });
  });

  describe('noLeadingTrailingWhitespaceValidator - non-string value', () => {
    it('should return null for numeric value', () => {
      const control = new FormControl(123 as any, noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });
  });

  describe('numericFieldValidator - additional edge cases', () => {
    it('should handle numeric input directly', () => {
      const control = new FormControl(42, numericFieldValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - noWhitespaceOnlyValidator
  // ===========================================================================
  describe('noWhitespaceOnlyValidator - non-string branch coverage', () => {
    it('should return null for number value (non-string type branch)', () => {
      const control = new FormControl(42 as any, noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for boolean value (non-string type branch)', () => {
      const control = new FormControl(true as any, noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for object value (non-string type branch)', () => {
      const control = new FormControl({} as any, noWhitespaceOnlyValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - requiredTrimmedValidator
  // ===========================================================================
  describe('requiredTrimmedValidator - non-string branch coverage', () => {
    it('should return null for number value (non-string type branch)', () => {
      const control = new FormControl(42 as any, requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for boolean value (non-string type branch)', () => {
      const control = new FormControl(true as any, requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for object value (non-string type branch)', () => {
      const control = new FormControl({} as any, requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for zero (falsy but not null/undefined/empty)', () => {
      const control = new FormControl(0 as any, requiredTrimmedValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - urlValidator
  // ===========================================================================
  describe('urlValidator - comprehensive branch coverage', () => {
    it('should return null for undefined value', () => {
      const control = new FormControl(undefined, urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for tab-only value (whitespace after trim)', () => {
      const control = new FormControl('\t', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with hash fragment before query string (Math.min branch)', () => {
      const control = new FormControl('https://example.com#section?q=test', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject URL with invalid characters in query string', () => {
      const control = new FormControl('example.com?q=<test>', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject URL with invalid characters in hash fragment', () => {
      const control = new FormControl('example.com#<invalid>', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject absolute URL with invalid path characters', () => {
      const control = new FormControl('example.com/path<invalid>', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with trailing colon (empty port - falsy portPart branch)', () => {
      const control = new FormControl('example.com:', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject domain with pipe character', () => {
      const control = new FormControl('exam|ple.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with backslash', () => {
      const control = new FormControl('exam\\ple.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with caret', () => {
      const control = new FormControl('exam^ple.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with angle brackets', () => {
      const control = new FormControl('exam<ple>.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject domain with curly braces', () => {
      const control = new FormControl('exam{ple}.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept IP address 0.0.0.0', () => {
      const control = new FormControl('0.0.0.0', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept IP address 255.255.255.255', () => {
      const control = new FormControl('255.255.255.255', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with only hash fragment (no query)', () => {
      const control = new FormControl('example.com#anchor', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with only query string (no hash)', () => {
      const control = new FormControl('example.com?key=value', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept root path slash', () => {
      const control = new FormControl('/', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with multiple path segments', () => {
      const control = new FormControl('example.com/a/b/c/d', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with port 1 and protocol', () => {
      const control = new FormControl('https://example.com:1', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject URL with negative port number', () => {
      const control = new FormControl('example.com:-1', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject single-word domain after protocol strip', () => {
      const control = new FormControl('https://example', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject localhost with port', () => {
      const control = new FormControl('localhost:3000', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject bare localhost without protocol', () => {
      const control = new FormControl('localhost', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept HTTPS URL with uppercase protocol', () => {
      const control = new FormControl('HTTPS://example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept HTTP URL with uppercase protocol', () => {
      const control = new FormControl('HTTP://example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with percent-encoded path', () => {
      const control = new FormControl('example.com/path%20name', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with 3-char TLD', () => {
      const control = new FormControl('example.net', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with 4-char TLD', () => {
      const control = new FormControl('example.info', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept domain with 5-char TLD', () => {
      const control = new FormControl('example.store', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject URL with consecutive dots in path', () => {
      const control = new FormControl('example.com/path..file', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject URL with backtick in domain', () => {
      const control = new FormControl('exam`ple.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with path query and hash combined', () => {
      const control = new FormControl('example.com/page?id=1#top', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with valid user info containing dots', () => {
      const control = new FormControl('user.name@example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with valid user info containing hyphens', () => {
      const control = new FormControl('user-name@example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with valid user info containing underscores', () => {
      const control = new FormControl('user_name@example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with user info containing colon (password)', () => {
      const control = new FormControl('user:password@example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject URL with invalid user info containing space', () => {
      const control = new FormControl('user name@example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject URL with invalid user info containing special chars', () => {
      const control = new FormControl('user!name@example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept relative URL with hash', () => {
      const control = new FormControl('/page#section', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept relative URL with encoded characters', () => {
      const control = new FormControl('/path%20to/resource', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept IP with path', () => {
      const control = new FormControl('192.168.1.1/admin', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept IP with port and path', () => {
      const control = new FormControl('192.168.1.1:8080/admin', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject IP with octet exactly 256', () => {
      const control = new FormControl('256.0.0.1', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept IP with octet exactly 0', () => {
      const control = new FormControl('10.0.0.1', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject domain part that is only hyphen', () => {
      const control = new FormControl('-.example.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept URL with deeply nested subdomains', () => {
      const control = new FormControl('a.b.c.example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject single numeric domain part with more than 3 digits', () => {
      const control = new FormControl('12345.com', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept single numeric domain part with exactly 3 digits', () => {
      const control = new FormControl('123.example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept single numeric domain part with exactly 1 digit', () => {
      const control = new FormControl('1.example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with mixed case domain', () => {
      const control = new FormControl('Example.Com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept URL with port 65535 and protocol', () => {
      const control = new FormControl('https://example.com:65535', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject URL with port 0 and protocol', () => {
      const control = new FormControl('https://example.com:0', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should reject URL with port 65536', () => {
      const control = new FormControl('example.com:65536', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });

    it('should accept domain with hyphen in middle of part', () => {
      const control = new FormControl('my-example.com', urlValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject domain with trailing dot (empty last part)', () => {
      const control = new FormControl('example.com.', urlValidator());
      expect(control.hasError('invalidUrl')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - numericFieldValidator
  // ===========================================================================
  describe('numericFieldValidator - comprehensive branch coverage', () => {
    it('should accept negative decimal number type', () => {
      const control = new FormControl(-3.14, numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept zero string', () => {
      const control = new FormControl('0', numericFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject value starting with dot', () => {
      const control = new FormControl('.5', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should reject value with trailing dot', () => {
      const control = new FormControl('5.', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should reject value with plus sign', () => {
      const control = new FormControl('+5', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should reject value with comma', () => {
      const control = new FormControl('1,000', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });

    it('should reject value with spaces between digits', () => {
      const control = new FormControl('1 000', numericFieldValidator());
      expect(control.hasError('notNumeric')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - positiveIntegerValidator
  // ===========================================================================
  describe('positiveIntegerValidator - comprehensive branch coverage', () => {
    it('should accept large valid integer within range', () => {
      const control = new FormControl('99999', positiveIntegerValidator(0, 100000));
      expect(control.errors).toBeNull();
    });

    it('should handle numeric input type (not string)', () => {
      const control = new FormControl(42 as any, positiveIntegerValidator());
      expect(control.errors).toBeNull();
    });

    it('should return notInteger for special characters', () => {
      const control = new FormControl('!@#', positiveIntegerValidator());
      expect(control.hasError('notInteger')).toBe(true);
    });

    it('should return notInteger for mixed digits and letters', () => {
      const control = new FormControl('12ab', positiveIntegerValidator());
      expect(control.hasError('notInteger')).toBe(true);
    });

    it('should return outOfRange with correct error details for below min', () => {
      const control = new FormControl('0', positiveIntegerValidator(1, 100));
      const error = control.getError('outOfRange');
      expect(error).toBeTruthy();
      expect(error.min).toBe(1);
      expect(error.max).toBe(100);
      expect(error.actual).toBe(0);
    });

    it('should return outOfRange with correct error details for above max', () => {
      const control = new FormControl('101', positiveIntegerValidator(1, 100));
      const error = control.getError('outOfRange');
      expect(error).toBeTruthy();
      expect(error.actual).toBe(101);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - codeFieldValidator
  // ===========================================================================
  describe('codeFieldValidator - comprehensive branch coverage', () => {
    it('should handle numeric value (converted to string via String())', () => {
      const control = new FormControl(42 as any, codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly for tab character', () => {
      const control = new FormControl('\t', codeFieldValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return whitespaceOnly for newline character', () => {
      const control = new FormControl('\n', codeFieldValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should accept single letter', () => {
      const control = new FormControl('A', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept single digit', () => {
      const control = new FormControl('1', codeFieldValidator());
      expect(control.errors).toBeNull();
    });

    it('should return noAlphanumeric for dots only', () => {
      const control = new FormControl('...', codeFieldValidator());
      expect(control.hasError('noAlphanumeric')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - alphanumericCodeValidator
  // ===========================================================================
  describe('alphanumericCodeValidator - comprehensive branch coverage', () => {
    it('should handle numeric value (converted to string)', () => {
      const control = new FormControl(99 as any, alphanumericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly for tab character', () => {
      const control = new FormControl('\t', alphanumericCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return alphanumericOnly for dots', () => {
      const control = new FormControl('abc.123', alphanumericCodeValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - alphanumericWithHyphenValidator
  // ===========================================================================
  describe('alphanumericWithHyphenValidator - comprehensive branch coverage', () => {
    it('should handle numeric value (converted to string)', () => {
      const control = new FormControl(123 as any, alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly for tab character', () => {
      const control = new FormControl('\t', alphanumericWithHyphenValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should return alphanumericOnly for dots', () => {
      const control = new FormControl('abc.123', alphanumericWithHyphenValidator());
      expect(control.hasError('alphanumericOnly')).toBe(true);
    });

    it('should accept multiple hyphens', () => {
      const control = new FormControl('A-B-C', alphanumericWithHyphenValidator());
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - notationCodeValidator
  // ===========================================================================
  describe('notationCodeValidator - comprehensive branch coverage', () => {
    it('should handle numeric value (converted to string)', () => {
      const control = new FormControl(42 as any, notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should return whitespaceOnly for tab character', () => {
      const control = new FormControl('\t', notationCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });

    it('should accept underscore only', () => {
      const control = new FormControl('_', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept multiple underscores', () => {
      const control = new FormControl('__TEST__', notationCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject dot character', () => {
      const control = new FormControl('TEST.CODE', notationCodeValidator());
      expect(control.hasError('invalidNotationCode')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - numericCodeValidator
  // ===========================================================================
  describe('numericCodeValidator - comprehensive branch coverage', () => {
    it('should reject negative numbers', () => {
      const control = new FormControl('-1', numericCodeValidator());
      expect(control.hasError('numericOnly')).toBe(true);
    });

    it('should reject decimal numbers', () => {
      const control = new FormControl('1.5', numericCodeValidator());
      expect(control.hasError('numericOnly')).toBe(true);
    });

    it('should accept when both minDigits and maxDigits are undefined', () => {
      const control = new FormControl('12345', numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept when digit count equals maxDigits', () => {
      const control = new FormControl('1234', numericCodeValidator(1, 4));
      expect(control.errors).toBeNull();
    });

    it('should accept when digit count equals minDigits', () => {
      const control = new FormControl('123', numericCodeValidator(3, 5));
      expect(control.errors).toBeNull();
    });

    it('should handle only maxDigits specified (no minDigits) - over max', () => {
      const control = new FormControl('12345', numericCodeValidator(undefined, 4));
      expect(control.hasError('maxDigits')).toBe(true);
    });

    it('should handle only maxDigits specified (no minDigits) - within max', () => {
      const control = new FormControl('123', numericCodeValidator(undefined, 4));
      expect(control.errors).toBeNull();
    });

    it('should handle only minDigits specified (no maxDigits) - under min', () => {
      const control = new FormControl('12', numericCodeValidator(3, undefined));
      expect(control.hasError('minDigits')).toBe(true);
    });

    it('should handle only minDigits specified (no maxDigits) - at min', () => {
      const control = new FormControl('123', numericCodeValidator(3, undefined));
      expect(control.errors).toBeNull();
    });

    it('should reject special characters', () => {
      const control = new FormControl('!@#', numericCodeValidator());
      expect(control.hasError('numericOnly')).toBe(true);
    });

    it('should accept single digit', () => {
      const control = new FormControl('0', numericCodeValidator());
      expect(control.errors).toBeNull();
    });

    it('should handle tab-only as whitespace', () => {
      const control = new FormControl('\t', numericCodeValidator());
      expect(control.hasError('whitespaceOnly')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - numericalValueValidator
  // ===========================================================================
  describe('numericalValueValidator - comprehensive branch coverage', () => {
    it('should handle numeric input type', () => {
      const control = new FormControl(42 as any, numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept zero', () => {
      const control = new FormControl('0', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept negative zero', () => {
      const control = new FormControl('-0', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept max valid positive value', () => {
      const control = new FormControl('9999999.999', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept max valid negative value', () => {
      const control = new FormControl('-9999999.999', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject value with only decimal point', () => {
      const control = new FormControl('.', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should accept value with leading zeros (7 digits)', () => {
      const control = new FormControl('0001234', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject special characters', () => {
      const control = new FormControl('$100', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should accept single decimal digit', () => {
      const control = new FormControl('1.1', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept two decimal digits', () => {
      const control = new FormControl('1.12', numericalValueValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject leading dot (no integer part)', () => {
      const control = new FormControl('.123', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should reject trailing dot (no decimal part)', () => {
      const control = new FormControl('123.', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });

    it('should reject spaces within number', () => {
      const control = new FormControl('1 234', numericalValueValidator());
      expect(control.hasError('numericalValue')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - integerValidator
  // ===========================================================================
  describe('integerValidator - comprehensive branch coverage', () => {
    it('should handle numeric input type', () => {
      const control = new FormControl(42 as any, integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept large negative number', () => {
      const control = new FormControl('-999999', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject double negative', () => {
      const control = new FormControl('--5', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should reject comma-separated number', () => {
      const control = new FormControl('1,000', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should reject space-separated number', () => {
      const control = new FormControl('1 000', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });

    it('should accept negative zero', () => {
      const control = new FormControl('-0', integerValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject plus sign prefix', () => {
      const control = new FormControl('+5', integerValidator());
      expect(control.hasError('integer')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - strictEmailValidator
  // ===========================================================================
  describe('strictEmailValidator - comprehensive branch coverage', () => {
    it('should accept email with underscore in username', () => {
      const control = new FormControl('user_name@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept email with numbers in username', () => {
      const control = new FormControl('user123@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should accept email with long TLD', () => {
      const control = new FormControl('user@example.museum', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject email with consecutive dots in domain', () => {
      const control = new FormControl('user@example..com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email starting with dot', () => {
      const control = new FormControl('.user@example.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email ending with dot before @', () => {
      const control = new FormControl('user.@example.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email with space', () => {
      const control = new FormControl('user @example.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email with numeric TLD', () => {
      const control = new FormControl('user@example.123', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should accept single-char username', () => {
      const control = new FormControl('a@example.com', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should handle non-string numeric value', () => {
      const control = new FormControl(42 as any, strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email with plus in username', () => {
      const control = new FormControl('user+tag@example.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should accept email with two-char TLD', () => {
      const control = new FormControl('user@example.uk', strictEmailValidator());
      expect(control.errors).toBeNull();
    });

    it('should reject email with domain starting with hyphen', () => {
      const control = new FormControl('user@-example.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });

    it('should reject email with domain ending with hyphen', () => {
      const control = new FormControl('user@example-.com', strictEmailValidator());
      expect(control.hasError('invalidEmail')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - trimControlValue
  // ===========================================================================
  describe('trimControlValue - comprehensive branch coverage', () => {
    it('should handle empty string (already trimmed, no setValue call)', () => {
      const control = new FormControl('');
      trimControlValue(control);
      expect(control.value).toBe('');
    });

    it('should not modify boolean control value (non-string branch)', () => {
      const control = new FormControl(true as any);
      trimControlValue(control);
      expect(control.value).toBe(true);
    });

    it('should not modify array control value (non-string branch)', () => {
      const val = [1, 2, 3];
      const control = new FormControl(val as any);
      trimControlValue(control);
      expect(control.value).toEqual(val);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - createTrimOnBlur
  // ===========================================================================
  describe('createTrimOnBlur - comprehensive branch coverage', () => {
    it('should handle null control value without error', () => {
      const control = new FormControl(null);
      const blurFn = createTrimOnBlur(control);
      blurFn();
      expect(control.value).toBeNull();
    });

    it('should handle number control value without error', () => {
      const control = new FormControl(42 as any);
      const blurFn = createTrimOnBlur(control);
      blurFn();
      expect(control.value).toBe(42);
    });

    it('should trim whitespace-only string to empty string', () => {
      const control = new FormControl('   ');
      const blurFn = createTrimOnBlur(control);
      blurFn();
      expect(control.value).toBe('');
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - getInputValidationError
  // ===========================================================================
  describe('getInputValidationError - comprehensive branch coverage', () => {
    it('should return empty string for unhandled error type (invalidNotationCode)', () => {
      const control = new FormControl('');
      control.setErrors({ invalidNotationCode: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Code')).toBe('');
    });

    it('should return empty string for unhandled error type (numericalValue)', () => {
      const control = new FormControl('');
      control.setErrors({ numericalValue: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Value')).toBe('');
    });

    it('should return empty string for unhandled error type (integer)', () => {
      const control = new FormControl('');
      control.setErrors({ integer: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Sequence')).toBe('');
    });

    it('should prioritize required over whitespaceOnly when both errors present', () => {
      const control = new FormControl('');
      control.setErrors({ required: true, whitespaceOnly: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Field')).toBe('Field is required');
    });

    it('should prioritize whitespaceOnly over invalidEmail when both present', () => {
      const control = new FormControl('');
      control.setErrors({ whitespaceOnly: true, invalidEmail: true });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Email')).toBe('Email cannot contain only spaces');
    });

    it('should return correct message for trimmedMaxLength with different field name', () => {
      const control = new FormControl('');
      control.setErrors({ trimmedMaxLength: { maxLength: 100, actualLength: 150 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Title')).toBe('Title cannot exceed 100 characters');
    });

    it('should return correct message for trimmedMinLength with different field name', () => {
      const control = new FormControl('');
      control.setErrors({ trimmedMinLength: { minLength: 5, actualLength: 2 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Name')).toBe('Name must be at least 5 characters');
    });

    it('should return correct message for outOfRange with 0 min', () => {
      const control = new FormControl('');
      control.setErrors({ outOfRange: { min: 0, max: 9999, actual: -1 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Sequence')).toBe('Sequence must be between 0 and 9999');
    });

    it('should return correct message for minDigits with different required count', () => {
      const control = new FormControl('');
      control.setErrors({ minDigits: { required: 5, actual: 3 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'ID')).toBe('ID must have at least 5 digits');
    });

    it('should return correct message for maxDigits with different required count', () => {
      const control = new FormControl('');
      control.setErrors({ maxDigits: { required: 10, actual: 12 } });
      control.markAsTouched();
      expect(getInputValidationError(control, 'Number')).toBe('Number cannot have more than 10 digits');
    });

    it('should use default fieldName for all error types when not provided', () => {
      const control = new FormControl('');
      control.setErrors({ whitespaceOnly: true });
      control.markAsTouched();
      expect(getInputValidationError(control)).toBe('Field cannot contain only spaces');
    });

    it('should return empty string when control has errors but is not touched', () => {
      const control = new FormControl('');
      control.setErrors({ required: true });
      // Not marking as touched
      expect(getInputValidationError(control, 'Name')).toBe('');
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - noLeadingTrailingWhitespaceValidator
  // ===========================================================================
  describe('noLeadingTrailingWhitespaceValidator - comprehensive branch coverage', () => {
    it('should return null for boolean value (non-string type)', () => {
      const control = new FormControl(true as any, noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for object value (non-string type)', () => {
      const control = new FormControl({} as any, noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should return null for string with only single spaces between words', () => {
      const control = new FormControl('a b c', noLeadingTrailingWhitespaceValidator());
      expect(control.errors).toBeNull();
    });

    it('should detect leading tab as leadingTrailingWhitespace', () => {
      const control = new FormControl('\thello', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('leadingTrailingWhitespace')).toBe(true);
    });

    it('should detect trailing newline as leadingTrailingWhitespace', () => {
      const control = new FormControl('hello\n', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('leadingTrailingWhitespace')).toBe(true);
    });

    it('should detect three consecutive spaces as multipleSpaces', () => {
      const control = new FormControl('hello   world', noLeadingTrailingWhitespaceValidator());
      expect(control.hasError('multipleSpaces')).toBe(true);
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - trimmedMaxLengthValidator
  // ===========================================================================
  describe('trimmedMaxLengthValidator - comprehensive branch coverage', () => {
    it('should return null for undefined value (falsy branch)', () => {
      const control = new FormControl(undefined, trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null for boolean value (non-string type)', () => {
      const control = new FormControl(true as any, trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null for zero value (falsy branch)', () => {
      const control = new FormControl(0 as any, trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return null when trimmed length is exactly 1 under maxLength', () => {
      const control = new FormControl('abcd', trimmedMaxLengthValidator(5));
      expect(control.errors).toBeNull();
    });

    it('should return error when trimmed length is exactly 1 over maxLength', () => {
      const control = new FormControl('abcdef', trimmedMaxLengthValidator(5));
      expect(control.hasError('trimmedMaxLength')).toBe(true);
      expect(control.getError('trimmedMaxLength')?.actualLength).toBe(6);
    });

    it('should not count leading/trailing whitespace in length', () => {
      const control = new FormControl('  abc  ', trimmedMaxLengthValidator(3));
      expect(control.errors).toBeNull();
    });
  });

  // ===========================================================================
  // Comprehensive branch coverage - trimmedMinLengthValidator
  // ===========================================================================
  describe('trimmedMinLengthValidator - comprehensive branch coverage', () => {
    it('should return null for undefined value (falsy branch)', () => {
      const control = new FormControl(undefined, trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null for boolean value (non-string type)', () => {
      const control = new FormControl(true as any, trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return null for zero value (falsy branch)', () => {
      const control = new FormControl(0 as any, trimmedMinLengthValidator(3));
      expect(control.errors).toBeNull();
    });

    it('should return error for single char when minLength is 2', () => {
      const control = new FormControl('a', trimmedMinLengthValidator(2));
      expect(control.hasError('trimmedMinLength')).toBe(true);
      expect(control.getError('trimmedMinLength')?.actualLength).toBe(1);
    });

    it('should not count leading/trailing whitespace in length check', () => {
      const control = new FormControl('  a  ', trimmedMinLengthValidator(3));
      expect(control.hasError('trimmedMinLength')).toBe(true);
      expect(control.getError('trimmedMinLength')?.actualLength).toBe(1);
    });
  });
});
