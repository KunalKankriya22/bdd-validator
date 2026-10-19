import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EquipmentApiService } from './equipment-api.service';
import {
  EquipmentDto,
  CreateEquipmentRequestDto,
  UpdateEquipmentRequestDto,
  EquipmentQueryDto,
  ApiResponse
} from '../models/equipment.models';
import { environment } from 'src/environments/environment';

describe('EquipmentApiService', () => {
  let service: EquipmentApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/equipment`;

  const mockEquipmentDto: EquipmentDto = {
    equipType: 'SCAN',
    equipId: '0001',
    equipReference: 'EQ-000001',
    instId: 'INST01',
    chapterId: 'CH001',
    serialNumber: 'SN123456',
    location: 'LAB-A',
    status: 'IN',
    inServiceDate: '2024-01-15T00:00:00Z',
    outServiceDate: null,
    manufacturer: 'Manufacturer A',
    osokFlag: 'Y',
    firstProductionDate: '2024-01-15T00:00:00Z',
    lastProductionDate: null,
    serviceContact: null,
    servicePhone: null,
    serviceStartDate: null,
    serviceEndDate: null,
    lastModifiedDate: null,
    modifiedBy: null,
    auditKey: null,
    programId: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EquipmentApiService]
    });

    service = TestBed.inject(EquipmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should retrieve paginated equipment list', () => {
      const take = 10;
      const skip = 0;
      const query: EquipmentQueryDto = {
        equipType: 'SCAN',
        status: 'IN'
      };
      const mockResponse: ApiResponse<EquipmentDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: [mockEquipmentDto],
        total: 1
      };

      service.getAll(take, skip, query).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data!.length).toBe(1);
        expect(response.data![0]).toEqual(mockEquipmentDto);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should handle empty query object', () => {
      const take = 10;
      const skip = 0;

      service.getAll(take, skip).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.body).toEqual({});
      req.flush({ success: true, statusCode: 200, message: '', data: [], total: 0 });
    });
  });

  describe('getByKey', () => {
    it('should retrieve equipment by composite key', () => {
      const equipType = 'SCAN';
      const equipId = '0001';
      const equipReference = 'EQ-000001';
      const mockResponse: ApiResponse<EquipmentDto> = {
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        data: mockEquipmentDto
      };

      service.getByKey(equipType, equipId, equipReference).subscribe(response => {
        expect(response.data).toEqual(mockEquipmentDto);
      });

      const req = httpMock.expectOne(`${baseUrl}/SCAN/0001/EQ-000001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in key segments', () => {
      service.getByKey('SCAN', '0001', 'EQ-000/001').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/SCAN/0001/EQ-000%2F001`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: mockEquipmentDto });
    });
  });

  describe('create', () => {
    it('should create new equipment', () => {
      const createRequest: CreateEquipmentRequestDto = {
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        serialNumber: 'SN123456',
        manufacturer: 'Manufacturer A',
        osokFlag: 'Y',
        firstProductionDate: '2024-01-15'
      };
      const mockResponse: ApiResponse<{ equipReference: string }> = {
        success: true,
        statusCode: 201,
        message: 'Equipment created successfully',
        data: { equipReference: 'EQ-000042' }
      };

      service.create(createRequest).subscribe(result => {
        expect(result.data!.equipReference).toBe('EQ-000042');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update existing equipment', () => {
      const equipType = 'SCAN';
      const equipId = '0001';
      const equipReference = 'EQ-000001';
      const updateRequest: UpdateEquipmentRequestDto = {
        equipType: 'SCAN',
        equipId: '0001',
        status: 'IN',
        serialNumber: 'SN123456-UPDATED',
        manufacturer: 'Manufacturer B',
        osokFlag: 'N',
        firstProductionDate: '2024-01-15',
        lastProductionDate: '2024-05-26'
      };
      const mockResponse: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Equipment updated successfully'
      };

      service.update(equipType, equipId, equipReference, updateRequest).subscribe(result => {
        expect(result.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/SCAN/0001/EQ-000001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });
  });
  describe('Dropdown/Lookup Methods', () => {
    it('should return equipment types from API', () => {
      const mockApiResponse: ApiResponse<{ code: string; description: string }[]> = {
        success: true,
        statusCode: 200,
        message: '',
        data: [{ code: 'SCAN', description: 'Scanner' }]
      };

      service.getEquipmentTypes().subscribe(options => {
        expect(options.length).toBe(1);
        expect(options[0].value).toBe('SCAN');
        expect(options[0].label).toBe('Scanner');
        expect(options[0].description).toBe('Scanner');
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should return empty array when equipment types API returns empty data', () => {
      service.getEquipmentTypes().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      req.flush({ success: true, statusCode: 200, message: '', data: [] });
    });

    it('should return empty array when equipment types API errors', () => {
      service.getEquipmentTypes().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return equipment IDs from API', () => {
      const mockApiResponse: ApiResponse<{ equipId: string }[]> = {
        success: true,
        statusCode: 200,
        message: '',
        data: [{ equipId: '0001' }, { equipId: '0002' }]
      };

      service.getEquipmentIds('SCAN').subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].value).toBe('0001');
        expect(options[0].label).toBe('0001');
        expect(options[1].value).toBe('0002');
      });

      const req = httpMock.expectOne(`${baseUrl}/ids/SCAN`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should return empty array when equipment IDs API returns empty data', () => {
      service.getEquipmentIds('SCAN').subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/ids/SCAN`);
      req.flush({ success: true, statusCode: 200, message: '', data: [] });
    });

    it('should return empty array when equipment IDs API errors', () => {
      service.getEquipmentIds('SCAN').subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/ids/SCAN`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should encode special characters in equipType for IDs endpoint', () => {
      service.getEquipmentIds('SCAN/TYPE').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/ids/SCAN%2FTYPE`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, statusCode: 200, message: '', data: [] });
    });

    it('should return locations', () => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: [{ code: 'LABA', description: 'Laboratory A' }]
      };

      service.getLocations().subscribe(options => {
        expect(options.length).toBe(1);
        expect(options[0].value).toBe('LABA');
        expect(options[0].label).toBe('LABA');
        expect(options[0].description).toBe('Laboratory A');
      });

      const req = httpMock.expectOne(`${baseUrl}/locations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when locations API errors', () => {
      service.getLocations().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/locations`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return statuses', () => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: [{ code: 'IN', description: 'In Service' }]
      };

      service.getStatuses().subscribe(options => {
        expect(options.length).toBe(1);
        expect(options[0].value).toBe('IN');
        expect(options[0].label).toBe('IN');
        expect(options[0].description).toBe('In Service');
      });

      const req = httpMock.expectOne(`${baseUrl}/statuses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when statuses API errors', () => {
      service.getStatuses().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/statuses`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
