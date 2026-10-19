import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TparmApiService } from './tparm-api.service';
import { environment } from '../../../../../environments/environment';
import {
  ValidTestParmDto,
  CreateValidTestParmRequestDto,
  UpdateValidTestParmRequestDto,
  ValidTestParmQueryDto,
  DatatypeEnum,
  RunFlagEnum,
  ApiResponse,
  DatatypeLookup,
  VoidCodeLookup,
  RelatedCodeLookup
} from '../models/tparm.model';

describe('TparmApiService', () => {
  let service: TparmApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/valid-test-staging-parameters`;

  const mockParameter: ValidTestParmDto = {
    parmCode: 'TEST01',
    description: 'Test Parameter 1',
    datatype: DatatypeEnum.NUMBER,
    relatedCode: null,
    voidCode: null,
    runFlag: RunFlagEnum.YES,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-01-15T10:30:00Z',
    programId: 'VTSTPARM'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TparmApiService]
    });

    service = TestBed.inject(TparmApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve all parameters with default pagination', (done) => {
      const mockResponse: ApiResponse<ValidTestParmDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockParameter],
        totalCount: 1
      };

      service.getAll().subscribe({
        next: (result) => {
          expect(result.data).toEqual([mockParameter]);
          expect(result.totalCount).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/50/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should retrieve parameters with custom pagination', (done) => {
      const mockResponse: ApiResponse<ValidTestParmDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockParameter],
        totalCount: 100
      };

      service.getAll(25, 10).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalCount).toBe(100);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/25/10`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should apply search and filter criteria', (done) => {
      const query: ValidTestParmQueryDto = {
        searchKeyword: 'test',
        datatype: DatatypeEnum.NUMBER,
        runFlag: RunFlagEnum.YES
      };

      const mockResponse: ApiResponse<ValidTestParmDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockParameter],
        totalCount: 1
      };

      service.getAll(50, 0, query).subscribe({
        next: (result) => {
          expect(result.data).toEqual([mockParameter]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/50/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

  });

  describe('getById', () => {
    it('should retrieve a single parameter by code', (done) => {
      const mockResponse: ApiResponse<ValidTestParmDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockParameter
      };

      service.getById('TEST01').subscribe({
        next: (result) => {
          expect(result).toEqual(mockParameter);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/TEST01`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 error for non-existent parameter', (done) => {
      const mockError = {
        success: false,
        statusCode: 404,
        message: 'Record not found'
      };

      service.getById('NOTEXIST').subscribe({
        next: () => done.fail('Expected error, but got success'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/NOTEXIST`);
      req.flush(mockError, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should create a new parameter', (done) => {
      const createRequest: CreateValidTestParmRequestDto = {
        parmCode: 'NEW01',
        description: 'New Test Parameter',
        datatype: DatatypeEnum.NUMBER,
        runFlag: RunFlagEnum.YES,
        effDate: '2024-06-01'
      };

      const mockResponse: ApiResponse<{ parmCode: string }> = {
        success: true,
        statusCode: 201,
        message: 'Record created successfully',
        data: { parmCode: 'NEW01' }
      };

      service.create(createRequest).subscribe({
        next: (result) => {
          expect(result.parmCode).toBe('NEW01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });

    it('should handle validation error for duplicate code', (done) => {
      const createRequest: CreateValidTestParmRequestDto = {
        parmCode: 'EXISTING',
        description: 'Test',
        datatype: DatatypeEnum.NUMBER,
        runFlag: RunFlagEnum.YES
      };

      const mockError = {
        success: false,
        statusCode: 400,
        errorCode: '3117',
        message: 'Parameter Code already exists'
      };

      service.create(createRequest).subscribe({
        next: () => done.fail('Expected error, but got success'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('update', () => {
    it('should update an existing parameter', (done) => {
      const updateRequest: UpdateValidTestParmRequestDto = {
        description: 'Updated Test Parameter',
        datatype: DatatypeEnum.NUMBER,
        runFlag: RunFlagEnum.YES,
        effDate: '2024-01-01',
        termDate: null
      };

      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Record updated successfully',
        data: undefined as any
      };

      service.update('TEST01', updateRequest).subscribe({
        next: () => {
          expect(true).toBe(true); // Update returns void
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/TEST01`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });

    it('should handle validation error for invalid data', (done) => {
      const updateRequest: UpdateValidTestParmRequestDto = {
        description: 'Updated',
        datatype: DatatypeEnum.NUMBER,
        runFlag: RunFlagEnum.YES,
        effDate: '2024-06-01',
        termDate: '2024-05-01' // Before effective date
      };

      const mockError = {
        success: false,
        statusCode: 400,
        errorCode: '5004',
        message: 'Term Date must be on or after Eff Date'
      };

      service.update('TEST01', updateRequest).subscribe({
        next: () => done.fail('Expected error, but got success'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/TEST01`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('delete', () => {

    it('should handle 404 error for non-existent parameter', (done) => {
      const mockError = {
        success: false,
        statusCode: 404,
        message: 'Record not found or already deleted'
      };

      service.delete('NOTEXIST').subscribe({
        next: () => done.fail('Expected error, but got success'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/NOTEXIST`);
      req.flush(mockError, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDatatypes', () => {
    it('should retrieve list of datatypes', (done) => {
      const mockDatatypes: DatatypeLookup[] = [
        { typeCode: 'DATE', description: 'Date value' },
        { typeCode: 'NUMBER', description: 'Numeric value' }
      ];

      const mockResponse: ApiResponse<DatatypeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockDatatypes
      };

      service.getDatatypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockDatatypes);
          expect(result.length).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/datatypes-lookup`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getVoidCodes', () => {
    it('should retrieve list of void codes', (done) => {
      const mockVoidCodes: VoidCodeLookup[] = [
        { code: 'VOID1', codeDesc: 'Void Batch' },
        { code: 'VOID2', codeDesc: 'Equipment Failure' }
      ];

      const mockResponse: ApiResponse<VoidCodeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockVoidCodes
      };

      service.getVoidCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockVoidCodes);
          expect(result.length).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${baseUrl}/void-codes-lookup`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getRelatedCodes', () => {
    it('should retrieve related codes for DEVICE datatype', (done) => {
      const mockRelatedCodes: RelatedCodeLookup[] = [
        { code: 'EQUIP1', codeDesc: 'Equipment 1' },
        { code: 'EQUIP2', codeDesc: 'Equipment 2' }
      ];

      const mockResponse: ApiResponse<RelatedCodeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockRelatedCodes
      };

      service.getRelatedCodes(DatatypeEnum.DEVICE).subscribe({
        next: (result) => {
          expect(result).toEqual(mockRelatedCodes);
          expect(result.length).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/related-codes-lookup` &&
        r.params.get('datatype') === 'DEVICE'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retrieve related codes with excludeParmCode', (done) => {
      const mockRelatedCodes: RelatedCodeLookup[] = [
        { code: 'EQUIP1', codeDesc: 'Equipment 1' }
      ];

      const mockResponse: ApiResponse<RelatedCodeLookup[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockRelatedCodes
      };

      service.getRelatedCodes(DatatypeEnum.DEVICE, 'EQUIP1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockRelatedCodes);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url === `${baseUrl}/related-codes-lookup` &&
        r.params.get('datatype') === 'DEVICE' &&
        r.params.get('excludeParmCode') === 'EQUIP1'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
