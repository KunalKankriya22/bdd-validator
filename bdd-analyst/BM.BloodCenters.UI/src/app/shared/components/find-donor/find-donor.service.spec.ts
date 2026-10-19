import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FindDonorService } from './find-donor.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  FindDonorSearchCriteria,
  FindDonorResult,
  AlternateIdType,
  FindDonorConfig
} from './find-donor.model';

describe('FindDonorService', () => {
  let service: FindDonorService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const defaultConfig: FindDonorConfig = {
    confirmatoryField: 'N',
    firstNameVisible: true,
    donorIdEnabled: false,
    donorIdDoubleEntry: false,
    allowNew: 'N',
    allowSelect: 'N',
    allowHold: 'N',
    selectAllowedLevels: 5,
    newAllowedLevel: 1,
    selectAllowedMultilevel: 0,
    gradingLevel: 5,
    altIdMode: 'A',
    fields: {}
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        FindDonorService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(FindDonorService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAlternateIdTypes', () => {
    const mockTypes: AlternateIdType[] = [
      { code: 'SSN', description: 'Social Security Number' },
      { code: 'DL', description: 'Driver License' }
    ];

    it('should call ApiService.get with the correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes, total: 2 }));

      service.getAlternateIdTypes().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.FIND_DONOR.ALTERNATE_ID_TYPES);
        done();
      });
    });

    it('should return data from response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes, total: 2 }));

      service.getAlternateIdTypes().subscribe((types) => {
        expect(types).toEqual(mockTypes);
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('SSN');
        expect(types[1].description).toBe('Driver License');
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null, total: 0 }));

      service.getAlternateIdTypes().subscribe((types) => {
        expect(types).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getAlternateIdTypes().subscribe((types) => {
        expect(types).toEqual([]);
        done();
      });
    });

    it('should propagate errors from ApiService', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API error')));

      service.getAlternateIdTypes().subscribe({
        error: (error) => {
          expect(error.message).toBe('API error');
          done();
        }
      });
    });
  });

  describe('searchDonors', () => {
    const mockCriteria: FindDonorSearchCriteria = {
      lastName: 'Smith',
      firstName: 'John',
      dob: '1990-01-15'
    };

    const mockResults: FindDonorResult[] = [
      {
        donorId: 'DN00112233',
        lastName: 'Smith',
        firstName: 'John',
        dob: '1990-01-15',
        sex: 'M',
        aboRh: 'O+',
        alternateId: null,
        alternateIdType: null
      },
      {
        donorId: 'DN00445566',
        lastName: 'Smith',
        firstName: 'Johnny',
        dob: '1990-01-15',
        sex: 'M',
        aboRh: 'A-',
        alternateId: '123456789',
        alternateIdType: 'SSN'
      }
    ];

    it('should call ApiService.post with the correct endpoint and criteria', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockResults, total: 2 }));

      service.searchDonors(mockCriteria).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.FIND_DONOR.SEARCH, mockCriteria);
        done();
      });
    });

    it('should return data and total from response', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockResults, total: 2 }));

      service.searchDonors(mockCriteria).subscribe((result) => {
        expect(result.data).toEqual(mockResults);
        expect(result.total).toBe(2);
        expect(result.data.length).toBe(2);
        expect(result.data[0].donorId).toBe('DN00112233');
        done();
      });
    });

    it('should return empty array and zero total when data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: null, total: null }));

      service.searchDonors(mockCriteria).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.searchDonors(mockCriteria).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should return zero total when total is null but data exists', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockResults, total: null }));

      service.searchDonors(mockCriteria).subscribe((result) => {
        expect(result.data).toEqual(mockResults);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors from ApiService', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Search failed')));

      service.searchDonors(mockCriteria).subscribe({
        error: (error) => {
          expect(error.message).toBe('Search failed');
          done();
        }
      });
    });
  });

  describe('lookupDonorId', () => {
    const mockLookupResponse = {
      success: true,
      statusCode: 200,
      item: {
        lastName: 'Smith',
        firstName: 'John',
        dateOfBirth: '1990-01-15',
        gender: 'M'
      }
    };

    it('should call ApiService.get with the correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockLookupResponse));
      const donorId = 'DN00112233';

      service.lookupDonorId(donorId).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.FIND_DONOR.LOOKUP_DONOR_ID(donorId));
        done();
      });
    });

    it('should return the full response object', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockLookupResponse));

      service.lookupDonorId('DN00112233').subscribe((response) => {
        expect(response).toEqual(mockLookupResponse);
        expect(response.item?.lastName).toBe('Smith');
        expect(response.item?.firstName).toBe('John');
        expect(response.item?.dateOfBirth).toBe('1990-01-15');
        expect(response.item?.gender).toBe('M');
        done();
      });
    });

    it('should handle donor ID with special characters', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockLookupResponse));
      const donorId = 'DN/001 123';

      service.lookupDonorId(donorId).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.FIND_DONOR.LOOKUP_DONOR_ID(donorId));
        done();
      });
    });

    it('should return response when item is not present', (done) => {
      const noItemResponse = { success: true, statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(noItemResponse));

      service.lookupDonorId('DN99999999').subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.item).toBeUndefined();
        done();
      });
    });

    it('should propagate errors from ApiService', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Donor not found')));

      service.lookupDonorId('DN00000000').subscribe({
        error: (error) => {
          expect(error.message).toBe('Donor not found');
          done();
        }
      });
    });
  });

  describe('getConfig', () => {
    const mockConfig: FindDonorConfig = {
      confirmatoryField: 'S',
      firstNameVisible: false,
      donorIdEnabled: true,
      donorIdDoubleEntry: true,
      allowNew: 'N',
      allowSelect: 'Y',
      allowHold: 'Y',
      selectAllowedLevels: 1,
      newAllowedLevel: 3,
      selectAllowedMultilevel: 0,
      gradingLevel: 3,
      altIdMode: 'R'
    };

    it('should call ApiService.get with config endpoint when no programName', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: mockConfig }));

      service.getConfig().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.FIND_DONOR.CONFIG);
        done();
      });
    });

    it('should call ApiService.get with programName query param', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: mockConfig }));
      const programName = 'BLOOD_DRIVE';

      service.getConfig(programName).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.FIND_DONOR.CONFIG}?programName=${encodeURIComponent(programName)}`
        );
        done();
      });
    });

    it('should encode programName with special characters', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: mockConfig }));
      const programName = 'DRIVE & COLLECT';

      service.getConfig(programName).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          `${API.FIND_DONOR.CONFIG}?programName=${encodeURIComponent(programName)}`
        );
        done();
      });
    });

    it('should return config from response item', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: mockConfig }));

      service.getConfig('BLOOD_DRIVE').subscribe((config) => {
        expect(config).toEqual(mockConfig);
        expect(config.confirmatoryField).toBe('S');
        expect(config.firstNameVisible).toBeFalse();
        expect(config.donorIdEnabled).toBeTrue();
        expect(config.donorIdDoubleEntry).toBeTrue();
        expect(config.allowNew).toBe('N');
        expect(config.allowSelect).toBe('Y');
        expect(config.allowHold).toBe('Y');
        expect(config.altIdMode).toBe('R');
        done();
      });
    });

    it('should return default config when item is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: null }));

      service.getConfig().subscribe((config) => {
        expect(config).toEqual(defaultConfig);
        done();
      });
    });

    it('should return default config when item is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200 }));

      service.getConfig().subscribe((config) => {
        expect(config).toEqual(defaultConfig);
        expect(config.confirmatoryField).toBe('N');
        expect(config.firstNameVisible).toBeTrue();
        expect(config.donorIdEnabled).toBeFalse();
        expect(config.donorIdDoubleEntry).toBeFalse();
        expect(config.allowNew).toBe('N');
        expect(config.allowSelect).toBe('N');
        expect(config.allowHold).toBe('N');
        expect(config.altIdMode).toBe('A');
        done();
      });
    });

    it('should return default config when item is null with programName', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: null }));

      service.getConfig('UNKNOWN_PROGRAM').subscribe((config) => {
        expect(config).toEqual(defaultConfig);
        done();
      });
    });

    it('should not append query param when programName is empty string', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, item: mockConfig }));

      service.getConfig('').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.FIND_DONOR.CONFIG);
        done();
      });
    });

    it('should propagate errors from ApiService', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Config error')));

      service.getConfig().subscribe({
        error: (error) => {
          expect(error.message).toBe('Config error');
          done();
        }
      });
    });
  });
});
