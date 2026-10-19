import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HlaResultsService } from './hla-results.service';
import { ApiService } from '@shared/services/api.service';
import {
  DonorHlaInfo,
  DonorHlaInfoResponse,
  SaveHlaResultsResponse,
  ValidHlaAntigensResponse
} from '../models/hla-results.model';

describe('HlaResultsService', () => {
  let service: HlaResultsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDonorInfo: DonorHlaInfo = {
    donorId: 'DN30132192',
    lastName: 'ROGERS',
    firstName: 'SHELIA',
    dateOfBirth: '2002-01-31T00:00:00Z',
    gender: 'Female',
    aboType: 'O Pos',
    collectionDate: '2024-12-08T00:00:00Z',
    prevA1: '2',
    prevA2: '30',
    prevB1: '12',
    prevB2: '54'
  };

  const mockDonorResponse: DonorHlaInfoResponse = {
    success: true,
    statusCode: 200,
    message: 'Donor information retrieved successfully',
    data: [mockDonorInfo],
    total: 1
  };

  const mockSaveResponse: SaveHlaResultsResponse = {
    success: true,
    statusCode: 200,
    message: 'HLA results saved successfully',
    data: [{
      donorId: 'DN30132192',
      chapterId: 'ALL',
      success: true,
      message: 'HLA results saved successfully'
    }],
    total: 1
  };

  const mockValidAntigensResponse: ValidHlaAntigensResponse = {
    success: true,
    statusCode: 200,
    message: 'Valid HLA antigens retrieved successfully',
    data: [[
      { epitopeId: '01', locus: 'A' },
      { epitopeId: '02', locus: 'A' },
      { epitopeId: '03', locus: 'A' }
    ]],
    total: 3
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        HlaResultsService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(HlaResultsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('retrieveDonorByUnitId', () => {
    it('should retrieve donor info by unit ID', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(of(mockDonorResponse));

      service.retrieveDonorByUnitId({ unitId: 'W633325063002-J' }).subscribe({
        next: (result: DonorHlaInfo | null) => {
          expect(result).toEqual(mockDonorInfo);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.any(String),
            { unitId: 'W633325063002-J' }
          );
          done();
        }
      });
    });



  });

  describe('saveHlaResults', () => {
    it('should save HLA results successfully', (done: DoneFn) => {
      apiServiceSpy.post.and.returnValue(of(mockSaveResponse));

      const request = {
        donorId: 'DN30132192',
        unitId: 'W633325063002-J',
        collDate: '2024-12-08',
        a1: '01',
        a2: '02',
        b1: '07',
        b2: '08'
      };

      service.saveHlaResults(request).subscribe({
        next: (result: SaveHlaResultsResponse) => {
          expect(result).toEqual(mockSaveResponse);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.any(String),
            request
          );
          done();
        }
      });
    });

  });

  describe('getValidAntigens', () => {
    it('should get valid A locus antigens', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of(mockValidAntigensResponse));

      service.getValidAntigens('A').subscribe({
        next: (result) => {
          expect(result.length).toBe(3);
          expect(result[0].epitopeId).toBe('01');
          expect(result[0].locus).toBe('A');
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        }
      });
    });



  });
});
