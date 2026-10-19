import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import moment from 'moment';

import { NonExtractedBatchesQueryComponent } from './non-extracted-batches-query';
import { NonExtractedBatchesApiService } from './services/non-extracted-batches-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockPageHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  BatchDto,
  UnitDto,
  TestResultDto,
  ContractLookupDto,
  QueryBatchesResponse
} from './models/non-extracted-batches.model';

describe('NonExtractedBatchesQueryComponent', () => {
  let chapterTimezoneSpy: any;
  let pageHeaderSpy: any;
  let apiSpy: any;
  let component: NonExtractedBatchesQueryComponent;
  let componentAny: any;
  let fixture: ComponentFixture<NonExtractedBatchesQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<NonExtractedBatchesApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockContracts: ContractLookupDto[] = [
    { contractId: 'RG000123', company: 'Regional Testing Lab A', centerId: 'CENTER01' },
    { contractId: 'RG000456', company: 'Regional Testing Lab B', centerId: 'CENTER02' }
  ];

  const mockBatchesResponse: QueryBatchesResponse = {
    batches: [
      { batchId: '01021301', numberOfUnits: 42, contractId: 'RG000123', chapterId: 'CHT001', qcDate: null },
      { batchId: '01021302', numberOfUnits: 35, contractId: 'RG000123', chapterId: 'CHT001', qcDate: null }
    ],
    totalBatches: 2,
    totalUnits: 77
  };

  const mockUnits: UnitDto[] = [
    {
      unitId: '0102130100001',
      checkDigit: 'F',
      collDate: '2024-05-15T00:00:00Z',
      batchId: '01021301',
      contractId: 'RG000123',
      chapterId: 'CHT001',
      qcCheckinDate: null
    },
    {
      unitId: '0102130100002',
      checkDigit: 'D',
      collDate: '2024-05-15T00:00:00Z',
      batchId: '01021301',
      contractId: 'RG000123',
      chapterId: 'CHT001',
      qcCheckinDate: null
    }
  ];

  const mockTestResults: TestResultDto[] = [
    {
      unitId: '0102130100001',
      collDate: '2024-05-15T00:00:00Z',
      testId: 'ALT',
      testSeqNo: 1,
      resultStatus1: 'N',
      extractDate: null,
      chapterId: 'CHT001'
    },
    {
      unitId: '0102130100001',
      collDate: '2024-05-15T00:00:00Z',
      testId: 'HBC',
      testSeqNo: 2,
      resultStatus1: 'R',
      extractDate: null,
      chapterId: 'CHT001'
    }
  ];

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('NonExtractedBatchesApiService', [
      'queryBatches',
      'getUnitsForBatch',
      'getTestResultsForUnit',
      'getActiveContracts'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const headerSpy = createMockHeaderService();
    pageHeaderSpy = createMockPageHeaderService();
    (pageHeaderSpy as any).pageHeaderData = signal(null);
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate'], {
      chapterLocalDate: signal(moment())
    });
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());
    pageHeaderSpy.getCurrentMenuItem.and.returnValue({ label: 'Non-Extracted Batches Query' });
    apiSpy.getActiveContracts.and.returnValue(of(mockContracts));



      TestBed.configureTestingModule({
      imports: [NonExtractedBatchesQueryComponent, NoopAnimationsModule],
      providers: [
        { provide: NonExtractedBatchesApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        provideRouter([])
      ]
    });


    


      apiSpy.queryBatches.calls.reset();


      apiSpy.getUnitsForBatch.calls.reset();


      apiSpy.getTestResultsForUnit.calls.reset();


      apiSpy.getActiveContracts.calls.reset();


      pageHeaderSpy.getCurrentMenuItem.calls.reset();


      pageHeaderSpy.getSubtitle.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());


      pageHeaderSpy.getCurrentMenuItem.and.returnValue({ label: 'Non-Extracted Batches Query' });


      apiSpy.getActiveContracts.and.returnValue(of(mockContracts));


    fixture = TestBed.createComponent(NonExtractedBatchesQueryComponent);
    component = fixture.componentInstance;
    componentAny = component as any;
    apiServiceSpy = TestBed.inject(NonExtractedBatchesApiService) as jasmine.SpyObj<NonExtractedBatchesApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    chapterTimezoneServiceSpy = TestBed.inject(ChapterTimezoneService) as jasmine.SpyObj<ChapterTimezoneService>;


    });

  describe('Initialization', () => {


    it('should initialize form with default date values', () => {
      fixture.detectChanges();
      expect(component.queryForm.get('contractId')?.value).toBeFalsy();
      // Default dates are set by _dateDefaultsEffect when chapterLocalDate is available
      expect(component.queryForm.get('fromDate')?.value).toBeTruthy();
      expect(component.queryForm.get('toDate')?.value).toBeTruthy();
    });




  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate fromDate is not in future', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.queryForm.patchValue({ fromDate: futureDate });
      tick();

      expect(component.queryForm.get('fromDate')?.hasError('futureDate')).toBeTrue();
    }));

    it('should validate toDate is not in future', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.queryForm.patchValue({ toDate: futureDate });
      tick();

      expect(component.queryForm.get('toDate')?.hasError('futureDate')).toBeTrue();
    }));

    it('should validate fromDate is not after toDate', fakeAsync(() => {
      const fromDate = moment('2024-05-31');
      const toDate = moment('2024-05-01');

      component.queryForm.patchValue({ fromDate, toDate });
      tick();

      expect(component.queryForm.get('fromDate')?.hasError('fromAfterTo')).toBeTrue();
    }));

    it('should be valid with correct dates', fakeAsync(() => {
      const fromDate = moment('2024-05-01');
      const toDate = moment('2024-05-31');

      component.queryForm.patchValue({ fromDate, toDate });
      tick();

      expect(component.queryForm.valid).toBeTrue();
    }));
  });

  describe('Query Batches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-fill dates and submit when form has no dates', fakeAsync(() => {
      apiServiceSpy.queryBatches.and.returnValue(of(mockBatchesResponse));

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryBatches).toHaveBeenCalled();
      expect(component.queryForm.get('fromDate')?.value).toBeTruthy();
      expect(component.queryForm.get('toDate')?.value).toBeTruthy();
    }));

    it('should query batches when form is valid', fakeAsync(() => {
      apiServiceSpy.queryBatches.and.returnValue(of(mockBatchesResponse));

      component.queryForm.patchValue({
        fromDate: moment('2024-05-01'),
        toDate: moment('2024-05-31')
      });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryBatches).toHaveBeenCalled();
      expect(componentAny.batches().length).toBe(2);
    }));

    it('should include contractId in query if selected', fakeAsync(() => {
      apiServiceSpy.queryBatches.and.returnValue(of(mockBatchesResponse));

      component.queryForm.patchValue({
        contractId: 'RG000123',
        fromDate: moment('2024-05-01'),
        toDate: moment('2024-05-31')
      });

      component.onRetrieve();
      tick();

      expect(apiServiceSpy.queryBatches).toHaveBeenCalledWith(
        jasmine.objectContaining({ contractId: 'RG000123' })
      );
    }));






  });

  describe('Master-Detail-Detail Interaction', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load units when batch is selected', fakeAsync(() => {
      apiServiceSpy.getUnitsForBatch.and.returnValue(of(mockUnits));

      const batch = mockBatchesResponse.batches[0];
      component.onBatchSelect(batch);
      tick();

      expect(apiServiceSpy.getUnitsForBatch).toHaveBeenCalledWith(batch.batchId, undefined);
      expect(componentAny.units().length).toBe(2);
      expect(componentAny.selectedBatchId()).toBe(batch.batchId);
    }));

    it('should clear units when batch is selected', () => {
      componentAny.units.set(mockUnits);
      componentAny.selectedUnitId.set('someUnit');

      apiServiceSpy.getUnitsForBatch.and.returnValue(of([]));

      const batch = mockBatchesResponse.batches[0];
      component.onBatchSelect(batch);

      expect(componentAny.selectedUnitId()).toBeNull();
      expect(componentAny.testResults().length).toBe(0);
    });

    it('should load test results when unit is selected', fakeAsync(() => {
      apiServiceSpy.getTestResultsForUnit.and.returnValue(of(mockTestResults));
      componentAny.selectedBatchId.set('01021301');

      const unit = mockUnits[0];
      component.onUnitSelect(unit);
      tick();

      expect(apiServiceSpy.getTestResultsForUnit).toHaveBeenCalledWith(
        '01021301',
        unit.unitId,
        unit.collDate,
        undefined
      );
      expect(componentAny.testResults().length).toBe(2);
      expect(componentAny.selectedUnitId()).toBe(unit.unitId);
    }));




  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should clear all results', () => {
      componentAny.batches.set(mockBatchesResponse.batches);
      componentAny.units.set(mockUnits);
      componentAny.testResults.set(mockTestResults);
      componentAny.selectedBatchId.set('01021301');
      componentAny.selectedUnitId.set('0102130100001');

      component.clearAll();

      expect(componentAny.batches().length).toBe(0);
      expect(componentAny.units().length).toBe(0);
      expect(componentAny.testResults().length).toBe(0);
      expect(componentAny.selectedBatchId()).toBeNull();
      expect(componentAny.selectedUnitId()).toBeNull();
    });
  });

  describe('Date Formatting', () => {
    it('should format date as DD-MMM-YYYY in UTC', () => {
      const formatted = component.formatDate('2024-05-15T00:00:00Z');
      expect(formatted).toBe('15-MAY-2024');
    });

    it('should format datetime as DD-MMM-YYYY, HH:mm', () => {
      const formatted = component.formatDateTime('2024-05-15T14:30:00');
      expect(formatted).toBe('15-MAY-2024, 14:30');
    });



    it('should format datetime in UTC with formatDateTimeUtc', () => {
      const formatted = component.formatDateTimeUtc('2024-05-15T14:30:00Z');
      expect(formatted).toBe('15-MAY-2024, 14:30');
    });

    it('should format datetime in UTC ignoring local timezone offset', () => {
      const formatted = component.formatDateTimeUtc('2024-01-01T23:30:00Z');
      expect(formatted).toBe('01-JAN-2024, 23:30');
    });


  });

  describe('Result Highlighting', () => {
    it('should highlight R (Repeat) status', () => {
      expect(component.isHighlightedResult('R')).toBeTrue();
    });

    it('should not highlight other results', () => {
      expect(component.isHighlightedResult('N')).toBeFalse();
    });

    it('should not highlight null status', () => {
      expect(component.isHighlightedResult(null)).toBeFalse();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should pass contractId when navigating to batches in progress', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.queryForm.patchValue({ contractId: 'RC001' });
      component.navigateToBatchesInProgress();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/sample-management/regional-sample-tracking/regional-sample-tracking-queries/batch-in-progress-query'],
        { queryParams: { contractId: 'RC001' }, state: { fromNonExtractedBatchQuery: true } },
      );
    });


  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      componentAny.batches.set(mockBatchesResponse.batches);
      componentAny.units.set(mockUnits);
      componentAny.testResults.set(mockTestResults);
    });

    it('should sort batches by batchId ascending', () => {
      component.onSortBatches({ active: 'batchId', direction: 'asc' });
      const sorted = componentAny.batches();
      expect(sorted[0].batchId <= sorted[1].batchId).toBeTrue();
    });

    it('should sort batches by numberOfUnits descending', () => {
      component.onSortBatches({ active: 'numberOfUnits', direction: 'desc' });
      const sorted = componentAny.batches();
      expect((sorted[0].numberOfUnits || 0) >= (sorted[1].numberOfUnits || 0)).toBeTrue();
    });

    it('should sort units by unitId', () => {
      component.onSortUnits({ active: 'unitId', direction: 'asc' });
      const sorted = componentAny.units();
      expect(sorted[0].unitId <= sorted[1].unitId).toBeTrue();
    });

    it('should sort test results by testSeqNo', () => {
      component.onSortResults({ active: 'testSeqNo', direction: 'asc' });
      const sorted = componentAny.testResults();
      expect(sorted[0].testSeqNo <= sorted[1].testSeqNo).toBeTrue();
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute hasResults', () => {
      expect(componentAny.hasResults()).toBeFalse();

      componentAny.batches.set(mockBatchesResponse.batches);
      expect(componentAny.hasResults()).toBeTrue();
    });

    it('should compute contractDescription', () => {
      componentAny.contracts.set(mockContracts);
      component.queryForm.patchValue({ contractId: 'RG000123' });

      expect(componentAny.contractDescription()).toBe('Regional Testing Lab A');
    });

    it('should compute unitsHeader with batch ID', () => {
      componentAny.selectedBatchId.set('01021301');
      expect(componentAny.unitsHeader()).toBe('Unextracted Units | 01021301');
    });

    it('should compute resultsHeader with unit ID', () => {
      componentAny.selectedUnitId.set('0102130100001');
      expect(componentAny.resultsHeader()).toBe('Unextracted Results | 0102130100001');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should have form controls for date fields', () => {
      const fromDateInput = fixture.debugElement.query(By.css('[formControlName="fromDate"]'));
      expect(fromDateInput).toBeTruthy();
      const toDateInput = fixture.debugElement.query(By.css('[formControlName="toDate"]'));
      expect(toDateInput).toBeTruthy();
    });

    it('should show error messages for invalid dates', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.queryForm.patchValue({ fromDate: futureDate });
      tick();
      component.queryForm.get('fromDate')?.markAsTouched();
      fixture.detectChanges();

      const errors = fixture.debugElement.queryAll(By.css('mat-error'));
      expect(errors.length).toBeGreaterThan(0);
    }));






  });
  describe('Contract ID Date Filtering', () => {
    it('should display contracts returned by API (effectiveDate <= chapterDate, terminationDate > chapterDate)', fakeAsync(() => {
      // OBK/DAL: API returns only contracts where effDate <= chapterDate AND termDate > chapterDate
      const activeContracts: ContractLookupDto[] = [
        { contractId: 'CTR_OBK', company: 'OBK Company', centerId: 'CENTER01' },
        { contractId: 'CTR_DAL', company: 'DAL Company', centerId: 'CENTER02' }
      ];
      apiServiceSpy.getActiveContracts.and.returnValue(of(activeContracts));

      fixture.detectChanges();
      tick();

      expect(componentAny.contracts().length).toBe(2);
      expect(componentAny.contracts()[0].contractId).toBe('CTR_DAL');
      expect(componentAny.contracts()[1].contractId).toBe('CTR_OBK');
    }));




  });
});
