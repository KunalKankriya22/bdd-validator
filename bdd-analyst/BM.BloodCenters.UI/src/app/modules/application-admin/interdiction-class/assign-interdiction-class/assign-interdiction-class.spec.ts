import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

import { AssignInterdictionClass } from './assign-interdiction-class';
import { AssignInterdictionClassService } from '../services/assign-interdiction-class.service';
import {
  AssignInterdictionClassModel,
  AssignInterdictionClassFilterValue
} from '../models/assign-interdiction-class.model';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { FilterChips } from '@shared/components/filter-chips/filter-chips';
import {
  TablePageEvent,
  TableSortEvent,
} from '@shared/interfaces/data-table.interface';

import { FilterChipsUtils } from '../utils/filter-chips.utils';
import { createMockTranslateService } from '@shared/testing/common-mocks';
import { DataTableStub, PageHeaderWithBreadcrumbStub, SearchBarStub, FilterChipsStub } from '@shared/testing/component-stubs';

describe('AssignInterdictionClass Component', () => {
  let searchBar: any;
  let mockOverlayRef: any;  let component: AssignInterdictionClass;
  let fixture: ComponentFixture<AssignInterdictionClass>;
  let mockAssignInterdictionClassService: jasmine.SpyObj<AssignInterdictionClassService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let compiled: HTMLElement;

  // Mock data
  const mockInterdictionClassData: AssignInterdictionClassModel[] = [
    {
      interdictionCode: 'INT001',
      description: 'Test Interdiction 1',
      type: 'Type A',
      class: 'Class 1',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      modificationDate: new Date('2024-06-15')
    },
    {
      interdictionCode: 'INT002',
      description: 'Test Interdiction 2',
      type: 'Type B',
      class: 'Class 2',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: null,
      modificationDate: new Date('2024-07-20')
    },
    {
      interdictionCode: 'INT003',
      description: 'Test Interdiction 3',
      type: 'Type A',
      class: 'Class 1',
      effectiveDate: new Date('2024-03-01'),
      terminationDate: new Date('2024-11-30'),
      modificationDate: new Date('2024-08-10')
    }
  ];

  const mockApiResponse = {
    data: mockInterdictionClassData,
    totalRecords: 3
  };

  const mockFilters: AssignInterdictionClassFilterValue = {
    interdictionCode: 'INT001',
    type: 'Type A',
    class: 'Class 1',
    effectiveDatePeriod: 'After',
    effectiveDate: '2024-01-01',
    terminationDatePeriod: 'Before',
    terminationDate: '2024-12-31'
  };

  beforeEach(() => {

    // Create spy objects
    mockAssignInterdictionClassService = jasmine.createSpyObj('AssignInterdictionClassService', [
      'getAssignInterdictionClass',
      'getAssignInterdictionClassFilters'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    // Add events observable to Router mock
    Object.defineProperty(mockRouter, 'events', {
      get: () => of(),
      enumerable: true,
      configurable: true
    });
    // Add url property to Router mock
    Object.defineProperty(mockRouter, 'url', {
      get: () => '/application-admin/interdiction-class/assign-interdiction-class',
      enumerable: true,
      configurable: true
    });
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    });
    mockTranslateService = createMockTranslateService();
    // Create a more comprehensive Overlay mock
    const mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
      'flexibleConnectedTo',
      'withPositions',
      'withPush'
    ]);
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    const mockScrollStrategy = {
      block: jasmine.createSpy('block').and.returnValue({})
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['position', 'create']);
    Object.defineProperty(mockOverlay, 'scrollStrategies', {
      get: () => mockScrollStrategy,
      enumerable: true,
      configurable: true
    });
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);

    // Default spy return values
    mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
      of(mockApiResponse)
    );
    mockTranslateService.instant.and.callFake((key: string) => key);
    // Configure Router mock methods
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [
        AssignInterdictionClass,
        CommonModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        OverlayModule,
        TranslateModule.forRoot(),
        PageHeaderWithBreadcrumb,
        SearchBar,
        DataTable,
        FilterChips
      ],
      providers: [
        provideHttpClient(),
        { provide: AssignInterdictionClassService, useValue: mockAssignInterdictionClassService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: Overlay, useValue: mockOverlay }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(AssignInterdictionClass, {
      remove: { imports: [DataTable, PageHeaderWithBreadcrumb, SearchBar, FilterChips] },
      add: { imports: [DataTableStub, PageHeaderWithBreadcrumbStub, SearchBarStub, FilterChipsStub] },
    });

      mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);


      mockTranslateService.instant.and.callFake((key: string) => key);


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


    fixture = TestBed.createComponent(AssignInterdictionClass);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;


    });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Initialization', () => {


    it('should initialize with correct default values', () => {
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.requestState).toEqual({});
      expect(component.filterChips).toEqual([]);
    });

    it('should initialize table configuration with correct columns', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(7);
      expect(component.tableConfig.columns[0].key).toBe('interdictionCode');
      expect(component.tableConfig.columns[1].key).toBe('description');
      expect(component.tableConfig.columns[2].key).toBe('type');
      expect(component.tableConfig.columns[3].key).toBe('class');
      expect(component.tableConfig.columns[4].key).toBe('effectiveDate');
      expect(component.tableConfig.columns[5].key).toBe('terminationDate');
      expect(component.tableConfig.columns[6].key).toBe('modificationDate');
    });

    it('should initialize table pagination configuration', () => {
      expect(component.tableConfig.pagination).toBeDefined();
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBe(true);
    });

    it('should initialize table row actions', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
      expect(component.tableConfig.rowActions?.[0].icon).toBe('edit');
    });







    it('should set currentYear property to current year', () => {
      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
    });
  });

  describe('Data Loading', () => {
    it('should load table data successfully on initialization', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        0,
        {}
      );
      expect(component.dataSource).toEqual(mockInterdictionClassData);
      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
    }));





    it('should calculate correct skip value based on pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadTableData();
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        50,
        {}
      );
    }));

    it('should pass requestState parameters to service', fakeAsync(() => {
      component.requestState = {
        SearchKeyword: 'test',
        Type: 'Type A',
        Sort: 'A'
      };

      component.loadTableData();
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        0,
        component.requestState
      );
    }));

    it('should update dataSource with API response data', fakeAsync(() => {
      const newMockData: AssignInterdictionClassModel[] = [
        {
          interdictionCode: 'INT004',
          description: 'New Interdiction',
          type: 'Type C',
          class: 'Class 3',
          effectiveDate: new Date('2024-04-01'),
          terminationDate: null,
          modificationDate: new Date('2024-09-01')
        }
      ];

      mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
        of({ data: newMockData, totalRecords: 1 })
      );

      component.loadTableData();
      tick();

      expect(component.dataSource).toEqual(newMockData);
      expect(component.dataSource.length).toBe(1);
    }));




  });
  describe('Pagination', () => {




    it('should call API with correct skip and take values after page change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 25, previousPageIndex: 0 };
      component.onPageChange(pageEvent);
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        25,
        {}
      );
    }));

    it('should handle first page navigation', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 5;

      const pageEvent: TablePageEvent = { pageIndex: 0, pageSize: 10, previousPageIndex: 5 };
      component.onPageChange(pageEvent);
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        10,
        0,
        {}
      );
    }));

    it('should handle last page navigation', fakeAsync(() => {
      mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
        of({ data: mockInterdictionClassData, totalRecords: 100 })
      );

      const pageEvent: TablePageEvent = { pageIndex: 9, pageSize: 10, previousPageIndex: 8 };
      component.onPageChange(pageEvent);
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(9);
      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        10,
        90,
        {}
      );
    }));


  });

  describe('Sort Functionality', () => {
    it('should handle sort change to ascending', fakeAsync(() => {
      spyOn(component, 'loadTableData');

      const sortEvent: TableSortEvent = { column: 'interdictionCode', direction: 'A' };
      component.onSortChange(sortEvent);

      expect(component.tableConfig.sortConfig?.column).toBe('interdictionCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.Sort).toBe('A');
      expect(component.loadTableData).toHaveBeenCalledTimes(1);
    }));

    it('should handle sort change to descending', fakeAsync(() => {
      spyOn(component, 'loadTableData');

      const sortEvent: TableSortEvent = { column: 'description', direction: 'D' };
      component.onSortChange(sortEvent);

      expect(component.tableConfig.sortConfig?.column).toBe('description');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
      expect(component.requestState.Sort).toBe('D');
      expect(component.loadTableData).toHaveBeenCalledTimes(1);
    }));

    it('should handle sort reset to default', fakeAsync(() => {
      component.requestState.Sort = 'A';
      spyOn(component, 'loadTableData');

      const sortEvent: TableSortEvent = { column: 'interdictionCode', direction: 'default' };
      component.onSortChange(sortEvent);

      expect(component.tableConfig.sortConfig?.column).toBe('interdictionCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
      expect(component.requestState.Sort).toBeUndefined();
      expect(component.loadTableData).toHaveBeenCalledTimes(1);
    }));

    it('should maintain sort while paginating', fakeAsync(() => {
      const sortEvent: TableSortEvent = { column: 'interdictionCode', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0 };
      component.onPageChange(pageEvent);
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        10,
        10,
        { Sort: 'A' }
      );
    }));
  });

  describe('Search Functionality', () => {


    it('should set SearchKeyword to undefined for empty search', () => {
      component.requestState.SearchKeyword = 'previous search';
      spyOn(component, 'loadTableData');

      component.onSearch('');

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(component.loadTableData).toHaveBeenCalledTimes(1);
    });



    it('should maintain search keyword when paginating', fakeAsync(() => {
      component.onSearch('test search');
      tick();
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0 };
      component.onPageChange(pageEvent);
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        10,
        10,
        { SearchKeyword: 'test search' }
      );
    }));
  });

  describe('Filter Functionality', () => {
    describe('openFilter', () => {
      it('should dispose existing overlay and set isFilterOpen to false if already open', () => {
        mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
        mockOverlayRef.backdropClick.and.returnValue(of({}));
        component['overlayRef'] = mockOverlayRef;
        component.isFilterOpen = true;

        component.openFilter();

        expect(mockOverlayRef.dispose).toHaveBeenCalled();
        expect(component['overlayRef']).toBeNull();
        expect(component.isFilterOpen).toBeFalse();
      });
    });

    describe('applyFilters', () => {
      it('should update appliedFilters with provided filter values', () => {
        component.applyFilters(mockFilters);

        expect(component.appliedFilters).toEqual(mockFilters);
      });

      it('should convert filters to chips using FilterChipsUtils', () => {
        spyOn(FilterChipsUtils, 'convertFiltersToChips').and.returnValue([
          { key: 'interdictionCode', label: 'Interdiction Code: INT001', value: 'INT001', removable: true }
        ]);

        component.applyFilters(mockFilters);

        expect(FilterChipsUtils.convertFiltersToChips).toHaveBeenCalledWith(
          mockFilters,
          jasmine.any(Function)
        );
      });

      it('should update requestState with filter parameters', () => {
        component.applyFilters(mockFilters);

        expect(component.requestState.InterdictionCode).toBe('INT001');
        expect(component.requestState.Type).toBe('Type A');
        expect(component.requestState.Class).toBe('Class 1');
        expect(component.requestState.EffectiveDatePeriod).toBe('After');
        expect(component.requestState.EffectiveDate).toEqual('2024-01-01');
        expect(component.requestState.TerminationDatePeriod).toBe('Before');
        expect(component.requestState.TerminationDate).toEqual('2024-12-31');
      });

      it('should set undefined for null/empty filter values', () => {
        const emptyFilters: AssignInterdictionClassFilterValue = {
          interdictionCode: null,
          type: null,
          class: null,
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyFilters(emptyFilters);

        expect(component.requestState.InterdictionCode).toBeUndefined();
        expect(component.requestState.Type).toBeUndefined();
        expect(component.requestState.Class).toBeUndefined();
      });






    });

    describe('onRemoveFilterChip', () => {
      beforeEach(() => {
        component.appliedFilters = mockFilters;
        component.filterChips = [
          { key: 'interdictionCode', label: 'Interdiction Code: INT001', value: 'INT001', removable: true },
          { key: 'type', label: 'Type: Type A', value: 'Type A', removable: true }
        ];
      });

      it('should remove filter using FilterChipsUtils', () => {
        spyOn(FilterChipsUtils, 'removeFilterByChipKey').and.returnValue({
          interdictionCode: null,
          type: 'Type A',
          class: 'Class 1',
          effectiveDatePeriod: 'After',
          effectiveDate: '2024-01-01',
          terminationDatePeriod: 'Before',
          terminationDate: '2024-12-31'
        });

        component.onRemoveFilterChip('interdictionCode');

        expect(FilterChipsUtils.removeFilterByChipKey).toHaveBeenCalledWith(
          mockFilters,
          'interdictionCode'
        );
      });

      it('should update filter chips after removal', () => {
        spyOn(FilterChipsUtils, 'removeFilterByChipKey').and.returnValue({
          ...mockFilters,
          interdictionCode: null
        });
        spyOn(FilterChipsUtils, 'convertFiltersToChips').and.returnValue([
          { key: 'type', label: 'Type: Type A', value: 'Type A', removable: true }
        ]);

        component.onRemoveFilterChip('interdictionCode');

        expect(component.filterChips.length).toBeLessThan(2);
      });






    });

    describe('clearAllFilters', () => {
      beforeEach(() => {
        component.appliedFilters = mockFilters;
        component.filterChips = [
          { key: 'interdictionCode', label: 'Interdiction Code: INT001', value: 'INT001', removable: true },
          { key: 'type', label: 'Type: Type A', value: 'Type A', removable: true }
        ];
        component.requestState = {
          SearchKeyword: 'test',
          InterdictionCode: 'INT001',
          Type: 'Type A',
          Sort: 'A'
        };
      });





      it('should remove filter properties from requestState', () => {
        component.clearAllFilters();

        expect(component.requestState.InterdictionCode).toBeUndefined();
        expect(component.requestState.Type).toBeUndefined();
        expect(component.requestState.Class).toBeUndefined();
        expect(component.requestState.EffectiveDatePeriod).toBeUndefined();
        expect(component.requestState.EffectiveDate).toBeUndefined();
        expect(component.requestState.TerminationDatePeriod).toBeUndefined();
        expect(component.requestState.TerminationDate).toBeUndefined();
      });






    });

    describe('hasActiveFilters', () => {




      it('should return false when appliedFilters has only null values', () => {
        spyOn(FilterChipsUtils, 'hasActiveFilters').and.returnValue(false);
        component.appliedFilters = {
          interdictionCode: null,
          type: null,
          class: null,
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        const result = component.hasActiveFilters();

        expect(result).toBe(false);
      });
    });

    describe('updateRequestStateFromFilters (private)', () => {
      it('should update requestState when appliedFilters exist', () => {
        component.appliedFilters = mockFilters;

        component['updateRequestStateFromFilters']();

        expect(component.requestState.InterdictionCode).toBe('INT001');
        expect(component.requestState.Type).toBe('Type A');
        expect(component.requestState.Class).toBe('Class 1');
      });

      it('should remove filter properties when appliedFilters is null', () => {
        component.requestState = {
          SearchKeyword: 'test',
          InterdictionCode: 'INT001',
          Type: 'Type A'
        };
        component.appliedFilters = null;

        component['updateRequestStateFromFilters']();

        expect(component.requestState.InterdictionCode).toBeUndefined();
        expect(component.requestState.Type).toBeUndefined();
        expect(component.requestState.SearchKeyword).toBe('test');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {












    it('should close overlay and set isFilterOpen to false when Escape is pressed', () => {
      mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose', 'backdropClick']);
      mockOverlayRef.backdropClick.and.returnValue(of({}));
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', {
        key: 'Escape'
      });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });



    it('should handle uppercase key presses', () => {
      spyOn(component, 'createRecord');

      const event = new KeyboardEvent('keydown', {
        key: 'C',
        altKey: true
      });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalledTimes(1);
    });






  });

  describe('Date Formatting', () => {
    it('should format valid date to DD-MMM-YYYY format', () => {
      const date = new Date('2024-01-15');
      const formatted = component['formatDate'](date);

      expect(formatted).toBe('15-JAN-2024');
    });



    it('should format date with single-digit day correctly', () => {
      const date = new Date('2024-03-05');
      const formatted = component['formatDate'](date);

      expect(formatted).toBe('05-MAR-2024');
    });

    it('should format all months correctly', () => {
      const months = [
        { date: new Date('2024-01-01'), expected: 'JAN' },
        { date: new Date('2024-02-01'), expected: 'FEB' },
        { date: new Date('2024-03-01'), expected: 'MAR' },
        { date: new Date('2024-04-01'), expected: 'APR' },
        { date: new Date('2024-05-01'), expected: 'MAY' },
        { date: new Date('2024-06-01'), expected: 'JUN' },
        { date: new Date('2024-07-01'), expected: 'JUL' },
        { date: new Date('2024-08-01'), expected: 'AUG' },
        { date: new Date('2024-09-01'), expected: 'SEP' },
        { date: new Date('2024-10-01'), expected: 'OCT' },
        { date: new Date('2024-11-01'), expected: 'NOV' },
        { date: new Date('2024-12-01'), expected: 'DEC' }
      ];

      months.forEach(({ date, expected }) => {
        const formatted = component['formatDate'](date);
        expect(formatted).toContain(expected);
      });
    });
  });

  describe('Row Actions', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');

      const rowActionEvent = {
        action: 'edit',
        row: mockInterdictionClassData[0]
      };

      component.onRowAction(rowActionEvent);

      expect(component.editRecord).toHaveBeenCalledWith(mockInterdictionClassData[0]);
    });


    it('should not throw error if unknown action is triggered', () => {
      const rowActionEvent = {
        action: 'unknown' as any,
        row: mockInterdictionClassData[0]
      };

      expect(() => component.onRowAction(rowActionEvent)).not.toThrow();
    });
  });

  describe('Template Integration Tests', () => {
    describe('ARIA Live Region', () => {
      it('should render ARIA live region', () => {
        fixture.detectChanges();

        const ariaLiveRegion = compiled.querySelector('#aria-live-announcer');
        expect(ariaLiveRegion).toBeTruthy();
        expect(ariaLiveRegion?.getAttribute('role')).toBe('status');
        expect(ariaLiveRegion?.getAttribute('aria-live')).toBe('polite');
        expect(ariaLiveRegion?.getAttribute('aria-atomic')).toBe('true');
      });


    });

    describe('Main Container', () => {
      it('should render main container with correct role and aria-label', () => {
        fixture.detectChanges();

        const mainContainer = compiled.querySelector('main.assign-interdiction-class-table');
        expect(mainContainer).toBeTruthy();
        expect(mainContainer?.getAttribute('role')).toBe('main');
        expect(mainContainer?.getAttribute('aria-label')).toBe('Assign Interdiction Class content');
      });
    });
    describe('Filter Controls', () => {
      it('should render filter button', () => {
        fixture.detectChanges();

        const filterButton = compiled.querySelector('button.filter-button');
        expect(filterButton).toBeTruthy();
        expect(filterButton?.getAttribute('aria-label')).toBe('Open filter options');
      });








    });

    describe('Search Bar', () => {


      it('should pass config to search bar', () => {
        fixture.detectChanges();

        const searchBarDebug = fixture.debugElement.query(By.directive(SearchBarStub));
        expect(searchBarDebug.componentInstance.config).toEqual(component.searchConfig);
      });
    });
    describe('Data Table', () => {


      it('should pass correct config to data table', () => {
        fixture.detectChanges();

        const dataTableDebug = fixture.debugElement.query(By.directive(DataTableStub));
        expect(dataTableDebug.componentInstance.config).toEqual(component.tableConfig);
      });

      it('should pass data to data table', () => {
        component.dataSource = mockInterdictionClassData;
        fixture.detectChanges();

        const dataTableDebug = fixture.debugElement.query(By.directive(DataTableStub));
        expect(dataTableDebug.componentInstance.data).toEqual(mockInterdictionClassData);
      });
    });

    describe('Controls Layout', () => {




      it('should have filter button and search bar in correct sections', () => {
        fixture.detectChanges();

        const controlsLeft = compiled.querySelector('.assign-interdiction-class-table__controls-left');
        const filterButton = controlsLeft?.querySelector('button.filter-button');
        expect(filterButton).toBeTruthy();

        searchBar = compiled.querySelector('.assign-interdiction-class-table__controls app-search-bar');
        expect(searchBar).toBeTruthy();
      });
    });
  });

  describe('Integration Tests - Combined Operations', () => {
    it('should handle filter + search + sort + pagination together', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Apply filters
      component.applyFilters(mockFilters);
      tick();

      // Apply search
      component.onSearch('test');
      tick();

      // Apply sort
      const sortEvent: TableSortEvent = { column: 'interdictionCode', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();
      // Change page
      const pageEvent: TablePageEvent = { pageIndex: 2, pageSize: 25, previousPageIndex: 1 };
      component.onPageChange(pageEvent);
      tick();

      // Should maintain all filters
      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        50,
        jasmine.objectContaining({
          SearchKeyword: 'test',
          Sort: 'A',
          InterdictionCode: 'INT001',
          Type: 'Type A'
        })
      );
    }));



    it('should maintain filters when paginating', fakeAsync(() => {
      component.applyFilters(mockFilters);
      tick();
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0 };
      component.onPageChange(pageEvent);
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        10,
        10,
        jasmine.objectContaining({
          InterdictionCode: 'INT001',
          Type: 'Type A'
        })
      );
    }));

    it('should maintain filters when sorting', fakeAsync(() => {
      component.applyFilters(mockFilters);
      tick();
      const sortEvent: TableSortEvent = { column: 'interdictionCode', direction: 'A' };
      component.onSortChange(sortEvent);
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({
          InterdictionCode: 'INT001',
          Type: 'Type A',
          Sort: 'A'
        })
      );
    }));

    it('should maintain filters when searching', fakeAsync(() => {
      component.applyFilters(mockFilters);
      tick();
      component.onSearch('test search');
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({
          SearchKeyword: 'test search',
          InterdictionCode: 'INT001',
          Type: 'Type A'
        })
      );
    }));

    it('should handle rapid successive operations', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Rapid filter changes
      component.applyFilters(mockFilters);
      component.applyFilters({ ...mockFilters, type: 'Type B' });
      tick();

      // Rapid search changes
      component.onSearch('first');
      component.onSearch('second');
      component.onSearch('third');
      tick();

      // Rapid sort changes
      component.onSortChange({ column: 'interdictionCode', direction: 'A' });
      component.onSortChange({ column: 'description', direction: 'D' });
      tick();

      expect(component.requestState.SearchKeyword).toBe('third');
      expect(component.requestState.Type).toBe('Type B');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    }));

    it('should reload data after error and recover successfully', fakeAsync(() => {
      // First call fails
      mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
        throwError(() => ({ error: 'Server error' }))
      );

      component.loadTableData();
      tick();

      expect(component.hasError).toBe(true);

      // Second call succeeds
      mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
        of(mockApiResponse)
      );

      component.loadTableData();
      tick();

      expect(component.hasError).toBe(false);
      expect(component.dataSource).toEqual(mockInterdictionClassData);
    }));

    it('should clear filters and reload data correctly', fakeAsync(() => {
      component.applyFilters(mockFilters);
      component.onSearch('test');
      tick();
      component.clearAllFilters();
      tick();

      expect(mockAssignInterdictionClassService.getAssignInterdictionClass).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({
          SearchKeyword: 'test'
        })
      );
      expect(component.requestState.InterdictionCode).toBeUndefined();
      expect(component.requestState.Type).toBeUndefined();
    }));
  });
  describe('Edge Cases', () => {
    it('should handle very large totalRecords value', fakeAsync(() => {
      mockAssignInterdictionClassService.getAssignInterdictionClass.and.returnValue(
        of({ data: mockInterdictionClassData, totalRecords: 999999 })
      );

      component.loadTableData();
      tick();

      expect(component.tableConfig.pagination?.totalRecords).toBe(999999);
    }));



    it('should handle null values in filter data', () => {
      const nullFilters: AssignInterdictionClassFilterValue = {
        interdictionCode: null,
        type: null,
        class: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(nullFilters);

      expect(component.requestState.InterdictionCode).toBeUndefined();
      expect(component.requestState.Type).toBeUndefined();
    });
  });
});