import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { TestResultReconciliation } from './test-result-reconciliation';
import { TestResultReconciliationApiService } from './services/test-result-reconciliation-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

import {
  TestBatchDto,
  TestForReconciliationDto,
  ReconciliationUnitDto,
  ValidTestResultDto,
  ReconciliationSummaryDto
} from './models/test-result-reconciliation.model';

describe('TestResultReconciliation', () => {
  let pageHeaderSpy: any;
  let apiSpy: any;
  let component: TestResultReconciliation;
  let fixture: ComponentFixture<TestResultReconciliation>;
  let apiServiceSpy: jasmine.SpyObj<TestResultReconciliationApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChanged$: Subject<void>;

  const mockBatches: TestBatchDto[] = [
    {
      tbId: '100216-TB 1021',
      insertDate: '2026-06-01T10:30:00Z',
      insertDateFormatted: '06-01-2026',
      pendingUnitCount: 5
    }
  ];

  const mockTests: TestForReconciliationDto[] = [
    {
      testId: 'IAT',
      testDesc: 'Indirect Antiglobulin Test',
      pendingUnitCount: 5,
      antigenFlag: 'N',
      fullTech2: 'N'
    }
  ];

  const mockUnits: ReconciliationUnitDto[] = [
    {
      tbSeqNo: 1,
      unitId: 'W633316100207',
      checkDigit: 'X',
      collDate: '2026-05-28T00:00:00Z',
      tempResult1: 'P',
      tempResult2: 'N',
      resultCodeDesc1: 'Positive',
      resultCodeDesc2: 'Negative',
      tech1UserId: 'JOHNL',
      tech1UserName: 'John Lee',
      tech2UserId: 'CELHUN',
      tech2UserName: 'Celeste Hunter',
      supervisorResult: null,
      resultStatDesc: null
    }
  ];

  const mockValidResults: ValidTestResultDto[] = [
    { resultStatus: 'P', codeDesc: 'Positive' },
    { resultStatus: 'N', codeDesc: 'Negative' }
  ];

  const mockReconciliationSummary: ReconciliationSummaryDto = {
    totalUnitsReconciled: 1,
    resultCounts: { P: 1 },
    message: 'Results Entered - 1:P'
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('TestResultReconciliationApiService', [
      'getOpenBatches',
      'getTestsInBatch',
      'getUnitsForReconciliation',
      'getValidResults',
      'reconcileResults'
    ]);
    const snackbarSpy = createMockSnackbarService();

    chapterChanged$ = new Subject<void>();
    const headerSpy = createMockHeaderService();

    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null)
    });
    pageHeaderSpy.getTitle.and.returnValue('');
    pageHeaderSpy.getSubtitle.and.returnValue('');

    // Set up default return values
    apiSpy.getOpenBatches.and.returnValue(of(mockBatches));
    apiSpy.getTestsInBatch.and.returnValue(of(mockTests));
    apiSpy.getUnitsForReconciliation.and.returnValue(of(mockUnits));
    apiSpy.getValidResults.and.returnValue(of(mockValidResults));
    apiSpy.reconcileResults.and.returnValue(of(mockReconciliationSummary));



      TestBed.configureTestingModule({
      imports: [TestResultReconciliation, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: TestResultReconciliationApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy }
      ]
    });


    


      apiSpy.getOpenBatches.calls.reset();


      apiSpy.getTestsInBatch.calls.reset();


      apiSpy.getUnitsForReconciliation.calls.reset();


      apiSpy.getValidResults.calls.reset();


      apiSpy.reconcileResults.calls.reset();


      pageHeaderSpy.getTitle.calls.reset();


      pageHeaderSpy.getSubtitle.calls.reset();


      pageHeaderSpy.getTitle.and.returnValue('');


      pageHeaderSpy.getSubtitle.and.returnValue('');


      apiSpy.getOpenBatches.and.returnValue(of(mockBatches));


      apiSpy.getTestsInBatch.and.returnValue(of(mockTests));


      apiSpy.getUnitsForReconciliation.and.returnValue(of(mockUnits));


      apiSpy.getValidResults.and.returnValue(of(mockValidResults));


      apiSpy.reconcileResults.and.returnValue(of(mockReconciliationSummary));


    fixture = TestBed.createComponent(TestResultReconciliation);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(TestResultReconciliationApiService) as jasmine.SpyObj<TestResultReconciliationApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });

  describe('Initialization', () => {


    it('should load open batches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getOpenBatches).toHaveBeenCalled();
      expect((component as any).batches()).toEqual(mockBatches);
    }));

    it('should auto-select first batch and load tests', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getTestsInBatch).toHaveBeenCalledWith('100216-TB 1021');
      expect((component as any).tests()).toEqual(mockTests);
    }));

    it('should auto-select first test and load units', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getUnitsForReconciliation).toHaveBeenCalledWith(
        '100216-TB 1021',
        'IAT'
      );
      expect(apiServiceSpy.getValidResults).toHaveBeenCalledWith('IAT', 'N');
      expect((component as any).units()).toEqual(mockUnits);
      expect((component as any).validResults()).toEqual(mockValidResults);
    }));

    it('should display page header with breadcrumbs', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    }));





    it('should configure pagination with default values', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });
  describe('Error Handling', () => {


    it('should display error container when error exists', fakeAsync(() => {
      const errorResponse = { error: { message: 'Test error message' } };
      apiServiceSpy.getOpenBatches.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    }));



    it('should handle test loading error', fakeAsync(() => {
      const errorResponse = { error: { message: 'Failed to load tests' } };
      apiServiceSpy.getTestsInBatch.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load tests'
      );
    }));

    it('should handle units loading error', fakeAsync(() => {
      const errorResponse = { error: { message: 'Failed to load units' } };
      apiServiceSpy.getUnitsForReconciliation.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load units'
      );
    }));
  });

  describe('Table Data', () => {
    it('should transform units into table data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const tableData = (component as any).tableData();
      expect(tableData.length).toBe(1);
      expect(tableData[0].tbId).toBe('100216-TB 1021');
      expect(tableData[0].testId).toBe('IAT');
      expect(tableData[0].unitId).toBe('W633316100207-X');
      expect(tableData[0].hasDiscrepancy).toBeTrue();
    }));

    it('should format unit ID with check digit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const tableData = (component as any).tableData();
      expect(tableData[0].unitId).toBe('W633316100207-X');
    }));

    it('should format unit ID without check digit', fakeAsync(() => {
      const unitsWithoutCheckDigit: ReconciliationUnitDto[] = [
        { ...mockUnits[0], checkDigit: null }
      ];
      apiServiceSpy.getUnitsForReconciliation.and.returnValue(of(unitsWithoutCheckDigit));

      fixture.detectChanges();
      tick();

      const tableData = (component as any).tableData();
      expect(tableData[0].unitId).toBe('W633316100207');
    }));

    it('should detect discrepancy when Tech 1 and Tech 2 differ', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const tableData = (component as any).tableData();
      expect(tableData[0].hasDiscrepancy).toBeTrue();
    }));
  });

  describe('Search Functionality', () => {
    it('should filter table data by batch ID', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('100216');
      const filteredData = (component as any).filteredTableData();
      expect(filteredData.length).toBe(1);
    }));

    it('should filter table data by test ID', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('IAT');
      const filteredData = (component as any).filteredTableData();
      expect(filteredData.length).toBe(1);
    }));

    it('should filter table data by unit ID', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('W633316100207');
      const filteredData = (component as any).filteredTableData();
      expect(filteredData.length).toBe(1);
    }));

    it('should return all data when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('');
      const filteredData = (component as any).filteredTableData();
      expect(filteredData.length).toBe(1);
    }));




  });

  describe('Pagination', () => {


    it('should paginate data correctly', fakeAsync(() => {
      // Create multiple units
      const multipleUnits: ReconciliationUnitDto[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockUnits[0],
        tbSeqNo: i + 1,
        unitId: `UNIT${i + 1}`
      }));
      apiServiceSpy.getUnitsForReconciliation.and.returnValue(of(multipleUnits));

      fixture.detectChanges();
      tick();

      component.currentPageSize = 10;
      component.currentPageIndex = 0;

      const paginatedData = (component as any).paginatedData();
      expect(paginatedData.length).toBe(10);
    }));

    it('should update total records count', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).totalRecords()).toBe(1);
    }));
  });

  describe('Side Panel', () => {
    it('should open side panel when view action is triggered', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const tableData = (component as any).tableData();
      component.onRowAction({ action: 'view', row: tableData[0] });

      expect((component as any).sidePanelOpen()).toBeTrue();
      expect((component as any).currentUnit()).toEqual(mockUnits[0]);
    }));



    it('should close side panel on closePanel event', () => {
      (component as any).sidePanelOpen.set(true);
      (component as any).currentUnit.set(mockUnits[0]);

      component.onCloseSidePanel();

      expect((component as any).sidePanelOpen()).toBeFalse();
      expect((component as any).currentUnit()).toBeNull();
    });

    it('should apply side-panel-active class when panel is open', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).sidePanelOpen.set(true);
      (component as any).currentUnit.set(mockUnits[0]);
      fixture.detectChanges();

      const wrapper = fixture.debugElement.query(By.css('.layout-wrapper'));
      expect(wrapper.nativeElement.classList.contains('side-panel-active')).toBeTrue();
    }));
  });

  describe('Reconciliation', () => {
    it('should call API to reconcile results', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).currentUnit.set(mockUnits[0]);
      (component as any).selectedBatch.set('100216-TB 1021');
      (component as any).selectedTest.set('IAT');

      component.onConfirmReconciliation({ supervisorResult: 'P' });
      tick();

      expect(apiServiceSpy.reconcileResults).toHaveBeenCalledWith({
        tbId: '100216-TB 1021',
        testId: 'IAT',
        antigenFlag: 'N',
        units: [
          {
            tbSeqNo: 1,
            unitId: 'W633316100207',
            supervisorResult: 'P'
          }
        ]
      });
    }));



    it('should close side panel after successful reconciliation', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).sidePanelOpen.set(true);
      (component as any).currentUnit.set(mockUnits[0]);
      (component as any).selectedBatch.set('100216-TB 1021');
      (component as any).selectedTest.set('IAT');

      component.onConfirmReconciliation({ supervisorResult: 'P' });
      tick();

      expect((component as any).sidePanelOpen()).toBeFalse();
      expect((component as any).currentUnit()).toBeNull();
    }));

    it('should handle reconciliation error', fakeAsync(() => {
      const errorResponse = { error: { message: 'Failed to reconcile' } };
      apiServiceSpy.reconcileResults.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      (component as any).sidePanelOpen.set(true);
      (component as any).currentUnit.set(mockUnits[0]);
      (component as any).selectedBatch.set('100216-TB 1021');
      (component as any).selectedTest.set('IAT');

      component.onConfirmReconciliation({ supervisorResult: 'P' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to reconcile'
      );
      expect((component as any).sidePanelOpen()).toBeTrue();
    }));


  });
});
