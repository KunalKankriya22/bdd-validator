import { TestBed } from '@angular/core/testing';
import { MaintainDriveLocationService } from './maintain-drive-location.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DriveLocationSearchParams } from '../models/maintain-drive-location.model';

describe('MaintainDriveLocationService', () => {
  let service: MaintainDriveLocationService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        MaintainDriveLocationService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(MaintainDriveLocationService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('searchDriveLocations', () => {
    const mockParams: DriveLocationSearchParams = {
      searchKeyword: 'test',
      chapterId: 'CH1',
      showTerminated: false,
      sortField: 'locationName',
      sortDirection: 'ASC'
    };

    it('should search drive locations and map data and totalRecords', (done) => {
      const mockResponse = {
        data: [
          { locationId: 'LOC1', locationName: 'Location One', chapterId: 'CH1', effDate: '2026-01-01' },
          { locationId: 'LOC2', locationName: 'Location Two', chapterId: 'CH1', effDate: '2026-02-01' }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDriveLocations(10, 0, mockParams).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        expect(result.data[0].locationId).toBe('LOC1');
        expect(apiService.post).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.SEARCH(10, 0),
          mockParams
        );
        done();
      });
    });

    it('should default to empty array and zero total when response fields are missing', (done) => {
      const mockResponse = {} as any;

      apiService.post.and.returnValue(of(mockResponse));

      service.searchDriveLocations(10, 0, mockParams).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.searchDriveLocations(10, 0, mockParams).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getDriveLocationDetails', () => {
    it('should get drive location details and map response item', (done) => {
      const mockResponse = {
        item: {
          locationId: 'LOC1',
          locationName: 'Test Location',
          address: { city: 'Dallas', state: 'TX' }
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveLocationDetails('LOC1', 'CH1').subscribe(result => {
        expect(result.locationId).toBe('LOC1');
        expect(result.locationName).toBe('Test Location');
        expect(result.address.city).toBe('Dallas');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.GET_DETAILS('LOC1', 'CH1')
        );
        done();
      });
    });

    it('should return full response when item is not present', (done) => {
      const mockResponse = { locationId: 'LOC1', locationName: 'Test Location' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveLocationDetails('LOC1', 'CH1').subscribe(result => {
        expect(result.locationId).toBe('LOC1');
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 404, message: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getDriveLocationDetails('LOC1', 'CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getLocationNotes', () => {
    it('should get location notes and map response item', (done) => {
      const mockNotes = [
        { noteId: 'N1', noteSequence: 1, note: 'Note one', auditKey: 1 },
        { noteId: 'N2', noteSequence: 2, note: 'Note two', auditKey: 2 }
      ];
      const mockResponse = { item: mockNotes };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationNotes('LOC1', 'CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].noteId).toBe('N1');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.GET_NOTES('LOC1', 'CH1')
        );
        done();
      });
    });

    it('should return empty array when item is not present', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getLocationNotes('LOC1', 'CH1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getLocationNotes('LOC1', 'CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('upsertDriveLocation', () => {
    it('should upsert drive location and return response', (done) => {
      const mockPayload = {
        locationId: 'LOC1',
        locationName: 'Updated Location',
        chapterId: 'CH1'
      };
      const mockResponse = { message: 'Drive location saved successfully' };

      apiService.post.and.returnValue(of(mockResponse));

      service.upsertDriveLocation(mockPayload).subscribe(result => {
        expect(result.message).toBe('Drive location saved successfully');
        expect(apiService.post).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.UPSERT,
          mockPayload
        );
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 400, message: 'Validation Error' };

      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.upsertDriveLocation({}).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getLocationTypeLookup', () => {
    it('should get location type lookup with search parameter', (done) => {
      const mockResponse = { item: [{ code: 'FIXED', description: 'Fixed Site' }] };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationTypeLookup('CH1', 'fixed').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('FIXED');
        expect(apiService.get).toHaveBeenCalled();

        const callArgs = apiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.LOCATION_TYPE);
        const params: HttpParams = callArgs[1].params;
        expect(params.get('chapterId')).toBe('CH1');
        expect(params.get('search')).toBe('fixed');
        done();
      });
    });

    it('should get location type lookup without search parameter', (done) => {
      const mockResponse = {
        item: [
          { code: 'FIXED', description: 'Fixed Site' },
          { code: 'MOBILE', description: 'Mobile Site' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationTypeLookup('CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(apiService.get).toHaveBeenCalled();

        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.get('chapterId')).toBe('CH1');
        expect(params.get('search')).toBeNull();
        done();
      });
    });

    it('should fall back to data when item is not present', (done) => {
      const mockResponse = { data: [{ code: 'FIXED', description: 'Fixed Site' }] };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationTypeLookup('CH1').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('FIXED');
        done();
      });
    });
  });

  describe('getLocationLookup', () => {
    it('should get location lookup with params', (done) => {
      const mockResponse = {
        item: [
          { locationId: 'LOC1', locationName: 'Location One' },
          { locationId: 'LOC2', locationName: 'Location Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationLookup('CH1', 'FIXED', 'loc').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].locationId).toBe('LOC1');
        expect(apiService.get).toHaveBeenCalled();

        const callArgs = apiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.LOCATION('CH1', 'FIXED')
        );
        const params: HttpParams = callArgs[1].params;
        expect(params.get('search')).toBe('loc');
        done();
      });
    });

    it('should default search to empty string', (done) => {
      const mockResponse = { data: [{ locationId: 'LOC1', locationName: 'Location One' }] };

      apiService.get.and.returnValue(of(mockResponse));

      service.getLocationLookup('CH1', 'FIXED').subscribe(result => {
        expect(result.length).toBe(1);

        const callArgs = apiService.get.calls.mostRecent().args;
        const params: HttpParams = callArgs[1].params;
        expect(params.get('search')).toBe('');
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getLocationLookup('CH1', 'FIXED').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getSponsorLookup', () => {
    it('should get sponsor lookup', (done) => {
      const mockResponse = {
        item: [
          { sponsorId: 'SP1', sponsorName: 'Sponsor One' },
          { sponsorId: 'SP2', sponsorName: 'Sponsor Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSponsorLookup('CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].sponsorId).toBe('SP1');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.SPONSOR('CH1')
        );
        done();
      });
    });

    it('should return data fallback when item is absent', (done) => {
      const mockResponse = { data: [{ sponsorId: 'SP2', sponsorName: 'Sponsor Two' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getSponsorLookup('CH1').subscribe(result => {
        expect(result).toEqual(mockResponse.data);
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getSponsorLookup('CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getHospitalLookup', () => {
    it('should get hospital lookup', (done) => {
      const mockResponse = {
        item: [
          { hospitalId: 'H1', hospitalName: 'Hospital One' },
          { hospitalId: 'H2', hospitalName: 'Hospital Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getHospitalLookup('CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].hospitalId).toBe('H1');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.HOSPITAL('CH1')
        );
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getHospitalLookup('CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getStaffLookup', () => {
    it('should get staff lookup', (done) => {
      const mockResponse = {
        item: [
          { staffId: 'S1', staffName: 'Staff One' },
          { staffId: 'S2', staffName: 'Staff Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getStaffLookup('CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].staffId).toBe('S1');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.STAFF('CH1')
        );
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getStaffLookup('CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getFacilityLookup', () => {
    it('should get facility lookup with chapterId param', (done) => {
      const mockResponse = {
        item: [
          { facilityId: 'F1', facilityName: 'Facility One' },
          { facilityId: 'F2', facilityName: 'Facility Two' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getFacilityLookup('CH1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].facilityId).toBe('F1');
        expect(apiService.get).toHaveBeenCalled();

        const callArgs = apiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.FACILITY);
        const params: HttpParams = callArgs[1].params;
        expect(params.get('chapterId')).toBe('CH1');
        done();
      });
    });

    it('should return data fallback when item is absent', (done) => {
      const mockResponse = { data: [{ facilityId: 'F2', facilityName: 'Facility Two' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getFacilityLookup('CH1').subscribe(result => {
        expect(result).toEqual(mockResponse.data);
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getFacilityLookup('CH1').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getCityStateByZipCode', () => {
    it('should get city and state by zip code', (done) => {
      const mockResponse = {
        item: { city: 'Dallas', state: 'TX', county: 'Dallas', mapsco: '45A' }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCityStateByZipCode('75201').subscribe(result => {
        expect(result.city).toBe('Dallas');
        expect(result.state).toBe('TX');
        expect(result.county).toBe('Dallas');
        expect(apiService.get).toHaveBeenCalledWith(
          API.RECRUITMENT.MAINTAIN_DRIVE_LOCATION.LOOKUPS.CITY_STATE_BY_ZIP('75201')
        );
        done();
      });
    });

    it('should return data fallback when item is absent', (done) => {
      const mockResponse = { data: { city: 'Austin', state: 'TX' } };
      apiService.get.and.returnValue(of(mockResponse));

      service.getCityStateByZipCode('78701').subscribe(result => {
        expect(result).toEqual(mockResponse.data);
        done();
      });
    });

    it('should fall back to full response when item and data are not present', (done) => {
      const mockResponse = { city: 'Dallas', state: 'TX' };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCityStateByZipCode('75201').subscribe(result => {
        expect(result.city).toBe('Dallas');
        expect(result.state).toBe('TX');
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 404, message: 'Not Found' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getCityStateByZipCode('00000').subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getCountries', () => {
    it('should get countries from data field', (done) => {
      const mockResponse = {
        data: [
          { code: 'US', description: 'United States' },
          { code: 'CA', description: 'Canada' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCountries().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('US');
        expect(result[1].description).toBe('Canada');
        expect(apiService.get).toHaveBeenCalledWith(
          API.INTERNATIONAL_ADDRESS.COUNTRIES
        );
        done();
      });
    });

    it('should fall back to Data field when data is not present', (done) => {
      const mockResponse = {
        Data: [
          { code: 'US', description: 'United States' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getCountries().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('US');
        done();
      });
    });

    it('should return empty array when no data fields are present', (done) => {
      apiService.get.and.returnValue(of({}));

      service.getCountries().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { status: 500, message: 'Server Error' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getCountries().subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
