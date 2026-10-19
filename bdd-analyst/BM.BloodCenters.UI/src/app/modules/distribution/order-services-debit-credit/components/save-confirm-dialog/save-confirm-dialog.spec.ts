import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SaveConfirmDialogComponent, SaveConfirmData } from './save-confirm-dialog';

describe('SaveConfirmDialogComponent', () => {
  let component: SaveConfirmDialogComponent;
  let fixture: ComponentFixture<SaveConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SaveConfirmDialogComponent>>;

  const mockData: SaveConfirmData = {
    tranTypeLabel: 'Credited',
    customerName: 'Test Customer'
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SaveConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).overrideComponent(SaveConfirmDialogComponent, {
      set: {
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockData }
        ]
      }
    });

    fixture = TestBed.createComponent(SaveConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have dialog data', () => {
    expect(component.data.tranTypeLabel).toBe('Credited');
    expect(component.data.customerName).toBe('Test Customer');
  });

  describe('onNoCancel', () => {
    it('should close dialog with false', () => {
      component.onNoCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });
  });

  describe('onYesConfirm', () => {
    it('should close dialog with true', () => {
      component.onYesConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });
  });
});
