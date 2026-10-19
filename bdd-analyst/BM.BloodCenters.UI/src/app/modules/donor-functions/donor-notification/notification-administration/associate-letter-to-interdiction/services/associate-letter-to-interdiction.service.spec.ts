import { TestBed } from '@angular/core/testing';
import { AssociateLetterToInterdictionService } from './associate-letter-to-interdiction.service';
import { ApiService } from '@shared/services/api.service';
import {
  AssociateLetterToInterdictionModel,
  AssociateLetterToInterdictionSearchRequest,
  AssociateLetterToInterdictionFilterRequest,
  CreateAssociateLetterToInterdictionDto,
  UpdateAssociateLetterToInterdictionDto,
  InterdictionDropdown,
  DonationTypeDropdown,
  LetterDropdown,
  FilterLetterDropdown
} from '../models/associate-letter-to-interdiction.model';
import { of, throwError } from 'rxjs';

describe('AssociateLetterToInterdictionService', () => {
  let service: AssociateLetterToInterdictionService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockData: AssociateLetterToInterdictionModel[] = [
    {
      interCode: 'D01',
      interDesc: 'Deferred - Travel',
      donationType: 'WB',
      donationDesc: 'Whole Blood',
      letterId: 'LTR001',
      effDate: '2025-01-01T00:00:00',
      termDate: null,
      insertDate: '2025-01-01T12:00:00',
      insertUser: 'admin',
      chapterId: 'CH01',
      programId: 'DEWLTINT'
    },
    {
      interCode: 'D02',
      interDesc: 'Deferred - Medical',
      donationType: 'PLT',
      donationDesc: 'Platelets',
      letterId: 'LTR002',
      effDate: '2025-02-01T00:00:00',
      termDate: '2025-12-31T00:00:00',
      insertDate: '2025-02-01T12:00:00',
      insertUser: 'admin',
      chapterId: 'CH01',
      programId: 'DEWLTINT'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AssociateLetterToInterdictionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AssociateLetterToInterdictionService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('search', () => {
    it('should fetch list data via POST successfully', (done) => {
      const request: AssociateLetterToInterdictionSearchRequest = {
        take: 10,
        skip: 0,
        sortColumn: 'InterCode',
        sortOrder: 'ASC'
      };
      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: mockData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.search(request).subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockData);
          expect(response.totalRecords).toBe(2);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('notification-letter-associations/search'),
            request
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle error when search fails', (done) => {
      const errorResponse = { status: 500, message: 'Internal Server Error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.search({ take: 10, skip: 0 }).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should pass filter and sort params in request body', (done) => {
      const request: AssociateLetterToInterdictionSearchRequest = {
        take: 25,
        skip: 50,
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        searchKeyword: 'test',
        sortColumn: 'InterCode',
        sortOrder: 'DESC'
      };

      apiService.post.and.returnValue(of({ data: [], total: 0 }));

      service.search(request).subscribe({
        next: () => {
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('search'),
            request
          );
          done();
        }
      });
    });
  });

  describe('getByCompositeKey', () => {
    it('should fetch a single record by composite key', (done) => {
      const mockResponse = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: mockData[0]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getByCompositeKey('D01', 'WB', 'LTR001').subscribe({
        next: (response) => {
          expect(response).toEqual(mockData[0]);
          expect(apiService.get).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });

    it('should handle 404 error for non-existent record', (done) => {
      const errorResponse = { status: 404, error: { message: 'Notification letter association not found' } };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getByCompositeKey('INVALID', 'XX', 'YY').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('create', () => {
    it('should create a new association successfully', (done) => {
      const payload: CreateAssociateLetterToInterdictionDto = {
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: '2025-06-01T00:00:00',
        termDate: '2026-12-31T00:00:00'
      };

      const mockResponse = {
        success: true,
        message: 'Notification letter association created successfully.',
        statusCode: 201,
        data: payload
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.create(payload).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('notification-letter-associations'),
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle 409 conflict error for duplicate', (done) => {
      const payload: CreateAssociateLetterToInterdictionDto = {
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: '2025-06-01T00:00:00'
      };

      const errorResponse = {
        status: 409,
        error: {
          success: false,
          statusCode: 409,
          errorCode: '18132',
          errorResponse: {
            errorCode: '18132',
            errorMessage: 'Duplicate interdiction code and donation type combination'
          }
        }
      };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.create(payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should handle 400 validation error', (done) => {
      const payload: CreateAssociateLetterToInterdictionDto = {
        interCode: 'D01',
        donationType: 'WB',
        letterId: 'LTR001',
        effDate: ''
      };

      const errorResponse = {
        status: 400,
        error: {
          success: false,
          message: 'Validation failed',
          statusCode: 400,
          errorCode: '5002',
          errorResponse: { errorCode: '5002', errorMessage: 'Effective date is required' }
        }
      };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.create(payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('should update an existing association successfully', (done) => {
      const payload: UpdateAssociateLetterToInterdictionDto = {
        effDate: '2025-06-01T00:00:00',
        termDate: '2026-12-31T00:00:00'
      };

      const mockResponse = {
        success: true,
        message: 'Notification letter association updated successfully.',
        statusCode: 200,
        data: { ...mockData[0], ...payload }
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.update('D01', 'WB', 'LTR001', payload).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });

    it('should handle 404 error when updating non-existent record', (done) => {
      const payload: UpdateAssociateLetterToInterdictionDto = {
        effDate: '2025-06-01T00:00:00'
      };

      const errorResponse = { status: 404, error: { message: 'Notification letter association not found.' } };
      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.update('INVALID', 'XX', 'YY', payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete an association successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Notification letter association deleted successfully',
        statusCode: 200
      };

      apiService.delete.and.returnValue(of(mockResponse));

      service.delete('D01', 'WB', 'LTR001').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiService.delete).toHaveBeenCalled();
          done();
        },
        error: done.fail
      });
    });

    it('should handle 404 error when deleting non-existent record', (done) => {
      const errorResponse = { status: 404, error: { message: 'Notification letter association not found or already deleted' } };
      apiService.delete.and.returnValue(throwError(() => errorResponse));

      service.delete('INVALID', 'XX', 'YY').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getInterdictionsDropdown', () => {
    it('should fetch interdiction dropdown options successfully', (done) => {
      const mockOptions: InterdictionDropdown[] = [
        { interCode: 'D01', interDesc: 'Deferred - Travel' },
        { interCode: 'D02', interDesc: 'Deferred - Medical' }
      ];
      const mockResponse = { success: true, statusCode: 200, data: mockOptions };

      apiService.get.and.returnValue(of(mockResponse));

      service.getInterdictionsDropdown().subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.get).toHaveBeenCalledWith(jasmine.stringContaining('interdictions-dropdown'));
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty dropdown response', (done) => {
      apiService.get.and.returnValue(of({ success: true, statusCode: 200, data: undefined }));

      service.getInterdictionsDropdown().subscribe({
        next: (options) => {
          expect(options).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when fetching interdictions fails', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getInterdictionsDropdown().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual({ status: 500 });
          done();
        }
      });
    });
  });

  describe('getDonationTypesDropdown', () => {
    it('should fetch donation type dropdown options successfully', (done) => {
      const mockOptions: DonationTypeDropdown[] = [
        { donationType: 'WB', description: 'Whole Blood' },
        { donationType: 'PLT', description: 'Platelets' }
      ];
      apiService.get.and.returnValue(of({ success: true, statusCode: 200, data: mockOptions }));

      service.getDonationTypesDropdown().subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.get).toHaveBeenCalledWith(jasmine.stringContaining('donation-types-dropdown'));
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getLettersDropdown', () => {
    it('should fetch letter dropdown options successfully', (done) => {
      const mockOptions: LetterDropdown[] = [
        { letterCode: 'N', letterId: 'LTR001', letterTitle: 'Deferral Notification' },
        { letterCode: 'N', letterId: 'LTR002', letterTitle: 'Post-Donation Letter' }
      ];
      apiService.get.and.returnValue(of({ success: true, statusCode: 200, data: mockOptions }));

      service.getLettersDropdown().subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.get).toHaveBeenCalledWith(jasmine.stringContaining('letters-dropdown'));
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getFilterInterdictionsDropdown', () => {
    it('should fetch filtered interdiction options via POST', (done) => {
      const filter: AssociateLetterToInterdictionFilterRequest = {
        interCode: null,
        donationType: 'WB',
        letterId: null
      };
      const mockOptions: InterdictionDropdown[] = [
        { interCode: 'D01', interDesc: 'Deferred - Travel' }
      ];
      apiService.post.and.returnValue(of({ success: true, statusCode: 200, data: mockOptions }));

      service.getFilterInterdictionsDropdown(filter).subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('filter-interdictions-dropdown'),
            filter
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getFilterDonationTypesDropdown', () => {
    it('should fetch filtered donation type options via POST', (done) => {
      const filter: AssociateLetterToInterdictionFilterRequest = {
        interCode: 'D01',
        donationType: null,
        letterId: null
      };
      const mockOptions: DonationTypeDropdown[] = [
        { donationType: 'WB', description: 'Whole Blood' }
      ];
      apiService.post.and.returnValue(of({ success: true, statusCode: 200, data: mockOptions }));

      service.getFilterDonationTypesDropdown(filter).subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('filter-donation-types-dropdown'),
            filter
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getFilterLettersDropdown', () => {
    it('should fetch filtered letter options via POST', (done) => {
      const filter: AssociateLetterToInterdictionFilterRequest = {
        interCode: 'D01',
        donationType: 'WB',
        letterId: null
      };
      const mockOptions: FilterLetterDropdown[] = [
        { letterId: 'LTR001', letterTitle: 'Letter One' },
        { letterId: 'LTR002', letterTitle: 'Letter Two' }
      ];
      apiService.post.and.returnValue(of({ success: true, statusCode: 200, data: mockOptions }));

      service.getFilterLettersDropdown(filter).subscribe({
        next: (options) => {
          expect(options).toEqual(mockOptions);
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('filter-letters-dropdown'),
            filter
          );
          done();
        },
        error: done.fail
      });
    });
  });
});
