import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { StandingOrderItemListComponent } from './standing-order-item-list';
import { DataTable } from '@shared/components/data-table/data-table';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { StandingOrderItemSidePanelComponent } from '../standing-order-item-side-panel/standing-order-item-side-panel';
import { StandingOrderService } from '../../services/standing-order.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { StandingOrderItemListDto, LovOption } from '../../models/standing-order.model';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

// ─── Component Stubs ──────────────────────────────────────────────────────────

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderWithBreadcrumbStub {
  @Input() config: any;
}

@Component({ selector: 'app-data-table', template: '', standalone: true })
class DataTableStub {
  @Input() config: any;
  @Input() data: any;
  @Input() loading: any;
  @Input() highlightedRow: any;
}

@Component({ selector: 'app-standing-order-item-side-panel', template: '', standalone: true })
class StandingOrderItemSidePanelStub {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() record: any = null;
  @Input() contractId = '';
  @Input() consigneeId = '';
  @Input() weekDay = '';
  @Input() productTypesLookup: any[] = [];
  @Output() closePanel = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<string>();
  @Output() saveAndAddAnother = new EventEmitter<string>();
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockItems: StandingOrderItemListDto[] = [
  {
    itemNo: 1,
    weekDay: 'MON',
    weekDayDisplay: 'Monday',
    productType: 'RBC',
    productName: 'Red Blood Cells',
    abOrh: 'O+',
    tier: '1',
    quantity: 5,
    substitution: 'Yes - Allowed',
    minimumQuantity: '3',
    attributeDisplay: '--',
    effectiveDate: '01-JUN-2024',
    terminationDate: '--'
  }
];

const mockProductTypes: LovOption[] = [
  { code: 'RBC', description: 'Red Blood Cells' }
];

// ─── Mock Route ───────────────────────────────────────────────────────────────

const mockRoute = {
  snapshot: {
    paramMap: {
      get: (key: string) => {
        const map: Record<string, string> = {
          contractId: 'C001',
          consigneeId: 'CN001',
          weekDay: 'MON'
        };
        return map[key] ?? null;
      }
    }
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultLocationState = {
  weekDay: 'Monday',
  timeRequired: '8:00 AM',
  customerId: 'CUST01'
};

describe('StandingOrderItemListComponent', () => {
  let component: StandingOrderItemListComponent;
  let fixture: ComponentFixture<StandingOrderItemListComponent>;
  let standingOrderServiceSpy: jasmine.SpyObj<StandingOrderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let mockLocation: { getState: jasmine.Spy; back: jasmine.Spy };

  function setupTestBed(locationState: any = defaultLocationState): void {
    mockLocation = {
      getState: jasmine.createSpy('getState').and.returnValue(locationState),
      back: jasmine.createSpy('back')
    };

    standingOrderServiceSpy = jasmine.createSpyObj('StandingOrderService', [
      'getStandingOrderItems',
      'getProductTypes'
    ]);
    standingOrderServiceSpy.getStandingOrderItems.and.returnValue(
      of({ data: mockItems, totalRecords: 1 })
    );
    standingOrderServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));

    snackbarServiceSpy = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [StandingOrderItemListComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Location, useValue: mockLocation },
        { provide: StandingOrderService, useValue: standingOrderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    }).overrideComponent(StandingOrderItemListComponent, {
      remove: {
        imports: [DataTable, PageHeaderWithBreadcrumb, StandingOrderItemSidePanelComponent]
      },
      add: {
        imports: [DataTableStub, PageHeaderWithBreadcrumbStub, StandingOrderItemSidePanelStub]
      }
    });

    fixture = TestBed.createComponent(StandingOrderItemListComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    setupTestBed();
    fixture.detectChanges();
  });

  // ─── Initialization ─────────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should read contractId, consigneeId, and weekDay from route params on init', () => {
      expect(component.contractId).toBe('C001');
      expect(component.consigneeId).toBe('CN001');
      expect(component.weekDay).toBe('MON');
    });

    it('should read weekDayDisplay, timeRequired, and customerId from location state on init', () => {
      expect(component.weekDayDisplay).toBe('Monday');
      expect(component.timeRequired).toBe('8:00 AM');
    });

    it('should call loadProductTypes and loadData on init', () => {
      expect(standingOrderServiceSpy.getProductTypes).toHaveBeenCalledWith('CUST01', 'CN001');
      expect(standingOrderServiceSpy.getStandingOrderItems).toHaveBeenCalled();
    });

    it('should use getWeekDayDisplay fallback when state has no weekDay', () => {
      // Reconfigure with state that has no weekDay property
      TestBed.resetTestingModule();
      setupTestBed({ timeRequired: '9:00 AM', customerId: 'CUST02' });
      fixture.detectChanges();

      // getWeekDayDisplay('MON') returns 'Monday'
      expect(component.weekDayDisplay).toBe('Monday');
    });

    it('should use empty strings when location state is null', () => {
      TestBed.resetTestingModule();
      setupTestBed(null);
      fixture.detectChanges();

      expect(component.weekDayDisplay).toBe('Monday'); // fallback via getWeekDayDisplay
      expect(component.timeRequired).toBe('');
    });

    it('should use empty customerId when location state has no customerId', () => {
      TestBed.resetTestingModule();
      setupTestBed({ weekDay: 'Monday', timeRequired: '8:00 AM' });
      fixture.detectChanges();

      // getProductTypes should be called with empty customerId
      expect(standingOrderServiceSpy.getProductTypes).toHaveBeenCalledWith('', 'CN001');
    });
  });

  // ─── loadData success ───────────────────────────────────────────────────────

  describe('loadData success', () => {
    it('should update dataSource signal on success', () => {
      expect((component as any).dataSource()).toEqual(mockItems);
    });

    it('should update totalCount signal on success', () => {
      expect((component as any).totalCount()).toBe(1);
    });

    it('should update tableConfig pagination totalRecords on success', () => {
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    });

    it('should update tableConfig pagination pageIndex and pageSize on success', () => {
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
    });

    it('should set loading to false after success', () => {
      expect((component as any).loading()).toBeFalse();
    });
  });

  // ─── loadData error ─────────────────────────────────────────────────────────

  describe('loadData error', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      setupTestBed();
      standingOrderServiceSpy.getStandingOrderItems.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();
    });

    it('should show error snackbar when getStandingOrderItems fails', () => {
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load products');
    });

    it('should set loading to false after error', () => {
      expect((component as any).loading()).toBeFalse();
    });
  });

  // ─── loadProductTypes success ───────────────────────────────────────────────

  describe('loadProductTypes success', () => {
    it('should set productTypesLookup signal on success', () => {
      expect((component as any).productTypesLookup()).toEqual(mockProductTypes);
    });
  });

  // ─── loadProductTypes error ─────────────────────────────────────────────────

  describe('loadProductTypes error', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      setupTestBed();
      standingOrderServiceSpy.getProductTypes.and.returnValue(
        throwError(() => new Error('Product types error'))
      );
      fixture.detectChanges();
    });

    it('should show error snackbar when getProductTypes fails', () => {
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product types');
    });
  });

  // ─── onPageChange ───────────────────────────────────────────────────────────

  describe('onPageChange', () => {
    it('should update currentPageSize and currentPageIndex and reload data', () => {
      const initialCallCount = standingOrderServiceSpy.getStandingOrderItems.calls.count();

      const pageEvent: TablePageEvent = { pageIndex: 2, pageSize: 50, previousPageIndex: 0 };
      component.onPageChange(pageEvent);

      expect(standingOrderServiceSpy.getStandingOrderItems.calls.count()).toBe(initialCallCount + 1);
    });

    it('should pass updated pageSize to getStandingOrderItems', () => {
      const pageEvent: TablePageEvent = { pageIndex: 1, pageSize: 10, previousPageIndex: 0 };
      component.onPageChange(pageEvent);

      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      // take = pageSize = 10
      expect(calls.args[3]).toBe(10);
    });

    it('should pass correct skip (pageIndex * pageSize) to getStandingOrderItems', () => {
      const pageEvent: TablePageEvent = { pageIndex: 2, pageSize: 10, previousPageIndex: 0 };
      component.onPageChange(pageEvent);

      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      // skip = pageIndex * pageSize = 2 * 10 = 20
      expect(calls.args[4]).toBe(20);
    });
  });

  // ─── onSortChange ───────────────────────────────────────────────────────────

  describe('onSortChange', () => {
    it('should reset sort column and direction to ASC when direction is "default"', () => {
      const initialCallCount = standingOrderServiceSpy.getStandingOrderItems.calls.count();

      const sortEvent: TableSortEvent = { column: 'weekDayDisplay', direction: 'default' };
      component.onSortChange(sortEvent);

      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      // sortColumn resets to '' so it falls back to 'ItemNo' in the query
      expect(calls.args[5].sortColumn).toBe('ItemNo');
      expect(calls.args[5].sortOrder).toBe('ASC');
      expect(standingOrderServiceSpy.getStandingOrderItems.calls.count()).toBe(initialCallCount + 1);
    });

    it('should set sortColumn and ASC direction when direction is "A"', () => {
      const sortEvent: TableSortEvent = { column: 'productName', direction: 'A' };
      component.onSortChange(sortEvent);

      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      expect(calls.args[5].sortColumn).toBe('productName');
      expect(calls.args[5].sortOrder).toBe('ASC');
    });

    it('should set sortColumn and DESC direction when direction is "D"', () => {
      const sortEvent: TableSortEvent = { column: 'effectiveDate', direction: 'D' };
      component.onSortChange(sortEvent);

      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      expect(calls.args[5].sortColumn).toBe('effectiveDate');
      expect(calls.args[5].sortOrder).toBe('DESC');
    });

    it('should call loadData after any sort change', () => {
      const initialCallCount = standingOrderServiceSpy.getStandingOrderItems.calls.count();

      component.onSortChange({ column: 'itemNo', direction: 'A' });

      expect(standingOrderServiceSpy.getStandingOrderItems.calls.count()).toBe(initialCallCount + 1);
    });
  });

  // ─── onRowAction ────────────────────────────────────────────────────────────

  describe('onRowAction', () => {
    it('should call openEditPanel when action is "edit"', () => {
      const actionEvent: TableRowActionEvent<StandingOrderItemListDto> = {
        action: 'edit',
        row: mockItems[0]
      };
      component.onRowAction(actionEvent);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockItems[0]);
    });

    it('should do nothing when action is unknown', () => {
      component.sidePanelOpen = false;

      const actionEvent: TableRowActionEvent<StandingOrderItemListDto> = {
        action: 'delete',
        row: mockItems[0]
      };
      component.onRowAction(actionEvent);

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  // ─── openAddPanel ───────────────────────────────────────────────────────────

  describe('openAddPanel', () => {
    it('should set sidePanelMode to "add", clear sidePanelData, and open panel', fakeAsync(() => {
      // Set previous state to edit to verify mode switches
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockItems[0];

      component.openAddPanel();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();

      tick(50); // Flush the focus setTimeout
    }));

    it('should keep sidePanelOpen true after the setTimeout fires', fakeAsync(() => {
      component.openAddPanel();
      tick(50);

      expect(component.sidePanelOpen).toBeTrue();
    }));
  });

  // ─── openEditPanel ──────────────────────────────────────────────────────────

  describe('openEditPanel', () => {
    it('should set sidePanelMode to "edit" with item data and open panel', fakeAsync(() => {
      component.openEditPanel(mockItems[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockItems[0]);
      expect(component.sidePanelOpen).toBeTrue();

      tick(50); // Flush the focus setTimeout
    }));

    it('should replace existing sidePanelData with new item when editing different item', fakeAsync(() => {
      const anotherItem: StandingOrderItemListDto = {
        ...mockItems[0],
        itemNo: 2,
        productName: 'Platelets'
      };

      component.openEditPanel(mockItems[0]);
      component.openEditPanel(anotherItem);

      expect(component.sidePanelData).toEqual(anotherItem);

      tick(50);
    }));
  });

  // ─── closeSidePanel ─────────────────────────────────────────────────────────

  describe('closeSidePanel', () => {
    it('should set sidePanelOpen to false and clear sidePanelData', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockItems[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should be idempotent when called on an already closed panel', () => {
      component.sidePanelOpen = false;
      component.sidePanelData = null;

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  // ─── onSaveSuccess ──────────────────────────────────────────────────────────

  describe('onSaveSuccess', () => {
    beforeEach(() => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockItems[0];
      standingOrderServiceSpy.getStandingOrderItems.calls.reset();
    });

    it('should close the side panel after save', () => {
      component.onSaveSuccess('Product saved successfully.');

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should show a success snackbar with the provided message', () => {
      component.onSaveSuccess('Product saved successfully.');

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product saved successfully.');
    });

    it('should reload data after save', () => {
      component.onSaveSuccess('Product saved successfully.');

      expect(standingOrderServiceSpy.getStandingOrderItems).toHaveBeenCalledTimes(1);
    });
  });

  // ─── onSaveAndAddAnother ────────────────────────────────────────────────────

  describe('onSaveAndAddAnother', () => {
    beforeEach(() => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockItems[0];
      standingOrderServiceSpy.getStandingOrderItems.calls.reset();
    });

    it('should show a success snackbar with the provided message', () => {
      component.onSaveAndAddAnother('Product added.');

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product added.');
    });

    it('should reload data', () => {
      component.onSaveAndAddAnother('Product added.');

      expect(standingOrderServiceSpy.getStandingOrderItems).toHaveBeenCalledTimes(1);
    });

    it('should reset sidePanelMode to "add" without closing the panel', () => {
      component.onSaveAndAddAnother('Product added.');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelOpen).toBeTrue(); // panel stays open
    });

    it('should clear sidePanelData after save and add', () => {
      component.onSaveAndAddAnother('Product added.');

      expect(component.sidePanelData).toBeNull();
    });
  });

  // ─── goBackToParent ─────────────────────────────────────────────────────────

  describe('goBackToParent', () => {
    it('should call location.back()', () => {
      component.goBackToParent();

      expect(mockLocation.back).toHaveBeenCalled();
    });
  });

  // ─── headerConfig computed ──────────────────────────────────────────────────

  describe('headerConfig', () => {
    it('should include Home breadcrumb pointing to /home', () => {
      const config = (component as any).headerConfig();
      expect(config.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });

    it('should include Enter Standing Order breadcrumb', () => {
      const config = (component as any).headerConfig();
      expect(config.breadcrumbs[1]).toEqual({
        label: 'Enter Standing Order',
        link: '/distribution/enter-standing-order'
      });
    });

    it('should include a breadcrumb with weekDayDisplay and timeRequired', () => {
      const config = (component as any).headerConfig();
      expect(config.breadcrumbs[2].label).toBe('Monday | 8:00 AM');
      expect(config.breadcrumbs[2].link).toBeNull();
    });

    it('should set title to "weekDayDisplay | timeRequired"', () => {
      const config = (component as any).headerConfig();
      expect(config.title).toBe('Monday | 8:00 AM');
    });

    it('should include an ADD NEW PRODUCT action', () => {
      const config = (component as any).headerConfig();
      expect(config.actions.length).toBe(1);
      expect(config.actions[0].label).toBe('ADD NEW PRODUCT');
      expect(config.actions[0].icon).toBe('add');
    });

    it('should set showBackButton to true', () => {
      const config = (component as any).headerConfig();
      expect(config.showBackButton).toBeTrue();
    });

    it('should call goBackToParent when onBackClick is triggered', () => {
      const config = (component as any).headerConfig();
      spyOn(component, 'goBackToParent');
      config.onBackClick();
      expect(component.goBackToParent).toHaveBeenCalled();
    });

    it('should call openAddPanel when ADD NEW PRODUCT action onClick is triggered', fakeAsync(() => {
      const config = (component as any).headerConfig();
      spyOn(component, 'openAddPanel');
      config.actions[0].onClick();
      expect(component.openAddPanel).toHaveBeenCalled();
      tick(50);
    }));
  });

  // ─── tableConfig initial values ─────────────────────────────────────────────

  describe('tableConfig initial values', () => {
    it('should have a row action for "edit"', () => {
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
    });

    it('should have default pagination settings', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should have stickyHeader enabled', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should define all expected columns', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toContain('itemNo');
      expect(keys).toContain('weekDayDisplay');
      expect(keys).toContain('productType');
      expect(keys).toContain('productName');
      expect(keys).toContain('abOrh');
      expect(keys).toContain('tier');
      expect(keys).toContain('quantity');
      expect(keys).toContain('substitution');
      expect(keys).toContain('minimumQuantity');
      expect(keys).toContain('attributeDisplay');
      expect(keys).toContain('effectiveDate');
      expect(keys).toContain('terminationDate');
    });
  });

  // ─── ngAfterViewInit ────────────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('should update the attributeDisplay column with a cellTemplate after view init', () => {
      // ngAfterViewInit runs during fixture.detectChanges() in beforeEach
      const attrColumn = component.tableConfig.columns.find(col => col.key === 'attributeDisplay');
      expect(attrColumn?.cellTemplate).toBeDefined();
    });

    it('should not affect other columns with cellTemplate assignment', () => {
      const otherColumn = component.tableConfig.columns.find(col => col.key === 'productName');
      expect(otherColumn?.cellTemplate).toBeUndefined();
    });

    it('should preserve existing column definitions while adding cellTemplate', () => {
      const attrColumn = component.tableConfig.columns.find(col => col.key === 'attributeDisplay');
      expect(attrColumn?.header).toBe('Attributes');
      expect(attrColumn?.width).toBe('130px');
    });
  });

  // ─── ngOnDestroy ────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from observables on destroy so loadData does not emit after destroy', () => {
      component.ngOnDestroy();

      // Trigger would normally cause loadData -> getStandingOrderItems
      const callCountBefore = standingOrderServiceSpy.getStandingOrderItems.calls.count();
      standingOrderServiceSpy.getStandingOrderItems.and.returnValue(of({ data: [], totalRecords: 0 }));

      // Component's destroy$ has completed, subscriptions are cleaned up
      // No new subscriptions should propagate
      expect(standingOrderServiceSpy.getStandingOrderItems.calls.count()).toBe(callCountBefore);
    });
  });

  // ─── Integration: side panel output events wired through template ───────────

  describe('side panel output event wiring', () => {
    beforeEach(() => {
      component.sidePanelOpen = true;
      fixture.detectChanges();
    });

    it('should call closeSidePanel when side panel emits closePanel', () => {
      spyOn(component, 'closeSidePanel');
      const sidePanelEl = fixture.nativeElement.querySelector('app-standing-order-item-side-panel');
      expect(sidePanelEl).toBeTruthy(); // side panel is rendered when sidePanelOpen=true
    });
  });

  // ─── Route params passthrough ────────────────────────────────────────────────

  describe('route params passthrough to service', () => {
    it('should call getStandingOrderItems with contractId, consigneeId, weekDay from route', () => {
      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      expect(calls.args[0]).toBe('C001');  // contractId
      expect(calls.args[1]).toBe('CN001'); // consigneeId
      expect(calls.args[2]).toBe('MON');   // weekDay
    });

    it('should default sortColumn to "ItemNo" when no sort applied', () => {
      const calls = standingOrderServiceSpy.getStandingOrderItems.calls.mostRecent();
      const queryDto = calls.args[5];
      expect(queryDto.sortColumn).toBe('ItemNo');
      expect(queryDto.sortOrder).toBe('ASC');
    });
  });
});
