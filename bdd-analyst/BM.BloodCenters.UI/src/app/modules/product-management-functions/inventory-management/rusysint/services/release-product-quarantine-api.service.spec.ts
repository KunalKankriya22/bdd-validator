import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReleaseProductQuarantineApiService } from './release-product-quarantine-api.service';
import { environment } from 'src/environments/environment';
import {
  QuarantineType,
  QuarantineProduct,
  QuarantineReason,
  StorageLocation,
  QuarantineProductQueryDto,
  ReleaseProductRequestDto,
  ApiResponse
} from '../models/release-product-quarantine.model';

describe('ReleaseProductQuarantineApiService', () => {
  let service: ReleaseProductQuarantineApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/release-product-quarantine`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReleaseProductQuarantineApiService]
    });

    service = TestBed.inject(ReleaseProductQuarantineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getQuarantineTypes', () => {
    it('should retrieve quarantine types successfully', (done) => {
      const mockTypes: QuarantineType[] = [
        { code: 'QU', description: 'Quarantine' },
        { code: 'RT', description: 'Returns' }
      ];

      const mockResponse: ApiResponse<QuarantineType> = {
        success: true,
        statusCode: 200,
        data: mockTypes,
        totalCount: 2
      };

      service.getQuarantineTypes().subscribe({
        next: (types) => {
          expect(types).toEqual(mockTypes);
          expect(types.length).toBe(2);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/quarantine-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getQuarantineProducts', () => {
    it('should retrieve quarantine products with pagination', (done) => {
      const query: QuarantineProductQueryDto = {
        take: 25,
        skip: 0,
        quarantineType: 'QU',
        sortColumn: 'UnitId',
        sortOrder: 'ASC'
      };

      const mockProducts: QuarantineProduct[] = [
        {
          unitId: 'C1234567',
          productCode: 'RBC',
          aliquot: '00',
          chapterId: 'CH01',
          collDate: '2024-04-25T00:00:00Z',
          expDate: '2024-06-25T00:00:00Z',
          bloodType: 'O',
          inventoryClass: 'QU',
          reasonCode: 'R01',
          reasonDesc: 'Quality Control Hold',
          locationId: 'W01-D01-R01-T01',
          productDesc: 'Red Blood Cells',
          aboDesc: 'O Positive'
        }
      ];

      const mockResponse: ApiResponse<QuarantineProduct> = {
        success: true,
        statusCode: 200,
        data: mockProducts,
        totalCount: 1
      };

      service.getQuarantineProducts(query).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockProducts);
          expect(result.total).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });
  });

  describe('getQuarantineProduct', () => {
    it('should retrieve single product by ID', (done) => {
      const unitId = 'C1234567';
      const productCode = 'RBC';
      const aliquot = '00';

      const mockProduct: QuarantineProduct = {
        unitId,
        productCode,
        aliquot,
        chapterId: 'CH01',
        collDate: '2024-04-25T00:00:00Z',
        expDate: '2024-06-25T00:00:00Z',
        bloodType: 'O',
        inventoryClass: 'QU',
        reasonCode: 'R01',
        reasonDesc: 'Quality Control Hold',
        locationId: 'W01-D01-R01-T01',
        productDesc: 'Red Blood Cells',
        aboDesc: 'O Positive'
      };

      const mockResponse: ApiResponse<QuarantineProduct> = {
        success: true,
        statusCode: 200,
        data: [mockProduct],
        totalCount: 1
      };

      service.getQuarantineProduct(unitId, productCode, aliquot).subscribe({
        next: (product) => {
          expect(product).toEqual(mockProduct);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/products/${unitId}/${productCode}/${aliquot}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getQuarantineReasons', () => {
    it('should retrieve reasons for a product', (done) => {
      const unitId = 'C1234567';
      const productCode = 'RBC';
      const aliquot = '00';

      const mockReasons: QuarantineReason[] = [
        {
          unitId,
          productCode,
          aliquot,
          chapterId: 'CH01',
          reasonCode: 'R01',
          reasonDesc: 'Quality Control Hold',
          createdDate: '2024-05-01T10:30:00Z'
        }
      ];

      const mockResponse: ApiResponse<QuarantineReason> = {
        success: true,
        statusCode: 200,
        data: mockReasons,
        totalCount: 1
      };

      service.getQuarantineReasons(unitId, productCode, aliquot).subscribe({
        next: (reasons) => {
          expect(reasons).toEqual(mockReasons);
          expect(reasons.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/products/${unitId}/${productCode}/${aliquot}/reasons`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getStorageLocations', () => {
    it('should retrieve storage locations with required warehouseId', (done) => {
      const warehouseId = 'W01';

      const mockLocations: StorageLocation[] = [
        {
          warehouseId: 'W01',
          deviceType: 'FR',
          deviceNumber: 'D01',
          rackNumber: 'R01',
          shelfNumber: '01',
          trayId: 'T01',
          locationId: 'W01-D01-R01-T01',
          warehouseDesc: 'Main Warehouse',
          deviceDesc: 'Freezer 1',
          trayDesc: 'Tray 1',
          trayCapacity: 24,
          currentCount: 10,
          productType: 'RBC',
          bloodType: 'O',
          storageClass: 'A',
          mixAbo: 'N',
          mixProduct: 'N'
        }
      ];

      const mockResponse: ApiResponse<StorageLocation> = {
        success: true,
        statusCode: 200,
        data: mockLocations,
        totalCount: 1
      };

      service.getStorageLocations(warehouseId).subscribe({
        next: (locations) => {
          expect(locations).toEqual(mockLocations);
          done();
        }
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/locations` && request.params.get('warehouseId') === warehouseId;
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include optional productType and bloodType params', (done) => {
      const warehouseId = 'W01';
      const productType = 'RBC';
      const bloodType = 'O';

      service.getStorageLocations(warehouseId, productType, bloodType).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${baseUrl}/locations` &&
               request.params.get('warehouseId') === warehouseId &&
               request.params.get('productType') === productType &&
               request.params.get('bloodType') === bloodType;
      });
      req.flush({ success: true, statusCode: 200, data: [] });
    });
  });

  describe('releaseProduct', () => {
    it('should release product with restock', (done) => {
      const request: ReleaseProductRequestDto = {
        quarantineType: 'QU',
        unitId: 'C1234567',
        productCode: 'RBC',
        aliquot: '00',
        restockFlag: 'Y',
        locationId: 'W01-D01-R01-T01',
        warehouseId: 'W01',
        deviceNumber: 'D01',
        rackNumber: 'R01',
        trayId: 'T01'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Product restocked successfully',
        data: [
          {
            unitId: 'C1234567',
            productCode: 'RBC',
            aliquot: '00'
          }
        ]
      };

      service.releaseProduct(request).subscribe({
        next: (response) => {
          expect(response.unitId).toBe('C1234567');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/release`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });


    it('should handle validation error - expired product', (done) => {
      const request: ReleaseProductRequestDto = {
        quarantineType: 'QU',
        unitId: 'C1234567',
        productCode: 'RBC',
        aliquot: '00',
        restockFlag: 'Y',
        locationId: 'W01-D01-R01-T01',
        warehouseId: 'W01',
        deviceNumber: 'D01',
        rackNumber: 'R01',
        trayId: 'T01'
      };

      service.releaseProduct(request).subscribe({
        error: (error) => {
          expect(error.error.message).toContain('expired');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/release`);
      req.flush(
        {
          success: false,
          statusCode: 400,
          message: 'Product is expired and cannot be restocked. Please reject with a reject code.'
        },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('removeQuarantineReason', () => {

    it('should return false when reason not found', (done) => {
      const mockResponse: any = {
        success: false,
        statusCode: 404,
        message: 'Quarantine reason not found or already removed',
        item: false
      };

      service.removeQuarantineReason('C1234567', 'RBC', '00', 'R99').subscribe({
        next: (result) => {
          expect(result).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/products/C1234567/RBC/00/reasons/R99`);
      req.flush(mockResponse);
    });
  });
});
