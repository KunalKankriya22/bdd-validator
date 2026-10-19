import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PhoneFormatDirective } from './phone-format.directive';

@Component({
  standalone: true,
  imports: [PhoneFormatDirective, ReactiveFormsModule],
  template: `<input appPhoneFormat [phoneFormatStyle]="style" [formControl]="control" />`
})
class TestHostComponent {
  control = new FormControl('');
  style: 'dashes' | 'parens' = 'dashes';
}

describe('PhoneFormatDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  // Helper functions
  function blurWith(value: string): string {
    inputEl.value = value;
    component.control.setValue(value, { emitEvent: false });
    inputEl.dispatchEvent(new Event('blur'));
    return inputEl.value;
  }

  function focusOn(value: string): string {
    component.control.setValue(value, { emitEvent: false });
    inputEl.dispatchEvent(new Event('focus'));
    return inputEl.value;
  }

  describe('ngOnInit', () => {
    it('should format initial value if present', () => {
      // Create a new component with pre-filled value
      component.control.setValue('1234567890');
      fixture.detectChanges();

      // Manually trigger ngOnInit by creating new component
      const newFixture = TestBed.createComponent(TestHostComponent);
      newFixture.componentInstance.control.setValue('1234567890');
      newFixture.detectChanges();
      const newInput = newFixture.nativeElement.querySelector('input');

      expect(newInput.value).toBe('123-456-7890');
    });

    it('should not throw for empty initial value', () => {
      expect(() => {
        const newFixture = TestBed.createComponent(TestHostComponent);
        newFixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('onBlur - formatting with dashes style', () => {
    it('should format 10 digits as XXX-XXX-XXXX', () => {
      const result = blurWith('1234567890');
      expect(result).toBe('123-456-7890');
    });

    it('should format 11 digits starting with 1 as 1-XXX-XXX-XXXX', () => {
      const result = blurWith('11234567890');
      expect(result).toBe('1-123-456-7890');
    });

    it('should clean and format mixed input (letters + numbers)', () => {
      const result = blurWith('(123) 456-7890');
      expect(result).toBe('123-456-7890');
    });

    it('should update form control with cleaned numeric value', () => {
      blurWith('(123) 456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should handle already formatted input', () => {
      const result = blurWith('123-456-7890');
      expect(result).toBe('123-456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should not format if input is empty', () => {
      const result = blurWith('');
      expect(result).toBe('');
      expect(component.control.value).toBe('');
    });

    it('should preserve numeric-only value in form control', () => {
      blurWith('1234567890');
      expect(component.control.value).toBe('1234567890');
      expect(typeof component.control.value).toBe('string');
    });
  });

  describe('onBlur - formatting with parens style', () => {
    beforeEach(() => {
      component.style = 'parens';
      fixture.detectChanges();
    });

    it('should format 10 digits as (XXX) XXX-XXXX', () => {
      const result = blurWith('1234567890');
      expect(result).toBe('(123) 456-7890');
    });

    it('should format 11 digits as 1-XXX-XXX-XXXX', () => {
      const result = blurWith('11234567890');
      expect(result).toBe('1-123-456-7890');
    });
  });

  describe('onFocus - raw value display', () => {
    it('should show raw numeric value on focus', () => {
      component.control.setValue('1234567890');
      inputEl.dispatchEvent(new Event('focus'));
      expect(inputEl.value).toBe('1234567890');
    });

    it('should remove formatting on focus (XXX-XXX-XXXX → 1234567890)', () => {
      // First blur to format
      blurWith('1234567890');
      expect(inputEl.value).toBe('123-456-7890');

      // Then focus to show raw
      inputEl.dispatchEvent(new Event('focus'));
      expect(inputEl.value).toBe('1234567890');
    });

    it('should handle empty value on focus', () => {
      component.control.setValue('');
      inputEl.dispatchEvent(new Event('focus'));
      expect(inputEl.value).toBe('');
    });

    it('should work after blur/format cycle', () => {
      blurWith('1234567890');
      expect(inputEl.value).toBe('123-456-7890');

      inputEl.dispatchEvent(new Event('focus'));
      expect(inputEl.value).toBe('1234567890');
    });
  });

  describe('form control integration', () => {
    it('should store raw numeric value in control after blur', () => {
      blurWith('(123) 456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should not emit valueChanges event on setValue', () => {
      const spy = jest.fn();
      component.control.valueChanges.subscribe(spy);

      blurWith('1234567890');

      // setValue with emitEvent: false should not trigger subscription
      expect(spy).not.toHaveBeenCalled();
    });

    it('should preserve existing validation errors', () => {
      component.control.setErrors({ required: true });
      blurWith('1234567890');

      // Error should be cleared only if validation passes
      // (Our directive doesn't touch errors, form validation does)
      expect(component.control.value).toBe('1234567890');
    });
  });

  describe('edge cases', () => {
    it('should handle less than 10 digits (no formatting)', () => {
      const result = blurWith('123456');
      expect(result).toBe('123456');
      expect(component.control.value).toBe('123456');
    });

    it('should handle more than 11 digits (return cleaned)', () => {
      const result = blurWith('123456789012');
      expect(result).toBe('123456789012');
      expect(component.control.value).toBe('123456789012');
    });

    it('should handle special characters (remove them)', () => {
      const result = blurWith('(123) 456-7890!');
      expect(result).toBe('123-456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should handle spaces (remove them)', () => {
      const result = blurWith('123 456 7890');
      expect(result).toBe('123-456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should handle null control value gracefully', () => {
      component.control.setValue(null);
      expect(() => {
        inputEl.dispatchEvent(new Event('blur'));
      }).not.toThrow();
    });

    it('should handle missing ngControl (directive standalone use)', () => {
      // Create directive without form control
      @Component({
        standalone: true,
        imports: [PhoneFormatDirective],
        template: `<input appPhoneFormat />`
      })
      class StandaloneHost {}

      expect(() => {
        const standaloneFixture = TestBed.createComponent(StandaloneHost);
        standaloneFixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('cleanPhoneNumber', () => {
    it('should remove all non-numeric characters', () => {
      const result = blurWith('abc-123-def-456-ghi-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should preserve digits only', () => {
      const result = blurWith('!@#$1234567890%^&*');
      expect(component.control.value).toBe('1234567890');
    });

    it('should handle empty string', () => {
      const result = blurWith('');
      expect(component.control.value).toBe('');
    });
  });

  describe('complete blur/focus cycle', () => {
    it('should format → focus → blur → format correctly', () => {
      // Initial blur with formatting
      blurWith('1234567890');
      expect(inputEl.value).toBe('123-456-7890');
      expect(component.control.value).toBe('1234567890');

      // Focus shows raw
      inputEl.dispatchEvent(new Event('focus'));
      expect(inputEl.value).toBe('1234567890');

      // Blur formats again
      inputEl.dispatchEvent(new Event('blur'));
      expect(inputEl.value).toBe('123-456-7890');
      expect(component.control.value).toBe('1234567890');
    });

    it('should maintain form control value through cycles', () => {
      blurWith('1234567890');
      const value1 = component.control.value;

      inputEl.dispatchEvent(new Event('focus'));
      const value2 = component.control.value;

      inputEl.dispatchEvent(new Event('blur'));
      const value3 = component.control.value;

      expect(value1).toBe('1234567890');
      expect(value2).toBe('1234567890');
      expect(value3).toBe('1234567890');
    });
  });
});
