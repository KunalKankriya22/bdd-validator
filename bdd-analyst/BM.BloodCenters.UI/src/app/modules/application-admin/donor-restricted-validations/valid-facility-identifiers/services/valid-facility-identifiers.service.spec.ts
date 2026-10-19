import { TestBed } from '@angular/core/testing';
import { ValidFacilityIdentifiersService } from './valid-facility-identifiers.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  ValidFacilityIdentifiersModel,
  ValidFacilityIdentifiersParamsDto
} from '../models/valid-facility-identifiers.model';

describe('ValidFacilityIdentifiersService', () => {
  let service: ValidFacilityIdentifiersService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockFacilityIdentifiersData: ValidFacilityIdentifiersModel[] = [
    {
      chapterId: 'AB12',
      facilityIdentifier: '12345',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      chapterId: 'CD34',
      facilityIdentifier: '67890',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockFacilityIdentifiersData,
    total: 2
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidFacilityIdentifiersService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ValidFacilityIdentifiersService);
  });

  describe('getValidFacilityIdentifiers', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: ValidFacilityIdentifiersParamsDto = {};

      service.getValidFacilityIdentifiers(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/valid-facility-identifiers\/50\/100/),
          params
        );
        done();
      });
    });

  });


  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getValidFacilityIdentifiers', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getValidFacilityIdentifiers(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

  });

  describe('addFacilityIdentifier', () => {
    const addPayload = {
      chapterId: 'EF56',
      facilityIdentifier: '11111',
      effDate: '2025-01-01T00:00:00.000Z',
      termDate: ''
    };

    it('should call apiService.post with correct endpoint and payload', (done) => {
      const mockAddResponse = { success: true, message: 'Added successfully' };
      mockApiService.post.and.returnValue(of(mockAddResponse));

      service.addFacilityIdentifier(addPayload).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/valid-facility-identifiers$/),
          addPayload
        );
        done();
      });
    });


    it('should handle error when adding facility identifier', (done) => {
      const error = new Error('Conflict: Facility identifier already exists');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addFacilityIdentifier(addPayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

  });

  describe('updateFacilityIdentifier', () => {
    const updatePayload = {
      chapterId: 'AB12',
      originalFacilityIdentifier: '12345',
      facilityIdentifier: '99999',
      effDate: '2025-01-01T00:00:00.000Z',
      termDate: '2025-12-31T00:00:00.000Z'
    };

    it('should call apiService.put with correct endpoint and payload', (done) => {
      const mockUpdateResponse = { success: true, message: 'Updated successfully' };
      mockApiService.put.and.returnValue(of(mockUpdateResponse));

      service.updateFacilityIdentifier(updatePayload).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/valid-facility-identifiers$/),
          updatePayload
        );
        done();
      });
    });


    it('should handle error when updating facility identifier', (done) => {
      const error = new Error('Not Found: Facility identifier does not exist');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateFacilityIdentifier(updatePayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });


  });

  describe('getChapters', () => {

    it('should return array of chapter IDs', (done) => {
      const mockChaptersResponse = {
        success: true,
        data: [
          { chapterId: 'AB12' },
          { chapterId: 'CD34' },
          { chapterId: 'EF56' }
        ]
      };
      mockApiService.get.and.returnValue(of(mockChaptersResponse));

      service.getChapters().subscribe(result => {
        expect(result).toEqual([{ chapterId: 'AB12', chapterName: '' }, { chapterId: 'CD34', chapterName: '' }, { chapterId: 'EF56', chapterName: '' }]);
        done();
      });
    });


    it('should handle error when fetching chapter IDs', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getChapters().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

  });
});
