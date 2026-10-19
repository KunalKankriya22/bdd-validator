import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HlaCrossReactiveGroupsService } from './hla-cross-reactive-groups.service';
import {
  HlaCrossReactiveGroupModel,
  HlaCrossReactiveGroupParamsDto,
  CreateHlaCrossReactiveGroupDto,
  UpdateHlaCrossReactiveGroupDto,
  ApiResponse,
  HlaStandardCodeDto,
  PublicEpitopeOption
} from '../models/hla-cross-reactive-groups.model';

describe('HlaCrossReactiveGroupsService', () => {
  let service: HlaCrossReactiveGroupsService;
  let httpMock: HttpTestingController;

  const mockGroups: HlaCrossReactiveGroupModel[] = [
    {
      publicEpitopeId: 'A1',
      description: 'A1 Pel-Freeze',
      publicEpitopeDescription: 'A1 Pel-Freeze',
      associatedEpitopeId: '187',
      hlaStandard: 'AABB',
      effectiveDate: '2024-01-01',
      terminationDate: undefined
    },
    {
      publicEpitopeId: 'A1',
      description: 'A1 Pel-Freeze',
      publicEpitopeDescription: 'A1 Pel-Freeze',
      associatedEpitopeId: '366',
      hlaStandard: 'AABB',
      effectiveDate: '2024-02-01',
      terminationDate: '2025-12-31'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HlaCrossReactiveGroupsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HlaCrossReactiveGroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHlaCrossReactiveGroups', () => {
    it('should return HLA Cross-Reactive Groups from API', (done) => {
      const take = 25;
      const skip = 0;
      const params: HlaCrossReactiveGroupParamsDto = {};

      service.getHlaCrossReactiveGroups(take, skip, params).subscribe({
        next: (response: { data: HlaCrossReactiveGroupModel[]; total: number }) => {
          expect(response.data.length).toBe(2);
          expect(response.total).toBe(2);
          expect(response.data[0].publicEpitopeId).toBe('A1');
          expect(response.data[0].associatedEpitopeId).toBe('187');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/${take}/${skip}`);
      expect(req.request.method).toBe('POST');

      const mockResponse: ApiResponse<HlaCrossReactiveGroupModel[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockGroups,
        total: 2
      };
      req.flush(mockResponse);
    });

    it('should include filter params in request', (done) => {
      const take = 25;
      const skip = 0;
      const params: HlaCrossReactiveGroupParamsDto = {
        searchKeyword: 'test',
        sortOrder: 'DESC'
      };

      service.getHlaCrossReactiveGroups(take, skip, params).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/${take}/${skip}`);
      expect(req.request.body).toEqual(params);

      const mockResponse: ApiResponse<HlaCrossReactiveGroupModel[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };
      req.flush(mockResponse);
    });

  });

  describe('getHlaCrossReactiveGroupById', () => {
    it('should return single HLA Cross-Reactive Group by composite key', (done) => {
      const publicEpitopeId = 'A1';
      const associatedEpitopeId = '187';

      service.getHlaCrossReactiveGroupById(publicEpitopeId, associatedEpitopeId).subscribe({
        next: (response: ApiResponse<HlaCrossReactiveGroupModel>) => {
          expect(response).toBeTruthy();
          expect(response.data.publicEpitopeId).toBe('A1');
          expect(response.data.associatedEpitopeId).toBe('187');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/${publicEpitopeId}/${associatedEpitopeId}`);
      expect(req.request.method).toBe('GET');

      const mockResponse: ApiResponse<HlaCrossReactiveGroupModel> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockGroups[0]
      };
      req.flush(mockResponse);
    });

  });

  describe('createHlaCrossReactiveGroup', () => {
    it('should create new HLA Cross-Reactive Group', (done) => {
      const newGroup: CreateHlaCrossReactiveGroupDto = {
        publicEpitopeId: 'A1',
        associatedEpitopeId: '187',
        hlaStandard: 'AABB',
        effectiveDate: '2024-01-01',
        terminationDate: undefined,
        chapterId: '1'
      };

      service.createHlaCrossReactiveGroup(newGroup).subscribe({
        next: (response: ApiResponse<string>) => {
          expect(response.success).toBe(true);
          expect(response.message).toBe('Created successfully');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newGroup);

      const mockResponse: ApiResponse<string> = {
        success: true,
        message: 'Created successfully',
        statusCode: 201,
        data: 'Success'
      };
      req.flush(mockResponse);
    });

  });

  describe('updateHlaCrossReactiveGroup', () => {
    it('should update existing HLA Cross-Reactive Group', (done) => {
      const publicEpitopeId = 'A1';
      const associatedEpitopeId = '187';
      const updateData: UpdateHlaCrossReactiveGroupDto = {
        publicEpitopeId: 'A1',
        associatedEpitopeId: '187new',
        hlaStandard: 'CREG',
        effectiveDate: '2024-01-01',
        terminationDate: '2025-12-31',
        chapterId: '1'
      };

      service.updateHlaCrossReactiveGroup(publicEpitopeId, associatedEpitopeId, updateData).subscribe({
        next: (response: ApiResponse<string>) => {
          expect(response.success).toBe(true);
          expect(response.message).toBe('Updated successfully');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/${publicEpitopeId}/${associatedEpitopeId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);

      const mockResponse: ApiResponse<string> = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200,
        data: 'Success'
      };
      req.flush(mockResponse);
    });

  });

  describe('getPublicEpitopes', () => {
    it('should return public epitope codes', (done) => {
      const mockOptions = [
        { code: 'A1', description: 'A1 Pel-Freeze' },
        { code: 'A2', description: 'A2 Pel-Freeze' }
      ];

      service.getPublicEpitopes().subscribe({
        next: (options: PublicEpitopeOption[]) => {
          expect(options.length).toBe(2);
          expect(options[0].code).toBe('A1');
          expect(options[0].description).toBe('A1 Pel-Freeze');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/public-epitopes`);
      expect(req.request.method).toBe('GET');

      const mockResponse: ApiResponse<any[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockOptions
      };
      req.flush(mockResponse);
    });
  });

  describe('getHlaStandardsFromMasterCode', () => {
    it('should return HLA standard codes from VALID_MASTER_CODES', (done) => {
      const mockOptions = [
        { code: 'AABB', description: 'AABB - Standard' },
        { code: 'CREG', description: 'CREG - Standard' }
      ];

      service.getHlaStandardsFromMasterCode().subscribe({
        next: (options: HlaStandardCodeDto[]) => {
          expect(options.length).toBe(2);
          expect(options[0].code).toBe('AABB');
          expect(options[0].description).toBe('AABB - Standard');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/hla-standards-from-master-code`);
      expect(req.request.method).toBe('GET');

      const mockResponse: ApiResponse<HlaStandardCodeDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockOptions
      };
      req.flush(mockResponse);
    });

  });

  describe('getHlaStandardsFromEpitopes', () => {
    it('should return HLA standard codes from VALID_HLA_EPITOPES', (done) => {
      const mockOptions = [
        { code: 'AABB', description: 'AABB - Standard' },
        { code: 'CREG', description: 'CREG - Standard' }
      ];

      service.getHlaStandardsFromEpitopes().subscribe({
        next: (options: HlaStandardCodeDto[]) => {
          expect(options.length).toBe(2);
          expect(options[0].code).toBe('AABB');
          expect(options[0].description).toBe('AABB - Standard');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-epitopes/hla-standards-from-epitopes`);
      expect(req.request.method).toBe('GET');

      const mockResponse: ApiResponse<HlaStandardCodeDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockOptions
      };
      req.flush(mockResponse);
    });

  });
});
