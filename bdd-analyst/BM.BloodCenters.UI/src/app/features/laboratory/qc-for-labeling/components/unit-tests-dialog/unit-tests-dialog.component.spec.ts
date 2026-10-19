import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  UnitTestsDialogComponent,
  UnitTestsDialogData
} from './unit-tests-dialog.component';
import { LabQcService } from '../../services/lab-qc.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LabQcSummaryDto } from '../../models/lab-qc-summary.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('UnitTestsDialogComponent', () => {
  let component: UnitTestsDialogComponent;
  let fixture: ComponentFixture<UnitTestsDialogComponent>;
  let labQcServiceSpy: jasmine.SpyObj<LabQcService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnitTestsDialogComponent>>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: UnitTestsDialogData = {
    unitId: 'W123417070471-F',
    collDate: '2026-05-27T00:00:00'
  };

  const mockSummary: LabQcSummaryDto = {
    components: [],
    testResults: [
      {
        unitId: 'W123417070471-F',
        collDate: '2026-05-27',
        chapterId: 'DAL',
        testId: 'ABORH',
        testSeqNo: 1,
        testResult: '51',
        testDate: null,
        performedBy: null,
        comments: null,
        resultCode: null,
        cancelFlag: null,
        absorbance: null,
        resultStatus: null,
        testDescription: null,
        resultStatusDescription: null,
        tbId: '030418-TB1001',
        ratio: null,
        resultStatus1: null
      },
      {
        unitId: 'W123417070471-F',
        collDate: '2026-05-27',
        chapterId: 'DAL',
        testId: 'HCV',
        testSeqNo: 1,
        testResult: 'NEG',
        testDate: null,
        performedBy: null,
        comments: null,
        resultCode: null,
        cancelFlag: null,
        absorbance: null,
        resultStatus: null,
        testDescription: null,
        resultStatusDescription: null,
        tbId: '030418-TB1001',
        ratio: null,
        resultStatus1: null
      }
    ],
    testBase: [
      {
        unitId: 'W123417070471-F',
        collDate: '2026-05-27',
        chapterId: 'DAL',
        testId: 'HCV',
        testSeqNo: 1,
        testDescription: 'HCV Test',
        testType: 'REQUIRED',
        requiredFlag: 'Y',
        cancelFlag: null
      }
    ]
  };

  beforeEach(() => {

    labQcServiceSpy = jasmine.createSpyObj('LabQcService', ['getQcSummary']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarServiceSpy = createMockSnackbarService();

    labQcServiceSpy.getQcSummary.and.returnValue(of(mockSummary));



      TestBed.configureTestingModule({
      imports: [UnitTestsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: LabQcService, useValue: labQcServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });


    


      labQcServiceSpy.getQcSummary.calls.reset();


      dialogRefSpy.close.calls.reset();


      labQcServiceSpy.getQcSummary.and.returnValue(of(mockSummary));


    fixture = TestBed.createComponent(UnitTestsDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {






    it('should call getQcSummary on init with formatted date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(labQcServiceSpy.getQcSummary).toHaveBeenCalledWith(
        'W123417070471-F',
        '2026-05-27'
      );
    }));


  });
  describe('Error Handling', () => {


    it('should show default error message when error has no message', fakeAsync(() => {
      labQcServiceSpy.getQcSummary.and.returnValue(
        throwError(() => ({}))
      );

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Failed to load unit test results.');
    }));
  });

  describe('UI States', () => {


    it('should show error container on error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['loading'].set(false);
      component['error'].set('Something went wrong');
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Something went wrong');
    }));






  });

  describe('Tab Navigation', () => {
    it('should initialize with first tab selected', () => {
      expect(component['selectedTabIndex']()).toBe(0);
    });

    it('should have two tabs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const tabs = fixture.debugElement.queryAll(By.css('.mat-mdc-tab'));
      expect(tabs.length).toBe(2);
    }));
  });
  describe('Subscription Cleanup', () => {


    it('should cancel pending subscription on destroy', fakeAsync(() => {
      const apiSubject = new Subject<LabQcSummaryDto>();
      labQcServiceSpy.getQcSummary.and.returnValue(apiSubject.asObservable());

      fixture.detectChanges();
      expect(component['loading']()).toBeTrue();

      component.ngOnDestroy();

      apiSubject.next(mockSummary);
      tick();

      expect(component['loading']()).toBeTrue();
      expect(component['scheduledTests']()).toEqual([]);
      expect(component['unscheduledTests']()).toEqual([]);
    }));
  });
});
