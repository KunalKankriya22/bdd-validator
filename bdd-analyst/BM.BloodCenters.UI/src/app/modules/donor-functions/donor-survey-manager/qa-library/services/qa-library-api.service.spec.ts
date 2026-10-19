import { TestBed } from '@angular/core/testing';
import { QaLibraryApiService } from './qa-library-api.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  SurveyQuestionResponseDto,
  SurveyAnswerResponseDto,
  Question,
  Answer
} from '../models/qa-library.models';

describe('QaLibraryApiService', () => {
  let service: QaLibraryApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

        service = new QaLibraryApiService(apiServiceSpy as any);
    apiService = apiServiceSpy;
  });


  describe('getQuestions', () => {
    it('should fetch and map questions successfully', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        data: [
          {
            chapterId: 'CH001',
            questionCode: 'Q001',
            questionDesc: 'Test Question',
            typeOfSurvey: null,
            gender: 'A',
            responseType: 'S',
            effDate: '2024-01-01T00:00:00Z',
            termDate: '2024-12-31T00:00:00Z',
            isEditable: 1
          }
        ],
        errorResponse: { errorCode: '', error: '' }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getQuestions().subscribe({
        next: (questions) => {
          expect(questions.length).toBe(1);
          expect(questions[0].questionCode).toBe('Q001');
          expect(questions[0].questionText).toBe('Test Question');
          expect(questions[0].sex).toBe('ALL');
          expect(questions[0].responseType).toBe('Single');
          expect(questions[0].isEditable).toBe(true);
          done();
        }
      });
    });



    it('should map response type codes correctly', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            chapterId: 'CH001',
            questionCode: 'Q001',
            questionDesc: 'Single Question',
            gender: 'A',
            responseType: 'S',
            effDate: '2024-01-01T00:00:00Z',
            isEditable: 1
          },
          {
            chapterId: 'CH002',
            questionCode: 'Q002',
            questionDesc: 'Multiple Question',
            gender: 'A',
            responseType: 'M',
            effDate: '2024-01-01T00:00:00Z',
            isEditable: 1
          },
          {
            chapterId: 'CH003',
            questionCode: 'Q003',
            questionDesc: 'Comment Question',
            gender: 'A',
            responseType: 'C',
            effDate: '2024-01-01T00:00:00Z',
            isEditable: 1
          },
          {
            chapterId: 'CH004',
            questionCode: 'Q004',
            questionDesc: 'Ranking Question',
            gender: 'A',
            responseType: 'R',
            effDate: '2024-01-01T00:00:00Z',
            isEditable: 1
          }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getQuestions().subscribe({
        next: (questions) => {
          expect(questions[0].responseType).toBe('Single');
          expect(questions[1].responseType).toBe('Multiple');
          expect(questions[2].responseType).toBe('Comment');
          expect(questions[3].responseType).toBe('Ranking');
          done();
        }
      });
    });


  });

  describe('createQuestion', () => {
    it('should create question successfully', (done) => {
      const question: Question = {
        questionCode: 'Q001',
        questionText: 'New Question',
        sex: 'ALL',
        responseType: 'Single',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        isEditable: true,
        answerOptions: [],
        commentConfig: null
      };

      apiService.post.and.returnValue(of(void 0));

      service.createQuestion(question).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            '/api/v1/donor-survey-manager/questions',
            jasmine.objectContaining({
              questionCode: 'Q001',
              questionDesc: 'New Question',
              gender: 'A',
              responseType: 'S'
            })
          );
          done();
        }
      });
    });

    it('should map frontend gender to backend', (done) => {
      const question: Question = {
        questionCode: 'Q001',
        questionText: 'Male Question',
        sex: 'MALE',
        responseType: 'Single',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        isEditable: true,
        answerOptions: [],
        commentConfig: null
      };

      apiService.post.and.returnValue(of(void 0));

      service.createQuestion(question).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args[1];
          expect(callArgs.gender).toBe('M');
          done();
        }
      });
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', (done) => {
      const question: Question = {
        questionCode: 'Q001',
        questionText: 'Updated Question',
        sex: 'FEMALE',
        responseType: 'Multiple',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: new Date('2024-12-31'),
        isEditable: true,
        answerOptions: [],
        commentConfig: null
      };

      apiService.put.and.returnValue(of(void 0));

      service.updateQuestion('Q001', question).subscribe({
        next: () => {
          expect(apiService.put).toHaveBeenCalledWith(
            '/api/v1/donor-survey-manager/questions/Q001',
            jasmine.objectContaining({
              questionDesc: 'Updated Question',
              gender: 'F',
              responseType: 'M'
            })
          );
          done();
        }
      });
    });
  });

  describe('getAnswers', () => {
    it('should fetch and map answers successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            chapterId: 'CH001',
            questionCode: 'Q001',
            answerCode: 'A001',
            answerDesc: 'Answer 1',
            displaySeq: 1,
            effDate: '2024-01-01T00:00:00Z',
            termDate: null,
            isEditable: 1
          },
          {
            chapterId: 'CH001',
            questionCode: 'Q001',
            answerCode: 'A002',
            answerDesc: 'Answer 2',
            displaySeq: 2,
            effDate: '2024-01-01T00:00:00Z',
            termDate: '2024-12-31T00:00:00Z',
            isEditable: 0
          }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getAnswers('Q001').subscribe({
        next: (answers) => {
          expect(answers.length).toBe(2);
          expect(answers[0].sequence).toBe(1);
          expect(answers[0].answerCode).toBe('A001');
          expect(answers[0].answerCodeDescription).toBe('Answer 1');
          expect(answers[1].terminationDate).toBeDefined();
          done();
        }
      });
    });

    it('should handle missing displaySeq', (done) => {
      const mockResponse = {
        success: true,
        data: [
          {
            chapterId: 'CH001',
            questionCode: 'Q001',
            answerCode: 'A001',
            answerDesc: 'Answer 1',
            displaySeq: null,
            effDate: '2024-01-01T00:00:00Z',
            isEditable: 1
          }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getAnswers('Q001').subscribe({
        next: (answers) => {
          expect(answers[0].sequence).toBe(0);
          done();
        }
      });
    });
  });

  describe('saveAnswers', () => {
    it('should save answers successfully', (done) => {
      const answers: Answer[] = [
        {
          sequence: 1,
          answerCode: 'A001',
          answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: null,
          auditKey: 0,
          isEditable: true,
          errors: {}
        },
        {
          sequence: 2,
          answerCode: 'A002',
          answerCodeDescription: 'Answer 2',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: new Date('2024-12-31'),
          auditKey: 1,
          isEditable: true,
          errors: {}
        }
      ];

      apiService.put.and.returnValue(of(void 0));

      service.saveAnswers('Q001', answers).subscribe({
        next: () => {
          expect(apiService.put).toHaveBeenCalledWith(
            '/api/v1/donor-survey-manager/questions/Q001/answers',
            jasmine.any(Array)
          );
          const callArgs = apiService.put.calls.mostRecent().args[1];
          expect(callArgs.length).toBe(2);
          expect(callArgs[0].answerCode).toBe('A001');
          expect(callArgs[0].displaySeq).toBe(1);
          done();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle 400 errors', (done) => {
      const mockError = {
        status: 400,
        error: { message: 'Invalid request' }
      };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getQuestions().subscribe({
        error: (err) => {
          expect(err.message).toContain('Invalid request');
          done();
        }
      });
    });



    it('should handle 409 errors', (done) => {
      const mockError = {
        status: 409,
        error: { message: 'Already exists' }
      };
      apiService.post.and.returnValue(throwError(() => mockError));

      const question: Question = {
        questionCode: 'Q001',
        questionText: 'Test',
        sex: 'ALL',
        responseType: 'Single',
        effectiveDate: new Date(),
        terminationDate: null,
        isEditable: true,
        answerOptions: [],
        commentConfig: null
      };

      service.createQuestion(question).subscribe({
        error: (err) => {
          expect(err.message).toContain('Already exists');
          done();
        }
      });
    });


  });
});
