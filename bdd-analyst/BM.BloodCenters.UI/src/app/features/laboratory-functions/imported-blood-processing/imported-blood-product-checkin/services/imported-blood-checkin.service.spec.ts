import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportedBloodCheckinService } from './imported-blood-checkin.service';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  CreateBatchInputDto,
  BatchResponse
} from '../models/batch.model';
import {
  CreateComponentDto,
  ComponentResponse
} from '../models/component.model';

describe('ImportedBloodCheckinService', () => {
  let service: ImportedBloodCheckinService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportedBloodCheckinService]
    });
    service = TestBed.inject(ImportedBloodCheckinService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Batch Operations', () => {
    it('should create batch', () => {
      const dto: CreateBatchInputDto = {
        contractId: 'TEST',
        airwayBillNo: 'AWB123',
        shippedDate: '2026-01-15',
        receivedDate: '2026-01-16',
        productType: 'PHER',
        minTemp: 2.0,
        maxTemp: 8.0,
        cartonCount: 5,
        numberOfUnits: 10,
        licenseFlag: 'Y'
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Batch created successfully',
        data: [{
          batchId: '010126-IM0001',
          contractId: 'TEST',
          chapterId: '001',
          airwayBillNo: 'AWB123',
          shippedDate: '2026-01-15T00:00:00Z',
          receivedDate: '2026-01-16T00:00:00Z',
          productType: 'PHER' as const,
          minTemp: 2.0,
          maxTemp: 8.0,
          cartonCount: 5,
          numberOfUnits: 10
        }],
        totalCount: 1
      };

      service.createBatch(dto).subscribe(batch => {
        expect(batch.batchId).toBe('010126-IM0001');
        expect(batch.contractId).toBe('TEST');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.CREATE_BATCH}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should get batch by ID', () => {
      const batchId = '010126-IM0001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Batch retrieved successfully',
        data: [{
          batchId: '010126-IM0001',
          contractId: 'TEST',
          chapterId: '001',
          airwayBillNo: 'AWB123',
          shippedDate: '2026-01-15T00:00:00Z',
          receivedDate: '2026-01-16T00:00:00Z',
          productType: 'PHER' as const,
          minTemp: 2.0,
          maxTemp: 8.0,
          cartonCount: 5,
          numberOfUnits: 10
        }]
      };

      service.getBatch(batchId).subscribe(batch => {
        expect(batch.batchId).toBe(batchId);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_BATCH(batchId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get batches with filters', () => {
      const take = 25;
      const skip = 0;
      const filters = { contractId: 'TEST' };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Batches retrieved successfully',
        data: [],
        totalCount: 0
      };

      service.getBatches(take, skip, filters).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(
        req => req.url === `${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_BATCHES(take, skip)}` &&
               req.params.has('contractId')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('contractId')).toBe('TEST');
      req.flush(mockResponse);
    });
  });

  describe('Component Operations', () => {
    it('should check in component', () => {
      const dto: CreateComponentDto = {
        unitId: 'UNIT001',
        productCode: 'RBC001',
        batchId: '010126-IM0001',
        contractId: 'TEST',
        osUnitId: 'OS001',
        barcodeProtocol: '8'
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Component checked in successfully',
        data: [{
          unitId: 'UNIT001',
          productCode: 'RBC001',
          batchId: '010126-IM0001',
          componentStatus: 'L'
        }]
      };

      service.checkInComponent(dto).subscribe(component => {
        expect(component.unitId).toBe('UNIT001');
        expect(component.componentStatus).toBe('L');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.CHECK_IN_COMPONENT}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should get component by unit ID', () => {
      const unitId = 'UNIT001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Component retrieved successfully',
        data: [{
          unitId: 'UNIT001',
          productCode: 'RBC001',
          batchId: '010126-IM0001',
          componentStatus: 'L'
        }]
      };

      service.getComponent(unitId).subscribe(component => {
        expect(component.unitId).toBe(unitId);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_COMPONENT(unitId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get components by batch with pagination', () => {
      const batchId = '010126-IM0001';
      const take = 25;
      const skip = 0;

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Components retrieved successfully',
        data: [],
        totalCount: 0
      };

      service.getComponentsByBatch(batchId, take, skip).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.GET_COMPONENTS_BY_BATCH(batchId, take, skip)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update component status', () => {
      const unitId = 'UNIT001';
      const status = 'A';

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Component status updated successfully',
        data: [true]
      };

      service.updateComponentStatus(unitId, status).subscribe(result => {
        expect(result).toBeTrue();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.UPDATE_COMPONENT_STATUS(unitId)}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe('"A"');
      req.flush(mockResponse);
    });
  });

  describe('Attribute Operations', () => {
    it('should add component attributes', () => {
      const unitId = 'UNIT001';
      const productCode = 'RBC001';
      const productType = 'PHER';
      const attributes = [{
        unitId: 'UNIT001',
        productCode: 'RBC001',
        attribGroup: 'PH',
        attribCode: '001',
        chapterId: '001'
      }];

      const expectedResult = [{
        unitId: 'UNIT001',
        productCode: 'RBC001',
        attribGroup: 'PH',
        attribCode: '001',
        chapterId: '001',
        attributeGroupDesc: 'Phenotype',
        attributeCodeDesc: 'Antigen 001'
      }];

      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Attributes added successfully',
        data: expectedResult
      };

      service.addComponentAttributes(unitId, productCode, productType, attributes).subscribe(result => {
        expect(result).toEqual(expectedResult);
      });

      const req = httpMock.expectOne(
        req => req.url === `${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.ADD_COMPONENT_ATTRIBUTES(unitId)}` &&
               req.params.get('productCode') === productCode &&
               req.params.get('productType') === productType
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(attributes);
      req.flush(mockResponse);
    });
  });

  describe('Barcode Validation', () => {
    it('should validate unit ID', () => {
      const dto = {
        scannedValue: '=TEST000000012',
        barcodeProtocol: '8' as const,
        scanType: 'Unit' as const
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Unit ID validated successfully',
        data: ['TEST00000001']
      };

      service.validateUnitId(dto).subscribe(result => {
        expect(result).toBe('TEST00000001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.VALIDATE_UNIT_ID}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should validate product code', () => {
      const dto = {
        scannedValue: '=%TEST12345678C',
        barcodeProtocol: '8' as const
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Product code validated successfully',
        data: ['12345678']
      };

      service.validateProductCode(dto).subscribe(result => {
        expect(result).toBe('12345678');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.IMPORTED_BLOOD_CHECKIN.VALIDATE_PRODUCT_CODE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('LOV / Dropdown Operations', () => {
    it('should get contracts', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ contractId: 'C1', contractName: 'Contract 1' }] };
      service.getContracts().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].contractId).toBe('C1');
      });
      const req = httpMock.expectOne(r => r.url.includes('contracts') && !r.url.includes('tests') && r.method === 'GET');
      req.flush(mockResponse);
    });

    it('should get ABO values with params', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: 'O+', description: 'O Positive' }] };
      service.getAboValues('RBC001', 'ISBT').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('abo') && r.params.get('productCode') === 'RBC001' && r.params.get('codeScheme') === 'ISBT');
      req.flush(mockResponse);
    });

    it('should get product types', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ productType: 'PHER', description: 'Pheresis' }] };
      service.getProductTypes().subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('product-type') && r.method === 'GET');
      req.flush(mockResponse);
    });

    it('should get product codes with params', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: 'PC1', description: 'Product 1' }] };
      service.getProductCodes('PHER', 'ISBT').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('product-code') && r.params.get('productType') === 'PHER');
      req.flush(mockResponse);
    });

    it('should get attribute groups', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: 'PH', description: 'Phenotype' }] };
      service.getAttributeGroups().subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('attribute-group') && r.method === 'GET');
      req.flush(mockResponse);
    });

    it('should get attribute codes with params', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ code: '001', description: 'Antigen 001' }] };
      service.getAttributeCodes('PH', 'ISBT').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('attribute-code') && r.params.get('attribGroup') === 'PH');
      req.flush(mockResponse);
    });
  });

  describe('Additional Batch Operations', () => {
    it('should update batch', () => {
      const batchId = '010126-IM0001';
      const dto = { contractId: 'TEST', airwayBillNo: 'AWB456' } as any;
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ batchId, contractId: 'TEST' }] };
      service.updateBatch(batchId, dto).subscribe(result => {
        expect(result.batchId).toBe(batchId);
      });
      const req = httpMock.expectOne(r => r.url.includes(batchId) && r.method === 'PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should get contract tests', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ testCode: 'T1' }] };
      service.getContractTests('C1').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('C1') && r.url.includes('test') && r.method === 'GET');
      req.flush(mockResponse);
    });

    it('should get batches without filters', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [], total: 0 };
      service.getBatches(25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalCount).toBe(0);
      });
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('batches'));
      req.flush(mockResponse);
    });

    it('should get batches with all filters', () => {
      const filters = { contractId: 'C1', fromDate: '2026-01-01', toDate: '2026-01-31', incompleteOnly: true };
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [], totalCount: 0 };
      service.getBatches(25, 0, filters).subscribe(result => {
        expect(result.totalCount).toBe(0);
      });
      const req = httpMock.expectOne(r =>
        r.method === 'GET' &&
        r.params.get('contractId') === 'C1' &&
        r.params.get('fromDate') === '2026-01-01' &&
        r.params.get('toDate') === '2026-01-31' &&
        r.params.get('incompleteOnly') === 'true'
      );
      req.flush(mockResponse);
    });
  });

  describe('Carton Operations', () => {
    it('should add cartons', () => {
      const cartons = [{ cartonId: 'CT1' }] as any;
      const mockResponse = { success: true, statusCode: 201, message: 'OK', data: cartons };
      service.addCartons('B1', 5, cartons).subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('carton') && r.method === 'POST');
      expect(req.request.body).toEqual(cartons);
      req.flush(mockResponse);
    });

    it('should get cartons by batch', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ cartonId: 'CT1' }] };
      service.getCartonsByBatch('B1').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('B1') && r.url.includes('carton') && r.method === 'GET');
      req.flush(mockResponse);
    });
  });

  describe('Additional Validation Operations', () => {
    it('should validate product code field', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [true] };
      service.validateProductCodeField('PC1', 'PHER', 'ISBT').subscribe(result => {
        expect(result).toBeTrue();
      });
      const req = httpMock.expectOne(r => r.url.includes('validate-product-code-field') && r.params.get('productCode') === 'PC1');
      req.flush(mockResponse);
    });

    it('should check duplicate external unit', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [true] };
      service.checkDuplicateExternalUnit('OS1', 'C1').subscribe(result => {
        expect(result).toBeTrue();
      });
      const req = httpMock.expectOne(r => r.url.includes('duplicate-external') && r.params.get('osUnitId') === 'OS1');
      req.flush(mockResponse);
    });

    it('should return false for duplicate check when no data', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: null };
      service.checkDuplicateExternalUnit('OS1', 'C1').subscribe(result => {
        expect(result).toBeFalse();
      });
      const req = httpMock.expectOne(r => r.url.includes('duplicate-external'));
      req.flush(mockResponse);
    });

    it('should check unit contract conflict', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [false] };
      service.checkUnitContractConflict('U1', 'C1').subscribe(result => {
        expect(result).toBeFalse();
      });
      const req = httpMock.expectOne(r => r.url.includes('unit-contract-conflict') && r.params.get('unitId') === 'U1');
      req.flush(mockResponse);
    });
  });

  describe('Component Attribute Operations', () => {
    it('should get component attributes', () => {
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: [{ attribGroup: 'PH', attribCode: '001' }] };
      service.getComponentAttributes('UNIT001', 'RBC001').subscribe(result => {
        expect(result.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url.includes('UNIT001') && r.url.includes('attribute') && r.params.get('productCode') === 'RBC001' && r.method === 'GET');
      req.flush(mockResponse);
    });

    it('should update component attributes', () => {
      const attrs = [{ attribGroup: 'PH', attribCode: '001' }] as any;
      const mockResponse = { success: true, statusCode: 200, message: 'OK', data: true };
      service.updateComponentAttributes('UNIT001', 'RBC001', 'PHER', attrs).subscribe(result => {
        expect(result).toBeTrue();
      });
      const req = httpMock.expectOne(r => r.url.includes('UNIT001') && r.url.includes('attribute') && r.method === 'PUT');
      expect(req.request.body).toEqual(attrs);
      req.flush(mockResponse);
    });
  });
});
