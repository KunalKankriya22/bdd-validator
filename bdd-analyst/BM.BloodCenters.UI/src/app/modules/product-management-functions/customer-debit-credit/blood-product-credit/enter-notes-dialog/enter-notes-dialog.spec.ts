import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EnterNotesDialog, EnterNotesDialogData } from './enter-notes-dialog';

describe('EnterNotesDialog', () => {
  let component: EnterNotesDialog;
  let fixture: ComponentFixture<EnterNotesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EnterNotesDialog>>;

  function setup(data: EnterNotesDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [EnterNotesDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(EnterNotesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('initialization', () => {
    it('should create with empty note when no existing note', () => {
      setup({ unitId: 'U1' });
      expect(component).toBeTruthy();
      expect(component.noteControl.value).toBe('');
    });

    it('should populate note when existing note is provided', () => {
      setup({ unitId: 'U1', existingNote: 'Previous note' });
      expect(component.noteControl.value).toBe('Previous note');
    });
  });

  describe('isAddDisabled', () => {
    beforeEach(() => setup({ unitId: 'U1' }));

    it('should be true when note is empty', () => {
      component.noteControl.setValue('');
      expect(component.isAddDisabled).toBeTrue();
    });

    it('should be true when note is whitespace only', () => {
      component.noteControl.setValue('   ');
      expect(component.isAddDisabled).toBeTrue();
    });

    it('should be false when note has text', () => {
      component.noteControl.setValue('A valid note');
      expect(component.isAddDisabled).toBeFalse();
    });

    it('should be true when note exceeds 240 characters', () => {
      component.noteControl.setValue('x'.repeat(241));
      expect(component.isAddDisabled).toBeTrue();
    });

    it('should be true when saving is true', () => {
      component.noteControl.setValue('Valid');
      component.saving.set(true);
      expect(component.isAddDisabled).toBeTrue();
    });

    it('should be true when noteControl value is null', () => {
      component.noteControl.setValue(null as any);
      expect(component.isAddDisabled).toBeTrue();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => setup({ unitId: 'U1' }));

    it('should close dialog with null', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('onAdd', () => {
    beforeEach(() => setup({ unitId: 'U1' }));

    it('should close dialog with trimmed note', () => {
      component.noteControl.setValue('  My note  ');
      component.onAdd();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ note: 'My note' });
    });

    it('should not close dialog when note is empty', () => {
      component.noteControl.setValue('');
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when note is whitespace', () => {
      component.noteControl.setValue('   ');
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when control is invalid', () => {
      component.noteControl.setValue('x'.repeat(241));
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when value is null', () => {
      component.noteControl.clearValidators();
      component.noteControl.updateValueAndValidity();
      component.noteControl.setValue(null as any);
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
