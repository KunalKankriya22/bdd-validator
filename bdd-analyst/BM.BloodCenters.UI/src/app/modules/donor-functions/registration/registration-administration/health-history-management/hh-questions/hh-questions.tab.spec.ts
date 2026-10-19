import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';

import { TranslateModule } from '@ngx-translate/core';
import { HHQuestionsTab } from './hh-questions.tab';
import { HealthHistoryService } from '../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHQuestionModel } from '../models/health-history.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('HHQuestionsTab', () => {
  let component: HHQuestionsTab;
  let fixture: ComponentFixture<HHQuestionsTab>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let headerServiceMock: Partial<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockQuestions: HHQuestionModel[] = [
    {
      questionCode: 'D52', refCode: '5', questionDescription: 'Ever had chest pain?',
      gender: 'M', readMoreFlag: 'Y', manualAuditFlag: 'Y', manualAuditHistFlag: '',
      validateLookBackDate: 'Yes', periodTypeForLookBack: 'Days', periodNumberForLookBack: 12,
      effectiveDate: '2024-01-01', terminationDate: '2027-12-31'
    },
    {
      questionCode: 'D53', refCode: '8', questionDescription: 'Family history of heart disease?',
      gender: 'A', readMoreFlag: 'N', manualAuditFlag: '', manualAuditHistFlag: '',
      validateLookBackDate: 'No', periodTypeForLookBack: '', periodNumberForLookBack: null,
      effectiveDate: '2020-01-15', terminationDate: '2030-12-31'
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'searchQuestions', 'getQuestionByCode', 'createQuestion', 'updateQuestion', 'getGenderDropdown', 'getPeriodTypes'
    ]);
    hhServiceSpy.searchQuestions.and.returnValue(of({ data: mockQuestions, totalRecords: 2 }));
    hhServiceSpy.getQuestionByCode.and.returnValue(of(mockQuestions[0]));
    hhServiceSpy.getGenderDropdown.and.returnValue(of([
      { code: 'M', description: 'Male' },
      { code: 'F', description: 'Female' },
      { code: 'A', description: 'All' }
    ]));
    hhServiceSpy.getPeriodTypes.and.returnValue(of([
      { key: 'Days', value: 'Days' },
      { key: 'Months', value: 'Months' },
      { key: 'Years', value: 'Years' }
    ]));

    snackBarSpy = createMockMatSnackBar();

    headerServiceMock = {
      chapterTimeZone: signal('-06:00'),
      chapterChanged$: chapterChanged$.asObservable()
    } as any;



      TestBed.configureTestingModule({
      imports: [HHQuestionsTab, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        Overlay
      ]
    });


    


      hhServiceSpy.searchQuestions.calls.reset();
      hhServiceSpy.getQuestionByCode.calls.reset();
      hhServiceSpy.createQuestion.calls.reset();
      hhServiceSpy.updateQuestion.calls.reset();
      hhServiceSpy.getGenderDropdown.calls.reset();
      hhServiceSpy.getPeriodTypes.calls.reset();

      hhServiceSpy.searchQuestions.and.returnValue(of({ data: mockQuestions, totalRecords: 2 }));
      hhServiceSpy.getQuestionByCode.and.returnValue(of(mockQuestions[0]));
      hhServiceSpy.getPeriodTypes.and.returnValue(of([
        { key: 'Days', value: 'Days' },
        { key: 'Months', value: 'Months' },
        { key: 'Years', value: 'Years' }
      ]));


    fixture = TestBed.createComponent(HHQuestionsTab);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('initialization', () => {
    it('should load questions on init', () => {
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
      expect(component.questions().length).toBe(2);
    });

    it('should load gender dropdown on init', () => {
      expect(hhServiceSpy.getGenderDropdown).toHaveBeenCalled();
      expect(component.sexOptions.length).toBe(3);
    });



    it('should have required validators on questionCode', () => {
      component.questionForm.get('questionCode')?.setValue('');
      component.questionForm.get('questionCode')?.updateValueAndValidity();
      expect(component.questionForm.get('questionCode')?.hasError('required')).toBe(true);
    });
  });

  describe('selectQuestion', () => {


    it('should fallback to list data if getQuestionByCode fails', () => {
      hhServiceSpy.getQuestionByCode.and.returnValue(throwError(() => new Error('fail')));
      component.selectQuestion(mockQuestions[1]);
      expect(component.selectedQuestion?.questionCode).toBe('D53');
    });

    it('should map manualAuditFlag null to N for display', () => {
      const question = { ...mockQuestions[0], manualAuditFlag: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('manualAuditFlag')?.value).toBe('N');
    });

    it('should map manualAuditFlag Y to Y for display', () => {
      const question = { ...mockQuestions[0], manualAuditFlag: 'Y' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('manualAuditFlag')?.value).toBe('Y');
    });
  });

  describe('onAddNew', () => {
    it('should set add mode and clear form', () => {
      component.onAddNew();
      expect(component.isAddMode).toBe(true);
      expect(component.selectedQuestion).toBeNull();
      expect(component.questionForm.get('questionCode')?.value).toBeNull();
      expect(component.questionForm.get('gender')?.value).toBeNull();
    });

    it('should clear all dropdowns (no preselection)', () => {
      component.onAddNew();
      expect(component.questionForm.get('readMoreFlag')?.value).toBeNull();
      expect(component.questionForm.get('manualAuditFlag')?.value).toBeNull();
      expect(component.questionForm.get('validateLookBackDate')?.value).toBeNull();
    });
  });

  describe('onCancel', () => {


    it('should repopulate form in edit mode', () => {
      component.selectQuestion(mockQuestions[0]);
      component.questionForm.get('questionCode')?.setValue('CHANGED');
      component.onCancel();

      expect(component.questionForm.get('questionCode')?.value).toBe('D52');
    });
  });

  describe('onSave', () => {


    it('should call createQuestion in add mode', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      expect(component.questionForm.valid).toBe(true);
      component.onSave();
      tick();

      expect(hhServiceSpy.createQuestion).toHaveBeenCalled();
    }));





    it('should keep manualAuditFlag Y in payload', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();
      component.questionForm.get('manualAuditFlag')?.setValue('Y');
      component.onSave();
      tick();

      const payload = hhServiceSpy.createQuestion.calls.mostRecent().args[0];
      expect(payload.manualAuditFlag).toBe('Y');
    }));

    it('should call showErrorSnackbar with error response format', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      const errorResponse = {
        errorCode: '0319',
        errorResponse: { errorCode: '0319', error: 'Duplicate entry not allowed' }
      };

      (component as any).showErrorSnackbar(errorResponse);

      expect(openSpy).toHaveBeenCalledWith(
        'Error: 0319: Duplicate entry not allowed', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should call showErrorSnackbar with message fallback when no errorResponse', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      (component as any).showErrorSnackbar({ message: 'Something went wrong' });

      expect(openSpy).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should call showErrorSnackbar with default message when response is null', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      (component as any).showErrorSnackbar(null);

      expect(openSpy).toHaveBeenCalledWith(
        'An error occurred while saving', 'DISMISS', jasmine.any(Object)
      );
    });
  });
  describe('onSearch', () => {
    it('should set searchText and reload questions', () => {
      const callsBefore = hhServiceSpy.searchQuestions.calls.count();
      component.onSearch('chest');
      expect(component.searchText).toBe('chest');
      expect(hhServiceSpy.searchQuestions.calls.count()).toBeGreaterThan(callsBefore);
    });


  });

  describe('filter management', () => {
    it('should apply filters and reload questions', () => {
      const callsBefore = hhServiceSpy.searchQuestions.calls.count();
      component.applyFilters({ sex: 'M' });

      expect(component.appliedFilters?.sex).toBe('M');
      expect(hhServiceSpy.searchQuestions.calls.count()).toBeGreaterThan(callsBefore);
    });



    it('should remove filter chip by key', () => {
      component.applyFilters({ sex: 'M', validateLookBackDate: 'Yes' });
      hhServiceSpy.searchQuestions.calls.reset();

      component.onRemoveFilterChip('sex');

      expect(component.appliedFilters?.sex).toBeUndefined();
      expect(component.appliedFilters?.validateLookBackDate).toBe('Yes');
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    });





    it('should remove date filter with period', () => {
      component.applyFilters({
        sex: 'M',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01'
      });
      component.onRemoveFilterChip('effectiveDate');

      expect(component.appliedFilters?.effectiveDate).toBeUndefined();
      expect(component.appliedFilters?.effectiveDatePeriod).toBeUndefined();
    });
  });

  describe('chapter change', () => {
    it('should reset state and reload on chapter change', () => {
      component.applyFilters({ sex: 'M' });
      component.searchText = 'test';
      component.isAddMode = true;
      const callsBefore = hhServiceSpy.searchQuestions.calls.count();

      chapterChanged$.next();

      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.isAddMode).toBe(false);
      expect(hhServiceSpy.searchQuestions.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('termMinDate', () => {
    it('should return minDate when no effective date', () => {
      component.questionForm.get('effectiveDate')?.setValue(null);
      expect(component.termMinDate).toBe(component.minDate);
    });

    it('should return effective date when after minDate', () => {
      const futureDate = moment().add(1, 'year');
      component.questionForm.get('effectiveDate')?.setValue(futureDate);
      expect(component.termMinDate.isSame(futureDate)).toBe(true);
    });
  });

  describe('getEffectiveDateDisplay', () => {


    it('should format date for display', () => {
      component.questionForm.get('effectiveDate')?.setValue(moment('2024-03-15'));
      const display = component.getEffectiveDateDisplay();
      expect(display).not.toBe('-');
      expect(display.length).toBeGreaterThan(0);
    });
  });

  describe('descriptionCharsRemaining', () => {
    it('should return 1000 when empty', () => {
      component.questionForm.get('questionDescription')?.setValue('');
      expect(component.descriptionCharsRemaining).toBe(1000);
    });

    it('should calculate remaining characters', () => {
      component.questionForm.get('questionDescription')?.setValue('hello');
      expect(component.descriptionCharsRemaining).toBe(995);
    });
  });

  describe('isFormValid', () => {




    it('should be false in edit mode when form is not dirty', () => {
      component.selectQuestion(mockQuestions[0]);
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('isSaving', () => {
    it('should reset isSaving after successful save', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
      expect(hhServiceSpy.createQuestion).toHaveBeenCalled();
    }));

    it('should reset savingAction after saveAndAddAnother', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      component.onSaveAndAddAnother();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
      expect(hhServiceSpy.createQuestion).toHaveBeenCalled();
    }));

    it('should reset isSaving on error', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));
  });

  describe('refCodeValidator', () => {
    it('should pass when first 2 chars are numeric', () => {
      component.questionForm.get('refCode')?.setValue('01ABC');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(false);
    });

    it('should fail when first char is not numeric', () => {
      component.questionForm.get('refCode')?.setValue('ABABC');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(true);
    });

    it('should fail when second char is not numeric', () => {
      component.questionForm.get('refCode')?.setValue('1ABCD');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(true);
    });

    it('should pass for short value less than 2 chars', () => {
      component.questionForm.get('refCode')?.setValue('A');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(false);
    });
  });

  describe('initialization - additional', () => {
    it('should set isAddMode to true on init', () => {
      expect(component.isAddMode).toBe(true);
    });

    it('should load period types on init', () => {
      expect(hhServiceSpy.getPeriodTypes).toHaveBeenCalled();
      expect(component.periodTypeOptions.length).toBe(3);
      expect(component.periodTypeOptions[0]).toEqual({ code: 'Days', description: 'Days' });
    });

    it('should set chapterTimezone from headerService', () => {
      expect(component.chapterTimezone).toBe('-06:00');
    });

    it('should initialize the form with required validators', () => {
      expect(component.questionForm).toBeTruthy();
      expect(component.questionForm.get('questionCode')).toBeTruthy();
      expect(component.questionForm.get('refCode')).toBeTruthy();
      expect(component.questionForm.get('gender')).toBeTruthy();
      expect(component.questionForm.get('questionDescription')).toBeTruthy();
      expect(component.questionForm.get('effectiveDate')).toBeTruthy();
    });

    it('should have required validator on gender', () => {
      component.questionForm.get('gender')?.setValue('');
      component.questionForm.get('gender')?.updateValueAndValidity();
      expect(component.questionForm.get('gender')?.hasError('required')).toBe(true);
    });

    it('should have required validator on questionDescription', () => {
      component.questionForm.get('questionDescription')?.setValue('');
      component.questionForm.get('questionDescription')?.updateValueAndValidity();
      expect(component.questionForm.get('questionDescription')?.hasError('required')).toBe(true);
    });

    it('should have maxLength validator on questionDescription', () => {
      component.questionForm.get('questionDescription')?.setValue('a'.repeat(1001));
      component.questionForm.get('questionDescription')?.updateValueAndValidity();
      expect(component.questionForm.get('questionDescription')?.hasError('maxlength')).toBe(true);
    });

    it('should have required validator on effectiveDate', () => {
      component.questionForm.get('effectiveDate')?.setValue(null);
      component.questionForm.get('effectiveDate')?.updateValueAndValidity();
      expect(component.questionForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should have maxLength validator on refCode', () => {
      component.questionForm.get('refCode')?.setValue('12345678901');
      component.questionForm.get('refCode')?.updateValueAndValidity();
      expect(component.questionForm.get('refCode')?.hasError('maxlength')).toBe(true);
    });
  });

  describe('loadPeriodTypes - error fallback', () => {
    it('should fallback to hardcoded period types when API fails', () => {
      hhServiceSpy.getPeriodTypes.and.returnValue(throwError(() => new Error('API error')));
      (component as any).loadPeriodTypes();
      expect(component.periodTypeOptions).toEqual([
        { code: 'Days', description: 'Days' },
        { code: 'Months', description: 'Months' },
        { code: 'Years', description: 'Years' }
      ]);
    });
  });

  describe('loadQuestions - additional', () => {
    it('should pass searchText in params when set', () => {
      component.searchText = 'chest';
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.searchFor).toBe('chest');
    });

    it('should pass gender filter when appliedFilters has sex', () => {
      component.appliedFilters = { sex: 'M' };
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.gender).toBe('M');
    });

    it('should pass validateLookBackDate filter', () => {
      component.appliedFilters = { validateLookBackDate: 'Yes' };
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.validateLookBackDate).toBe('Yes');
    });

    it('should pass periodTypeForLookBack filter', () => {
      component.appliedFilters = { periodTypeForLookBack: 'Days' };
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.periodTypeForLookBack).toBe('Days');
    });

    it('should pass effectiveDate and effectiveDatePeriod filters', () => {
      component.appliedFilters = { effectiveDate: '2025-01-01', effectiveDatePeriod: 'After' };
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.effectiveDate).toBe('2025-01-01');
      expect(params.effectiveDatePeriod).toBe('After');
    });

    it('should pass terminationDate and terminationDatePeriod filters', () => {
      component.appliedFilters = { terminationDate: '2026-12-31', terminationDatePeriod: 'Before' };
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.terminationDate).toBe('2026-12-31');
      expect(params.terminationDatePeriod).toBe('Before');
    });

    it('should not pass effectiveDatePeriod when effectiveDate is falsy', () => {
      component.appliedFilters = { effectiveDatePeriod: 'After' } as any;
      hhServiceSpy.searchQuestions.calls.reset();
      (component as any).loadQuestions();
      const params = hhServiceSpy.searchQuestions.calls.mostRecent().args[0];
      expect(params.effectiveDatePeriod).toBeUndefined();
    });

    it('should handle error from searchQuestions', () => {
      hhServiceSpy.searchQuestions.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      (component as any).loadQuestions();
      expect(component.questions()).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.emptyMessage).toBe('Server error');
    });

    it('should use default error message when error has no message', () => {
      hhServiceSpy.searchQuestions.and.returnValue(throwError(() => ({})));
      (component as any).loadQuestions();
      expect(component.emptyMessage).toBe('No health history questions found.');
    });

    it('should use err.message when err.error.message is not available', () => {
      hhServiceSpy.searchQuestions.and.returnValue(throwError(() => ({ message: 'Network error' })));
      (component as any).loadQuestions();
      expect(component.emptyMessage).toBe('Network error');
    });

    it('should set emptyMessage from result.message when data is empty', () => {
      hhServiceSpy.searchQuestions.and.returnValue(of({ data: [], totalRecords: 0, message: 'No records match criteria' }));
      (component as any).loadQuestions();
      expect(component.questions()).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.emptyMessage).toBe('No records match criteria');
    });

    it('should reset emptyMessage when data has results', () => {
      component.emptyMessage = 'Custom message';
      hhServiceSpy.searchQuestions.and.returnValue(of({ data: mockQuestions, totalRecords: 2 }));
      (component as any).loadQuestions();
      expect(component.emptyMessage).toBe('No questions found');
    });
  });

  describe('selectQuestion - additional', () => {
    it('should use fullQuestion from service when available', () => {
      const fullQuestion = { ...mockQuestions[0], questionDescription: 'Updated description' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(fullQuestion));
      component.selectQuestion(mockQuestions[0]);
      expect(component.selectedQuestion?.questionDescription).toBe('Updated description');
      expect(component.isAddMode).toBe(false);
    });

    it('should fallback to list question when service returns null', () => {
      hhServiceSpy.getQuestionByCode.and.returnValue(of(null as any));
      component.selectQuestion(mockQuestions[1]);
      expect(component.selectedQuestion?.questionCode).toBe('D53');
      expect(component.isAddMode).toBe(false);
    });

    it('should set readMoreFlag to N when null in populateForm', () => {
      const question = { ...mockQuestions[0], readMoreFlag: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('readMoreFlag')?.value).toBe('N');
    });

    it('should set validateLookBackDate to N when null in populateForm', () => {
      const question = { ...mockQuestions[0], validateLookBackDate: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('validateLookBackDate')?.value).toBe('N');
    });

    it('should set manualAuditHistFlag to N when not Y', () => {
      const question = { ...mockQuestions[0], manualAuditHistFlag: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('manualAuditHistFlag')?.value).toBe('N');
    });

    it('should set manualAuditHistFlag to Y when Y', () => {
      const question = { ...mockQuestions[0], manualAuditHistFlag: 'Y' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('manualAuditHistFlag')?.value).toBe('Y');
    });

    it('should convert effectiveDate string to moment', () => {
      hhServiceSpy.getQuestionByCode.and.returnValue(of(mockQuestions[0]));
      component.selectQuestion(mockQuestions[0]);
      const effDate = component.questionForm.get('effectiveDate')?.value;
      expect(moment.isMoment(effDate)).toBe(true);
    });

    it('should set effectiveDate to null when not provided', () => {
      const question = { ...mockQuestions[0], effectiveDate: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should set terminationDate to null when not provided', () => {
      const question = { ...mockQuestions[0], terminationDate: '' };
      hhServiceSpy.getQuestionByCode.and.returnValue(of(question));
      component.selectQuestion(question);
      expect(component.questionForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('onCancel - additional', () => {
    it('should reset form in add mode', () => {
      component.isAddMode = true;
      component.questionForm.get('questionCode')?.setValue('TEST');
      component.questionForm.markAsDirty();
      component.onCancel();
      expect(component.questionForm.get('questionCode')?.value).toBeNull();
      expect(component.questionForm.pristine).toBe(true);
      expect(component.questionForm.untouched).toBe(true);
    });

    it('should not repopulate when no selectedQuestion in edit mode', () => {
      component.isAddMode = false;
      component.selectedQuestion = null;
      component.questionForm.get('questionCode')?.setValue('CHANGED');
      component.onCancel();
      // No repopulation happens, value stays
      expect(component.questionForm.get('questionCode')?.value).toBe('CHANGED');
    });
  });

  describe('onSave - additional', () => {
    it('should not save when form is invalid', () => {
      component.onAddNew();
      // Form is empty so it's invalid
      component.onSave();
      expect(hhServiceSpy.createQuestion).not.toHaveBeenCalled();
      expect(hhServiceSpy.updateQuestion).not.toHaveBeenCalled();
    });

    it('should call updateQuestion in edit mode', fakeAsync(() => {
      hhServiceSpy.updateQuestion.and.returnValue(of({ success: true, message: 'Updated' }));
      component.selectQuestion(mockQuestions[0]);
      tick();

      fillValidForm();
      component.isAddMode = false;
      component.selectedQuestion = mockQuestions[0];

      component.onSave();
      tick();

      expect(hhServiceSpy.updateQuestion).toHaveBeenCalled();
      expect(hhServiceSpy.updateQuestion.calls.mostRecent().args[0]).toBe('D52');
    }));

    it('should show error snackbar when result.success is false', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: false, message: 'Duplicate entry', errorCode: '0319' }));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));

    it('should show success snackbar with result message', fakeAsync(() => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Question created' }));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Question created', 'DISMISS', jasmine.objectContaining({ duration: 3000 })
      );
    }));

    it('should show default success message when result has no message', fakeAsync(() => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true }));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Saved successfully', 'DISMISS', jasmine.any(Object)
      );
    }));

    it('should reload questions after successful save', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      hhServiceSpy.searchQuestions.calls.reset();
      component.onSave();
      tick();

      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    }));

    it('should set savingAction to save during save', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      component.onSave();
      // After tick, savingAction is reset
      tick();
      expect(component.savingAction).toBeNull();
    }));

    it('should handle error during save in edit mode', fakeAsync(() => {
      hhServiceSpy.updateQuestion.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.selectQuestion(mockQuestions[0]);
      tick();

      fillValidForm();
      component.isAddMode = false;
      component.selectedQuestion = mockQuestions[0];

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));
  });

  describe('onSaveAndAddAnother - additional', () => {
    it('should not save when form is invalid', () => {
      component.onAddNew();
      component.onSaveAndAddAnother();
      expect(hhServiceSpy.createQuestion).not.toHaveBeenCalled();
    });

    it('should show error snackbar when result.success is false', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: false, message: 'Duplicate', errorCode: '0319' }));
      component.onAddNew();
      fillValidForm();

      component.onSaveAndAddAnother();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));

    it('should reset isSaving on error', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
      component.onAddNew();
      fillValidForm();

      component.onSaveAndAddAnother();
      tick();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));

    it('should call onAddNew and reload questions on success', fakeAsync(() => {
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Created' }));
      component.onAddNew();
      fillValidForm();

      hhServiceSpy.searchQuestions.calls.reset();
      component.onSaveAndAddAnother();
      tick();

      expect(component.isAddMode).toBe(true);
      expect(component.selectedQuestion).toBeNull();
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    }));

    it('should show success snackbar on success', fakeAsync(() => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true, message: 'Question created' }));
      component.onAddNew();
      fillValidForm();

      component.onSaveAndAddAnother();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Question created', 'DISMISS', jasmine.objectContaining({ duration: 3000 })
      );
    }));

    it('should use default success message when result has no message', fakeAsync(() => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      hhServiceSpy.createQuestion.and.returnValue(of({ success: true }));
      component.onAddNew();
      fillValidForm();

      component.onSaveAndAddAnother();
      tick();

      expect(openSpy).toHaveBeenCalledWith(
        'Saved successfully', 'DISMISS', jasmine.any(Object)
      );
    }));
  });

  describe('onSearch - additional', () => {
    it('should handle empty string by setting searchText to empty', () => {
      component.searchText = 'previous';
      component.onSearch('');
      expect(component.searchText).toBe('');
    });

    it('should clear selectedQuestion on search', () => {
      component.selectedQuestion = mockQuestions[0];
      component.onSearch('test');
      expect(component.selectedQuestion).toBeNull();
    });
  });

  describe('onQuestionCodeInput', () => {
    it('should convert input to uppercase', () => {
      const input = { value: 'abc' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onQuestionCodeInput(event);
      expect(input.value).toBe('ABC');
      expect(component.questionForm.get('questionCode')?.value).toBe('ABC');
    });

    it('should keep uppercase input unchanged', () => {
      const input = { value: 'XYZ' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onQuestionCodeInput(event);
      expect(input.value).toBe('XYZ');
    });
  });

  describe('onRefCodeInput', () => {
    it('should convert input to uppercase', () => {
      const input = { value: '01abc' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onRefCodeInput(event);
      expect(input.value).toBe('01ABC');
      expect(component.questionForm.get('refCode')?.value).toBe('01ABC');
    });

    it('should not update form when already uppercase', () => {
      const input = { value: '01XYZ' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      const spy = spyOn(component.questionForm.get('refCode')!, 'setValue');
      component.onRefCodeInput(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('filter management - additional', () => {
    it('should create chips for all filter types', () => {
      component.applyFilters({
        sex: 'M',
        validateLookBackDate: 'Yes',
        periodTypeForLookBack: 'Days',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2026-12-31',
        terminationDatePeriod: 'Before'
      });

      expect(component.filterChips.length).toBe(5);
      expect(component.filterChips[0].key).toBe('sex');
      expect(component.filterChips[1].key).toBe('validateLookBackDate');
      expect(component.filterChips[2].key).toBe('periodTypeForLookBack');
      expect(component.filterChips[3].key).toBe('effectiveDate');
      expect(component.filterChips[4].key).toBe('terminationDate');
    });

    it('should use default period After for effectiveDate chip when not specified', () => {
      component.applyFilters({ effectiveDate: '2025-01-01' });
      const effChip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(effChip?.value).toContain('After');
    });

    it('should use default period Before for terminationDate chip when not specified', () => {
      component.applyFilters({ terminationDate: '2026-12-31' });
      const termChip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(termChip?.value).toContain('Before');
    });

    it('should remove terminationDate filter chip and its period', () => {
      component.applyFilters({
        sex: 'M',
        terminationDate: '2026-12-31',
        terminationDatePeriod: 'Before'
      });
      component.onRemoveFilterChip('terminationDate');
      expect(component.appliedFilters?.terminationDate).toBeUndefined();
      expect(component.appliedFilters?.terminationDatePeriod).toBeUndefined();
      expect(component.appliedFilters?.sex).toBe('M');
    });

    it('should remove validateLookBackDate filter chip', () => {
      component.applyFilters({ validateLookBackDate: 'Yes', sex: 'F' });
      component.onRemoveFilterChip('validateLookBackDate');
      expect(component.appliedFilters?.validateLookBackDate).toBeUndefined();
      expect(component.appliedFilters?.sex).toBe('F');
    });

    it('should remove periodTypeForLookBack filter chip', () => {
      component.applyFilters({ periodTypeForLookBack: 'Days', sex: 'M' });
      component.onRemoveFilterChip('periodTypeForLookBack');
      expect(component.appliedFilters?.periodTypeForLookBack).toBeUndefined();
    });

    it('should clear all filters when last filter removed', () => {
      component.applyFilters({ sex: 'M' });
      component.onRemoveFilterChip('sex');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should do nothing when appliedFilters is null on chip removal', () => {
      component.appliedFilters = null;
      hhServiceSpy.searchQuestions.calls.reset();
      component.onRemoveFilterChip('sex');
      expect(hhServiceSpy.searchQuestions).not.toHaveBeenCalled();
    });

    it('should clear selectedQuestion on chip removal', () => {
      component.selectedQuestion = mockQuestions[0];
      component.applyFilters({ sex: 'M', validateLookBackDate: 'Yes' });
      component.selectedQuestion = mockQuestions[0];
      component.onRemoveFilterChip('sex');
      expect(component.selectedQuestion).toBeNull();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when filters exist with values', () => {
      component.appliedFilters = { sex: 'M' };
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when all filter values are empty', () => {
      component.appliedFilters = { sex: '', validateLookBackDate: '' };
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return false when filter values are null', () => {
      component.appliedFilters = { sex: undefined as any };
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters, chips, selection, and reload', () => {
      component.appliedFilters = { sex: 'M' };
      component.filterChips = [{ key: 'sex', label: 'Sex', value: 'M', removable: true }];
      component.selectedQuestion = mockQuestions[0];
      hhServiceSpy.searchQuestions.calls.reset();

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.selectedQuestion).toBeNull();
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    });
  });

  describe('openFilter', () => {
    it('should close existing overlay if already open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('getGenderIconPath', () => {
    it('should return male icon for M', () => {
      expect(component.getGenderIconPath('M')).toBe('assets/images/icons/gender-male.svg');
    });

    it('should return female icon for F', () => {
      expect(component.getGenderIconPath('F')).toBe('assets/images/icons/gender-female.svg');
    });

    it('should return all genders icon for A', () => {
      expect(component.getGenderIconPath('A')).toBe('assets/images/icons/gender-all.svg');
    });

    it('should return all genders icon for unknown gender', () => {
      expect(component.getGenderIconPath('X')).toBe('assets/images/icons/gender-all.svg');
    });
  });

  describe('getGenderLabel', () => {
    it('should return Male for M', () => {
      expect(component.getGenderLabel('M')).toBe('Male');
    });

    it('should return Female for F', () => {
      expect(component.getGenderLabel('F')).toBe('Female');
    });

    it('should return All Genders for A', () => {
      expect(component.getGenderLabel('A')).toBe('All Genders');
    });

    it('should return All Genders for unknown gender', () => {
      expect(component.getGenderLabel('X')).toBe('All Genders');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const result = component.formatDate('2024-03-15');
      expect(result).toBe('15-MAR-2024');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return dash for null/undefined', () => {
      expect(component.formatDate(null as any)).toBe('-');
      expect(component.formatDate(undefined as any)).toBe('-');
    });
  });

  describe('getEffectiveDateDisplay - additional', () => {
    it('should return dash when no effective date', () => {
      component.questionForm.get('effectiveDate')?.setValue(null);
      expect(component.getEffectiveDateDisplay()).toBe('-');
    });

    it('should handle non-moment date value', () => {
      component.questionForm.get('effectiveDate')?.setValue('2024-03-15');
      const display = component.getEffectiveDateDisplay();
      expect(display).not.toBe('-');
    });

    it('should return dash for invalid moment', () => {
      component.questionForm.get('effectiveDate')?.setValue(moment('invalid'));
      expect(component.getEffectiveDateDisplay()).toBe('-');
    });
  });

  describe('lookBackPeriodError', () => {
    it('should return true when validateLookBackDate is Y and fields are touched but empty', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('');
      component.questionForm.get('periodNumberForLookBack')?.setValue(null);
      component.questionForm.get('periodTypeForLookBack')?.markAsTouched();
      component.questionForm.updateValueAndValidity();
      expect(component.lookBackPeriodError).toBe(true);
    });

    it('should return false when validateLookBackDate is N', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('N');
      component.questionForm.get('periodTypeForLookBack')?.setValue('');
      component.questionForm.get('periodNumberForLookBack')?.setValue(null);
      component.questionForm.updateValueAndValidity();
      expect(component.lookBackPeriodError).toBe(false);
    });

    it('should return false when both periodType and periodNumber are filled', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('Days');
      component.questionForm.get('periodNumberForLookBack')?.setValue(30);
      component.questionForm.updateValueAndValidity();
      expect(component.lookBackPeriodError).toBe(false);
    });

    it('should return false when fields are not touched', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('');
      component.questionForm.get('periodNumberForLookBack')?.setValue(null);
      component.questionForm.updateValueAndValidity();
      expect(component.lookBackPeriodError).toBe(false);
    });
  });

  describe('lookBackPeriodValidator', () => {
    it('should return error when validateFlag is Y and periodType is missing', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('');
      component.questionForm.get('periodNumberForLookBack')?.setValue(5);
      component.questionForm.updateValueAndValidity();
      expect(component.questionForm.hasError('lookBackPeriodRequired')).toBe(true);
    });

    it('should return error when validateFlag is Y and periodNumber is missing', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('Days');
      component.questionForm.get('periodNumberForLookBack')?.setValue(null);
      component.questionForm.updateValueAndValidity();
      expect(component.questionForm.hasError('lookBackPeriodRequired')).toBe(true);
    });

    it('should not return error when validateFlag is not Y', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('N');
      component.questionForm.get('periodTypeForLookBack')?.setValue('');
      component.questionForm.get('periodNumberForLookBack')?.setValue(null);
      component.questionForm.updateValueAndValidity();
      expect(component.questionForm.hasError('lookBackPeriodRequired')).toBe(false);
    });

    it('should not return error when both fields are filled', () => {
      component.questionForm.get('validateLookBackDate')?.setValue('Y');
      component.questionForm.get('periodTypeForLookBack')?.setValue('Months');
      component.questionForm.get('periodNumberForLookBack')?.setValue(6);
      component.questionForm.updateValueAndValidity();
      expect(component.questionForm.hasError('lookBackPeriodRequired')).toBe(false);
    });
  });

  describe('isFormValid - additional', () => {
    it('should be true when form is valid and dirty in add mode', () => {
      component.onAddNew();
      fillValidForm();
      expect(component.isFormValid).toBe(true);
    });

    it('should be false when form is invalid', () => {
      component.onAddNew();
      // Form is empty so invalid
      component.questionForm.markAsDirty();
      expect(component.isFormValid).toBe(false);
    });
  });

  describe('termMinDate - additional', () => {
    it('should return minDate when effective date is before minDate', () => {
      const pastDate = moment().subtract(1, 'year');
      component.questionForm.get('effectiveDate')?.setValue(pastDate);
      expect(component.termMinDate.isSame(component.minDate)).toBe(true);
    });

    it('should return minDate when effective date is invalid', () => {
      component.questionForm.get('effectiveDate')?.setValue('not-a-date');
      expect(component.termMinDate).toBe(component.minDate);
    });
  });

  describe('refCodeErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.refCodeErrorMatcher.isErrorState(null, null as any)).toBe(false);
    });

    it('should return true when control is dirty and invalid', () => {
      const control = component.questionForm.get('refCode') as any;
      control.setValue('AB');
      control.markAsDirty();
      control.updateValueAndValidity();
      expect(component.refCodeErrorMatcher.isErrorState(control, null as any)).toBe(true);
    });

    it('should return false when control is valid', () => {
      const control = component.questionForm.get('refCode') as any;
      control.setValue('01ABC');
      control.markAsDirty();
      control.updateValueAndValidity();
      expect(component.refCodeErrorMatcher.isErrorState(control, null as any)).toBe(false);
    });

    it('should return true when control is touched and invalid', () => {
      const control = component.questionForm.get('refCode') as any;
      control.setValue('AB');
      control.markAsTouched();
      control.updateValueAndValidity();
      expect(component.refCodeErrorMatcher.isErrorState(control, null as any)).toBe(true);
    });

    it('should return false when control is pristine and untouched', () => {
      const control = component.questionForm.get('refCode') as any;
      control.setValue('AB');
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
      expect(component.refCodeErrorMatcher.isErrorState(control, null as any)).toBe(false);
    });
  });

  describe('refCodeValidator - additional', () => {
    it('should pass for empty value', () => {
      component.questionForm.get('refCode')?.setValue('');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(false);
    });

    it('should pass for exactly 2 digit chars', () => {
      component.questionForm.get('refCode')?.setValue('99');
      expect(component.questionForm.get('refCode')?.hasError('refCodePrefix')).toBe(false);
    });
  });

  describe('periodNumberForLookBack validators', () => {
    it('should reject negative numbers', () => {
      component.questionForm.get('periodNumberForLookBack')?.setValue(-1);
      component.questionForm.get('periodNumberForLookBack')?.updateValueAndValidity();
      expect(component.questionForm.get('periodNumberForLookBack')?.hasError('min')).toBe(true);
    });

    it('should reject numbers greater than 9999', () => {
      component.questionForm.get('periodNumberForLookBack')?.setValue(10000);
      component.questionForm.get('periodNumberForLookBack')?.updateValueAndValidity();
      expect(component.questionForm.get('periodNumberForLookBack')?.hasError('max')).toBe(true);
    });

    it('should accept valid number', () => {
      component.questionForm.get('periodNumberForLookBack')?.setValue(100);
      component.questionForm.get('periodNumberForLookBack')?.updateValueAndValidity();
      expect(component.questionForm.get('periodNumberForLookBack')?.valid).toBe(true);
    });

    it('should reject non-numeric pattern', () => {
      component.questionForm.get('periodNumberForLookBack')?.setValue('abc');
      component.questionForm.get('periodNumberForLookBack')?.updateValueAndValidity();
      expect(component.questionForm.get('periodNumberForLookBack')?.hasError('pattern')).toBe(true);
    });
  });

  describe('getFilteredQuestions', () => {
    it('should return the current questions signal value', () => {
      expect(component.getFilteredQuestions()).toEqual(mockQuestions);
    });

    it('should return empty array when no questions', () => {
      component.questions.set([]);
      expect(component.getFilteredQuestions()).toEqual([]);
    });
  });

  describe('showErrorSnackbar - additional', () => {
    it('should display errorCode from errorResponse when both present', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      (component as any).showErrorSnackbar({
        errorResponse: { errorCode: '0500', error: 'Internal error' }
      });
      expect(openSpy).toHaveBeenCalledWith(
        'Error: 0500: Internal error', 'DISMISS', jasmine.any(Object)
      );
    });

    it('should use errorCode from top level when errorResponse has none', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');
      (component as any).showErrorSnackbar({
        errorCode: '0404',
        message: 'Not found'
      });
      expect(openSpy).toHaveBeenCalledWith(
        'Error: 0404: Not found', 'DISMISS', jasmine.any(Object)
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlay if exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.ngOnDestroy();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('chapter change - additional', () => {
    it('should dispose overlay on chapter change when overlay is open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      chapterChanged$.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should reset form on chapter change', () => {
      component.questionForm.get('questionCode')?.setValue('TEST');
      component.questionForm.markAsDirty();

      chapterChanged$.next();

      expect(component.questionForm.pristine).toBe(true);
      expect(component.questionForm.untouched).toBe(true);
    });

    it('should clear selectedQuestion on chapter change', () => {
      component.selectedQuestion = mockQuestions[0];
      chapterChanged$.next();
      expect(component.selectedQuestion).toBeNull();
    });

    it('should reload period types on chapter change', () => {
      hhServiceSpy.getPeriodTypes.calls.reset();
      chapterChanged$.next();
      expect(hhServiceSpy.getPeriodTypes).toHaveBeenCalled();
    });
  });

  describe('descriptionCharsRemaining - additional', () => {
    it('should return 1000 when description is null', () => {
      component.questionForm.get('questionDescription')?.setValue(null);
      expect(component.descriptionCharsRemaining).toBe(1000);
    });
  });

  describe('date field lastChangedDateField tracking', () => {
    it('should set lastChangedDateField to effective when effectiveDate changes', () => {
      component.lastChangedDateField = 'termination';
      component.questionForm.get('effectiveDate')?.setValue(moment('2025-06-01'));
      expect(component.lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when terminationDate changes', () => {
      component.lastChangedDateField = 'effective';
      component.questionForm.get('terminationDate')?.setValue(moment('2026-01-01'));
      expect(component.lastChangedDateField).toBe('termination');
    });
  });

  function fillValidForm(): void {
    const futureDate = moment().add(30, 'days');
    component.questionForm.patchValue({
      questionCode: 'TEST',
      refCode: '01',
      gender: 'A',
      questionDescription: 'Test question',
      readMoreFlag: 'N',
      manualAuditFlag: 'N',
      manualAuditHistFlag: 'N',
      validateLookBackDate: 'No',
      effectiveDate: futureDate
    });

    component.questionForm.clearValidators();
    Object.keys(component.questionForm.controls).forEach(key => {
      const control = component.questionForm.get(key);
      control?.clearValidators();
      control?.setErrors(null);
      control?.updateValueAndValidity({ emitEvent: false });
    });

    component.questionForm.setErrors(null);
    component.questionForm.updateValueAndValidity({ emitEvent: false });
    component.questionForm.markAsDirty();
  }
});
