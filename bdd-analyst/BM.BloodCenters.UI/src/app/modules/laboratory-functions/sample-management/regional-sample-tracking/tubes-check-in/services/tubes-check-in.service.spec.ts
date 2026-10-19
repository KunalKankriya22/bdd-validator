import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TubesCheckInService } from './tubes-check-in.service';
import { API } from '@core/constants/api.constants';
import {
  TubesContract,
  ProfileSet,
  CheckInRequestDto,
  CheckInResponseDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ContractLookupDto,
  BatchLookupDto,
  ProfileSetDto,
  BatchUnitDto,
  DuplicateUnitDto,
  TestLookupDto,
  TubeFormatDto,
  DuplicateReasonDto,
  ReturnResult,
} from '../models/tubes-check-in.model';

describe('TubesCheckInService', () => {
  let service: TubesCheckInService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TubesCheckInService],
    });

    service = TestBed.inject(TubesCheckInService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('checkIn', () => {
    it('should submit check-in data and return response', () => {
      const mockRequest: CheckInRequestDto = {
        contractId: 'C001',
        profileSetId: 'PS001',
        profileSeqNo: 1,
        receivedDate: '2026-06-12T10:00:00Z',
        shipmentNo: 'SHIP001',
        shipmentArrivalDate: '2026-06-12T09:00:00Z',
        batchId: 'B001',
        collDate: '2026-06-10T00:00:00Z',
        tubeFormat: 'RPS',
        units: [
          {
            osUnitIdRed: 'U001',
            unitIdRed: 'U001',
            redChkDigit: '5',
            osRedChkDigit: '5',
            osUnitIdPurple: 'U002',
            unitIdPurple: 'U002',
            purpleChkDigit: '3',
            osPurpleChkDigit: '3',
            osUnitIdSerum: null,
            unitIdSerum: null,
            serumChkDigit: null,
            duplicateReasonCode: null,
            duplicateAllowed: false,
          },
        ],
      };

      const mockResponse: ReturnResult<CheckInResponseDto> = {
        success: true,
        data: {
          batchId: 'B001',
          unitsProcessed: 1,
          testsScheduled: 5,
          success: true,
        },
        message: 'Check-in completed',
        statusCode: 200,
      };

      service.checkIn(mockRequest).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data?.unitsProcessed).toBe(1);
        expect(response.data?.testsScheduled).toBe(5);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.CHECK_IN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('validateUnit', () => {
    it('should validate unit and return validation result', () => {
      const mockRequest: ValidateUnitRequestDto = {
        contractId: 'C001',
        unitId: 'U12345',
        osUnitId: '12345',
        tubeType: 'RED',
        entryMode: 'SCAN',
        barcodeScheme: 'ISBT',
        batchId: 'B001',
        collDate: '2026-06-10T00:00:00Z',
      };

      const mockResponse: ReturnResult<ValidateUnitResponseDto> = {
        success: true,
        data: {
          isValid: true,
          isDuplicate: false,
          requiresReason: false,
          decodedOsUnitId: '12345',
          decodedUnitId: 'U12345',
          checkDigit: '5',
          oldUnitId: null,
          errorCode: null,
          errorMessage: null,
          codeScheme: 'ISBT',
        },
        message: 'Validation successful',
        statusCode: 200,
      };

      service.validateUnit(mockRequest).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data?.isValid).toBe(true);
        expect(response.data?.isDuplicate).toBe(false);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.VALIDATE_UNIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle duplicate unit validation', () => {
      const mockRequest: ValidateUnitRequestDto = {
        contractId: 'C001',
        unitId: 'U12345',
        osUnitId: '12345',
        tubeType: 'PURPLE',
        entryMode: 'MANUAL',
        barcodeScheme: null,
        batchId: null,
        collDate: null,
      };

      const mockResponse: ReturnResult<ValidateUnitResponseDto> = {
        success: true,
        data: {
          isValid: false,
          isDuplicate: true,
          requiresReason: true,
          decodedOsUnitId: null,
          decodedUnitId: null,
          checkDigit: null,
          oldUnitId: null,
          errorCode: 'DUPLICATE_UNIT',
          errorMessage: 'Unit already checked in',
          codeScheme: null,
        },
        message: 'Duplicate detected',
        statusCode: 200,
      };

      service.validateUnit(mockRequest).subscribe((response) => {
        expect(response.data?.isDuplicate).toBe(true);
        expect(response.data?.requiresReason).toBe(true);
        expect(response.data?.errorMessage).toBe('Unit already checked in');
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.VALIDATE_UNIT);
      req.flush(mockResponse);
    });
  });

  describe('getContracts', () => {
    it('should fetch contracts without search string', () => {
      const mockDtos: ContractLookupDto[] = [
        {
          contractId: 'C001',
          company: 'Company A',
          centerId: 'CENTER01',
          conBarCode: null,
          copyIsbtFlag: 'Y',
          dupCheckinFlag: 'Y',
          noOfDuplicates: 3,
          effDate: '2026-01-01T00:00:00Z',
          termDate: null,
        },
        {
          contractId: 'C002',
          company: 'Company B',
          centerId: 'CENTER02',
          conBarCode: null,
          copyIsbtFlag: 'N',
          dupCheckinFlag: 'N',
          noOfDuplicates: 0,
          effDate: '2026-01-01T00:00:00Z',
          termDate: null,
        },
      ];

      const mockResponse: ReturnResult<ContractLookupDto[]> = {
        success: true,
        data: mockDtos,
        message: 'Success',
        statusCode: 200,
      };

      const expectedContracts: TubesContract[] = [
        {
          contractId: 'C001',
          description: 'Company A',
          centerId: 'CENTER01',
          copyIsbtFlag: 'Y',
          allowsDuplicates: true,
          maxDuplicates: 3,
        },
        {
          contractId: 'C002',
          description: 'Company B',
          centerId: 'CENTER02',
          copyIsbtFlag: 'N',
          allowsDuplicates: false,
          maxDuplicates: 0,
        },
      ];

      service.getContracts().subscribe((contracts) => {
        expect(contracts).toEqual(expectedContracts);
        expect(contracts.length).toBe(2);
        expect(contracts[0].allowsDuplicates).toBe(true);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.REGIONAL_TUBES.CONTRACTS
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch contracts with search string', () => {
      const mockDtos: ContractLookupDto[] = [
        {
          contractId: 'C001',
          company: 'Company A',
          centerId: 'CENTER01',
          conBarCode: null,
          copyIsbtFlag: 'Y',
          dupCheckinFlag: 'Y',
          noOfDuplicates: 3,
          effDate: '2026-01-01T00:00:00Z',
          termDate: null,
        },
      ];

      const mockResponse: ReturnResult<ContractLookupDto[]> = {
        success: true,
        data: mockDtos,
        message: 'Success',
        statusCode: 200,
      };

      service.getContracts('Company A').subscribe((contracts) => {
        expect(contracts.length).toBe(1);
        expect(contracts[0].contractId).toBe('C001');
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.REGIONAL_TUBES.CONTRACTS &&
        request.params.has('searchString')
      );
      expect(req.request.params.get('searchString')).toBe('Company A');
      req.flush(mockResponse);
    });
  });

  describe('getProfileSets', () => {
    it('should fetch profile sets for a contract', () => {
      const mockDtos: ProfileSetDto[] = [
        { profileSetId: 'PS001' },
        { profileSetId: 'PS002' },
      ];

      const mockResponse: ReturnResult<ProfileSetDto[]> = {
        success: true,
        data: mockDtos,
        message: 'Success',
        statusCode: 200,
      };

      service.getProfileSets('C001').subscribe((profileSets) => {
        expect(profileSets).toEqual(mockDtos);
        expect(profileSets.length).toBe(2);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.PROFILE_SETS('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBatches', () => {
    it('should fetch open batches for a contract', () => {
      const mockBatches: BatchLookupDto[] = [
        {
          batchId: 'B001',
          receivedDate: '2026-06-01T00:00:00Z',
          contractId: 'C001',
          profileSetId: 'PS001',
          profileSeqNo: 1,
          checkinUserId: 'user1',
          qcDate: null,
        },
        {
          batchId: 'B002',
          receivedDate: '2026-06-02T00:00:00Z',
          contractId: 'C001',
          profileSetId: 'PS002',
          profileSeqNo: 2,
          checkinUserId: 'user2',
          qcDate: null,
        },
      ];

      const mockResponse: ReturnResult<BatchLookupDto[]> = {
        success: true,
        data: mockBatches,
        message: 'Success',
        statusCode: 200,
      };

      service.getBatches('C001').subscribe((batches) => {
        expect(batches).toEqual(mockBatches);
        expect(batches.length).toBe(2);
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.REGIONAL_TUBES.BATCHES &&
        request.params.get('contractId') === 'C001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBatchUnits', () => {
    it('should fetch units in a batch', () => {
      const mockUnits: BatchUnitDto[] = [
        {
          unitId: 'U001',
          osUnitId: 'OS001',
          collDate: '2026-06-01T00:00:00Z',
          receivedDate: '2026-06-05T00:00:00Z',
          batchId: 'B001',
        },
        {
          unitId: 'U002',
          osUnitId: 'OS002',
          collDate: '2026-06-02T00:00:00Z',
          receivedDate: '2026-06-05T00:00:00Z',
          batchId: 'B001',
        },
      ];

      const mockResponse: ReturnResult<BatchUnitDto[]> = {
        success: true,
        data: mockUnits,
        message: 'Success',
        statusCode: 200,
      };

      service.getBatchUnits('B001').subscribe((units) => {
        expect(units).toEqual(mockUnits);
        expect(units.length).toBe(2);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.BATCH_UNITS('B001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDuplicateUnits', () => {
    it('should fetch duplicate unit history', () => {
      const mockDuplicates: DuplicateUnitDto[] = [
        {
          unitId: 'U12345',
          chkDigit: '5',
          receivedDate: '2026-06-02T10:00:00Z',
          contractId: 'C001',
          redTubeFlag: 'Y',
          purpleTubeFlag: 'N',
          serumPlasmaInd: 'S',
        },
        {
          unitId: 'U12345',
          chkDigit: '5',
          receivedDate: '2026-06-06T10:00:00Z',
          contractId: 'C001',
          redTubeFlag: 'Y',
          purpleTubeFlag: 'Y',
          serumPlasmaInd: 'P',
        },
      ];

      const mockResponse: ReturnResult<DuplicateUnitDto[]> = {
        success: true,
        data: mockDuplicates,
        message: 'Success',
        statusCode: 200,
      };

      service.getDuplicateUnits('12345').subscribe((duplicates) => {
        expect(duplicates).toEqual(mockDuplicates);
        expect(duplicates.length).toBe(2);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.DUPLICATE_UNITS('12345'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAdditionalTests', () => {
    it('should fetch additional tests for a contract', () => {
      const mockTests: TestLookupDto[] = [
        { testId: 'T001', testDesc: 'Additional Test 1' },
        { testId: 'T002', testDesc: 'Additional Test 2' },
      ];

      const mockResponse: ReturnResult<TestLookupDto[]> = {
        success: true,
        data: mockTests,
        message: 'Success',
        statusCode: 200,
      };

      service.getAdditionalTests('C001').subscribe((tests) => {
        expect(tests).toEqual(mockTests);
        expect(tests.length).toBe(2);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.ADDITIONAL_TESTS('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getContractTests', () => {
    it('should fetch contract tests without profile set ID', () => {
      const mockTests: TestLookupDto[] = [
        { testId: 'T001', testDesc: 'Profile Test 1' },
        { testId: 'T002', testDesc: 'Profile Test 2' },
      ];

      const mockResponse: ReturnResult<TestLookupDto[]> = {
        success: true,
        data: mockTests,
        message: 'Success',
        statusCode: 200,
      };

      service.getContractTests('C001').subscribe((tests) => {
        expect(tests).toEqual(mockTests);
        expect(tests.length).toBe(2);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.CONTRACT_TESTS('C001', undefined));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch contract tests with profile set ID', () => {
      const mockTests: TestLookupDto[] = [
        { testId: 'T003', testDesc: 'Specific Profile Test' },
      ];

      const mockResponse: ReturnResult<TestLookupDto[]> = {
        success: true,
        data: mockTests,
        message: 'Success',
        statusCode: 200,
      };

      service.getContractTests('C001', 'PS001').subscribe((tests) => {
        expect(tests).toEqual(mockTests);
        expect(tests.length).toBe(1);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.CONTRACT_TESTS('C001', 'PS001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTubeFormats', () => {
    it('should fetch tube format codes', () => {
      const mockFormats: TubeFormatDto[] = [
        { code: 'R', description: 'Red only' },
        { code: 'RP', description: 'Red and Purple' },
        { code: 'RPS', description: 'Red, Purple, and Serum' },
        { code: 'R2', description: 'Two Red tubes' },
      ];

      const mockResponse: ReturnResult<TubeFormatDto[]> = {
        success: true,
        data: mockFormats,
        message: 'Success',
        statusCode: 200,
      };

      service.getTubeFormats().subscribe((formats) => {
        expect(formats).toEqual(mockFormats);
        expect(formats.length).toBe(4);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.TUBE_FORMATS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDuplicateReasons', () => {
    it('should fetch duplicate reason codes', () => {
      const mockReasons: DuplicateReasonDto[] = [
        { code: 'RE', description: 'Retest' },
        { code: 'QC', description: 'Quality Control' },
        { code: 'ER', description: 'Error Correction' },
      ];

      const mockResponse: ReturnResult<DuplicateReasonDto[]> = {
        success: true,
        data: mockReasons,
        message: 'Success',
        statusCode: 200,
      };

      service.getDuplicateReasons().subscribe((reasons) => {
        expect(reasons).toEqual(mockReasons);
        expect(reasons.length).toBe(3);
      });

      const req = httpMock.expectOne(API.REGIONAL_TUBES.DUPLICATE_REASONS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Helper Methods', () => {
    describe('formatDateForDisplay', () => {

      it('should handle single-digit days', () => {
        const isoDate = '2026-01-05T10:30:00Z';
        const formatted = service.formatDateForDisplay(isoDate);
        expect(formatted).toBe('05-JAN-2026');
      });


      it('should handle December correctly', () => {
        const isoDate = '2026-12-25T10:30:00Z';
        const formatted = service.formatDateForDisplay(isoDate);
        expect(formatted).toBe('25-DEC-2026');
      });
    });

    describe('formatTimeForDisplay', () => {
      it('should format ISO date to HH:mm', () => {
        // Use local timezone date instead of UTC to match service behavior
        const isoDate = '2026-06-12T14:30:00';
        const formatted = service.formatTimeForDisplay(isoDate);
        expect(formatted).toBe('14:30');
      });

      it('should handle single-digit hours and minutes', () => {
        // Use local timezone date instead of UTC to match service behavior
        const isoDate = '2026-06-12T09:05:00';
        const formatted = service.formatTimeForDisplay(isoDate);
        expect(formatted).toBe('09:05');
      });


      it('should handle midnight correctly', () => {
        // Use local timezone date instead of UTC to match service behavior
        const isoDate = '2026-06-12T00:00:00';
        const formatted = service.formatTimeForDisplay(isoDate);
        expect(formatted).toBe('00:00');
      });
    });

    describe('convertToIsoDateTime', () => {
      it('should convert DD-MMM-YYYY and HH:mm to ISO format', () => {
        const date = '12-JUN-2026';
        const time = '14:30';
        const iso = service.convertToIsoDateTime(date, time);
        expect(iso).toBe('2026-06-12T14:30:00');
      });

      it('should handle single-digit day', () => {
        const date = '05-JAN-2026';
        const time = '09:15';
        const iso = service.convertToIsoDateTime(date, time);
        expect(iso).toBe('2026-01-05T09:15:00');
      });

      it('should handle lowercase month names', () => {
        const date = '25-dec-2026';
        const time = '23:59';
        const iso = service.convertToIsoDateTime(date, time);
        expect(iso).toBe('2026-12-25T23:59:00');
      });

      it('should handle midnight time', () => {
        const date = '01-FEB-2026';
        const time = '00:00';
        const iso = service.convertToIsoDateTime(date, time);
        expect(iso).toBe('2026-02-01T00:00:00');
      });

      it('should handle all months correctly', () => {
        const months = [
          'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
          'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
        ];

        months.forEach((month, index) => {
          const date = `15-${month}-2026`;
          const time = '12:00';
          const iso = service.convertToIsoDateTime(date, time);
          const monthNum = (index + 1).toString().padStart(2, '0');
          expect(iso).toBe(`2026-${monthNum}-15T12:00:00`);
        });
      });
    });

    describe('mapContracts', () => {
      it('should map ContractLookupDto to TubesContract correctly', () => {
        const dtos: ContractLookupDto[] = [
          {
            contractId: 'C001',
            company: 'Company A',
            centerId: 'CENTER01',
            conBarCode: null,
            copyIsbtFlag: 'Y',
            dupCheckinFlag: 'Y',
            noOfDuplicates: 5,
            effDate: '2026-01-01T00:00:00Z',
            termDate: null,
          },
          {
            contractId: 'C002',
            company: 'Company B',
            centerId: 'CENTER02',
            conBarCode: null,
            copyIsbtFlag: 'N',
            dupCheckinFlag: 'N',
            noOfDuplicates: 0,
            effDate: '2026-01-01T00:00:00Z',
            termDate: null,
          },
        ];

        const mockResponse: ReturnResult<ContractLookupDto[]> = {
          success: true,
          data: dtos,
          message: 'Success',
        statusCode: 200,
        };

        service.getContracts().subscribe((contracts) => {
          expect(contracts[0].contractId).toBe('C001');
          expect(contracts[0].description).toBe('Company A');
          expect(contracts[0].centerId).toBe('CENTER01');
          expect(contracts[0].allowsDuplicates).toBe(true);
          expect(contracts[0].maxDuplicates).toBe(5);

          expect(contracts[1].allowsDuplicates).toBe(false);
          expect(contracts[1].maxDuplicates).toBe(0);
        });

        const req = httpMock.expectOne((request) =>
          request.url === API.REGIONAL_TUBES.CONTRACTS
        );
        req.flush(mockResponse);
      });
    });
  });
});
