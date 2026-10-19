import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdHocTubeCheckInService } from './ad-hoc-tube-check-in.service';
import { AdhocCheckInRequestDto } from '../models/ad-hoc-tube-check-in.model';

describe('AdHocTubeCheckInService', () => {
  let service: AdHocTubeCheckInService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdHocTubeCheckInService],
    });
    service = TestBed.inject(AdHocTubeCheckInService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch contracts', () => {
    const mockContracts = [{ contractId: 'C1', company: 'Test Co' }];

    service.getContracts().subscribe(result => {
      expect(result).toEqual(mockContracts);
    });

    const req = httpMock.expectOne(r => r.url.includes('adhoc-tube-checkin/contracts'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockContracts });
  });

  it('should fetch contracts with search term', () => {
    service.getContracts('test').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('adhoc-tube-checkin/contracts') && r.params.get('searchTerm') === 'test');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should fetch batches for a contract', () => {
    const mockBatches = [{ batchId: 'B1', contractSuffix: '0001' }];

    service.getBatches('C1').subscribe(result => {
      expect(result).toEqual(mockBatches);
    });

    const req = httpMock.expectOne(r => r.url.includes('contracts/C1/batches'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockBatches });
  });

  it('should fetch test groups', () => {
    const mockGroups = [{ code: 'CNFRN', codeDesc: 'Confirmatory' }];

    service.getTestGroups().subscribe(result => {
      expect(result).toEqual(mockGroups);
    });

    const req = httpMock.expectOne(r => r.url.includes('test-groups'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockGroups });
  });

  it('should fetch valid tests without group filter', () => {
    const mockTests = [{ testId: 'AHT', testGroup: 'ADHOC', testDesc: 'Ad Hoc Testing' }];

    service.getValidTests().subscribe(result => {
      expect(result).toEqual(mockTests);
    });

    const req = httpMock.expectOne(r => r.url.includes('adhoc-tube-checkin/tests') && !r.params.has('testGroup'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTests });
  });

  it('should fetch valid tests with group filter', () => {
    service.getValidTests('CNFRN').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('adhoc-tube-checkin/tests') && r.params.get('testGroup') === 'CNFRN');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should fetch units in batch', () => {
    const mockUnits = [{ unitId: 'U1', displayUnitId: 'U1', redTubeFlag: 'Y' }];

    service.getUnitsInBatch('B1').subscribe(result => {
      expect(result).toEqual(mockUnits);
    });

    const req = httpMock.expectOne(r => r.url.includes('batches/B1/units'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockUnits });
  });

  it('should fetch batch tests', () => {
    const mockTests = [{ testId: 'AHT', testDesc: 'Ad Hoc Testing', contractId: 'C1', batchId: 'B1', contractSuffix: '0001' }];

    service.getBatchTests('B1').subscribe(result => {
      expect(result).toEqual(mockTests);
    });

    const req = httpMock.expectOne(r => r.url.includes('batches/B1/tests'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTests });
  });

  it('should post check-in request and extract item from response', () => {
    const mockResponse = { unitId: 'U1', osUnitId: 'OS1', batchId: 'B1', contractSuffix: '0001', testsAssigned: 3 };
    const request: AdhocCheckInRequestDto = {
      contractId: 'C1',
      batchId: null,
      contractSuffix: null,
      collDate: '2026-06-23',
      receivedDate: '2026-06-23',
      r1Num: 'Y',
      r2Num: null,
      p1Num: 'Y',
      p2Num: null,
      osUnitId: 'OS1',
      unitId: 'U1',
      chkDigit: null,
      r1UnitId: null,
      r2UnitId: null,
      p1UnitId: null,
      p2UnitId: null,
      selectedTestIds: ['AHT'],
    };

    service.checkInUnit(request).subscribe(result => {
      expect(result.batchId).toBe('B1');
      expect(result.unitId).toBe('U1');
      expect(result.testsAssigned).toBe(3);
    });

    const req = httpMock.expectOne(r => r.url.includes('check-in'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.contractId).toBe('C1');
    req.flush({ success: true, item: mockResponse });
  });

  it('should validate unit', () => {
    const mockResult = { isValid: true, isDuplicate: false, isDuplicateOsUnit: false, codeScheme: 'I' };

    service.validateUnit('U1', 'C1').subscribe(result => {
      expect(result.isValid).toBeTrue();
      expect(result.isDuplicate).toBeFalse();
    });

    const req = httpMock.expectOne(r => r.url.includes('validate-unit/U1') && r.params.get('contractId') === 'C1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockResult });
  });
});
