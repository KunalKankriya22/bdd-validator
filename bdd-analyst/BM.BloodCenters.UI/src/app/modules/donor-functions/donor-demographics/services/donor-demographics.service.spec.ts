import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DonorDemographicsService } from './donor-demographics.service';
import { environment } from '../../../../../environments/environment';
import {
  DonorDemographicsDto,
  UpdateDonorDemographicsDto,
  ReturnResult
} from '../models/donor-demographics.model';

describe('DonorDemographicsService', () => {
  let service: DonorDemographicsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/donor-demographics`;

  const mockDemographicsDto: DonorDemographicsDto = {
    donorId: 'D123456789',
    chapterId: 'CHI',
    header: {
      name: 'Rogers, Shelia MAry',
      dateOfBirth: '2002-12-12',
      sex: 'Female',
      abo: 'O Pos'
    },
    address: {
      streetName: '82 LONG',
      suiteApt: null,
      city: 'DALLAS',
      state: 'Texas',
      zip: '66207',
      county: 'DALLAS',
      uspsId: 12345,
      intlAddress1: null,
      intlAddress2: null,
      intlAddress3: null,
      intlAddress4: null,
      countryName: null,
      intlPostalCode: null,
      intlWorkPhoneNo: null,
      intlWorkPhoneExt: null,
      intlHomePhoneNo: null,
      intlMobilePhoneNo: null,
      intlFaxNo: null
    },
    phones: {
      home: {
        areaCode: '+214',
        phoneNo: '234-567-89'
      },
      work: {
        areaCode: '+214',
        phoneNo: '234-567-89',
        extension: null
      },
      mobile: {
        areaCode: '+817',
        phoneNo: '234-567-89'
      },
      preferredContact: 'M'
    },
    email: 'kim.mubee@hotmail.com',
    personalInfo: {
      language: 'ENG',
      alias: 'SHEQ',
      lastNameSuffix: null,
      ethnicGroup: 'CA',
      salutation: null,
      height: "5' 6\"",
      donorWeight: 100,
      claimedDonations: 1
    },
    employer: {
      employerId: 'EMP001',
      employerName: 'WELLSKY',
      city: 'OVERLAND PARK',
      zip: '62207',
      state: 'KS'
    },
    intlAddrFlag: 'N'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorDemographicsService]
    });

    service = TestBed.inject(DonorDemographicsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDemographics', () => {
    it('should retrieve donor demographics successfully', () => {
      const donorId = 'D123456789';
      const mockResponse: ReturnResult<DonorDemographicsDto> = {
        success: true,
        message: 'Donor demographics retrieved successfully',
        statusCode: 200,
        item: mockDemographicsDto
      };

      service.getDemographics(donorId).subscribe(data => {
        expect(data).toEqual(mockDemographicsDto);
        expect(data.donorId).toBe(donorId);
        expect(data.address.streetName).toBe('82 LONG');
        expect(data.phones.preferredContact).toBe('M');
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 error when donor not found', () => {
      const donorId = 'INVALID';

      service.getDemographics(donorId).subscribe({
        next: () => fail('Should have failed with 404 error'),
        error: (error: Error) => {
          expect(error.message).toContain('Donor not found');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });

    it('should handle server error', () => {
      const donorId = 'D123456789';

      service.getDemographics(donorId).subscribe({
        next: () => fail('Should have failed with server error'),
        error: (error: Error) => {
          expect(error.message).toContain('Server error');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('updateDemographics', () => {
    it('should update donor demographics successfully', () => {
      const donorId = 'D123456789';
      const updateData: UpdateDonorDemographicsDto = {
        address: {
          streetName: '456 Oak Avenue',
          suiteApt: 'Suite 100',
          city: null,
          zip: null,
          state: null,
          county: null,
          uspsId: 12346,
          intlAddress1: null,
          intlAddress2: null,
          intlAddress3: null,
          intlAddress4: null,
          countryName: null,
          intlPostalCode: null,
          intlAddrFlag: null,
          intlWorkPhoneNo: null,
          intlWorkPhoneExt: null,
          intlHomePhoneNo: null,
          intlMobilePhoneNo: null,
          intlFaxNo: null
        },
        phones: {
          home: {
            areaCode: '312',
            phoneNo: '5551234'
          },
          work: null,
          mobile: {
            areaCode: '312',
            phoneNo: '5559999'
          },
          preferredContact: 'M'
        },
        email: 'newemail@example.com',
        personalInfo: {
          language: 'EN',
          alias: 'Johnny',
          lastNameSuffix: 'Jr',
          ethnicGroup: 'CAUC',
          salutation: 'Mr',
          height: "6' 0\"",
          donorWeight: 185,
          claimedDonations: 26
        }
      };

      const mockResponse: ReturnResult<void> = {
        success: true,
        message: 'Donor demographics updated successfully',
        statusCode: 200
      };

      service.updateDemographics(donorId, updateData).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Donor demographics updated successfully');
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });

    it('should handle validation error for missing weight', () => {
      const donorId = 'D123456789';
      const updateData: UpdateDonorDemographicsDto = {
        address: {
          streetName: '123 Main',
          suiteApt: null,
          city: null,
          zip: null,
          state: null,
          county: null,
          uspsId: 12345,
          intlAddress1: null,
          intlAddress2: null,
          intlAddress3: null,
          intlAddress4: null,
          countryName: null,
          intlPostalCode: null,
          intlAddrFlag: null,
          intlWorkPhoneNo: null,
          intlWorkPhoneExt: null,
          intlHomePhoneNo: null,
          intlMobilePhoneNo: null,
          intlFaxNo: null
        },
        phones: {
          home: null,
          work: null,
          mobile: null,
          preferredContact: null
        },
        email: null,
        personalInfo: {
          language: null,
          alias: null,
          lastNameSuffix: null,
          ethnicGroup: null,
          salutation: null,
          height: null,
          donorWeight: null,
          claimedDonations: null
        }
      };

      const errorResponse = {
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        errorCode: '0080',
        errorResponse: {
          errorCode: '0080',
          error: 'Required field'
        }
      };

      service.updateDemographics(donorId, updateData).subscribe({
        next: () => fail('Should have failed with validation error'),
        error: (error: Error) => {
          expect(error.message).toContain('Validation failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle validation error for invalid weight', () => {
      const donorId = 'D123456789';
      const updateData: UpdateDonorDemographicsDto = {
        address: {
          streetName: '123 Main',
          suiteApt: null,
          city: null,
          zip: null,
          state: null,
          county: null,
          uspsId: 12345,
          intlAddress1: null,
          intlAddress2: null,
          intlAddress3: null,
          intlAddress4: null,
          countryName: null,
          intlPostalCode: null,
          intlAddrFlag: null,
          intlWorkPhoneNo: null,
          intlWorkPhoneExt: null,
          intlHomePhoneNo: null,
          intlMobilePhoneNo: null,
          intlFaxNo: null
        },
        phones: {
          home: null,
          work: null,
          mobile: null,
          preferredContact: null
        },
        email: null,
        personalInfo: {
          language: null,
          alias: null,
          lastNameSuffix: null,
          ethnicGroup: null,
          salutation: null,
          height: null,
          donorWeight: 0,
          claimedDonations: null
        }
      };

      const errorResponse = {
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        errorCode: '1536',
        errorResponse: {
          errorCode: '1536',
          error: 'Weight must be at least 1'
        }
      };

      service.updateDemographics(donorId, updateData).subscribe({
        next: () => fail('Should have failed with validation error'),
        error: (error: Error) => {
          expect(error.message).toContain('Validation failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Master Code Lookups', () => {
    const lookupsUrl = `${environment.apiUrl}/api/v1/shared/lookups`;

    it('should retrieve language options', () => {
      const mockResponse = {
        data: [
          { code: 'EN', description: 'English', isActive: true },
          { code: 'ES', description: 'Spanish', isActive: true }
        ]
      };

      service.getLanguages().subscribe(languages => {
        expect(languages.length).toBe(2);
        expect(languages[0].code).toBe('EN');
        expect(languages[0].description).toBe('English');
      });

      const req = httpMock.expectOne(r => r.url === `${lookupsUrl}/LANG`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('activeOnly')).toBe('true');
      req.flush(mockResponse);
    });

    it('should retrieve ethnicity options', () => {
      const mockResponse = {
        data: [
          { code: 'CAUC', description: 'Caucasian', isActive: true },
          { code: 'HISP', description: 'Hispanic', isActive: true }
        ]
      };

      service.getEthnicities().subscribe(ethnicities => {
        expect(ethnicities.length).toBe(2);
        expect(ethnicities.some(e => e.code === 'CAUC')).toBeTrue();
      });

      const req = httpMock.expectOne(r => r.url === `${lookupsUrl}/ETHGP`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('activeOnly')).toBe('true');
      req.flush(mockResponse);
    });

    it('should retrieve salutation options', () => {
      const mockResponse = {
        data: [
          { code: 'Mr', description: 'Mister', isActive: true },
          { code: 'Mrs', description: 'Missus', isActive: true }
        ]
      };

      service.getSalutations().subscribe(salutations => {
        expect(salutations.length).toBe(2);
        expect(salutations.some(s => s.code === 'Mr')).toBeTrue();
      });

      const req = httpMock.expectOne(r => r.url === `${lookupsUrl}/SALUT`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('activeOnly')).toBe('false');
      req.flush(mockResponse);
    });
  });
});
