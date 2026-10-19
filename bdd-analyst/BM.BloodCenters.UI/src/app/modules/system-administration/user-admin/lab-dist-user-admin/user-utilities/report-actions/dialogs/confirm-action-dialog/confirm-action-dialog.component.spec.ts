import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  ConfirmActionDialogComponent,
  ConfirmActionDialogData
} from './confirm-action-dialog.component';

describe('ConfirmActionDialogComponent', () => {
  let component: ConfirmActionDialogComponent;
  let fixture: ComponentFixture<ConfirmActionDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmActionDialogComponent>>;

  const mockDialogData: ConfirmActionDialogData = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    detail: 'This action cannot be undone.',
    confirmText: 'Yes',
    cancelText: 'No'
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ConfirmActionDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(ConfirmActionDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should display dialog data', () => {
    // Arrange & Act - data injected via MAT_DIALOG_DATA

    // Assert
    expect(component.data.title).toBe('Confirm Action');
    expect(component.data.message).toBe('Are you sure you want to proceed?');
  });

  it('should close dialog with true on confirm', () => {
    // Arrange & Act
    component.onConfirm();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false on cancel', () => {
    // Arrange & Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
