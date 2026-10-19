import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Time24hrDirective } from './time-24hr.directive';

@Component({
  standalone: true,
  imports: [Time24hrDirective, ReactiveFormsModule],
  template: `<input appTime24hr [formControl]="control" />`,
})
class TestHostComponent {
  control = new FormControl('');
}

describe('Time24hrDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  describe('ngOnInit', () => {
    it('should set input type to text', () => {
      expect(inputEl.type).toBe('text');
    });

    it('should set placeholder to HH:MM', () => {
      expect(inputEl.placeholder).toBe('HH:MM');
    });

    it('should set maxLength to 5', () => {
      expect(inputEl.maxLength).toBe(5);
    });
  });

  describe('onInput - auto-format', () => {
    function simulateInput(value: string): void {
      inputEl.value = value;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    it('should auto-insert colon after 2 digits when no colon present', () => {
      simulateInput('14');
      expect(inputEl.value).toBe('14:');
    });

    it('should NOT auto-insert colon when 2 chars include a colon', () => {
      simulateInput('1:');
      expect(inputEl.value).toBe('1:');
    });

    it('should insert colon for 3 digits when third char is not colon', () => {
      simulateInput('143');
      expect(inputEl.value).toBe('14:3');
    });

    it('should NOT insert colon for 3 chars when third char IS a colon', () => {
      simulateInput('14:');
      expect(inputEl.value).toBe('14:');
    });

    it('should format 4 digits without colon as HH:MM', () => {
      simulateInput('1630');
      expect(inputEl.value).toBe('16:30');
    });

    it('should NOT reformat 4 chars that already include a colon', () => {
      simulateInput('1:30');
      expect(inputEl.value).toBe('1:30');
    });

    it('should strip non-numeric and non-colon characters', () => {
      simulateInput('12:3a');
      expect(inputEl.value).toBe('12:3');
    });

    it('should strip all alphabetic characters leaving only digits and colons', () => {
      simulateInput('ab1c2');
      expect(inputEl.value).toBe('12:');
    });

    it('should truncate value to 5 characters when longer', () => {
      simulateInput('12:345');
      expect(inputEl.value).toBe('12:34');
    });

    it('should allow valid 5-character input without truncation', () => {
      simulateInput('12:34');
      expect(inputEl.value).toBe('12:34');
    });

    it('should handle single digit input without modification', () => {
      simulateInput('1');
      expect(inputEl.value).toBe('1');
    });

    it('should handle empty input', () => {
      simulateInput('');
      expect(inputEl.value).toBe('');
    });

    it('should update the form control value', () => {
      simulateInput('14:30');
      expect(component.control.value).toBe('14:30');
    });

    it('should update form control when auto-formatting inserts colon', () => {
      simulateInput('14');
      expect(component.control.value).toBe('14:');
    });

    it('should handle value with only colon', () => {
      simulateInput(':');
      expect(inputEl.value).toBe(':');
    });

    it('should truncate 6-char numeric+colon input to 5', () => {
      simulateInput('123:56');
      expect(inputEl.value).toBe('123:5');
    });
  });

  describe('onBlur - formatting and validation', () => {
    function blurWith(value: string): string {
      inputEl.value = value;
      component.control.setValue(value, { emitEvent: false });
      inputEl.dispatchEvent(new Event('blur'));
      return inputEl.value;
    }

    describe('empty and whitespace values', () => {
      it('should do nothing for empty value', () => {
        const result = blurWith('');
        expect(result).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(false);
      });

      it('should return early for whitespace-only value without modifying input', () => {
        blurWith('   ');
        // trim() produces empty string, early return fires — input.value is NOT cleared by the directive
        expect(inputEl.value).toBe('   ');
        expect(component.control.hasError('invalidTime')).toBe(false);
      });
    });

    describe('colon-separated format (HH:MM, H:MM, HH:M, HH:)', () => {
      it('should pass through valid HH:MM', () => {
        expect(blurWith('14:30')).toBe('14:30');
      });

      it('should pad single-digit hour H:MM to HH:MM', () => {
        expect(blurWith('8:30')).toBe('08:30');
      });

      it('should pad single-digit minute HH:M to HH:0M', () => {
        expect(blurWith('14:3')).toBe('14:03');
      });

      it('should default missing minutes to 00 for HH:', () => {
        expect(blurWith('14:')).toBe('14:00');
      });

      it('should pad both single-digit hour and minute H:M', () => {
        expect(blurWith('8:3')).toBe('08:03');
      });
    });

    describe('digits-only formats', () => {
      it('should format HHMM (4 digits) to HH:MM', () => {
        expect(blurWith('1630')).toBe('16:30');
      });

      it('should format HMM (3 digits) to 0H:MM', () => {
        expect(blurWith('830')).toBe('08:30');
      });

      it('should format HH (2 digits) to HH:00', () => {
        expect(blurWith('16')).toBe('16:00');
      });

      it('should format H (1 digit) to 0H:00', () => {
        expect(blurWith('8')).toBe('08:00');
      });

      it('should format single digit 0 to 00:00', () => {
        expect(blurWith('0')).toBe('00:00');
      });
    });

    describe('invalid format (else branch)', () => {
      it('should clear and set error for value that strips to empty (all non-numeric)', () => {
        const result = blurWith('abc');
        expect(result).toBe('');
        expect(component.control.value).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });

      it('should clear and set error for 5+ digits without colon', () => {
        // Bypass maxLength by setting value directly
        inputEl.maxLength = 10;
        const result = blurWith('12345');
        expect(result).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
        inputEl.maxLength = 5;
      });
    });

    describe('stripping non-numeric characters on blur', () => {
      it('should strip letters and then format the remaining digits', () => {
        expect(blurWith('1a4:3b0')).toBe('14:30');
      });
    });

    describe('boundary validation - hours', () => {
      it('should accept hour 00', () => {
        expect(blurWith('00:00')).toBe('00:00');
      });

      it('should accept hour 23', () => {
        expect(blurWith('23:59')).toBe('23:59');
      });

      it('should reject hour 24', () => {
        expect(blurWith('24:00')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });

      it('should reject hour 25', () => {
        expect(blurWith('25:00')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });

      it('should reject hour 99', () => {
        expect(blurWith('99:00')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });
    });

    describe('boundary validation - minutes', () => {
      it('should accept minute 00', () => {
        expect(blurWith('12:00')).toBe('12:00');
      });

      it('should accept minute 59', () => {
        expect(blurWith('12:59')).toBe('12:59');
      });

      it('should reject minute 60', () => {
        expect(blurWith('12:60')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });

      it('should reject minute 65', () => {
        expect(blurWith('12:65')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });

      it('should reject minute 99', () => {
        expect(blurWith('12:99')).toBe('');
        expect(component.control.hasError('invalidTime')).toBe(true);
      });
    });

    describe('error clearing on valid blur', () => {
      it('should clear invalidTime error when a valid time follows an invalid one', () => {
        blurWith('25:00');
        expect(component.control.hasError('invalidTime')).toBe(true);

        blurWith('14:30');
        expect(component.control.hasError('invalidTime')).toBe(false);
      });

      it('should preserve other errors when clearing invalidTime', () => {
        // Use a custom validator that always returns both invalidTime and customError
        // so that after setValue runs validators, both errors are present
        component.control.setValidators(() => ({ invalidTime: true, customError: true }));

        // Blur with valid time — setValue triggers validators producing both errors,
        // then the directive clears invalidTime but keeps customError
        blurWith('14:30');
        expect(component.control.hasError('invalidTime')).toBe(false);
        expect(component.control.hasError('customError')).toBe(true);
      });

      it('should set errors to null when invalidTime is the only error being cleared', () => {
        // Use a custom validator that only returns invalidTime
        component.control.setValidators(() => ({ invalidTime: true }));

        // Blur with valid time — setValue triggers validator producing { invalidTime },
        // then the directive clears invalidTime and sets errors to null (empty object)
        blurWith('14:30');
        expect(component.control.errors).toBeNull();
      });

      it('should not attempt to clear errors when no invalidTime error exists', () => {
        // Blur with a valid time from the start (no prior invalidTime error)
        blurWith('14:30');
        expect(component.control.errors).toBeNull();
      });
    });

    describe('form control value updates on blur', () => {
      it('should update form control with formatted valid time', () => {
        blurWith('830');
        expect(component.control.value).toBe('08:30');
      });

      it('should set form control to empty string on invalid hours', () => {
        blurWith('25:00');
        expect(component.control.value).toBe('');
      });

      it('should set form control to empty string on invalid minutes', () => {
        blurWith('12:65');
        expect(component.control.value).toBe('');
      });

      it('should set form control to empty string on invalid format', () => {
        blurWith('abc');
        expect(component.control.value).toBe('');
      });
    });
  });

  describe('onKeyDown - key filtering', () => {
    function fireKeydown(keyCode: number, opts: Partial<KeyboardEvent> = {}): boolean {
      const event = new KeyboardEvent('keydown', {
        keyCode,
        bubbles: true,
        cancelable: true,
        ...opts,
      } as any);
      const spy = spyOn(event, 'preventDefault');
      inputEl.dispatchEvent(event);
      return spy.calls.count() === 0; // true = key was allowed, false = key was prevented
    }

    describe('navigation and editing keys (always allowed)', () => {
      it('should allow backspace (8)', () => {
        expect(fireKeydown(8)).toBe(true);
      });

      it('should allow tab (9)', () => {
        expect(fireKeydown(9)).toBe(true);
      });

      it('should allow enter (13)', () => {
        expect(fireKeydown(13)).toBe(true);
      });

      it('should allow escape (27)', () => {
        expect(fireKeydown(27)).toBe(true);
      });

      it('should allow delete (46)', () => {
        expect(fireKeydown(46)).toBe(true);
      });
    });

    describe('Ctrl combinations (always allowed)', () => {
      it('should allow Ctrl+A (65)', () => {
        expect(fireKeydown(65, { ctrlKey: true })).toBe(true);
      });

      it('should allow Ctrl+C (67)', () => {
        expect(fireKeydown(67, { ctrlKey: true })).toBe(true);
      });

      it('should allow Ctrl+V (86)', () => {
        expect(fireKeydown(86, { ctrlKey: true })).toBe(true);
      });

      it('should allow Ctrl+X (88)', () => {
        expect(fireKeydown(88, { ctrlKey: true })).toBe(true);
      });
    });

    describe('cursor movement keys 35-39 (always allowed)', () => {
      it('should allow Home (35)', () => {
        expect(fireKeydown(35)).toBe(true);
      });

      it('should allow End (36)', () => {
        expect(fireKeydown(36)).toBe(true);
      });

      it('should allow Left arrow (37)', () => {
        expect(fireKeydown(37)).toBe(true);
      });

      it('should allow Up arrow (38)', () => {
        expect(fireKeydown(38)).toBe(true);
      });

      it('should allow Right arrow (39)', () => {
        expect(fireKeydown(39)).toBe(true);
      });
    });

    describe('number keys (main keyboard 48-57)', () => {
      it('should allow 0 key (48)', () => {
        expect(fireKeydown(48)).toBe(true);
      });

      it('should allow middle number key 5 (53)', () => {
        expect(fireKeydown(53)).toBe(true);
      });

      it('should allow 9 key (57)', () => {
        expect(fireKeydown(57)).toBe(true);
      });
    });

    describe('numpad keys (96-105)', () => {
      it('should allow numpad 0 (96)', () => {
        expect(fireKeydown(96)).toBe(true);
      });

      it('should allow numpad middle key (100)', () => {
        expect(fireKeydown(100)).toBe(true);
      });

      it('should allow numpad 9 (105)', () => {
        expect(fireKeydown(105)).toBe(true);
      });
    });

    describe('colon key', () => {
      it('should allow colon key code 186', () => {
        expect(fireKeydown(186)).toBe(true);
      });

      it('should allow colon key code 59 (Firefox)', () => {
        expect(fireKeydown(59)).toBe(true);
      });
    });

    describe('blocked keys', () => {
      it('should prevent letter key A without Ctrl (65)', () => {
        expect(fireKeydown(65)).toBe(false);
      });

      it('should prevent letter key Z (90)', () => {
        expect(fireKeydown(90)).toBe(false);
      });

      it('should prevent shift+number (symbol keys)', () => {
        expect(fireKeydown(49, { shiftKey: true })).toBe(false);
      });

      it('should prevent shift+0 (48)', () => {
        expect(fireKeydown(48, { shiftKey: true })).toBe(false);
      });

      it('should prevent function keys (e.g., F1 = 112)', () => {
        expect(fireKeydown(112)).toBe(false);
      });

      it('should prevent space key (32)', () => {
        expect(fireKeydown(32)).toBe(false);
      });

      it('should prevent key codes outside allowed ranges (e.g., 40 - down arrow)', () => {
        // keyCode 40 is NOT in 35-39 range and is not a number/colon, so it should be blocked
        expect(fireKeydown(40)).toBe(false);
      });

      it('should prevent keys just outside number range (47)', () => {
        expect(fireKeydown(47)).toBe(false);
      });

      it('should prevent keys just outside number range (58)', () => {
        // 58 is between 57 (9) and 59 (colon on some browsers)
        expect(fireKeydown(58)).toBe(false);
      });

      it('should prevent numpad keys outside valid range (106 - numpad multiply)', () => {
        expect(fireKeydown(106)).toBe(false);
      });

      it('should prevent numpad keys below valid range (95)', () => {
        expect(fireKeydown(95)).toBe(false);
      });
    });
  });
});
