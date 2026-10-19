import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive to ensure time input displays and accepts only 24-hour format (HH:mm)
 *
 * Usage:
 * <input type="text" appTime24hr formControlName="time" />
 *
 * This directive:
 * - Forces text input type to avoid browser's 12-hour format display
 * - Validates and formats input to HH:mm format (00:00 - 23:59)
 * - Allows typing with or without colon (e.g., "1630" becomes "16:30")
 * - Prevents invalid characters
 */
@Directive({
  selector: 'input[appTime24hr]',
  standalone: true
})
export class Time24hrDirective implements OnInit {

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) {}

  ngOnInit() {
    // Force input type to text to avoid browser locale issues
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.placeholder = 'HH:MM';
    this.el.nativeElement.maxLength = 5;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/[^0-9:]/g, ''); // Remove non-numeric except colon

    // Auto-format as user types
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    } else if (value.length === 3 && value[2] !== ':') {
      // User typed 3 digits without colon, insert it
      value = value.substring(0, 2) + ':' + value.substring(2);
    } else if (value.length === 4 && !value.includes(':')) {
      // User typed 4 digits (e.g., "1630"), format as HH:MM
      value = value.substring(0, 2) + ':' + value.substring(2);
    }

    // Limit to 5 characters (HH:MM)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    input.value = value;
    this.control.control?.setValue(value, { emitEvent: false });
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = this.el.nativeElement;
    let value = input.value.trim();

    if (!value) {
      return;
    }

    // Remove any non-numeric characters except colon
    value = value.replace(/[^0-9:]/g, '');

    // Handle various input formats
    let hours: string;
    let minutes: string;

    if (value.includes(':')) {
      // Format: "HH:MM" or "H:MM" or "HH:M"
      const parts = value.split(':');
      hours = parts[0].padStart(2, '0');
      minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
    } else if (value.length === 4) {
      // Format: "HHMM" (e.g., "1630")
      hours = value.substring(0, 2);
      minutes = value.substring(2, 4);
    } else if (value.length === 3) {
      // Format: "HMM" (e.g., "830" for 08:30)
      hours = value.substring(0, 1).padStart(2, '0');
      minutes = value.substring(1, 3);
    } else if (value.length === 2) {
      // Format: "HH" (e.g., "16" for 16:00)
      hours = value;
      minutes = '00';
    } else if (value.length === 1) {
      // Format: "H" (e.g., "8" for 08:00)
      hours = value.padStart(2, '0');
      minutes = '00';
    } else {
      // Invalid format
      input.value = '';
      this.control.control?.setValue('', { emitEvent: false });
      this.control.control?.setErrors({ invalidTime: true });
      return;
    }

    // Validate hours and minutes
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    if (hoursNum < 0 || hoursNum > 23) {
      input.value = '';
      this.control.control?.setValue('', { emitEvent: false });
      this.control.control?.setErrors({ invalidTime: true });
      return;
    }

    if (minutesNum < 0 || minutesNum > 59) {
      input.value = '';
      this.control.control?.setValue('', { emitEvent: false });
      this.control.control?.setErrors({ invalidTime: true });
      return;
    }

    // Format as HH:MM
    const formattedValue = `${hours}:${minutes}`;
    input.value = formattedValue;
    this.control.control?.setValue(formattedValue);

    // Clear any previous errors
    if (this.control.control?.hasError('invalidTime')) {
      const errors = { ...this.control.control.errors };
      delete errors['invalidTime'];
      this.control.control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right
      (event.keyCode >= 35 && event.keyCode <= 39)) {
      return;
    }

    // Ensure that it is a number or colon and stop the keypress
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) &&
      (event.keyCode < 96 || event.keyCode > 105) &&
      event.keyCode !== 186 && event.keyCode !== 59) { // Colon key codes
      event.preventDefault();
    }
  }
}
