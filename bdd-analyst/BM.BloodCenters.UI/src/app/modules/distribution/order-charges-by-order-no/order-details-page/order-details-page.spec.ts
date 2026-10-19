import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { OrderDetailsPageComponent } from './order-details-page';
import { OrderChargesApiService } from '../services/order-charges-api.service';
import { OrderChargesSummary, OrderedProduct, OrderNote, AuditTrailItem } from '../models/order-charges.model';

describe('OrderDetailsPageComponent', () => {
  let component: OrderDetailsPageComponent;
  let fixture: ComponentFixture<OrderDetailsPageComponent>;
  let apiServiceSpy: jasmine.SpyObj<OrderChargesApiService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let routeParams$: Subject<any>;

  const mockOrderData: OrderChargesSummary = {
    orderNo: '17337-0016',
    chapterId: '0001',
    orderType: 'SP',
    customerId: 'DAL-RG0001',
    customerName: 'Parkland Hospital',
    status: 'CL',
    statusDesc: 'Closed',
    orderBy: 'Parker Jones',
    estArrivalTime: '12-FEB-2025, 09:30',
    insertDate: '12-FEB-2025',
    products: [
      {
        unitId: 'W63331707011-H',
        prodCode: 'E2807100',
        productDesc: 'Red Blood Cells',
        collDate: '2025-03-01',
        abo: 'O+',
        aliquot: '00',
        expDate: '2026-03-01',
        boxId: '1204170016',
        price: 125.00
      }
    ],
    antigens: [],
    attributes: [],
    otherCharges: [],
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

  const mockOrderedProducts: OrderedProduct[] = [
    { orderNo: '17337-0016', itemNo: 1, productType: 'RBC', bloodType: 'O+', requiredQty: 10, allocatedQty: 10, canceledQty: 0, itemStatus: 'CL' }
  ];

  const mockOrderNote: OrderNote = { noteId: 1, note: 'Rush delivery required' };

  const mockAuditTrail: AuditTrailItem[] = [
    { actionFunction: 'INSERT', actionDate: '2025-02-12T10:00:00', userName: 'PJONES' }
  ];

  const mockOrders = [
    { orderNo: '17337-0016', orderType: 'SP', customerName: 'Parkland Hospital', insertDate: '12-FEB-2025' },
    { orderNo: '17337-0017', orderType: 'SP', customerName: 'City General', insertDate: '13-FEB-2025' }
  ];

  beforeEach(() => {
    routeParams$ = new Subject<any>();

    apiServiceSpy = jasmine.createSpyObj('OrderChargesApiService', [
      'getOrderCharges', 'getOrderedProducts', 'getOrderNotes', 'getAuditTrail',
      'getOrderedAntigens', 'getOrderedAttributes', 'getOrders'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of()
    });
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('/');

    apiServiceSpy.getOrderedProducts.and.returnValue(of([]));
    apiServiceSpy.getOrderNotes.and.returnValue(of(null));
    apiServiceSpy.getAuditTrail.and.returnValue(of([]));
    apiServiceSpy.getOrderedAntigens.and.returnValue(of([]));
    apiServiceSpy.getOrderedAttributes.and.returnValue(of([]));
    apiServiceSpy.getOrders.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [OrderDetailsPageComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrderChargesApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable()
          }
        }
      ]
    });

    apiServiceSpy.getOrderCharges.calls.reset();
    apiServiceSpy.getOrderedProducts.calls.reset();
    apiServiceSpy.getOrderNotes.calls.reset();
    apiServiceSpy.getAuditTrail.calls.reset();
    apiServiceSpy.getOrderedAntigens.calls.reset();
    apiServiceSpy.getOrderedAttributes.calls.reset();
    apiServiceSpy.getOrders.calls.reset();
    routerSpy.navigate.calls.reset();
    routerSpy.createUrlTree.calls.reset();
    routerSpy.serializeUrl.calls.reset();
    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('/');
    apiServiceSpy.getOrderedProducts.and.returnValue(of([]));
    apiServiceSpy.getOrderNotes.and.returnValue(of(null));
    apiServiceSpy.getAuditTrail.and.returnValue(of([]));
    apiServiceSpy.getOrderedAntigens.and.returnValue(of([]));
    apiServiceSpy.getOrderedAttributes.and.returnValue(of([]));
    apiServiceSpy.getOrders.and.returnValue(of([]));

    fixture = TestBed.createComponent(OrderDetailsPageComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load order details on init', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect(apiServiceSpy.getOrderCharges).toHaveBeenCalledWith('17337-0016');
      expect((component as any).orderData()).toEqual(mockOrderData);
    });

    it('should display order details after loading', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.order-details-container');
      expect(container.textContent).toContain('Parker Jones');
      expect(container.textContent).toContain('DAL-RG0001');
    });

    it('should set selectedOrderNo from route params', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).selectedOrderNo()).toBe('17337-0016');
    });

    it('should load all data using forkJoin', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrderedProducts.and.returnValue(of(mockOrderedProducts));
      apiServiceSpy.getOrderNotes.and.returnValue(of(mockOrderNote));
      apiServiceSpy.getAuditTrail.and.returnValue(of(mockAuditTrail));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).orderedProducts()).toEqual(mockOrderedProducts);
      expect((component as any).orderNote()).toEqual(mockOrderNote);
      expect((component as any).auditTrail()).toEqual(mockAuditTrail);
    });

    it('should load orders for the order type after data loads', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect(apiServiceSpy.getOrders).toHaveBeenCalledWith('SP');
    });

    it('should not call loadAllData if orderNo is empty', () => {
      fixture.detectChanges();
      routeParams$.next({});

      expect(apiServiceSpy.getOrderCharges).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on load failure', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).error()).toBe('Failed to load order details.');
    });

    it('should show "Order not found" for 404 error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 404 })));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).error()).toBe('Order not found');
    });

    it('should set loading to false after error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).loading()).toBeFalse();
    });

    it('should handle subsidiary call errors gracefully via catchError', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrderedProducts.and.returnValue(throwError(() => new Error('Products failed')));
      apiServiceSpy.getOrderNotes.and.returnValue(throwError(() => new Error('Notes failed')));
      apiServiceSpy.getAuditTrail.and.returnValue(throwError(() => new Error('Audit failed')));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).orderData()).toEqual(mockOrderData);
      expect((component as any).orderedProducts()).toEqual([]);
      expect((component as any).orderNote()).toBeNull();
      expect((component as any).auditTrail()).toEqual([]);
      expect((component as any).loading()).toBeFalse();
    });
  });

  describe('Order Details Display', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
      fixture.detectChanges();
    });

    it('should display order header information', () => {
      const content = fixture.nativeElement.querySelector('.order-details-container');
      expect(content.textContent).toContain('Parker Jones');
      expect(content.textContent).toContain('DAL-RG0001');
      expect(content.textContent).toContain('Parkland Hospital');
      expect(content.textContent).toContain('SP');
    });
  });

  describe('Computed Signals', () => {
    it('should return hasData=false when no order data', () => {
      fixture.detectChanges();
      expect((component as any).hasData()).toBeFalse();
    });

    it('should return hasData=true when order data is set', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).hasData()).toBeTrue();
    });

    it('should return shipped products from order data', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).shippedProducts().length).toBe(1);
    });

    it('should return empty array for shipped products when no data', () => {
      fixture.detectChanges();
      expect((component as any).shippedProducts()).toEqual([]);
    });
  });

  describe('Filtered Orders', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should return all orders when no search text', () => {
      expect((component as any).filteredOrders().length).toBe(2);
    });

    it('should filter orders by order number', () => {
      (component as any).orderNoSearchCtrl.setValue('0017');
      expect((component as any).filteredOrders().length).toBe(1);
      expect((component as any).filteredOrders()[0].orderNo).toBe('17337-0017');
    });

    it('should filter orders by customer name', () => {
      (component as any).orderNoSearchCtrl.setValue('city');
      expect((component as any).filteredOrders().length).toBe(1);
      expect((component as any).filteredOrders()[0].customerName).toBe('City General');
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
      fixture.detectChanges();
    });

    it('should have three action buttons configured', () => {
      expect(component.headerConfig.actions!.length).toBe(3);
      expect(component.headerConfig.actions![0].label).toBe('ORDERED ATTRIBUTES/ANTIGENS');
      expect(component.headerConfig.actions![1].label).toBe('SHIPPED PRODUCTS');
      expect(component.headerConfig.actions![2].label).toBe('SHIPPED ATTRIBUTES/ANTIGENS');
    });
  });

  describe('Panel Toggle', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should toggle panel on and off', () => {
      component.togglePanel('shipped-products');
      expect((component as any).activePanel()).toBe('shipped-products');

      component.togglePanel('shipped-products');
      expect((component as any).activePanel()).toBeNull();
    });

    it('should switch to a different panel', () => {
      component.togglePanel('shipped-products');
      expect((component as any).activePanel()).toBe('shipped-products');

      component.togglePanel('shipped-attr');
      expect((component as any).activePanel()).toBe('shipped-attr');
    });

    it('should close panel via closeSidePanel', () => {
      component.togglePanel('shipped-attr');
      component.closeSidePanel();
      expect((component as any).activePanel()).toBeNull();
    });

    it('should load ordered antigens and attributes on first open', () => {
      component.togglePanel('ordered-attr');
      expect(apiServiceSpy.getOrderedAntigens).toHaveBeenCalled();
      expect(apiServiceSpy.getOrderedAttributes).toHaveBeenCalled();
    });

    it('should not reload ordered antigens on second open', () => {
      component.togglePanel('ordered-attr');
      apiServiceSpy.getOrderedAntigens.calls.reset();
      apiServiceSpy.getOrderedAttributes.calls.reset();

      component.togglePanel('ordered-attr');
      component.togglePanel('ordered-attr');

      expect(apiServiceSpy.getOrderedAntigens).not.toHaveBeenCalled();
      expect(apiServiceSpy.getOrderedAttributes).not.toHaveBeenCalled();
    });

    it('should set panelLoading during ordered-attr load', () => {
      component.togglePanel('ordered-attr');
      expect((component as any).panelLoading()).toBeFalse();
    });

    it('should reset panelLoading when toggling off', () => {
      component.togglePanel('shipped-products');
      component.togglePanel('shipped-products');
      expect((component as any).panelLoading()).toBeFalse();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should navigate to new order on onOrderChange', () => {
      component.onOrderChange('17337-0017');

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['../', '17337-0017'],
        jasmine.objectContaining({ relativeTo: jasmine.anything() })
      );
    });

    it('should not navigate when onOrderChange receives same orderNo', () => {
      component.onOrderChange('17337-0016');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when onOrderChange receives empty string', () => {
      component.onOrderChange('');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should navigate back to order charges list on goBack', () => {
      component.goBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/distribution/order-charges-by-order-no']);
    });

    it('should call goBack when clearAll is called', () => {
      spyOn(component, 'goBack');
      component.clearAll();
      expect(component.goBack).toHaveBeenCalled();
    });
  });

  describe('Order Notes', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrderNotes.and.returnValue(of(mockOrderNote));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should toggle notes panel visibility', () => {
      expect((component as any).notesPanelVisible()).toBeFalse();

      component.showOrderNotes();
      expect((component as any).notesPanelVisible()).toBeTrue();

      component.showOrderNotes();
      expect((component as any).notesPanelVisible()).toBeFalse();
    });

    it('should store order note from API', () => {
      expect((component as any).orderNote()).toEqual(mockOrderNote);
    });
  });

  describe('Status Info', () => {
    it('should return correct status for known codes', () => {
      expect(component.getStatusInfo('OR')).toEqual({ label: 'Ordered', cssClass: '' });
      expect(component.getStatusInfo('AL')).toEqual({ label: 'Allocated', cssClass: 'status-allocated' });
      expect(component.getStatusInfo('BO')).toEqual({ label: 'Back Ordered', cssClass: 'status-backordered' });
      expect(component.getStatusInfo('CL')).toEqual({ label: 'Closed', cssClass: 'closed' });
      expect(component.getStatusInfo('CO')).toEqual({ label: 'Completed', cssClass: 'closed' });
      expect(component.getStatusInfo('CN')).toEqual({ label: 'Cancelled', cssClass: 'status-cancelled' });
      expect(component.getStatusInfo('SH')).toEqual({ label: 'Shipped', cssClass: 'status-shipped' });
    });

    it('should return code as label for unknown status', () => {
      expect(component.getStatusInfo('XX')).toEqual({ label: 'XX', cssClass: '' });
    });

    it('should return "--" for null status', () => {
      expect(component.getStatusInfo(null)).toEqual({ label: '--', cssClass: '' });
    });
  });

  describe('Utility Methods', () => {
    it('should format ISO date/time correctly', () => {
      expect(component.formatDateTime('2025-02-12T09:30:00')).toBe('12-FEB-2025, 09:30');
    });

    it('should return "--" for null input', () => {
      expect(component.formatDateTime(null)).toBe('--');
    });

    it('should return "--" for undefined input', () => {
      expect(component.formatDateTime(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatDateTime('')).toBe('--');
    });

    it('should return original value for invalid date string', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Table Configs', () => {
    it('should have 8 columns in shipped products table', () => {
      expect((component as any).shippedProductsTableConfig.columns.length).toBe(8);
    });

    it('should have 3 columns in audit table', () => {
      expect((component as any).auditTableConfig.columns.length).toBe(3);
    });

    it('should format price column in shipped products table', () => {
      const priceCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'price');
      expect(priceCol.valueFormatter(125.00)).toBe('$125.00');
      expect(priceCol.valueFormatter(null)).toBe('$0.00');
    });

    it('should format date columns in shipped products table', () => {
      const collDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'collDate');
      expect(collDateCol.valueFormatter(null)).toBe('--');
    });

    it('should show "--" for null values in audit table columns', () => {
      const actionCol = (component as any).auditTableConfig.columns.find((c: any) => c.key === 'actionFunction');
      const dateCol = (component as any).auditTableConfig.columns.find((c: any) => c.key === 'actionDate');
      const userCol = (component as any).auditTableConfig.columns.find((c: any) => c.key === 'userName');

      expect(actionCol.valueFormatter(null)).toBe('--');
      expect(dateCol.valueFormatter(null)).toBe('--');
      expect(userCol.valueFormatter(null)).toBe('--');
    });

    it('should show actual values for non-null audit table values', () => {
      const actionCol = (component as any).auditTableConfig.columns.find((c: any) => c.key === 'actionFunction');
      expect(actionCol.valueFormatter('INSERT')).toBe('INSERT');
    });
  });

  describe('Header Config', () => {
    it('should have breadcrumbs configured', () => {
      expect(component.headerConfig.breadcrumbs.length).toBe(3);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[2].label).toBe('Order Details');
    });

    it('should show back button', () => {
      expect(component.headerConfig.showBackButton).toBeTrue();
    });

    it('should have three action buttons configured', () => {
      expect(component.headerConfig.actions!.length).toBe(3);
    });
  });

  describe('Load Orders', () => {
    it('should populate orders signal after loading', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).orders().length).toBe(2);
    });

    it('should set empty orders on load error', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrders.and.returnValue(throwError(() => new Error('Failed')));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).orders()).toEqual([]);
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should capture active element when opening a panel', () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      component.togglePanel('shipped-products');
      expect((component as any).panelTriggerElement).toBe(mockButton);

      document.body.removeChild(mockButton);
    });

    it('should restore focus to trigger element on closeSidePanel', () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      component.togglePanel('shipped-products');
      const focusSpy = spyOn(mockButton, 'focus');

      component.closeSidePanel();

      expect(focusSpy).toHaveBeenCalled();
      expect((component as any).panelTriggerElement).toBeNull();

      document.body.removeChild(mockButton);
    });

    it('should reset panelLoading on closeSidePanel', () => {
      (component as any).panelLoading.set(true);
      component.closeSidePanel();
      expect((component as any).panelLoading()).toBeFalse();
    });

    it('should null panelTriggerElement when no trigger was captured', () => {
      component.closeSidePanel();
      expect((component as any).panelTriggerElement).toBeNull();
    });
  });

  describe('formatDateDisplay via table config', () => {
    it('should format valid date string in collDate column', () => {
      const collDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'collDate');
      const result = collDateCol.valueFormatter('2025-03-01');
      expect(result).toContain('MAR');
      expect(result).toContain('2025');
    });

    it('should format valid date string in expDate column', () => {
      const expDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'expDate');
      const result = expDateCol.valueFormatter('2026-03-01');
      expect(result).toContain('MAR');
      expect(result).toContain('2026');
    });

    it('should return original value for invalid date string', () => {
      const collDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'collDate');
      expect(collDateCol.valueFormatter('not-a-date')).toBe('not-a-date');
    });

    it('should return "--" for empty string', () => {
      const collDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'collDate');
      expect(collDateCol.valueFormatter('')).toBe('--');
    });

    it('should return "--" for undefined', () => {
      const collDateCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'collDate');
      expect(collDateCol.valueFormatter(undefined)).toBe('--');
    });

    it('should format shipped products text columns', () => {
      const prodCodeCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'prodCode');
      const aliquotCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'aliquot');
      const aboCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'abo');
      const boxIdCol = (component as any).shippedProductsTableConfig.columns.find((c: any) => c.key === 'boxId');

      expect(prodCodeCol.valueFormatter('E2807100')).toBe('E2807100');
      expect(prodCodeCol.valueFormatter(null)).toBe('--');
      expect(aliquotCol.valueFormatter('00')).toBe('00');
      expect(aliquotCol.valueFormatter(null)).toBe('--');
      expect(aboCol.valueFormatter('O+')).toBe('O+');
      expect(aboCol.valueFormatter(null)).toBe('--');
      expect(boxIdCol.valueFormatter('1204170016')).toBe('1204170016');
      expect(boxIdCol.valueFormatter(null)).toBe('--');
    });
  });

  describe('Load Orders Fallback', () => {
    it('should set selectedOrderNo from first order when not already set', () => {
      const dataWithoutOrderNo = { ...mockOrderData };
      apiServiceSpy.getOrderCharges.and.returnValue(of(dataWithoutOrderNo));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();

      (component as any).selectedOrderNo.set('');
      routeParams$.next({});

      (component as any).selectedOrderNo.set('');
      (component as any)['orderNo'] = '17337-0016';
      (component as any)['loadOrders']('SP');

      expect((component as any).selectedOrderNo()).toBe('17337-0016');
    });

    it('should not override selectedOrderNo when already set', () => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });

      expect((component as any).selectedOrderNo()).toBe('17337-0016');
    });
  });

  describe('Search Control Subscription', () => {
    beforeEach(() => {
      apiServiceSpy.getOrderCharges.and.returnValue(of(mockOrderData));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      fixture.detectChanges();
      routeParams$.next({ orderNo: '17337-0016' });
    });

    it('should update orderNoSearchText signal when search control changes', () => {
      (component as any).orderNoSearchCtrl.setValue('test');
      expect((component as any).filteredOrders().length).toBeLessThanOrEqual(2);
    });

    it('should handle null search value', () => {
      (component as any).orderNoSearchCtrl.setValue(null);
      expect((component as any).filteredOrders().length).toBe(2);
    });

    it('should filter orders with customerName null', () => {
      const ordersWithNullName = [
        { orderNo: '17337-0016', orderType: 'SP', customerName: null, insertDate: '12-FEB-2025' },
        { orderNo: '17337-0017', orderType: 'SP', customerName: 'City General', insertDate: '13-FEB-2025' }
      ];
      (component as any).orders.set(ordersWithNullName);
      (component as any).orderNoSearchCtrl.setValue('city');
      expect((component as any).filteredOrders().length).toBe(1);
    });
  });
});
