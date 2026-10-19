import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

import { CancelTestBatchComponent } from './cancel-test-batch';
import { CancelTestBatchApiService } from './services';
import {
  ReturnResult,
  WorksheetDto,
  TestIdDto,
  UnitDisplayDto,
  CancelBatchResponseDto,
} from './models/cancel-test-batch.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CancelTestBatchComponent', () => {
  let dialogData: any;
  let cancelSubject: any;
  let component: CancelTestBatchComponent;
  let fixture: ComponentFixture<CancelTestBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<CancelTestBatchApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockWorksheets: WorksheetDto[] = [
    { tbId: '111925-TB1002' },
    { tbId: '101325-TB1003' },
    { tbId: '101325-TB1002' },
  ];

  const mockTestIds: TestIdDto[] = [
    { testId: 'CHAG', testDesc: 'Chagas' },
    { testId: 'HBC', testDesc: 'Hepatitis B Core' },
  ];

  const mockSingleTest: TestIdDto[] = [
    { testId: 'ABORH', testDesc: 'ABO/Rh Typing' },
  ];

  const mockUnits: UnitDisplayDto[] = [
    { unitId: 'W633324112413', chkDigit: null, collDate: '2024-10-03T00:00:00' },
    { unitId: 'W633319111560', chkDigit: null, collDate: '2025-01-11T00:00:00' },
  ];

  const mockCancelResponse: CancelBatchResponseDto = {
    success: true,
    message: 'Test batch canceled successfully',
    unitsAffected: 2,
    batchHeaderDeleted: false,
  };

  const returnResult = <T>(item: T, total = 0): ReturnResult<T> => ({
    success: true,
    message: '',
    statusCode: 200,
    item,
    total,
  });

  const errorResult = (message: string, errorCode = ''): ReturnResult<CancelBatchResponseDto> => ({
    success: false,
    message,
    statusCode: 400,
    item: null as any,
    total: 0,
    errorResponse: { errorCode, error: message },
  });

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CancelTestBatchApiService', [
      'getWorksheets', 'getTestIds', 'getUnitsInBatch', 'cancelBatch',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(undefined),
    });
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    apiServiceSpy.getWorksheets.and.returnValue(of(returnResult(mockWorksheets, mockWorksheets.length)));
    apiServiceSpy.getTestIds.and.returnValue(of(returnResult(mockTestIds, mockTestIds.length)));
    apiServiceSpy.getUnitsInBatch.and.returnValue(of(returnResult(mockUnits, mockUnits.length)));
    apiServiceSpy.cancelBatch.and.returnValue(of(returnResult(mockCancelResponse)));



      TestBed.configureTestingModule({
      imports: [CancelTestBatchComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CancelTestBatchApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

      apiServiceSpy.getWorksheets.and.returnValue(of(returnResult(mockWorksheets, mockWorksheets.length)));


      apiServiceSpy.getTestIds.and.returnValue(of(returnResult(mockTestIds, mockTestIds.length)));


      apiServiceSpy.getUnitsInBatch.and.returnValue(of(returnResult(mockUnits, mockUnits.length)));


      apiServiceSpy.cancelBatch.and.returnValue(of(returnResult(mockCancelResponse)));


    fixture = TestBed.createComponent(CancelTestBatchComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load worksheets on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getWorksheets).toHaveBeenCalledTimes(1);
    });

    it('should populate worksheets signal from API response', () => {
      fixture.detectChanges();
      expect(component.worksheets()).toEqual(mockWorksheets);
    });



    it('should initialize form with empty required controls', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('worksheetId')?.value).toBe('');
      expect(component.filterForm.get('testId')?.value).toBe('');
      expect(component.filterForm.invalid).toBeTrue();
    });

    it('should show no units initially', () => {
      fixture.detectChanges();
      expect(component.hasUnits()).toBeFalse();
      expect(component.unitCount()).toBe(0);
    });
  });

  describe('Worksheet Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load test IDs when worksheet is selected', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      expect(apiServiceSpy.getTestIds).toHaveBeenCalledWith('111925-TB1002');
    }));

    it('should populate testIds signal from API response', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      expect(component.testIds()).toEqual(mockTestIds);
    }));





    it('should update selectedWorksheetId signal', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      expect(component.selectedWorksheetId()).toBe('111925-TB1002');
    }));

    it('should auto-select test ID when only one test is returned', fakeAsync(() => {
      apiServiceSpy.getTestIds.and.returnValue(of(returnResult(mockSingleTest, 1)));
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      expect(component.filterForm.get('testId')?.value).toBe('ABORH');
    }));

    it('should not auto-select when multiple tests are returned', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      expect(component.filterForm.get('testId')?.value).toBe('');
    }));
  });

  describe('Test ID Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load units when both worksheet and test ID are selected', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();
      expect(apiServiceSpy.getUnitsInBatch).toHaveBeenCalledWith('111925-TB1002');
    }));

    it('should populate units signal from API response', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();
      expect(component.units()).toEqual(mockUnits);
      expect(component.hasUnits()).toBeTrue();
      expect(component.unitCount()).toBe(2);
    }));


  });

  describe('Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter worksheets by search term', () => {
      expect(component.filteredWorksheets().length).toBe(3);
      component.worksheetSearchCtrl.setValue('1119');
      expect(component.filteredWorksheets().length).toBe(1);
      expect(component.filteredWorksheets()[0].tbId).toBe('111925-TB1002');
    });



    it('should filter test IDs by test ID or description', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();

      component.testIdSearchCtrl.setValue('chag');
      expect(component.filteredTestIds().length).toBe(1);
      expect(component.filteredTestIds()[0].testId).toBe('CHAG');

      component.testIdSearchCtrl.setValue('Hepatitis');
      expect(component.filteredTestIds().length).toBe(1);
      expect(component.filteredTestIds()[0].testId).toBe('HBC');
    }));

    it('should return empty when no matches found', () => {
      component.worksheetSearchCtrl.setValue('ZZZZZ');
      expect(component.filteredWorksheets().length).toBe(0);
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and reload worksheets', fakeAsync(() => {
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();
      apiServiceSpy.getWorksheets.calls.reset();
      component.onClearAll();
      tick();

      expect(component.filterForm.get('worksheetId')?.value).toBeFalsy();
      expect(component.filterForm.get('testId')?.value).toBeFalsy();
      expect(component.units().length).toBe(0);
      expect(component.testIds().length).toBe(0);
      expect(component.selectedWorksheetId()).toBe('');
      expect(apiServiceSpy.getWorksheets).toHaveBeenCalledTimes(1);
    }));


  });

  describe('Cancel Batch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open confirmation dialog with correct data', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(false) } as any);

      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();

      component.onCancelBatch();

      expect((component as any).dialog.open).toHaveBeenCalledTimes(1);
      dialogData = ((component as any).dialog.open as jasmine.Spy).calls.mostRecent().args[1]?.data as ConfirmActionDialogData;
      expect(dialogData.title).toBe('Are you sure you want to cancel the batch?');
      expect(dialogData.confirmText).toBe('YES, CANCEL THE BATCH');
      expect(dialogData.cancelText).toBe('NO, GO BACK');
    }));



    it('should call cancelBatch API when confirmed', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);

      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();

      component.onCancelBatch();
      tick();

      expect(apiServiceSpy.cancelBatch).toHaveBeenCalledWith({
        tbId: '111925-TB1002',
        testId: 'CHAG',
      });
    }));







    it('should set isCancelling during API call', fakeAsync(() => {
      cancelSubject = new Subject<ReturnResult<CancelBatchResponseDto>>();
      spyOn((component as any).dialog, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      apiServiceSpy.cancelBatch.and.returnValue(cancelSubject.asObservable());

      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      component.filterForm.get('testId')?.setValue('CHAG');
      tick();

      component.onCancelBatch();
      tick();
      expect(component.isCancelling()).toBeTrue();

      cancelSubject.next(returnResult(mockCancelResponse));
      cancelSubject.complete();
      tick();
      expect(component.isCancelling()).toBeFalse();
    }));
  });


  describe('Chapter Change', () => {
    it('should reset and reload when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.get('worksheetId')?.setValue('111925-TB1002');
      tick();
      apiServiceSpy.getWorksheets.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('worksheetId')?.value).toBeFalsy();
      expect(component.units().length).toBe(0);
      expect(apiServiceSpy.getWorksheets).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Date Formatting', () => {




    it('should handle undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });
});
