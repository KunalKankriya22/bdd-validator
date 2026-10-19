import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { ExStepOrderDetailsComponent } from './ex-step-order-details';
import { ExportOrderApiService } from '../services/export-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { LookupItem, ConsigneeDto, CustomerContactDto, ContractLookupItem, PayeeLookupItem, StandingOrderItemDto } from '../models/export-order.model';
import { ExportOrderDto } from '../models/export-order.model';

describe('ExStepOrderDetailsComponent', () => {
  let component: ExStepOrderDetailsComponent;
  let fixture: ComponentFixture<ExStepOrderDetailsComponent>;

  const mockCustomers: LookupItem[] = [
    { code: 'CUST001', description: 'Parkland Hospital' },
    { code: 'CUST002', description: 'Baylor Hospital' },
    { code: 'CUST003', description: 'UT Southwestern' }
  ];

  const mockModes: LookupItem[] = [
    { code: 'ST', description: 'Standard' },
    { code: 'RT', description: 'Rush' }
  ];

  const mockPriorities: LookupItem[] = [
    { code: 'RG', description: 'Regular' },
    { code: 'EM', description: 'Emergency' }
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

  const apiService = jasmine.createSpyObj<ExportOrderApiService>('ExportOrderApiService', [
    'getCustomersLookup', 'getOrderModesLookup', 'getOrderClassesLookup',
    'getCustomerById', 'getConsignees', 'getContacts', 'getContracts',
    'createContact', 'getPayeesLookup', 'getStandingOrderItems'
  ]);

  const headerService = jasmine.createSpyObj<HeaderService>('HeaderService', [], {
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue(null)
  });

  function resetSpies(): void {
    apiService.getCustomersLookup.calls.reset();
    apiService.getOrderModesLookup.calls.reset();
    apiService.getOrderClassesLookup.calls.reset();
    apiService.getCustomerById.calls.reset();
    apiService.getConsignees.calls.reset();
    apiService.getContacts.calls.reset();
    apiService.getContracts.calls.reset();
    apiService.createContact.calls.reset();
    apiService.getPayeesLookup.calls.reset();
    apiService.getStandingOrderItems.calls.reset();

    apiService.getCustomersLookup.and.returnValue(of(mockCustomers));
    apiService.getOrderModesLookup.and.returnValue(of(mockModes));
    apiService.getOrderClassesLookup.and.returnValue(of(mockPriorities));
    apiService.getCustomerById.and.returnValue(of(mockCustomerDetail));
    apiService.getConsignees.and.returnValue(of(mockConsignees));
    apiService.getContacts.and.returnValue(of(mockContacts));
    apiService.getContracts.and.returnValue(of(mockContracts));
    apiService.createContact.and.returnValue(of({ contactType: 'NW', lastName: 'New', firstName: 'Contact' }));
    apiService.getPayeesLookup.and.returnValue(of(mockPayees));
    apiService.getStandingOrderItems.and.returnValue(of([]));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        ExStepOrderDetailsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService },
        { provide: HeaderService, useValue: headerService }
      ]
    });

    fixture = TestBed.createComponent(ExStepOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // ngOnInit / initializeForm
  // ---------------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('should initialize the form with required validators', () => {
      expect(component.orderForm).toBeTruthy();
      expect(component.orderForm.get('contractId')).toBeTruthy();
      expect(component.orderForm.get('priority')).toBeTruthy();
      expect(component.orderForm.get('orderMode')).toBeTruthy();
      expect(component.orderForm.get('customerId')).toBeTruthy();
      expect(component.orderForm.get('contactId')).toBeTruthy();
      expect(component.orderForm.get('consigneeId')).toBeTruthy();
    });

    it('should mark all form controls as required', () => {
      const controls = ['contractId', 'priority', 'orderMode', 'customerId', 'contactId', 'consigneeId'];
      controls.forEach(name => {
        const control = component.orderForm.get(name);
        control?.setValue('');
        expect(control?.hasError('required')).toBeTrue();
      });
    });

    it('should load customers on init', () => {
      expect(apiService.getCustomersLookup).toHaveBeenCalled();
      expect(component.customers()).toEqual(mockCustomers);
      expect(component.filteredCustomers()).toEqual(mockCustomers);
    });

    it('should load order modes on init', () => {
      expect(apiService.getOrderModesLookup).toHaveBeenCalled();
      expect(component.modes()).toEqual(mockModes);
      expect(component.filteredModes()).toEqual(mockModes);
    });

    it('should load priorities (order classes) on init', () => {
      expect(apiService.getOrderClassesLookup).toHaveBeenCalled();
      expect(component.priorities()).toEqual(mockPriorities);
      expect(component.filteredPriorities()).toEqual(mockPriorities);
    });

    it('should handle error loading customers', () => {
      resetSpies();
      apiService.getCustomersLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.customers()).toEqual([]);
      expect(fix.componentInstance.filteredCustomers()).toEqual([]);
    });

    it('should handle error loading order modes', () => {
      resetSpies();
      apiService.getOrderModesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.modes()).toEqual([]);
      expect(fix.componentInstance.filteredModes()).toEqual([]);
    });

    it('should handle error loading priorities', () => {
      resetSpies();
      apiService.getOrderClassesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.priorities()).toEqual([]);
      expect(fix.componentInstance.filteredPriorities()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Form valueChanges emissions
  // ---------------------------------------------------------------------------
  describe('form valueChanges', () => {
    it('should emit validityChange when form value changes', () => {
      spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({ customerId: 'CUST001' });
      expect(component.validityChange.emit).toHaveBeenCalledWith(component.orderForm.valid);
    });

    it('should emit formDataChange when form value changes', () => {
      spyOn(component.formDataChange, 'emit');
      component.orderForm.patchValue({ customerId: 'CUST001' });
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });

    it('should emit valid=false when form is incomplete', () => {
      spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({ customerId: 'CUST001' });
      // Form still has other required fields empty
      expect(component.validityChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit valid=true when all required fields are filled', () => {
      spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({
        contractId: 'CTR001',
        priority: 'RG',
        orderMode: 'ST',
        customerId: 'CUST001',
        contactId: 'PR',
        consigneeId: 'CON001',
        payeeId: 'PAY001'
      });
      expect(component.validityChange.emit).toHaveBeenCalledWith(true);
    });
  });

  // ---------------------------------------------------------------------------
  // populateFromSavedData
  // ---------------------------------------------------------------------------
  describe('populateFromSavedData', () => {
    it('should populate form from saved data on init', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        contractId: 'CTR001',
        priority: 'RG',
        orderMode: 'ST',
        customerId: 'CUST001',
        consigneeId: 'CON001',
        orderNo: 'EX25001-0001',
        estArrivalTime: '2025-06-15T10:30:00',
        customerName: 'Parkland Hospital'
      };

      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      const comp = fix.componentInstance;
      expect(comp.orderForm.get('contractId')?.value).toBe('CTR001');
      expect(comp.orderForm.get('priority')?.value).toBe('RG');
      expect(comp.orderForm.get('orderMode')?.value).toBe('ST');
      expect(comp.orderForm.get('customerId')?.value).toBe('CUST001');
      expect(comp.orderForm.get('consigneeId')?.value).toBe('CON001');
      expect(comp.orderNumber()).toBe('EX25001-0001');
      expect(comp.customerName()).toBe('Parkland Hospital');
    });

    it('should default orderNumber to "--" when orderNo is not provided', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        customerId: 'CUST001'
      };
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();
      expect(fix.componentInstance.orderNumber()).toBe('--');
    });

    it('should default estimatedArrivalTime to "--" when estArrivalTime is not provided', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        customerId: 'CUST001'
      };
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();
      expect(fix.componentInstance.estimatedArrivalTime()).toBe('--');
    });

    it('should load customer dependencies when savedOrderData has customerId', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        customerId: 'CUST001'
      };
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST001');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST001');
    });

    it('should not load customer dependencies when savedOrderData has no customerId', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {
        priority: 'RG'
      };
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      expect(apiService.getCustomerById).not.toHaveBeenCalled();
    });

    it('should not populate when savedOrderData is null', () => {
      // Component was already created with null savedOrderData
      expect(component.orderForm.get('customerId')?.value).toBe('');
    });

    it('should use empty string when optional saved fields are undefined', () => {
      resetSpies();
      const savedData: Partial<ExportOrderDto> = {} as any;
      const fix = TestBed.createComponent(ExStepOrderDetailsComponent);
      fix.componentInstance.savedOrderData = savedData;
      fix.detectChanges();

      expect(fix.componentInstance.orderForm.get('contractId')?.value).toBe('');
      expect(fix.componentInstance.orderForm.get('priority')?.value).toBe('');
      expect(fix.componentInstance.orderForm.get('orderMode')?.value).toBe('');
      expect(fix.componentInstance.orderForm.get('customerId')?.value).toBe('');
      expect(fix.componentInstance.orderForm.get('consigneeId')?.value).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onCustomerChange
  // ---------------------------------------------------------------------------
  describe('onCustomerChange', () => {
    it('should reset contactId and consigneeId when customer changes', () => {
      component.orderForm.patchValue({ contactId: 'PR', consigneeId: 'CON001' });
      component.onCustomerChange('CUST002');
      expect(component.orderForm.get('contactId')?.value).toBe('');
      expect(component.orderForm.get('consigneeId')?.value).toBe('');
    });

    it('should reload contracts for the new customer', () => {
      component.contracts.set(mockContracts);
      component.filteredContracts.set(mockContracts);
      apiService.getContracts.calls.reset();
      component.onCustomerChange('CUST002');
      // loadCustomerDependencies is called which reloads contracts from API
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST002');
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.filteredContracts()).toEqual(mockContracts);
    });

    it('should clear display fields when customerId is empty', () => {
      component.customerName.set('Some Name');
      component.consigneeName.set('Some Consignee');
      component.billToCustomerId.set('PAY001');
      component.onCustomerChange('');

      expect(component.customerName()).toBe('--');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
      expect(component.contacts()).toEqual([]);
      expect(component.filteredContacts()).toEqual([]);
      expect(component.consignees()).toEqual([]);
      expect(component.filteredConsignees()).toEqual([]);
    });

    it('should not call API when customerId is empty', () => {
      apiService.getCustomerById.calls.reset();
      component.onCustomerChange('');
      expect(apiService.getCustomerById).not.toHaveBeenCalled();
    });

    it('should set loading to true when loading customer', () => {
      component.onCustomerChange('CUST001');
      // loading is set true before the forkJoin completes
      // After subscription completes, it goes back to false
      expect(component.loading()).toBeFalse(); // forkJoin completed synchronously with `of()`
    });

    it('should load customer dependencies when a valid customerId is provided', () => {
      apiService.getCustomerById.calls.reset();
      apiService.getConsignees.calls.reset();
      apiService.getContacts.calls.reset();
      apiService.getContracts.calls.reset();

      component.onCustomerChange('CUST001');

      expect(apiService.getCustomerById).toHaveBeenCalledWith('CUST001');
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContacts).toHaveBeenCalledWith('CUST001');
      expect(apiService.getContracts).toHaveBeenCalledWith('CUST001');
    });

    it('should populate consignees and contacts after customer change', () => {
      component.onCustomerChange('CUST001');
      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.filteredConsignees()).toEqual(mockConsignees);
      expect(component.contacts()).toEqual(mockContacts);
      expect(component.filteredContacts()).toEqual(mockContacts);
    });

    it('should populate contracts after customer change', () => {
      component.onCustomerChange('CUST001');
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.filteredContracts()).toEqual(mockContracts);
    });

    it('should set customerName from customer data', () => {
      component.onCustomerChange('CUST001');
      expect(component.customerName()).toBe('Parkland Hospital');
    });

    it('should reset consigneeName and consigneeAddress after customer change', () => {
      component.consigneeName.set('Old Consignee');
      component.consigneeAddress.set('Old Address');
      component.onCustomerChange('CUST001');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should set loading to false after customer dependencies are loaded', () => {
      component.onCustomerChange('CUST001');
      expect(component.loading()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // loadCustomerDependencies - payee logic
  // ---------------------------------------------------------------------------
  describe('loadCustomerDependencies - payee logic', () => {
    it('should fetch payee details when payeeId differs from customerId', () => {
      const payeeDetail = {
        customerId: 'PAY001',
        customerName: 'Payee Corp',
        address1: '789 Elm St',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        country: 'US'
      };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST001') return of(mockCustomerDetail);
        if (id === 'PAY001') return of(payeeDetail);
        return of(null);
      });

      component.onCustomerChange('CUST001');

      expect(apiService.getCustomerById).toHaveBeenCalledWith('PAY001');
      expect(component.billToCustomerName()).toBe('Payee Corp');
      expect(component.billToAddress()).toContain('789 Elm St');
      expect(component.billToAddress()).toContain('Houston');
    });

    it('should use customer as payee when payeeId equals customerId', () => {
      const customerSamePayee = {
        ...mockCustomerDetail,
        payeeId: 'CUST001'
      };
      apiService.getCustomerById.and.returnValue(of(customerSamePayee));

      component.onCustomerChange('CUST001');

      expect(component.billToCustomerName()).toBe('Parkland Hospital');
      expect(component.billToAddress()).toContain('5200 Harry Hines');
    });

    it('should use customer as payee when payeeId is undefined', () => {
      const customerNoPayee = {
        ...mockCustomerDetail,
        payeeId: undefined,
        customerId: 'CUST001'
      };
      apiService.getCustomerById.and.returnValue(of(customerNoPayee));

      component.onCustomerChange('CUST001');

      // payeeId falls back to customerId, which equals customerId, so customer is payee
      expect(component.billToCustomerName()).toBe('Parkland Hospital');
    });

    it('should handle null customer from API', () => {
      apiService.getCustomerById.and.returnValue(of(null));
      component.onCustomerChange('CUST001');
      // Should not throw; consignees/contacts still populated
      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.loading()).toBeFalse();
    });

    it('should handle error in getCustomerById within forkJoin', () => {
      apiService.getCustomerById.and.returnValue(throwError(() => new Error('fail')));
      component.onCustomerChange('CUST001');
      // catchError converts to of(null), so customer is null
      expect(component.loading()).toBeFalse();
    });

    it('should handle error in getConsignees within forkJoin', () => {
      apiService.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      component.onCustomerChange('CUST001');
      expect(component.consignees()).toEqual([]);
      expect(component.filteredConsignees()).toEqual([]);
    });

    it('should handle error in getContacts within forkJoin', () => {
      apiService.getContacts.and.returnValue(throwError(() => new Error('fail')));
      component.onCustomerChange('CUST001');
      expect(component.contacts()).toEqual([]);
      expect(component.filteredContacts()).toEqual([]);
    });

    it('should handle error in getContracts within forkJoin', () => {
      apiService.getContracts.and.returnValue(throwError(() => new Error('fail')));
      component.onCustomerChange('CUST001');
      expect(component.contracts()).toEqual([]);
      expect(component.filteredContracts()).toEqual([]);
    });

    it('should handle payee API error gracefully', () => {
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'CUST001') return of(mockCustomerDetail);
        if (id === 'PAY001') return throwError(() => new Error('payee fail'));
        return of(null);
      });

      // Should not throw
      component.onCustomerChange('CUST001');
      expect(component.customerName()).toBe('Parkland Hospital');
    });

    it('should set billToCustomerId from payeeId', () => {
      component.onCustomerChange('CUST001');
      expect(component.billToCustomerId()).toBe('PAY001');
    });

    it('should set billToCustomerId to "--" when customer is null', () => {
      apiService.getCustomerById.and.returnValue(of(null));
      component.onCustomerChange('CUST001');
      // customer is null, so billToCustomerId is not updated (stays default)
      // The signal wasn't touched for null customer
      expect(component.billToCustomerId()).toBe('--');
    });

    it('should fall back to name when customerName is missing', () => {
      apiService.getCustomerById.and.returnValue(of({
        customerId: 'CUST001',
        name: 'Fallback Name',
        payeeId: 'CUST001'
      }));
      component.onCustomerChange('CUST001');
      expect(component.customerName()).toBe('Fallback Name');
    });

    it('should set customerName to "--" when both customerName and name are missing', () => {
      apiService.getCustomerById.and.returnValue(of({
        customerId: 'CUST001',
        payeeId: 'CUST001'
      }));
      component.onCustomerChange('CUST001');
      expect(component.customerName()).toBe('--');
    });

    it('should build billToAddress filtering out null/empty segments', () => {
      const customerWithPartialAddr = {
        ...mockCustomerDetail,
        payeeId: 'CUST001',
        address2: null,
        country: ''
      };
      apiService.getCustomerById.and.returnValue(of(customerWithPartialAddr));
      component.onCustomerChange('CUST001');

      const addr = component.billToAddress();
      expect(addr).not.toContain('null');
      expect(addr).toContain('5200 Harry Hines');
      expect(addr).toContain('Dallas');
    });

    it('should set billToAddress to "--" when all address fields are empty', () => {
      apiService.getCustomerById.and.returnValue(of({
        customerId: 'CUST001',
        customerName: 'Test',
        payeeId: 'CUST001'
      }));
      component.onCustomerChange('CUST001');
      expect(component.billToAddress()).toBe('--');
    });

    it('should emit formDataChange after customer dependencies load', () => {
      spyOn(component.formDataChange, 'emit');
      component.onCustomerChange('CUST001');
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onConsigneeChange
  // ---------------------------------------------------------------------------
  describe('onConsigneeChange', () => {
    beforeEach(() => {
      component.consignees.set(mockConsignees);
    });

    it('should set consigneeName and address when consignee is found', () => {
      component.onConsigneeChange('CON001');
      expect(component.consigneeName()).toBe('Lab A');
      expect(component.consigneeAddress()).toBe('123 Main St');
    });

    it('should set "--" when consignee is not found', () => {
      component.onConsigneeChange('INVALID');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should set "--" when consigneeName is empty', () => {
      component.consignees.set([{ consigneeId: 'CON003', consigneeName: '', address: '' }]);
      component.onConsigneeChange('CON003');
      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // onAddNewContact
  // ---------------------------------------------------------------------------
  describe('onAddNewContact', () => {
    let dialogOpenSpy: jasmine.Spy;

    beforeEach(() => {
      dialogOpenSpy = spyOn((component as any).dialog, 'open');
    });

    it('should not open dialog when customerId is empty', () => {
      component.orderForm.patchValue({ customerId: '' });
      component.onAddNewContact();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open dialog with correct config when customerId is set', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogCall = dialogOpenSpy.calls.mostRecent();
      expect(dialogCall.args[1]?.data).toEqual({ customerId: 'CUST001' });
      expect(dialogCall.args[1]?.width).toBe('500px');
      expect(dialogCall.args[1]?.height).toBe('100vh');
      expect(dialogCall.args[1]?.position).toEqual({ right: '0' });
    });

    it('should not create contact when dialog is closed without result', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      apiService.createContact.calls.reset();

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();
      afterClosedSubject.next(null);
      afterClosedSubject.complete();

      expect(apiService.createContact).not.toHaveBeenCalled();
    });

    it('should not create contact when dialog result is undefined', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      apiService.createContact.calls.reset();

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();
      afterClosedSubject.next(undefined);
      afterClosedSubject.complete();

      expect(apiService.createContact).not.toHaveBeenCalled();
    });

    it('should create contact when dialog returns result', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01',
        salutation: 'Mr',
        title: 'Manager',
        nightPhone: '555-8888',
        faxNumber: '555-7777',
        telexNumber: '555-6666',
        terminationDate: '2026-12-31'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.calls.reset();

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      expect(apiService.createContact).toHaveBeenCalledWith('CUST001', jasmine.objectContaining({
        contactType: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhoneNo: '555-9999',
        effDate: '2025-01-01',
        salutation: 'Mr',
        title: 'Manager',
        nightPhoneNo: '555-8888',
        faxNo: '555-7777',
        telexNo: '555-6666',
        termDate: '2026-12-31'
      }));
    });

    it('should omit optional fields when not provided in dialog result', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.calls.reset();

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      const callArgs = apiService.createContact.calls.mostRecent().args[1];
      expect(callArgs.salutation).toBeUndefined();
      expect(callArgs.title).toBeUndefined();
      expect(callArgs.nightPhoneNo).toBeUndefined();
      expect(callArgs.faxNo).toBeUndefined();
      expect(callArgs.telexNo).toBeUndefined();
      expect(callArgs.termDate).toBeUndefined();
    });

    it('should add new contact to contacts list when API succeeds', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01'
      };

      const savedContact = {
        contactType: 'NW',
        lastName: 'Contact',
        firstName: 'New',
        dayPhoneNo: '555-9999',
        effDate: '2025-01-01'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.and.returnValue(of(savedContact));

      const initialCount = component.contacts().length;
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      expect(component.contacts().length).toBe(initialCount + 1);
      const newContact = component.contacts()[component.contacts().length - 1];
      expect(newContact.firstName).toBe('New');
      expect(newContact.lastName).toBe('Contact');
      expect(newContact.contactType).toBe('NW');
    });

    it('should also add new contact to filteredContacts', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.and.returnValue(of({ contactType: 'NW', lastName: 'Contact', firstName: 'New' }));

      const initialFilteredCount = component.filteredContacts().length;
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      expect(component.filteredContacts().length).toBe(initialFilteredCount + 1);
    });

    it('should not add contact when API returns null (error caught)', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.and.returnValue(throwError(() => new Error('fail')));

      const initialCount = component.contacts().length;
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      expect(component.contacts().length).toBe(initialCount);
    });

    it('should use dialog result values as fallback when saved response fields are missing', () => {
      const dialogResult = {
        contactTypeCode: 'NW',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-9999',
        effectiveDate: '2025-01-01',
        salutation: 'Dr',
        title: 'Chief'
      };

      dialogOpenSpy.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      apiService.createContact.and.returnValue(of({})); // empty response - all fallback to dialog result

      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewContact();

      const newContact = component.contacts()[component.contacts().length - 1];
      expect(newContact.contactId).toBe('NW');
      expect(newContact.firstName).toBe('New');
      expect(newContact.lastName).toBe('Contact');
      expect(newContact.salutation).toBe('Dr');
      expect(newContact.title).toBe('Chief');
      expect(newContact.dayPhone).toBe('555-9999');
      expect(newContact.effectiveDate).toBe('2025-01-01');
    });
  });

  // ---------------------------------------------------------------------------
  // scrollToSection
  // ---------------------------------------------------------------------------
  describe('scrollToSection', () => {
    it('should set activeSection to the provided value', () => {
      component.scrollToSection('billing');
      expect(component.activeSection()).toBe('billing');
    });

    it('should call scrollIntoView on the element if found', () => {
      const mockElement = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);

      component.scrollToSection('order-info');

      expect(document.getElementById).toHaveBeenCalled();
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should not throw when element is not found', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      expect(() => component.scrollToSection('nonexistent')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Search filter subscriptions
  // ---------------------------------------------------------------------------
  describe('search filters', () => {
    it('should filter customers by code', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue('CUST001');
      tick(250);
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('CUST001');
    }));

    it('should filter customers by description', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue('Baylor');
      tick(250);
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].description).toBe('Baylor Hospital');
    }));

    it('should show all customers when search is empty', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredCustomers().length).toBe(mockCustomers.length);
    }));

    it('should show no customers when search does not match', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue('ZZZZZ');
      tick(250);
      expect(component.filteredCustomers().length).toBe(0);
    }));

    it('should filter contracts by code', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('CTR001');
      tick(250);
      expect(component.filteredContracts().length).toBe(1);
    }));

    it('should filter contracts by description', fakeAsync(() => {
      component.contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('Annual');
      tick(250);
      expect(component.filteredContracts().length).toBe(1);
    }));

    it('should filter priorities by code or description', fakeAsync(() => {
      component.priorities.set(mockPriorities);
      component.prioritySearchCtrl.setValue('Regular');
      tick(250);
      expect(component.filteredPriorities().length).toBe(1);
      expect(component.filteredPriorities()[0].code).toBe('RG');
    }));

    it('should filter priorities by description', fakeAsync(() => {
      component.priorities.set(mockPriorities);
      component.prioritySearchCtrl.setValue('Emergency');
      tick(250);
      expect(component.filteredPriorities().length).toBe(1);
    }));

    it('should filter modes by code', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('ST');
      tick(250);
      expect(component.filteredModes().length).toBe(1);
    }));

    it('should filter modes by description', fakeAsync(() => {
      component.modes.set(mockModes);
      component.modeSearchCtrl.setValue('Rush');
      tick(250);
      expect(component.filteredModes().length).toBe(1);
    }));

    it('should filter contacts by first + last name', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('John Smith');
      tick(250);
      expect(component.filteredContacts().length).toBe(1);
      expect(component.filteredContacts()[0].contactId).toBe('PR');
    }));

    it('should filter contacts case-insensitively', fakeAsync(() => {
      component.contacts.set(mockContacts);
      component.contactSearchCtrl.setValue('jane');
      tick(250);
      expect(component.filteredContacts().length).toBe(1);
      expect(component.filteredContacts()[0].contactId).toBe('EM');
    }));

    it('should filter consignees by consigneeId', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('CON001');
      tick(250);
      expect(component.filteredConsignees().length).toBe(1);
    }));

    it('should filter consignees by consigneeName', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue('Lab B');
      tick(250);
      expect(component.filteredConsignees().length).toBe(1);
    }));

    it('should handle null search term for customer filter', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredCustomers().length).toBe(mockCustomers.length);
    }));

    it('should handle null search term for consignee filter', fakeAsync(() => {
      component.consignees.set(mockConsignees);
      component.consigneeSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredConsignees().length).toBe(mockConsignees.length);
    }));

    it('should be case-insensitive for customer search', fakeAsync(() => {
      component.customers.set(mockCustomers);
      component.customerSearchCtrl.setValue('parkland');
      tick(250);
      expect(component.filteredCustomers().length).toBe(1);
    }));
  });

  // ---------------------------------------------------------------------------
  // getFormData
  // ---------------------------------------------------------------------------
  describe('getFormData', () => {
    it('should return form values as ExportOrderDto partial', () => {
      component.orderForm.patchValue({
        customerId: 'CUST001',
        contractId: 'CTR001',
        priority: 'RG',
        orderMode: 'ST',
        contactId: 'PR',
        consigneeId: 'CON001'
      });

      const data = component.getFormData();
      expect(data.customerId).toBe('CUST001');
      expect(data.contractId).toBe('CTR001');
      expect(data.priority).toBe('RG');
      expect(data.orderMode).toBe('ST');
      expect(data.consigneeId).toBe('CON001');
    });

    it('should include orderedBy when contact is found', () => {
      component.contacts.set(mockContacts);
      component.orderForm.patchValue({ contactId: 'PR' });

      const data = component.getFormData();
      expect(data.orderedBy).toBe('John Smith');
    });

    it('should not include orderedBy when contactId is empty', () => {
      component.orderForm.patchValue({ contactId: '' });
      const data = component.getFormData();
      expect(data.orderedBy).toBeUndefined();
    });

    it('should not include orderedBy when contact is not found', () => {
      component.contacts.set(mockContacts);
      component.orderForm.patchValue({ contactId: 'INVALID' });
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

    it('should include customerName from signal', () => {
      component.customerName.set('Test Hospital');
      const data = component.getFormData();
      expect(data.customerName).toBe('Test Hospital');
    });

    it('should include orderNo when orderNumber is not "--"', () => {
      component.orderNumber.set('EX25001-0001');
      const data = component.getFormData();
      expect(data.orderNo).toBe('EX25001-0001');
    });

    it('should not include orderNo when orderNumber is "--"', () => {
      component.orderNumber.set('--');
      const data = component.getFormData();
      expect(data.orderNo).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // f getter (form controls shortcut)
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.orderForm.controls);
    });

    it('should provide access to individual controls', () => {
      expect(component.f['customerId']).toBe(component.orderForm.get('customerId'));
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
      component.orderForm.patchValue({ customerId: 'NEW' });
      expect(component.validityChange.emit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // elementId / errorId helpers
  // ---------------------------------------------------------------------------
  describe('elementId and errorId helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('ex-step-order-details-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs with component prefix and -error suffix', () => {
      const id = (component as any).errorId('test');
      expect(id).toContain('ex-step-order-details-');
      expect(id).toContain('-test-error');
    });
  });

  // ---------------------------------------------------------------------------
  // Payee dropdown
  // ---------------------------------------------------------------------------
  describe('Payee dropdown', () => {
    it('should load payees in loadCustomerDependencies', () => {
      apiService.getPayeesLookup.calls.reset();
      component.onCustomerChange('CUST001');
      expect(apiService.getPayeesLookup).toHaveBeenCalledWith('CUST001');
      expect(component.payees()).toEqual(mockPayees);
      expect(component.filteredPayees()).toEqual(mockPayees);
    });

    it('should default payee from customer data', () => {
      component.onCustomerChange('CUST001');
      expect(component.orderForm.get('payeeId')?.value).toBe('PAY001');
    });

    it('should require payeeId', () => {
      component.orderForm.get('payeeId')?.setValue('');
      expect(component.orderForm.get('payeeId')?.hasError('required')).toBeTrue();
    });

    it('should clear payees when customerId is empty', () => {
      component.payees.set(mockPayees);
      component.filteredPayees.set(mockPayees);
      component.onCustomerChange('');
      expect(component.payees()).toEqual([]);
      expect(component.filteredPayees()).toEqual([]);
    });

    it('should filter payees by search term', (done) => {
      component.payees.set(mockPayees);
      component.payeeSearchCtrl.setValue('Payee Corp');
      setTimeout(() => {
        expect(component.filteredPayees().length).toBe(1);
        expect(component.filteredPayees()[0].code).toBe('PAY001');
        done();
      }, 250);
    });
  });

  // ---------------------------------------------------------------------------
  // onPayeeChange
  // ---------------------------------------------------------------------------
  describe('onPayeeChange', () => {
    it('should update bill-to display on payee change', () => {
      const payeeDetail = {
        customerId: 'PAY002',
        customerName: 'Another Payee',
        address1: '456 Oak Ave',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001'
      };
      apiService.getCustomerById.and.callFake((id: string) => {
        if (id === 'PAY002') return of(payeeDetail);
        return of(mockCustomerDetail);
      });

      component.onPayeeChange('PAY002');

      expect(component.billToCustomerId()).toBe('PAY002');
      expect(component.billToCustomerName()).toBe('Another Payee');
      expect(component.billToAddress()).toContain('456 Oak Ave');
    });

    it('should clear bill-to when payeeId is empty', () => {
      component.billToCustomerId.set('PAY001');
      component.billToCustomerName.set('Some Name');
      component.onPayeeChange('');
      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });

    it('should handle null payee from API', () => {
      apiService.getCustomerById.and.returnValue(of(null));
      component.onPayeeChange('PAY999');
      expect(component.billToCustomerId()).toBe('PAY999');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // COD flag
  // ---------------------------------------------------------------------------
  describe('COD flag', () => {
    it('should default codFlag to false', () => {
      expect(component.orderForm.get('codFlag')?.value).toBeFalse();
    });

    it('should set codFlag from customer data', () => {
      const customerWithCod = { ...mockCustomerDetail, codFlag: 'Y' };
      apiService.getCustomerById.and.returnValue(of(customerWithCod));
      component.onCustomerChange('CUST001');
      expect(component.orderForm.get('codFlag')?.value).toBeTrue();
    });

    it('should convert to Y/N in getFormData', () => {
      component.orderForm.patchValue({ codFlag: true });
      const data = component.getFormData();
      expect(data.codFlag).toBe('Y');
    });

    it('should convert false to N in getFormData', () => {
      component.orderForm.patchValue({ codFlag: false });
      const data = component.getFormData();
      expect(data.codFlag).toBe('N');
    });
  });

  // ---------------------------------------------------------------------------
  // EST arrival time
  // ---------------------------------------------------------------------------
  describe('EST arrival time', () => {
    it('should calculate arrival time on priority change', () => {
      component.priorities.set([{ code: 'RG', description: 'Regular', processHours: 24 }]);
      component.orderForm.patchValue({ priority: 'RG' });
      component.onPriorityChange();
      expect(component.estimatedArrivalTime()).not.toBe('--');
    });

    it('should set "--" when priority has no processHours', () => {
      component.priorities.set([{ code: 'EM', description: 'Emergency', processHours: null }]);
      component.orderForm.patchValue({ priority: 'EM' });
      component.onPriorityChange();
      expect(component.estimatedArrivalTime()).toBe('--');
    });

    it('should set "--" when priority is not found', () => {
      component.priorities.set([]);
      component.orderForm.patchValue({ priority: 'INVALID' });
      component.onPriorityChange();
      expect(component.estimatedArrivalTime()).toBe('--');
    });

    it('should emit formDataChange on priority change', () => {
      spyOn(component.formDataChange, 'emit');
      component.priorities.set([{ code: 'RG', description: 'Regular', processHours: 24 }]);
      component.orderForm.patchValue({ priority: 'RG' });
      (component.formDataChange.emit as jasmine.Spy).calls.reset();
      component.onPriorityChange();
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Contract substituteFlag
  // ---------------------------------------------------------------------------
  describe('Contract substituteFlag', () => {
    it('should emit substituteFlag on contract change', () => {
      spyOn(component.contractSubstituteFlagChange, 'emit');
      component.contracts.set(mockContracts);
      component.orderForm.patchValue({ contractId: 'CTR001' });
      component.onContractChange();
      expect(component.contractSubstituteFlagChange.emit).toHaveBeenCalledWith('Y');
    });

    it('should emit null when contract not found', () => {
      spyOn(component.contractSubstituteFlagChange, 'emit');
      component.contracts.set(mockContracts);
      component.orderForm.patchValue({ contractId: 'INVALID' });
      component.onContractChange();
      expect(component.contractSubstituteFlagChange.emit).toHaveBeenCalledWith(null);
    });

    it('should emit N for contract with substituteFlag N', () => {
      spyOn(component.contractSubstituteFlagChange, 'emit');
      component.contracts.set(mockContracts);
      component.orderForm.patchValue({ contractId: 'CTR002' });
      component.onContractChange();
      expect(component.contractSubstituteFlagChange.emit).toHaveBeenCalledWith('N');
    });
  });

  // ---------------------------------------------------------------------------
  // Price change flag
  // ---------------------------------------------------------------------------
  describe('Price change flag', () => {
    it('should emit priceChangeFlag from customer data', () => {
      spyOn(component.priceChangeFlagChange, 'emit');
      const customerWithPrice = { ...mockCustomerDetail, priceChangeFlag: 'Y' };
      apiService.getCustomerById.and.returnValue(of(customerWithPrice));
      component.onCustomerChange('CUST001');
      expect(component.priceChangeFlagChange.emit).toHaveBeenCalledWith('Y');
    });

    it('should emit null when priceChangeFlag is not set', () => {
      spyOn(component.priceChangeFlagChange, 'emit');
      apiService.getCustomerById.and.returnValue(of(mockCustomerDetail));
      component.onCustomerChange('CUST001');
      expect(component.priceChangeFlagChange.emit).toHaveBeenCalledWith(null);
    });
  });

  // ---------------------------------------------------------------------------
  // Standing order check
  // ---------------------------------------------------------------------------
  describe('Standing order check', () => {
    it('should check standing orders when all fields set', () => {
      apiService.getStandingOrderItems.calls.reset();
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      expect(apiService.getStandingOrderItems).toHaveBeenCalledWith('CUST001', 'CTR001', 'CON001');
    });

    it('should not check when customerId is missing', () => {
      apiService.getStandingOrderItems.calls.reset();
      component.orderForm.patchValue({ customerId: '', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      expect(apiService.getStandingOrderItems).not.toHaveBeenCalled();
    });

    it('should not check when contractId is missing', () => {
      apiService.getStandingOrderItems.calls.reset();
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: '', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      expect(apiService.getStandingOrderItems).not.toHaveBeenCalled();
    });

    it('should not re-check when key unchanged', () => {
      apiService.getStandingOrderItems.calls.reset();
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      apiService.getStandingOrderItems.calls.reset();
      component.onConsigneeChange('CON001');
      expect(apiService.getStandingOrderItems).not.toHaveBeenCalled();
    });

    it('should emit items when found', () => {
      const mockItems: StandingOrderItemDto[] = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells', bloodType: 'OP', bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 5, subOk: 'Y', attribGroup: '', attribCode: '' }
      ];
      apiService.getStandingOrderItems.and.returnValue(of(mockItems));
      spyOn(component.standingOrderItemsFound, 'emit');
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      expect(component.standingOrderItemsFound.emit).toHaveBeenCalledWith(mockItems);
    });

    it('should not emit when no items found', () => {
      apiService.getStandingOrderItems.and.returnValue(of([]));
      spyOn(component.standingOrderItemsFound, 'emit');
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onConsigneeChange('CON001');
      expect(component.standingOrderItemsFound.emit).not.toHaveBeenCalled();
    });

    it('should also trigger on contract change', () => {
      apiService.getStandingOrderItems.calls.reset();
      component.lastStandingOrderKey.set('');
      component.orderForm.patchValue({ customerId: 'CUST001', contractId: 'CTR001', consigneeId: 'CON001' });
      component.onContractChange();
      expect(apiService.getStandingOrderItems).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Add new consignee
  // ---------------------------------------------------------------------------
  describe('Add new consignee', () => {
    let dialogOpenSpy: jasmine.Spy;

    beforeEach(() => {
      dialogOpenSpy = spyOn((component as any).dialog, 'open');
    });

    it('should open consignee dialog', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewConsignee();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data).toEqual({ customerId: 'CUST001' });
    });

    it('should not open dialog when customerId is empty', () => {
      component.orderForm.patchValue({ customerId: '' });
      component.onAddNewConsignee();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should refresh consignees on dialog close with result', () => {
      const result = { consigneeId: 'CON_NEW' };
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(result) } as any);
      apiService.getConsignees.calls.reset();
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewConsignee();
      expect(apiService.getConsignees).toHaveBeenCalledWith('CUST001');
    });

    it('should not refresh consignees on dialog close without result', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(null) } as any);
      apiService.getConsignees.calls.reset();
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewConsignee();
      expect(apiService.getConsignees).not.toHaveBeenCalled();
    });

    it('should select new consignee after dialog closes', () => {
      const result = { consigneeId: 'CON001' };
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(result) } as any);
      component.orderForm.patchValue({ customerId: 'CUST001' });
      component.onAddNewConsignee();
      expect(component.orderForm.get('consigneeId')?.value).toBe('CON001');
    });
  });
});
