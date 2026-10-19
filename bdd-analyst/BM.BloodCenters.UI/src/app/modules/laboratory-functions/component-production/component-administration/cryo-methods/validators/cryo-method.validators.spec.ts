import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  timeFormatValidator,
  temperatureRangeValidator,
  worksheetFreezeTimeRangeValidator,
  separationFreezeTimeRangeValidator
} from './cryo-method.validators';

describe('Cryo Method Validators', () => {
  describe('timeFormatValidator', () => {
    let control: FormControl;

    beforeEach(() => {
      control = new FormControl('', [timeFormatValidator()]);
    });





    it('should reject time format with minutes > 59', () => {
      const invalidTimes = [
        1.60,  // 1 hour 60 minutes (invalid)
        2.65,  // 2 hours 65 minutes (invalid)
        5.99,  // 5 hours 99 minutes (invalid)
        10.70, // 10 hours 70 minutes (invalid)
        0.61   // 0 hours 61 minutes (invalid)
      ];

      invalidTimes.forEach(time => {
        control.setValue(time);
        expect(control.errors).toBeTruthy();
        expect(control.errors?.['invalidTimeFormat']).toBeDefined();
        expect(control.errors?.['invalidTimeFormat'].actual).toBe(time);
        expect(control.errors?.['invalidTimeFormat'].message).toContain('Invalid time format');
      });
    });


    it('should handle edge case of exactly 0.60', () => {
      control.setValue(0.60);
      expect(control.errors).toBeTruthy();
      expect(control.errors?.['invalidTimeFormat']).toBeDefined();
    });


    it('should handle string numbers correctly', () => {
      control.setValue('2.30');
      expect(control.errors).toBeNull();

      control.setValue('2.65');
      expect(control.errors).toBeTruthy();
    });


    it('should validate decimal precision edge cases', () => {
      // After rounding fix: 1.595 rounds to 1.60 which should fail
      control.setValue(1.595);
      expect(control.errors).toBeTruthy();

      // 1.58 should pass (0.58 <= 0.59)
      control.setValue(1.58);
      expect(control.errors).toBeNull();

      // 1.59 should NOW PASS (was failing before the fix - this is the bug we fixed!)
      control.setValue(1.59);
      expect(control.errors).toBeNull();

      // 1.60 should fail (exactly at 60 minutes)
      control.setValue(1.60);
      expect(control.errors).toBeTruthy();

      // 1.591 rounds to 1.59 which should pass
      control.setValue(1.591);
      expect(control.errors).toBeNull();
    });

    it('should handle large hour values', () => {
      control.setValue(100.30);
      expect(control.errors).toBeNull();

      control.setValue(100.65);
      expect(control.errors).toBeTruthy();
    });

    it('should provide descriptive error message', () => {
      control.setValue(2.65);
      const error = control.errors?.['invalidTimeFormat'];

      expect(error.message).toBe(
        'Invalid time format. Minutes must be 0-59 (e.g., 2.30 = 2 hours 30 minutes)'
      );
    });
  });

  describe('temperatureRangeValidator', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        minTemp: new FormControl(null),
        maxTemp: new FormControl(null)
      }, {
        validators: [temperatureRangeValidator()]
      });
    });







    it('should reject invalid range (min > max)', () => {
      const invalidRanges = [
        { minTemp: 10, maxTemp: 5 },
        { minTemp: 6, maxTemp: 1 },
        { minTemp: 0, maxTemp: -5 },
        { minTemp: 6.5, maxTemp: 1.5 }
      ];

      invalidRanges.forEach(range => {
        form.patchValue(range);
        expect(form.errors).toBeTruthy();
        expect(form.errors?.['tempRangeInvalid']).toBeTrue();
      });
    });


    it('should handle string number inputs', () => {
      form.patchValue({ minTemp: '1', maxTemp: '6' });
      expect(form.errors).toBeNull();

      form.patchValue({ minTemp: '10', maxTemp: '5' });
      expect(form.errors).toBeTruthy();
    });



    it('should handle decimal temperatures', () => {
      form.patchValue({ minTemp: 1.25, maxTemp: 6.75 });
      expect(form.errors).toBeNull();

      form.patchValue({ minTemp: 6.75, maxTemp: 1.25 });
      expect(form.errors).toBeTruthy();
    });

    it('should handle negative temperatures', () => {
      form.patchValue({ minTemp: -10, maxTemp: -5 });
      expect(form.errors).toBeNull();

      form.patchValue({ minTemp: -5, maxTemp: -10 });
      expect(form.errors).toBeTruthy();
    });

  });

  describe('worksheetFreezeTimeRangeValidator', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        minWsFreezeTime: new FormControl(null),
        maxWsFreezeTime: new FormControl(null)
      }, {
        validators: [worksheetFreezeTimeRangeValidator()]
      });
    });





    it('should reject invalid range (min > max)', () => {
      const invalidRanges = [
        { minWsFreezeTime: 6.00, maxWsFreezeTime: 0.01 },
        { minWsFreezeTime: 17.50, maxWsFreezeTime: 0.00 },
        { minWsFreezeTime: 10.00, maxWsFreezeTime: 1.00 }
      ];

      invalidRanges.forEach(range => {
        form.patchValue(range);
        expect(form.errors).toBeTruthy();
        expect(form.errors?.['worksheetTimeRangeInvalid']).toBeTrue();
      });
    });



    it('should handle string number inputs', () => {
      form.patchValue({ minWsFreezeTime: '0.01', maxWsFreezeTime: '6.00' });
      expect(form.errors).toBeNull();

      form.patchValue({ minWsFreezeTime: '10', maxWsFreezeTime: '5' });
      expect(form.errors).toBeTruthy();
    });

    it('should handle very small decimal values', () => {
      form.patchValue({ minWsFreezeTime: 0.001, maxWsFreezeTime: 0.002 });
      expect(form.errors).toBeNull();

      form.patchValue({ minWsFreezeTime: 0.002, maxWsFreezeTime: 0.001 });
      expect(form.errors).toBeTruthy();
    });


  });

  describe('separationFreezeTimeRangeValidator', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        minSepFreezeTime: new FormControl(null),
        maxSepFreezeTime: new FormControl(null)
      }, {
        validators: [separationFreezeTimeRangeValidator()]
      });
    });





    it('should reject invalid range (min > max)', () => {
      const invalidRanges = [
        { minSepFreezeTime: 0.55, maxSepFreezeTime: 0.10 },
        { minSepFreezeTime: 0.55, maxSepFreezeTime: 0.00 },
        { minSepFreezeTime: 1.00, maxSepFreezeTime: 0.20 }
      ];

      invalidRanges.forEach(range => {
        form.patchValue(range);
        expect(form.errors).toBeTruthy();
        expect(form.errors?.['separationTimeRangeInvalid']).toBeTrue();
      });
    });



    it('should handle string number inputs', () => {
      form.patchValue({ minSepFreezeTime: '0.10', maxSepFreezeTime: '0.55' });
      expect(form.errors).toBeNull();

      form.patchValue({ minSepFreezeTime: '1.00', maxSepFreezeTime: '0.20' });
      expect(form.errors).toBeTruthy();
    });

    it('should handle very small decimal values', () => {
      form.patchValue({ minSepFreezeTime: 0.001, maxSepFreezeTime: 0.002 });
      expect(form.errors).toBeNull();

      form.patchValue({ minSepFreezeTime: 0.002, maxSepFreezeTime: 0.001 });
      expect(form.errors).toBeTruthy();
    });


  });

  describe('Validator Integration Tests', () => {
    it('should work together with required validators', () => {
      const control = new FormControl<number | string | null>('', [
        Validators.required,
        timeFormatValidator()
      ]);

      // Empty value
      control.setValue('');
      expect(control.hasError('required')).toBeTrue();
      expect(control.hasError('invalidTimeFormat')).toBeFalse();

      // Valid value
      control.setValue(2.30);
      expect(control.hasError('required')).toBeFalse();
      expect(control.hasError('invalidTimeFormat')).toBeFalse();

      // Invalid value
      control.setValue(2.65);
      expect(control.hasError('required')).toBeFalse();
      expect(control.hasError('invalidTimeFormat')).toBeTrue();
    });

    it('should work with multiple form-level validators', () => {
      const form = new FormGroup({
        minTemp: new FormControl<number | null>(null),
        maxTemp: new FormControl<number | null>(null),
        minWsFreezeTime: new FormControl<number | null>(null),
        maxWsFreezeTime: new FormControl<number | null>(null),
        minSepFreezeTime: new FormControl<number | null>(null),
        maxSepFreezeTime: new FormControl<number | null>(null)
      }, {
        validators: [
          temperatureRangeValidator(),
          worksheetFreezeTimeRangeValidator(),
          separationFreezeTimeRangeValidator()
        ]
      });

      // All valid
      form.patchValue({
        minTemp: 1,
        maxTemp: 6,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55
      });
      expect(form.errors).toBeNull();

      // Temperature invalid
      form.patchValue({ minTemp: 10, maxTemp: 5 });
      expect(form.hasError('tempRangeInvalid')).toBeTrue();

      // Fix temperature, break worksheet time
      form.patchValue({
        minTemp: 1,
        maxTemp: 6,
        minWsFreezeTime: 10,
        maxWsFreezeTime: 1
      });
      expect(form.hasError('tempRangeInvalid')).toBeFalse();
      expect(form.hasError('worksheetTimeRangeInvalid')).toBeTrue();

      // Fix worksheet time, break separation time
      form.patchValue({
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6,
        minSepFreezeTime: 1.00,
        maxSepFreezeTime: 0.10
      });
      expect(form.hasError('worksheetTimeRangeInvalid')).toBeFalse();
      expect(form.hasError('separationTimeRangeInvalid')).toBeTrue();
    });
  });
});
