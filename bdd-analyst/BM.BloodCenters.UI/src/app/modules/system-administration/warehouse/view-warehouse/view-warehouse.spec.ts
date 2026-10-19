import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ViewWarehouseComponent, WarehouseRow } from './view-warehouse';
import { WarehouseService, WarehouseUserResponse } from '../services/warehouse.service';
import { HeaderService } from '@shared/services/header.service';

/* ------------------------------
   HELPERS
-------------------------------- */

function makeRow(overrides: Partial<WarehouseRow> = {}): WarehouseRow {
  return {
    warehouse: 'WH1',
    warehouseDescription: 'Warehouse One',
    chapterId: 'DAL',
    chapterName: 'Dallas',
    defaultPrinter: 'P1',
    printerDescription: 'Printer One',
    effectiveDate: '2025-01-01',
    terminationDate: '2025-12-31',
    modifiedDate: '2025-06-01',
    status: 'Active',
    ...overrides
  };
}

function makeApiResponse(overrides: Partial<WarehouseUserResponse> = {}): WarehouseUserResponse {
  return {
    UserId: 'TESTUSER',
    WarehouseId: 'WH1',
    WarehouseDescription: 'Warehouse One',
    ChapterId: 'DAL',
    ChapterDescription: 'Dallas Chapter',
    ChapterName: 'Dallas',
    EffDate: '2025-01-01',
    TermDate: '2025-12-31',
    PrinterId: 'P1',
    PrinterDescription: 'Printer One',
    LastModifiedDate: '2025-06-01',
    InsertUser: null,
    InsertDate: null,
    ProgramId: null,
    UserFirstName: 'John',
    UserLastName: 'Doe',
    Status: 'ACTIVE',
    Department: 'IT',
    ...overrides
  };
}

/* =====================================================================
   MAIN COMPONENT TESTS
===================================================================== */

describe('ViewWarehouseComponent', () => {
  let component: ViewWarehouseComponent;
  let fixture: ComponentFixture<ViewWarehouseComponent>;
  let service: jasmine.SpyObj<WarehouseService>;
  let routerMock: any;
  let activatedRouteMock: any;
  let dialogSpy: any;
  let dialogRefSpy: jasmine.SpyObj<any>;
  let afterClosedSubject: Subject<any>;
  let overlaySpy: any;
  let overlayRefSpy: jasmine.SpyObj<any>;
  let backdropClickSubject: Subject<any>;
  let filterApplySubject: Subject<any>;
  let filterCloseSubject: Subject<any>;
  let positionStrategy: any;
  let headerServiceMock: any;
  let chapterChangedSubject: Subject<void>;
  let queryParamsSubject: Subject<any>;

  beforeEach(() => {
    queryParamsSubject = new Subject<any>();
    chapterChangedSubject = new Subject<void>();
    afterClosedSubject = new Subject<any>();
    backdropClickSubject = new Subject<any>();
    filterApplySubject = new Subject<any>();
    filterCloseSubject = new Subject<any>();

    routerMock = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
      events: of(),
      url: '/system-administration/warehouse/view-warehouse'
    };

    activatedRouteMock = {
      snapshot: {},
      queryParams: queryParamsSubject.asObservable()
    };

    const warehouseServiceSpy = jasmine.createSpyObj('WarehouseService', [
      'getWarehouses',
      'filterWarehouses',
      'getUsersDropdown'
    ]);
    warehouseServiceSpy.getUsersDropdown.and.returnValue(of([]));

    // Dialog mock with non-emitting afterClosed by default
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(afterClosedSubject.asObservable());

    // Overlay mock with non-emitting backdropClick by default
    overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    overlayRefSpy.backdropClick.and.returnValue(backdropClickSubject.asObservable());
    overlayRefSpy.attach.and.returnValue({
      instance: {
        currentFilters: {},
        warehouses: [],
        chapters: [],
        apply: filterApplySubject,
        close: filterCloseSubject
      }
    });

    positionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.callFake(function(this: any) { return this; }),
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; }),
      withViewportMargin: jasmine.createSpy('withViewportMargin').and.callFake(function(this: any) { return this; }),
      withFlexibleDimensions: jasmine.createSpy('withFlexibleDimensions').and.callFake(function(this: any) { return this; }),
      withGrowAfterOpen: jasmine.createSpy('withGrowAfterOpen').and.callFake(function(this: any) { return this; })
    };

    headerServiceMock = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [ViewWarehouseComponent],
      providers: [
        provideHttpClient(),
        { provide: WarehouseService, useValue: warehouseServiceSpy },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: HeaderService, useValue: headerServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ViewWarehouseComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(WarehouseService) as jasmine.SpyObj<WarehouseService>;

    // Spy on the component's actual injected dialog (TestBed providers don't override providedIn: 'root' for standalone)
    spyOn((component as any).dialog, 'open').and.returnValue(dialogRefSpy);
    dialogSpy = (component as any).dialog;

    // Spy on the component's actual injected overlay
    const realOverlay = (component as any).overlay;
    spyOn(realOverlay, 'create').and.returnValue(overlayRefSpy);
    spyOn(realOverlay, 'position').and.returnValue(positionStrategy);
    realOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    overlaySpy = realOverlay;

    fixture.detectChanges();
  });

  /* ---- Existing tests (preserved) ---- */

  it('should call getWarehouses when userId is provided', () => {
    service.getWarehouses.and.returnValue(of([] as any));

    component.userId = 'CINCUL';
    component.onRetrieve();

    expect(service.getWarehouses).toHaveBeenCalledWith('CINCUL');
  });

  it('should convert lowercase userId to uppercase when calling service', () => {
    service.getWarehouses.and.returnValue(of([] as any));

    component.userId = 'cincul';
    component.onRetrieve();

    expect(service.getWarehouses).toHaveBeenCalledWith('CINCUL');
  });

  it('should convert mixed case userId to uppercase when calling service', () => {
    service.getWarehouses.and.returnValue(of([] as any));

    component.userId = 'CinCul';
    component.onRetrieve();

    expect(service.getWarehouses).toHaveBeenCalledWith('CINCUL');
  });

  it('should map API response to WarehouseRow correctly', () => {
    const apiResponse: WarehouseUserResponse[] = [
      {
        UserId: 'CINCUL',
        WarehouseId: 'B',
        WarehouseDescription: null,
        ChapterId: 'DAL',
        ChapterDescription: null,
        ChapterName: 'Test Chapter',
        EffDate: `${new Date().getFullYear()}-01-01`,
        TermDate: null,
        PrinterId: null,
        PrinterDescription: null,
        LastModifiedDate: `${new Date().getFullYear()}-01-02`,
        InsertUser: null,
        InsertDate: null,
        ProgramId: null,
        UserFirstName: 'CINDY',
        UserLastName: 'CULLUM',
        Status: 'ACTIVE',
        Department: 'N/A'
      }
    ];

    (component as any).handleWarehouseResponse(apiResponse);

    expect(component.assignments.length).toBe(1);
    expect(component.assignments[0].warehouse).toBe('B');
    expect(component.assignments[0].status).toBe('Active');
  });

  it('should NOT filter by warehouse column', () => {
    component.assignments = [
      {
        warehouse: 'WAREHOUSE_A',
        warehouseDescription: '',
        chapterId: 'DAL',
        chapterName: 'Dallas',
        defaultPrinter: 'Printer1',
        printerDescription: '',
        effectiveDate: '',
        terminationDate: '',
        modifiedDate: '',
        status: 'Active'
      },
      {
        warehouse: 'WAREHOUSE_B',
        warehouseDescription: '',
        chapterId: 'OBK',
        chapterName: 'Oklahoma',
        defaultPrinter: 'Printer2',
        printerDescription: '',
        effectiveDate: '',
        terminationDate: '',
        modifiedDate: '',
        status: 'Inactive'
      }
    ];

    component.tableSearch = 'WAREHOUSE_A';
    component.applyTableSearch();

    expect(component.filteredAssignments.length).toBe(0);
  });

  it('should clear search and show all records when empty string passed to onTableSearch', () => {
    component.assignments = [
      {
        warehouse: 'A',
        warehouseDescription: '',
        chapterId: 'DAL',
        chapterName: 'Dallas',
        defaultPrinter: '-',
        printerDescription: '',
        effectiveDate: '',
        terminationDate: '',
        modifiedDate: '',
        status: 'Active'
      },
      {
        warehouse: 'B',
        warehouseDescription: '',
        chapterId: 'OBK',
        chapterName: 'Oklahoma',
        defaultPrinter: '-',
        printerDescription: '',
        effectiveDate: '',
        terminationDate: '',
        modifiedDate: '',
        status: 'Active'
      }
    ];

    component.onTableSearch('dal');
    expect(component.filteredAssignments.length).toBe(1);

    component.onTableSearch('');
    expect(component.filteredAssignments.length).toBe(2);
  });

  /* ---- NEW: ngOnInit tests ---- */

  describe('ngOnInit', () => {
    it('should load users dropdown on init', () => {
      expect(service.getUsersDropdown).toHaveBeenCalled();
    });

    it('should sync userId from userIdControl value changes', () => {
      component.userIdControl.setValue('NEWUSER');
      expect(component.userId).toBe('NEWUSER');
    });

    it('should set userId to empty string when userIdControl value is null', () => {
      component.userIdControl.setValue('TESTUSER');
      expect(component.userId).toBe('TESTUSER');
      component.userIdControl.setValue(null);
      expect(component.userId).toBe('');
    });

    it('should retrieve warehouses when query params contain userId', () => {
      service.getWarehouses.and.returnValue(of([]));
      queryParamsSubject.next({ userId: 'QUERYUSER' });

      expect(component.userId).toBe('QUERYUSER');
      expect(service.getWarehouses).toHaveBeenCalledWith('QUERYUSER');
    });

    it('should reset state when chapterChanged$ emits', () => {
      component.userId = 'TESTUSER';
      component.retrievedUserId = 'TESTUSER';
      component.hasSearched = true;
      component.userFullName = 'John Doe';
      component.userGroup = 'IT';
      component.displayUserId = 'TESTUSER';
      component.assignments = [makeRow()];
      component.filteredAssignments = [makeRow()];
      component.pagedAssignments = [makeRow()];
      component.appliedFilters = { warehouse: 'WH1' };
      component.filterChips = [{ key: 'warehouse', value: 'WH1', label: 'Warehouse: WH1' }];
      component.tableSearch = 'test';
      component.pageIndex = 2;

      service.getUsersDropdown.calls.reset();
      service.getUsersDropdown.and.returnValue(of([]));

      chapterChangedSubject.next();

      expect(component.userId).toBe('');
      expect(component.retrievedUserId).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(component.userFullName).toBe('');
      expect(component.userGroup).toBe('');
      expect(component.displayUserId).toBe('');
      expect(component.assignments.length).toBe(0);
      expect(component.filteredAssignments.length).toBe(0);
      expect(component.pagedAssignments.length).toBe(0);
      expect(component.appliedFilters).toEqual({});
      expect(component.filterChips.length).toBe(0);
      expect(component.tableSearch).toBe('');
      expect(component.pageIndex).toBe(0);
      expect(service.getUsersDropdown).toHaveBeenCalled();
    });
  });

  /* ---- NEW: ngOnDestroy tests ---- */

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlay if it exists', () => {
      (component as any).overlayRef = overlayRefSpy;
      component.ngOnDestroy();
      expect(overlayRefSpy.dispose).toHaveBeenCalled();
    });

    it('should not error when overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  /* ---- NEW: loadUsersDropdown tests ---- */

  describe('loadUsersDropdown', () => {
    it('should populate userOptions and filteredUserOptions on success', () => {
      const users = [
        { userId: 'USER1', userName: 'User One' },
        { userId: 'USER2', userName: 'User Two' }
      ];
      service.getUsersDropdown.and.returnValue(of(users));

      (component as any).loadUsersDropdown();

      expect(component.userOptions).toEqual(users);
      expect(component.filteredUserOptions).toEqual(users);
    });

    it('should set empty arrays on error', () => {
      service.getUsersDropdown.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadUsersDropdown();

      expect(component.userOptions).toEqual([]);
      expect(component.filteredUserOptions).toEqual([]);
    });
  });

  /* ---- NEW: setupUserSearch / filterUsers tests ---- */

  describe('filterUsers (via userSearchControl)', () => {
    beforeEach(() => {
      component.userOptions = [
        { userId: 'JDOE', userName: 'John Doe' },
        { userId: 'ASMITH', userName: 'Alice Smith' },
        { userId: 'BJONES', userName: 'Bob Jones' }
      ];
    });

    it('should show all users when search is empty', () => {
      component.userSearchControl.setValue('');
      expect(component.filteredUserOptions.length).toBe(3);
    });

    it('should filter users by userId (case-insensitive)', () => {
      component.userSearchControl.setValue('jdoe');
      expect(component.filteredUserOptions.length).toBe(1);
      expect(component.filteredUserOptions[0].userId).toBe('JDOE');
    });

    it('should filter users by userName (case-insensitive)', () => {
      component.userSearchControl.setValue('alice');
      expect(component.filteredUserOptions.length).toBe(1);
      expect(component.filteredUserOptions[0].userName).toBe('Alice Smith');
    });

    it('should return empty array when no user matches', () => {
      component.userSearchControl.setValue('zzz_no_match');
      expect(component.filteredUserOptions.length).toBe(0);
    });

    it('should handle user with null userName', () => {
      component.userOptions = [
        { userId: 'NUSER', userName: null as any }
      ];
      component.userSearchControl.setValue('NUSER');
      expect(component.filteredUserOptions.length).toBe(1);
    });
  });

  /* ---- NEW: onRetrieve tests ---- */

  describe('onRetrieve', () => {
    it('should not call loadWarehouses when userId is empty', () => {
      component.userId = '';
      component.onRetrieve();
      expect(service.getWarehouses).not.toHaveBeenCalled();
    });

    it('should not call loadWarehouses when userId is whitespace only', () => {
      component.userId = '   ';
      component.onRetrieve();
      expect(service.getWarehouses).not.toHaveBeenCalled();
    });

    it('should set hasSearched, isLoading, clear filters and call loadWarehouses', () => {
      service.getWarehouses.and.returnValue(of([]));

      component.appliedFilters = { warehouse: 'WH1' };
      component.filterChips = [{ key: 'warehouse', value: 'WH1', label: 'Warehouse: WH1' }];
      component.tableSearch = 'test';

      component.userId = 'TESTUSER';
      component.onRetrieve();

      expect(component.hasSearched).toBeTrue();
      expect(component.retrievedUserId).toBe('TESTUSER');
      expect(component.appliedFilters).toEqual({});
      expect(component.filterChips.length).toBe(0);
      expect(component.tableSearch).toBe('');
    });

    it('should clear searchBar when it exists', () => {
      service.getWarehouses.and.returnValue(of([]));
      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch') } as any;
      component.searchBar = mockSearchBar;

      component.userId = 'TESTUSER';
      component.onRetrieve();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });
  });

  /* ---- NEW: loadWarehouses tests ---- */

  describe('loadWarehouses', () => {
    it('should not call service when userId is empty', () => {
      component.userId = '';
      component.loadWarehouses();
      expect(service.getWarehouses).not.toHaveBeenCalled();
    });

    it('should not call service when userId is whitespace', () => {
      component.userId = '   ';
      component.loadWarehouses();
      expect(service.getWarehouses).not.toHaveBeenCalled();
    });

    it('should call service with uppercase trimmed userId', () => {
      service.getWarehouses.and.returnValue(of([]));
      component.userId = '  testuser  ';
      component.loadWarehouses();
      expect(service.getWarehouses).toHaveBeenCalledWith('TESTUSER');
    });

    it('should handle successful response', () => {
      const response = [makeApiResponse()];
      service.getWarehouses.and.returnValue(of(response));

      component.isLoading = true;
      component.userId = 'TESTUSER';
      component.loadWarehouses();

      expect(component.isLoading).toBeFalse();
      expect(component.assignments.length).toBe(1);
    });

    it('should handle error response', () => {
      service.getWarehouses.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.isLoading = true;
      component.userId = 'TESTUSER';
      component.loadWarehouses();

      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
      expect(console.error).toHaveBeenCalled();
    });
  });

  /* ---- NEW: handleWarehouseResponse tests ---- */

  describe('handleWarehouseResponse', () => {
    it('should reset all data when response is null', () => {
      component.userFullName = 'John Doe';
      component.assignments = [makeRow()];

      (component as any).handleWarehouseResponse(null as any);

      expect(component.userFullName).toBe('');
      expect(component.userGroup).toBe('');
      expect(component.assignments.length).toBe(0);
      expect(component.filteredAssignments.length).toBe(0);
      expect(component.pagedAssignments.length).toBe(0);
      expect(component.appliedFilters).toEqual({});
      expect(component.filterChips.length).toBe(0);
      expect(component.tableSearch).toBe('');
      expect(component.pageIndex).toBe(0);
    });

    it('should reset all data when response is empty array', () => {
      component.userFullName = 'John Doe';
      (component as any).handleWarehouseResponse([]);

      expect(component.userFullName).toBe('');
      expect(component.assignments.length).toBe(0);
    });

    it('should set user info from first response item', () => {
      component.userId = 'testuser';
      const response = [makeApiResponse({ UserFirstName: 'Jane', UserLastName: 'Smith', Department: 'HR' })];

      (component as any).handleWarehouseResponse(response);

      expect(component.displayUserId).toBe('TESTUSER');
      expect(component.userFullName).toBe('Jane Smith');
      expect(component.userGroup).toBe('HR');
    });

    it('should use N/A when Department is empty', () => {
      component.userId = 'testuser';
      const response = [makeApiResponse({ Department: '' })];

      (component as any).handleWarehouseResponse(response);

      expect(component.userGroup).toBe('N/A');
    });

    it('should populate allWarehouses and allChapters for filter dropdowns', () => {
      component.userId = 'testuser';
      const response = [
        makeApiResponse({ WarehouseId: 'WH1', WarehouseDescription: 'Warehouse One', ChapterId: 'DAL', ChapterName: 'Dallas' }),
        makeApiResponse({ WarehouseId: 'WH2', WarehouseDescription: '', ChapterId: 'OBK', ChapterName: '' })
      ];

      (component as any).handleWarehouseResponse(response);

      expect(component.allWarehouses.length).toBe(2);
      expect(component.allWarehouses[0].display).toBe('WH1 - Warehouse One');
      expect(component.allWarehouses[1].display).toBe('WH2');

      expect(component.allChapters.length).toBe(2);
      expect(component.allChapters[0].display).toBe('DAL - Dallas');
      expect(component.allChapters[1].display).toBe('OBK');
    });

    it('should reset pageIndex and apply filters after loading', () => {
      component.userId = 'testuser';
      component.pageIndex = 5;
      const response = [makeApiResponse()];

      (component as any).handleWarehouseResponse(response);

      expect(component.pageIndex).toBe(0);
    });
  });

  /* ---- NEW: mapToWarehouseRow tests ---- */

  describe('mapToWarehouseRow', () => {
    it('should map all fields correctly', () => {
      const item = makeApiResponse();
      const row = (component as any).mapToWarehouseRow(item);

      expect(row.warehouse).toBe('WH1');
      expect(row.warehouseDescription).toBe('Warehouse One');
      expect(row.chapterId).toBe('DAL');
      expect(row.chapterName).toBe('Dallas Chapter');
      expect(row.defaultPrinter).toBe('P1');
      expect(row.printerDescription).toBe('Printer One');
      expect(row.effectiveDate).toBe('2025-01-01');
      expect(row.terminationDate).toBe('2025-12-31');
      expect(row.modifiedDate).toBe('2025-06-01');
      expect(row.status).toBe('Active');
    });

    it('should use dash for null/empty fields', () => {
      const item = makeApiResponse({
        WarehouseId: '',
        ChapterId: '',
        PrinterId: null,
        EffDate: '',
        TermDate: null,
        LastModifiedDate: ''
      });
      const row = (component as any).mapToWarehouseRow(item);

      expect(row.warehouse).toBe('-');
      expect(row.chapterId).toBe('-');
      expect(row.defaultPrinter).toBe('-');
      expect(row.effectiveDate).toBe('-');
      expect(row.terminationDate).toBe('-');
      expect(row.modifiedDate).toBe('-');
    });

    it('should map INACTIVE status to Inactive', () => {
      const item = makeApiResponse({ Status: 'INACTIVE' });
      const row = (component as any).mapToWarehouseRow(item);
      expect(row.status).toBe('Inactive');
    });

    it('should prefer ChapterDescription over ChapterName', () => {
      const item = makeApiResponse({ ChapterDescription: 'Description', ChapterName: 'Name' });
      const row = (component as any).mapToWarehouseRow(item);
      expect(row.chapterName).toBe('Description');
    });

    it('should fall back to ChapterName when ChapterDescription is null', () => {
      const item = makeApiResponse({ ChapterDescription: null, ChapterName: 'FallbackName' });
      const row = (component as any).mapToWarehouseRow(item);
      expect(row.chapterName).toBe('FallbackName');
    });

    it('should use dash when both ChapterDescription and ChapterName are null/empty', () => {
      const item = makeApiResponse({ ChapterDescription: null, ChapterName: '' as any });
      const row = (component as any).mapToWarehouseRow(item);
      expect(row.chapterName).toBe('-');
    });
  });

  /* ---- NEW: Navigation tests ---- */

  describe('goHome', () => {
    it('should navigate to /home', () => {
      component.goHome();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('close', () => {
    it('should navigate to parent route', () => {
      component.close();
      expect(routerMock.navigate).toHaveBeenCalledWith(['../'], { relativeTo: activatedRouteMock });
    });
  });

  /* ---- NEW: Table search tests ---- */

  describe('onTableSearch', () => {
    it('should set tableSearch and apply filters', () => {
      component.assignments = [makeRow({ chapterId: 'DAL', chapterName: 'Dallas' })];
      component.onTableSearch('dal');
      expect(component.tableSearch).toBe('dal');
      expect(component.filteredAssignments.length).toBe(1);
    });

    it('should reset pageIndex on search', () => {
      component.pageIndex = 3;
      component.assignments = [makeRow()];
      component.onTableSearch('');
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('onSearch', () => {
    beforeEach(() => {
      component.assignments = [
        makeRow({ warehouse: 'WH_A', chapterName: 'Dallas' }),
        makeRow({ warehouse: 'WH_B', chapterName: 'Oklahoma' })
      ];
      component.filteredAssignments = [...component.assignments];
    });

    it('should show all when query is empty', () => {
      component.searchQuery = '';
      component.onSearch();
      expect(component.filteredAssignments.length).toBe(2);
    });

    it('should filter by warehouse name', () => {
      component.searchQuery = 'WH_A';
      component.onSearch();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].warehouse).toBe('WH_A');
    });

    it('should filter by chapter name', () => {
      component.searchQuery = 'oklahoma';
      component.onSearch();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].chapterName).toBe('Oklahoma');
    });

    it('should reset pageIndex after search', () => {
      component.pageIndex = 5;
      component.searchQuery = '';
      component.onSearch();
      expect(component.pageIndex).toBe(0);
    });
  });

  /* ---- NEW: clearUserSearch tests ---- */

  describe('clearUserSearch', () => {
    it('should reset user search state', () => {
      component.userId = 'TESTUSER';
      component.displayUserId = 'TESTUSER';
      component.hasSearched = true;

      component.clearUserSearch();

      expect(component.userId).toBe('');
      expect(component.displayUserId).toBe('');
      expect(component.hasSearched).toBeFalse();
    });
  });

  /* ---- NEW: Sort tests ---- */

  describe('toggleSort', () => {
    it('should set asc on first toggle from null', () => {
      component.assignments = [
        makeRow({ warehouse: 'C_Warehouse' }),
        makeRow({ warehouse: 'A_Warehouse' }),
        makeRow({ warehouse: 'B_Warehouse' })
      ];
      component.filteredAssignments = [...component.assignments];
      component.sortDirection = null;

      component.toggleSort();

      expect(component.sortDirection).toBe('asc');
      expect(component.filteredAssignments[0].warehouse).toBe('A_Warehouse');
    });

    it('should set desc on second toggle', () => {
      component.assignments = [
        makeRow({ warehouse: 'C_Warehouse' }),
        makeRow({ warehouse: 'A_Warehouse' }),
        makeRow({ warehouse: 'B_Warehouse' })
      ];
      component.filteredAssignments = [...component.assignments];
      component.sortDirection = 'asc';

      component.toggleSort();

      expect(component.sortDirection).toBe('desc');
      expect(component.filteredAssignments[0].warehouse).toBe('C_Warehouse');
    });

    it('should reset to null on third toggle and reapply all filters', () => {
      component.assignments = [
        makeRow({ warehouse: 'C_Warehouse' }),
        makeRow({ warehouse: 'A_Warehouse' }),
        makeRow({ warehouse: 'B_Warehouse' })
      ];
      component.filteredAssignments = [...component.assignments];
      component.sortDirection = 'desc';

      component.toggleSort();

      expect(component.sortDirection).toBeNull();
      expect(component.filteredAssignments.length).toBe(3);
    });
  });

  /* ---- NEW: isActive tests ---- */

  describe('isActive', () => {
    it('should return true for Active status', () => {
      expect(component.isActive(makeRow({ status: 'Active' }))).toBeTrue();
    });

    it('should return false for Inactive status', () => {
      expect(component.isActive(makeRow({ status: 'Inactive' }))).toBeFalse();
    });
  });

  /* ---- NEW: Row editing tests ---- */

  describe('getAbsoluteRowIndex', () => {
    it('should compute absolute index from paged index', () => {
      component.pageIndex = 2;
      component.pageSize = 10;
      expect(component.getAbsoluteRowIndex(3)).toBe(23);
    });

    it('should return paged index when on first page', () => {
      component.pageIndex = 0;
      component.pageSize = 25;
      expect(component.getAbsoluteRowIndex(5)).toBe(5);
    });
  });

  describe('isRowEditing', () => {
    it('should return true when editingRowIndex matches absolute index', () => {
      component.editingRowIndex = 5;
      component.pageIndex = 0;
      component.pageSize = 25;
      expect(component.isRowEditing(5)).toBeTrue();
    });

    it('should return false when editingRowIndex does not match', () => {
      component.editingRowIndex = 10;
      component.pageIndex = 0;
      component.pageSize = 25;
      expect(component.isRowEditing(5)).toBeFalse();
    });

    it('should return false when editingRowIndex is null', () => {
      component.editingRowIndex = null;
      expect(component.isRowEditing(0)).toBeFalse();
    });
  });

  /* ---- NEW: formatDate tests ---- */

  describe('formatDate', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('');
    });

    it('should format a valid date string as DD-MON-YYYY', () => {
      const result = component.formatDate('2025-01-15');
      expect(result).toBe('15-JAN-2025');
    });

    it('should format a Date object', () => {
      const result = component.formatDate(new Date(2025, 11, 25));
      expect(result).toBe('25-DEC-2025');
    });
  });

  /* ---- NEW: getEmptyMessage tests ---- */

  describe('getEmptyMessage', () => {
    it('should return default message when no search or filters active', () => {
      component.tableSearch = '';
      component.appliedFilters = {};
      expect(component.getEmptyMessage()).toBe('No warehouse assignments available to display.');
    });

    it('should return message when table search is active', () => {
      component.tableSearch = 'some query';
      component.appliedFilters = {};
      expect(component.getEmptyMessage()).toBe('No warehouse assignments available to display.');
    });

    it('should return message when filters are active', () => {
      component.tableSearch = '';
      component.appliedFilters = { warehouse: 'WH1' };
      expect(component.getEmptyMessage()).toBe('No warehouse assignments available to display.');
    });
  });

  /* ---- NEW: Filter overlay tests ---- */

  describe('openFilter', () => {
    beforeEach(() => {
      component.filterBtn = { nativeElement: document.createElement('button') } as any;
    });

    it('should open filter overlay and set isFilterOpen to true', () => {
      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
      expect(overlaySpy.create).toHaveBeenCalled();
      expect(overlayRefSpy.attach).toHaveBeenCalled();
    });

    it('should close existing overlay when called again', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();

      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
      expect(overlayRefSpy.dispose).toHaveBeenCalled();
    });

    it('should pass current filters, warehouses, and chapters to filter component', () => {
      component.appliedFilters = { warehouse: 'WH1' };
      component.allWarehouses = [{ value: 'WH1', display: 'WH1 - Warehouse One' }];
      component.allChapters = [{ value: 'DAL', display: 'DAL - Dallas' }];

      component.openFilter();

      const instance = overlayRefSpy.attach.calls.mostRecent().returnValue.instance;
      expect(instance.currentFilters).toEqual({ warehouse: 'WH1' });
      expect(instance.warehouses).toEqual([{ value: 'WH1', display: 'WH1 - Warehouse One' }]);
      expect(instance.chapters).toEqual([{ value: 'DAL', display: 'DAL - Dallas' }]);
    });

    it('should apply filters when filter component emits apply event', () => {
      component.assignments = [
        makeRow({ warehouse: 'WH1', chapterId: 'DAL' }),
        makeRow({ warehouse: 'WH2', chapterId: 'OBK' })
      ];

      component.openFilter();
      filterApplySubject.next({ warehouse: 'WH1' });

      expect(component.appliedFilters).toEqual({ warehouse: 'WH1' });
      expect(component.pageIndex).toBe(0);
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter when filter component emits close event', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();

      filterCloseSubject.next(undefined);

      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter on backdrop click', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();

      backdropClickSubject.next(undefined);

      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('closeFilter', () => {
    it('should dispose overlayRef and set isFilterOpen to false', () => {
      (component as any).overlayRef = overlayRefSpy;
      component.isFilterOpen = true;

      component.closeFilter();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should not error when overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.closeFilter()).not.toThrow();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  /* ---- NEW: applyAllFilters / applyFrontendFilters tests ---- */

  describe('applyAllFilters (via applyFrontendFilters)', () => {
    beforeEach(() => {
      component.assignments = [
        makeRow({ warehouse: 'WH1', chapterId: 'DAL', chapterName: 'Dallas', effectiveDate: '2025-06-01', terminationDate: '2025-12-31' }),
        makeRow({ warehouse: 'WH2', chapterId: 'OBK', chapterName: 'Oklahoma', effectiveDate: '2025-01-01', terminationDate: '2025-06-30' }),
        makeRow({ warehouse: 'WH3', chapterId: 'DAL', chapterName: 'Dallas 2', effectiveDate: '2024-01-01', terminationDate: '-' })
      ];
    });

    it('should return all assignments when no filters applied', () => {
      component.appliedFilters = {};
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(3);
    });

    it('should filter by warehouse', () => {
      component.appliedFilters = { warehouse: 'WH1' };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].warehouse).toBe('WH1');
    });

    it('should filter by chapter', () => {
      component.appliedFilters = { chapter: 'DAL' };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(2);
    });

    it('should filter by effective date AFTER', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-03-01') as any,
        effectiveDatePeriod: 'AFTER'
      };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].warehouse).toBe('WH1');
    });

    it('should filter by effective date BEFORE', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-03-01') as any,
        effectiveDatePeriod: 'BEFORE'
      };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(2);
    });

    it('should filter by termination date AFTER', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-10-01') as any,
        terminationDatePeriod: 'AFTER'
      };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].warehouse).toBe('WH1');
    });

    it('should filter by termination date BEFORE', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-10-01') as any,
        terminationDatePeriod: 'BEFORE'
      };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
      expect(component.filteredAssignments[0].warehouse).toBe('WH2');
    });

    it('should exclude rows with dash terminationDate when filtering by terminationDate', () => {
      component.appliedFilters = {
        terminationDate: new Date('2026-01-01') as any,
        terminationDatePeriod: 'BEFORE'
      };
      component.applyFrontendFilters();
      expect(component.filteredAssignments.find(a => a.warehouse === 'WH3')).toBeUndefined();
    });

    it('should combine warehouse filter and table search', () => {
      component.appliedFilters = { warehouse: 'WH1' };
      component.tableSearch = 'dal';
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
    });

    it('should apply table search by chapterId combined field', () => {
      component.tableSearch = 'dal - dallas';
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(2);
    });

    it('should apply table search by printer', () => {
      component.assignments = [
        makeRow({ defaultPrinter: 'LP1', printerDescription: 'Label Printer' }),
        makeRow({ defaultPrinter: 'LP2', printerDescription: 'Receipt Printer' })
      ];
      component.tableSearch = 'label';
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
    });

    it('should search by combined printer field (printerId - printerDescription)', () => {
      component.assignments = [
        makeRow({ defaultPrinter: 'LP1', printerDescription: 'Label Printer' }),
        makeRow({ defaultPrinter: 'LP2', printerDescription: '' })
      ];
      component.tableSearch = 'lp1 - label';
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
    });

    it('should search by printerId alone when printerDescription is empty', () => {
      component.assignments = [
        makeRow({ defaultPrinter: 'LP2', printerDescription: '' })
      ];
      component.tableSearch = 'lp2';
      component.applyFrontendFilters();
      expect(component.filteredAssignments.length).toBe(1);
    });
  });

  /* ---- NEW: updateFilterChips tests ---- */

  describe('updateFilterChips', () => {
    it('should create warehouse chip with display name', () => {
      component.allWarehouses = [{ value: 'WH1', display: 'WH1 - Warehouse One' }];
      component.appliedFilters = { warehouse: 'WH1' };

      (component as any).updateFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('warehouse');
      expect(component.filterChips[0].label).toBe('Warehouse: WH1 - Warehouse One');
    });

    it('should use raw value when warehouse display name not found', () => {
      component.allWarehouses = [];
      component.appliedFilters = { warehouse: 'UNKNOWN' };

      (component as any).updateFilterChips();

      expect(component.filterChips[0].label).toBe('Warehouse: UNKNOWN');
    });

    it('should create chapter chip with display name', () => {
      component.allChapters = [{ value: 'DAL', display: 'DAL - Dallas' }];
      component.appliedFilters = { chapter: 'DAL' };

      (component as any).updateFilterChips();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].label).toBe('Chapter: DAL - Dallas');
    });

    it('should use raw value when chapter display name not found', () => {
      component.allChapters = [];
      component.appliedFilters = { chapter: 'UNKNOWN' };

      (component as any).updateFilterChips();

      expect(component.filterChips[0].label).toBe('Chapter: UNKNOWN');
    });

    it('should create effective date chip with >= symbol for AFTER', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-06-15') as any,
        effectiveDatePeriod: 'AFTER'
      };

      (component as any).updateFilterChips();

      const chip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(chip).toBeDefined();
      expect(chip!.label).toContain('≥');
    });

    it('should create effective date chip with <= symbol for BEFORE', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-06-15') as any,
        effectiveDatePeriod: 'BEFORE'
      };

      (component as any).updateFilterChips();

      const chip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(chip).toBeDefined();
      expect(chip!.label).toContain('≤');
    });

    it('should create termination date chip with >= symbol for AFTER', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-12-31') as any,
        terminationDatePeriod: 'AFTER'
      };

      (component as any).updateFilterChips();

      const chip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(chip).toBeDefined();
      expect(chip!.label).toContain('≥');
    });

    it('should create termination date chip with <= symbol for BEFORE', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-12-31') as any,
        terminationDatePeriod: 'BEFORE'
      };

      (component as any).updateFilterChips();

      const chip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(chip).toBeDefined();
      expect(chip!.label).toContain('≤');
    });

    it('should create multiple chips when multiple filters applied', () => {
      component.allWarehouses = [{ value: 'WH1', display: 'WH1' }];
      component.allChapters = [{ value: 'DAL', display: 'DAL' }];
      component.appliedFilters = {
        warehouse: 'WH1',
        chapter: 'DAL',
        effectiveDate: new Date('2025-01-01') as any,
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2025-12-31') as any,
        terminationDatePeriod: 'BEFORE'
      };

      (component as any).updateFilterChips();

      expect(component.filterChips.length).toBe(4);
    });

    it('should not create effectiveDate chip when effectiveDatePeriod is missing', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-01-01') as any
      };

      (component as any).updateFilterChips();

      expect(component.filterChips.find(c => c.key === 'effectiveDate')).toBeUndefined();
    });

    it('should not create terminationDate chip when terminationDatePeriod is missing', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-12-31') as any
      };

      (component as any).updateFilterChips();

      expect(component.filterChips.find(c => c.key === 'terminationDate')).toBeUndefined();
    });
  });

  /* ---- NEW: removeChip tests ---- */

  describe('removeChip', () => {
    beforeEach(() => {
      component.assignments = [
        makeRow({ warehouse: 'WH1', chapterId: 'DAL' }),
        makeRow({ warehouse: 'WH2', chapterId: 'OBK' })
      ];
    });

    it('should remove warehouse filter', () => {
      component.appliedFilters = { warehouse: 'WH1', chapter: 'DAL' };
      component.removeChip('warehouse');

      expect(component.appliedFilters.warehouse).toBeUndefined();
      expect(component.appliedFilters.chapter).toBe('DAL');
    });

    it('should remove chapter filter', () => {
      component.appliedFilters = { warehouse: 'WH1', chapter: 'DAL' };
      component.removeChip('chapter');

      expect(component.appliedFilters.chapter).toBeUndefined();
      expect(component.appliedFilters.warehouse).toBe('WH1');
    });

    it('should remove effectiveDate and effectiveDatePeriod', () => {
      component.appliedFilters = {
        effectiveDate: new Date('2025-01-01') as any,
        effectiveDatePeriod: 'AFTER'
      };
      component.removeChip('effectiveDate');

      expect(component.appliedFilters.effectiveDate).toBeUndefined();
      expect(component.appliedFilters.effectiveDatePeriod).toBeUndefined();
    });

    it('should remove terminationDate and terminationDatePeriod', () => {
      component.appliedFilters = {
        terminationDate: new Date('2025-12-31') as any,
        terminationDatePeriod: 'BEFORE'
      };
      component.removeChip('terminationDate');

      expect(component.appliedFilters.terminationDate).toBeUndefined();
      expect(component.appliedFilters.terminationDatePeriod).toBeUndefined();
    });

    it('should reset pageIndex when removing chip', () => {
      component.pageIndex = 3;
      component.appliedFilters = { warehouse: 'WH1' };
      component.removeChip('warehouse');
      expect(component.pageIndex).toBe(0);
    });

    it('should reapply filters after removing chip', () => {
      component.appliedFilters = { warehouse: 'WH1' };
      component.removeChip('warehouse');
      expect(component.filteredAssignments.length).toBe(2);
    });
  });

  /* ---- NEW: clearFilters tests ---- */

  describe('clearFilters', () => {
    it('should clear all filters, chips, reset page, and reapply', () => {
      component.assignments = [makeRow(), makeRow()];
      component.appliedFilters = { warehouse: 'WH1', chapter: 'DAL' };
      component.filterChips = [
        { key: 'warehouse', value: 'WH1', label: 'Warehouse: WH1' },
        { key: 'chapter', value: 'DAL', label: 'Chapter: DAL' }
      ];
      component.pageIndex = 3;

      component.clearFilters();

      expect(component.appliedFilters).toEqual({});
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(component.filteredAssignments.length).toBe(2);
    });
  });

  /* ---- NEW: Dialog tests ---- */

  describe('openAssignWarehouseDialog', () => {
    it('should not open dialog when userId is empty', () => {
      spyOn(console, 'warn');
      component.userId = '';
      component.openAssignWarehouseDialog();
      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should not open dialog when userId is whitespace only', () => {
      spyOn(console, 'warn');
      component.userId = '   ';
      component.openAssignWarehouseDialog();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open dialog with correct config when userId exists', () => {
      component.userId = 'TESTUSER';
      component.displayUserId = 'TESTUSER';
      component.userFullName = 'John Doe';
      component.userGroup = 'IT';

      component.openAssignWarehouseDialog();

      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.mode).toBe('add');
      expect(callArgs[1].data.user.userId).toBe('TESTUSER');
      expect(callArgs[1].data.user.userName).toBe('John Doe');
      expect(callArgs[1].data.user.department).toBe('IT');
    });

    it('should reload warehouses when dialog returns a result', () => {
      service.getWarehouses.and.returnValue(of([]));
      component.userId = 'TESTUSER';

      component.openAssignWarehouseDialog();
      afterClosedSubject.next(true);

      expect(service.getWarehouses).toHaveBeenCalled();
    });

    it('should not reload warehouses when dialog is cancelled', () => {
      service.getWarehouses.calls.reset();
      component.userId = 'TESTUSER';

      component.openAssignWarehouseDialog();
      afterClosedSubject.next(null);

      expect(service.getWarehouses).not.toHaveBeenCalled();
    });
  });

  describe('openEditWarehouseDialog', () => {
    const testRow: WarehouseRow = makeRow({
      warehouse: 'WH1',
      warehouseDescription: 'Warehouse One',
      chapterId: 'DAL',
      chapterName: 'Dallas',
      defaultPrinter: 'P1',
      printerDescription: 'Printer One',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    });

    it('should set editingRowIndex and open dialog in edit mode', () => {
      component.displayUserId = 'TESTUSER';
      component.userFullName = 'John Doe';
      component.userGroup = 'IT';

      component.openEditWarehouseDialog(testRow, 3);

      expect(component.editingRowIndex).toBe(3);
      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.mode).toBe('edit');
      expect(callArgs[1].data.index).toBe(3);
      expect(callArgs[1].data.assignment.warehouseId).toBe('WH1');
      expect(callArgs[1].data.assignment.chapterId).toBe('DAL');
    });

    it('should set printerId to null when defaultPrinter is dash', () => {
      const rowWithDash = makeRow({ defaultPrinter: '-', printerDescription: '' });
      component.openEditWarehouseDialog(rowWithDash, 0);

      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.printerId).toBeNull();
      expect(callArgs[1].data.assignment.printer).toBeNull();
    });

    it('should set terminationDate to null when it is dash', () => {
      const rowWithDash = makeRow({ terminationDate: '-' });
      component.openEditWarehouseDialog(rowWithDash, 0);

      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.terminationDate).toBeNull();
    });

    it('should pass terminationDate when it is not dash', () => {
      component.openEditWarehouseDialog(testRow, 0);

      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.terminationDate).toBe('2025-12-31');
    });

    it('should clear editingRowIndex and reload warehouses when dialog returns result', () => {
      service.getWarehouses.and.returnValue(of([]));
      component.userId = 'TESTUSER';
      component.openEditWarehouseDialog(testRow, 3);

      expect(component.editingRowIndex).toBe(3);

      afterClosedSubject.next(true);

      expect(component.editingRowIndex).toBeNull();
      expect(service.getWarehouses).toHaveBeenCalled();
    });

    it('should clear editingRowIndex but not reload when dialog is cancelled', () => {
      service.getWarehouses.calls.reset();
      component.openEditWarehouseDialog(testRow, 3);

      afterClosedSubject.next(null);

      expect(component.editingRowIndex).toBeNull();
      expect(service.getWarehouses).not.toHaveBeenCalled();
    });

    it('should use warehouseDescription for warehouseName when available', () => {
      component.openEditWarehouseDialog(testRow, 0);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.warehouseName).toBe('Warehouse One');
    });

    it('should fall back to warehouse for warehouseName when description is empty', () => {
      const rowNoDesc = makeRow({ warehouse: 'WH1', warehouseDescription: '' });
      component.openEditWarehouseDialog(rowNoDesc, 0);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.warehouseName).toBe('WH1');
    });

    it('should use printerDescription for printer when available', () => {
      component.openEditWarehouseDialog(testRow, 0);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.printer).toBe('Printer One');
    });

    it('should fall back to defaultPrinter for printer when description is empty', () => {
      const rowNoDesc = makeRow({ defaultPrinter: 'P1', printerDescription: '' });
      component.openEditWarehouseDialog(rowNoDesc, 0);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.assignment.printer).toBe('P1');
    });
  });

  /* ---- NEW: headerConfig ---- */

  describe('headerConfig', () => {
    it('should have correct breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs!.length).toBe(2);
      expect(component.headerConfig.breadcrumbs![0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs![0].link).toBe('/home');
      expect(component.headerConfig.breadcrumbs![1].label).toBe('User Warehouse');
      expect(component.headerConfig.breadcrumbs![1].link).toBeNull();
    });
  });
});

/* =====================================================================
   PAGINATION TESTS
===================================================================== */

describe('ViewWarehouseComponent - Pagination', () => {
  let component: ViewWarehouseComponent;
  let fixture: ComponentFixture<ViewWarehouseComponent>;
  let warehouseServiceSpy: any;
  let chapterChangedSubject: Subject<void>;

  const mockAssignments: WarehouseRow[] = Array.from({ length: 25 }).map(
    (_, i) => ({
      warehouse: `Warehouse ${i + 1}`,
      warehouseDescription: '',
      chapterId: 'DAL',
      chapterName: 'Brooke Army Medical Center',
      defaultPrinter: 'Printer',
      printerDescription: 'Default Printer',
      effectiveDate: '01-JAN-2025',
      terminationDate: '01-DEC-2025',
      modifiedDate: '01-OCT-2025',
      status: 'Active' as const
    })
  );

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    warehouseServiceSpy = jasmine.createSpyObj('WarehouseService', [
      'getWarehouses',
      'filterWarehouses',
      'getUsersDropdown'
    ]);
    warehouseServiceSpy.getUsersDropdown.and.returnValue(of([]));

    const routerMock = {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
      events: of(),
      url: '/system-administration/warehouse/view-warehouse'
    };

    TestBed.configureTestingModule({
      imports: [ViewWarehouseComponent],
      providers: [
        provideHttpClient(),
        { provide: WarehouseService, useValue: warehouseServiceSpy },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: {}, queryParams: of({}) } },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ViewWarehouseComponent);
    component = fixture.componentInstance;

    component.assignments = mockAssignments;
    component.filteredAssignments = [...mockAssignments];
    component.pageSize = 10;
    component.pageIndex = 0;

    component.applyPagination();
  });

  it('should load first page correctly', () => {
    expect(component.pagedAssignments.length).toBe(10);
    expect(component.startRow).toBe(1);
    expect(component.endRow).toBe(10);
  });

  it('should go to next page', () => {
    component.nextPage();

    expect(component.pageIndex).toBe(1);
    expect(component.startRow).toBe(11);
    expect(component.endRow).toBe(20);
  });

  it('should go to last page', () => {
    component.goToLast();

    expect(component.pageIndex).toBe(2);
    expect(component.pagedAssignments.length).toBe(5);
  });

  it('should return true for active warehouse', () => {
    expect(component.isActive(mockAssignments[0])).toBeTrue();
  });

  /* ---- NEW: Additional pagination tests ---- */

  it('should not go beyond last page when calling nextPage', () => {
    component.goToLast();
    const lastPageIndex = component.pageIndex;
    component.nextPage();
    expect(component.pageIndex).toBe(lastPageIndex);
  });

  it('should not go below first page when calling prevPage', () => {
    component.pageIndex = 0;
    component.prevPage();
    expect(component.pageIndex).toBe(0);
  });

  it('should go to previous page', () => {
    component.pageIndex = 2;
    component.applyPagination();
    component.prevPage();

    expect(component.pageIndex).toBe(1);
    expect(component.startRow).toBe(11);
    expect(component.endRow).toBe(20);
  });

  it('should go to first page', () => {
    component.pageIndex = 2;
    component.applyPagination();
    component.goToFirst();

    expect(component.pageIndex).toBe(0);
    expect(component.startRow).toBe(1);
  });

  it('should reset pageIndex on page size change', () => {
    component.pageIndex = 2;
    component.pageSize = 25;
    component.onPageSizeChange();

    expect(component.pageIndex).toBe(0);
    expect(component.pagedAssignments.length).toBe(25);
  });

  it('should return 0 for startRow when no assignments', () => {
    component.filteredAssignments = [];
    expect(component.startRow).toBe(0);
  });

  it('should return correct endRow for partial last page', () => {
    component.pageSize = 10;
    component.filteredAssignments = [...mockAssignments];
    component.pageIndex = 2;
    expect(component.endRow).toBe(25);
  });

  it('should return correct endRow for full page', () => {
    component.pageSize = 10;
    component.filteredAssignments = [...mockAssignments];
    component.pageIndex = 0;
    expect(component.endRow).toBe(10);
  });

  it('should apply pagination to slice filtered assignments correctly', () => {
    component.pageSize = 10;
    component.pageIndex = 1;
    component.applyPagination();

    expect(component.pagedAssignments.length).toBe(10);
    expect(component.pagedAssignments[0].warehouse).toBe('Warehouse 11');
    expect(component.pagedAssignments[9].warehouse).toBe('Warehouse 20');
  });
});
