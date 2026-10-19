import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm } from '@angular/forms';

/**
 * Shows Material error state when the control is invalid, or when the parent
 * FormGroup has a given error key and this control is touched/dirty.
 */
export class FormGroupChildErrorStateMatcher implements ErrorStateMatcher {
  constructor(
    private getFormGroup: () => FormGroup,
    private groupErrorKey: string,
  ) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) {
      return false;
    }
    const fg = this.getFormGroup();
    const touchedOrDirty = control.touched || control.dirty;
    const invalid = control.invalid && touchedOrDirty;
    const groupError = !!fg?.hasError(this.groupErrorKey) && touchedOrDirty;
    return !!(invalid || groupError);
  }
}
