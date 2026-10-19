import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { Overlay } from '@angular/cdk/overlay';
import { QaLibraryComponent } from './qa-library';
import { QaLibraryApiService } from './services/qa-library-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { Question, Answer, CommentConfig } from './models/qa-library.models';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('QaLibraryComponent', () => {
  let overlaySpy: any;
  let apiServiceSpy: any;
  let component: QaLibraryComponent;
  let fixture: ComponentFixture<QaLibraryComponent>;
  let apiService: jasmine.SpyObj<QaLibraryApiService>;
  let overlay: jasmine.SpyObj<Overlay>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockQuestions: Question[] = [
    {
      questionCode: 'Q001',
      questionText: 'Test Question 1',
      sex: 'ALL',
      responseType: 'Single',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      isEditable: true,
      answerOptions: [],
      commentConfig: null
    },
    {
      questionCode: 'Q002',
      questionText: 'Test Question 2',
      sex: 'MALE',
      responseType: 'Multiple',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      isEditable: true,
      answerOptions: [],
      commentConfig: null
    },
    {
      questionCode: 'Q003',
      questionText: 'Test Question 3',
      sex: 'FEMALE',
      responseType: 'Comment',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      isEditable: false,
      answerOptions: [],
      commentConfig: {
        characterLimit: 240,
        answerCode: 'C001',
        answerDesc: 'Enter your comments here',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null
      }
    }
  ];

  const mockAnswers: Answer[] = [
    {
      sequence: 1,
      answerCode: 'A001',
      answerCodeDescription: 'Answer 1',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      auditKey: 1,
      isEditable: true,
      errors: {}
    },
    {
      sequence: 2,
      answerCode: 'A002',
      answerCodeDescription: 'Answer 2',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      auditKey: 1,
      isEditable: true,
      errors: {}
    }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('QaLibraryApiService', [
      'getQuestions',
      'createQuestion',
      'updateQuestion',
      'getAnswers',
      'saveAnswers'
    ]);
    overlaySpy = jasmine.createSpyObj('Overlay', [
      'position',
      'create',
      'scrollStrategies'
    ]);
    const snackbarSpy = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [
        QaLibraryComponent],
      providers: [
        provideHttpClient(),
        { provide: QaLibraryApiService, useValue: apiServiceSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    });


    


      apiServiceSpy.getQuestions.calls.reset();


      apiServiceSpy.createQuestion.calls.reset();


      apiServiceSpy.updateQuestion.calls.reset();


      apiServiceSpy.getAnswers.calls.reset();


      apiServiceSpy.saveAnswers.calls.reset();


      overlaySpy.position.calls.reset();


      overlaySpy.create.calls.reset();


      overlaySpy.scrollStrategies.calls.reset();


    apiService = TestBed.inject(QaLibraryApiService) as jasmine.SpyObj<QaLibraryApiService>;
    overlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    // Default mock responses
    apiService.getQuestions.and.returnValue(of(mockQuestions));
    apiService.getAnswers.and.returnValue(of(mockAnswers));

    fixture = TestBed.createComponent(QaLibraryComponent);
    component = fixture.componentInstance;


    });


  describe('initialization', () => {
    it('should load questions on init', () => {
      fixture.detectChanges();

      expect(apiService.getQuestions).toHaveBeenCalled();
      expect(component.allQuestions().length).toBe(3);
      expect(component.questions().length).toBe(3);
    });

    it('should auto-select first question on load', () => {
      fixture.detectChanges();

      expect(component.selectedQuestion()?.questionCode).toBe('Q001');
    });



    it('should handle errors when loading questions', () => {
      const error = new Error('Network error');
      apiService.getQuestions.and.returnValue(throwError(() => error));

      component.loadQuestions();

      expect(snackbarService.showError).toHaveBeenCalledWith('Network error');
      expect(component.isLoading()).toBe(false);
    });


  });

  describe('search functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });









    it('should auto-select first question after search', () => {
      // Clear existing selection so auto-select logic triggers
      component.selectedQuestion.set(null);
      component.onSearch('Q002');

      expect(component.selectedQuestion()?.questionCode).toBe('Q002');
    });
  });

  describe('client-side filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should filter by effective date (After)', () => {
      const filterDate = new Date('2023-12-31');
      component.applyFilters({
        effectiveDate: filterDate,
        effectiveDatePeriod: 'After'
      });

      expect(component.questions().length).toBe(3);
    });

    it('should filter by effective date (Before)', () => {
      const filterDate = new Date('2023-12-31');
      component.applyFilters({
        effectiveDate: filterDate,
        effectiveDatePeriod: 'Before'
      });

      expect(component.questions().length).toBe(0);
    });





    it('should set appliedFilters signal', () => {
      const filters: any = { sex: 'MALE' };
      component.applyFilters(filters);

      expect(component.appliedFilters()).toEqual(filters);
    });

    it('should compute hasActiveFilters correctly', () => {
      expect(component.hasActiveFilters()).toBe(false);

      component.applyFilters({ sex: 'MALE' } as any);
      expect(component.hasActiveFilters()).toBe(true);

      component.applyFilters({} as any);
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('question selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select question and load answers for Single type', () => {
      const question = mockQuestions[0]; // Single type
      component.onQuestionSelected(question);

      expect(component.selectedQuestion()?.questionCode).toBe('Q001');
      expect(apiService.getAnswers).toHaveBeenCalledWith('Q001');
      expect(component.formMode).toBe('edit');
    });

    it('should select question and load answers for Multiple type', () => {
      const question = mockQuestions[1]; // Multiple type
      component.onQuestionSelected(question);

      expect(apiService.getAnswers).toHaveBeenCalledWith('Q002');
    });

    it('should call getAnswers for Comment type and map answer to commentConfig', () => {
      const commentAnswer: Answer = {
        sequence: 1,
        answerCode: 'C001',
        answerCodeDescription: 'Enter your comments here',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        auditKey: 1,
        isEditable: true,
        errors: {}
      };
      apiService.getAnswers.and.returnValue(of([commentAnswer]));
      apiService.getAnswers.calls.reset();

      const question = { ...mockQuestions[2] }; // Comment type
      component.onQuestionSelected(question);

      expect(apiService.getAnswers).toHaveBeenCalledWith('Q003');
      const selected = component.selectedQuestion();
      expect(selected?.commentConfig?.answerCode).toBe('C001');
      expect(selected?.commentConfig?.answerDesc).toBe('Enter your comments here');
      expect(selected?.commentConfig?.effectiveDate).toEqual(new Date('2024-01-01'));
      expect(selected?.commentConfig?.terminationDate).toBeNull();
      expect(selected?.answerOptions).toEqual([]);
    });



    it('should handle errors when loading answers', () => {
      const error = new Error('Network error');
      apiService.getAnswers.and.returnValue(throwError(() => error));

      component.onQuestionSelected(mockQuestions[0]);

      expect(snackbarService.showError).toHaveBeenCalledWith('Network error');
      expect(component.selectedQuestion()?.answerOptions).toEqual([]);
    });
  });

  describe('create question', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set up new question in add mode', () => {
      component.createQuestion();

      const newQuestion = component.selectedQuestion();
      expect(newQuestion?.questionCode).toBe('');
      expect(newQuestion?.sex).toBe('');
      expect(newQuestion?.responseType).toBe('Single');
      expect(newQuestion?.isEditable).toBe(true);
      expect(component.formMode).toBe('add');
    });
  });

  describe('save operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create new question without answers', (done) => {
      component.formMode = 'add';
      const newQuestion: Question = {
        questionCode: 'Q004',
        questionText: 'New Question',
        sex: 'ALL',
        responseType: 'Comment',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        isEditable: true,
        answerOptions: [],
        commentConfig: null
      };

      apiService.createQuestion.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of([...mockQuestions, newQuestion]));

      component.onSave({ question: newQuestion, questionChanged: true, answersChanged: false });

      setTimeout(() => {
        expect(apiService.createQuestion).toHaveBeenCalledWith(newQuestion);
        expect(apiService.saveAnswers).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should create question with answers', (done) => {
      component.formMode = 'add';
      const newQuestion: Question = {
        questionCode: 'Q004',
        questionText: 'New Question',
        sex: 'ALL',
        responseType: 'Single',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        isEditable: true,
        answerOptions: mockAnswers,
        commentConfig: null
      };

      apiService.createQuestion.and.returnValue(of(undefined as any));
      apiService.saveAnswers.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of([...mockQuestions, newQuestion]));

      component.onSave({ question: newQuestion, questionChanged: true, answersChanged: true });

      setTimeout(() => {
        expect(apiService.createQuestion).toHaveBeenCalled();
        expect(apiService.saveAnswers).toHaveBeenCalledWith('Q004', mockAnswers);
        done();
      }, 100);
    });

    it('should call saveAnswers with comment answer in ADD mode for Comment type', (done) => {
      component.formMode = 'add';
      const commentConfig: CommentConfig = {
        characterLimit: 240,
        answerCode: 'CMT',
        answerDesc: 'Enter your comments here',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null
      };
      const newQuestion: Question = {
        questionCode: 'Q005',
        questionText: 'Comment Question',
        sex: 'ALL',
        responseType: 'Comment',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        isEditable: true,
        answerOptions: [],
        commentConfig
      };

      apiService.createQuestion.and.returnValue(of({ success: true, message: 'Created' } as any));
      apiService.saveAnswers.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of([...mockQuestions, newQuestion]));

      component.onSave({ question: newQuestion, questionChanged: true, answersChanged: true });

      setTimeout(() => {
        expect(apiService.createQuestion).toHaveBeenCalled();
        expect(apiService.saveAnswers).toHaveBeenCalledWith('Q005', [
          jasmine.objectContaining({
            answerCode: 'CMT',
            answerCodeDescription: 'Enter your comments here',
            sequence: 1,
            effectiveDate: new Date('2024-01-01'),
            terminationDate: null
          })
        ]);
        done();
      }, 100);
    });



    it('should update existing question', (done) => {
      component.formMode = 'edit';
      component.selectedQuestion.set(mockQuestions[0]);

      const updatedQuestion: Question = {
        ...mockQuestions[0],
        questionText: 'Updated Question'
      };

      apiService.updateQuestion.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of(mockQuestions));

      component.onSave({ question: updatedQuestion, questionChanged: true, answersChanged: false });

      setTimeout(() => {
        expect(apiService.updateQuestion).toHaveBeenCalledWith('Q001', updatedQuestion);
        done();
      }, 100);
    });

    it('should update question and answers in parallel', (done) => {
      component.formMode = 'edit';
      component.selectedQuestion.set(mockQuestions[0]);

      const updatedQuestion: Question = {
        ...mockQuestions[0],
        answerOptions: mockAnswers
      };

      apiService.updateQuestion.and.returnValue(of(undefined as any));
      apiService.saveAnswers.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of(mockQuestions));

      component.onSave({ question: updatedQuestion, questionChanged: true, answersChanged: true });

      setTimeout(() => {
        expect(apiService.updateQuestion).toHaveBeenCalled();
        expect(apiService.saveAnswers).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should call saveAnswers with comment answer in EDIT mode for Comment type', (done) => {
      component.formMode = 'edit';
      component.selectedQuestion.set(mockQuestions[2]); // Comment type, code Q003

      const commentConfig: CommentConfig = {
        characterLimit: 240,
        answerCode: 'CMT',
        answerDesc: 'Updated comment text',
        effectiveDate: new Date('2024-06-01'),
        terminationDate: new Date('2025-12-31')
      };
      const updatedQuestion: Question = {
        ...mockQuestions[2],
        commentConfig
      };

      apiService.saveAnswers.and.returnValue(of({ success: true, message: 'Saved' } as any));
      apiService.getQuestions.and.returnValue(of(mockQuestions));

      component.onSave({ question: updatedQuestion, questionChanged: false, answersChanged: true });

      setTimeout(() => {
        expect(apiService.saveAnswers).toHaveBeenCalledWith('Q003', [
          jasmine.objectContaining({
            answerCode: 'CMT',
            sequence: 1,
            effectiveDate: new Date('2024-06-01'),
            terminationDate: new Date('2025-12-31')
          })
        ]);
        done();
      }, 100);
    });

    it('should call saveAnswers with empty array in EDIT mode for Comment type when commentConfig has no answerCode', (done) => {
      component.formMode = 'edit';
      component.selectedQuestion.set(mockQuestions[2]); // Comment type, code Q003

      const updatedQuestion: Question = {
        ...mockQuestions[2],
        commentConfig: { characterLimit: 240, answerCode: '', answerDesc: '', effectiveDate: null, terminationDate: null }
      };

      apiService.saveAnswers.and.returnValue(of(undefined as any));
      apiService.getQuestions.and.returnValue(of(mockQuestions));

      component.onSave({ question: updatedQuestion, questionChanged: false, answersChanged: true });

      setTimeout(() => {
        expect(apiService.saveAnswers).toHaveBeenCalledWith('Q003', []);
        done();
      }, 100);
    });

    it('should handle create errors', () => {
      component.formMode = 'add';
      const error = new Error('Create failed');
      apiService.createQuestion.and.returnValue(throwError(() => error));

      component.onSave({ question: mockQuestions[0], questionChanged: true, answersChanged: false });

      expect(snackbarService.showError).toHaveBeenCalledWith('Create failed');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle update errors', () => {
      component.formMode = 'edit';
      component.selectedQuestion.set(mockQuestions[0]);
      const error = new Error('Update failed');
      apiService.updateQuestion.and.returnValue(throwError(() => error));

      component.onSave({ question: mockQuestions[0], questionChanged: true, answersChanged: false });

      expect(snackbarService.showError).toHaveBeenCalledWith('Update failed');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('cancel operation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should revert to first question when canceling', () => {
      component.selectedQuestion.set(mockQuestions[1]);

      component.onCancel();

      expect(component.selectedQuestion()?.questionCode).toBe('Q001');
    });

    it('should set selectedQuestion to null if no questions', () => {
      component.questions.set([]);

      component.onCancel();

      expect(component.selectedQuestion()).toBeNull();
    });
  });

  describe('clear all operation', () => {
    it('should log clear all action', () => {
      spyOn(console, 'log');

      component.onClearAll();

      expect(console.log).toHaveBeenCalledWith('Clear all form fields');
    });
  });

  describe('clearFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should work when called with no active filters', () => {
      expect(() => component.clearFilters()).not.toThrow();
      expect(component.appliedFilters()).toBeNull();
    });
  });
});
