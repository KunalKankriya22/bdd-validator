import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { ValidFfFlagComponent } from './valid-ff-flag';
import { ValidFfFlagService } from './services/valid-ff-flag.service';
import { ValidFfFlagModel } from './models/valid-ff-flag.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ValidFfFlagFilterChipsUtils } from './utils/filter-chips.utils';

describe('ValidFfFlagComponent', () => {
  let component: ValidFfFlagComponent;
  let fixture: ComponentFixture<ValidFfFlagComponent>;
  let mockValidFfFlagService: jasmine.SpyObj<ValidFfFlagService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let backdropClickSubject: Subject<MouseEvent>;
  let mockApplySubject: Subject<any>;
  let mockCloseSubject: Subject<void>;
  let mockComponentRef: { instance: { currentFilters: any; apply: any; close: any } };

  const mockValidFfFlagData: ValidFfFlagModel[] = [
    {
      chapterID: 'ALL',
      collectionFacilityId: 'W0352',
      sourceType: 'DONOR',
      ffFlagValue: '00',
      effectiveDate: '2017-03-22T17:04:05',
      terminationDate: '2027-03-22T17:04:05',
      modificationDate: '2025-03-25T10:00:00'
    },
    {
      chapterID: 'CH01',
      collectionFacilityId: 'W0353',
      sourceType: 'PRODUCT',
      ffFlagValue: '01',
      effectiveDate: '2018-05-15T10:00:00',
      terminationDate: '2028-05-15T10:00:00',
      modificationDate: '2025-03-25T11:00:00'
    }
  ];

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    mockValidFfFlagService = jasmine.createSpyObj('ValidFfFlagService', [
      'getValidFfFlags',
      'getValidFfFlagFilters',
      'getAddDropdownChapters',
      'getAddDropdownCollectionFacilities',
      'getAddDropdownSourceTypes',
      'addValidFfFlag',
      'updateValidFfFlag'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: new Subject(),
      url: '/test-url'
    });

    backdropClickSubject = new Subject<MouseEvent>();
    mockApplySubject = new Subject<any>();
    mockCloseSubject = new Subject<void>();

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    mockComponentRef = {
      instance: {
        currentFilters: null,
        apply: mockApplySubject.asObservable(),
        close: mockCloseSubject.asObservable()
      }
    };
    mockOverlayRef.attach.and.returnValue(mockComponentRef as any);

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    (mockOverlay as any).scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    };
    mockOverlay.create.and.returnValue(mockOverlayRef as any);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Valid FF Values',
        subtitle: 'Manage valid FF flag values'
      })
    });



      TestBed.configureTestingModule({
      imports: [ValidFfFlagComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: ValidFfFlagService, useValue: mockValidFfFlagService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } }
      ]
    });




    fixture = TestBed.createComponent(ValidFfFlagComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize default state values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });

    it('should define table columns correctly', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(7);
      expect(columns[0].key).toBe('chapterID');
      expect(columns[1].key).toBe('collectionFacilityId');
      expect(columns[2].key).toBe('sourceType');
      expect(columns[3].key).toBe('ffFlagValue');
      expect(columns[4].key).toBe('effectiveDate');
      expect(columns[5].key).toBe('terminationDate');
      expect(columns[6].key).toBe('modificationDate');
    });

    it('should only have Chapter ID column sortable', () => {
      const columns = component.tableConfig.columns;
      expect(columns[0].sortable).toBeTrue();
      expect(columns[1].sortable).toBeFalsy();
      expect(columns[2].sortable).toBeFalsy();
    });

    it('should configure search bar correctly', () => {
      expect(component.searchConfig.placeholder).toContain('Search by Chapter ID');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should configure table with correct options', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
      expect(component.tableConfig.showPagination).toBeFalse();
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
      expect(component.tableConfig.sortConfig!.column).toBe('chapterID');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should configure header with ADD NEW FF FLAG VALUE action', () => {
      expect(component.headerConfig.actions).toBeDefined();
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW FF FLAG VALUE');
      expect(component.headerConfig.actions![0].icon).toBe('add');
    });

    it('should call createRecord when header action onClick is invoked', () => {
      spyOn(component, 'createRecord');
      component.headerConfig.actions![0].onClick();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should configure row actions with edit action', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
    });

    it('should have initial requestState as empty object', () => {
      expect(component.requestState).toEqual({});
    });
  });

  describe('Data Loading', () => {
    it('should load data successfully', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: mockValidFfFlagData, totalRecords: 2 })
      );

      component.loadData();

      expect(component.dataSource).toEqual(mockValidFfFlagData);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    });

    it('should set isLoading to true at start of loadData', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(new Subject().asObservable() as any);

      component.loadData();

      expect(component.isLoading).toBeTrue();
      expect(component.hasError).toBeFalse();
    });

    it('should handle error when loading data fails', () => {
      const error = { error: { message: 'API Error' } };
      mockValidFfFlagService.getValidFfFlags.and.returnValue(throwError(() => error));

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('API Error');
    });

    it('should use default error message when error message is not provided', () => {
      const error = new Error('Network error');
      mockValidFfFlagService.getValidFfFlags.and.returnValue(throwError(() => error));

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load valid FF flag data.');
    });

    it('should pass requestState to service when loading data', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.requestState = { searchKeyword: 'test', sort: 'A' };

      component.loadData();

      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalledWith({ searchKeyword: 'test', sort: 'A' });
    });

    it('should reset hasError to false when loadData is called', () => {
      component.hasError = true;
      component.errorMessage = 'Previous error';
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.loadData();

      expect(component.hasError).toBeFalse();
    });
  });

  describe('Search Functionality', () => {
    it('should update request state with search keyword', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSearch('test search');

      expect(component.requestState.searchKeyword).toBe('test search');
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should set searchKeyword to undefined when search text is empty', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should reload data when searching', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: mockValidFfFlagData, totalRecords: 2 })
      );

      component.onSearch('DONOR');

      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalledWith({
        searchKeyword: 'DONOR'
      });
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should set sort to A for ascending direction', () => {
      component.onSortChange({ column: 'chapterID', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('chapterID');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.requestState.sort).toBe('A');
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should set sort to D for descending direction', () => {
      component.onSortChange({ column: 'chapterID', direction: 'D' });

      expect(component.tableConfig.sortConfig!.column).toBe('chapterID');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
      expect(component.requestState.sort).toBe('D');
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should set sort to undefined for default direction', () => {
      component.requestState.sort = 'A';
      component.onSortChange({ column: 'chapterID', direction: 'default' });

      expect(component.tableConfig.sortConfig!.column).toBe('chapterID');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(component.requestState.sort).toBeUndefined();
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should call loadData after sort change', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'chapterID', direction: 'A' });

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
    it('should set side panel to add mode when createRecord is called', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should set side panel to edit mode with record data when editRecord is called', () => {
      const record = mockValidFfFlagData[0];
      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(record);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should set side panel to view mode with record data when viewRecord is called', () => {
      const record = mockValidFfFlagData[1];
      component.viewRecord(record);

      expect(component.sidePanelMode).toBe('view');
      expect(component.sidePanelData).toEqual(record);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should handle edit action from row actions', () => {
      spyOn(component, 'editRecord');
      const record = mockValidFfFlagData[0];

      component.onRowAction({ action: 'edit', row: record });

      expect(component.editRecord).toHaveBeenCalledWith(record);
    });

    it('should handle view action from row actions', () => {
      spyOn(component, 'viewRecord');
      const record = mockValidFfFlagData[0];

      component.onRowAction({ action: 'view', row: record });

      expect(component.viewRecord).toHaveBeenCalledWith(record);
    });

    it('should set activeRow on dataTableComponent when onRowAction is called', () => {
      const record = mockValidFfFlagData[0];
      component.dataTableComponent = { activeRow: null } as any;
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: record });

      expect(component.dataTableComponent.activeRow).toEqual(record);
    });

    it('should not set activeRow when dataTableComponent is not available', () => {
      const record = mockValidFfFlagData[0];
      (component as any).dataTableComponent = undefined;
      spyOn(component, 'editRecord');

      expect(() => component.onRowAction({ action: 'edit', row: record })).not.toThrow();
    });

    it('should not call editRecord or viewRecord for unknown action', () => {
      spyOn(component, 'editRecord');
      spyOn(component, 'viewRecord');
      const record = mockValidFfFlagData[0];

      component.onRowAction({ action: 'delete', row: record } as any);

      expect(component.editRecord).not.toHaveBeenCalled();
      expect(component.viewRecord).not.toHaveBeenCalled();
    });
  });

  describe('Side Panel', () => {
    it('should close side panel and reset state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockValidFfFlagData[0];
      component.dataTableComponent = { activeRow: mockValidFfFlagData[0] } as any;

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });

    it('should close side panel without error when dataTableComponent is not available', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockValidFfFlagData[0];
      (component as any).dataTableComponent = undefined;

      expect(() => component.closeSidePanel()).not.toThrow();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should call loadData when onSaveSuccess is called', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: mockValidFfFlagData, totalRecords: 2 })
      );
      spyOn(component, 'loadData');

      component.onSaveSuccess();

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    it('should apply filters correctly', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectivePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.collectionFacilityId).toBe('W0352');
      expect(component.requestState.sourceType).toBe('DONOR');
      expect(component.requestState.ffFlagValue).toBe('00');
      expect(component.requestState.effectiveDate).toBe('2024-01-01');
    });

    it('should set undefined for empty filter values', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.collectionFacilityId).toBeUndefined();
      expect(component.requestState.sourceType).toBeUndefined();
      expect(component.requestState.ffFlagValue).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    });

    it('should preserve existing requestState properties when applying filters', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.requestState = { searchKeyword: 'test', sort: 'A' };

      const filters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.sort).toBe('A');
      expect(component.requestState.collectionFacilityId).toBe('W0352');
    });

    it('should apply termination date filters', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters = {
        chapterId: null,
        collectionFacilityId: null,
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };

      component.applyFilters(filters);

      expect(component.requestState.terminationDatePeriod).toBe('Before');
      expect(component.requestState.terminationDate).toBe('2025-12-31');
    });

    it('should generate filter chips when filters are applied', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should call loadData when filters are applied', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      spyOn(component, 'loadData');

      const filters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.loadData).toHaveBeenCalled();
    });

    it('should clear all filters and remove filter params from requestState', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.requestState = {
        searchKeyword: 'test',
        sort: 'A',
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectiveDatePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      component.appliedFilters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectivePeriod: 'After',
        effectiveDate: '2024-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      component.filterChips = [{ key: 'sourceType', label: 'Source Type: DONOR', value: 'DONOR' }];

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.sort).toBe('A');
      expect(component.requestState.collectionFacilityId).toBeUndefined();
      expect(component.requestState.sourceType).toBeUndefined();
      expect(component.requestState.ffFlagValue).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
    });

    it('should call loadData when clearing all filters', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      spyOn(component, 'loadData');

      component.clearAllFilters();

      expect(component.loadData).toHaveBeenCalled();
    });

    it('should check if active filters exist', () => {
      component.filterChips = [
        { key: 'sourceType', label: 'Source Type: DONOR', value: 'DONOR' }
      ];

      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false when no active filters', () => {
      component.filterChips = [];

      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should call clearAllFilters when removing filter chip returns null', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      spyOn(ValidFfFlagFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(null);
      spyOn(component, 'clearAllFilters');

      component.onRemoveFilterChip('sourceType');

      expect(component.clearAllFilters).toHaveBeenCalled();
    });

    it('should call applyFilters when removing filter chip returns updated filters', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      const updatedFilters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      spyOn(ValidFfFlagFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(updatedFilters);
      spyOn(component, 'applyFilters');

      component.onRemoveFilterChip('sourceType');

      expect(component.applyFilters).toHaveBeenCalledWith(updatedFilters);
    });
  });

  describe('Filter Panel', () => {
    let componentOverlay: any;
    let testOverlayRef: jasmine.SpyObj<any>;
    let testApplySubject: Subject<any>;
    let testCloseSubject: Subject<void>;
    let testBackdropSubject: Subject<MouseEvent>;
    let testComponentRef: { instance: { currentFilters: any; apply: any; close: any } };

    function setupOverlayMocks(): void {
      componentOverlay = (component as any).overlay;
      testApplySubject = new Subject<any>();
      testCloseSubject = new Subject<void>();
      testBackdropSubject = new Subject<MouseEvent>();

      testOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
      testBackdropSubject = new Subject<MouseEvent>();
      testOverlayRef.backdropClick.and.returnValue(testBackdropSubject.asObservable());

      testComponentRef = {
        instance: {
          currentFilters: null,
          apply: testApplySubject.asObservable(),
          close: testCloseSubject.asObservable()
        }
      };
      testOverlayRef.attach.and.returnValue(testComponentRef);

      spyOn(componentOverlay, 'create').and.returnValue(testOverlayRef);
      spyOn(componentOverlay, 'position').and.returnValue({
        flexibleConnectedTo: jasmine.createSpy().and.returnValue({
          withPositions: jasmine.createSpy().and.callFake(function(this: any) { return this; }),
          withPush: jasmine.createSpy().and.callFake(function(this: any) { return this; })
        })
      });
      spyOn(componentOverlay.scrollStrategies, 'block').and.returnValue({});
    }

    it('should not open filter if already open', () => {
      component.isFilterOpen = true;
      componentOverlay = (component as any).overlay;
      spyOn(componentOverlay, 'position');

      component.openFilter();

      expect(componentOverlay.position).not.toHaveBeenCalled();
    });

    it('should open filter panel with overlay and set isFilterOpen to true', () => {
      setupOverlayMocks();
      component.isFilterOpen = false;
      component.tableCard = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
      expect(componentOverlay.create).toHaveBeenCalled();
      expect(testOverlayRef.attach).toHaveBeenCalled();
    });

    it('should set currentFilters on filter component instance', () => {
      setupOverlayMocks();
      component.isFilterOpen = false;
      component.tableCard = { nativeElement: document.createElement('div') } as any;
      component.appliedFilters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      component.openFilter();

      expect(testComponentRef.instance.currentFilters).toEqual(component.appliedFilters);
    });

    it('should apply filters and close panel when apply event emitted from filter panel', () => {
      setupOverlayMocks();
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.isFilterOpen = false;
      component.tableCard = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      const testFilters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };

      testApplySubject.next(testFilters);

      expect(component.appliedFilters).toEqual(testFilters);
      expect(component.isFilterOpen).toBeFalse();
      expect(testOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should close filter panel when close event emitted', () => {
      setupOverlayMocks();
      component.isFilterOpen = false;
      component.tableCard = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      testCloseSubject.next();

      expect(component.isFilterOpen).toBeFalse();
      expect(testOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should close filter panel on backdrop click', () => {
      setupOverlayMocks();
      component.isFilterOpen = false;
      component.tableCard = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      testBackdropSubject.next(new MouseEvent('click'));

      expect(component.isFilterOpen).toBeFalse();
      expect(testOverlayRef.dispose).toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    it('should reset state when chapter changes', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.ngOnInit();

      component.sidePanelOpen = true;
      component.sidePanelData = mockValidFfFlagData[0];
      component.appliedFilters = {
        chapterId: null,
        collectionFacilityId: 'W0352',
        sourceType: null,
        ffFlagValue: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'test', label: 'test', value: 'test' }];
      component.searchText = 'some search';
      component.requestState = { searchKeyword: 'test', sort: 'A' };
      component.hasError = true;
      component.errorMessage = 'Some error';

      mockValidFfFlagService.getValidFfFlags.calls.reset();

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.requestState).toEqual({});
      expect(component.tableConfig.sortConfig!.column).toBe('chapterID');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
      expect(component.dataSource).toEqual([]);
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should call clearSearch on searchBarComponent if available when chapter changes', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.ngOnInit();

      const mockSearchBar = jasmine.createSpyObj('SearchBar', ['clearSearch', 'focus']);
      component.searchBarComponent = mockSearchBar;

      chapterChangedSubject.next();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call loadData on ngOnInit', () => {
      mockValidFfFlagService.getValidFfFlags.and.returnValue(
        of({ data: mockValidFfFlagData, totalRecords: 2 })
      );

      component.ngOnInit();

      expect(mockValidFfFlagService.getValidFfFlags).toHaveBeenCalled();
    });

    it('should complete destroy$ subject on ngOnDestroy', () => {
      const destroySubject = (component as any).destroy$;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });

    it('should unsubscribe filter subscriptions on ngOnDestroy', () => {
      const mockSub1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      const mockSub2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      (component as any).filterSubscriptions = [mockSub1, mockSub2];

      component.ngOnDestroy();

      expect(mockSub1.unsubscribe).toHaveBeenCalled();
      expect(mockSub2.unsubscribe).toHaveBeenCalled();
    });

    it('should dispose overlay on ngOnDestroy if exists', () => {
      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;

      component.ngOnDestroy();

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
    });

    it('should disconnect resizeObserver on ngOnDestroy if exists', () => {
      const mockResizeObserver = jasmine.createSpyObj('ResizeObserver', ['disconnect', 'observe']);
      (component as any).resizeObserver = mockResizeObserver;

      component.ngOnDestroy();

      expect(mockResizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should not throw if overlayRef is null on ngOnDestroy', () => {
      (component as any).overlayRef = null;
      (component as any).resizeObserver = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly through column valueFormatter', () => {
      const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      expect(effectiveDateCol).toBeDefined();
      expect(effectiveDateCol!.valueFormatter).toBeDefined();

      const formatted = effectiveDateCol!.valueFormatter!('2017-03-22T17:04:05');
      expect(formatted).toMatch(/22-MAR-2017/);
    });

    it('should return dash for null date values', () => {
      const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      const formatted = effectiveDateCol!.valueFormatter!(null);
      expect(formatted).toBe('-');
    });

    it('should return dash for undefined date values', () => {
      const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      const formatted = effectiveDateCol!.valueFormatter!(undefined);
      expect(formatted).toBe('-');
    });

    it('should format termination date column', () => {
      const terminationDateCol = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(terminationDateCol).toBeDefined();
      expect(terminationDateCol!.valueFormatter).toBeDefined();

      const formatted = terminationDateCol!.valueFormatter!('2027-03-22T17:04:05');
      expect(formatted).toMatch(/22-MAR-2027/);
    });

    it('should format modification date column', () => {
      const modificationDateCol = component.tableConfig.columns.find(c => c.key === 'modificationDate');
      expect(modificationDateCol).toBeDefined();
      expect(modificationDateCol!.valueFormatter).toBeDefined();

      const formatted = modificationDateCol!.valueFormatter!('2025-03-25T10:00:00');
      expect(formatted).toMatch(/25-MAR-2025/);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should call createRecord on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should call createRecord on Alt+C (uppercase)', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search bar on Alt+S', () => {
      const mockSearchBar = jasmine.createSpyObj('SearchBar', ['focus', 'clearSearch']);
      component.searchBarComponent = mockSearchBar;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
    });

    it('should not throw on Alt+S when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should call openFilter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when overlayRef exists', () => {
      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      (component as any).overlayRef = null;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      spyOn(component, 'closeSidePanel');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should not do anything on Escape when neither overlay nor side panel is active', () => {
      (component as any).overlayRef = null;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key for Alt+C/S/F', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');

      const eventC = new KeyboardEvent('keydown', { key: 'c' });
      const eventS = new KeyboardEvent('keydown', { key: 's' });
      const eventF = new KeyboardEvent('keydown', { key: 'f' });

      component.handleKeyboardShortcut(eventC);
      component.handleKeyboardShortcut(eventS);
      component.handleKeyboardShortcut(eventF);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Detection', () => {
    it('should call checkHorizontalScroll on window resize', () => {
      spyOn(component as any, 'checkHorizontalScroll');

      component.onWindowResize();

      expect((component as any).checkHorizontalScroll).toHaveBeenCalled();
    });

    it('should skip setupHorizontalScrollDetection when tableWrapper is not available', () => {
      (component as any).tableWrapper = undefined;

      expect(() => component.ngAfterViewInit()).not.toThrow();
    });

    it('should skip checkHorizontalScroll when tableWrapper is not available', () => {
      (component as any).tableWrapper = undefined;

      expect(() => (component as any).checkHorizontalScroll()).not.toThrow();
    });

    it('should toggle has-horizontal-scroll class when scroll exists', () => {
      const el = document.createElement('div');
      const scrollWrapper = document.createElement('div');
      scrollWrapper.classList.add('data-table-scroll-wrapper');
      el.appendChild(scrollWrapper);

      Object.defineProperty(scrollWrapper, 'scrollWidth', { value: 1000, configurable: true });
      Object.defineProperty(scrollWrapper, 'clientWidth', { value: 500, configurable: true });

      component.tableWrapper = { nativeElement: el } as any;

      (component as any).checkHorizontalScroll();

      expect(el.classList.contains('has-horizontal-scroll')).toBeTrue();
    });

    it('should remove has-horizontal-scroll class when no scroll', () => {
      const el = document.createElement('div');
      el.classList.add('has-horizontal-scroll');
      const scrollWrapper = document.createElement('div');
      scrollWrapper.classList.add('data-table-scroll-wrapper');
      el.appendChild(scrollWrapper);

      Object.defineProperty(scrollWrapper, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(scrollWrapper, 'clientWidth', { value: 500, configurable: true });

      component.tableWrapper = { nativeElement: el } as any;

      (component as any).checkHorizontalScroll();

      expect(el.classList.contains('has-horizontal-scroll')).toBeFalse();
    });

    it('should use element itself when no scroll wrapper child exists', () => {
      const el = document.createElement('div');

      Object.defineProperty(el, 'scrollWidth', { value: 1000, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 500, configurable: true });

      component.tableWrapper = { nativeElement: el } as any;

      (component as any).checkHorizontalScroll();

      expect(el.classList.contains('has-horizontal-scroll')).toBeTrue();
    });

    it('should setup resize observer in ngAfterViewInit when tableWrapper exists', () => {
      const el = document.createElement('div');
      component.tableWrapper = { nativeElement: el } as any;

      spyOn(component as any, 'checkHorizontalScroll');

      component.ngAfterViewInit();

      expect((component as any).resizeObserver).toBeDefined();
      expect((component as any).checkHorizontalScroll).toHaveBeenCalled();
    });

    it('should observe scroll wrapper element when it exists in setupHorizontalScrollDetection', () => {
      const el = document.createElement('div');
      const scrollWrapper = document.createElement('div');
      scrollWrapper.classList.add('data-table-scroll-wrapper');
      el.appendChild(scrollWrapper);

      component.tableWrapper = { nativeElement: el } as any;
      spyOn(component as any, 'checkHorizontalScroll');

      component.ngAfterViewInit();

      expect((component as any).resizeObserver).toBeDefined();
    });
  });
});
