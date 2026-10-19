import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InternalContractService } from './internal-contract.service';
import { environment } from '../../../../../../environments/environment';
import {
  Contract,
  ContractWithDetails,
  SaveContractRequest,
  SaveContractResponse,
  MasterCode,
  ValidTest,
  State,
  Country,
  Contact,
  ContractTest,
  InternalContractParamsDto,
  ContractListItem
} from './internal-contract.models';

describe('InternalContractService', () => {
  let service: InternalContractService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/internal-contracts`;

  const mockContract: Contract = {
    contractType: 'CT',
    contractId: '001CT0001',
    chapterId: '001',
    company: 'Test Company',
    addressId: 1,
    taxIdForm: '123456789',
    barCodeProtocol: '8',
    unitIdPattern: '=',
    ediInputInd: 'Y',
    resultOutputInd: 'R',
    confirmTestFlag: 'Y',
    effDate: '2026-01-01',
    termDate: null
  };

  const mockContractWithDetails: ContractWithDetails = {
    contract: mockContract,
    address: {
      addressId: 1,
      addressLine1: '123 Main St',
      addressLine2: null,
      city: 'Boston',
      stateCode: 'MA',
      zipCode: '02115',
      country: 'USA',
      intFlag: null
    },
    contacts: [],
    tests: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InternalContractService]
    });

    service = TestBed.inject(InternalContractService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===== getInternalContracts =====

  describe('getInternalContracts', () => {
    it('should POST with take/skip and params, mapping the response', () => {
      const params: InternalContractParamsDto = {
        searchKeyword: 'Test',
        chapterId: '001',
        sort: 'A'
      };
      const mockItems: ContractListItem[] = [
        {
          contractId: '001CT0001',
          contractType: 'CT',
          chapterId: '001',
          chapterName: 'Chapter 1',
          company: 'Test Company',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: '2026-01-15'
        }
      ];

      service.getInternalContracts(10, 0, params).subscribe(result => {
        expect(result.data).toEqual(mockItems);
        expect(result.total).toBe(1);
        expect(result.totalRecords).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/list/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush({ success: true, data: mockItems, total: 1 });
    });

    it('should default to empty array and zero total when data/total are null', () => {
      const params: InternalContractParamsDto = {};

      service.getInternalContracts(10, 0, params).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.totalRecords).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/list/10/0`);
      req.flush({ success: true, data: null, total: null });
    });

    it('should propagate HTTP errors', () => {
      const params: InternalContractParamsDto = {};

      service.getInternalContracts(10, 0, params).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/list/10/0`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== getAll =====

  describe('getAll', () => {
    it('should retrieve all contracts', () => {
      const mockContracts: Contract[] = [mockContract];

      service.getAll().subscribe(contracts => {
        expect(contracts).toEqual(mockContracts);
        expect(contracts.length).toBe(1);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockContracts });
    });

    it('should return empty array when data is null', () => {
      service.getAll().subscribe(contracts => {
        expect(contracts).toEqual([]);
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({ success: true, data: null });
    });

    it('should propagate HTTP errors', () => {
      service.getAll().subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== getById =====

  describe('getById', () => {
    it('should retrieve contract by ID', () => {
      const contractId = '001CT0001';

      service.getById(contractId).subscribe(data => {
        expect(data).toEqual(mockContractWithDetails);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockContractWithDetails });
    });

    it('should map modifiedDate to lastModifiedDate in tests array', () => {
      const contractId = '001CT0001';
      const backendResponse = {
        contract: mockContract,
        address: mockContractWithDetails.address,
        contacts: [],
        tests: [
          { testId: 'T1', stopLabelFlag: 'N', effDate: '2026-01-01', termDate: null, modifiedDate: '2026-06-15' }
        ]
      };

      service.getById(contractId).subscribe(data => {
        expect(data.tests[0].lastModifiedDate).toBe('2026-06-15');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      req.flush({ success: true, data: backendResponse });
    });

    it('should preserve lastModifiedDate when modifiedDate is absent', () => {
      const contractId = '001CT0001';
      const backendResponse = {
        contract: mockContract,
        address: mockContractWithDetails.address,
        contacts: [],
        tests: [
          { testId: 'T1', stopLabelFlag: 'N', effDate: '2026-01-01', termDate: null, lastModifiedDate: '2026-05-01' }
        ]
      };

      service.getById(contractId).subscribe(data => {
        expect(data.tests[0].lastModifiedDate).toBe('2026-05-01');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      req.flush({ success: true, data: backendResponse });
    });

    it('should propagate HTTP errors', () => {
      service.getById('001CT0001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/001CT0001`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== create =====

  describe('create', () => {
    it('should create a new contract', () => {
      const request: SaveContractRequest = {
        contract: mockContract,
        address: mockContractWithDetails.address,
        contacts: [],
        tests: [],
        loggedInUserName: 'testuser',
        chapterId: '001',
        programId: 'CONTR'
      };

      const response: SaveContractResponse = {
        contractId: '001CT0001',
        message: 'Contract created successfully'
      };

      service.create(request).subscribe(res => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.company).toBe('Test Company');
      expect(req.request.body.barCodeProtocol).toBe('8');
      expect(req.request.body.contractType).toBe('CT');
      expect(req.request.body.addr1).toBe('123 Main St');
      expect(req.request.body.contract).toBeUndefined();
      req.flush({ success: true, data: response });
    });

    it('should propagate HTTP errors', () => {
      const request: SaveContractRequest = {
        contract: mockContract,
        address: null,
        contacts: [],
        tests: [],
        loggedInUserName: 'testuser',
        chapterId: '001',
        programId: 'CONTR'
      };

      service.create(request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== update =====

  describe('update', () => {
    it('should update an existing contract', () => {
      const contractId = '001CT0001';
      const request: SaveContractRequest = {
        contract: mockContract,
        address: mockContractWithDetails.address,
        contacts: [],
        tests: [],
        loggedInUserName: 'testuser',
        chapterId: '001',
        programId: 'CONTR'
      };

      const response: SaveContractResponse = {
        contractId,
        message: 'Contract updated successfully'
      };

      service.update(contractId, request).subscribe(res => {
        expect(res).toEqual(response);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.company).toBe('Test Company');
      expect(req.request.body.barCodeProtocol).toBe('8');
      expect(req.request.body.contractType).toBe('CT');
      expect(req.request.body.addr1).toBe('123 Main St');
      expect(req.request.body.contract).toBeUndefined();
      req.flush({ success: true, data: response });
    });

    it('should propagate HTTP errors', () => {
      const request: SaveContractRequest = {
        contract: mockContract,
        address: null,
        contacts: [],
        tests: [],
        loggedInUserName: 'testuser',
        chapterId: '001',
        programId: 'CONTR'
      };

      service.update('001CT0001', request).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/001CT0001`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // ===== delete =====

  describe('delete', () => {
    it('should delete a contract', () => {
      const contractId = '001CT0001';

      service.delete(contractId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should propagate HTTP errors', () => {
      service.delete('001CT0001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/001CT0001`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== Lookup Methods =====

  describe('Lookup Methods', () => {
    it('should get contract types', () => {
      const mockTypes: MasterCode[] = [
        { codeType: 'CONTR', codeValue: 'CT', codeDescription: 'Contract Type' }
      ];

      service.getContractTypes().subscribe(types => {
        expect(types).toEqual(mockTypes);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/contract-types`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTypes });
    });

    it('should return empty array when contract types data is null', () => {
      service.getContractTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/contract-types`);
      req.flush({ success: true, data: null });
    });

    it('should get barcode protocols and map code/description to codeValue/codeDescription', () => {
      const backendData = [
        { code: '8', description: 'Protocol 8' }
      ];
      const expectedProtocols: MasterCode[] = [
        { codeType: 'BARCD', codeValue: '8', codeDescription: 'Protocol 8' }
      ];

      service.getBarcodeProtocols().subscribe(protocols => {
        expect(protocols).toEqual(expectedProtocols);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/barcode-protocols`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: backendData });
    });

    it('should fall back to response.item when data is absent for barcode protocols', () => {
      const backendData = [
        { code: 'I', description: 'ISBT 128' }
      ];

      service.getBarcodeProtocols().subscribe(protocols => {
        expect(protocols.length).toBe(1);
        expect(protocols[0].codeType).toBe('BARCD');
        expect(protocols[0].codeValue).toBe('I');
        expect(protocols[0].codeDescription).toBe('ISBT 128');
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/barcode-protocols`);
      req.flush({ success: true, item: backendData });
    });

    it('should return empty mapped array when barcode protocols data and item are both absent', () => {
      service.getBarcodeProtocols().subscribe(protocols => {
        expect(protocols).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/barcode-protocols`);
      req.flush({ success: true });
    });

    it('should get valid tests', () => {
      const mockTests: ValidTest[] = [
        { testId: 'TEST001', testDescription: 'Test Description' }
      ];

      service.getValidTests().subscribe(tests => {
        expect(tests).toEqual(mockTests);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/valid-tests`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTests });
    });

    it('should return empty array when valid tests data is null', () => {
      service.getValidTests().subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/valid-tests`);
      req.flush({ success: true, data: null });
    });

    it('should get states', () => {
      const mockStates: State[] = [
        { stateCode: 'MA', stateName: 'Massachusetts' }
      ];

      service.getStates().subscribe(states => {
        expect(states).toEqual(mockStates);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/states`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStates });
    });

    it('should return empty array when states data is null', () => {
      service.getStates().subscribe(states => {
        expect(states).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/states`);
      req.flush({ success: true, data: null });
    });

    it('should get chapters', () => {
      const mockChapters = [
        { chapterId: '001', chapterName: 'Chapter 1' },
        { chapterId: '002', chapterName: 'Chapter 2' }
      ];

      service.getChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockChapters);
        expect(chapters.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/chapters`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockChapters });
    });

    it('should return empty array when chapters data is null', () => {
      service.getChapters().subscribe(chapters => {
        expect(chapters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/chapters`);
      req.flush({ success: true, data: null });
    });

    it('should get active chapters', () => {
      const mockActiveChapters = [
        { chapterId: '001', chapterName: 'Active Chapter 1' }
      ];

      service.getActiveChapters().subscribe(chapters => {
        expect(chapters).toEqual(mockActiveChapters);
        expect(chapters.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/active-chapters`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockActiveChapters });
    });

    it('should return empty array when active chapters data is null', () => {
      service.getActiveChapters().subscribe(chapters => {
        expect(chapters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/active-chapters`);
      req.flush({ success: true, data: null });
    });

    it('should get countries', () => {
      const mockCountries: Country[] = [
        { countryCode: 'US', countryName: 'United States' }
      ];

      service.getCountries().subscribe(countries => {
        expect(countries).toEqual(mockCountries);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/countries`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCountries });
    });

    it('should return empty array when countries data is null', () => {
      service.getCountries().subscribe(countries => {
        expect(countries).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/countries`);
      req.flush({ success: true, data: null });
    });

    it('should get contracts LOV', () => {
      const mockLov = [
        { contractId: '001CT0001', company: 'Test Company' },
        { contractId: '001CT0002', company: 'Another Company' }
      ];

      service.getContractsLov().subscribe(lov => {
        expect(lov).toEqual(mockLov);
        expect(lov.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/contracts`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockLov });
    });

    it('should return empty array when contracts LOV data is null', () => {
      service.getContractsLov().subscribe(lov => {
        expect(lov).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/lookups/contracts`);
      req.flush({ success: true, data: null });
    });
  });

  // ===== Contact Operations =====

  describe('Contact Operations', () => {
    const contractId = '001CT0001';

    it('should get contacts', () => {
      const mockContacts: Contact[] = [
        {
          contactId: 1,
          contactType: 'C',
          contactLastName: 'Doe',
          contactFirstName: 'John',
          contactTitle: 'Manager',
          phoneNumber: '555-555-5555',
          faxNumber: null
        }
      ];

      service.getContacts(contractId).subscribe(contacts => {
        expect(contacts).toEqual(mockContacts);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockContacts });
    });

    it('should return empty array when contacts data is null', () => {
      service.getContacts(contractId).subscribe(contacts => {
        expect(contacts).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts`);
      req.flush({ success: true, data: null });
    });

    it('should create contact', () => {
      const newContact: Contact = {
        contactId: null,
        contactType: 'C',
        contactLastName: 'Doe',
        contactFirstName: 'John',
        contactTitle: 'Manager',
        phoneNumber: '555-555-5555',
        faxNumber: null
      };

      const createdContact: Contact = { ...newContact, contactId: 1 };

      service.createContact(contractId, newContact).subscribe(contact => {
        expect(contact).toEqual(createdContact);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: createdContact });
    });

    it('should update contact', () => {
      const contactId = 1;
      const updatedContact: Contact = {
        contactId,
        contactType: 'C',
        contactLastName: 'Doe',
        contactFirstName: 'Jane',
        contactTitle: 'Director',
        phoneNumber: '555-555-5555',
        faxNumber: null
      };

      service.updateContact(contractId, contactId, updatedContact).subscribe(contact => {
        expect(contact).toEqual(updatedContact);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts/${contactId}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: updatedContact });
    });

    it('should update contact with contract', () => {
      const contactId = 1;
      const chapterId = '001';
      const payload = {
        company: 'Updated Company',
        barCodeProtocol: '8',
        contactType: 'C',
        contactFirstName: 'John',
        contactLastName: 'Doe',
        addr1: '456 Oak Ave',
        city: 'Boston',
        stateCode: 'MA',
        zip: '02115',
        country: 'USA',
        contactTitle: 'Manager',
        phoneNumber: '555-555-5555'
      };

      const responseData = { success: true, contractId: '001CT0001', contactId: 1 };

      service.updateContactWithContract(contractId, contactId, chapterId, payload).subscribe(result => {
        expect(result).toEqual(responseData);
      });

      const expectedUrl = `${baseUrl}/${contractId}/contacts/${contactId}/with-contract?chapterId=${chapterId}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: responseData });
    });

    it('should propagate HTTP errors for updateContactWithContract', () => {
      const payload = {
        company: 'Company',
        barCodeProtocol: '8',
        contactType: 'C',
        contactFirstName: 'John',
        contactLastName: 'Doe'
      };

      service.updateContactWithContract('001CT0001', 1, '001', payload).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/001CT0001/contacts/1/with-contract?chapterId=001`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should delete contact', () => {
      const contactId = 1;

      service.deleteContact(contractId, contactId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts/${contactId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should propagate HTTP errors for deleteContact', () => {
      service.deleteContact(contractId, 999).subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/contacts/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== Test Operations =====

  describe('Test Operations', () => {
    const contractId = '001CT0001';

    it('should get contract tests', () => {
      const chapterId = '001';
      const mockTests: ContractTest[] = [
        {
          contractId,
          testId: 'TEST001',
          stopLabelFlag: 'N',
          effDate: '2026-01-01',
          termDate: null,
          testDescription: 'Test Description'
        }
      ];

      service.getContractTests(contractId, chapterId).subscribe(tests => {
        expect(tests).toEqual(mockTests);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests?chapterId=${chapterId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTests });
    });

    it('should map modifiedDate to lastModifiedDate in getContractTests', () => {
      const chapterId = '001';
      const backendTests = [
        { contractId, testId: 'TEST001', stopLabelFlag: 'N', effDate: '2026-01-01', termDate: null, modifiedDate: '2026-06-15' }
      ];

      service.getContractTests(contractId, chapterId).subscribe(tests => {
        expect(tests[0].lastModifiedDate).toBe('2026-06-15');
        expect((tests[0] as any).modifiedDate).toBe('2026-06-15');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests?chapterId=${chapterId}`);
      req.flush({ success: true, data: backendTests });
    });

    it('should return empty array when getContractTests data is null', () => {
      service.getContractTests(contractId, '001').subscribe(tests => {
        expect(tests).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests?chapterId=001`);
      req.flush({ success: true, data: null });
    });

    it('should create contract test with Pascal-case DTO', () => {
      const chapterId = '001';
      const newTest: ContractTest = {
        testId: 'TEST001',
        stopLabelFlag: 'N',
        effDate: '2026-01-01',
        termDate: null
      };

      const createdTest = { ...newTest, contractId, modifiedDate: '2026-07-01' };

      service.createContractTest(contractId, chapterId, newTest).subscribe(test => {
        expect(test.lastModifiedDate).toBe('2026-07-01');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests?chapterId=${chapterId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        TestId: 'TEST001',
        StopLabelFlag: 'N',
        EffDate: '2026-01-01',
        TermDate: null
      });
      req.flush({ success: true, item: createdTest });
    });

    it('should update contract test with Pascal-case DTO', () => {
      const testId = 'TEST001';
      const chapterId = '001';
      const updatedTest: ContractTest = {
        contractId,
        testId,
        stopLabelFlag: 'Y',
        effDate: '2026-01-01',
        termDate: '2026-12-31'
      };

      const responseItem = { ...updatedTest, modifiedDate: '2026-07-15' };

      service.updateContractTest(contractId, testId, chapterId, updatedTest).subscribe(test => {
        expect(test.lastModifiedDate).toBe('2026-07-15');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests/${testId}?chapterId=${chapterId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        StopLabelFlag: 'Y',
        EffDate: '2026-01-01',
        TermDate: '2026-12-31'
      });
      req.flush({ success: true, item: responseItem });
    });

    it('should preserve lastModifiedDate when modifiedDate is absent in update response', () => {
      const testId = 'TEST001';
      const chapterId = '001';
      const updatedTest: ContractTest = {
        contractId,
        testId,
        stopLabelFlag: 'Y',
        effDate: '2026-01-01',
        termDate: '2026-12-31'
      };

      const responseItem = { ...updatedTest, lastModifiedDate: '2026-05-01' };

      service.updateContractTest(contractId, testId, chapterId, updatedTest).subscribe(test => {
        expect(test.lastModifiedDate).toBe('2026-05-01');
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests/${testId}?chapterId=${chapterId}`);
      req.flush({ success: true, item: responseItem });
    });

    it('should delete contract test', () => {
      const testId = 'TEST001';
      const chapterId = '001';

      service.deleteContractTest(contractId, testId, chapterId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests/${testId}?chapterId=${chapterId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should propagate HTTP errors for deleteContractTest', () => {
      service.deleteContractTest(contractId, 'INVALID', '001').subscribe({
        next: () => fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${contractId}/tests/INVALID?chapterId=001`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
