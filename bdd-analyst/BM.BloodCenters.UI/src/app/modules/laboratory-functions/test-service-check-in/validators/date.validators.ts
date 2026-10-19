import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function collectionDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const date = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  // Future date check
  if (date > today) {
    return { futureDate: { message: 'Collection date cannot be in the future (Error 0055)' } };
  }

  // Too old check (>9 days)
  const nineDaysAgo = new Date(today);
  nineDaysAgo.setDate(today.getDate() - 9);

  if (date < nineDaysAgo) {
    return { tooOld: { message: 'Collection date cannot be more than 9 days old (Error 7020)' } };
  }

  return null;
}

export function receivedDateValidator(collDateField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const receivedDateControl = group.get('receivedDate');
    const collectionDateControl = group.get(collDateField);

    if (!receivedDateControl?.value) return null;

    const rcvd = new Date(receivedDateControl.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    rcvd.setHours(0, 0, 0, 0);

    // Future date check
    if (rcvd > today) {
      return { receivedFuture: { message: 'Received date cannot be in the future (Error 5221)' } };
    }

    // Check if received date is before collection date
    if (collectionDateControl?.value) {
      const coll = new Date(collectionDateControl.value);
      coll.setHours(0, 0, 0, 0);

      if (rcvd < coll) {
        return { receivedBeforeColl: { message: 'Received date cannot be before collection date (Error 1171)' } };
      }
    }

    return null;
  };
}
