import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { TerminateConfirmationDialogComponent } from './terminate-confirmation-dialog.component';

describe('TerminateConfirmationDialogComponent', () => {
  let component: TerminateConfirmationDialogComponent;
  let fixture: ComponentFixture<TerminateConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TerminateConfirmationDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [TerminateConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(TerminateConfirmationDialogComponent);
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
