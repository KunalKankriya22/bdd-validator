import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';

import { RegenerateElectronicPlasmaFileService } from './regenerate-electronic-plasma-file.service';
import {
  ApiResponse,
  PendingShipment,
  RegeneratePlasmaFileShipmentDto,
  RegeneratePlasmaFileRequestDto,
  RegeneratePlasmaFileResponseDto,
  PlasmaFileCarrierDto,
} from '../models/regenerate-electronic-plasma-file.model';

describe('RegenerateElectronicPlasmaFileService', () => {
  let service: RegenerateElectronicPlasmaFileService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/plasma-file-regeneration`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegenerateElectronicPlasmaFileService],
    });

    service = TestBed.inject(RegenerateElectronicPlasmaFileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPendingShipments', () => {
    it('should retrieve pending shipments successfully', () => {
      const mockShipments: PendingShipment[] = [
        {
          shipmentNo: 'SHP001',
          consigneeId: 'CONS001',
          consigneeName: 'ABC Plasma Center',
          customerId: 'CUST001',
          shipmentDate: '2024-03-15T00:00:00Z',
          shipmentStatus: 'P',
          shipmentType: 'PLASMA',
          chapterId: 'CH001',
        },
        {
          shipmentNo: 'SHP002',
          consigneeId: 'CONS002',
          consigneeName: 'XYZ Medical',
          customerId: 'CUST002',
          shipmentDate: '2024-03-16T00:00:00Z',
          shipmentStatus: 'P',
          shipmentType: 'PLASMA',
          chapterId: 'CH001',
        },
      ];

      const mockResponse: ApiResponse<PendingShipment[]> = {
        success: true,
        statusCode: 200,
        message: 'Pending shipments retrieved successfully',
        data: mockShipments,
        total: 2,
      };

      service.getPendingShipments().subscribe((shipments) => {
        expect(shipments).toEqual(mockShipments);
        expect(shipments.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/pending-shipments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty pending shipments response', () => {
      const mockResponse: ApiResponse<PendingShipment[]> = {
        success: true,
        statusCode: 200,
        message: 'No pending shipments found',
        data: [],
        total: 0,
      };

      service.getPendingShipments().subscribe((shipments) => {
        expect(shipments).toEqual([]);
        expect(shipments.length).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/pending-shipments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getShipmentDetails', () => {
    it('should retrieve shipment details successfully', () => {
      const shipmentNo = 'SHP001';
      const mockShipment: RegeneratePlasmaFileShipmentDto = {
        shipmentNo: 'SHP001',
        consigneeId: 'CONS001',
        consigneeName: 'ABC Plasma Center',
        customerId: 'CUST001',
        address1: '123 Main Street',
        address2: 'Suite 100',
        address3: null,
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        zone: 'Z1',
        carrier: 'FEDEX',
        carrierDescription: 'Federal Express',
        trackNo: 'TRACK123456',
        flightNo: 'FL789',
        shipmentDate: '2024-03-15T00:00:00Z',
        shipmentStatus: 'P',
        shipmentType: 'PLASMA',
        plasmaFileType: 'XML',
        chapterId: 'CH001',
      };

      const mockResponse: ApiResponse<RegeneratePlasmaFileShipmentDto> = {
        success: true,
        statusCode: 200,
        message: 'Shipment details retrieved successfully',
        data: mockShipment,
      };

      service.getShipmentDetails(shipmentNo).subscribe((shipment) => {
        expect(shipment).toEqual(mockShipment);
        expect(shipment.shipmentNo).toBe('SHP001');
        expect(shipment.consigneeName).toBe('ABC Plasma Center');
      });

      const req = httpMock.expectOne(`${baseUrl}/shipment/${shipmentNo}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in shipment number', () => {
      const shipmentNo = 'SHP/001';

      service.getShipmentDetails(shipmentNo).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/shipment/SHP%2F001`);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {} as RegeneratePlasmaFileShipmentDto,
      });
    });
  });

  describe('getActiveCarriers', () => {
    it('should retrieve active carriers successfully', () => {
      const mockCarriers: PlasmaFileCarrierDto[] = [
        { code: 'FEDEX', codeDesc: 'Federal Express' },
        { code: 'UPS', codeDesc: 'United Parcel Service' },
        { code: 'DHL', codeDesc: 'DHL Express' },
      ];

      const mockResponse: ApiResponse<PlasmaFileCarrierDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Active carriers retrieved successfully',
        data: mockCarriers,
        total: 3,
      };

      service.getActiveCarriers().subscribe((carriers) => {
        expect(carriers).toEqual(mockCarriers);
        expect(carriers.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/carriers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty carriers response', () => {
      const mockResponse: ApiResponse<PlasmaFileCarrierDto[]> = {
        success: true,
        statusCode: 200,
        message: 'No carriers found',
        data: [],
        total: 0,
      };

      service.getActiveCarriers().subscribe((carriers) => {
        expect(carriers).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/carriers`);
      req.flush(mockResponse);
    });
  });

  describe('regeneratePlasmaFile', () => {
    it('should regenerate plasma file successfully (XML)', () => {
      const request: RegeneratePlasmaFileRequestDto = {
        shipmentNo: 'SHP001',
        trackNo: 'TRACK123456',
        flightNo: 'FL789',
        carrier: 'FEDEX',
      };

      const mockResponse: RegeneratePlasmaFileResponseDto = {
        success: true,
        message: 'Electronic Plasma File generated successfully',
        shipmentNo: 'SHP001',
        fileType: 'XML',
        fileName: 'SHP001.xml',
        statusCode: '4016',
      };

      service.regeneratePlasmaFile(request).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
        expect(response.fileType).toBe('XML');
        expect(response.fileName).toBe('SHP001.xml');
      });

      const req = httpMock.expectOne(`${baseUrl}/regenerate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should regenerate plasma file successfully (CSL)', () => {
      const request: RegeneratePlasmaFileRequestDto = {
        shipmentNo: 'SHP002',
        trackNo: 'TRACK789012',
        carrier: 'UPS',
      };

      const mockResponse: RegeneratePlasmaFileResponseDto = {
        success: true,
        message: 'Electronic Plasma File generated successfully',
        shipmentNo: 'SHP002',
        fileType: 'CSL',
        fileName: 'SHP002.csl',
        statusCode: '4016',
      };

      service.regeneratePlasmaFile(request).subscribe((response) => {
        expect(response.fileType).toBe('CSL');
        expect(response.fileName).toBe('SHP002.csl');
      });

      const req = httpMock.expectOne(`${baseUrl}/regenerate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });


    it('should handle business logic errors', () => {
      const request: RegeneratePlasmaFileRequestDto = {
        shipmentNo: 'NOTEXIST',
        trackNo: 'TRACK123456',
      };

      const mockErrorResponse = {
        success: false,
        message: 'Invalid shipment number or shipment is not eligible for regeneration',
        shipmentNo: 'NOTEXIST',
        statusCode: '4306',
      };

      service.regeneratePlasmaFile(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe('4306');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/regenerate`);
      req.flush(mockErrorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });
});
