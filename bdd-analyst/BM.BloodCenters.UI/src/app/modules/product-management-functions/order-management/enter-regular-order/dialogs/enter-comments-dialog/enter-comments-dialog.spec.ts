import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  EnterCommentsDialogComponent,
  EnterCommentsDialogData,
} from './enter-comments-dialog';

describe('EnterCommentsDialogComponent', () => {
  let component: EnterCommentsDialogComponent;
  let fixture: ComponentFixture<EnterCommentsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EnterCommentsDialogComponent>>;

  const mockDialogData: EnterCommentsDialogData = {
    notes: '',
  };

  function createComponent(data: EnterCommentsDialogData = mockDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    TestBed.compileComponents();
    fixture = TestBed.createComponent(EnterCommentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EnterCommentsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterCommentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component creation ───────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Initial state ───────────────────────────────────────────────

  describe('initial state', () => {
    it('should initialize commentsForm with empty notes when dialog data has empty notes', () => {
      expect(component.commentsForm.get('notes')?.value).toBe('');
    });

    it('should initialize commentsForm with existing notes from dialog data', async () => {
      const dataWithNotes: EnterCommentsDialogData = { notes: 'Existing comment' };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [EnterCommentsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNotes },
        ],
      }).compileComponents();

      const localFixture = TestBed.createComponent(EnterCommentsDialogComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      expect(localComponent.commentsForm.get('notes')?.value).toBe('Existing comment');
    });

    it('should default notes to empty string when dialog data notes is undefined', async () => {
      const dataNoNotes: EnterCommentsDialogData = {};

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [EnterCommentsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: dataNoNotes },
        ],
      }).compileComponents();

      const localFixture = TestBed.createComponent(EnterCommentsDialogComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      expect(localComponent.commentsForm.get('notes')?.value).toBe('');
    });

    it('should have a commentsForm with a notes control', () => {
      expect(component.commentsForm.get('notes')).toBeTruthy();
    });
  });

  // ─── Template / DOM ───────────────────────────────────────────────

  describe('template', () => {
    it('should display "Enter Comments" as the dialog header', () => {
      const headerEl = fixture.nativeElement.querySelector('.dialog-header h2');
      expect(headerEl).toBeTruthy();
      expect(headerEl.textContent).toContain('Enter Comments');
    });

    it('should have a textarea bound to notes control', () => {
      const textarea = fixture.nativeElement.querySelector('textarea[formControlName="notes"]');
      expect(textarea).toBeTruthy();
    });

    it('should have textarea with 8 rows', () => {
      const textarea = fixture.nativeElement.querySelector('textarea[formControlName="notes"]');
      expect(textarea.getAttribute('rows')).toBe('8');
    });

    it('should have a CANCEL button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelBtn = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'CANCEL'
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('should have a SAVE button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveBtn = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'SAVE'
      );
      expect(saveBtn).toBeTruthy();
    });
  });

  // ─── onSave ───────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should close dialog with notes value on save', () => {
      component.commentsForm.get('notes')?.setValue('Test note');
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('Test note');
    });

    it('should close dialog with empty string when notes is empty', () => {
      component.commentsForm.get('notes')?.setValue('');
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('');
    });

    it('should close dialog exactly once on save', () => {
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── onCancel ─────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should close dialog with null on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should close dialog exactly once on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });
});
