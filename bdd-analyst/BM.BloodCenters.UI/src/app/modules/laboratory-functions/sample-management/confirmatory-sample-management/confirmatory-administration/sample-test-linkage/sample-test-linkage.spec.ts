import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { SampleTestLinkageComponent } from './sample-test-linkage';
import { SampleTestLinkageService } from './sample-test-linkage.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { SampleType, TestIdOption, TestLinkageRow } from './sample-test-linkage.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SampleTestLinkageComponent', () => {
  let component: SampleTestLinkageComponent;
  let c: any;
  let fixture: ComponentFixture<SampleTestLinkageComponent>;
  let stlServiceSpy: jasmine.SpyObj<SampleTestLinkageService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockSampleTypes: SampleType[] = [
    { code: 'BLD', name: 'Blood' },
    { code: 'PLT', name: 'Platelet' },
  ];

  const mockValidTests: TestIdOption[] = [
    { value: 'ABO', label: 'ABO Group' },
    { value: 'RH',  label: 'Rh Type'  },
  ];

  const mockRows: TestLinkageRow[] = [
    { _rowId: '1', testId: 'ABO', effectiveDate: moment('2025-01-01'), terminationDate: null },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    stlServiceSpy = jasmine.createSpyObj('SampleTestLinkageService', [
      'getValidTests',
      'getSampleTypes',
      'getTestLinkages',
      'saveTestLinkages',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    stlServiceSpy.getValidTests.and.returnValue(of(mockValidTests));
    stlServiceSpy.getSampleTypes.and.returnValue(of(mockSampleTypes));
    stlServiceSpy.getTestLinkages.and.returnValue(of(mockRows));
    stlServiceSpy.saveTestLinkages.and.returnValue(of(undefined as any));



      TestBed.configureTestingModule({
imports: [SampleTestLinkageComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SampleTestLinkageService, useValue: stlServiceSpy },
        { provide: SnackbarService,          useValue: snackbarServiceSpy },
        { provide: HeaderService,            useValue: headerServiceSpy },
      ],
    });


    });



  beforeEach(() => {

      stlServiceSpy.getValidTests.and.returnValue(of(mockValidTests));


      stlServiceSpy.getSampleTypes.and.returnValue(of(mockSampleTypes));


      stlServiceSpy.getTestLinkages.and.returnValue(of(mockRows));


      stlServiceSpy.saveTestLinkages.and.returnValue(of(undefined as any));


    fixture = TestBed.createComponent(SampleTestLinkageComponent);
    component = fixture.componentInstance;
    c = component;


    });

  // ── Initialization ────────────────────────────────────────────────────────

  describe('Initialization', () => {

    it('should start in landing mode', () => {
      fixture.detectChanges();
      expect(component.isLanding).toBeTrue();
    });

    it('should load valid tests on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(stlServiceSpy.getValidTests).toHaveBeenCalledTimes(1);
      expect(component.validTests.length).toBe(2);
      expect(component.filteredValidTests.length).toBe(2);
    }));

    it('should load sample types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(stlServiceSpy.getSampleTypes).toHaveBeenCalledTimes(1);
      expect(component.allSampleTypes.length).toBe(2);
      expect(component.filteredSampleTypes.length).toBe(2);
    }));


  });

  // ── Test ID dropdown search ───────────────────────────────────────────────

  describe('filteredValidTests (testIdSearchCtrl)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show all tests when search is empty', () => {
      expect(component.filteredValidTests.length).toBe(2);
    });




    it('resetTestIdSearch should clear search and restore all tests', () => {
      component.testIdSearchCtrl.setValue('abo');
      expect(component.filteredValidTests.length).toBe(1);
      component.resetTestIdSearch();
      expect(component.testIdSearchCtrl.value).toBe('');
      expect(component.filteredValidTests.length).toBe(2);
    });
  });

  // ── Landing page ──────────────────────────────────────────────────────────

  describe('Landing page', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('onLandingSelect should navigate to details page', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      expect(component.isLanding).toBeFalse();
    }));

    it('onLandingSelect should set selectedSampleType', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      expect(component.selectedSampleType?.code).toBe('BLD');
    }));

    it('onLandingSelect should call getTestLinkages with the sample type code', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      expect(stlServiceSpy.getTestLinkages).toHaveBeenCalledWith('BLD');
    }));

    it('onLandingSelect should reset isDirty', fakeAsync(() => {
      component.isDirty = true;
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      expect(component.isDirty).toBeFalse();
    }));

  });

  // ── Details page — left panel (sample type search) ────────────────────────

  describe('onSearch (sample type search)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should return all types when search is empty', () => {
      component.searchText = '';
      component.onSearch();
      expect(component.filteredSampleTypes.length).toBe(2);
    });


  });

  // ── Details page — selectSampleType ──────────────────────────────────────

  describe('selectSampleType', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedSampleType', fakeAsync(() => {
      component.selectSampleType(mockSampleTypes[0]);
      tick();
      expect(component.selectedSampleType?.code).toBe('BLD');
    }));

    it('should call getTestLinkages with the correct code', fakeAsync(() => {
      component.selectSampleType(mockSampleTypes[0]);
      tick();
      expect(stlServiceSpy.getTestLinkages).toHaveBeenCalledWith('BLD');
    }));


    it('should reset isDirty when switching to a new type', fakeAsync(() => {
      component.selectSampleType(mockSampleTypes[0]);
      tick();
      component.isDirty = true;
      component.selectSampleType(mockSampleTypes[1]);
      tick();
      expect(component.isDirty).toBeFalse();
    }));



  });

  // ── Row operations ────────────────────────────────────────────────────────

  describe('addNewResult', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));


    it('new row should have empty testId', () => {
      component.addNewResult();
      expect(component.rows[component.rows.length - 1].testId).toBe('');
    });

    it('new row should have null dates', () => {
      component.addNewResult();
      const newRow = component.rows[component.rows.length - 1];
      expect(newRow.effectiveDate).toBeNull();
      expect(newRow.terminationDate).toBeNull();
    });

    it('should mark isDirty', () => {
      component.addNewResult();
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('deleteRow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));


    it('should mark isDirty', () => {
      component.deleteRow(component.rows[0]);
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('clearAll', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));


    it('should mark isDirty', () => {
      component.clearAll();
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('onRowChange', () => {
    it('should mark isDirty as true', () => {
      component.isDirty = false;
      component.onRowChange();
      expect(component.isDirty).toBeTrue();
    });
  });

  // ── canSave ───────────────────────────────────────────────────────────────

  describe('canSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('should return false when not dirty', () => {
      component.isDirty = false;
      expect(component.canSave).toBeFalse();
    });

    it('should return false when isSaving is true', () => {
      component.isDirty = true;
      component.isSaving = true;
      expect(component.canSave).toBeFalse();
    });

    it('should return false when a row has no testId', () => {
      component.addNewResult();
      expect(component.canSave).toBeFalse();
    });

    it('should return false when rows array is empty and not dirty', () => {
      component.clearAll();
      component.isDirty = false;
      expect(component.canSave).toBeFalse();
    });
  });

  // ── Save ──────────────────────────────────────────────────────────────────

  describe('save', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));



    it('should reset isDirty after successful save', fakeAsync(() => {
      spyOnProperty(component, 'canSave', 'get').and.returnValue(true);
      component.isDirty = true;
      component.save();
      tick();
      expect(component.isDirty).toBeFalse();
    }));

    it('should reset isSaving to false after successful save', fakeAsync(() => {
      spyOnProperty(component, 'canSave', 'get').and.returnValue(true);
      component.save();
      tick();
      expect(component.isSaving).toBeFalse();
    }));


    it('should reset isSaving to false on save failure', fakeAsync(() => {
      stlServiceSpy.saveTestLinkages.and.returnValue(throwError(() => new Error('fail')));
      spyOnProperty(component, 'canSave', 'get').and.returnValue(true);
      component.save();
      tick();
      expect(component.isSaving).toBeFalse();
    }));
  });

  // ── Cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('should reset to landing mode', () => {
      component.cancel();
      expect(component.isLanding).toBeTrue();
    });



    it('should reset isDirty to false', () => {
      component.isDirty = true;
      component.cancel();
      expect(component.isDirty).toBeFalse();
    });

  });

  // ── Chapter change ────────────────────────────────────────────────────────

  describe('Chapter change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('should reset to landing and reload sample types on chapter change', fakeAsync(() => {
      component.searchText = 'test';
      component.isDirty = true;

      stlServiceSpy.getSampleTypes.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(component.isLanding).toBeTrue();
      expect(component.selectedSampleType).toBeNull();
      expect(component.rows).toEqual([]);
      expect(component.isDirty).toBeFalse();
      expect(stlServiceSpy.getSampleTypes).toHaveBeenCalledTimes(1);
    }));

  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should show error when loadValidTests fails', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      stlServiceSpy.getValidTests.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to load valid tests.');
    }));

    it('should show error when loadSampleTypes fails', fakeAsync(() => {
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      stlServiceSpy.getSampleTypes.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to load sample types.');
      expect(component.isLoadingTypes).toBeFalse();
    }));

    it('should show error when loadRows fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      stlServiceSpy.getTestLinkages.and.returnValue(throwError(() => new Error('fail')));
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to load test linkages.');
      expect(component.isLoadingRows).toBeFalse();
    }));

    it('should show error on save failure', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      const snackSpy = spyOn((component as any).snackbarService, 'showError');
      stlServiceSpy.saveTestLinkages.and.returnValue(throwError(() => new Error('fail')));
      spyOnProperty(component, 'canSave', 'get').and.returnValue(true);
      component.save();
      tick();
      expect(snackSpy).toHaveBeenCalledWith('Failed to save test linkages. Please try again.');
      expect(component.isSaving).toBeFalse();
    }));
  });

  // ── Form accessors ───────────────────────────────────────────────────────

  describe('Form accessors', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('getEffDateControl should return FormControl for existing row', () => {
      const rowId = component.rows[0]._rowId;
      const ctrl = component.getEffDateControl(rowId);
      expect(ctrl).toBeTruthy();
    });

    it('getEffDateControl should return dummy control for unknown row', () => {
      const ctrl = component.getEffDateControl('nonexistent');
      expect(ctrl).toBeTruthy();
    });

    it('getTermDateControl should return FormControl for existing row', () => {
      const rowId = component.rows[0]._rowId;
      const ctrl = component.getTermDateControl(rowId);
      expect(ctrl).toBeTruthy();
    });

    it('getTermDateControl should return dummy control for unknown row', () => {
      const ctrl = component.getTermDateControl('nonexistent');
      expect(ctrl).toBeTruthy();
    });

    it('getEffDateMatcher should return matcher for existing row', () => {
      const rowId = component.rows[0]._rowId;
      const matcher = component.getEffDateMatcher(rowId);
      expect(matcher).toBeTruthy();
      expect(typeof matcher.isErrorState).toBe('function');
    });

    it('getEffDateMatcher should return default matcher for unknown row', () => {
      const matcher = component.getEffDateMatcher('nonexistent');
      expect(matcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('getTermDateMatcher should return default matcher for unknown row', () => {
      const matcher = component.getTermDateMatcher('nonexistent');
      expect(matcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('getEffDateError should return empty for existing row', () => {
      const rowId = component.rows[0]._rowId;
      expect(component.getEffDateError(rowId)).toBe('');
    });

    it('getEffDateError should return empty for unknown row', () => {
      expect(component.getEffDateError('nonexistent')).toBe('');
    });

    it('getTermDateError should return empty for existing row', () => {
      const rowId = component.rows[0]._rowId;
      expect(component.getTermDateError(rowId)).toBe('');
    });

    it('getTermDateError should return empty for unknown row', () => {
      expect(component.getTermDateError('nonexistent')).toBe('');
    });
  });

  // ── Date input handlers ──────────────────────────────────────────────────

  describe('Date input handlers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('onEffDateInput should not throw for unknown row', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      expect(() => component.onEffDateInput(event, 'nonexistent')).not.toThrow();
    });

    it('onTermDateInput should not throw for unknown row', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      expect(() => component.onTermDateInput(event, 'nonexistent')).not.toThrow();
    });

    it('onEffDateInput should update lastChangedField to effective', () => {
      const rowId = component.rows[0]._rowId;
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onEffDateInput(event, rowId);
      expect((component as any).lastChangedField.get(rowId)).toBe('effective');
    });

    it('onTermDateInput should update lastChangedField to termination', () => {
      const rowId = component.rows[0]._rowId;
      const event = { target: { value: '01-DEC-2025' } } as any;
      component.onTermDateInput(event, rowId);
      expect((component as any).lastChangedField.get(rowId)).toBe('termination');
    });
  });

  // ── Test ID change handler (Gap Fix #2) ──────────────────────────────────

  describe('onTestIdChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
    }));

    it('should auto-set effective date when test ID is selected and effective date is null', () => {
      component.addNewResult();
      const newRow = component.rows[component.rows.length - 1];
      const form = (component as any).rowForms.get(newRow._rowId);

      // Initially effective date should be null
      expect(form.get('effectiveDate')?.value).toBeNull();

      // Select a test ID
      newRow.testId = 'ABO';
      component.onTestIdChange(newRow);

      // Effective date should now be set to chapter local date
      expect(form.get('effectiveDate')?.value).toBeTruthy();
    });

    it('should NOT overwrite existing effective date when test ID changes', () => {
      const existingRow = component.rows[0];
      const form = (component as any).rowForms.get(existingRow._rowId);
      const originalDate = form.get('effectiveDate')?.value;

      // Change test ID on existing row
      existingRow.testId = 'RH';
      component.onTestIdChange(existingRow);

      // Effective date should remain unchanged
      expect(form.get('effectiveDate')?.value).toBe(originalDate);
    });

    it('should NOT set effective date when test ID is empty', () => {
      component.addNewResult();
      const newRow = component.rows[component.rows.length - 1];
      const form = (component as any).rowForms.get(newRow._rowId);

      // Select empty test ID
      newRow.testId = '';
      component.onTestIdChange(newRow);

      // Effective date should still be null
      expect(form.get('effectiveDate')?.value).toBeNull();
    });

    it('should mark isDirty as true when test ID changes', () => {
      component.isDirty = false;
      const row = component.rows[0];
      row.testId = 'RH';
      component.onTestIdChange(row);
      expect(component.isDirty).toBeTrue();
    });

    it('should handle non-existent row gracefully', () => {
      const fakeRow: TestLinkageRow = {
        _rowId: 'nonexistent',
        testId: 'ABO',
        effectiveDate: null,
        terminationDate: null
      };

      expect(() => component.onTestIdChange(fakeRow)).not.toThrow();
      expect(component.isDirty).toBeTrue();
    });
  });

  // ── Additional coverage ──────────────────────────────────────────────────

  describe('Additional coverage', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('clearLandingFilter should set landingSelection to null', () => {
      component.landingSelection = mockSampleTypes[0];
      component.clearLandingFilter();
      expect(component.landingSelection).toBeNull();
    });

    it('selectSampleType should not reload if same type selected', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      stlServiceSpy.getTestLinkages.calls.reset();
      component.selectSampleType(mockSampleTypes[0]);
      tick();
      expect(stlServiceSpy.getTestLinkages).not.toHaveBeenCalled();
    }));

    it('onLandingSelect should not navigate when type is null', () => {
      component.onLandingSelect(null as any);
      expect(component.isLanding).toBeTrue();
    });

    it('onSearch should filter by code', () => {
      component.searchText = 'BLD';
      component.onSearch();
      expect(component.filteredSampleTypes.length).toBe(1);
      expect(component.filteredSampleTypes[0].code).toBe('BLD');
    });

    it('onSearch should filter by name', () => {
      component.searchText = 'Platelet';
      component.onSearch();
      expect(component.filteredSampleTypes.length).toBe(1);
      expect(component.filteredSampleTypes[0].name).toBe('Platelet');
    });

    it('testIdSearchCtrl should filter by value', fakeAsync(() => {
      component.testIdSearchCtrl.setValue('abo');
      tick();
      expect(component.filteredValidTests.length).toBe(1);
      expect(component.filteredValidTests[0].value).toBe('ABO');
    }));

    it('deleteRow should remove the row from the array', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      const initialLen = component.rows.length;
      component.deleteRow(component.rows[0]);
      expect(component.rows.length).toBe(initialLen - 1);
    }));

    it('clearAll should empty rows array', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      component.clearAll();
      expect(component.rows.length).toBe(0);
    }));

    it('save should show success message', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      const snackSpy = spyOn((component as any).snackbarService, 'showSuccess');
      spyOnProperty(component, 'canSave', 'get').and.returnValue(true);
      component.save();
      tick();
      expect(snackSpy).toHaveBeenCalled();
    }));

    it('canSave should return true when dirty with valid row', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      component.isDirty = true;
      component.isSaving = false;
      // rows[0] has testId 'ABO' and valid form
      expect(component.canSave).toBeTrue();
    }));

    it('canSave should return false when row form is invalid', fakeAsync(() => {
      component.onLandingSelect(mockSampleTypes[0]);
      tick();
      component.addNewResult();
      component.isDirty = true;
      // New row has empty testId
      expect(component.canSave).toBeFalse();
    }));
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
});
