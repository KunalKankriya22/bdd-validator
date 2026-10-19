import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import moment from 'moment';

import { ProductsInQuarantineComponent } from './products-in-quarantine.component';
import { ProductsInQuarantineApiService } from './services/products-in-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockPageHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ProductInQuarantineDto,
  QuarantineTypeDto,
  ProductsInQuarantineResponse,
  QuarantineTypesResponse,
} from './models/products-in-quarantine.model';

describe('ProductsInQuarantineComponent', () => {
  let pageHeaderSpy: any;
  let apiSpy: any;
  let component: ProductsInQuarantineComponent;
  let fixture: ComponentFixture<ProductsInQuarantineComponent>;
  let apiServiceSpy: jasmine.SpyObj<ProductsInQuarantineApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;

  const mockQuarantineTypes: QuarantineTypeDto[] = [
    { code: 'RT', description: 'Return Products' },
    { code: 'QU', description: 'Quarantine Products' },
    { code: 'QL', description: 'Quality Hold' },
  ];

  const mockQuarantineTypesResponse: QuarantineTypesResponse = {
    success: true,
    message: 'Successfully retrieved quarantine types',
    statusCode: 200,
    data: mockQuarantineTypes,
  };

  const mockProducts: ProductInQuarantineDto[] = [
    {
      unitId: 'W1234-56-01-010-7',
      checkDigit: '12',
      productCode: 'RDS001',
      aliquot: '01',
      aboDescription: 'A Positive',
      expirationDate: '2024-02-15T14:30:00Z',
      customer: 'Hopkins County Memorial Hospital',
      reasonCode: 'QDTR',
      reason: 'Quarantine Due to Recall',
      userId: 'JSMITH',
    },
    {
      unitId: 'W1234-56-01-010-8',
      checkDigit: '45',
      productCode: 'PLT002',
      aliquot: '00',
      aboDescription: 'O Negative',
      expirationDate: '2024-02-20T08:00:00Z',
      customer: null,
      reasonCode: 'QR05',
      reason: 'Quality control hold',
      userId: null,
    },
  ];

  const mockProductsResponse: ProductsInQuarantineResponse = {
    success: true,
    message: 'Successfully retrieved 2 products',
    statusCode: 200,
    data: mockProducts,
    totalCount: 2,
    pagination: { take: 500, skip: 0, hasMore: false },
  };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ProductsInQuarantineApiService', [
      'getQuarantineTypes',
      'getProducts',
    ]);
    const snackbarSpy = createMockSnackbarService();
    chapterChangedSubject = new Subject<void>();
    const headerSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    pageHeaderSpy = createMockPageHeaderService();

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal']);
    chapterTimezoneSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone().utcOffset(-300));

    apiSpy.getQuarantineTypes.and.returnValue(of(mockQuarantineTypesResponse));
    apiSpy.getProducts.and.returnValue(of(mockProductsResponse));
    pageHeaderSpy.getCurrentMenuItem.and.returnValue(null);
    pageHeaderSpy.getTitle.and.returnValue(undefined);
    pageHeaderSpy.getSubtitle.and.returnValue(undefined);

    TestBed.configureTestingModule({
      imports: [ProductsInQuarantineComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductsInQuarantineApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {} }, params: of({}), queryParams: of({}) },
        },
      ],
    });

    fixture = TestBed.createComponent(ProductsInQuarantineComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ProductsInQuarantineApiService) as jasmine.SpyObj<ProductsInQuarantineApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load quarantine types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getQuarantineTypes).toHaveBeenCalled();
      expect(component.quarantineTypes().length).toBe(3);
      expect(component.quarantineTypes()[0].code).toBe('RT');
    }));

    it('should set loadingTypes to false after types load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.loadingTypes()).toBeFalse();
    }));
  });

  describe('Quarantine Types Loading', () => {
    it('should handle error when loading quarantine types fails', fakeAsync(() => {
      apiServiceSpy.getQuarantineTypes.and.returnValue(throwError(() => new Error('Failed to load')));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.quarantineTypes().length).toBe(0);
    }));

    it('should handle unsuccessful response when loading quarantine types', fakeAsync(() => {
      const errorResponse: QuarantineTypesResponse = {
        success: false,
        message: 'No quarantine types available',
        statusCode: 500,
        data: [],
      };
      apiServiceSpy.getQuarantineTypes.and.returnValue(of(errorResponse));

      fixture.detectChanges();
      tick();

      expect(component.quarantineTypes().length).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No quarantine types available');
    }));

    it('should handle empty quarantine types response', fakeAsync(() => {
      const emptyResponse: QuarantineTypesResponse = {
        success: true, message: '', statusCode: 200, data: [],
      };
      apiServiceSpy.getQuarantineTypes.and.returnValue(of(emptyResponse));

      fixture.detectChanges();
      tick();

      expect(component.quarantineTypes().length).toBe(0);
    }));
  });

  describe('Quarantine Type Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should search products when quarantine type is selected', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      expect(apiServiceSpy.getProducts).toHaveBeenCalledWith({
        quarantineType: 'RT',
        take: 500,
        skip: 0,
      });
      expect(component.products().length).toBe(2);
      expect(component.totalProducts()).toBe(2);
    }));

    it('should update selectedQuarantineType signal', () => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      expect(component.selectedQuarantineType()).toBe('RT');
    });

    it('should clear results when quarantine type is set to null', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
      expect(component.products().length).toBe(2);

      component.quarantineTypeControl.setValue(null);
      component.onQuarantineTypeChange();
      expect(component.products().length).toBe(0);
      expect(component.selectedQuarantineType()).toBeNull();
    }));
  });

  describe('Products Loading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display products in table after successful load', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      expect(component.products().length).toBe(2);
      expect(component.filteredProducts().length).toBe(2);
      expect(component.totalProducts()).toBe(2);
    }));

    it('should handle empty products response', fakeAsync(() => {
      const emptyResponse: ProductsInQuarantineResponse = {
        success: true, message: 'No products found', statusCode: 200,
        data: [], totalCount: 0, pagination: { take: 500, skip: 0, hasMore: false },
      };
      apiServiceSpy.getProducts.and.returnValue(of(emptyResponse));

      component.quarantineTypeControl.setValue('QU');
      component.onQuarantineTypeChange();
      tick();

      expect(component.products().length).toBe(0);
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith(
        'No products found for the selected quarantine type.'
      );
    }));

    it('should handle error when loading products fails', fakeAsync(() => {
      apiServiceSpy.getProducts.and.returnValue(throwError(() => new Error('API Error')));

      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.products().length).toBe(0);
    }));

    it('should handle unsuccessful products response', fakeAsync(() => {
      const errorResponse: ProductsInQuarantineResponse = {
        success: false, message: 'Server error', statusCode: 500,
        data: [], totalCount: 0, pagination: { take: 500, skip: 0, hasMore: false },
      };
      apiServiceSpy.getProducts.and.returnValue(of(errorResponse));

      component.quarantineTypeControl.setValue('QU');
      component.onQuarantineTypeChange();
      tick();

      expect(component.products().length).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should set pagedProducts to first page slice', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      expect(component.pagedProducts().length).toBeLessThanOrEqual(25);
    }));
  });

  describe('Table Configuration', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show Customer column when quarantine type is RT', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      expect(component.isReturnProducts()).toBeTrue();
      const customerColumn = component.tableConfig.columns.find((col) => col.key === 'customer');
      expect(customerColumn).toBeDefined();
    }));

    it('should not show Customer column for non-RT quarantine types', fakeAsync(() => {
      component.quarantineTypeControl.setValue('QU');
      component.onQuarantineTypeChange();
      tick();

      expect(component.isReturnProducts()).toBeFalse();
      const customerColumn = component.tableConfig.columns.find((col) => col.key === 'customer');
      expect(customerColumn).toBeUndefined();
    }));

    it('should update Unit ID header with distinct count', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      expect(unitCol?.header).toContain('Unit ID');
      expect(unitCol?.header).toContain('(');
    }));

    it('should include userId column', fakeAsync(() => {
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      const userCol = component.tableConfig.columns.find(c => c.key === 'userId');
      expect(userCol).toBeDefined();
      expect(userCol?.header).toBe('User ID');
    }));
  });

  describe('Date Formatting with ChapterTimezoneService', () => {
    it('should call convertGmtToLocal for expiration date formatting', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        expirationColumn.valueFormatter('2024-02-15T14:30:00Z', mockProducts[0]);
        expect(chapterTimezoneSpy.convertGmtToLocal).toHaveBeenCalled();
      }
    }));

    it('should format date as DD-MON-YYYY HH:mm using chapter timezone', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();

      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        const formatted = expirationColumn.valueFormatter('2024-02-15T14:30:00Z', mockProducts[0]);
        expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
      }
    }));

    it('should handle null expiration date', () => {
      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        expect(expirationColumn.valueFormatter(null, mockProducts[0])).toBe('--');
      }
    });

    it('should handle undefined expiration date', () => {
      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        expect(expirationColumn.valueFormatter(undefined, mockProducts[0])).toBe('--');
      }
    });

    it('should handle invalid expiration date string', () => {
      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        expect(expirationColumn.valueFormatter('not-a-date', mockProducts[0])).toBe('--');
      }
    });

    it('should handle empty string expiration date', () => {
      const expirationColumn = component.tableConfig.columns.find(
        (col) => col.key === 'expirationDate'
      );
      if (expirationColumn?.valueFormatter) {
        expect(expirationColumn.valueFormatter('', mockProducts[0])).toBe('--');
      }
    });
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
    }));

    it('should sort ascending by unitId', () => {
      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.filteredProducts().length).toBe(2);
    });

    it('should sort descending by unitId', () => {
      component.onTableSortChange({ column: 'unitId', direction: 'D' });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should reset sort to default', () => {
      component.onTableSortChange({ column: 'productCode', direction: 'default' });
      expect(component.filteredProducts().length).toBe(2);
    });

    it('should reset page index when sorting', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should reset pagedProducts to first page after sort', () => {
      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      expect(component.pagedProducts().length).toBeLessThanOrEqual(25);
    });

    it('should handle date column sorting with valid dates', () => {
      component.onTableSortChange({ column: 'expirationDate', direction: 'A' });
      const sorted = component.filteredProducts();
      if (sorted.length >= 2 && sorted[0].expirationDate && sorted[1].expirationDate) {
        expect(new Date(sorted[0].expirationDate).getTime()).toBeLessThanOrEqual(
          new Date(sorted[1].expirationDate).getTime()
        );
      }
    });

    it('should handle date column sorting with null dates', () => {
      const productsWithNull = [
        { ...mockProducts[0], expirationDate: null },
        { ...mockProducts[1] },
      ];
      const response: ProductsInQuarantineResponse = {
        ...mockProductsResponse, data: productsWithNull,
      };
      apiServiceSpy.getProducts.and.returnValue(of(response));

      component.quarantineTypeControl.setValue('QU');
      component.onQuarantineTypeChange();

      component.onTableSortChange({ column: 'expirationDate', direction: 'A' });
      expect(component.filteredProducts().length).toBe(2);
    });
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
    }));

    it('should paginate to the correct page', () => {
      component.onTablePageChange({ pageIndex: 1, pageSize: 1, previousPageIndex: 0 });
      expect(component.tableConfig.pagination?.pageIndex).toBe(1);
      expect(component.pagedProducts().length).toBe(1);
    });

    it('should handle page size change', () => {
      component.onTablePageChange({ pageIndex: 0, pageSize: 10, previousPageIndex: 0 });
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
    });

    it('should handle pagination beyond data range', () => {
      component.onTablePageChange({ pageIndex: 100, pageSize: 25, previousPageIndex: 0 });
      expect(component.pagedProducts().length).toBe(0);
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
    }));

    it('should clear all filters and results', () => {
      component.onClear();
      expect(component.quarantineTypeControl.value).toBeNull();
      expect(component.selectedQuarantineType()).toBeNull();
      expect(component.products().length).toBe(0);
      expect(component.totalProducts()).toBe(0);
    });

    it('should reset pagination on clear', () => {
      component.onClear();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  describe('Empty States', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show empty state when no quarantine type selected', () => {
      expect(component.hasSearched()).toBeFalse();
      fixture.detectChanges();
      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('Select a quarantine type to begin.');
    });

    it('should compute showEmptyState correctly when searched with no results', fakeAsync(() => {
      const emptyResponse: ProductsInQuarantineResponse = {
        success: true, message: '', statusCode: 200, data: [],
        totalCount: 0, pagination: { take: 500, skip: 0, hasMore: false },
      };
      apiServiceSpy.getProducts.and.returnValue(of(emptyResponse));
      component.quarantineTypeControl.setValue('QU');
      component.onQuarantineTypeChange();
      tick();
      expect(component.showEmptyState()).toBeTrue();
    }));
  });

  describe('Chapter Change Subscription', () => {
    it('should clear all data and reload quarantine types on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
      expect(component.products().length).toBeGreaterThan(0);

      chapterChangedSubject.next();
      tick();

      expect(component.quarantineTypeControl.value).toBeNull();
      expect(component.products().length).toBe(0);
      expect(apiServiceSpy.getQuarantineTypes).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Computed Signals', () => {
    it('should compute isReturnProducts correctly', () => {
      component['selectedQuarantineType'].set('RT');
      expect(component.isReturnProducts()).toBeTrue();
      component['selectedQuarantineType'].set('QU');
      expect(component.isReturnProducts()).toBeFalse();
    });

    it('should compute hasSearched correctly', () => {
      expect(component.hasSearched()).toBeFalse();
      component['selectedQuarantineType'].set('RT');
      expect(component.hasSearched()).toBeTrue();
    });

    it('should compute distinctUnitIdCount correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.quarantineTypeControl.setValue('RT');
      component.onQuarantineTypeChange();
      tick();
      expect(component.distinctUnitIdCount()).toBe(2);
    }));

    it('should compute distinctUnitIdCount as 0 when no products', () => {
      expect(component.distinctUnitIdCount()).toBe(0);
    });
  });

  describe('Breadcrumbs', () => {
    it('should set breadcrumbs from menuItem label', fakeAsync(() => {
      pageHeaderSpy.getCurrentMenuItem.and.returnValue({ label: 'Quarantine Query' });
      const newFixture = TestBed.createComponent(ProductsInQuarantineComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();
      expect(newComponent.headerConfig.breadcrumbs?.[1]?.label).toBe('Quarantine Query');
    }));

    it('should use default breadcrumbs when menuItem is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.breadcrumbs?.[1]?.label).toBe('Products in Quarantine');
    }));
  });

  describe('Value formatters', () => {
    it('should format productCode with aliquot', () => {
      const productCol = component.tableConfig.columns.find(c => c.key === 'productCode');
      if (productCol?.valueFormatter) {
        expect(productCol.valueFormatter('RDS001', mockProducts[0])).toBe('RDS001/01');
      }
    });

    it('should format productCode without aliquot', () => {
      const productCol = component.tableConfig.columns.find(c => c.key === 'productCode');
      if (productCol?.valueFormatter) {
        const row = { ...mockProducts[0], aliquot: '' };
        expect(productCol.valueFormatter('RDS001', row)).toBe('RDS001');
      }
    });

    it('should format productCode with null aliquot', () => {
      const productCol = component.tableConfig.columns.find(c => c.key === 'productCode');
      if (productCol?.valueFormatter) {
        const row = { ...mockProducts[0], aliquot: null };
        expect(productCol.valueFormatter('RDS001', row)).toBe('RDS001');
      }
    });

    it('should format unitId with checkDigit', () => {
      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      if (unitCol?.valueFormatter) {
        expect(unitCol.valueFormatter('W1234', mockProducts[0])).toBe('W1234 (12)');
      }
    });

    it('should format unitId without checkDigit', () => {
      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      if (unitCol?.valueFormatter) {
        const row = { ...mockProducts[0], checkDigit: '' };
        expect(unitCol.valueFormatter('W1234', row)).toBe('W1234');
      }
    });

    it('should format unitId with null checkDigit', () => {
      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitId');
      if (unitCol?.valueFormatter) {
        const row = { ...mockProducts[0], checkDigit: null };
        expect(unitCol.valueFormatter('W1234', row)).toBe('W1234');
      }
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
