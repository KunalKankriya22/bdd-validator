import { FormControl, FormGroup } from '@angular/forms';
import moment from 'moment';
import { expiryAfterReceivedValidator } from './expiry-after-received.validator';

// =============================================================================
// expiryAfterReceivedValidator
// =============================================================================

describe('expiryAfterReceivedValidator', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup(
      {
        receivedDate: new FormControl(null),
        expiryDate: new FormControl(null),
      },
      { validators: expiryAfterReceivedValidator() }
    );
  });

  // ---------------------------------------------------------------------------
  // Null / missing date paths
  // ---------------------------------------------------------------------------

  describe('when dates are null or missing', () => {
    it('should return null when both dates are null', () => {
      expect(form.errors).toBeNull();
    });

    it('should return null when receivedDate is null and expiryDate has value', () => {
      form.get('expiryDate')!.setValue(moment('2026-12-01'));
      expect(form.errors).toBeNull();
    });

    it('should return null when expiryDate is null and receivedDate has value', () => {
      form.get('receivedDate')!.setValue(moment('2026-01-01'));
      expect(form.errors).toBeNull();
    });

    it('should clear expiryBeforeReceived error from expiryDate when receivedDate becomes null', () => {
      // First set invalid dates
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.errors).toEqual({ expiryBeforeReceived: true });

      // Clear received date
      form.get('receivedDate')!.setValue(null);
      expect(form.errors).toBeNull();
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(false);
    });

    it('should clear expiryBeforeReceived error from expiryDate when expiryDate becomes null', () => {
      // First set invalid dates
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.errors).toEqual({ expiryBeforeReceived: true });

      // Clear expiry date
      form.get('expiryDate')!.setValue(null);
      expect(form.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid dates
  // ---------------------------------------------------------------------------

  describe('when dates are invalid', () => {
    it('should return null when receivedDate is invalid', () => {
      form.get('receivedDate')!.setValue('not-a-date');
      form.get('expiryDate')!.setValue(moment('2026-06-01'));
      expect(form.errors).toBeNull();
    });

    it('should return null when expiryDate is invalid', () => {
      form.get('receivedDate')!.setValue(moment('2026-01-01'));
      form.get('expiryDate')!.setValue('not-a-date');
      expect(form.errors).toBeNull();
    });

    it('should return null when both dates are invalid', () => {
      form.get('receivedDate')!.setValue('invalid');
      form.get('expiryDate')!.setValue('invalid');
      expect(form.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Valid date combinations
  // ---------------------------------------------------------------------------

  describe('when expiry is on or after received', () => {
    it('should return null when expiryDate is after receivedDate', () => {
      form.get('receivedDate')!.setValue(moment('2026-01-01'));
      form.get('expiryDate')!.setValue(moment('2026-12-01'));
      expect(form.errors).toBeNull();
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(false);
    });

    it('should return null when expiryDate is same day as receivedDate', () => {
      const sameDay = moment('2026-06-15');
      form.get('receivedDate')!.setValue(sameDay.clone());
      form.get('expiryDate')!.setValue(sameDay.clone());
      expect(form.errors).toBeNull();
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(false);
    });

    it('should return null when expiryDate is one day after receivedDate', () => {
      form.get('receivedDate')!.setValue(moment('2026-06-15'));
      form.get('expiryDate')!.setValue(moment('2026-06-16'));
      expect(form.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid date combinations
  // ---------------------------------------------------------------------------

  describe('when expiry is before received', () => {
    it('should return error when expiryDate is before receivedDate', () => {
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.errors).toEqual({ expiryBeforeReceived: true });
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);
    });

    it('should return error when expiryDate is one day before receivedDate', () => {
      form.get('receivedDate')!.setValue(moment('2026-06-15'));
      form.get('expiryDate')!.setValue(moment('2026-06-14'));
      expect(form.errors).toEqual({ expiryBeforeReceived: true });
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);
    });

    it('should set error on expiryDate control alongside existing errors', () => {
      // Set an existing error on expiryDate
      form.get('expiryDate')!.setErrors({ someOtherError: true });

      form.get('receivedDate')!.setValue(moment('2026-06-15'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));

      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Error clearing behavior (removeKey helper)
  // ---------------------------------------------------------------------------

  describe('error clearing and removeKey behavior', () => {
    it('should clear expiryBeforeReceived when dates become valid', () => {
      // Set invalid dates
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);

      // Fix by making expiry after received
      form.get('expiryDate')!.setValue(moment('2026-12-01'));
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(false);
    });

    it('should clear expiryBeforeReceived but preserve other errors on expiryDate when dates become valid', () => {
      // Set invalid dates
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);

      // Add another error
      const currentErrors = form.get('expiryDate')!.errors || {};
      form.get('expiryDate')!.setErrors({ ...currentErrors, customError: true });

      // Fix dates
      form.get('expiryDate')!.setValue(moment('2026-12-01'));
      // After re-validation, expiryBeforeReceived should be cleared
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(false);
    });

    it('should set expiryDate errors to null when no other errors exist and clearing', () => {
      // Set invalid, then fix
      form.get('receivedDate')!.setValue(moment('2026-06-01'));
      form.get('expiryDate')!.setValue(moment('2026-01-01'));
      expect(form.get('expiryDate')!.hasError('expiryBeforeReceived')).toBe(true);

      form.get('expiryDate')!.setValue(moment('2026-12-01'));
      expect(form.get('expiryDate')!.errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Native Date objects
  // ---------------------------------------------------------------------------

  describe('with native Date objects', () => {
    it('should return error when expiry is before received (native Date)', () => {
      form.get('receivedDate')!.setValue(new Date(2026, 5, 1));
      form.get('expiryDate')!.setValue(new Date(2026, 0, 1));
      expect(form.errors).toEqual({ expiryBeforeReceived: true });
    });

    it('should return null when expiry is after received (native Date)', () => {
      form.get('receivedDate')!.setValue(new Date(2026, 0, 1));
      form.get('expiryDate')!.setValue(new Date(2026, 11, 1));
      expect(form.errors).toBeNull();
    });
  });
});
