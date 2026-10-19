import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment';

export function expiryAfterReceivedValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const receivedCtrl = group.get('receivedDate');
    const expiryCtrl = group.get('expiryDate');
    const receivedDate = receivedCtrl?.value;
    const expiryDate = expiryCtrl?.value;

    if (!receivedDate || !expiryDate) {
      expiryCtrl?.setErrors(expiryCtrl.errors ? removeKey(expiryCtrl.errors, 'expiryBeforeReceived') : null);
      return null;
    }

    const received = moment.isMoment(receivedDate)
      ? receivedDate
      : moment(receivedDate, 'DD-MMM-YYYY HH:mm', true);
    const expiry = typeof expiryDate === 'string'
      ? moment(expiryDate.replace(',', ''), 'DD-MMM-YYYY HH:mm', true)
      : moment(expiryDate);

    if (!received.isValid() || !expiry.isValid()) {
      expiryCtrl?.setErrors(expiryCtrl.errors ? removeKey(expiryCtrl.errors, 'expiryBeforeReceived') : null);
      return null;
    }

    if (expiry.isBefore(received, 'minute')) {
      expiryCtrl?.setErrors({ ...(expiryCtrl.errors || {}), expiryBeforeReceived: true });
      return { expiryBeforeReceived: true };
    }

    expiryCtrl?.setErrors(expiryCtrl.errors ? removeKey(expiryCtrl.errors, 'expiryBeforeReceived') : null);
    return null;
  };
}

function removeKey(errors: ValidationErrors, key: string): ValidationErrors | null {
  const { [key]: _, ...rest } = errors;
  return Object.keys(rest).length ? rest : null;
}
