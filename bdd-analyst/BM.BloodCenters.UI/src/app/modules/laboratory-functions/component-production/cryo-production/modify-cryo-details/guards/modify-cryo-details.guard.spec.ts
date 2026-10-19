import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { modifyCryoDetailsGuard } from './modify-cryo-details.guard';
import { ModifyCryoDetailsComponent } from '../modify-cryo-details.component';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

describe('modifyCryoDetailsGuard', () => {
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: mockDialog },
      ],
    });
  });

  it('should allow navigation when canDeactivate returns true', () => {
    const mockComponent = { canDeactivate: () => true } as any;
    const result = TestBed.runInInjectionContext(() =>
      modifyCryoDetailsGuard(mockComponent, {} as any, {} as any, {} as any)
    );
    expect(result).toBeTrue();
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('should open confirmation dialog when canDeactivate returns false', () => {
    const mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
    mockDialog.open.and.returnValue(mockDialogRef);

    const mockComponent = { canDeactivate: () => false } as any;
    TestBed.runInInjectionContext(() =>
      modifyCryoDetailsGuard(mockComponent, {} as any, {} as any, {} as any)
    );

    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmActionDialogComponent, {
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

  it('should allow navigation when user confirms leave', (done) => {
    const mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
    mockDialog.open.and.returnValue(mockDialogRef);

    const mockComponent = { canDeactivate: () => false } as any;
    const result = TestBed.runInInjectionContext(() =>
      modifyCryoDetailsGuard(mockComponent, {} as any, {} as any, {} as any)
    );

    (result as any).subscribe((value: boolean) => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('should block navigation when user cancels', (done) => {
    const mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<any>;
    mockDialog.open.and.returnValue(mockDialogRef);

    const mockComponent = { canDeactivate: () => false } as any;
    const result = TestBed.runInInjectionContext(() =>
      modifyCryoDetailsGuard(mockComponent, {} as any, {} as any, {} as any)
    );

    (result as any).subscribe((value: boolean) => {
      expect(value).toBeFalse();
      done();
    });
  });
});
