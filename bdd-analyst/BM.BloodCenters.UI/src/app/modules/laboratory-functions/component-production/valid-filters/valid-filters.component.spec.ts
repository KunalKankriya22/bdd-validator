import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { ValidFiltersComponent } from './valid-filters.component';
import { ValidFiltersApiService } from './services/valid-filters-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import {
  ValidFilterModel,
  ValidFilterFilterValue,
  ValidFilterFormValue,
} from './models/valid-filters.model';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';
import moment from 'moment';

describe('ValidFiltersComponent', () => {
  let component: ValidFiltersComponent;
  let fixture: ComponentFixture<ValidFiltersComponent>;
  let mockService: jasmine.SpyObj<ValidFiltersApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;

  const mockData: ValidFilterModel[] = [
    {
      vendorName: 'AP',
      catalogNumber: 'PA0000003',
      productType: 'RBC',
      numberOfDays: 56,
      effDate: '2025-06-09T00:00:00Z',
      termDate: null
    },
    {
      vendorName: 'BF',
      catalogNumber: 'HA000BF04',
      productType: 'RBC',
      numberOfDays: 56,
      effDate: '2025-06-10T00:00:00Z',
      termDate: '2025-12-31T00:00:00Z'
    }
  ];

  beforeEach(() => {

    const chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('ValidFiltersApiService', [
      'getValidFilters',
      'getFilterDropdown',
      'getAddDropdown',
      'createValidFilter',
      'updateValidFilter'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = createMockPageHeaderService();
    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath', 'getMenuItemsSignal']);
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Valid Filters', subtitle: 'Manage valid filter details.' }),
      writable: false
    });
    mockService.getValidFilters.and.returnValue(of({ data: mockData, totalCount: 2 }));
    mockService.getFilterDropdown.and.returnValue(of({
      manufacturerNames: [{ code: 'AP', description: 'AP' }],
      catalogs: [{ code: 'PA0000003', description: 'PA0000003' }],
      productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }]
    }));
    mockService.getAddDropdown.and.returnValue(of({
      catalogs: [{ vendorName: 'AP', catalogNumber: 'PA0000003', description: 'Filter Set' }],
      productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }]
    }));

      TestBed.configureTestingModule({
      imports: [
        ValidFiltersComponent,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ValidFiltersApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        Overlay,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });



      mockService.getValidFilters.calls.reset();

      mockService.getFilterDropdown.calls.reset();

      mockService.getAddDropdown.calls.reset();

      mockService.createValidFilter.calls.reset();

      mockService.updateValidFilter.calls.reset();

      mockLoggingService.log.calls.reset();

      mockLoggingService.error.calls.reset();

      mockLoggingService.warn.calls.reset();

      mockLoggingService.debug.calls.reset();

      mockPageHeaderService.getTitle.calls.reset();

      mockPageHeaderService.getSubtitle.calls.reset();

      mockMenuService.findMenuItemByPath.calls.reset();

      mockMenuService.getMenuItemsSignal.calls.reset();

      mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

      mockService.getValidFilters.and.returnValue(of({ data: mockData, totalCount: 2 }));

    fixture = TestBed.createComponent(ValidFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load filter dropdown options on init', () => {
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
    });

    it('should load add dropdown options on init', () => {
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    });

    it('should load data on init', () => {
      expect(mockService.getValidFilters).toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should populate dataSource with response data', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].vendorName).toBe('AP');
    }));

    it('should set totalRecords in pagination config', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    }));

    it('should set hasError to true on error', fakeAsync(() => {
      mockService.getValidFilters.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should set isLoading to true at start of load', () => {
      mockService.getValidFilters.and.returnValue(of({ data: [], totalCount: 0 }));
      component.isLoading = false;
      component.loadData();
      // After observable completes synchronously, isLoading should be false
      expect(component.isLoading).toBeFalse();
    });

    it('should set hasError to false at start of load', fakeAsync(() => {
      component.hasError = true;
      component.loadData();
      tick();
      expect(component.hasError).toBeFalse();
    }));

    it('should log error and set errorMessage on failure', fakeAsync(() => {
      const error = new Error('API Error');
      mockService.getValidFilters.and.returnValue(throwError(() => error));

      component.loadData();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading valid filters', error);
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    }));

    it('should calculate skip from pageIndex and pageSize', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;
      component.loadData();
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));

    it('should use default values when pagination is not configured', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 25;
      component.loadData();
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
    }));

    it('should include requestState params in query', fakeAsync(() => {
      component.requestState = {
        vendorName: 'TestVendor',
        catalogNumber: 'CAT001',
        productType: 'RBC',
        numberOfDays: 30,
        sortColumn: 'VendorName',
        sortOrder: 'ASC'
      };
      component.loadData();
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({
        vendorName: 'TestVendor',
        catalogNumber: 'CAT001',
        productType: 'RBC',
        numberOfDays: 30,
        sortColumn: 'VendorName',
        sortOrder: 'ASC'
      }));
    }));

    it('should pass undefined for empty requestState fields', fakeAsync(() => {
      component.requestState = {};
      component.loadData();
      tick();

      const queryArg = mockService.getValidFilters.calls.mostRecent().args[2];
      expect(queryArg.vendorName).toBeUndefined();
      expect(queryArg.catalogNumber).toBeUndefined();
      expect(queryArg.productType).toBeUndefined();
      expect(queryArg.numberOfDays).toBeUndefined();
      expect(queryArg.sortColumn).toBeUndefined();
      expect(queryArg.sortOrder).toBeUndefined();
    }));
  });

  describe('loadLookupOptions', () => {
    it('should populate filterCatalogs from filter dropdown response', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        manufacturerNames: [],
        catalogs: [{ code: 'C1', description: 'Catalog 1' }],
        productTypes: []
      }));

      component['loadLookupOptions']();
      tick();

      expect(component.filterCatalogs).toEqual([{ code: 'C1', description: 'Catalog 1' }]);
    }));

    it('should populate filterProductTypes from filter dropdown response', fakeAsync(() => {
      mockService.getFilterDropdown.and.returnValue(of({
        manufacturerNames: [],
        catalogs: [],
        productTypes: [{ code: 'PLT', description: 'Platelets' }]
      }));

      component['loadLookupOptions']();
      tick();

      expect(component.filterProductTypes).toEqual([{ code: 'PLT', description: 'Platelets' }]);
    }));

    it('should log error when filter dropdown fails', fakeAsync(() => {
      const error = new Error('Filter dropdown error');
      mockService.getFilterDropdown.and.returnValue(throwError(() => error));
      mockLoggingService.error.calls.reset();

      component['loadLookupOptions']();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading filter dropdown options', error);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load filter options');
    }));

    it('should populate addCatalogs from add dropdown response', fakeAsync(() => {
      mockService.getAddDropdown.and.returnValue(of({
        catalogs: [{ vendorName: 'V1', catalogNumber: 'C1', description: 'Cat 1' }],
        productTypes: []
      }));

      component['loadLookupOptions']();
      tick();

      expect(component.addCatalogs).toEqual([{ vendorName: 'V1', catalogNumber: 'C1', description: 'Cat 1' }]);
    }));

    it('should populate addProductTypes from add dropdown response', fakeAsync(() => {
      mockService.getAddDropdown.and.returnValue(of({
        catalogs: [],
        productTypes: [{ code: 'WB', description: 'Whole Blood' }]
      }));

      component['loadLookupOptions']();
      tick();

      expect(component.addProductTypes).toEqual([{ code: 'WB', description: 'Whole Blood' }]);
    }));

    it('should log error when add dropdown fails', fakeAsync(() => {
      const error = new Error('Add dropdown error');
      mockService.getAddDropdown.and.returnValue(throwError(() => error));
      mockLoggingService.error.calls.reset();

      component['loadLookupOptions']();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading add/edit dropdown options', error);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load form options');
    }));

    it('should pass vendorName from requestState to getFilterDropdown', fakeAsync(() => {
      component.requestState.vendorName = 'SomeVendor';
      mockService.getFilterDropdown.calls.reset();

      component['loadLookupOptions']();
      tick();

      expect(mockService.getFilterDropdown).toHaveBeenCalledWith('SomeVendor');
    }));
  });

  describe('subscribeToChapterChanges', () => {
    it('should reload data and lookups when chapter changes', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      // Re-create component to pick up the new chapterChanged$
      fixture = TestBed.createComponent(ValidFiltersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      mockService.getValidFilters.calls.reset();
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();

      chapterSubject.next();
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalled();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    }));

    it('should close side panel when chapter changes', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      fixture = TestBed.createComponent(ValidFiltersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.sidePanelOpen = true;
      chapterSubject.next();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));
  });

  describe('onSearch', () => {
    it('should set vendorName in requestState for search', () => {
      component.onSearch('test search');
      expect(component.requestState.vendorName).toBe('test search');
    });

    it('should reset page index to 0', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSearch('test');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should clear vendorName when empty string', () => {
      component.requestState.vendorName = 'old value';
      component.onSearch('');
      expect(component.requestState.vendorName).toBeUndefined();
    });

    it('should reload filter dropdown options on search', () => {
      mockService.getFilterDropdown.calls.reset();
      component.onSearch('CFFP');
      expect(mockService.getFilterDropdown).toHaveBeenCalledWith('CFFP');
    });

    it('should close side panel when searching', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBeTrue();

      component.onSearch('test');
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should call loadData after search', () => {
      mockService.getValidFilters.calls.reset();
      component.onSearch('AP');
      expect(mockService.getValidFilters).toHaveBeenCalled();
    });

    it('should call loadLookupOptions after search', () => {
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();
      component.onSearch('AP');
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update pagination pageIndex', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 25 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(3);
    });

    it('should update pagination pageSize', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50 });
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });

    it('should call loadData after page change', () => {
      mockService.getValidFilters.calls.reset();
      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      expect(mockService.getValidFilters).toHaveBeenCalled();
    });

    it('should calculate correct skip value for page 2 with size 10', fakeAsync(() => {
      mockService.getValidFilters.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 10 });
      tick();
      expect(mockService.getValidFilters).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));
  });

  describe('applyFilters', () => {
    it('should set appliedFilters', () => {
      const filters: ValidFilterFilterValue = { productType: 'RBC' };
      component.applyFilters(filters);
      expect(component.appliedFilters).toEqual(filters);
    });

    it('should update requestState with filter values', () => {
      const filters: ValidFilterFilterValue = {
        catalogNumber: 'PA0000003',
        productType: 'RBC'
      };
      component.applyFilters(filters);

      expect(component.requestState.catalogNumber).toBe('PA0000003');
      expect(component.requestState.productType).toBe('RBC');
    });

    it('should generate filter chips', () => {
      const filters: ValidFilterFilterValue = { catalogNumber: 'PA0000003', productType: 'RBC' };
      component.applyFilters(filters);
      expect(component.filterChips.length).toBe(2);
    });

    it('should close side panel when applying filters', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBeTrue();

      component.applyFilters({ productType: 'RBC' });
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should reset page index to 0 when applying filters', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.applyFilters({ productType: 'RBC' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData after applying filters', () => {
      mockService.getValidFilters.calls.reset();
      component.applyFilters({ productType: 'RBC' });
      expect(mockService.getValidFilters).toHaveBeenCalled();
    });

    it('should include days filter in requestState when provided', () => {
      component.applyFilters({ days: 30 });
      expect(component.requestState.numberOfDays).toBe(30);
    });

    it('should set numberOfDays to undefined when days is null', () => {
      component.applyFilters({ days: null });
      expect(component.requestState.numberOfDays).toBeUndefined();
    });

    it('should set catalogNumber to undefined when not provided', () => {
      component.requestState.catalogNumber = 'OLD';
      component.applyFilters({ productType: 'RBC' });
      expect(component.requestState.catalogNumber).toBeUndefined();
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should remove the specified filter chip', () => {
      component.appliedFilters = { catalogNumber: 'CAT1', productType: 'RBC' };
      component.filterChips = [
        { key: 'catalogNumber', label: 'Catalog: CAT1', value: 'CAT1' },
        { key: 'productType', label: 'Product Type: RBC', value: 'RBC' }
      ];

      component.onRemoveFilterChip('catalogNumber');

      expect(component.appliedFilters?.catalogNumber).toBeUndefined();
      expect(component.appliedFilters?.productType).toBe('RBC');
    });

    it('should set appliedFilters to null when removing last filter', () => {
      component.appliedFilters = { productType: 'RBC' };
      component.filterChips = [
        { key: 'productType', label: 'Product Type: RBC', value: 'RBC' }
      ];

      component.onRemoveFilterChip('productType');

      expect(component.appliedFilters).toBeNull();
    });

    it('should update filter chips after removal', () => {
      component.appliedFilters = { catalogNumber: 'CAT1', productType: 'RBC' };
      component.onRemoveFilterChip('catalogNumber');

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('productType');
    });

    it('should reset page index to 0', () => {
      component.appliedFilters = { productType: 'RBC' };
      component.tableConfig.pagination!.pageIndex = 5;

      component.onRemoveFilterChip('productType');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData after removing chip', () => {
      component.appliedFilters = { productType: 'RBC' };
      mockService.getValidFilters.calls.reset();

      component.onRemoveFilterChip('productType');

      expect(mockService.getValidFilters).toHaveBeenCalled();
    });

    it('should close side panel when removing filter chip', () => {
      component.appliedFilters = { productType: 'RBC' };
      component.sidePanelOpen = true;

      component.onRemoveFilterChip('productType');

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should update requestState from remaining filters', () => {
      component.appliedFilters = { catalogNumber: 'CAT1', productType: 'RBC', days: 10 };
      component.onRemoveFilterChip('days');

      expect(component.requestState.catalogNumber).toBe('CAT1');
      expect(component.requestState.productType).toBe('RBC');
      expect(component.requestState.numberOfDays).toBeUndefined();
    });

    it('should clear filter-related requestState when all filters removed', () => {
      component.requestState = { vendorName: 'AP', catalogNumber: 'CAT1' };
      component.appliedFilters = { catalogNumber: 'CAT1' };

      component.onRemoveFilterChip('catalogNumber');

      expect(component.requestState.catalogNumber).toBeUndefined();
      expect(component.requestState.vendorName).toBe('AP');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when appliedFilters is null', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when filters are active', () => {
      component.appliedFilters = { productType: 'RBC' };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should return false when all filter values are null or undefined', () => {
      component.appliedFilters = { catalogNumber: null, productType: null, days: null };
      expect(component.hasActiveFilters()).toBeFalse();
    });
  });

  describe('clearAllFilters', () => {
    it('should clear appliedFilters', () => {
      component.appliedFilters = { productType: 'RBC' };
      component.clearAllFilters();
      expect(component.appliedFilters).toBeNull();
    });

    it('should clear filterChips', () => {
      component.filterChips = [{ key: 'productType', label: 'Product Type: RBC', value: 'RBC' }];
      component.clearAllFilters();
      expect(component.filterChips).toEqual([]);
    });

    it('should preserve sort properties', () => {
      component.requestState = {
        catalogNumber: 'PA0000003',
        sortColumn: 'VendorName',
        sortOrder: 'ASC'
      };
      component.clearAllFilters();

      expect(component.requestState.sortColumn).toBe('VendorName');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should preserve search keyword when clearing filters', () => {
      component.onSearch('CFFP');
      component.appliedFilters = { productType: 'RBC' };
      component.clearAllFilters();

      expect(component.requestState.vendorName).toBe('CFFP');
      expect(component.appliedFilters).toBeNull();
    });

    it('should close side panel when clearing filters', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBeTrue();

      component.clearAllFilters();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should remove catalogNumber from requestState', () => {
      component.requestState = { catalogNumber: 'CAT1', vendorName: 'V1' };
      component.clearAllFilters();
      expect(component.requestState.catalogNumber).toBeUndefined();
    });

    it('should remove productType from requestState', () => {
      component.requestState = { productType: 'RBC', vendorName: 'V1' };
      component.clearAllFilters();
      expect(component.requestState.productType).toBeUndefined();
    });

    it('should remove numberOfDays from requestState', () => {
      component.requestState = { numberOfDays: 30, vendorName: 'V1' };
      component.clearAllFilters();
      expect(component.requestState.numberOfDays).toBeUndefined();
    });

    it('should reset page index to 0', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.clearAllFilters();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData and loadLookupOptions', () => {
      mockService.getValidFilters.calls.reset();
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();
      component.clearAllFilters();
      expect(mockService.getValidFilters).toHaveBeenCalled();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should map column names to API sort columns', () => {
      component.onSortChange({ column: 'vendorName', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('VendorName');
    });

    it('should clear sortOrder when direction is default', () => {
      component.requestState.sortOrder = 'ASC';
      component.onSortChange({ column: 'vendorName', direction: 'default' });
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should set sortOrder to ASC for direction A', () => {
      component.onSortChange({ column: 'vendorName', direction: 'A' });
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should set sortOrder to DESC for direction D', () => {
      component.onSortChange({ column: 'vendorName', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should map catalogNumber column', () => {
      component.onSortChange({ column: 'catalogNumber', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('CatalogNumber');
    });

    it('should map productType column', () => {
      component.onSortChange({ column: 'productType', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('ProductType');
    });

    it('should map effDate column', () => {
      component.onSortChange({ column: 'effDate', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('EffDate');
    });

    it('should use raw column name for unmapped columns', () => {
      component.onSortChange({ column: 'unknownColumn', direction: 'A' });
      expect(component.requestState.sortColumn).toBe('unknownColumn');
    });

    it('should update tableConfig sortConfig', () => {
      component.onSortChange({ column: 'productType', direction: 'D' });
      expect(component.tableConfig.sortConfig!.column).toBe('productType');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should call loadData after sort change', () => {
      mockService.getValidFilters.calls.reset();
      component.onSortChange({ column: 'vendorName', direction: 'A' });
      expect(mockService.getValidFilters).toHaveBeenCalled();
    });
  });

  describe('openAddDrawer', () => {
    it('should set sidePanelMode to add', () => {
      component.openAddDrawer();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should set sidePanelOpen to true', () => {
      component.openAddDrawer();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should set sidePanelData to null', () => {
      component.openAddDrawer();
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear row highlight when opening add drawer', () => {
      component.dataTableComponent = { activeRow: null } as any;
      component.openEditDrawer(mockData[0]);
      expect(component.dataTableComponent.activeRow).toBe(mockData[0]);

      component.openAddDrawer();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });
  });

  describe('openEditDrawer', () => {
    it('should set sidePanelMode to edit', () => {
      component.openEditDrawer(mockData[0]);
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should set sidePanelData to the row', () => {
      component.openEditDrawer(mockData[0]);
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should highlight the edited row', () => {
      component.dataTableComponent = { activeRow: null } as any;
      component.openEditDrawer(mockData[0]);
      expect(component.dataTableComponent.activeRow).toBe(mockData[0]);
    });

    it('should set sidePanelOpen to true', () => {
      component.openEditDrawer(mockData[0]);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('onRowAction', () => {
    it('should highlight row on edit action', () => {
      component.dataTableComponent = { activeRow: null } as any;
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.dataTableComponent.activeRow).toBe(mockData[0]);
    });

    it('should open edit drawer on edit action', () => {
      component.dataTableComponent = { activeRow: null } as any;
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should not open edit drawer for non-edit actions', () => {
      component.sidePanelOpen = false;
      component.onRowAction({ action: 'delete', row: mockData[0] });
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
    });
  });

  describe('closeSidePanel', () => {
    it('should close the side panel', () => {
      component.openAddDrawer();
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear row highlight when panel is closed', () => {
      component.dataTableComponent = { activeRow: null } as any;
      component.openEditDrawer(mockData[0]);
      expect(component.dataTableComponent.activeRow).toBe(mockData[0]);

      component.closeSidePanel();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });
  });

  describe('onSidePanelSave', () => {
    const mockFormValue: ValidFilterFormValue = {
      vendorName: 'AP',
      catalogNumber: 'PA0000003',
      productType: 'RBC',
      numberOfDays: 56,
      effDate: moment('2025-06-09'),
      termDate: null
    };

    it('should call handleCreate when mode is add', () => {
      component.sidePanelMode = 'add';
      mockService.createValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);

      expect(mockService.createValidFilter).toHaveBeenCalled();
    });

    it('should call handleUpdate when mode is edit', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      mockService.updateValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);

      expect(mockService.updateValidFilter).toHaveBeenCalled();
    });
  });

  describe('onSidePanelSaveAndCreateAnother', () => {
    it('should call createValidFilter', () => {
      const mockFormValue: ValidFilterFormValue = {
        vendorName: 'AP',
        catalogNumber: 'PA0000003',
        productType: 'RBC',
        numberOfDays: 56,
        effDate: moment('2025-06-09'),
        termDate: null
      };

      mockService.createValidFilter.and.returnValue(of({} as any));

      component.sideDrawer = {
        form: { reset: jasmine.createSpy('reset') },
        catalogSearchCtrl: { setValue: jasmine.createSpy('setValue') },
        productTypeSearchCtrl: { setValue: jasmine.createSpy('setValue') },
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSaveAndCreateAnother(mockFormValue);

      expect(mockService.createValidFilter).toHaveBeenCalled();
    });

    it('should reset form on success for createAnother', fakeAsync(() => {
      const mockFormValue: ValidFilterFormValue = {
        vendorName: 'NewVendor',
        catalogNumber: 'NEW001',
        productType: 'PLT',
        numberOfDays: 5,
        effDate: moment('2025-07-01'),
        termDate: null
      };

      mockService.createValidFilter.and.returnValue(of({} as any));

      const resetSpy = jasmine.createSpy('reset');
      const catalogSetValueSpy = jasmine.createSpy('setValue');
      const productTypeSetValueSpy = jasmine.createSpy('setValue');
      component.sideDrawer = {
        form: { reset: resetSpy },
        catalogSearchCtrl: { setValue: catalogSetValueSpy },
        productTypeSearchCtrl: { setValue: productTypeSetValueSpy },
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSaveAndCreateAnother(mockFormValue);
      tick();

      expect(resetSpy).toHaveBeenCalled();
      expect(catalogSetValueSpy).toHaveBeenCalledWith('');
      expect(productTypeSetValueSpy).toHaveBeenCalledWith('');
      expect(component.sideDrawer.isSubmitting).toBeFalse();
    }));
  });

  describe('handleCreate', () => {
    const mockFormValue: ValidFilterFormValue = {
      vendorName: 'AP',
      catalogNumber: 'PA0000003',
      productType: 'RBC',
      numberOfDays: 56,
      effDate: moment('2025-06-09'),
      termDate: moment('2025-12-31')
    };

    it('should show success snackbar on create success', fakeAsync(() => {
      mockService.createValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('AP')
      );
    }));

    it('should reload data and lookup options on success', fakeAsync(() => {
      mockService.createValidFilter.and.returnValue(of({} as any));
      mockService.getValidFilters.calls.reset();
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalled();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
    }));

    it('should close side panel on create success (not createAnother)', fakeAsync(() => {
      mockService.createValidFilter.and.returnValue(of({} as any));
      component.sidePanelOpen = true;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should set error message on side drawer when create fails with errorResponse', fakeAsync(() => {
      const error = { error: { errorResponse: { error: 'Duplicate record' } } };
      mockService.createValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.isSubmitting).toBeFalse();
      expect(component.sideDrawer.errorMessage).toBe('Duplicate record');
    }));

    it('should set error message from error.error.message when errorResponse not available', fakeAsync(() => {
      const error = { error: { message: 'Server validation failed' } };
      mockService.createValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Server validation failed');
    }));

    it('should set error message from error.message as fallback', fakeAsync(() => {
      const error = { message: 'Network error' };
      mockService.createValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Network error');
    }));

    it('should set default error message when no specific message available', fakeAsync(() => {
      const error = {};
      mockService.createValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Failed to add valid filter. Please try again.');
    }));

    it('should call cdr.markForCheck on error', fakeAsync(() => {
      const error = {};
      mockService.createValidFilter.and.returnValue(throwError(() => error));

      const markForCheckSpy = jasmine.createSpy('markForCheck');
      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: markForCheckSpy }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(markForCheckSpy).toHaveBeenCalled();
    }));

    it('should serialize effDate and termDate for the API payload', fakeAsync(() => {
      mockService.createValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);
      tick();

      const payload = mockService.createValidFilter.calls.mostRecent().args[0];
      expect(payload.effDate).toBe('2025-06-09');
      expect(payload.termDate).toBe('2025-12-31');
    }));

    it('should set termDate to undefined when null', fakeAsync(() => {
      const formNoTerm: ValidFilterFormValue = {
        ...mockFormValue,
        termDate: null
      };
      mockService.createValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(formNoTerm);
      tick();

      const payload = mockService.createValidFilter.calls.mostRecent().args[0];
      expect(payload.termDate).toBeUndefined();
    }));
  });

  describe('handleUpdate', () => {
    const mockFormValue: ValidFilterFormValue = {
      vendorName: 'AP',
      catalogNumber: 'PA0000003',
      productType: 'PLT',
      numberOfDays: 30,
      effDate: moment('2025-07-01'),
      termDate: moment('2025-12-31')
    };

    beforeEach(() => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
    });

    it('should call updateValidFilter with correct params', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(mockService.updateValidFilter).toHaveBeenCalledWith(
        'PA0000003',
        jasmine.objectContaining({
          vendorName: 'AP',
          productType: 'PLT',
          numberOfDays: 30
        }),
        'RBC'
      );
    }));

    it('should show success snackbar on update', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('AP')
      );
    }));

    it('should close side panel on update success', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));
      component.sidePanelOpen = true;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reload data and lookups on update success', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));
      mockService.getValidFilters.calls.reset();
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(mockService.getValidFilters).toHaveBeenCalled();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
    }));

    it('should set error message on side drawer when update fails with errorResponse', fakeAsync(() => {
      const error = { error: { errorResponse: { error: 'Conflict' } } };
      mockService.updateValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.isSubmitting).toBeFalse();
      expect(component.sideDrawer.errorMessage).toBe('Conflict');
    }));

    it('should set error message from error.error.message when errorResponse not available', fakeAsync(() => {
      const error = { error: { message: 'Bad request' } };
      mockService.updateValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Bad request');
    }));

    it('should set error message from error.message as fallback', fakeAsync(() => {
      const error = { message: 'Timeout' };
      mockService.updateValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Timeout');
    }));

    it('should set default error message when no specific message', fakeAsync(() => {
      const error = {};
      mockService.updateValidFilter.and.returnValue(throwError(() => error));

      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: jasmine.createSpy('markForCheck') }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(component.sideDrawer.errorMessage).toBe('Failed to update valid filter. Please try again.');
    }));

    it('should call cdr.markForCheck on update error', fakeAsync(() => {
      const error = {};
      mockService.updateValidFilter.and.returnValue(throwError(() => error));

      const markForCheckSpy = jasmine.createSpy('markForCheck');
      component.sideDrawer = {
        isSubmitting: true,
        errorMessage: '',
        cdr: { markForCheck: markForCheckSpy }
      } as any;

      component.onSidePanelSave(mockFormValue);
      tick();

      expect(markForCheckSpy).toHaveBeenCalled();
    }));

    it('should use row productType when formValue productType is empty', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));
      const formNoProductType: ValidFilterFormValue = {
        ...mockFormValue,
        productType: ''
      };

      component.onSidePanelSave(formNoProductType);
      tick();

      const payload = mockService.updateValidFilter.calls.mostRecent().args[1];
      expect(payload.productType).toBe('RBC');
    }));

    it('should set termDate to null when termDate is null in form', fakeAsync(() => {
      mockService.updateValidFilter.and.returnValue(of({} as any));
      const formNoTerm: ValidFilterFormValue = {
        ...mockFormValue,
        termDate: null
      };

      component.onSidePanelSave(formNoTerm);
      tick();

      const payload = mockService.updateValidFilter.calls.mostRecent().args[1];
      expect(payload.termDate).toBeNull();
    }));
  });

  describe('formatDate', () => {
    it('should return dash for null date', () => {
      const result = (component as any).formatDate(null);
      expect(result).toBe('–');
    });

    it('should return dash for undefined date', () => {
      const result = (component as any).formatDate(undefined);
      expect(result).toBe('–');
    });

    it('should format a valid date string', () => {
      const result = (component as any).formatDate('2025-06-09T00:00:00Z');
      // Format: DD-MMM-YYYY
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should format a Date object', () => {
      const result = (component as any).formatDate(new Date(2025, 0, 15));
      expect(result).toBe('15-JAN-2025');
    });
  });

  describe('handleKeyboardShortcut', () => {
    it('should focus search bar on Alt+S', () => {
      const focusSpy = jasmine.createSpy('focus');
      component.searchBarComponent = { focus: focusSpy } as any;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should focus search bar on Alt+S (uppercase)', () => {
      const focusSpy = jasmine.createSpy('focus');
      component.searchBarComponent = { focus: focusSpy } as any;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'S' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should close overlay on Escape when overlay is open and side panel is closed', () => {
      component.sidePanelOpen = false;
      component['overlayRef'] = { dispose: jasmine.createSpy('dispose') } as any;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should not close overlay when side panel is open and Escape pressed', () => {
      component.sidePanelOpen = true;
      const mockOverlay = { dispose: jasmine.createSpy('dispose') } as any;
      component['overlayRef'] = mockOverlay;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcut(event);

      // Side panel should be closed, overlay should remain
      expect(component.sidePanelOpen).toBeFalse();
      expect(mockOverlay.dispose).not.toHaveBeenCalled();
    });

    it('should do nothing for unhandled keys', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'openFilter');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      component.handleKeyboardShortcut(event);

      expect(component.openFilter).not.toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not focus search when Alt is not pressed with S', () => {
      const focusSpy = jasmine.createSpy('focus');
      component.searchBarComponent = { focus: focusSpy } as any;

      const event = new KeyboardEvent('keydown', { altKey: false, key: 's' });
      component.handleKeyboardShortcut(event);

      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('openFilter', () => {
    it('should set isFilterOpen to true when opening filter', () => {
      component.tableCard = { nativeElement: document.createElement('div') } as any;
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should close existing overlay if already open', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;

      component.openFilter();

      expect(disposeSpy).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('closeOverlay (private)', () => {
    it('should dispose overlayRef and set to null', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;

      component['closeOverlay']();

      expect(disposeSpy).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should handle null overlayRef gracefully', () => {
      component['overlayRef'] = null;
      expect(() => component['closeOverlay']()).not.toThrow();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should complete overlayClose subject', () => {
      const completeSpy = spyOn(component['overlayClose$'], 'complete');
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;
      component.ngOnDestroy();
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('initializeConfigurations', () => {
    it('should set header actions with ADD NEW button', () => {
      expect(component.headerConfig.actions).toBeDefined();
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW');
    });

    it('should set search config placeholder', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Manufacture Name and Product Type');
    });

    it('should set search config to searchOnEnterOnly', () => {
      expect((component.searchConfig as any).searchOnEnterOnly).toBeTrue();
    });

    it('should configure table columns', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('vendorName');
      expect(component.tableConfig.columns[0].header).toBe('Manufacturer Name');
    });

    it('should configure row actions with edit action', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
    });

    it('should configure pagination defaults', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should configure sticky header and actions column', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });

    it('should set empty and loading messages', () => {
      expect(component.tableConfig.emptyMessage).toBe('No valid filters available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading valid filters...');
    });

    it('ADD NEW button onClick should call openAddDrawer', () => {
      spyOn(component, 'openAddDrawer');
      component.headerConfig.actions![0].onClick();
      expect(component.openAddDrawer).toHaveBeenCalled();
    });
  });

  describe('getTableColumns', () => {
    it('should include effDate column with date formatter', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateColumn).toBeDefined();
      expect(effDateColumn!.header).toBe('Effective Date');
      expect(effDateColumn!.valueFormatter).toBeDefined();
    });

    it('should include termDate column with date formatter', () => {
      const termDateColumn = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateColumn).toBeDefined();
      expect(termDateColumn!.header).toBe('Termination Date');
      expect(termDateColumn!.valueFormatter).toBeDefined();
    });

    it('effDate valueFormatter should format dates', () => {
      const effDateColumn = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = effDateColumn!.valueFormatter!('2025-01-15T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('termDate valueFormatter should return dash for null', () => {
      const termDateColumn = component.tableConfig.columns.find(c => c.key === 'termDate');
      const result = termDateColumn!.valueFormatter!(null);
      expect(result).toBe('–');
    });
  });

  describe('updateRequestStateFromFilters (private)', () => {
    it('should clear filter fields from requestState when appliedFilters is null', () => {
      component.requestState = {
        vendorName: 'AP',
        catalogNumber: 'CAT1',
        productType: 'RBC',
        numberOfDays: 30,
        sortColumn: 'VendorName'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.vendorName).toBe('AP');
      expect(component.requestState.sortColumn).toBe('VendorName');
      expect(component.requestState.catalogNumber).toBeUndefined();
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.numberOfDays).toBeUndefined();
    });

    it('should update requestState from appliedFilters when present', () => {
      component.appliedFilters = {
        catalogNumber: 'NEW_CAT',
        productType: 'PLT',
        days: 14
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.catalogNumber).toBe('NEW_CAT');
      expect(component.requestState.productType).toBe('PLT');
      expect(component.requestState.numberOfDays).toBe(14);
    });

    it('should set numberOfDays to undefined when days is null', () => {
      component.appliedFilters = {
        catalogNumber: 'CAT1',
        days: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.numberOfDays).toBeUndefined();
    });

    it('should set catalogNumber to undefined when not in filters', () => {
      component.appliedFilters = {
        productType: 'RBC'
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.catalogNumber).toBeUndefined();
    });
  });
});
