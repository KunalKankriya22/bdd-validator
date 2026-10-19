import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AuditDonationApiService } from './audit-donation-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  AuditDonationDto,
  HealthHistoryDto,
  HHTemplateQuestionDto,
  PhysicalFindingDto,
  AddHealthHistoryResponseRequest,
  UpdateHealthHistoryRequest,
  AddQuestionToTemplateRequest,
} from '../models/audit-donation.model';

describe('AuditDonationApiService', () => {
  let service: AuditDonationApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockDonation: AuditDonationDto = {
    unitId: 'WK001',
    transactionId: 'TXN001',
    donorId: 'D001',
    donorName: 'Test Donor',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    address: '123 Test St',
    homePhone: '555-1234',
    businessPhone: '555-5678',
    collectionDate: '2026-01-01',
    donationType: 'AL',
    procedureCode: 'WB',
    signature: 'Yes',
    donorSignatureFlag: 'Y',
  };

  const mockHealthHistory: HealthHistoryDto[] = [
    {
      transactionId: 'TXN001',
      questionCode: 'Q001',
      questionDescription: 'Test question',
      answerCode: 'YES',
      response: 'Y',
      auditKey: 1,
    },
  ];

  const mockTemplateQuestions: HHTemplateQuestionDto[] = [
    {
      sortSequence: 2,
      questionCode: 'Q002',
      questionDescription: 'Question 2',
      donationType: 'AL',
      templateId: 'T001',
      effDate: '2024-01-01',
      termDate: '2099-12-31',
    },
    {
      sortSequence: 1,
      questionCode: 'Q001',
      questionDescription: 'Question 1',
      donationType: 'AL',
      templateId: 'T001',
      effDate: '2024-01-01',
      termDate: '2099-12-31',
    },
  ];

  const mockPhysicalFindings: PhysicalFindingDto[] = [
    {
      transactionId: 'TXN001',
      physicalCode: 'BP',
      description: 'Blood Pressure',
      physicalDescription: 'Blood Pressure',
      value: '120/80',
      auditKey: '1',
    },
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuditDonationApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(AuditDonationApiService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDonation', () => {
    it('should return donation when API returns object', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockDonation, success: true, statusCode: 200, message: '' }));

      service.getDonation('WK001').subscribe((result) => {
        expect(result).toEqual(mockDonation);
        done();
      });
    });

    it('should return first item when API returns array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockDonation], success: true, statusCode: 200, message: '' }));

      service.getDonation('WK001').subscribe((result) => {
        expect(result).toEqual(mockDonation);
        done();
      });
    });

    it('should throw 404 error when API returns empty array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));

      service.getDonation('WK001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          expect(err.error.message).toContain('Err1230');
          done();
        },
      });
    });


    it('should return matching record when collectionDate provided and multiple records exist', (done) => {
      const mockDonation2 = { ...mockDonation, collectionDate: '2007-08-14' };
      mockApiService.get.and.returnValue(of({ data: [mockDonation, mockDonation2], success: true, statusCode: 200, message: '' }));

      service.getDonation('WK001', '2007-08-14').subscribe((result) => {
        expect(result).toEqual(mockDonation2);
        done();
      });
    });

    it('should append collectionDate query param when provided', () => {
      mockApiService.get.and.returnValue(of({ data: mockDonation, success: true, statusCode: 200, message: '' }));

      service.getDonation('WK001', '2026-01-01').subscribe();

      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
    });

    it('should propagate API errors', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));

      service.getDonation('WK001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('getHealthHistory', () => {
    it('should return health history array', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockHealthHistory, success: true, statusCode: 200, message: '' }));

      service.getHealthHistory('WK001').subscribe((result) => {
        expect(result[0]).toEqual(jasmine.objectContaining(mockHealthHistory[0]));
        done();
      });
    });

    it('should append collectionDate when provided', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));

      service.getHealthHistory('WK001', '2026-01-01').subscribe();

      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
    });
  });
  describe('addQuestionToTemplate', () => {
    it('should return sorted questions after adding', (done) => {
      const request: AddQuestionToTemplateRequest = {
        questionCode: 'Q003',
        donationType: 'AL',
        sortSequence: 3,
      };
      mockApiService.post.and.returnValue(of({ data: mockTemplateQuestions, success: true, statusCode: 200, message: '' }));

      service.addQuestionToTemplate(request).subscribe((result) => {
        expect(result[0].sortSequence).toBe(1);
        done();
      });
    });
  });

  describe('getPhysicalFindings', () => {
    it('should return physical findings array', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockPhysicalFindings, success: true, statusCode: 200, message: '' }));

      service.getPhysicalFindings('WK001').subscribe((result) => {
        expect(result[0]).toEqual(jasmine.objectContaining({
          transactionId: mockPhysicalFindings[0].transactionId,
          physicalCode: mockPhysicalFindings[0].physicalCode,
          value: mockPhysicalFindings[0].value,
          auditKey: mockPhysicalFindings[0].auditKey,
        }));
        done();
      });
    });
  });

  describe('addHealthHistoryResponse', () => {
    it('should return new health history response', (done) => {
      const request: AddHealthHistoryResponseRequest = { questionCode: 'Q001', answerCode: 'YES' };
      mockApiService.post.and.returnValue(of({ data: mockHealthHistory[0], success: true, statusCode: 200, message: '' }));

      service.addHealthHistoryResponse('WK001', request).subscribe((result) => {
        expect(result).toEqual(jasmine.objectContaining(mockHealthHistory[0]));
        done();
      });
    });
  });
  describe('getDropdownOptions', () => {
    it('should return hardcoded dropdown options', (done) => {
      mockApiService.get.and.returnValue(of({
        data: [{ donationType: 'AL', description: 'Allogeneic' }],
        success: true, statusCode: 200, message: '',
      }));

      service.getDropdownOptions().subscribe((result) => {
        expect(result.donorSignature.length).toBeGreaterThan(0);
        expect(result.donationType.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return defaults on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getDropdownOptions().subscribe((result) => {
        expect(result.donorSignature.length).toBe(2);
        expect(result.donationType).toEqual([]);
        done();
      });
    });
  });

  describe('getDonation - multiple records', () => {
    it('should throw MULTIPLE_RECORDS when multiple records and no collectionDate', (done) => {
      const donation2 = { ...mockDonation, collectionDate: '2026-02-01' };
      mockApiService.get.and.returnValue(of({ data: [mockDonation, donation2], success: true, statusCode: 200, message: '' }));
      service.getDonation('WK001').subscribe({
        error: (err) => {
          expect(err.code).toBe('MULTIPLE_RECORDS');
          done();
        }
      });
    });

    it('should return first record when collectionDate provided but no match', (done) => {
      const donation2 = { ...mockDonation, collectionDate: '2026-03-01' };
      mockApiService.get.and.returnValue(of({ data: [mockDonation, donation2], success: true, statusCode: 200, message: '' }));
      service.getDonation('WK001', '2026-05-01').subscribe((result) => {
        expect(result).toEqual(mockDonation);
        done();
      });
    });
  });

  describe('getDonationByDeferralId', () => {
    it('should return first item from array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockDonation], success: true, statusCode: 200, message: '' }));
      service.getDonationByDeferralId('DEF001').subscribe((result) => {
        expect(result).toEqual(mockDonation);
        done();
      });
    });

    it('should return data directly when not array', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockDonation, success: true, statusCode: 200, message: '' }));
      service.getDonationByDeferralId('DEF001').subscribe((result) => {
        expect(result).toEqual(mockDonation);
        done();
      });
    });

    it('should throw 404 when empty array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getDonationByDeferralId('DEF001').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });
    });

    it('should propagate API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getDonationByDeferralId('DEF001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getDonationByDeferralId — multiple records with collectionDate', () => {
    it('should return matching record by collectionDate', (done) => {
      const donation2 = { ...mockDonation, collectionDate: '2007-08-14', transactionId: 'TXN002' };
      mockApiService.get.and.returnValue(of({ data: [mockDonation, donation2], success: true, statusCode: 200, message: '' }));
      service.getDonationByDeferralId('DEF001', '2007-08-14').subscribe((result) => {
        expect(result.transactionId).toBe('TXN002');
        done();
      });
    });

    it('should throw 300 when multiple records found and no collectionDate', (done) => {
      const donation2 = { ...mockDonation, transactionId: 'TXN002' };
      mockApiService.get.and.returnValue(of({ data: [mockDonation, donation2], success: true, statusCode: 200, message: '' }));
      service.getDonationByDeferralId('DEF001').subscribe({
        error: (err) => {
          expect(err.status).toBe(300);
          done();
        },
      });
    });
  });

  describe('getHealthHistory - with params', () => {
    it('should append transactionId when provided', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getHealthHistory('WK001', undefined, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should append both params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getHealthHistory('WK001', '2026-01-01', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getHealthHistory('WK001').subscribe({
        error: (err) => { expect(err.status).toBe(500); done(); }
      });
    });
  });

  describe('addHealthHistoryResponse - with transactionId', () => {
    it('should append transactionId to URL', () => {
      const request: AddHealthHistoryResponseRequest = { questionCode: 'Q001', answerCode: 'YES' };
      mockApiService.post.and.returnValue(of({ data: [mockHealthHistory[0]], success: true, statusCode: 200, message: '' }));
      service.addHealthHistoryResponse('WK001', request, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.post.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should handle array response', (done) => {
      const request: AddHealthHistoryResponseRequest = { questionCode: 'Q001', answerCode: 'YES' };
      mockApiService.post.and.returnValue(of({ data: [mockHealthHistory[0]], success: true, statusCode: 200, message: '' }));
      service.addHealthHistoryResponse('WK001', request).subscribe((result) => {
        expect(result).toEqual(jasmine.objectContaining({ questionCode: 'Q001' }));
        done();
      });
    });
  });

  describe('updateHealthHistory', () => {
    it('should call put with correct URL', (done) => {
      const request: UpdateHealthHistoryRequest[] = [{ questionCode: 'Q001', answerCode: 'NO', auditKey: 1 }];
      mockApiService.put.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.updateHealthHistory('WK001', request).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.put.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.updateHealthHistory('WK001', [], 'TXN001').subscribe();
      const calledUrl: string = mockApiService.put.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.put.and.returnValue(throwError(() => ({ status: 500 })));
      service.updateHealthHistory('WK001', []).subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('deleteHealthHistory', () => {
    it('should call delete with correct params', (done) => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.deleteHealthHistory('WK001', 'Q001', 1).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.deleteHealthHistory('WK001', 'Q001', 1, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.delete.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.delete.and.returnValue(throwError(() => ({ status: 500 })));
      service.deleteHealthHistory('WK001', 'Q001', 1).subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getPhysicalFindings - with params', () => {
    it('should append collectionDate and transactionId', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getPhysicalFindings('WK001', '2026-01-01', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getPhysicalFindings('WK001').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('addPhysicalFinding', () => {
    it('should post and return void', (done) => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.addPhysicalFinding('WK001', { physicalCode: 'BP', value: '120/80' } as any).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.addPhysicalFinding('WK001', {} as any, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.post.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ status: 500 })));
      service.addPhysicalFinding('WK001', {} as any).subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('deletePhysicalFinding', () => {
    it('should delete and return void', (done) => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.deletePhysicalFinding('WK001', 'BP').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.deletePhysicalFinding('WK001', 'BP', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.delete.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });
  });

  describe('updatePhysicalFindings', () => {
    it('should put and return void', (done) => {
      mockApiService.put.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.updatePhysicalFindings('WK001', []).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.put.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.updatePhysicalFindings('WK001', [], 'TXN001').subscribe();
      const calledUrl: string = mockApiService.put.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.put.and.returnValue(throwError(() => ({ status: 500 })));
      service.updatePhysicalFindings('WK001', []).subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getInterdictions', () => {
    it('should return mapped interdictions', (done) => {
      const mockData = [{ interCode: 'INT1', interDescription: 'Test' }];
      mockApiService.get.and.returnValue(of({ data: mockData, success: true, statusCode: 200, message: '' }));
      service.getInterdictions('WK001').subscribe((result) => {
        expect(result[0].interDescription).toBe('Test');
        done();
      });
    });

    it('should append params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getInterdictions('WK001', '2026-01-01', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should map fallback description fields', (done) => {
      const mockData = [{ interCode: 'INT1', description: 'Fallback Desc' }];
      mockApiService.get.and.returnValue(of({ data: mockData, success: true, statusCode: 200, message: '' }));
      service.getInterdictions('WK001').subscribe((result) => {
        expect(result[0].interDescription).toBe('Fallback Desc');
        done();
      });
    });

    it('should propagate error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getInterdictions('WK001').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('addInterdiction', () => {
    it('should post and return void', (done) => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.addInterdiction('WK001', { interCode: 'INT1' } as any).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.addInterdiction('WK001', {} as any, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.post.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });
  });

  describe('removeInterdiction', () => {
    it('should delete and return void', (done) => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.removeInterdiction('WK001', 'INT1').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.removeInterdiction('WK001', 'INT1', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.delete.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });
  });

  describe('placeHold', () => {
    it('should post and return void', (done) => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.placeHold('WK001', 'TXN001', 'HOLD1').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should append overrideTxId', () => {
      mockApiService.post.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.placeHold('WK001', 'TXN001', 'HOLD1', 'OVERRIDE1').subscribe();
      const calledUrl: string = mockApiService.post.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=OVERRIDE1');
    });

    it('should propagate error', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ status: 500 })));
      service.placeHold('WK001', 'TXN001', 'HOLD1').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getPhysicalValueRules', () => {
    it('should return rules array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ ruleId: 'R1' }], success: true, statusCode: 200, message: '' }));
      service.getPhysicalValueRules('WK001').subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should append params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getPhysicalValueRules('WK001', '2026-01-01', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getPhysicalValueRules('WK001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle null data', (done) => {
      mockApiService.get.and.returnValue(of({ data: null, success: true, statusCode: 200, message: '' }));
      service.getPhysicalValueRules('WK001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getPhysicalFindingsTemplate', () => {
    it('should return template array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ physicalCode: 'BP' }], success: true, statusCode: 200, message: '' }));
      service.getPhysicalFindingsTemplate('WK001').subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should append params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getPhysicalFindingsTemplate('WK001', '2026-01-01', 'TXN001').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('collectionDate=2026-01-01');
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should return empty array on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getPhysicalFindingsTemplate('WK001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getHoldCodes', () => {
    it('should return hold codes', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ interCode: 'H1' }], success: true, statusCode: 200, message: '' }));
      service.getHoldCodes().subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should return empty on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getHoldCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getPeriodTypeMultipliers', () => {
    it('should return map of multipliers', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ periodType: 'DAY', numeralValue: 1 }, { periodType: 'WEEK', numeralValue: 7 }], success: true, statusCode: 200, message: '' }));
      service.getPeriodTypeMultipliers().subscribe((result) => {
        expect(result.get('DAY')).toBe(1);
        expect(result.get('WEEK')).toBe(7);
        done();
      });
    });

    it('should skip zero/negative values', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ periodType: 'ZERO', numeralValue: 0 }], success: true, statusCode: 200, message: '' }));
      service.getPeriodTypeMultipliers().subscribe((result) => {
        expect(result.has('ZERO')).toBe(false);
        done();
      });
    });

    it('should return empty map on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getPeriodTypeMultipliers().subscribe((result) => {
        expect(result.size).toBe(0);
        done();
      });
    });
  });

  describe('getNodosignCode', () => {
    it('should return string from array', (done) => {
      mockApiService.get.and.returnValue(of({ data: ['NOSIGN'], success: true, statusCode: 200, message: '' }));
      service.getNodosignCode().subscribe((result) => {
        expect(result).toBe('NOSIGN');
        done();
      });
    });

    it('should return string directly', (done) => {
      mockApiService.get.and.returnValue(of({ data: 'NOSIGN', success: true, statusCode: 200, message: '' }));
      service.getNodosignCode().subscribe((result) => {
        expect(result).toBe('NOSIGN');
        done();
      });
    });

    it('should return null for non-string non-array', (done) => {
      mockApiService.get.and.returnValue(of({ data: 123, success: true, statusCode: 200, message: '' }));
      service.getNodosignCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null for empty array', (done) => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getNodosignCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getNodosignCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getNodonationCode', () => {
    it('should return first element of array', (done) => {
      mockApiService.get.and.returnValue(of({ data: ['NODON'], success: true, statusCode: 200, message: '' }));
      service.getNodonationCode().subscribe((result) => {
        expect(result).toBe('NODON');
        done();
      });
    });

    it('should return string directly', (done) => {
      mockApiService.get.and.returnValue(of({ data: 'NODON', success: true, statusCode: 200, message: '' }));
      service.getNodonationCode().subscribe((result) => {
        expect(result).toBe('NODON');
        done();
      });
    });

    it('should return null on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getNodonationCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getNoprocedurCode', () => {
    it('should return first element of array', (done) => {
      mockApiService.get.and.returnValue(of({ data: ['NOPROC'], success: true, statusCode: 200, message: '' }));
      service.getNoprocedurCode().subscribe((result) => {
        expect(result).toBe('NOPROC');
        done();
      });
    });

    it('should return string directly', (done) => {
      mockApiService.get.and.returnValue(of({ data: 'NOPROC', success: true, statusCode: 200, message: '' }));
      service.getNoprocedurCode().subscribe((result) => {
        expect(result).toBe('NOPROC');
        done();
      });
    });

    it('should return null on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getNoprocedurCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getPfWeightCode', () => {
    it('should return string from array', (done) => {
      mockApiService.get.and.returnValue(of({ data: ['WEIGHT'], success: true, statusCode: 200, message: '' }));
      service.getPfWeightCode().subscribe((result) => {
        expect(result).toBe('WEIGHT');
        done();
      });
    });

    it('should return string directly', (done) => {
      mockApiService.get.and.returnValue(of({ data: 'WEIGHT', success: true, statusCode: 200, message: '' }));
      service.getPfWeightCode().subscribe((result) => {
        expect(result).toBe('WEIGHT');
        done();
      });
    });

    it('should return null for non-string non-array', (done) => {
      mockApiService.get.and.returnValue(of({ data: 42, success: true, statusCode: 200, message: '' }));
      service.getPfWeightCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getPfWeightCode().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('saveDonationAudit', () => {
    it('should save and return message and data from array', (done) => {
      mockApiService.put.and.returnValue(of({ data: [mockDonation], message: 'Saved', success: true, statusCode: 200 }));
      service.saveDonationAudit('WK001', {} as any).subscribe((result) => {
        expect(result.message).toBe('Saved');
        expect(result.data).toEqual(mockDonation);
        done();
      });
    });

    it('should save and return data when not array', (done) => {
      mockApiService.put.and.returnValue(of({ data: mockDonation, message: null, success: true, statusCode: 200 }));
      service.saveDonationAudit('WK001', {} as any).subscribe((result) => {
        expect(result.message).toBe('Audit saved successfully.');
        expect(result.data).toEqual(mockDonation);
        done();
      });
    });

    it('should append transactionId', () => {
      mockApiService.put.and.returnValue(of({ data: [mockDonation], message: 'Saved', success: true, statusCode: 200 }));
      service.saveDonationAudit('WK001', {} as any, 'TXN001').subscribe();
      const calledUrl: string = mockApiService.put.calls.mostRecent().args[0];
      expect(calledUrl).toContain('transactionId=TXN001');
    });

    it('should propagate error', (done) => {
      mockApiService.put.and.returnValue(throwError(() => ({ status: 500 })));
      service.saveDonationAudit('WK001', {} as any).subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getGroupCodes', () => {
    it('should return mapped dropdown options', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ code: 'G1', description: 'Group 1' }], success: true, statusCode: 200, message: '' }));
      service.getGroupCodes('Q001', 'Y').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].value).toBe('G1');
        expect(result[0].label).toContain('G1');
        expect(result[0].label).toContain('Group 1');
        done();
      });
    });

    it('should filter out empty codes', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ code: '', description: 'Empty' }, { code: 'G1' }], success: true, statusCode: 200, message: '' }));
      service.getGroupCodes().subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should handle code without description', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ code: 'G1' }], success: true, statusCode: 200, message: '' }));
      service.getGroupCodes().subscribe((result) => {
        expect(result[0].label).toBe('G1');
        done();
      });
    });

    it('should return empty on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getGroupCodes().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should append query params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getGroupCodes('Q001', 'Y').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('questionCode=Q001');
      expect(calledUrl).toContain('response=Y');
    });
  });

  describe('getAnswerCodes', () => {
    it('should return mapped answer options', (done) => {
      mockApiService.get.and.returnValue(of({
        data: [{
          answerCode: 'A1', answerDescription: 'Answer 1',
          commentRequired: 'Y', additionalDateFlag: 'Y',
          deferralPeriod: 30, periodType: 'DAY',
          interdictionCode: 'INT1', numeralValue: 5
        }],
        success: true, statusCode: 200, message: ''
      }));
      service.getAnswerCodes('Q001', 'Y', 'G1').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].value).toBe('A1');
        expect(result[0].commentReq).toBe(true);
        expect(result[0].additionalDateFlag).toBe(true);
        expect(result[0].deferralPeriod).toBe(30);
        expect(result[0].periodType).toBe('DAY');
        expect(result[0].interCode).toBe('INT1');
        expect(result[0].numeralValue).toBe(5);
        done();
      });
    });

    it('should filter out empty answer codes', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ answerCode: '' }, { answerCode: 'A1' }], success: true, statusCode: 200, message: '' }));
      service.getAnswerCodes('Q001').subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should return empty on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getAnswerCodes('Q001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should append response and groupCode params', () => {
      mockApiService.get.and.returnValue(of({ data: [], success: true, statusCode: 200, message: '' }));
      service.getAnswerCodes('Q001', 'Y', 'G1').subscribe();
      const calledUrl: string = mockApiService.get.calls.mostRecent().args[0];
      expect(calledUrl).toContain('response=Y');
      expect(calledUrl).toContain('groupCode=G1');
    });
  });

  describe('getHHQuestions', () => {
    it('should return questions', (done) => {
      mockApiService.post.and.returnValue(of({ data: [{ questionCode: 'Q1' }], success: true, statusCode: 200, message: '' }));
      service.getHHQuestions().subscribe((result) => {
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should propagate error', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ status: 500 })));
      service.getHHQuestions().subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getHHTemplate', () => {
    it('should return sorted template questions', (done) => {
      mockApiService.get.and.returnValue(of({ data: mockTemplateQuestions, success: true, statusCode: 200, message: '' }));
      service.getHHTemplate('AL').subscribe((result) => {
        expect(result[0].sortSequence).toBe(1);
        expect(result[1].sortSequence).toBe(2);
        done();
      });
    });

    it('should handle null data', (done) => {
      mockApiService.get.and.returnValue(of({ data: null, success: true, statusCode: 200, message: '' }));
      service.getHHTemplate('AL').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getHHTemplate('AL').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('deleteQuestionFromTemplate', () => {
    it('should delete and return void', (done) => {
      mockApiService.delete.and.returnValue(of({ data: undefined, success: true, statusCode: 200, message: '' }));
      service.deleteQuestionFromTemplate('Q001', 'AL').subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });

    it('should propagate error', (done) => {
      mockApiService.delete.and.returnValue(throwError(() => ({ status: 500 })));
      service.deleteQuestionFromTemplate('Q001', 'AL').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('validateUnitId', () => {
    it('should return item on success', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, item: { isValid: true, parsedUnitId: 'WK001' } }));
      service.validateUnitId('WK001').subscribe((result) => {
        expect(result.isValid).toBe(true);
        expect(result.parsedUnitId).toBe('WK001');
        done();
      });
    });

    it('should return data when item is absent', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, data: { isValid: true } }));
      service.validateUnitId('WK001').subscribe((result) => {
        expect(result.isValid).toBe(true);
        done();
      });
    });

    it('should throw when not success', (done) => {
      mockApiService.post.and.returnValue(of({ success: false, error: 'Invalid unit' }));
      service.validateUnitId('BAD').subscribe({
        error: (err) => {
          expect(err.error.message).toBe('Invalid unit');
          done();
        }
      });
    });

    it('should propagate API error', (done) => {
      mockApiService.post.and.returnValue(throwError(() => ({ status: 500 })));
      service.validateUnitId('WK001').subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getProcedureCodesByType', () => {
    it('should return mapped procedure codes', (done) => {
      mockApiService.get.and.returnValue(of({ data: [{ procedureCode: 'WB', description: 'Whole Blood' }], success: true, statusCode: 200, message: '' }));
      service.getProcedureCodesByType('AL').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].value).toBe('WB');
        expect(result[0].label).toBe('WB-Whole Blood');
        done();
      });
    });

    it('should return empty on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.getProcedureCodesByType('AL').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('validateHhCommentCode', () => {
    it('should return valid true when API returns valid=true', (done) => {
      mockApiService.get.and.returnValue(of({ valid: true, data: 'OK' }));
      service.validateHhCommentCode('Q001', 'YES', 'Y', 'CMT01').subscribe((result) => {
        expect(result.valid).toBe(true);
        done();
      });
    });

    it('should return valid false on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.validateHhCommentCode('Q001', 'YES', 'Y', 'CMT01').subscribe((result) => {
        expect(result.valid).toBe(false);
        done();
      });
    });
  });

  describe('validatePfCommentCode', () => {
    it('should return valid true when API returns valid=true', (done) => {
      mockApiService.get.and.returnValue(of({ valid: true, data: 'OK' }));
      service.validatePfCommentCode('CMT01').subscribe((result) => {
        expect(result.valid).toBe(true);
        done();
      });
    });

    it('should return valid false on error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('fail')));
      service.validatePfCommentCode('CMT01').subscribe((result) => {
        expect(result.valid).toBe(false);
        done();
      });
    });
  });

});
