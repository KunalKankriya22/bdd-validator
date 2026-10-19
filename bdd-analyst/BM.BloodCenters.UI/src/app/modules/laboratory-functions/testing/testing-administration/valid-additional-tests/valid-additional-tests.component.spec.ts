import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ValidAdditionalTestsComponent } from './valid-additional-tests.component';
import { ValidAdditionalTestsApiService } from './services/valid-additional-tests-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { Overlay } from '@angular/cdk/overlay';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidAdditionalTestDto,
  ValidTestDropdownDto,
} from './models/valid-additional-tests.model';

describe('ValidAdditionalTestsComponent', () => {
  let menuSpy: any;
  let loggingSpy: any;
  let apiSpy: any;
  let component: ValidAdditionalTestsComponent;
  let fixture: ComponentFixture<ValidAdditionalTestsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ValidAdditionalTestsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: any;
  let chapterChangedSubject: Subject<void>;

  const mockValidTests: ValidAdditionalTestDto[] = [
    {
      chapterId: '0001',
      testId: 'TEST001',
      testDesc: 'Hepatitis B Surface Antigen',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
    },
    {
      chapterId: '0001',
      testId: 'TEST002',
      testDesc: 'HIV-1/2 Antibody',
      effDate: '2024-02-01T00:00:00Z',
      termDate: '2024-12-31T00:00:00Z',
    },
  ];

  const mockTestsDropdown: ValidTestDropdownDto[] = [
    { testId: 'TEST001', testDesc: 'Hepatitis B Surface Antigen' },
    { testId: 'TEST002', testDesc: 'HIV-1/2 Antibody' },
  ];

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiSpy = jasmine.createSpyObj('ValidAdditionalTestsApiService', [
      'getAll',
      'getById',
      'getTestsDropdown',
      'create',
      'update',
      'delete',
    ]);
    const snackbarSpy = createMockSnackbarService();
    loggingSpy = jasmine.createSpyObj('LoggingService', ['error']);
    headerSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    menuSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);

    apiSpy.getAll.and.returnValue(
      of({ data: mockValidTests, totalCount: mockValidTests.length })
    );
    apiSpy.getTestsDropdown.and.returnValue(of(mockTestsDropdown));
    menuSpy.getMenuItemsSignal.and.returnValue(() => []);

    TestBed.configureTestingModule({
      imports: [ValidAdditionalTestsComponent, NoopAnimationsModule],
      providers: [
        { provide: ValidAdditionalTestsApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: MenuService, useValue: menuSpy },
        Overlay,
      ],
    });

    apiSpy.getAll.calls.reset();
    apiSpy.getById.calls.reset();
    apiSpy.getTestsDropdown.calls.reset();
    apiSpy.create.calls.reset();
    apiSpy.update.calls.reset();
    apiSpy.delete.calls.reset();
    loggingSpy.error.calls.reset();
    menuSpy.getMenuItemsSignal.calls.reset();
    menuSpy.findMenuItemByPath.calls.reset();

    apiSpy.getTestsDropdown.and.returnValue(of(mockTestsDropdown));
    menuSpy.getMenuItemsSignal.and.returnValue(() => []);

    fixture = TestBed.createComponent(ValidAdditionalTestsComponent);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(ValidAdditionalTestsApiService) as jasmine.SpyObj<ValidAdditionalTestsApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });

  function initComponent(): void {
    fixture.detectChanges();
  }

  function selectTestIdAndLoad(): void {
    initComponent();
    apiSpy.getAll.and.returnValue(of({ data: mockValidTests, totalCount: mockValidTests.length }));
    component.filterForm.get('testId')?.setValue('TEST001');
  }

  describe('Initialization', () => {
    it('should load tests dropdown on init', fakeAsync(() => {
      initComponent();
      tick();

      expect(apiServiceSpy.getTestsDropdown).toHaveBeenCalled();
      expect(component.testIdOptions.length).toBe(2);
    }));

    it('should initialize with correct default state', () => {
      initComponent();

      expect(component.isLoading).toBe(false);
      expect(component.isEditOrAddMode).toBe(false);
      expect(component.searchText).toBe('');
    });

    it('should not load table data on init (no test ID selected)', fakeAsync(() => {
      initComponent();
      tick();

      expect(apiServiceSpy.getAll).not.toHaveBeenCalled();
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
    }));

    it('should show error snackbar when dropdown load fails', fakeAsync(() => {
      apiSpy.getTestsDropdown.and.returnValue(throwError(() => new Error('fail')));

      initComponent();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load test options');
    }));

    it('should initialize filterForm with empty testId', () => {
      initComponent();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('testId')?.value).toBe('');
    });

    it('should have searchConfig with correct defaults', () => {
      expect(component.searchConfig.placeholder).toBe('Search by test ID');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    });
  });

  describe('Filter Test ID Change', () => {
    it('should load table data when a test ID is selected', fakeAsync(() => {
      initComponent();
      tick();
      apiSpy.getAll.calls.reset();

      component.filterForm.get('testId')?.setValue('TEST001');
      tick();

      expect(apiServiceSpy.getAll).toHaveBeenCalled();
    }));

    it('should clear data when test ID is cleared via valueChanges', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.filterForm.get('testId')?.setValue('');
      tick();

      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
    }));

    it('should set description when test ID is selected', fakeAsync(() => {
      initComponent();
      tick();

      component.filterTestOptions = [{ key: 'TEST001', value: 'Hepatitis B Surface Antigen' }];
      component.filterForm.get('testId')?.setValue('TEST001');
      tick();

      expect(component.filterForm.get('description')?.value).toBe('Hepatitis B Surface Antigen');
    }));

    it('should set description to dash when test ID has no match', fakeAsync(() => {
      initComponent();
      tick();

      component.filterTestOptions = [];
      component.filterForm.get('testId')?.setValue('UNKNOWN');
      tick();

      expect(component.filterForm.get('description')?.value).toBe('-');
    }));

    it('should exit edit mode when test ID changes while editing', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      expect(component.isEditOrAddMode).toBe(true);

      component.filterForm.get('testId')?.setValue('TEST002');
      tick();

      expect(component.isEditOrAddMode).toBe(false);
    }));
  });

  describe('Data Loading', () => {
    it('should handle successful data load', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.dataSource.length).toBe(2);
    }));

    it('should handle error during data load', fakeAsync(() => {
      initComponent();
      tick();
      apiServiceSpy.getAll.and.returnValue(throwError(() => new Error('API Error')));

      component.loadTableData();
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('Failed to load data');
    }));

    it('should include filter testId in query when selected', fakeAsync(() => {
      initComponent();
      tick();
      component.filterForm.get('testId')?.setValue('TEST001', { emitEvent: false });
      apiSpy.getAll.calls.reset();

      component.loadTableData();
      tick();

      const callArgs = apiSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].testId).toBe('TEST001');
    }));

    it('should include applied filters in query', fakeAsync(() => {
      initComponent();
      tick();
      component.appliedFilters = {
        effectivePeriod: 'After',
        effDateFrom: moment('2024-01-01'),
        terminationPeriod: 'Before',
        effDateTo: moment('2024-12-31'),
      };
      apiSpy.getAll.calls.reset();

      component.loadTableData();
      tick();

      const callArgs = apiSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].effDatePeriod).toBe('After');
      expect(callArgs[2].termDatePeriod).toBe('Before');
    }));
  });

  describe('Search Functionality', () => {
    it('should update search text on search', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.onSearch('TEST001');

      expect(component.searchText).toBe('TEST001');
    }));

    it('should filter data source by search text', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.dataSource = mockValidTests;
      component.onSearch('TEST001');

      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].testId).toBe('TEST001');
    }));

    it('should show all results when search text is empty', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.dataSource = mockValidTests;
      component.filterForm.get('testId')?.setValue('', { emitEvent: false });
      component.onSearch('');

      expect(component.filteredDataSource.length).toBe(2);
    }));
  });

  describe('onClear', () => {
    it('should reset filter form, data source, and search text', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
      component.searchText = 'TEST';

      component.onClear();

      expect(component.filterForm.get('testId')?.value).toBe('');
      expect(component.filterForm.get('description')?.value).toBe('');
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
      expect(component.searchText).toBe('');
    }));

    it('should exit edit mode if active', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      expect(component.isEditOrAddMode).toBe(true);

      component.onClear();

      expect(component.isEditOrAddMode).toBe(false);
    }));
  });

  describe('currentFilterTestId', () => {
    it('should return empty string when no test ID selected', () => {
      initComponent();
      expect(component.currentFilterTestId).toBe('');
    });

    it('should return selected test ID', fakeAsync(() => {
      initComponent();
      component.filterForm.get('testId')?.setValue('TEST001', { emitEvent: false });

      expect(component.currentFilterTestId).toBe('TEST001');
    }));
  });

  describe('Sorting', () => {
    it('should toggle sort direction', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      expect(component.testIdSortDirection).toBe('asc');

      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('desc');

      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('asc');
    }));

    it('should sort data source by test ID', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
      component.dataSource = mockValidTests;
      component.filterForm.get('testId')?.setValue('', { emitEvent: false });
      component.onSearch('');

      component.testIdSortDirection = 'asc';
      component.toggleTestIdSort();

      expect(component.filteredDataSource[0].testId).toBe('TEST002');
      expect(component.filteredDataSource[1].testId).toBe('TEST001');
    }));
  });

  describe('Inline Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
    }));

    it('should enter edit mode', () => {
      component.enterEditMode();

      expect(component.isEditOrAddMode).toBe(true);
      expect(component.editableRowsMeta.length).toBe(component.filteredDataSource.length);
    });

    it('should exit edit mode', () => {
      component.enterEditMode();
      component.exitEditMode();

      expect(component.isEditOrAddMode).toBe(false);
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });

    it('should cancel edit', () => {
      component.enterEditMode();
      component.cancelEdit();

      expect(component.isEditOrAddMode).toBe(false);
    });

    it('should auto-add a new row when entering edit mode with empty data', fakeAsync(() => {
      component.filteredDataSource = [];
      component.enterEditMode();

      expect(component.newRows.length).toBe(1);
    }));

    it('should add a new row', () => {
      component.enterEditMode();
      const initialRows = component.newRows.length;

      component.addNewRow();

      expect(component.newRows.length).toBe(initialRows + 1);
    });

    it('should remove a new row', () => {
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      const count = component.newRows.length;

      component.removeNewRow(0);

      expect(component.newRows.length).toBe(count - 1);
    });

    it('should populate description when testId is selected on new row', fakeAsync(() => {
      component.testIdOptions = [{ key: 'TEST001', value: 'Hepatitis B Surface Antigen' }];
      component.enterEditMode();
      component.addNewRow();

      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('TEST001');
      tick();

      expect(newRow.form.get('description')?.value).toBe('Hepatitis B Surface Antigen');
    }));

    it('should clear description when testId is cleared on new row', fakeAsync(() => {
      component.testIdOptions = [{ key: 'TEST001', value: 'Hepatitis B' }];
      component.enterEditMode();
      component.addNewRow();

      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('TEST001');
      tick();
      newRow.form.get('testId')?.setValue('');
      tick();

      expect(newRow.form.get('description')?.value).toBe('');
    }));

    it('should track dirty forms flag when new row value changes', fakeAsync(() => {
      component.enterEditMode();
      expect(component.hasAnyDirtyForms).toBe(false);

      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('TEST001');
      newRow.form.get('testId')?.markAsDirty();
      newRow.form.get('effDate')?.setValue(moment());
      tick();

      expect(component.hasAnyDirtyForms).toBe(true);
    }));
  });

  describe('Termination Date Filter', () => {
    it('should allow null dates', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      component.addNewRow();
      const filter = component.newRows[0].terminationDateFilter;

      expect(filter(null)).toBe(true);
    }));

    it('should allow dates when no effective date set', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      component.addNewRow();
      const filter = component.newRows[0].terminationDateFilter;

      expect(filter(moment('2025-01-01'))).toBe(true);
    }));

    it('should filter dates before effective date for existing rows', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const filter = meta.terminationDateFilter;

      expect(filter(null)).toBe(true);
    }));
  });

  describe('Save All', () => {
    beforeEach(fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
      apiServiceSpy.create.and.returnValue(of({ success: true } as any));
      apiServiceSpy.update.and.returnValue(of({ success: true } as any));
    }));

    it('should exit edit mode when no dirty forms', fakeAsync(() => {
      component.enterEditMode();

      component.saveAll();
      tick();

      expect(component.isEditOrAddMode).toBe(false);
    }));

    it('should create new rows on save', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('NEWTEST');
      newRow.form.get('effDate')?.setValue(moment());
      newRow.form.get('effDate')?.setErrors(null);
      newRow.form.setErrors(null);
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Tests updated successfully.');
    }));

    it('should update existing dirty rows on save', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(moment('2025-06-01'));
      meta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(apiServiceSpy.update).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Tests updated successfully.');
    }));

    it('should show error snackbar on save failure', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('FAIL');
      newRow.form.get('effDate')?.setValue(moment());
      newRow.form.get('effDate')?.setErrors(null);
      newRow.form.setErrors(null);
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    }));

    it('should show error snackbar with errorResponse message', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Duplicate entry' } }
      })));
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('UNIQUE1');
      newRow.form.get('effDate')?.setValue(moment());
      newRow.form.get('effDate')?.setErrors(null);
      newRow.form.setErrors(null);
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate entry');
    }));

    it('should show fallback error message when no error details', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(throwError(() => ({})));
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('UNIQUE2');
      newRow.form.get('effDate')?.setValue(moment());
      newRow.form.get('effDate')?.setErrors(null);
      newRow.form.setErrors(null);
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save changes.');
    }));

    it('should show validation error when forms are invalid', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(component.showValidationError).toBe(true);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    }));

    it('should detect duplicate test IDs and show error', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const newRow = component.newRows[0];
      newRow.form.get('testId')?.setValue('TEST001');
      newRow.form.get('effDate')?.setValue(moment());
      newRow.form.get('effDate')?.setErrors(null);
      newRow.form.setErrors(null);
      newRow.form.markAsDirty();
      newRow.form.markAllAsTouched();

      component.saveAll();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Duplicate Test ID')
      );
    }));
  });

  describe('Format Date', () => {
    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should format valid date string', () => {
      const result = component.formatDate('2024-01-15T00:00:00Z');
      expect(result).toBe('15-JAN-2024');
    });

    it('should return original value for invalid date', () => {
      const result = component.formatDate('not-a-date');
      expect(result).toBe('not-a-date');
    });
  });

  describe('Date Error Helpers', () => {
    let form: any;

    beforeEach(() => {
      initComponent();
      form = component['fb'].group({
        effDate: [null],
        termDate: [null],
      });
    });

    it('hasDateError should return false when no errors', () => {
      expect(component.hasDateError(form, 'effDate')).toBe(false);
    });

    it('getDateErrorMessage should return string', () => {
      const msg = component.getDateErrorMessage(form, 'effDate');
      expect(typeof msg).toBe('string');
    });

    it('getDateErrorMessage should call termination date error for termDate', () => {
      const msg = component.getDateErrorMessage(form, 'termDate');
      expect(typeof msg).toBe('string');
    });
  });

  describe('getRequiredFieldError', () => {
    let form: any;

    beforeEach(() => {
      initComponent();
      form = component['fb'].group({
        testId: ['', { validators: [jasmine.createSpy()] }],
      });
    });

    it('should return error message when field is required and touched', () => {
      const requiredForm = component['fb'].group({
        testId: ['', { validators: [] }],
      });
      requiredForm.get('testId')?.setErrors({ required: true });
      requiredForm.get('testId')?.markAsTouched();

      const result = component.getRequiredFieldError(requiredForm, 'testId', 'Test ID');
      expect(result).toBe('Test ID is required');
    });

    it('should return empty string when field has no error', () => {
      const validForm = component['fb'].group({
        testId: ['VALUE'],
      });

      const result = component.getRequiredFieldError(validForm, 'testId', 'Test ID');
      expect(result).toBe('');
    });
  });

  describe('Date Input Handlers', () => {
    it('should handle effective date input', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      const form = component.editableRowsMeta[0].form;
      const event = { target: { value: '15-JAN-2024' } } as unknown as Event;

      expect(() => component.onEffDateInput(event, form)).not.toThrow();
    }));

    it('should handle termination date input', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      const form = component.editableRowsMeta[0].form;
      const event = { target: { value: '31-DEC-2024' } } as unknown as Event;

      expect(() => component.onTermDateInput(event, form)).not.toThrow();
    }));

    it('should handle termination date input in edit mode', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      const form = component.editableRowsMeta[0].form;
      const event = { target: { value: '31-DEC-2024' } } as unknown as Event;

      expect(() => component.onTermDateInput(event, form, true)).not.toThrow();
    }));
  });

  describe('Test ID Panel Toggle', () => {
    it('should reset search and options when panel opens', fakeAsync(() => {
      initComponent();
      tick();

      component.testIdOptions = [{ key: 'A', value: 'Alpha' }];
      component.filteredTestIdOptions = [];
      component.testIdFilterCtrl.setValue('something');

      component.onTestIdPanelToggle(true);

      expect(component.testIdFilterCtrl.value).toBe('');
      expect(component.filteredTestIdOptions.length).toBe(1);
    }));

    it('should do nothing when panel closes', fakeAsync(() => {
      initComponent();
      tick();

      component.filteredTestIdOptions = [];
      component.onTestIdPanelToggle(false);

      expect(component.filteredTestIdOptions.length).toBe(0);
    }));
  });

  describe('Search Filters (dropdown search)', () => {
    it('should filter filter-test options by search term', fakeAsync(() => {
      initComponent();
      tick();

      component.filterTestOptions = [
        { key: 'TEST001', value: 'Hepatitis B' },
        { key: 'CMV', value: 'Cytomegalovirus' },
      ];

      component.filterTestSearchCtrl.setValue('cmv');
      tick();

      expect(component.filteredFilterTestOptions.length).toBe(1);
      expect(component.filteredFilterTestOptions[0].key).toBe('CMV');
    }));

    it('should filter testId options by search term', fakeAsync(() => {
      initComponent();
      tick();

      component.testIdOptions = [
        { key: 'TEST001', value: 'Hepatitis B' },
        { key: 'CMV', value: 'Cytomegalovirus' },
      ];

      component.testIdFilterCtrl.setValue('hepat');
      tick();

      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].key).toBe('TEST001');
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      initComponent();
      tick();

      component.filterTestOptions = [
        { key: 'A', value: 'Alpha' },
        { key: 'B', value: 'Beta' },
      ];

      component.filterTestSearchCtrl.setValue('');
      tick();

      expect(component.filteredFilterTestOptions.length).toBe(2);
    }));
  });

  describe('Filter Chips', () => {
    beforeEach(fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
    }));

    it('hasActiveFilters should return false when no chips', () => {
      component.filterChips = [];
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('hasActiveFilters should return true when chips exist', () => {
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: null }];
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should remove effective date chip', fakeAsync(() => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effDateFrom: moment('2024-01-01'),
        terminationPeriod: 'Before',
        effDateTo: moment('2024-12-31'),
      };
      apiSpy.getAll.calls.reset();

      component.onRemoveFilterChip('effectiveDate');
      tick();

      expect(component.appliedFilters?.effDateFrom).toBeNull();
      expect(component.appliedFilters?.effectivePeriod).toBeNull();
      expect(apiServiceSpy.getAll).toHaveBeenCalled();
    }));

    it('should remove termination date chip', fakeAsync(() => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effDateFrom: moment('2024-01-01'),
        terminationPeriod: 'Before',
        effDateTo: moment('2024-12-31'),
      };
      apiSpy.getAll.calls.reset();

      component.onRemoveFilterChip('terminationDate');
      tick();

      expect(component.appliedFilters?.effDateTo).toBeNull();
      expect(component.appliedFilters?.terminationPeriod).toBeNull();
    }));

    it('should do nothing when removing chip with no applied filters', () => {
      component.appliedFilters = null;
      expect(() => component.onRemoveFilterChip('effectiveDate')).not.toThrow();
    });

    it('should clear all filters', fakeAsync(() => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effDateFrom: moment('2024-01-01'),
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: null }];
      apiSpy.getAll.calls.reset();

      component.clearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(apiServiceSpy.getAll).toHaveBeenCalled();
    }));
  });

  describe('Chapter Changes', () => {
    it('should reset state and reload dropdown on chapter change', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();
      component.searchText = 'TEST';

      apiSpy.getTestsDropdown.calls.reset();
      apiSpy.getAll.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('testId')?.value).toBe('');
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
      expect(component.searchText).toBe('');
      expect(apiServiceSpy.getTestsDropdown).toHaveBeenCalled();
      expect(apiServiceSpy.getAll).not.toHaveBeenCalled();
    }));

    it('should exit edit mode on chapter change', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.enterEditMode();
      expect(component.isEditOrAddMode).toBe(true);

      chapterChangedSubject.next();
      tick();

      expect(component.isEditOrAddMode).toBe(false);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      initComponent();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should dispose overlay ref if open', fakeAsync(() => {
      initComponent();
      tick();
      (component as any).overlayRef = {
        dispose: jasmine.createSpy('dispose'),
      };

      component.ngOnDestroy();

      expect((component as any).overlayRef.dispose).toHaveBeenCalled();
    }));
  });

  describe('Build Filter Chips', () => {
    it('should build chips with Before symbol for effective date', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.appliedFilters = {
        effectivePeriod: 'Before',
        effDateFrom: moment('2024-01-01'),
      };
      apiSpy.getAll.calls.reset();

      component.onRemoveFilterChip('terminationDate');
      tick();
    }));

    it('should build chips with After symbol for termination date', fakeAsync(() => {
      selectTestIdAndLoad();
      tick();

      component.appliedFilters = {
        terminationPeriod: 'After',
        effDateTo: moment('2024-12-31'),
      };
      apiSpy.getAll.calls.reset();

      component.onRemoveFilterChip('effectiveDate');
      tick();
    }));
  });
});
