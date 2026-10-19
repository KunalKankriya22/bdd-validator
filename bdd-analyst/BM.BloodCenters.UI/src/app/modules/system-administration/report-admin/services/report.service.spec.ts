import { TestBed } from '@angular/core/testing';
import { ReportService } from './report.service';
import { Report, ReportParameter } from '../models/report.model';
import { ApiService } from '@shared/services/api.service';
import { of } from 'rxjs';

describe('ReportService', () => {
  let service: ReportService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ReportService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReportService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAvailableParameters', () => {
    it('should return available parameters', (done) => {
      const mockData = [
        {
          parameterCode: 'ABO',
          prompt: 'ABO Prompt',
          description: 'ABORH',
          parameterType: 'CHAR',
          isUpper: true,
          isList: false,
          referenceTable: '',
          referenceColumn: '',
          defaultValue: '',
          listFormName: ''
        }
      ];

      apiService.get.and.returnValue(of(mockData));

      service.getAvailableParameters().subscribe(params => {
        expect(params.length).toBe(1);
        expect(params[0].parameterCode).toBe('ABO');
        expect(params[0].parameterType).toBe('CHAR');
        done();
      });
    });

    it('should normalize parameter types', (done) => {
      const mockData = [
        { parameterCode: 'TEST1', parameterType: 'NUMBER', description: 'Test' },
        { parameterCode: 'TEST2', parameterType: 'CHARACTER', description: 'Test' },
        { parameterCode: 'TEST3', parameterType: 'NUMERIC', description: 'Test' }
      ];

      apiService.get.and.returnValue(of(mockData));

      service.getAvailableParameters().subscribe(params => {
        expect(params[0].parameterType).toBe('NUMBER');
        expect(params[1].parameterType).toBe('CHAR');
        expect(params[2].parameterType).toBe('NUMBER');
        done();
      });
    });
  });

  describe('getReportNames', () => {
    it('should return list of report names', (done) => {
      const mockData = [
        { reportName: 'REP001', title: 'Test Report 1' },
        { reportName: 'REP002', title: 'Test Report 2' }
      ];

      apiService.get.and.returnValue(of(mockData));

      service.getReportNames().subscribe(reports => {
        expect(reports.length).toBe(2);
        expect(reports[0].id).toBe('REP001');
        expect(reports[0].title).toBe('Test Report 1');
        done();
      });
    });
  });

  describe('getReportDetails', () => {
    it('should return report details', (done) => {
      const mockData = {
        appId: 'APP123',
        title: 'Test Report',
        subtitle: 'Test Subtitle',
        reportType: 'Standard',
        formsType: 'PDF'
      };

      apiService.get.and.returnValue(of(mockData));

      service.getReportDetails('REP001').subscribe(details => {
        expect(details.appId).toBe('APP123');
        expect(details.title).toBe('Test Report');
        done();
      });
    });
  });

  describe('getAssignedParameters', () => {
    it('should return assigned parameters for a report', (done) => {
      const mockData = [
        { parameterCode: 'ABO', parameterNumber: 1 },
        { parameterCode: 'AGE', parameterNumber: 2 }
      ];

      apiService.get.and.returnValue(of(mockData));

      service.getAssignedParameters('REP001').subscribe(params => {
        expect(params.length).toBe(2);
        expect(params[0].parameterCode).toBe('ABO');
        done();
      });
    });
  });

  describe('saveReportParameterDefinitions', () => {
    it('should save report parameter definitions', (done) => {
      const mockParams: ReportParameter[] = [
        {
          parameterCode: 'ABO',
          prompt: 'ABO Prompt',
          description: 'ABORH',
          parameterType: 'CHAR',
          isUpper: true,
          isList: false,
          referenceTable: '',
          referenceColumn: '',
          defaultValue: '',
          listFormName: ''
        }
      ];

      apiService.post.and.returnValue(of({ success: true }));

      service.saveReportParameterDefinitions('APP123', 'REP001', mockParams).subscribe(response => {
        expect(response.success).toBe(true);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getReportTypes', () => {
    it('should return hard-coded report types', () => {
      const types = service.getReportTypes();
      expect(types.length).toBe(4);
      expect(types).toEqual(['SQL', 'RPT', 'PC', 'SRW']);
    });
  });

  describe('getFormTypes', () => {
    it('should return list of form types from API', (done) => {
      const mockResponse = { data: [{ code: 'NORMAL' }, { code: 'LANDSCAPE' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getFormTypes().subscribe(types => {
        expect(types.length).toBe(2);
        expect(types).toEqual(['NORMAL', 'LANDSCAPE']);
        done();
      });
    });
  });
});
