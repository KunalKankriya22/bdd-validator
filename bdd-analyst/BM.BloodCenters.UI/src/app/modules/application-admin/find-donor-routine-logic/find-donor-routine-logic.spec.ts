import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { FindDonorRoutineLogic } from './find-donor-routine-logic';
import { DonorRoutineLogicService } from './services/donor-routine-logic.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DonorSearchResult,
  SessionResult,
  MatchGradeSummary,
  DonorSearchResponse
} from './models/donor-routine-logic.model';

// ── helpers ──────────────────────────────────────────────────────────

function createMockDonor(overrides?: Partial<DonorSearchResult>): DonorSearchResult {
  return {
    sessionId: 'session-1',
    donorId: 'donor-1',
    lastName: 'DOE',
    firstName: 'JOHN',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    bloodType: 'O+',
    soundexKey: 'D000',
    grade: 1,
    dgmId: 100,
    insertDate: '2025-01-01T00:00:00Z',
    chapterId: 'CH1',
    programId: 'PG1',
    ...overrides
  };
}

function createMockSessionResult(overrides?: Partial<SessionResult>): SessionResult {
  return {
    sessionId: 'session-1',
    donorId: 'donor-1',
    lastName: 'DOE',
    firstName: 'JOHN',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    bloodType: 'O+',
    soundexKey: 'D000',
    grade: 1,
    dgmId: 100,
    insertDate: '2025-01-01T00:00:00Z',
    chapterId: 'CH1',
    programId: 'PG1',
    ...overrides
  };
}

function createMockMatchGradeSummary(overrides?: Partial<MatchGradeSummary>): MatchGradeSummary {
  return {
    sessionId: 'session-1',
    totalDonors: 3,
    grade1Count: 1,
    grade2Count: 1,
    grade3Count: 1,
    grade4Count: 0,
    grade5Count: 0,
    results: [
      createMockSessionResult({ grade: 1, donorId: 'donor-1' }),
      createMockSessionResult({ grade: 2, donorId: 'donor-2', sessionId: 'session-2' }),
      createMockSessionResult({ grade: 3, donorId: 'donor-3', sessionId: 'session-3' })
    ],
    ...overrides
  };
}

function createMockDonorSearchResponse(overrides?: Partial<DonorSearchResponse>): DonorSearchResponse {
  return {
    sessionId: 'session-1',
    totalDonors: 1,
    grade1Count: 1,
    grade2Count: 0,
    grade3Count: 0,
    grade4Count: 0,
    grade5Count: 0,
    searchCriteria: { insertUser: 'test' },
    donors: [createMockDonor()],
    ...overrides
  };
}

// ── tests ────────────────────────────────────────────────────────────

describe('FindDonorRoutineLogic', () => {
  let component: FindDonorRoutineLogic;
  let fixture: ComponentFixture<FindDonorRoutineLogic>;
  let mockDonorRoutineLogicService: jasmine.SpyObj<DonorRoutineLogicService>;
  let mockPageHeaderService: any;

  beforeEach(async () => {
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null)
    });

    mockDonorRoutineLogicService = jasmine.createSpyObj('DonorRoutineLogicService', [
      'getDonorRoutineLogic',
      'searchDonors',
      'getSessionResults',
      'getSessionResultsBySessionId'
    ]);
    mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(of({ data: [], total: 0 }));

    await TestBed.configureTestingModule({
      imports: [FindDonorRoutineLogic, MatDialogModule],
      providers: [
        { provide: DonorRoutineLogicService, useValue: mockDonorRoutineLogicService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FindDonorRoutineLogic);
    component = fixture.componentInstance;
  });

  // ── existing tests ─────────────────────────────────────────────────

  describe('formatDate', () => {

    it('should return "-" for null-like falsy value', () => {
      expect(component.formatDate(null as unknown as string)).toBe('-');
    });

    it('should format date-only ISO string correctly', () => {
      expect(component.formatDate('1960-07-14')).toBe('14-JUL-1960');
    });

    it('should format datetime ISO string (with time) without shifting the date', () => {
      // Regression: new Date("1960-07-14T00:00:00.002") was parsed as UTC and shifted
      // to the previous day in UTC+ timezones. The fix parses the date part directly.
      expect(component.formatDate('1960-07-14T00:00:00.002')).toBe('14-JUL-1960');
    });

    it('should format datetime ISO string with Z suffix without shifting the date', () => {
      expect(component.formatDate('1990-01-01T00:00:00.000Z')).toBe('01-JAN-1990');
    });

    it('should pad single-digit day with leading zero', () => {
      expect(component.formatDate('2000-03-05')).toBe('05-MAR-2000');
    });

    it('should return month in uppercase abbreviated form', () => {
      expect(component.formatDate('2024-12-25')).toBe('25-DEC-2024');
    });
  });

  describe('insertDate valueFormatter', () => {
    let insertDateFormatter: (value: unknown) => string;

    beforeEach(() => {
      const insertDateColumn = component.tableConfig.columns.find(c => c.key === 'insertDate');
      insertDateFormatter = insertDateColumn!.valueFormatter as (value: unknown) => string;
    });

    it('should return "-" for null value', () => {
      expect(insertDateFormatter(null)).toBe('-');
    });

    it('should return "-" for undefined value', () => {
      expect(insertDateFormatter(undefined)).toBe('-');
    });

    it('should format datetime string without shifting the date', () => {
      expect(insertDateFormatter('2025-08-14T15:41:52Z')).toBe('14-AUG-2025');
    });

    it('should format datetime string without Z suffix without shifting the date', () => {
      // Regression: same timezone bug as formatDate
      expect(insertDateFormatter('2025-08-14T00:00:00.002')).toBe('14-AUG-2025');
    });

    it('should pad single-digit day with leading zero', () => {
      expect(insertDateFormatter('2025-03-05T10:00:00')).toBe('05-MAR-2025');
    });
  });

  // ── new tests ──────────────────────────────────────────────────────

  describe('component initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct initial headerConfig', () => {
      expect(component.headerConfig.title).toBe('Find Donor Routine Logic');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });

    it('should have correct searchConfig', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Name, Donor ID, DOB or ABO');
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
      expect(component.searchConfig.debounceTime).toBe(300);
      expect(component.searchConfig.minLength).toBe(1);
    });

    it('should have correct tableConfig columns', () => {
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns.map(c => c.key)).toEqual([
        'sessionId', 'donorId', 'grade', 'dgmId', 'insertDate'
      ]);
    });

    it('should have view row action', () => {
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('view');
    });
  });

  describe('ngOnInit / loadInitialDonors', () => {
    it('should call getDonorRoutineLogic on init with default page params', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.ngOnInit();

      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).toHaveBeenCalledWith(300, 0);
    });

    it('should set donors and totalRecords on success', () => {
      const mockSessions: SessionResult[] = [createMockSessionResult()];
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: mockSessions, total: 5 })
      );
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.ngOnInit();

      expect((component as any).donors().length).toBe(1);
      expect((component as any).totalRecords()).toBe(5);
      expect((component as any).initialLoading()).toBe(false);
    });

    it('should auto-select the first grouped donor on success', () => {
      const mockSessions: SessionResult[] = [
        createMockSessionResult({ sessionId: 'S1', donorId: 'D1' }),
        createMockSessionResult({ sessionId: 'S2', donorId: 'D1' }),
        createMockSessionResult({ sessionId: 'S3', donorId: 'D2' })
      ];
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: mockSessions, total: 3 })
      );
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.ngOnInit();

      const selected = (component as any).selectedDonor();
      expect(selected).not.toBeNull();
      expect(selected.donorId).toBe('D1');
      expect(mockDonorRoutineLogicService.getSessionResults).toHaveBeenCalledWith('S1');
    });

    it('should not auto-select when no donors returned', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.ngOnInit();

      expect((component as any).selectedDonor()).toBeNull();
      expect(mockDonorRoutineLogicService.getSessionResults).not.toHaveBeenCalled();
    });

    it('should handle error from getDonorRoutineLogic', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.ngOnInit();

      expect((component as any).error()).toBe('Server error');
      expect((component as any).initialLoading()).toBe(false);
      expect((component as any).donors()).toEqual([]);
    });

    it('should set generic error message when error has no message', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        throwError(() => ({}))
      );

      component.ngOnInit();

      expect((component as any).error()).toBe('Failed to load donor records');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onSearch', () => {
    it('should set searchTerm to the provided value', () => {
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        of(createMockDonorSearchResponse({ donors: [] }))
      );

      component.onSearch('TEST');

      expect((component as any).searchTerm()).toBe('TEST');
    });

    it('should reload initial donors when search is cleared with empty string', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.onSearch('');

      expect((component as any).currentPage()).toBe(0);
      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).toHaveBeenCalledWith(300, 0);
    });

    it('should reload initial donors when search is whitespace only', () => {
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [], total: 0 })
      );

      component.onSearch('   ');

      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).toHaveBeenCalled();
    });

    it('should call searchDonors and set donors on success', () => {
      const mockDonors = [createMockDonor()];
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        of(createMockDonorSearchResponse({ donors: mockDonors }))
      );
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.onSearch('SMITH');

      expect(mockDonorRoutineLogicService.searchDonors).toHaveBeenCalled();
      expect((component as any).donors()).toEqual(mockDonors);
      expect((component as any).searchLoading()).toBe(false);
    });

    it('should auto-select first grouped donor on search success', () => {
      const mockDonors = [
        createMockDonor({ donorId: 'D1', sessionId: 'S1' }),
        createMockDonor({ donorId: 'D2', sessionId: 'S2' })
      ];
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        of(createMockDonorSearchResponse({ donors: mockDonors }))
      );
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.onSearch('DOE');

      expect((component as any).selectedDonor()).not.toBeNull();
      expect((component as any).selectedDonor().donorId).toBe('D1');
      expect(mockDonorRoutineLogicService.getSessionResults).toHaveBeenCalledWith('S1');
    });

    it('should clear selected state when search returns no results', () => {
      // Pre-populate some state
      (component as any).selectedDonor.set(createMockDonor());
      (component as any).matchGradeSummary.set(createMockMatchGradeSummary());
      (component as any).sessionResults.set([createMockSessionResult()]);

      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        of(createMockDonorSearchResponse({ donors: [] }))
      );

      component.onSearch('NONEXISTENT');

      expect((component as any).selectedDonor()).toBeNull();
      expect((component as any).matchGradeSummary()).toBeNull();
      expect((component as any).sessionResults()).toEqual([]);
    });

    it('should handle search error', () => {
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        throwError(() => new Error('Search failed'))
      );

      component.onSearch('ERROR');

      expect((component as any).error()).toBe('Search failed');
      expect((component as any).searchLoading()).toBe(false);
      expect((component as any).donors()).toEqual([]);
      expect((component as any).selectedDonor()).toBeNull();
      expect((component as any).matchGradeSummary()).toBeNull();
      expect((component as any).sessionResults()).toEqual([]);
    });

    it('should set generic error message on search error without message', () => {
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        throwError(() => ({}))
      );

      component.onSearch('ERROR');

      expect((component as any).error()).toBe('Failed to search donors');
    });

    it('should set searchLoading to true before API call', () => {
      // Use a Subject to control when the observable emits
      let searchLoading = false;
      mockDonorRoutineLogicService.searchDonors.and.callFake(() => {
        searchLoading = (component as any).searchLoading();
        return of(createMockDonorSearchResponse({ donors: [] }));
      });

      component.onSearch('SMITH');

      expect(searchLoading).toBe(true);
    });

    it('should clear error before API call', () => {
      (component as any).error.set('previous error');
      mockDonorRoutineLogicService.searchDonors.and.returnValue(
        of(createMockDonorSearchResponse({ donors: [] }))
      );

      component.onSearch('SMITH');

      expect((component as any).error()).toBeNull();
    });
  });

  describe('parseSearchTerm', () => {
    it('should detect ABO blood type "A+"', () => {
      const result = (component as any).parseSearchTerm('A+');
      expect(result).toEqual({ bloodType: 'A+' });
    });

    it('should detect ABO blood type "O-"', () => {
      const result = (component as any).parseSearchTerm('O-');
      expect(result).toEqual({ bloodType: 'O-' });
    });

    it('should detect ABO blood type "AB"', () => {
      const result = (component as any).parseSearchTerm('AB');
      expect(result).toEqual({ bloodType: 'AB' });
    });

    it('should detect ABO blood type "B"', () => {
      const result = (component as any).parseSearchTerm('B');
      expect(result).toEqual({ bloodType: 'B' });
    });

    it('should detect numeric ISBT code "06"', () => {
      const result = (component as any).parseSearchTerm('06');
      expect(result).toEqual({ bloodType: '06' });
    });

    it('should detect single-digit ISBT code "5"', () => {
      const result = (component as any).parseSearchTerm('5');
      expect(result).toEqual({ bloodType: '5' });
    });

    it('should convert ABO blood type to uppercase', () => {
      const result = (component as any).parseSearchTerm('ab');
      expect(result).toEqual({ bloodType: 'AB' });
    });

    it('should parse full date MM/DD/YYYY and format as DD-MON-YYYY', () => {
      const result = (component as any).parseSearchTerm('09/23/1966');
      expect(result).toEqual({ searchItem: '23-SEP-1966' });
    });

    it('should parse full date with dashes MM-DD-YYYY', () => {
      const result = (component as any).parseSearchTerm('01-15-2000');
      expect(result).toEqual({ searchItem: '15-JAN-2000' });
    });

    it('should fall through to default for invalid full date', () => {
      const result = (component as any).parseSearchTerm('13/32/2020');
      expect(result).toEqual({ searchItem: '13/32/2020' });
    });

    it('should detect partial date MM/DD', () => {
      const result = (component as any).parseSearchTerm('09/23');
      expect(result).toEqual({ searchItem: '09/23' });
    });

    it('should detect partial date with dashes MM-DD', () => {
      const result = (component as any).parseSearchTerm('1-5');
      expect(result).toEqual({ searchItem: '1-5' });
    });

    it('should return uppercase searchItem for default text', () => {
      const result = (component as any).parseSearchTerm('Smith');
      expect(result).toEqual({ searchItem: 'SMITH' });
    });

    it('should trim whitespace from search text', () => {
      const result = (component as any).parseSearchTerm('  Smith  ');
      expect(result).toEqual({ searchItem: 'SMITH' });
    });

    it('should treat 3-digit numbers as default text (not ABO)', () => {
      const result = (component as any).parseSearchTerm('123');
      expect(result).toEqual({ searchItem: '123' });
    });
  });

  describe('onDonorSelect / loadMatchGradeSummary', () => {
    it('should set selectedDonor when a donor is selected', () => {
      const donor = createMockDonor();
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.onDonorSelect(donor);

      expect((component as any).selectedDonor()).toBe(donor);
    });

    it('should load match grade summary for the selected donor', () => {
      const donor = createMockDonor({ sessionId: 'S42' });
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        of(createMockMatchGradeSummary())
      );

      component.onDonorSelect(donor);

      expect(mockDonorRoutineLogicService.getSessionResults).toHaveBeenCalledWith('S42');
    });

    it('should set matchGradeSummary and sessionResults on success', () => {
      const summary = createMockMatchGradeSummary();
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(of(summary));

      component.onDonorSelect(createMockDonor());

      expect((component as any).matchGradeSummary()).toBe(summary);
      expect((component as any).sessionResults()).toBe(summary.results);
      expect((component as any).loading()).toBe(false);
    });

    it('should set loading to true before API call', () => {
      let loadingDuringCall = false;
      mockDonorRoutineLogicService.getSessionResults.and.callFake(() => {
        loadingDuringCall = (component as any).loading();
        return of(createMockMatchGradeSummary());
      });

      component.onDonorSelect(createMockDonor());

      expect(loadingDuringCall).toBe(true);
    });

    it('should handle loadMatchGradeSummary error', () => {
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        throwError(() => new Error('Session load failed'))
      );

      component.onDonorSelect(createMockDonor());

      expect((component as any).error()).toBe('Session load failed');
      expect((component as any).loading()).toBe(false);
      expect((component as any).matchGradeSummary()).toBeNull();
      expect((component as any).sessionResults()).toEqual([]);
    });

    it('should use fallback error message for loadMatchGradeSummary error', () => {
      mockDonorRoutineLogicService.getSessionResults.and.returnValue(
        throwError(() => ({}))
      );

      component.onDonorSelect(createMockDonor());

      expect((component as any).error()).toBe('Failed to load match grade summary');
    });
  });

  describe('onGradeFilterChange', () => {
    it('should set the selectedGrade signal', () => {
      component.onGradeFilterChange('3');
      expect((component as any).selectedGrade()).toBe('3');
    });

    it('should set back to all', () => {
      component.onGradeFilterChange('2');
      component.onGradeFilterChange('all');
      expect((component as any).selectedGrade()).toBe('all');
    });
  });

  describe('loadMoreDonors', () => {
    beforeEach(() => {
      // Set up state so hasMoreRecords returns true
      (component as any).searchTerm.set('');
      (component as any).donors.set([createMockDonor()]);
      (component as any).totalRecords.set(1000);
    });

    it('should return early if already loading', () => {
      (component as any).loadingMore.set(true);
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();

      component.loadMoreDonors();

      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).not.toHaveBeenCalled();
    });

    it('should return early if no more records', () => {
      (component as any).totalRecords.set(1); // equal to donors length
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();

      component.loadMoreDonors();

      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).not.toHaveBeenCalled();
    });

    it('should return early if search is active', () => {
      (component as any).searchTerm.set('active search');
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();

      component.loadMoreDonors();

      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).not.toHaveBeenCalled();
    });

    it('should increment currentPage and call getDonorRoutineLogic', () => {
      (component as any).currentPage.set(0);
      mockDonorRoutineLogicService.getDonorRoutineLogic.calls.reset();
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [], total: 1000 })
      );

      component.loadMoreDonors();

      expect((component as any).currentPage()).toBe(1);
      expect(mockDonorRoutineLogicService.getDonorRoutineLogic).toHaveBeenCalledWith(300, 300);
    });

    it('should append new donors to existing list on success', () => {
      const existingDonor = createMockDonor({ donorId: 'existing' });
      (component as any).donors.set([existingDonor]);
      (component as any).currentPage.set(0);

      const newSession = createMockSessionResult({ donorId: 'new-donor', sessionId: 'S2' });
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        of({ data: [newSession], total: 1000 })
      );

      component.loadMoreDonors();

      const donors = (component as any).donors();
      expect(donors.length).toBe(2);
      expect(donors[0].donorId).toBe('existing');
      expect(donors[1].donorId).toBe('new-donor');
      expect((component as any).loadingMore()).toBe(false);
    });

    it('should handle error and revert page increment', () => {
      (component as any).currentPage.set(0);
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        throwError(() => new Error('Load more failed'))
      );

      component.loadMoreDonors();

      expect((component as any).error()).toBe('Load more failed');
      expect((component as any).loadingMore()).toBe(false);
      expect((component as any).currentPage()).toBe(0); // reverted from 1 to 0
    });

    it('should use fallback error message when error has no message', () => {
      (component as any).currentPage.set(0);
      mockDonorRoutineLogicService.getDonorRoutineLogic.and.returnValue(
        throwError(() => ({}))
      );

      component.loadMoreDonors();

      expect((component as any).error()).toBe('Failed to load more donors');
    });
  });

  describe('onSessionSortChange', () => {
    beforeEach(() => {
      (component as any).sessionResults.set([
        createMockSessionResult({ donorId: 'B-donor', grade: 3 }),
        createMockSessionResult({ donorId: 'A-donor', grade: 1 }),
        createMockSessionResult({ donorId: 'C-donor', grade: 2 })
      ]);
    });

    it('should sort strings ascending by default direction', () => {
      component.onSessionSortChange({ column: 'donorId', direction: 'A' });

      const results = (component as any).sessionResults();
      expect(results[0].donorId).toBe('A-donor');
      expect(results[1].donorId).toBe('B-donor');
      expect(results[2].donorId).toBe('C-donor');
    });

    it('should sort strings descending with D direction', () => {
      component.onSessionSortChange({ column: 'donorId', direction: 'D' });

      const results = (component as any).sessionResults();
      expect(results[0].donorId).toBe('C-donor');
      expect(results[1].donorId).toBe('B-donor');
      expect(results[2].donorId).toBe('A-donor');
    });

    it('should sort numeric values ascending', () => {
      component.onSessionSortChange({ column: 'grade', direction: 'A' });

      const results = (component as any).sessionResults();
      expect(results[0].grade).toBe(1);
      expect(results[1].grade).toBe(2);
      expect(results[2].grade).toBe(3);
    });

    it('should sort numeric values descending', () => {
      component.onSessionSortChange({ column: 'grade', direction: 'D' });

      const results = (component as any).sessionResults();
      expect(results[0].grade).toBe(3);
      expect(results[1].grade).toBe(2);
      expect(results[2].grade).toBe(1);
    });

    it('should place null values at the end when sorting ascending', () => {
      (component as any).sessionResults.set([
        createMockSessionResult({ donorId: 'B' }),
        { ...createMockSessionResult(), donorId: null } as any,
        createMockSessionResult({ donorId: 'A' })
      ]);

      component.onSessionSortChange({ column: 'donorId', direction: 'A' });

      const results = (component as any).sessionResults();
      expect(results[0].donorId).toBe('A');
      expect(results[1].donorId).toBe('B');
      expect(results[2].donorId).toBeNull();
    });

    it('should place null values at the end when sorting descending', () => {
      (component as any).sessionResults.set([
        createMockSessionResult({ donorId: 'A' }),
        { ...createMockSessionResult(), donorId: null } as any,
        createMockSessionResult({ donorId: 'B' })
      ]);

      component.onSessionSortChange({ column: 'donorId', direction: 'D' });

      const results = (component as any).sessionResults();
      expect(results[2].donorId).toBeNull();
    });

    it('should keep both-null items in place', () => {
      (component as any).sessionResults.set([
        { ...createMockSessionResult(), donorId: null } as any,
        { ...createMockSessionResult(), donorId: null } as any
      ]);

      component.onSessionSortChange({ column: 'donorId', direction: 'A' });

      const results = (component as any).sessionResults();
      expect(results.length).toBe(2);
    });

    it('should update tableConfig sortConfig', () => {
      component.onSessionSortChange({ column: 'grade', direction: 'D' });

      expect(component.tableConfig.sortConfig).toEqual({ column: 'grade', direction: 'D' });
    });
  });

  describe('onRowAction', () => {
    it('should call openSessionResultsDialog when action is view', () => {
      spyOn(component as any, 'openSessionResultsDialog');
      const sessionResult = createMockSessionResult();

      component.onRowAction({ action: 'view', row: sessionResult });

      expect((component as any).openSessionResultsDialog).toHaveBeenCalledWith(sessionResult);
    });

    it('should not call openSessionResultsDialog when action is not view', () => {
      spyOn(component as any, 'openSessionResultsDialog');
      const sessionResult = createMockSessionResult();

      component.onRowAction({ action: 'delete', row: sessionResult });

      expect((component as any).openSessionResultsDialog).not.toHaveBeenCalled();
    });
  });

  describe('openSessionResultsDialog', () => {
    it('should lazy-load and open dialog with correct config', async () => {
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open');
      const donor = createMockDonor();
      (component as any).selectedDonor.set(donor);

      const sessionResult = createMockSessionResult();
      await (component as any).openSessionResultsDialog(sessionResult);

      expect(dialog.open).toHaveBeenCalled();
      const callArgs = (dialog.open as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[1].width).toBe('800px');
      expect(callArgs[1].data.sessionResult).toBe(sessionResult);
      expect(callArgs[1].data.donor).toBe(donor);
      expect(callArgs[1].hasBackdrop).toBe(true);
      expect(callArgs[1].autoFocus).toBe('button[aria-label="Close dialog"]');
    });
  });

  describe('getBloodTypeClass', () => {
    it('should return "positive" for blood type with +', () => {
      expect(component.getBloodTypeClass('O+')).toBe('positive');
    });

    it('should return "negative" for blood type with -', () => {
      expect(component.getBloodTypeClass('A-')).toBe('negative');
    });

    it('should return "negative" for blood type without + sign', () => {
      expect(component.getBloodTypeClass('AB')).toBe('negative');
    });

    it('should return empty string for undefined', () => {
      expect(component.getBloodTypeClass(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.getBloodTypeClass('')).toBe('');
    });
  });

  describe('getGenderIcon', () => {
    it('should return "man" for male', () => {
      expect(component.getGenderIcon('M')).toBe('man');
    });

    it('should return "woman" for female', () => {
      expect(component.getGenderIcon('F')).toBe('woman');
    });
  });

  describe('computed signals', () => {
    describe('filteredSessionResults', () => {
      it('should return all results when grade is "all"', () => {
        (component as any).sessionResults.set([
          createMockSessionResult({ grade: 1 }),
          createMockSessionResult({ grade: 2 }),
          createMockSessionResult({ grade: 3 })
        ]);
        (component as any).selectedGrade.set('all');

        expect((component as any).filteredSessionResults().length).toBe(3);
      });

      it('should filter results by specific grade', () => {
        (component as any).sessionResults.set([
          createMockSessionResult({ grade: 1 }),
          createMockSessionResult({ grade: 2 }),
          createMockSessionResult({ grade: 1 })
        ]);
        (component as any).selectedGrade.set('1');

        const filtered = (component as any).filteredSessionResults();
        expect(filtered.length).toBe(2);
        expect(filtered.every((r: any) => r.grade === 1)).toBe(true);
      });

      it('should return empty array when no results match the grade', () => {
        (component as any).sessionResults.set([
          createMockSessionResult({ grade: 1 })
        ]);
        (component as any).selectedGrade.set('5');

        expect((component as any).filteredSessionResults().length).toBe(0);
      });
    });

    describe('hasResults', () => {
      it('should return false when donors array is empty', () => {
        (component as any).donors.set([]);
        expect((component as any).hasResults()).toBe(false);
      });

      it('should return true when donors array has items', () => {
        (component as any).donors.set([createMockDonor()]);
        expect((component as any).hasResults()).toBe(true);
      });
    });

    describe('isEmpty', () => {
      it('should return true when not loading, no donors, and search is active', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(false);
        (component as any).donors.set([]);
        (component as any).searchTerm.set('some search');

        expect((component as any).isEmpty()).toBe(true);
      });

      it('should return false when loading', () => {
        (component as any).searchLoading.set(true);
        (component as any).initialLoading.set(false);
        (component as any).donors.set([]);
        (component as any).searchTerm.set('some search');

        expect((component as any).isEmpty()).toBe(false);
      });

      it('should return false when initialLoading', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(true);
        (component as any).donors.set([]);
        (component as any).searchTerm.set('some search');

        expect((component as any).isEmpty()).toBe(false);
      });

      it('should return false when donors exist', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(false);
        (component as any).donors.set([createMockDonor()]);
        (component as any).searchTerm.set('some search');

        expect((component as any).isEmpty()).toBe(false);
      });

      it('should return false when no search term', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(false);
        (component as any).donors.set([]);
        (component as any).searchTerm.set('');

        expect((component as any).isEmpty()).toBe(false);
      });
    });

    describe('hasDonorSelected', () => {
      it('should return false when no donor selected', () => {
        (component as any).selectedDonor.set(null);
        expect((component as any).hasDonorSelected()).toBe(false);
      });

      it('should return true when donor is selected', () => {
        (component as any).selectedDonor.set(createMockDonor());
        expect((component as any).hasDonorSelected()).toBe(true);
      });
    });

    describe('totalSessionResults', () => {
      it('should return 0 when no summary', () => {
        (component as any).matchGradeSummary.set(null);
        expect((component as any).totalSessionResults()).toBe(0);
      });

      it('should return totalDonors from summary', () => {
        (component as any).matchGradeSummary.set(createMockMatchGradeSummary({ totalDonors: 42 }));
        expect((component as any).totalSessionResults()).toBe(42);
      });
    });

    describe('isLoading', () => {
      it('should return true when searchLoading is true', () => {
        (component as any).searchLoading.set(true);
        (component as any).initialLoading.set(false);
        expect((component as any).isLoading()).toBe(true);
      });

      it('should return true when initialLoading is true', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(true);
        expect((component as any).isLoading()).toBe(true);
      });

      it('should return false when neither is loading', () => {
        (component as any).searchLoading.set(false);
        (component as any).initialLoading.set(false);
        expect((component as any).isLoading()).toBe(false);
      });
    });

    describe('hasMoreRecords', () => {
      it('should return false when search is active', () => {
        (component as any).searchTerm.set('active');
        (component as any).donors.set([createMockDonor()]);
        (component as any).totalRecords.set(100);

        expect((component as any).hasMoreRecords()).toBe(false);
      });

      it('should return true when no search and donors < total', () => {
        (component as any).searchTerm.set('');
        (component as any).donors.set([createMockDonor()]);
        (component as any).totalRecords.set(100);

        expect((component as any).hasMoreRecords()).toBe(true);
      });

      it('should return false when donors >= total', () => {
        (component as any).searchTerm.set('');
        (component as any).donors.set([createMockDonor()]);
        (component as any).totalRecords.set(1);

        expect((component as any).hasMoreRecords()).toBe(false);
      });
    });

    describe('groupedDonors', () => {
      it('should deduplicate donors by donorId', () => {
        (component as any).donors.set([
          createMockDonor({ donorId: 'D1', sessionId: 'S1' }),
          createMockDonor({ donorId: 'D1', sessionId: 'S2' }),
          createMockDonor({ donorId: 'D2', sessionId: 'S3' })
        ]);

        const grouped = (component as any).groupedDonors();
        expect(grouped.length).toBe(2);
        expect(grouped[0].donorId).toBe('D1');
        expect(grouped[0].sessionId).toBe('S1'); // keeps first occurrence
        expect(grouped[1].donorId).toBe('D2');
      });

      it('should return empty array when no donors', () => {
        (component as any).donors.set([]);
        expect((component as any).groupedDonors().length).toBe(0);
      });

      it('should keep all donors when all have unique IDs', () => {
        (component as any).donors.set([
          createMockDonor({ donorId: 'D1' }),
          createMockDonor({ donorId: 'D2' }),
          createMockDonor({ donorId: 'D3' })
        ]);

        expect((component as any).groupedDonors().length).toBe(3);
      });
    });

    describe('grade counts', () => {
      it('should return 0 for all grades when no summary', () => {
        (component as any).matchGradeSummary.set(null);

        expect((component as any).grade1Count()).toBe(0);
        expect((component as any).grade2Count()).toBe(0);
        expect((component as any).grade3Count()).toBe(0);
        expect((component as any).grade4Count()).toBe(0);
        expect((component as any).grade5Count()).toBe(0);
      });

      it('should return correct counts from summary', () => {
        (component as any).matchGradeSummary.set(createMockMatchGradeSummary({
          grade1Count: 10,
          grade2Count: 20,
          grade3Count: 30,
          grade4Count: 40,
          grade5Count: 50
        }));

        expect((component as any).grade1Count()).toBe(10);
        expect((component as any).grade2Count()).toBe(20);
        expect((component as any).grade3Count()).toBe(30);
        expect((component as any).grade4Count()).toBe(40);
        expect((component as any).grade5Count()).toBe(50);
      });
    });
  });

  describe('constructor effect with page header data', () => {
    it('should not update headerConfig when pageHeaderData returns null', () => {
      // pageHeaderData returns null by default in the mock
      // headerConfig should retain its defaults since the effect condition is falsy
      expect(component.headerConfig.title).toBe('Find Donor Routine Logic');
      expect(component.headerConfig.subtitle).toBe('');
    });
  });
});
