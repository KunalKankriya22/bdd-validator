import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegionalTestingContractApiService } from './regional-testing-contract-api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ApiResponse,
  ContractDto,
  ContractQueryDto,
  CreateContractDto,
  UpdateContractDto,
  RegionalTestingContractProfileDto,
  RegionalTestingContractProfileQueryDto,
  CreateRegionalTestingContractProfileDto,
  UpdateRegionalTestingContractProfileDto,
  CustomerOverrideData
} from '../models/regional-testing-contract.model';

describe('RegionalTestingContractApiService', () => {
  let service: RegionalTestingContractApiService;
  let httpMock: HttpTestingController;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RegionalTestingContractApiService,
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    service = TestBed.inject(RegionalTestingContractApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===== 1. Service Creation =====

  describe('Service creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ===== 2. getAllContracts =====

  describe('getAllContracts', () => {
    it('should POST and map response with data and total', (done) => {
      const query: ContractQueryDto = { searchKeyword: 'test' };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true,
        statusCode: 200,
        data: [
          { contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1', customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01', termDate: null, addressId: null, contactName: null, lastModifiedDate: null, programId: null, auditKey: null, sTermFlag: null, altELevel: null, dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null, resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null, ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null, noOfDuplicates: null, nonProfileEf: null, contactType: 'F', cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null, unitIdPattern: null, resultsMethod: null, centerId: null, dupCheckinFlag: null, profileSeqNo: null }
        ],
        totalCount: 50
      };

      service.getAllContracts(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].contractId).toBe('C001');
          expect(result.total).toBe(50);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/10/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should default totalCount to 0 when not provided', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.getAllContracts(10, 0).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/10/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should use default take=10 and skip=0 when not provided', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

      service.getAllContracts().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/10/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getAllContracts(10, 0).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/10/0'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 3. getContractById =====

  describe('getContractById', () => {
    it('should GET and return first element from data array', (done) => {
      const contractId = 'C001';
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getContractById(contractId).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          expect(result.customerName).toBe('Cust1');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getContractById('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 4. createContract =====

  describe('createContract', () => {
    const createDto: CreateContractDto = {
      contractType: 'R', customerName: 'New Cust', effDate: '2024-01-01',
      unitIdType: 'D', resultOutputInd: 'P', contactType: 'F'
    };

    it('should POST and return contractId from data array', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [{ contractId: 'C002' }]
      };

      service.createContract(createDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C002');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/regional-testing-contract'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

    it('should fallback to empty contractId when data is empty', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.createContract(createDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract'));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should fallback to empty contractId when data is undefined', (done) => {
      const mockResponse = { success: true, statusCode: 200 };

      service.createContract(createDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract'));
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.createContract(createDto).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/regional-testing-contract'));
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== 5. updateContract =====

  describe('updateContract', () => {
    const updateDto: UpdateContractDto = {
      contractType: 'R', customerName: 'Updated Cust', effDate: '2024-06-01',
      unitIdType: 'D', resultOutputInd: 'P', contactType: 'F'
    };

    it('should PUT and return contractId from data array', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [{ contractId: 'C001' }]
      };

      service.updateContract('C001', updateDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

    it('should fallback to provided contractId when data is empty', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.updateContract('C001', updateDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should fallback to provided contractId when data is undefined', (done) => {
      const mockResponse = { success: true, statusCode: 200 };

      service.updateContract('C001', updateDto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.updateContract('C001', updateDto).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 6. deleteContract =====

  describe('deleteContract', () => {
    it('should DELETE and return boolean from data array', (done) => {
      const mockResponse: ApiResponse<boolean[]> = {
        success: true, statusCode: 200, data: [true]
      };

      service.deleteContract('C001').subscribe({
        next: (result) => {
          expect(result).toBeTrue();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.deleteContract('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 7. getAll (profiles) =====

  describe('getAll (profiles)', () => {
    it('should POST and map response with data and totalCount', (done) => {
      const query: RegionalTestingContractProfileQueryDto = { contractId: 'C001' };
      const mockProfile: RegionalTestingContractProfileDto = {
        contractId: 'C001', profileType: 'P', profileSetId: 'PS01',
        effDate: '2024-01-01', termDate: null
      };
      const mockResponse: ApiResponse<RegionalTestingContractProfileDto[]> = {
        success: true, statusCode: 200, data: [mockProfile], totalCount: 1
      };

      service.getAll(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].profileSetId).toBe('PS01');
          expect(result.totalCount).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/10/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should default totalCount to 0 when not provided', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.getAll(5, 0).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalCount).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/5/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should use default take=10 and skip=0 when not provided', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [], totalCount: 0 };

      service.getAll().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.totalCount).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/10/0'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getAll(10, 0).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/10/0'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 8. getById =====

  describe('getById', () => {
    it('should GET and return data from response', (done) => {
      const mockProfile: RegionalTestingContractProfileDto = {
        contractId: 'C001', profileType: 'A', profileSetId: 'PS01',
        effDate: '2024-01-01', termDate: null
      };
      const mockResponse: ApiResponse<RegionalTestingContractProfileDto> = {
        success: true, statusCode: 200, data: mockProfile
      };

      service.getById('C001', 'PS01').subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          expect(result.profileSetId).toBe('PS01');
          expect(result.profileType).toBe('A');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/C001/PS01'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getById('C001', 'PS01').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract-profiles/C001/PS01'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 9. create (profile) =====

  describe('create (profile)', () => {
    it('should POST and return composite key from response', (done) => {
      const dto: CreateRegionalTestingContractProfileDto = {
        contractId: 'C001', profileSetId: 'PS02', effDate: '2024-06-01'
      };
      const mockResponse: ApiResponse<{ contractId: string; profileSetId: string }> = {
        success: true, statusCode: 200,
        data: { contractId: 'C001', profileSetId: 'PS02' }
      };

      service.create(dto).subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          expect(result.profileSetId).toBe('PS02');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles') &&
        !r.url.includes('/C001/')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      const dto: CreateRegionalTestingContractProfileDto = {
        contractId: 'C001', profileSetId: 'PS02', effDate: '2024-06-01'
      };

      service.create(dto).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles') &&
        !r.url.includes('/C001/')
      );
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  // ===== 10. update (profile) =====

  describe('update (profile)', () => {
    it('should PUT and return undefined on success', (done) => {
      const dto: UpdateRegionalTestingContractProfileDto = {
        profileType: 'P', effDate: '2024-01-01', termDate: '2024-12-31'
      };
      const mockResponse: ApiResponse<void> = {
        success: true, statusCode: 200, data: undefined as any
      };

      service.update('C001', 'PS01', dto).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles/C001/PS01') &&
        r.method === 'PUT'
      );
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      const dto: UpdateRegionalTestingContractProfileDto = {
        profileType: 'A', effDate: '2024-01-01'
      };

      service.update('C001', 'PS01', dto).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles/C001/PS01') &&
        r.method === 'PUT'
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== 11. delete (profile) =====

  describe('delete (profile)', () => {
    it('should DELETE and return undefined on success', (done) => {
      const mockResponse: ApiResponse<void> = {
        success: true, statusCode: 200, data: undefined as any
      };

      service.delete('C001', 'PS01').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles/C001/PS01') &&
        r.method === 'DELETE'
      );
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.delete('C001', 'PS01').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract-profiles/C001/PS01') &&
        r.method === 'DELETE'
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 12. getFilterOptions =====

  describe('getFilterOptions', () => {
    it('should GET and return first element from data array', (done) => {
      const filterData = {
        cbcChapters: [{ value: 'CH1', label: 'Chapter 1' }],
        stateCodes: [{ value: 'CA', label: 'California' }],
        barCodeProtocols: [{ value: 'BC1', label: 'Protocol 1' }],
        resultsMethods: [{ value: 'RM1', label: 'Method 1' }]
      };
      const mockResponse = { success: true, statusCode: 200, data: [filterData] };

      service.getFilterOptions().subscribe({
        next: (result) => {
          expect(result.cbcChapters.length).toBe(1);
          expect(result.cbcChapters[0].value).toBe('CH1');
          expect(result.stateCodes[0].value).toBe('CA');
          expect(result.barCodeProtocols[0].value).toBe('BC1');
          expect(result.resultsMethods[0].value).toBe('RM1');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/filter-options'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getFilterOptions().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/filter-options'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 13. getChaptersLookup =====

  describe('getChaptersLookup', () => {
    it('should GET and return chapters data array', (done) => {
      const mockResponse: ApiResponse<{ chapterId: string; chapterName: string }[]> = {
        success: true, statusCode: 200,
        data: [
          { chapterId: 'CH1', chapterName: 'Chapter One' },
          { chapterId: 'CH2', chapterName: 'Chapter Two' }
        ]
      };

      service.getChaptersLookup().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].chapterId).toBe('CH1');
          expect(result[0].chapterName).toBe('Chapter One');
          expect(result[1].chapterId).toBe('CH2');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/available-chapters'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getChaptersLookup().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/available-chapters'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 14. generateContractId =====

  describe('generateContractId', () => {
    it('should GET and return first element from data array', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [{ contractPrefix: 'R', lastContractId: 'R00042' }]
      };

      service.generateContractId('R').subscribe({
        next: (result) => {
          expect(result.contractPrefix).toBe('R');
          expect(result.lastContractId).toBe('R00042');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/generate-contract-id/R'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.generateContractId('X').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/generate-contract-id/X'));
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== 15. getStatesLookup =====

  describe('getStatesLookup', () => {
    it('should GET and return states data array', (done) => {
      const mockResponse: ApiResponse<{ stateCode: string; stateName: string }[]> = {
        success: true, statusCode: 200,
        data: [
          { stateCode: 'CA', stateName: 'California' },
          { stateCode: 'TX', stateName: 'Texas' }
        ]
      };

      service.getStatesLookup().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].stateCode).toBe('CA');
          expect(result[0].stateName).toBe('California');
          expect(result[1].stateCode).toBe('TX');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/chapters/states/lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getStatesLookup().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/chapters/states/lookup'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 16. getCountriesLookup =====

  describe('getCountriesLookup', () => {
    it('should GET and return countries data array', (done) => {
      const mockResponse: ApiResponse<{ countryCode: string; countryName: string }[]> = {
        success: true, statusCode: 200,
        data: [
          { countryCode: 'US', countryName: 'United States' },
          { countryCode: 'CA', countryName: 'Canada' }
        ]
      };

      service.getCountriesLookup().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].countryCode).toBe('US');
          expect(result[0].countryName).toBe('United States');
          expect(result[1].countryCode).toBe('CA');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/chapters/countries/lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getCountriesLookup().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/chapters/countries/lookup'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 17. getTestGroups =====

  describe('getTestGroups', () => {
    it('should GET and map value/label to groupId/description', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { value: 'G01', label: 'Group One' },
          { value: 'G02', label: 'Group Two' }
        ]
      };

      service.getTestGroups('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].groupId).toBe('G01');
          expect(result[0].description).toBe('Group One');
          expect(result[1].groupId).toBe('G02');
          expect(result[1].description).toBe('Group Two');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/test-groups'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getTestGroups('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/test-groups'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 18. getTestLookups =====

  describe('getTestLookups', () => {
    it('should GET and map testId/testDesc/testGroup to TestLookup', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { testId: 'T01', testDesc: 'Test One', testGroup: 'G01' },
          { testId: 'T02', testDesc: 'Test Two' }
        ]
      };

      service.getTestLookups('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('T01');
          expect(result[0].description).toBe('Test One');
          expect(result[0].testGroup).toBe('G01');
          expect(result[1].testId).toBe('T02');
          expect(result[1].description).toBe('Test Two');
          expect(result[1].testGroup).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/profile-test-lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use NEW when contractId is empty string', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.getTestLookups('').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/NEW/profile-test-lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use NEW when called with no arguments', (done) => {
      const mockResponse = { success: true, statusCode: 200, data: [] };

      service.getTestLookups().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/NEW/profile-test-lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ===== 19. getTestsByGroup =====

  describe('getTestsByGroup', () => {
    it('should GET and map testId/testDesc/testGroup to TestByGroupLookup', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { testId: 'T01', testDesc: 'Test One', testGroup: 'G01' },
          { testId: 'T02', testDesc: 'Test Two', testGroup: 'G02' }
        ]
      };

      service.getTestsByGroup('C001', 'G01').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('T01');
          expect(result[0].description).toBe('Test One');
          expect(result[0].testGroup).toBe('G01');
          expect(result[1].testId).toBe('T02');
          expect(result[1].testGroup).toBe('G02');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/non-profile-test-lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getTestsByGroup('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/non-profile-test-lookup'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 20. getReactiveTestLookup =====

  describe('getReactiveTestLookup', () => {
    it('should GET and map testId/testDesc to TestLookup', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { testId: 'RT01', testDesc: 'Reactive Test One' },
          { testId: 'RT02', testDesc: 'Reactive Test Two' }
        ]
      };

      service.getReactiveTestLookup().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('RT01');
          expect(result[0].description).toBe('Reactive Test One');
          expect(result[1].testId).toBe('RT02');
          expect(result[1].description).toBe('Reactive Test Two');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/reactive-test-lookup'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getReactiveTestLookup().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/reactive-test-lookup'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 21. getResultCodesForTest =====

  describe('getResultCodesForTest', () => {
    it('should GET and map resultStatus/codeDesc to ResultLookup', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { resultStatus: 'POS', codeDesc: 'Positive' },
          { resultStatus: 'NEG', codeDesc: 'Negative' }
        ]
      };

      service.getResultCodesForTest('RT01').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].resultCode).toBe('POS');
          expect(result[0].resultDescription).toBe('Positive');
          expect(result[1].resultCode).toBe('NEG');
          expect(result[1].resultDescription).toBe('Negative');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/reactive-test-results/RT01'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getResultCodesForTest('INVALID').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/reactive-test-results/INVALID'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 22. getConfirmatoryTestLookup =====

  describe('getConfirmatoryTestLookup', () => {
    it('should GET and map testId/testDesc to TestLookup', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { testId: 'CT01', testDesc: 'Confirm Test One' },
          { testId: 'CT02', testDesc: 'Confirm Test Two' }
        ]
      };

      service.getConfirmatoryTestLookup('RT01').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('CT01');
          expect(result[0].description).toBe('Confirm Test One');
          expect(result[1].testId).toBe('CT02');
          expect(result[1].description).toBe('Confirm Test Two');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/confirmatory-test-lookup/RT01'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getConfirmatoryTestLookup('INVALID').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/confirmatory-test-lookup/INVALID'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ===== 23. getProfileSets =====

  describe('getProfileSets', () => {
    it('should return empty array for NEW contractId', (done) => {
      service.getProfileSets('NEW').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
      // No HTTP call expected for NEW
    });

    it('should return empty array for empty contractId', (done) => {
      service.getProfileSets('').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should map profiles from contract response for existing contract', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: [
          { contractId: 'C001', profileType: 'P', profileSetId: 'PS01', effDate: '2024-01-01', termDate: null, auditKey: null, programId: null },
          { contractId: 'C001', profileType: 'A', profileSetId: 'PS02', effDate: '2024-06-01', termDate: '2024-12-31', auditKey: null, programId: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].profileSetId).toBe('PS01');
          expect(result[0].profileType).toBe('P');
          expect(result[0].effectiveDate).toBe('2024-01-01');
          expect(result[0].terminationDate).toBeNull();
          expect(result[0].tests).toEqual([]);
          expect(result[1].profileSetId).toBe('PS02');
          expect(result[1].profileType).toBe('A');
          expect(result[1].terminationDate).toBe('2024-12-31');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when contract has no profiles', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: []
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should set profileType to null for invalid type', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: [
          { contractId: 'C001', profileType: 'X', profileSetId: 'PS01', effDate: '2024-01-01', termDate: null, auditKey: null, programId: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].profileType).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should set profileType to null when profileType is null', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: [
          { contractId: 'C001', profileType: null as any, profileSetId: 'PS01', effDate: '2024-01-01', termDate: null, auditKey: null, programId: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].profileType).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should return empty array when profiles property is undefined', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null
        // profiles property omitted entirely
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should handle S profileType correctly', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: [
          { contractId: 'C001', profileType: 'S', profileSetId: 'PS01', effDate: '2024-01-01', termDate: null, auditKey: null, programId: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].profileType).toBe('S');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should deduplicate profiles with same profileSetId', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        profiles: [
          { contractId: 'C001', profileType: 'P', profileSetId: 'PS01', effDate: '2024-01-01', termDate: null, auditKey: null, programId: null },
          { contractId: 'C001', profileType: 'P', profileSetId: 'PS01', effDate: '2024-02-01', termDate: null, auditKey: null, programId: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getProfileSets('C001').subscribe({
        next: (result) => {
          // Should only have 1 entry despite 2 profiles with same profileSetId
          expect(result.length).toBe(1);
          expect(result[0].profileSetId).toBe('PS01');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getProfileSets('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 24. saveProfileSet =====

  describe('saveProfileSet', () => {
    it('should POST tests and return undefined on success', (done) => {
      const tests = [
        { testId: 'T01', effDate: '2024-01-01' },
        { testId: 'T02', effDate: '2024-02-01' }
      ];
      const mockResponse: ApiResponse<void> = {
        success: true, statusCode: 200, data: undefined as any
      };

      service.saveProfileSet('C001', 'PS01', tests).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract/C001/contract-tests/PS01')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(tests);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.saveProfileSet('C001', 'PS01', []).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('/regional-testing-contract/C001/contract-tests/PS01')
      );
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== 25. getNonProfileTests =====

  describe('getNonProfileTests', () => {
    it('should return empty array for NEW contractId', (done) => {
      service.getNonProfileTests('NEW').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array for empty contractId', (done) => {
      service.getNonProfileTests('').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should map non-profile tests from contract response', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        nonProfileTests: [
          { testId: 'T01', testGroup: 'G1', effDate: '2024-01-01', termDate: null, testDesc: 'Test One', insertUser: 'admin', insertDate: '2024-01-01T00:00:00Z' },
          { testId: 'T02', testGroup: 'G2', effDate: '2024-03-01', termDate: '2024-12-31' }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getNonProfileTests('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].testId).toBe('T01');
          expect(result[0].description).toBe('Test One');
          expect(result[0].effectiveDate).toBe('2024-01-01');
          expect(result[0].terminationDate).toBeNull();
          expect(result[0].lastModifiedUser).toBe('admin');
          expect(result[0].lastModifiedDate).toBe('2024-01-01T00:00:00Z');
          // Second test has no testDesc, should fallback to testId
          expect(result[1].testId).toBe('T02');
          expect(result[1].description).toBe('T02');
          expect(result[1].terminationDate).toBe('2024-12-31');
          // No insertUser, should fallback to current username
          expect(result[1].lastModifiedUser).toBe('testuser');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when contract has no nonProfileTests', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        nonProfileTests: []
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getNonProfileTests('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should return empty array when nonProfileTests property is undefined', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null
        // nonProfileTests omitted entirely
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getNonProfileTests('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should fallback to SYSTEM when getCurrentUsername returns empty', (done) => {
      headerServiceSpy.getCurrentUsername.and.returnValue('');

      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        nonProfileTests: [
          { testId: 'T01', testGroup: 'G1', effDate: '2024-01-01', termDate: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getNonProfileTests('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].lastModifiedUser).toBe('SYSTEM');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should fallback to current date when insertDate is missing', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        nonProfileTests: [
          { testId: 'T01', testGroup: 'G1', effDate: '2024-01-01', termDate: null, testDesc: 'Test One', insertUser: 'admin' }
          // insertDate is omitted
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getNonProfileTests('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          // Should be an ISO date string (fallback to new Date().toISOString())
          expect(result[0].lastModifiedDate).toBeTruthy();
          expect(typeof result[0].lastModifiedDate).toBe('string');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getNonProfileTests('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 26. getCustomerOverrides =====

  describe('getCustomerOverrides', () => {
    it('should return empty array for NEW contractId', (done) => {
      service.getCustomerOverrides('NEW').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array for empty contractId', (done) => {
      service.getCustomerOverrides('').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should group confirmTests by reactiveTestId', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        confirmTests: [
          { reactiveTestId: 'RT01', reactiveTestResult: 'POS', reactivePlateSeq: 1, confirmTestId: 'CT01', effDate: '2024-01-01', termDate: null },
          { reactiveTestId: 'RT01', reactiveTestResult: 'POS', reactivePlateSeq: 1, confirmTestId: 'CT02', effDate: '2024-02-01', termDate: '2024-12-31' },
          { reactiveTestId: 'RT02', reactiveTestResult: 'NEG', reactivePlateSeq: 0, confirmTestId: 'CT03', effDate: '2024-03-01', termDate: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getCustomerOverrides('C001').subscribe({
        next: (result) => {
          expect(result.length).toBe(2);

          // First group: RT01 with 2 confirmatory tests + 1 empty new row
          const rt01 = result[0];
          expect(rt01.reactiveTestId).toBe('RT01');
          expect(rt01.result).toBe('POS');
          expect(rt01.plateSequence).toBe('R'); // reactivePlateSeq 1 = 'R'
          expect(rt01.confirmatoryTests.length).toBe(3); // 1 empty new + 2 existing
          expect(rt01.confirmatoryTests[0].isNew).toBeTrue();
          expect(rt01.confirmatoryTests[0].testId).toBe('');
          expect(rt01.confirmatoryTests[1].testId).toBe('CT01');
          expect(rt01.confirmatoryTests[2].testId).toBe('CT02');
          expect(rt01.confirmatoryTests[2].terminationDate).toBe('2024-12-31');

          // Second group: RT02 with 1 confirmatory test + 1 empty new row
          const rt02 = result[1];
          expect(rt02.reactiveTestId).toBe('RT02');
          expect(rt02.result).toBe('NEG');
          expect(rt02.plateSequence).toBe('I'); // reactivePlateSeq 0 = 'I'
          expect(rt02.confirmatoryTests.length).toBe(2);
          expect(rt02.confirmatoryTests[0].isNew).toBeTrue();
          expect(rt02.confirmatoryTests[1].testId).toBe('CT03');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when contract has no confirmTests', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        confirmTests: []
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getCustomerOverrides('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should return empty array when confirmTests property is undefined', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null
        // confirmTests omitted entirely
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getCustomerOverrides('C001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getCustomerOverrides('C001').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 27. getConfirmatoryQueryData =====

  describe('getConfirmatoryQueryData', () => {
    it('should return empty arrays when contract has no confirmTests', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        confirmTests: []
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getConfirmatoryQueryData('C001', 'RT01').subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          expect(result.reactiveTests).toEqual([]);
          expect(result.confirmatoryTests).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty arrays when confirmTests is undefined', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getConfirmatoryQueryData('C001', 'RT01').subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');
          expect(result.reactiveTests).toEqual([]);
          expect(result.confirmatoryTests).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush(mockResponse);
    });

    it('should map confirmTests to reactive and confirmatory test arrays', (done) => {
      const mockContract: ContractDto = {
        contractId: 'C001', chapterId: 'TST', contractType: 'R', customerName: 'Cust1',
        customerId: null, exportCode: null, agreementDate: null, effDate: '2024-01-01',
        termDate: null, addressId: null, contactName: null, lastModifiedDate: null,
        programId: null, auditKey: null, sTermFlag: null, altELevel: null,
        dispChkdigitFlag: null, taxIdForm: null, unitIdType: 'D', sEditRates: null,
        resultOutputInd: 'P', confirmTestFlag: null, odReportingMethod: null,
        ediInputInd: null, barCodeProtocol: null, copyIsbtFlag: null,
        noOfDuplicates: null, nonProfileEf: null, contactType: 'F',
        cbcChapterId: null, altSeLevel: null, poNo: null, plateCapacity: null,
        unitIdPattern: null, resultsMethod: null, centerId: null,
        dupCheckinFlag: null, profileSeqNo: null,
        confirmTests: [
          { reactiveTestId: 'RT01', reactiveTestResult: 'POS', reactivePlateSeq: 1, confirmTestId: 'CT01', effDate: '2024-01-01', termDate: null },
          { reactiveTestId: 'RT01', reactiveTestResult: 'POS', reactivePlateSeq: 1, confirmTestId: 'CT02', effDate: '2024-02-01', termDate: '2024-12-31' },
          { reactiveTestId: 'RT02', reactiveTestResult: '', reactivePlateSeq: 0, confirmTestId: 'CT03', effDate: '', termDate: null }
        ]
      };
      const mockResponse: ApiResponse<ContractDto[]> = {
        success: true, statusCode: 200, data: [mockContract]
      };

      service.getConfirmatoryQueryData('C001', 'RT01').subscribe({
        next: (result) => {
          expect(result.contractId).toBe('C001');

          // Reactive tests: unique by reactiveTestId
          expect(result.reactiveTests.length).toBe(2);
          expect(result.reactiveTests[0].testId).toBe('RT01');
          expect(result.reactiveTests[0].testResults).toBe('POS');
          expect(result.reactiveTests[0].sequence).toBe('R'); // reactivePlateSeq 1 = 'R'
          expect(result.reactiveTests[1].testId).toBe('RT02');
          expect(result.reactiveTests[1].testResults).toBe('');
          expect(result.reactiveTests[1].sequence).toBe('I'); // reactivePlateSeq 0 = 'I'

          // Confirmatory tests: ALL tests (not filtered)
          expect(result.confirmatoryTests.length).toBe(3);
          expect(result.confirmatoryTests[0].testId).toBe('CT01');
          expect(result.confirmatoryTests[0].effectiveDate).toBe('2024-01-01');
          expect(result.confirmatoryTests[0].terminationDate).toBeNull();
          expect(result.confirmatoryTests[1].testId).toBe('CT02');
          expect(result.confirmatoryTests[1].terminationDate).toBe('2024-12-31');
          expect(result.confirmatoryTests[2].testId).toBe('CT03');
          expect(result.confirmatoryTests[2].effectiveDate).toBe('');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getConfirmatoryQueryData('C001', 'RT01').subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 28. getStateCodes =====

  describe('getStateCodes', () => {
    it('should GET and map state codes from response', (done) => {
      const mockResponse = {
        success: true, statusCode: 200,
        data: [
          { code: 'CA', description: 'California' },
          { code: 'TX', description: 'Texas' }
        ]
      };

      service.getStateCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('CA');
          expect(result[0].description).toBe('California');
          expect(result[1].code).toBe('TX');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/imported-blood-contract/lov/state-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is undefined', (done) => {
      const mockResponse = { success: true, statusCode: 200 };

      service.getStateCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/imported-blood-contract/lov/state-codes'));
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.getStateCodes().subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/imported-blood-contract/lov/state-codes'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ===== 29. saveAddress =====

  describe('saveAddress', () => {
    it('should POST address data and return response', (done) => {
      const addressData = {
        addressLine1: '123 Main St',
        city: 'Springfield',
        stateCode: 'IL',
        zipCode: '62701'
      };
      const mockResponse = { success: true, statusCode: 200, data: [{ addressId: 1 }] };

      service.saveAddress('C001', addressData).subscribe({
        next: (result) => {
          expect(result.data[0].addressId).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/address'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(addressData);
      req.flush(mockResponse);
    });

    it('should propagate HTTP error', (done) => {
      service.saveAddress('C001', {}).subscribe({
        next: () => done.fail('expected error'),
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('/regional-testing-contract/C001/address'));
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===== 30. Deprecated methods return of(undefined) =====

  describe('Deprecated methods', () => {
    it('deleteProfileTest should return of(undefined)', (done) => {
      service.deleteProfileTest('C001', 'PS01', 'T01').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });

    it('addNonProfileTest should return of(undefined)', (done) => {
      service.addNonProfileTest('C001', 'T01').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });

    it('addNonProfileTestsBatch should return of(undefined)', (done) => {
      service.addNonProfileTestsBatch('C001', ['T01', 'T02']).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });

    it('saveCustomerOverride should return of(undefined)', (done) => {
      const override: CustomerOverrideData = {
        reactiveTestId: 'RT01', description: 'Test', result: 'POS',
        plateSequence: 'R', confirmatoryTests: []
      };
      service.saveCustomerOverride('C001', override).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });

    it('deleteConfirmatoryTest should return of(undefined)', (done) => {
      service.deleteConfirmatoryTest('C001', 'RT01', 'CT01').subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done.fail
      });
    });
  });
});
