import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { transferDonorDataToLabGuard } from './transfer-donor-data-to-lab.guard';
import { TransferDonorDataToLabComponent } from './transfer-donor-data-to-lab';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('transferDonorDataToLabGuard', () => {
  let matDialog: jasmine.SpyObj<MatDialog>;
  let mockComponent: jasmine.SpyObj<TransferDonorDataToLabComponent>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      transferDonorDataToLabGuard(mockComponent, {} as any, {} as any, {} as any)
    );

  beforeEach(() => {
    matDialog = createMockMatDialog();
    mockComponent = jasmine.createSpyObj('TransferDonorDataToLabComponent', ['canDeactivate', 'abortScan']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: matDialog }
      ]
    });
  });

  it('should allow deactivation when canDeactivate returns true', () => {
    mockComponent.canDeactivate.and.returnValue(true);
    const result = runGuard();
    expect(result).toBeTrue();
    expect(matDialog.open).not.toHaveBeenCalled();
  });

  it('should open confirm dialog when canDeactivate returns false', () => {
    mockComponent.canDeactivate.and.returnValue(false);
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    runGuard();

    expect(matDialog.open).toHaveBeenCalledWith(ConfirmActionDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Transfer In Progress',
        message: 'Transfer is in progress. Are you sure you want to leave this page?',
        confirmText: 'LEAVE PAGE',
        cancelText: 'STAY',
      },
    });
  });

  it('should call abortScan when dialog confirms leaving', (done) => {
    mockComponent.canDeactivate.and.returnValue(false);
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    const result = runGuard() as any;
    result.subscribe((confirmed: boolean) => {
      expect(confirmed).toBeTrue();
      expect(mockComponent.abortScan).toHaveBeenCalled();
      done();
    });

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
  });

  it('should not call abortScan when dialog is cancelled', (done) => {
    mockComponent.canDeactivate.and.returnValue(false);
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    const result = runGuard() as any;
    result.subscribe((confirmed: boolean) => {
      expect(confirmed).toBeFalse();
      expect(mockComponent.abortScan).not.toHaveBeenCalled();
      done();
    });

    afterClosedSubject.next(false);
    afterClosedSubject.complete();
  });
});
