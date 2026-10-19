import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EnterResultsMappingApiService } from './enter-results-mapping-api.service';
import { environment } from 'src/environments/environment';
import {
  RgtResultsMatrixDto,
  CreateRgtResultsMatrixRequestDto,
  UpdateRgtResultsMatrixRequestDto,
  RgtResultsMatrixQueryDto,
  ContractDropdownDto,
  TestDropdownDto,
  ResultStatusDropdownDto,
  ApiResponse
} from '../models/enter-results-mapping.model';

describe('EnterResultsMappingApiService', () => {
  let service: EnterResultsMappingApiService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/api/v1/rgt-results-matrix`;

  const mockMapping: RgtResultsMatrixDto = {
    testId: 'TST01',
    resultStatus: 'POS',
    contractId: 'CTR-001',
    cbcTestId: 'CBC01',
    cbcResultStatus: 'POSITIVE',
    lastModifiedDate: '2025-03-15T10:00:00Z',
    lastModifiedDateLocal: '2025-03-15T06:00:00',
    effDate: '2025-01-01',
    termDate: null,
    contractCompany: 'Test Company',
    contractChapter: null,
    testDescription: 'HIV Antibody Test',
    resultStatusDescription: 'Positive',
    isInternal: false
  };

  const mockMapping2: RgtResultsMatrixDto = {
    testId: 'TST02',
    resultStatus: 'NEG',
    contractId: 'CTR-002',
    cbcTestId: 'CBC02',
    cbcResultStatus: 'NEGATIVE',
    lastModifiedDate: '2025-03-16T10:00:00Z',
    lastModifiedDateLocal: '2025-03-16T06:00:00',
    effDate: '2025-01-01',
    termDate: null,
    contractCompany: null,
    contractChapter: 'Chapter A',
    testDescription: 'HCV Test',
    resultStatusDescription: 'Negative',
    isInternal: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnterResultsMappingApiService]
    });

    service = TestBed.inject(EnterResultsMappingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('should POST to /{take}/{skip} and return data with totalCount', (done) => {
      const query: RgtResultsMatrixQueryDto = { contractId: 'CTR-001' };
      const mockResponse: ApiResponse<RgtResultsMatrixDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockMapping],
        totalCount: 25
      };

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].testId).toBe('TST01');
          expect(result.totalCount).toBe(25);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should default totalCount to 0 when not provided', (done) => {
      const query: RgtResultsMatrixQueryDto = { contractId: 'CTR-001' };
      const mockResponse: ApiResponse<RgtResultsMatrixDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: []
      };

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(0);
          expect(result.totalCount).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should pass pagination parameters in the URL', (done) => {
      const query: RgtResultsMatrixQueryDto = { contractId: 'CTR-001' };
      const mockResponse: ApiResponse<RgtResultsMatrixDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockMapping, mockMapping2],
        totalCount: 100
      };

      service.getAll(50, 25, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(2);
          expect(result.totalCount).toBe(100);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/50/25`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getByCompositeId
  // ---------------------------------------------------------------------------
  describe('getByCompositeId', () => {
    it('should GET with URL-encoded composite key and return response.data', (done) => {
      const mockResponse: ApiResponse<RgtResultsMatrixDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockMapping
      };

      service.getByCompositeId('TST01', 'POS', 'CTR-001').subscribe({
        next: (result) => {
          expect(result.testId).toBe('TST01');
          expect(result.resultStatus).toBe('POS');
          expect(result.contractId).toBe('CTR-001');
          expect(result.cbcTestId).toBe('CBC01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent('TST01')}/${encodeURIComponent('POS')}/${encodeURIComponent('CTR-001')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in composite key segments', (done) => {
      const testId = 'TST/01';
      const resultStatus = 'RES&ST';
      const contractId = 'CTR 001';

      const mockResponse: ApiResponse<RgtResultsMatrixDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { ...mockMapping, testId, resultStatus, contractId }
      };

      service.getByCompositeId(testId, resultStatus, contractId).subscribe({
        next: (result) => {
          expect(result.testId).toBe(testId);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should POST to base URL and return response.data', (done) => {
      const request: CreateRgtResultsMatrixRequestDto = {
        testId: 'TST01',
        resultStatus: 'POS',
        contractId: 'CTR-001',
        cbcTestId: 'CBC01',
        cbcResultStatus: 'POSITIVE'
      };

      const mockResponse: ApiResponse<RgtResultsMatrixDto> = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: mockMapping
      };

      service.create(request).subscribe({
        next: (result) => {
          expect(result.testId).toBe('TST01');
          expect(result.cbcTestId).toBe('CBC01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should PUT with URL-encoded composite key and return response.data', (done) => {
      const request: UpdateRgtResultsMatrixRequestDto = {
        cbcTestId: 'CBC-UPDATED',
        cbcResultStatus: 'NEGATIVE'
      };

      const updatedMapping: RgtResultsMatrixDto = {
        ...mockMapping,
        cbcTestId: 'CBC-UPDATED',
        cbcResultStatus: 'NEGATIVE'
      };

      const mockResponse: ApiResponse<RgtResultsMatrixDto> = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: updatedMapping
      };

      service.update('TST01', 'POS', 'CTR-001', request).subscribe({
        next: (result) => {
          expect(result.cbcTestId).toBe('CBC-UPDATED');
          expect(result.cbcResultStatus).toBe('NEGATIVE');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent('TST01')}/${encodeURIComponent('POS')}/${encodeURIComponent('CTR-001')}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should encode special characters in composite key for update', (done) => {
      const testId = 'T/01';
      const resultStatus = 'R&S';
      const contractId = 'C 01';
      const request: UpdateRgtResultsMatrixRequestDto = { cbcTestId: 'CBC99' };

      const mockResponse: ApiResponse<RgtResultsMatrixDto> = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: { ...mockMapping, testId, resultStatus, contractId, cbcTestId: 'CBC99' }
      };

      service.update(testId, resultStatus, contractId, request).subscribe({
        next: (result) => {
          expect(result.cbcTestId).toBe('CBC99');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should DELETE with URL-encoded composite key and map to void', (done) => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Deleted',
        data: undefined as any
      };

      service.delete('TST01', 'POS', 'CTR-001').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent('TST01')}/${encodeURIComponent('POS')}/${encodeURIComponent('CTR-001')}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should encode special characters in composite key for delete', (done) => {
      const testId = 'TST/X';
      const resultStatus = 'S&T';
      const contractId = 'C 002';

      service.delete(testId, resultStatus, contractId).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/${encodeURIComponent(testId)}/${encodeURIComponent(resultStatus)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, statusCode: 200, message: 'Deleted', data: null });
    });
  });

  // ---------------------------------------------------------------------------
  // getContractsDropdown
  // ---------------------------------------------------------------------------
  describe('getContractsDropdown', () => {
    it('should GET /dropdowns/contracts and return response.data', (done) => {
      const mockContracts: ContractDropdownDto[] = [
        { contractId: 'CTR-001', display: 'CTR-001 - Test Company', company: 'Test Company', chapter: null, isInternal: false },
        { contractId: 'CTR-002', display: 'CTR-002 - Chapter A', company: null, chapter: 'Chapter A', isInternal: true }
      ];

      const mockResponse: ApiResponse<ContractDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockContracts
      };

      service.getContractsDropdown().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].contractId).toBe('CTR-001');
          expect(result[0].isInternal).toBeFalse();
          expect(result[1].contractId).toBe('CTR-002');
          expect(result[1].isInternal).toBeTrue();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/dropdowns/contracts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getTestsDropdown
  // ---------------------------------------------------------------------------
  describe('getTestsDropdown', () => {
    it('should GET /dropdowns/tests and return response.data', (done) => {
      const mockTests: TestDropdownDto[] = [
        { testId: 'TST01', description: 'HIV Antibody Test', display: 'TST01 - HIV Antibody Test' },
        { testId: 'TST02', description: 'HCV Test', display: 'TST02 - HCV Test' }
      ];

      const mockResponse: ApiResponse<TestDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockTests
      };

      service.getTestsDropdown().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('TST01');
          expect(result[1].testId).toBe('TST02');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/dropdowns/tests`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getResultStatusesDropdown
  // ---------------------------------------------------------------------------
  describe('getResultStatusesDropdown', () => {
    const mockStatuses: ResultStatusDropdownDto[] = [
      { resultStatus: 'POS', description: 'Positive' },
      { resultStatus: 'NEG', description: 'Negative' },
      { resultStatus: 'IND', description: 'Indeterminate' }
    ];

    it('should GET /dropdowns/result-statuses with no params', (done) => {
      const mockResponse: ApiResponse<ResultStatusDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockStatuses
      };

      service.getResultStatusesDropdown().subscribe({
        next: (result) => {
          expect(result.length).toBe(3);
          expect(result[0].resultStatus).toBe('POS');
          expect(result[2].resultStatus).toBe('IND');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/dropdowns/result-statuses`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should append testId param when provided', (done) => {
      const mockResponse: ApiResponse<ResultStatusDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockStatuses[0]]
      };

      service.getResultStatusesDropdown('TST01').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url === `${baseUrl}/dropdowns/result-statuses`
          && request.params.get('testId') === 'TST01'
          && !request.params.has('contractId')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append both testId and contractId params when provided', (done) => {
      const mockResponse: ApiResponse<ResultStatusDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockStatuses
      };

      service.getResultStatusesDropdown('TST01', 'CTR-001').subscribe({
        next: (result) => {
          expect(result.length).toBe(3);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        (request) => request.url === `${baseUrl}/dropdowns/result-statuses`
          && request.params.get('testId') === 'TST01'
          && request.params.get('contractId') === 'CTR-001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not append params when values are empty strings', (done) => {
      const mockResponse: ApiResponse<ResultStatusDropdownDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockStatuses
      };

      service.getResultStatusesDropdown('', '').subscribe({
        next: (result) => {
          expect(result.length).toBe(3);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/dropdowns/result-statuses`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // batchCreate
  // ---------------------------------------------------------------------------
  describe('batchCreate', () => {
    it('should POST to /batch with array of create requests', (done) => {
      const requests: CreateRgtResultsMatrixRequestDto[] = [
        { testId: 'TST01', resultStatus: 'POS', contractId: 'CTR-001', cbcTestId: 'CBC01' },
        { testId: 'TST02', resultStatus: 'NEG', contractId: 'CTR-001', cbcTestId: 'CBC02' }
      ];

      const mockResponse: ApiResponse<RgtResultsMatrixDto[]> = {
        success: true,
        statusCode: 201,
        message: 'Batch created',
        data: [mockMapping, mockMapping2]
      };

      service.batchCreate(requests).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('TST01');
          expect(result[1].testId).toBe('TST02');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(requests);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // batchUpdate
  // ---------------------------------------------------------------------------
  describe('batchUpdate', () => {
    it('should PUT to /batch with array of update items', (done) => {
      const updates = [
        { testId: 'TST01', resultStatus: 'POS', contractId: 'CTR-001', data: { cbcTestId: 'CBC-UPD1' } as UpdateRgtResultsMatrixRequestDto },
        { testId: 'TST02', resultStatus: 'NEG', contractId: 'CTR-002', data: { cbcResultStatus: 'NEGATIVE' } as UpdateRgtResultsMatrixRequestDto }
      ];

      const mockResponse: ApiResponse<RgtResultsMatrixDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Batch updated',
        data: [
          { ...mockMapping, cbcTestId: 'CBC-UPD1' },
          { ...mockMapping2, cbcResultStatus: 'NEGATIVE' }
        ]
      };

      service.batchUpdate(updates).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].cbcTestId).toBe('CBC-UPD1');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // batchDelete
  // ---------------------------------------------------------------------------
  describe('batchDelete', () => {
    it('should send DELETE to /batch with body containing items and map to void', (done) => {
      const items = [
        { testId: 'TST01', resultStatus: 'POS', contractId: 'CTR-001' },
        { testId: 'TST02', resultStatus: 'NEG', contractId: 'CTR-002' }
      ];

      service.batchDelete(items).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/batch`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual(items);
      req.flush({ success: true, statusCode: 200, message: 'Batch deleted', data: null });
    });
  });

  // ---------------------------------------------------------------------------
  // getCbcTestId (Gap #3 - MLT-13106)
  // ---------------------------------------------------------------------------
  describe('getCbcTestId', () => {
    it('should GET cbc-test-id endpoint and return cbcTestId from response.item', (done) => {
      const testId = 'TST01';
      const contractId = 'CTR-001';
      const mockResponse: ApiResponse<{ cbcTestId: string | null }> = {
        success: true,
        statusCode: 200,
        message: 'CBC Test ID retrieved successfully',
        item: { cbcTestId: 'CBC01' }
      };

      service.getCbcTestId(testId, contractId).subscribe({
        next: (result) => {
          expect(result).toBe('CBC01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when cbcTestId not found', (done) => {
      const testId = 'NONEXISTENT';
      const contractId = 'CTR-999';
      const mockResponse: ApiResponse<{ cbcTestId: string | null }> = {
        success: true,
        statusCode: 200,
        message: 'CBC Test ID retrieved successfully',
        item: { cbcTestId: null }
      };

      service.getCbcTestId(testId, contractId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should URL encode special characters in testId and contractId', (done) => {
      const testId = 'TST/01';
      const contractId = 'CTR&001';
      const mockResponse: ApiResponse<{ cbcTestId: string | null }> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: { cbcTestId: 'CBC-SPECIAL' }
      };

      service.getCbcTestId(testId, contractId).subscribe({
        next: (result) => {
          expect(result).toBe('CBC-SPECIAL');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toContain('TST%2F01'); // Verify encoding
      expect(req.request.url).toContain('CTR%26001');
      req.flush(mockResponse);
    });

    it('should handle empty response.item gracefully', (done) => {
      const testId = 'TST01';
      const contractId = 'CTR-001';
      const mockResponse: ApiResponse<{ cbcTestId: string | null }> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: undefined as any
      };

      service.getCbcTestId(testId, contractId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`
      );
      req.flush(mockResponse);
    });

    it('should return null when item.cbcTestId is explicitly null', (done) => {
      const testId = 'TST01';
      const contractId = 'CTR-001';
      const mockResponse: ApiResponse<{ cbcTestId: string | null }> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: { cbcTestId: null }
      };

      service.getCbcTestId(testId, contractId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(
        `${baseUrl}/cbc-test-id/${encodeURIComponent(testId)}/${encodeURIComponent(contractId)}`
      );
      req.flush(mockResponse);
    });
  });
});
