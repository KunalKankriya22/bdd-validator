import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { DonationsTabComponent, Sort } from './donations-tab.component';
import { DonationRecord } from '../../models/interdiction-query.model';

describe('DonationsTabComponent', () => {
  let component: DonationsTabComponent;
  let fixture: ComponentFixture<DonationsTabComponent>;

  const mockDonations: DonationRecord[] = [
    {
      transactionId: 'TXN001',
      unitId: 'UNIT001',
      collectionDate: '2026-01-15',
      driveId: 'DRV001',
      donationType: 'WB',
      procedureCode: 'PROC01',
      interdiction: 'INT001',
      effectiveDate: '2026-01-15',
      terminationDate: '2026-12-31',
      releaseDate: '2026-02-01',
      releaseUser: 'USER001',
      origin: 'SYSTEM',
      reason: 'Test reason',
      interdictionType: 'TYPE1',
      interdictionCustody: 'CUSTODY1',
      donorId: 'DONOR001',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'M'
    },
    {
      transactionId: 'TXN002',
      unitId: 'UNIT002',
      collectionDate: '2026-02-20',
      driveId: 'DRV002',
      donationType: 'PLT',
      procedureCode: 'PROC02',
      interdiction: 'INT002',
      effectiveDate: '2026-02-20',
      terminationDate: '2026-11-30',
      origin: 'MANUAL',
      reason: 'Another reason',
      interdictionType: 'TYPE2',
      interdictionCustody: 'CUSTODY2',
      donorId: 'DONOR002',
      name: 'Jane Smith',
      dateOfBirth: '1985-05-15',
      gender: 'F'
    }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [DonationsTabComponent, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonationsTabComponent);
    component = fixture.componentInstance;


    });
  describe('Column Display', () => {
    it('should display interdiction columns when optionType is Interdiction', () => {
      component.optionType = 'Interdiction';
      expect(component.donationsColumns).toEqual(component.interdictionColumns);
    });

    it('should display hold columns when optionType is Hold', () => {
      component.optionType = 'Hold';
      expect(component.donationsColumns).toEqual(component.holdColumns);
    });


    it('should include expand column only for interdiction type', () => {
      component.optionType = 'Interdiction';
      expect(component.donationsColumns).toContain('expand');

      component.optionType = 'Hold';
      expect(component.donationsColumns).not.toContain('expand');
    });

    it('should include driveId column only for hold type', () => {
      component.optionType = 'Hold';
      expect(component.donationsColumns).toContain('driveId');

      component.optionType = 'Interdiction';
      expect(component.donationsColumns).not.toContain('driveId');
    });
  });

  describe('Row Expansion', () => {
    it('should check if row is expanded', () => {
      component.expandedRows = new Set(['UNIT001']);

      expect(component.isRowExpanded('UNIT001')).toBeTrue();
      expect(component.isRowExpanded('UNIT002')).toBeFalse();
    });

    it('should return false for expanded check when expandedRows is empty', () => {
      component.expandedRows = new Set();

      expect(component.isRowExpanded('UNIT001')).toBeFalse();
    });


    it('should emit toggle event for different unit IDs', () => {
      spyOn(component.toggleRow, 'emit');

      component.onToggleRow('UNIT001');
      component.onToggleRow('UNIT002');
      component.onToggleRow('UNIT003');

      expect(component.toggleRow.emit).toHaveBeenCalledTimes(3);
      expect(component.toggleRow.emit).toHaveBeenCalledWith('UNIT001');
      expect(component.toggleRow.emit).toHaveBeenCalledWith('UNIT002');
      expect(component.toggleRow.emit).toHaveBeenCalledWith('UNIT003');
    });

    it('should handle empty unitId in toggle', () => {
      spyOn(component.toggleRow, 'emit');

      component.onToggleRow('');

      expect(component.toggleRow.emit).toHaveBeenCalledWith('');
    });

    it('should work with multiple expanded rows', () => {
      component.expandedRows = new Set(['UNIT001', 'UNIT002', 'UNIT003']);

      expect(component.isRowExpanded('UNIT001')).toBeTrue();
      expect(component.isRowExpanded('UNIT002')).toBeTrue();
      expect(component.isRowExpanded('UNIT003')).toBeTrue();
      expect(component.isRowExpanded('UNIT004')).toBeFalse();
    });

    it('should check if all rows are expanded', () => {
      component.donations = mockDonations;
      component.expandedRows = new Set(['UNIT001', 'UNIT002']);

      expect(component.allExpanded).toBeTrue();
    });

    it('should return false when not all rows are expanded', () => {
      component.donations = mockDonations;
      component.expandedRows = new Set(['UNIT001']);

      expect(component.allExpanded).toBeFalse();
    });

    it('should check if some rows are expanded', () => {
      component.donations = mockDonations;
      component.expandedRows = new Set(['UNIT001']);

      expect(component.someExpanded).toBeTrue();
    });


  });

  describe('Sorting', () => {


    it('should toggle back to asc when sorted desc', () => {
      spyOn(component.sortChange, 'emit');
      component.currentSort = { active: 'unitId', direction: 'desc' };

      component.onToggleSort('unitId');

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        active: 'unitId',
        direction: 'asc'
      });
    });

    it('should default to desc when sorting a new column', () => {
      spyOn(component.sortChange, 'emit');
      component.currentSort = { active: 'unitId', direction: 'asc' };

      component.onToggleSort('collectionDate');

      expect(component.sortChange.emit).toHaveBeenCalledWith({
        active: 'collectionDate',
        direction: 'desc'
      });
    });




    it('should return unfold_more when currentSort is null', () => {
      component.currentSort = null;

      expect(component.getSortIcon('unitId')).toBe('unfold_more');
    });
  });

  describe('ngOnChanges', () => {
    it('should handle donations changes', () => {
      const changes = {
        donations: new SimpleChange(null, mockDonations, true)
      };

      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('should handle changes to other inputs', () => {
      const changes = {
        loading: new SimpleChange(false, true, false)
      };

      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });
  });

  describe('Input Bindings', () => {

    it('should accept expandedRows input', () => {
      const expandedSet = new Set(['UNIT001', 'UNIT002']);
      component.expandedRows = expandedSet;
      expect(component.expandedRows.size).toBe(2);
    });

    it('should accept optionType input', () => {
      component.optionType = 'Hold';
      expect(component.optionType).toBe('Hold');
    });

    it('should accept currentSort input', () => {
      const sort: Sort = { active: 'unitId', direction: 'asc' };
      component.currentSort = sort;
      expect(component.currentSort).toEqual(sort);
    });

    it('should accept loading input', () => {
      component.loading = true;
      expect(component.loading).toBeTrue();
    });



    it('should handle empty expandedRows set', () => {
      component.expandedRows = new Set();
      expect(component.expandedRows.size).toBe(0);
    });
  });

  describe('Output Emissions', () => {
    it('should emit toggleRow events', (done) => {
      component.toggleRow.subscribe(unitId => {
        expect(unitId).toBe('UNIT001');
        done();
      });

      component.onToggleRow('UNIT001');
    });


    it('should emit multiple toggle events', () => {
      const emittedValues: string[] = [];
      component.toggleRow.subscribe(unitId => emittedValues.push(unitId));

      component.onToggleRow('UNIT001');
      component.onToggleRow('UNIT002');
      component.onToggleRow('UNIT003');

      expect(emittedValues).toEqual(['UNIT001', 'UNIT002', 'UNIT003']);
    });
  });

  describe('Display Value Formatting', () => {
    it('should return dash for null values', () => {
      expect(component.displayValue(null)).toBe('-');
    });

    it('should return dash for undefined values', () => {
      expect(component.displayValue(undefined)).toBe('-');
    });



    it('should return the value as string for valid values', () => {
      expect(component.displayValue('Test')).toBe('Test');
      expect(component.displayValue(123)).toBe('123');
      expect(component.displayValue(true)).toBe('true');
    });
  });

  describe('Edge Cases', () => {

    it('should handle donation records with missing optional fields', () => {
      const minimalDonation: DonationRecord = {
        transactionId: 'TXN003',
        unitId: 'UNIT003',
        collectionDate: '2026-03-01',
        donationType: 'RBC',
        procedureCode: 'PROC03',
        interdiction: 'INT003',
        effectiveDate: '2026-03-01',
        terminationDate: '2026-12-31',
        origin: 'SYSTEM',
        reason: 'Reason',
        interdictionType: 'TYPE',
        interdictionCustody: 'CUSTODY',
        donorId: 'DONOR003',
        name: 'Test Donor',
        dateOfBirth: '1995-01-01',
        gender: 'M'
      };

      component.donations = [minimalDonation];
      expect(component.donations[0].releaseDate).toBeUndefined();
      expect(component.donations[0].releaseUser).toBeUndefined();
    });

    it('should handle rapid optionType changes', () => {
      for (let i = 0; i < 100; i++) {
        component.optionType = i % 2 === 0 ? 'Interdiction' : 'Hold';
      }

      expect(component.donationsColumns).toEqual(component.holdColumns);
    });

    it('should maintain expanded rows set reference', () => {
      const initialSet = new Set(['UNIT001']);
      component.expandedRows = initialSet;

      expect(component.expandedRows).toBe(initialSet);
    });

    it('should handle special characters in unitId', () => {
      spyOn(component.toggleRow, 'emit');

      component.onToggleRow('UNIT-001/A#123');

      expect(component.toggleRow.emit).toHaveBeenCalledWith('UNIT-001/A#123');
    });

    it('should handle very long unitId strings', () => {
      const longUnitId = 'U'.repeat(1000);
      spyOn(component.toggleRow, 'emit');

      component.onToggleRow(longUnitId);

      expect(component.toggleRow.emit).toHaveBeenCalledWith(longUnitId);
    });

    it('should handle null as unitId', () => {
      spyOn(component.toggleRow, 'emit');

      component.onToggleRow(null as any);

      expect(component.toggleRow.emit).toHaveBeenCalledWith(null as any);
    });

    it('should handle undefined in expandedRows check', () => {
      component.expandedRows = new Set(['UNIT001']);

      expect(component.isRowExpanded(undefined as any)).toBeFalse();
    });
  });
});
