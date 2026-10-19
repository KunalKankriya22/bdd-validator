import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InventoryProductTypesTable } from './inventory-product-types-table';
import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Overlay, OverlayRef, PositionStrategy, ScrollStrategy } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { InventoryProductTypeModel } from '../models/inventory-product-types.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentPortal } from '@angular/cdk/portal';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { TranslateService } from '@ngx-translate/core';
import { createMockTranslateService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('InventoryProductTypesTable', () => {
  let mockDialogRef: any;
  let mockMenuService: any;
  let component: InventoryProductTypesTable;
  let fixture: ComponentFixture<InventoryProductTypesTable>;
  let mockService: jasmine.SpyObj<InventoryProductTypesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockProductData: InventoryProductTypeModel[] = [
    {
      productType: 'RBC',
      shortName: 'Red Blood Cells',
      description: 'Red blood cells for transfusion',
      price: 250.00,
      lifeSpan: 42,
      lifeSpanInd: 'D',
      sortSequence: 1,
      productGrouping: 'RB',
      aboOnly: true,
      rhRequired: false,
      importAllowed: true,
      pooledProduct: false,
      specialInventory: false,
      tempMax: 6,
      tempMin: 1,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      modificationDate: '2024-02-15'
    },
    {
      productType: 'PLT',
      shortName: 'Platelets',
      description: 'Platelet concentrate',
      price: 450.00,
      lifeSpan: 5,
      lifeSpanInd: 'D',
      sortSequence: 2,
      productGrouping: 'PL',
      aboOnly: false,
      rhRequired: true,
      importAllowed: false,
      pooledProduct: true,
      specialInventory: true,
      tempMax: 24,
      tempMin: 20,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      modificationDate: '2024-02-15'
    }
  ];

  const mockApiResponse = {
    data: mockProductData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InventoryProductTypesService', [
      'getInventoryProductTypes',
      'getInventoryProductTypeFilters',
      'getInventoryProductTypeByCode',
      'updateInventoryProductType'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = createMockMatDialog();
    mockTranslateService = createMockTranslateService();
    // Create mock overlay with position and scroll strategies
    const mockPositionStrategy = jasmine.createSpyObj<PositionStrategy>('PositionStrategy', [
      'apply',
      'attach',
      'detach',
      'dispose'
    ]);
    const mockScrollStrategy = jasmine.createSpyObj<ScrollStrategy>('ScrollStrategy', [
      'enable',
      'disable',
      'attach'
    ]);

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    (mockOverlay.position as any) = jasmine.createSpy('position').and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({
          withPush: jasmine.createSpy('withPush').and.returnValue({
            withViewportMargin: jasmine.createSpy('withViewportMargin').and.returnValue({
              withFlexibleDimensions: jasmine.createSpy('withFlexibleDimensions').and.returnValue({
                withGrowAfterOpen: jasmine.createSpy('withGrowAfterOpen').and.returnValue(mockPositionStrategy)
              })
            })
          })
        })
      })
    });
    (mockOverlay.scrollStrategies as any) = {
      block: jasmine.createSpy('block').and.returnValue(mockScrollStrategy)
    };

    // Default service responses
    mockService.getInventoryProductTypes.and.returnValue(of(mockApiResponse));
    // Bug #4: Return correct product based on productType parameter
    mockService.getInventoryProductTypeByCode.and.callFake((productType: string) => {
      const product = mockProductData.find(p => p.productType === productType);
      return of(product || mockProductData[0]);
    });
    mockService.updateInventoryProductType.and.returnValue(of({ Success: true } as any));

    // Mock PageHeaderService and MenuService
    const mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: { value: undefined }
    });
    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath'], {
      getMenuItemsSignal: () => () => []
    });



      TestBed.configureTestingModule({
      imports: [InventoryProductTypesTable, HttpClientTestingModule],
      providers: [
        { provide: InventoryProductTypesService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: TranslateService, useValue: mockTranslateService },
        provideRouter([])
      ]
    });
      mockService.getInventoryProductTypes.and.returnValue(of(mockApiResponse));



      mockService.updateInventoryProductType.and.returnValue(of({ Success: true } as any));


    fixture = TestBed.createComponent(InventoryProductTypesTable);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize with default configuration values', () => {
      expect(component.tableConfig.pagination?.pageSize).toBeDefined();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.sortConfig?.column).toBe('shortName');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });



    it('should initialize selection state', () => {
      expect(component.selectedRows).toEqual([]);
      expect(component.selectedIds).toEqual(new Set());
      expect(component.isAllSelected).toBe(false);
      expect(component.isAllPagesSelected).toBe(false);
    });


    it('should set header configuration', () => {
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[1].label).toBe('');
      expect(component.headerConfig.actions).toBeDefined();
    });


  });

  describe('loadInventoryProductTypesData', () => {





    it('should pass pagination parameters correctly', () => {
      component.tableConfig.pagination!.pageIndex = 1;
      component.tableConfig.pagination!.pageSize = 50;
      component.loadInventoryProductTypesData();

      const skip = 1 * 50; // pageIndex * pageSize
      const take = 50;

      expect(mockService.getInventoryProductTypes).toHaveBeenCalledWith(
        take,
        skip,
        component.requestState
      );
    });

    it('should pass request state parameters', () => {
      component.requestState = {
        SearchKeyword: 'RBC',
        SortDirection: 'A'
      };
      component.loadInventoryProductTypesData();

      expect(mockService.getInventoryProductTypes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          SearchKeyword: 'RBC',
          SortDirection: 'A'
        })
      );
    });
  });
  describe('onSearch', () => {
    it('should update search text and reload data', () => {
      spyOn(component, 'loadInventoryProductTypesData');

      component.onSearch('test query');

      expect(component.searchText).toBe('test query');
      expect(component.requestState.SearchKeyword).toBe('test query');
      expect(component.loadInventoryProductTypesData).toHaveBeenCalled();
    });



    it('should handle empty search query', () => {
      spyOn(component, 'loadInventoryProductTypesData');

      component.onSearch('');

      expect(component.searchText).toBe('');
      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(component.loadInventoryProductTypesData).toHaveBeenCalled();
    });
  });

  describe('Filter Operations', () => {



    it('should update request state with filter values', () => {
      spyOn(component, 'loadInventoryProductTypesData');

      component.applyFilters({
        productGrouping: 'RB',
        specialInventory: true,
        priceRange: 'Over',
        price: 100,
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      });

      expect(component.requestState.ProductGrouping).toBe('RB');
      expect(component.requestState.SpecialInventory).toBe(true);
      expect(component.requestState.PriceRange).toBe('Over');
      expect(component.requestState.Price).toBe(100);
      expect(component.requestState.EffectiveDateFrom).toBe('2024-01-01');
    });


  });

  describe('Side Panel Operations', () => {


    it('should fetch latest data and open side panel in edit mode', fakeAsync(() => {
      component.editInventoryProductType(mockProductData[0]);

      expect(mockService.getInventoryProductTypeByCode).toHaveBeenCalledWith('RBC');

      tick();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockProductData[0]);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error when fetching record for edit', fakeAsync(() => {
      mockService.getInventoryProductTypeByCode.and.returnValue(
        throwError(() => new Error('Fetch error'))
      );

      component.editInventoryProductType(mockProductData[0]);

      tick();
      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('Failed to load data for product type RBC');
    }));






  });

  describe('Selection Management', () => {
    it('should update selected rows', () => {
      component.selectedRows = mockProductData;

      expect(component.selectedRows).toEqual(mockProductData);
    });



    it('should track selection count', () => {
      component.selectedRows = mockProductData;

      expect(component.selectedRows.length).toBe(2);
    });




  });
  describe('Date Formatting', () => {


    it('should pad single digit day', () => {
      const testDate = new Date('2024-01-05');
      const formatted = component['formatDateDisplay'](testDate);

      expect(formatted).toBe('05-JAN-2024');
    });

    it('should handle all months correctly', () => {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      months.forEach((month, index) => {
        const testDate = new Date(2024, index, 15);
        const formatted = component['formatDateDisplay'](testDate);
        expect(formatted).toContain(month);
      });
    });
  });

  describe('Filter Chip Operations', () => {


    it('should check if has active filters when filters exist', () => {
      component.appliedFilters = {
        productGrouping: 'RB',
        specialInventory: null,
        priceRange: null,
        price: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      const result = component.hasActiveFilters();

      expect(result).toBe(true);
    });

    it('should check if has active filters when no filters exist', () => {
      component.appliedFilters = null;

      const result = component.hasActiveFilters();

      expect(result).toBe(false);
    });
  });
  describe('Edge Cases', () => {


    it('should handle products with null values', () => {
      const productWithNulls = {
        ...mockProductData[0],
        price: null,
        lifeSpan: null,
        terminationDate: null
      };

      expect(() => component.selectedRows = [productWithNulls]).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full search and filter workflow', () => {
      spyOn(component, 'loadInventoryProductTypesData');

      // Search
      component.onSearch('RBC');
      expect(component.searchText).toBe('RBC');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);

      // Apply filters
      component.applyFilters({
        productGrouping: 'RB',
        specialInventory: null,
        priceRange: null,
        price: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      });
      expect(component.appliedFilters?.productGrouping).toEqual('RB');

      // Change page
      component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
      expect(component.tableConfig.pagination?.pageIndex).toBe(1);

      // Sort
      component.onSortChange({ column: 'price', direction: 'D' });
      expect(component.tableConfig.sortConfig?.column).toBe('price');
      expect(component.tableConfig.sortConfig?.direction).toBe('D');

      expect(component.loadInventoryProductTypesData).toHaveBeenCalledTimes(4);
    });

    it('should handle selection and bulk price update workflow', fakeAsync(() => {
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      const updatedProducts = mockProductData.map(p => ({ ...p, price: 300 }));
      mockDialogRef.afterClosed.and.returnValue(of(updatedProducts));
      mockDialog.open.and.returnValue(mockDialogRef);
      spyOn(component, 'loadInventoryProductTypesData');

      // Select products - Bug #4: Need to set both selectedRows and selectedIds
      component.selectedRows = mockProductData;
      component.selectedIds = new Set(['RBC', 'PLT']);
      expect(component.selectedRows.length).toBe(2);
      expect(component.isModifyPriceDisabled()).toBe(false);

      // Open modify price dialog
      component.modifyPrice();

      tick();
      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockService.updateInventoryProductType).toHaveBeenCalled();
    }));
  });
});
