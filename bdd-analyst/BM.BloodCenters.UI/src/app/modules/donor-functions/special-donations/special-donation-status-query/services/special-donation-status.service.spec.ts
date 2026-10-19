import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpecialDonationStatusService } from './special-donation-status.service';
import { API } from '@core/constants/api.constants';
import type {
  ApiResponse,
  SpecialDonationStatusQueryDto,
  SpecialDonationStatusResponseDto,
  SpecialUnitDto,
  ShipLocationLookupDto,
  PatientLookupDto,
  UnitIdLookupDto,
  SurgIdLookupDto,
} from '../models/special-donation-status.models';

describe('SpecialDonationStatusService', () => {
  let service: SpecialDonationStatusService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpecialDonationStatusService],
    });
    service = TestBed.inject(SpecialDonationStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('querySpecialDonationStatus', () => {
    it('should query special donation status with criteria', () => {
      const mockQuery: SpecialDonationStatusQueryDto = {
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        shipId: 'GUARD',
        patId: '123',
        shipStatus: 'A',
      };

      const mockResponse: SpecialDonationStatusResponseDto = {
        specialUnits: [
          {
            sequence: 1,
            shipId: 'GUARD',
            shipDesc: 'Guard Station',
            unitId: 'DN00017241',
            displayUnitId: 'DN00017241-5',
            patientName: 'Smith, John',
            collDate: '2025-01-11',
            donationType: 'AU',
            patId: '123',
            surgId: 'SURG020737',
            surgDate: '12-09-2002',
            surgDay: 'MON',
            dateNeededBy: '2002-12-09',
            seqNo: 1,
          },
        ],
        totalRecordsFound: 1,
      };

      const apiResponse: ApiResponse<SpecialDonationStatusResponseDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [mockResponse],
      };

      service.querySpecialDonationStatus(mockQuery).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.specialUnits.length).toBe(1);
        expect(response.totalRecordsFound).toBe(1);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.QUERY);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockQuery);
      req.flush(apiResponse);
    });

    it('should handle empty response data', () => {
      const mockQuery: SpecialDonationStatusQueryDto = {
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
      };

      const apiResponse: ApiResponse<SpecialDonationStatusResponseDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
      };

      service.querySpecialDonationStatus(mockQuery).subscribe((response) => {
        expect(response).toEqual({ specialUnits: [], totalRecordsFound: 0 });
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.QUERY);
      req.flush(apiResponse);
    });
  });

  describe('getUnitDetails', () => {
    it('should get unit details by unit ID', () => {
      const unitId = 'DN00017241';
      const mockUnit: SpecialUnitDto = {
        sequence: 1,
        shipId: 'GUARD',
        shipDesc: 'Guard Station',
        unitId: 'DN00017241',
        displayUnitId: 'DN00017241-5',
        patientName: 'Smith, John',
        collDate: '2025-01-11',
        patId: '123',
        seqNo: 1,
      };

      const apiResponse: ApiResponse<SpecialUnitDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnit,
      };

      service.getUnitDetails(unitId).subscribe((unit) => {
        expect(unit).toEqual(mockUnit);
        expect(unit.unitId).toBe(unitId);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.GET_UNIT_DETAILS(unitId));
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });

  describe('getShipLocationsLookup', () => {
    it('should get ship locations without search term', () => {
      const mockLocations: ShipLocationLookupDto[] = [
        { shipId: 'GUARD', shipDesc: 'Guard Station', displayValue: 'GUARD - Guard Station' },
        { shipId: 'MAIN', shipDesc: 'Main Hospital', displayValue: 'MAIN - Main Hospital' },
      ];

      const apiResponse: ApiResponse<ShipLocationLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockLocations,
      };

      service.getShipLocationsLookup().subscribe((locations) => {
        expect(locations).toEqual(mockLocations);
        expect(locations.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.LOOKUPS.SHIP_LOCATIONS);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get ship locations with search term', () => {
      const searchTerm = 'Guard';
      const mockLocations: ShipLocationLookupDto[] = [
        { shipId: 'GUARD', shipDesc: 'Guard Station', displayValue: 'GUARD - Guard Station' },
      ];

      const apiResponse: ApiResponse<ShipLocationLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockLocations,
      };

      service.getShipLocationsLookup(searchTerm).subscribe((locations) => {
        expect(locations).toEqual(mockLocations);
        expect(locations.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.SHIP_LOCATIONS &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });

  describe('getPatientsLookup', () => {
    it('should get patients without search term', () => {
      const mockPatients: PatientLookupDto[] = [
        { patId: '123', patientName: 'Smith, John', displayValue: '123 - Smith, John' },
        { patId: '456', patientName: 'Doe, Jane', displayValue: '456 - Doe, Jane' },
      ];

      const apiResponse: ApiResponse<PatientLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockPatients,
      };

      service.getPatientsLookup().subscribe((patients) => {
        expect(patients).toEqual(mockPatients);
        expect(patients.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.LOOKUPS.PATIENTS);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get patients with search term', () => {
      const searchTerm = 'Smith';
      const mockPatients: PatientLookupDto[] = [
        { patId: '123', patientName: 'Smith, John', displayValue: '123 - Smith, John' },
      ];

      const apiResponse: ApiResponse<PatientLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockPatients,
      };

      service.getPatientsLookup(undefined, undefined, searchTerm).subscribe((patients) => {
        expect(patients).toEqual(mockPatients);
        expect(patients.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.PATIENTS &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    // Gap Analysis Fix #2: Test date filtering
    it('should get patients with fromDate and toDate filters', () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-12-31';
      const mockPatients: PatientLookupDto[] = [
        { patId: '123', patientName: 'Smith, John', displayValue: '123 - Smith, John' },
      ];

      const apiResponse: ApiResponse<PatientLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockPatients,
      };

      service.getPatientsLookup(fromDate, toDate).subscribe((patients) => {
        expect(patients).toEqual(mockPatients);
        expect(patients.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.PATIENTS &&
        request.params.get('fromDate') === fromDate &&
        request.params.get('toDate') === toDate
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get patients with both date filters and search term', () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-12-31';
      const searchTerm = 'Smith';
      const mockPatients: PatientLookupDto[] = [
        { patId: '123', patientName: 'Smith, John', displayValue: '123 - Smith, John' },
      ];

      const apiResponse: ApiResponse<PatientLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockPatients,
      };

      service.getPatientsLookup(fromDate, toDate, searchTerm).subscribe((patients) => {
        expect(patients).toEqual(mockPatients);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.PATIENTS &&
        request.params.get('fromDate') === fromDate &&
        request.params.get('toDate') === toDate &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });

  describe('getUnitIdsLookup', () => {
    it('should get unit IDs without search term', () => {
      const mockUnitIds: UnitIdLookupDto[] = [
        { unitId: 'DN001', patientName: 'Smith, John', displayValue: 'DN001 - Smith, John' },
        { unitId: 'DN002', patientName: 'Doe, Jane', displayValue: 'DN002 - Doe, Jane' },
      ];

      const apiResponse: ApiResponse<UnitIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnitIds,
      };

      service.getUnitIdsLookup().subscribe((unitIds) => {
        expect(unitIds).toEqual(mockUnitIds);
        expect(unitIds.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get unit IDs with search term', () => {
      const searchTerm = 'DN001';
      const mockUnitIds: UnitIdLookupDto[] = [
        { unitId: 'DN001', patientName: 'Smith, John', displayValue: 'DN001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<UnitIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnitIds,
      };

      service.getUnitIdsLookup(undefined, undefined, undefined, searchTerm).subscribe((unitIds) => {
        expect(unitIds).toEqual(mockUnitIds);
        expect(unitIds.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    // Gap Analysis Fix #3: Test date and patient filtering
    it('should get unit IDs with date filters', () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-12-31';
      const mockUnitIds: UnitIdLookupDto[] = [
        { unitId: 'DN001', patientName: 'Smith, John', displayValue: 'DN001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<UnitIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnitIds,
      };

      service.getUnitIdsLookup(fromDate, toDate).subscribe((unitIds) => {
        expect(unitIds).toEqual(mockUnitIds);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS &&
        request.params.get('fromDate') === fromDate &&
        request.params.get('toDate') === toDate
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get unit IDs with patient filter', () => {
      const patId = 'PAT001';
      const mockUnitIds: UnitIdLookupDto[] = [
        { unitId: 'DN001', patientName: 'Smith, John', displayValue: 'DN001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<UnitIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnitIds,
      };

      service.getUnitIdsLookup(undefined, undefined, patId).subscribe((unitIds) => {
        expect(unitIds).toEqual(mockUnitIds);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS &&
        request.params.get('patId') === patId
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get unit IDs with all filters', () => {
      const fromDate = '2024-01-01';
      const toDate = '2024-12-31';
      const patId = 'PAT001';
      const searchTerm = 'DN001';
      const mockUnitIds: UnitIdLookupDto[] = [
        { unitId: 'DN001', patientName: 'Smith, John', displayValue: 'DN001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<UnitIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockUnitIds,
      };

      service.getUnitIdsLookup(fromDate, toDate, patId, searchTerm).subscribe((unitIds) => {
        expect(unitIds).toEqual(mockUnitIds);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.UNIT_IDS &&
        request.params.get('fromDate') === fromDate &&
        request.params.get('toDate') === toDate &&
        request.params.get('patId') === patId &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });

  describe('getSurgIdsLookup', () => {
    it('should get surgery IDs without search term', () => {
      const mockSurgIds: SurgIdLookupDto[] = [
        { surgId: 'SURG001', patientName: 'Smith, John', displayValue: 'SURG001 - Smith, John' },
        { surgId: 'SURG002', patientName: 'Doe, Jane', displayValue: 'SURG002 - Doe, Jane' },
      ];

      const apiResponse: ApiResponse<SurgIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSurgIds,
      };

      service.getSurgIdsLookup().subscribe((surgIds) => {
        expect(surgIds).toEqual(mockSurgIds);
        expect(surgIds.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SPECIAL_DONATION_STATUS.LOOKUPS.SURG_IDS);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get surgery IDs with search term', () => {
      const searchTerm = 'SURG001';
      const mockSurgIds: SurgIdLookupDto[] = [
        { surgId: 'SURG001', patientName: 'Smith, John', displayValue: 'SURG001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<SurgIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSurgIds,
      };

      service.getSurgIdsLookup(undefined, searchTerm).subscribe((surgIds) => {
        expect(surgIds).toEqual(mockSurgIds);
        expect(surgIds.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.SURG_IDS &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    // Gap Analysis Fix #4: Test patient filtering
    it('should get surgery IDs with patient filter', () => {
      const patId = 'PAT001';
      const mockSurgIds: SurgIdLookupDto[] = [
        { surgId: 'SURG001', patientName: 'Smith, John', displayValue: 'SURG001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<SurgIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSurgIds,
      };

      service.getSurgIdsLookup(patId).subscribe((surgIds) => {
        expect(surgIds).toEqual(mockSurgIds);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.SURG_IDS &&
        request.params.get('patId') === patId
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should get surgery IDs with patient filter and search term', () => {
      const patId = 'PAT001';
      const searchTerm = 'SURG001';
      const mockSurgIds: SurgIdLookupDto[] = [
        { surgId: 'SURG001', patientName: 'Smith, John', displayValue: 'SURG001 - Smith, John' },
      ];

      const apiResponse: ApiResponse<SurgIdLookupDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSurgIds,
      };

      service.getSurgIdsLookup(patId, searchTerm).subscribe((surgIds) => {
        expect(surgIds).toEqual(mockSurgIds);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.SPECIAL_DONATION_STATUS.LOOKUPS.SURG_IDS &&
        request.params.get('patId') === patId &&
        request.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });
});
