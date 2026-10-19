import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange, SimpleChanges, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditPanelComponent } from './add-edit-panel';
import { RbcAgGroupsService } from '../services/rbc-ag-groups.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  AntigenGroupOption,
  AntigenGroupRow,
  ApiResult,
  SEQUENCE_OPTIONS,
  DISPLAY_ORDER_OPTIONS,
} from '../models/rbc-ag-groups.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditPanelComponent', () => {
  let component: AddEditPanelComponent;
  let fixture: ComponentFixture<AddEditPanelComponent>;
  let mockService: jasmine.SpyObj<RbcAgGroupsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const successResult: ApiResult<null> = {
    success: true, message: 'OK', error: null, errorCode: null,
    statusCode: 200, data: null, item: null, total: 1,
  };

  const selectedGroup: AntigenGroupOption = { name: 'RH', displayOrder: 1 };

  const groupRows: AntigenGroupRow[] = [
    { auditKey: 10, serologicalTest: 'D',  serologicalSeq: 1, molecularTest: 'RHD*01',  molecularSeq: 1, effectiveDate: '09-JUN-2023', terminationDate: '' },
    { auditKey: 11, serologicalTest: 'C',  serologicalSeq: 2, molecularTest: 'RHCE*Ce', molecularSeq: 2, effectiveDate: '09-JUN-2023', terminationDate: '' },
  ];

  const editRow: AntigenGroupRow = groupRows[0];

  /** Helper to set up add-mode form with valid values for submission */
  function fillAddFormValid(): void {
    const futureDate = moment().add(10, 'days');
    component.form.patchValue({
      antigenGroup: 'TEST',
      displayOrder: 1,
      effectiveDate: futureDate,
    });
    component.serologicalRows.at(0).patchValue({ test: 'D', seq: 1 });
    component.molecularRows.at(0).patchValue({ test: 'RHD*01', seq: 1 });
    component.form.updateValueAndValidity();
  }

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RbcAgGroupsService', [
      'create', 'update', 'batchUpdate',
      'lookupAntigenGroups', 'lookupSerTestIds', 'lookupMolTestIds',
      'checkGroupExists',
    ]);

    mockService.lookupAntigenGroups.and.returnValue(of(['RH', 'KELL', 'Duffy']));
    mockService.lookupSerTestIds.and.returnValue(of(['D', 'C', 'E']));
    mockService.lookupMolTestIds.and.returnValue(of(['RHD*01', 'RHCE*Ce']));
    mockService.create.and.returnValue(of(successResult));
    mockService.update.and.returnValue(of(successResult));
    mockService.batchUpdate.and.returnValue(of(successResult));
    mockService.checkGroupExists.and.returnValue(of(false));

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = { chapterTimeZone: signal('America/New_York') };

    TestBed.configureTestingModule({
      imports: [AddEditPanelComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter([]),
        { provide: RbcAgGroupsService, useValue: mockService  },
        { provide: MatSnackBar,        useValue: mockSnackBar },
        { provide: HeaderService,      useValue: mockHeaderService },
      ],
    })
    .overrideComponent(AddEditPanelComponent, {
      remove: { providers: [] },
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] },
    });

    mockService.create.calls.reset();
    mockService.update.calls.reset();
    mockService.batchUpdate.calls.reset();
    mockService.lookupAntigenGroups.calls.reset();
    mockService.lookupSerTestIds.calls.reset();
    mockService.lookupMolTestIds.calls.reset();
    mockService.checkGroupExists.calls.reset();

    mockService.lookupAntigenGroups.and.returnValue(of(['RH', 'KELL', 'Duffy']));
    mockService.lookupSerTestIds.and.returnValue(of(['D', 'C', 'E']));
    mockService.lookupMolTestIds.and.returnValue(of(['RHD*01', 'RHCE*Ce']));
    mockService.create.and.returnValue(of(successResult));
    mockService.update.and.returnValue(of(successResult));
    mockService.batchUpdate.and.returnValue(of(successResult));
    mockService.checkGroupExists.and.returnValue(of(false));

    fixture   = TestBed.createComponent(AddEditPanelComponent);
    component = fixture.componentInstance;
  });

  // ── Creation ─────────────────────────────────────────────────────────────────

  it('should create the component', () => {
    component.mode = 'add';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should expose seqOptions and displayOrderOptions constants', () => {
    component.mode = 'add';
    fixture.detectChanges();
    expect(component.seqOptions).toEqual(SEQUENCE_OPTIONS);
    expect(component.displayOrderOptions).toEqual(DISPLAY_ORDER_OPTIONS);
  });

  it('should initialize isSaving as false', () => {
    component.mode = 'add';
    fixture.detectChanges();
    expect(component.isSaving).toBeFalse();
  });

  // ── panelTitle ────────────────────────────────────────────────────────────────

  describe('panelTitle', () => {
    it('should return Add title in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New RBC Ag Groups');
    });

    it('should return Edit Group title in editGroup mode', () => {
      component.mode          = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows     = groupRows;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit RBC Ag Groups');
    });

    it('should return Edit Row title in editRow mode', () => {
      component.mode          = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow       = editRow;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Define RBC Ag Groups');
    });
  });

  // ── Lookup loading ────────────────────────────────────────────────────────────

  describe('Lookups', () => {
    it('should load ser test options', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.serTestOptions).toEqual(['D', 'C', 'E']);
    }));

    it('should load mol test options', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.molTestOptions).toEqual(['RHD*01', 'RHCE*Ce']);
    }));

    it('should call lookupSerTestIds and lookupMolTestIds on init', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(mockService.lookupSerTestIds).toHaveBeenCalled();
      expect(mockService.lookupMolTestIds).toHaveBeenCalled();
    }));

    it('should handle lookup errors gracefully', fakeAsync(() => {
      mockService.lookupSerTestIds.and.returnValue(throwError(() => new Error('fail')));
      mockService.lookupMolTestIds.and.returnValue(throwError(() => new Error('fail')));
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.serTestOptions).toEqual([]);
      expect(component.molTestOptions).toEqual([]);
    }));
  });

  // ── Form: add mode ────────────────────────────────────────────────────────────

  describe('Form in add mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should create form with antigenGroup control', () => {
      expect(component.form.get('antigenGroup')).toBeTruthy();
    });

    it('should create form with displayOrder control', () => {
      expect(component.form.get('displayOrder')).toBeTruthy();
    });

    it('should create form with effectiveDate control', () => {
      expect(component.form.get('effectiveDate')).toBeTruthy();
    });

    it('should create form with terminationDate control', () => {
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should initialize one serological row', () => {
      expect(component.serologicalRows.length).toBe(1);
    });

    it('should initialize one molecular row', () => {
      expect(component.molecularRows.length).toBe(1);
    });

    it('should mark antigenGroup as invalid when empty', () => {
      component.form.get('antigenGroup')?.setValue('');
      expect(component.form.get('antigenGroup')?.hasError('required')).toBeTrue();
    });

    it('should reject antigenGroup longer than 10 chars', () => {
      component.form.get('antigenGroup')?.setValue('ABCDEFGHIJK');
      expect(component.form.get('antigenGroup')?.hasError('maxlength')).toBeTrue();
    });

    it('should reject antigenGroup with non-alpha characters', () => {
      component.form.get('antigenGroup')?.setValue('AB1');
      expect(component.form.get('antigenGroup')?.hasError('pattern')).toBeTrue();
    });

    it('should accept valid alpha antigenGroup', () => {
      component.form.get('antigenGroup')?.setValue('KELL');
      expect(component.form.get('antigenGroup')?.valid).toBeTrue();
    });

    it('should mark displayOrder invalid when less than 1', () => {
      component.form.get('displayOrder')?.setValue(0);
      expect(component.form.get('displayOrder')?.hasError('min')).toBeTrue();
    });

    it('should mark displayOrder invalid when greater than 10', () => {
      component.form.get('displayOrder')?.setValue(11);
      expect(component.form.get('displayOrder')?.hasError('max')).toBeTrue();
    });

    it('should mark effectiveDate as required', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.updateValueAndValidity();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should pre-populate antigenGroup from selectedGroup when provided', fakeAsync(() => {
      component.mode = 'add';
      component.selectedGroup = { name: 'KELL', displayOrder: 3 };
      fixture.detectChanges();
      tick();
      // Rebuild form via ngOnChanges
      component.ngOnChanges({
        selectedGroup: new SimpleChange(null, component.selectedGroup, false),
      });
      expect(component.form.get('antigenGroup')?.value).toBe('KELL');
      expect(component.form.get('displayOrder')?.value).toBe(3);
    }));
  });

  // ── ngOnChanges ────────────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should rebuild form when mode changes', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      const originalForm = component.form;

      component.mode = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow = editRow;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'editRow', false),
      });

      expect(component.form).not.toBe(originalForm);
    }));

    it('should rebuild form when selectedGroup changes', fakeAsync(() => {
      component.mode = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows = groupRows;
      fixture.detectChanges();
      tick();
      const originalForm = component.form;

      component.ngOnChanges({
        selectedGroup: new SimpleChange(null, selectedGroup, false),
      });

      expect(component.form).not.toBe(originalForm);
    }));

    it('should rebuild form when editRow changes', fakeAsync(() => {
      component.mode = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow = editRow;
      fixture.detectChanges();
      tick();
      const originalForm = component.form;

      component.ngOnChanges({
        editRow: new SimpleChange(null, editRow, false),
      });

      expect(component.form).not.toBe(originalForm);
    }));

    it('should rebuild form when groupRows changes', fakeAsync(() => {
      component.mode = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows = groupRows;
      fixture.detectChanges();
      tick();
      const originalForm = component.form;

      component.ngOnChanges({
        groupRows: new SimpleChange([], groupRows, false),
      });

      expect(component.form).not.toBe(originalForm);
    }));

    it('should not rebuild form if form is not yet created', () => {
      // form is not yet created (no detectChanges)
      expect(() => {
        component.ngOnChanges({
          mode: new SimpleChange(null, 'add', true),
        });
      }).not.toThrow();
    });
  });

  // ── Form: editGroup mode ──────────────────────────────────────────────────────

  describe('Form in editGroup mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows     = groupRows;
      fixture.detectChanges();
      tick();
    }));

    it('should populate serological test values', () => {
      expect(component.serologicalRows.at(0).get('test')?.value).toBe('D');
      expect(component.serologicalRows.at(1).get('test')?.value).toBe('C');
    });

    it('should populate molecular test values', () => {
      expect(component.molecularRows.at(0).get('test')?.value).toBe('RHD*01');
    });

    it('should populate serological seq values', () => {
      expect(component.serologicalRows.at(0).get('seq')?.value).toBe(1);
      expect(component.serologicalRows.at(1).get('seq')?.value).toBe(2);
    });

    it('should populate molecular seq values', () => {
      expect(component.molecularRows.at(0).get('seq')?.value).toBe(1);
      expect(component.molecularRows.at(1).get('seq')?.value).toBe(2);
    });

    it('should parse effectiveDate from groupRows', () => {
      const effVal = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effVal)).toBeTrue();
      expect(effVal.format('DD-MMM-YYYY').toUpperCase()).toBe('09-JUN-2023');
    });

    it('should have null terminationDate when groupRows have empty termination', () => {
      const termVal = component.form.get('terminationDate')?.value;
      expect(termVal).toBeNull();
    });

    it('should parse terminationDate when present', fakeAsync(() => {
      const rowsWithTerm: AntigenGroupRow[] = [
        { auditKey: 10, serologicalTest: 'D', serologicalSeq: 1, molecularTest: 'RHD*01', molecularSeq: 1, effectiveDate: '09-JUN-2023', terminationDate: '31-DEC-2025' },
      ];
      component.groupRows = rowsWithTerm;
      component.ngOnChanges({
        groupRows: new SimpleChange(groupRows, rowsWithTerm, false),
      });
      const termVal = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termVal)).toBeTrue();
      expect(termVal.format('DD-MMM-YYYY').toUpperCase()).toBe('31-DEC-2025');
    }));

    it('should create same number of serological and molecular rows as groupRows', () => {
      expect(component.serologicalRows.length).toBe(groupRows.length);
      expect(component.molecularRows.length).toBe(groupRows.length);
    });

    it('should disable effectiveDate in edit mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
    });
  });

  // ── Form: editRow mode ────────────────────────────────────────────────────────

  describe('Form in editRow mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow       = editRow;
      fixture.detectChanges();
      tick();
    }));

    it('should have serologicalSeq control with editRow value', () => {
      expect(component.form.get('serologicalSeq')?.value).toBe(editRow.serologicalSeq);
    });

    it('should have molecularSeq control with editRow value', () => {
      expect(component.form.get('molecularSeq')?.value).toBe(editRow.molecularSeq);
    });

    it('should parse effectiveDate from editRow', () => {
      const effVal = component.form.getRawValue().effectiveDate;
      expect(moment.isMoment(effVal)).toBeTrue();
    });

    it('should have null terminationDate when editRow has empty terminationDate', () => {
      const termVal = component.form.get('terminationDate')?.value;
      expect(termVal).toBeNull();
    });

    it('should disable effectiveDate in editRow mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
    });

    it('should mark serologicalSeq as required', () => {
      component.form.get('serologicalSeq')?.setValue(null);
      expect(component.form.get('serologicalSeq')?.hasError('required')).toBeTrue();
    });

    it('should mark molecularSeq as required', () => {
      component.form.get('molecularSeq')?.setValue(null);
      expect(component.form.get('molecularSeq')?.hasError('required')).toBeTrue();
    });
  });

  // ── serologicalRows / molecularRows getters ─────────────────────────────────

  describe('serologicalRows and molecularRows getters', () => {
    it('should return the serological FormArray', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.serologicalRows).toBe(component.form.get('serological') as any);
    }));

    it('should return the molecular FormArray', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      expect(component.molecularRows).toBe(component.form.get('molecular') as any);
    }));
  });

  // ── Add/remove serological and molecular rows ──────────────────────────────

  describe('addSerological / removeSerological', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should add a new serological row', () => {
      const initialCount = component.serologicalRows.length;
      component.addSerological();
      expect(component.serologicalRows.length).toBe(initialCount + 1);
    });

    it('should add a new serological row with empty required test and seq', () => {
      component.addSerological();
      const lastRow = component.serologicalRows.at(component.serologicalRows.length - 1);
      expect(lastRow.get('test')?.value).toBe('');
      expect(lastRow.get('seq')?.value).toBeNull();
      expect(lastRow.get('test')?.hasError('required')).toBeTrue();
    });

    it('should remove serological row at index', () => {
      component.addSerological();
      const count = component.serologicalRows.length;
      component.removeSerological(0);
      expect(component.serologicalRows.length).toBe(count - 1);
    });
  });

  describe('addMolecular / removeMolecular', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should add a new molecular row', () => {
      const initialCount = component.molecularRows.length;
      component.addMolecular();
      expect(component.molecularRows.length).toBe(initialCount + 1);
    });

    it('should add a new molecular row with empty required test and seq', () => {
      component.addMolecular();
      const lastRow = component.molecularRows.at(component.molecularRows.length - 1);
      expect(lastRow.get('test')?.value).toBe('');
      expect(lastRow.get('seq')?.value).toBeNull();
    });

    it('should remove molecular row at index', () => {
      component.addMolecular();
      const count = component.molecularRows.length;
      component.removeMolecular(0);
      expect(component.molecularRows.length).toBe(count - 1);
    });
  });

  // ── onAntigenGroupKeyPress ────────────────────────────────────────────────────

  describe('onAntigenGroupKeyPress', () => {
    it('should return true for alphabetic key', () => {
      const event = { key: 'a' } as KeyboardEvent;
      expect(component.onAntigenGroupKeyPress(event)).toBeTrue();
    });

    it('should return true for uppercase alphabetic key', () => {
      const event = { key: 'Z' } as KeyboardEvent;
      expect(component.onAntigenGroupKeyPress(event)).toBeTrue();
    });

    it('should return false for numeric key', () => {
      const event = { key: '1' } as KeyboardEvent;
      expect(component.onAntigenGroupKeyPress(event)).toBeFalse();
    });

    it('should return false for special character', () => {
      const event = { key: '@' } as KeyboardEvent;
      expect(component.onAntigenGroupKeyPress(event)).toBeFalse();
    });

    it('should return false for space', () => {
      const event = { key: ' ' } as KeyboardEvent;
      expect(component.onAntigenGroupKeyPress(event)).toBeFalse();
    });
  });

  // ── Date error messages ──────────────────────────────────────────────────────

  describe('getEffectiveDateError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should pass form errors when lastChangedDateField is effective', () => {
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('test error');
      // Trigger a change on effectiveDate to set lastChangedDateField
      component.form.get('effectiveDate')?.setValue(moment());
      const result = component.getEffectiveDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalledWith(
        component.form.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        component.form.errors,
      );
      expect(result).toBe('test error');
    });

    it('should pass null form errors when lastChangedDateField is not effective', () => {
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      // Set lastChangedDateField to 'termination'
      component.form.get('terminationDate')?.setValue(moment());
      component.getEffectiveDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalledWith(
        component.form.get('effectiveDate'),
        'Effective Date',
        'Termination Date',
        null,
      );
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should pass form errors when lastChangedDateField is termination', () => {
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('term error');
      component.form.get('terminationDate')?.setValue(moment());
      const result = component.getTerminationDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalledWith(
        component.form.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        component.form.errors,
      );
      expect(result).toBe('term error');
    });

    it('should pass null form errors when lastChangedDateField is not termination', () => {
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.form.get('effectiveDate')?.setValue(moment());
      component.getTerminationDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalledWith(
        component.form.get('terminationDate'),
        'Termination Date',
        'Effective Date',
        null,
      );
    });
  });

  // ── Date input handlers ──────────────────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should call handleStartDateInput with value and control', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2025' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '01-JAN-2025',
        component.form.get('effectiveDate'),
      );
    });
  });

  describe('onTerminationDateInput', () => {
    it('should call handleEndDateInput with isEditMode false in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2025',
        component.form.get('terminationDate'),
        false,
      );
    }));

    it('should call handleEndDateInput with isEditMode true in editGroup mode', fakeAsync(() => {
      component.mode = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows = groupRows;
      fixture.detectChanges();
      tick();
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2025',
        component.form.get('terminationDate'),
        true,
      );
    }));

    it('should call handleEndDateInput with isEditMode true in editRow mode', fakeAsync(() => {
      component.mode = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow = editRow;
      fixture.detectChanges();
      tick();
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2025',
        component.form.get('terminationDate'),
        true,
      );
    }));
  });

  // ── buildBatchUpdateRequest ───────────────────────────────────────────────────

  describe('buildBatchUpdateRequest()', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows     = groupRows;
      fixture.detectChanges();
      tick();
    }));

    it('should set correct antigenGroup', () => {
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.antigenGroup).toBe('RH');
    });

    it('should set correct antigenGrpDispOrder from selectedGroup', () => {
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.antigenGrpDispOrder).toBe(1);
    });

    it('should include all existing rows with auditKey', () => {
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.records.length).toBe(2);
      expect(req.records[0].auditKey).toBe(10);
      expect(req.records[1].auditKey).toBe(11);
    });

    it('should assign null auditKey for newly added rows', fakeAsync(() => {
      component.addSerological();
      component.addMolecular();
      tick();

      const req = (component as any).buildBatchUpdateRequest();
      expect(req.records.length).toBe(3);
      expect(req.records[2].auditKey).toBeNull();
    }));

    it('should set molAgTestId to null when molecular test is empty', () => {
      component.molecularRows.at(0).patchValue({ test: '', seq: 1 });
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.records[0].molAgTestId).toBeNull();
      expect(req.records[0].molTestDispOrder).toBeNull();
    });

    it('should use selectedGroup defaults when selectedGroup is null', () => {
      component.selectedGroup = null;
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.antigenGroup).toBe('');
      expect(req.antigenGrpDispOrder).toBe(0);
    });

    it('should set serological values from form rows', () => {
      component.serologicalRows.at(0).patchValue({ test: 'E', seq: 5 });
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.records[0].serAgTestId).toBe('E');
      expect(req.records[0].serTestDispOrder).toBe(5);
    });

    it('should set molTestDispOrder when molecular test is present', () => {
      component.molecularRows.at(0).patchValue({ test: 'RHD*01', seq: 3 });
      const req = (component as any).buildBatchUpdateRequest();
      expect(req.records[0].molAgTestId).toBe('RHD*01');
      expect(req.records[0].molTestDispOrder).toBe(3);
    });
  });

  // ── buildCreateRecords ────────────────────────────────────────────────────────

  describe('buildCreateRecords()', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should create records from form values', () => {
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({
        antigenGroup: 'KELL',
        displayOrder: 2,
        effectiveDate: futureDate,
      });
      component.serologicalRows.at(0).patchValue({ test: 'K', seq: 1 });
      component.molecularRows.at(0).patchValue({ test: 'KEL*01', seq: 1 });

      const records = (component as any).buildCreateRecords();
      expect(records.length).toBe(1);
      expect(records[0].antigenGroup).toBe('KELL');
      expect(records[0].antigenGrpDispOrder).toBe(2);
      expect(records[0].serAgTestId).toBe('K');
      expect(records[0].serTestDispOrder).toBe(1);
      expect(records[0].molAgTestId).toBe('KEL*01');
      expect(records[0].molTestDispOrder).toBe(1);
    });

    it('should set molAgTestId and molTestDispOrder to null when mol test is empty', () => {
      component.form.patchValue({
        antigenGroup: 'TEST',
        displayOrder: 1,
        effectiveDate: moment().add(1, 'day'),
      });
      component.serologicalRows.at(0).patchValue({ test: 'D', seq: 1 });
      component.molecularRows.at(0).patchValue({ test: '', seq: 1 });

      const records = (component as any).buildCreateRecords();
      expect(records[0].molAgTestId).toBeNull();
      expect(records[0].molTestDispOrder).toBeNull();
    });

    it('should create count based on max of serological and molecular row lengths', () => {
      component.form.patchValue({
        antigenGroup: 'TEST',
        displayOrder: 1,
        effectiveDate: moment().add(1, 'day'),
      });
      component.serologicalRows.at(0).patchValue({ test: 'D', seq: 1 });
      component.addSerological();
      component.serologicalRows.at(1).patchValue({ test: 'C', seq: 2 });
      component.molecularRows.at(0).patchValue({ test: 'RHD*01', seq: 1 });

      const records = (component as any).buildCreateRecords();
      expect(records.length).toBe(2);
    });

    it('should set termDate to null when terminationDate is not provided', () => {
      component.form.patchValue({
        antigenGroup: 'TEST',
        displayOrder: 1,
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null,
      });
      component.serologicalRows.at(0).patchValue({ test: 'D', seq: 1 });
      component.molecularRows.at(0).patchValue({ test: '', seq: 1 });

      const records = (component as any).buildCreateRecords();
      expect(records[0].termDate).toBeNull();
    });
  });

  // ── buildUpdateRecords (editRow) ──────────────────────────────────────────────

  describe('buildUpdateRecords() in editRow mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow       = editRow;
      fixture.detectChanges();
      tick();
    }));

    it('should produce a single record with auditKey', () => {
      const records = (component as any).buildUpdateRecords();
      expect(records.length).toBe(1);
      expect(records[0].auditKey).toBe(editRow.auditKey);
    });

    it('should use selectedGroup name', () => {
      const records = (component as any).buildUpdateRecords();
      expect(records[0].antigenGroup).toBe('RH');
    });

    it('should use form serologicalSeq', () => {
      component.form.get('serologicalSeq')?.setValue(5);
      const records = (component as any).buildUpdateRecords();
      expect(records[0].serTestDispOrder).toBe(5);
    });

    it('should use form molecularSeq', () => {
      component.form.get('molecularSeq')?.setValue(7);
      const records = (component as any).buildUpdateRecords();
      expect(records[0].molTestDispOrder).toBe(7);
    });

    it('should set molAgTestId to null when editRow has no molecular test', fakeAsync(() => {
      const noMolRow: AntigenGroupRow = {
        auditKey: 20, serologicalTest: 'D', serologicalSeq: 1,
        molecularTest: '', molecularSeq: 0,
        effectiveDate: '09-JUN-2023', terminationDate: '',
      };
      component.editRow = noMolRow;
      component.ngOnChanges({
        editRow: new SimpleChange(editRow, noMolRow, false),
      });
      const records = (component as any).buildUpdateRecords();
      expect(records[0].molAgTestId).toBeNull();
      expect(records[0].molTestDispOrder).toBeNull();
    }));

    it('should use selectedGroup defaults when selectedGroup is null', () => {
      component.selectedGroup = null;
      const records = (component as any).buildUpdateRecords();
      expect(records[0].antigenGroup).toBe('');
      expect(records[0].antigenGrpDispOrder).toBe(0);
    });
  });

  // ── buildUpdateRecords (editGroup) ──────────────────────────────────────────

  describe('buildUpdateRecords() in editGroup mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows = groupRows;
      fixture.detectChanges();
      tick();
    }));

    it('should produce records for every groupRow', () => {
      const records = (component as any).buildUpdateRecords();
      expect(records.length).toBe(groupRows.length);
    });

    it('should use auditKey from original groupRows', () => {
      const records = (component as any).buildUpdateRecords();
      expect(records[0].auditKey).toBe(10);
      expect(records[1].auditKey).toBe(11);
    });

    it('should use form serological values when available', () => {
      component.serologicalRows.at(0).patchValue({ test: 'E', seq: 5 });
      const records = (component as any).buildUpdateRecords();
      expect(records[0].serAgTestId).toBe('E');
      expect(records[0].serTestDispOrder).toBe(5);
    });
  });

  // ── onSave (editGroup -> batchUpdate) ─────────────────────────────────────────

  describe('onSave() in editGroup mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editGroup';
      component.selectedGroup = selectedGroup;
      component.groupRows     = groupRows;
      fixture.detectChanges();
      tick();
    }));

    it('should call batchUpdate (not update) for editGroup', fakeAsync(() => {
      component.onSave();
      tick();
      expect(mockService.batchUpdate).toHaveBeenCalled();
      expect(mockService.update).not.toHaveBeenCalled();
    }));

    it('should set isSaving to true during save', fakeAsync(() => {
      const subject = new Subject<ApiResult<null>>();
      mockService.batchUpdate.and.returnValue(subject.asObservable());
      component.onSave();
      expect(component.isSaving).toBeTrue();
      subject.next(successResult);
      subject.complete();
      tick();
    }));

    it('should reset isSaving to false on success', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should emit saveSuccess on success', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      component.onSave();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should emit closePanel on success', fakeAsync(() => {
      spyOn(component.closePanel, 'emit');
      component.onSave();
      tick();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should show success snackbar on success', fakeAsync(() => {
      component.onSave();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'RBC Ag Groups updated successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-success' }),
      );
    }));

    it('should reset isSaving on error', fakeAsync(() => {
      const error$ = new Subject<ApiResult<null>>();
      mockService.batchUpdate.and.returnValue(error$.asObservable());
      component.onSave();
      error$.error(new Error('fail'));
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should show error snackbar on error', fakeAsync(() => {
      mockService.batchUpdate.and.returnValue(throwError(() => new Error('fail')));
      component.onSave();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));

    it('should not call service if form is invalid', fakeAsync(() => {
      // Make serological row test required but empty
      component.serologicalRows.at(0).patchValue({ test: '', seq: null });
      component.onSave();
      tick();
      expect(mockService.batchUpdate).not.toHaveBeenCalled();
    }));

    it('should not call service if isSaving is already true', fakeAsync(() => {
      component.isSaving = true;
      component.onSave();
      tick();
      expect(mockService.batchUpdate).not.toHaveBeenCalled();
    }));
  });

  // ── onSave (editRow -> update) ─────────────────────────────────────────────────

  describe('onSave() in editRow mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode          = 'editRow';
      component.selectedGroup = selectedGroup;
      component.editRow       = editRow;
      fixture.detectChanges();
      tick();
    }));

    it('should call update (not batchUpdate) for editRow', fakeAsync(() => {
      component.onSave();
      tick();
      expect(mockService.update).toHaveBeenCalled();
      expect(mockService.batchUpdate).not.toHaveBeenCalled();
    }));

    it('should reset isSaving to false on success', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should emit saveSuccess and closePanel on success', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onSave();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should show success snackbar on update success', fakeAsync(() => {
      component.onSave();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Define RBC Ag Groups Updated successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-success' }),
      );
    }));

    it('should reset isSaving on error', fakeAsync(() => {
      mockService.update.and.returnValue(throwError(() => new Error('fail')));
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should show error snackbar on update error', fakeAsync(() => {
      mockService.update.and.returnValue(throwError(() => new Error('fail')));
      component.onSave();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));

    it('should not call update if form is invalid', fakeAsync(() => {
      component.form.get('serologicalSeq')?.setValue(null);
      component.onSave();
      tick();
      expect(mockService.update).not.toHaveBeenCalled();
    }));

    it('should not call update if isSaving is already true', fakeAsync(() => {
      component.isSaving = true;
      component.onSave();
      tick();
      expect(mockService.update).not.toHaveBeenCalled();
    }));
  });

  // ── onAdd ─────────────────────────────────────────────────────────────────────

  describe('onAdd()', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should not call service if form is invalid', fakeAsync(() => {
      // form is invalid by default (required fields empty)
      component.onAdd();
      tick();
      expect(mockService.checkGroupExists).not.toHaveBeenCalled();
    }));

    it('should not call service if isSaving is already true', fakeAsync(() => {
      fillAddFormValid();
      component.isSaving = true;
      component.onAdd();
      tick();
      expect(mockService.checkGroupExists).not.toHaveBeenCalled();
    }));

    it('should call checkGroupExists with the antigen group name', fakeAsync(() => {
      fillAddFormValid();
      component.onAdd();
      tick();
      expect(mockService.checkGroupExists).toHaveBeenCalledWith('TEST');
    }));

    it('should show error snackbar if group already exists', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(true));
      component.onAdd();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Antigen Group "TEST" already exists.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
      expect(mockService.create).not.toHaveBeenCalled();
    }));

    it('should reset isSaving when group already exists', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(true));
      component.onAdd();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should call create when group does not exist', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAdd();
      tick();
      expect(mockService.create).toHaveBeenCalled();
    }));

    it('should emit saveSuccess and closePanel on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onAdd();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

    it('should show success snackbar on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAdd();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'RBC Ag Group added successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-success' }),
      );
    }));

    it('should reset isSaving on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAdd();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should reset isSaving and show error on create failure', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.onAdd();
      tick();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));

    it('should reset isSaving and show error on checkGroupExists failure', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(throwError(() => new Error('fail')));
      component.onAdd();
      tick();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));

    it('should set isSaving to true during the operation', fakeAsync(() => {
      fillAddFormValid();
      const checkSubject = new Subject<boolean>();
      mockService.checkGroupExists.and.returnValue(checkSubject.asObservable());
      component.onAdd();
      expect(component.isSaving).toBeTrue();
      checkSubject.next(false);
      tick();
    }));
  });

  // ── onAddAndCreateAnother ────────────────────────────────────────────────────

  describe('onAddAndCreateAnother()', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should not call service if form is invalid', fakeAsync(() => {
      component.onAddAndCreateAnother();
      tick();
      expect(mockService.checkGroupExists).not.toHaveBeenCalled();
    }));

    it('should not call service if isSaving is already true', fakeAsync(() => {
      fillAddFormValid();
      component.isSaving = true;
      component.onAddAndCreateAnother();
      tick();
      expect(mockService.checkGroupExists).not.toHaveBeenCalled();
    }));

    it('should show error snackbar if group already exists', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(true));
      component.onAddAndCreateAnother();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Antigen Group "TEST" already exists.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
      expect(mockService.create).not.toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    }));

    it('should call create when group does not exist', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAddAndCreateAnother();
      tick();
      expect(mockService.create).toHaveBeenCalled();
    }));

    it('should emit saveSuccess but NOT closePanel on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');
      component.onAddAndCreateAnother();
      tick();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    }));

    it('should rebuild the form on create success (reset for another entry)', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAddAndCreateAnother();
      tick();
      // After buildForm, the antigenGroup should be reset to selectedGroup value or empty
      expect(component.form.get('antigenGroup')).toBeTruthy();
      expect(component.serologicalRows.length).toBe(1);
      expect(component.molecularRows.length).toBe(1);
    }));

    it('should show success snackbar on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAddAndCreateAnother();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'RBC Ag Group added successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-success' }),
      );
    }));

    it('should reset isSaving on create success', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      component.onAddAndCreateAnother();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should reset isSaving and show error on create failure', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(of(false));
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.onAddAndCreateAnother();
      tick();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));

    it('should reset isSaving and show error on checkGroupExists failure', fakeAsync(() => {
      fillAddFormValid();
      mockService.checkGroupExists.and.returnValue(throwError(() => new Error('fail')));
      component.onAddAndCreateAnother();
      tick();
      expect(component.isSaving).toBeFalse();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: 'snackbar-error' }),
      );
    }));
  });

  // ── onCancel ─────────────────────────────────────────────────────────────────

  describe('onCancel()', () => {
    it('should emit closePanel', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });

  // ── showSnack (private) ──────────────────────────────────────────────────────

  describe('showSnack()', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should open snackbar with success class by default', () => {
      (component as any).showSnack('Success message');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Success message',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: 'snackbar-success',
          horizontalPosition: 'right',
          verticalPosition: 'top',
        }),
      );
    });

    it('should open snackbar with error class when isError is true', () => {
      (component as any).showSnack('Error message', true);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error message',
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: 'snackbar-error',
          horizontalPosition: 'right',
          verticalPosition: 'top',
        }),
      );
    });
  });

  // ── Date field valueChanges tracking ─────────────────────────────────────────

  describe('date valueChanges tracking (lastChangedDateField)', () => {
    it('should track effective date change in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.get('effectiveDate')?.setValue(moment());
      // After effectiveDate change, getEffectiveDateError should pass form errors
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalledWith(
        jasmine.anything(), 'Effective Date', 'Termination Date', component.form.errors,
      );
    }));

    it('should track termination date change in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
      component.form.get('terminationDate')?.setValue(moment());
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalledWith(
        jasmine.anything(), 'Termination Date', 'Effective Date', component.form.errors,
      );
    }));
  });

  // ── Error state matchers ─────────────────────────────────────────────────────

  describe('error state matchers', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();
      tick();
    }));

    it('should have an effDateErrorMatcher', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.effDateErrorMatcher.isErrorState).toBeInstanceOf(Function);
    });

    it('should have a termDateErrorMatcher', () => {
      expect(component.termDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher.isErrorState).toBeInstanceOf(Function);
    });
  });

  // ── minDate ──────────────────────────────────────────────────────────────────

  describe('minDate', () => {
    it('should be set from DateFieldValidationUtility.getMinDate()', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });
  });
});
