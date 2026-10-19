import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UnitCollectionDateService } from './unit-collection-date.service';
import { ApiService } from '@shared/services/api.service';

describe('UnitCollectionDateService', () => {
  let service: UnitCollectionDateService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        UnitCollectionDateService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(UnitCollectionDateService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should post validation request and map response item', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = {
        item: {
          isValid: true,
          unit: {
            unitId: 'U001',
            chapterId: 'CH01',
            collectionDate: '2025-01-01',
            insertDate: '2025-01-01',
            contractId: 'CON01'
          },
          hasSystemLabelDecision: false,
          componentCount: 2,
          unitExists: true,
          validationErrors: []
        },
        message: 'Valid'
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnit(request).subscribe(result => {
        expect(result.isValid).toBeTrue();
        expect(result.unitId).toBe('U001');
        expect(result.chapterId).toBe('CH01');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/collection-date/validate-unit',
          request
        );
        done();
      });
    });
  });

  describe('changeCollectionDate', () => {
    it('should post change request', (done) => {
      const request = { unitId: 'U001', newCollectionDate: '2025-06-01' } as any;
      const mockResponse = { success: true, message: 'Date changed' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.changeCollectionDate(request).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/collection-date/change',
          request
        );
        done();
      });
    });
  });
});
