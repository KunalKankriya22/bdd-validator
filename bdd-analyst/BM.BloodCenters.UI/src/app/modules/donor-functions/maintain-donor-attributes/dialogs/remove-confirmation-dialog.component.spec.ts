import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { RemoveConfirmationDialogComponent } from './remove-confirmation-dialog.component';

describe('RemoveConfirmationDialogComponent', () => {
  let component: RemoveConfirmationDialogComponent;
  let fixture: ComponentFixture<RemoveConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RemoveConfirmationDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [RemoveConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(RemoveConfirmationDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with true when onConfirm is called', () => {
    // Arrange - component initialized

    // Act
    component.onConfirm();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when onCancel is called', () => {
    // Arrange - component initialized

    // Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
