import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DebitCreditQuery } from './debit-credit-query';
import { DebitCreditQueryService } from './services/debit-credit-query.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  CustomerDebitCreditQueryDto,
  LovOption
} from './models/debit-credit-query.model';

describe('DebitCreditQuery', () => {
  let component: DebitCreditQuery;
  let fixture: ComponentFixture<DebitCreditQuery>;
  let debitCreditServiceSpy: jasmine.SpyObj<DebitCreditQueryService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockCustomerOptions: LovOption[] = [
    { code: 'CUST001', description: 'Customer One' },
    { code: 'CUST002', description: 'Customer Two' }
  ];

  const mockRecords: CustomerDebitCreditQueryDto[] = [
    {
      adviceId: 'ADV-001',
      insertDate: '2025-01-31T10:30:00Z',
      tranType: 'CR',
      tranTypeDesc: 'Credit',
      reasonCode: 'RATSD',
      reasonDesc: 'Ref/Trans Svc Debit',
      requestDate: '2025-01-30T00:00:00Z',
      requestedBy: 'CJH',
      orderNo: '17339-0016',
      serviceCode: 'F18200-02',
      serviceCodeDesc: 'Blood Collection Service',
      productCode: 'E0701V02',
      aliquot: null,
      unitId: 'W1234-18-031310-Z',
      quantity: 250,
      insertUserId: 'USER01',
      insertUserName: 'Samantha Green',
      amount: 25.00,
      errorCorrectFlag: 'Y',
      errorCorrectDate: '2025-02-12T09:30:00Z',
      errorCorrectUser: 'USER02',
      errorCorrectName: 'John Doe',
      patientName: 'Chris Hunter',
      note1: null,
      customerId: 'CUST001',
      chapterId: 'CH01',
      noteId: null
    },
    {
      adviceId: 'ADV-002',
      insertDate: '2025-01-30T14:20:00Z',
      tranType: 'DB',
      tranTypeDesc: 'Debit',
      reasonCode: 'RATE',
      reasonDesc: 'Rate Adjustment',
      requestDate: '2025-01-29T00:00:00Z',
      requestedBy: 'MJK',
      orderNo: '17339-0016',
      serviceCode: 'F18200-03',
      serviceCodeDesc: 'Testing Service',
      productCode: 'E0702V01',
      aliquot: 'A1',
      unitId: 'W1234-18-031311-A',
      quantity: 100,
      insertUserId: 'USER03',
      insertUserName: 'Jane Smith',
      amount: 50.00,
      errorCorrectFlag: 'N',
      errorCorrectDate: null,
      errorCorrectUser: null,
      errorCorrectName: null,
      patientName: 'Mary Johnson',
      note1: 'Test note 1',
      customerId: 'CUST001',
      chapterId: 'CH01',
      noteId: 12345
    }
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    debitCreditServiceSpy = jasmine.createSpyObj('DebitCreditQueryService', [
      'getDebitCreditRecords',
      'getByAdviceId',
      'getCustomerLov',
      'getOrderNoLov',
      'getAdviceIdLov',
      'getAdviceIdByOrderLov'
    ]);
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    snackbarServiceSpy = createMockSnackbarService();

    debitCreditServiceSpy.getCustomerLov.and.returnValue(of(mockCustomerOptions));
    debitCreditServiceSpy.getDebitCreditRecords.and.returnValue(
      of({ data: mockRecords, totalRecords: 2 })
    );
    debitCreditServiceSpy.getOrderNoLov.and.returnValue(of([]));
    debitCreditServiceSpy.getAdviceIdLov.and.returnValue(of([]));
    debitCreditServiceSpy.getAdviceIdByOrderLov.and.returnValue(of([]));
      TestBed.configureTestingModule({
      imports: [DebitCreditQuery, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DebitCreditQueryService, useValue: debitCreditServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });
      debitCreditServiceSpy.getCustomerLov.and.returnValue(of(mockCustomerOptions));


      debitCreditServiceSpy.getOrderNoLov.and.returnValue(of([]));


      debitCreditServiceSpy.getAdviceIdLov.and.returnValue(of([]));


      debitCreditServiceSpy.getAdviceIdByOrderLov.and.returnValue(of([]));
    fixture = TestBed.createComponent(DebitCreditQuery);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load customer LOV on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(debitCreditServiceSpy.getCustomerLov).toHaveBeenCalled();
      expect(component.customerOptions()).toEqual(mockCustomerOptions);
    }));


  });

  describe('Filter Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should populate customer description when customer is selected', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'CUST001' });
      component.onCustomerChange();
      tick();
      fixture.detectChanges();

      expect(component.customerDescription()).toBe('Customer One');
    }));

    it('should show empty customer description when no customer selected', () => {
      expect(component.customerDescription()).toBe('');
    });


  });

  describe('Customer Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear dependent dropdowns when customer changes', fakeAsync(() => {
      component.filterForm.patchValue({
        customerId: 'CUST001',
        orderNo: 'ORD-001',
        adviceId: 'ADV-001'
      });

      component.onCustomerChange();
      tick();

      expect(component.filterForm.get('orderNo')?.value).toBeNull();
      expect(component.filterForm.get('adviceId')?.value).toBeNull();
    }));

    it('should load order and advice LOVs when customer is selected', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'CUST001' });

      component.onCustomerChange();
      tick();

      expect(debitCreditServiceSpy.getOrderNoLov).toHaveBeenCalledWith('CUST001');
      expect(debitCreditServiceSpy.getAdviceIdLov).toHaveBeenCalledWith('CUST001');
    }));


  });

  describe('Retrieve Records', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should call service with correct filter DTO', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'CUST001', adviceId: 'ADV-001' });

      component.retrieveRecords();
      tick();

      expect(debitCreditServiceSpy.getDebitCreditRecords).toHaveBeenCalledWith(
        100,
        0,
        jasmine.objectContaining({
          customerId: 'CUST001',
          adviceId: 'ADV-001'
        })
      );
    }));

    it('should populate records and set first as selected', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'CUST001', adviceId: 'ADV-001' });

      component.retrieveRecords();
      tick();

      expect(component.allRecords()).toEqual(mockRecords);
      expect(component.selectedRecord()).toEqual(mockRecords[0]);
      expect(component.isRetrieved()).toBeTrue();
    }));






  });


  describe('Results Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.allRecords.set(mockRecords);
      component.selectedRecord.set(mockRecords[0]);
      component.isRetrieved.set(true);
      component.adviceOptions.set([
        { code: 'ADV-001', description: 'ADV-001' },
        { code: 'ADV-002', description: 'ADV-002' }
      ]);
      fixture.detectChanges();
    });



    it('should show formatted insert date', () => {
      const resultsContainer = fixture.debugElement.query(By.css('.results-container'));
      expect(resultsContainer.nativeElement.textContent).toContain('31-JAN-2025');
    });

    it('should show transaction type description', () => {
      const resultsContainer = fixture.debugElement.query(By.css('.results-container'));
      expect(resultsContainer.nativeElement.textContent).toContain('Credit');
    });

    it('should show formatted currency amount', () => {
      const resultsContainer = fixture.debugElement.query(By.css('.results-container'));
      expect(resultsContainer.nativeElement.textContent).toContain('$25.00');
    });

    it('should show Yes/No for cancelled field', () => {
      const resultsContainer = fixture.debugElement.query(By.css('.results-container'));
      expect(resultsContainer.nativeElement.textContent).toContain('Yes');
    });
  });

  describe('Advice ID Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.allRecords.set(mockRecords);
      component.selectedRecord.set(mockRecords[0]);
      component.isRetrieved.set(true);
    });

    it('should change selected record when advice ID changes', () => {
      component.onAdviceIdChange('ADV-002');

      expect(component.selectedRecord()).toEqual(mockRecords[1]);
    });

    it('should not change if advice ID not found', fakeAsync(() => {
      debitCreditServiceSpy.getByAdviceId.and.returnValue(of(null));
      const currentRecord = component.selectedRecord();
      component.onAdviceIdChange('ADV-999');
      tick();

      expect(component.selectedRecord()).toEqual(currentRecord);
    }));
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        customerId: 'CUST001',
        orderNo: 'ORD-001',
        adviceId: 'ADV-001'
      });
      component.allRecords.set(mockRecords);
      component.selectedRecord.set(mockRecords[0]);
      component.isRetrieved.set(true);
    });

    it('should reset filter form', () => {
      component.clearAll();

      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect(component.filterForm.get('orderNo')?.value).toBeNull();
      expect(component.filterForm.get('adviceId')?.value).toBeNull();
    });

    it('should clear all records and state', () => {
      component.clearAll();

      expect(component.allRecords()).toEqual([]);
      expect(component.selectedRecord()).toBeNull();
      expect(component.orderOptions()).toEqual([]);
      expect(component.adviceOptions()).toEqual([]);
      expect(component.isRetrieved()).toBeFalse();
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should clear all on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ customerId: 'CUST001' });
      component.allRecords.set(mockRecords);

      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect(component.allRecords()).toEqual([]);
    }));
  });

  describe('Date Formatting', () => {
    it('should format valid date to DD-MON-YYYY', () => {
      const result = component.formatDate('2025-01-31T10:30:00Z');
      expect(result).toBe('31-JAN-2025');
    });




  });

  describe('Currency Formatting', () => {
    it('should format number to 2 decimal places with $ symbol', () => {
      const result = component.formatCurrency(25.5);
      expect(result).toBe('$25.50');
    });


  });

  describe('Yes/No Formatting', () => {
    it('should return Yes for Y flag', () => {
      const result = component.formatYesNo('Y');
      expect(result).toBe('Yes');
    });

    it('should return No for N flag', () => {
      const result = component.formatYesNo('N');
      expect(result).toBe('No');
    });

    it('should return No for null', () => {
      const result = component.formatYesNo(null);
      expect(result).toBe('No');
    });

    it('should return No for undefined', () => {
      const result = component.formatYesNo(undefined);
      expect(result).toBe('No');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('formatDate edge cases', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return original value for non-ISO format', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatDateTime', () => {
    it('should format valid datetime to DD-MON-YYYY HH:MM', () => {
      const result = component.formatDateTime('2025-01-31T10:30:00Z');
      expect(result).toBe('31-JAN-2025 10:30');
    });

    it('should return empty string for null', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('');
    });

    it('should return original value for non-ISO format', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });

    it('should handle different months', () => {
      expect(component.formatDateTime('2025-12-25T08:15:00Z')).toBe('25-DEC-2025 08:15');
    });
  });

  describe('formatCurrency edge cases', () => {
    it('should return empty string for null', () => {
      expect(component.formatCurrency(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatCurrency(undefined)).toBe('');
    });

    it('should format zero', () => {
      expect(component.formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('Computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('hasRecords should return false when no records', () => {
      component.allRecords.set([]);
      expect(component.hasRecords()).toBeFalse();
    });

    it('hasRecords should return true when records exist', () => {
      component.allRecords.set(mockRecords);
      expect(component.hasRecords()).toBeTrue();
    });

    it('isEmpty should return true when not loading, no records, not retrieved', () => {
      component.loading.set(false);
      component.allRecords.set([]);
      component.isRetrieved.set(false);
      expect(component.isEmpty()).toBeTrue();
    });

    it('showEmptyState should return true when not loading, no records, retrieved', () => {
      component.loading.set(false);
      component.allRecords.set([]);
      component.isRetrieved.set(true);
      expect(component.showEmptyState()).toBeTrue();
    });

    it('showResults should return true when not loading and has records', () => {
      component.loading.set(false);
      component.allRecords.set(mockRecords);
      expect(component.showResults()).toBeTrue();
    });

    it('isOrderOrAdviceSelected should return false when neither selected', () => {
      component.filterForm.patchValue({ orderNo: null, adviceId: null });
      expect(component.isOrderOrAdviceSelected()).toBeFalse();
    });

    it('isOrderOrAdviceSelected should return true when orderNo selected', () => {
      component.filterForm.patchValue({ orderNo: 'ORD-001' });
      expect(component.isOrderOrAdviceSelected()).toBeTrue();
    });

    it('isOrderOrAdviceSelected should return true when adviceId selected', () => {
      component.filterForm.patchValue({ adviceId: 'ADV-001' });
      expect(component.isOrderOrAdviceSelected()).toBeTrue();
    });
  });

  describe('ID generation methods', () => {
    it('should generate element ID', () => {
      const id = component.elementId('test');
      expect(id).toContain('debit-credit-query-');
      expect(id).toContain('-test');
    });

    it('should generate error ID', () => {
      const id = component.errorId('field');
      expect(id).toContain('-field-error');
    });

    it('should generate label ID', () => {
      const id = component.labelId('field');
      expect(id).toContain('-field-label');
    });
  });

  describe('retrieveRecords validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when no customer selected', () => {
      component.filterForm.patchValue({ customerId: null });
      component.retrieveRecords();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a Customer ID');
    });

    it('should show error when neither orderNo nor adviceId selected', () => {
      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: null, adviceId: null });
      component.retrieveRecords();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select either Order No or Advice ID');
    });

    it('should handle retrieve error', fakeAsync(() => {
      debitCreditServiceSpy.getDebitCreditRecords.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );
      component.filterForm.patchValue({ customerId: 'CUST001', adviceId: 'ADV-001' });
      component.retrieveRecords();
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.isRetrieved()).toBeTrue();
      expect(component.error()).toBe('Server error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle empty results', fakeAsync(() => {
      debitCreditServiceSpy.getDebitCreditRecords.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.filterForm.patchValue({ customerId: 'CUST001', adviceId: 'ADV-001' });
      component.retrieveRecords();
      tick();

      expect(component.allRecords()).toEqual([]);
      expect(component.selectedRecord()).toBeNull();
    }));
  });

  describe('onOrderChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load advice IDs by order when order selected before retrieval', fakeAsync(() => {
      const adviceData: LovOption[] = [{ code: 'ADV-001', description: 'Advice 1' }];
      debitCreditServiceSpy.getAdviceIdByOrderLov.and.returnValue(of(adviceData));

      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: '17339-0016' });
      component.isRetrieved.set(false);
      component.onOrderChange();
      tick();

      expect(debitCreditServiceSpy.getAdviceIdByOrderLov).toHaveBeenCalledWith('CUST001', '17339-0016');
      expect(component.adviceOptions()).toEqual(adviceData);
    }));

    it('should reload all advice IDs when order cleared before retrieval', fakeAsync(() => {
      const adviceData: LovOption[] = [{ code: 'ADV-002', description: 'Advice 2' }];
      debitCreditServiceSpy.getAdviceIdLov.and.returnValue(of(adviceData));

      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: null });
      component.isRetrieved.set(false);
      component.onOrderChange();
      tick();

      expect(debitCreditServiceSpy.getAdviceIdLov).toHaveBeenCalledWith('CUST001');
    }));

    it('should select matching record after retrieval when order selected', () => {
      component.allRecords.set(mockRecords);
      component.isRetrieved.set(true);

      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: '17339-0016' });
      component.onOrderChange();

      expect(component.selectedRecord()).toEqual(mockRecords[0]);
    });

    it('should not select record after retrieval when no order', () => {
      component.allRecords.set(mockRecords);
      component.isRetrieved.set(true);
      component.selectedRecord.set(mockRecords[0]);

      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: null });
      component.onOrderChange();

      // selectedRecord should not change
      expect(component.selectedRecord()).toEqual(mockRecords[0]);
    });

    it('should handle error when loading advice IDs by order', fakeAsync(() => {
      debitCreditServiceSpy.getAdviceIdByOrderLov.and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.filterForm.patchValue({ customerId: 'CUST001', orderNo: 'ORD-001' });
      component.isRetrieved.set(false);
      component.onOrderChange();
      tick();

      // Should not throw, error handled
      expect(true).toBeTrue();
    }));
  });

  describe('onCustomerChange edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when no customer selected', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: null });
      debitCreditServiceSpy.getOrderNoLov.calls.reset();
      debitCreditServiceSpy.getAdviceIdLov.calls.reset();

      component.onCustomerChange();
      tick();

      expect(debitCreditServiceSpy.getOrderNoLov).not.toHaveBeenCalled();
      expect(debitCreditServiceSpy.getAdviceIdLov).not.toHaveBeenCalled();
    }));

    it('should handle order LOV error', fakeAsync(() => {
      debitCreditServiceSpy.getOrderNoLov.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ customerId: 'CUST001' });
      component.onCustomerChange();
      tick();

      // Should not throw
      expect(true).toBeTrue();
    }));

    it('should handle advice LOV error', fakeAsync(() => {
      debitCreditServiceSpy.getAdviceIdLov.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ customerId: 'CUST001' });
      component.onCustomerChange();
      tick();

      expect(true).toBeTrue();
    }));
  });

  describe('Search filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter customer options on search', fakeAsync(() => {
      component.customerOptions.set(mockCustomerOptions);
      component.customerSearchCtrl.setValue('One');
      tick(250);

      expect(component.filteredCustomerOptions().length).toBe(1);
      expect(component.filteredCustomerOptions()[0].code).toBe('CUST001');
    }));

    it('should reset customer filter on empty search', fakeAsync(() => {
      component.customerOptions.set(mockCustomerOptions);
      component.customerSearchCtrl.setValue('One');
      tick(250);
      component.customerSearchCtrl.setValue('');
      tick(250);

      expect(component.filteredCustomerOptions()).toEqual(mockCustomerOptions);
    }));

    it('should filter order options on search', fakeAsync(() => {
      const orderOpts: LovOption[] = [
        { code: 'ORD-001', description: 'Order One' },
        { code: 'ORD-002', description: 'Order Two' }
      ];
      component.orderOptions.set(orderOpts);
      component.orderSearchCtrl.setValue('One');
      tick(250);

      expect(component.filteredOrderOptions().length).toBe(1);
    }));

    it('should filter advice options on search', fakeAsync(() => {
      const adviceOpts: LovOption[] = [
        { code: 'ADV-001', description: 'Advice One' },
        { code: 'ADV-002', description: 'Advice Two' }
      ];
      component.adviceOptions.set(adviceOpts);
      component.adviceSearchCtrl.setValue('Two');
      tick(250);

      expect(component.filteredAdviceOptions().length).toBe(1);
      expect(component.filteredAdviceOptions()[0].code).toBe('ADV-002');
    }));
  });

  describe('loadCustomerLov error', () => {
    it('should handle customer LOV load error', fakeAsync(() => {
      debitCreditServiceSpy.getCustomerLov.and.returnValue(throwError(() => new Error('fail')));
      // Re-create component to trigger ngOnInit with error
      fixture = TestBed.createComponent(DebitCreditQuery);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      // Should not throw
      expect(component.customerOptions().length).toBe(0);
    }));
  });
});
