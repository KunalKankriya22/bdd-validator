import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeferralsOnHoldQueryService } from './deferrals-on-hold-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { DeferralHoldQueryDto } from '../models/deferrals-on-hold-query.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DeferralsOnHoldQueryService', () => {
  let service: DeferralsOnHoldQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      providers: [
        DeferralsOnHoldQueryService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    service = TestBed.inject(DeferralsOnHoldQueryService);
  });


  describe('searchDeferralHolds', () => {
    const request: DeferralHoldQueryDto = {
      driveDateFrom: '2025-01-01',
      driveDateTo: '2025-01-31',
    };

    it('should map API response fields to frontend model fields', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          deferralId: '01012018',
          transactionId: 'TR02866892',
          driveId: 'DRV0164777',
          donorId: 'DN30120470',
          donorName: 'JOHN DOE',
          collDate: '2025-01-10T00:00:00',
          donationType: 'AL',
          procedureCode: 'WB',
          insertUser: 'CELHUN',
          insertUserName: 'Hunter, Cel',
          insertDate: '2025-01-11T09:05:00',
          nAuditFlag: 'Y',
        }],
        total: 1,
        error: '',
        errorResponse: { errorCode: '', error: '' },
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(1000, 0, request).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].user).toBe('CELHUN');
        expect(result.data[0].dateTimeOfRegistration).toBe('2025-01-11T09:05:00');
        expect(result.data[0].auditComplete).toBe('Y');
        expect(result.data[0].donorName).toBe('JOHN DOE');
        expect(result.data[0].deferralId).toBe('01012018');
        done();
      });
    });

    it('should map request DTO fields to backend field names', (done) => {
      const requestWithAllFields: DeferralHoldQueryDto = {
        driveDateFrom: '2025-01-01',
        driveDateTo: '2025-01-31',
        driveId: 'DRV001',
        deferralId: 'DEF001',
        transactionId: 'TR001',
        userId: 'USER01',
        interdictionCode: 'DRDEF,HOLD',
        sortBy: 'user',
        sortDirection: 'DESC',
      };
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [],
        total: 0,
        error: '',
        errorResponse: { errorCode: '', error: '' },
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, requestWithAllFields).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.fromDate).toBe('2025-01-01');
        expect(postedBody.toDate).toBe('2025-01-31');
        expect(postedBody.driveId).toBe('DRV001');
        expect(postedBody.deferralId).toBe('DEF001');
        expect(postedBody.transactionId).toBe('TR001');
        expect(postedBody.userId).toBe('USER01');
        expect(postedBody.interCode).toBe('DRDEF,HOLD');
        expect(postedBody.sortColumn).toBe('InsertUser');
        expect(postedBody.sort).toBe('D');
        expect(postedBody.driveDateFrom).toBeUndefined();
        expect(postedBody.interdictionCode).toBeUndefined();
        expect(postedBody.sortBy).toBeUndefined();
        done();
      });
    });

    it('should throw error on non-404 errors', (done) => {
      const error = { status: 500, error: { message: 'Server error' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.searchDeferralHolds(1000, 0, request).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });

    it('should default data to empty array and total to 0 when response has null values', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: null as any,
        total: null as any,
        error: '',
        errorResponse: { errorCode: '', error: '' },
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, request).subscribe((result) => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should map nullable DTO fields to empty strings', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          deferralId: 'DEF001',
          transactionId: 'TR001',
          setId: null,
          driveId: 'DRV001',
          donorId: 'DON001',
          donorName: null,
          collDate: null,
          donationType: 'WB',
          procedureCode: 'PC',
          insertUser: 'USR',
          insertUserName: '',
          insertDate: null,
          nAuditFlag: 'N',
        }],
        total: 1,
        error: '',
        errorResponse: { errorCode: '', error: '' },
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, request).subscribe((result) => {
        expect(result.data[0].batchId).toBe('');
        expect(result.data[0].collDate).toBe('');
        expect(result.data[0].donorName).toBe('');
        expect(result.data[0].dateTimeOfRegistration).toBe('');
        done();
      });
    });

    it('should map ascending sort direction to A', (done) => {
      const ascRequest: DeferralHoldQueryDto = {
        driveDateFrom: '2025-01-01',
        sortBy: 'deferralId',
        sortDirection: 'ASC',
      };
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, ascRequest).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.sort).toBe('A');
        expect(postedBody.sortColumn).toBe('DeferralId');
        done();
      });
    });

    it('should pass through unmapped sort columns as-is', (done) => {
      const unmappedRequest: DeferralHoldQueryDto = {
        driveDateFrom: '2025-01-01',
        sortBy: 'unknownColumn',
        sortDirection: 'D',
      };
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, unmappedRequest).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.sortColumn).toBe('unknownColumn');
        expect(postedBody.sort).toBe('D');
        done();
      });
    });

    it('should set sortColumn and sort to undefined when not provided in queryDto', (done) => {
      const minimalRequest: DeferralHoldQueryDto = {};
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, minimalRequest).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.sortColumn).toBeUndefined();
        expect(postedBody.sort).toBeUndefined();
        expect(postedBody.fromDate).toBeUndefined();
        expect(postedBody.toDate).toBeUndefined();
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      const mockResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, request).subscribe(() => {
        const callArgs = apiServiceSpy.post.calls.mostRecent().args;
        const options = callArgs[2];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('getDrivesLov', () => {
    it('should map backend fields to LookupDto', (done) => {
      const mockResponse = {
        success: true,
        data: [{ driveId: 'DRV001', driveDate: '2025-01-01', sponsorName: 'Test Sponsor' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DRV001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/drives-lov$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append date params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [{ driveId: 'DRV001', driveDate: '2025-01-01', sponsorName: 'Test' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov('2025-01-01', '2025-01-31').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/drives-lov\?fromDate=2025-01-01&toDate=2025-01-31/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should handle partial date params', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov('2025-01-01').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/drives-lov\?fromDate=2025-01-01$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should use driveId as description when sponsorName is falsy', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { driveId: 'DRV001', driveDate: '2025-01-01', sponsorName: '' },
          { driveId: 'DRV002', driveDate: '2025-01-02', sponsorName: null as any },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov().subscribe((result) => {
        expect(result[0].description).toBe('DRV001');
        expect(result[1].description).toBe('DRV002');
        done();
      });
    });

    it('should format description as driveId - sponsorName when sponsorName exists', (done) => {
      const mockResponse = {
        success: true,
        data: [{ driveId: 'DRV001', driveDate: '2025-01-01', sponsorName: 'ABC Corp' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov().subscribe((result) => {
        expect(result[0].description).toBe('DRV001 - ABC Corp');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDrivesLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getTransactionsLov', () => {
    it('should map backend fields to LookupDto', (done) => {
      const mockResponse = { success: true, data: [{ transactionId: 'TR001', collDate: '2025-01-10' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('TR001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/transactions-lov$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append date params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov('2025-01-01', '2025-01-31').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/transactions-lov\?fromDate=2025-01-01&toDate=2025-01-31/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append driveId param to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov(undefined, undefined, 'DRV001').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/transactions-lov\?driveId=DRV001/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append all params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov('2025-01-01', '2025-01-31', 'DRV001').subscribe(() => {
        const call = apiServiceSpy.get.calls.mostRecent();
        const url = call.args[0];
        expect(url).toContain('fromDate=2025-01-01');
        expect(url).toContain('toDate=2025-01-31');
        expect(url).toContain('driveId=DRV001');
        done();
      });
    });

    it('should format description as transactionId - collDate when collDate exists', (done) => {
      const mockResponse = { success: true, data: [{ transactionId: 'TR001', collDate: '2025-01-10' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe((result) => {
        expect(result[0].description).toBe('TR001 - 2025-01-10');
        done();
      });
    });

    it('should use transactionId as description when collDate is falsy', (done) => {
      const mockResponse = { success: true, data: [{ transactionId: 'TR001', collDate: '' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe((result) => {
        expect(result[0].description).toBe('TR001');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getTransactionsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getUsersLov', () => {
    it('should map backend fields to LookupDto with enriched description', (done) => {
      const mockResponse = { success: true, data: [{ userId: 'USER01', userName: 'Test User' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('USER01');
        expect(result[0].description).toBe('USER01 - Test User');
        done();
      });
    });

    it('should append date params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov('2025-01-01', '2025-01-31').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/users-lov\?fromDate=2025-01-01&toDate=2025-01-31/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append driveId param to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov('2025-01-01', '2025-01-31', 'DRV001').subscribe(() => {
        const call = apiServiceSpy.get.calls.mostRecent();
        const url = call.args[0];
        expect(url).toContain('fromDate=2025-01-01');
        expect(url).toContain('toDate=2025-01-31');
        expect(url).toContain('driveId=DRV001');
        done();
      });
    });

    it('should strip leading and trailing separators from userName', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { userId: 'USER01', userName: ', -Test User- ,' },
          { userId: 'USER02', userName: '  , Doe, Jane  ' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result[0].description).toBe('USER01 - Test User');
        expect(result[1].description).toBe('USER02 - Doe, Jane');
        done();
      });
    });

    it('should use userId as description when userName is empty or only separators', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { userId: 'USER01', userName: '' },
          { userId: 'USER02', userName: ', - ,' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result[0].description).toBe('USER01');
        expect(result[1].description).toBe('USER02');
        done();
      });
    });

    it('should use userId as description when userName is null', (done) => {
      const mockResponse = {
        success: true,
        data: [{ userId: 'USER01', userName: null as any }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result[0].description).toBe('USER01');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getUsersLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getDeferralsLov', () => {
    it('should map backend fields to LookupDto', (done) => {
      const mockResponse = {
        success: true,
        data: [{ deferralId: 'DEF001' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DEF001');
        expect(result[0].description).toBe('DEF001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/deferrals-lov$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append date params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [{ deferralId: 'DEF001' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov('2025-01-01', '2025-01-31').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/deferrals-lov\?fromDate=2025-01-01&toDate=2025-01-31/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append driveId param to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov('2025-01-01', '2025-01-31', 'DRV001').subscribe(() => {
        const call = apiServiceSpy.get.calls.mostRecent();
        const url = call.args[0];
        expect(url).toContain('fromDate=2025-01-01');
        expect(url).toContain('toDate=2025-01-31');
        expect(url).toContain('driveId=DRV001');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDeferralsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getSetsLov', () => {
    it('should map backend fields to LookupDto', (done) => {
      const mockResponse = {
        success: true,
        data: [{ setId: 'SET001', collDate: '2025-01-10' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('SET001');
        expect(result[0].description).toBe('SET001');
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/sets-lov$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should append date params to URL when provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov('2025-01-01', '2025-01-31').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/sets-lov\?fromDate=2025-01-01&toDate=2025-01-31/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getSetsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getInterdictionCodesLov', () => {
    it('should map backend fields to LookupDto', (done) => {
      const mockResponse = { success: true, data: [{ interCode: 'DRDEF', interDesc: 'Deferral Hold' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesLov().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DRDEF');
        expect(result[0].description).toBe('Deferral Hold');
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getInterdictionCodesLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getDonorInterdictions', () => {
    it('should map backend fields to frontend model', (done) => {
      const mockResponse = {
        success: true,
        data: [{
          interType: 'HOLDS',
          interCode: 'TEST',
          interDescription: 'Test hold',
          originatedFrom: 'Deferral Entry',
          effDate: '2025-01-01',
          termDate: null,
          insertDate: '2025-01-01',
          donorId: 'DON001',
          donorName: 'Test Donor',
        }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001', false).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('HOLDS');
        expect(result[0].code).toBe('TEST');
        expect(result[0].description).toBe('Test hold');
        expect(result[0].entryDate).toBe('2025-01-01');
        expect(result[0].effectiveDate).toBe('2025-01-01');
        expect(result[0].terminationDate).toBe('');
        done();
      });
    });

    it('should default activeOnly to false when not provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('activeOnly=false');
        done();
      });
    });

    it('should pass activeOnly=true when specified', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001', true).subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('activeOnly=true');
        done();
      });
    });

    it('should default nullable date fields to empty strings', (done) => {
      const mockResponse = {
        success: true,
        data: [{
          interType: 'HOLDS',
          interCode: 'TEST',
          interDescription: 'Test hold',
          originatedFrom: 'Manual',
          effDate: null,
          termDate: null,
          insertDate: null,
          donorId: 'DON001',
          donorName: 'Test',
        }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001').subscribe((result) => {
        expect(result[0].entryDate).toBe('');
        expect(result[0].effectiveDate).toBe('');
        expect(result[0].terminationDate).toBe('');
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const error = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonorInterdictions('TR001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('getDonationInterdictions', () => {
    it('should map backend fields to frontend model', (done) => {
      const mockResponse = {
        success: true,
        data: [{
          interType: 'HOLDS',
          interCode: 'DRDEF',
          reason: 'Donor deferral due to deferral reason',
          transactionId: 'TR001',
          unitId: '',
          insertDate: '2025-01-11',
          termDate: null,
          comments: 'Test comment',
        }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('HOLDS');
        expect(result[0].code).toBe('DRDEF');
        expect(result[0].description).toBe('Donor deferral due to deferral reason');
        expect(result[0].entryDate).toBe('2025-01-11');
        expect(result[0].terminationDate).toBe('');
        expect(result[0].comment).toBe('Test comment');
        done();
      });
    });

    it('should default activeOnly to false when not provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('activeOnly=false');
        done();
      });
    });

    it('should pass activeOnly=true when specified', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001', true).subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('activeOnly=true');
        done();
      });
    });

    it('should default nullable date fields to empty strings', (done) => {
      const mockResponse = {
        success: true,
        data: [{
          interType: 'HOLDS',
          interCode: 'DRDEF',
          reason: 'reason',
          transactionId: 'TR001',
          unitId: '',
          insertDate: null,
          termDate: null,
          comments: '',
        }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe((result) => {
        expect(result[0].entryDate).toBe('');
        expect(result[0].terminationDate).toBe('');
        done();
      });
    });

    it('should propagate error on failure', (done) => {
      const error = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getDonationInterdictions('TR001').subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
    });
  });

  describe('buildUrlWithParams', () => {
    it('should build URL without params when none provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov(undefined, undefined).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/drives-lov$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should build URL with single param', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov('2025-01-01', undefined).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/drives-lov\?fromDate=2025-01-01$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should build URL with multiple params', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov('2025-01-01', '2025-01-31', 'DRV001').subscribe(() => {
        const call = apiServiceSpy.get.calls.mostRecent();
        const url = call.args[0];
        expect(url).toContain('fromDate=2025-01-01');
        expect(url).toContain('toDate=2025-01-31');
        expect(url).toContain('driveId=DRV001');
        done();
      });
    });

    it('should encode URL params correctly', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov('2025-01-01', undefined).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/fromDate=2025-01-01/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should skip empty-string params', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov('', '2025-01-31').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).not.toContain('fromDate');
        expect(url).toContain('toDate=2025-01-31');
        done();
      });
    });
  });

  describe('searchDeferralHolds - sort column mappings', () => {
    const emptyResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };

    it('should map transactionId to TransactionId', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'transactionId', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('TransactionId');
        done();
      });
    });

    it('should map driveId to DriveId', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'driveId', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('DriveId');
        done();
      });
    });

    it('should map donorId to DonorId', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'donorId', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('DonorId');
        done();
      });
    });

    it('should map collDate to CollDate', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'collDate', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('CollDate');
        done();
      });
    });

    it('should map donationType to DonationType', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'donationType', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('DonationType');
        done();
      });
    });

    it('should map procedureCode to ProcedureCode', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'procedureCode', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('ProcedureCode');
        done();
      });
    });

    it('should map dateTimeOfRegistration to InsertDate', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'dateTimeOfRegistration', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('InsertDate');
        done();
      });
    });

    it('should map auditComplete to NAuditFlag', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'auditComplete', sortDirection: 'ASC' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sortColumn).toBe('NAuditFlag');
        done();
      });
    });

    it('should map sort direction D to D', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'deferralId', sortDirection: 'D' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sort).toBe('D');
        done();
      });
    });

    it('should map any non-DESC/D sort direction to A', (done) => {
      apiServiceSpy.post.and.returnValue(of(emptyResponse));
      service.searchDeferralHolds(25, 0, { sortBy: 'deferralId', sortDirection: 'asc' }).subscribe(() => {
        expect(apiServiceSpy.post.calls.mostRecent().args[1].sort).toBe('A');
        done();
      });
    });
  });

  describe('searchDeferralHolds - batchId/setId mapping', () => {
    it('should map batchId query field to setId API param', (done) => {
      const emptyResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(emptyResponse));

      service.searchDeferralHolds(25, 0, { batchId: 'SET001' }).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.setId).toBe('SET001');
        expect(postedBody.batchId).toBeUndefined();
        done();
      });
    });

    it('should omit setId when batchId is empty string', (done) => {
      const emptyResponse = { success: true, message: '', statusCode: 200, data: [], total: 0, error: '', errorResponse: { errorCode: '', error: '' } };
      apiServiceSpy.post.and.returnValue(of(emptyResponse));

      service.searchDeferralHolds(25, 0, { batchId: '' }).subscribe(() => {
        const postedBody = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(postedBody.setId).toBeUndefined();
        done();
      });
    });
  });

  describe('getDrivesLov - null data handling', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getUsersLov - null data and edge cases', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle userName with only driveId provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov(undefined, undefined, 'DRV001').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('driveId=DRV001');
        expect(url).not.toContain('fromDate');
        expect(url).not.toContain('toDate');
        done();
      });
    });

    it('should handle userName with undefined value', (done) => {
      const mockResponse = {
        success: true,
        data: [{ userId: 'USER01', userName: undefined as any }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe((result) => {
        expect(result[0].code).toBe('USER01');
        expect(result[0].description).toBe('USER01');
        done();
      });
    });
  });

  describe('getTransactionsLov - null data handling', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should use transactionId as description when collDate is null', (done) => {
      const mockResponse = { success: true, data: [{ transactionId: 'TR001', collDate: null as any }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe((result) => {
        expect(result[0].description).toBe('TR001');
        done();
      });
    });
  });

  describe('getDeferralsLov - null data and edge cases', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle only driveId param provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov(undefined, undefined, 'DRV001').subscribe(() => {
        const url = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(url).toContain('driveId=DRV001');
        expect(url).not.toContain('fromDate');
        expect(url).not.toContain('toDate');
        done();
      });
    });

    it('should map multiple deferral items', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { deferralId: 'DEF001' },
          { deferralId: 'DEF002' },
          { deferralId: 'DEF003' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov().subscribe((result) => {
        expect(result.length).toBe(3);
        expect(result[0].code).toBe('DEF001');
        expect(result[0].description).toBe('DEF001');
        expect(result[2].code).toBe('DEF003');
        done();
      });
    });
  });

  describe('getInterdictionCodesLov - null data and edge cases', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesLov().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should map multiple interdiction codes', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { interCode: 'DRDEF', interDesc: 'Deferral Hold' },
          { interCode: 'HOLD', interDesc: 'General Hold' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesLov().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('DRDEF');
        expect(result[0].description).toBe('Deferral Hold');
        expect(result[1].code).toBe('HOLD');
        expect(result[1].description).toBe('General Hold');
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getInterdictionCodesLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('getDonorInterdictions - null data handling', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should map multiple donor interdictions', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { interType: 'HOLDS', interCode: 'T1', interDescription: 'Hold 1', originatedFrom: 'Auto', effDate: '2025-01-01', termDate: null, insertDate: '2025-01-01', donorId: 'D1', donorName: 'Test' },
          { interType: 'DEFER', interCode: 'T2', interDescription: 'Defer 1', originatedFrom: 'Manual', effDate: '2025-02-01', termDate: '2025-06-01', insertDate: '2025-02-01', donorId: 'D2', donorName: 'Test2' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('T1');
        expect(result[0].terminationDate).toBe('');
        expect(result[1].code).toBe('T2');
        expect(result[1].terminationDate).toBe('2025-06-01');
        expect(result[1].originatedFrom).toBe('Manual');
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonorInterdictions('TR001').subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('getDonationInterdictions - null data handling', () => {
    it('should default data to empty array when response data is null', (done) => {
      const mockResponse = { success: true, data: null as any };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should map multiple donation interdictions', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { interType: 'HOLDS', interCode: 'DRDEF', reason: 'Reason 1', transactionId: 'TR001', unitId: 'U1', insertDate: '2025-01-11', termDate: null, comments: 'Comment 1' },
          { interType: 'DEFER', interCode: 'HOLD2', reason: 'Reason 2', transactionId: 'TR001', unitId: 'U2', insertDate: '2025-01-12', termDate: '2025-06-01', comments: '' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('DRDEF');
        expect(result[0].description).toBe('Reason 1');
        expect(result[0].comment).toBe('Comment 1');
        expect(result[0].terminationDate).toBe('');
        expect(result[1].code).toBe('HOLD2');
        expect(result[1].terminationDate).toBe('2025-06-01');
        expect(result[1].comment).toBe('');
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDonationInterdictions('TR001').subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('getSetsLov - additional edge cases', () => {
    it('should handle only fromDate param provided', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov('2025-01-01').subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/sets-lov\?fromDate=2025-01-01$/),
          jasmine.any(Object)
        );
        done();
      });
    });

    it('should map multiple set items', (done) => {
      const mockResponse = {
        success: true,
        data: [
          { setId: 'SET001', collDate: '2025-01-10' },
          { setId: 'SET002', collDate: '2025-01-11' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('SET001');
        expect(result[0].description).toBe('SET001');
        expect(result[1].code).toBe('SET002');
        done();
      });
    });

    it('should include X-Chapter-Id header from HeaderService', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSetsLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('searchDeferralHolds - header on all calls', () => {
    it('should include X-Chapter-Id header on getDrivesLov calls', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDrivesLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });

    it('should include X-Chapter-Id header on getUsersLov calls', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUsersLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });

    it('should include X-Chapter-Id header on getTransactionsLov calls', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTransactionsLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });

    it('should include X-Chapter-Id header on getDeferralsLov calls', (done) => {
      const mockResponse = { success: true, data: [] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getDeferralsLov().subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const options = callArgs[1];
        expect(options.headers.get('X-Chapter-Id')).toBe('TST');
        done();
      });
    });
  });

  describe('searchDeferralHolds - multiple records mapping', () => {
    it('should map multiple deferral hold records correctly', (done) => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [
          {
            deferralId: 'DEF001', transactionId: 'TR001', setId: 'SET1',
            driveId: 'DRV001', donorId: 'DON001', donorName: 'John Doe',
            collDate: '2025-01-10', donationType: 'AL', procedureCode: 'WB',
            insertUser: 'USR1', insertUserName: 'User One', insertDate: '2025-01-11', nAuditFlag: 'Y',
          },
          {
            deferralId: 'DEF002', transactionId: 'TR002', setId: null,
            driveId: 'DRV002', donorId: 'DON002', donorName: null,
            collDate: null, donationType: 'PH', procedureCode: 'PLT',
            insertUser: 'USR2', insertUserName: '', insertDate: null, nAuditFlag: 'N',
          },
        ],
        total: 2,
        error: '',
        errorResponse: { errorCode: '', error: '' },
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDeferralHolds(25, 0, {}).subscribe((result) => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);

        expect(result.data[0].batchId).toBe('SET1');
        expect(result.data[0].donorName).toBe('John Doe');
        expect(result.data[0].collDate).toBe('2025-01-10');

        expect(result.data[1].batchId).toBe('');
        expect(result.data[1].donorName).toBe('');
        expect(result.data[1].collDate).toBe('');
        expect(result.data[1].dateTimeOfRegistration).toBe('');
        done();
      });
    });
  });
});
