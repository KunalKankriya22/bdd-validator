import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PrePrintedProductLabelsApiService } from './pre-printed-product-labels-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('PrePrintedProductLabelsApiService', () => {
  let service: PrePrintedProductLabelsApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PrePrintedProductLabelsApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(PrePrintedProductLabelsApiService);
  });

  describe('getPrePrintedProductLabels', () => {
    it('should call POST with correct URL', (done) => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getPrePrintedProductLabels(25, 0, {}).subscribe(() => {
        const url = apiServiceSpy.post.calls.mostRecent().args[0];
        expect(url).toBe(API.PRE_PRINTED_PRODUCT_LABELS.LIST(25, 0));
        done();
      });
    });

    it('should return data and totalCount from response', (done) => {
      const mockData = [
        { catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53', faceLabel: 'E0385000', effDate: '2026-04-30T00:00:00' }
      ];
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData, total: 1 }));

      service.getPrePrintedProductLabels(25, 0, {}).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.totalCount).toBe(1);
        expect(result.data[0].catalogNumber).toBe('TEP540004');
        done();
      });
    });

    it('should use data.length as totalCount when total is not provided', (done) => {
      const mockData = [
        { catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53', faceLabel: 'E0385000', effDate: '2026-04-30T00:00:00' }
      ];
      apiServiceSpy.post.and.returnValue(of({ success: true, data: mockData }));

      service.getPrePrintedProductLabels(25, 0, {}).subscribe((result) => {
        expect(result.totalCount).toBe(1);
        done();
      });
    });


    it('should build payload with filter params', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.getPrePrintedProductLabels(25, 0, {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        faceLabel: 'E0385000',
        searchKeyword: 'test',
        sortColumn: 'CatalogNumber',
        sortOrder: 'ASC'
      }).subscribe(() => {
        const payload = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(payload['catalogNumber']).toBe('TEP540004');
        expect(payload['productType']).toBe('RBC');
        expect(payload['faceLabel']).toBe('E0385000');
        expect(payload['searchKeyword']).toBe('test');
        expect(payload['sortColumn']).toBe('CatalogNumber');
        expect(payload['sortOrder']).toBe('ASC');
        done();
      });
    });

    it('should not include empty filter params in payload', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.getPrePrintedProductLabels(25, 0, {}).subscribe(() => {
        const payload = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(Object.keys(payload).length).toBe(0);
        done();
      });
    });

  });

  describe('getPrePrintedProductLabelById', () => {
    it('should call GET with correct URL', (done) => {
      const mockResponse = { success: true, item: { catalogNumber: 'TEP540004', productType: 'RBC' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPrePrintedProductLabelById('TEP540004', 'RBC').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toBe(API.PRE_PRINTED_PRODUCT_LABELS.GET_BY_ID('TEP540004', 'RBC'));
        done();
      });
    });


    it('should fallback to data if item is not present', (done) => {
      const mockData = { catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53', faceLabel: 'E0385000', effDate: '2026-04-30T00:00:00' };
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockData, item: null }));

      service.getPrePrintedProductLabelById('TEP540004', 'RBC').subscribe((result) => {
        expect(result.catalogNumber).toBe('TEP540004');
        done();
      });
    });
  });

  describe('createPrePrintedProductLabel', () => {
    it('should call POST with correct URL and body', (done) => {
      const dto = {
        catalogNumber: 'TEP540004',
        productType: 'RBC',
        bagCode: 'P53',
        faceLabel: 'E0385000',
        effDate: '2026-06-15T00:00:00'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true, item: dto }));

      service.createPrePrintedProductLabel(dto).subscribe(() => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.PRE_PRINTED_PRODUCT_LABELS.CREATE,
          dto
        );
        done();
      });
    });

    it('should propagate errors on create failure', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: 'DUPLICATE_RECORD', error: 'Duplicate record' } }
      })));

      service.createPrePrintedProductLabel({
        catalogNumber: 'TEP540004', productType: 'RBC', bagCode: 'P53',
        faceLabel: 'E0385000', effDate: '2026-06-15T00:00:00'
      }).subscribe({
        error: (error) => {
          expect(error.error.errorResponse.errorCode).toBe('DUPLICATE_RECORD');
          done();
        }
      });
    });
  });

  describe('updatePrePrintedProductLabel', () => {
    it('should call PUT with correct URL and body', (done) => {
      const dto = { bagCode: 'P53', faceLabel: 'E0385000', effDate: '2026-06-15T00:00:00' };
      apiServiceSpy.put.and.returnValue(of({ success: true, item: dto }));

      service.updatePrePrintedProductLabel('TEP540004', 'RBC', dto).subscribe(() => {
        const url = apiServiceSpy.put.calls.mostRecent().args[0];
        expect(url).toBe(API.PRE_PRINTED_PRODUCT_LABELS.UPDATE('TEP540004', 'RBC'));
        expect(apiServiceSpy.put.calls.mostRecent().args[1]).toEqual(dto);
        done();
      });
    });

    it('should propagate errors on update failure', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Update failed')));

      service.updatePrePrintedProductLabel('TEP540004', 'RBC', {
        bagCode: 'P53', faceLabel: 'E0385000', effDate: '2026-06-15T00:00:00'
      }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Update failed');
          done();
        }
      });
    });
  });

  describe('getFilterDropdown', () => {
    it('should call GET with filter-dropdown URL', (done) => {
      const mockResponse = {
        success: true,
        item: {
          catalogNumbers: [{ key: 'TEP540004', value: 'TEP540004' }],
          productTypes: [{ key: 'RBC', value: 'RBC' }],
          bagCodes: [{ key: 'P53', value: 'P53' }],
          faceLabels: [{ key: 'E0385000', value: 'E0385000' }]
        }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterDropdown().subscribe((result) => {
        expect(result.catalogNumbers.length).toBe(1);
        expect(result.faceLabels.length).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PRE_PRINTED_PRODUCT_LABELS.FILTER_DROPDOWN);
        done();
      });
    });

    it('should use item field from response', (done) => {
      const itemData = {
        catalogNumbers: [{ key: 'A', value: 'A' }],
        productTypes: [],
        bagCodes: [],
        faceLabels: []
      };
      apiServiceSpy.get.and.returnValue(of({ success: true, item: itemData, data: null }));

      service.getFilterDropdown().subscribe((result) => {
        expect(result.catalogNumbers).toEqual([{ key: 'A', value: 'A' }]);
        done();
      });
    });

  });

  describe('getAddDropdown', () => {
    it('should call GET with add-dropdown URL', (done) => {
      const mockResponse = {
        success: true,
        item: {
          catalogNumbers: [{ key: 'TEP540004', value: 'TEP540004' }],
          productTypes: [{ key: 'RBC', value: 'RBC', description: 'Red Blood Cells' }],
          bagCodes: [{ key: 'P53', value: 'P53', description: 'Triple CPD (ISBT)' }]
        }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAddDropdown().subscribe((result) => {
        expect(result.productTypes[0].description).toBe('Red Blood Cells');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PRE_PRINTED_PRODUCT_LABELS.ADD_DROPDOWN);
        done();
      });
    });

    it('should return default empty arrays when response has no data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, item: null, data: null }));

      service.getAddDropdown().subscribe((result) => {
        expect(result.catalogNumbers).toEqual([]);
        expect(result.productTypes).toEqual([]);
        expect(result.bagCodes).toEqual([]);
        done();
      });
    });
  });

  describe('getProductCodes', () => {
    it('should call GET with correct URL for product type', (done) => {
      const mockResponse = {
        success: true,
        data: [{ productCodes: [{ key: 'E0385', value: 'E0385', description: 'RED BLOOD CELLS' }] }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProductCodes('RBC').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].key).toBe('E0385');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.PRE_PRINTED_PRODUCT_LABELS.PRODUCT_CODES('RBC'));
        done();
      });
    });

    it('should return empty array when data is empty', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [{ productCodes: [] }], total: 0 }));

      service.getProductCodes('UNKNOWN').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data array is empty', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [], total: 0 }));

      service.getProductCodes('UNKNOWN').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

  });
});
