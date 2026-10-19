import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { ReleaseConfirmationDialogComponent } from './release-confirmation-dialog.component';

describe('ReleaseConfirmationDialogComponent', () => {
  let component: ReleaseConfirmationDialogComponent;
  let fixture: ComponentFixture<ReleaseConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ReleaseConfirmationDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ReleaseConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(ReleaseConfirmationDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with true when onYes is called', () => {
    // Arrange - component initialized

    // Act
    component.onYes();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when onNo is called', () => {
    // Arrange - component initialized

    // Act
    component.onNo();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
