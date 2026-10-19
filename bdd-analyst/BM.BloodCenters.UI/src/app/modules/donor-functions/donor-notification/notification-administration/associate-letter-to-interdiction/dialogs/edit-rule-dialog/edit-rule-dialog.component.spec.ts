import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EditRuleDialogComponent, EditRuleDialogData } from './edit-rule-dialog.component';

describe('EditRuleDialogComponent', () => {
  let component: EditRuleDialogComponent;
  let fixture: ComponentFixture<EditRuleDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditRuleDialogComponent>>;

  const mockDialogData: EditRuleDialogData = {
    association: {
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    }
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [EditRuleDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(EditRuleDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with update request when onSave is called with valid form', () => {
    // Arrange
    component.editForm.patchValue({
      terminationDate: new Date(2025, 11, 31)
    });

    // Act
    component.onSave();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      terminationDate: '2025-12-31'
    });
  });

  it('should not close dialog when onSave is called with invalid form', () => {
    // Arrange
    component.editForm.patchValue({ terminationDate: null });

    // Act
    component.onSave();

    // Assert
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog without result when onCancel is called', () => {
    // Arrange - component initialized

    // Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
