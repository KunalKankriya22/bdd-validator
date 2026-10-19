import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { BatchInProgressQueryComponent } from './batch-in-progress-query';
import { BatchInProgressQueryApiService } from './services/batch-in-progress-query-api.service';
import { BatchInProgressStateService } from './services/batch-in-progress-state.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ContractDto,
  BatchInProgressDto,
  UnitInProgressDto,
  UnitTestResultDto,
} from './models/batch-in-progress-query.model';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';

describe('BatchInProgressQueryComponent', () => {
  let stateServiceSpy: any;
  let apiServiceSpy: any;
  let component: BatchInProgressQueryComponent;
  let fixture: ComponentFixture<BatchInProgressQueryComponent>;
  let apiService: jasmine.SpyObj<BatchInProgressQueryApiService>;
  let stateService: jasmine.SpyObj<BatchInProgressStateService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockContracts: ContractDto[] = [
    { contractId: 'RC12345', company: 'Red Cross Blood Services' },
    { contractId: 'RC67890', company: 'Regional Blood Center' },
  ];

  const mockSearchResults: BatchInProgressDto[] = [
    {
      batchId: '060124RG01',
      chapterId: 'NCBB',
      receivedDate: '2024-06-01',
      collectionDate: '2024-06-01',
      age: 5,
      unitsCount: 15,
      resultsQcDate: null,
      contractId: 'RC12345',
      units: [],
    },
  ];

  const mockUnits: UnitInProgressDto[] = [
    {
      unitId: '12345678901234',
      checkDigit: '5',
      chapterId: 'NCBB',
      collDate: '2024-06-01',
      batchId: '060124RG01',
      skipReason: null,
      testBaseCount: 3,
      holdingTestCount: 1,
      testResults: [],
      interdictions: [],
      unitTestBase: [],
      holdingTests: [],
    },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('BatchInProgressQueryApiService', [
      'getContracts',
      'searchBatches',
    ]);
    const snackbarSpy = createMockSnackbarService();
    stateServiceSpy = jasmine.createSpyObj('BatchInProgressStateService', [
      'getPageState',
      'setPageState',
      'clearPageState',
      'isNavigatingBack',
      'isStateRecent',
      'clearNavigationFlag',
      'setNavigatingAway',
      'setSelectedContract',
      'getSelectedContract',
      'hasSelectedContract',
    ]);
    stateServiceSpy.getPageState.and.returnValue(null);
    stateServiceSpy.isNavigatingBack.and.returnValue(false);

    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Batch In-Progress Query',
        subtitle: 'BIPQ',
      }),
    });

      TestBed.configureTestingModule({
imports: [BatchInProgressQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BatchInProgressQueryApiService, useValue: apiServiceSpy },
        { provide: BatchInProgressStateService, useValue: stateServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

    });

  beforeEach(() => {
      stateServiceSpy.getPageState.and.returnValue(null);

      stateServiceSpy.isNavigatingBack.and.returnValue(false);

    apiService = TestBed.inject(BatchInProgressQueryApiService) as jasmine.SpyObj<BatchInProgressQueryApiService>;
    stateService = stateServiceSpy;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    // Setup default successful responses
    apiService.getContracts.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockContracts }),
    );
    apiService.searchBatches.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockSearchResults, totalCount: 1 }),
    );

    fixture = TestBed.createComponent(BatchInProgressQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  describe('Component Initialization', () => {

    it('should set contract ID as required', () => {
      const contractControl = component.filterForm.get('contractId');
      expect(contractControl?.hasError('required')).toBeTrue();

      contractControl?.setValue('RC12345');
      expect(contractControl?.hasError('required')).toBeFalse();
    });
  });

  describe('Contract Selection', () => {
    it('should update selected contract when contract changes', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      tick();

      expect(component.selectedContractId()).toBe('RC12345');
    }));

    it('should clear selected contract when contract is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      tick();

      component.filterForm.patchValue({ contractId: '' });
      tick();

      expect(component.selectedContractId()).toBe(null);
    }));
  });

  describe('Search Functionality', () => {
    it('should search when form is valid', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(apiService.searchBatches).toHaveBeenCalled();
      expect(component.batches().length).toBe(1);
      expect(component.hasSearched()).toBeTrue();
    }));

    it('should include form parameters in search', fakeAsync(() => {
      component.filterForm.patchValue({
        contractId: 'RC12345',
        queryMode: 'EXCEPTIONS',
        includeUnitsWithoutResults: true,
      });
      component.onRetrieve();
      tick();

      const callArgs = apiService.searchBatches.calls.mostRecent().args[0];
      expect(callArgs.contractId).toBe('RC12345');
      expect(callArgs.queryMode).toBe('E');
      expect(callArgs.includeNoTestResults).toBe('Y');
    }));

    it('should handle search error response', fakeAsync(() => {
      apiService.searchBatches.and.returnValue(
        of({ success: false, message: 'Search failed', statusCode: 500, data: null, totalCount: 0 }),
      );

      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Search failed');
      expect(component.batches().length).toBe(0);
    }));

    it('should handle HTTP error when searching', fakeAsync(() => {
      apiService.searchBatches.and.returnValue(
        throwError(() => ({ error: { message: 'Network error' } })),
      );

      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(snackbarService.showError).toHaveBeenCalled();
      expect(component.batches().length).toBe(0);
    }));
  });

  describe('Batch and Unit Selection', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();
    }));

    it('should select batch on row click', () => {
      const batch = mockSearchResults[0];
      component.onBatchRowClick(batch);

      expect(component.selectedBatch()).toBe(batch);
    });
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();
    }));

    it('should handle sort change on batchId column', fakeAsync(() => {
      apiService.searchBatches.calls.reset();
      component.onBatchSortChange({ column: 'batchId', direction: 'D' });
      tick();

      expect(apiService.searchBatches).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();
    }));

    it('should clear selected batch and unit', fakeAsync(() => {
      component.onBatchRowClick(mockSearchResults[0]);
      tick();

      component.onClearAll();

      expect(component.selectedBatch()).toBeNull();
      expect(component.selectedUnit()).toBeNull();
    }));
  });
  describe('Utility Methods', () => {
    it('should detect if any field has value', () => {
      // Clear auto-populated chapter filter from init to test from clean state
      component['selectedChapterFilters'].set([]);
      component['selectedBatchFilters'].set([]);
      expect(component.hasAnyFieldValue()).toBeFalse();

      component.filterForm.patchValue({ contractId: 'RC12345' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should detect value when chapter filters exist', () => {
      component.filterForm.patchValue({ contractId: '' });
      component['selectedChapterFilters'].set([{ unitId: 'CH01', label: 'Ch01' }]);
      component['selectedBatchFilters'].set([]);
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should detect value when batch filters exist', () => {
      component.filterForm.patchValue({ contractId: '' });
      component['selectedChapterFilters'].set([]);
      component['selectedBatchFilters'].set([{ batchId: 'B01', label: 'B01' }]);
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should expose form controls via f getter', () => {
      expect(component.f['contractId']).toBeDefined();
      expect(component.f['queryMode']).toBeDefined();
    });
  });

  describe('onRetrieve edge cases', () => {
    it('should not search when already loading', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.isLoadingSearch.set(true);
      apiService.searchBatches.calls.reset();

      component.onRetrieve();
      tick();

      expect(apiService.searchBatches).not.toHaveBeenCalled();
    }));

    it('should not search when form is invalid', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: '' });
      apiService.searchBatches.calls.reset();

      component.onRetrieve();
      tick();

      expect(apiService.searchBatches).not.toHaveBeenCalled();
    }));
  });

  describe('Filter Panel Operations', () => {
    it('should open chapter filter panel', () => {
      const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
      (component as any).cdr = mockCdr;
      component.onFilterChapters();
      expect(component.chapterFilterPanelOpen).toBeTrue();
    });

    it('should close chapter filter panel', () => {
      component.chapterFilterPanelOpen = true;
      component.closeChapterFilterPanel();
      expect(component.chapterFilterPanelOpen).toBeFalse();
    });

    it('should apply chapter filters with selections', () => {
      const chapters = [
        { chapterId: 'CH01', chapterName: 'Chapter One' },
        { chapterId: 'CH02', chapterName: 'Chapter Two' },
      ];
      component.chapterFilterPanelOpen = true;

      component.onChapterFilterApply(chapters);

      expect(component.selectedChapterFilters().length).toBe(2);
      expect(component.chapterFilterPanelOpen).toBeFalse();
    });

    it('should close panel when applying empty chapter filters', () => {
      component.chapterFilterPanelOpen = true;
      component.onChapterFilterApply([]);
      expect(component.chapterFilterPanelOpen).toBeFalse();
    });

    it('should show info when filtering batches without contract', () => {
      component.filterForm.patchValue({ contractId: '' });
      component.onFilterBatches();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Please select a contract first');
      expect(component.batchFilterPanelOpen).toBeFalse();
    });

    it('should open batch filter panel when contract is selected', () => {
      const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
      (component as any).cdr = mockCdr;
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onFilterBatches();
      expect(component.batchFilterPanelOpen).toBeTrue();
      expect(component.selectedContractForBatchFilter).toBe('RC12345');
    });

    it('should close batch filter panel and clear contract reference', () => {
      component.batchFilterPanelOpen = true;
      component.selectedContractForBatchFilter = 'RC12345';
      component.closeBatchFilterPanel();
      expect(component.batchFilterPanelOpen).toBeFalse();
      expect(component.selectedContractForBatchFilter).toBeNull();
    });

    it('should apply batch filters with selections', () => {
      const batches = [
        { batchId: 'B001', chapterId: 'CH01' },
        { batchId: 'B002', chapterId: 'CH02' },
      ];
      component.batchFilterPanelOpen = true;

      component.onBatchFilterApply(batches);

      expect(component.selectedBatchFilters().length).toBe(2);
      expect(component.batchFilterPanelOpen).toBeFalse();
    });

    it('should close panel when applying empty batch filters', () => {
      component.batchFilterPanelOpen = true;
      component.onBatchFilterApply([]);
      expect(component.batchFilterPanelOpen).toBeFalse();
    });
  });

  describe('Filter Chip Management', () => {
    beforeEach(() => {
      component.selectedChapterFilters.set([
        { unitId: 'CH01', label: 'Chapter One (CH01)' },
        { unitId: 'CH02', label: 'Chapter Two (CH02)' },
      ]);
      component.selectedBatchFilters.set([
        { batchId: 'B001', label: 'Batch: B001' },
        { batchId: 'B002', label: 'Batch: B002' },
      ]);
    });

    it('should remove a chapter filter chip by key', () => {
      component.onRemoveFilterChip('chapter-CH01');
      expect(component.selectedChapterFilters().length).toBe(1);
      expect(component.selectedChapterFilters()[0].unitId).toBe('CH02');
    });

    it('should remove a batch filter chip by key', () => {
      component.onRemoveFilterChip('batch-B001');
      expect(component.selectedBatchFilters().length).toBe(1);
      expect(component.selectedBatchFilters()[0].batchId).toBe('B002');
    });

    it('should clear all filter chips', () => {
      component.onClearAllFilters();
      expect(component.selectedChapterFilters().length).toBe(0);
      expect(component.selectedBatchFilters().length).toBe(0);
    });

    it('should remove a single chapter filter by reference', () => {
      const filter = { unitId: 'CH01', label: 'Chapter One (CH01)' };
      component.removeChapterFilter(filter);
      expect(component.selectedChapterFilters().length).toBe(1);
      expect(component.selectedChapterFilters()[0].unitId).toBe('CH02');
    });

    it('should remove a single batch filter by reference', () => {
      const filter = { batchId: 'B001', label: 'Batch: B001' };
      component.removeBatchFilter(filter);
      expect(component.selectedBatchFilters().length).toBe(1);
      expect(component.selectedBatchFilters()[0].batchId).toBe('B002');
    });

    it('should clear all chapter filters', () => {
      component.clearAllChapterFilters();
      expect(component.selectedChapterFilters().length).toBe(0);
      expect(component.selectedBatchFilters().length).toBe(2); // batch filters untouched
    });

    it('should clear all batch filters', () => {
      component.clearAllBatchFilters();
      expect(component.selectedBatchFilters().length).toBe(0);
      expect(component.selectedChapterFilters().length).toBe(2); // chapter filters untouched
    });
  });

  describe('Unit Selection and Data Methods', () => {
    it('should select unit on row click', () => {
      const unit = mockUnits[0];
      component.onUnitRowClick(unit);
      expect(component.selectedUnit()).toBe(unit);
    });

    it('should clear unit selection when selecting a new batch', () => {
      component.selectedUnit.set(mockUnits[0]);
      component.onBatchRowClick(mockSearchResults[0]);
      expect(component.selectedUnit()).toBeNull();
      expect(component.selectedBatch()).toBe(mockSearchResults[0]);
    });

    it('should get unscheduled count for batch with units', () => {
      const batch: BatchInProgressDto = {
        ...mockSearchResults[0],
        units: [
          { ...mockUnits[0], testBaseCount: 3 },
          { ...mockUnits[0], unitId: 'U2', testBaseCount: 5 },
        ],
      };
      expect(component.getUnscheduledCountForBatch(batch)).toBe(8);
    });

    it('should get holding count for batch with units', () => {
      const batch: BatchInProgressDto = {
        ...mockSearchResults[0],
        units: [
          { ...mockUnits[0], holdingTestCount: 2 },
          { ...mockUnits[0], unitId: 'U2', holdingTestCount: 4 },
        ],
      };
      expect(component.getHoldingCountForBatch(batch)).toBe(6);
    });

    it('should return empty array for unit with no test results', () => {
      const unit: UnitInProgressDto = { ...mockUnits[0], testResults: [] };
      expect(component.getTestResultsForUnit(unit)).toEqual([]);
    });

    it('should return mapped test results for unit with results', () => {
      const testResult: UnitTestResultDto = {
        unitId: 'U1',
        chapterId: 'CH01',
        testSeqNo: 1,
        testId: 'T001',
        resultStatus: 'POS',
        resultDesc: 'Positive',
        interimResult: 'I1',
      };
      const unit: UnitInProgressDto = {
        ...mockUnits[0],
        skipReason: 'SKIP1',
        testResults: [testResult],
      };
      const results = component.getTestResultsForUnit(unit);
      expect(results.length).toBe(1);
      expect(results[0].testId).toBe('T001');
      expect(results[0].skipReason).toBe('SKIP1');
      expect(results[0].resultStatus).toBe('POS');
      expect(results[0].interimResult).toBe('I1');
    });

    it('should get units table config with count when batch is selected', () => {
      component.selectedBatch.set({
        ...mockSearchResults[0],
        units: [mockUnits[0], { ...mockUnits[0], unitId: 'U2' }],
      });
      const config = component.getUnitsTableConfigWithCount();
      expect(config.columns[0].header).toContain('2');
    });

    it('should get units table config with zero count when no batch selected', () => {
      component.selectedBatch.set(null);
      const config = component.getUnitsTableConfigWithCount();
      expect(config.columns[0].header).toContain('0');
    });
  });

  describe('Action Buttons', () => {
    it('should show info when opening unscheduled tests without unit', () => {
      component.selectedUnit.set(null);
      component.onUnscheduledHoldingTests();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Please select a unit first');
      expect(component.unscheduledHoldingTestsPanelOpen).toBeFalse();
    });

    it('should open unscheduled tests panel when unit is selected', () => {
      const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
      (component as any).cdr = mockCdr;
      component.selectedUnit.set(mockUnits[0]);
      component.onUnscheduledHoldingTests();
      expect(component.unscheduledHoldingTestsPanelOpen).toBeTrue();
    });

    it('should close unscheduled tests panel', () => {
      component.unscheduledHoldingTestsPanelOpen = true;
      component.closeUnscheduledHoldingTestsPanel();
      expect(component.unscheduledHoldingTestsPanelOpen).toBeFalse();
    });

    it('should show info when opening interdictions without unit', () => {
      component.selectedUnit.set(null);
      component.onInterdictions();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Please select a unit first');
      expect(component.unitInterdictionsPanelOpen).toBeFalse();
    });

    it('should open interdictions panel when unit is selected', () => {
      const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
      (component as any).cdr = mockCdr;
      component.selectedUnit.set(mockUnits[0]);
      component.onInterdictions();
      expect(component.unitInterdictionsPanelOpen).toBeTrue();
    });

    it('should close interdictions panel', () => {
      component.unitInterdictionsPanelOpen = true;
      component.closeUnitInterdictionsPanel();
      expect(component.unitInterdictionsPanelOpen).toBeFalse();
    });
  });

  describe('transformUnitId', () => {
    it('should add = prefix and 00 suffix for W-format IDs', () => {
      expect(component['transformUnitId']('W633313070215')).toBe('=W63331307021500');
    });

    it('should handle lowercase w prefix', () => {
      expect(component['transformUnitId']('w1234567')).toBe('=w123456700');
    });

    it('should wrap 7-digit IDs with D prefix and suffix', () => {
      expect(component['transformUnitId']('1234567')).toBe('D1234567D');
    });

    it('should return as-is for other formats', () => {
      expect(component['transformUnitId']('ABC123')).toBe('ABC123');
    });

    it('should return empty string for empty input', () => {
      expect(component['transformUnitId']('')).toBe('');
    });

    it('should return as-is for 6-digit number', () => {
      expect(component['transformUnitId']('123456')).toBe('123456');
    });

    it('should return as-is for 8-digit number', () => {
      expect(component['transformUnitId']('12345678')).toBe('12345678');
    });
  });

  describe('Navigation Methods', () => {
    let router: Router;

    beforeEach(() => {
      router = TestBed.inject(Router);
      spyOn(router, 'navigate');
    });

    it('should navigate to test results query with transformed unit ID', () => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.selectedUnit.set({ ...mockUnits[0], unitId: 'W633313070215' });
      component.hasSearched.set(true);

      component.onTestResultsQuery();

      expect(stateService.setNavigatingAway).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.mostRecent().args;
      expect(navArgs[1].queryParams.unitId).toBe('=W63331307021500');
    });

    it('should navigate to test results query without unit', () => {
      component.selectedUnit.set(null);
      component.onTestResultsQuery();
      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.mostRecent().args;
      expect(navArgs[1]).toBeUndefined();
    });

    it('should show info when test results route is unavailable', () => {
      const saved = (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery];
      (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery] = undefined;

      component.onTestResultsQuery();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Unit Test Results Query screen is not yet available');

      (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery] = saved;
    });

    it('should navigate to non-extracted batch query with contract', () => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.hasSearched.set(true);

      component.onNonExtractedBatchQuery();

      expect(stateService.setNavigatingAway).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.mostRecent().args;
      expect(navArgs[1].queryParams.contractId).toBe('RC12345');
    });

    it('should navigate to non-extracted batch query without contract', () => {
      component.filterForm.patchValue({ contractId: '' });
      component.onNonExtractedBatchQuery();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should show info when non-extracted batch route is unavailable', () => {
      const saved = (ROUTE_REGISTRY as any)[RouteKey.NonExtractedBatchesQuery];
      (ROUTE_REGISTRY as any)[RouteKey.NonExtractedBatchesQuery] = undefined;

      component.onNonExtractedBatchQuery();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Non Extracted Batch Query screen is not yet available');

      (ROUTE_REGISTRY as any)[RouteKey.NonExtractedBatchesQuery] = saved;
    });

    it('should navigate to samples query with transformed unit ID', () => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.selectedUnit.set({ ...mockUnits[0], unitId: '1234567' });
      component.hasSearched.set(true);

      component.onSamplesQuery();

      expect(stateService.setNavigatingAway).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.mostRecent().args;
      expect(navArgs[1].queryParams.unitId).toBe('D1234567D');
    });

    it('should navigate to samples query without unit', () => {
      component.selectedUnit.set(null);
      component.onSamplesQuery();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should show info when samples query route is unavailable', () => {
      const saved = (ROUTE_REGISTRY as any)[RouteKey.SamplesQuery];
      (ROUTE_REGISTRY as any)[RouteKey.SamplesQuery] = undefined;

      component.onSamplesQuery();
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Samples Query screen is not yet available');

      (ROUTE_REGISTRY as any)[RouteKey.SamplesQuery] = saved;
    });

    it('should navigate to unit test results with unitId', () => {
      component.onUnitTestResults('U12345');
      expect(stateService.setNavigatingAway).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
      const navArgs = (router.navigate as jasmine.Spy).calls.mostRecent().args;
      expect(navArgs[1].queryParams.unitId).toBe('U12345');
    });

    it('should show info when unit test results route is unavailable', () => {
      const saved = (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery];
      (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery] = undefined;

      component.onUnitTestResults('U12345');
      expect(snackbarService.showInfo).toHaveBeenCalledWith('Unit Test Results Query screen is not yet available');

      (ROUTE_REGISTRY as any)[RouteKey.UnitTestResultsQuery] = saved;
    });
  });

  describe('Contract Loading Edge Cases', () => {
    it('should show error on contract load failure response', fakeAsync(() => {
      apiService.getContracts.and.returnValue(
        of({ success: false, message: 'Load failed', statusCode: 500, data: null })
      );
      component['loadContracts']();
      tick();
      tick(500); // for the setTimeout safety check
      expect(snackbarService.showError).toHaveBeenCalledWith('Load failed');
    }));

    it('should show error on contract load HTTP error with non-zero status', fakeAsync(() => {
      apiService.getContracts.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server Error' } }))
      );
      snackbarService.showError.calls.reset();
      component['loadContracts']();
      tick();
      expect(snackbarService.showError).toHaveBeenCalled();
    }));

    it('should not show error for status 0 (navigation cancel)', fakeAsync(() => {
      apiService.getContracts.and.returnValue(
        throwError(() => ({ status: 0 }))
      );
      snackbarService.showError.calls.reset();
      component['loadContracts']();
      tick();
      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(component.isLoadingContracts()).toBeFalse();
      expect(component.isLoadingSearch()).toBeFalse();
    }));

    it('should show default message when contract failure has no message', fakeAsync(() => {
      apiService.getContracts.and.returnValue(
        of({ success: false, message: '', statusCode: 500, data: null })
      );
      component['loadContracts']();
      tick();
      tick(500);
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load contracts');
    }));
  });

  describe('Search with Filters', () => {
    it('should include chapter filters in search query', fakeAsync(() => {
      component.selectedChapterFilters.set([
        { unitId: 'CH01', label: 'Chapter One' },
        { unitId: 'CH02', label: 'Chapter Two' },
      ]);
      component.filterForm.patchValue({ contractId: 'RC12345' });
      apiService.searchBatches.calls.reset();
      component.onRetrieve();
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.chapterId).toBe('CH01,CH02');
    }));

    it('should include batch filters in search query', fakeAsync(() => {
      component.selectedBatchFilters.set([
        { batchId: 'B001', label: 'Batch 001' },
        { batchId: 'B002', label: 'Batch 002' },
      ]);
      component.filterForm.patchValue({ contractId: 'RC12345' });
      apiService.searchBatches.calls.reset();
      component.onRetrieve();
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.batchId).toBe('B001,B002');
    }));

    it('should calculate units without results from search response', fakeAsync(() => {
      const testResult: UnitTestResultDto = {
        unitId: 'U2', chapterId: 'CH01', testSeqNo: 1, testId: 'T1',
        resultStatus: 'POS', resultDesc: 'Positive', interimResult: '',
      };
      const batchesWithUnits: BatchInProgressDto[] = [{
        ...mockSearchResults[0],
        units: [
          { ...mockUnits[0], testResults: [] },
          { ...mockUnits[0], unitId: 'U2', testResults: [testResult] },
        ],
      }];
      apiService.searchBatches.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: batchesWithUnits, totalCount: 1 })
      );
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(component.totalUnits()).toBe(2);
      expect(component.unitsWithoutResults()).toBe(1);
    }));

    it('should use totalCount from response when available', fakeAsync(() => {
      apiService.searchBatches.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockSearchResults, totalCount: 42 })
      );
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(component.totalBatches()).toBe(42);
    }));

    it('should map queryMode ALL to A', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345', queryMode: 'ALL' });
      apiService.searchBatches.calls.reset();
      component.onRetrieve();
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.queryMode).toBe('A');
    }));

    it('should map queryMode non-ALL to E', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345', queryMode: 'EXCEPTIONS' });
      apiService.searchBatches.calls.reset();
      component.onRetrieve();
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.queryMode).toBe('E');
    }));

    it('should map includeUnitsWithoutResults false to N', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345', includeUnitsWithoutResults: false });
      apiService.searchBatches.calls.reset();
      component.onRetrieve();
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.includeNoTestResults).toBe('N');
    }));
  });

  describe('Sort Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();
    }));

    it('should reset sort state on default direction', fakeAsync(() => {
      apiService.searchBatches.calls.reset();
      component.onBatchSortChange({ column: 'batchId', direction: 'default' });
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.sortColumn).toBeNull();
      expect(args.sortOrder).toBe('ASC');
    }));

    it('should set ASC sort order for direction A', fakeAsync(() => {
      apiService.searchBatches.calls.reset();
      component.onBatchSortChange({ column: 'batchId', direction: 'A' });
      tick();

      const args = apiService.searchBatches.calls.mostRecent().args[0];
      expect(args.sortColumn).toBe('BatchId');
      expect(args.sortOrder).toBe('ASC');
    }));

    it('should ignore sort on non-batchId columns', () => {
      apiService.searchBatches.calls.reset();
      component.onBatchSortChange({ column: 'chapterId', direction: 'A' });
      expect(apiService.searchBatches).not.toHaveBeenCalled();
    });

    it('should not re-search if hasSearched is false', () => {
      component.hasSearched.set(false);
      apiService.searchBatches.calls.reset();
      component.onBatchSortChange({ column: 'batchId', direction: 'A' });
      expect(apiService.searchBatches).not.toHaveBeenCalled();
    });
  });

  describe('Contract Filtering', () => {
    it('should filter contracts by company name', () => {
      const result = component['filterContractOptions'](mockContracts, 'Red');
      expect(result.length).toBe(1);
      expect(result[0].contractId).toBe('RC12345');
    });

    it('should return all contracts when search is empty', () => {
      const result = component['filterContractOptions'](mockContracts, '');
      expect(result.length).toBe(2);
    });

    it('should filter contracts by contract ID', () => {
      const result = component['filterContractOptions'](mockContracts, '67890');
      expect(result.length).toBe(1);
      expect(result[0].contractId).toBe('RC67890');
    });

    it('should be case-insensitive', () => {
      const result = component['filterContractOptions'](mockContracts, 'regional');
      expect(result.length).toBe(1);
      expect(result[0].company).toBe('Regional Blood Center');
    });

    it('should return empty array when no match', () => {
      const result = component['filterContractOptions'](mockContracts, 'xyz123');
      expect(result.length).toBe(0);
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should clear form and reinitialize on chapter change', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.onRetrieve();
      tick();

      expect(component.hasSearched()).toBeTrue();

      chapterChangedSubject.next();
      tick();

      expect(component.hasSearched()).toBeFalse();
      expect(component.batches().length).toBe(0);
    }));
  });

  describe('Save State Methods', () => {
    it('should save page state when contract is selected', () => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      stateService.setPageState.calls.reset();
      component.savePageState();
      expect(stateService.setPageState).toHaveBeenCalled();
      const callArgs = stateService.setPageState.calls.mostRecent().args;
      expect(callArgs[0].contractId).toBe('RC12345');
      expect(callArgs[1]).toBeFalse(); // in-memory only
    });

    it('should not save page state without contract', () => {
      component.filterForm.patchValue({ contractId: '' });
      stateService.setPageState.calls.reset();
      component.savePageState();
      expect(stateService.setPageState).not.toHaveBeenCalled();
    });

    it('should save complete page state with search results', () => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      component.batches.set(mockSearchResults);
      component.hasSearched.set(true);
      component.totalBatches.set(5);
      component.totalUnits.set(10);
      component.unitsWithoutResults.set(2);
      stateService.setPageState.calls.reset();
      component.saveCompletePageState();
      expect(stateService.setPageState).toHaveBeenCalled();
      const callArgs = stateService.setPageState.calls.mostRecent().args;
      expect(callArgs[1]).toBeTrue(); // persist to sessionStorage
      expect(callArgs[0].searchState.hasSearched).toBeTrue();
      expect(callArgs[0].searchState.totalBatches).toBe(5);
    });

    it('should not save complete page state without contract', () => {
      component.filterForm.patchValue({ contractId: '' });
      stateService.setPageState.calls.reset();
      component.saveCompletePageState();
      expect(stateService.setPageState).not.toHaveBeenCalled();
    });
  });

  describe('Restore Page State', () => {
    it('should clear loading when no saved state', () => {
      stateService.getPageState.and.returnValue(null);
      component.isLoadingContracts.set(true);
      component.isLoadingSearch.set(true);
      component.restorePageState();
      expect(component.isLoadingContracts()).toBeFalse();
      expect(component.isLoadingSearch()).toBeFalse();
    });

    it('should clear stale state and loading', () => {
      stateService.getPageState.and.returnValue({
        contractId: 'RC12345',
        contractName: 'Test',
        timestamp: Date.now() - 10 * 60 * 1000,
      });
      stateService.isStateRecent.and.returnValue(false);
      component.restorePageState();
      expect(stateService.clearPageState).toHaveBeenCalled();
      expect(component.isLoadingContracts()).toBeFalse();
    });

    it('should restore form and filter state', () => {
      stateService.getPageState.and.returnValue({
        contractId: 'RC12345',
        contractName: 'Test',
        timestamp: Date.now(),
        formState: {
          queryMode: 'EXCEPTIONS',
          includeUnitsWithoutResults: true,
        },
        filterState: {
          selectedChapterFilters: [{ unitId: 'CH01', label: 'Chapter 01' }],
          selectedBatchFilters: [{ batchId: 'B01', label: 'Batch 01' }],
        },
      });
      stateService.isStateRecent.and.returnValue(true);

      component.restorePageState();

      expect(component.filterForm.get('contractId')?.value).toBe('RC12345');
      expect(component.filterForm.get('queryMode')?.value).toBe('EXCEPTIONS');
      expect(component.filterForm.get('includeUnitsWithoutResults')?.value).toBeTrue();
      expect(component.selectedChapterFilters().length).toBe(1);
      expect(component.selectedBatchFilters().length).toBe(1);
      expect(component.isLoadingContracts()).toBeFalse();
      expect(component.isLoadingSearch()).toBeFalse();
    });

    it('should restore with minimal state when formState is missing', () => {
      stateService.getPageState.and.returnValue({
        contractId: 'RC67890',
        contractName: 'Test',
        timestamp: Date.now(),
      });
      stateService.isStateRecent.and.returnValue(true);

      component.restorePageState();

      expect(component.filterForm.get('contractId')?.value).toBe('RC67890');
      expect(component.selectedContractId()).toBe('RC67890');
    });

    it('should restore search results and batch/unit selections', () => {
      const savedBatch: BatchInProgressDto = {
        ...mockSearchResults[0],
        batchId: 'SAVED01',
        units: [{ ...mockUnits[0], unitId: 'SAVED_UNIT' }],
      };
      stateService.getPageState.and.returnValue({
        contractId: 'RC12345',
        contractName: 'Test',
        timestamp: Date.now(),
        formState: { queryMode: 'ALL', includeUnitsWithoutResults: false },
        filterState: { selectedChapterFilters: [], selectedBatchFilters: [] },
        searchState: {
          batches: [savedBatch],
          selectedBatchId: 'SAVED01',
          selectedUnitId: 'SAVED_UNIT',
          hasSearched: true,
          totalBatches: 1,
          totalUnits: 1,
          unitsWithoutResults: 0,
        },
      });
      stateService.isStateRecent.and.returnValue(true);

      component.restorePageState();

      expect(component.batches().length).toBe(1);
      expect(component.hasSearched()).toBeTrue();
      expect(component.totalBatches()).toBe(1);
      expect(component.selectedBatch()?.batchId).toBe('SAVED01');
      expect(component.selectedUnit()?.unitId).toBe('SAVED_UNIT');
    });

    it('should not restore unit if no batch is selected', () => {
      stateService.getPageState.and.returnValue({
        contractId: 'RC12345',
        contractName: 'Test',
        timestamp: Date.now(),
        formState: { queryMode: 'ALL', includeUnitsWithoutResults: false },
        filterState: { selectedChapterFilters: [], selectedBatchFilters: [] },
        searchState: {
          batches: [mockSearchResults[0]],
          selectedBatchId: null,
          selectedUnitId: 'U1',
          hasSearched: true,
          totalBatches: 1,
          totalUnits: 0,
          unitsWithoutResults: 0,
        },
      });
      stateService.isStateRecent.and.returnValue(true);

      component.restorePageState();

      expect(component.selectedBatch()).toBeNull();
      expect(component.selectedUnit()).toBeNull();
    });
  });

  describe('onClearAll resets all state', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345', queryMode: 'EXCEPTIONS', includeUnitsWithoutResults: true });
      component.selectedChapterFilters.set([{ unitId: 'CH01', label: 'Ch01' }]);
      component.selectedBatchFilters.set([{ batchId: 'B01', label: 'B01' }]);
      component.onRetrieve();
      tick();
    }));

    it('should reset form to defaults', () => {
      component.onClearAll();

      expect(component.filterForm.get('contractId')?.value).toBe('');
      expect(component.filterForm.get('queryMode')?.value).toBe('ALL');
      expect(component.filterForm.get('includeUnitsWithoutResults')?.value).toBeFalse();
    });

    it('should clear all signals and filters', () => {
      component.onClearAll();

      expect(component.selectedChapterFilters().length).toBe(0);
      expect(component.selectedBatchFilters().length).toBe(0);
      expect(component.batches().length).toBe(0);
      expect(component.selectedBatch()).toBeNull();
      expect(component.selectedUnit()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
      expect(component.totalBatches()).toBe(0);
      expect(component.totalUnits()).toBe(0);
      expect(component.unitsWithoutResults()).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    it('should compute preselected chapter IDs', () => {
      component.selectedChapterFilters.set([
        { unitId: 'CH01', label: 'Ch01' },
        { unitId: 'CH02', label: 'Ch02' },
      ]);
      expect(component.preselectedChapterIds()).toEqual(['CH01', 'CH02']);
    });

    it('should compute preselected batch IDs', () => {
      component.selectedBatchFilters.set([
        { batchId: 'B01', label: 'B01' },
        { batchId: 'B02', label: 'B02' },
      ]);
      expect(component.preselectedBatchIds()).toEqual(['B01', 'B02']);
    });

    it('should compute selected contract info', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'RC12345' });
      tick();
      const info = component.selectedContractInfo();
      expect(info?.company).toBe('Red Cross Blood Services');
    }));

    it('should return null contract info when no contract selected', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: '' });
      tick();
      expect(component.selectedContractInfo()).toBeNull();
    }));

    it('should compute filter chips from chapter and batch filters', () => {
      component.selectedChapterFilters.set([{ unitId: 'CH01', label: 'Ch01' }]);
      component.selectedBatchFilters.set([{ batchId: 'B01', label: 'B01' }]);
      const chips = component.filterChips();
      expect(chips.length).toBe(2);
    });
  });
});
