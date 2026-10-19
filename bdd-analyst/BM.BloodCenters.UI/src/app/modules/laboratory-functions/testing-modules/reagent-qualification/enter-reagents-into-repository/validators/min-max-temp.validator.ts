import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minMaxTempValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const minCtrl = group.get('minTemp');
    const maxCtrl = group.get('maxTemp');
    const minTemp = minCtrl?.value;
    const maxTemp = maxCtrl?.value;

    if (minTemp == null || maxTemp == null || minTemp === '' || maxTemp === '') {
      minCtrl?.setErrors(minCtrl.errors ? removeKey(minCtrl.errors, 'tempRangeInvalid') : null);
      maxCtrl?.setErrors(maxCtrl.errors ? removeKey(maxCtrl.errors, 'tempRangeInvalid') : null);
      return null;
    }

    const minNum = Number(minTemp);
    const maxNum = Number(maxTemp);

    if (isNaN(minNum) || isNaN(maxNum)) return null;

    if (minNum > maxNum) {
      minCtrl?.setErrors({ ...(minCtrl.errors || {}), tempRangeInvalid: true });
      maxCtrl?.setErrors({ ...(maxCtrl.errors || {}), tempRangeInvalid: true });
      return { minTempGreaterThanMax: true };
    }

    minCtrl?.setErrors(minCtrl.errors ? removeKey(minCtrl.errors, 'tempRangeInvalid') : null);
    maxCtrl?.setErrors(maxCtrl.errors ? removeKey(maxCtrl.errors, 'tempRangeInvalid') : null);
    return null;
  };
}

function removeKey(errors: ValidationErrors, key: string): ValidationErrors | null {
  const { [key]: _, ...rest } = errors;
  return Object.keys(rest).length ? rest : null;
}
