import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LookupService } from './lookup.service';
import { ApiService } from '@shared/services/api.service';

describe('LookupService', () => {
  let service: LookupService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        LookupService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(LookupService);
  });

  describe('getDriveTypes', () => {
    it('should return drive type options', (done) => {
      const mockData = [{ value: 'FIXED', label: 'Fixed' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getDriveTypes().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donor-recruitment/lookups/drive-types');
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getDriveCategories', () => {
    it('should return drive category options', (done) => {
      const mockData = [{ value: 'CAT1', label: 'Category 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getDriveCategories().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donor-recruitment/lookups/drive-categories');
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getRecruiters', () => {
    it('should pass chapterId and return recruiter options', (done) => {
      const mockData = [{ id: 'R1', name: 'Recruiter 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getRecruiters('CH01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/donor-recruitment/lookups/recruiters',
          jasmine.any(Object)
        );
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getLocations', () => {
    it('should pass chapterId and return location options', (done) => {
      const mockData = [{ id: 'LOC1', name: 'Location 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getLocations('CH01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/donor-recruitment/lookups/locations',
          jasmine.any(Object)
        );
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getTerritories', () => {
    it('should pass chapterId and return territory options', (done) => {
      const mockData = [{ id: 'T1', name: 'Territory 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getTerritories('CH01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/donor-recruitment/lookups/territories',
          jasmine.any(Object)
        );
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getFacilities', () => {
    it('should return facility options', (done) => {
      const mockData = [{ value: 'F1', label: 'Facility 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getFacilities().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donor-recruitment/lookups/facilities');
        expect(result).toEqual(mockData);
        done();
      });
    });
  });

  describe('getEfficiencyRange', () => {
    it('should return efficiency range number', (done) => {
      apiServiceSpy.get.and.returnValue(of({ efficiencyRange: 2.5 }));

      service.getEfficiencyRange().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donor-recruitment/lookups/efficiency-range');
        expect(result).toBe(2.5);
        done();
      });
    });
  });

  describe('getSponsors', () => {
    it('should pass chapterId and return sponsor options', (done) => {
      const mockData = [{ id: 'S1', name: 'Sponsor 1' }];
      apiServiceSpy.get.and.returnValue(of(mockData));

      service.getSponsors('CH01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/donor-recruitment/lookups/sponsors',
          jasmine.any(Object)
        );
        expect(result).toEqual(mockData);
        done();
      });
    });
  });
});
