import { AbstractControl, ValidationErrors, ValidatorFn, FormArray, FormGroup } from '@angular/forms';
import moment from 'moment';

/**
 * Validator to check if DOB is not beyond maximum allowed age (150 years / 1800 months)
 * Oracle Forms: IF MONTHS_BETWEEN(SYSDATE, trunc(:ctrl_block_1.DOB)) > 1800 THEN show_error('16053');
 */
export function dobMaxAgeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const dob = moment.isMoment(control.value) ? control.value : moment(control.value);
    if (!dob.isValid()) return null;

    const monthsDiff = moment().diff(dob, 'months');
    if (monthsDiff > 1800) {
      return { dobMaxAge: { maxMonths: 1800, actual: monthsDiff } };
    }

    return null;
  };
}

/**
 * Form-level validator to check for duplicate HLA Antibodies (locus + epitopeId pairs)
 * Oracle Forms: check for duplicate in PATIENT_HLA_ANTIBODIES table, show error 9200 if found
 */
export function hlaAntibodyDuplicateValidator(arrayName: string = 'hlaAntibodies'): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const formArray = formGroup.get(arrayName) as FormArray;
    if (!formArray || formArray.length === 0) return null;

    const seen = new Set<string>();
    const duplicates: number[] = [];

    for (let i = 0; i < formArray.length; i++) {
      const row = formArray.at(i) as FormGroup;
      const locus = row.get('locus')?.value;
      const epitopeId = row.get('epitopeId')?.value;

      if (locus && epitopeId) {
        const key = `${locus}:${epitopeId}`;
        if (seen.has(key)) {
          duplicates.push(i);
        } else {
          seen.add(key);
        }
      }
    }

    return duplicates.length > 0 ? { hlaAntibodyDuplicate: { duplicateIndices: duplicates } } : null;
  };
}

/**
 * Form-level validator to check for duplicate RBC Antigens (testId + resultCode pairs)
 * Oracle Forms: check for duplicate in PATIENT_RBC_ANTIGENS table, show error 9200 if found
 */
export function rbcAntigenDuplicateValidator(arrayName: string = 'rbcAntigens'): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const formArray = formGroup.get(arrayName) as FormArray;
    if (!formArray || formArray.length === 0) return null;

    const seen = new Set<string>();
    const duplicates: number[] = [];

    for (let i = 0; i < formArray.length; i++) {
      const row = formArray.at(i) as FormGroup;
      const testId = row.get('testId')?.value;
      const resultCode = row.get('resultCode')?.value;

      if (testId && resultCode) {
        const key = `${testId}:${resultCode}`;
        if (seen.has(key)) {
          duplicates.push(i);
        } else {
          seen.add(key);
        }
      }
    }

    return duplicates.length > 0 ? { rbcAntigenDuplicate: { duplicateIndices: duplicates } } : null;
  };
}

/**
 * Form-level validator to check for duplicate RBC Antibodies (testId)
 * Oracle Forms: check for duplicate testId in PATIENT_RBC_ANTIBODIES table, show error 9200 if found
 */
export function rbcAntibodyDuplicateValidator(arrayName: string = 'rbcAntibodies'): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const formArray = formGroup.get(arrayName) as FormArray;
    if (!formArray || formArray.length === 0) return null;

    const seen = new Set<string>();
    const duplicates: number[] = [];

    for (let i = 0; i < formArray.length; i++) {
      const row = formArray.at(i) as FormGroup;
      const testId = row.get('testId')?.value;

      if (testId) {
        if (seen.has(testId)) {
          duplicates.push(i);
        } else {
          seen.add(testId);
        }
      }
    }

    return duplicates.length > 0 ? { rbcAntibodyDuplicate: { duplicateIndices: duplicates } } : null;
  };
}

/**
 * Row-level validator for HLA Phenotype to prevent A1 = A2 or B1 = B2
 * Oracle Forms: if :A1 = :A2 then show_error('9200'); check_package_failure; end if;
 * Note: Oracle Forms auto-swaps if A1 > A2 or B1 > B2, so we only validate equality here
 */
export function hlaPhenotypeDuplicateValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    if (!(formGroup instanceof FormGroup)) return null;

    const a1 = formGroup.get('a1')?.value;
    const a2 = formGroup.get('a2')?.value;
    const b1 = formGroup.get('b1')?.value;
    const b2 = formGroup.get('b2')?.value;

    const errors: any = {};

    if (a1 && a2 && a1 === a2) {
      errors.a1a2Duplicate = true;
    }

    if (b1 && b2 && b1 === b2) {
      errors.b1b2Duplicate = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
