import { normalizeDeferralId } from './deferral-id.util';

describe('normalizeDeferralId', () => {
  describe('8-digit input', () => {
    it('should return the 8-digit ID as-is', () => {
      expect(normalizeDeferralId('12345678')).toBe('12345678');
    });

    it('should reject non-numeric 8-character strings', () => {
      expect(normalizeDeferralId('1234567A')).toBeNull();
      expect(normalizeDeferralId('ABCDEFGH')).toBeNull();
    });
  });

  describe('10-character wrapped input', () => {
    it('should strip C prefix and suffix and return inner 8 digits', () => {
      expect(normalizeDeferralId('C12345678C')).toBe('12345678');
    });

    it('should handle lowercase c wrapper', () => {
      expect(normalizeDeferralId('c12345678c')).toBe('12345678');
    });

    it('should reject if first character is not C', () => {
      expect(normalizeDeferralId('X12345678C')).toBeNull();
    });

    it('should reject if last character is not C', () => {
      expect(normalizeDeferralId('C12345678X')).toBeNull();
    });

    it('should reject if inner characters are not digits', () => {
      expect(normalizeDeferralId('C1234567AC')).toBeNull();
    });
  });

  describe('invalid lengths', () => {
    it('should return null for 7-digit string', () => {
      expect(normalizeDeferralId('1234567')).toBeNull();
    });

    it('should return null for 9-digit string', () => {
      expect(normalizeDeferralId('123456789')).toBeNull();
    });

    it('should return null for 11-character string', () => {
      expect(normalizeDeferralId('C123456789C')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(normalizeDeferralId('')).toBeNull();
    });

    it('should return null for null', () => {
      expect(normalizeDeferralId(null as any)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(normalizeDeferralId(undefined as any)).toBeNull();
    });

    it('should trim whitespace before processing', () => {
      expect(normalizeDeferralId('  12345678  ')).toBe('12345678');
      expect(normalizeDeferralId('  C12345678C  ')).toBe('12345678');
    });
  });
});
