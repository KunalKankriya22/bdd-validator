import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DefineProcessService } from './define-process.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('DefineProcessService', () => {
  let service: DefineProcessService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DefineProcessService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(DefineProcessService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ── Source Process Endpoints ──────────────────────────────────────────────────

  describe('getSourceProcesses', () => {
    it('should POST params and map response data and total', (done) => {
      // Arrange
      const mockData = [{ processCode: 'P1' }];
      apiService.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: mockData, total: 1 }));

      // Act
      service.getSourceProcesses(10, 0, { processCode: 'P1' } as any).subscribe((result) => {
        // Assert
        expect(result.data).toEqual(mockData as any);
        expect(result.totalRecords).toBe(1);
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.EMF_SOURCE_PROCESSES(10, 0),
          { processCode: 'P1' }
        );
        done();
      });
    });

    it('should default to empty array and zero when data/total are null', (done) => {
      // Arrange
      apiService.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null, total: null }));

      // Act
      service.getSourceProcesses(10, 0).subscribe((result) => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });
  });

  describe('getSourceProcessById', () => {
    it('should GET by processCode and processSeq', (done) => {
      // Arrange
      const mockProcess = { processCode: 'P1', processSeq: 1 } as any;
      apiService.get.and.returnValue(of(mockProcess));

      // Act
      service.getSourceProcessById('P1', 1).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockProcess);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_BY_ID('P1', 1));
        done();
      });
    });
  });

  describe('getSourceProcessWithDetails', () => {
    it('should GET details by processCode and processSeq', (done) => {
      // Arrange
      const mockDto = { processCode: 'P1' } as any;
      apiService.get.and.returnValue(of(mockDto));

      // Act
      service.getSourceProcessWithDetails('P1', 1).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockDto);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_DETAILS('P1', 1));
        done();
      });
    });
  });

  describe('createSourceProcess', () => {
    it('should POST dto to create endpoint', (done) => {
      // Arrange
      const dto = { processCode: 'P1' } as any;
      const mockResponse = { success: true, message: 'Created', error: null, statusCode: 200, data: null, total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createSourceProcess(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_CREATE, dto);
        done();
      });
    });
  });

  describe('updateSourceProcess', () => {
    it('should PUT dto to update endpoint', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      const mockResponse = { success: true, message: 'Updated', error: null, statusCode: 200, data: null, total: 0 };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateSourceProcess('P1', 1, dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_UPDATE('P1', 1), dto);
        done();
      });
    });
  });

  describe('deleteSourceProcess', () => {
    it('should DELETE by processCode and processSeq', (done) => {
      // Arrange
      apiService.delete.and.returnValue(of(void 0));

      // Act
      service.deleteSourceProcess('P1', 1).subscribe(() => {
        // Assert
        expect(apiService.delete).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_SOURCE_PROCESS_DELETE('P1', 1));
        done();
      });
    });
  });

  // ── Target Process Endpoints ─────────────────────────────────────────────────

  describe('getTargetProcesses', () => {
    it('should POST params and map response data and total', (done) => {
      // Arrange
      const mockData = [{ processCode: 'P1', actionSeq: '1' }];
      apiService.post.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: mockData, total: 1 }));

      // Act
      service.getTargetProcesses(10, 0, { processCode: 'P1' } as any).subscribe((result) => {
        // Assert
        expect(result.data).toEqual(mockData as any);
        expect(result.totalRecords).toBe(1);
        done();
      });
    });
  });

  describe('getTargetProcessesBySource', () => {
    it('should GET target processes with query string params', (done) => {
      // Arrange
      const mockData = [{ processCode: 'P1' }];
      apiService.get.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: mockData, total: 1 }));

      // Act
      service.getTargetProcessesBySource('P1', 50, 10).subscribe((result) => {
        // Assert
        expect(result.data).toEqual(mockData as any);
        expect(result.totalRecords).toBe(1);
        const calledUrl = apiService.get.calls.mostRecent().args[0] as string;
        expect(calledUrl).toContain('take=50');
        expect(calledUrl).toContain('skip=10');
        done();
      });
    });

    it('should use default take=100 and skip=0', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', error: null, statusCode: 200, data: null, total: 0 }));

      // Act
      service.getTargetProcessesBySource('P1').subscribe(() => {
        // Assert
        const calledUrl = apiService.get.calls.mostRecent().args[0] as string;
        expect(calledUrl).toContain('take=100');
        expect(calledUrl).toContain('skip=0');
        done();
      });
    });
  });

  describe('getTargetProcessById', () => {
    it('should GET by processCode and actionSeq', (done) => {
      // Arrange
      const mockDto = { processCode: 'P1', actionSeq: '1' } as any;
      apiService.get.and.returnValue(of(mockDto));

      // Act
      service.getTargetProcessById('P1', '1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockDto);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_BY_ID('P1', '1'));
        done();
      });
    });
  });

  describe('createTargetProcess', () => {
    it('should POST dto to create endpoint', (done) => {
      // Arrange
      const dto = { processCode: 'P1' } as any;
      const mockResponse = { success: true, message: 'Created', error: null, statusCode: 200, data: null, total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createTargetProcess(dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_CREATE, dto);
        done();
      });
    });
  });

  describe('updateTargetProcess', () => {
    it('should PUT dto to update endpoint', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      const mockResponse = { success: true, message: 'Updated', error: null, statusCode: 200, data: null, total: 0 };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateTargetProcess('P1', '1', dto).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_UPDATE('P1', '1'), dto);
        done();
      });
    });
  });

  describe('deleteTargetProcess', () => {
    it('should DELETE by processCode and actionSeq', (done) => {
      // Arrange
      apiService.delete.and.returnValue(of(void 0));

      // Act
      service.deleteTargetProcess('P1', '1').subscribe(() => {
        // Assert
        expect(apiService.delete).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_DELETE('P1', '1'));
        done();
      });
    });
  });

  describe('getNextTargetSequence', () => {
    it('should GET and extract nextSequence from response', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ nextSequence: '005' }));

      // Act
      service.getNextTargetSequence('P1').subscribe((result) => {
        // Assert
        expect(result).toBe('005');
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_NEXT_SEQ('P1'));
        done();
      });
    });
  });

  // ── SQL Generation Endpoints ─────────────────────────────────────────────────

  describe('generateSql', () => {
    it('should POST empty body to generate SQL endpoint', (done) => {
      // Arrange
      const mockResponse = { success: true, message: 'Generated', statusCode: 200 };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.generateSql('P1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_GENERATE_SQL('P1'), {});
        done();
      });
    });
  });

  describe('viewSql', () => {
    it('should GET and extract data array from SqlViewResponse', (done) => {
      // Arrange
      const mockStatements = [{ processCode: 'P1', processSeq: 1, lookingFor: 'X', sqlStmt: 'SELECT 1' }];
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockStatements, total: 1, errorResponse: null }));

      // Act
      service.viewSql('P1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockStatements);
        expect(apiService.get).toHaveBeenCalledWith(API.APPLICATION_ADMIN.EMF_TARGET_PROCESS_VIEW_SQL('P1'));
        done();
      });
    });

    it('should return empty array when data is null', (done) => {
      // Arrange
      apiService.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null, total: 0, errorResponse: null }));

      // Act
      service.viewSql('P1').subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });
  });
});
