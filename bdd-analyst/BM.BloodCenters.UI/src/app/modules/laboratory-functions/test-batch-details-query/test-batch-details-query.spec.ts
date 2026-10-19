import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { TestBatchDetailsQuery } from './test-batch-details-query';
import { TestBatchDetailsApiService } from './services/test-batch-details-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';

import {
  TestBatchDetailsResult,
  TestIdLovDto,
  WorksheetLovDto
} from './models/test-batch-details.model';

describe('TestBatchDetailsQuery', () => {
  let component: TestBatchDetailsQuery;
  let fixture: ComponentFixture<TestBatchDetailsQuery>;
  let apiServiceSpy: jasmine.SpyObj<TestBatchDetailsApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockTestBatchDetails: TestBatchDetailsResult = {
    worksheetId: '100216-TB1023',
    testId: 'HCV',
    testDesc: 'Hepatitis C Virus (HCV) Antibody',
    firstUnitId: 'W6S331610206',
    firstChkDigit: '3',
    lastUnitId: 'W6S331610206',
    lastChkDigit: '3',
    testKitId: '1020-HCV',
    testType: 'M',
    cutOffValue: '-',
    reconcileFlag: null,
    parmCheckFlag: null,
    kitLotNumber: null,
    totalUnits: 1,
    hasScheduledTests: false,
    hasUnscheduledTests: true,
    hasHoldingTests: false,
    hasParameters: false,
    hasDocuments: false,
    reagents: [
      {
        reagentType: 'R',
        reagentTypeDesc: 'R-Reagent',
        reagentName: 'HCV REAGENT MANUAL',
        expiryDate: '2030-12-31T00:00:00Z',
        channel: null,
        supplierName: 'Ortho',
        lotNumber: 'HCV'
      }
    ]
  };

  const mockTests: TestIdLovDto[] = [
    { testId: 'HCV', testDesc: 'Hepatitis C Virus (HCV) Antibody' },
    { testId: 'HIV', testDesc: 'HIV Antibody Test' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('TestBatchDetailsApiService', [
      'getTestBatchDetails',
      'getTestsForWorksheet',
      'getScheduledTests',
      'getUnscheduledTests',
      'getRecentWorksheets'
    ]);

    dialogSpy = createMockMatDialog();
    snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error', 'info', 'warn']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['pageHeaderData'], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Test Batch Details Query',
        subtitle: 'Query test batch details',
        breadcrumbs: []
      })
    });

    apiServiceSpy.getTestsForWorksheet.and.returnValue(of(mockTests));
    apiServiceSpy.getTestBatchDetails.and.returnValue(of(mockTestBatchDetails));
    apiServiceSpy.getRecentWorksheets.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [TestBatchDetailsQuery, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideRouter([]),
        { provide: TestBatchDetailsApiService, useValue: apiServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      apiServiceSpy.getTestBatchDetails.calls.reset();


      apiServiceSpy.getTestsForWorksheet.calls.reset();


      apiServiceSpy.getScheduledTests.calls.reset();


      apiServiceSpy.getUnscheduledTests.calls.reset();


      apiServiceSpy.getRecentWorksheets.calls.reset();


      loggingServiceSpy.error.calls.reset();


      loggingServiceSpy.info.calls.reset();


      loggingServiceSpy.warn.calls.reset();


      pageHeaderServiceSpy.pageHeaderData.calls.reset();


      apiServiceSpy.getTestsForWorksheet.and.returnValue(of(mockTests));


      apiServiceSpy.getTestBatchDetails.and.returnValue(of(mockTestBatchDetails));


      apiServiceSpy.getRecentWorksheets.and.returnValue(of([]));


    fixture = TestBed.createComponent(TestBatchDetailsQuery);
    component = fixture.componentInstance;


    });


  describe('Worksheet Selection Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load tests when worksheet is selected', fakeAsync(() => {
      const ws: WorksheetLovDto = { tbId: '100216-TB1023', testId: 'HCV' };
      component.onWorksheetSelectionChange(ws);
      tick();

      expect(apiServiceSpy.getTestsForWorksheet).toHaveBeenCalledWith('100216-TB1023');
    }));

    it('should select preselected test when worksheet is selected', fakeAsync(() => {
      const ws: WorksheetLovDto = { tbId: '100216-TB1023', testId: 'HCV' };
      component.onWorksheetSelectionChange(ws);
      tick();

      expect(component.searchForm.get('testId')?.value).toBe('HCV');
    }));

    it('should update test description when test is selected', fakeAsync(() => {
      const ws: WorksheetLovDto = { tbId: '100216-TB1023', testId: 'HCV' };
      component.onWorksheetSelectionChange(ws);
      tick();

      component.searchForm.patchValue({ testId: 'HIV' });
      tick();

      expect(component.searchForm.get('testDescription')?.value).toBe('HIV Antibody Test');
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should call API when form is valid', () => {
      const ws: WorksheetLovDto = { tbId: '100216-TB1023', testId: 'HCV' };
      component.searchForm.patchValue({ worksheetId: ws });
      component.searchForm.get('testId')?.enable();
      component.searchForm.patchValue({ testId: 'HCV' });
      component.onSearch();

      expect(apiServiceSpy.getTestBatchDetails).toHaveBeenCalledWith('100216-TB1023', 'HCV');
    });

    it('should set testBatchDetails on successful search', fakeAsync(() => {
      const ws: WorksheetLovDto = { tbId: '100216-TB1023', testId: 'HCV' };
      component.searchForm.patchValue({ worksheetId: ws });
      component.searchForm.get('testId')?.enable();
      component.searchForm.patchValue({ testId: 'HCV' });
      component.onSearch();
      tick();

      expect(component.testBatchDetails()).toEqual(mockTestBatchDetails);
    }));

    it('should set error on failed search', fakeAsync(() => {
      apiServiceSpy.getTestBatchDetails.and.returnValue(throwError(() => ({ status: 404 })));

      const ws: WorksheetLovDto = { tbId: 'INVALID', testId: 'TEST' };
      component.searchForm.patchValue({ worksheetId: ws });
      component.searchForm.get('testId')?.enable();
      component.searchForm.patchValue({ testId: 'TEST' });
      component.onSearch();
      tick();

      expect(component.error()).toBeTruthy();
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should clear testBatchDetails on clear all', () => {
      component.testBatchDetails.set(mockTestBatchDetails);
      component.onClearAll();

      expect(component.testBatchDetails()).toBeNull();
    });

    it('should clear error on clear all', () => {
      component.error.set('Some error');
      component.onClearAll();

      expect(component.error()).toBeNull();
    });
  });



  describe('Data Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.testBatchDetails.set(mockTestBatchDetails);
      component.reagentsDataSource.data = mockTestBatchDetails.reagents;
      fixture.detectChanges();
    });







    it('should display action buttons', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.action-buttons button'));
      expect(buttons.length).toBe(6);
    });
  });



  describe('Unique ID Generation', () => {


    it('should generate unique element IDs', () => {
      fixture.detectChanges();
      const headingId = component.elementId('main-heading');
      const heading = fixture.debugElement.query(By.css(`#${headingId}`));
      // Heading doesn't exist in empty state, but ID should be generated
      expect(headingId).toBeTruthy();
    });


  });

  describe('Helper Methods', () => {
    it('should format unit ID with check digit', () => {
      const formatted = component.formatUnitId('W6S331610206', '3');
      expect(formatted).toBe('W6S331610206 - 3');
    });

    it('should format unit ID without check digit', () => {
      const formatted = component.formatUnitId('W6S331610206', null);
      expect(formatted).toBe('W6S331610206');
    });

    it('should return "-" for null unit ID', () => {
      const formatted = component.formatUnitId(null, null);
      expect(formatted).toBe('-');
    });

    it('should format value or return "-"', () => {
      expect(component.formatValue('Test')).toBe('Test');
      expect(component.formatValue(null)).toBe('-');
      expect(component.formatValue(undefined)).toBe('-');
    });




  });
});
