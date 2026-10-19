/**
 * Notes by Date Range Query Component Tests
 * JIRA: MLT-11886
 * Mnemonic: NOTEQ
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotesQueryComponent } from './notes-query.component';
import { NotesQueryService } from './services/notes-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  NoteResultDto,
  NotesQueryResponseDto,
  UserNoteCountDto,
  ProgramNoteCountDto,
  UserLovItemDto,
  ProgramLovItemDto
} from './models/notes-query.model';

describe('NotesQueryComponent', () => {
  let component: NotesQueryComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let c: any; // alias for accessing protected members in tests
  let fixture: ComponentFixture<NotesQueryComponent>;
  let notesQueryServiceSpy: jasmine.SpyObj<NotesQueryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockNotes: NoteResultDto[] = [
    {
      insertUser: 'USER01',
      programId: 'PROG01',
      noteId: 'NOTE001',
      noteSequence: 1,
      note: 'Test note 1',
      insertDate: '2024-01-15T10:30:00Z',
      userName: 'Doe, John',
      formattedDate: '01-15-2024 10:30:00'
    },
    {
      insertUser: 'USER02',
      programId: 'PROG02',
      noteId: 'NOTE002',
      noteSequence: 1,
      note: 'Test note 2',
      insertDate: '2024-01-16T11:00:00Z',
      userName: 'Smith, Jane',
      formattedDate: '01-16-2024 11:00:00'
    }
  ];

  const mockUserCounts: UserNoteCountDto[] = [
    { userId: 'USER01', count: 5 },
    { userId: 'USER02', count: 3 }
  ];

  const mockProgramCounts: ProgramNoteCountDto[] = [
    { programId: 'PROG01', count: 4 },
    { programId: 'PROG02', count: 4 }
  ];

  const mockResponse: NotesQueryResponseDto = {
    notes: mockNotes,
    userCounts: mockUserCounts,
    programCounts: mockProgramCounts,
    totalNotes: 8,
    totalCount: 8
  };

  beforeEach(() => {

    notesQueryServiceSpy = jasmine.createSpyObj('NotesQueryService', ['searchNotes', 'getUsers', 'getPrograms']);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });

    notesQueryServiceSpy.searchNotes.and.returnValue(of(mockResponse));
    notesQueryServiceSpy.getUsers.and.returnValue(of([
      { userId: 'USER01', name: 'Doe, John' },
      { userId: 'USER02', name: 'Smith, Jane' }
    ]));
    notesQueryServiceSpy.getPrograms.and.returnValue(of([
      { programId: 'PROG01', description: 'Program One' },
      { programId: 'PROG02', description: 'Program Two' }
    ]));



      TestBed.configureTestingModule({
      imports: [NotesQueryComponent, NoopAnimationsModule],
      providers: [
        { provide: NotesQueryService, useValue: notesQueryServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    


      notesQueryServiceSpy.searchNotes.calls.reset();


      notesQueryServiceSpy.getUsers.calls.reset();


      notesQueryServiceSpy.getPrograms.calls.reset();


      notesQueryServiceSpy.searchNotes.and.returnValue(of(mockResponse));


    fixture = TestBed.createComponent(NotesQueryComponent);
    component = fixture.componentInstance;
    c = component;


    });

  describe('Initialization', () => {




    it('should have empty notes on init', () => {
      fixture.detectChanges();
      expect(c.notes()).toEqual([]);
    });


  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });













    it('should show date range error when toDate is before fromDate', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-31'),
        toDate: new Date('2024-01-01')
      });
      component.filterForm.get('toDate')?.markAsTouched();
      c.submitted.set(true);
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should update notes signal on successful search', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });

      component.onRetrieve();
      tick();

      expect(c.notes()).toEqual(mockNotes);
      expect(c.userCounts()).toEqual(mockUserCounts);
      expect(c.programCounts()).toEqual(mockProgramCounts);
      expect(c.totalNotes()).toBe(8);
    }));

    it('should not auto-select note on search (full-width table first)', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });

      component.onRetrieve();
      tick();

      expect(c.selectedNote()).toBeNull();
    }));

    it('should include userId filter when provided', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        userId: 'USER01',
        programId: null
      });

      component.onRetrieve();
      tick();

      const callArgs = notesQueryServiceSpy.searchNotes.calls.mostRecent().args[0];
      expect(callArgs.userId).toBe('USER01');
    }));

    it('should include programId filter when provided', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        userId: null,
        programId: 'PROG01'
      });

      component.onRetrieve();
      tick();

      const callArgs = notesQueryServiceSpy.searchNotes.calls.mostRecent().args[0];
      expect(callArgs.programId).toBe('PROG01');
    }));

    it('should disable search criteria after successful retrieval', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('fromDate')?.disabled).toBeTrue();
      expect(component.filterForm.get('toDate')?.disabled).toBeTrue();
      expect(component.filterForm.get('userId')?.disabled).toBeTrue();
      expect(component.filterForm.get('programId')?.disabled).toBeTrue();
    }));


  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form on clear all', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        userId: 'USER01',
        programId: 'PROG01'
      });

      component.onClearAll();

      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.filterForm.get('userId')?.value).toBeNull();
      expect(component.filterForm.get('programId')?.value).toBeNull();
    });

    it('should re-enable disabled form controls on clear all', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('fromDate')?.disabled).toBeTrue();

      component.onClearAll();

      expect(component.filterForm.get('fromDate')?.disabled).toBeFalse();
      expect(component.filterForm.get('toDate')?.disabled).toBeFalse();
      expect(component.filterForm.get('userId')?.disabled).toBeFalse();
      expect(component.filterForm.get('programId')?.disabled).toBeFalse();
    }));

    it('should clear notes data on clear all', () => {
      c.notes.set(mockNotes);
      c.userCounts.set(mockUserCounts);
      c.programCounts.set(mockProgramCounts);
      c.totalNotes.set(8);

      component.onClearAll();

      expect(c.notes()).toEqual([]);
      expect(c.userCounts()).toEqual([]);
      expect(c.programCounts()).toEqual([]);
      expect(c.totalNotes()).toBe(0);
    });

    it('should clear selected note on clear all', () => {
      c.selectedNote.set(mockNotes[0]);

      component.onClearAll();

      expect(c.selectedNote()).toBeNull();
    });
  });

  describe('Note Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.notes.set(mockNotes);
      fixture.detectChanges();
    });

    it('should select note when clicked', () => {
      component.onSelectNote(mockNotes[1]);

      expect(c.selectedNote()).toEqual(mockNotes[1]);
    });

    it('should highlight selected row', () => {
      component.onSelectNote(mockNotes[0]);
      fixture.detectChanges();

      expect(component.isNoteSelected(mockNotes[0])).toBeTrue();
      expect(component.isNoteSelected(mockNotes[1])).toBeFalse();
    });
  });



  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
    });





    it('should clear sort on third click', fakeAsync(() => {
      component.onSort('noteId');
      tick();
      component.onSort('noteId');
      tick();
      component.onSort('noteId');
      tick();

      const callArgs = notesQueryServiceSpy.searchNotes.calls.mostRecent().args[0];
      expect(callArgs.sortColumn).toBeUndefined();
      expect(callArgs.sortOrder).toBeUndefined();
    }));

    it('should reset to first page when sorting changes', fakeAsync(() => {
      component.pageIndex = 2;

      component.onSort('insertUser');
      tick();

      expect(component.pageIndex).toBe(0);
    }));


  });



  describe('Date Formatting', () => {
    it('should format date for display correctly', () => {
      const formatted = component.formatDateForDisplay('2024-01-15T10:30:00Z');
      expect(formatted).toContain('JAN');
      expect(formatted).toContain('2024');
    });

    it('should handle null date for display', () => {
      const formatted = component.formatDateForDisplay(null);
      expect(formatted).toBe('');
    });
  });

  describe('Computed Properties', () => {
    it('should compute isEmpty correctly', () => {
      expect(c.isEmpty()).toBeTrue();

      c.notes.set(mockNotes);
      expect(c.isEmpty()).toBeFalse();
    });

    it('should compute hasData correctly', () => {
      expect(c.hasData()).toBeFalse();

      c.notes.set(mockNotes);
      expect(c.hasData()).toBeTrue();
    });

    it('should compute userOptions from userLovItems', () => {
      c.userLovItems.set([
        { userId: 'USER01', name: 'Doe, John' },
        { userId: 'USER02', name: 'Smith, Jane' }
      ]);

      const options = c.userOptions();
      expect(options.length).toBe(2);
      expect(options[0].userId).toBe('USER01');
      expect(options[0].name).toBe('Doe, John');
    });

    it('should compute programOptions from programLovItems', () => {
      c.programLovItems.set([
        { programId: 'PROG01', description: 'Program One' },
        { programId: 'PROG02', description: 'Program Two' }
      ]);

      const options = c.programOptions();
      expect(options.length).toBe(2);
      expect(options[0].programId).toBe('PROG01');
      expect(options[0].description).toBe('Program One');
    });
  });



  describe('Loading State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should not disable retrieve button during sort loading', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
      c.loading.set(true);
      c.retrieveLoading.set(false);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.retrieve-btn'));
      expect(button.nativeElement.disabled).toBeFalse();
    });

    it('should not disable clear all button during sort loading', () => {
      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
      c.notes.set(mockNotes);
      c.loading.set(true);
      c.retrieveLoading.set(false);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.clear-all-btn'));
      expect(button.nativeElement.disabled).toBeFalse();
    });
  });
});
