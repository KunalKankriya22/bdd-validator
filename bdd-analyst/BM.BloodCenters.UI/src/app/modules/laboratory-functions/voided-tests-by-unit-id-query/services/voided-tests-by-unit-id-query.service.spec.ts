import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VoidedTestsByUnitIdQueryService } from './voided-tests-by-unit-id-query.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('VoidedTestsByUnitIdQueryService', () => {
  let service: VoidedTestsByUnitIdQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        VoidedTestsByUnitIdQueryService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(VoidedTestsByUnitIdQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('verifyUnit', () => {
    it('should post unit id for verification', (done) => {
      const mockResponse = { success: true, item: { unitId: 'U001', isValid: true } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.verifyUnit('U001').subscribe(result => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.TEST_VOID_BY_UNIT_ID.VERIFY_UNIT,
          { unitId: 'U001' }
        );
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getVoidedTests', () => {
    it('should return data and total from response', (done) => {
      const mockResponse = {
        data: [{ unitId: 'U001', testCode: 'T01' }],
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const params = { unitId: 'U001' } as any;
      service.getVoidedTests(10, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        done();
      });
    });
  });

  describe('getVoidedUnitsLov', () => {
    it('should return voided units list', (done) => {
      const mockResponse = {
        data: [{ unitId: 'U001', description: 'Unit 1' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getVoidedUnitsLov().subscribe(result => {
        expect(result.length).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.TEST_VOID_BY_UNIT_ID.VOIDED_UNITS
        );
        done();
      });
    });
  });
});
