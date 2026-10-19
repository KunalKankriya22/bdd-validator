import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UnitQueryService } from './unit-query.service';
import { API } from '@core/constants/api.constants';

describe('UnitQueryService', () => {
  let service: UnitQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitQueryService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UnitQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getByUnitId', () => {
    it('should return a unit when data exists', () => {
      const mockUnit = { unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1' };

      service.getByUnitId('U001').subscribe((result) => {
        expect(result).toBeTruthy();
        expect(result!.unitId).toBe('U001');
      });

      const req = httpMock.expectOne(API.UNIT_QUERY.GET_BY_UNIT_ID('U001'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockUnit], total: 1, success: true, message: '', statusCode: 200 });
    });


    it('should pass collDate as query param when provided', () => {
      service.getByUnitId('U001', '2025-01-01').subscribe();

      const req = httpMock.expectOne((r) => r.url === API.UNIT_QUERY.GET_BY_UNIT_ID('U001'));
      expect(req.request.params.get('collDate')).toBe('2025-01-01');
      req.flush({ data: [], total: 0, success: true, message: '', statusCode: 200 });
    });
  });

  describe('getByOsUnitId', () => {
    it('should return an array of units', () => {
      const mockUnits = [
        { unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1' },
        { unitId: 'U002', collDate: '2025-01-02', chapterId: 'CH1' },
      ];

      service.getByOsUnitId('OS001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].unitId).toBe('U001');
      });

      const req = httpMock.expectOne(API.UNIT_QUERY.GET_BY_OS_UNIT_ID('OS001'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockUnits, total: 2, success: true, message: '', statusCode: 200 });
    });

    it('should pass receivedDate as query param when provided', () => {
      service.getByOsUnitId('OS001', '2025-01-01').subscribe();

      const req = httpMock.expectOne((r) => r.url === API.UNIT_QUERY.GET_BY_OS_UNIT_ID('OS001'));
      expect(req.request.params.get('receivedDate')).toBe('2025-01-01');
      req.flush({ data: [], total: 0, success: true, message: '', statusCode: 200 });
    });
  });

  describe('getComponents', () => {
    it('should return component results', () => {
      const mockComps = [{ unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', productCode: 'PC1' }];

      service.getComponents('U001', '2025-01-01').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].productCode).toBe('PC1');
      });

      const req = httpMock.expectOne((r) => r.url === API.UNIT_QUERY.GET_COMPONENTS('U001'));
      expect(req.request.params.get('collDate')).toBe('2025-01-01');
      req.flush({ data: mockComps, total: 1, success: true, message: '', statusCode: 200 });
    });
  });

  describe('getAddOnBags', () => {
    it('should return add-on bags data', () => {
      service.getAddOnBags('U001', '2025-01-01').subscribe((result) => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url.includes('add-on-bags'));
      req.flush({ data: [{ sdcWsNumber: '123' }], total: 1, success: true, message: '', statusCode: 200 });
    });
  });
  describe('getPathogenReduction', () => {
    it('should return pathogen reduction data', () => {
      service.getPathogenReduction('U001', '2025-01-01').subscribe((result) => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne((r) => r.url.includes('pathogen-reduction'));
      req.flush({ data: [{ initialProdCode: 'P1' }], total: 1, success: true, message: '', statusCode: 200 });
    });
  });
});
