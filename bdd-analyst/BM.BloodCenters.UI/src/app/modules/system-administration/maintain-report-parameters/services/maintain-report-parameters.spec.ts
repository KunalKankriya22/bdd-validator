import { TestBed } from '@angular/core/testing';
import { ReportParameterService } from '../services/maintain-report-parameters';
import { ApiService } from '../../../../shared/services/api.service';
import { of } from 'rxjs';
import { ReportParameter } from '../models/report-parameter.model';
import { ReportParameterFilterMeta } from '../models/report-parameter-filter-meta.model';
import { CodeType } from '../models/code-type.model';

describe('ReportParameterService', () => {
  let service: ReportParameterService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj<ApiService>('ApiService', [
      'get',
      'post',
      'put'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ReportParameterService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ReportParameterService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  /* =========================
     GET ALL
  ========================= */

  it('should fetch report parameters', () => {
    const mockResponse: ReportParameter[] = [
      {
        parameterCode: 'AGE',
        description: 'Age',
        prompt: 'Enter Age',
        parameterType: 'NUMBER',
        isUpper: false,
        isList: false
      } as ReportParameter
    ];

    apiServiceSpy.get.and.returnValue(of(mockResponse));

    service.getReportParameters().subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters'
    );
  });

  /* =========================
     GET PARAMETER TYPES
  ========================= */

  it('should fetch parameter types', () => {
    const mockMeta: ReportParameterFilterMeta = {
      parameterTypes: ['CHAR', 'NUMBER', 'DATE'],
      isUpperValues: [true, false],
      isListValues: [true, false]
    };

    apiServiceSpy.get.and.returnValue(of(mockMeta));

    service.getParameterTypes().subscribe(result => {
      expect(result).toEqual(mockMeta);
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters/parameter-types'
    );
  });

  /* =========================
     GET CODE TYPES
  ========================= */

  it('should fetch code types from RMREPCD', () => {
    const mockCodeTypes: CodeType[] = [
      { code: 'CHAR', description: 'Character' },
      { code: 'NUMBER', description: 'Number' },
      { code: 'DATE', description: 'Date' },
      { code: 'DATETM', description: 'Date Time' },
      { code: 'ODATE', description: 'Oracle Date' }
    ];

    apiServiceSpy.get.and.returnValue(of(mockCodeTypes));

    service.getCodeTypes().subscribe(result => {
      expect(result).toEqual(mockCodeTypes);
      expect(result.length).toBe(5);
    });

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters/code-types'
    );
  });

  /* =========================
     SEARCH / FILTER
  ========================= */

  it('should search with only valid query params', () => {
    apiServiceSpy.get.and.returnValue(of([]));

    service.search({
      keyword: '',
      parameterType: 'CHAR',
      isUpper: null,
      isList: true
    }).subscribe();

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters/search',
      jasmine.objectContaining({
        params: jasmine.objectContaining({
          parameterType: 'CHAR',
          isList: true
        })
      })
    );
  });

  it('should search with all params when all are valid', () => {
    apiServiceSpy.get.and.returnValue(of([]));

    service.search({
      keyword: 'AGE',
      parameterType: 'NUMBER',
      isUpper: true,
      isList: false
    }).subscribe();

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters/search',
      jasmine.objectContaining({
        params: jasmine.objectContaining({
          keyword: 'AGE',
          parameterType: 'NUMBER',
          isUpper: true,
          isList: false
        })
      })
    );
  });

  /* =========================
     CREATE
  ========================= */

  it('should create report parameter', () => {
    const payload = {
      parameterCode: 'AGE',
      description: 'Age',
      prompt: 'Enter Age',
      parameterType: 'NUMBER',
      isUpper: false,
      isList: false
    } as ReportParameter;

    apiServiceSpy.post.and.returnValue(of(payload));

    service.create(payload).subscribe(result => {
      expect(result).toEqual(payload);
    });

    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters',
      payload
    );
  });

  /* =========================
     UPDATE
  ========================= */

  it('should update report parameter', () => {
    const payload = {
      description: 'Updated Age',
      prompt: 'Enter Updated Age',
      parameterType: 'NUMBER',
      isUpper: false,
      isList: false
    } as ReportParameter;

    apiServiceSpy.put.and.returnValue(of(payload));

    service.update('AGE', payload).subscribe(result => {
      expect(result).toEqual(payload);
    });

    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      'api/v1/system-admin/report-parameters/AGE',
      payload
    );
  });
});
