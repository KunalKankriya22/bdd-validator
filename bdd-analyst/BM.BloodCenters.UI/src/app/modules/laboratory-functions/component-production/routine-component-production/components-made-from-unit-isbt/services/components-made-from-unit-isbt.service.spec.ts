import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ComponentsMadeFromUnitIsbtService } from './components-made-from-unit-isbt.service';
import { ApiService } from '@shared/services/api.service';

describe('ComponentsMadeFromUnitIsbtService', () => {
  let service: ComponentsMadeFromUnitIsbtService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const baseUrl = '/api/v1/components-made-from-unit';

  const mockProductTypes = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells', weightRequired: 'N', attribFlag: 'Y' },
    { productTypeCode: 'FFP', productTypeDesc: 'Fresh Frozen Plasma', weightRequired: 'Y', attribFlag: 'Y' }
  ];

  const mockAttributes = [
    { attribCode: '+4202', attribDesc: 'RPL (E4202)' }
  ];

  const mockCatalogNumbers = [
    { catalogNumber: '1TE0088994' },
    { catalogNumber: '2AB0012345' }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ComponentsMadeFromUnitIsbtService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ComponentsMadeFromUnitIsbtService);
  });

  // ── getProductTypes ─────────────────────────────────────────────────

  describe('getProductTypes', () => {
    it('should fetch and map product types successfully', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockProductTypes
      }));

      service.getProductTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].productTypeCode).toBe('RBC');
        expect(mockApiService.get).toHaveBeenCalledWith(`${baseUrl}/dropdowns/product-types`);
        done();
      });
    });

    it('should handle errors when fetching product types', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ statusCode: 500, message: 'Error' })));

      service.getProductTypes().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  // ── getAttributes ───────────────────────────────────────────────────

  describe('getAttributes', () => {
    it('should fetch attributes for product type', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockAttributes
      }));

      service.getAttributes('RBC').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].attribCode).toBe('+4202');
        const callArgs = mockApiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(`${baseUrl}/dropdowns/attributes`);
        const params = callArgs[1]?.params as HttpParams;
        expect(params.get('productType')).toBe('RBC');
        done();
      });
    });

    it('should handle errors when fetching attributes', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ statusCode: 500, message: 'Error' })));

      service.getAttributes('RBC').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  // ── validateUnit ────────────────────────────────────────────────────

  describe('validateUnit', () => {
    it('should validate unit and return first result', (done) => {
      const mockValidation = {
        collDate: '2024-03-15',
        bagCode: 'BAG123',
        bagCount: 1,
        addOnBags: 0
      };
      mockApiService.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Valid unit',
        data: [mockValidation]
      }));

      service.validateUnit('W633311070052', 'RPL').subscribe(result => {
        expect(result.collDate).toBe('2024-03-15');
        expect(result.bagCode).toBe('BAG123');
        expect(mockApiService.post).toHaveBeenCalledWith(
          `${baseUrl}/validate-unit`,
          { unitId: 'W633311070052', productType: 'RPL' }
        );
        done();
      });
    });

    it('should propagate validation errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({
        error: { errorCode: '0063' },
        message: 'Collection date not present'
      })));

      service.validateUnit('INVALID', 'RBC').subscribe({
        next: () => fail('Should have errored'),
        error: (err) => {
          expect(err.error.errorCode).toBe('0063');
          done();
        }
      });
    });
  });

  // ── getCatalogNumbers ───────────────────────────────────────────────

  describe('getCatalogNumbers', () => {
    it('should fetch catalog numbers with correct params', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCatalogNumbers
      }));

      service.getCatalogNumbers('W633311070052', 'RBC').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].catalogNumber).toBe('1TE0088994');
        const callArgs = mockApiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(`${baseUrl}/dropdowns/catalog-numbers`);
        const params = callArgs[1]?.params as HttpParams;
        expect(params.get('productType')).toBe('RBC');
        expect(params.get('unitId')).toBe('W633311070052');
        done();
      });
    });

    it('should handle errors', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ message: 'Error' })));

      service.getCatalogNumbers('W123', 'RBC').subscribe({
        next: () => fail('Should have errored'),
        error: (err) => {
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
  });

  // ── determineProductCode ────────────────────────────────────────────

  describe('determineProductCode', () => {
    it('should determine product code with all params', (done) => {
      const mockResult = {
        productCode: 'E0385V00',
        productDesc: 'RED BLOOD CELLS',
        isMultiple: false,
        specificGravity: 1.053,
        labelPrintRequired: false,
        timeLimitWarning: null
      };
      mockApiService.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockResult]
      }));

      service.determineProductCode('W633311070052', '2024-03-15', 'RBC', '1TE0088994', '+4202').subscribe(result => {
        expect(result.productCode).toBe('E0385V00');
        expect(result.isMultiple).toBe(false);
        expect(mockApiService.post).toHaveBeenCalledWith(
          `${baseUrl}/determine-product`,
          {
            unitId: 'W633311070052',
            collDate: '2024-03-15',
            productType: 'RBC',
            catalogNumber: '1TE0088994',
            attribCode: '+4202'
          }
        );
        done();
      });
    });

    it('should determine product code without attribCode', (done) => {
      mockApiService.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [{
          isMultiple: true,
          productOptions: [
            { productCode: 'E0385V00', productDesc: 'RBC' },
            { productCode: 'E2457V00', productDesc: 'PLASMA' }
          ]
        }]
      }));

      service.determineProductCode('W633', '2024-03-15', 'RBC', 'CAT1').subscribe(result => {
        expect(result.isMultiple).toBe(true);
        expect(result.productOptions!.length).toBe(2);
        const body = mockApiService.post.calls.mostRecent().args[1];
        expect(body.attribCode).toBeUndefined();
        done();
      });
    });

    it('should handle errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ message: 'Error' })));

      service.determineProductCode('W1', '2024-01-01', 'RBC', 'C1').subscribe({
        next: () => fail('Should have errored'),
        error: (err) => {
          expect(err.message).toBe('Error');
          done();
        }
      });
    });
  });

  // ── getComponents ───────────────────────────────────────────────────

  describe('getComponents', () => {
    it('should fetch components with default pagination', (done) => {
      const mockComponents = [
        { unitId: 'W633', productCode: 'E0385V00', weight: 200 }
      ];
      mockApiService.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockComponents
      }));

      service.getComponents('W633', '2024-03-15').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].unitId).toBe('W633');
        const callArgs = mockApiService.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe(`${baseUrl}/W633/components`);
        const params = callArgs[1]?.params as HttpParams;
        expect(params.get('collDate')).toBe('2024-03-15');
        expect(params.get('take')).toBe('100');
        expect(params.get('skip')).toBe('0');
        done();
      });
    });

    it('should fetch components with custom pagination', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        data: []
      }));

      service.getComponents('W633', '2024-03-15', 50, 10).subscribe(() => {
        const params = mockApiService.get.calls.mostRecent().args[1]?.params as HttpParams;
        expect(params.get('take')).toBe('50');
        expect(params.get('skip')).toBe('10');
        done();
      });
    });
  });

  // ── createComponent ─────────────────────────────────────────────────

  describe('createComponent', () => {
    it('should create component successfully', (done) => {
      const request = {
        unitId: 'W633311070052',
        collectionDate: '2024-03-15',
        productTypeCode: 'RBC',
        productCode: 'E0385V00',
        catalogNumber: '1TE0088994'
      };

      mockApiService.post.and.returnValue(of({
        success: true,
        statusCode: 201,
        message: 'Component successfully added',
        data: [{
          UnitId: 'W633311070052',
          ProductCode: 'E0385V00',
          CatalogNumber: '1TE0088994',
          ComponentPrefix: 'E0'
        }]
      }));

      service.createComponent(request as any).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);
        expect(mockApiService.post).toHaveBeenCalledWith(baseUrl, request);
        done();
      });
    });

    it('should handle create errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({
        error: { errorCode: '0260' },
        message: 'WB unit already separated'
      })));

      service.createComponent({ unitId: 'W123' } as any).subscribe({
        next: () => fail('Should have errored'),
        error: (err) => {
          expect(err.error.errorCode).toBe('0260');
          done();
        }
      });
    });
  });

  // ── reprintLabel ────────────────────────────────────────────────────

  describe('reprintLabel', () => {
    it('should reprint label successfully', (done) => {
      const request = {
        unitId: 'W633311070052',
        productCode: 'E0385V00',
        productType: 'RBC',
        collDate: '2024-03-15'
      };

      mockApiService.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Label data generated',
        data: [{
          unitId: 'W633311070052',
          productCode: 'E0385V00',
          preprintedLabel: false,
          timeLimitWarning: null
        }]
      }));

      service.reprintLabel(request).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.data[0].preprintedLabel).toBe(false);
        expect(mockApiService.post).toHaveBeenCalledWith(`${baseUrl}/reprint-label`, request);
        done();
      });
    });

    it('should handle reprint errors', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({
        error: { errorCode: '9741' },
        message: 'Insufficient information'
      })));

      service.reprintLabel({} as any).subscribe({
        next: () => fail('Should have errored'),
        error: (err) => {
          expect(err.error.errorCode).toBe('9741');
          done();
        }
      });
    });
  });
});
