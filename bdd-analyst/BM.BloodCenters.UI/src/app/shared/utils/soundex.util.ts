/**
 * SOUNDEX phonetic matching utility
 *
 * Implements the classic SOUNDEX algorithm for fuzzy name matching.
 * Oracle Forms uses SOUNDEX() function for patient search fallback.
 *
 * SOUNDEX converts names to a 4-character code (1 letter + 3 digits) based on pronunciation.
 * Names that sound similar get the same code (e.g., "Smith" and "Smythe" both = S530).
 *
 * Usage:
 * ```typescript
 * soundex('Smith')   // 'S530'
 * soundex('Smythe')  // 'S530'
 * soundex('Johnson') // 'J525'
 * soundex('Jonson')  // 'J525'
 * ```
 */

/**
 * Generates SOUNDEX code for a given string.
 *
 * Algorithm:
 * 1. Keep first letter
 * 2. Replace consonants with digits (B,F,P,V=1; C,G,J,K,Q,S,X,Z=2; D,T=3; L=4; M,N=5; R=6)
 * 3. Remove vowels (A,E,I,O,U,H,W,Y)
 * 4. Remove consecutive duplicates
 * 5. Pad with zeros or truncate to 4 characters
 *
 * @param name - String to encode (typically last name)
 * @returns 4-character SOUNDEX code (e.g., 'S530')
 */
export function soundex(name: string): string {
  if (!name) return '';

  const input = name.toUpperCase().trim();
  if (input.length === 0) return '';

  // SOUNDEX mapping: consonants → digits
  const soundexMap: Record<string, string> = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6'
  };

  // 1. Keep first letter
  const firstChar = input.charAt(0);
  let code = firstChar;

  // 2. Convert remaining characters to digits
  for (let i = 1; i < input.length; i++) {
    const char = input.charAt(i);
    const digit = soundexMap[char];

    if (digit) {
      // Skip if same as previous digit (remove consecutive duplicates)
      const lastDigit = soundexMap[input.charAt(i - 1)];
      if (digit !== lastDigit) {
        code += digit;
      }
    }
    // Vowels and H,W,Y are ignored (removed)
  }

  // 3. Pad with zeros or truncate to 4 characters
  code = (code + '000').substring(0, 4);

  return code;
}

/**
 * Check if two names match by SOUNDEX
 *
 * @param name1 - First name to compare
 * @param name2 - Second name to compare
 * @returns true if SOUNDEX codes match
 */
export function soundexMatch(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  return soundex(name1) === soundex(name2);
}
