import { TestBed } from '@angular/core/testing';
import { DefineDonationTypesService } from './define-donation-types.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  DefineDonationTypesModel,
  DefineDonationTypesParamsDto
} from '../models/define-donation-types.model';

describe('DefineDonationTypesService', () => {
  let service: DefineDonationTypesService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockDonationTypesData: DefineDonationTypesModel[] = [
    {
      donationType: 'WB',
      description: 'Whole Blood',
      sortSequence: 1,
      testNeededFlag: 'Y',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      donationType: 'PL',
      description: 'Platelets',
      sortSequence: 2,
      testNeededFlag: 'Y',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockDonationTypesData,
    total: 2
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DefineDonationTypesService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DefineDonationTypesService);
  });

  describe('getDefineDonationTypes', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: DefineDonationTypesParamsDto = {};

      service.getDefineDonationTypes(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-types\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('Error Handling', () => {
    it('should log error to console for getDefineDonationTypes', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getDefineDonationTypes(25, 0, {}).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching define donation types data:',
            error
          );
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getDefineDonationTypes', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefineDonationTypes(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

  });

  describe('addDonationType', () => {
    const addPayload = {
      donationType: 'RBC',
      description: 'Red Blood Cells',
      testNeededFlag: 'Y',
      sortSequence: 3,
      effDate: '2025-01-01T00:00:00.000Z',
      termDate: ''
    };

    it('should call apiService.post with correct endpoint and payload', (done) => {
      const mockAddResponse = { success: true, message: 'Added successfully' };
      mockApiService.post.and.returnValue(of(mockAddResponse));

      service.addDonationType(addPayload).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-types$/),
          addPayload
        );
        done();
      });
    });


    it('should handle error when adding donation type', (done) => {
      const error = new Error('Conflict: Donation type already exists');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addDonationType(addPayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should log error to console when adding fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addDonationType(addPayload).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith('Error adding donation type:', error);
          done();
        }
      });
    });

  });

  describe('updateDonationType', () => {
    const updatePayload = {
      donationType: 'WB',
      description: 'Updated Whole Blood Description',
      testNeededFlag: 'N',
      sortSequence: 1,
      effDate: '2025-01-01T00:00:00.000Z',
      termDate: '2025-12-31T00:00:00.000Z'
    };

    it('should call apiService.put with correct endpoint and payload', (done) => {
      const mockUpdateResponse = { success: true, message: 'Updated successfully' };
      mockApiService.put.and.returnValue(of(mockUpdateResponse));

      service.updateDonationType(updatePayload).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-types$/),
          updatePayload
        );
        done();
      });
    });


    it('should handle error when updating donation type', (done) => {
      const error = new Error('Not Found: Donation type does not exist');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateDonationType(updatePayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should log error to console when updating fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateDonationType(updatePayload).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating donation type:', error);
          done();
        }
      });
    });


  });

  describe('getDonationTypeFilters', () => {
    const mockDonationTypeFilterData = {
      donationTypeCodes: [
        { donationTypeCode: 'WB' },
        { donationTypeCode: 'PLT' },
        { donationTypeCode: 'RBC' }
      ],
      sequences: [
        { sequence: 1 },
        { sequence: 2 },
        { sequence: 3 }
      ]
    };


    it('should return mapped donation type codes and sequences', (done) => {
      mockApiService.get.and.returnValue(of(mockDonationTypeFilterData));

      service.getDonationTypeFilters().subscribe(result => {
        expect(result.donationTypeCodes).toEqual(['WB', 'PLT', 'RBC']);
        expect(result.sequences).toEqual([1, 2, 3]);
        done();
      });
    });

    it('should filter out null, undefined, and empty donation type codes', (done) => {
      const mockFilterResponse = {
        donationTypeCodes: [
          { donationTypeCode: 'WB' },
          { donationTypeCode: '' },
          { donationTypeCode: '   ' },
          { donationTypeCode: 'PLT' }
        ],
        sequences: [
          { sequence: 1 },
          { sequence: 2 }
        ]
      };
      mockApiService.get.and.returnValue(of(mockFilterResponse));

      service.getDonationTypeFilters().subscribe(result => {
        expect(result.donationTypeCodes).toEqual(['WB', 'PLT']);
        done();
      });
    });

    it('should filter out null and undefined sequences', (done) => {
      const mockFilterResponse = {
        donationTypeCodes: [
          { donationTypeCode: 'WB' },
          { donationTypeCode: 'PLT' }
        ],
        sequences: [
          { sequence: 1 },
          { sequence: null },
          { sequence: undefined },
          { sequence: 4 }
        ]
      };
      mockApiService.get.and.returnValue(of(mockFilterResponse));

      service.getDonationTypeFilters().subscribe(result => {
        expect(result.sequences).toEqual([1, 4]);
        done();
      });
    });


    it('should handle missing donationTypeCodes array', (done) => {
      const mockFilterResponse = {
        sequences: [{ sequence: 1 }]
      };
      mockApiService.get.and.returnValue(of(mockFilterResponse));

      service.getDonationTypeFilters().subscribe(result => {
        expect(result.donationTypeCodes).toEqual([]);
        expect(result.sequences).toEqual([1]);
        done();
      });
    });

    it('should handle missing sequences array', (done) => {
      const mockFilterResponse = {
        donationTypeCodes: [{ donationTypeCode: 'WB' }]
      };
      mockApiService.get.and.returnValue(of(mockFilterResponse));

      service.getDonationTypeFilters().subscribe(result => {
        expect(result.donationTypeCodes).toEqual(['WB']);
        expect(result.sequences).toEqual([]);
        done();
      });
    });


    it('should log error to console when fetch fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDonationTypeFilters().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching donation type filters:',
            error
          );
          done();
        }
      });
    });

  });
});
