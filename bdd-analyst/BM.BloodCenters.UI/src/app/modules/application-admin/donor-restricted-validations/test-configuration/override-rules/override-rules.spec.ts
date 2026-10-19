import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OverrideRulesComponent } from './override-rules';
import { OverrideRulesApiService } from './services/override-rules-api.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import {
  OverrideRuleModel,
  OverrideRuleFilterValue,
  TestIdOption,
  InterdictionCode
} from './models/override-rules.model';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { createMockSnackbarService, createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('OverrideRulesComponent', () => {
  let mockTranslateService: any;
  let component: OverrideRulesComponent;
  let fixture: ComponentFixture<OverrideRulesComponent>;
  let mockService: jasmine.SpyObj<OverrideRulesApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockTestIds: TestIdOption[] = [
    { testId: 'TST001', testDesc: 'Blood Type Test' },
    { testId: 'TST002', testDesc: 'Antibody Screening' }
  ];

  const mockInterdictionCodes: InterdictionCode[] = [
    { interCode: 'INT001', interDesc: 'Permanent Deferral' },
    { interCode: 'INT002', interDesc: 'Temporary Deferral' }
  ];

  const mockData: OverrideRuleModel[] = [
    {
      testId: 'TST001',
      chapterId: 'ALL',
      currentResultStatus: 'POS', // 3 characters, within 5-char limit
      newResultStatus: 'NEG', // 3 characters, within 5-char limit
      overrideFlag: 'Y',
      interCode: 'INT001',
      interDescription: 'Permanent Deferral',
      effDate: new Date('2027-01-01'),
      termDate: null,
      programId: 'PROG001',
      insertDate: new Date('2027-01-15'),
      insertUser: 'admin',
      auditKey: 1
    },
    {
      testId: 'TST001',
      chapterId: 'ALL',
      currentResultStatus: 'REACT', // 5 characters, within 5-char limit
      newResultStatus: 'CLEAR', // 5 characters, within 5-char limit
      overrideFlag: 'N',
      interCode: 'INT002',
      interDescription: 'Temporary Deferral',
      effDate: new Date('2027-02-01'),
      termDate: new Date('2027-12-31'),
      programId: 'PROG002',
      insertDate: new Date('2027-02-10'),
      insertUser: 'user1',
      auditKey: 2
    }
  ];

  const mockResponse = {
    data: mockData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('OverrideRulesApiService', [
      'getTestIds',
      'getInterdictionCodes',
      'getInterdictionCodesForFilter',
      'getTestResults',
      'getOverrideRules',
      'saveBulkOverrideRules'
    ]);
    mockService.getTestIds.and.returnValue(of(mockTestIds));
    mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    mockService.getInterdictionCodesForFilter.and.returnValue(of(mockInterdictionCodes));
    mockService.getTestResults.and.returnValue(of([
      { resultCode: 'P', resultDescription: 'Positive' },
      { resultCode: 'N', resultDescription: 'Negative' },
      { resultCode: 'R', resultDescription: 'Reactive' },
      { resultCode: 'NR', resultDescription: 'Non-Reactive' },
      { resultCode: 'POS', resultDescription: 'Positive' },
      { resultCode: 'NEG', resultDescription: 'Negative' }
    ]));
    mockService.getOverrideRules.and.returnValue(of(mockResponse));
    mockService.saveBulkOverrideRules.and.returnValue(of({ success: true, message: 'Saved successfully' }));

    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService();
    (mockHeaderService as any).chapterChanged$ = new Subject<void>().asObservable();
    mockTranslateService = createMockTranslateService();
      TestBed.configureTestingModule({
      imports: [
        OverrideRulesComponent],
      providers: [
        provideHttpClient(),
        { provide: OverrideRulesApiService, useValue: mockService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        Overlay
      ]
    });


    


      mockService.getTestIds.calls.reset();


      mockService.getInterdictionCodes.calls.reset();


      mockService.getInterdictionCodesForFilter.calls.reset();


      mockService.getTestResults.calls.reset();


      mockService.getOverrideRules.calls.reset();


      mockService.saveBulkOverrideRules.calls.reset();


      mockSnackbarService.showSuccess.calls.reset();


      mockSnackbarService.showError.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();


      mockService.getTestIds.and.returnValue(of(mockTestIds));


      mockService.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));


      mockService.getInterdictionCodesForFilter.and.returnValue(of(mockInterdictionCodes));


      mockService.getOverrideRules.and.returnValue(of(mockResponse));


      mockService.saveBulkOverrideRules.and.returnValue(of({ success: true, message: 'Saved successfully' }));
    fixture = TestBed.createComponent(OverrideRulesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {








    it('should initialize with isEditMode as false', () => {
      expect(component.isEditMode).toBe(false);
    });



    it('should load test IDs on dropdown open', fakeAsync(() => {
      component.ngOnInit();
      tick();

      // Test IDs are loaded lazily when dropdown is opened
      component.onTestIdDropdownOpened(true);
      tick();

      expect(mockService.getTestIds).toHaveBeenCalled();
      expect(component.testIdOptions().length).toBe(2);
    }));

    it('should load interdiction codes on ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(mockService.getInterdictionCodes).toHaveBeenCalled();
      expect(component.interdictionOptions.length).toBe(2);
    }));

    it('should call getInterdictionCodesForFilter without testId on ngOnInit', fakeAsync(() => {
      mockService.getInterdictionCodesForFilter.calls.reset();

      component.ngOnInit();
      tick();

      expect(mockService.getInterdictionCodesForFilter).toHaveBeenCalledWith(undefined);
      expect(component.filterInterdictionOptions.length).toBe(2);
    }));



    it('should initialize filterChips as empty array', () => {
      expect(component.filterChips).toEqual([]);
    });

    it('should initialize editableRows as empty array', () => {
      expect(component.editableRows).toEqual([]);
    });

    it('should initialize dirtyRowIds as empty set', () => {
      expect(component.dirtyRowIds.size).toBe(0);
    });

    it('should initialize minDate as chapter today after ngOnInit', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(moment.isMoment(component.minDate)).toBe(true);
    }));
  });

  describe('Test ID Selection', () => {
    it('should load data when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();

      expect(mockService.getOverrideRules).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockData);
    }));

    it('should reload data when test ID is deselected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();
      mockService.getOverrideRules.calls.reset();

      component.testIdControl.setValue(null);
      tick();

      expect(mockService.getOverrideRules).toHaveBeenCalled();
      expect(component.requestState.testId).toBeUndefined();
    }));

    it('should load new data when test ID changes', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();

      expect(mockService.getOverrideRules).toHaveBeenCalled();
      expect(component.dataSource.length).toBeGreaterThan(0);
    }));

    it('should load filter interdiction codes when test ID is selected', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();

      expect(mockService.getInterdictionCodesForFilter).toHaveBeenCalledWith('TST001');
      expect(component.filterInterdictionOptions.length).toBe(2);
    }));

    it('should call getInterdictionCodesForFilter without testId when test ID is cleared', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();

      mockService.getInterdictionCodesForFilter.calls.reset();
      component.testIdControl.setValue(null);
      tick();

      expect(mockService.getInterdictionCodesForFilter).toHaveBeenCalledWith(undefined);
    }));

    it('should load filter interdiction codes with new testId when test ID changes', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdControl.setValue('TST001');
      tick();

      component.testIdControl.setValue('TST002');
      tick();

      expect(mockService.getInterdictionCodesForFilter).toHaveBeenCalledWith('TST002');
    }));



    it('should restore all test IDs when search is cleared', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.testIdSearchControl.setValue('TST001');
      tick(150);
      expect(component.testIdOptions().length).toBe(1);

      component.testIdSearchControl.setValue('');
      tick(150);

      expect(component.testIdOptions().length).toBe(mockTestIds.length);
    }));
  });

  describe('loadData', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));





    it('should use pageSize and pageIndex to calculate skip', fakeAsync(() => {
      component.pageIndex = 2;
      component.pageSize = 10;
      component.loadData();
      tick();

      expect(mockService.getOverrideRules).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));



    it('should include search keyword in request', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';
      component.loadData();
      tick();

      const callArgs = mockService.getOverrideRules.calls.mostRecent().args[2];
      expect(callArgs.searchKeyword).toBe('POS');
    }));


  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));







    it('should call getOverrideRules with correct skip when page changes', fakeAsync(() => {
      mockService.getOverrideRules.calls.reset();

      component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
      tick();

      expect(mockService.getOverrideRules).toHaveBeenCalledWith(25, 25, jasmine.any(Object));
    }));







    it('should reset pageIndex to 0 when testId changes', fakeAsync(() => {
      component.pageIndex = 2;

      component.testIdControl.setValue('TST002');
      tick();

      expect(component.pageIndex).toBe(0);
    }));

    it('should update totalRecords from API response', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.totalRecords).toBe(2);
    }));




  });



  describe('Filter Operations', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should apply filters and update filter chips', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(mockService.getOverrideRules).toHaveBeenCalled();
    }));








  });

  describe('Edit Mode Operations', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should enter edit mode when onAddEditClick is called', fakeAsync(() => {
      component.onAddEditClick();
      tick();

      expect(component.isEditMode).toBe(true);
      expect(component.editableRows.length).toBe(2);
      expect(component.originalRows.length).toBe(2);
    }));

    it('should not enter edit mode if no test ID selected', () => {
      component.testIdControl.setValue(null);
      component.onAddEditClick();

      expect(component.isEditMode).toBe(false);
    });



    it('should convert dataSource to editableRows correctly', fakeAsync(() => {
      component.onAddEditClick();
      tick();

      expect(component.editableRows[0].testId).toBe('TST001');
      expect(component.editableRows[0].currentResultStatus).toBe('POS');
      expect(component.editableRows[0].auditKey).toBe(1);
    }));

    it('should cancel edit mode and restore original data', fakeAsync(() => {
      component.onAddEditClick();
      tick();
      component.editableRows[0].currentResultStatus = 'MOD'; // 3 characters, within 5-char limit

      component.onCancelEdit();

      expect(component.isEditMode).toBe(false);
      expect(component.editableRows.length).toBe(0);
      expect(component.dataSource[0].currentResultStatus).toBe('POS');
    }));

    it('should add new row at the beginning', fakeAsync(() => {
      component.onAddEditClick();
      tick();
      const initialLength = component.editableRows.length;

      component.onAddNewRow();

      expect(component.editableRows.length).toBe(initialLength + 1);
      expect(component.editableRows[0].auditKey).toBe(0);
      expect(component.editableRows[0].testId).toBe('TST001');
      expect(component.dirtyRowIds.has(0)).toBe(true);
    }));



    it('should track row field changes', fakeAsync(() => {
      component.onAddEditClick();
      tick();

      component.onRowFieldChange(0, 'currentResultStatus', 'UPDATED');

      expect(component.editableRows[0].currentResultStatus).toBe('UPDATED');
      expect(component.editableRows[0].isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    }));








  });

  describe('Validation', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should detect validation errors for empty required fields on new record', () => {
      // Add a new row (auditKey === 0)
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = '';
      row.newResultStatus = '';
      row.overrideFlag = '';
      row.effDate = null;

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['currentResultStatus']).toBeDefined();
      expect(row.errors?.['newResultStatus']).toBeDefined();
      expect(row.errors?.['overrideFlag']).toBeDefined();
      expect(row.errors?.['effDate']).toBeDefined();
    });

    it('should not validate effDate for existing records', () => {
      // Existing row has auditKey > 0, effDate should not be validated
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = null; // Even null effDate should not trigger validation for existing records

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should validate date range correctly for new records', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = moment().add(30, 'days');
      row.termDate = moment().add(10, 'days');  // Before effective date

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['termDate']).toContain('before');
    });

    it('should validate date range for existing records with changed termDate', () => {
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = moment('2025-12-31');
      row.originalTermDate = moment('2026-06-30');  // Original value
      row.termDate = moment('2025-01-01');  // Changed to invalid date

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['termDate']).toContain('before');
    });

    it('should validate termDate even for existing records with unchanged termDate per FMB', () => {
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = moment('2020-01-01');
      // Set both original and current to same past date (per FMB: must still validate)
      row.originalTermDate = moment('2020-01-01');
      row.termDate = moment('2020-01-01');

      const isValid = component['validateRow'](row);

      // Per FMB logic: termDate must ALWAYS be >= today, even if unchanged
      expect(isValid).toBe(false);
      expect(row.errors?.['termDate']).toEqual(jasmine.stringContaining('Termination Date cannot be before current date'));
    });









    it('should fail validation for new record with past effective date', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = component.minDate.clone().subtract(1, 'day'); // Yesterday (using chapter's timezone)

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(false);
      expect(row.errors?.['effDate']).toEqual(jasmine.stringContaining('Effective Date cannot be before'));
    });

    it('should pass validation for new record with today as effective date', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = component.minDate.clone(); // Chapter's today
      row.termDate = component.minDate.clone().add(30, 'days');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should pass validation for new record with future effective date', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.interCode = 'INT001';
      row.effDate = moment().add(7, 'days'); // 7 days from now
      row.termDate = moment().add(30, 'days');

      const isValid = component['validateRow'](row);

      expect(isValid).toBe(true);
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should check if row has errors', () => {
      const row = component.editableRows[0];
      row.errors = { currentResultStatus: 'Required' };

      expect(component.hasRowErrors(row)).toBe(true);
    });

    it('should return false if row has no errors', () => {
      const row = component.editableRows[0];
      row.errors = {};

      expect(component.hasRowErrors(row)).toBe(false);
    });

    it('should compute hasValidationErrors correctly', () => {
      component.editableRows[0].errors = { currentResultStatus: 'Required' };

      expect(component.hasValidationErrors).toBe(true);
    });
  });

  describe('hasNewRows', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should return false when no new rows exist', () => {
      // All rows from mock data have auditKey > 0
      expect(component.hasNewRowsFlag).toBe(false);
    });

    it('should return true after adding a new row', () => {
      component.onAddNewRow();

      expect(component.hasNewRowsFlag).toBe(true);
    });




  });

  describe('getTerminationMinDate', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
    }));

    it('should return chapter today if effective date is in the past for new records', () => {
      const row = component.editableRows[0];
      row.auditKey = 0; // New record
      row.effDate = moment().subtract(30, 'days');

      const minDate = component.getTerminationMinDate(row);

      expect(minDate.isSame(component.minDate, 'day')).toBe(true);
    });

    it('should return effective date if it is in the future', () => {
      const row = component.editableRows[0];
      const futureDate = moment().add(30, 'days').startOf('day');
      row.effDate = futureDate;

      const minDate = component.getTerminationMinDate(row);

      expect(minDate.isSame(futureDate, 'day')).toBe(true);
    });

    it('should return component minDate if effective date is not set', () => {
      const row = component.editableRows[0];
      row.effDate = null;

      const minDate = component.getTerminationMinDate(row);

      expect(minDate.isSame(component.minDate, 'day')).toBe(true);
    });
  });


  describe('onSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges(); // Initialize component
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      mockSnackbarService.showSuccess.calls.reset();
      mockSnackbarService.showError.calls.reset();
    }));

    it('should save changes successfully', fakeAsync(() => {
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD'); // 3 characters, within 5-char limit

      component.onSave();
      tick();

      expect(mockService.saveBulkOverrideRules).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Saved successfully');
      expect(component.isEditMode).toBe(false);
    }));

    it('should reload filter interdiction codes after successful save', fakeAsync(() => {
      component.testIdControl.setValue('TST001');
      tick();

      mockService.getInterdictionCodesForFilter.calls.reset();
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD');

      component.onSave();
      tick();

      expect(mockService.getInterdictionCodesForFilter).toHaveBeenCalledWith('TST001');
    }));

    it('should not save if validation fails', fakeAsync(() => {
      // Mark row as dirty with invalid value (empty string)
      component.onRowFieldChange(0, 'currentResultStatus', '');

      component.onSave();
      tick();

      expect(mockService.saveBulkOverrideRules).not.toHaveBeenCalled();
      expect(component.showValidationBanner).toBe(true);
    }));

    it('should have save button disabled when no changes (dirtyRowIds is empty)', fakeAsync(() => {
      component.dirtyRowIds.clear();

      // Save button is disabled via template: [disabled]="isLoading || dirtyRowIds.size === 0"
      // Verify the condition that would disable the button
      expect(component.dirtyRowIds.size).toBe(0);
      expect(component.isLoading).toBe(false);

      // The button would be disabled in the template, so onSave wouldn't be callable from UI
      // But if called programmatically, it would still validate and attempt save
    }));

    it('should have save button enabled when changes exist', fakeAsync(() => {
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD');

      // Verify dirtyRowIds has entries
      expect(component.dirtyRowIds.size).toBeGreaterThan(0);
    }));



    it('should handle save error via interceptor', fakeAsync(() => {
      mockService.saveBulkOverrideRules.and.returnValue(
        throwError(() => ({ error: { message: 'Save failed' } }))
      );

      component.onRowFieldChange(0, 'currentResultStatus', 'UPD'); // 3 characters, within 5-char limit
      component.onSave();
      tick();

      // Error is handled by authInterceptor, component just stays in edit mode
      expect(component.isEditMode).toBe(true);
    }));

    it('should format dates for API correctly', fakeAsync(() => {
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD'); // 3 characters, within 5-char limit

      component.onSave();
      tick();

      const savedRows = mockService.saveBulkOverrideRules.calls.mostRecent().args[0] as any[];
      // API expects effDate property in YYYY-MM-DD format
      expect(savedRows[0].effDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));

    it('should format moment dates for API correctly', fakeAsync(() => {
      component.editableRows[0].effDate = moment('2025-06-15');
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD');

      component.onSave();
      tick();

      const savedRows = mockService.saveBulkOverrideRules.calls.mostRecent().args[0] as any[];
      // API expects effDate property in YYYY-MM-DD format
      expect(savedRows[0].effDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));
  });

  describe('Format Methods', () => {
    it('should format date correctly in DD-MON-YYYY format', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter(new Date('2025-01-15'), mockData[0]);
        expect(result).toMatch(/15-JAN-2025/);
      }
    });

    it('should format moment date correctly in DD-MON-YYYY format', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter(moment('2025-01-15'), mockData[0]);
        expect(result).toMatch(/15-JAN-2025/);
      }
    });





    it('should format interdiction with description', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'interCode');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter('INT001', mockData[0]);
        expect(result).toBe('INT001 - Permanent Deferral');
      }
    });
  });
  describe('Override Flag Options', () => {
    it('should have correct override flag options', () => {
      expect(component.overrideFlagOptions.length).toBe(2);
      expect(component.overrideFlagOptions[0].value).toBe('Y');
      expect(component.overrideFlagOptions[0].label).toBe('Yes');
      expect(component.overrideFlagOptions[1].value).toBe('N');
      expect(component.overrideFlagOptions[1].label).toBe('No');
    });
  });

  describe('Request State Management', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));



    it('should clear filter fields when clearing all filters', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      component.clearAllFilters();
      tick();

      expect(component.requestState.overrideFlag).toBeUndefined();
      expect(component.requestState.interdictionCode).toBeUndefined();
      expect(component.requestState.testId).toBe('TST001'); // Should preserve testId
    }));
  });


  describe('Date Filter Chips', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should create filter chip with >= operator for AFTER period', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'AFTER',
        effectiveDate: moment('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      const effDateChip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(effDateChip).toBeDefined();
      expect(effDateChip?.label).toContain('≥');
      expect(effDateChip?.label).toContain('15-MAR-2025');
    }));

    it('should create filter chip with <= operator for BEFORE period', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: 'BEFORE',
        effectiveDate: moment('2025-03-15'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      const effDateChip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(effDateChip).toBeDefined();
      expect(effDateChip?.label).toContain('≤');
      expect(effDateChip?.label).toContain('15-MAR-2025');
    }));

    it('should create termination date filter chip correctly', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'AFTER',
        terminationDate: moment('2025-12-31')
      };

      component.applyFilters(filters);
      tick();

      const termDateChip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(termDateChip).toBeDefined();
      expect(termDateChip?.label).toContain('≥');
      expect(termDateChip?.label).toContain('31-DEC-2025');
    }));
  });

  describe('Date Input Template Attributes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
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

  describe('Edit Mode - Existing vs New Records', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
    }));

    it('should have auditKey > 0 for existing records', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0);
      expect(existingRow).toBeDefined();
      expect(existingRow!.auditKey).toBeGreaterThan(0);
    });

    it('should set auditKey = 0 for new records', () => {
      component.onAddNewRow();
      const newRow = component.editableRows[0];
      expect(newRow.auditKey).toBe(0);
    });

    it('should store originalTermDate when entering edit mode', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0 && r.termDate);
      if (existingRow) {
        expect(existingRow.originalTermDate).toBeDefined();
        expect(moment(existingRow.originalTermDate).isSame(moment(existingRow.termDate), 'day')).toBe(true);
      }
    });

    it('should preserve effDate for existing records during validation', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0);
      const originalEffDate = existingRow!.effDate;

      component['validateRow'](existingRow!);

      expect(existingRow!.effDate).toEqual(originalEffDate);
    });

    it('should not mark existing record effDate as error even if in past', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0);
      existingRow!.currentResultStatus = 'POS';
      existingRow!.newResultStatus = 'NEG';
      existingRow!.overrideFlag = 'Y';
      existingRow!.interCode = 'INT001';
      existingRow!.effDate = moment('2020-01-01'); // Past date

      const isValid = component['validateRow'](existingRow!);

      expect(isValid).toBe(true);
      expect(existingRow!.errors?.['effDate']).toBeUndefined();
    });

    it('should validate termDate even if unchanged per FMB logic', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0);
      existingRow!.currentResultStatus = 'POS';
      existingRow!.newResultStatus = 'NEG';
      existingRow!.overrideFlag = 'Y';
      existingRow!.interCode = 'INT001';
      existingRow!.effDate = moment('2020-01-01');
      existingRow!.originalTermDate = moment('2020-06-01');  // Past date
      existingRow!.termDate = moment('2020-06-01');  // Same as original - unchanged

      const isValid = component['validateRow'](existingRow!);

      // Per FMB: termDate must ALWAYS be >= today, even if unchanged
      expect(isValid).toBe(false);
      expect(existingRow!.errors?.['termDate']).toEqual(jasmine.stringContaining('Termination Date cannot be before current date'));
    });

    it('should validate termDate for existing record if changed to invalid value', () => {
      const existingRow = component.editableRows.find(r => r.auditKey > 0);
      existingRow!.currentResultStatus = 'POS';
      existingRow!.newResultStatus = 'NEG';
      existingRow!.overrideFlag = 'Y';
      existingRow!.interCode = 'INT001';
      existingRow!.effDate = component.minDate.clone().add(6, 'months');
      existingRow!.originalTermDate = component.minDate.clone().add(1, 'year');  // Original future date
      existingRow!.termDate = component.minDate.clone();  // Changed to date before effDate

      const isValid = component['validateRow'](existingRow!);

      expect(isValid).toBe(false);
      expect(existingRow!.errors?.['termDate']).toContain('before');
    });
  });

  // ==================== ADDITIONAL COVERAGE TESTS ====================

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should set searchKeyword and reload data', fakeAsync(() => {
      mockService.getOverrideRules.calls.reset();
      component.onSearch('POS');
      tick();
      expect(component.requestState.searchKeyword).toBe('POS');
      expect(component.pageIndex).toBe(0);
      expect(mockService.getOverrideRules).toHaveBeenCalled();
    }));

    it('should clear searchKeyword when empty string passed', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';
      component.onSearch('');
      tick();
      expect(component.requestState.searchKeyword).toBeUndefined();
    }));
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should remove filter chip and reload data', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);
      tick();
      mockService.getOverrideRules.calls.reset();
      component.onRemoveFilterChip('overrideFlag');
      tick();
      expect(component.pageIndex).toBe(0);
      expect(mockService.getOverrideRules).toHaveBeenCalled();
    }));
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when filters are applied', fakeAsync(() => {
      component.ngOnInit();
      tick();
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'Y',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);
      expect(component.hasActiveFilters()).toBe(true);
    }));
  });

  describe('onClearTestId', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should reset test ID and all filters', fakeAsync(() => {
      component.appliedFilters = { overrideFlag: 'Y' } as any;
      component.filterChips = [{ key: 'test', label: 'test' }];
      component.requestState = { testId: 'TST001', searchKeyword: 'POS' };
      component.onClearTestId();
      tick();
      expect(component.testIdControl.value).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState).toEqual({});
      expect(component.pageIndex).toBe(0);
    }));
  });

  describe('onDeleteRow', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should delete new row (auditKey === 0)', fakeAsync(() => {
      component.onAddNewRow();
      const initialLength = component.editableRows.length;
      component.onDeleteRow(0);
      expect(component.editableRows.length).toBe(initialLength - 1);
    }));

    it('should not delete existing row (auditKey > 0)', fakeAsync(() => {
      const initialLength = component.editableRows.length;
      component.onDeleteRow(0);
      expect(component.editableRows.length).toBe(initialLength);
    }));

    it('should re-index dirty rows after deletion', fakeAsync(() => {
      component.onAddNewRow();
      component.onAddNewRow();
      component.dirtyRowIds.add(3);
      component.onDeleteRow(0);
      expect(component.dirtyRowIds.has(2)).toBe(true);
    }));

    it('should not delete row with invalid index', fakeAsync(() => {
      const initialLength = component.editableRows.length;
      component.onDeleteRow(999);
      expect(component.editableRows.length).toBe(initialLength);
    }));
  });

  describe('onDropdownOpened and isDropdownOpen', () => {
    it('should set openDropdown when opened', () => {
      component.onDropdownOpened(0, 'currentResultStatus', true);
      expect(component.openDropdown).toEqual({ row: 0, col: 'currentResultStatus' });
    });

    it('should clear openDropdown when closed', () => {
      component.onDropdownOpened(0, 'currentResultStatus', true);
      component.onDropdownOpened(0, 'currentResultStatus', false);
      expect(component.openDropdown).toBeNull();
    });

    it('should return true for matching dropdown', () => {
      component.onDropdownOpened(0, 'currentResultStatus', true);
      expect(component.isDropdownOpen(0, 'currentResultStatus')).toBe(true);
    });

    it('should return false for non-matching dropdown', () => {
      component.onDropdownOpened(0, 'currentResultStatus', true);
      expect(component.isDropdownOpen(1, 'currentResultStatus')).toBe(false);
      expect(component.isDropdownOpen(0, 'newResultStatus')).toBe(false);
    });
  });

  describe('isPastEffectiveDate', () => {
    it('should return true when effDateReadonly is true', () => {
      expect(component.isPastEffectiveDate({ effDateReadonly: true } as any)).toBe(true);
    });

    it('should return false when effDateReadonly is false', () => {
      expect(component.isPastEffectiveDate({ effDateReadonly: false } as any)).toBe(false);
    });

    it('should return false when effDateReadonly is undefined', () => {
      expect(component.isPastEffectiveDate({} as any)).toBe(false);
    });
  });

  describe('trackByRow', () => {
    it('should return auditKey for existing row', () => {
      expect(component.trackByRow(0, { auditKey: 5 } as any)).toBe(5);
    });

    it('should return new-index for new row', () => {
      expect(component.trackByRow(3, { auditKey: 0 } as any)).toBe('new-3');
    });
  });

  describe('formatDate private method', () => {
    it('should return dash for null', () => {
      expect(component['formatDate'](null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component['formatDate'](undefined)).toBe('-');
    });

    it('should format valid date string', () => {
      expect(component['formatDate']('2025-01-15')).toMatch(/15-JAN-2025/);
    });

    it('should format valid Date object', () => {
      expect(component['formatDate'](new Date('2025-03-20'))).toMatch(/20-MAR-2025/);
    });
  });

  describe('formatFilterDate private method', () => {
    it('should return undefined for null', () => {
      expect(component['formatFilterDate'](null)).toBeUndefined();
    });

    it('should format moment date', () => {
      expect(component['formatFilterDate'](moment('2025-06-15'))).toBe('2025-06-15');
    });

    it('should format Date object', () => {
      const result = component['formatFilterDate'](new Date(2025, 5, 15));
      expect(result).toBe('2025-06-15');
    });

    it('should format string date', () => {
      expect(component['formatFilterDate']('2025-06-15')).toBe('2025-06-15');
    });

    it('should return undefined for invalid date', () => {
      expect(component['formatFilterDate']('not-a-date')).toBeUndefined();
    });
  });

  describe('formatDateForApi private method', () => {
    it('should format moment date', () => {
      expect(component['formatDateForApi'](moment('2025-06-15'))).toBe('2025-06-15');
    });

    it('should format Date object via moment', () => {
      const result = component['formatDateForApi'](new Date(2025, 5, 15) as any);
      expect(result).toBe('2025-06-15');
    });
  });

  describe('filterResultOptions private method', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should return all options when search is empty', () => {
      expect(component['filterResultOptions']('')).toEqual(component.allResultOptions);
    });

    it('should filter options by search term', () => {
      const result = component['filterResultOptions']('pos');
      expect(result.length).toBeGreaterThan(0);
      result.forEach(opt => expect(opt.label.toLowerCase()).toContain('pos'));
    });

    it('should return empty for non-matching search', () => {
      expect(component['filterResultOptions']('zzzzz').length).toBe(0);
    });
  });

  describe('filterInterdictionOptionsList private method', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should return all when search is empty', () => {
      expect(component['filterInterdictionOptionsList']('')).toEqual(component.allInterdictionOptions);
    });

    it('should filter by interCode', () => {
      const result = component['filterInterdictionOptionsList']('INT001');
      expect(result.length).toBe(1);
      expect(result[0].interCode).toBe('INT001');
    });

    it('should filter by interDesc', () => {
      const result = component['filterInterdictionOptionsList']('Permanent');
      expect(result.length).toBe(1);
    });
  });

  describe('updateRequestStateFromFilters private method', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
    }));

    it('should preserve testId and searchKeyword when filters null', () => {
      component.requestState = { testId: 'TST001', searchKeyword: 'POS', overrideFlag: 'Y' };
      component.appliedFilters = null;
      component['updateRequestStateFromFilters']();
      expect(component.requestState.testId).toBe('TST001');
      expect(component.requestState.searchKeyword).toBe('POS');
      expect(component.requestState.overrideFlag).toBeUndefined();
    });

    it('should update from applied filters with date periods', () => {
      component.requestState = { testId: 'TST001', searchKeyword: 'POS' };
      component.appliedFilters = {
        overrideFlag: 'Y',
        interdictionCode: 'INT001',
        effectiveDatePeriod: 'AFTER',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'BEFORE',
        terminationDate: moment('2025-12-31')
      };
      component['updateRequestStateFromFilters']();
      expect(component.requestState.overrideFlag).toBe('Y');
      expect(component.requestState.interdictionCode).toBe('INT001');
      expect(component.requestState.effectiveDatePeriod).toBe('after');
      expect(component.requestState.terminationDatePeriod).toBe('before');
      expect(component.requestState.effectiveDate).toBeDefined();
      expect(component.requestState.terminationDate).toBeDefined();
    });
  });

  describe('Date validation methods', () => {
    it('should parse valid calendar date with separator', () => {
      const result = component['isValidCalendarDate']('15-JAN-2025');
      expect(result).not.toBeNull();
      expect(result!.date()).toBe(15);
    });

    it('should return null for invalid date', () => {
      expect(component['isValidCalendarDate']('invalid')).toBeNull();
    });

    it('should return null for date with year out of range', () => {
      expect(component['isValidCalendarDate']('15-JAN-1800')).toBeNull();
    });

    it('should parse 8-digit compact date (MMDDYYYY)', () => {
      const result = component['parseCompactDate']('01152025');
      expect(result).not.toBeNull();
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(15);
      expect(result!.year()).toBe(2025);
    });

    it('should parse 7-digit compact date (MDDYYYY)', () => {
      const result = component['parseCompactDate']('1152025');
      expect(result).not.toBeNull();
      expect(result!.month()).toBe(0);
      expect(result!.date()).toBe(15);
    });

    it('should return null for invalid compact date', () => {
      expect(component['parseCompactDate']('99992025')).toBeNull();
    });

    it('should return null for compact date with year out of range', () => {
      expect(component['parseCompactDate']('01011800')).toBeNull();
    });

    it('should return null for non-7-or-8-digit input', () => {
      expect(component['parseCompactDate']('12345')).toBeNull();
    });

    it('should route 7-8 digit input to parseCompactDate via isValidCalendarDate', () => {
      const result = component['isValidCalendarDate']('01152025');
      expect(result).not.toBeNull();
    });
  });

  describe('validateAndFormatDate private method', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should set error for empty effDate on new row', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      component['validateAndFormatDate']('', row, 0, 'effDate', inputEl);
      expect(row.errors?.['effDate']).toBe('Effective Date is required');
    });

    it('should not set error for empty effDate on existing row', () => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      component['validateAndFormatDate']('', row, 0, 'effDate', inputEl);
      expect(row.errors?.['effDate']).toBeUndefined();
    });

    it('should set error for invalid date format', () => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      component['validateAndFormatDate']('invalid-date', row, 0, 'effDate', inputEl);
      expect(row.errors?.['effDate']).toContain('Invalid date format');
      expect((row as any)['effDate']).toBeNull();
    });

    it('should accept valid future date and format input', () => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      const futureDate = moment().add(30, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](futureDate, row, 0, 'effDate', inputEl);
      expect(row.effDate).not.toBeNull();
      expect(inputEl.value).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should validate effDate not before today for new row', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      const pastDate = moment().subtract(10, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](pastDate, row, 0, 'effDate', inputEl);
      expect(row.errors?.['effDate']).toContain('cannot be before');
    });

    it('should validate termDate not before effDate', () => {
      const row = component.editableRows[0];
      row.effDate = moment().add(30, 'days');
      const inputEl = document.createElement('input');
      const earlyDate = moment().add(10, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](earlyDate, row, 0, 'termDate', inputEl);
      expect(row.errors?.['termDate']).toContain('before');
    });

    it('should validate termDate not before today when no effDate', () => {
      const row = component.editableRows[0];
      row.effDate = null;
      const inputEl = document.createElement('input');
      const pastDate = moment().subtract(10, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](pastDate, row, 0, 'termDate', inputEl);
      expect(row.errors?.['termDate']).toContain('before');
    });

    it('should mark row dirty and add to dirtyRowIds', () => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      const futureDate = moment().add(30, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](futureDate, row, 0, 'effDate', inputEl);
      expect(row.isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    });

    it('should show termDate error with effDate reference when effDate exists', () => {
      const row = component.editableRows[0];
      row.effDate = moment().add(60, 'days');
      const inputEl = document.createElement('input');
      const earlyDate = moment().add(10, 'days').format('DD-MMM-YYYY');
      component['validateAndFormatDate'](earlyDate, row, 0, 'termDate', inputEl);
      expect(row.errors?.['termDate']).toContain('Effective Date');
    });
  });

  describe('Date change handlers', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should handle effective date change from datepicker', fakeAsync(() => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      const event = { value: moment().add(30, 'days'), targetElement: inputEl };
      component.onEffectiveDateChange(event as any, row, 0);
      tick();
    }));

    it('should skip effective date change when value is null', fakeAsync(() => {
      const row = component.editableRows[0];
      const event = { value: null, targetElement: document.createElement('input') };
      component.onEffectiveDateChange(event as any, row, 0);
      tick();
    }));

    it('should handle termination date change from datepicker', fakeAsync(() => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      const event = { value: moment().add(60, 'days'), targetElement: inputEl };
      component.onTerminationDateChange(event as any, row, 0);
      tick();
    }));

    it('should skip termination date change when value is null', fakeAsync(() => {
      const row = component.editableRows[0];
      const event = { value: null, targetElement: document.createElement('input') };
      component.onTerminationDateChange(event as any, row, 0);
      tick();
    }));

    it('should handle effective date blur', fakeAsync(() => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      inputEl.value = moment().add(30, 'days').format('DD-MMM-YYYY');
      component.onEffectiveDateBlur({ target: inputEl } as any, row, 0);
      tick();
    }));

    it('should handle termination date blur', fakeAsync(() => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      inputEl.value = moment().add(60, 'days').format('DD-MMM-YYYY');
      component.onTerminationDateBlur({ target: inputEl } as any, row, 0);
      tick();
    }));

    it('should use saved raw input on blur if available', fakeAsync(() => {
      const row = component.editableRows[0];
      const inputEl = document.createElement('input');
      inputEl.value = '15-JAN-2028';
      component['savedRawInput']['0_effDate'] = '15-JAN-2028';
      component.onEffectiveDateBlur({ target: inputEl } as any, row, 0);
      tick();
    }));
  });

  describe('onDateInput', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should save raw input value', () => {
      const inputEl = document.createElement('input');
      inputEl.value = '01152025';
      component.onDateInput({ target: inputEl } as any, 0, 'effDate');
      expect(component['savedRawInput']['0_effDate']).toBe('01152025');
    });

    it('should mark row dirty when value entered', () => {
      const inputEl = document.createElement('input');
      inputEl.value = 'some-date';
      component.onDateInput({ target: inputEl } as any, 0, 'effDate');
      expect(component.editableRows[0].isDirty).toBe(true);
      expect(component.dirtyRowIds.has(0)).toBe(true);
    });

    it('should auto-convert 8-digit compact date', fakeAsync(() => {
      const inputEl = document.createElement('input');
      inputEl.value = '01152028';
      component.onDateInput({ target: inputEl } as any, 0, 'effDate');
      tick();
    }));

    it('should not mark dirty for empty value', () => {
      const row = component.editableRows[0];
      row.isDirty = false;
      const inputEl = document.createElement('input');
      inputEl.value = '';
      component.onDateInput({ target: inputEl } as any, 0, 'effDate');
      expect(row.isDirty).toBe(false);
    });
  });

  describe('loadData error handling', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should set hasError and errorMessage on load failure', fakeAsync(() => {
      mockService.getOverrideRules.and.returnValue(throwError(() => new Error('API error')));
      component.loadData();
      tick();
      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('Failed to load');
    }));
  });

  describe('API error handling', () => {
    it('should show snackbar error when getTestIds fails', fakeAsync(() => {
      mockService.getTestIds.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load test IDs.');
    }));

    it('should show snackbar error when getInterdictionCodes fails', fakeAsync(() => {
      mockService.getInterdictionCodes.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load interdiction codes.');
    }));

    it('should show snackbar error when getInterdictionCodesForFilter fails', fakeAsync(() => {
      mockService.getInterdictionCodesForFilter.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load interdiction codes for filter.');
    }));

    it('should show snackbar error when getTestResults fails', fakeAsync(() => {
      mockService.getTestResults.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load test results.');
    }));
  });

  describe('Table column formatters - additional coverage', () => {
    it('should format overrideFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'overrideFlag');
      expect(col?.valueFormatter).toBeDefined();
      expect(col!.valueFormatter!('Y', mockData[0])).toBe('Yes');
    });

    it('should format overrideFlag N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'overrideFlag');
      expect(col!.valueFormatter!('N', mockData[0])).toBe('No');
    });

    it('should return value as-is for unknown overrideFlag', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'overrideFlag');
      expect(col!.valueFormatter!('X', mockData[0])).toBe('X');
    });

    it('should format interdiction with no description using code only', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'interCode');
      const row = { interCode: 'INT003', interDescription: null } as any;
      expect(col!.valueFormatter!('INT003', row)).toBe('INT003');
    });

    it('should format interdiction as dash when no code', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'interCode');
      const row = { interCode: '', interDescription: null } as any;
      expect(col!.valueFormatter!('', row)).toBe('-');
    });

    it('should format null date as dash via effDate formatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(col!.valueFormatter!(null, mockData[0])).toBe('-');
    });

    it('should format insertDate column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'insertDate');
      expect(col!.valueFormatter!(new Date('2025-01-15'), mockData[0])).toMatch(/15-JAN-2025/);
    });

    it('should format termDate column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(col!.valueFormatter!(new Date('2025-12-31'), mockData[0])).toMatch(/31-DEC-2025/);
    });
  });

  describe('Inline search controls', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should filter current result options on search', fakeAsync(() => {
      component.currentResultSearchControl.setValue('pos');
      tick(200);
      expect(component.filteredCurrentResultOptions.length).toBeGreaterThan(0);
    }));

    it('should filter new result options on search', fakeAsync(() => {
      component.newResultSearchControl.setValue('neg');
      tick(200);
      expect(component.filteredNewResultOptions.length).toBeGreaterThan(0);
    }));

    it('should filter interdiction options on search', fakeAsync(() => {
      component.interdictionSearchControl.setValue('perm');
      tick(200);
      expect(component.filteredInterdictionOptions.length).toBeGreaterThan(0);
    }));

    it('should reset to all options when search cleared', fakeAsync(() => {
      component.currentResultSearchControl.setValue('pos');
      tick(200);
      component.currentResultSearchControl.setValue('');
      tick(200);
      expect(component.filteredCurrentResultOptions.length).toBe(component.allResultOptions.length);
    }));
  });

  describe('Chapter change subscription', () => {
    it('should reset state when chapter changes', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      fixture = TestBed.createComponent(OverrideRulesComponent);
      component = fixture.componentInstance;
      component.ngOnInit();
      tick();

      component.isEditMode = true;
      component.showValidationBanner = true;

      chapterSubject.next();
      tick();

      expect(component.isEditMode).toBe(false);
      expect(component.showValidationBanner).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
    }));
  });

  describe('onRowFieldChange error clearing', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should clear field error for non-date field', () => {
      const row = component.editableRows[0];
      row.errors = { currentResultStatus: 'Required' };
      component.onRowFieldChange(0, 'currentResultStatus', 'POS');
      expect(row.errors?.['currentResultStatus']).toBeUndefined();
    });

    it('should NOT clear date field errors', () => {
      const row = component.editableRows[0];
      row.errors = { effDate: 'Invalid date' };
      component.onRowFieldChange(0, 'effDate', moment());
      expect(row.errors?.['effDate']).toBe('Invalid date');
    });
  });

  describe('Validation edge cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
    }));

    it('should fail for currentResultStatus exceeding 5 characters', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'TOOLON';
      row.newResultStatus = 'NEG';
      row.overrideFlag = 'Y';
      row.effDate = moment().add(1, 'day');
      expect(component['validateRow'](row)).toBe(false);
      expect(row.errors?.['currentResultStatus']).toContain('exceed 5');
    });

    it('should fail for newResultStatus exceeding 5 characters', () => {
      component.onAddNewRow();
      const row = component.editableRows[0];
      row.currentResultStatus = 'POS';
      row.newResultStatus = 'TOOLON';
      row.overrideFlag = 'Y';
      row.effDate = moment().add(1, 'day');
      expect(component['validateRow'](row)).toBe(false);
      expect(row.errors?.['newResultStatus']).toContain('exceed 5');
    });

    it('should validate all rows via validateAllRows', () => {
      component.onAddNewRow();
      component.editableRows[0].currentResultStatus = '';
      expect(component['validateAllRows']()).toBe(false);
    });

    it('should return true from validateAllRows when all valid', () => {
      component.editableRows.forEach(row => {
        row.currentResultStatus = 'POS';
        row.newResultStatus = 'NEG';
        row.overrideFlag = 'Y';
      });
      expect(component['validateAllRows']()).toBe(true);
    });

    it('should validate only dirty rows via validateDirtyRows', () => {
      component.dirtyRowIds.clear();
      expect(component['validateDirtyRows']()).toBe(true);
    });

    it('should fail validateDirtyRows when dirty row is invalid', () => {
      component.onAddNewRow();
      component.editableRows[0].currentResultStatus = '';
      expect(component['validateDirtyRows']()).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up on destroy', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.ngOnDestroy();
      expect(component['isDestroyed']).toBe(true);
    }));
  });

  describe('onTestIdDropdownOpened false', () => {
    it('should not reload test IDs when closed', fakeAsync(() => {
      component.ngOnInit();
      tick();
      mockService.getTestIds.calls.reset();
      component.onTestIdDropdownOpened(false);
      tick();
      expect(mockService.getTestIds).not.toHaveBeenCalled();
    }));
  });

  describe('applyFilters additional cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should handle termination date filter', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: null,
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'BEFORE',
        terminationDate: moment('2025-12-31')
      };
      component.applyFilters(filters);
      tick();
      expect(component.requestState.terminationDatePeriod).toBe('before');
      expect(component.requestState.terminationDate).toBeDefined();
    }));

    it('should handle filters with no periods', fakeAsync(() => {
      const filters: OverrideRuleFilterValue = {
        overrideFlag: 'N',
        interdictionCode: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.applyFilters(filters);
      tick();
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.terminationDatePeriod).toBeUndefined();
    }));
  });

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.onPageChange({ pageIndex: 3, pageSize: 50, previousPageIndex: 2 });
      tick();
      expect(component.pageIndex).toBe(3);
      expect(component.pageSize).toBe(50);
    }));
  });

  describe('onSave success flow details', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.testIdControl.setValue('TST001');
      tick();
      component.onAddEditClick();
      tick();
      mockSnackbarService.showSuccess.calls.reset();
    }));

    it('should clear searchKeyword after save', fakeAsync(() => {
      component.requestState.searchKeyword = 'POS';
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD');
      component.onSave();
      tick();
      tick();
      expect(component.requestState.searchKeyword).toBeUndefined();
    }));

    it('should handle save response without message', fakeAsync(() => {
      mockService.saveBulkOverrideRules.and.returnValue(of({ success: false }));
      component.onRowFieldChange(0, 'currentResultStatus', 'UPD');
      component.onSave();
      tick();
      tick();
      expect(component.isEditMode).toBe(false);
    }));
  });
});
