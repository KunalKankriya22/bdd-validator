import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VoidDonorInterfaceApiService } from './void-donor-interface-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UnitDetailsResponse,
  VoidInterfaceRequest,
  VoidInterfaceResponse,
} from '../models/void-donor-interface.model';

describe('VoidDonorInterfaceApiService', () => {
  let service: VoidDonorInterfaceApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  const mockUnitDetailsResponse: UnitDetailsResponse = {
    success: true,
    message: 'Unit details retrieved successfully',
    statusCode: 200,
    item: {
      unitId: 'W633312320062',
      collectionDate: '2012-04-09T00:00:00',
      donorToLabInterfacePerformedOn: '2012-04-12T14:45:31',
    },
    errorResponse: { errorCode: '', error: '' },
  };

  const mockVoidRequest: VoidInterfaceRequest = {
    unitId: 'W633312320062',
    collectionDate: '2012-04-09T00:00:00',
    confirmed: 'Y',
  };

  const mockVoidResponse: VoidInterfaceResponse = {
    success: true,
    message: 'Interface voided successfully',
    statusCode: 200,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error', 'info', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        VoidDonorInterfaceApiService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
      ],
    });
    service = TestBed.inject(VoidDonorInterfaceApiService);
  });

  describe('getUnitDetails', () => {
    it('should call the correct endpoint', () => {
      const unitId = 'W633312320062';
      apiServiceSpy.get.and.returnValue(of(mockUnitDetailsResponse));

      service.getUnitDetails(unitId).subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.VOID_DONOR_INTERFACE.GET_UNIT_DETAILS(unitId)
      );
    });

    it('should return unit details on success', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockUnitDetailsResponse));

      service.getUnitDetails('W633312320062').subscribe({
        next: (response) => {
          expect(response).toEqual(mockUnitDetailsResponse);
          expect(response.item.unitId).toBe('W633312320062');
          done();
        },
        error: done.fail,
      });
    });


    it('should log error and rethrow on API failure', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getUnitDetails('W633312320062').subscribe({
        error: () => {
          expect(loggingServiceSpy.error).toHaveBeenCalledWith('getUnitDetails failed', error);
          done();
        },
      });
    });
  });

  describe('voidInterface', () => {
    it('should call the correct endpoint with request data', () => {
      apiServiceSpy.post.and.returnValue(of(mockVoidResponse));

      service.voidInterface(mockVoidRequest).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.VOID_DONOR_INTERFACE.VOID,
        mockVoidRequest
      );
    });


    it('should send confirmed flag as "Y"', () => {
      apiServiceSpy.post.and.returnValue(of(mockVoidResponse));

      service.voidInterface(mockVoidRequest).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args[1] as VoidInterfaceRequest;
      expect(callArgs.confirmed).toBe('Y');
    });


    it('should log error and rethrow on API failure', (done) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.voidInterface(mockVoidRequest).subscribe({
        error: () => {
          expect(loggingServiceSpy.error).toHaveBeenCalledWith('voidInterface failed', error);
          done();
        },
      });
    });
  });

  describe('API Endpoint Constants', () => {
    it('should have correct getUnitDetails endpoint', () => {
      const unitId = 'TEST123';
      expect(API.VOID_DONOR_INTERFACE.GET_UNIT_DETAILS(unitId)).toBe(
        `/api/v1/admin/void-donor-interface/unit-details/${encodeURIComponent(unitId)}`
      );
    });

    it('should have correct void endpoint', () => {
      expect(API.VOID_DONOR_INTERFACE.VOID).toBe(
        '/api/v1/admin/void-donor-interface'
      );
    });
  });
});
