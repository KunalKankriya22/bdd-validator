import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

describe('DeleteConfirmationDialog', () => {
  let component: DeleteConfirmationDialog;
  let fixture: ComponentFixture<DeleteConfirmationDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeleteConfirmationDialog>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [DeleteConfirmationDialog, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { setId: 42 } },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(DeleteConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have setId from injected data', () => {
    expect(component.data.setId).toBe(42);
  });

  it('should close dialog with false on onNo', () => {
    component.onNo();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true on onYes', () => {
    component.onYes();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
