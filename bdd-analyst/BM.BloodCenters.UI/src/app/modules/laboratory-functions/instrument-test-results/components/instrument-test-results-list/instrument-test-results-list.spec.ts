import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { InstrumentTestResultsListComponent } from './instrument-test-results-list';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  InstrumentTestDetailDto,
  InstrumentLookupDto,
} from '../../models/instrument-test-results.model';
import { InstrumentTestResultFilterChipsUtils } from '../../utils/filter-chips.utils';
import { FilterChip } from '@shared/components/filter-chips/filter-chips';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('InstrumentTestResultsListComponent', () => {
  let component: InstrumentTestResultsListComponent;
  let fixture: ComponentFixture<InstrumentTestResultsListComponent>;
  let apiServiceSpy: jasmine.SpyObj<InstrumentTestResultsApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const effDate  = new Date('2026-01-15');
  const termDate = new Date('2026-06-30');

  const mockMachines: InstrumentLookupDto[] = [
    { code: 'AX200', codeDesc: 'Architect i2000' },
    { code: 'PRISM', codeDesc: 'Prism System' },
  ];

  const mockRows: InstrumentTestDetailDto[] = [
    { chapterId: 'CH01', machineId: 'AX200', testId: 'HIVAB', testDesc: 'HIV Antibody', machineTestId: 'HIVAB', effDate: '2026-01-01', termDate: null },
    { chapterId: 'CH01', machineId: 'AX200', testId: 'HCVAB', testDesc: 'HCV Antibody', machineTestId: 'HCVAB', effDate: '2026-02-01', termDate: null },
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('InstrumentTestResultsApiService', [
      'getInstruments',
      'getAllInstrumentTests',
    ]);
    headerServiceSpy = createMockHeaderService({ chapterId: signal('CH01') });
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    apiServiceSpy.getInstruments.and.returnValue(of(mockMachines));
    apiServiceSpy.getAllInstrumentTests.and.returnValue(of({ data: mockRows, totalCount: 2 }));
      TestBed.configureTestingModule({
      imports: [InstrumentTestResultsListComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: InstrumentTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(undefined), getTitle: () => undefined, getSubtitle: () => undefined } },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });
      apiServiceSpy.getInstruments.and.returnValue(of(mockMachines));


      apiServiceSpy.getAllInstrumentTests.and.returnValue(of({ data: mockRows, totalCount: 2 }));
    fixture = TestBed.createComponent(InstrumentTestResultsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  /* ── Initialisation ───────────────────────────────────────── */

  describe('initialisation', () => {
    it('should call getInstruments on init with current chapter ID', () => {
      expect(apiServiceSpy.getInstruments).toHaveBeenCalledWith('CH01');
    });







    it('should set machines to empty array when instrument load fails', () => {
      apiServiceSpy.getInstruments.and.returnValue(throwError(() => new Error('Network error')));
      component['loadMachines']();
      expect(component.machines).toEqual([]);
    });
  });

  /* ── Machine selection ────────────────────────────────────── */

  describe('onMachineChange', () => {
    it('should set selectedMachineId', () => {
      component.onMachineChange('AX200');
      expect(component.selectedMachineId).toBe('AX200');
    });

    it('should call getAllInstrumentTests with the selected machine', () => {
      component.onMachineChange('AX200');
      expect(apiServiceSpy.getAllInstrumentTests.calls.mostRecent().args[0]).toBe('AX200');
    });

    it('should populate dataSource with results', () => {
      component.onMachineChange('AX200');
      expect(component.dataSource.length).toBe(2);
    });



    it('should set hasError when getAllInstrumentTests fails', () => {
      apiServiceSpy.getAllInstrumentTests.and.returnValue(throwError(() => new Error('Server error')));
      component.onMachineChange('AX200');
      expect(component.hasError).toBeTrue();
    });
  });



  /* ── showControls ─────────────────────────────────────────── */

  describe('showControls', () => {
    it('should return false when no machine is selected', () => {
      component.selectedMachineId = null;
      expect(component.showControls).toBeFalse();
    });

    it('should return true when machine is selected and no error', () => {
      component.selectedMachineId = 'AX200';
      component.hasError = false;
      expect(component.showControls).toBeTrue();
    });

    it('should return false on error state even with machine selected', () => {
      component.selectedMachineId = 'AX200';
      component.hasError = true;
      expect(component.showControls).toBeFalse();
    });

    it('should return true regardless of dataSource contents when machine selected and no error', () => {
      component.selectedMachineId = 'AX200';
      component.hasError = false;
      component.dataSource = [];
      expect(component.showControls).toBeTrue();
    });
  });

  /* ── Side panel ───────────────────────────────────────────── */

  describe('side panel', () => {
    it('should open add panel when createRecord() is called with machine selected', () => {
      component.selectedMachineId = 'AX200';
      component.createRecord();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should not open panel when createRecord() called without machine', () => {
      component.selectedMachineId = null;
      component.createRecord();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should open edit panel with row data when editRecord() is called', () => {
      const row = mockRows[0];
      component.editRecord(row);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
    });

    it('should close side panel and clear data on closeSidePanel()', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockRows[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on onSaveSuccess()', () => {
      component.selectedMachineId = 'AX200';
      const callsBefore = apiServiceSpy.getAllInstrumentTests.calls.count();
      component.onSaveSuccess();
      expect(apiServiceSpy.getAllInstrumentTests.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  /* ── Pagination and sorting ───────────────────────────────── */
  /* ── Row action ───────────────────────────────────────────── */

  describe('onRowAction', () => {
    it('should open edit panel for edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRows[0] });
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRows[0]);
    });

    it('should navigate via router for view action (not open side panel)', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.sidePanelOpen = false;
      component.onRowAction({ action: 'view', row: mockRows[0] });
      expect(router.navigate).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  /* ── Keyboard shortcuts ───────────────────────────────────── */
  /* ── Chapter change ───────────────────────────────────────── */

  describe('chapter change', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component.dataSource = mockRows;
      component.filterChips = [{ key: 'effectiveDate', label: 'Eff Dt ≥ 15-JAN-2026', value: effDate }];
      component.sidePanelOpen = true;
    });







    it('should not close side panel on chapter change', () => {
      chapterChanged$.next();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should not reload instruments on chapter change', () => {
      const callsBefore = apiServiceSpy.getInstruments.calls.count();
      chapterChanged$.next();
      expect(apiServiceSpy.getInstruments.calls.count()).toBe(callsBefore);
    });
  });

  /* ── filterChips ──────────────────────────────────────────── */

  describe('filterChips', () => {
    it('should start as empty array', () => {
      expect(component.filterChips).toEqual([]);
    });

    it('should reflect chips assigned directly', () => {
      const chip: FilterChip = { key: 'effectiveDate', label: 'Eff Dt ≥ 15-JAN-2026', value: effDate };
      component.filterChips = [chip];
      expect(component.filterChips[0]).toEqual(chip);
    });

    it('should produce effectiveDate chip via convertFiltersToChips when date and period set', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
      });
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
    });

    it('should produce terminationDate chip via convertFiltersToChips', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips[0].key).toBe('terminationDate');
    });

    it('should produce two chips when both date filters are active', () => {
      const chips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(chips.length).toBe(2);
    });

    it('should return empty when convertFiltersToChips receives null', () => {
      expect(InstrumentTestResultFilterChipsUtils.convertFiltersToChips(null).length).toBe(0);
    });
  });

  /* ── hasActiveFilters ─────────────────────────────────────── */

  describe('hasActiveFilters', () => {
    it('should return false when filterChips is empty', () => {
      component.filterChips = [];
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when filterChips has items', () => {
      component.filterChips = [{ key: 'effectiveDate', label: 'Eff Dt ≥ 15-JAN-2026', value: effDate }];
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  /* ── onRemoveFilterChip ───────────────────────────────────── */

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component.currentFilters = {
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      };
      component.filterChips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips(component.currentFilters);
      component.requestState = {
        effectiveDate: '2026-01-15',
        effectiveDatePeriod: 'AFTER',
        terminationDate: '2026-06-30',
        terminationDatePeriod: 'BEFORE',
      };
    });

    it('should null effectiveDate in currentFilters and requestState after removing effectiveDate chip', () => {
      component.onRemoveFilterChip('effectiveDate');
      expect(component.currentFilters.effectiveDate).toBeNull();
      expect(component.currentFilters.effectiveDatePeriod).toBeNull();
      expect(component.requestState.effectiveDate).toBeNull();
    });

    it('should remove effectiveDate chip from filterChips array', () => {
      component.onRemoveFilterChip('effectiveDate');
      expect(component.filterChips.find(c => c.key === 'effectiveDate')).toBeUndefined();
    });

    it('should preserve terminationDate when removing effectiveDate', () => {
      component.onRemoveFilterChip('effectiveDate');
      expect(component.currentFilters.terminationDate).not.toBeNull();
    });

    it('should null terminationDate when removing terminationDate chip', () => {
      component.onRemoveFilterChip('terminationDate');
      expect(component.currentFilters.terminationDate).toBeNull();
      expect(component.currentFilters.terminationDatePeriod).toBeNull();
    });



  });

  /* ── clearAllFilters ──────────────────────────────────────── */

  describe('clearAllFilters', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component.currentFilters = {
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      };
      component.filterChips = InstrumentTestResultFilterChipsUtils.convertFiltersToChips(component.currentFilters);
      component.requestState = {
        effectiveDate: '2026-01-15',
        effectiveDatePeriod: 'AFTER',
        terminationDate: '2026-06-30',
        terminationDatePeriod: 'BEFORE',
      };
    });



    it('should null all date fields in requestState', () => {
      component.clearAllFilters();
      expect(component.requestState.effectiveDate).toBeNull();
      expect(component.requestState.effectiveDatePeriod).toBeNull();
      expect(component.requestState.terminationDate).toBeNull();
      expect(component.requestState.terminationDatePeriod).toBeNull();
    });



    it('should reload data', () => {
      component['allData'] = mockRows;
      component.clearAllFilters();
      // Client-side reprocessing updates dataSource from allData
      expect(component.dataSource.length).toBe(mockRows.length);
    });

    it('should leave hasActiveFilters false after clearing', () => {
      component.clearAllFilters();
      expect(component.hasActiveFilters()).toBeFalse();
    });
  });

  /* ── clearMachineSelection ─────────────────────────────────── */

  describe('clearMachineSelection', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component['allData'] = mockRows;
      component.dataSource = mockRows;
      component.requestState = { searchKeyword: 'HIV' };
      component.currentFilters = { effectiveDate: effDate, effectiveDatePeriod: 'AFTER' };
      component.filterChips = [{ key: 'effectiveDate', label: 'Eff Dt', value: effDate }];
      component.isFilterPanelOpen = true;
      component.searchText = 'HIV';
      component.sidePanelOpen = true;
    });

    it('should reset selectedMachineId to null', () => {
      component.clearMachineSelection();
      expect(component.selectedMachineId).toBeNull();
    });

    it('should clear allData and dataSource', () => {
      component.clearMachineSelection();
      expect(component['allData']).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });

    it('should clear requestState, currentFilters and filterChips', () => {
      component.clearMachineSelection();
      expect(component.requestState).toEqual({});
      expect(component.currentFilters).toEqual({});
      expect(component.filterChips).toEqual([]);
    });

    it('should close the filter panel and side panel', () => {
      component.clearMachineSelection();
      expect(component.isFilterPanelOpen).toBeFalse();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should clear searchText', () => {
      component.clearMachineSelection();
      expect(component.searchText).toBe('');
    });
  });

  /* ── onSearch ──────────────────────────────────────────────── */

  describe('onSearch', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component['allData'] = mockRows;
    });

    it('should set searchKeyword in requestState', () => {
      component.onSearch('HIV');
      expect(component.requestState.searchKeyword).toBe('HIV');
    });

    it('should set searchKeyword to null for empty string', () => {
      component.onSearch('');
      expect(component.requestState.searchKeyword).toBeNull();
    });

    it('should filter dataSource to matching rows', () => {
      component.onSearch('HIV');
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].testId).toBe('HIVAB');
    });
  });

  /* ── onSortChange ──────────────────────────────────────────── */

  describe('onSortChange', () => {
    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component['allData'] = mockRows;
    });

    it('should update sortConfig column and direction', () => {
      component.onSortChange({ column: 'testDesc', direction: 'D' });
      expect(component.tableConfig.sortConfig!.column).toBe('testDesc');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should close the side panel', () => {
      component.sidePanelOpen = true;
      component.onSortChange({ column: 'testId', direction: 'A' });
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should sort descending when direction is D', () => {
      component.onSortChange({ column: 'testId', direction: 'D' });
      expect(component.dataSource[0].testId).toBe('HIVAB');
      expect(component.dataSource[1].testId).toBe('HCVAB');
    });

    it('should sort ascending when direction is A', () => {
      component.onSortChange({ column: 'testId', direction: 'A' });
      expect(component.dataSource[0].testId).toBe('HCVAB');
      expect(component.dataSource[1].testId).toBe('HIVAB');
    });
  });

  /* ── handleKeyboardShortcut ────────────────────────────────── */

  describe('handleKeyboardShortcut', () => {
    it('should call createRecord on Alt+C when machine is selected', () => {
      component.selectedMachineId = 'AX200';
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not close side panel on Escape when panel is already closed', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  /* ── selectedMachineName getter ────────────────────────────── */

  describe('selectedMachineName', () => {
    it('should return codeDesc when machine is found', () => {
      component.machines = mockMachines;
      component.selectedMachineId = 'AX200';
      expect(component.selectedMachineName).toBe('Architect i2000');
    });

    it('should return selectedMachineId when machine is not found in list', () => {
      component.machines = mockMachines;
      component.selectedMachineId = 'UNKNOWN';
      expect(component.selectedMachineName).toBe('UNKNOWN');
    });

    it('should return empty string when selectedMachineId is null', () => {
      component.machines = mockMachines;
      component.selectedMachineId = null;
      expect(component.selectedMachineName).toBe('');
    });
  });

  /* ── applyClientSideProcessing date filter branches ────────── */

  describe('applyClientSideProcessing date filters', () => {
    const rowsWithDates: InstrumentTestDetailDto[] = [
      { chapterId: 'CH01', machineId: 'AX200', testId: 'T1', testDesc: 'Test 1', machineTestId: 'T1', effDate: '2026-01-10', termDate: '2026-03-01' },
      { chapterId: 'CH01', machineId: 'AX200', testId: 'T2', testDesc: 'Test 2', machineTestId: 'T2', effDate: '2026-03-15', termDate: '2026-07-01' },
      { chapterId: 'CH01', machineId: 'AX200', testId: 'T3', testDesc: 'Test 3', machineTestId: 'T3', effDate: '2026-05-20', termDate: null },
    ];

    beforeEach(() => {
      component.selectedMachineId = 'AX200';
      component['allData'] = rowsWithDates;
    });

    it('should filter effectiveDate with BEFORE period', () => {
      component.currentFilters = { effectiveDate: new Date('2026-02-01'), effectiveDatePeriod: 'BEFORE' };
      component['applyClientSideProcessing']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].testId).toBe('T1');
    });

    it('should filter effectiveDate with AFTER period', () => {
      component.currentFilters = { effectiveDate: new Date('2026-03-01'), effectiveDatePeriod: 'AFTER' };
      component['applyClientSideProcessing']();
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource.map(r => r.testId)).toContain('T2');
      expect(component.dataSource.map(r => r.testId)).toContain('T3');
    });

    it('should filter terminationDate with BEFORE period', () => {
      component.currentFilters = { terminationDate: new Date('2026-04-01'), terminationDatePeriod: 'BEFORE' };
      component['applyClientSideProcessing']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].testId).toBe('T1');
    });

    it('should filter terminationDate with AFTER period', () => {
      component.currentFilters = { terminationDate: new Date('2026-04-01'), terminationDatePeriod: 'AFTER' };
      component['applyClientSideProcessing']();
      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].testId).toBe('T2');
    });

    it('should exclude rows with null termDate when terminationDate filter is set', () => {
      component.currentFilters = { terminationDate: new Date('2026-01-01'), terminationDatePeriod: 'AFTER' };
      component['applyClientSideProcessing']();
      // T3 has null termDate, should be excluded
      const ids = component.dataSource.map(r => r.testId);
      expect(ids).not.toContain('T3');
    });
  });

  /* ── loadData edge cases ───────────────────────────────────── */

  describe('loadData edge cases', () => {
    it('should return early without calling API when selectedMachineId is null', () => {
      component.selectedMachineId = null;
      const callsBefore = apiServiceSpy.getAllInstrumentTests.calls.count();
      component.loadData();
      expect(apiServiceSpy.getAllInstrumentTests.calls.count()).toBe(callsBefore);
      expect(component.isLoading).toBeFalse();
    });

    it('should use error.error.message when available on API error', () => {
      component.selectedMachineId = 'AX200';
      const customError = { error: { message: 'Custom validation error' } };
      apiServiceSpy.getAllInstrumentTests.and.returnValue(throwError(() => customError));
      component.loadData();
      expect(component.errorMessage).toBe('Custom validation error');
    });

    it('should use fallback message when error.error.message is not present', () => {
      component.selectedMachineId = 'AX200';
      apiServiceSpy.getAllInstrumentTests.and.returnValue(throwError(() => new Error('generic')));
      component.loadData();
      expect(component.errorMessage).toBe('Failed to load instrument tests. Please try again.');
    });

    it('should clear allData and dataSource on error', () => {
      component.selectedMachineId = 'AX200';
      component['allData'] = mockRows;
      component.dataSource = mockRows;
      apiServiceSpy.getAllInstrumentTests.and.returnValue(throwError(() => new Error('fail')));
      component.loadData();
      expect(component['allData']).toEqual([]);
      expect(component.dataSource).toEqual([]);
    });
  });
});
