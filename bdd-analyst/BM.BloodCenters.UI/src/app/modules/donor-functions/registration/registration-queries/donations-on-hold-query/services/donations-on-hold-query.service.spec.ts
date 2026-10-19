import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DonationsOnHoldQueryService } from './donations-on-hold-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonationsOnHoldApiResponse,
  DonationOnHold,
  DonationsOnHoldRequest,
  DonationHoldDetail,
  DonorHoldDetail,
  DonationsOnHoldLookups,
  LookupItem,
} from '../models/donations-on-hold-query.model';

describe('DonationsOnHoldQueryService', () => {
  let service: DonationsOnHoldQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockChapterId = 'CH001';

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'get']);
    mockHeaderService = createMockHeaderService();

    TestBed.configureTestingModule({
      providers: [
        DonationsOnHoldQueryService,
        { provide: ApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    });

    service = TestBed.inject(DonationsOnHoldQueryService);
  });


  describe('search', () => {
    const mockRequest: DonationsOnHoldRequest = {
      ShowTerminated: true,
      FromDate: '2025-01-01',
      ToDate: '2025-01-31',
    };

    const mockData: DonationOnHold[] = [
      {
        unitId: 'W633317102804',
        displayUnitId: 'W633317102804-L',
        driveId: 'DRV0164777',
        collDate: '2025-01-11',
        donorId: 'DN30120470',
        donationType: 'AL',
        procedureCode: 'WB',
        insertUser: 'CELHUN',
        insertDate: '2025-01-11T09:05:00',
        auditFlag: '--',
        transactionId: 'TXN001',
      },
    ];

    it('should call API with correct endpoint including take/skip', () => {
      const mockResponse: DonationsOnHoldApiResponse<DonationOnHold> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockData,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest, 100, 0).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/100/0',
        mockRequest,
        jasmine.objectContaining({ headers: jasmine.anything() }),
      );
    });

    it('should use default take/skip when not provided', () => {
      const mockResponse: DonationsOnHoldApiResponse<DonationOnHold> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockData,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/5000/0',
        mockRequest,
        jasmine.objectContaining({ headers: jasmine.anything() }),
      );
    });

    it('should return donations on hold data with total', () => {
      const mockResponse: DonationsOnHoldApiResponse<DonationOnHold> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockData,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest).subscribe((result) => {
        expect(result.data).toEqual(mockData);
        expect(result.total).toBe(1);
      });
    });





    it('should return empty data for 404 with success true', (done) => {
      const error = { status: 404, error: { success: true } };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.search(mockRequest).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should throw error for 404 without success true', (done) => {
      const error = { status: 404, error: { success: false } };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.search(mockRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });
    });

    it('should throw error for non-404 errors', (done) => {
      const error = { status: 500, message: 'Server Error' };
      mockApiService.post.and.returnValue(throwError(() => error));

      service.search(mockRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });

    it('should default null data to empty array and null total to 0', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: null as any,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should pass through appliedFromDate and appliedToDate from response', (done) => {
      const mockResponse: DonationsOnHoldApiResponse<DonationOnHold> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockData,
        total: 1,
        appliedFromDate: '2025-01-01',
        appliedToDate: '2025-01-31',
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest).subscribe((result) => {
        expect(result.appliedFromDate).toBe('2025-01-01');
        expect(result.appliedToDate).toBe('2025-01-31');
        done();
      });
    });

    it('should leave appliedFromDate and appliedToDate undefined when not in response', (done) => {
      const mockResponse: DonationsOnHoldApiResponse<DonationOnHold> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockData,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.search(mockRequest).subscribe((result) => {
        expect(result.appliedFromDate).toBeUndefined();
        expect(result.appliedToDate).toBeUndefined();
        done();
      });
    });
  });

  describe('getDonationHolds', () => {
    const mockBackendHolds = [
      {
        interType: 'HOLDS',
        interCode: 'H001',
        interDescription: 'Test hold reason',
        insertDate: '2025-01-01T10:00:00',
        termDate: '2025-12-31',
        releaseDate: '2025-06-15',
        comments: 'Some comments',
      },
    ];

    it('should call API with correct endpoint and activeOnly param', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationHolds('W633317102804-L', true).subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/W633317102804-L/donation-holds',
        jasmine.objectContaining({
          headers: jasmine.anything(),
          params: jasmine.anything(),
        }),
      );
    });

    it('should map backend field names to frontend model', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationHolds('W633317102804-L').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].interType).toBe('HOLDS');
        expect(result[0].holdCode).toBe('H001');
        expect(result[0].description).toBe('Test hold reason');
        expect(result[0].createdDate).toBe('2025-01-01T10:00:00');
        expect(result[0].terminationDate).toBe('2025-12-31');
        expect(result[0].comments).toBe('Some comments');
        expect(result[0].effectiveDate).toBe('2025-06-15');
        done();
      });
    });



    it('should pass activeOnly=false when specified', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationHolds('W633317102804-L', false).subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('activeOnly')).toBe('false');
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: 0,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationHolds('W633317102804-L').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default missing backend fields to empty strings', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ interType: 'HOLDS' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationHolds('W633317102804-L').subscribe((result) => {
        expect(result[0].holdCode).toBe('');
        expect(result[0].description).toBe('');
        expect(result[0].createdDate).toBe('');
        expect(result[0].terminationDate).toBe('');
        expect(result[0].comments).toBe('');
        expect(result[0].effectiveDate).toBe('');
        expect(result[0].status).toBe('');
        expect(result[0].createdBy).toBe('');
        done();
      });
    });

    it('should throw error on failure', (done) => {
      const error = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDonationHolds('W633317102804-L').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('getDonorHolds', () => {
    const mockBackendHolds = [
      {
        interType: 'HOLDS',
        interCode: 'DH001',
        interDescription: 'Donor hold reason',
        effDate: '2025-01-01',
        termDate: '2025-12-31',
        insertDate: '2025-01-01T08:30:00',
        transactionId: 'TXN001',
      },
    ];

    it('should call API with correct endpoint including transactionId and donorId', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonorHolds('W633317102804-L', 'DN30120470', true).subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/W633317102804-L/donor-holds/DN30120470',
        jasmine.objectContaining({
          headers: jasmine.anything(),
          params: jasmine.anything(),
        }),
      );
    });

    it('should map backend field names to frontend model', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonorHolds('W633317102804-L', 'DN30120470').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].interType).toBe('HOLDS');
        expect(result[0].holdCode).toBe('DH001');
        expect(result[0].description).toBe('Donor hold reason');
        expect(result[0].effectiveDate).toBe('2025-01-01');
        expect(result[0].terminationDate).toBe('2025-12-31');
        expect(result[0].createdDate).toBe('2025-01-01T08:30:00');
        expect(result[0].interdictionCode).toBe('DH001');
        expect(result[0].donorId).toBe('DN30120470');
        done();
      });
    });



    it('should pass activeOnly=false when specified', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockBackendHolds,
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonorHolds('W633317102804-L', 'DN30120470', false).subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('activeOnly')).toBe('false');
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: 0,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonorHolds('W633317102804-L', 'DN30120470').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default missing backend fields to empty strings', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [{ interType: 'HOLDS' }],
        total: 1,
        errorResponse: { errorCode: '', error: '' },
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonorHolds('W633317102804-L', 'DN30120470').subscribe((result) => {
        expect(result[0].holdCode).toBe('');
        expect(result[0].description).toBe('');
        expect(result[0].effectiveDate).toBe('');
        expect(result[0].terminationDate).toBe('');
        expect(result[0].createdDate).toBe('');
        expect(result[0].status).toBe('');
        expect(result[0].interdictionCode).toBe('');
        expect(result[0].createdBy).toBe('');
        expect(result[0].donorId).toBe('DN30120470');
        done();
      });
    });

    it('should throw error on failure', (done) => {
      const error = { status: 500, message: 'Server Error' };
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDonorHolds('W633317102804-L', 'DN30120470').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('getLookups', () => {
    const mockLookupsResponse = {
      item: {
        drives: [{ code: 'DRV001', description: 'DRV001' }],
        users: [{ code: 'USR001', description: 'USR001' }],
        donationTypes: [{ code: 'WB', description: 'Whole Blood' }],
        procedureCodes: [{ code: 'PC01', description: 'Procedure 01' }],
        holdCodes: [{ code: 'H1', description: 'Hold Type 1' }],
      },
    };



    it('should map response to LookupOption format', () => {
      mockApiService.get.and.returnValue(of(mockLookupsResponse));

      service.getLookups().subscribe((result) => {
        expect(result.drives).toEqual([{ code: 'DRV001', description: 'DRV001' }]);
        expect(result.users).toEqual([{ code: 'USR001', description: 'USR001' }]);
        expect(result.donationTypes).toEqual([{ code: 'WB', description: 'Whole Blood' }]);
        expect(result.procedureCodes).toEqual([{ code: 'PC01', description: 'Procedure 01' }]);
        expect(result.holds).toEqual([{ code: 'H1', description: 'Hold Type 1' }]);
      });
    });

    it('should always include hardcoded showTerms', () => {
      mockApiService.get.and.returnValue(of(mockLookupsResponse));

      service.getLookups().subscribe((result) => {
        expect(result.showTerms).toEqual([
          { code: 'N', description: 'No' },
          { code: 'Y', description: 'Yes' },
        ]);
      });
    });

    it('should return empty lookups on error', () => {
      mockApiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getLookups().subscribe((result) => {
        expect(result.showTerms).toEqual([
          { code: 'N', description: 'No' },
          { code: 'Y', description: 'Yes' },
        ]);
        expect(result.drives).toEqual([]);
        expect(result.users).toEqual([]);
        expect(result.donationTypes).toEqual([]);
        expect(result.procedureCodes).toEqual([]);
        expect(result.holds).toEqual([]);
      });
    });

    it('should call API with correct lookups endpoint', () => {
      mockApiService.get.and.returnValue(of(mockLookupsResponse));

      service.getLookups().subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/lookups',
        jasmine.objectContaining({ headers: jasmine.anything() }),
      );
    });

    it('should map response using data property when item is not present', (done) => {
      const responseWithData = {
        data: {
          drives: [{ code: 'D1', description: 'Drive 1' }],
          users: [{ code: 'U1', description: 'User 1' }],
          donationTypes: [{ code: 'DT1', description: 'Type 1' }],
          procedureCodes: [{ code: 'PC1', description: 'Proc 1' }],
          holdCodes: [{ code: 'HC1', description: 'Hold 1' }],
        },
      };

      mockApiService.get.and.returnValue(of(responseWithData));

      service.getLookups().subscribe((result) => {
        expect(result.drives).toEqual([{ code: 'D1', description: 'Drive 1' }]);
        expect(result.users).toEqual([{ code: 'U1', description: 'User 1' }]);
        expect(result.donationTypes).toEqual([{ code: 'DT1', description: 'Type 1' }]);
        expect(result.procedureCodes).toEqual([{ code: 'PC1', description: 'Proc 1' }]);
        expect(result.holds).toEqual([{ code: 'HC1', description: 'Hold 1' }]);
        done();
      });
    });

    it('should map response using top-level properties when neither item nor data is present', (done) => {
      const responseDirectProps = {
        drives: [{ code: 'D2', description: 'Drive 2' }],
        users: [{ code: 'U2', description: 'User 2' }],
        donationTypes: [{ code: 'DT2', description: 'Type 2' }],
        procedureCodes: [{ code: 'PC2', description: 'Proc 2' }],
        holdCodes: [{ code: 'HC2', description: 'Hold 2' }],
      };

      mockApiService.get.and.returnValue(of(responseDirectProps));

      service.getLookups().subscribe((result) => {
        expect(result.drives).toEqual([{ code: 'D2', description: 'Drive 2' }]);
        expect(result.users).toEqual([{ code: 'U2', description: 'User 2' }]);
        expect(result.holds).toEqual([{ code: 'HC2', description: 'Hold 2' }]);
        done();
      });
    });

    it('should use code as description fallback when description is missing', (done) => {
      const responseWithMissingDescriptions = {
        item: {
          drives: [{ code: 'D1', description: '' }],
          users: [{ code: 'U1' }],
          donationTypes: [],
          procedureCodes: [],
          holdCodes: [],
        },
      };

      mockApiService.get.and.returnValue(of(responseWithMissingDescriptions));

      service.getLookups().subscribe((result) => {
        expect(result.drives).toEqual([{ code: 'D1', description: 'D1' }]);
        expect(result.users).toEqual([{ code: 'U1', description: 'U1' }]);
        done();
      });
    });

    it('should handle undefined arrays in lookups response', (done) => {
      const responseWithUndefinedArrays = {
        item: {} as any,
      };

      mockApiService.get.and.returnValue(of(responseWithUndefinedArrays));

      service.getLookups().subscribe((result) => {
        expect(result.drives).toEqual([]);
        expect(result.users).toEqual([]);
        expect(result.donationTypes).toEqual([]);
        expect(result.procedureCodes).toEqual([]);
        expect(result.holds).toEqual([]);
        done();
      });
    });
  });

  describe('getDrivesLookup', () => {
    it('should call API with correct endpoint', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getDrivesLookup().subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/drives-lookup',
        jasmine.objectContaining({ headers: jasmine.anything() }),
      );
    });

    it('should return mapped drive lookup items', (done) => {
      const mockResponse = {
        data: [
          { code: 'DRV001', description: 'Drive One' },
          { code: 'DRV002', description: 'Drive Two' },
        ],
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDrivesLookup().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'DRV001', description: 'Drive One' });
        expect(result[1]).toEqual({ code: 'DRV002', description: 'Drive Two' });
        done();
      });
    });

    it('should pass fromDate and toDate as query params when provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getDrivesLookup('2025-01-01', '2025-01-31').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('fromDate')).toBe('2025-01-01');
      expect(params.get('toDate')).toBe('2025-01-31');
    });

    it('should pass only fromDate when toDate is not provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getDrivesLookup('2025-01-01').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('fromDate')).toBe('2025-01-01');
      expect(params.has('toDate')).toBe(false);
    });

    it('should pass only toDate when fromDate is not provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getDrivesLookup(undefined, '2025-01-31').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.has('fromDate')).toBe(false);
      expect(params.get('toDate')).toBe('2025-01-31');
    });

    it('should not set date params when neither fromDate nor toDate provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getDrivesLookup().subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.has('fromDate')).toBe(false);
      expect(params.has('toDate')).toBe(false);
    });

    it('should use code as description fallback when description is missing', (done) => {
      const mockResponse = {
        data: [{ code: 'DRV001', description: '' }],
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDrivesLookup().subscribe((result) => {
        expect(result[0]).toEqual({ code: 'DRV001', description: 'DRV001' });
        done();
      });
    });

    it('should return empty array when response data is null', (done) => {
      mockApiService.get.and.returnValue(of({ data: null }));

      service.getDrivesLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getDrivesLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getUsersLookup', () => {
    it('should call API with correct endpoint', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getUsersLookup().subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/donations-on-hold/users-lookup',
        jasmine.objectContaining({ headers: jasmine.anything() }),
      );
    });

    it('should return mapped user lookup items', (done) => {
      const mockResponse = {
        data: [
          { code: 'USR001', description: 'User One' },
          { code: 'USR002', description: 'User Two' },
        ],
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getUsersLookup().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'USR001', description: 'User One' });
        expect(result[1]).toEqual({ code: 'USR002', description: 'User Two' });
        done();
      });
    });

    it('should pass fromDate and toDate as query params when provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getUsersLookup('2025-01-01', '2025-01-31').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('fromDate')).toBe('2025-01-01');
      expect(params.get('toDate')).toBe('2025-01-31');
    });

    it('should pass only fromDate when toDate is not provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getUsersLookup('2025-01-01').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.get('fromDate')).toBe('2025-01-01');
      expect(params.has('toDate')).toBe(false);
    });

    it('should pass only toDate when fromDate is not provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getUsersLookup(undefined, '2025-01-31').subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.has('fromDate')).toBe(false);
      expect(params.get('toDate')).toBe('2025-01-31');
    });

    it('should not set date params when neither fromDate nor toDate provided', () => {
      mockApiService.get.and.returnValue(of({ data: [] }));

      service.getUsersLookup().subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      const params = callArgs[1].params;
      expect(params.has('fromDate')).toBe(false);
      expect(params.has('toDate')).toBe(false);
    });

    it('should use code as description fallback when description is missing', (done) => {
      const mockResponse = {
        data: [{ code: 'USR001', description: '' }],
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getUsersLookup().subscribe((result) => {
        expect(result[0]).toEqual({ code: 'USR001', description: 'USR001' });
        done();
      });
    });

    it('should return empty array when response data is null', (done) => {
      mockApiService.get.and.returnValue(of({ data: null }));

      service.getUsersLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getUsersLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
