import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { ReleaseAuditHoldsService } from './release-audit-holds.service';
import { ApiService } from '@shared/services/api.service';
import {
  AuditHoldRecord,
  ReturnResult,
  HoldRecord,
  InterdictionCode,
  DeferDonorConfig,
  HoldDetailApiResponse,
  HoldCommentsResponse,
  RemoveHoldRequest
} from '../models/release-audit-holds.model';

describe('ReleaseAuditHoldsService', () => {
  let service: ReleaseAuditHoldsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const today = moment();
  const yesterday = moment().subtract(1, 'days');
  const todayStr = today.format('YYYY-MM-DD');
  const yesterdayStr = yesterday.format('YYYY-MM-DD');

  const mockHoldRecord: HoldRecord = {
    transactionId: 'TXN001',
    unitId: 'U001',
    collDate: todayStr,
    interCode: 'AH',
    interDescription: 'Audit Hold',
    originatedFrom: 'LAB',
    reasonCode: 'R01',
    groupId: 'G1',
    groupMode: 'M1',
    effectiveDate: todayStr,
    insertDate: todayStr,
    termDate: null,
    donorId: 'D001',
    donorName: 'John Doe',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    donationType: 'WB',
    procedureCode: 'PC01',
    sourceCode: 'SC01',
    holdSource: 'UNIT',
    releaseUser: null
  };

  const mockInterdictionCode: InterdictionCode = { code: 'AH', description: 'Audit Hold' };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ReleaseAuditHoldsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReleaseAuditHoldsService);
  });

  /* -------------------------------- getAuditHolds -------------------------------- */

  describe('getAuditHolds', () => {
    it('should return transformed audit holds', (done) => {
      const mockResponse: ReturnResult<HoldRecord> = {
        data: [mockHoldRecord],
        success: true,
        message: '',
        statusCode: 200,
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAuditHolds({}).subscribe(response => {
        expect(response.data).toBeDefined();
        expect(response.data.length).toBe(1);
        expect(response.data[0].unitId).toBe('U001');
        expect(response.data[0].donorId).toBe('D001');
        expect(response.data[0].name).toBe('John Doe');
        expect(response.data[0].sex).toBe('M');
        expect(response.data[0].donationType).toBe('WB');
        expect(response.data[0].donationProcedure).toBe('PC01');
        expect(response.data[0].hold).toBe('AH');
        expect(response.data[0].origin).toBe('LAB');
        expect(response.data[0].reason).toBe('R01');
        expect(response.totalRecords).toBe(1);
        done();
      });
    });

    it('should map removed field to X when termDate is present', (done) => {
      const recordWithTermDate = { ...mockHoldRecord, termDate: todayStr };
      const mockResponse: ReturnResult<HoldRecord> = {
        data: [recordWithTermDate],
        success: true,
        message: '',
        statusCode: 200,
        total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAuditHolds({}).subscribe(response => {
        expect(response.data[0].removed).toBe('X');
        done();
      });
    });


    it('should pass all params to the API request', (done) => {
      const mockResponse: ReturnResult<HoldRecord> = {
        data: [],
        success: true,
        message: '',
        statusCode: 200
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAuditHolds({
        fromCollectionDate: yesterdayStr,
        toCollectionDate: todayStr,
        unitId: 'U001',
        donationProcedure: 'PC01',
        donationType: 'WB',
        auditHoldType: 'AH',
        searchKeyword: 'test',
        sort: 'unitId:desc'
      }).subscribe(() => {
        const requestBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(requestBody.startDate).toBe(yesterdayStr);
        expect(requestBody.endDate).toBe(todayStr);
        expect(requestBody.unitId).toBe('U001');
        expect(requestBody.procedureCode).toBe('PC01');
        expect(requestBody.donationType).toBe('WB');
        expect(requestBody.auditHoldType).toBe('AH');
        expect(requestBody.searchText).toBe('test');
        expect(requestBody.sortDirection).toBe('DESC');
        done();
      });
    });





    it('should map releaseUser correctly', (done) => {
      const recordWithRelUser = { ...mockHoldRecord, releaseUser: 'admin' };
      apiServiceSpy.post.and.returnValue(of({ data: [recordWithRelUser], success: true, message: '', statusCode: 200, total: 1 }));

      service.getAuditHolds({}).subscribe(response => {
        expect(response.data[0].releaseUser).toBe('admin');
        done();
      });
    });
  });

  /* -------------------------------- getDonationUnit -------------------------------- */

  describe('getDonationUnit', () => {
    it('should call GET API with unit ID', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, item: { unitId: 'U001' } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationUnit('U001').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(apiServiceSpy.get).toHaveBeenCalled();
        done();
      });
    });

  });

  /* -------------------------------- placeHold -------------------------------- */

  describe('placeHold', () => {
    it('should post place hold request', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      service.placeHold('U001', {
        interCode: 'AH',
        effectiveDate: todayStr
      }).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalled();
        done();
      });
    });

  });

  /* -------------------------------- removeHold -------------------------------- */

  describe('removeHold', () => {
    const removeRequest: RemoveHoldRequest = {
      interCode: 'AH',
      transactionId: 'TXN001',
      placeNft: 'N'
    };

    it('should post remove hold request', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true, message: 'Hold removed', statusCode: 200 }));

      service.removeHold('U001', removeRequest).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(apiServiceSpy.post).toHaveBeenCalled();
        done();
      });
    });

  });

  /* -------------------------------- getInterdictionCodes -------------------------------- */

  describe('getInterdictionCodes', () => {
    it('should return mapped interdiction codes', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [mockInterdictionCode], success: true, message: '', statusCode: 200 }));

      service.getInterdictionCodes().subscribe(options => {
        expect(options.length).toBe(1);
        expect(options[0].value).toBe('AH');
        expect(options[0].label).toBe('Audit Hold');
        done();
      });
    });



  });

  /* -------------------------------- getDonationTypes -------------------------------- */

  const mockDropdownRequest = { startDate: '2025-01-01', endDate: '2025-05-13' } as any;

  describe('getDonationTypes', () => {
    it('should return mapped donation type options', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [mockInterdictionCode], success: true, message: '', statusCode: 200 }));

      service.getDonationTypes(mockDropdownRequest).subscribe(options => {
        expect(options.length).toBe(1);
        expect(options[0].value).toBe('AH');
        expect(options[0].label).toBe('Audit Hold');
        done();
      });
    });

  });

  /* -------------------------------- getDonationProcedures -------------------------------- */
  /* -------------------------------- getAuditHoldTypes -------------------------------- */
  /* -------------------------------- getDeferDonorConfig -------------------------------- */

  describe('getDeferDonorConfig', () => {
    const mockConfig: DeferDonorConfig = {
      isDeferDonorEnabled: true,
      options: [{ value: 'T', label: 'Temporary' }],
      defaultTermDate: todayStr,
      defaultEffDateOk: todayStr,
      defaultEffDateNft: yesterdayStr
    };

    it('should return config from item property', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockConfig, success: true, message: '', statusCode: 200 }));

      service.getDeferDonorConfig(todayStr).subscribe(config => {
        expect(config.isDeferDonorEnabled).toBeTrue();
        expect(config.options.length).toBe(1);
        expect(config.defaultTermDate).toBe(todayStr);
        done();
      });
    });

    it('should return config from data array if item is missing', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [mockConfig], success: true, message: '', statusCode: 200 }));

      service.getDeferDonorConfig(todayStr).subscribe(config => {
        expect(config.isDeferDonorEnabled).toBeTrue();
        done();
      });
    });

    it('should return default config when response has no data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null, item: null, success: true, message: '', statusCode: 200 }));

      service.getDeferDonorConfig(todayStr).subscribe(config => {
        expect(config.isDeferDonorEnabled).toBeFalse();
        expect(config.options).toEqual([]);
        expect(config.defaultTermDate).toBe('');
        done();
      });
    });

    it('should return default config on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getDeferDonorConfig(todayStr).subscribe(config => {
        expect(config.isDeferDonorEnabled).toBeFalse();
        expect(config.options).toEqual([]);
        done();
      });
    });
  });

  /* -------------------------------- getHoldComments -------------------------------- */

  describe('getHoldComments', () => {
    it('should post hold comments request', (done) => {
      const mockResponse: ReturnResult<HoldCommentsResponse> = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{ comments: 'Test comment' }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getHoldComments('U001', {
        transactionId: 'TXN001',
        interCode: 'AH',
        donorId: 'D001',
        originatedFrom: 'LAB',
        reasonCode: 'R01',
        groupId: 'G1',
        groupMode: 'M1'
      }).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data![0].comments).toBe('Test comment');
        done();
      });
    });

  });

  /* -------------------------------- getUnitHolds / getDonorHolds -------------------------------- */

  describe('getUnitHolds', () => {
    it('should return mapped hold detail records', (done) => {
      const mockResponse: HoldDetailApiResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          interType: 'BHOLD',
          interCode: 'AH',
          description: 'Audit Hold',
          unitId: null,
          entryDate: todayStr,
          terminationDate: null,
          insertUser: 'admin',
          releaseDate: null,
          releaseUser: ''
        }],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getUnitHolds({ transactionId: 'TXN001', donorId: 'D001' }).subscribe(records => {
        expect(records.length).toBe(1);
        expect(records[0].type).toBe('BHOLD');
        expect(records[0].code).toBe('AH');
        expect(records[0].description).toBe('Audit Hold');
        expect(records[0].entryDate).toBe(todayStr);
        expect(records[0].insUser).toBe('admin');
        done();
      });
    });


  });

  describe('getDonorHolds', () => {
    it('should return mapped hold detail records', (done) => {
      const mockResponse: HoldDetailApiResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          interType: 'DHOLD',
          interCode: 'DH',
          description: 'Donor Hold',
          unitId: null,
          entryDate: todayStr,
          terminationDate: todayStr,
          insertUser: '',
          releaseDate: todayStr,
          releaseUser: 'admin'
        }],
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getDonorHolds({ transactionId: 'TXN001', donorId: 'D001' }).subscribe(records => {
        expect(records.length).toBe(1);
        expect(records[0].type).toBe('DHOLD');
        expect(records[0].terminationDate).toBe(todayStr);
        expect(records[0].relUser).toBe('admin');
        done();
      });
    });

  });

  /* -------------------------------- buildHoldDetails -------------------------------- */

  describe('buildHoldDetails', () => {
    const createMockAuditHoldRecord = (overrides: Partial<AuditHoldRecord> = {}): AuditHoldRecord => ({
      unitId: 'U001',
      collectionDate: today.format('DD-MMM-YYYY').toUpperCase(),
      name: 'John Doe',
      dateOfBirth: '01-JAN-1990',
      sex: 'M',
      donorId: 'D001',
      donationType: 'WB',
      donationProcedure: 'PC01',
      hold: 'AH',
      origin: 'LAB',
      reason: 'R01',
      removed: null,
      transactionId: 'TXN001',
      interDescription: 'Audit Hold',
      groupId: 'G1',
      groupMode: 'M1',
      sourceCode: 'SC01',
      holdSource: 'UNIT',
      effectiveDate: today.format('DD-MMM-YYYY').toUpperCase(),
      insertDate: today.format('DD-MMM-YYYY').toUpperCase(),
      termDate: null,
      releaseUser: null,
      ...overrides
    });

    it('should segment records into unit holds and donor holds', () => {
      const records = [
        createMockAuditHoldRecord({ holdSource: 'UNIT' }),
        createMockAuditHoldRecord({ holdSource: 'DONOR' }),
        createMockAuditHoldRecord({ unitId: 'U002', holdSource: 'UNIT' })
      ];

      const result = service.buildHoldDetails(records, 'U001', today.format('DD-MMM-YYYY').toUpperCase());

      expect(result.unitHolds.holds.length).toBe(1);
      expect(result.donorHolds.holds.length).toBe(1);
      expect(result.unitHolds.unitId).toBe('U001');
    });


    it('should map fields correctly to HoldDetailRecord', () => {
      const records = [
        createMockAuditHoldRecord({
          hold: 'BHOLD',
          reason: 'R01',
          interDescription: 'Blood Hold',
          insertDate: today.format('DD-MMM-YYYY').toUpperCase(),
          termDate: null,
          releaseUser: 'admin'
        })
      ];

      const result = service.buildHoldDetails(records, 'U001', today.format('DD-MMM-YYYY').toUpperCase());

      expect(result.unitHolds.holds[0].type).toBe('BHOLD');
      expect(result.unitHolds.holds[0].code).toBe('R01');
      expect(result.unitHolds.holds[0].description).toBe('Blood Hold');
      expect(result.unitHolds.holds[0].relUser).toBe('admin');
    });


    it('should preserve collection date in result', () => {
      const collDate = today.format('DD-MMM-YYYY').toUpperCase();
      const result = service.buildHoldDetails([], 'U001', collDate);

      expect(result.unitHolds.collectionDate).toBe(collDate);
      expect(result.donorHolds.collectionDate).toBe(collDate);
    });
  });
});
