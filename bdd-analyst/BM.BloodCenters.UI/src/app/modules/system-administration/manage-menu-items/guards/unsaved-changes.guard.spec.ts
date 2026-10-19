import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { UnsavedChangesGuard, CanComponentDeactivate } from './unsaved-changes.guard';
import { UnsavedChangesDialogComponent } from '../unsaved-changes-dialog/unsaved-changes-dialog.component';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('UnsavedChangesGuard', () => {
  let guard: UnsavedChangesGuard;
  let matDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    matDialog = createMockMatDialog();

    TestBed.configureTestingModule({
      providers: [
        UnsavedChangesGuard,
        { provide: MatDialog, useValue: matDialog }
      ]
    });

    guard = TestBed.inject(UnsavedChangesGuard);
  });

  it('should allow deactivation when component has no hasUnsavedChangesCheck method', () => {
    const mockComponent = {} as CanComponentDeactivate;
    const result = guard.canDeactivate(mockComponent);
    expect(result).toBeTrue();
    expect(matDialog.open).not.toHaveBeenCalled();
  });

  it('should allow deactivation when hasUnsavedChangesCheck returns false', () => {
    const mockComponent: CanComponentDeactivate = {
      hasUnsavedChangesCheck: jasmine.createSpy('hasUnsavedChangesCheck').and.returnValue(false)
    };
    const result = guard.canDeactivate(mockComponent);
    expect(result).toBeTrue();
    expect(matDialog.open).not.toHaveBeenCalled();
  });

  it('should open dialog when hasUnsavedChangesCheck returns true', () => {
    const mockComponent: CanComponentDeactivate = {
      hasUnsavedChangesCheck: jasmine.createSpy('hasUnsavedChangesCheck').and.returnValue(true)
    };
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    guard.canDeactivate(mockComponent);

    expect(matDialog.open).toHaveBeenCalledWith(UnsavedChangesDialogComponent, {
      width: '464px',
      height: '192px',
      disableClose: true,
      backdropClass: 'unsaved-changes-backdrop',
      panelClass: 'unsaved-changes-dialog'
    });
  });

  it('should return observable from dialog afterClosed when there are unsaved changes', (done) => {
    const mockComponent: CanComponentDeactivate = {
      hasUnsavedChangesCheck: jasmine.createSpy('hasUnsavedChangesCheck').and.returnValue(true)
    };
    const afterClosedSubject = new Subject<boolean>();
    matDialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>);

    const result = guard.canDeactivate(mockComponent) as any;
    result.subscribe((confirmed: boolean) => {
      expect(confirmed).toBeTrue();
      done();
    });

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
  });
});
