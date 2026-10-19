import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { CcStepOrderDetailsComponent } from './step-order-details';
import { RegularOrderApiService } from '../../enter-regular-order/services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  RegularOrderDto,
  OrderItemDto,
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  OrderNumberLookupItem,
  PickSlipLookupItem
} from '../../enter-regular-order/models/regular-order.model';

describe('CcStepOrderDetailsComponent', () => {
  let component: CcStepOrderDetailsComponent;
  let fixture: ComponentFixture<CcStepOrderDetailsComponent>;

  const mockOrderNumbers: OrderNumberLookupItem[] = [
    { orderNo: '25001-0001', customerId: 'CUST01', customerName: 'Baylor Hospital' },
    { orderNo: '25001-0002', customerId: 'CUST02', customerName: 'Dallas Medical' },
    { orderNo: '25001-0003', customerId: 'CUST03', customerName: 'Fort Worth Clinic' }
  ];

  const mockModes: LookupItem[] = [
    { code: 'DL', description: 'Delivery' },
    { code: 'PU', description: 'Pickup' }
  ];

  const mockPriorities: LookupItem[] = [
    { code: 'RG', description: 'Regular' },
    { code: 'EM', description: 'Emergency' }
  ];

  const mockContracts: LookupItem[] = [
    { code: 'CON01', description: 'Contract 1' },
    { code: 'CON02', description: 'Contract 2' }
  ];

  const mockContacts: CustomerContactDto[] = [
    {
      contactId: 'CT01', firstName: 'John', lastName: 'Doe',
      contactType: 'PR', contactTypeCode: 'PR', dayPhone: '555-0101'
    },
    {
      contactId: 'CT02', firstName: 'Jane', lastName: 'Smith',
      contactType: 'SC', contactTypeCode: 'SC', dayPhone: '555-0102'
    }
  ];

  const mockConsignees: ConsigneeDto[] = [
    { consigneeId: 'CSG01', consigneeName: 'Main Lab', address: '123 Main St' },
    { consigneeId: 'CSG02', consigneeName: 'Branch Lab', address: '456 Oak Ave' }
  ];

  const mockPickSlips: PickSlipLookupItem[] = [
    { pickSlipId: 'PS001', pickSlipType: 'STD' },
    { pickSlipId: 'PS002', pickSlipType: 'URG' }
  ];

  const mockCustomer = {
    customerId: 'CUST01',
    customerName: 'Baylor Hospital',
    name: 'Baylor Hospital',
    payeeId: 'PAYEE01',
    address1: '100 Hospital Dr',
    address2: 'Suite 200',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    country: 'US'
  };

  const mockPayee = {
    customerId: 'PAYEE01',
    customerName: 'Baylor Billing',
    name: 'Baylor Billing',
    address1: '200 Billing Ave',
    address2: null,
    city: 'Dallas',
    state: 'TX',
    zipCode: '75202',
    country: 'US'
  };

  function makeOrder(overrides: Partial<RegularOrderDto> = {}): RegularOrderDto {
    return {
      orderNo: '25001-0001',
      chapterId: 'CH01',
      customerId: 'CUST01',
      customerName: 'Baylor Hospital',
      orderType: 'RG',
      orderClass: 'STD',
      orderedBy: 'John Doe',
      consigneeId: 'CSG01',
      payeeId: 'PAYEE01',
      estArrivalTime: '2025-01-15T10:00:00',
      orderStatus: 'OR',
      insertDate: '2025-01-01',
      insertUserId: 'admin',
      lastActivityDate: '2025-01-01',
      items: [],
      ...overrides
    };
  }

  function makeOrderItem(overrides: Partial<OrderItemDto> = {}): OrderItemDto {
    return {
      orderNo: '25001-0001',
      itemNo: 1,
      productType: 'RBC',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      tier: 1,
      requiredQty: 5,
      unitPrice: 100,
      itemStatus: 'OR',
      allocatedQty: 0,
      shippedQty: 0,
      ...overrides
    };
  }

  const apiService = jasmine.createSpyObj<RegularOrderApiService>('RegularOrderApiService', [
    'getOrderNumbersLookup', 'getOrderModesLookup', 'getOrderClassesLookup',
    'getOrder', 'getCustomerById', 'getConsignees', 'getContacts',
    'getContracts', 'getOrderItems', 'getPickSlips', 'createContact'
  ]);
  const headerService = jasmine.createSpyObj<HeaderService>('HeaderService', ['getChapterId']);
  const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

  function resetSpies(): void {
    apiService.getOrderNumbersLookup.calls.reset();
    apiService.getOrderModesLookup.calls.reset();
    apiService.getOrderClassesLookup.calls.reset();
    apiService.getOrder.calls.reset();
    apiService.getCustomerById.calls.reset();
    apiService.getConsignees.calls.reset();
    apiService.getContacts.calls.reset();
    apiService.getContracts.calls.reset();
    apiService.getOrderItems.calls.reset();
    apiService.getPickSlips.calls.reset();
    apiService.createContact.calls.reset();
    dialog.open.calls.reset();

    apiService.getOrderNumbersLookup.and.returnValue(of(mockOrderNumbers));
    apiService.getOrderModesLookup.and.returnValue(of(mockModes));
    apiService.getOrderClassesLookup.and.returnValue(of(mockPriorities));
    apiService.getOrder.and.returnValue(of(makeOrder()));
    apiService.getCustomerById.and.returnValue(of(mockCustomer));
    apiService.getConsignees.and.returnValue(of(mockConsignees));
    apiService.getContacts.and.returnValue(of(mockContacts));
    apiService.getContracts.and.returnValue(of(mockContracts));
    apiService.getOrderItems.and.returnValue(of([makeOrderItem()]));
    apiService.getPickSlips.and.returnValue(of(mockPickSlips));
    apiService.createContact.and.returnValue(of({ contactType: 'PR', firstName: 'New', lastName: 'Contact' }));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        CcStepOrderDetailsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: RegularOrderApiService, useValue: apiService },
        { provide: HeaderService, useValue: headerService },
        { provide: MatDialog, useValue: dialog }
      ]
    });

    fixture = TestBed.createComponent(CcStepOrderDetailsComponent);
    component = fixture.componentInstance;
    (component as any).dialog = dialog;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ──

  describe('ngOnInit', () => {
    it('should initialize the order form with correct controls', () => {
      expect(component.orderForm).toBeTruthy();
      expect(component.orderForm.get('orderNo')).toBeTruthy();
      expect(component.orderForm.get('contractId')).toBeTruthy();
      expect(component.orderForm.get('priority')).toBeTruthy();
      expect(component.orderForm.get('orderMode')).toBeTruthy();
      expect(component.orderForm.get('contactId')).toBeTruthy();
      expect(component.orderForm.get('consigneeId')).toBeTruthy();
    });

    it('should require orderNo field', () => {
      component.orderForm.get('orderNo')!.setValue('');
      expect(component.orderForm.get('orderNo')!.hasError('required')).toBeTrue();
    });

    it('should be valid when orderNo is filled', () => {
      component.orderForm.get('orderNo')!.setValue('25001-0001');
      expect(component.orderForm.valid).toBeTrue();
    });

    it('should load order numbers on init', () => {
      expect(apiService.getOrderNumbersLookup).toHaveBeenCalled();
      expect(component.orderNumbers()).toEqual(mockOrderNumbers);
      expect(component.filteredOrderNumbers()).toEqual(mockOrderNumbers);
    });

    it('should load order modes on init', () => {
      expect(apiService.getOrderModesLookup).toHaveBeenCalled();
      expect(component.modes()).toEqual(mockModes);
      expect(component.filteredModes()).toEqual(mockModes);
    });

    it('should load order classes (priorities) on init', () => {
      expect(apiService.getOrderClassesLookup).toHaveBeenCalled();
      expect(component.priorities()).toEqual(mockPriorities);
      expect(component.filteredPriorities()).toEqual(mockPriorities);
    });

    it('should handle error loading order numbers', () => {
      apiService.getOrderNumbersLookup.and.returnValue(throwError(() => new Error('fail')));
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.orderNumbers()).toEqual([]);
      expect(fixture2.componentInstance.filteredOrderNumbers()).toEqual([]);
    });

    it('should handle error loading order modes', () => {
      apiService.getOrderModesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.modes()).toEqual([]);
      expect(fixture2.componentInstance.filteredModes()).toEqual([]);
    });

    it('should handle error loading order classes', () => {
      apiService.getOrderClassesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.priorities()).toEqual([]);
      expect(fixture2.componentInstance.filteredPriorities()).toEqual([]);
    });

    it('should emit validityChange and formDataChange when form values change', () => {
      let validityEmitted: boolean | undefined;
      let formDataEmitted: any;
      component.validityChange.subscribe(v => validityEmitted = v);
      component.formDataChange.subscribe(d => formDataEmitted = d);

      component.orderForm.get('orderNo')!.setValue('25001-0001');

      expect(validityEmitted).toBeTrue();
      expect(formDataEmitted).toBeTruthy();
      expect(formDataEmitted.orderNo).toBe('25001-0001');
    });

    it('should call populateFromSavedData when savedOrderData has orderNo', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = {
        orderNo: '25001-0001',
        customerId: 'CUST01',
        orderType: 'RG',
        contractId: 'CON01',
        priority: 'RG',
        orderMode: 'DL',
        contactId: 'CT01',
        consigneeId: 'CSG01',
        customerName: 'Baylor Hospital',
        estArrivalTime: '2025-01-15',
        consigneeName: 'Main Lab',
        consigneeAddress: '123 Main St',
        payeeId: 'PAYEE01'
      };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.orderNumber()).toBe('25001-0001');
      expect(fixture2.componentInstance.orderType()).toBe('RG');
      expect(fixture2.componentInstance.customerId()).toBe('CUST01');
      expect(fixture2.componentInstance.customerName()).toBe('Baylor Hospital');
      expect(fixture2.componentInstance.estimatedArrivalTime()).toBe('2025-01-15');
      expect(fixture2.componentInstance.consigneeName()).toBe('Main Lab');
      expect(fixture2.componentInstance.consigneeAddress()).toBe('123 Main St');
      expect(fixture2.componentInstance.billToCustomerId()).toBe('PAYEE01');
    });

    it('should not call populateFromSavedData when savedOrderData is null', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = null;
      fixture2.detectChanges();
      // Should not throw and should have default values
      expect(fixture2.componentInstance.orderNumber()).toBe('--');
    });

    it('should not call populateFromSavedData when savedOrderData has no orderNo', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { customerId: 'CUST01' };
      fixture2.detectChanges();
      expect(fixture2.componentInstance.orderNumber()).toBe('--');
    });
  });

  // ── ngOnDestroy ──

  describe('ngOnDestroy', () => {
    it('should complete destroy$ without throwing', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should unsubscribe from observables after destroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── populateFromSavedData ──

  describe('populateFromSavedData', () => {
    it('should set defaults when savedOrderData fields are missing', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001' };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.orderNumber()).toBe('25001-0001');
      expect(fixture2.componentInstance.orderType()).toBe('--');
      expect(fixture2.componentInstance.customerId()).toBe('--');
      expect(fixture2.componentInstance.customerName()).toBe('--');
      expect(fixture2.componentInstance.estimatedArrivalTime()).toBe('--');
      expect(fixture2.componentInstance.consigneeName()).toBe('--');
      expect(fixture2.componentInstance.consigneeAddress()).toBe('--');
    });

    it('should load customer dependencies when customerId is present', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = {
        orderNo: '25001-0001',
        customerId: 'CUST01'
      };
      fixture2.detectChanges();

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST01');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST01');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST01');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST01');
    });

    it('should not load customer dependencies when customerId is absent', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001' };
      // Reset after init to see no new calls
      apiService.getCustomerById.calls.reset();
      fixture2.detectChanges();

      expect(apiService.getCustomerById).not.toHaveBeenCalled();
    });

    it('should return early when savedOrderData is null', () => {
      (component as any).savedOrderData = null;
      expect(() => (component as any).populateFromSavedData()).not.toThrow();
    });
  });

  // ── onOrderNumberChange ──

  describe('onOrderNumberChange', () => {
    it('should clear order data when orderNo is empty', () => {
      // Set some values first
      component.orderNumber.set('25001-0001');
      component.customerName.set('Baylor');

      component.onOrderNumberChange('');

      expect(component.orderNumber()).toBe('--');
      expect(component.customerName()).toBe('--');
      expect(component.orderType()).toBe('--');
      expect(component.customerId()).toBe('--');
      expect(component.estimatedArrivalTime()).toBe('--');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });

    it('should set loading to true when fetching order', () => {
      const orderSubject = new Subject<any>();
      apiService.getOrder.and.returnValue(orderSubject.asObservable());

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeTrue();
    });

    it('should clear data and set loading to false when order is null', () => {
      apiService.getOrder.and.returnValue(of(null as any));

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeFalse();
      expect(component.orderNumber()).toBe('--');
    });

    it('should handle getOrder error gracefully', () => {
      apiService.getOrder.and.returnValue(throwError(() => new Error('Network error')));

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeFalse();
      expect(component.orderNumber()).toBe('--');
    });

    it('should populate order header fields when order is returned', () => {
      const order = makeOrder({
        orderNo: '25001-0001',
        orderType: 'EM',
        customerId: 'CUST01',
        estArrivalTime: '2025-02-01T14:00:00'
      });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderNumber()).toBe('25001-0001');
      expect(component.orderType()).toBe('EM');
      expect(component.customerId()).toBe('CUST01');
      expect(component.estimatedArrivalTime()).toBe('2025-02-01T14:00:00');
    });

    it('should patch form values from order', () => {
      const order = makeOrder({
        contractId: 'CON01',
        priority: 'EM',
        orderMode: 'DL',
        consigneeId: 'CSG01'
      });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderForm.get('contractId')!.value).toBe('CON01');
      expect(component.orderForm.get('priority')!.value).toBe('EM');
      expect(component.orderForm.get('orderMode')!.value).toBe('DL');
      expect(component.orderForm.get('consigneeId')!.value).toBe('CSG01');
    });

    it('should use defaults when order fields are empty', () => {
      const order = makeOrder({
        orderNo: '',
        orderType: '',
        customerId: '',
        estArrivalTime: undefined
      });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderNumber()).toBe('--');
      expect(component.orderType()).toBe('--');
      expect(component.customerId()).toBe('--');
      expect(component.estimatedArrivalTime()).toBe('--');
    });

    it('should load customer dependencies via forkJoin when customerId exists', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST01');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST01');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST01');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST01');
      expect(apiService.getOrderItems).toHaveBeenCalledWith('25001-0001');
      expect(apiService.getPickSlips).toHaveBeenCalledWith('25001-0001');
    });

    it('should set customer name from customerName property', () => {
      apiService.getCustomerById.and.returnValue(of({ ...mockCustomer, customerName: 'Test Hospital' }));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.customerName()).toBe('Test Hospital');
    });

    it('should fall back to name property when customerName is null', () => {
      apiService.getCustomerById.and.returnValue(of({ ...mockCustomer, customerName: null, name: 'Fallback Name' }));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.customerName()).toBe('Fallback Name');
    });

    it('should default customer name to -- when both customerName and name are null', () => {
      apiService.getCustomerById.and.returnValue(of({ ...mockCustomer, customerName: null, name: null }));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.customerName()).toBe('--');
    });

    it('should fetch payee details when payeeId differs from customerId', () => {
      const customerWithDifferentPayee = { ...mockCustomer, payeeId: 'PAYEE01' };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST01') return of(customerWithDifferentPayee);
        if (id === 'PAYEE01') return of(mockPayee);
        return of(null);
      });
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.billToCustomerId()).toBe('PAYEE01');
      expect(component.billToCustomerName()).toBe('Baylor Billing');
      expect(component.billToAddress()).toContain('200 Billing Ave');
      expect(component.billToAddress()).toContain('Dallas');
    });

    it('should use customer as bill-to when payeeId equals customerId', () => {
      const customerSamePayee = { ...mockCustomer, payeeId: 'CUST01' };
      apiService.getCustomerById.and.returnValue(of(customerSamePayee));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.billToCustomerName()).toBe('Baylor Hospital');
      expect(component.billToAddress()).toContain('100 Hospital Dr');
    });

    it('should use customerId as payeeId when payeeId is null', () => {
      const customerNoPayee = { ...mockCustomer, payeeId: null, customerId: 'CUST01' };
      apiService.getCustomerById.and.returnValue(of(customerNoPayee));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      // payeeId falls back to customerId which equals custId, so same-customer path is taken
      expect(component.billToCustomerName()).toBe('Baylor Hospital');
    });

    it('should set bill-to address to -- when address parts are empty', () => {
      const customerNoAddress = {
        ...mockCustomer,
        payeeId: 'CUST01',
        address1: '', address2: '', city: '', state: '', zipCode: '', country: ''
      };
      apiService.getCustomerById.and.returnValue(of(customerNoAddress));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.billToAddress()).toBe('--');
    });

    it('should handle payee fetch error gracefully', () => {
      const customerWithPayee = { ...mockCustomer, payeeId: 'PAYEE01' };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST01') return of(customerWithPayee);
        if (id === 'PAYEE01') return throwError(() => new Error('fail'));
        return of(null);
      });
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      expect(() => component.onOrderNumberChange('25001-0001')).not.toThrow();
    });

    it('should set consignees, contacts, and contracts from forkJoin result', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.filteredConsignees()).toEqual(mockConsignees);
      expect(component.contacts()).toEqual(mockContacts);
      expect(component.filteredContacts()).toEqual(mockContacts);
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.filteredContracts()).toEqual(mockContracts);
    });

    it('should set pickSlips from forkJoin result', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.pickSlips()).toEqual(mockPickSlips);
    });

    it('should match orderedBy to contact and patch contactId', () => {
      const order = makeOrder({ customerId: 'CUST01', orderedBy: 'John Doe' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderForm.get('contactId')!.value).toBe('CT01');
    });

    it('should handle orderedBy with extra whitespace', () => {
      const order = makeOrder({ customerId: 'CUST01', orderedBy: '  john doe  ' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderForm.get('contactId')!.value).toBe('CT01');
    });

    it('should not set contactId when orderedBy does not match any contact', () => {
      const order = makeOrder({ customerId: 'CUST01', orderedBy: 'Unknown Person' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      // contactId should remain empty since no matching contact found
      expect(component.orderForm.get('contactId')!.value).toBeFalsy();
    });

    it('should not set contactId when orderedBy is not provided', () => {
      const order = makeOrder({ customerId: 'CUST01', orderedBy: undefined });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.orderForm.get('contactId')!.value).toBeFalsy();
    });

    it('should set consignee name and address from matching consignee', () => {
      const order = makeOrder({ customerId: 'CUST01', consigneeId: 'CSG01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.consigneeName()).toBe('Main Lab');
      expect(component.consigneeAddress()).toBe('123 Main St');
    });

    it('should set consignee name to -- when no matching consignee found', () => {
      const order = makeOrder({ customerId: 'CUST01', consigneeId: 'NONEXISTENT' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should emit orderLoaded with order and items', () => {
      const items = [makeOrderItem({ itemNo: 1 }), makeOrderItem({ itemNo: 2 })];
      apiService.getOrderItems.and.returnValue(of(items));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      let emittedValue: any = null;
      component.orderLoaded.subscribe(v => emittedValue = v);

      component.onOrderNumberChange('25001-0001');

      expect(emittedValue).toBeTruthy();
      expect(emittedValue.order).toBeTruthy();
      expect(emittedValue.items.length).toBe(2);
    });

    it('should set loading to false after forkJoin completes', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeFalse();
    });

    it('should emit validityChange and formDataChange after order loads', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      let validityEmitted = false;
      let formDataEmitted = false;
      component.validityChange.subscribe(() => validityEmitted = true);
      component.formDataChange.subscribe(() => formDataEmitted = true);

      component.onOrderNumberChange('25001-0001');

      expect(validityEmitted).toBeTrue();
      expect(formDataEmitted).toBeTrue();
    });

    it('should handle forkJoin error by setting loading to false', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));
      // Make one of the inner calls fail with throwError, but wrapped in catchError in the component
      // The forkJoin error handler is for the overall forkJoin
      apiService.getCustomerById.and.returnValue(of(null));
      apiService.getConsignees.and.returnValue(of([]));
      apiService.getContacts.and.returnValue(of([]));
      apiService.getContracts.and.returnValue(of([]));
      apiService.getOrderItems.and.returnValue(of([]));
      apiService.getPickSlips.and.returnValue(of([]));

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeFalse();
    });

    it('should handle order without customerId', () => {
      const order = makeOrder({ customerId: '' });
      apiService.getOrder.and.returnValue(of(order));

      let emittedValue: any = null;
      component.orderLoaded.subscribe(v => emittedValue = v);

      component.onOrderNumberChange('25001-0001');

      expect(component.loading()).toBeFalse();
      expect(emittedValue).toBeTruthy();
      expect(emittedValue.order.customerId).toBe('');
    });

    it('should use order.items when customerId is empty', () => {
      const orderItems = [makeOrderItem({ itemNo: 10 })];
      const order = makeOrder({ customerId: '', items: orderItems });
      apiService.getOrder.and.returnValue(of(order));

      let emittedValue: any = null;
      component.orderLoaded.subscribe(v => emittedValue = v);

      component.onOrderNumberChange('25001-0001');

      expect(emittedValue.items).toEqual(orderItems);
    });

    it('should use empty array when order has no items and no customerId', () => {
      const order = makeOrder({ customerId: '', items: undefined as any });
      apiService.getOrder.and.returnValue(of(order));

      let emittedValue: any = null;
      component.orderLoaded.subscribe(v => emittedValue = v);

      component.onOrderNumberChange('25001-0001');

      expect(emittedValue.items).toEqual([]);
    });

    it('should handle individual forkJoin stream errors via catchError', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));
      apiService.getCustomerById.and.returnValue(throwError(() => new Error('fail')));
      apiService.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      apiService.getContacts.and.returnValue(throwError(() => new Error('fail')));
      apiService.getContracts.and.returnValue(throwError(() => new Error('fail')));
      apiService.getOrderItems.and.returnValue(throwError(() => new Error('fail')));
      apiService.getPickSlips.and.returnValue(throwError(() => new Error('fail')));

      expect(() => component.onOrderNumberChange('25001-0001')).not.toThrow();
      expect(component.loading()).toBeFalse();
    });

    it('should handle customer being null in forkJoin result', () => {
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));
      apiService.getCustomerById.and.returnValue(of(null));

      component.onOrderNumberChange('25001-0001');

      // Customer is null so customer-dependent signals should not be updated
      expect(component.loading()).toBeFalse();
    });
  });

  // ── clearOrderData ──

  describe('clearOrderData (via onOrderNumberChange)', () => {
    it('should reset all signals to defaults', () => {
      // First set some values
      component.orderNumber.set('25001-0001');
      component.orderType.set('EM');
      component.customerId.set('CUST01');
      component.customerName.set('Test Hospital');
      component.contacts.set(mockContacts);
      component.consignees.set(mockConsignees);
      component.contracts.set(mockContracts);
      component.pickSlips.set(mockPickSlips);

      // Clear by calling with empty string
      component.onOrderNumberChange('');

      expect(component.orderNumber()).toBe('--');
      expect(component.orderType()).toBe('--');
      expect(component.customerId()).toBe('--');
      expect(component.customerName()).toBe('--');
      expect(component.estimatedArrivalTime()).toBe('--');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
      expect(component.contacts()).toEqual([]);
      expect(component.filteredContacts()).toEqual([]);
      expect(component.consignees()).toEqual([]);
      expect(component.filteredConsignees()).toEqual([]);
      expect(component.contracts()).toEqual([]);
      expect(component.filteredContracts()).toEqual([]);
      expect(component.pickSlips()).toEqual([]);
    });

    it('should reset selectedPickSlipId', () => {
      component.selectedPickSlipId.setValue('PS001');
      component.onOrderNumberChange('');
      expect(component.selectedPickSlipId.value).toBe('');
    });

    it('should reset form fields except orderNo', () => {
      component.orderForm.patchValue({
        contractId: 'CON01',
        priority: 'EM',
        orderMode: 'DL',
        contactId: 'CT01',
        consigneeId: 'CSG01'
      });

      component.onOrderNumberChange('');

      expect(component.orderForm.get('contractId')!.value).toBe('');
      expect(component.orderForm.get('priority')!.value).toBe('');
      expect(component.orderForm.get('orderMode')!.value).toBe('');
      expect(component.orderForm.get('contactId')!.value).toBe('');
      expect(component.orderForm.get('consigneeId')!.value).toBe('');
    });
  });

  // ── onConsigneeChange ──

  describe('onConsigneeChange', () => {
    it('should set consignee name and address when found', () => {
      component.consignees.set(mockConsignees);

      component.onConsigneeChange('CSG01');

      expect(component.consigneeName()).toBe('Main Lab');
      expect(component.consigneeAddress()).toBe('123 Main St');
    });

    it('should set consignee name and address to -- when not found', () => {
      component.consignees.set(mockConsignees);

      component.onConsigneeChange('NONEXISTENT');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should handle empty consignees array', () => {
      component.consignees.set([]);

      component.onConsigneeChange('CSG01');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should set address to -- when consignee has no address', () => {
      component.consignees.set([{ consigneeId: 'CSG01', consigneeName: 'Main Lab', address: undefined }]);

      component.onConsigneeChange('CSG01');

      expect(component.consigneeName()).toBe('Main Lab');
      expect(component.consigneeAddress()).toBe('--');
    });
  });

  // ── onAddNewContact ──

  describe('onAddNewContact', () => {
    it('should return early when customerId is --', () => {
      component.customerId.set('--');

      component.onAddNewContact();

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should return early when customerId is empty', () => {
      component.customerId.set('');

      component.onAddNewContact();

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should open dialog with correct config when customerId is valid', () => {
      component.customerId.set('CUST01');
      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onAddNewContact();

      expect(dialog.open).toHaveBeenCalled();
      const config = dialog.open.calls.mostRecent().args[1]!;
      expect(config.data).toEqual({ customerId: 'CUST01' });
      expect(config.width).toBe('500px');
      expect(config.height).toBe('100vh');
      expect(config.panelClass).toBe('right-panel-dialog');

      afterClosedSubject.complete();
    });

    it('should do nothing when dialog returns falsy result', () => {
      component.customerId.set('CUST01');
      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onAddNewContact();

      afterClosedSubject.next(null);
      afterClosedSubject.complete();

      expect(apiService.createContact).not.toHaveBeenCalled();
    });

    it('should call createContact with correct payload when dialog returns result', () => {
      component.customerId.set('CUST01');
      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onAddNewContact();

      const dialogResult = {
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01',
        salutation: 'Mr.',
        title: 'Dr.',
        nightPhone: '555-0200',
        faxNumber: '555-0201',
        telexNumber: 'TX001',
        terminationDate: '2026-01-01'
      };

      afterClosedSubject.next(dialogResult);
      afterClosedSubject.complete();

      expect(apiService.createContact).toHaveBeenCalledWith('CUST01', jasmine.objectContaining({
        contactType: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhoneNo: '555-0199',
        effDate: '2025-01-01',
        salutation: 'Mr.',
        title: 'Dr.',
        nightPhoneNo: '555-0200',
        faxNo: '555-0201',
        telexNo: 'TX001',
        termDate: '2026-01-01'
      }));
    });

    it('should omit optional fields that are empty strings', () => {
      component.customerId.set('CUST01');
      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onAddNewContact();

      const dialogResult = {
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01',
        salutation: '',
        title: '',
        nightPhone: '',
        faxNumber: '',
        telexNumber: '',
        terminationDate: ''
      };

      afterClosedSubject.next(dialogResult);
      afterClosedSubject.complete();

      const payload = apiService.createContact.calls.mostRecent().args[1];
      expect(payload.salutation).toBeUndefined();
      expect(payload.title).toBeUndefined();
      expect(payload.nightPhoneNo).toBeUndefined();
      expect(payload.faxNo).toBeUndefined();
      expect(payload.telexNo).toBeUndefined();
      expect(payload.termDate).toBeUndefined();
    });

    it('should add new contact to contacts and filteredContacts on success', () => {
      component.customerId.set('CUST01');
      component.contacts.set([...mockContacts]);
      component.filteredContacts.set([...mockContacts]);

      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      apiService.createContact.and.returnValue(of({
        contactType: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhoneNo: '555-0199'
      }));

      component.onAddNewContact();

      afterClosedSubject.next({
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01'
      });
      afterClosedSubject.complete();

      expect(component.contacts().length).toBe(mockContacts.length + 1);
      expect(component.filteredContacts().length).toBe(mockContacts.length + 1);
      const newContact = component.contacts()[component.contacts().length - 1];
      expect(newContact.firstName).toBe('New');
      expect(newContact.lastName).toBe('Contact');
    });

    it('should not add contact when createContact returns null', () => {
      component.customerId.set('CUST01');
      component.contacts.set([...mockContacts]);

      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      apiService.createContact.and.returnValue(of(null));

      component.onAddNewContact();

      afterClosedSubject.next({
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01'
      });
      afterClosedSubject.complete();

      expect(component.contacts().length).toBe(mockContacts.length);
    });

    it('should handle createContact error gracefully', () => {
      component.customerId.set('CUST01');
      component.contacts.set([...mockContacts]);

      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      apiService.createContact.and.returnValue(throwError(() => new Error('Create failed')));

      component.onAddNewContact();

      afterClosedSubject.next({
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01'
      });
      afterClosedSubject.complete();

      // Should not throw, contacts array should not change
      expect(component.contacts().length).toBe(mockContacts.length);
    });

    it('should use dialog result values when saved response is missing fields', () => {
      component.customerId.set('CUST01');
      component.contacts.set([]);
      component.filteredContacts.set([]);

      const afterClosedSubject = new Subject<any>();
      dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      // API returns partial response missing some fields
      apiService.createContact.and.returnValue(of({ contactType: 'PR' }));

      component.onAddNewContact();

      afterClosedSubject.next({
        contactTypeCode: 'PR',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0199',
        effectiveDate: '2025-01-01',
        salutation: 'Dr.',
        title: 'Chief'
      });
      afterClosedSubject.complete();

      const newContact = component.contacts()[0];
      expect(newContact.firstName).toBe('New');
      expect(newContact.lastName).toBe('Contact');
      expect(newContact.salutation).toBe('Dr.');
      expect(newContact.title).toBe('Chief');
    });
  });

  // ── scrollToSection ──

  describe('scrollToSection', () => {
    it('should set activeSection signal', () => {
      component.scrollToSection('billing');

      expect(component.activeSection()).toBe('billing');
    });

    it('should not throw when element is not found', () => {
      expect(() => component.scrollToSection('nonexistent-section')).not.toThrow();
    });
  });

  // ── loadCustomerDependencies ──

  describe('loadCustomerDependencies (via populateFromSavedData)', () => {
    it('should set customer name from customer response', () => {
      resetSpies();
      apiService.getCustomerById.and.returnValue(of({ ...mockCustomer, customerName: 'Updated Name' }));

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.customerName()).toBe('Updated Name');
    });

    it('should set consignees, contacts, and contracts', () => {
      resetSpies();
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.consignees()).toEqual(mockConsignees);
      expect(fixture2.componentInstance.filteredConsignees()).toEqual(mockConsignees);
      expect(fixture2.componentInstance.contacts()).toEqual(mockContacts);
      expect(fixture2.componentInstance.filteredContacts()).toEqual(mockContacts);
      expect(fixture2.componentInstance.contracts()).toEqual(mockContracts);
      expect(fixture2.componentInstance.filteredContracts()).toEqual(mockContracts);
    });

    it('should fetch payee when payeeId differs from custId', () => {
      resetSpies();
      const customerWithPayee = { ...mockCustomer, payeeId: 'PAYEE99' };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST01') return of(customerWithPayee);
        if (id === 'PAYEE99') return of({ ...mockPayee, customerId: 'PAYEE99', customerName: 'Billing Corp' });
        return of(null);
      });

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.billToCustomerName()).toBe('Billing Corp');
    });

    it('should use customer as bill-to when payeeId equals custId', () => {
      resetSpies();
      apiService.getCustomerById.and.returnValue(of({ ...mockCustomer, payeeId: 'CUST01', customerId: 'CUST01' }));

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      fixture2.detectChanges();

      expect(fixture2.componentInstance.billToCustomerName()).toBe('Baylor Hospital');
    });

    it('should handle null customer in loadCustomerDependencies', () => {
      resetSpies();
      apiService.getCustomerById.and.returnValue(of(null));

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      expect(() => fixture2.detectChanges()).not.toThrow();
    });

    it('should handle loadCustomerDependencies forkJoin error', () => {
      resetSpies();
      apiService.getCustomerById.and.returnValue(throwError(() => new Error('fail')));
      apiService.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      apiService.getContacts.and.returnValue(throwError(() => new Error('fail')));
      apiService.getContracts.and.returnValue(throwError(() => new Error('fail')));

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      // Each inner catchError returns of(null)/of([]) so forkJoin completes with nulls/empties
      expect(() => fixture2.detectChanges()).not.toThrow();
    });

    it('should handle payee fetch error in loadCustomerDependencies', () => {
      resetSpies();
      const customerWithPayee = { ...mockCustomer, payeeId: 'PAYEE01' };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST01') return of(customerWithPayee);
        if (id === 'PAYEE01') return throwError(() => new Error('fail'));
        return of(null);
      });

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      expect(() => fixture2.detectChanges()).not.toThrow();
    });

    it('should set bill-to address from payee address parts', () => {
      resetSpies();
      const customerWithPayee = { ...mockCustomer, payeeId: 'PAYEE01' };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST01') return of(customerWithPayee);
        if (id === 'PAYEE01') return of({
          customerId: 'PAYEE01', customerName: 'Payee Corp',
          address1: '789 Elm St', address2: '', city: 'Houston', state: 'TX', zipCode: '77001', country: ''
        });
        return of(null);
      });

      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.componentInstance.savedOrderData = { orderNo: '25001-0001', customerId: 'CUST01' };
      fixture2.detectChanges();

      const addr = fixture2.componentInstance.billToAddress();
      expect(addr).toContain('789 Elm St');
      expect(addr).toContain('Houston');
      expect(addr).toContain('TX');
      expect(addr).toContain('77001');
    });
  });

  // ── subscribeToSearchFilters ──

  describe('search filter controls', () => {
    it('should filter order numbers by orderNo', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('0001');
      tick(200);

      const filtered = component.filteredOrderNumbers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].orderNo).toBe('25001-0001');
    }));

    it('should filter order numbers by customerName', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('baylor');
      tick(200);

      const filtered = component.filteredOrderNumbers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerName).toBe('Baylor Hospital');
    }));

    it('should filter order numbers by customerId', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('cust02');
      tick(200);

      const filtered = component.filteredOrderNumbers();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('CUST02');
    }));

    it('should show all order numbers when search is empty', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredOrderNumbers().length).toBe(3);
    }));

    it('should show all order numbers when search is null', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue(null);
      tick(200);

      expect(component.filteredOrderNumbers().length).toBe(3);
    }));

    it('should return empty when no order numbers match', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('zzzzz');
      tick(200);

      expect(component.filteredOrderNumbers().length).toBe(0);
    }));

    it('should filter contracts by code', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('con01');
      tick(200);

      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CON01');
    }));

    it('should filter contracts by description', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('contract 2');
      tick(200);

      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CON02');
    }));

    it('should show all contracts when search is empty', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredContracts().length).toBe(2);
    }));

    it('should filter priorities by code', fakeAsync(() => {
      component.priorities.set(mockPriorities);
      component.prioritySearchCtrl.setValue('em');
      tick(200);

      const filtered = component.filteredPriorities();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('EM');
    }));

    it('should filter priorities by description', fakeAsync(() => {
      component.priorities.set(mockPriorities);
      component.prioritySearchCtrl.setValue('regular');
      tick(200);

      const filtered = component.filteredPriorities();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RG');
    }));

    it('should show all priorities when search is empty', fakeAsync(() => {
      component.priorities.set(mockPriorities);
      component.prioritySearchCtrl.setValue('');
      tick(200);

      expect(component.filteredPriorities().length).toBe(2);
    }));

    it('should filter modes by code', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('dl');
      tick(200);

      const filtered = component.filteredModes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('DL');
    }));

    it('should filter modes by description', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('pickup');
      tick(200);

      const filtered = component.filteredModes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PU');
    }));

    it('should show all modes when search is empty', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredModes().length).toBe(2);
    }));

    it('should filter contacts by first and last name', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('john doe');
      tick(200);

      const filtered = component.filteredContacts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].firstName).toBe('John');
    }));

    it('should filter contacts by partial name', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('jan');
      tick(200);

      const filtered = component.filteredContacts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].firstName).toBe('Jane');
    }));

    it('should show all contacts when search is empty', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredContacts().length).toBe(2);
    }));

    it('should filter consignees by consigneeId', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('csg01');
      tick(200);

      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].consigneeId).toBe('CSG01');
    }));

    it('should filter consignees by consigneeName', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('branch');
      tick(200);

      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].consigneeName).toBe('Branch Lab');
    }));

    it('should show all consignees when search is empty', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredConsignees().length).toBe(2);
    }));
  });

  // ── getFormData ──

  describe('getFormData', () => {
    it('should return form values with signal values', () => {
      component.orderForm.patchValue({
        orderNo: '25001-0001',
        contractId: 'CON01',
        priority: 'RG',
        orderMode: 'DL',
        contactId: '',
        consigneeId: 'CSG01'
      });
      component.customerId.set('CUST01');
      component.consigneeName.set('Main Lab');
      component.consigneeAddress.set('123 Main St');
      component.orderType.set('RG');
      component.estimatedArrivalTime.set('2025-01-15');
      component.billToCustomerId.set('PAYEE01');
      component.customerName.set('Baylor Hospital');

      const data = component.getFormData();

      expect(data.orderNo).toBe('25001-0001');
      expect(data.customerId).toBe('CUST01');
      expect(data.contractId).toBe('CON01');
      expect(data.priority).toBe('RG');
      expect(data.orderMode).toBe('DL');
      expect(data.consigneeId).toBe('CSG01');
      expect(data.consigneeName).toBe('Main Lab');
      expect(data.consigneeAddress).toBe('123 Main St');
      expect(data.orderType).toBe('RG');
      expect(data.estArrivalTime).toBe('2025-01-15');
      expect(data.payeeId).toBe('PAYEE01');
      expect(data.customerName).toBe('Baylor Hospital');
    });

    it('should return undefined for customerId when signal is --', () => {
      component.customerId.set('--');
      const data = component.getFormData();
      expect(data.customerId).toBeUndefined();
    });

    it('should return undefined for consigneeName when signal is --', () => {
      component.consigneeName.set('--');
      const data = component.getFormData();
      expect(data.consigneeName).toBeUndefined();
    });

    it('should return undefined for consigneeAddress when signal is --', () => {
      component.consigneeAddress.set('--');
      const data = component.getFormData();
      expect(data.consigneeAddress).toBeUndefined();
    });

    it('should return undefined for orderType when signal is --', () => {
      component.orderType.set('--');
      const data = component.getFormData();
      expect(data.orderType).toBeUndefined();
    });

    it('should return undefined for estArrivalTime when signal is --', () => {
      component.estimatedArrivalTime.set('--');
      const data = component.getFormData();
      expect(data.estArrivalTime).toBeUndefined();
    });

    it('should return undefined for payeeId when signal is --', () => {
      component.billToCustomerId.set('--');
      const data = component.getFormData();
      expect(data.payeeId).toBeUndefined();
    });

    it('should return undefined for customerName when signal is --', () => {
      component.customerName.set('--');
      const data = component.getFormData();
      expect(data.customerName).toBeUndefined();
    });

    it('should resolve orderedBy from contact when contactId is set', () => {
      component.contacts.set(mockContacts);
      component.orderForm.patchValue({ contactId: 'CT01' });

      const data = component.getFormData();

      expect(data.orderedBy).toBe('John Doe');
    });

    it('should set orderedBy undefined when contactId is not set', () => {
      component.orderForm.patchValue({ contactId: '' });

      const data = component.getFormData();

      expect(data.orderedBy).toBeUndefined();
    });

    it('should set contactId to undefined when empty', () => {
      component.orderForm.patchValue({ contactId: '' });

      const data = component.getFormData();

      expect(data.contactId).toBeUndefined();
    });

    it('should set contactId when present', () => {
      component.orderForm.patchValue({ contactId: 'CT01' });

      const data = component.getFormData();

      expect(data.contactId).toBe('CT01');
    });

    it('should set orderedBy undefined when contactId does not match any contact', () => {
      component.contacts.set(mockContacts);
      component.orderForm.patchValue({ contactId: 'NONEXISTENT' });

      const data = component.getFormData();

      expect(data.orderedBy).toBeUndefined();
    });
  });

  // ── f getter ──

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.orderForm.controls);
    });
  });

  // ── Signal initial states ──

  describe('signal initial states', () => {
    it('should have loading as false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have orderNumber as --', () => {
      expect(component.orderNumber()).toBe('--');
    });

    it('should have orderType as --', () => {
      expect(component.orderType()).toBe('--');
    });

    it('should have estimatedArrivalTime as --', () => {
      expect(component.estimatedArrivalTime()).toBe('--');
    });

    it('should have customerName as --', () => {
      expect(component.customerName()).toBe('--');
    });

    it('should have customerId as --', () => {
      expect(component.customerId()).toBe('--');
    });

    it('should have consigneeName as --', () => {
      expect(component.consigneeName()).toBe('--');
    });

    it('should have consigneeAddress as --', () => {
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should have billToCustomerId as --', () => {
      expect(component.billToCustomerId()).toBe('--');
    });

    it('should have billToCustomerName as --', () => {
      expect(component.billToCustomerName()).toBe('--');
    });

    it('should have billToAddress as --', () => {
      expect(component.billToAddress()).toBe('--');
    });

    it('should have activeSection as order-info', () => {
      expect(component.activeSection()).toBe('order-info');
    });
  });

  // ── componentId uniqueness ──

  describe('componentId', () => {
    it('should have a unique componentId', () => {
      const fixture2 = TestBed.createComponent(CcStepOrderDetailsComponent);
      fixture2.detectChanges();
      expect((component as any).componentId).not.toBe((fixture2.componentInstance as any).componentId);
    });
  });

  // ── elementId / errorId helpers ──

  describe('elementId', () => {
    it('should generate element IDs based on componentId', () => {
      const id = (component as any).elementId('test-field');
      expect(id).toContain('cc-step-order-details-');
      expect(id).toContain('-test-field');
    });
  });

  describe('errorId', () => {
    it('should generate error IDs based on componentId', () => {
      const id = (component as any).errorId('test-field');
      expect(id).toContain('cc-step-order-details-');
      expect(id).toContain('-test-field-error');
    });
  });

  // ── Form validation ──

  describe('form validation', () => {
    it('should be invalid when orderNo is empty', () => {
      component.orderForm.get('orderNo')!.setValue('');
      expect(component.orderForm.invalid).toBeTrue();
    });

    it('should be valid when only orderNo is filled', () => {
      component.orderForm.get('orderNo')!.setValue('25001-0001');
      expect(component.orderForm.valid).toBeTrue();
    });

    it('should remain valid with optional fields empty', () => {
      component.orderForm.patchValue({
        orderNo: '25001-0001',
        contractId: '',
        priority: '',
        orderMode: '',
        contactId: '',
        consigneeId: ''
      });
      expect(component.orderForm.valid).toBeTrue();
    });
  });

  // ── Search filter debouncing ──

  describe('search filter debouncing', () => {
    it('should debounce order number search', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);

      component.orderNumberSearchCtrl.setValue('baylor');
      tick(100); // Only 100ms, not enough

      // Should still show all since debounce hasn't triggered
      expect(component.filteredOrderNumbers().length).toBe(3);

      tick(100); // Now 200ms total, debounce fires

      expect(component.filteredOrderNumbers().length).toBe(1);
    }));

    it('should debounce contract search', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.filteredContracts.set(mockContracts);

      component.contractSearchCtrl.setValue('con01');
      tick(100);
      // Still within debounce window so filter has not yet triggered
      expect(component.filteredContracts().length).toBe(2);
      tick(100);
      expect(component.filteredContracts().length).toBe(1);
    }));
  });

  // ── Payee address formatting ──

  describe('payee address formatting', () => {
    it('should join non-empty address parts with comma', () => {
      const customerWithPayee = { ...mockCustomer, payeeId: 'CUST01' };
      apiService.getCustomerById.and.returnValue(of(customerWithPayee));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      const addr = component.billToAddress();
      expect(addr).toBe('100 Hospital Dr, Suite 200, Dallas, TX, 75201, US');
    });

    it('should filter out null/undefined address parts', () => {
      const customerPartialAddr = {
        ...mockCustomer,
        payeeId: 'CUST01',
        address1: '100 Main St',
        address2: null,
        city: 'Dallas',
        state: null,
        zipCode: '75201',
        country: null
      };
      apiService.getCustomerById.and.returnValue(of(customerPartialAddr));
      const order = makeOrder({ customerId: 'CUST01' });
      apiService.getOrder.and.returnValue(of(order));

      component.onOrderNumberChange('25001-0001');

      const addr = component.billToAddress();
      expect(addr).toBe('100 Main St, Dallas, 75201');
    });
  });
});
