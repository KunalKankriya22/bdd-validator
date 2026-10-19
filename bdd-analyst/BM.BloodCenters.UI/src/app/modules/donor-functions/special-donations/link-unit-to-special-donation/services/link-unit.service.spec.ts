import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LinkUnitService } from './link-unit.service';
import { PatientQueryParams } from '../models/patient.model';
import { LinkUnitRequest, UnlinkUnitRequest } from '../models/special-donor.model';

describe('LinkUnitService', () => {
  let service: LinkUnitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LinkUnitService]
    });
    service = TestBed.inject(LinkUnitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPatients', () => {
    it('should return patient list', (done) => {
      // Arrange
      const params: PatientQueryParams = { chapterId: '1' };
      const mockResponse = {
        success: true,
        data: [{
          patId: 'PAT001',
          patLastName: 'Smith',
          patFirstName: 'John',
          sex: 'M',
          surgId: 'SURG001',
          surgDate: '2025-10-15',
          shipToAddress: 'Location A',
          status: 'A',
          chapterId: '1',
          auditKey: 1
        }],
        total: 1,
        statusCode: 200,
        message: 'Success'
      };

      // Act
      service.getPatients(params).subscribe({
        next: (response) => {
          // Assert
          expect(response).toBeDefined();
          expect(response.data).toBeDefined();
          expect(Array.isArray(response.data)).toBe(true);
          expect(response.data.length).toBeGreaterThan(0);
          expect(response.totalCount).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/v1/special-units/'));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });



    it('should map closed status to I for API and display as Closed', (done) => {
      const params: PatientQueryParams = {
        chapterId: '1',
        status: 'Closed'
      };
      const mockResponse = {
        success: true,
        data: [{
          patId: 'PAT002',
          patientName: 'Doe, Jane',
          sex: 'F',
          surgId: 'SURG002',
          dob: '1985-05-20',
          surgeryDate: '2025-09-01',
          dateNeededBy: '2025-09-10',
          shipTo: 'Location B',
          status: 'I'
        }],
        total: 1,
        statusCode: 200,
        message: 'Success'
      };

      service.getPatients(params).subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].status).toBe('Closed');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/v1/special-units/'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.status).toBe('I');
      req.flush(mockResponse);
    });
  });
  describe('getSpecialDonors', () => {
    it('should return special donors for patient', (done) => {
      // Arrange
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: [{
          seqNo: 1,
          firstName: 'Jane',
          lastName: 'Donor',
          phone: '(214)361-4038',
          intlPhone: '+44-20-7946-0958'
        }],
        statusCode: 200,
        message: 'Success'
      };

      // Act
      service.getSpecialDonors(patientId, surgId, chapterId).subscribe({
        next: (donors) => {
          // Assert
          expect(donors).toBeDefined();
          expect(Array.isArray(donors)).toBe(true);
          expect(donors.length).toBe(1);
          expect(donors[0].phoneNumber).toBe('(214)361-4038');
          expect(donors[0].internationalPhone).toBe('+44-20-7946-0958');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/donors/${patientId}/${surgId}`));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map null phone fields to undefined', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: [{
          seqNo: 1,
          firstName: 'Jane',
          lastName: 'Donor',
          phone: null,
          intlPhone: null
        }],
        statusCode: 200,
        message: 'Success'
      };

      service.getSpecialDonors(patientId, surgId, chapterId).subscribe({
        next: (donors) => {
          expect(donors[0].phoneNumber).toBeUndefined();
          expect(donors[0].internationalPhone).toBeUndefined();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/donors/${patientId}/${surgId}`));
      req.flush(mockResponse);
    });
  });

  describe('getLinkedUnits', () => {
    it('should return linked units for patient', (done) => {
      // Arrange
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: [{
          unitId: 'W123',
          collDate: '2025-10-10',
          seqNo: 1
        }],
        statusCode: 200,
        message: 'Success'
      };

      // Act
      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          // Assert
          expect(units).toBeDefined();
          expect(Array.isArray(units)).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getLinkedUnits - error handling', () => {
    it('should return empty array when API returns error', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';

      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          expect(units).toBeDefined();
          expect(Array.isArray(units)).toBe(true);
          expect(units.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return empty array when API returns 404', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';

      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          expect(units).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should map linked unit fields correctly', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: [{
          unitId: 'W456',
          collDate: '2025-11-20',
          seqNo: 2,
          consigneeId: 'CON001',
          shipDate: '2025-11-25'
        }],
        statusCode: 200,
        message: 'Success'
      };

      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          expect(units.length).toBe(1);
          expect(units[0].unitId).toBe('W456');
          expect(units[0].collectionDate).toBe('2025-11-20');
          expect(units[0].seqNo).toBe(2);
          expect(units[0].consigneeId).toBe('CON001');
          expect(units[0].shipDate).toBe('2025-11-25');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      req.flush(mockResponse);
    });

    it('should map null optional fields to undefined', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: [{
          unitId: 'W789',
          collDate: '2025-12-01',
          seqNo: 3,
          consigneeId: null,
          shipDate: null
        }],
        statusCode: 200,
        message: 'Success'
      };

      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          expect(units[0].consigneeId).toBeUndefined();
          expect(units[0].shipDate).toBeUndefined();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      req.flush(mockResponse);
    });

    it('should return empty array when response data is null', (done) => {
      const patientId = 'PAT00035';
      const surgId = 'SURG001';
      const chapterId = '1';
      const mockResponse = {
        success: true,
        data: null,
        statusCode: 200,
        message: 'Success'
      };

      service.getLinkedUnits(patientId, surgId, chapterId).subscribe({
        next: (units) => {
          expect(units).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes(`/api/v1/special-units/linked-units/${patientId}/${surgId}`));
      req.flush(mockResponse);
    });
  });

  describe('searchDonors', () => {
    it('should return empty array', (done) => {
      // Arrange
      const searchText = 'ROGERS';

      // Act
      service.searchDonors(searchText).subscribe({
        next: (donors) => {
          // Assert
          expect(donors).toBeDefined();
          expect(Array.isArray(donors)).toBe(true);
          expect(donors.length).toBe(0);
          done();
        }
      });
    });
  });

  describe('validateScanUnit', () => {
    it('should call POST with correct DTO and return response', (done) => {
      const mockResponse = {
        success: true,
        item: {
          isRegistered: true,
          collectionDate: '2025-10-10',
          collectionDateSource: 'DONATIONS',
          donorId: 'D001',
          donorName: 'Smith, John',
          dateOfBirth: '1990-01-01',
          gender: 'M',
          isValid: true,
          hasWarnings: false,
          warnings: [],
          errorCode: null,
          errorMessage: null
        },
        statusCode: 200,
        message: 'Success'
      };

      service.validateScanUnit('W123', 'PAT001', 'SURG001', 1).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item?.isRegistered).toBe(true);
          expect(response.item?.donorName).toBe('Smith, John');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/v1/special-units/validate-scan-unit'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        unitId: 'W123',
        patId: 'PAT001',
        surgId: 'SURG001',
        seqNo: 1
      });
      req.flush(mockResponse);
    });

    it('should return warnings when unit has validation issues', (done) => {
      const mockResponse = {
        success: true,
        item: {
          isRegistered: true,
          collectionDate: '2025-10-10',
          collectionDateSource: 'DONATIONS',
          donorId: 'D001',
          donorName: 'Smith, John',
          dateOfBirth: '1990-01-01',
          gender: 'M',
          isValid: true,
          hasWarnings: true,
          warnings: [
            { warningCode: 'SAME_PATIENT_UNIT', message: 'Unit is already linked to another donor for same Patient.' }
          ],
          errorCode: null,
          errorMessage: null
        },
        statusCode: 200,
        message: 'Success'
      };

      service.validateScanUnit('W123', 'PAT001', 'SURG001', 1).subscribe({
        next: (response) => {
          expect(response.item?.hasWarnings).toBe(true);
          expect(response.item?.warnings.length).toBe(1);
          expect(response.item?.warnings[0].warningCode).toBe('SAME_PATIENT_UNIT');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/v1/special-units/validate-scan-unit'));
      req.flush(mockResponse);
    });
  });

  describe('linkUnit', () => {
    it('should successfully link unit', (done) => {
      // Arrange
      const request: LinkUnitRequest = {
        patientId: 'PAT00035',
        surgId: 'SURG001',
        seqNo: 1,
        unitId: 'W123',
        collectionDate: '2025-10-10',
        consigneeId: null
      };
      const mockResponse = {
        success: true,
        message: 'Unit linked successfully',
        statusCode: 200,
        item: true
      };

      // Act
      service.linkUnit(request).subscribe({
        next: (response) => {
          // Assert
          expect(response).toBeDefined();
          expect(response.success).toBe(true);
          expect(response.message).toContain('linked successfully');
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/v1/special-units/link'));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('unlinkUnit', () => {
    it('should successfully unlink unit', (done) => {
      // Arrange
      const request: UnlinkUnitRequest = {
        patientId: 'PAT00035',
        surgId: 'SURG001',
        seqNo: 1,
        unitId: 'W123',
        collectionDate: '2025-10-10T00:00:00'
      };
      const mockResponse = {
        success: true,
        message: 'Unit unlinked successfully',
        statusCode: 200,
        item: true
      };

      // Act
      service.unlinkUnit(request).subscribe({
        next: (response) => {
          // Assert
          expect(response).toBeDefined();
          expect(response.success).toBe(true);
          expect(response.message).toContain('unlinked successfully');
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/v1/special-units/unlink/PAT00035/SURG001/1/W123')
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
