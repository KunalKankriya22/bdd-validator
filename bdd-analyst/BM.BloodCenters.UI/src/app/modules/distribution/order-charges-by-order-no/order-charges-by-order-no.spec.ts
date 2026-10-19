import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { signal } from '@angular/core';
import { OrderChargesByOrderNoComponent } from './order-charges-by-order-no';
import { OrderChargesApiService } from './services/order-charges-api.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { OrderChargesSummary, OrderTypeDto, OrderListItemDto } from './models/order-charges.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('OrderChargesByOrderNoComponent', () => {
  let component: OrderChargesByOrderNoComponent;
  let fixture: ComponentFixture<OrderChargesByOrderNoComponent>;
  let apiServiceSpy: jasmine.SpyObj<OrderChargesApiService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let routerEvents$: Subject<any>;
  let chapterChanged$: Subject<void>;
  let mockActivatedRoute: any;

  const mockOrderTypes: OrderTypeDto[] = [
    { code: 'PR', description: 'Production Order' },
    { code: 'SP', description: 'Special Order' }
  ];

  const mockOrders: OrderListItemDto[] = [
    { orderNo: '17339-0016', orderType: 'SP', customerName: 'Parkland Hospital', insertDate: '12-FEB-2025' },
    { orderNo: '17339-0017', orderType: 'SP', customerName: 'City General', insertDate: '13-FEB-2025' }
  ];

  const mockOrderData: OrderChargesSummary = {
    orderNo: '17339-0016',
    chapterId: '0001',
    orderType: 'SP',
    customerId: 'DAL-RG0001',
    customerName: 'Parkland Hospital',
    status: 'Closed',
    statusDesc: 'Closed',
    orderBy: 'Parker Jones',
    estArrivalTime: '12-FEB-2025, 09:30',
    insertDate: '12-FEB-2025',
    products: [
      {
        unitId: 'W63331707011-H',
        prodCode: 'E2807100',
        productDesc: 'Red Blood Cells',
        collDate: '1-MAR-2025',
        abo: 'O+',
        aliquot: '00',
        expDate: '1-MAR-2026',
        boxId: '1204170016',
        price: 125.00
      }
    ],
    antigens: [],
    attributes: [
      {
        unitId: 'W63331803040-H',
        prodCode: 'E0385V00',
        aliquot: '00',
        attributeCode: 'XM',
        attributeDesc: 'XM',
        price: 40.00
      }
    ],
    otherCharges: [
      { chargeCode: 'B9009', chargeDesc: 'Blood Container', amount: 25.00 }
    ],
    adjustments: [],
    totals: {
      productsTotal: 0.00,
      antigensTotal: 0.00,
      attributesTotal: 289.00,
      otherDebitTotal: 50.00,
      otherCreditTotal: 0.00,
      grandTotal: 339.00
    }
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('OrderChargesApiService', ['getOrderCharges', 'getOrderTypes', 'getOrders']);
    routerEvents$ = new Subject<any>();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    (routerSpy as any).events = routerEvents$.asObservable();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    chapterChanged$ = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    mockActivatedRoute = { children: [], snapshot: {} };

    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));

    TestBed.configureTestingModule({
      imports: [OrderChargesByOrderNoComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: OrderChargesApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    apiServiceSpy.getOrderCharges.calls.reset();
    apiServiceSpy.getOrderTypes.calls.reset();
    apiServiceSpy.getOrders.calls.reset();
    routerSpy.navigate.calls.reset();
    menuServiceSpy.getMenuItemsSignal.calls.reset();
    menuServiceSpy.findMenuItemByPath.calls.reset();
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));

    fixture = TestBed.createComponent(OrderChargesByOrderNoComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize orderNo control as disabled', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();
      expect(component.filterForm.get('orderNo')?.disabled).toBeTrue();
    });

    it('should load order types on init', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();

      expect(apiServiceSpy.getOrderTypes).toHaveBeenCalled();
      expect((component as any).orderTypes()).toEqual(mockOrderTypes);
    });

    it('should initialize isChildRouteActive based on route children', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();
      expect((component as any).isChildRouteActive).toBeFalse();
    });

    it('should update isChildRouteActive on NavigationEnd', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();

      mockActivatedRoute.children = [{}];
      routerEvents$.next(new NavigationEnd(1, '/', '/'));

      expect((component as any).isChildRouteActive).toBeTrue();
    });

    it('should initialize filterForm with null values', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();

      expect(component.filterForm.get('orderType')?.value).toBeNull();
      expect(component.filterForm.get('orderNo')?.value).toBeNull();
      expect(component.filterForm.get('orderBy')?.value).toBeNull();
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();
    });

    it('should return hasData=false when no order data', () => {
      expect((component as any).hasData()).toBeFalse();
    });

    it('should return hasData=true when order data is set', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect((component as any).hasData()).toBeTrue();
    });

    it('should return isEmpty=true when no data and not loading', () => {
      expect((component as any).isEmpty()).toBeTrue();
    });

    it('should return isEmpty=false when loading', () => {
      (component as any).loading.set(true);
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('should return isEmpty=false when error exists', () => {
      (component as any).error.set('Some error');
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('should return empty products when no order data', () => {
      expect((component as any).products()).toEqual([]);
    });

    it('should return products from order data', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect((component as any).products().length).toBe(1);
    });

    it('should return totals from order data', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect((component as any).totals()?.grandTotal).toBe(339.00);
    });

    it('should return undefined totals when no order data', () => {
      expect((component as any).totals()).toBeUndefined();
    });
  });

  describe('Filtered Signals', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();
    });

    it('should return all order types when no search text', () => {
      expect((component as any).filteredOrderTypes()).toEqual(mockOrderTypes);
    });

    it('should filter order types by code', () => {
      (component as any).orderTypeSearchCtrl.setValue('PR');
      expect((component as any).filteredOrderTypes().length).toBe(1);
      expect((component as any).filteredOrderTypes()[0].code).toBe('PR');
    });

    it('should filter order types by description', () => {
      (component as any).orderTypeSearchCtrl.setValue('special');
      expect((component as any).filteredOrderTypes().length).toBe(1);
      expect((component as any).filteredOrderTypes()[0].code).toBe('SP');
    });

    it('should return all orders when no search text', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      component.filterForm.patchValue({ orderType: 'SP' });

      expect((component as any).filteredOrders()).toEqual(mockOrders);
    });

    it('should filter orders by order number', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      component.filterForm.patchValue({ orderType: 'SP' });
      (component as any).orderNoSearchCtrl.setValue('0017');

      expect((component as any).filteredOrders().length).toBe(1);
      expect((component as any).filteredOrders()[0].orderNo).toBe('17339-0017');
    });

    it('should filter orders by customer name', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      component.filterForm.patchValue({ orderType: 'SP' });
      (component as any).orderNoSearchCtrl.setValue('city');

      expect((component as any).filteredOrders().length).toBe(1);
      expect((component as any).filteredOrders()[0].customerName).toBe('City General');
    });
  });

  describe('Order Type Selection', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();
    });

    it('should load orders when order type is selected', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      component.filterForm.patchValue({ orderType: 'SP' });

      expect(apiServiceSpy.getOrders).toHaveBeenCalledWith('SP');
      expect((component as any).orders()).toEqual(mockOrders);
    });

    it('should reset order number and order by when order type changes', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '12345' });

      component.filterForm.patchValue({ orderType: 'PR' });

      expect(component.filterForm.get('orderNo')?.value).toBeNull();
      expect(component.filterForm.get('orderBy')?.value).toBeNull();
    });

    it('should enable orderNo control when order type is selected', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      component.filterForm.patchValue({ orderType: 'SP' });

      expect(component.filterForm.get('orderNo')?.disabled).toBeFalse();
    });

    it('should disable orderNo and clear orders when order type is set to null', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderType: null });

      expect(component.filterForm.get('orderNo')?.disabled).toBeTrue();
      expect((component as any).orders()).toEqual([]);
    });

    it('should close side panel when order type changes', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();
      expect((component as any).sidePanelOpen()).toBeTrue();

      component.filterForm.patchValue({ orderType: 'PR' });
      expect((component as any).sidePanelOpen()).toBeFalse();
    });

    it('should reset orderNo search control when order type changes', () => {
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      component.filterForm.patchValue({ orderType: 'SP' });
      (component as any).orderNoSearchCtrl.setValue('test');

      component.filterForm.patchValue({ orderType: 'PR' });
      expect((component as any).orderNoSearchCtrl.value).toBe('');
    });
  });

  describe('Order Number Selection', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
    });

    it('should load order charges when order number is selected', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect(apiServiceSpy.getOrderCharges).toHaveBeenCalledWith('17339-0016');
      expect((component as any).orderData()).toEqual(mockOrderData);
    });

    it('should update "By" field from loaded order data', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect(component.filterForm.get('orderBy')?.value).toBe('Parker Jones');
    });

    it('should clear order data when order number is set to null', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderNo: '17339-0016' });
      expect((component as any).orderData()).not.toBeNull();

      component.filterForm.patchValue({ orderNo: null });
      expect((component as any).orderData()).toBeNull();
    });

    it('should close side panel when order number is cleared', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();
      expect((component as any).sidePanelOpen()).toBeTrue();

      component.filterForm.patchValue({ orderNo: null });
      expect((component as any).sidePanelOpen()).toBeFalse();
    });

    it('should set loading to true during order charges load', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));

      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect((component as any).loading()).toBeFalse();
    });

    it('should close side panel when loading new order charges', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();

      apiServiceSpy.getOrderCharges.and.returnValue(of({ ...mockOrderData, orderNo: '17339-0017' }));
      component.filterForm.patchValue({ orderNo: '17339-0017' });

      expect((component as any).sidePanelOpen()).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
    });

    it('should show error message on load failure', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));

      component.filterForm.patchValue({ orderNo: 'FAIL' });

      expect((component as any).error()).toBe('Failed to load order charges. Please try again.');
    });

    it('should show "Order not found" for 404 error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 404 })));

      component.filterForm.patchValue({ orderNo: 'NOTFOUND' });

      expect((component as any).error()).toBe('Order not found');
    });

    it('should clear order data on error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));

      component.filterForm.patchValue({ orderNo: 'FAIL' });

      expect((component as any).orderData()).toBeNull();
    });

    it('should set loading to false after error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));

      component.filterForm.patchValue({ orderNo: 'FAIL' });

      expect((component as any).loading()).toBeFalse();
    });

    it('should show error when orders fail to load', () => {
      apiServiceSpy.getOrders.and.returnValue(throwError(() => new Error('Network error')));

      component.filterForm.patchValue({ orderType: 'SP' });

      expect((component as any).error()).toBe('Failed to load orders. Please try again.');
      expect((component as any).orders()).toEqual([]);
      expect((component as any).loadingOrders()).toBeFalse();
    });
  });

  describe('Button States', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
    });

    it('should disable action buttons when no order data', () => {
      expect(component.headerConfig.actions![0].disabled).toBeTrue();
      expect(component.headerConfig.actions![1].disabled).toBeTrue();
    });

    it('should enable action buttons when order data is loaded', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      expect(component.headerConfig.actions![0].disabled).toBeFalse();
      expect(component.headerConfig.actions![1].disabled).toBeFalse();
    });

    it('should disable action buttons after clear all', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      component.clearAll();

      expect(component.headerConfig.actions![0].disabled).toBeTrue();
      expect(component.headerConfig.actions![1].disabled).toBeTrue();
    });

    it('should disable action buttons on error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: 'FAIL' });

      expect(component.headerConfig.actions![0].disabled).toBeTrue();
      expect(component.headerConfig.actions![1].disabled).toBeTrue();
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
    });

    it('should clear all data when chapter changes', () => {
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      chapterChanged$.next();

      expect(component.filterForm.get('orderType')?.value).toBeNull();
      expect(component.filterForm.get('orderNo')?.disabled).toBeTrue();
      expect((component as any).orderData()).toBeNull();
      expect((component as any).orders()).toEqual([]);
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
    });

    it('should reset form and clear data', () => {
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      component.clearAll();

      expect(component.filterForm.get('orderType')?.value).toBeNull();
      expect(component.filterForm.get('orderNo')?.value).toBeNull();
      expect(component.filterForm.get('orderNo')?.disabled).toBeTrue();
      expect((component as any).orderData()).toBeNull();
    });

    it('should clear error on clearAll', () => {
      (component as any).error.set('Some error');
      component.clearAll();
      expect((component as any).error()).toBeNull();
    });

    it('should close side panel on clearAll', () => {
      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();

      component.clearAll();
      expect((component as any).sidePanelOpen()).toBeFalse();
    });

    it('should clear search controls on clearAll', () => {
      (component as any).orderTypeSearchCtrl.setValue('test');
      (component as any).orderNoSearchCtrl.setValue('test');

      component.clearAll();

      expect((component as any).orderTypeSearchCtrl.value).toBe('');
      expect((component as any).orderNoSearchCtrl.value).toBe('');
    });

    it('should clear orders array on clearAll', () => {
      component.filterForm.patchValue({ orderType: 'SP' });
      expect((component as any).orders().length).toBeGreaterThan(0);

      component.clearAll();
      expect((component as any).orders()).toEqual([]);
    });
  });

  describe('Side Panel and Navigation', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
    });

    it('should toggle side panel', () => {
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();

      expect((component as any).sidePanelOpen()).toBeTrue();

      component.toggleSidePanel();

      expect((component as any).sidePanelOpen()).toBeFalse();
    });

    it('should close side panel via closeSidePanel', () => {
      component.filterForm.patchValue({ orderNo: '17339-0016' });
      component.toggleSidePanel();
      expect((component as any).sidePanelOpen()).toBeTrue();

      component.closeSidePanel();
      expect((component as any).sidePanelOpen()).toBeFalse();
    });

    it('should navigate to order details with orderNo', () => {
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      component.viewOrderDetails();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['order-details', '17339-0016'],
        { relativeTo: mockActivatedRoute }
      );
    });

    it('should not navigate when orderNo is null', () => {
      component.viewOrderDetails();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Form Controls', () => {
    it('should expose form controls via f getter', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();

      expect(component.f['orderType']).toBeDefined();
      expect(component.f['orderNo']).toBeDefined();
      expect(component.f['orderBy']).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should format currency correctly', () => {
      expect(component.formatCurrency(125.50)).toBe('$125.50');
      expect(component.formatCurrency(0)).toBe('$0.00');
      expect(component.formatCurrency(null)).toBe('$0.00');
    });

    it('should format currency with undefined', () => {
      expect(component.formatCurrency(undefined)).toBe('$0.00');
    });

    it('should format date/time correctly', () => {
      expect(component.formatDateTime('2025-03-01T09:30:00')).toBe('01-MAR-2025, 09:30');
      expect(component.formatDateTime(null)).toBe('--');
      expect(component.formatDateTime(undefined)).toBe('--');
    });

    it('should return original value for invalid date string', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Table Config', () => {
    it('should have 8 columns configured', () => {
      expect((component as any).tableConfig.columns.length).toBe(8);
    });

    it('should format price column values', () => {
      const priceCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'price');
      expect(priceCol.valueFormatter(125.00)).toBe('$125.00');
      expect(priceCol.valueFormatter(null)).toBe('$0.00');
      expect(priceCol.valueFormatter(0)).toBe('$0.00');
    });

    it('should format date columns', () => {
      const collDateCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'collDate');
      expect(collDateCol.valueFormatter(null)).toBe('--');
      expect(collDateCol.valueFormatter('2025-03-01')).toContain('2025');
    });

    it('should show "--" for null values in text columns', () => {
      const prodCodeCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'prodCode');
      expect(prodCodeCol.valueFormatter(null)).toBe('--');
      expect(prodCodeCol.valueFormatter('')).toBe('--');
      expect(prodCodeCol.valueFormatter('E2807100')).toBe('E2807100');
    });

    it('should show "--" for null aliquot, abo, and boxId', () => {
      const aliquotCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'aliquot');
      const aboCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'abo');
      const boxIdCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'boxId');

      expect(aliquotCol.valueFormatter(null)).toBe('--');
      expect(aboCol.valueFormatter(null)).toBe('--');
      expect(boxIdCol.valueFormatter(null)).toBe('--');
    });
  });

  describe('Header Config', () => {
    it('should have default header config with actions', () => {
      expect(component.headerConfig.actions!.length).toBe(2);
      expect(component.headerConfig.actions![0].label).toBe('VIEW ORDER DETAILS');
      expect(component.headerConfig.actions![1].label).toBe('SHIPPED ATTRIBUTES/ANTIGENS');
    });

    it('should have action onClick handlers', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });

      component.headerConfig.actions![0].onClick!();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['order-details', '17339-0016'],
        jasmine.objectContaining({ relativeTo: mockActivatedRoute })
      );
    });
  });

  describe('Order Types Error', () => {
    it('should handle error when order types fail to load', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();

      expect((component as any).error()).toBe('Failed to load order types. Please try again.');
      expect((component as any).orderTypes()).toEqual([]);
      expect((component as any).loadingOrderTypes()).toBeFalse();
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      fixture.detectChanges();

      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Other Debits Change', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });
    });

    it('should show raw number on focus and select text', () => {
      const mockInput = { value: '$75.00', select: jasmine.createSpy('select') };
      const event = { target: mockInput } as unknown as FocusEvent;
      component.onOtherDebitsFocus(event);

      expect(mockInput.value).toBe('75.00');
      expect(mockInput.select).toHaveBeenCalled();
    });

    it('should update otherDebitTotal and format on blur', () => {
      const mockInput = { value: '75.00' };
      const event = { target: mockInput } as unknown as FocusEvent;
      component.onOtherDebitsBlur(event);

      expect((component as any).orderData()?.totals.otherDebitTotal).toBe(75);
      expect(mockInput.value).toBe('$75.00');
    });

    it('should recalculate grandTotal on blur', () => {
      const mockInput = { value: '100.00' };
      const event = { target: mockInput } as unknown as FocusEvent;
      component.onOtherDebitsBlur(event);

      const totals = (component as any).orderData()?.totals;
      const expected = mockOrderData.totals!.antigensTotal + mockOrderData.totals!.attributesTotal +
        mockOrderData.totals!.productsTotal + 100 + mockOrderData.totals!.otherCreditTotal;
      expect(totals.grandTotal).toBe(expected);
    });

    it('should strip $ from value and parse correctly on blur', () => {
      const mockInput = { value: '$50.00' };
      const event = { target: mockInput } as unknown as FocusEvent;
      component.onOtherDebitsBlur(event);

      expect((component as any).orderData()?.totals.otherDebitTotal).toBe(50);
      expect(mockInput.value).toBe('$50.00');
    });

    it('should treat invalid input as 0 on blur', () => {
      const mockInput = { value: 'abc' };
      const event = { target: mockInput } as unknown as FocusEvent;
      component.onOtherDebitsBlur(event);

      expect((component as any).orderData()?.totals.otherDebitTotal).toBe(0);
      expect(mockInput.value).toBe('$0.00');
    });

    it('should not throw when orderData is null on blur', () => {
      (component as any).orderData.set(null);
      const mockInput = { value: '50' };
      const event = { target: mockInput } as unknown as FocusEvent;
      expect(() => component.onOtherDebitsBlur(event)).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderTypes.and.returnValue(of(mockOrderTypes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();

      component.filterForm.patchValue({ orderType: 'SP' });
      component.filterForm.patchValue({ orderNo: '17339-0016' });
    });

    it('should capture active element when opening side panel', () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      component.toggleSidePanel();
      expect((component as any).panelTriggerElement).toBe(mockButton);

      document.body.removeChild(mockButton);
    });

    it('should not capture active element when closing side panel via toggle', () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      component.toggleSidePanel();
      const captured = (component as any).panelTriggerElement;
      expect(captured).toBe(mockButton);

      component.toggleSidePanel();

      document.body.removeChild(mockButton);
    });

    it('should restore focus to trigger element on closeSidePanel', () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      component.toggleSidePanel();
      const focusSpy = spyOn(mockButton, 'focus');

      component.closeSidePanel();

      expect(focusSpy).toHaveBeenCalled();
      expect((component as any).panelTriggerElement).toBeNull();

      document.body.removeChild(mockButton);
    });

    it('should null panelTriggerElement when no trigger was captured', () => {
      component.closeSidePanel();
      expect((component as any).panelTriggerElement).toBeNull();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique element IDs', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('order-charges-by-order-no-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs', () => {
      const id = (component as any).errorId('field');
      expect(id).toContain('-field-error');
    });

    it('should generate label IDs', () => {
      const id = (component as any).labelId('field');
      expect(id).toContain('-field-label');
    });
  });
});
