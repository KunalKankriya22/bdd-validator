import { matchesScanPattern, SCAN_PATTERNS, ScanPattern } from './scan-pattern.util';

describe('ScanPatternUtil', () => {
  describe('matchesScanPattern', () => {
    it('should return true when value matches a pattern prefix and length', () => {
      const patterns: ScanPattern[] = [{ prefix: '=', length: 16 }];
      expect(matchesScanPattern('=' + '0'.repeat(15), patterns)).toBe(true);
    });

    it('should return false when prefix matches but length does not', () => {
      const patterns: ScanPattern[] = [{ prefix: '=', length: 16 }];
      expect(matchesScanPattern('=' + '0'.repeat(10), patterns)).toBe(false);
    });

    it('should return false when length matches but prefix does not', () => {
      const patterns: ScanPattern[] = [{ prefix: '=', length: 5 }];
      expect(matchesScanPattern('X0000', patterns)).toBe(false);
    });

    it('should handle array of lengths', () => {
      const patterns: ScanPattern[] = [{ prefix: 'D', length: [12, 15] }];
      expect(matchesScanPattern('D' + '0'.repeat(11), patterns)).toBe(true);
      expect(matchesScanPattern('D' + '0'.repeat(14), patterns)).toBe(true);
      expect(matchesScanPattern('D' + '0'.repeat(10), patterns)).toBe(false);
    });

    it('should match against any pattern in the array', () => {
      const patterns: ScanPattern[] = [
        { prefix: '=', length: 16 },
        { prefix: 'D', length: 9 },
      ];
      expect(matchesScanPattern('D' + '0'.repeat(8), patterns)).toBe(true);
    });

    it('should return false for empty string', () => {
      const patterns: ScanPattern[] = [{ prefix: '=', length: 1 }];
      expect(matchesScanPattern('', patterns)).toBe(false);
    });

    it('should return false for null value', () => {
      const patterns: ScanPattern[] = [{ prefix: '=', length: 1 }];
      expect(matchesScanPattern(null as any, patterns)).toBe(false);
    });

    it('should return false for empty patterns array', () => {
      expect(matchesScanPattern('=0000', [])).toBe(false);
    });
  });

  describe('SCAN_PATTERNS constants', () => {
    it('should define UNIT_ID patterns', () => {
      expect(SCAN_PATTERNS.UNIT_ID).toBeDefined();
      expect(SCAN_PATTERNS.UNIT_ID.length).toBe(2);
      expect(SCAN_PATTERNS.UNIT_ID[0]).toEqual({ prefix: '=', length: 16 });
      expect(SCAN_PATTERNS.UNIT_ID[1]).toEqual({ prefix: 'D', length: 9 });
    });

    it('should define UNIT_ABO patterns', () => {
      expect(SCAN_PATTERNS.UNIT_ABO).toBeDefined();
      expect(SCAN_PATTERNS.UNIT_ABO.length).toBe(3);
    });

    it('should define ABO patterns', () => {
      expect(SCAN_PATTERNS.ABO).toBeDefined();
      expect(SCAN_PATTERNS.ABO.length).toBe(2);
    });

    it('should define PRODUCT patterns', () => {
      expect(SCAN_PATTERNS.PRODUCT).toBeDefined();
      expect(SCAN_PATTERNS.PRODUCT.length).toBe(2);
    });

    it('should define EXPIRY pattern', () => {
      expect(SCAN_PATTERNS.EXPIRY).toBeDefined();
      expect(SCAN_PATTERNS.EXPIRY[0]).toEqual({ prefix: '&>', length: 12 });
    });

    it('should define SPECIAL_TEST pattern', () => {
      expect(SCAN_PATTERNS.SPECIAL_TEST).toBeDefined();
      expect(SCAN_PATTERNS.SPECIAL_TEST[0]).toEqual({ prefix: '&(', length: 7 });
    });

    it('should match a real UNIT_ID scan', () => {
      expect(matchesScanPattern('=' + '0'.repeat(15), SCAN_PATTERNS.UNIT_ID)).toBe(true);
      expect(matchesScanPattern('D' + '0'.repeat(8), SCAN_PATTERNS.UNIT_ID)).toBe(true);
    });
  });
});
