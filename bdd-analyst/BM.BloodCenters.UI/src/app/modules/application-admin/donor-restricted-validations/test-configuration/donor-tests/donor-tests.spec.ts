import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

import { DonorTestsComponent } from './donor-tests';
import { DonorTestsApiService } from './services/donor-tests-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  TestIdOption,
  TestDetails,
  DonorTestResultModel,
  DonorTestResultFilterValue,
  FilterDropdownOptions,
  DefineTestResultsDonorBulkUpsertResultDto
} from './models/donor-tests.model';

describe('DonorTestsComponent', () => {
  let mockDialogSpy: any;
  let component: DonorTestsComponent;
  let fixture: ComponentFixture<DonorTestsComponent>;
  let mockService: jasmine.SpyObj<DonorTestsApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
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
    profileTest: 'Yes',
    antigenType: 'ABO',
    antigenGroup: 'GRP1',
    testGroup: 'BLOOD',
    testGroupValue: 'BLOOD - Blood Group',
    viewLevel: 2,
    effectiveDate: new Date('2024-01-01'),
    terminationDate: null,
    modificationDate: new Date('2024-06-15')
  };

  const mockFilterDropdownOptions: FilterDropdownOptions = {
    interdictions: [
      { value: 'D01', display: 'D01' },
      { value: 'D02', display: 'D02' }
    ]
  };

  const mockDonorTestResults: DonorTestResultModel[] = [
    {
      testId: 'ABID',
      chapterId: 'CH1',
      resultCode: 'POS',
      interdiction1: 'D01',
      interdiction2: '',
      interdiction3: '',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: null,
      modificationDate: new Date('2024-06-01'),
      auditKey: 1
    },
    {
      testId: 'ABID',
      chapterId: 'CH2',
      resultCode: 'NEG',
      interdiction1: 'D02',
      interdiction2: '',
      interdiction3: '',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: new Date('2099-12-31'),
      modificationDate: new Date('2024-07-10'),
      auditKey: 2
    }
  ];

  const mockDonorTestResultsResponse = {
    data: mockDonorTestResults,
    totalRecords: 2
  };

  const mockBulkUpsertResult: DefineTestResultsDonorBulkUpsertResultDto = {
    TotalRecords: 1,
    CreatedCount: 1,
    UpdatedCount: 0,
    FailureCount: 0,
    SuccessCount: 1,
    Success: true,
    Message: 'Saved successfully'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorTestsApiService', [
      'getTestIds',
      'getTestDetails',
      'getFilterValues',
      'getDonorTestResults',
      'saveBulkDonorTestResults',
      'getDropdowns',
      'createTest',
      'updateTest',
      'getInterdictionDropdowns',
      'getResultCodeDropdowns'
    ]);
    mockService.getTestIds.and.returnValue(of(mockTestIds));
    mockService.getTestDetails.and.returnValue(of(mockTestDetails));
    mockService.getFilterValues.and.returnValue(of(mockFilterDropdownOptions));
    mockService.getDonorTestResults.and.returnValue(of(mockDonorTestResultsResponse));
    mockService.saveBulkDonorTestResults.and.returnValue(of(mockBulkUpsertResult));
    mockService.getInterdictionDropdowns.and.returnValue(of(mockFilterDropdownOptions.interdictions));
    mockService.getResultCodeDropdowns.and.returnValue(of([
      { value: 'POS', display: 'POS - Positive' },
      { value: 'NEG', display: 'NEG - Negative' }
    ]));

    const mockSnackbarServiceSpy = createMockSnackbarService();
    mockDialogSpy = createMockMatDialog();

    chapterChangedSubject = new Subject<void>();
    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable()
    });

      TestBed.configureTestingModule({
      imports: [
        DonorTestsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DonorTestsApiService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarServiceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay
      ]
    })
    .overrideProvider(MatDialog, { useValue: mockDialogSpy });


    


      mockService.getTestIds.calls.reset();


      mockService.getTestDetails.calls.reset();


      mockService.getFilterValues.calls.reset();


      mockService.getDonorTestResults.calls.reset();


      mockService.saveBulkDonorTestResults.calls.reset();


      mockService.getDropdowns.calls.reset();


      mockService.createTest.calls.reset();


      mockService.updateTest.calls.reset();


      mockService.getInterdictionDropdowns.calls.reset();


      mockService.getResultCodeDropdowns.calls.reset();


      mockDialogSpy.open.calls.reset();


      mockService.getTestIds.and.returnValue(of(mockTestIds));


      mockService.getTestDetails.and.returnValue(of(mockTestDetails));


      mockService.getFilterValues.and.returnValue(of(mockFilterDropdownOptions));


      mockService.getDonorTestResults.and.returnValue(of(mockDonorTestResultsResponse));


      mockService.saveBulkDonorTestResults.and.returnValue(of(mockBulkUpsertResult));


      mockService.getInterdictionDropdowns.and.returnValue(of(mockFilterDropdownOptions.interdictions));


    fixture = TestBed.createComponent(DonorTestsComponent);
    component = fixture.componentInstance;
    mockSnackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;


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
    }));
  });

  describe('Test ID Selection', () => {
    it('should load data and test details when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('ABID');
      tick();

      expect(mockService.getDonorTestResults).toHaveBeenCalled();
      expect(mockService.getTestDetails).toHaveBeenCalledWith('ABID');
      expect(component.dataSource).toEqual(mockDonorTestResults);
      expect(component.testDetails).toEqual(mockTestDetails);
    }));



    it('should update requestState.testId when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('ABID');
      tick();

      expect(component.requestState.testId).toBe('ABID');
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

      const callArgs = mockService.getDonorTestResults.calls.mostRecent().args[0];
      expect(callArgs.searchKeyword).toBe('POS');
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
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(mockService.getDonorTestResults).toHaveBeenCalled();
    }));

    it('should update requestState with filter values', fakeAsync(() => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.interdiction).toBe('D01');
    }));



    it('should preserve testId and searchKeyword when clearing filters', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';

      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
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
      expect(component.requestState.interdiction).toBeUndefined();
    }));



    it('should return false for hasActiveFilters when no filters are applied', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters()).toBe(false);
    });



    it('should preserve sort when clearing filters', fakeAsync(() => {
      component.requestState.sort = 'RESULT_CODE_ASC';

      component.clearAllFilters();
      tick();

      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
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

    it('should enter edit mode and auto-add row if dataSource is empty', () => {
      component.dataSource = [];
      component.onAddEditClick();

      expect(component.isEditMode).toBe(true);
      // When no data exists, component automatically adds a new blank row
      expect(component.editableRows.length).toBe(1);
      expect(component.editableRows[0].auditKey).toBe(0);
      expect(component.editableRows[0].resultCode).toBe('');
    });

    it('should convert dataSource to editableRows correctly', () => {
      component.onAddEditClick();

      expect(component.editableRows[0].resultCode).toBe('POS');
      expect(component.editableRows[0].interdiction1).toBe('D01');
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









    it('should load interdiction options when entering edit mode', fakeAsync(() => {
      component.onAddEditClick();
      tick();

      expect(mockService.getInterdictionDropdowns).toHaveBeenCalled();
      expect(component.interdictionOptions.length).toBe(2);
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

    it('should detect validation errors for empty resultCode', () => {
      const row = component.editableRows[0];
      row.resultCode = '';

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['resultCode']).toBeDefined();
    });

    it('should detect validation errors for missing effectiveDate on new rows', () => {
      const row = component.editableRows[0];
      row.auditKey = 0; // New row
      row.effectiveDate = null;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['effectiveDate']).toBeDefined();
    });

    it('should validate date range correctly', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.effectiveDate = new Date('2099-12-31');
      row.terminationDate = new Date('2099-06-01');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['terminationDate']).toContain('cannot be before Effective Date');
    });



    it('should pass validation when termination date is null', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.effectiveDate = new Date('2024-01-01');
      row.terminationDate = null;

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
      // Row 0 is dirty with invalid data
      component.editableRows[0].resultCode = '';
      component.dirtyRowIds.add(0);

      // Row 1 is NOT dirty but has invalid data (should be skipped)
      component.editableRows[1].resultCode = '';
      // Not adding to dirtyRowIds

      const isValid = component['validateAllRows']();

      // Should fail because row 0 (dirty) is invalid
      expect(isValid).toBe(false);
      expect(component.editableRows[0].errors?.['resultCode']).toBeDefined();
      // Row 1 should NOT be validated (errors property not set)
      expect(component.editableRows[1].errors).toBeUndefined();
    });

    it('should pass validation when non-dirty rows have past termination dates', () => {
      // Row 0 is dirty with valid data
      component.editableRows[0].resultCode = 'VALID';
      component.editableRows[0].effectiveDate = new Date('2024-01-01');
      component.editableRows[0].terminationDate = new Date('2099-12-31');
      component.dirtyRowIds.add(0);

      // Row 1 is NOT dirty but has past termination date (should be skipped)
      component.editableRows[1].resultCode = 'OLD';
      component.editableRows[1].effectiveDate = new Date('2020-01-01');
      component.editableRows[1].terminationDate = new Date('2020-12-31'); // Past date
      // Not adding to dirtyRowIds - this row is untouched

      const isValid = component['validateAllRows']();

      // Should pass because only dirty row 0 is validated and it's valid
      expect(isValid).toBe(true);
    });

    it('should fail validation when dirty row has past termination date', () => {
      // Row 0 is dirty with past termination date
      component.editableRows[0].resultCode = 'UPDATED';
      component.editableRows[0].effectiveDate = new Date('2020-01-01');
      component.editableRows[0].terminationDate = new Date('2020-12-31'); // Past date
      component.dirtyRowIds.add(0);

      const isValid = component['validateAllRows']();

      // Should fail because dirty row has past termination date
      expect(isValid).toBe(false);
      expect(component.editableRows[0].errors?.['terminationDate']).toBeDefined();
    });
  });

  describe('onSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      mockSnackbarService.showSuccess.calls.reset();
      mockSnackbarService.showError.calls.reset();
    }));

    it('should save changes successfully', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockService.saveBulkDonorTestResults).toHaveBeenCalledWith('ABID', jasmine.any(Object));
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

      expect(mockService.saveBulkDonorTestResults).not.toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('validation errors')
      );
    }));

    it('should not save if no changes', fakeAsync(() => {
      component.dirtyRowIds.clear();

      component.onSave();
      tick();

      expect(mockService.saveBulkDonorTestResults).not.toHaveBeenCalled();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('No changes to save');
    }));



    it('should pass testId as first argument to saveBulkDonorTestResults', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      expect(mockService.saveBulkDonorTestResults.calls.mostRecent().args[0]).toBe('ABID');
    }));

    it('should format EffectiveDate as YYYY-MM-DD string', fakeAsync(() => {
      component.onRowFieldChange(0, 'effectiveDate', new Date('2025-03-15'));

      component.onSave();
      tick();

      const dto = mockService.saveBulkDonorTestResults.calls.mostRecent().args[1];
      expect(dto.Records[0].EffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));




  });


  describe('formatDate', () => {
    it('should format date correctly in DD-MMM-YYYY format', () => {
      const result = component.formatDate(new Date('2025-01-15'));
      expect(result).toMatch(/15-JAN-2025/);
    });





    it('should handle string dates', () => {
      const result = component.formatDate('2024-06-15T00:00:00Z');
      expect(result).toMatch(/15-JUN-2024/);
    });
  });

  describe('Date Input Template Attributes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      fixture.detectChanges();
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
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      component.clearAllFilters();
      tick();

      expect(component.requestState.interdiction).toBeUndefined();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.testId).toBe('ABID');
    }));
  });

  describe('formatYesNo', () => {
    it('should return "Yes" for "Y"', () => {
      expect(component.formatYesNo('Y')).toBe('Yes');
    });

    it('should return "No" for "N"', () => {
      expect(component.formatYesNo('N')).toBe('No');
    });

    it('should return "-" for null', () => {
      expect(component.formatYesNo(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatYesNo(undefined)).toBe('-');
    });

    it('should return the value itself for non-Y/N strings', () => {
      expect(component.formatYesNo('X')).toBe('X');
    });

    it('should be case insensitive', () => {
      expect(component.formatYesNo('y')).toBe('Yes');
      expect(component.formatYesNo('n')).toBe('No');
    });
  });

  describe('formatTestIdDisplay', () => {
    it('should return testId with description when description exists', () => {
      const option: TestIdOption = { testId: 'ABID', description: 'ABO Test' };
      expect(component.formatTestIdDisplay(option)).toBe('ABID - ABO Test');
    });

    it('should return just testId when description is empty', () => {
      const option: TestIdOption = { testId: 'ABID', description: '' };
      expect(component.formatTestIdDisplay(option)).toBe('ABID');
    });

    it('should return just testId when description is whitespace only', () => {
      const option: TestIdOption = { testId: 'ABID', description: '   ' };
      expect(component.formatTestIdDisplay(option)).toBe('ABID');
    });

    it('should return just testId when description is undefined', () => {
      const option: TestIdOption = { testId: 'ABID' };
      expect(component.formatTestIdDisplay(option)).toBe('ABID');
    });
  });

  describe('formatDate edge cases', () => {
    it('should return "-" for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should filter dataSource by resultCode when search text is provided', () => {
      component.allLoadedData = [...mockDonorTestResults];
      component.onSearch('POS');

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].resultCode).toBe('POS');
    });

    it('should restore all data when search text is empty', () => {
      component.allLoadedData = [...mockDonorTestResults];
      component.onSearch('');

      expect(component.dataSource.length).toBe(mockDonorTestResults.length);
    });

    it('should be case insensitive', () => {
      component.allLoadedData = [...mockDonorTestResults];
      component.onSearch('pos');

      expect(component.dataSource.length).toBe(1);
      expect(component.dataSource[0].resultCode).toBe('POS');
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

    it('should not delete if only one row remains', () => {
      component.editableRows = [component.editableRows[0]];
      component.onDeleteRow(0);

      expect(component.editableRows.length).toBe(1);
    });

    it('should delete a row and re-index dirty rows', () => {
      component.dirtyRowIds.add(0);
      component.dirtyRowIds.add(1);

      component.onDeleteRow(0);

      expect(component.editableRows.length).toBe(1);
      expect(component.dirtyRowIds.has(0)).toBe(true); // was index 1
      expect(component.dirtyRowIds.has(1)).toBe(false);
    });

    it('should keep indices below deleted row unchanged', () => {
      // Add a third row
      component.onAddNewRow();
      component.dirtyRowIds.clear();
      component.dirtyRowIds.add(0);
      component.dirtyRowIds.add(2);

      // Delete middle row (index 1)
      component.onDeleteRow(1);

      expect(component.dirtyRowIds.has(0)).toBe(true);
      expect(component.dirtyRowIds.has(1)).toBe(true); // was 2
    });
  });

  describe('Dropdown operations', () => {
    it('should track dropdown open state', () => {
      component.onDropdownOpened(0, 'resultCode', true);
      expect(component.openDropdown).toEqual({ row: 0, col: 'resultCode' });
    });

    it('should clear dropdown state when closed', () => {
      component.onDropdownOpened(0, 'resultCode', false);
      expect(component.openDropdown).toBeNull();
    });

    it('should return true for isDropdownOpen when matching row and col', () => {
      component.openDropdown = { row: 1, col: 'interdiction1' };
      expect(component.isDropdownOpen(1, 'interdiction1')).toBe(true);
    });

    it('should return false for isDropdownOpen when not matching', () => {
      component.openDropdown = { row: 1, col: 'interdiction1' };
      expect(component.isDropdownOpen(0, 'interdiction1')).toBe(false);
      expect(component.isDropdownOpen(1, 'resultCode')).toBe(false);
    });

    it('should return false for isDropdownOpen when no dropdown is open', () => {
      component.openDropdown = null;
      expect(component.isDropdownOpen(0, 'resultCode')).toBe(false);
    });

    it('should reset result code search when dropdown closes', () => {
      component.resultCodeOptions = [{ value: 'POS', display: 'POS' }];
      component.filteredResultCodeOptions = [];

      component.onResultCodeDropdownOpenChange(false);

      expect(component.filteredResultCodeOptions).toEqual(component.resultCodeOptions);
    });

    it('should not reset result code search when dropdown opens', () => {
      component.filteredResultCodeOptions = [];
      component.onResultCodeDropdownOpenChange(true);

      expect(component.filteredResultCodeOptions).toEqual([]);
    });

    it('should reset interdiction search when dropdown closes', () => {
      component.interdictionOptions = [{ value: 'D01', display: 'D01' }];
      component.filteredInterdictionOptions = [];

      component.onInterdictionDropdownOpenChange(false);

      expect(component.filteredInterdictionOptions).toEqual(component.interdictionOptions);
    });

    it('should not reset interdiction search when dropdown opens', () => {
      component.filteredInterdictionOptions = [];
      component.onInterdictionDropdownOpenChange(true);

      expect(component.filteredInterdictionOptions).toEqual([]);
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

    it('should return false when no new rows exist', () => {
      expect(component.hasNewRows()).toBe(false);
    });

    it('should return true when new rows exist', () => {
      component.onAddNewRow();
      expect(component.hasNewRows()).toBe(true);
    });
  });

  describe('onRowFieldChange edge cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set effectiveDate when field is effectiveDate', () => {
      const date = new Date('2025-06-01');
      component.onRowFieldChange(0, 'effectiveDate', date);

      expect(component.editableRows[0].effectiveDate).toEqual(date);
    });

    it('should set terminationDate when field is terminationDate', () => {
      const date = new Date('2025-12-31');
      component.onRowFieldChange(0, 'terminationDate', date);

      expect(component.editableRows[0].terminationDate).toEqual(date);
    });

    it('should set arbitrary field via dynamic property', () => {
      component.onRowFieldChange(0, 'interdiction1', 'D02');

      expect(component.editableRows[0].interdiction1).toBe('D02');
    });

    it('should clear existing error for field on change', () => {
      component.editableRows[0].errors = { resultCode: 'Required' };

      component.onRowFieldChange(0, 'resultCode', 'POS');

      expect(component.editableRows[0].errors?.['resultCode']).toBeUndefined();
    });

    it('should validate resultCode immediately on change - triggers error for empty', () => {
      component.onRowFieldChange(0, 'resultCode', '');

      expect(component.editableRows[0].errors?.['resultCode']).toBeDefined();
    });

    it('should validate resultCode immediately on change - triggers error for dash', () => {
      component.onRowFieldChange(0, 'resultCode', '-');

      expect(component.editableRows[0].errors?.['resultCode']).toBeDefined();
    });
  });

  describe('onDateInputBlur', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should set required error for empty effectiveDate on new row', () => {
      component.editableRows[0].auditKey = 0;
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      expect(component.editableRows[0].errors?.['effectiveDate']).toContain('required');
    });

    it('should clear error for empty optional terminationDate', () => {
      component.editableRows[0].errors = { terminationDate: 'some error' };
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'terminationDate', event);

      expect(component.editableRows[0].errors?.['terminationDate']).toBeUndefined();
      expect(component.editableRows[0].terminationDate).toBeNull();
    });

    it('should validate existing Date object on blur', () => {
      component.editableRows[0].effectiveDate = new Date('2099-06-15');
      component.editableRows[0].auditKey = 0;
      const event = { target: { value: '15-JUN-2099' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      // Should not have errors since date is valid and in future
      expect(component.editableRows[0].errors?.['effectiveDate']).toBeUndefined();
    });

    it('should set invalid format error for unparsable date', () => {
      component.editableRows[0].effectiveDate = null;
      const event = { target: { value: 'not-a-date' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      expect(component.editableRows[0].errors?.['effectiveDate']).toContain('Invalid date format');
    });

    it('should parse valid MMDDYYYY input and mark row dirty', () => {
      component.editableRows[0].effectiveDate = null;
      component.editableRows[0].auditKey = 0;
      const event = { target: { value: '06152099' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      expect(component.editableRows[0].effectiveDate).toBeTruthy();
      expect(component.editableRows[0].isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    });

    it('should parse MM/DD/YYYY input', () => {
      component.editableRows[0].effectiveDate = null;
      component.editableRows[0].auditKey = 0;
      const event = { target: { value: '06/15/2099' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      expect(component.editableRows[0].effectiveDate).toBeTruthy();
    });

    it('should clear error for empty effective date on existing row', () => {
      component.editableRows[0].auditKey = 5;
      component.editableRows[0].errors = { effectiveDate: 'some error' };
      const event = { target: { value: '' } };

      component.onDateInputBlur(0, 'effectiveDate', event);

      expect(component.editableRows[0].errors?.['effectiveDate']).toBeUndefined();
      expect(component.editableRows[0].effectiveDate).toBeNull();
    });
  });

  describe('getDateFieldError', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should return matDatepickerParse error message', () => {
      const mockNgModel = { errors: { matDatepickerParse: true } } as any;
      const row = component.editableRows[0];

      const result = component.getDateFieldError(row, 'effectiveDate', mockNgModel);

      expect(result).toContain('Invalid date format');
    });

    it('should return invalidDateFormat error message', () => {
      const mockNgModel = { errors: { invalidDateFormat: true } } as any;
      const row = component.editableRows[0];

      const result = component.getDateFieldError(row, 'effectiveDate', mockNgModel);

      expect(result).toContain('Invalid date');
    });

    it('should return custom row error when no NgModel errors', () => {
      const mockNgModel = { errors: null } as any;
      const row = component.editableRows[0];
      row.errors = { effectiveDate: 'Custom error message' };

      const result = component.getDateFieldError(row, 'effectiveDate', mockNgModel);

      expect(result).toBe('Custom error message');
    });

    it('should return empty string when no errors exist', () => {
      const mockNgModel = { errors: null } as any;
      const row = component.editableRows[0];
      row.errors = {};

      const result = component.getDateFieldError(row, 'effectiveDate', mockNgModel);

      expect(result).toBe('');
    });
  });

  describe('effDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.effDateFilter(null)).toBe(true);
    });

    it('should return true for date on or after chapter local date', () => {
      const futureDate = new Date('2099-01-01');
      expect(component.effDateFilter(futureDate)).toBe(true);
    });

    it('should return false for date before chapter local date', () => {
      const pastDate = new Date('2000-01-01');
      expect(component.effDateFilter(pastDate)).toBe(false);
    });
  });

  describe('getTerminationMinDate', () => {
    it('should return chapter local date when no effectiveDate', () => {
      const row = { effectiveDate: null } as any;
      const result = component.getTerminationMinDate(row);

      expect(result).toBeInstanceOf(Date);
    });

    it('should return effectiveDate when it is after chapter local date', () => {
      const futureDate = new Date('2099-06-15');
      const row = { effectiveDate: futureDate } as any;
      const result = component.getTerminationMinDate(row);

      // The result should be >= the future effective date
      expect(result.getFullYear()).toBe(2099);
    });

    it('should return chapter local date when effectiveDate is in the past', () => {
      const pastDate = new Date('2000-01-01');
      const row = { effectiveDate: pastDate } as any;
      const result = component.getTerminationMinDate(row);

      // Should return chapter local date (today or later), not the past effective date
      expect(result.getFullYear()).toBeGreaterThanOrEqual(new Date().getFullYear() - 1);
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

    it('should cache filter function for same row', () => {
      const row = component.editableRows[0];
      const filter1 = component.getTermDateFilter(row);
      const filter2 = component.getTermDateFilter(row);

      expect(filter1).toBe(filter2);
    });

    it('should allow null date', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);

      expect(filter(null)).toBe(true);
    });

    it('should reject past dates', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);

      expect(filter(new Date('2000-01-01'))).toBe(false);
    });

    it('should accept future dates', () => {
      const row = component.editableRows[0];
      const filter = component.getTermDateFilter(row);

      expect(filter(new Date('2099-01-01'))).toBe(true);
    });

    it('should reject dates before effective date when effective date is future', () => {
      const row = component.editableRows[0];
      row.effectiveDate = new Date('2098-06-01');

      // Clear cache to force new filter creation
      component['termDateFilterCache'].clear();

      const filter = component.getTermDateFilter(row);

      // Dates before the effective date should be rejected
      expect(filter(new Date('2098-01-01'))).toBe(false);
    });

    it('should use chapter local date when no effective date set', () => {
      const row = component.editableRows[0];
      row.effectiveDate = null;

      component['termDateFilterCache'].clear();

      const filter = component.getTermDateFilter(row);

      expect(filter(new Date('2000-01-01'))).toBe(false);
      expect(filter(new Date('2099-01-01'))).toBe(true);
    });
  });

  describe('onAddNewTest', () => {
    it('should open dialog with add mode', fakeAsync(() => {
      component.onAddNewTest();
      tick();

      expect(mockDialogSpy.open).toHaveBeenCalled();
      const dialogData = mockDialogSpy.open.calls.mostRecent().args[1];
      expect(dialogData.data.mode).toBe('add');
    }));

    it('should reload test IDs when dialog returns success', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));
      mockDialogSpy.open.and.returnValue(dialogRefSpy);

      component.ngOnInit();
      tick();
      mockService.getTestIds.calls.reset();

      component.onAddNewTest();
      tick();

      expect(mockService.getTestIds).toHaveBeenCalled();
    }));

    it('should not reload test IDs when dialog returns null', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialogSpy.open.and.returnValue(dialogRefSpy);

      component.ngOnInit();
      tick();
      mockService.getTestIds.calls.reset();

      component.onAddNewTest();
      tick();

      expect(mockService.getTestIds).not.toHaveBeenCalled();
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

      expect(mockDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open dialog with edit mode and test details', fakeAsync(() => {
      component.onEditTestDetails();
      tick();

      expect(mockDialogSpy.open).toHaveBeenCalled();
      const dialogData = mockDialogSpy.open.calls.mostRecent().args[1];
      expect(dialogData.data.mode).toBe('edit');
      expect(dialogData.data.description).toBe('ABO/RH Blood Typing');
    }));

    it('should reload test details when dialog returns success', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true }));
      mockDialogSpy.open.and.returnValue(dialogRefSpy);

      mockService.getTestDetails.calls.reset();
      component.onEditTestDetails();
      tick();

      expect(mockService.getTestDetails).toHaveBeenCalledWith('ABID');
    }));
  });

  describe('loadData edge cases', () => {
    it('should not load data when no testId in requestState', () => {
      component.requestState = {};
      mockService.getDonorTestResults.calls.reset();

      component.loadData();

      expect(mockService.getDonorTestResults).not.toHaveBeenCalled();
    });

    it('should set hasError on load failure', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      mockService.getDonorTestResults.and.returnValue(throwError(() => new Error('fail')));
      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('Failed to load');
    }));
  });

  describe('onSave edge cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();
      mockSnackbarService.showSuccess.calls.reset();
      mockSnackbarService.showError.calls.reset();
    }));

    it('should show error when testId is null', fakeAsync(() => {
      component.testIdControl.setValue(null, { emitEvent: false });
      tick();

      component.onSave();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Test ID is required');
    }));

    it('should handle save API error', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');
      mockService.saveBulkDonorTestResults.and.returnValue(throwError(() => new Error('save fail')));

      component.onSave();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('should include auditKey for existing records', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');

      component.onSave();
      tick();

      const dto = mockService.saveBulkDonorTestResults.calls.mostRecent().args[1];
      const existingRecord = dto.Records.find((r: any) => r.auditKey);
      expect(existingRecord).toBeTruthy();
      expect(existingRecord.auditKey).toBeGreaterThan(0);
    }));

    it('should not include auditKey for new records', fakeAsync(() => {
      component.onAddNewRow();
      component.editableRows[0].resultCode = 'NEW';
      component.editableRows[0].effectiveDate = new Date('2099-01-01');
      component.dirtyRowIds.add(0);

      component.onSave();
      tick();

      const dto = mockService.saveBulkDonorTestResults.calls.mostRecent().args[1];
      const newRecord = dto.Records.find((r: any) => r.ResultCode === 'NEW');
      expect(newRecord).toBeTruthy();
      expect(newRecord.auditKey).toBeUndefined();
    }));

    it('should set showValidationBanner to true on validation failure', fakeAsync(() => {
      component.editableRows[0].resultCode = '';
      component.dirtyRowIds.add(0);

      component.onSave();
      tick();

      expect(component.showValidationBanner).toBe(true);
    }));

    it('should format TerminationDate when present', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');
      component.onRowFieldChange(0, 'terminationDate', new Date('2099-12-31'));

      component.onSave();
      tick();

      const dto = mockService.saveBulkDonorTestResults.calls.mostRecent().args[1];
      const record = dto.Records[0];
      expect(record.TerminationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));

    it('should set TerminationDate to null when not present', fakeAsync(() => {
      component.onRowFieldChange(0, 'resultCode', 'UPD');
      component.editableRows[0].terminationDate = null;

      component.onSave();
      tick();

      const dto = mockService.saveBulkDonorTestResults.calls.mostRecent().args[1];
      const record = dto.Records[0];
      expect(record.TerminationDate).toBeNull();
    }));
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should remove filter and reload data', fakeAsync(() => {
      const filters: DonorTestResultFilterValue = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);
      tick();
      mockService.getDonorTestResults.calls.reset();

      component.onRemoveFilterChip('interdiction');
      tick();

      expect(mockService.getDonorTestResults).toHaveBeenCalled();
    }));
  });

  describe('Error handling for API calls', () => {
    it('should show error on getTestIds failure', fakeAsync(() => {
      mockService.getTestIds.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load test IDs'));
    }));

    it('should show error on getTestDetails failure', fakeAsync(() => {
      component.ngOnInit();
      tick();
      mockService.getTestDetails.and.returnValue(throwError(() => new Error('fail')));

      component.testIdControl.setValue('ABID');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load test details'));
    }));

    it('should show error on getInterdictionDropdowns failure', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      mockService.getInterdictionDropdowns.and.returnValue(throwError(() => new Error('fail')));
      component.onAddEditClick();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load interdiction'));
    }));

    it('should show error on getResultCodeDropdowns failure', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      mockService.getResultCodeDropdowns.and.returnValue(throwError(() => new Error('fail')));
      component.onAddEditClick();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load result code'));
    }));
  });

  describe('Test ID selection edge cases', () => {
    it('should clear data when test ID is set to empty', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      component.testIdControl.setValue('');
      tick();

      expect(component.testDetails).toBeNull();
      expect(component.dataSource.length).toBe(0);
      expect(component.requestState.testId).toBeUndefined();
    }));
  });

  describe('updateRequestStateFromFilters', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
    }));

    it('should preserve testId, searchKeyword, and sort when filters are null', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';
      component.requestState.sort = 'RESULT_CODE_ASC';
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.testId).toBe('ABID');
      expect(component.requestState.searchKeyword).toBe('POS');
      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
      expect(component.requestState.interdiction).toBeUndefined();
    }));

    it('should include filter values in requestState when filters exist', fakeAsync(() => {
      component.requestState.sort = 'RESULT_CODE_ASC';
      component.appliedFilters = {
        interdiction: 'D01',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2025-12-31')
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.interdiction).toBe('D01');
      expect(component.requestState.effectiveDatePeriod).toBe('After');
      expect(component.requestState.terminationDatePeriod).toBe('Before');
      expect(component.requestState.sort).toBe('RESULT_CODE_ASC');
    }));
  });

  describe('onCancelEdit resets', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should clear termDateFilterCache on cancel', () => {
      component['termDateFilterCache'].set(0, () => true);
      component.onCancelEdit();

      expect(component['termDateFilterCache'].size).toBe(0);
    });

    it('should reset showValidationBanner on cancel', () => {
      component.showValidationBanner = true;
      component.onCancelEdit();

      expect(component.showValidationBanner).toBe(false);
    });
  });

  describe('validateRow - resultCode as dash', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
    }));

    it('should reject resultCode that is just a dash', () => {
      const row = component.editableRows[0];
      row.resultCode = '-';

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['resultCode']).toBeDefined();
    });

    it('should validate termDate before chapter local date with effectiveDate present', () => {
      const row = component.editableRows[0];
      row.resultCode = 'POS';
      row.effectiveDate = new Date('2020-01-01');
      row.terminationDate = new Date('2020-06-01'); // past date

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
    });
  });

  describe('parseManualDateInput', () => {
    it('should return null for empty input', () => {
      expect(component['parseManualDateInput']('')).toBeNull();
    });

    it('should parse MMDDYYYY format', () => {
      const result = component['parseManualDateInput']('06152025');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(5); // June is 5 (0-indexed)
      expect(result!.getDate()).toBe(15);
      expect(result!.getFullYear()).toBe(2025);
    });

    it('should parse MM/DD/YYYY format', () => {
      const result = component['parseManualDateInput']('06/15/2025');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2025);
    });

    it('should parse MM-DD-YYYY format', () => {
      const result = component['parseManualDateInput']('06-15-2025');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle 2-digit year less than 50', () => {
      const result = component['parseManualDateInput']('06/15/25');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2025);
    });

    it('should handle 2-digit year 50 or greater', () => {
      const result = component['parseManualDateInput']('06/15/99');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(1999);
    });

    it('should return null for invalid month', () => {
      expect(component['parseManualDateInput']('13152025')).toBeNull();
    });

    it('should return null for invalid day like Feb 30', () => {
      expect(component['parseManualDateInput']('02302025')).toBeNull();
    });

    it('should return null for non-numeric non-separator input', () => {
      expect(component['parseManualDateInput']('abc')).toBeNull();
    });

    it('should return null for incomplete separator format', () => {
      expect(component['parseManualDateInput']('06/15')).toBeNull();
    });

    it('should return null for year out of range', () => {
      expect(component['parseManualDateInput']('06/15/2200')).toBeNull();
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

    it('should set error for missing effectiveDate on new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effectiveDate = null;

      component['validateDateField'](row, 'effectiveDate');

      expect(row.errors?.['effectiveDate']).toContain('required');
    });

    it('should set error for past effectiveDate on new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effectiveDate = new Date('2000-01-01');

      component['validateDateField'](row, 'effectiveDate');

      expect(row.errors?.['effectiveDate']).toContain('cannot be before');
    });

    it('should clear error for valid future effectiveDate on new row', () => {
      const row = component.editableRows[0];
      row.auditKey = 0;
      row.effectiveDate = new Date('2099-01-01');
      row.errors = { effectiveDate: 'old error' };

      component['validateDateField'](row, 'effectiveDate');

      expect(row.errors?.['effectiveDate']).toBeUndefined();
    });

    it('should set error when termination date is before effective date', () => {
      const row = component.editableRows[0];
      row.effectiveDate = new Date('2099-06-01');
      row.terminationDate = new Date('2099-01-01');

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toContain('cannot be before Effective Date');
    });

    it('should set error when termination date is before chapter local date', () => {
      const row = component.editableRows[0];
      row.effectiveDate = new Date('2020-01-01');
      row.terminationDate = new Date('2020-06-01');

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toBeDefined();
    });

    it('should clear error for valid termination date', () => {
      const row = component.editableRows[0];
      row.effectiveDate = new Date('2099-01-01');
      row.terminationDate = new Date('2099-12-31');
      row.errors = { terminationDate: 'old error' };

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toBeUndefined();
    });

    it('should clear error when terminationDate is null', () => {
      const row = component.editableRows[0];
      row.terminationDate = null;
      row.errors = { terminationDate: 'old error' };

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toBeUndefined();
    });

    it('should validate termination date without effective date against chapter local date', () => {
      const row = component.editableRows[0];
      row.effectiveDate = null;
      row.terminationDate = new Date('2000-01-01');

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toBeDefined();
    });

    it('should clear error for valid termination date without effective date', () => {
      const row = component.editableRows[0];
      row.effectiveDate = null;
      row.terminationDate = new Date('2099-01-01');
      row.errors = { terminationDate: 'old error' };

      component['validateDateField'](row, 'terminationDate');

      expect(row.errors?.['terminationDate']).toBeUndefined();
    });
  });

  describe('minDate getter', () => {
    it('should return a Date object', () => {
      const result = component.minDate;
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('chapterLocalDateAsDate getter', () => {
    it('should return a Date object', () => {
      const result = component.chapterLocalDateAsDate;
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('chapterLocalDateFormatted getter', () => {
    it('should return a formatted string', () => {
      const result = component.chapterLocalDateFormatted;
      expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('formatDateForApi', () => {
    it('should format Date to YYYY-MM-DD', () => {
      const result = component['formatDateForApi'](new Date(2025, 2, 15));
      expect(result).toBe('2025-03-15');
    });
  });

  describe('onAddNewRow with no test ID', () => {
    it('should not add row if testIdControl has no value', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue(null, { emitEvent: false });
      tick();
      component.editableRows = [];

      component.onAddNewRow();

      expect(component.editableRows.length).toBe(0);
    }));
  });

  describe('hasActiveFilters with active filter', () => {
    it('should return true when interdiction filter is active', () => {
      component.appliedFilters = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset all state when chapter changes', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();

      // Set up some state
      component.appliedFilters = {
        interdiction: 'D01',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'interdiction', label: 'D01' }];
      component.dataSource = [...mockDonorTestResults];
      component.allLoadedData = [...mockDonorTestResults];
      mockService.getTestIds.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(component.testDetails).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.dataSource.length).toBe(0);
      expect(component.allLoadedData.length).toBe(0);
      expect(component.requestState).toEqual({});
      expect(mockService.getTestIds).toHaveBeenCalled();
    }));

    it('should exit edit mode when chapter changes during edit', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('ABID');
      tick();
      component.onAddEditClick();
      tick();

      expect(component.isEditMode).toBe(true);

      chapterChangedSubject.next();
      tick();

      expect(component.isEditMode).toBe(false);
      expect(component.showValidationBanner).toBe(false);
      expect(component.editableRows.length).toBe(0);
      expect(component.dirtyRowIds.size).toBe(0);
    }));

    it('should close overlay when chapter changes with overlay open', fakeAsync(() => {
      component.ngOnInit();
      tick();

      // Simulate an open overlay
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChangedSubject.next();
      tick();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    }));
  });

  describe('setupTestIdSearch', () => {
    it('should filter test IDs when search text has 1+ chars', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('AB');
      tick(300); // debounceTime

      const options = component.testIdOptions();
      expect(options.length).toBeLessThanOrEqual(mockTestIds.length);
      expect(options.every(o => o.testId.toLowerCase().includes('ab'))).toBe(true);
    }));

    it('should restore all test IDs when search text is empty', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('AB');
      tick(300);

      component.testIdSearchControl.setValue('');
      tick(300);

      expect(component.testIdOptions().length).toBe(mockTestIds.length);
    }));

    it('should filter by description as well', fakeAsync(() => {
      const testIdsWithDesc = [
        { testId: 'ABID', description: 'ABO Blood Typing' },
        { testId: 'HBSAG', description: 'Hepatitis B' }
      ];
      mockService.getTestIds.and.returnValue(of(testIdsWithDesc));
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('hepatitis');
      tick(300);

      const options = component.testIdOptions();
      expect(options.length).toBe(1);
      expect(options[0].testId).toBe('HBSAG');
    }));
  });

  describe('setupResultCodeSearch', () => {
    it('should filter result code options when search text provided', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.resultCodeOptions = [
        { value: 'POS', display: 'POS - Positive' },
        { value: 'NEG', display: 'NEG - Negative' }
      ];
      component.filteredResultCodeOptions = [...component.resultCodeOptions];

      component.resultCodeSearchControl.setValue('pos');
      tick(300);

      expect(component.filteredResultCodeOptions.length).toBe(1);
      expect(component.filteredResultCodeOptions[0].value).toBe('POS');
    }));

    it('should restore all result code options when search text is empty', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.resultCodeOptions = [
        { value: 'POS', display: 'POS - Positive' },
        { value: 'NEG', display: 'NEG - Negative' }
      ];

      component.resultCodeSearchControl.setValue('pos');
      tick(300);
      component.resultCodeSearchControl.setValue('');
      tick(300);

      expect(component.filteredResultCodeOptions.length).toBe(2);
    }));
  });

  describe('setupInterdictionSearch', () => {
    it('should filter interdiction options when search text provided', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.interdictionOptions = [
        { value: 'D01', display: 'D01' },
        { value: 'D02', display: 'D02' }
      ];
      component.filteredInterdictionOptions = [...component.interdictionOptions];

      component.interdictionSearchControl.setValue('D01');
      tick(300);

      expect(component.filteredInterdictionOptions.length).toBe(1);
      expect(component.filteredInterdictionOptions[0].value).toBe('D01');
    }));

    it('should restore all interdiction options when search text is empty', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.interdictionOptions = [
        { value: 'D01', display: 'D01' },
        { value: 'D02', display: 'D02' }
      ];

      component.interdictionSearchControl.setValue('D01');
      tick(300);
      component.interdictionSearchControl.setValue('');
      tick(300);

      expect(component.filteredInterdictionOptions.length).toBe(2);
    }));
  });

  describe('DonorTestsDateAdapter via DateAdapter token', () => {
    let dateAdapter: DateAdapter<Date>;

    beforeEach(() => {
      dateAdapter = fixture.debugElement.injector.get(DateAdapter);
    });

    it('should return a valid today() date', () => {
      const today = dateAdapter.today();
      expect(today).toBeInstanceOf(Date);
      expect(today.getFullYear()).toBeGreaterThanOrEqual(2024);
    });

    it('should format date in DD-MMM-YYYY', () => {
      const date = new Date(2025, 2, 15); // March 15, 2025
      const result = dateAdapter.format(date, 'input');
      expect(result).toBe('15-MAR-2025');
    });

    it('should format date for month/year header with MMM YYYY', () => {
      const date = new Date(2025, 2, 15);
      const result = dateAdapter.format(date, 'MMM YYYY');
      expect(result).toBe('MAR 2025');
    });

    it('should format date for monthYear display format', () => {
      const date = new Date(2025, 0, 1);
      const result = dateAdapter.format(date, 'monthYear');
      expect(result).toBe('JAN 2025');
    });

    it('should parse DD-MMM-YYYY format', () => {
      const result = dateAdapter.parse('20-MAR-2026', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(20);
      expect(result!.getMonth()).toBe(2); // March
      expect(result!.getFullYear()).toBe(2026);
    });

    it('should parse MMDDYYYY format (8 digits)', () => {
      const result = dateAdapter.parse('04182026', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(3); // April
      expect(result!.getDate()).toBe(18);
    });

    it('should parse MM/DD/YYYY format', () => {
      const result = dateAdapter.parse('04/18/2026', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(3);
    });

    it('should parse MM-DD-YYYY format', () => {
      const result = dateAdapter.parse('04-18-2026', 'input');
      expect(result).toBeInstanceOf(Date);
    });

    it('should parse YYYY-MM-DD ISO format', () => {
      const result = dateAdapter.parse('2026-04-18', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(3);
      expect(result!.getDate()).toBe(18);
    });

    it('should return null for empty string', () => {
      expect(dateAdapter.parse('', 'input')).toBeNull();
    });

    it('should return null for null', () => {
      expect(dateAdapter.parse(null, 'input')).toBeNull();
    });

    it('should return null for invalid string', () => {
      expect(dateAdapter.parse('not-a-date', 'input')).toBeNull();
    });

    it('should return null for non-string non-date value', () => {
      expect(dateAdapter.parse(12345, 'input')).toBeNull();
    });

    it('should handle Date object input directly', () => {
      const date = new Date(2026, 3, 18);
      const result = dateAdapter.parse(date, 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
    });

    it('should return null for invalid Date object', () => {
      const result = dateAdapter.parse(new Date('invalid'), 'input');
      expect(result).toBeNull();
    });

    it('should return null for invalid DD-MMM-YYYY like 32-JAN-2026', () => {
      const result = dateAdapter.parse('32-JAN-2026', 'input');
      expect(result).toBeNull();
    });

    it('should return null for invalid MMDDYYYY with bad month like 13012026', () => {
      const result = dateAdapter.parse('13012026', 'input');
      expect(result).toBeNull();
    });

    it('should parse case-insensitive DD-MMM-YYYY format', () => {
      const result = dateAdapter.parse('20-mar-2026', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(20);
    });

    it('should parse MM.DD.YYYY format', () => {
      const result = dateAdapter.parse('04.18.2026', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(3);
    });

    it('should parse YYYY/MM/DD format', () => {
      const result = dateAdapter.parse('2026/04/18', 'input');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2026);
    });
  });

  describe('ngOnDestroy with overlayRef', () => {
    it('should dispose overlayRef on destroy', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });
  });
});
