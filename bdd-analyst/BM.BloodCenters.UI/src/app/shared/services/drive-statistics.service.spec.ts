import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DriveStatisticsService } from './drive-statistics.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../core/constants/api.constants';
import {
  DriveStatisticsResponse,
  DriveStatisticsItem,
} from '@shared/models/drive-statistics.model';

describe('DriveStatisticsService', () => {
  let service: DriveStatisticsService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockItem: DriveStatisticsItem = {
    header: {
      driveId: 'DRV0172094',
      chapterId: 'OBK',
      totalDonations: 249,
      driveDate: '05-31-2024',
      driveType: 'F',
      typeDescription: 'Fixed',
      sponsorId: 'SPON046693',
      sponsorName: 'CREEK COMMUNITY',
      projectedShow: 0,
      projectedDraw: 0,
      projectedDeferralRate: 12,
      actualDraw: 61,
      actualDeferral: 188,
      deferralRate: 75.5,
    },
    donations: [
      { donationType: 'AL', procedureCode: 'WB', count: 61 },
      { donationType: 'AL', procedureCode: 'PP', count: 43 },
    ],
    venipuncture: [
      { venipunctureCode: '01', description: 'Diff. Stick', count: 57 },
      { venipunctureCode: '02', description: 'Dbl. Stick', count: 2 },
    ],
    deferrals: {
      allogenic: [
        { deferralCode: 'HDT', origin: 'INQR', description: null, numberOfDeferrals: 24 },
      ],
      autologousTherapeutic: [
        { deferralCode: 'HDI', origin: '3', description: null, numberOfDeferrals: 1 },
      ],
    },
    unitDetails: [
      {
        unitId: 'W123424053111',
        donationType: 'AL',
        procedureCode: 'WB',
        attrib01: 'Y',
        attrib02: null,
        attrib03: null,
        attrib04: null,
        attrib05: null,
        attrib06: null,
        attrib07: null,
        attrib08: null,
      },
    ],
    donorsList: [
      { donorId: 'DN30133334', lastName: 'Abbott', firstName: 'Kim', sex: 'M' },
      { donorId: 'DN30133335', lastName: 'Abernathy', firstName: 'Jimmy', sex: 'M' },
    ],
  };

  const mockResponse: DriveStatisticsResponse = {
    success: true,
    message: '',
    statusCode: 200,
    item: mockItem,
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DriveStatisticsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(DriveStatisticsService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getDriveStatistics', () => {
    it('should call ApiService.get with the correct endpoint', (done) => {
      apiService.get.and.returnValue(of(mockResponse));
      const expectedUrl = API.RECRUITMENT.DRIVE_STATISTICS.GET('DRV0172094', 'OBK');

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });

    it('should return the item from the response', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item).toEqual(mockItem);
        expect(item.header.driveId).toBe('DRV0172094');
        expect(item.header.totalDonations).toBe(249);
        done();
      });
    });

    it('should return header with all fields populated', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.header.driveDate).toBe('05-31-2024');
        expect(item.header.driveType).toBe('F');
        expect(item.header.typeDescription).toBe('Fixed');
        expect(item.header.sponsorId).toBe('SPON046693');
        expect(item.header.sponsorName).toBe('CREEK COMMUNITY');
        expect(item.header.projectedDeferralRate).toBe(12);
        expect(item.header.deferralRate).toBe(75.5);
        done();
      });
    });

    it('should return donations data', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.donations.length).toBe(2);
        expect(item.donations[0].donationType).toBe('AL');
        expect(item.donations[0].procedureCode).toBe('WB');
        expect(item.donations[0].count).toBe(61);
        done();
      });
    });

    it('should return venipuncture data', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.venipuncture.length).toBe(2);
        expect(item.venipuncture[0].venipunctureCode).toBe('01');
        expect(item.venipuncture[0].description).toBe('Diff. Stick');
        done();
      });
    });

    it('should return deferrals with allogenic and autologousTherapeutic', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.deferrals.allogenic.length).toBe(1);
        expect(item.deferrals.allogenic[0].deferralCode).toBe('HDT');
        expect(item.deferrals.allogenic[0].numberOfDeferrals).toBe(24);
        expect(item.deferrals.autologousTherapeutic.length).toBe(1);
        done();
      });
    });

    it('should return unit details with attrib fields', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.unitDetails.length).toBe(1);
        expect(item.unitDetails[0].unitId).toBe('W123424053111');
        expect(item.unitDetails[0].attrib01).toBe('Y');
        expect(item.unitDetails[0].attrib02).toBeNull();
        done();
      });
    });

    it('should return donors list data', (done) => {
      apiService.get.and.returnValue(of(mockResponse));

      service.getDriveStatistics('DRV0172094', 'OBK').subscribe((item) => {
        expect(item.donorsList.length).toBe(2);
        expect(item.donorsList[0].donorId).toBe('DN30133334');
        expect(item.donorsList[0].lastName).toBe('Abbott');
        done();
      });
    });

    it('should return empty item when response is null', (done) => {
      apiService.get.and.returnValue(of(null));

      service.getDriveStatistics('DRV001', 'WAD').subscribe((item) => {
        expect(item.header.driveId).toBe('DRV001');
        expect(item.header.chapterId).toBe('WAD');
        expect(item.header.totalDonations).toBe(0);
        expect(item.donations.length).toBe(0);
        expect(item.venipuncture.length).toBe(0);
        expect(item.deferrals.allogenic.length).toBe(0);
        expect(item.unitDetails.length).toBe(0);
        expect(item.donorsList.length).toBe(0);
        done();
      });
    });

    it('should return empty item when response.item is null', (done) => {
      const nullItemResponse = { success: true, message: '', statusCode: 200, item: null } as unknown as DriveStatisticsResponse;
      apiService.get.and.returnValue(of(nullItemResponse));

      service.getDriveStatistics('DRV002', 'OBK').subscribe((item) => {
        expect(item.header.driveId).toBe('DRV002');
        expect(item.header.chapterId).toBe('OBK');
        expect(item.header.totalDonations).toBe(0);
        expect(item.donations.length).toBe(0);
        done();
      });
    });

    it('should propagate errors from ApiService', (done) => {
      apiService.get.and.returnValue(throwError(() => new Error('API error')));

      service.getDriveStatistics('DRV001', 'OBK').subscribe({
        error: (error) => {
          expect(error.message).toBe('API error');
          done();
        },
      });
    });

    it('should encode driveId and chapterId in the URL', (done) => {
      apiService.get.and.returnValue(of(mockResponse));
      const expectedUrl = API.RECRUITMENT.DRIVE_STATISTICS.GET('DRV/001', 'OB K');

      service.getDriveStatistics('DRV/001', 'OB K').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(expectedUrl);
        done();
      });
    });
  });
});
