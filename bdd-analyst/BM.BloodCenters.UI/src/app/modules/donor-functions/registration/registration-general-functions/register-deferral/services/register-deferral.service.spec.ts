import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegisterDeferralService } from './register-deferral.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { API } from 'src/app/core/constants/api.constants';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('RegisterDeferralService', () => {
  let service: RegisterDeferralService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    headerServiceSpy = createMockHeaderService();

    TestBed.configureTestingModule({
      providers: [
        RegisterDeferralService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    service = TestBed.inject(RegisterDeferralService);
  });

  describe('getDrives', () => {
    it('should call GET with correct endpoint and return drives', (done) => {
      const mockResponse = { data: [{ driveId: 'DRV001', driveDate: '2025-01-01', sponsorName: 'Test' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrives('2025-01-01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_DRIVES('2025-01-01'));
        expect(result[0].driveId).toBe('DRV001');
        done();
      });
    });
  });

  describe('validateDeferralId', () => {
    it('should call POST with correct endpoint and body', (done) => {
      const mockResponse = { data: { isValid: true, message: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validateDeferralId('DEF001').subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.REGISTER_DEFERRAL.VALIDATE_DEFERRAL_ID,
          { deferralId: 'DEF001' }
        );
        expect(result.isValid).toBeTrue();
        done();
      });
    });
  });

  describe('checkDeferralExists', () => {
    it('should call GET with correct endpoint and return boolean', (done) => {
      const mockResponse = { data: true };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.checkDeferralExists('DEF001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.CHECK_DEFERRAL_EXISTS('DEF001'));
        expect(result).toBeTrue();
        done();
      });
    });

    it('should return false when deferral does not exist', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: false }));

      service.checkDeferralExists('UNKNOWN').subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });
  });

  describe('getDonor', () => {
    it('should call GET with correct endpoint and return donor demographics', (done) => {
      const mockResponse = { data: { donorId: 'DN001', lastName: 'Smith', firstName: 'John' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonor('DN001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_DONOR('DN001'));
        expect(result.lastName).toBe('Smith');
        done();
      });
    });
  });

  describe('getDonorAddress', () => {
    it('should call GET with correct endpoint and return donor address', (done) => {
      const mockResponse = { data: { streetName: '123 Main St', city: 'Dallas', state: 'TX', zip: '75001' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorAddress('DN001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_DONOR_ADDRESS('DN001'));
        expect(result.city).toBe('Dallas');
        done();
      });
    });
  });

  describe('registerDeferral', () => {
    it('should call POST with correct endpoint', (done) => {
      const mockRequest = { driveId: 'DRV001' } as any;
      const mockResponse = { data: { transactionId: 'TR001', success: true } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.registerDeferral(mockRequest).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.REGISTER, mockRequest);
        expect(result.transactionId).toBe('TR001');
        done();
      });
    });
  });

  describe('registerHold', () => {
    it('should call POST with correct endpoint for hold registration', (done) => {
      const mockRequest = { driveId: 'DRV001' } as any;
      const mockResponse = { data: { transactionId: 'TR002', success: true } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.registerHold(mockRequest).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.REGISTER_HOLD, mockRequest);
        expect(result.transactionId).toBe('TR002');
        done();
      });
    });
  });

  describe('updateDeferral', () => {
    it('should call PUT with correct endpoint', (done) => {
      const mockRequest = { driveId: 'DRV001' } as any;
      const mockResponse = { data: { transactionId: 'TR003', success: true } };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateDeferral(mockRequest).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.UPDATE, mockRequest);
        expect(result.transactionId).toBe('TR003');
        done();
      });
    });
  });

  describe('getDeferral', () => {
    it('should call GET with correct endpoint and return deferral registration', (done) => {
      const mockResponse = { data: { deferralId: 'DEF001', donorId: 'DN001' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferral('DEF001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_DEFERRAL('DEF001'));
        expect(result.deferralId).toBe('DEF001');
        done();
      });
    });
  });

  describe('searchDeferral', () => {
    it('should call POST with correct endpoint and body', (done) => {
      const mockResponse = { data: [{ deferralId: 'DEF001' }] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferral('DEF001').subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.REGISTER_DEFERRAL.SEARCH_DEFERRAL,
          { deferralId: 'DEF001' }
        );
        expect(result.length).toBe(1);
        done();
      });
    });
  });

  describe('cached lookups', () => {
    it('should cache getEmployees result', () => {
      const mockResponse = { data: [{ staffNo: 'S001', fullName: 'John Doe' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEmployees('2025-01-01').subscribe();
      service.getEmployees('2025-01-01').subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should cache getDonationTypes result', () => {
      const mockResponse = { data: [{ code: 'WB', description: 'Whole Blood' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationTypes().subscribe();
      service.getDonationTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should call getDeferralReasons with correct endpoint', (done) => {
      const mockResponse = { data: [{ reasonCode: 'MED' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralReasons('2025-01-01', 'WB').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_DEFERRAL_REASONS('2025-01-01', 'WB'));
        expect(result[0].reasonCode).toBe('MED');
        done();
      });
    });

    it('should cache getEquipmentTypes result', () => {
      const mockResponse = { data: [{ code: 'EQ1', description: 'Type 1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEquipmentTypes().subscribe();
      service.getEquipmentTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should cache getEthnicGroups result', () => {
      const mockResponse = { data: [{ code: 'CA', description: 'Caucasian' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEthnicGroups().subscribe();
      service.getEthnicGroups().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should cache getDeferralTypes result', () => {
      const mockResponse = { data: [{ code: 'NA', description: 'Not Applicable' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralTypes().subscribe();
      service.getDeferralTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should cache getAlternateIdTypes result', () => {
      const mockResponse = { data: [{ code: 'DL', description: 'Driver License' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAlternateIdTypes().subscribe();
      service.getAlternateIdTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEthnicRequired', () => {
    it('should return true when parameter value is Y', (done) => {
      const mockResponse = { data: { ethnicRequired: 'Y' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEthnicRequired().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_ETHNIC_REQUIRED);
        expect(result).toBeTrue();
        done();
      });
    });

    it('should return false when parameter value is N', (done) => {
      const mockResponse = { data: { ethnicRequired: 'N' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false on API error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API error')));

      service.getEthnicRequired().subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });
    });
  });

  describe('non-cached lookups', () => {
    it('should call getProcedureCodes with correct endpoint', (done) => {
      const mockResponse = { data: [{ procedureCode: 'PP', description: 'Platelet Pheresis' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcedureCodes('AL').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_PROCEDURE_CODES('AL'));
        expect(result[0].procedureCode).toBe('PP');
        done();
      });
    });

    it('should call getInterdictions with correct endpoint', (done) => {
      const mockResponse = { data: [{ interCode: 'NOPLM', interDesc: 'Not properly recorded', interType: 'HOLDS' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getInterdictions().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_INTERDICTIONS);
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should call getEmployers with correct endpoint', (done) => {
      const mockResponse = { data: [{ employerId: 'EMP1', employerName: 'Mediware' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEmployers('Med').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_EMPLOYERS('Med'));
        expect(result[0].employerName).toBe('Mediware');
        done();
      });
    });

    it('should call getCities with correct endpoint', (done) => {
      const mockResponse = { data: [{ city: 'Dallas', state: 'TX' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getCities('Dal').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.GET_CITIES('Dal'));
        expect(result[0].city).toBe('Dallas');
        done();
      });
    });
  });

  describe('getZipLookup', () => {
    it('should call GET with correct endpoint and return cities for zip', (done) => {
      const mockResponse = { data: [{ city: 'Dallas', state: 'TX', zip: '75001', uspsId: 1 }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getZipLookup('75001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.ZIP_LOOKUP('75001'));
        expect(result[0].city).toBe('Dallas');
        expect(result[0].zip).toBe('75001');
        done();
      });
    });
  });

  describe('getZipsByCity', () => {
    it('should return mapped zip options from getCities results', (done) => {
      const mockResponse = { data: [
        { city: 'DALLAS', state: 'TX', zip: '75001', uspsId: 1 },
        { city: 'DALLAS', state: 'TX', zip: '75002', uspsId: 2 },
      ] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getZipsByCity('DALLAS').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('75001');
        expect(result[0].description).toBe('DALLAS - TX');
        expect(result[1].code).toBe('75002');
        done();
      });
    });

    it('should filter out entries with empty zip', (done) => {
      const mockResponse = { data: [
        { city: 'DALLAS', state: 'TX', zip: '75001', uspsId: 1 },
        { city: 'DALLAS', state: 'TX', zip: '', uspsId: 2 },
        { city: 'DALLAS', state: 'TX', zip: null, uspsId: 3 },
      ] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getZipsByCity('DALLAS').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('75001');
        done();
      });
    });

    it('should return empty array when no cities found', (done) => {
      const mockResponse = { data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getZipsByCity('UNKNOWN').subscribe((result) => {
        expect(result.length).toBe(0);
        done();
      });
    });
  });

  describe('validation endpoints', () => {
    it('should call checkAgeLimits with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.checkAgeLimits('1990-01-01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.CHECK_AGE_LIMITS('1990-01-01'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call checkOnlineDonation with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: { hasOnlineRegistration: true } }));

      service.checkOnlineDonation('DN001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.CHECK_ONLINE_DONATION('DN001'));
        expect(result.hasOnlineRegistration).toBeTrue();
        done();
      });
    });

    it('should call validateStaff with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateStaff('CJH123', '2025-01-01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_STAFF('CJH123', '2025-01-01'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateDonationTypeField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateDonationTypeField('WB').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_DONATION_TYPE('WB'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateProcedureCodeField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateProcedureCodeField('WB', 'PP').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_PROCEDURE_CODE('WB', 'PP'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateEquipmentTypeField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateEquipmentTypeField('EQ1').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_EQUIPMENT_TYPE('EQ1'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateDeferralReasonField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateDeferralReasonField('MED', 'WB', '2025-01-01').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_DEFERRAL_REASON('MED', 'WB', '2025-01-01'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateCityField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateCityField('Dallas').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_CITY('Dallas'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateZipCityField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateZipCityField('Dallas', '75001').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_ZIP_CITY('Dallas', '75001'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateEthnicGroupField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateEthnicGroupField('CA').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_ETHNIC_GROUP('CA'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });

    it('should call validateAlternateIdTypeField with correct endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ isValid: true }));

      service.validateAlternateIdTypeField('DL').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.VALIDATE_ALTERNATE_ID_TYPE('DL'));
        expect(result.isValid).toBeTrue();
        done();
      });
    });
  });

  describe('createEmployer', () => {
    it('should call POST with correct endpoint and return created employer', (done) => {
      const request = { employerName: 'New Corp', city: 'Dallas', state: 'TX', zip: '75001' };
      const mockResponse = { data: { employerId: 'EMP999', employerName: 'New Corp' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createEmployer(request).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(API.REGISTER_DEFERRAL.CREATE_EMPLOYER, request);
        expect(result.employerId).toBe('EMP999');
        done();
      });
    });
  });

  describe('clearCaches', () => {
    it('should clear all caches allowing fresh API calls', () => {
      const mockResponse = { data: [{ code: 'WB', description: 'Whole Blood' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationTypes().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);

      service.clearCaches();

      service.getDonationTypes().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear employees cache', () => {
      const mockResponse = { data: [{ staffNo: 'S001' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEmployees('2025-01-01').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);

      service.clearCaches();

      service.getEmployees('2025-01-01').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear equipment types cache', () => {
      const mockResponse = { data: [{ code: 'EQ1' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEquipmentTypes().subscribe();
      service.clearCaches();
      service.getEquipmentTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear ethnic groups cache', () => {
      const mockResponse = { data: [{ code: 'CA' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEthnicGroups().subscribe();
      service.clearCaches();
      service.getEthnicGroups().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear deferral types cache', () => {
      const mockResponse = { data: [{ code: 'NA' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralTypes().subscribe();
      service.clearCaches();
      service.getDeferralTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should clear alternate ID types cache', () => {
      const mockResponse = { data: [{ code: 'DL' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAlternateIdTypes().subscribe();
      service.clearCaches();
      service.getAlternateIdTypes().subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledTimes(2);
    });
  });
});
