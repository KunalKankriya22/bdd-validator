import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  CloseBoxConfirmationDialogComponent,
  CloseBoxConfirmationDialogData,
  CloseBoxConfirmationDialogResult
} from './close-box-confirmation-dialog.component';

describe('CloseBoxConfirmationDialogComponent', () => {
  let component: CloseBoxConfirmationDialogComponent;
  let fixture: ComponentFixture<CloseBoxConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CloseBoxConfirmationDialogComponent>>;

  const mockDialogData: CloseBoxConfirmationDialogData = {
    boxId: 'BOX0001234',
    productCount: 15
  };

  function createComponent(data: CloseBoxConfirmationDialogData = mockDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CloseBoxConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(CloseBoxConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Component Initialization', () => {
    beforeEach(() => createComponent());

    it('should load dialog data', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.boxId).toBe('BOX0001234');
      expect(component.data.productCount).toBe(15);
    });

    it('should initialize with null radio selections', () => {
      expect((component as any).closeCurrentBox).toBeNull();
      expect((component as any).allProductsPacked).toBeNull();
    });

    it('should not be confirmable initially', () => {
      expect(component.canConfirm).toBeFalse();
    });
  });

  describe('Dialog Display', () => {
    beforeEach(() => createComponent());

    it('should display "Close Current Box?" question', () => {
      const labels = fixture.debugElement.queryAll(By.css('.question-label'));
      expect(labels.length).toBeGreaterThanOrEqual(1);
      expect(labels[0].nativeElement.textContent.trim()).toBe('Close Current Box?');
    });

    it('should have two radio groups', () => {
      const radioGroups = fixture.debugElement.queryAll(By.css('mat-radio-group'));
      expect(radioGroups.length).toBe(2);
    });

    it('should have Yes/No radio buttons in each group', () => {
      const radioButtons = fixture.debugElement.queryAll(By.css('mat-radio-button'));
      expect(radioButtons.length).toBe(4);
    });
  });

  describe('canConfirm Getter', () => {
    beforeEach(() => createComponent());

    it('should return false when no selections made', () => {
      expect(component.canConfirm).toBeFalse();
    });

    it('should return false when only closeCurrentBox is selected', () => {
      (component as any).closeCurrentBox = true;
      expect(component.canConfirm).toBeFalse();
    });

    it('should return false when only allProductsPacked is selected', () => {
      (component as any).allProductsPacked = true;
      expect(component.canConfirm).toBeFalse();
    });

    it('should return true when both selections are made (true/true)', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = true;
      expect(component.canConfirm).toBeTrue();
    });

    it('should return true when both selections are made (false/false)', () => {
      (component as any).closeCurrentBox = false;
      (component as any).allProductsPacked = false;
      expect(component.canConfirm).toBeTrue();
    });

    it('should return true when both selections are made (true/false)', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = false;
      expect(component.canConfirm).toBeTrue();
    });
  });

  describe('Dialog Actions', () => {
    beforeEach(() => createComponent());

    it('should have CANCEL button', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-btn'));
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.nativeElement.textContent.trim()).toBe('CANCEL');
    });

    it('should have CLOSE BOX button', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-btn'));
      expect(confirmButton).toBeTruthy();
      expect(confirmButton.nativeElement.textContent.trim()).toBe('CLOSE BOX');
    });
  });

  describe('Confirm with Different Selections', () => {
    beforeEach(() => createComponent());

    it('should pass closeCurrentBox=false in result', () => {
      (component as any).closeCurrentBox = false;
      (component as any).allProductsPacked = true;

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: false,
        allProductsProperlyPacked: true
      } as CloseBoxConfirmationDialogResult);
    });

    it('should pass allProductsProperlyPacked=false in result', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = false;

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: true,
        allProductsProperlyPacked: false
      } as CloseBoxConfirmationDialogResult);
    });

    it('should pass both false in result', () => {
      (component as any).closeCurrentBox = false;
      (component as any).allProductsPacked = false;

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: false,
        allProductsProperlyPacked: false
      } as CloseBoxConfirmationDialogResult);
    });
  });

  describe('onConfirm Guard', () => {
    beforeEach(() => createComponent());

    it('should not close dialog when canConfirm is false', () => {
      component.onConfirm();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when only closeCurrentBox is set', () => {
      (component as any).closeCurrentBox = true;

      component.onConfirm();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should close dialog with correct result when both are true', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = true;

      component.onConfirm();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: true,
        allProductsProperlyPacked: true
      } as CloseBoxConfirmationDialogResult);
    });
  });

  describe('onCancel', () => {
    beforeEach(() => createComponent());

    it('should close dialog with confirmed=false result', () => {
      component.onCancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: false,
        closeCurrentBox: false,
        allProductsProperlyPacked: false
      });
    });

    it('should close dialog with confirmed=false even when selections were made', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = true;

      component.onCancel();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: false,
        closeCurrentBox: false,
        allProductsProperlyPacked: false
      });
    });
  });

  describe('Dialog Title', () => {
    beforeEach(() => createComponent());

    it('should display "Close Box" as dialog title', () => {
      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      expect(title.nativeElement.textContent.trim()).toBe('Close Box');
    });
  });

  describe('Confirm Button Disabled State', () => {
    beforeEach(() => createComponent());

    it('should disable confirm button when canConfirm is false', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-btn'));
      expect(confirmButton.nativeElement.disabled).toBeTrue();
    });

    it('should enable confirm button when canConfirm is true', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = true;
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-btn'));
      expect(confirmButton.nativeElement.disabled).toBeFalse();
    });
  });

  describe('Button Styling', () => {
    beforeEach(() => createComponent());

    it('should have primary color on cancel button', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-btn'));
      expect(cancelButton.attributes['color']).toBe('primary');
    });

    it('should have primary color on confirm button', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-btn'));
      expect(confirmButton.attributes['color']).toBe('primary');
    });
  });

  describe('Different Dialog Data', () => {
    it('should handle zero productCount', () => {
      createComponent({ boxId: 'BOX999', productCount: 0 });
      expect(component.data.productCount).toBe(0);
    });

    it('should handle different boxId', () => {
      createComponent({ boxId: 'BOX_DIFFERENT', productCount: 5 });
      expect(component.data.boxId).toBe('BOX_DIFFERENT');
    });
  });
});
