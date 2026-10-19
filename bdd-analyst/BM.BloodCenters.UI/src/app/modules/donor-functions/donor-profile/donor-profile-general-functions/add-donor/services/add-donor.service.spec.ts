import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AddDonorService } from './add-donor.service';
import { ApiService } from '@shared/services/api.service';

describe('AddDonorService', () => {
  let service: AddDonorService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AddDonorService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AddDonorService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('createDonor', () => {
    it('should call POST with the create donor endpoint', (done) => {
      const request = { lastName: 'SMITH', firstName: 'JOHN', gender: 'M', address: {} } as any;
      const mockResponse = { success: true, message: '', statusCode: 200, data: { donorId: 'DN001' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createDonor(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.post).toHaveBeenCalledWith('/api/v1/donors', request);
          done();
        }
      });
    });

    it('should propagate error on failure', (done) => {
      const request = { lastName: 'SMITH', gender: 'M', address: {} } as any;
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.createDonor(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server error');
          done();
        }
      });
    });
  });

  describe('modifyDonor', () => {
    it('should call PUT with the modify donor endpoint', (done) => {
      const donorId = 'DN001';
      const request = { donorId: 'DN001', lastName: 'JONES', gender: 'F', address: {} } as any;
      const mockResponse = { success: true, message: '', statusCode: 200, data: {} };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.modifyDonor(donorId, request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(apiServiceSpy.put).toHaveBeenCalledWith('/api/v1/donors/DN001', request);
          done();
        }
      });
    });

    it('should propagate error on failure', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Update failed')));

      service.modifyDonor('DN001', {} as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        }
      });
    });
  });

  describe('getDonorById', () => {
    const baseDonorRaw: Record<string, unknown> = {
      donorId: 'DN001',
      lastName: 'SMITH',
      firstName: 'JOHN',
      middleName: 'A',
      salutation: 'Mr',
      alias: 'JS',
      lastNameSuffix: 'Jr',
      gender: 'M',
      dateOfBirth: '1990-01-15',
      ethnicGroup: 'CA',
      alternateId: 'ALT001',
      alternateIdType: 'DL',
      claimedDonation: 5,
      lang: 'ENG',
      scanId: 'SC001',
      bloodType: 'O+',
      status: 'A',
      streetName: '123 Main St',
      suiteApt: 'Apt 4',
      city: 'DALLAS',
      state: 'TX',
      zip: '75001',
      uspsId: 12345,
      hAreaCode: '214',
      hPhoneNo: '5551234',
      dAreaCode: '972',
      dPhoneNo: '5555678',
      mAreaCode: '469',
      mPhoneNo: '5559999',
      preferredContactFlag: 'H',
      email: 'john@example.com',
      employerId: 'EMP01',
      empName: 'ACME Corp',
      eCity: 'PLANO',
      eState: 'TX',
      eZip: '75024',
      prevBloodCenter: 'BC01',
      previosDonorId: 'OLD001',
      migratedUnit: 3,
      migratedCity: 'HOUSTON',
      migratedState: 'TX',
      migratedZip: '77001',
      migratedStreetName: '456 Oak Ave',
      migratedSuiteApt: 'Suite 10',
      intlAddrFlag: 'N',
      insertDate: '2024-01-01',
      insertUser: 'admin'
    };

    it('should extract first element from array response.data', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [baseDonorRaw]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN001').subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DN001');
          expect(result.lastName).toBe('SMITH');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/DN001');
          done();
        }
      });
    });

    it('should handle non-array response.data', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: baseDonorRaw
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN001').subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DN001');
          expect(result.firstName).toBe('JOHN');
          done();
        }
      });
    });

    it('should throw error when data is null', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: null
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor not found');
          done();
        }
      });
    });

    it('should throw error when data is empty array', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: []
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor not found');
          done();
        }
      });
    });

    it('should propagate API error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDonorById('DN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          done();
        }
      });
    });
  });

  describe('mapToDonorData (via getDonorById)', () => {
    it('should map domestic address fields correctly', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN002',
        lastName: 'DOE',
        firstName: 'JANE',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'F',
        dateOfBirth: '1985-06-20',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: 'A+',
        status: 'A',
        streetName: '789 Elm Blvd',
        suiteApt: 'Unit 2B',
        city: 'AUSTIN',
        state: 'TX',
        zip: '73301',
        uspsId: 67890,
        hAreaCode: '512',
        hPhoneNo: '1112222',
        dAreaCode: '512',
        dPhoneNo: '3334444',
        mAreaCode: '512',
        mPhoneNo: '5556666',
        preferredContactFlag: 'M',
        email: 'jane@example.com',
        employerId: '',
        empName: '',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        insertDate: '2024-03-01',
        insertUser: 'operator'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN002').subscribe({
        next: (result) => {
          expect(result.streetName).toBe('789 Elm Blvd');
          expect(result.suiteApt).toBe('Unit 2B');
          expect(result.city).toBe('AUSTIN');
          expect(result.state).toBe('TX');
          expect(result.zip).toBe('73301');
          expect(result.uspsId).toBe(67890);
          expect(result.homeAreaCode).toBe('512');
          expect(result.homePhoneNo).toBe('1112222');
          expect(result.workAreaCode).toBe('512');
          expect(result.workPhoneNo).toBe('3334444');
          expect(result.mobileAreaCode).toBe('512');
          expect(result.mobilePhoneNo).toBe('5556666');
          expect(result.preferredContactFlag).toBe('M');
          expect(result.email).toBe('jane@example.com');
          expect(result.intlAddrFlag).toBe('N');
          expect(result.internationalAddress).toBeNull();
          expect(result.alternateAddress).toBeNull();
          expect(result.ssn).toBe('');
          expect(result.workExtension).toBe('');
          expect(result.ethnicGroupDescription).toBe('');
          done();
        }
      });
    });

    it('should map international address when intlAddrFlag is Y', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN003',
        lastName: 'MULLER',
        firstName: 'HANS',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'M',
        dateOfBirth: '1975-11-05',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: 'A',
        streetName: '',
        suiteApt: '',
        city: '',
        state: '',
        zip: '',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '',
        mPhoneNo: '',
        preferredContactFlag: '',
        email: 'hans@example.de',
        employerId: '',
        empName: '',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'Y',
        intlAddress1: 'Hauptstrasse 42',
        intlAddress2: 'Building B',
        intlAddress3: 'Floor 3',
        intlAddress4: '',
        countryName: 'Germany',
        intlPostalCode: '10115',
        intlHomePhoneNo: '4930111222',
        intlWorkPhoneNo: '4930333444',
        intlWorkPhoneExt: '55',
        intlMobilePhoneNo: '491701234567',
        intlFaxNo: '4930555666',
        insertDate: '2024-02-15',
        insertUser: 'admin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN003').subscribe({
        next: (result) => {
          expect(result.intlAddrFlag).toBe('Y');
          expect(result.internationalAddress).toBeTruthy();
          expect(result.internationalAddress!.streetName).toBe('Hauptstrasse 42');
          expect(result.internationalAddress!.addr1).toBe('Hauptstrasse 42');
          expect(result.internationalAddress!.addr2).toBe('Building B');
          expect(result.internationalAddress!.addr3).toBe('Floor 3');
          expect(result.internationalAddress!.addr4).toBe('');
          expect(result.internationalAddress!.country).toBe('Germany');
          expect(result.internationalAddress!.postalCode).toBe('10115');
          expect(result.internationalAddress!.homePhoneNo).toBe('4930111222');
          expect(result.internationalAddress!.workPhoneNo).toBe('4930333444');
          expect(result.internationalAddress!.workPhoneExt).toBe('55');
          expect(result.internationalAddress!.mobilePhoneNo).toBe('491701234567');
          expect(result.internationalAddress!.faxNo).toBe('4930555666');
          expect(result.internationalAddress!.email).toBe('hans@example.de');
          expect(result.internationalAddress!.intlAddrFlag).toBe('Y');
          done();
        }
      });
    });

    it('should build alternateAddress when altStreetName is present', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN004',
        lastName: 'PATEL',
        firstName: 'RAJ',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'M',
        dateOfBirth: '1988-04-10',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: 'A',
        streetName: '100 Primary Rd',
        suiteApt: '',
        city: 'CHICAGO',
        state: 'IL',
        zip: '60601',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '312',
        mPhoneNo: '7778888',
        preferredContactFlag: 'M',
        email: '',
        employerId: '',
        empName: '',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        altStreetName: '200 Alternate Ave',
        altSuiteApt: 'Suite 5',
        altCity: 'EVANSTON',
        altState: 'IL',
        altZip: '60201',
        altUspsId: 99999,
        altIntlAddrFlag: 'N',
        preferredContactAddrFlag: 'A',
        otherContactNo: '3129990000',
        insertDate: '2024-05-01',
        insertUser: 'admin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN004').subscribe({
        next: (result) => {
          expect(result.alternateAddress).toBeTruthy();
          expect(result.alternateAddress!.addressType).toBe('L');
          expect(result.alternateAddress!.streetName).toBe('200 Alternate Ave');
          expect(result.alternateAddress!.suiteApt).toBe('Suite 5');
          expect(result.alternateAddress!.city).toBe('EVANSTON');
          expect(result.alternateAddress!.state).toBe('IL');
          expect(result.alternateAddress!.zip).toBe('60201');
          expect(result.alternateAddress!.uspsId).toBe(99999);
          expect(result.alternateAddress!.preferredContactAddress).toBe('A');
          expect(result.alternateAddress!.otherContactNumber).toBe('3129990000');
          expect(result.alternateAddress!.mobilePhoneNumber).toBe('3127778888');
          done();
        }
      });
    });

    it('should set alternateAddress addressType to I when altIntlAddrFlag is Y', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN005',
        lastName: 'KIM',
        firstName: 'SUN',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'F',
        dateOfBirth: '1992-08-22',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: 'A',
        streetName: '',
        suiteApt: '',
        city: '',
        state: '',
        zip: '',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '',
        mPhoneNo: '',
        preferredContactFlag: '',
        email: '',
        employerId: '',
        empName: '',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        altIntlAddrFlag: 'Y',
        altIntlAddress1: 'Seoul Apt 123',
        altCountryName: 'South Korea',
        altIntlPostalCode: '06164',
        altIntlPhoneNo: '821012345678',
        insertDate: '2024-06-01',
        insertUser: 'admin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN005').subscribe({
        next: (result) => {
          expect(result.alternateAddress).toBeTruthy();
          expect(result.alternateAddress!.addressType).toBe('I');
          expect(result.alternateAddress!.intlAddress1).toBe('Seoul Apt 123');
          expect(result.alternateAddress!.countryName).toBe('South Korea');
          expect(result.alternateAddress!.intlPostalCode).toBe('06164');
          expect(result.alternateAddress!.intlAddrFlag).toBe('Y');
          expect(result.alternateAddress!.altIntlPhoneNumber).toBe('821012345678');
          done();
        }
      });
    });

    it('should map employer international address when empIntlAddrFlag is Y', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN006',
        lastName: 'GARCIA',
        firstName: 'MARIA',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'F',
        dateOfBirth: '1980-02-14',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: 'A',
        streetName: '',
        suiteApt: '',
        city: '',
        state: '',
        zip: '',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '',
        mPhoneNo: '',
        preferredContactFlag: '',
        email: '',
        employerId: 'EMP_INTL',
        empName: 'Global Corp',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        empIntlAddrFlag: 'Y',
        empIntlAddress1: 'Calle Principal 99',
        empIntlAddress2: 'Piso 2',
        empIntlAddress3: '',
        empIntlAddress4: '',
        empCountryName: 'Mexico',
        empIntlPostalCode: '06600',
        empIntlHomePhoneNo: '525511112222',
        empIntlWorkPhoneNo: '525533334444',
        empIntlWorkPhoneExt: '100',
        empIntlMobilePhoneNo: '525555556666',
        empIntlFaxNo: '525577778888',
        empEmail: 'maria@globalcorp.mx',
        insertDate: '2024-07-01',
        insertUser: 'admin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN006').subscribe({
        next: (result) => {
          expect(result.employerIntlAddrFlag).toBe('Y');
          expect(result.employerInternationalAddress).toBeTruthy();
          expect(result.employerInternationalAddress!.country).toBe('Mexico');
          expect(result.employerInternationalAddress!.postalCode).toBe('06600');
          expect(result.employerInternationalAddress!.intlAddrFlag).toBe('Y');
          expect((result.employerInternationalAddress as any).modifiedFlag).toBe('N');
          done();
        }
      });
    });

    it('should use employerName fallback when empName is absent', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN007',
        lastName: 'LEE',
        firstName: 'TAO',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: 'M',
        dateOfBirth: '1995-09-30',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: 'A',
        streetName: '',
        suiteApt: '',
        city: '',
        state: '',
        zip: '',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '',
        mPhoneNo: '',
        preferredContactFlag: '',
        email: '',
        employerId: 'EMP02',
        employerName: 'Fallback Corp',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        insertDate: '2024-08-01',
        insertUser: 'admin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN007').subscribe({
        next: (result) => {
          expect(result.employerName).toBe('Fallback Corp');
          done();
        }
      });
    });

    it('should map lastUpdated from insertDate', (done) => {
      const raw: Record<string, unknown> = {
        donorId: 'DN008',
        lastName: 'JONES',
        firstName: '',
        middleName: '',
        salutation: '',
        alias: '',
        lastNameSuffix: '',
        gender: '',
        dateOfBirth: '',
        ethnicGroup: '',
        alternateId: '',
        alternateIdType: '',
        claimedDonation: null,
        lang: '',
        scanId: '',
        bloodType: '',
        status: '',
        streetName: '',
        suiteApt: '',
        city: '',
        state: '',
        zip: '',
        uspsId: null,
        hAreaCode: '',
        hPhoneNo: '',
        dAreaCode: '',
        dPhoneNo: '',
        mAreaCode: '',
        mPhoneNo: '',
        preferredContactFlag: '',
        email: '',
        employerId: '',
        empName: '',
        eCity: '',
        eState: '',
        eZip: '',
        prevBloodCenter: '',
        previosDonorId: '',
        migratedUnit: null,
        migratedCity: '',
        migratedState: '',
        migratedZip: '',
        migratedStreetName: '',
        migratedSuiteApt: '',
        intlAddrFlag: 'N',
        insertDate: '2024-09-15',
        insertUser: 'sysadmin'
      };

      const response = { success: true, message: '', statusCode: 200, data: [raw] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN008').subscribe({
        next: (result) => {
          expect(result.insertDate).toBe('2024-09-15');
          expect(result.insertUser).toBe('sysadmin');
          expect(result.lastUpdated).toBe('2024-09-15');
          done();
        }
      });
    });
  });

  describe('getCityStateByZip', () => {
    it('should call GET with the city-state lookup endpoint and map response.data', (done) => {
      const mockData = { uspsId: 100, city: 'DALLAS', state: 'TX', zip: '75001' };
      const response = { success: true, message: '', statusCode: 200, data: mockData };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCityStateByZip('75001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/city-state/75001');
          done();
        }
      });
    });

    it('should propagate error on failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getCityStateByZip('00000').subscribe({
        error: (err) => {
          expect(err.message).toBe('Not found');
          done();
        }
      });
    });
  });

  describe('getCitiesByZip', () => {
    it('should return mapped response data', (done) => {
      const mockData = [{ city: 'DALLAS', state: 'TX', zip: '75001', uspsId: 1 }];
      const response = { data: mockData };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCitiesByZip('75001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].city).toBe('DALLAS');
          done();
        }
      });
    });

    it('should return empty array when response has no data', (done) => {
      const response = {};
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCitiesByZip('00000').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getCitiesByZip('99999').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('extractLookupItems (via searchCities)', () => {
    it('should return empty array when data is null', (done) => {
      const response = { success: true, message: '', statusCode: 200, data: null };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('TEST').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should unwrap nested array data[0]', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'DALLAS', label: 'Dallas, TX' }, { value: 'DALY', label: 'Daly City, CA' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('DAL').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('DALLAS');
          expect(result[0].description).toBe('Dallas, TX');
          expect(result[1].code).toBe('DALY');
          expect(result[1].description).toBe('Daly City, CA');
          done();
        }
      });
    });

    it('should handle flat array data (not nested)', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [{ value: 'CHICAGO', label: 'Chicago, IL' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('CHI').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('CHICAGO');
          expect(result[0].description).toBe('Chicago, IL');
          done();
        }
      });
    });

    it('should fall back to Value/Label keys', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [{ Value: 'BOSTON', Label: 'Boston, MA' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('BOS').subscribe({
        next: (result) => {
          expect(result[0].code).toBe('BOSTON');
          expect(result[0].description).toBe('Boston, MA');
          done();
        }
      });
    });

    it('should fall back to code/description keys', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [{ code: 'DENVER', description: 'Denver, CO' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('DEN').subscribe({
        next: (result) => {
          expect(result[0].code).toBe('DENVER');
          expect(result[0].description).toBe('Denver, CO');
          done();
        }
      });
    });

    it('should return empty array when data is non-array (e.g., string)', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: 'unexpected'
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('TEST').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.searchCities('ERR').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getZipsByCity', () => {
    it('should call GET with the zips lookup endpoint', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: '75001', label: '75001' }, { value: '75002', label: '75002' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('75001');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/lookups/zips?city=DALLAS');
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getZipsByCity('INVALID').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('Lookup methods', () => {
    it('should call GET for employers endpoint', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'EMP01', label: 'ACME Corp' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('EMP01');
          expect(result[0].description).toBe('ACME Corp');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/lookups/employers');
          done();
        }
      });
    });

    it('should call GET for salutations endpoint', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'Mr', label: 'Mister' }, { value: 'Mrs', label: 'Missus' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupSalutations().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('Mr');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/lookups/salutations');
          done();
        }
      });
    });

    it('should call GET for ethnic groups endpoint', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'CA', label: 'Caucasian' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEthnicGroups().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('CA');
          expect(result[0].description).toBe('Caucasian');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/lookups/ethnic-groups');
          done();
        }
      });
    });

    it('should call GET for languages endpoint', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'ENG', label: 'English' }, { value: 'SPA', label: 'Spanish' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupLanguages().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('ENG');
          expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donors/lookups/languages');
          done();
        }
      });
    });

    it('should propagate error from lookup methods', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Lookup failed')));

      service.getLookupEmployers().subscribe({
        error: (err) => {
          expect(err.message).toBe('Lookup failed');
          done();
        }
      });
    });
  });
});
