import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PhysicianApiService } from './physician-api.service';
import { environment } from 'src/environments/environment';
import { API } from 'src/app/core/constants/api.constants';
import {
  PhysicianDto,
  PhysicianSearchRequest,
  PhysicianSearchResponse,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  PhysicianCreateUpdateResponse,
  PhysicianDeleteResponse
} from '../models/physician-api.model';

describe('PhysicianApiService', () => {
  let service: PhysicianApiService;
  let httpMock: HttpTestingController;

  const mockPhysicianDto: PhysicianDto = {
    phyId: 'PHY001',
    chapterId: 'CH01',
    lastName: 'Smith',
    firstName: 'John',
    mi: 'A',
    streetName: '123 Main St',
    uspsId: 12345,
    specialtyCode: 'CARD',
    specialtyDesc: 'Cardiology',
    areaCode: '617',
    phoneNo: '555-1234',
    zipCode: '02101',
    city: 'Boston',
    state: 'MA',
    effDate: '2024-01-15T00:00:00Z',
    termDate: null,
    comments: 'Primary cardiologist',
    intlAddrFlag: null,
    programId: 'SDIPHYSC',
    insertUser: 'admin',
    insertDate: '2024-01-15T10:30:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhysicianApiService]
    });
    service = TestBed.inject(PhysicianApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchPhysicians', () => {
    it('should send POST request with correct URL and body', () => {
      // Arrange
      const searchRequest: PhysicianSearchRequest = {
        searchKeyword: 'Smith',
        activeOnly: true
      };

      const mockResponse: PhysicianSearchResponse = {
        success: true,
        message: 'Physicians retrieved successfully',
        data: [mockPhysicianDto],
        totalCount: 1,
        statusCode: 200
      };

      const expectedUrl = `${environment.apiUrl}${API.PHYSICIAN.SEARCH}`;

      // Act
      service.searchPhysicians(searchRequest).subscribe(response => {
        // Assert
        expect(response.success).toBeTrue();
        expect(response.data.length).toBe(1);
        expect(response.totalCount).toBe(1);
        expect(response.data[0].phyId).toBe('PHY001');
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchRequest);
      req.flush(mockResponse);
    });

    it('should handle empty search request', () => {
      // Arrange
      const mockResponse: PhysicianSearchResponse = {
        success: true,
        message: 'Physicians retrieved successfully',
        data: [],
        totalCount: 0,
        statusCode: 200
      };

      // Act
      service.searchPhysicians({}).subscribe(response => {
        // Assert
        expect(response.data.length).toBe(0);
        expect(response.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/physicians/search')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle search correctly', () => {
      // Arrange
      const searchRequest: PhysicianSearchRequest = {
        searchKeyword: 'SMITH'
      };

      const mockResponse: PhysicianSearchResponse = {
        success: true,
        message: 'Physicians retrieved successfully',
        data: [mockPhysicianDto],
        totalCount: 100,
        statusCode: 200
      };

      // Act
      service.searchPhysicians(searchRequest).subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes('/physicians/search')
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('createPhysician', () => {
    it('should create physician with correct request body', () => {
      // Arrange
      const createRequest: CreatePhysicianRequest = {
        lastName: 'Johnson',
        firstName: 'Emily',
        mi: 'R',
        specialtyCode: 'NEUR',
        streetName: '456 Oak Avenue',
        uspsId: 54321,
        areaCode: '617',
        phoneNo: '555-5678',
        effDate: '2026-05-13T00:00:00Z',
        termDate: null,
        comments: 'Neurologist - specializes in stroke care'
      };

      const mockResponse: PhysicianCreateUpdateResponse = {
        success: true,
        message: 'Physician created successfully',
        item: { ...mockPhysicianDto, phyId: 'PHY002' },
        statusCode: 201
      };

      const expectedUrl = `${environment.apiUrl}${API.PHYSICIAN.CREATE}`;

      // Act
      service.createPhysician(createRequest).subscribe(physician => {
        // Assert
        expect(physician.phyId).toBe('PHY002');
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });

  });

  describe('updatePhysician', () => {
    it('should update physician with correct URL and body', () => {
      // Arrange
      const phyId = 'PHY001';
      const chapterId = 'CH01';

      const updateRequest: UpdatePhysicianRequest = {
        lastName: 'Smith',
        firstName: 'John',
        mi: 'A',
        specialtyCode: 'CARD',
        streetName: '789 New Street',
        uspsId: 67890,
        areaCode: '617',
        phoneNo: '555-9999',
        effDate: '2024-01-15T00:00:00Z',
        termDate: '2026-12-31T00:00:00Z',
        comments: 'Updated contact information'
      };

      const mockResponse: PhysicianCreateUpdateResponse = {
        success: true,
        message: 'Physician updated successfully',
        item: { ...mockPhysicianDto, streetName: '789 New Street' },
        statusCode: 200
      };

      const expectedUrl = `${environment.apiUrl}${API.PHYSICIAN.UPDATE(phyId, chapterId)}`;

      // Act
      service.updatePhysician(phyId, chapterId, updateRequest).subscribe(physician => {
        // Assert
        expect(physician.streetName).toBe('789 New Street');
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });
  });

  describe('deletePhysician', () => {
    it('should delete physician and return success', () => {
      // Arrange
      const phyId = 'PHY001';
      const chapterId = 'CH01';

      const mockResponse: PhysicianDeleteResponse = {
        success: true,
        message: 'Physician deleted successfully',
        statusCode: 200
      };

      const expectedUrl = `${environment.apiUrl}${API.PHYSICIAN.DELETE(phyId, chapterId)}`;

      // Act
      service.deletePhysician(phyId, chapterId).subscribe(success => {
        // Assert
        expect(success).toBeTrue();
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should return false on delete failure', () => {
      // Arrange
      const phyId = 'PHY001';
      const chapterId = 'CH01';

      const mockResponse: PhysicianDeleteResponse = {
        success: false,
        message: 'Physician not found',
        statusCode: 404
      };

      // Act
      service.deletePhysician(phyId, chapterId).subscribe(success => {
        // Assert
        expect(success).toBeFalse();
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/physicians/PHY001/CH01') && request.method === 'DELETE'
      );
      req.flush(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP errors from search', () => {
      // Arrange
      const searchRequest: PhysicianSearchRequest = {};

      // Act
      service.searchPhysicians(searchRequest).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/physicians/search')
      );
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

  });
});
