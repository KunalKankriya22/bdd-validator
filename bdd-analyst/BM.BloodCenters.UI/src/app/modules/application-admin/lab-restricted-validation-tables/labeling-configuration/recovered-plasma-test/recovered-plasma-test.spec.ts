import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { RecoveredPlasmaTestComponent } from './recovered-plasma-test';
import { RecoveredPlasmaTestService } from './services/recovered-plasma-test.service';
import { RecoveredPlasmaTestModel, RecoveredPlasmaTestFilterValue } from './models/recovered-plasma-test.model';
import { HeaderService } from '@shared/services/header.service';
import { RecoveredPlasmaTestFilterChipsUtils } from './utils/filter-chips.utils';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { provideRouter } from '@angular/router';

describe('RecoveredPlasmaTestComponent', () => {
  let component: RecoveredPlasmaTestComponent;
  let fixture: ComponentFixture<RecoveredPlasmaTestComponent>;
  let mockService: jasmine.SpyObj<RecoveredPlasmaTestService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;

  const mockData: RecoveredPlasmaTestModel[] = [
    {
      testId: 'T001',
      effDate: '2024-01-01',
      termDate: null
    },
    {
      testId: 'T002',
      effDate: '2024-01-15',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RecoveredPlasmaTestService', [
      'getPlasmaTests',
      'getTestIdLookups',
      'createRecord',
      'updateRecord',
      'deleteRecord'
    ]);

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    chapterChangedSubject = new Subject<void>();



      TestBed.configureTestingModule({
      imports: [RecoveredPlasmaTestComponent,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RecoveredPlasmaTestService, useValue: mockService },
        { provide: Overlay, useValue: mockOverlay },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } }
      ]
    });


    });



  beforeEach(() => {


      mockService.getPlasmaTests.calls.reset();


      mockService.getTestIdLookups.calls.reset();


      mockService.createRecord.calls.reset();


      mockService.updateRecord.calls.reset();


      mockService.deleteRecord.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockOverlay.scrollStrategies.calls.reset();


    fixture = TestBed.createComponent(RecoveredPlasmaTestComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should initialize with correct configuration', () => {
      mockService.getPlasmaTests.and.returnValue(
        of({ data: [], total: 0 })
      );

      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toContain('Test ID');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should create the component', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have correct default state', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.isFilterOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should set searchConfig with correct values', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      expect(component.searchConfig.placeholder).toBe('Search by Test ID');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toBe('Search recovered plasma tests');
      expect((component.searchConfig as any).alwaysShowTooltip).toBe(true);
    });

    it('should set tableConfig with correct values', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.stickyHeader).toBe(true);
      expect(component.tableConfig.stickyActionsColumn).toBe(true);
      expect(component.tableConfig.emptyMessage).toBe('No Recovered plasma test records found.');
      expect(component.tableConfig.loadingMessage).toBe('Loading recovered plasma test data...');
      expect(component.tableConfig.showPagination).toBe(false);
      expect(component.tableConfig.sortConfig!.column).toBe('testId');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should configure table columns correctly', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      const columns = component.tableConfig.columns;
      expect(columns[0].key).toBe('testId');
      expect(columns[0].header).toBe('Test ID');
      expect(columns[0].sortable).toBe(true);
      expect(columns[1].key).toBe('effDate');
      expect(columns[1].header).toBe('Effective Date');
      expect(columns[2].key).toBe('termDate');
      expect(columns[2].header).toBe('Termination Date');
    });

    it('should configure row actions with edit action', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      const actions = component.tableConfig.rowActions!;
      expect(actions.length).toBe(1);
      expect(actions[0].action).toBe('edit');
      expect(actions[0].label).toBe('Edit plasma test');
      expect(actions[0].icon).toBe('edit');
    });

    it('should call loadData on ngOnInit', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();

      expect(mockService.getPlasmaTests).toHaveBeenCalledWith({});
    });
  });

  describe('loadData', () => {
    it('should load data successfully', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should handle error when loading data', () => {
      mockService.getPlasmaTests.and.returnValue(throwError(() => new Error('Server error')));
      spyOn(console, 'error');
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load recovered plasma test data. Please try again.');
      expect(console.error).toHaveBeenCalled();
    });

    it('should set isLoading to true at start of loadData', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      // Reset and call loadData again to observe intermediate state
      component.isLoading = false;
      component.hasError = true;

      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      component.loadData();

      // After completion, isLoading should be false
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    });

    it('should pass requestBody to service', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();

      component.requestBody = { searchKeyword: 'test', sort: 'A' };
      component.loadData();

      expect(mockService.getPlasmaTests).toHaveBeenCalledWith({ searchKeyword: 'test', sort: 'A' });
    });

    it('should store data in allData as well as dataSource', () => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();

      expect(component['allData']).toEqual(mockData);
      expect(component.dataSource).toEqual(mockData);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();
    });

    it('should reload data when search text is cleared to empty', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.requestBody.searchKeyword = 'previous';
      component.onSearchEvent('');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should reload data when search text is whitespace only', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.requestBody.searchKeyword = 'test';
      component.onSearchEvent('   ');

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should not call loadData when search text is non-empty', () => {
      mockService.getPlasmaTests.calls.reset();

      component.onSearchEvent('abc');

      expect(mockService.getPlasmaTests).not.toHaveBeenCalled();
    });

    it('should handle null search text in onSearchEvent', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      component.onSearchEvent(null as any);

      expect(component.requestBody.searchKeyword).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should trigger search on enter when text length >= 2', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      // Mock the searchBarComponent
      component.searchBarComponent = { searchText: 'AB' } as any;
      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('AB');
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should not trigger search on enter when text length < 2', () => {
      mockService.getPlasmaTests.calls.reset();

      component.searchBarComponent = { searchText: 'A' } as any;
      component.onEnterSearch();

      expect(mockService.getPlasmaTests).not.toHaveBeenCalled();
    });

    it('should not trigger search on enter when searchBarComponent is undefined', () => {
      mockService.getPlasmaTests.calls.reset();

      (component as any).searchBarComponent = undefined;
      component.onEnterSearch();

      expect(mockService.getPlasmaTests).not.toHaveBeenCalled();
    });

    it('should trim whitespace from enter search text', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      component.searchBarComponent = { searchText: '  AB  ' } as any;
      component.onEnterSearch();

      expect(component.requestBody.searchKeyword).toBe('AB');
    });

    it('should not trigger search on enter when trimmed text length < 2', () => {
      mockService.getPlasmaTests.calls.reset();

      component.searchBarComponent = { searchText: '  A  ' } as any;
      component.onEnterSearch();

      expect(mockService.getPlasmaTests).not.toHaveBeenCalled();
    });
  });

  describe('Sort Functionality', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();
    });

    it('should handle sort ascending', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.onSortChange({ column: 'testId', direction: 'A' });

      expect(component.tableConfig.sortConfig!.column).toBe('testId');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.requestBody.sort).toBe('A');
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should handle sort descending', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.onSortChange({ column: 'testId', direction: 'D' });

      expect(component.requestBody.sort).toBe('D');
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should handle sort reset to default', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.onSortChange({ column: 'testId', direction: 'default' });

      expect(component.requestBody.sort).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();
    });

    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });

    it('should not throw for unknown actions', () => {
      expect(() => {
        component.onRowAction({ action: 'unknown', row: mockData[0] });
      }).not.toThrow();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should apply date filters', () => {
      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
    });


    it('should check for active filters', () => {
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should apply effective date "before" filter', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toBe(filters);
      expect(component.requestBody.effDateBefore).toBeDefined();
      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should apply termination date "after" filter', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-01-01')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateAfter).toBeDefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should apply termination date "before" filter', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-06-01')
      };

      component.applyFilters(filters);

      expect(component.requestBody.termDateBefore).toBeDefined();
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });

    it('should apply both effective and termination date filters', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBeDefined();
      expect(component.requestBody.effDateBefore).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeDefined();
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });

    it('should handle filters with null dates', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should generate filter chips when applying filters', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should preserve searchKeyword and sort when applying filters', () => {
      component.requestBody = { searchKeyword: 'test', sort: 'A' };
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      const filters: RecoveredPlasmaTestFilterValue = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
    });

    it('should remove a filter chip and reload data', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };

      component.onRemoveFilterChip('effectiveDate');

      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should clear all filters', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      component.requestBody = {
        searchKeyword: 'test',
        sort: 'A',
        effDateAfter: '2024-01-01',
        termDateBefore: '2025-12-31'
      };

      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-12-31')
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: 'test' }];

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should return false for hasActiveFilters when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true for hasActiveFilters when filters are applied', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('updateRequestBodyFromFilters', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should reset filter-related request body when appliedFilters is null', () => {
      component.requestBody = {
        searchKeyword: 'test',
        sort: 'A',
        effDateAfter: '2024-01-01',
        termDateBefore: '2025-12-31'
      };

      component.appliedFilters = null;
      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.searchKeyword).toBe('test');
      expect(component.requestBody.sort).toBe('A');
      expect(component.requestBody.effDateAfter).toBeUndefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should update request body with "after" effective date filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-03-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.effDateAfter).toBeDefined();
      expect(component.requestBody.effDateBefore).toBeUndefined();
    });

    it('should update request body with "before" effective date filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: 'before',
        effectiveDate: new Date('2024-03-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.effDateBefore).toBeDefined();
      expect(component.requestBody.effDateAfter).toBeUndefined();
    });

    it('should update request body with "after" termination date filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'after',
        terminationDate: new Date('2025-06-01')
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.termDateAfter).toBeDefined();
      expect(component.requestBody.termDateBefore).toBeUndefined();
    });

    it('should update request body with "before" termination date filter', () => {
      component.appliedFilters = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'before',
        terminationDate: new Date('2025-06-01')
      };

      component['updateRequestBodyFromFilters']();

      expect(component.requestBody.termDateBefore).toBeDefined();
      expect(component.requestBody.termDateAfter).toBeUndefined();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(
        of({ data: mockData, total: 2 })
      );
      fixture.detectChanges();
    });

    it('should create record by opening side panel in add mode', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should edit record', () => {
      component.editRecord(mockData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should edit second record correctly', () => {
      component.editRecord(mockData[1]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[1]);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close side panel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', () => {
      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));

      component.onSaveSuccess();

      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });
  });

  describe('onModeChange', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();
    });

    it('should change to add mode and clear data', () => {
      component.sidePanelData = mockData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should change to edit mode without clearing data', () => {
      component.sidePanelData = mockData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });
  });

  describe('Format Helpers', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(
        of({ data: [], total: 0 })
      );
      fixture.detectChanges();
    });

    it('should format a standard date', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });

    it('should format UTC date near midnight without timezone shift', () => {
      const formatted = component['formatDate']('2026-04-19T23:00:00Z');
      expect(formatted).toBe('19-APR-2026');
    });

    it('should return dash for null date', () => {
      const formatted = component['formatDate'](null);
      expect(formatted).toBe('-');
    });

    it('should return dash for undefined date', () => {
      const formatted = component['formatDate'](undefined);
      expect(formatted).toBe('-');
    });

    it('should return dash for empty string date', () => {
      const formatted = component['formatDate']('');
      expect(formatted).toBe('-');
    });

    it('should format December date correctly', () => {
      const formatted = component['formatDate']('2025-12-31');
      expect(formatted).toBe('31-DEC-2025');
    });

    it('should format February date correctly', () => {
      const formatted = component['formatDate']('2024-02-29');
      expect(formatted).toBe('29-FEB-2024');
    });
  });

  describe('formatFilterDateISO', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should return undefined for null date', () => {
      const result = component['formatFilterDateISO'](null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined date', () => {
      const result = component['formatFilterDateISO'](undefined);
      expect(result).toBeUndefined();
    });

    it('should serialize a valid date', () => {
      const date = new Date('2024-06-15');
      const result = component['formatFilterDateISO'](date);
      // DateFieldValidationUtility.serializeDateForApi returns 'YYYY-MM-DD' or null
      if (result) {
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('openFilter', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should close existing overlay when called while overlay is open', () => {
      // Simulate an existing overlayRef
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('closeFilterOverlay', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should dispose overlay and reset state', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component['closeFilterOverlay']();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should do nothing when overlayRef is null', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      component['closeFilterOverlay']();

      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should create record on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should create record on Alt+C (uppercase)', () => {
      spyOn(component, 'createRecord');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      const mockFocus = jasmine.createSpy('focus');
      component.searchBarComponent = { focus: mockFocus } as any;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter overlay on Escape when overlay is open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should close side panel on Escape when side panel is open and no overlay', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not create record when Alt is not held', () => {
      spyOn(component, 'createRecord');

      const event = new KeyboardEvent('keydown', { key: 'c' });
      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
    });

    it('should not close side panel on Escape when side panel is not open', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      // preventDefault should not have been called for Escape since neither overlay nor side panel is open
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should handle Alt+S when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Chapter Change Subscription', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: mockData, total: 2 }));
      fixture.detectChanges();
    });

    it('should reset state and reload data on chapter change', () => {
      component.sidePanelOpen = true;
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'test', label: 'Test', value: 'Test' }];
      component.searchText = 'some text';
      component.requestBody = { searchKeyword: 'test', sort: 'A' };

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.requestBody).toEqual({});
      expect(mockService.getPlasmaTests).toHaveBeenCalled();
    });

    it('should reset sort direction on chapter change', () => {
      component.tableConfig.sortConfig!.direction = 'A';

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should clear search bar on chapter change when searchBarComponent exists', () => {
      const mockClearSearch = jasmine.createSpy('clearSearch');
      component.searchBarComponent = { clearSearch: mockClearSearch } as any;

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      chapterChangedSubject.next();

      expect(mockClearSearch).toHaveBeenCalled();
    });

    it('should dispose overlay on chapter change when overlay exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      chapterChangedSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should handle chapter change when searchBarComponent is not available', () => {
      (component as any).searchBarComponent = undefined;

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should handle chapter change when sortConfig is not available', () => {
      component.tableConfig.sortConfig = undefined;

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should handle chapter change when overlayRef is null', () => {
      component['overlayRef'] = null;

      mockService.getPlasmaTests.calls.reset();
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));

      expect(() => chapterChangedSubject.next()).not.toThrow();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should dispose overlay if it exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Table Column Value Formatters', () => {
    beforeEach(() => {
      mockService.getPlasmaTests.and.returnValue(of({ data: [], total: 0 }));
      fixture.detectChanges();
    });

    it('should have valueFormatter on effDate column', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol).toBeDefined();
      expect(effDateCol!.valueFormatter).toBeDefined();
    });

    it('should have valueFormatter on termDate column', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeDefined();
      expect(termDateCol!.valueFormatter).toBeDefined();
    });

    it('should format effDate column values using formatDate', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateCol!.valueFormatter!('2024-06-15');
      expect(result).toBe('15-JUN-2024');
    });

    it('should format termDate column null values as dash', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      const result = termDateCol!.valueFormatter!(null);
      expect(result).toBe('-');
    });
  });
});
