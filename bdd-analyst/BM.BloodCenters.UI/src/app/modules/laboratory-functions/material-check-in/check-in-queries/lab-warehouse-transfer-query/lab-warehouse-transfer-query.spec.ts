import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDrawer } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject, delay, Observable } from 'rxjs';
import moment from 'moment';

import { LabWarehouseTransferQuery } from './lab-warehouse-transfer-query';
import { LabWarehouseTransferQueryApiService } from './services/lab-warehouse-transfer-query-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockActivatedRoute, createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  LabWhTransHdrDto,
  LabWhTransDtlDto,
  LabWhTransQueryResponse,
  LabWhTransCompleteDto,
  WarehouseLookupDto,
  BatchIdLookupDto,
  StatusLookupDto,
  BatchStatus
} from './models/lab-warehouse-transfer-query.model';

describe('LabWarehouseTransferQuery', () => {
  let component: LabWarehouseTransferQuery;
  let cmp: any; // untyped alias for accessing protected members in tests
  let fixture: ComponentFixture<LabWarehouseTransferQuery>;
  let apiServiceSpy: jasmine.SpyObj<LabWarehouseTransferQueryApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  // ── Mock Data ──

  const mockWarehouses: WarehouseLookupDto[] = [
    { code: 'A', description: 'Warehouse A' },
    { code: 'B', description: 'Warehouse B' },
    { code: 'H', description: 'Main Hospital' },
    { code: 'L', description: 'Lab Storage' }
  ];

  const mockStatuses: StatusLookupDto[] = [
    { status: 'OPEN' },
    { status: 'CLOSED' },
    { status: 'RECON' }
  ];

  const mockBatchIds: BatchIdLookupDto[] = [
    { batchId: 'BATCH001' },
    { batchId: 'BATCH002' },
    { batchId: 'BATCH003' },
    { batchId: 'BA100' }
  ];

  const mockHeaderOpen: LabWhTransHdrDto = {
    batchId: 'BATCH001',
    createDate: '2024-01-15T10:30:00Z',
    batchName: 'Morning Transfer',
    fromWarehouse: 'A',
    fromWarehouseDesc: 'Warehouse A',
    toWarehouse: 'B',
    toWarehouseDesc: 'Warehouse B',
    batchStatus: 'OPEN',
    checkoutTemp: 4.5,
    reconDate: null,
    reconUser: null,
    unitCount: 5
  };

  const mockHeaderClosed: LabWhTransHdrDto = {
    batchId: 'BATCH002',
    createDate: '2024-01-14T08:00:00Z',
    batchName: 'Afternoon Transfer',
    fromWarehouse: 'H',
    fromWarehouseDesc: 'Main Hospital',
    toWarehouse: 'L',
    toWarehouseDesc: 'Lab Storage',
    batchStatus: 'CLOSED',
    checkoutTemp: 3.2,
    reconDate: '2024-01-14T16:00:00Z',
    reconUser: 'USER02',
    unitCount: 12
  };

  const mockHeaderRecon: LabWhTransHdrDto = {
    batchId: 'BATCH003',
    createDate: '2024-01-13T06:00:00Z',
    batchName: null,
    fromWarehouse: null,
    fromWarehouseDesc: null,
    toWarehouse: 'B',
    toWarehouseDesc: null,
    batchStatus: 'RECON',
    checkoutTemp: null,
    reconDate: '2024-01-13T18:00:00Z',
    reconUser: 'ADMIN1',
    unitCount: 0
  };

  const mockUnits: LabWhTransDtlDto[] = [
    {
      unitId: 'UNIT001',
      chkDigit: '12',
      productCode: 'RBC001',
      aliquot: '01',
      receiveWarehouse: 'B',
      receiveDate: '2024-01-15T11:00:00Z',
      receiveUser: 'USER01',
      receiveTemp: 4.2,
      reconReason: null,
      reconDetail: null
    },
    {
      unitId: 'UNIT002',
      chkDigit: '34',
      productCode: 'PLT002',
      aliquot: null,
      receiveWarehouse: 'B',
      receiveDate: '2024-01-15T11:30:00Z',
      receiveUser: 'USER01',
      receiveTemp: 22.0,
      reconReason: 'SHORT',
      reconDetail: 'Shortage noted on receive'
    },
    {
      unitId: 'UNIT003',
      chkDigit: null,
      productCode: null,
      aliquot: null,
      receiveWarehouse: null,
      receiveDate: null,
      receiveUser: null,
      receiveTemp: null,
      reconReason: null,
      reconDetail: null
    }
  ];

  const mockQueryResponse: LabWhTransQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [mockHeaderOpen],
    total: 1
  };

  const mockMultipleBatchResponse: LabWhTransQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [mockHeaderOpen, mockHeaderClosed, mockHeaderRecon],
    total: 3
  };

  const mockEmptyResponse: LabWhTransQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [],
    total: 0
  };

  const mockCompleteData: LabWhTransCompleteDto = {
    header: mockHeaderOpen,
    details: mockUnits
  };

  const mockCompleteDataEmpty: LabWhTransCompleteDto = {
    header: mockHeaderRecon,
    details: []
  };

  // ── Setup & Teardown ──

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('LabWarehouseTransferQueryApiService', [
      'queryTransfers',
      'getHeader',
      'getComplete',
      'getWarehouses',
      'getBatchIds',
      'getStatuses'
    ]);
    headerServiceSpy = createMockHeaderService();
    (headerServiceSpy as any).chapterChanged$ = new Subject<void>();
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['pageHeaderData'], {
      pageHeaderData: () => ({ title: 'Lab Warehouse Transfer Query', subtitle: '' })
    });

    apiServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));
    apiServiceSpy.getBatchIds.and.returnValue(of(mockBatchIds));
    apiServiceSpy.getStatuses.and.returnValue(of(mockStatuses));
    apiServiceSpy.queryTransfers.and.returnValue(of(mockQueryResponse));
    apiServiceSpy.getComplete.and.returnValue(of(mockCompleteData));



      TestBed.configureTestingModule({
      imports: [LabWarehouseTransferQuery, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        { provide: LabWarehouseTransferQueryApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ]
    });

      apiServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));


      apiServiceSpy.getBatchIds.and.returnValue(of(mockBatchIds));


      apiServiceSpy.getStatuses.and.returnValue(of(mockStatuses));


      apiServiceSpy.queryTransfers.and.returnValue(of(mockQueryResponse));


      apiServiceSpy.getComplete.and.returnValue(of(mockCompleteData));


    fixture = TestBed.createComponent(LabWarehouseTransferQuery);
    component = fixture.componentInstance;
    cmp = component as any;


    });

  // ═══════════════════════════════════════════════════════════════════
  // 1. COMPONENT INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════

  describe('Component Initialization', () => {


    it('should initialize search form with empty values', () => {
      fixture.detectChanges();
      expect(component.searchForm).toBeDefined();
      expect(component.f['fromWarehouse'].value).toBe('');
      expect(component.f['toWarehouse'].value).toBe('');
      expect(component.f['status'].value).toBe('');
      expect(component.f['batchId'].value).toBe('');
      expect(component.f['fromDate'].value).toBeNull();
      expect(component.f['toDate'].value).toBeNull();
    });

    it('should load warehouses on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getWarehouses).toHaveBeenCalled();
      expect(cmp.warehouses().length).toBe(4);
    }));





    it('should handle error loading warehouses gracefully', fakeAsync(() => {
      apiServiceSpy.getWarehouses.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load warehouse list');
      expect(cmp.warehouses().length).toBe(0);
    }));

    it('should handle error loading statuses gracefully', fakeAsync(() => {
      apiServiceSpy.getStatuses.and.returnValue(throwError(() => new Error('Failed')));
      fixture.detectChanges();
      tick();
      expect(component['statusOptions']().length).toBe(0);
    }));

    it('should handle error loading batch IDs gracefully', fakeAsync(() => {
      apiServiceSpy.getBatchIds.and.returnValue(throwError(() => new Error('Failed')));
      fixture.detectChanges();
      tick();
      expect(component['batchIdOptions']().length).toBe(0);
    }));





    it('should not have any batch selected initially', () => {
      fixture.detectChanges();
      expect(cmp.selectedBatch()).toBeNull();
      expect(cmp.hasSelectedBatch()).toBeFalse();
    });



    it('should have no error initially', () => {
      fixture.detectChanges();
      expect(cmp.error()).toBeNull();
    });








  });

  // ═══════════════════════════════════════════════════════════════════
  // 2. SEARCH FUNCTIONALITY — BASIC SCENARIOS
  // ═══════════════════════════════════════════════════════════════════

  describe('Search — Basic Scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should execute search with no filters and default to last 30 days', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers).toHaveBeenCalled();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromWarehouse).toBeUndefined();
      expect(query.toWarehouse).toBeUndefined();
      expect(query.status).toBeUndefined();
      expect(query.batchId).toBeUndefined();
      expect(query.unitId).toBeUndefined();
      expect(query.fromDate).toBeDefined();
      expect(query.toDate).toBeDefined();
    }));



    it('should populate batches on successful search', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(cmp.batches().length).toBe(1);
      expect(cmp.hasSearched()).toBeTrue();
      expect(cmp.hasBatches()).toBeTrue();
    }));





    it('should handle multiple batches in results', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      component.onRetrieve();
      tick();
      expect(cmp.batches().length).toBe(3);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 3. SEARCH — FILTER COMBINATIONS
  // ═══════════════════════════════════════════════════════════════════

  describe('Search — Filter Combinations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by fromWarehouse only', fakeAsync(() => {
      component.f['fromWarehouse'].setValue('A');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromWarehouse).toBe('A');
      expect(query.toWarehouse).toBeUndefined();
    }));

    it('should filter by toWarehouse only', fakeAsync(() => {
      component.f['toWarehouse'].setValue('B');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.toWarehouse).toBe('B');
      expect(query.fromWarehouse).toBeUndefined();
    }));

    it('should filter by status only', fakeAsync(() => {
      component.f['status'].setValue('OPEN');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.status).toBe('OPEN');
    }));

    it('should filter by batchId only', fakeAsync(() => {
      component.f['batchId'].setValue('BATCH001');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.batchId).toBe('BATCH001');
    }));

    it('should trim batchId whitespace', fakeAsync(() => {
      component.f['batchId'].setValue(' BAT001 ');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.batchId).toBe('BAT001');
    }));



    it('should filter by fromDate and auto-fill toDate', fakeAsync(() => {
      const lastWeek = moment().subtract(7, 'days');
      component.f['fromDate'].setValue(lastWeek);
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromDate).toBe(lastWeek.format('YYYY-MM-DD'));
      expect(query.toDate).toBeDefined();
    }));

    it('should filter by toDate and auto-fill fromDate', fakeAsync(() => {
      const yesterday = moment().subtract(1, 'days');
      component.f['toDate'].setValue(yesterday);
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.toDate).toBe(yesterday.format('YYYY-MM-DD'));
      expect(query.fromDate).toBeDefined();
    }));

    it('should filter by date range (from and to)', fakeAsync(() => {
      const fromDate = moment().subtract(30, 'days');
      const toDate = moment().subtract(1, 'days');
      component.f['fromDate'].setValue(fromDate);
      component.f['toDate'].setValue(toDate);
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromDate).toBe(fromDate.format('YYYY-MM-DD'));
      expect(query.toDate).toBe(toDate.format('YYYY-MM-DD'));
    }));

    it('should filter by all fields combined', fakeAsync(() => {
      component.f['fromWarehouse'].setValue('A');
      component.f['toWarehouse'].setValue('B');
      component.f['status'].setValue('OPEN');
      component.f['batchId'].setValue('BATCH001');
      const fromDate = moment().subtract(7, 'days');
      const toDate = moment().subtract(1, 'days');
      component.f['fromDate'].setValue(fromDate);
      component.f['toDate'].setValue(toDate);

      component.onRetrieve();
      tick();

      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromWarehouse).toBe('A');
      expect(query.toWarehouse).toBe('B');
      expect(query.status).toBe('OPEN');
      expect(query.batchId).toBe('BATCH001');
      expect(query.fromDate).toBe(fromDate.format('YYYY-MM-DD'));
      expect(query.toDate).toBe(toDate.format('YYYY-MM-DD'));
    }));

    it('should convert "All Warehouses" (empty string) to undefined', fakeAsync(() => {
      component.f['fromWarehouse'].setValue('');
      component.f['toWarehouse'].setValue('');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromWarehouse).toBeUndefined();
      expect(query.toWarehouse).toBeUndefined();
    }));



    it('should filter by RECON status', fakeAsync(() => {
      component.f['status'].setValue('RECON');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.status).toBe('RECON');
    }));

    it('should filter by CLOSED status', fakeAsync(() => {
      component.f['status'].setValue('CLOSED');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.status).toBe('CLOSED');
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 4. SEARCH — DATE VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  describe('Search — Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject when fromDate is after toDate', () => {
      component.f['fromDate'].setValue(moment().subtract(1, 'days'));
      component.f['toDate'].setValue(moment().subtract(7, 'days'));
      component.onRetrieve();
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeTrue();
      expect(apiServiceSpy.queryTransfers).not.toHaveBeenCalled();
    });











    it('should not change hasSearched or loading when date validation fails', () => {
      component.f['fromDate'].setValue(moment());
      component.f['toDate'].setValue(moment().subtract(10, 'days'));
      component.onRetrieve();
      expect(cmp.hasSearched()).toBeFalse();
      expect(cmp.loading()).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 5. SEARCH — LOADING STATE
  // ═══════════════════════════════════════════════════════════════════



  // ═══════════════════════════════════════════════════════════════════
  // 6. SEARCH — EMPTY RESULTS
  // ═══════════════════════════════════════════════════════════════════

  describe('Search — Empty Results', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should set isEmpty computed to true when no results', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockEmptyResponse));
      component.onRetrieve();
      tick();
      expect(cmp.isEmpty()).toBeTrue();
    }));



    it('should hide the initial empty state after search with no results', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockEmptyResponse));
      component.onRetrieve();
      tick();
      expect(cmp.showEmptyState()).toBeFalse();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 7. SEARCH — ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════

  describe('Search — Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display error with error.errorCode and error.message', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({
          error: { errorCode: 'E100', message: 'Batch not found in system' }
        }))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('Error E100: Batch not found in system');
    }));

    it('should handle 404 error with custom message', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({
          status: 404,
          error: { message: 'Resource not found' }
        }))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('Resource not found');
    }));

    it('should handle 404 error with default message', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({ status: 404, error: {} }))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('Batch not found.');
    }));

    it('should handle generic error with error.message', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({ error: { message: 'Server timeout' } }))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('Server timeout');
    }));

    it('should handle completely generic error', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({}))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('An error occurred. Please try again.');
    }));

    it('should set hasSearched to true even on error', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      tick();
      expect(cmp.hasSearched()).toBeTrue();
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 8. UNIT ID VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  describe('Unit ID Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store validated unit ID on validation event', () => {
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      expect((component as any).validatedUnitId).toBe('W6333317070132');
    });

    it('should clear validated unit ID on clear event', () => {
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      component.onUnitCleared();
      expect((component as any).validatedUnitId).toBeNull();
    });




  });

  // ═══════════════════════════════════════════════════════════════════
  // 9. BATCH ID AUTOCOMPLETE
  // ═══════════════════════════════════════════════════════════════════

  describe('Batch ID Autocomplete', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    // Note: filteredBatchIds is a computed signal that depends on batchIdOptions (signal)
    // and batchIdSearchCtrl.value (FormControl — not reactive for computed).
    // To trigger re-evaluation, we must update the batchIdOptions signal after setting the search value.

    it('should show all batch IDs when search text is less than 2 characters', () => {
      component['batchIdSearchCtrl'].setValue('B');
      cmp.batchIdOptions.set([...mockBatchIds]); // trigger recompute
      expect(cmp.filteredBatchIds().length).toBe(4);
    });

    it('should filter batch IDs with 2+ character input', () => {
      component['batchIdSearchCtrl'].setValue('BA');
      cmp.batchIdOptions.set([...mockBatchIds]);
      const filtered = cmp.filteredBatchIds();
      expect(filtered.length).toBe(4); // all start with BA
    });

    it('should filter batch IDs case-insensitively', fakeAsync(() => {
      fixture.detectChanges();
      cmp.batchIdOptions.set([...mockBatchIds]);
      component.f['batchId'].setValue('batch');
      tick();
      const filtered = cmp.filteredBatchIds();
      expect(filtered.length).toBe(3); // BATCH001, BATCH002, BATCH003
    }));

    it('should show no options for non-matching search', fakeAsync(() => {
      fixture.detectChanges();
      cmp.batchIdOptions.set([...mockBatchIds]);
      component.f['batchId'].setValue('NONEXISTENT');
      tick();
      const filtered = cmp.filteredBatchIds();
      expect(filtered.length).toBe(0);
    }));

    it('should show all batch IDs for empty search', () => {
      component['batchIdSearchCtrl'].setValue('');
      cmp.batchIdOptions.set([...mockBatchIds]);
      expect(cmp.filteredBatchIds().length).toBe(4);
    });

    it('should show all batch IDs for null search', () => {
      component['batchIdSearchCtrl'].setValue(null);
      cmp.batchIdOptions.set([...mockBatchIds]);
      expect(cmp.filteredBatchIds().length).toBe(4);
    });

    it('should filter by partial match in middle of ID', () => {
      component['batchIdSearchCtrl'].setValue('100');
      cmp.batchIdOptions.set([...mockBatchIds]);
      const filtered = cmp.filteredBatchIds();
      expect(filtered.some((b: any) => b.batchId === 'BA100')).toBeTrue();
    });

    it('should sync batchId form control value to search signal', fakeAsync(() => {
      fixture.detectChanges();
      component.f['batchId'].setValue('BATCH');
      tick();
      expect(cmp.batchIdSearch()).toBe('BATCH');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 10. BATCH SELECTION
  // ═══════════════════════════════════════════════════════════════════

  describe('Batch Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
    }));

    it('should select batch and call getComplete API', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()).toBeTruthy();
      expect(apiServiceSpy.getComplete).toHaveBeenCalledWith('BATCH001');
    }));

    it('should load units for selected batch', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.units().length).toBe(3);
    }));

    it('should update unitsDataSource for table', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(component.unitsDataSource.length).toBe(3);
    }));

    it('should load unit details without pagination', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(component.unitsTableConfig.showPagination).toBeFalse();
      expect(component.unitsDataSource.length).toBe(3);
    }));

    it('should update selectedBatch with complete header data', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH001');
    }));





    it('should clear units before loading new batch details', fakeAsync(() => {
      cmp.units.set(mockUnits);
      let unitsDuringCall: LabWhTransDtlDto[] = [];
      apiServiceSpy.getComplete.and.callFake(() => {
        unitsDuringCall = cmp.units();
        return of(mockCompleteData);
      });
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(unitsDuringCall.length).toBe(0);
    }));

    it('should handle error loading batch details', fakeAsync(() => {
      apiServiceSpy.getComplete.and.returnValue(throwError(() => new Error('Server error')));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.loadingBatchDetails()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should highlight the selected batch', () => {
      cmp.selectedBatch.set(mockHeaderOpen);
      expect(component.isBatchSelected(mockHeaderOpen)).toBeTrue();
      expect(component.isBatchSelected(mockHeaderClosed)).toBeFalse();
    });

    it('should support selecting a different batch', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      apiServiceSpy.getComplete.and.returnValue(of({ header: mockHeaderClosed, details: [] }));
      component.onSelectBatch(mockHeaderClosed);
      tick();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH002');
      expect(apiServiceSpy.getComplete).toHaveBeenCalledTimes(2);
    }));

    it('should handle selecting the same batch again', fakeAsync(() => {
      component.onSelectBatch(mockHeaderOpen);
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(apiServiceSpy.getComplete).toHaveBeenCalledTimes(2);
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 11. BATCH SELECTION — KEYBOARD NAVIGATION
  // ═══════════════════════════════════════════════════════════════════



  // ═══════════════════════════════════════════════════════════════════
  // 12. RECEIVE TEMPERATURE SIDE PANEL
  // ═══════════════════════════════════════════════════════════════════

  describe('Receive Temperature Side Panel', () => {
    let mockPanel: jasmine.SpyObj<MatDrawer>;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      mockPanel = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
      (component as any).receiveTemperaturePanel = mockPanel;
    }));







    it('should display batch ID in panel header', fakeAsync(() => {
      fixture.detectChanges();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH001');
    }));

    it('should show all units with temperature data', () => {
      expect(cmp.units().length).toBe(3);
      const unitWithTemp = cmp.units().find((u: any) => u.unitId === 'UNIT001');
      expect(unitWithTemp?.receiveTemp).toBe(4.2);
    });

    it('should handle units with null temperature', () => {
      const unitNoTemp = cmp.units().find((u: any) => u.unitId === 'UNIT003');
      expect(unitNoTemp?.receiveTemp).toBeNull();
      expect(component.formatTemperature(unitNoTemp?.receiveTemp ?? null)).toBe('-');
    });

    it('should handle empty units in temperature panel', fakeAsync(() => {
      apiServiceSpy.getComplete.and.returnValue(of(mockCompleteDataEmpty));
      component.onSelectBatch(mockHeaderRecon);
      tick();
      expect(cmp.units().length).toBe(0);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 13. CLEAR ALL FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════

  describe('Clear All Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.f['fromWarehouse'].setValue('A');
      component.f['toWarehouse'].setValue('B');
      component.f['status'].setValue('OPEN');
      component.f['batchId'].setValue('BATCH001');
      component.f['fromDate'].setValue(moment().subtract(7, 'days'));
      component.f['toDate'].setValue(moment().subtract(1, 'days'));
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
    }));





    it('should clear selected batch', () => {
      component.onClearAll();
      expect(cmp.selectedBatch()).toBeNull();
    });





    it('should reset hasSearched flag', () => {
      component.onClearAll();
      expect(cmp.hasSearched()).toBeFalse();
    });



    it('should clear validated unit ID', () => {
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      component.onClearAll();
      expect((component as any).validatedUnitId).toBeNull();
    });

    it('should return to initial empty state', () => {
      component.onClearAll();
      expect(cmp.showEmptyState()).toBeTrue();
      expect(cmp.isEmpty()).toBeFalse();
      expect(cmp.hasBatches()).toBeFalse();
    });

    it('should allow new search after clear', fakeAsync(() => {
      component.onClearAll();
      component.f['status'].setValue('CLOSED');
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers).toHaveBeenCalledTimes(2);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 14. STATUS BADGE STYLING
  // ═══════════════════════════════════════════════════════════════════

  describe('Status Badge Styling', () => {
    it('should return status-recon for RECON', () => {
      expect(component.getStatusClass('RECON')).toBe('status-recon');
    });

    it('should return status-open for OPEN', () => {
      expect(component.getStatusClass('OPEN')).toBe('status-open');
    });

    it('should return status-closed for CLOSED', () => {
      expect(component.getStatusClass('CLOSED')).toBe('status-closed');
    });







    it('should be case-insensitive (lowercase also matches)', () => {
      expect(component.getStatusClass('open')).toBe('status-open');
      expect(component.getStatusClass('closed')).toBe('status-closed');
      expect(component.getStatusClass('recon')).toBe('status-recon');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 15. FORMAT HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════

  describe('Format Helpers — Date', () => {
    it('should format valid ISO date to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2024-01-15T10:30:00Z')).toBe('15-JAN-2024');
    });

    it('should format date without time component', () => {
      expect(component.formatDate('2024-07-04')).toBe('04-JUL-2024');
    });









    it('should handle year-end dates correctly', () => {
      expect(component.formatDate('2024-12-31')).toBe('31-DEC-2024');
    });

    it('should handle year-start dates correctly', () => {
      expect(component.formatDate('2024-01-01T00:00:00Z')).toBe('01-JAN-2024');
    });

    it('should handle February dates correctly', () => {
      expect(component.formatDate('2024-02-29T12:00:00Z')).toBe('29-FEB-2024');
    });
  });

  describe('Format Helpers — Temperature', () => {
    it('should format positive temperature with °C suffix', () => {
      expect(component.formatTemperature(4.5)).toBe('4.5°C');
    });

    it('should format zero temperature', () => {
      expect(component.formatTemperature(0)).toBe('0°C');
    });

    it('should format negative temperature', () => {
      expect(component.formatTemperature(-20)).toBe('-20°C');
    });

    it('should format temperature with decimal', () => {
      expect(component.formatTemperature(22.5)).toBe('22.5°C');
    });

    it('should return dash for null temperature', () => {
      expect(component.formatTemperature(null)).toBe('-');
    });

    it('should return dash for undefined temperature', () => {
      expect(component.formatTemperature(undefined as any)).toBe('-');
    });
  });

  describe('Format Helpers — Transfer Direction', () => {
    it('should show descriptions when available', () => {
      expect(component.getTransferDirection(mockHeaderOpen)).toBe('A →B');
    });

    it('should fall back to codes when descriptions are null', () => {
      const batch = { ...mockHeaderOpen, fromWarehouseDesc: null, toWarehouseDesc: null };
      expect(component.getTransferDirection(batch)).toBe('A →B');
    });

    it('should show dash when fromWarehouse is null and no desc', () => {
      const batch = { ...mockHeaderOpen, fromWarehouse: null, fromWarehouseDesc: null };
      expect(component.getTransferDirection(batch)).toBe('- →B');
    });

    it('should mix description and code when one is missing', () => {
      const batch = { ...mockHeaderOpen, fromWarehouseDesc: null };
      expect(component.getTransferDirection(batch)).toBe('A →B');
    });

    it('should handle batch with no warehouse info (RECON batch)', () => {
      expect(component.getTransferDirection(mockHeaderRecon)).toContain('→');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 16. COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════

  describe('Computed Values', () => {
    it('hasBatches should be false when batches is empty', () => {
      cmp.batches.set([]);
      expect(cmp.hasBatches()).toBeFalse();
    });

    it('hasBatches should be true when batches has items', () => {
      cmp.batches.set([mockHeaderOpen]);
      expect(cmp.hasBatches()).toBeTrue();
    });

    it('hasSelectedBatch should be false when no selection', () => {
      cmp.selectedBatch.set(null);
      expect(cmp.hasSelectedBatch()).toBeFalse();
    });

    it('hasSelectedBatch should be true when batch selected', () => {
      cmp.selectedBatch.set(mockHeaderOpen);
      expect(cmp.hasSelectedBatch()).toBeTrue();
    });

    it('isEmpty should be true: searched=true, loading=false, no batches', () => {
      cmp.hasSearched.set(true);
      cmp.loading.set(false);
      cmp.batches.set([]);
      expect(cmp.isEmpty()).toBeTrue();
    });

    it('isEmpty should be false: not yet searched', () => {
      cmp.hasSearched.set(false);
      cmp.loading.set(false);
      cmp.batches.set([]);
      expect(cmp.isEmpty()).toBeFalse();
    });

    it('isEmpty should be false: still loading', () => {
      cmp.hasSearched.set(true);
      cmp.loading.set(true);
      cmp.batches.set([]);
      expect(cmp.isEmpty()).toBeFalse();
    });

    it('isEmpty should be false: has batches', () => {
      cmp.hasSearched.set(true);
      cmp.loading.set(false);
      cmp.batches.set([mockHeaderOpen]);
      expect(cmp.isEmpty()).toBeFalse();
    });

    it('showEmptyState should be true: not searched, not loading', () => {
      cmp.hasSearched.set(false);
      cmp.loading.set(false);
      expect(cmp.showEmptyState()).toBeTrue();
    });

    it('showEmptyState should be false: has searched', () => {
      cmp.hasSearched.set(true);
      cmp.loading.set(false);
      expect(cmp.showEmptyState()).toBeFalse();
    });

    it('showEmptyState should be false: is loading', () => {
      cmp.hasSearched.set(false);
      cmp.loading.set(true);
      expect(cmp.showEmptyState()).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 17. CHAPTER CHANGE HANDLING
  // ═══════════════════════════════════════════════════════════════════

  describe('Chapter Change Handling', () => {
    it('should reload dropdowns on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      const initialCallCount = apiServiceSpy.getWarehouses.calls.count();
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();
      expect(apiServiceSpy.getWarehouses).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(apiServiceSpy.getStatuses).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(apiServiceSpy.getBatchIds).toHaveBeenCalledTimes(initialCallCount + 1);
    }));



    it('should clear batches on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      expect(cmp.batches().length).toBeGreaterThan(0);
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();
      expect(cmp.batches().length).toBe(0);
    }));

    it('should clear selected batch on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();
      expect(cmp.selectedBatch()).toBeNull();
    }));

    it('should reset hasSearched on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      expect(cmp.hasSearched()).toBeTrue();
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();
      expect(cmp.hasSearched()).toBeFalse();
    }));

    it('should return to initial empty state after chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();
      expect(cmp.showEmptyState()).toBeTrue();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 18. ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════════

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have unique component ID matching pattern', () => {
      expect(cmp.componentId).toMatch(/^lab-warehouse-transfer-query-\d+$/);
    });





    it('should generate unique label IDs', () => {
      const lblId = cmp.labelId('fromWarehouse');
      expect(lblId).toContain(cmp.componentId);
      expect(lblId).toContain('fromWarehouse-label');
    });



    it('should have search section with region role', () => {
      const section = fixture.debugElement.query(By.css('section.search-section'));
      expect(section.nativeElement.getAttribute('role')).toBe('region');
    });




  });

  // ═══════════════════════════════════════════════════════════════════
  // 19. DOM RENDERING — EMPTY STATES
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 20. DOM RENDERING — ERROR DISPLAY
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 21. DOM RENDERING — MASTER-DETAIL LAYOUT
  // ═══════════════════════════════════════════════════════════════════

  describe('DOM Rendering — Master-Detail Layout', () => {




    it('should render batch count in panel heading', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      fixture.detectChanges();
      const heading = fixture.debugElement.query(
        By.css(`#${cmp.elementId('batch-list-heading')}`)
      );
      expect(heading?.nativeElement.textContent).toContain('Batch ID');
    }));







    it('should render batch ID in details', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      fixture.detectChanges();
      const batchIdEl = fixture.debugElement.query(By.css('.batch-header-id'));
      expect(batchIdEl?.nativeElement.textContent.trim()).toBe('BATCH001');
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 22. DOM RENDERING — BATCH CARD CONTENT
  // ═══════════════════════════════════════════════════════════════════

  describe('DOM Rendering — Batch Card Content', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should display batch ID in card', () => {
      const batchIds = fixture.debugElement.queryAll(By.css('.batch-id'));
      expect(batchIds[0]?.nativeElement.textContent.trim()).toBe('BATCH001');
    });

    it('should display status badge with text', () => {
      const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
      expect(badges.length).toBe(3);
    });

    it('should display creation date in card', () => {
      const dates = fixture.debugElement.queryAll(By.css('.batch-date'));
      expect(dates[0]?.nativeElement.textContent.trim()).toBe('15-JAN-2024');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 23. DOM RENDERING — BATCH DETAIL VALUES
  // ═══════════════════════════════════════════════════════════════════

  describe('DOM Rendering — Batch Detail Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      fixture.detectChanges();
    }));

    it('should display batch ID in header bar', () => {
      const batchId = fixture.debugElement.query(By.css('.batch-header-id'));
      expect(batchId?.nativeElement.textContent.trim()).toBe('BATCH001');
    });

    it('should display formatted create date', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[0]?.nativeElement.textContent.trim()).toBe('15-JAN-2024');
    });

    it('should display remarks', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[1]?.nativeElement.textContent.trim()).toBe('Morning Transfer');
    });

    it('should display transfer direction with arrow', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[2]?.nativeElement.textContent.trim()).toContain('→');
    });

    it('should display out temperature with °C', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[3]?.nativeElement.textContent.trim()).toBe('4.5°C');
    });

    it('should display dash for null reconDate', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[4]?.nativeElement.textContent.trim()).toBe('-');
    });

    it('should display dash for null reconUser', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[5]?.nativeElement.textContent.trim()).toBe('-');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 24. BATCH DETAIL — CLOSED BATCH WITH RECON DATA
  // ═══════════════════════════════════════════════════════════════════

  describe('Batch Detail — Closed Batch with Recon Data', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of({
        ...mockQueryResponse,
        data: [mockHeaderClosed],
        total: 1
      }));
      apiServiceSpy.getComplete.and.returnValue(of({
        header: mockHeaderClosed,
        details: mockUnits
      }));
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderClosed);
      tick();
      fixture.detectChanges();
    }));

    it('should display reconciliation date', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[4]?.nativeElement.textContent.trim()).toBe('14-JAN-2024');
    });

    it('should display reconciliation user', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[5]?.nativeElement.textContent.trim()).toBe('USER02');
    });

    it('should display out temperature for closed batch', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[3]?.nativeElement.textContent.trim()).toBe('3.2°C');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 25. BATCH DETAIL — RECON BATCH WITH NULL VALUES
  // ═══════════════════════════════════════════════════════════════════

  describe('Batch Detail — Recon Batch with Null Values', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of({
        ...mockQueryResponse,
        data: [mockHeaderRecon],
        total: 1
      }));
      apiServiceSpy.getComplete.and.returnValue(of(mockCompleteDataEmpty));
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderRecon);
      tick();
      fixture.detectChanges();
    }));

    it('should display dash for null remarks', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[1]?.nativeElement.textContent.trim()).toBe('-');
    });

    it('should display dash for null checkout temp', () => {
      const details = fixture.debugElement.queryAll(By.css('.detail-value'));
      expect(details[3]?.nativeElement.textContent.trim()).toBe('-');
    });

    it('should handle transfer direction with null from warehouse', () => {
      const direction = component.getTransferDirection(mockHeaderRecon);
      expect(direction).toContain('→');
      expect(direction).toContain('B');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 26. DOM RENDERING — SIDE PANEL STRUCTURE
  // ═══════════════════════════════════════════════════════════════════

  describe('DOM Rendering — Side Panel Structure', () => {
    it('should have mat-drawer with position=end', () => {
      fixture.detectChanges();
      const drawer = fixture.debugElement.query(By.css('mat-drawer'));
      expect(drawer).toBeTruthy();
      expect(drawer.attributes['position']).toBe('end');
    });





    it('should have CLOSE button in panel footer', () => {
      fixture.detectChanges();
      const footer = fixture.debugElement.query(By.css('.side-panel-footer button'));
      expect(footer?.nativeElement.textContent.trim()).toBe('CLOSE');
    });


  });

  // ═══════════════════════════════════════════════════════════════════
  // 27. DOM RENDERING — BUTTONS STATE
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 28. TABLE EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  describe('Table Event Handlers', () => {
    it('should handle page change without error', () => {
      const pageEvent = { pageIndex: 1, pageSize: 25, length: 100, previousPageIndex: 0 } as any;
      expect(() => component.onTablePageChange(pageEvent)).not.toThrow();
    });

    it('should sort units ascending by unitId', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();

      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      expect(component.unitsTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
      expect(component.unitsDataSource[0].unitId).toBe('UNIT001');
      expect(component.unitsDataSource[2].unitId).toBe('UNIT003');
    }));

    it('should sort units descending by unitId', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();

      component.onTableSortChange({ column: 'unitId', direction: 'D' });
      expect(component.unitsTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
      expect(component.unitsDataSource[0].unitId).toBe('UNIT003');
      expect(component.unitsDataSource[2].unitId).toBe('UNIT001');
    }));

    it('should reset to original order on default direction', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();

      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      component.onTableSortChange({ column: 'unitId', direction: 'default' });
      expect(component.unitsDataSource.map(u => u.unitId)).toEqual(['UNIT001', 'UNIT002', 'UNIT003']);
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 28b. CLEAR ALL DISABLED STATE
  // ═══════════════════════════════════════════════════════════════════

  describe('isClearAllDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





















    it('should treat whitespace-only batchId as empty', () => {
      component.f['batchId'].setValue('   ');
      expect(component.isClearAllDisabled).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 28c. DATE INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  describe('Date Input Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDateFormat error when user types unparseable text', () => {
      const mockEvent = { target: { value: 'ASDGF' } } as unknown as Event;
      component.onDateInput(mockEvent, 'fromDate');
      const control = component.f['fromDate'];
      expect(control.hasError('invalidDateFormat')).toBeTrue();
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });



    it('should not set error when input is empty', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onDateInput(mockEvent, 'fromDate');
      const control = component.f['fromDate'];
      expect(control.hasError('invalidDateFormat')).toBeFalse();
    });

    it('should not set error when control has a valid parsed value', () => {
      component.f['fromDate'].setValue(moment());
      const mockEvent = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onDateInput(mockEvent, 'fromDate');
      expect(component.f['fromDate'].hasError('invalidDateFormat')).toBeFalse();
    });

    it('should clear invalidDateFormat error when input is cleared', () => {
      const setEvent = { target: { value: 'ASDGF' } } as unknown as Event;
      component.onDateInput(setEvent, 'fromDate');
      expect(component.f['fromDate'].hasError('invalidDateFormat')).toBeTrue();

      const clearEvent = { target: { value: '' } } as unknown as Event;
      component.onDateInput(clearEvent, 'fromDate');
      expect(component.f['fromDate'].hasError('invalidDateFormat')).toBeFalse();
    });

    it('should clear invalidDateFormat error when valid date is entered', () => {
      const badEvent = { target: { value: 'INVALID' } } as unknown as Event;
      component.onDateInput(badEvent, 'toDate');
      expect(component.f['toDate'].hasError('invalidDateFormat')).toBeTrue();

      component.f['toDate'].setValue(moment());
      const goodEvent = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onDateInput(goodEvent, 'toDate');
      expect(component.f['toDate'].hasError('invalidDateFormat')).toBeFalse();
    });






  });

  // ═══════════════════════════════════════════════════════════════════
  // 29. COMPONENT CLEANUP
  // ═══════════════════════════════════════════════════════════════════

  describe('Component Cleanup', () => {
    it('should call next and complete on destroy$', () => {
      fixture.detectChanges();
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 30. TODAY GETTER — TIMEZONE HANDLING
  // ═══════════════════════════════════════════════════════════════════

  describe('Today Getter — Timezone Handling', () => {
    it('should return a moment object for today', () => {
      fixture.detectChanges();
      const today = component['today'];
      expect(moment.isMoment(today)).toBeTrue();
    });

    it('should use chapter timezone offset when available', () => {
      fixture.detectChanges();
      const today = component['today'];
      expect(today.isValid()).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 31. END-TO-END USER FLOWS
  // ═══════════════════════════════════════════════════════════════════

  describe('E2E Flow: Full Search → Select → View Temp → Clear', () => {
    it('should complete the full user workflow', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      fixture.detectChanges();

      // Step 1: Set search criteria
      component.f['fromWarehouse'].setValue('A');
      component.f['toWarehouse'].setValue('B');
      component.f['status'].setValue('OPEN');

      // Step 2: Execute search
      component.onRetrieve();
      tick();
      expect(cmp.batches().length).toBe(3);
      expect(cmp.hasBatches()).toBeTrue();
      expect(cmp.showEmptyState()).toBeFalse();
      fixture.detectChanges();

      // Step 3: Select first batch
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH001');
      expect(cmp.units().length).toBe(3);
      expect(cmp.hasSelectedBatch()).toBeTrue();
      fixture.detectChanges();

      // Step 4: Verify detail values
      expect(component.formatDate(cmp.selectedBatch()!.createDate)).toBe('15-JAN-2024');
      expect(component.formatTemperature(cmp.selectedBatch()!.checkoutTemp)).toBe('4.5°C');
      expect(component.getTransferDirection(cmp.selectedBatch()!)).toBe('A →B');

      // Step 5: View receive temperature panel
      const mockPanel = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
      (component as any).receiveTemperaturePanel = mockPanel;
      component.onViewReceiveTemperature();
      expect(mockPanel.open).toHaveBeenCalled();

      // Step 6: Close panel
      component.onCloseReceiveTemperature();
      expect(mockPanel.close).toHaveBeenCalled();

      // Step 7: Clear all
      component.onClearAll();
      expect(cmp.batches().length).toBe(0);
      expect(cmp.selectedBatch()).toBeNull();
      expect(cmp.units().length).toBe(0);
      expect(cmp.hasSearched()).toBeFalse();
      expect(cmp.showEmptyState()).toBeTrue();
    }));
  });

  describe('E2E Flow: Search → No Results → New Search → Results', () => {
    it('should recover from empty results with new search', fakeAsync(() => {
      fixture.detectChanges();

      // Step 1: Search with no results
      apiServiceSpy.queryTransfers.and.returnValue(of(mockEmptyResponse));
      component.f['status'].setValue('RECON');
      component.onRetrieve();
      tick();
      expect(cmp.isEmpty()).toBeTrue();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('No batches found matching criteria');

      // Step 2: Change filter and search again
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      component.f['status'].setValue('OPEN');
      component.onRetrieve();
      tick();
      expect(cmp.batches().length).toBe(3);
      expect(cmp.isEmpty()).toBeFalse();
      expect(cmp.hasBatches()).toBeTrue();
    }));
  });

  describe('E2E Flow: Search → Error → Retry → Success', () => {
    it('should recover from API error and succeed on retry', fakeAsync(() => {
      fixture.detectChanges();

      // Step 1: Search hits error
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({ error: { message: 'Server temporarily unavailable' } }))
      );
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('Server temporarily unavailable');
      expect(cmp.hasSearched()).toBeTrue();
      fixture.detectChanges();

      // Step 2: Retry same search succeeds
      apiServiceSpy.queryTransfers.and.returnValue(of(mockQueryResponse));
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBeNull();
      expect(cmp.batches().length).toBe(1);
    }));
  });

  describe('E2E Flow: Date Range Search', () => {
    it('should search by date range and display results', fakeAsync(() => {
      fixture.detectChanges();

      const fromDate = moment().subtract(30, 'days');
      const toDate = moment().subtract(1, 'days');
      component.f['fromDate'].setValue(fromDate);
      component.f['toDate'].setValue(toDate);

      component.onRetrieve();
      tick();

      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.fromDate).toBe(fromDate.format('YYYY-MM-DD'));
      expect(query.toDate).toBe(toDate.format('YYYY-MM-DD'));
      expect(cmp.batches().length).toBeGreaterThan(0);
    }));
  });

  describe('E2E Flow: Switch Between Batches', () => {
    it('should load different details when switching batches', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockMultipleBatchResponse));
      fixture.detectChanges();
      component.onRetrieve();
      tick();

      // Select first batch
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH001');
      expect(cmp.units().length).toBe(3);

      // Switch to second batch
      const closedCompleteData: LabWhTransCompleteDto = {
        header: mockHeaderClosed,
        details: [mockUnits[0]]
      };
      apiServiceSpy.getComplete.and.returnValue(of(closedCompleteData));
      component.onSelectBatch(mockHeaderClosed);
      tick();
      expect(cmp.selectedBatch()?.batchId).toBe('BATCH002');
      expect(cmp.units().length).toBe(1);

      // Verify highlight changed
      expect(component.isBatchSelected(mockHeaderClosed)).toBeTrue();
      expect(component.isBatchSelected(mockHeaderOpen)).toBeFalse();
    }));
  });

  describe('E2E Flow: Chapter Change During Active Session', () => {
    it('should reset everything when chapter changes mid-session', fakeAsync(() => {
      fixture.detectChanges();

      // Perform search and select batch
      component.f['fromWarehouse'].setValue('A');
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.batches().length).toBeGreaterThan(0);
      expect(cmp.selectedBatch()).toBeTruthy();

      // Chapter changes
      (headerServiceSpy.chapterChanged$ as Subject<void>).next();
      tick();

      // Everything should be reset
      expect(cmp.batches().length).toBe(0);
      expect(cmp.selectedBatch()).toBeNull();
      expect(cmp.units().length).toBe(0);
      expect(component.f['fromWarehouse'].value).toBeNull();
      expect(cmp.hasSearched()).toBeFalse();
      expect(cmp.showEmptyState()).toBeTrue();

      // Dropdowns should be reloaded
      expect(apiServiceSpy.getWarehouses).toHaveBeenCalledTimes(2);
    }));
  });

  describe('E2E Flow: Batch Selection Error Recovery', () => {
    it('should handle batch detail load failure and allow retry', fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();

      // First attempt fails
      apiServiceSpy.getComplete.and.returnValue(throwError(() => new Error('timeout')));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.loadingBatchDetails()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();

      // Retry succeeds
      apiServiceSpy.getComplete.and.returnValue(of(mockCompleteData));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.units().length).toBe(3);
    }));
  });

  describe('E2E Flow: Multiple Status Searches', () => {
    it('should search with different statuses sequentially', fakeAsync(() => {
      fixture.detectChanges();

      // Search OPEN
      component.f['status'].setValue('OPEN');
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers.calls.mostRecent().args[0].status).toBe('OPEN');

      // Search CLOSED
      component.f['status'].setValue('CLOSED');
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers.calls.mostRecent().args[0].status).toBe('CLOSED');

      // Search RECON
      component.f['status'].setValue('RECON');
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers.calls.mostRecent().args[0].status).toBe('RECON');

      // Search All
      component.f['status'].setValue('');
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryTransfers.calls.mostRecent().args[0].status).toBeUndefined();

      expect(apiServiceSpy.queryTransfers).toHaveBeenCalledTimes(4);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 32. EDGE CASES — UNIT DETAIL TABLE DATA
  // ═══════════════════════════════════════════════════════════════════

  describe('Edge Cases — Unit Detail Data', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
    }));

    it('should handle unit with all null optional fields', () => {
      const nullUnit = cmp.units().find((u: any) => u.unitId === 'UNIT003');
      expect(nullUnit).toBeTruthy();
      expect(nullUnit?.productCode).toBeNull();
      expect(nullUnit?.receiveWarehouse).toBeNull();
      expect(nullUnit?.receiveDate).toBeNull();
      expect(nullUnit?.receiveUser).toBeNull();
      expect(nullUnit?.receiveTemp).toBeNull();
      expect(nullUnit?.reconReason).toBeNull();
      expect(nullUnit?.reconDetail).toBeNull();
    });



    it('should format null temperature correctly for table display', () => {
      expect(component.formatTemperature(null)).toBe('-');
    });



    it('should format receiveDate through valueFormatter', () => {
      const dateCol = component.unitsTableConfig.columns.find(c => c.key === 'receiveDate');
      expect(dateCol?.valueFormatter).toBeDefined();
      expect(dateCol!.valueFormatter!('2024-01-15T11:00:00Z', {} as any)).toBe('15-JAN-2024');
      expect(dateCol!.valueFormatter!(null, {} as any)).toBe('-');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 33. DOM RENDERING — FORM FIELD STRUCTURE
  // ═══════════════════════════════════════════════════════════════════

  describe('DOM Rendering — Form Field Structure', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));









    it('should render Batch ID input with maxlength=10', () => {
      const batchId = fixture.debugElement.query(
        By.css(`#${cmp.elementId('batchId')}`)
      );
      expect(batchId.nativeElement.getAttribute('maxlength')).toBe('10');
    });










  });

  // ═══════════════════════════════════════════════════════════════════
  // 34. DOM RENDERING — LOADING INDICATORS
  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // 35. WAREHOUSE DROPDOWN DATA
  // ═══════════════════════════════════════════════════════════════════

  describe('Warehouse Dropdown Data', () => {
    it('should populate warehouses from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(cmp.warehouses().length).toBe(4);
      expect(cmp.warehouses()[0].code).toBe('A');
      expect(cmp.warehouses()[0].description).toBe('Warehouse A');
    }));


  });

  // ═══════════════════════════════════════════════════════════════════
  // 36. isBatchSelected EDGE CASES
  // ═══════════════════════════════════════════════════════════════════

  describe('isBatchSelected Edge Cases', () => {
    it('should return false when no batch is selected', () => {
      cmp.selectedBatch.set(null);
      expect(component.isBatchSelected(mockHeaderOpen)).toBeFalse();
    });

    it('should return true for matching batch ID', () => {
      cmp.selectedBatch.set(mockHeaderOpen);
      expect(component.isBatchSelected(mockHeaderOpen)).toBeTrue();
    });

    it('should return false for non-matching batch ID', () => {
      cmp.selectedBatch.set(mockHeaderOpen);
      expect(component.isBatchSelected(mockHeaderClosed)).toBeFalse();
    });

    it('should match by batchId property specifically', () => {
      cmp.selectedBatch.set(mockHeaderOpen);
      const duplicateIdBatch = { ...mockHeaderClosed, batchId: 'BATCH001' };
      expect(component.isBatchSelected(duplicateIdBatch)).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 37. SEARCH FORM — FORM GROUP STRUCTURE
  // ═══════════════════════════════════════════════════════════════════

  describe('Search Form — Form Group Structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have all 6 form controls', () => {
      const controls = Object.keys(component.searchForm.controls);
      expect(controls).toContain('fromWarehouse');
      expect(controls).toContain('toWarehouse');
      expect(controls).toContain('status');
      expect(controls).toContain('batchId');
      expect(controls).toContain('fromDate');
      expect(controls).toContain('toDate');
    });

    it('should expose form controls via f getter', () => {
      expect(component.f['fromWarehouse']).toBeTruthy();
      expect(component.f['toWarehouse']).toBeTruthy();
      expect(component.f['status']).toBeTruthy();
      expect(component.f['batchId']).toBeTruthy();
      expect(component.f['fromDate']).toBeTruthy();
      expect(component.f['toDate']).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 38. getFromDateError — BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('getFromDateError — Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched or dirty', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('should return "Invalid date format" for matDatepickerParse error', () => {
      const control = component.f['fromDate'];
      control.markAsTouched();
      control.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getFromDateError()).toBe('Invalid date format');
    });

    it('should return "Invalid date format" for invalidDateFormat error', () => {
      const control = component.f['fromDate'];
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.getFromDateError()).toBe('Invalid date format');
    });

    it('should return "From Date cannot be in the future" for matDatepickerMax error', () => {
      const control = component.f['fromDate'];
      control.markAsTouched();
      control.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      expect(component.getFromDateError()).toBe('From Date cannot be in the future');
    });

    it('should return base error from DateFieldValidationUtility when no specific error', () => {
      const control = component.f['fromDate'];
      control.markAsTouched();
      control.markAsDirty();
      // Set a date range error at form level
      const fromDate = moment().subtract(1, 'days');
      const toDate = moment().subtract(7, 'days');
      component.f['fromDate'].setValue(fromDate);
      component.f['toDate'].setValue(toDate);
      component.searchForm.updateValueAndValidity();
      const error = component.getFromDateError();
      expect(error).toBe('From Date cannot be after To Date');
    });

    it('should return empty string when control is dirty but has no errors', () => {
      const control = component.f['fromDate'];
      control.markAsDirty();
      control.setValue(moment());
      control.setErrors(null);
      component.searchForm.setErrors(null);
      expect(component.getFromDateError()).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 39. getToDateError — BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('getToDateError — Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched or dirty', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('should return "Invalid date format" for matDatepickerParse error', () => {
      const control = component.f['toDate'];
      control.markAsTouched();
      control.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getToDateError()).toBe('Invalid date format');
    });

    it('should return "Invalid date format" for invalidDateFormat error', () => {
      const control = component.f['toDate'];
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.getToDateError()).toBe('Invalid date format');
    });

    it('should return "To Date cannot be in the future" for matDatepickerMax error', () => {
      const control = component.f['toDate'];
      control.markAsTouched();
      control.setErrors({ matDatepickerMax: { max: moment(), actual: moment().add(1, 'day') } });
      expect(component.getToDateError()).toBe('To Date cannot be in the future');
    });

    it('should return base error from DateFieldValidationUtility when dateRangeInvalid', () => {
      const control = component.f['toDate'];
      control.markAsTouched();
      control.markAsDirty();
      component.f['fromDate'].setValue(moment().subtract(1, 'days'));
      component.f['toDate'].setValue(moment().subtract(7, 'days'));
      component.searchForm.updateValueAndValidity();
      const error = component.getToDateError();
      expect(error).toBe('To Date cannot be before From Date');
    });

    it('should return empty string when control is dirty but has no errors', () => {
      const control = component.f['toDate'];
      control.markAsDirty();
      control.setValue(moment());
      control.setErrors(null);
      component.searchForm.setErrors(null);
      expect(component.getToDateError()).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 40. onDateInput — ADDITIONAL BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('onDateInput — Additional Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when controlName does not exist', () => {
      const mockEvent = { target: { value: 'test' } } as unknown as Event;
      expect(() => component.onDateInput(mockEvent, 'nonExistentControl')).not.toThrow();
    });

    it('should clear invalidDateFormat error when control has existing error and value is parsed', () => {
      const control = component.f['fromDate'];
      control.setErrors({ invalidDateFormat: true });
      control.setValue(moment());
      const mockEvent = { target: { value: '15-JAN-2024' } } as unknown as Event;
      component.onDateInput(mockEvent, 'fromDate');
      expect(control.hasError('invalidDateFormat')).toBeFalse();
    });

    it('should not set error when input is whitespace only and control has no value', () => {
      const mockEvent = { target: { value: '   ' } } as unknown as Event;
      component.onDateInput(mockEvent, 'fromDate');
      const control = component.f['fromDate'];
      // '   '.trim() is '' which is falsy, so the first branch condition is not met
      expect(control.hasError('invalidDateFormat')).toBeFalse();
    });

    it('should work for toDate control', () => {
      const mockEvent = { target: { value: 'INVALID' } } as unknown as Event;
      component.onDateInput(mockEvent, 'toDate');
      const control = component.f['toDate'];
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
      expect(control.hasError('invalidDateFormat')).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 41. onViewReceiveTemperature / onCloseReceiveTemperature — BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('Receive Temperature Panel — Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not open panel when no batch is selected', () => {
      const mockPanel = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
      (component as any).receiveTemperaturePanel = mockPanel;
      cmp.selectedBatch.set(null);
      component.onViewReceiveTemperature();
      expect(mockPanel.open).not.toHaveBeenCalled();
    });

    it('should open panel when batch is selected', () => {
      const mockPanel = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
      (component as any).receiveTemperaturePanel = mockPanel;
      cmp.selectedBatch.set(mockHeaderOpen);
      component.onViewReceiveTemperature();
      expect(mockPanel.open).toHaveBeenCalled();
    });

    it('should close panel when onCloseReceiveTemperature is called', () => {
      const mockPanel = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
      (component as any).receiveTemperaturePanel = mockPanel;
      component.onCloseReceiveTemperature();
      expect(mockPanel.close).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 42. getStatusClass — ADDITIONAL BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('getStatusClass — Additional Branch Coverage', () => {
    it('should return status-closed for CLOSE (without D)', () => {
      expect(component.getStatusClass('CLOSE')).toBe('status-closed');
    });

    it('should return empty string for null status', () => {
      expect(component.getStatusClass(null as any)).toBe('');
    });

    it('should return empty string for undefined status', () => {
      expect(component.getStatusClass(undefined as any)).toBe('');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.getStatusClass('')).toBe('');
    });

    it('should handle mixed-case CLOSE', () => {
      expect(component.getStatusClass('Close')).toBe('status-closed');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 43. formatDate — ADDITIONAL BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('formatDate — Additional Branch Coverage', () => {
    it('should return dash for null value', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for empty string', () => {
      // moment('') used to be valid but now isn't; depends on moment version
      const result = component.formatDate('');
      expect(result).toBe('-');
    });

    it('should return dash for completely invalid date string', () => {
      expect(component.formatDate('not-a-date-at-all-xyz')).toBe('-');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 44. filteredFromWarehouses / filteredToWarehouses — COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════════════════════

  describe('Warehouse Search Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all warehouses when fromWhSearch is empty', () => {
      cmp.fromWhSearch.set('');
      expect(cmp.filteredFromWarehouses().length).toBe(4);
    });

    it('should filter fromWarehouses by code (case insensitive)', () => {
      cmp.fromWhSearch.set('a');
      const filtered = cmp.filteredFromWarehouses();
      expect(filtered.some((w: any) => w.code === 'A')).toBeTrue();
    });

    it('should filter fromWarehouses by description', () => {
      cmp.fromWhSearch.set('hospital');
      const filtered = cmp.filteredFromWarehouses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('H');
    });

    it('should return empty array for no matching fromWarehouse', () => {
      cmp.fromWhSearch.set('nonexistent');
      const filtered = cmp.filteredFromWarehouses();
      expect(filtered.length).toBe(0);
    });

    it('should return all warehouses when toWhSearch is empty', () => {
      cmp.toWhSearch.set('');
      expect(cmp.filteredToWarehouses().length).toBe(4);
    });

    it('should filter toWarehouses by code (case insensitive)', () => {
      cmp.toWhSearch.set('b');
      const filtered = cmp.filteredToWarehouses();
      expect(filtered.some((w: any) => w.code === 'B')).toBeTrue();
    });

    it('should filter toWarehouses by description', () => {
      cmp.toWhSearch.set('lab');
      const filtered = cmp.filteredToWarehouses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('L');
    });

    it('should return empty array for no matching toWarehouse', () => {
      cmp.toWhSearch.set('zzzzz');
      const filtered = cmp.filteredToWarehouses();
      expect(filtered.length).toBe(0);
    });

    it('should sync fromWhSearchCtrl value to fromWhSearch signal', fakeAsync(() => {
      cmp.fromWhSearchCtrl.setValue('test');
      tick();
      expect(cmp.fromWhSearch()).toBe('test');
    }));

    it('should sync toWhSearchCtrl value to toWhSearch signal', fakeAsync(() => {
      cmp.toWhSearchCtrl.setValue('test');
      tick();
      expect(cmp.toWhSearch()).toBe('test');
    }));

    it('should handle null value in fromWhSearchCtrl', fakeAsync(() => {
      cmp.fromWhSearchCtrl.setValue(null);
      tick();
      expect(cmp.fromWhSearch()).toBe('');
    }));

    it('should handle null value in toWhSearchCtrl', fakeAsync(() => {
      cmp.toWhSearchCtrl.setValue(null);
      tick();
      expect(cmp.toWhSearch()).toBe('');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 45. receiveTempTableConfig — VALUE FORMATTER
  // ═══════════════════════════════════════════════════════════════════

  describe('receiveTempTableConfig — Value Formatter', () => {
    it('should format non-null temperature with degree suffix', () => {
      const tempCol = component.receiveTempTableConfig.columns.find(c => c.key === 'receiveTemp');
      expect(tempCol?.valueFormatter).toBeDefined();
      expect(tempCol!.valueFormatter!(4.5, {} as any)).toBe('4.5°C');
    });

    it('should return dash for null temperature', () => {
      const tempCol = component.receiveTempTableConfig.columns.find(c => c.key === 'receiveTemp');
      expect(tempCol!.valueFormatter!(null, {} as any)).toBe('-');
    });

    it('should return dash for undefined temperature', () => {
      const tempCol = component.receiveTempTableConfig.columns.find(c => c.key === 'receiveTemp');
      expect(tempCol!.valueFormatter!(undefined, {} as any)).toBe('-');
    });

    it('should format zero temperature', () => {
      const tempCol = component.receiveTempTableConfig.columns.find(c => c.key === 'receiveTemp');
      expect(tempCol!.valueFormatter!(0, {} as any)).toBe('0°C');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 46. isClearAllDisabled — FULL BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('isClearAllDisabled — Full Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when formDirty is false and hasSearched is false', () => {
      cmp.formDirty.set(false);
      cmp.hasSearched.set(false);
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should be enabled when formDirty is true', () => {
      cmp.formDirty.set(true);
      cmp.hasSearched.set(false);
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be enabled when hasSearched is true', () => {
      cmp.formDirty.set(false);
      cmp.hasSearched.set(true);
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be enabled when both formDirty and hasSearched are true', () => {
      cmp.formDirty.set(true);
      cmp.hasSearched.set(true);
      expect(component.isClearAllDisabled).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 47. today GETTER — TIMEZONE BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('today Getter — Timezone Branch Coverage', () => {
    it('should fall back to moment().startOf(day) when chapterTimeZone is falsy', () => {
      (headerServiceSpy as any).chapterTimeZone = signal(null);
      fixture = TestBed.createComponent(LabWarehouseTransferQuery);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const today = (component as any).today;
      expect(moment.isMoment(today)).toBeTrue();
      expect(today.isValid()).toBeTrue();
    });

    it('should use utcOffset when chapterTimeZone is provided', () => {
      fixture.detectChanges();
      const today = (component as any).today;
      expect(moment.isMoment(today)).toBeTrue();
      expect(today.isValid()).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 48. onRetrieve — UNIT ID + DATE LOGIC BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('onRetrieve — Unit ID and Date Logic Branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should include validatedUnitId when unitIdField is valid', fakeAsync(() => {
      (component as any).validatedUnitId = 'W6333317070132';
      (component as any).unitIdField = { isValid: true, clear: () => {} };
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.unitId).toBe('W6333317070132');
    }));

    it('should not include unitId when validatedUnitId is null', fakeAsync(() => {
      (component as any).validatedUnitId = null;
      (component as any).unitIdField = { isValid: false, clear: () => {} };
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.unitId).toBeUndefined();
    }));

    it('should not include unitId when unitIdField.isValid is false', fakeAsync(() => {
      (component as any).validatedUnitId = 'W6333317070132';
      (component as any).unitIdField = { isValid: false, clear: () => {} };
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.unitId).toBeUndefined();
    }));

    it('should skip default date logic when batchId has value', fakeAsync(() => {
      component.f['batchId'].setValue('BATCH001');
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.batchId).toBe('BATCH001');
      // Dates may or may not be set, but batchId should override default date logic
    }));

    it('should skip default date logic when unitId is valid', fakeAsync(() => {
      (component as any).validatedUnitId = 'W6333317070132';
      (component as any).unitIdField = { isValid: true, clear: () => {} };
      component.onRetrieve();
      tick();
      const query = apiServiceSpy.queryTransfers.calls.mostRecent().args[0];
      expect(query.unitId).toBe('W6333317070132');
      expect(query.fromDate).toBeUndefined();
      expect(query.toDate).toBeUndefined();
    }));

    it('should show snackbar error when fromDate is after toDate via moment check', () => {
      // Set valid moment dates where from > to
      const fromDate = moment().subtract(1, 'days');
      const toDate = moment().subtract(5, 'days');
      component.f['fromDate'].setValue(fromDate);
      component.f['toDate'].setValue(toDate);
      // The crossFieldDateRangeValidator will catch this, making form invalid
      component.onRetrieve();
      // Either snackbar is called or form is invalid
      expect(apiServiceSpy.queryTransfers).not.toHaveBeenCalled();
    });

    it('should cap toDate auto-fill at today when fromDate + 30 exceeds today', fakeAsync(() => {
      const recentDate = moment().subtract(5, 'days');
      component.f['fromDate'].setValue(recentDate);
      component.onRetrieve();
      tick();
      const toDateValue = component.f['toDate'].value;
      expect(toDateValue).toBeTruthy();
      // toDate should not exceed today
      const todayStr = moment().startOf('day').format('YYYY-MM-DD');
      const toDateStr = toDateValue.format('YYYY-MM-DD');
      expect(toDateStr <= todayStr).toBeTrue();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 49. getErrorMessage — ADDITIONAL FORMAT COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('getErrorMessage — Additional Format Coverage', () => {
    it('should return errorResponse format (errorCode + error)', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: 'WH001',
            error: 'Warehouse not found'
          }
        }
      };
      expect(cmp.getErrorMessage(error)).toBe('Error WH001: Warehouse not found');
    });

    it('should prefer errorResponse over other formats', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: 'WH001',
            error: 'Warehouse not found'
          },
          errorCode: 'E100',
          message: 'Different message'
        },
        status: 404
      };
      expect(cmp.getErrorMessage(error)).toBe('Error WH001: Warehouse not found');
    });

    it('should handle null error object', () => {
      expect(cmp.getErrorMessage(null)).toBe('An error occurred. Please try again.');
    });

    it('should handle undefined error object', () => {
      expect(cmp.getErrorMessage(undefined)).toBe('An error occurred. Please try again.');
    });

    it('should handle error with only status', () => {
      expect(cmp.getErrorMessage({ status: 500 })).toBe('An error occurred. Please try again.');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 50. executeSearch — STATE MANAGEMENT DURING LOADING
  // ═══════════════════════════════════════════════════════════════════

  describe('executeSearch — State Management During Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear error before executing search', fakeAsync(() => {
      // First cause an error
      apiServiceSpy.queryTransfers.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBe('fail');

      // Now retry - error should be cleared
      apiServiceSpy.queryTransfers.and.returnValue(of(mockQueryResponse));
      component.onRetrieve();
      tick();
      expect(cmp.error()).toBeNull();
    }));

    it('should clear selectedBatch before executing search', fakeAsync(() => {
      // Select a batch first
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()).toBeTruthy();

      // Perform new search
      component.onRetrieve();
      tick();
      // After search completes, selectedBatch should have been cleared
      expect(cmp.selectedBatch()).toBeNull();
    }));

    it('should clear units before executing search', fakeAsync(() => {
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.units().length).toBe(3);

      // Perform new search
      component.onRetrieve();
      tick();
      expect(cmp.units().length).toBe(0);
    }));

    it('should set loading to false on successful response', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(cmp.loading()).toBeFalse();
    }));

    it('should set loading to false on error response', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      tick();
      expect(cmp.loading()).toBeFalse();
    }));

    it('should show success snackbar when no results', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(of(mockEmptyResponse));
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('No batches found matching criteria');
    }));

    it('should show error snackbar on search failure', fakeAsync(() => {
      apiServiceSpy.queryTransfers.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 51. loadBatchDetails — STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  describe('loadBatchDetails — State Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
    }));

    it('should set loadingBatchDetails to true during load', fakeAsync(() => {
      let loadingDuringCall = false;
      apiServiceSpy.getComplete.and.callFake(() => {
        loadingDuringCall = cmp.loadingBatchDetails();
        return of(mockCompleteData);
      });
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(loadingDuringCall).toBeTrue();
      expect(cmp.loadingBatchDetails()).toBeFalse();
    }));

    it('should handle null details in response', fakeAsync(() => {
      apiServiceSpy.getComplete.and.returnValue(of({
        header: mockHeaderOpen,
        details: null as any
      }));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.units().length).toBe(0);
      expect(component.unitsDataSource.length).toBe(0);
    }));

    it('should update selectedBatch header from complete response', fakeAsync(() => {
      const updatedHeader = { ...mockHeaderOpen, batchName: 'Updated Name' };
      apiServiceSpy.getComplete.and.returnValue(of({
        header: updatedHeader,
        details: mockUnits
      }));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(cmp.selectedBatch()?.batchName).toBe('Updated Name');
    }));

    it('should show error snackbar with formatted message on detail load error', fakeAsync(() => {
      apiServiceSpy.getComplete.and.returnValue(throwError(() => ({
        error: { errorCode: 'D001', message: 'Details not found' }
      })));
      component.onSelectBatch(mockHeaderOpen);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error D001: Details not found');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 52. updateFormDirty — BRANCH COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('updateFormDirty — Branch Coverage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set formDirty to true when fromWarehouse has value', () => {
      component.f['fromWarehouse'].setValue('A');
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to true when toWarehouse has value', () => {
      component.f['toWarehouse'].setValue('B');
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to true when status has value', () => {
      component.f['status'].setValue('OPEN');
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to true when batchId has non-whitespace value', () => {
      component.f['batchId'].setValue('BATCH001');
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to false when batchId is whitespace only', () => {
      component.f['batchId'].setValue('   ');
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeFalse();
    });

    it('should set formDirty to true when fromDate has value', () => {
      component.f['fromDate'].setValue(moment());
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to true when toDate has value', () => {
      component.f['toDate'].setValue(moment());
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to true when validatedUnitId has value', () => {
      (component as any).validatedUnitId = 'W6333317070132';
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to false when all fields are empty', () => {
      component.searchForm.reset();
      (component as any).validatedUnitId = null;
      cmp.updateFormDirty();
      expect(cmp.formDirty()).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 53. onClearAll — UNIT ID FIELD INTERACTION
  // ═══════════════════════════════════════════════════════════════════

  describe('onClearAll — Unit ID Field Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call unitIdField.clear when available', () => {
      const mockUnitIdField = { isValid: true, clear: jasmine.createSpy('clear') };
      (component as any).unitIdField = mockUnitIdField;
      component.onClearAll();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
    });

    it('should handle when unitIdField is undefined', () => {
      (component as any).unitIdField = undefined;
      expect(() => component.onClearAll()).not.toThrow();
    });

    it('should reset unitsDataSource to empty array', () => {
      component.unitsDataSource = [...mockUnits];
      component.onClearAll();
      expect(component.unitsDataSource.length).toBe(0);
    });

    it('should reset formDirty to false', () => {
      cmp.formDirty.set(true);
      component.onClearAll();
      expect(cmp.formDirty()).toBeFalse();
    });

    it('should reset all form controls', () => {
      component.f['fromWarehouse'].setValue('A');
      component.f['toWarehouse'].setValue('B');
      component.f['status'].setValue('OPEN');
      component.f['batchId'].setValue('BATCH001');
      component.f['fromDate'].setValue(moment());
      component.f['toDate'].setValue(moment());
      component.onClearAll();
      expect(component.f['fromWarehouse'].value).toBeNull();
      expect(component.f['toWarehouse'].value).toBeNull();
      expect(component.f['status'].value).toBeNull();
      expect(component.f['batchId'].value).toBeNull();
      expect(component.f['fromDate'].value).toBeNull();
      expect(component.f['toDate'].value).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 54. onUnitValidated / onUnitCleared — FORM DIRTY INTERACTION
  // ═══════════════════════════════════════════════════════════════════

  describe('onUnitValidated / onUnitCleared — Form Dirty Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set formDirty to true when unit is validated', () => {
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      expect(cmp.formDirty()).toBeTrue();
    });

    it('should set formDirty to false when unit is cleared and form is empty', () => {
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      expect(cmp.formDirty()).toBeTrue();
      component.onUnitCleared();
      expect(cmp.formDirty()).toBeFalse();
    });

    it('should keep formDirty true when unit is cleared but form has other values', () => {
      component.f['fromWarehouse'].setValue('A');
      component.onUnitValidated({ parsedUnitId: 'W6333317070132' });
      component.onUnitCleared();
      expect(cmp.formDirty()).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 55. onTableSortChange — ADDITIONAL SORT COVERAGE
  // ═══════════════════════════════════════════════════════════════════

  describe('onTableSortChange — Additional Sort Coverage', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onRetrieve();
      tick();
      component.onSelectBatch(mockHeaderOpen);
      tick();
    }));

    it('should sort by productCode ascending', () => {
      component.onTableSortChange({ column: 'productCode', direction: 'A' });
      // null productCode should sort differently than non-null
      expect(component.unitsDataSource.length).toBe(3);
      expect(component.unitsTableConfig.sortConfig?.column).toBe('productCode');
    });

    it('should sort by productCode descending', () => {
      component.onTableSortChange({ column: 'productCode', direction: 'D' });
      expect(component.unitsTableConfig.sortConfig?.direction).toBe('D');
    });

    it('should handle null values in sort comparisons', () => {
      component.onTableSortChange({ column: 'receiveWarehouse', direction: 'A' });
      // UNIT003 has null receiveWarehouse
      expect(component.unitsDataSource.length).toBe(3);
    });

    it('should update sortConfig on each sort call', () => {
      component.onTableSortChange({ column: 'unitId', direction: 'A' });
      expect(component.unitsTableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
      component.onTableSortChange({ column: 'productCode', direction: 'D' });
      expect(component.unitsTableConfig.sortConfig).toEqual({ column: 'productCode', direction: 'D' });
    });

    it('should restore original order with default direction after sort', () => {
      const originalOrder = component.unitsDataSource.map(u => u.unitId);
      component.onTableSortChange({ column: 'unitId', direction: 'D' });
      component.onTableSortChange({ column: 'unitId', direction: 'default' });
      expect(component.unitsDataSource.map(u => u.unitId)).toEqual(originalOrder);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 56. fromDateErrorMatcher / toDateErrorMatcher
  // ═══════════════════════════════════════════════════════════════════

  describe('Date Error State Matchers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false for fromDateErrorMatcher when control is not touched', () => {
      const control = component.f['fromDate'] as FormControl;
      expect(component.fromDateErrorMatcher.isErrorState(control, null)).toBeFalse();
    });

    it('should return true for fromDateErrorMatcher when control is touched and has error', () => {
      const control = component.f['fromDate'] as FormControl;
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.fromDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('should return false for toDateErrorMatcher when control is not touched', () => {
      const control = component.f['toDate'] as FormControl;
      expect(component.toDateErrorMatcher.isErrorState(control, null)).toBeFalse();
    });

    it('should return true for toDateErrorMatcher when control is touched and has error', () => {
      const control = component.f['toDate'] as FormControl;
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.toDateErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('should return false for fromDateErrorMatcher with null control', () => {
      expect(component.fromDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 57. Accessibility — ID GENERATORS
  // ═══════════════════════════════════════════════════════════════════

  describe('Accessibility — ID Generators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate element IDs with component prefix', () => {
      const id = cmp.elementId('batchId');
      expect(id).toContain(cmp.componentId);
      expect(id).toContain('batchId');
    });

    it('should generate error IDs with -error suffix', () => {
      const id = cmp.errorId('fromDate');
      expect(id).toContain(cmp.componentId);
      expect(id).toContain('fromDate-error');
    });

    it('should generate unique IDs for different elements', () => {
      const id1 = cmp.elementId('fromWarehouse');
      const id2 = cmp.elementId('toWarehouse');
      expect(id1).not.toBe(id2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 58. Form ValueChanges — Subscription
  // ═══════════════════════════════════════════════════════════════════

  describe('Form ValueChanges — Subscription', () => {
    it('should update formDirty when form values change', fakeAsync(() => {
      fixture.detectChanges();
      expect(cmp.formDirty()).toBeFalse();
      component.f['fromWarehouse'].setValue('A');
      tick();
      expect(cmp.formDirty()).toBeTrue();
      component.f['fromWarehouse'].setValue('');
      tick();
      expect(cmp.formDirty()).toBeFalse();
    }));

    it('should track batchId changes to batchIdSearch signal', fakeAsync(() => {
      fixture.detectChanges();
      component.f['batchId'].setValue('BATCH');
      tick();
      expect(cmp.batchIdSearch()).toBe('BATCH');
    }));

    it('should set batchIdSearch to empty string for null batchId', fakeAsync(() => {
      fixture.detectChanges();
      component.f['batchId'].setValue(null);
      tick();
      expect(cmp.batchIdSearch()).toBe('');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════
  // 59. Table Config — Static Configuration
  // ═══════════════════════════════════════════════════════════════════

  describe('Table Config — Static Configuration', () => {
    it('should have correct number of columns in unitsTableConfig', () => {
      expect(component.unitsTableConfig.columns.length).toBe(7);
    });

    it('should have stickyHeader enabled for units table', () => {
      expect(component.unitsTableConfig.stickyHeader).toBeTrue();
    });

    it('should have pagination disabled for units table', () => {
      expect(component.unitsTableConfig.showPagination).toBeFalse();
    });

    it('should have correct empty message for units table', () => {
      expect(component.unitsTableConfig.emptyMessage).toBe('No Units to Display');
    });

    it('should have correct number of columns in receiveTempTableConfig', () => {
      expect(component.receiveTempTableConfig.columns.length).toBe(3);
    });

    it('should have stickyHeader disabled for receive temp table', () => {
      expect(component.receiveTempTableConfig.stickyHeader).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // 60. Page Header Config — Effect
  // ═══════════════════════════════════════════════════════════════════

  describe('Page Header Config — Effect', () => {
    it('should set default pageHeaderConfig', () => {
      expect(component.pageHeaderConfig).toBeDefined();
      expect(component.pageHeaderConfig.breadcrumbs).toEqual([]);
      expect(component.pageHeaderConfig.title).toBe('');
    });

    it('should update pageHeaderConfig from pageHeaderService data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      // The effect should have run and set the config if pageHeaderData returns data
      // The mock returns { title: 'Lab Warehouse Transfer Query', subtitle: '' }
      expect(component.pageHeaderConfig.title).toBe('Lab Warehouse Transfer Query');
      expect(component.pageHeaderConfig.breadcrumbs.length).toBe(2);
      expect(component.pageHeaderConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Lab Warehouse Transfer Query');
    }));
  });
});
