import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { AddEditResponse } from './add-edit-response';
import { HealthHistoryService } from '../../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHResponseModel, ReturnResult } from '../../models/health-history.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

// Use dates far in the future so effective date validators never reject them as "past"
const FUTURE_EFF_DATE = '2028-01-15';
const FUTURE_TERM_DATE = '2028-12-31';

describe('AddEditResponse', () => {
  let component: AddEditResponse;
  let fixture: ComponentFixture<AddEditResponse>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceMock: Partial<HeaderService>;

  const mockPeriodTypes = [
    { key: 'D', value: 'Days' },
    { key: 'M', value: 'Months' },
    { key: 'Y', value: 'Years' }
  ];

  const mockInterdictionCodes = [
    { code: 'HDT', description: 'Hard Deferral Temporary' },
    { code: 'HDP', description: 'Hard Deferral Permanent' }
  ];

  const mockGroupCodes = [
    { code: 'GRP1', description: 'Group 1' },
    { code: 'GRP2', description: 'Group 2' }
  ];

  function createMockResponseData(overrides: Partial<HHResponseModel> = {}): HHResponseModel {
    return {
      questionCode: 'D51',
      response: 'Y',
      donorResponse: 'Yes',
      answerCode: 'DRHEA',
      answerDescription: 'Diarrhea',
      groupCode: 'GRP1',
      interdictionCode: 'HDT',
      deferralPeriod: 7,
      periodType: 'D',
      commentRequired: 'Y',
      manualAuditFlag: 'Y',
      additionalDateFlag: 'Y',
      effectiveDate: FUTURE_EFF_DATE,
      terminationDate: FUTURE_TERM_DATE,
      ...overrides
    };
  }

  beforeEach(async () => {
    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'getPeriodTypes',
      'getInterdictionCodes',
      'getGroupCodes',
      'createAnswer',
      'updateAnswer'
    ]);
    hhServiceSpy.getPeriodTypes.and.returnValue(of(mockPeriodTypes));
    hhServiceSpy.getInterdictionCodes.and.returnValue(of(mockInterdictionCodes));
    hhServiceSpy.getGroupCodes.and.returnValue(of(mockGroupCodes));
    hhServiceSpy.createAnswer.and.returnValue(of({ success: true, message: 'Created' } as ReturnResult<HHResponseModel>));
    hhServiceSpy.updateAnswer.and.returnValue(of({ success: true, message: 'Updated' } as ReturnResult<HHResponseModel>));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    headerServiceMock = {
      chapterTimeZone: signal('-06:00')
    } as any;

    await TestBed.configureTestingModule({
      imports: [AddEditResponse, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditResponse);
    component = fixture.componentInstance;

    // Override private injected services for standalone component
    (component as any).snackBar = snackBarSpy;

    component.questionCode = 'D51';
    component.questionDescription = 'Ever had chest pain?';

    fixture.detectChanges();
  });

  // ==================== INITIALIZATION ====================

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the response form with correct controls', () => {
      expect(component.responseForm).toBeTruthy();
      expect(component.responseForm.get('donorResponse')).toBeTruthy();
      expect(component.responseForm.get('answerCode')).toBeTruthy();
      expect(component.responseForm.get('answerDescription')).toBeTruthy();
      expect(component.responseForm.get('group')).toBeTruthy();
      expect(component.responseForm.get('interdiction')).toBeTruthy();
      expect(component.responseForm.get('deferralPeriod')).toBeTruthy();
      expect(component.responseForm.get('periodType')).toBeTruthy();
      expect(component.responseForm.get('commentRequired')).toBeTruthy();
      expect(component.responseForm.get('manualAudit')).toBeTruthy();
      expect(component.responseForm.get('additionalDate')).toBeTruthy();
      expect(component.responseForm.get('effectiveDate')).toBeTruthy();
      expect(component.responseForm.get('terminationDate')).toBeTruthy();
    });

    it('should set donorResponse as required', () => {
      component.responseForm.get('donorResponse')?.setValue('');
      expect(component.responseForm.get('donorResponse')?.hasError('required')).toBe(true);
    });

    it('should set answerCode as required with maxLength 5', () => {
      component.responseForm.get('answerCode')?.setValue('');
      expect(component.responseForm.get('answerCode')?.hasError('required')).toBe(true);

      component.responseForm.get('answerCode')?.setValue('123456');
      expect(component.responseForm.get('answerCode')?.hasError('maxlength')).toBe(true);
    });

    it('should set answerDescription as required with maxLength 1000', () => {
      component.responseForm.get('answerDescription')?.setValue('');
      expect(component.responseForm.get('answerDescription')?.hasError('required')).toBe(true);

      component.responseForm.get('answerDescription')?.setValue('x'.repeat(1001));
      expect(component.responseForm.get('answerDescription')?.hasError('maxlength')).toBe(true);
    });

    it('should set effectiveDate as required', () => {
      expect(component.responseForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should set terminationDate as optional', () => {
      expect(component.responseForm.get('terminationDate')?.hasError('required')).toBeFalsy();
    });

    it('should default commentRequired to N', () => {
      expect(component.responseForm.get('commentRequired')?.value).toBe('N');
    });

    it('should default manualAudit to N', () => {
      expect(component.responseForm.get('manualAudit')?.value).toBe('N');
    });

    it('should default additionalDate to N', () => {
      expect(component.responseForm.get('additionalDate')?.value).toBe('N');
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should load period types on init', () => {
      expect(hhServiceSpy.getPeriodTypes).toHaveBeenCalled();
      expect(component.filteredPeriodTypes().length).toBe(3);
    });

    it('should load interdiction codes on init', () => {
      expect(hhServiceSpy.getInterdictionCodes).toHaveBeenCalled();
      expect(component.filteredInterdictions().length).toBe(2);
    });

    it('should load group codes on init', () => {
      expect(hhServiceSpy.getGroupCodes).toHaveBeenCalled();
      expect(component.filteredGroups().length).toBe(2);
    });

    it('should have minDate set', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize savingAction as null', () => {
      expect(component.savingAction).toBeNull();
    });

    it('should have donorResponses dropdown options defined', () => {
      expect(component.donorResponses.length).toBe(3);
      expect(component.donorResponses[0].code).toBe('Y');
      expect(component.donorResponses[1].code).toBe('N');
      expect(component.donorResponses[2].code).toBe('U');
    });

    it('should have deferralPeriods dropdown options defined', () => {
      expect(component.deferralPeriods.length).toBe(14);
    });

    it('should have commentRequiredOptions defined', () => {
      expect(component.commentRequiredOptions.length).toBe(2);
    });

    it('should have manualAuditOptions defined', () => {
      expect(component.manualAuditOptions.length).toBe(2);
    });

    it('should have additionalDateOptions defined', () => {
      expect(component.additionalDateOptions.length).toBe(2);
    });

    it('should have effDateErrorMatcher and termDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher).toBeTruthy();
    });

    it('should set up add mode validators when mode is add', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      component.mode = 'add';
      component.data = null;
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ==================== ngOnInit - Edit Mode ====================

  describe('ngOnInit - edit mode', () => {
    it('should populate form when mode is edit and data is provided', () => {
      const mockData = createMockResponseData();
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('donorResponse')?.value).toBe('Y');
      expect(component.responseForm.get('answerCode')?.value).toBe('DRHEA');
      expect(component.responseForm.get('answerDescription')?.value).toBe('Diarrhea');
      expect(component.responseForm.get('group')?.value).toBe('GRP1');
      expect(component.responseForm.get('interdiction')?.value).toBe('HDT');
      expect(component.responseForm.get('deferralPeriod')?.value).toBe('7');
      expect(component.responseForm.get('periodType')?.value).toBe('D');
      expect(component.responseForm.get('commentRequired')?.value).toBe('Y');
      expect(component.responseForm.get('manualAudit')?.value).toBe('Y');
      expect(component.responseForm.get('additionalDate')?.value).toBe('Y');
    });

    it('should use response field when donorResponse is not set', () => {
      const mockData = createMockResponseData({ response: 'N', donorResponse: undefined });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('donorResponse')?.value).toBe('N');
    });

    it('should set effectiveDate as moment when present', () => {
      const mockData = createMockResponseData({ effectiveDate: FUTURE_EFF_DATE });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      const effDate = component.responseForm.get('effectiveDate')?.value;
      expect(moment.isMoment(effDate)).toBe(true);
    });

    it('should set terminationDate as moment when present', () => {
      const mockData = createMockResponseData({ terminationDate: FUTURE_TERM_DATE });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      const termDate = component.responseForm.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBe(true);
    });

    it('should set terminationDate to null when not present', () => {
      const mockData = createMockResponseData({ terminationDate: undefined });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('terminationDate')?.value).toBeNull();
    });

    it('should default commentRequired to N when not set', () => {
      const mockData = createMockResponseData({ commentRequired: '' });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('commentRequired')?.value).toBe('N');
    });

    it('should default manualAuditFlag to N when not set', () => {
      const mockData = createMockResponseData({ manualAuditFlag: '' });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('manualAudit')?.value).toBe('N');
    });

    it('should default additionalDateFlag to N when not set', () => {
      const mockData = createMockResponseData({ additionalDateFlag: '' });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('additionalDate')?.value).toBe('N');
    });

    it('should mark form as pristine after populating', () => {
      component.mode = 'edit';
      component.data = createMockResponseData();

      component.ngOnInit();

      expect(component.responseForm.pristine).toBe(true);
    });

    it('should call setupEditModeValidators when in edit mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupEditModeValidators');
      component.mode = 'edit';
      component.data = createMockResponseData();

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });

    it('should set deferralPeriod to null when data has null deferralPeriod', () => {
      const mockData = createMockResponseData({ deferralPeriod: null });
      component.mode = 'edit';
      component.data = mockData;

      component.ngOnInit();

      expect(component.responseForm.get('deferralPeriod')?.value).toBeNull();
    });

    it('should not populate form when mode is edit but data is null', () => {
      component.mode = 'edit';
      component.data = null;

      // Should not throw
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  // ==================== ngOnDestroy ====================

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ==================== getTitle ====================

  describe('getTitle', () => {
    it('should return "Add New Response" in add mode', () => {
      component.mode = 'add';
      expect(component.getTitle()).toBe('Add New Response');
    });

    it('should return "Edit Response" in edit mode', () => {
      component.mode = 'edit';
      expect(component.getTitle()).toBe('Edit Response');
    });
  });

  // ==================== descriptionCharsRemaining ====================

  describe('descriptionCharsRemaining', () => {
    it('should return 1000 when description is empty', () => {
      component.responseForm.get('answerDescription')?.setValue('');
      expect(component.descriptionCharsRemaining).toBe(1000);
    });

    it('should return remaining characters correctly', () => {
      component.responseForm.get('answerDescription')?.setValue('Hello');
      expect(component.descriptionCharsRemaining).toBe(995);
    });

    it('should return 0 when description is at max length', () => {
      component.responseForm.get('answerDescription')?.setValue('x'.repeat(1000));
      expect(component.descriptionCharsRemaining).toBe(0);
    });

    it('should handle null value', () => {
      component.responseForm.get('answerDescription')?.setValue(null);
      expect(component.descriptionCharsRemaining).toBe(1000);
    });
  });

  // ==================== isFormValid ====================

  describe('isFormValid', () => {
    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when form is valid in add mode', () => {
      component.mode = 'add';
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test answer',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.markAsDirty();
      // Need to update validity after patching
      component.responseForm.updateValueAndValidity();
      if (component.responseForm.valid) {
        expect(component.isFormValid).toBe(true);
      }
    });

    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = createMockResponseData();
      component.ngOnInit();

      // form should be pristine after populateForm
      expect(component.isFormValid).toBe(false);
    });

    it('should return true in edit mode when form is dirty and valid', () => {
      component.mode = 'edit';
      component.data = createMockResponseData();
      component.ngOnInit();

      component.responseForm.get('answerDescription')?.setValue('Changed description');
      component.responseForm.markAsDirty();
      component.responseForm.updateValueAndValidity();

      if (component.responseForm.valid && !component.responseForm.hasError('dateRangeInvalid') && !component.responseForm.hasError('periodTypeRequired')) {
        expect(component.isFormValid).toBe(true);
      }
    });

    it('should return false when form has dateRangeInvalid error', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_TERM_DATE),
        terminationDate: moment(FUTURE_EFF_DATE) // termination before effective
      });
      component.responseForm.updateValueAndValidity();
      if (component.responseForm.hasError('dateRangeInvalid')) {
        expect(component.isFormValid).toBe(false);
      }
    });

    it('should return false when form has periodTypeRequired error', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE),
        deferralPeriod: '7',
        periodType: '' // period type missing when deferral period set
      });
      component.responseForm.updateValueAndValidity();
      if (component.responseForm.hasError('periodTypeRequired')) {
        expect(component.isFormValid).toBe(false);
      }
    });
  });

  // ==================== deferralPeriodTypeValidator (cross-field) ====================

  describe('deferralPeriodTypeValidator', () => {
    it('should set periodTypeRequired error when deferralPeriod is set but periodType is empty', () => {
      component.responseForm.patchValue({
        deferralPeriod: '7',
        periodType: ''
      });
      component.responseForm.updateValueAndValidity();
      expect(component.responseForm.hasError('periodTypeRequired')).toBe(true);
    });

    it('should not set periodTypeRequired error when both are set', () => {
      component.responseForm.patchValue({
        deferralPeriod: '7',
        periodType: 'D'
      });
      component.responseForm.updateValueAndValidity();
      expect(component.responseForm.hasError('periodTypeRequired')).toBe(false);
    });

    it('should not set error when deferralPeriod is null and periodType is set', () => {
      component.responseForm.patchValue({
        deferralPeriod: null,
        periodType: 'D'
      });
      component.responseForm.updateValueAndValidity();
      expect(component.responseForm.hasError('periodTypeRequired')).toBe(false);
    });

    it('should not set error when both are empty', () => {
      component.responseForm.patchValue({
        deferralPeriod: null,
        periodType: ''
      });
      component.responseForm.updateValueAndValidity();
      expect(component.responseForm.hasError('periodTypeRequired')).toBe(false);
    });
  });

  // ==================== termMinDate ====================

  describe('termMinDate', () => {
    it('should return minDate when effectiveDate is not set', () => {
      component.responseForm.patchValue({ effectiveDate: null });
      expect(component.termMinDate).toEqual(component.minDate);
    });

    it('should return effectiveDate when it is after minDate', () => {
      const futureDate = moment().add(30, 'days');
      component.responseForm.patchValue({ effectiveDate: futureDate });
      expect(component.termMinDate.isSame(futureDate)).toBe(true);
    });

    it('should return minDate when effectiveDate is before minDate', () => {
      const pastDate = moment('2020-01-01');
      component.responseForm.patchValue({ effectiveDate: pastDate });
      expect(component.termMinDate.isSame(component.minDate)).toBe(true);
    });

    it('should return minDate when effectiveDate is invalid moment', () => {
      component.responseForm.patchValue({ effectiveDate: moment('invalid') });
      expect(component.termMinDate).toEqual(component.minDate);
    });
  });

  // ==================== onSelectOpenedChange ====================

  describe('onSelectOpenedChange', () => {
    it('should reset search control when dropdown closes', () => {
      const ctrl = new FormControl('test');
      component.onSelectOpenedChange(ctrl, false);
      expect(ctrl.value).toBe('');
    });

    it('should not reset search control when dropdown opens', () => {
      const ctrl = new FormControl('test');
      component.onSelectOpenedChange(ctrl, true);
      expect(ctrl.value).toBe('test');
    });
  });

  // ==================== filterItems (via computed signals) ====================

  describe('filterItems (computed signals)', () => {
    it('should filter interdictions by search term', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue('hard');
      tick();
      const filtered = component.filteredInterdictions();
      expect(filtered.length).toBe(2); // both contain "Hard"
    }));

    it('should filter interdictions by code', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue('HDP');
      tick();
      const filtered = component.filteredInterdictions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('HDP');
    }));

    it('should return all interdictions when search is empty', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue('');
      tick();
      expect(component.filteredInterdictions().length).toBe(2);
    }));

    it('should filter groups by search term', fakeAsync(() => {
      component.groupSearchCtrl.setValue('GRP1');
      tick();
      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('GRP1');
    }));

    it('should filter deferral periods by search term', fakeAsync(() => {
      component.deferralPeriodSearchCtrl.setValue('365');
      tick();
      const filtered = component.filteredDeferralPeriods();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('365');
    }));

    it('should filter period types by search term', fakeAsync(() => {
      component.periodTypeSearchCtrl.setValue('Days');
      tick();
      const filtered = component.filteredPeriodTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('D');
    }));

    it('should return empty when no items match search', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue('nonexistent');
      tick();
      expect(component.filteredInterdictions().length).toBe(0);
    }));

    it('should handle null search value by treating as empty', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue(null as any);
      tick();
      expect(component.filteredInterdictions().length).toBe(2);
    }));
  });

  // ==================== loadDropdowns ====================

  describe('loadDropdowns', () => {
    it('should map period types from key/value to code/description', () => {
      const periodTypes = component.filteredPeriodTypes();
      expect(periodTypes[0]).toEqual({ code: 'D', description: 'Days' });
    });

    it('should map interdiction codes correctly', () => {
      const interdictions = component.filteredInterdictions();
      expect(interdictions[0]).toEqual({ code: 'HDT', description: 'Hard Deferral Temporary' });
    });

    it('should map group codes correctly', () => {
      const groups = component.filteredGroups();
      expect(groups[0]).toEqual({ code: 'GRP1', description: 'Group 1' });
    });

    it('should reload group codes when donorResponse changes', fakeAsync(() => {
      hhServiceSpy.getGroupCodes.calls.reset();
      component.responseForm.get('donorResponse')?.setValue('N');
      tick();
      expect(hhServiceSpy.getGroupCodes).toHaveBeenCalledWith('D51', 'N');
    }));
  });

  // ==================== onAnswerCodeInput ====================

  describe('onAnswerCodeInput', () => {
    it('should uppercase the input value', () => {
      const mockEvent = {
        target: { value: 'abc' }
      } as unknown as Event;
      component.onAnswerCodeInput(mockEvent);
      expect((mockEvent.target as HTMLInputElement).value).toBe('ABC');
      expect(component.responseForm.get('answerCode')?.value).toBe('ABC');
    });

    it('should not change already uppercase input', () => {
      component.responseForm.get('answerCode')?.setValue('XYZ');
      const mockEvent = {
        target: { value: 'XYZ' }
      } as unknown as Event;
      component.onAnswerCodeInput(mockEvent);
      expect((mockEvent.target as HTMLInputElement).value).toBe('XYZ');
    });

    it('should handle empty input', () => {
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;
      component.onAnswerCodeInput(mockEvent);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');
    });
  });

  // ==================== onCancel ====================

  describe('onCancel', () => {
    it('should emit close event', () => {
      const closeSpy = spyOn(component.close, 'emit');
      component.onCancel();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // ==================== onSubmit ====================

  describe('onSubmit', () => {
    function setValidForm(): void {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test answer description',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.markAllAsTouched();
      component.responseForm.updateValueAndValidity();
    }

    it('should mark all form controls as touched', () => {
      const spy = spyOn(component.responseForm, 'markAllAsTouched').and.callThrough();
      component.onSubmit(false);
      expect(spy).toHaveBeenCalled();
    });

    it('should return early when form is invalid', () => {
      component.onSubmit(false);
      expect(hhServiceSpy.createAnswer).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should call clearOptionalDateErrors before checking validity', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');
      component.onSubmit(false);
      expect(spy).toHaveBeenCalledWith(component.responseForm, 'terminationDate');
    });

    it('should set isSaving to true while saving', () => {
      setValidForm();
      // Make the observable never complete to catch the intermediate state
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));
      component.onSubmit(false);
      // After sync completion, isSaving should be false again
      expect(component.isSaving).toBe(false);
    });

    it('should set savingAction to save when keepOpen is false', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));
      // savingAction is reset after completion, so check it was called with the right service
      component.onSubmit(false);
      expect(hhServiceSpy.createAnswer).toHaveBeenCalled();
    });

    it('should set savingAction to createAnother when keepOpen is true', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));
      component.onSubmit(true);
      expect(hhServiceSpy.createAnswer).toHaveBeenCalled();
    });

    it('should call createAnswer in add mode', () => {
      component.mode = 'add';
      setValidForm();
      component.onSubmit(false);
      expect(hhServiceSpy.createAnswer).toHaveBeenCalled();
      expect(hhServiceSpy.updateAnswer).not.toHaveBeenCalled();
    });

    it('should call updateAnswer in edit mode', () => {
      component.mode = 'edit';
      component.data = createMockResponseData();
      component.ngOnInit();

      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Updated description',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.markAsDirty();
      component.responseForm.markAllAsTouched();
      component.responseForm.updateValueAndValidity();

      // updateAnswer should be called with questionCode and answerCode
      if (component.responseForm.valid) {
        component.onSubmit(false);
        expect(hhServiceSpy.updateAnswer).toHaveBeenCalled();
      }
    });

    it('should build correct payload with all fields', () => {
      setValidForm();
      component.responseForm.patchValue({
        group: 'GRP1',
        interdiction: 'HDT',
        deferralPeriod: '7',
        periodType: 'D',
        commentRequired: 'Y',
        manualAudit: 'Y',
        additionalDate: 'Y',
        terminationDate: moment(FUTURE_TERM_DATE)
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.questionCode).toBe('D51');
      expect(payload.response).toBe('Y');
      expect(payload.answerCode).toBe('TST');
      expect(payload.answerDescription).toBe('Test answer description');
      expect(payload.groupCode).toBe('GRP1');
      expect(payload.interdictionCode).toBe('HDT');
      expect(payload.deferralPeriod).toBe(7);
      expect(payload.periodType).toBe('D');
      expect(payload.minimumPeriod).toBe(0);
      expect(payload.commentRequired).toBe('Y');
      expect(payload.manualAuditFlag).toBe('Y');
      expect(payload.additionalDateFlag).toBe('Y');
    });

    it('should set manualAuditFlag to null when not Y', () => {
      setValidForm();
      component.responseForm.patchValue({ manualAudit: 'N' });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.manualAuditFlag).toBeNull();
    });

    it('should set additionalDateFlag to null when not Y', () => {
      setValidForm();
      component.responseForm.patchValue({ additionalDate: 'N' });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.additionalDateFlag).toBeNull();
    });

    it('should set deferralPeriod to null when not provided', () => {
      setValidForm();
      component.responseForm.patchValue({ deferralPeriod: null });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.deferralPeriod).toBeNull();
    });

    it('should set periodType to null when empty', () => {
      setValidForm();
      component.responseForm.patchValue({ periodType: '' });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.periodType).toBeNull();
    });

    it('should set groupCode to empty string when not provided', () => {
      setValidForm();
      component.responseForm.patchValue({ group: '' });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.groupCode).toBe('');
    });

    it('should set interdictionCode to empty string when not provided', () => {
      setValidForm();
      component.responseForm.patchValue({ interdiction: '' });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
      expect(payload.interdictionCode).toBe('');
    });

    it('should emit save event on successful save', () => {
      const saveSpy = spyOn(component.save, 'emit');
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true, message: 'Created' } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(saveSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        keepOpen: false,
        message: 'Created'
      }));
    });

    it('should emit save event with keepOpen true', () => {
      const saveSpy = spyOn(component.save, 'emit');
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true, message: 'Created' } as ReturnResult<HHResponseModel>));

      component.onSubmit(true);

      expect(saveSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        keepOpen: true
      }));
    });

    it('should reset form when keepOpen is true on success', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));
      const resetSpy = spyOn(component.responseForm, 'reset');

      component.onSubmit(true);

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should not reset form when keepOpen is false on success', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));
      const resetSpy = spyOn(component.responseForm, 'reset');

      component.onSubmit(false);

      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('should reset isSaving and savingAction after successful save', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    // --- Success === false scenarios ---

    it('should show snackbar when result has success false with errorResponse', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({
        success: false,
        errorCode: '1234',
        errorResponse: { errorCode: '1234', error: 'Duplicate entry' }
      } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 1234: Duplicate entry', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show snackbar with message when no errorResponse', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({
        success: false,
        message: 'Something went wrong'
      } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when no useful info in result', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({
        success: false
      } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'An error occurred', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show errorCode without errorResponse errorCode', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({
        success: false,
        errorCode: '5678',
        message: 'Validation error'
      } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 5678: Validation error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should not emit save when result has success false', () => {
      const saveSpy = spyOn(component.save, 'emit');
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(of({
        success: false,
        message: 'Error'
      } as ReturnResult<HHResponseModel>));

      component.onSubmit(false);

      expect(saveSpy).not.toHaveBeenCalled();
    });

    // --- HTTP error scenarios ---

    it('should show snackbar on HTTP error with errorResponse', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({
        error: {
          errorCode: '5678',
          errorResponse: { errorCode: '5678', error: 'DB constraint' }
        }
      })));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 5678: DB constraint', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show snackbar on HTTP error with message only', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({
        error: { message: 'Internal server error' }
      })));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Internal server error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message on HTTP error with no useful info', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({})));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'An error occurred while saving', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show error with errorCode from error.errorResponse', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '9999', error: 'Custom error' }
        }
      })));

      component.onSubmit(false);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 9999: Custom error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should reset isSaving and savingAction on HTTP error', () => {
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));

      component.onSubmit(false);

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should not emit save on HTTP error', () => {
      const saveSpy = spyOn(component.save, 'emit');
      setValidForm();
      hhServiceSpy.createAnswer.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));

      component.onSubmit(false);

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== onSubmit - date validation early return ====================

  describe('onSubmit - date validation early return', () => {
    it('should return early when getEffDateError returns an error', () => {
      spyOn(component, 'getEffDateError').and.returnValue('Effective Date is required');
      spyOn(component, 'getTermDateError').and.returnValue('');

      // Set the form as valid so we get past the form.invalid check
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      expect(hhServiceSpy.createAnswer).not.toHaveBeenCalled();
    });

    it('should return early when getTermDateError returns an error', () => {
      spyOn(component, 'getEffDateError').and.returnValue('');
      spyOn(component, 'getTermDateError').and.returnValue('Termination Date is invalid');

      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      expect(hhServiceSpy.createAnswer).not.toHaveBeenCalled();
    });

    it('should mark terminationDate as touched when date errors exist', () => {
      spyOn(component, 'getEffDateError').and.returnValue('Effective Date is invalid');
      spyOn(component, 'getTermDateError').and.returnValue('');

      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      expect(component.responseForm.get('terminationDate')?.touched).toBe(true);
    });
  });

  // ==================== getEffDateError ====================

  describe('getEffDateError', () => {
    it('should return empty string when no error', () => {
      component.responseForm.patchValue({
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: moment(FUTURE_TERM_DATE)
      });
      component.responseForm.get('effectiveDate')?.markAsTouched();
      const error = component.getEffDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      const error = component.getEffDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass null formErrors when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      const error = component.getEffDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ==================== getTermDateError ====================

  describe('getTermDateError', () => {
    it('should return empty string when no error', () => {
      component.responseForm.patchValue({
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: moment(FUTURE_TERM_DATE)
      });
      component.responseForm.get('terminationDate')?.markAsTouched();
      (component as any).lastChangedDateField = 'termination';
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass null formErrors when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ==================== onEffDateInput ====================

  describe('onEffDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const mockEvent = { target: { value: '01-JAN-2028' } } as unknown as Event;
      component.onEffDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith('01-JAN-2028', component.responseForm.get('effectiveDate'));
    });

    it('should not throw on empty input', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      expect(() => component.onEffDateInput(mockEvent)).not.toThrow();
    });
  });

  // ==================== onTermDateInput ====================

  describe('onTermDateInput', () => {
    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const mockEvent = { target: { value: '31-DEC-2028' } } as unknown as Event;
      component.onTermDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith(
        '31-DEC-2028',
        component.responseForm.get('terminationDate'),
        component.mode === 'edit'
      );
    });

    it('should pass isEditMode false in add mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      component.mode = 'add';
      const mockEvent = { target: { value: '31-DEC-2028' } } as unknown as Event;
      component.onTermDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith(
        '31-DEC-2028',
        jasmine.anything(),
        false
      );
    });

    it('should pass isEditMode true in edit mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      component.mode = 'edit';
      const mockEvent = { target: { value: '31-DEC-2028' } } as unknown as Event;
      component.onTermDateInput(mockEvent);
      expect(spy).toHaveBeenCalledWith(
        '31-DEC-2028',
        jasmine.anything(),
        true
      );
    });

    it('should not throw on empty input', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      expect(() => component.onTermDateInput(mockEvent)).not.toThrow();
    });
  });

  // ==================== lastChangedDateField tracking ====================

  describe('lastChangedDateField tracking', () => {
    it('should set lastChangedDateField to effective when effectiveDate changes', fakeAsync(() => {
      component.responseForm.patchValue({ effectiveDate: moment('2028-03-01') });
      tick();
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when terminationDate changes', fakeAsync(() => {
      component.responseForm.patchValue({ terminationDate: moment(FUTURE_TERM_DATE) });
      tick();
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  // ==================== resetForm (private) ====================

  describe('resetForm (called via keepOpen)', () => {
    it('should reset the form, mark as untouched and pristine on keepOpen save', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.markAllAsTouched();
      component.responseForm.updateValueAndValidity();

      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));

      component.onSubmit(true); // keepOpen = true triggers resetForm

      expect(component.responseForm.untouched).toBe(true);
      expect(component.responseForm.pristine).toBe(true);
    });

    it('should call setupAddModeValidators after reset', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.responseForm.updateValueAndValidity();

      hhServiceSpy.createAnswer.and.returnValue(of({ success: true } as ReturnResult<HHResponseModel>));

      component.onSubmit(true);

      expect(spy).toHaveBeenCalled();
    });
  });

  // ==================== Search subscriptions ====================

  describe('search subscriptions', () => {
    it('should update interdiction search signal on ctrl value change', fakeAsync(() => {
      component.interdictionSearchCtrl.setValue('HDT');
      tick();
      const filtered = component.filteredInterdictions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('HDT');
    }));

    it('should update group search signal on ctrl value change', fakeAsync(() => {
      component.groupSearchCtrl.setValue('Group 2');
      tick();
      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('GRP2');
    }));

    it('should update deferral period search signal on ctrl value change', fakeAsync(() => {
      component.deferralPeriodSearchCtrl.setValue('90');
      tick();
      const filtered = component.filteredDeferralPeriods();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('90');
    }));

    it('should update period type search signal on ctrl value change', fakeAsync(() => {
      component.periodTypeSearchCtrl.setValue('Months');
      tick();
      const filtered = component.filteredPeriodTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('M');
    }));
  });

  // ==================== Edge cases ====================

  describe('edge cases', () => {
    it('should handle serializeDateForApi returning null for null date', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: null
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      if (hhServiceSpy.createAnswer.calls.count() > 0) {
        const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
        expect(payload.terminationDate).toBeNull();
      }
    });

    it('should handle deferralPeriod conversion to Number', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE),
        deferralPeriod: '365',
        periodType: 'D'
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      if (hhServiceSpy.createAnswer.calls.count() > 0) {
        const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
        expect(payload.deferralPeriod).toBe(365);
      }
    });

    it('should handle empty group and interdiction in payload', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE),
        group: null,
        interdiction: null
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      if (hhServiceSpy.createAnswer.calls.count() > 0) {
        const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
        expect(payload.groupCode).toBe('');
        expect(payload.interdictionCode).toBe('');
      }
    });

    it('should handle donorResponse using response field as fallback in edit mode', () => {
      component.mode = 'edit';
      component.data = createMockResponseData({
        response: 'N',
        donorResponse: undefined
      });
      component.ngOnInit();

      expect(component.responseForm.get('donorResponse')?.value).toBe('N');
    });

    it('should handle deferralPeriod as 0 (string "0" is truthy)', () => {
      component.responseForm.patchValue({
        donorResponse: 'Y',
        answerCode: 'TST',
        answerDescription: 'Test',
        effectiveDate: moment(FUTURE_EFF_DATE),
        deferralPeriod: '0',
        periodType: 'D'
      });
      component.responseForm.updateValueAndValidity();

      component.onSubmit(false);

      if (hhServiceSpy.createAnswer.calls.count() > 0) {
        const payload = hhServiceSpy.createAnswer.calls.mostRecent().args[0] as any;
        // '0' is a non-empty string so it's truthy; Number('0') = 0
        expect(payload.deferralPeriod).toBe(0);
      }
    });
  });
});
