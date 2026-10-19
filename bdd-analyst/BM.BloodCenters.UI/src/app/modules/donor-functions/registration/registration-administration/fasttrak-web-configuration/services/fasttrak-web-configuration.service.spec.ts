import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import moment from 'moment';
import { FastTrakWebConfigurationService } from './fasttrak-web-configuration.service';
import {
  SaveDonorResponseConfigRequest,
  RetrieveValidHHResourceConfigRequest,
  AddValidHHResourceRequest,
  UpdateValidHHResourceRequest
} from '../models/fasttrak-web-configuration.model';

describe('FastTrakWebConfigurationService', () => {
  let service: FastTrakWebConfigurationService;
  let apiService: jasmine.SpyObj<ApiService>;

  const today = moment().format('YYYY-MM-DD');

  const mockDonorResponseApiData = {
    applId: 'LIFETRAK',
    donorResponseFlag: 'Y' as const,
    multiLangaugeFlag: 'N' as const,
    effectiveDate: today,
    terminationDate: null as string | null,
    auditKey: 42
  };

  const mockResourceConfig = {
    q: [{ code: 'Q001', description: 'Question Code 1' }],
    o: [{ code: 'O001', description: 'Other Code 1' }]
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        FastTrakWebConfigurationService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(FastTrakWebConfigurationService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDonorResponseConfiguration', () => {
    it('should transform API response to DonorResponseConfiguration', (done) => {
      apiService.get.and.returnValue(of({
        success: true,
        message: 'ok',
        statusCode: 200,
        data: [mockDonorResponseApiData],
        total: 1
      }));

      service.getDonorResponseConfiguration().subscribe({
        next: (result) => {
          expect(result).toBeTruthy();
          expect(result!.onlineResponsesFlag).toBeTrue();
          expect(result!.multiLanguageFlag).toBeFalse();
          expect(result!.auditKey).toBe(42);
          expect(moment.isMoment(result!.effectiveDate)).toBeTrue();
          done();
        }
      });
    });


    it('should propagate HTTP errors', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDonorResponseConfiguration().subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  describe('saveDonorResponseConfiguration', () => {
    it('should call POST with correct request payload', (done) => {
      const request: SaveDonorResponseConfigRequest = {
        donorResponseFlag: 'Y',
        multiLangaugeFlag: 'N',
        effectiveDate: today,
        terminationDate: null
      };
      const mockResponse = { success: true, message: 'Saved', statusCode: 200, data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.saveDonorResponseConfiguration(request).subscribe({
        next: (result) => {
          expect(apiService.post).toHaveBeenCalledWith(
            jasmine.stringContaining('donor-response-configuration'),
            request
          );
          expect(result.success).toBeTrue();
          done();
        }
      });
    });
  });

  describe('getResourceConfiguration', () => {
    it('should call GET and return resource configuration', (done) => {
      apiService.get.and.returnValue(of(mockResourceConfig));

      service.getResourceConfiguration().subscribe({
        next: (result) => {
          expect(result.q.length).toBe(1);
          expect(result.o.length).toBe(1);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('retrieveResources', () => {
    it('should call POST with retrieve request', (done) => {
      const request: RetrieveValidHHResourceConfigRequest = { codeType: 'Q', code: 'Q001' };
      const mockResponse = {
        success: true, message: 'ok', statusCode: 200,
        data: [{ code: 'Q001', locationLink: 'http://example.com', description: 'Test', effectiveDate: today, terminationDate: null }],
        total: 1
      };
      apiService.post.and.returnValue(of(mockResponse));

      service.retrieveResources(request).subscribe({
        next: (result) => {
          expect(result.data!.length).toBe(1);
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('addResource', () => {
    it('should call POST with add resource request', (done) => {
      const request: AddValidHHResourceRequest = {
        codeType: 'Q',
        code: 'Q001',
        locationLink: 'http://example.com',
        description: 'New Resource',
        effectiveDate: today,
        terminationDate: null
      };
      const mockResponse = { success: true, message: 'Created', statusCode: 201, data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.addResource(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiService.post).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('updateResource', () => {
    it('should call PUT with update resource request', (done) => {
      const request: UpdateValidHHResourceRequest = {
        currentCode: 'Q001',
        currentLocationLink: 'http://old.com',
        currentEffectiveDate: today,
        locationLink: 'http://new.com',
        description: 'Updated',
        effectiveDate: today,
        terminationDate: null
      };
      const mockResponse = { success: true, message: 'Updated', statusCode: 200, data: [], total: 0 };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateResource(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiService.put).toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
