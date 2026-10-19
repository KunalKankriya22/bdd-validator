import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { InstrumentResultsListComponent } from './instrument-results-list';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { InstrumentResultDto } from '../../models/instrument-test-results.model';

const mockRecord: InstrumentResultDto = {
  chapterId: 'CH01',
  machineId: 'M01',
  testId: 'ABORH',
  resultStatus: 'POS',
  resultDesc: 'Positive',
  machineResultStatus: 'A+',
  effDate: '2025-01-01T00:00:00Z',
  termDate: null,
  lastModifiedDate: '2025-06-01T00:00:00Z',
};

const chapterChanged$ = new Subject<void>();

const mockApiService = {
  getInstrumentResults: jasmine.createSpy('getInstrumentResults').and.returnValue(
    of({ data: [mockRecord], totalCount: 1 })
  ),
};

const mockHeaderService = {
  getCurrentChapterId: () => 'CH01',
  chapterTimeZone: () => '-05:00',
  chapterChanged$: chapterChanged$.asObservable(),
};

const mockSnackbarService = {
  showError: jasmine.createSpy('showError'),
  showSuccess: jasmine.createSpy('showSuccess'),
};

const mockDialogRef: Partial<MatDialogRef<any>> = {
  afterClosed: () => of(null),
};

const mockDialogService = {
  open: jasmine.createSpy('open').and.returnValue(mockDialogRef),
};

const mockChapterTimezoneService = {
  convertGmtToLocal: (m: any) => m.clone(),
  getChapterLocalDate: () => moment().startOf('day'),
};

const mockActivatedRoute = {
  params: of({ machineId: 'M01', testId: 'ABORH' }),
};

describe('InstrumentResultsListComponent', () => {
  let component: InstrumentResultsListComponent;
  let fixture: ComponentFixture<InstrumentResultsListComponent>;
  let router: Router;

  beforeEach(() => {

    mockApiService.getInstrumentResults = jasmine.createSpy('getInstrumentResults').and.returnValue(
      of({ data: [mockRecord], totalCount: 1 })
    );
    mockSnackbarService.showError = jasmine.createSpy('showError');
    mockDialogService.open = jasmine.createSpy('open').and.returnValue(mockDialogRef);



      TestBed.configureTestingModule({
      imports: [InstrumentResultsListComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: InstrumentTestResultsApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialogService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });


    



    fixture = TestBed.createComponent(InstrumentResultsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();


    });

  // ── Creation & init ────────────────────────────────────────────────────────






  // ── Data loading ───────────────────────────────────────────────────────────





  it('should set hasError to false on successful load', () => {
    expect(component.hasError).toBeFalse();
  });

  it('should set hasError and empty dataSource on API error', () => {
    mockApiService.getInstrumentResults.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    fixture.detectChanges();
    expect(component.hasError).toBeTrue();
    expect(component.dataSource).toEqual([]);
  });

  it('should populate dataSource from API response', () => {
    expect(component.dataSource.length).toBe(1);
  });

  // ── Table config ───────────────────────────────────────────────────────────







  // ── Table column keys and headers ──────────────────────────────────────────

  describe('table columns', () => {
    it('should include all expected column keys', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toContain('resultStatus');
      expect(keys).toContain('resultDesc');
      expect(keys).toContain('machineResultStatus');
      expect(keys).toContain('effDate');
      expect(keys).toContain('termDate');
      expect(keys).toContain('lastModifiedDate');
    });

    it('should label resultStatus column as "Result"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'resultStatus');
      expect(col?.header).toBe('Result');
    });

    it('should label resultDesc column as "Description"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'resultDesc');
      expect(col?.header).toBe('Description');
    });

    it('should label machineResultStatus column as "Instrument Result"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'machineResultStatus');
      expect(col?.header).toBe('Instrument Result');
    });

    it('should label effDate column as "Effective Date"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(col?.header).toBe('Effective Date');
    });

    it('should label termDate column as "Termination Date"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(col?.header).toBe('Termination Date');
    });

    it('should label lastModifiedDate column as "Modification Date"', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      expect(col?.header).toBe('Modification Date');
    });

    it('should mark resultStatus as sortable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'resultStatus');
      expect(col?.sortable).toBeTrue();
    });


  });

  // ── Side panel ─────────────────────────────────────────────────────────────

  it('should open add panel with createRecord()', () => {
    component.createRecord();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should open edit panel with correct record on editRecord()', () => {
    component.editRecord(mockRecord);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockRecord);
  });

  it('should close side panel and clear sidePanelData on closeSidePanel()', () => {
    component.sidePanelOpen = true;
    component.sidePanelData = mockRecord;
    component.closeSidePanel();
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });

  it('should dispatch editRecord when onRowAction fires action "edit"', () => {
    spyOn(component, 'editRecord');
    component.onRowAction({ action: 'edit', row: mockRecord });
    expect(component.editRecord).toHaveBeenCalledWith(mockRecord);
  });

  // ── Save success ───────────────────────────────────────────────────────────



  // ── Search ─────────────────────────────────────────────────────────────────

  describe('search', () => {




    it('should set searchKeyword and reload data on onSearch()', () => {
      mockApiService.getInstrumentResults.calls.reset();
      component.onSearch('positive');
      expect(component.requestState.searchKeyword).toBe('positive');
      expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
    });




  });

  // ── Pagination & sort ──────────────────────────────────────────────────────





  // ── Filters ────────────────────────────────────────────────────────────────



  it('should clear all filters, chips and reload on clearAllFilters()', () => {
    component.filterChips = [{ key: 'effDate', label: 'Eff Dt', value: null }];
    component.currentFilters = { effectiveDate: new Date() };
    mockApiService.getInstrumentResults.calls.reset();
    component.clearAllFilters();
    expect(component.filterChips.length).toBe(0);
    expect(component.currentFilters).toEqual({});
    expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
  });



  // ── Navigation ─────────────────────────────────────────────────────────────



  // ── Keyboard shortcuts ─────────────────────────────────────────────────────







  // ── Chapter change ─────────────────────────────────────────────────────────

  describe('chapter change', () => {


    it('should close side panel on chapter change', () => {
      component.sidePanelOpen = true;
      chapterChanged$.next();
      expect(component.sidePanelOpen).toBeFalse();
    });





    it('should reload data on chapter change', () => {
      mockApiService.getInstrumentResults.calls.reset();
      chapterChanged$.next();
      expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
    });
  });

  // ── Instance identity ──────────────────────────────────────────────────────

  it('should create a second independent instance', () => {
    const fixture2 = TestBed.createComponent(InstrumentResultsListComponent);
    fixture2.detectChanges();
    expect(fixture2.componentInstance).not.toBe(component);
  });

  // ── initializeConfigurations ────────────────────────────────────────────────

  it('should set headerConfig title to testDescription and subtitle with machineName', () => {
    component.testDescription = 'ABO/Rh Test';
    component.machineName = 'Machine One';
    (component as any).initializeConfigurations();
    expect(component.headerConfig.title).toBe('ABO/Rh Test');
    expect(component.headerConfig.subtitle).toContain('M01 | Machine One');
    expect(component.headerConfig.breadcrumbs!.length).toBe(3);
  });

  it('should fall back to testId and machineId when description and name are empty', () => {
    component.testDescription = '';
    component.machineName = '';
    (component as any).initializeConfigurations();
    expect(component.headerConfig.title).toBe('ABORH');
    expect(component.headerConfig.subtitle).toBe('M01');
  });

  // ── onSortChange ──────────────────────────────────────────────────────────

  it('should update sortConfig and reload data on onSortChange()', () => {
    mockApiService.getInstrumentResults.calls.reset();
    component.onSortChange({ column: 'effDate', direction: 'D' });
    expect(component.tableConfig.sortConfig!.column).toBe('effDate');
    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
  });

  // ── onRowAction ───────────────────────────────────────────────────────────

  it('should set sidePanelMode to edit and sidePanelData on onRowAction with edit', () => {
    component.onRowAction({ action: 'edit', row: mockRecord });
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockRecord);
  });

  it('should not change sidePanelMode when onRowAction fires non-edit action', () => {
    component.sidePanelMode = 'add';
    component.onRowAction({ action: 'delete', row: mockRecord });
    expect(component.sidePanelMode).toBe('add');
  });

  // ── onSaveSuccess ─────────────────────────────────────────────────────────

  it('should reload data on onSaveSuccess()', () => {
    mockApiService.getInstrumentResults.calls.reset();
    component.onSaveSuccess();
    expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
  });

  // ── onBack ────────────────────────────────────────────────────────────────

  it('should navigate back to instrument-test-results on onBack()', () => {
    spyOn(router, 'navigate');
    component.onBack();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/laboratory-functions/testing-modules/testing-administration/instrument-test-results'],
      { state: { machineId: 'M01', testId: 'ABORH' } }
    );
  });

  // ── handleKeyboardShortcut ────────────────────────────────────────────────

  it('should open add panel on Alt+C', () => {
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
    component.handleKeyboardShortcut(event);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
  });

  it('should close side panel on Escape when panel is open', () => {
    component.sidePanelOpen = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeyboardShortcut(event);
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should not change panel state on Escape when panel is already closed', () => {
    component.sidePanelOpen = false;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeyboardShortcut(event);
    expect(component.sidePanelOpen).toBeFalse();
  });

  // ── openFilter ────────────────────────────────────────────────────────────

  it('should apply filters and reload when openFilter dialog returns filters', () => {
    const filters = { effectiveDate: new Date('2025-01-01'), effectiveDatePeriod: 'AFTER' as const };
    const dialogRefWithFilters = { afterClosed: () => of(filters) };
    mockDialogService.open.and.returnValue(dialogRefWithFilters);
    mockApiService.getInstrumentResults.calls.reset();

    const fakeButton = {
      getBoundingClientRect: () => ({ left: 100, bottom: 200, right: 460, top: 150, width: 100, height: 50 }),
      blur: jasmine.createSpy('blur'),
    };
    const fakeEvent = { currentTarget: fakeButton } as any;
    component.openFilter(fakeEvent);

    expect(component.currentFilters).toEqual(filters);
    expect(component.filterChips.length).toBeGreaterThan(0);
    expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
  });

  it('should not change filters when openFilter dialog is dismissed', () => {
    const dialogRefNull = { afterClosed: () => of(null) };
    mockDialogService.open.and.returnValue(dialogRefNull);
    component.currentFilters = {};
    mockApiService.getInstrumentResults.calls.reset();

    const fakeButton = {
      getBoundingClientRect: () => ({ left: 100, bottom: 200, right: 460, top: 150, width: 100, height: 50 }),
      blur: jasmine.createSpy('blur'),
    };
    const fakeEvent = { currentTarget: fakeButton } as any;
    component.openFilter(fakeEvent);

    expect(component.currentFilters).toEqual({});
    expect(mockApiService.getInstrumentResults).not.toHaveBeenCalled();
  });

  // ── onRemoveFilterChip ────────────────────────────────────────────────────

  it('should remove filter chip and reload data on onRemoveFilterChip()', () => {
    component.currentFilters = { effectiveDate: new Date('2025-01-01'), effectiveDatePeriod: 'AFTER' };
    component.filterChips = [{ key: 'effectiveDate', label: 'Eff >= 01-JAN-2025', value: null, removable: true }];
    mockApiService.getInstrumentResults.calls.reset();
    component.onRemoveFilterChip('effectiveDate');
    expect(component.currentFilters.effectiveDate).toBeNull();
    expect(mockApiService.getInstrumentResults).toHaveBeenCalled();
  });

  // ── chapter change additional cases ───────────────────────────────────────

  it('should reset searchText on chapter change', () => {
    component.searchText = 'test';
    chapterChanged$.next();
    expect(component.searchText).toBe('');
  });

  it('should reset currentFilters on chapter change', () => {
    component.currentFilters = { effectiveDate: new Date() };
    chapterChanged$.next();
    expect(component.currentFilters).toEqual({});
  });

  // ── loadData sort direction mapping ───────────────────────────────────────

  it('should pass sortOrder DESC when sort direction is D', () => {
    component.tableConfig.sortConfig = { column: 'effDate', direction: 'D' };
    mockApiService.getInstrumentResults.calls.reset();
    component.loadData();
    const query = mockApiService.getInstrumentResults.calls.mostRecent().args[2];
    expect(query.sortOrder).toBe('DESC');
  });

  it('should pass sortOrder ASC when sort direction is default', () => {
    component.tableConfig.sortConfig = { column: 'resultStatus', direction: 'default' };
    mockApiService.getInstrumentResults.calls.reset();
    component.loadData();
    const query = mockApiService.getInstrumentResults.calls.mostRecent().args[2];
    expect(query.sortOrder).toBe('ASC');
  });

  // ── formatDateWithTimezone via valueFormatter ─────────────────────────────

  it('should return empty string for null date via valueFormatter', () => {
    const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
    expect(effDateCol!.valueFormatter!(null as any)).toBe('');
  });

  it('should format valid date via valueFormatter', () => {
    const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
    const result = effDateCol!.valueFormatter!('2025-01-01T00:00:00Z');
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
  });

  it('should return empty string for invalid date via valueFormatter', () => {
    const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
    expect(effDateCol!.valueFormatter!('not-a-date')).toBe('');
  });
});
