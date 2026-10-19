import { Directive, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercaseInput]',
  standalone: true
})
export class UppercaseInputDirective {
  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      const start = (input as HTMLInputElement).selectionStart;
      const end = (input as HTMLInputElement).selectionEnd;
      input.value = upper;
      (input as HTMLInputElement).setSelectionRange?.(start, end);
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(upper, { emitEvent: false });
      }
    }
  }
}
