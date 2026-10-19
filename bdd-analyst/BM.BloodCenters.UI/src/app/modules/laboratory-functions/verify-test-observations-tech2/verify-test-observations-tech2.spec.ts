import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, delay } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import moment from 'moment';

import { VerifyTestObservationsTech2Component } from './verify-test-observations-tech2';
import { VerifyTestObservationsTech2ApiService } from './services/verify-test-observations-tech2-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  WorksheetDto,
  TestDto,
  TestBandDto,
  PendingUnitDto,
  TestTypeDto,
  BandResultLookupDto,
  TestTypeMetadataDto,
} from './models/verify-test-observations-tech2.model';

describe('VerifyTestObservationsTech2Component', () => {
  let component: VerifyTestObservationsTech2Component;
  let fixture: ComponentFixture<VerifyTestObservationsTech2Component>;
  let apiServiceSpy: jasmine.SpyObj<VerifyTestObservationsTech2ApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockWorksheets: WorksheetDto[] = [
    { tbId: 'TB001', pendingUnitsCount: 5 },
    { tbId: 'TB002', pendingUnitsCount: 3 }
  ];

  const mockTests: TestDto[] = [
    {
      testId: 'ABO',
      testDesc: 'ABO Blood Grouping',
      testType: 'M',
      testTypeDesc: 'Manual',
      pendingUnitsCount: 3
    }
  ];

  const mockTestBands: TestBandDto[] = [
    { bandSeq: 1, bandName: 'A1' },
    { bandSeq: 2, bandName: 'B' }
  ];

  const mockPendingUnits: PendingUnitDto[] = [
    {
      unitId: 'A12345678',
      chkDigit: '89',
      collDate: '2026-05-20T00:00:00Z',
      tbId: 'TB001',
      testId: 'ABO',
      tbSeqNo: 1,
      tempResult1: '+,+,-,-',
      tempResult1UserId: 'TECH01',
      bandResults: []
    }
  ];

  const mockTestTypes: TestTypeDto[] = [
    { testType: 'M', testTypeDesc: 'Manual' },
    { testType: 'A', testTypeDesc: 'Automated' }
  ];

  const mockBandResults: BandResultLookupDto[] = [
    { result: '+', resultDesc: 'Positive' },
    { result: '-', resultDesc: 'Negative' }
  ];

  const mockMetadata: TestTypeMetadataDto = {
    testType: 'M',
    testTypeDesc: 'Manual',
    resUpdate: 'Y',
    othBnd: 'N',
    defaultControlValue: null,
    fullTechTwo: 'N'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('VerifyTestObservationsTech2ApiService', [
      'getWorksheets',
      'getTests',
      'getTestBands',
      'getPendingUnits',
      'verifyResults',
      'getBandResults',
      'getTestTypeMetadata',
      'validateCombination',
      'getControlValues',
      'getTestTypes',
      'getOtherBands',
      'getNotes',
      'createNote',
      'updateNote',
      'deleteNote',
      'checkExisting',
      'clearVerification',
      'saveOtherBands',
      'deleteOtherBands',
      'getValidResults'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    dialogSpy = createMockMatDialog();

    apiServiceSpy.getWorksheets.and.returnValue(of(mockWorksheets));
    apiServiceSpy.getTests.and.returnValue(of(mockTests));
    apiServiceSpy.getTestBands.and.returnValue(of(mockTestBands));
    apiServiceSpy.getPendingUnits.and.returnValue(of(mockPendingUnits));
    apiServiceSpy.verifyResults.and.returnValue(of({ success: true, statusCode: 200, message: 'Success' }));
    apiServiceSpy.getBandResults.and.returnValue(of(mockBandResults));
    apiServiceSpy.getTestTypeMetadata.and.returnValue(of(mockMetadata));
    apiServiceSpy.validateCombination.and.returnValue(of({ sysResult: null, sysResultDesc: null, isMatch: false }));
    apiServiceSpy.getControlValues.and.returnValue(of([]));
    apiServiceSpy.getTestTypes.and.returnValue(of(mockTestTypes));
    apiServiceSpy.getOtherBands.and.returnValue(of([]));
    apiServiceSpy.getNotes.and.returnValue(of([]));
    apiServiceSpy.createNote.and.returnValue(of(1));
    apiServiceSpy.updateNote.and.returnValue(of(undefined));
    apiServiceSpy.deleteNote.and.returnValue(of(undefined));
    apiServiceSpy.checkExisting.and.returnValue(of({ hasExistingResult: false }));
    apiServiceSpy.clearVerification.and.returnValue(of({ success: true, statusCode: 200, message: 'Cleared' }));
    apiServiceSpy.saveOtherBands.and.returnValue(of({ success: true, statusCode: 200, message: 'Saved' }));
    apiServiceSpy.deleteOtherBands.and.returnValue(of(undefined));
    apiServiceSpy.getValidResults.and.returnValue(of([]));
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());

    TestBed.configureTestingModule({
      imports: [VerifyTestObservationsTech2Component, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VerifyTestObservationsTech2ApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();


    fixture = TestBed.createComponent(VerifyTestObservationsTech2Component);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should load worksheets on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getWorksheets).toHaveBeenCalled();
      expect((component as any).worksheets()).toEqual(mockWorksheets);
    }));

    it('should initialize filter form with required validators', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('worksheet')).toBeTruthy();
      expect(component.filterForm.get('testId')).toBeTruthy();
      expect(component.filterForm.get('testType')).toBeTruthy();
    }));

    it('should initialize notes form', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.notesForm).toBeTruthy();
      expect(component.notesForm.get('noteText')).toBeTruthy();
    }));

    it('should set filteredWorksheets after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).filteredWorksheets).toEqual(mockWorksheets);
    }));
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle worksheet load error', fakeAsync(() => {
      const error = { error: { message: 'Failed to load' } };
      apiServiceSpy.getWorksheets.and.returnValue(throwError(() => error));

      (component as any).loadWorksheets();
      tick();

      expect((component as any).error()).toBe('Failed to load');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should display error message', () => {
      (component as any).error.set('Test error');
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain('Test error');
    });

    it('should handle test load error', fakeAsync(() => {
      const error = { error: { message: 'Failed to load tests' } };
      apiServiceSpy.getTests.and.returnValue(throwError(() => error));

      component.filterForm.patchValue({ worksheet: 'TB001' });
      tick();

      expect((component as any).error()).toBe('Failed to load tests');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should use fallback error message when error object has no message', fakeAsync(() => {
      apiServiceSpy.getWorksheets.and.returnValue(throwError(() => ({ error: {} })));

      (component as any).loadWorksheets();
      tick();

      expect((component as any).error()).toBe('Failed to load worksheets');
    }));
  });

  describe('Form Interactions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load tests when worksheet is selected', fakeAsync(() => {
      component.filterForm.patchValue({ worksheet: 'TB001' });
      tick();

      expect(apiServiceSpy.getTests).toHaveBeenCalledWith('TB001');
      expect((component as any).tests()).toEqual(mockTests);
    }));

    it('should clear tests when worksheet is cleared', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      component.filterForm.patchValue({ worksheet: '' });
      tick();

      expect((component as any).tests()).toEqual([]);
      expect((component as any).filteredTests).toEqual([]);
    }));

    it('should load test types when test is selected', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      component.filterForm.patchValue({ worksheet: 'TB001' }, { emitEvent: false });

      component.filterForm.patchValue({ testId: 'ABO' });
      tick();

      expect(apiServiceSpy.getTestTypes).toHaveBeenCalledWith('ABO');
    }));

    it('should patch testDescription when testId is selected', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      component.filterForm.patchValue({ worksheet: 'TB001' }, { emitEvent: false });

      component.filterForm.patchValue({ testId: 'ABO' });
      tick();

      expect(component.filterForm.get('testDescription')?.value).toBe('ABO Blood Grouping');
    }));

    it('should clear testType when testId changes', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      component.filterForm.patchValue({ worksheet: 'TB001', testType: 'M' }, { emitEvent: false });

      component.filterForm.patchValue({ testId: 'ABO' });
      tick();

      expect(component.filterForm.get('testType')?.value).toBe('');
    }));

    it('should reset test fields when testId is cleared', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      (component as any).testBands.set(mockTestBands);

      component.filterForm.patchValue({ testId: '' });
      tick();

      expect((component as any).testBands()).toEqual([]);
      expect((component as any).testTypes()).toEqual([]);
    }));

    it('should load bands and units when testType is selected', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      component.filterForm.patchValue({ worksheet: 'TB001', testId: 'ABO' }, { emitEvent: false });

      component.filterForm.patchValue({ testType: 'M' });
      tick();

      expect(apiServiceSpy.getTestBands).toHaveBeenCalledWith('ABO', 'M');
      expect(apiServiceSpy.getPendingUnits).toHaveBeenCalledWith('TB001', 'ABO');
      expect(apiServiceSpy.getTestTypeMetadata).toHaveBeenCalledWith('ABO', 'M');
      expect(apiServiceSpy.getBandResults).toHaveBeenCalledWith('ABO');
      expect(apiServiceSpy.getControlValues).toHaveBeenCalledWith('ABO');
    }));

    it('should clear data when testType is cleared', fakeAsync(() => {
      (component as any).testBands.set(mockTestBands);
      (component as any).bandResultOptions.set(mockBandResults);
      component.filterForm.patchValue({ worksheet: 'TB001', testId: 'ABO' }, { emitEvent: false });

      component.filterForm.patchValue({ testType: '' });
      tick();

      expect((component as any).testTypeMetadata()).toBeNull();
      expect((component as any).testBands()).toEqual([]);
      expect((component as any).unitRows()).toEqual([]);
      expect((component as any).bandResultOptions()).toEqual([]);
      expect((component as any).controlValues()).toEqual([]);
    }));
  });

  describe('loadTestTypes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set loadingTestTypes during API call', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      apiServiceSpy.getTestTypes.and.returnValue(of(mockTestTypes).pipe(delay(100)));
      component.filterForm.patchValue({ worksheet: 'TB001' }, { emitEvent: false });

      component.filterForm.patchValue({ testId: 'ABO' });

      expect((component as any).loadingTestTypes()).toBeTrue();

      tick(100);

      expect((component as any).loadingTestTypes()).toBeFalse();
      expect((component as any).testTypes()).toEqual(mockTestTypes);
    }));

    it('should handle loadTestTypes error gracefully', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      apiServiceSpy.getTestTypes.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ worksheet: 'TB001' }, { emitEvent: false });

      component.filterForm.patchValue({ testId: 'ABO' });
      tick();

      expect((component as any).loadingTestTypes()).toBeFalse();
      expect((component as any).testTypes()).toEqual([]);
    }));
  });

  describe('Unit Rows', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).testBands.set(mockTestBands);
      (component as any).pendingUnits.set(mockPendingUnits);
      (component as any).buildUnitRows(mockPendingUnits);
    }));

    it('should get band value from unit row', () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';

      const value = component.getBandValue(row, 'A1');
      expect(value).toBe('+');
    });

    it('should return empty string for missing band value', () => {
      const row = (component as any).unitRows()[0];
      const value = component.getBandValue(row, 'NonExistent');
      expect(value).toBe('');
    });

    it('should set band value on unit row without dialog when no result exists', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      row.tempResult2 = '';
      row.resultInterpretation = '';

      component.setBandValue(row, 'A1', '+');
      tick();

      expect(row['A1']).toBe('+');
    }));

    it('should show confirm dialog when changing band value with existing result', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      row.tempResult2 = 'A+';
      row.resultInterpretation = 'A+';

      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(true)
      } as any);

      component.setBandValue(row, 'A1', '-');
      tick();

      expect((component as any).dialog.open).toHaveBeenCalled();
      expect(row['A1']).toBe('-');
      expect(row.tempResult2).toBe('');
      expect(row.resultInterpretation).toBe('');
    }));

    it('should not change band value when dialog is cancelled', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      row.tempResult2 = 'A+';
      row.resultInterpretation = 'A+';
      row['A1'] = '+';

      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(false)
      } as any);

      component.setBandValue(row, 'A1', '-');
      tick();

      expect(row['A1']).toBe('+');
    }));
  });

  describe('checkAllBandsFilled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).testBands.set(mockTestBands);
      (component as any).buildUnitRows(mockPendingUnits);
    }));

    it('should call validateCombination when all bands are filled', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      row.tempResult2 = '';
      row.resultInterpretation = '';

      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO',
        testType: 'M'
      }, { emitEvent: false });

      row['A1'] = '+';
      component.setBandValue(row, 'B', '-');
      tick();

      expect(apiServiceSpy.validateCombination).toHaveBeenCalled();
    }));

    it('should not call validateCombination when bands are partially filled', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      row.tempResult2 = '';
      row.resultInterpretation = '';
      row['A1'] = '';

      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO',
        testType: 'M'
      }, { emitEvent: false });

      component.setBandValue(row, 'A1', '+');
      tick();

      expect(apiServiceSpy.validateCombination).not.toHaveBeenCalled();
    }));

    it('should set resultInterpretation when combination matches', fakeAsync(() => {
      apiServiceSpy.validateCombination.and.returnValue(of({
        sysResult: 'A+',
        sysResultDesc: 'A Positive',
        isMatch: true
      }));

      const row = (component as any).unitRows()[0];
      row.tempResult2 = '';
      row.resultInterpretation = '';
      row['A1'] = '+';

      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO',
        testType: 'M'
      }, { emitEvent: false });
      (component as any).testTypeMetadata.set(mockMetadata);

      component.setBandValue(row, 'B', '-');
      tick();

      expect(row.resultInterpretation).toBe('A+');
      expect(row.description).toBe('A Positive');
    }));
  });

  describe('selectUnit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).testBands.set(mockTestBands);
      (component as any).buildUnitRows(mockPendingUnits);
    }));

    it('should select a unit row', () => {
      const row = (component as any).unitRows()[0];

      component.selectUnit(row);

      expect(component.selectedUnit()).toBe(row);
    });

    it('should deselect when clicking same unit', () => {
      const row = (component as any).unitRows()[0];

      component.selectUnit(row);
      expect(component.selectedUnit()).toBe(row);

      component.selectUnit(row);
      expect(component.selectedUnit()).toBeNull();
    });

    it('should load notes when a unit is selected', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO'
      }, { emitEvent: false });

      component.selectUnit(row);
      tick();

      expect(apiServiceSpy.getNotes).toHaveBeenCalled();
    }));
  });

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute band columns from test bands', () => {
      (component as any).testBands.set(mockTestBands);

      expect((component as any).bandColumns()).toEqual(['A1', 'B']);
    });

    it('should compute displayed columns', () => {
      (component as any).testBands.set(mockTestBands);

      expect((component as any).displayedColumns()).toEqual([
        'unitId',
        'A1',
        'B',
        'tempResult2',
        'resultInterpretation',
        'description'
      ]);
    });

    it('should compute canSave correctly when no rows', () => {
      (component as any).unitRows.set([]);
      expect((component as any).canSave()).toBeFalse();
    });

    it('should compute canSave correctly when rows exist', () => {
      (component as any).unitRows.set([{ unitId: 'A12345678' }]);
      (component as any).testBands.set(mockTestBands);
      (component as any).loading.set(false);
      (component as any).loadingWorksheets.set(false);
      (component as any).error.set(null);
      expect((component as any).canSave()).toBeTrue();
    });

    it('should compute hasObservationData', () => {
      (component as any).unitRows.set([]);
      (component as any).testBands.set([]);
      expect((component as any).hasObservationData()).toBeFalse();

      (component as any).unitRows.set([{ unitId: 'A12345678' }]);
      (component as any).testBands.set(mockTestBands);
      expect((component as any).hasObservationData()).toBeTrue();
    });

    it('should compute isReady', () => {
      (component as any).loading.set(false);
      (component as any).loadingWorksheets.set(false);
      (component as any).error.set(null);
      expect((component as any).isReady()).toBeTrue();

      (component as any).loading.set(true);
      expect((component as any).isReady()).toBeFalse();
    });

    it('should pad display rows to minimum', () => {
      (component as any).unitRows.set([{ unitId: 'U1' }]);
      const rows = (component as any).displayRows();
      expect(rows.length).toBe(9);
      expect(rows[0]).toEqual({ unitId: 'U1' });
      expect(rows[1]).toBeNull();
    });

    it('should compute showOtherBandsButton from metadata', () => {
      (component as any).testTypeMetadata.set({ othBnd: 'Y' } as any);
      expect((component as any).showOtherBandsButton()).toBeTrue();

      (component as any).testTypeMetadata.set({ othBnd: 'N' } as any);
      expect((component as any).showOtherBandsButton()).toBeFalse();
    });

    it('should compute canOverrideResult from metadata', () => {
      (component as any).testTypeMetadata.set({ resUpdate: 'Y' } as any);
      expect((component as any).canOverrideResult()).toBeTrue();

      (component as any).testTypeMetadata.set({ resUpdate: 'N' } as any);
      expect((component as any).canOverrideResult()).toBeFalse();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).testBands.set(mockTestBands);
      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO',
        testType: 'M'
      });
      (component as any).buildUnitRows(mockPendingUnits);
      fixture.detectChanges();
    }));

    it('should verify unit results on save', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';
      row['B'] = '-';

      await component.onSave();

      expect(apiServiceSpy.verifyResults).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'All unit results verified successfully.'
      );
    });

    it('should not save if required fields are missing', async () => {
      component.filterForm.patchValue({
        worksheet: '',
        testId: ''
      }, { emitEvent: false });

      await component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Worksheet and Test ID are required.'
      );
      expect(apiServiceSpy.verifyResults).not.toHaveBeenCalled();
    });

    it('should show error when form is invalid', async () => {
      component.filterForm.patchValue({
        worksheet: '',
        testId: '',
        testType: ''
      }, { emitEvent: false });

      await component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should clear form after successful save', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';
      row['B'] = '-';

      await component.onSave();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('All unit results verified successfully.');
      expect(apiServiceSpy.getPendingUnits).toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';
      row['B'] = '-';

      apiServiceSpy.checkExisting.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      await component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    });

    it('should handle verify failure response', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';
      row['B'] = '-';

      apiServiceSpy.verifyResults.and.returnValue(of({
        success: false,
        statusCode: 400,
        message: 'Validation failed'
      }));

      await component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Validation failed');
    });

    it('should check existing verification before saving', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '+';
      row['B'] = '-';

      apiServiceSpy.checkExisting.and.returnValue(of({ hasExistingResult: false }));

      await component.onSave();

      expect(apiServiceSpy.checkExisting).toHaveBeenCalled();
    });

    it('should skip units with no band results', async () => {
      const row = (component as any).unitRows()[0];
      row['A1'] = '';
      row['B'] = '';

      await component.onSave();

      expect(apiServiceSpy.checkExisting).not.toHaveBeenCalled();
    });
  });

  describe('Notes Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).unitRows.set([mockPendingUnits[0]]);
      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO'
      }, { emitEvent: false });
    }));

    it('should add note successfully', fakeAsync(() => {
      component.notesForm.patchValue({ noteText: 'Test note' });

      component.onAddNote();
      tick();

      expect(apiServiceSpy.createNote).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Note saved successfully.'
      );
    }));

    it('should not add empty note', () => {
      component.notesForm.patchValue({ noteText: '' });

      component.onAddNote();

      expect(apiServiceSpy.createNote).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please enter a note.'
      );
    });

    it('should delete note', () => {
      const existingNote = {
        id: '1',
        noteId: 1,
        author: 'Test',
        version: '1.0',
        date: new Date().toISOString(),
        content: 'Test note',
        canEdit: true,
        canDelete: true
      };

      (component as any).note.set(existingNote);

      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(true)
      } as any);

      component.onDeleteNote();

      expect(apiServiceSpy.deleteNote).toHaveBeenCalledWith(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Note deleted successfully.'
      );
    });

    it('should enter edit mode', () => {
      const existingNote = {
        id: '1',
        noteId: 1,
        author: 'Test',
        version: '1.0',
        date: new Date().toISOString(),
        content: 'Editable note',
        canEdit: true,
        canDelete: true
      };

      (component as any).note.set(existingNote);

      component.onEditNote();

      expect((component as any).editingNoteId()).toBeTruthy();
      expect(component.notesForm.get('noteText')?.value).toBe('Editable note');
    });

    it('should cancel edit mode', () => {
      (component as any).editingNoteId.set('1');
      component.notesForm.patchValue({ noteText: 'Modified' });

      component.onCancelEditNote();

      expect((component as any).editingNoteId()).toBeNull();
    });

    it('should update note', fakeAsync(() => {
      const existingNote = {
        id: '1',
        noteId: 1,
        author: 'Test',
        version: '1.0',
        date: new Date().toISOString(),
        content: 'Original',
        canEdit: true,
        canDelete: true
      };
      (component as any).note.set(existingNote);
      (component as any).editingNoteId.set('1');
      component.notesForm.patchValue({ noteText: 'Updated note' });

      component.onUpdateNote();
      tick();

      expect(apiServiceSpy.createNote).toHaveBeenCalledWith(jasmine.objectContaining({
        note: 'Updated note'
      }));
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Note updated successfully.'
      );
    }));
  });

  describe('Search Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter worksheets by search term', fakeAsync(() => {
      (component as any).worksheetSearchCtrl.setValue('TB001');
      tick();

      expect((component as any).filteredWorksheets.length).toBe(1);
      expect((component as any).filteredWorksheets[0].tbId).toBe('TB001');
    }));

    it('should show all worksheets when search is empty', fakeAsync(() => {
      (component as any).worksheetSearchCtrl.setValue('');
      tick();

      expect((component as any).filteredWorksheets).toEqual(mockWorksheets);
    }));

    it('should filter tests by search term', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      (component as any).filteredTests = mockTests;

      (component as any).testIdSearchCtrl.setValue('ABO');
      tick();

      expect((component as any).filteredTests.length).toBe(1);
    }));

    it('should filter tests by description', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      (component as any).filteredTests = mockTests;

      (component as any).testIdSearchCtrl.setValue('blood');
      tick();

      expect((component as any).filteredTests.length).toBe(1);
    }));

    it('should show all tests when search is empty', fakeAsync(() => {
      (component as any).tests.set(mockTests);
      (component as any).filteredTests = [];

      (component as any).testIdSearchCtrl.setValue('');
      tick();

      expect((component as any).filteredTests).toEqual(mockTests);
    }));
  });

  describe('loadTestTypeMetadata', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set testTypeMetadata on success', fakeAsync(() => {
      (component as any).loadTestTypeMetadata('ABO', 'M');
      tick();

      expect((component as any).testTypeMetadata()).toEqual(mockMetadata);
    }));

    it('should disable controlValue when defaultControlValue exists', fakeAsync(() => {
      apiServiceSpy.getTestTypeMetadata.and.returnValue(of({
        ...mockMetadata,
        defaultControlValue: 'CV1'
      }));

      (component as any).loadTestTypeMetadata('ABO', 'M');
      tick();

      expect(component.filterForm.get('controlValue')?.disabled).toBeTrue();
      expect(component.filterForm.get('controlValue')?.value).toBe('CV1');
    }));

    it('should enable controlValue when no defaultControlValue', fakeAsync(() => {
      (component as any).loadTestTypeMetadata('ABO', 'M');
      tick();

      expect(component.filterForm.get('controlValue')?.disabled).toBeFalse();
    }));

    it('should handle metadata error', fakeAsync(() => {
      apiServiceSpy.getTestTypeMetadata.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadTestTypeMetadata('ABO', 'M');
      tick();

      expect((component as any).testTypeMetadata()).toBeNull();
    }));
  });

  describe('loadBandResultOptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load band results', fakeAsync(() => {
      (component as any).loadBandResultOptions('ABO');
      tick();

      expect((component as any).bandResultOptions()).toEqual(mockBandResults);
    }));

    it('should handle error', fakeAsync(() => {
      apiServiceSpy.getBandResults.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadBandResultOptions('ABO');
      tick();

      expect((component as any).bandResultOptions()).toEqual([]);
    }));
  });

  describe('loadControlValues', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load control values', fakeAsync(() => {
      (component as any).loadControlValues('ABO');
      tick();

      expect((component as any).controlValues()).toEqual([]);
    }));

    it('should handle error', fakeAsync(() => {
      apiServiceSpy.getControlValues.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadControlValues('ABO');
      tick();

      expect((component as any).controlValues()).toEqual([]);
    }));
  });

  describe('Additional Bands Dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).testBands.set(mockTestBands);
      (component as any).buildUnitRows(mockPendingUnits);
      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO',
        testType: 'M'
      }, { emitEvent: false });
    }));

    it('should open dialog with existing bands', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      component.selectUnit(row);

      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.onAddOtherBandResults();
      tick();

      expect(apiServiceSpy.getOtherBands).toHaveBeenCalled();
      expect((component as any).dialog.open).toHaveBeenCalled();
    }));

    it('should use first unit row when no unit is selected', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(null)
      } as any);

      component.onAddOtherBandResults();
      tick();

      expect(apiServiceSpy.getOtherBands).toHaveBeenCalled();
    }));

    it('should update additionalBands when dialog returns result', fakeAsync(() => {
      const row = (component as any).unitRows()[0];
      component.selectUnit(row);

      const returnedBands = [{ band1: 'X', band2: 'Y' }];
      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of(returnedBands)
      } as any);

      component.onAddOtherBandResults();
      tick();

      expect(row.additionalBands).toEqual(returnedBands);
    }));
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have a visually hidden heading', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h1.cdk-visually-hidden');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain('Verify Test Observations: Tech 2');
    }));

    it('should have aria-label on selects', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const worksheetSelect = fixture.nativeElement.querySelector('[aria-label="Test Batch/Worksheet"]');
      expect(worksheetSelect).toBeTruthy();
    }));
  });

  describe('Cancel and Clear', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear form on cancel', () => {
      component.filterForm.patchValue({
        worksheet: 'TB001',
        testId: 'ABO'
      });
      (component as any).tests.set(mockTests);
      (component as any).testBands.set(mockTestBands);

      component.onCancel();

      expect(component.filterForm.get('worksheet')?.value).toBeNull();
      expect((component as any).tests()).toEqual([]);
      expect((component as any).testBands()).toEqual([]);
    });

    it('should clear all signals on clearForm', () => {
      (component as any).tests.set(mockTests);
      (component as any).testTypes.set(mockTestTypes);
      (component as any).testBands.set(mockTestBands);
      (component as any).pendingUnits.set(mockPendingUnits);
      (component as any).unitRows.set([{ unitId: 'U1' }]);
      (component as any).note.set({ id: '1' });
      (component as any).selectedUnit.set({ unitId: 'U1' });

      (component as any).clearForm();

      expect((component as any).tests()).toEqual([]);
      expect((component as any).testTypes()).toEqual([]);
      expect((component as any).testBands()).toEqual([]);
      expect((component as any).pendingUnits()).toEqual([]);
      expect((component as any).unitRows()).toEqual([]);
      expect((component as any).note()).toBeNull();
    });

    it('should mark form as untouched and pristine', () => {
      component.filterForm.markAsTouched();
      component.filterForm.markAsDirty();

      (component as any).clearForm();

      expect(component.filterForm.untouched).toBeTrue();
      expect(component.filterForm.pristine).toBeTrue();
    });

    it('should reset search controls', () => {
      (component as any).worksheetSearchCtrl.setValue('search');
      (component as any).testIdSearchCtrl.setValue('search');

      (component as any).clearForm();

      expect((component as any).tests()).toEqual([]);
      expect((component as any).testTypes()).toEqual([]);
    });

    it('should reset filtered worksheets to full list', () => {
      (component as any).filteredWorksheets = [];

      (component as any).clearForm();

      expect((component as any).filteredTests).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
