import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SterileDockingLovService, ApiResponse } from './sterile-docking-lov.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';

describe('SterileDockingLovService', () => {
  let service: SterileDockingLovService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockFiltersResponse: ApiResponse<any> = {
    success: true,
    item: {
      itemTypes: [
        { CODE: 'BA', DESCRIPTION: 'Bag to Bag' },
        { CODE: 'FI', DESCRIPTION: 'Filter' }
      ],
      sterileMachines: [
        { CODE: '01', DESCRIPTION: 'Machine 1' },
        { CODE: '02', DESCRIPTION: 'Machine 2' }
      ],
      waferLots: [
        { CODE: 'WL001', DESCRIPTION: 'Wafer Lot 1' }
      ],
      productCodes: [
        { PRODUCT_CODE: '00161', DESCRIPTION: 'Product 1', SHORT_NAME: 'P1', PRODUCT_TYPE_ID: 'PT1' }
      ],
      catalogNumbers: [
        { CODE: 'CAT001', DESCRIPTION: 'Catalog 1' }
      ],
      lotNumbers: [
        { CODE: 'LOT001', DESCRIPTION: 'Lot 1' }
      ],
      attributeCodes: [
        { CODE: '+03', DESCRIPTION: 'Attribute +03' }
      ]
    }
  };

  const mockUnitSearchResponse: ApiResponse<any> = {
    success: true,
    item: [
      { unitId: 'W454526051302', collDate: '2026-05-26', componentCount: 2 },
      { unitId: 'W454526051303', collDate: '2026-05-26', componentCount: 1 }
    ]
  };

  const mockUnitValidationResponse: ApiResponse<any> = {
    success: true,
    item: {
      unitId: 'W454526051302',
      collDate: '2026-05-26',
      componentCount: 2,
      productCode: '00161'
    }
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SterileDockingLovService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(SterileDockingLovService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getFilters', () => {
    it('should call filters API endpoint', (done) => {
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(API.STERILE_DOCKING_DEFINITION.FILTERS);
        done();
      });
    });

    it('should transform and cache filters response', (done) => {
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(filters => {
        expect(filters.dockingTypes).toBeDefined();
        expect(filters.machineCodes).toBeDefined();
        expect(filters.waferLots).toBeDefined();
        expect(filters.productCodes).toBeDefined();
        done();
      });
    });

    it('should cache filters and not call API again', (done) => {
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1);

        service.getFilters().subscribe(() => {
          expect(apiService.get).toHaveBeenCalledTimes(1); // Still 1, not called again
          done();
        });
      });
    });

    it('should handle API errors gracefully', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getFilters().subscribe(filters => {
        expect(filters).toEqual({});
        done();
      });
    });

    it('should transform uppercase fields to lowercase', (done) => {
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(filters => {
        expect(filters.dockingTypes[0].code).toBe('BA');
        expect(filters.dockingTypes[0].description).toBe('Bag to Bag');
        done();
      });
    });
  });

  describe('getDockingTypes', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should extract docking types from filters', (done) => {
      service.getDockingTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('BA');
        expect(types[0].description).toBe('Bag to Bag');
        done();
      });
    });

    it('should return empty array if no docking types', (done) => {
      const emptyResponse = { ...mockFiltersResponse, item: {} };
      apiService.get.and.returnValue(of(emptyResponse));

      service.getDockingTypes().subscribe(types => {
        expect(types).toEqual([]);
        done();
      });
    });
  });

  describe('getMachineCodes', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should extract machine codes from filters', (done) => {
      service.getMachineCodes().subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('01');
        expect(codes[0].description).toBe('Machine 1');
        done();
      });
    });
  });


  describe('getProductCodes', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should extract product codes from filters', (done) => {
      service.getProductCodes().subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('00161');
        expect(codes[0].description).toBe('Product 1');
        expect(codes[0].shortName).toBe('P1');
        expect(codes[0].productTypeId).toBe('PT1');
        done();
      });
    });

    it('should handle PRODUCT_CODE field mapping', (done) => {
      const response = {
        ...mockFiltersResponse,
        item: {
          productCodes: [{ PRODUCT_CODE: 'TEST', DESCRIPTION: 'Test' }]
        }
      };
      apiService.get.and.returnValue(of(response));

      service.getProductCodes().subscribe(codes => {
        expect(codes[0].code).toBe('TEST');
        done();
      });
    });
  });



  describe('getAttributeCodes', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should extract attribute codes from filters', (done) => {
      service.getAttributeCodes().subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('+03');
        expect(codes[0].description).toBe('Attribute +03');
        done();
      });
    });
  });

  describe('getFilterTypes', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should return empty array when filter types not available', (done) => {
      service.getFilterTypes().subscribe(types => {
        expect(types).toEqual([]);
        done();
      });
    });
  });

  describe('getFilterLots', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFiltersResponse));
    });

    it('should return empty array when filter lots not available', (done) => {
      service.getFilterLots().subscribe(lots => {
        expect(lots).toEqual([]);
        done();
      });
    });
  });

  describe('validateUnit', () => {
    it('should call validate unit API endpoint', (done) => {
      apiService.get.and.returnValue(of(mockUnitValidationResponse));

      service.validateUnit('W454526051302').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.VALIDATE_UNIT('W454526051302')
        );
        done();
      });
    });

    it('should return unit data from item field', (done) => {
      apiService.get.and.returnValue(of(mockUnitValidationResponse));

      service.validateUnit('W454526051302').subscribe(unit => {
        expect(unit.unitId).toBe('W454526051302');
        expect(unit.collDate).toBe('2026-05-26');
        expect(unit.componentCount).toBe(2);
        done();
      });
    });


    it('should fallback to data field if item not present', (done) => {
      const response = {
        success: true,
        data: mockUnitValidationResponse.item
      };
      apiService.get.and.returnValue(of(response));

      service.validateUnit('W454526051302').subscribe(unit => {
        expect(unit.unitId).toBe('W454526051302');
        done();
      });
    });
  });

  describe('searchUnits', () => {
    it('should call search units API endpoint with default pagination', (done) => {
      apiService.post.and.returnValue(of(mockUnitSearchResponse));

      service.searchUnits('W4545').subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.SEARCH_UNITS(50, 0),
          { keyword: 'W4545', dockingType: undefined }
        );
        done();
      });
    });

    it('should call search units API with custom pagination', (done) => {
      apiService.post.and.returnValue(of(mockUnitSearchResponse));

      service.searchUnits('test', 100, 20).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.STERILE_DOCKING_DEFINITION.SEARCH_UNITS(100, 20),
          { keyword: 'test', dockingType: undefined }
        );
        done();
      });
    });

    it('should return array of units', (done) => {
      apiService.post.and.returnValue(of(mockUnitSearchResponse));

      service.searchUnits('test').subscribe(units => {
        expect(Array.isArray(units)).toBe(true);
        expect(units.length).toBe(2);
        expect(units[0].unitId).toBe('W454526051302');
        done();
      });
    });

    it('should handle search errors gracefully', (done) => {
      apiService.post.and.returnValue(throwError(() => new Error('Search failed')));

      service.searchUnits('test').subscribe(units => {
        expect(units).toEqual([]);
        done();
      });
    });

    it('should handle non-array responses', (done) => {
      const response = {
        success: true,
        item: { unitId: 'SINGLE_UNIT' }
      };
      apiService.post.and.returnValue(of(response));

      service.searchUnits('test').subscribe(units => {
        expect(units).toEqual([]);
        done();
      });
    });

  });

  describe('clearCache', () => {
    it('should clear filters cache', (done) => {
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1);

        service.clearCache();

        service.getFilters().subscribe(() => {
          expect(apiService.get).toHaveBeenCalledTimes(2); // Called again after cache clear
          done();
        });
      });
    });
  });
  describe('Console Logging', () => {
    it('should log raw API response', (done) => {
      spyOn(console, 'log');
      apiService.get.and.returnValue(of(mockFiltersResponse));

      service.getFilters().subscribe(() => {
        expect(console.log).toHaveBeenCalledWith(
          '[SterileDockingLovService] Raw API response keys:',
          jasmine.any(Array)
        );
        done();
      });
    });

    it('should log errors during filter loading', (done) => {
      spyOn(console, 'error');
      apiService.get.and.returnValue(throwError(() => new Error('API Error')));

      service.getFilters().subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[SterileDockingLovService] Error loading sterile docking filters:',
          jasmine.any(Error)
        );
        done();
      });
    });

    it('should log errors during unit validation', (done) => {
      spyOn(console, 'error');
      apiService.get.and.returnValue(throwError(() => new Error('Validation Error')));

      service.validateUnit('TEST').subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            '[SterileDockingLovService] Error validating unit:',
            jasmine.any(Error)
          );
          done();
        }
      });
    });

    it('should log errors during unit search', (done) => {
      spyOn(console, 'error');
      apiService.post.and.returnValue(throwError(() => new Error('Search Error')));

      service.searchUnits('test').subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[SterileDockingLovService] Error searching units:',
          jasmine.any(Error)
        );
        done();
      });
    });
  });

  describe('calculateDerivedProduct', () => {
    it('should call API with oldProductCode, attribCode, and filterType', () => {
      apiService.get.and.returnValue(of({ derivedProduct: 'E2817V00' }));

      service.calculateDerivedProduct('E2807V00', 'V0014006', 'HA1234567').subscribe();

      const url = apiService.get.calls.mostRecent().args[0];
      expect(url).toContain('oldProductCode=E2807V00');
      expect(url).toContain('attribCode=V0014006');
      expect(url).toContain('filterType=HA1234567');
    });

    it('should return derivedProduct on success', (done) => {
      apiService.get.and.returnValue(of({ derivedProduct: 'E2817V00' }));

      service.calculateDerivedProduct('E2807V00', 'V0014006').subscribe(result => {
        expect(result.derivedProduct).toBe('E2817V00');
        expect(result.error).toBeUndefined();
        done();
      });
    });

    it('should return error object on API 400 error', (done) => {
      apiService.get.and.returnValue(throwError(() => ({
        error: { errorCode: '9735', message: 'Error in deriving new product formula / product code' }
      })));

      service.calculateDerivedProduct('E2807V00', '+93').subscribe(result => {
        expect(result.derivedProduct).toBe('E2807V00');
        expect(result.error).toContain('9735');
        expect(result.error).toContain('Error in deriving new product formula');
        done();
      });
    });

    it('should fallback to oldProductCode when derivedProduct is empty', (done) => {
      apiService.get.and.returnValue(of({ derivedProduct: '' }));

      service.calculateDerivedProduct('E2807V00', 'V0014006').subscribe(result => {
        expect(result.derivedProduct).toBe('E2807V00');
        done();
      });
    });

    it('should call API without optional params when not provided', () => {
      apiService.get.and.returnValue(of({ derivedProduct: 'E2817V00' }));

      service.calculateDerivedProduct('E2807V00').subscribe();

      const url = apiService.get.calls.mostRecent().args[0];
      expect(url).toContain('oldProductCode=E2807V00');
      expect(url).not.toContain('attribCode');
      expect(url).not.toContain('filterType');
    });

  });
});
