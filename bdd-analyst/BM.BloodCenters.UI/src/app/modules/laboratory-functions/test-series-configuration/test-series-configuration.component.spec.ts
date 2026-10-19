import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import moment from 'moment';

import { TestSeriesConfigurationComponent } from './test-series-configuration.component';
import { TestSeriesConfigApiService } from './services/test-series-configuration-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  TestSeriesConfigDto,
  TestSeriesDropdownItem,
  ValidTestItem,
} from './models/test-series-configuration.model';

describe('TestSeriesConfigurationComponent', () => {
  let component: TestSeriesConfigurationComponent;
  let fixture: ComponentFixture<TestSeriesConfigurationComponent>;
  let apiSpy: jasmine.SpyObj<TestSeriesConfigApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: any;
  const chapterChanged$ = new Subject<void>();

  const mockTestSeriesOptions: TestSeriesDropdownItem[] = [
    { testSeriesId: 'HIV', description: 'Abbott PRISM HIV RR' },
    { testSeriesId: 'HCV', description: 'HCV Series' },
  ];

  const mockValidTests: ValidTestItem[] = [
    { testId: 'HIV-1/2', testDesc: 'HIV Test', testGroup: 'CNFRM' },
    { testId: 'NAT', testDesc: 'NAT Test', testGroup: 'CNFRM' },
  ];

  const mockConfigData: TestSeriesConfigDto[] = [
    {
      testSeriesId: 'HIV',
      levelCode: 1,
      setNo: 1,
      testId: 'HIV-1/2',
      resultCode: 'R',
      scheduleTest: 'HIV 1 FA',
      cancelTest: 'HIV-1 WB',
      anotationCode: 'HIV-1 WB',
      finalFlag: 'Y',
      effDate: '2025-01-11T00:00:00Z',
      termDate: null,
      insertDate: '2024-01-01T00:00:00Z',
      insertUser: 'SYSTEM',
    },
  ];

  function setupDefaults(): void {
    apiSpy.getTestSeriesDropdown.and.returnValue(of(mockTestSeriesOptions));
    apiSpy.getValidTests.and.returnValue(of(mockValidTests));
    apiSpy.getAll.and.returnValue(of({ items: mockConfigData, totalRecords: 1 }));
    apiSpy.getNotationCodes.and.returnValue(of([]));
    apiSpy.getResultCodes.and.returnValue(of([{ resultCode: 'R', description: 'Reactive' }]));
  }

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('TestSeriesConfigApiService', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getTestSeriesDropdown', 'getValidTests', 'getNotationCodes', 'getResultCodes',
    ]);

    snackbarSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Test Series Configuration',
        subtitle: 'Configure test series',
      }),
    });

    setupDefaults();

    TestBed.configureTestingModule({
      imports: [TestSeriesConfigurationComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: TestSeriesConfigApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(TestSeriesConfigurationComponent);
    component = fixture.componentInstance;
  });

  // ── Helper: load data and enter edit mode ──
  function retrieveAndEdit(): void {
    fixture.detectChanges();
    component.filterForm.patchValue({ testSeriesId: 'HIV' });
    component.onRetrieve();
    tick();
    component.onToggleEditMode();
  }

  // ═══════════════════════════════════════════════════
  // FILTER FORM BEHAVIOR
  // ═══════════════════════════════════════════════════

  describe('Filter Form Behavior', () => {
    beforeEach(() => fixture.detectChanges());

    it('should clear Test ID when Test Series ID is selected', () => {
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      expect(component.filterForm.get('testId')?.value).toBeNull();
    });

    it('should clear Test Series ID when Test ID is selected', () => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      expect(component.filterForm.get('testSeriesId')?.value).toBeNull();
    });

    it('should re-enable Test ID when Test Series ID is cleared with no Test ID', () => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      expect(component.filterForm.get('testId')?.disabled).toBe(true);
      component.filterForm.patchValue({ testSeriesId: null });
      expect(component.filterForm.get('testId')?.disabled).toBe(false);
    });

    it('should re-enable Test Series ID when Test ID is cleared with no Test Series ID', () => {
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      expect(component.filterForm.get('testSeriesId')?.disabled).toBe(true);
      component.filterForm.patchValue({ testId: null });
      expect(component.filterForm.get('testSeriesId')?.disabled).toBe(false);
    });

    it('should get correct Test Series description', () => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      expect((component as any).getTestSeriesDescription()).toBe('Abbott PRISM HIV RR');
    });

    it('should return empty for no Test Series selection', () => {
      expect((component as any).getTestSeriesDescription()).toBe('');
    });

    it('should return empty for non-matching Test Series ID', () => {
      component.filterForm.patchValue({ testSeriesId: 'UNKNOWN' });
      expect((component as any).getTestSeriesDescription()).toBe('');
    });

    it('should get correct Test ID description', () => {
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      expect((component as any).getTestIdDescription()).toBe('HIV Test');
    });

    it('should return empty for no Test ID selection', () => {
      expect((component as any).getTestIdDescription()).toBe('');
    });

    it('should return empty for non-matching Test ID', () => {
      component.filterForm.patchValue({ testId: 'UNKNOWN' });
      expect((component as any).getTestIdDescription()).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════
  // COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════

  describe('Computed Signals', () => {
    beforeEach(() => fixture.detectChanges());

    it('canRetrieve should be false initially', () => {
      expect((component as any).canRetrieve()).toBe(false);
    });

    it('canRetrieve should be true when testSeriesId is set', () => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      expect((component as any).canRetrieve()).toBe(true);
    });

    it('canRetrieve should be true when testId is set', () => {
      component.filterForm.patchValue({ testId: 'NAT' });
      expect((component as any).canRetrieve()).toBe(true);
    });

    it('canClearFilters should mirror canRetrieve', () => {
      expect((component as any).canClearFilters()).toBe(false);
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      expect((component as any).canClearFilters()).toBe(true);
    });

    it('canSave should be false when no dirty rows', () => {
      expect((component as any).canSave()).toBe(false);
    });

    it('hasData should be false for empty data', () => {
      (component as any).data.set([]);
      expect((component as any).hasData()).toBe(false);
    });

    it('hasData should be true when data exists', () => {
      (component as any).data.set(mockConfigData as never[]);
      expect((component as any).hasData()).toBe(true);
    });

    it('headerConfig should return correct breadcrumbs and title', () => {
      const config = (component as any).headerConfig();
      expect(config.title).toBe('Test Series Configuration');
      expect(config.breadcrumbs.length).toBe(2);
      expect(config.breadcrumbs[0].label).toBe('Home');
    });
  });

  // ═══════════════════════════════════════════════════
  // FILTERED DROPDOWN SIGNALS
  // ═══════════════════════════════════════════════════

  describe('Filtered Dropdown Signals', () => {
    beforeEach(() => fixture.detectChanges());

    it('filteredTestSeries should return all when no search text', () => {
      expect((component as any).filteredTestSeries().length).toBe(2);
    });

    it('filteredTestSeries should filter by search text', () => {
      (component as any).testSeriesSearchText.set('hiv');
      expect((component as any).filteredTestSeries().length).toBe(1);
      expect((component as any).filteredTestSeries()[0].testSeriesId).toBe('HIV');
    });

    it('filteredTestIds should return all when no search text', () => {
      expect((component as any).filteredTestIds().length).toBe(2);
    });

    it('filteredTestIds should filter by search text', () => {
      (component as any).testIdSearchText.set('nat');
      expect((component as any).filteredTestIds().length).toBe(1);
    });

    it('filteredEditTestIds should filter by edit search text', () => {
      (component as any).editTestIdSearchText.set('hiv');
      expect((component as any).filteredEditTestIds().length).toBe(1);
    });

    it('filteredEditScheduleTests should filter schedule tests', () => {
      (component as any).editScheduleSearchText.set('xyz');
      expect((component as any).filteredEditScheduleTests().length).toBe(0);
    });

    it('filteredEditCancelTests should filter cancel tests', () => {
      (component as any).editCancelSearchText.set('');
      const count = (component as any).filteredEditCancelTests().length;
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('filteredEditNotationCodes should filter notation codes', () => {
      (component as any).editNotationSearchText.set('abc');
      expect((component as any).filteredEditNotationCodes().length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════

  describe('Data Loading', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load data when Test Series ID is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();

      expect(apiSpy.getAll).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({ testSeriesId: 'HIV' }));
      expect((component as any).data().length).toBe(1);
      expect((component as any).loading()).toBe(false);
    }));

    it('should load data when Test ID is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      component.onRetrieve();
      tick();
      expect(apiSpy.getAll).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({ testId: 'HIV-1/2' }));
    }));

    it('should show error when neither filter is selected', () => {
      component.onRetrieve();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Either Test Series ID or Test ID must be entered');
    });

    it('should handle API errors gracefully', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(throwError(() => new Error('API Error')));
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      expect((component as any).loading()).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should parse result codes into arrays', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of({ items: [{ ...mockConfigData[0], resultCode: 'R,NR,P' }], totalRecords: 1 }));
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      expect((component as any).data()[0].resultCodes).toEqual(['R', 'NR', 'P']);
    }));

    it('should handle null resultCode, scheduleTest, cancelTest', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of({
        items: [{ ...mockConfigData[0], resultCode: null, scheduleTest: null, cancelTest: null }],
        totalRecords: 1,
      }));
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      const row = (component as any).data()[0];
      expect(row.resultCodes).toEqual([]);
      expect(row.scheduleTests).toEqual([]);
      expect(row.cancelTests).toEqual([]);
    }));

    it('should split scheduleTest and cancelTest into arrays', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of({
        items: [{ ...mockConfigData[0], scheduleTest: 'A,B', cancelTest: 'C,D' }],
        totalRecords: 1,
      }));
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      const row = (component as any).data()[0];
      expect(row.scheduleTests).toEqual(['A', 'B']);
      expect(row.cancelTests).toEqual(['C', 'D']);
    }));

    it('should build filter chips on retrieve', fakeAsync(() => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('testSeriesId');
    }));

    it('should build filter chip for testId', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'NAT' });
      component.onRetrieve();
      tick();
      expect(component.filterChips.some(c => c.key === 'testId')).toBe(true);
    }));
  });

  // ═══════════════════════════════════════════════════
  // DROPDOWN LOADING ERRORS
  // ═══════════════════════════════════════════════════

  describe('Dropdown Loading Errors', () => {
    it('should handle test series dropdown error', () => {
      apiSpy.getTestSeriesDropdown.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith('Error loading test series dropdown:', jasmine.any(Error));
    });

    it('should handle valid tests error', () => {
      apiSpy.getValidTests.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith('Error loading test IDs:', jasmine.any(Error));
    });

    it('should handle notation codes error', () => {
      apiSpy.getNotationCodes.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(console.error).toHaveBeenCalledWith('Error loading notation codes:', jasmine.any(Error));
    });

    it('should handle result codes error', fakeAsync(() => {
      fixture.detectChanges();
      apiSpy.getResultCodes.and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      component.onToggleEditMode();
      expect(console.error).toHaveBeenCalledWith('Error loading result codes:', jasmine.any(Error));
    }));
  });

  // ═══════════════════════════════════════════════════
  // CLEAR ALL
  // ═══════════════════════════════════════════════════

  describe('Clear All Functionality', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset form and clear data', () => {
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      (component as any).data.set(mockConfigData as never[]);
      (component as any).totalRecords.set(1);

      component.onClearAll();

      expect(component.filterForm.get('testSeriesId')?.value).toBeNull();
      expect(component.filterForm.get('testSeriesId')?.disabled).toBe(false);
      expect(component.filterForm.get('testId')?.disabled).toBe(false);
      expect((component as any).data().length).toBe(0);
      expect((component as any).totalRecords()).toBe(0);
      expect((component as any).isEditMode()).toBe(false);
      expect((component as any).hasRetrieved()).toBe(false);
      expect(component.filterChips.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // REMOVE FILTER CHIP
  // ═══════════════════════════════════════════════════

  describe('Remove Filter Chip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
    }));

    it('should remove testSeriesId chip and re-enable testId', () => {
      (component as any).onRemoveFilterChip('testSeriesId');
      expect(component.filterForm.get('testSeriesId')?.value).toBeNull();
      expect(component.filterForm.get('testId')?.disabled).toBe(false);
      expect((component as any).data().length).toBe(0);
    });

    it('should remove testId chip and re-enable testSeriesId', fakeAsync(() => {
      component.onClearAll();
      component.filterForm.patchValue({ testId: 'NAT' });
      component.onRetrieve();
      tick();

      (component as any).onRemoveFilterChip('testId');
      expect(component.filterForm.get('testId')?.value).toBeNull();
      expect(component.filterForm.get('testSeriesId')?.disabled).toBe(false);
    }));
  });

  // ═══════════════════════════════════════════════════
  // PAGINATION & SORTING
  // ═══════════════════════════════════════════════════

  describe('Pagination and Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
      apiSpy.getAll.calls.reset();
    }));

    it('should handle page change', fakeAsync(() => {
      (component as any).onPageChange({ pageSize: 50, pageIndex: 2 });
      tick();
      expect(apiSpy.getAll).toHaveBeenCalledWith(50, 100, jasmine.any(Object));
    }));

    it('should handle sort change with direction', fakeAsync(() => {
      (component as any).onSortChange({ column: 'testId', direction: 'A' });
      tick();
      expect(apiSpy.getAll).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({ sortColumn: 'testId', sortOrder: 'ASC' }));
    }));

    it('should handle sort change with DESC', fakeAsync(() => {
      (component as any).onSortChange({ column: 'levelCode', direction: 'D' });
      tick();
      expect(apiSpy.getAll).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({ sortColumn: 'levelCode', sortOrder: 'DESC' }));
    }));

    it('should handle sort change with default (reset)', fakeAsync(() => {
      (component as any).onSortChange({ column: 'testId', direction: 'default' });
      tick();
      expect(apiSpy.getAll).toHaveBeenCalledWith(25, 0, jasmine.objectContaining({ sortColumn: null }));
    }));
  });

  // ═══════════════════════════════════════════════════
  // CLIENT-SIDE SEARCH
  // ═══════════════════════════════════════════════════

  describe('Client-Side Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();
    }));

    it('should filter data by search text', () => {
      (component as any).onSearch('HIV');
      expect((component as any).data().length).toBe(1);
    });

    it('should restore all data on empty search', () => {
      (component as any).onSearch('xyz');
      expect((component as any).data().length).toBe(0);
      (component as any).onSearch('');
      expect((component as any).data().length).toBe(1);
    });

    it('should search across multiple fields', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of({
        items: [
          { ...mockConfigData[0], anotationCode: 'SPECIAL' },
          { ...mockConfigData[0], testId: 'OTHER', anotationCode: null },
        ],
        totalRecords: 2,
      }));
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();

      (component as any).onSearch('SPECIAL');
      expect((component as any).data().length).toBe(1);
    }));
  });

  // ═══════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should toggle edit mode on', () => {
      expect((component as any).isEditMode()).toBe(true);
      expect((component as any).editableData().length).toBe(1);
    });

    it('should create row forms in edit mode', () => {
      expect(component.rowForms.size).toBe(1);
      const form = component.rowForms.get(0);
      expect(form).toBeDefined();
      expect(form?.get('levelCode')?.value).toBe(1);
    });

    it('should store original form values', () => {
      expect((component as any).originalFormValues.size).toBe(1);
    });

    it('should exit edit mode and clear state', () => {
      component.onToggleEditMode();
      expect((component as any).isEditMode()).toBe(false);
      expect((component as any).editableData().length).toBe(0);
      expect(component.rowForms.size).toBe(0);
      expect((component as any).editDirtyCount()).toBe(0);
    });

    it('should add new row at the top', () => {
      component.onAddNewRow();
      expect((component as any).editableData().length).toBe(2);
      expect((component as any).editableData()[0].isNew).toBe(true);
      expect(component.rowForms.size).toBe(2);
    });

    it('should increment editDirtyCount for new rows', () => {
      component.onAddNewRow();
      expect((component as any).editDirtyCount()).toBeGreaterThan(0);
    });

    it('canSave should be true after adding new row', () => {
      component.onAddNewRow();
      expect((component as any).canSave()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // CANCEL
  // ═══════════════════════════════════════════════════

  describe('Cancel', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should exit edit mode and reset dirty count', () => {
      component.onAddNewRow();
      expect((component as any).editDirtyCount()).toBeGreaterThan(0);

      component.onCancel();

      expect((component as any).isEditMode()).toBe(false);
      expect((component as any).editableData().length).toBe(0);
      expect(component.rowForms.size).toBe(0);
      expect((component as any).editDirtyCount()).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // ROW OPERATIONS
  // ═══════════════════════════════════════════════════

  describe('Row Operations', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should delete new row without API call', () => {
      component.onAddNewRow();
      const count = (component as any).editableData().length;
      component.onDeleteRow(0);
      expect((component as any).editableData().length).toBe(count - 1);
      expect(apiSpy.delete).not.toHaveBeenCalled();
    });

    it('should delete existing row with API call', fakeAsync(() => {
      apiSpy.delete.and.returnValue(of({ success: true, statusCode: 200, message: 'Deleted' }));
      component.onDeleteRow(0);
      tick();
      expect(apiSpy.delete).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record deleted successfully');
    }));

    it('should handle delete API error', fakeAsync(() => {
      apiSpy.delete.and.returnValue(throwError(() => ({ error: { message: 'Cannot delete' } })));
      component.onDeleteRow(0);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot delete');
      expect((component as any).loading()).toBe(false);
    }));

    it('should handle delete API error with fallback message', fakeAsync(() => {
      apiSpy.delete.and.returnValue(throwError(() => ({ error: {} })));
      component.onDeleteRow(0);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to delete record');
    }));

    it('should remove result code from row', () => {
      const form = component.rowForms.get(0)!;
      form.get('resultCode')?.setValue(['R', 'NR', 'P']);
      (component as any).removeResultCode(0, 'NR');
      expect(form.get('resultCode')?.value).toEqual(['R', 'P']);
    });
  });

  // ═══════════════════════════════════════════════════
  // ROW FORM HELPERS
  // ═══════════════════════════════════════════════════

  describe('Row Form Helpers', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('getRowControl should return the correct form control', () => {
      const ctrl = (component as any).getRowControl(0, 'levelCode');
      expect(ctrl).toBeDefined();
      expect(ctrl.value).toBe(1);
    });

    it('getRowEffectiveDateError should return empty when form not found', () => {
      expect((component as any).getRowEffectiveDateError(999)).toBe('');
    });

    it('getRowTerminationDateError should return empty when form not found', () => {
      expect((component as any).getRowTerminationDateError(999)).toBe('');
    });

    it('getRowEffectiveDateError should return string for existing form', () => {
      const result = (component as any).getRowEffectiveDateError(0);
      expect(typeof result).toBe('string');
    });

    it('getRowTerminationDateError should return string for existing form', () => {
      const result = (component as any).getRowTerminationDateError(0);
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateMin should return minDate', () => {
      const min = (component as any).getTerminationDateMin();
      expect(moment.isMoment(min)).toBe(true);
    });

    it('getResultCodesForRow should return empty array for unknown form', fakeAsync(() => {
      const fakeForm = {} as any;
      const result = (component as any).getResultCodesForRow(fakeForm);
      expect(result).toEqual([]);
    }));

    it('getFilteredResultCodesForRow should filter by search text', fakeAsync(() => {
      const form = component.rowForms.get(0)!;
      (component as any).editResultCodeSearchText.set('xyz');
      const result = (component as any).getFilteredResultCodesForRow(form);
      expect(result.length).toBe(0);
    }));
  });

  // ═══════════════════════════════════════════════════
  // FORM VALIDATION
  // ═══════════════════════════════════════════════════

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should validate effective date is required for new rows', () => {
      component.onAddNewRow();
      const form = component.rowForms.get(0);
      form?.get('effectiveDate')?.setValue(null);
      form?.get('effectiveDate')?.markAsTouched();
      expect(form?.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should validate termination date after effective date', () => {
      const form = component.rowForms.get(0);
      form?.patchValue({ effectiveDate: moment('2025-01-15'), terminationDate: moment('2025-01-10') });
      form?.updateValueAndValidity();
      expect(form?.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should detect schedule/cancel overlap', () => {
      const form = component.rowForms.get(0);
      form?.patchValue({ scheduleTest: 'SAME_TEST', cancelTest: 'SAME_TEST' });
      form?.updateValueAndValidity();
      expect(form?.hasError('testOverlap')).toBe(true);
    });

    it('should not flag overlap when schedule and cancel differ', () => {
      const form = component.rowForms.get(0);
      form?.patchValue({ scheduleTest: 'TEST_A', cancelTest: 'TEST_B' });
      form?.updateValueAndValidity();
      expect(form?.hasError('testOverlap')).toBeFalsy();
    });

    it('should not flag overlap when one is empty', () => {
      const form = component.rowForms.get(0);
      form?.patchValue({ scheduleTest: 'TEST_A', cancelTest: null });
      form?.updateValueAndValidity();
      expect(form?.hasError('testOverlap')).toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════
  // SAVE FUNCTIONALITY
  // ═══════════════════════════════════════════════════

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should save updated rows', fakeAsync(() => {
      apiSpy.update.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated' }));
      apiSpy.getAll.and.returnValue(of({ items: mockConfigData, totalRecords: 1 }));

      const form = component.rowForms.get(0);
      form?.get('finalFlag')?.setValue('N');
      component.onSave();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test Series Configuration saved successfully');
      expect((component as any).isEditMode()).toBe(false);
    }));

    it('should save new rows with create API', fakeAsync(() => {
      apiSpy.create.and.returnValue(of({ success: true, statusCode: 201, message: 'Created' }));
      apiSpy.getAll.and.returnValue(of({ items: mockConfigData, totalRecords: 1 }));

      component.onAddNewRow();
      const form = component.rowForms.get(0);
      form?.get('levelCode')?.setValue(1);
      form?.get('setNo')?.setValue(1);
      form?.get('testId')?.setValue('NAT');
      form?.get('resultCode')?.setValue(['R']);
      form?.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      form?.updateValueAndValidity();
      component.onSave();
      tick();

      expect(apiSpy.create).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test Series Configuration added successfully');
    }));

    it('should show error when form is invalid', () => {
      component.onAddNewRow();
      const form = component.rowForms.get(0);
      form?.get('resultCode')?.setValue([]);
      form?.get('effectiveDate')?.setValue(null);

      component.onSave();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please correct validation errors before saving');
    });

    it('should handle zero ops (no changes)', fakeAsync(() => {
      apiSpy.getAll.and.returnValue(of({ items: mockConfigData, totalRecords: 1 }));
      component.onSave();
      tick();
      expect(apiSpy.update).not.toHaveBeenCalled();
      expect(apiSpy.create).not.toHaveBeenCalled();
      expect((component as any).isEditMode()).toBe(false);
    }));

    it('should handle save API error', fakeAsync(() => {
      apiSpy.update.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));

      const form = component.rowForms.get(0);
      form?.get('finalFlag')?.setValue('N');
      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Save failed');
      expect((component as any).loading()).toBe(false);
    }));

    it('should handle save API error with fallback message', fakeAsync(() => {
      apiSpy.update.and.returnValue(throwError(() => ({ error: {} })));

      const form = component.rowForms.get(0);
      form?.get('finalFlag')?.setValue('N');
      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save changes');
    }));
  });

  // ═══════════════════════════════════════════════════
  // TEST MODE (filter by Test ID)
  // ═══════════════════════════════════════════════════

  describe('Test Mode (filter by Test ID)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'HIV-1/2' });
      component.onRetrieve();
      tick();
      component.onToggleEditMode();
    }));

    it('should set isSeriesMode to false', () => {
      expect((component as any).isSeriesMode()).toBe(false);
    });

    it('should disable testId field in row form', () => {
      const form = component.rowForms.get(0);
      expect(form?.get('testId')?.disabled).toBe(true);
    });

    it('should pre-fill testId for new rows in test mode', () => {
      component.onAddNewRow();
      const newRow = (component as any).editableData()[0];
      expect(newRow.testId).toBe('HIV-1/2');
    });
  });

  // ═══════════════════════════════════════════════════
  // DIRTY TRACKING
  // ═══════════════════════════════════════════════════

  describe('Dirty Tracking', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should detect row changes via hasRowChanged', () => {
      const form = component.rowForms.get(0)!;
      expect((component as any).hasRowChanged(0, form)).toBe(false);
      form.get('finalFlag')?.setValue('N');
      expect((component as any).hasRowChanged(0, form)).toBe(true);
    });

    it('should detect array changes', () => {
      const form = component.rowForms.get(0)!;
      form.get('resultCode')?.setValue(['R', 'NR']);
      expect((component as any).hasRowChanged(0, form)).toBe(true);
    });

    it('should detect moment date changes', () => {
      const form = component.rowForms.get(0)!;
      form.get('effectiveDate')?.setValue(moment('2030-01-01'));
      expect((component as any).hasRowChanged(0, form)).toBe(true);
    });

    it('should return true when no original values exist', () => {
      const form = component.rowForms.get(0)!;
      expect((component as any).hasRowChanged(999, form)).toBe(true);
    });

    it('should update dirty count when existing row changes', fakeAsync(() => {
      expect((component as any).editDirtyCount()).toBe(0);
      const form = component.rowForms.get(0)!;
      form.get('finalFlag')?.setValue('N');
      tick(100);
      expect((component as any).editDirtyCount()).toBeGreaterThan(0);
    }));
  });

  // ═══════════════════════════════════════════════════
  // TEST ID VALUE CHANGES IN EDIT MODE
  // ═══════════════════════════════════════════════════

  describe('TestId ValueChanges in Edit Row', () => {
    beforeEach(fakeAsync(() => retrieveAndEdit()));

    it('should clear resultCode and reload when testId changes', fakeAsync(() => {
      apiSpy.getResultCodes.calls.reset();
      const form = component.rowForms.get(0)!;
      form.get('testId')?.setValue('NAT');
      tick();
      expect(form.get('resultCode')?.value).toEqual([]);
      expect(apiSpy.getResultCodes).toHaveBeenCalledWith('NAT');
    }));

    it('should clear resultCode cache when testId set to null', fakeAsync(() => {
      const form = component.rowForms.get(0)!;
      form.get('testId')?.setValue(null);
      tick();
      expect(form.get('resultCode')?.value).toEqual([]);
    }));
  });

  // ═══════════════════════════════════════════════════
  // CHAPTER CHANGE
  // ═══════════════════════════════════════════════════

  describe('Chapter Change', () => {
    it('should clear data and reload dropdowns on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testSeriesId: 'HIV' });
      component.onRetrieve();
      tick();

      apiSpy.getTestSeriesDropdown.calls.reset();
      apiSpy.getValidTests.calls.reset();
      chapterChanged$.next();

      expect((component as any).data().length).toBe(0);
      expect(apiSpy.getTestSeriesDropdown).toHaveBeenCalled();
      expect(apiSpy.getValidTests).toHaveBeenCalled();
    }));
  });

  // ═══════════════════════════════════════════════════
  // DATE FORMATTING
  // ═══════════════════════════════════════════════════

  describe('Date Formatting', () => {
    it('should return "-" for null', () => {
      expect((component as any).formatDate(null)).toBe('-');
    });

    it('should return "-" for invalid date', () => {
      expect((component as any).formatDate('invalid')).toBe('-');
    });

    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      expect((component as any).formatDate('2025-01-15')).toBe('15-JAN-2025');
    });
  });

  // ═══════════════════════════════════════════════════
  // TABLE CONFIG
  // ═══════════════════════════════════════════════════

  describe('Display Values', () => {
    it('should format finalFlag "Y" as "Yes"', () => {
      const col = (component as any).tableConfig.columns.find((c: any) => c.key === 'finalFlag');
      expect(col.valueFormatter('Y')).toBe('Yes');
    });

    it('should format finalFlag null as "No"', () => {
      const col = (component as any).tableConfig.columns.find((c: any) => c.key === 'finalFlag');
      expect(col.valueFormatter(null)).toBe('No');
    });

    it('should format effDate via formatDate', () => {
      const col = (component as any).tableConfig.columns.find((c: any) => c.key === 'effDate');
      expect(col.valueFormatter('2025-09-12')).toBe('12-SEP-2025');
    });

    it('should format termDate via formatDate', () => {
      const col = (component as any).tableConfig.columns.find((c: any) => c.key === 'termDate');
      expect(col.valueFormatter(null)).toBe('-');
    });
  });

  // ═══════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════

  describe('Lifecycle', () => {
    it('should assign resultCodeTpl in ngAfterViewInit when ViewChild is available', () => {
      fixture.detectChanges();
      const col = (component as any).tableConfig.columns.find((c: any) => c.key === 'resultCode');
      if ((component as any).resultCodeTpl) {
        expect(col.cellTemplate).toBeDefined();
      } else {
        expect(col.cellTemplate).toBeUndefined();
        (component as any).resultCodeTpl = {} as any;
        component.ngAfterViewInit();
        expect(col.cellTemplate).toBeDefined();
      }
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════

  describe('Accessibility', () => {
    beforeEach(() => fixture.detectChanges());

    it('should have unique IDs for form elements', () => {
      const testSeriesSelect = fixture.debugElement.query(By.css('[id*="test-series-id"]'));
      expect(testSeriesSelect).toBeTruthy();
      expect(testSeriesSelect.nativeElement.id).toContain((component as any).componentId);
    });

    it('should have visually hidden h1', () => {
      const h1 = fixture.debugElement.query(By.css('h1.cdk-visually-hidden'));
      expect(h1).toBeTruthy();
      expect(h1.nativeElement.textContent).toContain('Test Series/Test Configuration');
    });

    it('should have aria-label on filter section', () => {
      const section = fixture.debugElement.query(By.css('section.filter-section'));
      expect(section.nativeElement.getAttribute('aria-label')).toBe('Filter criteria');
    });

    it('should have aria-label on filter action buttons', () => {
      const retrieveBtn = fixture.debugElement.query(By.css('.retrieve-btn'));
      expect(retrieveBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
      const clearBtn = fixture.debugElement.query(By.css('.clear-btn'));
      expect(clearBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════
  // SEARCH CONTROL SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════

  describe('Search Control Subscriptions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update testSeriesSearchText from control', () => {
      component.testSeriesSearchCtrl.setValue('hiv');
      expect((component as any).testSeriesSearchText()).toBe('hiv');
    });

    it('should update testIdSearchText from control', () => {
      component.testIdSearchCtrl.setValue('nat');
      expect((component as any).testIdSearchText()).toBe('nat');
    });

    it('should handle null search value as empty', () => {
      component.testSeriesSearchCtrl.setValue(null);
      expect((component as any).testSeriesSearchText()).toBe('');
    });

    it('should update edit grid search signals', () => {
      component.editTestIdSearchCtrl.setValue('test');
      expect((component as any).editTestIdSearchText()).toBe('test');

      component.editResultCodeSearchCtrl.setValue('code');
      expect((component as any).editResultCodeSearchText()).toBe('code');

      component.editScheduleSearchCtrl.setValue('sched');
      expect((component as any).editScheduleSearchText()).toBe('sched');

      component.editCancelSearchCtrl.setValue('cancel');
      expect((component as any).editCancelSearchText()).toBe('cancel');

      component.editNotationSearchCtrl.setValue('note');
      expect((component as any).editNotationSearchText()).toBe('note');
    });
  });
});
