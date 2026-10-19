import { Directive, Input } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

/**
 * Base class for password configuration child components
 * Eliminates duplicate code for form control access and validation error checking
 */
@Directive()
export abstract class BasePasswordChildComponent {
  @Input() formGroupName!: string;
  @Input() parentForm!: FormGroup;
  @Input() isStrongPasswordEnabled = false;

  constructor(protected cc: ControlContainer) {}

  /**
   * Get the form group for this component
   * When using formGroupName directive, cc.control already points to the correct form group
   */
  get group(): FormGroup {
    return this.cc.control as FormGroup;
  }

  /**
   * Helper method to check if a form field has a specific error
   * Used in template to display error messages
   * Returns true only if field is dirty or touched AND has the specified error
   */
  getFieldError(fieldName: string, errorType: string): boolean {
    const field = this.group.get(fieldName);
    return field ? field.hasError(errorType) && (field.dirty || field.touched) : false;
  }

  /**
   * Check if a cross-field validator error exists on the parent form
   */
  protected checkParentError(errorName: string): boolean {
    return this.parentForm ? this.parentForm.hasError(errorName) : false;
  }
}
