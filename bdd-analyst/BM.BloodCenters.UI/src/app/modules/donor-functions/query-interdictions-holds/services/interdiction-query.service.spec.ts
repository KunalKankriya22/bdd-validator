import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

import { InterdictionQueryService } from './interdiction-query.service';
import {
  InterdictionQueryParams,
  InterdictionCode,
  InterdictionType,
  DonationType,
  DonorInfo,
  OtherHoldsRequest,
  OtherHoldsResult,
  DonorAddressResult,
} from '../models/interdiction-query.model';

describe('InterdictionQueryService', () => {
  let service: InterdictionQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockParams: InterdictionQueryParams = {
    option: 'Interdiction',
    interCode: 'BPHLD',
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    showReleased: false,
  };

  const mockResults = [
    {
      unitId: 'UNIT001',
      interCode: 'BPHLD',
      interType: 'HOLD S',
      effDate: '2024-01-15',
      termDate: null,
      donorId: 'DON12345',
    },
    {
      unitId: 'UNIT002',
      interCode: 'TATTOO',
      interType: 'DEF',
      effDate: '2024-03-10',
      termDate: '2024-09-10',
      donorId: 'DON67890',
    },
  ];

  const mockInterdictionCodes: InterdictionCode[] = [
    { code: 'BPHLD', description: 'Blood Pressure Hold' },
    { code: 'TATTOO', description: 'Tattoo Deferral' },
    { code: 'PREG', description: 'Pregnancy' },
  ];

  const mockInterdictionTypes: InterdictionType[] = [
    { code: 'HOLD S', description: 'Soft Hold' },
    { code: 'DEF', description: 'Deferral' },
  ];

  const mockDonationTypes: DonationType[] = [
    { code: 'WB', description: 'Whole Blood' },
    { code: 'AL', description: 'Apheresis' },
  ];

  const mockDonorInfo: DonorInfo = {
    donorId: 'DON12345',
    lastName: 'Smith',
    firstName: 'John',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'Male',
  };

  const mockOtherHolds: OtherHoldsResult[] = [
    {
      interCode: 'BPHLD',
      interDesc: 'Blood Pressure Hold',
      originatedFrom: 'INQR',
      reasonCode: null,
      effDate: '2024-01-15',
      termDate: null,
    },
  ];

  const mockDonorAddress: DonorAddressResult = {
    streetName: '123 Main St',
    homePhone: '555-1234',
    businessPhone: '555-5678',
    email: 'john@example.com',
    intlAddr: null,
    intlHomePhone: null,
    intlWorkPhone: null,
    isInternational: false,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        InterdictionQueryService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(InterdictionQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ---------------------------------------------------------------
  // queryInterdictions
  // ---------------------------------------------------------------
  describe('queryInterdictions', () => {
    it('should POST to SEARCH and return mapped results using response.item', (done) => {
      const apiResponse = {
        success: true,
        message: 'OK',
        item: { results: mockResults, operation: 'AND', totalRecords: 2 },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.totalRecords).toBe(2);
          expect(result.results).toEqual(mockResults);
          expect(result.data!.operation).toBe('AND');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.SEARCH,
            mockParams
          );
          done();
        },
      });
    });

    it('should map results from response.data', (done) => {
      const apiResponse = {
        success: true,
        message: null,
        data: { results: mockResults, totalRecords: 2, operation: '-' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.results).toEqual(mockResults);
          expect(result.totalRecords).toBe(2);
          done();
        },
      });
    });

    it('should map results from response.Data (PascalCase)', (done) => {
      const apiResponse = {
        Success: true,
        Message: 'OK',
        Data: { Results: mockResults, TotalRecords: 2, Operation: 'OR' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.results).toEqual(mockResults);
          expect(result.totalRecords).toBe(2);
          expect(result.data!.operation).toBe('OR');
          done();
        },
      });
    });

    it('should return totalRecords from response when exceeding 700', (done) => {
      const apiResponse = {
        success: true,
        item: { results: mockResults, totalRecords: 750, operation: '-' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(750);
          done();
        },
      });
    });

    it('should return totalRecords from response when 700 or less', (done) => {
      const apiResponse = {
        success: true,
        item: { results: mockResults, totalRecords: 700, operation: '-' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(700);
          done();
        },
      });
    });

    it('should return defaults when data wrapper is missing', (done) => {
      const apiResponse = { success: true };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.results).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        },
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.message).toBe('Network error');
          expect(result.totalRecords).toBe(0);
          expect(result.results).toEqual([]);
          done();
        },
      });
    });

    it('should use fallback message when error has no message', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => ({}))
      );

      service.queryInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.message).toBe('Failed to query interdictions');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // queryDonorInterdictions
  // ---------------------------------------------------------------
  describe('queryDonorInterdictions', () => {
    it('should POST to SEARCH_DONORS and return mapped results', (done) => {
      const apiResponse = {
        success: true,
        message: 'OK',
        item: { results: mockResults, operation: '-', totalRecords: 2 },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryDonorInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.totalRecords).toBe(2);
          expect(result.results).toEqual(mockResults);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.SEARCH_DONORS,
            mockParams
          );
          done();
        },
      });
    });

    it('should map results from response.data', (done) => {
      const apiResponse = {
        success: true,
        data: { results: mockResults, totalRecords: 2, operation: '-' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryDonorInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.results).toEqual(mockResults);
          expect(result.totalRecords).toBe(2);
          done();
        },
      });
    });

    it('should map results from response.Data (PascalCase)', (done) => {
      const apiResponse = {
        Success: true,
        Data: { Results: mockResults, TotalRecords: 2, Operation: 'AND' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryDonorInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.results).toEqual(mockResults);
          expect(result.totalRecords).toBe(2);
          done();
        },
      });
    });

    it('should warn when totalRecords exceeds 700', (done) => {
      spyOn(console, 'warn');

      const apiResponse = {
        success: true,
        item: { results: [], totalRecords: 800, operation: '-' },
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.queryDonorInterdictions(mockParams).subscribe({
        next: () => {
          expect(console.warn).toHaveBeenCalledWith(
            jasmine.stringContaining('800')
          );
          done();
        },
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      service.queryDonorInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.message).toBe('Server error');
          expect(result.totalRecords).toBe(0);
          expect(result.results).toEqual([]);
          done();
        },
      });
    });

    it('should use fallback message when error has no message', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => ({}))
      );

      service.queryDonorInterdictions(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.message).toBe('Failed to query donor interdictions');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getValidInterdictionCodes
  // ---------------------------------------------------------------
  describe('getValidInterdictionCodes', () => {
    it('should GET interdiction codes and return response directly', (done) => {
      const apiResponse = {
        data: mockInterdictionCodes,
        success: true,
        message: '',
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidInterdictionCodes().subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(mockInterdictionCodes);
          expect(result.data.length).toBe(3);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_CODES_LOOKUP
          );
          done();
        },
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      service.getValidInterdictionCodes().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          expect(result.message).toBe('Failed to load');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getInterdictionCodes
  // ---------------------------------------------------------------
  describe('getInterdictionCodes', () => {
    it('should GET codes with option param only', (done) => {
      const apiResponse = { data: mockInterdictionCodes, success: true };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getInterdictionCodes('Interdiction').subscribe({
        next: (result) => {
          expect(result).toEqual(mockInterdictionCodes);
          expect(result.length).toBe(3);
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_CODES_LOOKUP
          );
          const params = callArgs[1].params;
          expect(params.get('option')).toBe('Interdiction');
          expect(params.has('interType')).toBe(false);
          done();
        },
      });
    });

    it('should GET codes with option and interType params', (done) => {
      const apiResponse = {
        data: [mockInterdictionCodes[0]],
        success: true,
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getInterdictionCodes('Hold', 'HOLD S').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params;
          expect(params.get('option')).toBe('Hold');
          expect(params.get('interType')).toBe('HOLD S');
          done();
        },
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true }));

      service.getInterdictionCodes('Interdiction').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Request failed'))
      );

      service.getInterdictionCodes('Interdiction').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getValidInterdictionTypes
  // ---------------------------------------------------------------
  describe('getValidInterdictionTypes', () => {
    it('should GET interdiction types successfully', (done) => {
      const apiResponse = {
        data: mockInterdictionTypes,
        success: true,
        message: '',
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidInterdictionTypes().subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(mockInterdictionTypes);
          expect(result.data.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.INTER_TYPES_LOOKUP
          );
          done();
        },
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Types fetch failed'))
      );

      service.getValidInterdictionTypes().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          expect(result.message).toBe('Types fetch failed');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getValidDonationTypes
  // ---------------------------------------------------------------
  describe('getValidDonationTypes', () => {
    it('should POST params and return donation types', (done) => {
      const apiResponse = {
        data: mockDonationTypes,
        success: true,
        message: '',
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.getValidDonationTypes(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(mockDonationTypes);
          expect(result.data.length).toBe(2);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONATION_TYPES_LOOKUP,
            mockParams
          );
          done();
        },
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => new Error('Donation types error'))
      );

      service.getValidDonationTypes(mockParams).subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          expect(result.message).toBe('Donation types error');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getInterdictionCodesByType
  // ---------------------------------------------------------------
  describe('getInterdictionCodesByType', () => {
    it('should GET codes with interType param only', (done) => {
      const apiResponse = {
        data: [mockInterdictionCodes[0]],
        success: true,
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getInterdictionCodesByType('HOLD S').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('BPHLD');
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params;
          expect(params.get('interType')).toBe('HOLD S');
          expect(params.has('description')).toBe(false);
          done();
        },
      });
    });

    it('should GET codes with interType and description params', (done) => {
      const apiResponse = {
        data: [mockInterdictionCodes[1]],
        success: true,
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getInterdictionCodesByType('DEF', 'Tattoo').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('TATTOO');
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params;
          expect(params.get('interType')).toBe('DEF');
          expect(params.get('description')).toBe('Tattoo');
          done();
        },
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, success: true }));

      service.getInterdictionCodesByType('HOLD S').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Fetch codes by type failed'))
      );

      service.getInterdictionCodesByType('INTER').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getMultipleSelectionInterdictions
  // ---------------------------------------------------------------
  describe('getMultipleSelectionInterdictions', () => {
    it('should map interdiction codes to MultipleInterdictionItem format on success', (done) => {
      const codesResponse = {
        data: mockInterdictionCodes,
        success: true,
        message: '',
      };

      apiServiceSpy.get.and.returnValue(of(codesResponse));

      service.getMultipleSelectionInterdictions().subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.data.length).toBe(3);

          const firstItem = result.data[0];
          expect(firstItem.interCode).toBe('BPHLD');
          expect(firstItem.description).toBe('Blood Pressure Hold');
          expect(firstItem.type).toBe('');
          expect(firstItem.selected).toBe(false);
          expect(firstItem.effDate).toBeDefined();
          expect(firstItem.termDate).toBeNull();
          done();
        },
      });
    });

    it('should return error response when success is false', (done) => {
      const codesResponse = {
        data: [],
        success: false,
        message: 'No access',
      };

      apiServiceSpy.get.and.returnValue(of(codesResponse));

      service.getMultipleSelectionInterdictions().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          expect(result.message).toBe('No access');
          done();
        },
      });
    });

    it('should return error response when data is null', (done) => {
      const codesResponse = {
        data: null as any,
        success: true,
        message: '',
      };

      apiServiceSpy.get.and.returnValue(of(codesResponse));

      service.getMultipleSelectionInterdictions().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          done();
        },
      });
    });

    it('should return error response on catchError', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Multiple selection error'))
      );

      service.getMultipleSelectionInterdictions().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(result.data).toEqual([]);
          expect(result.message).toBe('Multiple selection error');
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getDonorInfo
  // ---------------------------------------------------------------
  describe('getDonorInfo', () => {
    it('should GET donor info by ID', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDonorInfo));

      service.getDonorInfo('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorInfo);
          expect(result!.donorId).toBe('DON12345');
          expect(result!.lastName).toBe('Smith');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONOR_INFO('DON12345')
          );
          done();
        },
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Donor not found'))
      );

      service.getDonorInfo('INVALID').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getOtherHolds
  // ---------------------------------------------------------------
  describe('getOtherHolds', () => {
    const mockRequest: OtherHoldsRequest = {
      transactionId: 'TXN001',
      showTerminated: false,
    };

    it('should POST request and return other holds from response.data', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: mockOtherHolds }));

      service.getOtherHolds(mockRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(mockOtherHolds);
          expect(result.length).toBe(1);
          expect(result[0].interCode).toBe('BPHLD');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.OTHER_HOLDS,
            mockRequest
          );
          done();
        },
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: null }));

      service.getOtherHolds(mockRequest).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.post.and.returnValue(
        throwError(() => new Error('Other holds error'))
      );

      service.getOtherHolds(mockRequest).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  // ---------------------------------------------------------------
  // getDonorAddress
  // ---------------------------------------------------------------
  describe('getDonorAddress', () => {
    it('should GET donor address and return response.item', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockDonorAddress }));

      service.getDonorAddress('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorAddress);
          expect(result!.streetName).toBe('123 Main St');
          expect(result!.isInternational).toBe(false);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.QUERY_INTERDICTIONS_HOLDS.DONOR_ADDRESS('DON12345')
          );
          done();
        },
      });
    });

    it('should return null when response.item is missing', (done) => {
      apiServiceSpy.get.and.returnValue(of({}));

      service.getDonorAddress('DON12345').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(
        throwError(() => new Error('Address fetch failed'))
      );

      service.getDonorAddress('INVALID').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });
  });
});
