import { soundex, soundexMatch } from './soundex.util';

describe('SOUNDEX Utility', () => {

  describe('soundex', () => {

    describe('standard SOUNDEX codes', () => {
      it('should return S530 for Smith', () => {
        expect(soundex('Smith')).toBe('S530');
      });

      it('should return S530 for Smythe', () => {
        expect(soundex('Smythe')).toBe('S530');
      });

      it('should return J525 for Johnson', () => {
        expect(soundex('Johnson')).toBe('J525');
      });

      it('should return J525 for Jonson', () => {
        expect(soundex('Jonson')).toBe('J525');
      });

      it('should return R163 for Robert', () => {
        expect(soundex('Robert')).toBe('R163');
      });

      it('should return R163 for Rupert', () => {
        expect(soundex('Rupert')).toBe('R163');
      });

      it('should return W252 for Washington', () => {
        expect(soundex('Washington')).toBe('W252');
      });
    });

    describe('edge cases', () => {
      it('should return empty string for null', () => {
        expect(soundex(null as any)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(soundex(undefined as any)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect(soundex('')).toBe('');
      });

      it('should return empty string for whitespace only', () => {
        expect(soundex('   ')).toBe('');
      });

      it('should trim input before processing', () => {
        expect(soundex('  Smith  ')).toBe('S530');
      });

      it('should handle single character input', () => {
        const result = soundex('A');
        expect(result).toBe('A000');
      });

      it('should handle two character input', () => {
        const result = soundex('AB');
        expect(result.length).toBe(4);
        expect(result[0]).toBe('A');
      });
    });

    describe('consonant mapping', () => {
      it('should map B,F,P,V to 1', () => {
        expect(soundex('Bob')).toBe('B100');
        expect(soundex('Fox')).toBe('F200');
        expect(soundex('Pat')).toBe('P300');
        expect(soundex('Van')).toBe('V500');
      });

      it('should map C,G,J,K,Q,S,X,Z to 2', () => {
        expect(soundex('Cox')).toBe('C200');
        expect(soundex('Gus')).toBe('G200');
        expect(soundex('Jay')).toBe('J000');
        expect(soundex('Kay')).toBe('K000');
      });

      it('should map D,T to 3', () => {
        expect(soundex('Dan')).toBe('D500');
        expect(soundex('Tom')).toBe('T500');
      });

      it('should map L to 4', () => {
        expect(soundex('Lee')).toBe('L000');
        expect(soundex('Liu')).toBe('L000');
      });

      it('should map M,N to 5', () => {
        expect(soundex('Max')).toBe('M200');
        expect(soundex('Ned')).toBe('N300');
      });

      it('should map R to 6', () => {
        expect(soundex('Ray')).toBe('R000');
        expect(soundex('Ross')).toBe('R200');
      });
    });

    describe('vowel and silent letter handling', () => {
      it('should remove vowels (A,E,I,O,U)', () => {
        // Vowels after first character should be removed
        expect(soundex('Aeiou')).toBe('A000');
      });

      it('should remove H,W,Y', () => {
        // H, W, Y after first character should be ignored
        expect(soundex('Highway')).toBe('H200');
      });

      it('should keep first letter even if vowel', () => {
        expect(soundex('Anderson')).toBe('A536');
        expect(soundex('Edwards')).toBe('E363');
        expect(soundex('Iverson')).toBe('I162');
      });
    });

    describe('consecutive duplicate removal', () => {
      it('should remove consecutive duplicate digits', () => {
        // Names with consecutive same consonants
        expect(soundex('Phillip')).toBe('P410');
      });

      it('should keep non-consecutive duplicates', () => {
        // Non-consecutive same digits should be kept
        const code = soundex('Bernard');
        expect(code).toBe('B656');
      });

      it('should handle names with many consonants', () => {
        expect(soundex('Schmidt')).toBe('S530');
      });
    });

    describe('padding and truncation', () => {
      it('should pad with zeros to 4 characters', () => {
        expect(soundex('Li')).toBe('L000');
        expect(soundex('Wu')).toBe('W000');
      });

      it('should truncate to 4 characters if longer', () => {
        const code = soundex('Pfister');
        expect(code.length).toBe(4);
        expect(code).toBe('P236');
      });

      it('should return exactly 4 characters for valid input', () => {
        expect(soundex('Smith').length).toBe(4);
        expect(soundex('Johnson').length).toBe(4);
        expect(soundex('A').length).toBe(4);
        expect(soundex('Washington').length).toBe(4);
      });
    });

    describe('case insensitivity', () => {
      it('should handle lowercase input', () => {
        expect(soundex('smith')).toBe('S530');
      });

      it('should handle uppercase input', () => {
        expect(soundex('SMITH')).toBe('S530');
      });

      it('should handle mixed case input', () => {
        expect(soundex('SmItH')).toBe('S530');
      });

      it('should produce same code regardless of case', () => {
        const lower = soundex('johnson');
        const upper = soundex('JOHNSON');
        const mixed = soundex('JoHnSoN');
        expect(lower).toBe(upper);
        expect(upper).toBe(mixed);
        expect(lower).toBe('J525');
      });
    });
  });

  describe('soundexMatch', () => {

    describe('matching names', () => {
      it('should return true for Smith and Smythe', () => {
        expect(soundexMatch('Smith', 'Smythe')).toBe(true);
      });

      it('should return true for Johnson and Jonson', () => {
        expect(soundexMatch('Johnson', 'Jonson')).toBe(true);
      });

      it('should return true for Robert and Rupert', () => {
        expect(soundexMatch('Robert', 'Rupert')).toBe(true);
      });
    });

    describe('non-matching names', () => {
      it('should return false for Smith and Jones', () => {
        expect(soundexMatch('Smith', 'Jones')).toBe(false);
      });

      it('should return false for Johnson and Jackson', () => {
        expect(soundexMatch('Johnson', 'Jackson')).toBe(false);
      });

      it('should return false for different phonetic names', () => {
        expect(soundexMatch('Anderson', 'Williams')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false when name1 is null', () => {
        expect(soundexMatch(null as any, 'Smith')).toBe(false);
      });

      it('should return false when name2 is null', () => {
        expect(soundexMatch('Smith', null as any)).toBe(false);
      });

      it('should return false when both are null', () => {
        expect(soundexMatch(null as any, null as any)).toBe(false);
      });

      it('should return false when name1 is empty', () => {
        expect(soundexMatch('', 'Smith')).toBe(false);
      });

      it('should return false when name2 is empty', () => {
        expect(soundexMatch('Smith', '')).toBe(false);
      });

      it('should handle whitespace-only strings', () => {
        expect(soundexMatch('   ', 'Smith')).toBe(false);
        expect(soundexMatch('Smith', '   ')).toBe(false);
      });
    });

    describe('identical names', () => {
      it('should return true for identical names', () => {
        expect(soundexMatch('Smith', 'Smith')).toBe(true);
      });

      it('should return true for same name different case', () => {
        expect(soundexMatch('smith', 'SMITH')).toBe(true);
        expect(soundexMatch('Johnson', 'johnson')).toBe(true);
      });
    });
  });
});
