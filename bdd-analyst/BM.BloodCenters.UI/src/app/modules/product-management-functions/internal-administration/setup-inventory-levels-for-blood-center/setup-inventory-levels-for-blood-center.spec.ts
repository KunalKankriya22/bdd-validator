import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSelectChange } from '@angular/material/select';

import { SetupInventoryLevelsForBloodCenterComponent } from './setup-inventory-levels-for-blood-center';
import { SetupInventoryLevelsApiService } from './services/setup-inventory-levels-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import {
  SetInventoryLevelDto,
  SetInventoryLevelDisplay,
  FilterValue
} from './models/setup-inventory-levels.model';

describe('SetupInventoryLevelsForBloodCenterComponent', () => {
  let component: SetupInventoryLevelsForBloodCenterComponent;
  let fixture: ComponentFixture<SetupInventoryLevelsForBloodCenterComponent>;
  let apiService: jasmine.SpyObj<SetupInventoryLevelsApiService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let chapterChanged$: Subject<void>;

  const mockInventoryClasses = [
    { code: 'WB', codeDesc: 'Whole Blood' },
    { code: 'RBC', codeDesc: 'Red Blood Cells' }
  ];

  const mockApiData: SetInventoryLevelDto[] = [
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'MI',
      productType: 'PT01',
      productTypeDesc: 'Product Type 01',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      attribGroup: 'AG1',
      attribCode: 'AC1',
      tier: null,
      qty: 10,
      minQty: 10,
      optQty: null,
      effDate: '2025-01-15T00:00:00',
      termDate: null,
      lastModifiedDate: '2025-01-10T14:30:00'
    },
    {
      chapterId: 'CH1',
      customerId: 'C1',
      inventoryClass: 'WB',
      inventoryType: 'OP',
      productType: 'PT02',
      productTypeDesc: 'Product Type 02',
      bloodType: 'B-',
      bloodTypeDesc: 'B Negative',
      attribGroup: null,
      attribCode: null,
      tier: null,
      qty: 20,
      minQty: null,
      optQty: 20,
      effDate: '2025-02-01T00:00:00',
      termDate: '2025-12-31T00:00:00',
      lastModifiedDate: null
    }
  ];

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();

    apiService = jasmine.createSpyObj('SetupInventoryLevelsApiService', [
      'getInventoryClasses',
      'getInventoryTypes',
      'getProductTypes',
      'getBloodTypes',
      'getAttributeGroups',
      'getInventoryLevels',
      'deleteInventoryLevel'
    ]);

    apiService.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    apiService.getInventoryLevels.and.returnValue(of({ data: mockApiData, total: 2 }));

    loggingService = jasmine.createSpyObj('LoggingService', ['error']);
    snackbarService = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);

    headerService = jasmine.createSpyObj('HeaderService', ['chapterTimeZone'], {
      chapterChanged$: chapterChanged$.asObservable()
    });
    headerService.chapterTimeZone.and.returnValue('America/Los_Angeles');

    menuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuService.getMenuItemsSignal.and.returnValue(() => []);

    await TestBed.configureTestingModule({
      imports: [
        SetupInventoryLevelsForBloodCenterComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: SetupInventoryLevelsApiService, useValue: apiService },
        { provide: LoggingService, useValue: loggingService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: HeaderService, useValue: headerService },
        { provide: MenuService, useValue: menuService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SetupInventoryLevelsForBloodCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have hasRetrieved as false initially', () => {
      expect(component.hasRetrieved).toBeFalse();
    });

    it('should initialize table config with columns', () => {
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should load inventory classes on init', () => {
      expect(apiService.getInventoryClasses).toHaveBeenCalled();
      expect(component.inventoryClassOptions).toEqual(mockInventoryClasses);
      expect(component.filteredInventoryClassOptions).toEqual(mockInventoryClasses);
    });

    it('should initialize search config', () => {
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.searchConfig.placeholder).toBe('Search by product type');
    });

    it('should initialize pagination config', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should initialize with empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should set inventoryClassCode to null initially', () => {
      expect(component.inventoryClassCode).toBeNull();
    });

    it('should set default sort config', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('productType');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should handle error loading inventory classes', () => {
      apiService.getInventoryClasses.and.returnValue(throwError(() => new Error('Network error')));
      component.ngOnInit();
      expect(loggingService.error).toHaveBeenCalled();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load inventory classes');
    });
  });

  describe('inventory class search filter', () => {
    it('should filter inventory classes by code', () => {
      component.inventoryClassSearchControl.setValue('WB');
      expect(component.filteredInventoryClassOptions.length).toBe(1);
      expect(component.filteredInventoryClassOptions[0].code).toBe('WB');
    });

    it('should filter inventory classes by description', () => {
      component.inventoryClassSearchControl.setValue('Red');
      expect(component.filteredInventoryClassOptions.length).toBe(1);
      expect(component.filteredInventoryClassOptions[0].code).toBe('RBC');
    });

    it('should show all options when search is empty', () => {
      component.inventoryClassSearchControl.setValue('');
      expect(component.filteredInventoryClassOptions.length).toBe(2);
    });

    it('should handle null search value', () => {
      component.inventoryClassSearchControl.setValue(null as any);
      expect(component.filteredInventoryClassOptions.length).toBe(2);
    });
  });

  describe('onInventoryClassChange', () => {
    it('should load data when inventory class is selected', () => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);

      expect(component.selectedInventoryClass).toBe('WB');
      expect(component.hasRetrieved).toBeTrue();
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should reset filters and search on class change', () => {
      component.appliedFilters = { productType: 'PT01' };
      component.filterChips = [{ key: 'test', label: 'test', value: 'test' }];
      component.searchTerm = 'search';

      const event = { value: 'RBC' } as MatSelectChange;
      component.onInventoryClassChange(event);

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchTerm).toBe('');
    });

    it('should not load data if no value selected', () => {
      apiService.getInventoryLevels.calls.reset();
      const event = { value: null } as MatSelectChange;
      component.onInventoryClassChange(event);
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });

    it('should reset sort config on class change', () => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should reset pagination on class change', () => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('loadData (via onInventoryClassChange)', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should populate dataSource with mapped display data', () => {
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].effDateDisplay).toBeTruthy();
    });

    it('should format dates correctly', () => {
      const display = component.dataSource[0];
      expect(display.effDateDisplay).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should handle null termination date', () => {
      const display = component.dataSource[0];
      expect(display.termDateDisplay).toBeNull();
    });

    it('should format termination date when present', () => {
      const display = component.dataSource[1];
      expect(display.termDateDisplay).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should handle lastModifiedDate display', () => {
      expect(component.dataSource[0].lastModifiedDateDisplay).toBeTruthy();
      expect(component.dataSource[1].lastModifiedDateDisplay).toBeNull();
    });

    it('should update pagination total records', () => {
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    });

    it('should handle API error on load', () => {
      apiService.getInventoryLevels.and.returnValue(throwError(() => new Error('Load failed')));
      component.onSearch('test');
      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load inventory levels. Please try again.');
      expect(loggingService.error).toHaveBeenCalled();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load inventory levels');
    });

    it('should set isLoading to false after data loads', () => {
      expect(component.isLoading).toBeFalse();
    });

    it('should update table empty message after loading', () => {
      expect(component.tableConfig.emptyMessage).toBe('No inventory levels available to display');
    });

    it('should not call API when no inventory class is selected', () => {
      component.selectedInventoryClass = null;
      apiService.getInventoryLevels.calls.reset();
      component.onSearch('test');
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
    });

    it('should cycle through sort directions: default -> A -> D -> default', () => {
      component.onSortChange({ column: 'productTypeDesc', direction: '' });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');

      component.onSortChange({ column: 'productTypeDesc', direction: '' });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');

      component.onSortChange({ column: 'productTypeDesc', direction: '' });
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should reset page index on sort change', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };
      component.onSortChange({ column: 'productTypeDesc', direction: '' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should include sort params in API call when direction is not default', () => {
      component.onSortChange({ column: 'productTypeDesc', direction: '' });
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].sortColumn).toBe('ProductType');
      expect(call.args[1].sortOrder).toBe('ASC');
    });

    it('should not include sort params when direction is default', () => {
      // Start at default
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productType', direction: 'default' }
      };
      component.onSearch('');
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].sortColumn).toBeUndefined();
      expect(call.args[1].sortOrder).toBeUndefined();
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
    });

    it('should update page size on page change', () => {
      component.onPageChange({ pageSize: 50, pageIndex: 0 } as any);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });

    it('should update page index on page change', () => {
      component.onPageChange({ pageSize: 25, pageIndex: 2 } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    });

    it('should call loadData on page change', () => {
      apiService.getInventoryLevels.calls.reset();
      component.onPageChange({ pageSize: 25, pageIndex: 1 } as any);
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
    });

    it('should pass search term to API', () => {
      component.onSearch('PT01');
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].searchKeyword).toBe('PT01');
    });

    it('should reset page index on search', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };
      component.onSearch('test');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should store search term', () => {
      component.onSearch('my search');
      expect(component.searchTerm).toBe('my search');
    });

    it('should not include search keyword when empty', () => {
      component.onSearch('');
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].searchKeyword).toBeUndefined();
    });
  });

  describe('client-side filters', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should filter by product type', () => {
      const filters: FilterValue = { productType: 'PT01' };
      component['applyFilters'](filters);
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].productType).toBe('PT01');
    });

    it('should filter by ABORh', () => {
      const filters: FilterValue = { aborh: 'A+' };
      component['applyFilters'](filters);
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].bloodType).toBe('A+');
    });

    it('should filter by attribute', () => {
      const filters: FilterValue = { attribute: 'AC1' };
      component['applyFilters'](filters);
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].attribCode).toBe('AC1');
    });

    it('should combine multiple filters', () => {
      const filters: FilterValue = { productType: 'PT01', aborh: 'A+' };
      component['applyFilters'](filters);
      expect(component.dataSource.length).toBe(1);
    });

    it('should return no results if no match', () => {
      const filters: FilterValue = { productType: 'NOPE' };
      component['applyFilters'](filters);
      expect(component.dataSource.length).toBe(0);
    });

    it('should return all data when filters are null', () => {
      component['applyFilters']({});
      expect(component.dataSource.length).toBe(2);
    });
  });

  describe('date filters (server-side)', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      apiService.getInventoryLevels.calls.reset();
    });

    it('should send date filters to API', () => {
      const filters: FilterValue = {
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01'
      };
      component['applyFilters'](filters);
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].effectiveDatePeriod).toBe('After');
      expect(call.args[1].effectiveDate).toBe('2025-01-01');
    });

    it('should send termination date filters to API', () => {
      const filters: FilterValue = {
        terminationDatePeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      component['applyFilters'](filters);
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].terminationDatePeriod).toBe('Before');
      expect(call.args[1].terminationDate).toBe('2025-12-31');
    });

    it('should not call API when only grid filters change', () => {
      const filters: FilterValue = { productType: 'PT01' };
      component['applyFilters'](filters);
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });
  });

  describe('filter chips', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should update filter chips when filters are applied', () => {
      const filters: FilterValue = { productType: 'PT01' };
      component['applyFilters'](filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });

    it('should clear filter chips when filters are empty', () => {
      component['applyFilters']({});
      expect(component.filterChips).toEqual([]);
    });

    it('should remove a specific filter chip', () => {
      component.appliedFilters = { productType: 'PT01', aborh: 'A+' };
      component.onRemoveFilterChip('productType');
      expect(component.appliedFilters?.productType).toBeUndefined();
    });

    it('should not remove filter if appliedFilters is null', () => {
      component.appliedFilters = null;
      component.onRemoveFilterChip('productType');
      expect(component.appliedFilters).toBeNull();
    });

    it('should call API when date filter chip is removed', () => {
      component.appliedFilters = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After'
      };
      apiService.getInventoryLevels.calls.reset();
      component.onRemoveFilterChip('effectiveDate');
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should not call API when non-date filter chip is removed', () => {
      component.appliedFilters = { productType: 'PT01', aborh: 'A+' };
      apiService.getInventoryLevels.calls.reset();
      component.onRemoveFilterChip('productType');
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });
  });

  describe('onClearAllFilters', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should clear all applied filters', () => {
      component.appliedFilters = { productType: 'PT01' };
      component.onClearAllFilters();
      expect(component.filterChips).toEqual([]);
    });

    it('should call API if date filters were active', () => {
      component.appliedFilters = { effectiveDate: '2025-01-01', effectiveDatePeriod: 'After' };
      apiService.getInventoryLevels.calls.reset();
      component.onClearAllFilters();
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should not call API if only grid filters were active', () => {
      component.appliedFilters = { productType: 'PT01' };
      apiService.getInventoryLevels.calls.reset();
      component.onClearAllFilters();
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });

    it('should restore all data when clearing grid-only filters', () => {
      component.appliedFilters = { productType: 'PT01' };
      component.onClearAllFilters();
      expect(component.dataSource.length).toBe(2);
    });
  });

  describe('onClearAll (reset)', () => {
    it('should reset all state', () => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
      component.searchTerm = 'test';
      component.appliedFilters = { productType: 'PT01' };

      component.onClearAll();

      expect(component.selectedInventoryClass).toBeNull();
      expect(component.hasRetrieved).toBeFalse();
      expect(component.dataSource).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchTerm).toBe('');
    });

    it('should reset pagination', () => {
      component.onClearAll();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset empty state messages', () => {
      component.onClearAll();
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
      expect(component.tableConfig.emptySubMessage).toBe('Select inventory class to begin');
    });
  });

  describe('side panel (add/edit)', () => {
    it('should open add dialog', () => {
      component.selectedInventoryClass = 'WB';
      component.openAddDialog();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should show error if no inventory class selected for add', () => {
      component.selectedInventoryClass = null;
      component.openAddDialog();
      expect(snackbarService.showError).toHaveBeenCalledWith('Please select an inventory class first');
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should open edit dialog with row data', () => {
      const row = { productType: 'PT01' } as SetInventoryLevelDisplay;
      component.editRecord(row);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
    });

    it('should close side panel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = {} as any;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', () => {
      component.selectedInventoryClass = 'WB';
      apiService.getInventoryLevels.calls.reset();
      component.onSaveSuccess();
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      const row = { productType: 'PT01' } as SetInventoryLevelDisplay;
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row } as any);
      expect(component.editRecord).toHaveBeenCalledWith(row);
    });

    it('should set active row on data table', () => {
      const row = { productType: 'PT01' } as SetInventoryLevelDisplay;
      const mockDataTable = { activeRow: null as any };
      component.dataTableComponent = mockDataTable as any;
      component.onRowAction({ action: 'edit', row } as any);
      expect(mockDataTable.activeRow).toBe(row);
    });

    it('should not error when action is not edit', () => {
      const row = { productType: 'PT01' } as SetInventoryLevelDisplay;
      expect(() => component.onRowAction({ action: 'delete', row } as any)).not.toThrow();
    });
  });

  describe('filter panel overlay', () => {
    it('should toggle filter panel open state', () => {
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter panel if already open', () => {
      component['overlayRef'] = { dispose: jasmine.createSpy('dispose') } as any;
      component.openFilterPanel();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('chapter changes', () => {
    it('should reset state on chapter change', () => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
      component.searchTerm = 'test';
      component.dataSource = [{ productType: 'PT01' } as any];
      component.appliedFilters = { productType: 'PT01' };

      chapterChanged$.next();

      expect(component.selectedInventoryClass).toBeNull();
      expect(component.hasRetrieved).toBeFalse();
      expect(component.searchTerm).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should reload inventory classes on chapter change', () => {
      apiService.getInventoryClasses.calls.reset();
      chapterChanged$.next();
      expect(apiService.getInventoryClasses).toHaveBeenCalled();
    });

    it('should close side panel on chapter change', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSidePanel');
      chapterChanged$.next();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should reset inventory class search control', () => {
      component.inventoryClassSearchControl.setValue('WB');
      chapterChanged$.next();
      expect(component.inventoryClassSearchControl.value).toBe('');
    });
  });

  describe('table column formatters', () => {
    it('should format product type with code and description', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productTypeDesc');
      const row = { productType: 'PT01', productTypeDesc: 'Desc' } as SetInventoryLevelDisplay;
      expect(col!.valueFormatter!('Desc', row)).toBe('PT01 - Desc');
    });

    it('should show product type code when no description', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'productTypeDesc');
      const row = { productType: 'PT01', productTypeDesc: '' } as SetInventoryLevelDisplay;
      expect(col!.valueFormatter!('', row)).toBe('PT01');
    });

    it('should show dash for null blood type', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'bloodTypeDesc');
      expect(col!.valueFormatter!(null as any, {} as any)).toBe('-');
    });

    it('should show dash for null attribute', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'attribCode');
      expect(col!.valueFormatter!(null as any, {} as any)).toBe('-');
    });

    it('should format minimal quantity', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'minQty');
      expect(col!.valueFormatter!(10 as any, {} as any)).toBe('10');
    });

    it('should show dash for null minimal quantity', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'minQty');
      expect(col!.valueFormatter!(null as any, {} as any)).toBe('-');
    });

    it('should show dash for null termination date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDateDisplay');
      expect(col!.valueFormatter!(null as any, {} as any)).toBe('-');
    });
  });

  describe('loadData with search and date filters', () => {
    beforeEach(() => {
      component.selectedInventoryClass = 'WB';
      component.hasRetrieved = true;
    });

    it('should pass searchKeyword to API when searchTerm is set', () => {
      component.searchTerm = 'PT01';
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].searchKeyword).toBe('PT01');
    });

    it('should not pass searchKeyword when searchTerm is empty', () => {
      component.searchTerm = '';
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].searchKeyword).toBeUndefined();
    });

    it('should pass effective date filter to API', () => {
      component.appliedFilters = {
        effectiveDate: '2025-03-15',
        effectiveDatePeriod: 'After'
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].effectiveDatePeriod).toBe('After');
      expect(call.args[1].effectiveDate).toBe('2025-03-15');
    });

    it('should pass termination date filter to API', () => {
      component.appliedFilters = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].terminationDatePeriod).toBe('Before');
      expect(call.args[1].terminationDate).toBe('2025-12-31');
    });

    it('should not pass date filter when only date is set without period', () => {
      component.appliedFilters = {
        effectiveDate: '2025-03-15',
        effectiveDatePeriod: null
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].effectiveDatePeriod).toBeUndefined();
      expect(call.args[1].effectiveDate).toBeUndefined();
    });

    it('should not pass termination date filter when only date is set', () => {
      component.appliedFilters = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: null
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].terminationDatePeriod).toBeUndefined();
      expect(call.args[1].terminationDate).toBeUndefined();
    });

    it('should include DESC sort order when direction is D', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productType', direction: 'D' }
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[1].sortOrder).toBe('DESC');
    });

    it('should calculate skip from pageIndex and pageSize', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageSize: 50, pageIndex: 2 }
      };
      component['loadData']();
      const call = apiService.getInventoryLevels.calls.mostRecent();
      expect(call.args[2]).toBe(50);  // take
      expect(call.args[3]).toBe(100); // skip = 2 * 50
    });

    it('should apply client-side filters on loaded data', () => {
      component.appliedFilters = { productType: 'PT01' };
      component['loadData']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].productType).toBe('PT01');
    });

    it('should not apply client-side filters when filters are null', () => {
      component.appliedFilters = null;
      component['loadData']();
      expect(component.dataSource.length).toBe(2);
    });
  });

  describe('formatDate and formatDateTime', () => {
    it('should return original string for invalid date in formatDate', () => {
      const result = component['formatDate']('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should return formatted date for valid ISO date', () => {
      const result = component['formatDate']('2025-06-15T00:00:00');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return original string for invalid date in formatDateTime', () => {
      const result = component['formatDateTime']('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should return formatted datetime with PST for valid date', () => {
      const result = component['formatDateTime']('2025-06-15T14:30:00');
      expect(result).toContain('PST');
    });
  });

  describe('applyClientSideFilters', () => {
    let testData: SetInventoryLevelDisplay[];

    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      testData = component['allData'];
    });

    it('should return all data when appliedFilters is null', () => {
      component.appliedFilters = null;
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(testData.length);
    });

    it('should filter by aborh only', () => {
      component.appliedFilters = { aborh: 'B-' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(1);
      expect(result[0].bloodType).toBe('B-');
    });

    it('should filter by attribute only', () => {
      component.appliedFilters = { attribute: 'AC1' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(1);
    });

    it('should return empty when no match on productType', () => {
      component.appliedFilters = { productType: 'NONEXISTENT' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(0);
    });

    it('should return empty when no match on aborh', () => {
      component.appliedFilters = { aborh: 'O+' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(0);
    });

    it('should return empty when no match on attribute', () => {
      component.appliedFilters = { attribute: 'NONEXISTENT' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(0);
    });

    it('should combine all three filters', () => {
      component.appliedFilters = { productType: 'PT01', aborh: 'A+', attribute: 'AC1' };
      const result = component['applyClientSideFilters'](testData);
      expect(result.length).toBe(1);
    });
  });

  describe('applyFilters date filter change detection', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      apiService.getInventoryLevels.calls.reset();
    });

    it('should call API when effective date filter changes', () => {
      component.appliedFilters = null;
      component['applyFilters']({
        effectiveDate: '2025-06-01',
        effectiveDatePeriod: 'After'
      });
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should call API when termination date filter changes', () => {
      component.appliedFilters = null;
      component['applyFilters']({
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      });
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should not call API when only client-side filters change from date filters', () => {
      component.appliedFilters = {
        effectiveDate: '2025-06-01',
        effectiveDatePeriod: 'After'
      };
      component['applyFilters']({
        effectiveDate: '2025-06-01',
        effectiveDatePeriod: 'After',
        productType: 'PT01'
      });
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });

    it('should update dataSource client-side when only grid filters change', () => {
      component.appliedFilters = null;
      component['applyFilters']({ productType: 'PT01' });
      expect(component.dataSource.length).toBe(1);
    });
  });

  describe('onRemoveFilterChip edge cases', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should update dataSource when removing non-date filter', () => {
      component.appliedFilters = { productType: 'PT01', aborh: 'A+' };
      component['applyFilters'](component.appliedFilters);
      apiService.getInventoryLevels.calls.reset();

      component.onRemoveFilterChip('productType');
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
      expect(component.dataSource.length).toBeGreaterThan(0);
    });

    it('should call API when removing termination date filter', () => {
      component.appliedFilters = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'Before'
      };
      apiService.getInventoryLevels.calls.reset();
      component.onRemoveFilterChip('terminationDate');
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });
  });

  describe('onClearAllFilters edge cases', () => {
    beforeEach(() => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
    });

    it('should call API when termination date filters were active', () => {
      component.appliedFilters = { terminationDate: '2025-12-31', terminationDatePeriod: 'Before' };
      apiService.getInventoryLevels.calls.reset();
      component.onClearAllFilters();
      expect(apiService.getInventoryLevels).toHaveBeenCalled();
    });

    it('should reset pagination when clearing', () => {
      component.appliedFilters = { productType: 'PT01' };
      component.onClearAllFilters();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('updateFilterChips', () => {
    it('should set empty chips when appliedFilters is empty object', () => {
      component.appliedFilters = {};
      component['updateFilterChips']();
      expect(component.filterChips).toEqual([]);
    });

    it('should set empty chips when appliedFilters is null', () => {
      component.appliedFilters = null;
      component['updateFilterChips']();
      expect(component.filterChips).toEqual([]);
    });

    it('should create chips when filters have values', () => {
      const event = { value: 'WB' } as MatSelectChange;
      component.onInventoryClassChange(event);
      component.appliedFilters = { productType: 'PT01' };
      component['updateFilterChips']();
      expect(component.filterChips.length).toBe(1);
    });
  });

  describe('closeSidePanel with dataTableComponent', () => {
    it('should clear activeRow on dataTableComponent', () => {
      const mockDataTable = { activeRow: { productType: 'PT01' } as any };
      component.dataTableComponent = mockDataTable as any;
      component.sidePanelOpen = true;
      component.closeSidePanel();
      expect(mockDataTable.activeRow).toBeNull();
    });

    it('should handle missing dataTableComponent', () => {
      component.dataTableComponent = null as any;
      expect(() => component.closeSidePanel()).not.toThrow();
    });
  });

  describe('onSaveSuccess', () => {
    it('should not call API when no inventory class selected', () => {
      component.selectedInventoryClass = null;
      apiService.getInventoryLevels.calls.reset();
      component.onSaveSuccess();
      expect(apiService.getInventoryLevels).not.toHaveBeenCalled();
    });
  });

  describe('mapToDisplayModel', () => {
    it('should format dates in display model', () => {
      const result = component['mapToDisplayModel'](mockApiData);
      expect(result[0].effDateDisplay).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result[0].termDateDisplay).toBeNull();
      expect(result[1].termDateDisplay).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should format lastModifiedDate when present', () => {
      const result = component['mapToDisplayModel'](mockApiData);
      expect(result[0].lastModifiedDateDisplay).toContain('PST');
      expect(result[1].lastModifiedDateDisplay).toBeNull();
    });
  });

  describe('inventoryClassCode getter', () => {
    it('should return selected value', () => {
      component.selectedInventoryClass = 'WB';
      expect(component.inventoryClassCode).toBe('WB');
    });
  });

  describe('element ID helpers', () => {
    it('should generate unique element IDs', () => {
      const id1 = component.elementId('test');
      expect(id1).toContain('setup-inventory-levels-');
      expect(id1).toContain('-test');
    });

    it('should generate unique error IDs', () => {
      const id = component.errorId('field');
      expect(id).toContain('-field-error');
    });

    it('should generate unique label IDs', () => {
      const id = component.labelId('field');
      expect(id).toContain('-field-label');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should close filter panel on destroy', () => {
      component['overlayRef'] = { dispose: jasmine.createSpy('dispose') } as any;
      component.ngOnDestroy();
      expect(component['overlayRef']).toBeNull();
    });
  });
});
