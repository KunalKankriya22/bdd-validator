import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfirmatoryExtractionApiService } from './confirmatory-extraction-api.service';
import {
  ExtractIdDropdownDto,
  ContractDropdownDto,
  ConfirmatoryExtractUnitDto,
  ScheduleExtractionRequestDto,
  ExecuteExtractionRequestDto,
  ExtractionResultDto,
  ApiResponse
} from '../models/confirmatory-extraction.model';

describe('ConfirmatoryExtractionApiService', () => {
  let service: ConfirmatoryExtractionApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1/confirmatory-extraction';

  const mockExtractIds: ExtractIdDropdownDto[] = [
    { extractId: 'EXT001', insertDate: '2024-06-01T10:00:00Z' },
    { extractId: 'EXT002', insertDate: '2024-06-02T14:30:00Z' }
  ];

  const mockContracts: ContractDropdownDto[] = [
    { contractId: 'CON001', company: 'Blood Bank Alpha' },
    { contractId: 'CON002', company: 'Blood Bank Beta' }
  ];

  const mockUnits: ConfirmatoryExtractUnitDto[] = [
    {
      extractId: 'EXT001',
      unitId: 'UNIT001',
      chapterId: 'CHAP01',
      collDate: '2024-05-20T00:00:00Z',
      osUnitId: 'OS001',
      testSeriesId: 'TS001',
      testId: 'T001',
      qcDate: '2024-05-25T08:00:00',
      batchId: 'BATCH001',
      receivedDate: '2024-05-22T00:00:00',
      extractDate: '2024-06-01T00:00:00',
      isSelected: false
    }
  ];

  const mockExtractionResult: ExtractionResultDto = {
    success: true,
    message: 'Extraction completed successfully',
    extractId: 'EXT001',
    unitsProcessed: 5,
    isScheduled: false,
    reportGenerated: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfirmatoryExtractionApiService]
    });
    service = TestBed.inject(ConfirmatoryExtractionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getExtractIds', () => {
    it('should call GET and return extract IDs mapped from response.data', (done) => {
      service.getExtractIds().subscribe({
        next: (result) => {
          expect(result).toEqual(mockExtractIds);
          expect(result.length).toBe(2);
          expect(result[0].extractId).toBe('EXT001');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/extract-ids`)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockExtractIds } as ApiResponse<ExtractIdDropdownDto[]>);
    });

    it('should propagate HTTP error', (done) => {
      service.getExtractIds().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/extract-ids`)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getContracts', () => {
    it('should call GET with encoded extractId path param and return contracts', (done) => {
      const extractId = 'EXT001';

      service.getContracts(extractId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContracts);
          expect(result.length).toBe(2);
          expect(result[0].company).toBe('Blood Bank Alpha');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/contracts/${extractId}`)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockContracts } as ApiResponse<ContractDropdownDto[]>);
    });

    it('should encode special characters in extractId', (done) => {
      const extractId = 'EXT/001&test';

      service.getContracts(extractId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContracts);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/contracts/${encodeURIComponent(extractId)}`)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockContracts } as ApiResponse<ContractDropdownDto[]>);
    });

    it('should propagate HTTP error', (done) => {
      service.getContracts('EXT001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/contracts/EXT001`)
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getUnits', () => {
    it('should call GET with only required extractId param', (done) => {
      service.getUnits('EXT001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnits);
          expect(result.length).toBe(1);
          expect(result[0].unitId).toBe('UNIT001');
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/units`) &&
          request.params.get('extractId') === 'EXT001' &&
          !request.params.has('contractId')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockUnits } as ApiResponse<ConfirmatoryExtractUnitDto[]>);
    });

    it('should include contractId param when provided', (done) => {
      service.getUnits('EXT001', 'CON001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnits);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/units`) &&
          request.params.get('extractId') === 'EXT001' &&
          request.params.get('contractId') === 'CON001'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockUnits } as ApiResponse<ConfirmatoryExtractUnitDto[]>);
    });

    it('should include all optional date params when provided', (done) => {
      service.getUnits('EXT001', 'CON001', '2024-05-01', '2024-05-31', '2024-05-10', '2024-05-20').subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnits);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/units`) &&
          request.params.get('extractId') === 'EXT001' &&
          request.params.get('contractId') === 'CON001' &&
          request.params.get('qcDateFrom') === '2024-05-01' &&
          request.params.get('qcDateTo') === '2024-05-31' &&
          request.params.get('receivedDateFrom') === '2024-05-10' &&
          request.params.get('receivedDateTo') === '2024-05-20'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockUnits } as ApiResponse<ConfirmatoryExtractUnitDto[]>);
    });

    it('should not include null optional params', (done) => {
      service.getUnits('EXT001', undefined, null, null, null, null).subscribe({
        next: (result) => {
          expect(result).toEqual(mockUnits);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${baseUrl}/units`) &&
          request.params.get('extractId') === 'EXT001' &&
          !request.params.has('contractId') &&
          !request.params.has('qcDateFrom') &&
          !request.params.has('qcDateTo') &&
          !request.params.has('receivedDateFrom') &&
          !request.params.has('receivedDateTo')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockUnits } as ApiResponse<ConfirmatoryExtractUnitDto[]>);
    });

    it('should propagate HTTP error', (done) => {
      service.getUnits('EXT001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/units`)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('scheduleExtraction', () => {
    const scheduleRequest: ScheduleExtractionRequestDto = {
      extractId: 'EXT001',
      selectedUnitIds: ['UNIT001', 'UNIT002', 'UNIT003'],
      afterTime: '2024-06-15T14:00:00',
      generateSeriesReport: true
    };

    const scheduledResult: ExtractionResultDto = {
      success: true,
      message: 'Extraction scheduled successfully',
      extractId: 'EXT001',
      unitsProcessed: 3,
      isScheduled: true,
      reportGenerated: false
    };

    it('should call POST with request body and return mapped result', (done) => {
      service.scheduleExtraction(scheduleRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(scheduledResult);
          expect(result.isScheduled).toBeTrue();
          expect(result.unitsProcessed).toBe(3);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/schedule-extraction`)
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(scheduleRequest);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: scheduledResult } as ApiResponse<ExtractionResultDto>);
    });

    it('should send correct selectedUnitIds in request body', (done) => {
      service.scheduleExtraction(scheduleRequest).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/schedule-extraction`)
      );
      expect(req.request.body.selectedUnitIds).toEqual(['UNIT001', 'UNIT002', 'UNIT003']);
      expect(req.request.body.afterTime).toBe('2024-06-15T14:00:00');
      expect(req.request.body.generateSeriesReport).toBeTrue();
      req.flush({ success: true, statusCode: 200, message: 'OK', data: scheduledResult } as ApiResponse<ExtractionResultDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.scheduleExtraction(scheduleRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/schedule-extraction`)
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('executeExtraction', () => {
    const executeRequest: ExecuteExtractionRequestDto = {
      extractId: 'EXT001',
      selectedUnitIds: ['UNIT001', 'UNIT002'],
      generateSeriesReport: false
    };

    it('should call POST with request body and return mapped result', (done) => {
      service.executeExtraction(executeRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(mockExtractionResult);
          expect(result.isScheduled).toBeFalse();
          expect(result.unitsProcessed).toBe(5);
          expect(result.reportGenerated).toBeTrue();
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/execute-extraction`)
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(executeRequest);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockExtractionResult } as ApiResponse<ExtractionResultDto>);
    });

    it('should send correct selectedUnitIds and generateSeriesReport in body', (done) => {
      service.executeExtraction(executeRequest).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/execute-extraction`)
      );
      expect(req.request.body.selectedUnitIds).toEqual(['UNIT001', 'UNIT002']);
      expect(req.request.body.generateSeriesReport).toBeFalse();
      req.flush({ success: true, statusCode: 200, message: 'OK', data: mockExtractionResult } as ApiResponse<ExtractionResultDto>);
    });

    it('should propagate HTTP error', (done) => {
      service.executeExtraction(executeRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes(`${baseUrl}/execute-extraction`)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
