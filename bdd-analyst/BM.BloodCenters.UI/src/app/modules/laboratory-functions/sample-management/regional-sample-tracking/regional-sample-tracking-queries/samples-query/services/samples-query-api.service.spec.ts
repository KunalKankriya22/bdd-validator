import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SamplesQueryApiService } from './samples-query-api.service';
import { API } from '@core/constants/api.constants';

describe('SamplesQueryApiService', () => {
  let service: SamplesQueryApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SamplesQueryApiService,
      ],
    });

    service = TestBed.inject(SamplesQueryApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('search', () => {
    it('should POST to search endpoint with pagination', () => {
      const request = { unitId: 'W12345' };
      service.search(request, 10, 0).subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.SEARCH(10, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should use default pagination values', () => {
      const request = { batchId: 'BATCH1' };
      service.search(request).subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.SEARCH(10, 0));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should pass custom pagination values', () => {
      const request = { unitId: 'W12345' };
      service.search(request, 25, 50).subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.SEARCH(25, 50));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [], total: 0 });
    });
  });

  describe('getUnitDetails', () => {
    it('should GET unit details', () => {
      service.getUnitDetails('W12345').subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.UNIT_DETAILS('W12345'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { unit: {}, testResults: [], attributes: [], interdictions: [] } });
    });
  });

  describe('validateUnit', () => {
    it('should GET validate endpoint with isScanned param', () => {
      service.validateUnit('W12345', true).subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.VALIDATE_UNIT('W12345', true));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: true });
    });

    it('should default isScanned to false', () => {
      service.validateUnit('W12345').subscribe();

      const req = httpMock.expectOne(API.SAMPLES_QUERY.VALIDATE_UNIT('W12345', false));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: true });
    });
  });
});
