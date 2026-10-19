export interface ScanPattern {
  prefix: string;
  length: number | number[];
}

export function matchesScanPattern(value: string, patterns: ScanPattern[]): boolean {
  if (!value) return false;
  return patterns.some(p => {
    const prefixMatch = value.startsWith(p.prefix);
    const lengths = Array.isArray(p.length) ? p.length : [p.length];
    return prefixMatch && lengths.includes(value.length);
  });
}

export const SCAN_PATTERNS = {
  UNIT_ID: [
    { prefix: '=', length: 16 },
    { prefix: 'D', length: 9 },
  ] as ScanPattern[],
  UNIT_ABO: [
    { prefix: '=', length: 22 },
    { prefix: '&', length: 22 },
    { prefix: 'D', length: [12, 15] },
  ] as ScanPattern[],
  ABO: [
    { prefix: '=%', length: 6 },
    { prefix: 'D', length: 5 },
  ] as ScanPattern[],
  PRODUCT_EXPIRY: [
    { prefix: '=<', length: 22 },
  ] as ScanPattern[],
  PRODUCT: [
    { prefix: '=<', length: 10 },
    { prefix: 'A0', length: 9 },
  ] as ScanPattern[],
  EXPIRY: [
    { prefix: '&>', length: 12 },
  ] as ScanPattern[],
  SPECIAL_TEST: [
    { prefix: '&(', length: 7 },
  ] as ScanPattern[],
  TRAY_NUMBER: [
    { prefix: 'D', length: 6 },
  ] as ScanPattern[],
  CENTRIFUGE: [
    { prefix: 'C', length: 6 },
  ] as ScanPattern[],
};
