import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import moment from 'moment';

import { TransportBatchQuery } from './transport-batch-query';
import { TransportBatchQueryApiService } from './services/transport-batch-query-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  TransportBatchHeaderDto,
  TransportBatchDetailDto,
  WarehouseLookupDto,
  BatchStatusLookupDto,
  RecentBatchDto
} from './models/transport-batch-query.model';

describe('TransportBatchQuery', () => {
  let component: TransportBatchQuery;
  let fixture: ComponentFixture<TransportBatchQuery>;
  let apiServiceSpy: jasmine.SpyObj<TransportBatchQueryApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockWarehouses: WarehouseLookupDto[] = [
    { code: 'A', description: 'Warehouse A' },
    { code: 'B', description: 'Warehouse B' },
    { code: 'C', description: 'Warehouse C' }
  ];

  const mockBatchStatuses: BatchStatusLookupDto[] = [
    { status: 'OPEN' },
    { status: 'CLOSED' },
    { status: 'RECON' }
  ];

  const mockRecentBatches: RecentBatchDto[] = [
    { batchId: 'BATCH001', createDate: '2024-01-15T10:00:00Z' },
    { batchId: 'BATCH002', createDate: '2024-01-14T09:00:00Z' }
  ];

  const mockBatches: TransportBatchHeaderDto[] = [
    {
      batchId: 'BATCH001',
      createDate: '2024-01-15T10:00:00Z',
      batchName: 'Test Batch',
      fromWarehouse: 'A',
      toWarehouse: 'B',
      batchStatus: 'OPEN',
      checkoutTemp: 4.5,
      reconDate: null,
      reconUser: null
    },
    {
      batchId: 'BATCH002',
      createDate: '2024-01-14T09:00:00Z',
      batchName: 'Second Batch',
      fromWarehouse: 'B',
      toWarehouse: 'C',
      batchStatus: 'CLOSED',
      checkoutTemp: -20,
      reconDate: '2024-01-16T12:00:00Z',
      reconUser: 'USER01'
    }
  ];

  const mockBatchDetails: TransportBatchDetailDto[] = [
    {
      unitId: '1234567890123',
      chkDigit: '45',
      productCode: 'RBC001',
      aliquot: '01',
      receiveWarehouse: 'B',
      receiveDate: '2024-01-16T08:00:00Z',
      receiveUser: 'USER01',
      reconReason: null,
      reconDetail: null
    },
    {
      unitId: '1234567890124',
      chkDigit: '67',
      productCode: 'PLT001',
      aliquot: '01',
      receiveWarehouse: 'B',
      receiveDate: '2024-01-16T08:15:00Z',
      receiveUser: 'USER01',
      reconReason: 'DISC',
      reconDetail: 'Unit damaged'
    }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('TransportBatchQueryApiService', [
      'queryBatches',
      'getBatchDetails',
      'getWarehouses',
      'getBatchStatuses',
      'getRecentBatches'
    ]);

    headerServiceSpy = createMockHeaderService();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Transport Batch Query');

    // Set up default spy returns
    apiServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));
    apiServiceSpy.getBatchStatuses.and.returnValue(of(mockBatchStatuses));
    apiServiceSpy.getRecentBatches.and.returnValue(of(mockRecentBatches));
    apiServiceSpy.queryBatches.and.returnValue(of({ data: mockBatches, total: 2 }));
    apiServiceSpy.getBatchDetails.and.returnValue(of({ data: mockBatchDetails, total: 2 }));
      TestBed.configureTestingModule({
      imports: [TransportBatchQuery, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TransportBatchQueryApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      apiServiceSpy.queryBatches.calls.reset();


      apiServiceSpy.getBatchDetails.calls.reset();


      apiServiceSpy.getWarehouses.calls.reset();


      apiServiceSpy.getBatchStatuses.calls.reset();


      apiServiceSpy.getRecentBatches.calls.reset();


      headerServiceSpy.getCurrentChapterTimezone.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('Transport Batch Query');


      apiServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));


      apiServiceSpy.getBatchStatuses.and.returnValue(of(mockBatchStatuses));


      apiServiceSpy.getRecentBatches.and.returnValue(of(mockRecentBatches));


      apiServiceSpy.queryBatches.and.returnValue(of({ data: mockBatches, total: 2 }));


      apiServiceSpy.getBatchDetails.and.returnValue(of({ data: mockBatchDetails, total: 2 }));
    fixture = TestBed.createComponent(TransportBatchQuery);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {






    it('should set chapter timezone', () => {
      fixture.detectChanges();

      expect(headerServiceSpy.getCurrentChapterTimezone).toHaveBeenCalled();
      expect(component.chapterTimezone).toBe('America/New_York');
    });


  });
  describe('Empty State', () => {
    it('should display empty state message', () => {
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();

      const heading = emptyState.query(By.css('h2'));
      expect(heading.nativeElement.textContent).toContain('No Results to Display');
    });


  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should disable RETRIEVE button when fromDate > toDate', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01')
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should validate date range and show error', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01')
      });
      component.filterForm.markAllAsTouched();
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should allow form submission with no dates but with other filter values', () => {
      component.filterForm.patchValue({
        sentFrom: 'A'
      });
      expect(component.isRetrieveDisabled()).toBeFalse();
    });

    it('should allow form submission with all filters empty', () => {
      component.filterForm.reset({
        sentFrom: '', sentTo: '', batchId: '',
        fromDate: null, toDate: null, batchStatus: ''
      });
      expect(component.isRetrieveDisabled()).toBeFalse();
    });
  });

  describe('Retrieve Batches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call API service with correct parameters', fakeAsync(() => {
      component.filterForm.patchValue({
        sentFrom: 'A',
        sentTo: 'B',
        batchId: 'BATCH001',
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
        batchStatus: 'OPEN'
      });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryBatches).toHaveBeenCalledWith(
        jasmine.objectContaining({
          fromWarehouse: 'A',
          toWarehouse: 'B',
          batchId: 'BATCH001',
          fromDate: '2024-01-01',
          toDate: '2024-01-31',
          status: 'OPEN',
          take: 100,
          skip: 0
        })
      );
    }));

    it('should populate batches after successful retrieval', fakeAsync(() => {
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();

      expect(component.batches().length).toBe(2);
      expect(component.batches()[0].batchId).toBe('BATCH001');
      expect(component.showEmptyState()).toBeFalse();
      expect(component.hasRetrievedData()).toBeTrue();
    }));



    it('should auto-select first batch after retrieval', fakeAsync(() => {
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();

      expect(component.selectedBatch()).toBeTruthy();
      expect(component.selectedBatch()?.batchId).toBe('BATCH001');
    }));



    it('should handle empty batch results', fakeAsync(() => {
      apiServiceSpy.queryBatches.and.returnValue(of({ data: [], total: 0 }));
      component.filterForm.patchValue({ sentFrom: 'A' });

      component.onRetrieve();
      tick();

      expect(component.batches().length).toBe(0);
      expect(component.selectedBatch()).toBeNull();
    }));

    it('should auto-populate 30-day date range when all filters empty', fakeAsync(() => {
      component.filterForm.reset({
        sentFrom: '', sentTo: '', batchId: '',
        fromDate: null, toDate: null, batchStatus: ''
      });

      component.onRetrieve();
      tick();

      const formValue = component.filterForm.value;
      expect(formValue.toDate).toBeTruthy();
      expect(formValue.fromDate).toBeTruthy();

      const dayDiff = moment(formValue.toDate).diff(moment(formValue.fromDate), 'days');
      expect(dayDiff).toBe(30);

      expect(apiServiceSpy.queryBatches).toHaveBeenCalled();
    }));

    it('should NOT auto-populate dates when other filters are set but dates empty', fakeAsync(() => {
      component.filterForm.patchValue({
        sentFrom: 'A', sentTo: '', batchId: '',
        fromDate: null, toDate: null, batchStatus: ''
      });

      component.onRetrieve();
      tick();

      const formValue = component.filterForm.value;
      expect(formValue.fromDate).toBeNull();
      expect(formValue.toDate).toBeNull();
      expect(apiServiceSpy.queryBatches).toHaveBeenCalledWith(
        jasmine.objectContaining({ fromDate: undefined, toDate: undefined })
      );
    }));

    it('should handle API errors gracefully', fakeAsync(() => {
      apiServiceSpy.queryBatches.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      component.filterForm.patchValue({ sentFrom: 'A' });

      component.onRetrieve();
      tick();

      expect(component.loadingBatches()).toBeFalse();
      expect(component.error()).toBe('Failed to load batches. Please try again.');
    }));
  });

  describe('Batch Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should select batch and load details', fakeAsync(() => {
      const secondBatch = component.batches()[1];
      component.selectBatch(secondBatch);
      tick();

      expect(component.selectedBatch()?.batchId).toBe('BATCH002');
      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('BATCH002');
    }));



    it('should enrich details with formatted values', fakeAsync(() => {
      component.selectBatch(component.batches()[0]);
      tick();

      const firstDetail = component.batchDetails()[0];
      expect(firstDetail.fullUnitId).toBe('1234567890123-45');
      expect(firstDetail.formattedReceiveDate).toContain('16-JAN-2024');
    }));

    it('should highlight selected batch', fakeAsync(() => {
      const firstBatch = component.batches()[0];
      component.selectBatch(firstBatch);
      tick();
      fixture.detectChanges();

      expect(component.isBatchSelected(firstBatch)).toBeTrue();
      expect(component.isBatchSelected(component.batches()[1])).toBeFalse();
    }));
  });

  describe('Batch Details Table', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();
      component.selectBatch(component.batches()[0]);
      tick();
      fixture.detectChanges();
    }));









    it('should sort in descending order by default', () => {
      // Default sort after loading batch details is descending
      expect(component.currentSortDirection).toBe('D');

      const firstUnit = component.sortedBatchDetails()[0];
      const secondUnit = component.sortedBatchDetails()[1];

      expect(firstUnit.unitId >= secondUnit.unitId).toBeTrue();
    });


  });

  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        sentFrom: 'A',
        sentTo: 'B',
        batchId: 'BATCH001',
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
        batchStatus: 'OPEN'
      });
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));



    it('should clear all data and show empty state', () => {
      component.onClear();

      expect(component.batches().length).toBe(0);
      expect(component.selectedBatch()).toBeNull();
      expect(component.batchDetails().length).toBe(0);
      expect(component.showEmptyState()).toBeTrue();
      expect(component.hasRetrievedData()).toBeFalse();
    });
  });

  describe('Date Formatting', () => {


    it('should format datetime to DD-MMM-YYYY HH:mm', () => {
      const formatted = component.formatDateTime('2024-01-15T10:30:00Z');
      expect(formatted).toContain('15-JAN-2024');
      expect(formatted).toContain(':');
    });



    it('should handle invalid date strings', () => {
      // moment returns 'Invalid date' which gets uppercased to 'INVALID DATE'
      const invalidDate = 'invalid-date';
      expect(component.formatDate(invalidDate)).toBe('INVALID DATE');
    });
  });

  describe('Warehouse Description Lookup', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return warehouse description for valid code', () => {
      const description = component.getWarehouseDescription('A');
      expect(description).toBe('Warehouse A');
    });

    it('should return code if warehouse not found', () => {
      const description = component.getWarehouseDescription('Z');
      expect(description).toBe('Z');
    });


  });



  describe('Unique ID Generation Across Instances', () => {
    it('should generate unique IDs for multiple component instances', () => {
      const fixture2 = TestBed.createComponent(TransportBatchQuery);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
      expect(component['elementId']('field1')).not.toBe(component2['elementId']('field1'));
    });
  });

  describe('isRetrieveDisabled - validation error branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable when fromDate has invalidDate error', () => {
      component.filterForm.get('fromDate')!.setErrors({ invalidDate: true });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when fromDate has matDatepickerParse error', () => {
      component.filterForm.get('fromDate')!.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when fromDate has matDatepickerMax error', () => {
      component.filterForm.get('fromDate')!.setErrors({ matDatepickerMax: { max: moment(), actual: moment() } });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when toDate has invalidDate error', () => {
      component.filterForm.get('toDate')!.setErrors({ invalidDate: true });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when toDate has matDatepickerParse error', () => {
      component.filterForm.get('toDate')!.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when toDate has matDatepickerMax error', () => {
      component.filterForm.get('toDate')!.setErrors({ matDatepickerMax: { max: moment(), actual: moment() } });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should disable when form has dateRangeInvalid error', () => {
      component.filterForm.setErrors({ dateRangeInvalid: true });
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should not disable when valid dates are in correct order', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31')
      });
      expect(component.isRetrieveDisabled()).toBeFalse();
    });
  });

  describe('Auto-populate date range variants', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-populate toDate when only fromDate is set and within 30 days', fakeAsync(() => {
      const fromDate = moment(component.maxDate).subtract(10, 'days');
      component.filterForm.patchValue({ fromDate, sentFrom: 'A' });

      component.onRetrieve();
      tick();

      const toDate = component.filterForm.get('toDate')!.value;
      expect(toDate).toBeTruthy();
      // fromDate + 30 would exceed maxDate, so should be capped at maxDate
      expect(moment(toDate).isSameOrBefore(component.maxDate, 'day')).toBeTrue();
    }));

    it('should auto-populate toDate as fromDate+30 when far in the past', fakeAsync(() => {
      const fromDate = moment(component.maxDate).subtract(90, 'days');
      component.filterForm.patchValue({ fromDate, sentFrom: 'A' });

      component.onRetrieve();
      tick();

      const toDate = component.filterForm.get('toDate')!.value;
      expect(toDate).toBeTruthy();
      const diff = moment(toDate).diff(moment(fromDate), 'days');
      expect(diff).toBe(30);
    }));

    it('should auto-populate fromDate when only toDate is set', fakeAsync(() => {
      const toDate = moment('2024-01-31');
      component.filterForm.patchValue({ toDate, sentFrom: 'A' });

      component.onRetrieve();
      tick();

      const fromDate = component.filterForm.get('fromDate')!.value;
      expect(fromDate).toBeTruthy();
      const diff = moment(toDate).diff(moment(fromDate), 'days');
      expect(diff).toBe(30);
    }));

    it('should not modify dates when both are already set', fakeAsync(() => {
      const fromDate = moment('2024-01-01');
      const toDate = moment('2024-01-15');
      component.filterForm.patchValue({ fromDate, toDate });

      component.onRetrieve();
      tick();

      expect(moment(component.filterForm.get('fromDate')!.value).format('YYYY-MM-DD')).toBe('2024-01-01');
      expect(moment(component.filterForm.get('toDate')!.value).format('YYYY-MM-DD')).toBe('2024-01-15');
    }));
  });

  describe('onRetrieve guard clauses', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', fakeAsync(() => {
      component.filterForm.get('fromDate')!.setErrors({ invalidDate: true });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryBatches).not.toHaveBeenCalled();
    }));
  });

  describe('Search term filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter sent-from warehouses by search term', () => {
      component.sentFromSearchTerm.set('warehouse a');
      const filtered = component.filteredSentFromWarehouses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('A');
    });

    it('should filter sent-from warehouses by description', () => {
      component.sentFromSearchTerm.set('warehouse b');
      const filtered = component.filteredSentFromWarehouses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('B');
    });

    it('should return all warehouses when search term is empty', () => {
      component.sentFromSearchTerm.set('');
      expect(component.filteredSentFromWarehouses().length).toBe(3);
    });

    it('should filter sent-to warehouses by search term', () => {
      component.sentToSearchTerm.set('c');
      const filtered = component.filteredSentToWarehouses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('C');
    });

    it('should return all sent-to warehouses when search term is empty', () => {
      component.sentToSearchTerm.set('');
      expect(component.filteredSentToWarehouses().length).toBe(3);
    });

    it('should filter batch IDs by search term', () => {
      component.batchIdSearchTerm.set('001');
      const filtered = component.filteredBatchIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].batchId).toBe('BATCH001');
    });

    it('should return all batch IDs when search term is empty', () => {
      component.batchIdSearchTerm.set('');
      expect(component.filteredBatchIds().length).toBe(2);
    });

    it('should filter batch statuses by search term', () => {
      component.batchStatusSearchTerm.set('open');
      const filtered = component.filteredBatchStatuses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('OPEN');
    });

    it('should return all batch statuses when search term is empty', () => {
      component.batchStatusSearchTerm.set('');
      expect(component.filteredBatchStatuses().length).toBe(3);
    });

    it('should return empty when search term matches nothing', () => {
      component.sentFromSearchTerm.set('xyz');
      expect(component.filteredSentFromWarehouses().length).toBe(0);
    });
  });

  describe('Search control valueChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update sentFromSearchTerm when control value changes', () => {
      component.sentFromSearchCtrl.setValue('test');
      expect(component.sentFromSearchTerm()).toBe('test');
    });

    it('should set empty string when search control value is null', () => {
      component.sentFromSearchCtrl.setValue(null as any);
      expect(component.sentFromSearchTerm()).toBe('');
    });

    it('should update sentToSearchTerm when control value changes', () => {
      component.sentToSearchCtrl.setValue('warehouse');
      expect(component.sentToSearchTerm()).toBe('warehouse');
    });

    it('should update batchIdSearchTerm when control value changes', () => {
      component.batchIdSearchCtrl.setValue('BATCH');
      expect(component.batchIdSearchTerm()).toBe('BATCH');
    });

    it('should update batchStatusSearchTerm when control value changes', () => {
      component.batchStatusSearchCtrl.setValue('OPEN');
      expect(component.batchStatusSearchTerm()).toBe('OPEN');
    });
  });

  describe('Detail enrichment edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();
    }));

    it('should set fullUnitId without check digit when chkDigit is null', fakeAsync(() => {
      const detailsWithNullChkDigit: TransportBatchDetailDto[] = [
        {
          unitId: 'UNIT123', chkDigit: null, productCode: 'P01', aliquot: '01',
          receiveWarehouse: 'A', receiveDate: '2024-01-16T08:00:00Z',
          receiveUser: 'U1', reconReason: null, reconDetail: null
        }
      ];
      apiServiceSpy.getBatchDetails.and.returnValue(of({ data: detailsWithNullChkDigit, total: 1 }));

      component.selectBatch(component.batches()[0]);
      tick();

      expect(component.batchDetails()[0].fullUnitId).toBe('UNIT123');
    }));

    it('should set empty formattedReceiveDate when receiveDate is null', fakeAsync(() => {
      const detailsWithNullDate: TransportBatchDetailDto[] = [
        {
          unitId: 'UNIT123', chkDigit: '45', productCode: 'P01', aliquot: '01',
          receiveWarehouse: 'A', receiveDate: null,
          receiveUser: 'U1', reconReason: null, reconDetail: null
        }
      ];
      apiServiceSpy.getBatchDetails.and.returnValue(of({ data: detailsWithNullDate, total: 1 }));

      component.selectBatch(component.batches()[0]);
      tick();

      expect(component.batchDetails()[0].formattedReceiveDate).toBe('');
    }));

    it('should fall back to warehouse code when code is not in warehouse map', fakeAsync(() => {
      const detailsWithUnknownWh: TransportBatchDetailDto[] = [
        {
          unitId: 'UNIT123', chkDigit: '45', productCode: 'P01', aliquot: '01',
          receiveWarehouse: 'Z', receiveDate: '2024-01-16T08:00:00Z',
          receiveUser: 'U1', reconReason: null, reconDetail: null
        }
      ];
      apiServiceSpy.getBatchDetails.and.returnValue(of({ data: detailsWithUnknownWh, total: 1 }));

      component.selectBatch(component.batches()[0]);
      tick();

      expect(component.batchDetails()[0].receiveWarehouse).toBe('Z');
    }));

    it('should handle detail with null receiveWarehouse', fakeAsync(() => {
      const detailsWithNullWh: TransportBatchDetailDto[] = [
        {
          unitId: 'UNIT123', chkDigit: null, productCode: null, aliquot: null,
          receiveWarehouse: null, receiveDate: null,
          receiveUser: null, reconReason: null, reconDetail: null
        }
      ];
      apiServiceSpy.getBatchDetails.and.returnValue(of({ data: detailsWithNullWh, total: 1 }));

      component.selectBatch(component.batches()[0]);
      tick();

      expect(component.batchDetails()[0].fullUnitId).toBe('UNIT123');
      expect(component.batchDetails()[0].formattedReceiveDate).toBe('');
    }));
  });

  describe('Batch detail loading error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();
    }));

    it('should handle getBatchDetails error gracefully', fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(
        throwError(() => new Error('Detail Error'))
      );

      component.selectBatch(component.batches()[0]);
      tick();

      expect(component.loadingDetails()).toBeFalse();
      expect(component.batchDetails().length).toBe(0);
    }));
  });

  describe('Sort toggle', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.onRetrieve();
      tick();
      component.selectBatch(component.batches()[0]);
      tick();
    }));

    it('should toggle from descending to ascending', () => {
      expect(component.currentSortDirection).toBe('D');

      component.toggleSort();

      expect(component.currentSortDirection).toBe('A');
      const first = component.sortedBatchDetails()[0];
      const second = component.sortedBatchDetails()[1];
      expect(first.unitId <= second.unitId).toBeTrue();
    });

    it('should toggle back from ascending to descending', () => {
      component.toggleSort(); // D -> A
      component.toggleSort(); // A -> D

      expect(component.currentSortDirection).toBe('D');
    });
  });

  describe('Date formatting edge cases', () => {
    it('should return empty string for null formatDate input', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for null formatDateTime input', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should format a valid date string with formatDate', () => {
      const result = component.formatDate('2024-06-15T00:00:00Z');
      expect(result).toContain('15-JUN-2024');
    });
  });

  describe('Warehouse description edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null warehouse code', () => {
      expect(component.getWarehouseDescription(null)).toBe('');
    });

    it('should return empty string for empty warehouse code', () => {
      expect(component.getWarehouseDescription('')).toBe('');
    });
  });

  describe('Date input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility for from date input', () => {
      const mockEvent = { target: { value: '15-JAN-2024' } } as unknown as Event;
      expect(() => component.onFromDateInput(mockEvent)).not.toThrow();
    });

    it('should call DateFieldValidationUtility for to date input', () => {
      const mockEvent = { target: { value: '31-JAN-2024' } } as unknown as Event;
      expect(() => component.onToDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('Chapter change handling', () => {
    it('should reload dropdowns and reset form on chapter change', fakeAsync(() => {
      // Replace chapterChanged$ with a controllable Subject before detectChanges
      const chapterSubject = new Subject<void>();
      (headerServiceSpy as any).chapterChanged$ = chapterSubject.asObservable();

      fixture.detectChanges();

      apiServiceSpy.getWarehouses.calls.reset();
      apiServiceSpy.getBatchStatuses.calls.reset();
      apiServiceSpy.getRecentBatches.calls.reset();

      // Set some form values first
      component.filterForm.patchValue({ sentFrom: 'A' });
      component.sentFromSearchCtrl.setValue('test');

      // Trigger chapter change
      chapterSubject.next();
      tick();

      // Verify dropdowns reloaded
      expect(apiServiceSpy.getWarehouses).toHaveBeenCalled();
      expect(apiServiceSpy.getBatchStatuses).toHaveBeenCalled();
      expect(apiServiceSpy.getRecentBatches).toHaveBeenCalled();

      // Verify form and search controls are reset
      expect(component.sentFromSearchCtrl.value).toBe('');
      expect(component.sentToSearchCtrl.value).toBe('');
      expect(component.batchIdSearchCtrl.value).toBe('');
      expect(component.batchStatusSearchCtrl.value).toBe('');
      expect(component.showEmptyState()).toBeTrue();
    }));
  });

  describe('Duplicate removal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove duplicate recent batches', fakeAsync(() => {
      const duplicatedBatches: RecentBatchDto[] = [
        { batchId: 'B001', createDate: '2024-01-15T10:00:00Z' },
        { batchId: 'B001', createDate: '2024-01-15T10:00:00Z' },
        { batchId: 'B002', createDate: '2024-01-14T09:00:00Z' }
      ];
      apiServiceSpy.getRecentBatches.and.returnValue(of(duplicatedBatches));
      apiServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));
      apiServiceSpy.getBatchStatuses.and.returnValue(of(mockBatchStatuses));

      component['loadDropdowns']();
      tick();

      expect(component.recentBatches().length).toBe(2);
    }));

    it('should remove duplicate batch headers from query results', fakeAsync(() => {
      const duplicatedHeaders: TransportBatchHeaderDto[] = [
        ...mockBatches,
        { ...mockBatches[0] }
      ];
      apiServiceSpy.queryBatches.and.returnValue(of({ data: duplicatedHeaders, total: 3 }));
      component.filterForm.patchValue({ sentFrom: 'A' });

      component.onRetrieve();
      tick();

      expect(component.batches().length).toBe(2);
    }));
  });

  describe('Batch enrichment with unknown warehouse codes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should fall back to warehouse code when description not found', fakeAsync(() => {
      const batchesWithUnknownWh: TransportBatchHeaderDto[] = [
        {
          batchId: 'B001', createDate: '2024-01-15T10:00:00Z',
          batchName: 'Test', fromWarehouse: 'X', toWarehouse: 'Y',
          batchStatus: 'OPEN', checkoutTemp: null, reconDate: null, reconUser: null
        }
      ];
      apiServiceSpy.queryBatches.and.returnValue(of({ data: batchesWithUnknownWh, total: 1 }));
      component.filterForm.patchValue({ sentFrom: 'A' });

      component.onRetrieve();
      tick();

      expect(component.batches()[0].fromWarehouseDescription).toBe('X');
      expect(component.batches()[0].toWarehouseDescription).toBe('Y');
    }));
  });

  describe('Dropdown loading error handling', () => {
    it('should handle individual dropdown API failures gracefully', fakeAsync(() => {
      apiServiceSpy.getWarehouses.and.returnValue(throwError(() => new Error('WH Error')));
      apiServiceSpy.getBatchStatuses.and.returnValue(throwError(() => new Error('Status Error')));
      apiServiceSpy.getRecentBatches.and.returnValue(throwError(() => new Error('Batch Error')));

      fixture.detectChanges();
      tick();

      expect(component.warehouses().length).toBe(0);
      expect(component.batchStatuses().length).toBe(0);
      expect(component.recentBatches().length).toBe(0);
      expect(component.loadingDropdowns()).toBeFalse();
    }));
  });

  describe('Component cleanup', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error ID generation', () => {
    it('should generate error IDs with -error suffix', () => {
      const errorId = component['errorId']('from-date');
      expect(errorId).toContain('from-date-error');
      expect(errorId).toContain('transport-batch-query-');
    });
  });

  describe('Date range validator edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null when only fromDate is set', () => {
      component.filterForm.patchValue({ fromDate: moment('2024-01-01'), toDate: null });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should return null when only toDate is set', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: moment('2024-01-31') });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should return null when both dates are null', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: null });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not return error when fromDate equals toDate', () => {
      const sameDate = moment('2024-01-15');
      component.filterForm.patchValue({ fromDate: sameDate, toDate: moment(sameDate) });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not return error when fromDate is before toDate', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31')
      });
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('Compare function', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return 0 when both values are null', () => {
      expect(component['compare'](null, null, true)).toBe(0);
    });

    it('should sort null after non-null in ascending', () => {
      expect(component['compare'](null, 'b', true)).toBe(1);
    });

    it('should sort null before non-null in descending', () => {
      expect(component['compare'](null, 'b', false)).toBe(-1);
    });

    it('should sort non-null before null in ascending', () => {
      expect(component['compare']('a', null, true)).toBe(-1);
    });

    it('should sort non-null after null in descending', () => {
      expect(component['compare']('a', null, false)).toBe(1);
    });

    it('should sort strings ascending', () => {
      expect(component['compare']('a', 'b', true)).toBeLessThan(0);
      expect(component['compare']('b', 'a', true)).toBeGreaterThan(0);
    });

    it('should sort strings descending', () => {
      expect(component['compare']('a', 'b', false)).toBeGreaterThan(0);
      expect(component['compare']('b', 'a', false)).toBeLessThan(0);
    });
  });
});
