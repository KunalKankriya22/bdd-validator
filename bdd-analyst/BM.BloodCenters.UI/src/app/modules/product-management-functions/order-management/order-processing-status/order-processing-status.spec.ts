import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { OrderProcessingStatusComponent } from './order-processing-status';
import { OrderProcessingStatusService } from './services/order-processing-status.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  OrderProcessingStatusResponseDto,
  OrderStatusCodeDto,
  OrderType
} from './models/order-processing-status.model';

describe('OrderProcessingStatusComponent', () => {
  let component: OrderProcessingStatusComponent;
  let fixture: ComponentFixture<OrderProcessingStatusComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderProcessingStatusService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockOrderData: OrderProcessingStatusResponseDto = {
    statOrders: [
      {
        orderNo: 'ORD001',
        orderClass: 'ST',
        orderStatus: 'OP',
        insertDate: '2024-06-01T08:30:00Z',
        chapterId: 'CH001',
        orderAge: 24
      }
    ],
    asapOrders: [
      {
        orderNo: 'ORD002',
        orderClass: 'AS',
        orderStatus: 'PE',
        insertDate: '2024-06-01T10:15:00Z',
        chapterId: 'CH001',
        orderAge: 18
      }
    ],
    routineOrders: [],
    standingOrders: [],
    statCount: 1,
    asapCount: 1,
    routineCount: 0,
    standingCount: 0
  };

  const mockStatusCodes: OrderStatusCodeDto[] = [
    { code: 'AL', codeDesc: 'Allocated' },
    { code: 'OP', codeDesc: 'Open' },
    { code: 'PE', codeDesc: 'Pending' }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    orderServiceSpy = jasmine.createSpyObj('OrderProcessingStatusService', [
      'getOrderProcessingStatus',
      'getOrderStatusCodes',
      'getOrderDetail',
      'getOrderNotes',
      'getAuditTrail',
      'getOrderedAntigens',
      'getOrderedAttributes',
      'getOrderCharges'
    ]);
    orderServiceSpy.getOrderProcessingStatus.and.returnValue(of(mockOrderData));
    orderServiceSpy.getOrderStatusCodes.and.returnValue(of(mockStatusCodes));
    orderServiceSpy.getOrderDetail.and.returnValue(of(null));
    orderServiceSpy.getOrderNotes.and.returnValue(of(null));
    orderServiceSpy.getAuditTrail.and.returnValue(of([]));
    orderServiceSpy.getOrderedAntigens.and.returnValue(of([]));
    orderServiceSpy.getOrderedAttributes.and.returnValue(of([]));
    orderServiceSpy.getOrderCharges.and.returnValue(of(null));

    snackbarServiceSpy = createMockSnackbarService();

    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [OrderProcessingStatusComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: OrderProcessingStatusService, useValue: orderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });
      orderServiceSpy.getOrderProcessingStatus.and.returnValue(of(mockOrderData));


      orderServiceSpy.getOrderStatusCodes.and.returnValue(of(mockStatusCodes));


      orderServiceSpy.getOrderDetail.and.returnValue(of(null));


      orderServiceSpy.getOrderNotes.and.returnValue(of(null));


      orderServiceSpy.getAuditTrail.and.returnValue(of([]));


      orderServiceSpy.getOrderedAntigens.and.returnValue(of([]));


      orderServiceSpy.getOrderedAttributes.and.returnValue(of([]));


      orderServiceSpy.getOrderCharges.and.returnValue(of(null));


    fixture = TestBed.createComponent(OrderProcessingStatusComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load status codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(orderServiceSpy.getOrderStatusCodes).toHaveBeenCalled();
      expect(component['statusCodes']()).toEqual(mockStatusCodes);
    }));

    it('should load orders on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(orderServiceSpy.getOrderProcessingStatus).toHaveBeenCalled();
      expect(component['orderData']()).toEqual(mockOrderData);
    }));


  });
  describe('Tab Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should default to STAT tab', () => {
      expect(component['selectedTab']()).toBe(OrderType.STAT);
    });

    it('should change tab when onTabChange is called', () => {
      (component as any).onTabChange(OrderType.ASAP);
      expect(component['selectedTab']()).toBe(OrderType.ASAP);
    });



    it('should have tab labels', () => {
      const labels = component['tabLabels'];
      expect(labels[0]).toContain('STAT Order');
      expect(labels[1]).toContain('ASAP Order');
      expect(labels[2]).toContain('Routine Order');
      expect(labels[3]).toContain('Standing Order');
    });
  });

  describe('Order Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should select order when onOrderRowClick is called', () => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);

      expect(component['selectedOrder']()).toBe(order);
    });


  });

  describe('Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));







    it('should clear all filters, search, and selection', () => {
      component['filters'].set({ age: 24 });
      component['searchText'].set('test');
      component['selectedOrder'].set(mockOrderData.statOrders[0]);

      (component as any).clearAll();

      expect(component['filters']()).toEqual({});
      expect(component['searchText']()).toBe('');
      expect(component['selectedOrder']()).toBeNull();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should show all orders when search is cleared', () => {
      component['searchText'].set('ORD001');
      component['searchText'].set('');

      const currentOrders = component['currentOrders']();
      expect(currentOrders.length).toBe(1); // 1 STAT order in mock data
    });
  });

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute current orders for selected tab', () => {
      component['selectedTab'].set(OrderType.STAT);
      expect(component['currentOrders']()).toEqual(mockOrderData.statOrders);

      component['selectedTab'].set(OrderType.ASAP);
      expect(component['currentOrders']()).toEqual(mockOrderData.asapOrders);
    });

    it('should compute current count for selected tab', () => {
      component['selectedTab'].set(OrderType.STAT);
      expect(component['currentCount']()).toBe(1);

      component['selectedTab'].set(OrderType.ROUTINE);
      expect(component['currentCount']()).toBe(0);
    });

    it('should compute isEmpty correctly', () => {
      component['selectedTab'].set(OrderType.STAT);
      expect(component['isEmpty']()).toBe(false);

      component['selectedTab'].set(OrderType.ROUTINE);
      expect(component['isEmpty']()).toBe(true);
    });

    it('should compute hasData correctly', () => {
      expect(component['hasData']()).toBe(true);

      component['orderData'].set(null);
      expect(component['hasData']()).toBe(false);
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should reload data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCallCount = orderServiceSpy.getOrderProcessingStatus.calls.count();

      chapterChanged$.next();
      tick();

      expect(orderServiceSpy.getOrderProcessingStatus.calls.count()).toBe(initialCallCount + 1);
    }));


  });
  describe('Accessibility', () => {


    it('should generate unique IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(OrderProcessingStatusComponent);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
      expect((component as any).elementId('test')).not.toBe((component2 as any).elementId('test'));
    });
  });

  describe('Retry Functionality', () => {
    it('should reload orders when retry is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCallCount = orderServiceSpy.getOrderProcessingStatus.calls.count();

      (component as any).retry();
      tick();

      expect(orderServiceSpy.getOrderProcessingStatus.calls.count()).toBe(initialCallCount + 1);
    }));
  });

  describe('loadOrders error path', () => {
    it('should set error signal and show snackbar on loadOrders failure', fakeAsync(() => {
      const errorResponse = { error: { message: 'Server error' } };
      orderServiceSpy.getOrderProcessingStatus.and.returnValue(throwError(() => errorResponse));
      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Server error');
      expect(component['loading']()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should use default error message when error.error.message is absent', fakeAsync(() => {
      orderServiceSpy.getOrderProcessingStatus.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Failed to load order processing status. Please try again.');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load order processing status. Please try again.');
    }));
  });

  describe('loadStatusCodes error path', () => {
    it('should log error to console when loadStatusCodes fails', fakeAsync(() => {
      spyOn(console, 'error');
      orderServiceSpy.getOrderStatusCodes.and.returnValue(throwError(() => new Error('codes fail')));
      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalledWith('Failed to load status codes:', jasmine.any(Error));
    }));
  });

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set searchText signal', () => {
      (component as any).onSearch('test-search');
      expect(component['searchText']()).toBe('test-search');
    });
  });

  describe('toggleFilter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should toggle filterOpen from false to true', () => {
      expect(component['filterOpen']()).toBe(false);
      (component as any).toggleFilter();
      expect(component['filterOpen']()).toBe(true);
    });

    it('should toggle filterOpen from true to false', () => {
      component['filterOpen'].set(true);
      (component as any).toggleFilter();
      expect(component['filterOpen']()).toBe(false);
    });
  });

  describe('onApplyFilters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set filters, close filter panel, reset skip, and reload orders', fakeAsync(() => {
      component['filterOpen'].set(true);
      component['skip'].set(10);
      const callsBefore = orderServiceSpy.getOrderProcessingStatus.calls.count();

      const newFilters = { age: 48, orderStatus: 'AL' };
      (component as any).onApplyFilters(newFilters);
      tick();

      expect(component['filters']()).toEqual(newFilters);
      expect(component['filterOpen']()).toBe(false);
      expect(component['skip']()).toBe(0);
      expect(orderServiceSpy.getOrderProcessingStatus.calls.count()).toBe(callsBefore + 1);
    }));
  });

  describe('onClearFilters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear filters, search, close filter panel, reset skip, and reload', fakeAsync(() => {
      component['filters'].set({ age: 24 });
      component['searchText'].set('search');
      component['filterOpen'].set(true);
      component['skip'].set(10);
      const callsBefore = orderServiceSpy.getOrderProcessingStatus.calls.count();

      (component as any).onClearFilters();
      tick();

      expect(component['filters']()).toEqual({});
      expect(component['searchText']()).toBe('');
      expect(component['filterOpen']()).toBe(false);
      expect(component['skip']()).toBe(0);
      expect(orderServiceSpy.getOrderProcessingStatus.calls.count()).toBe(callsBefore + 1);
    }));
  });

  describe('onRemoveChip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should remove the specified key from filters, reset skip, and reload', fakeAsync(() => {
      component['filters'].set({ age: 24, orderStatus: 'OP' });
      component['skip'].set(10);
      const callsBefore = orderServiceSpy.getOrderProcessingStatus.calls.count();

      (component as any).onRemoveChip('age');
      tick();

      expect(component['filters']()).toEqual({ orderStatus: 'OP' });
      expect(component['skip']()).toBe(0);
      expect(orderServiceSpy.getOrderProcessingStatus.calls.count()).toBe(callsBefore + 1);
    }));
  });

  describe('getStatusColor', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return the correct color for a known status', () => {
      expect((component as any).getStatusColor('OR')).toBe('teal');
      expect((component as any).getStatusColor('BO')).toBe('orange');
      expect((component as any).getStatusColor('CA')).toBe('red');
      expect((component as any).getStatusColor('PI')).toBe('blue');
      expect((component as any).getStatusColor('OP')).toBe('gray');
    });

    it('should return gray for an unknown status', () => {
      expect((component as any).getStatusColor('UNKNOWN')).toBe('gray');
    });
  });

  describe('togglePanel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error snackbar when no order is selected', () => {
      component['selectedOrder'].set(null);
      (component as any).togglePanel('ordered-attr');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select an order first.');
      expect(component['activePanel']()).toBeNull();
    });

    it('should close panel when toggling the same panel', () => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      component['activePanel'].set('ordered-attr');

      (component as any).togglePanel('ordered-attr');

      expect(component['activePanel']()).toBeNull();
    });

    it('should open ordered-attr panel and load data', fakeAsync(() => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      orderServiceSpy.getOrderedAntigens.and.returnValue(of([{ itemNo: 1, antigenId: 'A1' }]));
      orderServiceSpy.getOrderedAttributes.and.returnValue(of([{ itemNo: 1, attribGroup: 'G1', attribCode: 'C1' }]));

      (component as any).togglePanel('ordered-attr');
      tick();

      expect(component['activePanel']()).toBe('ordered-attr');
      expect(component['orderedAntigens']()).toEqual([{ itemNo: 1, antigenId: 'A1' }]);
      expect(component['orderedAttributes']()).toEqual([{ itemNo: 1, attribGroup: 'G1', attribCode: 'C1' }]);
      expect(component['panelLoading']()).toBe(false);
    }));

    it('should open shipped-products panel and load data', fakeAsync(() => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      orderServiceSpy.getOrderCharges.and.returnValue(of({
        products: [{ unitId: 'U1', prodCode: 'P1' }],
        antigens: [{ unitId: 'U1', prodCode: 'P1', testId: 'T1' }],
        attributes: [{ unitId: 'U1', prodCode: 'P1', attributeCode: 'A1' }]
      }));

      (component as any).togglePanel('shipped-products');
      tick();

      expect(component['activePanel']()).toBe('shipped-products');
      expect(component['shippedProducts']()).toEqual([{ unitId: 'U1', prodCode: 'P1' }]);
      expect(component['shippedAntigens']()).toEqual([{ unitId: 'U1', prodCode: 'P1', testId: 'T1' }]);
      expect(component['shippedAttributesData']()).toEqual([{ unitId: 'U1', prodCode: 'P1', attributeCode: 'A1' }]);
      expect(component['panelLoading']()).toBe(false);
    }));

    it('should open shipped-attr panel and load shipped data', fakeAsync(() => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      orderServiceSpy.getOrderCharges.and.returnValue(of({
        products: [],
        antigens: [],
        attributes: []
      }));

      (component as any).togglePanel('shipped-attr');
      tick();

      expect(component['activePanel']()).toBe('shipped-attr');
      expect(component['panelLoading']()).toBe(false);
    }));
  });

  describe('closeSidePanel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set activePanel to null', () => {
      component['activePanel'].set('ordered-attr');
      (component as any).closeSidePanel();
      expect(component['activePanel']()).toBeNull();
    });
  });

  describe('loadOrderedAttrData error path', () => {
    it('should set panelLoading to false on error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);

      orderServiceSpy.getOrderedAntigens.and.returnValue(throwError(() => new Error('fail')));
      orderServiceSpy.getOrderedAttributes.and.returnValue(of([]));

      (component as any).togglePanel('ordered-attr');
      tick();

      expect(component['panelLoading']()).toBe(false);
    }));
  });

  describe('loadShippedData', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle null data response gracefully', fakeAsync(() => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      orderServiceSpy.getOrderCharges.and.returnValue(of(null));

      (component as any).togglePanel('shipped-products');
      tick();

      expect(component['panelLoading']()).toBe(false);
    }));

    it('should set panelLoading to false on error', fakeAsync(() => {
      const order = mockOrderData.statOrders[0];
      (component as any).onOrderRowClick(order);
      orderServiceSpy.getOrderCharges.and.returnValue(throwError(() => new Error('fail')));

      (component as any).togglePanel('shipped-products');
      tick();

      expect(component['panelLoading']()).toBe(false);
    }));
  });

  describe('currentOrders with search filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter orders by search text matching orderNo', () => {
      component['selectedTab'].set(OrderType.STAT);
      component['searchText'].set('ORD001');

      const result = component['currentOrders']();
      expect(result.length).toBe(1);
      expect(result[0].orderNo).toBe('ORD001');
    });

    it('should return empty when search text does not match any order', () => {
      component['selectedTab'].set(OrderType.STAT);
      component['searchText'].set('NONEXISTENT');

      expect(component['currentOrders']()).toEqual([]);
    });
  });

  describe('currentCount for STANDING and default', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return standingCount for STANDING tab', () => {
      component['selectedTab'].set(OrderType.STANDING);
      expect(component['currentCount']()).toBe(0);
    });

    it('should return 0 when orderData is null', () => {
      component['orderData'].set(null);
      expect(component['currentCount']()).toBe(0);
    });
  });

  describe('filterChips computed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should produce chips for age filter', () => {
      component['filters'].set({ age: 24 });
      const chips = component['filterChips']();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('age');
      expect(chips[0].label).toContain('24');
    });

    it('should produce chips for orderStatus filter with description lookup', () => {
      component['filters'].set({ orderStatus: 'OP' });
      const chips = component['filterChips']();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('orderStatus');
      expect(chips[0].label).toContain('Open');
    });

    it('should produce chips for fromDate and toDate', () => {
      component['filters'].set({ fromDate: new Date('2024-01-15'), toDate: new Date('2024-06-30') });
      const chips = component['filterChips']();
      expect(chips.length).toBe(2);
      expect(chips.find(c => c.key === 'fromDate')).toBeTruthy();
      expect(chips.find(c => c.key === 'toDate')).toBeTruthy();
    });

    it('should use raw status code when no description found', () => {
      component['filters'].set({ orderStatus: 'ZZ' });
      const chips = component['filterChips']();
      expect(chips[0].label).toContain('ZZ');
    });
  });

  describe('statusDescriptionMap computed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should build map from status codes', () => {
      const map = component['statusDescriptionMap']();
      expect(map['AL']).toBe('Allocated');
      expect(map['OP']).toBe('Open');
      expect(map['PE']).toBe('Pending');
    });
  });

  describe('onTabChange clears selectedOrder', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear selectedOrder when switching tabs', () => {
      component['selectedOrder'].set(mockOrderData.statOrders[0]);
      (component as any).onTabChange(OrderType.ASAP);
      expect(component['selectedOrder']()).toBeNull();
    });
  });
});
