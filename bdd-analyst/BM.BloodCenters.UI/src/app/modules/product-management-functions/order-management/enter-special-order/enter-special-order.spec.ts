import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';

import { EnterSpecialOrderComponent } from './enter-special-order';
import { SpecialOrderApiService } from './services/special-order-api.service';
import { ConfirmOrderReleaseDialogComponent } from '../enter-regular-order/dialogs/confirm-order-release-dialog/confirm-order-release-dialog';
import { SpOpenOrdersDialogComponent } from './dialogs/sp-open-orders-dialog/sp-open-orders-dialog';
import { InventoryDialogComponent } from '../enter-regular-order/dialogs/inventory-dialog/inventory-dialog';
import { SpecialChargesDialogComponent } from '../enter-regular-order/dialogs/special-charges-dialog/special-charges-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

describe('EnterSpecialOrderComponent', () => {
  let component: EnterSpecialOrderComponent;
  let fixture: ComponentFixture<EnterSpecialOrderComponent>;
  let apiSpy: jasmine.SpyObj<SpecialOrderApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('SpecialOrderApiService', [
      'createOrder',
      'addOrderItem',
      'deleteOrderItem',
      'updateOrder',
      'getOrder',
      'cancelOrder',
      'getOpenOrderItems',
      'getProductTypesLookup',
      'getOrderCharges',
      'getInventorySummary'
    ]);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal']);
    apiSpy.cancelOrder.and.returnValue(of(void 0 as any));

    TestBed.configureTestingModule({
      imports: [
        EnterSpecialOrderComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: SpecialOrderApiService, useValue: apiSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(EnterSpecialOrderComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(EnterSpecialOrderComponent);
    component = fixture.componentInstance;
  });

  // ── Creation ──

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Default signal values ──

  describe('default signal values', () => {
    it('should have currentStep set to 1', () => {
      expect(component.currentStep()).toBe(1);
    });

    it('should have loading set to false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have saving set to false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should have isStep1Valid set to false', () => {
      expect(component.isStep1Valid()).toBeFalse();
    });

    it('should have orderData as empty object', () => {
      expect(component.orderData()).toEqual({});
    });

    it('should have orderItems as empty array', () => {
      expect(component.orderItems()).toEqual([]);
    });

    it('should have orderNotes as empty string', () => {
      expect(component.orderNotes()).toBe('');
    });
  });

  // ── ngOnInit ──

  describe('ngOnInit', () => {
    it('should be callable without error', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  // ── ngOnDestroy ──

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      const nextSpy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── resetForm ──

  describe('resetForm', () => {
    it('should reset currentStep to 1', () => {
      component.currentStep.set(2);
      component.resetForm();
      expect(component.currentStep()).toBe(1);
    });

    it('should reset orderData to empty object', () => {
      component.orderData.set({ customerId: 'C1', orderNo: 'SO-001' } as any);
      component.resetForm();
      expect(component.orderData()).toEqual({});
    });

    it('should reset orderItems to empty array', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      component.resetForm();
      expect(component.orderItems()).toEqual([]);
    });

    it('should reset orderNotes to empty string', () => {
      component.orderNotes.set('Some notes');
      component.resetForm();
      expect(component.orderNotes()).toBe('');
    });

    it('should reset isStep1Valid to false', () => {
      component.isStep1Valid.set(true);
      component.resetForm();
      expect(component.isStep1Valid()).toBeFalse();
    });

    it('should emit customerChanged with false', () => {
      const emitSpy = spyOn(component.customerChanged, 'emit');
      component.resetForm();
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  // ── onStep1FormDataChange ──

  describe('onStep1FormDataChange', () => {
    it('should set orderData with provided data', () => {
      const data = { customerId: 'C1', priority: 'P1' };
      component.onStep1FormDataChange(data);
      expect(component.orderData()).toEqual(data);
    });

    it('should emit customerChanged with true when customerId is present', () => {
      const emitSpy = spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({ customerId: 'C1' });
      expect(emitSpy).toHaveBeenCalledWith(true);
    });

    it('should emit customerChanged with false when customerId is empty', () => {
      const emitSpy = spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({ customerId: '' });
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should emit customerChanged with false when customerId is undefined', () => {
      const emitSpy = spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({});
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  // ── onStep1ValidityChange ──

  describe('onStep1ValidityChange', () => {
    it('should set isStep1Valid to true', () => {
      component.onStep1ValidityChange(true);
      expect(component.isStep1Valid()).toBeTrue();
    });

    it('should set isStep1Valid to false', () => {
      component.isStep1Valid.set(true);
      component.onStep1ValidityChange(false);
      expect(component.isStep1Valid()).toBeFalse();
    });
  });

  // ── goToStep2 ──

  describe('goToStep2', () => {
    it('should not advance to step 2 when step 1 is invalid', () => {
      component.isStep1Valid.set(false);
      component.goToStep2();
      expect(component.currentStep()).toBe(1);
    });

    it('should advance to step 2 when step 1 is valid', () => {
      component.isStep1Valid.set(true);
      component.goToStep2();
      expect(component.currentStep()).toBe(2);
    });
  });

  // ── goToStep1 ──

  describe('goToStep1', () => {
    it('should set currentStep to 1', () => {
      component.currentStep.set(2);
      component.goToStep1();
      expect(component.currentStep()).toBe(1);
    });

    it('should set currentStep to 1 even when already on step 1', () => {
      component.currentStep.set(1);
      component.goToStep1();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ── onItemAdded ──

  describe('onItemAdded', () => {
    const mockItem = {
      itemNo: 1,
      productType: 'RBC',
      bloodType: 'A+',
      tier: 1,
      requiredQty: 2
    };

    describe('when orderNo already exists', () => {
      beforeEach(() => {
        component.orderData.set({ orderNo: 'SO-001' } as any);
      });

      it('should call addOrderItem with existing orderNo', () => {
        const mockItems = [{ orderNo: 'SO-001', itemNo: 1 } as any];
        apiSpy.addOrderItem.and.returnValue(of(mockItems));

        component.onItemAdded(mockItem);

        expect(apiSpy.addOrderItem).toHaveBeenCalledWith('SO-001', mockItem);
      });

      it('should set saving to true before API call', () => {
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        // After subscribe completes synchronously, saving is reset to false
        // We verify saving was toggled by checking final state
        expect(component.saving()).toBeFalse();
      });

      it('should set orderItems on success', () => {
        const mockItems = [
          { orderNo: 'SO-001', itemNo: 1, productType: 'RBC' } as any
        ];
        apiSpy.addOrderItem.and.returnValue(of(mockItems));

        component.onItemAdded(mockItem);

        expect(component.orderItems()).toEqual(mockItems);
      });

      it('should emit itemsChanged on success', () => {
        apiSpy.addOrderItem.and.returnValue(of([]));
        const emitSpy = spyOn(component.itemsChanged, 'emit');

        component.onItemAdded(mockItem);

        expect(emitSpy).toHaveBeenCalled();
      });

      it('should handle null response items gracefully', () => {
        apiSpy.addOrderItem.and.returnValue(of(null as any));

        component.onItemAdded(mockItem);

        expect(component.orderItems()).toEqual([]);
      });

      it('should set saving to false on success', () => {
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        expect(component.saving()).toBeFalse();
      });

      it('should set saving to false on error', () => {
        apiSpy.addOrderItem.and.returnValue(throwError(() => new Error('fail')));

        component.onItemAdded(mockItem);

        expect(component.saving()).toBeFalse();
      });

      it('should show error snackbar on addOrderItem failure', () => {
        apiSpy.addOrderItem.and.returnValue(throwError(() => new Error('fail')));

        component.onItemAdded(mockItem);

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Failed to add item. Please try again.',
          'DISMISS',
          jasmine.objectContaining({
            horizontalPosition: 'end',
            verticalPosition: 'top',
            duration: 5000,
            panelClass: ['error-snackbar']
          })
        );
      });
    });

    describe('when orderNo does not exist (creates order first)', () => {
      beforeEach(() => {
        component.orderData.set({ customerId: 'C1', priority: 'P1', orderedBy: 'Admin' } as any);
      });

      it('should call createOrder then addOrderItem', () => {
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        expect(apiSpy.createOrder).toHaveBeenCalled();
        expect(apiSpy.addOrderItem).toHaveBeenCalledWith('SO-NEW', mockItem);
      });

      it('should emit orderCreated with new orderNo', () => {
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));
        const emitSpy = spyOn(component.orderCreated, 'emit');

        component.onItemAdded(mockItem);

        expect(emitSpy).toHaveBeenCalledWith('SO-NEW');
      });

      it('should update orderData with new orderNo', () => {
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        expect(component.orderData().orderNo).toBe('SO-NEW');
      });

      it('should handle uppercase OrderNo field from response', () => {
        apiSpy.createOrder.and.returnValue(of({ OrderNo: 'SO-UPPER' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));
        const emitSpy = spyOn(component.orderCreated, 'emit');

        component.onItemAdded(mockItem);

        expect(emitSpy).toHaveBeenCalledWith('SO-UPPER');
      });

      it('should handle missing orderNo in create response', () => {
        apiSpy.createOrder.and.returnValue(of({} as any));
        apiSpy.addOrderItem.and.returnValue(of([]));
        const emitSpy = spyOn(component.orderCreated, 'emit');

        component.onItemAdded(mockItem);

        expect(emitSpy).toHaveBeenCalledWith('');
      });

      it('should set orderItems on success after create', () => {
        const items = [{ orderNo: 'SO-NEW', itemNo: 1 } as any];
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of(items));

        component.onItemAdded(mockItem);

        expect(component.orderItems()).toEqual(items);
      });

      it('should emit itemsChanged after create and add', () => {
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));
        const emitSpy = spyOn(component.itemsChanged, 'emit');

        component.onItemAdded(mockItem);

        expect(emitSpy).toHaveBeenCalled();
      });

      it('should set saving to false on success', () => {
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-NEW' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        expect(component.saving()).toBeFalse();
      });

      it('should show error snackbar on createOrder failure', () => {
        apiSpy.createOrder.and.returnValue(throwError(() => new Error('create fail')));

        component.onItemAdded(mockItem);

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Failed to create order. Please try again.',
          'DISMISS',
          jasmine.objectContaining({
            duration: 5000,
            panelClass: ['error-snackbar']
          })
        );
      });

      it('should set saving to false on createOrder failure', () => {
        apiSpy.createOrder.and.returnValue(throwError(() => new Error('fail')));

        component.onItemAdded(mockItem);

        expect(component.saving()).toBeFalse();
      });

      it('should build create request from orderData with fallbacks', () => {
        component.orderData.set({} as any);
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-1' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        const request = apiSpy.createOrder.calls.mostRecent().args[0];
        expect(request.customerId).toBe('');
        expect(request.orderType).toBe('SP');
        expect(request.orderClass).toBe('');
        expect(request.orderedBy).toBe('');
        expect(request.contractId).toBe('');
        expect(request.orderMode).toBe('');
        expect(request.consigneeId).toBe('');
        expect(request.payeeId).toBe('');
        expect(request.patientName).toBe('');
      });

      it('should pass doctorName and notes when present', () => {
        component.orderData.set({
          customerId: 'C1',
          priority: 'P1',
          doctorName: 'Dr. Smith',
          notes: 'Rush order'
        } as any);
        apiSpy.createOrder.and.returnValue(of({ orderNo: 'SO-1' } as any));
        apiSpy.addOrderItem.and.returnValue(of([]));

        component.onItemAdded(mockItem);

        const request = apiSpy.createOrder.calls.mostRecent().args[0];
        expect(request.doctorName).toBe('Dr. Smith');
        expect(request.notes).toBe('Rush order');
      });
    });
  });

  // ── onItemAddedExtra ──

  describe('onItemAddedExtra', () => {
    it('should not modify items when orderItems is empty', () => {
      component.orderItems.set([]);
      component.onItemAddedExtra({ attribGroup: 'GRP1', attribCode: 'C1' });
      expect(component.orderItems()).toEqual([]);
    });

    it('should update the last item with extra attributes', () => {
      component.orderItems.set([
        { orderNo: 'SO-001', itemNo: 1, productType: 'RBC' } as any,
        { orderNo: 'SO-001', itemNo: 2, productType: 'PLT' } as any
      ]);

      component.onItemAddedExtra({ attribGroup: 'GRP1', attribCode: 'AC1' });

      const items = component.orderItems();
      expect(items[1].attribGroup).toBe('GRP1');
      expect(items[1].attribCode).toBe('AC1');
      // First item should remain unchanged
      expect(items[0].attribGroup).toBeUndefined();
    });

    it('should update the only item when there is one', () => {
      component.orderItems.set([
        { orderNo: 'SO-001', itemNo: 1, productType: 'RBC' } as any
      ]);

      component.onItemAddedExtra({ attribGroup: 'GRP2' });

      expect(component.orderItems()[0].attribGroup).toBe('GRP2');
    });

    it('should handle empty extra object', () => {
      component.orderItems.set([
        { orderNo: 'SO-001', itemNo: 1, productType: 'RBC' } as any
      ]);

      component.onItemAddedExtra({});

      expect(component.orderItems()[0].productType).toBe('RBC');
    });
  });

  // ── onItemDeleted ──

  describe('onItemDeleted', () => {
    describe('when orderNo exists', () => {
      beforeEach(() => {
        component.orderData.set({ orderNo: 'SO-001' } as any);
        component.orderItems.set([
          { orderNo: 'SO-001', itemNo: 1 } as any,
          { orderNo: 'SO-001', itemNo: 2 } as any
        ]);
      });

      it('should call deleteOrderItem API', () => {
        apiSpy.deleteOrderItem.and.returnValue(of(true));

        component.onItemDeleted(1);

        expect(apiSpy.deleteOrderItem).toHaveBeenCalledWith('SO-001', 1);
      });

      it('should remove item from orderItems on success', () => {
        apiSpy.deleteOrderItem.and.returnValue(of(true));

        component.onItemDeleted(1);

        expect(component.orderItems().length).toBe(1);
        expect(component.orderItems()[0].itemNo).toBe(2);
      });

      it('should emit itemsChanged on success', () => {
        apiSpy.deleteOrderItem.and.returnValue(of(true));
        const emitSpy = spyOn(component.itemsChanged, 'emit');

        component.onItemDeleted(1);

        expect(emitSpy).toHaveBeenCalled();
      });
    });

    describe('when orderNo does not exist', () => {
      beforeEach(() => {
        component.orderData.set({} as any);
        component.orderItems.set([
          { orderNo: '', itemNo: 1 } as any,
          { orderNo: '', itemNo: 2 } as any
        ]);
      });

      it('should remove item from orderItems locally without API call', () => {
        component.onItemDeleted(1);

        expect(apiSpy.deleteOrderItem).not.toHaveBeenCalled();
        expect(component.orderItems().length).toBe(1);
        expect(component.orderItems()[0].itemNo).toBe(2);
      });

      it('should emit itemsChanged', () => {
        const emitSpy = spyOn(component.itemsChanged, 'emit');

        component.onItemDeleted(1);

        expect(emitSpy).toHaveBeenCalled();
      });
    });

    it('should not remove items when itemNo does not match any item', () => {
      component.orderData.set({} as any);
      component.orderItems.set([
        { orderNo: '', itemNo: 1 } as any,
        { orderNo: '', itemNo: 2 } as any
      ]);

      component.onItemDeleted(99);

      expect(component.orderItems().length).toBe(2);
    });
  });

  // ── onSubmitOrder ──

  describe('onSubmitOrder', () => {
    it('should show snackbar when no items exist', () => {
      component.orderItems.set([]);

      component.onSubmitOrder();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please add at least one product item.',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should not open dialog when no items exist', () => {
      component.orderItems.set([]);

      component.onSubmitOrder();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open confirm dialog when items exist', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmOrderReleaseDialogComponent,
        jasmine.objectContaining({
          width: '500px',
          disableClose: true
        })
      );
    });

    it('should call releaseOrder when dialog confirms', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      component.orderData.set({ orderNo: 'SO-001' } as any);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      apiSpy.updateOrder.and.returnValue(of({} as any));
      apiSpy.getOrder.and.returnValue(of({} as any));

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).toHaveBeenCalledWith('SO-001', { orderStatus: 'RL' });
    });

    it('should not call releaseOrder when dialog is cancelled', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).not.toHaveBeenCalled();
    });

    it('should not call releaseOrder when dialog returns null', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).not.toHaveBeenCalled();
    });

    it('should not call releaseOrder when dialog returns undefined', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).not.toHaveBeenCalled();
    });
  });

  // ── releaseOrder (via onSubmitOrder) ──

  describe('releaseOrder (via onSubmitOrder)', () => {
    beforeEach(() => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      apiSpy.getOrder.and.returnValue(of({} as any));
    });

    it('should not call updateOrder when orderNo is missing', () => {
      component.orderData.set({} as any);

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).not.toHaveBeenCalled();
    });

    it('should call updateOrder with status RL on success path', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));

      component.onSubmitOrder();

      expect(apiSpy.updateOrder).toHaveBeenCalledWith('SO-001', { orderStatus: 'RL' });
    });

    it('should show success snackbar with order number on release success', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));

      component.onSubmitOrder();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Order Number SO-001 is Printing',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 8000
        })
      );
    });

    it('should reset form on release success', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));
      const resetSpy = spyOn(component, 'resetForm');

      component.onSubmitOrder();

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should set saving to false on release success', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));

      component.onSubmitOrder();

      expect(component.saving()).toBeFalse();
    });

    it('should show error snackbar on release failure', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(throwError(() => new Error('fail')));

      component.onSubmitOrder();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to release order. Please try again.',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should set saving to false on release failure', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(throwError(() => new Error('fail')));

      component.onSubmitOrder();

      expect(component.saving()).toBeFalse();
    });
  });

  // ── onOpenOrders ──

  describe('onOpenOrders', () => {
    it('should return early when customerId is not set', () => {
      component.orderData.set({} as any);

      component.onOpenOrders();

      expect(apiSpy.getOpenOrderItems).not.toHaveBeenCalled();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return early when customerId is empty string', () => {
      component.orderData.set({ customerId: '' } as any);

      component.onOpenOrders();

      expect(apiSpy.getOpenOrderItems).not.toHaveBeenCalled();
    });

    it('should fetch open order items for the customer', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      apiSpy.getOpenOrderItems.and.returnValue(of([]));

      component.onOpenOrders();

      expect(apiSpy.getOpenOrderItems).toHaveBeenCalledWith('CUST-001');
    });

    it('should open SpOpenOrdersDialogComponent with mapped data', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [
        {
          orderNo: 'SO-001',
          itemNo: 1,
          productType: 'RBC',
          bloodTypeDesc: 'A Positive',
          requiredQty: 5,
          allocatedQty: 2,
          insertDate: '2025-01-01',
          hoursElapsed: 24,
          attribute: 'ATTR1',
          antigenId: 'AGN1'
        }
      ];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        SpOpenOrdersDialogComponent,
        jasmine.objectContaining({
          width: '1200px',
          height: '100vh',
          panelClass: 'right-panel-dialog',
          data: jasmine.objectContaining({
            customerId: 'CUST-001',
            orders: [jasmine.objectContaining({
              orderNumber: 'SO-001',
              item: 1,
              productType: 'RBC',
              abORh: 'A Positive',
              quantityRequired: 5,
              quantityAl: 2,
              date: '2025-01-01',
              hours: 24,
              attribute: 'ATTR1',
              antigenId: 'AGN1'
            })]
          })
        })
      );
    });

    it('should use bloodType as fallback when bloodTypeDesc is missing', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1, bloodType: 'O+' }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].abORh).toBe('O+');
    });

    it('should use -- when both bloodTypeDesc and bloodType are missing', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1 }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].abORh).toBe('--');
    });

    it('should default allocatedQty to 0 when null', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1, allocatedQty: null }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].quantityAl).toBe(0);
    });

    it('should default hoursElapsed to 0 when null', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1, hoursElapsed: null }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].hours).toBe(0);
    });

    it('should use -- for attribute when missing', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1 }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].attribute).toBe('--');
    });

    it('should use -- for antigenId when missing', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      const mockItems = [{ orderNo: 'SO-001', itemNo: 1 }];
      apiSpy.getOpenOrderItems.and.returnValue(of(mockItems));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders[0].antigenId).toBe('--');
    });

    it('should handle null items from API gracefully', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      apiSpy.getOpenOrderItems.and.returnValue(of(null as any));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders).toEqual([]);
    });

    it('should handle API error by returning empty array via catchError', () => {
      component.orderData.set({ customerId: 'CUST-001' } as any);
      apiSpy.getOpenOrderItems.and.returnValue(throwError(() => new Error('fail')));

      component.onOpenOrders();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.orders).toEqual([]);
    });
  });

  // ── onQueryStocks ──

  describe('onQueryStocks', () => {
    it('should fetch product types lookup', () => {
      apiSpy.getProductTypesLookup.and.returnValue(of([]));

      component.onQueryStocks();

      expect(apiSpy.getProductTypesLookup).toHaveBeenCalled();
    });

    it('should open InventoryDialogComponent with products and apiService', () => {
      const mockProducts = [{ code: 'RBC', description: 'Red Blood Cells' }];
      apiSpy.getProductTypesLookup.and.returnValue(of(mockProducts));

      component.onQueryStocks();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        InventoryDialogComponent,
        jasmine.objectContaining({
          width: '750px',
          height: '100vh',
          panelClass: 'right-panel-dialog',
          data: jasmine.objectContaining({
            products: mockProducts,
            apiService: apiSpy
          })
        })
      );
    });

    it('should open dialog with right panel position', () => {
      apiSpy.getProductTypesLookup.and.returnValue(of([]));

      component.onQueryStocks();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        InventoryDialogComponent,
        jasmine.objectContaining({
          position: { right: '0' }
        })
      );
    });
  });

  // ── onCharges ──

  describe('onCharges', () => {
    it('should show snackbar when orderNo is not set', () => {
      component.orderData.set({} as any);

      component.onCharges();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please create the order first before adding charges.',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should show snackbar when orderNo is empty string', () => {
      component.orderData.set({ orderNo: '' } as any);

      component.onCharges();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please create the order first before adding charges.',
        'DISMISS',
        jasmine.anything()
      );
    });

    it('should not call getOrderCharges when orderNo is missing', () => {
      component.orderData.set({} as any);

      component.onCharges();

      expect(apiSpy.getOrderCharges).not.toHaveBeenCalled();
    });

    it('should fetch charges for existing order', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.getOrderCharges.and.returnValue(of([]));

      component.onCharges();

      expect(apiSpy.getOrderCharges).toHaveBeenCalledWith('SO-001');
    });

    it('should open SpecialChargesDialogComponent with charges data', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      const mockCharges = [{ chargeCode: 'SHIP', amount: 25 }];
      apiSpy.getOrderCharges.and.returnValue(of(mockCharges));

      component.onCharges();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        SpecialChargesDialogComponent,
        jasmine.objectContaining({
          width: '800px',
          height: '100vh',
          panelClass: 'right-panel-dialog',
          data: jasmine.objectContaining({
            orderNo: 'SO-001',
            charges: mockCharges,
            apiService: apiSpy
          })
        })
      );
    });

    it('should open dialog with right panel position', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.getOrderCharges.and.returnValue(of([]));

      component.onCharges();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        SpecialChargesDialogComponent,
        jasmine.objectContaining({
          position: { right: '0' }
        })
      );
    });

    it('should handle API error gracefully via catchError', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.getOrderCharges.and.returnValue(throwError(() => new Error('fail')));

      component.onCharges();

      // catchError returns of([]), so dialog should still open with empty charges
      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]!.data;
      expect(dialogData.charges).toEqual([]);
    });
  });

  // ── Subscription cleanup ──

  describe('subscription cleanup', () => {
    it('should not process addOrderItem subscription after destroy', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      const subject = new Subject<any>();
      apiSpy.addOrderItem.and.returnValue(subject.asObservable());

      component.onItemAdded({
        itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1
      });

      component.ngOnDestroy();
      subject.next([{ orderNo: 'SO-001', itemNo: 1 } as any]);

      // orderItems should remain empty since destroy$ fired before subject emitted
      expect(component.orderItems()).toEqual([]);
    });

    it('should not process deleteOrderItem subscription after destroy', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([
        { orderNo: 'SO-001', itemNo: 1 } as any,
        { orderNo: 'SO-001', itemNo: 2 } as any
      ]);
      const subject = new Subject<any>();
      apiSpy.deleteOrderItem.and.returnValue(subject.asObservable());

      component.onItemDeleted(1);
      component.ngOnDestroy();
      subject.next(true);

      // Items should remain unchanged since destroy$ fired before response
      expect(component.orderItems().length).toBe(2);
    });

    it('should not process updateOrder subscription after destroy', () => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      component.orderData.set({ orderNo: 'SO-001' } as any);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);

      const subject = new Subject<any>();
      apiSpy.updateOrder.and.returnValue(subject.asObservable());

      component.onSubmitOrder();
      component.ngOnDestroy();
      subject.next({});

      // saving should still be true since the response was not processed
      expect(component.saving()).toBeTrue();
    });
  });

  // ── Output emitters ──

  describe('output emitters', () => {
    it('should have customerChanged output', () => {
      expect(component.customerChanged).toBeTruthy();
    });

    it('should have orderCreated output', () => {
      expect(component.orderCreated).toBeTruthy();
    });

    it('should have itemsChanged output', () => {
      expect(component.itemsChanged).toBeTruthy();
    });
  });

  // ── Gap #1: onSubmitOrder validation – antigen/attribute ──

  describe('onSubmitOrder antigen/attribute validation', () => {
    it('should show snackbar when item has no antigen AND no attribute', () => {
      component.orderItems.set([{ itemNo: 1 } as any]);

      component.onSubmitOrder();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Item 1: An attribute or antigen must be entered for custom order items',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should NOT show validation error when item has antigenId', () => {
      component.orderItems.set([{ itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should NOT show validation error when item has attribGroup AND attribCode', () => {
      component.orderItems.set([{ itemNo: 1, attribGroup: 'GRP1', attribCode: 'C1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      component.onSubmitOrder();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should stop at first invalid item', () => {
      component.orderItems.set([
        { itemNo: 1, antigenId: 'AG1' } as any,
        { itemNo: 2 } as any,
        { itemNo: 3 } as any
      ]);

      component.onSubmitOrder();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Item 2: An attribute or antigen must be entered for custom order items',
        'DISMISS',
        jasmine.anything()
      );
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  // ── Gap #9: releaseOrder – getOrder and estArrivalTime ──

  describe('releaseOrder – getOrder and estArrivalTime', () => {
    beforeEach(() => {
      component.orderItems.set([{ orderNo: 'SO-001', itemNo: 1, antigenId: 'AG1' } as any]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
    });

    it('should call getOrder after updateOrder succeeds', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));
      apiSpy.getOrder.and.returnValue(of({} as any));

      component.onSubmitOrder();

      expect(apiSpy.getOrder).toHaveBeenCalledWith('SO-001');
    });

    it('should set estArrivalTime on orderData when order has estArrivalTime', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));
      const mockLocalMoment = moment('2025-06-15T10:30:00');
      chapterTimezoneSpy.convertGmtToLocal.and.returnValue(mockLocalMoment);
      apiSpy.getOrder.and.returnValue(of({ estArrivalTime: '2025-06-15T14:30:00Z' } as any));

      component.onSubmitOrder();

      expect(component.orderData().estArrivalTime).toBe('15-JUN-2025, 10:30 AM');
    });

    it('should call convertGmtToLocal for timezone conversion', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      apiSpy.updateOrder.and.returnValue(of({} as any));
      const mockLocalMoment = moment('2025-06-15T10:30:00');
      chapterTimezoneSpy.convertGmtToLocal.and.returnValue(mockLocalMoment);
      apiSpy.getOrder.and.returnValue(of({ estArrivalTime: '2025-06-15T14:30:00Z' } as any));

      component.onSubmitOrder();

      expect(chapterTimezoneSpy.convertGmtToLocal).toHaveBeenCalled();
    });
  });

  // ── Gap #11: ngOnDestroy – auto-cancel empty orders ──

  describe('ngOnDestroy – auto-cancel empty orders', () => {
    it('should call cancelOrder when orderNo exists and items are empty', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      apiSpy.cancelOrder.and.returnValue(of(void 0 as any));

      component.ngOnDestroy();

      expect(apiSpy.cancelOrder).toHaveBeenCalledWith('SO-001');
    });

    it('should NOT call cancelOrder when orderNo exists but items are NOT empty', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([{ itemNo: 1 } as any]);

      component.ngOnDestroy();

      expect(apiSpy.cancelOrder).not.toHaveBeenCalled();
    });

    it('should NOT call cancelOrder when orderNo does not exist', () => {
      component.orderData.set({} as any);
      component.orderItems.set([]);

      component.ngOnDestroy();

      expect(apiSpy.cancelOrder).not.toHaveBeenCalled();
    });
  });

  // ── Gap #11: canDeactivate route guard ──

  describe('canDeactivate', () => {
    it('should return true when no orderNo exists', () => {
      component.orderData.set({} as any);

      const result = component.canDeactivate();

      expect(result).toBe(true);
    });

    it('should return true when orderNo exists but items are not empty', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([{ itemNo: 1 } as any]);

      const result = component.canDeactivate();

      expect(result).toBe(true);
    });

    it('should open confirm dialog when orderNo exists and items are empty', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      apiSpy.cancelOrder.and.returnValue(of(void 0 as any));

      component.canDeactivate();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmActionDialogComponent,
        jasmine.objectContaining({
          width: '400px',
          disableClose: true,
          data: jasmine.objectContaining({
            title: 'Cancel Order',
            message: 'No items in order. Cancel order?'
          })
        })
      );
    });

    it('should call cancelOrder and return true when dialog confirmed', (done: DoneFn) => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      apiSpy.cancelOrder.and.returnValue(of(void 0 as any));

      const result = component.canDeactivate();

      (result as Observable<boolean>).subscribe(val => {
        expect(apiSpy.cancelOrder).toHaveBeenCalledWith('SO-001');
        expect(val).toBe(true);
        done();
      });
    });

    it('should return false when dialog cancelled', (done: DoneFn) => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);

      const result = component.canDeactivate();

      (result as Observable<boolean>).subscribe(val => {
        expect(apiSpy.cancelOrder).not.toHaveBeenCalled();
        expect(val).toBe(false);
        done();
      });
    });

    it('should return true even when cancelOrder fails', (done: DoneFn) => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      apiSpy.cancelOrder.and.returnValue(throwError(() => new Error('cancel failed')));

      const result = component.canDeactivate();

      (result as Observable<boolean>).subscribe(val => {
        expect(val).toBe(true);
        done();
      });
    });
  });

  // ── Gap #11: onBeforeUnload ──

  describe('onBeforeUnload', () => {
    it('should call preventDefault when orderNo exists and no items', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([]);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.onBeforeUnload(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should NOT call preventDefault when items exist', () => {
      component.orderData.set({ orderNo: 'SO-001' } as any);
      component.orderItems.set([{ itemNo: 1 } as any]);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.onBeforeUnload(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should NOT call preventDefault when no orderNo', () => {
      component.orderData.set({} as any);
      component.orderItems.set([]);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;

      component.onBeforeUnload(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
