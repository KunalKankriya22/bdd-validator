import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefineOrderChargesComponent } from './define-order-charges';
import { DefineOrderChargesService } from './services/define-order-charges.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { OrderChargeModel } from './models/define-order-charges.model';
import { Overlay } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineOrderChargesComponent', () => {
  let filterOverlayCompleteSpy: any;
  let filterOverlayDestroySpy: any;
  let completeSpy: any;
  let destroySpy: any;
  let menuServiceSpy: any;
  let serviceSpy: any;
  let component: DefineOrderChargesComponent;
  let fixture: ComponentFixture<DefineOrderChargesComponent>;
  let service: jasmine.SpyObj<DefineOrderChargesService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockOrderCharges: OrderChargeModel[] = [
    {
      serviceCode: 'TEST001',
      serviceCodeDescription: 'Test Charge 1',
      charge: 100.50,
      modifyCharge: 'Yes',
      chargeType: 'Debit',
      shipmentCharge: 'Y',
      orderNumber: 'Yes',
      effectiveDate: '01-JAN-2024',
      targetDate: '31-DEC-2024',
      lastModifiedDate: '15-MAR-2024'
    },
    {
      serviceCode: 'TEST002',
      serviceCodeDescription: 'Test Charge 2',
      charge: 200.75,
      modifyCharge: 'No',
      chargeType: 'Credit',
      shipmentCharge: 'N',
      orderNumber: 'No',
      effectiveDate: '01-FEB-2024',
      targetDate: '28-FEB-2024',
      lastModifiedDate: '20-MAR-2024'
    },
    {
      serviceCode: 'TEST003',
      serviceCodeDescription: 'Test Charge 3 - Negative',
      charge: -500.25,
      modifyCharge: 'Yes',
      chargeType: 'Credit',
      shipmentCharge: 'N',
      orderNumber: 'Yes',
      effectiveDate: '01-MAY-2024',
      targetDate: '31-MAY-2024',
      lastModifiedDate: '25-MAY-2024'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineOrderChargesService', [
      'getOrderCharges',
      'addOrderCharge',
      'updateOrderCharge'
    ]);

    menuServiceSpy = jasmine.createSpyObj('MenuService', [
      'getMenuItemsSignal',
      'findMenuItemByPath'
    ]);

    const chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject });

    const translateServiceSpy = createMockTranslateService();
    serviceSpy.getOrderCharges.and.returnValue(of({ data: mockOrderCharges, totalRecords: 3 }));
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));



      TestBed.configureTestingModule({
      imports: [DefineOrderChargesComponent, NoopAnimationsModule],
      providers: [
        { provide: DefineOrderChargesService, useValue: serviceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
        Overlay
      ]
    });

      serviceSpy.getOrderCharges.and.returnValue(of({ data: mockOrderCharges, totalRecords: 3 }));


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


    service = TestBed.inject(DefineOrderChargesService) as jasmine.SpyObj<DefineOrderChargesService>;
    menuService = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(DefineOrderChargesComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.isFilterOpen).toBe(false);
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should have correct table config', () => {
      expect(component.tableConfig.columns.length).toBe(10);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.sortConfig?.column).toBe('serviceCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
      expect(component.tableConfig.stickyHeader).toBe(true);
      expect(component.tableConfig.showPagination).toBe(true);
    });






  });

  describe('Table Column Config', () => {
    it('should format shipmentCharge Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'shipmentCharge');
      expect(col?.valueFormatter?.('Y', mockOrderCharges[0])).toBe('Yes');
    });

    it('should format shipmentCharge N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'shipmentCharge');
      expect(col?.valueFormatter?.('N', mockOrderCharges[1])).toBe('No');
    });

    it('should format shipmentCharge S as Default', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'shipmentCharge');
      expect(col?.valueFormatter?.('S', mockOrderCharges[0])).toBe('Default');
    });

    it('should format shipmentCharge B as Box', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'shipmentCharge');
      expect(col?.valueFormatter?.('B', mockOrderCharges[0])).toBe('Box');
    });

    it('should return original value for unknown shipmentCharge', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'shipmentCharge');
      expect(col?.valueFormatter?.('X', mockOrderCharges[0])).toBe('X');
    });

    it('should format serviceCodeDuplicate column with row serviceCode', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'serviceCodeDuplicate');
      expect(col?.valueFormatter?.('', mockOrderCharges[0])).toBe('TEST001');
    });
  });

  describe('Data Loading', () => {




    it('should handle load error', (done) => {
      const error = new Error('Load failed');
      service.getOrderCharges.and.returnValue(throwError(() => error));

      component.loadData();

      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.isLoading).toBe(false);
        expect(component.errorMessage).toBe('Failed to load order charges data. Please try again.');
        expect(component.dataSource).toEqual([]);
        done();
      }, 10);
    });

    it('should calculate skip and take correctly for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 50;

      component.loadData();

      expect(service.getOrderCharges).toHaveBeenCalledWith(50, 100, {});
    });
  });

  describe('Side Panel Operations', () => {
    it('should open add panel when createRecord is called', () => {
      component.createRecord();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should keep ADD NEW CHARGE button enabled when in add mode', () => {
      component.createRecord();

      expect(component.headerConfig.actions?.[0].disabled).toBe(false);
    });

    it('should keep ADD NEW CHARGE button enabled when in edit mode', () => {
      component.editRecord(mockOrderCharges[0]);

      expect(component.headerConfig.actions?.[0].disabled).toBe(false);
    });

    it('should open edit panel when editRecord is called', () => {
      const mockData = mockOrderCharges[0];

      component.editRecord(mockData);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData);
    });






  });
  describe('Sorting', () => {
    it('should handle sort change with ascending order', () => {
      spyOn(component, 'loadData');

      component.onSortChange({ column: 'serviceCode', direction: 'A' });

      expect(component.tableConfig.sortConfig?.column).toBe('serviceCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.sortColumn).toBe('serviceCode');
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(component.loadData).toHaveBeenCalled();
    });




  });

  describe('Search Functionality', () => {
    it('should handle search with keyword', () => {
      spyOn(component, 'loadData');

      component.onSearch('TEST');

      expect(component.searchText).toBe('TEST');
      expect(component.requestState.searchKeyword).toBe('TEST');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle search with empty string', () => {
      spyOn(component, 'loadData');
      component.searchText = 'TEST';
      component.requestState.searchKeyword = 'TEST';

      component.onSearch('');

      expect(component.searchText).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle search cleared', () => {
      spyOn(component, 'loadData');
      component.searchText = 'TEST';
      component.requestState.searchKeyword = 'TEST';

      component.onSearchCleared();

      expect(component.searchText).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Filter Operations', () => {
    it('should apply service code filter and reset to first page', () => {
      spyOn(component, 'loadData');
      component.tableConfig.pagination!.pageIndex = 2;

      const filters = { serviceCode: 'TEST' };
      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.filterServiceCode).toBe('TEST');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should apply effective date AFTER filter', () => {
      spyOn(component, 'loadData');

      const filters = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER' as const
      };
      component.applyFilters(filters);

      expect(component.requestState.filterEffectiveDateAfter).toBe('2025-01-01');
      expect(component.requestState.filterEffectiveDateBefore).toBeUndefined();
    });

    it('should apply effective date BEFORE filter', () => {
      spyOn(component, 'loadData');

      const filters = {
        effectiveDate: '2025-06-30',
        effectiveDatePeriod: 'BEFORE' as const
      };
      component.applyFilters(filters);

      expect(component.requestState.filterEffectiveDateBefore).toBe('2025-06-30');
      expect(component.requestState.filterEffectiveDateAfter).toBeUndefined();
    });

    it('should apply termination date AFTER filter', () => {
      spyOn(component, 'loadData');

      const filters = {
        terminationDate: '2025-03-01',
        terminationDatePeriod: 'AFTER' as const
      };
      component.applyFilters(filters);

      expect(component.requestState.filterTermDateAfter).toBe('2025-03-01');
      expect(component.requestState.filterTermDateBefore).toBeUndefined();
    });

    it('should apply termination date BEFORE filter', () => {
      spyOn(component, 'loadData');

      const filters = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE' as const
      };
      component.applyFilters(filters);

      expect(component.requestState.filterTermDateBefore).toBe('2025-12-31');
      expect(component.requestState.filterTermDateAfter).toBeUndefined();
    });

    it('should apply all filters combined', () => {
      spyOn(component, 'loadData');

      const filters = {
        serviceCode: 'SVC01',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER' as const,
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE' as const
      };
      component.applyFilters(filters);

      expect(component.requestState.filterServiceCode).toBe('SVC01');
      expect(component.requestState.filterEffectiveDateAfter).toBe('2025-01-01');
      expect(component.requestState.filterTermDateBefore).toBe('2025-12-31');
    });

    it('should replace After: with >= in filter chip labels', () => {
      spyOn(component, 'loadData');

      const filters = {
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER' as const
      };
      component.applyFilters(filters);

      const effChip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(effChip?.label).toContain('≥');
      expect(effChip?.label).not.toContain('After:');
    });

    it('should replace Before: with <= in filter chip labels', () => {
      spyOn(component, 'loadData');

      const filters = {
        terminationDate: '2025-12-31',
        terminationDatePeriod: 'BEFORE' as const
      };
      component.applyFilters(filters);

      const termChip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(termChip?.label).toContain('≤');
      expect(termChip?.label).not.toContain('Before:');
    });







    it('should remove a specific filter chip and reload', () => {
      spyOn(component, 'loadData');
      component.appliedFilters = {
        serviceCode: 'TEST',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'AFTER'
      };

      component.removeFilterChip('serviceCode');

      expect(component.appliedFilters?.serviceCode).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });


  });

  describe('Row Actions', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');
      const mockRow = mockOrderCharges[0];

      component.onRowAction({ action: 'edit', row: mockRow });

      expect(component.editRecord).toHaveBeenCalledWith(mockRow);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear filters and reload data on chapter change', () => {
      fixture.detectChanges();

      spyOn(component, 'clearAllFilters');
      spyOn(component, 'loadData');

      const chapterChangedSubject = headerService.chapterChanged$ as Subject<void>;
      chapterChangedSubject.next();

      expect(component.clearAllFilters).toHaveBeenCalled();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters).toBe(false);
    });

    it('should return true when service code filter is applied', () => {
      component.appliedFilters = { serviceCode: 'TEST' };
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should return true when date filter is applied', () => {
      component.appliedFilters = { effectiveDate: '2025-01-01', effectiveDatePeriod: 'AFTER' };
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should return false for empty filter object', () => {
      component.appliedFilters = {};
      expect(component.hasActiveFilters).toBe(false);
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup on destroy', () => {
      destroySpy = spyOn(component['destroy$'], 'next');
      completeSpy = spyOn(component['destroy$'], 'complete');
      filterOverlayDestroySpy = spyOn(component['filterOverlaySub$'], 'next');
      filterOverlayCompleteSpy = spyOn(component['filterOverlaySub$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
      expect(filterOverlayDestroySpy).toHaveBeenCalled();
      expect(filterOverlayCompleteSpy).toHaveBeenCalled();
    });


  });

  describe('closeSidePanel', () => {
    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockOrderCharges[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    it('should reload data', () => {
      spyOn(component, 'loadData');
      component.onSaveSuccess();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload', () => {
      spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 3, pageSize: 50, previousPageIndex: 2 } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(3);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Sorting - additional cases', () => {
    it('should handle sort change with descending order', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'serviceCode', direction: 'D' });
      expect(component.requestState.sortColumn).toBe('serviceCode');
      expect(component.requestState.sortOrder).toBe('DESC');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should clear sort when direction is default', () => {
      spyOn(component, 'loadData');
      component.requestState.sortColumn = 'serviceCode';
      component.requestState.sortOrder = 'ASC';
      component.onSortChange({ column: 'serviceCode', direction: 'default' });
      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('removeFilterChip - null result', () => {
    it('should clear all filters when removing last chip results in null', () => {
      spyOn(component, 'clearAllFilters');
      component.appliedFilters = { serviceCode: 'TEST' };
      component.removeFilterChip('serviceCode');
      expect(component.clearAllFilters).toHaveBeenCalled();
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filter state and reload', () => {
      spyOn(component, 'loadData');
      component.appliedFilters = { serviceCode: 'TEST' };
      component.filterChips = [{ key: 'serviceCode', label: 'TEST', group: 'svc' }];
      component.requestState.filterServiceCode = 'TEST';
      component.requestState.filterEffectiveDateAfter = '2025-01-01';
      component.requestState.filterEffectiveDateBefore = '2025-06-30';
      component.requestState.filterTermDateAfter = '2025-01-01';
      component.requestState.filterTermDateBefore = '2025-12-31';

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.filterServiceCode).toBeUndefined();
      expect(component.requestState.filterEffectiveDateAfter).toBeUndefined();
      expect(component.requestState.filterEffectiveDateBefore).toBeUndefined();
      expect(component.requestState.filterTermDateAfter).toBeUndefined();
      expect(component.requestState.filterTermDateBefore).toBeUndefined();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('loadData success', () => {
    it('should populate dataSource and totalRecords on success', () => {
      component.loadData();
      expect(component.dataSource).toEqual(mockOrderCharges);
      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('openFilter', () => {
    it('should close filter if already open', () => {
      component.isFilterOpen = true;
      spyOn(component, 'closeFilter');
      component.openFilter();
      expect(component.closeFilter).toHaveBeenCalled();
    });

    it('should not open if filterBtn is not available', () => {
      component.isFilterOpen = false;
      (component as any).filterBtn = undefined;
      component.openFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('closeFilter', () => {
    it('should close filter overlay and reset state', () => {
      component.isFilterOpen = true;
      (component as any).filterBtn = { nativeElement: { blur: jasmine.createSpy('blur') } };
      component.closeFilter();
      expect(component.isFilterOpen).toBe(false);
      expect((component as any).filterBtn.nativeElement.blur).toHaveBeenCalled();
    });

    it('should handle closeFilter when filterBtn is null', () => {
      component.isFilterOpen = true;
      (component as any).filterBtn = null;
      component.closeFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('closeFilterOverlay', () => {
    it('should dispose overlay if it exists', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockOverlayRef;
      (component as any).closeFilterOverlay();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
    });

    it('should handle null overlayRef', () => {
      (component as any).overlayRef = null;
      expect(() => (component as any).closeFilterOverlay()).not.toThrow();
    });
  });

  describe('Row Actions - non-edit', () => {
    it('should not call editRecord for non-edit actions', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'delete', row: mockOrderCharges[0] });
      expect(component.editRecord).not.toHaveBeenCalled();
    });
  });

  describe('headerConfig actions onClick', () => {
    it('should call createRecord when ADD NEW CHARGE button is clicked', () => {
      spyOn(component, 'createRecord');
      component.headerConfig.actions?.[0]?.onClick?.();
      expect(component.createRecord).toHaveBeenCalled();
    });
  });
});
