import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CloseBoxService } from './close-box.service';
import { ApiResponse, AvailableBoxDto, BoxScanResultDto, CloseBoxDto, CloseBoxResultDto } from '../models/close-box.model';
import { environment } from '../../../../../environments/environment';

describe('CloseBoxService', () => {
  let service: CloseBoxService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/distributions/close-box`;

  const mockBoxDetails: CloseBoxDto = {
    boxId: 'BOX001',
    boxType: 'ST',
    boxTypeDescription: 'Standard',
    packedDate: '2026-05-30T10:00:00Z',
    packedBy: 'USER01',
    insertDate: '2026-05-30T10:00:00Z',
    boxStatus: 'OP',
    boxStatusDescription: 'Open',
    products: [
      {
        unitId: 'UNIT001',
        productCode: 'RBC',
        bloodType: 'O+',
        aboDescription: 'O Positive',
        expirationDate: '2026-06-29T00:00:00Z',
        collectionDate: '2026-05-29T00:00:00Z',
        checkDigit: '12',
        pickSlipId: 'PS001',
        itemNo: 1,
        productType: 'RBC'
      }
    ],
    productCount: 1
  };

  const mockCloseResult: CloseBoxResultDto = {
    boxId: 'BOX001',
    status: 'CL',
    message: 'Box BOX001 closed successfully with 1 products',
    productsProcessed: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CloseBoxService]
    });

    service = TestBed.inject(CloseBoxService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('getBoxDetails', () => {
    it('should retrieve box details successfully', (done) => {
      const boxId = 'BOX001';
      const response: ApiResponse<CloseBoxDto> = {
        success: true,
        statusCode: 200,
        message: 'Box details retrieved successfully',
        data: mockBoxDetails
      };

      service.getBoxDetails(boxId).subscribe({
        next: (data) => {
          expect(data).toEqual(mockBoxDetails);
          expect(data.boxId).toBe('BOX001');
          expect(data.boxStatus).toBe('OP');
          expect(data.products.length).toBe(1);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/${boxId}`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

    it('should handle box not found error', (done) => {
      const boxId = 'NOTFOUND';
      const errorResponse: ApiResponse<CloseBoxDto> = {
        success: false,
        statusCode: 404,
        message: 'Box not found',
        data: null
      };

      service.getBoxDetails(boxId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Box not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${boxId}`);
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });

    it('should reject empty box ID', (done) => {
      service.getBoxDetails('').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Box ID is required');
          done();
        }
      });

      httpMock.expectNone(`${baseUrl}/`);
    });

    it('should reject box ID longer than 10 characters', (done) => {
      const longBoxId = '12345678901';

      service.getBoxDetails(longBoxId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Box ID must not exceed 10 characters');
          done();
        }
      });

      httpMock.expectNone(`${baseUrl}/${longBoxId}`);
    });

    it('should trim whitespace from box ID', (done) => {
      const boxId = '  BOX001  ';
      const response: ApiResponse<CloseBoxDto> = {
        success: true,
        statusCode: 200,
        message: 'Box details retrieved successfully',
        data: mockBoxDetails
      };

      service.getBoxDetails(boxId).subscribe({
        next: (data) => {
          expect(data).toEqual(mockBoxDetails);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/BOX001`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });

  });

  describe('closeBox', () => {
    it('should close box successfully', (done) => {
      const boxId = 'BOX001';
      const response: ApiResponse<CloseBoxResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Box closed successfully',
        data: mockCloseResult
      };

      service.closeBox(boxId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCloseResult);
          expect(result.boxId).toBe('BOX001');
          expect(result.status).toBe('CL');
          expect(result.productsProcessed).toBe(1);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/${boxId}/close`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(response);
    });



    it('should handle box already closed error', (done) => {
      const boxId = 'BOX003';
      const errorResponse: ApiResponse<CloseBoxResultDto> = {
        success: false,
        statusCode: 400,
        message: 'Box has already been closed',
        data: null,
        errorResponse: {
          error: 'Box has already been closed'
        }
      };

      service.closeBox(boxId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Box has already been closed');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${boxId}/close`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should reject empty box ID', (done) => {
      service.closeBox('').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Box ID is required');
          done();
        }
      });

      httpMock.expectNone(`${baseUrl}//close`);
    });

    it('should trim whitespace from box ID', (done) => {
      const boxId = '  BOX001  ';
      const response: ApiResponse<CloseBoxResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Box closed successfully',
        data: mockCloseResult
      };

      service.closeBox(boxId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockCloseResult);
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/BOX001/close`);
      expect(req.request.method).toBe('PUT');
      req.flush(response);
    });

    it('should handle generic HTTP error', (done) => {
      const boxId = 'BOX001';
      const errorResponse = {
        message: 'Network error'
      };

      service.closeBox(boxId).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Network error');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${boxId}/close`);
      req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAvailableBoxes', () => {
    it('should retrieve available boxes successfully', (done) => {
      const mockBoxes: AvailableBoxDto[] = [
        { boxId: 'BOX001', orderNo: 'ORD01', orderClass: 'R', estArrivalTime: '2026-06-01T15:30:00Z', consigneeName: 'Hospital A' },
        { boxId: 'BOX002', orderNo: 'ORD02', orderClass: 'S', estArrivalTime: null, consigneeName: 'Hospital B' }
      ];
      const response: ApiResponse<AvailableBoxDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Available boxes retrieved successfully',
        data: mockBoxes
      };

      service.getAvailableBoxes().subscribe({
        next: (boxes) => {
          expect(boxes.length).toBe(2);
          expect(boxes[0].boxId).toBe('BOX001');
          expect(boxes[1].consigneeName).toBe('Hospital B');
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/available`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });



  });

  describe('validateBoxScan', () => {
    it('should validate box scan successfully', (done) => {
      const scanValue = 'A1BOX001TEST2';
      const mockResult: BoxScanResultDto = { boxId: 'BOX001TEST', isValid: true };
      const response: ApiResponse<BoxScanResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Box scan validated successfully',
        data: mockResult
      };

      service.validateBoxScan(scanValue).subscribe({
        next: (result) => {
          expect(result.boxId).toBe('BOX001TEST');
          expect(result.isValid).toBeTrue();
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-scan`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ scanValue: scanValue.trim() });
      req.flush(response);
    });

    it('should handle invalid scan result', (done) => {
      const scanValue = 'A1INVALID0XX2';
      const mockResult: BoxScanResultDto = { boxId: 'INVALID0XX', isValid: false };
      const response: ApiResponse<BoxScanResultDto> = {
        success: true,
        statusCode: 200,
        message: 'Box is not in open status',
        data: mockResult
      };

      service.validateBoxScan(scanValue).subscribe({
        next: (result) => {
          expect(result.isValid).toBeFalse();
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/validate-scan`);
      req.flush(response);
    });

    it('should reject empty scan value', (done) => {
      service.validateBoxScan('').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBe('Scan value is required');
          done();
        }
      });

      httpMock.expectNone(`${baseUrl}/validate-scan`);
    });

  });
});
