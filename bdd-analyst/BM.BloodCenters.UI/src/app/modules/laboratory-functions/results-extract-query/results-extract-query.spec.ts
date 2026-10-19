import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject, delay } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ResultsExtractQuery } from './results-extract-query';
import { ResultsExtractQueryApiService } from './services/results-extract-query-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ContractOption,
  ResultsExtractData,
  BatchRecord,
  BatchDetailResponse,
  UnitRecord,
  ValidContract
} from './models/results-extract-query.model';

describe('ResultsExtractQuery', () => {
  let component: ResultsExtractQuery;
  let fixture: ComponentFixture<ResultsExtractQuery>;
  let apiServiceSpy: jasmine.SpyObj<ResultsExtractQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal> };

  const mockContracts: ContractOption[] = [
    { contractId: 'RC12345', company: 'Regional Blood Center', centerId: 'C001' },
    { contractId: 'RC67890', company: 'Regional Testing Lab', centerId: 'C002' }
  ];

  const mockValidContracts: ValidContract[] = [
    {
      contractId: 'RC12345', company: 'Regional Blood Center', centerId: 'C001',
      chapterId: '0001', contractType: 'RG', effectiveDate: '2020-01-01',
      terminationDate: null, machineCode: null, barCodeProtocol: null
    }
  ];

  const mockUnit1: UnitRecord = {
    unitId: 'U123456789012345',
    checkDigit: '2',
    collectionDate: '2026-05-30',
    qcTestDate: '2026-06-01',
    testResults: [
      { testId: 'ABO', testSeqNo: 1, resultStatus1: 'A', interimResult: null },
      { testId: 'HBC', testSeqNo: 2, resultStatus1: 'R', interimResult: null }
    ]
  };

  const mockUnit2: UnitRecord = {
    unitId: 'U987654321098765',
    checkDigit: '5',
    collectionDate: '2026-05-29',
    qcTestDate: '2026-06-01',
    testResults: [
      { testId: 'RH', testSeqNo: 1, resultStatus1: 'POS', interimResult: null }
    ]
  };

  const mockBatch1: BatchRecord = {
    batchId: 'BATCH20260601',
    chapterId: '0001',
    unitCount: 2,
    extractDateTimeGmt: '2026-06-01T14:30:00',
    extractDateTime: '2026-06-01T14:30:00',
    resultParmId: 'PARM001',
    insertUser: 'LABTECH',
    units: []
  };

  const mockBatch1WithUnits: BatchRecord = {
    ...mockBatch1,
    units: [mockUnit1, mockUnit2]
  };

  const mockBatchDetailResponse: BatchDetailResponse = {
    batchId: 'BATCH20260601',
    units: [mockUnit1, mockUnit2]
  };

  const mockBatch2: BatchRecord = {
    batchId: 'BATCH20260602',
    chapterId: '0001',
    unitCount: 1,
    extractDateTimeGmt: '2026-06-02T10:00:00',
    extractDateTime: '2026-06-02T10:00:00',
    resultParmId: 'PARM002',
    insertUser: 'ADMIN',
    units: []
  };

  const mockResultsData: ResultsExtractData = {
    contractInfo: {
      contractId: 'RC12345',
      company: 'Regional Blood Center',
      centerId: 'C001',
      chapterId: '0001'
    },
    totalBatches: 2,
    batches: [mockBatch1, mockBatch2]
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ResultsExtractQueryApiService', [
      'searchContracts',
      'queryResults',
      'queryResultsWithCount',
      'getAllValidContracts',
      'getBatchDetail'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    mockHeaderService = { chapterChanged$: new Subject<void>() };
    mockPageHeaderService = { pageHeaderData: signal(null) };

    apiServiceSpy.getAllValidContracts.and.returnValue(of(mockValidContracts));
    apiServiceSpy.queryResultsWithCount.and.returnValue(
      of({ data: mockResultsData, totalCount: 2 })
    );
    apiServiceSpy.getBatchDetail.and.returnValue(of(mockBatchDetailResponse));



      TestBed.configureTestingModule({
      imports: [ResultsExtractQuery, NoopAnimationsModule],
      providers: [
        { provide: ResultsExtractQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: {
          chapterLocalDate: signal(moment().startOf('day')),
          getChapterLocalDate: () => moment().startOf('day')
        }}
      ]
    });


    


      apiServiceSpy.searchContracts.calls.reset();


      apiServiceSpy.queryResults.calls.reset();


      apiServiceSpy.queryResultsWithCount.calls.reset();


      apiServiceSpy.getAllValidContracts.calls.reset();


      apiServiceSpy.getBatchDetail.calls.reset();


      apiServiceSpy.getAllValidContracts.and.returnValue(of(mockValidContracts));


      apiServiceSpy.getBatchDetail.and.returnValue(of(mockBatchDetailResponse));


    fixture = TestBed.createComponent(ResultsExtractQuery);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {








    it('should initialize with empty state signals', () => {
      fixture.detectChanges();
      expect((component as any).loading()).toBe(false);
      expect((component as any).error()).toBeNull();
      expect((component as any).submitted()).toBe(false);
      expect((component as any).hasSearched()).toBe(false);
      expect((component as any).allBatches()).toEqual([]);
      expect((component as any).totalBatches()).toBe(0);
    });

    it('should load valid contracts on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getAllValidContracts).toHaveBeenCalled();
      expect((component as any).contracts().length).toBeGreaterThan(0);
    }));
  });
  describe('Contract Selection', () => {
    it('should update description when contract is selected', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('RC12345');

      expect((component as any).contractDescription()).toContain('Regional Blood Center');
    });

    it('should clear description for unknown contract', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('UNKNOWN');

      expect((component as any).contractDescription()).toBe('');
    });




  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should enforce max length on contract ID', () => {
      const contractIdControl = component.searchForm.get('contractId');
      contractIdControl?.setValue('CONTRACTTOOLONG123');
      expect(contractIdControl?.hasError('maxlength')).toBeTrue();
    });
  });

  describe('Query Results', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({
        contractId: 'RC12345',
        fromDate: new Date('2026-05-01'),
        toDate: new Date('2026-06-02')
      });
    });



    it('should query results when form is valid', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryResultsWithCount).toHaveBeenCalled();
      expect((component as any).allBatches().length).toBe(2);
      expect((component as any).allBatches()[0].batchId).toBe('BATCH20260601');
      expect((component as any).allBatches()[1].batchId).toBe('BATCH20260602');
      expect((component as any).totalBatches()).toBe(2);
      expect((component as any).hasSearched()).toBe(true);
    }));



    it('should auto-select first batch and fetch its details after query', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.getBatchDetail).toHaveBeenCalled();
      expect((component as any).selectedUnit()).toEqual(mockUnit1);
    }));



    it('should format dates for API request', fakeAsync(() => {
      component.onRetrieve();
      tick();

      const callArgs = apiServiceSpy.queryResultsWithCount.calls.mostRecent().args[0];
      expect(callArgs.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));


  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({
        contractId: 'RC12345',
        fromDate: new Date('2026-05-01'),
        toDate: new Date('2026-06-02')
      });
      (component as any).contractDescription.set('Test Company');
      (component as any).hasSearched.set(true);
      (component as any).allBatches.set(mockResultsData.batches);
    });



    it('should reset all state signals', () => {
      component.onClearAll();
      expect((component as any).contractDescription()).toBe('');
      expect((component as any).submitted()).toBe(false);
      expect((component as any).hasSearched()).toBe(false);
      expect((component as any).allBatches()).toEqual([]);
      expect((component as any).totalBatches()).toBe(0);
      expect((component as any).selectedBatch()).toBeNull();
      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should clear all search terms', () => {
      (component as any).batchSearchTerm.set('test');
      (component as any).unitSearchTerm.set('test');
      (component as any).testSearchTerm.set('test');

      component.onClearAll();

      expect((component as any).batchSearchTerm()).toBe('');
      expect((component as any).unitSearchTerm()).toBe('');
      expect((component as any).testSearchTerm()).toBe('');
    });
  });

  describe('Batch Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).allBatches.set(mockResultsData.batches);
      component.searchForm.patchValue({ contractId: 'RC12345' });
    });

    it('should select batch and trigger API call for details', fakeAsync(() => {
      component.onBatchSelected(mockBatch1);
      tick();

      expect(apiServiceSpy.getBatchDetail).toHaveBeenCalledWith(jasmine.objectContaining({
        batchId: 'BATCH20260601',
        contractId: 'RC12345'
      }));
    }));



    it('should auto-select first unit after detail loads', fakeAsync(() => {
      component.onBatchSelected(mockBatch1);
      tick();
      expect((component as any).selectedUnit()).toEqual(mockUnit1);
    }));





    it('should handle batch detail error', fakeAsync(() => {
      apiServiceSpy.getBatchDetail.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Batch not found' } }
      })));

      component.onBatchSelected(mockBatch1);
      tick();

      expect((component as any).detailLoading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Batch not found');
    }));
  });

  describe('Unit Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).allBatches.set(mockResultsData.batches);
      (component as any).selectedBatch.set(mockBatch1WithUnits);
    });

    it('should select unit on click', () => {
      component.onUnitSelected(mockUnit2);
      expect((component as any).selectedUnit()).toEqual(mockUnit2);
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).allBatches.set(mockResultsData.batches);
    });





    it('should show all batches when search term is empty', () => {
      component.onBatchSearch('');
      expect((component as any).filteredBatches().length).toBe(2);
    });





    it('should keep results area visible when batch search yields zero matches', () => {
      (component as any).hasSearched.set(true);
      component.onBatchSearch('NONEXISTENT');
      expect((component as any).batchCount()).toBe(0);
      expect((component as any).allBatches().length).toBe(2);
      expect((component as any).showNoResults()).toBe(false);
    });


  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute batch count correctly', () => {
      (component as any).allBatches.set(mockResultsData.batches);
      expect((component as any).batchCount()).toBe(2);
    });

    it('should compute unit count correctly', () => {
      (component as any).selectedBatch.set(mockBatch1WithUnits);
      expect((component as any).unitCount()).toBe(2);
    });

    it('should compute test result count correctly', () => {
      (component as any).selectedUnit.set(mockUnit1);
      expect((component as any).testResultCount()).toBe(2);
    });







    it('should not show no-results when batches exist but filter yields zero', () => {
      (component as any).hasSearched.set(true);
      (component as any).allBatches.set(mockResultsData.batches);
      (component as any).batchSearchTerm.set('NONEXISTENT');
      expect((component as any).showNoResults()).toBe(false);
    });



    it('should apply red testIdColor when result is reactive', () => {
      (component as any).selectedUnit.set(mockUnit1);
      const testResults = (component as any).testResults();
      const reactiveTest = testResults.find((t: any) => t.resultStatus1 === 'R');
      expect(reactiveTest?.testIdColor).toBe('#d32f2f');
      const nonReactiveTest = testResults.find((t: any) => t.resultStatus1 !== 'R');
      expect(nonReactiveTest?.testIdColor).toBeUndefined();
    });

    it('should apply red color to R result', () => {
      (component as any).selectedUnit.set(mockUnit1);
      const testResults = (component as any).testResults();
      const reactiveTest = testResults.find((t: any) => t.resultStatus1 === 'R');
      expect(reactiveTest?.resultColor).toBe('#d32f2f');
    });

    it('should apply red color to R interim result', () => {
      const unitWithInterim: UnitRecord = {
        unitId: 'U111', checkDigit: '1', collectionDate: '2026-05-30', qcTestDate: null,
        testResults: [{ testId: 'NAT', testSeqNo: 1, resultStatus1: null, interimResult: 'R' }]
      };
      (component as any).selectedUnit.set(unitWithInterim);
      const testResults = (component as any).testResults();
      expect(testResults[0].interimResultColor).toBe('#d32f2f');
    });
  });

  describe('Color Utility Methods', () => {
    it('should return red for R result', () => {
      expect(component.getResultColor('R')).toBe('#d32f2f');
    });

    it('should return undefined for non-reactive result', () => {
      expect(component.getResultColor('NR')).toBeUndefined();
    });

    it('should handle null/undefined in getResultColor', () => {
      expect(component.getResultColor(null as any)).toBeUndefined();
    });
  });


});
