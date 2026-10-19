import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HlaRbcRequestQueryService } from './hla-rbc-request-query.service';
import { environment } from 'src/environments/environment';
import {
  RequestListItem,
  RequestDetails,
  MatchedDonor,
  MatchedUnit,
  ApiResponse,
  CreateCallListRequest,
  CreateCallListResult,
  PatientDetailResponse
} from '../models/hla-rbc-request-query.model';

describe('HlaRbcRequestQueryService', () => {
  let service: HlaRbcRequestQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HlaRbcRequestQueryService]
    });
    service = TestBed.inject(HlaRbcRequestQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==========================================================================
  // getRequestList
  // ==========================================================================

  describe('getRequestList', () => {
    it('should fetch request list successfully', () => {
      const mockResponse: ApiResponse<RequestListItem> = {
        success: true,
        message: 'Requests retrieved successfully',
        statusCode: 200,
        total: 2,
        data: [
          {
            requestId: 'REQ001',
            patientName: 'Smith, John',
            patientId: 'PAT123',
            hospitalName: 'General Hospital',
            status: 'OPEN',
            insertDate: '2026-05-15 10:30:00',
            requestType: 'HLA'
          },
          {
            requestId: 'REQ002',
            patientName: 'Doe, Jane',
            patientId: 'PAT456',
            hospitalName: 'City Medical',
            status: 'OPEN',
            insertDate: '2026-05-14 14:20:00',
            requestType: 'RBC'
          }
        ]
      };

      service.getRequestList({ status: 'OPEN' }).subscribe(requests => {
        expect(requests.length).toBe(2);
        expect(requests[0].requestId).toBe('REQ001');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('Status')).toBe('OPEN');
      req.flush(mockResponse);
    });

    it('should pass all query params when provided', () => {
      const mockResponse: ApiResponse<RequestListItem> = {
        success: true, message: '', statusCode: 200, data: []
      };

      service.getRequestList({
        searchText: 'Smith',
        status: 'OPEN',
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        sortBy: 'insertDate',
        sortOrder: 'DESC'
      }).subscribe(requests => {
        expect(requests).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query'));
      expect(req.request.params.get('SearchText')).toBe('Smith');
      expect(req.request.params.get('Status')).toBe('OPEN');
      expect(req.request.params.get('FromDate')).toBe('2026-01-01');
      expect(req.request.params.get('ToDate')).toBe('2026-12-31');
      expect(req.request.params.get('SortBy')).toBe('insertDate');
      expect(req.request.params.get('SortOrder')).toBe('DESC');
      req.flush(mockResponse);
    });

    it('should return empty array when response has no data', () => {
      const mockResponse: ApiResponse<RequestListItem> = {
        success: false, message: 'No data', statusCode: 200
      };

      service.getRequestList().subscribe(requests => {
        expect(requests).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query'));
      req.flush(mockResponse);
    });

    it('should handle error on request list failure', () => {
      service.getRequestList().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // getRequestDetails
  // ==========================================================================

  describe('getRequestDetails', () => {
    it('should fetch request details successfully', () => {
      const mockResponse: ApiResponse<RequestDetails> = {
        success: true,
        message: 'Request retrieved successfully',
        statusCode: 200,
        data: [{
          requestId: 'REQ001',
          patientName: 'Smith, John',
          patientId: 'PAT123',
          hospital: 'General Hospital',
          requestType: 'HLA PHENO',
          donorCount: 5,
          unitCount: 12,
          lastSearchDateTime: '2026-05-15 09:30:00',
          expectedTransfusionDates: [
            { date: '05-20-2026', quantity: 2 }
          ],
          unitRequest: 'Y',
          exactMatch: 'N',
          status: 'OPEN',
          hlaPheno: '1,19,5,40',
          hlaAnti: null,
          rbcAnti: 'K',
          rbcPheno: 'K1,Negative'
        }]
      };

      service.getRequestDetails('REQ001').subscribe(details => {
        expect(details).toBeTruthy();
        expect(details?.requestId).toBe('REQ001');
        expect(details?.donorCount).toBe(5);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when response data is empty', () => {
      const mockResponse: ApiResponse<RequestDetails> = {
        success: true, message: '', statusCode: 200, data: []
      };

      service.getRequestDetails('REQ001').subscribe(details => {
        expect(details).toBeNull();
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001'));
      req.flush(mockResponse);
    });

    it('should throw error for empty request ID', (done) => {
      service.getRequestDetails('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Request ID is required');
          done();
        }
      });
    });

    it('should handle HTTP error', () => {
      service.getRequestDetails('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ==========================================================================
  // getMatchedDonors
  // ==========================================================================

  describe('getMatchedDonors', () => {
    it('should fetch matched donors successfully', () => {
      const mockResponse: ApiResponse<MatchedDonor> = {
        success: true,
        message: 'Donors retrieved successfully',
        statusCode: 200,
        total: 2,
        data: [
          {
            donorId: 'D001',
            lastName: 'Johnson',
            firstName: 'Mary',
            gender: 'F',
            grade: 'A',
            gradeLevel: 5,
            pattern: 'A*01:01,A*02:01',
            bloodType: 'O+',
            antigens: 'C+c+E-e+K-',
            cmvStatus: 'NEG',
            selected: false
          }
        ]
      };

      service.getMatchedDonors('REQ001', { grades: 'A,B' }).subscribe(donors => {
        expect(donors.length).toBe(1);
        expect(donors[0].donorId).toBe('D001');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/donors'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.grades).toBe('A,B');
      req.flush(mockResponse);
    });

    it('should send empty object when no filters provided', () => {
      const mockResponse: ApiResponse<MatchedDonor> = {
        success: true, message: '', statusCode: 200, data: []
      };

      service.getMatchedDonors('REQ001').subscribe(donors => {
        expect(donors).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/donors'));
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should throw error for empty request ID', (done) => {
      service.getMatchedDonors('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Request ID is required');
          done();
        }
      });
    });

    it('should handle HTTP error', () => {
      service.getMatchedDonors('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/donors'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // getMatchedUnits
  // ==========================================================================

  describe('getMatchedUnits', () => {
    it('should fetch matched units successfully', () => {
      const mockResponse: ApiResponse<MatchedUnit> = {
        success: true,
        message: 'Units retrieved successfully',
        statusCode: 200,
        total: 1,
        data: [
          {
            unitId: 'U12345678',
            collectionDate: '05-10-2026',
            donorId: 'D001',
            grade: 'A',
            gradeLevel: 5,
            match: 'EXACT',
            bloodType: 'O+',
            antigenString: 'C+c+E-e+K-',
            warehouseCode: 'WH01',
            inventoryClass: 'RED',
            productType: 'RBC',
            cmvStatus: 'NEG'
          }
        ]
      };

      service.getMatchedUnits('REQ001').subscribe(units => {
        expect(units.length).toBe(1);
        expect(units[0].unitId).toBe('U12345678');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/units'));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send filters when provided and return empty array on no data', () => {
      const mockResponse: ApiResponse<MatchedUnit> = {
        success: true, message: '', statusCode: 200, data: []
      };
      const filters = { grades: 'A', sortBy: 'grade' as const, sortOrder: 'ASC' as const };

      service.getMatchedUnits('REQ001', filters).subscribe(units => {
        expect(units).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/units'));
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });

    it('should throw error for empty request ID', (done) => {
      service.getMatchedUnits('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Request ID is required');
          done();
        }
      });
    });

    it('should handle HTTP error', () => {
      service.getMatchedUnits('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/units'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // printDonors
  // ==========================================================================

  describe('printDonors', () => {
    it('should post print donors request successfully', () => {
      const mockResponse: ApiResponse<string> = {
        success: true, message: 'Print job queued', statusCode: 200, data: ['JOB123']
      };

      service.printDonors('REQ001').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(['JOB123']);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/print-donors'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      service.printDonors('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/print-donors'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // printUnits
  // ==========================================================================

  describe('printUnits', () => {
    it('should post print units request successfully', () => {
      const mockResponse: ApiResponse<string> = {
        success: true, message: 'Print job queued', statusCode: 200, data: ['JOB456']
      };

      service.printUnits('REQ001').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(['JOB456']);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/print-units'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      service.printUnits('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/print-units'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // createCallList
  // ==========================================================================

  describe('createCallList', () => {
    const payload: CreateCallListRequest = {
      listName: 'Test Call List',
      listStatus: 'ACTIVE',
      shelfLife: '2026-12-31',
      comments: 'Test comments',
      selectedDonorIds: ['D001', 'D002']
    };

    it('should create call list successfully', () => {
      const mockResult: CreateCallListResult = {
        listId: 'CL001', listSeq: 1, donorsAdded: 2
      };
      const mockResponse: ApiResponse<CreateCallListResult> = {
        success: true, message: 'Call list created', statusCode: 200,
        data: [mockResult]
      };

      service.createCallList('REQ001', payload).subscribe(result => {
        expect(result.listId).toBe('CL001');
        expect(result.donorsAdded).toBe(2);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/create-call-list'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ApiResponse<CreateCallListResult> = {
        success: false, message: 'Validation failed', statusCode: 400
      };

      service.createCallList('REQ001', payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Validation failed');
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/create-call-list'));
      req.flush(mockResponse);
    });

    it('should throw with default message when response has no message', () => {
      const mockResponse = { success: false, message: '', statusCode: 400 };

      service.createCallList('REQ001', payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to create call list');
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/create-call-list'));
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      service.createCallList('REQ001', payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/create-call-list'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // getPatientDetail
  // ==========================================================================

  describe('getPatientDetail', () => {
    it('should fetch patient detail successfully', () => {
      const mockPatient: PatientDetailResponse = {
        patId: 'PAT123',
        patLastName: 'Smith',
        patFirstName: 'John',
        sex: 'M',
        dob: '1980-01-15',
        aboType: 'O+',
        status: 'ACTIVE',
        comments: null,
        hlaAntigens: { a1: '1', a2: '2', b1: '5', b2: '40' },
        hlaAntibodies: [{ locus: 'A', epitopeId: '01' }],
        rbcAntibodies: [{ testId: 'K' }],
        rbcAntigens: [{ testId: 'K1', resultCode: 'NEG' }]
      };
      const mockResponse = { success: true, item: mockPatient };

      service.getPatientDetail('PAT123').subscribe(patient => {
        expect(patient).toBeTruthy();
        expect(patient?.patId).toBe('PAT123');
        expect(patient?.patLastName).toBe('Smith');
        expect(patient?.hlaAntigens?.a1).toBe('1');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/enter-hla-rbc-request/patient/PAT123'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when response is unsuccessful', () => {
      const mockResponse = { success: false };

      service.getPatientDetail('PAT123').subscribe(patient => {
        expect(patient).toBeNull();
      });

      const req = httpMock.expectOne((request) => request.url.includes('/enter-hla-rbc-request/patient/PAT123'));
      req.flush(mockResponse);
    });

    it('should throw error for empty patient ID', (done) => {
      service.getPatientDetail('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Patient ID is required');
          done();
        }
      });
    });

    it('should handle HTTP error', () => {
      service.getPatientDetail('PAT123').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/enter-hla-rbc-request/patient/PAT123'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================================================
  // closeRequest
  // ==========================================================================

  describe('closeRequest', () => {
    it('should close request successfully', () => {
      const mockResponse: ApiResponse<boolean> = {
        success: true, message: 'Request closed', statusCode: 200, data: [true]
      };

      service.closeRequest('REQ001').subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/close'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should return false when response has no data', () => {
      const mockResponse: ApiResponse<boolean> = {
        success: true, message: '', statusCode: 200, data: []
      };

      service.closeRequest('REQ001').subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/close'));
      req.flush(mockResponse);
    });

    it('should throw error for empty request ID', (done) => {
      service.closeRequest('').subscribe({
        error: (error) => {
          expect(error.message).toContain('Request ID is required');
          done();
        }
      });
    });

    it('should handle HTTP error', () => {
      service.closeRequest('REQ001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/hla-rbc-request-query/REQ001/close'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
