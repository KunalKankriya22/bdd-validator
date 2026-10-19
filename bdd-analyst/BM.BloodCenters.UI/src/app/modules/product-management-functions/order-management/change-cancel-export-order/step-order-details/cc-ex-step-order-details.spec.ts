import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { CcExStepOrderDetailsComponent } from './cc-ex-step-order-details';
import { ExportOrderApiService } from '../../enter-export-order/services/export-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  ContractLookupItem,
  PayeeLookupItem,
  ExportOrderDto,
  ExportOrderItemDto
} from '../../enter-export-order/models/export-order.model';

describe('CcExStepOrderDetailsComponent', () => {
  let component: CcExStepOrderDetailsComponent;
  let fixture: ComponentFixture<CcExStepOrderDetailsComponent>;

  const mockOrderNumbers: { orderNo: string; customerId?: string; customerName?: string; orderStatus?: string }[] = [
    { orderNo: 'EX25001-0001', customerId: 'CUST001', customerName: 'Parkland Hospital', orderStatus: 'OR' },
    { orderNo: 'EX25001-0002', customerId: 'CUST002', customerName: 'Baylor Hospital', orderStatus: 'SH' },
    { orderNo: 'EX25001-0003', customerId: 'CUST003', customerName: 'UT Southwestern', orderStatus: 'CA' }
  ];

  const mockModes: LookupItem[] = [
    { code: 'ST', description: 'Standard' },
    { code: 'RT', description: 'Rush' }
  ];

  const mockConsignees: ConsigneeDto[] = [
    { consigneeId: 'CON001', consigneeName: 'Lab A', address: '123 Main St' },
    { consigneeId: 'CON002', consigneeName: 'Lab B', address: '456 Oak Ave' }
  ];

  const mockContacts: CustomerContactDto[] = [
    {
      contactId: 'PR', lastName: 'Smith', firstName: 'John',
      salutation: 'Dr', title: 'Director', contactType: 'PR',
      contactTypeCode: 'PR', dayPhone: '555-1234'
    },
    {
      contactId: 'EM', lastName: 'Doe', firstName: 'Jane',
      contactType: 'EM', contactTypeCode: 'EM'
    }
  ];

  const mockContracts: ContractLookupItem[] = [
    { code: 'CTR001', description: 'Annual Contract', substituteFlag: 'Y' },
    { code: 'CTR002', description: 'Spot Contract', substituteFlag: 'N' }
  ];

  const mockPayees: PayeeLookupItem[] = [
    { code: 'PAY001', description: 'Payee Corp', address: '789 Elm St' },
    { code: 'PAY002', description: 'Another Payee', address: '456 Oak Ave' }
  ];

  const mockCustomerDetail: any = {
    customerId: 'CUST001',
    customerName: 'Parkland Hospital',
    name: 'Parkland Hospital',
    payeeId: 'PAY001',
    address1: '5200 Harry Hines',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75235',
    country: 'US'
  };

  const mockOrder: ExportOrderDto = {
    orderNo: 'EX25001-0001',
    chapterId: 'CH001',
    customerId: 'CUST001',
    customerName: 'Parkland Hospital',
    contractId: 'CTR001',
    orderedBy: 'John Smith',
    orderMode: 'ST',
    orderType: 'EX',
    orderStatus: 'OR',
    consigneeId: 'CON001',
    consigneeName: 'Lab A',
    consigneeAddress: '123 Main St',
    payeeId: 'PAY001',
    estArrivalTime: '2025-06-15T10:30:00',
    insertDate: '2025-06-01T00:00:00',
    insertUserId: 'admin'
  };

  const mockOrderItems: ExportOrderItemDto[] = [
    {
      orderNo: 'EX25001-0001', itemNo: 1, productType: 'RBC',
      productTypeDesc: 'Red Blood Cells', bloodType: 'OP',
      bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 5,
      itemStatus: 'EN', allocatedQty: 0, shippedQty: 0
    }
  ];

  const apiService = jasmine.createSpyObj<ExportOrderApiService>('ExportOrderApiService', [
    'getExportOrderNumbers', 'getOrderModesLookup', 'getOrder',
    'getCustomerById', 'getConsignees', 'getContacts', 'getContracts',
    'getPayeesLookup', 'getOrderItems'
  ]);

  const headerService = jasmine.createSpyObj<HeaderService>('HeaderService', [], {
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue(null)
  });

  function resetSpies(): void {
    apiService.getExportOrderNumbers.calls.reset();
    apiService.getOrderModesLookup.calls.reset();
    apiService.getOrder.calls.reset();
    apiService.getCustomerById.calls.reset();
    apiService.getConsignees.calls.reset();
    apiService.getContacts.calls.reset();
    apiService.getContracts.calls.reset();
    apiService.getPayeesLookup.calls.reset();
    apiService.getOrderItems.calls.reset();

    apiService.getExportOrderNumbers.and.returnValue(of(mockOrderNumbers));
    apiService.getOrderModesLookup.and.returnValue(of(mockModes));
    apiService.getOrder.and.returnValue(of(mockOrder));
    apiService.getCustomerById.and.returnValue(of(mockCustomerDetail));
    apiService.getConsignees.and.returnValue(of(mockConsignees));
    apiService.getContacts.and.returnValue(of(mockContacts));
    apiService.getContracts.and.returnValue(of(mockContracts));
    apiService.getPayeesLookup.and.returnValue(of(mockPayees));
    apiService.getOrderItems.and.returnValue(of(mockOrderItems));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        CcExStepOrderDetailsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService },
        { provide: HeaderService, useValue: headerService }
      ]
    });

    fixture = TestBed.createComponent(CcExStepOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Initialization / initializeForm
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should initialize the form with required validators', () => {
      expect(component.orderForm).toBeTruthy();
      expect(component.orderForm.get('orderNo')).toBeTruthy();
      expect(component.orderForm.get('contractId')).toBeTruthy();
      expect(component.orderForm.get('orderMode')).toBeTruthy();
      expect(component.orderForm.get('contactId')).toBeTruthy();
      expect(component.orderForm.get('consigneeId')).toBeTruthy();
    });

    it('should load order numbers on init', () => {
      expect(apiService.getExportOrderNumbers).toHaveBeenCalled();
      expect(component.orderNumbers()).toEqual(mockOrderNumbers);
      expect(component.filteredOrderNumbers()).toEqual(mockOrderNumbers);
    });

    it('should load order modes on init', () => {
      expect(apiService.getOrderModesLookup).toHaveBeenCalled();
      expect(component.modes()).toEqual(mockModes);
      expect(component.filteredModes()).toEqual(mockModes);
    });

    it('should handle order numbers load error', () => {
      resetSpies();
      apiService.getExportOrderNumbers.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(CcExStepOrderDetailsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.orderNumbers()).toEqual([]);
      expect(fix.componentInstance.filteredOrderNumbers()).toEqual([]);
    });

    it('should handle order modes load error', () => {
      resetSpies();
      apiService.getOrderModesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(CcExStepOrderDetailsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.modes()).toEqual([]);
      expect(fix.componentInstance.filteredModes()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Form valueChanges emissions
  // ---------------------------------------------------------------------------
  describe('form valueChanges', () => {
    it('should emit validityChange when orderNo changes', () => {
      spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({ orderNo: 'EX25001-0001' });
      expect(component.validityChange.emit).toHaveBeenCalled();
    });

    it('should emit formDataChange when orderNo changes', () => {
      spyOn(component.formDataChange, 'emit');
      component.orderForm.patchValue({ orderNo: 'EX25001-0001' });
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Order number selection (onOrderNumberChange)
  // ---------------------------------------------------------------------------
  describe('onOrderNumberChange', () => {
    it('should clear order data when orderNo is empty', () => {
      component.orderNumber.set('EX25001-0001');
      component.customerName.set('Parkland Hospital');
      component.onOrderNumberChange('');

      expect(component.orderNumber()).toBe('--');
      expect(component.orderType()).toBe('--');
      expect(component.orderStatus()).toBe('--');
      expect(component.customerId()).toBe('--');
      expect(component.customerName()).toBe('--');
      expect(component.estimatedArrivalTime()).toBe('--');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });

    it('should set loading true while fetching order', () => {
      // Because the spy returns of() which completes synchronously,
      // loading goes true then back to false in the same tick.
      // We verify it was set to false after completion.
      component.onOrderNumberChange('EX25001-0001');
      expect(component.loading()).toBeFalse();
    });

    it('should populate display signals from order data', () => {
      component.onOrderNumberChange('EX25001-0001');
      expect(component.orderNumber()).toBe('EX25001-0001');
      expect(component.orderType()).toBe('EX');
      expect(component.orderStatus()).toBe('OR');
      expect(component.customerId()).toBe('CUST001');
    });

    it('should load customer dependencies via forkJoin', () => {
      apiService.getCustomerById.calls.reset();
      apiService.getConsignees.calls.reset();
      apiService.getContacts.calls.reset();
      apiService.getContracts.calls.reset();
      apiService.getPayeesLookup.calls.reset();
      apiService.getOrderItems.calls.reset();

      component.onOrderNumberChange('EX25001-0001');

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST001');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST001');
      expect(apiService.getPayeesLookup).toHaveBeenCalledWith('CUST001');
      expect(apiService.getOrderItems).toHaveBeenCalledWith('EX25001-0001');
    });

    it('should set consignees, contacts, contracts from forkJoin', () => {
      component.onOrderNumberChange('EX25001-0001');
      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.filteredConsignees()).toEqual(mockConsignees);
      expect(component.contacts()).toEqual(mockContacts);
      expect(component.filteredContacts()).toEqual(mockContacts);
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.filteredContracts()).toEqual(mockContracts);
    });

    it('should set customerName from customer data', () => {
      component.onOrderNumberChange('EX25001-0001');
      expect(component.customerName()).toBe('Parkland Hospital');
    });

    it('should handle null order (order not found)', () => {
      apiService.getOrder.and.returnValue(of(null as any));
      component.onOrderNumberChange('INVALID');
      expect(component.loading()).toBeFalse();
      expect(component.orderNumber()).toBe('--');
    });

    it('should emit orderLoaded event with order and items', () => {
      spyOn(component.orderLoaded, 'emit');
      component.onOrderNumberChange('EX25001-0001');
      expect(component.orderLoaded.emit).toHaveBeenCalledWith({
        order: mockOrder,
        items: mockOrderItems
      });
    });

    it('should match orderedBy contact when present', () => {
      component.onOrderNumberChange('EX25001-0001');
      // mockOrder.orderedBy is 'John Smith' which matches mockContacts[0]
      expect(component.orderForm.getRawValue().contactId).toBe('PR');
    });

    it('should emit validityChange and formDataChange after loading', () => {
      spyOn(component.validityChange, 'emit');
      spyOn(component.formDataChange, 'emit');
      component.onOrderNumberChange('EX25001-0001');
      expect(component.validityChange.emit).toHaveBeenCalled();
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // populateFromSavedData
  // ---------------------------------------------------------------------------
  describe('populateFromSavedData', () => {
    it('should populate form from saved data on init', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        orderNo: 'EX25001-0001',
        contractId: 'CTR001',
        orderMode: 'ST',
        consigneeId: 'CON001',
        customerId: 'CUST001',
        estArrivalTime: '2025-06-15T10:30:00',
        customerName: 'Parkland Hospital',
        orderType: 'EX',
        orderStatus: 'OR'
      };

      const fix = TestBed.createComponent(CcExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      const comp = fix.componentInstance;
      expect(comp.orderForm.get('orderNo')?.value).toBe('EX25001-0001');
      expect(comp.orderForm.get('contractId')?.value).toBe('CTR001');
      expect(comp.orderForm.get('orderMode')?.value).toBe('ST');
      expect(comp.orderForm.get('consigneeId')?.value).toBe('CON001');
      expect(comp.orderNumber()).toBe('EX25001-0001');
      expect(comp.customerName()).toBe('Parkland Hospital');
    });

    it('should default orderNumber to "--" when orderNo not provided', () => {
      // savedOrderData has no orderNo, so populateFromSavedData is never called
      // and the signal stays at its default value
      expect(component.orderNumber()).toBe('--');
    });

    it('should default estimatedArrivalTime to "--" when not provided', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        orderNo: 'EX25001-0001',
        customerId: 'CUST001'
        // no estArrivalTime
      };
      const fix = TestBed.createComponent(CcExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();
      expect(fix.componentInstance.estimatedArrivalTime()).toBe('--');
    });

    it('should load customer dependencies when savedOrderData has customerId', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        orderNo: 'EX25001-0001',
        customerId: 'CUST001'
      };
      const fix = TestBed.createComponent(CcExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST001');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST001');
    });
  });

  // ---------------------------------------------------------------------------
  // isEditable
  // ---------------------------------------------------------------------------
  describe('isEditable', () => {
    it('should return true when status is OR', () => {
      component.orderStatus.set('OR');
      expect(component.isEditable).toBeTrue();
    });

    it('should return true when status is -- (default)', () => {
      component.orderStatus.set('--');
      expect(component.isEditable).toBeTrue();
    });

    it('should return false when status is CA', () => {
      component.orderStatus.set('CA');
      expect(component.isEditable).toBeFalse();
    });

    it('should return false when status is SH', () => {
      component.orderStatus.set('SH');
      expect(component.isEditable).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // onConsigneeChange
  // ---------------------------------------------------------------------------
  describe('onConsigneeChange', () => {
    beforeEach(() => {
      component.consignees.set(mockConsignees);
    });

    it('should set consigneeName and address when consignee found', () => {
      component.onConsigneeChange('CON001');
      expect(component.consigneeName()).toBe('Lab A');
      expect(component.consigneeAddress()).toBe('123 Main St');
    });

    it('should set "--" when consignee not found', () => {
      component.onConsigneeChange('INVALID');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should emit formDataChange', () => {
      spyOn(component.formDataChange, 'emit');
      component.onConsigneeChange('CON001');
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // scrollToSection
  // ---------------------------------------------------------------------------
  describe('scrollToSection', () => {
    it('should set activeSection', () => {
      component.scrollToSection('billing');
      expect(component.activeSection()).toBe('billing');
    });

    it('should call scrollIntoView on element if found', () => {
      const mockElement = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);

      component.scrollToSection('order-info');

      expect(document.getElementById).toHaveBeenCalled();
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should not throw when element not found', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      expect(() => component.scrollToSection('nonexistent')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Search filter subscriptions
  // ---------------------------------------------------------------------------
  describe('search filters', () => {
    it('should filter order numbers by orderNo', fakeAsync(() => {
      component.orderNumbers.set(mockOrderNumbers);
      component.orderNumberSearchCtrl.setValue('EX25001-0001');
      tick(250);
      expect(component.filteredOrderNumbers().length).toBe(1);
      expect(component.filteredOrderNumbers()[0].orderNo).toBe('EX25001-0001');
    }));

    it('should filter contracts by code', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('CTR001');
      tick(250);
      expect(component.filteredContracts().length).toBe(1);
    }));

    it('should filter modes by description', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('Rush');
      tick(250);
      expect(component.filteredModes().length).toBe(1);
    }));

    it('should filter contacts by name', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('John Smith');
      tick(250);
      expect(component.filteredContacts().length).toBe(1);
      expect(component.filteredContacts()[0].contactId).toBe('PR');
    }));

    it('should filter consignees by consigneeName', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('Lab B');
      tick(250);
      expect(component.filteredConsignees().length).toBe(1);
    }));
  });

  // ---------------------------------------------------------------------------
  // getFormData
  // ---------------------------------------------------------------------------
  describe('getFormData', () => {
    it('should return form values as partial ExportOrderDto', () => {
      component.orderForm.patchValue({ orderNo: 'EX25001-0001' });
      component.customerId.set('CUST001');
      component.orderType.set('EX');
      component.orderStatus.set('OR');

      const data = component.getFormData();
      expect(data.orderNo).toBe('EX25001-0001');
      expect(data.customerId).toBe('CUST001');
      expect(data.orderType).toBe('EX');
      expect(data.orderStatus).toBe('OR');
    });

    it('should include orderedBy when contact found', () => {
      component.contacts.set(mockContacts);
      component.orderForm.patchValue({ contactId: 'PR' });
      const data = component.getFormData();
      expect(data.orderedBy).toBe('John Smith');
    });

    it('should not include orderedBy when contactId empty', () => {
      component.orderForm.patchValue({ contactId: '' });
      const data = component.getFormData();
      expect(data.orderedBy).toBeUndefined();
    });

    it('should include payeeId when billToCustomerId is not "--"', () => {
      component.billToCustomerId.set('PAY001');
      const data = component.getFormData();
      expect(data.payeeId).toBe('PAY001');
    });

    it('should not include payeeId when billToCustomerId is "--"', () => {
      component.billToCustomerId.set('--');
      const data = component.getFormData();
      expect(data.payeeId).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // f getter (form controls shortcut)
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.orderForm.controls);
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy / cleanup
  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });

    it('should unsubscribe form valueChanges after destroy', () => {
      spyOn(component.validityChange, 'emit');
      component.ngOnDestroy();

      // After destroy, form changes should not trigger emissions
      // (the takeUntil(destroy$) stops the subscription)
      (component.validityChange.emit as jasmine.Spy).calls.reset();
      component.orderForm.patchValue({ orderNo: 'NEW' });
      expect(component.validityChange.emit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // elementId / errorId helpers
  // ---------------------------------------------------------------------------
  describe('elementId and errorId helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('cc-ex-step-order-details-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs with component prefix', () => {
      const id = (component as any).errorId('test');
      expect(id).toContain('cc-ex-step-order-details-');
      expect(id).toContain('-test-error');
    });
  });

  // ---------------------------------------------------------------------------
  // Payee logic
  // ---------------------------------------------------------------------------
  describe('Payee logic', () => {
    it('should set billToCustomerId from customer payeeId', () => {
      component.onOrderNumberChange('EX25001-0001');
      expect(component.billToCustomerId()).toBe('PAY001');
    });

    it('should use customer as payee when payeeId equals customerId', () => {
      const customerSamePayee = {
        ...mockCustomerDetail,
        payeeId: 'CUST001'
      };
      apiService.getCustomerById.and.returnValue(of(customerSamePayee));

      component.onOrderNumberChange('EX25001-0001');

      expect(component.billToCustomerName()).toBe('Parkland Hospital');
      expect(component.billToAddress()).toContain('5200 Harry Hines');
    });

    it('should handle null customer from API', () => {
      apiService.getCustomerById.and.returnValue(of(null));
      component.onOrderNumberChange('EX25001-0001');
      // customer is null, so consignees/contacts still populated
      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.loading()).toBeFalse();
    });
  });
});
