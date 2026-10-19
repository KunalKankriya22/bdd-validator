import { MenuTextFormatPipe } from './menu-text-format.pipe';

describe('MenuTextFormatPipe', () => {
  let pipe: MenuTextFormatPipe;

  beforeEach(() => {
    pipe = new MenuTextFormatPipe();
  });

  describe('Falsy value handling', () => {
    it('should return empty string when value is null', () => {
      const result = pipe.transform(null);

      expect(result).toBe('');
    });

    it('should return empty string when value is undefined', () => {
      const result = pipe.transform(undefined);

      expect(result).toBe('');
    });

    it('should return empty string when value is empty string', () => {
      const result = pipe.transform('');

      expect(result).toBe('');
    });
  });

  describe('Arrow and special character pattern removal', () => {
    it('should remove "= >" pattern from text', () => {
      const result = pipe.transform('Laboratory Functions = >');

      expect(result).toBe('Laboratory Functions');
    });

    it('should remove "=>" pattern from text', () => {
      const result = pipe.transform('Laboratory Functions=>');

      expect(result).toBe('Laboratory Functions');
    });

    it('should remove "->" pattern from text', () => {
      const result = pipe.transform('Laboratory Functions->');

      expect(result).toBe('Laboratory Functions');
    });

    it('should remove "= >" with extra surrounding spaces', () => {
      const result = pipe.transform('Functions  =  >  Details');

      expect(result).toBe('Functions Details');
    });

    it('should remove "-->" pattern from text', () => {
      const result = pipe.transform('Functions --> Details');

      expect(result).toBe('Functions Details');
    });

    it('should remove "==>" pattern from text', () => {
      const result = pipe.transform('Functions ==> Details');

      expect(result).toBe('Functions Details');
    });

    it('should remove arrow pattern in the middle of text', () => {
      const result = pipe.transform('Start => Middle => End');

      expect(result).toBe('Start Middle End');
    });
  });

  describe('Leading special character removal', () => {
    it('should remove leading equals signs', () => {
      const result = pipe.transform('== Menu Item');

      expect(result).toBe('Menu Item');
    });

    it('should remove leading dashes', () => {
      const result = pipe.transform('-- Menu Item');

      expect(result).toBe('Menu Item');
    });

    it('should remove leading underscores', () => {
      const result = pipe.transform('__Menu Item');

      expect(result).toBe('Menu Item');
    });

    it('should remove leading pipes', () => {
      const result = pipe.transform('|| Menu Item');

      expect(result).toBe('Menu Item');
    });

    it('should remove leading mixed special characters', () => {
      const result = pipe.transform('=-_| Menu Item');

      expect(result).toBe('Menu Item');
    });
  });

  describe('Trailing special character removal', () => {
    it('should remove trailing equals signs', () => {
      const result = pipe.transform('Menu Item ==');

      expect(result).toBe('Menu Item');
    });

    it('should remove trailing dashes', () => {
      const result = pipe.transform('Menu Item --');

      expect(result).toBe('Menu Item');
    });

    it('should remove trailing underscores', () => {
      const result = pipe.transform('Menu Item__');

      expect(result).toBe('Menu Item');
    });

    it('should remove trailing pipes', () => {
      const result = pipe.transform('Menu Item||');

      expect(result).toBe('Menu Item');
    });

    it('should remove trailing mixed special characters', () => {
      const result = pipe.transform('Menu Item =-_|');

      expect(result).toBe('Menu Item');
    });
  });

  describe('Underscore and pipe replacement', () => {
    it('should replace underscores with spaces', () => {
      const result = pipe.transform('Test_Menu_Item');

      expect(result).toBe('Test Menu Item');
    });

    it('should replace pipes with spaces', () => {
      const result = pipe.transform('Test|Menu|Item');

      expect(result).toBe('Test Menu Item');
    });

    it('should replace mixed underscores and pipes with spaces', () => {
      const result = pipe.transform('Test_Menu|Item');

      expect(result).toBe('Test Menu Item');
    });
  });

  describe('Whitespace cleanup', () => {
    it('should collapse multiple spaces into one', () => {
      const result = pipe.transform('Test   Menu   Item');

      expect(result).toBe('Test Menu Item');
    });

    it('should trim leading whitespace', () => {
      const result = pipe.transform('   Menu Item');

      expect(result).toBe('Menu Item');
    });

    it('should trim trailing whitespace', () => {
      const result = pipe.transform('Menu Item   ');

      expect(result).toBe('Menu Item');
    });

    it('should handle tabs and mixed whitespace', () => {
      const result = pipe.transform('Menu \t Item');

      expect(result).toBe('Menu Item');
    });
  });

  describe('Case preservation', () => {
    it('should preserve original mixed casing', () => {
      const result = pipe.transform('OnSite Module Menu');

      expect(result).toBe('OnSite Module Menu');
    });

    it('should preserve all uppercase text', () => {
      const result = pipe.transform('TEST MENU');

      expect(result).toBe('TEST MENU');
    });

    it('should preserve all lowercase text', () => {
      const result = pipe.transform('test menu');

      expect(result).toBe('test menu');
    });

    it('should preserve camelCase text', () => {
      const result = pipe.transform('camelCaseText');

      expect(result).toBe('camelCaseText');
    });
  });

  describe('Slash-separated words', () => {
    it('should preserve slashes between words', () => {
      const result = pipe.transform('Donation/Procedure Mapping');

      expect(result).toBe('Donation/Procedure Mapping');
    });

    it('should preserve slashes in lowercase text', () => {
      const result = pipe.transform('donation/procedure mapping');

      expect(result).toBe('donation/procedure mapping');
    });
  });

  describe('Combined transformations', () => {
    it('should handle mixed special characters and arrow patterns', () => {
      const result = pipe.transform('Test_Menu = > Item->');

      expect(result).toBe('Test Menu Item');
    });

    it('should clean special characters from uppercase text', () => {
      const result = pipe.transform('TEST_MENU|ITEM');

      expect(result).toBe('TEST MENU ITEM');
    });

    it('should remove arrows from uppercase text', () => {
      const result = pipe.transform('TEST MENU = >');

      expect(result).toBe('TEST MENU');
    });

    it('should handle leading specials with arrow and trailing specials', () => {
      const result = pipe.transform('== Start => End ==');

      expect(result).toBe('Start End');
    });

    it('should handle a value that becomes empty after all replacements', () => {
      const result = pipe.transform('___');

      expect(result).toBe('');
    });

    it('should handle single underscore', () => {
      const result = pipe.transform('_');

      expect(result).toBe('');
    });

    it('should handle single pipe', () => {
      const result = pipe.transform('|');

      expect(result).toBe('');
    });
  });

  describe('Numeric and alphanumeric text', () => {
    it('should preserve numbers', () => {
      const result = pipe.transform('12345');

      expect(result).toBe('12345');
    });

    it('should preserve alphanumeric text', () => {
      const result = pipe.transform('Item 123 Test');

      expect(result).toBe('Item 123 Test');
    });
  });

  describe('Real-world examples', () => {
    it('should format "Laboratory Functions = >" correctly', () => {
      expect(pipe.transform('Laboratory Functions = >')).toBe('Laboratory Functions');
    });

    it('should preserve "Product Management Functions" as-is', () => {
      expect(pipe.transform('Product Management Functions')).toBe('Product Management Functions');
    });

    it('should preserve "OnSite Module Menu" as-is', () => {
      expect(pipe.transform('OnSite Module Menu')).toBe('OnSite Module Menu');
    });

    it('should preserve "Set Drive Date and ID" as-is', () => {
      expect(pipe.transform('Set Drive Date and ID')).toBe('Set Drive Date and ID');
    });

    it('should preserve "Donor Functions" as-is', () => {
      expect(pipe.transform('Donor Functions')).toBe('Donor Functions');
    });

    it('should preserve "Application Interfaces" as-is', () => {
      expect(pipe.transform('Application Interfaces')).toBe('Application Interfaces');
    });

    it('should preserve "Blood Centers API" as-is', () => {
      expect(pipe.transform('Blood Centers API')).toBe('Blood Centers API');
    });

    it('should preserve "Application Administration" as-is', () => {
      expect(pipe.transform('Application Administration')).toBe('Application Administration');
    });

    it('should preserve "System Administration" as-is', () => {
      expect(pipe.transform('System Administration')).toBe('System Administration');
    });

    it('should preserve "Donation/Procedure Mapping" as-is', () => {
      expect(pipe.transform('Donation/Procedure Mapping')).toBe('Donation/Procedure Mapping');
    });
  });
});
