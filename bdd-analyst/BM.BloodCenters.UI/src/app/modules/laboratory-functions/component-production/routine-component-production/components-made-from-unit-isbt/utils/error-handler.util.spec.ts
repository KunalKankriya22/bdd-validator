import {
  extractErrorMessage,
  shouldClearUnitField,
  isWeightRequired,
  shouldShowAttributes,
  isValidWeight,
  calculateVolume,
  formatDateForApi,
  hasProperty,
  ApiError
} from './error-handler.util';

describe('error-handler.util', () => {

  // ── extractErrorMessage ──────────────────────────────────────────────

  describe('extractErrorMessage', () => {
    const fallback = 'An unexpected error occurred';

    describe('error code extraction', () => {
      it('should extract errorCode from top-level errorCode', () => {
        const error: ApiError = { errorCode: '0095', errorResponse: { errorCode: '0095', error: 'Pheresis donation' } };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0095: Pheresis donation');
      });

      it('should extract errorCode from error.errorCode when top-level is absent', () => {
        const error: ApiError = { error: { errorCode: '0063' }, message: 'Some message' };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0063: Some message');
      });

      it('should extract errorCode from error.errorResponse.errorCode as last resort', () => {
        const error: ApiError = {
          error: { errorResponse: { errorCode: '0039', error: 'No bag code recorded' } }
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0039: No bag code recorded');
      });
    });

    describe('message extraction', () => {
      it('should extract message from errorResponse.error first', () => {
        const error: ApiError = {
          errorCode: '1245',
          errorResponse: { errorCode: '1245', error: 'Invalid product type' },
          message: 'Should not use this'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 1245: Invalid product type');
      });

      it('should extract message from error.errorResponse.error second', () => {
        const error: ApiError = {
          errorCode: '0065',
          error: { errorResponse: { errorCode: '0065', error: 'Bleed start/end time missing' } },
          message: 'Should not use this'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0065: Bleed start/end time missing');
      });

      it('should extract message from top-level message third', () => {
        const error: ApiError = {
          errorCode: '0135',
          message: 'Bag count less than 1'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0135: Bag count less than 1');
      });

      it('should extract message from error.message fourth', () => {
        const error: ApiError = {
          errorCode: '9719',
          error: { message: 'Invalid catalog number' }
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 9719: Invalid catalog number');
      });
    });

    describe('formatting', () => {
      it('should return message without code prefix when no errorCode is found', () => {
        const error: ApiError = { message: 'Network timeout' };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Network timeout');
      });

      it('should use fallback when no message is found in the error object', () => {
        const error: ApiError = { errorCode: '9999' };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 9999: An unexpected error occurred');
      });

      it('should return fallback when error has no useful properties', () => {
        const error: ApiError = {};
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe(fallback);
      });
    });
  });

  // ── shouldClearUnitField ─────────────────────────────────────────────

  describe('shouldClearUnitField', () => {
    const clearCodes = ['0063', 'INTR', '0095', '0065', '0039', '0135', '0155', '0137'];

    clearCodes.forEach(code => {
      it(`should return true for error code '${code}'`, () => {
        expect(shouldClearUnitField(code)).toBe(true);
      });
    });

    it('should return false for a non-matching error code', () => {
      expect(shouldClearUnitField('9999')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(shouldClearUnitField(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(shouldClearUnitField('')).toBe(false);
    });
  });

  // ── isWeightRequired ─────────────────────────────────────────────────

  describe('isWeightRequired', () => {
    it('should return true for "Y"', () => {
      expect(isWeightRequired('Y')).toBe(true);
    });

    it('should return false for "N"', () => {
      expect(isWeightRequired('N')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isWeightRequired(undefined)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isWeightRequired(null as any)).toBe(false);
    });

    it('should return false for lowercase "y"', () => {
      expect(isWeightRequired('y')).toBe(false);
    });
  });

  // ── shouldShowAttributes ─────────────────────────────────────────────

  describe('shouldShowAttributes', () => {
    it('should return true for "Y"', () => {
      expect(shouldShowAttributes('Y')).toBe(true);
    });

    it('should return false for "N"', () => {
      expect(shouldShowAttributes('N')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(shouldShowAttributes(undefined)).toBe(false);
    });

    it('should return false for lowercase "y"', () => {
      expect(shouldShowAttributes('y')).toBe(false);
    });
  });

  // ── isValidWeight ────────────────────────────────────────────────────

  describe('isValidWeight', () => {
    it('should return true for minimum valid weight (1)', () => {
      expect(isValidWeight(1)).toBe(true);
    });

    it('should return true for maximum valid weight (999.99)', () => {
      expect(isValidWeight(999.99)).toBe(true);
    });

    it('should return true for a mid-range weight', () => {
      expect(isValidWeight(450)).toBe(true);
    });

    it('should return false for 0', () => {
      expect(isValidWeight(0)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidWeight(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidWeight(undefined as any)).toBe(false);
    });

    it('should return false for a negative number', () => {
      expect(isValidWeight(-1)).toBe(false);
    });

    it('should return false for weight exceeding 999.99', () => {
      expect(isValidWeight(1000)).toBe(false);
    });

    it('should return false for a fractional weight below 1', () => {
      expect(isValidWeight(0.99)).toBe(false);
    });
  });

  // ── calculateVolume ──────────────────────────────────────────────────

  describe('calculateVolume', () => {
    it('should return weight divided by specificGravity rounded to 2 decimals', () => {
      // 500 / 1.053 = 474.8338... -> 474.83
      expect(calculateVolume(500, 1.053)).toBe(474.83);
    });

    it('should handle exact division', () => {
      expect(calculateVolume(100, 2)).toBe(50);
    });

    it('should return null when weight is null', () => {
      expect(calculateVolume(null, 1.053)).toBeNull();
    });

    it('should return null when specificGravity is null', () => {
      expect(calculateVolume(500, null)).toBeNull();
    });

    it('should return null when specificGravity is 0', () => {
      expect(calculateVolume(500, 0)).toBeNull();
    });

    it('should return null when both are null', () => {
      expect(calculateVolume(null, null)).toBeNull();
    });

    it('should return null when weight is 0 (falsy)', () => {
      expect(calculateVolume(0, 1.053)).toBeNull();
    });
  });

  // ── formatDateForApi ─────────────────────────────────────────────────

  describe('formatDateForApi', () => {
    it('should extract date portion from ISO string', () => {
      expect(formatDateForApi('2011-05-25T12:00:00')).toBe('2011-05-25');
    });

    it('should format a Date object to YYYY-MM-DD', () => {
      const date = new Date('2024-12-15T12:00:00Z');
      expect(formatDateForApi(date)).toBe('2024-12-15');
    });

    it('should return empty string for empty string input', () => {
      expect(formatDateForApi('')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatDateForApi(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDateForApi(undefined as any)).toBe('');
    });
  });

  // ── hasProperty ──────────────────────────────────────────────────────

  describe('hasProperty', () => {
    it('should return true when property exists on the object', () => {
      const obj = { name: 'test', value: 42 };
      expect(hasProperty(obj, 'name')).toBe(true);
    });

    it('should return true when property exists but is null', () => {
      const obj = { name: null as any };
      expect(hasProperty(obj, 'name')).toBe(true);
    });

    it('should return true when property exists but is undefined', () => {
      const obj = { name: undefined as any };
      expect(hasProperty(obj, 'name')).toBe(true);
    });

    it('should return false when property does not exist', () => {
      const obj = { name: 'test' };
      expect(hasProperty(obj, 'value' as any)).toBe(false);
    });
  });

});
