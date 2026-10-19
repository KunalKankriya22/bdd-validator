import { TestBed } from '@angular/core/testing';
import { EnterTestsMappingService } from './enter-tests-mapping.service';
import { ApiService } from '@shared/services/api.service';
import {
  ContractDropdownItem,
  TestDropdownItem,
  TestMappingRow,
  TestMappingSaveRequest,
  SaveResponse,
} from '../models/enter-tests-mapping.model';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';

describe('EnterTestsMappingService', () => {
  let service: EnterTestsMappingService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockContracts: ContractDropdownItem[] = [
    { contractId: 'C001', company: 'Company A' },
    { contractId: 'C002', company: 'Company B' },
  ];

  const mockTests: TestDropdownItem[] = [
    { testGroup: 'GROUP-A', testId: 'T001', testDesc: 'Test One' },
    { testGroup: null, testId: 'T002', testDesc: 'Test Two' },
  ];

  const mockMatrix: TestMappingRow[] = [
    {
      testId: 'T001',
      testDesc: 'Test One',
      cbcTestId: 'CBC001',
      effDate: '2026-06-01',
      termDate: null,
      modifiedDate: '2026-06-01',
    },
  ];

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        EnterTestsMappingService,
        { provide: ApiService, useValue: apiService },
      ],
    });

    service = TestBed.inject(EnterTestsMappingService);
  });

  // ==================== Initialization ====================

  // ==================== getContractsDropdown ====================

  describe('getContractsDropdown', () => {
    it('should return contracts on success', (done) => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockContracts, item: mockContracts })
      );

      service.getContractsDropdown().subscribe((result) => {
        expect(result).toEqual(mockContracts);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should call API with search parameter', () => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: [], item: [] })
      );

      service.getContractsDropdown('test');

      service.getContractsDropdown('test').subscribe();
      expect(apiService.get).toHaveBeenCalledWith(
        API.ENTER_TESTS_MAPPING.CONTRACTS_DROPDOWN('test')
      );
    });

    it('should call API without search parameter', () => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: [], item: [] })
      );

      service.getContractsDropdown().subscribe();
      expect(apiService.get).toHaveBeenCalledWith(
        API.ENTER_TESTS_MAPPING.CONTRACTS_DROPDOWN(undefined)
      );
    });


  });

  // ==================== getTestsDropdown ====================

  describe('getTestsDropdown', () => {
    it('should return tests for a contract', (done) => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockTests, item: mockTests })
      );

      service.getTestsDropdown('C001').subscribe((result) => {
        expect(result).toEqual(mockTests);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should call API with correct contract ID', () => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: [], item: [] })
      );

      service.getTestsDropdown('C001').subscribe();
      expect(apiService.get).toHaveBeenCalledWith(
        API.ENTER_TESTS_MAPPING.TESTS_DROPDOWN('C001')
      );
    });


  });

  // ==================== getTestMatrix ====================

  describe('getTestMatrix', () => {
    it('should return test matrix for a contract', (done) => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: mockMatrix, item: mockMatrix })
      );

      service.getTestMatrix('C001').subscribe((result) => {
        expect(result).toEqual(mockMatrix);
        expect(result.length).toBe(1);
        done();
      });
    });

    it('should call API with correct contract ID', () => {
      apiService.get.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: [], item: [] })
      );

      service.getTestMatrix('C001').subscribe();
      expect(apiService.get).toHaveBeenCalledWith(
        API.ENTER_TESTS_MAPPING.GET_MATRIX('C001')
      );
    });


  });

  // ==================== saveTestMatrix ====================

  describe('saveTestMatrix', () => {
    const mockSaveRequest: TestMappingSaveRequest = {
      contractId: 'C001',
      rows: [
        { testId: 'T001', cbcTestId: 'CBC001', effDate: '2026-06-14', termDate: null },
      ],
    };

    it('should save and return mapped response on success', (done) => {
      apiService.post.and.returnValue(
        of({
          success: true,
          message: 'Saved successfully',
          statusCode: 200,
          data: null,
          item: { status: 'OK', message: 'Saved', warnings: [] } as SaveResponse,
        })
      );

      service.saveTestMatrix(mockSaveRequest).subscribe((result) => {
        expect(result.status).toBe('OK');
        expect(result.message).toBe('Saved successfully');
        expect(result.warnings).toEqual([]);
        done();
      });
    });

    it('should call API with correct endpoint and payload', () => {
      apiService.post.and.returnValue(
        of({
          success: true,
          message: 'OK',
          statusCode: 200,
          data: null,
          item: { status: 'OK', message: 'OK', warnings: [] },
        })
      );

      service.saveTestMatrix(mockSaveRequest).subscribe();
      expect(apiService.post).toHaveBeenCalledWith(
        API.ENTER_TESTS_MAPPING.SAVE,
        mockSaveRequest
      );
    });

    it('should return warnings when present', (done) => {
      apiService.post.and.returnValue(
        of({
          success: true,
          message: 'Saved with warnings',
          statusCode: 200,
          data: null,
          item: {
            status: 'WARNING',
            message: 'Saved with warnings',
            warnings: [{ code: 'W001', message: 'Duplicate detected' }],
          } as SaveResponse,
        })
      );

      service.saveTestMatrix(mockSaveRequest).subscribe((result) => {
        expect(result.status).toBe('WARNING');
        expect(result.warnings.length).toBe(1);
        expect(result.warnings[0].code).toBe('W001');
        done();
      });
    });

    it('should handle null item gracefully', (done) => {
      apiService.post.and.returnValue(
        of({
          success: true,
          message: 'OK',
          statusCode: 200,
          data: null,
          item: null,
        })
      );

      service.saveTestMatrix(mockSaveRequest).subscribe((result) => {
        expect(result.status).toBe('OK');
        expect(result.message).toBe('OK');
        expect(result.warnings).toEqual([]);
        done();
      });
    });

    it('should handle empty message gracefully', (done) => {
      apiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          statusCode: 200,
          data: null,
          item: { status: 'OK', message: '', warnings: [] },
        })
      );

      service.saveTestMatrix(mockSaveRequest).subscribe((result) => {
        expect(result.message).toBe('');
        done();
      });
    });
  });
});
