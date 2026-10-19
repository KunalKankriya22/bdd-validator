import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import moment from 'moment';

import { DefineCommunicationLetters } from './define-communication-letters';
import { CommunicationLettersService } from './services/communication-letters.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CommLetterView, CommLetterCodeOption } from './models/communication-letter.model';

describe('DefineCommunicationLetters', () => {
  let component: DefineCommunicationLetters;
  let fixture: ComponentFixture<DefineCommunicationLetters>;
  let serviceSpy: jasmine.SpyObj<CommunicationLettersService>;
  let dialogSpy: { open: jasmine.Spy };
  let snackBarSpy: { open: jasmine.Spy };
  let chapterChangedSubject: Subject<void>;

  // ── Mock data ────────────────────────────────────────────────────────────
  const mockCodes: CommLetterCodeOption[] = [
    { letterCode: 'AAA', letterTitle: 'Alpha Letter' },
    { letterCode: 'BBB', letterTitle: 'Beta Letter' },
    { letterCode: 'CCC', letterTitle: 'Charlie Letter' },
    { letterCode: 'DDD', letterTitle: 'Delta Letter' },
  ];

  const futureDate = moment().add(1, 'year').format('YYYY-MM-DD');
  const pastDate   = moment().subtract(1, 'year').format('YYYY-MM-DD');

  const activeLetter: CommLetterView = {
    letterId: 'letter-1',
    letterCode: 'AAA',
    letterTitle: 'Alpha Letter',
    versionNo: 2,
    versionDate: '2026-01-01',
    effDate: '2026-01-01',
    termDate: null,
  };

  const terminatedLetter: CommLetterView = {
    letterId: 'letter-2',
    letterCode: 'AAA',
    letterTitle: 'Alpha Letter',
    versionNo: 1,
    versionDate: '2025-01-01',
    effDate: '2025-01-01',
    termDate: pastDate,
  };

  const historyLetter: CommLetterView = {
    letterId: 'letter-3',
    letterCode: 'AAA',
    letterTitle: 'Alpha Letter',
    versionNo: 1,
    versionDate: '2024-01-01',
    effDate: '2024-01-01',
    termDate: pastDate,
  };

  // ── Helper ───────────────────────────────────────────────────────────────
  function makeDialogRef(result: unknown) {
    return { afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(result)) };
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();

    const svcSpy = jasmine.createSpyObj<CommunicationLettersService>(
      'CommunicationLettersService',
      ['getLetterCodes', 'getLetters', 'getLetterHistory'],
    );
    svcSpy.getLetterCodes.and.returnValue(of(mockCodes));
    svcSpy.getLetters.and.returnValue(of([activeLetter]));
    svcSpy.getLetterHistory.and.returnValue(of([historyLetter]));

    const headerSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Communication Letters', subtitle: '' }),
    });

    await TestBed.configureTestingModule({
      imports: [DefineCommunicationLetters, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CommunicationLettersService, useValue: svcSpy },
        { provide: HeaderService,    useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
      ],
    }).compileComponents();

    fixture    = TestBed.createComponent(DefineCommunicationLetters);
    component  = fixture.componentInstance;
    serviceSpy  = TestBed.inject(CommunicationLettersService) as jasmine.SpyObj<CommunicationLettersService>;
    dialogSpy   = { open: spyOn(component['dialog'], 'open') };
    snackBarSpy = { open: spyOn(component['snackBar'], 'open') };
    fixture.detectChanges();
  });

  // ── 1. Initialization ────────────────────────────────────────────────────
  describe('ngOnInit', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load letter codes on init', () => {
      expect(serviceSpy.getLetterCodes).toHaveBeenCalled();
      expect(component.letterCodeOptions().length).toBe(4);
    });

    it('should default showTerminated to No', () => {
      expect(component.showTerminatedControl.value).toBe('No');
    });

    it('should default filterCriteria.showTerminated to No', () => {
      expect(component.filterCriteria.showTerminated).toBe('No');
    });

    it('should start with hasSearched false', () => {
      expect(component.hasSearched).toBeFalse();
    });

    it('should start with empty tables', () => {
      expect(component.hasCurrentData).toBeFalse();
      expect(component.hasHistoryData).toBeFalse();
      expect(component.hasData).toBeFalse();
    });

    it('should start with no errors', () => {
      expect(component.error()).toBeNull();
      expect(component.historyError()).toBeNull();
    });
  });

  // ── 2. Letter code search / filter ──────────────────────────────────────
  describe('letter code search', () => {
    it('should return all options when search is empty', fakeAsync(() => {
      component.letterCodeSearchControl.setValue('');
      tick();
      expect(component.filteredLetterCodeOptions().length).toBe(4);
    }));

    it('should filter options by letter code (case-insensitive)', fakeAsync(() => {
      component.letterCodeSearchControl.setValue('aaa');
      tick();
      const results = component.filteredLetterCodeOptions();
      expect(results.length).toBe(1);
      expect(results[0].letterCode).toBe('AAA');
    }));

    it('should filter options by title (case-insensitive)', fakeAsync(() => {
      component.letterCodeSearchControl.setValue('delta');
      tick();
      const results = component.filteredLetterCodeOptions();
      expect(results.length).toBe(1);
      expect(results[0].letterCode).toBe('DDD');
    }));

    it('should return empty array when search matches nothing', fakeAsync(() => {
      component.letterCodeSearchControl.setValue('ZZZZZ');
      tick();
      expect(component.filteredLetterCodeOptions().length).toBe(0);
    }));

    it('should update selectedLetterTitle when code is selected', fakeAsync(() => {
      component.letterCodeControl.setValue('AAA');
      tick();
      expect(component.selectedLetterTitle).toBe('Alpha Letter');
    }));

    it('should update filterCriteria.letterCode when code is selected', fakeAsync(() => {
      component.letterCodeControl.setValue('BBB');
      tick();
      expect(component.filterCriteria.letterCode).toBe('BBB');
    }));

    it('should clear selectedLetterTitle when code is deselected', fakeAsync(() => {
      component.letterCodeControl.setValue('AAA');
      tick();
      component.letterCodeControl.setValue(null);
      tick();
      expect(component.selectedLetterTitle).toBe('');
    }));

    it('should clear filterCriteria.letterCode when code is deselected', fakeAsync(() => {
      component.letterCodeControl.setValue('AAA');
      tick();
      component.letterCodeControl.setValue(null);
      tick();
      expect(component.filterCriteria.letterCode).toBeUndefined();
    }));

    it('should update filterCriteria.showTerminated when Show Terminated changes', fakeAsync(() => {
      component.showTerminatedControl.setValue('Yes');
      tick();
      expect(component.filterCriteria.showTerminated).toBe('Yes');
    }));
  });

  // ── 3. onRetrieve — no letter code (LIST only + date-split) ─────────────
  describe('onRetrieve (no letter code selected)', () => {
    beforeEach(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter, terminatedLetter]));
    });

    it('should set hasSearched to true', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasSearched).toBeTrue();
    }));

    it('should call getLetters with current filterCriteria', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getLetters).toHaveBeenCalledWith(component.filterCriteria);
    }));

    it('should NOT call getLetterHistory when no letter code is selected', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getLetterHistory).not.toHaveBeenCalled();
    }));

    it('should place letter with null termDate into current table', fakeAsync(() => {
      component.onRetrieve();
      tick();
      const ids = component.currentTableSource.data.map((l) => l.letterId);
      expect(ids).toContain('letter-1');
    }));

    it('should place letter with past termDate into history table', fakeAsync(() => {
      component.onRetrieve();
      tick();
      const ids = component.historyTableSource.data.map((l) => l.letterId);
      expect(ids).toContain('letter-2');
    }));

    it('should place letter with future termDate into current table', fakeAsync(() => {
      const futureLetter: CommLetterView = { ...activeLetter, letterId: 'future', termDate: futureDate };
      serviceSpy.getLetters.and.returnValue(of([futureLetter]));
      component.onRetrieve();
      tick();
      const ids = component.currentTableSource.data.map((l) => l.letterId);
      expect(ids).toContain('future');
    }));

    it('should clear loading after completion', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.loading()).toBeFalse();
    }));

    it('should set error and show snackbar on API failure', fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(throwError(() => new Error('Network error')));
      component.onRetrieve();
      tick();
      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should reset error signal at the start of a new retrieve', fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      tick();
      expect(component.error()).toBeTruthy();

      serviceSpy.getLetters.and.returnValue(of([activeLetter]));
      component.onRetrieve();
      tick();
      expect(component.error()).toBeNull();
    }));
  });

  // ── 4. onRetrieve — with letter code (forkJoin: LIST + HISTORY) ─────────
  describe('onRetrieve (letter code selected)', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter]));
      serviceSpy.getLetterHistory.and.returnValue(of([historyLetter]));
      component.letterCodeControl.setValue('AAA');
      tick();
    }));

    it('should call both getLetters and getLetterHistory', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getLetters).toHaveBeenCalled();
      expect(serviceSpy.getLetterHistory).toHaveBeenCalledWith('AAA');
    }));

    it('should populate current table from LIST result (active records only)', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.currentTableSource.data.length).toBe(1);
      expect(component.currentTableSource.data[0].letterId).toBe('letter-1');
    }));

    it('should populate history table directly from HISTORY endpoint result', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.historyTableSource.data.length).toBe(1);
      expect(component.historyTableSource.data[0].letterId).toBe('letter-3');
    }));

    it('should filter terminated records from LIST out of current table', fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter, terminatedLetter]));
      component.onRetrieve();
      tick();
      const ids = component.currentTableSource.data.map((l) => l.letterId);
      expect(ids).not.toContain('letter-2');
    }));

    it('should clear loading after forkJoin completes', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.loading()).toBeFalse();
    }));
  });

  // ── 5. onRetrieve — HISTORY endpoint failure ────────────────────────────
  describe('onRetrieve (HISTORY endpoint fails)', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter]));
      serviceSpy.getLetterHistory.and.returnValue(throwError(() => new Error('HISTORY unavailable')));
      component.letterCodeControl.setValue('AAA');
      tick();
    }));

    it('should set historyError signal', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.historyError()).toBeTruthy();
    }));

    it('should still populate current table when HISTORY fails', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasCurrentData).toBeTrue();
    }));

    it('should leave history table empty when HISTORY fails', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasHistoryData).toBeFalse();
    }));

    it('should not set main error signal when only HISTORY fails', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.error()).toBeNull();
    }));

    it('should reset historyError on a subsequent successful retrieve', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.historyError()).toBeTruthy();

      serviceSpy.getLetterHistory.and.returnValue(of([historyLetter]));
      component.onRetrieve();
      tick();
      expect(component.historyError()).toBeNull();
    }));
  });

  // ── 6. onClear ───────────────────────────────────────────────────────────
  describe('onClear', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter, terminatedLetter]));
      component.letterCodeControl.setValue('AAA');
      tick();
      component.showTerminatedControl.setValue('Yes');
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should reset hasSearched to false', () => {
      component.onClear();
      expect(component.hasSearched).toBeFalse();
    });

    it('should clear both table datasources', () => {
      component.onClear();
      expect(component.hasCurrentData).toBeFalse();
      expect(component.hasHistoryData).toBeFalse();
    });

    it('should reset letterCodeControl to null', () => {
      component.onClear();
      expect(component.letterCodeControl.value).toBeNull();
    });

    it('should reset showTerminatedControl to No', () => {
      component.onClear();
      expect(component.showTerminatedControl.value).toBe('No');
    });

    it('should clear selectedLetterTitle', () => {
      component.onClear();
      expect(component.selectedLetterTitle).toBe('');
    });

    it('should reset filterCriteria to default', () => {
      component.onClear();
      expect(component.filterCriteria).toEqual({ showTerminated: 'No' });
    });

    it('should clear selectedLetter', () => {
      component.selectedLetter = activeLetter;
      component.onClear();
      expect(component.selectedLetter).toBeNull();
    });

    it('should clear historyError signal', fakeAsync(() => {
      component.letterCodeControl.setValue('AAA');
      tick();
      serviceSpy.getLetterHistory.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      tick();
      expect(component.historyError()).toBeTruthy();
      component.onClear();
      expect(component.historyError()).toBeNull();
    }));
  });

  // ── 7. Chapter change ────────────────────────────────────────────────────
  describe('chapter change', () => {
    it('should clear state on chapter change', fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([activeLetter]));
      component.onRetrieve();
      tick();
      expect(component.hasCurrentData).toBeTrue();

      chapterChangedSubject.next();
      tick();
      expect(component.hasSearched).toBeFalse();
      expect(component.hasCurrentData).toBeFalse();
    }));

    it('should reload letter codes on chapter change', fakeAsync(() => {
      serviceSpy.getLetterCodes.calls.reset();
      chapterChangedSubject.next();
      tick();
      expect(serviceSpy.getLetterCodes).toHaveBeenCalled();
    }));
  });

  // ── 8. Computed getters ──────────────────────────────────────────────────
  describe('computed getters', () => {
    it('hasCurrentData is false when current table is empty', () => {
      expect(component.hasCurrentData).toBeFalse();
    });

    it('hasHistoryData is false when history table is empty', () => {
      expect(component.hasHistoryData).toBeFalse();
    });

    it('hasData is false when both tables are empty', () => {
      expect(component.hasData).toBeFalse();
    });

    it('hasCurrentData is true after retrieve with active records', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasCurrentData).toBeTrue();
    }));

    it('hasData is true when current table has data', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasData).toBeTrue();
    }));

    it('hasData is true when only history table has data', fakeAsync(() => {
      serviceSpy.getLetters.and.returnValue(of([terminatedLetter]));
      component.onRetrieve();
      tick();
      expect(component.hasHistoryData).toBeTrue();
      expect(component.hasData).toBeTrue();
    }));
  });

  // ── 9. isLetterSelected ──────────────────────────────────────────────────
  describe('isLetterSelected', () => {
    it('returns false when no letter is selected', () => {
      expect(component.isLetterSelected(activeLetter)).toBeFalse();
    });

    it('returns true for the currently selected letter', () => {
      component.selectedLetter = activeLetter;
      expect(component.isLetterSelected(activeLetter)).toBeTrue();
    });

    it('returns false for a different letter when another is selected', () => {
      component.selectedLetter = activeLetter;
      expect(component.isLetterSelected(terminatedLetter)).toBeFalse();
    });
  });

  // ── 10. openCreateDialog ─────────────────────────────────────────────────
  describe('openCreateDialog', () => {
    it('should open dialog with mode "add" and current letter codes', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openCreateDialog();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(config.data.mode).toBe('add');
      expect(config.disableClose).toBeTrue();
    }));

    it('should reload codes and refresh table on successful create', fakeAsync(() => {
      serviceSpy.getLetterCodes.calls.reset();
      serviceSpy.getLetters.calls.reset();
      dialogSpy.open.and.returnValue(makeDialogRef({ success: true }) as any);
      component.openCreateDialog();
      tick();
      expect(serviceSpy.getLetterCodes).toHaveBeenCalled();
      expect(serviceSpy.getLetters).toHaveBeenCalled();
    }));

    it('should show success snackbar on successful create', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef({ success: true }) as any);
      component.openCreateDialog();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Letter created successfully', 'DISMISS', jasmine.any(Object),
      );
    }));

    it('should not reload on cancelled create', fakeAsync(() => {
      serviceSpy.getLetterCodes.calls.reset();
      serviceSpy.getLetters.calls.reset();
      dialogSpy.open.and.returnValue(makeDialogRef({ success: false }) as any);
      component.openCreateDialog();
      tick();
      expect(serviceSpy.getLetterCodes).not.toHaveBeenCalled();
      expect(serviceSpy.getLetters).not.toHaveBeenCalled();
    }));
  });

  // ── 11. openReviseDialog ─────────────────────────────────────────────────
  describe('openReviseDialog', () => {
    it('should open dialog with mode "edit" and the letter data', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openReviseDialog(activeLetter);
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(config.data.mode).toBe('edit');
      expect(config.data.letter).toEqual(activeLetter);
    }));

    it('should set selectedLetter while dialog is open', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => new Subject().asObservable() } as any);
      component.openReviseDialog(activeLetter);
      tick();
      expect(component.selectedLetter).toEqual(activeLetter);
    }));

    it('should show success snackbar and refresh table on successful revise', fakeAsync(() => {
      serviceSpy.getLetters.calls.reset();
      dialogSpy.open.and.returnValue(makeDialogRef({ success: true }) as any);
      component.openReviseDialog(activeLetter);
      tick();
      expect(serviceSpy.getLetters).toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Letter revised successfully', 'DISMISS', jasmine.any(Object),
      );
    }));

    it('should clear selectedLetter after dialog closes regardless of result', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef({ success: false }) as any);
      component.openReviseDialog(activeLetter);
      tick();
      expect(component.selectedLetter).toBeNull();
    }));
  });

  // ── 12. openViewDialog ───────────────────────────────────────────────────
  describe('openViewDialog', () => {
    it('should open dialog and pass the letter', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openViewDialog(activeLetter);
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(config.data.letter).toEqual(activeLetter);
    }));

    it('should set selectedLetter while dialog is open', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => new Subject().asObservable() } as any);
      component.openViewDialog(activeLetter);
      tick();
      expect(component.selectedLetter).toEqual(activeLetter);
    }));

    it('should clear selectedLetter after view dialog closes', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openViewDialog(activeLetter);
      tick();
      expect(component.selectedLetter).toBeNull();
    }));
  });

  // ── 13. openPreviewDialog ────────────────────────────────────────────────
  describe('openPreviewDialog', () => {
    it('should open dialog and pass the letter', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openPreviewDialog(activeLetter);
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(config.data.letter).toEqual(activeLetter);
    }));

    it('should clear selectedLetter after preview dialog closes', fakeAsync(() => {
      dialogSpy.open.and.returnValue(makeDialogRef(null) as any);
      component.openPreviewDialog(activeLetter);
      tick();
      expect(component.selectedLetter).toBeNull();
    }));
  });

  // ── 14. ngOnDestroy ──────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should complete destroy$ to unsubscribe all streams', () => {
      const completeSpy = jasmine.createSpy('complete');
      component['destroy$'].subscribe({ complete: completeSpy });
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
