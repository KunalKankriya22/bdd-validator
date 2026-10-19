import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { performVisualAuditGuard } from './perform-visual-audit.guard';
import { PerformVisualAuditComponent } from './perform-visual-audit';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('performVisualAuditGuard', () => {
  let matDialog: jasmine.SpyObj<MatDialog>;
  let mockComponent: jasmine.SpyObj<PerformVisualAuditComponent>;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      performVisualAuditGuard(mockComponent, {} as any, {} as any, {} as any)
    );

  beforeEach(() => {
    matDialog = createMockMatDialog();
    mockComponent = jasmine.createSpyObj('PerformVisualAuditComponent', ['canDeactivate']);

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
