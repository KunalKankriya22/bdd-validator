import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { SurveyQuestionService } from './survey-question.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';

describe('SurveyQuestionService', () => {
  let service: SurveyQuestionService;
  let apiService: jasmine.SpyObj<ApiService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    const headerServiceSpy = jasmine.createSpyObj('HeaderService', ['chapterId']);
    headerServiceSpy.chapterId.and.returnValue('CH1');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SurveyQuestionService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(SurveyQuestionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
  });

  // ── getAllQuestions ───────────────────────────────────────────────────────────

  describe('getAllQuestions', () => {
    it('should map API response to SurveyQuestionModel array with gender mapping', (done) => {
      // Arrange
      const apiData = [
        { chapterId: 'CH1', questionCode: 'Q1', questionDesc: 'Desc', gender: 'M', responseType: 'YN', effDate: '2024-01-01', isEditable: 1 },
        { chapterId: 'CH1', questionCode: 'Q2', questionDesc: 'Desc2', gender: 'F', responseType: 'YN', effDate: '2024-01-01', isEditable: 0 },
        { chapterId: 'CH1', questionCode: 'Q3', questionDesc: 'Desc3', gender: 'A', responseType: 'YN', effDate: '2024-01-01', isEditable: 1 }
      ];
      apiService.get.and.returnValue(of({ data: apiData }));

      // Act
      service.getAllQuestions().subscribe((result) => {
        // Assert
        expect(result.length).toBe(3);
        expect(result[0].sex).toBe('Male');
        expect(result[1].sex).toBe('Female');
        expect(result[2].sex).toBe('All');
        expect(result[0].questionId).toBe('Q1');
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: null }));

      // Act
      service.getAllQuestions().subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should map unknown gender to All', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({
        data: [{ chapterId: 'CH1', questionCode: 'Q1', questionDesc: 'D', gender: 'X', responseType: 'YN', effDate: '2024-01-01', isEditable: 1 }]
      }));

      // Act
      service.getAllQuestions().subscribe((result) => {
        // Assert
        expect(result[0].sex).toBe('All');
        done();
      });
    });

    it('should propagate errors', (done) => {
      // Arrange
      const error = new Error('Network error');
      apiService.get.and.returnValue(throwError(() => error));

      // Act
      service.getAllQuestions().subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ── getQuestionById ──────────────────────────────────────────────────────────

  describe('getQuestionById', () => {
    it('should return first item from data array', (done) => {
      // Arrange
      const mockQuestion = { questionId: 'Q1', description: 'Test' } as any;
      apiService.get.and.returnValue(of({ data: [mockQuestion] }));

      // Act
      service.getQuestionById('Q1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockQuestion);
        expect(apiService.get).toHaveBeenCalledWith(API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.GET_BY_ID('Q1'));
        done();
      });
    });

    it('should return null when data is empty', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ data: [] }));

      // Act
      service.getQuestionById('Q1').subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });
  });

  // ── getAssignedQuestions ─────────────────────────────────────────────────────

  describe('getAssignedQuestions', () => {
    it('should use chapterId from HeaderService and return data', (done) => {
      // Arrange
      const mockData = [{ questionCode: 'Q1' }] as any[];
      apiService.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getAssignedQuestions('TPL1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        expect(headerService.chapterId).toHaveBeenCalled();
        expect(apiService.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.TEMPLATE_QUESTIONS.GET_ASSIGNED('TPL1', 'CH1')
        );
        done();
      });
    });
  });

  // ── assignQuestions ──────────────────────────────────────────────────────────

  describe('assignQuestions', () => {
    it('should POST and return success/message from response', (done) => {
      // Arrange
      const dto = { templateId: 'TPL1', chapterId: 'CH1', questions: [] } as any;
      apiService.post.and.returnValue(of({ success: true, message: 'Done' }));

      // Act
      service.assignQuestions(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true, message: 'Done' });
        done();
      });
    });

    it('should use default message when response message is empty', (done) => {
      // Arrange
      const dto = { templateId: 'TPL1', chapterId: 'CH1', questions: [] } as any;
      apiService.post.and.returnValue(of({ success: false }));

      // Act
      service.assignQuestions(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: false, message: 'Questions assigned successfully' });
        done();
      });
    });
  });

  // ── updateQuestionSequence ───────────────────────────────────────────────────

  describe('updateQuestionSequence', () => {
    it('should PUT and return success/message', (done) => {
      // Arrange
      const dto = { templateId: 'TPL1', chapterId: 'CH1', sequences: [] } as any;
      apiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      // Act
      service.updateQuestionSequence(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true, message: 'Updated' });
        done();
      });
    });

    it('should use default message when response message is empty', (done) => {
      // Arrange
      const dto = { templateId: 'TPL1', chapterId: 'CH1', sequences: [] } as any;
      apiService.put.and.returnValue(of({ success: false }));

      // Act
      service.updateQuestionSequence(dto).subscribe((result) => {
        // Assert
        expect(result.message).toBe('Sequence updated successfully');
        done();
      });
    });
  });

  // ── createQuestion ───────────────────────────────────────────────────────────

  describe('createQuestion', () => {
    it('should POST and return success/message', (done) => {
      // Arrange
      const data = { questionCode: 'Q1' };
      apiService.post.and.returnValue(of({ success: true, message: 'Created' }));

      // Act
      service.createQuestion(data).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true, message: 'Created' });
        expect(apiService.post).toHaveBeenCalledWith(API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.CREATE, data);
        done();
      });
    });
  });

  // ── updateQuestion ───────────────────────────────────────────────────────────

  describe('updateQuestion', () => {
    it('should PUT and return success/message', (done) => {
      // Arrange
      const data = { questionCode: 'Q1' };
      apiService.put.and.returnValue(of({ success: true, message: 'Updated' }));

      // Act
      service.updateQuestion(data).subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true, message: 'Updated' });
        expect(apiService.put).toHaveBeenCalledWith(API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.UPDATE, data);
        done();
      });
    });
  });

  // ── getQuestionAnswers ───────────────────────────────────────────────────────

  describe('getQuestionAnswers', () => {
    it('should return data array for given questionCode', (done) => {
      // Arrange
      const mockData = [{ answerCode: 'A1' }] as any[];
      apiService.get.and.returnValue(of({ data: mockData }));

      // Act
      service.getQuestionAnswers('Q1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData);
        expect(apiService.get).toHaveBeenCalledWith(API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.GET_ANSWERS('Q1'));
        done();
      });
    });
  });

  // ── deleteQuestion ───────────────────────────────────────────────────────────

  describe('deleteQuestion', () => {
    it('should use chapterId from HeaderService and call DELETE', (done) => {
      // Arrange
      apiService.delete.and.returnValue(of({ success: true, message: 'Deleted' }));

      // Act
      service.deleteQuestion('Q1').subscribe((result) => {
        // Assert
        expect(result).toEqual({ success: true, message: 'Deleted' });
        expect(headerService.chapterId).toHaveBeenCalled();
        expect(apiService.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.SURVEY_QUESTIONS.DELETE('Q1', 'CH1')
        );
        done();
      });
    });
  });
});
