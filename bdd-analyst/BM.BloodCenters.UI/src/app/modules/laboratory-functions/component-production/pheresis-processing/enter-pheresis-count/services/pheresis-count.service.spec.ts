import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PheresisCountService } from './pheresis-count.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PheresisCountComponentDto,
  UpdateComponentCountRequestDto,
  ReturnResult,
} from '../models/pheresis-count.model';

describe('PheresisCountService', () => {
  let service: PheresisCountService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockApiResponse = {
    success: true,
    data: [
      {
        unitId: 'U001',
        collDate: '2026-06-01T00:00:00',
        productCode: '12710',
        componentPrefix: '1',
        componentCount: 100,
        componentLabeled: 'N',
        productDescription: 'Platelets Pheresis LeukoReduced by Filtration',
      },
      {
        unitId: 'U002',
        collDate: '2026-06-01T00:00:00',
        productCode: '12010',
        componentPrefix: '1',
        componentCount: null,
        componentLabeled: 'N',
        productDescription: 'Platelets Pheresis',
      },
    ] as PheresisCountComponentDto[],
    total: 2,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PheresisCountService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(PheresisCountService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getComponentsByCollectionDate', () => {
    it('should fetch components for a given collection date', (done) => {
      const take = 25;
      const skip = 0;
      const collectionDate = '2026-06-01';
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getComponentsByCollectionDate(take, skip, collectionDate).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockApiResponse.data);
          expect(result.total).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.PHERESIS_COUNT.COMPONENTS_BY_DATE(take, skip, collectionDate, 'DESC', '')
          );
          done();
        },
      });
    });

    it('should pass sort order and search keyword', (done) => {
      const take = 25;
      const skip = 0;
      const collectionDate = '2026-06-01';
      apiServiceSpy.get.and.returnValue(of(mockApiResponse));

      service.getComponentsByCollectionDate(take, skip, collectionDate, 'ASC', 'U001').subscribe({
        next: (result) => {
          expect(result.data.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.PHERESIS_COUNT.COMPONENTS_BY_DATE(take, skip, collectionDate, 'ASC', 'U001')
          );
          done();
        },
      });
    });


  });

  describe('updateComponentCount', () => {
    const request: UpdateComponentCountRequestDto = {
      unitId: 'U001',
      collDate: '2026-06-01T00:00:00',
      productCode: '12710',
      componentCount: 150,
    };

    it('should update component count successfully', (done) => {
      const response: ReturnResult<boolean> = {
        success: true,
        data: true,
        message: 'Component count updated successfully',
      };

      apiServiceSpy.put.and.returnValue(of(response));

      service.updateComponentCount(request).subscribe({
        next: (result) => {
          expect(result).toEqual(response);
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.PHERESIS_COUNT.UPDATE_COMPONENT_COUNT,
            request
          );
          done();
        },
      });
    });

    it('should handle validation error response', (done) => {
      const response: ReturnResult<boolean> = {
        success: false,
        message: 'Component count exceeds 3 digits',
        errorCode: '1707',
      };

      apiServiceSpy.put.and.returnValue(of(response));

      service.updateComponentCount(request).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.errorCode).toBe('1707');
          done();
        },
      });
    });

  });

  describe('updateComponentCounts (batch)', () => {
    const requests: UpdateComponentCountRequestDto[] = [
      {
        unitId: 'U001',
        collDate: '2026-06-01T00:00:00',
        productCode: '12710',
        componentCount: 150,
      },
      {
        unitId: 'U002',
        collDate: '2026-06-01T00:00:00',
        productCode: '12010',
        componentCount: 50,
      },
    ];

    it('should batch update component counts', (done) => {
      const response: ReturnResult<boolean> = {
        success: true,
        data: true,
        message: 'All changes has been saved',
      };

      apiServiceSpy.put.and.returnValue(of(response));

      service.updateComponentCounts(requests).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.PHERESIS_COUNT.UPDATE_COMPONENT_COUNTS,
            requests
          );
          done();
        },
      });
    });

    it('should handle batch update error', (done) => {
      const error = { error: { message: 'Batch update failed' } };
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      service.updateComponentCounts(requests).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('validateCount', () => {
    it('should validate count successfully', (done) => {
      const response: ReturnResult<boolean> = {
        success: true,
        data: true,
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.validateCount('12710', 'U001', 100).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.PHERESIS_COUNT.VALIDATE_COUNT('12710', 'U001', 100)
          );
          done();
        },
      });
    });

    it('should return CMCO warning when count is below minimum', (done) => {
      const response: ReturnResult<boolean> = {
        success: false,
        errorCode: '9789',
        message: 'Cell count below minimum',
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.validateCount('12710', 'U001', 5).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.errorCode).toBe('9789');
          done();
        },
      });
    });

    it('should handle validate error response', (done) => {
      const error = { error: { message: 'Validation failed' } };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.validateCount('12710', 'U001', 100).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });
});
