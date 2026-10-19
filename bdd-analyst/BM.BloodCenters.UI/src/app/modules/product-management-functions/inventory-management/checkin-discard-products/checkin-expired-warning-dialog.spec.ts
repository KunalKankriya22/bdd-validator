import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CheckinExpiredWarningDialog } from './checkin-expired-warning-dialog';

describe('CheckinExpiredWarningDialog', () => {
  let component: CheckinExpiredWarningDialog;
  let fixture: ComponentFixture<CheckinExpiredWarningDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CheckinExpiredWarningDialog>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CheckinExpiredWarningDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef }
      ]
    });

    fixture = TestBed.createComponent(CheckinExpiredWarningDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with false when onNo is called', () => {
    component.onNo();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when onYes is called', () => {
    component.onYes();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });
});
