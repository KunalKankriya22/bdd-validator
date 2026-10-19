import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VistaInterfaceStatusService } from './vista-interface-status.service';
import {
  VistaInterfaceStatusQueryDto,
  UpdateVistaInterfaceStatusDto,
  VistaInterfaceStatusListResponse,
  VistaInterfaceStatusSingleResponse,
  VistaInterfaceStatusUpdateResponse
} from '../models/vista-interface-status.model';
import { environment } from 'src/environments/environment';
import { ApiService } from '@shared/services/api.service';

describe('VistaInterfaceStatusService', () => {
  let service: VistaInterfaceStatusService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/vista-interface-status`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VistaInterfaceStatusService, ApiService]
    });

    service = TestBed.inject(VistaInterfaceStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should fetch paginated list with filters', () => {
      const take = 25;
      const skip = 0;
      const filters: VistaInterfaceStatusQueryDto = {
        driveFromDate: '2025-01-01',
        driveToDate: '2025-01-31',
        status: 'P'
      };

      const mockResponse: VistaInterfaceStatusListResponse = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [
          {
            transactionId: 'TRX001',
            driveDate: '2025-01-15T00:00:00',
            driveId: 'DRV001',
            donorId: 'DON123',
            name: 'Doe, John',
            donationType: 'WBL',
            procedureCode: '450',
            idpProcStatus: 'P',
            statusDescription: 'Processed',
            lkupUpdtBy: 'USER01',
            lkupUpdtTime: '2025-01-15T14:30:00',
            hlthUpdtBy: null,
            hlthUpdtTime: null,
            phyUpdtBy: null,
            phyUpdtTime: null,
            phelobUpdtBy: null,
            phelobUpdtTime: null,
            printDate: null
          }
        ],
        total: 1
      };

      service.getAll(take, skip, filters).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/${take}/${skip}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

  });

  describe('getById', () => {
    it('should fetch single record by transaction ID', () => {
      const transactionId = 'TRX001';
      const mockData = {
        transactionId: 'TRX001',
        driveDate: '2025-01-15T00:00:00',
        driveId: 'DRV001',
        donorId: 'DON123',
        name: 'Doe, John',
        donationType: 'WBL',
        procedureCode: '450',
        idpProcStatus: 'P',
        statusDescription: 'Processed',
        lkupUpdtBy: 'USER01',
        lkupUpdtTime: '2025-01-15T14:30:00',
        hlthUpdtBy: null,
        hlthUpdtTime: null,
        phyUpdtBy: null,
        phyUpdtTime: null,
        phelobUpdtBy: null,
        phelobUpdtTime: null,
        printDate: null
      };

      const mockResponse: VistaInterfaceStatusSingleResponse = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: mockData
      };

      service.getById(transactionId).subscribe(data => {
        expect(data).toEqual(mockData);
        expect(data.transactionId).toBe(transactionId);
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(transactionId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 not found', () => {
      const transactionId = 'NOTEXIST';

      service.getById(transactionId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(transactionId)}`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateStatus', () => {
    it('should update status to Cancel', () => {
      const transactionId = 'TRX001';
      const updateDto: UpdateVistaInterfaceStatusDto = {
        idpProcStatus: 'X'
      };

      const mockResponse: VistaInterfaceStatusUpdateResponse = {
        success: true,
        message: 'Vista Interface Status updated successfully.',
        statusCode: 200,
        data: {
          transactionId: 'TRX001',
          idpProcStatus: 'X'
        }
      };

      service.updateStatus(transactionId, updateDto).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.idpProcStatus).toBe('X');
      });

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(transactionId)}/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'X' });
      req.flush(mockResponse);
    });

    it('should handle error 23009 - cannot change R to P', () => {
      const transactionId = 'TRX002';
      const updateDto: UpdateVistaInterfaceStatusDto = {
        idpProcStatus: 'P'
      };

      service.updateStatus(transactionId, updateDto).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.error.errorCode).toBe('23009');
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/${encodeURIComponent(transactionId)}/status`);
      req.flush(
        {
          success: false,
          statusCode: 400,
          errorCode: '23009',
          errorResponse: {
            errorCode: '23009',
            error: 'Cannot change status from Registered to Processed'
          }
        },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple records', (done) => {
      const updates = new Map<string, 'P' | 'X'>([
        ['TRX001', 'X'],
        ['TRX002', 'X']
      ]);

      const mockResponse: VistaInterfaceStatusUpdateResponse = {
        success: true,
        message: 'Vista Interface Status updated successfully.',
        statusCode: 200,
        data: {
          transactionId: 'TRX001',
          idpProcStatus: 'X'
        }
      };

      service.bulkUpdateStatus(updates).subscribe(results => {
        expect(results.length).toBe(2);
        done();
      });

      const req1 = httpMock.expectOne(`${baseUrl}/TRX001/status`);
      req1.flush(mockResponse);

      const req2 = httpMock.expectOne(`${baseUrl}/TRX002/status`);
      req2.flush({...mockResponse, data: {...mockResponse.data, transactionId: 'TRX002'}});
    });

    it('should handle empty updates map', (done) => {
      const updates = new Map<string, 'P' | 'X'>();

      service.bulkUpdateStatus(updates).subscribe(results => {
        expect(results.length).toBe(0);
        done();
      });
    });
  });

  describe('getDrivesLov', () => {
    it('should fetch drives with date range', () => {
      const mockResponse = {
        data: [
          { driveId: 'DRV001', sponsorName: 'Test Sponsor', driveDate: '2025-01-15' },
          { driveId: 'DRV002', sponsorName: 'Another Sponsor', driveDate: '2025-01-16' }
        ]
      };

      service.getDrivesLov('2025-01-01', '2025-01-31').subscribe(drives => {
        expect(drives.length).toBe(2);
        expect(drives[0].driveId).toBe('DRV001');
        expect(drives[0].sponsorName).toBe('Test Sponsor');
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/drives-lov` && r.params.get('fromDate') === '2025-01-01'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty drives response', () => {
      service.getDrivesLov('2025-01-01', '2025-01-31').subscribe(drives => {
        expect(drives.length).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/drives-lov`);
      req.flush({ data: [] });
    });
  });

  describe('getStatusOptions', () => {
    it('should return all status options', () => {
      const options = service.getStatusOptions();

      expect(options.length).toBe(9);
      expect(options).toEqual([
        { value: '', label: 'All' },
        { value: 'P', label: 'Pending' },
        { value: 'C', label: 'Completed' },
        { value: 'R', label: 'Registered' },
        { value: 'W', label: 'Working' },
        { value: 'S', label: 'Sent' },
        { value: 'ER', label: 'Error in Receiving' },
        { value: 'NR', label: 'Never Received' },
        { value: 'X', label: 'Cancel' }
      ]);
    });
  });

  describe('getEditableStatusOptions', () => {
    it('should return current status and X for Registered status', () => {
      const options = service.getEditableStatusOptions('R');

      expect(options.length).toBe(2);
      expect(options[0]).toEqual({ value: 'R', label: 'Registered' });
      expect(options[1]).toEqual({ value: 'X', label: 'Cancel' });
    });

    it('should return P and X for Cancel status', () => {
      const options = service.getEditableStatusOptions('X');

      expect(options.length).toBe(2);
      expect(options).toEqual([
        { value: 'P', label: 'Pending' },
        { value: 'X', label: 'Cancel' }
      ]);
    });

    it('should return P and X for other statuses', () => {
      const options = service.getEditableStatusOptions('P');

      expect(options.length).toBe(2);
      expect(options).toEqual([
        { value: 'P', label: 'Pending' },
        { value: 'X', label: 'Cancel' }
      ]);
    });

    it('should return P and X for null status', () => {
      const options = service.getEditableStatusOptions(null);

      expect(options.length).toBe(2);
      expect(options).toEqual([
        { value: 'P', label: 'Pending' },
        { value: 'X', label: 'Cancel' }
      ]);
    });
  });

  describe('isValidStatusTransition', () => {
    it('should return false for R to P transition', () => {
      expect(service.isValidStatusTransition('R', 'P')).toBeFalse();
    });

    it('should return true for R to X transition', () => {
      expect(service.isValidStatusTransition('R', 'X')).toBeTrue();
    });

    it('should return true for P to X transition', () => {
      expect(service.isValidStatusTransition('P', 'X')).toBeTrue();
    });

    it('should return true for X to P transition', () => {
      expect(service.isValidStatusTransition('X', 'P')).toBeTrue();
    });

    it('should return true for null current status', () => {
      expect(service.isValidStatusTransition(null, 'P')).toBeTrue();
    });
  });
});
