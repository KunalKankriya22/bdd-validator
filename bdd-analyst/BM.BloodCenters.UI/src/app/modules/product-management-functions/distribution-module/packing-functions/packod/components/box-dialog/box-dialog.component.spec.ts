import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PackodBoxDialogComponent, BoxDialogData, BoxDialogResult } from './box-dialog.component';

describe('PackodBoxDialogComponent', () => {
  let component: PackodBoxDialogComponent;
  let fixture: ComponentFixture<PackodBoxDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PackodBoxDialogComponent>>;

  const createComponent = (data: BoxDialogData = { title: 'Close Box', boxId: 'BOX001' }) => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [PackodBoxDialogComponent, NoopAnimationsModule, FormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(PackodBoxDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  };

  describe('Initial State', () => {
    beforeEach(() => createComponent());

    it('should have null initial values', () => {
      expect(component.closeCurrentValue).toBeNull();
      expect(component.allPackedValue).toBeNull();
    });

    it('should not allow confirm initially', () => {
      expect(component.canConfirm).toBeFalse();
    });

    it('should not show warning initially', () => {
      expect(component.showWarning).toBeFalse();
    });
  });

  describe('Close Current = Yes', () => {
    beforeEach(() => createComponent());

    it('should show warning when close=Yes but packed=No', () => {
      component.onCloseCurrentChange(true);
      component.onAllPackedChange(false);
      expect(component.showWarning).toBeTrue();
      expect(component.canConfirm).toBeFalse();
    });

    it('should allow confirm when close=Yes and packed=Yes', () => {
      component.onCloseCurrentChange(true);
      component.onAllPackedChange(true);
      expect(component.showWarning).toBeFalse();
      expect(component.canConfirm).toBeTrue();
    });

    it('should not allow confirm when close=Yes and packed=null', () => {
      component.onCloseCurrentChange(true);
      expect(component.canConfirm).toBeFalse();
    });
  });

  describe('Close Current = No', () => {
    beforeEach(() => createComponent());

    it('should allow confirm regardless of packed value', () => {
      component.onCloseCurrentChange(false);
      expect(component.canConfirm).toBeTrue();
    });

    it('should not show warning when close=No and packed=No', () => {
      component.onCloseCurrentChange(false);
      component.onAllPackedChange(false);
      expect(component.showWarning).toBeFalse();
    });

    it('should allow confirm when close=No and packed=No', () => {
      component.onCloseCurrentChange(false);
      component.onAllPackedChange(false);
      expect(component.canConfirm).toBeTrue();
    });
  });

  describe('Dialog Actions', () => {
    beforeEach(() => createComponent());

    it('should close with null on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should close with result on confirm (close=Yes, packed=Yes)', () => {
      component.onCloseCurrentChange(true);
      component.onAllPackedChange(true);
      component.onConfirm();

      const result = dialogRefSpy.close.calls.mostRecent().args[0] as BoxDialogResult;
      expect(result.confirmed).toBeTrue();
      expect(result.closeCurrent).toBeTrue();
      expect(result.allProperlyPacked).toBeTrue();
    });

    it('should close with closeCurrent=false result', () => {
      component.onCloseCurrentChange(false);
      component.onConfirm();

      const result = dialogRefSpy.close.calls.mostRecent().args[0] as BoxDialogResult;
      expect(result.confirmed).toBeTrue();
      expect(result.closeCurrent).toBeFalse();
      expect(result.allProperlyPacked).toBeFalse();
    });
  });

  describe('Dialog Data', () => {
    it('should receive Close Box title', () => {
      createComponent({ title: 'Close Box', boxId: 'BOX001' });
      expect(component.data.title).toBe('Close Box');
      expect(component.data.boxId).toBe('BOX001');
    });

    it('should receive Create New Box title', () => {
      createComponent({ title: 'Create New Box', boxId: 'BOX002' });
      expect(component.data.title).toBe('Create New Box');
    });
  });

  describe('State Transitions', () => {
    beforeEach(() => createComponent());

    it('should update state when switching from Yes to No on close', () => {
      component.onCloseCurrentChange(true);
      component.onAllPackedChange(false);
      expect(component.showWarning).toBeTrue();
      expect(component.canConfirm).toBeFalse();

      component.onCloseCurrentChange(false);
      expect(component.showWarning).toBeFalse();
      expect(component.canConfirm).toBeTrue();
    });

    it('should update state when switching packed from No to Yes', () => {
      component.onCloseCurrentChange(true);
      component.onAllPackedChange(false);
      expect(component.canConfirm).toBeFalse();

      component.onAllPackedChange(true);
      expect(component.canConfirm).toBeTrue();
      expect(component.showWarning).toBeFalse();
    });
  });
});
