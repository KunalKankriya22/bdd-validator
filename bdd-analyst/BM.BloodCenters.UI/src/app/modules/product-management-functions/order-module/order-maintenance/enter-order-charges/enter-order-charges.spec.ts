import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';

import {
  createMockHeaderService,
  createMockSnackbarService,
  createMockMatDialog,
} from '@shared/testing/common-mocks';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { EnterOrderChargesComponent } from './enter-order-charges';
import { EnterOrderChargesApiService } from './services/enter-order-charges-api.service';
import { AddEditChargeDialogComponent } from './dialogs/add-edit-charge-dialog/add-edit-charge-dialog';
import {
  OrderChargesHeaderDto,
  OrderChargeDto,
  ServiceCodeDto,
} from './models/enter-order-charges.model';

describe('EnterOrderChargesComponent', () => {
  let component: EnterOrderChargesComponent;
  let fixture: ComponentFixture<EnterOrderChargesComponent>;
  let mockApiService: jasmine.SpyObj<EnterOrderChargesApiService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<any>;
  let mockHeaderService: any;
  let mockPageHeaderService: any;
  let chapterChanged$: Subject<void>;

  const mockServiceCodes: ServiceCodeDto[] = [
    { code: 'SVC1', description: 'Service One', defaultAmount: 50, isAmountEditable: true },
    { code: 'SVC2', description: 'Service Two', defaultAmount: 100, isAmountEditable: false },
  ];

  const mockCharges: OrderChargeDto[] = [
    {
      chargeId: 'SVC1',
      serviceCode: 'SVC1',
      serviceDescription: 'Service One',
      creditDebit: 'Credit',
      quantity: 2,
      amount: 100,
      isAmountEditable: true,
      lastModified: '2024-01-15',
    },
  ];

  const mockOrderData: OrderChargesHeaderDto = {
    orderNo: 'ORD001',
    orderName: 'Hospital A',
    orderDate: '2024-01-15',
    charges: mockCharges,
    grandTotal: 100,
  };

  function setupOrderData(): void {
    mockApiService.getOrderCharges.and.returnValue(of({
      success: true,
      data: [mockOrderData] as any,
      message: '',
      statusCode: 200,
    }));
    component.onOrderSelected('ORD001');
  }

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    mockSnackbar = createMockSnackbarService();
    mockDialog = createMockMatDialog();
    mockPageHeaderService = { pageHeaderData: signal<any>({ title: 'Enter Order Charges', subtitle: '' }) };

    mockApiService = jasmine.createSpyObj('EnterOrderChargesApiService', [
      'getOrders',
      'getOrderCharges',
      'getServiceCodes',
      'getCrDbIndicators',
      'addCharge',
      'updateCharge',
      'deleteCharge',
      'getOrderItems',
      'getItemAttributesAntigens',
    ]);
    mockApiService.getOrders.and.returnValue(of({
      success: true,
      data: [{ orderNo: 'ORD001', orderName: 'Hospital A', orderDate: '2024-01-15' }],
      message: '',
      statusCode: 200,
    }));
    mockApiService.getServiceCodes.and.returnValue(of({ success: true, data: mockServiceCodes, message: '', statusCode: 200 }));
    mockApiService.getCrDbIndicators.and.returnValue(of({
      success: true,
      data: [{ code: 'CR', description: 'Credit' }, { code: 'DB', description: 'Debit' }],
      message: '',
      statusCode: 200,
    }));
    mockApiService.getOrderCharges.and.returnValue(of({
      success: true,
      data: [mockOrderData] as any,
      message: '',
      statusCode: 200,
    }));

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: EnterOrderChargesApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).overrideComponent(EnterOrderChargesComponent, {
      set: {
        imports: [CommonModule],
        template: '',
      },
    });

    fixture = TestBed.createComponent(EnterOrderChargesComponent);
    component = fixture.componentInstance;
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with default state', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasSearched).toBeFalse();
      expect(component.orderData()).toBeNull();
      expect(component.selectedOrderNo()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load service codes on init', () => {
      fixture.detectChanges();
      expect(mockApiService.getServiceCodes).toHaveBeenCalled();
    });

    it('should map service codes from API response', () => {
      mockApiService.getServiceCodes.and.returnValue(of({
        success: true,
        data: [{ chargeCode: 'CHG1', description: 'Charge One', unitCharge: 75, isAmountEditable: true }] as any,
        message: '',
        statusCode: 200,
      }));
      fixture.detectChanges();
      expect(component.serviceCodes()).toEqual([
        { code: 'CHG1', description: 'Charge One', defaultAmount: 75, isAmountEditable: true },
      ]);
    });

    it('should set empty serviceCodes when API returns unsuccessful', () => {
      mockApiService.getServiceCodes.and.returnValue(of({ success: false, data: undefined, message: '', statusCode: 400 }));
      fixture.detectChanges();
      expect(component.serviceCodes()).toEqual([]);
    });

    it('should set empty serviceCodes on API failure', () => {
      mockApiService.getServiceCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.serviceCodes()).toEqual([]);
    });

    it('should reset on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      setupOrderData();
      chapterChanged$.next();
      tick();
      expect(component.orderData()).toBeNull();
      expect(component.hasSearched).toBeFalse();
      expect(component.selectedOrderNo()).toBeNull();
    }));
  });

  describe('loadOrders', () => {
    it('should load orders on init and populate orderItems', () => {
      fixture.detectChanges();
      expect(mockApiService.getOrders).toHaveBeenCalled();
      expect(component.orderItems().length).toBe(1);
      expect(component.orderItems()[0].code).toBe('ORD001 - Hospital A (2024-01-15)');
      expect(component.orderItems()[0].description).toBe('Hospital A');
    });

    it('should populate orderCodeToNo lookup map', () => {
      fixture.detectChanges();
      expect(component['orderCodeToNo'].get('ORD001 - Hospital A (2024-01-15)')).toBe('ORD001');
    });

    it('should handle order without name or date', () => {
      mockApiService.getOrders.and.returnValue(of({
        success: true,
        data: [{ orderNo: 'ORD002' }],
        message: '',
        statusCode: 200,
      }));
      fixture.detectChanges();
      expect(component.orderItems()[0].code).toBe('ORD002');
      expect(component.orderItems()[0].description).toBe('');
    });

    it('should set empty orderItems when API returns unsuccessful', () => {
      mockApiService.getOrders.and.returnValue(of({ success: false, data: undefined, message: '', statusCode: 400 }));
      fixture.detectChanges();
      expect(component.orderItems()).toEqual([]);
    });

    it('should set empty orderItems on API failure', () => {
      mockApiService.getOrders.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.orderItems()).toEqual([]);
    });

    it('should reload orders on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      mockApiService.getOrders.calls.reset();
      chapterChanged$.next();
      tick();
      expect(mockApiService.getOrders).toHaveBeenCalled();
    }));
  });

  describe('onOrderSelected', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load charges for a valid order', () => {
      component.onOrderSelected('ORD001');
      expect(mockApiService.getOrderCharges).toHaveBeenCalledWith('ORD001');
    });

    it('should resolve display code to orderNo via lookup map', () => {
      component['orderCodeToNo'].set('ORD001 - Hospital A', 'ORD001');
      component.onOrderSelected('ORD001 - Hospital A');
      expect(mockApiService.getOrderCharges).toHaveBeenCalledWith('ORD001');
    });

    it('should not reload when same order is re-selected', () => {
      component.onOrderSelected('ORD001');
      const callCount = mockApiService.getOrderCharges.calls.count();
      component.onOrderSelected('ORD001');
      expect(mockApiService.getOrderCharges.calls.count()).toBe(callCount);
    });

    it('should clear results when null is selected', () => {
      setupOrderData();
      component.onOrderSelected(null);
      expect(component.orderData()).toBeNull();
      expect(component.hasSearched).toBeFalse();
    });

    it('should clear results when array value is passed', () => {
      setupOrderData();
      component.onOrderSelected(['ORD001']);
      expect(component.orderData()).toBeNull();
    });
  });

  describe('loadCharges', () => {
    beforeEach(() => fixture.detectChanges());

    it('should map API response to orderData', () => {
      mockApiService.getOrderCharges.and.returnValue(of({
        success: true,
        data: [{
          orderNo: 'ORD001',
          customerName: 'Test Hospital',
          orderDate: '2024-01-15',
          grandTotal: 200,
          charges: [{
            serviceCode: 'SVC1',
            serviceDescription: 'Svc One',
            debitCredit: 'CR',
            quantity: 2,
            amount: 100,
            isAmountEditable: true,
            lastModified: '2024-01-15',
          }],
        }] as any,
        message: '',
        statusCode: 200,
      }));
      component.onOrderSelected('ORD001');
      const data = component.orderData();
      expect(data).toBeTruthy();
      expect(data!.orderName).toBe('Test Hospital');
      expect(data!.charges[0].creditDebit).toBe('CR');
    });

    it('should set orderData to null when response is unsuccessful', () => {
      mockApiService.getOrderCharges.and.returnValue(of({
        success: false,
        data: undefined,
        message: '',
        statusCode: 404,
        errorResponse: { errorCode: 'NOT_FOUND', error: 'Order not found' },
      }));
      component.onOrderSelected('ORD001');
      expect(component.orderData()).toBeNull();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Order not found');
    });

    it('should handle API error and show snackbar', () => {
      mockApiService.getOrderCharges.and.returnValue(throwError(() => new Error('Server error')));
      component.onOrderSelected('ORD001');
      expect(component.orderData()).toBeNull();
      expect(component.isLoading).toBeFalse();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to retrieve order charges.');
    });

    it('should set hasSearched to true after loading', () => {
      component.onOrderSelected('ORD001');
      expect(component.hasSearched).toBeTrue();
    });

    it('should handle null raw data', () => {
      mockApiService.getOrderCharges.and.returnValue(of({
        success: true,
        data: [null] as any,
        message: '',
        statusCode: 200,
      }));
      component.onOrderSelected('ORD001');
      expect(component.orderData()).toBeNull();
    });

    it('should handle non-array data response', () => {
      mockApiService.getOrderCharges.and.returnValue(of({
        success: true,
        data: {
          orderNo: 'ORD001',
          orderDate: '2024-01-15',
          charges: [],
        } as any,
        message: '',
        statusCode: 200,
      }));
      component.onOrderSelected('ORD001');
      expect(component.orderData()).toBeTruthy();
      expect(component.orderData()!.orderNo).toBe('ORD001');
    });
  });

  describe('onClearAll', () => {
    it('should reset selectedOrderNo and clear results', () => {
      fixture.detectChanges();
      setupOrderData();
      component.selectedOrderNo.set('ORD001');
      component.onClearAll();
      expect(component.selectedOrderNo()).toBeNull();
      expect(component.orderData()).toBeNull();
      expect(component.hasSearched).toBeFalse();
    });
  });

  describe('hasAnyFieldValue', () => {
    it('should return false when selectedOrderNo is null', () => {
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when selectedOrderNo has a value', () => {
      component.selectedOrderNo.set('ORD001');
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('displayValue', () => {
    it('should return "--" for null', () => {
      expect(component.displayValue(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.displayValue(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.displayValue('')).toBe('--');
    });

    it('should return stringified value for a string', () => {
      expect(component.displayValue('test')).toBe('test');
    });

    it('should return stringified value for a number', () => {
      expect(component.displayValue(42)).toBe('42');
    });

    it('should return "0" for zero', () => {
      expect(component.displayValue(0)).toBe('0');
    });
  });

  describe('Computed signals', () => {
    it('should return empty headerConfig when pageHeaderData is null', () => {
      mockPageHeaderService.pageHeaderData = signal<any>(null);
      fixture = TestBed.createComponent(EnterOrderChargesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const config = component.headerConfig();
      expect(config.breadcrumbs).toEqual([]);
      expect(config.title).toBe('');
    });

    it('should build headerConfig with breadcrumbs and actions', () => {
      fixture.detectChanges();
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBe(2);
      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.title).toBe('Enter Order Charges');
    });

    it('should disable ORDERED ITEMS action when no order data', () => {
      fixture.detectChanges();
      const config = component.headerConfig();
      const orderedItemsAction = config.actions?.[0];
      expect(orderedItemsAction?.disabled).toBeTrue();
    });

    it('should enable ORDERED ITEMS action when order data exists', () => {
      fixture.detectChanges();
      setupOrderData();
      const config = component.headerConfig();
      const orderedItemsAction = config.actions?.[0];
      expect(orderedItemsAction?.disabled).toBeFalse();
    });

    it('should subtract Credit charges and add Debit charges in totalAmount', () => {
      fixture.detectChanges();
      mockApiService.getOrderCharges.and.returnValue(of({
        success: true,
        data: [{
          orderNo: 'ORD001',
          orderDate: '2024-01-15',
          charges: [
            { serviceCode: 'SVC1', serviceDescription: 'A', creditDebit: 'Debit', quantity: 1, amount: 200 },
            { serviceCode: 'SVC2', serviceDescription: 'B', creditDebit: 'Credit', quantity: 1, amount: 50 },
          ],
        }] as any,
        message: '',
        statusCode: 200,
      }));
      component.onOrderSelected('ORD001');
      expect(component.totalAmount()).toBe(150);
    });

    it('should handle CR/DB shorthand codes in totalAmount', () => {
      fixture.detectChanges();
      mockApiService.getOrderCharges.and.returnValue(of({
        success: true,
        data: [{
          orderNo: 'ORD002',
          orderDate: '2024-01-15',
          charges: [
            { serviceCode: 'SVC1', serviceDescription: 'A', debitCredit: 'DB', quantity: 1, amount: 100 },
            { serviceCode: 'SVC2', serviceDescription: 'B', debitCredit: 'CR', quantity: 1, amount: 30 },
          ],
        }] as any,
        message: '',
        statusCode: 200,
      }));
      component.onOrderSelected('ORD002');
      expect(component.totalAmount()).toBe(70);
    });

    it('should return 0 totalAmount when no data', () => {
      fixture.detectChanges();
      expect(component.totalAmount()).toBe(0);
    });
  });

  describe('chargesTableConfig', () => {
    it('should define 5 columns', () => {
      fixture.detectChanges();
      const config = component.chargesTableConfig();
      expect(config.columns.length).toBe(5);
      expect(config.columns.map(c => c.key)).toEqual([
        'serviceCode', 'serviceDescription', 'creditDebit', 'quantity', 'amount',
      ]);
    });

    it('should include edit row action', () => {
      fixture.detectChanges();
      const config = component.chargesTableConfig();
      expect(config.rowActions?.length).toBe(1);
      expect(config.rowActions![0].action).toBe('edit');
      expect(config.rowActions![0].icon).toBe('edit');
    });

    it('should show footer when charges exist', () => {
      fixture.detectChanges();
      setupOrderData();
      const config = component.chargesTableConfig();
      expect(config.showFooter).toBeTrue();
      expect(config.footerData?.['amount']).toContain('Total Amount');
    });

    it('should not show footer when no charges', () => {
      fixture.detectChanges();
      const config = component.chargesTableConfig();
      expect(config.showFooter).toBeFalse();
    });

    it('should format amount values via valueFormatter', () => {
      fixture.detectChanges();
      const config = component.chargesTableConfig();
      const amountCol = config.columns.find(c => c.key === 'amount');
      expect(amountCol?.valueFormatter?.(100.5, {} as any)).toBe('100.50');
      expect(amountCol?.valueFormatter?.(null, {} as any)).toBe('0.00');
    });

    it('should disable pagination', () => {
      fixture.detectChanges();
      const config = component.chargesTableConfig();
      expect(config.showPagination).toBeFalse();
    });
  });

  describe('onChargeAction', () => {
    it('should call onEditCharge when action is edit', () => {
      fixture.detectChanges();
      setupOrderData();
      spyOn(component, 'onEditCharge');
      component.onChargeAction({ action: 'edit', row: mockCharges[0] });
      expect(component.onEditCharge).toHaveBeenCalledWith(mockCharges[0]);
    });

    it('should not call onEditCharge for unknown action', () => {
      fixture.detectChanges();
      spyOn(component, 'onEditCharge');
      component.onChargeAction({ action: 'delete', row: mockCharges[0] });
      expect(component.onEditCharge).not.toHaveBeenCalled();
    });
  });

  describe('onAddNewCharge', () => {
    it('should not open dialog when no order data', () => {
      fixture.detectChanges();
      component.onAddNewCharge();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open AddEditChargeDialog in add mode', () => {
      fixture.detectChanges();
      setupOrderData();
      component.onAddNewCharge();
      expect(mockDialog.open).toHaveBeenCalled();
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe(AddEditChargeDialogComponent);
      expect(callArgs[1].data.mode).toBe('add');
      expect(callArgs[1].data.orderNo).toBe('ORD001');
    });

    it('should reload charges when dialog returns true', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
      fixture.detectChanges();
      setupOrderData();
      mockApiService.getOrderCharges.calls.reset();
      component.onAddNewCharge();
      afterClosed$.next(true);
      expect(mockApiService.getOrderCharges).toHaveBeenCalledWith('ORD001');
    });

    it('should not reload charges when dialog is cancelled', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
      fixture.detectChanges();
      setupOrderData();
      mockApiService.getOrderCharges.calls.reset();
      component.onAddNewCharge();
      afterClosed$.next(false);
      expect(mockApiService.getOrderCharges).not.toHaveBeenCalled();
    });
  });

  describe('onEditCharge', () => {
    it('should not open dialog when no order data', () => {
      fixture.detectChanges();
      component.onEditCharge(mockCharges[0]);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open AddEditChargeDialog in edit mode with charge data', () => {
      fixture.detectChanges();
      setupOrderData();
      component.onEditCharge(mockCharges[0]);
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1].data.mode).toBe('edit');
      expect(callArgs[1].data.charge).toEqual(mockCharges[0]);
    });

    it('should reload charges when edit dialog returns true', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);
      fixture.detectChanges();
      setupOrderData();
      mockApiService.getOrderCharges.calls.reset();
      component.onEditCharge(mockCharges[0]);
      afterClosed$.next(true);
      expect(mockApiService.getOrderCharges).toHaveBeenCalledWith('ORD001');
    });
  });

  describe('openOrderItems (via headerConfig action)', () => {
    it('should fetch order items and open dialog on success', () => {
      const mockItems = [{ itemNo: 1, productType: 'RBC', bloodTypeDescription: 'O+', requiredQty: 5, canceledQty: 0, unitPrice: 200 }];
      mockApiService.getOrderItems.and.returnValue(of({
        success: true,
        data: mockItems,
        message: '',
        statusCode: 200,
      }));
      fixture.detectChanges();
      setupOrderData();
      const action = component.headerConfig().actions?.[0];
      action?.onClick?.();
      expect(mockApiService.getOrderItems).toHaveBeenCalledWith('ORD001');
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should show error when order items API returns unsuccessful', () => {
      mockApiService.getOrderItems.and.returnValue(of({
        success: false,
        data: undefined,
        message: 'No items found.',
        statusCode: 404,
      }));
      fixture.detectChanges();
      setupOrderData();
      const action = component.headerConfig().actions?.[0];
      action?.onClick?.();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('No items found.');
    });

    it('should show error when order items API fails', () => {
      mockApiService.getOrderItems.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      setupOrderData();
      const action = component.headerConfig().actions?.[0];
      action?.onClick?.();
      expect(mockSnackbar.showError).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(component['destroy$'].isStopped).toBeTrue();
    });
  });
});
