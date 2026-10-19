import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotesManagerComponent } from './notes-manager';
import { NoteItem, NotesConfig, NoteActionEvent } from './notes-manager.interface';

describe('NotesManagerComponent', () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;

  beforeEach(async () => {
    // Polyfill scrollIntoView for jsdom
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = function () {};
    }

    await TestBed.configureTestingModule({
      imports: [NotesManagerComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(NotesManagerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default input values', () => {
    it('should have an empty notes array by default', () => {
      expect(component.notes).toEqual([]);
    });

    it('should have an empty config object by default', () => {
      expect(component.config).toEqual({});
    });

    it('should have readonly as false by default', () => {
      expect(component.readonly).toBe(false);
    });

    it('should have loading as false by default', () => {
      expect(component.loading).toBe(false);
    });

    it('should have newNoteText as empty string by default', () => {
      expect(component.newNoteText).toBe('');
    });

    it('should have editingNoteId as null by default', () => {
      expect(component.editingNoteId).toBeNull();
    });

    it('should have errorMessage as null by default', () => {
      expect(component.errorMessage).toBeNull();
    });

    it('should have currentUserName as undefined by default', () => {
      expect(component.currentUserName).toBeUndefined();
    });
  });

  describe('effectiveConfig', () => {
    it('should return all defaults when config is empty', () => {
      component.config = {};
      const result = component.effectiveConfig;

      expect(result.placeholder).toBe('Add Notes');
      expect(result.textareaRows).toBe(4);
      expect(result.maxLength).toBe(500);
      expect(result.showUserInfo).toBe(true);
      expect(result.allowEdit).toBe(true);
      expect(result.allowDelete).toBe(true);
      expect(result.emptyStateMessage).toBe('No notes available');
      expect(result.addButtonText).toBe('ADD');
      expect(result.updateButtonText).toBe('UPDATE');
    });

    it('should use provided placeholder value', () => {
      component.config = { placeholder: 'Enter comment' };
      expect(component.effectiveConfig.placeholder).toBe('Enter comment');
    });

    it('should use provided textareaRows value', () => {
      component.config = { textareaRows: 8 };
      expect(component.effectiveConfig.textareaRows).toBe(8);
    });

    it('should use provided maxLength value', () => {
      component.config = { maxLength: 1000 };
      expect(component.effectiveConfig.maxLength).toBe(1000);
    });

    it('should use provided showUserInfo value', () => {
      component.config = { showUserInfo: false };
      expect(component.effectiveConfig.showUserInfo).toBe(false);
    });

    it('should use provided allowEdit value', () => {
      component.config = { allowEdit: false };
      expect(component.effectiveConfig.allowEdit).toBe(false);
    });

    it('should use provided allowDelete value', () => {
      component.config = { allowDelete: false };
      expect(component.effectiveConfig.allowDelete).toBe(false);
    });

    it('should use provided emptyStateMessage value', () => {
      component.config = { emptyStateMessage: 'Nothing here' };
      expect(component.effectiveConfig.emptyStateMessage).toBe('Nothing here');
    });

    it('should use provided addButtonText value', () => {
      component.config = { addButtonText: 'SAVE' };
      expect(component.effectiveConfig.addButtonText).toBe('SAVE');
    });

    it('should use provided updateButtonText value', () => {
      component.config = { updateButtonText: 'MODIFY' };
      expect(component.effectiveConfig.updateButtonText).toBe('MODIFY');
    });

    it('should merge partial config with defaults', () => {
      component.config = { placeholder: 'Custom', maxLength: 200 };
      const result = component.effectiveConfig;

      expect(result.placeholder).toBe('Custom');
      expect(result.maxLength).toBe(200);
      expect(result.textareaRows).toBe(4);
      expect(result.showUserInfo).toBe(true);
    });
  });

  describe('getButtonText', () => {
    it('should return add button text when not editing', () => {
      component.editingNoteId = null;
      expect(component.getButtonText()).toBe('ADD');
    });

    it('should return update button text when editing', () => {
      component.editingNoteId = 1;
      expect(component.getButtonText()).toBe('UPDATE');
    });

    it('should return custom add button text from config', () => {
      component.config = { addButtonText: 'SUBMIT' };
      component.editingNoteId = null;
      expect(component.getButtonText()).toBe('SUBMIT');
    });

    it('should return custom update button text from config', () => {
      component.config = { updateButtonText: 'SAVE CHANGES' };
      component.editingNoteId = 5;
      expect(component.getButtonText()).toBe('SAVE CHANGES');
    });

    it('should return update text when editingNoteId is a string', () => {
      component.editingNoteId = 'note-abc';
      expect(component.getButtonText()).toBe('UPDATE');
    });

    it('should return add text when editingNoteId is 0 (falsy but truthy for this check)', () => {
      // 0 is falsy in JavaScript, so editingNoteId = 0 would be treated as "no editing"
      component.editingNoteId = 0;
      expect(component.getButtonText()).toBe('ADD');
    });
  });

  describe('addNote', () => {
    describe('validation', () => {
      it('should set error message when note text is empty', () => {
        component.newNoteText = '';
        component.addNote();

        expect(component.errorMessage).toBe('Error 11034: Note is empty when trying to navigate');
      });

      it('should set error message when note text is only whitespace', () => {
        component.newNoteText = '   ';
        component.addNote();

        expect(component.errorMessage).toBe('Error 11034: Note is empty when trying to navigate');
      });

      it('should set error message when note text is only tabs and newlines', () => {
        component.newNoteText = '\t\n  \r\n';
        component.addNote();

        expect(component.errorMessage).toBe('Error 11034: Note is empty when trying to navigate');
      });

      it('should not emit noteAction when note text is empty', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = '';
        component.addNote();

        expect(component.noteAction.emit).not.toHaveBeenCalled();
      });

      it('should not clear textarea when validation fails', () => {
        component.newNoteText = '';
        component.addNote();

        expect(component.newNoteText).toBe('');
      });
    });

    describe('adding a new note', () => {
      it('should emit noteAction with action "add"', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = 'Test note content';
        component.addNote();

        expect(component.noteAction.emit).toHaveBeenCalledTimes(1);
        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.action).toBe('add');
      });

      it('should include trimmed text in the emitted note', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = '  Trimmed content  ';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.text).toBe('Trimmed content');
      });

      it('should include currentUserName in the emitted note', () => {
        spyOn(component.noteAction, 'emit');
        component.currentUserName = 'John Doe';
        component.newNoteText = 'A note';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.userName).toBe('John Doe');
      });

      it('should include a timestamp in the emitted note', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = 'A note';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.timestamp).toBeDefined();
        // Verify it's a valid ISO string
        expect(new Date(emittedEvent.note.timestamp!).toISOString()).toBe(emittedEvent.note.timestamp);
      });

      it('should include a numeric id (Date.now) in the emitted note', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = 'A note';
        const before = Date.now();
        component.addNote();
        const after = Date.now();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(typeof emittedEvent.note.id).toBe('number');
        expect(emittedEvent.note.id as number).toBeGreaterThanOrEqual(before);
        expect(emittedEvent.note.id as number).toBeLessThanOrEqual(after);
      });

      it('should not include an index in the emitted event for new notes', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = 'A note';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.index).toBeUndefined();
      });

      it('should clear textarea after adding a note', () => {
        component.newNoteText = 'A note';
        component.addNote();

        expect(component.newNoteText).toBe('');
      });

      it('should clear error message before adding', () => {
        component.errorMessage = 'Previous error';
        component.newNoteText = 'Valid text';
        component.addNote();

        expect(component.errorMessage).toBeNull();
      });

      it('should handle undefined currentUserName', () => {
        spyOn(component.noteAction, 'emit');
        component.currentUserName = undefined;
        component.newNoteText = 'A note';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.userName).toBeUndefined();
      });
    });

    describe('updating an existing note', () => {
      const existingNotes: NoteItem[] = [
        { id: 1, text: 'First note', userName: 'User1' },
        { id: 2, text: 'Second note', userName: 'User2' },
        { id: 3, text: 'Third note', userName: 'User3' }
      ];

      beforeEach(() => {
        component.notes = existingNotes;
        component.editingNoteId = 2;
        component.newNoteText = 'Updated text';
      });

      it('should emit noteAction with action "update"', () => {
        spyOn(component.noteAction, 'emit');
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.action).toBe('update');
      });

      it('should include the note id in the emitted event', () => {
        spyOn(component.noteAction, 'emit');
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.id).toBe(2);
      });

      it('should include trimmed text in the emitted event', () => {
        spyOn(component.noteAction, 'emit');
        component.newNoteText = '  Updated trimmed  ';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.note.text).toBe('Updated trimmed');
      });

      it('should include the correct index of the note being updated', () => {
        spyOn(component.noteAction, 'emit');
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.index).toBe(1); // index of id=2
      });

      it('should return -1 as index when editingNoteId does not match any note', () => {
        spyOn(component.noteAction, 'emit');
        component.editingNoteId = 999;
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.index).toBe(-1);
      });

      it('should call cancelEdit after updating', () => {
        spyOn(component, 'cancelEdit');
        component.addNote();

        expect(component.cancelEdit).toHaveBeenCalled();
      });

      it('should reset editingNoteId to null after updating', () => {
        component.addNote();

        expect(component.editingNoteId).toBeNull();
      });

      it('should clear the textarea after updating', () => {
        component.addNote();

        expect(component.newNoteText).toBe('');
      });

      it('should clear error message after updating', () => {
        component.errorMessage = 'Old error';
        component.addNote();

        expect(component.errorMessage).toBeNull();
      });

      it('should handle string editingNoteId', () => {
        spyOn(component.noteAction, 'emit');
        component.notes = [{ id: 'note-abc', text: 'Old text' }];
        component.editingNoteId = 'note-abc';
        component.newNoteText = 'New text';
        component.addNote();

        const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
        expect(emittedEvent.action).toBe('update');
        expect(emittedEvent.note.id).toBe('note-abc');
        expect(emittedEvent.index).toBe(0);
      });
    });
  });

  describe('editNote', () => {
    it('should set editingNoteId to the note id', () => {
      const note: NoteItem = { id: 42, text: 'Test note' };
      component.editNote(note);

      expect(component.editingNoteId).toBe(42);
    });

    it('should set newNoteText to the note text', () => {
      const note: NoteItem = { id: 1, text: 'Existing content' };
      component.editNote(note);

      expect(component.newNoteText).toBe('Existing content');
    });

    it('should handle string note id', () => {
      const note: NoteItem = { id: 'abc-123', text: 'String id note' };
      component.editNote(note);

      expect(component.editingNoteId).toBe('abc-123');
    });

    it('should focus the textarea after a timeout', (done) => {
      fixture.detectChanges();

      // Get the fixture's textarea (rendered by the template)
      const textarea = fixture.nativeElement.querySelector('.notes-textarea') as HTMLTextAreaElement;
      spyOn(textarea, 'focus');
      spyOn(textarea, 'scrollIntoView');

      const note: NoteItem = { id: 1, text: 'Note' };
      component.editNote(note);

      setTimeout(() => {
        expect(textarea.focus).toHaveBeenCalled();
        expect(textarea.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        done();
      }, 50);
    });

    it('should not throw when textarea element is not found', (done) => {
      fixture.detectChanges();

      // Remove all .notes-textarea elements from the fixture DOM so querySelector returns null
      fixture.nativeElement.querySelectorAll('.notes-textarea').forEach((el: Element) => el.remove());

      const note: NoteItem = { id: 1, text: 'Note' };
      component.editNote(note);

      setTimeout(() => {
        // If we got here without an error, the test passes
        expect(component.editingNoteId).toBe(1);
        done();
      }, 50);
    });
  });

  describe('deleteNote', () => {
    it('should emit noteAction with action "delete"', () => {
      spyOn(component.noteAction, 'emit');
      const note: NoteItem = { id: 1, text: 'Delete me' };
      component.notes = [note];
      component.deleteNote(note);

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.action).toBe('delete');
    });

    it('should include the note in the emitted event', () => {
      spyOn(component.noteAction, 'emit');
      const note: NoteItem = { id: 5, text: 'Note to delete', userName: 'Admin' };
      component.notes = [note];
      component.deleteNote(note);

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.note).toBe(note);
    });

    it('should include the correct index of the note', () => {
      spyOn(component.noteAction, 'emit');
      const notes: NoteItem[] = [
        { id: 1, text: 'First' },
        { id: 2, text: 'Second' },
        { id: 3, text: 'Third' }
      ];
      component.notes = notes;
      component.deleteNote(notes[2]);

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.index).toBe(2);
    });

    it('should return -1 as index when note is not in the array', () => {
      spyOn(component.noteAction, 'emit');
      component.notes = [{ id: 1, text: 'Only note' }];
      const unknownNote: NoteItem = { id: 999, text: 'Not in list' };
      component.deleteNote(unknownNote);

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.index).toBe(-1);
    });

    it('should emit for the first note in the list', () => {
      spyOn(component.noteAction, 'emit');
      const notes: NoteItem[] = [
        { id: 10, text: 'First' },
        { id: 20, text: 'Second' }
      ];
      component.notes = notes;
      component.deleteNote(notes[0]);

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.index).toBe(0);
    });
  });

  describe('cancelEdit', () => {
    it('should set editingNoteId to null', () => {
      component.editingNoteId = 42;
      component.cancelEdit();

      expect(component.editingNoteId).toBeNull();
    });

    it('should clear the newNoteText', () => {
      component.newNoteText = 'Some text';
      component.cancelEdit();

      expect(component.newNoteText).toBe('');
    });

    it('should clear the errorMessage', () => {
      component.errorMessage = 'Some error';
      component.cancelEdit();

      expect(component.errorMessage).toBeNull();
    });

    it('should reset all three properties simultaneously', () => {
      component.editingNoteId = 99;
      component.newNoteText = 'Editing text';
      component.errorMessage = 'Validation error';
      component.cancelEdit();

      expect(component.editingNoteId).toBeNull();
      expect(component.newNoteText).toBe('');
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('onNoteInput', () => {
    it('should clear error message when it exists', () => {
      component.errorMessage = 'Error 11034: Note is empty when trying to navigate';
      component.onNoteInput();

      expect(component.errorMessage).toBeNull();
    });

    it('should do nothing when error message is already null', () => {
      component.errorMessage = null;
      component.onNoteInput();

      expect(component.errorMessage).toBeNull();
    });

    it('should clear any custom error message', () => {
      component.errorMessage = 'Some other error';
      component.onNoteInput();

      expect(component.errorMessage).toBeNull();
    });
  });

  describe('getUserInitials', () => {
    it('should return "?" for empty string', () => {
      expect(component.getUserInitials('')).toBe('?');
    });

    it('should return first two characters for a single name', () => {
      expect(component.getUserInitials('John')).toBe('JO');
    });

    it('should return initials of first and last name for two names', () => {
      expect(component.getUserInitials('John Doe')).toBe('JD');
    });

    it('should return initials of first and last name for multiple names', () => {
      expect(component.getUserInitials('John Michael Doe')).toBe('JD');
    });

    it('should convert to uppercase', () => {
      expect(component.getUserInitials('john doe')).toBe('JD');
    });

    it('should handle single character name', () => {
      expect(component.getUserInitials('J')).toBe('J');
    });

    it('should handle name with leading/trailing spaces', () => {
      expect(component.getUserInitials('  Jane Smith  ')).toBe('JS');
    });

    it('should handle names with three parts', () => {
      expect(component.getUserInitials('Mary Jane Watson')).toBe('MW');
    });

    it('should handle two-character single name', () => {
      expect(component.getUserInitials('Jo')).toBe('JO');
    });
  });

  describe('template rendering', () => {
    it('should show empty state when notes array is empty', () => {
      component.notes = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should show default empty state message', () => {
      component.notes = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state p');
      expect(emptyState.textContent).toContain('No notes available');
    });

    it('should show custom empty state message', () => {
      component.notes = [];
      component.config = { emptyStateMessage: 'Nothing to show' };
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state p');
      expect(emptyState.textContent).toContain('Nothing to show');
    });

    it('should show notes list when notes exist', () => {
      component.notes = [{ id: 1, text: 'A note', userName: 'User' }];
      fixture.detectChanges();

      const notesList = fixture.nativeElement.querySelector('.notes-list');
      expect(notesList).toBeTruthy();
    });

    it('should not show empty state when notes exist', () => {
      component.notes = [{ id: 1, text: 'A note' }];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeFalsy();
    });

    it('should render the correct number of note cards', () => {
      component.notes = [
        { id: 1, text: 'Note 1' },
        { id: 2, text: 'Note 2' },
        { id: 3, text: 'Note 3' }
      ];
      fixture.detectChanges();

      const noteCards = fixture.nativeElement.querySelectorAll('.note-card');
      expect(noteCards.length).toBe(3);
    });

    it('should display note text in note card', () => {
      component.notes = [{ id: 1, text: 'Hello World' }];
      fixture.detectChanges();

      const noteText = fixture.nativeElement.querySelector('.note-text');
      expect(noteText.textContent).toContain('Hello World');
    });

    it('should show loading spinner when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.loading-overlay');
      expect(spinner).toBeTruthy();
    });

    it('should not show loading spinner when loading is false', () => {
      component.loading = false;
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.loading-overlay');
      expect(spinner).toBeFalsy();
    });

    it('should show error message when errorMessage is set', () => {
      component.errorMessage = 'Error 11034: Note is empty when trying to navigate';
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.note-error');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.textContent).toContain('Error 11034');
    });

    it('should not show error message when errorMessage is null', () => {
      component.errorMessage = null;
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.note-error');
      expect(errorDiv).toBeFalsy();
    });

    it('should show cancel button when in edit mode', () => {
      component.editingNoteId = 1;
      fixture.detectChanges();

      const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
      expect(cancelButton).toBeTruthy();
    });

    it('should not show cancel button when not in edit mode', () => {
      component.editingNoteId = null;
      fixture.detectChanges();

      const cancelButton = fixture.nativeElement.querySelector('.cancel-button');
      expect(cancelButton).toBeFalsy();
    });

    it('should disable textarea when readonly is true', async () => {
      component.readonly = true;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.notes-textarea');
      expect(textarea.disabled).toBe(true);
    });

    it('should disable textarea when loading is true', async () => {
      component.loading = true;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.notes-textarea');
      expect(textarea.disabled).toBe(true);
    });

    it('should enable textarea when neither readonly nor loading', async () => {
      component.readonly = false;
      component.loading = false;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.notes-textarea');
      expect(textarea.disabled).toBe(false);
    });

    it('should disable add button when text is empty', () => {
      component.newNoteText = '';
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-button');
      expect(addButton.disabled).toBe(true);
    });

    it('should disable add button when readonly', () => {
      component.newNoteText = 'Some text';
      component.readonly = true;
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-button');
      expect(addButton.disabled).toBe(true);
    });

    it('should disable add button when loading', () => {
      component.newNoteText = 'Some text';
      component.loading = true;
      fixture.detectChanges();

      const addButton = fixture.nativeElement.querySelector('.add-button');
      expect(addButton.disabled).toBe(true);
    });

    it('should show edit button when allowEdit is true and not readonly', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'User' }];
      component.config = { allowEdit: true };
      component.readonly = false;
      fixture.detectChanges();

      const editButtons = fixture.nativeElement.querySelectorAll('.action-button');
      const editButton = Array.from(editButtons).find(
        (btn: any) => btn.textContent.trim().includes('Edit')
      );
      expect(editButton).toBeTruthy();
    });

    it('should hide edit and delete buttons when readonly is true', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'User' }];
      component.readonly = true;
      fixture.detectChanges();

      const noteActions = fixture.nativeElement.querySelector('.note-actions');
      expect(noteActions).toBeFalsy();
    });

    it('should show user info when showUserInfo is true', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'John' }];
      component.config = { showUserInfo: true };
      fixture.detectChanges();

      const userInfo = fixture.nativeElement.querySelector('.user-info');
      expect(userInfo).toBeTruthy();
    });

    it('should hide note header when showUserInfo is false', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'John' }];
      component.config = { showUserInfo: false };
      fixture.detectChanges();

      const noteHeader = fixture.nativeElement.querySelector('.note-header');
      expect(noteHeader).toBeFalsy();
    });

    it('should display user name in note card', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'Jane Doe' }];
      fixture.detectChanges();

      const userName = fixture.nativeElement.querySelector('.user-name');
      expect(userName.textContent).toContain('Jane Doe');
    });

    it('should display version when available', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'User', version: '1B | 4-Apr-2026' }];
      fixture.detectChanges();

      const metadata = fixture.nativeElement.querySelector('.note-metadata');
      expect(metadata.textContent).toContain('1B | 4-Apr-2026');
    });

    it('should display timestamp when version is not available', () => {
      component.notes = [{ id: 1, text: 'Note', userName: 'User', timestamp: '2026-04-04T10:00:00Z' }];
      fixture.detectChanges();

      const metadata = fixture.nativeElement.querySelector('.note-metadata');
      expect(metadata.textContent).toContain('2026-04-04T10:00:00Z');
    });

    it('should set the textarea placeholder from config', () => {
      component.config = { placeholder: 'Write something' };
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.notes-textarea');
      expect(textarea.getAttribute('placeholder')).toBe('Write something');
    });

    it('should set textarea maxlength from config', () => {
      component.config = { maxLength: 250 };
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.notes-textarea');
      expect(textarea.getAttribute('maxlength')).toBe('250');
    });
  });

  describe('integration: add then cancel edit flow', () => {
    it('should go from edit mode back to add mode', () => {
      const note: NoteItem = { id: 1, text: 'Original note' };
      component.notes = [note];

      // Enter edit mode
      component.editNote(note);
      expect(component.editingNoteId).toBe(1);
      expect(component.newNoteText).toBe('Original note');
      expect(component.getButtonText()).toBe('UPDATE');

      // Cancel edit
      component.cancelEdit();
      expect(component.editingNoteId).toBeNull();
      expect(component.newNoteText).toBe('');
      expect(component.getButtonText()).toBe('ADD');
    });
  });

  describe('integration: validation then successful add', () => {
    it('should clear validation error on successful add after failed attempt', () => {
      spyOn(component.noteAction, 'emit');

      // First attempt with empty text
      component.newNoteText = '';
      component.addNote();
      expect(component.errorMessage).toBeTruthy();

      // Second attempt with valid text
      component.newNoteText = 'Valid note';
      component.addNote();
      expect(component.errorMessage).toBeNull();
      expect(component.noteAction.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration: edit then update flow', () => {
    it('should update a note and reset state', () => {
      spyOn(component.noteAction, 'emit');
      const notes: NoteItem[] = [
        { id: 1, text: 'First' },
        { id: 2, text: 'Second' }
      ];
      component.notes = notes;

      // Edit note
      component.editNote(notes[1]);
      expect(component.editingNoteId).toBe(2);
      expect(component.newNoteText).toBe('Second');

      // Modify and save
      component.newNoteText = 'Updated Second';
      component.addNote();

      const emittedEvent = (component.noteAction.emit as jasmine.Spy).calls.mostRecent().args[0] as NoteActionEvent;
      expect(emittedEvent.action).toBe('update');
      expect(emittedEvent.note.text).toBe('Updated Second');
      expect(emittedEvent.index).toBe(1);

      // State should be reset
      expect(component.editingNoteId).toBeNull();
      expect(component.newNoteText).toBe('');
    });
  });
});
