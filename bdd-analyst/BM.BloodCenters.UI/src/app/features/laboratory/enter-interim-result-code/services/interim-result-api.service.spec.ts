import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InterimResultApiService } from './interim-result-api.service';
import { environment } from '../../../../../environments/environment';
import {
  ContractLookupDto,
  TestLookupDto,
  BatchLookupDto,
  InterimCodeLookupDto,
  QueryUnitsRequestDto,
  UnitInterimResultDto,
  SaveInterimResultsRequestDto,
  SaveInterimResultsResponseDto,
  ApiResponse
} from '../models/interim-result.model';

describe('InterimResultApiService', () => {
  let service: InterimResultApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/enter-interim-result-code`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InterimResultApiService]
    });

    service = TestBed.inject(InterimResultApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── LOV Endpoints ──────────────────────────────────────────────────────

  describe('LOV Endpoints', () => {
    describe('getContracts', () => {
      it('should retrieve contracts without search text', (done) => {
        const mockContracts: ContractLookupDto[] = [
          { contractId: 'CONTRACT1', company: 'American Red Cross', centerId: 'CTR001' },
          { contractId: 'CONTRACT2', company: 'Blood Systems Inc', centerId: 'CTR002' }
        ];

        const mockResponse: ApiResponse<ContractLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Contracts retrieved successfully',
          data: mockContracts, totalCount: 2
        };

        service.getContracts().subscribe({
          next: (contracts) => {
            expect(contracts).toEqual(mockContracts);
            expect(contracts.length).toBe(2);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should retrieve contracts with search text', (done) => {
        const mockContracts: ContractLookupDto[] = [
          { contractId: 'CONTRACT1', company: 'American Red Cross', centerId: 'CTR001' }
        ];

        const mockResponse: ApiResponse<ContractLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Contracts retrieved successfully',
          data: mockContracts, totalCount: 1
        };

        service.getContracts('CONTRACT1').subscribe({
          next: (contracts) => {
            expect(contracts).toEqual(mockContracts);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts?searchText=CONTRACT1`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('searchText')).toBe('CONTRACT1');
        req.flush(mockResponse);
      });

      it('should handle empty response data gracefully', (done) => {
        const mockResponse: ApiResponse<ContractLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'No contracts found',
          data: [], totalCount: 0
        };

        service.getContracts().subscribe({
          next: (contracts) => {
            expect(contracts).toEqual([]);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts`);
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        const mockResponse = {
          success: true, statusCode: 200,
          message: 'OK', data: null
        };

        service.getContracts().subscribe({
          next: (contracts) => {
            expect(contracts).toEqual([]);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts`);
        req.flush(mockResponse);
      });

      it('should trim whitespace-only search text', (done) => {
        const mockResponse: ApiResponse<ContractLookupDto[]> = {
          success: true, statusCode: 200, message: 'OK', data: []
        };

        service.getContracts('   ').subscribe({
          next: () => done()
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts`);
        expect(req.request.params.has('searchText')).toBeFalse();
        req.flush(mockResponse);
      });

      it('should trim search text with leading/trailing spaces', (done) => {
        const mockResponse: ApiResponse<ContractLookupDto[]> = {
          success: true, statusCode: 200, message: 'OK', data: []
        };

        service.getContracts('  CONTRACT1  ').subscribe({
          next: () => done()
        });

        const req = httpMock.expectOne(`${baseUrl}/contracts?searchText=CONTRACT1`);
        expect(req.request.params.get('searchText')).toBe('CONTRACT1');
        req.flush(mockResponse);
      });
    });

    describe('getTests', () => {
      it('should retrieve tests for a contract', (done) => {
        const contractId = 'CONTRACT1';
        const mockTests: TestLookupDto[] = [
          { testId: 'HIV', testDescription: 'HIV Antibody Screen' },
          { testId: 'HBV', testDescription: 'Hepatitis B Surface Antigen' }
        ];

        const mockResponse: ApiResponse<TestLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Tests retrieved successfully',
          data: mockTests, totalCount: 2
        };

        service.getTests(contractId).subscribe({
          next: (tests) => {
            expect(tests).toEqual(mockTests);
            expect(tests.length).toBe(2);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/tests/${contractId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should URL encode contract ID', (done) => {
        const contractId = 'CONTRACT/1';
        const mockResponse: ApiResponse<TestLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Tests retrieved successfully',
          data: [], totalCount: 0
        };

        service.getTests(contractId).subscribe({
          next: () => done()
        });

        const req = httpMock.expectOne(`${baseUrl}/tests/CONTRACT%2F1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        service.getTests('CONTRACT1').subscribe({
          next: (tests) => {
            expect(tests).toEqual([]);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/tests/CONTRACT1`);
        req.flush({ success: true, statusCode: 200, message: 'OK', data: null });
      });
    });

    describe('getBatches', () => {
      it('should retrieve batches for a contract', (done) => {
        const contractId = 'CONTRACT1';
        const mockBatches: BatchLookupDto[] = [
          { batchId: 'BATCH001', receivedDate: '2024-05-10T00:00:00Z', qcDate: '2024-05-11T00:00:00Z' },
          { batchId: 'BATCH002', receivedDate: '2024-05-12T00:00:00Z', qcDate: '2024-05-13T00:00:00Z' }
        ];

        const mockResponse: ApiResponse<BatchLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Batches retrieved successfully',
          data: mockBatches, totalCount: 2
        };

        service.getBatches(contractId).subscribe({
          next: (batches) => {
            expect(batches).toEqual(mockBatches);
            expect(batches.length).toBe(2);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/batches/${contractId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should URL encode contract ID in batches URL', (done) => {
        service.getBatches('A/B').subscribe({ next: () => done() });
        const req = httpMock.expectOne(`${baseUrl}/batches/A%2FB`);
        req.flush({ success: true, statusCode: 200, message: 'OK', data: [] });
      });

      it('should return empty array when data is null', (done) => {
        service.getBatches('CONTRACT1').subscribe({
          next: (batches) => {
            expect(batches).toEqual([]);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/batches/CONTRACT1`);
        req.flush({ success: true, statusCode: 200, message: 'OK', data: null });
      });
    });

    describe('getInterimCodes', () => {
      it('should retrieve interim codes', (done) => {
        const mockCodes: InterimCodeLookupDto[] = [
          { code: 'N', codeDescription: 'Normal' },
          { code: 'A', codeDescription: 'Abnormal' },
          { code: 'P', codeDescription: 'Pending' }
        ];

        const mockResponse: ApiResponse<InterimCodeLookupDto[]> = {
          success: true, statusCode: 200,
          message: 'Interim codes retrieved successfully',
          data: mockCodes, totalCount: 3
        };

        service.getInterimCodes().subscribe({
          next: (codes) => {
            expect(codes).toEqual(mockCodes);
            expect(codes.length).toBe(3);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/interim-codes`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should return empty array when data is null', (done) => {
        service.getInterimCodes().subscribe({
          next: (codes) => {
            expect(codes).toEqual([]);
            done();
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/interim-codes`);
        req.flush({ success: true, statusCode: 200, message: 'OK', data: null });
      });
    });
  });

  // ─── queryUnits ──────────────────────────────────────────────────────────

  describe('queryUnits', () => {
    it('should query units successfully', (done) => {
      const request: QueryUnitsRequestDto = {
        contractId: 'CONTRACT1', batchId: 'BATCH001',
        testId: 'HIV', chapterId: 'CH001'
      };

      const mockUnits: UnitInterimResultDto[] = [{
        unitId: 'UNIT001', checkDigit: '5', testId: 'HIV', testSeqNo: 1,
        testDescription: 'HIV Antibody Screen', collDate: '2024-05-15T00:00:00Z',
        chapterId: 'CH001', resultCode: '', resultDescription: ''
      }];

      const mockResponse: ApiResponse<UnitInterimResultDto[]> = {
        success: true, statusCode: 200,
        message: 'Units retrieved successfully',
        data: mockUnits, totalCount: 1
      };

      service.queryUnits(request).subscribe({
        next: (units) => {
          expect(units).toEqual(mockUnits);
          expect(units.length).toBe(1);
          expect(units[0].resultCode).toBe('');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/query-units`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should send null testId when not provided', (done) => {
      const request: QueryUnitsRequestDto = {
        contractId: 'CONTRACT1', batchId: 'BATCH001',
        testId: null, chapterId: 'CH001'
      };

      service.queryUnits(request).subscribe({ next: () => done() });

      const req = httpMock.expectOne(`${baseUrl}/query-units`);
      expect(req.request.body.testId).toBeNull();
      req.flush({ success: true, statusCode: 200, message: 'OK', data: [] });
    });

    it('should handle error 1147 - Contract not found', (done) => {
      const request: QueryUnitsRequestDto = {
        contractId: 'INVALID', batchId: 'BATCH001',
        testId: null, chapterId: 'CH001'
      };

      service.queryUnits(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Contract not found or inactive');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/query-units`);
      req.flush({
        success: false, statusCode: 400, errorCode: '1147',
        errorResponse: { errorCode: '1147', error: 'Contract not found or inactive' }
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error 1061 - No eligible units', (done) => {
      const request: QueryUnitsRequestDto = {
        contractId: 'CONTRACT1', batchId: 'BATCH999',
        testId: null, chapterId: 'CH001'
      };

      service.queryUnits(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Batch has no eligible units');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/query-units`);
      req.flush({
        success: false, statusCode: 400, errorCode: '1061',
        errorResponse: { errorCode: '1061', error: 'Batch has no eligible units' }
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should return empty array when data is null', (done) => {
      const request: QueryUnitsRequestDto = {
        contractId: 'CONTRACT1', batchId: 'BATCH001',
        testId: null, chapterId: 'CH001'
      };

      service.queryUnits(request).subscribe({
        next: (units) => {
          expect(units).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/query-units`);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null });
    });
  });

  // ─── saveInterimResults ─────────────────────────────────────────────────

  describe('saveInterimResults', () => {
    const createSaveRequest = (): SaveInterimResultsRequestDto => ({
      contractId: 'CONTRACT1', batchId: 'BATCH001', chapterId: 'CH001',
      results: [{
        unitId: 'UNIT001', testId: 'HIV', testSeqNo: 1,
        collDate: '2024-05-15T00:00:00Z', resultCode: 'N'
      }]
    });

    it('should save interim results successfully', (done) => {
      const request = createSaveRequest();
      request.results.push({
        unitId: 'UNIT002', testId: 'HIV', testSeqNo: 1,
        collDate: '2024-05-15T00:00:00Z', resultCode: 'A'
      });

      const mockResponse: ApiResponse<SaveInterimResultsResponseDto[]> = {
        success: true, statusCode: 200,
        message: 'Successfully saved 2 interim results',
        data: [{ insertedCount: 2 }]
      };

      service.saveInterimResults(request).subscribe({
        next: (response) => {
          expect(response.insertedCount).toBe(2);
          expect(response.message).toBe('Successfully saved 2 interim results');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle error 1062 - Invalid interim code', (done) => {
      const request = createSaveRequest();
      request.results[0].resultCode = 'INVALID';

      service.saveInterimResults(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid interim result code');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush({
        success: false, statusCode: 400, errorCode: '1062',
        errorResponse: { errorCode: '1062', error: 'Invalid interim result code' }
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle empty results array error', (done) => {
      const request: SaveInterimResultsRequestDto = {
        contractId: 'CONTRACT1', batchId: 'BATCH001',
        chapterId: 'CH001', results: []
      };

      service.saveInterimResults(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('At least one interim result is required');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush({
        success: false, statusCode: 400, errorCode: null,
        errorResponse: { errorCode: null, error: 'At least one interim result is required' }
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should return zero count if data is empty', (done) => {
      const request = createSaveRequest();

      const mockResponse: ApiResponse<SaveInterimResultsResponseDto[]> = {
        success: true, statusCode: 200,
        message: 'No results saved', data: []
      };

      service.saveInterimResults(request).subscribe({
        next: (response) => {
          expect(response.insertedCount).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush(mockResponse);
    });

    it('should return zero count if data is null', (done) => {
      const request = createSaveRequest();

      service.saveInterimResults(request).subscribe({
        next: (response) => {
          expect(response.insertedCount).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush({ success: true, statusCode: 200, message: 'OK', data: null });
    });

    it('should extract message from response', (done) => {
      const request = createSaveRequest();

      service.saveInterimResults(request).subscribe({
        next: (response) => {
          expect(response.message).toBe('Custom success message');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush({
        success: true, statusCode: 200,
        message: 'Custom success message',
        data: [{ insertedCount: 1 }]
      });
    });

    it('should return empty message when response message is null', (done) => {
      const request = createSaveRequest();

      service.saveInterimResults(request).subscribe({
        next: (response) => {
          expect(response.message).toBe('');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/save-results`);
      req.flush({
        success: true, statusCode: 200, message: null,
        data: [{ insertedCount: 1 }]
      });
    });
  });

  // ─── Error Handling ─────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should handle 400 error with generic message', (done) => {
      service.getContracts().subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid request. Please check your input and try again.');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 404 error', (done) => {
      service.getTests('NOTFOUND').subscribe({
        error: (error) => {
          expect(error.message).toBe('The requested resource was not found.');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/tests/NOTFOUND`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 error', (done) => {
      service.getInterimCodes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Server error. Please contact support if the issue persists.');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/interim-codes`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle error with standard message field', (done) => {
      service.getContracts().subscribe({
        error: (error) => {
          expect(error.message).toBe('Validation failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.flush({ message: 'Validation failed' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle client-side network error', (done) => {
      service.getContracts().subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error occurred');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.error(new ErrorEvent('NetworkError', { message: 'Network error occurred' }));
    });

    it('should handle error with errorResponse.error field', (done) => {
      service.getBatches('C1').subscribe({
        error: (error) => {
          expect(error.message).toBe('Batch not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/batches/C1`);
      req.flush({
        errorResponse: { errorCode: '1097', error: 'Batch not found' }
      }, { status: 400, statusText: 'Bad Request' });
    });

    it('should use error.message fallback for unknown status codes', (done) => {
      service.getContracts().subscribe({
        error: (error) => {
          expect(error.message).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/contracts`);
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });
    });
  });
});
