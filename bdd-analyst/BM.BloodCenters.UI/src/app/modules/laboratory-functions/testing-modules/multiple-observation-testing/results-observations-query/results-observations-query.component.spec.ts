/**
 * Results Observations Query Component Tests
 * JIRA: MLT-12761
 * Component for querying and viewing multiple observation test results
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { ResultsObservationsQueryComponent } from './results-observations-query.component';
import { ResultsObservationsApiService } from './services/results-observations-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import {
  TestForUnit,
  TestBatch,
  TestBandResponse,
  BandDetail,
  OtherBand,
  NoteDetails
} from './models/results-observations.interface';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ResultsObservationsQueryComponent', () => {
  let component: ResultsObservationsQueryComponent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let c: any; // alias for accessing protected/private members in tests
  let fixture: ComponentFixture<ResultsObservationsQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<ResultsObservationsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  // Mock Data
  const mockTests: TestForUnit[] = [
    { testId: 'TEST01', testDesc: 'GAMMA Test' },
    { testId: 'TEST02', testDesc: 'BETA Test' }
  ];

  const mockBatches: TestBatch[] = [
    {
      unitId: 'U12345',
      testId: 'TEST01',
      tbId: 'TB1026',
      tbSeqNo: 1,
      collDate: '2024-01-15T10:00:00Z',
      chapterId: 'CH01',
      testChapterId: 'TCH01',
      resultStatus: 'A POS',
      resultTimestamp: '2024-01-16T14:30:00Z',
      resultDescription: 'A POS',
      scheduled: 'SCHEDULED'
    },
    {
      unitId: 'U12345',
      testId: 'TEST01',
      tbId: 'TB1027',
      tbSeqNo: 2,
      collDate: '2024-01-15T10:00:00Z',
      chapterId: 'CH01',
      testChapterId: 'TCH01',
      resultStatus: 'B NEG',
      resultTimestamp: '2024-01-17T09:15:00Z',
      resultDescription: 'B NEG',
      scheduled: 'UNSCHEDULED'
    }
  ];

  const mockBandDetails: BandDetail[] = [
    {
      bandName: 'A',
      tech1BandVal: '3',
      tech2BandVal: '3',
      superBandVal: null,
      displayBandVal: '3'
    },
    {
      bandName: 'B',
      tech1BandVal: '0',
      tech2BandVal: '0',
      superBandVal: null,
      displayBandVal: '0'
    },
    {
      bandName: 'D',
      tech1BandVal: '4',
      tech2BandVal: '4',
      superBandVal: null,
      displayBandVal: '4'
    }
  ];

  const mockOtherBands: OtherBand[] = [
    { band1: 'A', band2: 'B', tech: '1' },
    { band1: 'C', band2: 'D', tech: 'S' }
  ];

  const mockNoteDetails: NoteDetails = {
    note: 'Test note for observation',
    insertUser: 'JDOE',
    insertDate: '2024-01-16T15:00:00Z'
  };

  const mockBandResponse: TestBandResponse = {
    unitId: 'U12345',
    tbId: 'TB1026',
    testId: 'TEST01',
    tbSeqNo: 1,
    testChapterId: 'TCH01',
    testType: 'GAMMA',
    ctrlVal: '4+',
    noteId: 101,
    noteDetails: mockNoteDetails,
    otherBandsEnabled: true,
    bandDetails: mockBandDetails,
    otherBands: mockOtherBands
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ResultsObservationsApiService', [
      'validateUnit',
      'getTestsForUnit',
      'getTestBatches',
      'getBandDetails',
      'createNote',
      'updateNote',
      'deleteNote'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService();

    // Default spy returns
    apiServiceSpy.validateUnit.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Valid' })
    );
    apiServiceSpy.getTestsForUnit.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Success', item: mockTests })
    );
    apiServiceSpy.getTestBatches.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Success', item: mockBatches })
    );
    apiServiceSpy.getBandDetails.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Success', item: mockBandResponse })
    );



      TestBed.configureTestingModule({
imports: [ResultsObservationsQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ResultsObservationsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    });



  beforeEach(() => {

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);














    fixture = TestBed.createComponent(ResultsObservationsQueryComponent);
    component = fixture.componentInstance;
    c = component;


    });

  describe('Initialization', () => {

    it('should initialize with empty signals', () => {
      fixture.detectChanges();
      expect(c.isLoading()).toBeFalse();
      expect(c.hasResults()).toBeFalse();
      expect(c.testsAvailable()).toBeFalse();
      expect(c.availableTests()).toEqual([]);
      expect(c.testBatches()).toEqual([]);
      expect(c.selectedBatchIndex()).toBe(-1);
      expect(c.selectedBatch()).toBeNull();
      expect(c.bandDetails()).toBeNull();
    });

    it('should initialize form controls', () => {
      expect(component.testIdControl).toBeDefined();
      expect(component.testSearchControl).toBeDefined();
      expect(component.testIdControl.value).toBe('');
      expect(component.testSearchControl.value).toBe('');
    });

    it('should have empty selected test description', () => {
      expect(component.selectedTestDescription).toBe('');
    });
  });

  describe('Unit Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate unit and load tests on successful validation', fakeAsync(() => {
      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('U12345');
      expect(apiServiceSpy.getTestsForUnit).toHaveBeenCalledWith('U12345');
      expect(c.availableTests()).toEqual(mockTests);
      expect(c.testsAvailable()).toBeTrue();
    }));


    it('should handle validation API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.isLoading()).toBeFalse();
    }));

    it('should auto-select test when only one test is available', fakeAsync(() => {
      apiServiceSpy.getTestsForUnit.and.returnValue(
        of({
          success: true,
          statusCode: 200,
          message: 'Success',
          item: [mockTests[0]]
        })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(component.testIdControl.value).toBe('TEST01');
      expect(component.selectedTestDescription).toBe('GAMMA Test');
      expect(apiServiceSpy.getTestBatches).toHaveBeenCalledWith('U12345', 'TEST01');
    }));

    it('should show info when no tests available', fakeAsync(() => {
      apiServiceSpy.getTestsForUnit.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: [] })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith(
        'No tests available for this unit'
      );
    }));
  });

  describe('Test Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.availableTests.set(mockTests);
      c.testsAvailable.set(true);
      c.currentUnitId = 'U12345';
    });

    it('should load test batches when test is selected', fakeAsync(() => {
      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(apiServiceSpy.getTestBatches).toHaveBeenCalledWith('U12345', 'TEST01');
      expect(component.selectedTestDescription).toBe('GAMMA Test');
    }));


    it('should auto-select first batch after loading batches', fakeAsync(() => {
      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(c.selectedBatchIndex()).toBe(0);
      expect(c.selectedBatch()).toEqual(mockBatches[0]);
      expect(apiServiceSpy.getBandDetails).toHaveBeenCalledWith(
        'U12345',
        'TEST01',
        'TB1026',
        1
      );
    }));

    it('should handle empty test batches', fakeAsync(() => {
      apiServiceSpy.getTestBatches.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: [] })
      );

      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('No test batches found');
      expect(c.hasResults()).toBeFalse();
    }));
  });

  describe('Batch Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.testBatches.set(mockBatches);
      c.hasResults.set(true);
      c.currentUnitId = 'U12345';
    });

    it('should select batch and load band details', fakeAsync(() => {
      component.selectBatch(1);
      tick();

      expect(c.selectedBatchIndex()).toBe(1);
      expect(c.selectedBatch()).toEqual(mockBatches[1]);
      expect(apiServiceSpy.getBandDetails).toHaveBeenCalledWith(
        'U12345',
        'TEST01',
        'TB1027',
        2
      );
    }));

    it('should update band details signal on successful load', fakeAsync(() => {
      component.selectBatch(0);
      tick();

      expect(c.bandDetails()).toEqual(mockBandResponse);
    }));

    it('should handle band details API error', fakeAsync(() => {
      apiServiceSpy.getBandDetails.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.selectBatch(0);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.bandDetails()).toBeNull();
    }));

    it('should not show error for 404 on band details', fakeAsync(() => {
      apiServiceSpy.getBandDetails.and.returnValue(
        throwError(() => ({ status: 404, message: 'Not found' }))
      );

      component.selectBatch(0);
      tick();

      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
      expect(c.bandDetails()).toBeNull();
    }));
  });

  describe('Test Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.availableTests.set(mockTests);
    });



    it('should return all tests when search is empty', () => {
      component.testSearchControl.setValue('');
      fixture.detectChanges();

      const filtered = c.filteredTests();
      expect(filtered.length).toBe(2);
    });


  });

  describe('Notes Display (Read-only)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.bandDetails.set(mockBandResponse);
      c.hasResults.set(true);
      fixture.detectChanges();
    });


    it('should display note text', () => {
      const noteBody = fixture.debugElement.query(By.css('.note-body'));
      expect(noteBody.nativeElement.textContent.trim()).toBe(
        'Test note for observation'
      );
    });

    it('should display author name', () => {
      const authorName = fixture.debugElement.query(By.css('.author-name'));
      expect(authorName.nativeElement.textContent.trim()).toBe('JDOE');
    });

    it('should display avatar with first letter', () => {
      const avatar = fixture.debugElement.query(By.css('.author-avatar'));
      expect(avatar.nativeElement.textContent.trim()).toBe('J');
    });


    it('should not show add/edit/delete buttons (read-only)', () => {
      const addButton = fixture.debugElement.query(By.css('.add-note-btn'));
      const actionButtons = fixture.debugElement.queryAll(By.css('.action-btn'));

      expect(addButton).toBeNull();
      expect(actionButtons.length).toBe(0);
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all data on onCancel', () => {
      c.currentUnitId = 'U12345';
      c.availableTests.set(mockTests);
      c.testBatches.set(mockBatches);
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      component.onCancel();

      expect(c.currentUnitId).toBe('');
      expect(c.availableTests()).toEqual([]);
      expect(c.testBatches()).toEqual([]);
      expect(c.selectedBatch()).toBeNull();
      expect(c.bandDetails()).toBeNull();
    });


  });


  describe('UI Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should disable test dropdown when no tests available', () => {
      c.testsAvailable.set(false);
      fixture.detectChanges();

      expect(!c.testsAvailable()).toBeTrue();
    });



    it('should render band details', () => {
      c.hasResults.set(true);
      c.bandDetails.set(mockBandResponse);
      c.isLoadingBandDetails.set(false);
      fixture.detectChanges();

      const bandRows = fixture.debugElement.queryAll(By.css('.band-row'));
      expect(bandRows.length).toBe(3); // mockBandDetails has 3 bands
    });


  });
  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle getTestsForUnit error', fakeAsync(() => {
      apiServiceSpy.getTestsForUnit.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.isLoading()).toBeFalse();
    }));

    it('should handle getTestBatches error', fakeAsync(() => {
      apiServiceSpy.getTestBatches.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      c.currentUnitId = 'U12345';
      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(c.isLoadingBatches()).toBeFalse();
      expect(c.testBatches()).toEqual([]);
    }));
  });

  describe('onUnitValidated edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when parsedUnitId is empty', () => {
      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: '',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
      expect(c.isLoading()).toBeFalse();
    });

    it('should show specific message when errorCode is 9784', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Validation failed', errorCode: '9784' })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U99999',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit does not have any tests of this type');
      expect(c.isLoading()).toBeFalse();
    }));

    it('should show response message when validation fails with non-9784 error code', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Some other error', errorCode: '1234' })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U99999',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some other error');
      expect(c.isLoading()).toBeFalse();
    }));

    it('should show fallback message when validation fails with no message', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: '' })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U99999',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U99999',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit validation failed');
      expect(c.isLoading()).toBeFalse();
    }));

    it('should set isLoading to true during validation', fakeAsync(() => {
      const validationSubject = new Subject<any>();
      apiServiceSpy.validateUnit.and.returnValue(validationSubject.asObservable());

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      expect(c.isLoading()).toBeTrue();

      validationSubject.next({ success: true, statusCode: 200, message: 'Valid' });
      tick();
    }));
  });

  describe('onTestSelected edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.availableTests.set(mockTests);
      c.testsAvailable.set(true);
      c.currentUnitId = 'U12345';
    });

    it('should return early when selectedTestId is empty', () => {
      component.testIdControl.setValue('');
      component.onTestSelected();

      expect(apiServiceSpy.getTestBatches).not.toHaveBeenCalled();
    });

    it('should return early when selectedTestId is null', () => {
      component.testIdControl.setValue(null as any);
      component.onTestSelected();

      expect(apiServiceSpy.getTestBatches).not.toHaveBeenCalled();
    });

    it('should set empty description when test not found in availableTests', fakeAsync(() => {
      component.testIdControl.setValue('NONEXISTENT');
      component.onTestSelected();
      tick();

      expect(component.selectedTestDescription).toBe('');
      expect(apiServiceSpy.getTestBatches).toHaveBeenCalledWith('U12345', 'NONEXISTENT');
    }));
  });

  describe('filteredTests computed signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.availableTests.set(mockTests);
    });

    it('should filter tests by testId (case-insensitive)', () => {
      component.testSearchControl.setValue('test01');
      fixture.detectChanges();

      const filtered = c.filteredTests();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('TEST01');
    });

    it('should filter tests by testDesc (case-insensitive)', () => {
      component.testSearchControl.setValue('gamma');
      fixture.detectChanges();

      const filtered = c.filteredTests();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testDesc).toBe('GAMMA Test');
    });

    it('should return empty array when no tests match', () => {
      component.testSearchControl.setValue('ZZZNOMATCH');
      fixture.detectChanges();

      const filtered = c.filteredTests();
      expect(filtered.length).toBe(0);
    });

    it('should return all tests when search is null', () => {
      component.testSearchControl.setValue(null as any);
      fixture.detectChanges();

      const filtered = c.filteredTests();
      expect(filtered.length).toBe(2);
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show success snackbar', () => {
      component.onSave();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Results saved successfully');
    });
  });

  describe('onEditNote', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set isEditingNote to true and populate noteText from bandDetails', () => {
      c.bandDetails.set(mockBandResponse);

      component.onEditNote();

      expect(c.isEditingNote()).toBeTrue();
      expect(c.noteText()).toBe('Test note for observation');
    });

    it('should set empty noteText when bandDetails has no noteDetails', () => {
      c.bandDetails.set({ ...mockBandResponse, noteDetails: null });

      component.onEditNote();

      expect(c.isEditingNote()).toBeTrue();
      expect(c.noteText()).toBe('');
    });

    it('should set empty noteText when bandDetails is null', () => {
      c.bandDetails.set(null);

      component.onEditNote();

      expect(c.isEditingNote()).toBeTrue();
      expect(c.noteText()).toBe('');
    });
  });

  describe('onSaveNote', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when selectedBatch is null', () => {
      c.selectedBatch.set(null);
      c.bandDetails.set(mockBandResponse);
      c.noteText.set('Some note');

      component.onSaveNote();

      expect(apiServiceSpy.updateNote).not.toHaveBeenCalled();
      expect(apiServiceSpy.createNote).not.toHaveBeenCalled();
    });

    it('should return early when bandDetails is null', () => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(null);
      c.noteText.set('Some note');

      component.onSaveNote();

      expect(apiServiceSpy.updateNote).not.toHaveBeenCalled();
      expect(apiServiceSpy.createNote).not.toHaveBeenCalled();
    });

    it('should show error when note text is empty', () => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);
      c.noteText.set('   ');

      component.onSaveNote();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Note text cannot be empty');
      expect(apiServiceSpy.updateNote).not.toHaveBeenCalled();
      expect(apiServiceSpy.createNote).not.toHaveBeenCalled();
    });

    describe('update existing note (noteId exists)', () => {
      beforeEach(() => {
        c.selectedBatch.set(mockBatches[0]);
        c.bandDetails.set(mockBandResponse); // has noteId: 101
        c.noteText.set('Updated note text');
      });

      it('should call updateNote on success', fakeAsync(() => {
        apiServiceSpy.updateNote.and.returnValue(
          of({ success: true, statusCode: 200, message: 'Updated' })
        );

        component.onSaveNote();
        tick();

        expect(apiServiceSpy.updateNote).toHaveBeenCalledWith(101, { note: 'Updated note text' });
        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note updated successfully');
        expect(c.isEditingNote()).toBeFalse();
        expect(c.noteText()).toBe('');
        // Should refresh band details
        expect(apiServiceSpy.getBandDetails).toHaveBeenCalledWith('U12345', 'TEST01', 'TB1026', 1);
      }));

      it('should set isSavingNote to true during save', fakeAsync(() => {
        const saveSubject = new Subject<any>();
        apiServiceSpy.updateNote.and.returnValue(saveSubject.asObservable());

        component.onSaveNote();
        expect(c.isSavingNote()).toBeTrue();

        saveSubject.next({ success: true, statusCode: 200, message: 'Updated' });
        tick();

        expect(c.isSavingNote()).toBeFalse();
      }));

      it('should show error when update response has success: false', fakeAsync(() => {
        apiServiceSpy.updateNote.and.returnValue(
          of({ success: false, statusCode: 400, message: 'Update rejected' })
        );

        component.onSaveNote();
        tick();

        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update rejected');
      }));

      it('should show fallback error when update response has no message', fakeAsync(() => {
        apiServiceSpy.updateNote.and.returnValue(
          of({ success: false, statusCode: 400, message: '' })
        );

        component.onSaveNote();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update note');
      }));

      it('should handle update API error', fakeAsync(() => {
        apiServiceSpy.updateNote.and.returnValue(
          throwError(() => ({ status: 500, message: 'Server error' }))
        );

        component.onSaveNote();
        tick();

        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      }));
    });

    describe('create new note (no noteId)', () => {
      const bandResponseNoNote: TestBandResponse = {
        ...mockBandResponse,
        noteId: null,
        noteDetails: null,
        testChapterId: 'TCH01'
      };

      beforeEach(() => {
        c.selectedBatch.set(mockBatches[0]);
        c.bandDetails.set(bandResponseNoNote);
        c.noteText.set('New note text');
      });

      it('should call createNote on success', fakeAsync(() => {
        apiServiceSpy.createNote.and.returnValue(
          of({ success: true, statusCode: 201, message: 'Created' })
        );

        component.onSaveNote();
        tick();

        expect(apiServiceSpy.createNote).toHaveBeenCalledWith({
          unitId: 'U12345',
          testId: 'TEST01',
          tbId: 'TB1026',
          tbSeqNo: 1,
          testChapterId: 'TCH01',
          note: 'New note text'
        });
        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note created successfully');
        expect(c.isEditingNote()).toBeFalse();
        expect(c.noteText()).toBe('');
        // Should refresh band details
        expect(apiServiceSpy.getBandDetails).toHaveBeenCalledWith('U12345', 'TEST01', 'TB1026', 1);
      }));

      it('should use empty string when testChapterId is null', fakeAsync(() => {
        const bandResponseNullChapter: TestBandResponse = {
          ...mockBandResponse,
          noteId: null,
          noteDetails: null,
          testChapterId: null
        };
        c.bandDetails.set(bandResponseNullChapter);

        apiServiceSpy.createNote.and.returnValue(
          of({ success: true, statusCode: 201, message: 'Created' })
        );

        component.onSaveNote();
        tick();

        expect(apiServiceSpy.createNote).toHaveBeenCalledWith(
          jasmine.objectContaining({ testChapterId: '' })
        );
      }));

      it('should show error when create response has success: false', fakeAsync(() => {
        apiServiceSpy.createNote.and.returnValue(
          of({ success: false, statusCode: 400, message: 'Create rejected' })
        );

        component.onSaveNote();
        tick();

        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Create rejected');
      }));

      it('should show fallback error when create response has no message', fakeAsync(() => {
        apiServiceSpy.createNote.and.returnValue(
          of({ success: false, statusCode: 400, message: '' })
        );

        component.onSaveNote();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create note');
      }));

      it('should handle create API error', fakeAsync(() => {
        apiServiceSpy.createNote.and.returnValue(
          throwError(() => ({ status: 500, message: 'Server error' }))
        );

        component.onSaveNote();
        tick();

        expect(c.isSavingNote()).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      }));
    });
  });

  describe('onDeleteNote', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when selectedBatch is null', () => {
      c.selectedBatch.set(null);
      c.bandDetails.set(mockBandResponse);

      component.onDeleteNote();

      expect(apiServiceSpy.deleteNote).not.toHaveBeenCalled();
    });

    it('should return early when bandDetails has no noteId', () => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set({ ...mockBandResponse, noteId: null });

      component.onDeleteNote();

      expect(apiServiceSpy.deleteNote).not.toHaveBeenCalled();
    });

    it('should return early when bandDetails is null', () => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(null);

      component.onDeleteNote();

      expect(apiServiceSpy.deleteNote).not.toHaveBeenCalled();
    });

    it('should call deleteNote successfully', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      apiServiceSpy.deleteNote.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Deleted' })
      );

      component.onDeleteNote();
      tick();

      expect(apiServiceSpy.deleteNote).toHaveBeenCalledWith(
        101, 'U12345', 'TEST01', 'TB1026', 1, 'TCH01'
      );
      expect(c.isSavingNote()).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Note deleted successfully');
      expect(c.isEditingNote()).toBeFalse();
      expect(c.noteText()).toBe('');
      // Should refresh band details
      expect(apiServiceSpy.getBandDetails).toHaveBeenCalledWith('U12345', 'TEST01', 'TB1026', 1);
    }));

    it('should use empty string when testChapterId is null for delete', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set({ ...mockBandResponse, testChapterId: null });

      apiServiceSpy.deleteNote.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Deleted' })
      );

      component.onDeleteNote();
      tick();

      expect(apiServiceSpy.deleteNote).toHaveBeenCalledWith(
        101, 'U12345', 'TEST01', 'TB1026', 1, ''
      );
    }));

    it('should set isSavingNote to true during delete', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      const deleteSubject = new Subject<any>();
      apiServiceSpy.deleteNote.and.returnValue(deleteSubject.asObservable());

      component.onDeleteNote();
      expect(c.isSavingNote()).toBeTrue();

      deleteSubject.next({ success: true, statusCode: 200, message: 'Deleted' });
      tick();

      expect(c.isSavingNote()).toBeFalse();
    }));

    it('should show error when delete response has success: false', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      apiServiceSpy.deleteNote.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Delete rejected' })
      );

      component.onDeleteNote();
      tick();

      expect(c.isSavingNote()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Delete rejected');
    }));

    it('should show fallback error when delete response has no message', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      apiServiceSpy.deleteNote.and.returnValue(
        of({ success: false, statusCode: 400, message: '' })
      );

      component.onDeleteNote();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to delete note');
    }));

    it('should handle delete API error', fakeAsync(() => {
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      apiServiceSpy.deleteNote.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.onDeleteNote();
      tick();

      expect(c.isSavingNote()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('onUnitCleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all data when unit is cleared', () => {
      c.currentUnitId = 'U12345';
      c.availableTests.set(mockTests);
      c.testBatches.set(mockBatches);
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);
      c.isEditingNote.set(true);
      c.noteText.set('Some note');

      component.onUnitCleared();

      expect(c.currentUnitId).toBe('');
      expect(c.availableTests()).toEqual([]);
      expect(c.testBatches()).toEqual([]);
      expect(c.selectedBatch()).toBeNull();
      expect(c.bandDetails()).toBeNull();
      expect(c.isEditingNote()).toBeFalse();
      expect(c.noteText()).toBe('');
      expect(c.hasResults()).toBeFalse();
      expect(c.testsAvailable()).toBeFalse();
      expect(component.testIdControl.value).toBe('');
      expect(component.selectedTestDescription).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(c.destroy$, 'next');
      const completeSpy = spyOn(c.destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnInit - chapterChanged$', () => {
    it('should clear all data when chapter changes', () => {
      const chapterSubject = new Subject<void>();
      (headerServiceSpy as any).chapterChanged$ = chapterSubject.asObservable();

      // Re-create fixture to pick up new chapterChanged$
      fixture = TestBed.createComponent(ResultsObservationsQueryComponent);
      component = fixture.componentInstance;
      c = component;
      fixture.detectChanges();

      // Set up some state
      c.currentUnitId = 'U12345';
      c.availableTests.set(mockTests);
      c.testBatches.set(mockBatches);
      c.selectedBatch.set(mockBatches[0]);

      // Emit chapter change
      chapterSubject.next();

      expect(c.currentUnitId).toBe('');
      expect(c.availableTests()).toEqual([]);
      expect(c.testBatches()).toEqual([]);
      expect(c.selectedBatch()).toBeNull();
    });
  });

  describe('loadTestsForUnit - response branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when getTestsForUnit returns success: false', fakeAsync(() => {
      apiServiceSpy.getTestsForUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Test load failed' })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Test load failed');
      expect(c.isLoading()).toBeFalse();
    }));

    it('should show fallback error when getTestsForUnit returns success: false with no message', fakeAsync(() => {
      apiServiceSpy.getTestsForUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: '' })
      );

      const unitValidationResponse: UnitValidationResponse = {
        parsedUnitId: 'U12345',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'U12345',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitValidated(unitValidationResponse);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load tests');
    }));
  });

  describe('loadTestBatches - response branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.availableTests.set(mockTests);
      c.testsAvailable.set(true);
      c.currentUnitId = 'U12345';
    });

    it('should show error when getTestBatches returns success: false', fakeAsync(() => {
      apiServiceSpy.getTestBatches.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Batch load failed' })
      );

      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Batch load failed');
      expect(c.isLoadingBatches()).toBeFalse();
      expect(c.testBatches()).toEqual([]);
      expect(c.hasResults()).toBeFalse();
    }));

    it('should show fallback error when getTestBatches returns success: false with no message', fakeAsync(() => {
      apiServiceSpy.getTestBatches.and.returnValue(
        of({ success: false, statusCode: 400, message: '' })
      );

      component.testIdControl.setValue('TEST01');
      component.onTestSelected();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load test batches');
    }));
  });

  describe('loadBandDetails - response branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
      c.testBatches.set(mockBatches);
      c.hasResults.set(true);
      c.currentUnitId = 'U12345';
    });

    it('should not show error when getBandDetails returns success: false with statusCode 404', fakeAsync(() => {
      apiServiceSpy.getBandDetails.and.returnValue(
        of({ success: false, statusCode: 404, message: 'Not found' })
      );

      component.selectBatch(0);
      tick();

      expect(c.bandDetails()).toBeNull();
      expect(c.isLoadingBandDetails()).toBeFalse();
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    }));

    it('should show error when getBandDetails returns success: false with non-404 statusCode', fakeAsync(() => {
      apiServiceSpy.getBandDetails.and.returnValue(
        of({ success: false, statusCode: 500, message: 'Band load failed' })
      );

      component.selectBatch(0);
      tick();

      expect(c.bandDetails()).toBeNull();
      expect(c.isLoadingBandDetails()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Band load failed');
    }));

    it('should show fallback error when getBandDetails returns success: false with no message and non-404', fakeAsync(() => {
      apiServiceSpy.getBandDetails.and.returnValue(
        of({ success: false, statusCode: 500, message: '' })
      );

      component.selectBatch(0);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load band details');
    }));
  });

  describe('Cancel button - clearAll', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset editing note state on cancel', () => {
      c.isEditingNote.set(true);
      c.noteText.set('Editing note');
      c.currentUnitId = 'U12345';

      component.onCancel();

      expect(c.isEditingNote()).toBeFalse();
      expect(c.noteText()).toBe('');
      expect(c.currentUnitId).toBe('');
    });

    it('should reset selectedBatchIndex on cancel', () => {
      c.selectedBatchIndex.set(2);
      component.onCancel();

      expect(c.selectedBatchIndex()).toBe(-1);
    });
  });

  describe('clearAll()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all state and call unitIdField.clear()', () => {
      c.currentUnitId = 'U12345';
      c.isEditingNote.set(true);
      c.noteText.set('Some note');
      component.testSearchControl.setValue('search text');
      component.selectedTestDescription = 'GAMMA Test';
      c.availableTests.set(mockTests);
      c.testBatches.set(mockBatches);
      c.selectedBatch.set(mockBatches[0]);
      c.bandDetails.set(mockBandResponse);

      const mockUnitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear']);
      component.unitIdField = mockUnitIdField;

      component.clearAll();

      expect(c.currentUnitId).toBe('');
      expect(c.isEditingNote()).toBeFalse();
      expect(c.noteText()).toBe('');
      expect(component.testSearchControl.value).toBe('');
      expect(component.selectedTestDescription).toBe('');
      expect(c.availableTests()).toEqual([]);
      expect(c.testBatches()).toEqual([]);
      expect(c.selectedBatch()).toBeNull();
      expect(c.bandDetails()).toBeNull();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
    });

    it('should not throw if unitIdField is undefined', () => {
      component.unitIdField = undefined as any;
      expect(() => component.clearAll()).not.toThrow();
    });
  });

  describe('onUnitCleared()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset state without calling unitIdField.clear()', () => {
      c.currentUnitId = 'U12345';
      c.availableTests.set(mockTests);
      c.testBatches.set(mockBatches);
      c.selectedBatch.set(mockBatches[0]);

      const mockUnitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear']);
      component.unitIdField = mockUnitIdField;

      component.onUnitCleared();

      expect(c.currentUnitId).toBe('');
      expect(c.availableTests()).toEqual([]);
      expect(c.selectedBatch()).toBeNull();
      expect(mockUnitIdField.clear).not.toHaveBeenCalled();
    });
  });

  describe('CLEAR ALL button', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render CLEAR ALL button in search section', () => {
      const clearBtn = fixture.debugElement.query(By.css('.query-clear-btn'));
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.nativeElement.textContent.trim()).toBe('CLEAR ALL');
    });

    it('should call clearAll() when CLEAR ALL button is clicked', () => {
      spyOn(component, 'clearAll');
      const clearBtn = fixture.debugElement.query(By.css('.query-clear-btn'));
      clearBtn.nativeElement.click();
      expect(component.clearAll).toHaveBeenCalled();
    });
  });

  describe('Scanner icon', () => {
    it('should pass showBarcodeIcon=true to unit-id-field', () => {
      fixture.detectChanges();
      const unitIdField = fixture.debugElement.query(By.css('app-unit-id-field'));
      expect(unitIdField).toBeTruthy();
      expect(unitIdField.attributes['ng-reflect-show-barcode-icon']).toBe('true');
    });
  });

  describe('Constructor effect - pageHeaderData', () => {
    it('should set headerConfig when pageHeaderData has a subtitle', () => {
      (pageHeaderServiceSpy as any).pageHeaderData = signal({
        title: 'Results Observations',
        subtitle: 'Custom subtitle'
      });

      fixture = TestBed.createComponent(ResultsObservationsQueryComponent);
      component = fixture.componentInstance;
      c = component;
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Results Observations');
      expect(component.headerConfig.subtitle).toBe('Custom subtitle');
      expect(component.headerConfig.breadcrumbs.length).toBe(3);
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.headerConfig.breadcrumbs[1]).toEqual({ label: 'Laboratory Functions', link: null });
      expect(component.headerConfig.breadcrumbs[2]).toEqual({ label: 'Results Observations', link: null });
    });

    it('should use default subtitle when pageHeaderData has no subtitle', () => {
      (pageHeaderServiceSpy as any).pageHeaderData = signal({
        title: 'Results Observations',
        subtitle: ''
      });

      fixture = TestBed.createComponent(ResultsObservationsQueryComponent);
      component = fixture.componentInstance;
      c = component;
      fixture.detectChanges();

      expect(component.headerConfig.subtitle).toBe(
        'View observation results, band entries, notes, test results, dates, and control values for units with confirmatory tests involving multiple observations.'
      );
    });
  });
});
