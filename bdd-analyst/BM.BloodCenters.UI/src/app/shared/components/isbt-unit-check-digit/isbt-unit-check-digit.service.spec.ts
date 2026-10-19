import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ISBTUnitCheckDigitService } from './isbt-unit-check-digit.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ISBTUnitCheckDigitService', () => {
  let service: ISBTUnitCheckDigitService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        ISBTUnitCheckDigitService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ISBTUnitCheckDigitService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('calculateCheckDigit', () => {
    it('should POST request to CALCULATE endpoint', (done) => {
      const request = { unitId: 'U001' } as any;
      const mockResponse = { checkDigit: '7' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.calculateCheckDigit(request).subscribe((result: any) => {
        expect(result).toEqual(mockResponse);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.ISBT_CHECK_DIGIT.CALCULATE,
          request
        );
        done();
      });
    });
  });
});
