import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PriorityConfirmationDialog, PriorityConfirmationData } from './priority-confirmation-dialog';

describe('PriorityConfirmationDialog', () => {
  let component: PriorityConfirmationDialog;
  let fixture: ComponentFixture<PriorityConfirmationDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PriorityConfirmationDialog>>;

  const mockData: PriorityConfirmationData = {
    prioritySeq: 1,
    barcodeValue: 'BC001',
    productType: 'PT001',
    mode: 'add'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        PriorityConfirmationDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PriorityConfirmationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Confirm Button Label', () => {
    it('should return CONFIRM & ADD for add mode', () => {
      expect(component.confirmButtonLabel).toBe('CONFIRM & ADD');
    });

    it('should return CONFIRM & SAVE for edit mode', () => {
      component.data = { ...mockData, mode: 'edit' };
      expect(component.confirmButtonLabel).toBe('CONFIRM & SAVE');
    });
  });
  describe('Data Binding', () => {
    it('should have access to dialog data', () => {
      expect(component.data.prioritySeq).toBe(1);
      expect(component.data.barcodeValue).toBe('BC001');
      expect(component.data.productType).toBe('PT001');
    });
  });
});