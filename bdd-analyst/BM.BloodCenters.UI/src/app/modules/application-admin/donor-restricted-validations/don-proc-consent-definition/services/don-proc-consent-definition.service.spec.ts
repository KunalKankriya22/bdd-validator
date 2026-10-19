import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { DonProcConsentDefinitionService } from './don-proc-consent-definition.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  DonProcConsentDefinitionModel,
  DonProcConsentDefinitionParamsDto,
  DonProcConsentDefinitionDto,
  UpdateDonProcConsentDefinitionDto,
  DonProcConsentDefinitionFilterLov
} from '../models/don-proc-consent-definition.model';

describe('DonProcConsentDefinitionService', () => {
  let service: DonProcConsentDefinitionService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockConsentData: DonProcConsentDefinitionModel[] = [
    {
      donationType: 'AL',
      procedureCode: 'DP',
      consentCode: 'DCONGEN',
      consentDescription: 'General Consent for Donation',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: new Date('2025-01-28')
    },
    {
      donationType: 'AL',
      procedureCode: 'WB',
      consentCode: 'DCONTST',
      consentDescription: 'Donor Consent',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: new Date('2025-01-14')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockConsentData,
    total: 2
  };

  const mockFilterLov: DonProcConsentDefinitionFilterLov = {
    donationType: ['AL', 'AU', 'DI'],
    procedureCode: ['DP', 'WB', 'PP', 'PL', 'HP'],
    consentCode: ['DCONGEN', 'DCONTST', 'DCONPP', 'DCONAUTO']
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DonProcConsentDefinitionService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DonProcConsentDefinitionService);
  });

  describe('getConsentDefinitions', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: DonProcConsentDefinitionParamsDto = {};

      service.getConsentDefinitions(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('getConsentDefinitionFilters', () => {
    it('should call apiService.get with correct endpoint when no chapterId', (done) => {
      mockApiService.get.and.returnValue(of({ item: mockFilterLov }));

      service.getConsentDefinitionFilters().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent-filters/),
          undefined
        );
        done();
      });
    });

    it('should call apiService.get with chapterId when provided', (done) => {
      mockApiService.get.and.returnValue(of({ item: mockFilterLov }));

      service.getConsentDefinitionFilters('TEST-CHAPTER').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent-filters/),
          jasmine.objectContaining({
            params: jasmine.any(Object)
          })
        );
        // Verify the HttpParams contains the correct chapterId
        const call = mockApiService.get.calls.mostRecent();
        const params = call.args[1]?.params;
        expect(params).toBeDefined();
        expect(params?.get('chapterId')).toBe('TEST-CHAPTER');
        done();
      });
    });

    it('should return filter LOV data', (done) => {
      mockApiService.get.and.returnValue(of({ item: mockFilterLov }));

      service.getConsentDefinitionFilters().subscribe(result => {
        expect(result.item).toEqual(mockFilterLov);
        done();
      });
    });

  });

  describe('getCreateData', () => {
    const mockCreateDataResponse = {
      item: {
        donationTypes: [
          { donationType: 'AL', description: 'Allogeneic' },
          { donationType: 'AU', description: 'Autologous' },
          { donationType: 'DI', description: 'Directed' }
        ],
        consentCodes: [
          { consentCode: 'DCONGEN', consentDescription: 'General Consent', versionNo: '1.0' },
          { consentCode: 'DCONTST', consentDescription: 'Test Consent', versionNo: '2.0' }
        ]
      }
    };


    it('should return create data with donation types and consent codes', (done) => {
      mockApiService.get.and.returnValue(of(mockCreateDataResponse));

      service.getCreateData().subscribe(result => {
        expect(result.item?.donationTypes).toBeDefined();
        expect(result.item?.consentCodes).toBeDefined();
        expect(result.item?.donationTypes?.length).toBe(3);
        expect(result.item?.consentCodes?.length).toBe(2);
        done();
      });
    });


    it('should call apiService.get with chapterId when provided', (done) => {
      mockApiService.get.and.returnValue(of(mockCreateDataResponse));

      service.getCreateData('CHAP1').subscribe(() => {
        const calls = mockApiService.get.calls.mostRecent();
        const options = calls.args[1];
        expect(options).toBeDefined();
        expect(options?.params).toBeInstanceOf(HttpParams);
        if (options?.params) {
          expect(options.params.get('chapterId')).toBe('CHAP1');
        }
        done();
      });
    });
  });

  describe('getProcedureCodesByDonationType', () => {
    const mockProcedureResponse = {
      data: [
        { procedureCode: 'DP' },
        { procedureCode: 'WB' },
        { procedureCode: 'PP' }
      ]
    };

    it('should call apiService.get with correct endpoint and donation type', (done) => {
      mockApiService.get.and.returnValue(of(mockProcedureResponse));

      service.getProcedureCodesByDonationType('AL').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent\/procedure-codes\/AL/),
          undefined
        );
        done();
      });
    });

    it('should return procedure codes for given donation type', (done) => {
      mockApiService.get.and.returnValue(of(mockProcedureResponse));

      service.getProcedureCodesByDonationType('AL').subscribe(result => {
        expect(result.data).toBeDefined();
        expect(result.data?.length).toBe(3);
        done();
      });
    });

    it('should encode special characters in donation type', (done) => {
      mockApiService.get.and.returnValue(of(mockProcedureResponse));

      service.getProcedureCodesByDonationType('A&L').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/A%26L/),
          undefined
        );
        done();
      });
    });


    it('should call apiService.get with chapterId when provided', (done) => {
      mockApiService.get.and.returnValue(of(mockProcedureResponse));

      service.getProcedureCodesByDonationType('AL', 'CHAP1').subscribe(() => {
        const calls = mockApiService.get.calls.mostRecent();
        const options = calls.args[1];
        expect(options).toBeDefined();
        expect(options?.params).toBeInstanceOf(HttpParams);
        if (options?.params) {
          expect(options.params.get('chapterId')).toBe('CHAP1');
        }
        done();
      });
    });
  });

  describe('addConsentDefinition', () => {
    const mockAddData: DonProcConsentDefinitionDto = {
      donationType: 'AL',
      procedureCode: 'DP',
      consentCode: 'DCONGEN',
      effectiveDate: '2025-01-11T00:00:00.000Z',
      terminationDate: '2025-12-31T23:59:59.999Z',
      chapterId: 'TEST-CHAPTER'
    };

    it('should call apiService.post with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Added successfully' }));

      service.addConsentDefinition(mockAddData).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent$/),
          mockAddData
        );
        done();
      });
    });




  });

  describe('updateConsentDefinition', () => {
    const mockUpdateData: UpdateDonProcConsentDefinitionDto = {
      currentDonationType: 'AL',
      currentProcedureCode: 'DP',
      currentConsentCode: 'DCONGEN',
      currentEffectiveDate: '2025-01-11T00:00:00.000Z',
      donationType: 'AL',
      procedureCode: 'DP',
      effectiveDate: '2025-01-11T00:00:00.000Z',
      terminationDate: '2025-12-31T23:59:59.999Z',
      chapterId: 'TEST-CHAPTER',
      consentCode: 'DCONGEN',
      consentDescription: 'Updated General Consent for Donation'
    };

    it('should call apiService.put with correct endpoint and data', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated successfully' }));

      service.updateConsentDefinition(mockUpdateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure-consent$/),
          mockUpdateData
        );
        done();
      });
    });




    it('should send data with current and new values', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateConsentDefinition(mockUpdateData).subscribe(() => {
        const calledData = mockApiService.put.calls.mostRecent().args[1];
        expect(calledData.currentDonationType).toBe('AL');
        expect(calledData.currentProcedureCode).toBe('DP');
        expect(calledData.consentCode).toBe('DCONGEN');
        done();
      });
    });

    it('should handle terminationDate with ISO timestamp', (done) => {
      const updateDataWithTermination: UpdateDonProcConsentDefinitionDto = {
        ...mockUpdateData,
        terminationDate: '2026-12-31T23:59:59.999Z'
      };
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateConsentDefinition(updateDataWithTermination).subscribe(() => {
        const calledData = mockApiService.put.calls.mostRecent().args[1];
        expect(calledData.terminationDate).toBe('2026-12-31T23:59:59.999Z');
        done();
      });
    });
  });

});
