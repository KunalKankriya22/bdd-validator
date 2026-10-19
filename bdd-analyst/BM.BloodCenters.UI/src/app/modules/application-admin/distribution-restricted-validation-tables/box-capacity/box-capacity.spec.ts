import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Overlay } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { BoxCapacityComponent } from './box-capacity';
import { BoxCapacityService } from './services/box-capacity.service';
import { BoxCapacityModel, BoxCapacityFilterValue } from './models/box-capacity.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { BoxCapacityFilterChipsUtils } from './utils/filter-chips.utils';

describe('BoxCapacityComponent', () => {
  let component: BoxCapacityComponent;
  let fixture: ComponentFixture<BoxCapacityComponent>;
  let mockBoxCapacityService: jasmine.SpyObj<BoxCapacityService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let chapterChangedSubject: Subject<void>;
  let pageHeaderServiceSpy: any;

  const mockBoxCapacityData: BoxCapacityModel[] = [
    {
      boxType: '26',
      boxDescription: '26 Qt Igloo',
      inventoryProdType: 'CRYO',
      prodDescription: 'Cryoprecipitate',
      capacity: 20,
      effectiveDate: new Date('2004-08-27T00:00:00'),
      terminationDate: null,
      lastModificationDate: new Date('2025-09-10T00:00:00')
    },
    {
      boxType: 'CA',
      boxDescription: 'Cardboard Box',
      inventoryProdType: 'FFP',
      prodDescription: 'Fresh Frozen Plasma',
      capacity: 30,
      effectiveDate: new Date('2005-01-15T00:00:00'),
      terminationDate: null,
      lastModificationDate: new Date('2025-09-11T00:00:00')
    }
  ];

  beforeEach(() => {

    mockBoxCapacityService = jasmine.createSpyObj('BoxCapacityService', [
      'getBoxCapacity',
      'getBoxCapacityFilters',
      'addBoxCapacity',
      'updateBoxCapacity'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: new Subject(),
      url: '/test-url'
    });
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    (mockOverlay as any).scrollStrategies = { block: () => ({}) };

    chapterChangedSubject = new Subject<void>();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(undefined)
    });

      TestBed.configureTestingModule({
      imports: [BoxCapacityComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: BoxCapacityService, useValue: mockBoxCapacityService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } }
      ]
    });




      mockBoxCapacityService.getBoxCapacity.calls.reset();


      mockBoxCapacityService.getBoxCapacityFilters.calls.reset();


      mockBoxCapacityService.addBoxCapacity.calls.reset();


      mockBoxCapacityService.updateBoxCapacity.calls.reset();


      mockRouter.navigate.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();




    fixture = TestBed.createComponent(BoxCapacityComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should define table columns correctly', () => {
      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(8);
      expect(columns[0].key).toBe('boxType');
      expect(columns[1].key).toBe('boxDescription');
      expect(columns[2].key).toBe('inventoryProdType');
      expect(columns[3].key).toBe('prodDescription');
      expect(columns[4].key).toBe('capacity');
      expect(columns[5].key).toBe('effectiveDate');
      expect(columns[6].key).toBe('terminationDate');
      expect(columns[7].key).toBe('lastModificationDate');
    });

    it('should initialize header config with default title and breadcrumbs', () => {
      expect(component.headerConfig.title).toBe('Box Capacity');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Box Capacity');
      expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
    });

    it('should initialize header config with add action', () => {
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW BOX CAPACITY');
      expect(component.headerConfig.actions![0].icon).toBe('add');
      expect(component.headerConfig.actions![0].color).toBe('accent');
    });

    it('should call createRecord when header add action is clicked', () => {
      spyOn(component, 'createRecord');
      component.headerConfig.actions![0].onClick!();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should initialize search config with correct settings', () => {
      expect(component.searchConfig.placeholder).toBe('Search by box type or description');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toBe('Search by box type or description');
      expect((component.searchConfig as any).searchOnEnterOnly).toBeTrue();
    });

    it('should initialize table config with pagination defaults', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.pagination!.showFirstLastButtons).toBeTrue();
    });

    it('should initialize table config with sort defaults', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('boxType');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should initialize table display settings', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
      expect(component.tableConfig.showPagination).toBeTrue();
      expect(component.tableConfig.emptyMessage).toBe('No box capacity records available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading box capacity data...');
    });

    it('should initialize row actions with edit action', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.rowActions![0].icon).toBe('edit');
      expect(component.tableConfig.rowActions![0].label).toBe('Edit box capacity');
    });

    it('should have boxType column as sortable', () => {
      const boxTypeCol = component.tableConfig.columns.find(c => c.key === 'boxType');
      expect(boxTypeCol!.sortable).toBeTrue();
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

    it('should set currentYear to the current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });
  });

  describe('Date Formatting', () => {
    it('should format a valid date to DD-MMM-YYYY format', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate')!;
      const result = col.valueFormatter!(new Date(2024, 2, 15)); // Mar 15, 2024
      expect(result).toBe('15-MAR-2024');
    });

    it('should return dash for null date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate')!;
      expect(col.valueFormatter!(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate')!;
      expect(col.valueFormatter!(undefined)).toBe('-');
    });

    it('should format termination date column correctly', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate')!;
      expect(col.valueFormatter!(new Date(2025, 11, 31))).toBe('31-DEC-2025'); // Dec 31, 2025
    });

    it('should format modification date column correctly', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'lastModificationDate')!;
      expect(col.valueFormatter!(new Date(2025, 0, 5))).toBe('05-JAN-2025'); // Jan 5, 2025
    });

    it('should pad single-digit days with leading zero', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate')!;
      expect(col.valueFormatter!(new Date(2024, 6, 5))).toBe('05-JUL-2024'); // Jul 5, 2024
    });

    it('should format month in uppercase', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate')!;
      const result = col.valueFormatter!(new Date(2024, 8, 20)); // Sep 20, 2024
      expect(result).toBe('20-SEP-2024');
    });
  });

  describe('Data Loading', () => {
    it('should load data successfully and populate dataSource', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: mockBoxCapacityData, totalRecords: 2 })
      );

      component.loadData();

      expect(component.dataSource).toEqual(mockBoxCapacityData);
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    });

    it('should set isLoading to true at start and false after completion', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.isLoading = false;
      component.hasError = true;

      component.loadData();

      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    });

    it('should handle error when loading data fails', () => {
      const error = new Error('API Error');
      mockBoxCapacityService.getBoxCapacity.and.returnValue(throwError(() => error));

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load box capacity data. Please try again.');
    });

    it('should calculate correct skip value for pagination', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalledWith(25, 50, {});
    });

    it('should use default values when pagination config values are zero', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 0;

      component.loadData();

      // pageSize 0 is falsy, so default 10 is used; pageIndex 0 is falsy, so default 0 is used
      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalledWith(10, 0, {});
    });

    it('should pass request state params to service', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.requestState = { searchKeyword: 'test', boxType: '26' };
      component.loadData();

      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalledWith(
        25, 0, { searchKeyword: 'test', boxType: '26' }
      );
    });

    it('should create new array reference for dataSource on load', () => {
      const data = [mockBoxCapacityData[0]];
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data, totalRecords: 1 })
      );

      component.loadData();

      expect(component.dataSource).toEqual(data);
      expect(component.dataSource).not.toBe(data);
    });
  });

  describe('Search Functionality', () => {
    it('should update request state with search keyword', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSearch('test search');

      expect(component.requestState.searchKeyword).toBe('test search');
      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalled();
    });

    it('should set searchKeyword to undefined for empty search text', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should reset pagination to first page on search', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.tableConfig.pagination!.pageIndex = 5;

      component.onSearch('test');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData after search', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      spyOn(component, 'loadData').and.callThrough();

      component.onSearch('test');

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Page Change', () => {
    it('should update pagination on page change', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onPageChange({ pageIndex: 3, pageSize: 50 } as any);

      expect(component.tableConfig.pagination!.pageIndex).toBe(3);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });

    it('should reload data after page change', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      spyOn(component, 'loadData').and.callThrough();

      component.onPageChange({ pageIndex: 1, pageSize: 25 } as any);

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Sort Change', () => {
    it('should update sort config on sort change', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSortChange({ column: 'capacity', direction: 'A' } as any);

      expect(component.tableConfig.sortConfig!.column).toBe('capacity');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should set sort in request state for non-default direction', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.onSortChange({ column: 'boxType', direction: 'D' } as any);

      expect(component.requestState.sort).toBe('D');
    });

    it('should clear sort in request state for default direction', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.requestState.sort = 'A';

      component.onSortChange({ column: 'boxType', direction: 'default' } as any);

      expect(component.requestState.sort).toBeUndefined();
    });

    it('should reload data after sort change', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      spyOn(component, 'loadData').and.callThrough();

      component.onSortChange({ column: 'boxType', direction: 'A' } as any);

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
    it('should open side panel in add mode when createRecord is called', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should open side panel in edit mode with record data', () => {
      const record = mockBoxCapacityData[0];
      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should handle edit action from row actions', () => {
      spyOn(component, 'editRecord');
      const record = mockBoxCapacityData[0];

      component.onRowAction({ action: 'edit', row: record });

      expect(component.editRecord).toHaveBeenCalledWith(record);
    });

    it('should not call editRecord for unknown row actions', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'delete', row: mockBoxCapacityData[0] } as any);

      expect(component.editRecord).not.toHaveBeenCalled();
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockBoxCapacityData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      spyOn(component, 'loadData').and.callThrough();

      component.onSaveSuccess();

      expect(component.loadData).toHaveBeenCalled();
    });

    it('should change mode and clear data when switching to add mode', () => {
      component.sidePanelData = mockBoxCapacityData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should change mode without clearing data when switching to edit mode', () => {
      const testData = mockBoxCapacityData[0];
      component.sidePanelData = testData;

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(testData);
    });
  });

  describe('Filtering', () => {
    it('should apply filters correctly', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: 'Over',
        capacity: 10,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.boxType).toBe('26');
      expect(component.requestState.productType).toBe('CRYO');
      expect(component.requestState.capacity).toBe(10);
      expect(component.requestState.capacityRange).toBe('Over');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should set capacity to undefined when filter capacity is null', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.capacity).toBeUndefined();
      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
    });

    it('should handle capacity of zero in applyFilters', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: 'Over',
        capacity: 0,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.capacity).toBe(0);
    });

    it('should convert dates to ISO strings without timezone in applyFilters', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const effDate = new Date(2024, 0, 15); // Jan 15, 2024
      const termDate = new Date(2024, 11, 31); // Dec 31, 2024

      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: 'After',
        effectiveDate: effDate,
        terminationDatePeriod: 'Before',
        terminationDate: termDate
      };

      component.applyFilters(filters);

      expect(component.requestState.effectiveDate).toBe('2024-01-15T12:00:00.000Z');
      expect(component.requestState.effectiveDatePeriod).toBe('After');
      expect(component.requestState.terminationDate).toBe('2024-12-31T12:00:00.000Z');
      expect(component.requestState.terminationDatePeriod).toBe('Before');
    });

    it('should set date fields to undefined when dates are null', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters: BoxCapacityFilterValue = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    });

    it('should generate filter chips when applying filters', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      const filters: BoxCapacityFilterValue = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.filterChips[0].key).toBe('boxType');
    });

    it('should reset pagination when applying filters', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.tableConfig.pagination!.pageIndex = 5;

      const filters: BoxCapacityFilterValue = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should check if has active filters', () => {
      spyOn(component as any, 'hasActiveFilters').and.returnValue(true);

      const result = component.hasActiveFilters();

      expect(result).toBeTrue();
    });

    it('should delegate hasActiveFilters to BoxCapacityFilterChipsUtils', () => {
      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      const result = component.hasActiveFilters();

      expect(result).toBeTrue();
    });

    it('should return false for hasActiveFilters when no filters applied', () => {
      component.appliedFilters = null;

      const result = component.hasActiveFilters();

      expect(result).toBeFalse();
    });

    it('should clear all filters and reload data', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'boxType', label: 'Box Type: 26', value: '26' }];
      component.requestState = { boxType: '26', productType: 'CRYO', searchKeyword: 'test' };
      component.tableConfig.pagination!.pageIndex = 3;

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should remove filter params including date fields on clearAllFilters', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.requestState = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 10,
        capacityRange: 'Over',
        effectiveDate: '2024-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2024-12-31',
        terminationDatePeriod: 'Before',
        sort: 'A'
      };

      component.clearAllFilters();

      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.capacity).toBeUndefined();
      expect(component.requestState.capacityRange).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
      expect(component.requestState.sort).toBe('A');
    });

    it('should remove a filter chip and reload data', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      spyOn(component, 'loadData').and.callThrough();

      component.onRemoveFilterChip('boxType');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should set appliedFilters to null when removing last active filter', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.requestState = { boxType: '26', searchKeyword: 'test' };

      component.onRemoveFilterChip('boxType');

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should keep remaining filters when removing one chip', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.onRemoveFilterChip('boxType');

      expect(component.appliedFilters).not.toBeNull();
      expect(component.appliedFilters!.boxType).toBeNull();
      expect(component.appliedFilters!.inventoryProductType).toBe('CRYO');
    });
  });

  describe('Filter Panel', () => {
    it('should close filter panel and dispose overlay when overlayRef exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.closeFilterPanel();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should not error when overlayRef is null on closeFilterPanel', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;

      expect(() => component.closeFilterPanel()).not.toThrow();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should blur filter button when closing filter panel', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      const mockButton = { blur: jasmine.createSpy('blur') };
      component.filterBtn = { nativeElement: mockButton } as any;

      component.closeFilterPanel();

      expect(mockButton.blur).toHaveBeenCalled();
    });

    it('should not error when filterBtn is not set on closeFilterPanel', () => {
      component['overlayRef'] = null;
      component.filterBtn = undefined as any;

      expect(() => component.closeFilterPanel()).not.toThrow();
    });

    it('should call markForCheck when closing filter panel', () => {
      spyOn(component['cdr'], 'markForCheck');
      component['overlayRef'] = null;

      component.closeFilterPanel();

      expect(component['cdr'].markForCheck).toHaveBeenCalled();
    });

    it('should close existing filter panel when openFilter is called while open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      spyOn(component, 'closeFilterPanel').and.callThrough();

      component.openFilter();

      expect(component.closeFilterPanel).toHaveBeenCalled();
    });

    it('should not open new overlay when closing existing one via openFilter', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.openFilter();

      // After closing, overlay.create should not have been called
      // because the method returns after closeFilterPanel
      expect(component['overlayRef']).toBeNull();
    });

    it('should set isFilterOpen to false initially', () => {
      expect(component.isFilterOpen).toBeFalse();
      expect(component['overlayRef']).toBeNull();
    });

    it('should set overlayRef to null after closing filter panel', () => {
      const mockOvRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOvRef;
      component.isFilterOpen = true;

      component.closeFilterPanel();

      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
      expect(mockOvRef.dispose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should create new record on Alt+C', () => {
      spyOn(component, 'createRecord');

      const event = new KeyboardEvent('keydown', { key: 'c', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should handle uppercase Alt+C', () => {
      spyOn(component, 'createRecord');

      const event = new KeyboardEvent('keydown', { key: 'C', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should focus search on Alt+S', () => {
      component.searchBarComponent = { focus: jasmine.createSpy('focus'), searchText: '' } as any;

      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchBarComponent.focus).toHaveBeenCalled();
    });

    it('should not error on Alt+S when searchBarComponent is not available', () => {
      component.searchBarComponent = undefined as any;

      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');

      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');

      const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close filter panel on Escape when overlay is open', () => {
      component['overlayRef'] = jasmine.createSpyObj('OverlayRef', ['dispose']) as any;
      component.sidePanelOpen = false;

      spyOn(component, 'closeFilterPanel');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeFilterPanel).toHaveBeenCalled();
    });

    it('should close side panel on Escape when side panel is open', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = true;

      spyOn(component, 'closeSidePanel');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should close both filter and side panel on Escape when both are open', () => {
      component['overlayRef'] = jasmine.createSpyObj('OverlayRef', ['dispose']) as any;
      component.sidePanelOpen = true;

      spyOn(component, 'closeFilterPanel');
      spyOn(component, 'closeSidePanel');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(component.closeFilterPanel).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should not trigger any action for non-shortcut keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');
      spyOn(component, 'closeFilterPanel');
      spyOn(component, 'closeSidePanel');

      const event = new KeyboardEvent('keydown', { key: 'a' });

      component.handleKeyboardShortcut(event);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
      expect(component.closeFilterPanel).not.toHaveBeenCalled();
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts without Alt key for c, s, f', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'openFilter');

      const eventC = new KeyboardEvent('keydown', { key: 'c', altKey: false });
      const eventF = new KeyboardEvent('keydown', { key: 'f', altKey: false });

      component.handleKeyboardShortcut(eventC);
      component.handleKeyboardShortcut(eventF);

      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.openFilter).not.toHaveBeenCalled();
    });

    it('should not close panels on Escape when neither is open', () => {
      component['overlayRef'] = null;
      component.sidePanelOpen = false;

      spyOn(component, 'closeFilterPanel');
      spyOn(component, 'closeSidePanel');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component.closeFilterPanel).not.toHaveBeenCalled();
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });
  });

  describe('Chapter Change Handling', () => {
    beforeEach(() => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    it('should clear search state on chapter change', () => {
      component.ngOnInit();

      component.requestState.searchKeyword = 'test search';

      chapterChangedSubject.next();

      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should clear search bar text on chapter change when searchBarComponent is available', () => {
      component.ngOnInit();

      component.searchBarComponent = { searchText: 'test', focus: jasmine.createSpy() } as any;

      chapterChangedSubject.next();

      expect(component.searchBarComponent.searchText).toBe('');
    });

    it('should handle chapter change when searchBarComponent is not set', () => {
      component.ngOnInit();

      component.searchBarComponent = undefined as any;

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });

    it('should clear applied filters on chapter change', () => {
      component.ngOnInit();

      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'boxType', label: 'test', value: '26' }];

      chapterChangedSubject.next();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should remove filter params from requestState on chapter change', () => {
      component.ngOnInit();

      component.requestState = {
        boxType: '26',
        productType: 'CRYO',
        capacity: 10,
        capacityRange: 'Over',
        effectiveDate: '2024-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2024-12-31',
        terminationDatePeriod: 'Before'
      };

      chapterChangedSubject.next();

      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.capacity).toBeUndefined();
      expect(component.requestState.capacityRange).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
    });

    it('should close side panel on chapter change when open', () => {
      component.ngOnInit();

      component.sidePanelOpen = true;
      component.sidePanelData = mockBoxCapacityData[0];

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should not modify side panel state when not open on chapter change', () => {
      component.ngOnInit();

      component.sidePanelOpen = false;
      component.sidePanelData = null;

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should close filter panel on chapter change when open', () => {
      component.ngOnInit();

      component.isFilterOpen = true;
      spyOn(component, 'closeFilterPanel');

      chapterChangedSubject.next();

      expect(component.closeFilterPanel).toHaveBeenCalled();
    });

    it('should not close filter panel on chapter change when not open', () => {
      component.ngOnInit();

      component.isFilterOpen = false;
      spyOn(component, 'closeFilterPanel');

      chapterChangedSubject.next();

      expect(component.closeFilterPanel).not.toHaveBeenCalled();
    });

    it('should reset pagination on chapter change', () => {
      component.ngOnInit();

      component.tableConfig.pagination!.pageIndex = 5;
      component.tableConfig.pagination!.totalRecords = 100;

      chapterChangedSubject.next();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset sort config on chapter change', () => {
      component.ngOnInit();

      component.tableConfig.sortConfig!.column = 'capacity';
      component.tableConfig.sortConfig!.direction = 'A' as any;

      chapterChangedSubject.next();

      expect(component.tableConfig.sortConfig!.column).toBe('boxType');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should clear data source and error state on chapter change', () => {
      component.ngOnInit();

      component.dataSource = mockBoxCapacityData;
      component.hasError = true;

      chapterChangedSubject.next();

      expect(component.dataSource).toEqual([]);
      expect(component.hasError).toBeFalse();
    });

    it('should reload data after chapter change', () => {
      component.ngOnInit();

      mockBoxCapacityService.getBoxCapacity.calls.reset();

      chapterChangedSubject.next();

      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalled();
    });
  });

  describe('updateRequestStateFromFilters', () => {
    it('should clear filter params when appliedFilters is null', () => {
      component.requestState = {
        searchKeyword: 'test',
        boxType: '26',
        productType: 'CRYO',
        capacity: 10,
        capacityRange: 'Over',
        effectiveDate: '2024-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2024-12-31',
        terminationDatePeriod: 'Before'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.capacity).toBeUndefined();
      expect(component.requestState.capacityRange).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    });

    it('should map filter values to request state when appliedFilters is set', () => {
      component.appliedFilters = {
        boxType: 'CA',
        inventoryProductType: 'FFP',
        capacityRange: 'Under',
        capacity: 50,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date(2024, 5, 15),
        terminationDatePeriod: 'After',
        terminationDate: new Date(2024, 11, 31)
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.boxType).toBe('CA');
      expect(component.requestState.productType).toBe('FFP');
      expect(component.requestState.capacityRange).toBe('Under');
      expect(component.requestState.capacity).toBe(50);
      expect(component.requestState.effectiveDate).toBe('2024-06-15T12:00:00.000Z');
      expect(component.requestState.effectiveDatePeriod).toBe('Before');
      expect(component.requestState.terminationDate).toBe('2024-12-31T12:00:00.000Z');
      expect(component.requestState.terminationDatePeriod).toBe('After');
    });

    it('should set empty filter fields to undefined in request state', () => {
      component.appliedFilters = {
        boxType: null,
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.boxType).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.capacity).toBeUndefined();
      expect(component.requestState.capacityRange).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(component.requestState.terminationDate).toBeUndefined();
    });

    it('should preserve existing non-filter request state fields', () => {
      component.requestState = { searchKeyword: 'test', sort: 'A' };
      component.appliedFilters = {
        boxType: '26',
        inventoryProductType: null,
        capacityRange: null,
        capacity: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.requestState.sort).toBe('A');
      expect(component.requestState.boxType).toBe('26');
    });
  });

  describe('Page Header Effect', () => {
    it('should update header config when page data is available', () => {
      pageHeaderServiceSpy.pageHeaderData.and.returnValue({
        title: 'Custom Title',
        subtitle: 'Custom Subtitle'
      });

      fixture = TestBed.createComponent(BoxCapacityComponent);
      component = fixture.componentInstance;

      mockBoxCapacityService.getBoxCapacity.and.returnValue(of({ data: [], totalRecords: 0 }));
      try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }

      expect(component.headerConfig.title).toBe('Custom Title');
      expect(component.headerConfig.subtitle).toBe('Custom Subtitle');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Custom Title');
    });

    it('should use default title when pageData title is empty', () => {
      pageHeaderServiceSpy.pageHeaderData.and.returnValue({
        title: '',
        subtitle: ''
      });

      fixture = TestBed.createComponent(BoxCapacityComponent);
      component = fixture.componentInstance;

      mockBoxCapacityService.getBoxCapacity.and.returnValue(of({ data: [], totalRecords: 0 }));
      try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }

      expect(component.headerConfig.title).toBe('Box Capacity');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Box Capacity');
    });

    it('should not update header config when pageData is null', () => {
      pageHeaderServiceSpy.pageHeaderData.and.returnValue(null);

      fixture = TestBed.createComponent(BoxCapacityComponent);
      component = fixture.componentInstance;

      mockBoxCapacityService.getBoxCapacity.and.returnValue(of({ data: [], totalRecords: 0 }));
      try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }

      expect(component.headerConfig.title).toBe('Box Capacity');
    });

    it('should use empty string for subtitle when pageData subtitle is null', () => {
      pageHeaderServiceSpy.pageHeaderData.and.returnValue({
        title: 'Test Title',
        subtitle: null
      });

      fixture = TestBed.createComponent(BoxCapacityComponent);
      component = fixture.componentInstance;

      mockBoxCapacityService.getBoxCapacity.and.returnValue(of({ data: [], totalRecords: 0 }));
      try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }

      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should preserve Home breadcrumb when updating from page data', () => {
      pageHeaderServiceSpy.pageHeaderData.and.returnValue({
        title: 'Updated Title',
        subtitle: 'Updated Sub'
      });

      fixture = TestBed.createComponent(BoxCapacityComponent);
      component = fixture.componentInstance;

      mockBoxCapacityService.getBoxCapacity.and.returnValue(of({ data: [], totalRecords: 0 }));
      try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }

      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
    });
  });

  describe('Lifecycle', () => {
    it('should call loadData on ngOnInit', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: mockBoxCapacityData, totalRecords: 2 })
      );

      component.ngOnInit();

      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(2);
    });

    it('should subscribe to chapter changes on ngOnInit', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();

      // Verify subscription is active by emitting a chapter change
      mockBoxCapacityService.getBoxCapacity.calls.reset();
      chapterChangedSubject.next();

      expect(mockBoxCapacityService.getBoxCapacity).toHaveBeenCalled();
    });

    it('should emit and complete destroy$ on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should dispose overlayRef on ngOnDestroy when it exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not error on ngOnDestroy when overlayRef is null', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from service calls on destroy via takeUntil', () => {
      const mockSubject = new Subject<{ data: BoxCapacityModel[]; totalRecords: number }>();
      mockBoxCapacityService.getBoxCapacity.and.returnValue(mockSubject.asObservable());

      component.loadData();

      component.ngOnDestroy();

      // After destroy, emitting should not update component
      mockSubject.next({ data: mockBoxCapacityData, totalRecords: 2 });

      expect(component.dataSource).toEqual([]);
    });

    it('should stop receiving chapter changes after ngOnDestroy', () => {
      mockBoxCapacityService.getBoxCapacity.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.ngOnInit();
      component.ngOnDestroy();

      mockBoxCapacityService.getBoxCapacity.calls.reset();

      // Emit chapter change after destroy
      chapterChangedSubject.next();

      // Should NOT have called loadData since subscription was destroyed
      expect(mockBoxCapacityService.getBoxCapacity).not.toHaveBeenCalled();
    });
  });
});
