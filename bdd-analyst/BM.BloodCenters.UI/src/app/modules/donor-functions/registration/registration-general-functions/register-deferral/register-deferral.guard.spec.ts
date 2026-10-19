import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { registerDeferralGuard } from './register-deferral.guard';
import { RegisterDeferralComponent } from './register-deferral';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('registerDeferralGuard', () => {
  let matDialog: jasmine.SpyObj<MatDialog>;
  let mockComponent: jasmine.SpyObj<RegisterDeferralComponent>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      registerDeferralGuard(mockComponent, {} as any, {} as any, {} as any)
    );

  beforeEach(() => {
    matDialog = createMockMatDialog();
    mockComponent = jasmine.createSpyObj('RegisterDeferralComponent', ['canDeactivate']);

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
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'YES, LEAVE',
        cancelText: 'STAY'
      }
    });
  });

  it('should return observable from dialog afterClosed when canDeactivate is false', (done) => {
    mockComponent.canDeactivate.and.returnValue(false);
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    const result = runGuard() as any;
    result.subscribe((confirmed: boolean) => {
      expect(confirmed).toBeTrue();
      done();
    });

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
  });
});
