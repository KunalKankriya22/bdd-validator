import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlaceReleaseInterdictionApiService } from './place-release-interdiction-api.service';
import { API } from '@core/constants/api.constants';

describe('PlaceReleaseInterdictionApiService', () => {
  let service: PlaceReleaseInterdictionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlaceReleaseInterdictionApiService],
    });

    service = TestBed.inject(PlaceReleaseInterdictionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── simple GET methods that map response.data ────────────────────────
  [
    { method: 'getActions' as const, url: API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.GET_ACTIONS, mockData: ['PLACE', 'RELEASE'] },
    { method: 'getInterdictionCodes' as const, url: API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.GET_INTERDICTION_CODES, mockData: [{ interCode: 'IC1', description: 'Code 1' }] },
  ].forEach(({ method, url, mockData }) => {
    describe(method, () => {
      it('should GET and return response.data', (done) => {
        // Act
        service[method]().subscribe((result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          done();
        });

        // Arrange
        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('GET');
        req.flush({ data: mockData });
      });
    });
  });

  describe('validateUnit', () => {
    it('should POST unitId and return response.data', (done) => {
      // Arrange
      const mockData = { unitId: 'U1', isValid: true };

      // Act
      service.validateUnit('U1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.VALIDATE_UNIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'U1' });
      req.flush({ data: mockData });
    });
  });

  describe('validateInterdictionCode', () => {
    it('should POST interCode and return response.data', (done) => {
      // Arrange
      const mockData = { interCode: 'IC1', description: 'Code 1' };

      // Act
      service.validateInterdictionCode('IC1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.VALIDATE_INTERDICTION_CODE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ interCode: 'IC1' });
      req.flush({ data: mockData });
    });
  });

  // ── place/release interdictions (same shape, different action) ───────
  [
    { method: 'placeInterdictions' as const, action: 'PLACE', url: API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.PLACE },
    { method: 'releaseInterdictions' as const, action: 'RELEASE', url: API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.RELEASE },
  ].forEach(({ method, action, url }) => {
    describe(method, () => {
      it(`should POST with action=${action} and return response.data`, (done) => {
        // Arrange
        const codes = ['IC1'];
        const units = [{ unitId: 'U1' }] as any[];
        const mockData = { successCount: 1, failureCount: 0 };

        // Act
        service[method](codes, units).subscribe((result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          done();
        });

        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('POST');
        expect(req.request.body.action).toBe(action);
        expect(req.request.body.interCodes).toEqual(codes);
        expect(req.request.body.units).toEqual(units);
        req.flush({ data: mockData });
      });
    });
  });

  describe('getUnitsForRelease', () => {
    it('should POST interCodes array and return response.data', (done) => {
      // Arrange
      const codes = ['IC1', 'IC2'];
      const mockData = [{ unitId: 'U1' }];

      // Act
      service.getUnitsForRelease(codes).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockData as any);
        done();
      });

      const req = httpMock.expectOne(API.PLACE_RELEASE_MULTIPLE_UNIT_INTERDICTION.UNITS_FOR_RELEASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(codes);
      req.flush({ data: mockData });
    });
  });
});
