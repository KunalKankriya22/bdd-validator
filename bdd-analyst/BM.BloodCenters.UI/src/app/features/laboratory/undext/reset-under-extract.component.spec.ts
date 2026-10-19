import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { signal, WritableSignal } from '@angular/core';

import { ResetUnderExtractComponent } from './reset-under-extract.component';
import { ResetUnderExtractService } from './services/reset-under-extract.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ResetUnderExtractDto,
  ResetUnderExtractGetResponse,
  ResetUnderExtractResetResponse,
} from './models/reset-under-extract.model';

describe('ResetUnderExtractComponent', () => {
  let component: ResetUnderExtractComponent;
  let fixture: ComponentFixture<ResetUnderExtractComponent>;
  let resetServiceSpy: jasmine.SpyObj<ResetUnderExtractService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let pageHeaderDataSignal: WritableSignal<any>;
  let chapterChangedSubject: Subject<void>;

  /* Raw API response data (no rowId — the component adds it on load) */
  const mockData: ResetUnderExtractDto[] = [
    { resultParmId: 'SR204035', batchId: 'W901217120204-5', insertDate: '2025-01-11T12:00:00Z', underExtractFlag: 'Y' },
    { resultParmId: 'SR204029', batchId: 'W901217120205-3', insertDate: '2025-01-11T12:00:00Z', underExtractFlag: 'Y' },
    { resultParmId: 'SR2040012', batchId: 'W901217120206-1', insertDate: '2025-01-11T12:00:00Z', underExtractFlag: 'Y' },
    { resultParmId: 'SR2040P3', batchId: 'W901217120206-1', insertDate: '2025-01-11T12:00:00Z', underExtractFlag: 'Y' },
  ];

  /* Expected data after the component maps rowId = index */
  const mockDataWithRowId: ResetUnderExtractDto[] = mockData.map((item, index) => ({
    ...item,
    rowId: `${index}`,
  }));

  const mockGetResponse: ResetUnderExtractGetResponse = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockData,
    totalCount: 4,
  };

  const mockResetResponse: ResetUnderExtractResetResponse = {
    success: true,
    message: 'Successfully reset 2 record(s).',
    statusCode: 200,
    data: { successCount: 2, skippedCount: 0, totalProcessed: 2 },
  };

  beforeEach(() => {
    resetServiceSpy = jasmine.createSpyObj('ResetUnderExtractService', [
      'getEligibleRecords',
      'resetFlags',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of(),
      url: '/laboratory-functions/component-production/undext',
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');

    pageHeaderDataSignal = signal({
      title: 'Reset Under Extract Flag',
      subtitle: 'Reset the Under Extract flag when an extract attempt fails to generate a file, allowing the batch to be extracted again.',
    });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle']);
    (pageHeaderServiceSpy as any).pageHeaderData = pageHeaderDataSignal;

    chapterChangedSubject = new Subject<void>();

    resetServiceSpy.getEligibleRecords.and.returnValue(of(mockGetResponse));
    resetServiceSpy.resetFlags.and.returnValue(of(mockResetResponse));

    TestBed.configureTestingModule({
      imports: [ResetUnderExtractComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        { provide: ResetUnderExtractService, useValue: resetServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject } },
      ],
    });

    resetServiceSpy.getEligibleRecords.calls.reset();
    resetServiceSpy.resetFlags.calls.reset();
    routerSpy.navigate.calls.reset();
    routerSpy.createUrlTree.calls.reset();
    routerSpy.serializeUrl.calls.reset();
    pageHeaderServiceSpy.getTitle.calls.reset();
    pageHeaderServiceSpy.getSubtitle.calls.reset();
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    resetServiceSpy.getEligibleRecords.and.returnValue(of(mockGetResponse));
    resetServiceSpy.resetFlags.and.returnValue(of(mockResetResponse));

    fixture = TestBed.createComponent(ResetUnderExtractComponent);
    component = fixture.componentInstance;
  });

  // -----------------------------------------------------------
  // Component Creation & Initialization
  // -----------------------------------------------------------
  describe('Component Creation & Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct initial signal values', () => {
      expect(component.data()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.resetting()).toBe(false);
      expect(component.selectedRows()).toEqual([]);
    });

    it('should have correct initial computed signal values', () => {
      expect(component.isEmpty()).toBe(true);
      expect(component.isReady()).toBe(true);
    });

    it('should have correct header config defaults', () => {
      expect(component.headerConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
      ]);
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should call loadEligibleRecords on ngOnInit', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(1);
    }));

    it('should generate unique component IDs', () => {
      expect(component.componentId).toMatch(/^reset-under-extract-\d+$/);
      const id = component.elementId('cancel-btn');
      expect(id).toBe(`${component.componentId}-cancel-btn`);
    });
  });

  // -----------------------------------------------------------
  // Table Configuration
  // -----------------------------------------------------------
  describe('Table Configuration', () => {
    it('should have 3 columns configured', () => {
      expect(component.tableConfig.columns.length).toBe(3);
    });

    it('should have resultParmId column with header Parm ID', () => {
      const col = component.tableConfig.columns.find((c) => c.key === 'resultParmId');
      expect(col).toBeDefined();
      expect(col!.header).toBe('Parm ID');
      expect(col!.sortable).toBe(false);
    });

    it('should have batchId column with header Batch ID', () => {
      const col = component.tableConfig.columns.find((c) => c.key === 'batchId');
      expect(col).toBeDefined();
      expect(col!.header).toBe('Batch ID');
      expect(col!.sortable).toBe(false);
    });

    it('should have insertDate column with header Insert Date', () => {
      const col = component.tableConfig.columns.find((c) => c.key === 'insertDate');
      expect(col).toBeDefined();
      expect(col!.header).toBe('Insert Date');
      expect(col!.sortable).toBe(false);
    });

    it('should have enableSelection set to true', () => {
      expect(component.tableConfig.enableSelection).toBe(true);
    });

    it('should have selectionPosition set to first', () => {
      expect(component.tableConfig.selectionPosition).toBe('first');
    });

    it('should have selectionKey set to rowId', () => {
      expect(component.tableConfig.selectionKey).toBe('rowId');
    });

    it('should have showPagination set to false', () => {
      expect(component.tableConfig.showPagination).toBe(false);
    });

    it('should have stickyHeader set to true', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
    });

    it('should have correct emptyMessage', () => {
      expect(component.tableConfig.emptyMessage).toBe('No records found eligible for reset');
    });

    it('should format valid date values using DD-MMM-YYYY HH:mm uppercase', () => {
      const dateColumn = component.tableConfig.columns.find((c) => c.key === 'insertDate');
      expect(dateColumn?.valueFormatter).toBeDefined();
      const formatted = dateColumn!.valueFormatter!('2025-01-11T12:00:00Z', {} as ResetUnderExtractDto);
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
      expect(formatted).toContain('JAN');
    });

    it('should return empty string for null date values', () => {
      const dateColumn = component.tableConfig.columns.find((c) => c.key === 'insertDate');
      const formatted = dateColumn!.valueFormatter!(null, {} as ResetUnderExtractDto);
      expect(formatted).toBe('');
    });

    it('should return original value for invalid dates', () => {
      const dateColumn = component.tableConfig.columns.find((c) => c.key === 'insertDate');
      const formatted = dateColumn!.valueFormatter!('not-a-date', {} as ResetUnderExtractDto);
      expect(formatted).toBe('not-a-date');
    });

    it('should show table even when empty', () => {
      expect(component.tableConfig.showTableOnEmpty).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // Data Loading
  // -----------------------------------------------------------
  describe('Data Loading', () => {
    it('should set loading to true during load', fakeAsync(() => {
      let loadingDuringCall = false;
      resetServiceSpy.getEligibleRecords.and.callFake(() => {
        loadingDuringCall = component.loading();
        return of(mockGetResponse);
      });

      fixture.detectChanges();
      tick();

      expect(loadingDuringCall).toBe(true);
    }));

    it('should set data with rowId mapped from index', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.data()).toEqual(mockDataWithRowId);
    }));

    it('should set loading to false after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('should show info snackbar when no records found', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        of({ ...mockGetResponse, data: [], totalCount: 0 })
      );

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('No records found eligible for reset');
    }));

    it('should not show info snackbar when records are returned', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showInfo).not.toHaveBeenCalled();
    }));

    it('should set error on load failure', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({ message: 'Network failure' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Network failure');
      expect(component.loading()).toBe(false);
    }));

    it('should set default error message when err.message is missing', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({}))
      );

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Failed to load eligible records');
    }));

    it('should show error snackbar on load failure with err.error.message', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({ error: { message: 'Server error details' } }))
      );

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error details');
    }));

    it('should show default error snackbar when err.error is missing on load failure', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({}))
      );

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load eligible records');
    }));

    it('should set loading to false after failed load', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('should clear selectedRows on reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0]]);
      expect(component.selectedRows().length).toBe(1);

      component.onRetry();
      tick();

      expect(component.selectedRows()).toEqual([]);
    }));

    it('should clear externalSelectedIds on reload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.externalSelectedIds()).toEqual(new Set());
      expect(component.externalSelectedIds().size).toBe(0);
    }));

    it('should reload data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(1);

      chapterChangedSubject.next();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(2);
    }));
  });

  // -----------------------------------------------------------
  // Row ID Generation
  // -----------------------------------------------------------
  describe('Row ID Generation', () => {
    it('should assign sequential rowId starting from 0', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const data = component.data();
      expect(data[0].rowId).toBe('0');
      expect(data[1].rowId).toBe('1');
      expect(data[2].rowId).toBe('2');
      expect(data[3].rowId).toBe('3');
    }));

    it('should generate unique rowId for rows with same resultParmId and batchId', fakeAsync(() => {
      const duplicateData: ResetUnderExtractDto[] = [
        { resultParmId: 'PARM001', batchId: 'BATCH001', insertDate: '2025-01-11T12:00:00Z', underExtractFlag: 'Y' },
        { resultParmId: 'PARM001', batchId: 'BATCH001', insertDate: '2025-01-12T12:00:00Z', underExtractFlag: 'Y' },
      ];
      resetServiceSpy.getEligibleRecords.and.returnValue(of({
        ...mockGetResponse,
        data: duplicateData,
        totalCount: 2,
      }));

      fixture.detectChanges();
      tick();

      const data = component.data();
      expect(data[0].rowId).toBe('0');
      expect(data[1].rowId).toBe('1');
      expect(data[0].rowId).not.toBe(data[1].rowId);
    }));

    it('each row should have rowId as string of its index', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.data().forEach((row, index) => {
        expect(row.rowId).toBe(`${index}`);
      });
    }));
  });

  // -----------------------------------------------------------
  // Selection
  // -----------------------------------------------------------
  describe('Selection', () => {
    it('should initialize with empty selection', () => {
      expect(component.selectedRows()).toEqual([]);
    });

    it('should update selectedRows on selection change', () => {
      component.onSelectionChange([mockDataWithRowId[0]]);
      expect(component.selectedRows()).toEqual([mockDataWithRowId[0]]);
    });

    it('should update selectedRows on multiple selection', () => {
      component.onSelectionChange([mockDataWithRowId[0], mockDataWithRowId[1], mockDataWithRowId[2]]);
      expect(component.selectedRows().length).toBe(3);
    });

    it('should clear selectedRows when empty array is passed', () => {
      component.onSelectionChange([mockDataWithRowId[0]]);
      expect(component.selectedRows().length).toBe(1);

      component.onSelectionChange([]);
      expect(component.selectedRows()).toEqual([]);
    });

    it('should disable reset button when no rows selected', () => {
      component.selectedRows.set([]);
      component.resetting.set(false);
      expect(component.isResetDisabled).toBe(true);
    });

    it('should disable reset button while resetting', () => {
      component.selectedRows.set([mockDataWithRowId[0]]);
      component.resetting.set(true);
      expect(component.isResetDisabled).toBe(true);
    });

    it('should enable reset button when rows are selected and not resetting', () => {
      component.selectedRows.set([mockDataWithRowId[0]]);
      component.resetting.set(false);
      expect(component.isResetDisabled).toBe(false);
    });

    it('should have externalSelectedIds as empty Set initially', () => {
      expect(component.externalSelectedIds()).toEqual(new Set());
      expect(component.externalSelectedIds().size).toBe(0);
    });
  });

  // -----------------------------------------------------------
  // Reset Operation
  // -----------------------------------------------------------
  describe('Reset Operation', () => {
    it('should not reset when isResetDisabled is true (no selection)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedRows.set([]);
      component.onReset();
      tick();

      expect(resetServiceSpy.resetFlags).not.toHaveBeenCalled();
    }));

    it('should not reset when isResetDisabled is true (resetting in progress)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.resetting.set(true);
      component.onReset();
      tick();

      expect(resetServiceSpy.resetFlags).not.toHaveBeenCalled();
    }));

    it('should set resetting to true during reset', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      let resettingDuringCall = false;
      resetServiceSpy.resetFlags.and.callFake(() => {
        resettingDuringCall = component.resetting();
        return of(mockResetResponse);
      });

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(resettingDuringCall).toBe(true);
    }));

    it('should call resetFlags with correct request payload', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0], mockDataWithRowId[1]]);
      component.onReset();
      tick();

      expect(resetServiceSpy.resetFlags).toHaveBeenCalledWith({
        items: [
          { resultParmId: 'SR204035', batchId: 'W901217120204-5' },
          { resultParmId: 'SR204029', batchId: 'W901217120205-3' },
        ],
      });
    }));

    it('should show success snackbar on successful reset', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0], mockDataWithRowId[1]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        '2 Under Extract flag reset successfully'
      );
    }));

    it('should show success snackbar with correct count for single item', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const singleResetResponse: ResetUnderExtractResetResponse = {
        success: true,
        message: 'Successfully reset 1 record(s).',
        statusCode: 200,
        data: { successCount: 1, skippedCount: 0, totalProcessed: 1 },
      };
      resetServiceSpy.resetFlags.and.returnValue(of(singleResetResponse));

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        '1 Under Extract flag reset successfully'
      );
    }));

    it('should reload eligible records after successful reset', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(2);
    }));

    it('should set resetting to false after successful reset', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(component.resetting()).toBe(false);
    }));

    it('should show error snackbar when response.success is false', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const failResponse: ResetUnderExtractResetResponse = {
        success: false,
        message: 'Some records failed to reset',
        statusCode: 200,
        data: { successCount: 0, skippedCount: 2, totalProcessed: 2 },
      };
      resetServiceSpy.resetFlags.and.returnValue(of(failResponse));

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some records failed to reset');
    }));

    it('should show default error message when response.success is false and message is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const failResponse: ResetUnderExtractResetResponse = {
        success: false,
        message: '',
        statusCode: 200,
        data: { successCount: 0, skippedCount: 1, totalProcessed: 1 },
      };
      resetServiceSpy.resetFlags.and.returnValue(of(failResponse));

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to reset records');
    }));

    it('should not reload data when response.success is false', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const failResponse: ResetUnderExtractResetResponse = {
        success: false,
        message: 'Failed',
        statusCode: 500,
        data: { successCount: 0, skippedCount: 1, totalProcessed: 1 },
      };
      resetServiceSpy.resetFlags.and.returnValue(of(failResponse));
      resetServiceSpy.getEligibleRecords.calls.reset();

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(resetServiceSpy.getEligibleRecords).not.toHaveBeenCalled();
    }));

    it('should set resetting to false on reset error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      resetServiceSpy.resetFlags.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(component.resetting()).toBe(false);
    }));

    it('should show error snackbar on reset HTTP error with err.error.message', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      resetServiceSpy.resetFlags.and.returnValue(
        throwError(() => ({ error: { message: 'Server error occurred' } }))
      );

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error occurred');
    }));

    it('should show default error snackbar when err.error is missing on reset error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      resetServiceSpy.resetFlags.and.returnValue(
        throwError(() => ({}))
      );

      component.onSelectionChange([mockDataWithRowId[0]]);
      component.onReset();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to reset records');
    }));
  });

  // -----------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------
  describe('Cancel', () => {
    it('should navigate to /home on cancel', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  // -----------------------------------------------------------
  // Retry
  // -----------------------------------------------------------
  describe('Retry', () => {
    it('should call loadEligibleRecords on retry', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      resetServiceSpy.getEligibleRecords.calls.reset();
      component.onRetry();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(1);
    }));

    it('should clear error on retry', fakeAsync(() => {
      component.error.set('Error');
      component.onRetry();
      expect(component.error()).toBeNull();
    }));

    it('should retry loading via retry button click in DOM', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.error.set('Error');
      component.loading.set(false);
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('.error-container button'));
      retryButton.nativeElement.click();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(2);
    }));
  });

  // -----------------------------------------------------------
  // Page Header
  // -----------------------------------------------------------
  describe('Page Header', () => {
    it('should update headerConfig when pageHeaderData changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Reset Under Extract Flag');

      pageHeaderDataSignal.set({
        title: 'Updated Title',
        subtitle: 'Updated Subtitle',
      });
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Updated Title');
      expect(component.headerConfig.subtitle).toBe('Updated Subtitle');
      expect(component.headerConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
        { label: 'Updated Title', link: null },
      ]);
    }));
  });

  // -----------------------------------------------------------
  // Computed Signals
  // -----------------------------------------------------------
  describe('Computed Signals', () => {
    it('isEmpty should be true when data is empty', () => {
      component.data.set([]);
      expect(component.isEmpty()).toBe(true);
    });

    it('isEmpty should be false when data has items', () => {
      component.data.set(mockDataWithRowId);
      expect(component.isEmpty()).toBe(false);
    });

    it('isReady should be true when not loading and no error', () => {
      component.loading.set(false);
      component.error.set(null);
      expect(component.isReady()).toBe(true);
    });

    it('isReady should be false when loading', () => {
      component.loading.set(true);
      component.error.set(null);
      expect(component.isReady()).toBe(false);
    });

    it('isReady should be false when error exists', () => {
      component.loading.set(false);
      component.error.set('some error');
      expect(component.isReady()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // Accessibility (WCAG)
  // -----------------------------------------------------------
  describe('Accessibility', () => {
    it('should have region with aria-labelledby', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const section = fixture.debugElement.query(By.css('section[role="region"]'));
      expect(section).toBeTruthy();
      expect(section.nativeElement.getAttribute('aria-labelledby')).toBe(
        component.elementId('heading')
      );
    }));

    it('should have sr-only heading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const heading = fixture.debugElement.query(By.css('h1.sr-only'));
      expect(heading).toBeTruthy();
      expect(heading.nativeElement.id).toBe(component.elementId('heading'));
    }));

    it('should have error container with role=alert', fakeAsync(() => {
      resetServiceSpy.getEligibleRecords.and.returnValue(
        throwError(() => ({ message: 'Test error' }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.getAttribute('role')).toBe('alert');
    }));

    it('should have action buttons with role=group', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const actionButtons = fixture.debugElement.query(By.css('.action-buttons'));
      expect(actionButtons).toBeTruthy();
      expect(actionButtons.nativeElement.getAttribute('role')).toBe('group');
    }));

    it('should have aria-busy on content wrapper during loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.loading.set(true);
      fixture.detectChanges();

      const wrapper = fixture.debugElement.query(By.css('.content-wrapper'));
      expect(wrapper.nativeElement.getAttribute('aria-busy')).toBe('true');

      component.loading.set(false);
      component.resetting.set(false);
      fixture.detectChanges();
      expect(wrapper.nativeElement.getAttribute('aria-busy')).toBeNull();
    }));
  });

  // -----------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------
  describe('Cleanup', () => {
    it('should complete destroy$ subject on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));

    it('should not reload after component is destroyed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(1);

      component.ngOnDestroy();

      chapterChangedSubject.next();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(1);
    }));
  });

  // -----------------------------------------------------------
  // Chapter Change
  // -----------------------------------------------------------
  describe('Chapter Change', () => {
    it('should reload data on each chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      chapterChangedSubject.next();
      tick();
      chapterChangedSubject.next();
      tick();

      expect(resetServiceSpy.getEligibleRecords).toHaveBeenCalledTimes(3);
    }));
  });

  // -----------------------------------------------------------
  // DOM Structure
  // -----------------------------------------------------------
  describe('DOM Structure', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have CANCEL and RESET buttons', () => {
      const cancelBtn = fixture.debugElement.query(By.css('.cancel-button'));
      const resetBtn = fixture.debugElement.query(By.css('.reset-button'));

      expect(cancelBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
    });

    it('should render data table before action buttons', () => {
      const contentWrapper = fixture.debugElement.query(By.css('.content-wrapper'));
      const children = contentWrapper.children;
      const tableIndex = children.findIndex((c) => c.classes['table-container']);
      const buttonsIndex = children.findIndex((c) => c.classes['action-buttons']);

      expect(tableIndex).toBeLessThan(buttonsIndex);
    });

    it('should have status live region', () => {
      const statusRegion = fixture.debugElement.query(By.css('[role="status"]'));
      expect(statusRegion).toBeTruthy();
      expect(statusRegion.nativeElement.getAttribute('aria-live')).toBe('polite');
    });
  });
});
