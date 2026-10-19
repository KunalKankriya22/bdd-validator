import { TestBed } from '@angular/core/testing';
import { DefineProcedureExclusionsService } from './define-procedure-exclusions.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  DefineProcedureExclusionsModel,
  DefineProcedureExclusionsParamsDto,
  DefineProcedureExclusionsDto,
  UpdateDefineProcedureExclusionsDto,
  DefineProcedureExclusionsFilterLov
} from '../models/define-procedure-exclusions.model';

describe('DefineProcedureExclusionsService', () => {
  let service: DefineProcedureExclusionsService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockExclusionsData: DefineProcedureExclusionsModel[] = [
    {
      donationType: 'AL',
      donationTypeDesc: 'AL - Allogeneic',
      procedure: 'BM',
      procedureDesc: 'BM - Bone Marrow',
      interdiction: 'CODE001',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    },
    {
      donationType: 'AU',
      donationTypeDesc: 'AU - Autologous',
      procedure: 'WB',
      procedureDesc: 'WB - Whole Blood',
      interdiction: 'CODE002',
      effectiveDate: new Date('2025-02-01'),
      terminationDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    success: true,
    data: mockExclusionsData,
    total: 2
  };

  const mockFilterLov: DefineProcedureExclusionsFilterLov = {
    donationTypes: [
      { key: '99 - Not Recorded', value: '99' },
      { key: 'AL - Allogeneic', value: 'AL' }
    ],
    procedureCodes: [
      { key: '99 - Not Present', value: '99' },
      { key: 'BM - Bone Marrow', value: 'BM' }
    ],
    interdictionCodes: [
      { key: 'CODE001 - Description 1', value: 'CODE001' },
      { key: 'CODE002 - Description 2', value: 'CODE002' },
      { key: 'CODE003 - Description 3', value: 'CODE003' }
    ]
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DefineProcedureExclusionsService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DefineProcedureExclusionsService);
  });

  describe('getDefineProcedureExclusions', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: DefineProcedureExclusionsParamsDto = {};

      service.getDefineProcedureExclusions(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-exclusion\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('getProcedureExclusionsFilters', () => {

    it('should return filter LOV data', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockFilterLov] }));

      service.getProcedureExclusionsFilters().subscribe(result => {
        expect(result.data).toEqual([mockFilterLov]);
        done();
      });
    });

  });

  describe('getLookups', () => {

    it('should return lookups data', (done) => {
      mockApiService.get.and.returnValue(of({ data: [mockFilterLov] }));

      service.getLookups().subscribe(result => {
        expect(result.data).toEqual([mockFilterLov]);
        done();
      });
    });

  });

  describe('addProcedureExclusion', () => {
    const mockAddData: DefineProcedureExclusionsDto = {
      donationType: 'AL',
      procedureCode: 'BM',
      interdictionCode: 'CODE001',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    };

    it('should call apiService.post with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of({ success: true, message: 'Added successfully' }));

      service.addProcedureExclusion(mockAddData).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-exclusion$/),
          mockAddData
        );
        done();
      });
    });




  });

  describe('updateProcedureExclusion', () => {
    const mockUpdateData: UpdateDefineProcedureExclusionsDto = {
      originalDonationType: 'AL',
      originalProcedureCode: 'BM',
      originalInterdictionCode: 'CODE001',
      donationType: 'AU',
      procedureCode: 'WB',
      interdictionCode: 'CODE002',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: new Date('2025-12-31')
    };

    it('should call apiService.put with correct endpoint and data', (done) => {
      mockApiService.put.and.returnValue(of({ success: true, message: 'Updated successfully' }));

      service.updateProcedureExclusion(mockUpdateData).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/procedure-exclusion$/),
          mockUpdateData
        );
        done();
      });
    });




    it('should send data with current and new values', (done) => {
      mockApiService.put.and.returnValue(of({ success: true }));

      service.updateProcedureExclusion(mockUpdateData).subscribe(() => {
        const calledData = mockApiService.put.calls.mostRecent().args[1];
        expect(calledData.originalDonationType).toBe('AL');
        expect(calledData.originalProcedureCode).toBe('BM');
        expect(calledData.donationType).toBe('AU');
        expect(calledData.procedureCode).toBe('WB');
        done();
      });
    });

  });

  describe('Error Handling', () => {
    it('should log error to console for getDefineProcedureExclusions', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getDefineProcedureExclusions(25, 0, {}).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching define procedure exclusions data:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getProcedureExclusionsFilters', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getProcedureExclusionsFilters().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching procedure exclusion filters:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for getLookups', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getLookups().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching procedure exclusion lookups:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for addProcedureExclusion', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const mockData: DefineProcedureExclusionsDto = {
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001',
        effectiveDate: new Date(),
        terminationDate: null
      };

      service.addProcedureExclusion(mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error adding procedure exclusion:',
            error
          );
          done();
        }
      });
    });

    it('should log error to console for updateProcedureExclusion', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      const mockData: UpdateDefineProcedureExclusionsDto = {
        originalDonationType: 'AL',
        originalProcedureCode: 'BM',
        originalInterdictionCode: 'CODE001',
        donationType: 'AU',
        procedureCode: 'WB',
        interdictionCode: 'CODE002',
        effectiveDate: new Date(),
        terminationDate: null
      };

      service.updateProcedureExclusion(mockData).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error updating procedure exclusion:',
            error
          );
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getDefineProcedureExclusions', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefineProcedureExclusions(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

    it('should use correct HTTP method for each operation', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      mockApiService.get.and.returnValue(of({ data: [] }));
      mockApiService.put.and.returnValue(of({ success: true }));

      // Test POST for getDefineProcedureExclusions
      service.getDefineProcedureExclusions(25, 0, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalled();

        // Test GET for getLookups
        service.getLookups().subscribe(() => {
          expect(mockApiService.get).toHaveBeenCalled();

          // Test PUT for updateProcedureExclusion
          const updateData: UpdateDefineProcedureExclusionsDto = {
            originalDonationType: 'AL',
            originalProcedureCode: 'BM',
            originalInterdictionCode: 'CODE001',
            donationType: 'AU',
            procedureCode: 'WB',
            interdictionCode: 'CODE002',
            effectiveDate: new Date(),
            terminationDate: null
          };

          service.updateProcedureExclusion(updateData).subscribe(() => {
            expect(mockApiService.put).toHaveBeenCalled();
            done();
          });
        });
      });
    });
  });
});
