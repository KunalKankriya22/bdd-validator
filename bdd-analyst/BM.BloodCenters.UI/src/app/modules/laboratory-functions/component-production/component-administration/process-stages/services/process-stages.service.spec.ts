import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProcessStagesService } from './process-stages.service';
import { ApiService } from '@shared/services/api.service';
import {
  ProcessStageDto,
  DropdownDto,
  CreateProcessStageRequestDto,
  UpdateProcessStageRequestDto,
  ApiResponse,
} from '../models/process-stages.model';

describe('ProcessStagesService', () => {
  let service: ProcessStagesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProcessStages: ProcessStageDto[] = [
    {
      processCode: 'PROC1',
      stageCode: 'ST1',
      stageSequence: 1,
      effDate: '15-Jan-2024',
      termDate: null,
      insertDate: '01-Jan-2024',
      insertUser: 'ADMIN',
      auditKey: 123456,
    },
    {
      processCode: 'PROC1',
      stageCode: 'ST2',
      stageSequence: 2,
      effDate: '15-Jan-2024',
      termDate: null,
      insertDate: '01-Jan-2024',
      insertUser: 'ADMIN',
      auditKey: 123457,
    },
  ];

  const mockProcessCodes: DropdownDto[] = [
    { code: 'PROC1', description: 'Process Type 1' },
    { code: 'PROC2', description: 'Process Type 2' },
  ];

  const mockStageCodes: DropdownDto[] = [
    { code: 'ST1', description: 'Stage 1' },
    { code: 'ST2', description: 'Stage 2' },
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ProcessStagesService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(ProcessStagesService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getProcessStages', () => {
    it('should return process stages with total count', (done) => {
      const mockResponse = {
        success: true,
        data: mockProcessStages,
        total: 2,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getProcessStages().subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockProcessStages);
          expect(result.totalRecords).toBe(2);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        },
      });
    });


    it('should pass query parameters correctly', (done) => {
      const params = {
        searchKeyword: 'test',
        sortColumn: 'processCode',
        sortOrder: 'ASC',
        processCode: 'PROC1',
      };

      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getProcessStages(params).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[1]).toEqual({
            searchKeyword: 'test',
            sortColumn: 'processCode',
            sortOrder: 'ASC',
            processCode: 'PROC1',
            stageCode: null,
          });
          done();
        },
      });
    });

  });

  describe('getProcessStageById', () => {
    it('should return a single process stage', (done) => {
      const mockResponse: ApiResponse = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: mockProcessStages[0],
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessStageById('PROC1', 'ST1').subscribe({
        next: (result) => {
          expect(result).toEqual(mockProcessStages[0]);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

  });

  describe('getProcessCodes', () => {
    it('should return process codes for dropdown', (done) => {
      const mockResponse = {
        success: true,
        data: mockProcessCodes,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockProcessCodes);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle empty dropdown response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getStageCodes', () => {
    it('should return stage codes for dropdown', (done) => {
      const mockResponse = {
        success: true,
        data: mockStageCodes,
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getStageCodes().subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockStageCodes);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('createProcessStage', () => {
    it('should create a new process stage via bulk upsert', (done) => {
      const createDto: CreateProcessStageRequestDto = {
        processCode: 'PROC1',
        stageCode: 'ST3',
        stageSequence: 3,
        effDate: '2024-01-15',
        termDate: null,
      };

      const mockResponse: ApiResponse = {
        success: true,
        message: 'Process stage created successfully',
        statusCode: 201,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createProcessStage(createDto).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toContain('bulk/upsert');
          expect(callArgs[1].records[0].auditKey).toBeNull();
          expect(callArgs[1].records[0].processCode).toBe('PROC1');
          done();
        },
      });
    });

    it('should handle validation errors on create', (done) => {
      const error = {
        error: {
          success: false,
          statusCode: 400,
          errorCode: '1207',
          message: 'Invalid process code',
        },
      };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      const createDto: CreateProcessStageRequestDto = {
        processCode: 'XXXXX',
        stageCode: 'ST1',
        effDate: '2024-01-15',
      };

      service.createProcessStage(createDto).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('updateProcessStage', () => {
    it('should update an existing process stage via bulk upsert', (done) => {
      const updateDto: UpdateProcessStageRequestDto = {
        stageSequence: 5,
        effDate: '2024-01-01',
        termDate: '2024-12-31',
      };

      const mockResponse: ApiResponse = {
        success: true,
        message: 'Process stage updated successfully',
        statusCode: 200,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.updateProcessStage('PROC1', 'ST1', updateDto).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toContain('bulk/upsert');
          expect(callArgs[1].records[0].processCode).toBe('PROC1');
          expect(callArgs[1].records[0].stageCode).toBe('ST1');
          done();
        },
      });
    });

    it('should handle not found on update', (done) => {
      const error = new Error('Process stage not found');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      const updateDto: UpdateProcessStageRequestDto = {
        effDate: '2024-01-01',
      };

      service.updateProcessStage('INVALID', 'INVALID', updateDto).subscribe({
        error: (err) => {
          expect(err).toEqual(error);
          done();
        },
      });
    });
  });

  describe('deleteProcessStage', () => {
    it('should delete a process stage', (done) => {
      const mockResponse: ApiResponse = {
        success: true,
        message: 'Record deleted successfully',
        statusCode: 200,
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteProcessStage('PROC1', 'ST1').subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Record deleted successfully');
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle not found on delete', (done) => {
      const mockResponse: ApiResponse = {
        success: false,
        message: 'Record not found or already deleted',
        statusCode: 404,
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteProcessStage('INVALID', 'INVALID').subscribe({
        next: (result) => {
          expect(result.success).toBeFalse();
          done();
        },
      });
    });
  });
});
