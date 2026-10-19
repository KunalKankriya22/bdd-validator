import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReagentKitNoPreQualificationService } from './reagent-kit-no-pre-qualification.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ReagentKitNoPreQualificationService', () => {
  let service: ReagentKitNoPreQualificationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ReagentKitNoPreQualificationService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });
    service = TestBed.inject(ReagentKitNoPreQualificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getValidTests', () => {
    it('should map response.data to TestIdOption array', (done) => {
      const mockResponse = {
        data: [
          { testId: 'T-001', testDescription: 'ABO Grouping' },
          { testId: 'T-002', testDescription: 'Rh Typing' },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidTests().subscribe((result) => {
        expect(result).toEqual([
          { testId: 'T-001', testDescription: 'ABO Grouping' },
          { testId: 'T-002', testDescription: 'Rh Typing' },
        ]);
        done();
      });
    });

    it('should fall back to testDesc when testDescription is missing', (done) => {
      const mockResponse = {
        data: [{ testId: 'T-003', testDesc: 'Antibody Screen' }],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getValidTests().subscribe((result) => {
        expect(result[0].testDescription).toBe('Antibody Screen');
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getValidTests().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should re-throw errors via catchError', (done) => {
      spyOn(console, 'error');
      const error = new Error('Fetch failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getValidTests().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('getTestKits', () => {
    it('should build URL with testId and showExpired query params', (done) => {
      const mockResponse = { data: [{ testKitId: 'TK-001' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestKits('T-001', 'Y').subscribe(() => {
        const calledUrl = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(calledUrl).toContain('testId=T-001');
        expect(calledUrl).toContain('showExpired=Y');
        done();
      });
    });

    it('should return response.data or empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: undefined }));

      service.getTestKits('T-001', 'N').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getReagents', () => {
    it('should normalize field names from reagentDescription/name/supplier/lotNo/expirationDate', (done) => {
      const mockResponse = {
        data: [
          {
            reagentType: 'Anti-A',
            reagentDescription: 'Reagent Desc Fallback',
            supplier: 'SUP-FALLBACK',
            lotNo: 'LOT-FALLBACK',
            expirationDate: '2025-12-31',
            reagentCode: 'RC-001',
          },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getReagents('TK-001', 'T-001').subscribe((result) => {
        expect(result[0].reagentName).toBe('Reagent Desc Fallback');
        expect(result[0].supplierCode).toBe('SUP-FALLBACK');
        expect(result[0].lotNumber).toBe('LOT-FALLBACK');
        expect(result[0].expiryDate).toBe('2025-12-31');
        done();
      });
    });

    it('should prefer primary field names over fallback names', (done) => {
      const mockResponse = {
        data: [
          {
            reagentType: 'Anti-B',
            reagentName: 'Primary Name',
            reagentDescription: 'Fallback Desc',
            supplierCode: 'SUP-PRIMARY',
            supplier: 'SUP-FALLBACK',
            lotNumber: 'LOT-PRIMARY',
            lotNo: 'LOT-FALLBACK',
            expiryDate: '2026-06-30',
            expirationDate: '2025-12-31',
            reagentCode: 'RC-002',
          },
        ],
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getReagents('TK-002', 'T-001').subscribe((result) => {
        expect(result[0].reagentName).toBe('Primary Name');
        expect(result[0].supplierCode).toBe('SUP-PRIMARY');
        expect(result[0].lotNumber).toBe('LOT-PRIMARY');
        expect(result[0].expiryDate).toBe('2026-06-30');
        done();
      });
    });

    it('should default missing fields to empty string or null', (done) => {
      const mockResponse = { data: [{}] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getReagents('TK-003', 'T-001').subscribe((result) => {
        expect(result[0].reagentType).toBe('');
        expect(result[0].reagentName).toBe('');
        expect(result[0].supplierCode).toBe('');
        expect(result[0].lotNumber).toBe('');
        expect(result[0].expiryDate).toBeNull();
        expect(result[0].reagentCode).toBe('');
        done();
      });
    });
  });

  describe('getReagentLov', () => {
    it('should build URL with testId and reagentType query params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [{ code: 'R-LOV' }] }));

      service.getReagentLov('T-001', 'Anti-A').subscribe(() => {
        const calledUrl = apiServiceSpy.get.calls.mostRecent().args[0];
        expect(calledUrl).toContain('testId=T-001');
        expect(calledUrl).toContain('reagentType=Anti-A');
        done();
      });
    });

    it('should return response.data or empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getReagentLov('T-001', 'Anti-B').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getTestGroup', () => {
    it('should return response.data when present', (done) => {
      const mockGroup = { isAgMag: true, groupCode: 'GRP-1' };
      apiServiceSpy.get.and.returnValue(of({ data: mockGroup }));

      service.getTestGroup('T-001').subscribe((result) => {
        expect(result).toEqual(mockGroup);
        done();
      });
    });

    it('should fall back to response.item when response.data is null', (done) => {
      const mockItem = { isAgMag: true, groupCode: 'GRP-2' };
      apiServiceSpy.get.and.returnValue(of({ data: null, item: mockItem }));

      service.getTestGroup('T-002').subscribe((result) => {
        expect(result).toEqual(mockItem);
        done();
      });
    });

    it('should return default { isAgMag: false } when both data and item are absent', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getTestGroup('T-003').subscribe((result) => {
        expect(result).toEqual({ isAgMag: false });
        done();
      });
    });
  });

  describe('createTestKit', () => {
    it('should POST request and return response.data', (done) => {
      const request = { testId: 'T-001', kitName: 'New Kit' } as any;
      const mockKit = { testKitId: 'TK-NEW', kitName: 'New Kit' };
      apiServiceSpy.post.and.returnValue(of({ data: mockKit }));

      service.createTestKit(request).subscribe((result) => {
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.REAGENT_KIT_NO_PRE_QUAL.CREATE_TEST_KIT,
          request,
        );
        expect(result).toEqual(mockKit);
        done();
      });
    });

    it('should fall back to response.item when response.data is null', (done) => {
      const request = { testId: 'T-001' } as any;
      const mockItem = { testKitId: 'TK-ITEM' };
      apiServiceSpy.post.and.returnValue(of({ data: null, item: mockItem }));

      service.createTestKit(request).subscribe((result) => {
        expect(result).toEqual(mockItem);
        done();
      });
    });

    it('should re-throw errors via catchError', (done) => {
      spyOn(console, 'error');
      const error = new Error('Create failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createTestKit({} as any).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('updateTestKit', () => {
    it('should PUT request to the correct endpoint with testKitId', (done) => {
      const testKitId = 'TK-001';
      const request = { kitName: 'Updated Kit' } as any;
      const mockKit = { testKitId: 'TK-001', kitName: 'Updated Kit' };
      apiServiceSpy.put.and.returnValue(of({ data: mockKit }));

      service.updateTestKit(testKitId, request).subscribe((result) => {
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.REAGENT_KIT_NO_PRE_QUAL.UPDATE_TEST_KIT(testKitId),
          request,
        );
        expect(result).toEqual(mockKit);
        done();
      });
    });

    it('should fall back to response.item when response.data is null', (done) => {
      const mockItem = { testKitId: 'TK-UPD' };
      apiServiceSpy.put.and.returnValue(of({ data: null, item: mockItem }));

      service.updateTestKit('TK-UPD', {} as any).subscribe((result) => {
        expect(result).toEqual(mockItem);
        done();
      });
    });
  });
});
