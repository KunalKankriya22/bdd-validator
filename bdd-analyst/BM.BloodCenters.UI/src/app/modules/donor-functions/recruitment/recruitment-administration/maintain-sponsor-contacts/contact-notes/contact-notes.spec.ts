import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ContactNotesComponent } from './contact-notes';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { SponsorContactModel, SponsorContactDetailModel } from '../models/maintain-sponsor-contacts.model';

describe('ContactNotesComponent', () => {
  let component: ContactNotesComponent;
  let fixture: ComponentFixture<ContactNotesComponent>;
  let mockService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockContactData: SponsorContactModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    contactTypeDescription: 'Primary Contact',
    salutation: 'MR',
    salutationDescription: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    titleDescription: 'Manager',
    effDate: '15-JUN-2020',
    termDate: null,
    sponsorName: 'Test Sponsor',
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser',
    auditKey: 1
  };

  const mockDetail: SponsorContactDetailModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    salutation: 'MR',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    effDate: '15-JUN-2020',
    sponsorName: 'Test Sponsor',
    notes: [
      {
        noteId: 'NOTE1',
        contactId: 'CONTACT123',
        notes: 'Test note 1',
        createdBy: 'John Doe',
        createdDate: '2026-01-15',
        version: '1',
        auditKey: 1
      }
    ],
    address: {},
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getContactDetail',
      'addContactNote',
      'updateContactNote',
      'deleteContactNote'
    ]);
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId']);

    mockService.getContactDetail.and.returnValue(of(mockDetail));
    mockLoginService.getStoredUsername.and.returnValue('testuser');
    mockHeaderService.getCurrentChapterId.and.returnValue('CHAPTER1');

    await TestBed.configureTestingModule({
      imports: [ContactNotesComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactNotesComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;
    // The component's standalone imports (MatSnackBarModule) create their own injector,
    // so we must spy on the instance from the component's own injector, not TestBed's.
    const realSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(realSnackBar, 'open');
    mockSnackBar = realSnackBar as any;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ==================== ngOnInit ====================

  describe('ngOnInit', () => {
    it('should initialize noteForm with notes control', () => {
      fixture.detectChanges();
      expect(component.noteForm).toBeDefined();
      expect(component.noteForm.get('notes')).toBeDefined();
    });

    it('should load notes on init', () => {
      fixture.detectChanges();
      expect(mockService.getContactDetail).toHaveBeenCalledWith('SPONSOR123', 'ADDR456');
      expect(component.notes.length).toBe(1);
      expect(component.isLoading).toBeFalse();
    });

    it('should not load notes when data is null', () => {
      component.data = null;
      fixture.detectChanges();
      expect(mockService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should not load notes when sponsorId is missing', () => {
      component.data = { ...mockContactData, sponsorId: '' };
      fixture.detectChanges();
      expect(mockService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should not load notes when addressId is missing', () => {
      component.data = { ...mockContactData, addressId: '' };
      fixture.detectChanges();
      expect(mockService.getContactDetail).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });

    it('should handle loadNotes error', () => {
      mockService.getContactDetail.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(component.notes).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should map notes using noteText field from response', () => {
      const detailWithNoteText = {
        ...mockDetail,
        notes: [{ noteId: 'N1', noteText: 'Note via noteText', insertUser: 'user1', insertDate: '2026-01-15', auditKey: 2 }]
      };
      mockService.getContactDetail.and.returnValue(of(detailWithNoteText as any));
      fixture.detectChanges();
      expect(component.notes[0].notes).toBe('Note via noteText');
      expect(component.notes[0].createdBy).toBe('user1');
    });

    it('should trim leading spaces from notes and createdBy', () => {
      const detailWithSpaces = {
        ...mockDetail,
        notes: [{
          noteId: 'N1',
          noteText: '  leading space note',
          insertUser: '  spaced user',
          insertDate: '2026-01-15',
          auditKey: 1
        }]
      };
      mockService.getContactDetail.and.returnValue(of(detailWithSpaces as any));
      fixture.detectChanges();
      expect(component.notes[0].notes).toBe('leading space note');
      expect(component.notes[0].createdBy).toBe('spaced user');
    });

    it('should map notes using notes field when noteText is not present', () => {
      const detailWithNotesField = {
        ...mockDetail,
        notes: [{ noteId: 'N1', notes: 'Notes field value', createdBy: 'user2', createdDate: '2026-01-15', auditKey: 3 }]
      };
      mockService.getContactDetail.and.returnValue(of(detailWithNotesField as any));
      fixture.detectChanges();
      expect(component.notes[0].notes).toBe('Notes field value');
    });

    it('should handle empty notes array', () => {
      const detailWithNoNotes = { ...mockDetail, notes: [] };
      mockService.getContactDetail.and.returnValue(of(detailWithNoNotes));
      fixture.detectChanges();
      expect(component.notes).toEqual([]);
    });

    it('should handle null notes array', () => {
      const detailWithNullNotes = { ...mockDetail, notes: null as any };
      mockService.getContactDetail.and.returnValue(of(detailWithNullNotes));
      fixture.detectChanges();
      expect(component.notes).toEqual([]);
    });

    it('should enforce maxLength(240) on notes control', () => {
      fixture.detectChanges();
      component.noteForm.get('notes')?.setValue('a'.repeat(241));
      expect(component.noteForm.get('notes')?.hasError('maxlength')).toBeTrue();
    });
  });

  // ==================== getInitials ====================

  describe('getInitials', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return ? for empty string', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should return ? for null-ish empty name', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should return first letter uppercased for single word', () => {
      expect(component.getInitials('john')).toBe('J');
    });

    it('should return first and last initials for two-word name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should use first and last parts for three-word names', () => {
      expect(component.getInitials('John Van Doe')).toBe('JD');
    });

    it('should handle extra whitespace between words', () => {
      expect(component.getInitials('John   Doe')).toBe('JD');
    });
  });

  // ==================== onAddNote — add mode ====================

  describe('onAddNote — add mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.editingNoteId = null;
      component.editingAuditKey = null;
    });

    it('should not save when note text is empty', () => {
      component.noteForm.patchValue({ notes: '' });
      component.onAddNote();
      expect(mockService.addContactNote).not.toHaveBeenCalled();
    });

    it('should not save when note text is whitespace only', () => {
      component.noteForm.patchValue({ notes: '   ' });
      component.onAddNote();
      expect(mockService.addContactNote).not.toHaveBeenCalled();
    });

    it('should not save when data is null', () => {
      component.data = null;
      component.noteForm.patchValue({ notes: 'Test note' });
      component.onAddNote();
      expect(mockService.addContactNote).not.toHaveBeenCalled();
    });

    it('should not save when sponsorId is missing', () => {
      component.data = { ...mockContactData, sponsorId: '' };
      component.noteForm.patchValue({ notes: 'Test note' });
      component.onAddNote();
      expect(mockService.addContactNote).not.toHaveBeenCalled();
    });

    it('should add a new note successfully', () => {
      mockService.addContactNote.and.returnValue(of({}));
      component.noteForm.patchValue({ notes: 'New note' });
      component.onAddNote();
      expect(mockService.addContactNote).toHaveBeenCalledWith(
        'SPONSOR123', 'ADDR456', 'CHAPTER1',
        { noteText: 'New note', insertUser: 'testuser' }
      );
    });

    it('should reset form and set hasChanges after successful add', () => {
      mockService.addContactNote.and.returnValue(of({}));
      component.noteForm.patchValue({ notes: 'New note' });
      component.onAddNote();
      expect(component.isSaving).toBeFalse();
      expect(component.noteForm.get('notes')?.value).toBeNull();
      expect(component.hasChanges).toBeTrue();
    });

    it('should trim note text before saving', () => {
      mockService.addContactNote.and.returnValue(of({}));
      component.noteForm.patchValue({ notes: '  trimmed note  ' });
      component.onAddNote();
      const callArgs = mockService.addContactNote.calls.mostRecent().args[3];
      expect(callArgs.noteText).toBe('trimmed note');
    });

    it('should show snack bar on add note error', () => {
      const error = { error: { message: 'Add failed' } };
      mockService.addContactNote.and.returnValue(throwError(() => error));
      component.noteForm.patchValue({ notes: 'New note' });
      component.onAddNote();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });
  });

  // ==================== onAddNote — edit mode ====================

  describe('onAddNote — edit mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.editingNoteId = 'NOTE1';
      component.editingAuditKey = 1;
    });

    it('should call updateContactNote in edit mode', () => {
      mockService.updateContactNote.and.returnValue(of({}));
      component.noteForm.patchValue({ notes: 'Updated note' });
      component.onAddNote();
      expect(mockService.updateContactNote).toHaveBeenCalledWith('NOTE1', 1, {
        noteText: 'Updated note',
        insertUser: 'testuser'
      });
    });

    it('should clear editing state after successful update', () => {
      mockService.updateContactNote.and.returnValue(of({}));
      component.noteForm.patchValue({ notes: 'Updated note' });
      component.onAddNote();
      expect(component.editingNoteId).toBeNull();
      expect(component.editingAuditKey).toBeNull();
      expect(component.isSaving).toBeFalse();
      expect(component.hasChanges).toBeTrue();
    });

    it('should show snack bar on update note error', () => {
      const error = { error: { message: 'Update failed' } };
      mockService.updateContactNote.and.returnValue(throwError(() => error));
      component.noteForm.patchValue({ notes: 'Updated note' });
      component.onAddNote();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should call updateContactNote even when auditKey is 0', () => {
      mockService.updateContactNote.and.returnValue(of({}));
      component.editingAuditKey = 0;
      component.noteForm.patchValue({ notes: 'Zero audit key' });
      component.onAddNote();
      expect(mockService.updateContactNote).toHaveBeenCalledWith('NOTE1', 0, jasmine.any(Object));
    });
  });

  // ==================== onEditNote ====================

  describe('onEditNote', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set editing state and form value', () => {
      const note = { noteId: 'NOTE1', auditKey: 5, notes: 'Existing note text' };
      component.onEditNote(note);
      expect(component.editingNoteId).toBe('NOTE1');
      expect(component.editingAuditKey).toBe(5);
      expect(component.noteForm.get('notes')?.value).toBe('Existing note text');
    });

    it('should set editingAuditKey to null when auditKey is absent', () => {
      const note = { noteId: 'NOTE1', notes: 'Note without auditKey' };
      component.onEditNote(note);
      expect(component.editingAuditKey).toBeNull();
    });
  });

  // ==================== onDeleteNote ====================

  describe('onDeleteNote', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should not delete when data is null', () => {
      component.data = null;
      component.onDeleteNote({ auditKey: 1 });
      expect(mockService.deleteContactNote).not.toHaveBeenCalled();
    });

    it('should not delete when sponsorId is missing', () => {
      component.data = { ...mockContactData, sponsorId: '' };
      component.onDeleteNote({ auditKey: 1 });
      expect(mockService.deleteContactNote).not.toHaveBeenCalled();
    });

    it('should not delete when addressId is missing', () => {
      component.data = { ...mockContactData, addressId: '' };
      component.onDeleteNote({ auditKey: 1 });
      expect(mockService.deleteContactNote).not.toHaveBeenCalled();
    });

    it('should delete note and show success snack bar', () => {
      mockService.deleteContactNote.and.returnValue(of({}));
      component.onDeleteNote({ auditKey: 5 });
      expect(mockService.deleteContactNote).toHaveBeenCalledWith('SPONSOR123', 'ADDR456', 5);
      expect(component.hasChanges).toBeTrue();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Note deleted successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should reload notes after successful delete', () => {
      mockService.deleteContactNote.and.returnValue(of({}));
      mockService.getContactDetail.calls.reset();
      component.onDeleteNote({ auditKey: 1 });
      expect(mockService.getContactDetail).toHaveBeenCalled();
    });

    it('should show error snack bar on delete failure', () => {
      const error = { error: { message: 'Delete failed' } };
      mockService.deleteContactNote.and.returnValue(throwError(() => error));
      component.onDeleteNote({ auditKey: 1 });
      expect(mockSnackBar.open).toHaveBeenCalled();
    });
  });

  // ==================== onCancel ====================

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ==================== onSave ====================

  describe('onSave', () => {
    it('should emit saveSuccess', () => {
      fixture.detectChanges();
      spyOn(component.saveSuccess, 'emit');
      component.onSave();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });
  });

  // ==================== preventLeadingSpace ====================

  describe('preventLeadingSpace', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should prevent space when input is empty', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'notes');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when input has only spaces', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '   ';
      const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'notes');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow non-space key', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      spyOn(event, 'preventDefault');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.preventLeadingSpace(event, 'notes');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // ==================== trimLeadingSpace ====================

  describe('trimLeadingSpace', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should trim leading spaces from textarea', () => {
      const inputEl = document.createElement('textarea');
      inputEl.value = '  Note text';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.noteForm.get('notes')?.setValue('  Note text');
      component.trimLeadingSpace(event, 'notes');
      expect(inputEl.value).toBe('Note text');
      expect(component.noteForm.get('notes')?.value).toBe('Note text');
    });

    it('should not modify text without leading spaces', () => {
      const inputEl = document.createElement('textarea');
      inputEl.value = 'Note text';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: inputEl });
      component.trimLeadingSpace(event, 'notes');
      expect(inputEl.value).toBe('Note text');
    });
  });

  // ==================== onPaste ====================

  describe('onPaste', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should paste trimmed text and update form', fakeAsync(() => {
      const inputEl = document.createElement('textarea');
      inputEl.value = '';
      Object.defineProperty(inputEl, 'selectionStart', { value: 0 });
      Object.defineProperty(inputEl, 'selectionEnd', { value: 0 });
      const clipboardData = { getData: jasmine.createSpy().and.returnValue('  pasted note') };
      const event = { preventDefault: jasmine.createSpy(), clipboardData, target: inputEl } as any;
      component.onPaste(event, 'notes');
      tick(0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.noteForm.get('notes')?.value).toBe('pasted note');
    }));

    it('should handle null clipboardData gracefully', fakeAsync(() => {
      const inputEl = document.createElement('textarea');
      inputEl.value = '';
      Object.defineProperty(inputEl, 'selectionStart', { value: 0 });
      Object.defineProperty(inputEl, 'selectionEnd', { value: 0 });
      const event = { preventDefault: jasmine.createSpy(), clipboardData: null, target: inputEl } as any;
      expect(() => {
        component.onPaste(event, 'notes');
        tick(0);
      }).not.toThrow();
    }));
  });

  // ==================== formatDate ====================

  describe('formatDate', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format ISO date string as DD-MMM-YYYY', () => {
      const result = component.formatDate('2026-01-15T00:00:00');
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should format a simple date string', () => {
      const result = component.formatDate('2026-06-01');
      expect(result).toContain('2026');
    });
  });

  // ==================== getErrorMessage ====================

  describe('getErrorMessage', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should extract nested errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'Server error' } } };
      const msg = (component as any).getErrorMessage(error);
      expect(msg).toBe('Server error');
    });

    it('should fall back to error.message', () => {
      const error = { error: { message: 'API error message' } };
      const msg = (component as any).getErrorMessage(error);
      expect(msg).toBe('API error message');
    });

    it('should fall back to top-level message', () => {
      const error = { message: 'Top level message' };
      const msg = (component as any).getErrorMessage(error);
      expect(msg).toBe('Top level message');
    });

    it('should use default message when no error info', () => {
      const msg = (component as any).getErrorMessage({});
      expect(msg).toBe('An unexpected error occurred');
    });

    it('should include errorCode when present in error', () => {
      const error = { error: { errorCode: 'ERR001', message: 'Something failed' } };
      const msg = (component as any).getErrorMessage(error);
      expect(msg).toContain('ERR001');
      expect(msg).toContain('Something failed');
    });

    it('should include errorCode from nested errorResponse', () => {
      const error = { error: { errorResponse: { errorCode: 'ERR002', error: 'Nested error' } } };
      const msg = (component as any).getErrorMessage(error);
      expect(msg).toContain('ERR002');
    });
  });
});
