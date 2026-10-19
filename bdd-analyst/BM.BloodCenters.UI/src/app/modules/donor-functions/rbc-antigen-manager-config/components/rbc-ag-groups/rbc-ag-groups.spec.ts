import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { RbcAgGroupsComponent } from './rbc-ag-groups';
import { RbcAgGroupsService } from './services/rbc-ag-groups.service';
import { AntigenGroupOption, AntigenGroupRow } from './models/rbc-ag-groups.model';

describe('RbcAgGroupsComponent', () => {
  let mockDialogRef: any;
  let component: RbcAgGroupsComponent;
  let fixture: ComponentFixture<RbcAgGroupsComponent>;
  let mockService: jasmine.SpyObj<RbcAgGroupsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockOptions: AntigenGroupOption[] = [
    { name: 'RH',   displayOrder: 1 },
    { name: 'KELL', displayOrder: 2 },
    { name: 'Duffy', displayOrder: 3 },
  ];

  const mockRows: AntigenGroupRow[] = [
    { auditKey: 1, serologicalTest: 'D',  serologicalSeq: 1, molecularTest: 'RHD*01',  molecularSeq: 1, effectiveDate: '09-JUN-2023', terminationDate: '' },
    { auditKey: 2, serologicalTest: 'C',  serologicalSeq: 2, molecularTest: 'RHCE*Ce', molecularSeq: 2, effectiveDate: '09-JUN-2023', terminationDate: '' },
    { auditKey: 3, serologicalTest: 'FY', serologicalSeq: 1, molecularTest: '',        molecularSeq: 0, effectiveDate: '01-JAN-2022', terminationDate: '' },
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RbcAgGroupsService', [
      'getFilterOptions',
      'search',
      'create',
      'update',
      'batchUpdate',
      'delete',
      'lookupAntigenGroups',
      'lookupSerTestIds',
      'lookupMolTestIds',
      'checkGroupExists',
    ]);

    mockService.getFilterOptions.and.returnValue(of(mockOptions));
    mockService.search.and.returnValue(of({ data: mockRows, total: 3 }));

    const afterAllClosedSubject = new Subject<void>();
    const afterOpenedSubject    = new Subject<any>();

    mockDialog = jasmine.createSpyObj('MatDialog', ['open'], {
      openDialogs: [],
      _getAfterAllClosed:        jasmine.createSpy().and.returnValue(afterAllClosedSubject.asObservable()),
      _afterAllClosedAtThisLevel: afterAllClosedSubject,
      _afterOpenedAtThisLevel:   afterOpenedSubject,
      _openDialogsAtThisLevel:   [],
    });

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialog.open.and.returnValue(mockDialogRef);



      TestBed.configureTestingModule({
      imports: [RbcAgGroupsComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter([]),
        { provide: RbcAgGroupsService, useValue: mockService },
        { provide: MatDialog,          useValue: mockDialog  },
      ],
    });




      mockService.getFilterOptions.calls.reset();


      mockService.search.calls.reset();


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockService.batchUpdate.calls.reset();


      mockService.delete.calls.reset();


      mockService.lookupAntigenGroups.calls.reset();


      mockService.lookupSerTestIds.calls.reset();


      mockService.lookupMolTestIds.calls.reset();


      mockService.checkGroupExists.calls.reset();


      mockDialog.open.calls.reset();


      mockDialogRef.afterClosed.calls.reset();


      mockService.getFilterOptions.and.returnValue(of(mockOptions));


      mockService.search.and.returnValue(of({ data: mockRows, total: 3 }));


      mockDialogRef.afterClosed.and.returnValue(of(undefined));


      mockDialog.open.and.returnValue(mockDialogRef);


    fixture   = TestBed.createComponent(RbcAgGroupsComponent);
    component = fixture.componentInstance;


    });

  // ── Creation ─────────────────────────────────────────────────────────────────

  describe('Component Initialization', () => {



    it('should not have retrieved data on init', () => {
      expect(component.hasRetrieved()).toBeFalse();
    });

    it('should start with empty rows', () => {
      expect(component.allRows()).toEqual([]);
    });
  });

  // ── isRetrieveDisabled ────────────────────────────────────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should be true when both controls are null', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be true when only group is set', () => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be true when only displayOrder is set', () => {
      component.displayOrderControl.setValue(1);
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be false when both controls are set', () => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(1);
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  // ── onDisplayOrderInput ────────────────────────────────────────────────────────

  describe('onDisplayOrderInput()', () => {
    it('should allow values up to 2 digits', () => {
      const input = { value: '12' } as HTMLInputElement;
      const event  = { target: input } as unknown as Event;
      component.onDisplayOrderInput(event);
      expect(input.value).toBe('12');
    });

    it('should truncate values longer than 2 digits', () => {
      const input = { value: '123' } as HTMLInputElement;
      const event  = { target: input } as unknown as Event;
      component.onDisplayOrderInput(event);
      expect(input.value).toBe('12');
    });

    it('should update the FormControl when truncating', () => {
      const input = { value: '999' } as HTMLInputElement;
      const event  = { target: input } as unknown as Event;
      component.onDisplayOrderInput(event);
      expect(component.displayOrderControl.value).toBe(99);
    });
  });

  // ── onRetrieve ────────────────────────────────────────────────────────────────

  describe('onRetrieve()', () => {
    beforeEach(() => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(5);
    });

    it('should set retrievedGroup with displayOrderControl value', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component['retrievedGroup']).toEqual({ name: 'RH', displayOrder: 5 });
    }));

    it('should call search with correct params', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(mockService.search).toHaveBeenCalledWith(
        25, 0,
        jasmine.objectContaining({ antigenGroup: 'RH', displayOrder: 5 }),
      );
    }));

    it('should set hasRetrieved to true', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasRetrieved()).toBeTrue();
    }));


    it('should populate allRows from service', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.allRows()).toEqual(mockRows);
    }));


  });

  // ── filteredRows / paginatedRows ──────────────────────────────────────────────

  describe('filteredRows', () => {
    beforeEach(fakeAsync(() => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(1);
      component.onRetrieve();
      tick();
    }));

    it('should return all rows when search is empty', () => {
      component.searchQuery = '';
      expect(component.filteredRows.length).toBe(3);
    });

    it('should filter by serologicalTest', () => {
      component.searchQuery = 'D';
      const rows = component.filteredRows;
      expect(rows.every(r => r.serologicalTest.toLowerCase().includes('d') || r.molecularTest.toLowerCase().includes('d'))).toBeTrue();
    });

    it('should filter by molecularTest', () => {
      component.searchQuery = 'rhd';
      const rows = component.filteredRows;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every(r => r.molecularTest.toLowerCase().includes('rhd'))).toBeTrue();
    });

  });



  // ── filteredAntigenGroups ────────────────────────────────────────────────────

  describe('filteredAntigenGroups()', () => {
    it('should return all groups when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.antigenGroupOptions.set(mockOptions);
      expect(component.filteredAntigenGroups().length).toBe(3);
    }));


  });

  // ── onSearch ─────────────────────────────────────────────────────────────────

  describe('onSearch()', () => {
    it('should update searchQuery', () => {
      component.onSearch('test');
      expect(component.searchQuery).toBe('test');
    });


  });

  // ── onSort ────────────────────────────────────────────────────────────────────

  describe('onSort()', () => {


    it('should toggle to D on second click', () => {
      component.sortColumn    = 'serologicalTest';
      component.sortDirection = 'A';
      component.onSort('serologicalTest');
      expect(component.sortDirection).toBe('D');
    });



  });

  describe('getSortIcon()', () => {
    it('should return unfold_more when column is not active', () => {
      component.sortColumn    = '';
      component.sortDirection = '';
      expect(component.getSortIcon('serologicalTest')).toBe('unfold_more');
    });

    it('should return arrow_upward for ascending', () => {
      component.sortColumn    = 'serologicalTest';
      component.sortDirection = 'A';
      expect(component.getSortIcon('serologicalTest')).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending', () => {
      component.sortColumn    = 'serologicalTest';
      component.sortDirection = 'D';
      expect(component.getSortIcon('serologicalTest')).toBe('arrow_downward');
    });
  });

  describe('isSortActive()', () => {
    it('should return false when column not sorted', () => {
      component.sortColumn    = '';
      component.sortDirection = '';
      expect(component.isSortActive('serologicalTest')).toBeFalse();
    });

    it('should return true when column is sorted', () => {
      component.sortColumn    = 'serologicalTest';
      component.sortDirection = 'A';
      expect(component.isSortActive('serologicalTest')).toBeTrue();
    });
  });

  // ── onPageChange ──────────────────────────────────────────────────────────────

  describe('onPageChange()', () => {


    it('should call search again on page change', fakeAsync(() => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(1);
      component.onRetrieve();
      tick();

      const callsBefore = mockService.search.calls.count();
      component.onPageChange({ pageSize: 25, pageIndex: 1, length: 50 });
      tick();
      expect(mockService.search.calls.count()).toBeGreaterThan(callsBefore);
    }));
  });

  // ── Panel management ──────────────────────────────────────────────────────────

  describe('Panel management', () => {
    beforeEach(fakeAsync(() => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(1);
      component.onRetrieve();
      tick();
    }));

    it('openPanel() should set panelOpen, mode and editRow', () => {
      component.openPanel('editRow', mockOptions[0], mockRows[0]);
      expect(component.panelOpen).toBeTrue();
      expect(component.panelMode).toBe('editRow');
      expect(component.editRow).toEqual(mockRows[0]);
    });

    it('onEditGroup() should open editGroup panel', () => {
      component.onEditGroup();
      expect(component.panelOpen).toBeTrue();
      expect(component.panelMode).toBe('editGroup');
    });

    it('onEditRow() should open editRow panel with correct row', () => {
      component.onEditRow(mockRows[1]);
      expect(component.panelOpen).toBeTrue();
      expect(component.panelMode).toBe('editRow');
      expect(component.editRow).toEqual(mockRows[1]);
    });

    it('closePanel() should close the panel and reset editRow', () => {
      component.openPanel('editRow', mockOptions[0], mockRows[0]);
      component.closePanel();
      expect(component.panelOpen).toBeFalse();
      expect(component.editRow).toBeNull();
    });

    it('onAddNewGroup() should open add panel and clear antigenGroupControl', () => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.onAddNewGroup();
      expect(component.antigenGroupControl.value).toBeNull();
      expect(component.panelOpen).toBeTrue();
      expect(component.panelMode).toBe('add');
    });
  });

  // ── onSaveSuccess ─────────────────────────────────────────────────────────────

  describe('onSaveSuccess()', () => {
    it('should refetch data when hasRetrieved is true', fakeAsync(() => {
      component.antigenGroupControl.setValue(mockOptions[0]);
      component.displayOrderControl.setValue(1);
      component.onRetrieve();
      tick();

      const callsBefore = mockService.search.calls.count();
      component.onSaveSuccess();
      tick();
      expect(mockService.search.calls.count()).toBeGreaterThan(callsBefore);
    }));


  });

  // ── Escape key ────────────────────────────────────────────────────────────────

  describe('onEsc()', () => {
    it('should close panel when open', () => {
      component.panelOpen = true;
      component.onEsc();
      expect(component.panelOpen).toBeFalse();
    });

    it('should do nothing when panel is closed', () => {
      component.panelOpen = false;
      component.onEsc();
      expect(component.panelOpen).toBeFalse();
    });
  });

  // ── Filter chips ──────────────────────────────────────────────────────────────

  describe('Filter chip management', () => {



    it('clearAllFilters() should reset all filters and chips', () => {
      component.currentFilters = { effectiveDate: new Date(), effectiveDatePeriod: 'AFTER' };
      component.filterChips    = [{ key: 'effectiveDate', label: 'x', value: 'x', removable: true }];
      component.pageIndex      = 3;

      component.clearAllFilters();

      expect(component.currentFilters).toEqual({});
      expect(component.filterChips).toEqual([]);
      expect(component.pageIndex).toBe(0);
    });
  });
});
