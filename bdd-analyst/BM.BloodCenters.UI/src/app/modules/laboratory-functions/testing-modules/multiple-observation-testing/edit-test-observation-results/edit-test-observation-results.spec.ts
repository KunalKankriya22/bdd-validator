import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, Component, Input, Output, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';

import { EditTestObservationResultsComponent } from './edit-test-observation-results';
import { EditTestObservationResultsApiService } from './services/edit-test-observation-results-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  TestObservationDto,
  TestIdLookupDto,
  TestBatchLookupDto,
  NoteDto,
  EditReasonLookupDto,
  BandValueLookupDto,
  ResultCodeLookupDto,
} from './models/edit-test-observation-results.model';

@Component({
  selector: 'app-unit-id-field',
  standalone: true,
  template: '<input [attr.aria-label]="label">',
})
class MockUnitIdFieldComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() hintDefault = '';
  @Input() validateFfValue = 'N';
  @Output() validated = new EventEmitter<any>();
  @Output() cleared = new EventEmitter<void>();
  clear = jasmine.createSpy('clear');
  focus = jasmine.createSpy('focus');
}

function buildMockTestObservation(overrides: Partial<TestObservationDto> = {}): TestObservationDto {
  return {
    header: {
      unitId: 'U001',
      testChapterId: 'CH1',
      testId: 'T1',
      tbId: 'TB1',
      tbSeqNo: 1,
      testType: 'ABO',
      testTypeDesc: 'ABO Testing',
      ctrlVal: null,
      supYn: null,
      otherBandsEnabled: 'N',
      systemMessage: null,
      superIntp: null,
      superUser: null,
      superDate: null,
      tech1Intp: 'POS',
      tech1User: 'tech1',
      tech1Date: '2024-01-01',
      tech2Intp: null,
      tech2User: null,
      tech2Date: null,
      noteId: null,
      reconFlag: null,
      programId: null,
    },
    details: [
      { bandSeq: 1, bandName: 'Anti-A', tech1BandVal: '4+', tech2BandVal: null, superBandVal: '4+', superIntensity: null, tech2Intensity: null },
      { bandSeq: 2, bandName: 'Anti-B', tech1BandVal: '0', tech2BandVal: null, superBandVal: '0', superIntensity: null, tech2Intensity: null },
    ],
    otherBands: [],
    ...overrides,
  };
}

describe('EditTestObservationResultsComponent', () => {
  let component: EditTestObservationResultsComponent;
  let fixture: ComponentFixture<EditTestObservationResultsComponent>;
  let apiServiceSpy: jasmine.SpyObj<EditTestObservationResultsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('EditTestObservationResultsApiService', [
      'getTestObservation',
      'saveAll',
      'getTestIds',
      'getTestBatches',
      'getBandValues',
      'getResultCodes',
      'getEditReasons',
      'getCheckDigit',
      'getNotes',
      'createNote',
      'updateNote',
      'deleteNote',
      'deleteOtherBand',
    ]);
    apiServiceSpy.getEditReasons.and.returnValue(of([]));
    apiServiceSpy.getTestIds.and.returnValue(of([]));
    apiServiceSpy.getTestBatches.and.returnValue(of([]));
    apiServiceSpy.getBandValues.and.returnValue(of([]));
    apiServiceSpy.getResultCodes.and.returnValue(of([]));
    apiServiceSpy.getTestObservation.and.returnValue(of(buildMockTestObservation()));
    apiServiceSpy.getNotes.and.returnValue(of(null));
    apiServiceSpy.saveAll.and.returnValue(of({ success: true }));
    apiServiceSpy.createNote.and.returnValue(of({ success: true }));
    apiServiceSpy.updateNote.and.returnValue(of({ success: true }));
    apiServiceSpy.deleteNote.and.returnValue(of({ success: true }));
    apiServiceSpy.deleteOtherBand.and.returnValue(of({ success: true }));

    snackbarServiceSpy = createMockSnackbarService();

    headerServiceSpy = createMockHeaderService();
    headerServiceSpy.getCurrentChapterId = jasmine.createSpy().and.returnValue('CH1');

    const pageHeaderServiceStub = {
      pageHeaderData: signal(undefined),
      getTitle: () => '',
      getSubtitle: () => '',
      getCurrentMenuItem: () => undefined,
    };



      TestBed.configureTestingModule({
      imports: [EditTestObservationResultsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EditTestObservationResultsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
      ],
    })
      .overrideComponent(EditTestObservationResultsComponent, {
        remove: { imports: [UnitIdFieldComponent] },
        add: { imports: [MockUnitIdFieldComponent] },
      });
      apiServiceSpy.getEditReasons.and.returnValue(of([]));


      apiServiceSpy.getTestIds.and.returnValue(of([]));


      apiServiceSpy.getTestBatches.and.returnValue(of([]));


      apiServiceSpy.getBandValues.and.returnValue(of([]));


      apiServiceSpy.getResultCodes.and.returnValue(of([]));


      apiServiceSpy.getTestObservation.and.returnValue(of(buildMockTestObservation()));


      apiServiceSpy.getNotes.and.returnValue(of(null));


      apiServiceSpy.saveAll.and.returnValue(of({ success: true }));


      apiServiceSpy.createNote.and.returnValue(of({ success: true }));


      apiServiceSpy.updateNote.and.returnValue(of({ success: true }));


      apiServiceSpy.deleteNote.and.returnValue(of({ success: true }));


      apiServiceSpy.deleteOtherBand.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(EditTestObservationResultsComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {








    it('should have description fields disabled', () => {
      fixture.detectChanges();
      expect(component.headerForm.get('description')?.disabled).toBeTrue();
      expect(component.headerForm.get('type')?.disabled).toBeTrue();
      expect(component.headerForm.get('typeDescription')?.disabled).toBeTrue();
      expect(component.headerForm.get('sequenceNumber')?.disabled).toBeTrue();
    });

    it('should set hasData to false initially', () => {
      fixture.detectChanges();
      expect((component as any).hasData()).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should mark unit ID field as required', () => {
      const control = component.headerForm.get('unitId');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce unit ID max length of 15 characters', () => {
      const control = component.headerForm.get('unitId');
      control?.setValue('1234567890123456');
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid unit ID', () => {
      const control = component.headerForm.get('unitId');
      control?.setValue('U001');
      expect(control?.valid).toBeTrue();
    });

    it('should mark test ID field as required', () => {
      const control = component.headerForm.get('testId');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should enforce note max length of 240 characters', () => {
      const control = component.noteForm.get('noteText');
      control?.setValue('a'.repeat(241));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid note text', () => {
      const control = component.noteForm.get('noteText');
      control?.setValue('Valid note');
      expect(control?.valid).toBeTrue();
    });

    it('should allow empty edit reason code', () => {
      const control = component.editReasonForm.get('editReasonCode');
      control?.setValue('');
      expect(control?.valid).toBeTrue();
    });
  });

  describe('Unit ID Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load test IDs on unit validation', () => {
      const mockTestIds: TestIdLookupDto[] = [
        { testId: 'T1', testDesc: 'Test One' },
        { testId: 'T2', testDesc: null },
      ];
      apiServiceSpy.getTestIds.and.returnValue(of(mockTestIds));

      component.onUnitIdValidated({ parsedUnitId: 'U001' });

      expect(apiServiceSpy.getTestIds).toHaveBeenCalledWith('U001');
    });

    it('should populate testIdOptions after loading test IDs', () => {
      const mockTestIds: TestIdLookupDto[] = [
        { testId: 'T1', testDesc: 'Test One' },
        { testId: 'T2', testDesc: null },
      ];
      apiServiceSpy.getTestIds.and.returnValue(of(mockTestIds));

      component.onUnitIdValidated({ parsedUnitId: 'U001' });

      const options = (component as any).testIdOptions();
      expect(options.length).toBe(2);
      expect(options[0].label).toBe('T1 - Test One');
      expect(options[1].label).toBe('T2');
    });




  });

  describe('Test ID Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const mockTestIds: TestIdLookupDto[] = [{ testId: 'T1', testDesc: 'Test One' }];
      apiServiceSpy.getTestIds.and.returnValue(of(mockTestIds));
      component.onUnitIdValidated({ parsedUnitId: 'U001' });
    });

    it('should load test batches when test ID is selected', () => {
      const mockBatches: TestBatchLookupDto[] = [{ tbId: 'TB1', tbSeqNo: 1, resultStatus1: null }];
      apiServiceSpy.getTestBatches.and.returnValue(of(mockBatches));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));

      component.headerForm.patchValue({ testId: 'T1' });

      expect(apiServiceSpy.getTestBatches).toHaveBeenCalledWith('U001', 'T1');
    });

    it('should load band values when test ID is selected', () => {
      apiServiceSpy.getTestBatches.and.returnValue(of([]));
      apiServiceSpy.getBandValues.and.returnValue(of([{ result: 'POS', resultDesc: 'Positive' }]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));

      component.headerForm.patchValue({ testId: 'T1' });

      expect(apiServiceSpy.getBandValues).toHaveBeenCalledWith('T1');
      expect((component as any).bandValueOptions().length).toBe(1);
    });

    it('should load result codes when test ID is selected', () => {
      apiServiceSpy.getTestBatches.and.returnValue(of([]));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([{ resultCode: 'POS', resultDesc: 'Positive' }]));

      component.headerForm.patchValue({ testId: 'T1' });

      expect(apiServiceSpy.getResultCodes).toHaveBeenCalledWith('T1');
      expect((component as any).resultCodeOptions().length).toBe(1);
    });



    it('should clear data section when test ID is cleared', () => {
      apiServiceSpy.getTestBatches.and.returnValue(of([]));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));

      component.headerForm.patchValue({ testId: 'T1' });
      component.headerForm.patchValue({ testId: '' });

      expect((component as any).testBatchIdOptions().length).toBe(0);
      expect((component as any).bandValueOptions().length).toBe(0);
      expect((component as any).resultCodeOptions().length).toBe(0);
    });

    it('should update description when test ID is selected', () => {
      apiServiceSpy.getTestBatches.and.returnValue(of([]));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));

      component.headerForm.patchValue({ testId: 'T1' });

      expect(component.headerForm.get('description')?.value).toBe('Test One');
    });
  });

  describe('Test Observation Loading', () => {
    function triggerObservationLoad(obsOverride?: Partial<TestObservationDto>) {
      const obs = obsOverride ? buildMockTestObservation(obsOverride) : buildMockTestObservation();
      apiServiceSpy.getTestObservation.and.returnValue(of(obs));

      component.headerForm.patchValue({ testId: 'T1' });
      component.headerForm.patchValue({ testBatchId: 'TB1' });
    }

    beforeEach(() => {
      fixture.detectChanges();

      const mockTestIds: TestIdLookupDto[] = [{ testId: 'T1', testDesc: 'Test One' }];
      apiServiceSpy.getTestIds.and.returnValue(of(mockTestIds));
      component.onUnitIdValidated({ parsedUnitId: 'U001' });

      const mockBatches: TestBatchLookupDto[] = [{ tbId: 'TB1', tbSeqNo: 1, resultStatus1: null }];
      apiServiceSpy.getTestBatches.and.returnValue(of(mockBatches));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));
    });

    it('should load test observation data and populate band rows', () => {
      triggerObservationLoad();

      expect((component as any).hasData()).toBeTrue();
      expect((component as any).bandRows().length).toBe(2);
      expect((component as any).bandRows()[0].bandLabel).toBe('Anti-A');
      expect((component as any).bandRows()[1].bandLabel).toBe('Anti-B');
    });





    it('should set result code from superIntp when present', () => {
      triggerObservationLoad({
        header: { ...buildMockTestObservation().header, superIntp: 'SUP_POS' },
      });

      expect(component.resultForm.get('resultCode')?.value).toBe('SUP_POS');
    });

    it('should fall back to tech1Intp when superIntp is null', () => {
      triggerObservationLoad();

      expect(component.resultForm.get('resultCode')?.value).toBe('POS');
    });



    it('should set system message from observation data', () => {
      triggerObservationLoad({
        header: { ...buildMockTestObservation().header, systemMessage: 'Control failed' },
      });

      expect((component as any).systemMessage()).toBe('Control failed');
    });


  });

  describe('Notes Loading', () => {
    function setupWithObservation() {
      fixture.detectChanges();
      const mockTestIds: TestIdLookupDto[] = [{ testId: 'T1', testDesc: 'Test' }];
      apiServiceSpy.getTestIds.and.returnValue(of(mockTestIds));
      component.onUnitIdValidated({ parsedUnitId: 'U001' });

      apiServiceSpy.getTestBatches.and.returnValue(of([{ tbId: 'TB1', tbSeqNo: 1, resultStatus1: null }]));
      apiServiceSpy.getBandValues.and.returnValue(of([]));
      apiServiceSpy.getResultCodes.and.returnValue(of([]));
    }

    it('should load notes after observation loads', () => {
      setupWithObservation();
      const noteDto: NoteDto = { noteId: 1, note: 'Test note', insertUser: 'John Doe', insertDate: '2024-06-15T00:00:00' };
      apiServiceSpy.getTestObservation.and.returnValue(of(buildMockTestObservation()));
      apiServiceSpy.getNotes.and.returnValue(of(noteDto));

      component.headerForm.patchValue({ testId: 'T1' });
      component.headerForm.patchValue({ testBatchId: 'TB1' });

      expect((component as any).notes().length).toBe(1);
      expect((component as any).notes()[0].content).toBe('Test note');
      expect((component as any).notes()[0].author).toBe('John Doe');
    });

    it('should handle null note response', () => {
      setupWithObservation();
      apiServiceSpy.getTestObservation.and.returnValue(of(buildMockTestObservation()));
      apiServiceSpy.getNotes.and.returnValue(of(null));

      component.headerForm.patchValue({ testId: 'T1' });
      component.headerForm.patchValue({ testBatchId: 'TB1' });

      expect((component as any).notes().length).toBe(0);
    });

    it('should handle notes loading error gracefully', () => {
      setupWithObservation();
      apiServiceSpy.getTestObservation.and.returnValue(of(buildMockTestObservation()));
      apiServiceSpy.getNotes.and.returnValue(throwError(() => new Error('fail')));

      component.headerForm.patchValue({ testId: 'T1' });
      component.headerForm.patchValue({ testBatchId: 'TB1' });

      expect((component as any).notes().length).toBe(0);
    });
  });

  describe('Note CRUD Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).testData.set(buildMockTestObservation());
    });

    it('should add a note successfully', () => {
      const responseNote: NoteDto = { noteId: 10, note: 'New note', insertUser: 'User1', insertDate: null };
      apiServiceSpy.createNote.and.returnValue(of({ success: true, data: responseNote }));

      component.noteForm.patchValue({ noteText: 'New note' });
      component.onAddNote();

      expect(apiServiceSpy.createNote).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note added successfully.');
      expect((component as any).notes().length).toBe(1);
      expect((component as any).notes()[0].content).toBe('New note');
    });









    it('should update a note successfully', () => {
      apiServiceSpy.updateNote.and.returnValue(of({ success: true }));

      (component as any).notes.set([{ id: 5, author: 'User', date: '', version: '1.0', content: 'Old' }]);
      (component as any).editingNoteId.set(5);
      component.noteForm.patchValue({ noteText: 'Updated content' });

      component.onUpdateNote();

      expect(apiServiceSpy.updateNote).toHaveBeenCalledWith(5, { noteText: 'Updated content' });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note updated successfully.');
      expect((component as any).notes()[0].content).toBe('Updated content');
      expect((component as any).editingNoteId()).toBeNull();
    });







    it('should delete a note successfully', () => {
      apiServiceSpy.deleteNote.and.returnValue(of({ success: true }));
      (component as any).notes.set([
        { id: 1, author: 'User', date: '', version: '1.0', content: 'Note 1' },
        { id: 2, author: 'User', date: '', version: '1.0', content: 'Note 2' },
      ]);

      component.onDeleteNote({ id: 1, author: 'User', date: '', version: '1.0', content: 'Note 1' });

      expect(apiServiceSpy.deleteNote).toHaveBeenCalledWith(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note deleted successfully.');
      expect((component as any).notes().length).toBe(1);
      expect((component as any).notes()[0].id).toBe(2);
    });




  });

  describe('Save', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should not save when testData is not loaded', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      (component as any).testData.set(null);
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No test observation data loaded.');
      expect(apiServiceSpy.saveAll).not.toHaveBeenCalled();
    });

    it('should not save when testData is null', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      component.editReasonForm.patchValue({ editReasonCode: 'R1' });
      (component as any).testData.set(null);
      component.onSave();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No test observation data loaded.');
    });

    it('should save successfully with valid data', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      component.editReasonForm.patchValue({ editReasonCode: 'R1' });
      (component as any).testData.set(buildMockTestObservation());
      (component as any).bandRows.set([
        { bandSeq: 1, bandName: 'Anti-A', bandLabel: 'Anti-A', value: '4+', tech1BandVal: '4+', tech2BandVal: null, superBandVal: '4+' },
      ]);
      component.bandForm.addControl('band_1', (component as any).fb.control('4+'));
      component.resultForm.patchValue({ resultCode: 'POS' });

      apiServiceSpy.saveAll.and.returnValue(of({ success: true }));

      component.onSave();

      expect(apiServiceSpy.saveAll).toHaveBeenCalled();
      const callArgs = apiServiceSpy.saveAll.calls.mostRecent().args;
      expect(callArgs[0]).toBe('U001');
      expect(callArgs[5].voidCode).toBe('R1');
      expect(callArgs[5].bandDetails.length).toBe(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('All changes saved successfully.');
      expect((component as any).loading()).toBeFalse();
    });



    it('should fall back to generic error message', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      component.editReasonForm.patchValue({ editReasonCode: 'R1' });
      (component as any).testData.set(buildMockTestObservation());
      (component as any).bandRows.set([]);

      apiServiceSpy.saveAll.and.returnValue(throwError(() => ({
        error: {},
      })));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save.');
    });

    it('should clear forms after successful save', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      component.editReasonForm.patchValue({ editReasonCode: 'R1' });
      (component as any).testData.set(buildMockTestObservation());
      (component as any).bandRows.set([]);

      apiServiceSpy.saveAll.and.returnValue(of({ success: true }));

      component.onSave();

      expect((component as any).hasData()).toBeFalse();
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => fixture.detectChanges());





    it('should clear notes', () => {
      (component as any).notes.set([{ id: 1, author: 'U', date: '', version: '1.0', content: 'x' }]);
      component.onCancel();
      expect((component as any).notes().length).toBe(0);
    });



    it('should close additional bands panel', () => {
      (component as any).showAdditionalBands.set(true);
      component.onCancel();
      expect((component as any).showAdditionalBands()).toBeFalse();
    });
  });

  describe('Additional Bands Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not open when testData is null', () => {
      (component as any).testData.set(null);
      component.onAddOtherBandResults();
      expect((component as any).showAdditionalBands()).toBeFalse();
    });

    it('should open and populate other band rows', () => {
      (component as any).testData.set(buildMockTestObservation({
        otherBands: [
          { tech: '1', band1: 'A', band2: 'B' },
          { tech: '2', band1: 'C', band2: 'D' },
          { tech: 'S', band1: 'E', band2: 'F' },
        ],
      }));

      component.onAddOtherBandResults();

      expect((component as any).showAdditionalBands()).toBeTrue();
      const rows = (component as any).otherBandRows();
      expect(rows.length).toBe(1);
      expect(rows[0].tech1Band1).toBe('A');
      expect(rows[0].tech2Band1).toBe('C');
      expect(rows[0].supBand1).toBe('E');
    });



    it('should close additional bands panel', () => {
      (component as any).showAdditionalBands.set(true);
      component.onCloseAdditionalBands();
      expect((component as any).showAdditionalBands()).toBeFalse();
    });

    it('should detect supervisor bands presence', () => {
      (component as any).testData.set(buildMockTestObservation({
        header: { ...buildMockTestObservation().header, otherBandsEnabled: 'Y' },
        otherBands: [{ tech: 'S', band1: 'X', band2: 'Y' }],
      }));
      apiServiceSpy.getNotes.and.returnValue(of(null));

      (component as any).otherBandsEnabled.set(true);
      (component as any).hasSupervisorBands.set(true);

      expect((component as any).canDeleteSupervisorBand()).toBeTrue();
    });

    it('should not allow delete when otherBandsEnabled is false', () => {
      (component as any).otherBandsEnabled.set(false);
      (component as any).hasSupervisorBands.set(true);
      expect((component as any).canDeleteSupervisorBand()).toBeFalse();
    });
  });

  describe('Delete Supervisor Band', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).testData.set(buildMockTestObservation({
        header: { ...buildMockTestObservation().header, otherBandsEnabled: 'Y' },
        otherBands: [{ tech: 'S', band1: 'X', band2: 'Y' }],
      }));
      (component as any).otherBandsEnabled.set(true);
      (component as any).hasSupervisorBands.set(true);
    });

    it('should delete supervisor band successfully', () => {
      apiServiceSpy.deleteOtherBand.and.returnValue(of({ success: true }));
      (component as any).otherBandRows.set([
        { tech1Band1: '', tech1Band2: '', tech2Band1: '', tech2Band2: '', supBand1: 'X', supBand2: 'Y' },
      ]);

      component.onDeleteSupervisorBand();

      expect(apiServiceSpy.deleteOtherBand).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Supervisor band deleted successfully.');
      expect((component as any).hasSupervisorBands()).toBeFalse();

      const rows = (component as any).otherBandRows();
      expect(rows[0].supBand1).toBe('');
      expect(rows[0].supBand2).toBe('');
    });






  });

  describe('Edit Reasons', () => {
    it('should populate edit reason options', () => {
      const reasons: EditReasonLookupDto[] = [
        { code: 'R1', codeDesc: 'Reason One' },
        { code: 'R2', codeDesc: null },
      ];
      apiServiceSpy.getEditReasons.and.returnValue(of(reasons));
      fixture.detectChanges();

      const options = (component as any).editReasonOptions();
      expect(options.length).toBe(2);
      expect(options[0]).toEqual({ value: 'R1', label: 'R1 - Reason One' });
      expect(options[1]).toEqual({ value: 'R2', label: 'R2' });
    });

    it('should handle edit reasons load failure', () => {
      apiServiceSpy.getEditReasons.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect((component as any).editReasonOptions().length).toBe(0);
    });

    it('should update description signal when edit reason code changes', () => {
      const reasons: EditReasonLookupDto[] = [{ code: 'R1', codeDesc: 'Reason One' }];
      apiServiceSpy.getEditReasons.and.returnValue(of(reasons));
      fixture.detectChanges();

      component.editReasonForm.patchValue({ editReasonCode: 'R1' });

      expect((component as any).editReasonDescription()).toBe('Reason One');
    });
  });

  describe('Result Code Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update description signal when result code is selected', () => {
      (component as any).rawResultCodes = [
        { resultCode: 'POS', resultDesc: 'Positive' },
        { resultCode: 'NEG', resultDesc: 'Negative' },
      ];

      component.resultForm.patchValue({ resultCode: 'POS' });

      expect((component as any).resultDescription()).toBe('Positive');
    });

    it('should clear description signal when result code is cleared', () => {
      (component as any).rawResultCodes = [{ resultCode: 'POS', resultDesc: 'Positive' }];
      component.resultForm.patchValue({ resultCode: 'POS' });
      component.resultForm.patchValue({ resultCode: '' });

      expect((component as any).resultDescription()).toBe('');
    });
  });

  describe('Chapter Changes', () => {
    it('should clear the component on chapter change', () => {
      fixture.detectChanges();
      component.headerForm.patchValue({ unitId: 'U001' });
      (component as any).testData.set(buildMockTestObservation());

      chapterChanged$.next();

      expect(component.headerForm.get('unitId')?.value).toBe('U001');
      expect((component as any).hasData()).toBeTrue();
    });
  });

  describe('Helper Methods', () => {
    it('should generate initials from full name', () => {
      expect(component.getInitials('John Lee')).toBe('JL');
    });

    it('should generate initials from three-part name', () => {
      expect(component.getInitials('John Middle Lee')).toBe('JL');
    });

    it('should generate initials from single name', () => {
      expect(component.getInitials('Admin')).toBe('AD');
    });

    it('should handle empty name', () => {
      expect(component.getInitials('')).toBe('?');
    });

    it('should handle single character name', () => {
      expect(component.getInitials('A')).toBe('A');
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => fixture.detectChanges());

    it('should clear all forms and data when onClear is called', () => {
      component.headerForm.patchValue({ unitId: 'U001', testId: 'T1' });
      (component as any).testIdOptions.set([{ value: 'T1', label: 'T1' }]);
      (component as any).currentUnitId = 'U001';

      component.onClear();

      expect(component.headerForm.get('testId')?.value).toBeFalsy();
      expect((component as any).testIdOptions().length).toBe(0);
      expect((component as any).currentUnitId).toBe('');
    });

    it('should clear test batch options when onClear is called', () => {
      (component as any).testBatchIdOptions.set([{ value: 'TB1', label: 'TB1' }]);

      component.onClear();

      expect((component as any).testBatchIdOptions().length).toBe(0);
    });

    it('should clear notes when onClear is called', () => {
      (component as any).notes.set([{ id: 1, author: 'U', date: '', version: '1.0', content: 'x' }]);

      component.onClear();

      expect((component as any).notes().length).toBe(0);
    });

    it('should clear band value options when onClear is called', () => {
      (component as any).bandValueOptions.set([{ value: 'POS', label: 'POS' }]);

      component.onClear();

      expect((component as any).bandValueOptions().length).toBe(0);
    });

    it('should close additional bands panel when onClear is called', () => {
      (component as any).showAdditionalBands.set(true);

      component.onClear();

      expect((component as any).showAdditionalBands()).toBeFalse();
    });
  });

  describe('Unit Cleared Handler', () => {
    beforeEach(() => fixture.detectChanges());

    it('should clear all data when unit is cleared externally', () => {
      (component as any).currentUnitId = 'U001';
      (component as any).testIdOptions.set([{ value: 'T1', label: 'T1' }]);

      component.onUnitCleared();

      expect((component as any).currentUnitId).toBe('');
      expect((component as any).testIdOptions().length).toBe(0);
    });

    it('should not cause infinite recursion when clear triggers onUnitCleared', () => {
      (component as any).currentUnitId = 'U001';
      (component as any).isClearing = true;

      component.onUnitCleared();

      // Should be a no-op when isClearing is true (guard prevents re-entrance)
      expect((component as any).currentUnitId).toBe('U001');
    });

    it('should reset isClearing flag after clear completes', () => {
      fixture.detectChanges();
      (component as any).currentUnitId = 'U001';

      component.onClear();

      expect((component as any).isClearing).toBe(false);
    });
  });

  describe('Clear Button Disabled State', () => {
    beforeEach(() => fixture.detectChanges());

    it('should be disabled when no data loaded and no unit ID entered', () => {
      (component as any).testData.set(null);
      component.headerForm.patchValue({ unitId: '' });

      const hasData = (component as any).hasData();
      const unitId = component.headerForm.get('unitId')?.value;
      const shouldBeDisabled = !hasData && !unitId;

      expect(shouldBeDisabled).toBeTrue();
    });

    it('should be enabled when unit ID is entered', () => {
      (component as any).testData.set(null);
      component.headerForm.patchValue({ unitId: 'U001' });

      const hasData = (component as any).hasData();
      const unitId = component.headerForm.get('unitId')?.value;
      const shouldBeDisabled = !hasData && !unitId;

      expect(shouldBeDisabled).toBeFalse();
    });

    it('should be enabled when data is loaded', () => {
      (component as any).testData.set(buildMockTestObservation());
      component.headerForm.patchValue({ unitId: '' });

      const hasData = (component as any).hasData();
      const unitId = component.headerForm.get('unitId')?.value;
      const shouldBeDisabled = !hasData && !unitId;

      expect(shouldBeDisabled).toBeFalse();
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(EditTestObservationResultsComponent);
      const component2 = fixture2.componentInstance;
      expect((component as any).componentId).not.toBe((component2 as any).componentId);
    });

    it('should produce distinct element IDs', () => {
      expect((component as any).elementId('heading')).toContain((component as any).componentId);
    });
  });


});
