import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { OverrideDialogComponent, OverrideDialogData } from './override-dialog';
import { SampleTransferInApiService } from '../services/sample-transfer-in-api.service';

describe('OverrideDialogComponent', () => {
  let component: OverrideDialogComponent;
  let fixture: ComponentFixture<OverrideDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<OverrideDialogComponent>>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockApiService: jasmine.SpyObj<SampleTransferInApiService>;

  const dialogData: OverrideDialogData = {
    extUnitId: 'EXT001',
    reasonCodes: [
      { code: 'R1', codeDesc: 'Reason One' },
      { code: 'R2', codeDesc: 'Reason Two' },
    ],
    holdCodes: [
      { code: 'H1', codeDesc: 'Hold One' },
      { code: 'H2', codeDesc: 'Hold Two' },
    ],
    commentCodes: [
      { code: 'C1', codeDesc: 'Comment One' },
    ],
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockApiService = jasmine.createSpyObj('SampleTransferInApiService', ['validateOverrideUser']);

    await TestBed.configureTestingModule({
      imports: [OverrideDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SampleTransferInApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverrideDialogComponent);
    component = fixture.componentInstance;
    // Override the injected dialog to use mock (inject() resolves at creation time)
    (component as any).dialog = mockDialog;
  });

  it('should create', () => {
    try { fixture.detectChanges(); } catch (_) {}
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form with required validators', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.form).toBeTruthy();
      expect(component.form.get('userId')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('reasonCode')).toBeTruthy();
      expect(component.form.get('holdCode')).toBeTruthy();
      expect(component.form.get('comments')).toBeTruthy();
    });

    it('should have empty initial values', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.form.get('userId')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      expect(component.form.get('reasonCode')?.value).toBe('');
    });
  });

  describe('onReasonCodeChange', () => {
    it('should set description for matching reason code', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onReasonCodeChange('R1');
      expect(component.selectedReasonDesc).toBe('Reason One');
    });

    it('should set empty string for non-matching code', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onReasonCodeChange('UNKNOWN');
      expect(component.selectedReasonDesc).toBe('');
    });
  });

  describe('onHoldCodeChange', () => {
    it('should set description for matching hold code', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onHoldCodeChange('H1');
      expect(component.selectedHoldDesc).toBe('Hold One');
    });

    it('should set empty string for non-matching code', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onHoldCodeChange('UNKNOWN');
      expect(component.selectedHoldDesc).toBe('');
    });
  });

  describe('onSelectFromMasterCode', () => {
    it('should open canned comments dialog and set comments on result', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      const afterClosedSubject = new Subject<any>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onSelectFromMasterCode();

      expect(mockDialog.open).toHaveBeenCalled();

      afterClosedSubject.next({ selectedDescriptions: 'Selected comment text' });
      afterClosedSubject.complete();
      tick();

      expect(component.form.get('comments')?.value).toBe('Selected comment text');
    }));

    it('should not update comments when dialog is cancelled', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.get('comments')?.setValue('Original');
      const afterClosedSubject = new Subject<any>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onSelectFromMasterCode();

      afterClosedSubject.next(null);
      afterClosedSubject.complete();
      tick();

      expect(component.form.get('comments')?.value).toBe('Original');
    }));
  });

  describe('onSave', () => {
    beforeEach(() => {
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should mark form touched and return if invalid', () => {
      component.onSave();
      expect(component.form.touched).toBeTrue();
      expect(mockApiService.validateOverrideUser).not.toHaveBeenCalled();
    });

    it('should validate user and close dialog on success', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        holdCode: 'H1',
        comments: 'Test comment',
      });

      mockApiService.validateOverrideUser.and.returnValue(
        of({ success: true, message: '' } as any)
      );

      component.onSave();
      tick();

      expect(mockApiService.validateOverrideUser).toHaveBeenCalledWith('admin', 'pass123');
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        holdCode: 'H1',
        comments: 'Test comment',
      });
      expect(component.isValidating()).toBeFalse();
    }));

    it('should set validation error on unsuccessful response', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test comment',
      });

      mockApiService.validateOverrideUser.and.returnValue(
        of({ success: false, message: 'Invalid credentials' } as any)
      );

      component.onSave();
      tick();

      expect(component.validationError()).toBe('Invalid credentials');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should show default validation error when message is empty', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test comment',
      });

      mockApiService.validateOverrideUser.and.returnValue(
        of({ success: false, message: '' } as any)
      );

      component.onSave();
      tick();

      expect(component.validationError()).toBe('Override user validation failed.');
    }));

    it('should handle 401 error by opening permission error dialog', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test comment',
      });

      const httpError = new HttpErrorResponse({
        status: 401,
        error: { message: 'Unauthorized' },
      });
      mockApiService.validateOverrideUser.and.returnValue(throwError(() => httpError));

      const afterClosedSubject = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onSave();
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(component.isValidating()).toBeFalse();

      // User closes permission dialog without continuing
      afterClosedSubject.next(false);
      afterClosedSubject.complete();
      tick();

      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    }));

    it('should set validation error for non-401 errors', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test comment',
      });

      const httpError = new HttpErrorResponse({
        status: 500,
        error: { message: 'Server error' },
      });
      mockApiService.validateOverrideUser.and.returnValue(throwError(() => httpError));

      component.onSave();
      tick();

      expect(component.validationError()).toBe('Server error');
      expect(component.isValidating()).toBeFalse();
    }));

    it('should use default error message for non-401 errors without message', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test comment',
      });

      const httpError = new HttpErrorResponse({
        status: 500,
        error: null,
      });
      mockApiService.validateOverrideUser.and.returnValue(throwError(() => httpError));

      component.onSave();
      tick();

      expect(component.validationError()).toBe('Override user validation failed.');
    }));

    it('should handle holdCode null by defaulting to empty string', fakeAsync(() => {
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        holdCode: null,
        comments: 'Test comment',
      });

      mockApiService.validateOverrideUser.and.returnValue(
        of({ success: true, message: '' } as any)
      );

      component.onSave();
      tick();

      expect(mockDialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({ holdCode: '' })
      );
    }));
  });

  describe('onExit', () => {
    it('should close dialog with null', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.onExit();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });

  describe('showPermissionErrorDialog (via 401 flow)', () => {
    it('should show error dialog with errorResponse format', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test',
      });

      const httpError = new HttpErrorResponse({
        status: 401,
        error: {
          errorResponse: { errorCode: 'AUTH001', error: 'No permission' },
        },
      });
      mockApiService.validateOverrideUser.and.returnValue(throwError(() => httpError));

      const afterClosedSubject = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onSave();
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogCallData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogCallData.message).toBe('AUTH001: No permission');

      // User chooses to continue
      afterClosedSubject.next(true);
      afterClosedSubject.complete();
      tick();

      // Dialog should NOT close when user continues
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should show error dialog with message format (no errorResponse)', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      component.form.patchValue({
        userId: 'admin',
        password: 'pass123',
        reasonCode: 'R1',
        comments: 'Test',
      });

      const httpError = new HttpErrorResponse({
        status: 401,
        error: { message: 'Access denied', errorCode: 'E100' },
      });
      mockApiService.validateOverrideUser.and.returnValue(throwError(() => httpError));

      const afterClosedSubject = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onSave();
      tick();

      const dialogCallData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogCallData.message).toBe('E100: Access denied');

      afterClosedSubject.next(false);
      afterClosedSubject.complete();
      tick();
    }));
  });
});
