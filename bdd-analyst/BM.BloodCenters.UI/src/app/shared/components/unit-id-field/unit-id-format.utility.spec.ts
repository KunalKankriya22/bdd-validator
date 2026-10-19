import { UnitIdFormatUtility } from './unit-id-format.utility';

describe('UnitIdFormatUtility', () => {
  describe('calculateISBTCheckDigit', () => {
    it('should return a check digit in "-X" format', () => {
      const result = UnitIdFormatUtility.calculateISBTCheckDigit('W633325021701');
      expect(result).toMatch(/^-[0-9A-Z*]$/);
    });

    it('should produce consistent results for same input', () => {
      const first = UnitIdFormatUtility.calculateISBTCheckDigit('W633325021701');
      const second = UnitIdFormatUtility.calculateISBTCheckDigit('W633325021701');
      expect(first).toBe(second);
    });

    it('should produce different results for different inputs', () => {
      const a = UnitIdFormatUtility.calculateISBTCheckDigit('W633325021701');
      const b = UnitIdFormatUtility.calculateISBTCheckDigit('W633325021801');
      expect(a).not.toBe(b);
    });

    it('should handle all-numeric input', () => {
      const result = UnitIdFormatUtility.calculateISBTCheckDigit('1234567890123');
      expect(result).toMatch(/^-[0-9A-Z*]$/);
    });

    it('should handle mixed alphanumeric input', () => {
      const result = UnitIdFormatUtility.calculateISBTCheckDigit('W6333250217AB');
      expect(result).toMatch(/^-[0-9A-Z*]$/);
    });

    it('should handle asterisk in input', () => {
      const result = UnitIdFormatUtility.calculateISBTCheckDigit('W633325*21701');
      expect(result).toMatch(/^-[0-9A-Z*]$/);
    });
  });

  describe('formatCode128', () => {
    it('should return raw value if length < 15', () => {
      expect(UnitIdFormatUtility.formatCode128('W633325021701')).toBe('W633325021701');
    });

    it('should format 15+ char string with spaces', () => {
      const result = UnitIdFormatUtility.formatCode128('W63332502170100');
      expect(result).toBe('W6333 25 021701 00');
    });

    it('should handle = prefix', () => {
      const result = UnitIdFormatUtility.formatCode128('=W63332502170100');
      expect(result).toBe('=W6333 25 021701 00');
    });

    it('should return raw value for short strings with = prefix', () => {
      expect(UnitIdFormatUtility.formatCode128('=short')).toBe('=short');
    });
  });
});
