import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PrintTransferSlipDialogComponent } from './print-transfer-slip-dialog';

describe('PrintTransferSlipDialogComponent', () => {
  let component: PrintTransferSlipDialogComponent;
  let fixture: ComponentFixture<PrintTransferSlipDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PrintTransferSlipDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [PrintTransferSlipDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintTransferSlipDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with false when onNo is called', () => {
    component.onNo();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true when onYes is called', () => {
    component.onYes();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
