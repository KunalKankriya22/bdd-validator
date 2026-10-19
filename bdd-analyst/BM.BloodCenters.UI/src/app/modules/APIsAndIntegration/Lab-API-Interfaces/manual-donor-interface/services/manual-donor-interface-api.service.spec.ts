import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ManualDonorInterfaceApiService } from './manual-donor-interface-api.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  TestResultsResponseDto,
  ManualDonorInterfaceResponseDto
} from '../models/manual-donor-interface.model';

describe('ManualDonorInterfaceApiService', () => {
  let headerSpy: any;
  let apiSpy: any;
  let service: ManualDonorInterfaceApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    headerSpy = createMockHeaderService({ chapterId: signal('123') });

    TestBed.configureTestingModule({
      providers: [
        ManualDonorInterfaceApiService,
        { provide: ApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy }
      ]
    });

    service = TestBed.inject(ManualDonorInterfaceApiService);
    apiServiceSpy = apiSpy;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
  });


  describe('getTestResults', () => {
    it('should fetch and map test results with new API structure', (done) => {
      const mockResponse: TestResultsResponseDto = {
        success: true,
        message: 'Successfully fetched ABO/RH results',
        statusCode: 200,
        data: [
          { priorAbo: '06', description: 'A  NEG' },
          { priorAbo: '62', description: 'A  POS' },
          { priorAbo: '28', description: 'AB NEG' }
        ]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestResults().subscribe(results => {
        expect(results.length).toBe(3);
        expect(results[0]).toEqual({ code: '06', description: 'A  NEG' });
        expect(results[1]).toEqual({ code: '62', description: 'A  POS' });
        expect(results[2]).toEqual({ code: '28', description: 'AB NEG' });
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/abo-results'
      );
    });



    it('should handle error when fetching test results', (done) => {
      const error = {
        error: {
          success: false,
          message: 'Failed to fetch ABO/RH results',
          statusCode: 500
        },
        status: 500
      };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTestResults().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('submitManualDonorInterface', () => {
    it('should submit manual donor interface with correct payload structure', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Donor information submitted successfully',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('W123418051501', 'yes', 'no', '62').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Donor information submitted successfully');
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        {
          unitId: 'W123418051501',
          chapterId: '123',
          donorChecked: 'Y',
          permanentAssertion: 'N',
          priorAbo: '62'
        }
      );
    });

    it('should convert "yes" to "Y" and "no" to "N" in payload', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('ABC123', 'yes', 'yes', 'POS').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        jasmine.objectContaining({
          donorChecked: 'Y',
          permanentAssertion: 'Y'
        })
      );
    });

    it('should convert "no" values correctly', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('ABC123', 'no', 'no', 'NEG').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        jasmine.objectContaining({
          donorChecked: 'N',
          permanentAssertion: 'N'
        })
      );
    });

    it('should trimEnd whitespace from unitId (preserve leading spaces for Codabar eye_read prefixes)', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('  W123418051501  ', 'yes', 'yes', '62').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        jasmine.objectContaining({
          unitId: '  W123418051501'
        })
      );
    });

    it('should use chapterId from HeaderService', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('ABC123', 'yes', 'no', '06').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        jasmine.objectContaining({
          chapterId: '123'
        })
      );
    });

    it('should handle error during submission', (done) => {
      const error = {
        error: {
          success: false,
          message: 'Unit ID not found',
          statusCode: 404
        },
        status: 404
      };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.submitManualDonorInterface('INVALID', 'yes', 'yes', '62').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });

    it('should handle empty chapterId', (done) => {
      (headerServiceSpy as any).chapterId = () => null;

      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('ABC123', 'yes', 'yes', '62').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        jasmine.objectContaining({
          chapterId: ''
        })
      );
    });

    it('should include all required fields in payload', (done) => {
      const mockResponse: ManualDonorInterfaceResponseDto = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.submitManualDonorInterface('W123418051501', 'no', 'yes', '84').subscribe(() => {
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        '/api/v1/manual-donor-interface/process',
        {
          unitId: 'W123418051501',
          chapterId: '123',
          donorChecked: 'N',
          permanentAssertion: 'Y',
          priorAbo: '84'
        }
      );
    });
  });
});
