import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddTestPanelComponent } from './add-test-panel';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TestDropdownDto } from '../../models/instrument-test-results.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddTestPanelComponent', () => {
  let component: AddTestPanelComponent;
  let fixture: ComponentFixture<AddTestPanelComponent>;
  let apiServiceSpy: jasmine.SpyObj<InstrumentTestResultsApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockInstrumentTests: TestDropdownDto[] = [
    { testId: 'HIVAB', testDesc: 'HIV Antibody' },
    { testId: 'HCVAB', testDesc: 'HCV Antibody' },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('InstrumentTestResultsApiService', [
      'getValidTests',
      'createInstrumentTest',
    ]);
    headerServiceSpy = createMockHeaderService({ chapterId: signal('TEST') });
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.getValidTests.and.returnValue(of(mockInstrumentTests));
    apiServiceSpy.createInstrumentTest.and.returnValue(of({ machineId: 'MACH1', chapterId: 'TEST', testId: 'HIVAB' } as any));
      TestBed.configureTestingModule({
      imports: [AddTestPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: InstrumentTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });
      apiServiceSpy.getValidTests.and.returnValue(of(mockInstrumentTests));

      apiServiceSpy.createInstrumentTest.and.returnValue(of({ machineId: 'MACH1', chapterId: 'TEST', testId: 'HIVAB' } as any));
    fixture = TestBed.createComponent(AddTestPanelComponent);
    component = fixture.componentInstance;
    component.machineId = 'MACH1';
    component.machineName = 'Test Machine';
    fixture.detectChanges();

    });

  /* ── Initialisation ───────────────────────────────────────── */

  describe('initialisation', () => {
    it('should call getValidTests with chapterId', () => {
      expect(apiServiceSpy.getValidTests).toHaveBeenCalledWith('TEST');
    });

    it('should keep validTests empty when getValidTests fails', () => {
      apiServiceSpy.getValidTests.and.returnValue(throwError(() => new Error('fail')));
      component['loadDropdowns']();
      expect(component.loading()).toBeFalse();
    });
  });

  /* ── Form structure ───────────────────────────────────────── */

  describe('form', () => {
    it('should initialise testId as empty string', () => {
      expect(component.form.get('testId')?.value).toBe('');
    });

    it('should initialise effDate as null', () => {
      expect(component.form.get('effDate')?.value).toBeNull();
    });

    it('should not have ltTestId1 control', () => {
      expect(component.form.get('ltTestId1')).toBeNull();
    });

    it('should be valid with testId, machineTestId and effDate set', () => {
      component.form.get('testId')?.setValue('HIVAB');
      component.form.get('machineTestId')?.setValue('MT01');
      component.form.get('effDate')?.setValue(moment().add(2, 'years'));
      expect(component.form.invalid).toBeFalse();
    });
  });

  /* ── onCancel ─────────────────────────────────────────────── */
  /* ── onSubmit — validation ────────────────────────────────── */

  describe('onSubmit — form invalid', () => {
    it('should set submitted to true regardless of validity', () => {
      component.onSubmit();
      expect(component.submitted()).toBeTrue();
    });
  });

  /* ── onSubmit — success ───────────────────────────────────── */

  describe('onSubmit — valid form, success', () => {
    beforeEach(() => {
      component.form.get('testId')?.setValue('HIVAB');
      component.form.get('machineTestId')?.setValue('MT01');
      component.form.get('effDate')?.setValue(moment().add(2, 'years'));
    });

    it('should call createInstrumentTest with the form testId', () => {
      component.onSubmit();
      const dto = apiServiceSpy.createInstrumentTest.calls.mostRecent().args[0];
      expect(dto.testId).toBe('HIVAB');
    });

    it('should not include ltSchTestId1 or ltSchRes1 in the DTO', () => {
      component.onSubmit();
      const dto = apiServiceSpy.createInstrumentTest.calls.mostRecent().args[0];
      expect((dto as any).ltSchTestId1).toBeUndefined();
      expect((dto as any).ltSchRes1).toBeUndefined();
    });

    it('should emit saveSuccess on save', () => {
      let emitted = false;
      component.saveSuccess.subscribe(() => { emitted = true; });
      component.onSubmit();
      expect(emitted).toBeTrue();
    });

    it('should emit closePanel when createAnother is false', () => {
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });
      component.onSubmit(false);
      expect(emitted).toBeTrue();
    });

    it('should not emit closePanel when createAnother is true', () => {
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });
      component.onSubmit(true);
      expect(emitted).toBeFalse();
    });
  });

  /* ── onSubmit — error ─────────────────────────────────────── */

  describe('onSubmit — API error', () => {
    beforeEach(() => {
      component.form.get('testId')?.setValue('HIVAB');
      component.form.get('machineTestId')?.setValue('MT01');
      component.form.get('effDate')?.setValue(moment().add(2, 'years'));
    });

    it('should set saving to false on error', () => {
      apiServiceSpy.createInstrumentTest.and.returnValue(throwError(() => new Error('Server down')));
      component.onSubmit();
      expect(component.saving()).toBeFalse();
    });

    it('should not emit saveSuccess on error', () => {
      let emitted = false;
      component.saveSuccess.subscribe(() => { emitted = true; });
      apiServiceSpy.createInstrumentTest.and.returnValue(throwError(() => new Error('fail')));
      component.onSubmit();
      expect(emitted).toBeFalse();
    });
  });

  /* ── filteredTests search ─────────────────────────────────── */

  describe('filteredTests', () => {
    it('should return all tests when search is empty', () => {
      expect(component.filteredTests().length).toBe(2);
    });

    it('should return empty when no tests match', () => {
      component.testIdSearchControl.setValue('ZZZZ');
      expect(component.filteredTests().length).toBe(0);
    });
  });

  /* ── MLT-16129: button disabled state ────────────────────── */

  /* ── onCancel ─────────────────────────────────────────────── */

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });
      component.onCancel();
      expect(emitted).toBeTrue();
    });
  });

  /* ── f getter ────────────────────────────────────────────── */

  describe('f getter', () => {
    it('should return form.controls', () => {
      expect(component.f).toBe(component.form.controls);
    });

    it('should have testId control', () => {
      expect(component.f['testId']).toBeDefined();
    });

    it('should have effDate control', () => {
      expect(component.f['effDate']).toBeDefined();
    });
  });

  /* ── onEffectiveDateInput ────────────────────────────────── */

  describe('onEffectiveDateInput', () => {
    it('should call DateFieldValidationUtility.handleStartDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onEffectiveDateInput(event);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '01-JAN-2025',
        component.form.get('effDate')
      );
    });
  });

  /* ── onTerminationDateInput ──────────────────────────────── */

  describe('onTerminationDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2025' } } as any;
      component.onTerminationDateInput(event);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
        '31-DEC-2025',
        component.form.get('termDate'),
        false
      );
    });
  });

  /* ── getEffectiveDateError ───────────────────────────────── */

  describe('getEffectiveDateError', () => {
    it('should return a string', () => {
      expect(typeof component.getEffectiveDateError()).toBe('string');
    });

    it('should call DateFieldValidationUtility.getStartDateCrossFieldError', () => {
      spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('error msg');
      const result = component.getEffectiveDateError();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError).toHaveBeenCalled();
      expect(result).toBe('error msg');
    });
  });

  /* ── getTerminationDateError ─────────────────────────────── */

  describe('getTerminationDateError', () => {
    it('should return a string', () => {
      expect(typeof component.getTerminationDateError()).toBe('string');
    });

    it('should call DateFieldValidationUtility.getEndDateCrossFieldError', () => {
      spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('term error');
      const result = component.getTerminationDateError();
      expect(DateFieldValidationUtility.getEndDateCrossFieldError).toHaveBeenCalled();
      expect(result).toBe('term error');
    });
  });

  /* ── terminationDateFilter ───────────────────────────────── */

  describe('terminationDateFilter', () => {
    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return false for date before minDate', () => {
      const pastDate = moment('2000-01-01');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return false for date before effective date', () => {
      component.form.get('effDate')?.setValue(moment().add(10, 'days'));
      const beforeEff = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEff)).toBeFalse();
    });

    it('should return true for date on or after effective date and minDate', () => {
      component.form.get('effDate')?.setValue(moment().add(1, 'days'));
      const futureDate = moment().add(30, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });
  });

  /* ── handleApiError ──────────────────────────────────────── */

  describe('handleApiError', () => {
    it('should show error for code 5002', () => {
      component['handleApiError']({ error: { errorCode: '5002' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5002: Effective date is required.');
    });

    it('should show error for code 5003', () => {
      component['handleApiError']({ error: { errorCode: '5003' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5003: Effective date cannot be in the past.');
    });

    it('should show error for code 5004', () => {
      component['handleApiError']({ error: { errorCode: '5004' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5004: Termination date must be on or after effective date.');
    });

    it('should show error for code 5010', () => {
      component['handleApiError']({ error: { errorCode: '5010' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5010: Test ID does not exist or is not currently active.');
    });

    it('should show error for code 5028', () => {
      component['handleApiError']({ error: { errorCode: '5028' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5028: This test is already assigned to this machine.');
    });

    it('should show error response message for unknown code', () => {
      component['handleApiError']({ error: { errorResponse: { error: 'Custom error message' } } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom error message');
    });

    it('should show error.message when errorResponse.error not available', () => {
      component['handleApiError']({ error: { message: 'Server error occurred' } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error occurred');
    });

    it('should show default message when no error code or message', () => {
      component['handleApiError']({});
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add instrument test. Please try again.');
    });

    it('should use errorResponse.errorCode when errorCode is not at top level', () => {
      component['handleApiError']({ error: { errorResponse: { errorCode: '5028', error: 'Dupe' } } });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5028: This test is already assigned to this machine.');
    });
  });

  /* ── resetForm via onSubmit(true) ────────────────────────── */

  describe('onSubmit with createAnother=true', () => {
    beforeEach(() => {
      component.form.get('testId')?.setValue('HIVAB');
      component.form.get('machineTestId')?.setValue('MT01');
      component.form.get('effDate')?.setValue(moment().add(2, 'years'));
    });

    it('should reset form when createAnother is true', () => {
      component.onSubmit(true);

      expect(component.form.get('testId')?.value).toBe('');
      expect(component.form.get('machineTestId')?.value).toBe('');
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should reset submitted to false', () => {
      component.onSubmit(true);
      expect(component.submitted()).toBeFalse();
    });

    it('should reset testIdSearchControl', () => {
      component.testIdSearchControl.setValue('search term');
      component.onSubmit(true);
      expect(component.testIdSearchControl.value).toBe('');
    });
  });

  /* ── effDateErrorMatcher and termDateErrorMatcher ─────────── */

  describe('effDateErrorMatcher', () => {
    it('should be defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
    });

    it('should have isErrorState method', () => {
      expect(typeof component.effDateErrorMatcher.isErrorState).toBe('function');
    });
  });

  describe('termDateErrorMatcher', () => {
    it('should be defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
    });

    it('should have isErrorState method', () => {
      expect(typeof component.termDateErrorMatcher.isErrorState).toBe('function');
    });
  });

  /* ── minDate ─────────────────────────────────────────────── */

  describe('minDate', () => {
    it('should be a moment object', () => {
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });
  });

  /* ── componentId and helpers ─────────────────────────────── */

  describe('componentId and helpers', () => {
    it('should have a componentId string', () => {
      expect(typeof component['componentId']).toBe('string');
      expect(component['componentId']).toContain('add-test-panel-');
    });

    it('elementId should return componentId-name', () => {
      const result = component['elementId']('testField');
      expect(result).toBe(`${component['componentId']}-testField`);
    });

    it('errorId should return componentId-name-error', () => {
      const result = component['errorId']('testField');
      expect(result).toBe(`${component['componentId']}-testField-error`);
    });
  });

  /* ── ngOnDestroy ─────────────────────────────────────────── */

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should call next on destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  /* ── handleApiError invoked through onSubmit ─────────────── */

  describe('onSubmit — API error with error code', () => {
    beforeEach(() => {
      component.form.get('testId')?.setValue('HIVAB');
      component.form.get('machineTestId')?.setValue('MT01');
      component.form.get('effDate')?.setValue(moment().add(2, 'years'));
    });

    it('should call handleApiError and show mapped error message', () => {
      apiServiceSpy.createInstrumentTest.and.returnValue(
        throwError(() => ({ error: { errorCode: '5028' } }))
      );
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5028: This test is already assigned to this machine.');
    });
  });
});
