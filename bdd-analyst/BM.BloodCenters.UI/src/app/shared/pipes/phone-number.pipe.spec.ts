import { PhoneNumberPipe } from './phone-number.pipe';

describe('PhoneNumberPipe', () => {
  let pipe: PhoneNumberPipe;

  beforeEach(() => {
    pipe = new PhoneNumberPipe();
  });

  describe('10-digit numbers', () => {
    it('should format as (XXX) XXX-XXXX', () => {
      expect(pipe.transform('1234567890')).toBe('(123) 456-7890');
    });

    it('should strip non-numeric characters before formatting', () => {
      expect(pipe.transform('(123) 456-7890')).toBe('(123) 456-7890');
      expect(pipe.transform('123-456-7890')).toBe('(123) 456-7890');
      expect(pipe.transform('123.456.7890')).toBe('(123) 456-7890');
    });
  });

  describe('11-digit numbers (with country code)', () => {
    it('should format as +X (XXX) XXX-XXXX', () => {
      expect(pipe.transform('11234567890')).toBe('+1 (123) 456-7890');
    });

    it('should strip non-numeric characters before formatting', () => {
      expect(pipe.transform('+1 (123) 456-7890')).toBe('+1 (123) 456-7890');
      expect(pipe.transform('1-123-456-7890')).toBe('+1 (123) 456-7890');
    });
  });

  describe('other lengths', () => {
    it('should return original value for short numbers', () => {
      expect(pipe.transform('12345')).toBe('12345');
    });

    it('should return original value for 7-digit numbers', () => {
      expect(pipe.transform('1234567')).toBe('1234567');
    });

    it('should return original value for 12-digit numbers', () => {
      expect(pipe.transform('123456789012')).toBe('123456789012');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(pipe.transform('')).toBe('');
    });
  });
});
