import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ValidCollectionFacilitiesService } from './valid-collection-facilities.service';
import {
  ValidCollectionFacilityDto,
  ValidCollectionFacilityQueryDto,
  CreateValidCollectionFacilityRequestDto,
  UpdateValidCollectionFacilityRequestDto,
} from '../models/valid-collection-facilities.model';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';

describe('ValidCollectionFacilitiesService', () => {
  let service: ValidCollectionFacilitiesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.LABORATORY.VALID_COLLECTION_FACILITIES.BASE}`;

  const mockFacility: ValidCollectionFacilityDto = {
    chapterId: '1000',
    contractId: 'CONTRACT1',
    collId: 'FAC01',
    collName: 'Test Facility',
    collIdHead: 'John Doe',
    intFlag: 'N',
    collAddress1: '123 Main St',
    collAddress2: null,
    collAddress3: null,
    city: 'Test City',
    state: 'CA',
    stateCode: 'California',
    zip: '90001',
    country: null,
    intPhoneNumber: null,
    registrationNo: 'REG123',
    licenceNo: 'LIC456',
    licenceAddress1: '123 Main St',
    licenceAddress2: null,
    licenceAddress3: null,
    licenceCity: 'Test City',
    licenceState: 'CA',
    licenceZip: '90001',
    licenceCountry: 'USA',
    phoneNo: '555-1234',
    faxNo: '555-5678',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-05-29T10:00:00Z',
    contractType: 'ST',
    contractName: 'Standard Contract',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ValidCollectionFacilitiesService],
    });

    service = TestBed.inject(ValidCollectionFacilitiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('getValidCollectionFacilities', () => {
    it('should retrieve paginated list of facilities', () => {
      const take = 25;
      const skip = 0;
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockFacility],
        totalCount: 1,
      };

      service.getValidCollectionFacilities(take, skip).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
        expect(response.totalCount).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should send filters in request body', () => {
      const take = 10;
      const skip = 0;
      const filters: ValidCollectionFacilityQueryDto = {
        chapterId: '1000',
        contractId: 'CONTRACT1',
        searchKeyword: 'test',
      };

      service.getValidCollectionFacilities(take, skip, filters).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.body).toEqual(filters);
      req.flush({ success: true, data: [], totalCount: 0 });
    });
  });

  describe('getValidCollectionFacilityById', () => {
    it('should retrieve single facility by composite key', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT1';
      const collId = 'FAC01';
      const mockResponse = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: mockFacility,
      };

      service
        .getValidCollectionFacilityById(chapterId, contractId, collId)
        .subscribe((facility) => {
          expect(facility).toEqual(mockFacility);
        });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${contractId}/${collId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode URL parameters', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT 1'; // Contains space
      const collId = 'FAC/01'; // Contains slash

      service.getValidCollectionFacilityById(chapterId, contractId, collId).subscribe();

      const expectedUrl = `${baseUrl}/${chapterId}/${encodeURIComponent(contractId)}/${encodeURIComponent(collId)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockFacility });
    });
  });

  describe('createValidCollectionFacility', () => {
    it('should create new facility', () => {
      const createDto: CreateValidCollectionFacilityRequestDto = {
        chapterId: '1000',
        contractId: 'CONTRACT1',
        collId: 'FAC01',
        collName: 'New Facility',
        city: 'Test City',
        state: 'CA',
        registrationNo: 'REG123',
        licenceNo: 'LIC456',
        licenceCity: 'Test City',
        licenceState: 'CA',
        effDate: '2024-06-01',
      };

      const mockResponse = {
        success: true,
        message: 'Record created successfully',
        statusCode: 200,
        data: [{ chapterId: '1000', contractId: 'CONTRACT1', collId: 'FAC01' }],
      };

      service.createValidCollectionFacility(createDto).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('updateValidCollectionFacility', () => {
    it('should update existing facility', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT1';
      const collId = 'FAC01';
      const updateDto: UpdateValidCollectionFacilityRequestDto = {
        collName: 'Updated Facility',
        city: 'Updated City',
        state: 'NY',
        registrationNo: 'REG999',
        licenceNo: 'LIC999',
        licenceCity: 'Updated City',
        licenceState: 'NY',
        effDate: '2024-01-01',
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        statusCode: 200,
      };

      service
        .updateValidCollectionFacility(chapterId, contractId, collId, updateDto)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${contractId}/${collId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('deleteValidCollectionFacility', () => {
    it('should soft delete facility', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT1';
      const collId = 'FAC01';
      const mockResponse = {
        success: true,
        message: 'Record deleted successfully',
        statusCode: 200,
      };

      service
        .deleteValidCollectionFacility(chapterId, contractId, collId)
        .subscribe((response) => {
          expect(response).toEqual(mockResponse);
        });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${contractId}/${collId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('checkCollectionIdAssociations', () => {
    it('should check for associations and exclude current contract', () => {
      const chapterId = '1000';
      const collId = 'FAC01';
      const excludeContractId = 'CONTRACT1';

      const mockFacility2 = { ...mockFacility, contractId: 'CONTRACT2' };
      const mockResponse = {
        success: true,
        data: [mockFacility, mockFacility2],
        totalCount: 2,
      };

      service
        .checkCollectionIdAssociations(chapterId, collId, excludeContractId)
        .subscribe((facilities) => {
          expect(facilities.length).toBe(1);
          expect(facilities[0].contractId).toBe('CONTRACT2');
        });

      const req = httpMock.expectOne(`${baseUrl}/100/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ chapterId, collId });
      req.flush(mockResponse);
    });

    it('should return all facilities when no contract to exclude', () => {
      const chapterId = '1000';
      const collId = 'FAC01';

      const mockResponse = {
        success: true,
        data: [mockFacility],
        totalCount: 1,
      };

      service.checkCollectionIdAssociations(chapterId, collId).subscribe((facilities) => {
        expect(facilities.length).toBe(1);
        expect(facilities[0]).toEqual(mockFacility);
      });

      const req = httpMock.expectOne(`${baseUrl}/100/0`);
      req.flush(mockResponse);
    });
  });

  describe('getCollectionIdOptions', () => {
    it('should retrieve collection IDs for a contract', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT1';

      const mockResponse = {
        success: true,
        data: [mockFacility],
        totalCount: 1,
      };

      service.getCollectionIdOptions(chapterId, contractId).subscribe((facilities) => {
        expect(facilities.length).toBe(1);
        expect(facilities[0].collId).toBe('FAC01');
      });

      const req = httpMock.expectOne(`${baseUrl}/100/0`);
      expect(req.request.body).toEqual({ chapterId, contractId });
      req.flush(mockResponse);
    });
  });

  describe('getContractOptions', () => {
    it('should map contractTypeDesc from API response', () => {
      const mockApiResponse = [
        {
          contractId: 'C001',
          contractName: 'Company ABC',
          company: 'Company ABC',
          contractType: 'HP',
          codeDesc: 'Hospital Patient',
        },
      ];

      service.getContractOptions('1000').subscribe((contracts) => {
        expect(contracts.length).toBe(1);
        expect(contracts[0].contractId).toBe('C001');
        expect(contracts[0].contractType).toBe('HP');
        expect(contracts[0].contractTypeDesc).toBe('Hospital Patient');
        expect(contracts[0].contractName).toBe('Company ABC');
      });

      const contractsUrl = `${environment.apiUrl}${API.LABORATORY.VALID_COLLECTION_FACILITIES.CONTRACTS}`;
      const req = httpMock.expectOne(contractsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should fallback to empty string when contractTypeDesc is not available', () => {
      const mockApiResponse = [
        {
          contractId: 'C001',
          contractName: 'Company ABC',
          contractType: 'HP',
        },
      ];

      service.getContractOptions('1000').subscribe((contracts) => {
        expect(contracts[0].contractTypeDesc).toBe('');
      });

      const contractsUrl = `${environment.apiUrl}${API.LABORATORY.VALID_COLLECTION_FACILITIES.CONTRACTS}`;
      const req = httpMock.expectOne(contractsUrl);
      req.flush(mockApiResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error for non-existent facility', () => {
      const chapterId = '1000';
      const contractId = 'CONTRACT1';
      const collId = 'INVALID';

      service.getValidCollectionFacilityById(chapterId, contractId, collId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/${chapterId}/${contractId}/${collId}`);
      req.flush({ success: false, message: 'Record not found' }, { status: 404, statusText: 'Not Found' });
    });

  });
});
