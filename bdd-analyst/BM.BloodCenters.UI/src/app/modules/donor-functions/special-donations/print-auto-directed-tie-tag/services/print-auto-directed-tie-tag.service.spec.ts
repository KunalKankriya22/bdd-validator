import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';

import { PrintAutoDirectedTieTagService } from './print-auto-directed-tie-tag.service';
import type {
  TieTagSearchCriteriaDto,
  PatientSearchResultDto,
  TieTagDetailsDto,
  TieTagDonationDto,
  TieTagPrintRequestDto,
  PatientTypeDto,
  AttributeCodeDto,
  PrinterDto,
  IrradiationPromptDto,
  DonationsResponse
} from '../models/print-auto-directed-tie-tag.models';

describe('PrintAutoDirectedTieTagService', () => {
  let service: PrintAutoDirectedTieTagService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPatients: PatientSearchResultDto[] = [
    {
      patientId: 'PAT001', chapterId: '0001', lastName: 'Smith',
      firstName: 'John', dateOfBirth: '1980-01-15', surgeryId: 'SURG001', surgeryDate: '2024-01-15'
    },
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        PrintAutoDirectedTieTagService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(PrintAutoDirectedTieTagService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getPatients', () => {
    it('should GET all patients for LOV', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: mockPatients };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPatients().subscribe({
        next: (results) => {
          expect(results).toEqual(mockPatients);
          expect(results.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle empty patients response', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [] };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPatients().subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        },
      });
    });

    it('should handle null data response gracefully', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: null };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPatients().subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        },
      });
    });

    it('should handle error when fetching patients fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed to load patients')));

      service.getPatients().subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to load patients');
          done();
        },
      });
    });
  });

  describe('searchPatients', () => {
    it('should POST search criteria and return patient results', (done) => {
      const criteria: TieTagSearchCriteriaDto = { patientId: 'PAT001', searchMode: 'LIKE' };
      const mockResponse = { success: true, message: '', statusCode: 200, data: mockPatients };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchPatients(criteria).subscribe({
        next: (results) => {
          expect(results).toEqual(mockPatients);
          expect(results.length).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should return empty array when no patients match', (done) => {
      const criteria: TieTagSearchCriteriaDto = { lastName: 'NonExistent' };
      const mockResponse = { success: true, message: '', statusCode: 200, data: [] };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchPatients(criteria).subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        },
      });
    });

    it('should handle null data response gracefully', (done) => {
      const criteria: TieTagSearchCriteriaDto = {};
      const mockResponse = { success: true, message: '', statusCode: 200, data: null };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchPatients(criteria).subscribe({
        next: (results) => {
          expect(results).toEqual([]);
          done();
        },
      });
    });

  });

  describe('getTransferDetails', () => {
    it('should GET transfer details with query params', (done) => {
      const mockDetails: TieTagDetailsDto = {
        patientId: 'PAT001', patientName: 'Smith, John', sex: 'M',
        dateOfBirth: '1980-01-15', patientType: 'AUTO', surgeryId: 'SURG001',
        surgeryDate: '2024-01-15', surgeryType: 'CABG', surgeryDescription: 'Coronary Artery Bypass',
        physicianId: 'PHY001', physicianName: 'Johnson, Mary',
        hospitalId: 'HOSP001', hospitalName: 'General Hospital',
        dateNeededBy: '2024-01-15', unitsRequired: '3', comments: null, chapterId: '0001'
      };

      const mockResponse = { success: true, message: '', statusCode: 200, data: mockDetails };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransferDetails('PAT001', 'SURG001', '2024-01-15').subscribe({
        next: (details) => {
          expect(details).toEqual(mockDetails);
          expect(details.hospitalId).toBe('HOSP001');
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle error when not found', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getTransferDetails('X', 'Y', '2024-01-01').subscribe({
        error: (error) => {
          expect(error.message).toBe('Not found');
          done();
        },
      });
    });
  });

  describe('getDonations', () => {
    it('should GET donations and return full response with warnings', (done) => {
      const mockDonations: TieTagDonationDto[] = [{
        donorId: 'DON001', donorName: 'Doe, Jane', phoneNumber: '5551234567',
        unitId: 'UNIT001', checkDigit: '5', collectionDate: '2024-01-10',
        product1: 'RBC', print1: 'N', copies1: 1,
        product2: 'PLT', print2: 'N', copies2: 1,
        product3: null, print3: 'N', copies3: 1,
        seqNo: '001', chapterId: '0001'
      }];

      const mockResponse: DonationsResponse = {
        success: true, message: '', statusCode: 200,
        data: mockDonations, warnings: []
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonations('PAT001', 'SURG001').subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockDonations);
          expect(response.warnings).toEqual([]);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should return warnings when link error exists', (done) => {
      const mockResponse: DonationsResponse = {
        success: true, message: '', statusCode: 200,
        data: [], warnings: [{ warningCode: '99008', message: 'Link error' }]
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonations('PAT001', 'SURG001').subscribe({
        next: (response) => {
          expect(response.warnings.length).toBe(1);
          expect(response.warnings[0].warningCode).toBe('99008');
          done();
        },
      });
    });

    it('should handle error when fetching donations fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));

      service.getDonations('PAT001', 'SURG001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed');
          done();
        },
      });
    });
  });

  describe('getPatientTypes', () => {
    it('should GET patient types', (done) => {
      const mockTypes: PatientTypeDto[] = [
        { code: 'AUTO', description: 'Autologous', sortSequence2: 0, sortSequence3: 0 },
        { code: 'DIR', description: 'Directed', sortSequence2: 0, sortSequence3: 150 }
      ];

      const mockResponse = { success: true, message: '', statusCode: 200, data: mockTypes };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPatientTypes().subscribe({
        next: (types) => {
          expect(types).toEqual(mockTypes);
          expect(types.length).toBe(2);
          done();
        },
      });
    });

    it('should handle error when fetching patient types fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));

      service.getPatientTypes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed');
          done();
        },
      });
    });

    it('should handle empty patient types response', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPatientTypes().subscribe({
        next: (types) => {
          expect(types).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getAttributes', () => {
    it('should GET attribute codes', (done) => {
      const mockAttrs: AttributeCodeDto[] = [
        { code: 'IRR', codeDescription: 'Irradiated' },
        { code: 'CMV', codeDescription: 'CMV Negative' }
      ];

      const mockResponse = { success: true, message: '', statusCode: 200, data: mockAttrs };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributes().subscribe({
        next: (attrs) => {
          expect(attrs).toEqual(mockAttrs);
          done();
        },
      });
    });

    it('should handle error when fetching attributes fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));

      service.getAttributes().subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed');
          done();
        },
      });
    });
  });

  describe('getPrinters', () => {
    it('should GET available printers', (done) => {
      const mockPrinters: PrinterDto[] = [
        { code: 'LP01', description: 'Label Printer 1' },
        { code: 'LP02', description: 'Label Printer 2' }
      ];

      const mockResponse = { success: true, message: '', statusCode: 200, data: mockPrinters };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getPrinters().subscribe({
        next: (printers) => {
          expect(printers).toEqual(mockPrinters);
          expect(printers[0].code).toBe('LP01');
          done();
        },
      });
    });

    it('should handle error when fetching printers fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));

      service.getPrinters().subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed');
          done();
        },
      });
    });
  });

  describe('getIrradiationPrompt', () => {
    it('should GET irradiation prompt value', (done) => {
      const mockPrompt: IrradiationPromptDto = { irradiationPrompt: 'IRR' };
      const mockResponse = { success: true, message: '', statusCode: 200, data: mockPrompt };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getIrradiationPrompt().subscribe({
        next: (prompt) => {
          expect(prompt.irradiationPrompt).toBe('IRR');
          done();
        },
      });
    });

    it('should return BLANK when no irradiation prompt configured', (done) => {
      const mockPrompt: IrradiationPromptDto = { irradiationPrompt: 'BLANK' };
      const mockResponse = { success: true, message: '', statusCode: 200, data: mockPrompt };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getIrradiationPrompt().subscribe({
        next: (prompt) => {
          expect(prompt.irradiationPrompt).toBe('BLANK');
          done();
        },
      });
    });

    it('should handle error when fetching irradiation prompt fails', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Failed')));

      service.getIrradiationPrompt().subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed');
          done();
        },
      });
    });
  });

  describe('printTieTags', () => {
    it('should POST print request', (done) => {
      const request: TieTagPrintRequestDto = {
        patientId: 'PAT001',
        surgeryId: 'SURG001',
        surgeryDate: '2024-01-15',
        dateNeededBy: '2024-01-15',
        hospitalId: 'HOSP001',
        printer: 'LP01',
        donations: [{
          seqNo: '001', unitId: 'UNIT001', chapterId: '0001', donType: 'AUTO',
          product1: 'RBC', print1: true, copies1: 2,
          product2: null, print2: false, copies2: 1,
          product3: null, print3: false, copies3: 1,
          attributes: null
        }]
      };

      const mockResponse = { success: true, message: 'Printed', statusCode: 200 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.printTieTags(request).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle print errors', (done) => {
      const request: TieTagPrintRequestDto = {
        patientId: 'PAT001', surgeryId: 'SURG001', surgeryDate: '2024-01-15',
        dateNeededBy: null, hospitalId: 'HOSP001', printer: 'LP01', donations: []
      };

      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Print failed')));

      service.printTieTags(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Print failed');
          done();
        },
      });
    });
  });

  describe('validatePrintRequest', () => {
    const mockRequest: TieTagPrintRequestDto = {
      patientId: 'PAT001',
      surgeryId: 'SURG001',
      surgeryDate: '2024-01-15',
      dateNeededBy: '2024-01-15',
      hospitalId: 'HOSP001',
      printer: 'LP01',
      donations: [{
        seqNo: '001', unitId: 'UNIT001', chapterId: '0001', donType: 'AUTO',
        product1: 'RBC', print1: true, copies1: 2,
        product2: null, print2: false, copies2: 1,
        product3: null, print3: false, copies3: 1,
        attributes: null
      }]
    };

    it('should POST validate request and return success', (done) => {
      const mockResponse = { success: true, message: 'Validation passed', statusCode: 200 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validatePrintRequest(mockRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle validation failure error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Validation failed')));

      service.validatePrintRequest(mockRequest).subscribe({
        error: (error) => {
          expect(error.message).toBe('Validation failed');
          done();
        },
      });
    });

    it('should pass request body to API', (done) => {
      const mockResponse = { success: true, message: 'Validation passed', statusCode: 200 };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.validatePrintRequest(mockRequest).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[1]).toEqual(mockRequest);
          done();
        },
      });
    });

  });
});
