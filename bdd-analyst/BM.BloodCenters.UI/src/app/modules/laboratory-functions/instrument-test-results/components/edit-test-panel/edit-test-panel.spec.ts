import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { EditTestPanelComponent } from './edit-test-panel';
import { InstrumentTestResultsApiService } from '../../services/instrument-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { InstrumentTestDetailDto } from '../../models/instrument-test-results.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('EditTestPanelComponent', () => {
  let component: EditTestPanelComponent;
  let fixture: ComponentFixture<EditTestPanelComponent>;
  let apiServiceSpy: jasmine.SpyObj<InstrumentTestResultsApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const FUTURE_EFF_DATE = '2027-06-15T00:00:00Z';

  const mockTestData: InstrumentTestDetailDto = {
    chapterId:     'TEST',
    machineId:     'MACH1',
    testId:        'HIVAB',
    machineTestId: 'MT01',
    effDate:       FUTURE_EFF_DATE,
    termDate:      null,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('InstrumentTestResultsApiService', ['updateInstrumentTest']);
    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'isChapterLocalDateAvailable',
      'convertGmtToLocal',
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.updateInstrumentTest.and.returnValue(of({ ...mockTestData }));
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: any) => m.clone());

      TestBed.configureTestingModule({
      imports: [EditTestPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: InstrumentTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });

    

      apiServiceSpy.updateInstrumentTest.calls.reset();

      headerServiceSpy.getCurrentChapterId.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();

      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.calls.reset();
      chapterTimezoneServiceSpy.convertGmtToLocal.calls.reset();

      apiServiceSpy.updateInstrumentTest.and.returnValue(of({ ...mockTestData }));
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);

      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    fixture = TestBed.createComponent(EditTestPanelComponent);
    component = fixture.componentInstance;
    component.testData = { ...mockTestData };
    component.machineName = 'Test Machine';
    fixture.detectChanges();

    });

  /* ── Initialisation ───────────────────────────────────────── */

  describe('initialisation', () => {
    it('should initialise effDate form control from testData', () => {
      const effDate = component.form.get('effDate')?.value;
      expect(effDate).toBeTruthy();
      expect(effDate.format('YYYY-MM-DD')).toBe('2027-06-15');
    });
  });

  /* ── Form pre-fill ────────────────────────────────────────── */

  describe('form pre-fill', () => {
    it('should pre-fill machineTestId from testData', () => {
      expect(component.form.get('machineTestId')?.value).toBe('MT01');
    });

    it('should not have instrTestRes control', () => {
      expect(component.form.get('instrTestRes')).toBeNull();
    });

    it('should not have ltTestId1 control', () => {
      expect(component.form.get('ltTestId1')).toBeNull();
    });

    it('should not have ltRes1 control', () => {
      expect(component.form.get('ltRes1')).toBeNull();
    });

    it('should have effDate as a form control with correct initial value', () => {
      const effDate = component.form.get('effDate');
      expect(effDate).toBeTruthy();
      expect(effDate?.value?.format('YYYY-MM-DD')).toBe('2027-06-15');
    });

    it('should set termDate to null when testData.termDate is null', () => {
      expect(component.form.get('termDate')?.value).toBeNull();
    });
  });

  /* ── onCancel ─────────────────────────────────────────────── */
  /* ── onSubmit — validation ────────────────────────────────── */

  describe('onSubmit — form invalid', () => {
    it('should set submitted to true', () => {
      component.form.get('machineTestId')?.setValue('A'.repeat(51));
      component.onSubmit();
      expect(component.submitted()).toBeTrue();
    });
  });

  /* ── onSubmit — success ───────────────────────────────────── */

  describe('onSubmit — valid form, success', () => {
    it('should call updateInstrumentTest with composite PK from testData', () => {
      component.onSubmit();
      expect(apiServiceSpy.updateInstrumentTest).toHaveBeenCalledWith(
        'TEST', 'MACH1', 'HIVAB', jasmine.any(Object)
      );
    });

    it('should include machineTestId in dto', () => {
      component.onSubmit();
      const dto = apiServiceSpy.updateInstrumentTest.calls.mostRecent().args[3];
      expect(dto.machineTestId).toBe('MT01');
    });

    it('should pass trimmed machineTestId in dto', () => {
      component.form.get('machineTestId')?.setValue('  MT01  ');
      component.onSubmit();
      const dto = apiServiceSpy.updateInstrumentTest.calls.mostRecent().args[3];
      expect(dto.machineTestId).toBe('MT01');
    });

    it('should not include ltSchTestId1 or ltSchRes1 in the dto', () => {
      component.onSubmit();
      const dto = apiServiceSpy.updateInstrumentTest.calls.mostRecent().args[3];
      expect((dto as any).ltSchTestId1).toBeUndefined();
      expect((dto as any).ltSchRes1).toBeUndefined();
    });

    it('should emit saveSuccess on success', () => {
      let emitted = false;
      component.saveSuccess.subscribe(() => { emitted = true; });
      component.onSubmit();
      expect(emitted).toBeTrue();
    });

    it('should emit closePanel on success', () => {
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });
      component.onSubmit();
      expect(emitted).toBeTrue();
    });

    it('should set saving to false on success', () => {
      component.onSubmit();
      expect(component.saving()).toBeFalse();
    });
  });

  /* ── onSubmit — error ─────────────────────────────────────── */

  describe('onSubmit — API error', () => {
    it('should set saving to false on error', () => {
      apiServiceSpy.updateInstrumentTest.and.returnValue(throwError(() => new Error('Server down')));
      component.onSubmit();
      expect(component.saving()).toBeFalse();
    });

    it('should not emit saveSuccess on error', () => {
      let emitted = false;
      component.saveSuccess.subscribe(() => { emitted = true; });
      apiServiceSpy.updateInstrumentTest.and.returnValue(throwError(() => new Error('fail')));
      component.onSubmit();
      expect(emitted).toBeFalse();
    });
  });

  /* ── onClearAll ───────────────────────────────────────────── */

  describe('onClearAll', () => {
    beforeEach(() => {
      component.form.get('machineTestId')?.setValue('CHANGED');
      component.form.get('termDate')?.setValue(moment('2030-01-01'));
      component.onClearAll();
    });

    it('should set submitted to false', () => {
      component.submitted.set(true);
      component.onClearAll();
      expect(component.submitted()).toBeFalse();
    });

    it('should restore machineTestId to original value', () => {
      component.form.get('machineTestId')?.setValue('CHANGED');
      component.onClearAll();
      expect(component.form.get('machineTestId')?.value).toBe('MT01');
    });
  });

  /* ── elementId / errorId helpers ────────────────────────────── */

  describe('elementId / errorId helpers', () => {
    it('should produce an id containing the component prefix and the given name', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('edit-test-panel');
      expect(id).toContain('test');
    });

    it('should produce an error id containing "error"', () => {
      const id = (component as any).errorId('field');
      expect(id).toContain('error');
    });
  });

  /* ── terminationDateFilter ──────────────────────────────────── */

  describe('terminationDateFilter', () => {
    it('should return true for null', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true for a future date', () => {
      expect(component.terminationDateFilter(moment('2030-01-01'))).toBeTrue();
    });

    it('should return false for a date before effDate', () => {
      component.form.get('effDate')?.setValue(moment('2028-01-01'));
      expect(component.terminationDateFilter(moment('2027-06-01'))).toBeFalse();
    });

    it('should return false for a date before minDate', () => {
      expect(component.terminationDateFilter(moment('1900-01-01'))).toBeFalse();
    });
  });

  /* ── hasDirtyInvalidControls ────────────────────────────────── */

  describe('hasDirtyInvalidControls', () => {
    it('should return false for a pristine valid form', () => {
      expect(component.hasDirtyInvalidControls).toBeFalse();
    });

    it('should return true when a control is dirty and invalid', () => {
      component.form.get('machineTestId')?.setValue('');
      component.form.get('machineTestId')?.markAsDirty();
      expect(component.hasDirtyInvalidControls).toBeTrue();
    });

    it('should return true when form has errors and a date control is dirty', () => {
      component.form.get('effDate')?.markAsDirty();
      component.form.setErrors({ dateRange: true });
      expect(component.hasDirtyInvalidControls).toBeTrue();
    });
  });

  /* ── onEffectiveDateInput ───────────────────────────────────── */

  describe('onEffectiveDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      component.onEffectiveDateInput({ target: { value: '15-Jun-2027' } } as any);
      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalled();
    });
  });

  /* ── onTerminationDateInput ─────────────────────────────────── */

  describe('onTerminationDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      component.onTerminationDateInput({ target: { value: '31-Dec-2027' } } as any);
      expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalled();
    });
  });

  /* ── getEffectiveDateError ──────────────────────────────────── */

  describe('getEffectiveDateError', () => {
    it('should return a string after changing effDate', () => {
      component.form.get('effDate')?.setValue(moment('2020-01-01'));
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });
  });

  /* ── getTerminationDateError ────────────────────────────────── */

  describe('getTerminationDateError', () => {
    it('should return a string after changing termDate', () => {
      component.form.get('termDate')?.setValue(moment('2020-01-01'));
      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });
  });

  /* ── handleApiError ─────────────────────────────────────────── */

  describe('handleApiError', () => {
    it('should show "Termination date cannot be in the past" for error code 3115', () => {
      apiServiceSpy.updateInstrumentTest.and.returnValue(
        throwError(() => ({ error: { errorCode: '3115' } }))
      );
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Termination date cannot be in the past')
      );
    });

    it('should show "Record not found" for error code 5429', () => {
      apiServiceSpy.updateInstrumentTest.and.returnValue(
        throwError(() => ({ error: { errorCode: '5429' } }))
      );
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Record not found')
      );
    });

    it('should show fallback message for errors with no error code', () => {
      apiServiceSpy.updateInstrumentTest.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to update instrument test')
      );
    });

    it('should handle nested errorResponse structure', () => {
      apiServiceSpy.updateInstrumentTest.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { errorCode: '5003', error: 'Past date' } }
        }))
      );
      component.onSubmit();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Effective date cannot be in the past')
      );
    });
  });

  /* ── initForm with past effDate ─────────────────────────────── */

  describe('initForm with past effDate', () => {
    it('should adjust effDateMin when effDate is in the past', () => {
      const pastFixture = TestBed.createComponent(EditTestPanelComponent);
      const pastComponent = pastFixture.componentInstance;
      pastComponent.testData = { ...mockTestData, effDate: '2020-01-01T00:00:00Z' };
      pastComponent.machineName = 'Test Machine';
      pastFixture.detectChanges();
      expect(pastComponent.effDateMin.isBefore(moment().startOf('day'))).toBeTrue();
    });
  });

  /* ── editModeEffectiveDateValidator ─────────────────────────── */

  describe('editModeEffectiveDateValidator', () => {
    it('should allow the original effective date without error', () => {
      const effControl = component.form.get('effDate');
      expect(effControl?.errors?.['effectiveDatePast']).toBeFalsy();
    });

    it('should reject a non-original past date', () => {
      const effControl = component.form.get('effDate');
      effControl?.setValue(moment('2020-06-01'));
      expect(effControl?.errors?.['effectiveDatePast']).toBeTrue();
    });
  });

  /* ── onSubmit — invalid form prevents API call ──────────────── */

  describe('onSubmit — invalid form prevents API call', () => {
    it('should not call API and should set submitted to true', () => {
      component.form.get('machineTestId')?.setValue('');
      apiServiceSpy.updateInstrumentTest.calls.reset();
      component.onSubmit();
      expect(component.submitted()).toBeTrue();
      expect(apiServiceSpy.updateInstrumentTest).not.toHaveBeenCalled();
    });
  });

  /* ── lastModifiedDisplay ────────────────────────────────────── */

  describe('lastModifiedDisplay', () => {
    it('should return a string containing "Last Modified" for a valid date', () => {
      const f = TestBed.createComponent(EditTestPanelComponent);
      const c = f.componentInstance;
      c.testData = { ...mockTestData, lastModifiedDate: '2026-07-15T10:30:00Z' };
      c.machineName = 'Test Machine';
      f.detectChanges();
      expect(c.lastModifiedDisplay).toContain('Last Modified');
    });

    it('should return empty string when lastModifiedDate is null', () => {
      component.testData = { ...mockTestData, lastModifiedDate: null };
      expect(component.lastModifiedDisplay).toBe('');
    });
  });

  /* ── onCancel ───────────────────────────────────────────────── */

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });
});
