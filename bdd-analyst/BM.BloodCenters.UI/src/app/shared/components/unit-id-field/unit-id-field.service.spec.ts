import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UnitIdFieldService } from './unit-id-field.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

describe('UnitIdFieldService', () => {
  let service: UnitIdFieldService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        UnitIdFieldService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(UnitIdFieldService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnitId', () => {
    it('should POST unitId and validateFfValue with SKIP_ERROR_TOAST context', (done) => {
      const mockResponse = { valid: true, message: 'OK' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateUnitId('U001', 'Y').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
          { unitId: 'U001', validateFfValue: 'Y' },
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });
});
