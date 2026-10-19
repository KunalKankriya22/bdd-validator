import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { AntigenRarityApiService } from './antigen-rarity-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  CreateAntigenRarityHeaderDto,
  UpdateAntigenRarityHeaderDto,
  CreateAntigenRarityDetailDto,
  UpdateAntigenRarityDetailDto,
  ReturnResult,
  ValidRarityCodeDetailApiDto,
  MatrixIdLovApiDto,
  RarityTestIdLovApiDto,
  RarityTestResultLovApiDto
} from '../models/sp-antigen-grouping.model';

describe('AntigenRarityApiService', () => {
  let service: AntigenRarityApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AntigenRarityApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(AntigenRarityApiService);
  });

  describe('getDetailsByMatrixId', () => {
    it('should fetch and map detail DTOs to AntigenRarityTest objects', (done) => {
      const apiDto: ValidRarityCodeDetailApiDto = {
        testId: 'T1', testDescription: 'Desc', testResult: 'POS',
        effDate: '2024-01-01', termDate: null, lastModifiedDate: '2024-06-01', matrixId: 1
      } as ValidRarityCodeDetailApiDto;
      mockApiService.get.and.returnValue(of({ data: [apiDto], totalCount: 1 }));

      service.getDetailsByMatrixId(1, 10, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].testId).toBe('T1');
        expect(result.data[0].description).toBe('Desc');
        expect(result.totalRecords).toBe(1);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1/details/10/0');
        done();
      });
    });
  });

  describe('header CRUD', () => {
    it('createHeader should POST to create endpoint', (done) => {
      const dto = { matrixId: 1 } as CreateAntigenRarityHeaderDto;
      mockApiService.post.and.returnValue(of({ success: true } as ReturnResult));

      service.createHeader(dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/valid-rarity-codes', dto);
        done();
      });
    });

    it('updateHeader should PUT to update endpoint', (done) => {
      const dto = {} as UpdateAntigenRarityHeaderDto;
      mockApiService.put.and.returnValue(of({ success: true } as ReturnResult));

      service.updateHeader(1, dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1', dto);
        done();
      });
    });

    it('deleteHeader should DELETE by matrixId', (done) => {
      mockApiService.delete.and.returnValue(of({ success: true } as ReturnResult));

      service.deleteHeader(1).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1');
        done();
      });
    });
  });

  describe('detail CRUD', () => {
    it('createDetail should POST to details endpoint', (done) => {
      const dto = { matrixId: 1 } as CreateAntigenRarityDetailDto;
      mockApiService.post.and.returnValue(of({ success: true } as ReturnResult));

      service.createDetail(dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1/details', dto);
        done();
      });
    });

    it('updateDetail should PUT with encoded testId', (done) => {
      const dto = {} as UpdateAntigenRarityDetailDto;
      mockApiService.put.and.returnValue(of({ success: true } as ReturnResult));

      service.updateDetail(1, 'T1', dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1/details/T1', dto);
        done();
      });
    });

    it('deleteDetail should DELETE with encoded testId', (done) => {
      mockApiService.delete.and.returnValue(of({ success: true } as ReturnResult));

      service.deleteDetail(1, 'T1').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/1/details/T1');
        done();
      });
    });
  });

  describe('getMatrixIdsLov', () => {
    it('should map MatrixIdLovApiDto to CombinationNumberDropdown', (done) => {
      const dtos: MatrixIdLovApiDto[] = [{ matrixId: 1, rarityPercent: 50 } as MatrixIdLovApiDto];
      mockApiService.get.and.returnValue(of(dtos));

      service.getMatrixIdsLov().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].matrixId).toBe(1);
        expect(result[0].rarityPercent).toBe(50);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/lov/matrix-ids');
        done();
      });
    });
  });

  describe('getTestIdsLov', () => {
    it('should map RarityTestIdLovApiDto to LookUp', (done) => {
      const dtos: RarityTestIdLovApiDto[] = [{ testId: 'T1', testDesc: 'Desc' } as RarityTestIdLovApiDto];
      mockApiService.get.and.returnValue(of(dtos));

      service.getTestIdsLov().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].key).toBe('T1');
        expect(result[0].value).toBe('Desc');
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/valid-rarity-codes/lov/test-ids');
        done();
      });
    });
  });

  describe('getTestResultsLov', () => {
    it('should deduplicate results and map to LookUp', (done) => {
      const dtos: RarityTestResultLovApiDto[] = [
        { resultStatus: 'POS', codeDesc: 'Positive' } as RarityTestResultLovApiDto,
        { resultStatus: 'POS', codeDesc: 'Positive' } as RarityTestResultLovApiDto,
        { resultStatus: 'NEG', codeDesc: 'Negative' } as RarityTestResultLovApiDto
      ];
      mockApiService.get.and.returnValue(of(dtos));

      service.getTestResultsLov('T1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].key).toBe('POS');
        expect(result[1].key).toBe('NEG');
        expect(mockApiService.get).toHaveBeenCalledWith(
          '/api/v1/valid-rarity-codes/lov/test-results',
          { params: jasmine.any(HttpParams) }
        );
        done();
      });
    });
  });
});
