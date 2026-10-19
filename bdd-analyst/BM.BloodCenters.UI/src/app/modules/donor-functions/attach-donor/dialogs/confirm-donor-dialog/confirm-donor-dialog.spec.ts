import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDonorDialogComponent, ConfirmDonorDialogData } from './confirm-donor-dialog';

describe('ConfirmDonorDialogComponent', () => {
  let component: ConfirmDonorDialogComponent;
  let fixture: ComponentFixture<ConfirmDonorDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDonorDialogComponent>>;

  const mockData: ConfirmDonorDialogData = {
    donorId: 'DON0000087',
    donorName: 'Marvin Thompson'
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDonorDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDonorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data injected', () => {
    expect(component.data.donorId).toBe('DON0000087');
    expect(component.data.donorName).toBe('Marvin Thompson');
  });

  it('should generate unique element IDs', () => {
    const id = component['elementId']('test');
    expect(id).toContain('confirm-donor-dialog-');
    expect(id).toContain('-test');
  });

  describe('onNo', () => {
    it('should close dialog with "no" result', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('no');
    });
  });

  describe('onRightDonor', () => {
    it('should close dialog with "right-donor" result', () => {
      component.onRightDonor();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('right-donor');
    });
  });
});
