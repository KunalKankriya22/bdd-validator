import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonorDetailQueryService } from './donor-detail-query.service';

describe('DonorDetailQueryService', () => {
  let service: DonorDetailQueryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorDetailQueryService],
    });
    service = TestBed.inject(DonorDetailQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  describe('getDonorDetail', () => {
    it('should return donor detail for valid donor ID', (done) => {
      const donorId = '00008392';

      // Mock API responses
      const mockDonorResponse = {
        item: {
          lastName: 'ROGERS',
          firstName: 'MARY',
          middleName: '',
          dateOfBirth: '1998-01-11',
          gender: 'Female',
          bloodType: 'O+',
          homePhone: '214-559-4459',
          mobilePhone: '817-614-7156',
          businessPhone: '555-123-4567',
          address: '214 Kings Cir Houston TX 76234',
          lifetimeDonations: 3,
          lifetimeCredit: 214,
          yearToDateDonations: 0,
          yearToDateCredit: 0,
          lifetimeGallons: 2,
          nextGallonCredit: 1,
          donorSince: '2024-02-19',
          donorYear: '1',
          lastDonationUnitId: 'WN3131 19 00093 00',
          lastDonationDate: '2025-01-23',
          lastDonationType: 'AL',
          lastProcedureCode: 'WB',
        },
      };

      const mockProcedureCodesResponse = {
        data: [
          { procedureCode: 'WB', eligibilityStatus: 'Yes', deferralReason: 'Eligible for donation' },
          { procedureCode: 'AL', eligibilityStatus: 'Yes', deferralReason: 'Eligible for donation' },
        ],
      };

      const mockAttributesResponse = {
        data: [
          [
            { interCode: 'CMV', interType: 'PROPR', interDesc: 'CMV Negative' },
          ]
        ],
      };

      service.getDonorDetail(donorId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.donor).toBeTruthy();
        expect(response.donor.donorId).toBe(donorId);
        expect(response.donor.lastName).toBe('ROGERS');
        expect(response.donor.firstName).toBe('MARY');
        expect(response.donor.phoneWork).toBe('555-123-4567');
        expect(response.eligibility).toBeDefined();
        expect(response.eligibility.length).toBeGreaterThan(0);
        expect(response.attributes).toBeDefined();
        expect(response.attributes.length).toBeGreaterThan(0);
        done();
      });

      // Expect and respond to HTTP requests
      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      expect(donorReq.request.method).toBe('GET');
      donorReq.flush(mockDonorResponse);

      const procedureReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      expect(procedureReq.request.method).toBe('GET');
      procedureReq.flush(mockProcedureCodesResponse);

      const attributesReq = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      expect(attributesReq.request.method).toBe('GET');
      attributesReq.flush(mockAttributesResponse);
    });

    it('should throw error for invalid donor ID', (done) => {
      const donorId = 'INVALID';

      service.getDonorDetail(donorId).subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Donor not found');

          // Clean up any remaining pending requests after the error
          setTimeout(() => {
            const pending = httpMock.match(() => true);
            pending.forEach(req => {
              if (!req.cancelled) {
                req.flush({}, { status: 200, statusText: 'OK' });
              }
            });
            done();
          }, 10);
        }
      });

      // ForkJoin makes all three requests in parallel
      // Flush the donor detail request with an error - this will cause forkJoin to error immediately
      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      donorReq.flush({ error: 'NOT FOUND' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDonorEligibility', () => {
    it('should return eligibility records for valid donor', (done) => {
      const donorId = '00008392';

      const mockResponse = {
        data: [
          { procedureCode: 'WB', eligibilityStatus: 'Yes', deferralReason: 'Eligible for donation' },
          { procedureCode: 'AL', eligibilityStatus: 'No', deferralDate: '2025-06-01', deferralReason: 'Deferred until date' },
        ],
      };

      service.getDonorEligibility(donorId).subscribe((eligibility) => {
        expect(eligibility).toBeDefined();
        expect(Array.isArray(eligibility)).toBe(true);
        expect(eligibility.length).toBeGreaterThan(0);
        expect(eligibility[0].proc).toBe('WB');
        done();
      });

      const req = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array for donor with no eligibility', (done) => {
      const donorId = 'NONEXISTENT';

      service.getDonorEligibility(donorId).subscribe((eligibility) => {
        expect(eligibility).toEqual([]);
        done();
      });

      // Mock 404 error - service should catch and return empty array
      const req = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      req.flush({ error: 'NOT FOUND' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDonorAttributes', () => {
    it('should return attributes for valid donor', (done) => {
      const donorId = '00008392';

      const mockResponse = {
        data: [
          [
            { interCode: 'CMV', interType: 'PROPR', interDesc: 'CMV Negative' },
            { interCode: 'RARE', interType: 'PROPR', interDesc: 'Rare Blood Type' },
          ]
        ],
      };

      service.getDonorAttributes(donorId).subscribe((attributes) => {
        expect(attributes).toBeDefined();
        expect(Array.isArray(attributes)).toBe(true);
        expect(attributes.length).toBe(2);
        expect(attributes[0].code).toBe('CMV');
        expect(attributes[0].type).toBe('PROPR');
        expect(attributes[0].description).toBe('CMV Negative');
        done();
      });

      const req = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array for donor with no attributes', (done) => {
      const donorId = 'NONEXISTENT';

      service.getDonorAttributes(donorId).subscribe((attributes) => {
        expect(attributes).toEqual([]);
        done();
      });

      // Mock 404 error - service should catch and return empty array
      const req = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      req.flush({ error: 'NOT FOUND' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle empty nested array response', (done) => {
      const donorId = '12345';

      const mockResponse = {
        data: [],
      };

      service.getDonorAttributes(donorId).subscribe((attributes) => {
        expect(attributes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      req.flush(mockResponse);
    });
  });

  describe('formatDate', () => {
    it('should format valid date to DD-MMM-YYYY', () => {
      const date = '2025-01-23';
      const formatted = service.formatDate(date);
      expect(formatted).toBe('23-JAN-2025');
    });

  });

  describe('Phone number mapping', () => {
    it('should map businessPhone to phoneWork field', (done) => {
      const donorId = '12345';

      const mockDonorResponse = {
        item: {
          lastName: 'TEST',
          firstName: 'USER',
          gender: 'Male',
          bloodType: 'A+',
          homePhone: '555-1111',
          mobilePhone: '555-2222',
          businessPhone: '555-3333',
          dateOfBirth: '1990-01-01',
          address: '123 Main St City ST 12345',
        },
      };

      const mockProcedureCodesResponse = { data: [] };
      const mockAttributesResponse = { data: [] };

      service.getDonorDetail(donorId).subscribe((response) => {
        expect(response.donor.phoneHome).toBe('555-1111');
        expect(response.donor.phoneMobile).toBe('555-2222');
        expect(response.donor.phoneWork).toBe('555-3333');
        done();
      });

      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      donorReq.flush(mockDonorResponse);

      const procedureReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      procedureReq.flush(mockProcedureCodesResponse);

      const attributesReq = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      attributesReq.flush(mockAttributesResponse);
    });


  });

  describe('Address parsing', () => {
    it('should parse address string correctly', (done) => {
      const donorId = '12345';

      const mockDonorResponse = {
        item: {
          lastName: 'TEST',
          firstName: 'USER',
          gender: 'Male',
          bloodType: 'A+',
          dateOfBirth: '1990-01-01',
          address: '505 WALSH ST DENVER CO 80205',
        },
      };

      const mockProcedureCodesResponse = { data: [] };
      const mockAttributesResponse = { data: [] };

      service.getDonorDetail(donorId).subscribe((response) => {
        // Address parser extracts components from the string
        expect(response.donor.address.line1).toBeDefined();
        expect(response.donor.address.city).toBeDefined();
        expect(response.donor.address.state).toBe('CO');
        expect(response.donor.address.zipCode).toBe('80205');
        done();
      });

      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      donorReq.flush(mockDonorResponse);

      const procedureReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      procedureReq.flush(mockProcedureCodesResponse);

      const attributesReq = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      attributesReq.flush(mockAttributesResponse);
    });

    it('should handle empty address string', (done) => {
      const donorId = '12345';

      const mockDonorResponse = {
        item: {
          lastName: 'TEST',
          firstName: 'USER',
          gender: 'Male',
          bloodType: 'A+',
          dateOfBirth: '1990-01-01',
          address: '',
        },
      };

      const mockProcedureCodesResponse = { data: [] };
      const mockAttributesResponse = { data: [] };

      service.getDonorDetail(donorId).subscribe((response) => {
        expect(response.donor.address.line1).toBe('');
        expect(response.donor.address.city).toBe('');
        expect(response.donor.address.state).toBe('');
        expect(response.donor.address.zipCode).toBe('');
        done();
      });

      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      donorReq.flush(mockDonorResponse);

      const procedureReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      procedureReq.flush(mockProcedureCodesResponse);

      const attributesReq = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      attributesReq.flush(mockAttributesResponse);
    });
  });

  describe('Preferred contact flag mapping', () => {
    it('should map preferred contact flag from API', (done) => {
      const donorId = '12345';

      const mockDonorResponse = {
        item: {
          lastName: 'TEST',
          firstName: 'USER',
          gender: 'Male',
          bloodType: 'A+',
          dateOfBirth: '1990-01-01',
          address: '123 Main St City ST 12345',
          homePhone: '555-1111',
          mobilePhone: '555-2222',
          businessPhone: '555-3333',
          preferredContactFlag: 'M',
        },
      };

      const mockProcedureCodesResponse = { data: [] };
      const mockAttributesResponse = { data: [] };

      service.getDonorDetail(donorId).subscribe((response) => {
        expect(response.donor.preferredContactFlag).toBe('M');
        done();
      });

      const donorReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}`);
      donorReq.flush(mockDonorResponse);

      const procedureReq = httpMock.expectOne(`/api/v1/donors/detail-query/${donorId}/procedure-codes`);
      procedureReq.flush(mockProcedureCodesResponse);

      const attributesReq = httpMock.expectOne(`/api/v1/donor-attributes/${donorId}/active`);
      attributesReq.flush(mockAttributesResponse);
    });
  });
});
