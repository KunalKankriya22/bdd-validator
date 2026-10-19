import { FormControl, FormGroup } from '@angular/forms';
import {
  collectionDateValidator,
  receivedDateValidator,
} from './date.validators';

// =============================================================================
// collectionDateValidator
// =============================================================================

describe('collectionDateValidator', () => {
  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(collectionDateValidator(control)).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(collectionDateValidator(control)).toBeNull();
  });

  it('should return null for undefined', () => {
    const control = new FormControl(undefined);
    expect(collectionDateValidator(control)).toBeNull();
  });

  it('should return futureDate error for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const control = new FormControl(tomorrow.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toEqual({
      futureDate: { message: 'Collection date cannot be in the future (Error 0055)' },
    });
  });

  it('should return futureDate error for date far in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const control = new FormControl(futureDate.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toEqual({
      futureDate: { message: 'Collection date cannot be in the future (Error 0055)' },
    });
  });

  it('should return null for today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const control = new FormControl(today.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toBeNull();
  });

  it('should return null for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const control = new FormControl(yesterday.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toBeNull();
  });

  it('should return null for 9 days ago (boundary)', () => {
    const nineDaysAgo = new Date();
    nineDaysAgo.setDate(nineDaysAgo.getDate() - 9);
    nineDaysAgo.setHours(12, 0, 0, 0);
    const control = new FormControl(nineDaysAgo.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toBeNull();
  });

  it('should return tooOld error for 10 days ago', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const control = new FormControl(tenDaysAgo.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toEqual({
      tooOld: { message: 'Collection date cannot be more than 9 days old (Error 7020)' },
    });
  });

  it('should return tooOld error for date far in the past', () => {
    const farPast = new Date('2020-01-01');
    const control = new FormControl(farPast.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toEqual({
      tooOld: { message: 'Collection date cannot be more than 9 days old (Error 7020)' },
    });
  });

  it('should return null for 1 day ago', () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const control = new FormControl(oneDayAgo.toISOString());
    const result = collectionDateValidator(control);
    expect(result).toBeNull();
  });

  it('should check future date before too-old check', () => {
    // A future date should return futureDate, not tooOld
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const control = new FormControl(futureDate.toISOString());
    const result = collectionDateValidator(control);
    expect(result!['futureDate']).toBeDefined();
    expect(result!['tooOld']).toBeUndefined();
  });
});

// =============================================================================
// receivedDateValidator
// =============================================================================

describe('receivedDateValidator', () => {
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup(
      {
        receivedDate: new FormControl(null),
        collectionDate: new FormControl(null),
      },
      { validators: receivedDateValidator('collectionDate') }
    );
  });

  it('should return null when receivedDate is null', () => {
    formGroup.get('receivedDate')!.setValue(null);
    formGroup.get('collectionDate')!.setValue('2026-06-01');
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when receivedDate is empty string', () => {
    formGroup.get('receivedDate')!.setValue('');
    expect(formGroup.errors).toBeNull();
  });

  it('should return receivedFuture error when received date is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    formGroup.get('receivedDate')!.setValue(tomorrow.toISOString());
    expect(formGroup.hasError('receivedFuture')).toBe(true);
    expect(formGroup.getError('receivedFuture')).toEqual({
      message: 'Received date cannot be in the future (Error 5221)',
    });
  });

  it('should return receivedFuture error for date far in the future', () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 1);
    formGroup.get('receivedDate')!.setValue(farFuture.toISOString());
    expect(formGroup.hasError('receivedFuture')).toBe(true);
  });

  it('should return null when received date is today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    formGroup.get('receivedDate')!.setValue(today.toISOString());
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when received date is in the past and no collection date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    formGroup.get('receivedDate')!.setValue(yesterday.toISOString());
    formGroup.get('collectionDate')!.setValue(null);
    expect(formGroup.errors).toBeNull();
  });

  it('should return receivedBeforeColl error when received date is before collection date', () => {
    const collDate = new Date();
    const rcvdDate = new Date();
    rcvdDate.setDate(rcvdDate.getDate() - 1);
    formGroup.get('collectionDate')!.setValue(collDate.toISOString());
    formGroup.get('receivedDate')!.setValue(rcvdDate.toISOString());
    expect(formGroup.hasError('receivedBeforeColl')).toBe(true);
    expect(formGroup.getError('receivedBeforeColl')).toEqual({
      message: 'Received date cannot be before collection date (Error 1171)',
    });
  });

  it('should return null when received date equals collection date', () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    formGroup.get('collectionDate')!.setValue(date.toISOString());
    formGroup.get('receivedDate')!.setValue(date.toISOString());
    expect(formGroup.errors).toBeNull();
  });

  it('should return null when received date is after collection date', () => {
    const collDate = new Date();
    collDate.setDate(collDate.getDate() - 2);
    const rcvdDate = new Date();
    rcvdDate.setDate(rcvdDate.getDate() - 1);
    formGroup.get('collectionDate')!.setValue(collDate.toISOString());
    formGroup.get('receivedDate')!.setValue(rcvdDate.toISOString());
    expect(formGroup.errors).toBeNull();
  });

  it('should check future date before collection date comparison', () => {
    // If received is in the future, should return receivedFuture regardless of collection date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const collDate = new Date();
    formGroup.get('collectionDate')!.setValue(collDate.toISOString());
    formGroup.get('receivedDate')!.setValue(tomorrow.toISOString());
    expect(formGroup.hasError('receivedFuture')).toBe(true);
    expect(formGroup.hasError('receivedBeforeColl')).toBe(false);
  });

  it('should work with custom collection date field name', () => {
    const fg = new FormGroup(
      {
        receivedDate: new FormControl(null),
        collDate: new FormControl(null),
      },
      { validators: receivedDateValidator('collDate') }
    );

    const collDate = new Date();
    const rcvdDate = new Date();
    rcvdDate.setDate(rcvdDate.getDate() - 1);
    fg.get('collDate')!.setValue(collDate.toISOString());
    fg.get('receivedDate')!.setValue(rcvdDate.toISOString());
    expect(fg.hasError('receivedBeforeColl')).toBe(true);
  });

  it('should return null when collection date control does not exist', () => {
    const fg = new FormGroup(
      {
        receivedDate: new FormControl(null),
      },
      { validators: receivedDateValidator('nonExistentField') }
    );
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    fg.get('receivedDate')!.setValue(yesterday.toISOString());
    // receivedDate is in the past, not future -> proceeds to check collectionDateControl
    // collectionDateControl is null (get returns null), so collectionDateControl?.value is undefined/falsy
    // -> skips the comparison, returns null
    expect(fg.errors).toBeNull();
  });
});
