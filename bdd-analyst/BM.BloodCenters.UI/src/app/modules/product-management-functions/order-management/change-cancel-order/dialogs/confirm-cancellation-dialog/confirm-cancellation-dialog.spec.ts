import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmCancellationDialogComponent } from './confirm-cancellation-dialog';

describe('ConfirmCancellationDialogComponent', () => {
  let component: ConfirmCancellationDialogComponent;
  let fixture: ComponentFixture<ConfirmCancellationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmCancellationDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        ConfirmCancellationDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmCancellationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should close with false on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close with true on confirm', () => {
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
