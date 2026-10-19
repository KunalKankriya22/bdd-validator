import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { AlternateDemographicsService } from './alternate-demographics.service';
import { ApiService } from './api.service';
import { ValidMasterCodesService } from './valid-master-codes.service';
import { API } from '../../core/constants/api.constants';
import {
  AlternateDemographicsModel,
  CityStateResult,
  ValidateAlternateDemographicsRequest
} from '../models/alternate-demographics.model';
import { CountryModel } from '../models/international-address.model';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  data?: T[];
  item?: T;
  statusCode?: number;
}

describe('AlternateDemographicsService', () => {
  let service: AlternateDemographicsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let validMasterCodesServiceSpy: jasmine.SpyObj<ValidMasterCodesService>;

  const mockAlternateData: AlternateDemographicsModel = {
    addressType: 'L',
    streetName: '123 Main St',
    suiteApt: 'Apt 4B',
    city: 'Boston',
    state: 'MA',
    zip: '02101',
    uspsId: 12345,
    intlAddress1: null,
    intlAddress2: null,
    intlAddress3: null,
    intlAddress4: null,
    countryName: null,
    intlCity: null,
    intlPostalCode: null,
    intlAddrFlag: 'N',
    mobilePhoneNumber: '6175551234',
    otherContactNumber: null,
    altIntlPhoneNumber: null,
    preferredContactPhone: 'M',
    preferredContactAddress: 'H'
  };

  const mockCityStateResults: CityStateResult[] = [
    { city: 'Boston', state: 'MA', zip: '02101', uspsId: 12345 },
    { city: 'Cambridge', state: 'MA', zip: '02139', uspsId: 12346 }
  ];

  const mockCountries: CountryModel[] = [
    { code: 'US', description: 'United States' },
    { code: 'CA', description: 'Canada' }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    validMasterCodesServiceSpy = jasmine.createSpyObj('ValidMasterCodesService', ['getCountries']);

    TestBed.configureTestingModule({
      providers: [
        AlternateDemographicsService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ValidMasterCodesService, useValue: validMasterCodesServiceSpy }
      ]
    });

    service = TestBed.inject(AlternateDemographicsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getByDonorId', () => {
    it('should fetch alternate demographics by donor ID successfully', (done) => {
      const response: ReturnResult<AlternateDemographicsModel> = {
        success: true,
        message: 'Success',
        item: mockAlternateData
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getByDonorId('DON12345').subscribe({
        next: (data) => {
          expect(data).toEqual(mockAlternateData);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.ALTERNATE_DEMOGRAPHICS.GET('DON12345')
          );
          done();
        }
      });
    });

    it('should return null when item is missing', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: 'No data' }));

      service.getByDonorId('MISSING').subscribe({
        next: (data) => {
          expect(data).toBeNull();
          done();
        }
      });
    });

    it('should propagate error from getByDonorId', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getByDonorId('DON123').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('should update alternate demographics successfully', (done) => {
      const response: ReturnResult<boolean> = {
        success: true,
        message: 'Updated successfully'
      };
      apiServiceSpy.put.and.returnValue(of(response));

      service.update('DON12345', mockAlternateData).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Updated successfully');
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            API.ALTERNATE_DEMOGRAPHICS.UPDATE('DON12345'),
            mockAlternateData
          );
          done();
        }
      });
    });

    it('should propagate error from update', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Server error')));

      service.update('DON123', mockAlternateData).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  describe('getCityStateByZip', () => {
    it('should fetch city/state by zip successfully', (done) => {
      const response: ReturnResult<CityStateResult> = {
        success: true,
        message: 'Success',
        data: mockCityStateResults
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCityStateByZip('02101').subscribe({
        next: (results) => {
          expect(results.length).toBe(2);
          expect(results[0].city).toBe('Boston');
          expect(results[1].city).toBe('Cambridge');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.ALTERNATE_DEMOGRAPHICS.CITY_STATE,
            { params: new HttpParams().set('zip', '02101') }
          );
          done();
        }
      });
    });

    it('should return empty array when no results found', (done) => {
      const response: ReturnResult<CityStateResult> = {
        success: true,
        message: 'No results',
        data: undefined
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCityStateByZip('99999').subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        }
      });
    });

    it('should propagate error from getCityStateByZip', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getCityStateByZip('02101').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  describe('getCountries', () => {
    it('should fetch countries from ValidMasterCodesService', (done) => {
      validMasterCodesServiceSpy.getCountries.and.returnValue(of(mockCountries));

      service.getCountries().subscribe({
        next: (countries) => {
          expect(countries.length).toBe(2);
          expect(countries[0].code).toBe('US');
          expect(countries[1].code).toBe('CA');
          expect(validMasterCodesServiceSpy.getCountries).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should propagate error from getCountries', (done) => {
      validMasterCodesServiceSpy.getCountries.and.returnValue(throwError(() => new Error('Countries fetch failed')));

      service.getCountries().subscribe({
        error: (err) => {
          expect(err.message).toBe('Countries fetch failed');
          done();
        }
      });
    });
  });

  describe('validate', () => {
    it('should validate alternate demographics successfully', (done) => {
      const validateRequest: ValidateAlternateDemographicsRequest = {
        addressType: 'L',
        streetName: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02101'
      };
      const response: ReturnResult<boolean> = {
        success: true,
        message: 'Validation passed'
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.validate(validateRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Validation passed');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.ALTERNATE_DEMOGRAPHICS.VALIDATE,
            validateRequest
          );
          done();
        }
      });
    });

    it('should return failure result from validation', (done) => {
      const validateRequest: ValidateAlternateDemographicsRequest = {
        addressType: 'L',
        streetName: '',
        city: '',
        state: '',
        zip: ''
      };
      const response: ReturnResult<boolean> = {
        success: false,
        message: 'Validation failed: missing required fields'
      };
      apiServiceSpy.post.and.returnValue(of(response));

      service.validate(validateRequest).subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          expect(result.message).toBe('Validation failed: missing required fields');
          done();
        }
      });
    });

    it('should propagate error from validate', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Validation error')));

      service.validate({ addressType: 'L' } as ValidateAlternateDemographicsRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Validation error');
          done();
        }
      });
    });
  });

  describe('getZipsByCity', () => {
    it('should return mapped zip options from flat array', (done) => {
      const response = {
        success: true,
        message: 'Success',
        data: [
          { value: '02101', label: '02101 - MA' },
          { value: '02102', label: '02102 - MA' }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('BOSTON').subscribe({
        next: (results) => {
          expect(results.length).toBe(2);
          expect(results[0]).toEqual({ code: '02101', description: '02101 - MA' });
          done();
        }
      });
    });

    it('should handle nested array response', (done) => {
      const response = {
        success: true,
        message: 'Success',
        data: [[{ Value: '60601', Label: '60601 - IL' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('CHICAGO').subscribe({
        next: (results) => {
          expect(results.length).toBe(1);
          expect(results[0]).toEqual({ code: '60601', description: '60601 - IL' });
          done();
        }
      });
    });

    it('should handle code/description keys', (done) => {
      const response = {
        success: true,
        message: 'Success',
        data: [{ code: '90001', description: '90001 - CA' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('LOS ANGELES').subscribe({
        next: (results) => {
          expect(results[0]).toEqual({ code: '90001', description: '90001 - CA' });
          done();
        }
      });
    });

    it('should return empty array when data is not an array', (done) => {
      const response = { success: true, message: 'Success', data: null };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('NOWHERE').subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getZipsByCity('BOSTON').subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        }
      });
    });
  });

  describe('validateAreaCode', () => {
    it('should return true for valid area code', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: 'Valid' }));

      service.validateAreaCode('617').subscribe({
        next: (valid) => {
          expect(valid).toBeTrue();
          done();
        }
      });
    });

    it('should return false for invalid area code', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: false, message: 'Not found' }));

      service.validateAreaCode('000').subscribe({
        next: (valid) => {
          expect(valid).toBeFalse();
          done();
        }
      });
    });

    it('should return false on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.validateAreaCode('617').subscribe({
        next: (valid) => {
          expect(valid).toBeFalse();
          done();
        }
      });
    });
  });
});
