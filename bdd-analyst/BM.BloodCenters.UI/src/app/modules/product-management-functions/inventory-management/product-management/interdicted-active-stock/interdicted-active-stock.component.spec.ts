import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

import { InterdictedActiveStockComponent } from './interdicted-active-stock.component';
import { InterdictedActiveStockService } from './services/interdicted-active-stock.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import {
  InterdictedProduct,
  InventoryClassOption,
  ProductTypeOption
} from './models/interdicted-active-stock.model';

const mockInventoryClasses: InventoryClassOption[] = [
  { code: 'REG', description: 'Regular' },
  { code: 'AUTO', description: 'Autologous' }
];

const mockProductTypes: ProductTypeOption[] = [
  { productType: 'RBC', description: 'Red Blood Cells' },
  { productType: 'PLT', description: 'Platelets' }
];

const mockProduct1: InterdictedProduct = {
  unitId: 'W1234-18-031310-Z',
  collDate: '2024-01-01',
  chapterId: 'CH01',
  productType: 'RBC',
  productCode: 'E0701V00',
  inventoryClass: 'Regular',
  bloodType: 'O+',
  aliquot: '01',
  locationId: 'Hopkins',
  stockState: 'Available',
  aboRh: 'O Positive',
  interdictions: [{ interCode: 'IATR', interDesc: 'IAT Rpt. POS Needs Confirmation' }]
};

const mockProduct2: InterdictedProduct = {
  unitId: 'W1234-18-031309-Z',
  collDate: '2024-01-01',
  chapterId: 'CH01',
  productType: 'RBC',
  productCode: 'E0701V01',
  inventoryClass: 'Regular',
  bloodType: 'O-',
  aliquot: '01',
  locationId: 'RMC',
  stockState: 'Available',
  aboRh: 'O Negative',
  interdictions: [{ interCode: 'PANP', interDesc: 'Panel Positive' }]
};

// data must be a flat array; total is a top-level field (matches component parsing)
const mockProductsResponse = {
  success: true, message: null, statusCode: 200,
  data: [mockProduct1, mockProduct2],
  total: 2
};

const mockClassResponse = {
  success: true, message: null, statusCode: 200,
  data: mockInventoryClasses
};

const mockTypeResponse = {
  success: true, message: null, statusCode: 200,
  data: mockProductTypes
};

describe('InterdictedActiveStockComponent', () => {
  let scrollStrategyMock: any;
  let positionStrategyMock: any;
  let fakePortalRef: any;
  let component: InterdictedActiveStockComponent;
  let fixture: ComponentFixture<InterdictedActiveStockComponent>;
  let serviceSpy: jasmine.SpyObj<InterdictedActiveStockService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);
    mockLiveAnnouncer.announce.and.returnValue(Promise.resolve());

    serviceSpy = jasmine.createSpyObj('InterdictedActiveStockService', [
      'getInventoryClasses', 'getProductTypes', 'getInterdictedProducts'
    ]);
    serviceSpy.getInventoryClasses.and.returnValue(of(mockClassResponse as any));
    serviceSpy.getProductTypes.and.returnValue(of(mockTypeResponse as any));
    serviceSpy.getInterdictedProducts.and.returnValue(of(mockProductsResponse as any));

    mockPageHeaderService = {
      pageHeaderData: signal(null),
      getTitle: () => undefined,
      getSubtitle: () => undefined,
      getCurrentMenuItem: () => undefined,
    } as any;

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', [
      'attach', 'dispose', 'backdropClick'
    ]);
    mockOverlayRef.backdropClick.and.returnValue(of(new MouseEvent('click')));
    fakePortalRef = {
      instance: {
        currentFilters: null,
        inventoryClasses: [],
        productTypes: [],
        apply: { pipe: () => ({ subscribe: (fn: any) => ({ unsubscribe: () => {} }) }) },
        close: { pipe: () => ({ subscribe: (fn: any) => ({ unsubscribe: () => {} }) }) }
      }
    };
    mockOverlayRef.attach.and.returnValue(fakePortalRef as any);

    positionStrategyMock = { withPositions: () => positionStrategyMock, withPush: () => positionStrategyMock };
    scrollStrategyMock = { block: () => ({}) };
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    (mockOverlay as any).scrollStrategies = scrollStrategyMock;
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: () => positionStrategyMock
    } as any);
    mockOverlay.create.and.returnValue(mockOverlayRef);

    TestBed.configureTestingModule({
      imports: [InterdictedActiveStockComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: InterdictedActiveStockService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: Overlay, useValue: mockOverlay },
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
        provideRouter([])
      ]
    });
  });



  beforeEach(() => {
    fixture = TestBed.createComponent(InterdictedActiveStockComponent);
    component = fixture.componentInstance;
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  describe('Initialization', () => {



    it('should load products on init after dropdowns are loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('', '', 25, 0, 'A', '');
    }));

    it('should populate inventoryClasses after init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.inventoryClasses.length).toBe(2);
    }));

    it('should populate productTypes after init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.productTypes.length).toBe(2);
    }));

    it('should populate dataSource with products from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.dataSource.length).toBe(2);
    }));

  });

  // ── Filter panel ──────────────────────────────────────────────────────────

  describe('Filter panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set isFilterOpen to true when openFilter() is called', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should set isFilterOpen to false when openFilter() is called again (toggle)', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should apply filter and reload products on applyFilters()', () => {
      component.applyFilters({ inventoryClass: 'REG' });
      expect(component.appliedFilters).toEqual({ inventoryClass: 'REG' });
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('REG', '', 25, 0, 'A', '');
    });

    it('should build filter chips when filter is applied', () => {
      component.applyFilters({ inventoryClass: 'REG', productType: 'RBC' });
      expect(component.filterChips.length).toBe(2);
    });


    it('should detect active filters correctly', () => {
      component.applyFilters({ inventoryClass: 'REG' });
      expect(component.hasActiveFilters()).toBeTrue();
      component.clearAllFilters();
      expect(component.hasActiveFilters()).toBeFalse();
    });

  });

  // ── Row selection ─────────────────────────────────────────────────────────

  describe('Row click', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedProduct and focusedProduct when onRowClick() is called', () => {
      component.onRowClick(mockProduct1);
      expect(component.selectedProduct).toEqual(mockProduct1);
      expect(component.focusedProduct).toEqual(mockProduct1);
    });

  });

  // ── Server-side search ────────────────────────────────────────────────────

  describe('Search via onSearch()', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call getInterdictedProducts with the search term', () => {
      component.onSearch('031310');
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('', '', 25, 0, 'A', '031310');
    });

    it('should reset to page 0 when searching', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 1 });
      component.onSearch('E0701');
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('', '', 25, 0, 'A', 'E0701');
    });

    it('should send empty searchTerm when search is cleared', () => {
      component.onSearch('');
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('', '', 25, 0, 'A', '');
    });

  });

  // ── Pagination ────────────────────────────────────────────────────────────

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call loadTableData with new skip on page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, previousPageIndex: 0 });
      expect(serviceSpy.getInterdictedProducts).toHaveBeenCalledWith('', '', 10, 10, 'A', '');
    });

  });

  // ── Loading state ─────────────────────────────────────────────────────────
  // ── Error handling ────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should handle getInventoryClasses error gracefully', fakeAsync(() => {
      serviceSpy.getInventoryClasses.and.returnValue(throwError(() => new Error('Network error')));
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should set hasError to true when getInterdictedProducts fails', fakeAsync(() => {
      serviceSpy.getInterdictedProducts.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();
      tick();
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));
  });

  // ── Page header config ────────────────────────────────────────────────────

  describe('Page header configuration', () => {
    it('should initialise headerConfig with at least one breadcrumb', () => {
      fixture.detectChanges();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
    });

  });

  // ── Table config ──────────────────────────────────────────────────────────

  describe('Table configuration', () => {

    it('should append checkDigit to unitId via valueFormatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitId')!;
      expect(col.valueFormatter).toBeDefined();
      const withDigit = col.valueFormatter!('W110111052808', { checkDigit: '-G' } as any);
      expect(withDigit).toBe('W110111052808-G');
      const withoutDigit = col.valueFormatter!('W110111052808', { checkDigit: null } as any);
      expect(withoutDigit).toBe('W110111052808');
    });

    it('should include unitId, inventoryClass, productCode, aboRh, collDate, stockState, locationId columns', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toContain('unitId');
      expect(keys).toContain('inventoryClass');
      expect(keys).toContain('productCode');
      expect(keys).toContain('aboRh');
      expect(keys).toContain('collDate');
      expect(keys).toContain('stockState');
      expect(keys).toContain('locationId');
    });

    it('should format collDate using DD-MMM-YYYY valueFormatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'collDate')!;
      expect(col.valueFormatter).toBeDefined();
      const formatted = col.valueFormatter!('2024-01-15', {} as any);
      expect(formatted).toMatch(/15.JAN.2024/i);
    });

    it('should return hyphen for null or empty collDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'collDate')!;
      expect(col.valueFormatter!('', {} as any)).toBe('-');
      expect(col.valueFormatter!(null as any, {} as any)).toBe('-');
    });
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call destroy$.next on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const nextSpy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    }));

    it('should dispose overlayRef when overlay is open on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).overlayRef = mockOverlayRef;
      component.ngOnDestroy();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    }));
  });

  // ── onRemoveFilterChip ─────────────────────────────────────────────────────

  describe('onRemoveFilterChip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should remove inventoryClass chip and keep productType', () => {
      component.applyFilters({ inventoryClass: 'REG', productType: 'RBC' });
      component.onRemoveFilterChip('inventoryClass');
      expect(component.appliedFilters?.inventoryClass).toBeUndefined();
      expect(component.appliedFilters?.productType).toBe('RBC');
    });

    it('should remove productType chip and keep inventoryClass', () => {
      component.applyFilters({ inventoryClass: 'REG', productType: 'RBC' });
      component.onRemoveFilterChip('productType');
      expect(component.appliedFilters?.productType).toBeUndefined();
      expect(component.appliedFilters?.inventoryClass).toBe('REG');
    });

    it('should set appliedFilters to null when last chip is removed', () => {
      component.applyFilters({ inventoryClass: 'REG' });
      component.onRemoveFilterChip('inventoryClass');
      expect(component.appliedFilters).toBeNull();
    });

    it('should do nothing when appliedFilters is null', () => {
      component.appliedFilters = null;
      const callsBefore = serviceSpy.getInterdictedProducts.calls.count();
      component.onRemoveFilterChip('inventoryClass');
      expect(serviceSpy.getInterdictedProducts.calls.count()).toBe(callsBefore);
    });
  });

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  describe('Keyboard shortcuts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open filter panel on Alt+F', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 'f', bubbles: true }));
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should close overlay on Escape when overlay is open', () => {
      component.openFilter();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should call searchBarComponent.focus() on Alt+S', () => {
      const focusSpy = jasmine.createSpy('focus');
      (component as any).searchBarComponent = { focus: focusSpy };
      window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 's', bubbles: true }));
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should move focusedProduct to next row on ArrowDown without changing selectedProduct', () => {
      component.onRowClick(mockProduct1);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct2);
      expect(component.selectedProduct).toEqual(mockProduct1); // blue highlight unchanged by arrow
    });

    it('should not move focusedProduct past last row on ArrowDown', () => {
      component.onRowClick(mockProduct2);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct2);
    });

    it('should move focusedProduct to previous row on ArrowUp without changing selectedProduct', () => {
      component.onRowClick(mockProduct2);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct1);
      expect(component.selectedProduct).toEqual(mockProduct2); // blue highlight unchanged by arrow
    });

    it('should not move focusedProduct past first row on ArrowUp', () => {
      component.onRowClick(mockProduct1);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct1);
    });

    it('should not navigate when neither selectedProduct nor focusedProduct is set', () => {
      component.selectedProduct = null;
      component.focusedProduct = null;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(component.focusedProduct).toBeNull();
    });

    it('should use focusedProduct as cursor when it differs from selectedProduct', () => {
      component.onRowClick(mockProduct1);
      // Manually advance focusedProduct (simulating a previous arrow press)
      component.focusedProduct = mockProduct2;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      // focusedProduct was already on last row — should stay there
      expect(component.focusedProduct).toEqual(mockProduct2);
    });
  });

  // ── pageHeaderService effect ──────────────────────────────────────────────

  describe('pageHeaderService effect', () => {
    it('should update headerConfig when pageHeaderData signal emits data', fakeAsync(() => {
      (mockPageHeaderService.pageHeaderData as any).set({ title: 'Interdicted Stock', subtitle: 'All Units' });
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.title).toBe('Interdicted Stock');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
    }));
  });

  // ── response.item API path ────────────────────────────────────────────────

  describe('response.item path', () => {
    it('should read inventoryClasses and productTypes from response.item when data is absent', fakeAsync(() => {
      serviceSpy.getInventoryClasses.and.returnValue(of({ item: mockInventoryClasses } as any));
      serviceSpy.getProductTypes.and.returnValue(of({ item: mockProductTypes } as any));
      fixture.detectChanges();
      tick();
      expect(component.inventoryClasses.length).toBe(2);
      expect(component.productTypes.length).toBe(2);
    }));
  });


  // ── getProductTypes error path ────────────────────────────────────────────

  describe('getProductTypes error', () => {
    it('should handle getProductTypes error gracefully', fakeAsync(() => {
      serviceSpy.getProductTypes.and.returnValue(throwError(() => new Error('Network error')));
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));
  });

  // ── ngOnDestroy without overlay ───────────────────────────────────────────

  describe('ngOnDestroy without overlayRef', () => {
    it('should not throw and not call dispose when overlayRef is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(mockOverlayRef.dispose).not.toHaveBeenCalled();
    }));
  });

  // ── onRowClick live announcer ─────────────────────────────────────────────

  describe('onRowClick live announcer', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockLiveAnnouncer.announce.calls.reset();
    }));

    it('should announce singular interdiction when product has exactly one', () => {
      const product = { ...mockProduct1, unitId: 'U001', interdictions: [{ interCode: 'A', interDesc: 'B' }] };
      component.onRowClick(product as any);
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('1 interdiction for unit U001', 'polite');
    });

    it('should announce plural interdictions when product has multiple', () => {
      const product = { ...mockProduct1, unitId: 'U002', interdictions: [
        { interCode: 'A', interDesc: 'B' },
        { interCode: 'C', interDesc: 'D' }
      ]};
      component.onRowClick(product as any);
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('2 interdictions for unit U002', 'polite');
    });

    it('should announce no interdictions when product has empty list', () => {
      const product = { ...mockProduct1, unitId: 'U003', interdictions: [] };
      component.onRowClick(product as any);
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('No interdictions for unit U003', 'polite');
    });
  });

  // ── onSortChange ──────────────────────────────────────────────────────────

  describe('onSortChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set sortConfig direction to A on first sort click', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
    });

    it('should set sortConfig direction to D and sortDirection to D on second sort click', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
      expect((component as any).sortDirection).toBe('D');
    });

    it('should intercept D→A transition and produce default direction (three-state cycle)', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      component.onSortChange({ column: 'unitId', direction: 'D' });
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'default' });
      expect((component as any).sortDirection).toBe('A');
    });

    it('should reset pageIndex to 0 on sort change', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should call loadTableData when sort changes', () => {
      const callsBefore = serviceSpy.getInterdictedProducts.calls.count();
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(serviceSpy.getInterdictedProducts.calls.count()).toBe(callsBefore + 1);
    });
  });

  // ── subscribeToChapterChanges ─────────────────────────────────────────────

  describe('subscribeToChapterChanges', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset filters, chips, selectedProduct, focusedProduct, sort, and pagination on chapter change', fakeAsync(() => {
      component.applyFilters({ inventoryClass: 'REG', productType: 'RBC' });
      component.selectedProduct = mockProduct1;
      component.focusedProduct = mockProduct1;
      (component as any).searchText = 'test';

      chapterChangedSubject.next();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.selectedProduct).toBeNull();
      expect(component.focusedProduct).toBeNull();
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'default' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));

    it('should reload dropdown options after chapter change', fakeAsync(() => {
      const classesBefore = serviceSpy.getInventoryClasses.calls.count();
      chapterChangedSubject.next();
      tick();
      expect(serviceSpy.getInventoryClasses.calls.count()).toBeGreaterThan(classesBefore);
    }));
  });

  // ── loadTableData response paths ──────────────────────────────────────────

  describe('loadTableData response paths', () => {
    it('should use response.item for products when response.data is absent', fakeAsync(() => {
      serviceSpy.getInterdictedProducts.and.returnValue(of({ item: [mockProduct1], total: 1 } as any));
      fixture.detectChanges();
      tick();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0]).toEqual(mockProduct1);
    }));

    it('should announce singular product count when total is 1', fakeAsync(() => {
      serviceSpy.getInterdictedProducts.and.returnValue(of({ data: [mockProduct1], total: 1 } as any));
      fixture.detectChanges();
      tick();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('1 interdicted product loaded.', 'polite');
    }));

    it('should announce plural product count when total is not 1', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('2 interdicted products loaded.', 'polite');
    }));

    it('should announce error message with assertive priority on load failure', fakeAsync(() => {
      serviceSpy.getInterdictedProducts.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();
      tick();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith(
        'Failed to load interdicted products. Please try again.', 'assertive'
      );
    }));

    it('should update Unit ID column header with total count after load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const col = component.tableConfig.columns.find(c => c.key === 'unitId')!;
      expect(col.header).toBe('Unit ID (2)');
    }));
  });

  // ── Keyboard navigation blocked by open overlay ───────────────────────────

  describe('Keyboard navigation blocked when overlay is open', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not move focusedProduct on ArrowDown when overlay is open', () => {
      component.onRowClick(mockProduct1);
      (component as any).overlayRef = mockOverlayRef;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct1);
    });

    it('should not move focusedProduct on ArrowUp when overlay is open', () => {
      component.onRowClick(mockProduct2);
      (component as any).overlayRef = mockOverlayRef;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(component.focusedProduct).toEqual(mockProduct2);
    });
  });

  // ── Keyboard ArrowDown/Up — no announcement (only click/Enter announces) ──

  describe('Keyboard ArrowDown/Up live announcer', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockLiveAnnouncer.announce.calls.reset();
    }));

    it('should NOT announce on ArrowDown — focus cursor moves silently', () => {
      component.onRowClick(mockProduct1);
      mockLiveAnnouncer.announce.calls.reset();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
    });

    it('should NOT announce on ArrowUp — focus cursor moves silently', () => {
      component.onRowClick(mockProduct2);
      mockLiveAnnouncer.announce.calls.reset();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
    });
  });

  // ── stockState valueFormatter ─────────────────────────────────────────────

  describe('stockState valueFormatter', () => {
    let col: any;

    beforeEach(() => {
      col = component.tableConfig.columns.find(c => c.key === 'stockState')!;
    });

    it('should map AV to Available', () => {
      expect(col.valueFormatter('AV', {} as any)).toBe('Available');
    });

    it('should map RE to Reserved', () => {
      expect(col.valueFormatter('RE', {} as any)).toBe('Reserved');
    });

    it('should map AL to Allocated', () => {
      expect(col.valueFormatter('AL', {} as any)).toBe('Allocated');
    });

    it('should map PK to Packed', () => {
      expect(col.valueFormatter('PK', {} as any)).toBe('Packed');
    });

    it('should return the raw code for unrecognised stockState', () => {
      expect(col.valueFormatter('XX', {} as any)).toBe('XX');
    });
  });

  // ── collDate invalid date ─────────────────────────────────────────────────

  describe('collDate valueFormatter with invalid date', () => {
    it('should return the original string when collDate is not parseable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'collDate')!;
      expect(col.valueFormatter!('not-a-date', {} as any)).toBe('not-a-date');
    });
  });

  // ── clearAllFilters ───────────────────────────────────────────────────────

  describe('clearAllFilters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear all filters, reset chips, reset pageIndex, and reload data', () => {
      component.applyFilters({ inventoryClass: 'REG', productType: 'RBC' });
      const callsBefore = serviceSpy.getInterdictedProducts.calls.count();
      component.clearAllFilters();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(serviceSpy.getInterdictedProducts.calls.count()).toBe(callsBefore + 1);
    });
  });

  // ── closeOverlay focus restoration ────────────────────────────────────────

  describe('closeOverlay focus restoration', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should restore focus to filterBtn after overlay is disposed', fakeAsync(() => {
      const focusSpy = jasmine.createSpy('focus');
      (component as any).filterBtn = { nativeElement: { focus: focusSpy } };
      (component as any).overlayRef = mockOverlayRef;
      (component as any).closeOverlay();
      tick(0);
      expect(focusSpy).toHaveBeenCalled();
    }));

    it('should set isFilterOpen to false when overlay is closed', () => {
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;
      (component as any).closeOverlay();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should set overlayRef to null after closing', () => {
      (component as any).overlayRef = mockOverlayRef;
      (component as any).closeOverlay();
      expect((component as any).overlayRef).toBeNull();
    });
  });
});
