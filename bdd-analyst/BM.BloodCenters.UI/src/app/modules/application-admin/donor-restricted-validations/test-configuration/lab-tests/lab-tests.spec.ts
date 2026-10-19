import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import moment from 'moment';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { NgModel } from '@angular/forms';

import { LabTestsComponent } from './lab-tests';
import { LabTestsApiService } from './services/lab-tests-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  TestIdOption,
  TestDetails,
  LabTestModel,
  LabTestFilterValue,
  LabTestEditModel,
  FilterDropdownOptions,
  DefineTestResultsLabBulkUpsertResultDto
} from './models/lab-tests.model';

describe('LabTestsComponent', () => {
  let component: LabTestsComponent;
  let fixture: ComponentFixture<LabTestsComponent>;
  let mockService: jasmine.SpyObj<LabTestsApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockTestIds: TestIdOption[] = [
    { testId: 'ABID' },
    { testId: 'ABSC' },
    { testId: 'HBSAG' }
  ];

  const mockTestDetails: TestDetails = {
    description: 'ABO/RH Blood Typing',
    shortId: 'ABI',
    group: 'BLOOD',
    antigenTest: 'Y',
    autoSchedule: 'N',
    editResults: 'Y',
    discrepancyCheck: 'N',
    noOfResults: 2,
    fullResult: 'Y',
    effDateTime: new Date('2024-01-01'),
    termDateTime: null,
    modificationDate: new Date('2024-06-15')
  };

  const mockFilterDropdownOptions: FilterDropdownOptions = {
    interdictionCodes: [
      { value: 'D01', display: 'D01' },
      { value: 'D02', display: 'D02' }
    ],
    attributeCodes: [
      { value: 'A01', display: 'A01' },
      { value: 'A02', display: 'A02' }
    ],
    tests: []
  };

  const mockResultCodes = [
    { value: 'POS', display: 'POS - Positive' },
    { value: 'NEG', display: 'NEG - Negative' }
  ];

  const mockLabTests: LabTestModel[] = [
    {
      resultCode: 'POS',
      initialRepeat: 'I',
      interdictionCode: 'D01',
      noOfRepeats: 2,
      attributeCode: 'A01',
      confirmTest1: 'ABSC',
      confirmTest2: '',
      confirmTest3: '',
      confirmTest4: '',
      confirmTest5: '',
      confirmTest6: '',
      machineResult: 'Y',
      result2: 'N',
      effDate: new Date('2024-01-15'),
      termDate: null,
      modificationDate: new Date('2024-06-01'),
      auditKey: 1
    },
    {
      resultCode: 'NEG',
      initialRepeat: 'R',
      interdictionCode: 'D02',
      noOfRepeats: 1,
      attributeCode: '',
      confirmTest1: '',
      confirmTest2: '',
      confirmTest3: '',
      confirmTest4: '',
      confirmTest5: '',
      confirmTest6: '',
      machineResult: 'N',
      result2: 'N',
      effDate: new Date('2024-02-01'),
      termDate: new Date('2099-12-31'),
      modificationDate: new Date('2024-07-10'),
      auditKey: 2
    }
  ];

  const mockLabTestsResponse = {
    data: mockLabTests,
    totalRecords: 2
  };

  const mockBulkUpsertResult: DefineTestResultsLabBulkUpsertResultDto = {
    TotalRecords: 1,
    CreatedCount: 1,
    UpdatedCount: 0,
    FailureCount: 0,
    SuccessCount: 1,
    Success: true,
    Message: 'Saved successfully'
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('LabTestsApiService', [
      'getTestIds',
      'getTestDetails',
      'getFilterValues',
      'getLabTests',
      'saveBulkLabTests',
      'getDropdowns',
      'createTest',
      'updateTest',
      'getTestGroups',
      'getResultCodes',
      'getActiveTestIds'
    ]);

    mockSnackbarService = createMockSnackbarService();
    mockDialog = createMockMatDialog();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'isChapterLocalDateAvailable']);

    chapterChangedSubject = new Subject<void>();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    TestBed.configureTestingModule({
      imports: [
        LabTestsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: LabTestsApiService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay
      ],
    })
    .overrideProvider(MatDialog, { useValue: mockDialog });

    mockService.getTestIds.and.returnValue(of(mockTestIds));
    mockService.getTestDetails.and.returnValue(of(mockTestDetails));
    mockService.getFilterValues.and.returnValue(of(mockFilterDropdownOptions));
    mockService.getLabTests.and.returnValue(of(mockLabTestsResponse));
    mockService.saveBulkLabTests.and.returnValue(of(mockBulkUpsertResult));
    mockService.getTestGroups.and.returnValue(of([]));
    mockService.getResultCodes.and.returnValue(of(mockResultCodes));
    mockService.getActiveTestIds.and.returnValue(of([
      { value: 'ABID', display: 'ABID' },
      { value: 'ABSC', display: 'ABSC' },
      { value: 'HBSAG', display: 'HBSAG' }
    ]));
    mockService.getTestIds.calls.reset();
    mockService.getTestDetails.calls.reset();
    mockService.getFilterValues.calls.reset();
    mockService.getLabTests.calls.reset();
    mockService.saveBulkLabTests.calls.reset();
    mockService.getTestGroups.calls.reset();
    mockService.getResultCodes.calls.reset();
    mockService.getActiveTestIds.calls.reset();
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockSnackbarService.showSuccess.calls.reset();
    mockSnackbarService.showError.calls.reset();
    mockDialog.open.calls.reset();

    fixture = TestBed.createComponent(LabTestsComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {




    it('should initialize with isEditMode as false', () => {
      expect(component.isEditMode).toBe(false);
    });



    it('should initialize filterChips as empty array', () => {
      expect(component.filterChips).toEqual([]);
    });

    it('should initialize editableRows as empty array', () => {
      expect(component.editableRows).toEqual([]);
    });

    it('should initialize dirtyRowIds as empty set', () => {
      expect(component.dirtyRowIds.size).toBe(0);
    });

    it('should load test IDs on ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockService.getTestIds).toHaveBeenCalled();
      expect(component.testIdOptions().length).toBe(3);
      expect(component.allTestIds.length).toBe(3);
    }));

    it('should load edit dropdown options on ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockService.getResultCodes).toHaveBeenCalled();
      expect(mockService.getFilterValues).toHaveBeenCalled();
      expect(component.interdictionCodeOptionsSignal().length).toBe(2);
      expect(component.attributeCodeOptionsSignal().length).toBe(2);
      expect(component.resultCodeOptionsSignal().length).toBe(2);
    }));

    it('should have correct initial/repeat dropdown options', () => {
      expect(component.initialRepeatOptions.length).toBe(2);
      expect(component.initialRepeatOptions[0]).toEqual({ value: 'I', display: 'Initial' });
      expect(component.initialRepeatOptions[1]).toEqual({ value: 'R', display: 'Repeat' });
    });

    it('should have correct yes/no dropdown options', () => {
      expect(component.yesNoOptions.length).toBe(2);
      expect(component.yesNoOptions[0]).toEqual({ value: 'Y', display: 'Yes' });
      expect(component.yesNoOptions[1]).toEqual({ value: 'N', display: 'No' });
    });
  });

  describe('Test ID Selection', () => {
    it('should load data and test details when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('ABID');
      tick();

      expect(mockService.getLabTests).toHaveBeenCalled();
      expect(mockService.getTestDetails).toHaveBeenCalledWith('ABID');
      expect(component.dataSource).toEqual(mockLabTests);
      expect(component.testDetails).toEqual(mockTestDetails);
    }));


    it('should filter test IDs with debounce search', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('AB');
      tick(300);

      const filteredOptions = component.testIdOptions();
      expect(filteredOptions.every(t => t.testId.toLowerCase().includes('ab'))).toBe(true);
    }));


    it('should update requestState.testId when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('ABID');
      tick();

      expect(component.requestState.testId).toBe('ABID');
    }));

    it('should clear data when test ID is set to null', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      component.testIdControl.setValue(null);
      tick();

      expect(component.requestState.testId).toBeUndefined();
      expect(component.testDetails).toBeNull();
      expect(component.dataSource).toEqual([]);
    }));

    it('should reset options when search is cleared', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('AB');
      tick(300);
      component.testIdSearchControl.setValue('');
      tick(300);

      expect(component.testIdOptions().length).toBe(3);
    }));

    it('should filter test IDs by description', fakeAsync(() => {
      component.ngOnInit();
      tick();

      // Override allTestIds after ngOnInit has loaded them
      component.allTestIds = [
        { testId: 'XYZ', description: 'ABO test' },
        { testId: 'HBSAG' }
      ];

      component.testIdSearchControl.setValue('abo');
      tick(300);

      const filteredOptions = component.testIdOptions();
      expect(filteredOptions.length).toBe(1);
      expect(filteredOptions[0].testId).toBe('XYZ');
    }));

  });

  describe('loadData', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));




    it('should include search keyword in request', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';
      component.loadData();
      tick();

      const callArgs = mockService.getLabTests.calls.mostRecent().args[0];
      expect(callArgs.searchKeyword).toBe('POS');
    }));

    it('should not load data if testId is not set', fakeAsync(() => {
      mockService.getLabTests.calls.reset();
      component.requestState.testId = undefined;

      component.loadData();
      tick();

      expect(mockService.getLabTests).not.toHaveBeenCalled();
    }));

    it('should handle API error on loadData', fakeAsync(() => {
      mockService.getLabTests.and.returnValue(throwError(() => new Error('API error')));

      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('Failed to load lab tests');
    }));
  });


  describe('onSortChange', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));




    it('should map machineResult column to MACHINE_RESULT sort param', fakeAsync(() => {
      const sortEvent = { column: 'machineResult', direction: 'A' as const };

      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sort).toBe('MACHINE_RESULT_ASC');
    }));

    it('should clear sort for default direction', fakeAsync(() => {
      component.requestState.sort = 'RESULT_CODE_ASC';
      const sortEvent = { column: 'resultCode', direction: 'default' as const };

      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sort).toBeUndefined();
    }));

    it('should map descending direction correctly', fakeAsync(() => {
      const sortEvent = { column: 'effDate', direction: 'D' as const };

      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sort).toBe('EFFECTIVE_DATE_DESC');
    }));

    it('should fallback to RESULT_CODE for unmapped column', fakeAsync(() => {
      const sortEvent = { column: 'unknownColumn', direction: 'A' as const };

      component.onSortChange(sortEvent);
      tick();

      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
    }));
  });

  describe('Filter Operations', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should apply filters and update filter chips', fakeAsync(() => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(mockService.getLabTests).toHaveBeenCalled();
    }));



    it('should preserve testId and searchKeyword when clearing filters', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';

      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      component.clearAllFilters();
      tick();

      expect(component.requestState.testId).toBe('ABID');
      expect(component.requestState.searchKeyword).toBe('POS');
      expect(component.requestState.initialRepeat).toBeUndefined();
    }));


    it('should return false for hasActiveFilters when no filters are applied', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should remove a filter chip and reload data', fakeAsync(() => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);
      tick();
      mockService.getLabTests.calls.reset();

      component.onRemoveFilterChip('initialRepeat');
      tick();

      expect(mockService.getLabTests).toHaveBeenCalled();
    }));

    it('should update request state with applied filter values', fakeAsync(() => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'R',
        interdictionCode: 'D02',
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-01')
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.initialRepeat).toBe('R');
      expect(component.requestState.interdictionCode).toBe('D02');
      expect(component.requestState.effectiveDatePeriod).toBe('Before');
      expect(component.requestState.terminationDatePeriod).toBe('After');
    }));
  });

  describe('Edit Mode Operations', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should enter edit mode when onAddEditClick is called', () => {
      component.onAddEditClick();

      expect(component.isEditMode).toBe(true);
      expect(component.editableRows.length).toBe(2);
      expect(component.originalRows.length).toBe(2);
    });

    it('should not enter edit mode if no test ID selected', fakeAsync(() => {
      component.testIdControl.setValue(null);
      tick();
      component.onAddEditClick();

      expect(component.isEditMode).toBe(false);
    }));

    it('should enter edit mode and add new row if dataSource is empty', () => {
      component.dataSource = [];
      component.onAddEditClick();

      expect(component.isEditMode).toBe(true);
      expect(component.editableRows.length).toBe(1);
      expect(component.editableRows[0].resultCode).toBe('');
      expect(component.editableRows[0].isDirty).toBe(true);
    });

    it('should convert dataSource to editableRows correctly', () => {
      component.onAddEditClick();

      expect(component.editableRows[0].resultCode).toBe('POS');
      expect(component.editableRows[0].initialRepeat).toBe('I');
      expect(component.editableRows[0].interdictionCode).toBe('D01');
      expect(component.editableRows[0].machineResult).toBe('Y');
      expect(component.editableRows[0].result2).toBe('N');
      expect(component.editableRows[0].auditKey).toBe(1);
      expect(component.editableRows[0].isDirty).toBe(false);
    });

    it('should clear dirtyRowIds when entering edit mode', () => {
      component.dirtyRowIds.add(5);
      component.onAddEditClick();

      expect(component.dirtyRowIds.size).toBe(0);
    });

    it('should cancel edit mode and restore original data', () => {
      component.onAddEditClick();
      component.editableRows[0].resultCode = 'MODIFIED';

      component.onCancelEdit();

      expect(component.isEditMode).toBe(false);
      expect(component.editableRows.length).toBe(0);
      expect(component.dirtyRowIds.size).toBe(0);
      expect(component.dataSource[0].resultCode).toBe('POS');
    });

    it('should add new row at the beginning', () => {
      component.onAddEditClick();
      const initialLength = component.editableRows.length;

      component.onAddNewRow();

      expect(component.editableRows.length).toBe(initialLength + 1);
      expect(component.editableRows[0].auditKey).toBe(0);
      expect(component.editableRows[0].resultCode).toBe('');
      expect(component.editableRows[0].isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    });


    it('should re-index dirty rows when adding new row', () => {
      component.onAddEditClick();
      component.dirtyRowIds.add(0);
      component.dirtyRowIds.add(1);

      component.onAddNewRow();

      // Old dirty rows at 0,1 should now be at 1,2
      expect(component.dirtyRowIds.has(0)).toBe(true); // new row
      expect(component.dirtyRowIds.has(1)).toBe(true); // was 0
      expect(component.dirtyRowIds.has(2)).toBe(true); // was 1
    });

    it('should track row field changes', () => {
      component.onAddEditClick();

      component.onRowFieldChange(0, 'resultCode', 'UPDATED');

      expect(component.editableRows[0].resultCode).toBe('UPDATED');
      expect(component.editableRows[0].isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    });

    it('should not add new row if testIdControl has no value', fakeAsync(() => {
      component.testIdControl.setValue(null);
      tick();
      component.editableRows = [];

      component.onAddNewRow();

      expect(component.editableRows.length).toBe(0);
    }));

    it('should load active test IDs when entering edit mode with empty confirmTestOptionsSignal', fakeAsync(() => {
      component.confirmTestOptionsSignal.set([]);
      component.onAddEditClick();
      tick();

      expect(mockService.getActiveTestIds).toHaveBeenCalled();
    }));

    it('should not reload active test IDs if already loaded', fakeAsync(() => {
      component.confirmTestOptionsSignal.set([{ value: 'T1', display: 'T1' }]);
      mockService.getActiveTestIds.calls.reset();
      component.onAddEditClick();
      tick();

      expect(mockService.getActiveTestIds).not.toHaveBeenCalled();
    }));

    it('should show error snackbar when getActiveTestIds fails', fakeAsync(() => {
      component.confirmTestOptionsSignal.set([]);
      mockService.getActiveTestIds.and.returnValue(throwError(() => new Error('fail')));

      component.onAddEditClick();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load confirm test options.');
    }));
  });

  describe('Validation', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should detect validation errors for empty required fields', () => {
      const row = component.editableRows[0];
      row.resultCode = '';
      row.initialRepeat = '';
      row.interdictionCode = '';
      row.auditKey = 0; // New row - effDate is only required for new rows
      row.effDate = null;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['resultCode']).toBeDefined();
      expect(row.errors?.['initialRepeat']).toBeDefined();
      // interdictionCode is not validated as required in validateRow
      expect(row.errors?.['effDate']).toBeDefined();
    });

    it('should validate date range correctly', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.effDate = new Date('2099-12-31');
      row.termDate = new Date('2099-06-01');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['termDate']).toContain('cannot be before Effective Date');
    });


    it('should pass validation when termination date is null', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.effDate = new Date('2024-01-01');
      row.termDate = null;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
    });

    it('should pass when termination date equals effective date', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.effDate = new Date('2099-06-15');
      row.termDate = new Date('2099-06-15');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
    });

    it('should check if row has errors', () => {
      const row = component.editableRows[0];
      row.errors = { resultCode: 'Required' };

      expect(component.hasRowErrors(row)).toBe(true);
    });

    it('should return false if row has no errors', () => {
      const row = component.editableRows[0];
      row.errors = {};

      expect(component.hasRowErrors(row)).toBe(false);
    });

    it('should compute hasValidationErrors correctly', () => {
      component.editableRows[0].errors = { resultCode: 'Required' };

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return false for hasValidationErrors when all rows are valid', () => {
      component.editableRows.forEach(row => row.errors = {});

      expect(component.hasValidationErrors).toBe(false);
    });

    it('should only validate dirty rows in validateAllRows', () => {
      // Make row 0 dirty with invalid data
      component.editableRows[0].resultCode = '';
      component.dirtyRowIds.add(0);

      // Make row 1 invalid but NOT dirty
      component.editableRows[1].resultCode = '';
      // Not adding to dirtyRowIds

      const isValid = component['validateAllRows']();

      expect(isValid).toBe(false);
      expect(component.editableRows[0].errors?.['resultCode']).toBeDefined();
      // Non-dirty row should not have errors set (undefined)
      expect(component.editableRows[1].errors).toBeUndefined();
    });

    it('should pass validation when non-dirty rows have past termination dates', () => {
      // Set row 1 with past termination date but NOT dirty
      component.editableRows[1].termDate = new Date('2020-01-01');
      // Not adding to dirtyRowIds

      // Make row 0 dirty with valid data
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].initialRepeat = 'I';
      component.editableRows[0].interdictionCode = 'D01';
      component.editableRows[0].effDate = new Date('2024-01-01');
      component.editableRows[0].termDate = new Date('2099-12-31');
      component.dirtyRowIds.add(0);

      const isValid = component['validateAllRows']();

      expect(isValid).toBe(true);
    });

    it('should fail validation when dirty row has past termination date', () => {
      // Set row 0 with past termination date and make it dirty
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].initialRepeat = 'I';
      component.editableRows[0].interdictionCode = 'D01';
      component.editableRows[0].effDate = new Date('2024-01-01');
      component.editableRows[0].termDate = new Date('2020-01-01'); // Past date
      component.dirtyRowIds.add(0);

      const isValid = component['validateAllRows']();

      expect(isValid).toBe(false);
      expect(component.editableRows[0].errors?.['termDate']).toBeDefined();
    });

    it('should validate noOfRepeats range (0-9)', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.noOfRepeats = 10;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['noOfRepeats']).toContain('between 0 and 9');
    });

    it('should validate noOfRepeats as NaN', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.noOfRepeats = 'abc' as any;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['noOfRepeats']).toBeDefined();
    });

    it('should validate effDate before chapter local date for new rows', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.auditKey = 0;
      row.effDate = new Date('2020-01-01');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['effDate']).toContain('cannot be before chapter local date');
    });

    it('should not validate effDate for existing rows', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.auditKey = 5;
      row.effDate = new Date('2020-01-01');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should validate termDate before chapter local date', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.interdictionCode = 'D01';
      row.effDate = new Date('2020-01-01');
      row.termDate = new Date('2020-02-01');
      row.auditKey = 1;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['termDate']).toBeDefined();
    });

    it('should return false for hasRowErrors when errors is undefined', () => {
      const row: LabTestEditModel = {
        resultCode: 'POS', initialRepeat: 'I', interdictionCode: 'D01',
        noOfRepeats: null, attributeCode: null, confirmTest1: null, confirmTest2: null,
        confirmTest3: null, confirmTest4: null, confirmTest5: null, confirmTest6: null,
        machineResult: null, result2: null, effDate: null, termDate: null, auditKey: 0
      };
      expect(component.hasRowErrors(row)).toBe(false);
    });
  });

  describe('onSave', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      mockSnackbarService.showSuccess.calls.reset();
      mockSnackbarService.showError.calls.reset();
    }));

    it('should save changes successfully', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockService.saveBulkLabTests).toHaveBeenCalledWith('ABID', jasmine.any(Object));
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
      expect(component.isEditMode).toBe(false);
      expect(component.editableRows.length).toBe(0);
      expect(component.dirtyRowIds.size).toBe(0);
    }));


    it('should not save if validation fails', fakeAsync(() => {
      component.editableRows[0].resultCode = '';
      component.dirtyRowIds.add(0);

      component.onSave();
      tick();

      expect(mockService.saveBulkLabTests).not.toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('validation errors')
      );
    }));

    it('should not save if no changes', fakeAsync(() => {
      component.dirtyRowIds.clear();

      component.onSave();
      tick();

      expect(mockService.saveBulkLabTests).not.toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('No changes to save');
    }));


    it('should pass testId as first argument to saveBulkLabTests', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockService.saveBulkLabTests.calls.mostRecent().args[0]).toBe('ABID');
    }));

    it('should map PlateSeq from initialRepeat', fakeAsync(() => {
      component.onRowFieldChange(0, 'initialRepeat', 'R');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].plateSeq).toBe('R');
    }));

    it('should map AutoOnly from machineResult Y/N to boolean', fakeAsync(() => {
      component.onRowFieldChange(0, 'machineResult', 'Y');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].autoOnly).toBe(true);
    }));

    it('should map AutoOnly to false for machineResult N', fakeAsync(() => {
      component.onRowFieldChange(0, 'machineResult', 'N');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].autoOnly).toBe(false);
    }));


    it('should map SecondTech from result2 Y/N to boolean', fakeAsync(() => {
      component.onRowFieldChange(0, 'result2', 'Y');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].secondTech).toBe(true);
    }));

    it('should format EffectiveDate as YYYY-MM-DD string', fakeAsync(() => {
      component.onRowFieldChange(0, 'effDate', new Date('2025-03-15'));

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));


    it('should handle optional fields as undefined when empty', fakeAsync(() => {
      component.onRowFieldChange(0, 'attributeCode', '');
      component.onRowFieldChange(0, 'confirmTest1', '');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].attributeCode).toBeUndefined();
      expect(dto.records[0].confirmTest1).toBeUndefined();
    }));


    it('should handle Moment date objects in formatDateForApi', fakeAsync(() => {
      const momentDate = moment('2099-06-15');
      component.onRowFieldChange(0, 'effDate', momentDate);

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].effectiveDate).toContain('2099-06-15');
    }));

    it('should show error if testId is missing', fakeAsync(() => {
      component.testIdControl.setValue(null, { emitEvent: false });

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Test ID is required');
      expect(mockService.saveBulkLabTests).not.toHaveBeenCalled();
    }));

    it('should handle save API error', fakeAsync(() => {
      mockService.saveBulkLabTests.and.returnValue(throwError(() => new Error('save failed')));
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('should show validation banner on validation failure', fakeAsync(() => {
      component.editableRows[0].resultCode = '';
      component.dirtyRowIds.add(0);

      component.onSave();
      tick();

      expect(component.showValidationBanner).toBe(true);
    }));

    it('should reset validation banner on successful validation', fakeAsync(() => {
      component.showValidationBanner = true;
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(component.showValidationBanner).toBe(false);
    }));

    it('should include auditKey for existing records', fakeAsync(() => {
      component.editableRows[0].auditKey = 5;
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].auditKey).toBe(5);
    }));

    it('should not include auditKey for new records', fakeAsync(() => {
      component.onAddNewRow();
      const newRow = component.editableRows[0];
      newRow.resultCode = 'NEW';
      newRow.initialRepeat = 'I';
      newRow.interdictionCode = 'D01';
      newRow.effDate = new Date('2099-06-15');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      const newRecord = dto.records.find((r: any) => r.resultCode === 'NEW');
      expect(newRecord?.auditKey).toBeUndefined();
    }));

    it('should map SecondTech to false for result2 N', fakeAsync(() => {
      component.onRowFieldChange(0, 'result2', 'N');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].secondTech).toBe(false);
    }));

    it('should map AutoOnly to null for empty machineResult', fakeAsync(() => {
      component.onRowFieldChange(0, 'machineResult', '');

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].autoOnly).toBeNull();
    }));

    it('should set terminationDate to null when termDate is not set', fakeAsync(() => {
      component.onRowFieldChange(0, 'termDate', null);

      component.onSave();
      tick();

      const dto = mockService.saveBulkLabTests.calls.mostRecent().args[1];
      expect(dto.records[0].terminationDate).toBeNull();
    }));

    it('should use response message if available', fakeAsync(() => {
      mockService.saveBulkLabTests.and.returnValue(of({
        ...mockBulkUpsertResult,
        Message: 'Custom message'
      }));
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Custom message');
    }));

    it('should use fallback message when Message is undefined', fakeAsync(() => {
      mockService.saveBulkLabTests.and.returnValue(of({
        ...mockBulkUpsertResult,
        Message: undefined
      }));
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('Saved successfully')
      );
    }));
  });

  describe('Table Columns', () => {



    it('should have resultCode as non-sortable', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'resultCode');
      expect(column?.sortable).toBe(false);
    });

  });

  describe('Value Formatters', () => {
    it('should format initialRepeat I as Initial', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'initialRepeat');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter('I', mockLabTests[0])).toBe('Initial');
      }
    });

    it('should format initialRepeat R as Repeat', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'initialRepeat');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter('R', mockLabTests[0])).toBe('Repeat');
      }
    });

    it('should return dash for null initialRepeat', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'initialRepeat');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter(null, mockLabTests[0])).toBe('-');
      }
    });

    it('should format date correctly in DD-MMM-YYYY format', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter(new Date('2025-01-15'), mockLabTests[0]);
        expect(result).toMatch(/15-JAN-2025/);
      }
    });


    it('should format noOfRepeats to string', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'noOfRepeats');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter(2, mockLabTests[0])).toBe('2');
      }
    });

    it('should return dash for null noOfRepeats', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'noOfRepeats');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter(null, mockLabTests[0])).toBe('-');
      }
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = component.formatDateTime(new Date('2025-01-15T14:30:00'));
      expect(result).toMatch(/15-JAN-2025 14:30/);
    });

    it('should return dash for null date', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });
  });

  describe('Date Input Template Attributes', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
    }));

    it('should set autocomplete="off" on effective date input', () => {
      const effDateInput = fixture.nativeElement.querySelector('#effDate-0');
      expect(effDateInput?.getAttribute('autocomplete')).toBe('off');
    });

    it('should set autocomplete="off" on termination date input', () => {
      const termDateInput = fixture.nativeElement.querySelector('#termDate-0');
      expect(termDateInput?.getAttribute('autocomplete')).toBe('off');
    });
  });

  describe('ngOnDestroy', () => {


    it('should not throw if overlay is null', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Request State Management', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));


    it('should clear filter fields when clearing all filters', fakeAsync(() => {
      const filters: LabTestFilterValue = {
        initialRepeat: 'I',
        interdictionCode: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      component.clearAllFilters();
      tick();

      expect(component.requestState.initialRepeat).toBeUndefined();
      expect(component.requestState.interdictionCode).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.testId).toBe('ABID');
    }));

    it('should preserve sort when clearing filters', fakeAsync(() => {
      component.requestState.sort = 'RESULT_CODE_ASC';

      component.clearAllFilters();
      tick();

      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
    }));

    it('should update request state from applied filters', fakeAsync(() => {
      component.appliedFilters = {
        initialRepeat: 'R',
        interdictionCode: 'D02',
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-01')
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.initialRepeat).toBe('R');
      expect(component.requestState.interdictionCode).toBe('D02');
      expect(component.requestState.effectiveDatePeriod).toBe('Before');
      expect(component.requestState.terminationDatePeriod).toBe('After');
    }));

    it('should clear filter fields when appliedFilters is null', fakeAsync(() => {
      component.requestState.sort = 'RESULT_CODE_ASC';
      component.requestState.initialRepeat = 'I';
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.initialRepeat).toBeUndefined();
      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
    }));
  });

  describe('formatDate', () => {
    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should format a valid Date object', () => {
      const result = component.formatDate(new Date('2025-03-15'));
      expect(result).toMatch(/15-MAR-2025/);
    });

    it('should format a date string', () => {
      const result = component.formatDate('2024-07-04');
      expect(result).toMatch(/04-JUL-2024/);
    });
  });

  describe('formatYesNo', () => {
    it('should return dash for null', () => {
      expect(component.formatYesNo(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatYesNo(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatYesNo('')).toBe('-');
    });

    it('should return Yes for Y', () => {
      expect(component.formatYesNo('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.formatYesNo('N')).toBe('No');
    });

    it('should return Yes for lowercase y', () => {
      expect(component.formatYesNo('y')).toBe('Yes');
    });

    it('should return original value for other strings', () => {
      expect(component.formatYesNo('X')).toBe('X');
    });
  });

  describe('formatInitialRepeat', () => {
    it('should return dash for null', () => {
      expect(component.formatInitialRepeat(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatInitialRepeat(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatInitialRepeat('')).toBe('-');
    });

    it('should return Initial for I', () => {
      expect(component.formatInitialRepeat('I')).toBe('Initial');
    });

    it('should return Repeat for R', () => {
      expect(component.formatInitialRepeat('R')).toBe('Repeat');
    });

    it('should return original value for other strings', () => {
      expect(component.formatInitialRepeat('X')).toBe('X');
    });
  });

  describe('formatTestIdDisplay', () => {
    it('should return testId with description', () => {
      const testId: TestIdOption = { testId: 'ABID', description: 'ABO Test' };
      expect(component.formatTestIdDisplay(testId)).toBe('ABID - ABO Test');
    });

    it('should return only testId when no description', () => {
      const testId: TestIdOption = { testId: 'ABID' };
      expect(component.formatTestIdDisplay(testId)).toBe('ABID');
    });

    it('should return only testId when description is empty/whitespace', () => {
      const testId: TestIdOption = { testId: 'ABID', description: '   ' };
      expect(component.formatTestIdDisplay(testId)).toBe('ABID');
    });
  });

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should filter dataSource by search text', () => {
      component.onSearch('POS');

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].resultCode).toBe('POS');
    });

    it('should restore all data when search text is empty', () => {
      component.onSearch('POS');
      component.onSearch('');

      expect(component.dataSource.length).toBe(2);
    });

    it('should be case insensitive', () => {
      component.onSearch('pos');

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].resultCode).toBe('POS');
    });

    it('should return no results for non-matching search', () => {
      component.onSearch('ZZZZZ');

      expect(component.dataSource.length).toBe(0);
    });
  });

  describe('onDeleteRow', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should not delete the last remaining row', () => {
      // Reduce to 1 row
      component.editableRows = [component.editableRows[0]];

      component.onDeleteRow(0);

      expect(component.editableRows.length).toBe(1);
    });

    it('should delete a row and re-index dirty rows', () => {
      component.dirtyRowIds.add(0);
      component.dirtyRowIds.add(1);

      component.onDeleteRow(0);

      expect(component.editableRows.length).toBe(1);
      expect(component.dirtyRowIds.has(0)).toBe(true); // was at index 1
      expect(component.dirtyRowIds.has(1)).toBe(false);
    });

    it('should keep lower-index dirty rows unchanged when deleting higher index', () => {
      component.onAddNewRow(); // 3 rows now
      component.dirtyRowIds.add(0);
      component.dirtyRowIds.add(2);

      component.onDeleteRow(1);

      expect(component.dirtyRowIds.has(0)).toBe(true);
      expect(component.dirtyRowIds.has(1)).toBe(true); // was 2
    });
  });

  describe('onRowFieldChange branches', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set effDate directly', () => {
      const newDate = new Date('2099-01-01');
      component.onRowFieldChange(0, 'effDate', newDate);

      expect(component.editableRows[0].effDate).toEqual(newDate);
    });

    it('should set termDate directly', () => {
      const newDate = new Date('2099-12-31');
      component.onRowFieldChange(0, 'termDate', newDate);

      expect(component.editableRows[0].termDate).toEqual(newDate);
    });

    it('should set editable fields via isEditableField', () => {
      component.onRowFieldChange(0, 'attributeCode', 'A02');
      expect(component.editableRows[0].attributeCode).toBe('A02');
    });

    it('should clear existing errors for the changed field', () => {
      component.editableRows[0].errors = { resultCode: 'Required' };
      component.onRowFieldChange(0, 'resultCode', 'POS');

      expect(component.editableRows[0].errors?.['resultCode']).toBeUndefined();
    });

    it('should silently ignore unknown fields', () => {
      expect(() => component.onRowFieldChange(0, 'unknownField', 'value')).not.toThrow();
    });
  });

  describe('onDropdownOpened and isDropdownOpen', () => {
    it('should track opened dropdown', () => {
      component.onDropdownOpened(1, 'interdictionCode', true);

      expect(component.openDropdown).toEqual({ row: 1, col: 'interdictionCode' });
      expect(component.isDropdownOpen(1, 'interdictionCode')).toBe(true);
      expect(component.isDropdownOpen(0, 'interdictionCode')).toBe(false);
      expect(component.isDropdownOpen(1, 'attributeCode')).toBe(false);
    });

    it('should clear openDropdown when closed', () => {
      component.onDropdownOpened(1, 'interdictionCode', true);
      component.onDropdownOpened(1, 'interdictionCode', false);

      expect(component.openDropdown).toBeNull();
    });

    it('should reset search control for interdictionCode on close', () => {
      component.interdictionSearch.set('test');
      component.onDropdownOpened(0, 'interdictionCode', false);

      expect(component.interdictionSearch()).toBe('');
    });

    it('should reset search control for attributeCode on close', () => {
      component.attributeSearch.set('test');
      component.onDropdownOpened(0, 'attributeCode', false);

      expect(component.attributeSearch()).toBe('');
    });

    it('should reset search control for resultCode on close', () => {
      component.resultCodeSearch.set('test');
      component.onDropdownOpened(0, 'resultCode', false);

      expect(component.resultCodeSearch()).toBe('');
    });

    it('should reset search control for confirmTest1 on close', () => {
      component.confirmTest1Search.set('test');
      component.onDropdownOpened(0, 'confirmTest1', false);

      expect(component.confirmTest1Search()).toBe('');
    });

    it('should reset search control for confirmTest2 on close', () => {
      component.confirmTest2Search.set('test');
      component.onDropdownOpened(0, 'confirmTest2', false);

      expect(component.confirmTest2Search()).toBe('');
    });

    it('should reset search control for confirmTest3 on close', () => {
      component.confirmTest3Search.set('test');
      component.onDropdownOpened(0, 'confirmTest3', false);

      expect(component.confirmTest3Search()).toBe('');
    });

    it('should reset search control for confirmTest4 on close', () => {
      component.confirmTest4Search.set('test');
      component.onDropdownOpened(0, 'confirmTest4', false);

      expect(component.confirmTest4Search()).toBe('');
    });

    it('should reset search control for confirmTest5 on close', () => {
      component.confirmTest5Search.set('test');
      component.onDropdownOpened(0, 'confirmTest5', false);

      expect(component.confirmTest5Search()).toBe('');
    });

    it('should reset search control for confirmTest6 on close', () => {
      component.confirmTest6Search.set('test');
      component.onDropdownOpened(0, 'confirmTest6', false);

      expect(component.confirmTest6Search()).toBe('');
    });

    it('should return false for isDropdownOpen when openDropdown is null', () => {
      component.openDropdown = null;
      expect(component.isDropdownOpen(0, 'interdictionCode')).toBe(false);
    });
  });

  describe('allowOnlyDigits', () => {
    it('should allow digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys like Backspace', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: true } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = { key: 'c', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: true } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = { key: 'v', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: true } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block letter keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block special characters', () => {
      const event = { key: '@', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow ArrowLeft key', () => {
      const event = { key: 'ArrowLeft', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete key', () => {
      const event = { key: 'Delete', preventDefault: jasmine.createSpy('preventDefault'), ctrlKey: false } as any;
      component.allowOnlyDigits(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Date getters and filters', () => {
    it('should return minDate as a Date from DateFieldValidationUtility', () => {
      const result = component.minDate;
      expect(result instanceof Date).toBe(true);
    });

    it('should return chapterLocalDateAsDate as a Date', () => {
      const result = component.chapterLocalDateAsDate;
      expect(result instanceof Date).toBe(true);
    });

    it('should return chapterLocalDateFormatted as DD-MMM-YYYY string', () => {
      const result = component.chapterLocalDateFormatted;
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should allow dates on or after chapter local date in effDateFilter', () => {
      const futureDate = new Date('2099-12-31');
      expect(component.effDateFilter(futureDate)).toBe(true);
    });

    it('should disallow dates before chapter local date in effDateFilter', () => {
      const pastDate = new Date('2000-01-01');
      expect(component.effDateFilter(pastDate)).toBe(false);
    });

    it('should return true for null in effDateFilter', () => {
      expect(component.effDateFilter(null)).toBe(true);
    });
  });

  describe('getTerminationMinDate', () => {
    it('should return chapter local date when no effDate', () => {
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: null, termDate: null, auditKey: 0
      };

      const result = component.getTerminationMinDate(row);
      expect(result instanceof Date).toBe(true);
    });

    it('should return effDate when effDate is in the future', () => {
      const futureDate = new Date('2099-06-15');
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: futureDate, termDate: null, auditKey: 0
      };

      const result = component.getTerminationMinDate(row);
      expect(result.getFullYear()).toBe(2099);
    });

    it('should return chapter local date when effDate is in the past', () => {
      const pastDate = new Date('2020-01-01');
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: pastDate, termDate: null, auditKey: 0
      };

      const result = component.getTerminationMinDate(row);
      // Should be today (or chapter local date), not the past date
      expect(result.getFullYear()).toBeGreaterThanOrEqual(new Date().getFullYear() - 1);
    });

    it('should handle moment effDate', () => {
      const momentDate = moment('2099-06-15');
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: momentDate as any, termDate: null, auditKey: 0
      };

      const result = component.getTerminationMinDate(row);
      expect(result.getFullYear()).toBe(2099);
    });
  });

  describe('getTermDateFilter', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should return a filter function', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);
      expect(typeof filter).toBe('function');
    });

    it('should return cached filter on subsequent calls', () => {
      const row = component.editableRows[0];
      const filter1 = component.getTermDateFilter(row);
      const filter2 = component.getTermDateFilter(row);
      expect(filter1).toBe(filter2);
    });

    it('should return true for null date', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);
      expect(filter(null)).toBe(true);
    });

    it('should allow future dates', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);
      expect(filter(new Date('2099-12-31'))).toBe(true);
    });

    it('should disallow past dates when no effDate', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      // Clear cache to get a fresh filter
      (component as any).termDateFilterCache.clear();
      const filter = component.getTermDateFilter(row);
      expect(filter(new Date('2000-01-01'))).toBe(false);
    });

    it('should use effDate as minimum when effDate is in the future', () => {
      const row = component.editableRows[0];
      row.effDate = new Date('2099-06-15');
      (component as any).termDateFilterCache.clear();
      const filter = component.getTermDateFilter(row);
      // Date before effDate should be disallowed
      expect(filter(new Date('2099-06-14'))).toBe(false);
      // Date on or after effDate should be allowed
      expect(filter(new Date('2099-06-15'))).toBe(true);
    });

    it('should handle Moment effDate objects', () => {
      const row = component.editableRows[0];
      row.effDate = moment('2099-06-15') as any;
      (component as any).termDateFilterCache.clear();
      const filter = component.getTermDateFilter(row);
      expect(filter(new Date('2099-06-15'))).toBe(true);
    });
  });

  describe('hasNewRows', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should return false when all rows are existing', () => {
      expect(component.hasNewRows()).toBe(false);
    });

    it('should return true when a new row exists', () => {
      component.onAddNewRow();
      expect(component.hasNewRows()).toBe(true);
    });
  });

  describe('Error paths', () => {
    it('should show error when loadAllTestIds fails', fakeAsync(() => {
      mockService.getTestIds.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load test IDs')
      );
    }));

    it('should show error when getResultCodes fails', fakeAsync(() => {
      mockService.getResultCodes.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load result codes')
      );
    }));

    it('should show error when getFilterValues fails', fakeAsync(() => {
      mockService.getFilterValues.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load dropdown options')
      );
    }));

    it('should show error when loadTestDetails fails', fakeAsync(() => {
      mockService.getTestDetails.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load test details.');
    }));
  });

  describe('subscribeToChapterChanges', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should reset state on chapter change', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.testDetails).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(component.allLoadedData).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    }));

    it('should exit edit mode on chapter change', fakeAsync(() => {
      component.onAddEditClick();
      expect(component.isEditMode).toBe(true);

      chapterChangedSubject.next();
      tick();

      expect(component.isEditMode).toBe(false);
      expect(component.editableRows).toEqual([]);
      expect(component.dirtyRowIds.size).toBe(0);
      expect(component.showValidationBanner).toBe(false);
    }));

    it('should reload test IDs on chapter change', fakeAsync(() => {
      mockService.getTestIds.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(mockService.getTestIds).toHaveBeenCalled();
    }));

    it('should close filter panel on chapter change', fakeAsync(() => {
      // Simulate an open overlay
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();
      tick();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    }));

    it('should handle chapter change when not in edit mode', fakeAsync(() => {
      expect(component.isEditMode).toBe(false);

      chapterChangedSubject.next();
      tick();

      // Should not throw and state should be reset
      expect(component.dataSource).toEqual([]);
    }));
  });

  describe('onEditTestDetails', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should not open dialog when testDetails is null', () => {
      component.testDetails = null;
      component.onEditTestDetails();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open dialog with edit mode data', fakeAsync(() => {
      component.onEditTestDetails();

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.mode).toBe('edit');
      expect(dialogData.testId).toBe('ABID');
      expect(dialogData.description).toBe('ABO/RH Blood Typing');
    }));

    it('should reload test details on successful dialog close', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getTestDetails.calls.reset();
      component.onEditTestDetails();
      tick();

      expect(mockService.getTestDetails).toHaveBeenCalledWith('ABID');
    }));

    it('should not reload on dialog close without success', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getTestDetails.calls.reset();
      component.onEditTestDetails();
      tick();

      expect(mockService.getTestDetails).not.toHaveBeenCalled();
    }));
  });

  describe('onAddNewTest', () => {
    it('should open dialog with add mode', () => {
      component.onAddNewTest();

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.mode).toBe('add');
    });

    it('should reload test IDs on successful dialog close', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getTestIds.calls.reset();
      component.onAddNewTest();
      tick();

      expect(mockService.getTestIds).toHaveBeenCalled();
    }));

    it('should not reload test IDs on dialog cancel', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getTestIds.calls.reset();
      component.onAddNewTest();
      tick();

      expect(mockService.getTestIds).not.toHaveBeenCalled();
    }));
  });

  describe('onDateInputBlur', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set error when effDate is empty for new rows', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'effDate', event);

      expect(row.errors?.['effDate']).toContain('required');
    });

    it('should clear error when termDate is empty (optional)', () => {
      const row = component.editableRows[0];
      row.errors = { termDate: 'some error' };
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'termDate', event);

      expect(row.errors?.['termDate']).toBeUndefined();
      expect(row.termDate).toBeNull();
    });

    it('should validate existing valid Date on blur', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effDate = new Date('2099-06-15');
      const event = { target: { value: '15-JUN-2099' } };

      component.onDateInputBlur(0, 'effDate', event);

      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should set error for invalid date format', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      const event = { target: { value: 'invalid-date' } };

      component.onDateInputBlur(0, 'effDate', event);

      expect(row.errors?.['effDate']).toContain('Invalid date format');
    });

    it('should parse and set a valid manual date input', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      row.auditKey = 0;
      const event = { target: { value: '06/15/2099' } };

      component.onDateInputBlur(0, 'effDate', event);

      expect(row.effDate).not.toBeNull();
      expect(row.isDirty).toBe(true);
    });

    it('should not require effDate for existing rows', () => {
      const row = component.editableRows[0];
      row.auditKey = 5;
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'effDate', event);

      expect(row.errors?.['effDate']).toBeUndefined();
    });
  });

  describe('validateDateField', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set error when effDate is null for new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effDate = null;

      component['validateDateField'](row, 'effDate');

      expect(row.errors?.['effDate']).toContain('required');
    });

    it('should set error when effDate is before chapter local date for new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effDate = new Date('2020-01-01');

      component['validateDateField'](row, 'effDate');

      expect(row.errors?.['effDate']).toContain('cannot be before chapter local date');
    });

    it('should clear error when effDate is valid for new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effDate = new Date('2099-06-15');
      row.errors = { effDate: 'old error' };

      component['validateDateField'](row, 'effDate');

      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should set error when termDate is before effDate', () => {
      const row = component.editableRows[0];
      row.effDate = new Date('2099-06-15');
      row.termDate = new Date('2099-06-14');

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toContain('cannot be before Effective Date');
    });

    it('should set error when termDate is before chapter local date (with effDate)', () => {
      const row = component.editableRows[0];
      row.effDate = new Date('2020-01-01');
      row.termDate = new Date('2020-06-01');

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toContain('chapter local date');
    });

    it('should clear error when termDate is valid', () => {
      const row = component.editableRows[0];
      row.effDate = new Date('2099-06-15');
      row.termDate = new Date('2099-12-31');
      row.errors = { termDate: 'old error' };

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should clear error when termDate is null (optional)', () => {
      const row = component.editableRows[0];
      row.termDate = null;
      row.errors = { termDate: 'old error' };

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should validate termDate without effDate', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      row.termDate = new Date('2020-01-01');

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toContain('chapter local date');
    });

    it('should clear error for termDate without effDate when valid', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      row.termDate = new Date('2099-12-31');
      row.errors = { termDate: 'old error' };

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should handle Moment effDate in termDate validation', () => {
      const row = component.editableRows[0];
      row.effDate = moment('2099-06-15') as any;
      row.termDate = new Date('2099-12-31');

      component['validateDateField'](row, 'termDate');

      expect(row.errors?.['termDate']).toBeUndefined();
    });
  });

  describe('parseManualDateInput', () => {
    it('should return null for empty input', () => {
      expect(component['parseManualDateInput']('')).toBeNull();
    });

    it('should parse MMDDYYYY format', () => {
      const result = component['parseManualDateInput']('06152099');
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(5); // June
      expect(result!.getDate()).toBe(15);
      expect(result!.getFullYear()).toBe(2099);
    });

    it('should parse MM/DD/YYYY format', () => {
      const result = component['parseManualDateInput']('06/15/2099');
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(5);
    });

    it('should parse MM-DD-YYYY format', () => {
      const result = component['parseManualDateInput']('06-15-2099');
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(5);
    });

    it('should return null for invalid month', () => {
      expect(component['parseManualDateInput']('13/15/2099')).toBeNull();
    });

    it('should return null for invalid day', () => {
      expect(component['parseManualDateInput']('02/30/2024')).toBeNull();
    });

    it('should return null for year out of range', () => {
      expect(component['parseManualDateInput']('06/15/1899')).toBeNull();
    });

    it('should return null for non-date string', () => {
      expect(component['parseManualDateInput']('abc')).toBeNull();
    });

    it('should handle 2-digit year (< 50 adds 2000)', () => {
      const result = component['parseManualDateInput']('06/15/25');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
    });

    it('should handle 2-digit year (>= 50 adds 1900)', () => {
      const result = component['parseManualDateInput']('06/15/75');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(1975);
    });

    it('should return null for incomplete parts', () => {
      expect(component['parseManualDateInput']('06/15')).toBeNull();
    });

    it('should return null for month 0', () => {
      expect(component['parseManualDateInput']('00/15/2099')).toBeNull();
    });

    it('should return null for day 0', () => {
      expect(component['parseManualDateInput']('06/00/2099')).toBeNull();
    });
  });

  describe('validateFieldImmediate', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set error for empty resultCode', () => {
      const row = component.editableRows[0];
      row.resultCode = '';
      component['validateFieldImmediate'](row, 'resultCode');

      expect(row.errors?.['resultCode']).toContain('required');
    });

    it('should set error for empty initialRepeat', () => {
      const row = component.editableRows[0];
      row.initialRepeat = '';
      component['validateFieldImmediate'](row, 'initialRepeat');

      expect(row.errors?.['initialRepeat']).toContain('required');
    });

    it('should not set error for empty interdictionCode (field is not validated as required)', () => {
      const row = component.editableRows[0];
      row.interdictionCode = '';
      component['validateFieldImmediate'](row, 'interdictionCode');

      // interdictionCode case just breaks with no validation
      expect(row.errors?.['interdictionCode']).toBeUndefined();
    });

    it('should set error for invalid noOfRepeats', () => {
      const row = component.editableRows[0];
      row.noOfRepeats = 15;
      component['validateFieldImmediate'](row, 'noOfRepeats');

      expect(row.errors?.['noOfRepeats']).toContain('between 0 and 9');
    });

    it('should not set error for valid noOfRepeats', () => {
      const row = component.editableRows[0];
      row.noOfRepeats = 5;
      row.errors = {};
      component['validateFieldImmediate'](row, 'noOfRepeats');

      expect(row.errors?.['noOfRepeats']).toBeUndefined();
    });

    it('should not set error for empty noOfRepeats', () => {
      const row = component.editableRows[0];
      row.noOfRepeats = '';
      row.errors = {};
      component['validateFieldImmediate'](row, 'noOfRepeats');

      expect(row.errors?.['noOfRepeats']).toBeUndefined();
    });

    it('should not set error for null noOfRepeats', () => {
      const row = component.editableRows[0];
      row.noOfRepeats = null;
      row.errors = {};
      component['validateFieldImmediate'](row, 'noOfRepeats');

      expect(row.errors?.['noOfRepeats']).toBeUndefined();
    });

    it('should initialize errors object if not present', () => {
      const row = component.editableRows[0];
      delete row.errors;
      row.resultCode = '';
      component['validateFieldImmediate'](row, 'resultCode');

      expect(row.errors).toBeDefined();
      expect(row.errors?.['resultCode']).toBeDefined();
    });
  });

  describe('getDateFieldError', () => {
    it('should return parse error from NgModel', () => {
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: null, termDate: null, auditKey: 0
      };
      const ngModelRef = { errors: { matDatepickerParse: true } } as any;

      const result = component.getDateFieldError(row, 'effDate', ngModelRef);
      expect(result).toContain('Invalid date format');
    });

    it('should return invalidDateFormat error from NgModel', () => {
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: null, termDate: null, auditKey: 0
      };
      const ngModelRef = { errors: { invalidDateFormat: true } } as any;

      const result = component.getDateFieldError(row, 'effDate', ngModelRef);
      expect(result).toContain('Invalid date');
    });

    it('should return custom row error', () => {
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: null, termDate: null, auditKey: 0,
        errors: { effDate: 'Custom error message' }
      };
      const ngModelRef = { errors: null } as any;

      const result = component.getDateFieldError(row, 'effDate', ngModelRef);
      expect(result).toBe('Custom error message');
    });

    it('should return empty string when no errors', () => {
      const row: LabTestEditModel = {
        resultCode: '', initialRepeat: '', interdictionCode: '',
        noOfRepeats: null, attributeCode: null, confirmTest1: null,
        confirmTest2: null, confirmTest3: null, confirmTest4: null,
        confirmTest5: null, confirmTest6: null, machineResult: null,
        result2: null, effDate: null, termDate: null, auditKey: 0,
        errors: {}
      };
      const ngModelRef = { errors: null } as any;

      const result = component.getDateFieldError(row, 'effDate', ngModelRef);
      expect(result).toBe('');
    });
  });

  describe('Computed filtered signals', () => {
    it('should filter interdiction codes by search', () => {
      component.interdictionCodeOptionsSignal.set([
        { value: 'D01', display: 'D01 - Hold' },
        { value: 'D02', display: 'D02 - Release' }
      ]);
      component.interdictionSearch.set('hold');

      const filtered = component.filteredInterdictionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('D01');
    });

    it('should return all interdiction codes when search is empty', () => {
      component.interdictionCodeOptionsSignal.set([
        { value: 'D01', display: 'D01' },
        { value: 'D02', display: 'D02' }
      ]);
      component.interdictionSearch.set('');

      expect(component.filteredInterdictionCodes().length).toBe(2);
    });

    it('should filter attribute codes by search', () => {
      component.attributeCodeOptionsSignal.set([
        { value: 'A01', display: 'A01 - Alpha' },
        { value: 'A02', display: 'A02 - Beta' }
      ]);
      component.attributeSearch.set('alpha');

      const filtered = component.filteredAttributeCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('A01');
    });

    it('should filter result codes by search', () => {
      component.resultCodeOptionsSignal.set([
        { value: 'POS', display: 'POS - Positive' },
        { value: 'NEG', display: 'NEG - Negative' }
      ]);
      component.resultCodeSearch.set('pos');

      const filtered = component.filteredResultCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('POS');
    });

    it('should filter confirmTest1 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest1Search.set('hbs');

      const filtered = component.filteredConfirmTests1();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('HBSAG');
    });

    it('should filter confirmTest2 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest2Search.set('abi');

      expect(component.filteredConfirmTests2().length).toBe(1);
    });

    it('should filter confirmTest3 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest3Search.set('abi');

      expect(component.filteredConfirmTests3().length).toBe(1);
    });

    it('should filter confirmTest4 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest4Search.set('abi');

      expect(component.filteredConfirmTests4().length).toBe(1);
    });

    it('should filter confirmTest5 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest5Search.set('abi');

      expect(component.filteredConfirmTests5().length).toBe(1);
    });

    it('should filter confirmTest6 options by search', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest6Search.set('abi');

      expect(component.filteredConfirmTests6().length).toBe(1);
    });

    it('should return all confirm test options when search is empty', () => {
      component.confirmTestOptionsSignal.set([
        { value: 'ABID', display: 'ABID' },
        { value: 'HBSAG', display: 'HBSAG' }
      ]);
      component.confirmTest1Search.set('');

      expect(component.filteredConfirmTests1().length).toBe(2);
    });
  });

  describe('Search control subscriptions', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should update interdictionSearch on value change', fakeAsync(() => {
      component.interdictionSearchControl.setValue('D01');
      tick();

      expect(component.interdictionSearch()).toBe('D01');
    }));

    it('should update attributeSearch on value change', fakeAsync(() => {
      component.attributeSearchControl.setValue('A01');
      tick();

      expect(component.attributeSearch()).toBe('A01');
    }));

    it('should update resultCodeSearch on value change', fakeAsync(() => {
      component.resultCodeSearchControl.setValue('POS');
      tick();

      expect(component.resultCodeSearch()).toBe('POS');
    }));

    it('should update confirmTest1Search on value change', fakeAsync(() => {
      component.confirmTest1SearchControl.setValue('ABID');
      tick();

      expect(component.confirmTest1Search()).toBe('ABID');
    }));

    it('should update confirmTest2Search on value change', fakeAsync(() => {
      component.confirmTest2SearchControl.setValue('test');
      tick();

      expect(component.confirmTest2Search()).toBe('test');
    }));

    it('should update confirmTest3Search on value change', fakeAsync(() => {
      component.confirmTest3SearchControl.setValue('test');
      tick();

      expect(component.confirmTest3Search()).toBe('test');
    }));

    it('should update confirmTest4Search on value change', fakeAsync(() => {
      component.confirmTest4SearchControl.setValue('test');
      tick();

      expect(component.confirmTest4Search()).toBe('test');
    }));

    it('should update confirmTest5Search on value change', fakeAsync(() => {
      component.confirmTest5SearchControl.setValue('test');
      tick();

      expect(component.confirmTest5Search()).toBe('test');
    }));

    it('should update confirmTest6Search on value change', fakeAsync(() => {
      component.confirmTest6SearchControl.setValue('test');
      tick();

      expect(component.confirmTest6Search()).toBe('test');
    }));

    it('should trim whitespace and default to empty string for null', fakeAsync(() => {
      component.interdictionSearchControl.setValue(null);
      tick();

      expect(component.interdictionSearch()).toBe('');
    }));
  });

  describe('calculateFilterPanelMaxHeight', () => {
    it('should return null when footer element is not found', () => {
      const result = component['calculateFilterPanelMaxHeight']();
      expect(result).toBeNull();
    });
  });

  describe('Cross-field date validation in onRowFieldChange', () => {
    let row: LabTestEditModel;

    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      row = component.editableRows[0];
      row.auditKey = 0;
      row.errors = {};
    }));

    it('should set error on effDate when effDate > termDate', () => {
      row.termDate = new Date('2026-08-07');
      component.onRowFieldChange(0, 'effDate', new Date('2026-08-09'));

      expect(row.errors?.['effDate']).toBe('Effective Date must be on or before Termination Date');
      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should clear both errors when effDate <= termDate', () => {
      row.errors = { effDate: 'old error' };
      row.termDate = new Date('2026-08-10');
      component.onRowFieldChange(0, 'effDate', new Date('2026-08-09'));

      expect(row.errors?.['effDate']).toBeUndefined();
      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should not clear effDate error in generic error clearing (date fields skip it)', () => {
      row.termDate = new Date('2026-08-07');
      component.onRowFieldChange(0, 'effDate', new Date('2026-08-09'));

      // The error should persist — not be cleared by the generic delete at the end
      expect(row.errors?.['effDate']).toBeDefined();
    });

    it('should set lastDateField to effDate when effDate changes', () => {
      row.termDate = new Date('2026-08-07');
      component.onRowFieldChange(0, 'effDate', new Date('2026-08-09'));

      expect(row.lastDateField).toBe('effDate');
    });

    it('should set lastDateField to termDate when termDate changes', () => {
      component.onRowFieldChange(0, 'termDate', new Date('2026-08-07'));

      expect(row.lastDateField).toBe('termDate');
    });

    it('should clear errors when termDate is null and effDate changes', () => {
      row.termDate = null;
      row.errors = { effDate: 'old error', termDate: 'old error' };
      component.onRowFieldChange(0, 'effDate', new Date('2026-08-09'));

      expect(row.errors?.['effDate']).toBeUndefined();
      expect(row.errors?.['termDate']).toBeUndefined();
    });
  });

  describe('validateAllRows includes new untouched rows', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should validate new rows (auditKey === 0) even if not dirty', () => {
      const newRow = component.editableRows[0];
      newRow.auditKey = 0;
      newRow.resultCode = '';
      newRow.initialRepeat = '';
      // NOT adding to dirtyRowIds

      const isValid = component['validateAllRows']();

      expect(isValid).toBe(false);
      expect(newRow.errors?.['resultCode']).toBeDefined();
    });

    it('should pass validation for new rows with all required fields filled', () => {
      const newRow = component.editableRows[0];
      newRow.auditKey = 0;
      newRow.resultCode = 'POS';
      newRow.initialRepeat = 'I';
      newRow.effDate = new Date('2026-12-01');

      const isValid = component['validateAllRows']();

      expect(isValid).toBe(true);
    });
  });

  describe('hasValidationErrors includes new rows with empty required fields', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should return true when new row has empty resultCode', () => {
      component.editableRows[0].auditKey = 0;
      component.editableRows[0].resultCode = '';
      component.editableRows[0].initialRepeat = 'I';
      component.editableRows[0].effDate = new Date();

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return true when new row has empty initialRepeat', () => {
      component.editableRows[0].auditKey = 0;
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].initialRepeat = '';
      component.editableRows[0].effDate = new Date();

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return true when new row has empty effDate', () => {
      component.editableRows[0].auditKey = 0;
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].initialRepeat = 'I';
      component.editableRows[0].effDate = null;

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return false when new row has all required fields', () => {
      component.editableRows[0].auditKey = 0;
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].initialRepeat = 'I';
      component.editableRows[0].effDate = new Date();
      component.editableRows[0].errors = {};

      expect(component.hasValidationErrors).toBe(false);
    });

    it('should return false for existing rows with empty fields', () => {
      component.editableRows[0].auditKey = 5;
      component.editableRows[0].resultCode = '';
      component.editableRows[0].errors = {};

      expect(component.hasValidationErrors).toBe(false);
    });
  });

  describe('validateRow date range uses lastDateField', () => {
    let row: LabTestEditModel;

    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      row = component.editableRows[0];
      row.resultCode = 'POS';
      row.initialRepeat = 'I';
      row.auditKey = 0;
    }));

    it('should put date range error on effDate when lastDateField is effDate', () => {
      row.effDate = new Date('2026-08-09');
      row.termDate = new Date('2026-08-07');
      row.lastDateField = 'effDate';

      component['validateRow'](row);

      expect(row.errors?.['effDate']).toBe('Effective Date must be on or before Termination Date');
      expect(row.errors?.['termDate']).toBeUndefined();
    });

    it('should put date range error on termDate when lastDateField is termDate', () => {
      row.effDate = new Date('2026-08-09');
      row.termDate = new Date('2026-08-07');
      row.lastDateField = 'termDate';

      component['validateRow'](row);

      expect(row.errors?.['termDate']).toBe('Termination Date must be on or after Effective Date');
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should put date range error on termDate when lastDateField is not set', () => {
      row.effDate = new Date('2026-08-09');
      row.termDate = new Date('2026-08-07');
      row.lastDateField = undefined;

      component['validateRow'](row);

      expect(row.errors?.['termDate']).toBe('Termination Date must be on or after Effective Date');
    });
  });

  describe('getDateFieldError', () => {
    it('should return error from row.errors when present', () => {
      const row: LabTestEditModel = {
        resultCode: 'POS', initialRepeat: 'I', interdictionCode: null,
        noOfRepeats: null, attributeCode: null, confirmTest1: null, confirmTest2: null,
        confirmTest3: null, confirmTest4: null, confirmTest5: null, confirmTest6: null,
        machineResult: null, result2: null, effDate: null, termDate: null, auditKey: 0,
        errors: { effDate: 'Effective Date must be on or before Termination Date' }
      };

      expect(component.getDateFieldError(row, 'effDate')).toBe('Effective Date must be on or before Termination Date');
    });

    it('should return empty string when no error', () => {
      const row: LabTestEditModel = {
        resultCode: 'POS', initialRepeat: 'I', interdictionCode: null,
        noOfRepeats: null, attributeCode: null, confirmTest1: null, confirmTest2: null,
        confirmTest3: null, confirmTest4: null, confirmTest5: null, confirmTest6: null,
        machineResult: null, result2: null, effDate: null, termDate: null, auditKey: 0,
        errors: {}
      };

      expect(component.getDateFieldError(row, 'effDate')).toBe('');
    });

    it('should return empty string when errors is undefined', () => {
      const row: LabTestEditModel = {
        resultCode: 'POS', initialRepeat: 'I', interdictionCode: null,
        noOfRepeats: null, attributeCode: null, confirmTest1: null, confirmTest2: null,
        confirmTest3: null, confirmTest4: null, confirmTest5: null, confirmTest6: null,
        machineResult: null, result2: null, effDate: null, termDate: null, auditKey: 0
      };

      expect(component.getDateFieldError(row, 'effDate')).toBe('');
    });
  });

  describe('onDropdownOpened validates on close', () => {
    beforeEach(fakeAsync(() => {
      try { fixture.detectChanges(); } catch (e) { /* ignore */ }
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should validate resultCode when dropdown closes with empty value', () => {
      component.editableRows[0].resultCode = '';
      component.onDropdownOpened(0, 'resultCode', false);

      expect(component.editableRows[0].errors?.['resultCode']).toBe('This field is required and cannot be left blank.');
    });

    it('should not set error when dropdown closes with valid value', () => {
      component.editableRows[0].resultCode = 'POS';
      component.editableRows[0].errors = {};
      component.onDropdownOpened(0, 'resultCode', false);

      expect(component.editableRows[0].errors?.['resultCode']).toBeUndefined();
    });

    it('should validate initialRepeat when dropdown closes with empty value', () => {
      component.editableRows[0].initialRepeat = '';
      component.onDropdownOpened(0, 'initialRepeat', false);

      expect(component.editableRows[0].errors?.['initialRepeat']).toBe('This field is required and cannot be left blank.');
    });
  });

  describe('hasDirtyRows', () => {
    it('should return false when no dirty rows', () => {
      component.dirtyRowIds.clear();
      expect(component.hasDirtyRows()).toBe(false);
    });

    it('should return true when dirty rows exist', () => {
      component.dirtyRowIds.add(0);
      expect(component.hasDirtyRows()).toBe(true);
    });
  });
});
