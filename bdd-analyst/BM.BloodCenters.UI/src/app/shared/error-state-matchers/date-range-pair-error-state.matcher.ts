import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm } from '@angular/forms';

/**
 * Shows Material error state when the control is invalid, or when the parent
 * FormGroup has `dateRangeInvalid` and this control is touched/dirty.
 */
export class DateRangePairErrorStateMatcher implements ErrorStateMatcher {
  constructor(
    private getFormGroup: () => FormGroup,
    private isRangeErrorOwner?: () => boolean
  ) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) {
      return false;
    }
    const fg = this.getFormGroup();
    const touchedOrDirty = control.touched || control.dirty;
    const invalid = control.invalid && touchedOrDirty;
    const hasRangeError = !!fg?.hasError('dateRangeInvalid') && touchedOrDirty;
    const rangeError = hasRangeError && (this.isRangeErrorOwner ? this.isRangeErrorOwner() : true);
    return !!(invalid || rangeError);
  }
}
