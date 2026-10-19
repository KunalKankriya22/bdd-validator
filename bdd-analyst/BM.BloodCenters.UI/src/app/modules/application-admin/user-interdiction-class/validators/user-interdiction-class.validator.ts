// import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
// import moment from 'moment';

// /**
//  * Validator to check if a field is required after trimming whitespace
//  */
// export function trimmedRequiredValidator(): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;
//     if (!value || typeof value !== 'string') {
//       return { trimmedRequired: true };
//     }
//     return value.trim().length === 0 ? { trimmedRequired: true } : null;
//   };
// }

// /**
//  * Validator to check maximum length after trimming whitespace
//  */
// export function trimmedMaxLengthValidator(maxLength: number): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const value = control.value;
//     if (!value || typeof value !== 'string') {
//       return null;
//     }
//     return value.trim().length > maxLength ? { trimmedMaxLength: { maxLength, actualLength: value.trim().length } } : null;
//   };
// }

// /*
//  * Validator to check if termination date is on or after effective date
//  */
// export function terminationAfterEffectiveValidator(): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const effectiveDateControl = control.get('effectiveDate');
//     const terminationDateControl = control.get('terminationDate');

//     if (!effectiveDateControl || !terminationDateControl) {
//       return null;
//     }

//     const effectiveDate = effectiveDateControl.value;
//     const terminationDate = terminationDateControl.value;

//     // If either date is not set, don't validate
//     if (!effectiveDate || !terminationDate) {
//       // Clear the error on termination date control if it was previously set
//       if (terminationDateControl.hasError('terminationBeforeEffective')) {
//         const errors = { ...terminationDateControl.errors };
//         delete errors['terminationBeforeEffective'];
//         terminationDateControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
//       }
//       return null;
//     }

//     // Convert to moment objects if they aren't already
//     const effective = moment.isMoment(effectiveDate) ? effectiveDate : moment(effectiveDate);
//     const termination = moment.isMoment(terminationDate) ? terminationDate : moment(terminationDate);

//     const effectiveDay = moment(effective).startOf('day');
//     const terminationDay = moment(termination).startOf('day');
//     // Compare dates (startOf('day') ensures we're only comparing dates, not times)
//     if (terminationDay.isBefore(effectiveDay)) {
//       const currentErrors = terminationDateControl.errors || {};
//       terminationDateControl.setErrors(
//         { ...currentErrors, terminationBeforeEffective: true },
//         { emitEvent: false }
//       );

//       // Return null so the form itself is NOT invalid
//       // This allows the save button to remain enabled
//       return null;
//     }

//     // Clear the error on termination date control if dates are valid
//     if (terminationDateControl.hasError('terminationBeforeEffective')) {
//       const errors = { ...terminationDateControl.errors };
//       delete errors['terminationBeforeEffective'];
//       terminationDateControl.setErrors(
//         Object.keys(errors).length > 0 ? errors : null,
//         { emitEvent: false }
//       );
//     }

//     return null;
//   };
// }

import {
  trimmedRequiredValidator,
  trimmedMaxLengthValidator,
  terminationAfterEffectiveValidator,
} from '../../interdiction-class/validators/interdiction-class.validator';
export {
  trimmedRequiredValidator,
  trimmedMaxLengthValidator,
  terminationAfterEffectiveValidator,
};