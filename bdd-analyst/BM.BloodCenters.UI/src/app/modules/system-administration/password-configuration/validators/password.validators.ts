import { AbstractControl, FormGroup, ValidatorFn, ValidationErrors } from '@angular/forms';

/**
 * Validates that total minimum character requirements don't exceed minimum length
 * Formula: minUppers + minLowers + minNumeric + minSpecials <= minLength
 * Only counts requirements where their corresponding toggles are enabled
 *
 * Example: If minLength=8, minUppers=3, minLowers=3, minNumeric=1, minSpecials=1
 * Total = 3+3+1+1 = 8 ✓ (valid)
 */
export function totalPasswordLengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const g = control.get('passwordRequirements') as FormGroup;
    if (!g) return null;

    const minLength = g.value.minLength || 0;

    // Only count values where their respective toggles are enabled
    const requireUpper = g.value.requireUpper;
    const requireLower = g.value.requireLower;
    const requireNumeric = g.value.requireNumeric;
    const requireSpecial = g.value.requireSpecial;

    const minUppers = requireUpper ? (g.value.minUppers || 0) : 0;
    const minLowers = requireLower ? (g.value.minLowers || 0) : 0;
    const minNumeric = requireNumeric ? (g.value.minNumeric || 0) : 0;
    const minSpecials = requireSpecial ? (g.value.minSpecials || 0) : 0;

    const total = minUppers + minLowers + minNumeric + minSpecials;

    return total > minLength
      ? { totalPasswordLength: { total, minLength } }
      : null;
  };
}

/**
 * Validates that warning notice days is less than password validity period
 * warningNoticeDays must be < passwordValidityDays
 * Only validates when password expiration is enabled
 *
 * Example: If passwordValidityDays=365, warningNoticeDays=5
 * 5 < 365 ✓ (valid)
 */
export function expiryWarningValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const g = control.get('expirationNotifications') as FormGroup;
    if (!g) return null;

    // Skip validation if password expiration is disabled
    const enablePasswordExpiration = g.value.enablePasswordExpiration;
    if (!enablePasswordExpiration) return null;

    const warningNoticeDays = g.value.warningNoticeDays || 0;
    const passwordValidityDays = g.value.passwordValidityDays || 0;

    return warningNoticeDays >= passwordValidityDays
      ? { expiryWarning: { warningNoticeDays, passwordValidityDays } }
      : null;
  };
}

/**
 * Validates that allowed special characters only contains valid special characters
 *
 * BACKEND VALIDATION RULES (Oracle Forms - Error Code 16321):
 * REJECTED characters:
 * - @ % & ' , (comma) - forbidden symbols
 * - 0-9 - numbers
 * - A-Z, a-z - letters
 * - spaces
 * - Duplicate characters (same character appearing more than once)
 *
 * ALLOWED examples: ! # $ ^ * ( ) - _ + = [ ] { } | \ : ; " < > . ? / ~ `
 */
export function specialCharValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.trim();
    if (!value) {
      return { invalidSpecialChars: {
        value: control.value,
        reason: 'Cannot be empty or contain only spaces'
      }};
    }

    // Check for forbidden characters: @, %, &, ', , (comma), spaces, letters, numbers
    const forbiddenCharsRegex = /[@%&',\s0-9A-Za-z]/;

    if (forbiddenCharsRegex.test(control.value)) {
      return {
        invalidSpecialChars: {
          value: control.value,
          reason: 'Cannot contain @, %, &, \', commas, spaces, letters, or numbers'
        }
      };
    }

    // Check for duplicate characters
    const chars = control.value.split('');
    const uniqueChars = new Set(chars);

    if (chars.length !== uniqueChars.size) {
      // Find the duplicate character(s) for better error messaging
      const charCount = new Map<string, number>();
      chars.forEach((char: string) => {
        charCount.set(char, (charCount.get(char) || 0) + 1);
      });

      const duplicates = Array.from(charCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([char, _]) => char);

      return {
        duplicateSpecialChars: {
          value: control.value,
          duplicates: duplicates.join(', ')
        }
      };
    }

    return null;
  };
}

/**
 * Validates that minimum characters to change does not exceed minimum length
 * minCharsToChange must be <= minLength
 * 
 * Example: If minLength=8, minCharsToChange=3
 * 3 <= 8 ✓ (valid)
 */
export function charsDifferenceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordReqs = control.get('passwordRequirements') as FormGroup;
    const securityPolicies = control.get('securityPolicies') as FormGroup;
    
    if (!passwordReqs || !securityPolicies) return null;

    const minLength = passwordReqs.value.minLength || 0;
    const minCharsToChange = securityPolicies.value.minCharsToChange || 0;

    return minCharsToChange > minLength
      ? { charsDifference: { minCharsToChange, minLength } }
      : null;
  };
}

/**
 * Validates that field value is within the specified range (inclusive)
 * Used for numeric input fields with min/max constraints
 */
export function rangeValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = Number(control.value);
    if (isNaN(value)) {
      return { invalidRange: { expected: `${min}-${max}`, actual: control.value } };
    }

    if (value < min || value > max) {
      return { outOfRange: { min, max, actual: value } };
    }

    return null;
  };
}
