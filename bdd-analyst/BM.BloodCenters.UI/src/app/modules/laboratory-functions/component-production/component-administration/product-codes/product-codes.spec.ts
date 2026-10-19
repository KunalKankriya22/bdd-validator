import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ProductCodesComponent } from './product-codes';
import { ProductCodesService } from './services/product-codes.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import moment from 'moment';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

describe('ProductCodesComponent', () => {
  let serviceSpy: any;
  let component: ProductCodesComponent;
  let fixture: ComponentFixture<ProductCodesComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let router: Router;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductCodes',
      'getProductCodeById',
      'getProductTypes',
      'getProductClasses',
      'createProductCode',
      'updateProductCode',
      'deleteProductCode'
    ]);

    const mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Product Codes',
        subtitle: 'Manage product code definitions for blood components'
      })
    };



      TestBed.configureTestingModule({
      imports: [
        ProductCodesComponent,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        },
        provideRouter([])
      ]
    });


    


      serviceSpy.getProductCodes.calls.reset();


      serviceSpy.getProductCodeById.calls.reset();


      serviceSpy.getProductTypes.calls.reset();


      serviceSpy.getProductClasses.calls.reset();


      serviceSpy.createProductCode.calls.reset();


      serviceSpy.updateProductCode.calls.reset();


      serviceSpy.deleteProductCode.calls.reset();


    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    router = TestBed.inject(Router);

    // Setup default return values for lookups
    service.getProductTypes.and.returnValue(of([]));
    service.getProductClasses.and.returnValue(of([]));

    fixture = TestBed.createComponent(ProductCodesComponent);
    component = fixture.componentInstance;


    });


  it('should load products on init', () => {
    const mockResponse = {
      data: [
        {
          productCode: 'E0001',
          productType: 'RBC',
          productDesc: 'Red Blood Cells',
          productFormula: 'V0001023-V0012003-V0013003-V0014005',
          effDate: new Date('2025-01-01'),
          termDate: null
        }
      ],
      total: 1
    };

    service.getProductCodes.and.returnValue(of(mockResponse));

    fixture.detectChanges();

    expect(service.getProductCodes).toHaveBeenCalled();
    // Data is stored in dataSource, not data property
    expect(component.tableConfig.pagination?.totalRecords).toBe(1);
  });





  it('should handle sort', () => {
    const mockResponse = { data: [], total: 0 };
    service.getProductCodes.and.returnValue(of(mockResponse));

    const sortEvent = { column: 'productCode', direction: 'A' as const };
    component.onSortChange(sortEvent);

    expect(component.requestState.sortColumn).toBe('ProductCode');
    expect(component.requestState.sortOrder).toBe('ASC');
    expect(service.getProductCodes).toHaveBeenCalled();
  });

  describe('Date Filtering', () => {
    it('should apply effective date filter with "After" period', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After'
      };

      component.onApplyFilters(filters);

      expect(service.getProductCodes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          effectiveDate: '2024-01-01',
          effectivePeriod: 'After'
        })
      );
    });

    it('should apply effective date filter with "Before" period', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const filters = {
        effectiveDate: moment('2024-12-31'),
        effectiveDatePeriod: 'Before'
      };

      component.onApplyFilters(filters);

      expect(service.getProductCodes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          effectiveDate: '2024-12-31',
          effectivePeriod: 'Before'
        })
      );
    });

    it('should apply termination date filter with "Before" period', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const filters = {
        terminationDate: moment('2025-06-30'),
        terminationDatePeriod: 'Before'
      };

      component.onApplyFilters(filters);

      expect(service.getProductCodes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          terminationDate: '2025-06-30',
          terminationPeriod: 'Before'
        })
      );
    });

    it('should apply both effective and termination date filters', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const filters = {
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After',
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before'
      };

      component.onApplyFilters(filters);

      expect(service.getProductCodes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({
          effectiveDate: '2024-01-01',
          effectivePeriod: 'After',
          terminationDate: '2025-12-31',
          terminationPeriod: 'Before'
        })
      );
    });


  });

  describe('Error Handling', () => {
    it('should handle error when loading products fails', () => {
      const error = { error: { message: 'Database connection failed' } };
      service.getProductCodes.and.returnValue(throwError(() => error));

      spyOn(component as any, 'showError');

      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect((component as any).showError).toHaveBeenCalledWith('Failed to load product codes');
    });


  });

  describe('Filter Panel', () => {
    it('should apply product type filter', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const filters = { productType: 'RBC' };
      component.onApplyFilters(filters);

      expect(service.getProductCodes).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({ productType: 'RBC' })
      );
    });

    it('should clear all filters on reset', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      // Apply some filters first
      component.onApplyFilters({
        productType: 'RBC',
        effectiveDate: moment('2024-01-01'),
        effectiveDatePeriod: 'After'
      });

      // Reset filters by calling onApplyFilters with empty object
      component.onApplyFilters({});

      expect(component.requestState.productType).toBeUndefined();
      expect(service.getProductCodes).toHaveBeenCalled();
    });
  });
  describe('Data Formatting', () => {




    it('should handle undefined dates', () => {
      const formatted = (component as any).formatDate(undefined);
      expect(formatted).toBe('-');
    });

    it('should format a valid date correctly', () => {
      const formatted = (component as any).formatDate('2024-03-15');
      expect(formatted).toBe('15-MAR-2024');
    });
  });

  describe('onPageChange', () => {
    it('should update pageSize and pageIndex and call loadData', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      const pageEvent = { pageIndex: 2, pageSize: 50, previousPageIndex: 1 };
      component.onPageChange(pageEvent);

      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(service.getProductCodes).toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    const mockProduct = {
      productCode: 'E0001',
      productType: 'RBC',
      productDesc: 'Red Blood Cells',
      productFormula: 'V0001023',
      effDate: new Date('2025-01-01'),
      termDate: null
    };

    it('should call onEditProduct and open side panel for edit action', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'edit', row: mockProduct });

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockProduct);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should navigate to view page for view action', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));
      spyOn(router, 'navigate');

      component.dataTableComponent = { activeRow: null } as any;

      component.onRowAction({ action: 'view', row: mockProduct });

      expect(router.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/product-codes',
        'E0001'
      ]);
    });
  });

  describe('onAddProduct', () => {
    it('should set sidePanelMode to add, clear data, and open panel', () => {
      component.onAddProduct();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('onEditProduct', () => {
    it('should set sidePanelMode to edit with product data and open panel', () => {
      const mockProduct = {
        productCode: 'E0001',
        productType: 'RBC',
        productDesc: 'Red Blood Cells'
      };

      component.onEditProduct(mockProduct as any);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockProduct as any);
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('onViewProduct', () => {
    it('should navigate to the product view page', () => {
      spyOn(router, 'navigate');
      const mockProduct = { productCode: 'P0042' } as any;

      component.onViewProduct(mockProduct);

      expect(router.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/product-codes',
        'P0042'
      ]);
    });
  });

  describe('onDialogClosed', () => {
    it('should reload data and show success snackbar when success is true', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      spyOn(component as any, 'showSuccess');

      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onDialogClosed({ success: true });

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect((component as any).showSuccess).toHaveBeenCalledWith('Product code created successfully');
      expect(service.getProductCodes).toHaveBeenCalled();
    });

    it('should show update message when sidePanelMode is edit and success is true', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      spyOn(component as any, 'showSuccess');

      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;

      component.onDialogClosed({ success: true });

      expect((component as any).showSuccess).toHaveBeenCalledWith('Product code updated successfully');
    });

    it('should just close panel when success is false', () => {
      component.sidePanelOpen = true;
      const callCountBefore = service.getProductCodes.calls.count();

      component.onDialogClosed({ success: false });

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(service.getProductCodes.calls.count()).toBe(callCountBefore);
    });
  });

  describe('toggleFilter', () => {
    it('should toggle isFilterOpen from false to true', () => {
      component.isFilterOpen = false;
      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);
    });

    it('should toggle isFilterOpen from true to false', () => {
      component.isFilterOpen = true;
      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should remove a specific filter chip and re-apply filters', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.appliedFilters = {
        productType: 'RBC',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };
      component.filterChips = [{ key: 'productType', label: 'Product Type: RBC', value: 'RBC', removable: true }];

      component.onRemoveFilterChip('productType');

      expect(service.getProductCodes).toHaveBeenCalled();
    });
  });

  describe('onClearAllFilters', () => {
    it('should clear all filters, reset chips, and reload data', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.appliedFilters = { productType: 'RBC' };
      component.filterChips = [{ key: 'productType', label: 'Product Type: RBC', value: 'RBC', removable: true }];
      component.requestState = { searchKeyword: 'test', productType: 'RBC' };

      component.onClearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.productType).toBeUndefined();
      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getProductCodes).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should clear sort params when direction is default', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.onSortChange({ column: 'productCode', direction: 'default' });

      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
      expect(service.getProductCodes).toHaveBeenCalled();
    });

    it('should set DESC sort order when direction is D', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.onSortChange({ column: 'productCode', direction: 'D' });

      expect(component.requestState.sortColumn).toBe('ProductCode');
      expect(component.requestState.sortOrder).toBe('DESC');
      expect(service.getProductCodes).toHaveBeenCalled();
    });

    it('should ignore sort change on non-productCode column', () => {
      const callCountBefore = service.getProductCodes.calls.count();

      component.onSortChange({ column: 'productType', direction: 'A' });

      expect(service.getProductCodes.calls.count()).toBe(callCountBefore);
    });
  });

  describe('onSearch', () => {
    it('should set searchKeyword, reset page index, and reload data', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.onSearch('RBC');

      expect(component.searchText).toBe('RBC');
      expect(component.requestState.searchKeyword).toBe('RBC');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(service.getProductCodes).toHaveBeenCalled();
    });

    it('should clear searchKeyword when empty string is passed', () => {
      const mockResponse = { data: [], total: 0 };
      service.getProductCodes.and.returnValue(of(mockResponse));

      component.onSearch('');

      expect(component.searchText).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
    });
  });

  describe('isSearchAndFilterDisabled', () => {
    it('should return true when data has not been loaded yet', () => {
      component.hasLoadedData = false;
      expect(component.isSearchAndFilterDisabled).toBe(true);
    });

    it('should return false when data has been loaded', () => {
      component.hasLoadedData = true;
      expect(component.isSearchAndFilterDisabled).toBe(false);
    });
  });
});
