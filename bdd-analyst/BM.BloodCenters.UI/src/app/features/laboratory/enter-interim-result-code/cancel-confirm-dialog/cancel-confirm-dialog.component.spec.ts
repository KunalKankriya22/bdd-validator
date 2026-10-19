import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { CancelConfirmDialogComponent } from './cancel-confirm-dialog.component';

describe('CancelConfirmDialogComponent', () => {
  let component: CancelConfirmDialogComponent;
  let fixture: ComponentFixture<CancelConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CancelConfirmDialogComponent>>;

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CancelConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(CancelConfirmDialogComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Confirm Yes', () => {
    it('should close dialog with true when yes is clicked', () => {
      component.onYes();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should call close exactly once', () => {
      component.onYes();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confirm No', () => {
    it('should close dialog with false when no is clicked', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should call close exactly once', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sequential calls', () => {
    it('should handle yes then no calls', () => {
      component.onYes();
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(2);
      expect(dialogRefSpy.close.calls.argsFor(0)).toEqual([true]);
      expect(dialogRefSpy.close.calls.argsFor(1)).toEqual([false]);
    });
  });
});
