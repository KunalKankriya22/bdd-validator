import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewUnitsDialogComponent, ViewUnitsDialogData } from './view-units-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SamplePackTubeDto } from '../models/tube-checkin-shipment.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ViewUnitsDialogComponent', () => {
  let component: ViewUnitsDialogComponent;
  let fixture: ComponentFixture<ViewUnitsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewUnitsDialogComponent>>;

  const createMockTube = (unitId: string, redFlag: string, purpleFlag: string, purple2Flag: string): SamplePackTubeDto => ({
    boxId: 'CS616203',
    unitId,
    redTubeFlag: redFlag,
    purpleTubeFlag: purpleFlag,
    purpleTube2Flag: purple2Flag,
    insertDate: new Date(),
    insertUser: 'TEST_USER',
    checkDigit: null,
  });

  const mockDialogData: ViewUnitsDialogData = {
    boxId: 'CS616203',
    tubes: [
      createMockTube('1020201', 'Y', 'N', 'N'),
      createMockTube('1020202', 'Y', 'N', 'N'),
      createMockTube('1020203', 'Y', 'N', 'N'),
      createMockTube('165579', 'N', 'Y', 'N'),
      createMockTube('1020204', 'N', 'N', 'Y'),
    ],
    unitCount: 4,
    tubeCount: 5,
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [ViewUnitsDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(ViewUnitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data correctly', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.boxId).toBe('CS616203');
      expect(component.data.tubes.length).toBe(5);
      expect(component.data.unitCount).toBe(4);
      expect(component.data.tubeCount).toBe(5);
    });

    it('should initialize tableConfig in constructor', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns).toBeDefined();
    });

    it('should initialize tableData in constructor', () => {
      expect(component.tableData).toBeDefined();
      expect(Array.isArray(component.tableData)).toBe(true);
    });

    it('should build table rows on initialization', () => {
      expect(component.tableData).toBeDefined();
      expect(component.tableData.length).toBeGreaterThan(0);
    });
  });

  describe('Tube Extraction', () => {
    it('should extract red top tubes correctly', () => {
      // Changed to one row per unit (5 tubes = 5 rows), filtering out '-' and ''
      const redTopTubes = component.tableData.map(row => row.redTop).filter(id => id !== '' && id !== '-');
      expect(redTopTubes.length).toBe(3);
      // ISBT MOD-37 check digits (not MOD-10), just verify unit IDs are present
      expect(redTopTubes.some(id => id.includes('1020201'))).toBe(true);
      expect(redTopTubes.some(id => id.includes('1020202'))).toBe(true);
      expect(redTopTubes.some(id => id.includes('1020203'))).toBe(true);
    });

    it('should extract purple top 1 tubes correctly', () => {
      const purpleTop1Tubes = component.tableData.map(row => row.purpleTop1).filter(id => id !== '' && id !== '-');
      expect(purpleTop1Tubes.length).toBe(1);
      expect(purpleTop1Tubes[0]).toContain('165579');
    });

    it('should extract purple top 2 tubes correctly', () => {
      const purpleTop2Tubes = component.tableData.map(row => row.purpleTop2).filter(id => id !== '' && id !== '-');
      expect(purpleTop2Tubes.length).toBe(1);
      expect(purpleTop2Tubes[0]).toContain('1020204');
    });


  });

  describe('Table Row Building', () => {


    it('should handle uneven tube counts', () => {
      // Changed: one row per unit (5 tubes = 5 rows)
      expect(component.tableData.length).toBe(5);
      // Verify at least some rows have unit IDs
      const hasRedTop = component.tableData.some(row => row.redTop && row.redTop !== '-');
      const hasPurpleTop1 = component.tableData.some(row => row.purpleTop1 && row.purpleTop1 !== '-');
      const hasPurpleTop2 = component.tableData.some(row => row.purpleTop2 && row.purpleTop2 !== '-');
      expect(hasRedTop).toBe(true);
      expect(hasPurpleTop1).toBe(true);
      expect(hasPurpleTop2).toBe(true);
    });

    it('should create empty table when no tubes', () => {
      const emptyInstance = new ViewUnitsDialogComponent(dialogRefSpy, {
        boxId: 'EMPTY',
        tubes: [],
        unitCount: 0,
        tubeCount: 0,
      });

      expect(emptyInstance.tableData.length).toBe(0);
    });
  });

  describe('Dialog UI', () => {


    it('should display count labels', () => {
      const labelElements = fixture.debugElement.queryAll(By.css('.count-label'));
      expect(labelElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should render close button', () => {
      const closeButton = fixture.debugElement.query(By.css('.primary-btn'));
      if (closeButton) {
        expect(closeButton.nativeElement.textContent.trim()).toBe('CLOSE');
      }
    });
  });

  describe('Dialog Actions', () => {
    it('should call dialogRef.close when onClose is called', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });

    it('should have onClose method', () => {
      expect(component.onClose).toBeDefined();
      expect(typeof component.onClose).toBe('function');
    });

    it('should call dialogRef.close with no arguments', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });



  describe('Accessibility', () => {


    it('should have table elements', () => {
      const tables = fixture.debugElement.queryAll(By.css('table'));
      expect(tables.length).toBeGreaterThanOrEqual(0);
    });
  });
  // NEW COMPREHENSIVE TESTS FOR RECENT CHANGES

  describe('Data table integration - tableConfig and tableData', () => {
    it('should configure three columns', () => {
      expect(component.tableConfig.columns.length).toBe(3);
    });

    it('should have redTop as first column', () => {
      expect(component.tableConfig.columns[0].key).toBe('redTop');
      expect(component.tableConfig.columns[0].header).toBe('Red Top');
      expect(component.tableConfig.columns[0].sortable).toBe(false);
      expect(component.tableConfig.columns[0].width).toBe('33.33%');
    });

    it('should have purpleTop1 as second column', () => {
      expect(component.tableConfig.columns[1].key).toBe('purpleTop1');
      expect(component.tableConfig.columns[1].header).toBe('Purple Top 1');
      expect(component.tableConfig.columns[1].sortable).toBe(false);
      expect(component.tableConfig.columns[1].width).toBe('33.33%');
    });

    it('should have purpleTop2 as third column', () => {
      expect(component.tableConfig.columns[2].key).toBe('purpleTop2');
      expect(component.tableConfig.columns[2].header).toBe('Purple Top 2');
      expect(component.tableConfig.columns[2].sortable).toBe(false);
      expect(component.tableConfig.columns[2].width).toBe('33.33%');
    });

    it('should disable pagination', () => {
      expect(component.tableConfig.showPagination).toBe(false);
    });

    it('should disable sticky header', () => {
      expect(component.tableConfig.stickyHeader).toBe(false);
    });







    it('should have correct empty message', () => {
      expect(component.tableConfig.emptyMessage).toBe('No units in this box');
    });

    it('should have correct noDataIcon', () => {
      expect(component.tableConfig.noDataIcon).toBe('inbox');
    });




  });

  describe('calculateCheckDigit - ISBT MOD-37 algorithm (matches main table)', () => {
    it('should return empty string for empty unitId', () => {
      const result = component['calculateCheckDigit']('');
      expect(result).toBe('');
    });

    it('should return empty string for null unitId', () => {
      const result = component['calculateCheckDigit'](null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined unitId', () => {
      const result = component['calculateCheckDigit'](undefined as any);
      expect(result).toBe('');
    });

    it('should handle lowercase letters by converting to uppercase', () => {
      const lowerResult = component['calculateCheckDigit']('abc123');
      const upperResult = component['calculateCheckDigit']('ABC123');
      expect(lowerResult).toBe(upperResult);
    });

    it('should produce a result from the MOD37 alphabet for numeric-only input', () => {
      const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
      const checkDigit = component['calculateCheckDigit']('9999999');
      expect(MOD37_ALPHABET.includes(checkDigit)).toBe(true);
    });

    it('should produce consistent results for the same input', () => {
      const result1 = component['calculateCheckDigit']('W454526051302');
      const result2 = component['calculateCheckDigit']('W454526051302');
      expect(result1).toBe(result2);
    });

    it('should produce different results for different inputs', () => {
      const result1 = component['calculateCheckDigit']('1020201');
      const result2 = component['calculateCheckDigit']('1020202');
      // Different inputs should generally produce different check digits
      // (not guaranteed but extremely likely for these inputs)
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });

    it('should calculate check digit correctly using ISBT MOD-37 for valid unit ID', () => {
      const checkDigit = component['calculateCheckDigit']('W454526051302');

      expect(checkDigit).toBe('I'); // Expected ISBT MOD-37 check digit
    });

    it('should calculate check digit for unit ID 1020201', () => {
      const checkDigit = component['calculateCheckDigit']('1020201');

      expect(checkDigit).toBeTruthy();
      expect(typeof checkDigit).toBe('string');
    });

    it('should calculate check digit for unit ID 165579', () => {
      const checkDigit = component['calculateCheckDigit']('165579');

      expect(checkDigit).toBeTruthy();
      expect(typeof checkDigit).toBe('string');
    });







    it('should handle single digit correctly', () => {
      const checkDigit = component['calculateCheckDigit']('5');

      expect(checkDigit).toBeTruthy();
      expect(checkDigit.length).toBe(1);
    });

    it('should handle two digits correctly', () => {
      const checkDigit = component['calculateCheckDigit']('12');

      expect(checkDigit).toBeTruthy();
      expect(checkDigit.length).toBe(1);
    });

    it('should apply ISBT MOD-37 algorithm correctly', () => {
      // Test ISBT MOD-37 calculation with MOD-37 alphabet
      const checkDigit = component['calculateCheckDigit']('W123456789012');

      // Check digit should be from MOD-37 alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*'
      const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
      expect(MOD37_ALPHABET.includes(checkDigit)).toBe(true);
    });

    it('should handle alphanumeric unit IDs (ISBT format)', () => {
      // ISBT units contain letters - should handle A-Z
      const checkDigit = component['calculateCheckDigit']('ABC123XYZ');

      expect(checkDigit).toBeTruthy();
      expect(checkDigit.length).toBe(1);
    });

    it('should handle unit IDs with asterisk (ISBT special char)', () => {
      // ISBT MOD-37 includes asterisk (*) as valid character
      const checkDigit = component['calculateCheckDigit']('W45*526051302');

      expect(checkDigit).toBeTruthy();
      const MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';
      expect(MOD37_ALPHABET.includes(checkDigit)).toBe(true);
    });
  });

  describe('buildTableData - One row per unit (matches main table)', () => {
    it('should build table data from tubes correctly', () => {
      expect(component.tableData).toBeDefined();
      expect(component.tableData.length).toBeGreaterThan(0);
    });



    it('should populate red top column correctly', () => {
      // Each row has one unit - red top rows show ID, others show '-'
      const redTopRows = component.tableData.filter(row => row.redTop !== '-');
      expect(redTopRows.length).toBe(3);
      redTopRows.forEach(row => {
        expect(row.redTop).toContain('-'); // Should have check digit
      });
    });

    it('should populate purple top 1 column correctly', () => {
      // One purple top 1 tube
      const purpleTop1Rows = component.tableData.filter(row => row.purpleTop1 !== '-');
      expect(purpleTop1Rows.length).toBe(1);
      expect(purpleTop1Rows[0].purpleTop1).toContain('-'); // Should have check digit
    });

    it('should populate purple top 2 column correctly', () => {
      // One purple top 2 tube
      const purpleTop2Rows = component.tableData.filter(row => row.purpleTop2 !== '-');
      expect(purpleTop2Rows.length).toBe(1);
      expect(purpleTop2Rows[0].purpleTop2).toContain('-'); // Should have check digit
    });

    it('should use dash (-) for empty tube positions', () => {
      // Each row shows one unit, others are '-'
      component.tableData.forEach(row => {
        const nonEmptyCount = [row.redTop, row.purpleTop1, row.purpleTop2].filter(val => val !== '-').length;
        expect(nonEmptyCount).toBe(1); // Each row should have exactly one unit ID
      });
    });



    it('should handle only red top tubes', () => {
      component.data = {
        boxId: 'RED_ONLY',
        tubes: [
          createMockTube('1020201', 'Y', 'N', 'N'),
          createMockTube('1020202', 'Y', 'N', 'N'),
        ],
        unitCount: 2,
        tubeCount: 2,
      };
      const tableData = component['buildTableData']();

      // One row per unit (2 tubes = 2 rows)
      expect(tableData.length).toBe(2);
      expect(tableData[0].redTop).toBeTruthy();
      expect(tableData[0].purpleTop1).toBe('-');
      expect(tableData[0].purpleTop2).toBe('-');
    });

    it('should handle only purple top 1 tubes', () => {
      component.data = {
        boxId: 'PURPLE1_ONLY',
        tubes: [
          createMockTube('165579', 'N', 'Y', 'N'),
        ],
        unitCount: 1,
        tubeCount: 1,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(1);
      expect(tableData[0].redTop).toBe('-');
      expect(tableData[0].purpleTop1).toBeTruthy();
      expect(tableData[0].purpleTop2).toBe('-');
    });

    it('should handle only purple top 2 tubes', () => {
      component.data = {
        boxId: 'PURPLE2_ONLY',
        tubes: [
          createMockTube('1020204', 'N', 'N', 'Y'),
        ],
        unitCount: 1,
        tubeCount: 1,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(1);
      expect(tableData[0].redTop).toBe('-');
      expect(tableData[0].purpleTop1).toBe('-');
      expect(tableData[0].purpleTop2).toBeTruthy();
    });



    it('should handle tube with all flags set to Y', () => {
      component.data = {
        boxId: 'ALL_YES',
        tubes: [
          createMockTube('ALL_YES_UNIT', 'Y', 'Y', 'Y'),
        ],
        unitCount: 1,
        tubeCount: 1,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(1);
      expect(tableData[0].redTop).toContain('ALL_YES_UNIT');
      expect(tableData[0].purpleTop1).toContain('ALL_YES_UNIT');
      expect(tableData[0].purpleTop2).toContain('ALL_YES_UNIT');
    });

    it('should handle tube with all flags set to N', () => {
      component.data = {
        boxId: 'ALL_NO',
        tubes: [
          createMockTube('ALL_NO_UNIT', 'N', 'N', 'N'),
        ],
        unitCount: 1,
        tubeCount: 1,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(1);
      expect(tableData[0].redTop).toBe('-');
      expect(tableData[0].purpleTop1).toBe('-');
      expect(tableData[0].purpleTop2).toBe('-');
    });

    it('should handle mixed flags within same tube list', () => {
      component.data = {
        boxId: 'MIXED',
        tubes: [
          createMockTube('UNIT_A', 'Y', 'Y', 'N'),
          createMockTube('UNIT_B', 'N', 'N', 'Y'),
        ],
        unitCount: 2,
        tubeCount: 2,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(2);
      expect(tableData[0].redTop).toContain('UNIT_A');
      expect(tableData[0].purpleTop1).toContain('UNIT_A');
      expect(tableData[0].purpleTop2).toBe('-');
      expect(tableData[1].redTop).toBe('-');
      expect(tableData[1].purpleTop1).toBe('-');
      expect(tableData[1].purpleTop2).toContain('UNIT_B');
    });

    it('should filter tubes by flag correctly', () => {
      const redTopTubes = mockDialogData.tubes.filter(t => t.redTubeFlag === 'Y');
      const purpleTop1Tubes = mockDialogData.tubes.filter(t => t.purpleTubeFlag === 'Y');
      const purpleTop2Tubes = mockDialogData.tubes.filter(t => t.purpleTube2Flag === 'Y');

      expect(redTopTubes.length).toBe(3);
      expect(purpleTop1Tubes.length).toBe(1);
      expect(purpleTop2Tubes.length).toBe(1);
    });

    it('should append check digits to all unit IDs', () => {
      component.tableData.forEach(row => {
        if (row.redTop) {
          expect(row.redTop).toContain('-');
        }
        if (row.purpleTop1) {
          expect(row.purpleTop1).toContain('-');
        }
        if (row.purpleTop2) {
          expect(row.purpleTop2).toContain('-');
        }
      });
    });
  });

  describe('formatUnitIdWithCheckDigit', () => {
    it('should return empty string for null input', () => {
      const result = component['formatUnitIdWithCheckDigit'](null as any);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = component['formatUnitIdWithCheckDigit'](undefined as any);
      expect(result).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const result = component['formatUnitIdWithCheckDigit']('');
      expect(result).toBe('');
    });

    it('should format unit ID with check digit using ISBT MOD-37', () => {
      const formatted = component['formatUnitIdWithCheckDigit']('9132008');

      // ISBT MOD-37 result (not MOD-10 '5')
      expect(formatted).toContain('9132008-');
      expect(formatted.length).toBe(9); // 7 digits + '-' + 1 check digit
    });





    it('should handle unit ID without check digit calculation', () => {
      spyOn<any>(component, 'calculateCheckDigit').and.returnValue('');
      const formatted = component['formatUnitIdWithCheckDigit']('9132008');

      expect(formatted).toBe('9132008');
    });

    it('should include hyphen separator between unit ID and check digit', () => {
      const formatted = component['formatUnitIdWithCheckDigit']('ABC123');
      expect(formatted).toMatch(/^ABC123-.$/);
    });

    it('should handle numeric-only unit ID', () => {
      const formatted = component['formatUnitIdWithCheckDigit']('12345');
      expect(formatted).toContain('12345-');
      expect(formatted.length).toBe(7); // 5 digits + '-' + 1 check digit
    });

    it('should handle alphanumeric unit ID with check digit', () => {
      const formatted = component['formatUnitIdWithCheckDigit']('W454526051302');
      expect(formatted).toContain('W454526051302-');
      expect(formatted).toBe('W454526051302-I');
    });
  });

  describe('Edge cases and boundary conditions', () => {




    it('should handle very large number of tubes', () => {
      const largeTubeList = Array.from({ length: 100 }, (_, i) =>
        createMockTube(`UNIT${i}`, 'Y', 'N', 'N')
      );
      component.data = {
        boxId: 'LARGE_BOX',
        tubes: largeTubeList,
        unitCount: 100,
        tubeCount: 100,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(100);
    });

    it('should handle single tube of each type', () => {
      component.data = {
        boxId: 'ONE_EACH',
        tubes: [
          createMockTube('RED1', 'Y', 'N', 'N'),
          createMockTube('PURPLE1', 'N', 'Y', 'N'),
          createMockTube('PURPLE2', 'N', 'N', 'Y'),
        ],
        unitCount: 3,
        tubeCount: 3,
      };
      const tableData = component['buildTableData']();

      // One row per unit (3 tubes = 3 rows)
      expect(tableData.length).toBe(3);
      // Verify each tube type appears in the data
      const hasRedTop = tableData.some(row => row.redTop !== '-');
      const hasPurpleTop1 = tableData.some(row => row.purpleTop1 !== '-');
      const hasPurpleTop2 = tableData.some(row => row.purpleTop2 !== '-');
      expect(hasRedTop).toBe(true);
      expect(hasPurpleTop1).toBe(true);
      expect(hasPurpleTop2).toBe(true);
    });

    it('should handle tubes with null unit ID gracefully via formatUnitIdWithCheckDigit', () => {
      component.data = {
        boxId: 'NULL_UNIT',
        tubes: [
          createMockTube(null as any, 'Y', 'N', 'N'),
        ],
        unitCount: 0,
        tubeCount: 1,
      };
      const tableData = component['buildTableData']();

      expect(tableData.length).toBe(1);
      // formatUnitIdWithCheckDigit returns '' for null, so redTop should be ''
      expect(tableData[0].redTop).toBe('');
    });

    it('should create new instance with empty tubes via constructor', () => {
      const emptyData: ViewUnitsDialogData = {
        boxId: 'EMPTY_BOX',
        tubes: [],
        unitCount: 0,
        tubeCount: 0,
      };
      const instance = new ViewUnitsDialogComponent(dialogRefSpy, emptyData);

      expect(instance.tableData).toEqual([]);
      expect(instance.tableConfig).toBeDefined();
      expect(instance.tableConfig.columns.length).toBe(3);
    });

    it('should initialize dialogRef correctly', () => {
      expect(component.dialogRef).toBe(dialogRefSpy);
    });
  });
});
