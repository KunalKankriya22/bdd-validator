import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonorDecisionCodesService } from './donor-decision-codes.service';
import { API } from 'src/app/core/constants/api.constants';

describe('DonorDecisionCodesService', () => {
  let service: DonorDecisionCodesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorDecisionCodesService]
    });
    service = TestBed.inject(DonorDecisionCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDonorDecisionCodes', () => {
    it('should fetch donor decision codes with pagination', () => {
      const mockResponse = {
        data: [
          {
            barCodeValue: 'BC001',
            donorDecisionCode: 'Y',
            displayCode: 'Yes',
            effDate: new Date('2024-01-01'),
            termDate: null,
            lastModifiedDate: new Date('2024-06-15'),
            programId: 'PROG01'
          }
        ],
        total: 1,
        success: true
      };

      const params = { searchKeyword: 'BC001' };

      service.getDonorDecisionCodes(10, 0, params).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].barCodeValue).toBe('BC001');
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/v1/application-admin/donor-decision-codes/10/0')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });

    it('should handle errors when fetching donor decision codes', () => {
      const params = {};

      service.getDonorDecisionCodes(10, 0, params).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/v1/application-admin/donor-decision-codes/10/0')
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getBarcodes', () => {
    it('should fetch barcodes for dropdown', () => {
      const mockResponse = {
        data: [
          { barCodeValue: 'BC001' },
          { barCodeValue: 'BC002' }
        ],
        success: true
      };

      service.getBarcodes().subscribe(barcodes => {
        expect(barcodes.length).toBe(2);
        expect(barcodes[0]).toBe('BC001');
        expect(barcodes[1]).toBe('BC002');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODES_BARCODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle errors when fetching barcodes', () => {
      service.getBarcodes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODES_BARCODES);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDonorDecisionCodeOptions', () => {
    it('should fetch donor decision code options', () => {
      const mockResponse = {
        data: [
          { donorDecisionCode: 'Y', description: 'Yes (OK for Transfusion)' },
          { donorDecisionCode: 'N', description: 'No (Not OK for Transfusion)' }
        ],
        success: true
      };

      service.getDonorDecisionCodeOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].donorDecisionCode).toBe('Y');
        expect(options[0].description).toBe('Yes (OK for Transfusion)');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODES_DISTINCT);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDonorDecisionCodeByCode', () => {
    it('should fetch description by code', () => {
      const mockResponse = {
        item: {
          donorDecisionCode: 'Y',
          description: 'Yes (OK for Transfusion)'
        },
        success: true
      };

      service.getDonorDecisionCodeByCode('Y').subscribe(result => {
        expect(result.donorDecisionCode).toBe('Y');
        expect(result.description).toBe('Yes (OK for Transfusion)');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_DESCRIPTION('Y'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when description not found', () => {
      const mockResponse = {
        item: null,
        success: false
      };

      service.getDonorDecisionCodeByCode('X').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Description not found');
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_DESCRIPTION('X'));
      req.flush(mockResponse);
    });
  });

  describe('getDonorDecisionCodeByBarcode', () => {
    it('should fetch donor decision code by barcode', () => {
      const mockResponse = {
        item: {
          barCodeValue: 'BC001',
          donorDecisionCode: 'Y',
          displayCode: 'Yes',
          effDate: new Date('2024-01-01'),
          termDate: null,
          lastModifiedDate: new Date('2024-06-15')
        },
        success: true
      };

      service.getDonorDecisionCodeByBarcode('BC001').subscribe(result => {
        expect(result.barCodeValue).toBe('BC001');
        expect(result.donorDecisionCode).toBe('Y');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_BY_BARCODE('BC001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw error when record not found', () => {
      const mockResponse = {
        item: null,
        success: false
      };

      service.getDonorDecisionCodeByBarcode('BC999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Donor decision code record not found');
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_BY_BARCODE('BC999'));
      req.flush(mockResponse);
    });
  });

  describe('addDonorDecisionCode', () => {
    it('should add new donor decision code', () => {
      const dto = {
        barCodeValue: 'BC003',
        donorDecisionCode: 'Y',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Donor decision code added successfully'
      };

      service.addDonorDecisionCode(dto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Donor decision code added successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.CREATE_DONOR_DECISION_CODE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should handle errors when adding donor decision code', () => {
      const dto = {
        barCodeValue: 'BC003',
        donorDecisionCode: 'Y',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: null
      };

      service.addDonorDecisionCode(dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.CREATE_DONOR_DECISION_CODE);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateDonorDecisionCode', () => {
    it('should update existing donor decision code', () => {
      const barCodeValue = 'BC001';
      const dto = {
        donorDecisionCode: 'N',
        originalDonorDecisionCode: 'Y',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: '2024-12-31T00:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: 'Donor decision code updated successfully'
      };

      service.updateDonorDecisionCode(barCodeValue, dto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Donor decision code updated successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.UPDATE_DONOR_DECISION_CODE(barCodeValue));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should handle errors when updating donor decision code', () => {
      const barCodeValue = 'BC001';
      const dto = {
        donorDecisionCode: 'Y',
        originalDonorDecisionCode: 'N',
        effDate: '2024-01-01T00:00:00.000Z',
        termDate: null
      };

      service.updateDonorDecisionCode(barCodeValue, dto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.UPDATE_DONOR_DECISION_CODE(barCodeValue));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
