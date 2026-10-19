import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HospitalPatientAdHocTestingContractService } from './hospital-patient-ad-hoc-testing-contract.service';
import { API } from '@core/constants/api.constants';
import moment from 'moment';
import {
  AdHocTestingContract,
  CreateAdHocTestingContractRequest,
  UpdateAdHocTestingContractRequest,
  ReturnResult,
  ContractSearchCriteria,
  ContractFilterModel
} from '../models/hospital-patient-ad-hoc-testing-contract.model';

describe('HospitalPatientAdHocTestingContractService', () => {
  let service: HospitalPatientAdHocTestingContractService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalPatientAdHocTestingContractService]
    });

    service = TestBed.inject(HospitalPatientAdHocTestingContractService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================================================
  // searchContracts
  // ============================================================================

  describe('searchContracts', () => {
    const baseCriteria: ContractSearchCriteria = {
      showTerminated: false,
      contractId: null,
      company: null
    };

    it('should POST to LIST url and return mapped contract table models', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            contractType: 'CU',
            chapterId: 'CH01',
            company: 'ACME Corp',
            barCodeProtocol: 'N',
            effDate: '2024-01-15T00:00:00Z',
            termDate: null
          }
        ],
        total: 1,
        message: 'Success',
        statusCode: 200
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].contractId).toBe('C001');
        expect(result.data[0].customerType).toBe('CU');
        expect(result.data[0].chapterId).toBe('CH01');
        expect(result.data[0].description).toBe('ACME Corp');
        expect(result.data[0].unitScheme).toBe('N');
        expect(result.data[0].effDate).toBe(moment('2024-01-15T00:00:00Z').format('DD-MMM-YYYY'));
        expect(result.data[0].termDate).toBeNull();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.contractType).toBe('CU');
      expect(req.request.body.showTerminated).toBe(false);
      expect(req.request.body.sortColumn).toBe('ContractId');
      expect(req.request.body.sortOrder).toBe('ASC');
      req.flush(mockResponse);
    });

    it('should use provided sortColumn and sortOrder from criteria', () => {
      const criteria: ContractSearchCriteria = {
        showTerminated: true,
        contractId: null,
        company: null,
        sortColumn: 'Company',
        sortOrder: 'DESC'
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(10, 5, criteria).subscribe(result => {
        expect(result.data.length).toBe(0);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(10, 5));
      expect(req.request.body.sortColumn).toBe('Company');
      expect(req.request.body.sortOrder).toBe('DESC');
      expect(req.request.body.showTerminated).toBe(true);
      req.flush(mockResponse);
    });

    it('should include contractId and company in body when provided in criteria', () => {
      const criteria: ContractSearchCriteria = {
        showTerminated: false,
        contractId: 'C999',
        company: 'Test Corp',
        searchKeyword: 'search text'
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, criteria).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.contractId).toBe('C999');
      expect(req.request.body.company).toBe('Test Corp');
      expect(req.request.body.searchKeyword).toBe('search text');
      req.flush(mockResponse);
    });

    it('should apply filters.contractId and filters.contractType when filters provided', () => {
      const filters: ContractFilterModel = {
        contractId: 'F001',
        contractType: 'HP',
        effDatePeriod: 'After',
        effDate: null,
        termDatePeriod: 'After',
        termDate: null
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.contractId).toBe('F001');
      expect(req.request.body.contractType).toBe('HP');
      req.flush(mockResponse);
    });

    it('should set effDateFrom when effDatePeriod is After', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'After',
        effDate: moment('2024-06-15'),
        termDatePeriod: 'After',
        termDate: null
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.effDateFrom).toBe('2024-06-15');
      expect(req.request.body.effDateTo).toBeUndefined();
      req.flush(mockResponse);
    });

    it('should set effDateTo when effDatePeriod is Before', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'Before',
        effDate: moment('2024-03-01'),
        termDatePeriod: 'After',
        termDate: null
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.effDateTo).toBe('2024-03-01');
      expect(req.request.body.effDateFrom).toBeUndefined();
      req.flush(mockResponse);
    });

    it('should set termDateFrom when termDatePeriod is After', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'After',
        effDate: null,
        termDatePeriod: 'After',
        termDate: moment('2025-01-01')
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.termDateFrom).toBe('2025-01-01');
      expect(req.request.body.termDateTo).toBeUndefined();
      req.flush(mockResponse);
    });

    it('should set termDateTo when termDatePeriod is Before', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'After',
        effDate: null,
        termDatePeriod: 'Before',
        termDate: moment('2024-12-31')
      };
      const mockResponse: ReturnResult<any> = { success: true, data: [], total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.termDateTo).toBe('2024-12-31');
      expect(req.request.body.termDateFrom).toBeUndefined();
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = {
        success: false,
        data: [],
        total: 0,
        message: 'Server error',
        statusCode: 500
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Server error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });

    it('should use default error message when response.message is empty', () => {
      const mockResponse: ReturnResult<any> = {
        success: false,
        data: [],
        total: 0,
        message: '',
        statusCode: 500
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });

    it('should handle null data in response by returning empty array', () => {
      const mockResponse = { success: true, data: null, total: 0, message: 'OK', statusCode: 200 };

      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });

    it('should map barCodeProtocol to dash when absent', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'C1', effDate: '2024-01-01T00:00:00Z' }],
        total: 1,
        message: 'OK',
        statusCode: 200
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data[0].unitScheme).toBe('-');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });

    it('should map termDate when present', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'C1', effDate: '2024-01-01T00:00:00Z', termDate: '2024-12-31T00:00:00Z' }],
        total: 1,
        message: 'OK',
        statusCode: 200
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data[0].termDate).toBe(moment('2024-12-31T00:00:00Z').format('DD-MMM-YYYY'));
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getContractDetail
  // ============================================================================

  describe('getContractDetail', () => {
    it('should GET contract detail and map from response.item', () => {
      const mockResponse = {
        item: {
          contractId: 'C001',
          company: 'ACME Corp',
          address1: '123 Main St',
          address2: 'Suite 200',
          address3: '',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          country: 'US',
          phoneNo: '555-1234',
          faxNo: '555-5678',
          intPhone: '001-555-1234',
          telexNo: '001-555-5678',
          chapterId: 'CH01',
          chapterName: 'Chapter One',
          taxIdForm: 'W9',
          barCodeProtocol: 'N',
          centerId: 'CTR01',
          unitIdPattern: 'PATTERN1',
          ediInputInd: 'Y',
          resultOutputInd: 'R',
          confirmTestFlag: 'Y',
          redTubeCount: 5,
          purpleTubeCount: 3,
          intFlag: 'Y',
          effDate: '2024-01-01T00:00:00Z',
          termDate: '2024-12-31T00:00:00Z',
          lastModifiedDate: '2024-06-15T00:00:00Z'
        }
      };

      service.getContractDetail('C001').subscribe(detail => {
        expect(detail.contractId).toBe('C001');
        expect(detail.company).toBe('ACME Corp');
        expect(detail.addr1).toBe('123 Main St');
        expect(detail.addr2).toBe('Suite 200');
        expect(detail.addr3).toBe('');
        expect(detail.city).toBe('Springfield');
        expect(detail.stateCode).toBe('IL');
        expect(detail.zip).toBe('62701');
        expect(detail.country).toBe('US');
        expect(detail.address).toContain('123 Main St');
        expect(detail.address).toContain('Springfield');
        expect(detail.phoneNumber).toBe('555-1234');
        expect(detail.fax).toBe('555-5678');
        expect(detail.internationalPhoneNumber).toBe('001-555-1234');
        expect(detail.internationalFax).toBe('001-555-5678');
        expect(detail.chapterId).toBe('CH01');
        expect(detail.chapterDescription).toBe('Chapter One');
        expect(detail.taxIdForm).toBe('W9');
        expect(detail.unitScheme).toBe('N - Codabar numeric');
        expect(detail.centerId).toBe('CTR01');
        expect(detail.unitIdPattern).toBe('PATTERN1');
        expect(detail.ediInput).toBe('Y - Yes');
        expect(detail.resultsInd).toBe('R - Reports');
        expect(detail.confirmTest).toBe('Y - Yes');
        expect(detail.redTubeCount).toBe(5);
        expect(detail.purpleTubeCount).toBe(3);
        expect(detail.intFlag).toBe('Y');
        expect(detail.termDate).toBe(moment('2024-12-31T00:00:00Z').format('DD-MMM-YYYY'));
        expect(detail.lastModifiedDate).toBe(moment('2024-06-15T00:00:00Z').format('DD-MMM-YYYY'));
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to response.data[0] when item is not present', () => {
      const mockResponse = {
        data: [
          {
            contractId: 'C002',
            company: 'Fallback Corp',
            effDate: '2024-01-01T00:00:00Z'
          }
        ]
      };

      service.getContractDetail('C002').subscribe(detail => {
        expect(detail.contractId).toBe('C002');
        expect(detail.company).toBe('Fallback Corp');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C002'));
      req.flush(mockResponse);
    });

    it('should fall back to response itself when neither item nor data are present', () => {
      const mockResponse = {
        contractId: 'C003',
        company: 'Direct Corp',
        effDate: '2024-01-01T00:00:00Z'
      };

      service.getContractDetail('C003').subscribe(detail => {
        expect(detail.contractId).toBe('C003');
        expect(detail.company).toBe('Direct Corp');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C003'));
      req.flush(mockResponse);
    });

    it('should throw when no item can be resolved', () => {
      const mockResponse = { item: null, data: [] };

      service.getContractDetail('C999').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C999'));
      req.flush(mockResponse);
    });

    it('should map ISBT 128 barcode protocol', () => {
      const mockResponse = {
        item: { contractId: 'C1', barCodeProtocol: 'I', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.unitScheme).toBe('I - ISBT 128');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should map Electronic Mail results indicator', () => {
      const mockResponse = {
        item: { contractId: 'C1', resultOutputInd: 'E', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.resultsInd).toBe('E - Electronic Mail');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should map Both results indicator', () => {
      const mockResponse = {
        item: { contractId: 'C1', resultOutputInd: 'B', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.resultsInd).toBe('B - Both');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use raw value when barcode protocol is unknown', () => {
      const mockResponse = {
        item: { contractId: 'C1', barCodeProtocol: 'X', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.unitScheme).toBe('X');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use dash for missing optional fields', () => {
      const mockResponse = {
        item: { contractId: 'C1', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.company).toBe('-');
        expect(detail.phoneNumber).toBe('-');
        expect(detail.fax).toBe('-');
        expect(detail.internationalPhoneNumber).toBe('-');
        expect(detail.internationalFax).toBe('-');
        expect(detail.chapterId).toBe('-');
        expect(detail.chapterDescription).toBe('-');
        expect(detail.taxIdForm).toBe('-');
        expect(detail.centerId).toBe('-');
        expect(detail.unitIdPattern).toBe('-');
        expect(detail.ediInput).toBe('-');
        expect(detail.resultsInd).toBe('-');
        expect(detail.confirmTest).toBe('-');
        expect(detail.termDate).toBeNull();
        expect(detail.lastModifiedDate).toBeNull();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use alternative field names (addr1, stateCode, name, phoneNumber, faxNumber, intPhoneNumber, telexNumber)', () => {
      const mockResponse = {
        item: {
          contractId: 'C1',
          addr1: 'Alt Addr 1',
          addr2: 'Alt Addr 2',
          addr3: 'Alt Addr 3',
          stateCode: 'CA',
          name: 'Alt Name',
          phoneNumber: '999-1111',
          faxNumber: '999-2222',
          intPhoneNumber: '999-3333',
          telexNumber: '999-4444',
          effDate: '2024-01-01T00:00:00Z'
        }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.addr1).toBe('Alt Addr 1');
        expect(detail.addr2).toBe('Alt Addr 2');
        expect(detail.addr3).toBe('Alt Addr 3');
        expect(detail.stateCode).toBe('CA');
        expect(detail.company).toBe('Alt Name');
        expect(detail.phoneNumber).toBe('999-1111');
        expect(detail.fax).toBe('999-2222');
        expect(detail.internationalPhoneNumber).toBe('999-3333');
        expect(detail.internationalFax).toBe('999-4444');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use default intFlag of N when not provided', () => {
      const mockResponse = {
        item: { contractId: 'C1', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.intFlag).toBe('N');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should default redTubeCount and purpleTubeCount to 0 when null', () => {
      const mockResponse = {
        item: { contractId: 'C1', redTubeCount: null, purpleTubeCount: null, effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.redTubeCount).toBe(0);
        expect(detail.purpleTubeCount).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should build address string from non-empty parts only', () => {
      const mockResponse = {
        item: {
          contractId: 'C1',
          address1: '100 First Ave',
          address2: '',
          address3: '',
          city: 'Boston',
          state: 'MA',
          zip: '02101',
          country: '',
          effDate: '2024-01-01T00:00:00Z'
        }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.address).toBe('100 First Ave, Boston, MA, 02101');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should show dash for address when all parts are empty', () => {
      const mockResponse = {
        item: { contractId: 'C1', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.address).toBe('-');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use ediInputInd raw value when not in map and not empty', () => {
      const mockResponse = {
        item: { contractId: 'C1', ediInputInd: 'Z', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.ediInput).toBe('Z');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });

    it('should use confirmTestFlag raw value when not in map and not empty', () => {
      const mockResponse = {
        item: { contractId: 'C1', confirmTestFlag: 'X', effDate: '2024-01-01T00:00:00Z' }
      };

      service.getContractDetail('C1').subscribe(detail => {
        expect(detail.confirmTest).toBe('X');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C1'));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // updateContractDetail
  // ============================================================================

  describe('updateContractDetail', () => {
    it('should PUT to update URL on success', () => {
      const payload = { company: 'Updated Corp' };
      const mockResponse: ReturnResult<any> = { success: true, message: 'Updated', statusCode: 200 };

      service.updateContractDetail('C001', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false with message', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Validation failed', statusCode: 400 };

      service.updateContractDetail('C001', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Validation failed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      req.flush(mockResponse);
    });

    it('should use default error message when response.message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.updateContractDetail('C001', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to update contract detail');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // createContract
  // ============================================================================

  describe('createContract', () => {
    it('should POST to create URL and return response.item', () => {
      const payload = { contractId: 'NEW1', company: 'New Corp' };
      const mockResponse: ReturnResult<any> = {
        success: true,
        item: { contractId: 'NEW1', company: 'New Corp' } as any,
        message: 'Created',
        statusCode: 201
      };

      service.createContract(payload).subscribe(result => {
        expect(result.contractId).toBe('NEW1');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should return response.data[0] when item is not present', () => {
      const payload = { contractId: 'NEW2' };
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'NEW2', company: 'Data Corp' }],
        message: 'Created',
        statusCode: 201
      };

      service.createContract(payload).subscribe(result => {
        expect(result.contractId).toBe('NEW2');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Duplicate', statusCode: 409 };

      service.createContract({}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Duplicate');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.createContract({}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to create contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getContractContacts
  // ============================================================================

  describe('getContractContacts', () => {
    it('should GET contacts and handle array response', () => {
      const mockResponse = [
        {
          contactId: 1,
          instId: 'INST1',
          contactType: 'C',
          contactTypeDesc: 'Contract',
          contactLastName: 'Smith',
          contactFirstName: 'John',
          contactTitle: 'Manager',
          phoneNumber: '555-0001',
          faxNumber: '555-0002',
          emailId: 'john@example.com',
          lastModifiedDate: '2024-03-15T00:00:00Z'
        }
      ];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts.length).toBe(1);
        expect(contacts[0].customerId).toBe('1');
        expect(contacts[0].instId).toBe('INST1');
        expect(contacts[0].contactType).toBe('C');
        expect(contacts[0].contactTypeDesc).toBe('Contract');
        expect(contacts[0].lastName).toBe('Smith');
        expect(contacts[0].firstName).toBe('John');
        expect(contacts[0].title).toBe('Manager');
        expect(contacts[0].phoneNumber).toBe('555-0001');
        expect(contacts[0].faxNumber).toBe('555-0002');
        expect(contacts[0].emailId).toBe('john@example.com');
        expect(contacts[0].lastModifiedDate).toBe(moment('2024-03-15T00:00:00Z').format('DD-MMM-YYYY'));
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle object response with data array', () => {
      const mockResponse = {
        data: [
          {
            contactId: 2,
            instId: 'INST2',
            contactType: 'I',
            lastName: 'Doe',
            firstName: 'Jane',
            title: 'Director',
            dayPhoneNo: '555-1001',
            faxNo: '555-1002',
            emailId: 'jane@example.com'
          }
        ]
      };

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts.length).toBe(1);
        expect(contacts[0].customerId).toBe('2');
        expect(contacts[0].lastName).toBe('Doe');
        expect(contacts[0].firstName).toBe('Jane');
        expect(contacts[0].phoneNumber).toBe('555-1001');
        expect(contacts[0].faxNumber).toBe('555-1002');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockResponse);
    });

    it('should use alternative field names for contact mapping', () => {
      const mockResponse = [
        {
          customerId: 'CID1',
          contactType: 'C',
          lastName: 'Alt',
          firstName: 'Name',
          title: 'VP',
          dayPhoneNo: '555-9999',
          faxNo: '555-8888'
        }
      ];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].customerId).toBe('CID1');
        expect(contacts[0].lastName).toBe('Alt');
        expect(contacts[0].firstName).toBe('Name');
        expect(contacts[0].title).toBe('VP');
        expect(contacts[0].phoneNumber).toBe('555-9999');
        expect(contacts[0].faxNumber).toBe('555-8888');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockResponse);
    });

    it('should use dash defaults for missing contact fields', () => {
      const mockResponse = [{ contactType: 'C' }];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].customerId).toBe('');
        expect(contacts[0].title).toBe('--');
        expect(contacts[0].phoneNumber).toBe('-');
        expect(contacts[0].faxNumber).toBe('-');
        expect(contacts[0].emailId).toBe('-');
        expect(contacts[0].lastModifiedDate).toBeNull();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockResponse);
    });

    it('should use contactType as contactTypeDesc fallback', () => {
      const mockResponse = [{ contactType: 'I' }];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].contactTypeDesc).toBe('I');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockResponse);
    });

    it('should return empty array when response has no data', () => {
      const mockResponse = { data: [] };

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts.length).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // createContractContact
  // ============================================================================

  describe('createContractContact', () => {
    it('should POST to create contact URL on success', () => {
      const payload = { contactType: 'C', lastName: 'New', firstName: 'Contact' };
      const mockResponse: ReturnResult<any> = { success: true, message: 'Created', statusCode: 201 };

      service.createContractContact('C001', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Contact exists', statusCode: 409 };

      service.createContractContact('C001', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Contact exists');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.createContractContact('C001', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to create contact');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // updateContractContact
  // ============================================================================

  describe('updateContractContact', () => {
    it('should PUT to update contact URL on success', () => {
      const payload = { lastName: 'Updated' };
      const mockResponse: ReturnResult<any> = { success: true, message: 'Updated', statusCode: 200 };

      service.updateContractContact('C001', '5', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 5));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Not found', statusCode: 404 };

      service.updateContractContact('C001', '5', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 5));
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.updateContractContact('C001', '10', {}).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to update contact');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 10));
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getActiveContracts
  // ============================================================================

  describe('getActiveContracts', () => {
    it('should return active contracts dropdown', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          { contractId: 'C001', company: 'Company A' },
          { contractId: 'C002', company: 'Company B' }
        ],
        message: 'Success',
        statusCode: 200
      };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts.length).toBe(2);
        expect(contracts[0].contractId).toBe('C001');
        expect(contracts[0].description).toBe('Company A');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include contractId param in URL when provided', () => {
      const mockResponse: ReturnResult<any> = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.getActiveContracts(true, 'C001').subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const expectedUrl = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(true) +
        '&contractType=CU&contractId=' + encodeURIComponent('C001');
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include company param in URL when provided', () => {
      const mockResponse: ReturnResult<any> = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.getActiveContracts(false, null, 'ACME Corp').subscribe();

      const expectedUrl = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) +
        '&contractType=CU&company=' + encodeURIComponent('ACME Corp');
      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should include both contractId and company params when both provided', () => {
      const mockResponse: ReturnResult<any> = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.getActiveContracts(false, 'C001', 'ACME').subscribe();

      const expectedUrl = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) +
        '&contractType=CU&contractId=' + encodeURIComponent('C001') +
        '&company=' + encodeURIComponent('ACME');
      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should map contractType from response', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'C1', company: 'Co', contractType: 'HP' }],
        message: 'OK',
        statusCode: 200
      };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts[0].contractType).toBe('HP');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should default contractType to empty string when not in response', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'C1', company: 'Co' }],
        message: 'OK',
        statusCode: 200
      };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts[0].contractType).toBe('');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Auth error', statusCode: 401 };

      service.getActiveContracts().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Auth error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.getActiveContracts().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve active contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should handle null data by returning empty array', () => {
      const mockResponse = { success: true, data: null, message: 'OK', statusCode: 200 };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=CU');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getCompanies
  // ============================================================================

  describe('getCompanies', () => {
    it('should return companies dropdown', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          { company: 'Company A' },
          { company: 'Company B' }
        ],
        message: 'OK',
        statusCode: 200
      };

      service.getCompanies().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('Company A');
        expect(options[0].description).toBe('Company A');
        expect(options[1].code).toBe('Company B');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=CU');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include contractId and company params when provided', () => {
      const mockResponse: ReturnResult<any> = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.getCompanies(true, 'C001', 'ACME').subscribe();

      const expectedUrl = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(true) +
        '&contractType=CU&contractId=' + encodeURIComponent('C001') +
        '&company=' + encodeURIComponent('ACME');
      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Server error', statusCode: 500 };

      service.getCompanies().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Server error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.getCompanies().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve companies');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should handle null data', () => {
      const mockResponse = { success: true, data: null, message: 'OK', statusCode: 200 };

      service.getCompanies().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getCustomerTypes
  // ============================================================================

  describe('getCustomerTypes', () => {
    it('should return customer types dropdown', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          { code: 'CU', description: 'Customer' },
          { code: 'HP', description: 'Hospital Patient' }
        ],
        message: 'OK',
        statusCode: 200
      };

      service.getCustomerTypes().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('CU');
        expect(options[0].description).toBe('Customer');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=CU');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include contractId and company params when provided', () => {
      const mockResponse: ReturnResult<any> = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.getCustomerTypes(true, 'C001', 'ACME').subscribe();

      const expectedUrl = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(true) +
        '&contractType=CU&contractId=' + encodeURIComponent('C001') +
        '&company=' + encodeURIComponent('ACME');
      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Error fetching types', statusCode: 500 };

      service.getCustomerTypes().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Error fetching types');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.getCustomerTypes().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve contract types');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });

    it('should handle null data', () => {
      const mockResponse = { success: true, data: null, message: 'OK', statusCode: 200 };

      service.getCustomerTypes().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=CU');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getStateOptions
  // ============================================================================

  describe('getStateOptions', () => {
    it('should return state options using code and description fields', () => {
      const mockResponse = {
        data: [
          { code: 'IL', description: 'Illinois' },
          { code: 'CA', description: 'California' }
        ]
      };

      service.getStateOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('IL');
        expect(options[0].description).toBe('Illinois');
        expect(options[1].code).toBe('CA');
        expect(options[1].description).toBe('California');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to stateCode when code is not present', () => {
      const mockResponse = {
        data: [
          { stateCode: 'NY', description: 'New York' }
        ]
      };

      service.getStateOptions().subscribe(options => {
        expect(options[0].code).toBe('NY');
        expect(options[0].description).toBe('New York');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush(mockResponse);
    });

    it('should fall back to code for description when description is not present', () => {
      const mockResponse = {
        data: [
          { code: 'TX' }
        ]
      };

      service.getStateOptions().subscribe(options => {
        expect(options[0].code).toBe('TX');
        expect(options[0].description).toBe('TX');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush(mockResponse);
    });

    it('should handle null data by returning empty array', () => {
      const mockResponse = { data: null };

      service.getStateOptions().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush(mockResponse);
    });

    it('should handle empty response (no data property)', () => {
      service.getStateOptions().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush({});
    });
  });

  // ============================================================================
  // Static dropdown methods
  // ============================================================================

  describe('getContactTypes', () => {
    it('should return static contact type options', () => {
      service.getContactTypes().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'C', description: 'Contract' });
        expect(options[1]).toEqual({ code: 'I', description: 'Institution' });
      });
    });
  });

  describe('getStopLabelFlagOptions', () => {
    it('should return static stop label flag options', () => {
      service.getStopLabelFlagOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('Y');
        expect(options[0].description).toBe('Yes - Report results');
        expect(options[1].code).toBe('N');
        expect(options[1].description).toBe('No - Do not report results');
      });
    });
  });

  describe('getShowTerminatedOptions', () => {
    it('should return static show terminated options', () => {
      service.getShowTerminatedOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'No', description: 'No' });
        expect(options[1]).toEqual({ code: 'Yes', description: 'Yes' });
      });
    });
  });

  describe('getUnitSchemeOptions', () => {
    it('should return static unit scheme options', () => {
      service.getUnitSchemeOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'N', description: 'N - Codabar numeric' });
        expect(options[1]).toEqual({ code: 'I', description: 'I - ISBT 128' });
      });
    });
  });

  describe('getEdiInputOptions', () => {
    it('should return static EDI input options', () => {
      service.getEdiInputOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'Y', description: 'Y - Yes' });
        expect(options[1]).toEqual({ code: '', description: 'No' });
      });
    });
  });

  describe('getResultsIndOptions', () => {
    it('should return static results indicator options', () => {
      service.getResultsIndOptions().subscribe(options => {
        expect(options.length).toBe(3);
        expect(options[0]).toEqual({ code: 'R', description: 'R - Reports' });
        expect(options[1]).toEqual({ code: 'E', description: 'E - Electronic Mail' });
        expect(options[2]).toEqual({ code: 'B', description: 'B - Both' });
      });
    });
  });

  describe('getConfirmTestOptions', () => {
    it('should return static confirm test options', () => {
      service.getConfirmTestOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'Y', description: 'Y - Yes' });
        expect(options[1]).toEqual({ code: '', description: 'No' });
      });
    });
  });

  // ============================================================================
  // LEGACY METHODS
  // ============================================================================

  describe('searchAdHocTestingContracts', () => {
    it('should return ad hoc testing contracts with pagination', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'T001',
            testDesc: 'Test Description',
            stopLabelFlag: 'Y',
            effDate: '2024-01-01T00:00:00Z',
            termDate: null,
            lastModifiedDate: '2024-01-01T00:00:00Z',
            programId: 'P001'
          }
        ],
        total: 1,
        message: 'Success',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 25, 0, {}).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.data[0].testId).toBe('T001');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send empty body when filters not provided', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [],
        total: 0,
        message: 'OK',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 10, 0).subscribe(response => {
        expect(response.data).toEqual([]);
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 10, 0));
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: false,
        data: [],
        total: 0,
        message: 'Search failed',
        statusCode: 500
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Search failed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: false,
        message: '',
        statusCode: 500
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve ad hoc testing contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should handle null data by returning empty array', () => {
      const mockResponse = { success: true, data: null, total: 0, message: 'OK', statusCode: 200 };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should use testId as testDesc fallback when testDesc is null', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'FALLBACK_ID',
            testDesc: null,
            stopLabelFlag: 'N',
            effDate: '2024-01-01T00:00:00Z',
            termDate: null,
            lastModifiedDate: '2024-01-01T00:00:00Z',
            programId: null
          }
        ],
        total: 1,
        message: 'OK',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(response => {
        expect(response.data[0].testDesc).toBe('FALLBACK_ID');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should use effDate as lastModifiedDate fallback when lastModifiedDate is null', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'T1',
            testDesc: 'Desc',
            stopLabelFlag: 'Y',
            effDate: '2024-06-15T00:00:00Z',
            termDate: null,
            lastModifiedDate: null,
            programId: null
          }
        ],
        total: 1,
        message: 'OK',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(response => {
        expect(response.data[0].lastModifiedDate).toBe(moment('2024-06-15T00:00:00Z').format('DD-MMM-YYYY'));
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should handle null total by defaulting to 0', () => {
      const mockResponse = { success: true, data: [], message: 'OK', statusCode: 200 };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(response => {
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });
  });

  describe('getAdHocTestingContractById', () => {
    it('should return a single ad hoc testing contract', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'T001',
            testDesc: 'Test Description',
            stopLabelFlag: 'Y',
            effDate: '2024-01-01T00:00:00Z',
            termDate: null,
            lastModifiedDate: '2024-01-01T00:00:00Z',
            programId: 'P001'
          }
        ],
        message: 'Success',
        statusCode: 200
      };

      service.getAdHocTestingContractById('C001', 'T001').subscribe(contract => {
        expect(contract.testId).toBe('T001');
        expect(contract.contractId).toBe('C001');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: false,
        message: 'Not found',
        statusCode: 404
      };

      service.getAdHocTestingContractById('C001', 'T999').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T999'));
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: false,
        message: '',
        statusCode: 500
      };

      service.getAdHocTestingContractById('C001', 'T999').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T999'));
      req.flush(mockResponse);
    });

    it('should throw when data array is empty', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [],
        message: 'OK',
        statusCode: 200
      };

      service.getAdHocTestingContractById('C001', 'T999').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Ad hoc testing contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T999'));
      req.flush(mockResponse);
    });

    it('should throw when data is undefined', () => {
      const mockResponse = { success: true, message: 'OK', statusCode: 200 };

      service.getAdHocTestingContractById('C001', 'T999').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Ad hoc testing contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T999'));
      req.flush(mockResponse);
    });
  });

  describe('getActiveTests', () => {
    it('should return active tests dropdown', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          { testId: 'T001', testDesc: 'Test 1', testGroup: 'Group A' },
          { testId: 'T002', testDesc: 'Test 2', testGroup: 'Group B' }
        ],
        message: 'Success',
        statusCode: 200
      };

      service.getActiveTests().subscribe(tests => {
        expect(tests.length).toBe(2);
        expect(tests[0].testId).toBe('T001');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: 'Error', statusCode: 500 };

      service.getActiveTests().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.getActiveTests().subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to retrieve active tests');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush(mockResponse);
    });

    it('should handle null data by returning empty array', () => {
      const mockResponse = { success: true, data: null, message: 'OK', statusCode: 200 };

      service.getActiveTests().subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush(mockResponse);
    });
  });

  describe('createAdHocTestingContract', () => {
    it('should create a new ad hoc testing contract', () => {
      const payload: CreateAdHocTestingContractRequest = {
        contractId: 'C001',
        testId: 'T001',
        stopLabelFlag: 'Y',
        effDate: '2024-01-01',
        termDate: undefined
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Created successfully',
        statusCode: 201
      };

      service.createAdHocTestingContract(payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const payload: CreateAdHocTestingContractRequest = {
        contractId: 'C001',
        testId: 'T001',
        effDate: '2024-01-01'
      };
      const mockResponse: ReturnResult<any> = { success: false, message: 'Duplicate entry', statusCode: 409 };

      service.createAdHocTestingContract(payload).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Duplicate entry');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE);
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const payload: CreateAdHocTestingContractRequest = {
        contractId: 'C001',
        testId: 'T001',
        effDate: '2024-01-01'
      };
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.createAdHocTestingContract(payload).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to create ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE);
      req.flush(mockResponse);
    });
  });

  describe('updateAdHocTestingContract', () => {
    it('should update an existing ad hoc testing contract', () => {
      const payload: UpdateAdHocTestingContractRequest = {
        stopLabelFlag: 'N',
        effDate: '2024-01-01',
        termDate: '2024-12-31'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200
      };

      service.updateAdHocTestingContract('C001', 'T001', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE('C001', 'T001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const payload: UpdateAdHocTestingContractRequest = { effDate: '2024-01-01' };
      const mockResponse: ReturnResult<any> = { success: false, message: 'Validation error', statusCode: 400 };

      service.updateAdHocTestingContract('C001', 'T001', payload).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Validation error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE('C001', 'T001'));
      req.flush(mockResponse);
    });

    it('should use default error message when message is empty', () => {
      const payload: UpdateAdHocTestingContractRequest = { effDate: '2024-01-01' };
      const mockResponse: ReturnResult<any> = { success: false, message: '', statusCode: 500 };

      service.updateAdHocTestingContract('C001', 'T001', payload).subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to update ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE('C001', 'T001'));
      req.flush(mockResponse);
    });
  });

  describe('deleteAdHocTestingContract', () => {
    it('should successfully delete an ad hoc testing contract', () => {
      const mockResponse: ReturnResult<number> = {
        success: true,
        item: 1,
        message: 'Deleted',
        statusCode: 200
      };

      service.deleteAdHocTestingContract('C001', 'T001').subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when record not found', () => {
      const mockResponse: ReturnResult<number> = {
        success: true,
        item: 0,
        message: 'No records affected',
        statusCode: 200
      };

      service.deleteAdHocTestingContract('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toContain('Record not found or already deleted');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      req.flush(mockResponse);
    });

    it('should throw when response.success is false', () => {
      const mockResponse: ReturnResult<number> = {
        success: false,
        message: 'Delete failed',
        statusCode: 500
      };

      service.deleteAdHocTestingContract('C001', 'T001').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Delete failed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      req.flush(mockResponse);
    });

    it('should use default error message when response.success is false with empty message', () => {
      const mockResponse: ReturnResult<number> = {
        success: false,
        message: '',
        statusCode: 500
      };

      service.deleteAdHocTestingContract('C001', 'T001').subscribe(
        () => fail('should have thrown'),
        error => {
          expect(error.message).toBe('Failed to delete ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      req.flush(mockResponse);
    });
  });
});
