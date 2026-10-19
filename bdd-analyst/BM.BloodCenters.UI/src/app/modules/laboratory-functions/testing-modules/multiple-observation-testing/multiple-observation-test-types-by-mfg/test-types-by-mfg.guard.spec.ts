import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { testTypesByMfgGuard } from './test-types-by-mfg.guard';
import { MultipleObservationTestTypesByMfgComponent } from './multiple-observation-test-types-by-mfg.component';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('testTypesByMfgGuard', () => {
  let matDialog: jasmine.SpyObj<MatDialog>;
  let mockComponent: jasmine.SpyObj<MultipleObservationTestTypesByMfgComponent>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      testTypesByMfgGuard(mockComponent, {} as any, {} as any, {} as any)
    );

  beforeEach(() => {
    matDialog = createMockMatDialog();
    mockComponent = jasmine.createSpyObj('MultipleObservationTestTypesByMfgComponent', ['canDeactivate']);

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
        message: 'You have unsaved changes. Are you sure you want to leave this page?',
        confirmText: 'LEAVE PAGE',
        cancelText: 'STAY',
      },
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
