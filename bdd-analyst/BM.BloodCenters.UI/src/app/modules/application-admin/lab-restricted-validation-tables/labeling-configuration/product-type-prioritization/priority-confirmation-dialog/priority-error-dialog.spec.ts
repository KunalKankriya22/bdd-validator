import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PriorityErrorDialog } from './priority-error-dialog';

describe('PriorityErrorDialog', () => {
  let component: PriorityErrorDialog;
  let fixture: ComponentFixture<PriorityErrorDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PriorityErrorDialog>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        PriorityErrorDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PriorityErrorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Dialog Actions', () => {

    it('should close dialog with proceed result on proceed', () => {
      component.onProceed();

      expect(mockDialogRef.close).toHaveBeenCalledWith('proceed');
    });
  });
});
