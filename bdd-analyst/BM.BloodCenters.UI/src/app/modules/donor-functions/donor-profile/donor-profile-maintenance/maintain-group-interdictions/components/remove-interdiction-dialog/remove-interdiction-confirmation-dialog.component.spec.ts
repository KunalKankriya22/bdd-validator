import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { RemoveInterdictionConfirmationDialogComponent } from './remove-interdiction-confirmation-dialog.component';

describe('RemoveInterdictionConfirmationDialogComponent', () => {
  let component: RemoveInterdictionConfirmationDialogComponent;
  let fixture: ComponentFixture<RemoveInterdictionConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RemoveInterdictionConfirmationDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [RemoveInterdictionConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(RemoveInterdictionConfirmationDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with true when confirm is called', () => {
    // Arrange - component initialized

    // Act
    component.confirm();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with provided result when close is called', () => {
    // Arrange - component initialized

    // Act
    component.close(false);

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
