import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationSequenceNumbersApiService } from './application-sequence-numbers-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { API } from 'src/app/core/constants/api.constants';
import { ApplicationSequenceNumberParamsDto, CreateSequenceNumberPayload } from '../interfaces/application-sequence-number.interface';
import { of, throwError } from 'rxjs';

describe('ApplicationSequenceNumbersApiService', () => {
  let service: ApplicationSequenceNumbersApiService;
  let apiService: jasmine.SpyObj<ApiService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApplicationSequenceNumbersApiService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(ApplicationSequenceNumbersApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  describe('getApplicationSequenceNumbers', () => {
    it('should return parsed data with date conversion', (done) => {
      // Arrange
      const params: ApplicationSequenceNumberParamsDto = { SearchKeyword: 'test' };
      const mockResponse = {
        data: [
          {
            chapterId: 'CH01',
            chapterName: 'Chapter 1',
            numberType: 'BATCH_SEQ',
            maxNumber: 9999,
            startingNumber: 1,
            resetCycle: 'D',
            lastResetDate: '2026-07-15T00:00:00'
          }
        ],
        total: 1
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.getApplicationSequenceNumbers(25, 0, params).subscribe({
        next: (result) => {
          // Assert
          expect(result.data.length).toBe(1);
          expect(result.data[0].lastResetDate).toBeInstanceOf(Date);
          expect(result.totalRecords).toBe(1);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS(25, 0),
            params
          );
          expect(loggingService.log).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle null lastResetDate', (done) => {
      // Arrange
      const params: ApplicationSequenceNumberParamsDto = {};
      const mockResponse = {
        data: [
          {
            chapterId: 'CH01',
            chapterName: 'Chapter 1',
            numberType: 'BATCH_SEQ',
            maxNumber: 9999,
            startingNumber: 1,
            resetCycle: null,
            lastResetDate: null
          }
        ],
        total: 1
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.getApplicationSequenceNumbers(25, 0, params).subscribe({
        next: (result) => {
          // Assert
          expect(result.data[0].lastResetDate).toBeNull();
          done();
        }
      });
    });

    it('should handle empty data array', (done) => {
      // Arrange
      const params: ApplicationSequenceNumberParamsDto = {};
      const mockResponse = { data: null, total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.getApplicationSequenceNumbers(25, 0, params).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });

    it('should log and propagate error', (done) => {
      // Arrange
      const params: ApplicationSequenceNumberParamsDto = {};
      apiService.post.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.getApplicationSequenceNumbers(25, 0, params).subscribe({
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          expect(loggingService.error).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('createSequenceNumber', () => {
    const payload: CreateSequenceNumberPayload = {
      chapterId: 'CH01',
      numberType: 'BATCH_SEQ',
      maxNumber: 9999,
      resetCycle: 'D',
      lastResetDate: '2026-07-15',
      startingNumber: 1
    };

    it('should return created sequence number with parsed date', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 200,
        item: {
          chapterId: 'CH01',
          chapterName: 'Chapter 1',
          numberType: 'BATCH_SEQ',
          maxNumber: 9999,
          startingNumber: 1,
          resetCycle: 'D',
          lastResetDate: '2026-07-15T00:00:00'
        }
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSequenceNumber(payload).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(result.item.lastResetDate).toBeInstanceOf(Date);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.ADD_APPLICATION_SEQUENCE_NUMBER,
            payload
          );
          done();
        }
      });
    });

    it('should handle null lastResetDate in response', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 200,
        item: {
          chapterId: 'CH01',
          chapterName: 'Chapter 1',
          numberType: 'BATCH_SEQ',
          maxNumber: 9999,
          startingNumber: 1,
          resetCycle: null,
          lastResetDate: null
        }
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSequenceNumber(payload).subscribe({
        next: (result) => {
          // Assert
          expect(result.item.lastResetDate).toBeNull();
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Duplicate entry',
        statusCode: 409,
        item: {} as any
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSequenceNumber(payload).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Duplicate entry');
          done();
        }
      });
    });

    it('should use error field when message is absent', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: '',
        error: 'Conflict detected',
        statusCode: 409,
        item: {} as any
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSequenceNumber(payload).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Conflict detected');
          done();
        }
      });
    });

    it('should use default message when no error or message', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: '',
        statusCode: 500,
        item: {} as any
      };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSequenceNumber(payload).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to create sequence number');
          done();
        }
      });
    });
  });

  describe('updateSequenceNumber', () => {
    const payload: CreateSequenceNumberPayload = {
      chapterId: 'CH01',
      numberType: 'BATCH_SEQ',
      maxNumber: 5000,
      resetCycle: 'Y',
      lastResetDate: '2026-07-15',
      startingNumber: 100
    };

    it('should return updated sequence number with parsed date', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Updated',
        statusCode: 200,
        item: {
          chapterId: 'CH01',
          chapterName: 'Chapter 1',
          numberType: 'BATCH_SEQ',
          maxNumber: 5000,
          startingNumber: 100,
          resetCycle: 'Y',
          lastResetDate: '2026-07-15T00:00:00'
        }
      };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateSequenceNumber('CH01', 'BATCH_SEQ', payload).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(result.item.lastResetDate).toBeInstanceOf(Date);
          expect(apiService.put).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.UPDATE_APPLICATION_SEQUENCE_NUMBER('CH01', 'BATCH_SEQ'),
            payload
          );
          done();
        }
      });
    });

    it('should throw when response.success is false', (done) => {
      // Arrange
      const mockResponse = {
        success: false,
        message: 'Not found',
        statusCode: 404,
        item: {} as any
      };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateSequenceNumber('CH01', 'BATCH_SEQ', payload).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Not found');
          done();
        }
      });
    });

    it('should log and propagate HTTP error', (done) => {
      // Arrange
      apiService.put.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.updateSequenceNumber('CH01', 'BATCH_SEQ', payload).subscribe({
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          expect(loggingService.error).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getFilterDropdownValues', () => {
    it('should return filter dropdown values', (done) => {
      // Arrange
      const mockResponse = {
        chapterIds: ['CH01', 'CH02'],
        chapterNames: ['Chapter 1', 'Chapter 2'],
        numberTypes: ['BATCH_SEQ', 'GELTUBE_BOX'],
        cycles: ['D', 'Y', 'M']
      };
      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getFilterDropdownValues().subscribe({
        next: (result) => {
          // Assert
          expect(result.chapterIds.length).toBe(2);
          expect(result.numberTypes.length).toBe(2);
          expect(result.cycles.length).toBe(3);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.APPLICATION_SEQUENCE_NUMBERS_FILTER_DROPDOWN
          );
          expect(loggingService.log).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle null arrays in response', (done) => {
      // Arrange
      const mockResponse = {
        chapterIds: null,
        chapterNames: null,
        numberTypes: null,
        cycles: null
      };
      apiService.get.and.returnValue(of(mockResponse));

      // Act
      service.getFilterDropdownValues().subscribe({
        next: (result) => {
          // Assert
          expect(result).toBeTruthy();
          done();
        }
      });
    });

    it('should log and propagate error', (done) => {
      // Arrange
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.getFilterDropdownValues().subscribe({
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          expect(loggingService.error).toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
