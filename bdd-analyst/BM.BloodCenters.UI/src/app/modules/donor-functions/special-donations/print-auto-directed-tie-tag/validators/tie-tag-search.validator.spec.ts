import { FormGroup, FormControl } from '@angular/forms';
import { atLeastOneFieldValidator } from './tie-tag-search.validator';

describe('atLeastOneFieldValidator', () => {
  let formGroup: FormGroup;
  const validator = atLeastOneFieldValidator();

  beforeEach(() => {
    formGroup = new FormGroup({
      patientId: new FormControl(null),
      lastName: new FormControl(null),
      firstName: new FormControl(null),
      dateOfBirth: new FormControl(null),
      surgeryId: new FormControl(null),
      surgeryDate: new FormControl(null),
    });
  });

  it('should return null (valid) when patientId has value', () => {
    formGroup.get('patientId')!.setValue('P001');
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null (valid) when lastName has value', () => {
    formGroup.get('lastName')!.setValue('Smith');
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null (valid) when firstName has value', () => {
    formGroup.get('firstName')!.setValue('John');
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null (valid) when surgeryId has value', () => {
    formGroup.get('surgeryId')!.setValue('S100');
    expect(validator(formGroup)).toBeNull();
  });

  it('should return error when all fields are empty', () => {
    formGroup.get('patientId')!.setValue('');
    formGroup.get('lastName')!.setValue('');
    formGroup.get('firstName')!.setValue('');
    formGroup.get('dateOfBirth')!.setValue(null);
    formGroup.get('surgeryId')!.setValue('');
    formGroup.get('surgeryDate')!.setValue(null);
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should return error when all fields are null', () => {
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should return error when string fields are whitespace only', () => {
    formGroup.get('patientId')!.setValue('   ');
    formGroup.get('lastName')!.setValue('  ');
    formGroup.get('firstName')!.setValue(' ');
    formGroup.get('surgeryId')!.setValue('    ');
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should return null when multiple fields have values', () => {
    formGroup.get('patientId')!.setValue('P001');
    formGroup.get('lastName')!.setValue('Smith');
    formGroup.get('dateOfBirth')!.setValue('1990-01-01');
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null when only one field among many has value', () => {
    formGroup.get('patientId')!.setValue('');
    formGroup.get('lastName')!.setValue('');
    formGroup.get('firstName')!.setValue('');
    formGroup.get('dateOfBirth')!.setValue(null);
    formGroup.get('surgeryId')!.setValue('S100');
    formGroup.get('surgeryDate')!.setValue(null);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null for null formGroup', () => {
    expect(validator(null as any)).toBeNull();
  });
});
