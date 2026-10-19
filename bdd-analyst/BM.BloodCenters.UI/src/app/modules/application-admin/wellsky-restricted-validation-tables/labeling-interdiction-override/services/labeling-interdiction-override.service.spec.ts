import { TestBed } from '@angular/core/testing';
import { LabelingInterdictionOverrideService } from './labeling-interdiction-override.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  LabelingInterdictionOverrideModel,
  LabelingInterdictionOverrideSearchParamsDto,
  LabelingInterdictionOverrideCreateDto,
  LabelingInterdictionOverrideUpdateDto,
  LabelingInterdictionOverrideDropdowns
} from '../models/labeling-interdiction-override.model';

describe('LabelingInterdictionOverrideService', () => {
  let service: LabelingInterdictionOverrideService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockTableData = [
    {
      DonorDecisionCode: 'DDC001',
      DonorDecisionDescription: 'Decision 1',
      ProductType: 'PT001',
      ProductTypeDescription: 'Product Type 1',
      InterCode: 'IC001',
      InterDescription: 'Inter Desc 1',
      InterType: 'N',
      OverrideDescription: 'Override 1',
      EffectiveDate: '2025-01-01',
      TerminationDate: null,
      LastModifiedDate: '2025-01-01'
    },
    {
      DonorDecisionCode: 'DDC002',
      DonorDecisionDescription: 'Decision 2',
      ProductType: 'PT002',
      ProductTypeDescription: 'Product Type 2',
      InterCode: 'IC002',
      InterDescription: 'Inter Desc 2',
      InterType: 'B',
      OverrideDescription: 'Override 2',
      EffectiveDate: '2025-02-01',
      TerminationDate: '2025-12-31',
      LastModifiedDate: '2025-02-01'
    }
  ];

  const mockResponse = {
    Success: true,
    Data: mockTableData,
    Total: 2,
    Message: ''
  };

  const mockDropdownResponse = {
    Item: {
      DonorDecisionCodes: [
        { Code: 'DDC001', Description: 'Decision 1' },
        { Code: 'DDC002', Description: 'Decision 2' }
      ],
      ProductTypes: [
        { Code: 'PT001', Description: 'Product Type 1' },
        { Code: 'PT002', Description: 'Product Type 2' }
      ],
      InterCodes: [
        { Code: 'IC001', Description: 'Inter Desc 1' },
        { Code: 'IC002', Description: 'Inter Desc 2' }
      ],
      InterTypes: [
        { code: 'N', description: 'NFT' },
        { code: 'B', description: 'Bio' },
        { code: 'H', description: 'Hold' },
        { code: 'I', description: 'Initial' }
      ]
    }
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        LabelingInterdictionOverrideService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(LabelingInterdictionOverrideService);
  });

  describe('getLabelingInterdictionOverrides', () => {

    it('should return normalized data and totalRecords with PascalCase response', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: LabelingInterdictionOverrideSearchParamsDto = {};

      service.getLabelingInterdictionOverrides(25, 0, params).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.totalRecords).toBe(2);
        // Verify normalization from PascalCase to camelCase
        expect(result.data[0].donorDecisionCode).toBe('DDC001');
        expect(result.data[0].donorDecisionDescription).toBe('Decision 1');
        expect(result.data[0].productType).toBe('PT001');
        expect(result.data[0].interCode).toBe('IC001');
        expect(result.data[0].interDescription).toBe('Inter Desc 1');
        expect(result.data[0].interType).toBe('N');
        expect(result.data[0].overrideDescription).toBe('Override 1');
        done();
      });
    });






    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: LabelingInterdictionOverrideSearchParamsDto = {};

      service.getLabelingInterdictionOverrides(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/50.*100/),
          params
        );
        done();
      });
    });


  });

  describe('getDropdowns', () => {

    it('should extract dropdown data from Item wrapper', (done) => {
      mockApiService.get.and.returnValue(of(mockDropdownResponse));

      service.getDropdowns().subscribe(result => {
        expect(result.donorDecisionCodes?.length).toBe(2);
        expect(result.donorDecisionCodes?.[0].code).toBe('DDC001');
        expect(result.donorDecisionCodes?.[0].description).toBe('Decision 1');
        expect(result.productTypes?.length).toBe(2);
        expect(result.interCodes?.length).toBe(2);
        expect(result.interTypes).toEqual([
          { code: 'N', description: 'NFT' },
          { code: 'B', description: 'Bio' },
          { code: 'H', description: 'Hold' },
          { code: 'I', description: 'Initial' }
        ]);
        done();
      });
    });

    it('should extract dropdown data from item (camelCase) wrapper', (done) => {
      const camelResponse = {
        item: {
          donorDecisionCodes: [
            { code: 'DDC001', description: 'Decision 1' }
          ],
          productTypes: [
            { code: 'PT001', description: 'Product Type 1' }
          ],
          interCodes: [
            { code: 'IC001', description: 'Inter Desc 1' }
          ],
          interTypes: [
            { code: 'N', description: 'NFT' },
            { code: 'B', description: 'Bio' }
          ]
        }
      };
      mockApiService.get.and.returnValue(of(camelResponse));

      service.getDropdowns().subscribe(result => {
        expect(result.donorDecisionCodes?.length).toBe(1);
        expect(result.donorDecisionCodes?.[0].code).toBe('DDC001');
        expect(result.productTypes?.length).toBe(1);
        expect(result.interCodes?.length).toBe(1);
        expect(result.interTypes).toEqual([
          { code: 'N', description: 'NFT' },
          { code: 'B', description: 'Bio' }
        ]);
        done();
      });
    });

    it('should handle Data array wrapper', (done) => {
      const arrayResponse = {
        Data: [{
          DonorDecisionCodes: [{ Code: 'DDC001', Description: 'Decision 1' }],
          ProductTypes: [],
          InterCodes: [],
          InterTypes: [{ code: 'N', description: 'NFT' }]
        }]
      };
      mockApiService.get.and.returnValue(of(arrayResponse));

      service.getDropdowns().subscribe(result => {
        expect(result.donorDecisionCodes?.length).toBe(1);
        expect(result.interTypes).toEqual([{ code: 'N', description: 'NFT' }]);
        done();
      });
    });

    it('should handle null response', (done) => {
      mockApiService.get.and.returnValue(of(null));

      service.getDropdowns().subscribe(result => {
        expect(result).toEqual({});
        done();
      });
    });


    it('should handle string arrays for donor decision codes', (done) => {
      const stringResponse = {
        Item: {
          DonorDecisionCodes: ['DDC001', 'DDC002'],
          ProductTypes: [],
          InterCodes: [],
          InterTypes: []
        }
      };
      mockApiService.get.and.returnValue(of(stringResponse));

      service.getDropdowns().subscribe(result => {
        expect(result.donorDecisionCodes?.length).toBe(2);
        expect(result.donorDecisionCodes?.[0].code).toBe('DDC001');
        expect(result.donorDecisionCodes?.[0].description).toBe('');
        done();
      });
    });

    it('should handle string arrays for productTypes and interCodes', (done) => {
      const stringResponse = {
        Item: {
          DonorDecisionCodes: [],
          ProductTypes: ['PT001', 'PT002'],
          InterCodes: ['IC001'],
          InterTypes: []
        }
      };
      mockApiService.get.and.returnValue(of(stringResponse));

      service.getDropdowns().subscribe(result => {
        expect(result.productTypes?.length).toBe(2);
        expect(result.productTypes?.[0].code).toBe('PT001');
        expect(result.productTypes?.[0].description).toBe('');
        expect(result.interCodes?.length).toBe(1);
        expect(result.interCodes?.[0].code).toBe('IC001');
        done();
      });
    });

  });

  describe('createOverride', () => {
    const mockCreateData: LabelingInterdictionOverrideCreateDto = {
      donorDecisionCode: 'DDC001',
      productType: 'PT001',
      interCode: 'IC001',
      interType: 'N',
      overrideDescription: 'New Override',
      effectiveDate: '2025-01-01T00:00:00.000Z',
      terminationDate: null
    };

    it('should call apiService.post with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of({ data: null, totalRecords: 0, message: 'Created successfully' }));

      service.createOverride(mockCreateData).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/labeling-interdiction-override/),
          mockCreateData
        );
        done();
      });
    });



  });

  describe('updateOverride', () => {
    const mockUpdateData: LabelingInterdictionOverrideUpdateDto = {
      donorDecisionCode: 'DDC001',
      productType: 'PT001',
      interCode: 'IC001',
      interType: 'B',
      overrideDescription: 'Updated Override',
      effectiveDate: '2025-01-01T00:00:00.000Z',
      terminationDate: '2025-12-31T00:00:00.000Z'
    };

    it('should call apiService.put with correct endpoint and data', (done) => {
      mockApiService.put.and.returnValue(of({ data: null, totalRecords: 0, message: 'Updated successfully' }));

      service.updateOverride(mockUpdateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/labeling-interdiction-override/),
          mockUpdateData
        );
        done();
      });
    });




  });

  describe('Error Handling', () => {
    it('should propagate error for getLabelingInterdictionOverrides', (done) => {
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getLabelingInterdictionOverrides(25, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should propagate error for getDropdowns', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getDropdowns().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should propagate error for createOverride', (done) => {
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const mockData: LabelingInterdictionOverrideCreateDto = {
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'Test',
        effectiveDate: '2025-01-01'
      };

      service.createOverride(mockData).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should propagate error for updateOverride', (done) => {
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      const mockData: LabelingInterdictionOverrideUpdateDto = {
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'Test',
        effectiveDate: '2025-01-01'
      };

      service.updateOverride(mockData).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getLabelingInterdictionOverrides', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getLabelingInterdictionOverrides(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

    it('should use correct HTTP methods for each operation', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      mockApiService.get.and.returnValue(of(mockDropdownResponse));
      mockApiService.put.and.returnValue(of({ success: true }));

      // POST for getLabelingInterdictionOverrides
      service.getLabelingInterdictionOverrides(25, 0, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();

        // GET for getDropdowns
        service.getDropdowns().subscribe(() => {
          expect(mockApiService.get).toHaveBeenCalled();

          // PUT for updateOverride
          const updateData: LabelingInterdictionOverrideUpdateDto = {
            donorDecisionCode: 'DDC001',
            productType: 'PT001',
            interCode: 'IC001',
            interType: 'N',
            overrideDescription: 'Test',
            effectiveDate: '2025-01-01'
          };

          service.updateOverride(updateData).subscribe(() => {
            expect(mockApiService.put).toHaveBeenCalled();
            done();
          });
        });
      });
    });
  });
});
