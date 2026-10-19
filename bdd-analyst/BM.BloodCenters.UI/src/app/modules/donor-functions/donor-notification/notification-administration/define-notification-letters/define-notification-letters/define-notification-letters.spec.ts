import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DefineNotificationLetters } from './define-notification-letters';
import { NotificationLettersService } from '../services/notification-letters.service';
import { HeaderService } from '@shared/services/header.service';
import { LetterView, LetterCodeOption } from '../models/notification-letter.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineNotificationLetters', () => {
  let component: DefineNotificationLetters;
  let fixture: ComponentFixture<DefineNotificationLetters>;
  let serviceSpy: jasmine.SpyObj<NotificationLettersService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockLetterCodes: LetterCodeOption[] = [
    { code: 'BDAY', description: 'Happy Birthday' },
    { code: 'THANK', description: 'Thank You' }
  ];

  const mockCurrentLetters: LetterView[] = [
    {
      letterCode: 'BDAY',
      title: 'Happy Birthday',
      description: 'Birthday letter',
      fileName: 'BDAY.html',
      currentVersion: {
        letterId: 'BDAY-003',
        letterCode: 'BDAY',
        versionNo: 3,
        effectiveDate: '04-MAY-2025',
        terminationDate: undefined,
        letterMessage: 'Dear &&DONOR_NAME&&, Happy Birthday!',
        isCurrent: true
      }
    }
  ];

  const mockHistoryLetters: LetterView[] = [
    {
      letterCode: 'BDAY',
      title: 'Happy Birthday',
      description: 'Birthday letter',
      fileName: 'BDAY.html',
      currentVersion: {
        letterId: 'BDAY-002',
        letterCode: 'BDAY',
        versionNo: 2,
        effectiveDate: '12-JAN-2024',
        terminationDate: '04-MAY-2025',
        letterMessage: 'Dear &&DONOR_NAME&&, Happy Birthday!',
        isCurrent: false
      }
    }
  ];

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('NotificationLettersService', [
      'getLetters',
      'getLetterCodes',
      'getTemplateVariables',
      'getLetterDetail'
    ]);
    headerServiceSpy = createMockHeaderService();

    // Setup default spy returns
    serviceSpy.getLetterCodes.and.returnValue(of(mockLetterCodes));
    serviceSpy.getLetters.and.returnValue(of([...mockCurrentLetters, ...mockHistoryLetters]));
    serviceSpy.getTemplateVariables.and.returnValue(of([]));
    serviceSpy.getLetterDetail.and.returnValue(of(mockCurrentLetters[0]));
    headerServiceSpy.chapterChanged$ = of(void 0);

    TestBed.configureTestingModule({
      imports: [
        DefineNotificationLetters,
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: NotificationLettersService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
  });

  beforeEach(() => {
    serviceSpy.getLetters.calls.reset();
    serviceSpy.getLetterCodes.calls.reset();
    serviceSpy.getTemplateVariables.calls.reset();
    headerServiceSpy.getCurrentChapterId.calls.reset();
    headerServiceSpy.getCurrentWarehouseId.calls.reset();
    serviceSpy.getLetterCodes.and.returnValue(of(mockLetterCodes));
    serviceSpy.getLetters.and.returnValue(of([...mockCurrentLetters, ...mockHistoryLetters]));
    serviceSpy.getTemplateVariables.and.returnValue(of([]));
    fixture = TestBed.createComponent(DefineNotificationLetters);
    component = fixture.componentInstance;
  });

  it('should load letter codes on init', () => {
    fixture.detectChanges();
    expect(serviceSpy.getLetterCodes).toHaveBeenCalled();
    expect(component.letterCodeOptions().length).toBe(2);
  });

  it('should separate current letters from history on retrieve', (done) => {
    component.onRetrieve();

    setTimeout(() => {
      expect(component.currentVersionLetters.length).toBe(1);
      expect(component.versionHistoryLetters.length).toBe(1);
      expect(component.currentVersionLetters[0].currentVersion?.isCurrent).toBe(true);
      expect(component.versionHistoryLetters[0].currentVersion?.isCurrent).toBe(false);
      done();
    }, 100);
  });

  // Bug Fix #1: Unified Search Implementation
  describe('Unified Search (Drive Profile Pattern)', () => {
    beforeEach(() => {
      component.currentVersionLetters = mockCurrentLetters;
      component.versionHistoryLetters = mockHistoryLetters;
      component.filteredCurrentLetters = [...mockCurrentLetters];
      component.filteredHistoryLetters = [...mockHistoryLetters];
    });

    it('should filter both tables with unified search', () => {
      component.onSearch('BDAY');

      expect(component.filteredCurrentLetters.length).toBe(1);
      expect(component.filteredHistoryLetters.length).toBe(1);
      expect(component.tableSearch).toBe('bday');
    });

    it('should filter by letter code', () => {
      component.onSearch('BDAY');

      expect(component.filteredCurrentLetters[0].letterCode).toBe('BDAY');
    });

    it('should filter by title', () => {
      component.onSearch('birthday');

      expect(component.filteredCurrentLetters.length).toBe(1);
    });

    it('should filter by description', () => {
      component.onSearch('Birthday letter');

      expect(component.filteredCurrentLetters.length).toBe(1);
    });

    it('should clear search when cleared', () => {
      component.onSearch('BDAY');
      expect(component.tableSearch).toBe('bday');

      component.onSearchCleared();
      expect(component.tableSearch).toBe('');
      expect(component.filteredCurrentLetters.length).toBe(1);
      expect(component.filteredHistoryLetters.length).toBe(1);
    });
  });

  // Bug Fix #2: Letter Code Search Box
  describe('Letter Code Search Box', () => {

    it('should reset letter code search when clearing filters', () => {
      component.letterCodeSearch.set('invalid');
      component.filterCriteria = {
        showTerminated: true,
        letterCode: 'BDAY'
      };

      component.clearAllFilters();

      expect(component.letterCodeSearch()).toBe('');
      expect(component.filterCriteria.showTerminated).toBe(false);
      expect(component.filterCriteria.letterCode).toBeUndefined();
    });
  });

  // Bug Fix #3: Sorting Functionality
  describe('Sorting', () => {
    beforeEach(() => {
      component.currentVersionLetters = [
        { ...mockCurrentLetters[0], letterCode: 'ZULU' },
        { ...mockCurrentLetters[0], letterCode: 'ALPHA' },
        { ...mockCurrentLetters[0], letterCode: 'MIKE' }
      ];
      component.versionHistoryLetters = [...mockHistoryLetters];
      component.filteredCurrentLetters = [...component.currentVersionLetters];
      component.filteredHistoryLetters = [...component.versionHistoryLetters];
    });

    it('should sort current table ascending on first click', () => {
      component.onSortCurrent('letterCode');

      expect(component.currentSortColumn).toBe('letterCode');
      expect(component.currentSortDirection).toBe('asc');
      expect(component.filteredCurrentLetters[0].letterCode).toBe('ALPHA');
      expect(component.filteredCurrentLetters[2].letterCode).toBe('ZULU');
    });

    it('should sort current table descending on second click', () => {
      component.onSortCurrent('letterCode');
      component.onSortCurrent('letterCode');

      expect(component.currentSortDirection).toBe('desc');
      expect(component.filteredCurrentLetters[0].letterCode).toBe('ZULU');
      expect(component.filteredCurrentLetters[2].letterCode).toBe('ALPHA');
    });

    it('should clear current table sort on third click', () => {
      component.onSortCurrent('letterCode');
      component.onSortCurrent('letterCode');
      component.onSortCurrent('letterCode');

      expect(component.currentSortColumn).toBeNull();
      expect(component.currentSortDirection).toBeNull();
    });

    it('should sort history table independently', () => {
      component.versionHistoryLetters = [
        { ...mockHistoryLetters[0], letterCode: 'ZULU' },
        { ...mockHistoryLetters[0], letterCode: 'ALPHA' }
      ];
      component.filteredHistoryLetters = [...component.versionHistoryLetters];

      component.onSortHistory('letterCode');

      expect(component.historySortColumn).toBe('letterCode');
      expect(component.historySortDirection).toBe('asc');
      expect(component.filteredHistoryLetters[0].letterCode).toBe('ALPHA');
    });

    it('should reset sorting on retrieve', (done) => {
      component.currentSortColumn = 'letterCode';
      component.currentSortDirection = 'asc';
      component.historySortColumn = 'letterCode';
      component.historySortDirection = 'desc';

      component.onRetrieve();

      setTimeout(() => {
        expect(component.currentSortColumn).toBeNull();
        expect(component.currentSortDirection).toBeNull();
        expect(component.historySortColumn).toBeNull();
        expect(component.historySortDirection).toBeNull();
        done();
      }, 100);
    });
  });

  it('should select a letter', () => {
    const letter = mockCurrentLetters[0];
    component.onSelectLetter(letter);

    expect(component.selectedLetter).toBe(letter);
    expect(component.isLetterSelected(letter)).toBe(true);
  });

  // Bug Fix #4: Error Recovery
  describe('Error Recovery', () => {
    it('should handle service error gracefully', (done) => {
      serviceSpy.getLetters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.onRetrieve();

      setTimeout(() => {
        expect(component.error()).toBeTruthy();
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should reset sorting state when clearing filters', () => {
      component.currentSortColumn = 'letterCode';
      component.currentSortDirection = 'asc';
      component.historySortColumn = 'letterCode';
      component.historySortDirection = 'desc';

      component.clearAllFilters();

      expect(component.currentSortColumn).toBeNull();
      expect(component.currentSortDirection).toBeNull();
      expect(component.historySortColumn).toBeNull();
      expect(component.historySortDirection).toBeNull();
    });

    it('should clear all state on chapter change', () => {
      component.currentVersionLetters = mockCurrentLetters;
      component.versionHistoryLetters = mockHistoryLetters;
      component.hasSearched = true;
      component.tableSearch = 'test';
      component.currentSortColumn = 'letterCode';
      component.error.set('Test error');

      // Trigger chapter change which calls clearAll internally
      headerServiceSpy.chapterChanged$ = of(void 0);
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.currentVersionLetters.length).toBe(0);
      expect(component.versionHistoryLetters.length).toBe(0);
      expect(component.hasSearched).toBe(false);
      expect(component.tableSearch).toBe('');
      expect(component.currentSortColumn).toBeNull();
      expect(component.error()).toBeNull();
    });

    it('should not get stuck in loading state on error', (done) => {
      serviceSpy.getLetters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.onRetrieve();

      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should clear data on retrieve and repopulate after API success', (done) => {
      // Manually set data first
      component.currentVersionLetters = [...mockCurrentLetters];
      component.filteredCurrentLetters = [...mockCurrentLetters];
      component.versionHistoryLetters = [...mockHistoryLetters];
      component.filteredHistoryLetters = [...mockHistoryLetters];

      // Verify data exists before retrieve
      expect(component.currentVersionLetters.length).toBeGreaterThan(0);

      // Trigger retrieve which should clear then repopulate
      component.onRetrieve();

      // After API completes, verify data is populated again
      setTimeout(() => {
        expect(component.currentVersionLetters.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  it('should update filter chips when filters applied', (done) => {
    component.filterCriteria = {
      showTerminated: true,
      letterCode: 'BDAY'
    };
    component.onRetrieve();

    setTimeout(() => {
      expect(component.filterChips.length).toBeGreaterThan(0);
      done();
    }, 100);
  });

  // Dialog Configuration Tests
  describe('Dialog Configurations', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of({ success: false })
      } as any);
    });

    it('should open view dialog with disableClose true', (done) => {
      const letter = mockCurrentLetters[0];

      component.openViewDialog(letter);

      setTimeout(() => {
        expect(dialogSpy).toHaveBeenCalled();

        const callArgs = dialogSpy.calls.mostRecent().args;
        const config = callArgs[1];

        expect(config?.disableClose).toBe(true);
        expect(config?.width).toBe('800px');
        expect(config?.height).toBe('100vh');
        expect(config?.position).toEqual({ right: '0', top: '64px' });
        expect(config?.panelClass).toContain('notification-letter-drawer');
        expect(config?.data?.letter).toBe(letter);

        done();
      }, 100);
    });

    it('should open preview dialog with disableClose true', (done) => {
      const letter = mockCurrentLetters[0];

      component.openPreviewDialog(letter);

      setTimeout(() => {
        expect(dialogSpy).toHaveBeenCalled();

        const callArgs = dialogSpy.calls.mostRecent().args;
        const config = callArgs[1];

        expect(config?.disableClose).toBe(true);
        expect(config?.width).toBe('800px');
        expect(config?.height).toBe('100vh');
        expect(config?.position).toEqual({ right: '0', top: '64px' });
        expect(config?.panelClass).toContain('notification-letter-drawer');
        expect(config?.panelClass).toContain('preview-letter-drawer');
        expect(config?.data?.letterId).toBe('BDAY-003');

        done();
      }, 100);
    });

    it('should open create dialog with disableClose true', (done) => {
      component.openCreateDialog();

      setTimeout(() => {
        expect(dialogSpy).toHaveBeenCalled();

        const callArgs = dialogSpy.calls.mostRecent().args;
        const config = callArgs[1];

        expect(config?.disableClose).toBe(true);
        expect(config?.width).toBe('800px');
        expect(config?.height).toBe('100vh');
        expect(config?.position).toEqual({ right: '0', top: '64px' });
        expect(config?.panelClass).toContain('notification-letter-drawer');

        done();
      }, 100);
    });

    it('should open revise dialog with disableClose true', (done) => {
      const letter = mockCurrentLetters[0];

      component.openReviseDialog(letter);

      setTimeout(() => {
        expect(dialogSpy).toHaveBeenCalled();

        const callArgs = dialogSpy.calls.mostRecent().args;
        const config = callArgs[1];

        expect(config?.disableClose).toBe(true);
        expect(config?.width).toBe('800px');
        expect(config?.height).toBe('100vh');
        expect(config?.position).toEqual({ right: '0', top: '64px' });
        expect(config?.panelClass).toContain('notification-letter-drawer');
        expect(config?.data?.letter).toBe(letter);

        done();
      }, 100);
    });

    it('should call loadLetterCodes and onRetrieve after successful revise', (done) => {
      dialogSpy.and.returnValue({
        afterClosed: () => of({ success: true })
      } as any);

      const loadLetterCodesSpy = spyOn(component, 'loadLetterCodes').and.callThrough();
      const onRetrieveSpy = spyOn(component, 'onRetrieve').and.callThrough();

      component.openReviseDialog(mockCurrentLetters[0]);

      setTimeout(() => {
        expect(loadLetterCodesSpy).toHaveBeenCalled();
        expect(onRetrieveSpy).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should not reload data when revise dialog is closed without success', (done) => {
      dialogSpy.and.returnValue({
        afterClosed: () => of({ success: false })
      } as any);

      const loadLetterCodesSpy = spyOn(component, 'loadLetterCodes');
      const onRetrieveSpy = spyOn(component, 'onRetrieve');

      component.openReviseDialog(mockCurrentLetters[0]);

      setTimeout(() => {
        expect(loadLetterCodesSpy).not.toHaveBeenCalled();
        expect(onRetrieveSpy).not.toHaveBeenCalled();
        done();
      }, 200);
    });
  });

  // Additional tests for smart empty states
  describe('Smart Empty States', () => {
    it('should detect when API has data', () => {
      component.currentVersionLetters = mockCurrentLetters;
      component.versionHistoryLetters = [];

      expect(component.hasApiData).toBe(true);
    });

    it('should detect when no API data exists', () => {
      component.currentVersionLetters = [];
      component.versionHistoryLetters = [];

      expect(component.hasApiData).toBe(false);
    });

    it('should detect search filtering all results', () => {
      component.currentVersionLetters = mockCurrentLetters;
      component.versionHistoryLetters = mockHistoryLetters;
      component.filteredCurrentLetters = [];
      component.filteredHistoryLetters = [];
      component.tableSearch = 'nonexistent';

      expect(component.isSearchFiltering).toBe(true);
    });

    it('should not show search filtering when no search active', () => {
      component.currentVersionLetters = [];
      component.versionHistoryLetters = [];
      component.tableSearch = '';

      expect(component.isSearchFiltering).toBe(false);
    });

    it('should show correct message for search with no matches', () => {
      component.currentVersionLetters = mockCurrentLetters;
      component.tableSearch = 'xyz123';
      component.filteredCurrentLetters = [];

      expect(component.isSearchFiltering).toBe(true);
    });
  });

  describe('Default Sort Order', () => {
    it('should default sort current letters by letterCode ASC, versionNo ASC', (done) => {
      const letters: LetterView[] = [
        { letterCode: 'ZULU', title: 'Z', description: 'Z', fileName: 'Z.html', currentVersion: { letterId: '1', letterCode: 'ZULU', versionNo: 1, effectiveDate: '', isCurrent: true, letterMessage: '' } },
        { letterCode: 'ALPHA', title: 'A', description: 'A', fileName: 'A.html', currentVersion: { letterId: '2', letterCode: 'ALPHA', versionNo: 2, effectiveDate: '', isCurrent: true, letterMessage: '' } },
        { letterCode: 'ALPHA', title: 'A', description: 'A', fileName: 'A.html', currentVersion: { letterId: '3', letterCode: 'ALPHA', versionNo: 1, effectiveDate: '', isCurrent: true, letterMessage: '' } }
      ];

      serviceSpy.getLetters.and.returnValue(of(letters));
      component.onRetrieve();

      setTimeout(() => {
        expect(component.filteredCurrentLetters[0].letterCode).toBe('ALPHA');
        expect(component.filteredCurrentLetters[0].currentVersion?.versionNo).toBe(1);
        expect(component.filteredCurrentLetters[1].currentVersion?.versionNo).toBe(2);
        expect(component.filteredCurrentLetters[2].letterCode).toBe('ZULU');
        done();
      }, 100);
    });

    it('should default sort history letters by letterCode ASC, versionNo DESC', (done) => {
      const letters: LetterView[] = [
        { letterCode: 'BDAY', title: 'B', description: 'B', fileName: 'B.html', currentVersion: { letterId: '1', letterCode: 'BDAY', versionNo: 1, effectiveDate: '', terminationDate: '01-JAN-2020', isCurrent: false, letterMessage: '' } },
        { letterCode: 'BDAY', title: 'B', description: 'B', fileName: 'B.html', currentVersion: { letterId: '2', letterCode: 'BDAY', versionNo: 3, effectiveDate: '', terminationDate: '01-JAN-2022', isCurrent: false, letterMessage: '' } },
        { letterCode: 'BDAY', title: 'B', description: 'B', fileName: 'B.html', currentVersion: { letterId: '3', letterCode: 'BDAY', versionNo: 2, effectiveDate: '', terminationDate: '01-JAN-2021', isCurrent: false, letterMessage: '' } }
      ];

      serviceSpy.getLetters.and.returnValue(of(letters));
      component.onRetrieve();

      setTimeout(() => {
        expect(component.filteredHistoryLetters[0].currentVersion?.versionNo).toBe(3);
        expect(component.filteredHistoryLetters[1].currentVersion?.versionNo).toBe(2);
        expect(component.filteredHistoryLetters[2].currentVersion?.versionNo).toBe(1);
        done();
      }, 100);
    });
  });

  describe('Preview Fallback for Missing letterId', () => {
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of({ success: false })
      } as any);
    });

    it('should open preview directly when letterId is available', (done) => {
      const letter = mockCurrentLetters[0];
      component.openPreviewDialog(letter);

      setTimeout(() => {
        expect(serviceSpy.getLetterDetail).not.toHaveBeenCalled();
        expect(dialogSpy).toHaveBeenCalled();
        const config = dialogSpy.calls.mostRecent().args[1];
        expect(config?.data?.letterId).toBe('BDAY-003');
        done();
      }, 100);
    });

    it('should fetch letterId from detail endpoint when missing', (done) => {
      const letterNoId: LetterView = {
        letterCode: 'BDAY',
        title: 'Happy Birthday',
        description: 'Birthday letter',
        fileName: 'BDAY.html',
        currentVersion: {
          letterId: undefined as any,
          letterCode: 'BDAY',
          versionNo: 2,
          effectiveDate: '01-JAN-2025',
          letterMessage: '',
          isCurrent: false
        }
      };

      const detailResponse: LetterView = {
        ...letterNoId,
        currentVersion: { ...letterNoId.currentVersion!, letterId: 'BDAY-FETCHED' }
      };
      serviceSpy.getLetterDetail.and.returnValue(of(detailResponse));

      component.openPreviewDialog(letterNoId);

      setTimeout(() => {
        expect(serviceSpy.getLetterDetail).toHaveBeenCalledWith('BDAY', 'N', 2);
        expect(dialogSpy).toHaveBeenCalled();
        const config = dialogSpy.calls.mostRecent().args[1];
        expect(config?.data?.letterId).toBe('BDAY-FETCHED');
        done();
      }, 100);
    });

    it('should show error when letterId cannot be fetched', (done) => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      const letterNoId: LetterView = {
        letterCode: 'BDAY',
        title: 'Happy Birthday',
        description: 'Birthday letter',
        fileName: 'BDAY.html',
        currentVersion: {
          letterId: undefined as any,
          letterCode: 'BDAY',
          versionNo: 2,
          effectiveDate: '01-JAN-2025',
          letterMessage: '',
          isCurrent: false
        }
      };

      serviceSpy.getLetterDetail.and.returnValue(throwError(() => new Error('API Error')));

      component.openPreviewDialog(letterNoId);

      setTimeout(() => {
        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to fetch letter details for preview.',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        done();
      }, 100);
    });

    it('should show error when letterCode and versionNo are missing', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');
      const letterNoData: LetterView = {
        letterCode: '',
        title: '',
        description: '',
        fileName: '',
        currentVersion: {
          letterId: undefined as any,
          letterCode: '',
          versionNo: undefined as any,
          effectiveDate: '',
          letterMessage: '',
          isCurrent: false
        }
      };

      component.openPreviewDialog(letterNoData);

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Letter ID is missing. Cannot preview letter.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });
});
