import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import moment from 'moment';

import { OrderServicesDebitCreditComponent } from './order-services-debit-credit';
import { OrderServicesDebitCreditService } from './services/order-services-debit-credit.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  createMockHeaderService,
  createMockSnackbarService,
  createMockPageHeaderService,
  createMockMatDialog
} from '@shared/testing/common-mocks';

describe('OrderServicesDebitCreditComponent', () => {
  let component: OrderServicesDebitCreditComponent;
  let fixture: ComponentFixture<OrderServicesDebitCreditComponent>;
  let serviceSpy: jasmine.SpyObj<OrderServicesDebitCreditService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChanged$: Subject<void>;
  let dialogRefSpy: any;

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('OrderServicesDebitCreditService', [
      'create', 'getNote', 'addNote',
      'getCustomerLov', 'getOrderNoLov', 'getServiceCodeLov',
      'getReasonCodeLov', 'getPatientLov', 'getRequestedByLov'
    ]);
    serviceSpy.getCustomerLov.and.returnValue(of([]));
    serviceSpy.getServiceCodeLov.and.returnValue(of([]));
    serviceSpy.getOrderNoLov.and.returnValue(of([]));
    serviceSpy.getReasonCodeLov.and.returnValue(of([]));
    serviceSpy.getPatientLov.and.returnValue(of([]));
    serviceSpy.getRequestedByLov.and.returnValue(of([]));

    snackbarSpy = createMockSnackbarService();
    headerSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderSpy = createMockPageHeaderService();
    (pageHeaderSpy as any).pageHeaderData = signal(undefined);

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'getChapterLocalDateTime']);
    (chapterTimezoneSpy as any).chapterLocalDate = signal(moment());
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    dialogSpy.open.and.returnValue(dialogRefSpy);

    TestBed.configureTestingModule({
      imports: [OrderServicesDebitCreditComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: OrderServicesDebitCreditService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).overrideComponent(OrderServicesDebitCreditComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(OrderServicesDebitCreditComponent);
    component = fixture.componentInstance;
    (component as any).service = serviceSpy;
    (component as any).snackbarService = snackbarSpy;
    (component as any).dialog = dialogSpy;
    (component as any).chapterTimezone = chapterTimezoneSpy;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have unique componentId', () => {
    expect(component.componentId).toMatch(/^osdbcr-\d+$/);
  });

  it('should generate element ids', () => {
    expect(component.elementId('test')).toBe(`${component.componentId}-test`);
  });

  describe('ngOnInit', () => {
    it('should load customers on init', () => {
      expect(serviceSpy.getCustomerLov).toHaveBeenCalled();
    });

    it('should load service codes on init', () => {
      expect(serviceSpy.getServiceCodeLov).toHaveBeenCalled();
    });

    it('should initialize filter form', () => {
      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('customerId')).toBeTruthy();
      expect(component.filterForm.get('tranType')).toBeTruthy();
      expect(component.filterForm.get('patient')).toBeTruthy();
    });

    it('should initialize entry form', () => {
      expect(component.entryForm).toBeTruthy();
      expect(component.entryForm.get('orderNo')).toBeTruthy();
      expect(component.entryForm.get('serviceCode')).toBeTruthy();
      expect(component.entryForm.get('quantity')).toBeTruthy();
      expect(component.entryForm.get('requestedBy')).toBeTruthy();
      expect(component.entryForm.get('requestDate')).toBeTruthy();
      expect(component.entryForm.get('amount')).toBeTruthy();
      expect(component.entryForm.get('reasonCode')).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('showEntrySection', () => {
    it('should show entry section when both customerId and tranType are set', () => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      expect(component.showEntrySection()).toBeTrue();
    });

    it('should hide entry section when customerId is null', () => {
      component.filterForm.patchValue({ customerId: null, tranType: 'DB' });
      expect(component.showEntrySection()).toBeFalse();
    });

    it('should hide entry section when tranType is null', () => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: null });
      expect(component.showEntrySection()).toBeFalse();
    });
  });

  describe('onCustomerChange', () => {
    it('should set selectedCustomerName from customers list', () => {
      component.customers.set([{ code: 'C1', description: 'Test Customer' }]);
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.onCustomerChange();
      expect(component.selectedCustomerName()).toBe('Test Customer');
    });

    it('should set null when customer not found', () => {
      component.customers.set([]);
      component.filterForm.patchValue({ customerId: 'C1' });
      component.onCustomerChange();
      expect(component.selectedCustomerName()).toBeNull();
    });

    it('should clear records and reset page index', () => {
      component.records.set([{ test: true }]);
      component.pageIndex.set(2);
      component.filterForm.patchValue({ customerId: 'C1' });
      component.onCustomerChange();
      expect(component.records()).toEqual([]);
      expect(component.pageIndex()).toBe(0);
    });

    it('should load order numbers when customerId and tranType are set', () => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      component.onCustomerChange();
      expect(serviceSpy.getOrderNoLov).toHaveBeenCalledWith('C1', 'CR', null);
    });

    it('should not load order numbers when tranType is null', () => {
      serviceSpy.getOrderNoLov.calls.reset();
      component.filterForm.patchValue({ customerId: 'C1', tranType: null });
      component.onCustomerChange();
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
    });

    it('should load requestedBy LOV when customerId is set', () => {
      component.filterForm.patchValue({ customerId: 'C1' });
      component.onCustomerChange();
      expect(serviceSpy.getRequestedByLov).toHaveBeenCalledWith('C1');
    });

    it('should not load requestedBy LOV when customerId is null', () => {
      serviceSpy.getRequestedByLov.calls.reset();
      component.filterForm.patchValue({ customerId: null });
      component.onCustomerChange();
      expect(serviceSpy.getRequestedByLov).not.toHaveBeenCalled();
    });
  });

  describe('onTranTypeChange', () => {
    it('should reset entry section and clear records', () => {
      component.records.set([{ test: true }]);
      component.filterForm.patchValue({ tranType: 'DB' });
      component.onTranTypeChange();
      expect(component.records()).toEqual([]);
      expect(component.pageIndex()).toBe(0);
    });

    it('should load service codes with tranType', () => {
      serviceSpy.getServiceCodeLov.calls.reset();
      component.filterForm.patchValue({ tranType: 'CR' });
      component.onTranTypeChange();
      expect(serviceSpy.getServiceCodeLov).toHaveBeenCalledWith('CR', undefined);
    });

    it('should load reason codes when tranType is set', () => {
      component.filterForm.patchValue({ tranType: 'DB' });
      component.onTranTypeChange();
      expect(serviceSpy.getReasonCodeLov).toHaveBeenCalledWith('DB');
    });

    it('should not load reason codes when tranType is null', () => {
      serviceSpy.getReasonCodeLov.calls.reset();
      component.filterForm.patchValue({ tranType: null });
      component.onTranTypeChange();
      expect(serviceSpy.getReasonCodeLov).not.toHaveBeenCalled();
    });

    it('should load order numbers when both customerId and tranType are set', () => {
      serviceSpy.getOrderNoLov.calls.reset();
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      component.onTranTypeChange();
      expect(serviceSpy.getOrderNoLov).toHaveBeenCalledWith('C1', 'CR', null);
    });

    it('should set orderNo required for CR tranType', () => {
      component.filterForm.patchValue({ tranType: 'CR' });
      component.onTranTypeChange();
      component.entryForm.get('orderNo')?.setValue(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
      expect(component.entryForm.get('orderNo')?.hasError('required')).toBeTrue();
    });

    it('should clear orderNo validators for DB tranType', () => {
      component.filterForm.patchValue({ tranType: 'DB' });
      component.onTranTypeChange();
      component.entryForm.get('orderNo')?.setValue(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
      expect(component.entryForm.get('orderNo')?.valid).toBeTrue();
    });
  });

  describe('onOrderNoChange', () => {
    it('should reload service codes when tranType is CR and orderNo is set', () => {
      serviceSpy.getServiceCodeLov.calls.reset();
      component.filterForm.patchValue({ tranType: 'CR' });
      component.entryForm.patchValue({ orderNo: 'ORD1' });
      component.onOrderNoChange();
      expect(serviceSpy.getServiceCodeLov).toHaveBeenCalledWith('CR', 'ORD1');
    });

    it('should not reload service codes for DB tranType', () => {
      serviceSpy.getServiceCodeLov.calls.reset();
      component.filterForm.patchValue({ tranType: 'DB' });
      component.entryForm.patchValue({ orderNo: 'ORD1' });
      component.onOrderNoChange();
      expect(serviceSpy.getServiceCodeLov).not.toHaveBeenCalled();
    });

    it('should not reload service codes when orderNo is null', () => {
      serviceSpy.getServiceCodeLov.calls.reset();
      component.filterForm.patchValue({ tranType: 'CR' });
      component.entryForm.patchValue({ orderNo: null });
      component.onOrderNoChange();
      expect(serviceSpy.getServiceCodeLov).not.toHaveBeenCalled();
    });
  });

  describe('onServiceCodeChange', () => {
    it('should enable amount when no code is selected', () => {
      component.entryForm.patchValue({ serviceCode: null });
      component.onServiceCodeChange();
      expect(component.amountEditable()).toBeTrue();
      expect(component.entryForm.get('amount')?.enabled).toBeTrue();
    });

    it('should set amount from charge when service has charge > 0', () => {
      component.serviceCodes.set([{ code: 'S1', description: 'Svc', charge: 25.50, editCharge: true }]);
      component.entryForm.patchValue({ serviceCode: 'S1' });
      component.onServiceCodeChange();
      expect(component.entryForm.get('amount')?.value).toBe(25.50);
    });

    it('should disable amount when editCharge is false', () => {
      component.serviceCodes.set([{ code: 'S1', description: 'Svc', charge: 10, editCharge: false }]);
      component.entryForm.patchValue({ serviceCode: 'S1' });
      component.onServiceCodeChange();
      expect(component.amountEditable()).toBeFalse();
      expect(component.entryForm.get('amount')?.disabled).toBeTrue();
    });

    it('should enable amount when editCharge is true', () => {
      component.serviceCodes.set([{ code: 'S1', description: 'Svc', charge: 10, editCharge: true }]);
      component.entryForm.patchValue({ serviceCode: 'S1' });
      component.onServiceCodeChange();
      expect(component.amountEditable()).toBeTrue();
      expect(component.entryForm.get('amount')?.enabled).toBeTrue();
    });

    it('should enable amount when service code not found in list', () => {
      component.serviceCodes.set([]);
      component.entryForm.patchValue({ serviceCode: 'UNKNOWN' });
      component.onServiceCodeChange();
      expect(component.amountEditable()).toBeTrue();
    });

    it('should not set amount when charge is null', () => {
      component.serviceCodes.set([{ code: 'S1', description: 'Svc', charge: null, editCharge: true }]);
      component.entryForm.patchValue({ serviceCode: 'S1', amount: 5 });
      component.onServiceCodeChange();
      expect(component.entryForm.get('amount')?.value).toBe(5);
    });

    it('should not set amount when charge is 0', () => {
      component.serviceCodes.set([{ code: 'S1', description: 'Svc', charge: 0, editCharge: true }]);
      component.entryForm.patchValue({ serviceCode: 'S1', amount: 5 });
      component.onServiceCodeChange();
      expect(component.entryForm.get('amount')?.value).toBe(5);
    });
  });

  describe('onReasonCodeChange', () => {
    it('should set selectedReasonDesc from reason codes list', () => {
      component.reasonCodes.set([{ code: 'R1', description: 'Test Reason' }]);
      component.entryForm.patchValue({ reasonCode: 'R1' });
      component.onReasonCodeChange();
      expect(component.selectedReasonDesc()).toBe('Test Reason');
    });

    it('should set null when reason code not found', () => {
      component.reasonCodes.set([]);
      component.entryForm.patchValue({ reasonCode: 'UNKNOWN' });
      component.onReasonCodeChange();
      expect(component.selectedReasonDesc()).toBeNull();
    });
  });

  describe('onReasonTabPress', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
    });

    it('should return early if loading', () => {
      component.loading.set(true);
      component.onReasonTabPress(mockEvent);
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should mark form touched and return when entry form is invalid', () => {
      component.loading.set(false);
      component.entryForm.patchValue({ serviceCode: null });
      component.onReasonTabPress(mockEvent);
      expect(component.entryForm.touched).toBeTrue();
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default and save when form is valid', () => {
      component.loading.set(false);
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.entryForm.patchValue({
        serviceCode: 'S1',
        quantity: 1,
        requestDate: moment(),
        amount: 10,
        reasonCode: 'R1'
      });
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      component.onReasonTabPress(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('saveCurrentEntry (via onReasonTabPress)', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      component.selectedCustomerName.set('Customer One');
      component.selectedReasonDesc.set('Test Reason');
      component.entryForm.patchValue({
        orderNo: 'ORD1',
        serviceCode: 'S1',
        quantity: 2,
        requestDate: '2026-01-15',
        amount: 50,
        reasonCode: 'R1'
      });
      component.entryForm.get('orderNo')?.setValidators(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
    });

    it('should open save confirm dialog with correct data', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      component.onReasonTabPress(mockEvent);
      expect(dialogSpy.open).toHaveBeenCalled();
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toEqual({ tranTypeLabel: 'Credited', customerName: 'Customer One' });
    });

    it('should use Debited label for DB tranType', () => {
      component.filterForm.patchValue({ tranType: 'DB' });
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      component.onReasonTabPress(mockEvent);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data.tranTypeLabel).toBe('Debited');
    });

    it('should use customerId as fallback when selectedCustomerName is null', () => {
      component.selectedCustomerName.set(null);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      component.onReasonTabPress(mockEvent);
      const callArgs = dialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1]?.data.customerName).toBe('C1');
    });

    it('should not call service when dialog is cancelled', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      component.onReasonTabPress(mockEvent);
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });

    it('should call service.create on dialog confirm', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(serviceSpy.create).toHaveBeenCalled();
    });

    it('should show success snackbar and append to records on success', fakeAsync(() => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Credit record for Customer ID C1 has been saved.');
      expect(component.records().length).toBe(1);
      expect(component.records()[0].adviceId).toBe('ADV1');
      tick(100);
    }));

    it('should show Debit label in success message for DB', () => {
      component.filterForm.patchValue({ tranType: 'DB' });
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Debit record for Customer ID C1 has been saved.');
    });

    it('should show error when API returns success: false', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: false, message: 'Duplicate entry', data: null, statusCode: 400, total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate entry');
      expect(component.records().length).toBe(0);
    });

    it('should show default error message when API returns success: false with no message', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: false, message: '', data: null, statusCode: 400, total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save record');
    });

    it('should show error on HTTP error', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.loading()).toBeFalse();
    });

    it('should show default error on HTTP error without message', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(throwError(() => ({})));
      component.onReasonTabPress(mockEvent);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save record');
    });

    it('should set adviceId to null when response has no data', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: null, statusCode: 200, message: '', total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      expect(component.records()[0].adviceId).toBeNull();
    });

    it('should build DTO with correct patientName from filter form', () => {
      component.filterForm.patchValue({ patient: 'John Doe' });
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.patientName).toBe('John Doe');
    });
  });

  describe('onRowEnterNotes', () => {
    it('should show error when row has no adviceId', () => {
      component.onRowEnterNotes({ adviceId: null });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot add notes: record has no Advice ID yet');
    });

    it('should fetch existing note and open dialog', () => {
      serviceSpy.getNote.and.returnValue(of({ noteId: 1, noteText: 'Existing note' }));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(serviceSpy.getNote).toHaveBeenCalledWith('ADV1');
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should open dialog with empty note on fetch error', () => {
      serviceSpy.getNote.and.returnValue(throwError(() => new Error('fail')));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should save note when dialog returns text', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogRefSpy.afterClosed.and.returnValue(of('New note'));
      serviceSpy.addNote.and.returnValue(of({} as any));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(serviceSpy.addNote).toHaveBeenCalledWith('ADV1', 'New note');
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Note saved successfully.');
    });

    it('should not save when dialog returns null', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(serviceSpy.addNote).not.toHaveBeenCalled();
    });

    it('should not save when dialog returns undefined', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(serviceSpy.addNote).not.toHaveBeenCalled();
    });

    it('should show error on addNote failure', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogRefSpy.afterClosed.and.returnValue(of('Note text'));
      serviceSpy.addNote.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should show default error on addNote failure without message', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogRefSpy.afterClosed.and.returnValue(of('Note text'));
      serviceSpy.addNote.and.returnValue(throwError(() => ({})));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save note');
    });

    it('should pass existing noteText to dialog', () => {
      serviceSpy.getNote.and.returnValue(of({ noteId: 1, noteText: 'Old note' }));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.noteText).toBe('Old note');
    });

    it('should default existing noteText to empty string when null', () => {
      serviceSpy.getNote.and.returnValue(of({ noteId: 1, noteText: null } as any));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowEnterNotes({ adviceId: 'ADV1' });
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.noteText).toBe('');
    });
  });

  describe('onClearEntry', () => {
    it('should reset entry section', () => {
      component.entryForm.patchValue({ serviceCode: 'S1', amount: 50 });
      component.selectedReasonDesc.set('Some reason');
      component.onClearEntry();
      expect(component.entryForm.get('serviceCode')?.value).toBeNull();
      expect(component.selectedReasonDesc()).toBeNull();
      expect(component.amountEditable()).toBeTrue();
    });
  });

  describe('clearAll', () => {
    it('should perform full reset', () => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.selectedCustomerName.set('Customer');
      component.records.set([{ test: true }]);
      component.clearAll();
      expect(component.showEntrySection()).toBeFalse();
      expect(component.selectedCustomerName()).toBeNull();
      expect(component.records()).toEqual([]);
      expect(component.pageIndex()).toBe(0);
    });

    it('should handle fullReset when filterForm is null', () => {
      const original = component.filterForm;
      (component as any).filterForm = null;
      expect(() => (component as any).fullReset()).not.toThrow();
      (component as any).filterForm = original;
    });

    it('should handle resetEntrySection when filterForm is null', () => {
      const original = component.filterForm;
      (component as any).filterForm = null;
      expect(() => (component as any).resetEntrySection()).not.toThrow();
      (component as any).filterForm = original;
    });
  });

  describe('onClearAll', () => {
    it('should perform full reset and focus customerIdTrigger', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.records.set([{ test: true }]);
      component.onClearAll();
      expect(component.records()).toEqual([]);
      expect(component.showEntrySection()).toBeFalse();
      tick(100);
    }));
  });

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 0 });
      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(25);
    });
  });

  describe('paginatedRecords', () => {
    it('should return correct page of records', () => {
      const allRecords = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      component.records.set(allRecords);
      component.pageSize.set(10);
      component.pageIndex.set(1);
      const page = component.paginatedRecords();
      expect(page.length).toBe(10);
      expect(page[0].id).toBe(10);
    });

    it('should return remaining records for last partial page', () => {
      const allRecords = Array.from({ length: 25 }, (_, i) => ({ id: i }));
      component.records.set(allRecords);
      component.pageSize.set(10);
      component.pageIndex.set(2);
      const page = component.paginatedRecords();
      expect(page.length).toBe(5);
    });

    it('should return empty array when no records', () => {
      component.records.set([]);
      expect(component.paginatedRecords()).toEqual([]);
    });
  });

  describe('formatDate', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return raw value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format valid date string as DD-MON-YYYY', () => {
      const result = component.formatDate('2026-03-15');
      expect(result).toBe('15-MAR-2026');
    });

    it('should format another valid date', () => {
      const result = component.formatDate('2026-01-01');
      expect(result).toBe('01-JAN-2026');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });
  });

  describe('toIsoDate (private)', () => {
    it('should return empty string for null', () => {
      expect((component as any).toIsoDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect((component as any).toIsoDate(undefined)).toBe('');
    });

    it('should return string as-is', () => {
      expect((component as any).toIsoDate('2026-01-15')).toBe('2026-01-15');
    });

    it('should format Moment object', () => {
      const m = moment('2026-03-15');
      const result = (component as any).toIsoDate(m);
      expect(result).toBe('2026-03-15');
    });

    it('should format Date object', () => {
      const d = new Date(2026, 2, 15);
      const result = (component as any).toIsoDate(d);
      expect(result).toBe('2026-03-15');
    });

    it('should return empty string for unrecognized type', () => {
      expect((component as any).toIsoDate(12345)).toBe('');
    });

    it('should return empty string for false', () => {
      expect((component as any).toIsoDate(false)).toBe('');
    });

    it('should return empty string for 0', () => {
      expect((component as any).toIsoDate(0)).toBe('');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reload customers and service codes on chapter change', () => {
      serviceSpy.getCustomerLov.calls.reset();
      serviceSpy.getServiceCodeLov.calls.reset();
      chapterChanged$.next();
      expect(serviceSpy.getCustomerLov).toHaveBeenCalled();
      expect(serviceSpy.getServiceCodeLov).toHaveBeenCalled();
    });
  });

  describe('loadCustomers', () => {
    it('should set customers and filteredCustomers on success', () => {
      const customers = [{ code: 'C1', description: 'Cust 1' }];
      serviceSpy.getCustomerLov.and.returnValue(of(customers));
      (component as any).loadCustomers();
      expect(component.customers()).toEqual(customers);
      expect(component.filteredCustomers()).toEqual(customers);
    });

    it('should handle error gracefully', () => {
      serviceSpy.getCustomerLov.and.returnValue(throwError(() => new Error('fail')));
      expect(() => (component as any).loadCustomers()).not.toThrow();
    });
  });

  describe('loadServiceCodes', () => {
    it('should set serviceCodes and filteredServiceCodes on success', () => {
      const codes = [{ code: 'S1', description: 'Svc 1', charge: 10, editCharge: true }];
      serviceSpy.getServiceCodeLov.and.returnValue(of(codes));
      (component as any).loadServiceCodes('CR', 'ORD1');
      expect(component.serviceCodes()).toEqual(codes);
      expect(component.filteredServiceCodes()).toEqual(codes);
    });

    it('should handle error gracefully', () => {
      serviceSpy.getServiceCodeLov.and.returnValue(throwError(() => new Error('fail')));
      expect(() => (component as any).loadServiceCodes()).not.toThrow();
    });
  });

  describe('loadOrderNos', () => {
    it('should set orderNos and filteredOrderNos on success', () => {
      const orders = [{ code: 'O1', description: '2026-01-01' }];
      serviceSpy.getOrderNoLov.and.returnValue(of(orders));
      (component as any).loadOrderNos('C1', 'CR');
      expect(component.orderNos()).toEqual(orders);
      expect(component.filteredOrderNos()).toEqual(orders);
    });

    it('should handle error gracefully', () => {
      serviceSpy.getOrderNoLov.and.returnValue(throwError(() => new Error('fail')));
      expect(() => (component as any).loadOrderNos('C1', 'CR')).not.toThrow();
    });
  });

  describe('loadReasonCodes', () => {
    it('should set reasonCodes and filteredReasonCodes on success', () => {
      const reasons = [{ code: 'R1', description: 'Reason 1' }];
      serviceSpy.getReasonCodeLov.and.returnValue(of(reasons));
      (component as any).loadReasonCodes('DB');
      expect(component.reasonCodes()).toEqual(reasons);
      expect(component.filteredReasonCodes()).toEqual(reasons);
    });

    it('should handle error gracefully', () => {
      serviceSpy.getReasonCodeLov.and.returnValue(throwError(() => new Error('fail')));
      expect(() => (component as any).loadReasonCodes('DB')).not.toThrow();
    });
  });

  describe('loadPatientLov', () => {
    it('should set filteredPatients on success', () => {
      const patients = [{ patientName: 'John', orderNo: 'O1' }];
      serviceSpy.getPatientLov.and.returnValue(of(patients));
      (component as any).loadPatientLov('C1', 'CR', 'John');
      expect(component.filteredPatients()).toEqual(patients);
    });

    it('should set empty array on error', () => {
      serviceSpy.getPatientLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadPatientLov('C1', 'CR', 'John');
      expect(component.filteredPatients()).toEqual([]);
    });
  });

  describe('loadRequestedByLov', () => {
    it('should set requestedByOptions and filteredRequestedBy on success', () => {
      const contacts = [{ contactName: 'Jane' }];
      serviceSpy.getRequestedByLov.and.returnValue(of(contacts));
      (component as any).loadRequestedByLov('C1');
      expect(component.requestedByOptions()).toEqual(contacts);
      expect(component.filteredRequestedBy()).toEqual(contacts);
    });

    it('should set empty arrays on error', () => {
      serviceSpy.getRequestedByLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadRequestedByLov('C1');
      expect(component.requestedByOptions()).toEqual([]);
      expect(component.filteredRequestedBy()).toEqual([]);
    });
  });

  describe('setupSearchFilters', () => {
    it('should filter customers by search term', fakeAsync(() => {
      component.customers.set([
        { code: 'C1', description: 'Alpha Hospital' },
        { code: 'C2', description: 'Beta Clinic' }
      ]);
      component.customerSearchCtrl.setValue('alpha');
      tick(300);
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('C1');
    }));

    it('should show all customers when search is cleared', fakeAsync(() => {
      component.customers.set([
        { code: 'C1', description: 'Alpha Hospital' },
        { code: 'C2', description: 'Beta Clinic' }
      ]);
      component.customerSearchCtrl.setValue('alpha');
      tick(300);
      component.customerSearchCtrl.setValue('');
      tick(300);
      expect(component.filteredCustomers().length).toBe(2);
    }));

    it('should filter tran types by search term', fakeAsync(() => {
      component.tranTypeSearchCtrl.setValue('cred');
      tick(300);
      expect(component.filteredTranTypes().length).toBe(1);
      expect(component.filteredTranTypes()[0].code).toBe('CR');
    }));

    it('should filter order numbers by search term', fakeAsync(() => {
      component.orderNos.set([
        { code: 'ORD001', description: '2026-01-01' },
        { code: 'ORD002', description: '2026-02-01' }
      ]);
      component.orderNoSearchCtrl.setValue('001');
      tick(300);
      expect(component.filteredOrderNos().length).toBe(1);
    }));

    it('should filter service codes by search term', fakeAsync(() => {
      component.serviceCodes.set([
        { code: 'SVC1', description: 'Shipping' },
        { code: 'SVC2', description: 'Handling' }
      ]);
      component.serviceCodeSearchCtrl.setValue('ship');
      tick(300);
      expect(component.filteredServiceCodes().length).toBe(1);
    }));

    it('should filter reason codes by search term', fakeAsync(() => {
      component.reasonCodes.set([
        { code: 'R1', description: 'Overcharge' },
        { code: 'R2', description: 'Damaged' }
      ]);
      component.reasonCodeSearchCtrl.setValue('damage');
      tick(300);
      expect(component.filteredReasonCodes().length).toBe(1);
    }));

    it('should handle null search value in customer filter', fakeAsync(() => {
      component.customers.set([{ code: 'C1', description: 'Hospital' }]);
      component.customerSearchCtrl.setValue(null as any);
      tick(300);
      expect(component.filteredCustomers().length).toBe(1);
    }));

    it('should filter by code when description does not match', fakeAsync(() => {
      component.customers.set([
        { code: 'ALPHA', description: 'Hospital One' },
        { code: 'BETA', description: 'Clinic Two' }
      ]);
      component.customerSearchCtrl.setValue('alpha');
      tick(300);
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('ALPHA');
    }));
  });

  describe('patient valueChanges', () => {
    it('should load patient LOV when patient >= 2 chars with customerId and tranType', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      serviceSpy.getPatientLov.calls.reset();
      component.filterForm.get('patient')!.setValue('Jo');
      tick(500);
      expect(serviceSpy.getPatientLov).toHaveBeenCalledWith('C1', 'CR', 'Jo');
    }));

    it('should clear filteredPatients when patient < 2 chars', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      component.filteredPatients.set([{ patientName: 'Test', orderNo: null }]);
      component.filterForm.get('patient')!.setValue('J');
      tick(500);
      expect(component.filteredPatients()).toEqual([]);
    }));

    it('should reload order numbers when patient changes', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      serviceSpy.getOrderNoLov.calls.reset();
      component.filterForm.get('patient')!.setValue('John');
      tick(500);
      expect(serviceSpy.getOrderNoLov).toHaveBeenCalledWith('C1', 'CR', 'John');
    }));

    it('should not reload order numbers when customerId is missing', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: null, tranType: 'CR' });
      serviceSpy.getOrderNoLov.calls.reset();
      component.filterForm.get('patient')!.setValue('John');
      tick(500);
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
    }));

    it('should not load patient LOV when patient is null', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      serviceSpy.getPatientLov.calls.reset();
      component.filterForm.get('patient')!.setValue(null);
      tick(500);
      expect(serviceSpy.getPatientLov).not.toHaveBeenCalled();
    }));

    it('should not load patient or order LOV when tranType is missing', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: null });
      serviceSpy.getOrderNoLov.calls.reset();
      serviceSpy.getPatientLov.calls.reset();
      component.filterForm.get('patient')!.setValue('John');
      tick(500);
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
      expect(serviceSpy.getPatientLov).not.toHaveBeenCalled();
    }));
  });

  describe('requestedBy search filter', () => {
    it('should filter requestedBy options by search term', fakeAsync(() => {
      component.requestedByOptions.set([
        { contactName: 'Alice Smith' },
        { contactName: 'Bob Jones' }
      ]);
      component.requestedBySearchCtrl.setValue('alice');
      tick(300);
      expect(component.filteredRequestedBy().length).toBe(1);
      expect(component.filteredRequestedBy()[0].contactName).toBe('Alice Smith');
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      component.requestedByOptions.set([
        { contactName: 'Alice Smith' },
        { contactName: 'Bob Jones' }
      ]);
      component.requestedBySearchCtrl.setValue('');
      tick(300);
      expect(component.filteredRequestedBy().length).toBe(2);
    }));

    it('should handle null search term', fakeAsync(() => {
      component.requestedByOptions.set([
        { contactName: 'Alice Smith' }
      ]);
      component.requestedBySearchCtrl.setValue(null as any);
      tick(300);
      expect(component.filteredRequestedBy().length).toBe(1);
    }));
  });

  describe('saveCurrentEntry - direct invalid form guard', () => {
    it('should mark form touched and return when called directly with invalid form', () => {
      component.entryForm.patchValue({ serviceCode: null, amount: null, reasonCode: null });
      (component as any).saveCurrentEntry();
      expect(component.entryForm.touched).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('onCustomerChange - with patient set', () => {
    it('should pass patient name to loadOrderNos', () => {
      component.customers.set([{ code: 'C1', description: 'Cust' }]);
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB', patient: 'Smith' });
      serviceSpy.getOrderNoLov.calls.reset();
      component.onCustomerChange();
      expect(serviceSpy.getOrderNoLov).toHaveBeenCalledWith('C1', 'DB', 'Smith');
    });
  });

  describe('onTranTypeChange - with patient set', () => {
    it('should pass patient name to loadOrderNos', () => {
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR', patient: 'Jones' });
      serviceSpy.getOrderNoLov.calls.reset();
      component.onTranTypeChange();
      expect(serviceSpy.getOrderNoLov).toHaveBeenCalledWith('C1', 'CR', 'Jones');
    });

    it('should not load order nos when customerId is missing', () => {
      serviceSpy.getOrderNoLov.calls.reset();
      component.filterForm.patchValue({ customerId: null, tranType: 'DB' });
      component.onTranTypeChange();
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderNoValidation', () => {
    it('should set required on orderNo when tranType is CR', () => {
      (component as any).updateOrderNoValidation('CR');
      component.entryForm.get('orderNo')?.setValue(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
      expect(component.entryForm.get('orderNo')?.hasError('required')).toBeTrue();
    });

    it('should clear validators on orderNo when tranType is DB', () => {
      (component as any).updateOrderNoValidation('DB');
      component.entryForm.get('orderNo')?.setValue(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
      expect(component.entryForm.get('orderNo')?.valid).toBeTrue();
    });

    it('should clear validators on orderNo when tranType is null', () => {
      (component as any).updateOrderNoValidation(null);
      component.entryForm.get('orderNo')?.setValue(null);
      component.entryForm.get('orderNo')?.updateValueAndValidity();
      expect(component.entryForm.get('orderNo')?.valid).toBeTrue();
    });

    it('should return early when entryForm is null', () => {
      const original = component.entryForm;
      (component as any).entryForm = null;
      expect(() => (component as any).updateOrderNoValidation('CR')).not.toThrow();
      (component as any).entryForm = original;
    });
  });

  describe('pageHeaderConfig', () => {
    it('should have default breadcrumbs', () => {
      expect(component.pageHeaderConfig.breadcrumbs).toBeTruthy();
      expect(component.pageHeaderConfig.breadcrumbs!.length).toBeGreaterThanOrEqual(1);
    });

    it('should update from pageHeaderData signal when data exists', () => {
      (pageHeaderSpy as any).pageHeaderData = signal({ title: 'Test Title', subtitle: 'Test Sub' });
      fixture = TestBed.createComponent(OrderServicesDebitCreditComponent);
      const comp = fixture.componentInstance;
      (comp as any).service = serviceSpy;
      (comp as any).snackbarService = snackbarSpy;
      (comp as any).dialog = dialogSpy;
      (comp as any).chapterTimezone = chapterTimezoneSpy;
      fixture.detectChanges();
      expect(comp.pageHeaderConfig.title).toBe('Test Title');
      expect(comp.pageHeaderConfig.subtitle).toBe('Test Sub');
    });
  });

  describe('onCustomerChange - without customerId', () => {
    it('should handle when customerId is not set at all', () => {
      component.filterForm.patchValue({ customerId: null, tranType: null, patient: null });
      serviceSpy.getOrderNoLov.calls.reset();
      serviceSpy.getRequestedByLov.calls.reset();
      component.onCustomerChange();
      expect(component.selectedCustomerName()).toBeNull();
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
      expect(serviceSpy.getRequestedByLov).not.toHaveBeenCalled();
    });

    it('should handle when filterForm.get returns null', () => {
      const mockForm = { get: () => null, reset: () => {} } as any;
      component.filterForm = mockForm;
      expect(() => component.onCustomerChange()).not.toThrow();
      expect(component.selectedCustomerName()).toBeNull();
    });
  });

  describe('onTranTypeChange - no tranType no customerId', () => {
    it('should handle when both are null', () => {
      component.filterForm.patchValue({ customerId: null, tranType: null });
      serviceSpy.getReasonCodeLov.calls.reset();
      serviceSpy.getOrderNoLov.calls.reset();
      component.onTranTypeChange();
      expect(serviceSpy.getReasonCodeLov).not.toHaveBeenCalled();
      expect(serviceSpy.getOrderNoLov).not.toHaveBeenCalled();
    });

    it('should handle when filterForm.get returns null', () => {
      const mockForm = { get: () => null, reset: () => {} } as any;
      component.filterForm = mockForm;
      expect(() => component.onTranTypeChange()).not.toThrow();
    });
  });

  describe('onOrderNoChange - when form.get returns null', () => {
    it('should handle when filterForm.get returns null', () => {
      const mockForm = { get: () => null } as any;
      component.filterForm = mockForm;
      serviceSpy.getServiceCodeLov.calls.reset();
      expect(() => component.onOrderNoChange()).not.toThrow();
      expect(serviceSpy.getServiceCodeLov).not.toHaveBeenCalled();
    });

    it('should handle when entryForm.get returns null', () => {
      const mockForm = { get: () => null, getRawValue: () => ({}) } as any;
      component.entryForm = mockForm;
      serviceSpy.getServiceCodeLov.calls.reset();
      expect(() => component.onOrderNoChange()).not.toThrow();
    });
  });

  describe('onServiceCodeChange - when entryForm.get returns null', () => {
    it('should handle null from form.get gracefully', () => {
      const mockForm = { get: () => null } as any;
      component.entryForm = mockForm;
      expect(() => component.onServiceCodeChange()).not.toThrow();
    });
  });

  describe('onReasonCodeChange - when entryForm.get returns null', () => {
    it('should handle null from form.get gracefully', () => {
      const mockForm = { get: () => null } as any;
      component.entryForm = mockForm;
      expect(() => component.onReasonCodeChange()).not.toThrow();
      expect(component.selectedReasonDesc()).toBeNull();
    });
  });

  describe('table configuration', () => {
    it('should have correct table columns', () => {
      const columnKeys = component.tableConfig.columns.map((c: any) => c.key);
      expect(columnKeys).toEqual([
        'orderNo', 'serviceCode', 'quantity', 'requestedBy', 'requestDate',
        'amount', 'reasonCode', 'reasonDescription'
      ]);
    });

    it('should have correct page size options', () => {
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should have row actions with enterNotes', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('enterNotes');
      expect(component.tableConfig.rowActions![0].label).toBe('Enter Notes');
      expect(component.tableConfig.rowActions![0].icon).toBe('note_add');
    });

    it('should show actions as menu', () => {
      expect(component.tableConfig.showActionsAsMenu).toBeTrue();
    });

    it('should have sticky header enabled', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should have pagination enabled', () => {
      expect(component.tableConfig.showPagination).toBeTrue();
    });

    it('should have correct pagination defaults', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBeTrue();
    });

    it('should have correct empty state messages', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Records Yet');
      expect(component.tableConfig.emptySubMessage).toBe('Fill in the entry form and press Tab on Reason to add a record.');
      expect(component.tableConfig.noDataIcon).toBe('inbox');
    });

    it('should have row highlight disabled', () => {
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
    });
  });

  describe('paginatedRecords', () => {
    it('should return first page of records', () => {
      component.records.set([
        { orderNo: '1' }, { orderNo: '2' }, { orderNo: '3' }
      ]);
      component.pageIndex.set(0);
      component.pageSize.set(2);
      expect(component.paginatedRecords().length).toBe(2);
      expect(component.paginatedRecords()[0].orderNo).toBe('1');
      expect(component.paginatedRecords()[1].orderNo).toBe('2');
    });

    it('should return second page of records', () => {
      component.records.set([
        { orderNo: '1' }, { orderNo: '2' }, { orderNo: '3' }
      ]);
      component.pageIndex.set(1);
      component.pageSize.set(2);
      expect(component.paginatedRecords().length).toBe(1);
      expect(component.paginatedRecords()[0].orderNo).toBe('3');
    });

    it('should return empty array when no records', () => {
      component.records.set([]);
      component.pageIndex.set(0);
      component.pageSize.set(10);
      expect(component.paginatedRecords()).toEqual([]);
    });
  });

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize signals', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 0 });
      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(25);
    });

    it('should update tableConfig pagination', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 50, previousPageIndex: 1 });
      expect(component.tableConfig.pagination?.pageIndex).toBe(3);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });
  });

  describe('onRowAction', () => {
    it('should delegate enterNotes action to onRowEnterNotes', () => {
      const row = { adviceId: 'CM1-000001', orderNo: 'ORD1' };
      serviceSpy.getNote.and.returnValue(of({ noteText: 'test' }));
      component.onRowAction({ action: 'enterNotes', row });
      expect(serviceSpy.getNote).toHaveBeenCalledWith('CM1-000001');
    });

    it('should ignore unknown actions', () => {
      const row = { adviceId: 'CM1-000001' };
      component.onRowAction({ action: 'unknownAction', row });
      expect(serviceSpy.getNote).not.toHaveBeenCalled();
    });
  });

  describe('tableConfig pagination reset', () => {
    it('should reset pagination pageIndex on fullReset', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.clearAll();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should reset pagination pageIndex on onCustomerChange', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.customers.set([{ code: 'C1', description: 'Cust1' }]);
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.onCustomerChange();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should reset pagination pageIndex on onTranTypeChange', () => {
      component.tableConfig.pagination!.pageIndex = 4;
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'CR' });
      component.onTranTypeChange();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format valid ISO date string', () => {
      expect(component.formatDate('2026-08-04')).toBe('04-AUG-2026');
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('column valueFormatters', () => {
    it('should format amount to 2 decimal places', () => {
      const amountCol = component.tableConfig.columns.find((c: any) => c.key === 'amount');
      expect(amountCol?.valueFormatter?.(25, {})).toBe('25.00');
      expect(amountCol?.valueFormatter?.(0.5, {})).toBe('0.50');
    });

    it('should return dash for null amount', () => {
      const amountCol = component.tableConfig.columns.find((c: any) => c.key === 'amount');
      expect(amountCol?.valueFormatter?.(null, {})).toBe('-');
    });

    it('should format requestDate column', () => {
      const dateCol = component.tableConfig.columns.find((c: any) => c.key === 'requestDate');
      expect(dateCol?.valueFormatter?.('2026-08-04', {})).toBe('04-AUG-2026');
    });

    it('should return empty string for null requestDate', () => {
      const dateCol = component.tableConfig.columns.find((c: any) => c.key === 'requestDate');
      expect(dateCol?.valueFormatter?.(null, {})).toBe('');
    });

    it('should format zero amount', () => {
      const amountCol = component.tableConfig.columns.find((c: any) => c.key === 'amount');
      expect(amountCol?.valueFormatter?.(0, {})).toBe('0.00');
    });
  });

  describe('entry form validators', () => {
    it('should default quantity to 1', () => {
      expect(component.entryForm.get('quantity')?.value).toBe(1);
    });

    it('should reject quantity less than 1', () => {
      component.entryForm.patchValue({ quantity: 0 });
      expect(component.entryForm.get('quantity')?.valid).toBeFalse();
    });

    it('should reject quantity greater than 999', () => {
      component.entryForm.patchValue({ quantity: 1000 });
      expect(component.entryForm.get('quantity')?.valid).toBeFalse();
    });

    it('should accept quantity of 1', () => {
      component.entryForm.patchValue({ quantity: 1 });
      expect(component.entryForm.get('quantity')?.valid).toBeTrue();
    });

    it('should accept quantity of 999', () => {
      component.entryForm.patchValue({ quantity: 999 });
      expect(component.entryForm.get('quantity')?.valid).toBeTrue();
    });

    it('should require quantity', () => {
      component.entryForm.patchValue({ quantity: null });
      expect(component.entryForm.get('quantity')?.valid).toBeFalse();
    });

    it('should not require requestedBy (optional per FMB)', () => {
      component.entryForm.patchValue({ requestedBy: null });
      expect(component.entryForm.get('requestedBy')?.valid).toBeTrue();
    });

    it('should accept requestedBy value when provided', () => {
      component.entryForm.patchValue({ requestedBy: 'Wilson, Cary' });
      expect(component.entryForm.get('requestedBy')?.valid).toBeTrue();
    });

    it('should require amount', () => {
      component.entryForm.patchValue({ amount: null });
      expect(component.entryForm.get('amount')?.valid).toBeFalse();
    });

    it('should reject amount of 0', () => {
      component.entryForm.patchValue({ amount: 0 });
      expect(component.entryForm.get('amount')?.valid).toBeFalse();
    });

    it('should accept amount of 0.01', () => {
      component.entryForm.patchValue({ amount: 0.01 });
      expect(component.entryForm.get('amount')?.valid).toBeTrue();
    });

    it('should require serviceCode', () => {
      component.entryForm.patchValue({ serviceCode: null });
      expect(component.entryForm.get('serviceCode')?.valid).toBeFalse();
    });

    it('should require reasonCode', () => {
      component.entryForm.patchValue({ reasonCode: null });
      expect(component.entryForm.get('reasonCode')?.valid).toBeFalse();
    });

    it('should require requestDate', () => {
      component.entryForm.patchValue({ requestDate: null });
      expect(component.entryForm.get('requestDate')?.valid).toBeFalse();
    });

    it('should not require orderNo by default (DB)', () => {
      component.entryForm.patchValue({ orderNo: null });
      expect(component.entryForm.get('orderNo')?.valid).toBeTrue();
    });
  });

  describe('resetEntrySection', () => {
    it('should reset quantity to default of 1', () => {
      component.entryForm.patchValue({ quantity: 50 });
      (component as any).resetEntrySection();
      expect(component.entryForm.get('quantity')?.value).toBe(1);
    });

    it('should clear requestedBy', () => {
      component.entryForm.patchValue({ requestedBy: 'Someone' });
      (component as any).resetEntrySection();
      expect(component.entryForm.get('requestedBy')?.value).toBeNull();
    });

    it('should reset amountEditable to true', () => {
      component.amountEditable.set(false);
      (component as any).resetEntrySection();
      expect(component.amountEditable()).toBeTrue();
    });

    it('should reset selectedReasonDesc to null', () => {
      component.selectedReasonDesc.set('Some Reason');
      (component as any).resetEntrySection();
      expect(component.selectedReasonDesc()).toBeNull();
    });

    it('should preserve orderNo required validator when tranType is CR', () => {
      component.filterForm.patchValue({ tranType: 'CR' });
      (component as any).resetEntrySection();
      component.entryForm.patchValue({ orderNo: null });
      expect(component.entryForm.get('orderNo')?.valid).toBeFalse();
    });

    it('should not require orderNo when tranType is DB', () => {
      component.filterForm.patchValue({ tranType: 'DB' });
      (component as any).resetEntrySection();
      component.entryForm.patchValue({ orderNo: null });
      expect(component.entryForm.get('orderNo')?.valid).toBeTrue();
    });
  });

  describe('totalRecords sync effect', () => {
    it('should sync records length to pagination totalRecords', () => {
      component.records.set([{ a: 1 }, { a: 2 }, { a: 3 }]);
      fixture.detectChanges();
      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
    });

    it('should update totalRecords when records are cleared', () => {
      component.records.set([{ a: 1 }, { a: 2 }]);
      fixture.detectChanges();
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
      component.records.set([]);
      fixture.detectChanges();
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  describe('saveCurrentEntry DTO construction', () => {
    let mockEvent: Event;

    beforeEach(() => {
      mockEvent = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.filterForm.patchValue({ customerId: 'C1', tranType: 'DB' });
      component.entryForm.patchValue({
        orderNo: null,
        serviceCode: 'SVC1',
        quantity: 5,
        requestedBy: 'Test User',
        amount: 100,
        reasonCode: 'RC1'
      });
    });

    it('should include quantity in DTO', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.quantity).toBe(5);
    });

    it('should map empty requestedBy to null', () => {
      component.entryForm.patchValue({ requestedBy: '' });
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.requestedBy).toBeNull();
    });

    it('should pass requestedBy when provided', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', total: 0 } as any));
      component.onReasonTabPress(mockEvent);
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.requestedBy).toBe('Test User');
    });

    it('should include quantity in appended record', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(component.records()[0].quantity).toBe(5);
    });

    it('should include requestedBy in appended record', () => {
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(component.records()[0].requestedBy).toBe('Test User');
    });

    it('should include reasonDescription in appended record', () => {
      component.selectedReasonDesc.set('Bad Address');
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      serviceSpy.create.and.returnValue(of({ success: true, data: [{ adviceId: 'ADV1' }], statusCode: 200, message: '', total: 1 } as any));
      component.onReasonTabPress(mockEvent);
      expect(component.records()[0].reasonDescription).toBe('Bad Address');
    });
  });

  describe('onRowAction integration', () => {
    it('should show error via onRowAction when row has no adviceId', () => {
      component.onRowAction({ action: 'enterNotes', row: { adviceId: null } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot add notes: record has no Advice ID yet');
    });

    it('should show error via onRowAction when adviceId is undefined', () => {
      component.onRowAction({ action: 'enterNotes', row: {} });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot add notes: record has no Advice ID yet');
    });

    it('should fetch note via onRowAction when adviceId exists', () => {
      serviceSpy.getNote.and.returnValue(of({ noteText: 'hello' }));
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      component.onRowAction({ action: 'enterNotes', row: { adviceId: 'CM1-000001' } });
      expect(serviceSpy.getNote).toHaveBeenCalledWith('CM1-000001');
    });
  });
});
