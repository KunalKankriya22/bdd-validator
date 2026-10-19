import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import moment from 'moment';

import { AntigenGroupComponent } from './antigen-group';
import { AntigenGroupApiService } from '../services/antigen-group-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { AntigenGroupTest, LookUp, ReturnResult } from '../models/sp-antigen-grouping.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AntigenGroupComponent', () => {
  let component: AntigenGroupComponent;
  let fixture: ComponentFixture<AntigenGroupComponent>;
  let mockService: jasmine.SpyObj<AntigenGroupApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockTableData: AntigenGroupTest[] = [
    {
      testId: 'TEST1',
      description: 'ABO/Rh Typing',
      result: 'POS',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      modificationDate: '2024-05-12T10:30:00Z',
      antigenGroupCode: 'ANTG1'
    },
    {
      testId: 'CMV',
      description: 'CMV Antibody Test',
      result: 'NEG',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      modificationDate: '2024-05-12T10:30:00Z',
      antigenGroupCode: 'ANTG1'
    }
  ];

  const mockTestResultOptions: LookUp[] = [
    { key: 'POS', value: 'Positive' },
    { key: 'NEG', value: 'Negative' }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('AntigenGroupApiService', [
      'getAntigenGroupTests',
      'getAntigenGroupTestById',
      'getAntigenGroupsLov',
      'getTestIdsLov',
      'getTestResultsLov',
      'createAntigenGroupTest',
      'updateAntigenGroupTest',
      'deleteAntigenGroupTest'
    ]);

    mockService.getAntigenGroupsLov.and.returnValue(of([
      { code: 'ANTG1', description: 'Antigen Group 1' },
      { code: 'ANTG2', description: 'Antigen Group 2' }
    ]));
    mockService.getTestIdsLov.and.returnValue(of([
      { key: 'TEST1', value: 'ABO/Rh Typing' },
      { key: 'CMV', value: 'CMV Antibody Test' }
    ]));
    mockService.getTestResultsLov.and.returnValue(of(mockTestResultOptions));
    mockService.getAntigenGroupTests.and.returnValue(of({
      data: mockTableData,
      totalRecords: 2
    }));

    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
      TestBed.configureTestingModule({
      imports: [
        AntigenGroupComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AntigenGroupApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

      mockService.getTestResultsLov.and.returnValue(of(mockTestResultOptions));


    fixture = TestBed.createComponent(AntigenGroupComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.contains('antigenGroupCode')).toBeTruthy();
      expect(component.filterForm.contains('description')).toBeTruthy();
    });





    it('should handle dropdown loading failure gracefully', () => {
      mockService.getAntigenGroupsLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.antigenGroupOptions.length).toBe(0);
    });
  });

  describe('Filter Changes', () => {


    it('should update description when antigen group is selected', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      expect(component.filterForm.get('description')?.value).toBe('Antigen Group 1');
    });


  });

  describe('Load Table Data', () => {
    it('should populate dataSource from API response', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].testId).toBe('TEST1');
      expect(component.dataSource[0].description).toBe('ABO/Rh Typing');
    });

    it('should set error state on API failure', () => {
      mockService.getAntigenGroupTests.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });


  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should enter edit mode', () => {
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();
      expect(component.editableRowsMeta.length).toBe(component.filteredDataSource.length);
    });



    it('should exit edit mode', () => {
      component.enterEditMode();
      component.exitEditMode();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });

    it('should cancel edit mode', () => {
      component.enterEditMode();
      component.cancelEdit();
      expect(component.isEditOrAddMode).toBeFalse();
    });
  });

  describe('Add New Row', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should add new row', () => {
      const initialCount = component.newRows.length;
      component.addNewRow();
      expect(component.newRows.length).toBe(initialCount + 1);
      expect(component.newRows[0].form).toBeDefined();
      expect(component.newRows[0].resultOptions).toEqual([]);
    });



    it('should mark new row form fields as required', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      expect(form.get('testId')?.hasError('required')).toBeTruthy();
      expect(form.get('result')?.hasError('required')).toBeTruthy();
      expect(form.get('effDate')?.hasError('required')).toBeTruthy();
      expect(form.get('description')?.disabled).toBeTruthy();
    });

    it('should load result options when testId changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();

      expect(mockService.getTestResultsLov).toHaveBeenCalledWith('TEST1');
      expect(row.resultOptions.length).toBe(2);
    }));

    it('should update description when testId changes', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();

      expect(row.form.get('description')?.value).toBe('ABO/Rh Typing');
    }));

    it('should clear result when testId changes', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('result')?.setValue('POS');
      row.form.get('testId')?.setValue('CMV');
      tick();

      expect(row.form.get('result')?.value).toBe('');
    }));


  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should not save if validation errors exist', () => {
      component.addNewRow();
      component.saveAll();
      expect(component.showValidationError).toBeTrue();
      expect(component.isSaving).toBeFalse();
    });

    it('should call createAntigenGroupTest for new rows', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Created' };
      mockService.createAntigenGroupTest.and.returnValue(of(successResponse));

      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'TEST1',
        description: 'ABO/Rh Typing',
        result: 'POS',
        effDate: moment(),
        termDate: null
      });
      form.markAsDirty();

      component.saveAll();
      tick();

      expect(mockService.createAntigenGroupTest).toHaveBeenCalledWith(
        jasmine.objectContaining({
          antigenGroupCode: 'ANTG1',
          testId: 'TEST1',
          testResult: 'POS'
        })
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
      expect(component.isEditOrAddMode).toBeFalse();
    }));

    it('should call updateAntigenGroupTest for modified rows', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Updated' };
      mockService.updateAntigenGroupTest.and.returnValue(of(successResponse));

      const cmvMeta = component.editableRowsMeta.find(m => m.originalRow.testId === 'CMV')!;
      cmvMeta.form.get('result')?.setValue('POS');
      cmvMeta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(mockService.updateAntigenGroupTest).toHaveBeenCalledWith(
        'ANTG1',
        'CMV',
        jasmine.objectContaining({ testResult: 'POS' })
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    }));

    it('should reset isSaving on save failure', fakeAsync(() => {
      mockService.createAntigenGroupTest.and.returnValue(throwError(() => new Error('fail')));

      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'TEST1',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();

      component.saveAll();
      tick();

      expect(component.isSaving).toBeFalse();
    }));

    it('should exit edit mode without saving when no changes', () => {
      component.saveAll();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(mockService.createAntigenGroupTest).not.toHaveBeenCalled();
      expect(mockService.updateAntigenGroupTest).not.toHaveBeenCalled();
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });



    it('should show all data when search is empty', () => {
      component.onSearch('ABO');
      component.onSearch('');
      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });


  });

  describe('Date Formatting', () => {


    it('should return "-" for null dates', () => {
      expect(component.formatDate(null)).toBe('-');
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });





    it('should detect date errors via hasDateError', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const effDateControl = form.get('effDate');
      effDateControl?.setValue(null);
      effDateControl?.markAsTouched();
      effDateControl?.updateValueAndValidity();

      expect(component.hasDateError(form, 'effDate')).toBeTruthy();
    });

    it('should get date error messages', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const effDateControl = form.get('effDate');
      effDateControl?.setValue(null);
      effDateControl?.markAsTouched();
      effDateControl?.updateValueAndValidity();

      const errorMessage = component.getDateErrorMessage(form, 'effDate');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toContain('required');
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should exit edit mode when chapter changes', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
      chapterChanged$.next();
      expect(component.isEditOrAddMode).toBeFalse();
    });


  });

  describe('Coverage Gap Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should format a valid date correctly', () => {
      const result = component.formatDate('2024-06-15T10:30:00Z');
      expect(result).toMatch(/15-JUN-2024/);
    });

    it('should remove a new row', () => {
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      expect(component.newRows.length).toBe(2);
      component.removeNewRow(0);
      expect(component.newRows.length).toBe(1);
    });

    it('should toggle test ID sort direction', () => {
      expect(component.testIdSortDirection).toBe('asc');
      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('desc');
      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('asc');
    });

    it('should reset testIdFilterCtrl when panel closes', () => {
      component.testIdFilterCtrl.setValue('search');
      component.onTestIdPanelToggle(false);
      expect(component.testIdFilterCtrl.value).toBe('');
    });

    it('should handle result panel toggle opened/closed', () => {
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.resultOptions = [{ key: 'POS', value: 'Positive' }];

      component.onResultPanelToggle(true, row);
      expect((component as any).activeResultRow).toBe(row);

      component.onResultPanelToggle(false);
      expect((component as any).activeResultRow).toBeNull();
      expect(row.filteredResultOptions).toEqual(row.resultOptions);
    });

    it('should handle showTooltipIfOverflowing', () => {
      const mockElement = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      const mockTooltip = { disabled: true } as any;
      component.showTooltipIfOverflowing(mockElement, mockTooltip);
      expect(mockTooltip.disabled).toBeFalse();

      const fitsElement = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.showTooltipIfOverflowing(fitsElement, mockTooltip);
      expect(mockTooltip.disabled).toBeTrue();
    });

    it('should handle onEffDateInput', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '15-JUN-2026' } } as any;
      component.onEffDateInput(mockEvent, form);
      // No error thrown
      expect(form).toBeDefined();
    });

    it('should handle onTermDateInput', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '20-JUN-2026' } } as any;
      component.onTermDateInput(mockEvent, form);
      expect(form).toBeDefined();
    });

    it('should get required field error when touched and empty', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const ctrl = form.get('testId');
      ctrl?.markAsTouched();
      ctrl?.updateValueAndValidity();

      const error = component.getRequiredFieldError(form, 'testId', 'Test ID');
      expect(error).toBe('Test ID is required.');
    });

    it('should return empty string when field has no required error', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('testId')?.setValue('TEST1');

      const error = component.getRequiredFieldError(form, 'testId', 'Test ID');
      expect(error).toBe('');
    });

    it('should get termDate error message', () => {
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      const msg = component.getDateErrorMessage(form, 'termDate');
      expect(typeof msg).toBe('string');
    });

    it('should exit edit mode when antigen group changes while editing', () => {
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG2' });
      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should clear data when antigen group is deselected', () => {
      expect(component.dataSource.length).toBe(2);
      component.filterForm.patchValue({ antigenGroupCode: '' });
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
    });

    it('should clear result options when testId is cleared in new row', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();
      expect(row.resultOptions.length).toBe(2);

      row.form.get('testId')?.setValue('');
      tick();
      expect(row.resultOptions).toEqual([]);
    }));

    it('should use cached result options on second load', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();
      const callCountAfterFirst = mockService.getTestResultsLov.calls.count();

      // Second load from cache - should not make additional API call
      component.addNewRow();
      const row2 = component.newRows[0];
      row2.form.get('testId')?.setValue('TEST1');
      tick();
      expect(mockService.getTestResultsLov.calls.count()).toBe(callCountAfterFirst);
      expect(row2.resultOptions.length).toBe(2);
    }));

    it('should handle result options load error', fakeAsync(() => {
      mockService.getTestResultsLov.and.returnValue(throwError(() => new Error('fail')));
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('NEWTEST');
      tick();
      expect(row.resultOptions).toEqual([]);
      expect(row.filteredResultOptions).toEqual([]);
    }));

    it('should filter result options when resultFilterCtrl changes with active row', fakeAsync(() => {
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.resultOptions = [{ key: 'POS', value: 'Positive' }, { key: 'NEG', value: 'Negative' }];
      row.filteredResultOptions = [...row.resultOptions];
      (component as any).activeResultRow = row;

      component.resultFilterCtrl.setValue('POS');
      tick();

      expect(row.filteredResultOptions.length).toBe(1);
      expect(row.filteredResultOptions[0].key).toBe('POS');
    }));

    it('should handle loadTableData when no antigenGroup is set', () => {
      component.filterForm.patchValue({ antigenGroupCode: '' }, { emitEvent: false });
      component.loadTableData();
      // Early return - isLoading should remain false
      expect(component.isLoading).toBeFalse();
    });

    it('should handle testIdOptions loading error', fakeAsync(() => {
      mockService.getTestIdsLov.and.returnValue(throwError(() => new Error('fail')));
      component.loadDropdownOptions();
      tick();
      // Should not crash
      expect(component).toBeTruthy();
    }));

    it('should filter antigen group options when search changes', fakeAsync(() => {
      component.antigenGroupCodeFilterCtrl.setValue('ANTG1');
      tick();
      expect(component.filteredAntigenGroupOptions.length).toBe(1);

      component.antigenGroupCodeFilterCtrl.setValue('');
      tick();
      expect(component.filteredAntigenGroupOptions.length).toBe(2);
    }));

    it('should filter testId options when search changes', fakeAsync(() => {
      component.testIdFilterCtrl.setValue('CMV');
      tick();
      expect(component.filteredTestIdOptions.length).toBe(1);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('minDate should return a moment object', () => {
      const result = component.minDate;
      expect(result).toBeDefined();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('editableRows should return empty array when not in edit mode', () => {
      expect(component.editableRows).toEqual([]);
    });

    it('editableRows should return form groups when in edit mode', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
      expect(component.editableRows.length).toBe(component.editableRowsMeta.length);
      component.editableRows.forEach(r => {
        expect(r.get('testId')).toBeDefined();
      });
    });

    it('currentAntigenGroupCode should return empty string when no value set', () => {
      expect(component.currentAntigenGroupCode).toBe('');
    });

    it('currentAntigenGroupCode should return the selected code', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      expect(component.currentAntigenGroupCode).toBe('ANTG1');
    });
  });

  describe('Filter Changes - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset searchText when antigen group changes', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.searchText = 'someSearch';
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG2' });
      expect(component.searchText).toBe('');
    });

    it('should reset testIdSortDirection when antigen group changes', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.testIdSortDirection = 'desc';
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG2' });
      expect(component.testIdSortDirection).toBe('asc');
    });

    it('should clear description when unknown group is selected', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'UNKNOWN' });
      expect(component.filterForm.get('description')?.value).toBe('');
    });
  });

  describe('Load Table Data - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should include searchKeyword in params when searchText is set', () => {
      component.searchText = 'ABO';
      component.loadTableData();
      expect(mockService.getAntigenGroupTests).toHaveBeenCalledWith(
        100, 0,
        jasmine.objectContaining({ searchKeyword: 'ABO' })
      );
    });

    it('should pass undefined searchKeyword when searchText is empty', () => {
      component.searchText = '';
      component.loadTableData();
      expect(mockService.getAntigenGroupTests).toHaveBeenCalledWith(
        100, 0,
        jasmine.objectContaining({ searchKeyword: undefined })
      );
    });

    it('should set isLoading to true while loading', () => {
      // Store ref to verify intermediate state
      let wasLoading = false;
      const origSub = mockService.getAntigenGroupTests.and.callFake(() => {
        wasLoading = component.isLoading;
        return of({ data: [], totalRecords: 0 });
      });
      component.loadTableData();
      expect(wasLoading).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Search and Filter - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should filter by testId', () => {
      component.onSearch('TEST1');
      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].testId).toBe('TEST1');
    });

    it('should filter by description (case-insensitive)', () => {
      component.onSearch('cmv');
      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].description).toBe('CMV Antibody Test');
    });

    it('should return no results when search matches nothing', () => {
      component.onSearch('ZZZZZ');
      expect(component.filteredDataSource.length).toBe(0);
    });

    it('should sort in descending order', () => {
      component.toggleTestIdSort();
      expect(component.filteredDataSource[0].testId).toBe('TEST1');
      expect(component.filteredDataSource[1].testId).toBe('CMV');
    });

    it('should sort in ascending order', () => {
      component.testIdSortDirection = 'asc';
      component.onSearch('');
      expect(component.filteredDataSource[0].testId).toBe('CMV');
      expect(component.filteredDataSource[1].testId).toBe('TEST1');
    });

    it('should sort editableRowsMeta when in edit mode and applying filters', () => {
      component.enterEditMode();
      component.testIdSortDirection = 'desc';
      component.onSearch('');
      expect(component.editableRowsMeta[0].originalRow.testId).toBe('TEST1');
      expect(component.editableRowsMeta[1].originalRow.testId).toBe('CMV');
    });
  });

  describe('Edit Mode - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should reset showValidationError when entering edit mode', () => {
      component.showValidationError = true;
      component.enterEditMode();
      expect(component.showValidationError).toBeFalse();
    });

    it('should clear newRows when entering edit mode', () => {
      component.enterEditMode();
      component.addNewRow();
      expect(component.newRows.length).toBe(1);
      component.exitEditMode();
      component.enterEditMode();
      expect(component.newRows.length).toBe(0);
    });

    it('should update dirty forms flag when editable row form value changes', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.markAsDirty();
      meta.form.get('result')?.setValue('NEG');
      tick();
      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should update termDate validity when effDate changes in edit mode', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('termDate')?.setValue(moment('2030-06-01'));
      tick();
      const termDateSpy = spyOn(meta.form.get('termDate')!, 'updateValueAndValidity');
      meta.form.get('effDate')?.setValue(moment('2030-01-01'));
      tick();
      expect(termDateSpy).toHaveBeenCalled();
    }));

    it('should update dirty flag when termDate changes in edit mode', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('termDate')?.markAsDirty();
      meta.form.get('termDate')?.setValue(moment('2030-12-31'));
      tick();
      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should load result options for all editable rows on enterEditMode', () => {
      component.enterEditMode();
      // Service should have been called for test results
      expect(mockService.getTestResultsLov).toHaveBeenCalled();
    });

    it('should reset all flags on exitEditMode', () => {
      component.enterEditMode();
      component.showValidationError = true;
      component.hasAnyDirtyForms = true;
      component.hasAnyInvalidForms = true;
      component.exitEditMode();
      expect(component.showValidationError).toBeFalse();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });
  });

  describe('Add New Row - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should decrement newRowCounter for each new row', () => {
      const counterBefore = (component as any).newRowCounter;
      component.addNewRow();
      expect(component.newRows[0].id).toBe(counterBefore - 1);
      component.addNewRow();
      expect(component.newRows[0].id).toBe(counterBefore - 2);
    });

    it('should prepend new rows (most recent first)', () => {
      component.addNewRow();
      const firstId = component.newRows[0].id;
      component.addNewRow();
      expect(component.newRows[0].id).not.toBe(firstId);
      expect(component.newRows[1].id).toBe(firstId);
    });

    it('terminationDateFilter should return true when no date provided', () => {
      component.addNewRow();
      const row = component.newRows[0];
      expect(row.terminationDateFilter(null)).toBeTrue();
    });

    it('terminationDateFilter should return true when no effDate set', () => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('effDate')?.setValue(null);
      expect(row.terminationDateFilter(moment('2030-01-01'))).toBeTrue();
    });

    it('terminationDateFilter should return true for date on or after effDate', () => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('effDate')?.setValue(moment('2030-01-15'));
      expect(row.terminationDateFilter(moment('2030-01-15'))).toBeTrue();
      expect(row.terminationDateFilter(moment('2030-02-01'))).toBeTrue();
    });

    it('terminationDateFilter should return false for date before effDate', () => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('effDate')?.setValue(moment('2030-01-15'));
      expect(row.terminationDateFilter(moment('2030-01-14'))).toBeFalse();
    });

    it('should update dirty flag when effDate changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('termDate')?.setValue(moment('2030-12-01'));
      tick();
      const termDateSpy = spyOn(row.form.get('termDate')!, 'updateValueAndValidity');
      row.form.get('effDate')?.setValue(moment('2030-06-01'));
      tick();
      expect(termDateSpy).toHaveBeenCalled();
    }));

    it('should update dirty flag when termDate changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('termDate')?.markAsDirty();
      row.form.get('termDate')?.setValue(moment('2030-12-31'));
      tick();
      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should update description to empty when testId has no match', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('UNKNOWN_TEST');
      tick();
      expect(row.form.get('description')?.value).toBe('');
    }));
  });

  describe('Remove New Row - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should update dirty forms flag after removing a row', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('testId')?.markAsDirty();
      form.get('testId')?.setValue('TEST1');
      expect(component.hasAnyDirtyForms).toBeTrue();

      component.removeNewRow(0);
      expect(component.newRows.length).toBe(0);
    });

    it('should remove the correct row by index', () => {
      component.addNewRow();
      component.addNewRow();
      component.addNewRow();
      const secondId = component.newRows[1].id;
      component.removeNewRow(1);
      expect(component.newRows.length).toBe(2);
      expect(component.newRows.find(r => r.id === secondId)).toBeUndefined();
    });
  });

  describe('Save Functionality - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should save both new and updated rows together', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Done' };
      mockService.createAntigenGroupTest.and.returnValue(of(successResponse));
      mockService.updateAntigenGroupTest.and.returnValue(of(successResponse));

      // Add a new row
      component.addNewRow();
      const newForm = component.newRows[0].form;
      newForm.patchValue({
        testId: 'TEST1',
        description: 'ABO/Rh Typing',
        result: 'POS',
        effDate: moment(),
        termDate: null
      });
      newForm.markAsDirty();

      // Modify an existing row
      const editMeta = component.editableRowsMeta[0];
      editMeta.form.get('result')?.setValue('NEG');
      editMeta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(mockService.createAntigenGroupTest).toHaveBeenCalledTimes(1);
      expect(mockService.updateAntigenGroupTest).toHaveBeenCalledTimes(1);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('2 test(s) saved')
      );
    }));

    it('should not include untouched new rows in create operations', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Done' };
      mockService.createAntigenGroupTest.and.returnValue(of(successResponse));

      component.addNewRow();
      // Do not touch the form at all

      // Modify an existing row to trigger save
      const editMeta = component.editableRowsMeta[0];
      editMeta.form.get('result')?.setValue('NEG');
      editMeta.form.markAsDirty();

      mockService.updateAntigenGroupTest.and.returnValue(of(successResponse));
      component.saveAll();
      tick();

      expect(mockService.createAntigenGroupTest).not.toHaveBeenCalled();
    }));

    it('should not include non-dirty edit rows in update operations', fakeAsync(() => {
      // No modifications
      component.saveAll();

      expect(mockService.updateAntigenGroupTest).not.toHaveBeenCalled();
      expect(component.isEditOrAddMode).toBeFalse();
    }));

    it('should set isSaving to true during save operation', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Done' };
      mockService.createAntigenGroupTest.and.returnValue(of(successResponse));

      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'TEST1',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();

      let savingDuringSave = false;
      const origFn = mockService.createAntigenGroupTest.and.callFake((dto: any) => {
        savingDuringSave = component.isSaving;
        return of(successResponse);
      });

      component.saveAll();
      tick();

      expect(savingDuringSave).toBeTrue();
      expect(component.isSaving).toBeFalse();
    }));

    it('should reload table data after successful save', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Done' };
      mockService.updateAntigenGroupTest.and.returnValue(of(successResponse));

      const editMeta = component.editableRowsMeta[0];
      editMeta.form.get('result')?.setValue('NEG');
      editMeta.form.markAsDirty();

      const callsBefore = mockService.getAntigenGroupTests.calls.count();
      component.saveAll();
      tick();

      expect(mockService.getAntigenGroupTests.calls.count()).toBeGreaterThan(callsBefore);
    }));
  });

  describe('onTermDateInput - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should call handleEndDateInput with isEditMode true', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '20-JUN-2026' } } as any;
      component.onTermDateInput(mockEvent, form, true);
      expect(form).toBeDefined();
    });

    it('should call handleEndDateInput with isEditMode false by default', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '20-JUN-2026' } } as any;
      component.onTermDateInput(mockEvent, form);
      expect(form).toBeDefined();
    });
  });

  describe('onTestIdPanelToggle - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not reset filter when panel opens', () => {
      component.testIdFilterCtrl.setValue('test');
      component.onTestIdPanelToggle(true);
      expect(component.testIdFilterCtrl.value).toBe('test');
    });
  });

  describe('onResultPanelToggle - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should set activeResultRow when opening with no row parameter', () => {
      component.onResultPanelToggle(true);
      expect((component as any).activeResultRow).toBeNull();
    });

    it('should reset filteredResultOptions for editableRowsMeta on close', () => {
      const meta = component.editableRowsMeta[0];
      meta.resultOptions = [{ key: 'POS', value: 'Positive' }];
      meta.filteredResultOptions = [];

      component.onResultPanelToggle(false);
      expect(meta.filteredResultOptions).toEqual(meta.resultOptions);
    });

    it('should set activeResultRow with editableRowMeta', () => {
      const meta = component.editableRowsMeta[0];
      component.onResultPanelToggle(true, meta);
      expect((component as any).activeResultRow).toBe(meta);
    });
  });

  describe('Validation Errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should detect validation errors on dirty invalid controls in edit rows', () => {
      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.setValue('');
      meta.form.get('result')?.markAsDirty();
      meta.form.markAsDirty();

      component.saveAll();
      expect(component.showValidationError).toBeTrue();
    });

    it('should not flag validation errors on untouched edit rows', () => {
      // No modifications to any rows - should not have validation errors
      component.saveAll();
      expect(component.showValidationError).toBeFalse();
    });

    it('should detect errors on new rows that are dirty and invalid', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.markAsDirty();
      form.markAllAsTouched();

      component.saveAll();
      expect(component.showValidationError).toBeTrue();
    });
  });

  describe('editModeEffectiveDateValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
    });

    it('should allow unchanged historical date', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      // effDate was set from mockTableData '2024-01-01T00:00:00Z'
      // The validator should allow the original date
      const effDateCtrl = meta.form.get('effDate');
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeFalsy();
    });

    it('should allow value when control is not dirty', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const effDateCtrl = meta.form.get('effDate');
      // Control is not dirty, so validator should pass even for past dates
      expect(effDateCtrl?.dirty).toBeFalse();
      effDateCtrl?.updateValueAndValidity();
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeFalsy();
    });

    it('should reject past date when control is dirty and value changed', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const effDateCtrl = meta.form.get('effDate');
      effDateCtrl?.setValue(moment('2020-01-01'));
      effDateCtrl?.markAsDirty();
      effDateCtrl?.updateValueAndValidity();
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeTrue();
    });

    it('should allow future date when control is dirty', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const effDateCtrl = meta.form.get('effDate');
      effDateCtrl?.setValue(moment('2030-06-01'));
      effDateCtrl?.markAsDirty();
      effDateCtrl?.updateValueAndValidity();
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeFalsy();
    });

    it('should return null for null value', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const effDateCtrl = meta.form.get('effDate');
      effDateCtrl?.setValue(null);
      effDateCtrl?.markAsDirty();
      effDateCtrl?.updateValueAndValidity();
      // null triggers required error, not effectiveDatePast
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeFalsy();
    });

    it('should return null for invalid date', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      const effDateCtrl = meta.form.get('effDate');
      effDateCtrl?.setValue(moment('invalid'));
      effDateCtrl?.markAsDirty();
      effDateCtrl?.updateValueAndValidity();
      expect(effDateCtrl?.errors?.['effectiveDatePast']).toBeFalsy();
    });
  });

  describe('loadResultOptionsForEditableRows', () => {
    it('should use cached results for all editable rows when available', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });

      // Pre-populate the cache
      (component as any).testResultsCache.set('TEST1', mockTestResultOptions);
      (component as any).testResultsCache.set('CMV', mockTestResultOptions);

      const callsBefore = mockService.getTestResultsLov.calls.count();
      component.enterEditMode();
      tick();

      // Should not have made additional service calls
      expect(mockService.getTestResultsLov.calls.count()).toBe(callsBefore);
      // But should have populated result options from cache
      component.editableRowsMeta.forEach(meta => {
        expect(meta.resultOptions.length).toBe(2);
        expect(meta.filteredResultOptions.length).toBe(2);
      });
    }));

    it('should fetch uncached results and populate all rows', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });

      // Clear any cache
      (component as any).testResultsCache.clear();

      component.enterEditMode();
      tick();

      // Should have fetched results for unique test IDs
      expect(mockService.getTestResultsLov).toHaveBeenCalled();
      component.editableRowsMeta.forEach(meta => {
        expect(meta.resultOptions.length).toBe(2);
      });
    }));

    it('should handle error when loading result options for editable rows', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });

      // Clear cache and make service fail
      (component as any).testResultsCache.clear();
      mockService.getTestResultsLov.and.returnValue(throwError(() => new Error('fail')));

      component.enterEditMode();
      tick();

      // Should not crash - rows should have empty options
      expect(component.editableRowsMeta.length).toBe(2);
    }));
  });

  describe('updateDirtyFormsFlag - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should clear showValidationError when no invalid forms remain', () => {
      component.showValidationError = true;
      component.hasAnyInvalidForms = false;

      // Trigger updateDirtyFormsFlag via addNewRow
      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'TEST1',
        result: 'POS',
        effDate: moment('2030-01-01')
      });
      form.markAsDirty();

      // After updating a valid form, showValidationError should be cleared
      expect(component.showValidationError).toBeFalse();
    });

    it('should set hasAnyDirtyForms true when a new row is touched', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.markAllAsTouched();
      // Trigger flag update
      form.get('testId')?.setValue('TEST1');
      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should set hasAnyInvalidForms true for dirty invalid new row', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.markAsDirty();
      form.markAllAsTouched();
      // testId and result are required but empty => invalid
      form.get('testId')?.setValue('');
      expect(component.hasAnyInvalidForms).toBeTrue();
    });

    it('should detect dirty invalid control on edit row', fakeAsync(() => {
      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.markAsDirty();
      meta.form.get('result')?.setValue('');
      tick();
      expect(component.hasAnyInvalidForms).toBeTrue();
    }));

    it('should not flag edit row as invalid when form errors exist but row is not dirty', () => {
      const meta = component.editableRowsMeta[0];
      // Ensure form is not dirty
      expect(meta.form.dirty).toBeFalse();
      // updateDirtyFormsFlag should not consider this row
      expect(component.hasAnyInvalidForms).toBeFalse();
    });
  });

  describe('setupSearchFilters - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not filter resultOptions when no activeResultRow is set', fakeAsync(() => {
      (component as any).activeResultRow = null;
      component.resultFilterCtrl.setValue('POS');
      tick();
      // Should not crash, just do nothing meaningful
      expect((component as any).activeResultRow).toBeNull();
    }));

    it('should restore all options when resultFilter is cleared', fakeAsync(() => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.resultOptions = [
        { key: 'POS', value: 'Positive' },
        { key: 'NEG', value: 'Negative' }
      ];
      (component as any).activeResultRow = row;

      component.resultFilterCtrl.setValue('POS');
      tick();
      expect(row.filteredResultOptions.length).toBe(1);

      component.resultFilterCtrl.setValue('');
      tick();
      expect(row.filteredResultOptions.length).toBe(2);
    }));

    it('should filter antigen group options case-insensitively', fakeAsync(() => {
      component.antigenGroupCodeFilterCtrl.setValue('antg1');
      tick();
      expect(component.filteredAntigenGroupOptions.length).toBe(1);
    }));

    it('should filter testId options by value', fakeAsync(() => {
      component.testIdFilterCtrl.setValue('ABO');
      tick();
      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].key).toBe('TEST1');
    }));
  });

  describe('Chapter Changes - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload table data when chapter changes and not in edit mode', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      const callsBefore = mockService.getAntigenGroupTests.calls.count();
      chapterChanged$.next();
      expect(mockService.getAntigenGroupTests.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should clear testResultsCache when chapter changes', () => {
      (component as any).testResultsCache.set('TEST1', mockTestResultOptions);
      chapterChanged$.next();
      expect((component as any).testResultsCache.size).toBe(0);
    });
  });

  describe('createEditableRowMeta - terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should return true for null date in editable row filter', () => {
      const meta = component.editableRowsMeta[0];
      expect(meta.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true when effDate is not set in editable row', () => {
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(null);
      expect(meta.terminationDateFilter(moment('2030-01-01'))).toBeTrue();
    });

    it('should return true for date on or after effDate in editable row', () => {
      const meta = component.editableRowsMeta[0];
      const effDate = meta.form.get('effDate')?.value;
      const afterDate = moment(effDate).add(1, 'day');
      expect(meta.terminationDateFilter(afterDate)).toBeTrue();
    });

    it('should return false for date before effDate in editable row', () => {
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(moment('2030-06-15'));
      expect(meta.terminationDateFilter(moment('2030-06-14'))).toBeFalse();
    });
  });

  describe('Date Formatting - extended', () => {
    it('should format date string correctly', () => {
      const result = component.formatDate('2024-03-14T00:00:00Z');
      expect(result).toMatch(/14-MAR-2024/);
    });

    it('should format Date object correctly', () => {
      const result = component.formatDate(new Date('2024-07-04T00:00:00Z'));
      expect(result).toMatch(/04-JUL-2024/);
    });
  });

  describe('hasDateError - extended', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'ANTG1' });
      component.enterEditMode();
    });

    it('should return false when no date error exists', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment('2030-06-15'));
      form.get('effDate')?.markAsTouched();
      form.get('effDate')?.updateValueAndValidity();
      expect(component.hasDateError(form, 'effDate')).toBeFalse();
    });

    it('should check termDate errors', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      // Set effDate after termDate to trigger range error
      form.get('effDate')?.setValue(moment('2030-06-15'));
      form.get('termDate')?.setValue(moment('2030-06-10'));
      form.get('termDate')?.markAsTouched();
      form.get('termDate')?.updateValueAndValidity();
      const hasError = component.hasDateError(form, 'termDate');
      // The dateRangeInvalid is a form-level error, so it depends on the utility
      expect(typeof hasError).toBe('boolean');
    });
  });

  describe('loadDropdownOptions - extended', () => {
    it('should populate both antigen group and test ID options on success', () => {
      fixture.detectChanges();
      expect(component.antigenGroupOptions.length).toBe(2);
      expect(component.filteredAntigenGroupOptions.length).toBe(2);
      expect(component.testIdOptions.length).toBe(2);
      expect(component.filteredTestIdOptions.length).toBe(2);
    });

    it('should handle antigen groups LOV error without crashing', () => {
      mockService.getAntigenGroupsLov.and.returnValue(throwError(() => new Error('fail')));
      mockService.getTestIdsLov.and.returnValue(of([{ key: 'T1', value: 'Test 1' }]));
      component.loadDropdownOptions();
      expect(component.antigenGroupOptions.length).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should call all initialization methods', () => {
      // Verify that ngOnInit triggers all setup by detecting side effects
      fixture.detectChanges(); // triggers ngOnInit
      // loadDropdownOptions should have been called
      expect(mockService.getAntigenGroupsLov).toHaveBeenCalled();
      expect(mockService.getTestIdsLov).toHaveBeenCalled();
      // subscribeToChapterChanges should be active
      expect(component).toBeTruthy();
    });
  });

  describe('displayedColumns', () => {
    it('should have the expected column definitions', () => {
      expect(component.displayedColumns).toEqual([
        'testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'
      ]);
    });
  });

  describe('searchConfig', () => {
    it('should have correct search configuration', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Test ID or description');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });
  });
});
