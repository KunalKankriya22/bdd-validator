import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ValidRemoteTestingLabsApiService } from './valid-remote-testing-labs-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ValidRemoteTestingLabQueryDto,
  CreateValidRemoteTestingLabRequestDto,
  UpdateValidRemoteTestingLabRequestDto
} from '../models/valid-remote-testing-labs.model';

describe('ValidRemoteTestingLabsApiService', () => {
  let service: ValidRemoteTestingLabsApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidRemoteTestingLabsApiService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ValidRemoteTestingLabsApiService);
  });

  describe('getAll', () => {
    it('should POST with query params and return mapped data and totalCount', (done) => {
      const params: ValidRemoteTestingLabQueryDto = { testingLabId: 'LAB1' } as ValidRemoteTestingLabQueryDto;
      mockApiService.post.and.returnValue(of({ data: [{ testingLabId: 'LAB1' }], total: 1 }));

      service.getAll(10, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.VALID_REMOTE_TESTING_LABS.LIST(10, 0),
          jasmine.objectContaining({ testingLabId: 'LAB1' })
        );
        done();
      });
    });
  });

  describe('getById', () => {
    it('should GET and return first item from data array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ testingLabId: 'LAB1' }] }));

      service.getById('LAB1').subscribe(result => {
        expect(result).toEqual({ testingLabId: 'LAB1' } as any);
        expect(mockApiService.get).toHaveBeenCalledWith(API.VALID_REMOTE_TESTING_LABS.GET_BY_ID('LAB1'));
        done();
      });
    });
  });

  describe('create', () => {
    it('should POST create DTO', (done) => {
      const dto = { testingLabId: 'LAB1' } as CreateValidRemoteTestingLabRequestDto;
      mockApiService.post.and.returnValue(of({ success: true, data: dto }));

      service.create(dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.post).toHaveBeenCalledWith(API.VALID_REMOTE_TESTING_LABS.CREATE, dto);
        done();
      });
    });
  });

  describe('update', () => {
    it('should PUT update DTO', (done) => {
      const dto = { testingLabName: 'Updated' } as UpdateValidRemoteTestingLabRequestDto;
      mockApiService.put.and.returnValue(of({ success: true, data: dto }));

      service.update('LAB1', dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.put).toHaveBeenCalledWith(API.VALID_REMOTE_TESTING_LABS.UPDATE('LAB1'), dto);
        done();
      });
    });
  });

  describe('delete', () => {
    it('should DELETE by testingLabId', (done) => {
      mockApiService.delete.and.returnValue(of({ success: true, data: true }));

      service.delete('LAB1').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(mockApiService.delete).toHaveBeenCalledWith(API.VALID_REMOTE_TESTING_LABS.DELETE('LAB1'));
        done();
      });
    });
  });

  describe('getLookup', () => {
    it('should GET and return data array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ testingLabId: 'LAB1', testingLabName: 'Lab One' }] }));

      service.getLookup().subscribe(result => {
        expect(result).toEqual([{ testingLabId: 'LAB1', testingLabName: 'Lab One' }] as any);
        expect(mockApiService.get).toHaveBeenCalledWith(API.VALID_REMOTE_TESTING_LABS.LOOKUP);
        done();
      });
    });
  });
});
