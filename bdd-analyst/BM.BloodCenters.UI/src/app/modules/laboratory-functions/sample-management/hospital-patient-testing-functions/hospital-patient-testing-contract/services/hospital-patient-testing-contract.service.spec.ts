import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HospitalPatientTestingContractService } from './hospital-patient-testing-contract.service';
import { API } from '@core/constants/api.constants';
import moment from 'moment';
import {
  AdHocTestingContract,
  CreateAdHocTestingContractRequest,
  UpdateAdHocTestingContractRequest,
  ReturnResult,
  ContractSearchCriteria,
  ContractFilterModel
} from '../models/hospital-patient-testing-contract.model';

describe('HospitalPatientTestingContractService', () => {
  let service: HospitalPatientTestingContractService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalPatientTestingContractService]
    });

    service = TestBed.inject(HospitalPatientTestingContractService);
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

    it('should post with base criteria and return mapped table models', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            contractType: 'TS',
            chapterId: 'CH01',
            company: 'Test Company',
            barCodeProtocol: 'I',
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
        expect(result.data[0].customerType).toBe('TS');
        expect(result.data[0].chapterId).toBe('CH01');
        expect(result.data[0].description).toBe('Test Company');
        expect(result.data[0].unitScheme).toBe('I');
        expect(result.data[0].effDate).toBe('15-Jan-2024');
        expect(result.data[0].termDate).toBeNull();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.contractType).toBe('TS');
      expect(req.request.body.showTerminated).toBe(false);
      expect(req.request.body.sortColumn).toBe('ContractId');
      expect(req.request.body.sortOrder).toBe('ASC');
      req.flush(mockResponse);
    });

    it('should include contractId and company in body when criteria specifies them', () => {
      const criteria: ContractSearchCriteria = {
        showTerminated: true,
        contractId: 'C001',
        company: 'Acme',
        searchKeyword: 'test',
        sortColumn: 'Company',
        sortOrder: 'DESC'
      };

      service.searchContracts(10, 5, criteria).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(10, 5));
      expect(req.request.body.showTerminated).toBe(true);
      expect(req.request.body.contractId).toBe('C001');
      expect(req.request.body.company).toBe('Acme');
      expect(req.request.body.searchKeyword).toBe('test');
      expect(req.request.body.sortColumn).toBe('Company');
      expect(req.request.body.sortOrder).toBe('DESC');
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should apply effDate filter with After period', () => {
      const filters: ContractFilterModel = {
        contractId: 'F001',
        contractType: 'TS',
        effDatePeriod: 'After',
        effDate: moment('2024-06-01'),
        termDatePeriod: 'Before',
        termDate: null
      };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.contractId).toBe('F001');
      expect(req.request.body.contractType).toBe('TS');
      expect(req.request.body.effDateFrom).toBe('2024-06-01');
      expect(req.request.body.effDateTo).toBeUndefined();
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should apply effDate filter with Before period', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'Before',
        effDate: moment('2024-06-01'),
        termDatePeriod: 'Before',
        termDate: null
      };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.effDateTo).toBe('2024-06-01');
      expect(req.request.body.effDateFrom).toBeUndefined();
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should apply termDate filter with After period', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'Before',
        effDate: null,
        termDatePeriod: 'After',
        termDate: moment('2025-01-01')
      };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.termDateFrom).toBe('2025-01-01');
      expect(req.request.body.termDateTo).toBeUndefined();
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should apply termDate filter with Before period', () => {
      const filters: ContractFilterModel = {
        contractId: null,
        contractType: null,
        effDatePeriod: 'Before',
        effDate: null,
        termDatePeriod: 'Before',
        termDate: moment('2025-01-01')
      };

      service.searchContracts(25, 0, baseCriteria, filters).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.termDateTo).toBe('2025-01-01');
      expect(req.request.body.termDateFrom).toBeUndefined();
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should throw error when response.success is false', () => {
      service.searchContracts(25, 0, baseCriteria).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Search failed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush({ success: false, message: 'Search failed', statusCode: 500 });
    });

    it('should throw default error message when response.success is false and no message', () => {
      service.searchContracts(25, 0, baseCriteria).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should handle null data in response', () => {
      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush({ success: true, data: null, total: null, message: '', statusCode: 200 });
    });

    it('should map termDate when present', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            contractType: '',
            chapterId: '',
            company: '',
            barCodeProtocol: '',
            effDate: '2024-01-01T00:00:00Z',
            termDate: '2024-12-31T00:00:00Z'
          }
        ],
        total: 1,
        message: '',
        statusCode: 200
      };

      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data[0].termDate).toBe('31-Dec-2024');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush(mockResponse);
    });

    it('should use default sortColumn and sortOrder when criteria omits them', () => {
      const criteria: ContractSearchCriteria = {
        showTerminated: false,
        contractId: null,
        company: null
      };

      service.searchContracts(25, 0, criteria).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.sortColumn).toBe('ContractId');
      expect(req.request.body.sortOrder).toBe('ASC');
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should default showTerminated to false when criteria.showTerminated is falsy', () => {
      const criteria: ContractSearchCriteria = {
        showTerminated: undefined as any,
        contractId: null,
        company: null
      };

      service.searchContracts(25, 0, criteria).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      expect(req.request.body.showTerminated).toBe(false);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should map item with missing fields to defaults', () => {
      service.searchContracts(25, 0, baseCriteria).subscribe(result => {
        expect(result.data[0].contractId).toBe('');
        expect(result.data[0].customerType).toBe('');
        expect(result.data[0].chapterId).toBe('');
        expect(result.data[0].description).toBe('');
        expect(result.data[0].unitScheme).toBe('-');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(25, 0));
      req.flush({ success: true, data: [{}], total: 1, message: '', statusCode: 200 });
    });
  });

  // ============================================================================
  // getContractDetail
  // ============================================================================

  describe('getContractDetail', () => {
    it('should return mapped contract detail', () => {
      const mockItem = {
        contractId: 'C001',
        company: 'Test Company',
        addressId: 5,
        address1: '123 Main St',
        address2: 'Suite 100',
        address3: '',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        country: 'US',
        intFlag: 'N',
        phoneNo: '555-1234',
        faxNo: '555-5678',
        intPhone: '011-555-1234',
        telexNo: '011-555-5678',
        chapterId: 'CH01',
        chapterName: 'Southwest',
        taxIdForm: 'W9',
        barCodeProtocol: 'I',
        centerId: 'CTR01',
        unitIdPattern: 'PATTERN1',
        ediInputInd: 'Y',
        resultOutputInd: 'R',
        confirmTestFlag: 'Y',
        redTubeCount: 3,
        purpleTubeCount: 2,
        effDate: '2024-01-01T00:00:00Z',
        termDate: '2025-12-31T00:00:00Z',
        lastModifiedDate: '2024-06-15T00:00:00Z'
      };

      service.getContractDetail('C001').subscribe(detail => {
        expect(detail.contractId).toBe('C001');
        expect(detail.company).toBe('Test Company');
        expect(detail.addressId).toBe(5);
        expect(detail.addr1).toBe('123 Main St');
        expect(detail.addr2).toBe('Suite 100');
        expect(detail.addr3).toBe('');
        expect(detail.city).toBe('Dallas');
        expect(detail.stateCode).toBe('TX');
        expect(detail.zip).toBe('75001');
        expect(detail.country).toBe('US');
        expect(detail.address).toContain('123 Main St');
        expect(detail.address).toContain('Dallas');
        expect(detail.intFlag).toBe('N');
        expect(detail.phoneNumber).toBe('555-1234');
        expect(detail.fax).toBe('555-5678');
        expect(detail.internationalPhoneNumber).toBe('011-555-1234');
        expect(detail.internationalFax).toBe('011-555-5678');
        expect(detail.chapterId).toBe('CH01');
        expect(detail.chapterDescription).toBe('Southwest');
        expect(detail.taxIdForm).toBe('W9');
        expect(detail.unitScheme).toBe('I');
        expect(detail.centerId).toBe('CTR01');
        expect(detail.unitIdPattern).toBe('PATTERN1');
        expect(detail.ediInput).toBe('Y');
        expect(detail.resultsInd).toBe('R');
        expect(detail.confirmTest).toBe('Y');
        expect(detail.redTubeCount).toBe(3);
        expect(detail.purpleTubeCount).toBe(2);
        expect(detail.effDate).toBe('01-Jan-2024');
        expect(detail.termDate).toBe('31-Dec-2025');
        expect(detail.lastModifiedDate).toBe('15-Jun-2024');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockItem);
    });

    it('should throw error when item is null', () => {
      service.getContractDetail('C001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C001'));
      req.flush(null);
    });

    it('should use alternate field names (addr1, stateCode, name, phoneNumber, faxNumber, intPhoneNumber, telexNumber)', () => {
      const mockItem = {
        contractId: 'C002',
        name: 'Alt Name Company',
        addressId: 0,
        addr1: 'Alt Addr 1',
        addr2: 'Alt Addr 2',
        addr3: 'Alt Addr 3',
        city: 'Houston',
        stateCode: 'TX',
        zip: '77001',
        country: 'US',
        intFlag: 'Y',
        phoneNumber: '555-0000',
        faxNumber: '555-1111',
        intPhoneNumber: '011-555-2222',
        telexNumber: '011-555-3333',
        chapterId: 'CH02',
        chapterName: 'South',
        taxIdForm: 'W8',
        barCodeProtocol: 'N',
        centerId: 'CTR02',
        unitIdPattern: 'PAT2',
        ediInputInd: '',
        resultOutputInd: 'E',
        confirmTestFlag: '',
        redTubeCount: 0,
        purpleTubeCount: 0,
        effDate: '2024-03-01T00:00:00Z',
        termDate: null,
        lastModifiedDate: null
      };

      service.getContractDetail('C002').subscribe(detail => {
        expect(detail.company).toBe('Alt Name Company');
        expect(detail.addr1).toBe('Alt Addr 1');
        expect(detail.stateCode).toBe('TX');
        expect(detail.phoneNumber).toBe('555-0000');
        expect(detail.fax).toBe('555-1111');
        expect(detail.internationalPhoneNumber).toBe('011-555-2222');
        expect(detail.internationalFax).toBe('011-555-3333');
        expect(detail.termDate).toBeNull();
        expect(detail.lastModifiedDate).toBeNull();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C002'));
      req.flush(mockItem);
    });

    it('should default all fields when item has empty/missing properties', () => {
      service.getContractDetail('C003').subscribe(detail => {
        expect(detail.contractId).toBe('');
        expect(detail.company).toBe('-');
        expect(detail.addressId).toBe(0);
        expect(detail.address).toBe('-');
        expect(detail.addr1).toBe('');
        expect(detail.intFlag).toBe('N');
        expect(detail.phoneNumber).toBe('-');
        expect(detail.fax).toBe('-');
        expect(detail.internationalPhoneNumber).toBe('-');
        expect(detail.internationalFax).toBe('-');
        expect(detail.chapterId).toBe('-');
        expect(detail.chapterDescription).toBe('-');
        expect(detail.taxIdForm).toBe('-');
        expect(detail.unitScheme).toBe('-');
        expect(detail.centerId).toBe('-');
        expect(detail.unitIdPattern).toBe('-');
        expect(detail.ediInput).toBe('');
        expect(detail.resultsInd).toBe('');
        expect(detail.confirmTest).toBe('');
        expect(detail.redTubeCount).toBe(0);
        expect(detail.purpleTubeCount).toBe(0);
        expect(detail.effDate).toBe('-');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID('C003'));
      req.flush({});
    });
  });

  // ============================================================================
  // updateContractDetail
  // ============================================================================

  describe('updateContractDetail', () => {
    it('should send PUT and succeed', () => {
      const payload = { company: 'Updated Co' };

      service.updateContractDetail('C001', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, message: 'OK', statusCode: 200 });
    });

    it('should throw error when response.success is false with message', () => {
      service.updateContractDetail('C001', {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Update not allowed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      req.flush({ success: false, message: 'Update not allowed', statusCode: 400 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.updateContractDetail('C001', {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to update contract detail');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE('C001'));
      req.flush({ success: false, message: '', statusCode: 500 });
    });
  });

  // ============================================================================
  // createContract
  // ============================================================================

  describe('createContract', () => {
    it('should post and return response.item on success', () => {
      const payload = { contractId: 'NEW1', company: 'New Co' };
      const mockItem = { contractId: 'NEW1', company: 'New Co' };

      service.createContract(payload).subscribe(result => {
        expect(result).toEqual(mockItem);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, item: mockItem, message: 'Created', statusCode: 201 });
    });

    it('should fallback to response.data[0] when item is not present', () => {
      const dataItem = { contractId: 'NEW2' };

      service.createContract({}).subscribe(result => {
        expect(result).toEqual(dataItem);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush({ success: true, data: [dataItem], message: '', statusCode: 201 });
    });

    it('should return undefined when neither item nor data is present', () => {
      service.createContract({}).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush({ success: true, message: '', statusCode: 201 });
    });

    it('should throw error when response.success is false with message', () => {
      service.createContract({}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Duplicate contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush({ success: false, message: 'Duplicate contract', statusCode: 409 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.createContract({}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to create contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE);
      req.flush({ success: false, message: '', statusCode: 500 });
    });
  });

  // ============================================================================
  // getContractContacts
  // ============================================================================

  describe('getContractContacts', () => {
    it('should return mapped contract contacts', () => {
      const mockData = [
        {
          contactId: 1,
          contractId: 'C001',
          contactType: 'C',
          contactLastName: 'Smith',
          contactFirstName: 'John',
          contactTitle: 'Manager',
          phoneNumber: '555-1234',
          faxNumber: '555-5678',
          emailId: 'john@test.com'
        },
        {
          contactId: 2,
          contractId: 'C001',
          contactType: 'I',
          contactLastName: 'Doe',
          contactFirstName: 'Jane',
          contactTitle: '',
          phoneNumber: '',
          faxNumber: '',
          emailId: ''
        }
      ];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts.length).toBe(2);
        expect(contacts[0].contactId).toBe(1);
        expect(contacts[0].customerId).toBe('C001');
        expect(contacts[0].instId).toBe('');
        expect(contacts[0].contactType).toBe('C');
        expect(contacts[0].contactTypeDesc).toBe('Contract');
        expect(contacts[0].lastName).toBe('Smith');
        expect(contacts[0].firstName).toBe('John');
        expect(contacts[0].title).toBe('Manager');
        expect(contacts[0].phoneNumber).toBe('555-1234');
        expect(contacts[0].faxNumber).toBe('555-5678');
        expect(contacts[0].emailId).toBe('john@test.com');
        expect(contacts[0].lastModifiedDate).toBeNull();

        expect(contacts[1].contactTypeDesc).toBe('Institution');
        expect(contacts[1].title).toBe('--');
        expect(contacts[1].phoneNumber).toBe('-');
        expect(contacts[1].faxNumber).toBe('-');
        expect(contacts[1].emailId).toBe('-');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle null data response gracefully', () => {
      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(null);
    });

    it('should handle contact with unknown contactType', () => {
      const mockData = [
        {
          contactId: 3,
          contractId: 'C001',
          contactType: 'X',
          contactLastName: '',
          contactFirstName: '',
          contactTitle: '',
          phoneNumber: '',
          faxNumber: '',
          emailId: ''
        }
      ];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].contactTypeDesc).toBe('X');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockData);
    });

    it('should handle contact with empty contactType', () => {
      const mockData = [
        {
          contactId: 4,
          contractId: 'C001',
          contactType: '',
          contactLastName: '',
          contactFirstName: '',
          contactTitle: '',
          phoneNumber: '',
          faxNumber: '',
          emailId: ''
        }
      ];

      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].contactTypeDesc).toBe('');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush(mockData);
    });

    it('should handle missing fields with defaults', () => {
      service.getContractContacts('C001').subscribe(contacts => {
        expect(contacts[0].contactId).toBe(0);
        expect(contacts[0].customerId).toBe('');
        expect(contacts[0].contactType).toBe('');
        expect(contacts[0].lastName).toBe('');
        expect(contacts[0].firstName).toBe('');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS('C001'));
      req.flush([{}]);
    });
  });

  // ============================================================================
  // createContact
  // ============================================================================

  describe('createContact', () => {
    it('should send POST to create contact', () => {
      const payload = { contactType: 'C', contactLastName: 'Test' };

      service.createContact('C001', payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, message: 'Created', statusCode: 201 });
    });

    it('should throw error when response.success is false with message', () => {
      service.createContact('C001', {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Contact limit reached');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      req.flush({ success: false, message: 'Contact limit reached', statusCode: 400 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.createContact('C001', {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to create contact');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT('C001'));
      req.flush({ success: false, message: '', statusCode: 500 });
    });
  });

  // ============================================================================
  // updateContact
  // ============================================================================

  describe('updateContact', () => {
    it('should send PUT to update contact', () => {
      const payload = { contactLastName: 'Updated' };

      service.updateContact('C001', 5, payload).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 5));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, message: 'OK', statusCode: 200 });
    });

    it('should throw error when response.success is false with message', () => {
      service.updateContact('C001', 5, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Contact not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 5));
      req.flush({ success: false, message: 'Contact not found', statusCode: 404 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.updateContact('C001', 5, {}).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to update contact');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT('C001', 5));
      req.flush({ success: false, message: '', statusCode: 500 });
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

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass showTerminated=true parameter', () => {
      service.getActiveContracts(true).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(true) + '&contractType=TS');
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [], message: '', statusCode: 200 });
    });

    it('should include contractType from response', () => {
      const mockResponse: ReturnResult<any> = {
        success: true,
        data: [{ contractId: 'C001', company: 'Co', contractType: 'TS' }],
        message: '',
        statusCode: 200
      };

      service.getActiveContracts().subscribe(contracts => {
        expect(contracts[0].contractType).toBe('TS');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      req.flush(mockResponse);
    });

    it('should default contractType to empty string when missing', () => {
      service.getActiveContracts().subscribe(contracts => {
        expect(contracts[0].contractType).toBe('');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      req.flush({ success: true, data: [{ contractId: 'C001', company: 'Co' }], message: '', statusCode: 200 });
    });

    it('should throw error when response.success is false', () => {
      service.getActiveContracts().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Server error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      req.flush({ success: false, message: 'Server error', statusCode: 500 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.getActiveContracts().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve active contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should handle null data in response', () => {
      service.getActiveContracts().subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(false) + '&contractType=TS');
      req.flush({ success: true, data: null, message: '', statusCode: 200 });
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
        message: '',
        statusCode: 200
      };

      service.getCompanies().subscribe(companies => {
        expect(companies.length).toBe(2);
        expect(companies[0].code).toBe('Company A');
        expect(companies[0].description).toBe('Company A');
        expect(companies[1].code).toBe('Company B');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=TS');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass showTerminated=true parameter', () => {
      service.getCompanies(true).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(true) + '&contractType=TS');
      req.flush({ success: true, data: [], message: '', statusCode: 200 });
    });

    it('should throw error when response.success is false', () => {
      service.getCompanies().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('DB error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=TS');
      req.flush({ success: false, message: 'DB error', statusCode: 500 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.getCompanies().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve companies');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=TS');
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should handle null data', () => {
      service.getCompanies().subscribe(companies => {
        expect(companies).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(false) + '&contractType=TS');
      req.flush({ success: true, data: null, message: '', statusCode: 200 });
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
          { code: 'TS', description: 'Testing Services' },
          { code: 'RS', description: 'Reference Services' }
        ],
        message: '',
        statusCode: 200
      };

      service.getCustomerTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('TS');
        expect(types[0].description).toBe('Testing Services');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=TS');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass showTerminated=true parameter', () => {
      service.getCustomerTypes(true).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(true) + '&contractType=TS');
      req.flush({ success: true, data: [], message: '', statusCode: 200 });
    });

    it('should throw error when response.success is false', () => {
      service.getCustomerTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Permission denied');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=TS');
      req.flush({ success: false, message: 'Permission denied', statusCode: 403 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.getCustomerTypes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve contract types');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=TS');
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should handle null data', () => {
      service.getCustomerTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=TS');
      req.flush({ success: true, data: null, message: '', statusCode: 200 });
    });
  });

  // ============================================================================
  // getStateOptions
  // ============================================================================

  describe('getStateOptions', () => {
    it('should return state options using code and description', () => {
      const mockResponse = {
        data: [
          { code: 'TX', description: 'Texas' },
          { code: 'CA', description: 'California' }
        ]
      };

      service.getStateOptions().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0].code).toBe('TX');
        expect(options[0].description).toBe('Texas');
        expect(options[1].code).toBe('CA');
        expect(options[1].description).toBe('California');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fallback to stateCode when code is not present', () => {
      const mockResponse = {
        data: [{ stateCode: 'NY' }]
      };

      service.getStateOptions().subscribe(options => {
        expect(options[0].code).toBe('NY');
        expect(options[0].description).toBe('NY');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush(mockResponse);
    });

    it('should handle null response.data', () => {
      service.getStateOptions().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush({ data: null });
    });

    it('should handle null response', () => {
      service.getStateOptions().subscribe(options => {
        expect(options).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES);
      req.flush({});
    });
  });

  // ============================================================================
  // STATIC DROPDOWN METHODS
  // ============================================================================

  describe('getContactTypes', () => {
    it('should return static contact type options', () => {
      service.getContactTypes().subscribe(options => {
        expect(options.length).toBe(2);
        expect(options[0]).toEqual({ code: 'C', description: 'C - Contract' });
        expect(options[1]).toEqual({ code: 'I', description: 'I - Institution' });
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

  describe('getContractTypeOptions', () => {
    it('should delegate to getCustomerTypes', () => {
      service.getContractTypeOptions().subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(false) + '&contractType=TS');
      req.flush({ success: true, data: [{ code: 'TS', description: 'Testing' }], message: '', statusCode: 200 });
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

    it('should throw error when response.success is false', () => {
      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Search error');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush({ success: false, message: 'Search error', statusCode: 500 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve ad hoc testing contracts');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should send empty object when filters not provided', () => {
      service.searchAdHocTestingContracts('C001', 25, 0).subscribe();

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200 });
    });

    it('should handle null data in response', () => {
      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush({ success: true, data: null, total: null, message: '', statusCode: 200 });
    });

    it('should map contract with null testDesc to testId', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'T001',
            testDesc: null,
            stopLabelFlag: 'Y',
            effDate: '2024-01-01T00:00:00Z',
            termDate: '2024-12-31T00:00:00Z',
            lastModifiedDate: null,
            programId: null
          }
        ],
        total: 1,
        message: '',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(result => {
        expect(result.data[0].testDesc).toBe('T001');
        expect(result.data[0].termDate).toBe('31-Dec-2024');
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH('C001', 25, 0));
      req.flush(mockResponse);
    });

    it('should use effDate as lastModifiedDate when lastModifiedDate is null', () => {
      const mockResponse: ReturnResult<AdHocTestingContract> = {
        success: true,
        data: [
          {
            contractId: 'C001',
            chapterId: 'CH01',
            testId: 'T001',
            testDesc: 'Test',
            stopLabelFlag: 'N',
            effDate: '2024-06-15T00:00:00Z',
            termDate: null,
            lastModifiedDate: null,
            programId: null
          }
        ],
        total: 1,
        message: '',
        statusCode: 200
      };

      service.searchAdHocTestingContracts('C001', 25, 0).subscribe(result => {
        expect(result.data[0].lastModifiedDate).toBe('15-Jun-2024');
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

    it('should throw error when response.success is false', () => {
      service.getAdHocTestingContractById('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T001'));
      req.flush({ success: false, message: 'Not found', statusCode: 404 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.getAdHocTestingContractById('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T001'));
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should throw error when data is empty array', () => {
      service.getAdHocTestingContractById('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Ad hoc testing contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T001'));
      req.flush({ success: true, data: [], message: '', statusCode: 200 });
    });

    it('should throw error when data is null', () => {
      service.getAdHocTestingContractById('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Ad hoc testing contract not found');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID('C001', 'T001'));
      req.flush({ success: true, data: null, message: '', statusCode: 200 });
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

    it('should throw error when response.success is false', () => {
      service.getActiveTests().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Tests unavailable');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush({ success: false, message: 'Tests unavailable', statusCode: 500 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.getActiveTests().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to retrieve active tests');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush({ success: false, message: '', statusCode: 500 });
    });

    it('should return empty array when data is null', () => {
      service.getActiveTests().subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN);
      req.flush({ success: true, data: null, message: '', statusCode: 200 });
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

    it('should throw error when response.success is false', () => {
      const payload: CreateAdHocTestingContractRequest = {
        contractId: 'C001',
        testId: 'T001',
        effDate: '2024-01-01'
      };

      service.createAdHocTestingContract(payload).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Duplicate entry');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE);
      req.flush({ success: false, message: 'Duplicate entry', statusCode: 409 });
    });

    it('should throw default error when response.success is false with no message', () => {
      const payload: CreateAdHocTestingContractRequest = {
        contractId: 'C001',
        testId: 'T001',
        effDate: '2024-01-01'
      };

      service.createAdHocTestingContract(payload).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to create ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE);
      req.flush({ success: false, message: '', statusCode: 500 });
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

    it('should throw error when response.success is false', () => {
      const payload: UpdateAdHocTestingContractRequest = {
        effDate: '2024-01-01'
      };

      service.updateAdHocTestingContract('C001', 'T001', payload).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Update rejected');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE('C001', 'T001'));
      req.flush({ success: false, message: 'Update rejected', statusCode: 400 });
    });

    it('should throw default error when response.success is false with no message', () => {
      const payload: UpdateAdHocTestingContractRequest = {
        effDate: '2024-01-01'
      };

      service.updateAdHocTestingContract('C001', 'T001', payload).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to update ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE('C001', 'T001'));
      req.flush({ success: false, message: '', statusCode: 500 });
    });
  });

  describe('deleteAdHocTestingContract', () => {
    it('should successfully delete an ad hoc testing contract', () => {
      service.deleteAdHocTestingContract('C001', 'T001').subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, item: 1, message: 'Deleted', statusCode: 200 });
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

    it('should throw error when response.success is false', () => {
      service.deleteAdHocTestingContract('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Delete failed');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      req.flush({ success: false, message: 'Delete failed', statusCode: 500 });
    });

    it('should throw default error when response.success is false with no message', () => {
      service.deleteAdHocTestingContract('C001', 'T001').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.message).toBe('Failed to delete ad hoc testing contract');
        }
      );

      const req = httpMock.expectOne(API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE('C001', 'T001'));
      req.flush({ success: false, message: '', statusCode: 500 });
    });
  });
});
