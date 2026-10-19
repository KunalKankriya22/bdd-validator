import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EnterProductServiceCodesComponent } from './enter-product-service-codes.component';
import { EnterProductServiceCodesApiService } from './services/enter-product-service-codes-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { createMockHeaderService, createMockMatDialog, createMockPageHeaderService, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';

import {
  ProductServiceCodeDto,
  ProductCodeLOV,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ServiceCodeLOV
} from './models/enter-product-service-codes.model';

describe('EnterProductServiceCodesComponent', () => {
  let loggingServiceSpy: any;
  let menuServiceSpy: any;
  let headerServiceSpy: any;
  let apiServiceSpy: any;
  let component: EnterProductServiceCodesComponent;
  let fixture: ComponentFixture<EnterProductServiceCodesComponent>;
  let apiService: jasmine.SpyObj<EnterProductServiceCodesApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let headerService: any;
  let chapterChanged$: Subject<any>;

  const mockData: ProductServiceCodeDto[] = [
    {
      productCode: 'E0345',
      productDesc: 'RED BLOOD CELLS | AS3/450mL/refq | Open',
      productType: 'RBC',
      invProductType: 'RBC',
      outOfStateFlag: 'N',
      returnable: 'Y',
      stdPrice: 94.00,
      serviceCode: 'F04250'
    },
    {
      productCode: 'E0346',
      productDesc: 'RED BLOOD CELLS | AS3/350mL/refq | Open',
      productType: 'RBC',
      invProductType: 'RBC',
      outOfStateFlag: 'N',
      returnable: 'Y',
      stdPrice: 97.00,
      serviceCode: 'F04260'
    }
  ];

  const mockProductCodes: ProductCodeLOV[] = [
    { productCode: 'E0345', productDesc: 'RED BLOOD CELLS' },
    { productCode: 'E0346', productDesc: 'PLATELETS' }
  ];

  const mockInventoryTypes: InventoryProductTypeLOV[] = [
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productType: 'PLT', productTypeDesc: 'Platelets' }
  ];

  const mockProductionTypes: ProductionProductTypeLOV[] = [
    { productType: 'RBC' },
    { productType: 'PLT' }
  ];

  const mockServiceCodes: ServiceCodeLOV[] = [
    { serviceCode: 'F04250' },
    { serviceCode: 'F04260' }
  ];

  beforeEach(() => {
    chapterChanged$ = new Subject<any>();

    apiServiceSpy = jasmine.createSpyObj('EnterProductServiceCodesApiService', [
      'getProductServiceCodes',
      'getProductCodes',
      'getInventoryProductTypes',
      'getProductionProductTypes',
      'getServiceCodes',
      'updateProductServiceCode'
    ]);

    const snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const headerServiceSpy = jasmine.createSpyObj('HeaderService', ['getCurrentChapterTimezone']);
    headerServiceSpy.chapterChanged$ = chapterChanged$.asObservable();
    headerServiceSpy.chapterTimeZone = signal('America/Chicago');
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['pageHeaderData', 'getTitle']);
    const menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);

    // Setup menu service signal
    menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: EnterProductServiceCodesApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        Overlay
      ]
    })
    .overrideComponent(EnterProductServiceCodesComponent, {
      remove: {
        imports: [MatDialogModule]
      }
    });

    apiServiceSpy.getProductServiceCodes.calls.reset();
    apiServiceSpy.getProductCodes.calls.reset();
    apiServiceSpy.getInventoryProductTypes.calls.reset();
    apiServiceSpy.getProductionProductTypes.calls.reset();
    apiServiceSpy.getServiceCodes.calls.reset();
    apiServiceSpy.updateProductServiceCode.calls.reset();
    menuServiceSpy.getMenuItemsSignal.calls.reset();
    menuServiceSpy.findMenuItemByPath.calls.reset();
    loggingServiceSpy.error.calls.reset();
    menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

    apiService = TestBed.inject(EnterProductServiceCodesApiService) as jasmine.SpyObj<EnterProductServiceCodesApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    headerService = TestBed.inject(HeaderService);

    fixture = TestBed.createComponent(EnterProductServiceCodesComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    beforeEach(() => {
      // Setup default API responses
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
    });

    it('should extract LOV options from data', () => {
      component.ngOnInit();

      expect(component.productCodeOptions.length).toBeGreaterThan(0);
      expect(component.inventoryProductTypeOptions.length).toBeGreaterThan(0);
      expect(component.productionProductTypeOptions.length).toBeGreaterThan(0);
      expect(component.serviceCodeOptions.length).toBeGreaterThan(0);
    });

    it('should load product service codes on init', () => {
      component.ngOnInit();

      expect(apiService.getProductServiceCodes).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(2);
    });

    it('should handle error loading data', () => {
      apiService.getProductServiceCodes.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(snackbarService.showError).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: 100
      }));

      component.ngOnInit();
      apiService.getProductServiceCodes.calls.reset();
    });

    it('should calculate correct skip value for pagination', () => {
      component.onPageChange({ pageSize: 25, pageIndex: 2, previousPageIndex: 1 });

      // pageIndex 2 with pageSize 25 should skip 50 records
      expect(apiService.getProductServiceCodes).toHaveBeenCalledWith(
        jasmine.any(Object),
        25,
        50
      );
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));

      component.ngOnInit();
      apiService.getProductServiceCodes.calls.reset();
    });

    it('should reset to first page on sort', () => {
      component.tableConfig.pagination!.pageIndex = 2;

      component.onSortChange({ column: 'productCode', direction: 'A' });

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));

      component.ngOnInit();
      component.productCodeOptions = mockProductCodes;
      component.inventoryProductTypeOptions = mockInventoryTypes;
      component.productionProductTypeOptions = mockProductionTypes;
      component.serviceCodeOptions = mockServiceCodes;
      apiService.getProductServiceCodes.calls.reset();
    });

    it('should update filter chips when filters applied', () => {
      component['applyFilters']({ productCode: 'E0345' });

      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.appliedFilters?.productCode).toBe('E0345');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete without errors', () => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('applyClientFilters', () => {
    const extendedData: ProductServiceCodeDto[] = [
      {
        productCode: 'E0345',
        productDesc: 'RED BLOOD CELLS | AS3/450mL',
        productType: 'RBC',
        invProductType: 'RBC',
        outOfStateFlag: 'N',
        returnable: 'Y',
        stdPrice: 94.00,
        serviceCode: 'F04250'
      },
      {
        productCode: 'P0100',
        productDesc: 'PLATELETS | Standard',
        productType: 'PLT',
        invProductType: 'PLT',
        outOfStateFlag: 'Y',
        returnable: 'N',
        stdPrice: null,
        serviceCode: 'S00100'
      },
      {
        productCode: 'E0346',
        productDesc: 'RED BLOOD CELLS | AS3/350mL',
        productType: 'RBC',
        invProductType: 'RBC',
        outOfStateFlag: 'N',
        returnable: 'Y',
        stdPrice: 97.00,
        serviceCode: 'F04260'
      }
    ];

    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: extendedData,
        total: extendedData.length
      }));
      component.ngOnInit();
    });

    it('should filter by productCode', () => {
      component['appliedFilters'] = { productCode: 'E0345' };
      component['applyClientFilters']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].productCode).toBe('E0345');
    });

    it('should filter by invProductType', () => {
      component['appliedFilters'] = { invProductType: 'PLT' };
      component['applyClientFilters']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].invProductType).toBe('PLT');
    });

    it('should filter by productType', () => {
      component['appliedFilters'] = { productType: 'PLT' };
      component['applyClientFilters']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].productType).toBe('PLT');
    });

    it('should filter by serviceCode', () => {
      component['appliedFilters'] = { serviceCode: 'S00100' };
      component['applyClientFilters']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].serviceCode).toBe('S00100');
    });

    it('should update totalRecords to filtered length when filters active', () => {
      component['appliedFilters'] = { productType: 'RBC' };
      component['applyClientFilters']();
      expect(component.dataSource.length).toBe(2);
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    });
  });

  describe('onSearch', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
      apiService.getProductServiceCodes.calls.reset();
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
    });

    it('should set searchTerm and reset pageIndex to 0', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.onSearch('E0345');
      expect(component.searchTerm).toBe('E0345');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(apiService.getProductServiceCodes).toHaveBeenCalled();
    });

    it('should handle empty search term', () => {
      component.onSearch('');
      expect(component.searchTerm).toBe('');
      expect(apiService.getProductServiceCodes).toHaveBeenCalled();
    });
  });

  describe('onSortChange - direction cycling', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
      apiService.getProductServiceCodes.calls.reset();
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
    });

    it('should cycle from default to A', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productCode', direction: 'default' }
      };
      component.onSortChange({ column: 'productCode', direction: 'A' });
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should cycle from A to D', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productCode', direction: 'A' }
      };
      component.onSortChange({ column: 'productCode', direction: 'D' });
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should cycle from D to default', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'productCode', direction: 'D' }
      };
      component.onSortChange({ column: 'productCode', direction: 'default' });
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
    });

    it('should open side panel on edit row action', () => {
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should set sidePanelData and sidePanelOpen via editRecord', () => {
      component.editRecord(mockData[1]);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelData).toEqual(mockData[1]);
    });
  });

  describe('Side Panel', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
    });

    it('should reset sidePanelOpen and sidePanelData on closeSidePanel', () => {
      component.editRecord(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);

      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should call loadData on onSaveSuccess', () => {
      apiService.getProductServiceCodes.calls.reset();
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));

      component.onSaveSuccess();
      expect(apiService.getProductServiceCodes).toHaveBeenCalled();
    });

    it('should return to initial state after editRecord then closeSidePanel', () => {
      component.editRecord(mockData[0]);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelData).toEqual(mockData[0]);

      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Filter Chip Management', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
      component.productCodeOptions = mockProductCodes;
      component.inventoryProductTypeOptions = mockInventoryTypes;
      component.productionProductTypeOptions = mockProductionTypes;
      component.serviceCodeOptions = mockServiceCodes;
    });

    it('should remove specified filter key via onRemoveFilterChip', () => {
      component['applyFilters']({ productCode: 'E0345', productType: 'RBC' });
      expect(component.appliedFilters?.productCode).toBe('E0345');

      component.onRemoveFilterChip('productCode');
      expect(component.appliedFilters?.productCode).toBeUndefined();
      expect(component.appliedFilters?.productType).toBe('RBC');
    });

    it('should reset appliedFilters to empty on onClearAllFilters', () => {
      component['applyFilters']({ productCode: 'E0345', serviceCode: 'F04250' });
      expect(component.appliedFilters?.productCode).toBe('E0345');

      component.onClearAllFilters();
      expect(component.appliedFilters).toEqual({});
    });

    it('should clear filterChips array on onClearAllFilters', () => {
      component['applyFilters']({ productCode: 'E0345' });
      expect(component.filterChips.length).toBeGreaterThan(0);

      component.onClearAllFilters();
      expect(component.filterChips.length).toBe(0);
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
      component.ngOnInit();
      component['appliedFilters'] = { productCode: 'E0345' };
      component.filterChips = [{ label: 'Product Code: E0345', value: 'E0345', key: 'productCode' }];
      component.searchTerm = 'test';
      apiService.getProductServiceCodes.calls.reset();
      apiService.getProductServiceCodes.and.returnValue(of({
        data: mockData,
        total: mockData.length
      }));
    });

    it('should reset state on chapter change', () => {
      chapterChanged$.next({});

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.searchTerm).toBe('');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData after chapter change', () => {
      chapterChanged$.next({});
      expect(apiService.getProductServiceCodes).toHaveBeenCalled();
    });
  });

  describe('Column Formatters', () => {
    it('should format outOfStateFlag Y as Yes and N as No', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'outOfStateFlag');
      expect(column).toBeDefined();
      expect(column!.valueFormatter!('Y', { ...mockData[0], outOfStateFlag: 'Y' })).toBe('Yes');
      expect(column!.valueFormatter!('N', { ...mockData[0], outOfStateFlag: 'N' })).toBe('No');
    });

    it('should format returnable Y as Yes and N as No', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'returnable');
      expect(column).toBeDefined();
      expect(column!.valueFormatter!('Y', { ...mockData[0], returnable: 'Y' })).toBe('Yes');
      expect(column!.valueFormatter!('N', { ...mockData[0], returnable: 'N' })).toBe('No');
    });

    it('should format stdPrice null as dash and number as fixed decimal', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'stdPrice');
      expect(column).toBeDefined();
      expect(column!.valueFormatter!(null as any, { ...mockData[0], stdPrice: null })).toBe('-');
      expect(column!.valueFormatter!(94 as any, { ...mockData[0], stdPrice: 94.00 })).toBe('$94.00');
    });
  });

});
