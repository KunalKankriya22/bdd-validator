import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment';
import { TemplateVariable } from '../models/notification-letter.model';
import { TemplateVariableUtil } from '../utils/template-variable.util';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

/**
 * Validator for effective date
 * Ensures date is not in the past based on chapter local date
 * @param chapterTimezone - Optional chapter timezone offset
 */
export function effectiveDateValidator(chapterTimezone?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Don't validate empty values (use Validators.required for that)
    }

    const selected = moment(value).startOf('day');

    if (!selected.isValid()) {
      return { invalidDate: true };
    }

    // Use DateFieldValidationUtility to get chapter's today
    // This will use ChapterTimezoneService if available, or fallback to chapter timezone offset
    const today = chapterTimezone
      ? DateFieldValidationUtility['getToday'](chapterTimezone)
      : DateFieldValidationUtility['getToday']();

    // Compare as calendar date strings to avoid timezone issues
    if (selected.format('YYYY-MM-DD') < today.format('YYYY-MM-DD')) {
      return { dateInPast: { value: selected.format('DD-MMM-YYYY') } };
    }

    return null;
  };
}

/**
 * Cross-field validator for termination date
 * Ensures termination date is on or after effective date (same day is allowed)
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const effectiveDateControl = formGroup.get('effectiveDate');
    const terminationDateControl = formGroup.get('terminationDate');

    if (!effectiveDateControl || !terminationDateControl) {
      return null;
    }

    const effectiveDate = effectiveDateControl.value;
    const terminationDate = terminationDateControl.value;

    // If either is empty, don't validate
    if (!effectiveDate || !terminationDate) {
      return null;
    }

    const effectiveMoment = moment(effectiveDate).startOf('day');
    const terminationMoment = moment(terminationDate).startOf('day');

    if (!effectiveMoment.isValid() || !terminationMoment.isValid()) {
      return null; // Let individual validators handle invalid dates
    }

    // Termination date must be on or after effective date (same day is allowed)
    if (terminationMoment.isBefore(effectiveMoment)) {
      return {
        terminationBeforeEffective: {
          effectiveDate: effectiveMoment.format('DD-MMM-YYYY'),
          terminationDate: terminationMoment.format('DD-MMM-YYYY')
        }
      };
    }

    return null;
  };
}

/**
 * Validator for template variables in letter message
 * Ensures only allowed variables are used
 */
export function templateVariableValidator(allowedVariables: TemplateVariable[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value || !value.trim()) {
      return null;
    }

    const validation = TemplateVariableUtil.validateVariables(value, allowedVariables);

    if (!validation.valid) {
      return {
        invalidTemplateVariables: {
          invalidVariables: validation.invalidVariables,
          message: `Invalid template variables: ${validation.invalidVariables.join(', ')}`
        }
      };
    }

    return null;
  };
}

/**
 * Validator for letter code format
 * Ensures letter code follows expected pattern
 * TODO: Update with actual business rules from FMB analysis
 */
export function letterCodeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value || !value.trim()) {
      return null;
    }

    const trimmedValue = value.trim();
    const maxLength = 10;

    if (trimmedValue.length > maxLength) {
      return { letterCodeTooLong: { maxLength, actualLength: trimmedValue.length } };
    }

    return null;
  };
}

/**
 * Validator for title length
 * TODO: Update with actual DB column length from schema
 */
export function titleLengthValidator(maxLength: number = 100): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    if (value.length > maxLength) {
      return { maxlength: { requiredLength: maxLength, actualLength: value.length } };
    }

    return null;
  };
}

/**
 * Validator for letter message length
 * TODO: Update with actual DB column length from schema
 */
export function letterMessageLengthValidator(maxLength: number = 30000): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    if (value.length > maxLength) {
      return { maxlength: { requiredLength: maxLength, actualLength: value.length } };
    }

    return null;
  };
}

/**
 * Validator for date range
 * Ensures date is within a specific range
 */
export function dateRangeValidator(minDate?: Date, maxDate?: Date): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const selected = moment(value).startOf('day');

    if (!selected.isValid()) {
      return { invalidDate: true };
    }

    if (minDate) {
      const min = moment(minDate).startOf('day');
      if (selected.isBefore(min)) {
        return { dateTooEarly: { minDate: min.format('DD-MMM-YYYY') } };
      }
    }

    if (maxDate) {
      const max = moment(maxDate).startOf('day');
      if (selected.isAfter(max)) {
        return { dateTooLate: { maxDate: max.format('DD-MMM-YYYY') } };
      }
    }

    return null;
  };
}

/**
 * Helper function to get error message for display
 */
export function getValidationErrorMessage(errors: ValidationErrors): string {
  // CRITICAL: Check matDatepickerParse BEFORE required
  // When user types invalid date text (e.g., "02292026"), Angular Material Datepicker:
  // 1. Cannot parse it → sets control value to null
  // 2. Adds matDatepickerParse error
  // 3. Validators.required also triggers (because value is null)
  // We must check matDatepickerParse FIRST to show "Invalid date format"
  // instead of misleading "This field is required" message.
  if (errors['matDatepickerParse']) {
    return 'Invalid date format';
  }

  // Now check required - this means the field is truly empty (no user input)
  if (errors['required']) {
    return 'This field is required';
  }

  // Date format validation errors
  if (errors['invalidDateFormat']) {
    return 'Invalid date format';
  }

  if (errors['invalidDate']) {
    return 'Invalid date format';
  }

  // Date-specific validation errors
  if (errors['dateInPast']) {
    return 'Date cannot be in the past';
  }

  if (errors['matDatepickerMin']) {
    return 'Date is too early';
  }

  if (errors['matDatepickerMax']) {
    return 'Date is too late';
  }

  if (errors['dateTooEarly']) {
    return `Date must be on or after ${errors['dateTooEarly'].minDate}`;
  }

  if (errors['dateTooLate']) {
    return `Date must be on or before ${errors['dateTooLate'].maxDate}`;
  }

  // Cross-field date validation errors
  if (errors['terminationBeforeEffective']) {
    return 'Termination date must be after effective date';
  }

  if (errors['dateRangeInvalid']) {
    return 'Termination date must be after effective date';
  }

  // Field-specific validation errors
  if (errors['invalidTemplateVariables']) {
    return errors['invalidTemplateVariables'].message;
  }

  if (errors['letterCodeInvalidFormat']) {
    return 'Letter code must contain only uppercase letters, numbers, periods, underscores, and hyphens';
  }

  if (errors['letterCodeTooLong']) {
    const error = errors['letterCodeTooLong'];
    return `Letter code is too long (max ${error.maxLength} characters)`;
  }

  if (errors['maxlength']) {
    const error = errors['maxlength'];
    return `Maximum length is ${error.requiredLength} characters (current: ${error.actualLength})`;
  }

  // Default message
  return 'Invalid value';
}
