import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EnterNotesDialogComponent } from './enter-notes-dialog';

describe('EnterNotesDialogComponent', () => {
  let component: EnterNotesDialogComponent;
  let fixture: ComponentFixture<EnterNotesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EnterNotesDialogComponent>>;

  function createComponent(data: any = null): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [EnterNotesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).overrideComponent(EnterNotesDialogComponent, {
      set: {
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: data }
        ]
      }
    });

    fixture = TestBed.createComponent(EnterNotesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('initialization', () => {
    it('should create with empty noteText when no data provided', () => {
      createComponent(null);
      expect(component).toBeTruthy();
      expect(component.noteText).toBe('');
    });

    it('should initialize noteText from dialog data', () => {
      createComponent({ noteText: 'Existing note' });
      expect(component.noteText).toBe('Existing note');
    });

    it('should default to empty string when data has no noteText', () => {
      createComponent({});
      expect(component.noteText).toBe('');
    });
  });

  describe('canAdd', () => {
    beforeEach(() => createComponent(null));

    it('should return false when noteText is empty', () => {
      component.noteText = '';
      expect(component.canAdd).toBeFalse();
    });

    it('should return false when noteText is only whitespace', () => {
      component.noteText = '   ';
      expect(component.canAdd).toBeFalse();
    });

    it('should return true when noteText has content', () => {
      component.noteText = 'Some note';
      expect(component.canAdd).toBeTrue();
    });

    it('should return true when noteText has content with surrounding spaces', () => {
      component.noteText = '  note  ';
      expect(component.canAdd).toBeTrue();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => createComponent(null));

    it('should close dialog with null', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('onAdd', () => {
    beforeEach(() => createComponent(null));

    it('should close dialog with trimmed noteText when canAdd is true', () => {
      component.noteText = '  Test note  ';
      component.onAdd();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('Test note');
    });

    it('should not close dialog when canAdd is false', () => {
      component.noteText = '';
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when noteText is only whitespace', () => {
      component.noteText = '   ';
      component.onAdd();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
