import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { InterimResultsQuery } from './interim-results-query';
import { InterimResultsQueryApiService } from './services/interim-results-query-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  InterimContractOption,
  InterimCodeOption,
  InterimTestOption,
  InterimBatchOption,
  InterimResultRecord,
  InterimResultsQueryResponse
} from './models/interim-results-query.model';

describe('InterimResultsQuery', () => {
  let component: InterimResultsQuery;
  let fixture: ComponentFixture<InterimResultsQuery>;
  let apiServiceSpy: jasmine.SpyObj<InterimResultsQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: { chapterChanged$: Subject<void> };
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal> };

  const mockContracts: InterimContractOption[] = [
    { contractId: 'RC12345', company: 'Regional Blood Center', centerId: 'C001' },
    { contractId: 'RC67890', company: 'Regional Testing Lab', centerId: 'C002' }
  ];

  const mockInterimCodes: InterimCodeOption[] = [
    { code: 'INT01', codeDescription: 'Interim Code One' },
    { code: 'INT02', codeDescription: 'Interim Code Two' }
  ];

  const mockTests: InterimTestOption[] = [
    { testId: 'ABO', testDescription: 'ABO Blood Type' },
    { testId: 'RH', testDescription: 'Rh Factor' }
  ];

  const mockBatches: InterimBatchOption[] = [
    { batchId: 'BATCH001', unitCount: 5 },
    { batchId: 'BATCH002', unitCount: 3 }
  ];

  const mockResults: InterimResultRecord[] = [
    {
      unitId: 'U123456789012345',
      checkDigit: '2',
      testId: 'ABO',
      testSeqNo: 1,
      extractFlag: 'Y',
      firstExtractDate: '2026-06-01',
      lastExtractDate: '2026-06-02',
      resultCode: 'A',
      resultDescription: 'Type A'
    },
    {
      unitId: 'U987654321098765',
      checkDigit: '',
      testId: 'RH',
      testSeqNo: 2,
      extractFlag: 'N',
      firstExtractDate: null,
      lastExtractDate: null,
      resultCode: 'POS',
      resultDescription: 'Positive'
    }
  ];

  const mockQueryResponse: InterimResultsQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: mockResults,
    total: 2
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('InterimResultsQueryApiService', [
      'getContracts',
      'getTestsForContract',
      'getInterimCodes',
      'getBatchesForContract',
      'queryResults'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    mockHeaderService = { chapterChanged$: new Subject<void>() };
    mockPageHeaderService = { pageHeaderData: signal(null) };

    apiServiceSpy.getContracts.and.returnValue(of(mockContracts));
    apiServiceSpy.getInterimCodes.and.returnValue(of(mockInterimCodes));
    apiServiceSpy.getTestsForContract.and.returnValue(of(mockTests));
    apiServiceSpy.getBatchesForContract.and.returnValue(of(mockBatches));
    apiServiceSpy.queryResults.and.returnValue(of(mockQueryResponse));

    TestBed.configureTestingModule({
      imports: [InterimResultsQuery, NoopAnimationsModule],
      providers: [
        { provide: InterimResultsQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });

    apiServiceSpy.getContracts.calls.reset();
    apiServiceSpy.getTestsForContract.calls.reset();
    apiServiceSpy.getInterimCodes.calls.reset();
    apiServiceSpy.getBatchesForContract.calls.reset();
    apiServiceSpy.queryResults.calls.reset();

    apiServiceSpy.getContracts.and.returnValue(of(mockContracts));
    apiServiceSpy.getInterimCodes.and.returnValue(of(mockInterimCodes));
    apiServiceSpy.getTestsForContract.and.returnValue(of(mockTests));
    apiServiceSpy.getBatchesForContract.and.returnValue(of(mockBatches));

    fixture = TestBed.createComponent(InterimResultsQuery);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize the search form with empty values', () => {
      fixture.detectChanges();
      const form = component.searchForm;
      expect(form.get('contractId')?.value).toBeFalsy();
      expect(form.get('testId')?.value).toBeFalsy();
      expect(form.get('interimCode')?.value).toBeFalsy();
      expect(form.get('batchId')?.value).toBeFalsy();
    });

    it('should initialize with correct validators on contractId and batchId', () => {
      fixture.detectChanges();
      const contractId = component.searchForm.get('contractId');
      const batchId = component.searchForm.get('batchId');

      // Required validation
      contractId?.setValue('');
      contractId?.markAsTouched();
      expect(contractId?.hasError('required')).toBeTrue();

      batchId?.setValue('');
      batchId?.markAsTouched();
      expect(batchId?.hasError('required')).toBeTrue();

      // MaxLength validation
      contractId?.setValue('1234567890'); // 10 chars > 9
      expect(contractId?.hasError('maxlength')).toBeTrue();

      batchId?.setValue('123456789012345'); // 15 chars > 14
      expect(batchId?.hasError('maxlength')).toBeTrue();
    });

    it('should initialize with empty state signals', () => {
      fixture.detectChanges();
      expect((component as any).loading()).toBe(false);
      expect((component as any).error()).toBeNull();
      expect((component as any).submitted()).toBe(false);
      expect((component as any).hasSearched()).toBe(false);
      expect((component as any).allResults()).toEqual([]);
      expect((component as any).unitCount()).toBe(0);
    });

    it('should load contracts and interim codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getContracts).toHaveBeenCalled();
      expect(apiServiceSpy.getInterimCodes).toHaveBeenCalled();
      expect((component as any).contracts().length).toBe(2);
      expect((component as any).interimCodes().length).toBe(2);
    }));
  });

  // ---------------------------------------------------------------------------
  // Contract Selection
  // ---------------------------------------------------------------------------
  describe('Contract Selection', () => {
    it('should update description when contract is selected', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('RC12345');

      expect((component as any).contractDescription()).toContain('Regional Blood Center');
      expect((component as any).contractDescription()).toContain('C001');
    });

    it('should set selectedContractId when contract is selected', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('RC12345');

      expect((component as any).selectedContractId()).toBe('RC12345');
    });

    it('should reset testId and batchId when contract changes', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ testId: 'ABO', batchId: 'BATCH001' });

      component.onContractSelected('RC12345');

      expect(component.searchForm.get('testId')?.value).toBe('');
      expect(component.searchForm.get('batchId')?.value).toBe('');
    });

    it('should clear tests and batches arrays when contract changes', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      (component as any).tests.set(mockTests);
      (component as any).batches.set(mockBatches);

      apiServiceSpy.getTestsForContract.and.returnValue(new Subject());
      apiServiceSpy.getBatchesForContract.and.returnValue(new Subject());

      component.onContractSelected('RC67890');

      expect((component as any).tests()).toEqual([]);
      expect((component as any).batches()).toEqual([]);
      expect(apiServiceSpy.getTestsForContract).toHaveBeenCalledWith('RC67890');
    });

    it('should reset search controls when contract changes', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      component.testSearchCtrl.setValue('test');
      component.batchSearchCtrl.setValue('test');

      component.onContractSelected('RC12345');

      expect(component.testSearchCtrl.value).toBe('');
      expect(component.batchSearchCtrl.value).toBe('');
    });

    it('should load tests and batches when a valid contract is selected', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ contractId: 'RC12345' });

      component.onContractSelected('RC12345');
      tick();

      expect(apiServiceSpy.getTestsForContract).toHaveBeenCalledWith('RC12345');
      expect(apiServiceSpy.getBatchesForContract).toHaveBeenCalled();
    }));

    it('should not load tests or batches when contract is empty', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('');
      tick();

      expect(apiServiceSpy.getTestsForContract).not.toHaveBeenCalled();
      expect(apiServiceSpy.getBatchesForContract).not.toHaveBeenCalled();
    }));

    it('should clear description for unknown contract', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);

      component.onContractSelected('UNKNOWN');

      expect((component as any).contractDescription()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Test ID Changes
  // ---------------------------------------------------------------------------
  describe('Test ID Changes', () => {
    it('should reset batchId when test ID changes', () => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345', batchId: 'BATCH001' });

      component.onTestIdChanged();

      expect(component.searchForm.get('batchId')?.value).toBe('');
    });

    it('should reset batch search control when test ID changes', () => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345' });
      component.batchSearchCtrl.setValue('search');

      component.onTestIdChanged();

      expect(component.batchSearchCtrl.value).toBe('');
    });

    it('should reload batches when test ID changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345', testId: 'ABO' });

      component.onTestIdChanged();
      tick();

      expect(apiServiceSpy.getBatchesForContract).toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  // Interim Code Changes
  // ---------------------------------------------------------------------------
  describe('Interim Code Changes', () => {
    it('should set selectedInterimCode signal on change', () => {
      fixture.detectChanges();
      component.searchForm.patchValue({ interimCode: 'INT01' });

      component.onInterimCodeChanged();

      expect((component as any).selectedInterimCode()).toBe('INT01');
    });

    it('should reset batchId when interim code changes', () => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345', batchId: 'BATCH001', interimCode: 'INT01' });

      component.onInterimCodeChanged();

      expect(component.searchForm.get('batchId')?.value).toBe('');
    });

    it('should reset batch search control when interim code changes', () => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345', interimCode: 'INT02' });
      component.batchSearchCtrl.setValue('search');

      component.onInterimCodeChanged();

      expect(component.batchSearchCtrl.value).toBe('');
    });

    it('should reload batches when interim code changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({ contractId: 'RC12345', interimCode: 'INT01' });

      component.onInterimCodeChanged();
      tick();

      expect(apiServiceSpy.getBatchesForContract).toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  // Filtered Dropdowns
  // ---------------------------------------------------------------------------
  describe('Filtered Dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all contracts when no search term is entered', () => {
      (component as any).contracts.set(mockContracts);
      expect((component as any).filteredContracts().length).toBe(2);
    });

    it('should filter contracts by contractId', () => {
      (component as any).contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('RC12345');
      expect((component as any).filteredContracts().length).toBe(1);
      expect((component as any).filteredContracts()[0].contractId).toBe('RC12345');
    });

    it('should filter contracts by company name', () => {
      (component as any).contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('Testing Lab');
      expect((component as any).filteredContracts().length).toBe(1);
      expect((component as any).filteredContracts()[0].contractId).toBe('RC67890');
    });

    it('should filter tests by testId', () => {
      (component as any).tests.set(mockTests);
      component.testSearchCtrl.setValue('ABO');
      expect((component as any).filteredTests().length).toBe(1);
      expect((component as any).filteredTests()[0].testId).toBe('ABO');
    });

    it('should filter tests by testDescription', () => {
      (component as any).tests.set(mockTests);
      component.testSearchCtrl.setValue('Rh Factor');
      expect((component as any).filteredTests().length).toBe(1);
      expect((component as any).filteredTests()[0].testId).toBe('RH');
    });

    it('should filter interim codes by code', () => {
      (component as any).interimCodes.set(mockInterimCodes);
      component.interimSearchCtrl.setValue('INT01');
      expect((component as any).filteredInterimCodes().length).toBe(1);
      expect((component as any).filteredInterimCodes()[0].code).toBe('INT01');
    });

    it('should filter interim codes by codeDescription', () => {
      (component as any).interimCodes.set(mockInterimCodes);
      component.interimSearchCtrl.setValue('Interim Code Two');
      expect((component as any).filteredInterimCodes().length).toBe(1);
      expect((component as any).filteredInterimCodes()[0].code).toBe('INT02');
    });

    it('should filter batches by batchId', () => {
      (component as any).batches.set(mockBatches);
      component.batchSearchCtrl.setValue('BATCH001');
      expect((component as any).filteredBatches().length).toBe(1);
      expect((component as any).filteredBatches()[0].batchId).toBe('BATCH001');
    });

    it('should return all batches when search term is empty', () => {
      (component as any).batches.set(mockBatches);
      component.batchSearchCtrl.setValue('');
      expect((component as any).filteredBatches().length).toBe(2);
    });

    it('should filter case-insensitively across all dropdowns', () => {
      (component as any).contracts.set(mockContracts);
      component.contractSearchCtrl.setValue('regional blood');
      expect((component as any).filteredContracts().length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Tooltips
  // ---------------------------------------------------------------------------
  describe('Tooltips', () => {
    it('should compute contract tooltip for selected contract', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      (component as any).selectedContractId.set('RC12345');

      expect((component as any).selectedContractTooltip()).toBe('RC12345 - Regional Blood Center');
    });

    it('should return empty string for contract tooltip when no contract is selected', () => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      (component as any).selectedContractId.set('');

      expect((component as any).selectedContractTooltip()).toBe('');
    });

    it('should compute interim code tooltip for selected code', () => {
      fixture.detectChanges();
      (component as any).interimCodes.set(mockInterimCodes);
      (component as any).selectedInterimCode.set('INT01');

      expect((component as any).selectedInterimCodeTooltip()).toBe('INT01 - Interim Code One');
    });

    it('should return empty string for interim tooltip when no code is selected', () => {
      fixture.detectChanges();
      (component as any).interimCodes.set(mockInterimCodes);
      (component as any).selectedInterimCode.set('');

      expect((component as any).selectedInterimCodeTooltip()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Form Validation
  // ---------------------------------------------------------------------------
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark contractId as required when empty', () => {
      const contractIdControl = component.searchForm.get('contractId');
      contractIdControl?.setValue('');
      contractIdControl?.markAsTouched();
      expect(contractIdControl?.hasError('required')).toBeTrue();
    });

    it('should mark batchId as required when empty', () => {
      const batchIdControl = component.searchForm.get('batchId');
      batchIdControl?.setValue('');
      batchIdControl?.markAsTouched();
      expect(batchIdControl?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength of 9 on contractId', () => {
      const contractIdControl = component.searchForm.get('contractId');
      contractIdControl?.setValue('CONTRACTTOOLONG123');
      expect(contractIdControl?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength of 14 on batchId', () => {
      const batchIdControl = component.searchForm.get('batchId');
      batchIdControl?.setValue('BATCHTOOLONGVALUE1');
      expect(batchIdControl?.hasError('maxlength')).toBeTrue();
    });

    it('should mark field as touched and update validity on onFieldBlur', () => {
      const contractIdControl = component.searchForm.get('contractId');
      expect(contractIdControl?.touched).toBeFalse();

      component.onFieldBlur('contractId');

      expect(contractIdControl?.touched).toBeTrue();
    });

    it('should report form as empty when all fields are empty', () => {
      expect(component.isFormEmpty()).toBeTrue();
    });

    it('should report form as not empty when any field has a value', () => {
      component.searchForm.patchValue({ contractId: 'RC12345' });
      expect(component.isFormEmpty()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // Retrieve / Query
  // ---------------------------------------------------------------------------
  describe('Retrieve / Query', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({
        contractId: 'RC12345',
        batchId: 'BATCH001'
      });
    });

    it('should set submitted to true on retrieve', () => {
      component.onRetrieve();
      expect((component as any).submitted()).toBe(true);
    });

    it('should mark all form controls as touched on retrieve', () => {
      component.onRetrieve();
      expect(component.searchForm.get('contractId')?.touched).toBeTrue();
      expect(component.searchForm.get('batchId')?.touched).toBeTrue();
    });

    it('should not call API when form is invalid', () => {
      component.searchForm.patchValue({ contractId: '', batchId: '' });
      component.onRetrieve();
      expect(apiServiceSpy.queryResults).not.toHaveBeenCalled();
    });

    it('should send correct request parameters', fakeAsync(() => {
      component.searchForm.patchValue({
        contractId: 'RC12345',
        testId: 'ABO',
        interimCode: 'INT01',
        batchId: 'BATCH001'
      });
      component.onRetrieve();
      tick();

      const callArgs = apiServiceSpy.queryResults.calls.mostRecent().args[0];
      expect(callArgs.contractId).toBe('RC12345');
      expect(callArgs.testId).toBe('ABO');
      expect(callArgs.interimCode).toBe('INT01');
      expect(callArgs.batchId).toBe('BATCH001');
      expect(callArgs.take).toBe(100);
      expect(callArgs.skip).toBe(0);
    }));

    it('should send null for optional empty fields', fakeAsync(() => {
      component.onRetrieve();
      tick();

      const callArgs = apiServiceSpy.queryResults.calls.mostRecent().args[0];
      expect(callArgs.testId).toBeNull();
      expect(callArgs.interimCode).toBeNull();
    }));

    it('should set loading to true while querying', fakeAsync(() => {
      // Simulate delayed response
      apiServiceSpy.queryResults.and.returnValue(of(mockQueryResponse));

      component.onRetrieve();
      // After subscribe completes synchronously, loading is set back to false
      tick();
      expect((component as any).loading()).toBe(false);
    }));

    it('should set hasSearched to true after successful query', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect((component as any).hasSearched()).toBe(true);
    }));

    it('should set results after successful query', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect((component as any).allResults().length).toBe(2);
      expect((component as any).unitCount()).toBe(2);
    }));

    it('should handle error response with snackbar', fakeAsync(() => {
      const errorObj = { error: { errorResponse: { error: 'Custom API error' } } };
      apiServiceSpy.queryResults.and.returnValue(throwError(() => errorObj));

      component.onRetrieve();
      tick();

      expect((component as any).loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom API error');
    }));

    it('should handle error with fallback message when no errorResponse', fakeAsync(() => {
      const errorObj = { error: { message: 'Server error' } };
      apiServiceSpy.queryResults.and.returnValue(throwError(() => errorObj));

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should use default error message when no error details available', fakeAsync(() => {
      apiServiceSpy.queryResults.and.returnValue(throwError(() => ({})));

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve results');
    }));
  });

  // ---------------------------------------------------------------------------
  // Display Results
  // ---------------------------------------------------------------------------
  describe('Display Results', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format unit ID with check digit using hyphen separator', () => {
      (component as any).allResults.set([mockResults[0]]);
      const display = (component as any).displayResults();
      expect(display[0].unitIdDisplay).toBe('U123456789012345-2');
    });

    it('should format unit ID without check digit when empty', () => {
      (component as any).allResults.set([mockResults[1]]);
      const display = (component as any).displayResults();
      expect(display[0].unitIdDisplay).toBe('U987654321098765');
    });

    it('should display extractFlag Y as Yes', () => {
      (component as any).allResults.set([mockResults[0]]);
      const display = (component as any).displayResults();
      expect(display[0].extractedFlagDisplay).toBe('Yes');
    });

    it('should display extractFlag N as No', () => {
      (component as any).allResults.set([mockResults[1]]);
      const display = (component as any).displayResults();
      expect(display[0].extractedFlagDisplay).toBe('No');
    });

    it('should display extractFlag Yes as Yes', () => {
      const record: InterimResultRecord = { ...mockResults[0], extractFlag: 'Yes' };
      (component as any).allResults.set([record]);
      const display = (component as any).displayResults();
      expect(display[0].extractedFlagDisplay).toBe('Yes');
    });

    it('should display extractFlag No as No', () => {
      const record: InterimResultRecord = { ...mockResults[0], extractFlag: 'No' };
      (component as any).allResults.set([record]);
      const display = (component as any).displayResults();
      expect(display[0].extractedFlagDisplay).toBe('No');
    });

    it('should display dash for null extractFlag', () => {
      const record: InterimResultRecord = { ...mockResults[0], extractFlag: '' };
      (component as any).allResults.set([record]);
      const display = (component as any).displayResults();
      expect(display[0].extractedFlagDisplay).toBe('-');
    });

    it('should format valid dates in DD-MMM-YYYY uppercase format', () => {
      (component as any).allResults.set([mockResults[0]]);
      const display = (component as any).displayResults();
      expect(display[0].firstExtractDateFormatted).toBe('01-JUN-2026');
      expect(display[0].lastExtractDateFormatted).toBe('02-JUN-2026');
    });

    it('should return empty string for null dates', () => {
      (component as any).allResults.set([mockResults[1]]);
      const display = (component as any).displayResults();
      expect(display[0].firstExtractDateFormatted).toBe('');
      expect(display[0].lastExtractDateFormatted).toBe('');
    });

    it('should compute resultCount from displayResults length', () => {
      (component as any).allResults.set(mockResults);
      expect((component as any).resultCount()).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Computed State
  // ---------------------------------------------------------------------------
  describe('Computed State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show empty state when not searched and not loading', () => {
      (component as any).hasSearched.set(false);
      (component as any).loading.set(false);
      expect((component as any).showEmptyState()).toBe(true);
    });

    it('should hide empty state when loading', () => {
      (component as any).hasSearched.set(false);
      (component as any).loading.set(true);
      expect((component as any).showEmptyState()).toBe(false);
    });

    it('should show no results when searched with empty results and not loading', () => {
      (component as any).hasSearched.set(true);
      (component as any).allResults.set([]);
      (component as any).loading.set(false);
      expect((component as any).showNoResults()).toBe(true);
    });

    it('should hide no results when there are results', () => {
      (component as any).hasSearched.set(true);
      (component as any).allResults.set(mockResults);
      (component as any).loading.set(false);
      expect((component as any).showNoResults()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Clear All
  // ---------------------------------------------------------------------------
  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.patchValue({
        contractId: 'RC12345',
        testId: 'ABO',
        interimCode: 'INT01',
        batchId: 'BATCH001'
      });
      (component as any).contractDescription.set('Test Company');
      (component as any).selectedContractId.set('RC12345');
      (component as any).selectedInterimCode.set('INT01');
      (component as any).hasSearched.set(true);
      (component as any).submitted.set(true);
      (component as any).allResults.set(mockResults);
      (component as any).unitCount.set(2);
    });

    it('should reset the form to empty values', () => {
      component.onClearAll();
      expect(component.searchForm.get('contractId')?.value).toBeFalsy();
      expect(component.searchForm.get('testId')?.value).toBeFalsy();
      expect(component.searchForm.get('interimCode')?.value).toBeFalsy();
      expect(component.searchForm.get('batchId')?.value).toBeFalsy();
    });

    it('should reset the contract description', () => {
      component.onClearAll();
      expect((component as any).contractDescription()).toBe('');
    });

    it('should reset all search controls', () => {
      component.contractSearchCtrl.setValue('test');
      component.testSearchCtrl.setValue('test');
      component.interimSearchCtrl.setValue('test');
      component.batchSearchCtrl.setValue('test');

      component.onClearAll();

      expect(component.contractSearchCtrl.value).toBe('');
      expect(component.testSearchCtrl.value).toBe('');
      expect(component.interimSearchCtrl.value).toBe('');
      expect(component.batchSearchCtrl.value).toBe('');
    });

    it('should reset all state signals', () => {
      component.onClearAll();
      expect((component as any).contractDescription()).toBe('');
      expect((component as any).selectedContractId()).toBe('');
      expect((component as any).selectedInterimCode()).toBe('');
      expect((component as any).submitted()).toBe(false);
      expect((component as any).hasSearched()).toBe(false);
      expect((component as any).error()).toBeNull();
      expect((component as any).allResults()).toEqual([]);
      expect((component as any).unitCount()).toBe(0);
    });

    it('should clear tests and batches arrays', () => {
      (component as any).tests.set(mockTests);
      (component as any).batches.set(mockBatches);

      component.onClearAll();

      expect((component as any).tests()).toEqual([]);
      expect((component as any).batches()).toEqual([]);
    });

    it('should mark form as pristine and untouched', () => {
      component.searchForm.markAsDirty();
      component.searchForm.markAsTouched();

      component.onClearAll();

      expect(component.searchForm.pristine).toBeTrue();
      expect(component.searchForm.untouched).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // Chapter Changes
  // ---------------------------------------------------------------------------
  describe('Chapter Changes', () => {
    it('should subscribe to chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiServiceSpy.getContracts.calls.reset();
      apiServiceSpy.getInterimCodes.calls.reset();

      mockHeaderService.chapterChanged$.next();
      tick();

      expect(apiServiceSpy.getContracts).toHaveBeenCalled();
      expect(apiServiceSpy.getInterimCodes).toHaveBeenCalled();
    }));

    it('should call clearAll on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.searchForm.patchValue({ contractId: 'RC12345', batchId: 'BATCH001' });
      (component as any).hasSearched.set(true);

      mockHeaderService.chapterChanged$.next();
      tick();

      expect((component as any).hasSearched()).toBe(false);
      expect(component.searchForm.get('contractId')?.value).toBeFalsy();
    }));

    it('should reload contracts and interim codes after clearAll on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiServiceSpy.getContracts.calls.reset();
      apiServiceSpy.getInterimCodes.calls.reset();

      mockHeaderService.chapterChanged$.next();
      tick();

      expect(apiServiceSpy.getContracts).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getInterimCodes).toHaveBeenCalledTimes(1);
    }));
  });

  // ---------------------------------------------------------------------------
  // Loading States
  // ---------------------------------------------------------------------------
  describe('Loading States', () => {
    it('should set contractsLoading during contract load', fakeAsync(() => {
      fixture.detectChanges();
      // After init contracts load completes synchronously via of()
      expect((component as any).contractsLoading()).toBe(false);
    }));

    it('should set testsLoading during tests load', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ contractId: 'RC12345' });
      component.onContractSelected('RC12345');
      tick();
      expect((component as any).testsLoading()).toBe(false);
    }));

    it('should set interimCodesLoading during interim codes load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect((component as any).interimCodesLoading()).toBe(false);
    }));

    it('should set batchesLoading during batches load', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ contractId: 'RC12345' });
      component.onContractSelected('RC12345');
      tick();
      expect((component as any).batchesLoading()).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------
  describe('Error Handling', () => {
    it('should show error snackbar when contracts fail to load', fakeAsync(() => {
      apiServiceSpy.getContracts.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load contracts');
      expect((component as any).contractsLoading()).toBe(false);
    }));

    it('should show error snackbar when interim codes fail to load', fakeAsync(() => {
      apiServiceSpy.getInterimCodes.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load interim codes');
      expect((component as any).interimCodesLoading()).toBe(false);
    }));

    it('should show error snackbar when tests fail to load', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getTestsForContract.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ contractId: 'RC12345' });
      component.onContractSelected('RC12345');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load tests');
      expect((component as any).testsLoading()).toBe(false);
    }));

    it('should show error snackbar when batches fail to load', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getBatchesForContract.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).contracts.set(mockContracts);
      component.searchForm.patchValue({ contractId: 'RC12345' });
      component.onContractSelected('RC12345');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load batches');
      expect((component as any).batchesLoading()).toBe(false);
    }));
  });

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  describe('Cleanup', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroy$ = (component as any).destroy$ as Subject<void>;
      let completed = false;
      destroy$.subscribe({ complete: () => (completed = true) });

      component.ngOnDestroy();

      expect(completed).toBeTrue();
    });

    it('should not call API after destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiServiceSpy.getContracts.calls.reset();
      apiServiceSpy.getInterimCodes.calls.reset();

      component.ngOnDestroy();
      // Simulate chapter change after destroy
      mockHeaderService.chapterChanged$.next();
      tick();

      expect(apiServiceSpy.getContracts).not.toHaveBeenCalled();
      expect(apiServiceSpy.getInterimCodes).not.toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  // Table Config
  // ---------------------------------------------------------------------------
  describe('Table Config', () => {
    it('should initialize table config with correct columns', () => {
      fixture.detectChanges();
      expect(component.tableConfig).toBeTruthy();
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toEqual([
        'unitIdDisplay',
        'testId',
        'testSeqNo',
        'extractedFlagDisplay',
        'firstExtractDateFormatted',
        'lastExtractDateFormatted',
        'resultCode',
        'resultDescription'
      ]);
    });

    it('should update Unit ID column header with count when results exist', () => {
      fixture.detectChanges();
      (component as any).allResults.set(mockResults);
      // Trigger effect by running change detection
      fixture.detectChanges();

      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitIdDisplay');
      expect(unitCol?.header).toBe('Unit ID (2)');
    });

    it('should show plain Unit ID header when no results', () => {
      fixture.detectChanges();
      (component as any).allResults.set([]);
      fixture.detectChanges();

      const unitCol = component.tableConfig.columns.find(c => c.key === 'unitIdDisplay');
      expect(unitCol?.header).toBe('Unit ID');
    });
  });

  // ---------------------------------------------------------------------------
  // isFormEmpty
  // ---------------------------------------------------------------------------
  describe('isFormEmpty', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when all form fields are empty', () => {
      expect(component.isFormEmpty()).toBeTrue();
    });

    it('should return false when contractId has value', () => {
      component.searchForm.patchValue({ contractId: 'RC12345' });
      expect(component.isFormEmpty()).toBeFalse();
    });

    it('should return false when testId has value', () => {
      component.searchForm.patchValue({ testId: 'ABO' });
      expect(component.isFormEmpty()).toBeFalse();
    });

    it('should return false when interimCode has value', () => {
      component.searchForm.patchValue({ interimCode: 'INT01' });
      expect(component.isFormEmpty()).toBeFalse();
    });

    it('should return false when batchId has value', () => {
      component.searchForm.patchValue({ batchId: 'BATCH001' });
      expect(component.isFormEmpty()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // f getter
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return form controls', () => {
      fixture.detectChanges();
      expect(component.f['contractId']).toBe(component.searchForm.controls['contractId']);
      expect(component.f['batchId']).toBe(component.searchForm.controls['batchId']);
    });
  });
});
