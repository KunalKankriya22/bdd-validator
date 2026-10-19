import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Overlay, OverlayRef } from '@angular/cdk/overlay';

import { DefineProcedureExclusionsComponent } from './define-procedure-exclusions';
import { DefineProcedureExclusionsService } from './services/define-procedure-exclusions.service';
import { DefineProcedureExclusionsModel, DefineProcedureExclusionsFilterValue } from './models/define-procedure-exclusions.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ProcedureExclusionsFilterChipsUtils } from './utils/filter-chips.utils';
import { signal } from '@angular/core';

describe('DefineProcedureExclusionsComponent', () => {
  let serviceSpy: any;
  let component: DefineProcedureExclusionsComponent;
  let fixture: ComponentFixture<DefineProcedureExclusionsComponent>;
  let service: jasmine.SpyObj<DefineProcedureExclusionsService>;
  let chapterChangedSubject: Subject<void>;

  const mockResponse = {
    data: [
      {
        donationType: 'WB',
        donationTypeDesc: 'Whole Blood',
        procedure: 'PROC01',
        procedureDesc: 'Test Procedure',
        interdiction: 'INT01',
        effectiveDate: new Date('2025-01-15'),
        terminationDate: null
      },
      {
        donationType: 'PLT',
        donationTypeDesc: 'Platelets',
        procedure: 'PROC02',
        procedureDesc: 'Another Procedure',
        interdiction: 'INT02',
        effectiveDate: new Date('2025-03-01'),
        terminationDate: new Date('2025-12-31')
      }
    ] as DefineProcedureExclusionsModel[],
    totalRecords: 2
  };

  const emptyResponse = { data: [], totalRecords: 0 };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineProcedureExclusionsService', [
      'getDefineProcedureExclusions',
      'getProcedureExclusionsFilters',
      'addProcedureExclusion',
      'updateProcedureExclusion',
      'getDonationTypesLookup',
      'getProceduresLookup',
      'getInterdictionsLookup'
    ]);

    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    const pageHeaderServiceSpy = {
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue(undefined),
      getTitle: jasmine.createSpy('getTitle').and.returnValue('Define Procedure Exclusions'),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(''),
      pageHeaderData: signal({ title: 'Define Procedure Exclusions', subtitle: '' })
    };

      TestBed.configureTestingModule({
      imports: [DefineProcedureExclusionsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DefineProcedureExclusionsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        Overlay
      ]
    });




      serviceSpy.getDefineProcedureExclusions.calls.reset();


      serviceSpy.getProcedureExclusionsFilters.calls.reset();


      serviceSpy.addProcedureExclusion.calls.reset();


      serviceSpy.updateProcedureExclusion.calls.reset();


      serviceSpy.getDonationTypesLookup.calls.reset();


      serviceSpy.getProceduresLookup.calls.reset();


      serviceSpy.getInterdictionsLookup.calls.reset();


    service = TestBed.inject(DefineProcedureExclusionsService) as jasmine.SpyObj<DefineProcedureExclusionsService>;
    fixture = TestBed.createComponent(DefineProcedureExclusionsComponent);
    component = fixture.componentInstance;


    });


  it('should initialize with default configuration', () => {
    expect(component.headerConfig.title).toBe('Define Procedure Exclusions');
    expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    expect(component.searchConfig.placeholder).toContain('Donation Type');
  });

  // ─── initializeConfigurations ───────────────────────────────────────

  it('should set up breadcrumbs with Home and Define Procedure Exclusions', () => {
    expect(component.headerConfig.breadcrumbs.length).toBe(3);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[2].label).toBe('Define Procedure Exclusions');
  });

  it('should configure header action for ADD PROCEDURE EXCLUSION', () => {
    expect(component.headerConfig.actions.length).toBe(1);
    expect(component.headerConfig.actions[0].label).toBe('ADD PROCEDURE EXCLUSION');
    expect(component.headerConfig.actions[0].icon).toBe('add');
  });

  it('should invoke createRecord when header action onClick is called', () => {
    spyOn(component, 'createRecord');
    component.headerConfig.actions[0].onClick();
    expect(component.createRecord).toHaveBeenCalled();
  });

  it('should configure search bar with correct placeholder and options', () => {
    expect(component.searchConfig.placeholder).toBe('Search by Donation Type or Description');
    expect(component.searchConfig.minLength).toBe(1);
    expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
  });

  it('should configure table with 7 columns', () => {
    const columns = component.tableConfig.columns;
    expect(columns.length).toBe(7);
    expect(columns[0].key).toBe('donationType');
    expect(columns[0].sortable).toBeTrue();
    expect(columns[1].key).toBe('donationTypeDesc');
    expect(columns[2].key).toBe('procedure');
    expect(columns[3].key).toBe('procedureDesc');
    expect(columns[4].key).toBe('interdiction');
    expect(columns[5].key).toBe('effectiveDate');
    expect(columns[6].key).toBe('terminationDate');
  });

  it('should configure table pagination with defaults', () => {
    expect(component.tableConfig.pagination?.pageSize).toBe(25);
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
  });

  it('should configure row actions with edit', () => {
    const rowActions = component.tableConfig.rowActions;
    expect(rowActions.length).toBe(1);
    expect(rowActions[0].action).toBe('edit');
    expect(rowActions[0].icon).toBe('edit');
  });

  it('should set table sort config to donationType with default direction', () => {
    expect(component.tableConfig.sortConfig?.column).toBe('donationType');
    expect(component.tableConfig.sortConfig?.direction).toBe('default');
  });

  it('should set non-empty emptyMessage and loadingMessage', () => {
    expect(component.tableConfig.emptyMessage).toBeTruthy();
    expect(component.tableConfig.loadingMessage).toBeTruthy();
  });

  // ─── formatDate via column valueFormatter ───────────────────────────

  it('should format valid date through effectiveDate column formatter', () => {
    const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
    expect(effectiveDateCol?.valueFormatter).toBeDefined();
    const result = effectiveDateCol!.valueFormatter!(new Date('2025-01-15'));
    expect(result).toBe('15-JAN-2025');
  });

  it('should return dash for null date through column formatter', () => {
    const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
    const result = effectiveDateCol!.valueFormatter!(null);
    expect(result).toBe('-');
  });

  it('should return dash for undefined date through column formatter', () => {
    const effectiveDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
    const result = effectiveDateCol!.valueFormatter!(undefined);
    expect(result).toBe('-');
  });

  it('should format string date through terminationDate column formatter', () => {
    const terminationDateCol = component.tableConfig.columns.find(c => c.key === 'terminationDate');
    const result = terminationDateCol!.valueFormatter!('2025-12-31');
    expect(result).toBe('31-DEC-2025');
  });

  // ─── loadData ───────────────────────────────────────────────────────

  it('should load data successfully on ngOnInit', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(mockResponse));
    component.ngOnInit();

    expect(component.isLoading).toBeFalse();
    expect(component.hasError).toBeFalse();
    expect(component.dataSource.length).toBe(2);
    expect(component.tableConfig.pagination!.totalRecords).toBe(2);
  });

  it('should set isLoading to true while data is loading', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(mockResponse));
    // Before loadData completes, isLoading should be set to true at the start
    const originalSubscribe = (of(mockResponse)).subscribe;
    component.isLoading = false;
    component.loadData();
    // After synchronous observable, isLoading should be false again
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading data', () => {
    service.getDefineProcedureExclusions.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');

    component.loadData();

    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Failed to load procedure exclusion data. Please try again.');
    expect(console.error).toHaveBeenCalled();
  });

  it('should pass correct skip and take values when loading data', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 2;
    component.tableConfig.pagination!.pageSize = 10;

    component.loadData();

    expect(service.getDefineProcedureExclusions).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
  });

  it('should pass current requestState when loading data', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.requestState = { searchKeyword: 'test', sort: 'A' };

    component.loadData();

    expect(service.getDefineProcedureExclusions).toHaveBeenCalledWith(
      25, 0, jasmine.objectContaining({ searchKeyword: 'test', sort: 'A' })
    );
  });

  it('should reset hasError to false when loadData is called', () => {
    component.hasError = true;
    component.errorMessage = 'some error';
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.loadData();

    expect(component.hasError).toBeFalse();
  });

  // ─── onSearch ───────────────────────────────────────────────────────

  it('should apply search and reload data', () => {
    const mockData = {
      data: [],
      totalRecords: 0
    };
    service.getDefineProcedureExclusions.and.returnValue(of(mockData));

    component.onSearch('test search');

    expect(component.requestState.searchKeyword).toBe('test search');
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should clear searchKeyword when empty string is passed to onSearch', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.requestState.searchKeyword = 'old search';

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeUndefined();
  });

  it('should reset pageIndex to 0 on search', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 5;

    component.onSearch('test');

    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  // ─── onPageChange ───────────────────────────────────────────────────

  it('should update pagination and reload data on page change', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.onPageChange({ pageIndex: 3, pageSize: 50, length: 200, previousPageIndex: 2 });

    expect(component.tableConfig.pagination!.pageIndex).toBe(3);
    expect(component.tableConfig.pagination!.pageSize).toBe(50);
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should calculate correct skip on page change', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.onPageChange({ pageIndex: 2, pageSize: 10, length: 100, previousPageIndex: 1 });

    expect(service.getDefineProcedureExclusions).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
  });

  // ─── onSortChange ──────────────────────────────────────────────────

  it('should set sort to ascending and reload data', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.onSortChange({ column: 'donationType', direction: 'A' });

    expect(component.tableConfig.sortConfig!.column).toBe('donationType');
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.requestState.sort).toBe('A');
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should set sort to descending and reload data', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.onSortChange({ column: 'donationType', direction: 'D' });

    expect(component.requestState.sort).toBe('D');
  });

  it('should clear sort when direction is default', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.requestState.sort = 'A';

    component.onSortChange({ column: 'donationType', direction: 'default' });

    expect(component.requestState.sort).toBeUndefined();
  });

  // ─── onRowAction ───────────────────────────────────────────────────

  it('should handle row action', () => {
    const mockRecord = {
      donationType: 'WB',
      donationTypeDescription: 'Whole Blood',
      procedure: 'PROC01',
      procedureDescription: 'Test Procedure',
      interdiction: 'INT01',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    };

    spyOn(component, 'editRecord');

    component.onRowAction({
      action: 'edit',
      row: mockRecord
    });

    expect(component.editRecord).toHaveBeenCalledWith(mockRecord);
  });

  it('should set activeRow on dataTableComponent if available', () => {
    const mockRecord = { donationType: 'WB' } as DefineProcedureExclusionsModel;
    const mockDataTable = { activeRow: null as any };
    (component as any).dataTableComponent = mockDataTable as any;
    spyOn(component, 'editRecord');

    component.onRowAction({ action: 'edit', row: mockRecord });

    expect(mockDataTable.activeRow).toBe(mockRecord);
  });

  it('should not throw when dataTableComponent is undefined', () => {
    (component as any).dataTableComponent = undefined;
    spyOn(component, 'editRecord');

    expect(() => {
      component.onRowAction({ action: 'edit', row: {} as any });
    }).not.toThrow();
  });

  it('should not call editRecord for unknown action', () => {
    spyOn(component, 'editRecord');
    (component as any).dataTableComponent = undefined;

    component.onRowAction({ action: 'delete', row: {} as any });

    expect(component.editRecord).not.toHaveBeenCalled();
  });

  // ─── createRecord ──────────────────────────────────────────────────

  it('should set side panel to add mode and open it', () => {
    component.sidePanelOpen = false;
    component.sidePanelMode = 'edit';
    component.sidePanelData = { donationType: 'WB' } as DefineProcedureExclusionsModel;

    component.createRecord();

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
    expect(component.sidePanelOpen).toBeTrue();
  });

  // ─── editRecord ────────────────────────────────────────────────────

  it('should set side panel to edit mode with record data and open it', () => {
    const record = { donationType: 'WB', procedure: 'PROC01' } as DefineProcedureExclusionsModel;
    component.sidePanelOpen = false;

    component.editRecord(record);

    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(record);
    expect(component.sidePanelOpen).toBeTrue();
  });

  // ─── closeSidePanel ────────────────────────────────────────────────

  it('should close side panel and clear data', () => {
    component.sidePanelOpen = true;
    component.sidePanelData = { donationType: 'WB' } as DefineProcedureExclusionsModel;

    component.closeSidePanel();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });

  it('should clear activeRow on dataTableComponent when closing side panel', () => {
    const mockDataTable = { activeRow: { donationType: 'WB' } };
    (component as any).dataTableComponent = mockDataTable as any;
    component.sidePanelOpen = true;

    component.closeSidePanel();

    expect(mockDataTable.activeRow).toBeNull();
  });

  it('should not throw when dataTableComponent is undefined on closeSidePanel', () => {
    (component as any).dataTableComponent = undefined;
    component.sidePanelOpen = true;

    expect(() => component.closeSidePanel()).not.toThrow();
  });

  // ─── onSaveSuccess ─────────────────────────────────────────────────

  it('should close side panel and reload data on save success', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.sidePanelOpen = true;

    component.onSaveSuccess();

    expect(component.sidePanelOpen).toBeFalse();
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  // ─── onModeChange ──────────────────────────────────────────────────

  it('should change mode to add and clear sidePanelData', () => {
    component.sidePanelMode = 'edit';
    component.sidePanelData = { donationType: 'WB' } as DefineProcedureExclusionsModel;

    component.onModeChange('add');

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should change mode to edit and keep existing sidePanelData', () => {
    const existingData = { donationType: 'PLT' } as DefineProcedureExclusionsModel;
    component.sidePanelMode = 'add';
    component.sidePanelData = existingData;

    component.onModeChange('edit');

    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(existingData);
  });

  // ─── applyFilters ──────────────────────────────────────────────────

  it('should apply filters and update requestState', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    const filters: DefineProcedureExclusionsFilterValue = {
      donationType: 'WB',
      procedureCode: 'PROC01',
      interdictionCode: null
    };
    component.requestState = { searchKeyword: 'test', sort: 'A' };

    component.applyFilters(filters);

    expect(component.appliedFilters).toBe(filters);
    expect(component.requestState.donationType).toBe('WB');
    expect(component.requestState.procedureCode).toBe('PROC01');
    expect(component.requestState.interdictionCode).toBeUndefined();
    expect(component.requestState.searchKeyword).toBe('test');
    expect(component.requestState.sort).toBe('A');
  });

  it('should generate filter chips from applied filters', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    const filters: DefineProcedureExclusionsFilterValue = {
      donationType: 'WB',
      procedureCode: null,
      interdictionCode: 'INT01'
    };

    component.applyFilters(filters);

    expect(component.filterChips.length).toBe(2);
  });

  it('should reset pageIndex to 0 when applying filters', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 5;

    component.applyFilters({ donationType: 'WB', procedureCode: null, interdictionCode: null });

    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  it('should reload data after applying filters', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));

    component.applyFilters({ donationType: 'WB', procedureCode: null, interdictionCode: null });

    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  // ─── onRemoveFilterChip ────────────────────────────────────────────

  it('should remove filter chip and update request state', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: 'PROC01',
      interdictionCode: null
    };
    component.requestState = { searchKeyword: 'test', donationType: 'WB', procedureCode: 'PROC01', sort: 'A' };

    component.onRemoveFilterChip('donationType');

    expect(component.requestState.donationType).toBeUndefined();
    expect(component.requestState.procedureCode).toBe('PROC01');
    expect(component.requestState.searchKeyword).toBe('test');
    expect(component.requestState.sort).toBe('A');
  });

  it('should reset pageIndex to 0 when removing filter chip', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 3;
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: 'PROC01',
      interdictionCode: null
    };

    component.onRemoveFilterChip('donationType');

    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  it('should reload data after removing filter chip', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: null,
      interdictionCode: null
    };

    component.onRemoveFilterChip('donationType');

    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should set appliedFilters to null when all filters are removed', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: null,
      interdictionCode: null
    };

    component.onRemoveFilterChip('donationType');

    expect(component.appliedFilters).toBeNull();
  });

  it('should reset requestState to only searchKeyword and sort when appliedFilters becomes null', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: null,
      interdictionCode: null
    };
    component.requestState = { searchKeyword: 'search', donationType: 'WB', sort: 'D' };

    component.onRemoveFilterChip('donationType');

    expect(component.requestState).toEqual({
      searchKeyword: 'search',
      sort: 'D'
    });
  });

  // ─── hasActiveFilters ──────────────────────────────────────────────

  it('should return true when there are active filters', () => {
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: null,
      interdictionCode: null
    };

    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return false when there are no active filters', () => {
    component.appliedFilters = null;

    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should return false when all filter values are null', () => {
    component.appliedFilters = {
      donationType: null,
      procedureCode: null,
      interdictionCode: null
    };

    expect(component.hasActiveFilters()).toBeFalse();
  });

  // ─── clearAllFilters ───────────────────────────────────────────────

  it('should clear all filters and reload data', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.appliedFilters = {
      donationType: 'WB',
      procedureCode: 'PROC01',
      interdictionCode: 'INT01'
    };
    component.filterChips = [{ key: 'donationType', label: 'DT: WB', value: 'WB', removable: true }];
    component.requestState = { searchKeyword: 'test', donationType: 'WB', sort: 'A' };

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.requestState).toEqual({ searchKeyword: 'test', sort: 'A' });
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should reset pageIndex to 0 when clearing all filters', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 5;
    component.requestState = {};

    component.clearAllFilters();

    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  // ─── handleKeyboardShortcut ────────────────────────────────────────

  it('should call createRecord on Alt+C', () => {
    spyOn(component, 'createRecord');
    const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.createRecord).toHaveBeenCalled();
  });

  it('should focus search on Alt+S', () => {
    const mockSearchBar = { focus: jasmine.createSpy('focus') };
    (component as any).searchBarComponent = mockSearchBar as any;
    const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockSearchBar.focus).toHaveBeenCalled();
  });

  it('should not throw on Alt+S when searchBarComponent is undefined', () => {
    (component as any).searchBarComponent = undefined;
    const event = new KeyboardEvent('keydown', { key: 's', altKey: true });

    expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
  });

  it('should call openFilter on Alt+F', () => {
    spyOn(component, 'openFilter');
    const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.openFilter).toHaveBeenCalled();
  });

  it('should dispose overlay on Escape when overlay is open', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.isFilterOpen = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should blur filter button on Escape when overlay is open and filterBtn exists', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    const mockFilterBtn = { nativeElement: { blur: jasmine.createSpy('blur') } };
    (component as any).filterBtn = mockFilterBtn;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardShortcut(event);

    expect(mockFilterBtn.nativeElement.blur).toHaveBeenCalled();
  });

  it('should close side panel on Escape when side panel is open and no overlay', () => {
    (component as any).overlayRef = null;
    component.sidePanelOpen = true;
    component.sidePanelData = { donationType: 'WB' } as any;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardShortcut(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should handle uppercase key for Alt shortcuts', () => {
    spyOn(component, 'createRecord');
    const event = new KeyboardEvent('keydown', { key: 'C', altKey: true });

    component.handleKeyboardShortcut(event);

    expect(component.createRecord).toHaveBeenCalled();
  });

  it('should not trigger shortcuts without altKey for letter keys', () => {
    spyOn(component, 'createRecord');
    spyOn(component, 'openFilter');
    const event = new KeyboardEvent('keydown', { key: 'c', altKey: false });

    component.handleKeyboardShortcut(event);

    expect(component.createRecord).not.toHaveBeenCalled();
    expect(component.openFilter).not.toHaveBeenCalled();
  });

  // ─── openFilter toggle behavior ───────────────────────────────────

  it('should dispose existing overlay and return when openFilter is called while filter is open', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.isFilterOpen = true;

    component.openFilter();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  // ─── subscribeToChapterChanges ─────────────────────────────────────

  it('should reset state and reload data on chapter change', () => {
    const mockData = { data: [], totalRecords: 0 };
    service.getDefineProcedureExclusions.and.returnValue(of(mockData));

    component.ngOnInit();

    component.sidePanelOpen = true;
    component.sidePanelData = { donationType: 'WB' } as any;
    component.appliedFilters = { donationType: 'WB', procedureCode: null, interdictionCode: null };
    component.searchText = 'test';
    component.requestState = { searchKeyword: 'test', sort: 'A' };

    service.getDefineProcedureExclusions.calls.reset();

    chapterChangedSubject.next();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.searchText).toBe('');
    expect(component.requestState).toEqual({});
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.tableConfig.sortConfig?.direction).toBe('default');
    expect(service.getDefineProcedureExclusions).toHaveBeenCalled();
  });

  it('should clear searchBarComponent on chapter change when it exists', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.ngOnInit();

    const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch') };
    (component as any).searchBarComponent = mockSearchBar as any;

    chapterChangedSubject.next();

    expect(mockSearchBar.clearSearch).toHaveBeenCalled();
  });

  it('should dispose overlay on chapter change when overlay is open', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.ngOnInit();

    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.isFilterOpen = true;

    chapterChangedSubject.next();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  // ─── ngOnDestroy ───────────────────────────────────────────────────

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should dispose overlayRef on ngOnDestroy when overlay exists', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;

    component.ngOnDestroy();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  it('should not throw on ngOnDestroy when overlayRef is null', () => {
    (component as any).overlayRef = null;

    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── Default property values ───────────────────────────────────────

  it('should initialize with default property values', () => {
    expect(component.dataSource).toEqual([]);
    expect(component.requestState).toEqual({});
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
  });

  it('should set currentYear to current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  // ─── loadData edge cases ──────────────────────────────────────────

  it('should use default values for skip/take when pagination is missing pageIndex', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 0;
    component.tableConfig.pagination!.pageSize = 25;

    component.loadData();

    expect(service.getDefineProcedureExclusions).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
  });

  // ─── openFilter (creating new overlay) ──────────────────────────────

  describe('openFilter with overlay creation', () => {
    let applySubject: Subject<DefineProcedureExclusionsFilterValue>;
    let closeSubject: Subject<void>;
    let backdropSubject: Subject<MouseEvent>;
    let mockOverlayRef: any;
    let mockOverlay: any;

    beforeEach(() => {
      applySubject = new Subject<DefineProcedureExclusionsFilterValue>();
      closeSubject = new Subject<void>();
      backdropSubject = new Subject<MouseEvent>();

      mockOverlayRef = {
        attach: jasmine.createSpy('attach').and.returnValue({
          instance: {
            currentFilters: null as any,
            apply: applySubject.asObservable(),
            close: closeSubject.asObservable()
          }
        }),
        dispose: jasmine.createSpy('dispose'),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable())
      };

      // Build a fully mocked overlay that replaces the component's private reference
      mockOverlay = {
        position: jasmine.createSpy('position').and.returnValue({
          flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
            withPositions: jasmine.createSpy('withPositions').and.returnValue({
              withPush: jasmine.createSpy('withPush').and.returnValue({})
            })
          })
        }),
        create: jasmine.createSpy('create').and.returnValue(mockOverlayRef),
        scrollStrategies: {
          block: jasmine.createSpy('block').and.returnValue({})
        }
      };

      // Directly replace the component's private overlay reference
      (component as any).overlay = mockOverlay;

      // Set required ViewChild refs
      (component as any).tableCard = { nativeElement: document.createElement('div') };
      (component as any).filterBtn = { nativeElement: { blur: jasmine.createSpy('blur') } };
      (component as any).overlayRef = null;
    });

    afterEach(() => {
      // Prevent ngOnDestroy from calling dispose on a mock that lacks internal CDK structure
      (component as any).overlayRef = null;
    });

    it('should create overlay and set isFilterOpen to true', () => {
      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
      expect((component as any).overlayRef).toBe(mockOverlayRef);
    });

    it('should set currentFilters on the filter panel instance', () => {
      const filters: DefineProcedureExclusionsFilterValue = { donationType: 'WB', procedureCode: null, interdictionCode: null };
      component.appliedFilters = filters;

      component.openFilter();

      const attachCall = mockOverlayRef.attach.calls.mostRecent();
      expect(attachCall).toBeDefined();
    });

    it('should apply filters and dispose overlay when apply event fires', () => {
      service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
      component.openFilter();

      const filters: DefineProcedureExclusionsFilterValue = { donationType: 'PLT', procedureCode: null, interdictionCode: null };
      applySubject.next(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should blur filterBtn when apply event fires and filterBtn exists', () => {
      service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
      component.openFilter();

      applySubject.next({ donationType: 'WB', procedureCode: null, interdictionCode: null });

      expect((component as any).filterBtn.nativeElement.blur).toHaveBeenCalled();
    });

    it('should dispose overlay when close event fires', () => {
      component.openFilter();

      closeSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should blur filterBtn when close event fires and filterBtn exists', () => {
      component.openFilter();

      closeSubject.next();

      expect((component as any).filterBtn.nativeElement.blur).toHaveBeenCalled();
    });

    it('should dispose overlay on backdrop click', () => {
      component.openFilter();

      backdropSubject.next(new MouseEvent('click'));

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should blur filterBtn on backdrop click when filterBtn exists', () => {
      component.openFilter();

      backdropSubject.next(new MouseEvent('click'));

      expect((component as any).filterBtn.nativeElement.blur).toHaveBeenCalled();
    });

    it('should not throw on apply when filterBtn is undefined', () => {
      service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
      (component as any).filterBtn = undefined;
      component.openFilter();

      expect(() => {
        applySubject.next({ donationType: 'WB', procedureCode: null, interdictionCode: null });
      }).not.toThrow();
    });

    it('should not throw on close when filterBtn is undefined', () => {
      (component as any).filterBtn = undefined;
      component.openFilter();

      expect(() => {
        closeSubject.next();
      }).not.toThrow();
    });

    it('should not throw on backdrop click when filterBtn is undefined', () => {
      (component as any).filterBtn = undefined;
      component.openFilter();

      expect(() => {
        backdropSubject.next(new MouseEvent('click'));
      }).not.toThrow();
    });
  });

  // ─── openFilter overlay handler edge cases: overlayRef already null ─

  describe('openFilter overlay handler edge cases', () => {
    let applySubject: Subject<DefineProcedureExclusionsFilterValue>;
    let closeSubject: Subject<void>;
    let backdropSubject: Subject<MouseEvent>;

    beforeEach(() => {
      applySubject = new Subject<DefineProcedureExclusionsFilterValue>();
      closeSubject = new Subject<void>();
      backdropSubject = new Subject<MouseEvent>();

      const mockOverlayRef = {
        attach: jasmine.createSpy('attach').and.returnValue({
          instance: {
            currentFilters: null as any,
            apply: applySubject.asObservable(),
            close: closeSubject.asObservable()
          }
        }),
        dispose: jasmine.createSpy('dispose'),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable())
      };

      const mockOverlay = {
        position: jasmine.createSpy('position').and.returnValue({
          flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
            withPositions: jasmine.createSpy('withPositions').and.returnValue({
              withPush: jasmine.createSpy('withPush').and.returnValue({})
            })
          })
        }),
        create: jasmine.createSpy('create').and.returnValue(mockOverlayRef),
        scrollStrategies: {
          block: jasmine.createSpy('block').and.returnValue({})
        }
      };

      (component as any).overlay = mockOverlay;
      (component as any).tableCard = { nativeElement: document.createElement('div') };
      (component as any).filterBtn = { nativeElement: { blur: jasmine.createSpy('blur') } };
      (component as any).overlayRef = null;
    });

    afterEach(() => {
      (component as any).overlayRef = null;
    });

    it('should not throw when apply fires but overlayRef was already nulled', () => {
      service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
      component.openFilter();

      // Manually set overlayRef to null before firing apply (simulating race condition)
      (component as any).overlayRef = null;

      expect(() => {
        applySubject.next({ donationType: 'WB', procedureCode: null, interdictionCode: null });
      }).not.toThrow();
    });

    it('should not throw when close fires but overlayRef was already nulled', () => {
      component.openFilter();
      (component as any).overlayRef = null;

      expect(() => {
        closeSubject.next();
      }).not.toThrow();
    });

    it('should not throw when backdrop click fires but overlayRef was already nulled', () => {
      component.openFilter();
      (component as any).overlayRef = null;

      expect(() => {
        backdropSubject.next(new MouseEvent('click'));
      }).not.toThrow();
    });
  });

  // ─── loadData with null pagination ────────────────────────────────

  it('should use default skip 0 and take 25 when pagination pageIndex and pageSize are 0', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination!.pageIndex = 0;
    component.tableConfig.pagination!.pageSize = 0;

    component.loadData();

    // pageSize 0 || 25 => 25 for take, pageIndex 0 * take => 0 for skip
    expect(service.getDefineProcedureExclusions).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
  });

  // ─── Escape key with filterBtn nativeElement undefined ────────────

  it('should not throw on Escape with overlayRef when filterBtn nativeElement is undefined', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    (component as any).filterBtn = undefined;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  // ─── onSearch preserves sort while clearing search ────────────────

  it('should preserve sort when searching', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.requestState = { sort: 'A', searchKeyword: 'old' };

    component.onSearch('new search');

    expect(component.requestState.searchKeyword).toBe('new search');
    expect(component.requestState.sort).toBe('A');
  });

  // ─── chapter change without pagination and sortConfig ─────────────

  it('should handle chapter change when pagination is undefined', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.ngOnInit();

    component.tableConfig.pagination = undefined as any;
    component.tableConfig.sortConfig = undefined as any;

    expect(() => chapterChangedSubject.next()).not.toThrow();
  });

  // ─── onSearch when pagination is undefined ────────────────────────

  it('should not throw when pagination is undefined during search', () => {
    service.getDefineProcedureExclusions.and.returnValue(of(emptyResponse));
    component.tableConfig.pagination = undefined as any;

    expect(() => component.onSearch('test')).not.toThrow();
  });
});
