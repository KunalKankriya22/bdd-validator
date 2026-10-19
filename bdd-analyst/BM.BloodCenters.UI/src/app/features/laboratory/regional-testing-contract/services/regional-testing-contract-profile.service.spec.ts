import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RegionalTestingContractProfileService } from './regional-testing-contract-profile.service';
import { environment } from '../../../../../environments/environment';
import {
  ProfileTest,
  CreateProfileTestDto,
  UpdateProfileTestDto
} from '../models/regional-testing-contract.models';

describe('RegionalTestingContractProfileService', () => {
  let service: RegionalTestingContractProfileService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/regional-testing-contract-profiles`;

  const mockProfileTest: ProfileTest = {
    contractId: 'CNT20260616120000',
    profileSetId: 'PROF001',
    profileType: 'P',
    testId: 'HIV1',
    description: 'HIV-1 Antibody Test',
    width: 10,
    length: 5,
    required: 'Y',
    extract: 'Y',
    electronicFile: 'N',
    effDate: '2026-06-01T00:00:00Z',
    termDate: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegionalTestingContractProfileService]
    });
    service = TestBed.inject(RegionalTestingContractProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProfileTests', () => {
    it('should retrieve profile tests with pagination', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockProfileTest],
        totalCount: 1
      };

      service.getProfileTests(10, 0, 'CNT20260616120000').subscribe(response => {
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0]).toEqual(mockProfileTest);
      });

      const req = httpMock.expectOne(`${baseUrl}/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.contractId).toBe('CNT20260616120000');
      req.flush(mockResponse);
    });
  });

  describe('getProfileTestById', () => {
    it('should retrieve a single profile test', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Profile test retrieved successfully',
        data: [mockProfileTest]
      };

      service.getProfileTestById('CNT20260616120000', 'PROF001').subscribe(test => {
        expect(test).toEqual(mockProfileTest);
      });

      const req = httpMock.expectOne(`${baseUrl}/CNT20260616120000/PROF001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createProfileTest', () => {
    it('should create a new profile test', () => {
      const dto: CreateProfileTestDto = {
        contractId: 'CNT20260616120000',
        profileSetId: 'PROF002',
        testId: 'HCV',
        effDate: '2026-06-01'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Profile test created successfully'
      };

      service.createProfileTest(dto).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('updateProfileTest', () => {
    it('should update an existing profile test', () => {
      const dto: UpdateProfileTestDto = {
        contractId: 'CNT20260616120000',
        profileSetId: 'PROF001',
        testId: 'HIV1',
        required: 'N',
        effDate: '2026-06-01'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Profile test updated successfully'
      };

      service.updateProfileTest('CNT20260616120000', 'PROF001', dto).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/CNT20260616120000/PROF001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });
  describe('getProfileTypes', () => {
    it('should return profile types', () => {
      const types = service.getProfileTypes();
      expect(types.length).toBe(3);
      expect(types[0]).toEqual({ code: 'P', description: 'Primary' });
      expect(types[1]).toEqual({ code: 'A', description: 'Ad Hoc' });
      expect(types[2]).toEqual({ code: 'S', description: 'Secondary' });
    });
  });

  describe('getYesNoOptions', () => {
    it('should return Yes/No options', () => {
      const options = service.getYesNoOptions();
      expect(options.length).toBe(2);
      expect(options[0]).toEqual({ code: 'Y', description: 'Yes' });
      expect(options[1]).toEqual({ code: 'N', description: 'No' });
    });
  });
});
