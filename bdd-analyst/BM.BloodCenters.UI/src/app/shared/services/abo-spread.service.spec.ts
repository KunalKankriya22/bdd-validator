import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { AboSpreadService, AboSpreadResponse, DonationTypeOption, SponsorDriveOption } from './abo-spread.service';
import { ApiService } from './api.service';

describe('AboSpreadService', () => {
  let service: AboSpreadService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockSpreadResponse: AboSpreadResponse = {
    rows: [
      {
        procedureCode: 'WB',
        procedureCodeDescription: 'Whole Blood',
        total: 100,
        oPos: 38, oNeg: 7, aPos: 33, aNeg: 6,
        bPos: 9, bNeg: 2, abPos: 3, abNeg: 1, unknown: 1,
      },
    ],
    totals: {
      total: 100, oPos: 38, oNeg: 7, aPos: 33, aNeg: 6,
      bPos: 9, bNeg: 2, abPos: 3, abNeg: 1, unknown: 1,
    },
    percentages: {
      total: 100, oPos: 38, oNeg: 7, aPos: 33, aNeg: 6,
      bPos: 9, bNeg: 2, abPos: 3, abNeg: 1, unknown: 1,
    },
    unknownAbo: 1,
  };

  const mockDonationTypes: DonationTypeOption[] = [
    { donationType: 'WB', description: 'Whole Blood' },
    { donationType: 'PLT', description: 'Platelet' },
  ];

  const mockSponsorDrives: SponsorDriveOption[] = [
    { driveId: 'DRV001', driveDate: '2025-05-01', label: '05-01-2025    DRV001' },
    { driveId: 'DRV002', driveDate: '2025-04-15', label: '04-15-2025    DRV002' },
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AboSpreadService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AboSpreadService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAboSpreadByDrive', () => {
    it('should return ABO spread data for a drive', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadByDrive('DRV001', 'AL').subscribe((result) => {
        expect(result).toEqual(mockSpreadResponse);
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].procedureCode).toBe('WB');
        done();
      });
    });

    it('should call API with correct endpoint and params', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadByDrive('DRV001', 'WB').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          '/api/v1/abo-spread/by-drive',
          jasmine.objectContaining({
            params: jasmine.any(HttpParams),
          })
        );
        done();
      });
    });

    it('should use default donation type AL when not specified', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadByDrive('DRV001').subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params = callArgs[1]!.params as HttpParams;
        expect(params.get('donationType')).toBe('AL');
        done();
      });
    });

    it('should return empty response when API returns null item', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: null }));

      service.getAboSpreadByDrive('DRV001').subscribe((result) => {
        expect(result.rows).toEqual([]);
        expect(result.totals.total).toBe(0);
        expect(result.unknownAbo).toBe(0);
        done();
      });
    });

  });

  describe('getDonationTypesByDrive', () => {
    it('should return donation types for a drive', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: mockDonationTypes }));

      service.getDonationTypesByDrive('DRV001').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].donationType).toBe('WB');
        expect(result[1].description).toBe('Platelet');
        done();
      });
    });


    it('should return empty array when API returns null data', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: null }));

      service.getDonationTypesByDrive('DRV001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getAboSpreadBySponsor', () => {
    it('should return ABO spread data for a sponsor', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadBySponsor('SPO001', 'AL').subscribe((result) => {
        expect(result).toEqual(mockSpreadResponse);
        done();
      });
    });

    it('should include driveIds when provided', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadBySponsor('SPO001', 'AL', ['D1', 'D2']).subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params = callArgs[1]!.params as HttpParams;
        expect(params.get('driveIds')).toBe('D1,D2');
        done();
      });
    });

    it('should not include driveIds param when empty array', (done) => {
      apiService.get.and.returnValue(of({ success: true, item: mockSpreadResponse }));

      service.getAboSpreadBySponsor('SPO001', 'AL', []).subscribe(() => {
        const callArgs = apiService.get.calls.mostRecent().args;
        const params = callArgs[1]!.params as HttpParams;
        expect(params.has('driveIds')).toBe(false);
        done();
      });
    });

  });

  describe('getDrivesBySponsor', () => {
    it('should return drives for a sponsor', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: mockSponsorDrives }));

      service.getDrivesBySponsor('SPO001', 'TX01').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].driveId).toBe('DRV001');
        expect(result[1].driveId).toBe('DRV002');
        done();
      });
    });

    it('should call API with correct endpoint and params', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: mockSponsorDrives }));

      service.getDrivesBySponsor('SPO001', 'TX01').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          '/api/v1/abo-spread/by-sponsor/drives',
          jasmine.objectContaining({
            params: jasmine.any(HttpParams),
          })
        );
        done();
      });
    });

    it('should return empty array when API returns null data', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: null }));

      service.getDrivesBySponsor('SPO001', 'TX01').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getDonationTypesBySponsor', () => {

    it('should call API with correct endpoint and chapterId param', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: mockDonationTypes }));

      service.getDonationTypesBySponsor('TX01').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          '/api/v1/abo-spread/by-sponsor/donation-types',
          jasmine.objectContaining({
            params: jasmine.any(HttpParams),
          })
        );
        done();
      });
    });

    it('should return empty array when API returns null data', (done) => {
      apiService.get.and.returnValue(of({ success: true, data: null }));

      service.getDonationTypesBySponsor('TX01').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

  });
});
