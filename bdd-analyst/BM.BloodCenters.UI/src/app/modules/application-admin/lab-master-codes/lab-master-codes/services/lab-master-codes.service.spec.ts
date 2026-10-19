import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { LabMasterCodesService, MasterCodeListItem } from './lab-master-codes.service';

// Mock API Response interface for testing
interface MockApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
}

describe('LabMasterCodesService', () => {
  let service: LabMasterCodesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [LabMasterCodesService]
    });
    service = TestBed.inject(LabMasterCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

 it('should retrieve master code details and map items correctly', () => {
  const apiResponse = {
    items: [
      {
        codeType: 'MASTR',
        code: 'STFAC',
        codeDesc: 'Sample Transfer Facilities',
        sequence2: 0,
        sequence3: 0,
        effDate: '2018-05-13T00:00:00',
        auditKey: 1614627
      }
    ],
    total: 1
  };

  service.getLabMasterCodesByType('MASTR', 10, 0).subscribe(response => {
    expect(response.data.length).toBe(1);

    const item = response.data[0];
    expect(item.code).toBe('STFAC');
    expect(item.codeType).toBe('MASTR');
    expect(item.description).toBe('Sample Transfer Facilities');
    expect(item.sequence2).toBe(0);
    expect(item.sequence3).toBe(0);
    expect(response.total).toBe(1);
  });

  const req = httpMock.expectOne('/api/v1/lab-master-codes/MASTR/10/0');
  expect(req.request.method).toBe('POST');
  expect(req.request.body.code).toBe('MASTR');

  req.flush(apiResponse);
});


it('should retrieve master codes and map codeDesc to description', () => {
  const mockApiResponse: MockApiResponse<any> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        codeType: 'MASTR',
        codeDesc: 'Sample Transfer Facilities',
        sequence2: 5,
        sequence3: 10,
        effDate: '2018-05-13T00:00:00',
        auditKey: 1614627
      }
    ],
    total: 1
  };

  service.getMasterCodes(10, 0).subscribe(response => {
    expect(response.total).toBe(1);
    expect(response.data.length).toBe(1);

    const item = response.data[0];
    expect(item.codeType).toBe('MASTR');
    expect(item.description).toBe('Sample Transfer Facilities'); // ✅ mapping verified
    expect(item.sequence2).toBe(5);
    expect(item.sequence3).toBe(10);
    expect(item.changeControlFlag).toBeNull();
    expect(item.lastModifiedDate).toBeNull();
    expect(item.isActive).toBeTrue();
  });

  const req = httpMock.expectOne('/api/v1/lab-master-codes/10/0');
  expect(req.request.method).toBe('POST');

  req.flush(mockApiResponse);
});


it('should format dates as YYYY-MM-DD in filter payload for getMasterCodes', () => {
  const mockApiResponse: MockApiResponse<any> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [],
    total: 0
  };

  const testDate = new Date('2018-05-12T10:30:00');
  const filter = {
    effectiveDate: testDate,
    terminationDate: testDate,
    effectiveDatePeriod: 'AFTER' as const,
    terminationDatePeriod: 'BEFORE' as const
  };

  service.getMasterCodes(10, 0, filter).subscribe();

  const req = httpMock.expectOne('/api/v1/lab-master-codes/10/0');
  expect(req.request.method).toBe('POST');
  expect(req.request.body.effectiveDate).toBe('2018-05-12');
  expect(req.request.body.terminationDate).toBe('2018-05-12');
  expect(req.request.body.effectiveDatePeriod).toBe('AFTER');
  expect(req.request.body.terminationDatePeriod).toBe('BEFORE');

  req.flush(mockApiResponse);
});

it('should not include period fields in payload when they are undefined for getMasterCodes', () => {
  const mockApiResponse: MockApiResponse<any> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [],
    total: 0
  };

  const filter = {
    searchKeyword: 'test',
    effectiveDatePeriod: undefined,
    terminationDatePeriod: undefined
  };

  service.getMasterCodes(10, 0, filter).subscribe();

  const req = httpMock.expectOne('/api/v1/lab-master-codes/10/0');
  expect(req.request.method).toBe('POST');
  expect(req.request.body.searchKeyword).toBe('test');
  expect(req.request.body.effectiveDatePeriod).toBeUndefined();
  expect(req.request.body.terminationDatePeriod).toBeUndefined();

  req.flush(mockApiResponse);
});

it('should format dates as YYYY-MM-DD in filter payload for getLabMasterCodesByType', () => {
  const mockResponse = {
    items: [],
    total: 0
  };

  const testDate = new Date('2018-05-12T10:30:00');
  const filter = {
    effectiveDate: testDate,
    terminationDate: testDate,
    effectiveDatePeriod: 'AFTER' as const,
    terminationDatePeriod: 'BEFORE' as const
  };

  service.getLabMasterCodesByType('MASTR', 10, 0, filter).subscribe();

  const req = httpMock.expectOne('/api/v1/lab-master-codes/MASTR/10/0');
  expect(req.request.method).toBe('POST');
  expect(req.request.body.code).toBe('MASTR');
  expect(req.request.body.effectiveDate).toBe('2018-05-12');
  expect(req.request.body.terminationDate).toBe('2018-05-12');
  expect(req.request.body.effectiveDatePeriod).toBe('AFTER');
  expect(req.request.body.terminationDatePeriod).toBe('BEFORE');

  req.flush(mockResponse);
});


it('should map numericalValue correctly from API response in getLabMasterCodesByType', () => {
  const mockResponse = {
    items: [
      {
        codeType: 'MASTR',
        code: 'STFAC',
        codeDesc: 'Sample Transfer Facilities',
        numericalValue: 42.5,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        effDate: '2018-05-13T00:00:00',
        auditKey: 1614627
      }
    ],
    total: 1
  };

  service.getLabMasterCodesByType('MASTR', 10, 0).subscribe(response => {
    const item = response.data[0];
    expect(item.numericalValue).toBe(42.5);
    expect(item.sequence1).toBe(1);
    expect(item.sequence2).toBe(2);
    expect(item.sequence3).toBe(3);
  });

  const req = httpMock.expectOne('/api/v1/lab-master-codes/MASTR/10/0');
  req.flush(mockResponse);
});



});
