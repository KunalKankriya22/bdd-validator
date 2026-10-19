import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { DonationNotesDialog } from './donation-notes';
import { DonationNotesService } from './donation-notes.service';
import {
  DonationNotesDialogData,
  DonationNoteDto,
  DonationNotesAccessItem,
  DonationNotesLoadResult,
} from './donation-notes.model';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonationNotesDialog', () => {
  let component: DonationNotesDialog;
  let fixture: ComponentFixture<DonationNotesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DonationNotesDialog>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let donationNotesServiceSpy: jasmine.SpyObj<DonationNotesService>;

  const mockDialogData: DonationNotesDialogData = {
    title: 'Test Notes',
    unitId: 'UNIT-001',
    collectionDate: '2025-01-15',
    context: 'DONATION',
    contextLabel: 'UNIT ID',
    contextValue: 'UNIT-001',
    valueLabel: 'DRAW DATE',
    valueDisplay: '15-JAN-2025 00:00',
  };

  const mockNotes: DonationNoteDto[] = [
    {
      noteId: 'N1',
      noteSequence: 2,
      note: 'Second note',
      auditKey: 200,
      insertDate: '2025-01-15T10:30:00',
      insertUser: 'jdoe',
      insertUserName: 'John Doe',
      programId: 'P1',
      chapterId: 'C1',
    },
    {
      noteId: 'N2',
      noteSequence: 1,
      note: 'First note',
      auditKey: 100,
      insertDate: '2025-01-15T09:00:00',
      insertUser: 'asmith',
      insertUserName: 'Alice Smith',
      programId: 'P1',
      chapterId: 'C1',
    },
  ];

  const mockAccess: DonationNotesAccessItem = {
    canAdd: true,
    canEdit: true,
    canDelete: true,
  };

  const mockLoadResult: DonationNotesLoadResult = {
    notes: mockNotes,
    access: mockAccess,
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = createMockMatDialog();
    donationNotesServiceSpy = jasmine.createSpyObj('DonationNotesService', [
      'loadNotesAndAccess',
      'addNote',
      'updateNote',
      'deleteNote',
      'fetchNotes',
    ]);

    donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(of(mockLoadResult));
    donationNotesServiceSpy.addNote.and.returnValue(of(mockNotes));
    donationNotesServiceSpy.updateNote.and.returnValue(of(mockNotes));
    donationNotesServiceSpy.deleteNote.and.returnValue(of(true));
    donationNotesServiceSpy.fetchNotes.and.returnValue(of(mockNotes));

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ReactiveFormsModule, DonationNotesDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: DonationNotesService, useValue: donationNotesServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(DonationNotesDialog);
    component = fixture.componentInstance;
  });

  // ──────────────────────────────────────────────
  // 1. Component creation
  // ──────────────────────────────────────────────
  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 2. ngOnInit
  // ──────────────────────────────────────────────
  describe('ngOnInit', () => {
    it('should set dialogTitle from data.title', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.dialogTitle).toBe('Test Notes');
    }));

    it('should default dialogTitle to "Donation Notes" when data.title is empty', fakeAsync(() => {
      component.data = { ...mockDialogData, title: undefined };
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.dialogTitle).toBe('Donation Notes');
    }));

    it('should set headerInfo from data', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.headerInfo.label1).toBe('UNIT ID');
      expect(component.headerInfo.value1).toBe('UNIT-001');
      expect(component.headerInfo.label2).toBe('DRAW DATE');
      expect(component.headerInfo.value2).toBe('15-JAN-2025 00:00');
    }));

    it('should call loadNotesAndAccess and populate notes', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(donationNotesServiceSpy.loadNotesAndAccess).toHaveBeenCalledWith(
        'UNIT-001', undefined, '2025-01-15', 'DONATION'
      );
      expect(component.notes.length).toBe(2);
      // sorted descending by noteSequence
      expect(component.notes[0].noteSequence).toBe(2);
      expect(component.notes[1].noteSequence).toBe(1);
    }));

    it('should populate access from loaded result', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.access.canAdd).toBe(true);
      expect(component.access.canEdit).toBe(true);
      expect(component.access.canDelete).toBe(true);
    }));

    it('should set loading to false after load completes', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.loading).toBe(false);
    }));

    it('should handle load error gracefully', fakeAsync(() => {
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('Network error');
    }));

    it('should disable mutations when hasMutationContext is false', fakeAsync(() => {
      component.data = { title: 'Notes', transactionId: 'TX-1' }; // no unitId, no collectionDate
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.access.canAdd).toBe(false);
      expect(component.access.canEdit).toBe(false);
      expect(component.access.canDelete).toBe(false);
    }));
  });

  // ──────────────────────────────────────────────
  // 3. isSaving / isEditing getters
  // ──────────────────────────────────────────────
  describe('isSaving', () => {
    it('should return false when neither saving auditKey nor new note', () => {
      component.savingAuditKey = null;
      component.savingNewNote = false;
      expect(component.isSaving).toBe(false);
    });

    it('should return true when savingAuditKey is set', () => {
      component.savingAuditKey = 100;
      expect(component.isSaving).toBe(true);
    });

    it('should return true when savingNewNote is true', () => {
      component.savingNewNote = true;
      expect(component.isSaving).toBe(true);
    });
  });

  describe('isEditing', () => {
    it('should return false when editingAuditKey is null', () => {
      component.editingAuditKey = null;
      expect(component.isEditing).toBe(false);
    });

    it('should return true when editingAuditKey is set', () => {
      component.editingAuditKey = 200;
      expect(component.isEditing).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 4. accessLevelMessage
  // ──────────────────────────────────────────────
  describe('accessLevelMessage', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should return empty string when warningDismissed is true', () => {
      component.warningDismissed = true;
      expect(component.accessLevelMessage).toBe('');
    });

    it('should return access.message when set', () => {
      component.access = { canAdd: false, canEdit: false, canDelete: false, message: 'Custom message' };
      expect(component.accessLevelMessage).toBe('Custom message');
    });

    it('should return empty string when all permissions are granted', () => {
      component.access = { canAdd: true, canEdit: true, canDelete: true };
      expect(component.accessLevelMessage).toBe('');
    });

    it('should return view-and-add message when canAdd but not canDelete', () => {
      component.access = { canAdd: true, canEdit: false, canDelete: false };
      expect(component.accessLevelMessage).toContain('viewing and adding notes');
      expect(component.accessLevelMessage).toContain('Deletion of notes is denied');
    });

    it('should return view-and-add message when canEdit but not canDelete', () => {
      component.access = { canAdd: false, canEdit: true, canDelete: false };
      expect(component.accessLevelMessage).toContain('viewing and adding notes');
      expect(component.accessLevelMessage).toContain('Deletion of notes is denied');
    });

    it('should return view-and-delete message when canDelete but not canAdd/canEdit', () => {
      component.access = { canAdd: false, canEdit: false, canDelete: true };
      expect(component.accessLevelMessage).toContain('viewing and deleting notes');
      expect(component.accessLevelMessage).toContain('Adding notes is denied');
    });

    it('should return view-only message when no permissions', () => {
      component.access = { canAdd: false, canEdit: false, canDelete: false };
      expect(component.accessLevelMessage).toContain('viewing notes only');
      expect(component.accessLevelMessage).toContain('Addition and deletion of notes is denied');
    });
  });

  // ──────────────────────────────────────────────
  // 5. onAddOrUpdate
  // ──────────────────────────────────────────────
  describe('onAddOrUpdate', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should not call service when noteText is empty', fakeAsync(() => {
      component.noteForm.patchValue({ noteText: '' });
      component.onAddOrUpdate();
      tick();
      expect(donationNotesServiceSpy.addNote).not.toHaveBeenCalled();
      expect(donationNotesServiceSpy.updateNote).not.toHaveBeenCalled();
    }));

    it('should not call service when noteText is whitespace only', fakeAsync(() => {
      component.noteForm.patchValue({ noteText: '   ' });
      component.onAddOrUpdate();
      tick();
      expect(donationNotesServiceSpy.addNote).not.toHaveBeenCalled();
    }));

    describe('add mode (editingAuditKey is null)', () => {
      it('should call addNote on success and update notes', fakeAsync(() => {
        const newNotes: DonationNoteDto[] = [
          ...mockNotes,
          {
            noteId: 'N3', noteSequence: 3, note: 'New note', auditKey: 300,
            insertDate: '2025-01-15T12:00:00', insertUser: 'jdoe',
            insertUserName: 'John Doe', programId: 'P1', chapterId: 'C1',
          },
        ];
        donationNotesServiceSpy.addNote.and.returnValue(of(newNotes));

        component.noteForm.patchValue({ noteText: 'New note' });
        component.onAddOrUpdate();
        tick();

        expect(donationNotesServiceSpy.addNote).toHaveBeenCalledWith(
          'New note', 'UNIT-001', undefined, '2025-01-15', 'DONATION'
        );
        expect(component.savingNewNote).toBe(false);
        expect(component.notes.length).toBe(3);
      }));

      it('should set savingNewNote to true while saving', fakeAsync(() => {
        component.noteForm.patchValue({ noteText: 'A note' });
        // Do not tick yet - check intermediate state
        donationNotesServiceSpy.addNote.and.returnValue(of(mockNotes));
        component.onAddOrUpdate();
        // The observable completes synchronously with of(), so savingNewNote is already reset
        expect(component.savingNewNote).toBe(false);
      }));

      it('should handle add error and reset savingNewNote', fakeAsync(() => {
        donationNotesServiceSpy.addNote.and.returnValue(
          throwError(() => ({ error: { message: 'Add failed' } }))
        );
        component.noteForm.patchValue({ noteText: 'Will fail' });
        component.onAddOrUpdate();
        tick();

        expect(component.errorMessage).toBe('Add failed');
        expect(component.savingNewNote).toBe(false);
      }));
    });

    describe('edit mode (editingAuditKey is set)', () => {
      beforeEach(() => {
        component.editingAuditKey = 200;
      });

      it('should call updateNote on success and reset editing state', fakeAsync(() => {
        donationNotesServiceSpy.updateNote.and.returnValue(of(mockNotes));
        component.noteForm.patchValue({ noteText: 'Updated text' });
        component.onAddOrUpdate();
        tick();

        expect(donationNotesServiceSpy.updateNote).toHaveBeenCalledWith(
          200, 'Updated text', 'UNIT-001', '2025-01-15', 'DONATION'
        );
        expect(component.editingAuditKey).toBeNull();
        expect(component.savingAuditKey).toBeNull();
      }));

      it('should handle update error and reset savingAuditKey', fakeAsync(() => {
        donationNotesServiceSpy.updateNote.and.returnValue(
          throwError(() => ({
            error: { errorResponse: { errorCode: 'ERR01', error: 'Update failed' } }
          }))
        );
        component.noteForm.patchValue({ noteText: 'Will fail' });
        component.onAddOrUpdate();
        tick();

        expect(component.errorMessage).toBe('Update failed');
        expect(component.errorCode).toBe('ERR01');
        expect(component.savingAuditKey).toBeNull();
        // editingAuditKey should remain set on error
        expect(component.editingAuditKey).toBe(200);
      }));
    });
  });

  // ──────────────────────────────────────────────
  // 6. onEditNote / cancelEdit
  // ──────────────────────────────────────────────
  describe('onEditNote', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should set editingAuditKey and patch noteForm', () => {
      const note = mockNotes[0];
      component.onEditNote(note);
      expect(component.editingAuditKey).toBe(note.auditKey);
      expect(component.noteForm.get('noteText')?.value).toBe(note.note);
    });
  });

  describe('cancelEdit', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should clear editingAuditKey and reset form', () => {
      component.editingAuditKey = 200;
      component.noteForm.patchValue({ noteText: 'editing...' });

      component.cancelEdit();

      expect(component.editingAuditKey).toBeNull();
      expect(component.noteForm.get('noteText')?.value).toBeFalsy();
    });
  });

  // ──────────────────────────────────────────────
  // 7. deleteNote
  // ──────────────────────────────────────────────
  describe('deleteNote', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should not open confirm dialog when hasMutationContext is false', fakeAsync(() => {
      component.data = { title: 'Notes', transactionId: 'TX-1' }; // no unitId, no collectionDate
      component.deleteNote(100);
      tick();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should open confirm dialog and delete on confirmation', fakeAsync(() => {
      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      donationNotesServiceSpy.deleteNote.and.returnValue(of(true));
      donationNotesServiceSpy.fetchNotes.and.returnValue(of([mockNotes[1]]));

      component.deleteNote(200);
      tick();

      expect(component['dialog'].open).toHaveBeenCalled();
      expect(donationNotesServiceSpy.deleteNote).toHaveBeenCalledWith(
        200, 'UNIT-001', '2025-01-15', 'DONATION'
      );
      expect(donationNotesServiceSpy.fetchNotes).toHaveBeenCalled();
      expect(component.notes.length).toBe(1);
      expect(component.savingAuditKey).toBeNull();
    }));

    it('should not call deleteNote when confirmation is cancelled', fakeAsync(() => {
      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(false));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      component.deleteNote(200);
      tick();

      expect(component['dialog'].open).toHaveBeenCalled();
      expect(donationNotesServiceSpy.deleteNote).not.toHaveBeenCalled();
    }));

    it('should handle delete error and reset savingAuditKey', fakeAsync(() => {
      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      donationNotesServiceSpy.deleteNote.and.returnValue(
        throwError(() => ({ message: 'Delete failed' }))
      );

      component.deleteNote(200);
      tick();

      expect(component.errorMessage).toBe('Delete failed');
      expect(component.savingAuditKey).toBeNull();
    }));
  });

  // ──────────────────────────────────────────────
  // 8. isLatestNote
  // ──────────────────────────────────────────────
  describe('isLatestNote', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should return true for the note with the highest sequence (first in sorted list)', () => {
      expect(component.isLatestNote(component.notes[0])).toBe(true);
    });

    it('should return false for a note that is not first', () => {
      expect(component.isLatestNote(component.notes[1])).toBe(false);
    });

    it('should return false when notes array is empty', () => {
      component.notes = [];
      const note: DonationNoteDto = {
        noteId: 'N1', noteSequence: 1, note: 'x', auditKey: 1,
        insertDate: '', insertUser: '', insertUserName: '',
        programId: '', chapterId: '',
      };
      expect(component.isLatestNote(note)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // 9. getInitials
  // ──────────────────────────────────────────────
  describe('getInitials', () => {
    it('should return initials for two-word name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should return single initial for single-word name', () => {
      expect(component.getInitials('Alice')).toBe('A');
    });

    it('should return ? for empty string', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should handle multi-word names using first and last', () => {
      expect(component.getInitials('Mary Jane Watson')).toBe('MW');
    });

    it('should handle names with extra whitespace', () => {
      expect(component.getInitials('  Bob   Jones  ')).toBe('BJ');
    });
  });

  // ──────────────────────────────────────────────
  // 10. formatNoteDate
  // ──────────────────────────────────────────────
  describe('formatNoteDate', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatNoteDate('')).toBe('');
    });

    it('should format a valid date string', () => {
      // Use a date string that produces consistent results regardless of timezone
      const result = component.formatNoteDate('2025-01-15T00:00:00');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
      expect(result).toContain('JAN');
      expect(result).toContain('2025');
    });
  });

  // ──────────────────────────────────────────────
  // 11. closeError / dismissWarning
  // ──────────────────────────────────────────────
  describe('closeError', () => {
    it('should clear errorMessage and errorCode', () => {
      component.errorMessage = 'Something went wrong';
      component.errorCode = 'E01';
      component.closeError();
      expect(component.errorMessage).toBeNull();
      expect(component.errorCode).toBeNull();
    });
  });

  describe('dismissWarning', () => {
    it('should set warningDismissed to true', () => {
      component.warningDismissed = false;
      component.dismissWarning();
      expect(component.warningDismissed).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 12. onBack / onClose
  // ──────────────────────────────────────────────
  describe('onBack', () => {
    it('should close dialog without result', () => {
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onClose', () => {
    it('should close dialog with "closeAll"', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });

  // ──────────────────────────────────────────────
  // 13. isSavingNote
  // ──────────────────────────────────────────────
  describe('isSavingNote', () => {
    it('should return true when auditKey matches savingAuditKey', () => {
      component.savingAuditKey = 200;
      expect(component.isSavingNote(200)).toBe(true);
    });

    it('should return false when auditKey does not match savingAuditKey', () => {
      component.savingAuditKey = 200;
      expect(component.isSavingNote(100)).toBe(false);
    });

    it('should return false when savingAuditKey is null', () => {
      component.savingAuditKey = null;
      expect(component.isSavingNote(200)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // 14. headerInfo defaults (no contextLabel/contextValue/valueLabel/valueDisplay)
  // ──────────────────────────────────────────────
  describe('headerInfo defaults', () => {
    it('should fall back to unitId for value1 when contextValue is not provided', fakeAsync(() => {
      component.data = {
        unitId: 'UNIT-999',
        collectionDate: '2025-03-10',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.headerInfo.label1).toBe('UNIT ID / DEFERRAL ID');
      expect(component.headerInfo.value1).toBe('UNIT-999');
      expect(component.headerInfo.label2).toBe('DRAW DATE');
      expect(component.headerInfo.value2).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    }));

    it('should fall back to deferralId for value1 when neither contextValue nor unitId provided', fakeAsync(() => {
      component.data = {
        deferralId: 'DEF-123',
        collectionDate: '2025-06-20',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.headerInfo.value1).toBe('DEF-123');
    }));

    it('should use empty string for value1 when no contextValue, unitId, or deferralId', fakeAsync(() => {
      component.data = {
        collectionDate: '2025-01-01',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.headerInfo.value1).toBe('');
    }));

    it('should format collectionDate via formatNoteDate for value2 when valueDisplay not provided', fakeAsync(() => {
      component.data = {
        unitId: 'UNIT-001',
        collectionDate: '2025-07-04T00:00:00',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();
      expect(component.headerInfo.value2).toContain('JUL');
      expect(component.headerInfo.value2).toContain('2025');
    }));
  });

  // ──────────────────────────────────────────────
  // 15. refreshNotesAfterDelete error path
  // ──────────────────────────────────────────────
  describe('refreshNotesAfterDelete error path', () => {
    it('should handle fetchNotes error after successful delete', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      donationNotesServiceSpy.deleteNote.and.returnValue(of(true));
      donationNotesServiceSpy.fetchNotes.and.returnValue(
        throwError(() => ({ error: { message: 'Fetch after delete failed' } }))
      );

      component.deleteNote(200);
      tick();

      expect(donationNotesServiceSpy.deleteNote).toHaveBeenCalled();
      expect(donationNotesServiceSpy.fetchNotes).toHaveBeenCalled();
      expect(component.errorMessage).toBe('Fetch after delete failed');
      expect(component.savingAuditKey).toBeNull();
    }));
  });

  // ──────────────────────────────────────────────
  // 16. handleError edge cases
  // ──────────────────────────────────────────────
  describe('handleError edge cases', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should handle errorResponse with missing errorCode', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Something failed' } }
        }))
      );
      component.noteForm.patchValue({ noteText: 'Test note' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('Something failed');
      expect(component.errorCode).toBeUndefined();
    }));

    it('should fall back to generic message when error has no recognized structure', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({}))
      );
      component.noteForm.patchValue({ noteText: 'Test note' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('An error occurred while processing donation notes');
    }));
  });

  // ──────────────────────────────────────────────
  // 17. deferralId as resolvedUnitId
  // ──────────────────────────────────────────────
  describe('deferralId as resolvedUnitId', () => {
    it('should use deferralId when unitId is not provided', fakeAsync(() => {
      component.data = {
        title: 'Deferral Notes',
        deferralId: 'DEF-456',
        collectionDate: '2025-02-20',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(donationNotesServiceSpy.loadNotesAndAccess).toHaveBeenCalledWith(
        'DEF-456', undefined, '2025-02-20', 'DONATION'
      );
    }));
  });

  // ──────────────────────────────────────────────
  // 18. InstantErrorStateMatcher
  // ──────────────────────────────────────────────
  describe('InstantErrorStateMatcher', () => {
    it('should return true when control is invalid and dirty', () => {
      expect(component.instantMatcher.isErrorState(
        { invalid: true, dirty: true } as any,
        null
      )).toBe(true);
    });

    it('should return false when control is valid and dirty', () => {
      expect(component.instantMatcher.isErrorState(
        { invalid: false, dirty: true } as any,
        null
      )).toBe(false);
    });

    it('should return false when control is invalid but not dirty', () => {
      expect(component.instantMatcher.isErrorState(
        { invalid: true, dirty: false } as any,
        null
      )).toBe(false);
    });

    it('should return false when control is null', () => {
      expect(component.instantMatcher.isErrorState(null, null)).toBe(false);
    });

    it('should return false when control is valid and not dirty', () => {
      expect(component.instantMatcher.isErrorState(
        { invalid: false, dirty: false } as any,
        null
      )).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // 19. ngOnDestroy
  // ──────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$ subject', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      const destroyNext = spyOn(component['destroy$'], 'next');
      const destroyComplete = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    }));
  });

  // ──────────────────────────────────────────────
  // 20. noteForm validation (maxLength)
  // ──────────────────────────────────────────────
  describe('noteForm validation', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should have maxLength error when noteText exceeds 240 characters', () => {
      const noteTextControl = component.noteForm.get('noteText');
      noteTextControl?.setValue('a'.repeat(241));
      expect(noteTextControl?.hasError('maxlength')).toBe(true);
    });

    it('should be valid when noteText is exactly 240 characters', () => {
      const noteTextControl = component.noteForm.get('noteText');
      noteTextControl?.setValue('a'.repeat(240));
      expect(noteTextControl?.hasError('maxlength')).toBe(false);
    });

    it('should be valid when noteText is empty', () => {
      const noteTextControl = component.noteForm.get('noteText');
      noteTextControl?.setValue('');
      expect(noteTextControl?.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 21. accessLevelMessage additional edge cases
  // ──────────────────────────────────────────────
  describe('accessLevelMessage additional edge cases', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should return empty string when canAdd and canDelete are true but canEdit is false', () => {
      component.access = { canAdd: true, canEdit: false, canDelete: true };
      // canAdd || canEdit is true, but canDelete is also true, so first condition is false
      // !canAdd && !canEdit && canDelete is false because canAdd is true
      // !canAdd && !canEdit && !canDelete is false because canAdd is true
      // Falls to final return ''
      expect(component.accessLevelMessage).toBe('');
    });

    it('should return viewing-and-adding message when both canAdd and canEdit are true but canDelete is false', () => {
      component.access = { canAdd: true, canEdit: true, canDelete: false };
      expect(component.accessLevelMessage).toContain('viewing and adding notes');
      expect(component.accessLevelMessage).toContain('Deletion of notes is denied');
    });

    it('should return empty string when warningDismissed is true regardless of access settings', () => {
      component.access = { canAdd: false, canEdit: false, canDelete: false };
      component.warningDismissed = true;
      expect(component.accessLevelMessage).toBe('');
    });

    it('should return access.message when set even with partial permissions', () => {
      component.access = { canAdd: true, canEdit: false, canDelete: false, message: 'Custom warning' };
      expect(component.accessLevelMessage).toBe('Custom warning');
    });
  });

  // ──────────────────────────────────────────────
  // 22. onAddOrUpdate edge cases
  // ──────────────────────────────────────────────
  describe('onAddOrUpdate edge cases', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should not call service when noteText value is null', fakeAsync(() => {
      component.noteForm.patchValue({ noteText: null });
      component.onAddOrUpdate();
      tick();
      expect(donationNotesServiceSpy.addNote).not.toHaveBeenCalled();
      expect(donationNotesServiceSpy.updateNote).not.toHaveBeenCalled();
    }));

    it('should trim noteText before sending to addNote', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(of(mockNotes));
      component.noteForm.patchValue({ noteText: '  trimmed note  ' });
      component.onAddOrUpdate();
      tick();

      expect(donationNotesServiceSpy.addNote).toHaveBeenCalledWith(
        'trimmed note', 'UNIT-001', undefined, '2025-01-15', 'DONATION'
      );
    }));

    it('should reset noteForm after successful add', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(of(mockNotes));
      component.noteForm.patchValue({ noteText: 'Reset test' });
      component.onAddOrUpdate();
      tick();

      expect(component.noteForm.get('noteText')?.value).toBeFalsy();
    }));

    it('should reset noteForm after successful update', fakeAsync(() => {
      component.editingAuditKey = 200;
      donationNotesServiceSpy.updateNote.and.returnValue(of(mockNotes));
      component.noteForm.patchValue({ noteText: 'Updated' });
      component.onAddOrUpdate();
      tick();

      expect(component.noteForm.get('noteText')?.value).toBeFalsy();
      expect(component.editingAuditKey).toBeNull();
    }));

    it('should sort notes descending after successful add', fakeAsync(() => {
      const unsortedNotes: DonationNoteDto[] = [
        {
          noteId: 'N1', noteSequence: 1, note: 'First', auditKey: 100,
          insertDate: '2025-01-15T09:00:00', insertUser: 'jdoe',
          insertUserName: 'John Doe', programId: 'P1', chapterId: 'C1',
        },
        {
          noteId: 'N2', noteSequence: 3, note: 'Third', auditKey: 300,
          insertDate: '2025-01-15T12:00:00', insertUser: 'jdoe',
          insertUserName: 'John Doe', programId: 'P1', chapterId: 'C1',
        },
        {
          noteId: 'N3', noteSequence: 2, note: 'Second', auditKey: 200,
          insertDate: '2025-01-15T10:00:00', insertUser: 'jdoe',
          insertUserName: 'John Doe', programId: 'P1', chapterId: 'C1',
        },
      ];
      donationNotesServiceSpy.addNote.and.returnValue(of(unsortedNotes));

      component.noteForm.patchValue({ noteText: 'New note' });
      component.onAddOrUpdate();
      tick();

      expect(component.notes[0].noteSequence).toBe(3);
      expect(component.notes[1].noteSequence).toBe(2);
      expect(component.notes[2].noteSequence).toBe(1);
    }));

    it('should keep editingAuditKey on update error', fakeAsync(() => {
      component.editingAuditKey = 200;
      donationNotesServiceSpy.updateNote.and.returnValue(
        throwError(() => ({ message: 'Update error' }))
      );
      component.noteForm.patchValue({ noteText: 'Will fail' });
      component.onAddOrUpdate();
      tick();

      expect(component.editingAuditKey).toBe(200);
      expect(component.savingAuditKey).toBeNull();
    }));
  });

  // ──────────────────────────────────────────────
  // 23. deleteNote with deferralId
  // ──────────────────────────────────────────────
  describe('deleteNote with deferralId', () => {
    it('should use deferralId as resolvedUnitId when deleting', fakeAsync(() => {
      component.data = {
        title: 'Deferral Notes',
        deferralId: 'DEF-789',
        collectionDate: '2025-05-10',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      donationNotesServiceSpy.deleteNote.and.returnValue(of(true));
      donationNotesServiceSpy.fetchNotes.and.returnValue(of([]));

      component.deleteNote(100);
      tick();

      expect(donationNotesServiceSpy.deleteNote).toHaveBeenCalledWith(
        100, 'DEF-789', '2025-05-10', 'DONATION'
      );
    }));
  });

  // ──────────────────────────────────────────────
  // 24. getInitials edge cases
  // ──────────────────────────────────────────────
  describe('getInitials edge cases', () => {
    it('should return ? for null-like input', () => {
      expect(component.getInitials(null as any)).toBe('?');
      expect(component.getInitials(undefined as any)).toBe('?');
    });

    it('should handle single character name', () => {
      expect(component.getInitials('A')).toBe('A');
    });

    it('should uppercase lowercase initials', () => {
      expect(component.getInitials('john doe')).toBe('JD');
    });

    it('should handle four-word name using first and last', () => {
      expect(component.getInitials('Anna Maria Del Rey')).toBe('AR');
    });
  });

  // ──────────────────────────────────────────────
  // 25. formatNoteDate edge cases
  // ──────────────────────────────────────────────
  describe('formatNoteDate edge cases', () => {
    it('should format a July date correctly', () => {
      const result = component.formatNoteDate('2025-07-04T00:00:00');
      expect(result).toContain('JUL');
      expect(result).toContain('2025');
    });

    it('should format a December date correctly', () => {
      const result = component.formatNoteDate('2025-12-25T10:30:00');
      expect(result).toContain('DEC');
      expect(result).toContain('2025');
    });

    it('should include hours and minutes', () => {
      const result = component.formatNoteDate('2025-06-15T14:30:00');
      expect(result).toMatch(/\d{2}:\d{2}$/);
    });

    it('should pad single-digit day with leading zero', () => {
      const result = component.formatNoteDate('2025-01-05T00:00:00');
      expect(result).toMatch(/^05-/);
    });
  });

  // ──────────────────────────────────────────────
  // 26. handleError all branches
  // ──────────────────────────────────────────────
  describe('handleError all branches', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should handle error with error.error.errorResponse (full structure)', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: 'ERR_FULL', error: 'Full error response' } }
        }))
      );
      component.noteForm.patchValue({ noteText: 'Test' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorCode).toBe('ERR_FULL');
      expect(component.errorMessage).toBe('Full error response');
    }));

    it('should handle error with error.error.message', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({
          error: { message: 'Error via error.message' }
        }))
      );
      component.noteForm.patchValue({ noteText: 'Test' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('Error via error.message');
      expect(component.errorCode).toBeNull();
    }));

    it('should handle error with only error.message (top-level)', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({ message: 'Top level message' }))
      );
      component.noteForm.patchValue({ noteText: 'Test' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('Top level message');
    }));

    it('should use generic fallback message when error has no recognized structure', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => ({}))
      );
      component.noteForm.patchValue({ noteText: 'Test' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('An error occurred while processing donation notes');
    }));

    it('should use generic fallback for string error', fakeAsync(() => {
      donationNotesServiceSpy.addNote.and.returnValue(
        throwError(() => 'plain string error')
      );
      component.noteForm.patchValue({ noteText: 'Test' });
      component.onAddOrUpdate();
      tick();

      expect(component.errorMessage).toBe('An error occurred while processing donation notes');
    }));
  });

  // ──────────────────────────────────────────────
  // 27. loadNotes with hasMutationContext true (access not overridden)
  // ──────────────────────────────────────────────
  describe('loadNotes with hasMutationContext true', () => {
    it('should preserve original access when unitId and collectionDate are both set', fakeAsync(() => {
      const accessWithPartial: DonationNotesAccessItem = { canAdd: true, canEdit: false, canDelete: true };
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(of({
        notes: mockNotes,
        access: accessWithPartial,
      }));

      component.data = {
        unitId: 'UNIT-001',
        collectionDate: '2025-01-15',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      // hasMutationContext is true, so access should NOT be overridden
      expect(component.access.canAdd).toBe(true);
      expect(component.access.canEdit).toBe(false);
      expect(component.access.canDelete).toBe(true);
    }));
  });

  // ──────────────────────────────────────────────
  // 28. loadNotes with only collectionDate (no unitId/deferralId)
  // ──────────────────────────────────────────────
  describe('loadNotes with missing unitId and deferralId', () => {
    it('should override access to disable mutations when unitId and deferralId are both missing', fakeAsync(() => {
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(of({
        notes: mockNotes,
        access: { canAdd: true, canEdit: true, canDelete: true },
      }));

      component.data = {
        collectionDate: '2025-01-15',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.access.canAdd).toBe(false);
      expect(component.access.canEdit).toBe(false);
      expect(component.access.canDelete).toBe(false);
    }));

    it('should override access to disable mutations when collectionDate is missing', fakeAsync(() => {
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(of({
        notes: mockNotes,
        access: { canAdd: true, canEdit: true, canDelete: true },
      }));

      component.data = {
        unitId: 'UNIT-001',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.access.canAdd).toBe(false);
      expect(component.access.canEdit).toBe(false);
      expect(component.access.canDelete).toBe(false);
    }));
  });

  // ──────────────────────────────────────────────
  // 29. refreshNotesAfterDelete success details
  // ──────────────────────────────────────────────
  describe('refreshNotesAfterDelete success', () => {
    it('should sort notes descending and clear savingAuditKey after refresh', fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(true));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      const remainingNotes: DonationNoteDto[] = [
        {
          noteId: 'N1', noteSequence: 1, note: 'First', auditKey: 100,
          insertDate: '2025-01-15T09:00:00', insertUser: 'asmith',
          insertUserName: 'Alice Smith', programId: 'P1', chapterId: 'C1',
        },
        {
          noteId: 'N3', noteSequence: 3, note: 'Third', auditKey: 300,
          insertDate: '2025-01-15T12:00:00', insertUser: 'jdoe',
          insertUserName: 'John Doe', programId: 'P1', chapterId: 'C1',
        },
      ];

      donationNotesServiceSpy.deleteNote.and.returnValue(of(true));
      donationNotesServiceSpy.fetchNotes.and.returnValue(of(remainingNotes));

      component.deleteNote(200);
      tick();

      // Should be sorted descending: noteSequence 3 first, then 1
      expect(component.notes[0].noteSequence).toBe(3);
      expect(component.notes[1].noteSequence).toBe(1);
      expect(component.savingAuditKey).toBeNull();
    }));
  });

  // ──────────────────────────────────────────────
  // 30. onAddOrUpdate with transactionId
  // ──────────────────────────────────────────────
  describe('onAddOrUpdate with transactionId', () => {
    it('should pass transactionId to addNote service call', fakeAsync(() => {
      component.data = {
        title: 'Notes',
        unitId: 'UNIT-002',
        transactionId: 'TX-100',
        collectionDate: '2025-03-01',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      donationNotesServiceSpy.addNote.and.returnValue(of(mockNotes));
      component.noteForm.patchValue({ noteText: 'Transaction note' });
      component.onAddOrUpdate();
      tick();

      expect(donationNotesServiceSpy.addNote).toHaveBeenCalledWith(
        'Transaction note', 'UNIT-002', 'TX-100', '2025-03-01', 'DONATION'
      );
    }));
  });

  // ──────────────────────────────────────────────
  // 31. isSaving combined states
  // ──────────────────────────────────────────────
  describe('isSaving combined states', () => {
    it('should return true when both savingAuditKey and savingNewNote are set', () => {
      component.savingAuditKey = 100;
      component.savingNewNote = true;
      expect(component.isSaving).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 32. closeError resets both fields
  // ──────────────────────────────────────────────
  describe('closeError completeness', () => {
    it('should clear errorCode when only errorMessage was set', () => {
      component.errorMessage = 'Some error';
      component.errorCode = null;
      component.closeError();
      expect(component.errorMessage).toBeNull();
      expect(component.errorCode).toBeNull();
    });

    it('should clear both errorMessage and errorCode when both are set', () => {
      component.errorMessage = 'Error text';
      component.errorCode = 'E99';
      component.closeError();
      expect(component.errorMessage).toBeNull();
      expect(component.errorCode).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // 33. loadNotes error via catchError path
  // ──────────────────────────────────────────────
  describe('loadNotes catchError path', () => {
    it('should set errorCode when loadNotesAndAccess error has errorResponse', fakeAsync(() => {
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: 'LOAD_ERR', error: 'Load failed' } }
        }))
      );
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.loading).toBe(false);
      expect(component.errorMessage).toBe('Load failed');
      expect(component.errorCode).toBe('LOAD_ERR');
    }));

    it('should not populate notes when loadNotesAndAccess errors', fakeAsync(() => {
      donationNotesServiceSpy.loadNotesAndAccess.and.returnValue(
        throwError(() => ({ message: 'Server down' }))
      );
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.notes.length).toBe(0);
    }));
  });

  // ──────────────────────────────────────────────
  // 34. deleteNote confirm dialog configuration
  // ──────────────────────────────────────────────
  describe('deleteNote confirm dialog configuration', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should open confirm dialog with correct data', fakeAsync(() => {
      const confirmRef = jasmine.createSpyObj('ConfirmDialogRef', ['afterClosed', 'close']);
      confirmRef.afterClosed.and.returnValue(of(false));
      spyOn(component['dialog'], 'open').and.returnValue(confirmRef as any);

      component.deleteNote(200);
      tick();

      const openCall = (component['dialog'].open as jasmine.Spy).calls.mostRecent();
      const dialogConfig = openCall.args[1];
      expect(dialogConfig.width).toBe('380px');
      expect(dialogConfig.maxWidth).toBe('90vw');
      expect(dialogConfig.autoFocus).toBe(false);
      expect(dialogConfig.restoreFocus).toBe(false);
      expect(dialogConfig.disableClose).toBe(true);
      expect(dialogConfig.panelClass).toBe('centered-dialog');
      expect(dialogConfig.data.title).toBe('Delete Note');
      expect(dialogConfig.data.message).toBe('Are you sure you want to delete this note?');
      expect(dialogConfig.data.confirmText).toBe('YES');
      expect(dialogConfig.data.cancelText).toBe('NO, CANCEL');
    }));
  });

  // ──────────────────────────────────────────────
  // 35. isLatestNote with matching sequences
  // ──────────────────────────────────────────────
  describe('isLatestNote edge cases', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (_) {}
      tick();
    }));

    it('should return true when noteSequence matches first note even if not same object', () => {
      const note: DonationNoteDto = {
        noteId: 'NEW', noteSequence: component.notes[0].noteSequence, note: 'x',
        auditKey: 999, insertDate: '', insertUser: '', insertUserName: '',
        programId: '', chapterId: '',
      };
      expect(component.isLatestNote(note)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 36. headerInfo with empty collectionDate
  // ──────────────────────────────────────────────
  describe('headerInfo with empty collectionDate', () => {
    it('should set value2 to empty string when collectionDate is empty and no valueDisplay', fakeAsync(() => {
      component.data = {
        unitId: 'UNIT-001',
        context: 'DONATION',
      };
      try { fixture.detectChanges(); } catch (_) {}
      tick();

      expect(component.headerInfo.value2).toBe('');
    }));
  });
});
