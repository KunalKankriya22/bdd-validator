import { Directive, ElementRef, HostListener, OnInit, OnDestroy, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Adds °C suffix to temperature input fields - always visible
 * Displays value with °C in both focused and unfocused states
 * Stores only the numeric value in form control
 *
 * Usage: <input type="text" formControlName="temperature" appTemperatureSuffix />
 */
@Directive({
  selector: 'input[appTemperatureSuffix]',
  standalone: true
})
export class TemperatureSuffixDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private isUpdating = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl
  ) {}

  ngOnInit(): void {
    // Format initial value
    setTimeout(() => this.formatDisplay(), 0);

    // Listen to form control value changes
    if (this.ngControl?.control) {
      this.ngControl.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (!this.isUpdating) {
            this.formatDisplay();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove all non-numeric characters except minus and decimal point
    let numericOnly = value.replace(/[^\d.-]/g, '');

    // Ensure only one decimal point
    const parts = numericOnly.split('.');
    if (parts.length > 2) {
      numericOnly = parts[0] + '.' + parts.slice(1).join('');
    }

    // Ensure only one minus sign at the beginning
    if (numericOnly.indexOf('-') > 0) {
      numericOnly = numericOnly.replace('-', '');
      numericOnly = '-' + numericOnly;
    }

    // Get cursor position before update
    const cursorPosition = input.selectionStart || 0;

    // Update form control with numeric value only
    this.isUpdating = true;
    if (this.ngControl) {
      if (numericOnly !== '' && numericOnly !== '-') {
        const numericValue = parseFloat(numericOnly);
        if (!isNaN(numericValue)) {
          this.ngControl.control?.setValue(numericValue, { emitEvent: false });
        }
      } else {
        this.ngControl.control?.setValue(null, { emitEvent: false });
      }
    }

    // Format display with °C
    if (numericOnly !== '' && numericOnly !== '-' && numericOnly !== '.') {
      input.value = `${numericOnly}°C`;
      // Restore cursor position (before the °C)
      const newPosition = Math.min(cursorPosition, input.value.length - 2);
      input.setSelectionRange(newPosition, newPosition);
    } else if (numericOnly === '-' || numericOnly === '.') {
      input.value = numericOnly;
      input.setSelectionRange(cursorPosition, cursorPosition);
    } else {
      input.value = '';
    }

    this.isUpdating = false;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;

    // Prevent typing after °C
    if (cursorPosition >= value.length - 2 && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const numericKeys = /[0-9.-]/;
      if (numericKeys.test(event.key)) {
        // Allow numeric input, but position cursor before °C
        setTimeout(() => {
          const newCursor = input.value.length - 2;
          input.setSelectionRange(newCursor, newCursor);
        }, 0);
      }
    }

    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow: numbers, minus, decimal point
    if (!/[0-9.-]/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;

    // If clicked after the number (on °C), move cursor before °C
    if (cursorPosition > input.value.length - 2) {
      setTimeout(() => {
        const newPosition = Math.max(0, input.value.length - 2);
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }

  private formatDisplay(): void {
    const input = this.el.nativeElement;
    const value = this.ngControl?.value;

    if (value !== null && value !== undefined && value !== '') {
      input.value = `${value}°C`;
    } else {
      input.value = '';
    }
  }
}
