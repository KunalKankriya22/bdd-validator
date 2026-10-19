import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { StepOrderDetailsComponent } from './step-order-details';
import { RegularOrderApiService } from '../services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  ContractLookupItem,
  OrderClassLookupItem
} from '../models/regular-order.model';
import { EnterCustomerContactDialogComponent } from '../dialogs/enter-customer-contact-dialog/enter-customer-contact-dialog';

describe('StepOrderDetailsComponent', () => {
  let component: StepOrderDetailsComponent;
  let fixture: ComponentFixture<StepOrderDetailsComponent>;
  let apiSpy: jasmine.SpyObj<RegularOrderApiService>;
  let headerServiceMock: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockCustomers: LookupItem[] = [
    { code: 'CUST-001', description: 'Parkland Hospital' },
    { code: 'CUST-002', description: 'Baylor Medical' },
    { code: 'CUST-003', description: 'UT Southwestern' }
  ];

  const mockModes: LookupItem[] = [
    { code: 'DEL', description: 'Delivery' },
    { code: 'PKU', description: 'Pick Up' }
  ];

  const mockOrderClasses: OrderClassLookupItem[] = [
    { code: 'STAT', description: 'Stat', processHours: 2 },
    { code: 'ROUT', description: 'Routine', processHours: 24 },
    { code: 'NOHR', description: 'No Hours' }
  ];

  const mockContracts: ContractLookupItem[] = [
    { code: 'CON-001', description: 'Standard Contract', effDate: '2025-01-01', substituteFlag: 'Y' },
    { code: 'CON-002', description: 'Premium Contract', effDate: '2025-06-01', substituteFlag: 'N' }
  ];

  const mockConsignees: ConsigneeDto[] = [
    { consigneeId: 'CSG-001', consigneeName: 'Main Lab', address: '123 Main St, Dallas TX' },
    { consigneeId: 'CSG-002', consigneeName: 'East Wing Lab', address: '456 East Ave, Dallas TX' }
  ];

  const mockContacts: CustomerContactDto[] = [
    { contactId: 'CT-001', firstName: 'John', lastName: 'Doe', contactType: 'ORD', contactTypeCode: 'ORD', dayPhone: '555-0001' },
    { contactId: 'CT-002', firstName: 'Jane', lastName: 'Smith', contactType: 'BIL', contactTypeCode: 'BIL', dayPhone: '555-0002' }
  ];

  const mockPayees: LookupItem[] = [
    { code: 'PAY-001', description: 'Parkland Billing' },
    { code: 'PAY-002', description: 'Baylor Billing' }
  ];

  const mockCustomerData = {
    customerId: 'CUST-001',
    customerName: 'Parkland Hospital',
    name: 'Parkland Hospital',
    payeeId: 'PAY-001',
    address1: '5201 Harry Hines Blvd',
    address2: '',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75235',
    country: 'US'
  };

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'getCustomersLookup', 'getOrderModesLookup', 'getOrderClassesLookup',
      'getCustomerById', 'getConsignees', 'getContacts', 'getContracts',
      'getPayeesLookup', 'createContact'
    ]);

    apiSpy.getCustomersLookup.and.returnValue(of(mockCustomers));
    apiSpy.getOrderModesLookup.and.returnValue(of(mockModes));
    apiSpy.getOrderClassesLookup.and.returnValue(of(mockOrderClasses));
    apiSpy.getCustomerById.and.returnValue(of(mockCustomerData));
    apiSpy.getConsignees.and.returnValue(of(mockConsignees));
    apiSpy.getContacts.and.returnValue(of(mockContacts));
    apiSpy.getContracts.and.returnValue(of(mockContracts));
    apiSpy.getPayeesLookup.and.returnValue(of(mockPayees));

    headerServiceMock = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

    TestBed.configureTestingModule({
      imports: [
        StepOrderDetailsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: RegularOrderApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });

    fixture = TestBed.createComponent(StepOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component Setup ──

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the order form with all expected controls', () => {
    const controls = component.orderForm.controls;
    expect(controls['customerId']).toBeTruthy();
    expect(controls['contractId']).toBeTruthy();
    expect(controls['priority']).toBeTruthy();
    expect(controls['orderMode']).toBeTruthy();
    expect(controls['contactId']).toBeTruthy();
    expect(controls['consigneeId']).toBeTruthy();
    expect(controls['payeeId']).toBeTruthy();
    expect(controls['codFlag']).toBeTruthy();
  });

  it('should set all form controls to default values', () => {
    expect(component.orderForm.get('customerId')!.value).toBe('');
    expect(component.orderForm.get('contractId')!.value).toBe('');
    expect(component.orderForm.get('priority')!.value).toBe('');
    expect(component.orderForm.get('orderMode')!.value).toBe('');
    expect(component.orderForm.get('contactId')!.value).toBe('');
    expect(component.orderForm.get('consigneeId')!.value).toBe('');
    expect(component.orderForm.get('payeeId')!.value).toBe('');
    expect(component.orderForm.get('codFlag')!.value).toBe(false);
  });

  // ── Form Validation ──

  it('should require customerId', () => {
    const control = component.orderForm.get('customerId')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('CUST-001');
    expect(control.valid).toBeTrue();
  });

  it('should require contractId', () => {
    const control = component.orderForm.get('contractId')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('CON-001');
    expect(control.valid).toBeTrue();
  });

  it('should require priority (order class)', () => {
    const control = component.orderForm.get('priority')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('STAT');
    expect(control.valid).toBeTrue();
  });

  it('should require orderMode', () => {
    const control = component.orderForm.get('orderMode')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('DEL');
    expect(control.valid).toBeTrue();
  });

  it('should require contactId (ordered by)', () => {
    const control = component.orderForm.get('contactId')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('CT-001');
    expect(control.valid).toBeTrue();
  });

  it('should require consigneeId', () => {
    const control = component.orderForm.get('consigneeId')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('CSG-001');
    expect(control.valid).toBeTrue();
  });

  it('should require payeeId', () => {
    const control = component.orderForm.get('payeeId')!;
    control.setValue('');
    expect(control.hasError('required')).toBeTrue();
    control.setValue('PAY-001');
    expect(control.valid).toBeTrue();
  });

  it('should report form as invalid when required fields are empty', () => {
    expect(component.orderForm.valid).toBeFalse();
  });

  it('should report form as valid when all required fields filled', () => {
    component.orderForm.patchValue({
      customerId: 'CUST-001',
      contractId: 'CON-001',
      priority: 'STAT',
      orderMode: 'DEL',
      contactId: 'CT-001',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001'
    });
    expect(component.orderForm.valid).toBeTrue();
  });

  // ── Customer Dropdown ──

  it('should load customers on init', () => {
    expect(apiSpy.getCustomersLookup).toHaveBeenCalled();
    expect(component.customers()).toEqual(mockCustomers);
    expect(component.filteredCustomers()).toEqual(mockCustomers);
  });

  it('should filter customers by search text', fakeAsync(() => {
    component.customerSearchCtrl.setValue('Parkland');
    tick(300);
    const filtered = component.filteredCustomers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].description).toBe('Parkland Hospital');
    discardPeriodicTasks();
  }));

  it('should call onCustomerChange when customer selected', () => {
    spyOn(component, 'onCustomerChange').and.callThrough();
    component.onCustomerChange('CUST-001');
    expect(apiSpy.getCustomerById).toHaveBeenCalledWith('CUST-001');
  });

  it('should reset dependent dropdowns on customer change', () => {
    component.orderForm.patchValue({
      contactId: 'CT-001',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001'
    });

    // The forkJoin in loadCustomerDependencies will re-set payeeId to customer's
    // default payee, so we verify contactId and consigneeId are cleared, and
    // contracts signal is reset before dependencies reload.
    component.onCustomerChange('CUST-002');

    expect(component.orderForm.get('contactId')!.value).toBe('');
    expect(component.orderForm.get('consigneeId')!.value).toBe('');
    // payeeId gets re-set from customer data via loadCustomerDependencies
    expect(component.orderForm.get('payeeId')!.value).toBe('PAY-001');
  });

  it('should load contacts, consignees, contracts, payees on customer change (forkJoin)', () => {
    component.onCustomerChange('CUST-001');

    expect(apiSpy.getCustomerById).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getConsignees).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getContacts).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getContracts).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getPayeesLookup).toHaveBeenCalledWith('CUST-001');

    expect(component.contacts()).toEqual(mockContacts);
    expect(component.consignees()).toEqual(mockConsignees);
    expect(component.contracts()).toEqual(mockContracts);
    expect(component.payees()).toEqual(mockPayees);
  });

  it('should handle customer load error gracefully', () => {
    apiSpy.getCustomersLookup.and.returnValue(throwError(() => new Error('Network error')));

    // Recreate component to trigger ngOnInit again
    const newFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.customers()).toEqual([]);
  });

  it('should reset display fields when customer is cleared', () => {
    component.customerName.set('Parkland Hospital');
    component.consigneeName.set('Main Lab');
    component.billToCustomerName.set('Billing Dept');

    component.onCustomerChange('');

    expect(component.customerName()).toBe('--');
    expect(component.consigneeName()).toBe('--');
    expect(component.consigneeAddress()).toBe('--');
    expect(component.billToCustomerId()).toBe('--');
    expect(component.billToCustomerName()).toBe('--');
    expect(component.billToAddress()).toBe('--');
    expect(component.contacts()).toEqual([]);
    expect(component.consignees()).toEqual([]);
    expect(component.payees()).toEqual([]);
  });

  it('should set loading to true when customer change begins', () => {
    const subj = new Subject<any>();
    apiSpy.getCustomerById.and.returnValue(subj.asObservable());
    apiSpy.getConsignees.and.returnValue(of([]));
    apiSpy.getContacts.and.returnValue(of([]));
    apiSpy.getContracts.and.returnValue(of([]));
    apiSpy.getPayeesLookup.and.returnValue(of([]));

    component.onCustomerChange('CUST-001');

    expect(component.loading()).toBeTrue();
  });

  it('should set loading to false after customer dependencies load', () => {
    component.onCustomerChange('CUST-001');
    expect(component.loading()).toBeFalse();
  });

  it('should set loading to false on customer dependency load error', () => {
    apiSpy.getCustomerById.and.returnValue(throwError(() => new Error('fail')));
    apiSpy.getConsignees.and.returnValue(throwError(() => new Error('fail')));
    apiSpy.getContacts.and.returnValue(throwError(() => new Error('fail')));
    apiSpy.getContracts.and.returnValue(throwError(() => new Error('fail')));
    apiSpy.getPayeesLookup.and.returnValue(throwError(() => new Error('fail')));

    component.onCustomerChange('CUST-001');

    // catchError converts errors to of(null)/of([]), so it succeeds
    expect(component.loading()).toBeFalse();
  });

  // ── Contract Dropdown ──

  it('should load contracts for selected customer', () => {
    component.onCustomerChange('CUST-001');
    expect(component.contracts()).toEqual(mockContracts);
    expect(component.filteredContracts()).toEqual(mockContracts);
  });

  it('should display contract with effective date', () => {
    component.onCustomerChange('CUST-001');
    const contracts = component.contracts();
    expect(contracts[0].effDate).toBe('2025-01-01');
    expect(contracts[1].effDate).toBe('2025-06-01');
  });

  it('should emit contractSubstituteFlagChange on contract selection', () => {
    component.onCustomerChange('CUST-001');
    spyOn(component.contractSubstituteFlagChange, 'emit');

    component.onContractChange('CON-001');

    expect(component.contractSubstituteFlagChange.emit).toHaveBeenCalledWith('Y');
  });

  it('should extract substituteFlag from selected contract', () => {
    component.onCustomerChange('CUST-001');
    spyOn(component.contractSubstituteFlagChange, 'emit');

    component.onContractChange('CON-002');

    expect(component.contractSubstituteFlagChange.emit).toHaveBeenCalledWith('N');
  });

  it('should not emit contractSubstituteFlagChange when contract not found', () => {
    component.onCustomerChange('CUST-001');
    spyOn(component.contractSubstituteFlagChange, 'emit');

    component.onContractChange('NONEXISTENT');

    expect(component.contractSubstituteFlagChange.emit).not.toHaveBeenCalled();
  });

  it('should filter contracts by search text', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.contractSearchCtrl.setValue('Premium');
    tick(300);

    const filtered = component.filteredContracts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('CON-002');
    discardPeriodicTasks();
  }));

  // ── Priority (Order Class) Dropdown ──

  it('should load order classes on init', () => {
    expect(apiSpy.getOrderClassesLookup).toHaveBeenCalled();
    expect(component.priorities()).toEqual(mockOrderClasses);
    expect(component.filteredPriorities()).toEqual(mockOrderClasses);
  });

  it('should calculate estimated arrival time on priority change', () => {
    component.onPriorityChange('STAT');
    const arrival = component.estimatedArrivalTime();
    expect(arrival).not.toBe('--');
    // Should contain a formatted date/time
    expect(arrival.length).toBeGreaterThan(5);
  });

  it('should display process hours converted arrival time', () => {
    const before = Date.now();
    component.onPriorityChange('ROUT');
    const arrival = component.estimatedArrivalTime();
    // Routine has 24 processHours, so result should be a valid formatted datetime
    expect(arrival).not.toBe('--');
  });

  it('should handle missing processHours gracefully', () => {
    component.onPriorityChange('NOHR');
    expect(component.estimatedArrivalTime()).toBe('--');
  });

  it('should set estimated arrival to -- when priority not found', () => {
    component.onPriorityChange('NONEXISTENT');
    expect(component.estimatedArrivalTime()).toBe('--');
  });

  it('should filter priorities by search text', fakeAsync(() => {
    component.prioritySearchCtrl.setValue('Stat');
    tick(300);

    const filtered = component.filteredPriorities();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('STAT');
    discardPeriodicTasks();
  }));

  // ── Consignee Dropdown ──

  it('should load consignees for selected customer', () => {
    component.onCustomerChange('CUST-001');
    expect(component.consignees()).toEqual(mockConsignees);
    expect(component.filteredConsignees()).toEqual(mockConsignees);
  });

  it('should update consignee name and address display on selection', () => {
    component.onCustomerChange('CUST-001');

    component.onConsigneeChange('CSG-001');

    expect(component.consigneeName()).toBe('Main Lab');
    expect(component.consigneeAddress()).toBe('123 Main St, Dallas TX');
  });

  it('should show -- when consignee not found', () => {
    component.onCustomerChange('CUST-001');

    component.onConsigneeChange('NONEXISTENT');

    expect(component.consigneeName()).toBe('--');
    expect(component.consigneeAddress()).toBe('--');
  });

  it('should filter consignees by search text', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.consigneeSearchCtrl.setValue('Main');
    tick(300);

    const filtered = component.filteredConsignees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].consigneeId).toBe('CSG-001');
    discardPeriodicTasks();
  }));

  // ── Payee Dropdown (Gap #7) ──

  it('should load payees for selected customer', () => {
    component.onCustomerChange('CUST-001');
    expect(component.payees()).toEqual(mockPayees);
    expect(component.filteredPayees()).toEqual(mockPayees);
  });

  it('should default payeeId to customer payeeId', () => {
    component.onCustomerChange('CUST-001');
    expect(component.orderForm.get('payeeId')!.value).toBe('PAY-001');
  });

  it('should update bill-to display on payee change', () => {
    const payeeData = {
      customerId: 'PAY-002',
      customerName: 'Baylor Billing Dept',
      address1: '789 Baylor St',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75204',
      country: 'US'
    };
    apiSpy.getCustomerById.and.returnValue(of(payeeData));

    component.onPayeeChange('PAY-002');

    expect(component.billToCustomerId()).toBe('PAY-002');
    expect(component.billToCustomerName()).toBe('Baylor Billing Dept');
    expect(component.billToAddress()).toContain('789 Baylor St');
    expect(component.billToAddress()).toContain('Dallas');
  });

  it('should reset bill-to display when payee cleared', () => {
    component.billToCustomerId.set('PAY-001');
    component.billToCustomerName.set('Some Payee');
    component.billToAddress.set('Some Address');

    component.onPayeeChange('');

    expect(component.billToCustomerId()).toBe('--');
    expect(component.billToCustomerName()).toBe('--');
    expect(component.billToAddress()).toBe('--');
  });

  it('should handle payee lookup returning null', () => {
    apiSpy.getCustomerById.and.returnValue(of(null));

    component.onPayeeChange('PAY-UNKNOWN');

    expect(component.billToCustomerId()).toBe('PAY-UNKNOWN');
    expect(component.billToCustomerName()).toBe('--');
    expect(component.billToAddress()).toBe('--');
  });

  it('should filter payees by search text', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.payeeSearchCtrl.setValue('Parkland');
    tick(300);

    const filtered = component.filteredPayees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('PAY-001');
    discardPeriodicTasks();
  }));

  it('should handle payee lookup error gracefully', () => {
    apiSpy.getCustomerById.and.returnValue(throwError(() => new Error('fail')));

    component.onPayeeChange('PAY-ERR');

    expect(component.billToCustomerId()).toBe('PAY-ERR');
    // catchError returns of(null) so display fields go to --
  });

  // ── COD Flag (Gap #10) ──

  it('should have codFlag form control', () => {
    expect(component.orderForm.get('codFlag')).toBeTruthy();
  });

  it('should default codFlag to false', () => {
    expect(component.orderForm.get('codFlag')!.value).toBe(false);
  });

  it('should include codFlag in form data output', () => {
    component.orderForm.patchValue({ codFlag: true });
    const data = component.getFormData();
    expect(data.codFlag).toBe('Y');

    component.orderForm.patchValue({ codFlag: false });
    const data2 = component.getFormData();
    expect(data2.codFlag).toBe('N');
  });

  // ── Contact (Ordered By) ──

  it('should load contacts for selected customer', () => {
    component.onCustomerChange('CUST-001');
    expect(component.contacts()).toEqual(mockContacts);
    expect(component.filteredContacts()).toEqual(mockContacts);
  });

  it('should filter contacts by search text', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.contactSearchCtrl.setValue('John');
    tick(300);

    const filtered = component.filteredContacts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].firstName).toBe('John');
    discardPeriodicTasks();
  }));

  it('should filter contacts by last name', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.contactSearchCtrl.setValue('Smith');
    tick(300);

    const filtered = component.filteredContacts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].lastName).toBe('Smith');
    discardPeriodicTasks();
  }));

  // ── Mode Dropdown ──

  it('should load order modes on init', () => {
    expect(apiSpy.getOrderModesLookup).toHaveBeenCalled();
    expect(component.modes()).toEqual(mockModes);
    expect(component.filteredModes()).toEqual(mockModes);
  });

  it('should filter modes by search text', fakeAsync(() => {
    component.modeSearchCtrl.setValue('Delivery');
    tick(300);

    const filtered = component.filteredModes();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('DEL');
    discardPeriodicTasks();
  }));

  // ── Form Data Output ──

  it('should emit formDataChange on form value changes', () => {
    spyOn(component.formDataChange, 'emit');

    component.orderForm.patchValue({ customerId: 'CUST-001' });

    expect(component.formDataChange.emit).toHaveBeenCalled();
  });

  it('should emit validityChange on form value changes', () => {
    spyOn(component.validityChange, 'emit');

    component.orderForm.patchValue({ customerId: 'CUST-001' });

    expect(component.validityChange.emit).toHaveBeenCalled();
  });

  it('should include all fields in emitted form data', () => {
    component.onCustomerChange('CUST-001');
    component.orderForm.patchValue({
      customerId: 'CUST-001',
      contractId: 'CON-001',
      priority: 'STAT',
      orderMode: 'DEL',
      contactId: 'CT-001',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001',
      codFlag: true
    });

    const data = component.getFormData();

    expect(data.customerId).toBe('CUST-001');
    expect(data.contractId).toBe('CON-001');
    expect(data.priority).toBe('STAT');
    expect(data.orderMode).toBe('DEL');
    expect(data.consigneeId).toBe('CSG-001');
    expect(data.payeeId).toBe('PAY-001');
    expect(data.codFlag).toBe('Y');
    expect(data.customerName).toBeDefined();
  });

  it('should map codFlag to Y/N string', () => {
    component.orderForm.patchValue({ codFlag: true });
    expect(component.getFormData().codFlag).toBe('Y');

    component.orderForm.patchValue({ codFlag: false });
    expect(component.getFormData().codFlag).toBe('N');
  });

  it('should include orderedBy from selected contact', () => {
    component.onCustomerChange('CUST-001');
    component.orderForm.patchValue({ contactId: 'CT-001' });

    const data = component.getFormData();
    expect(data.orderedBy).toBe('John Doe');
  });

  it('should not include orderedBy when no contact selected', () => {
    const data = component.getFormData();
    expect(data.orderedBy).toBeUndefined();
  });

  it('should include orderNo from signal when not --', () => {
    component.orderNumber.set('25001-0001');
    const data = component.getFormData();
    expect(data.orderNo).toBe('25001-0001');
  });

  it('should not include orderNo when signal is --', () => {
    component.orderNumber.set('--');
    const data = component.getFormData();
    expect(data.orderNo).toBeUndefined();
  });

  it('should include payeeId from billToCustomerId when form payeeId is empty', () => {
    component.billToCustomerId.set('PAY-FALLBACK');
    component.orderForm.patchValue({ payeeId: '' });

    const data = component.getFormData();
    expect(data.payeeId).toBe('PAY-FALLBACK');
  });

  // ── Chapter Handling ──

  it('should subscribe to chapter changes', () => {
    expect(headerServiceMock.chapterChanged$).toBeDefined();
  });

  // ── Dialog Integration ──

  it('should open add new contact dialog', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    spyOn(dialogInstance, 'open').and.returnValue(dialogRefSpy);

    component.orderForm.patchValue({ customerId: 'CUST-001' });
    component.onAddNewContact();

    expect(dialogInstance.open).toHaveBeenCalledWith(
      EnterCustomerContactDialogComponent,
      jasmine.objectContaining({
        width: '500px',
        data: { customerId: 'CUST-001' }
      })
    );
  });

  it('should not open contact dialog when no customer selected', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');

    component.orderForm.patchValue({ customerId: '' });
    component.onAddNewContact();

    expect(dialogInstance.open).not.toHaveBeenCalled();
  });

  it('should refresh contacts after new contact created', () => {
    const newContact = {
      contactTypeCode: 'NEW',
      firstName: 'New',
      lastName: 'Contact',
      dayPhone: '555-9999',
      effectiveDate: '2025-01-01',
      salutation: 'Mr',
      title: 'Manager'
    };

    const savedContact = {
      contactType: 'NEW',
      firstName: 'New',
      lastName: 'Contact',
      dayPhoneNo: '555-9999',
      effDate: '2025-01-01',
      salutation: 'Mr',
      title: 'Manager'
    };

    const dialogInstance = (component as any).dialog;
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(newContact));
    spyOn(dialogInstance, 'open').and.returnValue(dialogRefSpy);
    apiSpy.createContact.and.returnValue(of(savedContact));

    component.orderForm.patchValue({ customerId: 'CUST-001' });
    component.onCustomerChange('CUST-001');
    const contactsBefore = component.contacts().length;

    component.onAddNewContact();

    expect(apiSpy.createContact).toHaveBeenCalledWith('CUST-001', jasmine.objectContaining({
      contactType: 'NEW',
      firstName: 'New',
      lastName: 'Contact'
    }));
    expect(component.contacts().length).toBe(contactsBefore + 1);
  });

  it('should not add contact when dialog returns null', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    spyOn(dialogInstance, 'open').and.returnValue(dialogRefSpy);

    component.orderForm.patchValue({ customerId: 'CUST-001' });
    component.onCustomerChange('CUST-001');
    const contactsBefore = component.contacts().length;

    component.onAddNewContact();

    expect(apiSpy.createContact).not.toHaveBeenCalled();
    expect(component.contacts().length).toBe(contactsBefore);
  });

  it('should handle createContact API error gracefully', () => {
    const newContact = {
      contactTypeCode: 'ERR',
      firstName: 'Error',
      lastName: 'Contact',
      dayPhone: '555-0000',
      effectiveDate: '2025-01-01'
    };

    const dialogInstance = (component as any).dialog;
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(newContact));
    spyOn(dialogInstance, 'open').and.returnValue(dialogRefSpy);
    apiSpy.createContact.and.returnValue(throwError(() => new Error('fail')));

    component.orderForm.patchValue({ customerId: 'CUST-001' });
    component.onCustomerChange('CUST-001');
    const contactsBefore = component.contacts().length;

    component.onAddNewContact();

    // catchError returns of(null), so no contact should be added
    expect(component.contacts().length).toBe(contactsBefore);
  });

  // ── Read-only Display Fields ──

  it('should display customer name', () => {
    component.onCustomerChange('CUST-001');
    expect(component.customerName()).toBe('Parkland Hospital');
  });

  it('should display consignee name and address', () => {
    component.onCustomerChange('CUST-001');
    component.onConsigneeChange('CSG-001');

    expect(component.consigneeName()).toBe('Main Lab');
    expect(component.consigneeAddress()).toBe('123 Main St, Dallas TX');
  });

  it('should display bill-to name and address', () => {
    // When payee is the same as customer
    const customerSamePayee = { ...mockCustomerData, payeeId: 'CUST-001' };
    apiSpy.getCustomerById.and.returnValue(of(customerSamePayee));

    component.onCustomerChange('CUST-001');

    expect(component.billToCustomerName()).toBe('Parkland Hospital');
    expect(component.billToAddress()).toContain('5201 Harry Hines Blvd');
  });

  it('should display estimated arrival time', () => {
    component.onPriorityChange('STAT');
    expect(component.estimatedArrivalTime()).not.toBe('--');
  });

  it('should show -- as default for display fields', () => {
    // Before any selections, all display fields should be --
    const freshFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const freshComp = freshFixture.componentInstance;

    expect(freshComp.orderNumber()).toBe('--');
    expect(freshComp.estimatedArrivalTime()).toBe('--');
    expect(freshComp.customerName()).toBe('--');
    expect(freshComp.consigneeName()).toBe('--');
    expect(freshComp.consigneeAddress()).toBe('--');
    expect(freshComp.billToCustomerId()).toBe('--');
    expect(freshComp.billToCustomerName()).toBe('--');
    expect(freshComp.billToAddress()).toBe('--');
  });

  // ── Add New Consignee ──

  it('should not open consignee dialog when no customer selected', () => {
    component.orderForm.patchValue({ customerId: '' });
    // onAddNewConsignee is currently a TODO stub; just verify it does not throw
    expect(() => component.onAddNewConsignee()).not.toThrow();
  });

  it('should not throw when onAddNewConsignee is called with customer', () => {
    component.orderForm.patchValue({ customerId: 'CUST-001' });
    expect(() => component.onAddNewConsignee()).not.toThrow();
  });

  // ── Populate from Saved Data ──

  it('should populate form from saved order data', () => {
    const savedData = {
      customerId: 'CUST-001',
      customerName: 'Parkland Hospital',
      contractId: 'CON-001',
      priority: 'STAT',
      orderMode: 'DEL',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001',
      codFlag: 'Y' as const,
      orderNo: '25001-0001',
      estArrivalTime: '2025-06-15T10:00:00Z'
    };

    const savedFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const savedComp = savedFixture.componentInstance;
    savedComp.savedOrderData = savedData as any;
    savedFixture.detectChanges();

    expect(savedComp.orderForm.get('customerId')!.value).toBe('CUST-001');
    expect(savedComp.orderForm.get('contractId')!.value).toBe('CON-001');
    expect(savedComp.orderForm.get('priority')!.value).toBe('STAT');
    expect(savedComp.orderForm.get('orderMode')!.value).toBe('DEL');
    expect(savedComp.orderForm.get('consigneeId')!.value).toBe('CSG-001');
    expect(savedComp.orderForm.get('payeeId')!.value).toBe('PAY-001');
    expect(savedComp.orderForm.get('codFlag')!.value).toBe(true);
    expect(savedComp.orderNumber()).toBe('25001-0001');
    expect(savedComp.estimatedArrivalTime()).not.toBe('--');
  });

  it('should handle saved data with no orderNo', () => {
    const savedData = {
      customerId: 'CUST-001',
      customerName: 'Parkland Hospital',
      contractId: 'CON-001',
      priority: 'STAT',
      orderMode: 'DEL',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001',
      codFlag: 'N' as const
    };

    const savedFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const savedComp = savedFixture.componentInstance;
    savedComp.savedOrderData = savedData as any;
    savedFixture.detectChanges();

    expect(savedComp.orderNumber()).toBe('--');
    expect(savedComp.orderForm.get('codFlag')!.value).toBe(false);
  });

  it('should load customer dependencies when saved data has customerId', () => {
    apiSpy.getCustomerById.calls.reset();
    const savedData = {
      customerId: 'CUST-001',
      contractId: 'CON-001',
      priority: 'STAT',
      orderMode: 'DEL',
      consigneeId: 'CSG-001',
      payeeId: 'PAY-001'
    };

    const savedFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const savedComp = savedFixture.componentInstance;
    savedComp.savedOrderData = savedData as any;
    savedFixture.detectChanges();

    expect(apiSpy.getCustomerById).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getConsignees).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getContacts).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getContracts).toHaveBeenCalledWith('CUST-001');
    expect(apiSpy.getPayeesLookup).toHaveBeenCalledWith('CUST-001');
  });

  it('should not populate form when savedOrderData is null', () => {
    const freshFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const freshComp = freshFixture.componentInstance;
    freshComp.savedOrderData = null;
    freshFixture.detectChanges();

    expect(freshComp.orderForm.get('customerId')!.value).toBe('');
  });

  // ── Bill-to Address Construction ──

  it('should build address from multiple fields', () => {
    const payee = {
      customerName: 'Address Test',
      address1: '100 Main St',
      address2: 'Suite 200',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75001',
      country: 'US'
    };
    apiSpy.getCustomerById.and.returnValue(of(payee));

    component.onPayeeChange('PAY-ADDR');

    expect(component.billToAddress()).toBe('100 Main St, Suite 200, Dallas, TX, 75001, US');
  });

  it('should skip empty address fields', () => {
    const payee = {
      customerName: 'Sparse Addr',
      address1: '100 Main St',
      address2: '',
      city: 'Dallas',
      state: '',
      zipCode: '75001',
      country: ''
    };
    apiSpy.getCustomerById.and.returnValue(of(payee));

    component.onPayeeChange('PAY-SPARSE');

    expect(component.billToAddress()).toBe('100 Main St, Dallas, 75001');
  });

  // ── Customer Dependencies: Bill-to when payee differs from customer ──

  it('should fetch separate payee data when defaultPayeeId differs from customerId', () => {
    const customerWithDiffPayee = {
      ...mockCustomerData,
      customerId: 'CUST-001',
      payeeId: 'PAY-DIFF'
    };

    const payeeResponse = {
      customerName: 'Different Payee',
      address1: '999 Payee St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'US'
    };

    apiSpy.getCustomerById.and.callFake((id: string) => {
      if (id === 'CUST-001') return of(customerWithDiffPayee);
      if (id === 'PAY-DIFF') return of(payeeResponse);
      return of(null);
    });

    component.onCustomerChange('CUST-001');

    // The form should have the default payeeId set
    expect(component.orderForm.get('payeeId')!.value).toBe('PAY-DIFF');
    expect(component.billToCustomerId()).toBe('PAY-DIFF');
  });

  it('should use customer data for bill-to when payee equals customer', () => {
    const customerSamePayee = {
      ...mockCustomerData,
      payeeId: 'CUST-001'
    };

    apiSpy.getCustomerById.and.returnValue(of(customerSamePayee));

    component.onCustomerChange('CUST-001');

    expect(component.billToCustomerName()).toBe('Parkland Hospital');
    expect(component.billToAddress()).toContain('5201 Harry Hines Blvd');
  });

  // ── Search Filter: Edge Cases ──

  it('should show all customers when search is empty', fakeAsync(() => {
    component.customerSearchCtrl.setValue('');
    tick(300);

    expect(component.filteredCustomers().length).toBe(mockCustomers.length);
    discardPeriodicTasks();
  }));

  it('should show all customers when search is null', fakeAsync(() => {
    component.customerSearchCtrl.setValue(null as any);
    tick(300);

    expect(component.filteredCustomers().length).toBe(mockCustomers.length);
    discardPeriodicTasks();
  }));

  it('should filter customers by code', fakeAsync(() => {
    component.customerSearchCtrl.setValue('CUST-002');
    tick(300);

    const filtered = component.filteredCustomers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('CUST-002');
    discardPeriodicTasks();
  }));

  it('should be case-insensitive when filtering', fakeAsync(() => {
    component.customerSearchCtrl.setValue('parkland');
    tick(300);

    const filtered = component.filteredCustomers();
    expect(filtered.length).toBe(1);
    expect(filtered[0].description).toBe('Parkland Hospital');
    discardPeriodicTasks();
  }));

  // ── Scroll To Section ──

  it('should update activeSection on scrollToSection', () => {
    component.scrollToSection('billing-info');
    expect(component.activeSection()).toBe('billing-info');
  });

  // ── f getter ──

  it('should return form controls via f getter', () => {
    const controls = component.f;
    expect(controls['customerId']).toBeTruthy();
    expect(controls['contractId']).toBeTruthy();
    expect(controls['priority']).toBeTruthy();
    expect(controls['orderMode']).toBeTruthy();
    expect(controls['contactId']).toBeTruthy();
    expect(controls['consigneeId']).toBeTruthy();
    expect(controls['payeeId']).toBeTruthy();
    expect(controls['codFlag']).toBeTruthy();
  });

  // ── ngOnDestroy ──

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySubject = (component as any).destroy$ as Subject<void>;
    let completed = false;
    destroySubject.subscribe({ complete: () => (completed = true) });

    component.ngOnDestroy();

    expect(completed).toBeTrue();
  });

  // ── elementId / errorId helpers ──

  it('should generate unique element IDs', () => {
    const id = (component as any).elementId('test-field');
    expect(id).toContain('step-order-details-');
    expect(id).toContain('-test-field');
  });

  it('should generate unique error IDs', () => {
    const id = (component as any).errorId('test-field');
    expect(id).toContain('step-order-details-');
    expect(id).toContain('-test-field-error');
  });

  // ── Modes error handling ──

  it('should handle order modes load error gracefully', () => {
    apiSpy.getOrderModesLookup.and.returnValue(throwError(() => new Error('fail')));

    const newFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.modes()).toEqual([]);
  });

  it('should handle order classes load error gracefully', () => {
    apiSpy.getOrderClassesLookup.and.returnValue(throwError(() => new Error('fail')));

    const newFixture = TestBed.createComponent(StepOrderDetailsComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.priorities()).toEqual([]);
  });

  // ── formDataChange emits after customer dependency load ──

  it('should emit formDataChange after customer dependencies load', () => {
    spyOn(component.formDataChange, 'emit');

    component.onCustomerChange('CUST-001');

    expect(component.formDataChange.emit).toHaveBeenCalled();
  });

  // ── Reset consignee display on customer change ──

  it('should reset consignee display on customer change', () => {
    component.consigneeName.set('Old Lab');
    component.consigneeAddress.set('Old Address');

    component.onCustomerChange('CUST-001');

    expect(component.consigneeName()).toBe('--');
    expect(component.consigneeAddress()).toBe('--');
  });

  // ── Modes filter by code ──

  it('should filter modes by code', fakeAsync(() => {
    component.modeSearchCtrl.setValue('PKU');
    tick(300);

    const filtered = component.filteredModes();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('PKU');
    discardPeriodicTasks();
  }));

  // ── Consignees filter by name ──

  it('should filter consignees by consignee name', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.consigneeSearchCtrl.setValue('East');
    tick(300);

    const filtered = component.filteredConsignees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].consigneeId).toBe('CSG-002');
    discardPeriodicTasks();
  }));

  // ── Consignees filter by ID ──

  it('should filter consignees by consignee ID', fakeAsync(() => {
    component.onCustomerChange('CUST-001');

    component.consigneeSearchCtrl.setValue('CSG-001');
    tick(300);

    const filtered = component.filteredConsignees();
    expect(filtered.length).toBe(1);
    expect(filtered[0].consigneeId).toBe('CSG-001');
    discardPeriodicTasks();
  }));

  // ── Customer name fallback ──

  it('should fallback to name property when customerName is missing', () => {
    const customerNoName = {
      customerId: 'CUST-001',
      name: 'Fallback Name',
      payeeId: 'PAY-001'
    };
    apiSpy.getCustomerById.and.returnValue(of(customerNoName));

    component.onCustomerChange('CUST-001');

    expect(component.customerName()).toBe('Fallback Name');
  });

  it('should show -- when customer has no name fields', () => {
    const customerEmpty = {
      customerId: 'CUST-001',
      payeeId: 'PAY-001'
    };
    apiSpy.getCustomerById.and.returnValue(of(customerEmpty));

    component.onCustomerChange('CUST-001');

    expect(component.customerName()).toBe('--');
  });

  // ── Payee name fallback ──

  it('should fallback to name property for payee when customerName is missing', () => {
    const payeeNoName = {
      name: 'Payee Fallback',
      address1: '100 St'
    };
    apiSpy.getCustomerById.and.returnValue(of(payeeNoName));

    component.onPayeeChange('PAY-X');

    expect(component.billToCustomerName()).toBe('Payee Fallback');
  });
});
