import { Directive, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Phone Formatting Directive
 *
 * Formats phone number display while keeping raw numeric value in form control.
 * Oracle Forms: POST-TEXT-ITEM trigger formats contact_phone_dummy as XXX-XXX-XXXX
 *
 * Usage:
 * ```html
 * <input matInput formControlName="phone" appPhoneFormat />
 * ```
 *
 * Behavior:
 * - On blur: formats display as XXX-XXX-XXXX (10 digits) or (XXX) XXX-XXXX
 * - On focus: shows raw numeric value for editing
 * - Form control value: always stores raw numeric string (e.g., "1234567890")
 */
@Directive({
  selector: '[appPhoneFormat]',
  standalone: true
})
export class PhoneFormatDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  /**
   * Display format: 'dashes' (XXX-XXX-XXXX) or 'parens' ((XXX) XXX-XXXX)
   * Oracle Forms uses dashes: XXX-XXX-XXXX
   */
  @Input() phoneFormatStyle: 'dashes' | 'parens' = 'dashes';

  ngOnInit(): void {
    // Format initial value if present
    if (this.ngControl?.control?.value) {
      this.formatDisplay();
    }
  }

  @HostListener('focus')
  onFocus(): void {
    // On focus: show raw numeric value for easy editing
    const value = this.ngControl?.control?.value;
    if (value) {
      const cleaned = this.cleanPhoneNumber(value);
      this.el.nativeElement.value = cleaned;
    }
  }

  @HostListener('blur')
  onBlur(): void {
    // On blur: clean the input, update form control, and format display
    const inputValue = this.el.nativeElement.value;
    if (!inputValue) return;

    const cleaned = this.cleanPhoneNumber(inputValue);

    // Update form control with clean numeric value
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(cleaned, { emitEvent: false });
    }

    // Format display
    this.formatDisplay();
  }

  private formatDisplay(): void {
    const value = this.ngControl?.control?.value;
    if (!value) return;

    const cleaned = this.cleanPhoneNumber(value);
    const formatted = this.formatPhoneNumber(cleaned);
    this.el.nativeElement.value = formatted;
  }

  private cleanPhoneNumber(value: string): string {
    // Remove all non-numeric characters
    return value.replace(/\D/g, '');
  }

  private formatPhoneNumber(cleaned: string): string {
    if (cleaned.length === 10) {
      // Oracle Forms: XXX-XXX-XXXX
      if (this.phoneFormatStyle === 'dashes') {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
      }
      // Alternative: (XXX) XXX-XXXX
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US phone with country code: 1-XXX-XXX-XXXX
      return `1-${cleaned.substring(1, 4)}-${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }

    // Return cleaned value for other lengths
    return cleaned;
  }
}
