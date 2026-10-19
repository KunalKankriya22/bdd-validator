import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { ProcessMappingService } from './process-mapping.service';
import {
  ProcessMappingDto,
  CreateProcessMappingDto,
  UpdateProcessMappingDto,
  ProcessMappingQueryDto
} from '../interfaces/process-mapping.interface';

describe('ProcessMappingService', () => {
  let service: ProcessMappingService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockMapping: ProcessMappingDto = {
    processCode: 'TEST_PROC',
    mappingName: 'TEST_MAPPING',
    dataTableName: 'TEST_TABLE',
    dataColumnName: 'TEST_COLUMN'
  };

  const mockMappings: ProcessMappingDto[] = [
    mockMapping,
    {
      processCode: 'TEST_PROC',
      mappingName: 'MAPPING2',
      dataTableName: 'TABLE2',
      dataColumnName: 'COLUMN2'
    }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ProcessMappingService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ProcessMappingService);
  });

  describe('getMappings', () => {
    it('should fetch mappings successfully', (done) => {
      const query: ProcessMappingQueryDto = { processCode: 'TEST_PROC' };
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockMappings,
        total: 2
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMappings(10, 0, query).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockMappings);
          expect(result.totalRecords).toBe(2);
          expect(mockApiService.post).toHaveBeenCalled();
          done();
        }
      });
    });




    it('should pass correct pagination parameters', (done) => {
      const query: ProcessMappingQueryDto = { processCode: 'TEST_PROC' };
      const mockResponse = {
        success: true,
        data: [],
        total: 0,
        error: null,
        message: '',
        statusCode: 200
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getMappings(25, 50, query).subscribe({
        next: () => {
          const apiCall = mockApiService.post.calls.mostRecent();
          expect(apiCall.args[0]).toContain('25');
          expect(apiCall.args[0]).toContain('50');
          done();
        }
      });
    });
  });

  describe('getMappingById', () => {
    it('should fetch single mapping successfully from array response', (done) => {
      const mockResponse = {
        data: [mockMapping]
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getMappingById('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (result) => {
          expect(result).toEqual(mockMapping);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should fetch single mapping from object response', (done) => {
      const mockResponse = {
        data: mockMapping
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getMappingById('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (result) => {
          expect(result).toEqual(mockMapping);
          done();
        }
      });
    });

    it('should throw error when mapping not found', (done) => {
      const mockResponse = {
        data: null
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getMappingById('TEST_PROC', 'NONEXISTENT').subscribe({
        error: (err) => {
          expect(err.message).toBe('Mapping not found');
          done();
        }
      });
    });

  });

  describe('createMapping', () => {
    it('should create mapping successfully', (done) => {
      const payload: CreateProcessMappingDto = {
        processCode: 'NEW_PROC',
        mappingName: 'NEW_MAPPING',
        dataTableName: 'NEW_TABLE',
        dataColumnName: 'NEW_COLUMN'
      };

      const mockResponse = {
        success: true,
        message: 'Mapping created successfully',
        statusCode: 201
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.createMapping(payload).subscribe({
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

  describe('updateMapping', () => {
    it('should update mapping successfully', (done) => {
      const payload: UpdateProcessMappingDto = {
        processCode: 'TEST_PROC',
        mappingName: 'TEST_MAPPING',
        dataTableName: 'UPDATED_TABLE',
        dataColumnName: 'UPDATED_COLUMN'
      };

      const mockResponse = {
        success: true,
        message: 'Mapping updated successfully',
        statusCode: 200
      };

      mockApiService.put.and.returnValue(of(mockResponse));

      service.updateMapping('TEST_PROC', 'TEST_MAPPING', payload).subscribe({
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

  describe('deleteMapping', () => {
    it('should delete mapping successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Mapping deleted successfully',
        statusCode: 200
      };

      mockApiService.delete.and.returnValue(of(mockResponse));

      service.deleteMapping('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(mockApiService.delete).toHaveBeenCalled();
          done();
        }
      });
    });

  });

  describe('checkDuplicateMappingName', () => {
    it('should return false when editing same name', (done) => {
      service.checkDuplicateMappingName('TEST_PROC', 'TEST_MAPPING', 'TEST_MAPPING').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(false);
          expect(mockApiService.post).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return false when editing same name with different case', (done) => {
      service.checkDuplicateMappingName('TEST_PROC', 'test_mapping', 'TEST_MAPPING').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(false);
          done();
        }
      });
    });

    it('should return true when duplicate found', (done) => {
      const mockResponse = {
        success: true,
        data: [mockMapping],
        total: 1,
        error: null,
        message: '',
        statusCode: 200
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.checkDuplicateMappingName('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(true);
          done();
        }
      });
    });

    it('should return false when no duplicate found', (done) => {
      const mockResponse = {
        success: true,
        data: [],
        total: 0,
        error: null,
        message: '',
        statusCode: 200
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.checkDuplicateMappingName('TEST_PROC', 'UNIQUE_NAME').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(false);
          done();
        }
      });
    });

    it('should handle errors and return false', (done) => {
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.checkDuplicateMappingName('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(false);
          done();
        }
      });
    });

    it('should perform case-insensitive duplicate check', (done) => {
      const mockResponse = {
        success: true,
        data: [{ ...mockMapping, mappingName: 'test_mapping' }],
        total: 1,
        error: null,
        message: '',
        statusCode: 200
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.checkDuplicateMappingName('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (isDuplicate) => {
          expect(isDuplicate).toBe(true);
          done();
        }
      });
    });
  });

  describe('checkMappingInUse', () => {
    it('should return true when mapping is in use', (done) => {
      const mockResponse = {
        data: { inUse: true }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.checkMappingInUse('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (inUse) => {
          expect(inUse).toBe(true);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return false when mapping is not in use', (done) => {
      const mockResponse = {
        data: { inUse: false }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.checkMappingInUse('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (inUse) => {
          expect(inUse).toBe(false);
          done();
        }
      });
    });

    it('should return false when data is null', (done) => {
      const mockResponse = {
        data: null
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.checkMappingInUse('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (inUse) => {
          expect(inUse).toBe(false);
          done();
        }
      });
    });

    it('should handle errors and return false', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.checkMappingInUse('TEST_PROC', 'TEST_MAPPING').subscribe({
        next: (inUse) => {
          expect(inUse).toBe(false);
          done();
        }
      });
    });
  });
});
