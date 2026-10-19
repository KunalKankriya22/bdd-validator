import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InstrumentInterfaceService } from './instrument-interface.service';
import { environment } from '../../../../../../environments/environment';
import {
  Chapter,
  Instrument,
  RawDataApiResponse,
  UploadStatusApiResponse,
  ErrorCode,
  LogFile
} from '../models/instrument-interface.model';

describe('[Unit] InstrumentInterfaceService', () => {
  let service: InstrumentInterfaceService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;
  const endpoint = '/api/v1/instrument-interface';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InstrumentInterfaceService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InstrumentInterfaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getChapters', () => {
    it('should return chapters array when API call succeeds', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { chapterId: 'DAL', chapterName: 'Dallas' },
          { chapterId: 'HOU', chapterName: 'Houston' }
        ],
        total: 2,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getChapters().subscribe((chapters: Chapter[]) => {
        expect(chapters.length).toBe(2);
        expect(chapters[0].id).toBe('DAL');
        expect(chapters[0].name).toBe('Dallas');
        expect(chapters[1].id).toBe('HOU');
        expect(chapters[1].name).toBe('Houston');
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/chapters`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getInstruments', () => {
    it('should return instruments array when API call succeeds', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'S201', codeDesc: 'Instrument 1' },
          { code: 'S202', codeDesc: 'Instrument 2' }
        ],
        total: 2,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getInstruments().subscribe((instruments: Instrument[]) => {
        expect(instruments.length).toBe(2);
        expect(instruments[0].id).toBe('S201');
        expect(instruments[0].name).toBe('S201 - Instrument 1');
        expect(instruments[1].id).toBe('S202');
        expect(instruments[1].name).toBe('S202 - Instrument 2');
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/instruments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getRawData', () => {
    it('should send correct POST request with all parameters', () => {
      const mockResponse: RawDataApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      const params = {
        chapterId: 'DAL',
        instrumentId: 'S201',
        take: 25,
        skip: 50,
        searchItem: 'test',
        fileId: 'F123',
        sortDirection: 'DESC'
      };

      service.getRawData(
        params.chapterId,
        params.instrumentId,
        params.take,
        params.skip,
        params.searchItem,
        params.fileId,
        params.sortDirection
      ).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/raw-data/${params.take}/${params.skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        chapterId: params.chapterId,
        machineId: params.instrumentId,
        searchItem: params.searchItem,
        fileId: params.fileId,
        sortDirection: params.sortDirection
      });
      req.flush(mockResponse);
    });

    it('should use default parameters when not provided', () => {
      const mockResponse: RawDataApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getRawData('DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/raw-data/10/0`);
      expect(req.request.body).toEqual({
        chapterId: 'DAL',
        machineId: 'S201',
        searchItem: '',
        fileId: '',
        sortDirection: 'ASC'
      });
      req.flush(mockResponse);
    });
  });

  describe('getUploadStatus', () => {
    it('should send correct POST request with filters', () => {
      const mockResponse: UploadStatusApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      const filters = {
        fileId: 'F123',
        uploadStatus: 'S',
        processDateFrom: `${new Date().getFullYear()}-01-01`,
        processDateTo: `${new Date().getFullYear()}-12-31`
      };

      service.getUploadStatus('DAL', 'S201', 10, 0, 'search', filters).subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/upload-status/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        machineId: 'S201',
        chapterId: 'DAL',
        searchItem: 'search',
        fileId: 'F123',
        uploadStatus: 'S',
        processDateFrom: `${new Date().getFullYear()}-01-01`,
        processDateTo: `${new Date().getFullYear()}-12-31`,
        sortDirection: 'DESC'
      });
      req.flush(mockResponse);
    });

    it('should handle empty filters', () => {
      const mockResponse: UploadStatusApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getUploadStatus('DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/upload-status/10/0`);
      expect(req.request.body).toEqual({
        machineId: 'S201',
        chapterId: 'DAL',
        searchItem: '',
        fileId: '',
        uploadStatus: '',
        processDateFrom: '',
        processDateTo: '',
        sortDirection: 'DESC'
      });
      req.flush(mockResponse);
    });
  });

  describe('getLogFiles', () => {
    it('should return mapped log files array', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            outputFile: 'log1.txt',
            fileId: 'F1',
            parmId: 'P1',
            reportStatus: 'Complete',
            submitDate: `${new Date().getFullYear()}-01-01`
          },
          {
            outputFile: 'log2.txt',
            fileId: 'F2',
            parmId: 'P2',
            reportStatus: 'Pending',
            submitDate: `${new Date().getFullYear()}-01-02`
          }
        ]
      };

      service.getLogFiles('S201').subscribe((files: LogFile[]) => {
        expect(files.length).toBe(2);
        expect(files[0].fileName).toBe('log1.txt');
        expect(files[0].fileId).toBe('F1');
        expect(files[0].parmId).toBe('P1');
        expect(files[1].fileName).toBe('log2.txt');
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/logs/S201`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });



    it('should handle missing file properties gracefully', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { outputFile: 'log1.txt' }
        ]
      };

      service.getLogFiles('S201').subscribe((files: LogFile[]) => {
        expect(files.length).toBe(1);
        expect(files[0].fileName).toBe('log1.txt');
        expect(files[0].fileId).toBe('');
        expect(files[0].parmId).toBe('');
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/logs/S201`);
      req.flush(mockResponse);
    });
  });
  describe('downloadLogFile', () => {
    it('should request blob response type', () => {
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });

      service.downloadLogFile('P123').subscribe((blob) => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/logs/P123/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('addErrorCode', () => {
    it('should send POST request with correct payload', () => {
      const errorCode: ErrorCode = {
        machineTestId: 'MT1',
        errorCode: 'E001',
        errorDesc: 'Test Error',
        skipLevel: 'S',
        effDate: `${new Date().getFullYear()}-01-01`,
        termDate: `${new Date().getFullYear()}-12-31`
      };

      const mockResponse = { success: true };

      service.addErrorCode(errorCode, 'DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/error-handling`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        chapterId: 'DAL',
        machineId: 'S201',
        machineTestId: 'MT1',
        errorCode: 'E001',
        errorDesc: 'Test Error',
        skipLevel: 'S',
        programId: 'IIAPIMGR',
        effDate: `${new Date().getFullYear()}-01-01`,
        termDate: `${new Date().getFullYear()}-12-31`
      });
      req.flush(mockResponse);
    });


  });

  describe('updateErrorCode', () => {
    it('should send PUT request with correct payload', () => {
      const errorCode: ErrorCode = {
        machineTestId: 'MT1',
        errorCode: 'E001',
        errorDesc: 'Updated Error',
        skipLevel: 'A',
        effDate: `${new Date().getFullYear()}-01-01`
      };

      service.updateErrorCode(errorCode, 'DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/error-handling`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.errorDesc).toBe('Updated Error');
      expect(req.request.body.skipLevel).toBe('A');
      req.flush({ success: true });
    });
  });

  describe('manualUpload', () => {
    it('should send POST request with correct body', () => {
      const mockResponse = { success: true };

      service.manualUpload('DAL', 'S201', 'F123').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/manual-upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        machineId: 'S201',
        fileId: 'F123',
        chapterId: 'DAL'
      });
      req.flush(mockResponse);
    });
  });
  describe('getFileIds', () => {
    it('should send GET request with correct URL', () => {
      const mockResponse = { data: ['F1', 'F2'] };

      service.getFileIds('DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/file-ids/DAL/S201?source=both`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUnitDetails', () => {
    it('should send POST request without fileId parameter', () => {
      const mockResponse = { data: [] };

      service.getUnitDetails('DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/upload-status/units`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        chapterId: 'DAL',
        machineId: 'S201',
        fileId: null,
        sort: null
      });
      req.flush(mockResponse);
    });

    it('should send POST request with fileId parameter', () => {
      const mockResponse = { data: [] };

      service.getUnitDetails('DAL', 'S201', 'F123').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/upload-status/units`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        chapterId: 'DAL',
        machineId: 'S201',
        fileId: 'F123',
        sort: null
      });
      req.flush(mockResponse);
    });

    it('should encode fileId parameter correctly', () => {
      const mockResponse = { data: [] };

      service.getUnitDetails('DAL', 'S201', 'F 123/456').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/upload-status/units`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        chapterId: 'DAL',
        machineId: 'S201',
        fileId: 'F 123/456',
        sort: null
      });
      req.flush(mockResponse);
    });
  });

  describe('getErrorCodes', () => {
    it('should send GET request with query parameters', () => {
      const mockResponse = { data: [] };

      service.getErrorCodes('DAL', 'S201', 50, 10).subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/error-handling/50/10?chapterId=DAL&machineId=S201`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default pagination parameters', () => {
      const mockResponse = { data: [] };

      service.getErrorCodes('DAL', 'S201').subscribe();

      const req = httpMock.expectOne(`${baseUrl}${endpoint}/error-handling/1000/0?chapterId=DAL&machineId=S201`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
