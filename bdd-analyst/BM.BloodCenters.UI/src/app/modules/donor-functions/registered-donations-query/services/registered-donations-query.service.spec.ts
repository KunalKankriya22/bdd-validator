import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisteredDonationsQueryService } from './registered-donations-query.service';
import { DonationQueryRequest } from '../models/registered-donations-query.model';
import { API } from 'src/app/core/constants/api.constants';

describe('RegisteredDonationsQueryService', () => {
  let service: RegisteredDonationsQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RegisteredDonationsQueryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RegisteredDonationsQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchDonations', () => {
    it('should POST to donation-query endpoint with params', () => {
      const request: DonationQueryRequest = {
        driveDateFrom: '2026-01-01',
        driveDateTo: '2026-01-31',
        driveId: 'D001',
        userId: 'USER1',
        unitId: 'W0352001234',
        sortDirection: 'ASC'
      };

      const mockResponse = {
        success: true,
        data: [
          {
            unitId: 'W0352001234',
            driveId: 'D001',
            collectionDate: '2026-01-15T00:00:00',
            donorId: 'DON001',
            donationType: 'WB',
            procedureCode: 'PROC1',
            insertUser: 'USER1',
            insertDate: '2026-01-15T10:30:00',
            auditFlag: 'Y',
            transactionId: 'TXN001'
          }
        ],
        total: 1
      };

      service.searchDonations(request).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].unitId).toBe('W0352001234');
        expect(response.data[0].driveId).toBe('D001');
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should return empty data array when response data is null', () => {
      const mockResponse = { success: true, data: null, total: 0 };

      service.searchDonations({}).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.totalRecords).toBe(0);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.searchDonations({}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDrivesDropdown', () => {
    it('should GET drives without date params when not provided', () => {
      const mockResponse = {
        success: true,
        data: [
          { driveId: 'D001', driveName: 'Drive One' },
          { driveId: 'D002', driveName: 'Drive Two' }
        ]
      };

      service.getDrivesDropdown().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].driveId).toBe('D001');
        expect(response.data[1].driveName).toBe('Drive Two');
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should include driveDateFrom param when provided', () => {
      const mockResponse = { success: true, data: [] };

      service.getDrivesDropdown('2026-01-01').subscribe();

      const req = httpMock.expectOne(
        r => r.url === API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES
          && r.params.get('driveDateFrom') === '2026-01-01'
      );
      expect(req.request.params.has('driveDateTo')).toBeFalse();
      req.flush(mockResponse);
    });


    it('should not include null date params', () => {
      const mockResponse = { success: true, data: [] };

      service.getDrivesDropdown(null, null).subscribe();

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should handle empty data in response', () => {
      const mockResponse = { success: true, data: null };

      service.getDrivesDropdown().subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getDrivesDropdown().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_DRIVES);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getUsersDropdown', () => {
    it('should GET users without date params when not provided', () => {
      const mockResponse = {
        success: true,
        data: [
          { userId: 'USR1', userName: 'John Doe' },
          { userId: 'USR2', userName: 'Jane Smith' }
        ]
      };

      service.getUsersDropdown().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].userId).toBe('USR1');
        expect(response.data[1].userName).toBe('Jane Smith');
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_USERS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });


    it('should not include null date params', () => {
      const mockResponse = { success: true, data: [] };

      service.getUsersDropdown(null, null).subscribe();

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_USERS);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should handle empty data in response', () => {
      const mockResponse = { success: true, data: null };

      service.getUsersDropdown().subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_USERS);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getUsersDropdown().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_USERS);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getSetsDropdown', () => {
    it('should GET sets without date params when not provided', () => {
      const mockResponse = {
        success: true,
        data: [
          { setId: 'SET001', collectionDate: '2026-01-15' },
          { setId: 'SET002', collectionDate: '2026-01-16' }
        ]
      };

      service.getSetsDropdown().subscribe(response => {
        expect(response.data.length).toBe(2);
        expect(response.data[0].setId).toBe('SET001');
        expect(response.data[1].collectionDate).toBe('2026-01-16');
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should include date params when provided', () => {
      const mockResponse = { success: true, data: [] };

      service.getSetsDropdown('2026-01-01', '2026-01-31').subscribe();

      const req = httpMock.expectOne(
        r => r.url === API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS
          && r.params.get('driveDateFrom') === '2026-01-01'
          && r.params.get('driveDateTo') === '2026-01-31'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not include null date params', () => {
      const mockResponse = { success: true, data: [] };

      service.getSetsDropdown(null, null).subscribe();

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should handle empty data in response', () => {
      const mockResponse = { success: true, data: null };

      service.getSetsDropdown().subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.getSetsDropdown().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_SETS);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getLovLimit', () => {

    it('should default to 21 when item is missing', () => {
      const mockResponse = { success: true };

      service.getLovLimit().subscribe(value => {
        expect(value).toBe(21);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_LOV_LIMIT);
      req.flush(mockResponse);
    });

    it('should return actual value when item has value', () => {
      const mockResponse = { item: 30 };

      service.getLovLimit().subscribe(value => {
        expect(value).toBe(30);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_LOV_LIMIT);
      req.flush(mockResponse);
    });

    it('should return 21 on HTTP error', () => {
      service.getLovLimit().subscribe(value => {
        expect(value).toBe(21);
      });

      const req = httpMock.expectOne(API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_LOV_LIMIT);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('validateUnitId', () => {
    it('should POST unit ID with validateFfValue', () => {
      const mockResponse = {
        success: true,
        message: 'Valid',
        errorCode: null,
        item: {
          parsedUnitId: 'W0352001234',
          checkDigit: '5',
          codeScheme: 'I',
          manualUnitId: 'W0352001234',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I'
        }
      };

      service.validateUnitId('W0352001234', 'DONOR').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.item?.parsedUnitId).toBe('W0352001234');
        expect(response.item?.barcodeType).toBe('CODE128');
        expect(response.item?.entryMode).toBe('S');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ unitId: 'W0352001234', validateFfValue: 'DONOR' });
      req.flush(mockResponse);
    });


    it('should handle validation failure response', () => {
      const mockResponse = {
        success: false,
        message: 'Unit ID not found',
        errorCode: 'UNIT_NOT_FOUND',
        item: null
      };

      service.validateUnitId('UNKNOWN', 'DONOR').subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('Unit ID not found');
        expect(response.item).toBeNull();
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT);
      req.flush(mockResponse);
    });

    it('should propagate HTTP errors', () => {
      service.validateUnitId('TEST', 'DONOR').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(422);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT);
      req.flush('Unprocessable', { status: 422, statusText: 'Unprocessable Entity' });
    });
  });

  describe('getPhlebotomyDetails', () => {
    const transactionId = 'TXN001';

    it('should GET phlebotomy details with correct URL', () => {
      const mockResponse = { success: true, item: { armUsed: 'R', driveId: 'DRV001' } };

      service.getPhlebotomyDetails(transactionId).subscribe();

      const req = httpMock.expectOne(
        API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return the item when response is successful', () => {
      const mockItem = { armUsed: 'R', driveId: 'DRV001' };
      const mockResponse = { success: true, item: mockItem };

      service.getPhlebotomyDetails(transactionId).subscribe(result => {
        expect(result).toEqual(mockItem as any);
      });

      const req = httpMock.expectOne(
        API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId)
      );
      req.flush(mockResponse);
    });

    it('should throw error when response.success is false', () => {
      const mockResponse = { success: false, message: 'Not found' };

      service.getPhlebotomyDetails(transactionId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Not found');
        }
      });

      const req = httpMock.expectOne(
        API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId)
      );
      req.flush(mockResponse);
    });

    it('should throw error when response.item is null', () => {
      const mockResponse = { success: true, item: null };

      service.getPhlebotomyDetails(transactionId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(
        API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId)
      );
      req.flush(mockResponse);
    });

    it('should use fallback error message when response.message is empty', () => {
      const mockResponse = { success: false };

      service.getPhlebotomyDetails(transactionId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Phlebotomy details not found');
        }
      });

      const req = httpMock.expectOne(
        API.DONOR_FUNCTIONS.REGISTERED_DONATIONS_QUERY_PHLEBOTOMY_DETAILS(transactionId)
      );
      req.flush(mockResponse);
    });
  });
});
