import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ConfigureInterdictionPlacementService } from './configure-interdiction-placement.service';
import { API } from '@core/constants/api.constants';
import {
  InterdictionPlacement,
  CreateInterdictionPlacementRequest,
  UpdateInterdictionPlacementRequest,
  InterdictionPlacementQuery,
} from './configure-interdiction-placement.model';

describe('ConfigureInterdictionPlacementService', () => {
  let service: ConfigureInterdictionPlacementService;
  let httpMock: HttpTestingController;

  const mockData: InterdictionPlacement[] = [
    {
      chapterId: 'CH01',
      actionFunctionName: 'CPIREJ',
      actionType: 'REJECT',
      actionProductCode: 'E0009',
      actionCode: null,
      interOnCurrentProd: 'Y',
      interOnOtherProds: null,
      interOnOtherProdTypes: null,
      interOnUnitLevel: 'Y',
      interAllProdButCurr: null,
      interCode: 'H001',
      effDate: '2025-01-01',
      termDate: null,
      insertDate: '2025-01-01',
      insertUser: 'testuser',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigureInterdictionPlacementService],
    });

    service = TestBed.inject(ConfigureInterdictionPlacementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should return table data with total count', (done) => {
      const take = 10;
      const skip = 0;
      const query: InterdictionPlacementQuery = {
        actionFunctionName: 'CPIREJ',
      };

      const mockResponse = {
        Success: true,
        Data: mockData,
        Total: 1,
        Message: 'Success',
      };

      service.getAll(take, skip, query).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].actionFunctionName).toBe('CPIREJ');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });
  });
  describe('getFilterOptions', () => {
    it('should return filter options for a function', (done) => {
      const mockResponse = {
        Success: true,
        data: {
          productCodes: ['E0009', 'FFP'],
          otherProductCodes: ['CRYO', 'PLT'],
          actionCodes: ['R01', 'R02'],
        },
      };

      service.getFilterOptions('CPIREJ').subscribe((options) => {
        expect(options.productCodes.length).toBe(2);
        expect(options.productCodes).toContain('E0009');
        expect(options.otherProductCodes.length).toBe(2);
        expect(options.otherProductCodes).toContain('CRYO');
        expect(options.actionCodes.length).toBe(2);
        expect(options.actionCodes).toContain('R01');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.FILTER_OPTIONS('CPIREJ'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle PascalCase response properties', (done) => {
      const mockResponse = {
        Success: true,
        Data: {
          ProductCodes: ['E0009'],
          OtherProductCodes: ['CRYO'],
          ActionCodes: ['R01'],
        },
      };

      service.getFilterOptions('CPIREJ').subscribe((options) => {
        expect(options.productCodes).toEqual(['E0009']);
        expect(options.otherProductCodes).toEqual(['CRYO']);
        expect(options.actionCodes).toEqual(['R01']);
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.FILTER_OPTIONS('CPIREJ'));
      req.flush(mockResponse);
    });

    it('should return empty arrays when no data', (done) => {
      const mockResponse = {
        Success: true,
      };

      service.getFilterOptions('CPIREJ').subscribe((options) => {
        expect(options.productCodes).toEqual([]);
        expect(options.otherProductCodes).toEqual([]);
        expect(options.actionCodes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.FILTER_OPTIONS('CPIREJ'));
      req.flush(mockResponse);
    });
  });

  describe('Lookup endpoints', () => {
    it('should get action function names', (done) => {
      const mockResponse = {
        Success: true,
        Data: [
          { code: 'CPIREJ', description: 'CPI Rejection' },
          { code: 'CPICOM2', description: 'CPI Component 2' },
        ],
      };

      service.getActionFunctionNames().subscribe((data) => {
        expect(data.length).toBe(2);
        expect(data[0].code).toBe('CPIREJ');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.FUNCTION_NAMES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get action codes', (done) => {
      const mockResponse = {
        Success: true,
        Data: [
          { code: 'R01', description: 'Reject Code 1' },
        ],
      };

      service.getActionCodes().subscribe((data) => {
        expect(data.length).toBe(1);
        expect(data[0].code).toBe('R01');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.ACTION_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get product codes', (done) => {
      const mockResponse = {
        Success: true,
        Data: [
          { productCode: 'E0009', productDesc: 'Product 9' },
        ],
      };

      service.getProductCodes().subscribe((data) => {
        expect(data.length).toBe(1);
        expect(data[0].productCode).toBe('E0009');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get interdiction codes', (done) => {
      const mockResponse = {
        Success: true,
        Data: [
          { interCode: 'H001', interDesc: 'Hold Interdiction', interType: 'H' },
        ],
      };

      service.getInterdictionCodes().subscribe((data) => {
        expect(data.length).toBe(1);
        expect(data[0].interCode).toBe('H001');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.INTERDICTION_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get product types', (done) => {
      const mockResponse = {
        Success: true,
        Data: [
          { productType: 'FFP' },
          { productType: 'CRYO' },
        ],
      };

      service.getProductTypes().subscribe((data) => {
        expect(data.length).toBe(2);
        expect(data[0].productType).toBe('FFP');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('should POST and return response', (done) => {
      const data = {
        chapterId: 'CH01', actionFunctionName: 'CPIREJ', actionType: 'REJECT',
        actionProductCode: 'E0009', interCode: 'H001', effDate: '2025-01-01'
      } as any;
      const mockResponse = { Success: true, Message: 'Created' };

      service.create(data).subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });

    it('should handle error', (done) => {
      service.create({} as any).subscribe({
        error: err => { expect(err.status).toBe(400); done(); }
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.CREATE);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('update', () => {
    it('should PUT and return response', (done) => {
      const data = { interCode: 'H002', effDate: '2025-02-01' } as any;
      const mockResponse = { Success: true, Message: 'Updated' };

      service.update('CH01', 'CPIREJ', 'REJECT', null, 'E0009', data).subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.UPDATE('CH01', 'CPIREJ', 'REJECT', null, 'E0009'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });

    it('should handle error', (done) => {
      service.update('CH01', 'CPIREJ', 'REJECT', 'R01', 'E0009', {} as any).subscribe({
        error: err => { expect(err.status).toBe(500); done(); }
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.UPDATE('CH01', 'CPIREJ', 'REJECT', 'R01', 'E0009'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('delete', () => {
    it('should DELETE and return response', (done) => {
      const mockResponse = { Success: true, Message: 'Deleted' };

      service.delete('CH01', 'CPIREJ', 'REJECT', null, 'E0009').subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.DELETE('CH01', 'CPIREJ', 'REJECT', null, 'E0009'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error', (done) => {
      service.delete('CH01', 'CPIREJ', 'REJECT', 'R01', 'E0009').subscribe({
        error: err => { expect(err.status).toBe(500); done(); }
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.DELETE('CH01', 'CPIREJ', 'REJECT', 'R01', 'E0009'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getActionTypes', () => {
    it('should get action types', (done) => {
      const mockResponse = { Success: true, Data: [{ code: 'REJECT', description: 'Reject' }] };

      service.getActionTypes().subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].code).toBe('REJECT');
        done();
      });

      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.ACTION_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('extractTableData edge cases', () => {
    it('should handle null response', (done) => {
      const query = { actionFunctionName: 'CPIREJ' } as any;
      service.getAll(10, 0, query).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(10, 0));
      req.flush(null);
      done();
    });

    it('should handle PascalCase properties in response data', (done) => {
      const query = { actionFunctionName: 'CPIREJ' } as any;
      const mockResponse = {
        Success: true,
        Data: [{
          ChapterId: 'CH01',
          ActionFunctionName: 'CPIREJ',
          ActionType: 'REJECT',
          ActionProductCode: 'E0009',
          ActionCode: 'R01',
          InterOnCurrentProd: 'Y',
          InterOnOtherProds: 'N',
          InterOnOtherProdTypes: null,
          InterOnUnitLevel: 'Y',
          InterAllProdButCurr: null,
          InterCode: 'H001',
          EffDate: '2025-01-01',
          TermDate: null,
          InsertDate: '2025-01-01',
          InsertUser: 'testuser'
        }],
        Total: 1
      };
      service.getAll(10, 0, query).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].chapterId).toBe('CH01');
        expect(response.data[0].actionCode).toBe('R01');
        expect(response.data[0].interOnCurrentProd).toBe('Y');
        done();
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(10, 0));
      req.flush(mockResponse);
    });

    it('should handle null item in normalizePropertyNames', (done) => {
      const query = { actionFunctionName: 'CPIREJ' } as any;
      service.getAll(10, 0, query).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].chapterId).toBe('');
        expect(response.data[0].actionFunctionName).toBe('');
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(10, 0));
      req.flush({ Data: [null], Total: 1 });
      done();
    });
  });

  describe('getAll error handling', () => {
    it('should handle error', (done) => {
      service.getAll(10, 0, {} as any).subscribe({
        error: err => { expect(err.status).toBe(500); done(); }
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.GET_ALL(10, 0));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('getFilterOptions error handling', () => {
    it('should handle error', (done) => {
      service.getFilterOptions('CPIREJ').subscribe({
        error: err => { expect(err.status).toBe(500); done(); }
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.FILTER_OPTIONS('CPIREJ'));
      req.flush('Error', { status: 500, statusText: 'Error' });
    });
  });

  describe('Lookup endpoints with array responses', () => {
    it('should handle direct array response for getActionFunctionNames', (done) => {
      const directArrayResponse = [
        { code: 'CPIREJ', description: 'CPI Rejection' }
      ];
      service.getActionFunctionNames().subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].code).toBe('CPIREJ');
        done();
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.FUNCTION_NAMES);
      req.flush(directArrayResponse);
    });

    it('should handle PascalCase properties in product codes', (done) => {
      const mockResponse = { Data: [{ ProductCode: 'E0009', ProductDescription: 'Product 9' }] };
      service.getProductCodes().subscribe(data => {
        expect(data[0].productCode).toBe('E0009');
        expect(data[0].productDesc).toBe('Product 9');
        done();
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_CODES);
      req.flush(mockResponse);
    });

    it('should handle PascalCase properties in interdiction codes', (done) => {
      const mockResponse = { Data: [{ InterCode: 'H001', InterDesc: 'Hold', InterType: 'H' }] };
      service.getInterdictionCodes().subscribe(data => {
        expect(data[0].interCode).toBe('H001');
        expect(data[0].interDesc).toBe('Hold');
        expect(data[0].interType).toBe('H');
        done();
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.INTERDICTION_CODES);
      req.flush(mockResponse);
    });

    it('should handle PascalCase properties in product types', (done) => {
      const mockResponse = { Data: [{ ProductType: 'FFP' }] };
      service.getProductTypes().subscribe(data => {
        expect(data[0].productType).toBe('FFP');
        done();
      });
      const req = httpMock.expectOne(API.CONFIGURE_INTERDICTION_PLACEMENT.LOOKUPS.PRODUCT_TYPES);
      req.flush(mockResponse);
    });
  });
});
