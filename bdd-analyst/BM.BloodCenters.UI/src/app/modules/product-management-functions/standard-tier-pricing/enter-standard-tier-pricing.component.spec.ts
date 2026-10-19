import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';

import { EnterStandardTierPricingComponent } from './enter-standard-tier-pricing.component';
import { StandardTierPricingApiService } from './services/standard-tier-pricing-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { StandardTierPricingDto, StandardTierPricingFilter } from './models/standard-tier-pricing.model';

describe('EnterStandardTierPricingComponent', () => {
  let component: EnterStandardTierPricingComponent;
  let fixture: ComponentFixture<EnterStandardTierPricingComponent>;
  let mockApiService: jasmine.SpyObj<StandardTierPricingApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  const mockProducts = [
    { productType: 'RBC01', productTypeDesc: 'Red Blood Cells', lifeSpan: 42, lifeSpanInd: 'DY', stdPrice: 250.00 },
    { productType: 'PLT01', productTypeDesc: 'Platelets', lifeSpan: 5, lifeSpanInd: 'DY', stdPrice: null },
    { productType: 'FFP01', productTypeDesc: 'Fresh Frozen Plasma', lifeSpan: 1, lifeSpanInd: 'YR', stdPrice: 42.00 },
    { productType: 'WB001', productTypeDesc: 'Whole Blood', lifeSpan: 24, lifeSpanInd: 'HR', stdPrice: 0 }
  ];

  const mockTiers: StandardTierPricingDto[] = [
    {
      productType: 'RBC01',
      tier: 1,
      fromDay: 1,
      toDay: 7,
      unitPrice: 200.00,
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      lastModifiedDate: '2024-01-01T10:30:00Z',
      chapterId: '0001',
      customerId: 'STANDARD'
    },
    {
      productType: 'RBC01',
      tier: 2,
      fromDay: 8,
      toDay: 14,
      unitPrice: 150.00,
      effDate: '2024-01-01T00:00:00Z',
      termDate: '2025-12-31T00:00:00Z',
      lastModifiedDate: '2024-01-01T10:30:00Z',
      chapterId: '0001',
      customerId: 'STANDARD'
    }
  ];

  beforeEach(async () => {

    mockApiService = jasmine.createSpyObj('StandardTierPricingApiService', [
      'getActiveProducts',
      'searchTiers',
      'getTierById',
      'createTier',
      'updateTier',
      'deleteTier'
    ]);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: of(void 0),
      chapterTimeZone: () => '+00:00'
    });
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error']);

    mockApiService.getActiveProducts.and.returnValue(of(mockProducts));
    mockApiService.searchTiers.and.returnValue(of({ data: mockTiers, totalCount: 2 }));

    await TestBed.configureTestingModule({
      imports: [EnterStandardTierPricingComponent, NoopAnimationsModule],
      providers: [
        { provide: StandardTierPricingApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: PageHeaderService, useValue: { pageHeaderData: () => null, getTitle: () => '', getSubtitle: () => '' } },
        { provide: LoggingService, useValue: mockLoggingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterStandardTierPricingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load products on init', () => {
      fixture.detectChanges();
      expect(mockApiService.getActiveProducts).toHaveBeenCalled();
      expect(component.productTypeOptions().length).toBe(4);
    });

    it('should initialize search card form with productType control', () => {
      expect(component.searchCardForm.get('productType')).toBeTruthy();
    });

    it('should initialize table config with columns and row actions', () => {
      expect(component.tableConfig.columns.length).toBe(7);
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
    });

    it('should initialize pagination defaults', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should default sidePanelOpen to false', () => {
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should default hasRetrievedData to false', () => {
      expect(component.hasRetrievedData).toBe(false);
    });
  });

  describe('loadProducts', () => {
    it('should show error on load failure', () => {
      mockApiService.getActiveProducts.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(mockLoggingService.error).toHaveBeenCalledWith('Failed to load products', jasmine.any(Error));
    });

    it('should set empty products array on error', () => {
      mockApiService.getActiveProducts.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.productTypeOptions().length).toBe(0);
    });

    it('should re-enable product type control after load', () => {
      fixture.detectChanges();
      expect(component.searchCardForm.get('productType')?.disabled).toBe(false);
    });

    it('should re-enable product type control after error', () => {
      mockApiService.getActiveProducts.and.returnValue(throwError(() => new Error('Load failed')));
      fixture.detectChanges();
      expect(component.searchCardForm.get('productType')?.disabled).toBe(false);
    });

    it('should set isLoadingProductTypes to false after load', () => {
      fixture.detectChanges();
      expect(component.isLoadingProductTypes).toBe(false);
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('filteredProductTypeOptions', () => {
      it('should return all options when search is empty', () => {
        expect(component.filteredProductTypeOptions().length).toBe(4);
      });

      it('should filter by product type code', () => {
        component.productTypeSearchCtrl.setValue('RBC');
        expect(component.filteredProductTypeOptions().length).toBe(1);
        expect(component.filteredProductTypeOptions()[0].productType).toBe('RBC01');
      });

      it('should filter by product description', () => {
        component.productTypeSearchCtrl.setValue('platelet');
        expect(component.filteredProductTypeOptions().length).toBe(1);
        expect(component.filteredProductTypeOptions()[0].productType).toBe('PLT01');
      });

      it('should be case insensitive', () => {
        component.productTypeSearchCtrl.setValue('WHOLE');
        expect(component.filteredProductTypeOptions().length).toBe(1);
      });
    });

    describe('selectedProductTypeDisplay', () => {
      it('should return empty string when no product selected', () => {
        expect(component.selectedProductTypeDisplay()).toBe('');
      });

      it('should return formatted display when product selected', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('RBC01');
        tick();
        expect(component.selectedProductTypeDisplay()).toBe('RBC01 - Red Blood Cells');
      }));
    });

    describe('selectedLifeSpan', () => {
      it('should return "-" when no product selected', () => {
        expect(component.selectedLifeSpan()).toBe('-');
      });

      it('should return "Days" for DY lifeSpanInd', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('RBC01');
        tick();
        expect(component.selectedLifeSpan()).toBe('42 Days');
      }));

      it('should return "Hours" for HR lifeSpanInd', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('WB001');
        tick();
        expect(component.selectedLifeSpan()).toBe('24 Hours');
      }));

      it('should return "Years" for YR lifeSpanInd', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('FFP01');
        tick();
        expect(component.selectedLifeSpan()).toBe('1 Years');
      }));
    });

    describe('selectedStandardPrice', () => {
      it('should return "-" when no product selected', () => {
        expect(component.selectedStandardPrice()).toBe('-');
      });

      it('should return formatted price when product has stdPrice', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('RBC01');
        tick();
        expect(component.selectedStandardPrice()).toBe('250.00');
      }));

      it('should return "-" when product has null stdPrice', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('PLT01');
        tick();
        expect(component.selectedStandardPrice()).toBe('-');
      }));
    });

    describe('selectedLifeSpanValue', () => {
      it('should return null when no product selected', () => {
        expect(component.selectedLifeSpanValue()).toBeNull();
      });

      it('should return numeric lifespan when product selected', fakeAsync(() => {
        component.searchCardForm.get('productType')?.setValue('RBC01');
        tick();
        expect(component.selectedLifeSpanValue()).toBe(42);
      }));

      it('should return null when product has no lifespan', fakeAsync(() => {
        const optionsWithNull = component.productTypeOptions().map(p =>
          p.productType === 'RBC01' ? { ...p, lifeSpan: null } : p
        );
        (component as any).productTypeOptions.set(optionsWithNull);
        component.searchCardForm.get('productType')?.setValue('RBC01');
        tick();
        expect(component.selectedLifeSpanValue()).toBeNull();
      }));
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchCardForm.patchValue({ productType: 'RBC01' });
    });

    it('should call searchTiers with correct parameters', () => {
      component.loadData();
      expect(mockApiService.searchTiers).toHaveBeenCalled();
      const callArgs = mockApiService.searchTiers.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10);
      expect(callArgs[1]).toBe(0);
      expect(callArgs[2].productType).toBe('RBC01');
    });

    it('should populate dataSource on success', fakeAsync(() => {
      component.loadData();
      tick();
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].tier).toBe(1);
    }));

    it('should update totalRecords on success', fakeAsync(() => {
      component.loadData();
      tick();
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    }));

    it('should set isLoading false on success', fakeAsync(() => {
      component.loadData();
      tick();
      expect(component.isLoading).toBe(false);
    }));

    it('should set hasError and log on error', fakeAsync(() => {
      mockApiService.searchTiers.and.returnValue(throwError(() => new Error('Search failed')));
      component.loadData();
      tick();
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Search failed');
      expect(mockLoggingService.error).toHaveBeenCalledWith('Failed to load standard tier pricing', jasmine.any(Error));
    }));

    it('should not call API when no product type selected', () => {
      component.searchCardForm.patchValue({ productType: null });
      mockApiService.searchTiers.calls.reset();
      component.loadData();
      expect(mockApiService.searchTiers).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should include current filters in query', () => {
      const filters: StandardTierPricingFilter = {
        unitPriceComparison: 'below',
        unitPrice: 100,
        effectiveDatePeriod: 'after',
        effectiveDate: '2024-01-01'
      };
      component.currentFilters.set(filters);
      component.loadData();

      const queryDto = mockApiService.searchTiers.calls.mostRecent().args[2];
      expect(queryDto.unitPriceComparison).toBe('below');
      expect(queryDto.unitPrice).toBe(100);
      expect(queryDto.effectiveDatePeriod).toBe('after');
      expect(queryDto.effectiveDate).toBe('2024-01-01');
    });

    it('should include sort parameters in query', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'tier', direction: 'A' }
      };
      component.loadData();
      const queryDto = mockApiService.searchTiers.calls.mostRecent().args[2];
      expect(queryDto.sortColumn).toBe('Tier');
      expect(queryDto.sortOrder).toBe('ASC');
    });

    it('should map sort direction D to DESC', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'tier', direction: 'D' }
      };
      component.loadData();
      const queryDto = mockApiService.searchTiers.calls.mostRecent().args[2];
      expect(queryDto.sortOrder).toBe('DESC');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date to DD-MMM-YYYY', () => {
      const result = (component as any).formatDate('2024-01-15T00:00:00Z');
      expect(result).toBe('15-JAN-2024');
    });

    it('should format date with various months', () => {
      expect((component as any).formatDate('2024-06-01T00:00:00Z')).toBe('01-JUN-2024');
      expect((component as any).formatDate('2024-12-25T00:00:00Z')).toBe('25-DEC-2024');
    });

    it('should return "--" for null value', () => {
      expect((component as any).formatDate(null)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect((component as any).formatDate('')).toBe('--');
    });

    it('should return original value for invalid month', () => {
      expect((component as any).formatDate('2024-13-01')).toBe('2024-13-01');
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchCardForm.patchValue({ productType: 'RBC01' });
    });

    it('should update pagination and reload data', () => {
      mockApiService.searchTiers.calls.reset();
      component.onPageChange({ pageSize: 25, pageIndex: 2, length: 100, previousPageIndex: 1 } as any);

      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(mockApiService.searchTiers).toHaveBeenCalled();
    });

    it('should calculate correct skip value', () => {
      component.onPageChange({ pageSize: 25, pageIndex: 2, length: 100, previousPageIndex: 1 } as any);
      const callArgs = mockApiService.searchTiers.calls.mostRecent().args;
      expect(callArgs[0]).toBe(25);
      expect(callArgs[1]).toBe(50);
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchCardForm.patchValue({ productType: 'RBC01' });
    });

    it('should cycle from default to A', () => {
      component.tableConfig = { ...component.tableConfig, sortConfig: { column: 'tier', direction: 'default' } };
      mockApiService.searchTiers.calls.reset();
      component.onSortChange({ column: 'tier' } as any);

      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(mockApiService.searchTiers).toHaveBeenCalled();
    });

    it('should cycle from A to D', () => {
      component.tableConfig = { ...component.tableConfig, sortConfig: { column: 'tier', direction: 'A' } };
      component.onSortChange({ column: 'tier' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should cycle from D to default', () => {
      component.tableConfig = { ...component.tableConfig, sortConfig: { column: 'tier', direction: 'D' } };
      component.onSortChange({ column: 'tier' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should reset page index to 0', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'tier', direction: 'default' },
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };
      component.onSortChange({ column: 'tier' } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('onRowAction', () => {
    it('should open edit side panel for edit action', () => {
      fixture.detectChanges();
      spyOn(component, 'openEditSidePanel');
      component.onRowAction({ action: 'edit', row: mockTiers[0] } as any);
      expect(component.openEditSidePanel).toHaveBeenCalledWith(mockTiers[0]);
    });

    it('should not open panel for unknown action', () => {
      fixture.detectChanges();
      spyOn(component, 'openEditSidePanel');
      component.onRowAction({ action: 'delete', row: mockTiers[0] } as any);
      expect(component.openEditSidePanel).not.toHaveBeenCalled();
    });
  });

  describe('side panel operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('openAddSidePanel', () => {
      it('should open add side panel', () => {
        component.searchCardForm.patchValue({ productType: 'RBC01' });
        component.openAddSidePanel();
        expect(component.sidePanelOpen).toBeTrue();
        expect(component.sidePanelMode).toBe('add');
        expect(component.sidePanelData).toBeNull();
      });

      it('should show error when no product type selected', () => {
        component.searchCardForm.patchValue({ productType: null });
        component.openAddSidePanel();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a product type first.');
        expect(component.sidePanelOpen).toBeFalse();
      });
    });

    describe('openEditSidePanel', () => {
      it('should open edit side panel with data', () => {
        component.openEditSidePanel(mockTiers[0]);
        expect(component.sidePanelOpen).toBeTrue();
        expect(component.sidePanelMode).toBe('edit');
        expect(component.sidePanelData).toEqual(mockTiers[0]);
      });
    });

    describe('closeSidePanel', () => {
      it('should close side panel and clear data', () => {
        component.sidePanelOpen = true;
        component.sidePanelData = mockTiers[0];
        component.closeSidePanel();
        expect(component.sidePanelOpen).toBeFalse();
        expect(component.sidePanelData).toBeNull();
      });
    });

    describe('onSidePanelSave', () => {
      it('should close panel, reload data and show success', () => {
        component.searchCardForm.patchValue({ productType: 'RBC01' });
        component.sidePanelOpen = true;
        mockApiService.searchTiers.calls.reset();

        component.onSidePanelSave();

        expect(component.sidePanelOpen).toBeFalse();
        expect(mockApiService.searchTiers).toHaveBeenCalled();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Tier details have been saved.');
      });
    });

    describe('onSidePanelCancel', () => {
      it('should close panel', () => {
        component.sidePanelOpen = true;
        component.onSidePanelCancel();
        expect(component.sidePanelOpen).toBeFalse();
      });
    });
  });

  describe('filter operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('buildFilterChips', () => {
      it('should build unit price chip with below symbol', () => {
        const chips = (component as any).buildFilterChips({
          unitPriceComparison: 'below',
          unitPrice: 100
        } as StandardTierPricingFilter);

        expect(chips.length).toBe(1);
        expect(chips[0].key).toBe('unitPrice');
        expect(chips[0].label).toContain('≤');
        expect(chips[0].label).toContain('$100');
      });

      it('should build unit price chip with above symbol', () => {
        const chips = (component as any).buildFilterChips({
          unitPriceComparison: 'above',
          unitPrice: 200
        } as StandardTierPricingFilter);

        expect(chips[0].label).toContain('≥');
      });

      it('should build effective date chip', () => {
        const chips = (component as any).buildFilterChips({
          effectiveDatePeriod: 'after',
          effectiveDate: '2024-01-01'
        } as StandardTierPricingFilter);

        expect(chips.length).toBe(1);
        expect(chips[0].key).toBe('effectiveDate');
        expect(chips[0].label).toContain('≥');
        expect(chips[0].label).toContain('2024-01-01');
      });

      it('should build termination date chip', () => {
        const chips = (component as any).buildFilterChips({
          terminationDatePeriod: 'before',
          terminationDate: '2025-12-31'
        } as StandardTierPricingFilter);

        expect(chips.length).toBe(1);
        expect(chips[0].key).toBe('terminationDate');
        expect(chips[0].label).toContain('≤');
      });

      it('should build multiple chips', () => {
        const chips = (component as any).buildFilterChips({
          unitPriceComparison: 'below',
          unitPrice: 100,
          effectiveDatePeriod: 'after',
          effectiveDate: '2024-01-01',
          terminationDatePeriod: 'before',
          terminationDate: '2025-12-31'
        } as StandardTierPricingFilter);

        expect(chips.length).toBe(3);
      });

      it('should return empty array for empty filters', () => {
        const chips = (component as any).buildFilterChips({} as StandardTierPricingFilter);
        expect(chips.length).toBe(0);
      });

      it('should skip incomplete pairs', () => {
        const chips = (component as any).buildFilterChips({
          unitPriceComparison: 'above',
          unitPrice: null
        } as StandardTierPricingFilter);

        expect(chips.length).toBe(0);
      });
    });

    describe('removeFilterChip', () => {
      beforeEach(() => {
        component.searchCardForm.patchValue({ productType: 'RBC01' });
        component.currentFilters.set({
          unitPriceComparison: 'below',
          unitPrice: 100,
          effectiveDatePeriod: 'after',
          effectiveDate: '2024-01-01'
        });
      });

      it('should remove unit price filter', () => {
        component.removeFilterChip('unitPrice');
        const filters = component.currentFilters();
        expect(filters.unitPriceComparison).toBeNull();
        expect(filters.unitPrice).toBeNull();
        expect(filters.effectiveDatePeriod).toBe('after');
      });

      it('should remove effective date filter', () => {
        component.removeFilterChip('effectiveDate');
        const filters = component.currentFilters();
        expect(filters.effectiveDatePeriod).toBeNull();
        expect(filters.effectiveDate).toBeNull();
        expect(filters.unitPriceComparison).toBe('below');
      });

      it('should remove termination date filter', () => {
        component.currentFilters.set({
          terminationDatePeriod: 'before',
          terminationDate: '2025-12-31'
        });
        component.removeFilterChip('terminationDate');
        const filters = component.currentFilters();
        expect(filters.terminationDatePeriod).toBeNull();
        expect(filters.terminationDate).toBeNull();
      });

      it('should reload data after removing chip', () => {
        mockApiService.searchTiers.calls.reset();
        component.removeFilterChip('unitPrice');
        expect(mockApiService.searchTiers).toHaveBeenCalled();
      });

      it('should reset page index to 0', () => {
        component.tableConfig = {
          ...component.tableConfig,
          pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
        };
        component.removeFilterChip('unitPrice');
        expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      });
    });

    describe('clearAllFilters', () => {
      it('should clear all filters and chips', () => {
        component.searchCardForm.patchValue({ productType: 'RBC01' });
        component.currentFilters.set({ unitPriceComparison: 'below', unitPrice: 100 });
        component.filterChips.set([{ key: 'unitPrice', label: 'Test', value: 100, removable: true }]);

        component.clearAllFilters();

        expect(component.currentFilters()).toEqual({});
        expect(component.filterChips().length).toBe(0);
      });

      it('should reload data after clearing', () => {
        component.searchCardForm.patchValue({ productType: 'RBC01' });
        mockApiService.searchTiers.calls.reset();
        component.clearAllFilters();
        expect(mockApiService.searchTiers).toHaveBeenCalled();
      });
    });

    describe('hasActiveFilters', () => {
      it('should return false when no chips', () => {
        component.filterChips.set([]);
        expect(component.hasActiveFilters).toBe(false);
      });

      it('should return true when chips present', () => {
        component.filterChips.set([{ key: 'test', label: 'Test', value: 1, removable: true }]);
        expect(component.hasActiveFilters).toBe(true);
      });
    });
  });

  describe('onClearAllSearch', () => {
    it('should reset all state', () => {
      fixture.detectChanges();
      component.hasRetrievedData = true;
      component.dataSource = mockTiers;
      component.currentFilters.set({ unitPriceComparison: 'below', unitPrice: 100 });
      component.filterChips.set([{ key: 'test', label: 'Test', value: 1, removable: true }]);
      component.sidePanelOpen = true;

      component.onClearAllSearch();

      expect(component.hasRetrievedData).toBe(false);
      expect(component.dataSource.length).toBe(0);
      expect(component.currentFilters()).toEqual({});
      expect(component.filterChips().length).toBe(0);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.hasError).toBe(false);
    });
  });

  describe('isClearAllDisabled', () => {
    it('should be true when no product selected and no data retrieved', () => {
      fixture.detectChanges();
      component.searchCardForm.patchValue({ productType: null });
      component.hasRetrievedData = false;
      expect(component.isClearAllDisabled).toBe(true);
    });

    it('should be false when product is selected', () => {
      fixture.detectChanges();
      component.searchCardForm.patchValue({ productType: 'RBC01' });
      expect(component.isClearAllDisabled).toBe(false);
    });

    it('should be false when data has been retrieved', () => {
      fixture.detectChanges();
      component.hasRetrievedData = true;
      expect(component.isClearAllDisabled).toBe(false);
    });
  });

  describe('checkProductTypeTruncation', () => {
    it('should set isProductTypeTruncated to true when scrollWidth exceeds clientWidth', () => {
      const mockEl = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkProductTypeTruncation(mockEl);
      expect(component.isProductTypeTruncated).toBe(true);
    });

    it('should set isProductTypeTruncated to false when content fits', () => {
      const mockEl = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.checkProductTypeTruncation(mockEl);
      expect(component.isProductTypeTruncated).toBe(false);
    });
  });

  describe('table config', () => {
    it('should have correct column keys', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toEqual(['tier', 'fromDay', 'toDay', 'lifespan', 'unitPrice', 'effDate', 'termDate']);
    });

    it('should mark tier column as sortable', () => {
      const tierCol = component.tableConfig.columns.find(c => c.key === 'tier');
      expect(tierCol?.sortable).toBe(true);
    });

    it('should format unit price as currency', () => {
      const priceCol = component.tableConfig.columns.find(c => c.key === 'unitPrice');
      expect(priceCol?.valueFormatter?.(200, {} as any, 0)).toBe('$200.00');
    });

    it('should show "--" for null unit price', () => {
      const priceCol = component.tableConfig.columns.find(c => c.key === 'unitPrice');
      expect(priceCol?.valueFormatter?.(null as any, {} as any, 0)).toBe('--');
    });

    it('should format tier as string', () => {
      const tierCol = component.tableConfig.columns.find(c => c.key === 'tier');
      expect(tierCol?.valueFormatter?.(5, {} as any, 0)).toBe('5');
    });

    it('should show "--" for null tier', () => {
      const tierCol = component.tableConfig.columns.find(c => c.key === 'tier');
      expect(tierCol?.valueFormatter?.(null as any, {} as any, 0)).toBe('--');
    });
  });

  describe('openFilterPanel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle filter panel closed if already open', () => {
      component.isFilterOpen.set(true);
      const mockEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;
      component.openFilterPanel(mockEvent);
      expect(component.isFilterOpen()).toBe(false);
    });

    it('should open filter panel via CDK overlay', () => {
      const mockEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;
      component.openFilterPanel(mockEvent);
      expect(component.isFilterOpen()).toBe(true);
    });

    it('should close on closeFilterPanel', () => {
      const mockEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;
      component.openFilterPanel(mockEvent);
      expect(component.isFilterOpen()).toBe(true);

      component.closeFilterPanel();
      expect(component.isFilterOpen()).toBe(false);
    });
  });

  describe('closeFilterPanel', () => {
    it('should set isFilterOpen to false', () => {
      component.isFilterOpen.set(true);
      component.closeFilterPanel();
      expect(component.isFilterOpen()).toBe(false);
    });

    it('should dispose overlay ref if exists', () => {
      fixture.detectChanges();
      const mockEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;
      component.openFilterPanel(mockEvent);
      component.closeFilterPanel();
      expect((component as any).filterOverlayRef).toBeNull();
    });
  });

  describe('subscribeToSearchCardChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set hasRetrievedData and call loadData when product type selected', fakeAsync(() => {
      mockApiService.searchTiers.calls.reset();
      component.searchCardForm.get('productType')?.setValue('RBC01');
      tick();
      expect(component.hasRetrievedData).toBe(true);
      expect(mockApiService.searchTiers).toHaveBeenCalled();
    }));

    it('should reset page index when product type changes', fakeAsync(() => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };
      component.searchCardForm.get('productType')?.setValue('PLT01');
      tick();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
