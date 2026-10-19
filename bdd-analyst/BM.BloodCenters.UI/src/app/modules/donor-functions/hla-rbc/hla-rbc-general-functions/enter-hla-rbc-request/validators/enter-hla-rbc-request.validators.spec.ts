import { FormControl, FormGroup, FormArray } from '@angular/forms';
import moment from 'moment';
import {
  dobMaxAgeValidator,
  hlaAntibodyDuplicateValidator,
  rbcAntigenDuplicateValidator,
  rbcAntibodyDuplicateValidator,
  hlaPhenotypeDuplicateValidator,
} from './enter-hla-rbc-request.validators';

describe('Enter HLA/RBC Request Validators', () => {

  describe('dobMaxAgeValidator', () => {

    describe('valid cases', () => {
      it('should return null for null value', () => {
        const control = new FormControl(null, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for undefined value', () => {
        const control = new FormControl(undefined, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for empty string', () => {
        const control = new FormControl('', dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for valid DOB (30 years old)', () => {
        const dob = moment().subtract(30, 'years');
        const control = new FormControl(dob, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for DOB exactly 150 years ago (1800 months)', () => {
        const dob = moment().subtract(1800, 'months');
        const control = new FormControl(dob, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });
    });

    describe('invalid cases', () => {
      it('should return error for DOB > 150 years old', () => {
        const dob = moment().subtract(1801, 'months');
        const control = new FormControl(dob, dobMaxAgeValidator());
        expect(control.hasError('dobMaxAge')).toBe(true);
      });

      it('should include maxMonths (1800) in error object', () => {
        const dob = moment().subtract(1900, 'months');
        const control = new FormControl(dob, dobMaxAgeValidator());
        const error = control.getError('dobMaxAge');
        expect(error?.maxMonths).toBe(1800);
      });

      it('should include actual months difference in error object', () => {
        const dob = moment().subtract(1850, 'months');
        const control = new FormControl(dob, dobMaxAgeValidator());
        const error = control.getError('dobMaxAge');
        expect(error?.actual).toBeGreaterThan(1800);
        expect(error?.actual).toBeCloseTo(1850, -1); // Within 10 months tolerance
      });
    });

    describe('edge cases', () => {
      it('should handle Moment objects correctly', () => {
        const dob = moment().subtract(50, 'years');
        const control = new FormControl(dob, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should handle Date objects correctly', () => {
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - 50);
        const control = new FormControl(dob, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should handle invalid date gracefully', () => {
        const control = new FormControl('invalid-date', dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });

      it('should return null for invalid moment', () => {
        const invalidMoment = moment('invalid');
        const control = new FormControl(invalidMoment, dobMaxAgeValidator());
        expect(control.errors).toBeNull();
      });
    });
  });

  describe('hlaAntibodyDuplicateValidator', () => {
    let form: FormGroup;
    let hlaAntibodies: FormArray;

    beforeEach(() => {
      form = new FormGroup({
        hlaAntibodies: new FormArray([])
      }, { validators: [hlaAntibodyDuplicateValidator('hlaAntibodies')] });
      hlaAntibodies = form.get('hlaAntibodies') as FormArray;
    });

    describe('valid cases', () => {
      it('should return null for empty array', () => {
        expect(form.errors).toBeNull();
      });

      it('should return null for single row', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null for unique (locus, epitopeId) pairs', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('B'),
          epitopeId: new FormControl('456')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null when locus is empty', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl(''),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl(''),
          epitopeId: new FormControl('123')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null when epitopeId is empty', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('')
        }));
        expect(form.errors).toBeNull();
      });
    });

    describe('invalid cases', () => {
      it('should return error for duplicate (locus, epitopeId) pair', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        expect(form.hasError('hlaAntibodyDuplicate')).toBe(true);
      });

      it('should return error with duplicateIndices array', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        const error = form.getError('hlaAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1]);
      });

      it('should detect multiple duplicates', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('B'),
          epitopeId: new FormControl('456')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('B'),
          epitopeId: new FormControl('456')
        }));
        const error = form.getError('hlaAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1, 3]);
      });

      it('should handle 3+ duplicate entries', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        const error = form.getError('hlaAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1, 2]);
      });
    });

    describe('edge cases', () => {
      it('should treat different locus + same epitope as valid', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('B'),
          epitopeId: new FormControl('123')
        }));
        expect(form.errors).toBeNull();
      });

      it('should treat same locus + different epitope as valid', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('456')
        }));
        expect(form.errors).toBeNull();
      });

      it('should be case-sensitive for locus comparison', () => {
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('A'),
          epitopeId: new FormControl('123')
        }));
        hlaAntibodies.push(new FormGroup({
          locus: new FormControl('a'),
          epitopeId: new FormControl('123')
        }));
        expect(form.errors).toBeNull();
      });
    });
  });

  describe('rbcAntigenDuplicateValidator', () => {
    let form: FormGroup;
    let rbcAntigens: FormArray;

    beforeEach(() => {
      form = new FormGroup({
        rbcAntigens: new FormArray([])
      }, { validators: [rbcAntigenDuplicateValidator('rbcAntigens')] });
      rbcAntigens = form.get('rbcAntigens') as FormArray;
    });

    describe('valid cases', () => {
      it('should return null for empty array', () => {
        expect(form.errors).toBeNull();
      });

      it('should return null for single row', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null for unique (testId, resultCode) pairs', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T2'),
          resultCode: new FormControl('NEG')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null when testId is empty', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl(''),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl(''),
          resultCode: new FormControl('POS')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null when resultCode is empty', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('')
        }));
        expect(form.errors).toBeNull();
      });
    });

    describe('invalid cases', () => {
      it('should return error for duplicate (testId, resultCode) pair', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        expect(form.hasError('rbcAntigenDuplicate')).toBe(true);
      });

      it('should return error with duplicateIndices array', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        const error = form.getError('rbcAntigenDuplicate');
        expect(error?.duplicateIndices).toEqual([1]);
      });

      it('should detect multiple duplicates', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T2'),
          resultCode: new FormControl('NEG')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T2'),
          resultCode: new FormControl('NEG')
        }));
        const error = form.getError('rbcAntigenDuplicate');
        expect(error?.duplicateIndices).toEqual([1, 3]);
      });
    });

    describe('edge cases', () => {
      it('should treat different testId + same resultCode as valid', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T2'),
          resultCode: new FormControl('POS')
        }));
        expect(form.errors).toBeNull();
      });

      it('should treat same testId + different resultCode as valid', () => {
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('POS')
        }));
        rbcAntigens.push(new FormGroup({
          testId: new FormControl('T1'),
          resultCode: new FormControl('NEG')
        }));
        expect(form.errors).toBeNull();
      });
    });
  });

  describe('rbcAntibodyDuplicateValidator', () => {
    let form: FormGroup;
    let rbcAntibodies: FormArray;

    beforeEach(() => {
      form = new FormGroup({
        rbcAntibodies: new FormArray([])
      }, { validators: [rbcAntibodyDuplicateValidator('rbcAntibodies')] });
      rbcAntibodies = form.get('rbcAntibodies') as FormArray;
    });

    describe('valid cases', () => {
      it('should return null for empty array', () => {
        expect(form.errors).toBeNull();
      });

      it('should return null for single row', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null for unique testId values', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T2')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T3')
        }));
        expect(form.errors).toBeNull();
      });

      it('should return null when testId is empty', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('')
        }));
        expect(form.errors).toBeNull();
      });
    });

    describe('invalid cases', () => {
      it('should return error for duplicate testId', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        expect(form.hasError('rbcAntibodyDuplicate')).toBe(true);
      });

      it('should return error with duplicateIndices array', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        const error = form.getError('rbcAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1]);
      });

      it('should detect multiple duplicates', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T2')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T2')
        }));
        const error = form.getError('rbcAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1, 3]);
      });

      it('should handle 3+ duplicate testId entries', () => {
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        rbcAntibodies.push(new FormGroup({
          testId: new FormControl('T1')
        }));
        const error = form.getError('rbcAntibodyDuplicate');
        expect(error?.duplicateIndices).toEqual([1, 2]);
      });
    });
  });

  describe('hlaPhenotypeDuplicateValidator', () => {
    let phenotypeRow: FormGroup;

    beforeEach(() => {
      phenotypeRow = new FormGroup({
        a1: new FormControl(''),
        a2: new FormControl(''),
        b1: new FormControl(''),
        b2: new FormControl('')
      }, { validators: [hlaPhenotypeDuplicateValidator()] });
    });

    describe('valid cases', () => {
      it('should return null when A1 and A2 are different', () => {
        phenotypeRow.patchValue({ a1: '01', a2: '02' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should return null when B1 and B2 are different', () => {
        phenotypeRow.patchValue({ b1: '07', b2: '08' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should return null when all fields are empty', () => {
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should return null when only one field is filled', () => {
        phenotypeRow.patchValue({ a1: '01' });
        expect(phenotypeRow.errors).toBeNull();
      });

      // Oracle Forms auto-swaps when A1 > A2, so validator only checks equality
      it('should return null when A1 > A2 (auto-swap handles this)', () => {
        phenotypeRow.patchValue({ a1: '19', a2: '10' });
        expect(phenotypeRow.errors).toBeNull();
      });

      // Oracle Forms auto-swaps when B1 > B2, so validator only checks equality
      it('should return null when B1 > B2 (auto-swap handles this)', () => {
        phenotypeRow.patchValue({ b1: '35', b2: '27' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should return null when A1 is null but A2 has value', () => {
        phenotypeRow.patchValue({ a1: null, a2: '10' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should return null when B1 is null but B2 has value', () => {
        phenotypeRow.patchValue({ b1: null, b2: '27' });
        expect(phenotypeRow.errors).toBeNull();
      });
    });

    describe('invalid cases - duplicate (equal) values', () => {
      it('should return a1a2Duplicate error when A1 = A2', () => {
        phenotypeRow.patchValue({ a1: '01', a2: '01' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
      });

      it('should return b1b2Duplicate error when B1 = B2', () => {
        phenotypeRow.patchValue({ b1: '07', b2: '07' });
        expect(phenotypeRow.hasError('b1b2Duplicate')).toBe(true);
      });

      it('should return both errors when A1=A2 AND B1=B2', () => {
        phenotypeRow.patchValue({ a1: '01', a2: '01', b1: '07', b2: '07' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
        expect(phenotypeRow.hasError('b1b2Duplicate')).toBe(true);
      });

      it('should return a1a2Duplicate error when A1 = A2 with numeric values', () => {
        phenotypeRow.patchValue({ a1: '10', a2: '10' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
      });

      it('should return b1b2Duplicate error when B1 = B2 with numeric values', () => {
        phenotypeRow.patchValue({ b1: '27', b2: '27' });
        expect(phenotypeRow.hasError('b1b2Duplicate')).toBe(true);
      });

      it('should return a1a2Duplicate error for string equality', () => {
        phenotypeRow.patchValue({ a1: 'A10', a2: 'A10' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
      });

      it('should return b1b2Duplicate error for string equality', () => {
        phenotypeRow.patchValue({ b1: 'B27', b2: 'B27' });
        expect(phenotypeRow.hasError('b1b2Duplicate')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should allow empty values without error', () => {
        phenotypeRow.patchValue({ a1: '', a2: '', b1: '', b2: '' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should be case-sensitive for comparison', () => {
        phenotypeRow.patchValue({ a1: 'A', a2: 'a' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should allow null values without error', () => {
        phenotypeRow.patchValue({ a1: null, a2: null, b1: null, b2: null });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should allow undefined values without error', () => {
        phenotypeRow.patchValue({ a1: undefined, a2: undefined, b1: undefined, b2: undefined });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should handle whitespace-only values as valid (different from empty)', () => {
        phenotypeRow.patchValue({ a1: ' ', a2: ' ', b1: ' ', b2: ' ' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
        expect(phenotypeRow.hasError('b1b2Duplicate')).toBe(true);
      });

      it('should not error when only A1 is filled', () => {
        phenotypeRow.patchValue({ a1: '10', a2: null });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should not error when only A2 is filled', () => {
        phenotypeRow.patchValue({ a1: null, a2: '10' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should not error when only B1 is filled', () => {
        phenotypeRow.patchValue({ b1: '27', b2: null });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should not error when only B2 is filled', () => {
        phenotypeRow.patchValue({ b1: null, b2: '27' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should handle leading zeros correctly', () => {
        phenotypeRow.patchValue({ a1: '01', a2: '1' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('should treat "0" and "00" as different values', () => {
        phenotypeRow.patchValue({ a1: '0', a2: '00' });
        expect(phenotypeRow.errors).toBeNull();
      });
    });

    describe('Oracle Forms behavior compliance', () => {
      it('matches Oracle Forms: only blocks when equal (not when out of order)', () => {
        // Oracle Forms shows error 9200 ONLY when A1 = A2
        phenotypeRow.patchValue({ a1: '10', a2: '10' });
        expect(phenotypeRow.hasError('a1a2Duplicate')).toBe(true);
      });

      it('matches Oracle Forms: allows A1 > A2 (component auto-swaps, validator allows)', () => {
        // Oracle Forms auto-swaps if A1 > A2, so validator should not block
        phenotypeRow.patchValue({ a1: '19', a2: '10' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('matches Oracle Forms: allows B1 > B2 (component auto-swaps, validator allows)', () => {
        // Oracle Forms auto-swaps if B1 > B2, so validator should not block
        phenotypeRow.patchValue({ b1: '35', b2: '27' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('matches Oracle Forms: allows when A1 < A2 (correct order)', () => {
        phenotypeRow.patchValue({ a1: '10', a2: '19' });
        expect(phenotypeRow.errors).toBeNull();
      });

      it('matches Oracle Forms: allows when B1 < B2 (correct order)', () => {
        phenotypeRow.patchValue({ b1: '27', b2: '35' });
        expect(phenotypeRow.errors).toBeNull();
      });
    });
  });
});
