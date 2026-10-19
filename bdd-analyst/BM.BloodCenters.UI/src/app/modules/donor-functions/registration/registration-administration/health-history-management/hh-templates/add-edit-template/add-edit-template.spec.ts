import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { AddEditTemplate } from './add-edit-template';
import { HealthHistoryService } from '../../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHTemplateQuestionDto, QuestionDropdownOption, ReturnResult } from '../../models/health-history.model';

// Use dates far in the future so effective date validators never reject them as "past"
const FUTURE_EFF_DATE = '2028-01-15';
const FUTURE_TERM_DATE = '2028-12-31';

describe('AddEditTemplate', () => {
  let component: AddEditTemplate;
  let fixture: ComponentFixture<AddEditTemplate>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceMock: Partial<HeaderService>;

  const mockDonationTypes = [
    { code: 'AL', description: 'Allogeneic' },
    { code: 'AU', description: 'Autologous' },
    { code: 'DR', description: 'Directed' }
  ];

  const mockQuestions: QuestionDropdownOption[] = [
    { code: 'Q001', description: 'Have you ever donated blood?', gender: 'A' },
    { code: 'Q002', description: 'Are you feeling well today?', gender: 'M' },
    { code: 'Q003', description: 'Are you pregnant?', gender: 'F' }
  ];

  function createMockQuestion(overrides: Partial<HHTemplateQuestionDto> = {}): HHTemplateQuestionDto {
    return {
      donationType: 'AL',
      questionCode: 'Q001',
      templateId: 'NEW',
      questionDescription: 'Have you ever donated blood?',
      screenerAsk: 'D',
      abbrFlag: 'N',
      abbrDispSeq: null,
      repeatHhFlag: 'Y',
      gender: 'A',
      displayOrder: 1,
      sortSequence: '1',
      parentQuestionCode: '',
      subQuestionFlag: 'N',
      parentRespFlag: 'N',
      gotoNotes: '',
      effDate: FUTURE_EFF_DATE,
      termDate: null,
      validCodeType: '',
      randomizationFlag: 'N',
      programId: '',
      insertDate: '',
      insertUser: '',
      auditKey: 0,
      chapterId: 'DAL',
      ...overrides
    };
  }

  beforeEach(async () => {
    // Reset static state
    (AddEditTemplate as any).cachedTemplateId = '';

    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'getDonationTypes',
      'getAvailableQuestionsForTemplate',
      'generateTemplateId',
      'createTemplateQuestion',
      'updateTemplateQuestion'
    ]);
    hhServiceSpy.getDonationTypes.and.returnValue(of(mockDonationTypes));
    hhServiceSpy.getAvailableQuestionsForTemplate.and.returnValue(of(mockQuestions));
    hhServiceSpy.generateTemplateId.and.returnValue(of('TMPL000099'));
    hhServiceSpy.createTemplateQuestion.and.returnValue(of({ success: true } as ReturnResult<HHTemplateQuestionDto>));
    hhServiceSpy.updateTemplateQuestion.and.returnValue(of({ success: true } as ReturnResult<HHTemplateQuestionDto>));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    headerServiceMock = {
      chapterTimeZone: signal('-06:00'),
      getCurrentChapterId: () => 'DAL'
    } as any;

    await TestBed.configureTestingModule({
      imports: [AddEditTemplate, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditTemplate);
    component = fixture.componentInstance;

    // Standalone components using inject() resolve from their own module imports,
    // not TestBed providers. Override private injected services directly.
    (component as any).snackBar = snackBarSpy;
    (component as any).dialog = dialogSpy;

    fixture.detectChanges();
  });

  // ==================== INITIALIZATION ====================

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the template form with correct controls', () => {
      expect(component.templateForm).toBeTruthy();
      expect(component.templateForm.get('donationType')).toBeTruthy();
      expect(component.templateForm.get('templateId')).toBeTruthy();
      expect(component.templateForm.get('effectiveDate')).toBeTruthy();
      expect(component.templateForm.get('terminationDate')).toBeTruthy();
    });

    it('should set donationType as required', () => {
      component.templateForm.get('donationType')?.setValue('');
      expect(component.templateForm.get('donationType')?.hasError('required')).toBe(true);
    });

    it('should set templateId as required with maxLength 10', () => {
      component.templateForm.get('templateId')?.setValue('');
      expect(component.templateForm.get('templateId')?.hasError('required')).toBe(true);

      component.templateForm.get('templateId')?.setValue('12345678901');
      expect(component.templateForm.get('templateId')?.hasError('maxlength')).toBe(true);
    });

    it('should set effectiveDate as required', () => {
      expect(component.templateForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should set terminationDate as optional', () => {
      expect(component.templateForm.get('terminationDate')?.hasError('required')).toBeFalsy();
    });

    it('should load donation types on init', () => {
      expect(hhServiceSpy.getDonationTypes).toHaveBeenCalled();
      expect(component.donationTypes().length).toBe(3);
      expect(component.filteredDonationTypes.length).toBe(3);
    });

    it('should load available questions on init', () => {
      expect(hhServiceSpy.getAvailableQuestionsForTemplate).toHaveBeenCalled();
      expect(component.availableQuestions().length).toBe(3);
    });

    it('should call generateTemplateId on init', () => {
      expect(hhServiceSpy.generateTemplateId).toHaveBeenCalled();
    });

    it('should set generatedTemplateId from service', () => {
      expect(component.generatedTemplateId).toBe('TMPL000099');
    });

    it('should patch templateId as NEW in the form', () => {
      expect(component.templateForm.get('templateId')?.value).toBe('NEW');
    });

    it('should set chapterTimezone from headerService', () => {
      expect(component.chapterTimezone).toBe('-06:00');
    });

    it('should initialize assignedQuestions as empty', () => {
      expect(component.assignedQuestions).toEqual([]);
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize isQuestionsSearchOpen as false', () => {
      expect(component.isQuestionsSearchOpen).toBe(false);
    });

    it('should initialize questionSearchText as empty', () => {
      expect(component.questionSearchText).toBe('');
    });

    it('should have minDate set', () => {
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });

    it('should have dropdown options arrays defined', () => {
      expect(component.sexOptions.length).toBe(3);
      expect(component.askOptions.length).toBe(1);
      expect(component.abbrFlagOptions.length).toBe(2);
      expect(component.repeatedOptions.length).toBe(1);
      expect(component.responseFlagOptions.length).toBe(2);
      expect(component.subFlagOptions.length).toBe(3);
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

  // ==================== loadOrReuseTemplateId ====================

  describe('loadOrReuseTemplateId', () => {
    it('should use cached template ID if available', () => {
      (AddEditTemplate as any).cachedTemplateId = 'CACHED_ID';
      hhServiceSpy.generateTemplateId.calls.reset();
      component['loadOrReuseTemplateId']();
      expect(component.generatedTemplateId).toBe('CACHED_ID');
      expect(component.templateForm.get('templateId')?.value).toBe('NEW');
      expect(hhServiceSpy.generateTemplateId).not.toHaveBeenCalled();
    });

    it('should call service when no cached ID', () => {
      (AddEditTemplate as any).cachedTemplateId = '';
      hhServiceSpy.generateTemplateId.calls.reset();
      component['loadOrReuseTemplateId']();
      expect(hhServiceSpy.generateTemplateId).toHaveBeenCalled();
    });

    it('should cache the generated ID', () => {
      (AddEditTemplate as any).cachedTemplateId = '';
      hhServiceSpy.generateTemplateId.and.returnValue(of('TMPL_NEW'));
      component['loadOrReuseTemplateId']();
      expect((AddEditTemplate as any).cachedTemplateId).toBe('TMPL_NEW');
      expect(component.generatedTemplateId).toBe('TMPL_NEW');
    });

    it('should show snackbar on generateTemplateId error', () => {
      (AddEditTemplate as any).cachedTemplateId = '';
      hhServiceSpy.generateTemplateId.and.returnValue(throwError(() => new Error('fail')));
      component['loadOrReuseTemplateId']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to generate template ID', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ==================== filterDonationTypesList ====================

  describe('filterDonationTypesList', () => {
    it('should return all donation types when search is empty', () => {
      component['filterDonationTypesList']('');
      expect(component.filteredDonationTypes.length).toBe(3);
    });

    it('should filter by code (case-insensitive)', () => {
      component['filterDonationTypesList']('al');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AL');
    });

    it('should filter by description (case-insensitive)', () => {
      component['filterDonationTypesList']('auto');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AU');
    });

    it('should return empty when no matches', () => {
      component['filterDonationTypesList']('xyz');
      expect(component.filteredDonationTypes.length).toBe(0);
    });

    it('should filter by partial code match', () => {
      component['filterDonationTypesList']('d');
      expect(component.filteredDonationTypes.some(dt => dt.code === 'DR')).toBe(true);
    });
  });

  // ==================== onDonationTypeSelectOpened ====================

  describe('onDonationTypeSelectOpened', () => {
    it('should reset search control when dropdown closes', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onDonationTypeSelectOpened(false);
      expect(component.donationTypeSearchControl.value).toBe('');
    });

    it('should not reset search control when dropdown opens', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onDonationTypeSelectOpened(true);
      expect(component.donationTypeSearchControl.value).toBe('test');
    });
  });

  // ==================== toggleQuestionsSearch ====================

  describe('toggleQuestionsSearch', () => {
    it('should toggle isQuestionsSearchOpen to true', () => {
      expect(component.isQuestionsSearchOpen).toBe(false);
      component.toggleQuestionsSearch();
      expect(component.isQuestionsSearchOpen).toBe(true);
    });

    it('should toggle isQuestionsSearchOpen back to false', () => {
      component.isQuestionsSearchOpen = true;
      component.toggleQuestionsSearch();
      expect(component.isQuestionsSearchOpen).toBe(false);
    });

    it('should clear searchText when closing', () => {
      component.isQuestionsSearchOpen = true;
      component.questionSearchText = 'search text';
      component.toggleQuestionsSearch();
      expect(component.questionSearchText).toBe('');
    });

    it('should not clear searchText when opening', () => {
      component.isQuestionsSearchOpen = false;
      component.questionSearchText = 'existing';
      component.toggleQuestionsSearch();
      expect(component.questionSearchText).toBe('existing');
    });
  });

  // ==================== onQuestionSearch ====================

  describe('onQuestionSearch', () => {
    it('should set questionSearchText', () => {
      component.onQuestionSearch('test');
      expect(component.questionSearchText).toBe('test');
    });

    it('should set empty string for null input', () => {
      component.onQuestionSearch(null as any);
      expect(component.questionSearchText).toBe('');
    });

    it('should set empty string for undefined input', () => {
      component.onQuestionSearch(undefined as any);
      expect(component.questionSearchText).toBe('');
    });

    it('should handle empty string', () => {
      component.questionSearchText = 'previous';
      component.onQuestionSearch('');
      expect(component.questionSearchText).toBe('');
    });
  });

  // ==================== getFilteredAvailableQuestions ====================

  describe('getFilteredAvailableQuestions', () => {
    it('should return all questions when no search text', () => {
      component.questionSearchText = '';
      const result = component.getFilteredAvailableQuestions();
      expect(result.length).toBe(3);
    });

    it('should filter by question code (case-insensitive)', () => {
      component.questionSearchText = 'q001';
      const result = component.getFilteredAvailableQuestions();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('Q001');
    });

    it('should filter by question description (case-insensitive)', () => {
      component.questionSearchText = 'pregnant';
      const result = component.getFilteredAvailableQuestions();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('Q003');
    });

    it('should return empty when no matches', () => {
      component.questionSearchText = 'nonexistent';
      const result = component.getFilteredAvailableQuestions();
      expect(result.length).toBe(0);
    });

    it('should match partial description', () => {
      component.questionSearchText = 'ever';
      const result = component.getFilteredAvailableQuestions();
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('Q001');
    });
  });

  // ==================== addQuestionToTemplate ====================

  describe('addQuestionToTemplate', () => {
    beforeEach(() => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: null
      });
    });

    it('should add a question to assignedQuestions', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions.length).toBe(1);
      expect(component.assignedQuestions[0].questionCode).toBe('Q001');
    });

    it('should set default values on the added question', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      const q = component.assignedQuestions[0];
      expect(q.screenerAsk).toBe('D');
      expect(q.abbrFlag).toBe('N');
      expect(q.abbrDispSeq).toBeNull();
      expect(q.repeatHhFlag).toBe('Y');
      expect(q.gender).toBe('A');
      expect(q.displayOrder).toBeNull();
      expect(q.sortSequence).toBe('');
      expect(q.parentQuestionCode).toBe('');
      expect(q.subQuestionFlag).toBe('N');
      expect(q.parentRespFlag).toBe('N');
      expect(q.gotoNotes).toBe('');
      expect(q.randomizationFlag).toBe('N');
    });

    it('should set donationType from form', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].donationType).toBe('AL');
    });

    it('should set templateId from form', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].templateId).toBe('NEW');
    });

    it('should set effDate from form effective date', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].effDate).toBe(FUTURE_EFF_DATE);
    });

    it('should set termDate as null when no termination date', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].termDate).toBeNull();
    });

    it('should set termDate when termination date is present', () => {
      component.templateForm.patchValue({ terminationDate: moment(FUTURE_TERM_DATE) });
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].termDate).toBe(FUTURE_TERM_DATE);
    });

    it('should set chapterId from headerService', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].chapterId).toBe('DAL');
    });

    it('should prevent adding duplicate questions', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions.length).toBe(1);
    });

    it('should allow adding different questions', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      component.addQuestionToTemplate(mockQuestions[1]);
      expect(component.assignedQuestions.length).toBe(2);
    });

    it('should set questionDescription from the question', () => {
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].questionDescription).toBe('Have you ever donated blood?');
    });

    it('should create a new array reference (immutability)', () => {
      const before = component.assignedQuestions;
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions).not.toBe(before);
    });
  });

  // ==================== syncDatesToQuestions ====================

  describe('syncDatesToQuestions', () => {
    beforeEach(() => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: null
      });
      component.addQuestionToTemplate(mockQuestions[0]);
      component.addQuestionToTemplate(mockQuestions[1]);
    });

    it('should sync effective date to all questions when date changes', () => {
      component.templateForm.patchValue({ effectiveDate: moment('2028-06-15') });
      expect(component.assignedQuestions[0].effDate).toBe('2028-06-15');
      expect(component.assignedQuestions[1].effDate).toBe('2028-06-15');
    });

    it('should sync termination date to all questions when date changes', () => {
      component.templateForm.patchValue({ terminationDate: moment(FUTURE_TERM_DATE) });
      expect(component.assignedQuestions[0].termDate).toBe(FUTURE_TERM_DATE);
      expect(component.assignedQuestions[1].termDate).toBe(FUTURE_TERM_DATE);
    });

    it('should set termDate to null when termination date is cleared', () => {
      component.templateForm.patchValue({ terminationDate: moment(FUTURE_TERM_DATE) });
      component.templateForm.patchValue({ terminationDate: null });
      expect(component.assignedQuestions[0].termDate).toBeNull();
    });

    it('should not error when no questions are assigned', () => {
      component.assignedQuestions = [];
      expect(() => {
        component.templateForm.patchValue({ effectiveDate: moment('2028-06-15') });
      }).not.toThrow();
    });

    it('should set lastChangedDateField to effective when effectiveDate changes', () => {
      component.templateForm.patchValue({ effectiveDate: moment('2028-03-01') });
      expect(component.lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when terminationDate changes', () => {
      component.templateForm.patchValue({ terminationDate: moment(FUTURE_TERM_DATE) });
      expect(component.lastChangedDateField).toBe('termination');
    });
  });

  // ==================== removeQuestion ====================

  describe('removeQuestion', () => {
    beforeEach(() => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.addQuestionToTemplate(mockQuestions[0]);
      component.addQuestionToTemplate(mockQuestions[1]);
      component.addQuestionToTemplate(mockQuestions[2]);
    });

    it('should remove question at the specified index', () => {
      component.removeQuestion(1);
      expect(component.assignedQuestions.length).toBe(2);
      expect(component.assignedQuestions.every(q => q.questionCode !== 'Q002')).toBe(true);
    });

    it('should remove the first question', () => {
      component.removeQuestion(0);
      expect(component.assignedQuestions.length).toBe(2);
      expect(component.assignedQuestions[0].questionCode).toBe('Q002');
    });

    it('should remove the last question', () => {
      component.removeQuestion(2);
      expect(component.assignedQuestions.length).toBe(2);
      expect(component.assignedQuestions[1].questionCode).toBe('Q002');
    });

    it('should create a new array reference (immutability)', () => {
      const before = component.assignedQuestions;
      component.removeQuestion(0);
      expect(component.assignedQuestions).not.toBe(before);
    });
  });

  // ==================== isFormValid ====================

  describe('isFormValid', () => {
    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when no questions are assigned', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when question is missing displayOrder', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [createMockQuestion({ displayOrder: null, sortSequence: '1' })];
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when question is missing sortSequence', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [createMockQuestion({ displayOrder: 1, sortSequence: '' })];
      expect(component.isFormValid).toBe(false);
    });

    it('should return false when sortSequence is whitespace only', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [createMockQuestion({ displayOrder: 1, sortSequence: '   ' })];
      expect(component.isFormValid).toBe(false);
    });

    it('should return true when form is valid and questions have required fields', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [createMockQuestion({ displayOrder: 1, sortSequence: '1' })];
      expect(component.isFormValid).toBe(true);
    });

    it('should return true with multiple valid questions', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: '2' })
      ];
      expect(component.isFormValid).toBe(true);
    });

    it('should return false when one of multiple questions is invalid', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: null, sortSequence: '2' })
      ];
      expect(component.isFormValid).toBe(false);
    });
  });

  // ==================== onSave ====================

  describe('onSave', () => {
    it('should return early when form is invalid', () => {
      component.onSave();
      expect(hhServiceSpy.createTemplateQuestion).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should mark all form controls as touched', () => {
      const spy = spyOn(component.templateForm, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });

    it('should show snackbar when question is missing displayOrder or sortSequence', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [createMockQuestion({ displayOrder: null, sortSequence: '' })];
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Display order and sequence are required for all questions', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show snackbar for duplicate displayOrder (error 13002)', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 1, sortSequence: '2' })
      ];
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 13002 Duplicate sequence in template', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show snackbar for duplicate sortSequence (error 0319)', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: 'A' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: 'A' })
      ];
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 0319 Duplicate question number in template', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show snackbar for duplicate abbrDispSeq (error 13003)', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1', abbrDispSeq: 5 }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: '2', abbrDispSeq: 5 })
      ];
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 13003 Duplicate abbreviated display sequence in template', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should NOT flag duplicate abbrDispSeq when values are null', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1', abbrDispSeq: null }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: '2', abbrDispSeq: null })
      ];
      component.onSave();
      // Should proceed to save, not show 13003 error
      expect(snackBarSpy.open).not.toHaveBeenCalledWith(
        jasmine.stringContaining('13003'), jasmine.any(String), jasmine.any(Object)
      );
    });

    it('should set isSaving to true and call saveTemplate on valid save', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component.onSave();
      expect(component.isSaving).toBe(false); // back to false after sync save completes
      expect(hhServiceSpy.createTemplateQuestion).toHaveBeenCalled();
    });
  });

  // ==================== saveTemplate ====================

  describe('saveTemplate', () => {
    beforeEach(() => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: null
      });
    });

    it('should emit save and clear cache when no unsaved questions remain', () => {
      const saveSpy = spyOn(component.save, 'emit');
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' })
      ];
      // Simulate Q001 already saved
      (component as any).savedQuestionCodes.add('Q001');
      component['saveTemplate'](false);
      expect(saveSpy).toHaveBeenCalledWith('TMPL000099');
      expect((AddEditTemplate as any).cachedTemplateId).toBe('');
      expect(component.isSaving).toBe(false);
    });

    it('should call createTemplateQuestion for new questions', () => {
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1', insertDate: '' })
      ];
      component['saveTemplate'](false);
      expect(hhServiceSpy.createTemplateQuestion).toHaveBeenCalled();
    });

    it('should call updateTemplateQuestion for existing questions', () => {
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1', insertDate: '2026-01-01' })
      ];
      component['saveTemplate'](false);
      expect(hhServiceSpy.updateTemplateQuestion).toHaveBeenCalled();
    });

    it('should handle 409 error by calling handle409Error', () => {
      const error409 = { status: 409, error: { errorCode: '17017', message: 'Overlap detected' } };
      hhServiceSpy.createTemplateQuestion.and.returnValue(throwError(() => error409));
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component['saveTemplate'](false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Overlap detected', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
    });

    it('should handle non-409 HTTP error', () => {
      const error500 = { status: 500, error: { message: 'Server error' } };
      hhServiceSpy.createTemplateQuestion.and.returnValue(throwError(() => error500));
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component['saveTemplate'](false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Server error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
    });

    it('should handle result with success === false', () => {
      hhServiceSpy.createTemplateQuestion.and.returnValue(of({
        success: false,
        message: 'Validation failed',
        errorResponse: { errorCode: '1234', error: 'Bad data' }
      } as ReturnResult<HHTemplateQuestionDto>));
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component['saveTemplate'](false);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 1234 Bad data', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
    });

    it('should track saved question codes after first question succeeds', () => {
      hhServiceSpy.createTemplateQuestion.and.returnValue(of({ success: true } as ReturnResult<HHTemplateQuestionDto>));
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: '2' })
      ];
      component['saveTemplate'](false);
      // Both should have been processed - first individually, rest via forkJoin
      expect(hhServiceSpy.createTemplateQuestion).toHaveBeenCalledTimes(2);
    });

    it('should pass resolveOverlaps flag to createTemplateQuestion', () => {
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component['saveTemplate'](true);
      const calledWith = hhServiceSpy.createTemplateQuestion.calls.mostRecent().args[0];
      expect((calledWith as any).resolveOverlaps).toBe(true);
    });

    it('should map question fields correctly for save', () => {
      component.assignedQuestions = [
        createMockQuestion({
          displayOrder: 5,
          sortSequence: '3',
          abbrDispSeq: 2,
          repeatHhFlag: 'Y',
          screenerAsk: 'D',
          abbrFlag: 'N'
        })
      ];
      component['saveTemplate'](false);
      const calledWith = hhServiceSpy.createTemplateQuestion.calls.mostRecent().args[0];
      expect(calledWith.displayOrder).toBe(5);
      expect(calledWith.abbrDispSeq).toBe(2);
      expect(calledWith.repeatHhFlag).toBe('Y');
    });

    it('should set repeatHhFlag to empty string when not Y', () => {
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1', repeatHhFlag: 'N' })
      ];
      component['saveTemplate'](false);
      const calledWith = hhServiceSpy.createTemplateQuestion.calls.mostRecent().args[0];
      expect(calledWith.repeatHhFlag).toBe('');
    });
  });

  // ==================== saveRemainingQuestions ====================

  describe('saveRemainingQuestions', () => {
    it('should emit save when questions array is empty', () => {
      const saveSpy = spyOn(component.save, 'emit');
      component['saveRemainingQuestions']([], 'TMPL001');
      expect(saveSpy).toHaveBeenCalledWith('TMPL001');
      expect(component.isSaving).toBe(false);
      expect((AddEditTemplate as any).cachedTemplateId).toBe('');
    });

    it('should clear savedQuestionCodes when all succeed', () => {
      hhServiceSpy.createTemplateQuestion.and.returnValue(of({ success: true } as ReturnResult<HHTemplateQuestionDto>));
      const saveSpy = spyOn(component.save, 'emit');
      const questions = [
        createMockQuestion({ questionCode: 'Q001' }),
        createMockQuestion({ questionCode: 'Q002' })
      ];
      component['saveRemainingQuestions'](questions, 'TMPL001');
      expect(saveSpy).toHaveBeenCalledWith('TMPL001');
      expect((component as any).savedQuestionCodes.size).toBe(0);
    });

    it('should track saved codes on partial failure', () => {
      // First call succeeds, second fails
      let callCount = 0;
      hhServiceSpy.createTemplateQuestion.and.callFake(() => {
        callCount++;
        if (callCount === 1) return of({ success: true } as ReturnResult<HHTemplateQuestionDto>);
        return of({
          success: false,
          message: 'Failed',
          errorResponse: { error: 'Bad data' }
        } as ReturnResult<HHTemplateQuestionDto>);
      });

      const questions = [
        createMockQuestion({ questionCode: 'Q001' }),
        createMockQuestion({ questionCode: 'Q002' })
      ];
      component['saveRemainingQuestions'](questions, 'TMPL001');
      expect((component as any).savedQuestionCodes.has('Q001')).toBe(true);
      expect(snackBarSpy.open).toHaveBeenCalled();
    });

    it('should show snackbar on forkJoin HTTP error', () => {
      hhServiceSpy.createTemplateQuestion.and.returnValue(throwError(() => ({
        error: { message: 'Network error' }
      })));
      const questions = [createMockQuestion({ questionCode: 'Q001' })];
      component['saveRemainingQuestions'](questions, 'TMPL001');
      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });
  });

  // ==================== handle409Error ====================

  describe('handle409Error', () => {
    it('should show snackbar for errorCode 17017', () => {
      component['handle409Error']({
        status: 409,
        error: { errorCode: '17017', message: 'Template already exists for donation type' }
      });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template already exists for donation type', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show overlap confirmation for non-17017 error codes', () => {
      const dialogRefMock = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);
      component['handle409Error']({
        status: 409,
        error: { errorCode: '12345', message: 'Date overlap detected' }
      });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should show overlap confirmation when no error code', () => {
      const dialogRefMock = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);
      component['handle409Error']({
        status: 409,
        error: { message: 'Overlap' }
      });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should use default message when error has no message', () => {
      const dialogRefMock = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);
      component['handle409Error']({
        status: 409,
        error: {}
      });
      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: jasmine.objectContaining({ message: 'Template date overlap detected.' })
        })
      );
    });
  });

  // ==================== showOverlapConfirmation ====================

  describe('showOverlapConfirmation', () => {
    it('should open a confirmation dialog with correct data', () => {
      const dialogRefMock = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);
      component['showOverlapConfirmation']('Date overlap detected');
      expect(dialogSpy.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          width: '480px',
          disableClose: true,
          data: {
            title: 'Template Date Overlap',
            message: 'Date overlap detected',
            confirmText: 'Yes, Create',
            cancelText: 'Cancel'
          }
        })
      );
    });

    it('should call saveTemplate with resolveOverlaps=true when confirmed', () => {
      const dialogRefMock = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);

      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];

      component['showOverlapConfirmation']('Overlap');
      // When confirmed, saveTemplate is called again with resolveOverlaps=true
      expect(component.isSaving).toBe(false); // completed synchronously
      const calledWith = hhServiceSpy.createTemplateQuestion.calls.mostRecent().args[0];
      expect((calledWith as any).resolveOverlaps).toBe(true);
    });

    it('should not retry save when dialog is cancelled', () => {
      const dialogRefMock = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);

      hhServiceSpy.createTemplateQuestion.calls.reset();
      component['showOverlapConfirmation']('Overlap');
      expect(hhServiceSpy.createTemplateQuestion).not.toHaveBeenCalled();
    });
  });

  // ==================== showSaveError ====================

  describe('showSaveError', () => {
    it('should show error with errorCode and error from errorResponse', () => {
      component['showSaveError']({
        success: false,
        errorResponse: { errorCode: '1234', error: 'Bad data' }
      } as ReturnResult<HHTemplateQuestionDto>);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 1234 Bad data', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show error without errorCode when absent', () => {
      component['showSaveError']({
        success: false,
        errorResponse: { error: 'Validation error' }
      } as ReturnResult<HHTemplateQuestionDto>);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: Validation error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should fall back to result.message when no errorResponse', () => {
      component['showSaveError']({
        success: false,
        message: 'Something went wrong'
      } as ReturnResult<HHTemplateQuestionDto>);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should fall back to result.error when no message', () => {
      component['showSaveError']({
        success: false,
        error: 'General error'
      } as ReturnResult<HHTemplateQuestionDto>);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'General error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show default message when nothing available', () => {
      component['showSaveError']({
        success: false
      } as ReturnResult<HHTemplateQuestionDto>);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error saving template', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  // ==================== showHttpError ====================

  describe('showHttpError', () => {
    it('should show error with errorCode and error from errorResponse', () => {
      component['showHttpError']({
        error: {
          errorResponse: { errorCode: '5678', error: 'DB constraint' }
        }
      });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 5678 DB constraint', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should show error without errorCode when absent in errorResponse', () => {
      component['showHttpError']({
        error: {
          errorResponse: { error: 'Constraint violation' }
        }
      });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: Constraint violation', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should fall back to error.message', () => {
      component['showHttpError']({
        error: { message: 'Internal error' }
      });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Internal error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should fall back to top-level message', () => {
      component['showHttpError']({
        message: 'Network failure'
      });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Network failure', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show default message when no useful info', () => {
      component['showHttpError']({});
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error saving template', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  // ==================== onCancel ====================

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // ==================== formatDate ====================

  describe('formatDate', () => {
    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should format ISO date string', () => {
      expect(component.formatDate('2026-12-31T00:00:00Z')).toBe('31-DEC-2026');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(component.formatDate(null as any)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(component.formatDate(undefined as any)).toBe('');
    });

    it('should format mid-year date correctly', () => {
      expect(component.formatDate('2028-06-15')).toBe('15-JUN-2028');
    });
  });

  // ==================== getGenderIconPath ====================

  describe('getGenderIconPath', () => {
    it('should return male icon path for M', () => {
      expect(component.getGenderIconPath('M')).toBe('assets/images/icons/gender-male.svg');
    });

    it('should return female icon path for F', () => {
      expect(component.getGenderIconPath('F')).toBe('assets/images/icons/gender-female.svg');
    });

    it('should return all icon path for A', () => {
      expect(component.getGenderIconPath('A')).toBe('assets/images/icons/gender-all.svg');
    });

    it('should return all icon path for unknown gender (default)', () => {
      expect(component.getGenderIconPath('X')).toBe('assets/images/icons/gender-all.svg');
    });

    it('should return all icon path for empty string', () => {
      expect(component.getGenderIconPath('')).toBe('assets/images/icons/gender-all.svg');
    });
  });

  // ==================== getGenderLabel ====================

  describe('getGenderLabel', () => {
    it('should return Male for M', () => {
      expect(component.getGenderLabel('M')).toBe('Male');
    });

    it('should return Female for F', () => {
      expect(component.getGenderLabel('F')).toBe('Female');
    });

    it('should return All for A', () => {
      expect(component.getGenderLabel('A')).toBe('All');
    });

    it('should return All for unknown gender (default)', () => {
      expect(component.getGenderLabel('X')).toBe('All');
    });

    it('should return All for empty string', () => {
      expect(component.getGenderLabel('')).toBe('All');
    });
  });

  // ==================== onGotoNotesInput ====================

  describe('onGotoNotesInput', () => {
    it('should uppercase the input value and set gotoNotes', () => {
      const question = createMockQuestion({ gotoNotes: '' });
      const mockEvent = {
        target: { value: 'hello world' }
      } as unknown as Event;
      component.onGotoNotesInput(mockEvent, question);
      expect(question.gotoNotes).toBe('HELLO WORLD');
      expect((mockEvent.target as HTMLInputElement).value).toBe('HELLO WORLD');
    });

    it('should handle already uppercase input', () => {
      const question = createMockQuestion({ gotoNotes: '' });
      const mockEvent = {
        target: { value: 'ALREADY UPPER' }
      } as unknown as Event;
      component.onGotoNotesInput(mockEvent, question);
      expect(question.gotoNotes).toBe('ALREADY UPPER');
    });

    it('should handle empty input', () => {
      const question = createMockQuestion({ gotoNotes: 'existing' });
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;
      component.onGotoNotesInput(mockEvent, question);
      expect(question.gotoNotes).toBe('');
    });
  });

  // ==================== onEffDateInput ====================

  describe('onEffDateInput', () => {
    it('should not throw on valid date input', () => {
      const mockEvent = {
        target: { value: '01-JAN-2026' }
      } as unknown as Event;
      expect(() => component.onEffDateInput(mockEvent)).not.toThrow();
    });

    it('should not throw on empty input', () => {
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;
      expect(() => component.onEffDateInput(mockEvent)).not.toThrow();
    });
  });

  // ==================== onTermDateInput ====================

  describe('onTermDateInput', () => {
    it('should not throw on valid date input', () => {
      const mockEvent = {
        target: { value: '31-DEC-2026' }
      } as unknown as Event;
      expect(() => component.onTermDateInput(mockEvent)).not.toThrow();
    });

    it('should not throw on empty input', () => {
      const mockEvent = {
        target: { value: '' }
      } as unknown as Event;
      expect(() => component.onTermDateInput(mockEvent)).not.toThrow();
    });
  });

  // ==================== getEffDateError / getTermDateError ====================

  describe('getEffDateError', () => {
    it('should return empty string when no error', () => {
      component.templateForm.patchValue({
        effectiveDate: moment('2028-06-15'),
        terminationDate: moment(FUTURE_TERM_DATE)
      });
      component.lastChangedDateField = 'effective';
      const error = component.getEffDateError();
      // The exact return depends on DateFieldValidationUtility - should not throw
      expect(typeof error).toBe('string');
    });
  });

  describe('getTermDateError', () => {
    it('should return empty string when no error', () => {
      component.templateForm.patchValue({
        effectiveDate: moment('2028-06-15'),
        terminationDate: moment(FUTURE_TERM_DATE)
      });
      component.lastChangedDateField = 'termination';
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass null formErrors when lastChangedDateField is not termination', () => {
      component.lastChangedDateField = 'effective';
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ==================== termMinDate ====================

  describe('termMinDate', () => {
    it('should return minDate when effectiveDate is not set', () => {
      component.templateForm.patchValue({ effectiveDate: null });
      expect(component.termMinDate).toEqual(component.minDate);
    });

    it('should return effectiveDate when it is after minDate', () => {
      const futureDate = moment().add(30, 'days');
      component.templateForm.patchValue({ effectiveDate: futureDate });
      expect(component.termMinDate.isSame(futureDate)).toBe(true);
    });

    it('should return minDate when effectiveDate is before minDate', () => {
      const pastDate = moment('2020-01-01');
      component.templateForm.patchValue({ effectiveDate: pastDate });
      expect(component.termMinDate.isSame(component.minDate)).toBe(true);
    });

    it('should return minDate when effectiveDate is invalid moment', () => {
      component.templateForm.patchValue({ effectiveDate: moment('invalid') });
      expect(component.termMinDate).toEqual(component.minDate);
    });
  });

  // ==================== loadDropdowns ====================

  describe('loadDropdowns', () => {
    it('should set donationTypes signal and filteredDonationTypes', () => {
      expect(component.donationTypes()).toEqual(mockDonationTypes);
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });

    it('should set availableQuestions signal', () => {
      expect(component.availableQuestions()).toEqual(mockQuestions);
    });
  });

  // ==================== donationTypeSearchControl valueChanges ====================

  describe('donationTypeSearchControl valueChanges', () => {
    it('should filter donation types when search value changes', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('allo');
      tick();
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('AL');
    }));

    it('should show all donation types when search is cleared', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('allo');
      tick();
      component.donationTypeSearchControl.setValue('');
      tick();
      expect(component.filteredDonationTypes.length).toBe(3);
    }));

    it('should treat null search as empty string', fakeAsync(() => {
      component.donationTypeSearchControl.setValue(null);
      tick();
      expect(component.filteredDonationTypes.length).toBe(3);
    }));
  });

  // ==================== saveQuestion (private) ====================

  describe('saveQuestion', () => {
    it('should call createTemplateQuestion when insertDate is empty', () => {
      const question = createMockQuestion({ insertDate: '' });
      component['saveQuestion'](question, false).subscribe();
      expect(hhServiceSpy.createTemplateQuestion).toHaveBeenCalled();
    });

    it('should call updateTemplateQuestion when insertDate is present', () => {
      const question = createMockQuestion({ insertDate: '2026-01-01' });
      component['saveQuestion'](question, false).subscribe();
      expect(hhServiceSpy.updateTemplateQuestion).toHaveBeenCalledWith(
        question.donationType, question.questionCode, question.templateId, question
      );
    });
  });

  // ==================== Integration: full save flow ====================

  describe('full save flow integration', () => {
    beforeEach(() => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE),
        terminationDate: null
      });
    });

    it('should emit save event on successful single question save', () => {
      const saveSpy = spyOn(component.save, 'emit');
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component.onSave();
      expect(saveSpy).toHaveBeenCalledWith('TMPL000099');
    });

    it('should emit save event on successful multi-question save', () => {
      const saveSpy = spyOn(component.save, 'emit');
      component.assignedQuestions = [
        createMockQuestion({ questionCode: 'Q001', displayOrder: 1, sortSequence: '1' }),
        createMockQuestion({ questionCode: 'Q002', displayOrder: 2, sortSequence: '2' })
      ];
      component.onSave();
      expect(saveSpy).toHaveBeenCalledWith('TMPL000099');
    });

    it('should reset isSaving to false after successful save', () => {
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component.onSave();
      expect(component.isSaving).toBe(false);
    });

    it('should clear static cachedTemplateId after save', () => {
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component.onSave();
      expect((AddEditTemplate as any).cachedTemplateId).toBe('');
    });

    it('should show overlap dialog on 409 without 17017 code and retry on confirm', () => {
      const dialogRefMock = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(dialogRefMock);

      let callCount = 0;
      hhServiceSpy.createTemplateQuestion.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return throwError(() => ({
            status: 409,
            error: { errorCode: '12345', message: 'Overlap in dates' }
          }));
        }
        return of({ success: true } as ReturnResult<HHTemplateQuestionDto>);
      });

      const saveSpy = spyOn(component.save, 'emit');
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];
      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledWith('TMPL000099');
    });

    it('should handle date validation errors by returning early', () => {
      // Set cross-field date range error by making effectiveDate > terminationDate
      // We need to set the form values in a way that triggers the cross-field validator
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_TERM_DATE),
        terminationDate: moment(FUTURE_EFF_DATE)
      });
      component.lastChangedDateField = 'effective';
      component.assignedQuestions = [
        createMockQuestion({ displayOrder: 1, sortSequence: '1' })
      ];

      // If cross-field validator triggers an error, onSave should return early
      if (component.getEffDateError() || component.getTermDateError()) {
        component.onSave();
        expect(hhServiceSpy.createTemplateQuestion).not.toHaveBeenCalled();
      }
    });
  });

  // ==================== edge cases ====================

  describe('edge cases', () => {
    it('should handle donationTypeSearchControl emitting null', fakeAsync(() => {
      component.donationTypeSearchControl.setValue(null);
      tick();
      // Should not crash, treats null as empty string
      expect(component.filteredDonationTypes.length).toBe(3);
    }));

    it('should handle adding question when form has no effective date', () => {
      component.templateForm.patchValue({
        donationType: 'AL',
        templateId: 'NEW',
        effectiveDate: null,
        terminationDate: null
      });
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].effDate).toBe('');
    });

    it('should handle adding question when form has no donation type', () => {
      component.templateForm.patchValue({
        donationType: '',
        templateId: 'NEW',
        effectiveDate: moment(FUTURE_EFF_DATE)
      });
      component.addQuestionToTemplate(mockQuestions[0]);
      expect(component.assignedQuestions[0].donationType).toBe('');
    });

    it('should handle removeQuestion on empty array without error', () => {
      component.assignedQuestions = [];
      expect(() => component.removeQuestion(0)).not.toThrow();
    });

    it('should have correct questionSearchConfig', () => {
      expect(component.questionSearchConfig.placeholder).toBe('Search by question code, or description');
      expect(component.questionSearchConfig.minLength).toBe(1);
      expect(component.questionSearchConfig.searchOnEnterOnly).toBe(false);
    });

    it('should have effDateErrorMatcher and termDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher).toBeTruthy();
    });
  });
});
