import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MonthlyCollectionGoalsService } from './monthly-collection-goals.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  GoalTypeLookup,
  CustodianLookup,
  SearchTabResponse,
  MonthDetailResponse,
  GoalDetail,
  SummaryTabResponse,
  MonthlySummaryRow
} from '../models/monthly-collection-goals.model';

describe('MonthlyCollectionGoalsService', () => {
  let service: MonthlyCollectionGoalsService;
  let httpMock: HttpTestingController;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockChapterId = 'TST';

  const mockGoalTypes: GoalTypeLookup[] = [
    { code: 'INGOL', description: 'Institutional Goal' },
    { code: 'TRGOL', description: 'Territory Goal' },
    { code: 'RECTR', description: 'Recruiter Goal' }
  ];

  const mockCustodians: CustodianLookup[] = [
    { custodianId: 'PEACH', custodianName: 'GIRL PEACHTREE' },
    { custodianId: 'SMITH', custodianName: 'JOHN SMITH' }
  ];

  const mockSearchResponse: SearchTabResponse = {
    goalType: 'RECTR',
    goalTypeDescription: 'Recruiter',
    year: '2026',
    custodianId: 'PEACH',
    custodianName: 'GIRL PEACHTREE',
    monthlySummaries: [
      { month: 'January', monthNumber: '01', goalCount: 40 },
      { month: 'February', monthNumber: '02', goalCount: 0 },
      { month: 'March', monthNumber: '03', goalCount: 0 },
      { month: 'April', monthNumber: '04', goalCount: 0 },
      { month: 'May', monthNumber: '05', goalCount: 0 },
      { month: 'June', monthNumber: '06', goalCount: 0 },
      { month: 'July', monthNumber: '07', goalCount: 0 },
      { month: 'August', monthNumber: '08', goalCount: 0 },
      { month: 'September', monthNumber: '09', goalCount: 0 },
      { month: 'October', monthNumber: '10', goalCount: 0 },
      { month: 'November', monthNumber: '11', goalCount: 0 },
      { month: 'December', monthNumber: '12', goalCount: 0 }
    ],
    grandTotal: 40
  };

  const mockMonthDetails: GoalDetail[] = [
    {
      goalId: 'G001',
      goalType: 'RECTR',
      goalCustodian: 'PEACH',
      goalMmyy: '012026',
      donationType: 'AL',
      donationTypeDescription: 'Allogeneic',
      procedureCode: 'PP',
      procedureCodeDescription: 'Plateletpheresis',
      bloodType: 'ALL',
      bloodTypeDescription: 'All ABO',
      goalCount: 20
    }
  ];

  const mockSummaryResponse: SummaryTabResponse = {
    rows: [
      {
        goalsFor: 'Allogenic',
        goalsForId: 'AL',
        january: 10, february: 5, march: 0, april: 0, may: 0, june: 0,
        july: 0, august: 0, september: 0, october: 0, november: 0, december: 0,
        total: 15
      }
    ],
    totals: {
      goalsFor: 'Total',
      january: 10, february: 5, march: 0, april: 0, may: 0, june: 0,
      july: 0, august: 0, september: 0, october: 0, november: 0, december: 0,
      total: 15
    },
    grandTotal: 15
  };

  const mockYearRange = [
    { minYear: 2020, maxYear: 2030 }
  ];

  beforeEach(() => {
    headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      providers: [
        MonthlyCollectionGoalsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(MonthlyCollectionGoalsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  describe('getYearRange', () => {
    it('should return year options from API', (done) => {
      service.getYearRange().subscribe({
        next: (years) => {
          expect(years.length).toBe(11);
          expect(years[0]).toBe(2020);
          expect(years[10]).toBe(2030);
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/lookups/year-range');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockYearRange });
    });

    it('should fallback to current year if API returns empty', (done) => {
      const currentYear = new Date().getFullYear();

      service.getYearRange().subscribe({
        next: (years) => {
          expect(years.length).toBe(1);
          expect(years[0]).toBe(currentYear);
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/lookups/year-range');
      req.flush({ success: true, data: [] });
    });
  });

  describe('getGoalTypes', () => {
    it('should return goal types from API', (done) => {
      service.getGoalTypes().subscribe({
        next: (types) => {
          expect(types.length).toBe(3);
          expect(types[0].code).toBeDefined();
          expect(types[0].description).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/lookups/goal-types');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockGoalTypes });
    });

    it('should include expected goal types', (done) => {
      service.getGoalTypes().subscribe({
        next: (types) => {
          const codes = types.map(t => t.code);
          expect(codes).toContain('INGOL');
          expect(codes).toContain('TRGOL');
          expect(codes).toContain('RECTR');
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/lookups/goal-types');
      req.flush({ success: true, data: mockGoalTypes });
    });
  });

  describe('getCustodians', () => {
    it('should return custodians for goal type from API with chapterId', (done) => {
      service.getCustodians('RECTR').subscribe({
        next: (custodians) => {
          expect(custodians.length).toBe(2);
          expect(custodians[0].custodianId).toBeDefined();
          expect(custodians[0].custodianName).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/lookups/custodians/RECTR?chapterId=${mockChapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCustodians });
    });

    it('should return empty array for unknown goal type', (done) => {
      service.getCustodians('UNKNOWN').subscribe({
        next: (custodians) => {
          expect(custodians).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/lookups/custodians/UNKNOWN?chapterId=${mockChapterId}`);
      req.flush({ success: true, data: [] });
    });
  });

  describe('searchGoals', () => {
    it('should return search response from API with chapterId in body', (done) => {
      const request = {
        goalType: 'RECTR',
        custodianId: 'PEACH',
        year: 2026
      };

      service.searchGoals(request).subscribe({
        next: (response) => {
          expect(response.custodianName).toBeDefined();
          expect(response.goalTypeDescription).toBeDefined();
          expect(response.year).toBeDefined();
          expect(response.monthlySummaries).toBeDefined();
          expect(response.monthlySummaries.length).toBe(12);
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/summary');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe(mockChapterId);
      req.flush({ success: true, data: [mockSearchResponse] });
    });

    it('should return 12 months in summary', (done) => {
      const request = {
        goalType: 'RECTR',
        custodianId: 'PEACH',
        year: 2026
      };

      service.searchGoals(request).subscribe({
        next: (response) => {
          expect(response.monthlySummaries.length).toBe(12);
          expect(response.monthlySummaries[0].month).toBe('January');
          expect(response.monthlySummaries[11].month).toBe('December');
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/summary');
      req.flush({ success: true, data: [mockSearchResponse] });
    });
  });

  describe('getMonthDetails', () => {
    it('should return month detail response from API with chapterId in body', (done) => {
      const request = {
        goalType: 'RECTR',
        custodianId: 'PEACH',
        year: '2026',
        month: 1
      };

      service.getMonthDetails(request).subscribe({
        next: (response) => {
          expect(response.details).toBeDefined();
          expect(response.details.length).toBe(1);
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/details/1/100/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe(mockChapterId);
      req.flush({ success: true, data: mockMonthDetails });
    });

    it('should return details with correct structure', (done) => {
      const request = {
        goalType: 'RECTR',
        custodianId: 'PEACH',
        year: '2026',
        month: 1
      };

      service.getMonthDetails(request).subscribe({
        next: (response) => {
          if (response.details.length > 0) {
            const detail = response.details[0];
            expect(detail.donationType).toBeDefined();
            expect(detail.donationTypeDescription).toBeDefined();
            expect(detail.procedureCode).toBeDefined();
            expect(detail.procedureCodeDescription).toBeDefined();
            expect(detail.bloodType).toBeDefined();
            expect(detail.bloodTypeDescription).toBeDefined();
            expect(detail.goalCount).toBeDefined();
          }
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/monthly-collection-goals/details/1/100/0');
      req.flush({ success: true, data: mockMonthDetails });
    });
  });

  describe('Summary Tab Methods', () => {
    const request = { year: 2026 };

    it('should return donation type summary from API with chapterId', (done) => {
      service.getByDonationType(request).subscribe({
        next: (response) => {
          expect(response.rows).toBeDefined();
          expect(response.totals).toBeDefined();
          expect(response.grandTotal).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/by-donation-type/2026?chapterId=${mockChapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummaryResponse.rows });
    });

    it('should return procedure type summary from API with chapterId', (done) => {
      service.getByProcedureType(request).subscribe({
        next: (response) => {
          expect(response.rows).toBeDefined();
          expect(response.rows.length).toBeGreaterThan(0);
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/by-procedure-type/2026?chapterId=${mockChapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummaryResponse.rows });
    });

    it('should return territories summary from API with chapterId', (done) => {
      service.getTerritories(request).subscribe({
        next: (response) => {
          expect(response.rows).toBeDefined();
          expect(response.rows.length).toBeGreaterThan(0);
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/territories/2026?chapterId=${mockChapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummaryResponse.rows });
    });

    it('should return fixed sites summary from API with chapterId', (done) => {
      service.getFixedSites(request).subscribe({
        next: (response) => {
          expect(response.rows).toBeDefined();
          expect(response.rows.length).toBeGreaterThan(0);
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/fixed-sites/2026?chapterId=${mockChapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummaryResponse.rows });
    });

    it('should have correct row structure', (done) => {
      service.getByDonationType(request).subscribe({
        next: (response) => {
          if (response.rows.length > 0) {
            const row = response.rows[0];
            expect(row.goalsFor).toBeDefined();
            expect(row.january).toBeDefined();
            expect(row.december).toBeDefined();
            expect(row.total).toBeDefined();
          }
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/monthly-collection-goals/by-donation-type/2026?chapterId=${mockChapterId}`);
      req.flush({ success: true, data: mockSummaryResponse.rows });
    });
  });
});
