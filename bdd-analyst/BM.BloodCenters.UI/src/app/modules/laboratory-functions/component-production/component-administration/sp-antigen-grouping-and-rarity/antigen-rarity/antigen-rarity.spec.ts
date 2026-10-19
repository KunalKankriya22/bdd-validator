import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import moment from 'moment';

import { AntigenRarityComponent } from './antigen-rarity';
import { AntigenRarityApiService } from '../services/antigen-rarity-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { AntigenRarityTest, CombinationNumberDropdown, LookUp, ReturnResult } from '../models/sp-antigen-grouping.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AntigenRarityComponent', () => {
  let component: AntigenRarityComponent;
  let fixture: ComponentFixture<AntigenRarityComponent>;
  let mockService: jasmine.SpyObj<AntigenRarityApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockCombinations: CombinationNumberDropdown[] = [
    { matrixId: 1, rarityPercent: 0.05 },
    { matrixId: 2, rarityPercent: 0.10 }
  ];

  const mockTestIds: LookUp[] = [
    { key: 'TEST1', value: 'ABO/Rh Typing' },
    { key: 'CMV', value: 'CMV Antibody Test' }
  ];

  const mockResultOptions: LookUp[] = [
    { key: 'POS', value: 'Positive' },
    { key: 'NEG', value: 'Negative' }
  ];

  const mockTableData: AntigenRarityTest[] = [
    {
      testId: 'TEST1',
      description: 'ABO/Rh Typing',
      result: 'POS',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      modificationDate: '2024-05-12T10:30:00Z',
      matrixId: 1
    },
    {
      testId: 'CMV',
      description: 'CMV Antibody Test',
      result: 'NEG',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      modificationDate: '2024-05-12T10:30:00Z',
      matrixId: 1
    }
  ];

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('AntigenRarityApiService', [
      'getMatrixIdsLov',
      'getTestIdsLov',
      'getTestResultsLov',
      'getDetailsByMatrixId',
      'createHeader',
      'createDetail',
      'updateDetail'
    ]);

    mockService.getMatrixIdsLov.and.returnValue(of(mockCombinations));
    mockService.getTestIdsLov.and.returnValue(of(mockTestIds));
    mockService.getTestResultsLov.and.returnValue(of(mockResultOptions));
    mockService.getDetailsByMatrixId.and.returnValue(of({
      data: mockTableData,
      totalRecords: 2
    }));

    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    TestBed.configureTestingModule({
      imports: [
        AntigenRarityComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AntigenRarityApiService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(AntigenRarityComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize filterForm with correct controls', () => {
      expect(component.filterForm.get('combinationNumber')).toBeTruthy();
      expect(component.filterForm.get('rarityPercent')).toBeTruthy();
    });

    it('should initialize headerForm with correct controls', () => {
      expect(component.headerForm.contains('rarityPercent')).toBeTrue();
    });

    it('should have rarityPercent disabled in filterForm', () => {
      expect(component.filterForm.get('rarityPercent')?.disabled).toBeTrue();
    });

    it('should initialize with default values', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.filteredDataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.testIdSortDirection).toBe('asc');
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.showValidationError).toBeFalse();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
      expect(component.isSaving).toBeFalse();
    });

    it('should call ngOnInit lifecycle methods', () => {
      fixture.detectChanges();
      expect(mockService.getMatrixIdsLov).toHaveBeenCalled();
      expect(mockService.getTestIdsLov).toHaveBeenCalled();
    });

    it('should handle dropdown loading failure for getMatrixIdsLov', () => {
      mockService.getMatrixIdsLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.combinationNumberOptions.length).toBe(0);
    });

    it('should handle dropdown loading failure for getTestIdsLov', () => {
      mockService.getTestIdsLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.testIdOptions.length).toBe(0);
    });

    it('should populate combinationNumberOptions after loadDropdownOptions', () => {
      fixture.detectChanges();
      expect(component.combinationNumberOptions.length).toBe(2);
      expect(component.filteredCombinationNumberOptions.length).toBe(2);
    });

    it('should populate testIdOptions after loadDropdownOptions', () => {
      fixture.detectChanges();
      expect(component.testIdOptions.length).toBe(2);
      expect(component.filteredTestIdOptions.length).toBe(2);
    });
  });

  describe('Getters', () => {
    it('should return empty string for currentCombinationNumber when no value set', () => {
      expect(component.currentCombinationNumber).toBe('');
    });

    it('should return the selected combination number', () => {
      component.filterForm.get('combinationNumber')?.setValue(1, { emitEvent: false });
      expect(component.currentCombinationNumber).toBe(1);
    });

    it('should return false for isNewCombination by default', () => {
      expect(component.isNewCombination).toBeFalse();
    });

    it('should return true for isNewCombination when NEW is selected', () => {
      component.filterForm.get('combinationNumber')?.setValue('NEW', { emitEvent: false });
      expect(component.isNewCombination).toBeTrue();
    });

    it('should return editableRows as array of FormGroups', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      expect(component.editableRows.length).toBe(component.editableRowsMeta.length);
      component.editableRows.forEach(fg => {
        expect(fg.get('testId')).toBeTruthy();
      });
    });

    it('should return minDate from DateFieldValidationUtility', () => {
      const minDate = component.minDate;
      expect(minDate).toBeDefined();
    });
  });

  describe('Filter Changes (combinationNumber)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load table data when a numeric combination is selected', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(mockService.getDetailsByMatrixId).toHaveBeenCalledWith(1, 100, 0);
      expect(component.dataSource.length).toBe(2);
    });

    it('should display rarity percent when a combination is selected', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.filterForm.get('rarityPercent')?.value).toBe('0.050%');
    });

    it('should clear data when combination is deselected (empty value)', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.dataSource.length).toBe(2);

      component.filterForm.patchValue({ combinationNumber: '' });
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
      expect(component.filterForm.get('rarityPercent')?.value).toBe('');
    });

    it('should enter edit mode when NEW is selected', () => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      expect(component.isEditOrAddMode).toBeTrue();
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
      expect(component.filterForm.get('rarityPercent')?.value).toBe('');
    });

    it('should add a new row automatically when NEW is selected', () => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      expect(component.newRows.length).toBe(1);
    });

    it('should exit edit mode when combination number changes while editing', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();

      component.filterForm.patchValue({ combinationNumber: 2 });
      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should reset search text and sort direction on combination change', () => {
      component.searchText = 'some search';
      component.testIdSortDirection = 'desc';
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.searchText).toBe('');
      expect(component.testIdSortDirection).toBe('asc');
    });

    it('should show empty rarity percent when combination has no rarityPercent', () => {
      component.combinationNumberOptions = [{ matrixId: 99, rarityPercent: null }];
      component.filterForm.patchValue({ combinationNumber: 99 });
      expect(component.filterForm.get('rarityPercent')?.value).toBe('');
    });
  });

  describe('Load Table Data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if no combination number is set', () => {
      component.filterForm.get('combinationNumber')?.setValue('', { emitEvent: false });
      component.loadTableData();
      expect(component.isLoading).toBeFalse();
      expect(mockService.getDetailsByMatrixId).not.toHaveBeenCalled();
    });

    it('should return early if combination number is NEW', () => {
      component.filterForm.get('combinationNumber')?.setValue('NEW', { emitEvent: false });
      component.loadTableData();
      expect(component.isLoading).toBeFalse();
    });

    it('should populate dataSource from API response', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].testId).toBe('TEST1');
      expect(component.isLoading).toBeFalse();
    });

    it('should set hasError on non-404 API failure', () => {
      mockService.getDetailsByMatrixId.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    });

    it('should handle 404 error by clearing data without setting hasError', () => {
      mockService.getDetailsByMatrixId.and.returnValue(throwError(() => ({ status: 404 })));
      component.filterForm.patchValue({ combinationNumber: 1 });
      expect(component.hasError).toBeFalse();
      expect(component.dataSource.length).toBe(0);
      expect(component.filteredDataSource.length).toBe(0);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
    });

    it('should enter edit mode', () => {
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();
      expect(component.showValidationError).toBeFalse();
      expect(component.newRows.length).toBe(0);
      expect(component.editableRowsMeta.length).toBe(component.filteredDataSource.length);
    });

    it('should create editable row meta for each filtered data row', () => {
      component.enterEditMode();
      expect(component.editableRowsMeta.length).toBe(2);
      component.editableRowsMeta.forEach(meta => {
        expect(meta.form).toBeDefined();
        expect(meta.originalRow).toBeDefined();
        expect(meta.terminationDateFilter).toBeDefined();
        expect(meta.resultOptions).toBeDefined();
      });
    });

    it('should load result options for editable rows on enter', () => {
      component.enterEditMode();
      // Two unique testIds (TEST1, CMV), so getTestResultsLov called for uncached ones
      expect(mockService.getTestResultsLov).toHaveBeenCalled();
    });

    it('should exit edit mode', () => {
      component.enterEditMode();
      component.exitEditMode();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.showValidationError).toBeFalse();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });

    it('should cancel edit mode for existing combination', () => {
      component.enterEditMode();
      component.cancelEdit();
      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should cancel edit mode and reset combination for NEW', () => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      // NEW auto-enters edit mode
      expect(component.isEditOrAddMode).toBeTrue();

      component.cancelEdit();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.filterForm.get('combinationNumber')?.value).toBe('');
    });

    it('should update hasAnyDirtyForms when a form value changes', fakeAsync(() => {
      component.enterEditMode();
      expect(component.hasAnyDirtyForms).toBeFalse();

      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.markAsDirty();
      meta.form.get('result')?.setValue('NEG');
      tick();

      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should update termDate validity when effDate changes on editable row', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('termDate')?.setValue(moment().add(30, 'days'));
      tick();
      const termDateSpy = spyOn(meta.form.get('termDate')!, 'updateValueAndValidity');

      meta.form.get('effDate')?.setValue(moment());
      tick();

      expect(termDateSpy).toHaveBeenCalled();
    }));

    it('should update dirty flag when termDate changes on editable row', fakeAsync(() => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('termDate')?.markAsDirty();
      meta.form.get('termDate')?.setValue(moment().add(30, 'days'));
      tick();

      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should use cached result options when re-entering edit mode', fakeAsync(() => {
      component.enterEditMode();
      tick();
      const callCount = mockService.getTestResultsLov.calls.count();

      component.exitEditMode();
      component.enterEditMode();
      tick();

      // Should not make additional calls since results are cached
      expect(mockService.getTestResultsLov.calls.count()).toBe(callCount);
    }));

    it('should handle error when loading result options for editable rows', fakeAsync(() => {
      mockService.getTestResultsLov.and.returnValue(throwError(() => new Error('fail')));
      component.enterEditMode();
      tick();

      // Should not crash; result options remain empty
      component.editableRowsMeta.forEach(meta => {
        expect(meta.resultOptions).toEqual([]);
      });
    }));

    it('should create editable row with terminationDateFilter that works', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(moment('2024-06-01'));

      // Date same as effDate => allowed
      expect(meta.terminationDateFilter(moment('2024-06-01'))).toBeTrue();
      // Date after effDate => allowed
      expect(meta.terminationDateFilter(moment('2024-06-15'))).toBeTrue();
      // Date before effDate => not allowed
      expect(meta.terminationDateFilter(moment('2024-05-01'))).toBeFalse();
      // Null date => allowed
      expect(meta.terminationDateFilter(null)).toBeTrue();
    });

    it('should allow terminationDateFilter when effDate is null', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(null);
      expect(meta.terminationDateFilter(moment('2024-06-01'))).toBeTrue();
    });
  });

  describe('Add New Row', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should add a new row to the beginning of newRows', () => {
      const initialCount = component.newRows.length;
      component.addNewRow();
      expect(component.newRows.length).toBe(initialCount + 1);
      expect(component.newRows[0].form).toBeDefined();
      expect(component.newRows[0].resultOptions).toEqual([]);
    });

    it('should create form with required validators for new rows', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      expect(form.get('testId')?.hasError('required')).toBeTrue();
      expect(form.get('result')?.hasError('required')).toBeTrue();
      expect(form.get('description')?.disabled).toBeTrue();
    });

    it('should have testId enabled for new rows', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      expect(form.get('testId')?.enabled).toBeTrue();
    });

    it('should decrement newRowCounter for each new row', () => {
      component.addNewRow();
      const firstId = component.newRows[0].id;
      component.addNewRow();
      const secondId = component.newRows[0].id;
      expect(secondId).toBeLessThan(firstId);
    });

    it('should load result options when testId changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();

      expect(mockService.getTestResultsLov).toHaveBeenCalledWith('TEST1');
      expect(row.resultOptions.length).toBe(2);
    }));

    it('should update description when testId changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();

      expect(row.form.get('description')?.value).toBe('ABO/Rh Typing');
    }));

    it('should clear result when testId changes in new row', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('result')?.setValue('POS');
      row.form.get('testId')?.setValue('CMV');
      tick();

      expect(row.form.get('result')?.value).toBe('');
    }));

    it('should clear result options when testId is cleared', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();
      expect(row.resultOptions.length).toBe(2);

      row.form.get('testId')?.setValue('');
      tick();
      expect(row.resultOptions).toEqual([]);
    }));

    it('should use cached results on second testId selection', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('TEST1');
      tick();
      const callCount = mockService.getTestResultsLov.calls.count();

      component.addNewRow();
      const row2 = component.newRows[0];
      row2.form.get('testId')?.setValue('TEST1');
      tick();

      // Should use cache, no additional API call
      expect(mockService.getTestResultsLov.calls.count()).toBe(callCount);
      expect(row2.resultOptions.length).toBe(2);
    }));

    it('should handle result options load error in new row', fakeAsync(() => {
      mockService.getTestResultsLov.and.returnValue(throwError(() => new Error('fail')));
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('testId')?.setValue('UNKNOWN');
      tick();

      expect(row.resultOptions).toEqual([]);
      expect(row.filteredResultOptions).toEqual([]);
    }));

    it('should update dirty flag when new row form value changes', fakeAsync(() => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('result')?.markAsDirty();
      row.form.get('result')?.setValue('POS');
      tick();

      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should update termDate validity when effDate changes in new row', fakeAsync(() => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('termDate')?.setValue(moment().add(30, 'days'));
      tick();
      const termDateSpy = spyOn(form.get('termDate')!, 'updateValueAndValidity');

      form.get('effDate')?.setValue(moment());
      tick();

      expect(termDateSpy).toHaveBeenCalled();
    }));

    it('should create terminationDateFilter that works for new rows', () => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('effDate')?.setValue(moment('2024-06-01'));

      expect(row.terminationDateFilter(moment('2024-06-15'))).toBeTrue();
      expect(row.terminationDateFilter(moment('2024-05-01'))).toBeFalse();
      expect(row.terminationDateFilter(null)).toBeTrue();
    });

    it('should allow all dates when effDate is null in new row terminationDateFilter', () => {
      component.addNewRow();
      const row = component.newRows[0];
      row.form.get('effDate')?.setValue(null);
      expect(row.terminationDateFilter(moment('2020-01-01'))).toBeTrue();
    });
  });

  describe('Remove New Row', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should remove a new row by index', () => {
      component.addNewRow();
      component.addNewRow();
      expect(component.newRows.length).toBe(2);

      component.removeNewRow(0);
      expect(component.newRows.length).toBe(1);
    });

    it('should update dirty forms flag after removing a row', () => {
      component.addNewRow();
      component.addNewRow();
      component.removeNewRow(0);
      // The updateDirtyFormsFlag is called - no crash
      expect(component).toBeTruthy();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should not save if new row has validation errors', () => {
      component.addNewRow();
      component.saveAll();
      expect(component.showValidationError).toBeTrue();
      expect(component.isSaving).toBeFalse();
    });

    it('should exit edit mode without saving when no changes exist', () => {
      component.saveAll();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(mockService.createDetail).not.toHaveBeenCalled();
      expect(mockService.updateDetail).not.toHaveBeenCalled();
    });

    it('should call createDetail for new rows on existing combination', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Created' };
      mockService.createDetail.and.returnValue(of(successResponse));

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

      expect(mockService.createDetail).toHaveBeenCalledWith(
        jasmine.objectContaining({
          matrixId: 1,
          testId: 'TEST1',
          testResult: 'POS'
        })
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
      expect(component.isEditOrAddMode).toBeFalse();
    }));

    it('should call updateDetail for modified existing rows', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true, message: 'Updated' };
      mockService.updateDetail.and.returnValue(of(successResponse));

      const meta = component.editableRowsMeta.find(m => m.originalRow.testId === 'CMV')!;
      meta.form.get('result')?.setValue('POS');
      meta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(mockService.updateDetail).toHaveBeenCalledWith(
        1,
        'CMV',
        jasmine.objectContaining({ testResult: 'POS' })
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    }));

    it('should show correct count in success message for existing combination', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true };
      mockService.createDetail.and.returnValue(of(successResponse));
      mockService.updateDetail.and.returnValue(of(successResponse));

      // Add a new row
      component.addNewRow();
      const newForm = component.newRows[0].form;
      newForm.patchValue({ testId: 'TEST1', result: 'POS', effDate: moment() });
      newForm.markAsDirty();

      // Edit an existing row
      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.setValue('NEG');
      meta.form.markAsDirty();

      component.saveAll();
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Combination 1 saved successfully.');
    }));

    it('should reset isSaving on save error for existing combination', fakeAsync(() => {
      mockService.createDetail.and.returnValue(throwError(() => new Error('fail')));

      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({ testId: 'TEST1', result: 'POS', effDate: moment() });
      form.markAsDirty();

      component.saveAll();
      tick();

      expect(component.isSaving).toBeFalse();
    }));

    it('should reload table data and dropdown options after successful save', fakeAsync(() => {
      const successResponse: ReturnResult = { success: true };
      mockService.updateDetail.and.returnValue(of(successResponse));

      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.setValue('NEG');
      meta.form.markAsDirty();

      mockService.getDetailsByMatrixId.calls.reset();
      mockService.getMatrixIdsLov.calls.reset();

      component.saveAll();
      tick();

      expect(mockService.getDetailsByMatrixId).toHaveBeenCalled();
      expect(mockService.getMatrixIdsLov).toHaveBeenCalled();
    }));
  });

  describe('Save New Combination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate headerForm when saving new combination', () => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      // headerForm is invalid (missing required fields)
      component.saveAll();
      expect(component.showValidationError).toBeTrue();
      expect(component.isSaving).toBeFalse();
    });

    it('should create header and then create details for new combination', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });

      const headerResponse = { item: 5 } as any;
      mockService.createHeader.and.returnValue(of(headerResponse));
      mockService.createDetail.and.returnValue(of({ success: true }));

      // Fill header form
      component.headerForm.patchValue({
        rarityPercent: 10,
        effDate: moment(),
        termDate: null
      });
      component.headerForm.markAllAsTouched();

      // Fill the auto-created new row
      const newRowForm = component.newRows[0].form;
      newRowForm.patchValue({
        testId: 'TEST1',
        result: 'POS',
        effDate: moment()
      });
      newRowForm.markAsDirty();

      component.saveAll();
      tick();

      expect(mockService.createHeader).toHaveBeenCalledWith(
        jasmine.objectContaining({ rarityPercent: 10 })
      );
      expect(mockService.createDetail).toHaveBeenCalledWith(
        jasmine.objectContaining({ matrixId: 5, testId: 'TEST1' })
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('New combination created successfully.');
      expect(component.isEditOrAddMode).toBeFalse();
    }));

    it('should handle createHeader returning invalid matrixId', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });

      const headerResponse = { item: 0 } as any;
      mockService.createHeader.and.returnValue(of(headerResponse));

      component.headerForm.patchValue({
        rarityPercent: 10,
        effDate: moment()
      });
      component.headerForm.markAllAsTouched();

      const newRowForm = component.newRows[0].form;
      newRowForm.patchValue({ testId: 'TEST1', result: 'POS', effDate: moment() });
      newRowForm.markAsDirty();

      component.saveAll();
      tick();

      // Should hit the error path due to throw new Error('Failed to create combination header.')
      expect(component.isSaving).toBeFalse();
    }));

    it('should call createHeader even when no detail rows need saving', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });

      const headerResponse = { item: 5 } as any;
      mockService.createHeader.and.returnValue(of(headerResponse));

      component.headerForm.patchValue({
        rarityPercent: 10,
        effDate: moment()
      });
      component.headerForm.markAllAsTouched();

      // Remove the auto-added row so there are no details to save
      component.newRows = [];

      component.saveAll();
      tick();

      expect(mockService.createHeader).toHaveBeenCalled();
      expect(mockService.createDetail).not.toHaveBeenCalled();
    }));

    it('should reset isSaving on createHeader error', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });

      mockService.createHeader.and.returnValue(throwError(() => new Error('fail')));

      component.headerForm.patchValue({
        rarityPercent: 10,
        effDate: moment()
      });
      component.headerForm.markAllAsTouched();

      component.saveAll();
      tick();

      expect(component.isSaving).toBeFalse();
    }));

    it('should reset combination and reload options after successful new combination save', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 'NEW' });

      const headerResponse = { item: 5 } as any;
      mockService.createHeader.and.returnValue(of(headerResponse));
      mockService.createDetail.and.returnValue(of({ success: true }));

      component.headerForm.patchValue({
        rarityPercent: 10,
        effDate: moment(),
        termDate: null
      });
      component.headerForm.markAllAsTouched();

      // Fill the auto-created new row so there is a detail to save
      const newRowForm = component.newRows[0].form;
      newRowForm.patchValue({ testId: 'TEST1', result: 'POS', effDate: moment() });
      newRowForm.markAsDirty();

      mockService.getMatrixIdsLov.calls.reset();

      component.saveAll();
      tick();

      expect(component.filterForm.get('combinationNumber')?.value).toBe('');
      expect(mockService.getMatrixIdsLov).toHaveBeenCalled();
    }));
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
    });

    it('should filter data by testId on search', () => {
      component.onSearch('TEST1');
      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].testId).toBe('TEST1');
    });

    it('should filter data by description on search', () => {
      component.onSearch('CMV');
      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].description).toBe('CMV Antibody Test');
    });

    it('should show all data when search is empty', () => {
      component.onSearch('TEST1');
      component.onSearch('');
      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });

    it('should be case insensitive when searching', () => {
      component.onSearch('test1');
      expect(component.filteredDataSource.length).toBe(1);
    });

    it('should return no results for non-matching search', () => {
      component.onSearch('NONEXISTENT');
      expect(component.filteredDataSource.length).toBe(0);
    });

    it('should sort filteredDataSource ascending by default', () => {
      component.onSearch('');
      expect(component.filteredDataSource[0].testId).toBe('CMV');
      expect(component.filteredDataSource[1].testId).toBe('TEST1');
    });

    it('should sort editable rows when in edit mode', () => {
      component.enterEditMode();
      component.onSearch('');
      expect(component.editableRowsMeta[0].originalRow.testId).toBe('CMV');
    });
  });

  describe('Sort', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
    });

    it('should toggle sort direction from asc to desc', () => {
      expect(component.testIdSortDirection).toBe('asc');
      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('desc');
    });

    it('should toggle sort direction from desc to asc', () => {
      component.testIdSortDirection = 'desc';
      component.toggleTestIdSort();
      expect(component.testIdSortDirection).toBe('asc');
    });

    it('should re-sort filteredDataSource on toggle', () => {
      component.toggleTestIdSort();
      expect(component.filteredDataSource[0].testId).toBe('TEST1');
      expect(component.filteredDataSource[1].testId).toBe('CMV');
    });
  });

  describe('Date Formatting', () => {
    it('should return "-" for null dates', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should format a valid date correctly', () => {
      const result = component.formatDate('2024-06-15T10:30:00Z');
      expect(result).toMatch(/15-JUN-2024/);
    });

    it('should format a Date object correctly', () => {
      const result = component.formatDate(new Date('2024-03-20'));
      expect(result).toContain('20-MAR-2024');
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should get effDate error message', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(null);
      form.get('effDate')?.markAsTouched();
      form.get('effDate')?.updateValueAndValidity();

      const msg = component.getDateErrorMessage(form, 'effDate');
      expect(msg).toBeTruthy();
    });

    it('should get termDate error message (returns string)', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const msg = component.getDateErrorMessage(form, 'termDate');
      expect(typeof msg).toBe('string');
    });

    it('should detect date errors via hasDateError', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(null);
      form.get('effDate')?.markAsTouched();
      form.get('effDate')?.updateValueAndValidity();

      expect(component.hasDateError(form, 'effDate')).toBeTrue();
    });

    it('should return false for hasDateError when no error', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment());
      form.get('effDate')?.updateValueAndValidity();

      expect(component.hasDateError(form, 'effDate')).toBeFalse();
    });

    it('should handle onEffDateInput', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '15-JUN-2026' } } as any;
      component.onEffDateInput(mockEvent, form);
      expect(form).toBeDefined();
    });

    it('should handle onTermDateInput without edit mode flag', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '20-JUN-2026' } } as any;
      component.onTermDateInput(mockEvent, form);
      expect(form).toBeDefined();
    });

    it('should handle onTermDateInput with edit mode flag', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      const mockEvent = { target: { value: '20-JUN-2026' } } as any;
      component.onTermDateInput(mockEvent, form, true);
      expect(form).toBeDefined();
    });
  });

  describe('Required Field Error', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should return error message when field is required and touched', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('testId')?.markAsTouched();
      form.get('testId')?.updateValueAndValidity();

      const error = component.getRequiredFieldError(form, 'testId', 'Test ID');
      expect(error).toBe('Test ID is required.');
    });

    it('should return empty string when field has value', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('testId')?.setValue('TEST1');

      const error = component.getRequiredFieldError(form, 'testId', 'Test ID');
      expect(error).toBe('');
    });

    it('should return empty string when field is required but not touched', () => {
      component.addNewRow();
      const form = component.newRows[0].form;

      const error = component.getRequiredFieldError(form, 'testId', 'Test ID');
      expect(error).toBe('');
    });
  });

  describe('Rarity Percent Error', () => {
    it('should return empty string when control has no errors', () => {
      component.headerForm.get('rarityPercent')?.setValue(10);
      expect(component.getRarityPercentError()).toBe('');
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getRarityPercentError()).toBe('');
    });

    it('should return required error message', () => {
      component.headerForm.get('rarityPercent')?.setValue(null);
      component.headerForm.get('rarityPercent')?.markAsTouched();
      component.headerForm.get('rarityPercent')?.updateValueAndValidity();

      expect(component.getRarityPercentError()).toBe('Rarity Percent is required.');
    });

    it('should return range error for value below min', () => {
      component.headerForm.get('rarityPercent')?.setValue(-1);
      component.headerForm.get('rarityPercent')?.markAsTouched();
      component.headerForm.get('rarityPercent')?.updateValueAndValidity();

      expect(component.getRarityPercentError()).toBe('Must be between 0 and 50.');
    });

    it('should return range error for value above max', () => {
      component.headerForm.get('rarityPercent')?.setValue(51);
      component.headerForm.get('rarityPercent')?.markAsTouched();
      component.headerForm.get('rarityPercent')?.updateValueAndValidity();

      expect(component.getRarityPercentError()).toBe('Must be between 0 and 50.');
    });
  });

  describe('Tooltip', () => {
    it('should enable tooltip when content overflows', () => {
      const mockElement = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      const mockTooltip = { disabled: true } as any;
      component.showTooltipIfOverflowing(mockElement, mockTooltip);
      expect(mockTooltip.disabled).toBeFalse();
    });

    it('should disable tooltip when content fits', () => {
      const mockElement = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      const mockTooltip = { disabled: false } as any;
      component.showTooltipIfOverflowing(mockElement, mockTooltip);
      expect(mockTooltip.disabled).toBeTrue();
    });

    it('should disable tooltip when content exactly fits', () => {
      const mockElement = { scrollWidth: 100, clientWidth: 100 } as HTMLElement;
      const mockTooltip = { disabled: false } as any;
      component.showTooltipIfOverflowing(mockElement, mockTooltip);
      expect(mockTooltip.disabled).toBeTrue();
    });
  });

  describe('Panel Toggle Handlers', () => {
    it('should reset testIdFilterCtrl when panel closes', () => {
      component.testIdFilterCtrl.setValue('search');
      component.onTestIdPanelToggle(false);
      expect(component.testIdFilterCtrl.value).toBe('');
    });

    it('should not reset testIdFilterCtrl when panel opens', () => {
      component.testIdFilterCtrl.setValue('search');
      component.onTestIdPanelToggle(true);
      expect(component.testIdFilterCtrl.value).toBe('search');
    });

    it('should set activeResultRow when result panel opens', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];

      component.onResultPanelToggle(true, row);
      expect((component as any).activeResultRow).toBe(row);
    });

    it('should set activeResultRow to null when no row passed on open', () => {
      component.onResultPanelToggle(true);
      expect((component as any).activeResultRow).toBeNull();
    });

    it('should clear activeResultRow and reset filters when result panel closes', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.resultOptions = [{ key: 'POS', value: 'Positive' }];

      component.onResultPanelToggle(true, row);
      component.onResultPanelToggle(false);

      expect((component as any).activeResultRow).toBeNull();
      expect(component.resultFilterCtrl.value).toBe('');
      expect(row.filteredResultOptions).toEqual(row.resultOptions);
    });

    it('should reset filtered result options for editable rows on panel close', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();

      component.editableRowsMeta.forEach(meta => {
        meta.resultOptions = [{ key: 'POS', value: 'Positive' }];
        meta.filteredResultOptions = [];
      });

      component.onResultPanelToggle(false);

      component.editableRowsMeta.forEach(meta => {
        expect(meta.filteredResultOptions).toEqual(meta.resultOptions);
      });
    });
  });

  describe('Search Filters (ngx-mat-select-search)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter combination number options when search text entered', fakeAsync(() => {
      component.combinationNumberFilterCtrl.setValue('1');
      tick();
      expect(component.filteredCombinationNumberOptions.length).toBe(1);
      expect(component.filteredCombinationNumberOptions[0].matrixId).toBe(1);
    }));

    it('should show all combination number options when search cleared', fakeAsync(() => {
      component.combinationNumberFilterCtrl.setValue('1');
      tick();
      component.combinationNumberFilterCtrl.setValue('');
      tick();
      expect(component.filteredCombinationNumberOptions.length).toBe(2);
    }));

    it('should filter testId options when search text entered', fakeAsync(() => {
      component.testIdFilterCtrl.setValue('CMV');
      tick();
      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].key).toBe('CMV');
    }));

    it('should show all testId options when search cleared', fakeAsync(() => {
      component.testIdFilterCtrl.setValue('CMV');
      tick();
      component.testIdFilterCtrl.setValue('');
      tick();
      expect(component.filteredTestIdOptions.length).toBe(2);
    }));

    it('should filter result options for activeResultRow when resultFilterCtrl changes', fakeAsync(() => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      component.addNewRow();
      const row = component.newRows[0];
      row.resultOptions = [
        { key: 'POS', value: 'Positive' },
        { key: 'NEG', value: 'Negative' }
      ];
      row.filteredResultOptions = [...row.resultOptions];
      (component as any).activeResultRow = row;

      component.resultFilterCtrl.setValue('POS');
      tick();

      expect(row.filteredResultOptions.length).toBe(1);
      expect(row.filteredResultOptions[0].key).toBe('POS');
    }));

    it('should not filter result options when no activeResultRow', fakeAsync(() => {
      (component as any).activeResultRow = null;
      component.resultFilterCtrl.setValue('POS');
      tick();
      // Should not crash
      expect(component).toBeTruthy();
    }));

    it('should filter by value as well as key', fakeAsync(() => {
      component.testIdFilterCtrl.setValue('Antibody');
      tick();
      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].key).toBe('CMV');
    }));
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should exit edit mode when chapter changes', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();

      chapterChanged$.next();
      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should clear test results cache on chapter change', () => {
      const cache = (component as any).testResultsCache as Map<string, LookUp[]>;
      cache.set('TEST1', mockResultOptions);
      expect(cache.size).toBe(1);

      chapterChanged$.next();
      expect(cache.size).toBe(0);
    });

    it('should reload table data on chapter change', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      mockService.getDetailsByMatrixId.calls.reset();

      chapterChanged$.next();
      expect(mockService.getDetailsByMatrixId).toHaveBeenCalled();
    });

    it('should not exit edit mode when not in edit mode on chapter change', () => {
      expect(component.isEditOrAddMode).toBeFalse();
      chapterChanged$.next();
      expect(component.isEditOrAddMode).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySub = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Validation Helpers (hasValidationErrors / updateDirtyFormsFlag)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.enterEditMode();
    });

    it('should detect validation errors on dirty new rows', () => {
      component.addNewRow();
      const form = component.newRows[0].form;
      form.markAsDirty();
      form.markAllAsTouched();

      component.saveAll();
      expect(component.showValidationError).toBeTrue();
    });

    it('should detect validation errors on dirty edited rows with invalid controls', () => {
      const meta = component.editableRowsMeta[0];
      meta.form.get('result')?.setValue('');
      meta.form.get('result')?.markAsDirty();
      meta.form.markAsDirty();

      component.saveAll();
      expect(component.showValidationError).toBeTrue();
    });

    it('should not flag errors on edited rows that are not dirty', () => {
      // No modifications made
      component.saveAll();
      expect(component.showValidationError).toBeFalse();
    });

    it('should clear showValidationError when no invalid forms remain', fakeAsync(() => {
      component.showValidationError = true;
      component.addNewRow();
      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'TEST1',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();
      tick();

      // updateDirtyFormsFlag runs and should clear showValidationError
      expect(component.showValidationError).toBeFalse();
    }));

    it('should set hasAnyDirtyForms true for NEW combination when headerForm is touched', fakeAsync(() => {
      component.exitEditMode();
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      tick();

      component.headerForm.markAllAsTouched();
      // Trigger updateDirtyFormsFlag via new row form change
      const newRowForm = component.newRows[0].form;
      newRowForm.get('result')?.markAsDirty();
      newRowForm.get('result')?.setValue('POS');
      tick();

      expect(component.hasAnyDirtyForms).toBeTrue();
    }));

    it('should set hasAnyInvalidForms true for NEW combination when headerForm is invalid and touched', fakeAsync(() => {
      component.exitEditMode();
      component.filterForm.patchValue({ combinationNumber: 'NEW' });
      tick();

      component.headerForm.get('rarityPercent')?.setValue(null);
      component.headerForm.markAllAsTouched();

      // Manually trigger the private method by modifying a new row
      component.addNewRow();
      const form = component.newRows[0].form;
      form.get('result')?.setValue('POS');
      tick();

      expect(component.hasAnyInvalidForms).toBeTrue();
    }));
  });

  describe('Edit Mode Effective Date Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ combinationNumber: 1 });
    });

    it('should allow unchanged historical date on editable row', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      // The effDate was set from the original row data
      // It should not have an effectiveDatePast error since it is unchanged
      expect(meta.form.get('effDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should allow null effDate without error', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      meta.form.get('effDate')?.setValue(null);
      meta.form.get('effDate')?.updateValueAndValidity();
      // required error but not effectiveDatePast
      expect(meta.form.get('effDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should have testId disabled for existing rows', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      expect(meta.form.get('testId')?.disabled).toBeTrue();
    });

    it('should have modificationDate disabled', () => {
      component.enterEditMode();
      const meta = component.editableRowsMeta[0];
      expect(meta.form.get('modificationDate')?.disabled).toBeTrue();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle combination with null rarityPercent', () => {
      component.combinationNumberOptions = [
        { matrixId: 99, rarityPercent: null }
      ];
      component.filteredCombinationNumberOptions = [...component.combinationNumberOptions];
      component.filterForm.patchValue({ combinationNumber: 99 });
      expect(component.filterForm.get('rarityPercent')?.value).toBe('');
    });

    it('should handle empty dataSource during applyFilters', () => {
      component.filterForm.patchValue({ combinationNumber: '' }, { emitEvent: false });
      component.onSearch('anything');
      expect(component.filteredDataSource.length).toBe(0);
    });

    it('should handle whitespace-only search text', () => {
      component.filterForm.patchValue({ combinationNumber: 1 });
      component.onSearch('   ');
      // whitespace-only search should still filter (trims and checks)
      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });

    it('should handle combination not found in options', () => {
      component.filterForm.patchValue({ combinationNumber: 999 });
      expect(component.filterForm.get('rarityPercent')?.value).toBe('');
    });
  });
});
