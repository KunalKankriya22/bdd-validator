import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PrdtyatService } from './prdtyat.service';
import { ProductTypeAttributeParamsDto } from '../models/product-type-attribute.model';

describe('PrdtyatService', () => {
  let service: PrdtyatService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  const baseUrl = '/api/v1/product-type-attributes';

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PrdtyatService,
        { provide: HttpClient, useValue: spy },
      ],
    });

    service = TestBed.inject(PrdtyatService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getProductTypeAttributes', () => {
    it('should call POST with take/skip and return response', (done) => {
      const mockResponse = { data: [], total: 0 };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.getProductTypeAttributes(10, 0).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(httpSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should send null fields when no params provided', (done) => {
      httpSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getProductTypeAttributes(25, 5).subscribe({
        next: () => {
          const [url, body] = httpSpy.post.calls.mostRecent().args;
          expect(url).toBe(`${baseUrl}/25/5`);
          expect(body).toEqual({
            searchKeyword: null,
            anticoagulantCode: null,
            productType: null,
            attribute: null,
            effectiveDateFrom: null,
            effectiveDateTo: null,
            terminationDateFrom: null,
            terminationDateTo: null,
          });
          done();
        },
      });
    });

    it('should send param values when params are provided', (done) => {
      const params: ProductTypeAttributeParamsDto = {
        searchKeyword: 'test',
        anticoagulantCode: 'ACD',
        productType: 'WB',
        attribute: 'ATR1',
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31',
        terminationDateFrom: '2025-01-01',
        terminationDateTo: '2025-12-31',
      };
      httpSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getProductTypeAttributes(10, 0, params).subscribe({
        next: () => {
          const [, body] = httpSpy.post.calls.mostRecent().args;
          expect(body).toEqual({
            searchKeyword: 'test',
            anticoagulantCode: 'ACD',
            productType: 'WB',
            attribute: 'ATR1',
            effectiveDateFrom: '2024-01-01',
            effectiveDateTo: '2024-12-31',
            terminationDateFrom: '2025-01-01',
            terminationDateTo: '2025-12-31',
          });
          done();
        },
      });
    });

    it('should send null for missing optional param fields', (done) => {
      const params: ProductTypeAttributeParamsDto = {
        searchKeyword: 'partial',
      };
      httpSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getProductTypeAttributes(10, 0, params).subscribe({
        next: () => {
          const [, body] = httpSpy.post.calls.mostRecent().args;
          expect(body).toEqual({
            searchKeyword: 'partial',
            anticoagulantCode: null,
            productType: null,
            attribute: null,
            effectiveDateFrom: null,
            effectiveDateTo: null,
            terminationDateFrom: null,
            terminationDateTo: null,
          });
          done();
        },
      });
    });

    it('should propagate errors from http.post', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('Network error')));

      service.getProductTypeAttributes(10, 0).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        },
      });
    });
  });

  describe('getProductTypeAttribute', () => {
    it('should call GET and extract data from response', (done) => {
      const mockAttr = { productType: 'PT1', attributeGroup: 'AG1' };
      httpSpy.get.and.returnValue(of({ data: mockAttr }));

      service.getProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', 100).subscribe({
        next: (result) => {
          expect(result).toEqual(mockAttr as any);
          expect(httpSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should build URL with encoded parameters', (done) => {
      httpSpy.get.and.returnValue(of({ data: {} }));

      service.getProductTypeAttribute('PT/1', 'AG&1', 'AC 1', 'ANT+1', 250).subscribe({
        next: () => {
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/${encodeURIComponent('PT/1')}/${encodeURIComponent('AG&1')}/${encodeURIComponent('AC 1')}/${encodeURIComponent('ANT+1')}/250`);
          done();
        },
      });
    });

    it('should default volume to 0 when volume is null', (done) => {
      httpSpy.get.and.returnValue(of({ data: {} }));

      service.getProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', null as any).subscribe({
        next: () => {
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toContain('/0');
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/0`);
          done();
        },
      });
    });

    it('should default volume to 0 when volume is undefined', (done) => {
      httpSpy.get.and.returnValue(of({ data: {} }));

      service.getProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', undefined as any).subscribe({
        next: () => {
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/0`);
          done();
        },
      });
    });

    it('should accept string volume', (done) => {
      httpSpy.get.and.returnValue(of({ data: {} }));

      service.getProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', '500').subscribe({
        next: () => {
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/500`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', 100).subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        },
      });
    });
  });

  describe('createProductTypeAttribute', () => {
    it('should call POST with DTO', (done) => {
      const mockResponse = { success: true };
      httpSpy.post.and.returnValue(of(mockResponse));

      service.createProductTypeAttribute({ productType: 'PT1' } as any).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(httpSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should POST to the base URL with the full DTO', (done) => {
      const dto = {
        anticoagulantCode: 'ACD',
        volume: 450,
        productType: 'WB',
        attributeGroup: 'GRP1',
        attributeCode: 'CODE1',
        productClass: 'CLS1',
        modifierCode: 'MOD1',
        effDate: '2024-01-01',
        termDate: null,
      };
      httpSpy.post.and.returnValue(of({ success: true }));

      service.createProductTypeAttribute(dto as any).subscribe({
        next: () => {
          const [url, body] = httpSpy.post.calls.mostRecent().args;
          expect(url).toBe(baseUrl);
          expect(body).toEqual(dto);
          done();
        },
      });
    });

    it('should propagate errors from http.post', (done) => {
      httpSpy.post.and.returnValue(throwError(() => new Error('Conflict')));

      service.createProductTypeAttribute({ productType: 'PT1' } as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Conflict');
          done();
        },
      });
    });
  });

  describe('updateProductTypeAttribute', () => {
    it('should call PUT with encoded URL and DTO', (done) => {
      const dto = {
        attributeGroup: 'GRP1',
        attributeCode: 'CODE1',
        productClass: 'CLS1',
        modifierCode: 'MOD1',
      };
      httpSpy.put.and.returnValue(of({ success: true }));

      service.updateProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', 100, dto).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          const [url, body] = httpSpy.put.calls.mostRecent().args;
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/100`);
          expect(body).toEqual(dto);
          done();
        },
      });
    });

    it('should encode special characters in URL segments', (done) => {
      const dto = { attributeGroup: 'G', attributeCode: 'C', productClass: 'P', modifierCode: 'M' };
      httpSpy.put.and.returnValue(of({ success: true }));

      service.updateProductTypeAttribute('PT/1', 'AG&1', 'AC 1', 'ANT+1', 200, dto).subscribe({
        next: () => {
          const url = httpSpy.put.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/${encodeURIComponent('PT/1')}/${encodeURIComponent('AG&1')}/${encodeURIComponent('AC 1')}/${encodeURIComponent('ANT+1')}/200`);
          done();
        },
      });
    });

    it('should default volume to 0 when volume is null', (done) => {
      const dto = { attributeGroup: 'G', attributeCode: 'C', productClass: 'P', modifierCode: 'M' };
      httpSpy.put.and.returnValue(of({ success: true }));

      service.updateProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', null as any, dto).subscribe({
        next: () => {
          const url = httpSpy.put.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/0`);
          done();
        },
      });
    });

    it('should default volume to 0 when volume is undefined', (done) => {
      const dto = { attributeGroup: 'G', attributeCode: 'C', productClass: 'P', modifierCode: 'M' };
      httpSpy.put.and.returnValue(of({ success: true }));

      service.updateProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', undefined as any, dto).subscribe({
        next: () => {
          const url = httpSpy.put.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/PT1/AG1/AC1/ANT1/0`);
          done();
        },
      });
    });

    it('should propagate errors from http.put', (done) => {
      const dto = { attributeGroup: 'G', attributeCode: 'C', productClass: 'P', modifierCode: 'M' };
      httpSpy.put.and.returnValue(throwError(() => new Error('Server error')));

      service.updateProductTypeAttribute('PT1', 'AG1', 'AC1', 'ANT1', 100, dto).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        },
      });
    });
  });

  describe('getAnticoagulantCodes', () => {
    it('should call GET and extract data array from response', (done) => {
      const mockData = [{ code: 'ACD', description: 'Acid Citrate Dextrose' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getAnticoagulantCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/anticoagulant-codes`);
          done();
        },
      });
    });

    it('should return empty array when data is empty', (done) => {
      httpSpy.get.and.returnValue(of({ data: [] }));

      service.getAnticoagulantCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getAnticoagulantCodes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getProductTypes', () => {
    it('should call GET and extract data array from response', (done) => {
      const mockData = [{ code: 'WB', description: 'Whole Blood' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/product-types`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getProductTypes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getAttributeGroups', () => {
    it('should call GET and extract data array from response', (done) => {
      const mockData = [{ code: 'GRP1', description: 'Group 1' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getAttributeGroups().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/attribute-groups`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getAttributeGroups().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should call GET with encoded attribute group and extract data', (done) => {
      const mockData = [{ code: 'AC1', description: 'Attribute Code 1' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getAttributeCodes('GRP1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/attribute-codes/GRP1`);
          done();
        },
      });
    });

    it('should encode special characters in attribute group', (done) => {
      httpSpy.get.and.returnValue(of({ data: [] }));

      service.getAttributeCodes('GRP/1&2').subscribe({
        next: () => {
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/attribute-codes/${encodeURIComponent('GRP/1&2')}`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getAttributeCodes('GRP1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getProductClasses', () => {
    it('should call GET and extract data array from response', (done) => {
      const mockData = [{ code: 'CLS1', description: 'Class 1' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getProductClasses().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/product-classes`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getProductClasses().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getModifierCodes', () => {
    it('should call GET and extract data array from response', (done) => {
      const mockData = [{ code: 'MOD1', description: 'Modifier 1' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getModifierCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/lookups/modifier-codes`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getModifierCodes().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        },
      });
    });
  });

  describe('getAnticoagulantCodesFilter', () => {
    it('should call GET on filters endpoint and extract data', (done) => {
      const mockData = [{ code: 'ACD', description: 'Acid Citrate Dextrose' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getAnticoagulantCodesFilter().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/filters/anticoagulant-codes`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Filter failed')));

      service.getAnticoagulantCodesFilter().subscribe({
        error: (err) => {
          expect(err.message).toBe('Filter failed');
          done();
        },
      });
    });
  });

  describe('getProductTypesFilter', () => {
    it('should call GET on filters endpoint and extract data', (done) => {
      const mockData = [{ code: 'WB', description: 'Whole Blood' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getProductTypesFilter().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/filters/product-types`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Filter failed')));

      service.getProductTypesFilter().subscribe({
        error: (err) => {
          expect(err.message).toBe('Filter failed');
          done();
        },
      });
    });
  });

  describe('getAttributesFilter', () => {
    it('should call GET on filters endpoint and extract data', (done) => {
      const mockData = [{ code: 'ATTR1', description: 'Attribute 1' }];
      httpSpy.get.and.returnValue(of({ data: mockData }));

      service.getAttributesFilter().subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          const url = httpSpy.get.calls.mostRecent().args[0] as string;
          expect(url).toBe(`${baseUrl}/filters/attributes`);
          done();
        },
      });
    });

    it('should propagate errors from http.get', (done) => {
      httpSpy.get.and.returnValue(throwError(() => new Error('Filter failed')));

      service.getAttributesFilter().subscribe({
        error: (err) => {
          expect(err.message).toBe('Filter failed');
          done();
        },
      });
    });
  });
});
