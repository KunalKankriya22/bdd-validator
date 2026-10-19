import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeletePooledComponentsService } from './delete-pooled-components.service';
import { ApiService } from '@shared/services/api.service';
import {
  PoolDetails,
  PooledComponentUnit,
  ApiResponse
} from '../models/delete-pooled-components.model';

describe('DeletePooledComponentsService', () => {
  let service: DeletePooledComponentsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPoolDetails: PoolDetails = {
    poolId: 'P123456789012',
    productCode: 'RBC001',
    productDescription: 'Red Blood Cells',
    unitCount: 5
  };

  const mockPooledUnits: PooledComponentUnit[] = [
    {
      unitId: 'U123456789012',
      productCode: 'RBC001',
      productDescription: 'Red Blood Cells',
      collDate: '2026-05-10',
      expiryDate: '2026-06-10',
      componentStatus: 'L'
    },
    {
      unitId: 'U987654321098',
      productCode: 'RBC001',
      productDescription: 'Red Blood Cells',
      collDate: '2026-05-11',
      expiryDate: '2026-06-11',
      componentStatus: 'L'
    }
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DeletePooledComponentsService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(DeletePooledComponentsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getPoolDetails', () => {
    it('should fetch pool details successfully', (done) => {
      const unitId = 'P123456789012';
      const mockResponse: ApiResponse<PoolDetails> = {
        success: true,
        data: mockPoolDetails,
        errorCode: undefined,
        errorResponse: undefined,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPoolDetails(unitId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockPoolDetails);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should handle error when fetching pool details', (done) => {
      const unitId = 'P123456789012';
      const errorResponse = { message: 'Pool not found' };

      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getPoolDetails(unitId).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getPooledUnits', () => {
    it('should fetch pooled units successfully', (done) => {
      const unitId = 'P123456789012';
      const mockResponse: ApiResponse<PooledComponentUnit[]> = {
        success: true,
        data: mockPooledUnits,
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPooledUnits(unitId).subscribe({
        next: (units: PooledComponentUnit[]) => {
          expect(units.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should handle error when fetching pooled units', (done) => {
      const unitId = 'P123456789012';
      const errorResponse = { message: 'Error fetching units' };

      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getPooledUnits(unitId).subscribe({
        next: () => fail('should not succeed'),
        error: (err: { message: string }) => {
          expect(err).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should handle empty result set', (done) => {
      const unitId = 'P123456789012';
      const emptyResponse: ApiResponse<PooledComponentUnit[]> = {
        success: true,
        data: [],
        message: 'Success',
        statusCode: 200
      };

      apiServiceSpy.get.and.returnValue(of(emptyResponse));

      service.getPooledUnits(unitId).subscribe({
        next: (units: PooledComponentUnit[]) => {
          expect(units.length).toBe(0);
          done();
        }
      });
    });
  });

  describe('deletePool', () => {
    it('should delete pool successfully', (done) => {
      const poolId = 'P123456789012';
      const mockResponse: ApiResponse<unknown> = {
        success: true,
        message: 'Pool deleted successfully',
        statusCode: 200
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deletePool(poolId).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.message).toBe('Pool deleted successfully');
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
        error: () => fail('should not fail')
      });
    });

    it('should handle error when deleting pool', (done) => {
      const poolId = 'P123456789012';
      const errorResponse = { message: 'Unit has in-transit interdiction' };

      apiServiceSpy.delete.and.returnValue(throwError(() => errorResponse));

      service.deletePool(poolId).subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
