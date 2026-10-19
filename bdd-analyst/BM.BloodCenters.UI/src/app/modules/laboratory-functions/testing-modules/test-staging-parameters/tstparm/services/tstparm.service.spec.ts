import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TstparmService } from './tstparm.service';
import { environment } from 'src/environments/environment';
import {
  DropdownItem,
  ParmCodeDetail,
  AssignedParameter,
  BulkUpsertRequest,
  ApiResponse
} from '../models/tstparm.model';

describe('TstparmService', () => {
  let service: TstparmService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/api/v1/critical-controls-for-test`;

  const mockTestIds: DropdownItem[] = [
    { value: 'IAT', label: 'Indirect Antiglobulin Test' },
    { value: 'DAT', label: 'Direct Antiglobulin Test' }
  ];

  const mockParmTypes: DropdownItem[] = [
    { value: 'MAN', label: 'Manual' },
    { value: 'AUTO', label: 'Automated' }
  ];

  const mockParmCodes: ParmCodeDetail[] = [
    {
      parmCode: 'ABORH',
      description: 'Review Date',
      datatype: 'NUMERIC'
    },
    {
      parmCode: 'CEL',
      description: 'Celeste',
      datatype: 'NUMERIC'
    },
    {
      parmCode: 'ALT',
      description: 'BACT Instrument',
      datatype: 'NUMERIC',
      relatedCode: 'BACT'
    }
  ];

  const mockAssignedParameters: AssignedParameter[] = [
    {
      parmCode: 'ABORH',
      parmDesc: 'Review Date',
      datatype: 'NUMERIC',
      sequence: 1,
      acceptMin: 0,
      acceptMax: 10,
      effDate: '2025-01-11'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TstparmService]
    });

    service = TestBed.inject(TstparmService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestIdsDropdown', () => {
    it('should fetch test IDs dropdown', () => {
      service.getTestIdsDropdown().subscribe(tests => {
        expect(tests).toEqual(mockTestIds);
        expect(tests.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/test-ids/dropdown`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockTestIds, success: true });
    });
  });

  describe('getParmTypesDropdown', () => {
    it('should fetch parm types dropdown for a test ID', () => {
      const testId = 'IAT';

      service.getParmTypesDropdown(testId).subscribe(types => {
        expect(types).toEqual(mockParmTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/parm-types/dropdown/${testId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockParmTypes, success: true });
    });
  });

  describe('getAllParmCodes', () => {
    it('should fetch all parm codes', () => {
      service.getAllParmCodes().subscribe(codes => {
        expect(codes).toEqual(mockParmCodes);
        expect(codes.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/parm-codes/all`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockParmCodes, success: true });
    });
  });

  describe('getAssignedParameters', () => {
    it('should fetch assigned parameters for test and parm type', () => {
      const testId = 'IAT';
      const parmType = 'MAN';

      service.getAssignedParameters(testId, parmType).subscribe(params => {
        expect(params).toEqual(mockAssignedParameters);
      });

      const req = httpMock.expectOne(`${baseUrl}/list`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ testId, parmType });
      req.flush({ data: mockAssignedParameters, success: true });
    });
  });

  describe('saveTestConfiguration', () => {
    it('should save test configuration', () => {
      const request: BulkUpsertRequest = {
        testId: 'IAT',
        parmType: 'MAN',
        tech1Reqd: 'Y',
        tech2Reqd: 'N',
        records: [
          {
            parmCode: 'ABORH',
            sequence: 1,
            acceptMin: '0',
            acceptMax: '10',
            effDate: '2025-01-01',
            isNew: false
          }
        ]
      };

      const mockResponse: ApiResponse = {
        success: true,
        message: 'Test configuration saved successfully'
      };

      service.saveTestConfiguration(request).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteParameter', () => {
    it('should delete a parameter', () => {
      const testId = 'IAT';
      const parmType = 'MAN';
      const parmCode = 'ABORH';

      const mockResponse: ApiResponse = {
        success: true,
        message: 'Parameter deleted successfully'
      };

      service.deleteParameter(testId, parmType, parmCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${baseUrl}/${testId}/${parmType}/${parmCode}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
