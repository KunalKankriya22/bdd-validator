import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { InstrumentUploadLogQueryComponent } from './instrument-upload-log-query';
import { InstrumentUploadLogQueryService } from './instrument-upload-log-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { InstrumentUploadLogResponse, FilterOptionsResponse } from './instrument-upload-log-query.model';

const mockFilterOptionsResponse: FilterOptionsResponse = {
  success: true,
  message: '',
  statusCode: 200,
  data: {
    availableTbIds: ['BATCH001', 'BATCH002'],
    availableTestIds: ['TEST001', 'TEST002'],
    availableMachineIds: ['MACHINE001', 'MACHINE002']
  }
};

const mockLogsResponse: InstrumentUploadLogResponse = {
  success: true,
  message: '',
  statusCode: 200,
  data: [
    {
      machineId: 'M001',
      tbId: 'B001',
      testId: 'T001',
      stationNo: '1',
      okCount: 10,
      voidCount: 2,
      statusDats: '2025-01-15T10:00:00Z',
      statusDesc: 'OK',
      reconcileUserId: 'USER001',
      readDats: '2025-01-15'
    }
  ],
  totalCount: 1
};

describe('InstrumentUploadLogQueryComponent', () => {
  let component: InstrumentUploadLogQueryComponent;
  let fixture: ComponentFixture<InstrumentUploadLogQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<InstrumentUploadLogQueryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('InstrumentUploadLogQueryService', ['getInstrumentUploadLogs', 'getFilterOptions']);
    apiServiceSpy.getFilterOptions.and.returnValue(of(mockFilterOptionsResponse));
    apiServiceSpy.getInstrumentUploadLogs.and.returnValue(of(mockLogsResponse));

    snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['debug', 'error']);

    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Instrument Upload Log Query',
        subtitle: 'This screen will display the status of instrument data transfer.',
        menuItemId: 8595
      })
    });

    const headerServiceSpy = createMockHeaderService();

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());

    await TestBed.configureTestingModule({
      imports: [
        InstrumentUploadLogQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: InstrumentUploadLogQueryService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentUploadLogQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should initialize form with correct fields', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('enterDate')).toBeDefined();
      expect(component.searchForm.get('batchId')).toBeDefined();
      expect(component.searchForm.get('testId')).toBeDefined();
      expect(component.searchForm.get('machine')).toBeDefined();
    });

    it('should mark enterDate as required', () => {
      const control = component.searchForm.get('enterDate')!;
      control.setValue(null);
      expect(control.hasError('required')).toBeTrue();
    });

    it('should initialize optional fields as empty string', () => {
      expect(component.searchForm.get('batchId')?.value).toBe('');
      expect(component.searchForm.get('testId')?.value).toBe('');
      expect(component.searchForm.get('machine')?.value).toBe('');
    });
  });

  describe('Table Configuration', () => {
    it('should have correct pagination default (25 rows)', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should define all 9 columns', () => {
      expect(component.tableConfig.columns.length).toBe(9);
    });

    it('should have correct column headers', () => {
      const columns = component.tableConfig.columns;
      expect(columns.find(c => c.key === 'machineId')?.header).toBe('Machine Code');
      expect(columns.find(c => c.key === 'tbId')?.header).toBe('Batch ID');
      expect(columns.find(c => c.key === 'testId')?.header).toBe('Test ID');
      expect(columns.find(c => c.key === 'statusDats')?.header).toBe('Status Date and Time');
      expect(columns.find(c => c.key === 'statusDesc')?.header).toBe('Status');
    });

    it('should sort by tbId by default', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('tbId');
    });

    it('should display correct empty message', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should be true when enterDate is null', () => {
      component.searchForm.get('enterDate')?.setValue(null);
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be false when enterDate is set and not loading', () => {
      component.searchForm.get('enterDate')?.setValue(moment());
      component.isLoading = false;
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should be true when loading even with enterDate set', () => {
      component.searchForm.get('enterDate')?.setValue(moment());
      component.isLoading = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('isClearAllDisabled', () => {
    it('should be true when not searched and no enterDate', () => {
      component.hasSearched = false;
      component.searchForm.get('enterDate')?.setValue(null);
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should be false when hasSearched is true', () => {
      component.hasSearched = true;
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be false when enterDate has a value', () => {
      component.hasSearched = false;
      component.searchForm.get('enterDate')?.setValue(moment());
      expect(component.isClearAllDisabled).toBeFalse();
    });
  });

  describe('enterDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.enterDateFilter(null)).toBeTrue();
    });

    it('should return true for today', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      expect(component.enterDateFilter(moment())).toBeTrue();
    });

    it('should return true for a past date', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      expect(component.enterDateFilter(moment().subtract(1, 'day'))).toBeTrue();
    });

    it('should return false for a future date', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      expect(component.enterDateFilter(moment().add(1, 'day'))).toBeFalse();
    });
  });

  describe('getEnterDateError', () => {
    it('should return required message when control is touched and null', () => {
      const control = component.searchForm.get('enterDate')!;
      control.setValue(null);
      control.markAsTouched();
      expect(component.getEnterDateError()).toBe('Enter Date is required');
    });

    it('should return invalid date format message for matDatepickerParse error', () => {
      const control = component.searchForm.get('enterDate')!;
      control.setErrors({ matDatepickerParse: true });
      expect(component.getEnterDateError()).toBe('Invalid date format');
    });

    it('should return future date message when selected date is after today', () => {
      const control = component.searchForm.get('enterDate')!;
      control.setValue(moment().add(1, 'day'));
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      expect(component.getEnterDateError()).toBe('Enter Date cannot be in the future');
    });

    it('should return empty string for a valid past date', () => {
      const control = component.searchForm.get('enterDate')!;
      control.setValue(moment().subtract(1, 'day'));
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      expect(component.getEnterDateError()).toBe('');
    });
  });

  describe('onRetrieve', () => {
    it('should show error snackbar and not call API when enterDate is null', () => {
      component.searchForm.get('enterDate')?.setValue(null);
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Enter Date is required');
      expect(apiServiceSpy.getInstrumentUploadLogs).not.toHaveBeenCalled();
    });

    it('should call API and populate dataSource on success', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(apiServiceSpy.getInstrumentUploadLogs).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].machineId).toBe('M001');
    });

    it('should update totalRecords from API response', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });

    it('should set hasSearched to true', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(component.hasSearched).toBeTrue();
    });

    it('should set isLoading to false after success', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(component.isLoading).toBeFalse();
    });

    it('should pass readDate in YYYY-MM-DD format to API', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      const params = apiServiceSpy.getInstrumentUploadLogs.calls.mostRecent().args[0];
      expect(params.readDate).toBe('2025-01-15');
    });

    it('should include optional filter values in API request when set', () => {
      component.searchForm.patchValue({
        enterDate: moment('2025-01-15'),
        batchId: 'BATCH001',
        testId: 'TEST001',
        machine: 'MACHINE001'
      });
      component.onRetrieve();
      const params = apiServiceSpy.getInstrumentUploadLogs.calls.mostRecent().args[0];
      expect(params.tbId).toBe('BATCH001');
      expect(params.testId).toBe('TEST001');
      expect(params.machineId).toBe('MACHINE001');
    });

    it('should show error and clear data when response.success is false', () => {
      apiServiceSpy.getInstrumentUploadLogs.and.returnValue(of({
        success: false,
        message: 'No data found',
        statusCode: 200,
        data: [],
        totalCount: 0
      }));
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No data found');
      expect(component.dataSource).toEqual([]);
    });

    it('should handle API error, show snackbar and clear data', () => {
      apiServiceSpy.getInstrumentUploadLogs.and.returnValue(throwError(() => ({ message: 'Server error' })));
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(loggingServiceSpy.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should use fallback error message when API error has no message', () => {
      apiServiceSpy.getInstrumentUploadLogs.and.returnValue(throwError(() => ({})));
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve data');
    });
  });

  describe('onClearAll', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ enterDate: moment(), batchId: 'B1', testId: 'T1', machine: 'M1' });
      component.dataSource = mockLogsResponse.data;
      component.hasSearched = true;
      component.batchIds = ['B1'];
      component.testIds = ['T1'];
      component.machineIds = ['M1'];
      component.filteredBatchIds = ['B1'];
      component.filteredTestIds = ['T1'];
      component.filteredMachineIds = ['M1'];
    });

    it('should reset form to empty state', () => {
      component.onClearAll();
      expect(component.searchForm.get('enterDate')?.value).toBeNull();
      expect(component.searchForm.get('batchId')?.value).toBe('');
      expect(component.searchForm.get('testId')?.value).toBe('');
      expect(component.searchForm.get('machine')?.value).toBe('');
    });

    it('should clear dataSource', () => {
      component.onClearAll();
      expect(component.dataSource).toEqual([]);
    });

    it('should reset hasSearched to false', () => {
      component.onClearAll();
      expect(component.hasSearched).toBeFalse();
    });

    it('should clear all filter id arrays', () => {
      component.onClearAll();
      expect(component.batchIds).toEqual([]);
      expect(component.testIds).toEqual([]);
      expect(component.machineIds).toEqual([]);
      expect(component.filteredBatchIds).toEqual([]);
      expect(component.filteredTestIds).toEqual([]);
      expect(component.filteredMachineIds).toEqual([]);
    });

    it('should reset pagination pageIndex and totalRecords', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 2;
        component.tableConfig.pagination.totalRecords = 100;
      }
      component.onClearAll();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });

    it('should reset search controls to empty string', () => {
      component.batchIdSearchControl.setValue('batch');
      component.testIdSearchControl.setValue('test');
      component.machineSearchControl.setValue('machine');
      component.onClearAll();
      expect(component.batchIdSearchControl.value).toBe('');
      expect(component.testIdSearchControl.value).toBe('');
      expect(component.machineSearchControl.value).toBe('');
    });
  });

  describe('Filter options loading', () => {
    it('should call getFilterOptions when enterDate changes', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(apiServiceSpy.getFilterOptions).toHaveBeenCalled();
    });

    it('should populate batchIds, testIds, machineIds on success', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(component.batchIds).toEqual(['BATCH001', 'BATCH002']);
      expect(component.testIds).toEqual(['TEST001', 'TEST002']);
      expect(component.machineIds).toEqual(['MACHINE001', 'MACHINE002']);
    });

    it('should populate filtered arrays on success', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(component.filteredBatchIds).toEqual(['BATCH001', 'BATCH002']);
      expect(component.filteredTestIds).toEqual(['TEST001', 'TEST002']);
      expect(component.filteredMachineIds).toEqual(['MACHINE001', 'MACHINE002']);
    });

    it('should clear arrays and show error when getFilterOptions fails', () => {
      apiServiceSpy.getFilterOptions.and.returnValue(throwError(() => new Error('Network error')));
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(component.batchIds).toEqual([]);
      expect(component.testIds).toEqual([]);
      expect(component.machineIds).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load filter options');
    });

    it('should reset batchId, testId, and machine fields when enterDate changes', () => {
      component.searchForm.patchValue({ batchId: 'B1', testId: 'T1', machine: 'M1' }, { emitEvent: false });
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(component.searchForm.get('batchId')?.value).toBe('');
      expect(component.searchForm.get('testId')?.value).toBe('');
      expect(component.searchForm.get('machine')?.value).toBe('');
    });

    it('should reset testId and machine when batchId changes', () => {
      component.searchForm.patchValue({ enterDate: moment(), testId: 'T1', machine: 'M1' }, { emitEvent: false });
      component.searchForm.get('batchId')?.setValue('BATCH001');
      expect(component.searchForm.get('testId')?.value).toBe('');
      expect(component.searchForm.get('machine')?.value).toBe('');
    });

    it('should reset machine when testId changes', () => {
      component.searchForm.patchValue({ enterDate: moment(), machine: 'M1' }, { emitEvent: false });
      component.searchForm.get('testId')?.setValue('TEST001');
      expect(component.searchForm.get('machine')?.value).toBe('');
    });

    it('should set isLoadingFilters to false after filter options load', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      expect(component.isLoadingFilters).toBeFalse();
    });
  });

  describe('Search filter controls', () => {
    beforeEach(() => {
      component.batchIds = ['BATCH001', 'BATCH002', 'BATCH003'];
      component.testIds = ['TEST001', 'TEST002'];
      component.machineIds = ['MACHINE001', 'MACHINE002'];
      component.filteredBatchIds = [...component.batchIds];
      component.filteredTestIds = [...component.testIds];
      component.filteredMachineIds = [...component.machineIds];
    });

    it('should filter batchIds by search term', () => {
      component.batchIdSearchControl.setValue('BATCH001');
      expect(component.filteredBatchIds).toEqual(['BATCH001']);
    });

    it('should show all batchIds when search term is cleared', () => {
      component.batchIdSearchControl.setValue('BATCH001');
      component.batchIdSearchControl.setValue('');
      expect(component.filteredBatchIds).toEqual(component.batchIds);
    });

    it('should filter testIds by search term', () => {
      component.testIdSearchControl.setValue('TEST001');
      expect(component.filteredTestIds).toEqual(['TEST001']);
    });

    it('should show all testIds when search term is cleared', () => {
      component.testIdSearchControl.setValue('TEST001');
      component.testIdSearchControl.setValue('');
      expect(component.filteredTestIds).toEqual(component.testIds);
    });

    it('should filter machineIds by search term', () => {
      component.machineSearchControl.setValue('MACHINE001');
      expect(component.filteredMachineIds).toEqual(['MACHINE001']);
    });

    it('should filter case-insensitively', () => {
      component.batchIdSearchControl.setValue('batch001');
      expect(component.filteredBatchIds).toEqual(['BATCH001']);
    });
  });

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize on the tableConfig', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 10, previousPageIndex: 1 });
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
    });

    it('should call API to retrieve data', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      apiServiceSpy.getInstrumentUploadLogs.calls.reset();
      component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
      expect(apiServiceSpy.getInstrumentUploadLogs).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should update sort column and direction on tableConfig', () => {
      component.onSortChange({ column: 'tbId', direction: 'A' });
      expect(component.tableConfig.sortConfig?.column).toBe('tbId');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should reset pageIndex to 0 when sort changes', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSortChange({ column: 'tbId', direction: 'D' });
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should call API to retrieve sorted data', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      apiServiceSpy.getInstrumentUploadLogs.calls.reset();
      component.onSortChange({ column: 'tbId', direction: 'A' });
      expect(apiServiceSpy.getInstrumentUploadLogs).toHaveBeenCalled();
    });

    it('should map sort direction A to ASC in API request', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onSortChange({ column: 'tbId', direction: 'A' });
      const params = apiServiceSpy.getInstrumentUploadLogs.calls.mostRecent().args[0];
      expect(params.sortOrder).toBe('ASC');
    });

    it('should map sort direction D to DESC in API request', () => {
      component.searchForm.get('enterDate')?.setValue(moment('2025-01-15'));
      component.onSortChange({ column: 'tbId', direction: 'D' });
      const params = apiServiceSpy.getInstrumentUploadLogs.calls.mostRecent().args[0];
      expect(params.sortOrder).toBe('DESC');
    });
  });

  describe('headerConfig', () => {
    it('should build title and subtitle from pageHeaderService', () => {
      const config = component.headerConfig();
      expect(config.title).toBe('Instrument Upload Log Query');
      expect(config.subtitle).toBe('This screen will display the status of instrument data transfer.');
    });

    it('should include Home breadcrumb and page title breadcrumb', () => {
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBe(2);
      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.breadcrumbs[1].label).toBe('Instrument Upload Log Query');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
