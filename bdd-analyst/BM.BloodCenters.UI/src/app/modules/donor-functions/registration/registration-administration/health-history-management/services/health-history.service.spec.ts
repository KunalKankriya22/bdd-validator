import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HealthHistoryService } from './health-history.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  HHQuestionModel,
  HHResponseModel,
  HHResponseCommentModel,
  HHTemplateQuestionDto,
  ReturnResult,
  GenderDropdownOption,
  InterdictionCodeOption,
  PeriodTypeOption,
  DropdownOption,
  QuestionDropdownOption,
  TemplateListItem
} from '../models/health-history.model';

describe('HealthHistoryService', () => {
  let service: HealthHistoryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let consoleSpy: jasmine.Spy;

  const mockQuestion: HHQuestionModel = {
    questionCode: 'D52',
    refCode: '5',
    questionDescription: 'Ever had chest pain?',
    gender: 'M',
    readMoreFlag: 'Y',
    manualAuditFlag: 'Y',
    manualAuditHistFlag: '',
    validateLookBackDate: 'Yes',
    periodTypeForLookBack: 'Days',
    periodNumberForLookBack: 12,
    effectiveDate: '2024-01-01',
    terminationDate: '2027-12-31'
  };

  const mockAnswer: HHResponseModel = {
    questionCode: 'D52',
    response: 'Y',
    answerCode: 'A01',
    answerDescription: 'Yes',
    groupCode: 'GRP1',
    interdictionCode: 'INT1',
    deferralPeriod: 30,
    periodType: 'Days',
    commentRequired: 'N',
    manualAuditFlag: 'N',
    additionalDateFlag: 'N',
    effectiveDate: '2024-01-01'
  };

  const mockComment: HHResponseCommentModel = {
    commentCode: 'C01',
    commentDet: 'Test comment',
    effDate: '2024-01-01',
    termDate: '2027-12-31'
  };

  const mockTemplateQuestion: HHTemplateQuestionDto = {
    donationType: 'WB',
    questionCode: 'D52',
    templateId: 'TPL001',
    questionDescription: 'Ever had chest pain?',
    screenerAsk: 'Y',
    abbrFlag: 'N',
    abbrDispSeq: null,
    repeatHhFlag: 'N',
    gender: 'M',
    displayOrder: 1,
    sortSequence: '001',
    parentQuestionCode: '',
    subQuestionFlag: 'N',
    parentRespFlag: '',
    gotoNotes: '',
    effDate: '2024-01-01',
    termDate: null,
    validCodeType: '',
    randomizationFlag: 'N',
    programId: 'PROG1',
    insertDate: '2024-01-01',
    insertUser: 'admin',
    auditKey: 1,
    chapterId: 'CH01'
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        HealthHistoryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(HealthHistoryService);
    consoleSpy = spyOn(console, 'error');
  });

  // ==================== HH QUESTIONS ====================

  describe('searchQuestions', () => {
    it('should call POST with correct endpoint and return mapped response', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = {
        data: [mockQuestion],
        total: 1,
        success: true,
        message: 'Found'
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchQuestions({ searchFor: 'chest' }).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_QUESTIONS.SEARCH,
          { searchFor: 'chest' }
        );
        expect(result.data).toEqual([mockQuestion]);
        expect(result.totalRecords).toBe(1);
        expect(result.message).toBe('Found');
        done();
      });
    });

    it('should return empty data when response.data is null', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { data: undefined, total: undefined };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchQuestions({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty result on 404 error (error.error.statusCode)', (done) => {
      const error404 = { error: { statusCode: 404, message: 'Not found' }, status: 404 };
      apiServiceSpy.post.and.returnValue(throwError(() => error404));

      service.searchQuestions({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        expect(result.message).toBe('Not found');
        done();
      });
    });

    it('should return empty result on 404 when only error.status is 404', (done) => {
      const error404 = { status: 404 };
      apiServiceSpy.post.and.returnValue(throwError(() => error404));

      service.searchQuestions({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        expect(result.message).toBe('No health history questions found.');
        done();
      });
    });

    it('should return empty result on 404 when only error.error.statusCode is 404 (status differs)', (done) => {
      const error404 = { status: 400, error: { statusCode: 404, message: 'Custom 404 message' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error404));

      service.searchQuestions({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        expect(result.message).toBe('Custom 404 message');
        done();
      });
    });

    it('should rethrow non-404 errors and log to console', (done) => {
      const error500 = { status: 500, error: { statusCode: 500 } };
      apiServiceSpy.post.and.returnValue(throwError(() => error500));

      service.searchQuestions({}).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error searching health history questions:', error500);
          expect(err).toBe(error500);
          done();
        }
      });
    });

    it('should rethrow error when error has no error property', (done) => {
      const simpleError = { status: 500 };
      apiServiceSpy.post.and.returnValue(throwError(() => simpleError));

      service.searchQuestions({}).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error searching health history questions:', simpleError);
          expect(err).toBe(simpleError);
          done();
        }
      });
    });

    it('should rethrow error when error is null-like', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => null));

      service.searchQuestions({}).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error searching health history questions:', null);
          expect(err).toBeNull();
          done();
        }
      });
    });
  });

  describe('getQuestionByCode', () => {
    it('should call GET with correct endpoint and return item when present', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { item: mockQuestion };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getQuestionByCode('D52').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_QUESTIONS.GET_BY_CODE('D52'));
        expect(result).toBe(mockQuestion);
        done();
      });
    });

    it('should fallback to data[0] when item is undefined', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { data: [mockQuestion] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getQuestionByCode('D52').subscribe(result => {
        expect(result.questionCode).toBe('D52');
        done();
      });
    });

    it('should return undefined when both item and data are undefined', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = {};
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getQuestionByCode('D52').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should return undefined when item is undefined and data is empty', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getQuestionByCode('D52').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getQuestionByCode('D52').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching question by code:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createQuestion', () => {
    it('should call POST with correct endpoint, body, and HttpContext', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { success: true, message: 'Created' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createQuestion(mockQuestion).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_QUESTIONS.CREATE,
          mockQuestion,
          jasmine.objectContaining({ context: jasmine.any(Object) })
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle 409 duplicate (error.status) and set isDuplicate', (done) => {
      const error409 = { status: 409, error: { message: 'Duplicate code' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error409));

      service.createQuestion(mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate code');
          expect(consoleSpy).toHaveBeenCalledWith('Duplicate entry detected:', error409);
          done();
        }
      });
    });

    it('should handle 409 duplicate (error.error.statusCode)', (done) => {
      const error409 = { status: 400, error: { statusCode: 409 } };
      apiServiceSpy.post.and.returnValue(throwError(() => error409));

      service.createQuestion(mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate entry: This question code already exists.');
          done();
        }
      });
    });

    it('should handle 409 duplicate with no error.error property', (done) => {
      const error409 = { status: 409 };
      apiServiceSpy.post.and.returnValue(throwError(() => error409));

      service.createQuestion(mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate entry: This question code already exists.');
          done();
        }
      });
    });

    it('should rethrow non-409 errors and log to console', (done) => {
      const error500 = { status: 500 };
      apiServiceSpy.post.and.returnValue(throwError(() => error500));

      service.createQuestion(mockQuestion).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error creating question:', error500);
          expect(err).toBe(error500);
          done();
        }
      });
    });

    it('should rethrow errors with no status and no error body', (done) => {
      const genericError = new Error('Connection refused');
      apiServiceSpy.post.and.returnValue(throwError(() => genericError));

      service.createQuestion(mockQuestion).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error creating question:', genericError);
          expect(err).toBe(genericError);
          done();
        }
      });
    });
  });

  describe('updateQuestion', () => {
    it('should call PUT with correct endpoint, body, and HttpContext', (done) => {
      const mockResponse: ReturnResult<HHQuestionModel> = { success: true, message: 'Updated' };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateQuestion('D52', mockQuestion).subscribe(result => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_QUESTIONS.UPDATE('D52'),
          mockQuestion,
          jasmine.objectContaining({ context: jasmine.any(Object) })
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle 409 duplicate (error.status) and set isDuplicate', (done) => {
      const error409 = { status: 409, error: { message: 'Duplicate question' } };
      apiServiceSpy.put.and.returnValue(throwError(() => error409));

      service.updateQuestion('D52', mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate question');
          expect(consoleSpy).toHaveBeenCalledWith('Duplicate entry detected:', error409);
          done();
        }
      });
    });

    it('should handle 409 duplicate (error.error.statusCode)', (done) => {
      const error409 = { status: 400, error: { statusCode: 409 } };
      apiServiceSpy.put.and.returnValue(throwError(() => error409));

      service.updateQuestion('D52', mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate entry: This question already exists.');
          done();
        }
      });
    });

    it('should handle 409 duplicate with no error.error property', (done) => {
      const error409 = { status: 409 };
      apiServiceSpy.put.and.returnValue(throwError(() => error409));

      service.updateQuestion('D52', mockQuestion).subscribe({
        error: (err) => {
          expect(err.isDuplicate).toBe(true);
          expect(err.message).toBe('Duplicate entry: This question already exists.');
          done();
        }
      });
    });

    it('should rethrow non-409 errors and log to console', (done) => {
      const error500 = { status: 500 };
      apiServiceSpy.put.and.returnValue(throwError(() => error500));

      service.updateQuestion('D52', mockQuestion).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating question:', error500);
          expect(err).toBe(error500);
          done();
        }
      });
    });

    it('should rethrow errors with no status and no error body', (done) => {
      const genericError = new Error('Timeout');
      apiServiceSpy.put.and.returnValue(throwError(() => genericError));

      service.updateQuestion('D52', mockQuestion).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating question:', genericError);
          expect(err).toBe(genericError);
          done();
        }
      });
    });
  });

  describe('getGenderDropdown', () => {
    it('should call GET and return gender options', (done) => {
      const options: GenderDropdownOption[] = [
        { code: 'M', description: 'Male' },
        { code: 'F', description: 'Female' }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: options }));

      service.getGenderDropdown().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_QUESTIONS.GENDER_DROPDOWN);
        expect(result).toEqual(options);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getGenderDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getGenderDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getGenderDropdown().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching gender dropdown:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getInterdictionCodes', () => {
    it('should call GET and return interdiction codes', (done) => {
      const codes: InterdictionCodeOption[] = [{ code: 'INT1', description: 'Code 1' }];
      apiServiceSpy.get.and.returnValue(of({ data: codes }));

      service.getInterdictionCodes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_QUESTIONS.INTERDICTION_CODES);
        expect(result).toEqual(codes);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getInterdictionCodes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getInterdictionCodes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return multiple interdiction codes', (done) => {
      const codes: InterdictionCodeOption[] = [
        { code: 'INT1', description: 'Code 1' },
        { code: 'INT2', description: 'Code 2' },
        { code: 'INT3', description: 'Code 3' }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: codes }));

      service.getInterdictionCodes().subscribe(result => {
        expect(result.length).toBe(3);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getInterdictionCodes().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching interdiction codes:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==================== HH RESPONSES (ANSWERS) ====================

  describe('searchAnswers', () => {
    it('should call POST with correct endpoint and return response', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = {
        data: [mockAnswer],
        total: 1,
        success: true
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchAnswers(25, 0, { questionCode: 'D52' }).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.SEARCH(25, 0),
          { questionCode: 'D52' }
        );
        expect(result.data).toEqual([mockAnswer]);
        done();
      });
    });

    it('should pass through response without mapping', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = {
        data: [mockAnswer],
        total: 5,
        success: true,
        message: 'Results found'
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchAnswers(10, 5, { questionCode: 'D52' }).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.SEARCH(10, 5),
          { questionCode: 'D52' }
        );
        expect(result.total).toBe(5);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Results found');
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.searchAnswers(25, 0, {}).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error searching health history answers:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getAnswerByCode', () => {
    it('should call GET and return item when present', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = { item: mockAnswer };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAnswerByCode('D52', 'A01').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.GET_BY_CODE('D52', 'A01')
        );
        expect(result).toBe(mockAnswer);
        done();
      });
    });

    it('should fallback to data[0] when item is undefined', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = { data: [mockAnswer] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAnswerByCode('D52', 'A01').subscribe(result => {
        expect(result.answerCode).toBe('A01');
        done();
      });
    });

    it('should return undefined when both item and data are undefined', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = {};
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAnswerByCode('D52', 'A01').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should return undefined when item is undefined and data is empty', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = { data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAnswerByCode('D52', 'A01').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getAnswerByCode('D52', 'A01').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching answer by code:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createAnswer', () => {
    it('should call POST with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = { success: true };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createAnswer(mockAnswer).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.CREATE,
          mockAnswer
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createAnswer(mockAnswer).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error creating answer:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updateAnswer', () => {
    it('should call PUT with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<HHResponseModel> = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateAnswer('D52', 'A01', mockAnswer).subscribe(result => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.UPDATE('D52', 'A01'),
          mockAnswer
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateAnswer('D52', 'A01', mockAnswer).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating answer:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getGroupCodes', () => {
    it('should call GET without query params when no args provided', (done) => {
      const mockResponse = { data: [{ code: 'GRP1', description: 'Group 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getGroupCodes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_ANSWERS.GROUP_CODES);
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should append questionCode query param', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getGroupCodes('ADQ001').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.HEALTH_HISTORY_ANSWERS.GROUP_CODES}?questionCode=ADQ001`
        );
        done();
      });
    });

    it('should append both questionCode and responseCode query params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getGroupCodes('ADQ001', 'Y').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.HEALTH_HISTORY_ANSWERS.GROUP_CODES}?questionCode=ADQ001&responseCode=Y`
        );
        done();
      });
    });

    it('should append only responseCode when questionCode is not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getGroupCodes(undefined, 'Y').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.HEALTH_HISTORY_ANSWERS.GROUP_CODES}?responseCode=Y`
        );
        done();
      });
    });

    it('should not append params when both are empty strings', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getGroupCodes('', '').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_ANSWERS.GROUP_CODES);
        done();
      });
    });

    it('should encode special characters in query parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getGroupCodes('A&B', 'Y/N').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.HEALTH_HISTORY_ANSWERS.GROUP_CODES}?questionCode=A%26B&responseCode=Y%2FN`
        );
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getGroupCodes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getGroupCodes().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching group codes:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getPeriodTypes', () => {
    it('should call GET and return period types', (done) => {
      const types: PeriodTypeOption[] = [{ key: 'D', value: 'Days' }];
      apiServiceSpy.get.and.returnValue(of({ data: types }));

      service.getPeriodTypes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.HEALTH_HISTORY_ANSWERS.PERIOD_TYPES);
        expect(result).toEqual(types);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getPeriodTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getPeriodTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getPeriodTypes().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching period types:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==================== HH RESPONSE COMMENTS ====================

  describe('getResponseComments', () => {
    it('should call GET with correct endpoint and return comments', (done) => {
      const comments: HHResponseCommentModel[] = [mockComment];
      apiServiceSpy.get.and.returnValue(of({ data: comments }));

      service.getResponseComments('D52', 'A01', 'Y').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.COMMENTS('D52', 'A01', 'Y')
        );
        expect(result).toEqual(comments);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getResponseComments('D52', 'A01', 'Y').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getResponseComments('D52', 'A01', 'Y').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return multiple comments when present', (done) => {
      const multipleComments: HHResponseCommentModel[] = [
        mockComment,
        { commentCode: 'C02', commentDet: 'Another comment', effDate: '2024-02-01', termDate: null }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: multipleComments }));

      service.getResponseComments('D52', 'A01', 'Y').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].commentCode).toBe('C01');
        expect(result[1].commentCode).toBe('C02');
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getResponseComments('D52', 'A01', 'Y').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching response comments:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createResponseComment', () => {
    it('should call POST with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<HHResponseCommentModel> = { success: true };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createResponseComment('D52', 'A01', 'Y', mockComment).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.COMMENTS('D52', 'A01', 'Y'),
          mockComment
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createResponseComment('D52', 'A01', 'Y', mockComment).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error creating response comment:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updateResponseComment', () => {
    it('should call PUT with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<HHResponseCommentModel> = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateResponseComment('D52', 'A01', 'Y', 'C01', mockComment).subscribe(result => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_ANSWERS.COMMENT_BY_CODE('D52', 'A01', 'Y', 'C01'),
          mockComment
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateResponseComment('D52', 'A01', 'Y', 'C01', mockComment).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating response comment:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==================== HH TEMPLATES ====================

  describe('searchTemplates', () => {
    it('should call POST with correct endpoint and params', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = {
        data: [mockTemplateQuestion],
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchTemplates(25, 0, { templateId: 'TPL001' }).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.SEARCH(25, 0),
          { templateId: 'TPL001' }
        );
        expect(result.data).toEqual([mockTemplateQuestion]);
        expect(result.totalRecords).toBe(1);
        done();
      });
    });

    it('should send empty object when params is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.searchTemplates(10, 0).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.SEARCH(10, 0),
          {}
        );
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty data when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: null, total: undefined }));

      service.searchTemplates(25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.searchTemplates(25, 0).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error searching health history templates:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getTemplateQuestions', () => {
    it('should call GET without includeTerminated param by default', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [mockTemplateQuestion] }));

      service.getTemplateQuestions('TPL001').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.GET_BY_TEMPLATE('TPL001')
        );
        expect(result).toEqual([mockTemplateQuestion]);
        done();
      });
    });

    it('should append includeTerminated=true when flag is true', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [mockTemplateQuestion] }));

      service.getTemplateQuestions('TPL001', true).subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.HEALTH_HISTORY_TEMPLATES.GET_BY_TEMPLATE('TPL001')}?includeTerminated=true`
        );
        expect(result).toEqual([mockTemplateQuestion]);
        done();
      });
    });

    it('should NOT append includeTerminated when flag is false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getTemplateQuestions('TPL001', false).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.GET_BY_TEMPLATE('TPL001')
        );
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getTemplateQuestions('TPL001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getTemplateQuestions('TPL001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTemplateQuestions('TPL001').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching template questions:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getTemplateQuestionByKey', () => {
    it('should call GET and return item when present', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = { item: mockTemplateQuestion };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTemplateQuestionByKey('WB', 'D52', 'TPL001').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.GET_BY_KEY('WB', 'D52', 'TPL001')
        );
        expect(result).toBe(mockTemplateQuestion);
        done();
      });
    });

    it('should fallback to data[0] when item is undefined', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = { data: [mockTemplateQuestion] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTemplateQuestionByKey('WB', 'D52', 'TPL001').subscribe(result => {
        expect(result.templateId).toBe('TPL001');
        done();
      });
    });

    it('should return undefined when both item and data are undefined', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = {};
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTemplateQuestionByKey('WB', 'D52', 'TPL001').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should return undefined when item is undefined and data is empty', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = { data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTemplateQuestionByKey('WB', 'D52', 'TPL001').subscribe(result => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTemplateQuestionByKey('WB', 'D52', 'TPL001').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching template question:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createTemplateQuestion', () => {
    it('should call POST with correct endpoint, body, and HttpContext', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = { success: true };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createTemplateQuestion(mockTemplateQuestion).subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.CREATE,
          mockTemplateQuestion,
          jasmine.objectContaining({ context: jasmine.any(Object) })
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should rethrow errors', (done) => {
      const error = new Error('fail');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createTemplateQuestion(mockTemplateQuestion).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updateTemplateQuestion', () => {
    it('should call PUT with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<HHTemplateQuestionDto> = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateTemplateQuestion('WB', 'D52', 'TPL001', mockTemplateQuestion).subscribe(result => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.UPDATE('WB', 'D52', 'TPL001'),
          mockTemplateQuestion
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateTemplateQuestion('WB', 'D52', 'TPL001', mockTemplateQuestion).subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating template question:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('deleteTemplateQuestion', () => {
    it('should call DELETE with correct endpoint', (done) => {
      const mockResponse: ReturnResult<void> = { success: true };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteTemplateQuestion('WB', 'D52', 'TPL001').subscribe(result => {
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.DELETE('WB', 'D52', 'TPL001')
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.delete.and.returnValue(throwError(() => error));

      service.deleteTemplateQuestion('WB', 'D52', 'TPL001').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error deleting template question:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getAvailableQuestionsForTemplate', () => {
    it('should call GET and return question options', (done) => {
      const options: QuestionDropdownOption[] = [
        { code: 'D52', description: 'Chest pain?', gender: 'M' }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: options }));

      service.getAvailableQuestionsForTemplate().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.AVAILABLE_QUESTIONS
        );
        expect(result).toEqual(options);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getAvailableQuestionsForTemplate().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getAvailableQuestionsForTemplate().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getAvailableQuestionsForTemplate().subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching available questions for template:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getDonationTypes', () => {
    it('should call GET and return donation types', (done) => {
      const types: DropdownOption[] = [{ code: 'WB', description: 'Whole Blood' }];
      apiServiceSpy.get.and.returnValue(of({ data: types }));

      service.getDonationTypes().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.DONATION_TYPES
        );
        expect(result).toEqual(types);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getDonationTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getDonationTypes().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should rethrow errors', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonationTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('generateTemplateId', () => {
    it('should return data directly when it is a string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: 'TPL999' }));

      service.generateTemplateId().subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.GENERATE_ID
        );
        expect(result).toBe('TPL999');
        done();
      });
    });

    it('should return first element as string when data is an array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: ['TPL888', 'TPL889'] }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('TPL888');
        done();
      });
    });

    it('should return empty string when data is an empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should return empty string when data is neither string nor array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should return empty string when data is a number', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: 123 }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should return empty string when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should return empty string when data is a boolean', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: true }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('');
        done();
      });
    });

    it('should convert numeric array element to string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [42] }));

      service.generateTemplateId().subscribe(result => {
        expect(result).toBe('42');
        done();
      });
    });

    it('should rethrow errors', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.generateTemplateId().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updateTemplateTermDate', () => {
    it('should call PUT with correct endpoint and body', (done) => {
      const mockResponse: ReturnResult<void> = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateTemplateTermDate('TPL001', 'WB', '2027-12-31').subscribe(result => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.UPDATE_TERM_DATE('TPL001'),
          { donationType: 'WB', termDate: '2027-12-31' }
        );
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should handle error and log to console', (done) => {
      const error = new Error('fail');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateTemplateTermDate('TPL001', 'WB', '2027-12-31').subscribe({
        error: (err) => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating template termination date:', error);
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getTemplatesByDonationType', () => {
    it('should call GET and return template list items', (done) => {
      const templates: TemplateListItem[] = [
        { templateId: 'TPL001', status: 'Active', effDate: '2024-01-01', termDate: null }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: templates }));

      service.getTemplatesByDonationType('WB').subscribe(result => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.HEALTH_HISTORY_TEMPLATES.TEMPLATES_BY_DONATION_TYPE('WB')
        );
        expect(result).toEqual(templates);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getTemplatesByDonationType('WB').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getTemplatesByDonationType('WB').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return multiple template list items', (done) => {
      const templates: TemplateListItem[] = [
        { templateId: 'TPL001', status: 'Active', effDate: '2024-01-01', termDate: null },
        { templateId: 'TPL002', status: 'Terminated', effDate: '2023-01-01', termDate: '2024-06-30' }
      ];
      apiServiceSpy.get.and.returnValue(of({ data: templates }));

      service.getTemplatesByDonationType('WB').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].templateId).toBe('TPL001');
        expect(result[1].status).toBe('Terminated');
        done();
      });
    });

    it('should rethrow errors', (done) => {
      const error = new Error('fail');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTemplatesByDonationType('WB').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ==================== SERVICE INSTANTIATION ====================

  describe('service instantiation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of HealthHistoryService', () => {
      expect(service instanceof HealthHistoryService).toBe(true);
    });
  });
});
