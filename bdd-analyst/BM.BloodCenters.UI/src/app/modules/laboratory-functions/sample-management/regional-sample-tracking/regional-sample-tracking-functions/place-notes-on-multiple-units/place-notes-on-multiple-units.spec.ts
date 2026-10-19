import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { PlaceNotesOnMultipleUnitsComponent } from './place-notes-on-multiple-units';
import { PlaceNotesOnMultipleUnitsApiService } from './services/place-notes-on-multiple-units-api.service';
import { UnitListItem } from './models/place-notes-on-multiple-units.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('PlaceNotesOnMultipleUnitsComponent', () => {
  let component: PlaceNotesOnMultipleUnitsComponent;
  let fixture: ComponentFixture<PlaceNotesOnMultipleUnitsComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let c: any;
  let apiServiceSpy: jasmine.SpyObj<PlaceNotesOnMultipleUnitsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let dialogSpy: MatDialog;
  let chapterChangedSubject: Subject<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function setNotes(notes: any[]): void {
    c.existingNotes.set(notes.filter((n: any) => !n.isEditable));
    c.pendingNewNotes.set(notes.filter((n: any) => n.isEditable));
  }

  const mockUnitValidationEvent: UnitValidationResponse = {
    parsedUnitId: 'W633324111801',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W633324111801',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  const mockUnit1: UnitListItem = {
    unitId: 'W633324111801',
    collDate: '2024-11-18T00:00:00',
    noteId: null,
    hasExistingNotes: false,
  };

  const mockUnit2: UnitListItem = {
    unitId: 'W454510070221',
    collDate: '2010-07-07T00:00:00',
    noteId: 25091,
    hasExistingNotes: true,
  };

  const mockExistingNotes = [
    { noteId: 25091, noteSeq: 1, note: 'First existing note', insertUser: 'CELHUN', insertUserName: 'Hunter, Celeste', insertDate: '2026-05-29T16:41:24', notesTable: 'UNITS', chapterId: 'DAL', auditKey: 2038426 },
    { noteId: 25091, noteSeq: 2, note: 'Second existing note', insertUser: 'CELHUN', insertUserName: 'Hunter, Celeste', insertDate: '2026-05-29T16:41:24', notesTable: 'UNITS', chapterId: 'DAL', auditKey: 2038427 },
  ];

  function setupDefaultSpies(): void {
    apiServiceSpy.checkAccess.and.returnValue(
      of({ hasAccess: true, message: 'User has UNOTE access', userId: 'NITOR1', chapterId: 'DAL' }),
    );
    apiServiceSpy.validateUnit.and.returnValue(
      of({
        success: true, message: 'Unit validated successfully', statusCode: 200,
        data: [{ unitId: 'W633324111801', collDate: '2024-11-18T00:00:00', noteId: null, checkDigit: '7', hasExistingNotes: false }],
      }),
    );
    apiServiceSpy.getNotesByUnit.and.returnValue(
      of({ success: true, message: 'No notes found', statusCode: 200, data: [], total: 0 }),
    );
    apiServiceSpy.createNotes.and.returnValue(
      of({ success: true, message: 'Transaction committed', statusCode: 201, data: [{ noteIds: [25092], unitCount: 1, noteSeqCount: 1 }] }),
    );
  }

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('PlaceNotesOnMultipleUnitsApiService', [
      'validateUnit', 'checkAccess', 'createNotes', 'getNotesByUnit', 'getNoteGroup', 'deleteNote',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
      headerConfig: signal({ user: { name: 'Nitor1 Nitor1', id: 'NITOR1', role: 'User' } }),
    });
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-06-16T09:00:00'));
    // MatDialog is not mocked — use the real one and spy on open in individual tests

    setupDefaultSpies();



      TestBed.configureTestingModule({
imports: [PlaceNotesOnMultipleUnitsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PlaceNotesOnMultipleUnitsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    });


    });



  beforeEach(() => {


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.checkAccess.calls.reset();


      apiServiceSpy.createNotes.calls.reset();


      apiServiceSpy.getNotesByUnit.calls.reset();


      apiServiceSpy.getNoteGroup.calls.reset();


      apiServiceSpy.deleteNote.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-06-16T09:00:00'));


    dialogSpy = TestBed.inject(MatDialog);

    fixture = TestBed.createComponent(PlaceNotesOnMultipleUnitsComponent);
    component = fixture.componentInstance;
    c = component;


    });

  // ── Initialization ──────────────────────────────────────────────────────

  describe('Initialization', () => {



    it('should have no selected unit on init', () => {
      fixture.detectChanges();
      expect(c.selectedUnit()).toBeNull();
    });

    it('should have empty notes on init', () => {
      fixture.detectChanges();
      expect(c.notes()).toEqual([]);
    });

    it('should not be loading on init', () => {
      fixture.detectChanges();
      expect(c.isLoading()).toBeFalse();
      expect(c.isLoadingNotes()).toBeFalse();
      expect(c.isSubmitting()).toBeFalse();
    });

    it('should initialize with empty page header config', () => {
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
      expect(component.headerConfig.breadcrumbs).toEqual([]);
    });

  });

  // ── Access Control ──────────────────────────────────────────────────────

  describe('Access Control', () => {
    it('should set canAddNotes to true when user has UNOTE access', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(c.canAddNotes()).toBeTrue();
      expect(c.accessChecked()).toBeTrue();
    }));


    it('should set canAddNotes to false when access denied', fakeAsync(() => {
      apiServiceSpy.checkAccess.and.returnValue(
        of({ hasAccess: false, message: 'No access', userId: 'TEST', chapterId: 'DAL' }),
      );
      fixture.detectChanges();
      tick();
      expect(c.canAddNotes()).toBeFalse();
      expect(c.accessChecked()).toBeTrue();
    }));

    it('should set canAddNotes to false on access check error', fakeAsync(() => {
      apiServiceSpy.checkAccess.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(c.canAddNotes()).toBeFalse();
      expect(c.accessChecked()).toBeTrue();
    }));

    it('should return single-word name unchanged from getDisplayName', fakeAsync(() => {
      (headerServiceSpy.headerConfig as any).set({ user: { name: 'Admin', id: 'ADMIN', role: 'User' } });
      fixture.detectChanges();
      tick();
      expect(c.getDisplayName()).toBe('Admin');
    }));

    it('should fallback to getCurrentUsername when getDisplayName returns empty', fakeAsync(() => {
      (headerServiceSpy.headerConfig as any).set({ user: { name: '', id: '', role: '' } });
      headerServiceSpy.getCurrentUsername.and.returnValue('FALLBACK_USER');
      fixture.detectChanges();
      tick();
      expect(c.currentUserName()).toBe('FALLBACK_USER');
    }));

    it('should fallback to response userId when getDisplayName and getCurrentUsername are empty', fakeAsync(() => {
      (headerServiceSpy.headerConfig as any).set({ user: null });
      headerServiceSpy.getCurrentUsername.and.returnValue('');
      apiServiceSpy.checkAccess.and.returnValue(
        of({ hasAccess: true, message: '', userId: 'API_USER', chapterId: 'DAL' }),
      );
      fixture.detectChanges();
      tick();
      expect(c.currentUserName()).toBe('API_USER');
    }));

    it('should set empty currentUserName when all name sources are empty', fakeAsync(() => {
      (headerServiceSpy.headerConfig as any).set({ user: null });
      headerServiceSpy.getCurrentUsername.and.returnValue('');
      apiServiceSpy.checkAccess.and.returnValue(
        of({ hasAccess: true, message: '', userId: '', chapterId: 'DAL' }),
      );
      fixture.detectChanges();
      tick();
      expect(c.currentUserName()).toBe('');
    }));

    it('should return empty from getDisplayName when user is null', () => {
      fixture.detectChanges();
      (headerServiceSpy.headerConfig as any).set({ user: null });
      expect(c.getDisplayName()).toBe('');
    });
  });

  // ── Unit Validation & Entry ─────────────────────────────────────────────

  describe('Unit Entry', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call validateUnit API with parsed unit ID', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W633324111801');
    }));

    it('should add validated unit to unit list', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(c.unitList().length).toBe(1);
      expect(c.unitList()[0].unitId).toBe('W633324111801');
      expect(c.unitList()[0].collDate).toBe('2024-11-18T00:00:00');
    }));

    it('should auto-select first added unit', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(c.selectedUnit()).not.toBeNull();
      expect(c.selectedUnit().unitId).toBe('W633324111801');
    }));

    it('should load notes for auto-selected unit', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(apiServiceSpy.getNotesByUnit).toHaveBeenCalledWith('W633324111801');
    }));

    it('should reject duplicate unit with error message', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Duplicate'));
      expect(c.unitList().length).toBe(1);
    }));

    it('should not call API when parsedUnitId is null', fakeAsync(() => {
      c.onUnitValidated({ ...mockUnitValidationEvent, parsedUnitId: null });
      tick();
      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    }));

    it('should show error when validateUnit returns failure', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, message: 'Invalid unit', statusCode: 400, data: [] }),
      );
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid unit');
      expect(c.unitList().length).toBe(0);
      expect(c.isLoading()).toBeFalse();
    }));

    it('should show default message when validateUnit fails with empty message', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, message: '', statusCode: 400, data: [] }),
      );
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit validation failed.');
    }));

    it('should show error when validateUnit returns API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => ({ status: 500 })));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.isLoading()).toBeFalse();
    }));

    it('should not auto-select second unit when first is already selected', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      expect(c.selectedUnit().unitId).toBe('W633324111801');

      apiServiceSpy.validateUnit.and.returnValue(
        of({
          success: true, message: 'Unit validated', statusCode: 200,
          data: [{ unitId: 'W454510070221', collDate: '2010-07-07T00:00:00', noteId: 25091, checkDigit: '3', hasExistingNotes: true }],
        }),
      );
      c.onUnitValidated({ ...mockUnitValidationEvent, parsedUnitId: 'W454510070221' });
      tick();

      expect(c.unitList().length).toBe(2);
      expect(c.selectedUnit().unitId).toBe('W633324111801');
    }));





  });

  // ── Unit Row Click / Selection ──────────────────────────────────────────

  describe('Unit Row Click', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.unitList.set([mockUnit1, mockUnit2]);
    });

    it('should set selectedUnit on row click', () => {
      component.onUnitRowClick(mockUnit1);
      expect(c.selectedUnit()).toEqual(mockUnit1);
    });

    it('should load notes for clicked unit', () => {
      component.onUnitRowClick(mockUnit2);
      expect(apiServiceSpy.getNotesByUnit).toHaveBeenCalledWith('W454510070221');
    });

    it('should display existing notes for unit with notes', fakeAsync(() => {
      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: 'Notes retrieved', statusCode: 200, data: mockExistingNotes, total: 2 }),
      );
      component.onUnitRowClick(mockUnit2);
      tick();
      const notes = c.notes();
      expect(notes.length).toBe(3); // 2 existing + 1 new editable
      expect(notes[0].noteText).toBe('First existing note');
      expect(notes[0].isEditable).toBeFalse();
      expect(notes[1].noteText).toBe('Second existing note');
      expect(notes[1].isEditable).toBeFalse();
      expect(notes[2].isEditable).toBeTrue();
      expect(notes[2].noteText).toBe('');
    }));


    it('should show empty editable note for unit without notes', fakeAsync(() => {
      component.onUnitRowClick(mockUnit1);
      tick();
      const notes = c.notes();
      expect(notes.length).toBe(1);
      expect(notes[0].isEditable).toBeTrue();
      expect(notes[0].noteText).toBe('');
    }));


    it('should handle notes fetch error gracefully', fakeAsync(() => {
      apiServiceSpy.getNotesByUnit.and.returnValue(throwError(() => ({ status: 500 })));
      component.onUnitRowClick(mockUnit1);
      tick();
      expect(c.isLoadingNotes()).toBeFalse();
      expect(c.notes().length).toBe(1);
      expect(c.notes()[0].isEditable).toBeTrue();
    }));

    it('should set note author from existing notes', fakeAsync(() => {
      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockExistingNotes, total: 2 }),
      );
      component.onUnitRowClick(mockUnit2);
      tick();
      expect(c.notes()[0].author).toBe('Hunter, Celeste');
    }));

    it('should re-sequence pending notes when loading notes for a different unit', fakeAsync(() => {
      c.canAddNotes.set(true);
      c.pendingNewNotes.set([
        { noteSeq: 1, noteText: 'Pending note 1', author: 'User', timestamp: '16-JUN-2026  09:00', isEditable: true },
      ]);

      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockExistingNotes, total: 2 }),
      );
      component.onUnitRowClick(mockUnit2);
      tick();

      const pending = c.pendingNewNotes();
      expect(pending.length).toBe(1);
      expect(pending[0].noteSeq).toBe(3);
    }));

    it('should not create editable note when canAddNotes is false and no existing notes', fakeAsync(() => {
      c.canAddNotes.set(false);
      component.onUnitRowClick(mockUnit1);
      tick();
      expect(c.notes().length).toBe(0);
      expect(component.noteTextControl.value).toBe('');
    }));

    it('should show existing notes as read-only when canAddNotes is false', fakeAsync(() => {
      c.canAddNotes.set(false);
      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockExistingNotes, total: 2 }),
      );
      component.onUnitRowClick(mockUnit2);
      tick();
      const notes = c.notes();
      expect(notes.length).toBe(2);
      expect(notes.every((n: any) => !n.isEditable)).toBeTrue();
    }));

    it('should handle null data in notes response gracefully', fakeAsync(() => {
      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: null, total: 0 }),
      );
      component.onUnitRowClick(mockUnit1);
      tick();
      expect(c.existingNotes()).toEqual([]);
    }));

    it('should fallback to insertUser when insertUserName is null', fakeAsync(() => {
      const notesNoUserName = [
        { noteId: 25091, noteSeq: 1, note: 'Note text', insertUser: 'CELHUN', insertUserName: null, insertDate: '2026-05-29T16:41:24', notesTable: 'UNITS', chapterId: 'DAL', auditKey: 2038426 },
      ];
      apiServiceSpy.getNotesByUnit.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: notesNoUserName, total: 1 }),
      );
      component.onUnitRowClick(mockUnit2);
      tick();
      expect(c.notes()[0].author).toBe('CELHUN');
    }));

    it('should use empty author when currentUserName is empty in new note', fakeAsync(() => {
      c.currentUserName.set('');
      (headerServiceSpy.headerConfig as any).set({ user: null });
      headerServiceSpy.getCurrentUsername.and.returnValue('');
      component.onUnitRowClick(mockUnit1);
      tick();
      const pendingNotes = c.pendingNewNotes();
      expect(pendingNotes.length).toBe(1);
      expect(pendingNotes[0].author).toBe('');
    }));

    it('should set currentUserName from getCurrentUsername via refreshCurrentUserName', fakeAsync(() => {
      c.currentUserName.set('');
      (headerServiceSpy.headerConfig as any).set({ user: null });
      headerServiceSpy.getCurrentUsername.and.returnValue('refreshed_user');
      component.onUnitRowClick(mockUnit1);
      tick();
      expect(c.currentUserName()).toBe('refreshed_user');
    }));

    it('should not override currentUserName if already set in refreshCurrentUserName', fakeAsync(() => {
      c.currentUserName.set('already_set');
      component.onUnitRowClick(mockUnit1);
      tick();
      expect(c.currentUserName()).toBe('already_set');
    }));
  });

  // ── Delete Unit ─────────────────────────────────────────────────────────

  describe('Delete Unit', () => {
    let openSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      c.unitList.set([mockUnit1, mockUnit2]);
      c.selectedUnit.set(mockUnit1);
      openSpy = spyOn(c.dialog, 'open');
    });


    it('should pass correct dialog data', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      openSpy.and.returnValue(dialogRefSpy);
      component.onDeleteUnit({ action: 'delete', row: mockUnit1 });
      const dialogData = openSpy.calls.mostRecent().args[1]?.data as any;
      expect(dialogData.title).toBe('Delete Unit/Batch');
      expect(dialogData.confirmText).toBe('YES, DELETE');
      expect(dialogData.cancelText).toBe('NO, CANCEL');
    });


    it('should not remove unit on cancel', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      openSpy.and.returnValue(dialogRefSpy);
      component.onDeleteUnit({ action: 'delete', row: mockUnit1 });
      tick();
      expect(c.unitList().length).toBe(2);
    }));

    it('should select next unit when selected unit is deleted', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      openSpy.and.returnValue(dialogRefSpy);
      component.onDeleteUnit({ action: 'delete', row: mockUnit1 });
      tick();
      expect(c.selectedUnit()?.unitId).toBe('W454510070221');
    }));

    it('should not open dialog for non-delete action', () => {
      component.onDeleteUnit({ action: 'edit', row: mockUnit1 });
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should clear state when all units are deleted', fakeAsync(() => {
      c.unitList.set([mockUnit1]);
      c.selectedUnit.set(mockUnit1);
      setNotes([{ noteSeq: 1, noteText: 'test', author: '', timestamp: '', isEditable: true }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      openSpy.and.returnValue(dialogRefSpy);
      component.onDeleteUnit({ action: 'delete', row: mockUnit1 });
      tick();

      expect(c.unitList().length).toBe(0);
      expect(c.selectedUnit()).toBeNull();
      expect(c.existingNotes()).toEqual([]);
      expect(c.pendingNewNotes()).toEqual([]);
      expect(component.noteTextControl.value).toBe('');
    }));

  });

  // ── Note Navigation ─────────────────────────────────────────────────────

  describe('Note Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      setNotes([
        { noteSeq: 1, noteText: 'Note 1', author: 'User A', timestamp: '01-JAN-2024  10:00', isEditable: false },
        { noteSeq: 2, noteText: 'Note 2', author: 'User A', timestamp: '01-JAN-2024  10:05', isEditable: false },
        { noteSeq: 3, noteText: '', author: 'User B', timestamp: '14-JUN-2026  08:00', isEditable: true },
      ]);
      c.currentNoteIndex.set(0);
      component.noteTextControl.setValue('Note 1');
    });



    it('should navigate to previous note and load its text', () => {
      c.currentNoteIndex.set(1);
      component.noteTextControl.setValue('Note 2');
      component.onPreviousNote();
      expect(c.currentNoteIndex()).toBe(0);
      expect(component.noteTextControl.value).toBe('Note 1');
    });

    it('should navigate to next note and load its text', () => {
      c.currentNoteIndex.set(0);
      component.noteTextControl.setValue('Note 1');
      component.onNextNote();
      expect(c.currentNoteIndex()).toBe(1);
      expect(component.noteTextControl.value).toBe('Note 2');
    });

    it('should not go before first note', () => {
      c.currentNoteIndex.set(0);
      component.onPreviousNote();
      expect(c.currentNoteIndex()).toBe(0);
    });

    it('should not go past last note', () => {
      c.currentNoteIndex.set(2);
      component.onNextNote();
      expect(c.currentNoteIndex()).toBe(2);
    });

    it('should save editable note text before navigating away', () => {
      c.currentNoteIndex.set(2);
      component.noteTextControl.setValue('Newly typed text');
      component.onPreviousNote();
      expect(c.notes()[2].noteText).toBe('Newly typed text');
    });

    it('should not save read-only note text on navigation', () => {
      c.currentNoteIndex.set(0);
      component.noteTextControl.setValue('Modified read-only');
      component.onNextNote();
      expect(c.notes()[0].noteText).toBe('Note 1');
    });
  });

  // ── Computed Properties ─────────────────────────────────────────────────

  describe('Computed Properties', () => {
    beforeEach(() => fixture.detectChanges());

    it('currentNote should return note at current index', () => {
      setNotes([
        { noteSeq: 1, noteText: 'A', author: '', timestamp: '', isEditable: true },
      ]);
      c.currentNoteIndex.set(0);
      expect(c.currentNote()?.noteText).toBe('A');
    });

    it('currentNote should return null when notes are empty', () => {
      setNotes([]);
      expect(c.currentNote()).toBeNull();
    });

    it('canGoPrevious should be false at index 0', () => {
      c.currentNoteIndex.set(0);
      expect(c.canGoPrevious()).toBeFalse();
    });

    it('canGoPrevious should be true at index > 0', () => {
      setNotes([
        { noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: false },
        { noteSeq: 2, noteText: '', author: '', timestamp: '', isEditable: true },
      ]);
      c.currentNoteIndex.set(1);
      expect(c.canGoPrevious()).toBeTrue();
    });

    it('canGoNext should be false at last index', () => {
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      c.currentNoteIndex.set(0);
      expect(c.canGoNext()).toBeFalse();
    });

    it('canGoNext should be true when not at last index', () => {
      setNotes([
        { noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: false },
        { noteSeq: 2, noteText: '', author: '', timestamp: '', isEditable: true },
      ]);
      c.currentNoteIndex.set(0);
      expect(c.canGoNext()).toBeTrue();
    });

    it('isNoteEditable should be true for editable note with access', () => {
      c.canAddNotes.set(true);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      c.currentNoteIndex.set(0);
      expect(c.isNoteEditable()).toBeTrue();
    });

    it('isNoteEditable should be false for read-only note', () => {
      c.canAddNotes.set(true);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: false }]);
      c.currentNoteIndex.set(0);
      expect(c.isNoteEditable()).toBeFalse();
    });

    it('isNoteEditable should be false when access denied', () => {
      c.canAddNotes.set(false);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      c.currentNoteIndex.set(0);
      expect(c.isNoteEditable()).toBeFalse();
    });

    it('isNoteEditable should be false when currentNote is null', () => {
      c.canAddNotes.set(true);
      setNotes([]);
      c.currentNoteIndex.set(0);
      expect(c.isNoteEditable()).toBeFalse();
    });

    it('should set noteTextValue to empty when noteTextControl emits null', fakeAsync(() => {
      component.noteTextControl.setValue(null as any);
      tick();
      expect(c.noteTextValue()).toBe('');
    }));

    it('canSubmit should be false with no units', () => {
      c.canAddNotes.set(true);
      c.unitList.set([]);
      component.noteTextControl.setValue('Some note');
      expect(c.canSubmit()).toBeFalse();
    });

    it('canSubmit should be false with no note content', () => {
      c.canAddNotes.set(true);
      c.unitList.set([mockUnit1]);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      component.noteTextControl.setValue('');
      expect(c.canSubmit()).toBeFalse();
    });

    it('canSubmit should be false when access denied', () => {
      c.canAddNotes.set(false);
      c.unitList.set([mockUnit1]);
      component.noteTextControl.setValue('Some note');
      expect(c.canSubmit()).toBeFalse();
    });

    it('canSubmit should be true with units, note content, and access', () => {
      c.canAddNotes.set(true);
      c.unitList.set([mockUnit1]);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      component.noteTextControl.setValue('Some note');
      expect(c.canSubmit()).toBeTrue();
    });
  });

  // ── Add Another Note ────────────────────────────────────────────────────

  describe('Add Another Note', () => {
    beforeEach(() => {
      fixture.detectChanges();
      setNotes([{ noteSeq: 1, noteText: '', author: 'NITOR1', timestamp: '14-JUN-2026  08:00', isEditable: true }]);
      c.currentNoteIndex.set(0);
      component.noteTextControl.setValue('First note text');
    });

    it('should add a new editable note', () => {
      component.onAddAnotherNote();
      expect(c.notes().length).toBe(2);
      expect(c.notes()[1].isEditable).toBeTrue();
      expect(c.notes()[1].noteText).toBe('');
    });

    it('should increment noteSeq for new note', () => {
      component.onAddAnotherNote();
      expect(c.notes()[1].noteSeq).toBe(2);
    });

    it('should set correct noteSeq when existing notes present', () => {
      setNotes([
        { noteSeq: 1, noteText: 'Existing', author: '', timestamp: '', isEditable: false },
        { noteSeq: 2, noteText: 'Existing 2', author: '', timestamp: '', isEditable: false },
        { noteSeq: 3, noteText: '', author: '', timestamp: '', isEditable: true },
      ]);
      c.currentNoteIndex.set(2);
      component.noteTextControl.setValue('New note');
      component.onAddAnotherNote();
      expect(c.notes()[3].noteSeq).toBe(4);
    });

    it('should move index to new note', () => {
      component.onAddAnotherNote();
      expect(c.currentNoteIndex()).toBe(1);
    });

    it('should clear textarea for new note', () => {
      component.onAddAnotherNote();
      expect(component.noteTextControl.value).toBe('');
    });

    it('should save current note text before adding new one', () => {
      component.onAddAnotherNote();
      expect(c.notes()[0].noteText).toBe('First note text');
    });

    it('should use Unknown author when currentUserName is empty', () => {
      c.currentUserName.set('');
      component.onAddAnotherNote();
      const newNote = c.notes()[1];
      expect(newNote.author).toBe('Unknown');
    });
  });

  // ── Submit ──────────────────────────────────────────────────────────────

  describe('Submit', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.unitList.set([mockUnit1, mockUnit2]);
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      c.currentNoteIndex.set(0);
      component.noteTextControl.setValue('Test note for all units');
    });

    it('should call createNotes with all unit IDs', fakeAsync(() => {
      component.onSubmit();
      tick();
      expect(apiServiceSpy.createNotes).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitIds: ['W633324111801', 'W454510070221'],
          note: 'Test note for all units',
          notesTable: 'UNITS',
        }),
      );
    }));


    it('should reset form after successful submit', fakeAsync(() => {
      component.onSubmit();
      tick();
      expect(c.unitList().length).toBe(0);
      expect(c.selectedUnit()).toBeNull();
      expect(c.notes()).toEqual([]);
    }));


    it('should submit multiple new notes sequentially', fakeAsync(() => {
      setNotes([
        { noteSeq: 1, noteText: 'Existing read-only', author: '', timestamp: '', isEditable: false },
        { noteSeq: 2, noteText: 'New note 1', author: '', timestamp: '', isEditable: true },
        { noteSeq: 3, noteText: 'New note 2', author: '', timestamp: '', isEditable: true },
      ]);
      component.noteTextControl.setValue('New note 2');
      c.currentNoteIndex.set(2);

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createNotes).toHaveBeenCalledTimes(2);
      expect(apiServiceSpy.createNotes.calls.argsFor(0)[0]).toEqual(
        jasmine.objectContaining({ note: 'New note 1' }),
      );
      expect(apiServiceSpy.createNotes.calls.argsFor(1)[0]).toEqual(
        jasmine.objectContaining({ note: 'New note 2' }),
      );
    }));

    it('should only submit editable notes with content', fakeAsync(() => {
      setNotes([
        { noteSeq: 1, noteText: 'Existing', author: '', timestamp: '', isEditable: false },
        { noteSeq: 2, noteText: 'New note', author: '', timestamp: '', isEditable: true },
        { noteSeq: 3, noteText: '', author: '', timestamp: '', isEditable: true },
      ]);
      c.currentNoteIndex.set(2);
      component.noteTextControl.setValue('');

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createNotes).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.createNotes).toHaveBeenCalledWith(
        jasmine.objectContaining({ note: 'New note' }),
      );
    }));



    it('should reject submit with empty unit list', () => {
      c.unitList.set([]);
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('unit'));
      expect(apiServiceSpy.createNotes).not.toHaveBeenCalled();
    });

    it('should reject submit with no new note content', () => {
      component.noteTextControl.setValue('');
      setNotes([{ noteSeq: 1, noteText: '', author: '', timestamp: '', isEditable: true }]);
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('note'));
      expect(apiServiceSpy.createNotes).not.toHaveBeenCalled();
    });

    it('should set isSubmitting during API call', fakeAsync(() => {
      const subj = new Subject<any>();
      apiServiceSpy.createNotes.and.returnValue(subj);
      component.onSubmit();
      expect(c.isSubmitting()).toBeTrue();
      subj.next({ success: true, message: '', statusCode: 201, data: [{ noteIds: [1], unitCount: 1, noteSeqCount: 1 }] });
      subj.complete();
      tick();
      expect(c.isSubmitting()).toBeFalse();
    }));

    it('should show error when createNotes returns failed response', fakeAsync(() => {
      apiServiceSpy.createNotes.and.returnValue(
        of({ success: false, message: 'DB error', statusCode: 500, data: [] }),
      );
      component.onSubmit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('DB error');
      expect(c.isSubmitting()).toBeFalse();
    }));

    it('should show error and reset isSubmitting when createNotes throws', fakeAsync(() => {
      apiServiceSpy.createNotes.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.isSubmitting()).toBeFalse();
    }));

    it('should show default error when createNotes returns failed with empty message', fakeAsync(() => {
      apiServiceSpy.createNotes.and.returnValue(
        of({ success: false, message: '', statusCode: 500, data: [] }),
      );
      component.onSubmit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save notes.');
    }));
  });

  // ── Chapter Changes ─────────────────────────────────────────────────────

  describe('Chapter Changes', () => {
    it('should reset all state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      c.unitList.set([mockUnit1]);
      c.selectedUnit.set(mockUnit1);
      setNotes([{ noteSeq: 1, noteText: 'test', author: '', timestamp: '', isEditable: true }]);
      component.noteTextControl.setValue('some text');

      chapterChangedSubject.next();
      tick();

      expect(c.unitList().length).toBe(0);
      expect(c.selectedUnit()).toBeNull();
      expect(c.notes()).toEqual([]);
      expect(component.noteTextControl.value).toBe('');
    }));

  });

  // ── Component Lifecycle ─────────────────────────────────────────────────
  // ── Unit Table Config ───────────────────────────────────────────────────

  describe('Unit Table Config', () => {

    it('should have delete row action', () => {
      const actions = component.unitTableConfig.rowActions;
      expect(actions!.length).toBe(1);
      expect(actions![0].action).toBe('delete');
      expect(actions![0].icon).toBe('delete');
    });

    it('should have row highlight enabled', () => {
      expect(component.unitTableConfig.enableRowHighlight).toBeTrue();
    });

    it('should format collection date', () => {
      const formatter = component.unitTableConfig.columns[1].valueFormatter!;
      const result = formatter('2024-11-18T00:00:00', {} as any);
      expect(result).toBe('18-NOV-2024');
    });

    it('should return dash for null collection date', () => {
      const formatter = component.unitTableConfig.columns[1].valueFormatter!;
      expect(formatter(null, {} as any)).toBe('-');
    });

    it('should return empty string for empty date in formatApiDate', () => {
      fixture = TestBed.createComponent(PlaceNotesOnMultipleUnitsComponent);
      c = fixture.componentInstance;
      expect(c.formatApiDate('')).toBe('');
    });

  });

  // ── Page Header ─────────────────────────────────────────────────────────

  describe('Page Header', () => {
    it('should start with empty header config', () => {
      expect(component.headerConfig.breadcrumbs).toEqual([]);
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should update header config when pageHeaderData changes', fakeAsync(() => {
      fixture.detectChanges();
      const pageDataSignal = pageHeaderServiceSpy.pageHeaderData as any;
      pageDataSignal.set({ title: 'Place Notes on Multiple Units', subtitle: 'Manage notes across selected units.' });
      tick();
      fixture.detectChanges();
      expect(component.headerConfig.title).toBe('Place Notes on Multiple Units');
      expect(component.headerConfig.subtitle).toBe('Manage notes across selected units.');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Place Notes on Multiple Units');
    }));

    it('should default subtitle to empty string when pageHeaderData has no subtitle', fakeAsync(() => {
      fixture.detectChanges();
      const pageDataSignal = pageHeaderServiceSpy.pageHeaderData as any;
      pageDataSignal.set({ title: 'Test Title' });
      tick();
      fixture.detectChanges();
      expect(component.headerConfig.subtitle).toBe('');
    }));
  });
});
