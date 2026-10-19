import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UpdateDeferralService } from './update-deferral.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  DeferralDetailDto,
  UpdateDeferralRequestDto,
  ApiResponse,
  CreateDeferralInterdictionDto,
  DeferralInterdictionDto,
  FieldValidationResult,
} from '../models/update-deferral.model';

describe('UpdateDeferralService', () => {
  let service: UpdateDeferralService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDeferralDetail: DeferralDetailDto = {
    deferralId: 'DEF12345',
    donorId: 'DON123',
    transactionId: 'TXN456',
    driveId: 'DRV001',
    driveDate: '2026-05-10',
    setId: 'SET789',
    lookupId: 'STF001',
    donationType: 'WB',
    procedureCode: '450',
    physicalId: 'PHY001',
    deferralReason: 'LOW_HB',
    deferredThruDate: '2026-08-10',
    deferralType: 'NA',
    screenerId: 'SCR001',
    firstReviewerId: 'REV001',
    equipType: 'EQ001',
    bagType: 'BAG01',
    noteId: 'NOTE123',
    collDate: '2026-05-10',
    chapterId: '0001',
    programId: 'DRIREDEF',
    insertUser: 'USER123',
    insertedBy: 'John Doe',
    nAuditFlag: 'Y',
    lastName: 'Rogers',
    lastNameSuffix: 'Jr.',
    firstName: 'Marvin',
    middleName: 'Michael',
    dateOfBirth: '1990-01-15',
    gender: 'Male',
    height: '5\' 10"',
    donorWeight: 180,
    bloodType: 'O+',
    aboDescription: 'O Positive',
    employerId: 'EMP001',
    donorStatus: 'A',
    scanId: 'SCAN001',
    alternateId: 'M639466',
    alternateIdType: 'PASPT',
    ethnicGroup: 'CA',
    intlAddrFlag: 'N',
    streetName: '123 Main Street',
    suiteApt: '4B',
    uspsId: 12345,
    city: 'New York',
    state: 'NY',
    zip: '10001',
    hAreaCode: '214',
    hPhoneNo: '8527584',
    dAreaCode: '214',
    dPhoneNo: '8527585',
    extension: null,
    mAreaCode: '214',
    mPhoneNo: '8527586',
    email: '[REDACTED_EMAIL_ADDRESS_1]',
    preferredContactFlag: 'M',
    preferredContactAddrFlag: null,
    intlAddress1: null,
    intlAddress2: null,
    intlAddress3: null,
    intlAddress4: null,
    countryName: null,
    intlPostalCode: null,
    intlHomePhoneNo: null,
    intlWorkPhoneNo: null,
    intlWorkPhoneExt: null,
    intlMobilePhoneNo: null,
    intlFaxNo: null,
    altStreetName: null,
    altSuiteApt: null,
    altUspsId: null,
    altIntlAddress1: null,
    altIntlAddress2: null,
    altIntlAddress3: null,
    altIntlAddress4: null,
    altCountryName: null,
    altIntlPostalCode: null,
    altIntlAddrFlag: null,
    otherContactNo: null,
    altIntlPhoneNo: null,
    altCity: null,
    altState: null,
    altZip: null,
    employerName: 'Mediware',
    empIntlAddrFlag: 'N',
    empZip: '10001',
    empCity: 'New York',
    empState: 'NY',
    empUspsId: 12345,
    empIntlCity: null,
    empIntlState: null,
    empIntlPostalCode: null,
    empIntlCountryName: null,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        UpdateDeferralService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });
    service = TestBed.inject(UpdateDeferralService);
  });

  afterEach(() => {
    service.clearCaches();
  });

  describe('getDeferralById', () => {
    it('should retrieve deferral details by ID', (done) => {
      const mockResponse: ApiResponse<DeferralDetailDto> = {
        success: true,
        statusCode: 200,
        message: 'Deferral retrieved successfully',
        data: [mockDeferralDetail],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralById('DEF12345').subscribe((result) => {
        expect(result).toEqual(mockDeferralDetail);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_BY_ID('DEF12345'),
        );
        done();
      });
    });

    it('should throw error when deferral not found', (done) => {
      const mockResponse: ApiResponse<DeferralDetailDto> = {
        success: false,
        statusCode: 404,
        message: 'Deferral not found',
        data: [],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralById('INVALID').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Deferral not found');
          done();
        },
      });
    });

    it('should throw error when data array is empty', (done) => {
      const mockResponse: ApiResponse<DeferralDetailDto> = {
        success: true,
        statusCode: 200,
        message: '',
        data: [],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralById('DEF12345').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Deferral not found');
          done();
        },
      });
    });

    it('should throw error when response data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null, message: '' }));

      service.getDeferralById('DEF12345').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Deferral not found');
          done();
        },
      });
    });
  });

  describe('updateDeferral', () => {
    it('should update deferral successfully', (done) => {
      const updateRequest: UpdateDeferralRequestDto = {
        driveId: 'DRV002',
        deferralType: 'IND',
        deferredThruDate: null,
      };
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Deferral updated successfully',
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateDeferral('DEF12345', updateRequest).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.UPDATE('DEF12345'),
          updateRequest,
        );
        done();
      });
    });

    it('should propagate error from updateDeferral', (done) => {
      const updateRequest: UpdateDeferralRequestDto = {
        driveId: 'DRV002',
        deferralType: 'IND',
        deferredThruDate: null,
      };
      apiServiceSpy.put.and.returnValue(throwError(() => ({ status: 500, statusText: 'Internal Server Error' })));

      service.updateDeferral('DEF12345', updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('validateDeferralId', () => {
    it('should return true for valid deferral ID', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Deferral ID is valid',
        data: [true],
      }));

      service.validateDeferralId('DEF12345').subscribe((result) => {
        expect(result).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE('DEF12345'),
        );
        done();
      });
    });

    it('should return false for invalid deferral ID', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: false,
        statusCode: 400,
        message: 'Deferral not found',
        data: [false],
      }));

      service.validateDeferralId('INVALID').subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when data is undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Response',
      }));

      service.validateDeferralId('DEF12345').subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('Interdictions', () => {
    it('should get interdictions by transaction ID', (done) => {
      const mockInterdictions: DeferralInterdictionDto[] = [
        {
          interCode: 'IC001', interType: 'HOLD', description: 'Hold',
          comments: '', transactionId: 'TXN456', termDate: '', releaseDate: '', releaseUser: '',
        },
      ];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockInterdictions }));

      service.getInterdictions('TXN456').subscribe((result) => {
        expect(result).toEqual(mockInterdictions);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_INTERDICTIONS('TXN456'),
        );
        done();
      });
    });

    it('should return empty array on getInterdictions error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getInterdictions('TXN456').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when getInterdictions data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getInterdictions('TXN456').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should add interdiction', (done) => {
      const dto: CreateDeferralInterdictionDto = {
        transactionId: 'TXN456', interCode: 'IC001', comments: 'Test',
      };
      apiServiceSpy.post.and.returnValue(of({ success: true, statusCode: 201, message: 'Created' }));

      service.addInterdiction(dto).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.ADD_INTERDICTION,
          dto,
        );
        done();
      });
    });

    it('should remove interdiction', (done) => {
      apiServiceSpy.delete.and.returnValue(of({ success: true, statusCode: 200, message: 'Removed' }));

      service.removeInterdiction('TXN456', 'IC001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.REMOVE_INTERDICTION('TXN456', 'IC001'),
        );
        done();
      });
    });
  });

  describe('getDrives', () => {
    it('should retrieve drives', (done) => {
      const mockDrives = [{ driveId: 'DRV001', driveDate: '2026-05-10', sponsorName: 'Main Sponsor' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockDrives }));

      service.getDrives().subscribe((result) => {
        expect(result).toEqual(mockDrives);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DRIVES(),
        );
        done();
      });
    });

    it('should pass driveDate param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getDrives('2026-05-10').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DRIVES('2026-05-10'),
        );
        done();
      });
    });

    it('should return empty array on getDrives error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDrives().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when getDrives data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getDrives().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEmployees', () => {
    it('should retrieve employees', (done) => {
      const mockEmployees = [{ staffNo: 'STF001', staffName: 'John Doe' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockEmployees }));

      service.getEmployees().subscribe((result) => {
        expect(result).toEqual(mockEmployees);
        done();
      });
    });

    it('should pass driveDate param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEmployees('2026-05-10').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EMPLOYEES('2026-05-10'),
        );
        done();
      });
    });

    it('should return empty array on getEmployees error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEmployees().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when getEmployees data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEmployees().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getDonationTypes', () => {
    it('should retrieve donation types and cache the result', (done) => {
      const mockTypes = [{ code: 'WB', description: 'Whole Blood' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes }));

      service.getDonationTypes().subscribe((result) => {
        expect(result).toEqual(mockTypes);

        service.getDonationTypes().subscribe((cachedResult) => {
          expect(cachedResult).toEqual(mockTypes);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should call correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getDonationTypes().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DONATION_TYPES,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDonationTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getDonationTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getProcedureCodes', () => {
    it('should retrieve procedure codes', (done) => {
      const mockCodes = [{ code: '450', description: '450mL Collection' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCodes }));

      service.getProcedureCodes().subscribe((result) => {
        expect(result).toEqual(mockCodes);
        done();
      });
    });

    it('should pass donationType param', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getProcedureCodes('WB').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_PROCEDURE_CODES('WB'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getProcedureCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getProcedureCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEquipmentTypes', () => {
    it('should retrieve equipment types and cache the result', (done) => {
      const mockTypes = [{ code: 'EQ001', description: 'Needle Type A' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes }));

      service.getEquipmentTypes().subscribe((result) => {
        expect(result).toEqual(mockTypes);

        service.getEquipmentTypes().subscribe((cachedResult) => {
          expect(cachedResult).toEqual(mockTypes);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should call correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEquipmentTypes().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EQUIPMENT_TYPES,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEquipmentTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEquipmentTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getDeferralReasons', () => {
    it('should retrieve deferral reasons', (done) => {
      const mockReasons = [{ code: 'LOW_HB', description: 'Low Hemoglobin' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockReasons }));

      service.getDeferralReasons().subscribe((result) => {
        expect(result).toEqual(mockReasons);
        done();
      });
    });

    it('should pass donationType param', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getDeferralReasons('WB').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_DEFERRAL_REASONS('WB'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDeferralReasons().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getDeferralReasons().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEthnicGroups', () => {
    it('should retrieve ethnic groups and cache the result', (done) => {
      const mockGroups = [{ code: 'CA', description: 'Caucasian' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockGroups }));

      service.getEthnicGroups().subscribe((result) => {
        expect(result).toEqual(mockGroups);

        service.getEthnicGroups().subscribe((cachedResult) => {
          expect(cachedResult).toEqual(mockGroups);
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should call correct endpoint without driveDate', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEthnicGroups().subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ETHNIC_GROUPS,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEthnicGroups().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEthnicGroups().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEmployers', () => {
    it('should retrieve employers', (done) => {
      const mockEmployers = [{ employerName: 'Mediware', city: 'Dallas', state: 'TX' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockEmployers }));

      service.getEmployers().subscribe((result) => {
        expect(result).toEqual(mockEmployers);
        done();
      });
    });

    it('should pass searchKeyword param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEmployers('Medi').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_EMPLOYERS('Medi'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEmployers().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEmployers().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getCities', () => {
    it('should retrieve cities using update-deferral endpoint', (done) => {
      const mockCities = [{ city: 'New York', state: 'NY', zip: '10001', uspsId: 12345 }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCities }));

      service.getCities('New').subscribe((result) => {
        expect(result).toEqual(mockCities);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_CITIES('New'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getCities('New').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getCities('New').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getZipLookup', () => {
    it('should retrieve city/state by zip using update-deferral endpoint', (done) => {
      const mockResult = [{ city: 'New York', state: 'NY', zip: '10001', uspsId: 12345 }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockResult }));

      service.getZipLookup('10001').subscribe((result) => {
        expect(result).toEqual(mockResult);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.ZIP_LOOKUP('10001'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getZipLookup('10001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getZipLookup('10001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getManualHolds', () => {
    it('should retrieve manual holds', (done) => {
      const mockHolds = [{ holdCode: 'MH01', description: 'Manual Hold 1' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockHolds }));

      service.getManualHolds().subscribe((result) => {
        expect(result).toEqual(mockHolds);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_MANUAL_HOLDS,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getManualHolds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getManualHolds().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEthnicRequired', () => {
    it('should return true when ethnicRequired is Y', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [{ ethnicRequired: 'Y' }] }));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ETHNIC_REQUIRED,
        );
        done();
      });
    });

    it('should return false when ethnicRequired is N', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [{ ethnicRequired: 'N' }] }));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('getCountries', () => {
    it('should retrieve countries', (done) => {
      const mockCountries = [{ countryCode: 'US', countryName: 'United States' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCountries }));

      service.getCountries().subscribe((result) => {
        expect(result).toEqual(mockCountries);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_COUNTRIES,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getCountries().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getCountries().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getAlternateIdTypes', () => {
    it('should retrieve alternate ID types', (done) => {
      const mockTypes = [{ code: 'PASPT', description: 'Passport' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes }));

      service.getAlternateIdTypes().subscribe((result) => {
        expect(result).toEqual(mockTypes);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.GET_ALTERNATE_ID_TYPES_LOOKUP,
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getAlternateIdTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getAlternateIdTypes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEmployerCities', () => {
    it('should retrieve employer cities', (done) => {
      const mockCities = [{ city: 'Dallas', state: 'TX', zip: '75001', uspsId: 54321 }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCities }));

      service.getEmployerCities('Dal').subscribe((result) => {
        expect(result).toEqual(mockCities);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.EMPLOYER_CITIES('Dal'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEmployerCities('Dal').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEmployerCities('Dal').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getEmployerZipLookup', () => {
    it('should retrieve employer city/state by zip', (done) => {
      const mockResult = [{ city: 'Dallas', state: 'TX', zip: '75001', uspsId: 54321 }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockResult }));

      service.getEmployerZipLookup('75001').subscribe((result) => {
        expect(result).toEqual(mockResult);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.EMPLOYER_ZIP_LOOKUP('75001'),
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getEmployerZipLookup('75001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: null }));

      service.getEmployerZipLookup('75001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('Field Validations', () => {
    const successResult: FieldValidationResult = { success: true, message: 'Valid', statusCode: 200 };

    it('should validate staff', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateStaff('STF001', '2026-05-10').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_STAFF('STF001', '2026-05-10'),
        );
        done();
      });
    });

    it('should validate staff without driveDate', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateStaff('STF001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_STAFF('STF001'),
        );
        done();
      });
    });

    it('should validate donation type', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateDonationType('WB').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_DONATION_TYPE('WB'),
        );
        done();
      });
    });

    it('should validate procedure code', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateProcedureCode('WB', '450').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_PROCEDURE_CODE('WB', '450'),
        );
        done();
      });
    });

    it('should validate equipment type', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateEquipmentType('EQ001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_EQUIPMENT_TYPE('EQ001'),
        );
        done();
      });
    });

    it('should validate deferral reason', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateDeferralReason('LOW_HB').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_DEFERRAL_REASON('LOW_HB'),
        );
        done();
      });
    });

    it('should validate deferral reason with donationType', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateDeferralReason('LOW_HB', 'WB').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_DEFERRAL_REASON('LOW_HB', 'WB'),
        );
        done();
      });
    });

    it('should validate city', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateCityField('New York').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_CITY('New York'),
        );
        done();
      });
    });

    it('should validate zip and city', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateZipCityField('New York', '10001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ZIP_CITY('New York', '10001'),
        );
        done();
      });
    });

    it('should validate alternate id type', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateAlternateIdTypeField('PASPT').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ALTERNATE_ID_TYPE('PASPT'),
        );
        done();
      });
    });

    it('should validate ethnic group', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateEthnicGroupField('CA').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_ETHNIC_GROUP('CA'),
        );
        done();
      });
    });

    it('should validate scan id with donorId', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateScanId('SCAN001', 'DON123').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_SCAN_ID('SCAN001', 'DON123'),
        );
        done();
      });
    });

    it('should validate scan id without donorId', (done) => {
      apiServiceSpy.get.and.returnValue(of(successResult));

      service.validateScanId('SCAN001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.UPDATE_DEFERRAL.VALIDATE_SCAN_ID('SCAN001'),
        );
        done();
      });
    });

    it('should propagate error from field validation', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, statusText: 'Internal Server Error' })));

      service.validateStaff('STF001').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('clearCaches', () => {
    it('should clear all caches so subsequent calls hit API again', (done) => {
      const mockDonTypes = [{ code: 'WB', description: 'Whole Blood' }];
      const mockEquipTypes = [{ code: 'EQ001', description: 'Needle Type A' }];
      const mockEthnicGroups = [{ code: 'CA', description: 'Caucasian' }];

      apiServiceSpy.get.and.returnValues(
        of({ success: true, data: mockDonTypes }),
        of({ success: true, data: mockEquipTypes }),
        of({ success: true, data: mockEthnicGroups }),
      );

      // Populate caches
      service.getDonationTypes().subscribe();
      service.getEquipmentTypes().subscribe();
      service.getEthnicGroups().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(3);

      // Clear caches
      service.clearCaches();

      // Set up new return values for post-clear calls
      const newDonTypes = [{ code: 'PLT', description: 'Platelet' }];
      const newEquipTypes = [{ code: 'EQ002', description: 'Needle Type B' }];
      const newEthnicGroups = [{ code: 'AA', description: 'African American' }];

      apiServiceSpy.get.and.returnValues(
        of({ success: true, data: newDonTypes }),
        of({ success: true, data: newEquipTypes }),
        of({ success: true, data: newEthnicGroups }),
      );

      // After clearing, calls should hit API again
      service.getDonationTypes().subscribe((result) => {
        expect(result).toEqual(newDonTypes);
      });
      service.getEquipmentTypes().subscribe((result) => {
        expect(result).toEqual(newEquipTypes);
      });
      service.getEthnicGroups().subscribe((result) => {
        expect(result).toEqual(newEthnicGroups);
        // 3 initial + 3 after clear = 6
        expect(apiServiceSpy.get).toHaveBeenCalledTimes(6);
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate 500 server errors from getDeferralById', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, statusText: 'Internal Server Error' })));

      service.getDeferralById('DEF12345').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });
    });
  });
});
