import {
  extractErrorMessage,
  shouldClearUnitField,
  isWeightRequired,
  shouldShowAttributes,
  isValidWeight,
  isValidVolume,
  calculateVolume,
  hasProperty,
  parseIsbtCatalogScan,
  parseWeightScan,
  ApiError
} from './error-handler.util';

describe('error-handler.util', () => {

  // ── extractErrorMessage ──────────────────────────────────────────────

  describe('extractErrorMessage', () => {
    const fallback = 'An unexpected error occurred';

    describe('error code extraction', () => {
      it('should extract errorCode from error.error.errorCode first (highest priority)', () => {
        const error: ApiError = {
          errorCode: '1111',
          error: { errorCode: '0063' },
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toContain('Error 0063');
      });

      it('should extract errorCode from top-level errorCode when error.error.errorCode is absent', () => {
        const error: ApiError = { errorCode: '0095', errorResponse: { errorCode: '0095', error: 'Pheresis donation' } };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0095: Pheresis donation');
      });

      it('should extract errorCode from error.errorResponse.errorCode as last resort', () => {
        const error: ApiError = {
          error: { errorResponse: { errorCode: '0039', error: 'No bag code recorded' } }
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0039: No bag code recorded');
      });

      it('should have no error code when none is found anywhere', () => {
        const error: ApiError = { message: 'Something went wrong' };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Something went wrong');
      });
    });

    describe('message extraction', () => {
      it('should extract message from error.error.errorResponse.error first (highest priority)', () => {
        const error: ApiError = {
          errorCode: '0065',
          error: {
            errorResponse: { errorCode: '0065', error: 'Bleed start/end time missing' },
            message: 'Should not use this'
          },
          message: 'Should not use this either'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0065: Bleed start/end time missing');
      });

      it('should extract message from error.error.message second', () => {
        const error: ApiError = {
          errorCode: '9719',
          error: { message: 'Invalid catalog number' },
          message: 'Should not use this'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 9719: Invalid catalog number');
      });

      it('should extract message from errorResponse.error third', () => {
        const error: ApiError = {
          errorCode: '1245',
          errorResponse: { errorCode: '1245', error: 'Invalid product type' },
          message: 'Should not use this'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 1245: Invalid product type');
      });

      it('should extract message from top-level message fourth', () => {
        const error: ApiError = {
          errorCode: '0135',
          message: 'Bag count less than 1'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0135: Bag count less than 1');
      });

      it('should skip top-level message if it starts with "Http failure"', () => {
        const error: ApiError = {
          errorCode: '0400',
          message: 'Http failure response for /api/units'
        };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0400: An unexpected error occurred');
      });

      it('should use top-level message when it does not start with "Http failure"', () => {
        const error: ApiError = { message: 'Network timeout' };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Network timeout');
      });
    });

    describe('formatting', () => {
      it('should return message without code prefix when no errorCode is found', () => {
        const error: ApiError = { error: { message: 'Server error' } };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Server error');
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

      it('should format as "Error CODE: message" when both code and message exist', () => {
        const error: ApiError = { error: { errorCode: '0155', message: 'Unit not found' } };
        const result = extractErrorMessage(error, fallback);
        expect(result).toBe('Error 0155: Unit not found');
      });
    });
  });

  // ── shouldClearUnitField ─────────────────────────────────────────────

  describe('shouldClearUnitField', () => {
    const clearCodes = ['0063', '0095', '0065', '0039', '0135', '0155', '0137', '0400', '0188', '9752', '1251'];

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

    it('should return false for a code not in the list', () => {
      expect(shouldClearUnitField('0001')).toBe(false);
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

    it('should return false for empty string', () => {
      expect(isWeightRequired('')).toBe(false);
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

    it('should return false for empty string', () => {
      expect(shouldShowAttributes('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(shouldShowAttributes(null as any)).toBe(false);
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

    it('should return true for a fractional weight like 0.01', () => {
      expect(isValidWeight(0.01)).toBe(true);
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
  });

  // ── isValidVolume ────────────────────────────────────────────────────

  describe('isValidVolume', () => {
    it('should return true for minimum valid volume (0.01)', () => {
      expect(isValidVolume(0.01)).toBe(true);
    });

    it('should return true for maximum valid volume (999.99)', () => {
      expect(isValidVolume(999.99)).toBe(true);
    });

    it('should return true for a mid-range volume', () => {
      expect(isValidVolume(250)).toBe(true);
    });

    it('should return true for volume of 1', () => {
      expect(isValidVolume(1)).toBe(true);
    });

    it('should return false for 0', () => {
      expect(isValidVolume(0)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidVolume(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidVolume(undefined as any)).toBe(false);
    });

    it('should return false for a negative number', () => {
      expect(isValidVolume(-5)).toBe(false);
    });

    it('should return false for volume exceeding 999.99', () => {
      expect(isValidVolume(1000)).toBe(false);
    });

    it('should return false for a very large volume', () => {
      expect(isValidVolume(10000)).toBe(false);
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

    it('should round to 2 decimal places', () => {
      // 333 / 1.03 = 323.30097... -> 323.30
      expect(calculateVolume(333, 1.03)).toBe(323.3);
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

    it('should return true when property exists with empty string value', () => {
      const obj = { name: '' };
      expect(hasProperty(obj, 'name')).toBe(true);
    });

    it('should return true when property exists with zero value', () => {
      const obj = { count: 0 };
      expect(hasProperty(obj, 'count')).toBe(true);
    });
  });

  // ── parseIsbtCatalogScan ─────────────────────────────────────────────

  describe('parseIsbtCatalogScan', () => {
    it('should strip leading "=" and return rest for valid ISBT scan (>= 12 chars)', () => {
      const result = parseIsbtCatalogScan('=AHAAP30003X');
      expect(result).toBe('AHAAP30003X');
    });

    it('should strip leading "=" and trim the result', () => {
      const result = parseIsbtCatalogScan('=AHAAP30003X  ');
      expect(result).toBe('AHAAP30003X');
    });

    it('should return trimmed value when no leading "="', () => {
      const result = parseIsbtCatalogScan('AHAAP30003');
      expect(result).toBe('AHAAP30003');
    });

    it('should return trimmed value for short string starting with "=" (length < 12)', () => {
      const result = parseIsbtCatalogScan('=SHORT');
      expect(result).toBe('=SHORT');
    });

    it('should handle "=" with exactly 12 characters total', () => {
      // "=12345678901" is 12 chars, starts with =
      const result = parseIsbtCatalogScan('=12345678901');
      expect(result).toBe('12345678901');
    });

    it('should handle "=" with 11 characters total (below threshold)', () => {
      // "=1234567890" is 11 chars, starts with = but less than 12
      const result = parseIsbtCatalogScan('=1234567890');
      expect(result).toBe('=1234567890');
    });

    it('should return null for empty string', () => {
      expect(parseIsbtCatalogScan('')).toBeNull();
    });

    it('should return null for null (coerced as any)', () => {
      expect(parseIsbtCatalogScan(null as any)).toBeNull();
    });

    it('should return null for undefined (coerced as any)', () => {
      expect(parseIsbtCatalogScan(undefined as any)).toBeNull();
    });

    it('should trim whitespace from non-= input', () => {
      const result = parseIsbtCatalogScan('  CATALOG123  ');
      expect(result).toBe('CATALOG123');
    });

    it('should handle input that is only whitespace', () => {
      const result = parseIsbtCatalogScan('   ');
      expect(result).toBe('');
    });
  });

  // ── parseWeightScan ──────────────────────────────────────────────────

  describe('parseWeightScan', () => {
    it('should extract a simple integer from the scanned value', () => {
      expect(parseWeightScan('500')).toBe(500);
    });

    it('should extract a decimal number from the scanned value', () => {
      expect(parseWeightScan('123.45')).toBe(123.45);
    });

    it('should extract numeric value from string with units', () => {
      expect(parseWeightScan('450g')).toBe(450);
    });

    it('should extract numeric value from string with prefix text', () => {
      expect(parseWeightScan('Weight: 300.5')).toBe(300.5);
    });

    it('should trim whitespace before matching', () => {
      expect(parseWeightScan('  250  ')).toBe(250);
    });

    it('should return null for empty string', () => {
      expect(parseWeightScan('')).toBeNull();
    });

    it('should return null for null (coerced as any)', () => {
      expect(parseWeightScan(null as any)).toBeNull();
    });

    it('should return null for undefined (coerced as any)', () => {
      expect(parseWeightScan(undefined as any)).toBeNull();
    });

    it('should return null for a string with no digits', () => {
      expect(parseWeightScan('abc')).toBeNull();
    });

    it('should extract first numeric match when multiple numbers exist', () => {
      expect(parseWeightScan('test 100 and 200')).toBe(100);
    });

    it('should handle "0" as a valid weight scan', () => {
      expect(parseWeightScan('0')).toBe(0);
    });

    it('should extract decimal without leading digit', () => {
      expect(parseWeightScan('.5')).toBe(0.5);
    });
  });

});
