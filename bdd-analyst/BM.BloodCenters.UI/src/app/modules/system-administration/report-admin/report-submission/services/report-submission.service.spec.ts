import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportSubmissionService } from './report-submission.service';
import { API } from '@core/constants/api.constants';
import {
  ReportNameOption,
  ReportInfoDto,
  ReportParmDefinitionDto,
  SubmitReportPayload,
  ScheduleReportPayload,
  ApiResponse,
  ParameterLovItemDto,
  GenerateParmIdResponse,
  ValidateParameterRequest,
  ValidateParameterResponse,
} from '../models/report-submission.model';

describe('ReportSubmissionService', () => {
  let service: ReportSubmissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportSubmissionService],
    });
    service = TestBed.inject(ReportSubmissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getReportNames', () => {
    it('should fetch report names', () => {
      const mockReportNames: ReportNameOption[] = [
        { reportName: 'SPONSOR_MGMT', title: 'Sponsor Management' },
        { reportName: 'DONOR_LIST', title: 'Donor List Report' },
      ];

      service.getReportNames().subscribe((names) => {
        expect(names.length).toBe(2);
        expect(names).toEqual(mockReportNames);
      });

      const req = httpMock.expectOne(API.REPORTS.REPORT_NAMES);
      expect(req.request.method).toBe('GET');
      req.flush(mockReportNames);
    });
  });
  describe('getReportDetails', () => {
    it('should fetch report details with parameters', () => {
      const reportName = 'SPONSOR_MGMT';
      const mockReportInfo: ApiResponse<ReportInfoDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          reportName: 'SPONSOR_MGMT',
          reportType: 'LIST',
          title: 'Sponsor Management Report',
          subtitle: 'List of all sponsors',
          printId: 'PRINT01',
          formsType: 'PDF',
          batchQueue: 'BATCH1',
        },
      };

      const mockParmDefs: ApiResponse<ReportParmDefinitionDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            parmNo: 1,
            parmCode: 'START_DATE',
            parmPrompt: 'Start Date',
            codeType: 'DATE',
            defaultValue: '',
            listEntryFlag: 'N',
            lovItems: [],
          },
          {
            parmNo: 2,
            parmCode: 'LOCATION',
            parmPrompt: 'Location',
            codeType: 'LIST',
            defaultValue: 'all',
            listEntryFlag: 'Y',
            lovItems: [
              { code: 'LOC1', description: 'Location 1' },
              { code: 'LOC2', description: 'Location 2' },
            ],
          },
        ],
      };

      service.getReportDetails(reportName).subscribe((detail) => {
        expect(detail.reportName).toBe('SPONSOR_MGMT');
        expect(detail.title).toBe('Sponsor Management Report');
        expect(detail.parameters.length).toBe(2);
        expect(detail.parameters[0].codeType).toBe('DATE');
        expect(detail.parameters[1].isMultiSelect).toBe(true);
        expect(detail.parameters[1].options.length).toBe(2);
      });

      const reqInfo = httpMock.expectOne(API.REPORTS.REPORT_INFO(reportName));
      expect(reqInfo.request.method).toBe('GET');
      reqInfo.flush(mockReportInfo);

      const reqParms = httpMock.expectOne(API.REPORTS.PARM_DEFINITIONS(reportName));
      expect(reqParms.request.method).toBe('GET');
      reqParms.flush(mockParmDefs);
    });

    it('should handle multi-select when defaultValue is "all"', () => {
      const reportName = 'TEST_REPORT';
      const mockReportInfo: ApiResponse<ReportInfoDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          reportName: 'TEST_REPORT',
          title: 'Test Report',
        },
      };

      const mockParmDefs: ApiResponse<ReportParmDefinitionDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            parmNo: 1,
            parmCode: 'TEST_PARAM',
            parmPrompt: 'Test Parameter',
            codeType: 'CHAR',
            defaultValue: 'all',
            listEntryFlag: 'N',
            lovItems: [],
          },
        ],
      };

      service.getReportDetails(reportName).subscribe((detail) => {
        expect(detail.parameters[0].isMultiSelect).toBe(true);
      });

      httpMock.expectOne(API.REPORTS.REPORT_INFO(reportName)).flush(mockReportInfo);
      httpMock.expectOne(API.REPORTS.PARM_DEFINITIONS(reportName)).flush(mockParmDefs);
    });

    it('should use code as description for pre-loaded LOV items when description is empty', () => {
      const reportName = 'TEST_REPORT';
      const mockReportInfo: ApiResponse<ReportInfoDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          reportName: 'TEST_REPORT',
          title: 'Test Report',
        },
      };

      const mockParmDefs: ApiResponse<ReportParmDefinitionDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            parmNo: 1,
            parmCode: 'LOCATION',
            parmPrompt: 'Location',
            codeType: 'LIST',
            defaultValue: '',
            listEntryFlag: 'N',
            lovItems: [
              { code: 'FDLC', description: '' },
              { code: 'FUTEF', description: null as any },
              { code: 'HAGNT', description: 'Has Description' },
            ],
          },
        ],
      };

      service.getReportDetails(reportName).subscribe((detail) => {
        expect(detail.parameters[0].options.length).toBe(3);
        expect(detail.parameters[0].options[0].code).toBe('FDLC');
        expect(detail.parameters[0].options[0].description).toBe('FDLC'); // Should use code as fallback
        expect(detail.parameters[0].options[1].code).toBe('FUTEF');
        expect(detail.parameters[0].options[1].description).toBe('FUTEF'); // Should use code as fallback
        expect(detail.parameters[0].options[2].code).toBe('HAGNT');
        expect(detail.parameters[0].options[2].description).toBe('Has Description'); // Should keep original
      });

      httpMock.expectOne(API.REPORTS.REPORT_INFO(reportName)).flush(mockReportInfo);
      httpMock.expectOne(API.REPORTS.PARM_DEFINITIONS(reportName)).flush(mockParmDefs);
    });
  });

  describe('getParameterLovItems', () => {
    it('should fetch LOV items for a parameter', () => {
      const parmCode = 'LOCATION';
      const mockResponse: ApiResponse<ParameterLovItemDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'LOC1', description: 'Location 1' },
          { code: 'LOC2', description: 'Location 2' },
        ],
      };

      service.getParameterLovItems(parmCode).subscribe((items) => {
        expect(items.length).toBe(2);
        expect(items[0].code).toBe('LOC1');
      });

      const req = httpMock.expectOne((r) => r.url === API.REPORTS.PARM_LOV(parmCode));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include search term as query parameter', () => {
      const parmCode = 'LOCATION';
      const searchTerm = 'test';

      service.getParameterLovItems(parmCode, searchTerm).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === API.REPORTS.PARM_LOV(parmCode) && r.params.get('searchTerm') === searchTerm
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: 'Success', statusCode: 200, data: [] });
    });


    it('should use code as description when description is empty', () => {
      const parmCode = 'LOCATION';
      const mockResponse: ApiResponse<ParameterLovItemDto> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'FDLC', description: '' },
          { code: 'FUTEF', description: null as any },
          { code: 'HAGNT', description: 'Has Description' },
        ],
      };

      service.getParameterLovItems(parmCode).subscribe((items) => {
        expect(items.length).toBe(3);
        expect(items[0].code).toBe('FDLC');
        expect(items[0].description).toBe('FDLC'); // Should use code as fallback
        expect(items[1].code).toBe('FUTEF');
        expect(items[1].description).toBe('FUTEF'); // Should use code as fallback
        expect(items[2].code).toBe('HAGNT');
        expect(items[2].description).toBe('Has Description'); // Should keep original
      });

      const req = httpMock.expectOne((r) => r.url === API.REPORTS.PARM_LOV(parmCode));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getParameterLovPaginated', () => {
    it('should fetch paginated LOV items', () => {
      const parmCode = 'LOCATION';
      const mockResponse = {
        items: [
          { code: 'LOC1', description: 'Location 1' },
          { code: 'LOC2', description: 'Location 2' },
        ],
        totalCount: 2,
        hasMore: false,
        metadata: { isPaginated: true },
      };

      service.getParameterLovPaginated(parmCode, '', 0, 50).subscribe((result) => {
        expect(result.items.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result.isPaginated).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === API.REPORTS.PARM_LOV(parmCode));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('skip')).toBe('0');
      expect(req.request.params.get('take')).toBe('50');
      req.flush(mockResponse);
    });

    it('should use code as description when description is empty in paginated results', () => {
      const parmCode = 'LOCATION';
      const mockResponse = {
        items: [
          { code: 'FDLC', description: '' },
          { code: 'FUTEF', description: null },
          { code: 'HAGNT', description: 'Has Description' },
        ],
        totalCount: 3,
        hasMore: false,
        metadata: { isPaginated: true },
      };

      service.getParameterLovPaginated(parmCode, '', 0, 50).subscribe((result) => {
        expect(result.items.length).toBe(3);
        expect(result.items[0].code).toBe('FDLC');
        expect(result.items[0].description).toBe('FDLC'); // Should use code as fallback
        expect(result.items[1].code).toBe('FUTEF');
        expect(result.items[1].description).toBe('FUTEF'); // Should use code as fallback
        expect(result.items[2].code).toBe('HAGNT');
        expect(result.items[2].description).toBe('Has Description'); // Should keep original
      });

      const req = httpMock.expectOne((r) => r.url === API.REPORTS.PARM_LOV(parmCode));
      req.flush(mockResponse);
    });

    it('should include search term and selected items in query params', () => {
      const parmCode = 'LOCATION';
      const searchTerm = 'test';
      const includeSelected = ['LOC1', 'LOC2'];

      service.getParameterLovPaginated(parmCode, searchTerm, 10, 20, includeSelected).subscribe();

      const req = httpMock.expectOne((r) =>
        r.url === API.REPORTS.PARM_LOV(parmCode) &&
        r.params.get('searchTerm') === searchTerm &&
        r.params.get('includeSelected') === 'LOC1,LOC2' &&
        r.params.get('skip') === '10' &&
        r.params.get('take') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, hasMore: false, metadata: { isPaginated: true } });
    });

    it('should return empty result on error', () => {
      const parmCode = 'INVALID';

      service.getParameterLovPaginated(parmCode, '', 0, 50).subscribe((result) => {
        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.hasMore).toBe(false);
        expect(result.isPaginated).toBe(false);
      });

      const req = httpMock.expectOne((r) => r.url === API.REPORTS.PARM_LOV(parmCode));
      req.error(new ProgressEvent('error'));
    });
  });

  describe('submitReport', () => {
    it('should submit report with correct payload', () => {
      const payload: SubmitReportPayload = {
        reportName: 'SPONSOR_MGMT',
        parmId: 'TEST_USER_052626_001',
        printId: 'PRINT01',
        formsType: 'PDF',
        autoPrint: true,
        printHeaderTrailer: false,
        deleteAfterPrint: false,
        noOfCopies: 2,
        parameters: [
          { parmNo: 1, parmSelect: '05-23-2026', parmCode: 'START_DATE' },
        ],
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          jobId: 'JOB123',
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          status: 'SUBMITTED',
          message: 'Success',
        },
      };

      service.submitReport(payload).subscribe((response) => {
        expect(response.jobId).toBe('JOB123');
        expect(response.status).toBe('SUBMITTED');
      });

      const req = httpMock.expectOne(API.REPORTS.SUBMIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.reportName).toBe('SPONSOR_MGMT');
      expect(req.request.body.autoPrintFlag).toBe('Y');
      expect(req.request.body.headerAndTrailerFlag).toBe('N');
      expect(req.request.body.noOfCopies).toBe(2);
      expect(req.request.body.startTime).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('scheduleReport', () => {
    it('should schedule report with startTime', () => {
      const payload: ScheduleReportPayload = {
        reportName: 'SPONSOR_MGMT',
        parmId: 'TEST_USER_052626_001',
        printId: 'PRINT01',
        formsType: 'PDF',
        autoPrint: false,
        printHeaderTrailer: true,
        deleteAfterPrint: false,
        noOfCopies: 1,
        parameters: [],
        startTime: '2026-05-27T10:00:00',
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          jobId: 'JOB456',
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          status: 'SCHEDULED',
          message: 'Success',
        },
      };

      service.scheduleReport(payload).subscribe((response) => {
        expect(response.jobId).toBe('JOB456');
        expect(response.status).toBe('SCHEDULED');
      });

      const req = httpMock.expectOne(API.REPORTS.SUBMIT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.startTime).toBeTruthy();
      expect(req.request.body.headerAndTrailerFlag).toBe('Y');
      req.flush(mockResponse);
    });
  });

  describe('validateParameter', () => {
    it('should validate parameter value', () => {
      const parmCode = 'START_DATE';
      const value = '052326';
      const mockResponse: ApiResponse<ValidateParameterResponse> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          isValid: true,
          message: 'Valid',
          formattedValue: '05-23-2026',
        },
      };

      service.validateParameter(parmCode, value).subscribe((response) => {
        expect(response.isValid).toBe(true);
        expect(response.formattedValue).toBe('05-23-2026');
      });

      const req = httpMock.expectOne(API.REPORTS.VALIDATE_PARAMETER(parmCode));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.value).toBe('052326');
      expect(req.request.body.allowWildcard).toBe(false);
      req.flush(mockResponse);
    });

    it('should support wildcard validation', () => {
      const parmCode = 'TEST_PARAM';
      const value = '*';

      service.validateParameter(parmCode, value, true).subscribe();

      const req = httpMock.expectOne(API.REPORTS.VALIDATE_PARAMETER(parmCode));
      expect(req.request.body.allowWildcard).toBe(true);
      req.flush({
        success: true,
        message: 'Success',
        statusCode: 200,
        item: { isValid: true, message: 'Valid' },
      });
    });
  });

  describe('deleteParameterSet', () => {
    it('should delete parameter set', () => {
      const reportName = 'SPONSOR_MGMT';
      const parmId = 'TEST_USER_052626_001';

      service.deleteParameterSet(reportName, parmId).subscribe();

      const req = httpMock.expectOne(API.REPORTS.DELETE_PARM(reportName, parmId));
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('getReportStatus', () => {
    it('should fetch report job status', () => {
      const reportName = 'SPONSOR_MGMT';
      const parmId = 'TEST_USER_052626_001';
      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          parmId: 'TEST_USER_052626_001',
          reportName: 'SPONSOR_MGMT',
          statusCode: 'COMPLETED',
          statusMessage: 'Report generated successfully',
          queued: new Date('2026-05-26T10:00:00Z'),
        },
      };

      service.getReportStatus(reportName, parmId).subscribe((status) => {
        expect(status.statusCode).toBe('COMPLETED');
        expect(status.reportName).toBe('SPONSOR_MGMT');
      });

      const req = httpMock.expectOne(API.REPORTS.REPORT_STATUS(reportName, parmId));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
