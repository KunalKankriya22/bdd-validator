import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule } from '@ngx-translate/core';
import { Overlay } from '@angular/cdk/overlay';

import { CustomerProductTierPricingQueryComponent } from './customer-product-tier-pricing-query';
import { CustomerProductTierPricingApiService } from './services/customer-product-tier-pricing-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  CustomerProductSummaryDto,
  CustomerProductTierPricingDto,
} from './models/customer-product-tier-pricing.model';

describe('CustomerProductTierPricingQueryComponent', () => {
  let overlayMockSpy: any;
  let scrollStrategySpy: any;
  let apiSpy: any;
  let component: CustomerProductTierPricingQueryComponent;
  let fixture: ComponentFixture<CustomerProductTierPricingQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerProductTierPricingApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let overlaySpy: jasmine.SpyObj<Overlay>;

  const mockMasterData: CustomerProductSummaryDto[] = [
    {
      customerId: 'CUST001',
      shortName: 'Test Hospital',
      productType: 'RBC',
      productTypeDesc: 'Red Blood Cells',
      lifespan: 35,
      lifespanInd: 'Days',
      stdPrice: 150.0,
    },
    {
      customerId: 'CUST002',
      shortName: 'Memorial Hospital',
      productType: 'PLT',
      productTypeDesc: 'Platelets',
      lifespan: 5,
      lifespanInd: 'Days',
      stdPrice: 200.0,
    },
  ];

  const mockTierData: CustomerProductTierPricingDto[] = [
    {
      customerId: 'CUST001',
      chapterId: 'ALL',
      productType: 'RBC',
      tier: 1,
      fromDay: 0,
      toDay: 35,
      unitPrice: 150.0,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      shortName: 'Test Hospital',
      productTypeDesc: 'Red Blood Cells',
      lifespan: 35,
      lifespanInd: 'Days',
      stdPrice: 150.0,
    },
    {
      customerId: 'CUST001',
      chapterId: 'ALL',
      productType: 'RBC',
      tier: 2,
      fromDay: 36,
      toDay: 42,
      unitPrice: 125.0,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      shortName: 'Test Hospital',
      productTypeDesc: 'Red Blood Cells',
      lifespan: 35,
      lifespanInd: 'Days',
      stdPrice: 150.0,
    },
  ];

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('CustomerProductTierPricingApiService', [
      'getCustomerProductSummaries',
      'getTiersByCustomerAndProduct',
    ]);
    const headerSpy = createMockHeaderService();
    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Customer Product Tier Pricing Query',
        subtitle: 'View customer-specific pricing for inventory product types that differ from standard prices.',
      }),
    });
    const snackbarSpy = createMockSnackbarService();
    scrollStrategySpy = jasmine.createSpyObj('ScrollStrategy', ['enable', 'disable', 'attach']);
    overlayMockSpy = jasmine.createSpyObj('Overlay', ['position', 'create'], {
      scrollStrategies: {
        block: () => scrollStrategySpy
      }
    });

    apiSpy.getCustomerProductSummaries.and.returnValue(
      of({ data: mockMasterData, total: 2 })
    );
    apiSpy.getTiersByCustomerAndProduct.and.returnValue(of(mockTierData));



      TestBed.configureTestingModule({
      imports: [CustomerProductTierPricingQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CustomerProductTierPricingApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: Overlay, useValue: overlayMockSpy },
      ],
    });

      apiSpy.getTiersByCustomerAndProduct.and.returnValue(of(mockTierData));


    fixture = TestBed.createComponent(CustomerProductTierPricingQueryComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(CustomerProductTierPricingApiService) as jasmine.SpyObj<CustomerProductTierPricingApiService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    overlaySpy = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;


    });

  describe('Initialization', () => {


    it('should initialize with default configuration', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.searchConfig).toBeDefined();
      expect(component.masterTableConfig).toBeDefined();
      expect(component.tierTableConfig).toBeDefined();
    });

    it('should load master data on init when chapterId is available', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getCustomerProductSummaries).toHaveBeenCalled();
      expect(component.masterData().length).toBe(2);
    }));
  });

  describe('Master Data Loading', () => {
    it('should load master data successfully', fakeAsync(() => {
      component.loadMasterData();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.masterData().length).toBe(2);
      expect(component.masterData()[0].customerId).toBe('CUST001');
    }));

    it('should handle master data load error', fakeAsync(() => {
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadMasterData();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.masterData().length).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should extract unique customer options and product type options with names', fakeAsync(() => {
      component.loadMasterData();
      tick();

      expect(component.customerOptions.map(o => o.id)).toContain('CUST001');
      expect(component.customerOptions.map(o => o.id)).toContain('CUST002');
      expect(component.customerOptions.find(o => o.id === 'CUST001')?.name).toBe('Test Hospital');
      expect(component.productTypeOptions.map(o => o.code)).toContain('RBC');
      expect(component.productTypeOptions.map(o => o.code)).toContain('PLT');
      expect(component.productTypeOptions.find(o => o.code === 'RBC')?.desc).toBe('Red Blood Cells');
    }));

    it('should set totalRecords to server total when no search term is active', fakeAsync(() => {
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(
        of({ data: mockMasterData, total: 50 })
      );

      component.searchTerm.set('');
      component.loadMasterData();
      tick();

      expect(component.masterTableConfig.pagination!.totalRecords).toBe(50);
    }));

    it('should set totalRecords to filtered count when search term is active', fakeAsync(() => {
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(
        of({ data: mockMasterData, total: 50 })
      );

      // Only 'CUST001' matches 'cust001'
      component.searchTerm.set('cust001');
      component.loadMasterData();
      tick();

      expect(component.masterData().length).toBe(1);
      expect(component.masterTableConfig.pagination!.totalRecords).toBe(1);
    }));
  });
  describe('Row Selection and Tier Details', () => {
    it('should select row and load tier details on row click', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const row = mockMasterData[0];
      component.onRowClick(row);
      tick();

      expect(component.selectedRow()).toEqual(row);
      expect(apiServiceSpy.getTiersByCustomerAndProduct).toHaveBeenCalledWith(
        'CUST001',
        'RBC'
      );
      expect(component.tierData().length).toBe(2);
    }));

    it('should handle tier details load error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      apiServiceSpy.getTiersByCustomerAndProduct.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      const row = mockMasterData[0];
      component.onRowClick(row);
      tick();

      expect(component.tierLoading()).toBe(false);
      expect(component.tierData().length).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Filter Panel', () => {
    it('should toggle filter panel state', () => {
      // Test initial state
      expect(component.filterPanelOpen).toBe(false);

      // Set to open
      component.filterPanelOpen = true;
      expect(component.filterPanelOpen).toBe(true);

      // Close using method
      component.closeFilterPanel();
      expect(component.filterPanelOpen).toBe(false);
    });




  });

  describe('Computed Signals', () => {
    it('should compute hasMasterData correctly', () => {
      component.masterData.set([]);
      expect(component.hasMasterData()).toBe(false);

      component.masterData.set(mockMasterData);
      expect(component.hasMasterData()).toBe(true);
    });

    it('should compute hasTierData correctly', () => {
      component.tierData.set([]);
      expect(component.hasTierData()).toBe(false);

      component.tierData.set(mockTierData);
      expect(component.hasTierData()).toBe(true);
    });

    it('should compute hasSelectedRow correctly', () => {
      component.selectedRow.set(null);
      expect(component.hasSelectedRow()).toBe(false);

      component.selectedRow.set(mockMasterData[0]);
      expect(component.hasSelectedRow()).toBe(true);
    });
  });

  describe('Data Formatting', () => {
    it('should format currency correctly', () => {
      expect((component as any).formatCurrency(150.0)).toBe('$150.00');
    });

    it('should return dash when currency value is null', () => {
      expect((component as any).formatCurrency(null)).toBe('-');
    });

    it('should return dash when currency value is undefined', () => {
      expect((component as any).formatCurrency(undefined)).toBe('-');
    });

    it('should format lifespan correctly', () => {
      expect((component as any).formatLifespan(mockMasterData[0])).toBe('35 Days');
    });

    it('should return dash when lifespan is null', () => {
      expect((component as any).formatLifespan({ lifespan: null, lifespanInd: 'Days' })).toBe('-');
    });

    it('should return dash when lifespan is undefined', () => {
      expect((component as any).formatLifespan({ lifespan: undefined, lifespanInd: 'Days' })).toBe('-');
    });

    it('should use empty string when lifespanInd is null', () => {
      expect((component as any).formatLifespan({ lifespan: 35, lifespanInd: null })).toBe('35 ');
    });

    it('should format age correctly', () => {
      expect((component as any).formatAge(35, 'Days')).toBe('35 Days');
    });

    it('should return dash when age value is null', () => {
      expect((component as any).formatAge(null, 'Days')).toBe('-');
    });

    it('should return dash when age value is undefined', () => {
      expect((component as any).formatAge(undefined, 'Days')).toBe('-');
    });

    it('should use Days as default unit when unit is null', () => {
      expect((component as any).formatAge(5, null)).toBe('5 Days');
    });
  });

  describe('Search', () => {
    it('should set search term, reset page, and reload on onSearch', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const countBefore = apiServiceSpy.getCustomerProductSummaries.calls.count();
      component.onSearch('hospital');
      tick();
      expect(component.searchTerm()).toBe('hospital');
      expect(component.masterTableConfig.pagination!.pageIndex).toBe(0);
      expect(apiServiceSpy.getCustomerProductSummaries.calls.count()).toBeGreaterThan(countBefore);
    }));

    it('should filter by shortName when search matches', fakeAsync(() => {
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(of({ data: mockMasterData, total: 2 }));
      component.searchTerm.set('memorial');
      component.loadMasterData();
      tick();
      expect(component.masterData().length).toBe(1);
      expect(component.masterData()[0].customerId).toBe('CUST002');
    }));

    it('should filter by productType when search matches', fakeAsync(() => {
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(of({ data: mockMasterData, total: 2 }));
      component.searchTerm.set('plt');
      component.loadMasterData();
      tick();
      expect(component.masterData().length).toBe(1);
      expect(component.masterData()[0].productType).toBe('PLT');
    }));
  });

  describe('Filter Operations', () => {
    it('should set filters, update chips, and reload on onFilterApply', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const countBefore = apiServiceSpy.getCustomerProductSummaries.calls.count();
      component.onFilterApply({ customerId: 'CUST001', productType: null });
      tick();
      expect(component.filters()).toEqual({ customerId: 'CUST001', productType: null });
      expect(apiServiceSpy.getCustomerProductSummaries.calls.count()).toBeGreaterThan(countBefore);
    }));

    it('should remove chip and reload on onRemoveFilterChip', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filters.set({ customerId: 'CUST001', productType: 'RBC' });
      const countBefore = apiServiceSpy.getCustomerProductSummaries.calls.count();
      component.onRemoveFilterChip('customerId');
      tick();
      expect(apiServiceSpy.getCustomerProductSummaries.calls.count()).toBeGreaterThan(countBefore);
    }));

    it('should clear all filters and chips on onClearAllFilters', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filters.set({ customerId: 'CUST001', productType: 'RBC' });
      component.filterChips = [{ key: 'customerId', label: 'Customer ID: CUST001', value: 'CUST001' }];
      component.onClearAllFilters();
      tick();
      expect(component.filters()).toBeNull();
      expect(component.filterChips.length).toBe(0);
    }));

    it('should not update filter options when filters are active', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const initialOptions = [...component.customerOptions];
      component.filters.set({ customerId: 'CUST001', productType: null });
      component.loadMasterData();
      tick();
      expect(component.customerOptions).toEqual(initialOptions);
    }));

    it('hasActiveFilters should return false when filters is null', () => {
      component.filters.set(null);
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('hasActiveFilters should return true when customerId filter is set', () => {
      component.filters.set({ customerId: 'CUST001', productType: null });
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should update pageIndex and pageSize then reload on onPageChange', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      tick();
      expect(component.masterTableConfig.pagination!.pageIndex).toBe(2);
      expect(component.masterTableConfig.pagination!.pageSize).toBe(50);
    }));
  });

  describe('Selected Row Cleared on Filter', () => {
    it('should clear selectedRow and tierData when selection no longer in filtered results', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedRow.set(mockMasterData[0]);
      component.tierData.set(mockTierData);
      apiServiceSpy.getCustomerProductSummaries.and.returnValue(of({ data: [mockMasterData[1]], total: 1 }));
      component.loadMasterData();
      tick();
      expect(component.selectedRow()).toBeNull();
      expect(component.tierData().length).toBe(0);
    }));

    it('should keep selectedRow when it still exists after filter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedRow.set(mockMasterData[0]);
      component.tierData.set(mockTierData);
      // Both rows still returned — selection preserved
      component.loadMasterData();
      tick();
      expect(component.selectedRow()).toEqual(mockMasterData[0]);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const spy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if open on ngOnDestroy', () => {
      fixture.detectChanges();
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.ngOnDestroy();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });
  });

  describe('openFilterPanel — toggle off', () => {
    it('should close panel when overlayRef already exists', () => {
      fixture.detectChanges();
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.filterPanelOpen = true;
      component.openFilterPanel();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.filterPanelOpen).toBe(false);
    });
  });

  describe('closeFilterPanel', () => {
    it('should dispose overlayRef and reset filterPanelOpen', () => {
      fixture.detectChanges();
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.filterPanelOpen = true;
      component.closeFilterPanel();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.filterPanelOpen).toBe(false);
    });

    it('should handle closeFilterPanel when overlayRef is null', () => {
      fixture.detectChanges();
      (component as any).overlayRef = null;
      expect(() => component.closeFilterPanel()).not.toThrow();
      expect(component.filterPanelOpen).toBe(false);
    });
  });
});
