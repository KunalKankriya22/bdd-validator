import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to ensure at least one search criterion is provided
 * Required for TieTagSearchCriteriaDto validation
 */
export function atLeastOneFieldValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    if (!formGroup) {
      return null;
    }

    const patientId = formGroup.get('patientId')?.value;
    const lastName = formGroup.get('lastName')?.value;
    const firstName = formGroup.get('firstName')?.value;
    const dateOfBirth = formGroup.get('dateOfBirth')?.value;
    const surgeryId = formGroup.get('surgeryId')?.value;
    const surgeryDate = formGroup.get('surgeryDate')?.value;

    const hasAtLeastOne =
      (patientId && patientId.trim()) ||
      (lastName && lastName.trim()) ||
      (firstName && firstName.trim()) ||
      dateOfBirth ||
      (surgeryId && surgeryId.trim()) ||
      surgeryDate;

    return hasAtLeastOne ? null : { atLeastOneRequired: true };
  };
}
