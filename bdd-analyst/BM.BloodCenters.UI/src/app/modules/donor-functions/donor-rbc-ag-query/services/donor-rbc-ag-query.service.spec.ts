import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DonorRbcAgQueryService } from './donor-rbc-ag-query.service';
import { ApiService } from '@shared/services/api.service';
import { DonorRbcAgQueryDto, DonorRbcAgQueryResponse } from '../models/donor-rbc-ag-query.model';

describe('DonorRbcAgQueryService', () => {
  let service: DonorRbcAgQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDonorData: DonorRbcAgQueryDto = {
    donorId: 'D001',
    fullName: 'BOLTON, CALVIN',
    dateOfBirth: '1980-03-11T00:00:00Z',
    bloodType: 'O Positive',
    gender: 'Male',
    ethnicGroup: 'Caucasian',
    genotype: 'C+c-E-e+Jka-Jkb+Fya-Fyb-M-N-S+s-U-(K1,JK1,FY1,FYbneg)(JK2pos)',
    antigenTests: [
      {
        donorId: 'D001',
        antigenCode: 'Fya',
        resultCode: '-',
        confirmFlag: 'Y',
        confirmDate: '2025-06-16T00:00:00Z',
        primaryRuleId: 1,
        resultPending: 0,
        serologicalTests: [
          {
            donorId: 'D001',
            antigenCode: 'Fya',
            testType: 'SER',
            testSeqNo: 1,
            unitId: 'W633324021301',
            testId: 'Fya',
            collDate: '2025-06-26T00:00:00Z',
            testResult: '-',
            confirmStatus: 'Y',
            licensedFlag: 'L',
            excludeFlag: 'N',
            testDate: '2025-06-26T10:30:00Z',
            insertDate: '2025-06-26T10:35:00Z',
            insertUser: 'USER01',
            programId: 'AGTEST'
          }
        ],
        molecularTests: [
          {
            donorId: 'D001',
            antigenCode: 'Fya',
            testType: 'MOL',
            testSeqNo: 1,
            unitId: 'W633324021301',
            testId: 'FY1 (Fya)',
            collDate: '2025-06-26T00:00:00Z',
            testResult: '-',
            confirmStatus: 'Y',
            licensedFlag: 'L',
            excludeFlag: 'N',
            testDate: '2025-06-26T11:00:00Z',
            insertDate: '2025-06-26T11:30:00Z',
            insertUser: 'USER02',
            programId: 'MOLTEST'
          }
        ],
        rules: [],
        insertDate: '2025-06-26T10:35:00Z',
        insertUser: 'USER01',
        programId: 'AGTEST'
      }
    ]
  };

  const mockResponse: DonorRbcAgQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Donor RBC antigen query retrieved successfully',
    item: mockDonorData
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonorRbcAgQueryService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DonorRbcAgQueryService);
  });

  describe('getDonorRbcAgQuery', () => {
    it('should fetch donor RBC antigen query data', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorRbcAgQuery('D001').subscribe({
        next: (data) => {
          expect(data).toEqual(mockDonorData);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('/donor-rbc-ag-query/D001')
          );
          done();
        },
        error: done.fail
      });
    });


  });

  describe('getDonorRbcAgQueryByAntigen', () => {
    it('should fetch donor data filtered by antigen', (done) => {
      const filteredResponse: DonorRbcAgQueryResponse = {
        ...mockResponse,
        item: {
          ...mockDonorData,
          antigenTests: mockDonorData.antigenTests.filter(t => t.antigenCode === 'Fya')
        }
      };

      apiServiceSpy.get.and.returnValue(of(filteredResponse));

      service.getDonorRbcAgQueryByAntigen('D001', 'Fya').subscribe({
        next: (data) => {
          expect(data.antigenTests.length).toBe(1);
          expect(data.antigenTests[0].antigenCode).toBe('Fya');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('/donor-rbc-ag-query/D001/antigen/Fya')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty antigen tests if antigen not found', (done) => {
      const emptyResponse: DonorRbcAgQueryResponse = {
        ...mockResponse,
        item: {
          ...mockDonorData,
          antigenTests: []
        }
      };

      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getDonorRbcAgQueryByAntigen('D001', 'INVALID').subscribe({
        next: (data) => {
          expect(data.antigenTests.length).toBe(0);
          done();
        },
        error: done.fail
      });
    });

  });

  describe('updateGenotype', () => {
    it('should call API with correct payload', (done) => {
      const payload = {
        donorId: 'D001',
        genoType: 'K+k- E-e+'
      };

      const mockResponse = {
        success: true,
        item: true,
        message: 'Genotype updated successfully',
        statusCode: 200
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateGenotype(payload).subscribe({
        next: (response) => {
          expect(apiServiceSpy.put).toHaveBeenCalled();
          expect(response).toEqual(mockResponse);
          done();
        },
        error: () => done.fail('should have succeeded')
      });
    });
  });

  describe('bulkUpdateExcludeFlag', () => {
    it('should call API with array of exclude flags', (done) => {
      const payload = [
        {
          unitId: 'W633324032702',
          testId: 'C',
          testType: 'SER',
          excludeFlag: 'Y' as const
        },
        {
          unitId: 'W633312070468',
          testId: 'C',
          testType: 'SER',
          excludeFlag: 'N' as const
        }
      ];

      const mockResponse = {
        success: true,
        item: true,
        message: 'Exclude flags updated successfully',
        statusCode: 200
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.bulkUpdateExcludeFlag(payload).subscribe({
        next: (response) => {
          expect(apiServiceSpy.put).toHaveBeenCalled();
          expect(response).toEqual(mockResponse);
          done();
        },
        error: () => done.fail('should have succeeded')
      });
    });
  });

  describe('excludeUnits', () => {
    it('should throw error when API endpoint not available', (done) => {
      const payload = {
        donorId: 'D001',
        antigenCode: 'Fya',
        serologicalTestsToExclude: [],
        molecularTestsToExclude: []
      };

      service.excludeUnits(payload).subscribe({
        next: () => done.fail('should have failed'),
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.message).toContain('API endpoint not available');
          done();
        }
      });
    });
  });
});
