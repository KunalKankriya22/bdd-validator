import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteConfirmationWithNotesDialogComponent, DeleteConfirmationWithNotesDialogData } from './delete-confirmation-with-notes-dialog.component';

describe('DeleteConfirmationWithNotesDialogComponent', () => {
  let component: DeleteConfirmationWithNotesDialogComponent;
  let fixture: ComponentFixture<DeleteConfirmationWithNotesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeleteConfirmationWithNotesDialogComponent>>;

  const mockDialogData: DeleteConfirmationWithNotesDialogData = {
    title: 'Test Title',
    message: 'Test Message',
    noteLabel: 'Test Note Label',
    noteMaxLength: 240,
    notePlaceholder: 'Test Placeholder',
    confirmText: 'ACCEPT',
    cancelText: 'CANCEL'
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationWithNotesDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationWithNotesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });




  it('should call dialogRef.close with confirmed false on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ confirmed: false });
  });

  it('should call dialogRef.close with confirmed true and note on confirm when valid', () => {
    component.noteControl.setValue('Test deletion reason');
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      confirmed: true,
      note: 'Test deletion reason'
    });
  });

});
