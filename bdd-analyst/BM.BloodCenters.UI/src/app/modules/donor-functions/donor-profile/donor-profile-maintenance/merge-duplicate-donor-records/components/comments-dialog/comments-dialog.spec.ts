import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { CommentsDialog } from './comments-dialog';

describe('CommentsDialog', () => {
  let component: CommentsDialog;
  let fixture: ComponentFixture<CommentsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommentsDialog,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with empty note', () => {
    expect(component.noteControl.value).toBe('');
  });

  it('should set note from input', () => {
    component.note = 'Test note';
    expect(component.noteControl.value).toBe('Test note');
  });

  it('should handle null note input', () => {
    component.note = null as any;
    expect(component.noteControl.value).toBe('');
  });

  it('should have footer buttons configured', () => {
    expect(component.footerButtons.length).toBe(2);
    expect(component.footerButtons[0].label).toBe('CANCEL');
    expect(component.footerButtons[1].label).toBe('SAVE');
  });

  it('should emit saveNote on save action', () => {
    const saveSpy = spyOn(component.saveNote, 'emit');
    component.noteControl.setValue('My note');
    component.onButtonClick('save');
    expect(saveSpy).toHaveBeenCalledWith('My note');
  });

  it('should trim note value on save', () => {
    const saveSpy = spyOn(component.saveNote, 'emit');
    component.noteControl.setValue('  trimmed  ');
    component.onButtonClick('save');
    expect(saveSpy).toHaveBeenCalledWith('trimmed');
  });

  it('should emit empty string when note is null on save', () => {
    const saveSpy = spyOn(component.saveNote, 'emit');
    component.noteControl.setValue(null);
    component.onButtonClick('save');
    expect(saveSpy).toHaveBeenCalledWith('');
  });

  it('should emit closePanel on cancel action', () => {
    const closeSpy = spyOn(component.closePanel, 'emit');
    component.onButtonClick('cancel');
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should emit closePanel on close', () => {
    const closeSpy = spyOn(component.closePanel, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });
});
