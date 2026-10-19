import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ViewCommentsDialog, ViewCommentsDialogData } from './view-comments-dialog';
import { AuditHoldRecord, ReturnResult, HoldCommentsResponse } from '../models/release-audit-holds.model';
import { ReleaseAuditHoldsService } from '../services/release-audit-holds.service';

describe('ViewCommentsDialog', () => {
  let dialogRefSpy: any;
  let component: ViewCommentsDialog;
  let fixture: ComponentFixture<ViewCommentsDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ViewCommentsDialog>>;
  let mockService: jasmine.SpyObj<ReleaseAuditHoldsService>;

  const today = moment();

  const mockRecord: AuditHoldRecord = {
    unitId: 'W633225031610-P',
    collectionDate: today.format('DD-MMM-YYYY').toUpperCase(),
    name: 'Poole, Deborah',
    dateOfBirth: '18-FEB-1988',
    sex: 'M',
    donorId: 'DN00008855',
    donationType: 'AL',
    donationProcedure: 'PP',
    hold: 'BHOLD',
    origin: 'BPSY',
    reason: '10',
    removed: null,
    transactionId: 'TXN001',
    interDescription: 'Blood hold description',
    groupId: 'GRP01',
    groupMode: 'A',
    sourceCode: 'SRC01',
    holdSource: 'UNIT',
    effectiveDate: today.format('DD-MMM-YYYY').toUpperCase(),
    insertDate: today.format('DD-MMM-YYYY').toUpperCase(),
    termDate: null,
    releaseUser: null
  };

  const mockDialogData: ViewCommentsDialogData = {
    record: mockRecord
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('ReleaseAuditHoldsService', ['getHoldComments']);
    mockService.getHoldComments.and.returnValue(of({
      success: true,
      message: '',
      statusCode: 200,
      data: [{ comments: 'Test comment content' }]
    }));



      TestBed.configureTestingModule({
      imports: [
        ViewCommentsDialog,
        NoopAnimationsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ReleaseAuditHoldsService, useValue: mockService }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      mockService.getHoldComments.calls.reset();


      mockService.getHoldComments.and.returnValue(of({
    }));


    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ViewCommentsDialog>>;
    fixture = TestBed.createComponent(ViewCommentsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {
    it('should initialize with dialog data', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.record).toEqual(mockRecord);
    });



    it('should pass correct request parameters', () => {
      const callArgs = mockService.getHoldComments.calls.mostRecent().args;

      expect(callArgs[0]).toBe(mockRecord.unitId);
      expect(callArgs[1].transactionId).toBe(mockRecord.transactionId);
      expect(callArgs[1].interCode).toBe(mockRecord.hold);
      expect(callArgs[1].donorId).toBe(mockRecord.donorId);
      expect(callArgs[1].originatedFrom).toBe(mockRecord.origin);
      expect(callArgs[1].reasonCode).toBe(mockRecord.reason);
      expect(callArgs[1].groupId).toBe(mockRecord.groupId);
      expect(callArgs[1].groupMode).toBe(mockRecord.groupMode);
    });
  });

  /* -------------------------------- COMMENTS LOADING -------------------------------- */

  describe('Comments Loading', () => {


    it('should display fallback message when comments are empty', () => {
      mockService.getHoldComments.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        data: [{ comments: '' }]
      }));

      component.ngOnInit();

      expect(component.comments).toBe('No comments available.');
    });

    it('should display fallback when data is empty array', () => {
      mockService.getHoldComments.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        data: []
      }));

      component.ngOnInit();

      expect(component.comments).toBe('No comments available.');
    });

    it('should display comments from item property', () => {
      mockService.getHoldComments.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        item: { comments: 'Comment from item' }
      } as any));

      component.ngOnInit();

      expect(component.comments).toBe('Comment from item');
    });


  });

  /* -------------------------------- ERROR HANDLING -------------------------------- */

  describe('Error Handling', () => {


    it('should set error message from error.error.message', () => {
      mockService.getHoldComments.and.returnValue(
        throwError(() => ({ error: { message: 'Custom error message' } }))
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Custom error message');
    });

    it('should set error message from error.message', () => {
      mockService.getHoldComments.and.returnValue(
        throwError(() => ({ message: 'Direct message' }))
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Direct message');
    });

    it('should use fallback error message', () => {
      mockService.getHoldComments.and.returnValue(
        throwError(() => ({}))
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Failed to load comments.');
    });
  });

  /* -------------------------------- DIALOG ACTIONS -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
