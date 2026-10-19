import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import moment from 'moment';

import { SkipResultsFromExtractionComponent } from './skip-results-from-extraction';
import { SkipResultsFromExtractionApiService } from './services/skip-results-from-extraction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ContractDto,
  OptionCodeDto,
  ReasonCodeDto,
  SkippedUnitDto,
  UnitValidationResultDto,
  TestBatchOption,
  BatchUnitDto,
} from './models/skip-results-from-extraction.model';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SkipResultsFromExtractionComponent', () => {
  let component: SkipResultsFromExtractionComponent;
  let fixture: ComponentFixture<SkipResultsFromExtractionComponent>;
  let apiServiceSpy: jasmine.SpyObj<SkipResultsFromExtractionApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockContracts: ContractDto[] = [
    { contractId: 'RG001', company: 'Regional Blood Center', centerId: 'CENTER1' },
    { contractId: 'RG002', company: 'Another Blood Center', centerId: 'CENTER2' },
  ];

  const mockOptionCodes: OptionCodeDto[] = [
    { value: 'S', label: 'Skip Sample From Result Extraction' },
    { value: 'R', label: 'Reset Sample From Result Extraction' },
  ];

  const mockReasonCodes: ReasonCodeDto[] = [
    { code: 'QAH', codeDesc: 'QA Hold' },
    { code: 'EXP', codeDesc: 'Expired Sample' },
  ];

  const mockTestBatches: TestBatchOption[] = [
    { batchId: 'BATCH123', displayText: 'BATCH123' },
  ];

  const mockBatchUnits: BatchUnitDto[] = [
    { unitId: 'W1234-18-031310-Z', collDate: '2019-10-10T10:40:00Z', osUnitId: 'W1234-18-031310-Z' },
  ];

  const mockSkippedUnits: SkippedUnitDto[] = [
    {
      unitId: 'W1234-18-031310-Z',
      osUnitId: 'W1234-18-031310-Z',
      collDate: '2019-10-10T10:40:00Z',
      skipFlag: 'S',
      reasonCode: 'QAH',
      reasonDescription: 'QA Hold',
      insertUserId: 'USER1',
      insertDate: '2019-10-10T10:40:00Z',
      resetDate: null,
    },
  ];

  const mockValidationSuccess: UnitValidationResultDto = {
    isValid: true,
    unitId: 'W1234-18-031310-Z',
    osUnitId: 'W1234-18-031310-Z',
    collDate: '2019-10-10T10:40:00Z',
    errorMessage: null,
  };

  const mockValidationFailure: UnitValidationResultDto = {
    isValid: false,
    unitId: null,
    osUnitId: null,
    collDate: null,
    errorMessage: 'Unit not found or not eligible for skip',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('SkipResultsFromExtractionApiService', [
      'getContracts',
      'getOptionCodes',
      'getReasonCodes',
      'getBatches',
      'getBatchUnits',
      'getSkippedUnits',
      'validateUnit',
      'skipUnits',
      'resetUnits',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal(null),
    });
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'convertGmtToLocal',
      'fetchChapterTimezone',
    ]);
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone());

    apiServiceSpy.getContracts.and.returnValue(of(mockContracts));
    apiServiceSpy.getOptionCodes.and.returnValue(of(mockOptionCodes));
    apiServiceSpy.getReasonCodes.and.returnValue(of(mockReasonCodes));
    apiServiceSpy.getBatches.and.returnValue(of(mockTestBatches));
    apiServiceSpy.getBatchUnits.and.returnValue(of(mockBatchUnits));
    apiServiceSpy.getSkippedUnits.and.returnValue(of({ data: mockSkippedUnits, total: mockSkippedUnits.length }));
    apiServiceSpy.validateUnit.and.returnValue(of(mockValidationSuccess));
    apiServiceSpy.skipUnits.and.returnValue(
      of({
        success: true,
        message: 'Skipped 1 unit(s). Failed: 0',
        statusCode: 200,
        data: [{ successCount: 1, failureCount: 0 }],
      }),
    );
    apiServiceSpy.resetUnits.and.returnValue(
      of({
        success: true,
        message: 'Reset 1 unit(s). Failed: 0',
        statusCode: 200,
        data: [{ successCount: 1, failureCount: 0 }],
      }),
    );

      TestBed.configureTestingModule({
      imports: [SkipResultsFromExtractionComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SkipResultsFromExtractionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    });

    

      apiServiceSpy.getContracts.calls.reset();

      apiServiceSpy.getOptionCodes.calls.reset();

      apiServiceSpy.getReasonCodes.calls.reset();

      apiServiceSpy.getBatches.calls.reset();

      apiServiceSpy.getBatchUnits.calls.reset();

      apiServiceSpy.getSkippedUnits.calls.reset();

      apiServiceSpy.validateUnit.calls.reset();

      apiServiceSpy.skipUnits.calls.reset();

      apiServiceSpy.resetUnits.calls.reset();

      headerServiceSpy.getCurrentChapterId.calls.reset();

      chapterTimezoneServiceSpy.convertGmtToLocal.calls.reset();

      chapterTimezoneServiceSpy.fetchChapterTimezone.calls.reset();

      chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: moment.Moment) => m.clone());

      apiServiceSpy.getContracts.and.returnValue(of(mockContracts));

      apiServiceSpy.getOptionCodes.and.returnValue(of(mockOptionCodes));

      apiServiceSpy.getReasonCodes.and.returnValue(of(mockReasonCodes));

      apiServiceSpy.getBatches.and.returnValue(of(mockTestBatches));

      apiServiceSpy.getBatchUnits.and.returnValue(of(mockBatchUnits));

      apiServiceSpy.getSkippedUnits.and.returnValue(of({ data: mockSkippedUnits, total: mockSkippedUnits.length }));

      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationSuccess));

    fixture = TestBed.createComponent(SkipResultsFromExtractionComponent);
    component = fixture.componentInstance;

    });

  describe('Initialization', () => {

    it('should initialize forms with correct default values', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('contractId')?.value).toBeFalsy();
      expect(component.searchForm.get('optionCode')?.value).toBe('S');
      expect(component.byBatchForm.get('testBatchId')?.value).toBeFalsy();
      expect(component.byBatchForm.get('reason')?.value).toBeFalsy();
    });

    it('should load reason codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getReasonCodes).toHaveBeenCalledWith('S');
      expect(component.reasonCodes()).toEqual(mockReasonCodes);
    }));
  });

  describe('Search Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark contractId as required', () => {
      const control = component.searchForm.get('contractId');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should populate contract description when contract is selected', fakeAsync(() => {
      component.searchForm.get('contractId')?.setValue('RG001');
      tick();

      expect(component.contractDescription()).toBe('Regional Blood Center');
    }));

    it('should load test batches when contract is selected in skip mode', fakeAsync(() => {
      component.searchForm.get('contractId')?.setValue('RG001');
      tick();

      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('RG001');
    }));

    it('should show option description as "Skip Sample From Result Extraction"', () => {
      expect(component.optionDescription()).toBe('Skip Sample From Result Extraction');
    });
  });

  describe('By Batch Tab', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.get('contractId')?.setValue('RG001');
      fixture.detectChanges();
    });

    it('should load units when test batch is selected', fakeAsync(() => {
      component.byBatchForm.get('testBatchId')?.setValue('BATCH123');
      tick();

      expect(apiServiceSpy.getBatchUnits).toHaveBeenCalledWith({
        contractId: 'RG001',
        batchId: 'BATCH123',
      });
      expect(component.tableData().length).toBeGreaterThan(0);
    }));

    it('should populate reason description when reason is selected', fakeAsync(() => {
      component.byBatchForm.get('reason')?.setValue('QAH');
      tick();

      expect(component.byBatchReasonDescription()).toBe('QA Hold');
    }));
  });

  describe('By Units Tab', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.get('contractId')?.setValue('RG001');
      component.selectedTabIndex.set(1);
      fixture.detectChanges();
    });

    it('should validate unit via onPostValidate', fakeAsync(() => {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: UnitIdPostValidateEvent = {
        data: { parsedUnitId: 'W1234-18-031310-Z' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onPostValidate(event);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith({
        contractId: 'RG001',
        unitId: 'W1234-18-031310-Z',
      });
      expect(confirmSpy).toHaveBeenCalled();
    }));

    it('should populate received date when unit is validated successfully', fakeAsync(() => {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: UnitIdPostValidateEvent = {
        data: { parsedUnitId: 'W1234-18-031310-Z' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onPostValidate(event);
      tick();

      expect(component.byUnitsForm.get('receivedDate')?.value).toBeTruthy();
    }));

    it('should show error when unit validation fails', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidationFailure));
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: UnitIdPostValidateEvent = {
        data: { parsedUnitId: 'INVALID' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onPostValidate(event);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found or not eligible for skip');
    }));

    it('should prevent duplicate units', fakeAsync(() => {
      component.tableData.set([
        {
          unitId: 'W1234-18-031310-Z',
          outsideUnitId: 'W1234-18-031310-Z',
          receivedDate: '10-OCT-2019',
          reason: 'QAH',
          description: 'QA Hold',
          collDateIso: '2019-10-10T10:40:00Z',
        },
      ]);

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: UnitIdPostValidateEvent = {
        data: { parsedUnitId: 'W1234-18-031310-Z' } as any,
        confirm: confirmSpy,
        reject: rejectSpy,
      };

      component.onPostValidate(event);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('This unit is already in the list.');
    }));
  });

  describe('Data Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display table data', () => {
      component.tableData.set([
        {
          unitId: 'W1234-18-031310-Z',
          outsideUnitId: 'W1234-18-031310-Z',
          receivedDate: '10-OCT-2019',
          reason: 'QAH',
          description: 'QA Hold',
          collDateIso: '2019-10-10T10:40:00Z',
        },
      ]);
      fixture.detectChanges();

      expect(component.paginatedData().length).toBe(1);
    });
  });

  describe('Save Operation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.searchForm.get('contractId')?.setValue('RG001');
    });

    it('should call skipUnits API when valid data exists', fakeAsync(() => {
      component.tableData.set([
        {
          unitId: 'W1234-18-031310-Z',
          outsideUnitId: 'W1234-18-031310-Z',
          receivedDate: '10-OCT-2019',
          reason: 'QAH',
          description: 'QA Hold',
          collDateIso: '2019-10-10T10:40:00Z',
        },
      ]);

      component.onSave();
      tick();

      expect(apiServiceSpy.skipUnits).toHaveBeenCalledWith(
        jasmine.objectContaining({
          contractId: 'RG001',
          units: [
            jasmine.objectContaining({
              unitId: 'W1234-18-031310-Z',
              collDate: '2019-10-10T10:40:00Z',
            }),
          ],
        }),
      );
    }));
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have unique IDs across multiple component instances', () => {
      const fixture2 = TestBed.createComponent(SkipResultsFromExtractionComponent);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
      expect(component['elementId']('contractId')).not.toBe(component2['elementId']('contractId'));
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start with By Batch tab selected (index 0)', () => {
      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should switch to By Units tab when tab is changed', () => {
      component.onTabChange(1);
      expect(component.selectedTabIndex()).toBe(1);
    });
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all forms and data when clearAll is called', () => {
      component.searchForm.patchValue({ contractId: 'RG001' });
      component.byBatchForm.patchValue({ testBatchId: 'BATCH123' });
      component.tableData.set([
        {
          unitId: 'W1234-18-031310-Z',
          outsideUnitId: 'W1234-18-031310-Z',
          receivedDate: '10-OCT-2019',
          reason: 'QAH',
          description: 'QA Hold',
          collDateIso: '2019-10-10T10:40:00Z',
        },
      ]);

      component.clearAll();

      expect(component.searchForm.get('contractId')?.value).toBe(null);
      expect(component.byBatchForm.get('testBatchId')?.value).toBe(null);
      expect(component.tableData().length).toBe(0);
    });

    it('should reset option code to "S" when clearing search form', () => {
      component.clearSearchForm();
      expect(component.searchForm.get('optionCode')?.value).toBe('S');
    });
  });
});
