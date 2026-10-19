import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SiteCollectionStatisticsService } from './site-collection-statistics.service';
import { environment } from '../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  SiteStatisticsQueryParams,
  SiteStatisticsSummaryDto,
  DonationBreakdownQueryParams,
  UnitDetailsQueryParams,
  GoalsQueryParams,
} from '@shared/models/site-collection-statistics.model';

describe('SiteCollectionStatisticsService', () => {
  let service: SiteCollectionStatisticsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.BASE}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SiteCollectionStatisticsService]
    });

    service = TestBed.inject(SiteCollectionStatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getSiteStatistics', () => {
    it('should fetch site statistics with required parameters', () => {
      const params: SiteStatisticsQueryParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: [
          {
            siteId: 'SITE001',
            locationName: 'Downtown Blood Center',
            collectionDate: '2024-01-15T00:00:00Z',
            actualDraws: 45,
            actualDeferrals: 5
          }
        ],
        totalActualDraws: 45,
        totalActualDeferrals: 5,
        statusCode: 200
      };

      service.getSiteStatistics(params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].siteId).toBe('SITE001');
        expect(result.totalActualDraws).toBe(45);
        expect(result.totalActualDeferrals).toBe(5);
      });

      const req = httpMock.expectOne(request =>
        request.url === baseUrl &&
        request.params.get('startDate') === '2024-01-01' &&
        request.params.get('endDate') === '2024-01-31'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include siteId parameter when provided', () => {
      const params: SiteStatisticsQueryParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        siteId: 'SITE001'
      };

      const mockResponse = {
        success: true,
        data: [],
        totalActualDraws: 0,
        totalActualDeferrals: 0,
        statusCode: 200
      };

      service.getSiteStatistics(params).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === baseUrl &&
        request.params.get('siteId') === 'SITE001'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty data array', () => {
      const params: SiteStatisticsQueryParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockResponse = {
        success: true,
        data: null,
        totalActualDraws: null,
        totalActualDeferrals: null,
        statusCode: 200
      };

      service.getSiteStatistics(params).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalActualDraws).toBe(0);
        expect(result.totalActualDeferrals).toBe(0);
      });

      const req = httpMock.expectOne(request => request.url === baseUrl);
      req.flush(mockResponse);
    });
  });

  describe('getDonationBreakdown', () => {
    it('should fetch donation breakdown with required parameters', () => {
      const params: DonationBreakdownQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: [
          { donationType: 'WB', procedureCode: '450', count: 30 },
          { donationType: 'AP', procedureCode: 'PLT', count: 15 }
        ],
        statusCode: 200
      };

      service.getDonationBreakdown(params).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].donationType).toBe('WB');
        expect(result[0].count).toBe(30);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.DONATION_BREAKDOWN}` &&
        request.params.get('siteId') === 'SITE001' &&
        request.params.get('collectionDate') === '2024-01-15'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty breakdown data', () => {
      const params: DonationBreakdownQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        data: null,
        statusCode: 200
      };

      service.getDonationBreakdown(params).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.DONATION_BREAKDOWN}`
      );

      req.flush(mockResponse);
    });
  });

  describe('getUnitDetails', () => {
    it('should fetch unit details with required parameters', () => {
      const params: UnitDetailsQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: [
          {
            unitId: 'DIN1234567890123',
            displayUnitId: 'DIN123456789012345',
            collectionDate: '2024-01-15T00:00:00Z',
            donationType: 'WB',
            procedureCode: '450',
            attributes: {
              difficultStick: 'Y',
              doubleStick: null,
              od: null,
              qns: 'Y',
              nb: null,
              nuc: null,
              rbcsNotReturned: null,
              qnsLessThan175: null
            }
          }
        ],
        statusCode: 200
      };

      service.getUnitDetails(params).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].unitId).toBe('DIN1234567890123');
        expect(result[0].attributes.difficultStick).toBe('Y');
        expect(result[0].attributes.qns).toBe('Y');
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.UNIT_DETAILS}` &&
        request.params.get('siteId') === 'SITE001' &&
        request.params.get('collectionDate') === '2024-01-15'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include optional filters when provided', () => {
      const params: UnitDetailsQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
        donationType: 'WB',
        procedureCode: '450'
      };

      const mockResponse = {
        success: true,
        data: [],
        statusCode: 200
      };

      service.getUnitDetails(params).subscribe();

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.UNIT_DETAILS}` &&
        request.params.get('donationType') === 'WB' &&
        request.params.get('procedureCode') === '450'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle null data', () => {
      const params: UnitDetailsQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        data: null,
        statusCode: 200
      };

      service.getUnitDetails(params).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.UNIT_DETAILS}`
      );

      req.flush(mockResponse);
    });
  });

  describe('getGoals', () => {
    it('should fetch goal comparison data', () => {
      const params: GoalsQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: [
          {
            donationType: 'WB',
            donationTypeDescription: 'Whole Blood',
            procedureCode: '450',
            procedureCodeDescription: '450ml Collection',
            goalCount: 50
          }
        ],
        statusCode: 200
      };

      service.getGoals(params).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].donationType).toBe('WB');
        expect(result[0].goalCount).toBe(50);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.GOALS}` &&
        request.params.get('siteId') === 'SITE001' &&
        request.params.get('collectionDate') === '2024-01-15'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle null goals data', () => {
      const params: GoalsQueryParams = {
        siteId: 'SITE001',
        collectionDate: '2024-01-15'
      };

      const mockResponse = {
        success: true,
        data: null,
        statusCode: 200
      };

      service.getGoals(params).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.GOALS}`
      );

      req.flush(mockResponse);
    });
  });

  describe('getSites', () => {
    it('should fetch sites dropdown list', () => {
      const mockResponse = {
        success: true,
        message: 'Data retrieved successfully',
        data: [
          { siteId: 'SITE001', locationName: 'Downtown Blood Center' },
          { siteId: 'SITE002', locationName: 'Uptown Clinic' },
          { siteId: 'SITE003', locationName: 'Suburban Collection Point' }
        ],
        statusCode: 200
      };

      service.getSites().subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].siteId).toBe('SITE001');
        expect(result[1].locationName).toBe('Uptown Clinic');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.SITES}`
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty sites list', () => {
      const mockResponse = {
        success: true,
        data: null,
        statusCode: 200
      };

      service.getSites().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.DONOR_FUNCTIONS.SITE_COLLECTION_STATISTICS.SITES}`
      );

      req.flush(mockResponse);
    });
  });
});
