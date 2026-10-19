import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { EditResultPanelComponent } from './edit-result-panel';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InstrumentResultDto } from '../../models/instrument-test-results.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

const FUTURE_EFF_DATE = '2027-06-15T00:00:00Z';

const mockResultData: InstrumentResultDto = {
  chapterId: 'CH01',
  machineId: 'M01',
  testId: 'ABORH',
  resultStatus: 'POS',
  resultDesc: 'Positive',
  machineResultStatus: 'A+',
  effDate: FUTURE_EFF_DATE,
  termDate: null,
  lastModifiedDate: '2025-06-01T00:00:00Z',
};

const mockApiService = {
  updateInstrumentResult: jasmine.createSpy('updateInstrumentResult').and.returnValue(of({})),
};

const mockHeaderService = {
  getCurrentChapterId: () => 'CH01',
  chapterTimeZone: () => '-05:00',
};

const mockChapterTimezoneService = {
  convertGmtToLocal: (m: any) => m.clone(),
  getChapterLocalDate: () => moment().startOf('day'),
  isChapterLocalDateAvailable: () => false,
};

const mockSnackbarService = {
  showError: jasmine.createSpy('showError'),
  showSuccess: jasmine.createSpy('showSuccess'),
};

describe('EditResultPanelComponent', () => {
  let component: EditResultPanelComponent;
  let fixture: ComponentFixture<EditResultPanelComponent>;

  beforeEach(async () => {
    mockApiService.updateInstrumentResult = jasmine.createSpy('updateInstrumentResult').and.returnValue(of({}));
    mockSnackbarService.showError = jasmine.createSpy('showError');
    mockSnackbarService.showSuccess = jasmine.createSpy('showSuccess');

    await TestBed.configureTestingModule({
      imports: [EditResultPanelComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: InstrumentTestResultsApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditResultPanelComponent);
    component = fixture.componentInstance;
    component.resultData = { ...mockResultData };
    fixture.detectChanges();
  });

  // ── Form initialisation ────────────────────────────────────────────────────

  it('should pre-populate machineResultStatus from resultData', () => {
    expect(component.form.get('machineResultStatus')?.value).toBe('A+');
  });

  it('should pre-populate effDate from resultData', () => {
    const effDate = component.form.get('effDate')?.value;
    expect(effDate).toBeTruthy();
    expect(effDate.format('YYYY-MM-DD')).toBe('2027-06-15');
  });

  it('should leave termDate null when resultData.termDate is null', () => {
    expect(component.form.get('termDate')?.value).toBeNull();
  });

  it('should have valid form when pre-populated with complete data', () => {
    expect(component.form.valid).toBeTrue();
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('should require machineResultStatus', () => {
    component.form.get('machineResultStatus')?.setValue('');
    component.form.get('machineResultStatus')?.markAsTouched();
    expect(component.form.get('machineResultStatus')?.errors?.['required']).toBeTruthy();
  });

  it('should enforce maxlength 12 on machineResultStatus', () => {
    component.form.get('machineResultStatus')?.setValue('A'.repeat(13));
    expect(component.form.get('machineResultStatus')?.errors?.['maxlength']).toBeTruthy();
  });

  // ── Submit ─────────────────────────────────────────────────────────────────

  it('should send correct path params to updateInstrumentResult', () => {
    component.onSubmit();
    const args = mockApiService.updateInstrumentResult.calls.mostRecent().args;
    expect(args[0]).toBe('CH01'); // chapterId
    expect(args[1]).toBe('M01');  // machineId
    expect(args[2]).toBe('ABORH'); // testId
    expect(args[3]).toBe('POS');  // resultStatus
  });

  it('should include effDate in update DTO', () => {
    component.onSubmit();
    const dto = mockApiService.updateInstrumentResult.calls.mostRecent().args[4];
    expect(dto.effDate).toBe('2027-06-15');
  });

  it('should include machineResultStatus in update DTO', () => {
    component.onSubmit();
    const dto = mockApiService.updateInstrumentResult.calls.mostRecent().args[4];
    expect(dto.machineResultStatus).toBe('A+');
  });

  it('should trim whitespace from machineResultStatus before saving', () => {
    component.form.get('machineResultStatus')?.setValue('  B+  ');
    component.onSubmit();
    const dto = mockApiService.updateInstrumentResult.calls.mostRecent().args[4];
    expect(dto.machineResultStatus).toBe('B+');
  });

  it('should emit saveSuccess and closePanel on successful save', () => {
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');
    component.onSubmit();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should set saving to false after successful save', () => {
    component.onSubmit();
    expect(component.saving()).toBeFalse();
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it('should set saving to false after API error', () => {
    mockApiService.updateInstrumentResult.and.returnValue(throwError(() => new Error()));
    component.onSubmit();
    expect(component.saving()).toBeFalse();
  });

  // ── Clear All ──────────────────────────────────────────────────────────────

  it('should reset submitted flag on clearAll', () => {
    component.submitted.set(true);
    component.onClearAll();
    expect(component.submitted()).toBeFalse();
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  // ── DOM structure ──────────────────────────────────────────────────────────

  it('should have three footer buttons: cancel, clear all, save', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.footer-actions button');
    expect(buttons.length).toBe(3);
  });

  it('should have both effective date and termination date as editable datepickers', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const datepickerToggles = compiled.querySelectorAll('mat-datepicker-toggle');
    expect(datepickerToggles.length).toBe(2);
  });

  it('should render Last Modified subtitle when lastModifiedDate is present', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('.panel-subtitle');
    expect(subtitle).toBeTruthy();
    expect(subtitle?.textContent).toContain('Last Modified');
  });

  // ── Unique IDs ─────────────────────────────────────────────────────────────

  it('should have unique componentId per instance', () => {
    const fixture2 = TestBed.createComponent(EditResultPanelComponent);
    fixture2.componentInstance.resultData = { ...mockResultData };
    fixture2.detectChanges();
    expect((component as any).componentId).not.toBe((fixture2.componentInstance as any).componentId);
  });

  // ── elementId / errorId helpers ──────────────────────────────────────────

  it('should generate elementId containing componentId and the given name', () => {
    const id = (component as any).elementId('test');
    expect(id).toContain('edit-result-panel');
    expect(id).toContain('test');
  });

  it('should generate errorId containing the name and "error"', () => {
    const id = (component as any).errorId('field');
    expect(id).toContain('field');
    expect(id).toContain('error');
  });

  // ── terminationDateFilter ────────────────────────────────────────────────

  it('should return true from terminationDateFilter when date is null', () => {
    expect(component.terminationDateFilter(null)).toBeTrue();
  });

  it('should return true from terminationDateFilter for a future date', () => {
    expect(component.terminationDateFilter(moment('2030-01-01'))).toBeTrue();
  });

  it('should return false from terminationDateFilter for a date before minDate', () => {
    const pastDate = moment('2000-01-01');
    expect(component.terminationDateFilter(pastDate)).toBeFalse();
  });

  it('should return false from terminationDateFilter for a date before effDate', () => {
    component.form.get('effDate')?.setValue(moment('2028-01-01'));
    const beforeEff = moment('2027-06-01');
    expect(component.terminationDateFilter(beforeEff)).toBeFalse();
  });

  // ── hasDirtyInvalidControls ──────────────────────────────────────────────

  it('should return false for hasDirtyInvalidControls when form is pristine and valid', () => {
    expect(component.hasDirtyInvalidControls).toBeFalse();
  });

  it('should return true for hasDirtyInvalidControls when a control is dirty and invalid', () => {
    component.form.get('machineResultStatus')?.setValue('');
    component.form.get('machineResultStatus')?.markAsDirty();
    expect(component.hasDirtyInvalidControls).toBeTrue();
  });

  it('should return true for hasDirtyInvalidControls when form has errors and date is dirty', () => {
    // Set termDate before effDate to trigger cross-field dateRangeInvalid
    component.form.get('effDate')?.setValue(moment('2030-06-01'));
    component.form.get('termDate')?.setValue(moment('2029-01-01'));
    component.form.get('effDate')?.markAsDirty();
    component.form.updateValueAndValidity();
    expect(component.hasDirtyInvalidControls).toBeTrue();
  });

  // ── onEffectiveDateInput ─────────────────────────────────────────────────

  it('should call DateFieldValidationUtility.handleStartDateInput on effective date input', () => {
    const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
    const mockEvent = { target: { value: '15-Jun-2027' } } as unknown as Event;
    component.onEffectiveDateInput(mockEvent);
    expect(spy).toHaveBeenCalledWith('15-Jun-2027', component.form.get('effDate'));
  });

  // ── onTerminationDateInput ───────────────────────────────────────────────

  it('should call DateFieldValidationUtility.handleEndDateInput on termination date input', () => {
    const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
    const mockEvent = { target: { value: '20-Dec-2028' } } as unknown as Event;
    component.onTerminationDateInput(mockEvent);
    expect(spy).toHaveBeenCalledWith('20-Dec-2028', component.form.get('termDate'), true);
  });

  // ── getEffectiveDateError / getTerminationDateError ──────────────────────

  it('should return an error string from getEffectiveDateError when effDate is dirty', () => {
    component.form.get('effDate')?.setValue(null);
    component.form.get('effDate')?.markAsDirty();
    component.form.get('effDate')?.markAsTouched();
    const err = component.getEffectiveDateError();
    expect(typeof err).toBe('string');
    expect(err.length).toBeGreaterThan(0);
  });

  it('should return an error string from getTerminationDateError when termDate has parse error', () => {
    component.form.get('termDate')?.setErrors({ matDatepickerParse: true });
    component.form.get('termDate')?.markAsDirty();
    component.form.get('termDate')?.markAsTouched();
    const err = component.getTerminationDateError();
    expect(typeof err).toBe('string');
    expect(err.length).toBeGreaterThan(0);
  });

  // ── handleApiError (via onSubmit) ────────────────────────────────────────

  it('should show error with message for known error code 5002', () => {
    mockApiService.updateInstrumentResult.and.returnValue(
      throwError(() => ({ error: { errorCode: '5002' } }))
    );
    component.onSubmit();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
    const msg = mockSnackbarService.showError.calls.mostRecent().args[0];
    expect(msg).toContain('Effective date is required');
  });

  it('should show error with message for known error code 5429', () => {
    mockApiService.updateInstrumentResult.and.returnValue(
      throwError(() => ({ error: { errorCode: '5429' } }))
    );
    component.onSubmit();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
    const msg = mockSnackbarService.showError.calls.mostRecent().args[0];
    expect(msg).toContain('Record not found');
  });

  it('should show error for unknown error without errorCode', () => {
    mockApiService.updateInstrumentResult.and.returnValue(
      throwError(() => ({ error: { message: 'Something went wrong' } }))
    );
    component.onSubmit();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
  });

  it('should show error from errorResponse when errorCode is in nested errorResponse', () => {
    mockApiService.updateInstrumentResult.and.returnValue(
      throwError(() => ({
        error: { errorResponse: { errorCode: '5003', error: 'Past date' } },
      }))
    );
    component.onSubmit();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
    const msg = mockSnackbarService.showError.calls.mostRecent().args[0];
    expect(msg).toContain('5003');
  });

  // ── initForm with past effDate ───────────────────────────────────────────

  it('should adjust effDateMin when resultData has a past effective date', () => {
    const fixture2 = TestBed.createComponent(EditResultPanelComponent);
    const comp2 = fixture2.componentInstance;
    comp2.resultData = {
      ...mockResultData,
      effDate: '2020-01-01T00:00:00Z',
    };
    fixture2.detectChanges();
    expect(comp2.effDateMin.isBefore(comp2.minDate, 'day')).toBeTrue();
  });

  // ── editModeEffectiveDateValidator ───────────────────────────────────────

  it('should allow original effective date even if it looks like today', () => {
    // Form is initialised with FUTURE_EFF_DATE; the validator should accept it
    expect(component.form.get('effDate')?.hasError('effectiveDatePast')).toBeFalse();
  });

  it('should set effectiveDatePast error when effDate is changed to a past date', () => {
    component.form.get('effDate')?.setValue(moment('2020-06-01'));
    component.form.get('effDate')?.updateValueAndValidity();
    expect(component.form.get('effDate')?.hasError('effectiveDatePast')).toBeTrue();
  });

  // ── onSubmit with invalid form ───────────────────────────────────────────

  it('should not call API when form is invalid', () => {
    mockApiService.updateInstrumentResult.calls.reset();
    component.form.get('machineResultStatus')?.setValue('');
    component.onSubmit();
    expect(mockApiService.updateInstrumentResult).not.toHaveBeenCalled();
  });

  // ── onClearAll restores original values ──────────────────────────────────

  it('should restore original resultData values after onClearAll', () => {
    component.form.get('machineResultStatus')?.setValue('CHANGED');
    component.form.get('effDate')?.setValue(moment('2029-12-31'));
    component.onClearAll();
    expect(component.form.get('machineResultStatus')?.value).toBe('A+');
    expect(component.form.get('effDate')?.value.format('YYYY-MM-DD')).toBe('2027-06-15');
    expect(component.form.get('termDate')?.value).toBeNull();
  });

  // ── lastModifiedDisplay ──────────────────────────────────────────────────

  it('should display "Today" in lastModifiedDisplay when lastModifiedDate is today', () => {
    const todayStr = moment().utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    component.resultData = { ...mockResultData, lastModifiedDate: todayStr };
    // Mock convertGmtToLocal to return "now" and getChapterLocalDate to return "now"
    const now = moment().startOf('day');
    const origConvert = mockChapterTimezoneService.convertGmtToLocal;
    const origGetDate = mockChapterTimezoneService.getChapterLocalDate;
    mockChapterTimezoneService.convertGmtToLocal = () => now.clone();
    mockChapterTimezoneService.getChapterLocalDate = () => now.clone();
    expect(component.lastModifiedDisplay).toContain('Today');
    // Restore mocks
    mockChapterTimezoneService.convertGmtToLocal = origConvert;
    mockChapterTimezoneService.getChapterLocalDate = origGetDate;
  });

  it('should return empty string for lastModifiedDisplay when lastModifiedDate is null', () => {
    component.resultData = { ...mockResultData, lastModifiedDate: null as any };
    expect(component.lastModifiedDisplay).toBe('');
  });
});
