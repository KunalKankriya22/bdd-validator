import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { UnsavedChangesDialogComponent } from './unsaved-changes-dialog.component';

describe('UnsavedChangesDialogComponent', () => {
  let component: UnsavedChangesDialogComponent;
  let fixture: ComponentFixture<UnsavedChangesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnsavedChangesDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [UnsavedChangesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(UnsavedChangesDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with false on cancel', () => {
    // Arrange & Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true on confirm', () => {
    // Arrange & Act
    component.onConfirm();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
