import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

import { CancelUnfilledOrdersComponent } from './cancel-unfilled-orders';
import { CancelUnfilledOrdersService } from './services/cancel-unfilled-orders.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService, createMockMatDialog, createMockPageHeaderService, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  OrderDetailDto,
  OrderItemDetailDto,
  CancelOrderResponseDto,
  EligibleOrderLovDto,
  OrderTypeLookupDto,
  OrderClassLookupDto
} from './models/cancel-unfilled-orders.model';

describe('CancelUnfilledOrdersComponent', () => {
  let nextSpy: any;
  let destroySpy: any;
  let dialogRefSpy: any;
  let translateServiceSpyObj: any;
  let dialogSpyObj: any;
  let pageHeaderServiceSpyObj: any;
  let headerServiceSpyObj: any;
  let snackbarServiceSpyObj: any;
  let cancelOrdersServiceSpyObj: any;
  let component: CancelUnfilledOrdersComponent;
  let fixture: ComponentFixture<CancelUnfilledOrdersComponent>;
  let cancelOrdersServiceSpy: jasmine.SpyObj<CancelUnfilledOrdersService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockOrderTypes: OrderTypeLookupDto[] = [
    { orderType: 'RE', orderTypeDesc: 'Regular Order' },
    { orderType: 'SP', orderTypeDesc: 'Special Order' }
  ];

  const mockOrderClasses: OrderClassLookupDto[] = [
    { orderClass: 'RE', orderClassDesc: 'Routine' },
    { orderClass: 'ER', orderClassDesc: 'EMERGENCY' }
  ];

  const mockEligibleOrders: EligibleOrderLovDto[] = [
    { orderNo: 'ORD-001', customerId: 'CUST001', customerName: 'Parkland Hospital', orderStatus: 'OR', ageInHours: 100 },
    { orderNo: 'ORD-002', customerId: 'CUST002', customerName: 'Dallas Medical', orderStatus: 'BO', ageInHours: 48 }
  ];

  const mockOrderDetail: OrderDetailDto = {
    chapterId: 'TEST',
    orderNo: 'ORD-001',
    customerId: 'DAL-RG0001',
    customerName: 'Parkland Hospital',
    orderType: 'RE',
    orderTypeDesc: 'Regular Order',
    orderClass: 'RE',
    orderClassDesc: 'Routine',
    orderStatus: 'BO',
    contractId: 'RG0001-001',
    consigneeId: 'PAR-CS0001',
    standingOrderFlag: 'N',
    insertDate: '2025-03-01T09:00:00Z',
    estArrivalTime: '2025-03-02T09:00:00Z',
    ageInHours: 100,
    hasUnfilledItems: true,
    orderItems: []
  };

  const mockOrderItems: OrderItemDetailDto[] = [
    {
      chapterId: 'TEST',
      orderNo: 'ORD-001',
      itemNo: 1,
      productType: 'WB',
      productTypeDesc: 'Whole Blood',
      bloodType: '51',
      aboDesc: 'O +',
      tier: 1,
      requiredQty: 1,
      allocatedQty: 0,
      canceledQty: 0,
      systemCancelQty: 0,
      shippedQty: 0,
      itemStatus: 'OR',
      unfilledQty: 1,
      balance: 1
    },
    {
      chapterId: 'TEST',
      orderNo: 'ORD-001',
      itemNo: 2,
      productType: 'WB',
      productTypeDesc: 'Whole Blood',
      bloodType: '28',
      aboDesc: 'AB -',
      tier: 1,
      requiredQty: 1,
      allocatedQty: 1,
      canceledQty: 0,
      systemCancelQty: 0,
      shippedQty: 0,
      itemStatus: 'CL',
      unfilledQty: 0,
      balance: 0
    }
  ];

  const mockOrderWithItems: OrderDetailDto = {
    ...mockOrderDetail,
    orderItems: mockOrderItems
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    cancelOrdersServiceSpyObj = jasmine.createSpyObj('CancelUnfilledOrdersService', [
      'searchEligibleOrders',
      'getOrderDetails',
      'cancelUnfilledOrder',
      'getEligibleOrdersLov',
      'getOrderTypes',
      'getOrderClasses',
      'getItemAttributes'
    ]);
    snackbarServiceSpyObj = createMockSnackbarService();
    headerServiceSpyObj = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpyObj = createMockPageHeaderService();
    dialogSpyObj = createMockMatDialog();
    translateServiceSpyObj = createMockTranslateService();
    cancelOrdersServiceSpyObj.getOrderTypes.and.returnValue(of(mockOrderTypes));
    cancelOrdersServiceSpyObj.getOrderClasses.and.returnValue(of(mockOrderClasses));
    cancelOrdersServiceSpyObj.getEligibleOrdersLov.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [CancelUnfilledOrdersComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CancelUnfilledOrdersService, useValue: cancelOrdersServiceSpyObj },
        { provide: SnackbarService, useValue: snackbarServiceSpyObj },
        { provide: HeaderService, useValue: headerServiceSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpyObj },
        { provide: MatDialog, useValue: dialogSpyObj },
        { provide: TranslateService, useValue: translateServiceSpyObj },
        provideRouter([]),
      ]
    })
    .overrideComponent(CancelUnfilledOrdersComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpyObj }] }
    });

      cancelOrdersServiceSpyObj.getOrderTypes.and.returnValue(of(mockOrderTypes));


      cancelOrdersServiceSpyObj.getOrderClasses.and.returnValue(of(mockOrderClasses));


      cancelOrdersServiceSpyObj.getEligibleOrdersLov.and.returnValue(of([]));


    cancelOrdersServiceSpy = TestBed.inject(CancelUnfilledOrdersService) as jasmine.SpyObj<CancelUnfilledOrdersService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(CancelUnfilledOrdersComponent);
    component = fixture.componentInstance;


    });

  // ── Component Initialization ──────────────────────────────────────────

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('hoursOld')?.value).toBeNull();
      expect(component.searchForm.get('orderNo')?.value).toBeNull();
      expect(component.searchForm.get('orderType')?.value).toBeNull();
    });

    it('should set page header configuration with breadcrumbs', () => {
      fixture.detectChanges();
      expect(component.headerConfig.title).toBe('Cancel Unfilled Orders');
      expect(component.headerConfig.subtitle).toBe('Cancel remaining unfulfilled items for selected orders.');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.headerConfig.breadcrumbs[1]).toEqual({ label: 'Cancel Unfilled Orders', link: null });
    });

    it('should use default title when pageHeaderData returns null', async () => {
      const newFixture = TestBed.createComponent(CancelUnfilledOrdersComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.headerConfig.title).toBe('Cancel Unfilled Orders');
    });

    it('should initialize items table with correct columns', () => {
      fixture.detectChanges();
      const columns = component.itemsTableConfig.columns;
      const columnKeys = columns.map(c => c.key);
      expect(columnKeys).toEqual([
        'itemNo', 'itemStatus', 'productType', 'productTypeDesc',
        'bloodType', 'aboDesc', 'tier', 'requiredQty',
        'allocatedQty', 'canceledQty', 'balance'
      ]);
    });

    it('should configure table pagination defaults', () => {
      fixture.detectChanges();
      expect(component.itemsTableConfig.pagination?.pageSize).toBe(10);
      expect(component.itemsTableConfig.pagination?.pageIndex).toBe(0);
      expect(component.itemsTableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50]);
      expect(component.itemsTableConfig.showPagination).toBeTrue();
      expect(component.itemsTableConfig.stickyHeader).toBeTrue();
    });

    it('should set empty state icon and messages', () => {
      fixture.detectChanges();
      expect(component.itemsTableConfig.noDataIcon).toBe('search');
      expect(component.itemsTableConfig.emptyMessage).toBe('No Results to Display');
      expect(component.itemsTableConfig.emptySubMessage).toBe('Use the fields above to get started.');
    });

    it('should load order types and classes on init', () => {
      fixture.detectChanges();
      expect(cancelOrdersServiceSpy.getOrderTypes).toHaveBeenCalled();
      expect(cancelOrdersServiceSpy.getOrderClasses).toHaveBeenCalled();
    });

    it('should populate order type lookups after loading', () => {
      fixture.detectChanges();
      expect(component.orderTypeLookups()).toEqual(mockOrderTypes);
    });

    it('should populate order class lookups after loading', () => {
      fixture.detectChanges();
      expect(component.orderClassLookups()).toEqual(mockOrderClasses);
    });

    it('should handle lookup load error silently', () => {
      cancelOrdersServiceSpy.getOrderTypes.and.returnValue(throwError(() => new Error('fail')));
      cancelOrdersServiceSpy.getOrderClasses.and.returnValue(throwError(() => new Error('fail')));
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should initialize signals with default values', () => {
      expect(component.selectedOrder()).toBeNull();
      expect(component.orderItems()).toEqual([]);
      expect(component.searchLoading()).toBeFalse();
      expect(component.cancelLoading()).toBeFalse();
      expect(component.submitted()).toBeFalse();
      expect(component.eligibleOrders()).toEqual([]);
      expect(component.loadingOrders()).toBeFalse();
    });
  });

  // ── Unique ID Generation ──────────────────────────────────────────────

  describe('Unique ID Generation', () => {
    it('should have component ID matching pattern', () => {
      expect((component as any).componentId).toMatch(/^cancel-unfilled-orders-\d+$/);
    });

    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('cancel-unfilled-orders-');
      expect(id).toContain('-test');
    });

    it('should generate unique IDs for different elements', () => {
      const id1 = (component as any).elementId('btn');
      const id2 = (component as any).elementId('input');
      expect(id1).not.toEqual(id2);
    });
  });

  // ── Hours Old Options ─────────────────────────────────────────────────

  describe('Hours Old Options', () => {
    it('should have 10 predefined options', () => {
      expect(component.hoursOldOptions.length).toBe(10);
    });

    it('should start with 12 and end with 720', () => {
      expect(component.hoursOldOptions[0].value).toBe(12);
      expect(component.hoursOldOptions[component.hoursOldOptions.length - 1].value).toBe(720);
    });
  });

  // ── Form Value Changes ────────────────────────────────────────────────

  describe('Form Value Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load eligible orders when hoursOld changes to a value', fakeAsync(() => {
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(of(mockEligibleOrders));

      component.searchForm.get('hoursOld')!.setValue(24);
      tick();

      expect(cancelOrdersServiceSpy.getEligibleOrdersLov).toHaveBeenCalledWith(24);
      expect(component.eligibleOrders()).toEqual(mockEligibleOrders);
    }));

    it('should clear eligible orders when hoursOld changes to null', fakeAsync(() => {
      component.eligibleOrders.set(mockEligibleOrders);
      component.searchForm.get('hoursOld')!.setValue(null);
      tick();

      expect(component.eligibleOrders()).toEqual([]);
    }));

    it('should clear orderNo when hoursOld changes', fakeAsync(() => {
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(of([]));
      component.searchForm.patchValue({ orderNo: 'ORD-001' }, { emitEvent: false });

      component.searchForm.get('hoursOld')!.setValue(48);
      tick();

      expect(component.searchForm.get('orderNo')!.value).toBeNull();
    }));

    it('should clear order display when hoursOld changes', fakeAsync(() => {
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(of([]));
      component.selectedOrder.set(mockOrderDetail);
      component.orderItems.set(mockOrderItems);

      component.searchForm.get('hoursOld')!.setValue(24);
      tick();

      expect(component.selectedOrder()).toBeNull();
      expect(component.orderItems()).toEqual([]);
    }));

    it('should load order details when orderNo changes', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(cancelOrdersServiceSpy.getOrderDetails).toHaveBeenCalledWith('ORD-001');
      expect(component.selectedOrder()).toEqual(mockOrderWithItems);
    }));

    it('should not load order details when orderNo set to null', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.calls.reset();

      component.searchForm.get('orderNo')!.setValue(null);
      tick();

      expect(cancelOrdersServiceSpy.getOrderDetails).not.toHaveBeenCalled();
    }));

    it('should set loading state when eligible orders are loading', fakeAsync(() => {
      const subject = new Subject<EligibleOrderLovDto[]>();
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(subject.asObservable());

      component.searchForm.get('hoursOld')!.setValue(24);
      tick();

      expect(component.loadingOrders()).toBeTrue();

      subject.next(mockEligibleOrders);
      subject.complete();
      tick();

      expect(component.loadingOrders()).toBeFalse();
    }));

    it('should clear loading state on eligible orders error', fakeAsync(() => {
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(throwError(() => new Error('fail')));

      component.searchForm.get('hoursOld')!.setValue(24);
      tick();

      expect(component.loadingOrders()).toBeFalse();
    }));
  });

  // ── Search Controls ───────────────────────────────────────────────────

  describe('Search Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update orderSearchText when orderSearchCtrl changes', () => {
      component.orderSearchCtrl.setValue('ORD');
      expect((component as any).orderSearchText()).toBe('ORD');
    });

    it('should update typeSearchText when typeSearchCtrl changes', () => {
      component.typeSearchCtrl.setValue('Regular');
      expect((component as any).typeSearchText()).toBe('Regular');
    });

    it('should handle null search control values', () => {
      component.orderSearchCtrl.setValue(null);
      expect((component as any).orderSearchText()).toBe('');
    });
  });

  // ── Filtered Computed Signals ─────────────────────────────────────────

  describe('Filtered Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('filteredOrders', () => {
      beforeEach(() => {
        component.eligibleOrders.set(mockEligibleOrders);
      });

      it('should return all orders when no search text', () => {
        expect(component.filteredOrders()).toEqual(mockEligibleOrders);
      });

      it('should filter by order number', () => {
        component.orderSearchCtrl.setValue('ORD-001');
        expect(component.filteredOrders().length).toBe(1);
        expect(component.filteredOrders()[0].orderNo).toBe('ORD-001');
      });

      it('should filter by customer name', () => {
        component.orderSearchCtrl.setValue('dallas');
        expect(component.filteredOrders().length).toBe(1);
        expect(component.filteredOrders()[0].customerName).toBe('Dallas Medical');
      });

      it('should be case-insensitive', () => {
        component.orderSearchCtrl.setValue('PARKLAND');
        expect(component.filteredOrders().length).toBe(1);
      });

      it('should return empty when no match', () => {
        component.orderSearchCtrl.setValue('NONEXISTENT');
        expect(component.filteredOrders().length).toBe(0);
      });

      it('should handle null customerName gracefully', () => {
        component.eligibleOrders.set([
          { orderNo: 'ORD-003', customerId: 'CUST003', customerName: null, orderStatus: 'OR', ageInHours: 10 }
        ]);
        component.orderSearchCtrl.setValue('CUST');
        expect(component.filteredOrders().length).toBe(0);
      });
    });

    describe('filteredOrderTypes', () => {
      it('should return all types when no search text', () => {
        expect(component.filteredOrderTypes()).toEqual(mockOrderTypes);
      });

      it('should filter by order type code', () => {
        component.typeSearchCtrl.setValue('RE');
        expect(component.filteredOrderTypes().length).toBe(1);
        expect(component.filteredOrderTypes()[0].orderType).toBe('RE');
      });

      it('should filter by order type description', () => {
        component.typeSearchCtrl.setValue('special');
        expect(component.filteredOrderTypes().length).toBe(1);
        expect(component.filteredOrderTypes()[0].orderTypeDesc).toBe('Special Order');
      });

      it('should return empty when no match', () => {
        component.typeSearchCtrl.setValue('ZZZZZ');
        expect(component.filteredOrderTypes().length).toBe(0);
      });
    });
  });

  // ── Computed Properties ───────────────────────────────────────────────

  describe('Computed Properties', () => {
    it('should compute hasSelectedOrder as false initially', () => {
      expect(component.hasSelectedOrder()).toBeFalse();
    });

    it('should compute hasSelectedOrder as true when order set', () => {
      component.selectedOrder.set(mockOrderDetail);
      expect(component.hasSelectedOrder()).toBeTrue();
    });

    it('should compute hasOrderItems as false initially', () => {
      expect(component.hasOrderItems()).toBeFalse();
    });

    it('should compute hasOrderItems as true when items set', () => {
      component.orderItems.set(mockOrderItems);
      expect(component.hasOrderItems()).toBeTrue();
    });

    it('should compute hasUnfilledItems from order hasUnfilledItems flag', () => {
      component.selectedOrder.set({ ...mockOrderDetail, hasUnfilledItems: true });
      expect(component.hasUnfilledItems()).toBeTrue();

      component.selectedOrder.set({ ...mockOrderDetail, hasUnfilledItems: false });
      expect(component.hasUnfilledItems()).toBeFalse();
    });

    it('should compute hasUnfilledItems from items balance when flag undefined', () => {
      const orderNoFlag = { ...mockOrderDetail } as any;
      delete orderNoFlag.hasUnfilledItems;
      component.selectedOrder.set(orderNoFlag);
      component.orderItems.set([
        { ...mockOrderItems[0], balance: 5 }
      ]);
      expect(component.hasUnfilledItems()).toBeTrue();
    });

    it('should compute hasUnfilledItems as false when all balances are 0', () => {
      const orderNoFlag = { ...mockOrderDetail } as any;
      delete orderNoFlag.hasUnfilledItems;
      component.selectedOrder.set(orderNoFlag);
      component.orderItems.set([
        { ...mockOrderItems[0], balance: 0 },
        { ...mockOrderItems[1], balance: 0 }
      ]);
      expect(component.hasUnfilledItems()).toBeFalse();
    });

    it('should compute canCancel as true when order selected, has unfilled items, not loading', () => {
      component.selectedOrder.set(mockOrderWithItems);
      component.orderItems.set(mockOrderItems);
      expect(component.canCancel()).toBeTrue();
    });

    it('should compute canCancel as false when no order selected', () => {
      expect(component.canCancel()).toBeFalse();
    });

    it('should compute canCancel as false when cancelLoading is true', () => {
      component.selectedOrder.set(mockOrderWithItems);
      component.orderItems.set(mockOrderItems);
      component.cancelLoading.set(true);
      expect(component.canCancel()).toBeFalse();
    });

    it('should compute canCancel as false when no unfilled items', () => {
      component.selectedOrder.set({ ...mockOrderDetail, hasUnfilledItems: false });
      expect(component.canCancel()).toBeFalse();
    });
  });

  // ── Retrieve Functionality ────────────────────────────────────────────

  describe('Retrieve Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set submitted to true on retrieve', () => {
      component.searchForm.patchValue({ hoursOld: 24 }, { emitEvent: false });
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(of([]));
      component.onRetrieve();
      expect(component.submitted()).toBeTrue();
    });

    it('should load order details when orderNo is set', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.searchForm.patchValue({ orderNo: 'ORD-001', hoursOld: 24 }, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect(cancelOrdersServiceSpy.getOrderDetails).toHaveBeenCalledWith('ORD-001');
    }));

    it('should prioritize orderNo over hoursOld', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.searchForm.patchValue({ orderNo: 'ORD-001', hoursOld: 24 }, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect(cancelOrdersServiceSpy.getOrderDetails).toHaveBeenCalled();
      expect(cancelOrdersServiceSpy.getEligibleOrdersLov).not.toHaveBeenCalledWith(24);
    }));

    it('should load eligible orders when only hoursOld set', fakeAsync(() => {
      cancelOrdersServiceSpy.getEligibleOrdersLov.and.returnValue(of(mockEligibleOrders));

      component.searchForm.patchValue({ hoursOld: 24, orderNo: null }, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect(cancelOrdersServiceSpy.getEligibleOrdersLov).toHaveBeenCalledWith(24);
    }));

    it('should show error when neither hours old nor order number provided', () => {
      component.searchForm.reset(null, { emitEvent: false });
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please select Hours Old or enter an Order number.'
      );
    });
  });

  // ── Load Order Details ────────────────────────────────────────────────

  describe('Load Order Details', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set searchLoading while loading', fakeAsync(() => {
      const subject = new Subject<OrderDetailDto>();
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(subject.asObservable());

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(component.searchLoading()).toBeTrue();

      subject.next(mockOrderWithItems);
      subject.complete();
      tick();

      expect(component.searchLoading()).toBeFalse();
    }));

    it('should populate selectedOrder on success', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(component.selectedOrder()).toEqual(mockOrderWithItems);
    }));

    it('should calculate balance for each item', fakeAsync(() => {
      const orderWithRawItems: OrderDetailDto = {
        ...mockOrderDetail,
        orderItems: [
          {
            chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
            productType: 'WB', productTypeDesc: 'Whole Blood',
            bloodType: '51', aboDesc: 'O +', tier: 1,
            requiredQty: 10, allocatedQty: 3, canceledQty: 2, systemCancelQty: 1,
            shippedQty: 0, itemStatus: 'OR', unfilledQty: 4
          }
        ]
      };
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(orderWithRawItems));

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(component.orderItems()[0].balance).toBe(4);
    }));

    it('should update table pagination on success', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(component.itemsTableConfig.pagination?.totalRecords).toBe(2);
      expect(component.itemsTableConfig.pagination?.pageIndex).toBe(0);
    }));

    it('should handle empty orderItems array', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderDetail));

      component.searchForm.get('orderNo')!.setValue('ORD-001');
      tick();

      expect(component.orderItems()).toEqual([]);
    }));

    it('should show error snackbar on failure', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(
        throwError(() => ({ error: { message: 'Order not found' } }))
      );

      component.searchForm.get('orderNo')!.setValue('ORD-999');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order not found');
      expect(component.searchLoading()).toBeFalse();
    }));

    it('should use default message when error has no message', fakeAsync(() => {
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(
        throwError(() => ({}))
      );

      component.searchForm.get('orderNo')!.setValue('ORD-999');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load order details');
    }));
  });

  // ── Chapter Changes ───────────────────────────────────────────────────

  describe('Chapter Changes', () => {
    it('should clear all and reload lookups on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      cancelOrdersServiceSpy.getOrderTypes.calls.reset();
      cancelOrdersServiceSpy.getOrderClasses.calls.reset();

      component.selectedOrder.set(mockOrderDetail);
      component.orderItems.set(mockOrderItems);
      component.submitted.set(true);

      chapterChanged$.next();
      tick();

      expect(component.selectedOrder()).toBeNull();
      expect(component.orderItems()).toEqual([]);
      expect(cancelOrdersServiceSpy.getOrderTypes).toHaveBeenCalled();
      expect(cancelOrdersServiceSpy.getOrderClasses).toHaveBeenCalled();
    }));
  });

  // ── Clear All ─────────────────────────────────────────────────────────

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form fields', () => {
      component.searchForm.patchValue({ hoursOld: 24, orderNo: 'ORD-001', orderType: 'RE' }, { emitEvent: false });
      component.clearAll();

      expect(component.searchForm.get('hoursOld')?.value).toBeNull();
      expect(component.searchForm.get('orderNo')?.value).toBeNull();
      expect(component.searchForm.get('orderType')?.value).toBeNull();
    });

    it('should clear submitted flag', () => {
      component.submitted.set(true);
      component.clearAll();
      expect(component.submitted()).toBeFalse();
    });

    it('should clear eligible orders', () => {
      component.eligibleOrders.set(mockEligibleOrders);
      component.clearAll();
      expect(component.eligibleOrders()).toEqual([]);
    });

    it('should clear search controls', () => {
      component.orderSearchCtrl.setValue('test');
      component.typeSearchCtrl.setValue('test');
      component.clearAll();
      expect(component.orderSearchCtrl.value).toBe('');
      expect(component.typeSearchCtrl.value).toBe('');
    });

    it('should clear order display', () => {
      component.selectedOrder.set(mockOrderDetail);
      component.orderItems.set(mockOrderItems);
      component.clearAll();
      expect(component.selectedOrder()).toBeNull();
      expect(component.orderItems()).toEqual([]);
    });
  });

  // ── Cancel Order ──────────────────────────────────────────────────────

  describe('Cancel Order', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedOrder.set(mockOrderWithItems);
      component.orderItems.set(mockOrderItems);
    });

    it('should not open dialog if no order selected', () => {
      component.selectedOrder.set(null);
      component.onCancelUnfilledItems();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show no-unfilled-items dialog when hasUnfilledItems is false', () => {
      component.selectedOrder.set({ ...mockOrderWithItems, hasUnfilledItems: false });

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('ok'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelUnfilledItems();

      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any).title).toBe('No Unfilled Items Found');
      expect((dialogConfig?.data as any).primaryAction.label).toBe('OK');
      expect((dialogConfig?.data as any).secondaryAction).toBeUndefined();
      expect(dialogConfig?.width).toBe('500px');
      expect(dialogConfig?.disableClose).toBeFalse();
    });

    it('should open confirmation dialog with correct config', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('no'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelUnfilledItems();

      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any).title).toBe('Cancel Unfilled Items');
      expect((dialogConfig?.data as any).primaryAction.label).toBe('YES, CANCEL UNFILLED ITEMS');
      expect((dialogConfig?.data as any).primaryAction.action).toBe('yes');
      expect((dialogConfig?.data as any).secondaryAction.label).toBe('NO, KEEP ORDER');
      expect((dialogConfig?.data as any).secondaryAction.action).toBe('no');
      expect(dialogConfig?.width).toBe('550px');
      expect(dialogConfig?.disableClose).toBeTrue();
      expect(dialogConfig?.autoFocus).toBeFalse();
    });

    it('should execute cancellation when user confirms with yes', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const cancelResponse: CancelOrderResponseDto = {
        orderNo: 'ORD-001',
        message: 'Successfully canceled unfilled portions. 1 item(s) updated.',
        itemsUpdated: 1,
        success: true
      };
      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(of(cancelResponse));
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.onCancelUnfilledItems();
      tick();

      expect(cancelOrdersServiceSpy.cancelUnfilledOrder).toHaveBeenCalledWith(
        'ORD-001',
        { Confirmation: 'Y' }
      );
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(cancelResponse.message);
    }));

    it('should not cancel when user declines with no', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('no'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelUnfilledItems();
      tick();

      expect(cancelOrdersServiceSpy.cancelUnfilledOrder).not.toHaveBeenCalled();
    }));

    it('should not cancel when dialog dismissed without result', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCancelUnfilledItems();
      tick();

      expect(cancelOrdersServiceSpy.cancelUnfilledOrder).not.toHaveBeenCalled();
    }));

    it('should set cancelLoading during cancellation', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const subject = new Subject<CancelOrderResponseDto>();
      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(subject.asObservable());

      component.onCancelUnfilledItems();
      tick();

      expect(component.cancelLoading()).toBeTrue();

      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));
      subject.next({
        orderNo: 'ORD-001', message: 'Done', itemsUpdated: 1, success: true
      });
      subject.complete();
      tick();

      expect(component.cancelLoading()).toBeFalse();
    }));

    it('should update view with updatedOrder from response', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const updatedOrder: OrderDetailDto = {
        ...mockOrderDetail,
        hasUnfilledItems: false,
        orderItems: [
          { ...mockOrderItems[0], canceledQty: 1, itemStatus: 'CA', balance: 0 },
          { ...mockOrderItems[1] }
        ]
      };

      const cancelResponse: CancelOrderResponseDto = {
        orderNo: 'ORD-001',
        message: 'Transaction committed',
        itemsUpdated: 1,
        success: true,
        updatedOrder
      };
      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(of(cancelResponse));

      component.onCancelUnfilledItems();
      tick();

      expect(component.selectedOrder()).toEqual(updatedOrder);
      expect(component.orderItems().length).toBe(2);
      expect(cancelOrdersServiceSpy.getOrderDetails).not.toHaveBeenCalled();
    }));

    it('should reload order details when response has no updatedOrder', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const cancelResponse: CancelOrderResponseDto = {
        orderNo: 'ORD-001',
        message: 'Transaction committed',
        itemsUpdated: 1,
        success: true
      };
      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(of(cancelResponse));
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.onCancelUnfilledItems();
      tick();

      expect(cancelOrdersServiceSpy.getOrderDetails).toHaveBeenCalledWith('ORD-001');
    }));

    it('should use default success message when response message is empty', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const cancelResponse: CancelOrderResponseDto = {
        orderNo: 'ORD-001',
        message: '',
        itemsUpdated: 1,
        success: true
      };
      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(of(cancelResponse));
      cancelOrdersServiceSpy.getOrderDetails.and.returnValue(of(mockOrderWithItems));

      component.onCancelUnfilledItems();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Transaction committed');
    }));

    it('should handle cancellation API error', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(
        throwError(() => ({ error: { message: 'Cancellation failed' } }))
      );

      component.onCancelUnfilledItems();
      tick();

      expect(component.cancelLoading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cancellation failed');
    }));

    it('should handle error with errorResponse format', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Order locked by another user' } } }))
      );

      component.onCancelUnfilledItems();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order locked by another user');
    }));

    it('should handle error with Message (capitalized) format', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(
        throwError(() => ({ error: { Message: 'Server Error' } }))
      );

      component.onCancelUnfilledItems();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server Error');
    }));

    it('should use default error message when error has no message properties', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('yes'));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      cancelOrdersServiceSpy.cancelUnfilledOrder.and.returnValue(
        throwError(() => ({}))
      );

      component.onCancelUnfilledItems();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to cancel order');
    }));
  });

  // ── Balance Calculation ───────────────────────────────────────────────

  describe('Balance Calculation', () => {
    it('should calculate balance as required - allocated - canceled - systemCanceled', () => {
      const item: OrderItemDetailDto = {
        chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
        productType: 'WB', productTypeDesc: 'Whole Blood',
        bloodType: '51', aboDesc: 'O +', tier: 1,
        requiredQty: 10, allocatedQty: 3, canceledQty: 2, systemCancelQty: 1,
        shippedQty: 0, itemStatus: 'OR', unfilledQty: 4
      };
      expect((component as any).calculateBalance(item)).toBe(4);
    });

    it('should return 0 when fully allocated', () => {
      const item: OrderItemDetailDto = {
        chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
        productType: 'WB', productTypeDesc: 'Whole Blood',
        bloodType: '51', aboDesc: 'O +', tier: 1,
        requiredQty: 5, allocatedQty: 5, canceledQty: 0, systemCancelQty: 0,
        shippedQty: 0, itemStatus: 'AL', unfilledQty: 0
      };
      expect((component as any).calculateBalance(item)).toBe(0);
    });

    it('should return 0 when balance would be negative', () => {
      const item: OrderItemDetailDto = {
        chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
        productType: 'WB', productTypeDesc: null,
        bloodType: null, aboDesc: null, tier: null,
        requiredQty: 5, allocatedQty: 3, canceledQty: 3, systemCancelQty: 0,
        shippedQty: 0, itemStatus: 'OR', unfilledQty: 0
      };
      expect((component as any).calculateBalance(item)).toBe(0);
    });

    it('should handle null quantities by treating them as 0', () => {
      const item: OrderItemDetailDto = {
        chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
        productType: 'WB', productTypeDesc: null,
        bloodType: null, aboDesc: null, tier: null,
        requiredQty: null, allocatedQty: null, canceledQty: null, systemCancelQty: null,
        shippedQty: null, itemStatus: null, unfilledQty: null
      };
      expect((component as any).calculateBalance(item)).toBe(0);
    });

    it('should handle partial null quantities', () => {
      const item: OrderItemDetailDto = {
        chapterId: 'TEST', orderNo: 'ORD-001', itemNo: 1,
        productType: 'WB', productTypeDesc: null,
        bloodType: null, aboDesc: null, tier: null,
        requiredQty: 10, allocatedQty: null, canceledQty: 2, systemCancelQty: null,
        shippedQty: null, itemStatus: 'OR', unfilledQty: null
      };
      expect((component as any).calculateBalance(item)).toBe(8);
    });
  });

  // ── Format Helpers ────────────────────────────────────────────────────

  describe('Format Helpers', () => {
    describe('formatStandingOrder', () => {
      it('should return Yes for Y', () => {
        expect((component as any).formatStandingOrder('Y')).toBe('Yes');
      });

      it('should return No for N', () => {
        expect((component as any).formatStandingOrder('N')).toBe('No');
      });

      it('should return -- for null', () => {
        expect((component as any).formatStandingOrder(null)).toBe('--');
      });
    });

    describe('formatCustomer', () => {
      it('should format as customerId - customerName', () => {
        expect((component as any).formatCustomer(mockOrderDetail)).toBe('DAL-RG0001 - Parkland Hospital');
      });

      it('should return customerId only when customerName is null', () => {
        expect((component as any).formatCustomer({ ...mockOrderDetail, customerName: null })).toBe('DAL-RG0001');
      });

      it('should return -- when customerId is empty/falsy', () => {
        expect((component as any).formatCustomer({ ...mockOrderDetail, customerId: '' })).toBe('--');
      });
    });

    describe('formatDate', () => {
      it('should return -- for null', () => {
        expect((component as any).formatDate(null)).toBe('--');
      });

      it('should return -- for invalid date string', () => {
        expect((component as any).formatDate('not-a-date')).toBe('--');
      });

      it('should format valid date with month abbreviation', () => {
        const result = (component as any).formatDate('2025-03-01T09:00:00Z');
        expect(result).toContain('MAR');
        expect(result).toContain('2025');
      });

      it('should include AM/PM indicator', () => {
        const resultAM = (component as any).formatDate('2025-03-01T05:30:00Z');
        expect(resultAM).toMatch(/AM|PM/);
      });

      it('should return -- for empty string', () => {
        expect((component as any).formatDate('')).toBe('--');
      });
    });

    describe('formatOrderType', () => {
      it('should format as orderType - orderTypeDesc', () => {
        expect((component as any).formatOrderType(mockOrderDetail)).toBe('RE - Regular Order');
      });

      it('should return -- when orderType is null', () => {
        expect((component as any).formatOrderType({ ...mockOrderDetail, orderType: null })).toBe('--');
      });

      it('should return orderType only when orderTypeDesc is null', () => {
        expect((component as any).formatOrderType({ ...mockOrderDetail, orderTypeDesc: null })).toBe('RE');
      });
    });

    describe('formatOrderClass', () => {
      it('should format as orderClass - orderClassDesc', () => {
        expect((component as any).formatOrderClass(mockOrderDetail)).toBe('RE - Routine');
      });

      it('should return -- when orderClass is null', () => {
        expect((component as any).formatOrderClass({ ...mockOrderDetail, orderClass: null })).toBe('--');
      });

      it('should return orderClass only when orderClassDesc is null', () => {
        expect((component as any).formatOrderClass({ ...mockOrderDetail, orderClassDesc: null })).toBe('RE');
      });
    });
  });

  // ── Status Badge ──────────────────────────────────────────────────────

  describe('Status Badge', () => {
    it('should return Ordered for OR', () => {
      const info = (component as any).getStatusInfo('OR');
      expect(info).toEqual({ label: 'Ordered', cssClass: 'status-ordered' });
    });

    it('should return Back Order for BO', () => {
      const info = (component as any).getStatusInfo('BO');
      expect(info).toEqual({ label: 'Back Order', cssClass: 'status-backordered' });
    });

    it('should return Allocated for AL', () => {
      const info = (component as any).getStatusInfo('AL');
      expect(info).toEqual({ label: 'Allocated', cssClass: 'status-allocated' });
    });

    it('should return Packed for PK', () => {
      const info = (component as any).getStatusInfo('PK');
      expect(info).toEqual({ label: 'Packed', cssClass: 'status-packed' });
    });

    it('should return Shipped for SH', () => {
      const info = (component as any).getStatusInfo('SH');
      expect(info).toEqual({ label: 'Shipped', cssClass: 'status-shipped' });
    });

    it('should return Closed for CL', () => {
      const info = (component as any).getStatusInfo('CL');
      expect(info).toEqual({ label: 'Closed', cssClass: 'status-closed' });
    });

    it('should return System Cancelled for SY', () => {
      const info = (component as any).getStatusInfo('SY');
      expect(info).toEqual({ label: 'System Cancelled', cssClass: 'status-cancelled' });
    });

    it('should return Cancelled for CA', () => {
      const info = (component as any).getStatusInfo('CA');
      expect(info).toEqual({ label: 'Cancelled', cssClass: 'status-cancelled' });
    });

    it('should return Delivered for DL', () => {
      const info = (component as any).getStatusInfo('DL');
      expect(info).toEqual({ label: 'Delivered', cssClass: 'status-delivered' });
    });

    it('should return raw code for unknown status', () => {
      const info = (component as any).getStatusInfo('XX');
      expect(info).toEqual({ label: 'XX', cssClass: '' });
    });

    it('should return -- for null status', () => {
      const info = (component as any).getStatusInfo(null);
      expect(info).toEqual({ label: '--', cssClass: '' });
    });
  });

  // ── Table Column Value Formatters ─────────────────────────────────────

  describe('Table Column Value Formatters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format canceledQty null as 0', () => {
      const col = component.itemsTableConfig.columns.find(c => c.key === 'canceledQty');
      expect(col?.valueFormatter?.(null, {} as any)).toBe('0');
    });

    it('should format canceledQty with value', () => {
      const col = component.itemsTableConfig.columns.find(c => c.key === 'canceledQty');
      expect(col?.valueFormatter?.(3, {} as any)).toBe('3');
    });

    it('should format balance 0 as --', () => {
      const col = component.itemsTableConfig.columns.find(c => c.key === 'balance');
      expect(col?.valueFormatter?.(0, {} as any)).toBe('--');
    });

    it('should format balance null as --', () => {
      const col = component.itemsTableConfig.columns.find(c => c.key === 'balance');
      expect(col?.valueFormatter?.(null, {} as any)).toBe('--');
    });

    it('should format balance with positive value', () => {
      const col = component.itemsTableConfig.columns.find(c => c.key === 'balance');
      expect(col?.valueFormatter?.(5, {} as any)).toBe('5');
    });
  });

  // ── ngAfterViewInit ───────────────────────────────────────────────────

  describe('ngAfterViewInit', () => {
    it('should update itemStatus column with statusCellTpl', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      const statusCol = component.itemsTableConfig.columns.find(c => c.key === 'itemStatus');
      expect(statusCol?.cellTemplate).toBeTruthy();
      expect(statusCol?.valueFormatter).toBeUndefined();
    });

    it('should not modify non-itemStatus columns', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      const otherCol = component.itemsTableConfig.columns.find(c => c.key === 'itemNo');
      expect(otherCol?.cellTemplate).toBeUndefined();
    });
  });

  // ── onPageChange ──────────────────────────────────────────────────────

  describe('onPageChange', () => {
    it('should be a no-op', () => {
      expect(() => component.onPageChange({ pageIndex: 1, pageSize: 10 } as any)).not.toThrow();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should emit on destroy$ subject', () => {
      fixture.detectChanges();
      nextSpy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });
  });
});
