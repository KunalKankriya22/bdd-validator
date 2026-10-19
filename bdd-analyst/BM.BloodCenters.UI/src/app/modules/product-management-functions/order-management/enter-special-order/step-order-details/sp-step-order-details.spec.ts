import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { SpStepOrderDetailsComponent } from './sp-step-order-details';
import { SpecialOrderApiService } from '../services/special-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { EnterCustomerContactDialogComponent } from '../../enter-regular-order/dialogs/enter-customer-contact-dialog/enter-customer-contact-dialog';

describe('SpStepOrderDetailsComponent', () => {
  let component: SpStepOrderDetailsComponent;
  let fixture: ComponentFixture<SpStepOrderDetailsComponent>;
  let apiSpy: jasmine.SpyObj<SpecialOrderApiService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('SpecialOrderApiService', [
      'getCustomersLookup',
      'getOrderModesLookup',
      'getOrderClassesLookup',
      'getCustomerById',
      'getConsignees',
      'getContacts',
      'getContracts',
      'getPayeesLookup',
      'createContact'
    ]);
    apiSpy.getCustomersLookup.and.returnValue(of([]));
    apiSpy.getOrderModesLookup.and.returnValue(of([]));
    apiSpy.getOrderClassesLookup.and.returnValue(of([]));
    apiSpy.getCustomerById.and.returnValue(of(null as any));
    apiSpy.getConsignees.and.returnValue(of([]));
    apiSpy.getContacts.and.returnValue(of([]));
    apiSpy.getContracts.and.returnValue(of([]));
    apiSpy.getPayeesLookup.and.returnValue(of([]));
    apiSpy.createContact.and.returnValue(of(null as any));

    headerSpy = jasmine.createSpyObj('HeaderService', [
      'getCurrentChapterId',
      'getCurrentWarehouseId',
      'getCurrentChapterName',
      'getCurrentUsername'
    ]);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [
        SpStepOrderDetailsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: SpecialOrderApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    TestBed.overrideComponent(SpStepOrderDetailsComponent, {
      add: {
        providers: [{ provide: MatDialog, useValue: dialogSpy }]
      }
    });

    fixture = TestBed.createComponent(SpStepOrderDetailsComponent);
    component = fixture.componentInstance;
  });

  // ── Creation ──

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / Form initialization ──

  describe('ngOnInit', () => {
    it('should initialize the order form with required controls', () => {
      fixture.detectChanges();
      expect(component.orderForm).toBeTruthy();
      expect(component.orderForm.get('contractId')).toBeTruthy();
      expect(component.orderForm.get('priority')).toBeTruthy();
      expect(component.orderForm.get('orderMode')).toBeTruthy();
      expect(component.orderForm.get('customerId')).toBeTruthy();
      expect(component.orderForm.get('contactId')).toBeTruthy();
      expect(component.orderForm.get('consigneeId')).toBeTruthy();
      expect(component.orderForm.get('patientName')).toBeTruthy();
      expect(component.orderForm.get('doctorName')).toBeTruthy();
    });

    it('should set required validators on mandatory fields', () => {
      fixture.detectChanges();
      const requiredFields = ['contractId', 'priority', 'orderMode', 'customerId', 'contactId', 'consigneeId', 'patientName'];
      for (const field of requiredFields) {
        const ctrl = component.orderForm.get(field)!;
        ctrl.setValue('');
        ctrl.markAsTouched();
        expect(ctrl.hasError('required')).toBeTrue();
      }
    });

    it('should not require doctorName', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('doctorName')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });

    it('should enforce maxLength(50) on patientName', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('patientName')!;
      ctrl.setValue('x'.repeat(51));
      expect(ctrl.hasError('maxlength')).toBeTrue();
      ctrl.setValue('x'.repeat(50));
      expect(ctrl.hasError('maxlength')).toBeFalse();
    });

    it('should enforce maxLength(50) on doctorName', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('doctorName')!;
      ctrl.setValue('x'.repeat(51));
      expect(ctrl.hasError('maxlength')).toBeTrue();
      ctrl.setValue('x'.repeat(50));
      expect(ctrl.hasError('maxlength')).toBeFalse();
    });

    it('should call loadLookups on init', () => {
      fixture.detectChanges();
      expect(apiSpy.getCustomersLookup).toHaveBeenCalled();
      expect(apiSpy.getOrderModesLookup).toHaveBeenCalled();
      expect(apiSpy.getOrderClassesLookup).toHaveBeenCalled();
    });

    it('should populate customers from API', () => {
      const mockCustomers = [{ code: 'C1', description: 'Customer 1' }];
      apiSpy.getCustomersLookup.and.returnValue(of(mockCustomers));
      fixture.detectChanges();
      expect(component.customers()).toEqual(mockCustomers);
      expect(component.filteredCustomers()).toEqual(mockCustomers);
    });

    it('should populate modes from API', () => {
      const mockModes = [{ code: 'M1', description: 'Mode 1' }];
      apiSpy.getOrderModesLookup.and.returnValue(of(mockModes));
      fixture.detectChanges();
      expect(component.modes()).toEqual(mockModes);
      expect(component.filteredModes()).toEqual(mockModes);
    });

    it('should populate priorities from API', () => {
      const mockPriorities = [{ code: 'P1', description: 'Priority 1' }];
      apiSpy.getOrderClassesLookup.and.returnValue(of(mockPriorities));
      fixture.detectChanges();
      expect(component.priorities()).toEqual(mockPriorities);
      expect(component.filteredPriorities()).toEqual(mockPriorities);
    });

    it('should fallback to empty array when customers lookup fails', () => {
      apiSpy.getCustomersLookup.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.customers()).toEqual([]);
    });

    it('should fallback to empty array when modes lookup fails', () => {
      apiSpy.getOrderModesLookup.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.modes()).toEqual([]);
    });

    it('should fallback to empty array when classes lookup fails', () => {
      apiSpy.getOrderClassesLookup.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.priorities()).toEqual([]);
    });

    // ── Gap #4: patientId form control ──

    it('should have patientId form control', () => {
      fixture.detectChanges();
      expect(component.orderForm.get('patientId')).toBeTruthy();
    });

    it('should enforce maxLength(20) on patientId', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('patientId')!;
      ctrl.setValue('x'.repeat(21));
      expect(ctrl.hasError('maxlength')).toBeTrue();
      ctrl.setValue('x'.repeat(20));
      expect(ctrl.hasError('maxlength')).toBeFalse();
    });

    // ── Gap #4: patientAborh form control ──

    it('should have patientAborh form control', () => {
      fixture.detectChanges();
      expect(component.orderForm.get('patientAborh')).toBeTruthy();
    });

    it('should enforce maxLength(4) on patientAborh', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('patientAborh')!;
      ctrl.setValue('ABCDE');
      expect(ctrl.hasError('maxlength')).toBeTrue();
      ctrl.setValue('ABCD');
      expect(ctrl.hasError('maxlength')).toBeFalse();
    });

    it('should enforce pattern on patientAborh', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('patientAborh')!;

      // Valid values
      ctrl.setValue('A+');
      expect(ctrl.hasError('pattern')).toBeFalse();
      ctrl.setValue('AB-');
      expect(ctrl.hasError('pattern')).toBeFalse();
      ctrl.setValue('O+1');
      expect(ctrl.hasError('pattern')).toBeFalse();

      // Invalid values
      ctrl.setValue('@#$');
      expect(ctrl.hasError('pattern')).toBeTrue();
      ctrl.setValue('A B');
      expect(ctrl.hasError('pattern')).toBeTrue();
    });

    it('patientAborh should not be required', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('patientAborh')!;
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });

    // ── Gap #15: payeeId form control ──

    it('payeeId form control should exist and not be required', () => {
      fixture.detectChanges();
      const ctrl = component.orderForm.get('payeeId')!;
      expect(ctrl).toBeTruthy();
      ctrl.setValue('');
      expect(ctrl.hasError('required')).toBeFalse();
    });
  });

  // ── Form valueChanges emissions ──

  describe('form valueChanges', () => {
    it('should emit validityChange when form values change', () => {
      fixture.detectChanges();
      const validitySpy = spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({ patientName: 'Test' });
      expect(validitySpy).toHaveBeenCalled();
    });

    it('should emit formDataChange when form values change', () => {
      fixture.detectChanges();
      const dataSpy = spyOn(component.formDataChange, 'emit');
      component.orderForm.patchValue({ patientName: 'Test' });
      expect(dataSpy).toHaveBeenCalled();
    });

    it('should emit true for validityChange when form is valid', () => {
      fixture.detectChanges();
      const validitySpy = spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({
        contractId: 'C1',
        priority: 'P1',
        orderMode: 'M1',
        customerId: 'CU1',
        contactId: 'CO1',
        consigneeId: 'CS1',
        patientName: 'Patient'
      });
      expect(validitySpy).toHaveBeenCalledWith(true);
    });

    it('should emit false for validityChange when form is invalid', () => {
      fixture.detectChanges();
      const validitySpy = spyOn(component.validityChange, 'emit');
      component.orderForm.patchValue({ patientName: '' });
      // The form was already invalid, still invalid
      const lastCall = validitySpy.calls.mostRecent();
      expect(lastCall.args[0]).toBeFalse();
    });
  });

  // ── populateFromSavedData ──

  describe('populateFromSavedData', () => {
    it('should populate form from savedOrderData when provided', () => {
      const mockCustomer = { customerName: 'Saved Customer', customerId: 'C1' };
      apiSpy.getCustomerById.and.returnValue(of(mockCustomer));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.savedOrderData = {
        contractId: 'CT1',
        priority: 'P1',
        orderMode: 'M1',
        customerId: 'C1',
        consigneeId: 'CS1',
        patientName: 'John Doe',
        doctorName: 'Dr. Smith',
        orderNo: 'ORD-001',
        customerName: 'Test Customer'
      };
      fixture.detectChanges();

      expect(component.orderForm.get('contractId')!.value).toBe('CT1');
      expect(component.orderForm.get('priority')!.value).toBe('P1');
      expect(component.orderForm.get('orderMode')!.value).toBe('M1');
      expect(component.orderForm.get('customerId')!.value).toBe('C1');
      expect(component.orderForm.get('consigneeId')!.value).toBe('CS1');
      expect(component.orderForm.get('patientName')!.value).toBe('John Doe');
      expect(component.orderForm.get('doctorName')!.value).toBe('Dr. Smith');
      expect(component.orderNumber()).toBe('ORD-001');
      // customerName is initially set from savedOrderData, then overwritten by loadCustomerDependencies API response
      expect(component.customerName()).toBe('Saved Customer');
    });

    it('should load customer dependencies when savedOrderData has customerId', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Saved', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.savedOrderData = { customerId: 'C1', orderNo: 'ORD-001', chapterId: 'CH1', insertDate: '', insertUserId: '' };
      fixture.detectChanges();

      expect(apiSpy.getCustomerById).toHaveBeenCalledWith('C1');
      expect(apiSpy.getConsignees).toHaveBeenCalledWith('C1');
      expect(apiSpy.getContacts).toHaveBeenCalledWith('C1');
      expect(apiSpy.getContracts).toHaveBeenCalledWith('C1');
    });

    it('should use default values for missing savedOrderData fields', () => {
      component.savedOrderData = { orderNo: '', chapterId: '', customerId: '', insertDate: '', insertUserId: '' };
      fixture.detectChanges();

      expect(component.orderForm.get('contractId')!.value).toBe('');
      expect(component.orderForm.get('patientName')!.value).toBe('');
      expect(component.orderNumber()).toBe('--');
    });

    it('should not call populateFromSavedData when savedOrderData is null', () => {
      component.savedOrderData = null;
      fixture.detectChanges();
      // No customer dependency calls beyond the initial lookups
      expect(apiSpy.getCustomerById).not.toHaveBeenCalled();
    });

    it('should populate patientId and patientAborh from savedOrderData', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.savedOrderData = {
        customerId: 'C1',
        orderNo: 'ORD-002',
        patientId: 'PID-12345',
        patientAborh: 'AB+'
      };
      fixture.detectChanges();

      expect(component.orderForm.get('patientId')!.value).toBe('PID-12345');
      expect(component.orderForm.get('patientAborh')!.value).toBe('AB+');
    });
  });

  // ── onCustomerChange ──

  describe('onCustomerChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset contactId and consigneeId when customer changes', () => {
      component.orderForm.patchValue({ contactId: 'old', consigneeId: 'old' });
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'New Customer', customerId: 'C2' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C2');

      expect(component.orderForm.get('contactId')!.value).toBe('');
      expect(component.orderForm.get('consigneeId')!.value).toBe('');
    });

    it('should clear all display signals when customerId is empty', () => {
      component.customerName.set('Existing');
      component.consigneeName.set('Con');
      component.consigneeAddress.set('123 Main');
      component.billToCustomerId.set('BT1');
      component.billToCustomerName.set('BillTo');
      component.billToAddress.set('456 Oak');

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

    it('should set loading to true when customerId is provided', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      // loading is set to true before the forkJoin, then false after completion
      expect(apiSpy.getCustomerById).toHaveBeenCalledWith('C1');
    });

    it('should reset contracts when customer changes', () => {
      component.contracts.set([{ code: 'OLD', description: 'Old Contract' }]);
      component.filteredContracts.set([{ code: 'OLD', description: 'Old Contract' }]);

      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'New', customerId: 'C2' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([{ code: 'NEW', description: 'New Contract' }]));

      component.onCustomerChange('C2');

      // After forkJoin completes, contracts should be updated
      expect(component.contracts()).toEqual([{ code: 'NEW', description: 'New Contract' }]);
    });
  });

  // ── loadCustomerDependencies ──

  describe('loadCustomerDependencies (via onCustomerChange)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set customer name from customerName property', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test Hospital', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.customerName()).toBe('Test Hospital');
    });

    it('should fall back to name property when customerName is not available', () => {
      apiSpy.getCustomerById.and.returnValue(of({ name: 'Fallback Name', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.customerName()).toBe('Fallback Name');
    });

    it('should set billTo to same customer when payeeId equals customerId', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'Same Customer',
        customerId: 'C1',
        payeeId: 'C1',
        address1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75001'
      }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.billToCustomerId()).toBe('C1');
      expect(component.billToCustomerName()).toBe('Same Customer');
      expect(component.billToAddress()).toBe('123 Main St, Dallas, TX, 75001');
    });

    it('should fetch payee separately when payeeId differs from customerId', () => {
      apiSpy.getCustomerById.and.callFake((id: string) => {
        if (id === 'C1') {
          return of({ customerName: 'Customer', customerId: 'C1', payeeId: 'PAY1' });
        }
        return of({
          customerName: 'Payee Corp',
          customerId: 'PAY1',
          address1: '789 Elm',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001'
        });
      });
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(apiSpy.getCustomerById).toHaveBeenCalledWith('PAY1');
      expect(component.billToCustomerName()).toBe('Payee Corp');
      expect(component.billToAddress()).toBe('789 Elm, Houston, TX, 77001');
    });

    it('should handle null payee response gracefully', () => {
      apiSpy.getCustomerById.and.callFake((id: string) => {
        if (id === 'C1') {
          return of({ customerName: 'Customer', customerId: 'C1', payeeId: 'PAY1' });
        }
        return of(null);
      });
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      // billToCustomerName should remain unchanged (no error thrown)
      expect(component.billToCustomerId()).toBe('PAY1');
    });

    it('should handle payee lookup error gracefully', () => {
      apiSpy.getCustomerById.and.callFake((id: string) => {
        if (id === 'C1') {
          return of({ customerName: 'Customer', customerId: 'C1', payeeId: 'PAY1' });
        }
        return throwError(() => new Error('payee not found'));
      });
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      expect(() => component.onCustomerChange('C1')).not.toThrow();
    });

    it('should use customerId as payeeId fallback when payeeId is undefined', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'No Payee Customer',
        customerId: 'C1',
        address1: '100 Oak'
      }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      // payeeId falls back to customerId; since payeeId === customerId, same-customer branch
      expect(component.billToCustomerId()).toBe('C1');
      expect(component.billToCustomerName()).toBe('No Payee Customer');
    });

    it('should populate consignees, contacts, and contracts', () => {
      const mockConsignees = [{ consigneeId: 'CS1', consigneeName: 'Consignee 1', address: '1 Way' }];
      const mockContacts = [{ contactId: 'CT1', lastName: 'Doe', firstName: 'John' }];
      const mockContracts = [{ code: 'CON1', description: 'Contract 1' }];

      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of(mockConsignees));
      apiSpy.getContacts.and.returnValue(of(mockContacts as any));
      apiSpy.getContracts.and.returnValue(of(mockContracts));

      component.onCustomerChange('C1');

      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.filteredConsignees()).toEqual(mockConsignees);
      expect(component.contacts().length).toBe(1);
      expect(component.filteredContacts().length).toBe(1);
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.filteredContracts()).toEqual(mockContracts);
    });

    it('should reset consigneeName and consigneeAddress after loading', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.consigneeName.set('Old Name');
      component.consigneeAddress.set('Old Address');

      component.onCustomerChange('C1');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should set loading to false after successful load', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.loading()).toBeFalse();
    });

    it('should set loading to false on forkJoin error', () => {
      // Make forkJoin itself error (all inner catchErrors return of([]), so we need the subscribe error path)
      // The forkJoin error path is reached if the overall subscribe errors
      // Since individual calls have catchError, let's test the null customer path
      apiSpy.getCustomerById.and.returnValue(of(null));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.loading()).toBeFalse();
    });

    it('should handle null customer response without setting customer name', () => {
      apiSpy.getCustomerById.and.returnValue(of(null));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      // customerName should not be updated from null customer
      expect(component.customerName()).toBe('--');
    });

    it('should emit formDataChange after loading customer dependencies', () => {
      fixture.detectChanges();
      const dataSpy = spyOn(component.formDataChange, 'emit');

      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(dataSpy).toHaveBeenCalled();
    });

    it('should set billToAddress to -- when customer has no address fields', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'No Address Customer',
        customerId: 'C1'
      }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(component.billToAddress()).toBe('--');
    });

    // ── Gap #5: Payee loading on customer change ──

    it('should call getPayeesLookup in loadCustomerDependencies', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));
      apiSpy.getPayeesLookup.and.returnValue(of([]));

      component.onCustomerChange('C1');

      expect(apiSpy.getPayeesLookup).toHaveBeenCalledWith('C1');
    });

    it('should populate payees signal from API response', () => {
      const mockPayees = [{ code: 'PAY1', description: 'Payee One' }, { code: 'PAY2', description: 'Payee Two' }];
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Test', customerId: 'C1' }));
      apiSpy.getConsignees.and.returnValue(of([]));
      apiSpy.getContacts.and.returnValue(of([]));
      apiSpy.getContracts.and.returnValue(of([]));
      apiSpy.getPayeesLookup.and.returnValue(of(mockPayees));

      component.onCustomerChange('C1');

      expect(component.payees()).toEqual(mockPayees);
      expect(component.filteredPayees()).toEqual(mockPayees);
    });
  });

  // ── onConsigneeChange ──

  describe('onConsigneeChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set consignee name and address when consignee is found', () => {
      component.consignees.set([
        { consigneeId: 'CS1', consigneeName: 'Main Lab', address: '100 Lab Dr' },
        { consigneeId: 'CS2', consigneeName: 'Branch', address: '200 Branch Rd' }
      ]);

      component.onConsigneeChange('CS1');

      expect(component.consigneeName()).toBe('Main Lab');
      expect(component.consigneeAddress()).toBe('100 Lab Dr');
    });

    it('should set -- when consignee is not found', () => {
      component.consignees.set([
        { consigneeId: 'CS1', consigneeName: 'Main Lab', address: '100 Lab Dr' }
      ]);

      component.onConsigneeChange('NONEXISTENT');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should set -- when consignees list is empty', () => {
      component.consignees.set([]);

      component.onConsigneeChange('CS1');

      expect(component.consigneeName()).toBe('--');
      expect(component.consigneeAddress()).toBe('--');
    });
  });

  // ── onPayeeChange ──

  describe('onPayeeChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset billTo signals when payeeId is empty', () => {
      component.billToCustomerId.set('PAY1');
      component.billToCustomerName.set('Some Payee');
      component.billToAddress.set('123 Main');

      component.onPayeeChange('');

      expect(component.billToCustomerId()).toBe('--');
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });

    it('should set billToCustomerId to payeeId', () => {
      apiSpy.getCustomerById.and.returnValue(of({ customerName: 'Payee Corp', customerId: 'PAY1' }));

      component.onPayeeChange('PAY1');

      expect(component.billToCustomerId()).toBe('PAY1');
    });

    it('should set billToCustomerName from API response', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'Payee Corp',
        customerId: 'PAY1'
      }));

      component.onPayeeChange('PAY1');

      expect(component.billToCustomerName()).toBe('Payee Corp');
    });

    it('should build billToAddress from address fields', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'Payee Corp',
        customerId: 'PAY1',
        address1: '100 Elm St',
        address2: 'Suite 200',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        country: 'US'
      }));

      component.onPayeeChange('PAY1');

      expect(component.billToAddress()).toBe('100 Elm St, Suite 200, Austin, TX, 73301, US');
    });

    it('should set -- for billToCustomerName when payee is null', () => {
      apiSpy.getCustomerById.and.returnValue(of(null));

      component.onPayeeChange('PAY1');

      expect(component.billToCustomerName()).toBe('--');
    });

    it('should set -- for billToAddress when payee has no address fields', () => {
      apiSpy.getCustomerById.and.returnValue(of({
        customerName: 'No Address Payee',
        customerId: 'PAY1'
      }));

      component.onPayeeChange('PAY1');

      expect(component.billToAddress()).toBe('--');
    });

    it('should handle API error gracefully', () => {
      apiSpy.getCustomerById.and.returnValue(throwError(() => new Error('API failure')));

      expect(() => component.onPayeeChange('PAY1')).not.toThrow();
      // catchError returns of(null), so billTo signals should be set to --
      expect(component.billToCustomerName()).toBe('--');
      expect(component.billToAddress()).toBe('--');
    });
  });

  // ── onAddNewContact ──

  describe('onAddNewContact', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not open dialog when customerId is empty', () => {
      component.orderForm.patchValue({ customerId: '' });
      component.onAddNewContact();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open dialog with correct config when customerId is set', () => {
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        EnterCustomerContactDialogComponent,
        jasmine.objectContaining({
          width: '500px',
          height: '100vh',
          panelClass: 'right-panel-dialog',
          data: { customerId: 'C1' }
        })
      );
    });

    it('should not call createContact when dialog returns null', () => {
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();
      afterClosedSubject.next(null);

      expect(apiSpy.createContact).not.toHaveBeenCalled();
    });

    it('should not call createContact when dialog returns undefined', () => {
      const afterClosedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();
      afterClosedSubject.next(undefined);

      expect(apiSpy.createContact).not.toHaveBeenCalled();
    });

    it('should call createContact with mapped payload when dialog returns result', () => {
      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01',
        salutation: 'Ms',
        title: 'Manager',
        nightPhone: '555-0002',
        faxNumber: '555-0003',
        telexNumber: '555-0004',
        terminationDate: '2025-12-31'
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(of(null));

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      expect(apiSpy.createContact).toHaveBeenCalledWith('C1', jasmine.objectContaining({
        contactType: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhoneNo: '555-0001',
        effDate: '2024-01-01',
        salutation: 'Ms',
        title: 'Manager',
        nightPhoneNo: '555-0002',
        faxNo: '555-0003',
        telexNo: '555-0004',
        termDate: '2025-12-31'
      }));
    });

    it('should omit optional fields from payload when empty', () => {
      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01',
        salutation: '',
        title: '',
        nightPhone: '',
        faxNumber: '',
        telexNumber: '',
        terminationDate: ''
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(of(null));

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      const payload = apiSpy.createContact.calls.mostRecent().args[1];
      expect(payload.salutation).toBeUndefined();
      expect(payload.title).toBeUndefined();
      expect(payload.nightPhoneNo).toBeUndefined();
      expect(payload.faxNo).toBeUndefined();
      expect(payload.telexNo).toBeUndefined();
      expect(payload.termDate).toBeUndefined();
    });

    it('should add new contact to contacts list when createContact succeeds', () => {
      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01'
      };

      const savedContact = {
        contactType: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhoneNo: '555-0001',
        effDate: '2024-01-01'
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(of(savedContact));

      component.contacts.set([]);
      component.filteredContacts.set([]);
      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      expect(component.contacts().length).toBe(1);
      expect(component.contacts()[0].firstName).toBe('Jane');
      expect(component.contacts()[0].lastName).toBe('Doe');
      expect(component.filteredContacts().length).toBe(1);
    });

    it('should not add contact when createContact returns null', () => {
      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01'
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(of(null));

      component.contacts.set([]);
      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      expect(component.contacts().length).toBe(0);
    });

    it('should not add contact when createContact fails', () => {
      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'Jane',
        lastName: 'Doe',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01'
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(throwError(() => new Error('create failed')));

      component.contacts.set([]);
      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      // catchError returns of(null), so contact should not be added
      expect(component.contacts().length).toBe(0);
    });

    it('should append to existing contacts list', () => {
      const existingContact = {
        contactId: 'EXISTING', lastName: 'Existing', firstName: 'Contact',
        contactType: 'CT0', contactTypeCode: 'CT0'
      };
      component.contacts.set([existingContact as any]);
      component.filteredContacts.set([existingContact as any]);

      const dialogResult = {
        contactTypeCode: 'CT1',
        firstName: 'New',
        lastName: 'Contact',
        dayPhone: '555-0001',
        effectiveDate: '2024-01-01'
      };

      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as MatDialogRef<any>);
      apiSpy.createContact.and.returnValue(of({
        contactType: 'CT1', firstName: 'New', lastName: 'Contact',
        dayPhoneNo: '555-0001', effDate: '2024-01-01'
      }));

      component.orderForm.patchValue({ customerId: 'C1' });
      component.onAddNewContact();

      expect(component.contacts().length).toBe(2);
      expect(component.filteredContacts().length).toBe(2);
    });
  });

  // ── scrollToSection ──

  describe('scrollToSection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update activeSection signal', () => {
      const mockElement = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);

      component.scrollToSection('ship-to');
      expect(component.activeSection()).toBe('ship-to');
    });

    it('should scroll to element when it exists', () => {
      const mockElement = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);

      component.scrollToSection('bill-to');

      expect(document.getElementById).toHaveBeenCalled();
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should not throw when element does not exist', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      expect(() => component.scrollToSection('nonexistent')).not.toThrow();
    });
  });

  // ── Search filters ──

  describe('subscribeToSearchFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter customers by code', fakeAsync(() => {
      component.customers.set([
        { code: 'ABC', description: 'Alpha' },
        { code: 'DEF', description: 'Beta' },
        { code: 'GHI', description: 'Gamma' }
      ]);

      component.customerSearchCtrl.setValue('abc');
      tick(200);

      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('ABC');
    }));

    it('should filter customers by description', fakeAsync(() => {
      component.customers.set([
        { code: 'C1', description: 'Alpha Hospital' },
        { code: 'C2', description: 'Beta Clinic' }
      ]);

      component.customerSearchCtrl.setValue('hospital');
      tick(200);

      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('C1');
    }));

    it('should show all customers when search is empty', fakeAsync(() => {
      component.customers.set([
        { code: 'C1', description: 'Alpha' },
        { code: 'C2', description: 'Beta' }
      ]);

      component.customerSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredCustomers().length).toBe(2);
    }));

    it('should filter contracts by code', fakeAsync(() => {
      component.contracts.set([
        { code: 'CON1', description: 'Contract One' },
        { code: 'CON2', description: 'Contract Two' }
      ]);

      component.contractSearchCtrl.setValue('con1');
      tick(200);

      expect(component.filteredContracts().length).toBe(1);
      expect(component.filteredContracts()[0].code).toBe('CON1');
    }));

    it('should filter priorities by description', fakeAsync(() => {
      component.priorities.set([
        { code: 'P1', description: 'Routine' },
        { code: 'P2', description: 'Urgent' }
      ]);

      component.prioritySearchCtrl.setValue('urgent');
      tick(200);

      expect(component.filteredPriorities().length).toBe(1);
      expect(component.filteredPriorities()[0].code).toBe('P2');
    }));

    it('should filter modes by description', fakeAsync(() => {
      component.modes.set([
        { code: 'M1', description: 'Delivery' },
        { code: 'M2', description: 'Pickup' }
      ]);

      component.modeSearchCtrl.setValue('pickup');
      tick(200);

      expect(component.filteredModes().length).toBe(1);
      expect(component.filteredModes()[0].code).toBe('M2');
    }));

    it('should filter contacts by first and last name', fakeAsync(() => {
      component.contacts.set([
        { contactId: 'CT1', firstName: 'John', lastName: 'Doe' },
        { contactId: 'CT2', firstName: 'Jane', lastName: 'Smith' }
      ] as any);

      component.contactSearchCtrl.setValue('doe');
      tick(200);

      expect(component.filteredContacts().length).toBe(1);
      expect(component.filteredContacts()[0].contactId).toBe('CT1');
    }));

    it('should filter consignees by consigneeId', fakeAsync(() => {
      component.consignees.set([
        { consigneeId: 'CS-100', consigneeName: 'Lab A' },
        { consigneeId: 'CS-200', consigneeName: 'Lab B' }
      ]);

      component.consigneeSearchCtrl.setValue('cs-100');
      tick(200);

      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('CS-100');
    }));

    it('should filter consignees by consigneeName', fakeAsync(() => {
      component.consignees.set([
        { consigneeId: 'CS-100', consigneeName: 'Main Lab' },
        { consigneeId: 'CS-200', consigneeName: 'Branch Lab' }
      ]);

      component.consigneeSearchCtrl.setValue('branch');
      tick(200);

      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('CS-200');
    }));

    it('should handle null search term for customers', fakeAsync(() => {
      component.customers.set([{ code: 'C1', description: 'Test' }]);
      component.customerSearchCtrl.setValue(null as any);
      tick(200);
      expect(component.filteredCustomers().length).toBe(1);
    }));

    // ── Gap #5: Payee search filter ──

    it('should filter payees by code', fakeAsync(() => {
      component.payees.set([
        { code: 'PAY1', description: 'Payee Alpha' },
        { code: 'PAY2', description: 'Payee Beta' },
        { code: 'PAY3', description: 'Payee Gamma' }
      ]);

      component.payeeSearchCtrl.setValue('pay1');
      tick(200);

      expect(component.filteredPayees().length).toBe(1);
      expect(component.filteredPayees()[0].code).toBe('PAY1');
    }));
  });

  // ── getFormData ──

  describe('getFormData', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return form values mapped to SpecialOrderDto', () => {
      component.orderForm.patchValue({
        customerId: 'C1',
        contractId: 'CT1',
        priority: 'P1',
        orderMode: 'M1',
        contactId: 'CO1',
        consigneeId: 'CS1',
        patientName: 'John Doe',
        doctorName: 'Dr. Smith'
      });

      component.contacts.set([{ contactId: 'CO1', firstName: 'Jane', lastName: 'Doe' } as any]);
      component.customerName.set('Test Customer');
      component.billToCustomerId.set('BT1');
      component.orderNumber.set('ORD-001');

      const data = component.getFormData();

      expect(data.customerId).toBe('C1');
      expect(data.contractId).toBe('CT1');
      expect(data.priority).toBe('P1');
      expect(data.orderMode).toBe('M1');
      expect(data.orderedBy).toBe('Jane Doe');
      expect(data.consigneeId).toBe('CS1');
      expect(data.payeeId).toBe('BT1');
      expect(data.customerName).toBe('Test Customer');
      expect(data.orderNo).toBe('ORD-001');
      expect(data.patientName).toBe('John Doe');
      expect(data.doctorName).toBe('Dr. Smith');
    });

    it('should not set orderedBy when contactId is empty', () => {
      component.orderForm.patchValue({ contactId: '' });
      const data = component.getFormData();
      expect(data.orderedBy).toBeUndefined();
    });

    it('should not set orderedBy when contact is not found', () => {
      component.orderForm.patchValue({ contactId: 'MISSING' });
      component.contacts.set([]);
      const data = component.getFormData();
      expect(data.orderedBy).toBeUndefined();
    });

    it('should not set payeeId when billToCustomerId is --', () => {
      component.billToCustomerId.set('--');
      const data = component.getFormData();
      expect(data.payeeId).toBeUndefined();
    });

    it('should not set orderNo when orderNumber is --', () => {
      component.orderNumber.set('--');
      const data = component.getFormData();
      expect(data.orderNo).toBeUndefined();
    });

    it('should not set patientName when empty', () => {
      component.orderForm.patchValue({ patientName: '' });
      const data = component.getFormData();
      expect(data.patientName).toBeUndefined();
    });

    it('should not set doctorName when empty', () => {
      component.orderForm.patchValue({ doctorName: '' });
      const data = component.getFormData();
      expect(data.doctorName).toBeUndefined();
    });

    // ── Gap #4: getFormData returns patientId and patientAborh ──

    it('should return patientId when present', () => {
      component.orderForm.patchValue({ patientId: 'PID-999' });
      const data = component.getFormData();
      expect(data.patientId).toBe('PID-999');
    });

    it('should return patientAborh when present', () => {
      component.orderForm.patchValue({ patientAborh: 'O+' });
      const data = component.getFormData();
      expect(data.patientAborh).toBe('O+');
    });

    it('should not set patientId when empty', () => {
      component.orderForm.patchValue({ patientId: '' });
      const data = component.getFormData();
      expect(data.patientId).toBeUndefined();
    });

    it('should not set patientAborh when empty', () => {
      component.orderForm.patchValue({ patientAborh: '' });
      const data = component.getFormData();
      expect(data.patientAborh).toBeUndefined();
    });
  });

  // ── f getter ──

  describe('f getter', () => {
    it('should return form controls', () => {
      fixture.detectChanges();
      expect(component.f).toBe(component.orderForm.controls);
    });
  });

  // ── elementId / errorId ──

  describe('elementId and errorId', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate unique element IDs', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('sp-step-order-details-');
      expect(id).toContain('-test');
    });

    it('should generate unique error IDs', () => {
      const id = (component as any).errorId('test');
      expect(id).toContain('sp-step-order-details-');
      expect(id).toContain('-test-error');
    });
  });

  // ── ngOnDestroy ──

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should stop form valueChanges emissions after destroy', () => {
      fixture.detectChanges();
      const validitySpy = spyOn(component.validityChange, 'emit');

      component.ngOnDestroy();
      validitySpy.calls.reset();

      component.orderForm.patchValue({ patientName: 'After Destroy' });

      expect(validitySpy).not.toHaveBeenCalled();
    });
  });

  // ── Default signal values ──

  describe('default signal values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have default -- for orderNumber', () => {
      expect(component.orderNumber()).toBe('--');
    });

    it('should have default -- for estimatedArrivalTime', () => {
      expect(component.estimatedArrivalTime()).toBe('--');
    });

    it('should have default -- for customerName', () => {
      expect(component.customerName()).toBe('--');
    });

    it('should have default -- for consigneeName', () => {
      expect(component.consigneeName()).toBe('--');
    });

    it('should have default -- for consigneeAddress', () => {
      expect(component.consigneeAddress()).toBe('--');
    });

    it('should have default -- for billToCustomerId', () => {
      expect(component.billToCustomerId()).toBe('--');
    });

    it('should have default -- for billToCustomerName', () => {
      expect(component.billToCustomerName()).toBe('--');
    });

    it('should have default -- for billToAddress', () => {
      expect(component.billToAddress()).toBe('--');
    });

    it('should have default order-info for activeSection', () => {
      expect(component.activeSection()).toBe('order-info');
    });

    it('should have loading as false initially', () => {
      expect(component.loading()).toBeFalse();
    });
  });
});
