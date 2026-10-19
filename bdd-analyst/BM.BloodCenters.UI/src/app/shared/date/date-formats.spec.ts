import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from './date-formats';
import { UppercaseMomentDateAdapter as DirectAdapter } from './uppercase-date-adapter';

describe('date-formats', () => {

  // ──────────────────────────────────────────────
  // DD_MON_YYYY_FORMATS structure
  // ──────────────────────────────────────────────
  describe('DD_MON_YYYY_FORMATS', () => {

    describe('parse configuration', () => {
      it('should have a parse.dateInput property', () => {
        expect(DD_MON_YYYY_FORMATS.parse).toBeDefined();
        expect(DD_MON_YYYY_FORMATS.parse.dateInput).toBeDefined();
      });

      it('should have dateInput as an array of format strings', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput;

        expect(Array.isArray(dateInput)).toBe(true);
        expect((dateInput as string[]).length).toBeGreaterThan(0);
      });

      it('should include DD-MMM-YYYY as the primary parse format', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput[0]).toBe('DD-MMM-YYYY');
      });

      it('should include YYYY-MMM-DD for year-first input support', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('YYYY-MMM-DD');
      });

      it('should include ISO format YYYY-MM-DD', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('YYYY-MM-DD');
      });

      it('should include MM-DD-YYYY numeric format', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('MM-DD-YYYY');
      });

      it('should include slash-separated formats', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('MM/DD/YYYY');
        expect(dateInput).toContain('DD/MMM/YYYY');
        expect(dateInput).toContain('YYYY/MM/DD');
      });

      it('should include dot-separated formats', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('MM.DD.YYYY');
        expect(dateInput).toContain('YYYY.MM.DD');
      });

      it('should include space-separated format DD MMM YYYY', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('DD MMM YYYY');
      });

      it('should include comma-separated formats with month names', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('MMM DD, YYYY');
        expect(dateInput).toContain('MMMM DD, YYYY');
      });

      it('should include compact no-separator formats', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput).toContain('MMDDYYYY');
        expect(dateInput).toContain('YYYYMMDD');
      });

      it('should not contain duplicate format entries', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];
        const uniqueFormats = new Set(dateInput);

        expect(uniqueFormats.size).toBe(dateInput.length);
      });

      it('should have at least 15 parse formats for broad input support', () => {
        const dateInput = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(dateInput.length).toBeGreaterThanOrEqual(15);
      });
    });

    describe('display configuration', () => {
      it('should have display.dateInput set to DD-MMM-YYYY', () => {
        expect(DD_MON_YYYY_FORMATS.display.dateInput).toBe('DD-MMM-YYYY');
      });

      it('should have display.monthYearLabel set to MMM YYYY', () => {
        expect(DD_MON_YYYY_FORMATS.display.monthYearLabel).toBe('MMM YYYY');
      });

      it('should have display.dateA11yLabel set to DD-MMM-YYYY', () => {
        expect(DD_MON_YYYY_FORMATS.display.dateA11yLabel).toBe('DD-MMM-YYYY');
      });

      it('should have display.monthYearA11yLabel set to MMMM YYYY', () => {
        expect(DD_MON_YYYY_FORMATS.display.monthYearA11yLabel).toBe('MMMM YYYY');
      });
    });

    describe('format consistency', () => {
      it('should use the same format for dateInput display and dateA11yLabel', () => {
        expect(DD_MON_YYYY_FORMATS.display.dateInput)
          .toBe(DD_MON_YYYY_FORMATS.display.dateA11yLabel);
      });

      it('should have the display format as first entry in the parse array', () => {
        const displayFormat = DD_MON_YYYY_FORMATS.display.dateInput as string;
        const parseFormats = DD_MON_YYYY_FORMATS.parse.dateInput as string[];

        expect(parseFormats[0]).toBe(displayFormat);
      });
    });
  });

  // ──────────────────────────────────────────────
  // Re-export of UppercaseMomentDateAdapter
  // ──────────────────────────────────────────────
  describe('UppercaseMomentDateAdapter re-export', () => {

    it('should be the same class as the direct import from uppercase-date-adapter', () => {
      expect(UppercaseMomentDateAdapter).toBe(DirectAdapter);
    });
  });
});
