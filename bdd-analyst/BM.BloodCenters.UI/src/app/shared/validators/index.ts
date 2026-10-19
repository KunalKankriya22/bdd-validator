/**
 * Shared Validators - Barrel Export
 *
 * Import validators from this file for convenience:
 * import { noWhitespaceOnlyValidator, codeFieldValidator } from '@shared/validators';
 */

// Input validators (text, number, code fields)
export {
  // Text field validators
  noWhitespaceOnlyValidator,
  requiredTrimmedValidator,
  trimmedMaxLengthValidator,
  trimmedMinLengthValidator,

  // Number field validators
  numericFieldValidator,
  positiveIntegerValidator,
  numericalValueValidator,
  integerValidator,

  // Code field validators
  codeFieldValidator,
  alphanumericCodeValidator,
  numericCodeValidator,

  // Utility functions
  trimControlValue,
  createTrimOnBlur,
  getInputValidationError
} from './input.validators';

// Date validators
export {
  arrayRequiredValidator,
  effectiveDateNotPastValidator,
  terminationAfterEffectiveValidator,
  dateRangeValidator,
  getEffectiveDateErrorMessage,
  getTerminationDateErrorMessage
} from './date.validators';

// Email validator
export { emailFormatValidator } from './email.validator';
