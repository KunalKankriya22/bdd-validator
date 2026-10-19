import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AntigenTestService } from './antigen-test.service';
import { AntigenTestParamsDto, BulkUpsertRequestDto, BulkUpsertResponseDto } from '../models/antigen-test.model';
import { API } from 'src/app/core/constants/api.constants';

describe('AntigenTestService', () => {
  let service: AntigenTestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AntigenTestService]
    });
    service = TestBed.inject(AntigenTestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAntigenTests', () => {
    it('should fetch antigen tests with pagination', () => {
      const params: AntigenTestParamsDto = {
        searchKeyword: 'test',
        take: 25,
        skip: 0
      };
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'A1', description: 'Test 1', price: 100, effectiveDate: new Date() }
        ],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getAntigenTests(params).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].code).toBe('A1');
      });

      const req = httpMock.expectOne(request => {
        return request.url === API.APPLICATION_ADMIN.ANTIGEN_TESTS_GET_DETAILS(25, 0);
      });
      expect(req.request.method).toBe('POST');
      expect(req.request.body.searchKeyword).toBe('test');
      req.flush(mockResponse);
    });

    it('should handle error when fetching antigen tests', () => {
      const params: AntigenTestParamsDto = {
        take: 25,
        skip: 0
      };

      service.getAntigenTests(params).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request => {
        return request.url === API.APPLICATION_ADMIN.ANTIGEN_TESTS_GET_DETAILS(25, 0);
      });
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });


  describe('bulkUpsertAntigenTests', () => {
    it('should bulk upsert antigen tests (add and update)', () => {
      const bulkRequest: BulkUpsertRequestDto = {
        records: [
          {
            addRecord: true,
            code: 'A1',
            description: 'New Test',
            price: 100,
            effectiveDate: '2025-01-15',
            terminationDate: null
          },
          {
            addRecord: false,
            code: 'A2',
            description: 'Updated Test',
            price: 150,
            effectiveDate: '2025-01-15',
            terminationDate: '2025-12-31'
          }
        ],
        programId: 'VSANTGN'
      };
      const mockResponse: BulkUpsertResponseDto = {
        totalRecords: 2,
        createdCount: 1,
        updatedCount: 1,
        failureCount: 0,
        successCount: 2,
        errors: [],
        success: true,
        message: 'Bulk operation completed successfully',
        errorCode: null
      };

      service.bulkUpsertAntigenTests(bulkRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.createdCount).toBe(1);
        expect(response.updatedCount).toBe(1);
        expect(response.successCount).toBe(2);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ANTIGEN_TESTS_BULK_UPSERT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.records.length).toBe(2);
      expect(req.request.body.programId).toBe('VSANTGN');
      req.flush(mockResponse);
    });

    it('should handle error when bulk upserting antigen tests', () => {
      const bulkRequest: BulkUpsertRequestDto = {
        records: [
          {
            addRecord: true,
            code: 'A1',
            description: 'New Test',
            price: 100,
            effectiveDate: '2025-01-15',
            terminationDate: null
          }
        ]
      };

      service.bulkUpsertAntigenTests(bulkRequest).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ANTIGEN_TESTS_BULK_UPSERT);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

});
