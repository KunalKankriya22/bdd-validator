import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ValidDonorOverrideApiService, ValidDonorOverrideQueryDto, LookupDto } from './valid-donor-override-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { DonorInterdictionOverrideQueryModel } from '../models/donor-interdiction-override-query.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('ValidDonorOverrideApiService', () => {
  let service: ValidDonorOverrideApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockDonorOverrideData: DonorInterdictionOverrideQueryModel[] = [
    {
      donorDecisionCode: 'A',
      decisionDesc: 'Accept',
      productType: 'WB',
      productTypeDesc: 'Whole Blood',
      attribGroup: 'GRP001',
      attribCode: 'ATTR001',
      interCode: 'INT01',
      interDesc: 'Interdiction 01',
      interType: 'H',
      overrideDesc: 'Hold Override',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      donorDecisionCode: 'R',
      decisionDesc: 'Reject',
      productType: 'PLT',
      productTypeDesc: 'Platelets',
      attribGroup: 'GRP002',
      attribCode: 'ATTR002',
      interCode: 'INT02',
      interDesc: 'Interdiction 02',
      interType: 'N',
      overrideDesc: 'None Override',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockApiResponse = {
    success: true,
    data: mockDonorOverrideData,
    total: 2,
    message: 'Successfully fetched valid donor overrides'
  };

  const mockLookupCueData: LookupDto[] = [
    { code: 'A', description: 'Accept' },
    { code: 'R', description: 'Reject' }
  ];

  const mockLookupTypeData: LookupDto[] = [
    { code: 'H', description: 'Hold' },
    { code: 'N', description: 'None' }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error']);
    mockSnackBar = createMockMatSnackBar();

    TestBed.configureTestingModule({
      providers: [
        ValidDonorOverrideApiService,
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    service = TestBed.inject(ValidDonorOverrideApiService);
  });

  describe('getValidDonorOverrides', () => {
    it('should fetch valid donor overrides successfully', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      const queryDto: ValidDonorOverrideQueryDto = {
        donorDecisionCode: 'A',
        searchKeyword: 'test'
      };

      service.getValidDonorOverrides(10, 0, queryDto).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].donorDecisionCode).toBe('A');
        expect(result.data[1].interType).toBe('N');
        done();
      });
    });

    it('should construct correct API endpoint with take and skip', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      const queryDto: ValidDonorOverrideQueryDto = {};

      service.getValidDonorOverrides(25, 50, queryDto).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringContaining('/25/50'),
          queryDto
        );
        done();
      });
    });


    it('should parse dates from string to Date objects', (done) => {
      const responseWithStringDates = {
        success: true,
        data: [
          {
            ...mockDonorOverrideData[0],
            effDate: '2025-01-01T00:00:00',
            termDate: '2025-12-31T00:00:00'
          }
        ],
        total: 1
      };
      mockApiService.post.and.returnValue(of(responseWithStringDates));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data[0].effDate).toBeInstanceOf(Date);
        expect(result.data[0].termDate).toBeInstanceOf(Date);
        done();
      });
    });

    it('should handle null dates gracefully', (done) => {
      const responseWithNullDates = {
        success: true,
        data: [
          {
            ...mockDonorOverrideData[0],
            effDate: null,
            termDate: null
          }
        ],
        total: 1
      };
      mockApiService.post.and.returnValue(of(responseWithNullDates));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data[0].effDate).toBeNull();
        expect(result.data[0].termDate).toBeNull();
        done();
      });
    });


    it('should throw error when response success is false', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: 'Failed to fetch data'
      };
      mockApiService.post.and.returnValue(of(failureResponse));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch data');
          done();
        }
      });
    });


    it('should log request parameters', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      const queryDto: ValidDonorOverrideQueryDto = {
        searchKeyword: 'test'
      };

      service.getValidDonorOverrides(10, 0, queryDto).subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith(
          'Fetching valid donor overrides',
          jasmine.objectContaining({ take: 10, skip: 0, queryDto })
        );
        done();
      });
    });

    it('should log success with count and total after fetching', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      service.getValidDonorOverrides(10, 0, {}).subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith(
          'Successfully fetched valid donor overrides',
          jasmine.objectContaining({ count: 2, total: 2 })
        );
        done();
      });
    });

    it('should handle API network error via catchError', (done) => {
      const networkError = new Error('Network error');
      mockApiService.post.and.returnValue(throwError(() => networkError));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(networkError);
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching valid donor overrides',
            networkError
          );
          done();
        }
      });
    });

    it('should use default error message when response message is undefined', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: undefined
      };
      mockApiService.post.and.returnValue(of(failureResponse));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch valid donor overrides');
          done();
        }
      });
    });

    it('should default total to 0 when response total is undefined', (done) => {
      const responseWithoutTotal = {
        success: true,
        data: [mockDonorOverrideData[0]],
        total: undefined
      };
      mockApiService.post.and.returnValue(of(responseWithoutTotal));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should handle mixed date values - effDate set, termDate null', (done) => {
      const responseWithMixedDates = {
        success: true,
        data: [
          {
            ...mockDonorOverrideData[0],
            effDate: '2025-06-15T00:00:00',
            termDate: null
          }
        ],
        total: 1
      };
      mockApiService.post.and.returnValue(of(responseWithMixedDates));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data[0].effDate).toBeInstanceOf(Date);
        expect(result.data[0].termDate).toBeNull();
        done();
      });
    });

    it('should handle mixed date values - effDate null, termDate set', (done) => {
      const responseWithMixedDates = {
        success: true,
        data: [
          {
            ...mockDonorOverrideData[0],
            effDate: null,
            termDate: '2025-12-31T00:00:00'
          }
        ],
        total: 1
      };
      mockApiService.post.and.returnValue(of(responseWithMixedDates));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data[0].effDate).toBeNull();
        expect(result.data[0].termDate).toBeInstanceOf(Date);
        done();
      });
    });

    it('should pass full queryDto with all filter parameters', (done) => {
      mockApiService.post.and.returnValue(of(mockApiResponse));

      const fullQueryDto: ValidDonorOverrideQueryDto = {
        donorDecisionCode: 'A',
        productType: 'WB',
        interCode: 'INT01',
        interType: 'H',
        searchKeyword: 'override',
        sort: 'donorDecisionCode',
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: '2025-12-31',
        terminationDateFrom: '2025-06-01',
        terminationDateTo: '2025-12-31'
      };

      service.getValidDonorOverrides(20, 10, fullQueryDto).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          fullQueryDto
        );
        done();
      });
    });

    it('should handle empty data array in response', (done) => {
      const emptyDataResponse = {
        success: true,
        data: [],
        total: 0
      };
      mockApiService.post.and.returnValue(of(emptyDataResponse));

      service.getValidDonorOverrides(10, 0, {}).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should log error when API call fails', (done) => {
      const apiError = { status: 500, message: 'Internal Server Error' };
      mockApiService.post.and.returnValue(throwError(() => apiError));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: () => {
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching valid donor overrides',
            apiError
          );
          done();
        }
      });
    });

    it('should re-throw the original error from catchError', (done) => {
      const originalError = { status: 403, statusText: 'Forbidden' };
      mockApiService.post.and.returnValue(throwError(() => originalError));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          done();
        }
      });
    });

    it('should use default error message when response message is empty string', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: ''
      };
      mockApiService.post.and.returnValue(of(failureResponse));

      service.getValidDonorOverrides(10, 0, {}).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch valid donor overrides');
          done();
        }
      });
    });
  });

  describe('getLookupCue', () => {
    it('should fetch lookup cue options successfully', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupCueData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupCue().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('A');
        expect(result[0].description).toBe('Accept');
        expect(result[1].code).toBe('R');
        done();
      });
    });

    it('should call correct API endpoint', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupCueData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupCue().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringContaining('lookup/cue')
        );
        done();
      });
    });

    it('should throw error when response success is false', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: 'Failed to fetch lookup cue options'
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup cue options');
          done();
        }
      });
    });


    it('should handle empty lookup data', (done) => {
      const emptyResponse = {
        success: true,
        data: []
      };
      mockApiService.get.and.returnValue(of(emptyResponse));

      service.getLookupCue().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should log fetch request', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupCueData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupCue().subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith('Fetching lookup cue options');
        done();
      });
    });

    it('should handle API network error via catchError', (done) => {
      const networkError = new Error('Network error');
      mockApiService.get.and.returnValue(throwError(() => networkError));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err).toBe(networkError);
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching lookup cue options',
            networkError
          );
          done();
        }
      });
    });

    it('should use default error message when response message is undefined', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: undefined
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup cue options');
          done();
        }
      });
    });

    it('should use default error message when response message is empty string', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: ''
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup cue options');
          done();
        }
      });
    });

    it('should log success with count after fetching', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupCueData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupCue().subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith(
          'Successfully fetched lookup cue options',
          jasmine.objectContaining({ count: 2 })
        );
        done();
      });
    });

    it('should log error when API call fails', (done) => {
      const apiError = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => apiError));

      service.getLookupCue().subscribe({
        error: () => {
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching lookup cue options',
            apiError
          );
          done();
        }
      });
    });

    it('should re-throw the original error from catchError', (done) => {
      const originalError = { status: 401, statusText: 'Unauthorized' };
      mockApiService.get.and.returnValue(throwError(() => originalError));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          done();
        }
      });
    });

    it('should return data with custom error message when response fails', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: 'Custom cue error message'
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupCue().subscribe({
        error: (err) => {
          expect(err.message).toBe('Custom cue error message');
          done();
        }
      });
    });
  });

  describe('getLookupType', () => {
    it('should fetch lookup type options successfully', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupTypeData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupType().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('H');
        expect(result[0].description).toBe('Hold');
        expect(result[1].code).toBe('N');
        done();
      });
    });

    it('should call correct API endpoint', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupTypeData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupType().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringContaining('lookup/type')
        );
        done();
      });
    });

    it('should throw error when response success is false', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: 'Failed to fetch lookup type options'
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup type options');
          done();
        }
      });
    });


    it('should handle empty lookup data', (done) => {
      const emptyResponse = {
        success: true,
        data: []
      };
      mockApiService.get.and.returnValue(of(emptyResponse));

      service.getLookupType().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should log fetch request', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupTypeData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupType().subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith('Fetching lookup type options');
        done();
      });
    });

    it('should handle API network error via catchError', (done) => {
      const networkError = new Error('Network error');
      mockApiService.get.and.returnValue(throwError(() => networkError));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err).toBe(networkError);
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching lookup type options',
            networkError
          );
          done();
        }
      });
    });

    it('should use default error message when response message is undefined', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: undefined
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup type options');
          done();
        }
      });
    });

    it('should use default error message when response message is empty string', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: ''
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch lookup type options');
          done();
        }
      });
    });

    it('should log success with count after fetching', (done) => {
      const lookupResponse = {
        success: true,
        data: mockLookupTypeData
      };
      mockApiService.get.and.returnValue(of(lookupResponse));

      service.getLookupType().subscribe(() => {
        expect(mockLoggingService.log).toHaveBeenCalledWith(
          'Successfully fetched lookup type options',
          jasmine.objectContaining({ count: 2 })
        );
        done();
      });
    });

    it('should log error when API call fails', (done) => {
      const apiError = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => apiError));

      service.getLookupType().subscribe({
        error: () => {
          expect(mockLoggingService.error).toHaveBeenCalledWith(
            'Error fetching lookup type options',
            apiError
          );
          done();
        }
      });
    });

    it('should re-throw the original error from catchError', (done) => {
      const originalError = { status: 404, statusText: 'Not Found' };
      mockApiService.get.and.returnValue(throwError(() => originalError));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          done();
        }
      });
    });

    it('should return data with custom error message when response fails', (done) => {
      const failureResponse = {
        success: false,
        data: [],
        message: 'Custom type error message'
      };
      mockApiService.get.and.returnValue(of(failureResponse));

      service.getLookupType().subscribe({
        error: (err) => {
          expect(err.message).toBe('Custom type error message');
          done();
        }
      });
    });
  });
});
