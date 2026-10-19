import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { ParameterDefinitionService } from './parameter-definition.service';
import {
  ParameterDefinitionDto,
  CreateParameterDefinitionDto,
  UpdateParameterDefinitionDto
} from '../interfaces/parameter-definition.interface';

describe('ParameterDefinitionService', () => {
  let service: ParameterDefinitionService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockParameter: ParameterDefinitionDto = {
    procCode: 'TEST_PROC',
    parmNo: 1,
    parmCode: 'PARAM1',
    parmType: 'CHAR',
    refTable: 'TEST_TABLE',
    refColumn: 'TEST_COLUMN',
    defaultValue: 'test',
    parmInout: 'IN'
  };

  const mockParameters: ParameterDefinitionDto[] = [
    mockParameter,
    {
      procCode: 'TEST_PROC',
      parmNo: 2,
      parmCode: 'PARAM2',
      parmType: 'NUM',
      refTable: 'TABLE2',
      refColumn: 'COL2',
      defaultValue: '100',
      parmInout: 'IN'
    }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ParameterDefinitionService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ParameterDefinitionService);
  });

  describe('getParameters', () => {
    it('should fetch parameters successfully with array response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockParameters,
        total: 2
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getParameters('TEST_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual(mockParameters);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle single object response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockParameter,
        total: 1
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getParameters('TEST_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual([mockParameter]);
          done();
        }
      });
    });

    it('should handle null data response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: null,
        total: 0
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getParameters('TEST_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should handle empty array response', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getParameters('TEST_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });


  });

  describe('createParameter', () => {
    it('should create parameter successfully', (done) => {
      const payload: CreateParameterDefinitionDto = {
        procCode: 'TEST_PROC',
        parmNo: 1,
        parmCode: 'NEW_PARAM',
        parmType: 'CHAR',
        refTable: 'REF_TABLE',
        refColumn: 'REF_COL',
        defaultValue: 'default'
      };

      const mockResponse = {
        success: true,
        message: 'Parameter created successfully',
        statusCode: 201
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.createParameter(payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.post).toHaveBeenCalledWith(
            jasmine.any(String),
            payload
          );
          done();
        }
      });
    });

  });

  describe('updateParameter', () => {
    it('should update parameter successfully', (done) => {
      const payload: UpdateParameterDefinitionDto = {
        procCode: 'TEST_PROC',
        parmNo: 1,
        parmCode: 'UPDATED_PARAM',
        parmType: 'NUM',
        refTable: 'NEW_TABLE',
        refColumn: 'NEW_COL',
        defaultValue: '200'
      };

      const mockResponse = {
        success: true,
        message: 'Parameter updated successfully',
        statusCode: 200
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.updateParameter('TEST_PROC', 1, payload).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.put).toHaveBeenCalledWith(
            jasmine.any(String),
            payload
          );
          done();
        }
      });
    });

  });

  describe('deleteParameter', () => {
    it('should delete parameter successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Parameter deleted successfully',
        statusCode: 200
      };

      mockApiService.delete.and.returnValue(of(mockResponse));

      service.deleteParameter('TEST_PROC', 1).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.delete).toHaveBeenCalled();
          done();
        }
      });
    });


    it('should call correct API endpoint', (done) => {
      const mockResponse = { success: true };
      mockApiService.delete.and.returnValue(of(mockResponse));

      service.deleteParameter('PROC123', 5).subscribe({
        next: () => {
          expect(mockApiService.delete).toHaveBeenCalled();
          const apiCall = mockApiService.delete.calls.mostRecent();
          expect(apiCall.args[0]).toContain('PROC123');
          expect(apiCall.args[0]).toContain('5');
          done();
        }
      });
    });
  });

  describe('batchUpdateParameters', () => {
    it('should batch update parameters successfully', (done) => {
      const parameters: UpdateParameterDefinitionDto[] = [
        {
          procCode: 'TEST_PROC',
          parmNo: 1,
          parmCode: 'PARAM1',
          parmType: 'CHAR',
          refTable: 'TABLE1',
          refColumn: 'COL1',
          defaultValue: 'val1'
        },
        {
          procCode: 'TEST_PROC',
          parmNo: 2,
          parmCode: 'PARAM2',
          parmType: 'NUM',
          refTable: 'TABLE2',
          refColumn: 'COL2',
          defaultValue: '100'
        }
      ];

      const mockResponse = {
        success: true,
        message: 'Parameters updated successfully',
        statusCode: 200
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.batchUpdateParameters('TEST_PROC', parameters).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.put).toHaveBeenCalledWith(
            jasmine.any(String),
            parameters
          );
          done();
        }
      });
    });


    it('should handle empty parameters array', (done) => {
      const mockResponse = { success: true };
      mockApiService.put.and.returnValue(of(mockResponse));

      service.batchUpdateParameters('TEST_PROC', []).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.put).toHaveBeenCalledWith(
            jasmine.any(String),
            []
          );
          done();
        }
      });
    });
  });
});
