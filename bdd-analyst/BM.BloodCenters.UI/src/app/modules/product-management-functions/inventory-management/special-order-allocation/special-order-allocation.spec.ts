import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { SpecialOrderAllocation } from './special-order-allocation';
import { SpecialOrderAllocationService } from './services/special-order-allocation.service';
import { MatchingProductsStateService } from './services/matching-products-state.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ApiResponse, OrderItemDto, OrderItemTableRow } from './models/special-order-allocation.model';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpecialOrderAllocation', () => {
  let translateSpy: any;
  let component: SpecialOrderAllocation;
  let fixture: ComponentFixture<SpecialOrderAllocation>;
  let serviceSpy: jasmine.SpyObj<SpecialOrderAllocationService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let matchingProductsStateSpy: jasmine.SpyObj<MatchingProductsStateService>;
  let router: Router;

  const mockOrderItems: ApiResponse<OrderItemDto> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [
      {
        orderNo: '240500017',
        itemNo: 1,
        productCode: 'WB-H',
        quantity: 1,
        requiredQty: 1,
        canceledQty: 0,
        systemCancelQty: 0,
        tier: 1,
        unitPrice: 0,
        quantityAllocated: 0,
        chapterId: 'CH01',
        itemStatus: 'Ordered',
        abo: 'O',
        rh: '+',
        effDate: null,
        termDate: null,
        specialInstructions: null,
        subOk: 'Y',
        substitutionFlag: 'Y',
        groupCode: null,
        attributeCode: null,
        attribGroup: null,
        attribCode: null,
        antigenCodes: 'K',
        productDescription: 'Whole Blood',
        productTypeDesc: 'Whole Blood'
      }
    ],
    total: 1
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('SpecialOrderAllocationService', [
      'getOrderItems',
      'getAllocatedUnits',
      'getOrdersByType',
      'getOrderHeader'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService();

    translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.returnValue('');
    translateSpy.get.and.returnValue(of(''));

    const pageHeaderServiceSpy = {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
      getTitle: jasmine.createSpy('getTitle').and.returnValue(''),
    } as unknown as PageHeaderService;

    matchingProductsStateSpy = jasmine.createSpyObj('MatchingProductsStateService', [
      'saveState', 'consumeResult', 'getParentFormState', 'clear'
    ]);
    matchingProductsStateSpy.consumeResult.and.returnValue(null);
    matchingProductsStateSpy.getParentFormState.and.returnValue(null);

    serviceSpy.getOrderItems.and.returnValue(of(mockOrderItems));
    serviceSpy.getOrdersByType.and.returnValue(of([
      { orderNo: '240500017', customerId: 'CUST001', customerName: 'Parkland Hospital', orderStatus: 'Ordered' }
    ]));
    serviceSpy.getOrderHeader.and.returnValue(of(null));
      TestBed.configureTestingModule({
      imports: [SpecialOrderAllocation, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: SpecialOrderAllocationService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatchingProductsStateService, useValue: matchingProductsStateSpy },
      ]
    });


    


      serviceSpy.getOrderItems.calls.reset();


      serviceSpy.getAllocatedUnits.calls.reset();


      serviceSpy.getOrdersByType.calls.reset();


      serviceSpy.getOrderHeader.calls.reset();


      dialogSpy.open.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      matchingProductsStateSpy.saveState.calls.reset();


      matchingProductsStateSpy.consumeResult.calls.reset();


      matchingProductsStateSpy.getParentFormState.calls.reset();


      matchingProductsStateSpy.clear.calls.reset();


      translateSpy.instant.and.returnValue('');


      translateSpy.get.and.returnValue(of(''));


      matchingProductsStateSpy.consumeResult.and.returnValue(null);


      matchingProductsStateSpy.getParentFormState.and.returnValue(null);


      serviceSpy.getOrderItems.and.returnValue(of(mockOrderItems));


      serviceSpy.getOrderHeader.and.returnValue(of(null));
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(SpecialOrderAllocation);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load order types on init', () => {
      fixture.detectChanges();
      expect((component as any).orderTypes().length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require type and order for RETRIEVE button', () => {
      expect((component as any).canRetrieve()).toBeFalse();

      component.searchForm.patchValue({ type: 'SPECIAL', order: '240500017' });
      expect((component as any).canRetrieve()).toBeTrue();
    });


  });

  describe('Order Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate orders when type is selected', fakeAsync(() => {
      component.searchForm.patchValue({ type: 'SPECIAL' });
      tick(600);

      expect((component as any).orders().length).toBeGreaterThan(0);
    }));

    it('should set selected order when order is changed', () => {
      (component as any).orders.set([
        {
          orderNo: '240500017',
          orderType: 'SPECIAL',
          customerName: 'Parkland Hospital',
          status: 'Ordered',
          priority: 'Routine',
          estimateArrivalTime: '1-MAR-2025, 09:00 AM',
          customerId: 'CUST001',
          consigneeId: null
        }
      ]);

      (component as any).selectOrder('240500017');
      expect((component as any).selectedOrder()).toBeTruthy();
      expect((component as any).selectedOrder()!.orderNo).toBe('240500017');
    });
  });

  describe('RETRIEVE Button', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load order items when RETRIEVE is clicked with valid order', fakeAsync(() => {
      (component as any).orders.set([
        { orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null }
      ]);
      (component as any).selectedOrder.set({ orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null });
      // Use emitEvent: false to prevent the type valueChanges listener from
      // clearing selectedOrder and resetting the order field.
      component.searchForm.patchValue({ type: 'SPECIAL', order: '240500017' }, { emitEvent: false });
      component.onRetrieve();
      tick(600);

      expect(serviceSpy.getOrderItems).toHaveBeenCalledWith('240500017', 25, 0);
      expect((component as any).orderItems().length).toBe(1);
    }));



    it('should handle error when loading order items', fakeAsync(() => {
      serviceSpy.getOrderItems.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      (component as any).orders.set([
        { orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null }
      ]);
      (component as any).selectedOrder.set({ orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null });
      component.searchForm.patchValue({ type: 'SPECIAL', order: '240500017' }, { emitEvent: false });
      component.onRetrieve();
      tick();

      expect((component as any).error()).toBeTruthy();
    }));
  });

  describe('CLEAR ALL Button', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and state when clicked', () => {
      component.searchForm.patchValue({ type: 'SPECIAL', order: '240500017' });
      (component as any).orderItems.set([
        {
          itemNo: 1,
          productCode: 'WB-H',
          productDescription: 'Whole Blood',
          aboRh: 'O+',
          substitutionFlag: 'Yes',
          orderedQuantity: 1,
          allocatedQuantity: 0,
          allocatedQuantityDisplay: 'Ordered',
          groupCode: '--',
          attributeCode: '--',
          antigenCodes: 'K',
          orderNo: '240500017',
          bloodType: null,
          abo: 'O',
          rh: '+',
          subOk: 'Y',
          tier: 1,
          unitPrice: 0
        } as OrderItemTableRow
      ]);

      component.onClearAll();

      expect(component.searchForm.get('order')?.value).toBeFalsy();
      expect((component as any).selectedOrder()).toBeNull();
      expect((component as any).orderItems().length).toBe(0);
    });
  });

  describe('Row Action Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save state and navigate when row action is clicked', () => {
      (component as any).currentPickSlipId.set('12345');
      (component as any).selectedOrder.set({ orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null });
      const row: OrderItemTableRow = {
        itemNo: 1,
        productCode: 'WB-H',
        productDescription: 'Whole Blood',
        aboRh: 'O+',
        substitutionFlag: 'Yes',
        orderedQuantity: 1,
        allocatedQuantity: 0,
        allocatedQuantityDisplay: 'Ordered',
        groupCode: '--',
        attributeCode: '--',
        antigenCodes: 'K',
        orderNo: '240500017',
        bloodType: null,
        abo: 'O',
        rh: '+',
        subOk: 'Y',
        tier: 1,
        unitPrice: 0
      };

      component.onRowAction(row);

      expect(matchingProductsStateSpy.saveState).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should navigate even when pickSlipId is empty (pickSlipId is optional)', () => {
      (component as any).currentPickSlipId.set(null);
      (component as any).selectedOrder.set({ orderNo: '240500017', orderType: 'SPECIAL', customerName: 'Parkland Hospital', status: 'Ordered', priority: 'Routine', estimateArrivalTime: null, customerId: 'CUST001', consigneeId: null });
      const row: OrderItemTableRow = {
        itemNo: 1,
        productCode: 'WB-H',
        productDescription: 'Whole Blood',
        aboRh: 'O+',
        substitutionFlag: 'Yes',
        orderedQuantity: 1,
        allocatedQuantity: 0,
        allocatedQuantityDisplay: 'Ordered',
        groupCode: '--',
        attributeCode: '--',
        antigenCodes: 'K',
        orderNo: '240500017',
        bloodType: null,
        abo: 'O',
        rh: '+',
        subOk: 'Y',
        tier: 1,
        unitPrice: 0
      };

      component.onRowAction(row);

      expect(matchingProductsStateSpy.saveState).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });
  });






});
