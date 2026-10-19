import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AboLabelOverrideQueryService } from './abo-label-override-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('AboLabelOverrideQueryService', () => {
  let service: AboLabelOverrideQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AboLabelOverrideQueryService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AboLabelOverrideQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should GET unit validation with SKIP_ERROR_TOAST context', (done) => {
      const mockResponse = { data: [{ valid: true }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.validateUnit('UNIT-001').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ABO_LABEL_OVERRIDE_QUERY.VALIDATE_UNIT('UNIT-001'),
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });

  describe('getOverrideRecords', () => {
    it('should GET override records for a unit with SKIP_ERROR_TOAST context', (done) => {
      const mockResponse = { data: [{ overrideType: 'ABO' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getOverrideRecords('UNIT-001').subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.ABO_LABEL_OVERRIDE_QUERY.GET_BY_UNIT('UNIT-001'),
          jasmine.objectContaining({ context: jasmine.anything() })
        );
        done();
      });
    });
  });
});
