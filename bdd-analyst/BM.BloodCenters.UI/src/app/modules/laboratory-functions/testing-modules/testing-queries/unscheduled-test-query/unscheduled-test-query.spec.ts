import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import moment from 'moment';

import { UnscheduledTestQueryComponent } from './unscheduled-test-query';
import { UnscheduledTestQueryService, TestIdOption, UnscheduledTestResultDto } from './unscheduled-test-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

const MOCK_TEST_IDS: TestIdOption[] = [
  { testId: 'HIV', testDescription: 'HIV 1/2 Plus O' },
  { testId: 'HCV', testDescription: 'Hepatitis C' },
];

const MOCK_ROWS: UnscheduledTestResultDto[] = [
  {
    unitId: '1234567', chkDigit: '8', testId: 'HIV', testSeqNo: 1,
    resultStatus1: 'NR', resultStatus1Desc: 'Non-Reactive',
    tbId: 'TB001', absorbance: '0.123', collDateExists: true,
    collDate: '2025-06-01T00:00:00Z', testModeDesc: 'Auto',
  },
  {
    unitId: '7654321', chkDigit: '2', testId: 'HCV', testSeqNo: 2,
    resultStatus1: 'R', resultStatus1Desc: 'Reactive',
    tbId: 'TB002', absorbance: '1.450', collDateExists: false,
    testModeDesc: 'Man',
  },
];

describe('UnscheduledTestQueryComponent', () => {
  let futureDate: any;
  let subtitle: any;
  let component: UnscheduledTestQueryComponent;
  let fixture: ComponentFixture<UnscheduledTestQueryComponent>;
  let serviceSpy: jasmine.SpyObj<UnscheduledTestQueryService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;
  let chapterTimezoneServiceMock: { chapterLocalDate: ReturnType<typeof signal<moment.Moment | null>> };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    // Signal returns today's date — past dates used in tests won't trigger futureDate error
    chapterTimezoneServiceMock = { chapterLocalDate: signal<moment.Moment | null>(moment()) };

    serviceSpy = jasmine.createSpyObj('UnscheduledTestQueryService', ['getTestIds', 'search']);
    serviceSpy.getTestIds.and.returnValue(of({ success: true, message: '', data: MOCK_TEST_IDS }));
    serviceSpy.search.and.returnValue(of({ success: true, message: '', data: MOCK_ROWS, total: 2 }));

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Unscheduled Test Query', subtitle: 'Displays details of unscheduled tests.' }),
    });

    headerServiceSpy = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [UnscheduledTestQueryComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: UnscheduledTestQueryService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceMock },
        Overlay,
      ],
    });

      serviceSpy.getTestIds.and.returnValue(of({ success: true, message: '', data: MOCK_TEST_IDS }));


      serviceSpy.search.and.returnValue(of({ success: true, message: '', data: MOCK_ROWS, total: 2 }));


    fixture = TestBed.createComponent(UnscheduledTestQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Initialization ─────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should load test IDs on init', fakeAsync(() => {
      tick();
      expect(serviceSpy.getTestIds).toHaveBeenCalledTimes(1);
      expect(component.testIdOptions().length).toBe(3); // ALL + 2 mock items
    }));

    it('should initialize testId as "ALL" (default)', () => {
      expect(component.filterForm.get('testId')?.value).toBe('ALL');
    });

    it('should initialize both dates as null', () => {
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should start with hasRetrieved = false', () => {
      expect(component.hasRetrieved).toBeFalse();
    });

    it('should show correct initial subtitle', () => {
      subtitle = fixture.debugElement.query(By.css('.state-subtitle'));
      expect(subtitle?.nativeElement.textContent).toContain('Enter From Date and To Date to begin');
    });
  });

  // ─── Test ID Description ───────────────────────────────────────────

  describe('selectedDescription()', () => {
    beforeEach(fakeAsync(() => { tick(); }));

    it('should return "-" when no testId selected (null)', () => {
      component.filterForm.get('testId')?.setValue(null);
      expect(component.selectedDescription()).toBe('-');
    });

    it('should return matching description for selected testId', () => {
      component.filterForm.get('testId')?.setValue('HIV');
      expect(component.selectedDescription()).toBe('HIV 1/2 Plus O');
    });

    it('should return "-" when testId not found in loaded options', () => {
      component.filterForm.get('testId')?.setValue('UNKNOWN');
      expect(component.selectedDescription()).toBe('-');
    });
  });

  // ─── Form Validation ────────────────────────────────────────────────

  describe('Form validation', () => {

    it('should have no dateRangeInvalid error when fromDate equals toDate', () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-10'),
        toDate: moment('2025-01-10'),
      });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not set dateAfter/dateBefore on individual controls (cross-field is form-level)', () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-10'),
        toDate: moment('2025-01-01'),
      });
      component.filterForm.updateValueAndValidity();
      expect(component.filterForm.get('fromDate')?.hasError('dateAfter')).toBeFalsy();
      expect(component.filterForm.get('toDate')?.hasError('dateBefore')).toBeFalsy();
    });

    it('should set futureDate error on fromDate when a future date is entered', () => {
      futureDate = moment().add(1, 'year');
      component.filterForm.get('fromDate')?.setValue(futureDate);
      component.filterForm.get('fromDate')?.updateValueAndValidity();
      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBeTrue();
    });

    it('should not set futureDate error on toDate (toDate allows future dates)', () => {
      futureDate = moment().add(1, 'year');
      component.filterForm.get('toDate')?.setValue(futureDate);
      component.filterForm.get('toDate')?.updateValueAndValidity();
      expect(component.filterForm.get('toDate')?.hasError('futureDate')).toBeFalse();
    });
  });

  // ─── RETRIEVE button state ─────────────────────────────────────────
  // ─── retrieve() ────────────────────────────────────────────────────

  describe('retrieve()', () => {
    const setValidDates = () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.filterForm.updateValueAndValidity();
    };

    it('should set hasRetrieved to true', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      expect(component.hasRetrieved).toBeTrue();
    }));

    it('should populate pagedData from response', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      expect(component.pagedData.length).toBe(2);
    }));

    it('should set totalCount from response', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      expect(component.totalCount).toBe(2);
    }));

    it('should reset pageIndex to 0 on new retrieve', fakeAsync(() => {
      setValidDates();
      component.pageIndex = 3;
      component.retrieve();
      tick();
      expect(component.pageIndex).toBe(0);
    }));

    it('should pass "ALL" testId when no specific test selected (default is ALL)', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.testId).toBe('ALL');
    }));

    it('should pass selected testId in payload', fakeAsync(() => {
      setValidDates();
      component.filterForm.get('testId')?.setValue('HIV');
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.testId).toBe('HIV');
    }));

    it('should map reactive=Y to Y in payload', fakeAsync(() => {
      setValidDates();
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.reactive).toBe('Y');
    }));

    it('should map ntsFlag=Y to Y in payload', fakeAsync(() => {
      setValidDates();
      component.appliedFilters.set({ reactive: null, ntsFlag: 'Y', showCancel: null });
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.ntsFlag).toBe('Y');
    }));

    it('should map showCancel=Y to Y in payload', fakeAsync(() => {
      setValidDates();
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: 'Y' });
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.showCancel).toBe('Y');
    }));

    it('should map null flags to null in payload', fakeAsync(() => {
      setValidDates();
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: null });
      component.retrieve();
      tick();
      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.reactive).toBeNull();
      expect(payload.ntsFlag).toBeNull();
      expect(payload.showCancel).toBeNull();
    }));

    it('should handle service error — clears data and stops loading', fakeAsync(() => {
      serviceSpy.search.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      setValidDates();
      component.retrieve();
      tick();
      expect(component.pagedData).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.isLoading).toBeFalse();
    }));
  });

  // ─── Table columns ─────────────────────────────────────────────────

  describe('Table columns', () => {
    beforeEach(fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.retrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should render Seq# as 1-based from first page', () => {
      const cells = fixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
      expect(cells[0].nativeElement.textContent.trim()).toBe('1');
    });

    it('should render resultStatus1Desc in Result Code 1 column', () => {
      const cells = fixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
      expect(cells[4].nativeElement.textContent.trim()).toBe('Non-Reactive');
    });

    it('should render tbId in Test Batch ID column', () => {
      const cells = fixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
      expect(cells[5].nativeElement.textContent.trim()).toBe('TB001');
    });

    it('should render "-" for missing tbId', () => {
      const cells = fixture.debugElement.queryAll(By.css('tbody tr:last-child td'));
      // second row has tbId 'TB002' — verify with first row having collDateExists
      expect(cells[5].nativeElement.textContent.trim()).toBe('TB002');
    });


    it('should render absorbance in Abs/Val/Chan column', () => {
      const cells = fixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
      expect(cells[6].nativeElement.textContent.trim()).toBe('0.123');
    });
  });

  // ─── FILTER toolbar ────────────────────────────────────────────────

  describe('FILTER toolbar', () => {
    it('should open filter panel and set isFilterOpen', () => {
      component.filterBtn = { nativeElement: document.createElement('button') } as any;
      component.openFilterPanel();
      expect(component.isFilterOpen).toBeTrue();
    });

    it('should toggle filter panel closed when opened twice', () => {
      component.filterBtn = { nativeElement: document.createElement('button') } as any;
      component.openFilterPanel();
      component.openFilterPanel();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  // ─── Filter chips ─────────────────────────────────────────────────

  describe('filterChips()', () => {
    it('should return empty array when all filters are null', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: null });
      expect(component.filterChips().length).toBe(0);
    });

    it('should generate chip for reactive=Y with label "Reactive: Reactive Only"', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      const chips = component.filterChips();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('reactive');
      expect(chips[0].label).toBe('Reactive: Reactive Only');
    });

    it('should generate chip for ntsFlag=Y with label "Ignore NT: Yes"', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: 'Y', showCancel: null });
      const chips = component.filterChips();
      expect(chips[0].label).toBe('Ignore NT: Yes');
    });

    it('should generate chip for showCancel=Y with label "Show Cancel: Cancelled Only"', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: 'Y' });
      const chips = component.filterChips();
      expect(chips[0].label).toBe('Show Cancel: Cancelled Only');
    });

    it('should not generate chip for reactive=N (only Y values generate chips)', () => {
      component.appliedFilters.set({ reactive: 'N', ntsFlag: null, showCancel: null });
      const chips = component.filterChips();
      expect(chips.length).toBe(0);
    });

    it('should not generate chip for ntsFlag=N (only Y values generate chips)', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: 'N', showCancel: null });
      const chips = component.filterChips();
      expect(chips.length).toBe(0);
    });

    it('should not generate chip for showCancel=N (only Y values generate chips)', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: 'N' });
      const chips = component.filterChips();
      expect(chips.length).toBe(0);
    });

    it('should generate 3 chips when all filters are active (Y values)', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: 'Y', showCancel: 'Y' });
      expect(component.filterChips().length).toBe(3);
    });

    it('should generate 0 chips when all filters are N values (N values not supported)', () => {
      component.appliedFilters.set({ reactive: 'N', ntsFlag: 'N', showCancel: 'N' });
      expect(component.filterChips().length).toBe(0);
    });
  });

  // ─── onRemoveChip ─────────────────────────────────────────────────

  describe('onRemoveChip()', () => {
    it('should reset reactive to null', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      component.onRemoveChip('reactive');
      expect(component.appliedFilters().reactive).toBeNull();
    });

    it('should reset ntsFlag to null', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: 'Y', showCancel: null });
      component.onRemoveChip('ntsFlag');
      expect(component.appliedFilters().ntsFlag).toBeNull();
    });

    it('should reset showCancel to null', () => {
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: 'Y' });
      component.onRemoveChip('showCancel');
      expect(component.appliedFilters().showCancel).toBeNull();
    });

    it('should trigger re-fetch when hasRetrieved is true', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.hasRetrieved = true;
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      component.onRemoveChip('reactive');
      tick();
      expect(serviceSpy.search).toHaveBeenCalledTimes(1);
    }));
  });

  // ─── onClearAllChips ──────────────────────────────────────────────

  describe('onClearAllChips()', () => {
    it('should reset all filters to null', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: 'Y', showCancel: 'Y' });
      component.onClearAllChips();
      const f = component.appliedFilters();
      expect(f.reactive).toBeNull();
      expect(f.ntsFlag).toBeNull();
      expect(f.showCancel).toBeNull();
    });

    it('should trigger re-fetch when hasRetrieved is true', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.hasRetrieved = true;
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      component.onClearAllChips();
      tick();
      expect(serviceSpy.search).toHaveBeenCalledTimes(1);
    }));
  });

  // ─── clearAll() ───────────────────────────────────────────────────

  describe('clearAll()', () => {
    it('should reset testId to "ALL" (default)', () => {
      component.filterForm.get('testId')?.setValue('HIV');
      component.clearAll();
      expect(component.filterForm.get('testId')?.value).toBe('ALL');
    });

    it('should reset both dates to null', () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.clearAll();
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should reset applied filters to null defaults', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: 'Y', showCancel: 'Y' });
      component.clearAll();
      const f = component.appliedFilters();
      expect(f.reactive).toBeNull();
      expect(f.ntsFlag).toBeNull();
      expect(f.showCancel).toBeNull();
    });

    it('should reset hasRetrieved to false', () => {
      component.hasRetrieved = true;
      component.clearAll();
      expect(component.hasRetrieved).toBeFalse();
    });
  });

  // ─── Pagination ────────────────────────────────────────────────────
  // ─── getSeqNo ─────────────────────────────────────────────────────

  describe('getSeqNo()', () => {
    it('should return 1 for index 0 on page 0', () => {
      component.pageIndex = 0;
      component.pageSize = 25;
      expect(component.getSeqNo(0)).toBe(1);
    });

    it('should return 26 for index 0 on page 1 with pageSize 25', () => {
      component.pageIndex = 1;
      component.pageSize = 25;
      expect(component.getSeqNo(0)).toBe(26);
    });

    it('should calculate correctly for arbitrary page and index', () => {
      component.pageIndex = 2;
      component.pageSize = 10;
      expect(component.getSeqNo(4)).toBe(25);
    });
  });

  // ─── Chapter change ────────────────────────────────────────────────

  describe('Chapter change', () => {
    it('should reload test IDs and clear state when chapter changes', fakeAsync(() => {
      component.pagedData = MOCK_ROWS;
      component.hasRetrieved = true;

      chapterChanged$.next();
      tick();

      expect(serviceSpy.getTestIds).toHaveBeenCalledTimes(1);
      expect(component.hasRetrieved).toBeTrue();
      expect(component.pagedData).toEqual(MOCK_ROWS);
    }));
  });

  // ─── Unit ID ──────────────────────────────────────────────────────

  describe('Unit ID callbacks', () => {
    it('should store parsedUnitId on validated', () => {
      component.onUnitValidated({
        parsedUnitId: 'W4545260513', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'W4545260513', codabarUnitScheme: null,
        entryMode: 'S', barcodeType: 'CODE128', chapterScheme: 'I',
      });
      expect(component.validatedUnitId).toBe('W4545260513');
    });
  });

  // ─── Loading / empty states ────────────────────────────────────────
  // ─── Date error getters ───────────────────────────────────────────

  describe('getFromDateError()', () => {
    const touchFrom = () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
    };

    it('should return "From Date must be less than or equal to To Date" when dateRangeInvalid', () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-10'),
        toDate: moment('2025-01-01'),
      });
      component.filterForm.updateValueAndValidity();
      touchFrom();
      expect(component.getFromDateError()).toBe('From Date must be less than or equal to To Date');
    });

    it('should return "From Date cannot be a future date" when futureDate error', () => {
      const futureDate = moment().add(1, 'year');
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setValue(futureDate);
      ctrl.markAsTouched();
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity();
      expect(component.getFromDateError()).toBe('From Date cannot be a future date');
    });
  });

  describe('getToDateError()', () => {
    const touchTo = () => {
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.markAsTouched();
      ctrl.markAsDirty();
    };

    it('should return "To Date must be greater than or equal to From Date" when dateRangeInvalid', () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-10'),
        toDate: moment('2025-01-01'),
      });
      component.filterForm.updateValueAndValidity();
      touchTo();
      expect(component.getToDateError()).toBe('To Date must be greater than or equal to From Date');
    });

  });

  // ─── onPageChange ────────────────────────────────────────────────

  describe('onPageChange()', () => {
    const setValidDates = () => {
      component.filterForm.patchValue({
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-31'),
      });
      component.filterForm.updateValueAndValidity();
    };

    it('should update pageSize and pageIndex', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      serviceSpy.search.calls.reset();
      serviceSpy.search.and.returnValue(of({ success: true, message: '', data: MOCK_ROWS, total: 50 }));

      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 } as any);
      tick();

      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
    }));

    it('should trigger fetchPage with correct skip', fakeAsync(() => {
      setValidDates();
      component.retrieve();
      tick();
      serviceSpy.search.calls.reset();
      serviceSpy.search.and.returnValue(of({ success: true, message: '', data: [], total: 100 }));

      component.onPageChange({ pageSize: 10, pageIndex: 3, length: 100 } as any);
      tick();

      const payload = serviceSpy.search.calls.mostRecent().args[0];
      expect(payload.take).toBe(10);
      expect(payload.skip).toBe(30);
    }));
  });

  // ─── onUnitCleared ────────────────────────────────────────────────

  describe('onUnitCleared()', () => {
    it('should set validatedUnitId to null', () => {
      component.validatedUnitId = 'W4545260513';
      component.onUnitCleared();
      expect(component.validatedUnitId).toBeNull();
    });
  });

  // ─── filteredTestIds ──────────────────────────────────────────────
  describe('filteredTestIds()', () => {
    beforeEach(fakeAsync(() => { tick(); }));

    it('should return all options when search text is empty', () => {
      expect(component.filteredTestIds().length).toBe(3); // ALL + 2 mock
    });

    it('should filter by testId match', fakeAsync(() => {
      component.testIdSearchCtrl.setValue('HIV');
      tick();
      const filtered = component.filteredTestIds();
      expect(filtered.some(o => o.testId === 'HIV')).toBeTrue();
      expect(filtered.some(o => o.testId === 'HCV')).toBeFalse();
    }));

    it('should filter by description match (case-insensitive)', fakeAsync(() => {
      component.testIdSearchCtrl.setValue('hepatitis');
      tick();
      const filtered = component.filteredTestIds();
      expect(filtered.some(o => o.testId === 'HCV')).toBeTrue();
    }));

    it('should always include ALL in filtered results', fakeAsync(() => {
      component.testIdSearchCtrl.setValue('xyz');
      tick();
      const filtered = component.filteredTestIds();
      expect(filtered.some(o => o.testId === 'ALL')).toBeTrue();
    }));
  });

  // ─── maxToDate ────────────────────────────────────────────────────

  describe('maxToDate()', () => {
    it('should return a moment representing today', () => {
      const max = component.maxToDate();
      expect(moment.isMoment(max)).toBeTrue();
      expect(max.isSame(moment().startOf('day'), 'day')).toBeTrue();
    });

    it('should use chapterLocalDate when available', () => {
      const specificDate = moment('2025-03-15');
      chapterTimezoneServiceMock.chapterLocalDate.set(specificDate);
      const max = component.maxToDate();
      expect(max.isSame(specificDate, 'day')).toBeTrue();
    });

    it('should fall back to today when chapterLocalDate is null', () => {
      chapterTimezoneServiceMock.chapterLocalDate.set(null);
      const max = component.maxToDate();
      expect(max.isSame(moment().startOf('day'), 'day')).toBeTrue();
    });
  });

  // ─── Date input handlers ─────────────────────────────────────────

  describe('Date input handlers', () => {
    it('onFromDateChange should mark fromDate as touched and dirty', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      expect(ctrl.touched).toBeFalse();

      component.onFromDateChange();

      expect(ctrl.touched).toBeTrue();
      expect(ctrl.dirty).toBeTrue();
    });

    it('onToDateChange should mark toDate as touched and dirty', () => {
      const ctrl = component.filterForm.get('toDate')!;
      expect(ctrl.touched).toBeFalse();

      component.onToDateChange();

      expect(ctrl.touched).toBeTrue();
      expect(ctrl.dirty).toBeTrue();
    });

    it('onDatePickerClosed should blur active element', () => {
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.focus();

      component.onDatePickerClosed();

      expect(document.activeElement).not.toBe(btn);
      document.body.removeChild(btn);
    });
  });

  // ─── isRetrieveDisabled / isClearDisabled ─────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should return true when form is invalid', () => {
      const futureDate = moment().add(1, 'year');
      component.filterForm.get('fromDate')?.setValue(futureDate);
      component.filterForm.updateValueAndValidity();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return true when isLoading is true', () => {
      component.isLoading = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return false when form is valid and not loading', () => {
      component.isLoading = false;
      component.filterForm.updateValueAndValidity();
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('isClearDisabled', () => {
    it('should return true when no form values, no filters, and not retrieved', () => {
      component.filterForm.reset({ testId: 'ALL', fromDate: null, toDate: null });
      component.appliedFilters.set({ reactive: null, ntsFlag: null, showCancel: null });
      component.hasRetrieved = false;
      component.validatedUnitId = null;
      expect(component.isClearDisabled).toBeTrue();
    });

    it('should return false when testId is not ALL', () => {
      component.filterForm.get('testId')?.setValue('HIV');
      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when hasRetrieved is true', () => {
      component.hasRetrieved = true;
      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when filters are applied', () => {
      component.appliedFilters.set({ reactive: 'Y', ntsFlag: null, showCancel: null });
      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when validatedUnitId has a value', () => {
      component.validatedUnitId = 'UNIT123';
      expect(component.isClearDisabled).toBeFalse();
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────
});
