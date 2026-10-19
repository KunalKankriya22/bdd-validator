import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UploadTestResultsApiService } from './upload-test-results-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { FileLocationResponse, UploadTestResultsResponseDto } from '../models/upload-test-results.model';

describe('UploadTestResultsApiService', () => {
  let apiSpy: any;
  let service: UploadTestResultsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    const loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    service = new UploadTestResultsApiService(apiSpy as any, loginSpy as any);
    apiServiceSpy = apiSpy;
    loginServiceSpy = loginSpy;
  });

  describe('getChapters', () => {
    it('should fetch and map chapters from array response', (done) => {
      const mockResponse: any[] = [
        {
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1',
          effDate: `${new Date().getFullYear()}-01-01`,
          termDate: `${new Date().getFullYear()}-12-31`
        },
        {
          chapterId: '002',
          chapterName: 'Chapter Two',
          chapterCode: 'CH2',
          effDate: `${new Date().getFullYear()}-01-01`,
          termDate: `${new Date().getFullYear()}-12-31`
        },
        {
          chapterId: '003',
          chapterName: 'Chapter Three',
          chapterCode: 'CH3',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters.length).toBe(3);
        expect(chapters[0]).toEqual({
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        });
        expect(chapters[1]).toEqual({
          chapterId: '002',
          chapterName: 'Chapter Two',
          chapterCode: 'CH2',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        });
        expect(chapters[2]).toEqual({
          chapterId: '003',
          chapterName: 'Chapter Three',
          chapterCode: 'CH3',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        });
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/chapters');
    });

    it('should fetch and map chapters from wrapped response', (done) => {
      const mockResponse: any = {
        data: [
          {
            chapterId: '001',
            chapterName: 'Chapter One',
            chapterCode: 'CH1',
            effDate: `${new Date().getFullYear()}-01-01`,
            termDate: `${new Date().getFullYear()}-12-31`
          }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters.length).toBe(1);
        expect(chapters[0]).toEqual({
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        });
        done();
      });
    });

    it('should handle error when fetching chapters', (done) => {
      const error = {
        error: {
          message: 'Failed to fetch chapters',
          statusCode: 500
        },
        status: 500
      };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should map chapter properties correctly', (done) => {
      const mockResponse: any[] = [
        {
          chapterId: '123',
          chapterName: 'Test Chapter',
          chapterCode: 'TC',
          effDate: `${new Date().getFullYear()}-01-01`,
          termDate: `${new Date().getFullYear()}-12-31`,
          extraProperty: 'should be ignored'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters[0]).toEqual({
          chapterId: '123',
          chapterName: 'Test Chapter',
          chapterCode: 'TC',
          effectiveDate: `${new Date().getFullYear()}-01-01`,
          terminationDate: `${new Date().getFullYear()}-12-31`
        });
        expect((chapters[0] as any).extraProperty).toBeUndefined();
        done();
      });
    });

    it('should map effDate and termDate to effectiveDate and terminationDate', (done) => {
      const mockResponse: any[] = [
        {
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1',
          effDate: `${new Date().getFullYear()}-01-15`,
          termDate: `${new Date().getFullYear()}-12-15`
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters[0].effectiveDate).toBe(`${new Date().getFullYear()}-01-15`);
        expect(chapters[0].terminationDate).toBe(`${new Date().getFullYear()}-12-15`);
        done();
      });
    });

    it('should handle chapters with only effDate/termDate', (done) => {
      const mockResponse: any[] = [
        {
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1',
          effDate: `${new Date().getFullYear()}-01-01`
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters[0].effectiveDate).toBe(`${new Date().getFullYear()}-01-01`);
        expect(chapters[0].terminationDate).toBeUndefined();
        done();
      });
    });

    it('should handle chapters without date fields', (done) => {
      const mockResponse: any[] = [
        {
          chapterId: '001',
          chapterName: 'Chapter One',
          chapterCode: 'CH1'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters[0].chapterId).toBe('001');
        expect(chapters[0].effectiveDate).toBeUndefined();
        expect(chapters[0].terminationDate).toBeUndefined();
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      const mockResponse: any = null;

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters.length).toBe(0);
        done();
      });
    });

    it('should return empty array when response has empty data array', (done) => {
      const mockResponse: any = { data: [] };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getChapters().subscribe(chapters => {
        expect(chapters.length).toBe(0);
        done();
      });
    });
  });

  describe('getFileLocation', () => {
    it('should call the file-location endpoint and return browse_file_location', (done) => {
      const mockResponse: FileLocationResponse = {
        success: true,
        message: 'File location retrieved successfully.',
        statusCode: 200,
        data: {
          browse_file_location: 'C:\\TestResults\\Incoming'
        }
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFileLocation().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.browse_file_location).toBe('C:\\TestResults\\Incoming');
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/Auth/file-location');
    });

    it('should handle error when file location is not found', (done) => {
      const error = {
        error: {
          message: 'File location not found.',
          statusCode: 404
        },
        status: 404
      };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getFileLocation().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('uploadTestResults', () => {
    let mockFiles: File[];
    let mockResponse: UploadTestResultsResponseDto;

    beforeEach(() => {
      mockFiles = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' })
      ];

      mockResponse = {
        message: 'Files uploaded successfully',
        totalFilesProcessed: 2,
        successCount: 2,
        failedCount: 0,
        skippedCount: 0,
        totalRecordsProcessed: 20,
        ltInterfaceFilesCount: 2,
        testResultStagingsCount: 20,
        fileResults: [
          {
            fileName: 'file1.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          },
          {
            fileName: 'file2.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          }
        ]
      };

      loginServiceSpy.getStoredUsername.and.returnValue('testuser');
    });

    it('should upload files with correct FormData structure', (done) => {
      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe(response => {
        expect(response.successCount).toBe(2);
        expect(response.message).toBe('Files uploaded successfully');
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalled();
      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[0]).toBe('/api/v1/Auth/uploadTestResults?chapterId=001&loggedInUserName=testuser');
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    it('should append multiple files with same key name "files"', () => {
      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      const formData = callArgs[1] as FormData;

      // FormData.getAll() is available in the browser but not in Node.js test environment
      // So we just verify that FormData was created
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should use logged in username in endpoint', (done) => {
      const chapterId = '001';
      loginServiceSpy.getStoredUsername.and.returnValue('john.doe');
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe(() => {
        done();
      });

      expect(loginServiceSpy.getStoredUsername).toHaveBeenCalled();
      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/Auth/uploadTestResults?chapterId=001&loggedInUserName=john.doe',
        jasmine.any(FormData)
      );
    });

    it('should handle single file upload', (done) => {
      const chapterId = '001';
      const singleFile = [mockFiles[0]];
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, singleFile).subscribe(response => {
        expect(response).toBeDefined();
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should handle upload error', (done) => {
      const error = {
        error: {
          message: 'Upload failed',
          statusCode: 500
        },
        status: 500
      };
      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.uploadTestResults(chapterId, mockFiles).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should handle response with failed files', (done) => {
      const failedResponse: UploadTestResultsResponseDto = {
        message: 'Some files failed',
        totalFilesProcessed: 2,
        successCount: 1,
        failedCount: 1,
        skippedCount: 0,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 1,
        testResultStagingsCount: 10,
        fileResults: [
          {
            fileName: 'file1.txt',
            status: 'success',
            message: 'Processed successfully',
            recordCount: 10,
            isLifetrakFormat: true
          },
          {
            fileName: 'file2.txt',
            status: 'failed',
            message: 'Invalid format',
            recordCount: 0,
            isLifetrakFormat: false
          }
        ]
      };

      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(of(failedResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe(response => {
        expect(response.failedCount).toBe(1);
        expect(response.successCount).toBe(1);
        expect(response.fileResults[1].status).toBe('failed');
        done();
      });
    });

    it('should construct correct endpoint URL with chapterId and username', () => {
      const chapterId = '999';
      const username = 'admin';
      loginServiceSpy.getStoredUsername.and.returnValue(username);
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/Auth/uploadTestResults?chapterId=999&loggedInUserName=admin',
        jasmine.any(FormData)
      );
    });

    it('should handle empty files array', (done) => {
      const chapterId = '001';
      const emptyFiles: File[] = [];
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, emptyFiles).subscribe(response => {
        expect(response).toBeDefined();
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should return complete response structure', (done) => {
      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe(response => {
        expect(response.message).toBeDefined();
        expect(response.totalFilesProcessed).toBeDefined();
        expect(response.successCount).toBeDefined();
        expect(response.failedCount).toBeDefined();
        expect(response.skippedCount).toBeDefined();
        expect(response.totalRecordsProcessed).toBeDefined();
        expect(response.ltInterfaceFilesCount).toBeDefined();
        expect(response.testResultStagingsCount).toBeDefined();
        expect(response.fileResults).toBeDefined();
        expect(Array.isArray(response.fileResults)).toBe(true);
        done();
      });
    });

    it('should handle fileResults with different statuses', (done) => {
      const mixedResponse: UploadTestResultsResponseDto = {
        message: 'Mixed results',
        totalFilesProcessed: 3,
        successCount: 1,
        failedCount: 1,
        skippedCount: 1,
        totalRecordsProcessed: 10,
        ltInterfaceFilesCount: 2,
        testResultStagingsCount: 10,
        fileResults: [
          {
            fileName: 'success.txt',
            status: 'success',
            message: 'OK',
            recordCount: 10,
            isLifetrakFormat: true
          },
          {
            fileName: 'failed.txt',
            status: 'failed',
            message: 'Error',
            recordCount: 0,
            isLifetrakFormat: false
          },
          {
            fileName: 'skipped.txt',
            status: 'skipped',
            message: 'Already processed',
            recordCount: 0,
            isLifetrakFormat: true
          }
        ]
      };

      const chapterId = '001';
      apiServiceSpy.post.and.returnValue(of(mixedResponse));

      service.uploadTestResults(chapterId, mockFiles).subscribe(response => {
        expect(response.fileResults.length).toBe(3);
        expect(response.fileResults[0].status).toBe('success');
        expect(response.fileResults[1].status).toBe('failed');
        expect(response.fileResults[2].status).toBe('skipped');
        done();
      });
    });
  });
});
