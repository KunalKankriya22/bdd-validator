import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { FcodeComponent } from './fcode.component';
import { MasterServiceCodeService } from './services/master-service-code.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  MasterServiceCodeDto,
  MasterServiceCodeTableRow,
  MasterServiceCodeFilterOptions,
} from './models/master-service-code.model';
import { FcodeDialogResult } from './components/fcode-form-dialog/fcode-form-dialog.component';

describe('FcodeComponent', () => {
  let component: FcodeComponent;
  let fixture: ComponentFixture<FcodeComponent>;
  let serviceSpy: jasmine.SpyObj<MasterServiceCodeService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockDtos: MasterServiceCodeDto[] = [
    { billingCode: 'SVC001', codeDesc: 'Service One', effDate: '2026-01-01', termDate: null, lastModifiedDate: '2026-01-01T08:00:00Z' },
    { billingCode: 'SVC002', codeDesc: 'Service Two', effDate: '2026-02-01', termDate: '2026-12-31', lastModifiedDate: null },
  ];

  const mockApiResponse = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: mockDtos,
    total: 2,
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('MasterServiceCodeService', [
      'getAll', 'getByCode', 'create', 'update', 'delete',
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Master Service Code', subtitle: '' }),
    });

    serviceSpy.getAll.and.returnValue(of(mockApiResponse));

    TestBed.configureTestingModule({
      imports: [FcodeComponent, NoopAnimationsModule],
      providers: [
        { provide: MasterServiceCodeService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(FcodeComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }
  });

  afterEach(() => {
    fixture.destroy();
  });

  // --- loadData ---

  describe('loadData', () => {
    it('should populate data signal and totalRecords on success', () => {
      expect(component['data']().length).toBe(2);
      expect(component['totalRecords']()).toBe(2);
      expect(component['loading']()).toBe(false);
    });

    it('should map DTOs to table rows', () => {
      const rows = component['data']();
      expect(rows[0].billingCode).toBe('SVC001');
      expect(rows[0].codeDesc).toBe('Service One');
      expect(rows[0].termDate).toBeNull();
      expect(rows[1].termDate).toBe('2026-12-31');
    });

    it('should set empty data when response is not success', () => {
      serviceSpy.getAll.and.returnValue(of({ ...mockApiResponse, success: false, data: undefined }));
      component.loadData();
      expect(component['data']()).toEqual([]);
      expect(component['totalRecords']()).toBe(0);
    });

    it('should set error on API failure', () => {
      serviceSpy.getAll.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.loadData();
      expect(component['error']()).toContain('Server error');
      expect(component['loading']()).toBe(false);
      expect(component['data']()).toEqual([]);
    });

    it('should use fallback error message', () => {
      serviceSpy.getAll.and.returnValue(throwError(() => new Error()));
      component.loadData();
      expect(component['error']()).toBe('Failed to load master service codes');
    });

    it('should pass search keyword to query', () => {
      component['searchKeyword'].set('SVC');
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.searchKeyword).toBe('SVC');
    });

    it('should pass pagination skip and take', () => {
      component['pageSize'].set(50);
      component['pageIndex'].set(2);
      serviceSpy.getAll.calls.reset();
      component.loadData();
      expect(serviceSpy.getAll.calls.mostRecent().args[0]).toBe(50);
      expect(serviceSpy.getAll.calls.mostRecent().args[1]).toBe(100);
    });

    it('should include effective date filter as effDateFrom for After', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-03-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.effDateFrom).toBeDefined();
    });

    it('should include effective date filter as effDateTo for Before', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2026-03-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.effDateTo).toBeDefined();
    });

    // Gap #4: Termination date filter tests
    it('should include termination date filter as termDateFrom for After', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2026-01-01'),
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.termDateFrom).toBe('2026-01-01');
    });

    it('should include termination date filter as termDateTo for Before', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2026-12-31'),
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.termDateTo).toBe('2026-12-31');
    });

    it('should include both effective and termination date filters when both are set', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2026-12-31'),
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.effDateFrom).toBeDefined();
      expect(queryDto.termDateTo).toBeDefined();
    });

    it('should not include termination date filter when only period is set', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: null,
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.termDateFrom).toBeUndefined();
      expect(queryDto.termDateTo).toBeUndefined();
    });

    it('should not include termination date filter when only date is set', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2026-12-31'),
      });
      serviceSpy.getAll.calls.reset();
      component.loadData();
      const queryDto = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(queryDto.termDateFrom).toBeUndefined();
      expect(queryDto.termDateTo).toBeUndefined();
    });
  });

  // --- Search ---

  describe('onSearch', () => {
    it('should set keyword and reset page index', () => {
      component.onSearch('platelet');
      expect(component['searchKeyword']()).toBe('platelet');
      expect(component['pageIndex']()).toBe(0);
    });

    it('should trigger data reload', () => {
      serviceSpy.getAll.calls.reset();
      component.onSearch('test');
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });
  });

  // --- Pagination ---

  describe('onPageChange', () => {
    it('should update page size and index', () => {
      component.onPageChange({ pageSize: 100, pageIndex: 3 } as PageEvent);
      expect(component['pageSize']()).toBe(100);
      expect(component['pageIndex']()).toBe(3);
    });

    it('should reload data', () => {
      serviceSpy.getAll.calls.reset();
      component.onPageChange({ pageSize: 25, pageIndex: 1 } as PageEvent);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });
  });

  // --- Side panel (add/edit) ---

  describe('onAddNew', () => {
    it('should open side panel with null record', () => {
      component.onAddNew();
      expect(component['sidePanelOpen']()).toBe(true);
      expect(component['sidePanelRecord']()).toBeNull();
    });
  });

  describe('onEdit', () => {
    it('should fetch record and open side panel', () => {
      serviceSpy.getByCode.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [mockDtos[0]],
      }));

      const row: MasterServiceCodeTableRow = {
        billingCode: 'SVC001', codeDesc: 'Service One',
        effDate: '2026-01-01', termDate: null,
      };
      component.onEdit(row);

      expect(serviceSpy.getByCode).toHaveBeenCalledWith('SVC001');
      expect(component['sidePanelRecord']()).toEqual(mockDtos[0]);
      expect(component['sidePanelOpen']()).toBe(true);
      expect(component['editingRow']()).toBe('SVC001');
    });

    it('should clear editingRow when API returns no data', () => {
      serviceSpy.getByCode.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: [],
      }));

      component.onEdit({ billingCode: 'SVC001', codeDesc: '', effDate: '', termDate: null });

      expect(component['editingRow']()).toBeNull();
      expect(component['sidePanelOpen']()).toBe(false);
    });

    it('should clear editingRow and set error on API failure', () => {
      serviceSpy.getByCode.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

      component.onEdit({ billingCode: 'SVC001', codeDesc: '', effDate: '', termDate: null });

      expect(component['editingRow']()).toBeNull();
      expect(component['error']()).toContain('Not found');
    });
  });

  describe('onPanelClosed', () => {
    it('should close panel and clear editing row', () => {
      component['sidePanelOpen'].set(true);
      component['editingRow'].set('SVC001');

      component.onPanelClosed(undefined);

      expect(component['sidePanelOpen']()).toBe(false);
      expect(component['editingRow']()).toBeNull();
    });

    it('should reload data when result was saved', () => {
      serviceSpy.getAll.calls.reset();
      component.onPanelClosed({ saved: true } as FcodeDialogResult);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });

    it('should not reload when result was not saved', () => {
      serviceSpy.getAll.calls.reset();
      component.onPanelClosed({ saved: false } as FcodeDialogResult);
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should reopen panel for addAnother', (done) => {
      component.onPanelClosed({ saved: true, addAnother: true } as FcodeDialogResult);
      expect(component['sidePanelOpen']()).toBe(false);
      setTimeout(() => {
        expect(component['sidePanelOpen']()).toBe(true);
        expect(component['sidePanelRecord']()).toBeNull();
        done();
      }, 100);
    });
  });

  // --- Filter panel form validation ---

  describe('filter panel form', () => {
    it('should initialize with null values', () => {
      expect(component.filterPanelForm.value).toEqual({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      });
    });

    it('filterHasValues should be false initially', () => {
      expect(component['filterHasValues']()).toBe(false);
    });

    it('filterHasValues should be true when a field has value', () => {
      component.filterPanelForm.patchValue({ effectiveDatePeriod: 'After' });
      expect(component['filterHasValues']()).toBe(true);
    });

    it('filterCanApply should be false when only period is set (incomplete pair)', () => {
      component.filterPanelForm.patchValue({ effectiveDatePeriod: 'After', effectiveDate: null });
      expect(component['filterCanApply']()).toBe(false);
    });

    it('filterCanApply should be true when both period and date are set', () => {
      component.filterPanelForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-01-01'),
      });
      expect(component['filterCanApply']()).toBe(true);
    });
  });

  // --- onApplyFilters ---

  describe('onApplyFilters', () => {
    it('should set error when period is set without date', () => {
      component.filterPanelForm.patchValue({
        effectiveDatePeriod: 'After', effectiveDate: null,
      });
      component.onApplyFilters();
      expect(component.filterPanelForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should set error when date is set without period', () => {
      component.filterPanelForm.patchValue({
        effectiveDatePeriod: null, effectiveDate: new Date('2026-01-01'),
      });
      component.onApplyFilters();
      expect(component.filterPanelForm.get('effectiveDatePeriod')?.hasError('required')).toBe(true);
    });

    it('should apply filters and reload when both pairs are complete', () => {
      const moment = require('moment');
      component.filterPanelForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-03-01'),
      });
      serviceSpy.getAll.calls.reset();
      component.onApplyFilters();
      expect(component.showFilterPanel).toBe(false);
      expect(component['pageIndex']()).toBe(0);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });

    it('should not apply when termination pair is incomplete', () => {
      component.filterPanelForm.patchValue({
        terminationDatePeriod: 'Before', terminationDate: null,
      });
      serviceSpy.getAll.calls.reset();
      component.onApplyFilters();
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  // --- Filter chips ---

  describe('buildFilterChips', () => {
    it('should create chip for effective date filter', () => {
      const filters: MasterServiceCodeFilterOptions = {
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2026-03-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      };
      const chips = (component as any).buildFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Eff. Date After');
    });

    it('should create chip for termination date filter', () => {
      const filters: MasterServiceCodeFilterOptions = {
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2026-12-31'),
      };
      const chips = (component as any).buildFilterChips(filters);
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Term. Date Before');
    });

    it('should return empty array when no filters', () => {
      const chips = (component as any).buildFilterChips({
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: null, terminationDate: null,
      });
      expect(chips).toEqual([]);
    });
  });

  // --- onRemoveFilterChip ---

  describe('onRemoveFilterChip', () => {
    it('should clear effective date filter and reload', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: 'After', effectiveDate: new Date('2026-01-01'),
        terminationDatePeriod: null, terminationDate: null,
      });
      serviceSpy.getAll.calls.reset();
      component.onRemoveFilterChip('effectiveDate');
      const filters = component['activeFilters']();
      expect(filters.effectiveDatePeriod).toBeNull();
      expect(filters.effectiveDate).toBeNull();
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });

    it('should clear termination date filter and reload', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: 'Before', terminationDate: new Date('2026-12-31'),
      });
      component.onRemoveFilterChip('terminationDate');
      const filters = component['activeFilters']();
      expect(filters.terminationDatePeriod).toBeNull();
      expect(filters.terminationDate).toBeNull();
    });
  });

  // --- onClearFilters ---

  describe('onClearFilters', () => {
    it('should reset all filters, chips, and reload', () => {
      component['activeFilters'].set({
        effectiveDatePeriod: 'After', effectiveDate: new Date('2026-01-01'),
        terminationDatePeriod: null, terminationDate: null,
      });
      component.filterChips = [{ key: 'effectiveDate', label: 'x', value: '' }];
      serviceSpy.getAll.calls.reset();

      component.onClearFilters();

      expect(component['activeFilters']().effectiveDatePeriod).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.showFilterPanel).toBe(false);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });
  });

  // --- onClearFilterPanel ---

  describe('onClearFilterPanel', () => {
    it('should reset form without closing panel', () => {
      component.filterPanelForm.patchValue({ effectiveDatePeriod: 'After' });
      component.showFilterPanel = true;
      component.onClearFilterPanel();
      expect(component.filterPanelForm.value).toEqual({
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: null, terminationDate: null,
      });
      expect(component.showFilterPanel).toBe(true);
    });
  });

  // --- hasActiveFilters ---

  describe('hasActiveFilters', () => {
    it('should be false when no chips', () => {
      component.filterChips = [];
      expect(component.hasActiveFilters).toBe(false);
    });

    it('should be true when chips exist', () => {
      component.filterChips = [{ key: 'effectiveDate', label: 'x', value: '' }];
      expect(component.hasActiveFilters).toBe(true);
    });
  });

  // --- Computed signals ---

  describe('computed state', () => {
    it('isEmpty should be true when no data and not loading', () => {
      component['data'].set([]);
      component['loading'].set(false);
      expect(component['isEmpty']()).toBe(true);
    });

    it('hasError should reflect error signal', () => {
      component['error'].set('Something went wrong');
      expect(component['hasError']()).toBe(true);
    });

    it('hasData should be true when data exists', () => {
      component['data'].set([{ billingCode: 'X', codeDesc: 'Y', effDate: '', termDate: null }]);
      expect(component['hasData']()).toBe(true);
    });
  });

  // --- onRetry ---

  describe('onRetry', () => {
    it('should reload data', () => {
      serviceSpy.getAll.calls.reset();
      component.onRetry();
      expect(serviceSpy.getAll).toHaveBeenCalled();
    });
  });

  // --- formatDate ---

  describe('formatDate', () => {
    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2026-01-15')).toBe('15-JAN-2026');
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return original for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    // Gap #1: Timezone display tests
    it('should convert UTC date to chapter timezone before formatting', () => {
      // Arrange
      const headerService = TestBed.inject(HeaderService);
      spyOn(headerService, 'getCurrentChapterTimezone').and.returnValue('America/New_York');
      const utcDateString = '2026-03-15T08:00:00Z'; // 8am UTC = 4am EST (winter) or 3am EDT (summer)

      // Act
      const result = component.formatDate(utcDateString);

      // Assert
      expect(headerService.getCurrentChapterTimezone).toHaveBeenCalled();
      expect(result).toContain('2026'); // Date should be converted to chapter timezone
    });

    it('should use UTC fallback when chapter timezone is not available', () => {
      // Arrange
      const headerService = TestBed.inject(HeaderService);
      spyOn(headerService, 'getCurrentChapterTimezone').and.returnValue(null);

      // Act
      const result = component.formatDate('2026-03-15T00:00:00Z');

      // Assert
      expect(result).toBe('15-MAR-2026'); // Should still format even with UTC fallback
    });

    it('should handle date strings with timezone information', () => {
      // Arrange
      const headerService = TestBed.inject(HeaderService);
      spyOn(headerService, 'getCurrentChapterTimezone').and.returnValue('America/Los_Angeles');

      // Act
      const result = component.formatDate('2026-06-15T17:30:00-07:00'); // PDT timezone

      // Assert
      expect(result).toContain('JUN');
      expect(result).toContain('2026');
    });
  });

  // --- Filter date error messages ---

  describe('getFilterEffectiveDateError', () => {
    it('should return empty when control not touched', () => {
      expect(component.getFilterEffectiveDateError()).toBe('');
    });

    it('should return required message when touched and required', () => {
      const ctrl = component.filterPanelForm.get('effectiveDate');
      ctrl?.setErrors({ required: true });
      ctrl?.markAsTouched();
      expect(component.getFilterEffectiveDateError()).toBe('Effective Date is required');
    });
  });

  describe('getFilterTerminationDateError', () => {
    it('should return empty when control not touched', () => {
      expect(component.getFilterTerminationDateError()).toBe('');
    });

    it('should return invalid message for parse error', () => {
      const ctrl = component.filterPanelForm.get('terminationDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getFilterTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  // --- onFilterDateKeyPress ---

  describe('onFilterDateKeyPress', () => {
    it('should allow alphanumeric and hyphens', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy() } as any;
      component.onFilterDateKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent special characters', () => {
      const event = { key: '@', preventDefault: jasmine.createSpy() } as any;
      component.onFilterDateKeyPress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy() } as any;
      component.onFilterDateKeyPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
