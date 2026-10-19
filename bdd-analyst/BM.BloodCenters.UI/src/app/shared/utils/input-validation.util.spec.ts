import { FormControl } from '@angular/forms';
import { InputValidationUtil } from './input-validation.util';

describe('InputValidationUtil', () => {
  // Helper: create a KeyboardEvent-like object with a jasmine spy for preventDefault
  function createKeyEvent(key: string, code: string): KeyboardEvent {
    return { key, code, preventDefault: jasmine.createSpy('preventDefault') } as any;
  }

  describe('preventLeadingAndMultipleSpaces', () => {
    // --- Branch: event.key === ' ' (space via key property) ---
    it('should detect space via event.key matching " "', () => {
      const control = new FormControl('');
      const event = createKeyEvent(' ', 'Other');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: event.code === 'Space' (space via code property, key is not ' ') ---
    it('should detect space via event.code matching "Space" when key is not " "', () => {
      const control = new FormControl('');
      const event = createKeyEvent('Spacebar', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: non-space key (should skip all inner logic) ---
    it('should not call preventDefault for non-space keys with AbstractControl', () => {
      const control = new FormControl('');
      const event = createKeyEvent('a', 'KeyA');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not call preventDefault for non-space keys with string control', () => {
      const event = createKeyEvent('Enter', 'Enter');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, 'Hello');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    // --- Branch: typeof control === 'string' ---
    it('should prevent space at the beginning when control is an empty string', () => {
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, '');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent multiple consecutive spaces when control is a string ending with space', () => {
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, 'Hello ');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space after non-space character when control is a string', () => {
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, 'Hello');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    // --- Branch: typeof control !== 'string' (AbstractControl path) ---
    it('should prevent space at the beginning of empty FormControl', () => {
      const control = new FormControl('');
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent multiple consecutive spaces with FormControl ending in space', () => {
      const control = new FormControl('Hello ');
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space after non-space character with FormControl', () => {
      const control = new FormControl('Hello');
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    // --- Branch: control.value is null (the || '' fallback) ---
    it('should treat null control value as empty string and prevent space', () => {
      const control = new FormControl(null);
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: control.value is undefined (the || '' fallback) ---
    it('should treat undefined control value as empty string and prevent space', () => {
      const control = new FormControl(undefined);
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: currentValue.length > 0 AND does NOT end with space (both inner ifs false) ---
    it('should allow space in the middle of text with FormControl', () => {
      const control = new FormControl('foo bar');
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      // 'foo bar' does not end with space, so space is allowed
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    // --- Edge: single character value ---
    it('should allow space after a single character', () => {
      const control = new FormControl('A');
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventLeadingAndMultipleSpaces(event, control);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('trimTrailingSpaces', () => {
    // --- Branch: typeof value === 'string' AND trimmed !== value ---
    it('should trim trailing spaces from control value', () => {
      const control = new FormControl('Hello   ');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe('Hello');
    });

    it('should trim a single trailing space', () => {
      const control = new FormControl('Hello ');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe('Hello');
    });

    it('should trim trailing tabs and newlines', () => {
      const control = new FormControl('Hello\t\n');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe('Hello');
    });

    it('should reduce a value of only spaces to empty string', () => {
      const control = new FormControl('   ');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe('');
    });

    // --- Branch: typeof value === 'string' AND trimmed === value (no change needed) ---
    it('should not call setValue when value has no trailing spaces', () => {
      const control = new FormControl('Hello');
      const setValueSpy = spyOn(control, 'setValue');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should not modify an empty string', () => {
      const control = new FormControl('');
      const setValueSpy = spyOn(control, 'setValue');
      InputValidationUtil.trimTrailingSpaces(control);
      expect(setValueSpy).not.toHaveBeenCalled();
    });

    // --- Branch: typeof value !== 'string' (number) ---
    it('should not modify a numeric value', () => {
      const control = new FormControl(123);
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe(123);
    });

    // --- Branch: typeof value !== 'string' (null) ---
    it('should not modify a null value', () => {
      const control = new FormControl(null);
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBeNull();
    });

    // --- Branch: typeof value !== 'string' (undefined) ---
    it('should not modify an undefined value', () => {
      const control = new FormControl(undefined);
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBeNull(); // FormControl converts undefined to null
    });

    // --- Branch: typeof value !== 'string' (boolean) ---
    it('should not modify a boolean value', () => {
      const control = new FormControl(true);
      InputValidationUtil.trimTrailingSpaces(control);
      expect(control.value).toBe(true);
    });
  });

  describe('preventSpaceInput', () => {
    // --- Branch: event.key === ' ' ---
    it('should prevent event when key is space character', () => {
      const event = createKeyEvent(' ', 'Other');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: event.code === 'Space' (key is not ' ') ---
    it('should prevent event when code is "Space" even if key is not " "', () => {
      const event = createKeyEvent('Spacebar', 'Space');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: both key and code match ---
    it('should prevent event when both key and code match space', () => {
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: neither key nor code match ---
    it('should not prevent non-space keys', () => {
      const event = createKeyEvent('a', 'KeyA');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent Enter key', () => {
      const event = createKeyEvent('Enter', 'Enter');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not prevent Tab key', () => {
      const event = createKeyEvent('Tab', 'Tab');
      InputValidationUtil.preventSpaceInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventNonNumeric', () => {
    // --- Branch: allowedKeys.includes(event.key) === true (early return) ---
    it('should allow Backspace', () => {
      const event = createKeyEvent('Backspace', 'Backspace');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete', () => {
      const event = createKeyEvent('Delete', 'Delete');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab', () => {
      const event = createKeyEvent('Tab', 'Tab');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowLeft', () => {
      const event = createKeyEvent('ArrowLeft', 'ArrowLeft');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowRight', () => {
      const event = createKeyEvent('ArrowRight', 'ArrowRight');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowUp', () => {
      const event = createKeyEvent('ArrowUp', 'ArrowUp');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowDown', () => {
      const event = createKeyEvent('ArrowDown', 'ArrowDown');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    // --- Branch: key is a digit (not in allowedKeys, but passes numeric check) ---
    it('should allow all digit keys 0 through 9', () => {
      for (let i = 0; i <= 9; i++) {
        const event = createKeyEvent(String(i), `Digit${i}`);
        InputValidationUtil.preventNonNumeric(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    // --- Branch: key < '0' (non-numeric, below digit range) ---
    it('should prevent space key (char code below "0")', () => {
      const event = createKeyEvent(' ', 'Space');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    // --- Branch: key > '9' (non-numeric, above digit range) ---
    it('should prevent letter keys', () => {
      const event = createKeyEvent('a', 'KeyA');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent uppercase letter keys', () => {
      const event = createKeyEvent('Z', 'KeyZ');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent special characters like @', () => {
      const event = createKeyEvent('@', 'Digit2');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent special characters like #', () => {
      const event = createKeyEvent('#', 'Digit3');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent period/dot', () => {
      const event = createKeyEvent('.', 'Period');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent minus/hyphen', () => {
      const event = createKeyEvent('-', 'Minus');
      InputValidationUtil.preventNonNumeric(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('isAlphanumeric', () => {
    it('should return true for lowercase letters', () => {
      expect(InputValidationUtil.isAlphanumeric('abc')).toBe(true);
    });

    it('should return true for uppercase letters', () => {
      expect(InputValidationUtil.isAlphanumeric('ABC')).toBe(true);
    });

    it('should return true for digits only', () => {
      expect(InputValidationUtil.isAlphanumeric('123')).toBe(true);
    });

    it('should return true for mixed alphanumeric', () => {
      expect(InputValidationUtil.isAlphanumeric('abc123XYZ')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(InputValidationUtil.isAlphanumeric('')).toBe(true);
    });

    it('should return true for single character', () => {
      expect(InputValidationUtil.isAlphanumeric('a')).toBe(true);
    });

    it('should return false for string with spaces', () => {
      expect(InputValidationUtil.isAlphanumeric('abc 123')).toBe(false);
    });

    it('should return false for string with hyphens', () => {
      expect(InputValidationUtil.isAlphanumeric('abc-123')).toBe(false);
    });

    it('should return false for string with underscores', () => {
      expect(InputValidationUtil.isAlphanumeric('abc_123')).toBe(false);
    });

    it('should return false for string with special characters', () => {
      expect(InputValidationUtil.isAlphanumeric('abc@123')).toBe(false);
    });

    it('should return false for string with period', () => {
      expect(InputValidationUtil.isAlphanumeric('abc.123')).toBe(false);
    });

    it('should return false for string with newline', () => {
      expect(InputValidationUtil.isAlphanumeric('abc\n123')).toBe(false);
    });
  });

  describe('removeAllSpaces', () => {
    it('should remove spaces from a string', () => {
      expect(InputValidationUtil.removeAllSpaces('hello world')).toBe('helloworld');
    });

    it('should remove multiple spaces', () => {
      expect(InputValidationUtil.removeAllSpaces('h e l l o')).toBe('hello');
    });

    it('should remove leading and trailing spaces', () => {
      expect(InputValidationUtil.removeAllSpaces(' hello ')).toBe('hello');
    });

    it('should remove tabs', () => {
      expect(InputValidationUtil.removeAllSpaces('hello\tworld')).toBe('helloworld');
    });

    it('should remove newlines', () => {
      expect(InputValidationUtil.removeAllSpaces('hello\nworld')).toBe('helloworld');
    });

    it('should remove mixed whitespace (tabs, newlines, spaces)', () => {
      expect(InputValidationUtil.removeAllSpaces('hello\t\n world\r\n')).toBe('helloworld');
    });

    it('should return empty string when input is empty', () => {
      expect(InputValidationUtil.removeAllSpaces('')).toBe('');
    });

    it('should return empty string when input is all spaces', () => {
      expect(InputValidationUtil.removeAllSpaces('   ')).toBe('');
    });

    it('should return same string when no whitespace exists', () => {
      expect(InputValidationUtil.removeAllSpaces('hello')).toBe('hello');
    });
  });

  describe('normalizeSpaces', () => {
    it('should collapse multiple spaces into a single space', () => {
      expect(InputValidationUtil.normalizeSpaces('hello   world')).toBe('hello world');
    });

    it('should trim leading spaces', () => {
      expect(InputValidationUtil.normalizeSpaces('  hello')).toBe('hello');
    });

    it('should trim trailing spaces', () => {
      expect(InputValidationUtil.normalizeSpaces('hello  ')).toBe('hello');
    });

    it('should trim leading and trailing while collapsing internal spaces', () => {
      expect(InputValidationUtil.normalizeSpaces('  hello   world  ')).toBe('hello world');
    });

    it('should normalize tabs to single space', () => {
      expect(InputValidationUtil.normalizeSpaces('hello\t\tworld')).toBe('hello world');
    });

    it('should normalize newlines to single space', () => {
      expect(InputValidationUtil.normalizeSpaces('hello\n\nworld')).toBe('hello world');
    });

    it('should normalize mixed whitespace', () => {
      expect(InputValidationUtil.normalizeSpaces('hello \t\n world')).toBe('hello world');
    });

    it('should return empty string for empty input', () => {
      expect(InputValidationUtil.normalizeSpaces('')).toBe('');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(InputValidationUtil.normalizeSpaces('   ')).toBe('');
    });

    it('should return same string when already normalized', () => {
      expect(InputValidationUtil.normalizeSpaces('hello world')).toBe('hello world');
    });

    it('should handle single word with no extra spaces', () => {
      expect(InputValidationUtil.normalizeSpaces('hello')).toBe('hello');
    });

    it('should handle multiple words with single spaces (no change needed)', () => {
      expect(InputValidationUtil.normalizeSpaces('one two three')).toBe('one two three');
    });
  });
});
