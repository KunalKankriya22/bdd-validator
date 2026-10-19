import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NewZipCodeService } from './new-zip-code.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('NewZipCodeService', () => {
  let service: NewZipCodeService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        NewZipCodeService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(NewZipCodeService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getStates', () => {
    it('should return state list from response data', (done) => {
      const mockResponse = {
        data: [{ code: 'TX', description: 'Texas' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getStates().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('TX');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.NEW_ZIP_CODE.STATES);
        done();
      });
    });
  });

  describe('getCities', () => {
    it('should return mapped cities for a state', (done) => {
      const mockResponse = {
        data: [{ code: 'Dallas' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCities('TX').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('Dallas');
        expect(result[0].description).toBe('Dallas');
        done();
      });
    });
  });

  describe('getCounties', () => {
    it('should return mapped counties for a state', (done) => {
      const mockResponse = {
        data: [{ code: 'Dallas County' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCounties('TX').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('Dallas County');
        expect(result[0].description).toBe('Dallas County');
        done();
      });
    });
  });

  describe('createZipCode', () => {
    it('should post new zip code and return data', (done) => {
      const payload = { zipCode: '75001', state: 'TX', city: 'Dallas', county: 'Dallas' } as any;
      const mockRecord = { uspsId: 1, zipCode: '75001' };
      apiServiceSpy.post.and.returnValue(of({ data: mockRecord }));

      service.createZipCode(payload).subscribe(result => {
        expect(result).toEqual(mockRecord as any);
        done();
      });
    });
  });

  describe('updateZipCode', () => {
    it('should put updated zip code and return data', (done) => {
      const payload = { zipCode: '75001', state: 'TX' } as any;
      const mockRecord = { uspsId: 1, zipCode: '75001' };
      apiServiceSpy.put.and.returnValue(of({ data: mockRecord }));

      service.updateZipCode(1, payload).subscribe(result => {
        expect(result).toEqual(mockRecord as any);
        done();
      });
    });
  });
});
