import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { EnterCommentsDialog } from './enter-comments-dialog';
import { CommentsDialogData } from '../models/lookup-donor-card.model';

describe('EnterCommentsDialog', () => {
  let component: EnterCommentsDialog;
  let fixture: ComponentFixture<EnterCommentsDialog>;
  let mockDialogRef: jest.Mocked<MatDialogRef<EnterCommentsDialog>>;

  const mockDialogData: CommentsDialogData = {
    donorId: 'D001',
  };

  beforeEach(async () => {
    mockDialogRef = { close: jest.fn() } as any;

    await TestBed.configureTestingModule({
      imports: [EnterCommentsDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterCommentsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty notes control', () => {
    expect(component.notesControl.value).toBe('');
  });

  it('should initialize existingNotes as empty array', () => {
    expect(component.existingNotes()).toEqual([]);
  });

  it('should close dialog on onCancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should not save when note is empty', () => {
    component.notesControl.setValue('');
    component.onSave();
    expect(component.isSaving()).toBe(false);
  });

  it('should not save when note is only whitespace', () => {
    component.notesControl.setValue('   ');
    component.onSave();
    expect(component.isSaving()).toBe(false);
  });
});
