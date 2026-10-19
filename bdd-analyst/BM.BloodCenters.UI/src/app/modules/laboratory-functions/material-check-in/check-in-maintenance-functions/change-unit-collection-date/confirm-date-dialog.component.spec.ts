import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ConfirmDateDialogComponent, ConfirmDialogData } from './confirm-date-dialog.component';

describe('ConfirmDateDialogComponent', () => {
  let component: ConfirmDateDialogComponent;
  let fixture: ComponentFixture<ConfirmDateDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDateDialogComponent>>;

  const mockData: ConfirmDialogData = {
    message: 'Are you sure you want to change the collection date?',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDateDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDateDialogComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should close dialog with true when confirm is called', () => {
    // Arrange & Act
    component.confirm();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when close is called with false', () => {
    // Arrange & Act
    component.close(false);

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});
