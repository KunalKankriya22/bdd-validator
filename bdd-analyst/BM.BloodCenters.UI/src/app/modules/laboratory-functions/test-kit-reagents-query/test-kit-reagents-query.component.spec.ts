import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TestKitReagentsQueryComponent } from './test-kit-reagents-query.component';
import { TestKitReagentsQueryApiService } from './services/test-kit-reagents-query-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TestKitReagentResultDto, ERROR_MESSAGES } from './models/test-kit-reagents-query.model';

describe('TestKitReagentsQueryComponent', () => {
  let component: TestKitReagentsQueryComponent;
  let fixture: ComponentFixture<TestKitReagentsQueryComponent>;
  let apiSpy: jasmine.SpyObj<TestKitReagentsQueryApiService>;
  let pageHeaderServiceMock: any;

  const mockTestIds = [
    { testId: 'ABO', testDescription: 'ABO Typing' },
    { testId: 'RH', testDescription: 'Rh Typing' },
  ];

  const mockTestKits: TestKitReagentResultDto[] = [
    { testKitId: 'TK001', insertDate: '2026-01-01T10:30:00', qcExpiryDate: '2026-06-30T14:00:00', apprLicFlag: 'Y', isQcIncomplete: false },
    { testKitId: 'TK002', insertDate: '2026-01-15T08:15:00', qcExpiryDate: null, apprLicFlag: 'N', isQcIncomplete: true },
  ];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('TestKitReagentsQueryApiService', [
      'getTestKits', 'getTestIdsLov', 'getReagentDetails', 'getBatchDetails',
    ]);

    pageHeaderServiceMock = {
      pageHeaderData: signal<any>(undefined),
    };

    apiSpy.getTestIdsLov.and.returnValue(of(mockTestIds));

    TestBed.configureTestingModule({
      imports: [TestKitReagentsQueryComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TestKitReagentsQueryApiService, useValue: apiSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
      ],
    });

    fixture = TestBed.createComponent(TestKitReagentsQueryComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }
  });

  afterEach(() => {
    fixture.destroy();
  });

  // -----------------------------------------------------------------------
  // 1. Component creation
  // -----------------------------------------------------------------------

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 2. Form initialization
  // -----------------------------------------------------------------------

  describe('form initialization', () => {
    it('should require testId', () => {
      component.searchForm.patchValue({ testId: '' });
      component.searchForm.get('testId')?.markAsTouched();
      expect(component.searchForm.get('testId')?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength(10) on testId', () => {
      component.searchForm.patchValue({ testId: '12345678901' });
      expect(component.searchForm.get('testId')?.hasError('maxlength')).toBe(true);
    });

    it('should have dateFormatValidator on fromDate', () => {
      component.searchForm.get('fromDate')?.setValue('invalid-date');
      component.searchForm.get('fromDate')?.markAsTouched();
      const hasDateError =
        component.searchForm.get('fromDate')?.hasError('invalidDateFormat') ||
        component.searchForm.get('fromDate')?.hasError('invalidDate');
      expect(hasDateError).toBe(true);
    });

    it('should have dateFormatValidator on toDate', () => {
      component.searchForm.get('toDate')?.setValue('invalid-date');
      component.searchForm.get('toDate')?.markAsTouched();
      const hasDateError =
        component.searchForm.get('toDate')?.hasError('invalidDateFormat') ||
        component.searchForm.get('toDate')?.hasError('invalidDate');
      expect(hasDateError).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 3. loadTestIds
  // -----------------------------------------------------------------------

  describe('loadTestIds', () => {
    it('should populate test ID options on success', () => {
      expect(component['testIdOptions']).toEqual(mockTestIds);
      expect(component['filteredTestIdOptions']).toEqual(mockTestIds);
    });

    it('should set empty arrays on error', () => {
      apiSpy.getTestIdsLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadTestIds();
      expect(component['testIdOptions']).toEqual([]);
      expect(component['filteredTestIdOptions']).toEqual([]);
    });

    it('should set isLoadingTestIds to false after load completes', () => {
      expect(component['isLoadingTestIds']).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Test ID search filter
  // -----------------------------------------------------------------------

  describe('filterTestIds', () => {
    beforeEach(() => {
      component['testIdOptions'] = mockTestIds;
    });

    it('should show all options when search is empty', () => {
      (component as any).filterTestIds('');
      expect(component['filteredTestIdOptions']).toEqual(mockTestIds);
    });

    it('should filter by testId', () => {
      (component as any).filterTestIds('abo');
      expect(component['filteredTestIdOptions'].length).toBe(1);
      expect(component['filteredTestIdOptions'][0].testId).toBe('ABO');
    });

    it('should filter by description', () => {
      (component as any).filterTestIds('typing');
      expect(component['filteredTestIdOptions'].length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // 5. onTestIdChange
  // -----------------------------------------------------------------------

  describe('onTestIdChange', () => {
    beforeEach(() => {
      component['testIdOptions'] = mockTestIds;
    });

    it('should patch description from matching option', () => {
      (component as any).onTestIdChange('ABO');
      expect(component.searchForm.get('testIdDescription')?.value).toBe('ABO Typing');
    });

    it('should clear description when no match', () => {
      (component as any).onTestIdChange('UNKNOWN');
      expect(component.searchForm.get('testIdDescription')?.value).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // 6. onSearch
  // -----------------------------------------------------------------------

  describe('onSearch', () => {
    it('should set submitted to true', () => {
      (component as any).onSearch();
      expect(component['submitted']()).toBe(true);
    });

    it('should not call loadTestKits when form is invalid', () => {
      component.searchForm.patchValue({ testId: '' });
      (component as any).onSearch();
      expect(apiSpy.getTestKits).not.toHaveBeenCalled();
    });

    it('should focus first invalid field when form is invalid', () => {
      const mockEl = document.createElement('input');
      spyOn(mockEl, 'focus');
      spyOn(document, 'querySelector').and.returnValue(mockEl);
      component.searchForm.patchValue({ testId: '' });

      (component as any).onSearch();

      expect(document.querySelector).toHaveBeenCalledWith('.ng-invalid[formControlName]');
      expect(mockEl.focus).toHaveBeenCalled();
    });

    it('should call loadTestKits when form is valid', () => {
      apiSpy.getTestKits.and.returnValue(of(mockTestKits));
      component.searchForm.patchValue({ testId: 'ABO' });

      (component as any).onSearch();

      expect(apiSpy.getTestKits).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 7. loadTestKits
  // -----------------------------------------------------------------------

  describe('loadTestKits', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ testId: 'ABO' });
    });

    it('should set loading and currentTestId during load', () => {
      const subject = new Subject<TestKitReagentResultDto[]>();
      apiSpy.getTestKits.and.returnValue(subject.asObservable());

      (component as any).loadTestKits();

      expect(component['loading']()).toBe(true);
      expect(component['currentTestId']()).toBe('ABO');

      subject.next(mockTestKits);
      subject.complete();

      expect(component['loading']()).toBe(false);
    });

    it('should populate testKits and dataSource on success', () => {
      apiSpy.getTestKits.and.returnValue(of(mockTestKits));
      (component as any).loadTestKits();

      expect(component['testKits']()).toEqual(mockTestKits);
      expect(component.dataSource).toEqual(mockTestKits);
    });

    it('should set resultAnnouncement on success with data', () => {
      apiSpy.getTestKits.and.returnValue(of(mockTestKits));
      (component as any).loadTestKits();

      expect(component['resultAnnouncement']()).toBe('Found 2 test kits.');
    });

    it('should set resultAnnouncement for empty results', () => {
      apiSpy.getTestKits.and.returnValue(of([]));
      (component as any).loadTestKits();

      expect(component['resultAnnouncement']()).toBe('No test kits found.');
    });

    it('should handle API error with nested error message', () => {
      apiSpy.getTestKits.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Test ID not found' } },
      })));

      (component as any).loadTestKits();

      expect(component['error']()).toBe('Test ID not found');
      expect(component['resultAnnouncement']()).toBe('Test ID not found');
      expect(component['loading']()).toBe(false);
      expect(component['testKits']()).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });

    it('should handle generic error with fallback message', () => {
      apiSpy.getTestKits.and.returnValue(throwError(() => new Error('generic')));
      (component as any).loadTestKits();

      expect(component['error']()).toBe(ERROR_MESSAGES.LOAD_ERROR);
    });

    it('should skip when testId is empty', () => {
      component.searchForm.patchValue({ testId: '' });
      (component as any).loadTestKits();
      expect(apiSpy.getTestKits).not.toHaveBeenCalled();
    });

    it('should update pagination totalRecords', () => {
      apiSpy.getTestKits.and.returnValue(of(mockTestKits));
      (component as any).loadTestKits();
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // 8. onClear
  // -----------------------------------------------------------------------

  describe('onClear', () => {
    beforeEach(() => {
      component['testKits'].set(mockTestKits);
      component.dataSource = [...mockTestKits];
      component['submitted'].set(true);
      component['currentTestId'].set('ABO');
      component['error'].set('some error');
      component['resultAnnouncement'].set('Found 2 test kits.');
      component.searchForm.patchValue({ testId: 'ABO' });
    });

    it('should reset signals', () => {
      (component as any).onClear();

      expect(component['submitted']()).toBe(false);
      expect(component['error']()).toBeNull();
      expect(component['currentTestId']()).toBe('');
    });

    it('should reset form values', () => {
      (component as any).onClear();

      expect(component.searchForm.get('testId')?.value).toBeFalsy();
    });

    it('should clear resultAnnouncement', () => {
      (component as any).onClear();

      expect(component['resultAnnouncement']()).toBe('');
    });

    it('should reset pagination', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.totalRecords = 50;
        component.tableConfig.pagination.pageIndex = 3;
      }

      (component as any).onClear();

      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should clear errors and mark controls untouched and pristine', () => {
      Object.keys(component.searchForm.controls).forEach(key => {
        component.searchForm.get(key)?.markAsTouched();
        component.searchForm.get(key)?.markAsDirty();
      });

      (component as any).onClear();

      Object.keys(component.searchForm.controls).forEach(key => {
        const ctrl = component.searchForm.get(key);
        expect(ctrl?.errors).toBeNull();
        expect(ctrl?.touched).toBe(false);
        expect(ctrl?.pristine).toBe(true);
      });
    });
  });

  // -----------------------------------------------------------------------
  // 9. isClearDisabled
  // -----------------------------------------------------------------------

  describe('isClearDisabled', () => {
    it('should be true when form is empty and no data', () => {
      component.searchForm.reset();
      component['testKits'].set([]);
      expect((component as any).isClearDisabled).toBe(true);
    });

    it('should be false when testId has value', () => {
      component.searchForm.patchValue({ testId: 'ABO' });
      expect((component as any).isClearDisabled).toBe(false);
    });

    it('should be false when testKits has data', () => {
      component.searchForm.reset();
      component['testKits'].set(mockTestKits);
      expect((component as any).isClearDisabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Computed signals
  // -----------------------------------------------------------------------

  describe('computed signals', () => {
    it('isEmpty should be true when no test kits', () => {
      component['testKits'].set([]);
      expect(component['isEmpty']()).toBe(true);
    });

    it('hasData should be true when test kits present', () => {
      component['testKits'].set(mockTestKits);
      expect(component['hasData']()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Side panels
  // -----------------------------------------------------------------------

  describe('side panels', () => {
    it('should set reagentsPanelRow and open panel on onSeeReagents', () => {
      component['currentTestId'].set('ABO');
      (component as any).onSeeReagents(mockTestKits[0]);

      expect(component['reagentsPanelRow']).toEqual({ testKitId: 'TK001', testId: 'ABO' });
      expect(component['isReagentsPanelOpen']).toBe(true);
    });

    it('should reset state on closeReagentsPanel', () => {
      component['isReagentsPanelOpen'] = true;
      component['reagentsPanelRow'] = { testKitId: 'TK001', testId: 'ABO' };

      (component as any).closeReagentsPanel();

      expect(component['isReagentsPanelOpen']).toBe(false);
      expect(component['reagentsPanelRow']).toBeNull();
    });

    it('should set batchPanelRow and open panel on onBatchDetails', () => {
      (component as any).onBatchDetails(mockTestKits[0]);

      expect(component['batchPanelRow']).toEqual({ testKitId: 'TK001' });
      expect(component['isBatchPanelOpen']).toBe(true);
    });

    it('should reset state on closeBatchPanel', () => {
      component['isBatchPanelOpen'] = true;
      component['batchPanelRow'] = { testKitId: 'TK001' };

      (component as any).closeBatchPanel();

      expect(component['isBatchPanelOpen']).toBe(false);
      expect(component['batchPanelRow']).toBeNull();
    });

    it('reagentsPanelRow should contain testKitId and testId', () => {
      component['currentTestId'].set('RH');
      (component as any).onSeeReagents(mockTestKits[1]);

      expect(component['reagentsPanelRow']?.testKitId).toBe('TK002');
      expect(component['reagentsPanelRow']?.testId).toBe('RH');
    });

    it('batchPanelRow should contain testKitId', () => {
      (component as any).onBatchDetails(mockTestKits[1]);

      expect(component['batchPanelRow']?.testKitId).toBe('TK002');
    });

    it('isReagentsPanelOpen should default to false', () => {
      expect(component['isReagentsPanelOpen']).toBe(false);
    });

    it('isBatchPanelOpen should default to false', () => {
      expect(component['isBatchPanelOpen']).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 12. Display formatters
  // -----------------------------------------------------------------------

  describe('formatDate', () => {
    it('should format valid datetime as DD-MMM-YYYY HH:mm uppercase', () => {
      const result = (component as any).formatDate('2026-01-15T14:30:00');
      expect(result).toBe('15-JAN-2026 14:30');
    });

    it('should return -- for null', () => {
      expect((component as any).formatDate(null)).toBe('--');
    });

    it('should return original value for invalid date', () => {
      expect((component as any).formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('getApprLicFlagDisplay', () => {
    it('should return Y for Y flag', () => {
      expect((component as any).getApprLicFlagDisplay('Y')).toBe('Y');
    });

    it('should return N for N flag', () => {
      expect((component as any).getApprLicFlagDisplay('N')).toBe('N');
    });

    it('should return raw value for other flags', () => {
      expect((component as any).getApprLicFlagDisplay('X')).toBe('X');
    });
  });

  describe('getReasonDisplay', () => {
    it('should return QC Incomplete for true', () => {
      expect((component as any).getReasonDisplay(true)).toBe('QC Incomplete');
    });

    it('should return empty string for false', () => {
      expect((component as any).getReasonDisplay(false)).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // 13. Date change handlers
  // -----------------------------------------------------------------------

  describe('date change handlers', () => {
    it('onFromDateChange should trigger toDate revalidation', () => {
      const toDateCtrl = component.searchForm.get('toDate');
      spyOn(toDateCtrl!, 'updateValueAndValidity');
      (component as any).onFromDateChange();
      expect(toDateCtrl!.updateValueAndValidity).toHaveBeenCalled();
    });

    it('onToDateChange should trigger fromDate revalidation', () => {
      const fromDateCtrl = component.searchForm.get('fromDate');
      spyOn(fromDateCtrl!, 'updateValueAndValidity');
      (component as any).onToDateChange();
      expect(fromDateCtrl!.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 14. onPageChange
  // -----------------------------------------------------------------------

  describe('onPageChange', () => {
    it('should update pagination state', () => {
      (component as any).onPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });
  });

  // -----------------------------------------------------------------------
  // 15. onRowAction
  // -----------------------------------------------------------------------

  describe('onRowAction', () => {
    it('should call onSeeReagents for see-reagents action', () => {
      spyOn<any>(component, 'onSeeReagents');
      (component as any).onRowAction({ action: 'see-reagents', row: mockTestKits[0] });
      expect((component as any).onSeeReagents).toHaveBeenCalledWith(mockTestKits[0]);
    });

    it('should call onBatchDetails for batch-details action', () => {
      spyOn<any>(component, 'onBatchDetails');
      (component as any).onRowAction({ action: 'batch-details', row: mockTestKits[0] });
      expect((component as any).onBatchDetails).toHaveBeenCalledWith(mockTestKits[0]);
    });

    it('should ignore unknown action', () => {
      spyOn<any>(component, 'onSeeReagents');
      spyOn<any>(component, 'onBatchDetails');
      (component as any).onRowAction({ action: 'unknown', row: mockTestKits[0] });
      expect((component as any).onSeeReagents).not.toHaveBeenCalled();
      expect((component as any).onBatchDetails).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 16. Table config
  // -----------------------------------------------------------------------

  describe('table config', () => {
    it('should have 5 columns', () => {
      expect(component.tableConfig.columns.length).toBe(5);
    });

    it('should have 2 row actions', () => {
      expect(component.tableConfig.rowActions?.length).toBe(2);
    });

    it('should have pagination defaults', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // 17. Header config
  // -----------------------------------------------------------------------

  describe('header config', () => {
    it('should have breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Test Kit Reagents Query');
    });

    it('should have title', () => {
      expect(component.headerConfig.title).toBe('Test Kit Reagents Query');
    });
  });

  // -----------------------------------------------------------------------
  // 18. Date error methods
  // -----------------------------------------------------------------------

  describe('date error methods', () => {
    it('getFromDateError should return error string when fromDate is invalid', () => {
      const fromDate = component.searchForm.get('fromDate');
      fromDate?.setErrors({ invalidDate: true });
      fromDate?.markAsTouched();

      const result = (component as any).getFromDateError();
      expect(result).toBe('From Date is invalid');
    });

    it('getToDateError should return error string when toDate is invalid', () => {
      const toDate = component.searchForm.get('toDate');
      toDate?.setErrors({ invalidDate: true });
      toDate?.markAsTouched();

      const result = (component as any).getToDateError();
      expect(result).toBe('To Date is invalid');
    });

    it('should return empty string when no errors and not touched', () => {
      const result = (component as any).getFromDateError();
      expect(result).toBe('');
    });

    it('getToDateError should return range error message when dateRangeInvalid', () => {
      const toDate = component.searchForm.get('toDate');
      toDate?.markAsTouched();
      // Set a form-level error (simulating the fromToDateRangeValidator)
      component.searchForm.setErrors({ dateRangeInvalid: true });

      const result = (component as any).getToDateError();
      expect(result).toBe('To Date must be on or after From Date');
    });
  });
});
