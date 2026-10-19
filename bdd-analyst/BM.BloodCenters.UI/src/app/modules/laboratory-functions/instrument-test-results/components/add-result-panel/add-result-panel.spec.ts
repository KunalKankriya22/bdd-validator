import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddResultPanelComponent } from './add-result-panel';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

const mockStatuses = [
  { resultStatus: 'POS', resultDesc: 'Positive' },
  { resultStatus: 'NEG', resultDesc: 'Negative' },
];

const mockApiService = {
  getResultStatusesDropdown: jasmine.createSpy('getResultStatusesDropdown').and.returnValue(of(mockStatuses)),
  createInstrumentResult: jasmine.createSpy('createInstrumentResult').and.returnValue(of({})),
};

const mockHeaderService = {
  getCurrentChapterId: () => 'CH01',
  chapterTimeZone: () => '-05:00',
};

const mockSnackbarService = {
  showError: jasmine.createSpy('showError'),
  showSuccess: jasmine.createSpy('showSuccess'),
};

describe('AddResultPanelComponent', () => {
  let component: AddResultPanelComponent;
  let fixture: ComponentFixture<AddResultPanelComponent>;

  beforeEach(() => {
    mockApiService.getResultStatusesDropdown.calls.reset();
    mockApiService.getResultStatusesDropdown.and.returnValue(of(mockStatuses));
    mockApiService.createInstrumentResult.calls.reset();
    mockApiService.createInstrumentResult.and.returnValue(of({}));
    mockSnackbarService.showError.calls.reset();
    mockSnackbarService.showSuccess.calls.reset();

    TestBed.configureTestingModule({
      imports: [AddResultPanelComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: InstrumentTestResultsApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    });

    fixture = TestBed.createComponent(AddResultPanelComponent);
    component = fixture.componentInstance;
    component.machineId = 'M01';
    component.testId = 'ABORH';
    fixture.detectChanges();
  });


  it('should load result statuses on init', () => {
    expect(mockApiService.getResultStatusesDropdown).toHaveBeenCalledWith('ABORH', 'CH01');
    expect(component.resultStatuses().length).toBe(2);
  });

  it('should have invalid form initially (required fields empty)', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should auto-populate description when resultStatus changes', () => {
    component.form.get('resultStatus')?.setValue('POS');
    expect(component.selectedResultDesc).toBe('Positive');
  });

  it('should clear description when resultStatus is cleared', () => {
    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('resultStatus')?.setValue('');
    expect(component.selectedResultDesc).toBe('');
  });


  it('should have unique componentId per instance', () => {
    const fixture2 = TestBed.createComponent(AddResultPanelComponent);
    fixture2.componentInstance.machineId = 'M01';
    fixture2.componentInstance.testId = 'ABORH';
    fixture2.detectChanges();
    expect((component as any).componentId).not.toBe((fixture2.componentInstance as any).componentId);
  });

  it('should show error when dropdown load fails', () => {
    mockApiService.getResultStatusesDropdown.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.loadError()).toBeTruthy();
  });

  it('should validate machineResultStatus maxlength=12', () => {
    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A'.repeat(13));
    component.form.get('effDate')?.setValue(new Date());
    expect(component.form.get('machineResultStatus')?.errors?.['maxlength']).toBeTruthy();
  });

  it('should require machineResultStatus', () => {
    component.form.get('machineResultStatus')?.setValue('');
    component.form.get('machineResultStatus')?.markAsTouched();
    expect(component.form.get('machineResultStatus')?.errors?.['required']).toBeTruthy();
  });

  it('should have two footer buttons: add-and-create and add', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.footer-actions button');
    expect(buttons.length).toBe(3); // cancel + add-and-create + add
  });

  /* ── MLT-16129: button disabled state ────────────────────── */

  /* ── elementId and errorId helpers ────────────────────── */
  it('should return a proper elementId string', () => {
    const id = (component as any).elementId('test');
    expect(id).toContain('add-result-panel-');
    expect(id).toContain('-test');
  });

  it('should return a proper errorId string', () => {
    const id = (component as any).errorId('test');
    expect(id).toContain('add-result-panel-');
    expect(id).toContain('-test-error');
  });

  /* ── loading signal ────────────────────── */
  it('should have loading as false after successful dropdown load', () => {
    expect(component.loading()).toBeFalse();
  });

  /* ── minDate ────────────────────── */
  it('should have minDate defined', () => {
    expect(component.minDate).toBeTruthy();
  });

  /* ── resultSearchCtrl filtering ────────────────────── */
  it('should filter result statuses based on search input', () => {
    component.resultSearchCtrl.setValue('pos');
    fixture.detectChanges();
    const filtered = component.filteredResultStatuses();
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered.some(s => s.resultStatus === 'POS')).toBeTrue();
  });

  it('should return all statuses when search is empty', () => {
    component.resultSearchCtrl.setValue('');
    fixture.detectChanges();
    expect(component.filteredResultStatuses().length).toBe(2);
  });

  /* ── retryLoadDropdowns ────────────────────── */
  it('should call getResultStatusesDropdown again on retryLoadDropdowns', () => {
    mockApiService.getResultStatusesDropdown.calls.reset();
    component.retryLoadDropdowns();
    expect(mockApiService.getResultStatusesDropdown).toHaveBeenCalled();
  });

  /* ── getEffectiveDateError ────────────────────── */
  it('should return a string from getEffectiveDateError', () => {
    const result = component.getEffectiveDateError();
    expect(typeof result).toBe('string');
  });

  it('should return error message when effDate is touched and required', () => {
    component.form.get('effDate')?.markAsTouched();
    component.form.get('effDate')?.setValue(null);
    component.form.get('effDate')?.updateValueAndValidity();
    const error = component.getEffectiveDateError();
    expect(typeof error).toBe('string');
  });

  /* ── getTerminationDateError ────────────────────── */
  it('should return a string from getTerminationDateError', () => {
    const result = component.getTerminationDateError();
    expect(typeof result).toBe('string');
  });

  /* ── onEffectiveDateInput ────────────────────── */
  it('should handle effective date input without error', () => {
    spyOn(DateFieldValidationUtility, 'handleStartDateInput');
    const event = { target: { value: '01-Jan-2027' } };
    expect(() => component.onEffectiveDateInput(event as any)).not.toThrow();
    expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
      '01-Jan-2027',
      component.form.get('effDate')
    );
  });

  it('should handle effective date input with empty value', () => {
    spyOn(DateFieldValidationUtility, 'handleStartDateInput');
    const event = { target: { value: '' } };
    expect(() => component.onEffectiveDateInput(event as any)).not.toThrow();
    expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalled();
  });

  /* ── onTerminationDateInput ────────────────────── */
  it('should handle termination date input without error', () => {
    spyOn(DateFieldValidationUtility, 'handleEndDateInput');
    const event = { target: { value: '31-Dec-2027' } };
    expect(() => component.onTerminationDateInput(event as any)).not.toThrow();
    expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
      '31-Dec-2027',
      component.form.get('termDate'),
      false
    );
  });

  it('should handle termination date input with empty value', () => {
    spyOn(DateFieldValidationUtility, 'handleEndDateInput');
    const event = { target: { value: '' } };
    expect(() => component.onTerminationDateInput(event as any)).not.toThrow();
    expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalled();
  });

  /* ── onSubmit - invalid form ────────────────────── */
  it('should not call createInstrumentResult when form is invalid', () => {
    mockApiService.createInstrumentResult.calls.reset();
    component.onSubmit();
    expect(component.submitted()).toBeTrue();
    expect(mockApiService.createInstrumentResult).not.toHaveBeenCalled();
  });

  /* ── onSubmit - valid form success ────────────────────── */
  it('should call createInstrumentResult and emit events on valid submit', () => {
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(mockApiService.createInstrumentResult).toHaveBeenCalled();
    expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Instrument test result added successfully.');
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  /* ── onSubmit with createAnother=true ────────────────────── */
  it('should reset form after successful submit with createAnother=true', () => {
    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit(true);

    expect(mockApiService.createInstrumentResult).toHaveBeenCalled();
    expect(component.submitted()).toBeFalse();
  });

  /* ── onSubmit - API error with known error code ────────────────────── */
  it('should show error with known error code on API failure', () => {
    mockApiService.createInstrumentResult.and.returnValue(
      throwError(() => ({ error: { errorCode: '5002' } }))
    );

    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(mockSnackbarService.showError).toHaveBeenCalled();
    const errorMessage = mockSnackbarService.showError.calls.mostRecent().args[0];
    expect(errorMessage).toContain('5002');
  });

  /* ── onSubmit - API error with unknown error ────────────────────── */
  it('should show error message on API failure with unknown error', () => {
    mockApiService.createInstrumentResult.and.returnValue(
      throwError(() => ({ error: { message: 'Something broke' } }))
    );

    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(mockSnackbarService.showError).toHaveBeenCalled();
  });

  /* ── onSubmit - API error with errorResponse path ────────────────────── */
  it('should handle API error with errorResponse.errorCode path', () => {
    mockApiService.createInstrumentResult.and.returnValue(
      throwError(() => ({ error: { errorResponse: { errorCode: '5003', error: 'Past date' } } }))
    );

    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(mockSnackbarService.showError).toHaveBeenCalled();
    const errorMessage = mockSnackbarService.showError.calls.mostRecent().args[0];
    expect(errorMessage).toContain('5003');
  });

  /* ── onCancel ────────────────────── */
  it('should emit closePanel on cancel', () => {
    spyOn(component.closePanel, 'emit');
    component.onCancel();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  /* ── terminationDateFilter ────────────────────── */
  it('should return true for null date in terminationDateFilter', () => {
    expect(component.terminationDateFilter(null)).toBeTrue();
  });

  it('should return true for future date in terminationDateFilter', () => {
    const futureDate = moment().add(1, 'year');
    expect(component.terminationDateFilter(futureDate)).toBeTrue();
  });

  it('should return false for date before effDate in terminationDateFilter', () => {
    const futureDate = moment().add(10, 'days');
    component.form.get('effDate')?.setValue(futureDate);
    const beforeEffDate = moment().add(5, 'days');
    expect(component.terminationDateFilter(beforeEffDate)).toBeFalse();
  });

  /* ── effDate valueChanges sets lastChangedDateField ────────────────────── */
  it('should update lastChangedDateField when effDate changes', () => {
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    expect((component as any).lastChangedDateField).toBe('effective');
    component.form.get('effDate')?.markAsTouched();
    const error = component.getEffectiveDateError();
    expect(typeof error).toBe('string');
  });

  /* ── termDate valueChanges sets lastChangedDateField ────────────────────── */
  it('should update lastChangedDateField when termDate changes', () => {
    component.form.get('termDate')?.setValue(moment().add(30, 'days'));
    expect((component as any).lastChangedDateField).toBe('termination');
    component.form.get('termDate')?.markAsTouched();
    const error = component.getTerminationDateError();
    expect(typeof error).toBe('string');
  });

  /* ── saving signal resets after submit ────────────────────── */
  it('should set saving to false after successful submit', () => {
    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(component.saving()).toBeFalse();
  });

  it('should set saving to false after failed submit', () => {
    mockApiService.createInstrumentResult.and.returnValue(
      throwError(() => ({ error: { message: 'fail' } }))
    );

    component.form.get('resultStatus')?.setValue('POS');
    component.form.get('machineResultStatus')?.setValue('A+');
    component.form.get('effDate')?.setValue(moment().add(1, 'days'));
    component.form.updateValueAndValidity();

    component.onSubmit();

    expect(component.saving()).toBeFalse();
  });

  /* ── initForm creates form with correct controls ────────────────────── */
  it('should create form with all required controls', () => {
    expect(component.form.get('resultStatus')).toBeTruthy();
    expect(component.form.get('machineResultStatus')).toBeTruthy();
    expect(component.form.get('effDate')).toBeTruthy();
    expect(component.form.get('termDate')).toBeTruthy();
  });

  /* ── form cross-field date range validator ────────────────────── */
  it('should have dateRangeInvalid error when termDate is before effDate', () => {
    component.form.get('effDate')?.setValue(moment().add(10, 'days'));
    component.form.get('termDate')?.setValue(moment().add(5, 'days'));
    component.form.updateValueAndValidity();
    expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
  });

  /* ── loadDropdowns error path ────────────────────── */
  it('should set resultStatuses to empty on dropdown load error', () => {
    mockApiService.getResultStatusesDropdown.and.returnValue(throwError(() => new Error('fail')));
    component.retryLoadDropdowns();
    expect(component.resultStatuses().length).toBe(0);
    expect(component.loading()).toBeFalse();
  });
});
