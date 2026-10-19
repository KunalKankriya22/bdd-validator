/**
 * UnitIdDisplayUtility
 *
 * Shared utility for formatting CODE128 unit IDs for display.
 * Provides formatted (spaced) display on blur and raw value on focus.
 *
 * CODE128 structure (after optional '=' scan prefix):
 *   [country 1][facility 4][year 2][serial 6][flag 2]
 *
 * Examples:
 *   =W63332604100100 → =W6333 26 041001 00
 *   W633326041001-Q  → W6333 26 041001 -Q
 */
export class UnitIdDisplayUtility {

  /**
   * Format a CODE128 unit ID with spaces for segment readability.
   *
   * @param raw - The raw unit ID string
   * @returns Formatted string with spaces between segments, or raw if too short
   */
  static formatCode128(raw: string): string {
    let prefix = '';
    let body = raw;

    if (body.startsWith('=')) {
      prefix = '=';
      body = body.substring(1);
    }

    // Need at least 15 chars: 1 country + 4 facility + 2 year + 6 serial + 2 flag
    if (body.length < 15) {
      return raw;
    }

    const country  = body.substring(0, 1);   // e.g. W
    const facility = body.substring(1, 5);   // e.g. 6333
    const year     = body.substring(5, 7);   // e.g. 26
    const serial   = body.substring(7, 13);  // e.g. 041001
    const flag     = body.substring(13);     // e.g. 00 or -Q

    return `${prefix}${country}${facility} ${year} ${serial} ${flag}`;
  }

}
