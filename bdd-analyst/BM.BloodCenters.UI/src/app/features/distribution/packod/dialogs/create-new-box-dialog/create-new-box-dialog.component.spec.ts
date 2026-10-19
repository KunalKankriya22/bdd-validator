import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  CreateNewBoxDialogComponent,
  CreateNewBoxDialogData,
  CreateNewBoxDialogResult
} from './create-new-box-dialog.component';

describe('CreateNewBoxDialogComponent', () => {
  let component: CreateNewBoxDialogComponent;
  let fixture: ComponentFixture<CreateNewBoxDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateNewBoxDialogComponent>>;

  const mockDialogData: CreateNewBoxDialogData = {
    currentBoxId: 'BOX0001234'
  };

  function createComponent(data: CreateNewBoxDialogData = mockDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [CreateNewBoxDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(CreateNewBoxDialogComponent);
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
      expect(component.data.currentBoxId).toBe('BOX0001234');
    });

    it('should initialize closeCurrentBox as null', () => {
      expect((component as any).closeCurrentBox).toBeNull();
    });

    it('should initialize allProductsPacked as null', () => {
      expect((component as any).allProductsPacked).toBeNull();
    });
  });

  describe('Dialog Display', () => {
    beforeEach(() => createComponent());

    it('should display "Create New Box" as dialog title', () => {
      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Create New Box');
    });

    it('should display "Close Current Box?" question', () => {
      const labels = fixture.debugElement.queryAll(By.css('.question-label'));
      expect(labels[0].nativeElement.textContent.trim()).toBe('Close Current Box?');
    });

    it('should display "All products properly packed?" question', () => {
      const labels = fixture.debugElement.queryAll(By.css('.question-label'));
      expect(labels[1].nativeElement.textContent.trim()).toBe('All products properly packed?');
    });

    it('should have two radio groups', () => {
      const radioGroups = fixture.debugElement.queryAll(By.css('mat-radio-group'));
      expect(radioGroups.length).toBe(2);
    });
  });

  describe('canConfirm', () => {
    beforeEach(() => createComponent());

    it('should return false when both selections are null', () => {
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

    it('should return true when both selections are made (false/true)', () => {
      (component as any).closeCurrentBox = false;
      (component as any).allProductsPacked = true;
      expect(component.canConfirm).toBeTrue();
    });
  });

  describe('onConfirm', () => {
    beforeEach(() => createComponent());

    it('should not call dialogRef.close when canConfirm is false', () => {
      component.onConfirm();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should call dialogRef.close with correct result when both values are true', () => {
      (component as any).closeCurrentBox = true;
      (component as any).allProductsPacked = true;
      component.onConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: true,
        allProductsProperlyPacked: true
      } as CreateNewBoxDialogResult);
    });

    it('should call dialogRef.close with correct result when values are mixed', () => {
      (component as any).closeCurrentBox = false;
      (component as any).allProductsPacked = true;
      component.onConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        closeCurrentBox: false,
        allProductsProperlyPacked: true
      } as CreateNewBoxDialogResult);
    });
  });

  describe('onCancel', () => {
    beforeEach(() => createComponent());

    it('should call dialogRef.close with confirmed false result', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: false,
        closeCurrentBox: false,
        allProductsProperlyPacked: false
      });
    });
  });

  describe('Dialog Actions', () => {
    beforeEach(() => createComponent());

    it('should have CANCEL button', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-btn'));
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.nativeElement.textContent.trim()).toBe('CANCEL');
    });

    it('should have CREATE NEW button', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-btn'));
      expect(confirmButton).toBeTruthy();
      expect(confirmButton.nativeElement.textContent.trim()).toBe('CREATE NEW');
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

  describe('Null currentBoxId', () => {
    it('should handle null currentBoxId in dialog data', () => {
      createComponent({ currentBoxId: null } as any);
      expect(component).toBeTruthy();
      expect(component.data.currentBoxId).toBeNull();
    });
  });
});
