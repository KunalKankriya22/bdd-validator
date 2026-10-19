import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AntigenGroupApiService } from './antigen-group-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  AntigenGroupQueryParams,
  CreateAntigenGroupTestDto,
  UpdateAntigenGroupTestDto,
  AntigenGroupDefinitionApiDto,
  AntigenGroupLookupApiDto,
  TestIdLookupApiDto,
  TestResultLookupApiDto,
  ReturnResult
} from '../models/sp-antigen-grouping.model';

describe('AntigenGroupApiService', () => {
  let service: AntigenGroupApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockApiDto: AntigenGroupDefinitionApiDto = {
    antigenGroup: 'ANTG1',
    testId: 'TEST1',
    testDesc: 'ABO/Rh Typing',
    testResult: 'POS',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-05-12T10:30:00Z',
    programId: 'VANTGGRP'
  };

  const mockListResponse: ReturnResult<AntigenGroupDefinitionApiDto> = {
    success: true,
    data: [mockApiDto],
    totalCount: 1,
    statusCode: 200,
    message: 'Data retrieved successfully'
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AntigenGroupApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(AntigenGroupApiService);
  });

  describe('getAntigenGroupTests', () => {
    it('should fetch and map antigen group tests', (done) => {
      const params: AntigenGroupQueryParams = { antigenGroupCode: 'ANTG1' };
      mockApiService.post.and.returnValue(of(mockListResponse));

      service.getAntigenGroupTests(10, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);

        const mapped = result.data[0];
        expect(mapped.testId).toBe('TEST1');
        expect(mapped.description).toBe('ABO/Rh Typing');
        expect(mapped.result).toBe('POS');
        expect(mapped.effDate).toBe('2024-01-01T00:00:00Z');
        expect(mapped.termDate).toBeNull();
        expect(mapped.modificationDate).toBe('2024-05-12T10:30:00Z');
        expect(mapped.antigenGroupCode).toBe('ANTG1');

        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/10/0',
          params
        );
        done();
      });
    });

    it('should propagate error', (done) => {
      const params: AntigenGroupQueryParams = {};
      const error = { message: 'Error fetching data' };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getAntigenGroupTests(10, 0, params).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('getAntigenGroupTestById', () => {
    it('should fetch and map a single record', (done) => {
      mockApiService.get.and.returnValue(of(mockApiDto));

      service.getAntigenGroupTestById('ANTG1', 'TEST1').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result!.testId).toBe('TEST1');
        expect(result!.description).toBe('ABO/Rh Typing');
        expect(result!.result).toBe('POS');
        expect(result!.antigenGroupCode).toBe('ANTG1');

        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/ANTG1/TEST1'
        );
        done();
      });
    });

    it('should encode special characters in path params', (done) => {
      mockApiService.get.and.returnValue(of(mockApiDto));

      service.getAntigenGroupTestById('Ce*', 'e+').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/Ce*/e%2B'
        );
        done();
      });
    });
  });

  describe('createAntigenGroupTest', () => {
    it('should send create request', (done) => {
      const createDto: CreateAntigenGroupTestDto = {
        antigenGroupCode: 'ANTG1',
        testId: 'TEST1',
        testResult: 'POS',
        effDate: '2024-06-15',
        termDate: null
      };
      const successResponse: ReturnResult = {
        success: true,
        statusCode: 200,
        message: 'Record created successfully'
      };

      mockApiService.post.and.returnValue(of(successResponse));

      service.createAntigenGroupTest(createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/v1/antigen-groups',
          createDto
        );
        done();
      });
    });

    it('should propagate validation error', (done) => {
      const createDto: CreateAntigenGroupTestDto = {
        antigenGroupCode: 'INVALID',
        testId: 'TEST1',
        testResult: 'POS',
        effDate: '2024-06-15',
        termDate: null
      };
      const error = {
        error: {
          errorResponse: { errorCode: '1105', error: 'Invalid antigen group code' }
        }
      };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.createAntigenGroupTest(createDto).subscribe({
        error: (err) => {
          expect(err.error.errorResponse.errorCode).toBe('1105');
          done();
        }
      });
    });
  });

  describe('updateAntigenGroupTest', () => {
    it('should send update request', (done) => {
      const updateDto: UpdateAntigenGroupTestDto = {
        testResult: 'NEG',
        effDate: '2024-01-01',
        termDate: '2024-12-31'
      };
      const successResponse: ReturnResult = {
        success: true,
        statusCode: 200,
        message: 'Record updated successfully'
      };

      mockApiService.put.and.returnValue(of(successResponse));

      service.updateAntigenGroupTest('ANTG1', 'TEST1', updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.put).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/ANTG1/TEST1',
          updateDto
        );
        done();
      });
    });
  });

  describe('deleteAntigenGroupTest', () => {
    it('should send delete request', (done) => {
      const successResponse: ReturnResult = {
        success: true,
        message: 'Record deleted successfully'
      };

      mockApiService.delete.and.returnValue(of(successResponse));

      service.deleteAntigenGroupTest('ANTG1', 'TEST1').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.delete).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/ANTG1/TEST1'
        );
        done();
      });
    });
  });

  describe('getAntigenGroupsLov', () => {
    it('should fetch and map antigen group lookup', (done) => {
      const apiResponse: ReturnResult<AntigenGroupLookupApiDto> = {
        success: true,
        data: [
          { code: 'ANTG1', codeDesc: 'Antigen Group 1' },
          { code: 'ANTG2', codeDesc: 'Antigen Group 2' }
        ]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getAntigenGroupsLov().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('ANTG1');
        expect(result[0].description).toBe('Antigen Group 1');
        expect(result[1].code).toBe('ANTG2');
        expect(result[1].description).toBe('Antigen Group 2');

        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/lov/antigen-groups'
        );
        done();
      });
    });
  });

  describe('getTestIdsLov', () => {
    it('should fetch and map test ID lookup', (done) => {
      const apiResponse: ReturnResult<TestIdLookupApiDto> = {
        success: true,
        data: [
          { testId: 'TEST1', testDesc: 'ABO/Rh Typing' },
          { testId: 'CMV', testDesc: 'CMV Antibody Test' }
        ]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getTestIdsLov().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].key).toBe('TEST1');
        expect(result[0].value).toBe('ABO/Rh Typing');
        expect(result[1].key).toBe('CMV');
        expect(result[1].value).toBe('CMV Antibody Test');

        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/lov/test-ids'
        );
        done();
      });
    });
  });

  describe('getTestResultsLov', () => {
    it('should fetch and map test results for a specific testId', (done) => {
      const apiResponse: ReturnResult<TestResultLookupApiDto> = {
        success: true,
        data: [
          { resultStatus: 'POS', codeDesc: 'Positive' },
          { resultStatus: 'NEG', codeDesc: 'Negative' }
        ]
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getTestResultsLov('TEST1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].key).toBe('POS');
        expect(result[0].value).toBe('Positive');
        expect(result[1].key).toBe('NEG');
        expect(result[1].value).toBe('Negative');

        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/lov/test-results',
          { params: jasmine.any(HttpParams) }
        );
        done();
      });
    });

    it('should encode special characters in testId', (done) => {
      const apiResponse: ReturnResult<TestResultLookupApiDto> = {
        success: true,
        data: []
      };
      mockApiService.get.and.returnValue(of(apiResponse));

      service.getTestResultsLov('e+').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/antigen-groups/lov/test-results',
          { params: jasmine.any(HttpParams) }
        );
        done();
      });
    });
  });
});
