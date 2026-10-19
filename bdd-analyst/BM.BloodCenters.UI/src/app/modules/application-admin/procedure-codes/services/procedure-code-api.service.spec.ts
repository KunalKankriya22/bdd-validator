import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProcedureCodeApiService } from './procedure-code-api.service';
import { ApiService } from '../../../../shared/services/api.service';
import {
  ProcedureCodeApiResponse,
  ProcedureCodeCreateRequest,
  ProcedureCodeUpdateRequest,
  ProcedureCodeFilter,
  ProcedureCodeMutationResponse,
  ValidProcedureTypeFilterDropdownValues,
} from '../models/procedure-code.model';

describe('ProcedureCodeApiService', () => {
  let service: ProcedureCodeApiService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockApiResponse: ProcedureCodeApiResponse = {
    Data: [
      {
        ChapterId: 'CH001',
        ProcedureCode: 'WB',
        Description: 'Whole Blood',
        Duration: 56,
        CreditCount: 1,
        SchViewInterval: 1,
        SortSequence: 10,
        StandardRbcLoss: 0,
        StandardPlasmaLoss: 0,
        EcvRbcLoss: 0,
        EcvPlasmaLoss: 0,
        EffDate: '2025-01-14T00:00:00',
        TermDate: null,
        IsActive: true,
      },
    ],
    TotalCount: 1,
  };

  const mockMutationResponse: ProcedureCodeMutationResponse = {
    success: true,
    message: 'Operation completed successfully',
    statusCode: 200,
  };

  const mockDropdownResponse: ValidProcedureTypeFilterDropdownValues = {
    procedureCodes: [
      { procedureCode: 11 },
      { procedureCode: 18 },
      { procedureCode: 20 },
    ],
    deferralDays: [
      { duration: 0 },
      { duration: 1 },
      { duration: 7 },
    ],
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ProcedureCodeApiService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(ProcedureCodeApiService);
  });

  it('should fetch procedure codes successfully', (done) => {
    mockApiService.post.and.returnValue(of(mockApiResponse));

    service.getProcedureCodes(10, 0).subscribe((result) => {
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.data[0].procedureCode).toBe('WB');
      done();
    });
  });

  it('should include all filter fields in request payload', (done) => {
    const filter: ProcedureCodeFilter = {
      search: 'whole blood',
      procedureCode: 'WB',
      deferralDays: 56,
      effDatePeriod: 'after',
      effDate: '2025-01-01',
      termDatePeriod: 'before',
      termDate: '2025-12-31',
      sortDirection: 'asc',
    };

    mockApiService.post.and.returnValue(of(mockApiResponse));

    service.getProcedureCodes(10, 0, filter).subscribe(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/application-admin/valid-procedure-types/10/0',
        jasmine.objectContaining({
          search: 'whole blood',
          procedureCode: 'WB',
          deferralDays: 56,
          effDatePeriod: 'after',
          effDate: '2025-01-01',
          termDatePeriod: 'before',
          termDate: '2025-12-31',
          sortDirection: 'asc',
        })
      );
      done();
    });
  });

  it('should create procedure code successfully', (done) => {
    const createRequest: ProcedureCodeCreateRequest = {
      procedureCode: 'RBC',
      description: 'Red Blood Cells',
      duration: 112,
      creditCount: 2,
      schViewInterval: 2,
      sortSequence: 20,
      effDate: '2025-01-14T00:00:00',
      termDate: null,
      standardRbcLoss: 0,
      standardPlasmaLoss: 0,
      ecvRbcLoss: 0,
      ecvPlasmaLoss: 0,
    };

    mockApiService.post.and.returnValue(of(mockMutationResponse));

    service.createProcedureCode(createRequest).subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.message).toBe('Operation completed successfully');
      expect(result.statusCode).toBe(200);
      done();
    });
  });

  it('should update procedure code successfully', (done) => {
    const updateRequest: ProcedureCodeUpdateRequest = {
      duration: 60,
      creditCount: 2,
      schViewInterval: 2,
      sortSequence: 15,
      termDate: '2025-12-31T00:00:00',
      standardRbcLoss: 0,
      standardPlasmaLoss: 0,
      ecvRbcLoss: 0,
      ecvPlasmaLoss: 0,
    };

    mockApiService.put.and.returnValue(of(mockMutationResponse));

    service.updateProcedureCode('WB', updateRequest).subscribe((result) => {
      expect(result.success).toBeTrue();
      expect(result.message).toBe('Operation completed successfully');
      expect(result.statusCode).toBe(200);
      done();
    });
  });


  describe('getProcedureCodeDropdowns', () => {
    it('should fetch dropdown values successfully', (done) => {
      mockApiService.get.and.returnValue(of(mockDropdownResponse));

      service.getProcedureCodeDropdowns().subscribe((result) => {
        expect(result.procedureCodes).toEqual(['11', '18', '20']);
        expect(result.deferralDays).toEqual([0, 1, 7]);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/application-admin/procedure-code-filters');
        done();
      });
    });

    it('should transform number procedure codes to strings', (done) => {
      mockApiService.get.and.returnValue(of(mockDropdownResponse));

      service.getProcedureCodeDropdowns().subscribe((result) => {
        result.procedureCodes.forEach(code => {
          expect(typeof code).toBe('string');
        });
        done();
      });
    });


    it('should filter out null and undefined procedure codes', (done) => {
      const responseWithNulls: ValidProcedureTypeFilterDropdownValues = {
        procedureCodes: [
          { procedureCode: 11 },
          { procedureCode: null as any },
          { procedureCode: 20 },
          { procedureCode: undefined as any },
        ],
        deferralDays: [{ duration: 0 }],
      };
      mockApiService.get.and.returnValue(of(responseWithNulls));

      service.getProcedureCodeDropdowns().subscribe((result) => {
        expect(result.procedureCodes).toEqual(['11', '20']);
        done();
      });
    });

    it('should filter out null and undefined deferral days', (done) => {
      const responseWithNulls: ValidProcedureTypeFilterDropdownValues = {
        procedureCodes: [{ procedureCode: 11 }],
        deferralDays: [
          { duration: 0 },
          { duration: null as any },
          { duration: 7 },
          { duration: undefined as any },
        ],
      };
      mockApiService.get.and.returnValue(of(responseWithNulls));

      service.getProcedureCodeDropdowns().subscribe((result) => {
        expect(result.deferralDays).toEqual([0, 7]);
        done();
      });
    });

    it('should include deferral days with value 0', (done) => {
      mockApiService.get.and.returnValue(of(mockDropdownResponse));

      service.getProcedureCodeDropdowns().subscribe((result) => {
        expect(result.deferralDays).toContain(0);
        done();
      });
    });

    it('should handle API errors for dropdown fetch', (done) => {
      const error = new Error('Dropdown API Error');
      mockApiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getProcedureCodeDropdowns().subscribe({
        error: (err) => {
          expect(console.error).toHaveBeenCalledWith('Error fetching procedure code dropdowns:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
