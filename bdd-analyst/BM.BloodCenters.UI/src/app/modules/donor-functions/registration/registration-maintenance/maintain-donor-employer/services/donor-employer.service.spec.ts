import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DonorEmployerService } from './donor-employer.service';
import { ApiService } from '../../../../../../shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';

describe('DonorEmployerService', () => {
  let service: DonorEmployerService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DonorEmployerService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(DonorEmployerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('search', () => {
    it('should call the correct API endpoint and return mapped data', (done) => {
      mockApiService.post.and.returnValue(of({
        data: [{ employerId: 'E001', employerName: 'Test Corp' }],
        total: 1,
      }));

      const request = { employerName: 'Test' } as any;
      service.search(10, 0, request).subscribe((result) => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.SEARCH(10, 0), request
        );
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        done();
      });
    });

    it('should handle null data in response', (done) => {
      mockApiService.post.and.returnValue(of({ data: null, total: null }));

      service.search(10, 0, {} as any).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => new Error('Search failed')));

      service.search(10, 0, {} as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Search failed');
          done();
        },
      });
    });
  });

  describe('getById', () => {
    it('should call the correct API endpoint and return employer from item field', (done) => {
      mockApiService.get.and.returnValue(of({
        item: { employerId: 'E001', employerName: 'Test Corp' },
        data: null,
      }));

      service.getById('E001').subscribe((result) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.GET_BY_ID('E001')
        );
        expect(result.employerId).toBe('E001');
        done();
      });
    });

    it('should fall back to data field when item is not present', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { employerId: 'E002', employerName: 'Alt Corp' },
      }));

      service.getById('E002').subscribe((result) => {
        expect(result.employerId).toBe('E002');
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getById('E001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should post to the correct API endpoint and return response', (done) => {
      const response = { data: { employerId: 'E003', employerName: 'New Corp' } };
      mockApiService.post.and.returnValue(of(response));

      const request = { employerName: 'New Corp' } as any;
      service.create(request).subscribe((result) => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.CREATE, request
        );
        expect(result.data.employerId).toBe('E003');
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => new Error('Create failed')));

      service.create({} as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Create failed');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should put to the correct API endpoint and return response', (done) => {
      const response = { data: { employerId: 'E001', employerName: 'Updated' } };
      mockApiService.put.and.returnValue(of(response));

      const request = { employerId: 'E001', employerName: 'Updated' } as any;
      service.update(request).subscribe((result) => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.UPDATE, request
        );
        expect(result.data.employerName).toBe('Updated');
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.put.and.returnValue(throwError(() => new Error('Update failed')));

      service.update({} as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });
  });

  describe('getAutocomplete', () => {
    it('should post correct request body and return mapped autocomplete options', (done) => {
      mockApiService.post.and.returnValue(of({
        data: [
          { employerId: 'E001', employerName: 'Corp A' },
          { employerId: 'E002', employerName: 'Corp B' },
        ],
      }));

      service.getAutocomplete('name', 'Corp').subscribe((result) => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.AUTOCOMPLETE,
          { SearchType: 'name', SearchName: 'Corp' }
        );
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ employerId: 'E001', employerName: 'Corp A' });
        expect(result[1]).toEqual({ employerId: 'E002', employerName: 'Corp B' });
        done();
      });
    });

    it('should handle null data', (done) => {
      mockApiService.post.and.returnValue(of({ data: null }));

      service.getAutocomplete('name', 'Corp').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => new Error('Autocomplete failed')));

      service.getAutocomplete('name', 'Corp').subscribe({
        error: (err) => {
          expect(err.message).toBe('Autocomplete failed');
          done();
        },
      });
    });
  });

  describe('getStates', () => {
    it('should return states', (done) => {
      mockApiService.get.and.returnValue(of([{ code: 'CA', description: 'California' }]));

      service.getStates().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('CA');
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('States failed')));

      service.getStates().subscribe({
        error: (err) => {
          expect(err.message).toBe('States failed');
          done();
        },
      });
    });
  });

  describe('getCountries', () => {
    it('should return countries', (done) => {
      mockApiService.get.and.returnValue(of([{ code: 'US', description: 'United States' }]));

      service.getCountries().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('US');
        done();
      });
    });

    it('should propagate errors', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Countries failed')));

      service.getCountries().subscribe({
        error: (err) => {
          expect(err.message).toBe('Countries failed');
          done();
        },
      });
    });
  });

  describe('getCityStateByZip', () => {
    it('should return city/state data for valid zip', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { city: 'San Francisco', state: 'CA' },
      }));

      service.getCityStateByZip('94102').subscribe((result) => {
        expect(result).toEqual({ city: 'San Francisco', state: 'CA' });
        done();
      });
    });

    it('should return null when data is null', (done) => {
      mockApiService.get.and.returnValue(of({ data: null }));

      service.getCityStateByZip('00000').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Zip lookup failed')));

      service.getCityStateByZip('99999').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('searchCities', () => {
    it('should return cities from array data', (done) => {
      mockApiService.get.and.returnValue(of({
        data: [{ code: 'SF', description: 'San Francisco' }],
      }));

      service.searchCities().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('SF');
        done();
      });
    });

    it('should handle $values format', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { $values: [{ code: 'LA', description: 'Los Angeles' }] },
      }));

      service.searchCities().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('LA');
        done();
      });
    });

    it('should return empty array for null data', (done) => {
      mockApiService.get.and.returnValue(of({ data: null }));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Cities failed')));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getZipsByCity', () => {
    it('should call the correct API endpoint and return zips from array data', (done) => {
      mockApiService.get.and.returnValue(of({
        data: [{ code: '94102', description: '94102' }],
      }));

      service.getZipsByCity('San Francisco').subscribe((result) => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.DONOR_EMPLOYER.LOOKUPS.ZIPS('San Francisco')
        );
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: '94102', description: '94102' });
        done();
      });
    });

    it('should handle $values format', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { $values: [{ code: '90001', description: '90001' }] },
      }));

      service.getZipsByCity('Los Angeles').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: '90001', description: '90001' });
        done();
      });
    });

    it('should return empty array for null data', (done) => {
      mockApiService.get.and.returnValue(of({ data: null }));

      service.getZipsByCity('Nowhere').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Zips failed')));

      service.getZipsByCity('Unknown').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('extractLookupItems (via searchCities)', () => {
    it('should handle non-object data', (done) => {
      mockApiService.get.and.returnValue(of({ data: 'invalid' }));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle object without $values or array', (done) => {
      mockApiService.get.and.returnValue(of({ data: { someKey: 'value' } }));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle items with missing code/description', (done) => {
      mockApiService.get.and.returnValue(of({
        data: [{ code: null, description: undefined }, {}],
      }));

      service.searchCities().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: '', description: '' });
        done();
      });
    });

    it('should handle $values items with missing code/description', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { $values: [{ code: null }, { description: 'Only desc' }, {}] },
      }));

      service.searchCities().subscribe((result) => {
        expect(result.length).toBe(3);
        expect(result[0]).toEqual({ code: '', description: '' });
        expect(result[1]).toEqual({ code: '', description: 'Only desc' });
        expect(result[2]).toEqual({ code: '', description: '' });
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      mockApiService.get.and.returnValue(of({ data: undefined }));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when $values is not an array', (done) => {
      mockApiService.get.and.returnValue(of({
        data: { $values: 'not-an-array' },
      }));

      service.searchCities().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
