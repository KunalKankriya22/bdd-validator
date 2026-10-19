import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegistrationHoldsMappingService } from './registration-holds-mapping.service';
import { ApiService } from '@shared/services/api.service';
import {
  RegistrationHoldsMappingParamsDto,
  CreateRegistrationHoldsMappingRequestDto,
  UpdateRegistrationHoldsMappingRequestDto
} from '../models/registration-holds-mapping.model';

describe('RegistrationHoldsMappingService', () => {
  let service: RegistrationHoldsMappingService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        RegistrationHoldsMappingService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });
    service = TestBed.inject(RegistrationHoldsMappingService);
  });

  describe('getRegistrationHoldsMapping', () => {
    it('should retrieve registration holds with pagination', () => {
      const mockResponse = {
        data: [
          {
            interReason: 'ABOPPCUE',
            code: 'RH001',
            description: 'ABO Discrepancy - Positive Antibody Screen',
            effDate: '2024-01-15',
            termDate: null,
            modificationDate: '2024-11-20',
            changeControlFlag: 'N'
          }
        ],
        totalCount: 1
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      const params: RegistrationHoldsMappingParamsDto = {};
      service.getRegistrationHoldsMapping(25, 0, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0].interdictionReason).toBe('ABOPPCUE');
        expect(result.data[0].code).toBe('RH001');
      });

      expect(mockApiService.post).toHaveBeenCalled();
    });

    it('should apply search keyword filter', () => {
      const mockResponse = {
        data: [],
        totalCount: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      const params: RegistrationHoldsMappingParamsDto = {
        SearchKeyword: 'ABOPPCUE'
      };

      service.getRegistrationHoldsMapping(25, 0, params).subscribe();

      const call = mockApiService.post.calls.mostRecent();
      const body = call.args[1];
      expect(body.search).toBe('ABOPPCUE');
    });



    it('should format dates without timezone conversion', () => {
      const mockResponse = {
        data: [],
        totalCount: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      const testDate = new Date('2026-02-28');
      const params: RegistrationHoldsMappingParamsDto = {
        TerminationDate: testDate.toISOString().split('T')[0]
      };

      service.getRegistrationHoldsMapping(25, 0, params).subscribe();

      const call = mockApiService.post.calls.mostRecent();
      const body = call.args[1];
      expect(body.terminationDate).toBe('2026-02-28');
    });


  });

  describe('getRegistrationHolds', () => {
    it('should retrieve interdiction reasons for dropdown', () => {
      const mockResponse = {
        data: [
          { interdictionReason: 'ABOPPCUE' },
          { interdictionReason: 'NOLOOKUP' }
        ]
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getRegistrationHolds().subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.data[0].interdictionReason).toBe('ABOPPCUE');
        expect(result.data[1].interdictionReason).toBe('NOLOOKUP');
      });

      expect(mockApiService.get).toHaveBeenCalled();
    });

    it('should handle empty interdiction reasons', () => {
      const mockResponse = {
        interdictionReasons: []
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getRegistrationHolds().subscribe(result => {
        expect(result.data).toEqual([]);
      });
    });

    it('should handle API errors for dropdown fetch', () => {
      const errorResponse = { status: 404, error: { message: 'Not found' } };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getRegistrationHolds().subscribe(result => {
        // Service catches errors and returns empty array to prevent UI crash
        expect(result.data).toEqual([]);
      });
    });
  });

  describe('getCodeDropdowns', () => {
    it('should retrieve code options with descriptions', () => {
      const mockResponse = {
        data: [
          { code: 'RH001', description: 'Code 001 Description' },
          { code: 'RH002', description: 'Code 002 Description' }
        ]
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCodeDropdowns().subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.data[0].code).toBe('RH001');
        expect(result.data[0].description).toBe('Code 001 Description');
      });

      expect(mockApiService.get).toHaveBeenCalled();
    });

    it('should handle array response format', () => {
      const mockResponse = [
        { code: 'RH001', description: 'Code 001 Description' },
        { code: 'RH002', description: 'Code 002 Description' }
      ];

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getCodeDropdowns().subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.data[0].code).toBe('RH001');
        expect(result.data[1].code).toBe('RH002');
      });
    });


    it('should handle API errors gracefully', () => {
      const errorResponse = { status: 500, error: { message: 'Server error' } };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getCodeDropdowns().subscribe(result => {
        // Service catches errors and returns empty array to prevent UI crash
        expect(result.data).toEqual([]);
      });
    });
  });

  describe('getDescriptionByCode', () => {
    it('should retrieve description for a specific code', () => {
      const mockResponse = {
        success: true,
        code: 'RH001',
        description: 'Test Description'
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDescriptionByCode('RH001').subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.code).toBe('RH001');
        expect(result.description).toBe('Test Description');
      });

      expect(mockApiService.get).toHaveBeenCalled();
    });
  });

  describe('addRegistrationHoldMapping', () => {
    it('should create new registration hold mapping', () => {
      const newData: CreateRegistrationHoldsMappingRequestDto = {
        InterReason: 'ABOPPCUE',
        Code: 'RH001',
        EffectiveDate: '2024-01-15',
        TerminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Registration Hold added successfully',
        item: {
          interdictionReason: 'ABOPPCUE',
          code: 'RH001',
          description: 'ABO Positive PCE',
          effectiveDate: new Date('2024-01-15'),
          terminationDate: null
        }
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.addRegistrationHoldMapping(newData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully');
      });

      expect(mockApiService.post).toHaveBeenCalled();
      const call = mockApiService.post.calls.mostRecent();
      const payload = call.args[1];
      expect(payload.EffectiveDate).toBe('2024-01-15');
    });


    it('should handle creation errors', () => {
      const newData: CreateRegistrationHoldsMappingRequestDto = {
        InterReason: 'ABOPPCUE',
        Code: 'RH001',
        EffectiveDate: '2024-01-15',
        TerminationDate: null
      };

      const errorResponse = { status: 409, error: { message: 'Duplicate entry' } };
      mockApiService.post.and.returnValue(throwError(() => errorResponse));

      service.addRegistrationHoldMapping(newData).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(409);
        }
      });
    });
  });

  describe('updateRegistrationHoldMapping', () => {
    it('should update existing registration hold mapping', () => {
      const updateData: UpdateRegistrationHoldsMappingRequestDto = {
        OriginalInterReason: 'ABOPPCUE',
        OriginalCode: 'RH001',
        Code: 'RH002',
        EffectiveDate: '2024-01-15',
        TerminationDate: '2024-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Registration Hold updated successfully',
        item: {}
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.updateRegistrationHoldMapping(updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.message).toContain('updated');
      });

      expect(mockApiService.put).toHaveBeenCalled();
    });


    it('should handle update errors', () => {
      const updateData: UpdateRegistrationHoldsMappingRequestDto = {
        OriginalInterReason: 'ABOPPCUE',
        OriginalCode: 'RH001',
        Code: 'RH002',
        EffectiveDate: '2024-01-15',
        TerminationDate: null
      };

      const errorResponse = { status: 404, error: { message: 'Record not found' } };
      mockApiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateRegistrationHoldMapping(updateData).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(404);
        }
      });
    });
  });

  describe('Date formatting', () => {
    it('should format date correctly without timezone offset', () => {
      const testDate = new Date('2026-02-28');
      const params: RegistrationHoldsMappingParamsDto = {
        EffectiveDate: testDate.toISOString().split('T')[0]
      };

      mockApiService.post.and.returnValue(of({ data: [], totalCount: 0 }));

      service.getRegistrationHoldsMapping(25, 0, params).subscribe();

      const call = mockApiService.post.calls.mostRecent();
      const body = call.args[1];
      expect(body.effectiveDate).toBe('2026-02-28');
    });

    it('should handle dates at year boundaries', () => {
      const testDate = new Date('2025-12-31');
      const params: RegistrationHoldsMappingParamsDto = {
        TerminationDate: testDate.toISOString().split('T')[0]
      };

      mockApiService.post.and.returnValue(of({ data: [], totalCount: 0 }));

      service.getRegistrationHoldsMapping(25, 0, params).subscribe();

      const call = mockApiService.post.calls.mostRecent();
      const body = call.args[1];
      expect(body.terminationDate).toBe('2025-12-31');
    });
  });
});
