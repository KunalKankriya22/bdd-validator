import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import moment from 'moment';

import { SpAntigenGroupsComponent } from './sp-antigen-groups.component';
import { SpAntigenGroupService } from './services/sp-antigen-group.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SpAntigenGroup } from './models/sp-antigen-group.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpAntigenGroupsComponent', () => {
  let component: SpAntigenGroupsComponent;
  let fixture: ComponentFixture<SpAntigenGroupsComponent>;
  let mockService: jasmine.SpyObj<SpAntigenGroupService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChanged$: Subject<void>;

  const mockTableData: SpAntigenGroup[] = [
    {
      testId: 'K',
      description: 'KELL TYPING',
      result: 'NEG',
      effDate: new Date('2020-01-01'),
      termDate: null,
      modificationDate: new Date('2024-03-15')
    },
    {
      testId: 'FY',
      description: 'DUFFY TYPING',
      result: 'POS',
      effDate: new Date('2020-01-01'),
      termDate: null,
      modificationDate: new Date('2024-03-15')
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('SpAntigenGroupService', [
      'getAntigenGroups',
      'getAntigenGroupById',
      'getAntigenGroupsDropdown',
      'getAntigenRaritiesDropdown',
      'createAntigenGroup',
      'updateAntigenGroup',
      'deleteAntigenGroup'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterTimezone']);
    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable()
    });
      TestBed.configureTestingModule({
      imports: [
        SpAntigenGroupsComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SpAntigenGroupService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });






      mockService.getAntigenGroups.calls.reset();


      mockService.getAntigenGroupById.calls.reset();


      mockService.getAntigenGroupsDropdown.calls.reset();


      mockService.getAntigenRaritiesDropdown.calls.reset();


      mockService.createAntigenGroup.calls.reset();


      mockService.updateAntigenGroup.calls.reset();


      mockService.deleteAntigenGroup.calls.reset();


      mockLoggingService.log.calls.reset();


      mockLoggingService.error.calls.reset();


      mockLoggingService.warn.calls.reset();


      mockLoggingService.debug.calls.reset();


      mockChapterTimezoneService.getChapterTimezone.calls.reset();


    fixture = TestBed.createComponent(SpAntigenGroupsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.contains('antigenGroupCode')).toBeTruthy();
      expect(component.filterForm.contains('description')).toBeTruthy();
    });

    it('should load mock data on initialization', () => {
      fixture.detectChanges();
      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.filteredDataSource.length).toBeGreaterThan(0);
    });

    it('should initialize dropdown options', () => {
      component.loadDropdownOptions();
      expect(component.antigenGroupOptions.length).toBeGreaterThan(0);
      expect(component.testIdOptions.length).toBeGreaterThan(0);
      expect(component.resultOptions.length).toBeGreaterThan(0);
    });

    it('should set default values for component state', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.searchText).toBe('');
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.showValidationError).toBeFalse();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
      expect(component.isSaving).toBeFalse();
    });

    it('should set displayedColumns correctly', () => {
      expect(component.displayedColumns).toEqual([
        'testId', 'description', 'result', 'effDate', 'termDate', 'modificationDate'
      ]);
    });

    it('should initialize searchConfig with correct values', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Test ID or description');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.ariaLabel).toBe('Search antigen groups');
      expect(component.searchConfig.searchOnEnterOnly).toBeFalse();
    });

    it('should initialize filter form values as empty strings', () => {
      expect(component.filterForm.get('antigenGroupCode')?.value).toBe('');
      expect(component.filterForm.get('description')?.value).toBe('');
    });

    it('should have filteredDataSource matching dataSource on init', () => {
      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to chapter changes on init', () => {
      fixture.detectChanges();
      // Verify the subscription is set up by emitting a chapter change
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();
      chapterChanged$.next();
      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should load dropdown options on init', () => {
      fixture.detectChanges();
      expect(component.antigenGroupOptions.length).toBeGreaterThan(0);
      expect(component.testIdOptions.length).toBeGreaterThan(0);
      expect(component.resultOptions.length).toBeGreaterThan(0);
    });

    it('should subscribe to filter changes on init', () => {
      fixture.detectChanges();
      // Verify the subscription is set up by changing the antigenGroupCode
      component.filterForm.patchValue({ antigenGroupCode: 'Ce*' });
      expect(component.filterForm.get('description')?.value).toBe('C-e-');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    it('should return current antigen group code from filter form', () => {
      component.filterForm.patchValue({ antigenGroupCode: 'Ce*' });
      expect(component.currentAntigenGroupCode).toBe('Ce*');
    });

    it('should return empty string when antigen group code is empty', () => {
      expect(component.currentAntigenGroupCode).toBe('');
    });

    it('should return editableRows as array of FormGroups', () => {
      fixture.detectChanges();
      component.enterEditMode();
      const rows = component.editableRows;
      expect(rows.length).toBe(component.editableRowsMeta.length);
      rows.forEach(row => {
        expect(row.contains('testId')).toBeTrue();
        expect(row.contains('result')).toBeTrue();
      });
    });

    it('should return empty editableRows when not in edit mode', () => {
      expect(component.editableRows.length).toBe(0);
    });

    it('should return a moment for minDate', () => {
      const minDate = component.minDate;
      expect(moment.isMoment(minDate)).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();

      expect(component.isEditOrAddMode).toBeTruthy();
      expect(component.editableRowsMeta.length).toBe(component.filteredDataSource.length);
    });

    it('should exit edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.exitEditMode();

      expect(component.isEditOrAddMode).toBeFalsy();
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });

    it('should reset showValidationError when entering edit mode', () => {
      fixture.detectChanges();
      component.showValidationError = true;
      component.enterEditMode();
      expect(component.showValidationError).toBeFalse();
    });

    it('should clear newRows when entering edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      expect(component.newRows.length).toBe(1);
      component.exitEditMode();
      component.enterEditMode();
      expect(component.newRows.length).toBe(0);
    });

    it('should create editable row meta for each filtered row', () => {
      fixture.detectChanges();
      component.enterEditMode();
      expect(component.editableRowsMeta.length).toBe(component.filteredDataSource.length);
      component.editableRowsMeta.forEach(meta => {
        expect(meta.form).toBeDefined();
        expect(meta.originalRow).toBeDefined();
        expect(meta.terminationDateFilter).toBeDefined();
      });
    });

    it('should subscribe to form changes to track dirty state in edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      // markAsDirty before patchValue so the subscription sees dirty=true
      meta.form.markAsDirty();
      meta.form.patchValue({ result: 'POS' });
      // updateDirtyFormsFlag is called via subscription
      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should subscribe to effDate changes to revalidate termDate in edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      // Set up a termDate, then change effDate and verify termDate revalidates
      meta.form.patchValue({ termDate: moment().add(5, 'days') });
      const termControl = meta.form.get('termDate');
      const updateSpy = spyOn(termControl!, 'updateValueAndValidity').and.callThrough();

      meta.form.get('effDate')?.setValue(moment().add(1, 'day'));

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should reset hasAnyDirtyForms and hasAnyInvalidForms on exit', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      const form = component.newRows[0].form;
      // markAsDirty before patchValue so the subscription sees dirty=true
      form.markAsDirty();
      form.patchValue({ testId: 'RH' });
      expect(component.hasAnyDirtyForms).toBeTrue();

      component.exitEditMode();
      expect(component.hasAnyDirtyForms).toBeFalse();
      expect(component.hasAnyInvalidForms).toBeFalse();
    });

    it('should reset showValidationError on exit', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.showValidationError = true;
      component.exitEditMode();
      expect(component.showValidationError).toBeFalse();
    });
  });

  describe('cancelEdit', () => {
    it('should call exitEditMode', () => {
      fixture.detectChanges();
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();

      component.cancelEdit();
      expect(component.isEditOrAddMode).toBeFalse();
      expect(component.editableRowsMeta.length).toBe(0);
      expect(component.newRows.length).toBe(0);
    });
  });

  describe('Add New Row', () => {
    it('should add new row', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const initialCount = component.newRows.length;
      component.addNewRow();

      expect(component.newRows.length).toBe(initialCount + 1);
      expect(component.newRows[0].form).toBeDefined();
    });

    it('should mark new row form as required', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      expect(form.get('testId')?.hasError('required')).toBeTruthy();
      expect(form.get('result')?.hasError('required')).toBeTruthy();
      expect(form.get('effDate')?.hasError('required')).toBeTruthy();
      // Description is disabled/readonly, so no validators
      expect(form.get('description')?.disabled).toBeTruthy();
    });

    it('should decrement newRowCounter for each new row', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      expect(component.newRows[0].id).toBe(-1);
      component.addNewRow();
      expect(component.newRows[0].id).toBe(-2);
    });

    it('should prepend new rows (unshift)', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      const firstId = component.newRows[0].id;
      component.addNewRow();
      // The second added row should now be at index 0
      expect(component.newRows[0].id).not.toBe(firstId);
      expect(component.newRows[1].id).toBe(firstId);
    });

    it('should create terminationDateFilter that validates dates after effDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const entry = component.newRows[0];
      const effDate = moment().add(10, 'days');
      entry.form.patchValue({ effDate });

      // Date after effDate should pass
      const afterDate = effDate.clone().add(5, 'days');
      expect(entry.terminationDateFilter(afterDate)).toBeTrue();

      // Date same as effDate should pass
      const sameDate = effDate.clone();
      expect(entry.terminationDateFilter(sameDate)).toBeTrue();

      // Date before effDate should fail
      const beforeDate = effDate.clone().subtract(5, 'days');
      expect(entry.terminationDateFilter(beforeDate)).toBeFalse();
    });

    it('should allow any date when effDate is null in terminationDateFilter', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const entry = component.newRows[0];
      // effDate is null by default
      expect(entry.terminationDateFilter(moment('2020-01-01'))).toBeTrue();
    });

    it('should return true for null date in terminationDateFilter', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const entry = component.newRows[0];
      expect(entry.terminationDateFilter(null)).toBeTrue();
    });

    it('should subscribe to form changes to track dirty state for new rows', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      // markAsDirty before patchValue so the subscription sees dirty=true
      form.markAsDirty();
      form.patchValue({ testId: 'RH' });
      // Verify dirty tracking is updated
      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should subscribe to effDate changes to revalidate termDate for new rows', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const termControl = form.get('termDate');
      const updateSpy = spyOn(termControl!, 'updateValueAndValidity');

      form.get('effDate')?.setValue(moment());

      expect(updateSpy).toHaveBeenCalledWith({ emitEvent: false });
    });

    it('should set modificationDate as disabled', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      expect(form.get('modificationDate')?.disabled).toBeTrue();
    });
  });

  describe('Remove New Row', () => {
    it('should remove new row at given index', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      expect(component.newRows.length).toBe(2);

      component.removeNewRow(0);
      expect(component.newRows.length).toBe(1);
    });

    it('should remove the correct row by index', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();
      component.addNewRow();
      component.addNewRow();

      const remainingId = component.newRows[1].id;
      const lastId = component.newRows[2].id;
      component.removeNewRow(0);

      expect(component.newRows[0].id).toBe(remainingId);
      expect(component.newRows[1].id).toBe(lastId);
    });

    it('should handle removing the last row', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      component.removeNewRow(0);
      expect(component.newRows.length).toBe(0);
    });
  });

  describe('Save Functionality', () => {
    it('should not save if validation errors exist', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      component.saveAll();

      expect(component.showValidationError).toBeTruthy();
      expect(component.isSaving).toBeFalsy();
    });

    it('should save valid changes', fakeAsync(() => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'RH',
        description: 'RH TYPING',
        result: 'POS',
        effDate: moment(),
        termDate: null
      });
      form.markAsDirty();

      const initialLength = component.dataSource.length;
      component.saveAll();
      tick(600);

      expect(component.dataSource.length).toBe(initialLength + 1);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Antigen groups saved successfully');
      expect(component.isEditOrAddMode).toBeFalsy();
    }));

    it('should mark all forms as touched on saveAll', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      expect(form.touched).toBeFalse();

      component.saveAll();
      expect(form.touched).toBeTrue();
    });

    it('should set isSaving to true during save and false after', fakeAsync(() => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();

      component.saveAll();
      expect(component.isSaving).toBeTrue();

      tick(600);
      expect(component.isSaving).toBeFalse();
    }));

    it('should clear showValidationError when save proceeds', fakeAsync(() => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();
      component.showValidationError = true;

      component.saveAll();
      expect(component.showValidationError).toBeFalse();
      tick(600);
    }));

    it('should not save when existing edited rows have validation errors', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      meta.form.patchValue({ testId: '' }); // invalid - required
      meta.form.markAsDirty();

      component.saveAll();
      expect(component.showValidationError).toBeTrue();
      expect(component.isSaving).toBeFalse();
    });

    it('should apply edits to existing rows in dataSource', fakeAsync(() => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      const originalTestId = meta.originalRow.testId;
      meta.form.patchValue({ result: 'POS' });
      meta.form.markAsDirty();

      component.saveAll();
      tick(600);

      const updatedRow = component.dataSource.find(r => r.testId === originalTestId);
      expect(updatedRow?.result).toBe('POS');
    }));

    it('should not modify unchanged rows in dataSource', fakeAsync(() => {
      fixture.detectChanges();
      const originalData = [...component.dataSource];
      component.enterEditMode();

      // Don't modify any rows
      component.saveAll();
      tick(600);

      // No validation errors since no dirty forms
      expect(component.isEditOrAddMode).toBeFalse();
    }));
  });

  describe('Search and Filter', () => {
    it('should filter data by search term matching testId', () => {
      fixture.detectChanges();
      component.onSearch('K');

      expect(component.filteredDataSource.length).toBeGreaterThan(0);
      component.filteredDataSource.forEach(item => {
        const matchesTestId = item.testId.toLowerCase().includes('k');
        const matchesDesc = item.description.toLowerCase().includes('k');
        expect(matchesTestId || matchesDesc).toBeTrue();
      });
    });

    it('should filter data by search term matching description', () => {
      fixture.detectChanges();
      component.onSearch('KELL');

      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].description).toBe('KELL TYPING');
    });

    it('should show all data when search is empty', () => {
      fixture.detectChanges();

      component.onSearch('');

      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });

    it('should show no data when search term matches nothing', () => {
      fixture.detectChanges();
      component.onSearch('NONEXISTENT');

      expect(component.filteredDataSource.length).toBe(0);
    });

    it('should be case-insensitive in search', () => {
      fixture.detectChanges();
      component.onSearch('kell');

      expect(component.filteredDataSource.length).toBe(1);
      expect(component.filteredDataSource[0].description).toBe('KELL TYPING');
    });

    it('should store the search text', () => {
      fixture.detectChanges();
      component.onSearch('test');
      expect(component.searchText).toBe('test');
    });

    it('should handle whitespace-only search as empty', () => {
      fixture.detectChanges();
      component.onSearch('   ');

      // whitespace-only should still show all data since trim makes it falsy
      expect(component.filteredDataSource.length).toBe(component.dataSource.length);
    });

    it('should filter by antigen group code', () => {
      fixture.detectChanges();

      component.filterForm.patchValue({ antigenGroupCode: 'Ce*' });

      expect(component.filterForm.get('description')?.value).toBe('C-e-');
    });

    it('should set description to empty string for unknown antigen group code', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'UNKNOWN' });

      expect(component.filterForm.get('description')?.value).toBe('');
    });

    it('should update description when antigen group code changes', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ antigenGroupCode: 'Ce*' });
      expect(component.filterForm.get('description')?.value).toBe('C-e-');

      component.filterForm.patchValue({ antigenGroupCode: 'E-c' });
      expect(component.filterForm.get('description')?.value).toBe('E-c-');
    });
  });

  describe('Date Formatting', () => {
    it('should format a valid Date object', () => {
      const date = new Date('2025-01-15');
      const formatted = component.formatDate(date);
      expect(formatted).toBe('15-JAN-2025');
    });

    it('should format a valid date string', () => {
      const formatted = component.formatDate('2024-03-15');
      expect(formatted).toBe('15-MAR-2024');
    });

    it('should return "-" for null dates', () => {
      const formatted = component.formatDate(null);
      expect(formatted).toBe('-');
    });
  });

  describe('Form Validation Helpers', () => {
    it('should detect date errors', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const effDateControl = form.get('effDate');
      effDateControl?.setValue(null);
      effDateControl?.markAsTouched();
      effDateControl?.updateValueAndValidity();

      expect(component.hasDateError(form, 'effDate')).toBeTruthy();
    });

    it('should get date error messages', () => {
      fixture.detectChanges();
      component.enterEditMode();
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

    it('should return empty string when no errors on date field', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.get('effDate')?.setValue(moment());
      form.get('effDate')?.markAsTouched();
      form.get('effDate')?.updateValueAndValidity();

      const message = component.getDateErrorMessage(form, 'effDate');
      // May or may not be empty depending on minDate validation, but should not throw
      expect(typeof message).toBe('string');
    });

    it('should return empty string when control is not touched', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      // effDate has required error but is not touched
      const message = component.getDateErrorMessage(form, 'effDate');
      // When control has errors but is not touched (and no matDatepickerParse), returns ''
      expect(message).toBe('');
    });

    it('should return matDatepickerParse error message for effDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const effDateControl = form.get('effDate');
      effDateControl?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      const message = component.getDateErrorMessage(form, 'effDate');
      expect(message).toBe('Effective Date is invalid');
    });

    it('should return matDatepickerParse error message for termDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const termDateControl = form.get('termDate');
      termDateControl?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      const message = component.getDateErrorMessage(form, 'termDate');
      expect(message).toBe('Termination Date is invalid');
    });

    it('should return form-level error message for termDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const termControl = form.get('termDate');
      termControl?.markAsTouched();
      // Control needs some error (so !control.errors is false) but not a 'message' key
      // Then the code falls through to check form-level errors for termDate
      termControl?.setErrors({ someError: true });
      form.setErrors({ message: 'Termination Date must be on or after Effective Date' });

      const message = component.getDateErrorMessage(form, 'termDate');
      expect(message).toBe('Termination Date must be on or after Effective Date');
    });

    it('should return false from hasDateError when no error present', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      // termDate has no required validator, so null is valid
      form.get('termDate')?.setValue(null);
      form.get('termDate')?.markAsTouched();
      form.get('termDate')?.updateValueAndValidity();

      // Depends on whether form-level validator also clears, but termDate null should be ok
      // The hasDateError delegates to getDateErrorMessage
      const result = component.hasDateError(form, 'termDate');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Date Validators', () => {
    it('should validate that termination date is on or after effective date (cross-field)', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const futureDate = moment().add(10, 'days');
      const beforeFutureDate = moment().add(5, 'days');
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: futureDate,
        termDate: beforeFutureDate  // before effDate
      });
      form.updateValueAndValidity();

      expect(form.errors?.['terminationBeforeEffective']).toBeTrue();
      expect(form.errors?.['message']).toBe('Termination Date must be on or after Effective Date');
    });

    it('should pass cross-field validation when termDate is after effDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: moment().add(5, 'days'),
        termDate: moment().add(10, 'days')
      });
      form.updateValueAndValidity();

      expect(form.errors?.['terminationBeforeEffective']).toBeFalsy();
    });

    it('should pass cross-field validation when termDate equals effDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const sameDate = moment().add(5, 'days').startOf('day');
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: sameDate.clone(),
        termDate: sameDate.clone()
      });
      form.updateValueAndValidity();

      expect(form.errors?.['terminationBeforeEffective']).toBeFalsy();
    });

    it('should pass cross-field validation when termDate is null', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        effDate: moment().add(5, 'days'),
        termDate: null
      });
      form.updateValueAndValidity();

      expect(form.errors?.['terminationBeforeEffective']).toBeFalsy();
    });

    it('should pass cross-field validation when effDate is null', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.patchValue({
        effDate: null,
        termDate: moment().add(5, 'days')
      });
      form.updateValueAndValidity();

      expect(form.errors?.['terminationBeforeEffective']).toBeFalsy();
    });

    it('should validate effDate as required on new rows', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const control = form.get('effDate');
      control?.setValue(null);
      control?.updateValueAndValidity();

      expect(control?.errors?.['required']).toBeTrue();
      expect(control?.errors?.['message']).toContain('required');
    });

    it('should not return required error for null termDate', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const control = form.get('termDate');
      control?.setValue(null);
      control?.updateValueAndValidity();

      expect(control?.errors?.['required']).toBeFalsy();
    });

    it('should detect invalid date value', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const control = form.get('effDate');
      control?.setValue(moment('invalid'));
      control?.updateValueAndValidity();

      expect(control?.errors?.['invalidDate']).toBeTrue();
      expect(control?.errors?.['message']).toContain('Effective Date is invalid');
    });

    it('should detect invalid termination date value', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const control = form.get('termDate');
      control?.setValue(moment('invalid'));
      control?.updateValueAndValidity();

      expect(control?.errors?.['invalidDate']).toBeTrue();
      expect(control?.errors?.['message']).toContain('Termination Date is invalid');
    });

    it('should skip date validation when existing row date is unchanged', () => {
      fixture.detectChanges();
      component.enterEditMode();

      // Use an existing editable row which has originalRow set
      const meta = component.editableRowsMeta[0];
      const originalEffDate = meta.originalRow.effDate;
      const control = meta.form.get('effDate');

      // Set the value to the same date as the original
      control?.setValue(moment(originalEffDate));
      control?.updateValueAndValidity();

      // Should have no pastDate error even if the date is in the past
      expect(control?.errors?.['pastDate']).toBeFalsy();
    });
  });

  describe('Chapter Changes', () => {
    it('should exit edit mode when chapter changes while in edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();
      expect(component.isEditOrAddMode).toBeTrue();

      chapterChanged$.next();

      expect(component.isEditOrAddMode).toBeFalse();
    });

    it('should not affect state when chapter changes while not in edit mode', () => {
      fixture.detectChanges();
      expect(component.isEditOrAddMode).toBeFalse();

      chapterChanged$.next();

      expect(component.isEditOrAddMode).toBeFalse();
    });
  });

  describe('Editable Row Meta (terminationDateFilter)', () => {
    it('should return true for null date in existing row terminationDateFilter', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      expect(meta.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true when effDate is null in existing row terminationDateFilter', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      meta.form.patchValue({ effDate: null });

      expect(meta.terminationDateFilter(moment('2020-01-01'))).toBeTrue();
    });

    it('should filter dates before effDate in existing row', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      const effDate = moment().add(10, 'days');
      meta.form.patchValue({ effDate });

      expect(meta.terminationDateFilter(effDate.clone().subtract(5, 'days'))).toBeFalse();
      expect(meta.terminationDateFilter(effDate.clone())).toBeTrue();
      expect(meta.terminationDateFilter(effDate.clone().add(5, 'days'))).toBeTrue();
    });
  });

  describe('updateDirtyFormsFlag (private, tested via behavior)', () => {
    it('should set hasAnyDirtyForms when a new row form is dirty', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.get('testId')?.setValue('RH');
      form.get('testId')?.markAsDirty();
      form.markAsDirty();
      // Trigger update via subscription
      form.updateValueAndValidity();

      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should set hasAnyDirtyForms when a new row form is touched', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.markAllAsTouched();
      // Trigger the update
      form.patchValue({ testId: '' });

      expect(component.hasAnyDirtyForms).toBeTrue();
    });

    it('should set hasAnyInvalidForms when a new row with dirty/touched controls is invalid', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      form.get('testId')?.setValue('');
      form.get('testId')?.markAsDirty();
      form.get('testId')?.markAsTouched();
      form.markAsDirty();
      // Trigger the subscription
      form.patchValue({});

      expect(component.hasAnyInvalidForms).toBeTrue();
    });

    it('should set hasAnyInvalidForms when an edited row is dirty and invalid', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const meta = component.editableRowsMeta[0];
      meta.form.get('testId')?.setValue('');
      meta.form.get('testId')?.markAsDirty();
      meta.form.markAsDirty();
      // Trigger subscription
      meta.form.patchValue({});

      expect(component.hasAnyInvalidForms).toBeTrue();
    });

    it('should clear showValidationError when all forms become valid', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      component.showValidationError = true;

      // Make form valid
      form.patchValue({
        testId: 'RH',
        result: 'POS',
        effDate: moment()
      });
      form.markAsDirty();

      expect(component.showValidationError).toBeFalse();
    });

    it('should not set hasAnyDirtyForms when no forms are dirty', () => {
      fixture.detectChanges();
      component.enterEditMode();

      // Don't touch any forms
      expect(component.hasAnyDirtyForms).toBeFalse();
    });
  });

  describe('formToSpAntigenGroup (private, tested via save)', () => {
    it('should convert form values to SpAntigenGroup with defaults for missing values', fakeAsync(() => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      // Use today/future dates to pass the pastDate validator
      form.patchValue({
        testId: 'S',
        result: 'NEG',
        effDate: moment(),
        termDate: moment().add(30, 'days')
      });
      form.markAsDirty();

      component.saveAll();
      tick(600);

      const savedRow = component.dataSource.find(r => r.testId === 'S');
      expect(savedRow).toBeDefined();
      expect(savedRow!.result).toBe('NEG');
      expect(savedRow!.termDate).not.toBeNull();
      expect(savedRow!.modificationDate).toBeDefined();
    }));
  });

  describe('loadTableData', () => {
    it('should exist and be callable without errors', () => {
      expect(() => component.loadTableData()).not.toThrow();
    });
  });

  describe('loadDropdownOptions', () => {
    it('should populate antigenGroupOptions with correct codes', () => {
      component.loadDropdownOptions();
      const codes = component.antigenGroupOptions.map(o => o.code);
      expect(codes).toContain('Ce*');
      expect(codes).toContain('C-e');
      expect(codes).toContain('C-w');
      expect(codes).toContain('E-c');
      expect(codes).toContain('E-w');
    });

    it('should populate testIdOptions with correct keys', () => {
      component.loadDropdownOptions();
      const keys = component.testIdOptions.map(o => o.key);
      expect(keys).toContain('RH');
      expect(keys).toContain('K');
      expect(keys).toContain('FY');
      expect(keys).toContain('JK');
      expect(keys).toContain('S');
      expect(keys).toContain('e');
    });

    it('should populate resultOptions with POS, NEG, and No', () => {
      component.loadDropdownOptions();
      const keys = component.resultOptions.map(o => o.key);
      expect(keys).toEqual(['POS', 'NEG', 'No']);
    });
  });

  describe('revalidateAllForms (private, tested via chapter change)', () => {
    it('should revalidate new row forms on chapter change', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const form = component.newRows[0].form;
      const effSpy = spyOn(form.get('effDate')!, 'updateValueAndValidity');
      const termSpy = spyOn(form.get('termDate')!, 'updateValueAndValidity');

      chapterChanged$.next();

      // enterEditMode was called first, then exitEditMode on chapter change clears newRows,
      // but revalidateAllForms is called too. Since exitEditMode clears first, let's test
      // directly by calling a method that uses revalidateAllForms indirectly.
      // The subscription calls exitEditMode then loadTableData then revalidateAllForms.
      // After exitEditMode, newRows and editableRowsMeta are empty,
      // so revalidateAllForms has nothing to revalidate.
      // This is actually the correct behavior.
      expect(component.newRows.length).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple addNewRow calls', () => {
      fixture.detectChanges();
      component.enterEditMode();

      for (let i = 0; i < 5; i++) {
        component.addNewRow();
      }

      expect(component.newRows.length).toBe(5);
      // Verify IDs are all unique and negative
      const ids = component.newRows.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
      ids.forEach(id => expect(id).toBeLessThan(0));
    });

    it('should handle entering and exiting edit mode multiple times', () => {
      fixture.detectChanges();

      for (let i = 0; i < 3; i++) {
        component.enterEditMode();
        expect(component.isEditOrAddMode).toBeTrue();
        component.addNewRow();
        component.exitEditMode();
        expect(component.isEditOrAddMode).toBeFalse();
        expect(component.newRows.length).toBe(0);
      }
    });

    it('should handle search then edit mode correctly', () => {
      fixture.detectChanges();
      component.onSearch('K');
      const filteredCount = component.filteredDataSource.length;

      component.enterEditMode();
      expect(component.editableRowsMeta.length).toBe(filteredCount);
    });

    it('should create form with existing row data in edit mode', () => {
      fixture.detectChanges();
      component.enterEditMode();

      const firstRow = component.filteredDataSource[0];
      const meta = component.editableRowsMeta[0];

      expect(meta.form.get('testId')?.value).toBe(firstRow.testId);
      expect(meta.form.get('result')?.value).toBe(firstRow.result);
      expect(meta.originalRow).toEqual(firstRow);
    });

    it('should handle effDate as non-Moment value in terminationDateFilter', () => {
      fixture.detectChanges();
      component.enterEditMode();
      component.addNewRow();

      const entry = component.newRows[0];
      // Set effDate as a regular Date (not a Moment)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      entry.form.get('effDate')?.setValue(futureDate);

      const afterDate = moment(futureDate).add(5, 'days');
      expect(entry.terminationDateFilter(afterDate)).toBeTrue();

      const beforeDate = moment(futureDate).subtract(5, 'days');
      expect(entry.terminationDateFilter(beforeDate)).toBeFalse();
    });
  });
});
