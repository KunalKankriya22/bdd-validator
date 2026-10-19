import { TestBed } from '@angular/core/testing';
import { DefineProcedureGroupsService } from './define-procedure-groups.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  DefineProcedureGroupsModel,
  DefineProcedureGroupsParamsDto,
  DefineProcedureGroupsDto,
  UpdateDefineProcedureGroupsDto,
  ProcedureGroupLookup,
  ProcedureCodeLookup,
  CreditCountLookup,
  UserContext
} from '../models/define-procedure-groups.model';

describe('DefineProcedureGroupsService', () => {
  let service: DefineProcedureGroupsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockProcedureGroupsData: DefineProcedureGroupsModel[] = [
    {
      procedureGroup: 'PLASM',
      groupDescription: 'Plasma Collection',
      procedureCode: 'PL',
      procedureDescription: 'Plasma',
      eligCreditCount: 1,
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      procedureGroup: 'PLATE',
      groupDescription: 'Platelet Collection',
      procedureCode: 'PP',
      procedureDescription: 'Plateletpheresis',
      eligCreditCount: 2,
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockProcedureGroupsData,
    total: 2
  };

  const mockProcedureGroupLookup: ProcedureGroupLookup[] = [
    { code: 'PLASM', description: 'Plasma Collection' },
    { code: 'PLATE', description: 'Platelet Collection' },
    { code: 'WHOLE', description: 'Whole Blood' }
  ];

  const mockProcedureCodeLookup: ProcedureCodeLookup[] = [
    { procedureCode: 'PL', description: 'Plasma' },
    { procedureCode: 'PP', description: 'Plateletpheresis' },
    { procedureCode: 'WB', description: 'Whole Blood' }
  ];

  const mockCreditCountLookup: CreditCountLookup[] = [
    { creditCount: 1, description: 'Credit Count: 1', recordCount: 10 },
    { creditCount: 2, description: 'Credit Count: 2', recordCount: 5 },
    { creditCount: 3, description: 'Credit Count: 3', recordCount: 3 }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        DefineProcedureGroupsService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DefineProcedureGroupsService);
  });

  describe('getDefineProcedureGroups', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: DefineProcedureGroupsParamsDto = {};

      service.getDefineProcedureGroups(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('getUserContext', () => {
    const mockUserContext: UserContext = {
      userId: 'user123',
      chapterId: 'ABC',
      printerId: 'P001',
      programId: 'PROG001',
      hasAccess: true,
      permissions: ['read', 'write']
    };

    it('should call apiService.get with correct endpoint using path parameter', (done) => {
      mockApiService.get.and.returnValue(of(mockUserContext));

      service.getUserContext('user123').subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/user\/context\/user123/)
        );
        done();
      });
    });

    it('should return user context data directly', (done) => {
      mockApiService.get.and.returnValue(of(mockUserContext));

      service.getUserContext('user123').subscribe(result => {
        expect(result).toEqual(mockUserContext);
        expect(result.userId).toBe('user123');
        expect(result.chapterId).toBe('ABC');
        expect(result.programId).toBe('PROG001');
        done();
      });
    });


    it('should log error to console when API fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getUserContext('user123').subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching user context:',
            error
          );
          done();
        }
      });
    });
  });

  describe('addProcedureGroup', () => {
    const mockAddData: DefineProcedureGroupsDto = {
      procedureGroup: 'PLASM',
      procedureCode: 'PL',
      effDate: '2025-01-01',
      termDate: null,
      eligCreditCount: 1,
      chapterId: 'ABC',
      programId: 'PROG001',
      insertUser: 'user123'
    };

    it('should call apiService.post with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Added successfully' }));

      service.addProcedureGroup(mockAddData).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups$/),
          mockAddData
        );
        done();
      });
    });



  });

  describe('updateProcedureGroup', () => {
    const procedureGroup = 'PLASM';
    const procedureCode = 'PL';
    const effectiveDate = '2025-01-01';
    const mockUpdateData: UpdateDefineProcedureGroupsDto = {
      procedureGroup: 'PLASM',
      procedureCode: 'PL',
      effDate: '2025-01-01',
      termDate: '2025-12-31',
      eligCreditCount: 2,
      programId: 'PROG001'
    };

    it('should call apiService.put with correct endpoint and data', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated successfully' }));

      service.updateProcedureGroup(procedureGroup, procedureCode, effectiveDate, mockUpdateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/PLASM\/PL\/2025-01-01/),
          mockUpdateData
        );
        done();
      });
    });



  });

  describe('getProcedureGroupsLookup - with caching', () => {
    beforeEach(() => {
      service.clearLookupCache(); // Clear cache before each test
    });

    it('should call API on first request', (done) => {
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureGroupsLookup().subscribe(result => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/lookups\/procedure-groups/)
        );
        expect(result.data).toEqual(mockProcedureGroupLookup);
        done();
      });
    });

    it('should return cached data on subsequent requests', (done) => {
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      // First request - should call API
      service.getProcedureGroupsLookup().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledTimes(1);

        // Second request - should use cache
        service.getProcedureGroupsLookup().subscribe(result => {
          expect(mockApiService.get).toHaveBeenCalledTimes(1); // Still 1, not called again
          expect(result.data).toEqual(mockProcedureGroupLookup);
          expect(result.success).toBe(true);
          done();
        });
      });
    });

    it('should cache the data after first successful API call', (done) => {
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureGroupsLookup().subscribe(() => {
        // Verify cache by making another call
        service.getProcedureGroupsLookup().subscribe(cachedResult => {
          expect(cachedResult.data).toEqual(mockProcedureGroupLookup);
          expect(cachedResult.total).toBe(3);
          done();
        });
      });
    });


  });

  describe('getProcedureCodesLookup - with caching', () => {
    beforeEach(() => {
      service.clearLookupCache();
    });

    it('should call API on first request', (done) => {
      const response = { success: true, data: mockProcedureCodeLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureCodesLookup().subscribe(result => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/lookups\/procedure-codes/)
        );
        expect(result.data).toEqual(mockProcedureCodeLookup);
        done();
      });
    });

    it('should return cached data on subsequent requests', (done) => {
      const response = { success: true, data: mockProcedureCodeLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureCodesLookup().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledTimes(1);

        service.getProcedureCodesLookup().subscribe(result => {
          expect(mockApiService.get).toHaveBeenCalledTimes(1);
          expect(result.data).toEqual(mockProcedureCodeLookup);
          done();
        });
      });
    });

  });

  describe('getCreditCountsLookup - with caching', () => {
    beforeEach(() => {
      service.clearLookupCache();
    });

    it('should call API on first request', (done) => {
      const response = { success: true, data: mockCreditCountLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getCreditCountsLookup().subscribe(result => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-groups\/lookups\/credit-counts/)
        );
        expect(result.data).toEqual(mockCreditCountLookup);
        done();
      });
    });

    it('should return cached data on subsequent requests', (done) => {
      const response = { success: true, data: mockCreditCountLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getCreditCountsLookup().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledTimes(1);

        service.getCreditCountsLookup().subscribe(result => {
          expect(mockApiService.get).toHaveBeenCalledTimes(1);
          expect(result.data).toEqual(mockCreditCountLookup);
          done();
        });
      });
    });

  });

  describe('clearLookupCache', () => {
    it('should clear all cached lookup data', (done) => {
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      // Load cache first
      service.getProcedureGroupsLookup().subscribe(() => {
        // Verify it's cached
        service.getProcedureGroupsLookup().subscribe(() => {
          expect(mockApiService.get).toHaveBeenCalledTimes(1);

          // Clear cache
          service.clearLookupCache();

          // Next call should hit API again
          service.getProcedureGroupsLookup().subscribe(() => {
            expect(mockApiService.get).toHaveBeenCalledTimes(2);
            done();
          });
        });
      });
    });

    it('should clear all three cache types', (done) => {
      const pgResponse = { success: true, data: mockProcedureGroupLookup, total: 3 };
      const pcResponse = { success: true, data: mockProcedureCodeLookup, total: 3 };
      const ccResponse = { success: true, data: mockCreditCountLookup, total: 3 };

      mockApiService.get.and.returnValues(
        of(pgResponse),
        of(pcResponse),
        of(ccResponse),
        of(pgResponse),
        of(pcResponse),
        of(ccResponse)
      );

      // Load all caches
      service.getProcedureGroupsLookup().subscribe(() => {
        service.getProcedureCodesLookup().subscribe(() => {
          service.getCreditCountsLookup().subscribe(() => {
            expect(mockApiService.get).toHaveBeenCalledTimes(3);

            // Clear cache
            service.clearLookupCache();

            // All should call API again
            service.getProcedureGroupsLookup().subscribe(() => {
              service.getProcedureCodesLookup().subscribe(() => {
                service.getCreditCountsLookup().subscribe(() => {
                  expect(mockApiService.get).toHaveBeenCalledTimes(6);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should log error to console for getDefineProcedureGroups', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getDefineProcedureGroups(25, 0, {}).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching define procedure groups data:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for addProcedureGroup', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const mockData: DefineProcedureGroupsDto = {
        procedureGroup: 'PLASM',
        procedureCode: 'PL',
        effDate: '2025-01-01',
        termDate: null,
        eligCreditCount: 1,
        chapterId: 'ABC',
        programId: 'PROG001',
        insertUser: 'user123'
      };

      service.addProcedureGroup(mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error adding procedure group:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for updateProcedureGroup', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      const mockData: UpdateDefineProcedureGroupsDto = {
        procedureGroup: 'PLASM',
        procedureCode: 'PL',
        effDate: '2025-01-01',
        termDate: null,
        eligCreditCount: 1,
        programId: 'PROG001'
      };

      service.updateProcedureGroup('PLASM', 'PL', '2025-01-01', mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error updating procedure group:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getProcedureGroupsLookup', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getProcedureGroupsLookup().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching procedure groups lookup:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getProcedureCodesLookup', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getProcedureCodesLookup().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching procedure codes lookup:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getCreditCountsLookup', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getCreditCountsLookup().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching credit counts lookup:',
            error
          );
          done();
        }
      });
    });
  });

  describe('Cache logging', () => {
    it('should log when returning cached procedure groups', (done) => {
      const consoleSpy = spyOn(console, 'log');
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureGroupsLookup().subscribe(() => {
        consoleSpy.calls.reset();

        service.getProcedureGroupsLookup().subscribe(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Returning cached procedure groups');
          done();
        });
      });
    });

    it('should log when caching procedure groups data', (done) => {
      const consoleSpy = spyOn(console, 'log');
      const response = { success: true, data: mockProcedureGroupLookup, total: 3 };
      mockApiService.get.and.returnValue(of(response));

      service.getProcedureGroupsLookup().subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Cached procedure groups:', 3, 'items');
        done();
      });
    });

    it('should clear all caches when clearLookupCache is called', () => {
      service.clearLookupCache();
      // Verify caches are cleared by checking that next calls hit the API
      expect(service['procedureGroupsCache']).toBeNull();
      expect(service['procedureCodesCache']).toBeNull();
      expect(service['creditCountsCache']).toBeNull();
    });
  });
});
