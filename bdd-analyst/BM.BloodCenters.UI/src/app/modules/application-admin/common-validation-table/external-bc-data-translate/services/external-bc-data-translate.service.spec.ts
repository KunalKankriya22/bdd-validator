import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ExternalBcDataTranslateService } from './external-bc-data-translate.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ExternalBcDataTranslateModel,
  ExternalBcDataTranslateParamsDto,
  ExternalBcDataTranslateDto,
  UpdateExternalBcDataTranslateDto,
  ExternalBcDataTranslateDropdownsResponse,
  SourceCodeDescriptionResponse
} from '../models/external-bc-data-translate.model';

describe('ExternalBcDataTranslateService', () => {
  let service: ExternalBcDataTranslateService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ExternalBcDataTranslateService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ExternalBcDataTranslateService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getExternalBcDataTranslate', () => {
    it('should fetch external BC data translate list with correct parameters', (done) => {
      const mockData: ExternalBcDataTranslateModel[] = [
        {
          convRefValueId: 1,
          sourceId: 'VISTA',
          targetId: 'LFTRK',
          sourceCodeType: 'TYPE1',
          targetCodeType: 'TYPE2',
          sourceValue: 'VALUE1',
          targetValue: 'VALUE2',
          sourceColumn: 'COL1',
          effDate: '2024-01-01',
          termDate: null,
          convProcCall: '1'
        }
      ];

      const mockResponse = {
        success: true,
        message: 'Success',
        data: mockData,
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      const params: ExternalBcDataTranslateParamsDto = {
        searchKeyword: 'test',
        sourceCodeType: 'TYPE1',
        targetCodeType: 'TYPE2',
        sort: 'A'
      };

      service.getExternalBcDataTranslate(10, 0, 'VISTA', 'LFTRK', params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockData);
          expect(result.totalRecords).toBe(1);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE(10, 0, 'VISTA', 'LFTRK'),
            params
          );
          done();
        },
        error: done.fail
      });
    });


    it('should handle error when fetching data', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.post.and.returnValue(throwError(() => mockError));

      service.getExternalBcDataTranslate(10, 0, 'VISTA', 'LFTRK', {}).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('getDropdowns', () => {
    it('should fetch dropdown options successfully', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: ['VISTA', 'LFTRK'],
        targetIds: ['LFTRK'],
        sourceCodeTypes: ['TYPE1', 'TYPE2'],
        targetCodeTypes: ['TYPE3', 'TYPE4'],
        targetValues: ['VALUE1', 'VALUE2']
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getDropdowns().subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_DROPDOWNS
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when fetching dropdowns', (done) => {
      const mockError = { status: 404, message: 'Not found' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getDropdowns().subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('getSourceCodeDescription', () => {
    it('should fetch source code description successfully', (done) => {
      const mockResponse: SourceCodeDescriptionResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          code: 'TYPE1',
          description: 'Type 1 Description'
        },
        total: 1,
        errorResponse: {
          errorCode: '',
          error: ''
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getSourceCodeDescription('TYPE1').subscribe({
        next: (result) => {
          expect(result).toEqual('Type 1 Description');
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_SOURCE_CODE_DESCRIPTION('TYPE1')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when fetching source code description', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getSourceCodeDescription('TYPE1').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('addConversionCode', () => {
    it('should add conversion code successfully', (done) => {
      const payload: ExternalBcDataTranslateDto = {
        sourceId: 'VISTA',
        targetId: 'LFTRK',
        sourceCodeType: 'TYPE1',
        targetCodeType: 'TYPE2',
        sourceValue: 'VALUE1',
        targetValue: 'VALUE2',
        sourceTable: 'TABLE1',
        sourceColumn: 'COL1',
        targetTable: 'TABLE2',
        targetColumn: 'COL2',
        conversionComment: 'Test comment',
        effDate: '2024-01-01',
        termDate: '2024-12-31',
        convProcCall: '1'
      };

      const mockResponse = { success: true, message: 'Added successfully' };
      apiService.post.and.returnValue(of(mockResponse));

      service.addConversionCode(payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.post).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.ADD_EXTERNAL_BC_DATA_TRANSLATE,
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when adding conversion code', (done) => {
      const payload: ExternalBcDataTranslateDto = {
        sourceId: 'VISTA',
        targetId: 'LFTRK',
        sourceCodeType: 'TYPE1',
        targetCodeType: 'TYPE2',
        sourceValue: 'VALUE1',
        targetValue: 'VALUE2',
        effDate: '2024-01-01'
      };

      const mockError = { status: 409, message: 'Conflict' };
      apiService.post.and.returnValue(throwError(() => mockError));

      service.addConversionCode(payload).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('updateConversionCode', () => {
    it('should update conversion code successfully', (done) => {
      const payload: UpdateExternalBcDataTranslateDto = {
        sourceId: 'VISTA',
        targetId: 'LFTRK',
        oldSourceCodeType: 'TYPE1',
        oldSourceValue: 'VALUE1',
        oldTargetCodeType: 'TYPE2',
        oldTargetValue: 'VALUE2',
        sourceCodeType: 'TYPE1_NEW',
        targetCodeType: 'TYPE2_NEW',
        sourceValue: 'VALUE1_NEW',
        targetValue: 'VALUE2_NEW',
        sourceTable: 'TABLE1',
        sourceColumn: 'COL1',
        targetTable: 'TABLE2',
        targetColumn: 'COL2',
        conversionComment: 'Updated comment',
        effDate: '2024-01-01',
        termDate: '2024-12-31',
        convProcCall: '2'
      };

      const mockResponse = { success: true, message: 'Updated successfully' };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateConversionCode(payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.put).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.UPDATE_EXTERNAL_BC_DATA_TRANSLATE,
            payload
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when updating conversion code', (done) => {
      const payload: UpdateExternalBcDataTranslateDto = {
        sourceId: 'VISTA',
        targetId: 'LFTRK',
        oldSourceCodeType: 'TYPE1',
        oldSourceValue: 'VALUE1',
        oldTargetCodeType: 'TYPE2',
        oldTargetValue: 'VALUE2',
        sourceCodeType: 'TYPE1',
        targetCodeType: 'TYPE2',
        sourceValue: 'VALUE1',
        targetValue: 'VALUE2',
        effDate: '2024-01-01'
      };

      const mockError = { status: 404, message: 'Not found' };
      apiService.put.and.returnValue(throwError(() => mockError));

      service.updateConversionCode(payload).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('getFilterDropdowns', () => {
    it('should fetch filter dropdown options with sourceId and targetId parameters', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['DON', 'PROD'],
        targetCodeTypes: ['DON', 'UNIT'],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(result.sourceCodeTypes.length).toBe(2);
          expect(result.targetCodeTypes.length).toBe(2);
          expect(result.sourceIds.length).toBe(0);
          expect(result.targetIds.length).toBe(0);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('VISTA', 'LFTRK')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should fetch filter dropdowns with ALL as sourceId when no source is selected', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['DON'],
        targetCodeTypes: ['DON'],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('ALL', 'LFTRK').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('ALL', 'LFTRK')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle empty response when fetching filter dropdowns', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: [],
        targetCodeTypes: [],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(result.sourceCodeTypes).toEqual([]);
          expect(result.targetCodeTypes).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when fetching filter dropdowns', (done) => {
      const mockError = { status: 404, message: 'Not found' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should call different endpoint than getDropdowns', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['DON'],
        targetCodeTypes: ['DON'],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('VISTA', 'LFTRK')
          );
          expect(apiService.get).not.toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_DROPDOWNS
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle special characters in sourceId parameter', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['DON'],
        targetCodeTypes: ['DON'],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('SOURCE/WITH&SPECIAL', 'LFTRK').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('SOURCE/WITH&SPECIAL', 'LFTRK')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle special characters in targetId parameter', (done) => {
      const mockDropdowns: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: [],
        targetCodeTypes: [],
        targetValues: []
      };

      apiService.get.and.returnValue(of(mockDropdowns));

      service.getFilterDropdowns('VISTA', 'TARGET#123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDropdowns);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('VISTA', 'TARGET#123')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should make separate calls when invoked multiple times with different parameters', (done) => {
      const mockDropdowns1: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['DON'],
        targetCodeTypes: ['DON'],
        targetValues: []
      };

      const mockDropdowns2: ExternalBcDataTranslateDropdownsResponse = {
        sourceIds: [],
        targetIds: [],
        sourceCodeTypes: ['PROD'],
        targetCodeTypes: ['UNIT'],
        targetValues: []
      };

      apiService.get.and.returnValues(of(mockDropdowns1), of(mockDropdowns2));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: (result1) => {
          expect(result1).toEqual(mockDropdowns1);

          service.getFilterDropdowns('ALL', 'MEDIC').subscribe({
            next: (result2) => {
              expect(result2).toEqual(mockDropdowns2);
              expect(apiService.get).toHaveBeenCalledTimes(2);
              expect(apiService.get).toHaveBeenCalledWith(
                API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('VISTA', 'LFTRK')
              );
              expect(apiService.get).toHaveBeenCalledWith(
                API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_FILTER_DROPDOWNS('ALL', 'MEDIC')
              );
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });
    });

    it('should handle network timeout errors gracefully', (done) => {
      const timeoutError = { status: 0, statusText: 'Unknown Error', message: 'Network timeout' };
      apiService.get.and.returnValue(throwError(() => timeoutError));

      service.getFilterDropdowns('VISTA', 'LFTRK').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(timeoutError);
          done();
        }
      });
    });
  });

  describe('getTargetValuesByCodeType', () => {
    it('should fetch target values by code type successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: [
          { value: 'VALUE1', description: 'Description 1' },
          { value: 'VALUE2', description: 'Description 2' },
          { value: 'VALUE3', description: 'Description 3' }
        ],
        total: 3
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTargetValuesByCodeType('TYPE1').subscribe({
        next: (result) => {
          expect(result).toEqual([
            { code: 'VALUE1', description: 'Description 1' },
            { code: 'VALUE2', description: 'Description 2' },
            { code: 'VALUE3', description: 'Description 3' }
          ]);
          expect(apiService.get).toHaveBeenCalledWith(
            API.APPLICATION_ADMIN.EXTERNAL_BC_DATA_TRANSLATE_TARGET_VALUES_BY_CODE_TYPE('TYPE1')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when response data is undefined', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        data: undefined,
        total: 0
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getTargetValuesByCodeType('TYPE1').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should handle error when fetching target values by code type', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getTargetValuesByCodeType('TYPE1').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });
});
