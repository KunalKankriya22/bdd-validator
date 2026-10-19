import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MaintainGroupInterdictionsService } from './maintain-group-interdictions.service';
import {
  GroupInterdictionParams,
  PlaceInterdictionRequest,
  RemoveInterdictionRequest,
  DonorGroupInterdictionParams,
  PlaceDonorInterdictionRequest,
  RemoveDonorInterdictionRequest,
  DonorGroupInterdictionCommentQuery,
  AddDonorGroupInterdictionCommentRequest
} from '../models/maintain-group-interdictions.model';

describe('MaintainGroupInterdictionsService', () => {
  let service: MaintainGroupInterdictionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MaintainGroupInterdictionsService
      ]
    });
    service = TestBed.inject(MaintainGroupInterdictionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getGroupModes', () => {
    it('should return group modes', () => {
      const mockModes = [
        { code: 'DRIVE', description: 'Drive ID' },
        { code: 'COLL', description: 'Collection Date' },
        { code: 'BATCH', description: 'Batch ID' }
      ];

      service.getGroupModes().subscribe(modes => {
        expect(modes.length).toBe(3);
        expect(modes[0].code).toBe('DRIVE');
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/group-modes'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockModes });
    });

    it('should return empty array when response data is null', () => {
      service.getGroupModes().subscribe(modes => {
        expect(modes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/group-modes'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined', () => {
      service.getGroupModes().subscribe(modes => {
        expect(modes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/group-modes'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getGroupModes().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/group-modes'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getValuesByMode', () => {
    it('should return drive IDs for DRIVE mode', () => {
      const mockData = [
        { code: 'DRV001', description: 'DRV001' }
      ];

      service.getValuesByMode('DRIVE').subscribe(values => {
        expect(values.length).toBe(1);
        expect(values[0].code).toBe('DRV001');
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/drive-ids'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return collection dates for COLL mode', () => {
      service.getValuesByMode('COLL').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/collection-dates'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should return batch IDs for BATCH mode', () => {
      service.getValuesByMode('BATCH').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/batch-ids'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should throw error for unknown mode', () => {
      service.getValuesByMode('UNKNOWN').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Unknown group mode: UNKNOWN');
        }
      });
    });

    it('should return empty array when response data is null for DRIVE mode', () => {
      service.getValuesByMode('DRIVE').subscribe(values => {
        expect(values).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/drive-ids'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined for COLL mode', () => {
      service.getValuesByMode('COLL').subscribe(values => {
        expect(values).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/collection-dates'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure for BATCH mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getValuesByMode('BATCH').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(503);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/batch-ids'));
      req.flush('Service unavailable', { status: 503, statusText: 'Service Unavailable' });

      consoleSpy.mockRestore();
    });
  });

  describe('retrieveDonations', () => {
    it('should retrieve donation units', () => {
      const params: GroupInterdictionParams = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001'
      };

      const mockResponse = {
        donations: [
          { unitId: 'W123-U', displayUnitId: 'W123-U-C', driveId: 'DRV001', collDate: '2025-01-10', setId: 'BAT001', transactionId: 'T1' }
        ],
        totalDonors: 1
      };

      service.retrieveDonations(params).subscribe(response => {
        expect(response.donations.length).toBe(1);
        expect(response.donations[0].unitId).toBe('W123-U');
        expect(response.totalDonors).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/donations'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush({ success: true, item: mockResponse });
    });

    it('should return default response when item is null', () => {
      const params: GroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonations(params).subscribe(response => {
        expect(response).toEqual({ donations: [], totalDonors: 0 });
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/donations'));
      req.flush({ success: true, item: null });
    });

    it('should return default response when item is undefined', () => {
      const params: GroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonations(params).subscribe(response => {
        expect(response).toEqual({ donations: [], totalDonors: 0 });
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/donations'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const params: GroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonations(params).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/donations'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getExistingInterCodes', () => {
    it('should return existing interdiction codes', () => {
      const params: GroupInterdictionParams = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001'
      };

      const mockCodes = [
        { code: 'HBCNT', description: 'HBC Testing not done on Lab' }
      ];

      service.getExistingInterCodes(params).subscribe(codes => {
        expect(codes.length).toBe(1);
        expect(codes[0].code).toBe('HBCNT');
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/inter-codes'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: mockCodes });
    });

    it('should return empty array when response data is null', () => {
      const params: GroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.getExistingInterCodes(params).subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/inter-codes'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const params: GroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.getExistingInterCodes(params).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/inter-codes'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      consoleSpy.mockRestore();
    });
  });

  describe('placeInterdictions', () => {
    it('should place interdictions successfully', () => {
      const request: PlaceInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD', 'DDI'],
        commit: true
      };

      const mockResponse = {
        results: [{ unitId: 'W123', interCode: 'PHYTD', status: 'OK', success: true }],
        successCount: 1,
        failureCount: 0,
        totalUnits: 1,
        totalInterCodes: 2,
        committed: true
      };

      service.placeInterdictions(request).subscribe(result => {
        expect(result.successCount).toBe(1);
        expect(result.failureCount).toBe(0);
        expect(result.committed).toBe(true);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/place'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.interCodes).toEqual(['PHYTD', 'DDI']);
      req.flush({ success: true, item: mockResponse });
    });

    it('should return default response when item is null', () => {
      const request: PlaceInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        commit: false
      };

      service.placeInterdictions(request).subscribe(result => {
        expect(result).toEqual({
          results: [], successCount: 0, failureCount: 0,
          totalUnits: 0, totalInterCodes: 0, committed: false
        });
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/place'));
      req.flush({ success: true, item: null });
    });

    it('should return default response when item is undefined', () => {
      const request: PlaceInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        commit: false
      };

      service.placeInterdictions(request).subscribe(result => {
        expect(result.results).toEqual([]);
        expect(result.committed).toBe(false);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/place'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request: PlaceInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], commit: true
      };

      service.placeInterdictions(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/place'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('removeInterdictions', () => {
    it('should remove interdictions', () => {
      const request: RemoveInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        termReason: 'ERR',
        commit: true
      };

      const mockResponse = {
        results: [{ unitId: 'W123', interCode: 'PHYTD', status: 'OK', success: true }],
        successCount: 1,
        failureCount: 0,
        totalUnits: 1,
        totalInterCodes: 1,
        committed: true
      };

      service.removeInterdictions(request).subscribe(result => {
        expect(result.successCount).toBe(1);
        expect(result.committed).toBe(true);
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/remove'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.termReason).toBe('ERR');
      req.flush({ success: true, item: mockResponse });
    });

    it('should return default response when item is null', () => {
      const request: RemoveInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], termReason: 'ERR', commit: true
      };

      service.removeInterdictions(request).subscribe(result => {
        expect(result).toEqual({
          results: [], successCount: 0, failureCount: 0,
          totalUnits: 0, totalInterCodes: 0, committed: false
        });
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/remove'));
      req.flush({ success: true, item: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request: RemoveInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], termReason: 'ERR', commit: true
      };

      service.removeInterdictions(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/remove'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getInterTypes', () => {
    it('should return interdiction types', () => {
      const mockTypes = [
        { code: 'INTER', description: 'Test Result and Registration' }
      ];

      service.getInterTypes().subscribe(types => {
        expect(types.length).toBe(1);
        expect(types[0].code).toBe('INTER');
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/inter-types'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTypes });
    });

    it('should return empty array when response data is null', () => {
      service.getInterTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/inter-types'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getInterTypes().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/lookups/inter-types'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getTermReasons', () => {
    it('should return termination reasons', () => {
      const mockReasons = [
        { code: 'ERR', description: 'Error in placement' }
      ];

      service.getTermReasons().subscribe(reasons => {
        expect(reasons.length).toBe(1);
        expect(reasons[0].code).toBe('ERR');
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/lookups/term-reasons'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReasons });
    });

    it('should return empty array when response data is null', () => {
      service.getTermReasons().subscribe(reasons => {
        expect(reasons).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/lookups/term-reasons'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getTermReasons().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/remove-group-interdictions/lookups/term-reasons'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getValidInterdictions', () => {
    it('should return valid interdictions with selected=false', () => {
      const mockInterdictions = [
        { interCode: 'PHYTD', interDesc: 'Physical Findings', effDate: '2025-01-01', termDate: '', viewLevel: 1 }
      ];

      service.getValidInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions.length).toBe(1);
        expect(interdictions[0].selected).toBe(false);
        expect(interdictions[0].interCode).toBe('PHYTD');
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/valid-interdictions'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ interType: 'INTER' });
      req.flush({ success: true, data: mockInterdictions });
    });

    it('should add selected=false to each item in the response', () => {
      const mockInterdictions = [
        { interCode: 'PHYTD', interDesc: 'Physical Findings', effDate: '2025-01-01', termDate: '', viewLevel: 1 },
        { interCode: 'DDI', interDesc: 'Drug Interaction', effDate: '2025-02-01', termDate: '2025-12-31', viewLevel: 2 }
      ];

      service.getValidInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions.length).toBe(2);
        interdictions.forEach(item => {
          expect(item.selected).toBe(false);
        });
        expect(interdictions[1].interCode).toBe('DDI');
        expect(interdictions[1].termDate).toBe('2025-12-31');
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/valid-interdictions'));
      req.flush({ success: true, data: mockInterdictions });
    });

    it('should return empty array when response data is null', () => {
      service.getValidInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/valid-interdictions'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getValidInterdictions('INTER').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/group-interdictions/valid-interdictions'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  // ====== Donor Group Interdiction Methods (Donors Tab) ======

  describe('getDonorGroupModes', () => {
    it('should return donor group modes', () => {
      const mockModes = [
        { code: 'DRIVE', description: 'Drive ID' },
        { code: 'COLL', description: 'Collection Date' }
      ];

      service.getDonorGroupModes().subscribe(modes => {
        expect(modes.length).toBe(2);
        expect(modes[0].code).toBe('DRIVE');
        expect(modes[1].description).toBe('Collection Date');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-modes'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockModes });
    });

    it('should return empty array when response data is null', () => {
      service.getDonorGroupModes().subscribe(modes => {
        expect(modes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-modes'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined', () => {
      service.getDonorGroupModes().subscribe(modes => {
        expect(modes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-modes'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getDonorGroupModes().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-modes'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getDonorGroupValues', () => {
    it('should return donor group values for a given mode', () => {
      const mockValues = [
        { code: 'VAL001', description: 'Value 1' },
        { code: 'VAL002', description: 'Value 2' }
      ];

      service.getDonorGroupValues('DRIVE').subscribe(values => {
        expect(values.length).toBe(2);
        expect(values[0].code).toBe('VAL001');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-values/DRIVE'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockValues });
    });

    it('should encode special characters in the mode parameter', () => {
      service.getDonorGroupValues('MODE/SPECIAL').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-values/MODE%2FSPECIAL'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('should return empty array when response data is null', () => {
      service.getDonorGroupValues('DRIVE').subscribe(values => {
        expect(values).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-values/DRIVE'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getDonorGroupValues('DRIVE').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/group-values/DRIVE'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('retrieveDonors', () => {
    it('should retrieve donors successfully', () => {
      const params: DonorGroupInterdictionParams = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001'
      };

      const mockDonors = [
        { donorId: 'D001', donorName: 'John Doe' },
        { donorId: 'D002', donorName: 'Jane Smith' }
      ];

      service.retrieveDonors(params).subscribe(response => {
        expect(response.donors.length).toBe(2);
        expect(response.donors[0].donorId).toBe('D001');
        expect(response.donors[1].donorName).toBe('Jane Smith');
        expect(response.totalDonors).toBe(5);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/donors'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush({ success: true, data: mockDonors, total: 5 });
    });

    it('should return empty donors array when response data is null', () => {
      const params: DonorGroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonors(params).subscribe(response => {
        expect(response.donors).toEqual([]);
        expect(response.totalDonors).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/donors'));
      req.flush({ success: true, data: null, total: null });
    });

    it('should return 0 totalDonors when response total is undefined', () => {
      const params: DonorGroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonors(params).subscribe(response => {
        expect(response.donors).toEqual([]);
        expect(response.totalDonors).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/donors'));
      req.flush({ success: true });
    });

    it('should include deferralChoice in request when provided', () => {
      const params: DonorGroupInterdictionParams = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        deferralChoice: 'D'
      };

      service.retrieveDonors(params).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/donors'));
      expect(req.request.body.deferralChoice).toBe('D');
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const params: DonorGroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.retrieveDonors(params).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/donors'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getExistingDonorInterCodes', () => {
    it('should return existing donor interdiction codes', () => {
      const params: DonorGroupInterdictionParams = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001'
      };

      const mockCodes = [
        { code: 'HBCNT', description: 'HBC Testing not done' },
        { code: 'DDI', description: 'Drug Interaction' }
      ];

      service.getExistingDonorInterCodes(params).subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('HBCNT');
        expect(codes[1].code).toBe('DDI');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/inter-codes'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush({ success: true, data: mockCodes });
    });

    it('should return empty array when response data is null', () => {
      const params: DonorGroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.getExistingDonorInterCodes(params).subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/inter-codes'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const params: DonorGroupInterdictionParams = { groupMode: 'DRIVE', groupValue: 'DRV001' };

      service.getExistingDonorInterCodes(params).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/inter-codes'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('placeDonorInterdictions', () => {
    it('should place donor interdictions successfully', () => {
      const request: PlaceDonorInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD', 'DDI'],
        comments: 'Test comment',
        effectiveDate: '2025-01-15'
      };

      const mockResponse = {
        results: [
          { donorId: 'D001', interCode: 'PHYTD', status: 'OK', success: true },
          { donorId: 'D001', interCode: 'DDI', status: 'OK', success: true }
        ],
        successCount: 2,
        failureCount: 0,
        totalDonors: 1,
        totalInterCodes: 2
      };

      service.placeDonorInterdictions(request).subscribe(result => {
        expect(result.successCount).toBe(2);
        expect(result.failureCount).toBe(0);
        expect(result.totalDonors).toBe(1);
        expect(result.results.length).toBe(2);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/place'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, item: mockResponse });
    });

    it('should return default response when item is null', () => {
      const request: PlaceDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD']
      };

      service.placeDonorInterdictions(request).subscribe(result => {
        expect(result).toEqual({
          results: [], successCount: 0, failureCount: 0,
          totalDonors: 0, totalInterCodes: 0
        });
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/place'));
      req.flush({ success: true, item: null });
    });

    it('should return default response when item is undefined', () => {
      const request: PlaceDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD']
      };

      service.placeDonorInterdictions(request).subscribe(result => {
        expect(result.results).toEqual([]);
        expect(result.successCount).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/place'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request: PlaceDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD']
      };

      service.placeDonorInterdictions(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/place'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('removeDonorInterdictions', () => {
    it('should remove donor interdictions successfully', () => {
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        termReason: 'ERR',
        deferralChoice: 'D'
      };

      const mockResponse = {
        results: [{ donorId: 'D001', interCode: 'PHYTD', status: 'OK', success: true }],
        successCount: 1,
        failureCount: 0,
        totalDonors: 1,
        totalInterCodes: 1
      };

      service.removeDonorInterdictions(request).subscribe(result => {
        expect(result.successCount).toBe(1);
        expect(result.failureCount).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.deferralChoice).toBe('D');
      req.flush({ success: true, item: mockResponse });
    });

    it('should default deferralChoice to B when not provided', () => {
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        termReason: 'ERR'
      };

      service.removeDonorInterdictions(request).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      expect(req.request.body.deferralChoice).toBe('B');
      req.flush({ success: true, item: { results: [], successCount: 0, failureCount: 0, totalDonors: 0, totalInterCodes: 0 } });
    });

    it('should preserve deferralChoice when explicitly set', () => {
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCodes: ['PHYTD'],
        termReason: 'ERR',
        deferralChoice: 'N'
      };

      service.removeDonorInterdictions(request).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      expect(req.request.body.deferralChoice).toBe('N');
      req.flush({ success: true, item: { results: [], successCount: 0, failureCount: 0, totalDonors: 0, totalInterCodes: 0 } });
    });

    it('should return default response when item is null', () => {
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], termReason: 'ERR'
      };

      service.removeDonorInterdictions(request).subscribe(result => {
        expect(result).toEqual({
          results: [], successCount: 0, failureCount: 0,
          totalDonors: 0, totalInterCodes: 0
        });
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      req.flush({ success: true, item: null });
    });

    it('should return default response when item is undefined', () => {
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], termReason: 'ERR'
      };

      service.removeDonorInterdictions(request).subscribe(result => {
        expect(result.results).toEqual([]);
        expect(result.successCount).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request: RemoveDonorInterdictionRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCodes: ['PHYTD'], termReason: 'ERR'
      };

      service.removeDonorInterdictions(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/remove'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getDonorTermReasons', () => {
    it('should return donor termination reasons', () => {
      const mockReasons = [
        { code: 'ERR', description: 'Error in placement' },
        { code: 'TEXP', description: 'Term expired' }
      ];

      service.getDonorTermReasons().subscribe(reasons => {
        expect(reasons.length).toBe(2);
        expect(reasons[0].code).toBe('ERR');
        expect(reasons[1].code).toBe('TEXP');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/term-reasons'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockReasons });
    });

    it('should return empty array when response data is null', () => {
      service.getDonorTermReasons().subscribe(reasons => {
        expect(reasons).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/term-reasons'));
      req.flush({ success: true, data: null });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getDonorTermReasons().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/term-reasons'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getDonorInterdictionComments', () => {
    it('should return donor interdiction comments', () => {
      const query: DonorGroupInterdictionCommentQuery = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCode: 'PHYTD'
      };

      const mockComments = [
        {
          donorId: 'D001', interCode: 'PHYTD', interType: 'INTER',
          comments: 'Test comment', centralNote: null,
          insertDate: '2025-01-15', insertUser: 'USER1',
          effDate: '2025-01-01', termDate: null,
          groupMode: 'DRIVE', groupValue: 'DRV001'
        }
      ];

      service.getDonorInterdictionComments(query).subscribe(comments => {
        expect(comments.length).toBe(1);
        expect(comments[0].donorId).toBe('D001');
        expect(comments[0].comments).toBe('Test comment');
        expect(comments[0].centralNote).toBeNull();
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush({ success: true, data: mockComments });
    });

    it('should return empty array when response data is null', () => {
      const query: DonorGroupInterdictionCommentQuery = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCode: 'PHYTD'
      };

      service.getDonorInterdictionComments(query).subscribe(comments => {
        expect(comments).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined', () => {
      const query: DonorGroupInterdictionCommentQuery = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCode: 'PHYTD'
      };

      service.getDonorInterdictionComments(query).subscribe(comments => {
        expect(comments).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const query: DonorGroupInterdictionCommentQuery = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCode: 'PHYTD'
      };

      service.getDonorInterdictionComments(query).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('addDonorInterdictionComment', () => {
    it('should add a donor interdiction comment successfully', () => {
      const request: AddDonorGroupInterdictionCommentRequest = {
        groupMode: 'DRIVE',
        groupValue: 'DRV001',
        interCode: 'PHYTD',
        comment: 'New test comment',
        insertDate: '2025-01-20'
      };

      const mockResponse = { data: null, message: 'Comment added', success: true };

      service.addDonorInterdictionComment(request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Comment added');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments/add'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request: AddDonorGroupInterdictionCommentRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCode: 'PHYTD',
        comment: 'Test', insertDate: '2025-01-20'
      };

      service.addDonorInterdictionComment(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments/add'));
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });

      consoleSpy.mockRestore();
    });

    it('should pass through the response directly without mapping', () => {
      const request: AddDonorGroupInterdictionCommentRequest = {
        groupMode: 'DRIVE', groupValue: 'DRV001', interCode: 'PHYTD',
        comment: 'Another comment', insertDate: '2025-02-01'
      };

      const mockResponse = { data: null, message: 'Success', success: true, errors: [] };

      service.addDonorInterdictionComment(request).subscribe(response => {
        expect(response.data).toBeNull();
        expect(response.errors).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/comments/add'));
      req.flush(mockResponse);
    });
  });

  describe('getDonorInterTypes', () => {
    it('should return donor interdiction types', () => {
      const mockTypes = [
        { code: 'INTER', description: 'Test Result and Registration' },
        { code: 'DEFER', description: 'Deferral' }
      ];

      service.getDonorInterTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('INTER');
        expect(types[1].code).toBe('DEFER');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/inter-types'));
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTypes });
    });

    it('should return empty array when response data is null', () => {
      service.getDonorInterTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/inter-types'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined', () => {
      service.getDonorInterTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/inter-types'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getDonorInterTypes().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/lookups/inter-types'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });
  });

  describe('getValidDonorInterdictions', () => {
    it('should return valid donor interdictions with selected=false', () => {
      const mockInterdictions = [
        { interCode: 'PHYTD', interDesc: 'Physical Findings', effDate: '2025-01-01', termDate: '', viewLevel: 1 },
        { interCode: 'DDI', interDesc: 'Drug Interaction', effDate: '2025-02-01', termDate: '2025-12-31', viewLevel: 2 }
      ];

      service.getValidDonorInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions.length).toBe(2);
        expect(interdictions[0].selected).toBe(false);
        expect(interdictions[0].interCode).toBe('PHYTD');
        expect(interdictions[1].selected).toBe(false);
        expect(interdictions[1].interCode).toBe('DDI');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/valid-interdictions'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ interType: 'INTER' });
      req.flush({ success: true, data: mockInterdictions });
    });

    it('should return empty array when response data is null', () => {
      service.getValidDonorInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/valid-interdictions'));
      req.flush({ success: true, data: null });
    });

    it('should return empty array when response data is undefined', () => {
      service.getValidDonorInterdictions('INTER').subscribe(interdictions => {
        expect(interdictions).toEqual([]);
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/valid-interdictions'));
      req.flush({ success: true });
    });

    it('should propagate error on HTTP failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getValidDonorInterdictions('INTER').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/valid-interdictions'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      consoleSpy.mockRestore();
    });

    it('should map each item with selected property set to false', () => {
      const mockInterdictions = [
        { interCode: 'A', interDesc: 'A Desc', effDate: '2025-01-01', termDate: '', viewLevel: 1 },
        { interCode: 'B', interDesc: 'B Desc', effDate: '2025-02-01', termDate: '', viewLevel: 2 },
        { interCode: 'C', interDesc: 'C Desc', effDate: '2025-03-01', termDate: '2025-06-30', viewLevel: 3 }
      ];

      service.getValidDonorInterdictions('DEFER').subscribe(interdictions => {
        expect(interdictions.length).toBe(3);
        interdictions.forEach(item => {
          expect(item.selected).toBe(false);
        });
        expect(interdictions[2].interCode).toBe('C');
        expect(interdictions[2].termDate).toBe('2025-06-30');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-group-interdictions/valid-interdictions'));
      expect(req.request.body).toEqual({ interType: 'DEFER' });
      req.flush({ success: true, data: mockInterdictions });
    });
  });
});
