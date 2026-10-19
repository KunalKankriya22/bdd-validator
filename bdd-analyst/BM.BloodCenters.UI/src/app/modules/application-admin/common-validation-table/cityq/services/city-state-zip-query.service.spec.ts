import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CityStateZipQueryService } from './city-state-zip-query.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

describe('CityStateZipQueryService', () => {
  let service: CityStateZipQueryService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CityStateZipQueryService]
    });
    service = TestBed.inject(CityStateZipQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('query', () => {
    it('should make POST request to query endpoint with correct parameters', () => {
      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [],
        total: 0
      };

      const filters = {
        city: 'Dallas',
        state: 'TX'
      };

      service.query(10, 0, filters).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_QUERY(10, 0)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        city: 'Dallas',
        state: 'TX',
        zip: undefined,
        county: undefined,
        commonlyUsedFlag: undefined,
        searchKeyword: undefined,
        sortColumn: undefined,
        sortOrder: undefined
      });
      req.flush(mockResponse);
    });
  });

  describe('getById', () => {
    it('should make GET request to retrieve record by ID', () => {
      const mockRecord = {
        uspsId: 1,
        city: 'Dallas',
        state: 'TX',
        zip: '75235',
        county: 'Dallas',
        commonlyUsedFlag: 'Y',
        effDate: '2024-01-01',
        programId: 'TEST',
        insertDate: '2024-01-01',
        insertUser: 'SYSTEM'
      };

      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: mockRecord
      };

      service.getById(1).subscribe(record => {
        expect(record).toEqual(mockRecord);
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_GET_BY_ID(1)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should make POST request to create new record', () => {
      const createDto = {
        state: 'TX',
        city: 'Dallas',
        zip: '75235',
        county: 'Dallas',
        commonlyUsedFlag: 'Y',
        effDate: '2024-01-01'
      };

      const mockResponse = {
        success: true,
        message: 'Record created successfully',
        statusCode: 201,
        data: { ...createDto, uspsId: 1 }
      };

      service.create(createDto).subscribe(record => {
        expect(record.uspsId).toBe(1);
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_CREATE}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should make PUT request to update existing record', () => {
      const updateDto = {
        state: 'TX',
        city: 'Dallas Updated',
        zip: '75235',
        county: 'Dallas',
        commonlyUsedFlag: 'Y',
        effDate: '2024-01-01'
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        statusCode: 200,
        data: { ...updateDto, uspsId: 1 }
      };

      service.update(1, updateDto).subscribe(record => {
        expect(record.city).toBe('Dallas Updated');
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_UPDATE(1)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('getStates', () => {
    it('should make GET request to retrieve states list', () => {
      const mockStates = [
        { code: 'TX', description: 'Texas' },
        { code: 'CA', description: 'California' }
      ];

      const mockResponse = {
        success: true,
        message: 'Successfully fetched states',
        statusCode: 200,
        data: mockStates
      };

      service.getStates().subscribe(states => {
        expect(states.length).toBe(2);
        expect(states[0].code).toBe('TX');
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_STATES}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCities', () => {
    it('should make GET request to retrieve cities for a state', () => {
      const mockCities = [
        { code: 'Dallas', description: null },
        { code: 'Houston', description: null }
      ];

      const mockResponse = {
        success: true,
        message: 'Successfully fetched cities',
        statusCode: 200,
        data: mockCities
      };

      service.getCities('TX').subscribe(cities => {
        expect(cities.length).toBe(2);
        expect(cities[0].code).toBe('Dallas');
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_CITIES('TX')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when state is not provided', () => {
      expect(() => service.getCities('')).toThrowError('State is required to fetch cities');
    });
  });

  describe('getCounties', () => {
    it('should make GET request to retrieve counties for a state and city', () => {
      const mockCounties = [
        { code: 'Dallas', description: null },
        { code: 'Harris', description: null }
      ];

      const mockResponse = {
        success: true,
        message: 'Successfully fetched counties',
        statusCode: 200,
        data: mockCounties
      };

      service.getCounties('TX', 'Dallas').subscribe(counties => {
        expect(counties.length).toBe(2);
        expect(counties[0].code).toBe('Dallas');
      });

      const url = `${environment.apiUrl}${API.APPLICATION_ADMIN.VALID_CITY_STATE_COUNTIES('TX', 'Dallas')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when state is not provided', () => {
      expect(() => service.getCounties('', '')).toThrowError('State is required to fetch counties');
    });
  });
});
