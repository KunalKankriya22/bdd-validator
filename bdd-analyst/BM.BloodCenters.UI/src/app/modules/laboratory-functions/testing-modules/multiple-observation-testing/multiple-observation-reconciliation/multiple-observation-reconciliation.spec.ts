import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { MultipleObservationReconciliationComponent } from './multiple-observation-reconciliation';
import { MultipleObservationReconciliationApiService } from './services/multiple-observation-reconciliation-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ReturnResult,
  WorksheetDropdownDto,
  TestDropdownDto,
  PendingTestDto,
  TestBandResponseDto,
  BandDetailDto,
  OtherBandDto,
  ValidResultDto,
  ValidInterpretationDto,
  NoteDto,
} from './models/multiple-observation-reconciliation.model';

describe('MultipleObservationReconciliationComponent', () => {
  let component: MultipleObservationReconciliationComponent;
  let c: any;
  let fixture: ComponentFixture<MultipleObservationReconciliationComponent>;
  let apiServiceSpy: jasmine.SpyObj<MultipleObservationReconciliationApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockWorksheets: WorksheetDropdownDto[] = [
    { tbId: 'WS001', testId: 'ABO' },
    { tbId: 'WS002', testId: 'RH' },
  ];

  const mockTests: TestDropdownDto[] = [
    { testId: 'ABO', testDesc: 'ABO Blood Group' },
    { testId: 'RH', testDesc: 'Rh Factor' },
  ];

  const mockPendingTests: PendingTestDto[] = [
    { tbId: 'WS001', testChapterId: 'CH1', testId: 'ABO', tbSeqNo: 1, unitId: 'U001', resultStatus2: 'P', resultUserId: 'user1' },
    { tbId: 'WS001', testChapterId: 'CH1', testId: 'ABO', tbSeqNo: 2, unitId: 'U002', resultStatus2: 'P', resultUserId: 'user2' },
  ];

  const mockBandDetails: BandDetailDto[] = [
    { bandName: 'Anti-A', tech1BandVal: '4+', tech2BandVal: '4+', superBandVal: '', superIntensity: '' },
    { bandName: 'Anti-B', tech1BandVal: '0', tech2BandVal: '0', superBandVal: '', superIntensity: '' },
    { bandName: 'Anti-D', tech1BandVal: '3+', tech2BandVal: '2+', superBandVal: '', superIntensity: '' },
  ];

  const mockOtherBands: OtherBandDto[] = [
    { unitId: 'U001', band1: 'X1', band2: 'Y1', tech: '1' },
    { unitId: 'U001', band1: 'X2', band2: 'Y2', tech: '2' },
    { unitId: 'U001', band1: 'X3', band2: 'Y3', tech: 'S' },
  ];

  const mockTestDetails: TestBandResponseDto = {
    unitId: 'U001',
    tbId: 'WS001',
    testId: 'ABO',
    tbSeqNo: 1,
    testType: 'MO',
    testTypeDesc: 'Multiple Observation',
    ctrlVal: undefined,
    otherBandsEnabled: true,
    tech1Intp: 'A POS',
    tech1IntpDesc: 'A Positive',
    tech2Intp: 'A POS',
    tech2IntpDesc: 'A Positive',
    superIntp: '',
    reconFlag: 'N',
    tech1User: 'Tech1',
    tech1Date: '2026-01-15',
    tech2User: 'Tech2',
    tech2Date: '2026-01-15',
    bandDetails: mockBandDetails,
    otherBands: mockOtherBands,
    noteDetails: { noteId: 1, note: 'Test note', insertUser: 'user1', insertDate: '2026-01-15' },
  };

  const mockValidResults: ValidResultDto[] = [
    { result: '0', resultDesc: 'Negative' },
    { result: '4+', resultDesc: '4+' },
  ];

  const mockValidInterpretations: ValidInterpretationDto[] = [
    { result: 'A POS', resultDesc: 'A Positive' },
    { result: 'O NEG', resultDesc: 'O Negative' },
  ];

  function successResponse<T>(data: T[]) {
    return of({ success: true, message: '', statusCode: 200, data } as ReturnResult<T>);
  }

  function successItemResponse<T>(item: T) {
    return of({ success: true, message: '', statusCode: 200, item } as ReturnResult<T>);
  }

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('MultipleObservationReconciliationApiService', [
      'getWorksheetsDropdown',
      'getTestsDropdown',
      'getPendingTests',
      'getTestDetails',
      'getValidResults',
      'getValidInterpretations',
      'updateBandValues',
      'validateCombination',
      'reconcileTest',
      'commitReconciliation',
      'getOtherBands',
      'saveOtherBands',
      'deleteOtherBands',
      'getValidTestBands',
      'getNote',
      'saveNote',
      'deleteNote',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService();

    apiServiceSpy.getWorksheetsDropdown.and.returnValue(successResponse(mockWorksheets));
    apiServiceSpy.getTestsDropdown.and.returnValue(successResponse(mockTests));
    apiServiceSpy.getPendingTests.and.returnValue(successResponse(mockPendingTests));
    apiServiceSpy.getTestDetails.and.returnValue(successItemResponse(mockTestDetails));
    apiServiceSpy.getValidResults.and.returnValue(successResponse(mockValidResults));
    apiServiceSpy.getValidInterpretations.and.returnValue(successResponse(mockValidInterpretations));
    apiServiceSpy.updateBandValues.and.returnValue(successResponse([{ totalUpdated: 3 }]));
    apiServiceSpy.validateCombination.and.returnValue(successItemResponse({ calculatedInterpretation: 'A POS', isMatch: true }));
    apiServiceSpy.reconcileTest.and.returnValue(successResponse([]));
    apiServiceSpy.commitReconciliation.and.returnValue(successResponse([]));
    apiServiceSpy.saveOtherBands.and.returnValue(successResponse([]));
    apiServiceSpy.getNote.and.returnValue(successItemResponse({ noteId: 1, note: 'Test note', insertUser: 'user1', insertDate: '2026-01-15' } as NoteDto));
    apiServiceSpy.saveNote.and.returnValue(successItemResponse({ noteId: 2, note: 'New note' } as NoteDto));
    apiServiceSpy.deleteNote.and.returnValue(successResponse([]));
    apiServiceSpy.getOtherBands.and.returnValue(successResponse(mockOtherBands));
    apiServiceSpy.getValidTestBands.and.returnValue(successResponse([]));



      TestBed.configureTestingModule({
imports: [MultipleObservationReconciliationComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MultipleObservationReconciliationApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });


    });



  beforeEach(() => {

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      apiServiceSpy.getWorksheetsDropdown.and.returnValue(successResponse(mockWorksheets));


      apiServiceSpy.getTestsDropdown.and.returnValue(successResponse(mockTests));


      apiServiceSpy.getPendingTests.and.returnValue(successResponse(mockPendingTests));


      apiServiceSpy.getTestDetails.and.returnValue(successItemResponse(mockTestDetails));


      apiServiceSpy.getValidResults.and.returnValue(successResponse(mockValidResults));


      apiServiceSpy.getValidInterpretations.and.returnValue(successResponse(mockValidInterpretations));


      apiServiceSpy.updateBandValues.and.returnValue(successResponse([{ totalUpdated: 3 }]));


      apiServiceSpy.validateCombination.and.returnValue(successItemResponse({ calculatedInterpretation: 'A POS', isMatch: true }));


      apiServiceSpy.reconcileTest.and.returnValue(successResponse([]));


      apiServiceSpy.commitReconciliation.and.returnValue(successResponse([]));


      apiServiceSpy.saveOtherBands.and.returnValue(successResponse([]));


      apiServiceSpy.getNote.and.returnValue(successItemResponse({ noteId: 1, note: 'Test note', insertUser: 'user1', insertDate: '2026-01-15' } as NoteDto));


      apiServiceSpy.saveNote.and.returnValue(successItemResponse({ noteId: 2, note: 'New note' } as NoteDto));


      apiServiceSpy.deleteNote.and.returnValue(successResponse([]));


      apiServiceSpy.getOtherBands.and.returnValue(successResponse(mockOtherBands));


      apiServiceSpy.getValidTestBands.and.returnValue(successResponse([]));


    fixture = TestBed.createComponent(MultipleObservationReconciliationComponent);
    component = fixture.componentInstance;
    c = component;


    });

  // ── Creation ─────────────────────────────────────────────────────────────

  describe('Initialization', () => {

    it('should load worksheets on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getWorksheetsDropdown).toHaveBeenCalledTimes(1);
      expect(component.worksheets().length).toBe(2);
    }));




    it('should start with empty headerConfig', () => {
      expect(component.headerConfig.title).toBe('');
    });

    it('should initialize all signals to default state', () => {
      expect(component.pendingTests().length).toBe(0);
      expect(component.selectedUnit()).toBeNull();
      expect(component.testDetails()).toBeNull();
      expect(component.isObservationEditMode()).toBeFalse();
      expect(component.isOtherBandsEditMode()).toBeFalse();
      expect(component.noteData()).toBeNull();
    });
  });

  // ── Worksheet Search Filtering ──────────────────────────────────────────

  describe('filteredWorksheets', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all worksheets when search is empty', () => {
      component.worksheetSearch.set('');
      expect(component.filteredWorksheets().length).toBe(2);
    });



  });

  // ── Test Search Filtering ───────────────────────────────────────────────

  describe('filteredTests', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.tests.set(mockTests);
    }));

    it('should return all tests when search is empty', () => {
      component.testIdSearch.set('');
      expect(component.filteredTests().length).toBe(2);
    });



  });

  // ── Worksheet Selection → Load Tests ────────────────────────────────────

  describe('Worksheet selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load tests when worksheet is selected', fakeAsync(() => {
      component.filterForm.patchValue({ worksheetId: 'WS001' });
      tick();
      expect(apiServiceSpy.getTestsDropdown).toHaveBeenCalledWith('WS001');
      expect(component.tests().length).toBe(2);
    }));

    it('should clear testId when worksheet changes', fakeAsync(() => {
      component.filterForm.patchValue({ worksheetId: 'WS001', testId: 'ABO' });
      tick();
      component.filterForm.patchValue({ worksheetId: 'WS002' });
      tick();
      expect(component.filterForm.get('testId')?.value).toBe('');
    }));

    it('should clear results when worksheet changes', fakeAsync(() => {
      component.filterForm.patchValue({ worksheetId: 'WS001' });
      tick();
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      component.filterForm.patchValue({ worksheetId: 'WS002' });
      tick();
      expect(component.pendingTests().length).toBe(0);
      expect(component.selectedUnit()).toBeNull();
    }));


  });

  // ── Test Selection → Load Pending Tests ─────────────────────────────────

  describe('Test selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ worksheetId: 'WS001' });
      tick();
    }));

    it('should load pending tests when test is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(apiServiceSpy.getPendingTests).toHaveBeenCalledWith('ABO', 'WS001');
      expect(component.pendingTests().length).toBe(2);
    }));

    it('should auto-select first unit', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(component.selectedUnit()?.unitId).toBe('U001');
    }));

    it('should load valid results when test is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(apiServiceSpy.getValidResults).toHaveBeenCalledWith('ABO');
      expect(component.validResults().length).toBe(2);
    }));

    it('should load valid interpretations when test is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(apiServiceSpy.getValidInterpretations).toHaveBeenCalledWith('ABO');
      expect(component.validInterpretations().length).toBe(2);
    }));

    it('should set hasSearched to true', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(component.hasSearched).toBeTrue();
    }));


    it('should handle empty pending tests', fakeAsync(() => {
      apiServiceSpy.getPendingTests.and.returnValue(successResponse([]));
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
      expect(component.pendingTests().length).toBe(0);
    }));


  });

  // ── Unit Selection ──────────────────────────────────────────────────────

  describe('onSelectUnit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedUnit', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(component.selectedUnit()?.unitId).toBe('U001');
    }));

    it('should load test details for selected unit', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(apiServiceSpy.getTestDetails).toHaveBeenCalledWith('U001', 'WS001', 'ABO', 1);
    }));

    it('should populate testDetails signal', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(component.testDetails()).toBeTruthy();
      expect(component.testDetails()?.unitId).toBe('U001');
    }));

    it('should populate filteredBandDetails', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(component.filteredBandDetails().length).toBe(3);
    }));


    it('should set testDetails to null on error', fakeAsync(() => {
      apiServiceSpy.getTestDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(component.testDetails()).toBeNull();
      expect(component.isLoadingDetails).toBeFalse();
    }));

    it('should preserve superBandVal from API response (no auto-fill on unit selection)', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      const details = component.testDetails();
      const antiA = details?.bandDetails.find(b => b.bandName === 'Anti-A');
      expect(antiA?.superBandVal).toBe('');
    }));

    it('should preserve superBandVal as empty when tech values differ', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      const details = component.testDetails();
      const antiD = details?.bandDetails.find(b => b.bandName === 'Anti-D');
      expect(antiD?.superBandVal).toBe('');
    }));

    it('should set resultCodeCtrl from superIntp', fakeAsync(() => {
      const detailsWithResult = { ...mockTestDetails, superIntp: 'A POS' };
      apiServiceSpy.getTestDetails.and.returnValue(successItemResponse(detailsWithResult));
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(component.resultCodeCtrl.value).toBe('A POS');
    }));

    it('should load note via getNote API', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      expect(apiServiceSpy.getNote).toHaveBeenCalledWith('WS001', 'ABO', 'U001', 1);
      expect(component.noteData()?.noteId).toBe(1);
      expect(component.noteData()?.note).toBe('Test note');
    }));

    it('should build other band composite rows', fakeAsync(() => {
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      const rows = component.otherBandCompositeRows();
      expect(rows.length).toBe(1);
      expect(rows[0].tech1Band1).toBe('X1');
      expect(rows[0].tech2Band1).toBe('X2');
      expect(rows[0].supBand1).toBe('X3');
    }));
  });

  // ── Observation Bands Edit Mode ─────────────────────────────────────────

  describe('Observation bands edit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));

    it('should enter edit mode', () => {
      component.onObservationEditMode();
      expect(component.isObservationEditMode()).toBeTrue();
    });


    it('should auto-fill sup value where tech1 equals tech2', () => {
      component.onObservationEditMode();
      const antiA = component.observationEditRows.find(r => r.bandName === 'Anti-A');
      expect(antiA?.superBandVal).toBe('4+');
    });


    it('should not enter edit mode when filteredBandDetails is empty', () => {
      component.filteredBandDetails.set([]);
      component.onObservationEditMode();
      expect(component.isObservationEditMode()).toBeFalse();
    });

    it('should exit edit mode on cancel', () => {
      component.onObservationEditMode();
      component.onObservationCancel();
      expect(component.isObservationEditMode()).toBeFalse();
      expect(component.observationEditRows.length).toBe(0);
    });
  });

  // ── Observation Save ────────────────────────────────────────────────────

  describe('onObservationSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      component.onObservationEditMode();
    }));

    it('should call updateBandValues with correct params', fakeAsync(() => {
      component.onObservationSave();
      tick();
      expect(apiServiceSpy.updateBandValues).toHaveBeenCalledWith(
        'U001', 'WS001', 'ABO', 1,
        jasmine.objectContaining({ bandValues: jasmine.any(Array) }),
      );
    }));


    it('should set resultCodeCtrl when combination matches', fakeAsync(() => {
      const detailsAfterSave = { ...mockTestDetails, superIntp: 'A POS' };
      apiServiceSpy.getTestDetails.and.returnValue(successItemResponse(detailsAfterSave));
      component.onObservationSave();
      tick();
      expect(component.resultCodeCtrl.value).toBe('A POS');
    }));


    it('should exit edit mode after successful save', fakeAsync(() => {
      component.onObservationSave();
      tick();
      expect(component.isObservationEditMode()).toBeFalse();
    }));


    it('should set savingObservations to false after success', fakeAsync(() => {
      component.onObservationSave();
      tick();
      expect(component.savingObservations()).toBeFalse();
    }));

    it('should set savingObservations to false on band update error', fakeAsync(() => {
      apiServiceSpy.updateBandValues.and.returnValue(throwError(() => new Error('fail')));
      component.onObservationSave();
      tick();
      expect(component.savingObservations()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should set savingObservations to false on validation error', fakeAsync(() => {
      apiServiceSpy.validateCombination.and.returnValue(throwError(() => new Error('fail')));
      component.onObservationSave();
      tick();
      expect(component.savingObservations()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Validation failed.');
    }));


  });

  // ── Other Bands Edit ────────────────────────────────────────────────────

  describe('Other bands edit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));

    it('should enter other bands edit mode', () => {
      component.onOtherBandsEditMode();
      expect(component.isOtherBandsEditMode()).toBeTrue();
      expect(component.otherBandsEditRows.length).toBe(1);
    });

    it('should exit edit mode on cancel', () => {
      component.onOtherBandsEditMode();
      component.onOtherBandsCancel();
      expect(component.isOtherBandsEditMode()).toBeFalse();
      expect(component.otherBandsEditRows.length).toBe(0);
    });

    it('should add new empty row', () => {
      component.onOtherBandsEditMode();
      const before = component.otherBandsEditRows.length;
      component.onAddOtherBandRow();
      expect(component.otherBandsEditRows.length).toBe(before + 1);
      const last = component.otherBandsEditRows[component.otherBandsEditRows.length - 1];
      expect(last.supBand1).toBe('');
      expect(last.supBand2).toBe('');
    });
  });

  // ── Other Bands Save ────────────────────────────────────────────────────

  describe('onOtherBandsSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
      component.onOtherBandsEditMode();
    }));

    it('should call saveOtherBands with correct params', fakeAsync(() => {
      component.otherBandsEditRows[0].supBand1 = 'SB1';
      component.otherBandsEditRows[0].supBand2 = 'SB2';
      component.onOtherBandsSave();
      tick();
      expect(apiServiceSpy.saveOtherBands).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'U001',
          tbId: 'WS001',
          testId: 'ABO',
          tbSeqNo: 1,
        }),
      );
    }));


    it('should exit edit mode after save', fakeAsync(() => {
      component.onOtherBandsSave();
      tick();
      expect(component.isOtherBandsEditMode()).toBeFalse();
    }));

    it('should set savingOtherBands to false on error', fakeAsync(() => {
      apiServiceSpy.saveOtherBands.and.returnValue(throwError(() => new Error('fail')));
      component.onOtherBandsSave();
      tick();
      expect(component.savingOtherBands()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

  });

  // ── Reconcile Unit ──────────────────────────────────────────────────────

  describe('onReconcileUnit (auto-reconcile via resultCodeCtrl)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));


    it('should call reconcileTest with correct params', fakeAsync(() => {
      component.resultCodeCtrl.setValue('A POS');
      tick();
      expect(apiServiceSpy.reconcileTest).toHaveBeenCalledWith(
        'U001', 'WS001', 'ABO', 1, { superIntp: 'A POS' },
      );
    }));

    it('should add unit to reconciledUnits set', fakeAsync(() => {
      component.resultCodeCtrl.setValue('A POS');
      tick();
      expect(component.reconciledUnits().has('U001')).toBeTrue();
    }));



  });

  // ── Commit All ──────────────────────────────────────────────────────────

  describe('onCommitAll', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ worksheetId: 'WS001' });
      tick();
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();
    }));


    it('should call commitReconciliation with reconciled units', fakeAsync(() => {
      component.reconciledUnits.set(new Set(['U001']));
      component.onCommitAll();
      tick();
      expect(apiServiceSpy.commitReconciliation).toHaveBeenCalledWith(
        jasmine.objectContaining({
          tbId: 'WS001',
          testId: 'ABO',
          antigenFlag: 'N',
          units: jasmine.any(Array),
        }),
      );
    }));




    it('should set savingCommit to false on error', fakeAsync(() => {
      component.reconciledUnits.set(new Set(['U001']));
      apiServiceSpy.commitReconciliation.and.returnValue(throwError(() => new Error('fail')));
      component.onCommitAll();
      tick();
      expect(component.savingCommit()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

  });

  // ── Notes ───────────────────────────────────────────────────────────────

  describe('Notes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));

    describe('onAddNote', () => {
      it('should call saveNote with correct params', fakeAsync(() => {
        component.notesText = 'New test note';
        component.onAddNote();
        tick();
        expect(apiServiceSpy.saveNote).toHaveBeenCalledWith(
          jasmine.objectContaining({
            tbId: 'WS001',
            testId: 'ABO',
            unitId: 'U001',
            note: 'New test note',
          }),
        );
      }));


      it('should clear notesText after save', fakeAsync(() => {
        component.notesText = 'New note';
        component.onAddNote();
        tick();
        expect(component.notesText).toBe('');
      }));




    });

    describe('onEditNote', () => {

      it('should not set editing state when noteData is null', () => {
        component.noteData.set(null);
        component.onEditNote();
        expect(component.editingNoteId()).toBeNull();
      });
    });

    describe('onUpdateNote', () => {
      it('should call saveNote with noteId', fakeAsync(() => {
        component.onEditNote();
        component.notesText = 'Updated note';
        component.onUpdateNote();
        tick();
        expect(apiServiceSpy.saveNote).toHaveBeenCalledWith(
          jasmine.objectContaining({
            noteId: 1,
            note: 'Updated note',
          }),
        );
      }));



    });

    describe('onDeleteNote', () => {
      it('should call deleteNote with noteId', fakeAsync(() => {
        component.onDeleteNote();
        tick();
        expect(apiServiceSpy.deleteNote).toHaveBeenCalledWith(1);
      }));




    });
  });

  // ── Utility Methods ─────────────────────────────────────────────────────

  describe('Utility methods', () => {
    it('displayValue should return dash for null', () => {
      expect(component.displayValue(null)).toBe('-');
    });

    it('displayValue should return dash for undefined', () => {
      expect(component.displayValue(undefined)).toBe('-');
    });


    it('displayValue should return string for valid value', () => {
      expect(component.displayValue('4+')).toBe('4+');
    });

    it('displayValue should return string for number', () => {
      expect(component.displayValue(42)).toBe('42');
    });

    it('getInitials should return first two initials', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('getInitials should handle single name', () => {
      expect(component.getInitials('Admin')).toBe('A');
    });


    it('getInitials should handle three names', () => {
      expect(component.getInitials('John Michael Doe')).toBe('JM');
    });

    it('formatDate should format ISO date', () => {
      const result = component.formatDate('2026-01-15T00:00:00');
      expect(result).toBe('15-JAN-2026');
    });

    it('formatDate should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

  });

  // ── Result Description ──────────────────────────────────────────────────

  describe('resultDescription', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.validInterpretations.set(mockValidInterpretations);
    }));

    it('should return matching description', () => {
      component.resultCodeCtrl.setValue('A POS');
      expect(component.resultDescription()).toBe('A Positive');
    });

  });

  // ── Chapter Change ──────────────────────────────────────────────────────

  describe('Chapter change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset form and reload worksheets on chapter change', fakeAsync(() => {
      component.filterForm.patchValue({ worksheetId: 'WS001', testId: 'ABO' });
      tick();
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('worksheetId')?.value).toBe('WS001');
      expect(component.filterForm.get('testId')?.value).toBe('ABO');
      expect(apiServiceSpy.getWorksheetsDropdown).toHaveBeenCalledTimes(1);
    }));

    it('should clear results on chapter change', fakeAsync(() => {
      component.filterForm.patchValue({ worksheetId: 'WS001' });
      tick();
      component.filterForm.patchValue({ testId: 'ABO' });
      tick();

      chapterChangedSubject.next();
      tick();

      expect(component.pendingTests().length).toBe(2);
      expect(component.selectedUnit()?.unitId).toBe('U001');
    }));
  });

  // ── Observation Search Filter ───────────────────────────────────────────

  describe('Observation search filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));


    it('should show all bands when search is cleared', fakeAsync(() => {
      component.observationSearch.setValue('anti-a');
      tick(300);
      component.observationSearch.setValue('');
      tick(300);
      expect(component.filteredBandDetails().length).toBe(3);
    }));
  });

  // ── Other Bands Search Filter ───────────────────────────────────────────

  describe('Other bands search filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSelectUnit(mockPendingTests[0]);
      tick();
    }));

    it('should filter other bands by tech values', fakeAsync(() => {
      component.otherBandsSearch.setValue('x1');
      tick(300);
      expect(component.filteredOtherBands().length).toBe(1);
    }));

    it('should show all rows when search is cleared', fakeAsync(() => {
      component.otherBandsSearch.setValue('x1');
      tick(300);
      component.otherBandsSearch.setValue('');
      tick(300);
      expect(component.filteredOtherBands().length).toBe(1);
    }));
  });

  // ── buildOtherBandCompositeRows ─────────────────────────────────────────

  describe('buildOtherBandCompositeRows', () => {
    it('should handle uneven tech arrays', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const unevenBands: OtherBandDto[] = [
        { tech: '1', band1: 'A1', band2: 'B1' },
        { tech: '1', band1: 'A2', band2: 'B2' },
        { tech: '2', band1: 'C1', band2: 'D1' },
      ];
      apiServiceSpy.getOtherBands.and.returnValue(successResponse(unevenBands));
      component.onSelectUnit(mockPendingTests[0]);
      tick();

      const rows = component.otherBandCompositeRows();
      expect(rows.length).toBe(2);
      expect(rows[0].tech1Band1).toBe('A1');
      expect(rows[0].tech2Band1).toBe('C1');
      expect(rows[1].tech1Band1).toBe('A2');
      expect(rows[1].tech2Band1).toBe('');
    }));

    it('should handle empty other bands', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      apiServiceSpy.getOtherBands.and.returnValue(successResponse([]));
      component.onSelectUnit(mockPendingTests[0]);
      tick();

      expect(component.otherBandCompositeRows().length).toBe(0);
    }));
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────
});
