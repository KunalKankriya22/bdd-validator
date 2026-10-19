import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { DetailViewTab } from './detail-view-tab';
import { DonorProfileAuditResultDto } from '../../models/donor-profile-audit-query.model';

describe('DetailViewTab', () => {
  let component: DetailViewTab;
  let fixture: ComponentFixture<DetailViewTab>;

  const mockAuditData: DonorProfileAuditResultDto[] = [
    {
      rowNum: 1,
      insertDate: '2025-01-15T10:30:00',
      insertUser: 'JOHN.DOE',
      programId: 'DPUVDAT',
      tableName: 'DONORS',
      dataDetails: 'Updated phone number',
      recNum: 12345,
      colNum: 1,
      detailsAvailable: true
    },
    {
      rowNum: 2,
      insertDate: '2025-01-14T14:20:00',
      insertUser: 'JANE.SMITH',
      programId: 'DONREG',
      tableName: 'DONOR_INTERDIC',
      dataDetails: 'Added deferral',
      recNum: 12346,
      colNum: 1,
      detailsAvailable: false
    }
  ];

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [DetailViewTab, NoopAnimationsModule],
      providers: [provideHttpClient()]
    });


    



    fixture = TestBed.createComponent(DetailViewTab);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should display audit data when provided', () => {
    component.auditData = mockAuditData;
    fixture.detectChanges();

    expect(component._auditData()).toEqual(mockAuditData);
    expect(component._auditData().length).toBe(2);
  });









  describe('Record Selection', () => {
    beforeEach(() => {
      component.auditData = mockAuditData;
      fixture.detectChanges();
    });

    it('should toggle record selection', () => {
      const spy = spyOn(component.selectionChange, 'emit');

      component.onToggleRecord(12345);

      expect(component._selectedRecords().has(12345)).toBe(true);
      expect(spy).toHaveBeenCalled();
    });







    it('should check if some records are selected', () => {
      expect(component.isSomeSelected()).toBe(false);

      component._selectedRecords.set(new Set([12345]));
      expect(component.isSomeSelected()).toBe(true);

      component._selectedRecords.set(new Set([12345, 12346]));
      expect(component.isSomeSelected()).toBe(false);
    });

    it('should toggle all records', () => {
      const spy = spyOn(component.selectionChange, 'emit');

      component.onToggleAll({ checked: true } as any);

      expect(component._selectedRecords().has(12345)).toBe(true);
      expect(component._selectedRecords().has(12346)).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('should deselect all records', () => {
      component._selectedRecords.set(new Set([12345, 12346]));

      component.onToggleAll({ checked: false } as any);

      expect(component._selectedRecords().size).toBe(0);
    });

    it('should emit selection change events', () => {
      const spy = spyOn(component.selectionChange, 'emit');

      component.onToggleRecord(12345);

      expect(spy).toHaveBeenCalledWith(jasmine.any(Set));
      const call = spy.calls.mostRecent();
      expect(call).toBeDefined();
      const selectedSet = call.args[0] as Set<number>;
      expect(selectedSet.has(12345)).toBe(true);
    });

    it('should accept selectedRecords input', () => {
      const selectedSet = new Set([12345]);
      component.selectedRecords = selectedSet;

      expect(component._selectedRecords()).toEqual(selectedSet);
    });
  });


  describe('Computed Signals - Oldest and Newest Insert Dates', () => {
    it('should compute oldest insert date from data', () => {
      const testData: DonorProfileAuditResultDto[] = [
        { ...mockAuditData[0], insertDate: '2025-01-20T10:00:00' },
        { ...mockAuditData[1], insertDate: '2025-01-10T10:00:00' },
        { rowNum: 3, insertDate: '2025-01-15T10:00:00', insertUser: 'USER', programId: 'PROG', tableName: 'TABLE', dataDetails: '', recNum: 12347, colNum: 1, detailsAvailable: true }
      ];

      component.auditData = testData;
      fixture.detectChanges();

      expect(component.oldestInsertDate()).toBe('2025-01-10T10:00:00');
    });

    it('should compute newest insert date from data', () => {
      const testData: DonorProfileAuditResultDto[] = [
        { ...mockAuditData[0], insertDate: '2025-01-20T10:00:00' },
        { ...mockAuditData[1], insertDate: '2025-01-10T10:00:00' },
        { rowNum: 3, insertDate: '2025-01-15T10:00:00', insertUser: 'USER', programId: 'PROG', tableName: 'TABLE', dataDetails: '', recNum: 12347, colNum: 1, detailsAvailable: true }
      ];

      component.auditData = testData;
      fixture.detectChanges();

      expect(component.newestInsertDate()).toBe('2025-01-20T10:00:00');
    });






  });

  describe('Search Text Filtering (Client-Side)', () => {
    const extendedMockData: DonorProfileAuditResultDto[] = [
      {
        rowNum: 1,
        insertDate: '2025-01-15T10:30:00',
        insertUser: 'JOHN.DOE',
        programId: 'DPUVDAT',
        tableName: 'DONORS',
        dataDetails: 'Updated phone number',
        recNum: 12345,
        colNum: 1,
        detailsAvailable: true
      },
      {
        rowNum: 2,
        insertDate: '2025-01-20T14:20:00',
        insertUser: 'JANE.SMITH',
        programId: 'DONREG',
        tableName: 'DONOR_INTERDIC',
        dataDetails: 'Added deferral',
        recNum: 12346,
        colNum: 1,
        detailsAvailable: false
      },
      {
        rowNum: 3,
        insertDate: '2025-01-10T09:15:00',
        insertUser: 'JOHN.DOE',
        programId: 'DONREG',
        tableName: 'DONATIONS',
        dataDetails: 'Recorded donation',
        recNum: 12347,
        colNum: 1,
        detailsAvailable: true
      }
    ];

    beforeEach(() => {
      component.auditData = extendedMockData;
      fixture.detectChanges();
    });



    it('should filter by search text on dataDetails', () => {
      component.searchText = 'phone';

      const sorted = component.sortedData();

      expect(sorted.length).toBe(1);
      expect(sorted[0].dataDetails).toContain('phone');
    });

    it('should handle case-insensitive search', () => {
      component.searchText = 'PHONE';

      const sorted = component.sortedData();

      expect(sorted.length).toBe(1);
      expect(sorted[0].dataDetails?.toLowerCase()).toContain('phone');
    });

    it('should return empty array when no records match search', () => {
      component.searchText = 'NONEXISTENT';

      const sorted = component.sortedData();

      expect(sorted.length).toBe(0);
    });
  });

  describe('hasAppliedFilters', () => {
    it('should return false when no filters applied', () => {
      component.appliedFilters = {};

      expect(component.hasAppliedFilters()).toBe(false);
    });

    it('should return true when fromDate filter applied', () => {
      component.appliedFilters = { fromDate: '2025-01-01' };

      expect(component.hasAppliedFilters()).toBe(true);
    });

    it('should return true when toDate filter applied', () => {
      component.appliedFilters = { toDate: '2025-01-31' };

      expect(component.hasAppliedFilters()).toBe(true);
    });

    it('should return true when insertedUser filter applied', () => {
      component.appliedFilters = { insertedUser: 'JOHN.DOE' };

      expect(component.hasAppliedFilters()).toBe(true);
    });

    it('should return true when multiple filters applied', () => {
      component.appliedFilters = {
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
        insertedUser: 'JOHN.DOE'
      };

      expect(component.hasAppliedFilters()).toBe(true);
    });
  });

  describe('Sorting with Search', () => {
    beforeEach(() => {
      const testData: DonorProfileAuditResultDto[] = [
        { rowNum: 1, insertDate: '2025-01-15T10:30:00', insertUser: 'JOHN.DOE', programId: 'DPUVDAT', tableName: 'DONORS', dataDetails: 'Detail 1', recNum: 12345, colNum: 1, detailsAvailable: true },
        { rowNum: 2, insertDate: '2025-01-20T14:20:00', insertUser: 'JANE.SMITH', programId: 'DONREG', tableName: 'DONOR_INTERDIC', dataDetails: 'Detail 2', recNum: 12348, colNum: 1, detailsAvailable: false },
        { rowNum: 3, insertDate: '2025-01-10T09:15:00', insertUser: 'JOHN.DOE', programId: 'DONREG', tableName: 'DONATIONS', dataDetails: 'Detail 3', recNum: 12346, colNum: 1, detailsAvailable: true }
      ];

      component.auditData = testData;
      fixture.detectChanges();
    });

    it('should sort search-filtered data in ascending order', () => {
      component.searchText = 'DONREG';
      component.sortDirection.set('asc');

      const sorted = component.sortedData();

      expect(sorted.length).toBe(2);
      expect(sorted[0].recNum).toBe(12346);
      expect(sorted[1].recNum).toBe(12348);
    });

    it('should sort search-filtered data in descending order', () => {
      component.searchText = 'DONREG';
      component.sortDirection.set('desc');

      const sorted = component.sortedData();

      expect(sorted.length).toBe(2);
      expect(sorted[0].recNum).toBe(12348);
      expect(sorted[1].recNum).toBe(12346);
    });
  });

  describe('Selection with Sorted Data', () => {
    beforeEach(() => {
      component.auditData = mockAuditData;
      fixture.detectChanges();
    });

    it('should check isAllSelected based on sorted data', () => {
      component.sortDirection.set('asc');
      const sorted = component.sortedData();

      component._selectedRecords.set(new Set(sorted.map(r => r.recNum)));

      expect(component.isAllSelected()).toBe(true);
    });

    it('should check isSomeSelected based on sorted data', () => {
      component.sortDirection.set('asc');
      const sorted = component.sortedData();

      component._selectedRecords.set(new Set([sorted[0].recNum]));

      expect(component.isSomeSelected()).toBe(true);
    });


  });

  describe('Input and Output Properties', () => {


    it('should accept and update totalCount', () => {
      component.totalCount = 150;
      expect(component._totalCount()).toBe(150);
    });

    it('should accept and update appliedFilters', () => {
      const filters = { insertedUser: 'JOHN.DOE', fromDate: '2025-01-01' };
      component.appliedFilters = filters;

      expect(component._appliedFilters()).toEqual(filters);
    });

    it('should accept and update searchText', () => {
      component.searchText = 'test search';
      expect(component._searchText()).toBe('test search');
    });

    it('should accept pagination properties', () => {
      component.pageSize = 50;
      component.pageIndex = 2;
      component.pageSizeOptions = [25, 50, 100];

      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
      expect(component.pageSizeOptions).toEqual([25, 50, 100]);
    });

    it('should accept filterChips input', () => {
      const chips = [
        { key: 'insertedUser', label: 'User: JOHN.DOE', value: 'JOHN.DOE' }
      ];

      component.filterChips = chips;

      expect(component.filterChips).toEqual(chips);
    });



    it('should accept insertedUsers input', () => {
      const users = ['JOHN.DOE', 'JANE.SMITH'];
      component.insertedUsers = users;

      expect(component.insertedUsers).toEqual(users);
    });


  });

  describe('Default Sort Direction', () => {


    it('should display data in ascending order by default', () => {
      component.auditData = mockAuditData;
      fixture.detectChanges();

      const sorted = component.sortedData();
      // With asc sort, lower recNum should come first
      expect(sorted[0].recNum).toBeLessThan(sorted[1].recNum);
    });
  });

  describe('Pagination with Filtered Data', () => {
    const extendedMockData: DonorProfileAuditResultDto[] = [
      {
        rowNum: 1,
        insertDate: '2025-01-15T10:30:00',
        insertUser: 'JOHN.DOE',
        programId: 'DPUVDAT',
        tableName: 'DONORS',
        dataDetails: 'Updated phone number',
        recNum: 12345,
        colNum: 1,
        detailsAvailable: true
      },
      {
        rowNum: 2,
        insertDate: '2025-01-14T14:20:00',
        insertUser: 'JANE.SMITH',
        programId: 'DONREG',
        tableName: 'DONOR_INTERDIC',
        dataDetails: 'Added deferral',
        recNum: 12346,
        colNum: 1,
        detailsAvailable: false
      },
      {
        rowNum: 3,
        insertDate: '2025-01-13T09:15:00',
        insertUser: 'JOHN.DOE',
        programId: 'DPUVDAT',
        tableName: 'DONATIONS',
        dataDetails: 'Recorded donation',
        recNum: 12347,
        colNum: 1,
        detailsAvailable: true
      },
      {
        rowNum: 4,
        insertDate: '2025-01-12T11:00:00',
        insertUser: 'BOB.JONES',
        programId: 'DONREG',
        tableName: 'DONORS',
        dataDetails: 'New registration',
        recNum: 12348,
        colNum: 1,
        detailsAvailable: true
      },
      {
        rowNum: 5,
        insertDate: '2025-01-11T15:45:00',
        insertUser: 'JANE.SMITH',
        programId: 'DPUVDAT',
        tableName: 'DONOR_INTERDIC',
        dataDetails: 'Updated deferral',
        recNum: 12349,
        colNum: 1,
        detailsAvailable: false
      }
    ];

    beforeEach(() => {
      component.auditData = extendedMockData;
      component.totalCount = 5;
      fixture.detectChanges();
    });



    it('should show all records when no filters are applied', () => {
      component.appliedFilters = {};
      fixture.detectChanges();

      const filteredData = component.sortedData();
      expect(filteredData.length).toBe(5);
    });





    it('should return empty array when filters match no records', () => {
      component.appliedFilters = { insertedUser: 'NONEXISTENT.USER' };
      fixture.detectChanges();

      const filteredData = component.sortedData();
      expect(filteredData.length).toBe(0);
    });

    it('should apply search filter on top of panel filters', () => {
      // First apply insertedUser filter for JOHN.DOE (2 records)
      component.appliedFilters = { insertedUser: 'JOHN.DOE' };
      // Then search for "donation" (1 of the 2 JOHN.DOE records)
      component.searchText = 'donation';
      fixture.detectChanges();

      const filteredData = component.sortedData();
      expect(filteredData.length).toBe(1);
      expect(filteredData[0].recNum).toBe(12347);
      expect(filteredData[0].dataDetails).toContain('donation');
    });
  });
});
