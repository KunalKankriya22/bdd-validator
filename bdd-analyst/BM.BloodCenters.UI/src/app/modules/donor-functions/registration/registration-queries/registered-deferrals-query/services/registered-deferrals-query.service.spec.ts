import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RegisteredDeferralsQueryService } from './registered-deferrals-query.service';
import { ApiService } from '@shared/services/api.service';
import { RegisteredDeferralsQueryRequest } from '../models/registered-deferrals-query.model';

describe('RegisteredDeferralsQueryService', () => {
  let service: RegisteredDeferralsQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockLookupsResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: {
      driveIds: [{ code: 'DRV001', description: 'DRV001' }],
      users: [{ code: 'CELHUN', description: 'CELHUN' }],
      deferralIds: [{ code: '01012018', description: '01012018' }],
      transactionIds: [{ code: 'TR02866892', description: 'TR02866892' }],
    },
    errorResponse: { errorCode: '', error: '' },
  };

  const mockQueryResponse = {
    success: true,
    message: '',
    statusCode: 200,
    data: [
      {
        deferralId: '01012018',
        transactionId: 'TR02866892',
        driveId: 'DRV0164777',
        donorId: 'DN30120470',
        donationType: 'AL',
        procedureCode: 'WB',
        user: 'CELHUN',
        dateTimeOfRegistration: '2025-01-11T09:05:00',
        auditComplete: '--',
      },
    ],
    total: 1,
    errorResponse: { errorCode: '', error: '' },
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        RegisteredDeferralsQueryService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(RegisteredDeferralsQueryService);
  });

  describe('getLookups', () => {
    it('should return lookup data from all 4 LOV endpoints', (done) => {
      mockApiService.get.and.returnValues(
        of([{ code: 'DRV001', description: 'DRV001' }]),
        of([{ code: 'CELHUN', description: 'CELHUN' }]),
        of([{ code: '01012018', description: '01012018' }]),
        of([{ code: 'TR02866892', description: 'TR02866892' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(1);
          expect(result.users.length).toBe(1);
          expect(result.deferralIds.length).toBe(1);
          expect(result.transactionIds.length).toBe(1);
          done();
        },
      });
    });

    it('should return empty arrays when individual LOV endpoints fail', (done) => {
      mockApiService.get.and.returnValues(
        throwError(() => new Error('Network error')),
        of([{ code: 'CELHUN', description: 'CELHUN' }]),
        of([{ code: '01012018', description: '01012018' }]),
        of([{ code: 'TR02866892', description: 'TR02866892' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds).toEqual([]);
          expect(result.users.length).toBe(1);
          expect(result.deferralIds.length).toBe(1);
          expect(result.transactionIds.length).toBe(1);
          done();
        },
      });
    });
  });

  describe('query', () => {
    const request: RegisteredDeferralsQueryRequest = {
      driveDateFrom: '2025-01-01',
      driveDateTo: '2025-01-31',
      driveId: '',
      user: '',
      deferralId: '',
      transactionId: '',
      setId: '',
      chapterId: 'CH001',
      sortField: '',
      sortDirection: '',
    };


    it('should return empty array when response data is null', (done) => {
      mockApiService.post.and.returnValue(of({ ...mockQueryResponse, data: null }));

      service.query(request).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });


    it('should correctly map API response fields (insertUser, insertDate, auditFlag)', (done) => {
      const apiResponse = [
        {
          deferralId: '01012018',
          transactionId: 'TR02866892',
          driveId: 'DRV0164777',
          donorId: 'DN30120470',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'Smith, John',
          insertDate: '2025-01-11T09:05:00',
          auditFlag: 'Y',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(request).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].user).toBe('Smith, John');
          expect(result[0].dateTimeOfRegistration).toBe('2025-01-11T09:05:00');
          expect(result[0].auditComplete).toBe('Yes');
          done();
        },
      });
    });


    it('should map collDate as fallback for driveDate', (done) => {
      const apiResponse = [
        {
          deferralId: '01012018',
          transactionId: 'TR02866892',
          driveId: 'DRV0164777',
          donorId: 'DN30120470',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'CELHUN',
          insertDate: '2025-01-11T09:05:00',
          auditFlag: 'Y',
          collDate: '2025-01-10',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(request).subscribe({
        next: (result) => {
          expect(result[0].driveDate).toBe('2025-01-10');
          done();
        },
      });
    });

    it('should not send setId equal to deferralId in the backend request', (done) => {
      const deferralRequest: RegisteredDeferralsQueryRequest = {
        driveDateFrom: '',
        driveDateTo: '',
        driveId: '',
        user: '',
        deferralId: '20000117',
        transactionId: '',
        setId: '',
        chapterId: 'CH001',
        sortField: '',
        sortDirection: '',
      };

      mockApiService.post.and.returnValue(of({ data: [] }));

      service.query(deferralRequest).subscribe({
        next: () => {
          const postedBody = mockApiService.post.calls.mostRecent().args[1];
          expect(postedBody.deferralId).toBe('20000117');
          expect(postedBody.setId).toBeNull();
          done();
        },
      });
    });

    it('should send setId as null even when deferralId has a value', (done) => {
      const deferralRequest: RegisteredDeferralsQueryRequest = {
        driveDateFrom: '2025-01-01',
        driveDateTo: '2025-01-31',
        driveId: '',
        user: '',
        deferralId: '20000115',
        transactionId: '',
        setId: '',
        chapterId: 'CH001',
        sortField: 'deferralId',
        sortDirection: 'DESC',
      };

      mockApiService.post.and.returnValue(of({ data: [] }));

      service.query(deferralRequest).subscribe({
        next: () => {
          const postedBody = mockApiService.post.calls.mostRecent().args[1];
          expect(postedBody.deferralId).toBe('20000115');
          expect(postedBody.setId).toBeNull();
          expect(postedBody.fromDate).toBe('2025-01-01');
          expect(postedBody.toDate).toBe('2025-01-31');
          done();
        },
      });
    });
  });

  describe('extractLookupData - Drive ID LOV', () => {
    it('should map drive ID to show only the ID (not sponsor name)', (done) => {
      mockApiService.get.and.returnValues(
        of([
          { driveId: 'DRV001', sponsorName: 'Red Cross', driveDate: '2025-01-15' },
          { driveId: 'DRV002', sponsorName: 'Hospital ABC' }
        ]),
        of([{ userId: 'USER1', userName: 'Test User' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(2);
          expect(result.driveIds[0].code).toBe('DRV001');
          expect(result.driveIds[0].description).toBe('DRV001'); // Should be ID only, not sponsor name
          expect(result.driveIds[1].code).toBe('DRV002');
          expect(result.driveIds[1].description).toBe('DRV002');
          done();
        },
      });
    });
  });

  describe('extractLookupData - Deferral ID LOV', () => {
    it('should map deferralId field for deferrals LOV', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([
          { deferralId: '01012018' },
          { deferralId: '02022018' }
        ]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.deferralIds.length).toBe(2);
          expect(result.deferralIds[0].code).toBe('01012018');
          expect(result.deferralIds[0].description).toBe('01012018');
          expect(result.deferralIds[1].code).toBe('02022018');
          done();
        },
      });
    });

    it('should fallback to setId field if deferralId is not present', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([
          { setId: 'BAT212789' },
          { setId: 'BAT212790' }
        ]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.deferralIds.length).toBe(2);
          expect(result.deferralIds[0].code).toBe('BAT212789');
          expect(result.deferralIds[0].description).toBe('BAT212789');
          done();
        },
      });
    });
  });

  describe('extractLookupData - User LOV', () => {
    it('should map userId and userName fields', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([
          { userId: 'CELHUN', userName: 'Hunter, Celeste' },
          { userId: 'CYNCUL', userName: 'Cullen, Cynthia' }
        ]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.users.length).toBe(2);
          expect(result.users[0].code).toBe('CELHUN');
          expect(result.users[0].description).toBe('Hunter, Celeste');
          expect(result.users[1].code).toBe('CYNCUL');
          expect(result.users[1].description).toBe('Cullen, Cynthia');
          done();
        },
      });
    });
  });

  describe('extractLookupData - Transaction ID LOV', () => {
    it('should map transactionId field', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([
          { transactionId: 'TR02866892' },
          { transactionId: 'TR02866893' }
        ]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.transactionIds.length).toBe(2);
          expect(result.transactionIds[0].code).toBe('TR02866892');
          expect(result.transactionIds[0].description).toBe('TR02866892');
          expect(result.transactionIds[1].code).toBe('TR02866893');
          done();
        },
      });
    });
  });

  describe('getLookups - SETS_LOV', () => {
    it('should call all 5 LOV endpoints including SETS_LOV', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([{ setId: 'BAT001' }, { setId: 'BAT002' }])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(1);
          expect(result.users.length).toBe(1);
          expect(result.deferralIds.length).toBe(1);
          expect(result.transactionIds.length).toBe(1);
          expect(result.setIds.length).toBe(2);
          expect(result.setIds[0].code).toBe('BAT001');
          expect(result.setIds[1].code).toBe('BAT002');
          expect(mockApiService.get).toHaveBeenCalledTimes(5);
          done();
        },
      });
    });

    it('should pass fromDate and toDate as HttpParams to LOV endpoints', (done) => {
      mockApiService.get.and.returnValues(
        of([]), of([]), of([]), of([]), of([])
      );

      service.getLookups('2026-01-01', '2026-06-30').subscribe({
        next: () => {
          const calls = mockApiService.get.calls.allArgs();
          expect(calls.length).toBe(5);
          // Each call should have opts with params containing fromDate and toDate
          calls.forEach((args: any[]) => {
            const opts = args[1];
            expect(opts).toBeTruthy();
            expect(opts.params).toBeTruthy();
            expect(opts.params.get('fromDate')).toBe('2026-01-01');
            expect(opts.params.get('toDate')).toBe('2026-06-30');
          });
          done();
        },
      });
    });

    it('should return empty setIds when SETS_LOV fails', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        throwError(() => new Error('Sets endpoint failed'))
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(1);
          expect(result.users.length).toBe(1);
          expect(result.deferralIds.length).toBe(1);
          expect(result.transactionIds.length).toBe(1);
          expect(result.setIds).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getLovLimit', () => {
    it('should return value from API', (done) => {
      mockApiService.get.and.returnValue(of({ item: 30 }));

      service.getLovLimit().subscribe({
        next: (result) => {
          expect(result).toBe(30);
          done();
        },
      });
    });

    it('should return 21 when API fails', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('API error')));

      service.getLovLimit().subscribe({
        next: (result) => {
          expect(result).toBe(21);
          done();
        },
      });
    });
  });

  describe('extractLookupData - response format variations', () => {
    it('should extract data from { data: [] } wrapper format', (done) => {
      mockApiService.get.and.returnValues(
        of({ data: [{ driveId: 'DRV001' }, { driveId: 'DRV002' }] }),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(2);
          expect(result.driveIds[0].code).toBe('DRV001');
          expect(result.driveIds[1].code).toBe('DRV002');
          done();
        },
      });
    });

    it('should extract data from { Data: [] } wrapper format (capitalized)', (done) => {
      mockApiService.get.and.returnValues(
        of({ Data: [{ driveId: 'DRV001' }] }),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(1);
          expect(result.driveIds[0].code).toBe('DRV001');
          done();
        },
      });
    });

    it('should find first array property when response is an object without data/Data keys', (done) => {
      mockApiService.get.and.returnValues(
        of({ records: [{ driveId: 'DRV001' }] }),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds.length).toBe(1);
          expect(result.driveIds[0].code).toBe('DRV001');
          done();
        },
      });
    });

    it('should return empty array when response object has no array properties', (done) => {
      mockApiService.get.and.returnValues(
        of({ message: 'No records found', count: 0 }),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array when response is null', (done) => {
      mockApiService.get.and.returnValues(
        of(null),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds).toEqual([]);
          done();
        },
      });
    });
  });

  describe('extractLookupData - generic fallback field mapping', () => {
    it('should use generic code/description fields when no LOV-specific fields present', (done) => {
      mockApiService.get.and.returnValues(
        of([{ code: 'GEN001', description: 'Generic Item One' }]),
        of([{ code: 'GEN002', description: 'Generic Item Two' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds[0].code).toBe('GEN001');
          expect(result.driveIds[0].description).toBe('Generic Item One');
          expect(result.users[0].code).toBe('GEN002');
          expect(result.users[0].description).toBe('Generic Item Two');
          done();
        },
      });
    });

    it('should fall back to id/name fields in generic mapping', (done) => {
      mockApiService.get.and.returnValues(
        of([{ id: 'ID001', name: 'Named Item' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds[0].code).toBe('ID001');
          expect(result.driveIds[0].description).toBe('Named Item');
          done();
        },
      });
    });

    it('should fall back to Value/Label fields in generic mapping', (done) => {
      mockApiService.get.and.returnValues(
        of([{ Value: 'VAL001', Label: 'Label One' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds[0].code).toBe('VAL001');
          expect(result.driveIds[0].description).toBe('Label One');
          done();
        },
      });
    });

    it('should fall back to first object value when no recognized fields exist', (done) => {
      mockApiService.get.and.returnValues(
        of([{ unknownField: 'UNKNOWN1' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds[0].code).toBe('UNKNOWN1');
          // description falls back to code when no description-like field exists
          expect(result.driveIds[0].description).toBe('UNKNOWN1');
          done();
        },
      });
    });
  });

  describe('extractLookupData - PascalCase LOV fields', () => {
    it('should map PascalCase DriveId field', (done) => {
      mockApiService.get.and.returnValues(
        of([{ DriveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.driveIds[0].code).toBe('DRV001');
          expect(result.driveIds[0].description).toBe('DRV001');
          done();
        },
      });
    });

    it('should map PascalCase DeferralId field', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ DeferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.deferralIds[0].code).toBe('01012018');
          expect(result.deferralIds[0].description).toBe('01012018');
          done();
        },
      });
    });

    it('should map PascalCase TransactionId field', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ deferralId: '01012018' }]),
        of([{ TransactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.transactionIds[0].code).toBe('TR001');
          expect(result.transactionIds[0].description).toBe('TR001');
          done();
        },
      });
    });

    it('should map PascalCase UserId and UserName fields', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ UserId: 'JSMITH', UserName: 'Smith, John' }]),
        of([{ deferralId: '01012018' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.users[0].code).toBe('JSMITH');
          expect(result.users[0].description).toBe('Smith, John');
          done();
        },
      });
    });

    it('should fall back to SetId when deferralId and DeferralId are absent', (done) => {
      mockApiService.get.and.returnValues(
        of([{ driveId: 'DRV001' }]),
        of([{ userId: 'USER1' }]),
        of([{ SetId: 'BAT999' }]),
        of([{ transactionId: 'TR001' }]),
        of([])
      );

      service.getLookups().subscribe({
        next: (result) => {
          expect(result.deferralIds[0].code).toBe('BAT999');
          expect(result.deferralIds[0].description).toBe('BAT999');
          done();
        },
      });
    });
  });

  describe('query - response format variations', () => {
    const baseRequest: RegisteredDeferralsQueryRequest = {
      driveDateFrom: '2025-01-01',
      driveDateTo: '2025-01-31',
      driveId: '',
      user: '',
      deferralId: '',
      transactionId: '',
      setId: '',
      chapterId: 'CH001',
      sortField: '',
      sortDirection: '',
    };

    const sampleBackendRow = {
      deferralId: '01012018',
      transactionId: 'TR001',
      setId: 'BAT001',
      driveId: 'DRV001',
      donorId: 'DN001',
      donationType: 'AL',
      procedureCode: 'WB',
      insertUser: 'TESTUSER',
      insertDate: '2025-01-11T09:05:00',
      auditFlag: 'Y',
    };

    it('should extract data from { Data: [] } wrapper (capitalized)', (done) => {
      mockApiService.post.and.returnValue(of({ Data: [sampleBackendRow] }));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].deferralId).toBe('01012018');
          expect(result[0].user).toBe('TESTUSER');
          done();
        },
      });
    });

    it('should extract data from { items: [] } wrapper', (done) => {
      mockApiService.post.and.returnValue(of({ items: [sampleBackendRow] }));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].deferralId).toBe('01012018');
          done();
        },
      });
    });

    it('should extract data from { results: [] } wrapper', (done) => {
      mockApiService.post.and.returnValue(of({ results: [sampleBackendRow] }));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].transactionId).toBe('TR001');
          done();
        },
      });
    });

    it('should return empty array for unexpected response format with no arrays', (done) => {
      mockApiService.post.and.returnValue(of({ message: 'No data', count: 0 }));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should propagate errors from the API through throwError', (done) => {
      const error = new Error('Server Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.query(baseRequest).subscribe({
        error: (err) => {
          expect(err.message).toBe('Server Error');
          done();
        },
      });
    });
  });

  describe('mapDeferralRow - field name variations', () => {
    const baseRequest: RegisteredDeferralsQueryRequest = {
      driveDateFrom: '2025-01-01',
      driveDateTo: '2025-01-31',
      driveId: '',
      user: '',
      deferralId: '',
      transactionId: '',
      setId: '',
      chapterId: 'CH001',
      sortField: '',
      sortDirection: '',
    };

    it('should map PascalCase field names from backend response', (done) => {
      const apiResponse = [
        {
          DeferralId: '01012018',
          TransactionId: 'TR001',
          SetId: 'BAT001',
          DriveId: 'DRV001',
          DonorId: 'DN001',
          DonationType: 'AL',
          ProcedureCode: 'WB',
          InsertUser: 'Smith, John',
          InsertDate: '2025-01-11T09:05:00',
          AuditFlag: 'Y',
          DriveDate: '2025-01-10',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].deferralId).toBe('01012018');
          expect(result[0].transactionId).toBe('TR001');
          expect(result[0].setId).toBe('BAT001');
          expect(result[0].driveId).toBe('DRV001');
          expect(result[0].donorId).toBe('DN001');
          expect(result[0].donationType).toBe('AL');
          expect(result[0].procedureCode).toBe('WB');
          expect(result[0].user).toBe('Smith, John');
          expect(result[0].dateTimeOfRegistration).toBe('2025-01-11T09:05:00');
          expect(result[0].auditComplete).toBe('Yes');
          expect(result[0].driveDate).toBe('2025-01-10');
          done();
        },
      });
    });

    it('should map snake_case field names from backend response', (done) => {
      const apiResponse = [
        {
          deferral_id: '02022018',
          transaction_id: 'TR002',
          set_id: 'BAT002',
          drive_id: 'DRV002',
          donor_id: 'DN002',
          donation_type: 'AP',
          procedure_code: 'PLT',
          user_name: 'USER2',
          date_time_of_registration: '2025-02-11T10:00:00',
          audit_complete: 'N',
          drive_date: '2025-02-10',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].deferralId).toBe('02022018');
          expect(result[0].transactionId).toBe('TR002');
          expect(result[0].setId).toBe('BAT002');
          expect(result[0].driveId).toBe('DRV002');
          expect(result[0].donorId).toBe('DN002');
          expect(result[0].donationType).toBe('AP');
          expect(result[0].procedureCode).toBe('PLT');
          expect(result[0].user).toBe('USER2');
          expect(result[0].dateTimeOfRegistration).toBe('2025-02-11T10:00:00');
          expect(result[0].auditComplete).toBe('No');
          expect(result[0].driveDate).toBe('2025-02-10');
          done();
        },
      });
    });

    it('should not fallback SetId to deferralId when deferralId is missing', (done) => {
      const apiResponse = [
        {
          SetId: 'BAT999',
          transactionId: 'TR003',
          driveId: 'DRV003',
          donorId: 'DN003',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'TESTUSER',
          insertDate: '2025-03-11T11:00:00',
          auditFlag: '--',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result[0].deferralId).toBe('');
          expect(result[0].setId).toBe('BAT999');
          done();
        },
      });
    });

    it('should map userName/UserName as fallback for user field', (done) => {
      const apiResponse = [
        {
          deferralId: '01012018',
          transactionId: 'TR001',
          driveId: 'DRV001',
          donorId: 'DN001',
          donationType: 'AL',
          procedureCode: 'WB',
          UserName: 'Doe, Jane',
          insertDate: '2025-01-11T09:05:00',
          auditFlag: 'Y',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result[0].user).toBe('Doe, Jane');
          done();
        },
      });
    });

    it('should map RegDateTime as fallback for dateTimeOfRegistration', (done) => {
      const apiResponse = [
        {
          deferralId: '01012018',
          transactionId: 'TR001',
          driveId: 'DRV001',
          donorId: 'DN001',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'TESTUSER',
          RegDateTime: '2025-04-11T14:30:00',
          auditFlag: 'Y',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result[0].dateTimeOfRegistration).toBe('2025-04-11T14:30:00');
          done();
        },
      });
    });

    it('should return empty strings for completely missing fields', (done) => {
      const apiResponse = [{}];
      mockApiService.post.and.returnValue(of(apiResponse));

      service.query(baseRequest).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].deferralId).toBe('');
          expect(result[0].transactionId).toBe('');
          expect(result[0].setId).toBe('');
          expect(result[0].driveId).toBe('');
          expect(result[0].donorId).toBe('');
          expect(result[0].user).toBe('');
          expect(result[0].dateTimeOfRegistration).toBe('');
          expect(result[0].auditComplete).toBe('');
          done();
        },
      });
    });
  });

  describe('getLovLimit - edge cases', () => {
    it('should return 21 when response has no item property', (done) => {
      mockApiService.get.and.returnValue(of({}));

      service.getLovLimit().subscribe({
        next: (result) => {
          expect(result).toBe(21);
          done();
        },
      });
    });

    it('should return 21 when response item is 0', (done) => {
      mockApiService.get.and.returnValue(of({ item: 0 }));

      service.getLovLimit().subscribe({
        next: (result) => {
          // 0 is falsy so || 21 kicks in
          expect(result).toBe(21);
          done();
        },
      });
    });
  });

  describe('getLookups - only fromDate provided', () => {
    it('should set only fromDate param when toDate is not provided', (done) => {
      mockApiService.get.and.returnValues(
        of([]), of([]), of([]), of([]), of([])
      );

      service.getLookups('2026-01-01').subscribe({
        next: () => {
          const calls = mockApiService.get.calls.allArgs();
          calls.forEach((args: any[]) => {
            const opts = args[1];
            expect(opts.params.get('fromDate')).toBe('2026-01-01');
            expect(opts.params.get('toDate')).toBeNull();
          });
          done();
        },
      });
    });
  });

  describe('query - setId mapping', () => {
    it('should map setId field in query response', (done) => {
      const apiResponse = [
        {
          deferralId: '01012018',
          transactionId: 'TR02866892',
          setId: 'BAT001',
          driveId: 'DRV0164777',
          donorId: 'DN30120470',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'CELHUN',
          insertDate: '2025-01-11T09:05:00',
          auditFlag: 'Y',
        },
      ];

      mockApiService.post.and.returnValue(of(apiResponse));

      const request: RegisteredDeferralsQueryRequest = {
        driveDateFrom: '2025-01-01',
        driveDateTo: '2025-01-31',
        driveId: '',
        user: '',
        deferralId: '',
        transactionId: '',
        setId: '',
        chapterId: 'CH001',
        sortField: '',
        sortDirection: '',
      };

      service.query(request).subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].setId).toBe('BAT001');
          done();
        },
      });
    });
  });
});
