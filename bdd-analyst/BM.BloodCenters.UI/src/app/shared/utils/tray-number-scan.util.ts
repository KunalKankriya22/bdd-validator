/**
 * Parses a tray barcode scan per VSTRYDET validate_tray_number_scan:
 *   - Total length must be exactly 6
 *   - First character must be 'D'
 *   - Sixth (last) character must be 'D'
 *   - Extracted tray number = characters 2–5 (4 chars)
 * Returns the 4-character tray number on success, null on any validation failure.
 * Error 0700 ("Invalid Scan length") should be shown to the user when null is returned.
 */
export function normalizeTrayBarcode(input: string): string | null {
  if (!input) return null;
  const val = input.trim().toUpperCase();
  if (val.length !== 6) return null;
  if (val[0] !== 'D' || val[5] !== 'D') return null;
  return val.substring(1, 5);
}
