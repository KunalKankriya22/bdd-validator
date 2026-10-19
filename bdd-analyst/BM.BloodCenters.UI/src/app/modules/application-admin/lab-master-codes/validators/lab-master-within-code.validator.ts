import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to ensure Code contains only alphanumeric characters (A-Z, 0-9)
 */
export function alphanumericValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        const isValid = alphanumericRegex.test(control.value);

        return isValid ? null : { alphanumeric: true };
    };
}

/**
 * Validator to ensure Termination Date is on or after Effective Date
 */
export function terminationAfterEffectiveValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const effectiveDateControl = formGroup.get('effectiveDate');
        const terminationDateControl = formGroup.get('terminationDate');

        const effectiveDate = effectiveDateControl?.value;
        const terminationDate = terminationDateControl?.value;

        if (!effectiveDate || !terminationDate) {
            return null;
        }

        const effectiveTime = effectiveDate instanceof Date
            ? effectiveDate.getTime()
            : effectiveDate.valueOf();

        const terminationTime = terminationDate instanceof Date
            ? terminationDate.getTime()
            : terminationDate.valueOf();

        if (terminationTime < effectiveTime) {
            terminationDateControl?.setErrors({ terminationBeforeEffective: true });
            return { terminationBeforeEffective: true };
        }

        if (terminationDateControl?.hasError('terminationBeforeEffective')) {
            terminationDateControl.setErrors(null);
        }

        return null;
    };
}

/**
 * Validator to check max length after trimming whitespace
 */
export function trimmedMaxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const trimmedLength = control.value.trim().length;
        return trimmedLength > maxLength
            ? { trimmedMaxLength: { maxLength, actualLength: trimmedLength } }
            : null;
    };
}

/**
 * Validator to check if value is not empty after trimming
 */
export function trimmedRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value || control.value.trim().length === 0) {
            return { trimmedRequired: true };
        }
        return null;
    };
}

/**
 * Validator for Numerical Value — Oracle NUMBER(10,3)
 * Up to 7 integer digits and up to 3 decimal digits, negative values allowed
 * Range: -9999999.999 to 9999999.999
 */
export function numericalValueValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control.value === null || control.value === undefined || control.value === '') {
            return null;
        }

        const value = control.value.toString().trim();

        if (value === '' || value === '-') {
            return null;
        }

        // Up to 7 integer digits, up to 3 decimal digits, optional negative sign
        const numberRegex = /^-?\d{1,7}(\.\d{1,3})?$/;
        return numberRegex.test(value) ? null : { numericalValue: true };
    };
}

/**
 * Validator for integer fields that allow negative values (Sequence 1, 2, 3)
 * Accepts whole numbers only — positive or negative, no decimals
 */
export function integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control.value === null || control.value === undefined || control.value === '') {
            return null;
        }

        const value = control.value.toString().trim();

        if (value === '' || value === '-') {
            return null;
        }

        const integerRegex = /^-?\d+$/;
        return integerRegex.test(value) ? null : { integer: true };
    };
}

/**
 * Validator for 4-digit numeric fields (Sequence 1, 2, 3, Numerical Value)
 * Accepts only 1-4 digit positive integers (0-9999)
 */
export function numericValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value && control.value !== 0) {
            return null;
        }

        const value = control.value.toString().trim();

        if (value === '') {
            return null;
        }

        const onlyDigitsRegex = /^\d+$/;

        if (!onlyDigitsRegex.test(value)) {
            return { numeric: true };
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 9999) {
            return { numeric: true };
        }

        return null;
    };
}