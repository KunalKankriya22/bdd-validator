import { TestBed } from '@angular/core/testing';
import { BarCodeTranslationsService } from './bar-code-translations.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { BarCodeTranslationFilter } from '../models/bar-code-translations.model';

describe('BarCodeTranslationsService', () => {
  let service: BarCodeTranslationsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockListResponse = {
    success: true, statusCode: 200,
    data: [
      { machineCode: '00', eyeReadTrns: ' C', effDate: '2016-09-22T00:00:00Z', termDate: null, lastModified: '2016-09-22T00:00:00Z' }
    ],
    total: 1
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        BarCodeTranslationsService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(BarCodeTranslationsService);
  });

  describe('getBarCodeTranslations', () => {
    it('should call apiService.post with correct endpoint', () => {
      mockApiService.post.and.returnValue(of(mockListResponse));
      service.getBarCodeTranslations(25, 0, {}).subscribe();
      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/bar-code-translations/25/0', {});
    });

    it('should map response to { data, totalRecords }', (done) => {
      mockApiService.post.and.returnValue(of(mockListResponse));
      service.getBarCodeTranslations(25, 0, {}).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0].machineCode).toBe('00');
        done();
      });
    });

  });

  describe('getUsedMachineCodes', () => {
    it('should call apiService.get and return string array', (done) => {
      mockApiService.get.and.returnValue(of({ success: true, data: ['00', '01', '02'] }));
      service.getUsedMachineCodes().subscribe(result => {
        expect(result).toEqual(['00', '01', '02']);
        done();
      });
    });
  });

  describe('getEyeReadTranslations', () => {
    it('should call apiService.get and return string array', (done) => {
      mockApiService.get.and.returnValue(of({ success: true, data: [' C', ' E', ' F'] }));
      service.getEyeReadTranslations().subscribe(result => {
        expect(result).toEqual([' C', ' E', ' F']);
        done();
      });
    });
  });
});
