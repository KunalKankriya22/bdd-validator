import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReleaseQuarantineApiService } from './release-quarantine-api.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  ReleaseType,
  UnitGridItem,
  UnitReason,
  RejectCode,
  StorageDevice,
  StorageRack,
  StorageTray,
  SaveReleaseRequest,
  SaveReleaseResponse,
  ProductCodeLovItem,
  RemoveReasonsRequest,
  RemoveReasonsResponse,
  ApiResponse,
  ApiSingleResponse
} from '../models/release-quarantine.model';

describe('ReleaseQuarantineApiService', () => {
  let service: ReleaseQuarantineApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.RELEASE_PRODUCT_QUARANTINE.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReleaseQuarantineApiService]
    });
    service = TestBed.inject(ReleaseQuarantineApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getReleaseTypes', () => {
    it('should fetch release types successfully', () => {
      const mockReleaseTypes: ReleaseType[] = [
        { code: 'IT', description: 'Internal Quarantines' },
        { code: 'RT', description: 'Returns' }
      ];
      const mockResponse: ApiResponse<ReleaseType> = {
        success: true,
        statusCode: 200,
        data: mockReleaseTypes
      };

      service.getReleaseTypes().subscribe({
        next: (types) => {
          expect(types).toEqual(mockReleaseTypes);
          expect(types.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_RELEASE_TYPES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getUnits', () => {
    it('should fetch units successfully', () => {
      const mockUnits: UnitGridItem[] = [
        {
          unitId: 'W123456789',
          displayUnitId: null,
          productCode: 'RBC001',
          aliquot: '01',
          aboRh: 'A+',
          expirationDate: '2026-06-15T00:00:00',
          locationId: 'LOC01',
          status: 'I',
          isExpired: 'N',
          collDate: '2026-05-15T00:00:00',
          bloodType: 'A+',
          productType: 'RBC',
          inventoryClass: 'REGULAR',
          osokFlag: null
        }
      ];
      const mockResponse: ApiResponse<UnitGridItem> = {
        success: true,
        statusCode: 200,
        data: mockUnits,
        total: 1
      };

      service.getUnits('IT').subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockUnits);
          expect(result.total).toBe(1);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNITS('IT')}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should calculate total from data length when total is not provided', () => {
      const mockUnits: UnitGridItem[] = [
        {
          unitId: 'W123456789',
          displayUnitId: null,
          productCode: 'RBC001',
          aliquot: '01',
          aboRh: 'A+',
          expirationDate: '2026-06-15T00:00:00',
          locationId: 'LOC01',
          status: 'I',
          isExpired: 'N',
          collDate: '2026-05-15T00:00:00',
          bloodType: 'A+',
          productType: 'RBC',
          inventoryClass: 'REGULAR',
          osokFlag: null
        }
      ];
      const mockResponse: ApiResponse<UnitGridItem> = {
        success: true,
        statusCode: 200,
        data: mockUnits
      };

      service.getUnits('IT').subscribe({
        next: (result) => {
          expect(result.total).toBe(1);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNITS('IT')}`);
      req.flush(mockResponse);
    });


  });

  describe('getUnitReasons', () => {
    it('should fetch unit reasons successfully', () => {
      const mockReasons: UnitReason[] = [
        { reasonCode: 'QR001', reasonDescription: 'Failed Quality Control' },
        { reasonCode: 'QR002', reasonDescription: 'Labeling Error' }
      ];
      const mockResponse: ApiResponse<UnitReason> = {
        success: true,
        statusCode: 200,
        data: mockReasons
      };

      service.getUnitReasons('IT', 'W123456789', 'RBC001', '01').subscribe({
        next: (reasons) => {
          expect(reasons).toEqual(mockReasons);
          expect(reasons.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNIT_REASONS}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('releaseType')).toBe('IT');
      expect(req.request.params.get('unitId')).toBe('W123456789');
      expect(req.request.params.get('productCode')).toBe('RBC001');
      expect(req.request.params.get('aliquot')).toBe('01');
      req.flush(mockResponse);
    });


  });

  describe('getRejectCodes', () => {
    it('should fetch reject codes successfully', () => {
      const mockRejectCodes: RejectCode[] = [
        { code: 'REJ01', description: 'Damaged' },
        { code: 'REJ02', description: 'Expired' }
      ];
      const mockResponse: ApiResponse<RejectCode> = {
        success: true,
        statusCode: 200,
        data: mockRejectCodes
      };

      service.getRejectCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockRejectCodes);
          expect(codes.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_REJECT_CODES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('getStorageDevices', () => {
    it('should fetch storage devices successfully', () => {
      const mockDevices: StorageDevice[] = [
        { deviceType: 'F', deviceNumber: '01', description: 'Freezer 01' },
        { deviceType: 'R', deviceNumber: '02', description: 'Refrigerator 02' }
      ];
      const mockResponse: ApiResponse<StorageDevice> = {
        success: true,
        statusCode: 200,
        data: mockDevices
      };

      service.getStorageDevices('RBC').subscribe({
        next: (devices) => {
          expect(devices).toEqual(mockDevices);
          expect(devices.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_DEVICES}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('productType')).toBe('RBC');
      req.flush(mockResponse);
    });


  });

  describe('getStorageRacks', () => {
    it('should fetch storage racks successfully', () => {
      const mockRacks: StorageRack[] = [
        { rackNumber: 'R01', description: 'Rack 01' },
        { rackNumber: 'R02', description: 'Rack 02' }
      ];
      const mockResponse: ApiResponse<StorageRack> = {
        success: true,
        statusCode: 200,
        data: mockRacks
      };

      service.getStorageRacks('F', '01', 'RBC', 'A+', 'REGULAR').subscribe({
        next: (racks) => {
          expect(racks).toEqual(mockRacks);
          expect(racks.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_RACKS}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('deviceType')).toBe('F');
      expect(req.request.params.get('deviceNumber')).toBe('01');
      expect(req.request.params.get('productType')).toBe('RBC');
      expect(req.request.params.get('bloodType')).toBe('A+');
      expect(req.request.params.get('storageClass')).toBe('REGULAR');
      req.flush(mockResponse);
    });


  });

  describe('getStorageTrays', () => {
    it('should fetch storage trays successfully', () => {
      const mockTrays: StorageTray[] = [
        { trayNumber: 'T01', shelfNumber: 'S01', description: 'Tray 01', isFull: 'N' },
        { trayNumber: 'T02', shelfNumber: 'S02', description: 'Tray 02', isFull: 'Y' }
      ];
      const mockResponse: ApiResponse<StorageTray> = {
        success: true,
        statusCode: 200,
        data: mockTrays
      };

      service.getStorageTrays('F', '01', 'R01', 'RBC', 'A+', 'REGULAR').subscribe({
        next: (trays) => {
          expect(trays).toEqual(mockTrays);
          expect(trays.length).toBe(2);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_TRAYS}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('deviceType')).toBe('F');
      expect(req.request.params.get('deviceNumber')).toBe('01');
      expect(req.request.params.get('rackNumber')).toBe('R01');
      expect(req.request.params.get('productType')).toBe('RBC');
      expect(req.request.params.get('bloodType')).toBe('A+');
      expect(req.request.params.get('storageClass')).toBe('REGULAR');
      req.flush(mockResponse);
    });


  });

  describe('save', () => {
    it('should save restock successfully', () => {
      const request: SaveReleaseRequest = {
        releaseType: 'IT',
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        selectedReasonCodes: ['QR001', 'QR002'],
        restock: true,
        deviceType: 'F',
        deviceNumber: '01',
        rackNumber: 'R01',
        trayNumber: 'T01',
        overrides: []
      };

      const mockSaveResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'I',
        locationId: 'LOC01',
        warnings: []
      };

      const mockResponse: ApiSingleResponse<SaveReleaseResponse> = {
        success: true,
        statusCode: 200,
        item: mockSaveResponse
      };

      service.save(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockSaveResponse);
          expect(response.status).toBe('OK');
          expect(response.unitStatus).toBe('I');
          expect(response.locationId).toBe('LOC01');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should save reject successfully', () => {
      const request: SaveReleaseRequest = {
        releaseType: 'IT',
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        selectedReasonCodes: ['QR001'],
        restock: false,
        rejectCode: 'REJ01',
        overrides: []
      };

      const mockSaveResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'D',
        warnings: []
      };

      const mockResponse: ApiSingleResponse<SaveReleaseResponse> = {
        success: true,
        statusCode: 200,
        item: mockSaveResponse
      };

      service.save(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockSaveResponse);
          expect(response.status).toBe('OK');
          expect(response.unitStatus).toBe('D');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return warnings when status is WARNING', () => {
      const request: SaveReleaseRequest = {
        releaseType: 'IT',
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        selectedReasonCodes: ['QR001'],
        restock: true,
        deviceType: 'F',
        deviceNumber: '01',
        rackNumber: 'R01',
        trayNumber: 'T01',
        overrides: []
      };

      const mockSaveResponse: SaveReleaseResponse = {
        status: 'WARNING',
        warnings: [
          { code: 'TRAY_FULL', message: 'Tray is full' }
        ]
      };

      const mockResponse: ApiSingleResponse<SaveReleaseResponse> = {
        success: true,
        statusCode: 200,
        item: mockSaveResponse
      };

      service.save(request).subscribe({
        next: (response) => {
          expect(response.status).toBe('WARNING');
          expect(response.warnings.length).toBe(1);
          expect(response.warnings[0].code).toBe('TRAY_FULL');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      req.flush(mockResponse);
    });

    it('should handle error when no response data returned', () => {
      const request: SaveReleaseRequest = {
        releaseType: 'IT',
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        selectedReasonCodes: ['QR001'],
        restock: false,
        rejectCode: 'REJ01',
        overrides: []
      };

      const mockResponse: ApiSingleResponse<SaveReleaseResponse> = {
        success: true,
        statusCode: 200
      };

      service.save(request).subscribe({
        next: fail,
        error: (error) => {
          expect(error.message).toContain('No response data returned from save operation');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      req.flush(mockResponse);
    });

    it('should save with overrides on retry', () => {
      const request: SaveReleaseRequest = {
        releaseType: 'IT',
        unitId: 'W123456789',
        productCode: 'RBC001',
        aliquot: '01',
        selectedReasonCodes: ['QR001'],
        restock: true,
        deviceType: 'F',
        deviceNumber: '01',
        rackNumber: 'R01',
        trayNumber: 'T01',
        overrides: ['TRAY_FULL', '3722']
      };

      const mockSaveResponse: SaveReleaseResponse = {
        status: 'OK',
        unitStatus: 'I',
        locationId: 'LOC01',
        warnings: []
      };

      const mockResponse: ApiSingleResponse<SaveReleaseResponse> = {
        success: true,
        statusCode: 200,
        item: mockSaveResponse
      };

      service.save(request).subscribe({
        next: (response) => {
          expect(response.status).toBe('OK');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      expect(req.request.body.overrides).toEqual(['TRAY_FULL', '3722']);
      req.flush(mockResponse);
    });

  });

  describe('getProductCodes', () => {
    it('should fetch product codes successfully', () => {
      const mockProductCodes: ProductCodeLovItem[] = [
        { productCode: 'RBC001', productDesc: 'Red Blood Cells' }
      ];
      const mockResponse: ApiResponse<ProductCodeLovItem> = {
        success: true,
        statusCode: 200,
        data: mockProductCodes
      };

      service.getProductCodes('W123', 'IT', 'I').subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockProductCodes);
          expect(codes.length).toBe(1);
          expect(codes[0].productCode).toBe('RBC001');
          expect(codes[0].productDesc).toBe('Red Blood Cells');
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_PRODUCT_CODES('W123')}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('releaseType')).toBe('IT');
      expect(req.request.params.get('codeScheme')).toBe('I');
      req.flush(mockResponse);
    });

    it('should handle getProductCodes error', () => {
      service.getProductCodes('W123', 'IT', 'I').subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_PRODUCT_CODES('W123')}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('removeReasons', () => {
    it('should remove reasons successfully', () => {
      const request: RemoveReasonsRequest = {
        unitId: 'W123',
        productCode: 'RBC001',
        aliquot: '01',
        reasonCodes: ['QR001']
      };

      const mockRemoveResponse: RemoveReasonsResponse = {
        removedCount: 1,
        remainingReasons: [{ reasonCode: 'QR002', reasonDescription: 'Labeling Error' }]
      };

      const mockResponse: ApiSingleResponse<RemoveReasonsResponse> = {
        success: true,
        statusCode: 200,
        item: mockRemoveResponse
      };

      service.removeReasons(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockRemoveResponse);
          expect(result.removedCount).toBe(1);
          expect(result.remainingReasons.length).toBe(1);
          expect(result.remainingReasons[0].reasonCode).toBe('QR002');
          expect(result.remainingReasons[0].reasonDescription).toBe('Labeling Error');
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REMOVE_REASONS}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle removeReasons error', () => {
      const request: RemoveReasonsRequest = {
        unitId: 'W123',
        productCode: 'RBC001',
        aliquot: '01',
        reasonCodes: ['QR001']
      };

      service.removeReasons(request).subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REMOVE_REASONS}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Null/Empty data fallback', () => {
    it('should return empty array when getReleaseTypes data is null', () => {
      service.getReleaseTypes().subscribe({
        next: (types) => {
          expect(types).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_RELEASE_TYPES}`);
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getUnits data is null', () => {
      service.getUnits('IT').subscribe({
        next: (response) => {
          expect(response.data).toEqual([]);
          expect(response.total).toBe(0);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNITS('IT')}`);
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getUnitReasons data is null', () => {
      service.getUnitReasons('IT', 'W123', 'RBC001', '01').subscribe({
        next: (reasons) => {
          expect(reasons).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNIT_REASONS}`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getRejectCodes data is null', () => {
      service.getRejectCodes().subscribe({
        next: (codes) => {
          expect(codes).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_REJECT_CODES}`);
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getStorageDevices data is null', () => {
      service.getStorageDevices('RBC').subscribe({
        next: (devices) => {
          expect(devices).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_DEVICES}`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getStorageRacks data is null', () => {
      service.getStorageRacks('F', '01', 'RBC', 'A+', 'REGULAR').subscribe({
        next: (racks) => {
          expect(racks).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_RACKS}`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getStorageTrays data is null', () => {
      service.getStorageTrays('F', '01', 'R01', 'RBC', 'A+', 'REGULAR').subscribe({
        next: (trays) => {
          expect(trays).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_STORAGE_TRAYS}`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should return empty array when getProductCodes data is null', () => {
      service.getProductCodes('W123', 'IT', 'I').subscribe({
        next: (codes) => {
          expect(codes).toEqual([]);
        },
        error: fail
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_PRODUCT_CODES('W123')}`
      );
      req.flush({ success: true, statusCode: 200, data: null });
    });

    it('should throw error when save response has no item', () => {
      const request = {
        releaseType: 'IT', unitId: 'W123', productCode: 'RBC001', aliquot: '01',
        selectedReasonCodes: ['QR001'], restock: true, overrides: []
      };

      service.save(request as any).subscribe({
        next: fail,
        error: (error) => {
          expect(error.message).toContain('No response data');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.SAVE}`);
      req.flush({ success: true, statusCode: 200 });
    });

    it('should throw error when removeReasons response has no item', () => {
      const request = { unitId: 'W123', productCode: 'RBC001', aliquot: '01', reasonCodes: ['QR001'] };

      service.removeReasons(request).subscribe({
        next: fail,
        error: (error) => {
          expect(error.message).toContain('No response data');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.REMOVE_REASONS}`);
      req.flush({ success: true, statusCode: 200 });
    });
  });

  describe('Error Handling', () => {
    it('should handle getReleaseTypes HTTP error', () => {
      service.getReleaseTypes().subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_RELEASE_TYPES}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle getUnits HTTP error', () => {
      service.getUnits('IT').subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNITS('IT')}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle getUnitReasons HTTP error', () => {
      service.getUnitReasons('IT', 'W123456789', 'RBC001', '01').subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_UNIT_REASONS}`
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle getRejectCodes HTTP error', () => {
      service.getRejectCodes().subscribe({
        next: fail,
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}${API.RELEASE_PRODUCT_QUARANTINE.GET_REJECT_CODES}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
