import { normalizeTrayBarcode } from './tray-number-scan.util';

describe('normalizeTrayBarcode', () => {
  describe('valid barcodes', () => {
    it('should extract inner 4 chars from D[XXXX]D format', () => {
      expect(normalizeTrayBarcode('D0001D')).toBe('0001');
    });

    it('should return uppercase inner value', () => {
      expect(normalizeTrayBarcode('DabcdD')).toBe('ABCD');
    });

    it('should accept alphanumeric inner value', () => {
      expect(normalizeTrayBarcode('DA1B2D')).toBe('A1B2');
    });

    it('should trim whitespace before processing', () => {
      expect(normalizeTrayBarcode('  D0001D  ')).toBe('0001');
    });

    it('should handle lowercase d wrapper', () => {
      expect(normalizeTrayBarcode('d0001d')).toBe('0001');
    });

    it('should handle mixed-case d wrapper', () => {
      expect(normalizeTrayBarcode('D0001d')).toBe('0001');
    });
  });

  describe('invalid — wrong length', () => {
    it('should return null for 5-character string', () => {
      expect(normalizeTrayBarcode('D001D')).toBeNull();
    });

    it('should return null for 7-character string', () => {
      expect(normalizeTrayBarcode('D00001D')).toBeNull();
    });

    it('should return null for 4-character string', () => {
      expect(normalizeTrayBarcode('0001')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeTrayBarcode('')).toBeNull();
    });
  });

  describe('invalid — wrong prefix or suffix', () => {
    it('should return null when first character is not D', () => {
      expect(normalizeTrayBarcode('X0001D')).toBeNull();
    });

    it('should return null when last character is not D', () => {
      expect(normalizeTrayBarcode('D0001X')).toBeNull();
    });

    it('should return null when neither D wraps the value', () => {
      expect(normalizeTrayBarcode('000010')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for null', () => {
      expect(normalizeTrayBarcode(null as any)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(normalizeTrayBarcode(undefined as any)).toBeNull();
    });

    it('should handle spaces-only input', () => {
      expect(normalizeTrayBarcode('      ')).toBeNull();
    });
  });
});
